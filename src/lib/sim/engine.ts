"use client";

import type { Diagram } from "@/lib/domain/diagram";
import { COMPONENT_BY_ID } from "@/lib/domain/components";
import { resolveNetlist, type ResolvedNet } from "@/lib/sim/netlist";
import { Machine } from "@/lib/sim/machine";
import { Interpreter, SimError, type SimYield } from "@/lib/sim/interpreter";
import { getPinInfo, getPartEl } from "@/lib/studio/pin-registry";

const isPower = (p: string) => /^(GND|5V|3V3|VIN|VCC|VDD|VSS)/i.test(p);
/** ESP32 element pins are "D2"/"D13"; Arduino code uses plain GPIO numbers. */
const normPin = (p: string) => (/^D\d+$/.test(p) ? p.slice(1) : p);

export type EngineCallbacks = {
  onSerial: (line: string) => void;
  onError: (msg: string) => void;
  onStop: () => void;
};

export class SimEngine {
  machine = new Machine();
  private interp?: Interpreter;
  private gen?: Generator<SimYield, void>;
  private net: ResolvedNet;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private audio?: AudioContext;
  private osc: Record<string, { o: OscillatorNode; g: GainNode }> = {};

  // interactive input state
  potValues: Record<string, number> = {};
  pressed: Record<string, boolean> = {};
  distances: Record<string, number> = {};
  analogInputs: Record<string, number> = {}; // generic 0..1023 for ldr/temp/etc.

  constructor(private diagram: Diagram, private code: string, private cb: EngineCallbacks) {
    this.net = resolveNetlist(diagram);
  }

  private boardPinFor(partId: string, pinName: string) {
    return this.net.boardPinOf(`${partId}:${pinName}`);
  }

  private setupInputs() {
    const m = this.machine;
    for (const part of this.diagram.parts) {
      const def = COMPONENT_BY_ID[part.type];
      if (!def) continue;
      const pins = getPinInfo(part.id).map((p) => p.name);
      const mapped = pins.map((name) => ({ name, board: this.boardPinFor(part.id, name) })).filter((x) => x.board);

      if (def.simRole === "potentiometer" || def.simRole === "ldr") {
        const analog = mapped.find((x) => /^A\d/.test(x.board!));
        const target = analog ?? mapped.find((x) => !isPower(x.board!));
        if (target) m.analogSources[normPin(target.board!)] = () => this.potValues[part.id] ?? 512;
      } else if (def.simRole === "pushbutton" || def.simRole === "switch") {
        const sig = mapped.find((x) => !isPower(x.board!));
        if (sig) m.digitalSources[normPin(sig.board!)] = () => (this.pressed[part.id] ? 0 : 1);
      } else if (def.simRole === "ultrasonic") {
        const echo = mapped.find((x) => /echo/i.test(x.name));
        if (echo?.board) m.pulseProviders[normPin(echo.board)] = () => (this.distances[part.id] ?? 50) * 58;
      } else if (["ntc", "dht", "gas", "flame", "sound", "pir"].includes(def.simRole)) {
        const sig = mapped.find((x) => !isPower(x.board!));
        if (sig) {
          if (def.simRole === "pir") m.digitalSources[normPin(sig.board!)] = () => (this.pressed[part.id] ? 1 : 0);
          else m.analogSources[normPin(sig.board!)] = () => this.analogInputs[part.id] ?? 400;
        }
      }
    }
  }

  start() {
    try {
      this.interp = new Interpreter(this.code, this.machine);
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
    for (const k of Object.keys(this.osc)) this.killOsc(k);
    // reset visuals
    for (const part of this.diagram.parts) this.resetVisual(part.id);
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
    // board built-in LED (pin 13)
    const mcu = getPartEl("mcu") as (HTMLElement & { led13?: boolean }) | undefined;
    if (mcu) try { mcu.led13 = (m.digital["13"] ?? 0) > 0; } catch {}

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
          if (b && !isPower(b)) return normPin(b);
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
            return b && !isPower(b) ? (m.digital[b] ?? 0) : 0;
          });
          try { el.values = values; } catch {}
          break;
        }
        case "ledbar": {
          const values: number[] = [];
          for (let i = 1; i <= 10; i++) {
            const b = this.boardPinFor(part.id, `A${i}`);
            values.push(b && !isPower(b) ? (m.digital[b] ?? 0) : 0);
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
          this.setTone(part.id, freq);
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
                if (b && !isPower(b)) return m.pwm[normPin(b)] ?? 0;
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

  private resetVisual(partId: string) {
    const el = getPartEl(partId) as (HTMLElement & Record<string, unknown>) | undefined;
    if (!el) return;
    try { el.value = false; el.brightness = 0; el.hasSignal = false; } catch {}
  }

  // -------- audio --------
  private ensureAudio() {
    if (!this.audio) this.audio = new AudioContext();
    return this.audio;
  }
  private setTone(partId: string, freq: number) {
    if (freq > 0) {
      const ctx = this.ensureAudio();
      let node = this.osc[partId];
      if (!node) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "square";
        g.gain.value = 0.04;
        o.connect(g).connect(ctx.destination);
        o.start();
        node = this.osc[partId] = { o, g };
      }
      node.o.frequency.value = freq;
      node.g.gain.value = 0.04;
    } else if (this.osc[partId]) {
      this.killOsc(partId);
    }
  }
  private killOsc(partId: string) {
    const node = this.osc[partId];
    if (node) {
      try { node.g.gain.value = 0; node.o.stop(); } catch {}
      delete this.osc[partId];
    }
  }
}
