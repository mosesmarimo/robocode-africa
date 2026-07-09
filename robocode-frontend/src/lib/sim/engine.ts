"use client";

import type { Diagram } from "@/lib/domain/diagram";
import type { BoardDef, BoardProfile } from "@/lib/domain/boards";
import { UNO_PROFILE } from "@/lib/domain/boards";
import { COMPONENT_BY_ID } from "@/lib/domain/components";
import { resolveNetlist, isPowerPin, isSupplyPin, type ResolvedNet } from "@/lib/sim/netlist";
import { Machine } from "@/lib/sim/machine";
import { Interpreter, SimError, type SimYield } from "@/lib/sim/interpreter";
import { getPinInfo, getPartEl } from "@/lib/studio/pin-registry";
import { Rp2040Engine } from "./rp2040-engine";
import { ToneMixer } from "./audio";

/** Board-aware element-pin -> GPIO-label normalizer (aliases first, then D-prefix strip). */
const makePinNormalizer = (board: BoardDef) => (p: string): string =>
  board.pinAliases?.[p] ?? (/^D\d+$/.test(p) ? p.slice(1) : p);

export type EngineCallbacks = {
  onSerial: (line: string) => void;
  onError: (msg: string) => void;
  onStop: () => void;
};

export interface SimEngine {
  // lifecycle
  start(): boolean; // true = started, false = build/parse failure
  stop(): void;

  // interactive input state — mutated directly by sim-overlay.tsx (raw 0–1023 UI values)
  potValues: Record<string, number>;
  analogInputs: Record<string, number>;
  distances: Record<string, number>;
  pressed: Record<string, boolean>;
}

/**
 * Shared teardown visual reset: zero out the well-known transient element properties
 * (LED value/brightness, buzzer hasSignal) so a stopped sim doesn't leave a part looking
 * "live" on the canvas. Used by both InterpreterEngine.stop() (Uno/ESP32) and
 * Rp2040Engine.teardown() (Pico) — a `function` declaration (not `const`) so it's fully
 * hoisted and safe to import from rp2040-engine.ts despite the circular module reference
 * (engine.ts imports the Rp2040Engine class; rp2040-engine.ts imports this function back).
 */
export function resetPartVisual(partId: string): void {
  const el = getPartEl(partId) as (HTMLElement & Record<string, unknown>) | undefined;
  if (!el) return;
  try {
    el.value = false;
    el.brightness = 0;
    el.hasSignal = false;
  } catch {}
}

export class SimUnsupportedEngineError extends Error {
  constructor(public boardId: string) {
    super(`Simulation for board "${boardId}" is not available yet.`);
    this.name = "SimUnsupportedEngineError";
  }
}

export class InterpreterEngine implements SimEngine {
  machine!: Machine;
  private interp?: Interpreter;
  private gen?: Generator<SimYield, void>;
  private net: ResolvedNet;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private tone = new ToneMixer();

  // interactive input state
  potValues: Record<string, number> = {};
  pressed: Record<string, boolean> = {};
  distances: Record<string, number> = {};
  analogInputs: Record<string, number> = {}; // generic 0..1023 for ldr/temp/etc.

  private profile: BoardProfile;
  private normPin: (p: string) => string;

  constructor(private board: BoardDef, private diagram: Diagram, private code: string, private cb: EngineCallbacks) {
    this.profile = board.profile ?? UNO_PROFILE;
    this.normPin = makePinNormalizer(board);
    this.net = resolveNetlist(diagram);
  }

  private boardPinFor(partId: string, pinName: string) {
    return this.net.boardPinOf(`${partId}:${pinName}`);
  }

  /**
   * A button/switch is active-high when any of its pins' net touches a positive supply rail
   * (e.g. one leg -> 5V/3V3, the other -> a digital pin configured INPUT_PULLDOWN). Absent
   * that, it's assumed pull-up wiring (leg -> GND), the historical default: released = high,
   * pressed = low.
   */
  private isActiveHigh(partId: string, pins: string[]): boolean {
    for (const name of pins) {
      for (const bp of this.net.netBoardPins(`${partId}:${name}`)) {
        if (isSupplyPin(bp)) return true;
      }
    }
    return false;
  }

  private setupInputs() {
    const m = this.machine;
    const adcMax = (2 ** this.profile.adcBits) - 1;
    const scale = (raw: number) => Math.round((raw * adcMax) / 1023);
    for (const part of this.diagram.parts) {
      const def = COMPONENT_BY_ID[part.type];
      if (!def) continue;
      const pins = getPinInfo(part.id).map((p) => p.name);
      const mapped = pins.map((name) => ({ name, board: this.boardPinFor(part.id, name) })).filter((x) => x.board);

      if (def.simRole === "potentiometer" || def.simRole === "ldr") {
        const analog = mapped.find((x) => /^A\d/.test(x.board!));
        const target = analog ?? mapped.find((x) => !isPowerPin(x.board!));
        if (target) m.analogSources[this.normPin(target.board!)] = () => scale(this.potValues[part.id] ?? 512);
      } else if (def.simRole === "pushbutton" || def.simRole === "switch") {
        const sig = mapped.find((x) => !isPowerPin(x.board!));
        if (sig) {
          const id = part.id;
          const activeHigh = this.isActiveHigh(id, pins);
          m.digitalSources[this.normPin(sig.board!)] = () =>
            this.pressed[id] ? (activeHigh ? 1 : 0) : (activeHigh ? 0 : 1);
        }
      } else if (def.simRole === "ultrasonic") {
        const echo = mapped.find((x) => /echo/i.test(x.name));
        if (echo?.board) m.pulseProviders[this.normPin(echo.board)] = () => (this.distances[part.id] ?? 50) * 58;
      } else if (["ntc", "dht", "gas", "flame", "sound", "pir"].includes(def.simRole)) {
        const sig = mapped.find((x) => !isPowerPin(x.board!));
        if (sig) {
          if (def.simRole === "pir") m.digitalSources[this.normPin(sig.board!)] = () => (this.pressed[part.id] ? 1 : 0);
          else m.analogSources[this.normPin(sig.board!)] = () => scale(this.analogInputs[part.id] ?? 400);
        }
      }
    }
  }

  start() {
    this.machine = new Machine(this.profile);
    try {
      this.interp = new Interpreter(this.code, this.machine, this.profile, this.board.name);
    } catch (e) {
      const err = e as SimError;
      this.cb.onError(`⛔ ${err.message}${err.line ? ` (line ${err.line})` : ""}`);
      this.cb.onStop();
      return false;
    }
    this.machine.onSerial = this.cb.onSerial;
    this.setupInputs();
    this.gen = this.interp.run();
    this.stopped = false;
    this.pump();
    return true;
  }

  stop() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.tone.close();
    // reset visuals
    for (const part of this.diagram.parts) resetPartVisual(part.id);
  }

  private pump = () => {
    if (this.stopped || !this.gen) return;
    const start = performance.now();
    try {
      let res = this.gen.next();
      while (!res.done) {
        const y = res.value;
        if (y.kind === "wait") {
          this.updateOutputs();
          const ms = Math.min(Math.max(y.ms, 0), 10000);
          this.timer = setTimeout(this.pump, ms);
          return;
        }
        if (performance.now() - start > 8) {
          this.updateOutputs();
          this.timer = setTimeout(this.pump, 0);
          return;
        }
        res = this.gen.next();
      }
      this.updateOutputs();
    } catch (e) {
      const err = e as SimError;
      this.cb.onError(`⛔ Runtime error: ${err.message}`);
      this.stop();
      this.cb.onStop();
    }
  };

  // -------- output visuals --------
  private updateOutputs() {
    const m = this.machine;
    // board built-in LED (property name varies per board: uno led13, esp32 led1, pico ledBuiltIn)
    const mcu = getPartEl("mcu") as (HTMLElement & Record<string, unknown>) | undefined;
    const prop = this.board.builtinLedProp ?? "led13";
    if (mcu) try { (mcu as Record<string, unknown>)[prop] = (m.digital[this.profile.ledBuiltin] ?? 0) > 0; } catch {}

    let displayIdx = 0;
    let npIdx = 0;
    for (const part of this.diagram.parts) {
      const def = COMPONENT_BY_ID[part.type];
      if (!def) continue;
      const el = getPartEl(part.id) as (HTMLElement & Record<string, unknown>) | undefined;
      if (!el) continue;
      const pins = getPinInfo(part.id).map((p) => p.name);
      const controlBoard = () => {
        for (const name of pins) {
          const b = this.boardPinFor(part.id, name);
          if (b && !isPowerPin(b)) return this.normPin(b);
        }
        return null;
      };

      switch (def.simRole) {
        case "led": {
          const b = controlBoard();
          const v = b ? m.pwm[b] ?? 0 : 0;
          try { el.value = v > 0; el.brightness = Math.max(0, Math.min(1, v / 255)); } catch {}
          break;
        }
        case "7seg": {
          const segs = ["A", "B", "C", "D", "E", "F", "G", "DP"];
          const values = segs.map((s) => {
            const b = this.boardPinFor(part.id, s);
            return b && !isPowerPin(b) ? (m.digital[this.normPin(b)] ?? 0) : 0;
          });
          try { el.values = values; } catch {}
          break;
        }
        case "ledbar": {
          const values: number[] = [];
          for (let i = 1; i <= 10; i++) {
            const b = this.boardPinFor(part.id, `A${i}`);
            values.push(b && !isPowerPin(b) ? (m.digital[this.normPin(b)] ?? 0) : 0);
          }
          try { el.values = values; } catch {}
          break;
        }
        case "neopixel": {
          const strip = m.neopixels[npIdx++];
          const px = strip?.pixels?.[0];
          if (px) {
            try { el.r = px.r; el.g = px.g; el.b = px.b; } catch {}
          } else {
            const b = controlBoard();
            const v = b ? m.pwm[b] ?? 0 : 0;
            try { el.value = v > 0; } catch {}
          }
          break;
        }
        case "buzzer": {
          const b = controlBoard();
          const freq = b ? (m.tones[b] || (m.digital[b] ? 880 : 0)) : 0;
          try { el.hasSignal = freq > 0; } catch {}
          this.tone.setTone(part.id, freq);
          break;
        }
        case "servo": {
          const b = controlBoard();
          const angle = b ? m.servoAngle[b] ?? 0 : 0;
          try { el.angle = angle; } catch {}
          break;
        }
        case "relay": {
          const b = controlBoard();
          try { el.value = b ? (m.digital[b] ?? 0) > 0 : false; } catch {}
          break;
        }
        case "lcd":
        case "oled": {
          const disp = m.displays[displayIdx++];
          if (disp) {
            const cols = disp.cols || 16;
            const rows = disp.rows || 2;
            let s = "";
            for (let r = 0; r < rows; r++) s += String(disp.lines[r] ?? "").padEnd(cols).slice(0, cols);
            try { el.text = s; el.backlight = true; } catch {}
          }
          break;
        }
        case "rgb": {
          const chan = (match: RegExp) => {
            for (const name of pins) {
              if (match.test(name)) {
                const b = this.boardPinFor(part.id, name);
                if (b && !isPowerPin(b)) return m.pwm[this.normPin(b)] ?? 0;
              }
            }
            return 0;
          };
          try { el.ledRed = chan(/^R|red/i); el.ledGreen = chan(/^G|green/i); el.ledBlue = chan(/^B|blue/i); } catch {}
          break;
        }
      }
    }
  }
}

export function createEngine(
  board: BoardDef,
  diagram: Diagram,
  code: string,
  callbacks: EngineCallbacks,
): SimEngine {
  switch (board.mcuTarget) {
    case "avr8js": // Arduino UNO — InterpreterEngine + Uno profile
    case "esp32": // ESP32 DevKit — same interpreter + ESP32 profile
      return new InterpreterEngine(board, diagram, code, callbacks);
    case "rp2040js": // Spec B1 — Pico real MicroPython firmware via rp2040js in a Web Worker
      return new Rp2040Engine(board, diagram, code, callbacks);
    default: // defensive: any future mcuTarget string not yet wired
      throw new SimUnsupportedEngineError(board.id);
  }
}
