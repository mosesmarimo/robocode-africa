# Spec B1 — Core Pico MicroPython Engine Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL — read `superpowers:executing-plans` before starting, and use the checkbox syntax in this plan to track progress (check off each `- [ ]` step as you complete it; a task is not done until its verify step passes and its commit lands).

**Goal:** Enable REAL MicroPython execution on the Raspberry Pi Pico in the Studio simulator for the first time, by booting the `rp2040js` chip emulator in a Web Worker behind the Spec A `createEngine` seam, with GPIO/PWM/ADC components live on the canvas — Uno (avr8js) and ESP32 (esp32) behavior unchanged.

**Architecture:** A new `Rp2040Engine` (main thread, `"use client"`) implements the existing `SimEngine` contract and owns the netlist, the four input bags, and the canvas DOM writes. It spawns a Web Worker (`rp2040.worker.ts`) that owns the `rp2040js` emulator and the busy run loop. The worker and a headless smoke script share one boot/inject/peripheral module (`rp2040-boot.ts`) so the same code path that the smoke proves is the code path the worker ships. Communication is a typed `postMessage` discriminated union (`rp2040-protocol.ts`). The Pico boots a pinned MicroPython UF2, injects the student `.py` as `main.py` via a LittleFS flash image at `0xA0000` (auto-run on boot), and streams serial + GPIO/PWM/ADC state back to drive the SAME Wokwi canvas elements `InterpreterEngine` already drives.

**Tech Stack:** TypeScript; Next.js 16 App Router (robocode-frontend). Emulator: `rp2040js@1.3.3` (already a dependency). Filesystem image: `littlefs@0.1.0` (new, npm-confirmed). Web Worker via `new Worker(new URL("./rp2040.worker.ts", import.meta.url), { type: "module" })` (Turbopack dev + webpack build, no config change). Headless gate: Node via `npx tsx` (`tsx` added as a dev dependency). Assets served from `public/sim/`.

## Global Constraints

- TypeScript; frontend = Next.js 16 App Router (robocode-frontend). Single repo for B1 (no backend changes).
- All B1 work goes on the branch `spec/pico-micropython-b1` (ALREADY created and currently checked out; the B1 spec is already committed there). Commit steps cd into robocode-frontend.
- NO TEST FRAMEWORK (typecheck-only). TDD is ADAPTED: a task ends with EITHER (a) frontend `pnpm typecheck` surfacing/resolving a type error, OR (b) the headless Node smoke script (`scripts/rp2040-smoke.ts`, run via `npx tsx`) asserting boot/inject/serial/gpio/pwm. Every task ends with a concrete run command + expected output + a commit.
- The engine/worker run client-side only. `rp2040-protocol.ts` = plain types (no `use client`). `rp2040.worker.ts` = a Web Worker (no `use client` directive — that is for React modules). `rp2040-engine.ts` = `use client` (constructs a Worker + writes DOM).
- The ONLY Spec A change is loosening `SimEngine.machine` to `machine?: Machine` (optional) — verified zero external readers. Uno (avr8js) and ESP32 (esp32) behavior must stay byte-for-byte unchanged.
- New dependency: `pnpm add littlefs@0.1.0` (real npm package, confirmed present at version `0.1.0`). Assets shipped under `public/sim/`: the pinned RPI_PICO MicroPython UF2 and a redistributable RP2040 bootrom (wokwi rp2040js demo MIT / pico-bootrom-rp2040 BSD-3-Clause).
- Canonical class name `Rp2040Engine`; message union types `Rp2040InMessage` / `Rp2040OutMessage`.
- Servo: best-effort; if the PWM slice divisor proves unreadable, servo accuracy is deferred (do NOT block B1 on servo).
- I2C/SPI/PIO devices (lcd/oled/neopixel) are NO-OP on the canvas in B1 but MUST emit a one-time serial notice so silence is not read as broken. (Rendering them is B2/B3.)

---

## File Structure

| Path | New/Mod | Responsibility |
|---|---|---|
| `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/rp2040-protocol.ts` | NEW | Plain TS discriminated unions `Rp2040InMessage` / `Rp2040OutMessage` shared by worker + main thread. No `"use client"`. |
| `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/rp2040-boot.ts` | NEW | Shared, framework-free boot/inject/peripheral helpers (loadBootrom, UF2 parse, LittleFS image, run-loop strategy, USB-CDC read, PWM-duty decode) used by BOTH the smoke and the worker. |
| `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/rp2040.worker.ts` | NEW | Web Worker wrapping `rp2040-boot.ts`: handles init/input/stop, coalesces gpio/pwm, posts the out-union. No `"use client"`. |
| `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/rp2040-engine.ts` | NEW | `"use client"` `Rp2040Engine implements SimEngine`: netlist + pin mapping, spawns the worker, mirrors gpio/pwm, Pico `updateOutputs`, input forwarding, idempotent stop. |
| `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/engine.ts` | MODIFY | Loosen `SimEngine.machine` → `machine?: Machine`; wire `createEngine` rp2040js case → `new Rp2040Engine(...)`; add import. |
| `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/studio/store.ts` | MODIFY | `sketchContent()` board/language-aware (`.py`-first for rp2040js boards, `.ino`-first otherwise). |
| `/Users/marimo/Dev/robocode/robocode-frontend/scripts/rp2040-smoke.ts` | NEW | Headless Node gate (`npx tsx`): boots a tiny `main.py`, asserts `SMOKE_OK` serial + GP25 toggle; PWM variant asserts decoded duty. |
| `/Users/marimo/Dev/robocode/robocode-frontend/public/sim/RPI_PICO-20241129-v1.24.1.uf2` | NEW (asset) | Pinned MicroPython UF2 (666,624 bytes). |
| `/Users/marimo/Dev/robocode/robocode-frontend/public/sim/rp2040-bootrom.bin` | NEW (asset) | Redistributable RP2040 bootrom in the byte layout `loadBootrom` expects. |
| `/Users/marimo/Dev/robocode/robocode-frontend/public/sim/lfs_js.wasm` | NEW (asset) | The `littlefs@0.1.0` Emscripten `.wasm`, copied so the worker can resolve it via `locateFile` under the Next chunk. |
| `/Users/marimo/Dev/robocode/robocode-frontend/package.json` | MODIFY | `littlefs@0.1.0` dependency + `tsx` dev dependency. |

---

### Task 1: Dependencies + assets (UF2 + bootrom + littlefs wasm under `public/sim/`)

**Files**
- Modify: `/Users/marimo/Dev/robocode/robocode-frontend/package.json` (via `pnpm add`)
- Create (asset): `/Users/marimo/Dev/robocode/robocode-frontend/public/sim/RPI_PICO-20241129-v1.24.1.uf2`
- Create (asset): `/Users/marimo/Dev/robocode/robocode-frontend/public/sim/rp2040-bootrom.bin`
- Create (asset): `/Users/marimo/Dev/robocode/robocode-frontend/public/sim/lfs_js.wasm`

**Interfaces**
- Consumes: nothing (bootstrap task).
- Produces: on-disk assets fetched later by URL `/sim/RPI_PICO-20241129-v1.24.1.uf2`, `/sim/rp2040-bootrom.bin`, `/sim/lfs_js.wasm`; `littlefs` + `tsx` packages available.

- [ ] **Step 1: Add the littlefs dependency and tsx (the smoke runner) so neither is network-installed per run.** Run:
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm add littlefs@0.1.0 && pnpm add -D tsx
  ```
  Expect `package.json` to gain `"littlefs": "0.1.0"` under dependencies, `"tsx": "..."` under devDependencies, and `pnpm-lock.yaml` to update.

- [ ] **Step 2: Create the asset directory.** Run:
  ```
  mkdir -p /Users/marimo/Dev/robocode/robocode-frontend/public/sim
  ```

- [ ] **Step 3: Download the pinned MicroPython UF2.** Run:
  ```
  curl -L -o /Users/marimo/Dev/robocode/robocode-frontend/public/sim/RPI_PICO-20241129-v1.24.1.uf2 https://micropython.org/resources/firmware/RPI_PICO-20241129-v1.24.1.uf2
  ```
  Expect a 666,624-byte file.

- [ ] **Step 4: Obtain the redistributable bootrom and write it in the byte layout `loadBootrom` expects.** `loadBootrom(bootromData: Uint32Array)` calls `this.bootrom.set(bootromData)` into a 4096-word buffer; the wokwi demo's `bootromB1` is a 2048-word `Uint32Array` literal (8 KB), and `.set()` fills only the first 2048 words — confirmed compatible. `rp2040-boot.ts` reads `/sim/rp2040-bootrom.bin` as bytes and constructs a `Uint32Array` view over them (little-endian, native). So the `.bin` must be the raw little-endian bytes of the 2048-word `bootromB1` literal. Fetch the wokwi demo file and convert it:
  ```
  curl -L -o /tmp/bootrom.ts https://raw.githubusercontent.com/wokwi/rp2040js/main/demo/bootrom.ts
  ```
  Write the throwaway converter at `/tmp/conv-bootrom.mjs`:
  ```js
  import { readFileSync, writeFileSync } from "node:fs";
  const src = readFileSync("/tmp/bootrom.ts", "utf8");
  // extract the [...] body of the Uint32Array literal
  const body = src.slice(src.indexOf("[") + 1, src.lastIndexOf("]"));
  const words = body.split(",").map((s) => s.trim()).filter(Boolean).map((s) => Number(s) >>> 0);
  const out = new Uint8Array(words.length * 4);
  const dv = new DataView(out.buffer);
  words.forEach((w, i) => dv.setUint32(i * 4, w, true)); // true = little-endian
  writeFileSync("/Users/marimo/Dev/robocode/robocode-frontend/public/sim/rp2040-bootrom.bin", out);
  console.log("wrote", out.length, "bytes,", words.length, "words");
  ```
  Run:
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && node /tmp/conv-bootrom.mjs
  ```
  Expect `wrote 8192 bytes, 2048 words`. License: wokwi rp2040js demo is MIT (Uri Shaked); underlying bootrom bytes are BSD-3-Clause (Raspberry Pi Ltd) — both redistributable with attribution. NAMED FALLBACK (if the wokwi raw URL is unavailable): fetch the official ELF and `objcopy` it:
  ```
  curl -L -o /tmp/b1.elf https://github.com/raspberrypi/pico-bootrom-rp2040/releases/download/b1/b1.elf
  arm-none-eabi-objcopy -O binary /tmp/b1.elf /Users/marimo/Dev/robocode/robocode-frontend/public/sim/rp2040-bootrom.bin
  ```
  (`b1.elf` is 233,344 bytes; `objcopy -O binary` yields a 16,384-byte / 4096-word `.bin` — ALSO valid for `loadBootrom`, since `.set()` then fills all 4096 words. Requires the `arm-none-eabi` toolchain.) Note which source shipped in the commit message.

- [ ] **Step 5: Copy the littlefs `.wasm` into `public/sim/` so the WORKER can resolve it via `locateFile`.** The smoke runs in Node (resolves the `.wasm` from `node_modules`), but the worker runs in the browser where the `.wasm` URL is content-hashed and moved by the bundler — `buildLittleFsImage` (Task 3) passes a `locateFile` pointing at `/sim/lfs_js.wasm`. Find the installed `.wasm` and copy it:
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && WASM=$(find node_modules/littlefs -name "*.wasm" | head -1) && echo "found: $WASM" && cp "$WASM" public/sim/lfs_js.wasm
  ```
  Expect a found path printed and `public/sim/lfs_js.wasm` created. (If `find` reports no `.wasm`, the `littlefs@0.1.0` build inlines the wasm into JS — record that and SKIP this asset; the Task 3 probe confirms whether a `.wasm` resolver is needed at all.)

- [ ] **Step 6: VERIFY assets present + byte sizes.** Run:
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && ls -l public/sim/ && wc -c public/sim/RPI_PICO-20241129-v1.24.1.uf2 public/sim/rp2040-bootrom.bin
  ```
  Expect: `RPI_PICO-20241129-v1.24.1.uf2` = `666624`; `rp2040-bootrom.bin` = `8192` (or `16384` if the ELF fallback was used); `lfs_js.wasm` present (unless inlined per Step 5).

- [ ] **Step 7: COMMIT.**
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && git add package.json pnpm-lock.yaml public/sim && git commit -m "B1: add littlefs+tsx deps + pinned Pico MicroPython UF2, RP2040 bootrom, littlefs wasm assets"
  ```

---

### Task 2: Protocol types (`rp2040-protocol.ts`)

**Files**
- Create: `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/rp2040-protocol.ts`

**Interfaces**
- Consumes: nothing.
- Produces: `export type Rp2040InMessage` and `export type Rp2040OutMessage` (discriminated unions), imported by the worker, the engine, and the smoke.

- [ ] **Step 1: Write the protocol module (plain types, NO `"use client"`).**
  ```ts
  // Shared message protocol between Rp2040Engine (main thread) and rp2040.worker.ts.
  // Plain types only — importable from both a React-client module and a Web Worker.
  // NO "use client" directive.

  /** main thread -> worker */
  export type Rp2040InMessage =
    | { type: "init"; uf2Url: string; bootromUrl: string; wasmUrl: string; code: string }
    | { type: "input"; gpioInputs: Record<number, boolean>; adcValues: Record<number, number> }
    | { type: "stop" };

  /** worker -> main thread */
  export type Rp2040OutMessage =
    | { type: "ready" } // firmware booted, USB-CDC up, main.py running
    | { type: "serial"; line: string } // one complete line (newline-split)
    | {
        type: "gpio";
        outputs: Record<number, boolean>; // raw pin out-values, coalesced (edge-driven)
        pwm: Record<number, number>; // GPIO -> duty 0..1 (decoded), coalesced (polled)
      }
    | { type: "error"; message: string } // fetch/boot/runtime failure
    | { type: "stop" }; // worker has halted + cleaned up
  ```
  (`wasmUrl` is carried so the worker can pass `locateFile` to littlefs — see spec §3 "littlefs `.wasm` location under a Next worker chunk needs a `locateFile` resolver".)

- [ ] **Step 2: VERIFY typecheck.**
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm typecheck
  ```
  Expect no errors (clean exit). The new file introduces only exported types.

- [ ] **Step 3: COMMIT.**
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && git add src/lib/sim/rp2040-protocol.ts && git commit -m "B1: add rp2040-protocol message union types"
  ```

---

### Task 3: THE SPIKE — `rp2040-boot.ts` + `scripts/rp2040-smoke.ts` (boot/inject/serial/gpio gate)

This is the lynchpin task. It RESOLVES, with the `SMOKE_OK` assertion as the geometry gate: (a) the `Simulator`-vs-raw-`RP2040`+`step()` run-loop strategy; (b) the `littlefs@0.1.0` export API; (c) the bootrom byte layout; (d) the UF2 block payload length; (e) the `0xA0000` offset + 352×4096 geometry; (f) the rp2040js export surface (which symbols are on the main export vs blocked by the `exports` map); (g) the PWM-register (`channels[].cc/.top/pinA*`) and ADC-injection (`adc.channelValues`) internal shapes. If the smoke cannot pass, the implementer ESCALATES — the approach needs rethinking; do NOT paper over it.

**Files**
- Create: `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/rp2040-boot.ts`
- Create: `/Users/marimo/Dev/robocode/robocode-frontend/scripts/rp2040-smoke.ts`

**Interfaces**
- Consumes: `rp2040js` (`RP2040`, `Simulator`, `USBCDC` — all on the main export), `littlefs`, `node:fs` (smoke only).
- Produces (in `rp2040-boot.ts`):
  - `FLASH_START_ADDRESS = 0x10000000`, `FUNCTION_PWM = 4` (local consts — see Step 0)
  - `loadBootromBytes(bytes: ArrayBuffer | Uint8Array): Uint32Array`
  - `parseUf2IntoFlash(uf2: ArrayBuffer | Uint8Array, flash: Uint8Array): void`
  - `buildLittleFsImage(code: string, wasmUrl?: string): Promise<Uint8Array>`
  - `LFS_OFFSET = 0xa0000`, `LFS_BLOCK_COUNT = 352`, `LFS_BLOCK_SIZE = 4096`
  - `interface BootedChip { rp2040: RP2040; cdc: USBCDC; start(): void; stop(): void; }`
  - `bootChip(opts: { bootrom: Uint32Array; uf2: Uint8Array; code: string; wasmUrl?: string; onSerialLine: (line: string) => void; onReady: () => void }): Promise<BootedChip>`
  - `decodePwmDuty(rp2040: RP2040, gpioNum: number): number | null`

- [ ] **Step 0: PROBE the rp2040js export surface BEFORE writing `rp2040-boot.ts`.** The package's `exports` map blocks deep subpath imports, and several symbols are NOT on the main export. Run:
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && node -e "const r=require('rp2040js'); console.log('keys:', Object.keys(r).join(', ')); console.log('FLASH_START_ADDRESS:', r.FLASH_START_ADDRESS); console.log('FUNCTION_PWM:', r.FUNCTION_PWM); console.log('USBCDC:', typeof r.USBCDC, 'Simulator:', typeof r.Simulator, 'RP2040:', typeof r.RP2040);"
  ```
  EXPECTED (controller-verified against 1.3.3): `USBCDC`, `Simulator`, `RP2040` are all `function` on the main export; `FLASH_START_ADDRESS` is `undefined` (lives only in `dist/cjs/rp2040.d.ts`); `FUNCTION_PWM` is `undefined` (lives only in `dist/cjs/gpio-pin.d.ts`). Deep imports like `rp2040js/dist/cjs/usb/cdc` and `rp2040js/dist/cjs/gpio-pin` throw `ERR_PACKAGE_PATH_NOT_EXPORTED`. THEREFORE: import `RP2040`, `Simulator`, `USBCDC` from `"rp2040js"` only, and define `FLASH_START_ADDRESS = 0x10000000` (= 268435456) and `FUNCTION_PWM = 4` as local consts (values confirmed). If the probe disagrees with these expectations, adjust the imports to match the printed surface before writing code.

- [ ] **Step 0b: PROBE the rp2040js PWM + ADC internal shapes (these escape the litttlefs/run-loop probe discipline otherwise).** Run:
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && node -e "const {Simulator}=require('rp2040js'); const s=new Simulator(); const r=s.rp2040; console.log('pwm.channels len:', r.pwm.channels.length); const c=r.pwm.channels[0]; console.log('channel keys:', Object.keys(c).join(',')); console.log('has cc/top/pinA1:', 'cc' in c || c.cc!==undefined, 'top' in c || c.top!==undefined, c.pinA1); console.log('adc.channelValues:', Array.isArray(r.adc.channelValues), 'len', r.adc.channelValues.length); console.log('gpio[0].functionSelect:', r.gpio[0].functionSelect);"
  ```
  EXPECTED (per facts): `pwm.channels` length 8; each channel exposes `cc`, `top`, and readonly `pinA1/pinB1/pinA2/pinB2`; `adc.channelValues` is an array of length 5. NAMED FALLBACKS if the probe disagrees: (PWM) if `channels`/`cc`/`top`/`pinA1` are absent or differently named, switch `decodePwmDuty` to read whatever the printed channel keys expose, and if no usable duty register exists at all, degrade PWM to digital on/off from `gpio[n].outputValue` (LED brightness/RGB → on/off; servo non-functional). (ADC) if `adc.channelValues` is not a writable array, replace the worker's `adc.channelValues[ch] = v` injection with overriding `adc.onADCRead = (ch) => adc.completeADCRead(value, false)`. Record the chosen path.

- [ ] **Step 1: PROBE the littlefs export surface BEFORE writing image code.** Run:
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && node -e "const m = require('littlefs'); console.log('module keys:', Object.keys(m)); console.log('default type:', typeof m.default); console.log('default keys:', m.default ? Object.keys(m.default) : 'none');"
  ```
  Record the output. Map the printed symbols to the calls in Step 3. The stable contract is: *format an empty LittleFS volume of RPI_PICO geometry, write the student code as `main.py`, emit the raw image bytes*. The known (facts-derived) low-level surface is `new LFS(bd)` + `new BD(...)` high-level classes, or cwrap names `_lfs_new`, `_lfs_new_config`, `_lfs_format`, `_lfs_mount`, `_lfs_file_open` + `_lfs_file_write` + `_lfs_file_close`, `_lfs_unmount` (NOTE: there is NO `lfs_write_file`, NO `_new_lfs`, NO `_new_lfs_config` — use the underscore-first `_lfs_*` names). Also check whether the module needs a `.wasm` resolver: if the probe shows the wasm is inlined, Task 1 Step 5's asset is unused. If the printed symbols cannot satisfy the contract (NUL truncation on the string arg, missing config constructor, no factory), switch to the **named fallback**: skip `buildLittleFsImage` and inject `main.py` by pasting it over the USB-CDC REPL via `cdc.sendSerialByte` (per byte — there is no bulk send) after boot (CTRL-A raw REPL, send `code` byte-by-byte, CTRL-D, then write `main.py` to FS from the REPL). Note in the commit which path shipped.

- [ ] **Step 2: Write `rp2040-boot.ts` — bootrom + UF2 helpers + geometry constants.**
  ```ts
  // Framework-free boot/inject/peripheral helpers shared by the Web Worker
  // (rp2040.worker.ts) and the headless smoke (scripts/rp2040-smoke.ts).
  // NO "use client", NO DOM, NO postMessage here — pure emulator wiring.

  import { RP2040, Simulator, USBCDC } from "rp2040js";

  // FLASH_START_ADDRESS and FUNCTION_PWM are NOT on the rp2040js main export and the
  // package `exports` map blocks the deep subpaths (Step 0). Define them locally.
  const FLASH_START_ADDRESS = 0x10000000; // 268435456 — verified
  const FUNCTION_PWM = 4; // gpio-pin FUNCTION_PWM — verified

  /** RPI_PICO MicroPython LittleFS partition base + geometry (firmware-build-specific). */
  export const LFS_OFFSET = 0xa0000;
  export const LFS_BLOCK_COUNT = 352;
  export const LFS_BLOCK_SIZE = 4096;

  /** Read raw bootrom bytes (little-endian words) into the Uint32Array loadBootrom expects. */
  export function loadBootromBytes(bytes: ArrayBuffer | Uint8Array): Uint32Array {
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    // Copy into an aligned buffer so the Uint32Array view is valid regardless of byteOffset.
    const aligned = new Uint8Array(u8.length);
    aligned.set(u8);
    return new Uint32Array(aligned.buffer, 0, aligned.length >>> 2);
  }

  /** Parse a UF2 image (512-byte blocks) and copy each block's payload into flash. */
  export function parseUf2IntoFlash(uf2: ArrayBuffer | Uint8Array, flash: Uint8Array): void {
    const data = uf2 instanceof Uint8Array ? uf2 : new Uint8Array(uf2);
    const BLOCK = 512;
    for (let off = 0; off + BLOCK <= data.length; off += BLOCK) {
      const dv = new DataView(data.buffer, data.byteOffset + off, BLOCK);
      // UF2 header: magic0 @0 (0x0A324655), magic1 @4 (0x9E5D5157). Skip non-UF2 blocks.
      if (dv.getUint32(0, true) !== 0x0a324655 || dv.getUint32(4, true) !== 0x9e5d5157) continue;
      const targetAddr = dv.getUint32(12, true); // bytes 12-15 LE
      const payloadLen = dv.getUint32(16, true); // bytes 16-19 LE — header is source of truth
      const flashAddr = targetAddr - FLASH_START_ADDRESS;
      if (flashAddr < 0 || flashAddr + payloadLen > flash.length) continue;
      for (let i = 0; i < payloadLen; i++) flash[flashAddr + i] = data[off + 32 + i]; // payload @32
    }
  }
  ```
  IMPLEMENTATION-TIME VERIFICATION: the per-block payload length is read from header bytes 16–19 rather than assumed (MicroPython UF2 blocks use 256-byte payloads; the header field is authoritative). The smoke proves this end to end.

- [ ] **Step 3: Add `buildLittleFsImage` to `rp2040-boot.ts` (use the Step 1 probed symbols — these names are from the facts, adjust to the printed surface).**
  ```ts
  import createLittleFS from "littlefs"; // adapt to the probed export shape (default factory)

  export async function buildLittleFsImage(code: string, wasmUrl?: string): Promise<Uint8Array> {
    // Under a bundler the .wasm is content-hashed/moved; pass locateFile -> the public/sim copy.
    // In Node (smoke) wasmUrl is undefined and Emscripten file: resolution works.
    const lfs = await createLittleFS(
      wasmUrl
        ? { locateFile: (p: string) => (p.endsWith(".wasm") ? wasmUrl : p) }
        : undefined,
    );
    const flash = new Uint8Array(LFS_BLOCK_COUNT * LFS_BLOCK_SIZE); // 1,441,792 bytes
    // read/prog/erase/sync callbacks backing onto `flash` (signatures per probed API):
    const read = lfs.addFunction(
      (_c: number, block: number, offIn: number, buf: number, size: number) => {
        const base = block * LFS_BLOCK_SIZE + offIn;
        for (let i = 0; i < size; i++) lfs.HEAPU8[buf + i] = flash[base + i];
        return 0;
      },
      "iiiiii",
    );
    const prog = lfs.addFunction(
      (_c: number, block: number, offIn: number, buf: number, size: number) => {
        const base = block * LFS_BLOCK_SIZE + offIn;
        for (let i = 0; i < size; i++) flash[base + i] = lfs.HEAPU8[buf + i];
        return 0;
      },
      "iiiiii",
    );
    const erase = lfs.addFunction((_c: number, block: number) => {
      flash.fill(0xff, block * LFS_BLOCK_SIZE, (block + 1) * LFS_BLOCK_SIZE);
      return 0;
    }, "iii");
    const sync = lfs.addFunction(() => 0, "ii");

    // NOTE the underscore-FIRST names (_lfs_new_config, _lfs_new) — NOT _new_lfs*.
    const config = lfs._lfs_new_config(read, prog, erase, sync, LFS_BLOCK_COUNT, LFS_BLOCK_SIZE);
    const lfsObj = lfs._lfs_new();
    lfs._lfs_format(lfsObj, config);
    lfs._lfs_mount(lfsObj, config);

    // There is NO lfs_write_file helper — open(creat|wronly) -> write -> close.
    const LFS_O_WRONLY = 1, LFS_O_CREAT = 0x0100; // standard littlefs flags
    const file = lfs._lfs_new_file();
    lfs._lfs_file_open(lfsObj, file, "main.py", LFS_O_WRONLY | LFS_O_CREAT);
    // UTF-8 BYTE length, not code.length (UTF-16 code units). Marshal bytes via the heap.
    const bytes = new TextEncoder().encode(code);
    const ptr = lfs._malloc(bytes.byteLength);
    lfs.HEAPU8.set(bytes, ptr);
    lfs._lfs_file_write(lfsObj, file, ptr, bytes.byteLength);
    lfs._lfs_file_close(lfsObj, file);
    lfs._free(ptr);

    lfs._lfs_unmount(lfsObj, config);
    return flash;
  }
  ```
  IMPLEMENTATION-TIME VERIFICATION: if the probe (Step 1) exposes only the higher-level `LFS`/`BD` classes (`new BD(1,1,LFS_BLOCK_SIZE,LFS_BLOCK_SIZE*LFS_BLOCK_COUNT)`, `new LFS(bd)`, `lfs.format()`, `lfs.mount()`, `lfs.open('main.py', ['wronly','creat'])`, `f.write(bytes)`, `f.close()`, then read the backing block-device buffer for the image), use THAT API instead of the cwrap calls — both reach the same contract; the printed surface decides. The `main.py` payload is written from the UTF-8 byte buffer via a heap pointer (avoids the cwrap `'string'` NUL-truncation risk entirely). If Step 1 routed to the REPL-paste fallback, this function is omitted and `bootChip` injects via `cdc.sendSerialByte` instead.

- [ ] **Step 4: Add `bootChip` (run-loop strategy resolved here) + `decodePwmDuty` to `rp2040-boot.ts`.** PRIMARY: `Simulator`. NAMED FALLBACK (architectural, not just test): if `Simulator`'s loop does not cooperate with pre-`execute()` flash mutation or live peripheral access, switch to a raw `new RP2040()` + manual `step()` batched into `setTimeout(0)` chunks.
  ```ts
  export interface BootedChip {
    rp2040: RP2040;
    cdc: USBCDC;
    start(): void;
    stop(): void;
  }

  export async function bootChip(opts: {
    bootrom: Uint32Array;
    uf2: Uint8Array;
    code: string;
    wasmUrl?: string;
    onSerialLine: (line: string) => void;
    onReady: () => void;
  }): Promise<BootedChip> {
    const sim = new Simulator();
    const rp2040 = sim.rp2040;
    rp2040.loadBootrom(opts.bootrom);
    parseUf2IntoFlash(opts.uf2, rp2040.flash);
    const fsImage = await buildLittleFsImage(opts.code, opts.wasmUrl);
    rp2040.flash.set(fsImage, LFS_OFFSET);

    const cdc = new USBCDC(rp2040.usbCtrl);
    let partial = "";
    const dec = new TextDecoder();
    cdc.onSerialData = (buf: Uint8Array) => {
      partial += dec.decode(buf, { stream: true });
      let nl: number;
      while ((nl = partial.indexOf("\n")) >= 0) {
        opts.onSerialLine(partial.slice(0, nl));
        partial = partial.slice(nl + 1);
      }
    };
    cdc.onDeviceConnected = () => opts.onReady();

    rp2040.reset();
    return {
      rp2040,
      cdc,
      start: () => sim.execute(),
      stop: () => sim.stop(),
    };
  }

  /** Decode PWM duty 0..1 for a GPIO in PWM function-select mode, or null if not PWM. */
  export function decodePwmDuty(rp2040: RP2040, gpioNum: number): number | null {
    if (rp2040.gpio[gpioNum]?.functionSelect !== FUNCTION_PWM) return null;
    for (const ch of rp2040.pwm.channels) {
      const period = ch.top + 1; // top = wrap value (period - 1)
      if (period <= 0) continue;
      if (ch.pinA1 === gpioNum || ch.pinA2 === gpioNum) return (ch.cc & 0xffff) / period; // A = cc[15:0]
      if (ch.pinB1 === gpioNum || ch.pinB2 === gpioNum) return ((ch.cc >>> 16) & 0xffff) / period; // B = cc[31:16]
    }
    return null;
  }
  ```
  IMPLEMENTATION-TIME VERIFICATION (run-loop): if `sim.execute()` will not accept pre-`execute()` flash writes or `gpio[n].addListener` mid-run, replace `start`/`stop` with a manual loop: `let running = true; const tick = () => { for (let i = 0; i < 100000 && running; i++) rp2040.step(); if (running) setTimeout(tick, 0); };` — `start: () => { running = true; tick(); }`, `stop: () => { running = false; }`. The smoke (next steps) decides which ships.

- [ ] **Step 5: Write `scripts/rp2040-smoke.ts` — the geometry/boot gate (races assertions against a 15s ceiling).**
  ```ts
  // Headless gate (npx tsx). Boots a tiny main.py and asserts SMOKE_OK + GP25 toggle.
  // Exercises the EXACT rp2040-boot.ts code the worker uses, minus DOM canvas writes.
  import { readFileSync } from "node:fs";
  import { resolve } from "node:path";
  import {
    bootChip,
    loadBootromBytes,
    parseUf2IntoFlash,
    decodePwmDuty,
  } from "../src/lib/sim/rp2040-boot";

  const ROOT = resolve(__dirname, "..");
  const uf2 = new Uint8Array(readFileSync(resolve(ROOT, "public/sim/RPI_PICO-20241129-v1.24.1.uf2")));
  const bootrom = loadBootromBytes(readFileSync(resolve(ROOT, "public/sim/rp2040-bootrom.bin")));

  const MAIN_PY =
    'from machine import Pin\nimport time\nprint("SMOKE_OK")\nled = Pin(25, Pin.OUT)\nled.toggle()\n';
  const PWM_PY =
    'from machine import Pin, PWM\np = PWM(Pin(0))\np.freq(1000)\np.duty_u16(32768)\nprint("PWM_OK")\n';
  const MODE = process.argv[2] === "pwm" ? "pwm" : "blink";

  async function main() {
    // Pre-parse assertion: confirm UF2 lands real firmware (ARM vector table is not 0xFF),
    // so a SMOKE_OK failure can be attributed to LFS geometry, not a dead UF2 parse.
    const probe = new Uint8Array(LFS_OFFSET_PLACEHOLDER); // see below
    void probe;

    let sawSmoke = false;
    let gpio25Toggled = false;
    let ready = false;
    let done = false;
    const finished = new Promise<void>((r) => {
      doneResolve = r;
    });
    let doneResolve!: () => void;

    const chip = await bootChip({
      bootrom,
      uf2,
      code: MODE === "pwm" ? PWM_PY : MAIN_PY,
      onSerialLine: (line) => {
        if (line.includes("SMOKE_OK")) sawSmoke = true;
        console.log("[serial]", line);
        if (MODE === "blink" && sawSmoke && gpio25Toggled && !done) {
          done = true;
          doneResolve();
        }
      },
      onReady: () => {
        ready = true;
      },
    });

    // Sanity: firmware bytes present in flash (ARM vector table at flash[0..3] not all 0xFF).
    const v = chip.rp2040.flash;
    if (v[0] === 0xff && v[1] === 0xff && v[2] === 0xff && v[3] === 0xff) {
      throw new Error("FAIL: UF2 parse wrote nothing to flash[0..3] (parseUf2IntoFlash / FLASH_START off)");
    }

    chip.rp2040.gpio[25].addListener(() => {
      gpio25Toggled = true;
      if (MODE === "blink" && sawSmoke && gpio25Toggled && !done) {
        done = true;
        doneResolve();
      }
    });

    chip.start();
    // Race the assertions against a 15s wall-clock ceiling (USB enumeration + main.py).
    await Promise.race([finished, new Promise((r) => setTimeout(r, 15000))]);

    if (MODE === "pwm") {
      let duty: number | null = null;
      for (let i = 0; i < 50; i++) {
        duty = decodePwmDuty(chip.rp2040, 0);
        if (duty !== null && duty > 0) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      chip.stop();
      console.log("decoded duty GP0:", duty);
      if (duty === null) throw new Error("FAIL: GP0 not in PWM mode (functionSelect != FUNCTION_PWM)");
      if (!(duty > 0.3 && duty < 0.7)) throw new Error(`FAIL: decoded duty ${duty} not ~0.5`);
      console.log("PASS (pwm)");
      return;
    }

    chip.stop();
    console.log("ready:", ready, "SMOKE_OK:", sawSmoke, "gpio25Toggled:", gpio25Toggled);
    if (!sawSmoke) throw new Error("FAIL: SMOKE_OK not seen — LFS offset/geometry wrong, main.py never ran");
    if (!gpio25Toggled) throw new Error("FAIL: gpio[25] never toggled");
    console.log("PASS");
  }

  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
  ```
  (Drop the `LFS_OFFSET_PLACEHOLDER` probe stub when transcribing — it is illustrative; the real pre-parse sanity check is the `flash[0..3] !== 0xFF` assertion after `bootChip`, which disambiguates a dead UF2 parse from a wrong LFS offset. `import { parseUf2IntoFlash }` stays imported for that conceptual check even though `bootChip` calls it internally; if unused after transcription, drop the import to satisfy typecheck.)

- [ ] **Step 6: VERIFY the boot/serial/gpio gate.**
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && npx tsx scripts/rp2040-smoke.ts
  ```
  Expect a `[serial] ...SMOKE_OK...` line, a final `ready: true SMOKE_OK: true gpio25Toggled: true`, `PASS`, and exit 0. FAILURE TREE (diagnose in this order):
  - `flash[0..3]` all-0xFF FAIL → UF2 parse wrote nothing: check `FLASH_START_ADDRESS` const and the UF2 magic/payload-length read (Step 2), NOT the LFS geometry.
  - Boot hangs with NO serial at all → switch to the manual `step()` run loop (Step 4 fallback).
  - LittleFS image build threw → switch to the REPL-paste fallback (Step 1).
  - `SMOKE_OK` absent BUT some serial seen AND `flash[0..3]` OK → the `0xA0000` offset / 352×4096 geometry is wrong for this UF2 build (re-derive the FS base/size from the v1.24.1 RPI_PICO layout: storage base = total flash − FS size; recompute from the UF2's highest written address) **OR** Task 1 shipped the 2048-word bootrom and the upper words being zeroed broke boot → re-run Task 1 Step 4 with the ELF/4096-word fallback before re-deriving geometry.
  ESCALATE rather than paper over a persistent failure.

- [ ] **Step 7: VERIFY the PWM-duty decode gate (resolves the PWM liveness risk).**
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && npx tsx scripts/rp2040-smoke.ts pwm
  ```
  Expect a `[serial] ...PWM_OK...` line, `decoded duty GP0: ~0.5`, `PASS (pwm)`, exit 0. If duty is `null` or never moves off a static value: the registers are not live — record this and switch the engine PWM path to digital on/off (Task 6 mirror note). Then re-run the blink gate to confirm no regression:
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && npx tsx scripts/rp2040-smoke.ts
  ```
  Expect `PASS`.

- [ ] **Step 8: COMMIT.**
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && git add src/lib/sim/rp2040-boot.ts scripts/rp2040-smoke.ts && git commit -m "B1: spike — rp2040-boot boot/inject/serial/gpio/pwm + headless smoke (SMOKE_OK + duty gates)"
  ```

---

### Task 4: The Web Worker (`rp2040.worker.ts`)

**Files**
- Create: `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/rp2040.worker.ts`

**Interfaces**
- Consumes: `bootChip`, `loadBootromBytes`, `decodePwmDuty`, `BootedChip` from `rp2040-boot.ts`; `Rp2040InMessage`, `Rp2040OutMessage` from `rp2040-protocol.ts`.
- Produces: a module Web Worker that handles `init`/`input`/`stop` and posts the out-union. Its emulator logic is the SAME `rp2040-boot.ts` proven by the smoke; only the postMessage/coalescer wiring is new.

- [ ] **Step 1: Write the worker (NO `"use client"`).**
  ```ts
  // First Web Worker in the app. Wraps rp2040-boot.ts. NO "use client" (that is for
  // React modules). The emulator logic here is proven by scripts/rp2040-smoke.ts.
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

  async function init(msg: Extract<Rp2040InMessage, { type: "init" }>) {
    try {
      const [uf2Buf, bootBuf] = await Promise.all([
        fetch(msg.uf2Url).then((r) => r.arrayBuffer()),
        fetch(msg.bootromUrl).then((r) => r.arrayBuffer()),
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
          post({ type: "ready" });
        },
      });
      if (halted) return;

      // GPIO out: edge-driven listeners mark pins dirty (addListener returns a remover).
      for (let n = 0; n < 30; n++) {
        const pin = chip.rp2040.gpio[n];
        const remove = pin.addListener(() => {
          dirtyOut.set(n, pin.outputValue);
        });
        removeListeners.push(remove);
      }

      // Coalescer ~30 Hz: flush dirty out-levels + poll PWM duty deltas.
      coalescer = setInterval(() => {
        if (halted || !chip) return;
        const outputs: Record<number, boolean> = {};
        const pwm: Record<number, number> = {};
        for (const [n, v] of dirtyOut) outputs[n] = v;
        dirtyOut.clear();
        for (let n = 0; n < 30; n++) {
          const duty = decodePwmDuty(chip.rp2040, n);
          if (duty === null) continue;
          if (lastPwm.get(n) !== duty) {
            lastPwm.set(n, duty);
            pwm[n] = duty;
          }
        }
        if (Object.keys(outputs).length || Object.keys(pwm).length) {
          post({ type: "gpio", outputs, pwm });
        }
      }, 33);

      // ready timeout fallback (USB enumeration may never complete on a bad build).
      readyTimeout = setTimeout(() => {
        if (halted) return;
        post({ type: "error", message: "MicroPython did not enumerate within 15s." });
        post({ type: "stop" });
      }, 15000);

      chip.start();
    } catch (e) {
      post({ type: "error", message: e instanceof Error ? e.message : String(e) });
      post({ type: "stop" });
    }
  }

  function applyInput(msg: Extract<Rp2040InMessage, { type: "input" }>) {
    if (halted || !chip) return;
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
  ```

- [ ] **Step 2: VERIFY typecheck.**
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm typecheck
  ```
  Expect no errors. (The worker's emulator behavior is proven by the Task 3 smoke, which exercises the same `rp2040-boot.ts` functions; typecheck is the gate here.)

- [ ] **Step 3: COMMIT.**
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && git add src/lib/sim/rp2040.worker.ts && git commit -m "B1: rp2040.worker — init/input/stop, USB-CDC serial, gpio+pwm coalescer, ready timeout"
  ```

---

### Task 5: `Rp2040Engine` (`rp2040-engine.ts`)

This task lands BEFORE the `createEngine` wiring (Task 6) so that Task 6's typecheck can actually pass (the import resolves to a real class). Reordered per the consistency/sizing reviews — `createEngine` must not reference a not-yet-existing module.

**Files**
- Create: `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/rp2040-engine.ts`

**Interfaces**
- Consumes: `SimEngine`, `EngineCallbacks` from `./engine`; `Rp2040InMessage`, `Rp2040OutMessage` from `./rp2040-protocol`; `resolveNetlist` from `./netlist`; `getPinInfo`, `getPartEl` from `@/lib/studio/pin-registry`; `COMPONENT_BY_ID` from `@/lib/domain/components`; `BoardDef` from `@/lib/domain/boards`; `Diagram` from `@/lib/domain/diagram`.
- Produces: `export class Rp2040Engine implements SimEngine` with constructor `(board: BoardDef, diagram: Diagram, code: string, cb: EngineCallbacks)`, `start(): boolean`, `stop(): void`, the four input bags, and no `machine` member.

- [ ] **Step 1: Write the engine skeleton (`"use client"`, four input bags, no `machine`).**
  ```ts
  "use client";

  import type { Diagram } from "@/lib/domain/diagram";
  import type { BoardDef } from "@/lib/domain/boards";
  import { COMPONENT_BY_ID } from "@/lib/domain/components";
  import { resolveNetlist, type ResolvedNet } from "@/lib/sim/netlist";
  import { getPinInfo, getPartEl } from "@/lib/studio/pin-registry";
  import type { EngineCallbacks, SimEngine } from "./engine";
  import type { Rp2040InMessage, Rp2040OutMessage } from "./rp2040-protocol";

  const isPower = (p: string) => /^(GND|5V|3V3|VIN|VCC|VDD|VSS)/i.test(p);
  /** Pico Wokwi labels are "GP13"/bare numbers; reduce to an integer GPIO number. */
  function normGpio(p: string): number | null {
    const m = /^GP?(\d+)$/.exec(p) ?? /^(\d+)$/.exec(p);
    return m ? Number(m[1]) : null;
  }
  /** Board analog pins GPIO 26->ch0, 27->ch1, 28->ch2 (the BoardDef's analog: ["26","27","28"]). */
  const adcChannelFor = (gpio: number): number | null =>
    gpio >= 26 && gpio <= 28 ? gpio - 26 : null;

  export class Rp2040Engine implements SimEngine {
    private static readonly LED_BUILTIN = 25;
    private static readonly ADC_FULL = 4095;

    // interactive input state (mutated by sim-overlay.tsx)
    potValues: Record<string, number> = {};
    pressed: Record<string, boolean> = {};
    distances: Record<string, number> = {}; // ultrasonic bag — intentionally unwired in B1 (no-op)
    analogInputs: Record<string, number> = {};
    // note: no `machine` member (now optional on SimEngine)

    private net: ResolvedNet;
    private worker: Worker | null = null;
    private stopped = false;
    private inputTimer: ReturnType<typeof setInterval> | null = null;
    private notifiedUnsimulated = false;

    // mirrors (replace Machine)
    private gpioOut: Record<number, boolean> = {};
    private pwmDuty: Record<number, number> = {};

    // last-sent input snapshot (change-only forwarding)
    private lastInput = "";

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

    /** First non-power control pin of a part, as a GPIO number. */
    private controlGpio(partId: string, pins: string[]): number | null {
      for (const name of pins) {
        const b = this.boardPinFor(partId, name);
        if (b && !isPower(b)) {
          const g = normGpio(b);
          if (g !== null) return g;
        }
      }
      return null;
    }
  ```
  IMPLEMENTATION-TIME VERIFICATION (load-bearing): the Pico `BoardDef` uses `wokwiTag: "wokwi-nano-rp2040-connect"` — the **Arduino Nano RP2040 Connect**, whose pin labels and analog pins may NOT be bare-Pico `GP26..28` (they may be labeled `A0..A3`). Confirm the actual labels `getPinInfo` reports for this element and adjust `normGpio` AND `adcChannelFor` so pots/sensors map to real ADC channels — tie the ADC channel derivation to the printed `pinInfo` labels, not just the `/^GP\d+$/` regex. Cross-check against the BoardDef's `gpio: ["0".."25"]` / `analog: ["26","27","28"]` arrays (3 analog channels, ch0–ch2; GP29/ch4 internal sense is NOT a board analog pin).

- [ ] **Step 2: Add `start()` (spawns worker, posts init, returns true synchronously).**
  ```ts
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
            this.updateOutputs();
            break;
          case "ready":
            // "Booting MicroPython..." is superseded by subsequent real serial output;
            // on ready we surface the un-simulated-device notice (see Step 5).
            this.emitUnsimulatedNotice();
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
      };
      this.worker.postMessage(init);
      this.cb.onSerial("Booting MicroPython..."); // transient; superseded by real output on ready
      this.startInputForwarding();
      return true; // boot is async; failures surface later via error/stop
    }
  ```

- [ ] **Step 3: Add input forwarding (pull-up inversion once, here).**
  ```ts
    private startInputForwarding() {
      this.inputTimer = setInterval(() => {
        if (this.stopped || !this.worker) return;
        const gpioInputs: Record<number, boolean> = {};
        const adcValues: Record<number, number> = {};
        const scale = (raw: number) =>
          Math.round((Math.max(0, Math.min(1023, raw)) * Rp2040Engine.ADC_FULL) / 1023);

        for (const part of this.diagram.parts) {
          const def = COMPONENT_BY_ID[part.type];
          if (!def) continue;
          const pins = getPinInfo(part.id).map((p) => p.name);
          const g = this.controlGpio(part.id, pins);
          switch (def.simRole) {
            case "pushbutton":
            case "switch": {
              if (g !== null) gpioInputs[g] = !(this.pressed[part.id] ?? false); // pull-up: released = high
              break;
            }
            case "pir": {
              if (g !== null) gpioInputs[g] = this.pressed[part.id] ?? false;
              break;
            }
            case "potentiometer":
            case "ldr":
            case "ntc":
            case "dht":
            case "gas":
            case "flame":
            case "sound": {
              if (g !== null) {
                const ch = adcChannelFor(g);
                if (ch !== null) {
                  const raw = this.potValues[part.id] ?? this.analogInputs[part.id] ?? 0;
                  adcValues[ch] = scale(raw);
                }
              }
              break;
            }
            // ultrasonic: intentionally unwired in B1 (distances bag is a no-op — see §5 / Out of scope)
          }
        }

        const snapshot = JSON.stringify({ gpioInputs, adcValues });
        if (snapshot === this.lastInput) return; // change-only
        this.lastInput = snapshot;
        const msg: Rp2040InMessage = { type: "input", gpioInputs, adcValues };
        this.worker.postMessage(msg);
      }, 80);
    }
  ```
  (Adjust the `simRole` string literals to the exact union in `COMPONENT_BY_ID` if any differ — the Task 5 Step 6 typecheck surfaces mismatches.)

- [ ] **Step 4: Add `updateOutputs()` (component-sync TABLE; duty `0..1` source).**
  ```ts
    private updateOutputs() {
      // built-in LED (hardcoded GP25). Drives the existing "mcu" element's led13 property —
      // the same well-known canvas contract InterpreterEngine uses (engine.ts:161-163).
      const mcu = getPartEl("mcu") as (HTMLElement & { led13?: boolean }) | undefined;
      if (mcu) {
        try {
          mcu.led13 = this.gpioOut[Rp2040Engine.LED_BUILTIN] ?? false;
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
                  if (b && !isPower(b)) {
                    const gp = normGpio(b);
                    if (gp !== null) return dutyOf(gp) * 255; // rescale 0..1 -> 0..255 (element expects 0..255)
                  }
                }
              }
              return 0;
            };
            try {
              el.ledRed = chan(/^R|red/i);
              el.ledGreen = chan(/^G|green/i);
              el.ledBlue = chan(/^B|blue/i);
            } catch {}
            break;
          }
          case "buzzer": {
            const active = dutyOf(g) > 0;
            try { el.hasSignal = active; } catch {}
            this.setTone(part.id, active ? 880 : 0); // fixed audible tone on signal (B1; freq decode deferred)
            break;
          }
          case "servo": {
            // best-effort: a 0..1 PWM duty does NOT map linearly to 0..180 for RC servos
            // (usable window is ~2.5%-12.5% duty at 50 Hz, needing the slice DIVISOR for pulse width,
            // which PWMChannel does not expose). Servo angle is therefore DEFERRED in B1: leave the
            // element angle unset rather than ship a misleading map. If a divisor field surfaces
            // during the spike, implement angleFromPulseUs here.
            break;
          }
          case "7seg": {
            const segs = ["A", "B", "C", "D", "E", "F", "G", "DP"];
            const values = segs.map((s) => {
              const b = this.boardPinFor(part.id, s);
              if (!b || isPower(b)) return 0;
              const gp = normGpio(b);
              return gp !== null && this.gpioOut[gp] ? 1 : 0;
            });
            try { el.values = values; } catch {}
            break;
          }
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
      }
    }
  ```
  IMPLEMENTATION-TIME DECISION: prefer extracting `setTone`/`ensureAudio` from `InterpreterEngine` (engine.ts ~lines 270–300) into a shared helper both engines import, rather than duplicating `AudioContext` code; if extraction touches the Uno/ESP32 path more than trivially, reimplement a minimal oscillator local to `Rp2040Engine` instead. Provide a `private setTone(partId: string, freq: number)` here either way. If the Task 3 Step 7 PWM liveness gate FAILED, `dutyOf` already degrades to `gpioOut ? 1 : 0`, so LED brightness/RGB become on/off — no further change needed; servo stays deferred regardless.

- [ ] **Step 5: Add the un-simulated-device notice + teardown + idempotent stop.**
  ```ts
    private emitUnsimulatedNotice() {
      if (this.notifiedUnsimulated) return;
      const roles = new Set(
        this.diagram.parts
          .map((p) => COMPONENT_BY_ID[p.type]?.simRole)
          .filter((r): r is string => r === "lcd" || r === "oled" || r === "neopixel"),
      );
      if (roles.size === 0) return;
      this.notifiedUnsimulated = true;
      this.cb.onSerial(
        "note: I2C/SPI/PIO devices (LCD/OLED/NeoPixel) run in firmware but are not yet drawn on the canvas (coming in B2/B3).",
      );
    }

    private teardown() {
      if (this.inputTimer) {
        clearInterval(this.inputTimer);
        this.inputTimer = null;
      }
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
    }

    stop(): void {
      if (this.stopped) return;
      this.stopped = true; // set BEFORE terminate so late worker messages are dropped
      this.worker?.postMessage({ type: "stop" } satisfies Rp2040InMessage);
      this.teardown();
      this.cb.onStop();
    }
  }
  ```

- [ ] **Step 6: VERIFY typecheck.**
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm typecheck
  ```
  Expect a single error: `engine.ts`/`use-simulation.ts` cannot yet construct `Rp2040Engine` is NOT relevant here (createEngine is wired in Task 6) — `rp2040-engine.ts` itself must typecheck clean in isolation. If `pnpm typecheck` reports errors ONLY from unrelated wiring, ignore them; fix any error originating in `rp2040-engine.ts` (e.g. `simRole` literal mismatches against the real `COMPONENT_BY_ID` union, element-property typing). Expected end state: no errors attributable to `rp2040-engine.ts`.

- [ ] **Step 7: COMMIT.**
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && git add src/lib/sim/rp2040-engine.ts && git commit -m "B1: Rp2040Engine — worker spawn, gpio/pwm mirror, Pico updateOutputs, input forwarding, idempotent stop"
  ```

---

### Task 6: Interface loosening + `createEngine` rp2040js case

Runs AFTER Task 5 so the `Rp2040Engine` import resolves and this task's own typecheck gate can pass.

**Files**
- Modify: `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/engine.ts`

**Interfaces**
- Consumes: `Rp2040Engine` from `./rp2040-engine` (now exists, from Task 5).
- Produces: optional `SimEngine.machine`; `createEngine` returning `new Rp2040Engine(...)` for `rp2040js`.

- [ ] **Step 1: Loosen `SimEngine.machine` to optional.** Replace lines 33–34:
  ```ts
      // observable machine state (read by updateOutputs internally)
      machine: Machine;
  ```
  with:
  ```ts
      // observable machine state — read by InterpreterEngine internally only.
      // Verified: 0 external `engine.machine` readers; InterpreterEngine declares a
      // concrete `machine!: Machine` (engine.ts:45) which satisfies this optional member.
      // Optional so real-firmware engines (Rp2040Engine) need not fabricate a Machine.
      machine?: Machine;
  ```

- [ ] **Step 2: VERIFY the "0 external readers" claim is observable (not just asserted).** Run:
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && grep -rn "\.machine" src --include="*.ts" --include="*.tsx" | grep -v "src/lib/sim/engine.ts" | grep -v "src/lib/sim/machine.ts" | grep -v "src/lib/sim/interpreter.ts"
  ```
  Expected: NO output (the only `.machine` hits outside engine.ts are `interpreter.ts`'s own `Interpreter.machine` field — a different class, not `SimEngine.machine`). If any line references `engine.machine` / `eng.machine` / `.current.machine`, that is an external reader and the loosening is NOT safe — stop and reassess.

- [ ] **Step 3: Add the import at the top of `engine.ts`** (after line 10):
  ```ts
  import { Rp2040Engine } from "./rp2040-engine";
  ```

- [ ] **Step 4: Wire the `createEngine` rp2040js case.** Replace:
  ```ts
      case "rp2040js": // Spec B — Pico real-firmware engine slot (not implemented)
        throw new SimUnsupportedEngineError(board.id);
  ```
  with:
  ```ts
      case "rp2040js": // Spec B1 — Pico real MicroPython firmware via rp2040js in a Web Worker
        return new Rp2040Engine(board, diagram, code, callbacks);
  ```
  Leave the `default` case throwing `SimUnsupportedEngineError` unchanged. `SimUnsupportedEngineError` stays exported (still used by `use-simulation.ts`).

- [ ] **Step 5: VERIFY typecheck.**
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm typecheck
  ```
  Expect no errors. The optional `machine?` must not break `InterpreterEngine` (its concrete `machine!: Machine` still satisfies the optional member); the `createEngine` signature `new Rp2040Engine(board, diagram, code, callbacks)` matches Task 5's constructor `(board, diagram, code, cb)`.

- [ ] **Step 6: COMMIT.**
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && git add src/lib/sim/engine.ts && git commit -m "B1: loosen SimEngine.machine to optional + wire createEngine rp2040js -> Rp2040Engine"
  ```

---

### Task 7: Sketch plumbing (`store.ts` `sketchContent`)

**Files**
- Modify: `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/studio/store.ts`

**Interfaces**
- Consumes: `getBoard` from `@/lib/domain/boards` (CONFIRMED NOT currently imported in store.ts — only the `BoardId` type is; this task adds the import).
- Produces: board/language-aware `sketchContent()` — `.py`-first for `rp2040js` boards, `.ino`-first otherwise.

- [ ] **Step 1: Add the `getBoard` import.** store.ts currently has `import { type BoardId } from "@/lib/domain/boards";` (line 8). Change it to also import `getBoard`:
  ```ts
  import { getBoard, type BoardId } from "@/lib/domain/boards";
  ```

- [ ] **Step 2: Make `sketchContent()` board-aware.** Replace (lines 284–287):
  ```ts
  sketchContent: () => {
    const s = get();
    return (s.files.find((f) => f.name.endsWith(".ino")) ?? s.files[0])?.content ?? "";
  },
  ```
  with:
  ```ts
  sketchContent: () => {
    const s = get();
    const board = getBoard(s.board);
    if (board.mcuTarget === "rp2040js") {
      // Pico runs MicroPython: prefer the first .py file.
      return (s.files.find((f) => f.name.endsWith(".py")) ?? s.files[0])?.content ?? "";
    }
    return (s.files.find((f) => f.name.endsWith(".ino")) ?? s.files[0])?.content ?? "";
  },
  ```

- [ ] **Step 3: VERIFY typecheck.**
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm typecheck
  ```
  Expect no errors.

- [ ] **Step 4: COMMIT.**
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && git add src/lib/studio/store.ts && git commit -m "B1: sketchContent board-aware — .py-first for rp2040js boards"
  ```

---

### Task 8: Manual Studio verification (promoted to a checkbox task)

`updateOutputs` canvas writes cannot be headless-tested (they require a browser DOM + Wokwi elements), so this is a REQUIRED manual Studio check after Task 7. Tracked as checkboxes so a checkbox-following worker does not skip it.

**Files**
- None (manual verification only).

**Interfaces**
- Consumes: the running dev server + the full B1 implementation (Tasks 1–7).
- Produces: human-confirmed evidence that the canvas writes and the Uno/ESP32 regression hold.

- [ ] **Step 1: Start the dev server and open a Pico project.**
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm dev
  ```
  Open a `raspberry-pi-pico` project in the Studio.

- [ ] **Step 2: Press Run on the Pico project and confirm each:**
  - A transient `Booting MicroPython...` line appears, then real firmware/REPL output follows (the Pico starter's ready print, e.g. "RoboCode Pico ready!", appears within a few seconds once `ready` fires).
  - The on-board LED (GPIO 25) blinks ON-CANVAS (the `mcu` element's `led13` toggles).
  - An LED on a PWM pin visibly DIMS as duty changes (or toggles on/off if the Task 3 Step 7 liveness gate forced the digital fallback).
  - Pressing/holding a button drives the corresponding GPIO input (verify via a `.py` that prints pin reads).
  - Dragging a potentiometer changes an ADC reading (verify via a `.py` that prints `ADC.read_u16()`).
  - If an OLED/LCD/NeoPixel is on the diagram, the one-time un-simulated-device notice appears in serial after `ready`.

- [ ] **Step 3: Regression — Uno + ESP32 unchanged.** Open an Arduino Uno project and an ESP32 project, press Run, confirm both still run exactly as before (serial output, LED, inputs). The loosened optional `machine?` and the new `createEngine` case must not disturb the `InterpreterEngine` path.

- [ ] **Step 4: Rapid Stop->Run race.** Press Run, then Stop, then Run again quickly during boot; confirm no stale serial/gpio leaks from the first worker into the second run (the `stopped`/`halted` gating closes this race).

---

## Manual verification (post-implementation)

The manual Studio checks are tracked as **Task 8** above (promoted from prose to checkboxes so they are not skipped). The headless smoke (Tasks 3) proves the engine/worker core — boot, inject, serial, GPIO, PWM-duty decode, run-loop strategy — but the canvas property writes in `updateOutputs` (and the `mcu`/`led13` built-in-LED path) are observable only in a real browser DOM with the Wokwi elements mounted. Task 8 is therefore the final gate before the branch is considered B1-complete.
