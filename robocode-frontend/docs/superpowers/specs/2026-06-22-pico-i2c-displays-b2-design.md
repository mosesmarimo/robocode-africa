# Spec B2 — Pico I2C Display Rendering (LCD1602 + SSD1306 OLED)

**Goal:** Decode the rp2040js hardware-I2C peripheral traffic emitted by real MicroPython firmware and render live LCD1602 and SSD1306 OLED output on the Pico canvas, replacing the B1 no-op + "not yet drawn" notice.

**Date:** 2026-06-22

**Research doc:** APPROVED DESIGN — Spec B2 (rp2040js I2C feasibility investigation + decoder specs + user decisions), together with GATHERED FACTS (B1 integration points; rp2040js `RPI2C` / `@wokwi/elements` `.d.ts` + `.js`; component-catalog prop flow).

> Builds on B1 (the rp2040js Web Worker engine that boots real MicroPython). B3 (SPI/PIO incl. WS2812 NeoPixel) is still pending — NeoPixel stays a no-op + notice after B2.

---

## Background

B1 added a Web Worker (`src/lib/sim/rp2040.worker.ts`) that boots genuine MicroPython v1.24.1 on a simulated RP2040 (`bootChip` in `src/lib/sim/rp2040-boot.ts`) and drives the canvas for GPIO/PWM parts (LED, RGB) via `Rp2040Engine` (`src/lib/sim/rp2040-engine.ts`). I2C display parts — `wokwi-lcd1602`, `wokwi-lcd2004`, `wokwi-ssd1306` — boot and run inside firmware but are **static** on the canvas: `updateOutputs` has an explicit no-op slot for `simRole` `lcd`/`oled`/`neopixel` (`rp2040-engine.ts:289`), and `emitUnsimulatedNotice` (`rp2040-engine.ts:294-306`) prints a one-time serial note that these devices are not yet drawn.

B2 closes that gap for the **two I2C displays**. Feasibility is confirmed against source: rp2040js@1.3.3 fully models the hardware I2C controllers. `rp2040.i2c` is a `readonly RPI2C[]` (index 0 = I2C0, index 1 = I2C1; `rp2040.d.ts:38`). Each `RPI2C` exposes writable callbacks `onConnect(address, mode: I2CMode)`, `onWriteByte(value)`, `onReadByte(ack)`, `onStop()` (`i2c.d.ts:22-26`), and a device replies via `completeConnect(ack, nackByte?)`, `completeWrite(ack)`, `completeRead(value)`, `completeStop()` (`i2c.d.ts:54-57`). The default handlers NACK every address (`onConnect = () => completeConnect(false)`); a virtual device overrides them to ACK its own address and capture the byte stream — exactly how Wokwi decodes I2C. Because MicroPython's `machine.I2C` uses the hardware peripheral, this path captures the typical student `ssd1306` / I2C-LCD code (`SoftI2C` bit-bang is the rare exception and out of scope — see Error handling for the residual-notice mitigation).

---

## Goals / Non-Goals

**Goals**

- Attach worker-side virtual I2C devices to `chip.rp2040.i2c[0]` and `chip.rp2040.i2c[1]` after boot, ACKing only the addresses of displays present in the diagram.
- Decode the I2C byte stream into device state with two pure, framework-free state machines: `Lcd1602Decoder` (the generic HD44780-over-PCF8574 4-bit engine; canonical name covers 1602 and 2004 — see naming note in §a) and `Ssd1306Decoder` (128×64 GDDRAM).
- Post coalesced `display` out-messages to the engine. The **wire format is compact**: LCD posts the rendered `text` string; OLED posts the **1024-byte packed GDDRAM** as an `ArrayBuffer`. The `ImageData(128×64)` is built **engine-side only** (never on the wire).
- Render LCD text via `el.text` + `el.backlight`, and OLED pixels by expanding the packed framebuffer into a 128×64 `ImageData` assigned to `el.imageData`.
- Map decoded traffic to canvas parts by a **configurable I2C-address prop** per display part (default `0x27` LCD, `0x3C` OLED), supporting multiple same-type displays.
- Stop emitting the unsimulated notice for `lcd`/`oled` (keep it for `neopixel`).

**Non-Goals**

- **No** NeoPixel / SPI / PIO — that is B3; `neopixel` stays no-op and keeps the notice.
- **No** `SoftI2C` (GPIO bit-bang) decoding — pin-level SDA/SCL decode is not modelled and not needed (a residual one-time hint covers the silent-blank case; see Error handling).
- **No** custom CGRAM glyph rendering — CGRAM data writes are routed to a no-op to keep the byte stream aligned.
- **No** `.py` grading (out of repo scope; frontend-only).
- **No** changes to the Uno/ESP32 `InterpreterEngine` or any Spec A files. Only the Pico path (`rp2040-*` files + the component catalog/inspector for the address prop) changes.

---

## Architecture

Four layers, mirroring the existing B1 GPIO path:

**1. Worker-side decoders — NEW `src/lib/sim/i2c-devices.ts`.** Pure and framework-free (same discipline as `rp2040-boot.ts`), so the headless smoke can exercise them directly. Exports `Lcd1602Decoder` and `Ssd1306Decoder` (full state machines in Components §a). Each decoder consumes `connect(mode)`, `writeByte(value)`, `stop()` events and exposes a snapshot getter (`text: string` for LCD; `framebuffer: Uint8Array` length 1024 for OLED) plus a `dirty: boolean` flag set on any state mutation and cleared by the coalescer.

**2. Worker wiring — `src/lib/sim/rp2040.worker.ts`.** Inside `init(msg)`, after `chip = await bootChip(...)` resolves (`rp2040.worker.ts:25`, the `await` line) and **before** `chip.start()` (`rp2040.worker.ts:81`), build an `address → decoder` routing table from `msg.displays` and install the four `RPI2C` callbacks on **both** `chip.rp2040.i2c[0]` and `chip.rp2040.i2c[1]`. (We install on both controllers and route purely by address — this is why `DisplaySpec` carries **no** `bus` field; see the address↔part mapping note below and Risks for why a GPIO→controller mux table is deliberately avoided.) The handlers:

- `onConnect(address, mode)` → if a decoder is registered for `address`, remember it as the active target for that bus, call `decoder.connect(mode)`, and `i2c.completeConnect(true)`; otherwise `i2c.completeConnect(false)` (NACK).
- `onWriteByte(value)` → `activeDecoder.writeByte(value)`, then `i2c.completeWrite(true)`; if no active decoder, `i2c.completeWrite(false)`.
- `onReadByte(ack)` → displays are treated as write-only; for an ACKed display address reply `i2c.completeRead(0xff)` (this is also the rp2040js default value, so it is safe: a PCF8574 port read-back or an I2C-LCD busy-flag poll reads `0xff` = "not busy" and the firmware proceeds; an SSD1306 status read reads `0xff` harmlessly). For an unmatched address, fall through to the default NACK behaviour. *(This reply is on the boot-critical path; the smoke gate MUST cover a read — see Testing.)*
- `onStop()` → `activeDecoder.stop()`, `i2c.completeStop()`, clear the active target.

A coalescer (extend the existing 33 ms `setInterval` at `rp2040.worker.ts:48-72`) polls each decoder's `dirty` flag and, on change, posts one `display` out-message tagged with the decoder's `partId` and `kind`. The OLED framebuffer is posted as a **transferable** `ArrayBuffer`: because transferring the decoder's live buffer would detach it mid-run, the worker posts a **per-tick copy** (`decoder.framebuffer.slice().buffer`) and lists it in the transfer list (see §b for the `post` helper change). `RPI2C` is reached via `chip.rp2040.i2c` (typed `RPI2C[]`); attachment is by **assigning the callback properties** — there is no `addDevice` method on `RPI2C` (the pseudocode `addDevice` in the gathered B1 fact is not a real API and is not used).

`I2CMode` (`Write=0`, `Read=1`) is **inlined as a local `const enum I2CMode { Write = 0, Read = 1 }`** in `i2c-devices.ts`/the worker rather than deep-imported. The values are stable per the `.d.ts` (`i2c.d.ts:3-6`), and a deep import of `rp2040js/dist/cjs/peripherals/i2c.js` is not a public package export and is brittle under bundler ESM resolution in a Worker context. *(Implementation-time verification: confirm `rp2040js` `package.json` `exports` does not expose a public `I2CMode` re-export; if it does, prefer that public import over the local mirror.)*

**3. Protocol extension — `src/lib/sim/rp2040-protocol.ts`.** Add `displays: DisplaySpec[]` to the `init` in-message variant and a new `display` out-message variant, discriminated by `kind` (concrete unions in Components §c).

**4. Engine render — `src/lib/sim/rp2040-engine.ts`.** `start()` adds `displays: this.buildDisplaySpecs()` to the `init` postMessage object (`rp2040-engine.ts:135-142`). The worker `onmessage` switch (`rp2040-engine.ts:94-121`) gains a `case "display":` that writes the payload into a per-`partId` mirror (converting the OLED `ArrayBuffer` to a `Uint8Array`) and calls `updateOutputs()`. `updateOutputs` (`rp2040-engine.ts:220-291`) replaces the lcd/oled portion of the no-op slot (`rp2040-engine.ts:289`) with real `lcd`/`oled` branches. `emitUnsimulatedNotice` (`rp2040-engine.ts:294-306`) drops `lcd`/`oled` from its `.filter`, keeping only `neopixel`.

**Address ↔ part mapping.** `buildDisplaySpecs()` walks `this.diagram.parts`, selects parts whose `COMPONENT_BY_ID[part.type].simRole` is `"lcd"` or `"oled"`, reads the configurable `address` prop (parsed from `part.props?.address`, accepting `"0x27"`/`"0x3C"` hex strings or numbers, defaulting to `0x27` for lcd / `0x3C` for oled when absent/unparseable), and emits `{ partId, kind, address }`. No bus resolution is performed (the worker installs on both controllers and routes by address), so a mis-wired or unconnected display never produces an undefined bus and never throws in `buildDisplaySpecs`. The worker ACKs those addresses on both controllers and tags decoded state with `partId`; the engine renders to the matching `getPartEl(partId)`. Multiple same-type displays at distinct addresses are supported.

---

## Components

### (a) `src/lib/sim/i2c-devices.ts` — decoders (NEW file)

Both decoders are pure classes constructed with `{ partId, address }`, fed `connect(mode: I2CMode)`, `writeByte(value: number)`, `stop()`, exposing a `dirty: boolean` (set on any state mutation, cleared by the coalescer) and a snapshot getter.

**Naming note.** `Lcd1602Decoder` is the **canonical name for the generic HD44780-over-PCF8574 decoder**, used for both `wokwi-lcd1602` (16×2) and `wokwi-lcd2004` (20×4). The name is kept (per the approved design's `Lcd1602Decoder`/`Ssd1306Decoder` pair) but the class is dimension-parametric: it is constructed with `{ partId, address, cols, rows }` so the same engine serves both panels. Default is 16×2; lcd2004 passes 20×4 — see the 20×4 scope decision in Risks.

#### `Lcd1602Decoder` (PCF8574 → HD44780 4-bit)

State: `buf: string[][]` sized `rows × cols` (16×2 default; 20×4 when constructed for lcd2004), `row`, `col`, `cursorStep` (+1/−1), `displayOn: boolean`, `backlight: boolean`, `inCgram: boolean`, `prevE: boolean`, `pendingHighNibble: number | null`.

**PCF8574 byte → control lines** (each I2C data byte drives P0–P7; this is the dominant Arduino/MicroPython I2C-LCD backpack mapping, kept as a named constant so a clone variant is a one-line swap — see Risks):

| Line | Bit |
|---|---|
| RS | bit 0 |
| RW | bit 1 |
| E (Enable strobe) | bit 2 |
| Backlight | bit 3 |
| D4–D7 (data nibble) | bits 4–7 |

On each `writeByte(b)`: update `backlight = (b >> 3) & 1`. **Nibble latching (HD44780 4-bit):** the controller latches a nibble on the **falling edge of E**. Track `prevE`; let `E = (b >> 2) & 1`; when `prevE === 1 && E === 0`, latch `nibble = (b >> 4) & 0x0F` with `rs = b & 1`. Then set `prevE = E`. Assemble a byte from two nibbles, **HIGH nibble first then LOW**: hold the first latched nibble in `pendingHighNibble`; on the second latch, `value = (pendingHighNibble << 4) | low`, clear `pendingHighNibble`, then dispatch by `rs`.

**RS=0 → command** (decode `value`):

- `0x01` Clear → blank `buf`, cursor → (0,0).
- `0x02`/`0x03` Home → cursor → (0,0).
- `0x04`–`0x07` Entry Mode → `cursorStep = (value & 0x02) ? +1 : -1`.
- `0x08`–`0x0F` Display On/Off → `displayOn = (value & 0x04) !== 0` (cursor/blink bits ignored).
- `0x20`–`0x3F` Function Set → ignored.
- `0x40`–`0x7F` Set CGRAM addr → `inCgram = true` (subsequent character writes routed away from the screen).
- `0x80 | addr` Set DDRAM addr → `inCgram = false`; `addr = value & 0x7F`; map to `(row, col)` via the DDRAM map below.

**DDRAM address → (row, col) map.** For 16×2 (the default): if `addr >= 0x40` then `row=1, col = addr - 0x40` else `row=0, col = addr`. For 20×4 the HD44780 layout is non-contiguous (`row0 = 0x00–0x13`, `row1 = 0x40–0x53`, `row2 = 0x14–0x27`, `row3 = 0x54–0x67`): `row3 if addr>=0x54, row1 if addr>=0x40, row2 if addr>=0x14, else row0`, with `col = addr - rowBase`. The map is selected by the constructed `rows`. (For lcd2004 see the renders-degraded scope decision in Risks.)

**RS=1 → character:** if `!inCgram` and `row`/`col` in range, `buf[row][col] = String.fromCharCode(value)`, then `col += cursorStep` (clamped to `0..cols-1`). If `inCgram`, skip (CGRAM glyph write, no-op) — this keeps the byte stream aligned without rendering custom glyphs.

**Address match (for the catalog/inspector default, NOT decoder logic):** PCF8574 boards live at `0x20`–`0x27` (default `0x27`) and PCF8574A boards at `0x38`–`0x3F` (`0x3F`). These ranges inform the default/inspector choice only; the worker routes by the single exact configured `address`, so the decoder never does range matching.

**Snapshot — `get text(): string`:** emit **exactly `cols × rows` characters, row-major, each row right-padded with spaces to `cols`, concatenated with NO separator** (no `\n`). The `wokwi-lcd1602` element's `text` setter is `characters = new Uint8Array(value.split('').map(c => c.charCodeAt(0)))` (`lcd1602-element.js:40-41`) — a flat positional copy with no splitting and no padding of its own; cell `i` = char `i`, and the element's renderer derives rows by `i % cols` against `numCols=16, numRows=2`. A newline or short string would shift every cell after it, so the decoder MUST produce the full flat `cols × rows` string itself.

#### `Ssd1306Decoder` (128×64)

State: `fb: Uint8Array(1024)` (8 pages × 128 cols; a page is a vertical group of 8 pixels), `displayOn: boolean`, `inverse: boolean`, `colStart=0`, `colEnd=127`, `pageStart=0`, `pageEnd=7`, `colPtr`, `pagePtr`, plus a small command-parse state (`mode` and a pending-parameter counter, see below).

**Control-byte demux** — every I2C write to the SSD1306 begins with a control byte; the decoder reads it as the first byte of each transaction (`connect` resets the per-transaction parse state). `DC = (ctrl >> 6) & 1`, `Co = (ctrl >> 7) & 1`:

- `0x00` (DC=0, Co=0) → **command stream**: all remaining bytes in this write are command bytes (params follow inline).
- `0x40` (DC=1) → **data stream**: all remaining bytes are GDDRAM data.
- `0x80` (DC=0, Co=1) → **single command**: the **next one byte** is a command, then another control byte is expected. MicroPython's `ssd1306` driver uses this framing: it sends `[0x80, cmd]` per command, and for a command-with-parameter it sends the parameter in its own `[0x80, param]` write. The decoder therefore handles parameters **as a running count across writes**, not as bytes physically adjacent to the opcode (this is the critical desync trap — see below).

**Parameter-count model (the desync-critical part).** The control-byte demux runs FIRST. Command bytes (whether arriving via `0x00` stream mode inline, or one-at-a-time via `0x80` framing) feed a single command parser that maintains a "parameters still expected" counter. Every opcode is assigned to **exactly one** of three param-count classes:

- **2-param:** `0x21` (col window: colStart, colEnd), `0x22` (page window: pageStart, pageEnd).
- **1-param:** `0x20` (addressing mode), and the skip-with-1-param set `0x81`, `0xA8`, `0xD3`, `0xDA`, `0xD5`, `0xD9`, `0xDB`, `0x8D`, `0xAD`, `0xD6` (zoom). Scroll-setup opcodes if ever emitted are assigned their real counts: `0x26`/`0x27` (6 params), `0x29`/`0x2A` (5 params), `0xA3` (2 params) — the in-scope `ssd1306` driver never scrolls, so these are stream-alignment insurance only.
- **0-param (single byte):** `0xAE`/`0xAF` (display off/on), `0xA6`/`0xA7` (normal/inverse), `0x2E`/`0x2F` (deactivate/activate scroll), and **all other opcodes not listed above**.

When an opcode arrives, the parser sets the counter to its class count; the next that-many command bytes are consumed as parameters (handled or ignored per the opcode) and do NOT re-enter opcode decoding. This makes the stream stay aligned regardless of `0x00`-vs-`0x80` framing.

**Commands handled (the rest are consumed by class but have no effect):**

- `0x20` +1 → addressing mode (drivers use horizontal `0x00`; stored, no other effect).
- `0x21` +2 → set column window: `colStart`, `colEnd`; reset `colPtr = colStart`, `pagePtr = pageStart`.
- `0x22` +2 → set page window: `pageStart`, `pageEnd`; reset `pagePtr = pageStart`, `colPtr = colStart`.
- `0xAE` / `0xAF` → `displayOn = false` / `true`.
- `0xA6` / `0xA7` → `inverse = false` / `true`.

**Data bytes (GDDRAM):** `fb[pagePtr * 128 + colPtr] = value`, then horizontal auto-increment: `colPtr++`; if `colPtr > colEnd` → `colPtr = colStart`, `pagePtr++`; if `pagePtr > pageEnd` → `pagePtr = pageStart`.

**Pixel model (consumed engine-side):** `bit = (fb[(y >> 3) * 128 + x] >> (y & 7)) & 1`; `on = bit XOR inverse`; if `!displayOn`, all pixels blank.

**Address match (for catalog/inspector default, NOT decoder logic):** `0x3C` (default) and `0x3D`.

**Snapshot — `get framebuffer(): Uint8Array`:** the live 1024-byte `fb`. The worker copies it (`fb.slice()`) into a transferable `ArrayBuffer` per post so the live buffer is never detached.

### (b) Worker wiring — `src/lib/sim/rp2040.worker.ts` (MODIFY)

- Add the local `const enum I2CMode { Write = 0, Read = 1 }` (no deep import) and import the decoders from `./i2c-devices`.
- Inside `init(msg)`, after `bootChip` (`rp2040.worker.ts:25`) and before `chip.start()` (`rp2040.worker.ts:81`): build `Map<number, Lcd1602Decoder | Ssd1306Decoder>` keyed by address from `msg.displays` (construct by `kind`, passing `cols`/`rows` for the LCD), then for **each** controller `chip.rp2040.i2c[0]` and `chip.rp2040.i2c[1]` install `onConnect`/`onWriteByte`/`onReadByte`/`onStop` that route by the active connect address (ACK matched, NACK unmatched, as in Architecture §2). Both controllers share the one address→decoder map.
- Extend the `post` helper to forward an optional transfer list — change `post = (m) => ctx.postMessage(m)` (`rp2040.worker.ts:7`) to `post = (m, transfer) => ctx.postMessage(m, transfer ?? [])` — so the OLED `display` message can transfer its `ArrayBuffer`.
- Extend the coalescer (`rp2040.worker.ts:48-72`, the existing 33 ms ≈30 Hz interval): iterate decoders, and for each `dirty` one post a `display` message and clear `dirty`. LCD: `post({ type: "display", partId, kind: "lcd", text: decoder.text })`. OLED: `const buf = decoder.framebuffer.slice().buffer; post({ type: "display", partId, kind: "oled", framebuffer: buf }, [buf])`. Reuse the existing interval so display updates ride the same coalescing budget as GPIO.
- No new **inbound** worker message type (I2C is passive polling). The message handler (`rp2040.worker.ts:111-125`) is unchanged.

### (c) Protocol extension — `src/lib/sim/rp2040-protocol.ts` (MODIFY)

Add a `DisplaySpec` type and extend both unions. The `display` out-variant is discriminated by `kind`:

```ts
export type DisplaySpec = {
  partId: string;
  kind: "lcd" | "oled";
  address: number;
  cols?: number; // LCD only; default 16
  rows?: number; // LCD only; default 2
};

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

export type Rp2040OutMessage =
  | { type: "ready" }
  | { type: "serial"; line: string }
  | { type: "gpio"; outputs: Record<number, boolean>; pwm: Record<number, number> }
  | { type: "display"; partId: string; kind: "lcd"; text: string }
  | { type: "display"; partId: string; kind: "oled"; framebuffer: ArrayBuffer }
  | { type: "error"; message: string }
  | { type: "stop" };
```

The OLED `framebuffer` is the 1024-byte packed GDDRAM (1 bit/pixel, page-major), posted as a transferable `ArrayBuffer`. The `ImageData` is built engine-side only. The union lives entirely in this file.

### (d) Engine render — `src/lib/sim/rp2040-engine.ts` (MODIFY)

- **State mirror:** add `private displayState = new Map<string, { kind: "lcd"; text: string } | { kind: "oled"; framebuffer: Uint8Array }>()`.
- **`onmessage` (`rp2040-engine.ts:94-121`):** add `case "display":` — convert and store, then `updateOutputs()`:
  ```ts
  case "display":
    if (msg.kind === "oled") {
      this.displayState.set(msg.partId, { kind: "oled", framebuffer: new Uint8Array(msg.framebuffer) });
    } else {
      this.displayState.set(msg.partId, { kind: "lcd", text: msg.text });
    }
    this.updateOutputs();
    break;
  ```
  Do NOT store `msg` directly — its `framebuffer` is an `ArrayBuffer`, which must be wrapped in a `Uint8Array` for the pixel expansion.
- **`updateOutputs` lcd/oled branches** (replace the lcd/oled half of the no-op slot at `rp2040-engine.ts:289`, following the LED/RGB `el`-mutation pattern at `rp2040-engine.ts:221-252`):
  - `case "lcd":` →
    ```ts
    const s = this.displayState.get(part.id);
    if (s?.kind === "lcd") {
      try { el.text = s.text; el.backlight = true; } catch {}
    }
    ```
    `el.text` (setter) and `el.backlight` are confirmed on `LCD1602Element` (`lcd1602-element.d.ts:17-18, 12`). Backlight is rendered as `true` in B2; the decoded PCF8574 backlight bit and display-on flag are captured but intentionally not surfaced this round (noted in Risks).
  - `case "oled":` →
    ```ts
    const s = this.displayState.get(part.id);
    if (s?.kind === "oled") {
      const img = new ImageData(128, 64);
      const fb = s.framebuffer;
      for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 128; x++) {
          const on = (fb[(y >> 3) * 128 + x] >> (y & 7)) & 1; // inverse already applied if decoder tracks it; see note
          const i = (y * 128 + x) * 4;
          const v = on ? 255 : 0;
          img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
        }
      }
      try { el.imageData = img; } catch {}
    }
    ```
    Assigning a fresh `ImageData` reference auto-redraws: `imageData` is a Lit `@property()` (`ssd1306-element.js:134`) and `updated()` unconditionally calls `redraw()` → `putImageData(this.imageData, 0, 0)` onto the 128×64 canvas (`ssd1306-element.js:65-67, 53-54, 34-35`). So reference assignment is the correct path; the in-place mutate + `el.redraw()` route is a **perf fallback, not a correctness fallback**. `ImageData(128, 64)` is deliberately the screen size (`screenWidth=128, screenHeight=64`), NOT the element's public `width=150`/`height=116` (those are the SVG bezel and are a decoy). The `inverse` and `!displayOn` handling lives in the decoder's pixel exposure or is applied here consistently — keep one source of truth: the decoder exposes the raw `fb` and `inverse`/`displayOn` flags, and the engine applies `on = bit XOR inverse`, blanking all when `!displayOn`. *(Implementation-time verification: confirm the lit/off RGBA the wokwi element expects — white-on-black `(255,255,255)` lit vs `(0,0,0)` off is standard; verify in the Task-8 browser harness.)*
  - `case "neopixel":` → unchanged no-op (B3).
- **`buildDisplaySpecs()`** (new private): walk `this.diagram.parts`, keep `simRole` `lcd`/`oled`, parse `address` from `part.props?.address` (accepts `"0x27"`/`"0x3C"` hex strings or numbers) with the `simRole`-based default, set `cols`/`rows` from the part type (`wokwi-lcd2004` → 20×4, else 16×2), return `DisplaySpec[]`. No bus resolution. Wire it into the `init` literal at `rp2040-engine.ts:135-142` as `displays: this.buildDisplaySpecs()`.
- **`emitUnsimulatedNotice` (`rp2040-engine.ts:294-306`):** change the `.filter` predicate from `r === "lcd" || r === "oled" || r === "neopixel"` to `r === "neopixel"` only, so the generic notice fires solely for NeoPixel. (The new conditional SoftI2C hint is separate — see Error handling.)

### (e) Component catalog + address prop

Per the gathered component-catalog facts, a configurable address prop needs **both** a default and an inspector control:

- **`src/lib/domain/components.ts` `defaultProps`** — add `address` to the I2C display defs: `lcd1602` → `{ pins: "i2c", address: "0x27" }`, `lcd2004` → `{ pins: "i2c", address: "0x27" }`, `ssd1306` → `{ address: "0x3C" }`. `addPart` shallow-copies `defaultProps` into `part.props` (`store.ts:183`), so every newly dropped display serialises with a default address even if the inspector is never opened.
- **`src/components/studio/inspector.tsx`** — the inspector is a hardcoded `simRole`-keyed switch with no generic editor and **no existing lcd/oled block**. Add an `{(def.simRole === "lcd" || def.simRole === "oled") && ...}` block with a text `<Input>` bound to `part.props?.address` calling `setProp(part.id, "address", value)`. Without this the address can never be changed from its default. (See Risks for the ship/defer decision; the engine's address parsing tolerates a missing/blank prop by falling back to the default, so default-only is a safe degrade.)

**Files created:** `src/lib/sim/i2c-devices.ts`.
**Files modified:** `src/lib/sim/rp2040.worker.ts`, `src/lib/sim/rp2040-protocol.ts`, `src/lib/sim/rp2040-engine.ts`, `src/lib/domain/components.ts` (`defaultProps`), `src/components/studio/inspector.tsx` (address control), `scripts/rp2040-smoke.ts` (new lcd/oled smoke variants, including a read-path case).

---

## Data flow

1. MicroPython runs real firmware: `machine.I2C(...).writeto(addr, buf)` (and any `readfrom`) drives the RP2040 hardware I2C controller.
2. rp2040js fires the bus callbacks on `chip.rp2040.i2c[bus]`: `onConnect(address, mode)` → `onWriteByte(value)` (repeated) / `onReadByte(ack)` → `onStop()`.
3. The worker routes by `address` to the registered `Lcd1602Decoder` / `Ssd1306Decoder`, ACKing via `completeConnect(true)` / `completeWrite(true)` / `completeRead(0xff)` (unmatched addresses NACKed), feeding `connect` / `writeByte` / `stop`.
4. The decoder advances its state machine and sets `dirty` (LCD updates `buf`; OLED writes `fb`).
5. The ≈30 Hz coalescer polls `dirty` decoders and posts one `display` out-message per changed device, tagged with `partId` + `kind`: LCD a flat `cols × rows` `text` string; OLED a fresh 1024-byte `ArrayBuffer` copy, transferred.
6. The engine `onmessage` `case "display":` converts (OLED `ArrayBuffer` → `Uint8Array`) and writes it into the per-`partId` `displayState` mirror, then calls `updateOutputs()`.
7. `updateOutputs` lcd/oled branches push to the canvas element: `el.text` + `el.backlight = true` for LCD; a freshly built `ImageData(128,64)` (expanded from the packed `fb` via the pixel model) assigned to `el.imageData` for OLED, which auto-redraws via the element's reactive `updated()` → `redraw()`.

---

## Error handling

- **Unmatched I2C address:** any address not in `msg.displays` is NACKed (`completeConnect(false)`), preserving stock rp2040js behaviour and firmware error semantics.
- **Read path:** an `onReadByte` for an ACKed display replies `0xff` (= rp2040js default; "not busy" for a PCF8574 port read-back or an I2C-LCD busy-flag poll, harmless for an SSD1306 status read), so libraries that read during init proceed rather than hang. A wrong read reply would desync the bus and surface as an `OSError: ENODEV` that looks identical to a #135 failure — so the smoke gate covers a read explicitly (see Testing).
- **Malformed / partial command streams (alignment):** the decoders are tolerant by construction. The SSD1306 single command parser assigns every opcode a 0/1/2-param count and consumes parameters by that count regardless of `0x00`-vs-`0x80` framing, so the stream stays aligned even for ignored opcodes; an unknown opcode is treated 0-param. The LCD only mutates the buffer on a complete two-nibble byte assembled on E falling edges; a partial nibble simply waits in `pendingHighNibble`. A `stop()` mid-command leaves state consistent for the next transaction.
- **CGRAM writes:** routed to a no-op (`inCgram` gate on character writes) so the byte stream stays aligned without rendering custom glyphs.
- **Missing/blank/unparseable address prop:** `buildDisplaySpecs()` falls back to the `simRole` default (`0x27` lcd / `0x3C` oled), so a display dropped before the inspector control exists still renders.
- **No bus / mis-wired display:** `buildDisplaySpecs()` performs no SDA/SCL→controller resolution; the worker installs on both controllers and routes by address, so an unwired or oddly-wired display never produces an undefined bus and never throws pre-boot. (It will simply not receive traffic if firmware drives a different bus — acceptable.)
- **SoftI2C silent-blank regression:** removing the lcd/oled unsimulated notice means a `SoftI2C`-driven display (rare; bit-bang, not modelled) would render blank with no explanation — strictly worse than B1's notice. Mitigation: a weaker conditional hint — if a display part exists in the diagram but its decoder received **zero `connect` events** within a few seconds of boot, emit a one-time serial note ("display detected but no hardware-I2C traffic — SoftI2C/bit-bang is not simulated"). Cheap; closes the silent-blank gap without resurrecting the blanket notice.
- **Issue #135 risk:** rp2040js #135 reports SSD1306 breakage on MicroPython 1.20+. The headless smoke against our pinned v1.24.1 firmware is the gate — if the decoded framebuffer does not match the expected pixels, the I2C-controller modelling on this firmware is suspect and B2 must adjust before shipping (the smoke **proves-or-falsifies** whether #135 affects our pin; it does not patch the upstream bug).

---

## Testing & verification

- **Typecheck only** (repo convention — no test framework): `tsc` over the frontend package must pass with the new union variants and decoder types.
- **Headless smoke — `scripts/rp2040-smoke.ts` (extended):** because the decoders are pure, add `lcd` and `oled` smoke variants that boot a **real MicroPython program** through `bootChip`, attach the decoders to `chip.rp2040.i2c`, run, and assert decoded state:
  - **OLED:** run the standard `ssd1306` driver (`SSD1306_I2C(128, 64, i2c)`, `oled.text("HI", 0, 0)`, `oled.show()`) and assert the `Ssd1306Decoder` framebuffer has the expected lit pixels for the rendered glyphs.
  - **LCD:** run a standard I2C-LCD library writing a known string and assert `Lcd1602Decoder.text` equals the expected flat 32-char (`cols × rows`, space-padded, no separator) buffer.
  - **Read-path case:** include at least one firmware path whose init/library performs an I2C **read** against an ACKed display address (e.g. a PCF8574 port read-back or a busy-flag poll), and assert boot completes without `ENODEV` — so the `completeRead(0xff)` reply is gate-verified, not assumed (otherwise a read-desync masquerades as #135).

  This proves the entire I2C decode chain on our v1.24.1 firmware end-to-end and **proves-or-falsifies issue #135** for our pin.
- **Browser-only remainder:** the *only* parts not headless-verifiable are the final element-property writes — `el.imageData` on `SSD1306Element` (the `ImageData → canvas` pixel write and lit/off RGBA) and `el.text` on `LCD1602Element` — verified in the Task-8 browser harness. Everything up to the element property write is headless-verified.

---

## Risks & open questions

- **Issue #135 (SSD1306 on MicroPython 1.20+):** the dominant risk; proved-or-falsified by the headless spike against pinned v1.24.1 firmware before any UI work. If the framebuffer is wrong, the controller-modelling assumption fails and B2 re-scopes.
- **`onReadByte` reply on the boot-critical path:** `completeRead(0xff)` is the safe default (matches rp2040js default; "not busy"), but the read path is firmware-dependent (PCF8574 read-back, SSD1306 init reads). It is therefore a **named smoke-gate requirement** (a read case is mandatory in the smoke), not just an inline note, because a read-desync would masquerade as a #135 failure.
- **PCF8574 bit-wiring variant:** B2 implements the dominant mapping (RS=bit0, RW=bit1, E=bit2, BL=bit3, D4–D7=bits4–7) used by the common Arduino/MicroPython I2C-LCD backpacks. If real firmware produces garbled text, a second clone variant with a permuted control-bit map is needed — the bit map is a named constant so a variant is a one-line swap.
- **`ImageData(128,64)` build + worker copy cost:** rebuilding 32768 RGBA bytes engine-side per OLED frame, plus a 1024-byte `fb` copy + `ArrayBuffer` alloc worker-side, each ≈30 Hz. Coalescing (post only on `dirty`) bounds both to actual screen changes; if profiling shows cost, switch the engine path to mutating `el.imageData.data` in place + `el.redraw()` and touch only changed pages. (Redraw-on-assignment is confirmed from source, so the in-place path is purely a perf option.)
- **Address-prop UI — OPEN for the human:** does B2 ship the `inspector.tsx` editing control, or default-only? The engine tolerates default-only, but **multiple same-type displays at distinct addresses are only usable in practice if the inspector control ships**. Recommendation: ship the inspector control (it is low-cost — one `simRole`-keyed block + a text `<Input>`); otherwise default-only with a fast follow-up. Needs a call.
- **20×4 LCD (`wokwi-lcd2004`) scope — OPEN for the human:** the decoder now carries the correct non-contiguous 4-row DDRAM map and is constructed 20×4 for lcd2004, so it *can* render correctly. Decision needed: ship lcd2004 as **fully supported** in B2 (the 4-row map is included), or restrict B2 to lcd1602 and mark lcd2004 a follow-up. Default recommendation: include it (the map is already specced), but flag it for the smoke to cover a 20×4 write before claiming support.
- **Decoder snapshot fields captured-but-unrendered:** the LCD decoder tracks `backlight` (PCF8574 bit 3) and `displayOn`, but §d renders `el.backlight = true` unconditionally. Intentional for B2 (avoids flicker from init sequences); surfacing real backlight/display-off is a low-priority follow-up.
- **`I2CMode` import:** resolved by **inlining a local `const enum`** rather than deep-importing `rp2040js/dist/cjs/peripherals/i2c.js` (not a public export; brittle in a Worker/bundler context). *(Implementation-time verification: if `rp2040js` `package.json` `exports` later exposes a public `I2CMode`, prefer it.)*

---

## Out of scope

- **B3:** SPI / PIO devices including the WS2812 NeoPixel — `neopixel` stays a no-op and keeps the `emitUnsimulatedNotice` warning after B2.
- **`SoftI2C`** (GPIO bit-bang) decoding — pin-level SDA/SCL decode is not modelled (a conditional one-time hint covers the silent-blank case; see Error handling).
- **CGRAM custom glyphs** — CGRAM data writes routed to no-op to keep the stream aligned.
- **`.py` grading** — out of repo scope (frontend-only).
- **Full Raspberry Pi SBC** emulation — excluded per user; Studio emulates only Pico / Uno / ESP32.
