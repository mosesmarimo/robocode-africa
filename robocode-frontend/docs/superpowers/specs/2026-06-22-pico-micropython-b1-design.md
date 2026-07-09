# Spec B1 — Core Raspberry Pi Pico MicroPython Engine

**Goal: Enable REAL MicroPython execution on the Raspberry Pi Pico in the Studio simulator for the first time, by booting the `rp2040js` chip emulator in a Web Worker behind the Spec A `createEngine` seam, with GPIO/PWM/ADC components live on the canvas.**

Date: 2026-06-22
Research doc: [`/Users/marimo/Dev/robocode/robocode-frontend/docs/mcu-emulation-research.md`](/Users/marimo/Dev/robocode/robocode-frontend/docs/mcu-emulation-research.md)

This is **B1** of the B1 -> B2 -> B3 sequence (B1 = GPIO/PWM/ADC core; B2 = I2C devices; B3 = SPI/PIO devices).

---

## Background

Pico MicroPython does **not** run today. The Studio simulator has exactly one execution engine — `InterpreterEngine` (`/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/engine.ts`) — and it parses only Arduino C++ (no `def`, `import`, or significant indentation). A `.py` sketch therefore parse-errors. Worse, the `raspberry-pi-pico` board's `mcuTarget` is `"rp2040js"`, and `createEngine` explicitly `throw`s `SimUnsupportedEngineError` for that case (engine.ts line 313). Pressing **Run** on a Pico project appends `'Simulation for board "raspberry-pi-pico" is not available yet.'` to the serial console and stops.

The frontend already depends on `rp2040js@1.3.3` — a cycle-accurate RP2040 emulator that runs real ARM firmware. B1 wires it in behind the existing Spec A seam: a new `Rp2040Engine` implements the `SimEngine` interface, runs the emulator inside a Web Worker (off the main thread), boots a pinned MicroPython UF2, injects the student's `.py` as `main.py` via a LittleFS flash image (auto-run on boot), and streams serial output + GPIO/PWM/ADC state back to the main thread to drive the SAME on-canvas Wokwi elements that `InterpreterEngine` already drives. No other board behavior changes; the Spec A seam is touched only to loosen one interface member.

---

## Goals / Non-Goals

### Goals
- Real MicroPython firmware boots and runs the student's `.py` sketch in the Studio simulator for the Pico board.
- Serial REPL / `print()` output streams to the existing serial console.
- GPIO digital outputs (LED, relay), PWM-driven outputs (LED brightness, RGB, buzzer, servo), and analog/digital inputs (button, switch, PIR, potentiometer/LDR, analog sensors via ADC) are live on the canvas.
- Execution runs in a Web Worker (off the main thread) — the FIRST Web Worker in this app.
- The Spec A `createEngine` seam stays intact; only the `machine` member of `SimEngine` is loosened.
- Uno (`avr8js`) and ESP32 (`esp32`) behavior is byte-for-byte unchanged.

### Non-Goals
- **NO I2C/SPI/PIO device RENDERING.** LCD1602 (PCF8574), SSD1306 OLED, and WS2812 NeoPixel devices run inside MicroPython but stay **static** on the diagram in B1 (their `updateOutputs` branches are no-ops). To avoid an "is the simulator broken?" reaction, B1 ships a visible notice for these parts (see Components §5, "Un-simulated device visibility"). Rendering them is B2 (I2C) and B3 (SPI/PIO).
- **NO Arduino-C++-on-Pico.** The Pico path is MicroPython only in B1.
- **NO backend grading of `.py`.** Grading a MicroPython sketch is out of scope; no backend changes in B1.
- **NO changes to the Uno/ESP32 `InterpreterEngine` path.**

---

## Architecture

### Worker / main-thread split

The emulator (CPU, flash, peripherals, the busy run loop) lives entirely in a Web Worker. The main-thread `Rp2040Engine` owns the `SimEngine` contract, the netlist, the canvas DOM writes, and the input bags. They communicate over a typed `postMessage` protocol.

```
 main thread                                  worker (rp2040.worker.ts)
 ──────────────────────────────────────       ───────────────────────────────────
 use-simulation.ts                            rp2040js: RP2040 (+ optional Simulator)
   createEngine() -> new Rp2040Engine(...)      loadBootrom + UF2 -> flash
   eng.start() (synchronous, returns true)      LittleFS image (main.py) -> flash @0xA0000
                                                USBCDC.onSerialData -> serial lines
 Rp2040Engine                                   gpio[n].addListener -> outputs (edge)
   gpio/pwm mirror <- worker messages           pwm.channels[n] cc/top POLLED -> pwm duty
   updateOutputs() -> Wokwi elements (DOM)       adc.channelValues[n] <- input
   input bags -> worker                          run loop yields to event loop

 Rp2040InMessage  (main -> worker):  init | input | stop
 Rp2040OutMessage (worker -> main):  ready | serial | gpio | error | stop
```

### Message protocol (discriminated union)

Defined in a new shared module `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/rp2040-protocol.ts` (plain types, no `"use client"`, importable by both the worker and the main thread):

```ts
// main thread -> worker
export type Rp2040InMessage =
  | { type: "init"; uf2Url: string; bootromUrl: string; code: string }
  | { type: "input"; gpioInputs: Record<number, boolean>; adcValues: Record<number, number> }
  | { type: "stop" };

// worker -> main thread
export type Rp2040OutMessage =
  | { type: "ready" }                                  // firmware booted, USB-CDC up, main.py running
  | { type: "serial"; line: string }                   // one complete line (newline-split)
  | { type: "gpio"; outputs: Record<number, boolean>;  // raw pin out-values, coalesced (edge-driven)
                    pwm: Record<number, number> }       // GPIO -> duty 0..1 (decoded), coalesced (polled)
  | { type: "error"; message: string }                 // fetch/boot/runtime failure
  | { type: "stop" };                                  // worker has halted + cleaned up
```

- `input.gpioInputs` is keyed by **GPIO number** (button/switch/PIR digital level driven into `gpio[n].setInputValue`). `input.adcValues` is keyed by **ADC channel 0–3** (GPIO 26–29), 12-bit `0..4095`.
- `gpio.outputs[n]` is the raw `gpio[n].outputValue` boolean, collected **edge-driven** via `addListener`. `gpio.pwm[n]` is the decoded duty ratio `0..1` for pins in PWM function-select mode, collected by **polling** `channels[].cc`/`.top` on the coalescer tick — PWM duty changes via register writes, not pin edges, so it has no listener (see Components §3, "PWM duty").
- Both `gpio.outputs` and `gpio.pwm` are **coalesced** (delta-only, throttled to ~30 Hz) to avoid flooding the main thread from the busy run loop.
- `init` carries both `uf2Url` and `bootromUrl` (rp2040js ships no bootrom — see Components §2).

### Loosened SimEngine interface (the only Spec A change)

`/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/engine.ts`, `SimEngine` interface (lines 22–35). The `machine` member is read **only** by `InterpreterEngine` internally (its `setupInputs`/`updateOutputs` reference `this.machine` at engine.ts lines 72, 102, 159); a verified grep shows **0 external `engine.machine` readers**. We make it optional so `Rp2040Engine` need not fabricate a `Machine`.

Before (lines 33–34):
```ts
  // observable machine state (read by updateOutputs internally)
  machine: Machine;
```

After:
```ts
  // observable machine state — read by InterpreterEngine internally only.
  // Verified: 0 external `engine.machine` readers; InterpreterEngine declares a
  // concrete `machine!: Machine` (engine.ts:45) which satisfies this optional member.
  // Optional so real-firmware engines (Rp2040Engine) need not fabricate a Machine.
  machine?: Machine;
```

Why this is byte-for-byte safe for Uno/ESP32: widening a member to optional is source-compatible, and `InterpreterEngine`'s concrete `machine!: Machine` field still satisfies it. The only code that could break is `engine.machine.x` on an external reference — and there is none (verified). `start()`/`stop()` signatures are **not** changed; the four input bags (`potValues`, `analogInputs`, `distances`, `pressed`) are unchanged.

### createEngine rp2040js case

`createEngine` (engine.ts lines 303–318). Replace the throwing case:

Before (line 313):
```ts
    case "rp2040js": // Spec B — Pico real-firmware engine slot (not implemented)
      throw new SimUnsupportedEngineError(board.id);
```

After:
```ts
    case "rp2040js": // Spec B1 — Pico real MicroPython firmware via rp2040js in a Web Worker
      return new Rp2040Engine(board, diagram, code, callbacks);
```

`SimUnsupportedEngineError` is retained for the `default` case (any future unwired `mcuTarget`). The new file adds `import { Rp2040Engine } from "./rp2040-engine";` at the top of `engine.ts`. The canonical class name is **`Rp2040Engine`** everywhere (matching the file `rp2040-engine.ts` and the import); it is never spelled `PicoEngine` or `RP2040Engine`.

---

## Components

### 1. Interface loosening

- **Modify:** `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/engine.ts`
  - `SimEngine.machine` -> `machine?: Machine` (exact diff above).
  - `createEngine` `"rp2040js"` case -> `return new Rp2040Engine(...)` (exact diff above).
  - Add `import { Rp2040Engine } from "./rp2040-engine";`.
- **Responsibility:** open the seam without faking a `Machine` and without disturbing the `avr8js`/`esp32` cases.
- **Integration point:** `use-simulation.ts` `start()` already calls `createEngine(...)` in a try/catch and `eng.start()` synchronously. Because the rp2040js case now returns an engine instead of throwing, the `SimUnsupportedEngineError` catch branch (use-simulation.ts lines 39–45) is simply never hit for Pico — no change needed there.

### 2. Assets

- **Add asset:** `public/sim/RPI_PICO-20241129-v1.24.1.uf2` — the pinned MicroPython UF2 for RPI_PICO. Per the facts, v1.24.1 (666,624 bytes, ~651 KB) is the recommended pin: a stable recent baseline before RP2350 complexity, with an unchanged USB-CDC/REPL interface that rp2040js demonstrates against. Fetched at runtime via `fetch('/sim/RPI_PICO-20241129-v1.24.1.uf2').then(r => r.arrayBuffer())` — **no bundling**.
  - **Caching caveat (from facts):** Next.js serves `public/` with `Cache-Control: public, max-age=0`, so the ~651 KB UF2 re-validates each load. Acceptable for B1; a reverse-proxy `expires`/`immutable` rule at robocode.africa is the production follow-up (noted, not done in B1).
- **BLOCKING PREREQUISITE — bootrom asset.** rp2040js has **no** bundled bootrom and **no** `loadUF2` helper. `rp2040.loadBootrom(data: Uint32Array)` exists but ships no data; the package allocates an empty `bootrom = new Uint32Array(4*KB)` and expects the host to fill it. The RP2040 bootrom binary must be **obtained externally** (pico-sdk or the wokwi CDN, per facts — NOT from any `bootrom.ts` inside the installed package, which does not exist) and shipped as `public/sim/rp2040-bootrom.bin`, fetched at runtime and converted to a `Uint32Array`. This is a **hard prerequisite with no fallback**: without it the chip cannot boot. The first implementation step must obtain a concrete, license-clear bootrom file and confirm the exact byte layout `loadBootrom` expects (length and endianness) against `node_modules/rp2040js` — do not assume the file format.
- **New dependency — `littlefs@0.1.0`:** `littlefs-wasm` is NOT a real npm package; the correct one is **`littlefs@0.1.0`** (Wokwi), which is **NOT currently installed** (verified: only `rp2040js@^1.3.3` is in `package.json`). Add it with the pinned version: `pnpm add littlefs@0.1.0`. (Build-image API detailed under the Worker unit; its exported symbol surface is itself an implementation-time verification — see §3.)
- **UF2 parsing — inline, no `uf2` package:** rp2040js exports no UF2 parser. We will **parse UF2 inline** in the worker (each 512-byte block: target address at bytes 12–15 LE, payload at bytes 32 onward) rather than add the `uf2` package, keeping the dependency surface minimal. **Implementation-time verification:** confirm the per-block payload length (MicroPython UF2 blocks use 256-byte payloads) while parsing.
- **New worker file:** `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/rp2040.worker.ts` (client-only by nature; **no `"use client"`** — that directive is for React modules, not workers, per the Next facts).
- **New protocol file:** `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/rp2040-protocol.ts` (the message union above).

### 3. The Web Worker — `rp2040.worker.ts`

**Responsibility:** own the emulator and the busy run loop; translate emulator I/O to/from the protocol.

**Boot sequence (on `init` message):**
1. `fetch(uf2Url)` -> `ArrayBuffer`; `fetch(bootromUrl)` -> `ArrayBuffer` -> `Uint32Array`. On any fetch failure, post `{ type: "error", message }` then `{ type: "stop" }`.
2. **Construct the chip — run-loop strategy is a FLAGGED DECISION, not settled.** Two surfaces exist (both confirmed exported in 1.3.3): the raw `new RP2040()` with manual `rp2040.step()`, or the higher-level `new Simulator()` (owns an `RP2040` at `sim.rp2040`, a `SimulationClock`, and a `setTimeout`-based `execute()`/`stop()` run loop). **Primary plan:** use `Simulator` for its built-in event-loop-yielding run loop and reach through to `sim.rp2040` for peripherals. **Implementation-time verification (architectural):** the facts confirm only that the `Simulator` surface *exists* (`sim.rp2040`, `sim.execute()`, `sim.stop()`, `sim.stopped`, `sim.executing`) — they do NOT confirm that (a) `sim.rp2040.flash`/`loadBootrom` can be mutated *before* `execute()`, nor (b) that `execute()` cooperates with custom `gpio[n].addListener` callbacks and `adc.channelValues[]` writes mid-run. **Named fallback (must be in the architecture, not just testing):** if `Simulator`'s loop does not cooperate with pre-execute flash mutation or live peripheral access, fall back to a manual `rp2040.step()` loop batched into `setTimeout(0)` chunks on the raw `RP2040` (which the facts fully confirm: `RP2040`, `loadBootrom`, `step()` all exported). The headless smoke (Testing §2) is the gate that decides which path ships.
3. `rp2040.loadBootrom(bootromData)`.
4. Parse the UF2 inline and copy each block's payload into `rp2040.flash` at `block.flashAddress - 0x10000000` (`FLASH_START_ADDRESS`, confirmed).
5. Build the LittleFS image (below) containing `main.py` and copy it into `rp2040.flash` at offset **`0xA0000`** (the RPI_PICO MicroPython LittleFS partition start). MicroPython mounts `/` from there and **auto-runs `main.py`** on boot. **Implementation-time verification (PAIRED HARD PREREQUISITE):** the offset `0xA0000` AND the filesystem geometry (`BLOCK_COUNT=352`, `BLOCK_SIZE=4096`) are firmware-build-specific. Both must match the exact v1.24.1 UF2's flash layout, or the FS will not mount and `main.py` silently never runs (boots, no output). The headless smoke's `SMOKE_OK` print assertion (Testing §2) is the gate that proves the offset+geometry are correct — if it fails, re-derive the FS base/size for this UF2 build before proceeding.
6. Wire USB-CDC: `const cdc = new USBCDC(rp2040.usbCtrl)` (this exact construction form is confirmed by facts). Set `cdc.onSerialData = (buf: Uint8Array) => ...`: decode to text, split on `\n`, post each complete line as `{ type: "serial", line }` (buffer a trailing partial line).
7. `rp2040.reset()` then start the run loop (`sim.execute()` or the manual fallback). **`ready` signal — committed decision:** post `{ type: "ready" }` from `cdc.onDeviceConnected` (USB-CDC enumeration completes only after MicroPython's USB stack handshakes at runtime, seconds after the loop starts — so posting `ready` on loop-start would be wrong). Add a timeout fallback: if `onDeviceConnected` has not fired within a bounded window (e.g. 15 s), post `{ type: "error", message }` + `{ type: "stop" }`.

**LittleFS image build (PROVISIONAL — `littlefs@0.1.0` not installed; symbol surface unverified):**
The package is absent, so the exact exported C-API symbols below are taken from Wokwi's demo and are **not** verified against the installed package. The first implementation step after `pnpm add littlefs@0.1.0` MUST be a `node -e` probe of the package's exports before writing worker code. The stable contract is: *format an empty LittleFS volume of the RPI_PICO geometry, write the student code as `main.py`, emit the raw image bytes*. The symbol-level sketch:
- `const lfs = await createLittleFS();` (default async factory export).
- Allocate `const flash = new Uint8Array(352 * 4096)` (1,441,792 bytes — RPI_PICO geometry; `BLOCK_COUNT=352`, `BLOCK_SIZE=4096`).
- Register `read`/`prog`/`erase`/`sync` callbacks via `lfs.addFunction(fn, 'iiiiii' | 'iii' | 'ii')` backing onto the `flash` buffer.
- `config = lfs._new_lfs_config(read, prog, erase, sync, 352, 4096)`; `lfsObj = lfs._new_lfs()`; `lfs._lfs_format(lfsObj, config)`; `lfs._lfs_mount(lfsObj, config)`.
- `const lfs_write_file = lfs.cwrap('lfs_write_file', ['number'], ['number','string','string','number'])`.
- **Write `main.py` with UTF-8 BYTE length, not `code.length`.** `code.length` is the JS UTF-16 code-unit count and is wrong for the C API's byte-length argument (and wrong for any non-ASCII source). Mandate: `const bytes = new TextEncoder().encode(code); lfs_write_file(lfsObj, 'main.py', code, bytes.byteLength);` — pass `bytes.byteLength`. **Implementation-time verification:** confirm whether `cwrap`'s `'string'` marshaling already UTF-8-encodes the JS string for the third arg; if it truncates at NUL or mis-encodes, pass the bytes via a heap pointer instead.
- Free with `lfs._free(...)`. The `flash` Uint8Array is the image -> copy into `rp2040.flash` at `0xA0000`.
- **Implementation-time verification:** the `littlefs` WASM `.wasm` location under a Next.js 16 worker chunk needs a `wasmBinary`/`locateFile` resolver — likely ship the `.wasm` under `public/sim/` and pass `locateFile`. **Optional de-risking:** pre-build the LittleFS image for the *starter* code at build time (a Node script) and embed it, falling back to runtime WASM only when the student's code differs from the starter — this shrinks the runtime WASM-in-worker surface for the common case.
- **Fallback if `littlefs@0.1.0` API does not match (named, from research doc):** inject `main.py` by **pasting it over the USB-CDC REPL** (`cdc.sendSerialByte`) after boot instead of via a LittleFS image. This avoids the WASM dependency entirely at the cost of a slower, REPL-timing-dependent inject; reserve it for if the LittleFS path proves unworkable.

**Run-time I/O wiring:**
- **GPIO out (edge-driven):** for each board GPIO used as output, attach `rp2040.gpio[n].addListener((state, old) => ...)` (returns an unsubscribe fn). On change, mark pin `n` dirty; a throttled coalescer (~30 Hz) posts `{ type: "gpio", outputs, pwm }` with the changed pins. Raw output level = `rp2040.gpio[n].outputValue` (boolean).
- **PWM duty (the fiddly part — POLLED, not listened):** PWM duty changes via register writes, which fire no pin listener — so the coalescer **polls** on its tick. For pins with `gpio[n].functionSelect === FUNCTION_PWM` (`FUNCTION_PWM = 4`, confirmed), read the owning slice/channel from `rp2040.pwm.channels[]`. Per facts there is **no** high-level duty accessor. The duty formula and pin->channel map below are **UNVERIFIED against 1.3.3 (HIGH RISK)** and must be confirmed in the headless smoke:
  - Duty (datasheet-derived, unverified): channel A `= (channel.cc & 0xFFFF) / (channel.top + 1)`; channel B `= ((channel.cc >>> 16) & 0xFFFF) / (channel.top + 1)`.
  - Pin->channel map: **use the channel's readonly `pinA1/pinB1/pinA2/pinB2` fields as the authoritative source** (these ARE confirmed in the facts), cross-checking the datasheet heuristic (pin `N` -> slice `N>>1`, channel A if `N` even else B) only as a sanity check.
  - **Implementation-time verification (HIGH RISK):** confirm `RPPWM` is reachable at `rp2040.pwm`, that `channels[n].cc`/`.top` are public AND live-updated during execution (not static), and the pin-to-channel mapping. **Fallback** if duty registers prove unreadable/static: treat PWM pins as digital (on/off from `outputValue`), so LED brightness/RGB degrade to on/off and **servo angle is effectively non-functional** (see §5 servo note). This degraded mode is called out in Risks as a possible B1 outcome, not just an edge case.
- **GPIO in:** on `input` message, for each `gpioInputs[n]` call `rp2040.gpio[n].setInputValue(boolean)` (confirmed).
- **ADC in:** on `input` message, for each `adcValues[ch]` set `rp2040.adc.channelValues[ch] = value` (12-bit `0..4095`). Per facts, writing the array is sufficient; the default `onADCRead` completes reads. **Implementation-time verification:** confirm `rp2040.adc.channelValues` is writable in 1.3.3 (facts state it is).
- **Inbound-message gating:** every worker `onmessage` branch is a no-op once a worker-local `halted` flag is set (set on `stop` or fatal `error`), so a terminating worker never acts on stale input.
- **stop:** on `{ type: "stop" }`, set `halted`, stop the run loop (`sim.stop()` or stop the manual loop), detach gpio listeners, post `{ type: "stop" }`. (The main thread also `terminate()`s the worker, so this is best-effort cleanup.)

### 4. `Rp2040Engine` (main thread) — `rp2040-engine.ts`

- **Create:** `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/rp2040-engine.ts` (`"use client"` — it constructs a `Worker` and writes the DOM).
- **Implements `SimEngine`** WITHOUT a `Machine`: provides `potValues`, `analogInputs`, `distances`, `pressed` (the four input bags, mutated by `sim-overlay.tsx`), and omits the now-optional `machine` member. State is mirrored in `private gpioOut: Record<number, boolean>` and `private pwmDuty: Record<number, number>` instead of a `Machine`.
- **Constructor `(board, diagram, code, callbacks)`:** stores args; resolves the netlist via `resolveNetlist(diagram)` (`/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/netlist.ts`), giving `boardPinOf(ref)`. Precomputes, per part, its board-pin mapping using `getPinInfo(part.id)` and `getPartEl` (`/Users/marimo/Dev/robocode/robocode-frontend/src/lib/studio/pin-registry.ts`) and `COMPONENT_BY_ID[part.type].simRole` — the SAME pipeline `InterpreterEngine.setupInputs`/`updateOutputs` use.
- **Pin label normalization:** `boardPinOf` returns the bare wire-endpoint label. The engine must reduce these to an **integer GPIO number** for the worker. The existing `normPin` (engine.ts:14) only strips a leading `D` (`/^D\d+$/`) and will NOT cover Pico labels. **Implementation-time verification (load-bearing for every component):** inspect the actual pin labels the Pico Wokwi element reports via `pinInfo`. NOTE: the Pico `BoardDef` uses `wokwiTag: "wokwi-nano-rp2040-connect"` — that element is the **Arduino Nano RP2040 Connect**, a DIFFERENT pinout from the bare Pico despite the board's `name: "Raspberry Pi Pico"`; its pin labels and built-in-LED pin may NOT be the bare-Pico GP25. The expected normalization to verify is a regex like `/^GP(\d+)$/` -> integer (with the bare-numeric `gpio: ["0".."25"]` / `analog: ["26","27","28"]` arrays in the `BoardDef` as the cross-check), plus the GPIO->ADC-channel map (GPIO 26->ch0, 27->ch1, 28->ch2).
- **Built-in LED pin — committed decision:** the built-in LED GPIO number is **hardcoded as `25` in `Rp2040Engine`** (a `private static readonly LED_BUILTIN = 25`), because the Pico `BoardDef` has **no `profile`/`ledBuiltin`/`adcBits`** fields (verified: boards.ts:146–160 has no `profile:` key, unlike Uno/ESP32). We deliberately do NOT add a `profile` to the Pico board def (that would be an unauthorized Spec-A-adjacent change). The built-in-LED drives the SAME `mcu` element property `led13` that `InterpreterEngine` uses (engine.ts: `const mcu = getPartEl("mcu") as (... led13?: boolean); mcu.led13 = ...`) — `led13` is the concrete, board-agnostic property name already in the codebase; reuse it directly. **Implementation-time verification:** confirm GP25 is the built-in LED on the `wokwi-nano-rp2040-connect` element (the Nano caveat above) and that its `mcu` element exposes `led13`.
- **ADC bit-depth — committed decision:** scale UI analog values (`0..1023`) to RP2040's 12-bit range with the fixed constant **`4095`** (`scale = raw => Math.round(raw * 4095 / 1023)`), hardcoded as Pico-specific because there is no `adcBits` on the board to read it from.
- **`start(): boolean`:**
  - Spawn the worker: `new Worker(new URL("./rp2040.worker.ts", import.meta.url), { type: "module" })` (the Next.js 16 supported idiom per facts — works in Turbopack (dev) and webpack (build), no `next.config.ts` change).
  - `worker.onmessage` dispatches the `Rp2040OutMessage` union — **every branch guarded on `!this.stopped`** (see Error handling, rapid-restart race): `serial`->`callbacks.onSerial(line)`; `gpio`->update the mirror then `updateOutputs()`; `ready`->clear the "booting" serial notice + emit the un-simulated-device notice (§5); `error`->`callbacks.onError(message)` + tear down + `callbacks.onStop()`; `stop`->tear down + `callbacks.onStop()`.
  - `worker.onerror`/`onmessageerror` -> `callbacks.onError(...)` + teardown + `onStop()`.
  - `postMessage({ type: "init", uf2Url: "/sim/RPI_PICO-20241129-v1.24.1.uf2", bootromUrl: "/sim/rp2040-bootrom.bin", code: this.code })` (an `Rp2040InMessage`).
  - Emit a transient `"Booting MicroPython..."` serial line (cleared/superseded on `ready`).
  - Start the input-forwarding interval (below).
  - **Return `true` SYNCHRONOUSLY.** Boot is async; a fetch/boot failure surfaces *later* via `error`/`stop` -> `callbacks.onError` + `callbacks.onStop`. (Matches the design and the `use-simulation.ts` contract where the `false` return is reserved for synchronous parse/build failure, which the firmware path cannot detect synchronously.)
- **GPIO/PWM mirror + `updateOutputs()`:** the mirror is updated from `gpio` messages. A Pico-specific `updateOutputs()` walks `this.diagram.parts`, resolves each part's control board pin via the precomputed mapping, and writes the SAME Wokwi element properties as `InterpreterEngine.updateOutputs` — sourcing values from the mirror (duty `0..1`, raw level boolean) instead of a `Machine` (whose `m.pwm` is `0..255`). The per-row property writes and the duty-vs-255 distinction are spelled out in §5.
- **Input forwarding:** a small interval (e.g. 50–100 ms) reads the four bags, maps them through the netlist to GPIO numbers / ADC channels, and posts `{ type: "input", gpioInputs, adcValues }` (an `Rp2040InMessage`, only when changed). The pull-up inversion for buttons/switches happens **exactly once, here at the engine input-mapping layer**: `gpioInputs[n] = !pressed` (released = high). PIR -> `gpioInputs[n] = pressed`. potentiometer/LDR/analog sensors -> `adcValues[ch] = scale(rawUI)`.
- **`stop(): void`:** idempotent — guarded by a `stopped` flag that is **set BEFORE `worker.terminate()`** so the rapid Stop->Run race is closed (the guarded `onmessage` branches drop any late messages from the terminating worker). Sequence: set `stopped`; `worker.postMessage({ type: "stop" })`; `worker.terminate()`; clear the input interval; `callbacks.onStop()`. Safe to call after the worker already self-stopped, and safe to call mid-boot (terminate is unconditional and kills a worker still fetching/building).

### 5. Component-sync mapping (GPIO/PWM/ADC subset only)

Sources values from rp2040js instead of `Machine`. Board pin `n` = the GPIO number derived from `boardPinOf`. **Important:** the Pico mirror's PWM source is a duty ratio `0..1`, whereas `InterpreterEngine`'s `m.pwm` is `0..255` — so the element-property formulas below are NOT identical to `InterpreterEngine`'s; the column states the exact Pico-path write.

| `simRole` | direction | rp2040js source | Wokwi element property (Pico path) |
|---|---|---|---|
| `led` | out | PWM duty `0..1` (raw `outputValue` if not PWM) | `el.value = duty>0`; `el.brightness = clamp(duty, 0, 1)` — duty is already `0..1`; do NOT divide by 255 (that is InterpreterEngine's `m.pwm/255`) |
| `relay` | out | `gpio[n].outputValue` | `el.value = high` |
| `rgb` | out | PWM duty `0..1` of R/G/B pins | `el.ledRed/ledGreen/ledBlue = duty*255` (rescale `0..1` -> `0..255`; InterpreterEngine writes raw `m.pwm` 0..255 directly — Pico differs because its source is duty) |
| `buzzer` | out | pin active (PWM duty>0 or raw high) | `el.hasSignal = active`; `setTone` with a **fixed audible tone on signal** in B1 (frequency decoding deferred — see note) |
| `servo` | out | PWM pulse width (duty × period) -> angle | `el.angle = angleFromPulseUs(...)` — **at HIGH RISK; likely non-functional in B1, see note** |
| `7seg` | out | per-segment `gpio[n].outputValue` | `el.values = [...]` — supported via the generic GPIO-out path; UNTESTED in B1 (no B1 acceptance test exercises it) |
| `ledbar` | out | per-segment `gpio[n].outputValue` | `el.values = [...]` — supported via the generic GPIO-out path; UNTESTED in B1 |
| `pushbutton` / `switch` | in | -> `gpio[n].setInputValue(!pressed)` (inversion applied once in the engine input-mapper) | (input; no canvas write) |
| `pir` | in | -> `gpio[n].setInputValue(pressed)` | (input) |
| `potentiometer` / `ldr` | in | -> `adc.channelValues[ch] = scale(0..4095)` | (input) |
| `ntc`/`dht`/`gas`/`flame`/`sound` (analog) | in | -> `adc.channelValues[ch]` | (input) |
| `ultrasonic` | in | **NOT in B1** (echo-pulse timing has no clean rp2040js analog to `pulseProviders`) | no-op |
| `lcd` / `oled` (I2C) | — | **NO-OP in B1** (B2) — runs in firmware, static on canvas | none (covered by the un-simulated-device notice) |
| `neopixel` (PIO/SPI) | — | **NO-OP in B1** (B3) — runs in firmware, static on canvas | none (covered by the un-simulated-device notice) |

Notes:
- **`led` brightness / `rgb`:** the Pico mirror carries duty `0..1`. `led.brightness` is `clamp(duty,0,1)` directly; `rgb` channels rescale `duty*255`. This is the deliberate divergence from `InterpreterEngine` (whose source is `0..255`), not a copy of it.
- **`servo` (HIGH RISK, likely deferred accuracy):** angle needs pulse width (≈1–2 ms in a 20 ms period) = duty × period. This requires reading duty (the HIGH-RISK register read) AND the slice clock **divisor** to compute the period — and the facts' `PWMChannel` field list (`cc`, `top`, `pinA1/pinB1/pinA2/pinB2`) does **NOT** include a divisor/clock field. So servo has a *second* unconfirmed dependency beyond duty. If the divisor is unreadable, accurate servo angle is **deferred** (a servo degrades to meaningless on/off under the PWM-digital fallback). State to the human: servo-angle accuracy is at risk of slipping out of B1. **Implementation-time verification:** whether `PWMChannel` exposes a divisor/clock to compute the period.
- **`buzzer` tone:** `InterpreterEngine` derives frequency from `m.tones[b]`; rp2040js gives no tone frequency directly. B1 ships **presence-of-signal -> a fixed audible tone** only; PWM-frequency decoding (`clockHz/((top+1)*divisor)`) is explicitly **deferred to B1.x/B2** so the buzzer does not inherit the PWM-register risk. `Rp2040Engine` reuses the existing `InterpreterEngine` audio plumbing intent: **implementation-time decision** whether to extract `setTone`/`ensureAudio` (engine.ts ~lines 270–300) into a shared helper both engines import, or reimplement a minimal oscillator in `Rp2040Engine`. (Prefer extracting a shared helper to avoid duplicated `AudioContext` code.)
- **`7seg`/`ledbar`:** functional via the raw-GPIO path but on no B1 acceptance path; treated as "supported, untested in B1."

**Un-simulated device visibility (B1 deliverable, not a TODO):** the no-op branches for `lcd`/`oled`/`neopixel` MUST surface a visible marker so a student does not read silence as a broken simulator. On `ready`, `Rp2040Engine` scans `this.diagram.parts` for any part whose `simRole` is `lcd`/`oled`/`neopixel` and emits a one-time serial notice via `callbacks.onSerial`, e.g. `note: SSD1306 OLED runs in firmware but is not yet drawn on the canvas (coming in B2)`. This reuses the same serial channel as the boot notice — one mechanism, both jobs. Silent no-op is not acceptable for B1.

### 6. Sketch plumbing

- **Modify:** `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/studio/store.ts` `sketchContent()` (lines 284–287).
  - Today: `return (s.files.find((f) => f.name.endsWith(".ino")) ?? s.files[0])?.content ?? "";`
  - Make it board/language-aware: resolve `getBoard(s.board)`; if `board.mcuTarget === "rp2040js"` (equivalently `defaultLanguage === "micropython"`), prefer the first `.py` file; otherwise keep the `.ino`-first behavior. Fall back to `files[0]` in both branches.
  - This is a no-op for the *current* Pico starter (no `.ino` exists, so `files[0]` already returns the `.py`), but the explicit branch hardens against a mixed-file project and makes intent clear.
- **Verify (no change expected):** the Studio creates/uses a `.py` file for Pico. The `raspberry-pi-pico` `BoardDef` has `defaultLanguage: "micropython"` and `PICO_STARTER` MicroPython source; `langForFile` maps `.py` -> `"python"` for Monaco (editor-language id only; no effect on engine selection). **Implementation-time verification:** confirm the new-project / board-switch path actually writes a `.py` file (e.g. `main.py`) into `files` for Pico so `sketchContent()` returns Python, not an empty/`.ino` default.

---

## Data flow

1. User presses **Run**. `use-simulation.ts` `start()` runs: `resetSim()` + `clearSerial()` + `setRunning(true)`; `board = getBoard(store.board)` (Pico); `code = store.sketchContent()` (now the `.py`).
2. `createEngine(board, diagram, code, callbacks)` -> `"rp2040js"` case -> `new Rp2040Engine(...)`. Constructor resolves the netlist and per-part pin mappings.
3. `engineRef.current = eng; setActiveEngine(eng); const ok = eng.start();` (use-simulation.ts:47–49). `eng.start()` spawns the worker, posts `{ type: "init", uf2Url, bootromUrl, code }`, emits "Booting MicroPython...", starts input forwarding, and **returns `true` synchronously**. `ok` only gates `recordSimulationRun` (it never calls `stop()`), so the run is recorded optimistically.
4. Worker (async): fetch UF2 + bootrom -> `loadBootrom` -> parse+copy UF2 into `flash` -> build LittleFS image with `main.py` -> copy into `flash` at `0xA0000` -> `reset()` -> run loop. MicroPython boots and auto-runs `main.py`. On `cdc.onDeviceConnected`, worker posts `{ type: "ready" }`; the engine clears the booting notice and emits the un-simulated-device notice if any I2C/SPI/PIO parts are present.
5. Firmware `print()` -> USB-CDC -> `cdc.onSerialData` -> newline-split -> `{ type: "serial", line }` -> `callbacks.onSerial` -> `store.appendSerial`. GPIO edges (listener) + PWM duty (polled on the coalescer tick) -> coalesced `{ type: "gpio", outputs, pwm }` -> mirror update -> `updateOutputs()` -> Wokwi element property writes on the canvas.
6. User drags a slider / presses a button in `sim-overlay.tsx` -> mutates `eng.potValues`/`pressed`/etc. -> the input-forwarding interval maps and posts `{ type: "input", gpioInputs, adcValues }` -> worker drives `gpio[n].setInputValue` / `adc.channelValues[ch]`.

**Key asymmetry:** `start()` returns synchronously while the firmware boot is fully asynchronous (a few-second latency, including USB enumeration before `ready`). Boot success is observable only later via `ready` (then `serial`/`gpio`); boot failure via `error`+`stop`.

---

## Error handling

- **Firmware/bootrom fetch failure or boot failure** (bad/missing UF2 or bootrom, LittleFS build throw, `loadBootrom` error, `ready` timeout): worker catches, posts `{ type: "error", message }` then `{ type: "stop" }`. `Rp2040Engine` routes `error` -> `callbacks.onError(message)` (appended to serial by `use-simulation.ts`) and tears down + `callbacks.onStop()`. `onStop` (use-simulation.ts lines 32–36) nulls `engineRef`/active engine and sets `running=false`. Because `start()` already returned `true`, this is the only failure surface for the firmware path — consistent with the design.
- **MicroPython runtime tracebacks:** a `.py` with a syntax/runtime error prints its traceback over USB-CDC like any other output; it flows through `serial` messages to the console verbatim. No special handling — the student sees the real traceback. (Includes the read-only-FS case below: `open('x','w')` raises a real MicroPython error surfaced as a traceback, NOT an engine bug.)
- **Worker crash** (`worker.onerror` / `onmessageerror`, uncaught exception in the run loop): `Rp2040Engine` treats it as `error` -> `callbacks.onError("...")` + teardown + `onStop()`.
- **Rapid Stop->Run race (verified hole, closed):** `engineRef.current = eng; setActiveEngine(eng)` run BEFORE and regardless of boot success (use-simulation.ts:47–49). If the user hits Stop then Run while boot is mid-flight, a second engine is constructed and `setActiveEngine` overwrites the ref while the first worker may still post a late `ready`/`serial`/`error`. Closed by: (a) every `Rp2040Engine.onmessage` branch is guarded on `!this.stopped`; (b) `stop()` sets `stopped = true` BEFORE `worker.terminate()`; and (c) the worker sets its own `halted` flag and no-ops further inbound messages. A terminating worker's last messages therefore never reach a superseded engine's callbacks.
- **`stop()` idempotency:** guarded by the `stopped` flag. First call posts `{ type: "stop" }`, `terminate()`s the worker, clears the input interval, fires `callbacks.onStop()`. Subsequent calls (e.g. the teardown effect at use-simulation.ts line 55 firing after a worker-initiated stop, or unmount during boot) are no-ops. `worker.terminate()` is the unconditional hard guarantee the emulator loop dies even mid-fetch/mid-LittleFS-build and even if the `stop` message is never processed.
- **Unsupported-engine path unchanged:** `SimUnsupportedEngineError` is still thrown by `createEngine`'s `default` case and still handled by the existing catch in `use-simulation.ts`; the Pico no longer reaches it.

---

## Testing & verification

1. **Typecheck:** the project is typecheck-only (no test framework). Run the frontend typecheck. The loosened optional `machine?` must not break `InterpreterEngine` (concrete `machine!: Machine` field) or any external `engine.machine` reader (verified: there are none).
2. **Headless Node smoke** (feasible because rp2040js runs in Node): a standalone script under `robocode-frontend/scripts/` (e.g. `rp2040-smoke.ts`) that:
   - loads the bootrom + the pinned UF2 (from `public/sim/`),
   - builds a LittleFS image whose `main.py` is a tiny script: `from machine import Pin; import time; print("SMOKE_OK"); led=Pin(25,Pin.OUT); led.toggle()`,
   - boots via the chosen run-loop strategy (this is ALSO the gate that decides `Simulator` vs raw-`RP2040`+`step()` — see Components §3 step 2), captures USB-CDC output, and runs the loop for a bounded number of cycles,
   - **asserts** (a) a serial line containing `SMOKE_OK` appears — which simultaneously proves the `0xA0000` offset + 352×4096 geometry are correct (otherwise `main.py` never runs); and (b) `gpio[25]` transitions (toggle observed via `addListener` / `outputValue`).
   - A second variant boots a tiny **PWM** script (`PWM(Pin(...))` with a known duty) and asserts the polled `channels[n].cc`/`.top` duty read matches — this is the gate for the HIGH-RISK PWM-duty decode and the `Simulator`-vs-raw decision.
   - This exercises the EXACT worker logic (UF2 parse, LittleFS inject, CDC read, gpio listener, PWM-duty poll) MINUS the DOM canvas writes (which require a browser).
3. **Manual Studio check:** open a Pico project, Run, confirm: "RoboCode Pico ready!" prints, the on-board LED (GPIO 25) blinks on-canvas, an LED on a PWM pin dims, a button drives a GPIO input, a potentiometer drives an ADC reading, and (if an OLED is on the diagram) the un-simulated-device notice appears in serial. Confirm Uno and ESP32 projects still run unchanged.

The headless smoke proves the engine/worker core (boot, inject, serial, GPIO, PWM-duty decode, run-loop strategy); the canvas property writes (`updateOutputs`) are validated only by the manual Studio check.

---

## Risks & open questions

> **Probe update (2026-06-22, controller-verified against the installed packages).** A direct read of `node_modules/rp2040js@1.3.3` and `npm view` resolved most of the API uncertainty below:
> - **PWM duty API CONFIRMED PRESENT:** `RPPWM.channels: PWMChannel[]`, and `PWMChannel` exposes public `cc: number`, `top: number`, `divMode: PWMDivMode`, and readonly `pinA1/pinB1/pinA2/pinB2`. So the duty read is no longer an "API-existence" risk — only register *liveness during execution* still needs the smoke. Real LED brightness/RGB is expected to work (the on/off fallback is now unlikely to trigger).
> - **ADC feed CONFIRMED:** `RPADC.channelValues: number[]` is documented writable ("Changing the values will change the ADC reading") with a default `onADCRead`. Feeding sensors works.
> - **`littlefs@0.1.0` CONFIRMED real on npm** (`littlefs-wasm` is not a package). `pnpm add littlefs@0.1.0` is valid; its symbol surface is still a first-step `node -e` probe.
> - **Bootrom CONFIRMED not shipped** by the package (only `loadBootrom()` the method). Source it from the wokwi `rp2040js` demo's `bootrom.ts` (MIT) or pico-sdk (Apache-2.0) — both redistributable under `public/`.
> - **Servo:** `divMode` (the divide *mode* enum) exists, but a numeric *divisor/clock* value field is still unconfirmed in the probed field list — so servo-period math remains the one genuinely at-risk decode.

- **PWM-duty decoding (now MEDIUM risk — API confirmed, liveness pending):** `rp2040.pwm.channels[n].cc`/`.top` and `pinA1/pinB1/pinA2/pinB2` are confirmed present in 1.3.3 (probe above); what remains is confirming `cc`/`top` are *live-updated* during execution and the duty formula. Mitigation: the headless PWM smoke. **Fallback** (now unlikely): treat PWM pins as digital (LED brightness/RGB -> on/off). **Residual OPEN for the human:** only if the liveness check fails — is on/off-only LED brightness acceptable for B1?
- **Servo accuracy may slip out of B1:** servo angle needs duty AND a slice **divisor/clock** field that the facts' `PWMChannel` list does not include. If the divisor is unreadable, accurate servo is deferred. **OPEN for the human:** is a non-functional/approximate servo acceptable in B1, or should servo be explicitly moved to a later spec?
- **Run-loop strategy unsettled:** `Simulator` is the primary plan but the facts confirm only its surface, not that pre-execute flash mutation + live peripheral access cooperate with `execute()`. Named fallback: raw `RP2040` + manual `step()` batches. The headless smoke decides.
- **Bootrom asset (BLOCKING PREREQUISITE):** rp2040js ships no bootrom and no source for one inside the package. A concrete, license-clear RP2040 bootrom binary must be obtained (pico-sdk / wokwi CDN) and shipped as `public/sim/rp2040-bootrom.bin`, with its exact `Uint32Array` layout confirmed against `loadBootrom`. No fallback — boot cannot proceed without it. **OPEN for the human:** confirm the chosen bootrom source/license is acceptable to ship under `public/`.
- **`littlefs@0.1.0` dependency (must be added):** NOT installed; `pnpm add littlefs@0.1.0`. Its exported C-API symbol surface (`_new_lfs_config`, `lfs_write_file`, `addFunction`, etc.) is assumed from Wokwi's demo and unverified — first impl step is a `node -e` export probe. Its `.wasm` location under a Next.js 16 worker chunk needs a `locateFile`/`wasmBinary` resolver (likely a `public/sim/` copy). **Named fallback:** USB-CDC REPL paste injection if the LittleFS path proves unworkable.
- **LittleFS offset + geometry (`0xA0000`, 352×4096):** firmware-build-specific; if wrong, boots but `main.py` silently never runs. Gated by the smoke's `SMOKE_OK` assertion.
- **Wokwi element mismatch:** the Pico `BoardDef` uses `wokwi-nano-rp2040-connect` (a Nano RP2040 Connect, not a bare Pico). Pin labels and the built-in-LED pin may differ from bare-Pico GP25. Must be verified against the element's `pinInfo`.
- **`code.length` vs UTF-8 byte length:** the C API needs the byte length; mandate `TextEncoder().encode(code).byteLength`.
- **Async-boot-behind-synchronous-`start()`:** `start()` returns `true` before boot completes; the run records optimistically. Boot failure surfaces in serial and flips `running` off a few seconds later. Deliberate tradeoff; the rapid-restart race is closed via `stopped`/`halted` gating.
- **Next.js 16 worker bundling:** first Web Worker in the app. The `new Worker(new URL(..., import.meta.url), { type: "module" })` idiom is supported in Turbopack (dev) and webpack (build) with no config change — but WASM-inside-a-worker-chunk is the untested corner (see littlefs `locateFile`).
- **Boot-latency UX — resolved decision:** show a transient `"Booting MicroPython..."` serial line on `init`, superseded once real output flows / `ready` fires. The SAME serial channel carries the un-simulated-device notice — one mechanism, both jobs.
- **Read-only emulated FS:** flash-write SSI is unimplemented; `open('x','w')` raises a real MicroPython error surfaced via traceback over serial (real behavior, not an engine bug). No student-file persistence in B1.
- **Single-core RP2040 + UI throttle:** the emulator is single-threaded in the worker; GPIO edges + PWM polling are coalesced (~30 Hz) to keep the main thread responsive. Throttle rate is a tunable, not yet measured under load.

---

## Out of scope

- **B2:** I2C device models / rendering — LCD1602 (PCF8574), SSD1306 OLED. These run in MicroPython in B1 but stay static on the diagram (with the un-simulated-device notice).
- **B3:** SPI/PIO device models — WS2812 NeoPixel via PIO, SPI displays.
- **Arduino-C++-on-Pico:** the Pico path is MicroPython only in B1.
- **Backend grading of `.py`:** no backend changes; grading a MicroPython sketch is a separate effort.
- **`ultrasonic` echo-pulse input on Pico:** deferred (no clean rp2040js analog to `pulseProviders` yet).
- **Buzzer frequency decoding and accurate servo angle:** deferred if the PWM divisor/duty registers prove unreadable (B1 ships fixed-tone-on-signal; servo angle at risk).
