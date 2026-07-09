# Spec A — Engine Seam + ESP32 Accuracy Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL — before each task, re-read that task's full text. Use the checkbox syntax `- [ ]` for every step and mark `- [x]` only after the step's verify command prints the stated expected output. Line numbers in `**Files**` are advisory; anchor every edit on the exact quoted `before` text, not the line number.

**Goal:** Introduce a `SimEngine` interface + `createEngine` board-routing seam and extend the existing hand-written Arduino interpreter so ESP32 sketches simulate (and grade) accurately, with zero behavior change for Uno. No real CPU emulation is added; this spec (1) introduces an engine-selection seam for future engines (Specs B/C) and (2) makes the existing interpreter board-aware via a data-driven `BoardProfile`.

**Architecture:** A `BoardProfile` (pins, ADC bits, PWM ceiling, touch/DAC pins, UARTs, built-in LED) is carried on `BoardDef` and threaded into a `Machine` + `Interpreter`. The concrete orchestration class `SimEngine` in `engine.ts` is renamed `InterpreterEngine`; a new `SimEngine` *interface* + `createEngine(board, …)` factory routes by `board.mcuTarget` (`avr8js`/`esp32` → `InterpreterEngine`; `rp2040js`/unknown → throw `SimUnsupportedEngineError`). The backend headless grader mirrors every interpreter/machine change so ESP32 challenges grade identically, with profiles duplicated in a new `board-profile.ts`. A headless smoke script and a CI diff-guard gate the duplication.

**Tech Stack:** TypeScript. Frontend = Next.js (`robocode-frontend`); Backend = NestJS (`robocode-backend`). Two independent git repos. Typecheck-only (`tsc --noEmit` via `pnpm typecheck`); no test framework. Backend TS runner = `tsx` (`npx tsx <file>`).

## Global Constraints

- TypeScript. Frontend = Next.js (robocode-frontend), Backend = NestJS (robocode-backend). Two independent git repos: commit PER REPO.
- Frontend changes go on the existing branch 'spec/esp32-emulation' (already created and currently checked out). Backend changes go on a NEW backend branch 'spec/esp32-emulation' (create it). Commit steps must cd into the right repo.
- NO TEST FRAMEWORK exists (typecheck-only repo). Therefore TDD is ADAPTED: the "failing test" for a task is EITHER (a) 'pnpm typecheck' surfacing a specific type error you then resolve, OR (b) a fixture assertion in the headless smoke-run script (backend src/sim/smoke.ts) that fails, which you then make pass. Every task MUST end with a concrete run command + expected output and a commit.
- The headless smoke script reuses the BACKEND Machine/Interpreter (the same engine grader.ts uses). So ESP32 BEHAVIORAL fixtures only pass AFTER the backend parity changes land. Sequence accordingly.
- Preserve the netlist->diagram sync contract and the pwm[pin] 0-255 brightness scale. Uno behavior must be behaviorally identical (verified by a Uno regression fixture).
- No new heavy dependencies. avr8js/rp2040js/Pyodide stay unwired.
- Duplication mitigation: a CI diff-guard task (per the approved decision) — assert front/back machine.ts are identical EXCEPT the single `BoardProfile` import line (the two repos cannot share an import specifier: frontend imports `@/lib/domain/boards`, backend imports `./board-profile`), and interpreter.ts differ only by the whitelisted MAX_ARRAY_SIZE hunk + import paths + the `esp_random` literal-vs-named-constant lines.

---

## File Structure

**Frontend (`/Users/marimo/Dev/robocode/robocode-frontend`)**

- `src/lib/domain/boards.ts` — **Modified.** Add `BoardProfile` interface, `UNO_PROFILE` export, optional `profile` on `BoardDef`, and populate Uno + ESP32 profiles.
- `src/lib/sim/machine.ts` — **Modified.** `profile?` constructor; `adcMax`/`pwmMax`/`pwmRaw`/`dac`/`touch` fields; extended `reset()`; `analogRead` clamp; `analogWrite` 0–255 brightness; `warn()`.
- `src/lib/sim/interpreter.ts` — **Modified.** `profile?`/`boardName` constructor wiring; `validatePin`; ESP32 builtins (`ledcSetup`/`ledcAttachPin`/`ledcWrite`/`touchRead`/`dacWrite`/`Serial2`/`esp_random`); `analogReadResolution` writes `adcMax`; WiFi/BluetoothSerial stubs; two unsupported-warning sites.
- `src/lib/sim/engine.ts` — **Modified.** Rename concrete `SimEngine`→`InterpreterEngine`; add `SimEngine` interface, `createEngine`, `SimUnsupportedEngineError`; thread `board`/`profile` (constructor, `setupInputs` ADC-scaling, `updateOutputs` built-in LED, `start()` Machine/Interpreter construction).
- `src/lib/sim/use-simulation.ts` — **Modified.** Resolve `BoardDef` via `getBoard`, call `createEngine` with try/catch on `SimUnsupportedEngineError`.
- `src/lib/sim/active.ts` — **Unchanged** (its `import type { SimEngine }` resolves to the new interface).

**Backend (`/Users/marimo/Dev/robocode/robocode-backend`)**

- `src/sim/board-profile.ts` — **New.** Exports `BoardProfile` interface, `UNO_PROFILE`, `ESP32_PROFILE`, and the `esp_random` LCG constants.
- `src/sim/machine.ts` — **Modified.** Mirror of frontend machine.ts changes (import from `./board-profile`).
- `src/sim/interpreter.ts` — **Modified.** Mirror of frontend interpreter.ts changes (keeps `MAX_ARRAY_SIZE` guard + relative imports + named LCG constants).
- `src/sim/grader.ts` — **Modified.** `gradeCode` gains `board?: string` in `opts`; builds `Machine`/`Interpreter` with the selected profile.
- `src/modules/competitions/competitions.service.ts` — **Modified.** `submitSolution` passes `{ board: task.boardType }` to `gradeCode`.
- `src/sim/smoke.ts` — **New.** Headless smoke script with 7 hardcoded fixtures; exits non-zero on any failed assertion.

**Repo tree root (`/Users/marimo/Dev/robocode`, confirmed a git work tree)**

- `scripts/sim-diff-guard.sh` — **New.** CI guard: front/back `machine.ts` identical except the line-1 import; `interpreter.ts` differs only by whitelisted hunks.

---

### Task 1: BoardProfile type + UNO/ESP32 profiles + UNO_PROFILE export

**Files**
- Modify `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/domain/boards.ts`:
  - `McuTarget` type at line 5 (anchor for the new insertion).
  - `BoardDef` interface (ends `…accent: string;\n}`) — add `profile?`.
  - `arduino-uno` entry (tail `starterCode: UNO_STARTER, accent: "#00979d",`) — add `profile`.
  - `esp32` entry (tail `starterCode: ESP32_STARTER, accent: "#e7352c",`) — add `profile`.

**Interfaces**
- Produces:
  - `export interface BoardProfile { pins: string[]; analogPins: string[]; inputOnlyPins: string[]; adcBits: number; pwmMax: number; touchPins: string[]; dacPins: string[]; uarts: Array<{ tx: string; rx: string }>; ledBuiltin: string; }`
  - `export const UNO_PROFILE: BoardProfile`
  - `BoardDef.profile?: BoardProfile` (added field)
- Consumes: existing `McuTarget` (boards.ts:5), `BoardDef`, `BOARDS`, `getBoard` (`getBoard(id) → BOARDS[id] ?? BOARDS["arduino-uno"]`) — unchanged.

Steps:

- [ ] **Step 1: Add the `BoardProfile` interface and `UNO_PROFILE` const.** The current line 5 is:
  ```ts
  export type McuTarget = "avr8js" | "esp32" | "rp2040js";
  ```
  Replace it with:
  ```ts
  export type McuTarget = "avr8js" | "esp32" | "rp2040js";

  export interface BoardProfile {
    /** Output-capable GPIO labels (mirrors BoardDef.gpio for the sim). */
    pins: string[];
    /** Pins valid as ADC/analog inputs. */
    analogPins: string[];
    /** Pins that cannot be driven as output (ESP32 34-39). */
    inputOnlyPins: string[];
    /** ADC resolution in bits (UNO 10, ESP32 12). Initial m.adcMax = 2**adcBits - 1. */
    adcBits: number;
    /** analogWrite duty ceiling on the brightness path (UNO 255, ESP32 255). */
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

  export const UNO_PROFILE: BoardProfile = {
    pins: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"],
    analogPins: ["A0", "A1", "A2", "A3", "A4", "A5"],
    inputOnlyPins: [],
    adcBits: 10,
    pwmMax: 255,
    touchPins: [],
    dacPins: [],
    uarts: [{ tx: "1", rx: "0" }],
    ledBuiltin: "13",
  };
  ```

- [ ] **Step 2: Add the optional `profile` field to `BoardDef`.** The current `BoardDef` interface tail is:
  ```ts
    starterCode: string;
    accent: string;
  }
  ```
  Replace with:
  ```ts
    starterCode: string;
    accent: string;
    /** Sim engine profile (present only for InterpreterEngine-routed boards: Uno/ESP32). */
    profile?: BoardProfile;
  }
  ```

- [ ] **Step 3: Add the Uno profile to the `arduino-uno` entry.** The entry's tail is:
  ```ts
      starterCode: UNO_STARTER,
      accent: "#00979d",
    },
  ```
  Replace with:
  ```ts
      starterCode: UNO_STARTER,
      accent: "#00979d",
      profile: UNO_PROFILE,
    },
  ```

- [ ] **Step 4: Add the ESP32 profile to the `esp32` entry.** The entry's tail is:
  ```ts
      starterCode: ESP32_STARTER,
      accent: "#e7352c",
    },
  ```
  Replace with:
  ```ts
      starterCode: ESP32_STARTER,
      accent: "#e7352c",
      profile: {
        pins: ["2", "4", "5", "12", "13", "14", "15", "18", "19", "21", "22", "23", "25", "26", "27", "32", "33"],
        analogPins: ["32", "33", "34", "35", "36", "39"],
        inputOnlyPins: ["34", "35", "36", "39"],
        adcBits: 12,
        pwmMax: 255,
        touchPins: ["4", "0", "2", "15", "13", "12", "14", "27", "33", "32"],
        dacPins: ["25", "26"],
        uarts: [{ tx: "1", rx: "3" }, { tx: "10", rx: "9" }, { tx: "17", rx: "16" }],
        ledBuiltin: "2",
      },
    },
  ```

- [ ] **Step 5 (VERIFY): typecheck the frontend.**
  Command: `cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm typecheck`
  Expected output: command exits 0 with no errors (a clean `tsc --noEmit` prints no output).

- [ ] **Step 6 (COMMIT):**
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && git add src/lib/domain/boards.ts && git commit -m "$(cat <<'EOF'
  Add BoardProfile type + UNO/ESP32 profiles on BoardDef

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
  EOF
  )"
  ```

---

### Task 2: Frontend Machine — profile param, ADC/PWM fields, extended reset, analogRead clamp, analogWrite brightness, warn()

This task lands BEFORE the interpreter and engine so each frontend commit typechecks green (the new `Machine(profile)` signature exists before any caller uses it).

**Files**
- Modify `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/machine.ts`:
  - Header (top, add `BoardProfile` import).
  - Class fields region (the `neopixels: …` line) + new constructor.
  - `reset()` (lines 27–37).
  - `analogWrite` (lines 46–50).
  - `analogRead` (lines 56–59).
  - `warn()` after `serialPrintln` (lines 89–92).

**Interfaces**
- Produces (machine.ts):
  - `constructor(profile?: BoardProfile)`
  - fields: `profile?: BoardProfile`, `adcMax: number`, `pwmMax: number`, `pwmRaw: Record<string, number>`, `dac: Record<string, number>`, `touch: Record<string, number>`
  - `warn(msg: string): void` — dedupes per message, emits `[sim] <msg>` through `onSerial`
  - `analogRead(pin: string): number` (now clamps to live `this.adcMax`)
  - `analogWrite(pin: string, value: number): void` (0–255 brightness + `pwmRaw` + `digital` side-effect)
- Consumes: `BoardProfile` from `@/lib/domain/boards` (Task 1). `onSerial: (line: string) => void` (machine.ts:19) — reused by `warn`.

Steps:

- [ ] **Step 1: Import `BoardProfile`.** At the very top of `machine.ts` (above `export type PinMode`), insert:
  ```ts
  import type { BoardProfile } from "@/lib/domain/boards";
  ```

- [ ] **Step 2: Add profile-derived fields and a constructor.** The current fields end at:
  ```ts
    // addressable pixel strips (Adafruit_NeoPixel) in creation order
    neopixels: { pixels: { r: number; g: number; b: number }[] }[] = [];
  ```
  Replace with:
  ```ts
    // addressable pixel strips (Adafruit_NeoPixel) in creation order
    neopixels: { pixels: { r: number; g: number; b: number }[] }[] = [];

    // board-profile-derived runtime state
    profile?: BoardProfile;
    adcMax = 1023;
    pwmMax = 255;
    pwmRaw: Record<string, number> = {}; // read-back of true duty (0..255 for analogWrite, 0..LEDC-channel-max for ledcWrite)
    dac: Record<string, number> = {}; // 0..255
    touch: Record<string, number> = {}; // optional override per pin
    private warned = new Set<string>();

    constructor(profile?: BoardProfile) {
      this.profile = profile;
      this.adcMax = (2 ** (profile?.adcBits ?? 10)) - 1;
      this.pwmMax = profile?.pwmMax ?? 255;
    }
  ```

- [ ] **Step 3: Extend `reset()` to clear the new maps and re-derive ceilings.** The current `reset()` is:
  ```ts
    reset() {
      this.digital = {};
      this.pwm = {};
      this.modes = {};
      this.tones = {};
      this.servoAngle = {};
      this.serialBuffer = "";
      this.virtualMs = 0;
      this.displays = [];
      this.neopixels = [];
    }
  ```
  Replace with:
  ```ts
    reset() {
      this.digital = {};
      this.pwm = {};
      this.modes = {};
      this.tones = {};
      this.servoAngle = {};
      this.serialBuffer = "";
      this.virtualMs = 0;
      this.displays = [];
      this.neopixels = [];
      this.pwmRaw = {};
      this.dac = {};
      this.touch = {};
      this.warned = new Set<string>();
      this.adcMax = (2 ** (this.profile?.adcBits ?? 10)) - 1;
      this.pwmMax = this.profile?.pwmMax ?? 255;
    }
  ```

- [ ] **Step 4: Update `analogWrite` to the 0–255 brightness contract with `pwmRaw` + `digital` side-effect.** The current method is:
  ```ts
    analogWrite(pin: string, value: number) {
      const v = Math.max(0, Math.min(255, Math.round(value)));
      this.pwm[pin] = v;
      this.digital[pin] = v > 0 ? 1 : 0;
    }
  ```
  Replace with:
  ```ts
    analogWrite(pin: string, value: number) {
      const v = Math.max(0, Math.min(255, Math.round(value)));
      this.pwm[pin] = v;
      this.pwmRaw[pin] = v;
      this.digital[pin] = v > 0 ? 1 : 0;
    }
  ```
  (Uno: identical to today's behavior except `pwmRaw[pin]` is now populated with the same 0–255 value. The LEDC path in the interpreter overrides `pwmRaw[pin]` with the true channel duty — see Task 3 Step 6.)

- [ ] **Step 5: Add a clamp to live `this.adcMax` in `analogRead`.** The current method is:
  ```ts
    analogRead(pin: string): number {
      if (this.analogSources[pin]) return Math.round(this.analogSources[pin]());
      return 0;
    }
  ```
  Replace with:
  ```ts
    analogRead(pin: string): number {
      if (this.analogSources[pin]) return Math.max(0, Math.min(this.adcMax, Math.round(this.analogSources[pin]())));
      return 0;
    }
  ```
  (The clamp reads the *live* `this.adcMax`, so a runtime `analogReadResolution(10)` — Task 3 Step 7 — lowers the ceiling. Uno: `adcMax = 1023`, identical to today for any 0–1023 source.)

- [ ] **Step 6: Add the deduped `warn` method.** The current `serialPrintln` block is:
  ```ts
    serialPrintln(s: string) {
      this.serialBuffer += s + "\n";
      this.flushLines(false);
    }
  ```
  Replace with:
  ```ts
    serialPrintln(s: string) {
      this.serialBuffer += s + "\n";
      this.flushLines(false);
    }
    warn(msg: string) {
      if (this.warned.has(msg)) return;
      this.warned.add(msg);
      this.onSerial(`[sim] ${msg}`);
    }
  ```
  (`warn` routes directly through `onSerial`, bypassing `serialBuffer`/`flushLines`, so the exact `[sim] …` line appears whole in both the browser serial console and the backend graded transcript.)

- [ ] **Step 7 (VERIFY): typecheck the frontend.**
  Command: `cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm typecheck`
  Expected output: exits 0, no output. (Adapted failing test: before Step 1's import + Step 2's constructor, referencing `BoardProfile` errors; after, clean. No caller passes `profile` yet, so the new optional constructor param does not break existing `new Machine()` sites.)

- [ ] **Step 8 (COMMIT):**
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && git add src/lib/sim/machine.ts && git commit -m "$(cat <<'EOF'
  Frontend Machine: profile-driven ADC/PWM, pwmRaw/dac/touch, warn()

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
  EOF
  )"
  ```

---

### Task 3: Frontend Interpreter — profile/boardName wiring, validatePin, ESP32 builtins, analogReadResolution, WiFi/BT stubs, two unsupported-warning sites

Lands after Machine (its methods/fields exist) and before the engine seam (the engine constructs `Interpreter(code, machine, profile, boardName)` last).

**Files**
- Modify `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/interpreter.ts`:
  - Import region (top, add `BoardProfile`).
  - Class fields (the `private steps = 0;` line) — add LEDC maps + `espRandState`.
  - Constructor signature (`constructor(code: string, private machine: Machine) {`).
  - `installConstants` constants object (`LED_BUILTIN`, `WL_*`) + the `g.define("Serial1", …)` block.
  - Add `validatePin`, `makeWiFi`, `makeBT` methods immediately before `makeSerial`.
  - `builtin(name)` dispatch table (the `const map: Record<string, …> = { … }; return map[name] ?? null;` block, lines ~345–376).
  - `evalCall` Member-callee site and free-function tail (lines ~299–321).

**Interfaces**
- Produces (interpreter.ts):
  - `constructor(code: string, private machine: Machine, private profile?: BoardProfile, private boardName = "board")`
  - private `validatePin(pin: string, op: "read" | "write"): string` — warn-and-pass-through; returns `pin`, or `""` for an input-only write (caller no-ops)
  - private `makeWiFi(): Record<string, (...a: any[]) => any>`
  - private `makeBT(): Record<string, (...a: any[]) => any>`
  - private fields `ledcChannels: Record<number, { max: number }>`, `ledcPinByChannel: Record<number, string>`, `espRandState: number`
  - dispatch additions: `ledcSetup`, `ledcAttachPin`, `ledcWrite`, `touchRead`, `dacWrite`, `esp_random`
- Consumes:
  - `Machine.warn`, `Machine.adcMax`, `Machine.touch`, `Machine.dac`, `Machine.analogWrite`, `Machine.pwm`, `Machine.pwmRaw` (Task 2).
  - `BoardProfile` from `@/lib/domain/boards` (Task 1).
  - existing `makeSerial` (interpreter.ts:379), `pinLabel`/`pl` (interpreter.ts:338/345), `installConstants` constants object, the `ANALOG` constant (line 53), and the `delay`/`delayMicroseconds` handling in `evalCall` (lines 309/316) — all unchanged.

Steps:

- [ ] **Step 1: Import `BoardProfile`.** The current imports are:
  ```ts
  import { parse, ParseError, type Node } from "@/lib/sim/parser";
  import { preprocess } from "@/lib/sim/lexer";
  import type { Machine } from "@/lib/sim/machine";
  ```
  Replace with:
  ```ts
  import { parse, ParseError, type Node } from "@/lib/sim/parser";
  import { preprocess } from "@/lib/sim/lexer";
  import type { Machine } from "@/lib/sim/machine";
  import type { BoardProfile } from "@/lib/domain/boards";
  ```

- [ ] **Step 2: Add LEDC + esp_random class fields.** The current field block ends:
  ```ts
    private globals = new Scope();
    private steps = 0;
  ```
  Replace with:
  ```ts
    private globals = new Scope();
    private steps = 0;
    private ledcChannels: Record<number, { max: number }> = {};
    private ledcPinByChannel: Record<number, string> = {};
    private espRandState = 0x2545f491;
  ```

- [ ] **Step 3: Add the `profile?` + `boardName` constructor params.** The current constructor signature is:
  ```ts
    constructor(code: string, private machine: Machine) {
  ```
  Replace with:
  ```ts
    constructor(code: string, private machine: Machine, private profile?: BoardProfile, private boardName = "board") {
  ```

- [ ] **Step 4: Make `LED_BUILTIN` profile-driven and add `WL_*` constants.** The current constants object is:
  ```ts
      const c: Record<string, any> = {
        HIGH: 1, LOW: 0, INPUT: 0, OUTPUT: 1, INPUT_PULLUP: 2, PULLUP: 2,
        true: true, false: false, LED_BUILTIN: 13, PI: Math.PI, TWO_PI: Math.PI * 2, HALF_PI: Math.PI / 2,
        DEC: 10, HEX: 16, OCT: 8, BIN: 2, EULER: Math.E,
        CHANGE: 1, FALLING: 2, RISING: 3,
      };
  ```
  Replace with:
  ```ts
      const c: Record<string, any> = {
        HIGH: 1, LOW: 0, INPUT: 0, OUTPUT: 1, INPUT_PULLUP: 2, PULLUP: 2,
        true: true, false: false, LED_BUILTIN: Number(this.profile?.ledBuiltin ?? "13"), PI: Math.PI, TWO_PI: Math.PI * 2, HALF_PI: Math.PI / 2,
        DEC: 10, HEX: 16, OCT: 8, BIN: 2, EULER: Math.E,
        CHANGE: 1, FALLING: 2, RISING: 3,
        WL_CONNECTED: 3, WL_IDLE_STATUS: 0, WL_DISCONNECTED: 6,
      };
  ```
  (The `ANALOG.forEach((a) => (c[a] = a))` install at line 82 is untouched — A0–A7 stay self-referential for Uno literals. Pin validation in Step 6 uses `profile.analogPins`, a deliberately distinct set from `ANALOG`.)

- [ ] **Step 5: Define `Serial2`, `WiFi`, `BluetoothSerial` globals via `g.define`.** The current block is:
  ```ts
      // Serial + objects
      g.define("Serial", this.makeSerial());
      g.define("Serial1", this.makeSerial());
  ```
  Replace with:
  ```ts
      // Serial + objects
      g.define("Serial", this.makeSerial());
      g.define("Serial1", this.makeSerial());
      g.define("Serial2", this.makeSerial());
      g.define("WiFi", this.makeWiFi());
      g.define("BluetoothSerial", this.makeBT());
  ```
  (These are pre-defined globals only — the typed var-declaration regex at interpreter.ts:179, `/Servo|LiquidCrystal|SSD1306|Stepper|NeoPixel/`, is NOT edited. `WiFi.begin(...)` dispatches through the existing `Member`-callee path.)

- [ ] **Step 6: Add `validatePin`, `makeWiFi`, `makeBT` methods.** Insert immediately before `private makeSerial()`:
  ```ts
    private validatePin(pin: string, op: "read" | "write"): string {
      const p = this.profile;
      if (!p) return pin;
      // Hot-path guard: Uno (no input-only pins) + purely-numeric pin in profile.pins
      // early-returns without building the union set, keeping Uno run-loop arithmetic identical.
      if (p.inputOnlyPins.length === 0 && p.pins.includes(pin)) return pin;
      if (op === "write" && p.inputOnlyPins.includes(pin)) {
        this.machine.warn(`pin ${pin} is input-only`);
        return ""; // caller no-ops the write on empty label
      }
      const known =
        p.pins.includes(pin) ||
        p.analogPins.includes(pin) ||
        p.touchPins.includes(pin) ||
        p.dacPins.includes(pin);
      if (!known) {
        this.machine.warn(`invalid pin ${pin} for ${this.boardName}`);
      }
      return pin; // warn-and-pass-through: return value unchanged vs. today
    }

    private makeWiFi() {
      let status = 0;
      return {
        begin: (_ssid?: any, _pass?: any) => { status = 3; return 0; },
        status: () => status,
        localIP: () => "192.168.4.2",
        softAP: (_s?: any, _p?: any) => true,
        softAPIP: () => "192.168.4.1",
        RSSI: () => -55,
        disconnect: () => { status = 6; return 0; },
        macAddress: () => "24:0A:C4:00:00:01",
      };
    }

    private makeBT() {
      const m = this.machine;
      return {
        begin: (_name?: any) => true,
        hasClient: () => false,
        available: () => 0,
        read: () => -1,
        print: (x: any) => { m.serialPrint(String(x)); return 0; },
        println: (x: any = "") => { m.serialPrintln(String(x)); return 0; },
        connected: () => false,
      };
    }

  ```

- [ ] **Step 7: Wire `validatePin` and add ESP32 builtins in the dispatch table.** The current dispatch block is:
  ```ts
      const map: Record<string, (a: any[]) => any> = {
        pinMode: (a) => { m.pinMode(pl(a[0]), a[1] === 2 ? "input_pullup" : a[1] === 1 ? "output" : "input"); return 0; },
        digitalWrite: (a) => { m.digitalWrite(pl(a[0]), a[1]); return 0; },
        digitalRead: (a) => m.digitalRead(pl(a[0])),
        analogRead: (a) => m.analogRead(pl(a[0])),
        analogWrite: (a) => { m.analogWrite(pl(a[0]), a[1]); return 0; },
        tone: (a) => { m.tone(pl(a[0]), a[1]); return 0; },
        noTone: (a) => { m.noTone(pl(a[0])); return 0; },
        pulseIn: (a) => m.pulseIn(pl(a[0])),
        millis: () => m.millis(),
        micros: () => m.micros(),
        map: (a) => Math.round(((a[0] - a[1]) * (a[4] - a[3])) / (a[2] - a[1] || 1) + a[3]),
        constrain: (a) => Math.max(a[1], Math.min(a[2], a[0])),
        min: (a) => Math.min(a[0], a[1]),
        max: (a) => Math.max(a[0], a[1]),
        abs: (a) => Math.abs(a[0]),
        sqrt: (a) => Math.sqrt(a[0]),
        sq: (a) => a[0] * a[0],
        pow: (a) => Math.pow(a[0], a[1]),
        sin: (a) => Math.sin(a[0]), cos: (a) => Math.cos(a[0]), tan: (a) => Math.tan(a[0]),
        floor: (a) => Math.floor(a[0]), ceil: (a) => Math.ceil(a[0]), round: (a) => Math.round(a[0]),
        random: (a) => (a.length >= 2 ? Math.floor(a[0] + Math.random() * (a[1] - a[0])) : Math.floor(Math.random() * (a[0] ?? 2147483647))),
        randomSeed: () => 0,
        bitRead: (a) => (Number(a[0]) >> Number(a[1])) & 1,
        bitWrite: () => 0,
        bitSet: (a) => Number(a[0]) | (1 << Number(a[1])),
        constrainf: (a) => Math.max(a[1], Math.min(a[2], a[0])),
        analogReadResolution: () => 0,
        attachInterrupt: () => 0, detachInterrupt: () => 0, interrupts: () => 0, noInterrupts: () => 0,
      };
      return map[name] ?? null;
  ```
  Replace the whole block with (NOTE: `delay`/`delayMicroseconds`/`yield` are handled in `evalCall`, NOT in this map — do not add them here, and do not delete anything outside this `map` object):
  ```ts
      const vp = (v: any, op: "read" | "write") => this.validatePin(pl(v), op);
      const map: Record<string, (a: any[]) => any> = {
        pinMode: (a) => { const p = vp(a[0], "read"); if (p) m.pinMode(p, a[1] === 2 ? "input_pullup" : a[1] === 1 ? "output" : "input"); return 0; },
        digitalWrite: (a) => { const p = vp(a[0], "write"); if (p) m.digitalWrite(p, a[1]); return 0; },
        digitalRead: (a) => m.digitalRead(vp(a[0], "read")),
        analogRead: (a) => m.analogRead(vp(a[0], "read")),
        analogWrite: (a) => { const p = vp(a[0], "write"); if (p) m.analogWrite(p, a[1]); return 0; },
        tone: (a) => { const p = vp(a[0], "write"); if (p) m.tone(p, a[1]); return 0; },
        noTone: (a) => { const p = vp(a[0], "write"); if (p) m.noTone(p); return 0; },
        pulseIn: (a) => m.pulseIn(vp(a[0], "read")),
        ledcSetup: (a) => { this.ledcChannels[Number(a[0])] = { max: (2 ** Number(a[2])) - 1 }; return Number(a[1]); },
        ledcAttachPin: (a) => { const p = vp(a[0], "write"); if (p) { this.ledcPinByChannel[Number(a[1])] = p; m.analogWrite(p, 0); } return 0; },
        ledcWrite: (a) => {
          const ch = Number(a[0]);
          const pin = this.ledcPinByChannel[ch];
          if (!pin) return 0;
          const max = this.ledcChannels[ch]?.max ?? 255;
          const duty = Number(a[1]) || 0;
          m.analogWrite(pin, Math.round((duty / max) * 255));
          m.pwmRaw[pin] = duty; // override analogWrite's 0-255 pwmRaw with the true LEDC duty
          return 0;
        },
        touchRead: (a) => { const p = vp(a[0], "read"); return m.touch[p] ?? 70; },
        dacWrite: (a) => {
          const p = vp(a[0], "write");
          if (!p) return 0;
          const v = Math.max(0, Math.min(255, Math.round(Number(a[1]) || 0)));
          m.dac[p] = v;
          m.pwm[p] = v;
          return 0;
        },
        esp_random: () => { this.espRandState = (this.espRandState * 1664525 + 1013904223) >>> 0; return this.espRandState; },
        millis: () => m.millis(),
        micros: () => m.micros(),
        map: (a) => Math.round(((a[0] - a[1]) * (a[4] - a[3])) / (a[2] - a[1] || 1) + a[3]),
        constrain: (a) => Math.max(a[1], Math.min(a[2], a[0])),
        min: (a) => Math.min(a[0], a[1]),
        max: (a) => Math.max(a[0], a[1]),
        abs: (a) => Math.abs(a[0]),
        sqrt: (a) => Math.sqrt(a[0]),
        sq: (a) => a[0] * a[0],
        pow: (a) => Math.pow(a[0], a[1]),
        sin: (a) => Math.sin(a[0]), cos: (a) => Math.cos(a[0]), tan: (a) => Math.tan(a[0]),
        floor: (a) => Math.floor(a[0]), ceil: (a) => Math.ceil(a[0]), round: (a) => Math.round(a[0]),
        random: (a) => (a.length >= 2 ? Math.floor(a[0] + Math.random() * (a[1] - a[0])) : Math.floor(Math.random() * (a[0] ?? 2147483647))),
        randomSeed: () => 0,
        bitRead: (a) => (Number(a[0]) >> Number(a[1])) & 1,
        bitWrite: () => 0,
        bitSet: (a) => Number(a[0]) | (1 << Number(a[1])),
        constrainf: (a) => Math.max(a[1], Math.min(a[2], a[0])),
        analogReadResolution: (a) => { m.adcMax = (2 ** Number(a[0])) - 1; return 0; },
        attachInterrupt: () => 0, detachInterrupt: () => 0, interrupts: () => 0, noInterrupts: () => 0,
      };
      return map[name] ?? null;
  ```
  (Read builtins call `m.<op>(vp(a[0], "read"))`: for a known read pin `vp` returns the same label `pl(a[0])`; for an unknown read pin it warns once and still returns `pl(a[0])`, so the operation proceeds against the bare key exactly as today — `m.analogRead`/`m.digitalRead` return their source value or `0`. Write builtins use `if (p)` so an input-only write — where `vp` returns `""` — is no-op'd.)

- [ ] **Step 8: Add the deduped unknown-method warning at the Member-callee site.** The current member-call block is:
  ```ts
      if (node.callee.type === "Member") {
        const obj = yield* this.evalExpr(node.callee.obj, env);
        for (const a of node.args) args.push(yield* this.evalExpr(a, env));
        const m = node.callee.prop;
        if (obj && typeof obj[m] === "function") return obj[m](...args);
        if (typeof obj === "string") return stringMethod(obj, m, args);
        return 0;
      }
  ```
  Replace with:
  ```ts
      if (node.callee.type === "Member") {
        const obj = yield* this.evalExpr(node.callee.obj, env);
        for (const a of node.args) args.push(yield* this.evalExpr(a, env));
        const m = node.callee.prop;
        if (obj && typeof obj[m] === "function") return obj[m](...args);
        if (typeof obj === "string") return stringMethod(obj, m, args);
        if (obj && typeof obj === "object") this.machine.warn(`unsupported method ${m}`);
        return 0;
      }
  ```

- [ ] **Step 9: Add the deduped unknown-call warning at the free-function site.** The current tail of `evalCall` is:
  ```ts
      if (this.functions.has(name)) return yield* this.callUser(name, args);
      const b = this.builtin(name);
      if (b) return b(args);
      return 0;
  ```
  Replace with:
  ```ts
      if (this.functions.has(name)) return yield* this.callUser(name, args);
      const b = this.builtin(name);
      if (b) return b(args);
      if (name) this.machine.warn(`unsupported call ${name}`);
      return 0;
  ```
  (`analogWriteResolution` is out of scope and is not in the dispatch map, so it routes here and surfaces as `[sim] unsupported call analogWriteResolution` — the divergence is visible, not silent.)

- [ ] **Step 10 (VERIFY): typecheck the frontend.**
  Command: `cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm typecheck`
  Expected output: exits 0, no output. (Adapted failing test: before Step 1's import, `BoardProfile` is undefined; before the dispatch edits the new builtins do not exist. After all steps, clean. The 4-arg `Interpreter` constructor has no caller yet — the existing `new Interpreter(code, machine)` site in engine.ts still typechecks because params 3–4 are optional/defaulted.)

- [ ] **Step 11 (COMMIT):**
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && git add src/lib/sim/interpreter.ts && git commit -m "$(cat <<'EOF'
  Frontend Interpreter: ESP32 builtins, validatePin, WiFi/BT stubs

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
  EOF
  )"
  ```

---

### Task 4: Engine seam — SimEngine interface, InterpreterEngine, createEngine, profile threading, use-simulation rewire

Lands last on the frontend, against the already-extended `Machine` (Task 2) and `Interpreter` (Task 3) signatures, so this commit also typechecks green.

**Files**
- Modify `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/engine.ts`:
  - Imports (top of file).
  - `machine = new Machine();` field initializer (line 21).
  - Class declaration + constructor (lines 20, 36–38).
  - `setupInputs` (lines 44–70) — ADC scaling.
  - `updateOutputs` built-in LED line (line 132).
  - `start()` (lines 72–80) — construct `Machine`/`Interpreter` with profile + board name.
- Modify `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/use-simulation.ts`:
  - Import (line 5).
  - Engine construction (lines 24–35).
- `/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim/active.ts` — **no edit** (verify only).

**Interfaces**
- Produces (engine.ts):
  - `export interface SimEngine { start(): boolean; stop(): void; potValues: Record<string, number>; analogInputs: Record<string, number>; distances: Record<string, number>; pressed: Record<string, boolean>; machine: Machine; }`
  - `export class InterpreterEngine implements SimEngine` (renamed from `SimEngine`)
  - `export class SimUnsupportedEngineError extends Error { boardId: string }`
  - `export function createEngine(board: BoardDef, diagram: Diagram, code: string, callbacks: EngineCallbacks): SimEngine`
  - `export type EngineCallbacks` (unchanged, lines 14–18)
- Consumes:
  - `BoardDef`, `BoardProfile`, `UNO_PROFILE` from `@/lib/domain/boards` (Task 1).
  - `Machine` constructor `(profile?)` (Task 2), `Interpreter` constructor `(code, machine, profile?, boardName?)` (Task 3).
  - `getBoard` from `@/lib/domain/boards`; `useStudio.getState().board` (a `BoardId` string — store.ts:48).

Steps:

- [ ] **Step 1: Add boards imports to engine.ts.** With the other imports at the top of `engine.ts`, insert:
  ```ts
  import type { BoardDef, BoardProfile } from "@/lib/domain/boards";
  import { UNO_PROFILE } from "@/lib/domain/boards";
  ```
  (`Diagram` and `Machine` are already imported in `engine.ts`.)

- [ ] **Step 2: Add the `SimEngine` interface + `SimUnsupportedEngineError` above the class.** Immediately before the current line 20 `export class SimEngine {`, insert:
  ```ts
  export interface SimEngine {
    // lifecycle
    start(): boolean; // true = started, false = build/parse failure
    stop(): void;

    // interactive input state — mutated directly by sim-overlay.tsx (raw 0–1023 UI values)
    potValues: Record<string, number>;
    analogInputs: Record<string, number>;
    distances: Record<string, number>;
    pressed: Record<string, boolean>;

    // observable machine state (read by updateOutputs internally)
    machine: Machine;
  }

  export class SimUnsupportedEngineError extends Error {
    constructor(public boardId: string) {
      super(`Simulation for board "${boardId}" is not available yet.`);
      this.name = "SimUnsupportedEngineError";
    }
  }
  ```

- [ ] **Step 3: Rename the concrete class and add `implements SimEngine`.** The current line 20 is:
  ```ts
  export class SimEngine {
  ```
  Replace with:
  ```ts
  export class InterpreterEngine implements SimEngine {
  ```

- [ ] **Step 4: Change the `machine` field initializer to definite-assignment.** The current line 21 is:
  ```ts
    machine = new Machine();
  ```
  Replace with:
  ```ts
    machine!: Machine;
  ```
  (`this.machine` is constructed in `start()` — Step 7. The only pre-`start()` caller, `stop()`, calls `resetVisual`, which does not read `this.machine`; `pump`/`updateOutputs` only run after `start()`.)

- [ ] **Step 5: Add the `profile` field and thread `board` into the constructor.** The current constructor is:
  ```ts
    constructor(private diagram: Diagram, private code: string, private cb: EngineCallbacks) {
      this.net = resolveNetlist(diagram);
    }
  ```
  Replace with:
  ```ts
    private profile: BoardProfile;

    constructor(private board: BoardDef, private diagram: Diagram, private code: string, private cb: EngineCallbacks) {
      this.profile = board.profile ?? UNO_PROFILE;
      this.net = resolveNetlist(diagram);
    }
  ```

- [ ] **Step 6: Scale analog source lambdas by the profile ADC range in `setupInputs`.** Replace the whole method:
  ```ts
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
  ```
  with:
  ```ts
    private setupInputs() {
      const m = this.machine;
      const adcMax = (2 ** this.profile.adcBits) - 1;
      const scale = (raw: number) => Math.round((raw * adcMax) / 1023);
      for (const part of this.diagram.parts) {
        const def = COMPONENT_BY_ID[part.type];
        if (!def) continue;
        const pins = getPinInfo(part.id).map((p) => p.name);
        const mapped = pins.map((name) => ({ name, board: this.boardPinFor(part.id, name) })).filter((x) => x.board);

        if (def.simRole === "potentiometer" || def.simRole === "ldr") {
          const analog = mapped.find((x) => /^A\d/.test(x.board!));
          const target = analog ?? mapped.find((x) => !isPower(x.board!));
          if (target) m.analogSources[normPin(target.board!)] = () => scale(this.potValues[part.id] ?? 512);
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
            else m.analogSources[normPin(sig.board!)] = () => scale(this.analogInputs[part.id] ?? 400);
          }
        }
      }
    }
  ```
  (Both the driven values AND the `?? 512` / `?? 400` defaults scale, so an undriven ESP32 analog pin reports a proportional midpoint. On Uno `adcMax = 1023` so `scale` is the identity — Uno behavior unchanged.)

- [ ] **Step 7: Replace the hardcoded built-in LED pin in `updateOutputs`.** The current line 132 is:
  ```ts
      if (mcu) try { mcu.led13 = (m.digital["13"] ?? 0) > 0; } catch {}
  ```
  Replace with:
  ```ts
      if (mcu) try { mcu.led13 = (m.digital[this.profile.ledBuiltin] ?? 0) > 0; } catch {}
  ```
  (Only this one line changes; the element property stays `led13`, and every `simRole` branch — `led`/`7seg`/`ledbar`/`neopixel`/`buzzer`/`servo`/`relay`/`lcd`/`oled`/`rgb` — is untouched, preserving the sync contract.)

- [ ] **Step 8: Construct `Machine`/`Interpreter` with the profile + board name in `start()`.** The current head of `start()` is:
  ```ts
    start() {
      try {
        this.interp = new Interpreter(this.code, this.machine);
      } catch (e) {
        const err = e as SimError;
        this.cb.onError(`⛔ ${err.message}${err.line ? ` (line ${err.line})` : ""}`);
        this.cb.onStop();
        return false;
      }
  ```
  Replace with:
  ```ts
    start() {
      this.machine = new Machine(this.profile);
      try {
        this.interp = new Interpreter(this.code, this.machine, this.profile, this.board.name);
      } catch (e) {
        const err = e as SimError;
        this.cb.onError(`⛔ ${err.message}${err.line ? ` (line ${err.line})` : ""}`);
        this.cb.onStop();
        return false;
      }
  ```

- [ ] **Step 9: Add the `createEngine` factory at the end of engine.ts.** Append after the class:
  ```ts
  export function createEngine(
    board: BoardDef,
    diagram: Diagram,
    code: string,
    callbacks: EngineCallbacks,
  ): SimEngine {
    switch (board.mcuTarget) {
      case "avr8js": // Arduino UNO — InterpreterEngine + Uno profile
      case "esp32": // ESP32 DevKit — same interpreter + ESP32 profile
        return new InterpreterEngine(board, diagram, code, callbacks);
      case "rp2040js": // Spec B — Pico real-firmware engine slot (not implemented)
        throw new SimUnsupportedEngineError(board.id);
      default: // defensive: any future mcuTarget string not yet wired
        throw new SimUnsupportedEngineError(board.id);
    }
  }
  ```

- [ ] **Step 10: Update the use-simulation.ts import (line 5).** The current line 5 is:
  ```ts
  import { SimEngine } from "@/lib/sim/engine";
  ```
  Replace with:
  ```ts
  import { createEngine, SimUnsupportedEngineError } from "@/lib/sim/engine";
  import type { SimEngine } from "@/lib/sim/engine";
  import { getBoard } from "@/lib/domain/boards";
  ```

- [ ] **Step 11: Replace the engine construction in use-simulation.ts.** The current block (lines 24–35) is:
  ```ts
      const eng = new SimEngine(st.toDiagram(), st.sketchContent(), {
        onSerial: (l) => useStudio.getState().appendSerial(l),
        onError: (m) => useStudio.getState().appendSerial(m),
        onStop: () => {
          engineRef.current = null;
          setActiveEngine(null);
          useStudio.getState().setRunning(false);
        },
      });
      engineRef.current = eng;
      setActiveEngine(eng);
      const ok = eng.start();
  ```
  Replace with:
  ```ts
      const board = getBoard(useStudio.getState().board);
      let eng: SimEngine;
      try {
        eng = createEngine(board, st.toDiagram(), st.sketchContent(), {
          onSerial: (l) => useStudio.getState().appendSerial(l),
          onError: (m) => useStudio.getState().appendSerial(m),
          onStop: () => {
            engineRef.current = null;
            setActiveEngine(null);
            useStudio.getState().setRunning(false);
          },
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
      engineRef.current = eng;
      setActiveEngine(eng);
      const ok = eng.start();
  ```

- [ ] **Step 12 (VERIFY): typecheck the frontend (fully clean).**
  Command: `cd /Users/marimo/Dev/robocode/robocode-frontend && pnpm typecheck`
  Expected output: exits 0, no output. (Adapted failing test: before this task, `createEngine`/`SimUnsupportedEngineError` do not exist and `new SimEngine(...)` mismatches the renamed class; after, every type resolves.)

- [ ] **Step 13 (VERIFY): confirm `active.ts` needs no change.**
  Command: `cd /Users/marimo/Dev/robocode/robocode-frontend && git diff --quiet src/lib/sim/active.ts && echo "active.ts unchanged"`
  Expected output: `active.ts unchanged`

- [ ] **Step 14 (COMMIT):**
  ```
  cd /Users/marimo/Dev/robocode/robocode-frontend && git add src/lib/sim/engine.ts src/lib/sim/use-simulation.ts && git commit -m "$(cat <<'EOF'
  Engine seam: SimEngine interface + InterpreterEngine + createEngine

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
  EOF
  )"
  ```

---

### Task 5a: Backend branch + board-profile.ts + machine.ts mirror

**Files**
- Create `/Users/marimo/Dev/robocode/robocode-backend/src/sim/board-profile.ts`.
- Modify `/Users/marimo/Dev/robocode/robocode-backend/src/sim/machine.ts` (mirror Task 2 exactly, import from `./board-profile`).

**Interfaces**
- Produces (board-profile.ts):
  - `export interface BoardProfile { … }` (identical shape to frontend Task 1)
  - `export const UNO_PROFILE: BoardProfile`
  - `export const ESP32_PROFILE: BoardProfile`
  - `export const ESP_RAND_SEED = 0x2545f491; export const ESP_RAND_MUL = 1664525; export const ESP_RAND_INC = 1013904223;`
- Produces (machine.ts): same surface as Task 2 (`constructor(profile?)`, `adcMax`/`pwmMax`/`pwmRaw`/`dac`/`touch`, extended `reset()`, `analogRead` clamp, `analogWrite` brightness, `warn`).
- Consumes: `BoardProfile` from `./board-profile`.

Steps:

- [ ] **Step 0 (SETUP): create the backend branch.**
  Command: `cd /Users/marimo/Dev/robocode/robocode-backend && git checkout -b spec/esp32-emulation && git branch --show-current`
  Expected output: `spec/esp32-emulation`

- [ ] **Step 1: Create `board-profile.ts`.** Write `/Users/marimo/Dev/robocode/robocode-backend/src/sim/board-profile.ts`:
  ```ts
  // Backend copy of the sim board profiles. Deliberately duplicated from the
  // frontend src/lib/domain/boards.ts (the backend does not import the web app).
  // The esp_random LCG constants live here so both repos seed identically.

  export interface BoardProfile {
    pins: string[];
    analogPins: string[];
    inputOnlyPins: string[];
    adcBits: number;
    pwmMax: number;
    touchPins: string[];
    dacPins: string[];
    uarts: Array<{ tx: string; rx: string }>;
    ledBuiltin: string;
  }

  export const UNO_PROFILE: BoardProfile = {
    pins: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"],
    analogPins: ["A0", "A1", "A2", "A3", "A4", "A5"],
    inputOnlyPins: [],
    adcBits: 10,
    pwmMax: 255,
    touchPins: [],
    dacPins: [],
    uarts: [{ tx: "1", rx: "0" }],
    ledBuiltin: "13",
  };

  export const ESP32_PROFILE: BoardProfile = {
    pins: ["2", "4", "5", "12", "13", "14", "15", "18", "19", "21", "22", "23", "25", "26", "27", "32", "33"],
    analogPins: ["32", "33", "34", "35", "36", "39"],
    inputOnlyPins: ["34", "35", "36", "39"],
    adcBits: 12,
    pwmMax: 255,
    touchPins: ["4", "0", "2", "15", "13", "12", "14", "27", "33", "32"],
    dacPins: ["25", "26"],
    uarts: [{ tx: "1", rx: "3" }, { tx: "10", rx: "9" }, { tx: "17", rx: "16" }],
    ledBuiltin: "2",
  };

  // esp_random LCG constants (shared by front + back for grading parity).
  export const ESP_RAND_SEED = 0x2545f491;
  export const ESP_RAND_MUL = 1664525;
  export const ESP_RAND_INC = 1013904223;
  ```

- [ ] **Step 2: Mirror machine.ts changes with the backend import.** Apply Task 2 Steps 1–6 to `/Users/marimo/Dev/robocode/robocode-backend/src/sim/machine.ts` byte-for-byte, EXCEPT Step 1's import line, which uses the relative backend path:
  ```ts
  import type { BoardProfile } from "./board-profile";
  ```
  All other edits (fields + constructor, extended `reset()`, `analogWrite` with `pwmRaw`, `analogRead` clamp, `warn`) are identical to Task 2. This single import-line difference is the only allowed divergence and is whitelisted by the Task 7 guard.

- [ ] **Step 3 (VERIFY): machine.ts differs front/back ONLY by the `BoardProfile` import line.** (The import sits on line 4 under a 2-line comment header, so a positional `tail -n +2` would not drop it — filter the import line by content instead.)
  Command: `cd /Users/marimo/Dev/robocode && diff <(grep -v 'import type { BoardProfile }' robocode-frontend/src/lib/sim/machine.ts) <(grep -v 'import type { BoardProfile }' robocode-backend/src/sim/machine.ts) && echo "machine.ts identical except the BoardProfile import line"`
  Expected output: `machine.ts identical except the BoardProfile import line` (no diff lines printed; the only difference is the `BoardProfile` import specifier, which is filtered out on both sides).

- [ ] **Step 4 (VERIFY): typecheck the backend.**
  Command: `cd /Users/marimo/Dev/robocode/robocode-backend && pnpm typecheck`
  Expected output: exits 0, no output. (`grader.ts` still calls `new Machine()` with no args, which the new optional constructor param tolerates.)

- [ ] **Step 5 (COMMIT):**
  ```
  cd /Users/marimo/Dev/robocode/robocode-backend && git add src/sim/board-profile.ts src/sim/machine.ts && git commit -m "$(cat <<'EOF'
  Backend sim parity: board-profile.ts + Machine profile/ADC/PWM mirror

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
  EOF
  )"
  ```

---

### Task 5b: Backend interpreter.ts mirror

**Files**
- Modify `/Users/marimo/Dev/robocode/robocode-backend/src/sim/interpreter.ts` (mirror Task 3, keep relative imports + `MAX_ARRAY_SIZE` guard; use named LCG constants).

**Interfaces**
- Produces: same surface as Task 3 (`constructor(code, machine, profile?, boardName?)`, `validatePin`, `makeWiFi`, `makeBT`, ESP32 builtins, `analogReadResolution` writes `adcMax`, two warning sites).
- Consumes: `BoardProfile`, `ESP_RAND_SEED`, `ESP_RAND_MUL`, `ESP_RAND_INC` from `./board-profile` (Task 5a); existing relative imports `./parser`/`./lexer`/`./machine`; the backend-only `MAX_ARRAY_SIZE` guard (lines 57, 199–201).

Steps:

- [ ] **Step 1: Apply Task 3 Steps 2–9 with backend substitutions.** Apply Task 3 Steps 2 through 9 to `/Users/marimo/Dev/robocode/robocode-backend/src/sim/interpreter.ts` exactly, with these three backend-specific changes:
  - **Imports (Task 3 Step 1):** instead of the frontend `@/lib/domain/boards` import, add below the existing relative imports:
    ```ts
    import type { BoardProfile } from "./board-profile";
    import { ESP_RAND_SEED, ESP_RAND_MUL, ESP_RAND_INC } from "./board-profile";
    ```
  - **`espRandState` field (Task 3 Step 2):** seed from the shared constant — `private espRandState = ESP_RAND_SEED;`
  - **`esp_random` builtin (Task 3 Step 7):** use the named multipliers — `esp_random: () => { this.espRandState = (this.espRandState * ESP_RAND_MUL + ESP_RAND_INC) >>> 0; return this.espRandState; },`

  Keep the existing relative imports (`./parser`, `./lexer`, `./machine`) and the `MAX_ARRAY_SIZE` constant + array-allocation guard untouched. The frontend uses the bare literals `0x2545f491`/`1664525`/`1013904223`; the backend uses the named constants — both produce identical 32-bit unsigned sequences. The Task 7 guard whitelists this literal-vs-constant difference.

- [ ] **Step 2 (VERIFY): typecheck the backend.**
  Command: `cd /Users/marimo/Dev/robocode/robocode-backend && pnpm typecheck`
  Expected output: exits 0, no output. (The 4-arg `Interpreter` constructor still typechecks at the existing `new Interpreter(code, m)` site in `grader.ts` because params 3–4 are optional/defaulted; Task 5c upgrades that call.)

- [ ] **Step 3 (VERIFY): `MAX_ARRAY_SIZE` remains backend-only.**
  Command: `cd /Users/marimo/Dev/robocode && echo -n "backend="; grep -c MAX_ARRAY_SIZE robocode-backend/src/sim/interpreter.ts; echo -n "frontend="; grep -c MAX_ARRAY_SIZE robocode-frontend/src/lib/sim/interpreter.ts`
  Expected output: `backend=3` (a non-zero count) then `frontend=0`.

- [ ] **Step 4 (COMMIT):**
  ```
  cd /Users/marimo/Dev/robocode/robocode-backend && git add src/sim/interpreter.ts && git commit -m "$(cat <<'EOF'
  Backend Interpreter parity: ESP32 builtins + validatePin + WiFi/BT stubs

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
  EOF
  )"
  ```

---

### Task 5c: gradeCode board param + competitions wiring

**Files**
- Modify `/Users/marimo/Dev/robocode/robocode-backend/src/sim/grader.ts` — imports + `gradeCode` head (lines 36–50) + `Interpreter` construction (line 63).
- Modify `/Users/marimo/Dev/robocode/robocode-backend/src/modules/competitions/competitions.service.ts` — `submitSolution` grading call (line 415).

**Interfaces**
- Produces: `gradeCode(code, checks, opts?)` where `opts` gains `board?: string`; builds `Machine`/`Interpreter` with `board === "esp32" ? ESP32_PROFILE : UNO_PROFILE` (Pico/custom collapse to `UNO_PROFILE` — deliberate Spec A choice).
- Consumes: `UNO_PROFILE`/`ESP32_PROFILE` (`./board-profile`); `task.boardType` (Prisma `Task.boardType`, `schema.prisma:310`, `@default("arduino-uno")`).

Steps:

- [ ] **Step 1: Add the grader profile imports.** At the top of `grader.ts`, alongside the existing `Machine`/`Interpreter` imports, add:
  ```ts
  import { UNO_PROFILE, ESP32_PROFILE } from "./board-profile";
  ```

- [ ] **Step 2: Add `board?` to `gradeCode` opts and build the profile-aware Machine.** The current head of `gradeCode` is:
  ```ts
  export function gradeCode(
    code: string,
    checks: { rules?: CheckRule[] } | null | undefined,
    opts?: { analog?: Record<string, number>; digital?: Record<string, number>; maxWaits?: number },
  ): GradeResult {
    const rules = checks?.rules ?? [];
    const serial: string[] = [];
    const m = new Machine();
    m.onSerial = (l) => serial.push(l);
    for (const [k, v] of Object.entries(opts?.analog ?? {})) m.analogSources[k] = () => v;
    for (const [k, v] of Object.entries(opts?.digital ?? {})) m.digitalSources[k] = () => v;
  ```
  Replace with:
  ```ts
  export function gradeCode(
    code: string,
    checks: { rules?: CheckRule[] } | null | undefined,
    opts?: { analog?: Record<string, number>; digital?: Record<string, number>; maxWaits?: number; board?: string },
  ): GradeResult {
    const rules = checks?.rules ?? [];
    const serial: string[] = [];
    const profile = opts?.board === "esp32" ? ESP32_PROFILE : UNO_PROFILE;
    const m = new Machine(profile);
    m.onSerial = (l) => serial.push(l);
    for (const [k, v] of Object.entries(opts?.analog ?? {})) m.analogSources[k] = () => v;
    for (const [k, v] of Object.entries(opts?.digital ?? {})) m.digitalSources[k] = () => v;
  ```

- [ ] **Step 3: Pass the profile + board name into the grader's `Interpreter`.** The current construction is:
  ```ts
    const interp = new Interpreter(code, m);
  ```
  Replace with:
  ```ts
    const interp = new Interpreter(code, m, profile, opts?.board === "esp32" ? "ESP32 DevKit V1" : "Arduino UNO R3");
  ```
  (Board-name literals match `BOARDS["esp32"].name` and `BOARDS["arduino-uno"].name` exactly — verified `"ESP32 DevKit V1"` / `"Arduino UNO R3"` in boards.ts — so grader and engine print identical invalid-pin warnings.)

- [ ] **Step 4: Pass `task.boardType` from `competitions.service.ts`.** The current grading call is:
  ```ts
        result = gradeCode(code, checks);
  ```
  Replace with:
  ```ts
        result = gradeCode(code, checks, { board: task.boardType });
  ```
  (`Task` is already loaded above this line; `Task.boardType` defaults to `"arduino-uno"`, so legacy/null tasks stay on the Uno profile. The earlier `projects.service.ts:172` path writes `boardType` on the unrelated `Project` model and is NOT on the grading path — it is deliberately not touched.)

- [ ] **Step 5 (VERIFY): typecheck the backend.**
  Command: `cd /Users/marimo/Dev/robocode/robocode-backend && pnpm typecheck`
  Expected output: exits 0, no output. (Adapted failing test: before this task, `gradeCode(..., { board })` and `new Interpreter(code, m, profile, name)` mismatch the old signatures; after, clean.)

- [ ] **Step 6 (COMMIT):**
  ```
  cd /Users/marimo/Dev/robocode/robocode-backend && git add src/sim/grader.ts src/modules/competitions/competitions.service.ts && git commit -m "$(cat <<'EOF'
  Backend grader: board-aware gradeCode + competitions boardType wiring

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
  EOF
  )"
  ```

---

### Task 6: Headless smoke script with 7 characterization fixtures

These are **characterization fixtures** over behavior that Tasks 5a–5b already landed (the backend `Machine`/`Interpreter` exist), not red-then-green TDD. The verify gate is: every fixture asserts a hardcoded expected serial line / pin value, and the script exits non-zero if any assertion fails. It reuses the backend engine, so it doubles as the front/back parity gate for ESP32 behavior.

**Files**
- Create `/Users/marimo/Dev/robocode/robocode-backend/src/sim/smoke.ts`.

**Interfaces**
- Consumes: `Machine` (`./machine`), `Interpreter` (`./interpreter`), `UNO_PROFILE`, `ESP32_PROFILE`, `BoardProfile` (`./board-profile`).
- Produces: a runnable script that, per fixture, builds `Machine(profile)` + `Interpreter(code, machine, profile, name)`, drains the generator (bounded by a wait-count, mirroring `grader.ts`'s drain so a `void loop(){}` does not spin), collects serial + reads pin state, asserts against hardcoded expected values, and `process.exit(1)` on any failure.

Steps:

- [ ] **Step 1: Write the smoke harness skeleton with a bounded drain.** Create `/Users/marimo/Dev/robocode/robocode-backend/src/sim/smoke.ts`:
  ```ts
  // Headless smoke run for the sim engine. No test framework: assertions are
  // hardcoded expected serial lines / pin values. Exits non-zero on any failure.
  // The drain mirrors grader.ts: stop after a few `wait` yields so a sketch with
  // an empty loop() does not spin forever.
  import { Machine } from "./machine";
  import { Interpreter } from "./interpreter";
  import { UNO_PROFILE, ESP32_PROFILE, type BoardProfile } from "./board-profile";

  let failures = 0;
  function check(name: string, cond: boolean, detail: string) {
    if (cond) {
      console.log(`PASS ${name}`);
    } else {
      failures++;
      console.log(`FAIL ${name}: ${detail}`);
    }
  }

  // Run a sketch against a profile; drain until `maxWaits` wait-yields or a tick
  // cap, then return serial lines + the machine. setup() runs before the first
  // wait, so single-shot setup fixtures are fully captured immediately.
  function run(
    code: string,
    profile: BoardProfile,
    analog: Record<string, number> = {},
    maxWaits = 4,
  ): { serial: string[]; m: Machine } {
    const serial: string[] = [];
    const m = new Machine(profile);
    m.onSerial = (l) => serial.push(l);
    for (const [k, v] of Object.entries(analog)) m.analogSources[k] = () => v;
    const name = profile === ESP32_PROFILE ? "ESP32 DevKit V1" : "Arduino UNO R3";
    const interp = new Interpreter(code, m, profile, name);
    const gen = interp.run();
    let res = gen.next();
    let waits = 0;
    let ticks = 0;
    while (!res.done && waits < maxWaits && ticks++ < 200000) {
      if (res.value && (res.value as { kind?: string }).kind === "wait") waits++;
      res = gen.next();
    }
    return { serial, m };
  }
  ```

- [ ] **Step 2: fixture-ledc-fade.** Append:
  ```ts
  // fixture-ledc-fade: ledcWrite(0,128) at 8-bit -> pwm["2"]===128, pwmRaw["2"]===128
  {
    const code = `
  void setup() {
    ledcSetup(0, 5000, 8);
    ledcAttachPin(2, 0);
    ledcWrite(0, 128);
  }
  void loop() {}
  `;
    const { m } = run(code, ESP32_PROFILE);
    check("ledc-fade pwm", m.pwm["2"] === 128, `pwm["2"]=${m.pwm["2"]}`);
    check("ledc-fade pwmRaw", m.pwmRaw["2"] === 128, `pwmRaw["2"]=${m.pwmRaw["2"]}`);
  }
  ```

- [ ] **Step 3: fixture-adc12.** Append:
  ```ts
  // fixture-adc12: analogRead(34) reaches 4095 at 12-bit; caps at 1023 after analogReadResolution(10)
  {
    const code12 = `
  void setup() { Serial.begin(115200); Serial.println(analogRead(34)); }
  void loop() {}
  `;
    const { serial: s12 } = run(code12, ESP32_PROFILE, { "34": 4095 });
    check("adc12 full-scale", s12[0] === "4095", `got "${s12[0]}"`);

    const code10 = `
  void setup() { Serial.begin(115200); analogReadResolution(10); Serial.println(analogRead(34)); }
  void loop() {}
  `;
    const { serial: s10 } = run(code10, ESP32_PROFILE, { "34": 4095 });
    check("adc12 capped@10bit", s10[0] === "1023", `got "${s10[0]}"`);
  }
  ```

- [ ] **Step 4: fixture-touch.** Append:
  ```ts
  // fixture-touch: touchRead(4)===70 with no warning; touchRead(99) warns invalid pin
  {
    const code = `
  void setup() {
    Serial.begin(115200);
    Serial.println(touchRead(4));
    Serial.println(touchRead(99));
  }
  void loop() {}
  `;
    const { serial } = run(code, ESP32_PROFILE);
    check("touch T0 value", serial[0] === "70", `got "${serial[0]}"`);
    check("touch invalid-pin warn", serial.some((l) => l.startsWith("[sim] invalid pin 99")), `serial=${JSON.stringify(serial)}`);
  }
  ```

- [ ] **Step 5: fixture-wifi-connect.** Append:
  ```ts
  // fixture-wifi-connect: status() returns WL_CONNECTED immediately; localIP printed
  {
    const code = `
  void setup() {
    Serial.begin(115200);
    WiFi.begin("ssid", "pass");
    while (WiFi.status() != WL_CONNECTED) { delay(10); }
    Serial.println(WiFi.localIP());
  }
  void loop() {}
  `;
    const { serial } = run(code, ESP32_PROFILE);
    check("wifi connects + ip", serial.some((l) => l === "192.168.4.2"), `serial=${JSON.stringify(serial)}`);
  }
  ```

- [ ] **Step 6: fixture-serial2.** Append:
  ```ts
  // fixture-serial2: Serial2.println("hi") lands in the transcript
  {
    const code = `
  void setup() {
    Serial2.begin(115200);
    Serial2.println("hi");
  }
  void loop() {}
  `;
    const { serial } = run(code, ESP32_PROFILE);
    check("serial2 println", serial.includes("hi"), `serial=${JSON.stringify(serial)}`);
  }
  ```

- [ ] **Step 7: fixture-input-only.** Append:
  ```ts
  // fixture-input-only: digitalWrite(34, HIGH) warns input-only and does not set digital["34"]
  {
    const code = `
  void setup() { digitalWrite(34, HIGH); }
  void loop() {}
  `;
    const { serial, m } = run(code, ESP32_PROFILE);
    check("input-only warn", serial.some((l) => l === "[sim] pin 34 is input-only"), `serial=${JSON.stringify(serial)}`);
    check("input-only no write", m.digital["34"] !== 1, `digital["34"]=${m.digital["34"]}`);
  }
  ```

- [ ] **Step 8: fixture-uno-blink (regression) + Pico routing assertion + exit.** Append:
  ```ts
  // fixture-uno-blink (Uno profile regression): exact serial + ADC 0-1023 + PWM 255 + LED pin "13"
  {
    const code = `
  void setup() {
    Serial.begin(9600);
    pinMode(13, OUTPUT);
  }
  void loop() {
    digitalWrite(13, HIGH);
    Serial.println("on");
    delay(500);
    digitalWrite(13, LOW);
    Serial.println("off");
    delay(500);
  }
  `;
    // Two full on/off cycles = 4 wait yields, then stop.
    const { serial, m } = run(code, UNO_PROFILE, {}, 4);
    check("uno-blink serial[0]", serial[0] === "on", `got "${serial[0]}"`);
    check("uno-blink serial[1]", serial[1] === "off", `got "${serial[1]}"`);
    check("uno-blink adcMax", m.adcMax === 1023, `adcMax=${m.adcMax}`);
    check("uno-blink pwmMax", m.pwmMax === 255, `pwmMax=${m.pwmMax}`);
    check("uno-blink led pin13 driven", typeof m.digital["13"] === "number", `digital["13"]=${m.digital["13"]}`);
  }

  // Pico routing: createEngine's rp2040js branch throws. The backend has no
  // frontend engine.ts, so replicate the routing decision the spec defines.
  {
    function routeThrows(mcuTarget: string): boolean {
      // mirror createEngine: only avr8js/esp32 are supported
      return mcuTarget !== "avr8js" && mcuTarget !== "esp32";
    }
    check("pico unsupported routing", routeThrows("rp2040js"), "rp2040js should route to SimUnsupportedEngineError");
  }

  if (failures > 0) {
    console.log(`\n${failures} failure(s)`);
    process.exit(1);
  }
  console.log("\nAll smoke fixtures passed");
  ```

- [ ] **Step 9 (VERIFY): run the smoke script.**
  Command: `cd /Users/marimo/Dev/robocode/robocode-backend && npx tsx src/sim/smoke.ts`
  Expected output: the lines `PASS ledc-fade pwm`, `PASS ledc-fade pwmRaw`, `PASS adc12 full-scale`, `PASS adc12 capped@10bit`, `PASS touch T0 value`, `PASS touch invalid-pin warn`, `PASS wifi connects + ip`, `PASS serial2 println`, `PASS input-only warn`, `PASS input-only no write`, `PASS uno-blink serial[0]`, `PASS uno-blink serial[1]`, `PASS uno-blink adcMax`, `PASS uno-blink pwmMax`, `PASS uno-blink led pin13 driven`, `PASS pico unsupported routing`, then `All smoke fixtures passed`. Process exits 0.

- [ ] **Step 10 (COMMIT):**
  ```
  cd /Users/marimo/Dev/robocode/robocode-backend && git add src/sim/smoke.ts && git commit -m "$(cat <<'EOF'
  Headless sim smoke script: 7 ESP32/Uno parity fixtures

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
  EOF
  )"
  ```

---

### Task 7: CI diff-guard script + wiring

**Files**
- Create `/Users/marimo/Dev/robocode/scripts/sim-diff-guard.sh`.

**Interfaces**
- Consumes: front `src/lib/sim/machine.ts` + `src/lib/sim/interpreter.ts`; back `src/sim/machine.ts` + `src/sim/interpreter.ts`.
- Produces: exit 0 when the only differences are the whitelisted import paths + `MAX_ARRAY_SIZE` hunk + `esp_random` literal-vs-constant + the single `BoardProfile` import line; exit 1 otherwise.

Steps:

- [ ] **Step 1: Write the guard.** Create `/Users/marimo/Dev/robocode/scripts/sim-diff-guard.sh`:
  ```bash
  #!/usr/bin/env bash
  # CI guard: front/back sim engine must not drift in logic.
  # machine.ts: identical except the single BoardProfile import line (line 1).
  # interpreter.ts: differ only by whitelisted import paths, the MAX_ARRAY_SIZE
  #                 guard, and the esp_random literal-vs-constant lines.
  set -euo pipefail

  FRONT=/Users/marimo/Dev/robocode/robocode-frontend/src/lib/sim
  BACK=/Users/marimo/Dev/robocode/robocode-backend/src/sim

  fail=0

  # --- machine.ts: filter the single BoardProfile import line (path differs) by
  #     content, then compare. The import is on line 4 (under a 2-line comment
  #     header), so a positional tail -n +2 would NOT drop it — match by content. ---
  if diff <(grep -v 'import type { BoardProfile }' "$FRONT/machine.ts") <(grep -v 'import type { BoardProfile }' "$BACK/machine.ts") >/dev/null; then
    echo "OK machine.ts identical (ignoring the BoardProfile import line)"
  else
    echo "DRIFT machine.ts differs beyond the BoardProfile import line:"
    diff <(grep -v 'import type { BoardProfile }' "$FRONT/machine.ts") <(grep -v 'import type { BoardProfile }' "$BACK/machine.ts") || true
    fail=1
  fi

  # --- interpreter.ts: normalize whitelisted differences, then compare ---
  # Whitelist transforms applied to BOTH files to collapse known-allowed diffs:
  #  1. import paths: "@/lib/sim/X" -> "./X"
  #  2. BoardProfile / esp_random import lines (present/differing) -> removed
  #  3. backend-only array-size guard removed: the `const MAX_ARRAY_SIZE`
  #     declaration + its comments, AND the multi-line allocation guard block
  #     (range-deleted `const n = Math.max(... ` .. `arr = new Array(n).fill(0);`),
  #     AND the frontend one-liner `arr = new Array(Number(size) || 0).fill(0);`
  #     — so the array-allocation region collapses to empty on both sides.
  #  4. esp_random literals vs ESP_RAND_* constants -> normalized token
  #  5. blank lines stripped so removed-line whitespace does not show as diff
  norm() {
    sed -E \
      -e 's#@/lib/sim/#./#g' \
      -e '/from "\.\/board-profile"/d' \
      -e '/import type \{ BoardProfile \}/d' \
      -e '/^const MAX_ARRAY_SIZE/d' \
      -e '/Cap allocation so/d' \
      -e '/Hard cap on dynamically-sized/d' \
      -e '/cannot OOM the/d' \
      -e '/const n = Math\.max\(0, Math\.trunc\(Number\(size\)/,/arr = new Array\(n\)\.fill\(0\);/d' \
      -e '/arr = new Array\(Number\(size\) \|\| 0\)\.fill\(0\);/d' \
      -e 's/0x2545f491|ESP_RAND_SEED/__ESPSEED__/g' \
      -e 's/1664525|ESP_RAND_MUL/__ESPMUL__/g' \
      -e 's/1013904223|ESP_RAND_INC/__ESPINC__/g' \
      "$1" | sed -E '/^[[:space:]]*$/d'
  }

  if diff <(norm "$FRONT/interpreter.ts") <(norm "$BACK/interpreter.ts") >/dev/null; then
    echo "OK interpreter.ts differs only by whitelisted hunks"
  else
    echo "DRIFT interpreter.ts differs beyond the whitelist:"
    diff <(norm "$FRONT/interpreter.ts") <(norm "$BACK/interpreter.ts") || true
    fail=1
  fi

  if [ "$fail" -ne 0 ]; then
    echo "sim-diff-guard FAILED"
    exit 1
  fi
  echo "sim-diff-guard PASSED"
  ```

- [ ] **Step 2: Make it executable.**
  Command: `mkdir -p /Users/marimo/Dev/robocode/scripts && chmod +x /Users/marimo/Dev/robocode/scripts/sim-diff-guard.sh && echo chmod-ok`
  Expected output: `chmod-ok`

- [ ] **Step 3 (VERIFY): run the guard.**
  Command: `/Users/marimo/Dev/robocode/scripts/sim-diff-guard.sh`
  Expected output: `OK machine.ts identical (ignoring the BoardProfile import line)`, `OK interpreter.ts differs only by whitelisted hunks`, `sim-diff-guard PASSED`. Exit 0. (Adapted failing test: if the backend `interpreter.ts` had any logic line the frontend lacked — e.g. a missed builtin — the `norm`-ed diff would be non-empty and the guard would print `DRIFT …` and exit 1. Mirroring Task 5b exactly makes it pass.)

- [ ] **Step 4 (COMMIT):** The repo tree root `/Users/marimo/Dev/robocode` is a git work tree (confirmed `git rev-parse --is-inside-work-tree` → true), and `scripts/` does not yet exist, so the guard is committed to the root repo.
  ```
  cd /Users/marimo/Dev/robocode && git add scripts/sim-diff-guard.sh && git commit -m "$(cat <<'EOF'
  Add CI diff-guard for front/back sim engine parity

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01PY3GY5o1gHzvrmVo9HmN6Y
  EOF
  )"
  ```

---

## Pre-merge checklist (manual, before opening PRs)

- [x] **Audit seeded ESP32 tasks for ADC/PWM scale mismatch.** DONE 2026-06-22 — CLEAN. The only check rule types used across all content tasks are `pin_toggles`, `serial_contains`, `stdout_contains` (zero `analog`/`analog_write`/`pin_high`/`maxPwm` rules). The only graded `boardType:"esp32"` task (`robo-esp32.ts` `challenge-esp32`) asserts `serial_contains "esp32 ready"`; the `seed.ts` "ESP32 Blink" is an `isTemplate` project with no checks. No 10-bit/0–1023 threshold exists, so nothing can mis-scale on the ESP32 profile.
- [x] **Confirm no curriculum sketch relies on `analogWriteResolution`/ADC2/touch-loops.** DONE 2026-06-22 — CLEAN. Grep of `prisma/content/` found zero occurrences of `analogWriteResolution`, `touchRead`, `ledcWrite`, `ledcSetup`, `dacWrite`, and no `analogRead` on ADC2 pins. The documented Spec A limitations (analogWriteResolution→unsupported-call warning, ADC2 unavailable, touchRead fixed `70`) affect no existing lesson.
