// First Web Worker in the app. Wraps rp2040-boot.ts. NO "use client" (that is for
// React modules). The emulator logic here is proven by scripts/rp2040-smoke.ts.
import type { Rp2040InMessage, Rp2040OutMessage } from "./rp2040-protocol";
import { bootChip, loadBootromBytes, decodePwmDuty, decodePwmFreq, attachI2cDecoders, type BootedChip } from "./rp2040-boot";
import { Lcd1602Decoder, Ssd1306Decoder, type I2cDecoder } from "./i2c-devices";
import { GPIOPinState } from "rp2040js";
import { Ws2812Decoder } from "./neopixel-decoder";

const ctx = self as unknown as Worker;
const post = (m: Rp2040OutMessage, transfer?: Transferable[]) =>
  ctx.postMessage(m, transfer ?? []);

/** Fetch a binary asset and throw on a non-OK response, instead of letting a 404 HTML
 * error page get parsed as firmware bytes (which used to surface only as a misleading
 * "did not enumerate within 15s" timeout with no hint the fetch itself had failed). */
const fetchBin = async (url: string): Promise<ArrayBuffer> => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to load ${url} (HTTP ${r.status})`);
  return r.arrayBuffer();
};

let chip: BootedChip | null = null;
let halted = false;
// Buffers the most recent "input" message received while `chip` is still booting (the UF2
// boot can take several real seconds). The engine only re-sends on a CHANGE from its last
// snapshot (change-only forwarding), so without this buffer the very first pot/button state
// set before boot completes would be silently dropped for the rest of the run — the sim
// would never see it because nothing else triggers a resend. Applied once in onReady, then
// cleared so it can't leak into a later state.
let pendingInput: Extract<Rp2040InMessage, { type: "input" }> | null = null;
let removeListeners: Array<() => void> = [];
let coalescer: ReturnType<typeof setInterval> | null = null;
let readyTimeout: ReturnType<typeof setTimeout> | null = null;

const dirtyOut = new Map<number, boolean>();
const lastPwm = new Map<number, number>();
const lastPwmFreq = new Map<number, number>();

// I2C displays: populated in init() from msg.displays. The coalescer (defined inside
// init() before chip.start()) reads this module-level array after it is set, so the
// closure always sees the populated list.
let i2cDecoders: I2cDecoder[] = [];
let sawAnyConnect = false; // for the SoftI2C "no hardware-I2C traffic" hint
let softI2cHintSent = false;
let readyAt = 0; // ms timestamp set in onReady; gates the SoftI2C hint

// NeoPixel (WS2812): populated in init() from msg.neopixels. A plain array the
// coalescer walks; partId is stored alongside so it can tag the out-message.
let neopixelDecoders: Array<{ partId: string; din: number; decoder: Ws2812Decoder }> = [];

async function init(msg: Extract<Rp2040InMessage, { type: "init" }>) {
  try {
    const [uf2Buf, bootBuf] = await Promise.all([
      fetchBin(msg.uf2Url),
      fetchBin(msg.bootromUrl),
    ]);
    if (halted) return;
    chip = await bootChip({
      bootrom: loadBootromBytes(bootBuf),
      uf2: new Uint8Array(uf2Buf),
      code: msg.code,
      wasmUrl: msg.wasmUrl,
      onSerialLine: (line) => {
        if (!halted) post({ type: "serial", line });
      },
      onReady: () => {
        if (halted) return;
        if (readyTimeout) clearTimeout(readyTimeout);
        readyAt = Date.now();
        post({ type: "ready" });
        if (pendingInput) {
          const p = pendingInput;
          pendingInput = null;
          applyInput(p);
        }
      },
    });
    if (halted) return;

    // GPIO out: edge-driven listeners mark pins dirty (addListener returns a remover).
    // Skip NeoPixel DIN pins here — they get their own decoder listener below (next loop)
    // that runs the real WS2812 bit-timing state machine; a second generic dirtyOut
    // listener on the same pin is pure overhead (thousands of edges/frame at 800 kHz)
    // and its output was already inert (the engine renders DIN parts via the "neopixel"
    // case, never via gpioOut[din]).
    const dinPins = new Set(msg.neopixels.map((s) => s.din));
    for (let n = 0; n < 30; n++) {
      if (dinPins.has(n)) continue;
      const pin = chip.rp2040.gpio[n];
      const remove = pin.addListener(() => {
        dirtyOut.set(n, pin.outputValue);
      });
      removeListeners.push(remove);
    }

    // NeoPixel (WS2812): one Ws2812Decoder per spec, fed by a listener on the DIN pin
    // (the generic dirtyOut listener above skips this pin — see dinPins). The high-check
    // is state === GPIOPinState.High (NOT !!state: GPIOPinState.Input = 2 is truthy).
    for (const spec of msg.neopixels) {
      const decoder = new Ws2812Decoder({ partId: spec.partId });
      // Capture a stable, non-null chip.rp2040 at attach time: avoids re-reading
      // module-mutable `chip` (and a `!` assertion) on every edge — the DIN pin
      // fires thousands of edges per frame at the WS2812 800 kHz bit rate.
      const rp2040 = chip.rp2040;
      const pin = rp2040.gpio[spec.din];
      const remove = pin.addListener((state /*, oldState */) => {
        const hi = state === GPIOPinState.High;
        decoder.edge(rp2040.clock.nanos, hi);
      });
      removeListeners.push(remove);
      neopixelDecoders.push({ partId: spec.partId, din: spec.din, decoder });
    }

    // Coalescer ~30 Hz: flush dirty out-levels + poll PWM duty deltas.
    coalescer = setInterval(() => {
      if (halted || !chip) return;
      const outputs: Record<number, boolean> = {};
      const pwm: Record<number, number> = {};
      const pwmFreq: Record<number, number> = {};
      for (const [n, v] of dirtyOut) outputs[n] = v;
      dirtyOut.clear();
      for (let n = 0; n < 30; n++) {
        const duty = decodePwmDuty(chip.rp2040, n);
        // Known B1 limitation (deferred): if a pin LEAVES PWM mode (decodePwmDuty -> null)
        // after having a duty, we do not post a clearing value, so the engine mirror keeps
        // the last duty until the pin is driven again. Rare in student code (mid-run pin
        // reconfiguration); a correct fix needs protocol-level "pin left PWM" semantics.
        if (duty === null) continue;
        if (lastPwm.get(n) !== duty) {
          lastPwm.set(n, duty);
          pwm[n] = duty;
        }
        const freq = decodePwmFreq(chip.rp2040, n);
        if (freq !== null && lastPwmFreq.get(n) !== freq) {
          lastPwmFreq.set(n, freq);
          pwmFreq[n] = freq;
        }
      }
      if (Object.keys(outputs).length || Object.keys(pwm).length || Object.keys(pwmFreq).length) {
        post({ type: "gpio", outputs, pwm, pwmFreq });
      }

      // Display coalescing: post one message per dirty decoder, then clear dirty.
      // Discriminate by the decoder's own `kind` field (data, not instanceof — robust
      // against bundler class-identity duplication across module instances).
      for (const dec of i2cDecoders) {
        if (!dec.dirty) continue;
        dec.dirty = false;
        if (dec.kind === "oled") {
          const oled = dec as Ssd1306Decoder;
          const buf = oled.framebufferBytes.slice().buffer; // per-tick copy; live fb never detached
          post({ type: "display", partId: dec.partId, kind: "oled", framebuffer: buf, inverse: oled.inverse, displayOn: oled.displayOn }, [buf]);
        } else {
          const lcd = dec as Lcd1602Decoder;
          post({ type: "display", partId: dec.partId, kind: "lcd", text: lcd.text });
        }
      }

      // SoftI2C hint: a display exists but no hardware-I2C connect fired within a few
      // seconds of boot -> the sketch is bit-banging on SoftI2C, which we do not decode.
      if (
        !softI2cHintSent &&
        i2cDecoders.length > 0 &&
        !sawAnyConnect &&
        readyAt > 0 &&
        Date.now() - readyAt > 3000
      ) {
        softI2cHintSent = true;
        post({
          type: "serial",
          line: "note: display detected but no hardware-I2C traffic — SoftI2C/bit-bang is not simulated.",
        });
      }

      // NeoPixel: flush() marks a settled write-once frame dirty (no trailing
      // LATCH needed), then post at most one coalesced message per part per tick.
      for (const { partId, decoder } of neopixelDecoders) {
        decoder.flush();
        if (decoder.dirty) {
          post({ type: "neopixel", partId, pixels: decoder.snapshot().pixels });
          decoder.clearDirty();
        }
      }
    }, 33);

    // ready timeout fallback (USB enumeration may never complete on a bad build).
    readyTimeout = setTimeout(() => {
      if (halted) return;
      post({ type: "error", message: "MicroPython did not enumerate within 15s." });
      stop();
    }, 15000);

    // Build PER-BUS address -> decoder maps from the diagram's displays. DisplaySpec.bus is
    // resolved engine-side from the SDA/DATA netlist wiring (0 | 1 | undefined). A display
    // with a known bus installs ONLY there; one with an unresolved bus installs on BOTH,
    // matching pre-Task-9 (address-only, no-bus-awareness) behaviour as a safe fallback. On
    // a same-bus address collision, keep the FIRST decoder and surface a one-time serial
    // note — the rp2040js I2C model can only ever have one decoder answer a given address.
    const byBusAddr: [Map<number, I2cDecoder>, Map<number, I2cDecoder>] = [new Map(), new Map()];
    const installDecoder = (bus: 0 | 1, dec: I2cDecoder) => {
      const map = byBusAddr[bus];
      if (map.has(dec.address)) {
        post({
          type: "serial",
          line: `note: two displays share I2C address 0x${dec.address.toString(16)} on the same bus — only the first responds.`,
        });
        return;
      }
      map.set(dec.address, dec);
    };
    i2cDecoders = [];
    for (const d of msg.displays) {
      const dec: I2cDecoder =
        d.kind === "oled"
          ? new Ssd1306Decoder({ partId: d.partId, address: d.address })
          : new Lcd1602Decoder({
              partId: d.partId,
              address: d.address,
              cols: d.cols,
              rows: d.rows,
            });
      if (d.bus === 0 || d.bus === 1) installDecoder(d.bus, dec);
      else {
        installDecoder(0, dec);
        installDecoder(1, dec);
      }
      i2cDecoders.push(dec);
    }

    // Same callback shape the smoke uses — see rp2040-boot.ts's attachI2cDecoders doc comment.
    // No symmetric teardown: stop() terminate()s the whole worker (engine teardown), so the
    // callbacks die with it — no leak. If the worker is ever made reusable across runs, add
    // explicit callback detach here.
    attachI2cDecoders(chip.rp2040, byBusAddr, () => {
      sawAnyConnect = true;
    });

    chip.start();
  } catch (e) {
    post({ type: "error", message: e instanceof Error ? e.message : String(e) });
    stop();
  }
}

function applyInput(msg: Extract<Rp2040InMessage, { type: "input" }>) {
  if (halted) return;
  if (!chip) {
    // Still booting: remember only the latest pre-ready snapshot; onReady applies it once.
    pendingInput = msg;
    return;
  }
  for (const [k, v] of Object.entries(msg.gpioInputs)) {
    const n = Number(k);
    chip.rp2040.gpio[n]?.setInputValue(v);
  }
  for (const [k, v] of Object.entries(msg.adcValues)) {
    const ch = Number(k);
    chip.rp2040.adc.channelValues[ch] = v; // Step 0b fallback: onADCRead override if not writable
  }
}

function stop() {
  if (halted) return;
  halted = true;
  if (readyTimeout) clearTimeout(readyTimeout);
  if (coalescer) clearInterval(coalescer);
  for (const remove of removeListeners) remove();
  removeListeners = [];
  neopixelDecoders = [];
  chip?.stop();
  post({ type: "stop" });
}

ctx.onmessage = (ev: MessageEvent<Rp2040InMessage>) => {
  const msg = ev.data;
  if (halted && msg.type !== "stop") return; // inbound gating
  switch (msg.type) {
    case "init":
      void init(msg);
      break;
    case "input":
      applyInput(msg);
      break;
    case "stop":
      stop();
      break;
  }
};
