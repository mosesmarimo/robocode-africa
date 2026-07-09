"use client";

import type { Diagram, DiagramPart } from "@/lib/domain/diagram";
import type { BoardDef } from "@/lib/domain/boards";
import { COMPONENT_BY_ID, DEFAULT_I2C_ADDRESS, type ComponentDef } from "@/lib/domain/components";
import { resolveNetlist, isPowerPin, isSupplyPin, type ResolvedNet } from "@/lib/sim/netlist";
import { getPinInfo, getPartEl } from "@/lib/studio/pin-registry";
import { resetPartVisual, type EngineCallbacks, type SimEngine } from "./engine";
import { ToneMixer } from "./audio";
import type { Rp2040InMessage, Rp2040OutMessage, DisplaySpec, NeopixelSpec } from "./rp2040-protocol";

/** Board analog pins GPIO 26->ch0, 27->ch1, 28->ch2, 29->ch3 (A0-A3). */
const adcChannelFor = (gpio: number): number | null =>
  gpio >= 26 && gpio <= 29 ? gpio - 26 : null;

// RP2040 hardware I2C controller pinout: each controller (I2C0/I2C1) can only be routed to
// one of a fixed set of SDA GPIOs (SCL is always SDA+1). Used to resolve which bus a display
// part's SDA/DATA wire actually lands on, so two displays wired to DIFFERENT buses at the
// SAME address don't collide (only same-bus, same-address wiring is a real conflict).
const I2C0_SDA_GPIOS = new Set([0, 4, 8, 12, 16, 20]);
const I2C1_SDA_GPIOS = new Set([2, 6, 10, 14, 18, 26]);

/** Resolve a GPIO number to its hardware I2C bus index, or null if it's not a valid SDA pin. */
const busForSdaGpio = (gpio: number): 0 | 1 | null => {
  if (I2C0_SDA_GPIOS.has(gpio)) return 0;
  if (I2C1_SDA_GPIOS.has(gpio)) return 1;
  return null;
};

export class Rp2040Engine implements SimEngine {
  // NOTE: on the real Nano RP2040 Connect the onboard LED is GP6 (D13). The board is
    // presented as a "Pico" and the starter blinks Pin(25), so we keep GP25 here so the
    // starter's built-in-LED demo lights the canvas indicator. (Flagged for product review.)
    private static readonly LED_BUILTIN = 25;
  private static readonly ADC_FULL = 4095;

  // interactive input state (mutated by sim-overlay.tsx)
  potValues: Record<string, number> = {};
  pressed: Record<string, boolean> = {};
  distances: Record<string, number> = {}; // ultrasonic bag — intentionally unwired in B1 (no-op)
  analogInputs: Record<string, number> = {};
  // note: no `machine` member — SimEngine no longer declares one (Rp2040Engine has no
  // Machine-shaped state; InterpreterEngine's concrete `machine` field is Uno/ESP32-only)

  private net: ResolvedNet;
  private worker: Worker | null = null;
  private stopped = false;
  private inputTimer: ReturnType<typeof setInterval> | null = null;

  // mirrors (replace Machine)
  private gpioOut: Record<number, boolean> = {};
  private pwmDuty: Record<number, number> = {};
  private pwmFreq: Record<number, number> = {};
  // Built once per "display" message (not per render tick) — see the "display" case in
  // the worker onmessage handler below.
  private displayState = new Map<
    string,
    { kind: "lcd"; text: string } | { kind: "oled"; imageData: ImageData; displayOn: boolean }
  >();
  // flat RGB-packed (display order) [r0,g0,b0, ...], 0..255, keyed by partId
  private neopixelState = new Map<string, number[]>();

  // last-sent input snapshot (change-only forwarding) — a cheap concatenated string key,
  // not JSON.stringify (this is rebuilt every 80ms tick — see startInputForwarding).
  private lastInput = "";

  // Per-part input wiring, resolved once getPinInfo(part.id) has pins (i.e. once the
  // @wokwi/elements part has actually mounted) and cached forever after: gpio/ch/role/
  // activeHigh are all derived purely from the static diagram netlist, so none of them
  // can change mid-run. Avoids re-deriving pin names + controlGpio + isActiveHigh on
  // every 80ms input-forwarding tick for the lifetime of the run.
  private inputMapCache = new Map<
    string,
    { gpio: number | null; ch: number | null; role: string; activeHigh: boolean }
  >();

  // buzzer tone oscillators (shared with InterpreterEngine — see ./audio)
  private tone = new ToneMixer();

  constructor(
    private board: BoardDef,
    private diagram: Diagram,
    private code: string,
    private cb: EngineCallbacks,
  ) {
    this.net = resolveNetlist(diagram);
  }

  private boardPinFor(partId: string, pinName: string) {
    return this.net.boardPinOf(`${partId}:${pinName}`);
  }

  /** Resolve pin label to GPIO number using board pinAliases, then fallback to GP/bare number regex. */
  private normGpio(p: string): number | null {
    const ali = this.board.pinAliases?.[p];
    const s = ali ?? p;
    const m = /^GP?(\d+)$/.exec(s) ?? /^(\d+)$/.exec(s);
    return m ? Number(m[1]) : null;
  }

  /** First non-power control pin of a part, as a GPIO number. */
  private controlGpio(partId: string, pins: string[]): number | null {
    for (const name of pins) {
      const b = this.boardPinFor(partId, name);
      if (b && !isPowerPin(b)) {
        const g = this.normGpio(b);
        if (g !== null) return g;
      }
    }
    return null;
  }

  /**
   * A button/switch is active-high when any of its pins' net touches a positive supply rail
   * (e.g. the standard PULL_DOWN wiring: one leg -> 3V3, the other -> a GPIO configured
   * Pin.PULL_DOWN). Absent that, it's assumed pull-up wiring (leg -> GND), the historical B1
   * default: released = high, pressed = low.
   */
  private isActiveHigh(partId: string, pins: string[]): boolean {
    for (const name of pins) {
      for (const bp of this.net.netBoardPins(`${partId}:${name}`)) {
        if (isSupplyPin(bp)) return true;
      }
    }
    return false;
  }

  start(): boolean {
    this.worker = new Worker(new URL("./rp2040.worker.ts", import.meta.url), { type: "module" });
    this.worker.onmessage = (ev: MessageEvent<Rp2040OutMessage>) => {
      if (this.stopped) return; // rapid Stop->Run race guard
      const msg = ev.data;
      switch (msg.type) {
        case "serial":
          this.cb.onSerial(msg.line);
          break;
        case "gpio":
          for (const [k, v] of Object.entries(msg.outputs)) this.gpioOut[Number(k)] = v;
          for (const [k, v] of Object.entries(msg.pwm)) this.pwmDuty[Number(k)] = v;
          for (const [k, v] of Object.entries(msg.pwmFreq)) this.pwmFreq[Number(k)] = v;
          this.updateOutputs();
          break;
        case "display":
          if (msg.kind === "oled") {
            // Build the ImageData ONCE per display message (not per render tick — every
            // "gpio"/"neopixel" message also calls updateOutputs(), which would otherwise
            // re-expand the same 1024-byte framebuffer into a fresh 128x64 ImageData many
            // times a second for no reason). ArrayBuffer (transferred over the wire) ->
            // Uint8Array first, page-major/LSB-per-page per the SSD1306 GDDRAM convention.
            const fb = new Uint8Array(msg.framebuffer);
            const img = new ImageData(128, 64);
            for (let y = 0; y < 64; y++) {
              for (let x = 0; x < 128; x++) {
                const lit = (fb[(y >> 3) * 128 + x] >> (y & 7)) & 1;
                const on = msg.displayOn ? (lit ^ (msg.inverse ? 1 : 0)) : 0;
                const i = (y * 128 + x) * 4;
                const v = on ? 255 : 0; // white-on-black lit; exact RGBA confirmed in Task 6
                img.data[i] = v;
                img.data[i + 1] = v;
                img.data[i + 2] = v;
                img.data[i + 3] = 255;
              }
            }
            this.displayState.set(msg.partId, { kind: "oled", imageData: img, displayOn: msg.displayOn });
          } else {
            this.displayState.set(msg.partId, { kind: "lcd", text: msg.text });
          }
          this.updateOutputs();
          break;
        case "neopixel":
          this.neopixelState.set(msg.partId, msg.pixels);
          this.updateOutputs();
          break;
        case "ready":
          // "Booting MicroPython..." is superseded by real serial output; nothing to surface.
          // Force the next 80ms input-forwarding tick to resend the current snapshot: the
          // worker's own pre-ready buffer (rp2040.worker.ts pendingInput) only replays the
          // LAST message sent before boot finished, but change-only forwarding here means we
          // may never re-send afterwards if the snapshot hasn't changed since. Clearing
          // lastInput guarantees one authoritative post once the chip is actually live.
          this.lastInput = "";
          break;
        case "error":
          this.cb.onError(msg.message);
          this.teardown();
          this.cb.onStop();
          break;
        case "stop":
          this.teardown();
          this.cb.onStop();
          break;
      }
    };
    this.worker.onerror = (e) => {
      if (this.stopped) return;
      this.cb.onError(e.message || "Pico worker crashed.");
      this.teardown();
      this.cb.onStop();
    };
    this.worker.onmessageerror = () => {
      if (this.stopped) return;
      this.cb.onError("Pico worker message error.");
      this.teardown();
      this.cb.onStop();
    };

    const init: Rp2040InMessage = {
      type: "init",
      uf2Url: "/sim/RPI_PICO-20241129-v1.24.1.uf2",
      bootromUrl: "/sim/rp2040-bootrom.bin",
      wasmUrl: "/sim/lfs_js.wasm",
      code: this.code,
      displays: this.buildDisplaySpecs(),
      neopixels: this.buildNeopixelSpecs(),
    };
    this.worker.postMessage(init);
    this.cb.onSerial("Booting MicroPython..."); // transient; superseded by real output on ready
    this.startInputForwarding();
    return true; // boot is async; failures surface later via error/stop
  }

  private buildDisplaySpecs(): DisplaySpec[] {
    const specs: DisplaySpec[] = [];
    for (const part of this.diagram.parts) {
      const role = COMPONENT_BY_ID[part.type]?.simRole;
      if (role !== "lcd" && role !== "oled") continue;
      const kind = role; // "lcd" | "oled"
      const raw = part.props?.address;
      let address = DEFAULT_I2C_ADDRESS[kind];
      if (typeof raw === "number" && Number.isFinite(raw)) address = raw;
      else if (typeof raw === "string") {
        // "0x"-prefixed -> hex; a run of plain digits -> decimal (e.g. the inspector's
        // placeholder-era values); anything else (bare hex like "3C", no "0x" prefix) ->
        // hex too. The OLD `startsWith("0x") ? 16 : 10` fallback mis-parsed bare hex: "3C"
        // isn't "0x"-prefixed so it fell to base 10, and parseInt("3C", 10) silently stops
        // at the first non-decimal-digit char and returns 3 — the wrong address entirely.
        const t = raw.trim();
        const parsed = parseInt(t, t.toLowerCase().startsWith("0x") ? 16 : /^[0-9]+$/.test(t) ? 10 : 16);
        if (Number.isFinite(parsed)) address = parsed; // malformed -> NaN -> keep default
      }
      const is20x4 = part.type === "lcd2004";

      // Resolve the display's SDA pin to a hardware I2C bus, so the worker can route it
      // to only that controller instead of both. Pin NAME differs by wokwi element: the
      // i2c-mode LCD1602/LCD2004 element names it "SDA"; the SSD1306 OLED element names
      // the same electrical signal "DATA" (its pinInfo carries an `i2c('SDA')` signal tag,
      // but the wire-lookup key is the literal pin name, "DATA", not "SDA").
      const sdaPinName = kind === "oled" ? "DATA" : "SDA";
      const sdaBoard = this.boardPinFor(part.id, sdaPinName);
      const sdaGpio = sdaBoard ? this.normGpio(sdaBoard) : null;
      const bus = sdaGpio !== null ? busForSdaGpio(sdaGpio) ?? undefined : undefined;

      specs.push({
        partId: part.id,
        kind,
        address,
        ...(kind === "lcd" ? { cols: is20x4 ? 20 : 16, rows: is20x4 ? 4 : 2 } : {}),
        ...(bus !== undefined ? { bus } : {}),
      });
    }
    return specs;
  }

  private buildNeopixelSpecs(): NeopixelSpec[] {
    const specs: NeopixelSpec[] = [];
    for (const part of this.diagram.parts) {
      const def = COMPONENT_BY_ID[part.type];
      if (def?.simRole !== "neopixel") continue;
      // Resolve DIN by NAME only (not controlGpio's "first non-power pin"):
      // both parts also expose a DOUT data pin, so match DIN explicitly and
      // skip the part if it does not resolve, rather than guessing a pin.
      const board = this.boardPinFor(part.id, "DIN");
      const din = board ? this.normGpio(board) : null;
      if (din === null) continue; // unresolvable DIN: skip the part, no listener
      const isRing = def.tag === "wokwi-led-ring";
      const rawCount = part.props?.pixels;
      const count = isRing
        ? (typeof rawCount === "number" && Number.isFinite(rawCount) ? rawCount : 16)
        : 1; // single wokwi-neopixel is always 1 regardless of any stray prop
      specs.push({ partId: part.id, din, count });
    }
    return specs;
  }

  /**
   * Resolve (and cache forever) a part's input wiring: control GPIO, ADC channel (if
   * any), sim role, and button/switch polarity. All four are derived purely from the
   * static diagram netlist via getPinInfo/controlGpio/isActiveHigh, so once resolved
   * they cannot change for the lifetime of the run. Returns an uncached, all-null
   * placeholder (never stored) if the part's pins haven't resolved yet — e.g. the
   * @wokwi/elements custom element hasn't mounted/measured on the very first ticks —
   * so the next tick retries instead of permanently caching a false negative.
   */
  private getInputMapping(part: DiagramPart, def: ComponentDef) {
    const cached = this.inputMapCache.get(part.id);
    if (cached) return cached;
    const pins = getPinInfo(part.id).map((p) => p.name);
    if (pins.length === 0) return { gpio: null, ch: null, role: def.simRole, activeHigh: false };
    const gpio = this.controlGpio(part.id, pins);
    const mapping = {
      gpio,
      ch: gpio !== null ? adcChannelFor(gpio) : null,
      role: def.simRole,
      activeHigh: this.isActiveHigh(part.id, pins),
    };
    this.inputMapCache.set(part.id, mapping);
    return mapping;
  }

  private startInputForwarding() {
    this.inputTimer = setInterval(() => {
      if (this.stopped || !this.worker) return;
      const gpioInputs: Record<number, boolean> = {};
      const adcValues: Record<number, number> = {};
      const scale = (raw: number) =>
        Math.round((Math.max(0, Math.min(1023, raw)) * Rp2040Engine.ADC_FULL) / 1023);
      // Cheap concatenated key (not JSON.stringify — this runs every 80ms for the whole
      // run): built in the same pass as gpioInputs/adcValues, so it's free to compute.
      // Diagram.parts iteration order is stable across ticks, so comparing this string
      // tick-to-tick is exactly as sound as comparing the two records would be.
      let key = "";

      for (const part of this.diagram.parts) {
        const def = COMPONENT_BY_ID[part.type];
        if (!def) continue;
        const m = this.getInputMapping(part, def);
        switch (m.role) {
          case "pushbutton":
          case "switch": {
            if (m.gpio !== null) {
              const v = m.activeHigh ? !!this.pressed[part.id] : !(this.pressed[part.id] ?? false);
              gpioInputs[m.gpio] = v;
              key += `g${m.gpio}:${v ? 1 : 0};`;
            }
            break;
          }
          case "pir": {
            if (m.gpio !== null) {
              const v = this.pressed[part.id] ?? false;
              gpioInputs[m.gpio] = v;
              key += `g${m.gpio}:${v ? 1 : 0};`;
            }
            break;
          }
          case "potentiometer":
          case "ldr":
          case "ntc":
          case "dht":
          case "gas":
          case "flame":
          case "sound": {
            if (m.gpio !== null && m.ch !== null) {
              const raw = m.role === "potentiometer" ? (this.potValues[part.id] ?? 512) : (this.analogInputs[part.id] ?? 400);
              const v = scale(raw);
              adcValues[m.ch] = v;
              key += `a${m.ch}:${v};`;
            }
            break;
          }
          // ultrasonic: intentionally unwired in B1 (distances bag is a no-op — see §5 / Out of scope)
        }
      }

      if (key === this.lastInput) return; // change-only
      this.lastInput = key;
      const msg: Rp2040InMessage = { type: "input", gpioInputs, adcValues };
      this.worker.postMessage(msg);
    }, 80);
  }

  private updateOutputs() {
    // built-in LED (hardcoded GP25). Drives the existing "mcu" element's LED property via
    // board.builtinLedProp (the same well-known canvas contract InterpreterEngine uses).
    const mcu = getPartEl("mcu") as (HTMLElement & Record<string, unknown>) | undefined;
    const ledProp = this.board.builtinLedProp ?? "led13";
    if (mcu) {
      try {
        mcu[ledProp] = this.gpioOut[Rp2040Engine.LED_BUILTIN] ?? false;
      } catch {}
    }

    for (const part of this.diagram.parts) {
      const def = COMPONENT_BY_ID[part.type];
      if (!def) continue;
      const el = getPartEl(part.id) as (HTMLElement & Record<string, unknown>) | undefined;
      if (!el) continue;
      const pins = getPinInfo(part.id).map((p) => p.name);
      const g = this.controlGpio(part.id, pins);
      const dutyOf = (gpio: number | null) =>
        gpio === null ? 0 : this.pwmDuty[gpio] ?? (this.gpioOut[gpio] ? 1 : 0);
      const levelOf = (gpio: number | null) => (gpio === null ? false : !!this.gpioOut[gpio]);

      switch (def.simRole) {
        case "led": {
          const duty = dutyOf(g); // already 0..1 — do NOT divide by 255 (that is InterpreterEngine's m.pwm/255)
          try {
            el.value = duty > 0;
            el.brightness = Math.max(0, Math.min(1, duty));
          } catch {}
          break;
        }
        case "relay": {
          try { el.value = levelOf(g); } catch {}
          break;
        }
        case "rgb": {
          const chan = (match: RegExp) => {
            for (const name of pins) {
              if (match.test(name)) {
                const b = this.boardPinFor(part.id, name);
                if (b && !isPowerPin(b)) {
                  const gp = this.normGpio(b);
                  if (gp !== null) return dutyOf(gp) * 255; // rescale 0..1 -> 0..255 (element expects 0..255)
                }
              }
            }
            return 0;
          };
          try {
            el.ledRed = chan(/^(R|RED)$/i);
            el.ledGreen = chan(/^(G|GREEN)$/i);
            el.ledBlue = chan(/^(B|BLUE)$/i);
          } catch {}
          break;
        }
        case "buzzer": {
          const active = dutyOf(g) > 0;
          try { el.hasSignal = active; } catch {}
          this.tone.setTone(part.id, active ? 880 : 0); // fixed audible tone on signal (B1; freq decode deferred)
          break;
        }
        case "servo": {
          // Real RC-servo angle needs the PULSE WIDTH, not the 0..1 duty fraction alone —
          // duty is period-relative, so the same duty means a different pulse width (and
          // thus a different angle) at a different PWM frequency. Only decode an angle
          // when the pin is in the standard RC-servo frequency band (40-400 Hz covers the
          // common 50 Hz analog-servo and faster digital-servo signals); outside that band
          // leave the angle unset rather than ship a misleading map (matches the prior B1
          // deferral for anything decodePwmFreq can't confidently attribute to a servo).
          const freq = g !== null ? this.pwmFreq[g] : undefined;
          if (g !== null && freq !== undefined && freq >= 40 && freq <= 400) {
            const duty = dutyOf(g);
            const pulseMs = duty * (1000 / freq);
            const angle = Math.max(0, Math.min(180, ((pulseMs - 0.5) / 2.0) * 180));
            try { el.angle = angle; } catch {}
          }
          break;
        }
        case "7seg": {
          const segs = ["A", "B", "C", "D", "E", "F", "G", "DP"];
          const values = segs.map((s) => {
            const b = this.boardPinFor(part.id, s);
            if (!b || isPowerPin(b)) return 0;
            const gp = this.normGpio(b);
            return gp !== null && this.gpioOut[gp] ? 1 : 0;
          });
          try { el.values = values; } catch {}
          break;
        }
        case "ledbar": {
          const values: number[] = [];
          for (let i = 1; i <= 10; i++) {
            const b = this.boardPinFor(part.id, `A${i}`);
            if (!b || isPowerPin(b)) { values.push(0); continue; }
            const gp = this.normGpio(b);
            values.push(gp !== null && this.gpioOut[gp] ? 1 : 0);
          }
          try { el.values = values; } catch {}
          break;
        }
        case "lcd": {
          const s = this.displayState.get(part.id);
          if (s?.kind === "lcd") {
            try {
              el.text = s.text; // LCD1602Element / LCD2004Element `set text(string)`
              el.backlight = true; // B2: backlight rendered on (decoder bit captured, not surfaced)
            } catch {}
          }
          break;
        }
        case "oled": {
          // ImageData(128,64) = the SSD1306 SCREEN size (NOT the 150x116 bezel) is now
          // built ONCE, in the "display" message handler above — a NEW ImageData
          // reference is only created when the framebuffer actually changes, not on
          // every render tick. Assigning it (even the same reference again) is cheap;
          // Lit's updated()->redraw() fires whenever the reference actually changed.
          const s = this.displayState.get(part.id);
          if (s?.kind === "oled") {
            try { el.imageData = s.imageData; } catch {}
          }
          break;
        }
        case "neopixel": {
          const pix = this.neopixelState.get(part.id);
          if (pix) {
            // Both parts share simRole "neopixel"; discriminate by tag.
            // `def` is already in scope (the switch is on def.simRole) and non-null.
            const isRing = def.tag === "wokwi-led-ring";
            // Elements expect 0..1 normalized channels (they *255 internally),
            // the OPPOSITE of the wokwi-rgb-led case above — scale /255 here.
            try {
              if (isRing) {
                // Clamp to the element's own pixel array so setPixel never over-runs.
                const ringPixels = Number((el as { pixels?: number }).pixels ?? 16);
                const n = Math.min(pix.length / 3, ringPixels);
                const setPixel = (el as unknown as {
                  setPixel: (i: number, c: { r: number; g: number; b: number }) => void;
                }).setPixel;
                for (let i = 0; i < n; i++) {
                  setPixel.call(el, i, {
                    r: pix[i * 3] / 255,
                    g: pix[i * 3 + 1] / 255,
                    b: pix[i * 3 + 2] / 255,
                  });
                }
              } else if (pix.length >= 3) {
                // single wokwi-neopixel: pixel 0 only. Guard against a short/empty pixels
                // array (e.g. a coalesced message that raced ahead of the decoder's first
                // full 3-byte triplet) — indexing past the end would set el.r/g/b to NaN.
                el.r = pix[0] / 255;
                el.g = pix[1] / 255;
                el.b = pix[2] / 255;
              }
            } catch {}
          }
          break;
        }
      }
    }
  }

  private teardown() {
    this.stopped = true;
    if (this.inputTimer) {
      clearInterval(this.inputTimer);
      this.inputTimer = null;
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    // silence all oscillators + release the AudioContext (see ./audio)
    this.tone.close();
    // reset visuals — same contract as InterpreterEngine.stop() (engine.ts) so a stopped
    // Pico sim doesn't leave an LED/buzzer looking "live" on the canvas.
    for (const part of this.diagram.parts) resetPartVisual(part.id);
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true; // set BEFORE terminate so late worker messages are dropped
    // No outbound "stop" postMessage here: teardown() terminate()s the worker directly, so
    // asking the worker to clean up first and post its own "stop" back is dead work — the
    // engine already ignores post-stop worker messages (onmessage guards on this.stopped),
    // and terminate() is unconditional regardless of whether the worker ever saw the message.
    this.teardown();
    this.cb.onStop();
  }
}
