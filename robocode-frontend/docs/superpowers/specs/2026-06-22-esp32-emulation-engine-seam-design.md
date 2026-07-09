# Spec A — Engine Seam + ESP32 Accuracy

**Goal:** Introduce a `SimEngine` interface + `createEngine` board-routing seam and extend the existing hand-written Arduino interpreter so ESP32 sketches simulate (and grade) accurately, with zero behavior change for Uno.

**Date:** 2026-06-22

Research doc: [`/Users/marimo/Dev/robocode/robocode-frontend/docs/mcu-emulation-research.md`](/Users/marimo/Dev/robocode/robocode-frontend/docs/mcu-emulation-research.md)

## Background

Despite `avr8js` and `rp2040js` being declared dependencies, no board uses real CPU emulation. Every board (Uno, ESP32, Pico) runs the same hand-written high-level Arduino-language JS interpreter in `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/` (lexer → parser → `Interpreter` → `Machine`). Pin state lives in plain JS objects (`Machine.digital`, `Machine.pwm`, etc.) synced to the wiring diagram via a netlist in `engine.ts`. `BoardDef.mcuTarget` exists but is never read at runtime. Spec A does **not** add real emulation: it (1) introduces an engine-selection seam so future engines (Specs B/C) can slot in cleanly, and (2) makes the existing interpreter board-aware enough that ESP32 sketches behave correctly. See the research doc above for the full survey.

**Glossary (two distinct classes in two files — do not conflate):**
- **`InterpreterEngine`** — the simulation-orchestration class in `engine.ts` (renamed from `SimEngine`). Owns the netlist, the run loop (`pump`), interactive-input bags, and `updateOutputs`.
- **`Interpreter`** — the AST evaluator in `interpreter.ts` (name unchanged). Walks the parsed sketch, dispatches builtins, drives a `Machine`.

## Goals / Non-Goals

**Goals**
- Extract a `SimEngine` interface from today's concrete engine class (`engine.ts:20`) and rename that class to `InterpreterEngine`.
- Add `createEngine(...)` in `use-simulation.ts` that routes by `board.mcuTarget`; Uno (`avr8js`) + ESP32 (`esp32`) → `InterpreterEngine`. Reserve (but do not implement) the Pico (`rp2040js`) slot.
- Introduce a `BoardProfile` (carried on `BoardDef`) threaded into `Interpreter`/`Machine` so pin set, ADC bits, PWM ceiling, touch pins, DAC pins, and UARTs are data-driven rather than hardcoded Uno values.
- Make the interpreter model the ESP32 GPIO set (incl. input-only 34–39), 12-bit ADC, LEDC/`analogWrite` PWM, `touchRead`, `dacWrite`, `Serial1`/`Serial2`, and Wi-Fi/Bluetooth stubs.
- Mirror all of the above into the backend headless grader (`/Users/marimo/Dev/robocode/robocode-backend/src/sim/`) so ESP32 challenges grade identically.
- Keep the netlist → diagram sync contract (`updateOutputs`, `engine.ts:128`) behaviorally identical so every existing on-canvas component keeps working.

**Non-Goals**
- No real CPU/firmware emulation. `avr8js`/`rp2040js`/Pyodide are NOT wired in here.
- Pico (rp2040js) and Raspberry Pi (Pyodide/MicroPython) engines are **Specs B & C**; this spec only reserves a routing slot for Pico. No Raspberry-Pi board entry exists in `boards.ts` yet, so Spec C's slot is purely notional.
- Wi-Fi and BluetoothSerial are **stubs** returning plausible values; there is NO real networking.
- No new heavy dependencies.

## Architecture

### The seam: `SimEngine` interface + `InterpreterEngine`

Today the concrete class is `SimEngine` at `engine.ts:20`, instantiated directly:
- `use-simulation.ts:24`: `new SimEngine(st.toDiagram(), st.sketchContent(), { onSerial, onError, onStop })`. **Note:** `use-simulation.ts:5` is a **value** import (`import { SimEngine } from "@/lib/sim/engine"`).
- `active.ts`: a singleton registry typed `SimEngine | null` via `import type` (`setActiveEngine`/`getActiveEngine`).
- `sim-overlay.tsx:13`: `const eng = getActiveEngine()` then direct property reads/writes on `eng.potValues` (l.19/25), `eng.analogInputs` (l.34/39), `eng.distances` (l.47/52), `eng.pressed` (l.60/61).

We rename the concrete class `SimEngine` → `InterpreterEngine` and introduce the interface `SimEngine` as the public type. **Verified caller surface:** across `sim-overlay.tsx:19–61`, `active.ts`, and `use-simulation.ts:24–35`, the only members any caller touches are the four mutable input bags, `start()`, and `stop()`. No other property/method of the concrete class is accessed externally, so the interface below is provably sufficient. `machine` is read only internally by `updateOutputs`; it is exposed on the interface as optional/internal convenience.

```ts
// engine.ts
import type { Diagram } from "@/lib/domain/diagram";
import type { Machine } from "@/lib/sim/machine";

export type EngineCallbacks = {
  onSerial: (line: string) => void;
  onError: (msg: string) => void;
  onStop: () => void;
};

export interface SimEngine {
  // lifecycle
  start(): boolean;  // true = started, false = build/parse failure (engine.ts:79/86)
  stop(): void;

  // interactive input state — mutated directly by sim-overlay.tsx (raw 0–1023 UI values)
  potValues: Record<string, number>;     // pot/LDR slider value (raw, pre-scale)
  analogInputs: Record<string, number>;  // NTC/DHT/gas/flame/sound slider (raw, pre-scale)
  distances: Record<string, number>;     // ultrasonic distance (cm)
  pressed: Record<string, boolean>;       // pushbutton/switch/PIR

  // observable machine state (read by updateOutputs internally; optional for callers)
  machine: Machine;
}
```

**No `reset()` on the interface.** The approved design listed "lifecycle start/stop/reset", but the concrete class has **no `reset()` method today** — callers reset by calling `stop()` and re-constructing the engine (`use-simulation.ts` tears down via `stop()` at l.13/28-31/41 and builds a fresh engine on the next Run). We deliberately keep that contract: the interface exposes `start`/`stop` only, and `Machine.reset()` is called internally by `start()`. **Serial callbacks** are satisfied by `EngineCallbacks` passed through the constructor / `createEngine`, not by an interface method.

`active.ts` keeps its `import type { SimEngine }` (now resolving to the interface) and needs no other change. `sim-overlay.tsx` is **unchanged** — it already operates against this surface.

### The factory: `createEngine`

Add to `use-simulation.ts`. The studio store holds a `BoardId` string (`store.ts` `board: BoardId`), **not** a `BoardDef`, and `use-simulation.ts` does not currently import boards — so the hook must resolve the `BoardDef` via `getBoard(...)` (`boards.ts:120`, `getBoard(id) → BOARDS[id] ?? BOARDS["arduino-uno"]`).

```ts
// use-simulation.ts — imports
import { getBoard, type BoardDef } from "@/lib/domain/boards";
import { createEngine, SimUnsupportedEngineError } from "@/lib/sim/engine";
import type { SimEngine, EngineCallbacks } from "@/lib/sim/engine";
// (drop the previous value import `import { SimEngine } from ".../engine"` at line 5 —
//  SimEngine is now type-only; the value used is createEngine.)
```

```ts
// engine.ts
export class SimUnsupportedEngineError extends Error {
  constructor(public boardId: string) {
    super(`Simulation for board "${boardId}" is not available yet.`);
    this.name = "SimUnsupportedEngineError";
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
    case "esp32":  // ESP32 DevKit — same interpreter + ESP32 profile
      return new InterpreterEngine(board, diagram, code, callbacks);
    case "rp2040js": // Spec B — Pico real-firmware engine slot (not implemented)
      throw new SimUnsupportedEngineError(board.id);
    default: // defensive: any future mcuTarget string not yet wired
      throw new SimUnsupportedEngineError(board.id);
  }
}
```

The `default` branch is unreachable for today's closed `McuTarget = "avr8js" | "esp32" | "rp2040js"` union; it is a defensive guard for future targets only. There is **no `"rp2040"` alias case** (it is not a `McuTarget` member and would be dead code).

`InterpreterEngine`'s constructor gains a leading `board: BoardDef` param (was `engine.ts:36`):
`constructor(private board: BoardDef, private diagram: Diagram, private code: string, private cb: EngineCallbacks)`. It stores `this.profile = board.profile ?? UNO_PROFILE` and threads the profile into `resolveNetlist`/`updateOutputs` (LED-builtin pin) and into the `Machine`/`Interpreter` it builds in `start()` (`engine.ts:72`).

In `use-simulation.ts`, replace `new SimEngine(...)` (`use-simulation.ts:24`) with:
```ts
const board = getBoard(useStudio.getState().board);
let eng: SimEngine;
try {
  eng = createEngine(board, st.toDiagram(), st.sketchContent(), {
    onSerial: (l) => useStudio.getState().appendSerial(l),
    onError:  (m) => useStudio.getState().appendSerial(m),
    onStop:   () => { engineRef.current = null; setActiveEngine(null); useStudio.getState().setRunning(false); },
  });
} catch (e) {
  if (e instanceof SimUnsupportedEngineError) {
    useStudio.getState().appendSerial(e.message);
    useStudio.getState().setRunning(false);
    setActiveEngine(null);
    return; // no engine constructed — do NOT call stop()
  }
  throw e;
}
```
The catch handles failure **before** an engine exists, so it resets running/active state directly and never calls `engineRef.current.stop()`. `eng.start()` (`use-simulation.ts:35`) and teardown paths are otherwise unchanged.

### `BoardProfile`

Per the boards.ts facts, the profile fields live **on `BoardDef`** (single source of truth, no parallel map). Add an optional `profile` to `BoardDef` (`boards.ts:7-22`):

```ts
// boards.ts
export interface BoardProfile {
  /** Output-capable GPIO labels (mirrors BoardDef.gpio for the sim). */
  pins: string[];
  /** Pins valid as ADC/analog inputs. */
  analogPins: string[];
  /** Pins that cannot be driven as output (ESP32 34-39). */
  inputOnlyPins: string[];
  /** ADC resolution in bits (UNO 10, ESP32 12). Initial m.adcMax = 2**adcBits - 1. */
  adcBits: number;
  /** analogWrite duty ceiling on the brightness path (UNO 255, ESP32 255 — see PWM note). */
  pwmMax: number;
  /** Capacitive-touch pins, index = T-number (ESP32 T0..T9). */
  touchPins: string[];
  /** True DAC pins (ESP32 25/26). */
  dacPins: string[];
  /** UART tx/rx pairs; index 0 = Serial, 1 = Serial1, 2 = Serial2. */
  uarts: Array<{ tx: string; rx: string }>;
  /** Built-in LED GPIO label (UNO "13", ESP32 "2"). */
  ledBuiltin: string;
}

export interface BoardDef {
  /* ...existing fields (id … accent at boards.ts:7-22)... */
  profile?: BoardProfile;
}

// Exported default used whenever profile is absent on an InterpreterEngine-routed board.
export const UNO_PROFILE: BoardProfile = { /* arduino-uno profile values, below */ };
```

**Uno profile** (added to the `arduino-uno` entry, `boards.ts:69`; also exported as `UNO_PROFILE`):
```ts
profile: {
  pins: ["0","1","2","3","4","5","6","7","8","9","10","11","12","13"],
  analogPins: ["A0","A1","A2","A3","A4","A5"],
  inputOnlyPins: [],
  adcBits: 10,
  pwmMax: 255,
  touchPins: [],
  dacPins: [],
  uarts: [{ tx: "1", rx: "0" }],
  ledBuiltin: "13",
},
```

**ESP32 profile** (added to the `esp32` entry, `boards.ts:84`):
```ts
profile: {
  pins: ["2","4","5","12","13","14","15","18","19","21","22","23","25","26","27","32","33"],
  analogPins: ["32","33","34","35","36","39"], // ADC1 only; ADC2 omitted (Wi-Fi conflict)
  inputOnlyPins: ["34","35","36","39"],
  adcBits: 12,
  pwmMax: 255, // analogWrite brightness path is fixed 8-bit; LEDC carries its own per-channel max
  touchPins: ["4","0","2","15","13","12","14","27","33","32"], // T0..T9
  dacPins: ["25","26"],
  uarts: [{ tx: "1", rx: "3" }, { tx: "10", rx: "9" }, { tx: "17", rx: "16" }],
  ledBuiltin: "2",
},
```

**PWM-ceiling rule (single authoritative rule, resolves the three-ceiling ambiguity):**
- `profile.pwmMax` is the ceiling **only** for the legacy `analogWrite(pin, v)` brightness path, and is **255** on both boards (Arduino-ESP32 `analogWrite` is 8-bit unless `analogWriteResolution` is called — see Risks; that is out of scope and warns).
- `pwm[pin]` is **always on the 0–255 brightness contract** that `updateOutputs` consumes (`engine.ts` LED branch divides `m.pwm[b]` by 255; RGB likewise). This never changes for any board.
- **LEDC channels carry their own `max`** (`2**bits - 1` from `ledcSetup`), independent of `profile.pwmMax`. `ledcWrite(ch, duty)` rescales by that channel's `max` to the 0–255 contract. So `profile.pwmMax` is **not** used by the LEDC path.

The Pico and (future) Pi entries keep `profile` absent. Boards routed to `InterpreterEngine` (Uno/ESP32) **always** have a profile; the `?? UNO_PROFILE` fallback is a safety net only for those two and is **not** a correct profile for Pico/Pi (which never reach `InterpreterEngine` — `createEngine` throws first).

## Components

### Unit 1 — Engine seam (refactor, no Uno behavior change)

**Files modified:**

- `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/engine.ts`
  - Rename class `SimEngine` → `InterpreterEngine` (`engine.ts:20`).
  - Export the `SimEngine` interface, `EngineCallbacks` (still at `engine.ts:14`), `createEngine`, and `SimUnsupportedEngineError`.
  - Constructor (`engine.ts:36`) gains leading `board: BoardDef`. Store `this.profile = board.profile ?? UNO_PROFILE`.
  - `setupInputs` (`engine.ts:44`): the registered `analogSources` lambdas are the **single place** raw 0–1023 UI values scale to the board ADC range. Capture `const adcMax = (2 ** this.profile.adcBits) - 1` once at registration; each analog lambda becomes `() => Math.round((this.potValues[part.id] ?? 512) * adcMax / 1023)` (and the analogInputs lambda likewise with its `?? 400` default — the **default scales too**, so an undriven ESP32 analog pin reports a proportional midpoint, not a low value). `digitalSources`/`pulseProviders` registration is unchanged. On Uno `adcMax=1023` so the multiply is identity.
  - `updateOutputs` (`engine.ts:128`): the only board-specific line is the built-in LED at `engine.ts:132` (`mcu.led13 = (m.digital["13"] ?? 0) > 0`). Replace the hardcoded `"13"` with `this.profile.ledBuiltin`. The element property is still `led13` (the custom element's fixed visual; ESP32 art still drives that pin-13 indicator — cosmetic only). Every `simRole` branch (`led`/`7seg`/`ledbar`/`neopixel`/`buzzer`/`servo`/`relay`/`lcd`/`oled`/`rgb`) is untouched — the sync contract is preserved.
  - `start()` (`engine.ts:72`): construct `Machine(this.profile)` and `Interpreter(..., this.profile)` (see Unit 2). `pump` (`engine.ts:98`) and `stop` (`engine.ts:89`) are unchanged.

- `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/active.ts` — **no source change**; its `import type { SimEngine }` now resolves to the interface.

- `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/use-simulation.ts` — change the import at line 5 (drop value `SimEngine`; add `createEngine`, `SimUnsupportedEngineError`, `getBoard`); add the `createEngine`/`getBoard` call + try/catch shown in Architecture; everything else (`start()` at l.35, teardown at l.13/28-31/41) unchanged.

- `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/domain/boards.ts` — add `BoardProfile` interface + `UNO_PROFILE` export, add optional `profile` to `BoardDef`, populate Uno + ESP32 profiles. Pico/Pi unchanged.

- `/Users/marimo/Dev/robocode/robocode-frontend/src/components/studio/sim-overlay.tsx` — **no change.**

**Acceptance for Unit 1:** a Uno sketch produces behaviorally-identical serial output and identical `Machine` pin state to pre-refactor (verified by `fixture-uno-blink.ino`). Source is not byte-identical (one literal becomes `this.profile.ledBuiltin`), but behavior is.

### Unit 2 — ESP32 accuracy in the interpreter

**Files modified:** `machine.ts`, `interpreter.ts` (frontend; mirrored in Unit 3).

**Machine changes (`machine.ts`):**
- Add constructor param `profile?: BoardProfile`. Store `this.profile`, `this.adcMax = (2 ** (profile?.adcBits ?? 10)) - 1`, `this.pwmMax = profile?.pwmMax ?? 255`. Add fields `pwmRaw: Record<string, number>` (0..LEDC-channel-max, read-back of true duty), `dac: Record<string, number>` (0–255), `touch: Record<string, number>` (optional override).
- **`reset()` (`machine.ts:27`) MUST be extended** to clear the new maps (`pwmRaw`, `dac`, `touch`) and re-derive `adcMax`/`pwmMax` from `this.profile`, so ESP32 state does not leak between runs. (Omitting this leaks `adcMax` set by `analogReadResolution`, etc.)
- `analogRead` (`machine.ts:56`): single scaling/clamp authority. Source lambdas already deliver values scaled to the **profile** `adcBits` (done in `engine.ts setupInputs`). `analogRead` adds **only** a clamp to the **live** `this.adcMax`: `return Math.max(0, Math.min(this.adcMax, Math.round(src())))`. Returns `0` when no source (unchanged). Thus a runtime `analogReadResolution(10)` lowers the clamp ceiling; values keep coming from the profile-scaled source. (The grader presets path, where sources are fixed numbers, is interpreted in the board ADC range — see Unit 3 note.)
- `analogWrite` (`machine.ts:46`): replace the hardcoded `Math.min(255, …)` (`machine.ts:47`). Treat the argument as **0–255 brightness** (8-bit legacy contract). Store `pwm[pin] = Math.max(0, Math.min(255, Math.round(value)))` and `pwmRaw[pin] = pwm[pin]`. **Preserve the existing `digital[pin] = value > 0 ? 1 : 0` side-effect** (today at `machine.ts:43-44`/`:46-49`), derived from the **0–255 brightness value**, so grader `pin_high`/toggle semantics are unchanged on Uno. On Uno this is the identity of today's code.
- Add `warn(msg: string)`: dedupe per message, route through `onSerial` as a `[sim] <msg>` line so warnings appear in both the browser serial console and the backend graded transcript.

**Interpreter changes (`interpreter.ts`):**
- Constructor gains `profile?: BoardProfile`. Replace Uno-centric constants in the constants object (`interpreter.ts:78`):
  - `LED_BUILTIN: 13` → `LED_BUILTIN: Number(profile?.ledBuiltin ?? "13")`.
  - `ANALOG` (`interpreter.ts:53`): keep the A0–A7 self-referential constant install (`ANALOG.forEach((a) => (c[a] = a))`, `interpreter.ts:182`) for Uno-style `A0` literals. For ESP32, `profile.analogPins` are numeric (`"32".."39"`) and need no alias; `A0`–`A7` simply won't be defined on ESP32 (an ESP32 sketch using `A0` resolves to `0` — acceptable, ESP32 sketches use numeric ADC pins). **Pin validation uses `profile.analogPins`, NOT `ANALOG`** — keep these two sets distinct and documented.
- **Pin validation** — add a private `validatePin(pin: string, op: "read" | "write"): string`. It must be **warn-and-pass-through with no change to the returned value vs. today**: it returns `pin` unchanged and only emits warnings.
  - If `this.profile` is set and `pin ∉ (pins ∪ analogPins ∪ touchPins ∪ dacPins)`: `m.warn("invalid pin " + pin + " for " + board.name)` once, then return `pin` (operation proceeds against the bare key; `analogRead`/`digitalRead` still return whatever the source/`0` gives — exactly as today, no crash).
  - If `op === "write"` and `pin ∈ profile.inputOnlyPins`: `m.warn("pin " + pin + " is input-only")` and the **caller no-ops the write** (no change to `digital`/`pwm`).
  - Wire `validatePin` inside the builtin lambdas in the dispatch `map` (`builtin(name)`, dispatch table ~`interpreter.ts:347-374`, pin labelled via `pinLabel`/`pl` at `interpreter.ts:339`): `pinMode`/`digitalRead`/`analogRead`/`pulseIn`/`touchRead` use `op:"read"`; `digitalWrite`/`analogWrite`/`tone`/`noTone`/`servoWrite`/`dacWrite`/`ledcAttachPin` use `op:"write"`. **Hot-path guard:** when the board has empty `inputOnlyPins` and the pin is purely numeric in `profile.pins` (the Uno case), `validatePin` early-returns without building the union set, keeping the Uno run loop arithmetic identical.
- **ADC resolution**: `analogReadResolution` is a no-op today (`interpreter.ts:373`). Change to `(a) => { m.adcMax = (2 ** Number(a[0])) - 1; return 0; }`. ESP32's initial `adcMax` (4095) comes from the profile via the `Machine` constructor.

**ESP32 builtins** — added to the dispatch `map` (`interpreter.ts:347-374`). The interpreter keeps two private maps for LEDC: `ledcChannels: Record<number, { max: number }>` and `ledcPinByChannel: Record<number, string>`.

| API | Modeled behavior | Machine mapping |
|---|---|---|
| `analogRead(pin)` | present; `validatePin(read)`; returns `0..adcMax` (4095 on ESP32) via profile-scaled source + clamp | reads `analogSources[pin]` |
| `analogWrite(pin, v)` | present (`interpreter.ts:351`); `validatePin(write)`; `v` treated as 0–255 brightness | `pwm[pin]` (+ `pwmRaw[pin]`), `digital[pin]` side-effect |
| `ledcSetup(ch, freq, bits)` | store `ledcChannels[ch] = { max: 2**bits - 1 }`; return `freq` | none until attach |
| `ledcAttachPin(pin, ch)` | `validatePin(write)`; bind `ledcPinByChannel[ch] = pin`; init `m.analogWrite(pin, 0)` | `pwm[pin]=0` |
| `ledcWrite(ch, duty)` | look up `pin = ledcPinByChannel[ch]`, `max = ledcChannels[ch]?.max ?? 255`; write `m`'s 0–255 brightness = `round(duty/max*255)` and store true `pwmRaw[pin]=duty` | `pwm[pin]` (0–255), `pwmRaw[pin]=duty` |
| `touchRead(pin)` | `validatePin(read)`; return `m.touch[pin]` if set, else constant **`70`** (exact, untouched) | reads optional `touch[pin]` |
| `dacWrite(pin, v)` | `validatePin(write)`; clamp `v` to **0–255** (8-bit) before mirror; store `dac[pin]=v` and mirror `pwm[pin]=v` so a connected LED dims | `dac[pin]`, `pwm[pin]` |
| `Serial1.print/println` | exists via `makeSerial()` (`interpreter.ts:87`) | `m.serialPrint`/`serialPrintln` |
| `Serial2.print/println` | add `g.define("Serial2", this.makeSerial())` in `installConstants` (alongside `Serial1` at `interpreter.ts:86`) | `m.serialPrint`/`serialPrintln` → console |
| `esp_random()` | deterministic 32-bit unsigned via a per-`Interpreter` counter seeded `0x2545F491` and stepped by a fixed LCG (`s = (s * 1664525 + 1013904223) >>> 0; return s`), so front and back produce identical sequences for grading parity | none (interpreter-local state) |

**WiFi stub** — add `g.define("WiFi", this.makeWiFi())` in `installConstants` only. **Do NOT touch the var-decl regex at `interpreter.ts:179`** — that regex governs typed object *declarations* (`Servo s;`), and `WiFi` is used as a pre-defined global (`WiFi.begin(...)`), never declared. Method calls dispatch through the existing `Member`-callee path (`interpreter.ts:303-305`, `obj[m](...args)`). `makeWiFi()` returns a plain object:
- `begin(ssid, pass) → 0`, sets internal `_status = 3` (`WL_CONNECTED`).
- `status() → 3`; `localIP() → "192.168.4.2"`; `softAP(s, p) → true`; `softAPIP() → "192.168.4.1"`; `RSSI() → -55`; `disconnect() → 0`; `macAddress() → "24:0A:C4:00:00:01"`.
Also `g.define("WL_CONNECTED", 3)` and `WL_IDLE_STATUS: 0`, `WL_DISCONNECTED: 6` in the constants object so connect-loop sketches compile. These let "connect and print IP" sketches produce expected serial output. No sockets, no fetch.

**BluetoothSerial stub** — add `g.define("BluetoothSerial", this.makeBT())` in `installConstants` only (same rationale; no regex edit). `makeBT()` returns:
- `begin(name) → true`, `hasClient() → false`, `available() → 0`, `read() → -1`, `print/println → m.serialPrint`/`serialPrintln`, `connected() → false`.

**Unknown call / unsupported library** — two distinct silent paths, both get a deduped warning then return `0` unchanged:
- Unknown **free function**: `interpreter.ts:321` (`return 0` after `const b = this.builtin(name); if (b) return b(args);`). Warn `m.warn("unsupported call " + name)` only when `name` is neither a user function nor a matched builtin.
- Unknown **method on a stub object**: `interpreter.ts:305` (`return 0` after the `obj[m]` check). Warn `m.warn("unsupported method " + m)` when the object exists but lacks the method (covers a WiFi/BT method not stubbed). `makeObject`'s generic stub (`interpreter.ts:455`) covers only *constructed* objects, not `g.define`'d singletons — so the singleton case is handled here at 305.

### Unit 3 — Backend grader parity

Per the backend-sim facts, `machine.ts` is byte-identical front/back and `interpreter.ts` differs only by the `MAX_ARRAY_SIZE` guard and import paths. Every Unit 2 change is mirrored into:

- `/Users/marimo/Dev/robocode/robocode-backend/src/sim/machine.ts` — same `profile?` constructor, `adcMax`/`pwmMax`/`pwmRaw`/`dac`/`touch`/`warn`, the extended `reset()`, the `analogRead` clamp, and the `analogWrite` 0–255 brightness contract with preserved `digital` side-effect.
- `/Users/marimo/Dev/robocode/robocode-backend/src/sim/interpreter.ts` — same profile wiring (`LED_BUILTIN`, `ANALOG` vs `analogPins`), `validatePin`, ESP32 builtins (`ledcSetup`/`ledcAttachPin`/`ledcWrite`/`touchRead`/`dacWrite`/`Serial2`/`esp_random`), `analogReadResolution` writing `adcMax`, WiFi/BluetoothSerial stubs, and the two-site unsupported warnings. The `MAX_ARRAY_SIZE` guard (`interpreter.ts:54-57/198-204`) and relative imports stay backend-only. `m.warn` routes to the grader's serial sink (the grader sets `m.onSerial = (l) => serial.push(l)` at `grader.ts:44`), so warnings land in the graded transcript.
- `/Users/marimo/Dev/robocode/robocode-backend/src/sim/board-profile.ts` — **new file** exporting the `BoardProfile` interface and the two literal profiles `UNO_PROFILE`, `ESP32_PROFILE` (values identical to the frontend; the backend does not import the frontend `boards.ts`). The `esp_random` LCG constants live here too so both repos seed identically. This is the deliberate, acknowledged front/back duplication (same as the existing `machine.ts`/`interpreter.ts` duplication) — both move together (see Risks for the CI guard).
- `/Users/marimo/Dev/robocode/robocode-backend/src/sim/grader.ts` — `gradeCode` (`grader.ts:36`) gains `board?: string` inside `opts`. At `grader.ts:43`, `new Machine()` → `new Machine(board === "esp32" ? ESP32_PROFILE : UNO_PROFILE)`, and the `Interpreter` is constructed with the same profile. A `raspberry-pi-pico` or `<custom>` board collapses to `UNO_PROFILE` (10-bit / 255) — a deliberate, documented choice for Spec A (Pico engine is Spec B). The `opts.analog`/`opts.digital` preset numbers are thereby interpreted in the selected board's ADC range.
- `/Users/marimo/Dev/robocode/robocode-backend/src/modules/competitions/competitions.service.ts` — in `submitSolution`, the `Task` is already loaded (`const task = await this.prisma.task.findUnique(...)`, ~`competitions.service.ts:401`) and **`Task.boardType` already exists** (`schema.prisma:310`, `@default("arduino-uno")`). Change the grading call (`competitions.service.ts:415`) from `gradeCode(code, checks)` to `gradeCode(code, checks, { board: task.boardType })`. (The earlier draft cited `projects.service.ts:172` — that writes `boardType` on the unrelated `Project` model and is never on the grading path; it is dropped.) The schema default already guarantees `arduino-uno` for legacy/null, so no extra fallback is needed.

**Note on grader rule semantics (deliberate limitation):** grader rules that read PWM (`analog_write`, `maxPwm`) see the **0–255 brightness** value of `m.pwm[pin]` on **all** boards, not the raw LEDC duty. An ESP32 challenge author writing `ledcWrite(0, 512)` at 10-bit and asserting against `512` would fail; they must author PWM assertions on the 0–255 scale. True-duty grading would need a new rule type reading `pwmRaw` — out of scope here. **Migration:** audit existing seeded ESP32 tasks in `prisma/seed*.ts` and any task `checks`/preset fixtures — `pin_high`/`analog_write`/`analog` thresholds authored as 10-bit (0–1023) values will mis-scale once their board is `esp32`; re-author them on the 0–255 (PWM) / 0–4095 (ADC) board ranges or leave the task on `arduino-uno`.

**Acceptance for Unit 3:** an ESP32 challenge graded headlessly produces the same serial/pin assertions as the same sketch run in the browser `InterpreterEngine` (verified by the smoke script, which reuses the backend engine).

## Data flow

1. User selects a board and presses Run. `use-simulation.ts` resolves `board = getBoard(useStudio.getState().board)` (a `BoardDef`) and calls `createEngine(board, st.toDiagram(), st.sketchContent(), callbacks)` (replacing `use-simulation.ts:24`).
2. `createEngine` routes on `board.mcuTarget`: `avr8js`/`esp32` → `new InterpreterEngine(board, …)`. `rp2040js`/unknown → `SimUnsupportedEngineError`, caught in the hook → `onError` → `appendSerial` + running/active reset (no `stop()`).
3. `InterpreterEngine` stores `board.profile ?? UNO_PROFILE`, builds `resolveNetlist(diagram)`, and in `start()` (`engine.ts:72`) constructs `Machine(profile)` and `Interpreter(…, profile)`. `setupInputs` (`engine.ts:44`) registers `analogSources`/`digitalSources`/`pulseProviders` keyed by normalized board pin; analog lambdas (and their defaults) scale overlay slider values from 0–1023 to `2**profile.adcBits - 1`.
4. The generator runs under `pump` (`engine.ts:98`); on each `wait`/8ms yield it calls `updateOutputs` (`engine.ts:128`).
5. `updateOutputs` reads `Machine` state (`digital`/`pwm`/`tones`/`servoAngle`/`neopixels`/`displays`) and writes element properties exactly as today; the only profile-driven line is the built-in LED pin (`engine.ts:132`, now `this.profile.ledBuiltin`). `pwm[pin]` is always the 0–255 brightness contract regardless of board.
6. `sim-overlay.tsx` continues to mutate `eng.potValues`/`analogInputs`/`distances`/`pressed` directly; those feed the same scaling source lambdas.

The **netlist → diagram sync contract is unchanged** — every `simRole` branch and the `Machine` field names it reads are identical, so all existing components keep working without modification.

## Error handling

- **Unknown free function**: `m.warn("unsupported call <name>")` (deduped, fires only for genuinely unknown idents — not user functions, not matched builtins), then `return 0` (`interpreter.ts:321`). Sketch continues.
- **Unknown method on a stub object (e.g. un-stubbed WiFi/BT method)**: `m.warn("unsupported method <m>")` (deduped), then `return 0` (`interpreter.ts:305`). Sketch continues.
- **Invalid pin reference**: `validatePin` emits `m.warn("invalid pin <pin> for <board.name>")` once per offending pin and returns the pin unchanged; the operation proceeds against the bare key with the **same return value as today** (source value or `0`). Never throws. Satisfies "invalid pin emits a serial warning and continues; never crash."
- **Write to input-only pin (ESP32 34–39)**: `m.warn("pin <pin> is input-only")` and the write is no-op'd (no change to `digital`/`pwm`).
- **Unimplemented board selected (Pico/future)**: `createEngine` throws `SimUnsupportedEngineError`; the hook catches it, routes `e.message` to `onError` → `appendSerial`, sets running false and clears the active engine **directly** (no engine exists to `stop()`).
- All warnings route through `Machine.warn` → `onSerial` as `[sim] …` lines, appearing in both the browser serial console and the backend graded transcript.

## Testing & verification

The repo is typecheck-only (no test framework). Verification:

1. **`pnpm typecheck` on both repos** (`robocode-frontend` and `robocode-backend`) — must pass. This proves the `SimEngine` interface, `createEngine`, the dropped value-import in `use-simulation.ts:5`, `BoardProfile`/`UNO_PROFILE`, and the constructor-signature changes are type-consistent across `engine.ts`/`active.ts`/`use-simulation.ts`/`sim-overlay.tsx`/`boards.ts` and the backend `grader.ts`/`board-profile.ts`/`competitions.service.ts`.

2. **Headless smoke-run script** — a Node script under `/Users/marimo/Dev/robocode/robocode-backend/src/sim/` (`smoke.ts`, run via the backend TS runner) reusing the headless `Machine`/`Interpreter` (the same engine `grader.ts` uses). Each fixture's expected serial lines and pin values are **hardcoded in the script** (there is no snapshot framework — the "baseline" is literal expected strings). The script exits non-zero on any failed assertion so it can gate CI alongside typecheck. Fixtures (run with the ESP32 profile unless noted):
   - **`fixture-ledc-fade.ino`** — `ledcSetup(0, 5000, 8)`, `ledcAttachPin(2, 0)`, `ledcWrite(0, 128)`: assert `machine.pwm["2"] === 128` (50% of channel max 255 → 128 brightness) and `machine.pwmRaw["2"] === 128`.
   - **`fixture-adc12.ino`** — drive an analog source high; `analogRead(34)` at default 12-bit: assert the returned value reaches `4095` (not capped at 1023); after `analogReadResolution(10)`, assert it caps at `1023`.
   - **`fixture-touch.ino`** — `touchRead(4)` (T0): assert exactly `70` and no warning line. `touchRead(99)`: assert a `[sim] invalid pin 99 …` warning line (99 ∉ any pin set; confirms `touchRead` runs `validatePin`).
   - **`fixture-wifi-connect.ino`** — `WiFi.begin(...)`, loop `while (WiFi.status() != WL_CONNECTED)`, then `Serial.println(WiFi.localIP())`: assert the loop terminates (status returns `3` immediately) and the transcript contains `192.168.4.2`.
   - **`fixture-serial2.ino`** — `Serial2.begin(115200)`, `Serial2.println("hi")`: assert `hi` appears in the serial transcript.
   - **`fixture-input-only.ino`** — `digitalWrite(34, HIGH)`: assert a `[sim] pin 34 is input-only` warning and `machine.digital["34"]` unchanged (undefined / not `1`).
   - **`fixture-uno-blink.ino`** (Uno profile) — assert exact serial output and `Machine` pin/`pwm` state match the hardcoded pre-refactor baseline (PWM ceiling 255, ADC 0–1023, built-in LED pin "13"). Proves Unit 1 introduced no Uno behavior change.

   The Uno-regression assertion is on **serial output + `Machine` pin state** (clock-driven via `advance`, deterministic), explicitly **not** on frame cadence (the per-op `validatePin`/arithmetic could perturb how many ops fit in the 8ms wall-budget pump, which affects only visual update timing, never serial/pin results).

3. **Unsupported-engine path** — covered by a typecheck-level assertion plus a one-line smoke check that `createEngine(getBoard("raspberry-pi-pico"), …)` throws `SimUnsupportedEngineError` (Pico routes via `rp2040js`).

## Risks & open questions

- **Front/back duplication drift** (the dominant maintenance risk; this spec *creates a third copy* — `board-profile.ts` — plus hand-edits both `interpreter.ts`/`machine.ts`). The smoke script runs the **backend** engine only, so a frontend-only typo would pass CI. **Mitigation committed in this spec:** add a CI guard (a `diff` step) asserting the front/back `machine.ts` are identical and the front/back `interpreter.ts` differ only by the whitelisted `MAX_ARRAY_SIZE` hunk and import paths; fail the build if the diff grows. **Open decision for the human:** accept the duplication + CI-guard for Spec A, or commit to extracting a shared `sim` package (larger refactor, out of scope here)?
- **ESP32 Arduino-core 3.x `analogWrite` semantics**: core 3.x routes `analogWrite` through LEDC at a configurable resolution; we model the common 8-bit `analogWrite(0..255)` legacy contract and keep `pwm[pin]` on 0–255. Because `analogReadResolution` is now stateful, leaving `analogWriteResolution` a no-op is asymmetric: a sketch doing `analogWriteResolution(12); analogWrite(pin, 4095)` would mis-scale. **Decision taken:** `analogWriteResolution` is **out of scope** and routes through the `unsupported call` warning so the divergence is visible, not silent. **Open:** confirm no curriculum sketch relies on `analogWriteResolution`.
- **ADC2-with-Wi-Fi**: real ADC2 pins are unusable while Wi-Fi is active. We model ADC2 as **always unavailable** (only ADC1 pins `32,33,34,35,36,39` in `analogPins`) — stricter than hardware; the only behavioral cost is a pre-Wi-Fi ADC2 read that would warn "invalid pin" and (per the no-change rule) return its source/`0`. **Open:** confirm no lesson reads an ADC2 pin (esp. before `WiFi.begin`).
- **`touchRead` realism / TLE**: `touchRead` returns a fixed `70` (no capacitance model, no touch input component in the overlay). A threshold-wait loop like `while (touchRead(T0) > 40) {}` never exits and will hit the grader's `maxWaits` budget (TLE) rather than pass. **Decision taken:** touch is non-interactive in Spec A; no committed fixture exercises a *touched* state, so that path ships untested. Challenge authors must avoid touch-gated loops. **Open:** add an overlay touch input (writing `machine.touch[pin]`) in a later spec?
- **Pin-validation false positives**: `profile.pins` omits flash pins (6–11) and ADC2/strapping nuances. Validation only warns and never changes the return value, so it is non-fatal, but the pin list may need tuning. **Mitigation:** auditing existing seeded ESP32 projects/tasks for tripped warnings is a **pre-merge step**, not deferred.
- **`mcuTarget` routing strings**: `createEngine` switches on the closed `McuTarget` union (`avr8js`/`esp32`/`rp2040js`). The `default` branch is defensive only (unreachable today). No Raspberry-Pi board exists, so Spec C's slot is notional.

## Out of scope

- **Pico (rp2040js)** real-firmware engine — Spec B; only a routing slot is reserved (`createEngine` throws `SimUnsupportedEngineError`).
- **Raspberry Pi (Pyodide/MicroPython)** engine — Spec C; no board entry exists yet.
- Real CPU/instruction-level emulation for any board (`avr8js`/`rp2040js` remain unwired).
- Real networking, sockets, HTTP, MQTT, or Bluetooth — WiFi/BluetoothSerial are return-value stubs only.
- `analogWriteResolution` (warns as unsupported), capacitive-touch input simulation / overlay touch control, ADC2 support, and duty-accurate (`pwmRaw`) grader rules.
- Passing `opts.analog`/`opts.digital` presets from a live grading caller (no caller does today); the smoke script is the parity gate for ADC-dependent behavior.
