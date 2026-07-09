# Pico WS2812 NeoPixel (B3) Implementation Plan

> For agentic workers: **REQUIRED SUB-SKILL — `superpowers:subagent-driven-development`.** Execute task-by-task as checkbox steps. Dispatch each task to a subagent, review its diff against the step's expected output before checking the box, and never batch tasks. Every code step gives the COMPLETE code; do not improvise.

**Goal:** Decode the `machine.bitstream` WS2812 pulse-width stream off a Pico DIN GPIO and render live NeoPixel colors on the Studio canvas, completing full Pico parity.

**Architecture:** A pure, framework-free `Ws2812Decoder` turns `(nanos, isHigh)` GPIO-edge events into 24-bit GRB pixels reordered to flat RGB-packed display order. The `rp2040.worker.ts` attaches a `gpio[din].addListener` per NeoPixel part, timestamps each edge with `rp2040.clock.nanos`, feeds the decoder, and posts coalesced `neopixel` out-messages (with a time-based flush for write-once frames). `rp2040-engine.ts` mirrors those messages per `partId` and writes the canvas elements (`LEDRingElement.setPixel` / `NeoPixelElement.r/g/b`), scaling 0..255 → 0..1.

**Tech Stack:** TypeScript, rp2040js 1.3.3, MicroPython firmware v1.24.1, Web Worker, @wokwi/elements, npx tsx smoke scripts.

## Global Constraints

- Frontend-only — no backend, no `.py` grading.
- Branch `spec/pico-neopixel-b3` (already created; the spec is already committed on it). Do all work on this branch.
- Typecheck-only project (no test framework) — gates are `npx tsx` smoke scripts + `tsc` (`pnpm typecheck`) + `pnpm build`.
- ONLY the `rp2040-*` files plus the new `neopixel-decoder.ts` change — Uno/ESP32 `InterpreterEngine`, Spec A, and B1/B2 GPIO/I2C logic are UNTOUCHED.
- The decoder is pure/framework-free — no rp2040js import, no DOM, no postMessage.
- The `pixels` snapshot is FLAT RGB-packed `[r0,g0,b0, r1,g1,b1, …]`, 0..255 per channel, display RGB order, everywhere (worker, protocol, engine).
- GPIO high-check is `state === GPIOPinState.High` — NEVER the truthy shortcut `!!state` (`GPIOPinState.Input = 2` is truthy).
- Element RGB range is 0..1, so the engine scales every channel `/255`. This is the OPPOSITE of the adjacent `wokwi-rgb-led` case (which is 0..255) — do not conflate them.
- WS2812 wire order is GRB MSB-first; `T_THRESH_NS = 600`, `RESET_LOW_NS = 50000`, `BITS_PER_PIXEL = 24`.
- OUT OF SCOPE: the `rp2.PIO`/`asm_pio`/`StateMachine.writeFIFO` PIO path, DOUT→DIN chains, SK6812 RGBW (32-bit GRBW), full Raspberry Pi (Pyodide/Spec C).

Commit trailer (use verbatim on every commit in this plan):

```
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
```

> Line-anchor note for the executor: the line numbers below are taken from the current branch state and are accurate as cited, but a few in the smoke script drift by a handful of lines as edits land. **Always anchor on the verbatim quoted "current" code, not the cited number** — every insertion is also described semantically (e.g. "immediately after the GP25 listener block"). If a quoted block does not match the file, STOP and re-read before editing.

---

## TASK 1 — Pure `Ws2812Decoder` + synthetic-edge unit gate

Build the entire decode state machine in isolation and prove it with a deterministic, firmware-free smoke that feeds hand-built edges. This isolates the decoder logic from emulator timing (which Task 2 then validates against real firmware).

**Files**

- Create `src/lib/sim/neopixel-decoder.ts` (new pure module; structural discipline modeled on `src/lib/sim/i2c-devices.ts` — no rp2040js import, no DOM).
- Create `scripts/neopixel-decoder-smoke.ts` (new; run via `npx tsx scripts/neopixel-decoder-smoke.ts`).

**Interfaces**

- Produces:
  - `class Ws2812Decoder` with `constructor(opts: { partId: string })`, `edge(nanos: number, isHigh: boolean): void`, `snapshot(): { partId: string; pixels: number[]; frameCount: number }`, `get dirty(): boolean`, `clearDirty(): void`, `flush(): void`, and a read-only `get frameCount(): number`.
  - The flat RGB-packed `pixels` format `[r0,g0,b0, r1,g1,b1, …]`, 0..255, display order. (Consumed by Tasks 2, 4, 5.)
- Consumes: nothing (pure).

### Steps

- [ ] **1.1 — Write the synthetic-edge smoke (failing: module missing).**

  Create `scripts/neopixel-decoder-smoke.ts` with the COMPLETE content below. It builds a synthetic edge stream by hand for two pixels:
  - pixel0 = red `(255,0,0)`. Wire order is GRB, so the 24 wire bits are `G=0x00, R=0xFF, B=0x00` → `00000000 11111111 00000000`.
  - pixel1 = green `(0,255,0)`. GRB → `G=0xFF, R=0x00, B=0x00` → `11111111 00000000 00000000`.

  Each bit is one HIGH pulse then a LOW gap: a `1`-bit is HIGH for 800 ns, a `0`-bit HIGH for 400 ns; each bit occupies a ~1250 ns period (so the inter-bit LOW gap is well under the 50 µs LATCH). After all 48 bits, a `>= 50000 ns` LOW gap then a trailing rising edge latches the frame.

  ```ts
  // Deterministic, firmware-free gate for the pure Ws2812Decoder (npx tsx).
  // Builds a synthetic (nanos, isHigh) edge stream by hand — no rp2040js, no
  // emulator timing — so it isolates the decoder's pulse-width/GRB->RGB logic.
  //   npx tsx scripts/neopixel-decoder-smoke.ts
  import { Ws2812Decoder } from "../src/lib/sim/neopixel-decoder";

  // WS2812 wire order is GRB, MSB-first. Build the 24 wire bits for one pixel
  // from display RGB by laying out G then R then B, each MSB-first.
  function grbBits(r: number, g: number, b: number): number[] {
    const byteBits = (v: number) =>
      Array.from({ length: 8 }, (_, i) => (v >> (7 - i)) & 1);
    return [...byteBits(g), ...byteBits(r), ...byteBits(b)];
  }

  // Timings (ns): T0H=400 (bit 0), T1H=800 (bit 1), full bit period ~1250.
  const T0H = 400;
  const T1H = 800;
  const PERIOD = 1250;

  const dec = new Ws2812Decoder({ partId: "p0" });

  let t = 0;
  const emitBit = (bit: number) => {
    // rising edge
    dec.edge(t, true);
    // falling edge after the HIGH pulse
    t += bit ? T1H : T0H;
    dec.edge(t, false);
    // remainder of the bit period stays LOW
    t += PERIOD - (bit ? T1H : T0H);
  };

  const bits = [
    ...grbBits(255, 0, 0), // pixel0 = red
    ...grbBits(0, 255, 0), // pixel1 = green
  ];
  for (const bit of bits) emitBit(bit);

  // LATCH: a long LOW gap, then a trailing rising edge to finalize the frame.
  t += 60000; // >= RESET_LOW_NS (50000)
  dec.edge(t, true);

  const snap = dec.snapshot();
  const expected = [255, 0, 0, 0, 255, 0];
  const got = snap.pixels;
  const ok =
    got.length === expected.length &&
    expected.every((v, i) => v === got[i]) &&
    dec.frameCount >= 1;

  console.log("frameCount:", dec.frameCount, "dirty:", dec.dirty);
  console.log("pixels:", JSON.stringify(got));
  if (!ok) {
    console.error("FAIL: expected", JSON.stringify(expected), "got", JSON.stringify(got));
    process.exit(1);
  }
  console.log("PASS (neopixel-decoder)");
  ```

  Run it; expect a module-not-found failure:

  ```
  npx tsx scripts/neopixel-decoder-smoke.ts
  ```

  Expected: an error that `../src/lib/sim/neopixel-decoder` cannot be resolved (the decoder does not exist yet). This confirms the gate actually loads the decoder. Do NOT commit yet.

- [ ] **1.2 — Implement the `Ws2812Decoder`.**

  Create `src/lib/sim/neopixel-decoder.ts` with the COMPLETE content below. No rp2040js import, no DOM (matches the `i2c-devices.ts` discipline, which deliberately avoids the rp2040js import and types the mode as a plain `number`). Constants and algorithm are taken verbatim from spec section (a).

  ```ts
  // Pure WS2812 (NeoPixel) pulse-width decoder. Framework-free: NO rp2040js
  // import, NO DOM, NO postMessage — same discipline as i2c-devices.ts.
  //
  // Fed (nanos, isHigh) GPIO edge events; runs the WS2812 NRZ-L pulse-width
  // state machine and exposes a flat RGB-packed snapshot + a dirty flag.
  //
  // Class is named after the chip (Ws2812Decoder); the protocol type/role/
  // message use the product name "neopixel" — this split is intentional.

  /** HIGH-pulse width threshold: >= 600 ns => bit 1, else bit 0. */
  const T_THRESH_NS = 600;
  /** LOW gap >= 50 us is the end-of-frame LATCH. */
  const RESET_LOW_NS = 50000;
  /** WS2812 sends 24 bits per pixel: GRB, 8 bits each. */
  const BITS_PER_PIXEL = 24;

  export class Ws2812Decoder {
    readonly partId: string;

    // bit accumulator (current pixel under construction)
    private acc = 0;
    // bits accumulated into acc so far (0..24)
    private nbits = 0;
    // timestamp of the most recent rising edge
    private lastRiseNanos = 0;
    // timestamp of the most recent falling edge (for the next LOW-gap measure)
    private lastFallNanos = 0;
    // whether any falling edge has been seen yet (so the first rising edge does
    // not register a spurious multi-second LOW gap as a LATCH)
    private sawFall = false;

    // flat RGB-packed triplets [r0,g0,b0, r1,g1,b1, ...], 0..255, DISPLAY order
    private pixels: number[] = [];
    // index of the next pixel to write (resets to 0 on LATCH/realign)
    private pixelIndex = 0;

    private _dirty = false;
    private _frameCount = 0;

    constructor(opts: { partId: string }) {
      this.partId = opts.partId;
    }

    /** Number of completed frames (LATCH count). A cheap test/settle hook. */
    get frameCount(): number {
      return this._frameCount;
    }

    edge(nanos: number, isHigh: boolean): void {
      if (isHigh) {
        // Rising edge.
        if (this.sawFall && nanos - this.lastFallNanos >= RESET_LOW_NS) {
          // LATCH: finalize the current frame, then realign to LED0.
          this._dirty = true;
          this._frameCount++;
          this.acc = 0;
          this.nbits = 0;
          this.pixelIndex = 0;
        }
        this.lastRiseNanos = nanos;
        return;
      }

      // Falling edge: measure the HIGH-pulse width and decode one bit.
      const highWidth = nanos - this.lastRiseNanos;
      const bit = highWidth >= T_THRESH_NS ? 1 : 0;
      this.acc = ((this.acc << 1) | bit) >>> 0;
      this.nbits++;

      if (this.nbits === BITS_PER_PIXEL) {
        // WS2812 wire order is GRB, MSB-first. Reorder to display RGB.
        const g = (this.acc >> 16) & 0xff;
        const r = (this.acc >> 8) & 0xff;
        const b = this.acc & 0xff;
        this.pixels[this.pixelIndex * 3] = r;
        this.pixels[this.pixelIndex * 3 + 1] = g;
        this.pixels[this.pixelIndex * 3 + 2] = b;
        this.pixelIndex++;
        this.acc = 0;
        this.nbits = 0;
      }

      this.lastFallNanos = nanos;
      this.sawFall = true;
    }

    /** A copy of the flat pixels array (so the worker can transfer by value). */
    snapshot(): { partId: string; pixels: number[]; frameCount: number } {
      return {
        partId: this.partId,
        pixels: this.pixels.slice(),
        frameCount: this._frameCount,
      };
    }

    get dirty(): boolean {
      return this._dirty;
    }

    clearDirty(): void {
      this._dirty = false;
    }

    /**
     * Force dirty if at least one pixel has been emitted this frame. Lets the
     * worker render a write-once np.write() whose terminal LATCH never arrives,
     * without corrupting an in-progress frame (does NOT reset acc/pixelIndex).
     */
    flush(): void {
      if (this.pixelIndex > 0) this._dirty = true;
    }
  }
  ```

  Notes for the implementer (do not change the code): the `pixels` array is only ever indexed up to `pixelIndex*3 + 2`, so a partial accumulation in `acc` at LATCH (`nbits < 24`) is discarded by the `acc/nbits` reset — no pixel is emitted, and previously-completed pixels are retained.

- [ ] **1.3 — Run the gate; see PASS; commit.**

  ```
  npx tsx scripts/neopixel-decoder-smoke.ts
  ```

  Expected output (tail):

  ```
  frameCount: 1 dirty: true
  pixels: [255,0,0,0,255,0]
  PASS (neopixel-decoder)
  ```

  Then verify the decoder typechecks in isolation:

  ```
  pnpm typecheck
  ```

  Expected: clean (no errors). The decoder is pure and imported only by the smoke at this point.

  Commit (deliverable: the pure decoder + its passing synthetic gate):

  ```
  git add src/lib/sim/neopixel-decoder.ts scripts/neopixel-decoder-smoke.ts
  git commit -m "B3 Task 1: pure Ws2812Decoder + synthetic-edge smoke gate

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y"
  ```

---

## TASK 2 — Real-firmware smoke SPIKE (LYNCHPIN; proves the primary feasibility risk)

This is the single central risk of B3. It must run **before any protocol/worker/engine wiring**. It boots the pinned firmware running a real `neopixel.NeoPixel` program, attaches a `Ws2812Decoder` to the DIN GPIO with the **identical** `state === GPIOPinState.High` check the worker will use, and asserts exact decoded colors. If adjacent edges read identical `nanos` (every bit decodes 0), the pulse-width strategy is invalid — STOP and escalate.

**Files**

- Modify `scripts/rp2040-smoke.ts`:
  - Import line (current line 22): `import { I2CMode } from "rp2040js";` → add `GPIOPinState`.
  - Import the decoder (alongside the `i2c-devices` import at line 21).
  - Add `NEOPIXEL_PY` near the other `*_PY` programs (the `READ_PY` block opens at line 170).
  - Extend the `MODE` guard (line 179) and `CODE_BY_MODE` (lines 183–189).
  - Extend the `MARKER` ternary (inside `main()`, lines 192–196).
  - Attach the decoder listener immediately after the existing GP25 listener (line 242).
  - Add a `neopixel` poll/assert block mirroring the `pwm` block (which closes at line 307), placed after it.

**Interfaces**

- Consumes: `Ws2812Decoder` (Task 1), `GPIOPinState` from `"rp2040js"`, `chip.rp2040.gpio[n].addListener`, `chip.rp2040.clock.nanos`.
- Produces: a `neopixel` smoke mode (proves clock-resolution-vs-pulse-width on real firmware).

**Chosen DIN GPIO:** `N = 2` (GPIO2). It is a free general-purpose Pico GPIO not used by the existing smoke modes (blink uses GP25; pwm uses GP0; I2C modes use GP4/GP5), so there is no listener or function-select collision. State this in a code comment.

**Settle-branch note (do NOT treat as a bug):** `scripts/rp2040-smoke.ts:211` resolves the run promise on the `else if (MODE !== "blink" && MODE !== "pwm" && sawSmoke && !done)` branch — `neopixel` correctly falls into this branch, so the `Promise.race([finished, 15s])` releases as soon as `NEOPIXEL_OK` is printed. That only gates *entry* into the assert block; the `neopixel` block then runs its OWN `50×100 ms` poll on `pixels.length >= 6` before `chip.stop()`, exactly like the `pwm` block's self-contained poll. The block's poll loop is the real gate; the early settle does not stop the chip prematurely.

### Steps

- [ ] **2.1 — Add imports + the real NeoPixel program + mode wiring.**

  Edit the import at lines 21–22. Current (verbatim):

  ```ts
  import { Lcd1602Decoder, Ssd1306Decoder, type I2cDecoder } from "../src/lib/sim/i2c-devices";
  import { I2CMode } from "rp2040js";
  ```

  After:

  ```ts
  import { Lcd1602Decoder, Ssd1306Decoder, type I2cDecoder } from "../src/lib/sim/i2c-devices";
  import { Ws2812Decoder } from "../src/lib/sim/neopixel-decoder";
  import { I2CMode, GPIOPinState } from "rp2040js";
  ```

  Add `NEOPIXEL_PY` immediately after the `READ_PY` block (which opens at line 170). DIN GPIO is 2 (see chosen-pin note above):

  ```ts
  const NEOPIXEL_PY = [
    "import neopixel",
    "from machine import Pin",
    "np = neopixel.NeoPixel(Pin(2), 2)",
    "np[0] = (255, 0, 0)",
    "np[1] = (0, 255, 0)",
    "np.write()",
    'print("NEOPIXEL_OK")',
  ].join("\n") + "\n";
  ```

  Extend the `MODE` guard. Current (verbatim, lines 179–182):

  ```ts
  const MODE = (() => {
    const a = process.argv[2];
    return a === "pwm" || a === "lcd" || a === "oled" || a === "read" ? a : "blink";
  })();
  ```

  After:

  ```ts
  const MODE = (() => {
    const a = process.argv[2];
    return a === "pwm" || a === "lcd" || a === "oled" || a === "read" || a === "neopixel"
      ? a
      : "blink";
  })();
  ```

  Extend `CODE_BY_MODE`. Current (verbatim, lines 183–189):

  ```ts
  const CODE_BY_MODE: Record<string, string> = {
    blink: MAIN_PY,
    pwm: PWM_PY,
    lcd: LCD_PY,
    oled: OLED_PY,
    read: READ_PY,
  };
  ```

  After:

  ```ts
  const CODE_BY_MODE: Record<string, string> = {
    blink: MAIN_PY,
    pwm: PWM_PY,
    lcd: LCD_PY,
    oled: OLED_PY,
    read: READ_PY,
    neopixel: NEOPIXEL_PY,
  };
  ```

  Extend the `MARKER` ternary (inside `main()`). Current (verbatim, lines 192–196):

  ```ts
    const MARKER =
      MODE === "pwm" ? "PWM_OK"
      : MODE === "lcd" ? "LCD_OK"
      : MODE === "oled" ? "OLED_OK"
      : MODE === "read" ? "READ_OK"
      : "SMOKE_OK";
  ```

  After:

  ```ts
    const MARKER =
      MODE === "pwm" ? "PWM_OK"
      : MODE === "lcd" ? "LCD_OK"
      : MODE === "oled" ? "OLED_OK"
      : MODE === "read" ? "READ_OK"
      : MODE === "neopixel" ? "NEOPIXEL_OK"
      : "SMOKE_OK";
  ```

- [ ] **2.2 — Attach the decoder to GPIO2 and add the assert block.**

  The decoder listener must be attached **before** `chip.start()` so it observes every edge. Insert the attachment immediately after the existing GP25 listener block. Current GP25 listener (verbatim, lines 242–245):

  ```ts
    chip.rp2040.gpio[25].addListener(() => {
      gpio25Toggled = true;
      settle();
    });
  ```

  After (append the NeoPixel decoder attach right below the GP25 listener). The high-check is `state === GPIOPinState.High` — the identical check the worker uses (Task 4). The `measuredHighWidths` capture is debug-only output (it is NOT asserted on); it logs the real firmware's HIGH-pulse widths so the 600 ns threshold can be eyeballed against the actual T0H/T1H:

  ```ts
    chip.rp2040.gpio[25].addListener(() => {
      gpio25Toggled = true;
      settle();
    });

    // B3 spike: attach the SAME Ws2812Decoder + high-check the worker uses to
    // the DIN GPIO (2). Capture early HIGH-pulse widths to confirm the 600 ns
    // threshold sits between the real firmware's T0H/T1H. (Debug-only — the
    // assert below keys on snapshot().pixels, not on these widths.)
    const npDec = new Ws2812Decoder({ partId: "np-spike" });
    const measuredHighWidths: number[] = [];
    let npLastRise: number | null = null;
    chip.rp2040.gpio[2].addListener((state) => {
      const nanos = chip.rp2040.clock.nanos;
      const hi = state === GPIOPinState.High;
      if (hi) {
        npLastRise = nanos;
      } else if (npLastRise !== null && measuredHighWidths.length < 8) {
        measuredHighWidths.push(nanos - npLastRise);
      }
      npDec.edge(nanos, hi);
    });
  ```

  Add the `neopixel` assert block. Place it immediately after the `pwm` block's closing `}` (the `pwm` block closes at line 307, just before the `if (MODE === "oled")` block at line 309). It mirrors the `pwm` poll loop (50×100 ms) but settles on `pixels.length >= 6` and the `NEOPIXEL_OK` marker. Current boundary (verbatim, lines 305–310):

  ```ts
      console.log("PASS (pwm)");
      return;
    }

    if (MODE === "oled") {
      chip.stop();
  ```

  After (insert the whole `neopixel` block between the pwm block's `}` and the `if (MODE === "oled")` line):

  ```ts
      console.log("PASS (pwm)");
      return;
    }

    if (MODE === "neopixel") {
      let snap = npDec.snapshot();
      for (let i = 0; i < 50; i++) {
        snap = npDec.snapshot();
        if (snap.pixels.length >= 6 && sawSmoke) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      chip.stop();
      console.log("ready:", ready, "NEOPIXEL_OK:", sawSmoke);
      console.log("frameCount:", npDec.frameCount);
      console.log("measured HIGH widths (ns):", JSON.stringify(measuredHighWidths));
      console.log("decoded pixels:", JSON.stringify(snap.pixels));
      if (!sawSmoke)
        throw new Error("FAIL: NEOPIXEL_OK not seen — main.py never ran (LFS/boot path)");
      const expected = [255, 0, 0, 0, 255, 0];
      const got = snap.pixels;
      const equal =
        got.length === expected.length && expected.every((v, i) => v === got[i]);
      if (!equal)
        throw new Error(
          `FAIL: decoded ${JSON.stringify(got)} != ${JSON.stringify(expected)} — ` +
            `if every bit is 0 the clock did not advance between edges (clock-resolution risk); ` +
            `STOP and escalate before building any wiring`,
        );
      console.log("PASS (neopixel)");
      return;
    }

    if (MODE === "oled") {
      chip.stop();
  ```

- [ ] **2.3 — Run the spike. EXPECTED on green: commit. On the clock-resolution failure: STOP and escalate.**

  ```
  npx tsx scripts/rp2040-smoke.ts neopixel
  ```

  Expected output (tail), proving the full `machine.bitstream` → SIO edges → clock-timestamped pulse-width decode chain on real firmware:

  ```
  [serial] NEOPIXEL_OK
  ready: true NEOPIXEL_OK: true
  frameCount: 0          (a write-once np.write() may emit NO trailing-LATCH, so 0 is fine; the assert keys on pixels, NOT frameCount)
  measured HIGH widths (ns): [ ... ]   (a mix of ~400 and ~800, 600 ns sits between)
  decoded pixels: [255,0,0,0,255,0]
  PASS (neopixel)
  ```

  `frameCount` may print `0` or `1` — it is NOT part of the assertion (a write-once `np.write()` need not produce a terminal LATCH). The gate is `decoded pixels: [255,0,0,0,255,0]` plus `NEOPIXEL_OK: true`.

  EXPLICIT escalation rule: **If this FAILS because the decoded pixels are all-zero (`[0,0,0,0,0,0]`) — i.e. adjacent edges read identical `nanos` so every bit decodes 0 — STOP. The pulse-width strategy is invalid; do not build Tasks 3–6. Escalate to the human with the printed `measured HIGH widths` (they will be all-equal/zero), because B3 needs a rethink (e.g. a different timing source).** Only proceed to Task 3 once this prints `PASS (neopixel)` with `decoded pixels: [255,0,0,0,255,0]`.

  Commit only on green (deliverable: real-firmware proof of the decode chain):

  ```
  git add scripts/rp2040-smoke.ts
  git commit -m "B3 Task 2: real-firmware neopixel smoke spike (clock-resolution proof)

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y"
  ```

---

## TASK 3 — Protocol extension

Add the `NeopixelSpec` type, the `neopixels` init field, and the `neopixel` out-message variant. These types are the contract Tasks 4 and 5 implement against.

**Files**

- Modify `src/lib/sim/rp2040-protocol.ts`:
  - Add `NeopixelSpec` after `DisplaySpec` (current lines 6–12).
  - Add `neopixels: NeopixelSpec[];` to the `init` in-message (current line 22 area).
  - Add the `neopixel` out-message variant to `Rp2040OutMessage` (current lines 28–41).

**Interfaces**

- Produces:
  - `type NeopixelSpec = { partId: string; din: number; count: number }`.
  - `init` in-message gains `neopixels: NeopixelSpec[]`.
  - `Rp2040OutMessage` gains `| { type: "neopixel"; partId: string; pixels: number[] }`.

### Steps

- [ ] **3.1 — Add `NeopixelSpec`, the init field, and the out-message variant.**

  Add `NeopixelSpec` immediately after the `DisplaySpec` block. Current (verbatim, lines 5–12):

  ```ts
  /** A display part the worker should ACK on the I2C bus and decode. */
  export type DisplaySpec = {
    partId: string;
    kind: "lcd" | "oled";
    address: number;
    cols?: number; // LCD only; default 16
    rows?: number; // LCD only; default 2
  };
  ```

  After (append the new type below it):

  ```ts
  /** A display part the worker should ACK on the I2C bus and decode. */
  export type DisplaySpec = {
    partId: string;
    kind: "lcd" | "oled";
    address: number;
    cols?: number; // LCD only; default 16
    rows?: number; // LCD only; default 2
  };

  /** A NeoPixel (WS2812) part whose DIN GPIO the worker should decode. */
  export type NeopixelSpec = {
    partId: string;
    din: number; // board GPIO number for the DIN data pin
    count: number; // 1 for single wokwi-neopixel; props.pixels (default 16) for wokwi-led-ring
  };
  ```

  Add the init field. Current (verbatim, lines 15–25):

  ```ts
  export type Rp2040InMessage =
    | {
        type: "init";
        uf2Url: string;
        bootromUrl: string;
        wasmUrl: string;
        code: string;
        displays: DisplaySpec[];
      }
    | { type: "input"; gpioInputs: Record<number, boolean>; adcValues: Record<number, number> }
    | { type: "stop" };
  ```

  After (add `neopixels` after `displays`):

  ```ts
  export type Rp2040InMessage =
    | {
        type: "init";
        uf2Url: string;
        bootromUrl: string;
        wasmUrl: string;
        code: string;
        displays: DisplaySpec[];
        neopixels: NeopixelSpec[];
      }
    | { type: "input"; gpioInputs: Record<number, boolean>; adcValues: Record<number, number> }
    | { type: "stop" };
  ```

  Add the out-message variant. Current (verbatim, lines 27–41):

  ```ts
  /** worker -> main thread */
  export type Rp2040OutMessage =
    | { type: "ready" } // firmware booted, USB-CDC up, main.py running
    | { type: "serial"; line: string } // one complete line (newline-split)
    | {
        type: "gpio";
        outputs: Record<number, boolean>; // raw pin out-values, coalesced (edge-driven)
        pwm: Record<number, number>;     // GPIO -> duty 0..1 (decoded), coalesced (polled)
      }
    // LCD posts the rendered flat cols*rows text; OLED posts the 1024-byte packed
    // GDDRAM as a transferable ArrayBuffer (ImageData is built engine-side only).
    | { type: "display"; partId: string; kind: "lcd"; text: string }
    | { type: "display"; partId: string; kind: "oled"; framebuffer: ArrayBuffer; inverse: boolean; displayOn: boolean }
    | { type: "error"; message: string } // fetch/boot/runtime failure
    | { type: "stop" };                  // worker has halted + cleaned up
  ```

  After (add the `neopixel` variant after the two `display` variants):

  ```ts
  /** worker -> main thread */
  export type Rp2040OutMessage =
    | { type: "ready" } // firmware booted, USB-CDC up, main.py running
    | { type: "serial"; line: string } // one complete line (newline-split)
    | {
        type: "gpio";
        outputs: Record<number, boolean>; // raw pin out-values, coalesced (edge-driven)
        pwm: Record<number, number>;     // GPIO -> duty 0..1 (decoded), coalesced (polled)
      }
    // LCD posts the rendered flat cols*rows text; OLED posts the 1024-byte packed
    // GDDRAM as a transferable ArrayBuffer (ImageData is built engine-side only).
    | { type: "display"; partId: string; kind: "lcd"; text: string }
    | { type: "display"; partId: string; kind: "oled"; framebuffer: ArrayBuffer; inverse: boolean; displayOn: boolean }
    // pixels: flat RGB-packed (display order) [r0,g0,b0, r1,g1,b1, ...], 0..255 per
    // channel, length = 3 * (number of pixels the decoder emitted this frame).
    | { type: "neopixel"; partId: string; pixels: number[] }
    | { type: "error"; message: string } // fetch/boot/runtime failure
    | { type: "stop" };                  // worker has halted + cleaned up
  ```

  Design note (verbatim from spec): a plain `number[]` is used (matching the existing `display` text variant), not a transferable `Uint8Array` — payloads are tiny (≤16 LEDs ⇒ ≤48 numbers) and coalesced at 33 ms, so no transfer optimization is warranted.

- [ ] **3.2 — Gate on the types compiling; expect ONLY the one anticipated error; commit.**

  ```
  pnpm typecheck
  ```

  EXPECTED (state this to the reviewer so it is not a surprise): the protocol file itself compiles, but `rp2040-engine.ts` now reports a **single** error — the `init` `postMessage` object literal (current engine lines 153–160) is missing the newly-required `neopixels` property (`Rp2040InMessage` init now requires it). This is satisfied by **Task 5** (which adds `neopixels: this.buildNeopixelSpecs()`). No other errors should appear. If any error other than the missing-`neopixels`-in-init error appears, the type edits are wrong — fix before committing.

  Commit (deliverable: the protocol contract, with the one expected downstream gap documented):

  ```
  git add src/lib/sim/rp2040-protocol.ts
  git commit -m "B3 Task 3: protocol — NeopixelSpec, init.neopixels, neopixel out-message

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y"
  ```

---

## TASK 4 — Worker wiring

Attach a `Ws2812Decoder` per `msg.neopixels` spec, timestamp edges with `chip.rp2040.clock.nanos`, feed the decoder, and post coalesced `neopixel` messages with a per-tick flush. The DIN listener coexists with the B1 digital-output listener — this is inert (the engine renders via `case "neopixel"`, not `gpioOut[din]`).

> `chip.rp2040.clock.nanos` validity note: the `RP2040` instance exposes `readonly clock: IClock` and `IClock.nanos: number` (rp2040js 1.3.3 `.d.ts`), reached through the typed `chip.rp2040` exactly as `.gpio`/`.pwm`/`.i2c` are. The facts' "the word clock does not appear in rp2040-boot.ts" applies only to that file; `clock` is a real, always-present field on the chip.

**Files**

- Modify `src/lib/sim/rp2040.worker.ts`:
  - Import line (current line 6): `import { I2CMode } from "rp2040js";` → add `GPIOPinState`; import `Ws2812Decoder`.
  - Module state block (current lines 8–27): add `neopixelDecoders`.
  - After the B1 digital-output listener loop (current lines 54–61): attach per-spec decoder + listener.
  - Coalescer (current `setInterval(..., 33)`, lines 63–116): post `neopixel` messages before the `}, 33);` close (line 116).
  - `stop()` (current lines 197–206): reset `neopixelDecoders`.

**Interfaces**

- Consumes: `Ws2812Decoder` (Task 1), `NeopixelSpec`/`neopixel` out-message (Task 3), `GPIOPinState`, `chip.rp2040.gpio[n].addListener`, `chip.rp2040.clock.nanos`, the existing `removeListeners` array.
- Produces: `{ type: "neopixel"; partId; pixels }` out-messages (consumed by Task 5).

### Steps

- [ ] **4.1 — Add imports + module state.**

  Edit the import. Current (line 6):

  ```ts
  import { I2CMode } from "rp2040js";
  ```

  After (add `GPIOPinState` from the same path; add the decoder import — place the decoder import next to the existing relative imports in the file's import block):

  ```ts
  import { I2CMode, GPIOPinState } from "rp2040js";
  import { Ws2812Decoder } from "./neopixel-decoder";
  ```

  (The location of the `./neopixel-decoder` import among the relative imports is immaterial as long as it is a top-level import.)

  Add module state. Current (verbatim, lines 18–27):

  ```ts
  const dirtyOut = new Map<number, boolean>();
  const lastPwm = new Map<number, number>();

  // I2C displays: populated in init() from msg.displays. The coalescer (defined inside
  // init() before chip.start()) reads this module-level array after it is set, so the
  // closure always sees the populated list.
  let i2cDecoders: I2cDecoder[] = [];
  let sawAnyConnect = false; // for the SoftI2C "no hardware-I2C traffic" hint
  let softI2cHintSent = false;
  let readyAt = 0; // ms timestamp set in onReady; gates the SoftI2C hint
  ```

  After (append the `neopixelDecoders` array; `partId` is stored here so the coalescer can tag the out-message):

  ```ts
  const dirtyOut = new Map<number, boolean>();
  const lastPwm = new Map<number, number>();

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
  ```

- [ ] **4.2 — Attach per-spec decoder + DIN listener after `bootChip`.**

  Insert the per-spec attachment loop right after the B1 digital-output GPIO listener loop. Current B1 loop (verbatim, lines 54–61):

  ```ts
    // GPIO out: edge-driven listeners mark pins dirty (addListener returns a remover).
    for (let n = 0; n < 30; n++) {
      const pin = chip.rp2040.gpio[n];
      const remove = pin.addListener(() => {
        dirtyOut.set(n, pin.outputValue);
      });
      removeListeners.push(remove);
    }
  ```

  After (append the NeoPixel attach loop immediately below the B1 loop; `msg` is the `init` message in scope here, the same one `msg.displays` is read from):

  ```ts
    // GPIO out: edge-driven listeners mark pins dirty (addListener returns a remover).
    for (let n = 0; n < 30; n++) {
      const pin = chip.rp2040.gpio[n];
      const remove = pin.addListener(() => {
        dirtyOut.set(n, pin.outputValue);
      });
      removeListeners.push(remove);
    }

    // NeoPixel (WS2812): one Ws2812Decoder per spec, fed by a second listener on
    // the DIN pin. The high-check is state === GPIOPinState.High (NOT !!state:
    // GPIOPinState.Input = 2 is truthy). This second listener coexists with the
    // B1 digital-output listener above; that B1 listener will keep firing on every
    // WS2812 edge and dirty dirtyOut[din], but it is inert — the engine renders the
    // DIN part via case "neopixel" (reading neopixelState), not gpioOut[din].
    for (const spec of msg.neopixels) {
      const decoder = new Ws2812Decoder({ partId: spec.partId });
      const pin = chip.rp2040.gpio[spec.din];
      const remove = pin.addListener((state /*, oldState */) => {
        const hi = state === GPIOPinState.High;
        decoder.edge(chip.rp2040.clock.nanos, hi);
      });
      removeListeners.push(remove);
      neopixelDecoders.push({ partId: spec.partId, din: spec.din, decoder });
    }
  ```

- [ ] **4.3 — Post coalesced `neopixel` messages in the ~33 ms coalescer.**

  The coalescer is `setInterval(() => { … }, 33)` (current lines 63–116). Add the NeoPixel post **after the existing gpio/display posts and before the coalescer's closing** — immediately before the `}, 33);` close at line 116. For each decoder: call `flush()` first (so a settled write-once frame is marked dirty even with no trailing LATCH), then if `dirty` post the snapshot's pixels, then `clearDirty()`:

  ```ts
      // NeoPixel: flush() marks a settled write-once frame dirty (no trailing
      // LATCH needed), then post at most one coalesced message per part per tick.
      for (const { partId, decoder } of neopixelDecoders) {
        decoder.flush();
        if (decoder.dirty) {
          post({ type: "neopixel", partId, pixels: decoder.snapshot().pixels });
          decoder.clearDirty();
        }
      }
  ```

  Cadence note (correct, just precise): `flush()` sets `dirty` whenever `pixelIndex > 0`, and `clearDirty()` runs each tick, so a static (unchanged) frame re-posts every ~33 ms (a steady ~30 Hz of identical messages) — NOT a one-time post. This is acceptable at ≤16 LEDs and the existing cadence because the engine write is idempotent (same pixels → same canvas).

- [ ] **4.4 — Reset `neopixelDecoders` in `stop()`.**

  The listener removers already flow through `removeListeners` (torn down by the loop at lines 202–203); additionally clear the decoder array. Current `stop()` (verbatim, lines 197–206):

  ```ts
  function stop() {
    if (halted) return;
    halted = true;
    if (readyTimeout) clearTimeout(readyTimeout);
    if (coalescer) clearInterval(coalescer);
    for (const remove of removeListeners) remove();
    removeListeners = [];
    chip?.stop();
    post({ type: "stop" });
  }
  ```

  After (add `neopixelDecoders = [];` alongside `removeListeners = []`):

  ```ts
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
  ```

- [ ] **4.5 — Gate + commit.**

  ```
  pnpm typecheck
  ```

  EXPECTED: the worker compiles cleanly. The only remaining typecheck error in the repo is still the missing `neopixels` field in the engine's `init` `postMessage` (resolved in Task 5). If the worker file itself produces any error (e.g. `GPIOPinState` not exported, or `msg.neopixels` unknown), fix before committing.

  Commit (deliverable: worker decodes DIN edges and posts `neopixel` messages):

  ```
  git add src/lib/sim/rp2040.worker.ts
  git commit -m "B3 Task 4: worker — per-DIN Ws2812Decoder, clock-timestamped edges, coalesced neopixel posts

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y"
  ```

---

## TASK 5 — Engine render

Build the NeoPixel specs, wire them into init, mirror incoming `neopixel` messages per `partId`, and add the `case "neopixel":` render arm. Element-kind is discriminated by `def.tag` (both parts share `simRole: "neopixel"`). Channels are scaled `/255` (elements are 0..1 — the OPPOSITE of the adjacent `rgb` case).

**Files**

- Modify `src/lib/sim/rp2040-engine.ts`:
  - Import (current line 9): add `NeopixelSpec` to the type import from `./rp2040-protocol`.
  - Class fields (current lines 56–62): add `private neopixelState`.
  - `onmessage` handler (current lines 98–135): add a `case "neopixel":` arm storing the mirror.
  - init `postMessage` (current lines 153–160): pass `neopixels: this.buildNeopixelSpecs()`.
  - Add `buildNeopixelSpecs()` (model on `buildDisplaySpecs`, current lines 167–190).
  - `updateOutputs` switch (current lines 264–369): replace the bare no-op comment at line 367 with a real `case "neopixel":` arm.

**Interfaces**

- Consumes: `NeopixelSpec`/`neopixel` out-message (Task 3), the worker's `neopixel` posts (Task 4), `boardPinFor` (current lines 80–82, returns `string | undefined`), `normGpio` (current lines 27–31, takes a `string`, returns `number | null`), `COMPONENT_BY_ID`, `getPartEl`.
- Produces: canvas writes via `LEDRingElement.setPixel(i, {r,g,b})` / `NeoPixelElement.r/g/b` (0..1). Satisfies the `init.neopixels` requirement that has been failing typecheck since Task 3.

> Type-cast heads-up (NOT a deviation): `el` is typed `(HTMLElement & Record<string, unknown>)` (engine line 256). The existing lcd/oled cases only *assign* through that index signature (`el.imageData = img`), which TS permits. But `el.setPixel(i, …)` is a **call** through the index signature, and `Record<string, unknown>` yields `unknown`, which is **not callable** (TS2349). The adjacent `el.pixels` read is also `unknown`. So this case is the first to *call* an index-signature member: a local cast is expected and correct — `(el as { setPixel: (i: number, c: { r: number; g: number; b: number }) => void }).setPixel(...)` and `Number((el as { pixels?: number }).pixels ?? 16)`. The code below already writes the `pixels` read with that cast; if `pnpm typecheck` flags the `setPixel` call, add the analogous cast on the call — that is a required, in-spec fix, not a plan violation.

### Steps

- [ ] **5.1 — Import `NeopixelSpec`; add the `neopixelState` mirror + the onmessage arm.**

  Edit the type import. Current (line 9):

  ```ts
  import type { Rp2040InMessage, Rp2040OutMessage, DisplaySpec } from "./rp2040-protocol";
  ```

  After:

  ```ts
  import type { Rp2040InMessage, Rp2040OutMessage, DisplaySpec, NeopixelSpec } from "./rp2040-protocol";
  ```

  Add the mirror field. Current (verbatim, lines 56–62):

  ```ts
    // mirrors (replace Machine)
    private gpioOut: Record<number, boolean> = {};
    private pwmDuty: Record<number, number> = {};
    private displayState = new Map<
      string,
      { kind: "lcd"; text: string } | { kind: "oled"; framebuffer: Uint8Array; inverse: boolean; displayOn: boolean }
    >();
  ```

  After (add `neopixelState` after `displayState`):

  ```ts
    // mirrors (replace Machine)
    private gpioOut: Record<number, boolean> = {};
    private pwmDuty: Record<number, number> = {};
    private displayState = new Map<
      string,
      { kind: "lcd"; text: string } | { kind: "oled"; framebuffer: Uint8Array; inverse: boolean; displayOn: boolean }
    >();
    // flat RGB-packed (display order) [r0,g0,b0, ...], 0..255, keyed by partId
    private neopixelState = new Map<string, number[]>();
  ```

  Add the onmessage arm. Current `display`/`ready` region (verbatim, lines 110–125):

  ```ts
          case "display":
            if (msg.kind === "oled") {
              this.displayState.set(msg.partId, {
                kind: "oled",
                framebuffer: new Uint8Array(msg.framebuffer),
                inverse: msg.inverse,
                displayOn: msg.displayOn,
              });
            } else {
              this.displayState.set(msg.partId, { kind: "lcd", text: msg.text });
            }
            this.updateOutputs();
            break;
          case "ready":
            this.emitUnsimulatedNotice();
            break;
  ```

  After (insert a `case "neopixel":` arm between `display` and `ready`; store the flat array as-is, then re-render):

  ```ts
          case "display":
            if (msg.kind === "oled") {
              this.displayState.set(msg.partId, {
                kind: "oled",
                framebuffer: new Uint8Array(msg.framebuffer),
                inverse: msg.inverse,
                displayOn: msg.displayOn,
              });
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
            this.emitUnsimulatedNotice();
            break;
  ```

  (Note: `emitUnsimulatedNotice()` stays for now — Task 6 removes it. Do not touch the notice in this task.)

- [ ] **5.2 — Add `buildNeopixelSpecs()` and wire it into the init `postMessage`.**

  Add `buildNeopixelSpecs()` next to `buildDisplaySpecs`. Current `buildDisplaySpecs` (verbatim, lines 167–190):

  ```ts
    private buildDisplaySpecs(): DisplaySpec[] {
      const specs: DisplaySpec[] = [];
      for (const part of this.diagram.parts) {
        const role = COMPONENT_BY_ID[part.type]?.simRole;
        if (role !== "lcd" && role !== "oled") continue;
        const kind = role;
        const raw = part.props?.address;
        const def = kind === "oled" ? 0x3c : 0x27;
        let address = def;
        if (typeof raw === "number" && Number.isFinite(raw)) address = raw;
        else if (typeof raw === "string") {
          const parsed = parseInt(raw, raw.trim().toLowerCase().startsWith("0x") ? 16 : 10);
          if (Number.isFinite(parsed)) address = parsed;
        }
        const is20x4 = part.type === "lcd2004";
        specs.push({
          partId: part.id,
          kind,
          address,
          ...(kind === "lcd" ? { cols: is20x4 ? 20 : 16, rows: is20x4 ? 4 : 2 } : {}),
        });
      }
      return specs;
    }
  ```

  After (append `buildNeopixelSpecs` immediately below `buildDisplaySpecs`). Resolve DIN by NAME only — both parts also expose a DOUT data pin, so match `"DIN"` explicitly and skip the part if it does not resolve, rather than guessing a pin via `controlGpio` (which grabs the first non-power signal pin). The LED-count prop key is `pixels`, default 16, and the single `wokwi-neopixel` is hard-coded to `1`:

  ```ts
    private buildNeopixelSpecs(): NeopixelSpec[] {
      const specs: NeopixelSpec[] = [];
      for (const part of this.diagram.parts) {
        const def = COMPONENT_BY_ID[part.type];
        if (def?.simRole !== "neopixel") continue;
        // Resolve DIN by NAME only (not controlGpio's "first non-power pin"):
        // both parts also expose a DOUT data pin, so match DIN explicitly and
        // skip the part if it does not resolve, rather than guessing a pin.
        const board = this.boardPinFor(part.id, "DIN");
        const din = board ? normGpio(board) : null;
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
  ```

  Wire it into init. Current (verbatim, lines 153–160):

  ```ts
      const init: Rp2040InMessage = {
        type: "init",
        uf2Url: "/sim/RPI_PICO-20241129-v1.24.1.uf2",
        bootromUrl: "/sim/rp2040-bootrom.bin",
        wasmUrl: "/sim/lfs_js.wasm",
        code: this.code,
        displays: this.buildDisplaySpecs(),
      };
  ```

  After (add `neopixels`):

  ```ts
      const init: Rp2040InMessage = {
        type: "init",
        uf2Url: "/sim/RPI_PICO-20241129-v1.24.1.uf2",
        bootromUrl: "/sim/rp2040-bootrom.bin",
        wasmUrl: "/sim/lfs_js.wasm",
        code: this.code,
        displays: this.buildDisplaySpecs(),
        neopixels: this.buildNeopixelSpecs(),
      };
  ```

- [ ] **5.3 — Add the `case "neopixel":` render arm to `updateOutputs`.**

  The `switch (def.simRole)` opens at line 264; the `lcd`/`oled` cases (the pattern to mirror) are lines 334–366; the bare no-op comment is the last line inside the switch (current line 367), just before the switch close. Replace that bare comment with a real `case "neopixel":` arm. Current tail of the switch (verbatim, lines 344–369):

  ```ts
          case "oled": {
            const s = this.displayState.get(part.id);
            if (s?.kind === "oled") {
              const img = new ImageData(128, 64);
              const fb = s.framebuffer;
              for (let y = 0; y < 64; y++) {
                for (let x = 0; x < 128; x++) {
                  const lit = (fb[(y >> 3) * 128 + x] >> (y & 7)) & 1;
                  const on = s.displayOn ? (lit ^ (s.inverse ? 1 : 0)) : 0;
                  const i = (y * 128 + x) * 4;
                  const v = on ? 255 : 0;
                  img.data[i] = v;
                  img.data[i + 1] = v;
                  img.data[i + 2] = v;
                  img.data[i + 3] = 255;
                }
              }
              try {
                el.imageData = img;
              } catch {}
            }
            break;
          }
          // neopixel: NO-OP on canvas (B3; covered by the one-time serial notice)
        }
      }
    }
  ```

  After (replace the `// neopixel: NO-OP …` comment line with the full `case "neopixel":` arm; element-kind uses `def.tag === "wokwi-led-ring"` because both parts share `simRole: "neopixel"`; channels scaled `/255`; ring write clamped to the element's own `pixels` count; wrapped in `try/catch` like lcd/oled):

  ```ts
          case "oled": {
            const s = this.displayState.get(part.id);
            if (s?.kind === "oled") {
              const img = new ImageData(128, 64);
              const fb = s.framebuffer;
              for (let y = 0; y < 64; y++) {
                for (let x = 0; x < 128; x++) {
                  const lit = (fb[(y >> 3) * 128 + x] >> (y & 7)) & 1;
                  const on = s.displayOn ? (lit ^ (s.inverse ? 1 : 0)) : 0;
                  const i = (y * 128 + x) * 4;
                  const v = on ? 255 : 0;
                  img.data[i] = v;
                  img.data[i + 1] = v;
                  img.data[i + 2] = v;
                  img.data[i + 3] = 255;
                }
              }
              try {
                el.imageData = img;
              } catch {}
            }
            break;
          }
          case "neopixel": {
            const pix = this.neopixelState.get(part.id);
            if (pix) {
              // Both parts share simRole "neopixel"; discriminate by tag.
              const isRing = COMPONENT_BY_ID[part.type]?.tag === "wokwi-led-ring";
              // Elements expect 0..1 normalized channels (they *255 internally),
              // the OPPOSITE of the wokwi-rgb-led case above — scale /255 here.
              try {
                if (isRing) {
                  // Clamp to the element's own pixel array so setPixel never over-runs.
                  const ringPixels = Number((el as { pixels?: number }).pixels ?? 16);
                  const n = Math.min(pix.length / 3, ringPixels);
                  const setPixel = (el as {
                    setPixel: (i: number, c: { r: number; g: number; b: number }) => void;
                  }).setPixel;
                  for (let i = 0; i < n; i++) {
                    setPixel.call(el, i, {
                      r: pix[i * 3] / 255,
                      g: pix[i * 3 + 1] / 255,
                      b: pix[i * 3 + 2] / 255,
                    });
                  }
                } else {
                  // single wokwi-neopixel: pixel 0 only
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
  ```

  Implementer note (do not change the code): `el` is typed `HTMLElement & Record<string, unknown>`, so `el.r/g/b` assignments go through the index signature (TS permits assignment), while the `setPixel` call and the `el.pixels` read are cast explicitly (see the type-cast heads-up above — calling an `unknown` index-signature member is not allowed without a cast). The `try { … } catch {}` guard protects the single-vs-ring access exactly as it protects the lcd/oled writes. `COMPONENT_BY_ID` is already imported (current line 5).

- [ ] **5.4 — Gate + commit.**

  ```
  pnpm typecheck
  ```

  EXPECTED: clean — no errors. The `init.neopixels` field that has been the sole outstanding error since Task 3 is now satisfied by `buildNeopixelSpecs()`. If a TS2349 "not callable" error appears on `setPixel`, the explicit cast above resolves it — confirm it is present. If any other error remains, fix before committing.

  Commit (deliverable: engine resolves DIN, mirrors `neopixel`, renders the canvas):

  ```
  git add src/lib/sim/rp2040-engine.ts
  git commit -m "B3 Task 5: engine — buildNeopixelSpecs, neopixel mirror, canvas render (/255 scaled)

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y"
  ```

---

## TASK 6 — Remove the dead notice + final gates

After B3, `emitUnsimulatedNotice` would fire for nothing (lcd/oled were dropped in B2; neopixel now renders). Remove the method, its single call site, and the field. Then run every gate.

**Files**

- Modify `src/lib/sim/rp2040-engine.ts`:
  - Remove the `notifiedUnsimulated` field (current line 54).
  - Replace the call site inside `case "ready":` (current lines 123–127) with `case "ready": break;` + a one-line comment.
  - Remove the `emitUnsimulatedNotice` method (current lines 374–386).

**Interfaces**

- Consumes: nothing new.
- Produces: a clean engine with no dead notice path.

### Steps

- [ ] **6.1 — Remove the `notifiedUnsimulated` field.**

  Current (verbatim, lines 53–54):

  ```ts
    private inputTimer: ReturnType<typeof setInterval> | null = null;
    private notifiedUnsimulated = false;
  ```

  After (drop the second line):

  ```ts
    private inputTimer: ReturnType<typeof setInterval> | null = null;
  ```

- [ ] **6.2 — Empty out the `case "ready":` arm.**

  Current (verbatim, lines 123–127, as it stands after Task 5 — the `neopixel` arm was inserted above it but `ready` itself is unchanged):

  ```ts
          case "ready":
            // "Booting MicroPython..." is superseded by subsequent real serial output;
            // on ready we surface the un-simulated-device notice (see Step 5).
            this.emitUnsimulatedNotice();
            break;
  ```

  After:

  ```ts
          case "ready":
            // "Booting MicroPython..." is superseded by real serial output; nothing to surface.
            break;
  ```

- [ ] **6.3 — Remove the `emitUnsimulatedNotice` method.**

  Delete the entire method. Current (verbatim, lines 374–386):

  ```ts
    private emitUnsimulatedNotice() {
      if (this.notifiedUnsimulated) return;
      const roles = new Set(
        this.diagram.parts
          .map((p) => COMPONENT_BY_ID[p.type]?.simRole)
          .filter((r): r is string => r === "neopixel"),
      );
      if (roles.size === 0) return;
      this.notifiedUnsimulated = true;
      this.cb.onSerial(
        "note: NeoPixel (WS2812) runs in firmware but is not yet drawn on the canvas (coming in B3).",
      );
    }
  ```

  After: remove these lines entirely (delete the whole method body; leave the surrounding methods intact). No replacement.

- [ ] **6.4 — Run all gates.**

  Typecheck (no references to the removed symbol should remain):

  ```
  pnpm typecheck
  ```

  Expected: clean. If an error reports `emitUnsimulatedNotice` or `notifiedUnsimulated` is still referenced, you missed a site — find and remove it.

  Synthetic decoder gate (Task 1, still green):

  ```
  npx tsx scripts/neopixel-decoder-smoke.ts
  ```

  Expected tail:

  ```
  pixels: [255,0,0,0,255,0]
  PASS (neopixel-decoder)
  ```

  Real-firmware gate (Task 2, still green):

  ```
  npx tsx scripts/rp2040-smoke.ts neopixel
  ```

  Expected tail:

  ```
  decoded pixels: [255,0,0,0,255,0]
  PASS (neopixel)
  ```

  Bundling gate (catches Worker / wasm / "use client" boundary issues that typecheck alone misses — this is the FIRST task to exercise the worker chunk end-to-end, since Tasks 4–5 only ran typecheck):

  ```
  pnpm build
  ```

  Expected tail (Next.js): a `✓ Compiled successfully` / `Compiled successfully` line and no errors. If the build fails on the Worker import or the `"use client"` boundary, the engine/worker wiring has a bundling issue to resolve before committing.

- [ ] **6.5 — Document the residual manual browser spot-check; commit.**

  The ONE un-automatable verification (the headless gates do NOT exercise the canvas write or its `/255` scaling): in Studio, add a `wokwi-led-ring` and a `wokwi-neopixel`, wire DIN to a Pico GPIO, run a NeoPixel sketch (e.g. set pixel 0 red, pixel 1 green, `np.write()`), and visually confirm:
  - colors render at **full brightness** (not 1/255-dim — dimness would mean a `/255` scaling mismatch, e.g. a value fed as 0..255 into an element that expects 0..1, or a double-scale), and
  - channel order is correct (red is red, green is green — R/G/B not swapped, which would indicate a GRB→RGB reorder bug).

  Record the result of this manual check in the PR description (it cannot be a CI gate).

  Commit (deliverable: dead notice removed; all automated gates green):

  ```
  git add src/lib/sim/rp2040-engine.ts
  git commit -m "B3 Task 6: remove dead emitUnsimulatedNotice; B3 NeoPixel rendering complete

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y"
  ```

---

### Done criteria

- `src/lib/sim/neopixel-decoder.ts` exists, is pure (no rp2040js import, no DOM), and its synthetic gate prints `PASS (neopixel-decoder)`.
- `npx tsx scripts/rp2040-smoke.ts neopixel` prints `decoded pixels: [255,0,0,0,255,0]` and `PASS (neopixel)` on the pinned `RPI_PICO-20241129-v1.24.1.uf2` firmware (the clock-resolution risk is disproven).
- `rp2040-protocol.ts` carries `NeopixelSpec`, `init.neopixels`, and the `neopixel` out-message; `rp2040.worker.ts` decodes DIN edges and posts coalesced `neopixel` messages; `rp2040-engine.ts` builds specs, mirrors per-`partId`, and renders both `wokwi-led-ring` (`setPixel`, clamped) and `wokwi-neopixel` (`r/g/b`), all `/255`-scaled.
- `emitUnsimulatedNotice`, its call site, and `notifiedUnsimulated` are gone; `case "ready":` is a one-line `break`.
- `pnpm typecheck` clean and `pnpm build` compiles successfully.
- Manual browser spot-check (full brightness, correct R/G/B order) recorded in the PR.
- Uno/ESP32 `InterpreterEngine`, Spec A, and B1/B2 GPIO/I2C logic untouched; only the `rp2040-*` files and the new `neopixel-decoder.ts` changed.
