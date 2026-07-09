# Spec B2 — Pico I2C Display Rendering Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL — when you pick up a task, you MUST follow the `superpowers:executing-plans` and `superpowers:test-driven-development` sub-skills. Each task ends with a verify step (run command + expected output) and a commit; check off each `- [ ]` checkbox as you complete it.

**Goal:** Decode the rp2040js hardware-I2C peripheral traffic emitted by real MicroPython firmware and render live LCD1602/LCD2004 character output and SSD1306 OLED framebuffer output on the Pico canvas, replacing the B1 no-op + "not yet drawn" notice.

**Architecture:** Four layers mirroring the existing B1 GPIO path. (1) Pure, framework-free worker-side decoders in a NEW `i2c-devices.ts` (`Lcd1602Decoder`, `Ssd1306Decoder`) — no DOM, no postMessage, no rp2040js coupling. (2) Worker wiring in `rp2040.worker.ts` installs `RPI2C` callbacks on both `chip.rp2040.i2c[0]` and `[1]`, routes by address, ACKs matched display addresses, and a 33ms coalescer posts a `display` out-message per dirty decoder (LCD text; OLED a transferred 1024-byte framebuffer copy). (3) Protocol extension in `rp2040-protocol.ts` adds `DisplaySpec` + extends both message unions. (4) Engine render in `rp2040-engine.ts` mirrors display state, builds `ImageData(128,64)` engine-side, and writes `el.text`/`el.imageData`. Plus the component catalog default-address props and an inspector address-editing control.

**Tech Stack:** TypeScript; Next.js 16 App Router (robocode-frontend); rp2040js@1.3.3 (`RPI2C` hardware-I2C model; `I2CMode` is a public root export of the package); @wokwi/elements (`LCD1602Element`, `LCD2004Element extends LCD1602Element`, `SSD1306Element`); Web Worker + transferable `ArrayBuffer`; headless smoke via `npx tsx` booting real MicroPython v1.24.1.

## Global Constraints

- TypeScript; frontend = Next.js 16 App Router (robocode-frontend). Frontend-only (no backend; no .py grading).
- All B2 work goes on the branch `spec/pico-i2c-displays-b2` (ALREADY created + checked out; the B2 spec is committed there). Commit steps cd into robocode-frontend.
- NO TEST FRAMEWORK (typecheck-only). TDD adapted: a task ends with EITHER (a) `pnpm typecheck` resolving a type error, OR (b) the headless Node smoke (`scripts/rp2040-smoke.ts`, `npx tsx`) asserting decoded LCD text / OLED framebuffer. Every task ends with a concrete run command + expected output + a commit.
- DISCOVERY-SPIKE-FIRST: the I2C-decode headless smoke (boot REAL MicroPython ssd1306/LCD firmware -> attach decoders to `chip.rp2040.i2c` -> assert decoded framebuffer/text + a READ-path case) is the lynchpin: it PROVES-OR-FALSIFIES rp2040js issue #135 (SSD1306 on MicroPython 1.20+) against our pinned v1.24.1. Sequence it EARLY (right after the decoders), before any worker/engine/UI wiring. If the smoke falsifies (decoded framebuffer wrong), the implementer ESCALATES — do not paper over it.
- Decoders (`i2c-devices.ts`) are PURE / framework-free (like `rp2040-boot.ts`): no DOM, no postMessage. Engine builds `ImageData`; worker posts the packed 1024-byte framebuffer as a transferable `ArrayBuffer` (per-tick `fb.slice()` copy so the live buffer is never detached).
- ONLY the Pico path changes: `rp2040-protocol.ts`, `i2c-devices.ts` (NEW), `rp2040.worker.ts`, `rp2040-engine.ts`, `components.ts` (defaultProps address), `inspector.tsx` (address control), `scripts/rp2040-smoke.ts`. Uno/ESP32 `InterpreterEngine` + all Spec A / Spec B1 GPIO logic UNTOUCHED.
- Decisions adopted from the spec open-questions: SHIP the inspector address-editing control (one simRole block + a text `Input`); INCLUDE lcd2004 (20x4) as fully supported (the 4-row non-contiguous DDRAM map is in the spec) with a 20x4 smoke case.
- Canonical names: `Lcd1602Decoder` (generic HD44780, dimension-parametric cols/rows; the "1602" name is historical — it also backs the lcd2004 20x4 part), `Ssd1306Decoder`; the display out-message discriminated by `kind` (`"lcd"` text / `"oled"` framebuffer); `DisplaySpec { partId, kind, address, cols?, rows? }`. `I2CMode` is imported from `"rp2040js"` where the callbacks live (NOT a local re-declaration, NOT a deep import).
- Keep lcd/oled rendering; KEEP neopixel no-op + the unsimulated notice (B3). Add the SoftI2C conditional hint (zero connect events -> one-time serial note).

---

## File Structure

- `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/rp2040-protocol.ts` — **MOD**: add `DisplaySpec` type; add `displays: DisplaySpec[]` to the `init` in-variant; add the `display` out-variant (`kind: "lcd"` text / `kind: "oled"` `ArrayBuffer`).
- `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/i2c-devices.ts` — **NEW**: pure `Lcd1602Decoder` (PCF8574→HD44780 4-bit, dimension-parametric) + `Ssd1306Decoder` (128×64 GDDRAM) + the `I2cDecoder` interface. No rp2040js import (decoders ignore the I2C mode).
- `/Users/marimo/Dev/robocode/robocode-frontend/scripts/rp2040-smoke.ts` — **MOD**: add `lcd`, `oled`, `read` smoke variants that boot real MicroPython, attach decoders to `chip.rp2040.i2c`, assert decoded text/framebuffer + read-path boot completion.
- `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/rp2040.worker.ts` — **MOD**: import `I2CMode` from `"rp2040js"`; build address→decoder map from `msg.displays`; install `onConnect`/`onWriteByte`/`onReadByte`/`onStop` on both `chip.rp2040.i2c[0]` and `[1]`; extend `post` to take a transfer list; extend the 33ms coalescer to post a `display` message per dirty decoder; SoftI2C zero-connect hint.
- `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/rp2040-engine.ts` — **MOD**: `displayState` mirror; `onmessage` `case "display"`; `updateOutputs` lcd/oled branches; `buildDisplaySpecs()` wired into the `init` postMessage; drop lcd/oled from `emitUnsimulatedNotice`.
- `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/domain/components.ts` — **MOD**: add default `address` prop to `lcd1602`/`lcd2004`/`ssd1306` `defaultProps`.
- `/Users/marimo/Dev/robocode/robocode-frontend/src/components/studio/inspector.tsx` — **MOD**: add an `I2C Address` text `Input` control for `simRole` `lcd`/`oled`.

---

### Task 1: Protocol types — `DisplaySpec` + extend both message unions

**Files:** `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/rp2040-protocol.ts`, `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/rp2040-engine.ts`

**Interfaces:**
- Produces: `type DisplaySpec = { partId: string; kind: "lcd" | "oled"; address: number; cols?: number; rows?: number }`.
- Produces (extends): `Rp2040InMessage` `init` variant gains `displays: DisplaySpec[]`.
- Produces (extends): `Rp2040OutMessage` gains `{ type: "display"; partId: string; kind: "lcd"; text: string }` and `{ type: "display"; partId: string; kind: "oled"; framebuffer: ArrayBuffer }`.

- [ ] **Step 1: Add `DisplaySpec` + `displays` to the `init` in-message.**

  BEFORE (`rp2040-protocol.ts:5-9`):
  ```ts
  /** main thread -> worker */
  export type Rp2040InMessage =
    | { type: "init"; uf2Url: string; bootromUrl: string; wasmUrl: string; code: string }
    | { type: "input"; gpioInputs: Record<number, boolean>; adcValues: Record<number, number> }
    | { type: "stop" };
  ```
  AFTER:
  ```ts
  /** A display part the worker should ACK on the I2C bus and decode. */
  export type DisplaySpec = {
    partId: string;
    kind: "lcd" | "oled";
    address: number;
    cols?: number; // LCD only; default 16
    rows?: number; // LCD only; default 2
  };

  /** main thread -> worker */
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

- [ ] **Step 2: Add the `display` out-message variants.**

  BEFORE (`rp2040-protocol.ts:11-21`):
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
  | { type: "error"; message: string } // fetch/boot/runtime failure
  | { type: "stop" };                  // worker has halted + cleaned up
  ```
  AFTER:
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
    | { type: "display"; partId: string; kind: "oled"; framebuffer: ArrayBuffer }
  | { type: "error"; message: string } // fetch/boot/runtime failure
  | { type: "stop" };                  // worker has halted + cleaned up
  ```

- [ ] **Step 3: Keep `rp2040-engine.ts` green — add a temporary `displays: []` to the only `Rp2040InMessage`-typed `init` literal.**

  The new required `displays` field on the `init` in-variant makes the engine's existing `init` literal a type error until Task 4 wires `buildDisplaySpecs()`. (The smoke does NOT use this wire type — it calls `bootChip({...})` with its own inline options object, so it is unaffected.) Add a temporary empty array now and replace it in Task 4 Step 5.

  BEFORE (`rp2040-engine.ts:135-142`):
  ```ts
  const init: Rp2040InMessage = {
    type: "init",
    uf2Url: "/sim/RPI_PICO-20241129-v1.24.1.uf2",
    bootromUrl: "/sim/rp2040-bootrom.bin",
    wasmUrl: "/sim/lfs_js.wasm",
    code: this.code,
  };
  ```
  AFTER (temporary, finalised in Task 4):
  ```ts
  const init: Rp2040InMessage = {
    type: "init",
    uf2Url: "/sim/RPI_PICO-20241129-v1.24.1.uf2",
    bootromUrl: "/sim/rp2040-bootrom.bin",
    wasmUrl: "/sim/lfs_js.wasm",
    code: this.code,
    displays: [], // TEMP: replaced with this.buildDisplaySpecs() in Task 4 Step 5
  };
  ```

- [ ] **Step 4: VERIFY — typecheck.**
  - Run: `cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm typecheck`
  - Expected: no errors (exit 0). With the temporary `displays: []` in place the union extension typechecks cleanly across both the protocol and the one engine consumer.

- [ ] **Step 5: Commit.**
  - Run: `cd /Users/marimo/Dev/robocode/robocode-frontend && git add src/lib/sim/rp2040-protocol.ts src/lib/sim/rp2040-engine.ts && git commit -m "B2: protocol DisplaySpec + display message variants"`

---

### Task 2: THE SPIKE — pure decoders (`i2c-devices.ts`) + headless lcd/oled/read smoke variants

This is the lynchpin. It boots REAL MicroPython v1.24.1, drives the standard `ssd1306` driver and a minimal HD44780 4-bit strobe stream through the genuine rp2040js hardware-I2C controller, attaches the decoders to `chip.rp2040.i2c`, and asserts the decoded framebuffer / LCD text + a READ-path boot completion. **This RESOLVES: (1) the rp2040js `RPI2C` callback-wiring contract, (2) decoder correctness, and (3) whether issue #135 affects our pinned v1.24.1.** If the OLED framebuffer is wrong (glyph pixels absent/garbled/mislocated) or the read path desyncs into `OSError: ENODEV`, the implementer **ESCALATES** — do not paper over it.

**Files:** `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/i2c-devices.ts` (NEW), `/Users/marimo/Dev/robocode/robocode-frontend/scripts/rp2040-smoke.ts` (MOD)

**Interfaces:**
- Consumes: `bootChip`, `loadBootromBytes` from `../src/lib/sim/rp2040-boot` (smoke); `I2CMode` from `"rp2040js"` (smoke); `chip.rp2040.i2c[0]`/`[1]` typed `RPI2C[]` (the `onConnect`/`onWriteByte`/`onReadByte`/`onStop` callbacks + `completeConnect(ack)`/`completeWrite(ack)`/`completeRead(value)`/`completeStop()`).
- Produces: `interface I2cDecoder` (`partId`, `address`, `kind: "lcd"|"oled"`, `dirty`, `connect(mode: number)`, `writeByte(value)`, `stop()`); `class Lcd1602Decoder implements I2cDecoder` with `constructor({ partId, address, cols?, rows? })` and `get text(): string`; `class Ssd1306Decoder implements I2cDecoder` with `constructor({ partId, address })`, `get framebufferBytes(): Uint8Array` (the packed 1024-byte GDDRAM), `get displayOn(): boolean`, `get inverse(): boolean`.

- [ ] **Step 1: Create `i2c-devices.ts` with the shared decoder interface (NO rp2040js coupling).**

  Create `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/i2c-devices.ts`:
  ```ts
  // Pure, framework-free I2C virtual-device decoders (same discipline as rp2040-boot.ts:
  // no DOM, no postMessage). Exercised directly by scripts/rp2040-smoke.ts and driven by
  // rp2040.worker.ts. The packed framebuffer / flat text snapshots are wire-ready.
  //
  // The rp2040js I2C "mode" (Write=0 / Read=1) is supplied to connect() by the caller but
  // is ignored by both decoders (displays here are write-only on the data path; the read
  // path is ACKed at the controller, not the decoder). We therefore keep this module free
  // of any rp2040js import and type the mode as a plain number — I2CMode itself is imported
  // from "rp2040js" only where the controller callbacks are installed (smoke + worker).

  export interface I2cDecoder {
    readonly partId: string;
    readonly address: number;
    readonly kind: "lcd" | "oled";
    dirty: boolean;
    connect(mode: number): void;
    writeByte(value: number): void;
    stop(): void;
  }
  ```

- [ ] **Step 2: Add `Lcd1602Decoder` (PCF8574 → HD44780 4-bit, dimension-parametric).**

  Append to `i2c-devices.ts`. Note `pendingRs` and all other fields are declared together at the top of the class (no field declared after a method that uses it):
  ```ts
  // PCF8574 backpack bit map (dominant Arduino/MicroPython I2C-LCD wiring). Kept as named
  // constants so a clone variant is a one-line swap (see spec Risks: PCF8574 bit-wiring).
  const LCD_RS = 0x01; // bit 0
  const LCD_E = 0x04; // bit 2 (Enable strobe)
  const LCD_BL = 0x08; // bit 3 (Backlight)

  export class Lcd1602Decoder implements I2cDecoder {
    readonly partId: string;
    readonly address: number;
    readonly kind = "lcd" as const;
    dirty = false;

    private readonly cols: number;
    private readonly rows: number;
    private buf: string[][];
    private row = 0;
    private col = 0;
    private cursorStep = 1; // +1 / -1 (entry-mode increment direction)
    private displayOn = true;
    private backlight = false;
    private inCgram = false;
    private prevE = false;
    private pendingHighNibble: number | null = null;
    private pendingRs = false;

    constructor(opts: { partId: string; address: number; cols?: number; rows?: number }) {
      this.partId = opts.partId;
      this.address = opts.address;
      this.cols = opts.cols ?? 16;
      this.rows = opts.rows ?? 2;
      this.buf = this.blank();
    }

    private blank(): string[][] {
      return Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => " "));
    }

    connect(_mode: number): void {
      // PCF8574 LCD transactions are stateless across connects; nibble state persists.
    }

    stop(): void {}

    writeByte(b: number): void {
      this.backlight = (b & LCD_BL) !== 0;
      const e = (b & LCD_E) !== 0;
      // HD44780 4-bit: latch a nibble on the FALLING edge of E.
      if (this.prevE && !e) {
        const nibble = (b >> 4) & 0x0f;
        const rs = (b & LCD_RS) !== 0;
        if (this.pendingHighNibble === null) {
          this.pendingHighNibble = nibble; // HIGH nibble first
          this.pendingRs = rs; // rs is held steady across both nibbles by LCD libs
        } else {
          const value = (this.pendingHighNibble << 4) | nibble;
          this.pendingHighNibble = null;
          if (this.pendingRs) this.writeChar(value);
          else this.writeCommand(value);
        }
      }
      this.prevE = e;
    }

    private writeCommand(value: number): void {
      if (value === 0x01) {
        // Clear
        this.buf = this.blank();
        this.row = 0;
        this.col = 0;
      } else if (value === 0x02 || value === 0x03) {
        // Home
        this.row = 0;
        this.col = 0;
      } else if (value >= 0x04 && value <= 0x07) {
        // Entry mode set
        this.cursorStep = value & 0x02 ? 1 : -1;
      } else if (value >= 0x08 && value <= 0x0f) {
        // Display on/off
        this.displayOn = (value & 0x04) !== 0;
      } else if (value >= 0x40 && value <= 0x7f) {
        // Set CGRAM addr -> route subsequent char writes away from the screen
        this.inCgram = true;
      } else if (value >= 0x80) {
        // Set DDRAM addr
        this.inCgram = false;
        const addr = value & 0x7f;
        this.mapDdram(addr);
      }
      // 0x20-0x3F Function Set: ignored.
      this.dirty = true;
    }

    private mapDdram(addr: number): void {
      if (this.rows >= 4) {
        // Non-contiguous 20x4 HD44780 layout.
        if (addr >= 0x54) {
          this.row = 3;
          this.col = addr - 0x54;
        } else if (addr >= 0x40) {
          this.row = 1;
          this.col = addr - 0x40;
        } else if (addr >= 0x14) {
          this.row = 2;
          this.col = addr - 0x14;
        } else {
          this.row = 0;
          this.col = addr;
        }
      } else {
        if (addr >= 0x40) {
          this.row = 1;
          this.col = addr - 0x40;
        } else {
          this.row = 0;
          this.col = addr;
        }
      }
    }

    private writeChar(value: number): void {
      if (this.inCgram) return; // CGRAM glyph write: no-op, keep stream aligned.
      if (this.row >= 0 && this.row < this.rows && this.col >= 0 && this.col < this.cols) {
        this.buf[this.row][this.col] = String.fromCharCode(value);
        this.col = Math.max(0, Math.min(this.cols - 1, this.col + this.cursorStep));
        this.dirty = true;
      }
    }

    /** Flat cols*rows, row-major, each row right-padded to cols, NO separator. */
    get text(): string {
      let out = "";
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) out += this.buf[r][c] ?? " ";
      }
      return out;
    }
  }
  ```

- [ ] **Step 3: Add `Ssd1306Decoder` (128×64 GDDRAM, control-byte demux + param-count model).**

  Append to `i2c-devices.ts`. The `SSD1306_PARAM_COUNT` table is best-effort (the spike validates it — an over/under-counted opcode desyncs and fails the smoke):
  ```ts
  // Param-count class per opcode (the desync-critical model). Anything not listed = 0-param.
  const SSD1306_PARAM_COUNT: Record<number, number> = {
    0x20: 1, // addressing mode
    0x21: 2, // column window
    0x22: 2, // page window
    0x81: 1, // contrast
    0xa8: 1, // multiplex ratio
    0xd3: 1, // display offset
    0xda: 1, // COM pins
    0xd5: 1, // clock divide
    0xd9: 1, // pre-charge
    0xdb: 1, // VCOMH deselect
    0x8d: 1, // charge pump
    0xad: 1, // (alt charge pump on some clones)
    0xd6: 1, // zoom
    0x26: 6, // right horizontal scroll (alignment insurance)
    0x27: 6, // left horizontal scroll
    0x29: 5, // vertical+right scroll
    0x2a: 5, // vertical+left scroll
    0xa3: 2, // set vertical scroll area
  };

  export class Ssd1306Decoder implements I2cDecoder {
    readonly partId: string;
    readonly address: number;
    readonly kind = "oled" as const;
    dirty = false;

    private fb = new Uint8Array(1024); // 8 pages x 128 cols, page-major
    private displayOnFlag = true;
    private inverseFlag = false;
    private colStart = 0;
    private colEnd = 127;
    private pageStart = 0;
    private pageEnd = 7;
    private colPtr = 0;
    private pagePtr = 0;

    // Per-transaction parse state.
    private sawCtrl = false; // have we consumed this write's leading control byte?
    private dataMode = false; // 0x40 stream -> GDDRAM data
    private streamCmd = false; // 0x00 stream -> all remaining bytes are command bytes
    private singleCmd = false; // 0x80 framing -> exactly the next byte is a command
    private paramsLeft = 0;
    private pendingOpcode = -1;
    private params: number[] = [];

    constructor(opts: { partId: string; address: number }) {
      this.partId = opts.partId;
      this.address = opts.address;
    }

    connect(_mode: number): void {
      // New transaction: re-read the control byte; command-continuation counters persist
      // within an opcode but the leading control byte is per-write.
      this.sawCtrl = false;
      this.dataMode = false;
      this.streamCmd = false;
      this.singleCmd = false;
    }

    stop(): void {}

    writeByte(b: number): void {
      if (!this.sawCtrl) {
        this.sawCtrl = true;
        const dc = (b >> 6) & 1;
        const co = (b >> 7) & 1;
        if (dc === 1) {
          this.dataMode = true; // 0x40
        } else if (co === 1) {
          this.singleCmd = true; // 0x80: next one byte is a command
        } else {
          this.streamCmd = true; // 0x00: remaining bytes are command bytes
        }
        return;
      }
      if (this.dataMode) {
        this.writeData(b);
        return;
      }
      // command byte (either 0x00 stream, or the single byte after 0x80)
      this.feedCommandByte(b);
      if (this.singleCmd) this.sawCtrl = false; // expect another control byte next write
    }

    private feedCommandByte(b: number): void {
      if (this.paramsLeft > 0) {
        this.params.push(b);
        this.paramsLeft--;
        if (this.paramsLeft === 0) this.applyOpcode(this.pendingOpcode, this.params);
        return;
      }
      this.pendingOpcode = b;
      this.params = [];
      const count = SSD1306_PARAM_COUNT[b] ?? 0;
      if (count === 0) this.applyOpcode(b, []);
      else this.paramsLeft = count;
    }

    private applyOpcode(op: number, params: number[]): void {
      switch (op) {
        case 0x21: // column window
          this.colStart = params[0] & 0x7f;
          this.colEnd = params[1] & 0x7f;
          this.colPtr = this.colStart;
          this.pagePtr = this.pageStart;
          break;
        case 0x22: // page window
          this.pageStart = params[0] & 0x07;
          this.pageEnd = params[1] & 0x07;
          this.pagePtr = this.pageStart;
          this.colPtr = this.colStart;
          break;
        case 0xae:
          this.displayOnFlag = false;
          break;
        case 0xaf:
          this.displayOnFlag = true;
          break;
        case 0xa6:
          this.inverseFlag = false;
          break;
        case 0xa7:
          this.inverseFlag = true;
          break;
        // 0x20 (addressing mode) + all skip-set opcodes: consumed by class, no effect.
      }
      this.dirty = true;
    }

    private writeData(value: number): void {
      this.fb[this.pagePtr * 128 + this.colPtr] = value;
      this.colPtr++;
      if (this.colPtr > this.colEnd) {
        this.colPtr = this.colStart;
        this.pagePtr++;
        if (this.pagePtr > this.pageEnd) this.pagePtr = this.pageStart;
      }
      this.dirty = true;
    }

    /** Packed 1024-byte GDDRAM (page-major, 8 pages x 128 cols, LSB = top row of page). */
    get framebufferBytes(): Uint8Array {
      return this.fb;
    }
    get displayOn(): boolean {
      return this.displayOnFlag;
    }
    get inverse(): boolean {
      return this.inverseFlag;
    }
  }
  ```

- [ ] **Step 4: VERIFY decoders compile (typecheck).**
  - Run: `cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm typecheck`
  - Expected: no errors (exit 0). This proves the pure decoder types before the smoke wires them. `pendingRs` is declared with the other fields, so there is no field-ordering ambiguity to resolve.

- [ ] **Step 5: Extend `scripts/rp2040-smoke.ts` — new firmware programs + decoder/`I2CMode` imports + MODE branches.**

  Add the imports after the existing boot import (`rp2040-smoke.ts:11-15`). `I2CMode` is imported from `"rp2040js"` (its public root export), NOT re-declared:
  ```ts
  import { Lcd1602Decoder, Ssd1306Decoder, type I2cDecoder } from "../src/lib/sim/i2c-devices";
  import { I2CMode } from "rp2040js";
  ```
  Add new firmware programs after the existing `PWM_PY` (`rp2040-smoke.ts:35`). MicroPython v1.24.1 ships the `ssd1306` driver in firmware; the LCD smoke writes a minimal HD44780 4-bit strobe stream via raw `machine.I2C` PCF8574 writes (sufficient to exercise the decoder's nibble-latch + DDRAM path), keeping the smoke self-contained:
  ```ts
  // SSD1306: standard MicroPython framebuf driver renders "HI" then pushes the buffer.
  const OLED_PY = [
    "from machine import Pin, I2C",
    "import ssd1306",
    "i2c = I2C(0, scl=Pin(5), sda=Pin(4))",
    "oled = ssd1306.SSD1306_I2C(128, 64, i2c)",
    'oled.text("HI", 0, 0)',
    "oled.show()",
    'print("OLED_OK")',
  ].join("\n") + "\n";

  // I2C-LCD: a minimal HD44780 4-bit strobe stream sufficient to exercise the decoder's
  // nibble latch + DDRAM map (NOT a byte-for-byte replica of any one backpack library;
  // real PCF8574 libs use a 3-write E-pulse pattern, but the decoder latches on E's
  // falling edge regardless, so a 2-write rising/falling pair per nibble suffices here).
  // RS=bit0, E=bit2, BL=bit3, D4-D7=bits4-7.
  const LCD_PY = [
    "from machine import Pin, I2C",
    "import time",
    "ADDR = 0x27",
    "i2c = I2C(0, scl=Pin(5), sda=Pin(4))",
    "def strobe(d):",
    "    i2c.writeto(ADDR, bytes([d | 0x04 | 0x08]))",  // E high + backlight
    "    i2c.writeto(ADDR, bytes([(d & ~0x04) | 0x08]))",  // E low (falling edge latch)
    "def write4(nib, rs):",
    "    strobe((nib & 0xF0) | (0x01 if rs else 0x00))",
    "def cmd(c):",
    "    write4(c & 0xF0, 0)",
    "    write4((c << 4) & 0xF0, 0)",
    "def chr_(ch):",
    "    write4(ord(ch) & 0xF0, 1)",
    "    write4((ord(ch) << 4) & 0xF0, 1)",
    "for c in (0x33,0x32,0x28,0x0C,0x06,0x01):",  // 4-bit init + display on + clear
    "    cmd(c); time.sleep_ms(2)",
    "cmd(0x80)",  // DDRAM addr 0,0
    'for ch in "HI": chr_(ch)',
    'print("LCD_OK")',
  ].join("\n") + "\n";

  // READ path: ACKed display address that the firmware also READS from (PCF8574 read-back).
  const READ_PY = [
    "from machine import Pin, I2C",
    "ADDR = 0x27",
    "i2c = I2C(0, scl=Pin(5), sda=Pin(4))",
    "i2c.writeto(ADDR, bytes([0x08]))",
    "v = i2c.readfrom(ADDR, 1)",  // must not raise ENODEV (completeRead(0xff))
    'print("READ_OK", v[0])',
  ].join("\n") + "\n";
  ```
  Replace the MODE selector (`rp2040-smoke.ts:36`):
  ```ts
  const MODE = (() => {
    const a = process.argv[2];
    return a === "pwm" || a === "lcd" || a === "oled" || a === "read" ? a : "blink";
  })();
  const CODE_BY_MODE: Record<string, string> = {
    blink: MAIN_PY,
    pwm: PWM_PY,
    lcd: LCD_PY,
    oled: OLED_PY,
    read: READ_PY,
  };
  ```

- [ ] **Step 6: Wire decoder attachment + assertions into the smoke `main()`.**

  Change the MARKER (`rp2040-smoke.ts:39`):
  ```ts
  const MARKER =
    MODE === "pwm" ? "PWM_OK"
    : MODE === "lcd" ? "LCD_OK"
    : MODE === "oled" ? "OLED_OK"
    : MODE === "read" ? "READ_OK"
    : "SMOKE_OK";
  ```
  Change the `code:` line in the `bootChip({...})` call (`rp2040-smoke.ts:59`) to `code: CODE_BY_MODE[MODE],`.

  Relax `settle()` (`rp2040-smoke.ts:49-54`) so non-blink/non-pwm modes resolve on `sawSmoke` alone:
  ```ts
  const settle = () => {
    if (MODE === "blink" && sawSmoke && gpio25Toggled && !done) {
      done = true;
      doneResolve();
    } else if (MODE !== "blink" && MODE !== "pwm" && sawSmoke && !done) {
      done = true;
      doneResolve();
    }
  };
  ```

  After `bootChip(...)` resolves but before `chip.start()` (between `rp2040-smoke.ts:69` and `:86`), attach decoders to BOTH controllers, routing by address (the EXACT contract the worker will port — typed `I2cDecoder` so the worker and smoke share one interface):
  ```ts
  // Attach decoders to BOTH I2C controllers, routing by address (same I2cDecoder contract
  // the worker uses). The 0xff read-back ACKs a PCF8574 read so the READ path cannot ENODEV.
  const lcd = new Lcd1602Decoder({ partId: "lcd", address: 0x27, cols: 16, rows: 2 });
  const oled = new Ssd1306Decoder({ partId: "oled", address: 0x3c });
  const byAddr = new Map<number, I2cDecoder>([
    [0x27, lcd],
    [0x3c, oled],
  ]);
  for (const bus of [chip.rp2040.i2c[0], chip.rp2040.i2c[1]]) {
    let active: I2cDecoder | null = null;
    bus.onConnect = (address: number, mode: I2CMode) => {
      active = byAddr.get(address) ?? null;
      if (active) {
        active.connect(mode);
        bus.completeConnect(true); // ACK matched display address
      } else {
        bus.completeConnect(false); // NACK everything else
      }
    };
    bus.onWriteByte = (value: number) => {
      if (active) {
        active.writeByte(value);
        bus.completeWrite(true);
      } else {
        bus.completeWrite(false);
      }
    };
    bus.onReadByte = (_ack: boolean) => {
      bus.completeRead(0xff); // ACKed display read -> 0xff ("not busy"); see spec Error handling
    };
    bus.onStop = () => {
      active?.stop();
      bus.completeStop();
      active = null;
    };
    // onStart left at its rp2040js default (rp2040js drives onConnect after start).
  }
  ```

  Add the post-race assertion blocks (after the `pwm` block at `rp2040-smoke.ts:90-108`, before the blink tail at `:110`). The marker is printed strictly AFTER the last bus write in every program (the `print(...)` is the last statement), so `sawSmoke` implies a complete framebuffer/text snapshot — an empty fb is a genuine decode failure, not a race:
  ```ts
  if (MODE === "oled") {
    chip.stop();
    const fb = oled.framebufferBytes;
    const lit = fb.reduce((n, byte) => n + (byte ? 1 : 0), 0);
    console.log("ready:", ready, "OLED_OK:", sawSmoke, "lit fb bytes:", lit, "displayOn:", oled.displayOn);
    if (!sawSmoke) throw new Error("FAIL: OLED_OK not seen — ssd1306 driver never ran");
    if (lit === 0)
      throw new Error("FAIL: OLED framebuffer all-blank — #135 SUSPECTED on v1.24.1, ESCALATE");
    // "HI" at (0,0): framebuf renders an 8x8 glyph per char at y=0 -> page 0 (top 8 rows),
    // cols 0..15 (2 chars x 8px). Assert the RIGHT region lit AND ONLY the right region:
    //   - page 0, cols 0..15: a real 2-glyph render lights several columns -> require >= 6.
    //   - page 1 (rows 8..15), same cols: text at y=0 cannot touch it -> require all blank.
    let page0Lit = 0;
    for (let x = 0; x < 16; x++) if (fb[x]) page0Lit++;
    if (page0Lit < 6)
      throw new Error(`FAIL: only ${page0Lit} lit cols in page0 cols0-15 where 'HI' should render — decode garbled, ESCALATE`);
    for (let x = 0; x < 16; x++)
      if (fb[128 + x] !== 0)
        throw new Error(`FAIL: page1 col${x} lit but 'HI' at y=0 cannot reach page1 — pagePtr off-by-one, ESCALATE`);
    console.log("PASS (oled)");
    return;
  }

  if (MODE === "lcd") {
    chip.stop();
    const text = lcd.text;
    console.log("ready:", ready, "LCD_OK:", sawSmoke, "text:", JSON.stringify(text));
    if (!sawSmoke) throw new Error("FAIL: LCD_OK not seen — LCD strobe program never ran");
    const expected = "HI" + " ".repeat(14) + " ".repeat(16); // 16x2 flat, "HI" at row0 col0
    if (text.length !== 32) throw new Error(`FAIL: text length ${text.length} != 32`);
    if (text !== expected)
      throw new Error(`FAIL: decoded LCD text ${JSON.stringify(text)} != ${JSON.stringify(expected)}`);
    console.log("PASS (lcd)");
    return;
  }

  if (MODE === "read") {
    chip.stop();
    console.log("ready:", ready, "READ_OK:", sawSmoke);
    if (!sawSmoke)
      throw new Error("FAIL: READ_OK not seen — readfrom desynced/ENODEV; completeRead(0xff) wrong, ESCALATE");
    console.log("PASS (read)");
    return;
  }
  ```

- [ ] **Step 7: VERIFY the spike — run all three I2C variants.**
  - Run: `cd /Users/marimo/Dev/robocode/robocode-frontend && npx tsx scripts/rp2040-smoke.ts oled`
    - Expected: `[serial] OLED_OK` then `... lit fb bytes: <N> displayOn: true` (N > 0) then `PASS (oled)` (exit 0). The assertion requires >= 6 lit columns in page-0 cols 0-15 AND zero lit bytes in page-1 cols 0-15 — a subtly-wrong decoder (page off-by-one, column wrap) FAILS rather than rubber-stamping.
  - Run: `cd /Users/marimo/Dev/robocode/robocode-frontend && npx tsx scripts/rp2040-smoke.ts lcd`
    - Expected: `[serial] LCD_OK` then `text: "HI              ..."` (32 chars total) then `PASS (lcd)` (exit 0).
  - Run: `cd /Users/marimo/Dev/robocode/robocode-frontend && npx tsx scripts/rp2040-smoke.ts read`
    - Expected: `[serial] READ_OK 255` then `PASS (read)` (exit 0).
  - **ESCALATION GATE:** if `oled` fails with "all-blank — #135 SUSPECTED" / "decode garbled" / "pagePtr off-by-one", or `read` fails with ENODEV, STOP and escalate per the Global Constraints — do NOT continue to Task 3. A blank/garbled OLED framebuffer means I2C-controller modelling on v1.24.1 is suspect (issue #135 falsified-against); a desynced read means `completeRead(0xff)` is wrong. Either falsifies a load-bearing assumption.
  - Run the existing variants to confirm no regression: `npx tsx scripts/rp2040-smoke.ts` (expect `PASS`) and `npx tsx scripts/rp2040-smoke.ts pwm` (expect `PASS (pwm)`).

- [ ] **Step 8: Commit.**
  - Run: `cd /Users/marimo/Dev/robocode/robocode-frontend && git add src/lib/sim/i2c-devices.ts scripts/rp2040-smoke.ts && git commit -m "B2: pure I2C decoders + headless lcd/oled/read smoke spike (proves #135 on v1.24.1)"`

---

### Task 3: Worker wiring — attach `RPI2C` callbacks + display coalescer + SoftI2C hint

The decoder correctness and the exact `RPI2C` callback contract are already proven by Task 2 (the smoke exercises the identical attach + complete* sequence against the same `I2cDecoder` interface). This task ports that proven wiring into the worker and adds the coalescer post + the SoftI2C zero-connect hint. Anchor all edits by the BEFORE snippet, not the line number — intra-task insertions shift later lines.

**Files:** `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/rp2040.worker.ts`

**Interfaces:**
- Consumes: `DisplaySpec` (from `./rp2040-protocol`); `Lcd1602Decoder`, `Ssd1306Decoder`, `I2cDecoder` (from `./i2c-devices`); `I2CMode` (from `"rp2040js"`); `chip.rp2040.i2c[0]`/`[1]`.
- Produces: `display` out-messages (LCD `text`; OLED transferred `ArrayBuffer`) via the 33ms coalescer; a one-time SoftI2C serial note.

- [ ] **Step 1: Imports + transfer-aware `post` helper + module-level decoder state.**

  BEFORE (`rp2040.worker.ts:3-16`):
  ```ts
  import type { Rp2040InMessage, Rp2040OutMessage } from "./rp2040-protocol";
  import { bootChip, loadBootromBytes, decodePwmDuty, type BootedChip } from "./rp2040-boot";

  const ctx = self as unknown as Worker;
  const post = (m: Rp2040OutMessage) => ctx.postMessage(m);

  let chip: BootedChip | null = null;
  let halted = false;
  let removeListeners: Array<() => void> = [];
  let coalescer: ReturnType<typeof setInterval> | null = null;
  let readyTimeout: ReturnType<typeof setTimeout> | null = null;

  const dirtyOut = new Map<number, boolean>();
  const lastPwm = new Map<number, number>();
  ```
  AFTER:
  ```ts
  import type { Rp2040InMessage, Rp2040OutMessage } from "./rp2040-protocol";
  import { bootChip, loadBootromBytes, decodePwmDuty, type BootedChip } from "./rp2040-boot";
  import { Lcd1602Decoder, Ssd1306Decoder, type I2cDecoder } from "./i2c-devices";
  import { I2CMode } from "rp2040js";

  const ctx = self as unknown as Worker;
  const post = (m: Rp2040OutMessage, transfer?: Transferable[]) =>
    ctx.postMessage(m, transfer ?? []);

  let chip: BootedChip | null = null;
  let halted = false;
  let removeListeners: Array<() => void> = [];
  let coalescer: ReturnType<typeof setInterval> | null = null;
  let readyTimeout: ReturnType<typeof setTimeout> | null = null;

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

- [ ] **Step 2: Set `readyAt` in the `onReady` callback.**

  BEFORE (`rp2040.worker.ts:33-37`):
  ```ts
      onReady: () => {
        if (halted) return;
        if (readyTimeout) clearTimeout(readyTimeout);
        post({ type: "ready" });
      },
  ```
  AFTER:
  ```ts
      onReady: () => {
        if (halted) return;
        if (readyTimeout) clearTimeout(readyTimeout);
        readyAt = Date.now();
        post({ type: "ready" });
      },
  ```

- [ ] **Step 3: Install the I2C callbacks in `init()`, immediately before `chip.start();`.**

  Insert this block immediately before `chip.start();` (BEFORE anchor: the line `chip.start();` near `rp2040.worker.ts:81`), inside `init()`:
  ```ts
  // Build address -> decoder map from the diagram's displays, then install callbacks on
  // BOTH I2C controllers and route purely by address (no bus field on DisplaySpec).
  const byAddr = new Map<number, I2cDecoder>();
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
    byAddr.set(d.address, dec);
  }
  i2cDecoders = [...byAddr.values()];

  for (const bus of [chip.rp2040.i2c[0], chip.rp2040.i2c[1]]) {
    let active: I2cDecoder | null = null;
    bus.onConnect = (address: number, mode: I2CMode) => {
      sawAnyConnect = true;
      active = byAddr.get(address) ?? null;
      if (active) {
        active.connect(mode);
        bus.completeConnect(true); // ACK matched display address
      } else {
        bus.completeConnect(false); // NACK everything else (stock rp2040js behaviour)
      }
    };
    bus.onWriteByte = (value: number) => {
      if (active) {
        active.writeByte(value);
        bus.completeWrite(true);
      } else {
        bus.completeWrite(false);
      }
    };
    bus.onReadByte = (_ack: boolean) => {
      // Displays are write-only on the data path; reply 0xff ("not busy", = rp2040js
      // default) so a PCF8574 read-back / busy-flag poll proceeds. Read path proven by
      // the Task-2 smoke. Single behaviour whether or not a display is active.
      bus.completeRead(0xff);
    };
    bus.onStop = () => {
      active?.stop();
      bus.completeStop();
      active = null;
    };
    // onStart left at its rp2040js default. No symmetric teardown: stop() terminate()s the
    // whole worker (engine teardown), so the callbacks die with it — no leak. If the worker
    // is ever made reusable across runs, add explicit callback detach here.
  }
  ```

- [ ] **Step 4: Extend the 33ms coalescer to post display deltas + the SoftI2C hint.**

  BEFORE (`rp2040.worker.ts:69-72`, the tail of the existing coalescer body):
  ```ts
      if (Object.keys(outputs).length || Object.keys(pwm).length) {
        post({ type: "gpio", outputs, pwm });
      }
    }, 33);
  ```
  AFTER:
  ```ts
      if (Object.keys(outputs).length || Object.keys(pwm).length) {
        post({ type: "gpio", outputs, pwm });
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
          post({ type: "display", partId: dec.partId, kind: "oled", framebuffer: buf }, [buf]);
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
    }, 33);
  ```

- [ ] **Step 5: VERIFY — typecheck.**
  - Run: `cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm typecheck`
  - Expected: no errors (exit 0). The worker's decode logic is behaviorally proven by Task 2 (identical attach + complete* contract against the same `I2cDecoder`); typecheck confirms the protocol/types align. Note: `bus.onConnect`'s `mode` param is now the real rp2040js `I2CMode` (imported), and the decoder's `connect(mode: number)` accepts it (`I2CMode` is a number-based enum) — if typecheck ever flags an assignability mismatch here, the param is already `number`-compatible; do NOT introduce a local enum.

- [ ] **Step 6: Commit.**
  - Run: `cd /Users/marimo/Dev/robocode/robocode-frontend && git add src/lib/sim/rp2040.worker.ts && git commit -m "B2: worker installs I2C callbacks on both controllers + display coalescer + SoftI2C hint"`

---

### Task 4: Engine render — `displayState` mirror, `display` case, lcd/oled branches, `buildDisplaySpecs()`, notice trim

Anchor edits by the BEFORE snippet, not the line number. Note the `ledbar` BEFORE block below is the REAL case body (the elided `{ ... }` from the original facts has been resolved against the source).

**Files:** `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/rp2040-engine.ts`

**Interfaces:**
- Consumes: `Rp2040OutMessage` `display` variant; `this.diagram.parts`; `COMPONENT_BY_ID[part.type].simRole`; `getPartEl(part.id)`.
- Produces: `private displayState`; `case "display"` in `onmessage`; lcd/oled branches in `updateOutputs`; `private buildDisplaySpecs(): DisplaySpec[]` wired into the `init` postMessage; trimmed `emitUnsimulatedNotice`.

- [ ] **Step 1: Add the `displayState` mirror field + import `DisplaySpec`.**

  In the import that already pulls `Rp2040InMessage`/`Rp2040OutMessage` from `./rp2040-protocol`, add `DisplaySpec` (it is a `type`, so add it to the existing `import type { ... }` if that import is type-only, else to the value import). Then add the field next to the other private mirrors in the class (alongside `gpioOut`/`pwmDuty`):
  ```ts
  private displayState = new Map<
    string,
    { kind: "lcd"; text: string } | { kind: "oled"; framebuffer: Uint8Array }
  >();
  ```

- [ ] **Step 2: Add `case "display":` to the `onmessage` switch.**

  BEFORE (`rp2040-engine.ts:101-105`):
  ```ts
      case "gpio":
        for (const [k, v] of Object.entries(msg.outputs)) this.gpioOut[Number(k)] = v;
        for (const [k, v] of Object.entries(msg.pwm)) this.pwmDuty[Number(k)] = v;
        this.updateOutputs();
        break;
  ```
  AFTER (insert the `display` case after the `gpio` case):
  ```ts
      case "gpio":
        for (const [k, v] of Object.entries(msg.outputs)) this.gpioOut[Number(k)] = v;
        for (const [k, v] of Object.entries(msg.pwm)) this.pwmDuty[Number(k)] = v;
        this.updateOutputs();
        break;
      case "display":
        if (msg.kind === "oled") {
          // ArrayBuffer (transferred over the wire) -> Uint8Array for engine-side expansion.
          this.displayState.set(msg.partId, {
            kind: "oled",
            framebuffer: new Uint8Array(msg.framebuffer),
          });
        } else {
          this.displayState.set(msg.partId, { kind: "lcd", text: msg.text });
        }
        this.updateOutputs();
        break;
  ```

- [ ] **Step 3: Replace the lcd/oled no-op slot with real branches in `updateOutputs`.**

  BEFORE (the tail of the `updateOutputs` simRole switch — `ledbar` case at `rp2040-engine.ts:278-287` followed by the no-op comment at `:289`):
  ```ts
        case "ledbar": {
          const values: number[] = [];
          for (let i = 1; i <= 10; i++) {
            const b = this.boardPinFor(part.id, `A${i}`);
            if (!b || isPower(b)) { values.push(0); continue; }
            const gp = normGpio(b);
            values.push(gp !== null && this.gpioOut[gp] ? 1 : 0);
          }
          try { el.values = values; } catch {}
          break;
        }
        // lcd / oled / neopixel: NO-OP on canvas in B1 (covered by the one-time serial notice)
      }
  ```
  AFTER (add explicit `lcd` and `oled` cases; keep `neopixel` as the no-op):
  ```ts
        case "ledbar": {
          const values: number[] = [];
          for (let i = 1; i <= 10; i++) {
            const b = this.boardPinFor(part.id, `A${i}`);
            if (!b || isPower(b)) { values.push(0); continue; }
            const gp = normGpio(b);
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
          const s = this.displayState.get(part.id);
          if (s?.kind === "oled") {
            // Build a fresh ImageData(128,64) = the SSD1306 SCREEN size (NOT the 150x116
            // bezel). Assigning a NEW reference to el.imageData triggers Lit updated()->redraw().
            const img = new ImageData(128, 64);
            const fb = s.framebuffer;
            for (let y = 0; y < 64; y++) {
              for (let x = 0; x < 128; x++) {
                // page-major, LSB = top row of the page (SSD1306 GDDRAM convention)
                const on = (fb[(y >> 3) * 128 + x] >> (y & 7)) & 1;
                const i = (y * 128 + x) * 4;
                const v = on ? 255 : 0; // white-on-black lit; exact RGBA confirmed in Task 6
                img.data[i] = v;
                img.data[i + 1] = v;
                img.data[i + 2] = v;
                img.data[i + 3] = 255;
              }
            }
            try {
              el.imageData = img; // fresh reference -> Lit updated() -> redraw() auto-fires
            } catch {}
          }
          break;
        }
        // neopixel: NO-OP on canvas (B3; covered by the one-time serial notice)
      }
  ```
  Note on `inverse`/`displayOn` (DELIBERATE B2 deferral, single source of truth): the spec's literal pixel model is `on = bit XOR inverse`, blanking when `!displayOn`. The standard MicroPython `ssd1306` driver issues neither `0xA7` (inverse) nor a persistent `0xAE` (off) in normal use, so the raw-bit path above is correct for B2. The decoder retains `inverse`/`displayOn` getters but they are NOT carried on the `display` wire message this round; a follow-up extends the message to carry them and applies the XOR/blank here. Keeping the flags decoder-side avoids duplicating that state in the engine.

- [ ] **Step 4: Add `buildDisplaySpecs()`.**

  Add this private method to the engine class (near `startInputForwarding`/`updateOutputs`):
  ```ts
  private buildDisplaySpecs(): DisplaySpec[] {
    const specs: DisplaySpec[] = [];
    for (const part of this.diagram.parts) {
      const role = COMPONENT_BY_ID[part.type]?.simRole;
      if (role !== "lcd" && role !== "oled") continue;
      const kind = role; // "lcd" | "oled"
      const raw = part.props?.address;
      const def = kind === "oled" ? 0x3c : 0x27;
      let address = def;
      if (typeof raw === "number" && Number.isFinite(raw)) address = raw;
      else if (typeof raw === "string") {
        const parsed = parseInt(raw, raw.trim().toLowerCase().startsWith("0x") ? 16 : 10);
        if (Number.isFinite(parsed)) address = parsed; // malformed -> NaN -> keep default
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

- [ ] **Step 5: Wire `buildDisplaySpecs()` into the `init` postMessage (replace the Task-1 temp).**

  BEFORE (the temp from Task 1, in the `init` literal near `rp2040-engine.ts:135-143`):
  ```ts
      code: this.code,
      displays: [], // TEMP: replaced with this.buildDisplaySpecs() in Task 4 Step 5
    };
  ```
  AFTER:
  ```ts
      code: this.code,
      displays: this.buildDisplaySpecs(),
    };
  ```

- [ ] **Step 6: Trim `emitUnsimulatedNotice` to NeoPixel only.**

  BEFORE (`rp2040-engine.ts:296-300`):
  ```ts
    const roles = new Set(
      this.diagram.parts
        .map((p) => COMPONENT_BY_ID[p.type]?.simRole)
        .filter((r): r is string => r === "lcd" || r === "oled" || r === "neopixel"),
    );
  ```
  AFTER:
  ```ts
    const roles = new Set(
      this.diagram.parts
        .map((p) => COMPONENT_BY_ID[p.type]?.simRole)
        .filter((r): r is string => r === "neopixel"),
    );
  ```
  Also update the notice text (`rp2040-engine.ts:304`) to drop LCD/OLED:
  ```ts
    this.cb.onSerial(
      "note: NeoPixel (WS2812) runs in firmware but is not yet drawn on the canvas (coming in B3).",
    );
  ```

- [ ] **Step 7: VERIFY — typecheck.**
  - Run: `cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm typecheck`
  - Expected: no errors (exit 0). `el.text`/`el.backlight`/`el.imageData` are accessed through the existing `el as (HTMLElement & Record<string, unknown>)` cast (`rp2040-engine.ts:212`), so they typecheck as `unknown`-keyed writes inside the `try {}` blocks.

- [ ] **Step 8: Commit.**
  - Run: `cd /Users/marimo/Dev/robocode/robocode-frontend && git add src/lib/sim/rp2040-engine.ts && git commit -m "B2: engine renders LCD text + OLED ImageData, buildDisplaySpecs, notice -> neopixel only"`

---

### Task 5: Component catalog default address + inspector address control

**Files:** `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/domain/components.ts`, `/Users/marimo/Dev/robocode/robocode-frontend/src/components/studio/inspector.tsx`

**Interfaces:**
- Consumes: `ComponentDef.defaultProps`; `addPart` shallow-copy of `defaultProps` (`store.ts:183`); `setProp(id, key, value)`; `part.props?.address`; `def.simRole`.
- Produces: default `address` on the three display defs; an `I2C Address` `Input` in the inspector for `simRole` `lcd`/`oled`.

- [ ] **Step 1: Add default `address` to the three display defs.**

  BEFORE (`components.ts:63-65`):
  ```ts
  { id: "lcd1602", name: "LCD 16x2", category: "display", tag: "wokwi-lcd1602", simRole: "lcd", description: "16x2 character LCD (HD44780).", defaultProps: { pins: "i2c" }, keywords: ["screen", "text", "hd44780"] },
  { id: "lcd2004", name: "LCD 20x4", category: "display", tag: "wokwi-lcd2004", simRole: "lcd", description: "20x4 character LCD.", defaultProps: { pins: "i2c" }, keywords: ["screen", "text"] },
  { id: "ssd1306", name: "OLED 0.96\"", category: "display", tag: "wokwi-ssd1306", simRole: "oled", description: "128x64 OLED display (SSD1306).", keywords: ["oled", "graphics", "screen"] },
  ```
  AFTER:
  ```ts
  { id: "lcd1602", name: "LCD 16x2", category: "display", tag: "wokwi-lcd1602", simRole: "lcd", description: "16x2 character LCD (HD44780).", defaultProps: { pins: "i2c", address: "0x27" }, keywords: ["screen", "text", "hd44780"] },
  { id: "lcd2004", name: "LCD 20x4", category: "display", tag: "wokwi-lcd2004", simRole: "lcd", description: "20x4 character LCD.", defaultProps: { pins: "i2c", address: "0x27" }, keywords: ["screen", "text"] },
  { id: "ssd1306", name: "OLED 0.96\"", category: "display", tag: "wokwi-ssd1306", simRole: "oled", description: "128x64 OLED display (SSD1306).", defaultProps: { address: "0x3C" }, keywords: ["oled", "graphics", "screen"] },
  ```

- [ ] **Step 2: Add the inspector address control.**

  Insert after the existing `pushbutton` block and before the closing `</div>` of the `space-y-2.5` group (after the pushbutton block's closing `)}` near `inspector.tsx:74`):
  ```tsx
  {(def.simRole === "lcd" || def.simRole === "oled") && (
    <div className="space-y-1">
      <Label htmlFor="i2c-address" className="text-xs text-white/70">I2C Address</Label>
      <Input
        id="i2c-address"
        value={String(part.props?.address ?? (def.simRole === "oled" ? "0x3C" : "0x27"))}
        onChange={(e) => setProp(part.id, "address", e.target.value)}
        className="h-8 border-white/15 bg-white/5 text-white"
      />
    </div>
  )}
  ```
  No new imports — `Input` (`inspector.tsx:7`) and `Label` (`inspector.tsx:8`) are already imported.

- [ ] **Step 3: VERIFY — typecheck.**
  - Run: `cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm typecheck`
  - Expected: no errors (exit 0). `address: "0x27"` fits `Record<string, string | number | boolean>` (`diagram.ts:10`); `setProp(part.id, "address", e.target.value)` passes a `string`.

- [ ] **Step 4: Commit.**
  - Run: `cd /Users/marimo/Dev/robocode/robocode-frontend && git add src/lib/domain/components.ts src/components/studio/inspector.tsx && git commit -m "B2: default I2C address props + inspector address control for lcd/oled"`

---

### Task 6: Manual Studio verification (browser)

This task verifies the browser-only remainder: the `el.imageData → canvas` pixel write (and exact lit/off RGBA) and `el.text` on the wokwi elements. Everything up to the element-property write is already headless-verified by Task 2.

**Files:** none (manual). Run the dev server and exercise the Studio.

- [ ] **Step 1: Start the dev server.**
  - Run: `cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm dev` (background). Open the Studio, select the **Pico** board.

- [ ] **Step 2: OLED render.** Drop a `ssd1306` (OLED 0.96"), wire I2C to the Pico, paste MicroPython that does `from machine import Pin, I2C; import ssd1306; i2c=I2C(0, scl=Pin(5), sda=Pin(4)); oled=ssd1306.SSD1306_I2C(128,64,i2c); oled.text("HELLO",0,0); oled.show()`. Run.
  - Expected: the "HELLO" glyph pixels appear lit (white) on the OLED canvas within ~1s of boot; background black. Confirm the lit RGBA reads as `(255,255,255,255)`; if the wokwi element expects a tinted/blue lit pixel instead of pure white, adjust the `v = on ? 255 : 0` mapping in `rp2040-engine.ts` (Task 4 Step 3) — this is the one runtime-verified RGBA per the spec.

- [ ] **Step 3: LCD render.** Drop an `lcd1602` (LCD 16x2, default `address 0x27`), wire I2C, run firmware that drives a standard I2C-LCD library writing `"HI"`. (Note: a real PCF8574 backpack library uses a 3-write E-pulse pattern that differs from the 2-write strobe used in the Task-2 smoke; the decoder latches on E's falling edge regardless, so both render correctly — this step confirms the real-library path.)
  - Expected: `HI` shows at row 0 col 0; backlight on; remaining cells blank.

- [ ] **Step 4: Address change.** With the OLED selected, change the inspector **I2C Address** from `0x3C` to a value matching the firmware, re-run.
  - Expected: still renders. Set a non-matching address -> nothing renders (NACKed) — confirms address routing.

- [ ] **Step 5: Two same-type displays.** Drop two `ssd1306` at distinct addresses (`0x3C`, `0x3D`), drive both from firmware.
  - Expected: each renders its own framebuffer independently.

- [ ] **Step 6: LCD2004.** Drop an `lcd2004`, write to all four rows (DDRAM `0x00`/`0x40`/`0x14`/`0x54` row bases).
  - Expected: all four rows render in the correct positions (non-contiguous DDRAM map). Confirms `LCD2004Element` (which extends `LCD1602Element`, inheriting `text`/`backlight`) renders via the same `el.text` write.

- [ ] **Step 7: Regressions.** Switch to **Uno** and **ESP32**: confirm B1 GPIO (LED blink, RGB, PWM) still works unchanged (InterpreterEngine untouched). On Pico, drop a NeoPixel only (no display): confirm the one-time serial note still appears ("NeoPixel ... not yet drawn ... B3"). Drop a display whose firmware uses `SoftI2C` (bit-bang): confirm the SoftI2C hint note appears after ~3s.

- [ ] **Step 8: Final typecheck + commit (only if an RGBA tweak was needed).**
  - Run: `cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm typecheck` (expect exit 0).
  - If Task 6 Step 2 required an RGBA mapping change, run `cd /Users/marimo/Dev/robocode/robocode-frontend && git add src/lib/sim/rp2040-engine.ts && git commit -m "B2: confirm OLED lit/off RGBA against wokwi SSD1306Element"`. Otherwise no commit needed.

---

## Manual verification (post-implementation)

The `el.imageData → canvas` pixel write (and the exact lit/off RGBA the `SSD1306Element` expects) and the `el.text` write on `LCD1602Element`/`LCD2004Element` are **browser-only** and are covered by Task 6. Everything up to the element-property write — the full I2C decode chain (callback wiring, both decoders, the read path, the packed-framebuffer / flat-text snapshots) — is headless-verified by the Task 2 smoke against real MicroPython v1.24.1, which also **proves-or-falsifies issue #135** on our pin. One runtime-verified library bit remains best-known-with-a-probe-note rather than assumed: the exact lit/off RGBA for the wokwi OLED element (white-on-black `(255,255,255,255)` is standard; confirmed in Task 6 Step 2). `I2CMode` is a verified public root export of `rp2040js@1.3.3` (a regular `enum`), imported directly where the controller callbacks live — no local re-declaration, no probe needed.
