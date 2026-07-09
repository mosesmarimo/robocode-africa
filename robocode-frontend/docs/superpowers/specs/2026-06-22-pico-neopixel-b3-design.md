# Spec B3 — Pico WS2812 NeoPixel Rendering

**Goal:** Decode the `machine.bitstream` WS2812 pulse-width stream off a Pico DIN GPIO and render live NeoPixel colors on the Studio canvas, completing full Pico parity.

**Date:** 2026-06-22

**Research doc:** [`docs/mcu-emulation-research.md`](/Users/marimo/Dev/robocode/robocode-frontend/docs/mcu-emulation-research.md)

Builds on B1 (rp2040js Web Worker running real MicroPython + GPIO/PWM/ADC render) and B2 (I2C LCD/OLED decoders). NeoPixel is the last static device — B3 completes full Pico parity.

---

## Background

B1/B2 already run real MicroPython firmware inside a Web Worker on **rp2040js 1.3.3** booting the **pinned MicroPython firmware `RPI_PICO-20241129-v1.24.1.uf2`** (`src/lib/sim/rp2040-boot.ts`; firmware at `public/sim/RPI_PICO-20241129-v1.24.1.uf2`). They surface GPIO/PWM digital output and ADC input to the canvas, and decode I2C traffic into LCD/OLED display state via the pure decoders in `src/lib/sim/i2c-devices.ts`. NeoPixel (WS2812) is the only remaining device the firmware exercises but the canvas does not draw — today it only triggers a one-time serial notice (`emitUnsimulatedNotice`, `rp2040-engine.ts:374`, called from the `case "ready":` handler at `rp2040-engine.ts:127`).

> Version note: "rp2040js" (the emulator library) is **1.3.3** in this repo (`node_modules/.pnpm/rp2040js@1.3.3`). The string **`v1.24.1`** refers to the **MicroPython firmware UF2**, not the emulator. The gathered API facts (`GPIOPinState`, `GPIOPinListener`, `addListener`, `IClock.nanos`) were all re-verified against rp2040js **1.3.3** sources. Do not look for "rp2040js v1.24.1" — it does not exist.

B3 decodes the standard MicroPython NeoPixel path: `import neopixel; np = neopixel.NeoPixel(Pin(n), k); np[i] = (r,g,b); np.write()`, which lowers to `machine.bitstream()` — a **software bit-bang over SIO GPIO writes** (not PIO). SIO writes fire `rp2040.gpio[n].addListener((state, oldState) => …)` (returns an unsubscribe fn), and the emulated clock `rp2040.clock.nanos` (`IClock.nanos`, a `readonly number`) lets us timestamp each edge and measure the HIGH-pulse width. No rp2040js patching is required.

**Primary feasibility assumption (proven by the gate, not by static facts):** that rp2040js advances `clock.nanos` finely enough *during* a tight `machine.bitstream` busy-wait to separate a ~400 ns T0H from an ~800 ns T1H. The gathered facts confirm only that the `clock.nanos` **API** exists and returns nanoseconds; they do **not** establish the emulator's sub-microsecond timing fidelity. If rp2040js quantizes time coarsely during the busy-wait, adjacent edges could read identical `nanos` and every bit would decode as `0`. This is the **single central risk of B3**, and the headless smoke gate (real firmware, exact-color assertion) is designed precisely to prove or disprove it. It must be run first, as a spike, before any engine/protocol wiring is built (see Testing).

---

## Goals / Non-Goals

**Goals**

- A pure, framework-free `Ws2812Decoder` that turns a stream of `(nanos, isHigh)` edge events into decoded RGB pixels (24-bit GRB wire order, MSB-first, 600 ns pulse-width threshold, ≥50 µs LATCH), exposing a flat RGB-packed `pixels` snapshot and a `dirty` flag.
- Worker wiring that attaches a `gpio[din].addListener` per NeoPixel part, reads `rp2040.clock.nanos` per edge, feeds the decoder, and posts coalesced `neopixel` out-messages (including a time-based flush so a write-once `np.write()` still renders).
- Engine render: `wokwi-led-ring` via `el.setPixel(i, {r,g,b})`; single `wokwi-neopixel` via `el.r/el.g/el.b` (pixel 0), with `/255` scaling to the elements' 0..1 range.
- Remove the now-dead `emitUnsimulatedNotice` (method, its single call site, and the `notifiedUnsimulated` flag) — after B3 it would fire for nothing.
- A headless smoke gate that boots a real `neopixel.NeoPixel` program and asserts decoded pixel colors on the pinned firmware.

**Non-Goals**

- NO `rp2.PIO` / `asm_pio` / `StateMachine.writeFIFO` NeoPixel idiom (the advanced PIO path) — deferred, noted.
- NO chained single-`wokwi-neopixel` strips wired DOUT→DIN (needs netlist chain-ordering) — deferred, noted.
- NO SK6812 RGBW (32-bit GRBW) decoding — noted; the 24-bit GRB decoder would mis-frame an RGBW strip.
- NO `.py` grading.
- Uno/ESP32 `InterpreterEngine`, Spec A, and the B1/B2 GPIO/I2C logic are **untouched**. Only the `rp2040-*` files plus the new `neopixel-decoder.ts` change.

---

## Architecture

The pipeline mirrors B2's I2C-display path exactly, but the transport is GPIO-edge timing rather than I2C bytes.

**1. Worker-side pure decoder.** A new `Ws2812Decoder` in `src/lib/sim/neopixel-decoder.ts` holds the same discipline as the `i2c-devices.ts` decoders: **no rp2040js import**, no DOM, no framework. It is fed `edge(nanos: number, isHigh: boolean)` events and maintains the WS2812 NRZ-L pulse-width state machine. (The class is named `Ws2812Decoder` after the chip; the protocol type/role/message use the product name `neopixel`/`Neopixel` — this naming split is intentional, mirroring nothing in B2's `I2cDecoder`/`DisplaySpec` but justified by "chip name vs product name." Do not "unify" them.)

**2. Edge source.** In `rp2040.worker.ts`, for each spec in `msg.neopixels` we call `chip.rp2040.gpio[din].addListener((state, oldState) => { … })`. The rp2040js 1.3.3 API (re-verified in source) is:
- `GPIOPinListener = (state: GPIOPinState, oldState: GPIOPinState) => void`.
- `addListener(cb): () => boolean` (returns an unsubscribe fn).
- The listener is invoked by `GPIOPin.checkForUpdates()` as `listener(value, lastValue)` and **only when `value !== lastValue`** — i.e. rp2040js already de-bounces to real edges. For an SIO **output** pin, the `value` getter returns `GPIOPinState.High` / `GPIOPinState.Low` (= 1 / 0) derived from `outputValue`.
- `GPIOPinState.High = 1`, `GPIOPinState.Low = 0`.

Inside the listener we read `chip.rp2040.clock.nanos` for the edge timestamp and derive `isHigh = state === GPIOPinState.High`. **This is the resolved, mandated high-check** — not an open choice. Justification: for a DIN pin driven as an SIO output, `value` is purely High/Low, so `state === GPIOPinState.High` is exact; it is also equivalent to the boolean `pin.outputValue` that the existing B1 listener reads at `rp2040.worker.ts:57`. A truthy shortcut (`!!state`) is **forbidden** — `GPIOPinState.Input = 2` (and 3/4/5) are truthy, so `!!state` would misclassify any Input-family transition as HIGH. The smoke harness must use the identical `state === GPIOPinState.High` check. Each listener's unsubscribe fn is pushed into the existing `removeListeners` array (`rp2040.worker.ts:14`) and torn down by the loop inside `stop()` (the `for (const remove of removeListeners) remove()` at `rp2040.worker.ts:202`, within `stop()` which begins at line 197), exactly like the B1 digital-output listeners.

**3. Protocol extension.** `src/lib/sim/rp2040-protocol.ts` gains `NeopixelSpec` (mirroring `DisplaySpec`, lines 6–12), a `neopixels: NeopixelSpec[]` field on the `init` in-message (alongside `displays`, line 22), and a new `neopixel` out-message variant in the `Rp2040OutMessage` union (lines 28–41).

**4. Engine.** `src/lib/sim/rp2040-engine.ts` adds `buildNeopixelSpecs()` (modeled on `buildDisplaySpecs`, lines 167–190) to resolve each NeoPixel part's DIN pin to a board GPIO via `boardPinFor` + `normGpio` (lines 80–94, 27–31), wires the specs into the init `postMessage`, mirrors incoming `neopixel` messages into a per-`partId` map, and adds a `case "neopixel":` arm to the `switch (def.simRole)` in `updateOutputs` (replacing the bare no-op comment at line 369) that drives the canvas element. Both `LEDRingElement.setPixel({r,g,b})` and `NeoPixelElement.r/g/b` expect **0..1 normalized** values (confirmed from the element JS), so the decoder's 0..255 channels are scaled `/255`. Note this is the **opposite** of the adjacent `rgb` case (`rp2040-engine.ts:284`, `dutyOf(gp) * 255` with comment "element expects 0..255") — that case drives a *different* element (`wokwi-rgb-led`, a discrete common-cathode RGB LED, which genuinely takes 0..255). Do not pattern-match the neighboring `rgb` convention.

---

## Components

### (a) `src/lib/sim/neopixel-decoder.ts` — NEW (the `Ws2812Decoder` state machine)

Pure module, framework-free, no rp2040js import. Mirrors the structural discipline of `src/lib/sim/i2c-devices.ts`.

**Constants**

- `T_THRESH_NS = 600` — pulse-width threshold. `highWidth >= 600` → bit `1`, else bit `0`. WS2812 targets: T0H ≈ 400 ns, T1H ≈ 800 ns @ 800 kHz; 600 ns sits midway and cleanly separates them. (Datasheet variants differ — WS2812 T0H≈350/T1H≈700, WS2812B similar; 600 ns is safely between either pair. The smoke gate prints the measured widths the real firmware emits, so the threshold is validated against actual `machine.bitstream` timing, not assumed.)
- `RESET_LOW_NS = 50000` — a LOW gap ≥ 50 µs is the end-of-frame LATCH. (WS2812 latch is ~50 µs; WS2812B is longer ~280 µs. The `machine.bitstream` reset gap between `np.write()` calls comfortably exceeds 50 µs, and the worker's time-based flush — see (b) — covers the terminal write-once frame regardless.)
- `BITS_PER_PIXEL = 24` — GRB, 8 bits each.

**Construction**

```ts
new Ws2812Decoder({ partId: string })
```

`partId` is stored so the snapshot can carry it back to the coalescer.

**State**

- `acc: number` — bit accumulator (current pixel under construction).
- `nbits: number` — bits accumulated into `acc` so far (0..24).
- `lastRiseNanos: number` — timestamp of the most recent rising edge.
- `lastFallNanos: number` — timestamp of the most recent falling edge (for the next-LOW-gap measurement).
- `sawFall: boolean` — whether any falling edge has been seen yet (so the first rising edge does not register a spurious multi-second LOW gap as a LATCH).
- `pixels: number[]` — **flat RGB-packed triplets** `[r0,g0,b0, r1,g1,b1, …]`, 0..255 per channel, **always in display RGB order** (the GRB→RGB reorder happens at emit). **This is the one canonical snapshot format**, kept identical across worker, protocol, and engine.
- `pixelIndex: number` — index of the next pixel to write (resets to 0 on LATCH/realign).
- `dirty: boolean` — set true when a frame is finalized (by LATCH or by the worker's flush, see (b)).
- `frameCount: number` — incremented on each LATCH. Used by the smoke gate as a "frame complete" settle signal; cheap, retained as a test hook.

**`edge(nanos, isHigh)` algorithm**

- **Rising edge** (`isHigh === true`):
  - If `sawFall` and `(nanos - lastFallNanos) >= RESET_LOW_NS`, this is a LATCH: finalize the current frame (`dirty = true`, `frameCount++`), then reset `acc = 0`, `nbits = 0`, `pixelIndex = 0` (realign to LED0) **before** processing this new bit.
  - Record `lastRiseNanos = nanos`.
- **Falling edge** (`isHigh === false`):
  - Compute `highWidth = nanos - lastRiseNanos`. Derive `bit = highWidth >= T_THRESH_NS ? 1 : 0`.
  - `acc = ((acc << 1) | bit) >>> 0`; `nbits++`. (At 24 bits `acc` max is `0xFFFFFF`, well under 2^31, so the shift is always safe; `>>> 0` is belt-and-suspenders.)
  - When `nbits === BITS_PER_PIXEL`: emit a pixel. WS2812 **wire order is GRB MSB-first**, so `g = (acc >> 16) & 0xFF`, `r = (acc >> 8) & 0xFF`, `b = acc & 0xFF`. The decoder **reorders to display RGB** and writes three flat scalars: `pixels[pixelIndex*3] = r; pixels[pixelIndex*3 + 1] = g; pixels[pixelIndex*3 + 2] = b;`. Then `pixelIndex++`, `acc = 0`, `nbits = 0`.
  - Record `lastFallNanos = nanos`, `sawFall = true`.

A partial accumulation (`nbits < 24`) sitting in `acc` at LATCH is **discarded** (acc/nbits reset, no pixel emitted). Completed pixels already written into `pixels` for the frame are retained.

**Snapshot / flush API**

- `snapshot(): { partId: string; pixels: number[]; frameCount: number }` — returns the `partId`, a **copy** of the flat `pixels` array (so the worker can transfer it by value into the message without aliasing decoder state), and `frameCount`.
- `dirty: boolean` (getter) + `clearDirty(): void`.
- `flush(): void` — forces `dirty = true` if at least one pixel has been emitted in the current frame (`pixelIndex > 0`). This lets the worker render a **write-once** `np.write()` whose terminal LATCH never arrives (there is no subsequent rising edge), without corrupting the frame: it does not reset `acc`/`pixelIndex`, so a later in-progress frame continues correctly.

### (b) Worker wiring — `src/lib/sim/rp2040.worker.ts` (MODIFY)

- Add module-level state alongside lines 8–27: `let neopixelDecoders: Array<{ partId: string; din: number; decoder: Ws2812Decoder }> = [];` (a plain array the coalescer walks; `partId` is stored here so the coalescer can tag the out-message). Import `Ws2812Decoder` from `./neopixel-decoder` and `GPIOPinState` from rp2040js (the same import path the smoke harness uses).
- After `bootChip`, for each `spec` in `msg.neopixels`, construct a decoder and attach the listener:

  ```ts
  const decoder = new Ws2812Decoder({ partId: spec.partId });
  const pin = chip.rp2040.gpio[spec.din];
  const remove = pin.addListener((state /*, oldState */) => {
    const hi = state === GPIOPinState.High;
    decoder.edge(chip.rp2040.clock.nanos, hi);
  });
  removeListeners.push(remove);
  neopixelDecoders.push({ partId: spec.partId, din: spec.din, decoder });
  ```

  This second listener on the DIN pin coexists with the existing B1 digital-output listener (`rp2040.worker.ts:54–60`, which does `dirtyOut.set(n, pin.outputValue)`). `addListener` stores independent removers in a `Set`, so two listeners on one pin is fine. The B1 listener will keep firing on every WS2812 edge and dirty `dirtyOut[din]`, posting the DIN pin's raw level in the coalesced `{ type: "gpio" }` message. **This is inert**: the engine renders the DIN part via the `case "neopixel"` branch (it reads `neopixelState`, not `gpioOut[din]`), and no other engine code drives a canvas element off a neopixel-role part's raw GPIO level. It is harmless churn, noted here so it is not mistaken for a bug.
- In the existing ~33 ms coalescer (`rp2040.worker.ts:63`), after the gpio/display posts: for each `{ partId, decoder }` in `neopixelDecoders`, **first call `decoder.flush()`** (so a settled write-once frame is marked dirty even with no trailing LATCH), then if `decoder.dirty` post `{ type: "neopixel", partId, pixels }` using `decoder.snapshot().pixels`, then `decoder.clearDirty()`. Coalesced — at most one message per part per ~33 ms tick. (Calling `flush()` every tick is safe: it only sets `dirty` when `pixelIndex > 0`, and after `clearDirty()` a steady, unchanged frame re-posts at most once per tick — acceptable at ≤16 LEDs and the existing cadence; the engine write is idempotent.)
- In `stop()` (line 197): the listener removers already flow through `removeListeners` (the loop at line 202); additionally reset `neopixelDecoders = []`.

### (c) Protocol extension — `src/lib/sim/rp2040-protocol.ts` (MODIFY)

Add the spec type (mirror `DisplaySpec`, lines 6–12):

```ts
export type NeopixelSpec = {
  partId: string;
  din: number;   // board GPIO number for the DIN data pin
  count: number; // 1 for single wokwi-neopixel; props.pixels (default 16) for wokwi-led-ring
};
```

Extend the `init` in-message (the line-22 `displays: DisplaySpec[]` area) with `neopixels: NeopixelSpec[];`.

Add the out-message variant to the `Rp2040OutMessage` union (lines 28–41):

```ts
// pixels: flat RGB-packed (display order) [r0,g0,b0, r1,g1,b1, …], 0..255 per channel,
// length = 3 * (number of pixels the decoder emitted this frame).
| { type: "neopixel"; partId: string; pixels: number[] }
```

A plain `number[]` is used (matching the existing `display` text variant), not a transferable `Uint8Array`: payloads are tiny (≤16 LEDs ⇒ ≤48 numbers) and coalesced at 33 ms, so no transfer optimization is warranted. This is a deliberate, justified deviation from the facts' "or similar transferable" suggestion.

### (d) Engine render — `src/lib/sim/rp2040-engine.ts` (MODIFY)

- **Per-part mirror.** Add `private neopixelState = new Map<string, number[]>();` and, in the worker `onmessage` handler, on `{ type: "neopixel" }` store `this.neopixelState.set(msg.partId, msg.pixels)`. (The flat RGB-packed array is stored as-is.)
- **`buildNeopixelSpecs(): NeopixelSpec[]`** — modeled on `buildDisplaySpecs` (lines 167–190). Walk `this.diagram.parts`; keep parts whose `COMPONENT_BY_ID[part.type]?.simRole === "neopixel"`. Resolve the DIN GPIO **DIN-name-first**: `const board = this.boardPinFor(part.id, "DIN"); const din = board ? normGpio(board) : null;` (`"DIN"` is the exact pin name both `neopixel` and `led-ring` carry — confirmed in `pin-reference.ts:9–10` and the element `pinInfo`). The `controlGpio` "first non-power pin" helper (lines 84–94) is **not** a safe fallback for the single `wokwi-neopixel`: its `pinInfo` order is `VDD, DOUT, VSS, DIN`, so `controlGpio` would resolve **DOUT** (the first non-power signal pin), the wrong pin. Therefore: resolve DIN by name only; if `"DIN"` does not resolve to a GPIO, **skip the part** (do not fall back to `controlGpio`). Read `count`: `part.props?.pixels` (default 16) for `led-ring`; hard-code `1` for the single `wokwi-neopixel` regardless of any stray prop. (The LED-count prop key is `pixels` — confirmed `defaultProps: { pixels: 16 }` in `components.ts:58`. There is no `count` prop; the b1b2-integration note that mentioned `part.props?.count` is incorrect and is overridden by the catalog facts.) Return `{ partId, din, count }`.
- **Init wiring.** Pass `neopixels: this.buildNeopixelSpecs()` into the `init` `postMessage` alongside `displays`.
- **`updateOutputs` neopixel branch.** Replace the bare no-op comment at line 369 with a real `case "neopixel":` arm inside the existing `switch (def.simRole)` (the switch opens at `rp2040-engine.ts:264`; the comment at 369 currently sits as a bare comment with no `case` label, so a real `case "neopixel":` label must be added). Mirror the lcd/oled mutation pattern (lines 333–370):

  ```ts
  case "neopixel": {
    const pix = this.neopixelState.get(part.id);
    if (pix) {
      const isRing = COMPONENT_BY_ID[part.type]?.tag === "wokwi-led-ring";
      try {
        if (isRing) {
          // Clamp to the element's own pixel array so setPixel never over-runs the ring.
          const ringPixels = Number((el as { pixels?: number }).pixels ?? 16);
          const n = Math.min(pix.length / 3, ringPixels);
          for (let i = 0; i < n; i++) {
            el.setPixel(i, { r: pix[i*3]/255, g: pix[i*3+1]/255, b: pix[i*3+2]/255 });
          }
        } else {
          // single wokwi-neopixel: pixel 0 only
          el.r = pix[0]/255; el.g = pix[1]/255; el.b = pix[2]/255;
        }
      } catch {}
    }
    break;
  }
  ```

  **Element-kind discrimination must use `part.type` / `def.tag`, not `simRole`** — both parts share `simRole: "neopixel"` (`components.ts:57–58`), so `simRole` cannot distinguish ring from single. Use `COMPONENT_BY_ID[part.type]?.tag === "wokwi-led-ring"` (committed above). `el.setPixel` is present on `LEDRingElement` and absent on `NeoPixelElement`, so a `typeof (el as any).setPixel === "function"` duck-type is an equally valid alternative if preferred; the `try { … } catch {}` guard (matching the lcd/oled cases) protects either way.
  **RGB-range scaling:** `LEDRingElement.setPixel({r,g,b})` and `NeoPixelElement.r/g/b` both expect **0..1 normalized** values (confirmed: `led-ring-element.js` does `rgb(${r*255},${g*255},${b*255})`; `neopixel-element.js` does `cssVal(value/maxOpacity)…*255` with a normalized glow model). The decoder's 0..255 channels are therefore divided by 255.
- **Drop the notice.** Remove (1) the `emitUnsimulatedNotice` method (lines 374–386), (2) its **single** call site at line 127 (inside the `case "ready":` handler, comment block lines 124–127), and (3) the `notifiedUnsimulated` field (line 54). After B3, neopixel is the method's only remaining trigger (lcd/oled were dropped in B2), so removal is correct and in scope. The `case "ready":` branch becomes empty: keep it as a `case "ready": break;` with a one-line comment ("Booting MicroPython… is superseded by real serial output; nothing to surface."), so the stale notice comment does not linger.

### (e) Component catalog — `src/lib/domain/components.ts` + `src/lib/studio/pin-reference.ts` (NO CHANGE)

Already present and correct (confirmed in facts); no catalog edits required:

- `neopixel`: `tag: "wokwi-neopixel"`, `simRole: "neopixel"` (`components.ts:57`).
- `led-ring`: `tag: "wokwi-led-ring"`, `simRole: "neopixel"`, `defaultProps: { pixels: 16 }` (`components.ts:58`).
- DIN pin name is `"DIN"` for both (`pin-reference.ts:9–10`; matches the element `pinInfo`).

Note: `pixels` for `led-ring` is **default-only** (16) — `inspector.tsx` exposes no field for `simRole === "neopixel"` — so `count` is effectively fixed at 16 for rings added from the catalogue. Acceptable for B3. (Cosmetic, no action: the `wokwi-neopixel` element's DIN pin carries `signals:[{type:"power",signal:"GND"}]` in its `pinInfo` — a known Wokwi data quirk. Because `buildNeopixelSpecs` resolves DIN by **name** via `boardPinFor(part.id, "DIN")`, not by signal type, this quirk does not affect resolution.)

---

## Data flow

1. MicroPython `np.write()` invokes `machine.bitstream()` (software bit-bang).
2. The bit-bang toggles the SIO GPIO `din` HIGH/LOW with busy-wait delays; emulated time advances per cycle as the core executes.
3. Each real edge fires `chip.rp2040.gpio[din]` listener (rp2040js only calls listeners on `value !== lastValue`) → the listener reads `chip.rp2040.clock.nanos` and derives `isHigh = state === GPIOPinState.High` → `decoder.edge(nanos, isHigh)`.
4. `Ws2812Decoder` measures HIGH-pulse widths (≥600 ns → 1), accumulates 24-bit **GRB MSB-first**, **reorders to display RGB**, and writes flat scalars into `pixels[pixelIndex*3 … +2]`.
5. A LOW gap ≥ 50 µs at the next rising edge LATCHes the frame: realign to LED0, set `dirty`, bump `frameCount`. For a terminal write-once frame (no trailing rising edge), the worker's per-tick `decoder.flush()` sets `dirty` instead.
6. The ~33 ms coalescer posts `{ type: "neopixel", partId, pixels }` for each dirty decoder, then clears dirty.
7. The engine stores the flat array into `neopixelState.get(partId)`.
8. `updateOutputs` reads the mirror and writes the canvas: `el.setPixel(i, {r,g,b})` per pixel (led-ring, clamped to the element's pixel count) or `el.r/el.g/el.b` (single), each channel scaled `/255`.

---

## Error handling

- **Partial/garbled frame** — `nbits < 24` in `acc` at LATCH is discarded (acc/nbits reset, no pixel emitted). A glitchy intermediate pulse decodes to a wrong bit but self-corrects at the next frame's LATCH realign. Already-completed pixels in the frame are kept.
- **Never-written strip** — no edges → no falling edge → `flush()` is a no-op (`pixelIndex === 0`), `dirty` never set, no `neopixel` message posted; the element keeps its default off state (`r=g=b=0`). No spurious draw.
- **Write-once `np.write()`** — the terminal frame's LATCH never fires (no subsequent rising edge), but the coalescer's `decoder.flush()` marks the settled frame dirty so it renders. This is the common curriculum case (set colors once) and is explicitly handled.
- **Unresolvable DIN pin** — `buildNeopixelSpecs` skips the part (no spec emitted, no listener attached, no fallback to `controlGpio` which could resolve DOUT). No worker listener on an undefined GPIO; no crash.
- **More decoded pixels than the element holds** — the led-ring write loop is clamped to `Math.min(pix.length/3, el.pixels)` (the ring's own pixel-array size, default 16), so `el.setPixel(i, …)` is never called past the ring. Extra decoded triplets are ignored. The single `wokwi-neopixel` only ever reads pixel 0.
- **RGB-range mismatch** — the decoder's 0..255 channels are scaled `/255` to the elements' 0..1 normalized range. Firmware sends 0..255; `/255` yields 0..1; no extra clamp needed.

---

## Testing & verification

- **Typecheck** — `tsc` over the frontend (typecheck-only project policy; no test framework).
- **Headless smoke (strong gate, run FIRST as a spike).** Extend `scripts/rp2040-smoke.ts` (run via `npx tsx scripts/rp2040-smoke.ts neopixel`; no `package.json` entry — matches the existing mode pattern) with a new `neopixel` mode booting the pinned `RPI_PICO-20241129-v1.24.1.uf2` firmware running a **real** program:

  ```python
  import neopixel
  from machine import Pin
  np = neopixel.NeoPixel(Pin(N), 2)
  np[0] = (255, 0, 0)
  np[1] = (0, 255, 0)
  np.write()
  print("NEOPIXEL_OK")
  ```

  Attach a `Ws2812Decoder` to `rp2040.gpio[N]` with `pin.addListener((state) => decoder.edge(rp2040.clock.nanos, state === GPIOPinState.High))` (the **identical** high-check the worker uses). **Settle condition** (do not just race the 15 s ceiling): after `chip.start()`, poll until `decoder.frameCount >= 1` **or** (since a single `np.write()` may not produce a trailing rising-edge LATCH) until `decoder.snapshot().pixels` has length ≥ 6 with a settle delay — concretely, mirror the `pwm` mode's poll loop (smoke lines ~291–295): loop up to ~50×100 ms reading `decoder.snapshot()`, break once `pixels.length >= 6`, also gate on the `NEOPIXEL_OK` serial marker (set `sawSmoke`) so a never-ran `main.py` fails loudly rather than racing the timeout. Then **assert** `decoder.snapshot().pixels` equals `[255,0,0, 0,255,0]` (pixel0 = red, pixel1 = green) and that `NEOPIXEL_OK` was seen. Optionally log the measured T0H/T1H widths the decoder observed, to confirm the 600 ns threshold sits between them on the real firmware.

  This exercises the entire `machine.bitstream` → SIO edges → clock-timestamped pulse-width decode chain on real firmware. It directly proves or disproves the **primary feasibility risk** (clock-resolution-vs-pulse-width). If it fails because adjacent edges read identical `nanos`, the pulse-width strategy is invalid and B3 needs a rethink before any wiring is built — hence "run first."
- **Manual browser check (only the canvas write).** The sole browser-only step is the final `el.setPixel`/`el.r-g-b` canvas mutation **and its `/255` scaling**, which the headless gate does **not** exercise. Verify by adding a `wokwi-led-ring` and a `wokwi-neopixel` in Studio, running a NeoPixel sketch, and visually confirming the rendered colors are full-brightness (not 1/255-dim, which would indicate a scaling error) and correctly ordered (R vs G vs B not swapped). (Task-N.)

---

## Risks & open questions

- **Clock-resolution vs pulse-width (PRIMARY risk).** B3's entire decode strategy assumes rp2040js advances `clock.nanos` finely enough during the `machine.bitstream` busy-wait to separate T0H (~400 ns) from T1H (~800 ns). The gathered facts confirm only the `clock.nanos` API, not the emulator's timing fidelity. Proven (or disproven) **only** by the headless smoke asserting exact colors on real firmware — which must run first, as a gating spike. If adjacent edges collapse to identical `nanos`, every bit decodes as 0 and the approach is invalid.
- **Element RGB range (0..1 vs 0..255).** Confirmed from the element JS as **0..1 normalized** for both `LEDRingElement.setPixel` and `NeoPixelElement.r/g/b`; the engine scales `/255`. This is the **opposite** of the adjacent `wokwi-rgb-led` case (`rp2040-engine.ts:284`, 0..255) — do not conflate them. The headless smoke does **not** cover the canvas write, so the scaling is proven only by the manual browser check; a wrong scale renders effectively-black (×1/255) or saturated.
- **Write-once LATCH.** A single `np.write()` produces no trailing rising edge, so the rising-edge LATCH never fires for the terminal frame and `frameCount` may stay 0. The decoder still accumulates the pixels correctly; the worker's per-tick `flush()` marks the frame dirty so the canvas updates. The smoke asserts on `snapshot().pixels` (which is populated regardless of LATCH) and additionally polls for `pixels.length`, so it does not depend on a terminal LATCH.
- **GPIO high-check.** Resolved: `isHigh = state === GPIOPinState.High` (`GPIOPinState.High = 1`; rp2040js invokes listeners as `listener(value, lastValue)` only on real edges; an SIO output pin's `value` is purely High/Low). The truthy shortcut `!!state` is forbidden (`Input = 2` etc. are truthy). Worker and smoke use the identical check.
- **Edge-listener volume.** At 800 kHz a 24-bit pixel is ~30 µs; an N-LED frame fires up to 2·24·N edges. The listener does only a compare + accumulate per edge, and the per-frame canvas update is decoupled via the existing ~33 ms coalescer, so render frequency is bounded regardless of edge volume. rp2040js's own `value !== lastValue` de-bounce means no redundant calls.
- **DIN pin discovery.** `buildNeopixelSpecs` resolves DIN by the exact name `"DIN"` via `boardPinFor(part.id, "DIN")` → `normGpio` (matches `pin-reference.ts` and the element `pinInfo`). That the live element exposes `"DIN"` at runtime is verified against the facts; if it does not resolve, the part is skipped (no `controlGpio` fallback — for the single neopixel, `controlGpio` would wrongly resolve DOUT).
- **SK6812 RGBW.** Out of scope (32-bit GRBW). The 24-bit GRB decoder would mis-frame an RGBW strip (the decoder has no guard). Noted, not handled.

---

## Out of scope

- The `rp2.PIO` / `asm_pio` / `StateMachine.writeFIFO` NeoPixel idiom (PIO-driven WS2812). B3 decodes the `machine.bitstream` pulse-width path only. Deferred, noted.
- Chained single-`wokwi-neopixel` strips wired DOUT→DIN (requires netlist chain-ordering). Deferred, noted.
- SK6812 RGBW (32-bit GRBW) decoding.
- `.py` grading.
- Full Raspberry Pi (Pyodide path, Spec C) — excluded. Studio emulates only Pico/Uno/ESP32.
