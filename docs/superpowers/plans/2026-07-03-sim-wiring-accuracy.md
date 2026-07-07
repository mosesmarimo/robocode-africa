# Sim Wiring Accuracy (ESP32 + Pico) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the ESP32 simulator's wiring actually simulate (aliases, built-in LED, displays), make the Pico sim accurate (real Pico board element, input boot race, servo angle, I2C bus accuracy), and land the confirmed code-review fixes across all three repos.

**Architecture:** Board-pin canonicalization moves to data on `BoardDef` (`pinAliases`, `builtinLedProp`) consumed by both engines; the Pico gets a first-party `rc-pi-pico` board component (like the existing `rc-breadboard`) so wiring uses real GP labels; frontend/backend `src/sim` copies stay parity-locked (extend `scripts/sim-diff-guard.sh`).

**Tech Stack:** Next.js 15 (read `robocode-frontend/node_modules/next/dist/docs/` before Next-specific changes), NestJS + Prisma, rp2040js Web Worker, Flutter.

## Global Constraints

- Three independent git repos under `/Users/marimo/Dev/robocode`: `robocode-backend`, `robocode-frontend`, `robocode-mobile`. Commit in the repo you changed (one commit per task per repo touched).
- **Parity rule:** `robocode-frontend/src/lib/sim/{lexer,parser,interpreter,machine,grader}.ts` must stay near-identical to `robocode-backend/src/sim/*`. Any edit to one copy is made identically to the other. Gate: `bash /Users/marimo/Dev/robocode/scripts/sim-diff-guard.sh` passes.
- No test frameworks. Verification = `pnpm typecheck` (frontend+backend), `flutter analyze` (mobile), backend headless smoke `npx tsx src/sim/smoke.ts`, and the Playwright repros in `robocode-frontend/scripts/_repro-esp32.mjs` / `_repro-pico.mjs` (dev servers on :3000/:4000, login `ada@robocode.africa` / `password123`).
- ESP32 element pin names (authoritative, from `@wokwi/elements`): `VIN GND.2 D13 D12 D14 D27 D26 D25 D33 D32 D35 D34 VN VP EN 3V3 GND.1 D15 D2 D4 RX2 TX2 D5 D18 D19 D21 RX0 TX0 D22 D23`.
- Board LED properties (authoritative): Uno element `led13`, ESP32 element `led1`, Nano-RP2040 element `ledBuiltIn`. Our new `rc-pi-pico` must expose `ledBuiltIn`.

---

### Task 1: Board pin aliases + built-in LED property on BoardDef; engine normalization

**Files:**
- Modify: `robocode-frontend/src/lib/domain/boards.ts`
- Modify: `robocode-frontend/src/lib/sim/engine.ts`
- Modify: `robocode-backend/src/sim/board-profile.ts` (pins list only)

**Interfaces:**
- Produces: `BoardDef.pinAliases?: Record<string, string>` (element pin label → GPIO label), `BoardDef.builtinLedProp?: string`. Helper in engine.ts: `makePinNormalizer(board: BoardDef): (label: string) => string`.
- Later tasks (2, 7) consume `pinAliases` and `builtinLedProp`.

- [ ] **Step 1: Failing repro.** With dev servers up, run `node scripts/_repro-esp32.mjs` (already in repo). Expected current output: `pot=0` in serial (VP wiring dead). Keep the output for comparison.

- [ ] **Step 2: boards.ts data.** Add to `BoardDef`:

```ts
/** Element pin label -> GPIO label used by the sim Machine (e.g. ESP32 "VP" -> "36"). */
pinAliases?: Record<string, string>;
/** Board element property that renders the on-board LED (uno: led13, esp32: led1, pico: ledBuiltIn). */
builtinLedProp?: string;
```

On `arduino-uno`: `builtinLedProp: "led13"`. On `esp32`: `builtinLedProp: "led1"` and

```ts
pinAliases: { VP: "36", VN: "39", TX0: "1", RX0: "3", TX2: "17", RX2: "16" },
```

On `raspberry-pi-pico`: `builtinLedProp: "ledBuiltIn"` and legacy Nano labels (kept so pre-existing saved diagrams still simulate after Task 7 switches the element):

```ts
pinAliases: {
  D2: "25", D3: "15", D4: "16", D5: "17", D6: "18", D7: "19", D8: "20", D9: "21",
  D10: "5", D11: "7", D12: "4", D13: "6",
  A0: "26", A1: "27", A2: "28", A3: "29", A4: "12", A5: "13", RX: "1",
},
```

Also extend the ESP32 profile `pins` with `"1", "3", "16", "17"` (in `boards.ts` AND identically in `robocode-backend/src/sim/board-profile.ts` — keep array order identical in both).

- [ ] **Step 3: engine.ts normalization.** Replace the module-level `normPin` with:

```ts
/** Board-aware element-pin -> GPIO-label normalizer (aliases first, then D-prefix strip). */
const makePinNormalizer = (board: BoardDef) => (p: string): string =>
  board.pinAliases?.[p] ?? (/^D\d+$/.test(p) ? p.slice(1) : p);
```

In `InterpreterEngine`, add `private normPin: (p: string) => string` initialized in the constructor via `makePinNormalizer(board)`, and use it everywhere the old `normPin` was used. **Also normalize the two paths that today use raw labels:** the `7seg` case (`m.digital[this.normPin(b)]`) and the `ledbar` case (same). In `updateOutputs`, replace the hardcoded `mcu.led13 = ...` with:

```ts
const prop = this.board.builtinLedProp ?? "led13";
if (mcu) try { (mcu as Record<string, unknown>)[prop] = (m.digital[this.profile.ledBuiltin] ?? 0) > 0; } catch {}
```

- [ ] **Step 4: Verify.** `pnpm -C robocode-frontend typecheck` passes. Re-run `node scripts/_repro-esp32.mjs`: serial now shows `pot=` ≈ 2047 (default slider 512 scaled to 12-bit), LED still lights. Also run a 5-second variant asserting the ESP32 board's `led1` property toggles when running the shipped ESP32 starter (blink GPIO 2): `page.evaluate(() => document.querySelector("wokwi-esp32-devkit-v1")?.led1)` sampled twice 600ms apart must differ at least once.

- [ ] **Step 5: Commit** in `robocode-frontend` (`fix(sim): board pin aliases + per-board builtin LED property; normalize 7seg/ledbar`) and `robocode-backend` (`fix(sim): ESP32 profile exposes GPIO 1/3/16/17`).

---

### Task 2: Rp2040Engine consumes the shared aliases + LED property

**Files:**
- Modify: `robocode-frontend/src/lib/sim/rp2040-engine.ts`

**Interfaces:**
- Consumes: `BoardDef.pinAliases`, `BoardDef.builtinLedProp` from Task 1.

- [ ] **Step 1:** Delete the local `NANO_RP2040_GPIO` table. Rewrite `normGpio` as an instance method using `this.board.pinAliases` first, then `/^GP?(\d+)$/` / bare number:

```ts
private normGpio(p: string): number | null {
  const ali = this.board.pinAliases?.[p];
  const s = ali ?? p;
  const m = /^GP?(\d+)$/.exec(s) ?? /^(\d+)$/.exec(s);
  return m ? Number(m[1]) : null;
}
```

- [ ] **Step 2:** In `updateOutputs`, drive the board LED via `this.board.builtinLedProp ?? "led13"` (same pattern as Task 1 Step 3) instead of hardcoded `led13`. Keep `LED_BUILTIN = 25`.

- [ ] **Step 3:** `pnpm -C robocode-frontend typecheck` passes. Commit `fix(sim): rp2040 engine uses BoardDef pin aliases + ledBuiltIn property`.

---

### Task 3: Machine analogRead rescale + dead `dac` map removal (parity pair)

**Files:**
- Modify: `robocode-frontend/src/lib/sim/machine.ts` and `robocode-backend/src/sim/machine.ts` (identical edits)
- Modify: `robocode-backend/src/sim/smoke.ts` (new fixture)

- [ ] **Step 1: Failing smoke.** Add to `smoke.ts` an ESP32 fixture: source provider returns 2048 (native 12-bit mid-scale); sketch calls `analogReadResolution(10); Serial.println(analogRead(34));`. Expected today: prints `1023` (clamp bug). Assert the CORRECT value `512` so the fixture fails: `npx tsx src/sim/smoke.ts` → new check FAILS.

- [ ] **Step 2: Fix (both copies).** In `Machine`, add `private nativeAdcMax` set in constructor and `reset()` to `(2 ** (profile?.adcBits ?? 10)) - 1`. Replace `analogRead`:

```ts
analogRead(pin: string): number {
  if (this.analogSources[pin]) {
    const raw = Math.max(0, Math.min(this.nativeAdcMax, Math.round(this.analogSources[pin]())));
    return Math.round((raw * this.adcMax) / this.nativeAdcMax);
  }
  return 0;
}
```

Also delete the `dac` map (its writer `dacWrite` already mirrors into `this.pwm`, which is what renders; keep that mirror; remove `m.dac[p] = v` line in BOTH interpreters and the `dac` field + resets in BOTH machines). Keep `pwmRaw` (smoke reads it) and `touch` (Task 4 makes it addressable).

- [ ] **Step 3: Verify.** `npx tsx src/sim/smoke.ts` all-pass; `bash /Users/marimo/Dev/robocode/scripts/sim-diff-guard.sh` passes; both repos typecheck. Commit both repos (`fix(sim): analogReadResolution rescales instead of clamping; drop dead dac map`).

---

### Task 4: Interpreter/parser fixes (parity pair): BluetoothSerial, T0–T9, builtin map hoist, validatePin sets

**Files:**
- Modify: `robocode-frontend/src/lib/sim/parser.ts` + `robocode-backend/src/sim/parser.ts`
- Modify: `robocode-frontend/src/lib/sim/interpreter.ts` + `robocode-backend/src/sim/interpreter.ts`
- Modify: `robocode-backend/src/sim/smoke.ts`

- [ ] **Step 1: Failing smokes.** Add two fixtures: (a) `BluetoothSerial SerialBT; void setup(){ SerialBT.begin("ESP32"); SerialBT.println("bt-hello"); } void loop(){}` on ESP32 → expect serial contains `bt-hello` (BT prints route to serial in `makeBT`; confirm the actual sink by reading `makeBT` first and assert accordingly); (b) sketch `void setup(){ Serial.begin(115200); Serial.println(touchRead(T3)); } void loop(){}` with `m.touch["15"] = 5` pre-set → expect `5`. Run smoke → both FAIL.

- [ ] **Step 2: Fixes (identical in both copies).**
  - `parser.ts` `CLASS_TYPES`: add `"BluetoothSerial"`.
  - `interpreter.ts` `execVarDecl` `isObjType` regex: add `|BluetoothSerial`; in the object-construction branch return the same object as the `BluetoothSerial` global (extract `this.bt = this.makeBT()` created once in the constructor; `g.define("BluetoothSerial", this.bt)` and VarDecl of that type initializes to `this.bt`).
  - Constants: where `installConstants` defines A0.., add for ESP32-style profiles: `profile?.touchPins.forEach((gpio, i) => g.define(\`T${i}\`, Number(gpio)))`.
  - Hoist the `builtin()` map: build `this.builtins: Record<string, (a: any[]) => any>` once in the constructor; `builtin(name)` becomes `return this.builtins[name] ?? null`.
  - `validatePin`: precompute in constructor `this.pinSets = { out: new Set(p.pins), analog: new Set(p.analogPins), touch: new Set(p.touchPins), dac: new Set(p.dacPins), uart: new Set(p.uarts.flatMap(u => [u.tx, u.rx])) }` and rewrite membership checks with Set.has; `known` also true for uart pins.

- [ ] **Step 3: Verify.** Smoke all-pass; diff-guard passes; both repos typecheck. Commit both repos (`fix(sim): BluetoothSerial decl, T0-T9 constants, builtin map hoist, O(1) validatePin`).

---

### Task 5: Grader board routing (backend + frontend parity) + diff-guard coverage

**Files:**
- Modify: `robocode-backend/src/sim/grader.ts`, `robocode-frontend/src/lib/sim/grader.ts`
- Modify: `/Users/marimo/Dev/robocode/scripts/sim-diff-guard.sh`

- [ ] **Step 1:** In backend `grader.ts`, replace the `board === "esp32" ? ... : ...` ternaries with a registry:

```ts
const PROFILE_BY_BOARD: Record<string, { profile: BoardProfile; name: string } | undefined> = {
  "arduino-uno": { profile: UNO_PROFILE, name: "Arduino UNO R3" },
  uno: { profile: UNO_PROFILE, name: "Arduino UNO R3" },
  esp32: { profile: ESP32_PROFILE, name: "ESP32 DevKit V1" },
};
```

Unknown boards (e.g. `raspberry-pi-pico`) must NOT reach the Arduino parser: return the grader's failure shape with feedback `"Auto-grading for this board isn't available yet — a teacher will review your submission."` (read `GradeResult` in the file and use its exact fields). Mirror the same change into the frontend copy so the files are parity-identical (frontend imports profiles from its own `board-profile.ts` created in Task 6).

- [ ] **Step 2:** Extend `scripts/sim-diff-guard.sh` to also diff `grader.ts` and `board-profile.ts` pairs (follow the script's existing `norm()` filtering conventions for import lines).

- [ ] **Step 3:** Verify: diff-guard passes, both repos typecheck, backend smoke passes. Commit backend, frontend, and the outer repo (guard script).

---

### Task 6: Frontend `board-profile.ts` extraction (single profile source per repo)

**Files:**
- Create: `robocode-frontend/src/lib/sim/board-profile.ts` (content mirrors `robocode-backend/src/sim/board-profile.ts`: `UNO_PROFILE`, `ESP32_PROFILE`, re-export `BoardProfile` type)
- Modify: `robocode-frontend/src/lib/domain/boards.ts` (import profiles instead of inline literals)

- [ ] **Step 1:** Move the two profile literals out of `boards.ts` into the new file, import and attach them in `BOARDS`. Values must equal the backend copy byte-for-byte (including Task 1's added pins).
- [ ] **Step 2:** Typecheck + diff-guard (now covering `board-profile.ts`) pass. Commit frontend.

---

### Task 7: First-party Pico board element (`rc-pi-pico`) + board switch

**Files:**
- Create: `robocode-frontend/src/components/studio/pi-pico-board.tsx`
- Modify: `robocode-frontend/src/components/studio/canvas.tsx` (PartView board branch)
- Modify: `robocode-frontend/src/components/learn/diagram-preview.tsx` (same branch — read the file to find how it renders the board part)
- Modify: `robocode-frontend/src/lib/domain/boards.ts` (`wokwiTag: "rc-pi-pico"` for `raspberry-pi-pico`)

**Interfaces:**
- Produces: React component `PiPicoBoard({ partId }: { partId: string })` registering pinInfo names: `GP0..GP22, GP26, GP27, GP28`, `GND.1..GND.8`, `VBUS, VSYS, 3V3, 3V3_EN, ADC_VREF, RUN, AGND`; exposes boolean property `ledBuiltIn` on its root element (toggles the onboard LED graphic).

- [ ] **Step 1: Component.** Model on `breadboard.tsx`. Geometry: vertical board 120×300 px, USB stub at top, 20 pins per side at `y = 34 + i * 12.6`, left `x = 8`, right `x = 112`. Pin order top→bottom — left: `GP0 GP1 GND.1 GP2 GP3 GP4 GP5 GND.2 GP6 GP7 GP8 GP9 GND.3 GP10 GP11 GP12 GP13 GND.4 GP14 GP15`; right: `VBUS VSYS GND.5 3V3_EN 3V3 ADC_VREF GP28 AGND GP27 GP26 RUN GP22 GND.6 GP21 GP20 GP19 GP18 GND.7 GP17 GP16`. Render: dark-green rounded rect, gold pads, silkscreen labels (6px font), RP2040 chip square, "Raspberry Pi Pico" label, and an LED rect near the USB stub. Implement the LED property in the mount effect:

```tsx
const ledRef = React.useRef<SVGRectElement | null>(null);
React.useEffect(() => {
  const el = ref.current as (HTMLDivElement & { pinInfo?: ElementPin[]; ledBuiltIn?: boolean }) | null;
  if (!el) return;
  el.pinInfo = PINS;
  let lit = false;
  Object.defineProperty(el, "ledBuiltIn", {
    configurable: true,
    get: () => lit,
    set: (v: boolean) => { lit = !!v; if (ledRef.current) ledRef.current.style.fill = lit ? "#7CFC7C" : "#2a3a2a"; },
  });
  registerPartEl(partId, el);
  return () => unregisterPartEl(partId);
}, [partId]);
```

- [ ] **Step 2: Wire into renderers.** In `canvas.tsx` `PartView` board branch and in `diagram-preview.tsx`'s equivalent: if the resolved tag is `rc-pi-pico`, render `<PiPicoBoard partId={part.id} />`. Set `wokwiTag: "rc-pi-pico"` in `boards.ts`.

- [ ] **Step 3: Verify visually.** Playwright: open `/studio/new?mode=robotics&lang=micropython&board=raspberry-pi-pico`, screenshot, confirm the Pico renders with pins and the starter (blink `Pin(25)`) toggles `ledBuiltIn` while running (sample the property twice 700ms apart after `ready`). Typecheck passes. Commit frontend (`feat(studio): first-party rc-pi-pico board element with real GP pin labels`).

---

### Task 8: Pico input correctness — boot buffering, defaults, button polarity (both engines)

**Files:**
- Modify: `robocode-frontend/src/lib/sim/rp2040.worker.ts`, `rp2040-engine.ts`, `engine.ts`, `netlist.ts`

- [ ] **Step 1: Worker buffers pre-ready input.** Add `let pendingInput: Extract<Rp2040InMessage, { type: "input" }> | null = null;`. In `applyInput`: when `halted` return; when `!chip` set `pendingInput = msg; return;`. In `onReady` (inside `bootChip` options callback in `init`), after posting `ready`: `if (pendingInput) { const p = pendingInput; pendingInput = null; applyInput(p); }`.
- [ ] **Step 2: Engine re-sends on ready.** In `rp2040-engine.ts` `case "ready":` set `this.lastInput = "";` (forces the next 80ms tick to resend the current snapshot).
- [ ] **Step 3: Defaults parity.** In `startInputForwarding` analog branch: `const raw = def.simRole === "potentiometer" ? (this.potValues[part.id] ?? 512) : (this.analogInputs[part.id] ?? 400);`.
- [ ] **Step 4: Button polarity by netlist (both engines).** Export from `netlist.ts`: `const POWER_RE = /^(GND|AGND|5V|3V3|3\.3V|VIN|VCC|VDD|VSS|VBUS|VSYS|AREF|ADC_VREF|EN|RUN|RESET|IOREF|3V3_EN)([.\d]|$)?/i; export const isPowerPin = (p: string) => POWER_RE.test(p); export const isSupplyPin = (p: string) => /^(5V|3V3|3\.3V|VIN|VCC|VBUS|VSYS)/i.test(p);` and use `isPowerPin` in both engines (delete their local `isPower`). Helper in each engine: a button/switch is **active-high** when any of its pins' `netBoardPins` contains a supply pin. InterpreterEngine: `m.digitalSources[pin] = () => (this.pressed[id] ? (activeHigh ? 1 : 0) : (activeHigh ? 0 : 1));` Rp2040Engine: `gpioInputs[g] = activeHigh ? !!this.pressed[part.id] : !(this.pressed[part.id] ?? false);`
- [ ] **Step 5: Verify.** New `scripts/_repro-pico.mjs` (clone the ESP32 repro): Pico board, pot on `GP26`, button `1.l→GP14`, `2.r→3V3` (active-high, matching the lesson's PULL_DOWN wiring), code:

```python
from machine import ADC, Pin
import time
pot = ADC(Pin(26))
btn = Pin(14, Pin.IN, Pin.PULL_DOWN)
while True:
    print("pot=", pot.read_u16(), " btn=", btn.value())
    time.sleep(0.4)
```

Expected after boot (~10–20s): `pot=` ≈ 32768 (default 512 → mid-scale, ±2%), `btn= 0` (not pressed, active-high). Commit frontend.

---

### Task 9: Pico worker robustness — fetch checks, per-bus displays, DIN skip, NaN guard, teardown symmetry

**Files:**
- Modify: `robocode-frontend/src/lib/sim/rp2040.worker.ts`, `rp2040-protocol.ts`, `rp2040-engine.ts`, `rp2040-boot.ts`, `scripts/rp2040-smoke.ts`

- [ ] **Step 1: fetch guards.** `const fetchBin = async (url: string) => { const r = await fetch(url); if (!r.ok) throw new Error(\`Failed to load \${url} (HTTP \${r.status})\`); return r.arrayBuffer(); };` use for uf2 + bootrom (and the wasm fetch inside `buildLittleFsImage` if it lives in our code — check `rp2040-boot.ts`).
- [ ] **Step 2: Display bus accuracy + collision.** `DisplaySpec` gains `bus?: 0 | 1`. Engine (`buildDisplaySpecs`): resolve the part's `SDA` pin via netlist → GPIO → bus (`I2C0` SDA gpios 0,4,8,12,16,20; `I2C1` SDA gpios 2,6,10,14,18,26; SCL respectively +1); unresolvable → leave `bus` undefined. Worker: build `const byBusAddr: [Map<number, I2cDecoder>, Map<number, I2cDecoder>]`; a spec with `bus` set installs only there, undefined installs on both; on collision (same bus+address) keep the FIRST and `post({type:"serial", line:"note: two displays share I2C address 0x.. on the same bus — only the first responds."})`. Route `onConnect` through the right map per controller index.
- [ ] **Step 3: DIN skip + NaN guard.** In the 30-pin listener loop: `const dinPins = new Set(msg.neopixels.map(s => s.din)); if (dinPins.has(n)) continue;`. Engine single-neopixel case: `if (pix.length >= 3) { ... }`.
- [ ] **Step 4: Teardown symmetry.** `stop()` in the engine: drop the dead `postMessage({type:"stop"})` (terminate-only), and in `teardown()` reset visuals: iterate `this.diagram.parts`, and for each element set `el.value = false; el.brightness = 0; el.hasSignal = false;` in try/catch (same as InterpreterEngine.resetVisual — extract a shared `resetPartVisual(partId)` helper into `engine.ts` and use in both engines). Also share the tone helper: create `robocode-frontend/src/lib/sim/audio.ts` exporting `class ToneMixer { setTone(id: string, freq: number): void; stopAll(): void; close(): void }` (implementation = the existing oscillator code + `this.audio?.close()` in `close()`); both engines replace their private audio code with a `ToneMixer` instance, calling `close()` in stop/teardown.
- [ ] **Step 5: Dedup I2C wiring with the smoke.** Move the bus-callback installation into `rp2040-boot.ts` as `export function attachI2cDecoders(rp2040: RP2040, byBusAddr: [Map<number, I2cDecoder>, Map<number, I2cDecoder>]): void` and use it from both the worker and `scripts/rp2040-smoke.ts`.
- [ ] **Step 6: Verify.** `npx tsx scripts/rp2040-smoke.ts` passes; `_repro-pico.mjs` still passes; typecheck. Commit frontend.

---

### Task 10: Pico servo angle + OLED/input efficiency

**Files:**
- Modify: `robocode-frontend/src/lib/sim/rp2040-boot.ts`, `rp2040-engine.ts`

- [ ] **Step 1: Frequency-aware PWM decode.** In `rp2040-boot.ts` add alongside `decodePwmDuty`:

```ts
/** PWM frequency in Hz for a GPIO in PWM mode, from DIV (8.4 fixed-point) + TOP. */
export function decodePwmFreq(rp2040: RP2040, gpioNum: number): number | null {
  if (rp2040.gpio[gpioNum]?.functionSelect !== FUNCTION_PWM) return null;
  for (const ch of rp2040.pwm.channels) {
    const hit = ch.pinA1 === gpioNum || ch.pinA2 === gpioNum || ch.pinB1 === gpioNum || ch.pinB2 === gpioNum;
    if (!hit) continue;
    const divInt = (ch.div >> 4) & 0xff || 1;
    const divFrac = ch.div & 0xf;
    return 125_000_000 / ((divInt + divFrac / 16) * (ch.top + 1));
  }
  return null;
}
```

**First verify `ch.div` semantics** by reading `node_modules/rp2040js/dist/esm/peripherals/pwm.js` (`set div` / register write path). If `div` stores the raw register value the code above is right; if it stores a float, use it directly. Prove with a headless probe in `scripts/rp2040-smoke.ts`: MicroPython `PWM(Pin(0)); pwm.freq(50); pwm.duty_u16(4915)` → decoded freq within 49–51 Hz, duty ≈ 0.075.
- [ ] **Step 2: Servo case.** Worker: include freq in the `gpio` message (`pwmFreq: Record<number, number>` alongside `pwm`, same delta-post rule). Engine servo case: if `freq` in 40..400 Hz: `const pulseMs = duty * (1000 / freq); const angle = Math.max(0, Math.min(180, ((pulseMs - 0.5) / 2.0) * 180)); el.angle = angle;` else leave unset (keeps the documented deferral for non-servo frequencies).
- [ ] **Step 3: OLED expansion at message time.** Move the framebuffer→`ImageData` loop from `updateOutputs` into the `case "display"` handler (store `ImageData` in `displayState`); the `oled` render case just assigns the stored reference.
- [ ] **Step 4: Memoized input mapping.** Cache `partId -> { gpio: number | null, ch: number | null, role: string }` the first time `getPinInfo(part.id)` returns non-empty; replace the per-tick `JSON.stringify` comparison with a cheap string key built from the numeric values.
- [ ] **Step 5:** Smoke + repro + typecheck pass. Commit frontend (`feat(sim): pico servo angle from real PWM freq; display/input hot-path efficiency`).

---

### Task 11: Baked-diagram data + scripts repair

**Files:**
- Modify: `robocode-frontend/scripts/repair-diagram-pins.ts`, `robocode-frontend/scripts/bake-diagrams.ts`
- Create: `robocode-frontend/scripts/element-pins.ts` (shared real-pin tables)
- Modify: `robocode-backend/prisma/baked-diagrams.ts` (export `bakedKey`)
- Modify: `robocode-backend/prisma/content/generated/baked-diagrams.json` (via scripts below)
- Create: `robocode-frontend/scripts/add-pico-diagrams.ts` (one-off)

- [ ] **Step 1: gpioOf fix.** Delete the broken first loop in `gpioOf` (its `return null` fires for every part↔mcu wire, making the real loop unreachable). Keep only the second loop.
- [ ] **Step 2: Data fixes.** `sensor-tilt` entry: rewire `tilt-switch-1:OUT` from `mcu:2` → `mcu:3` (lesson `TILT_PIN = 3`). `pico-blink` entry: `mcu:D2` → `mcu:GP25`. Do these by running the fixed repair script (update `BOARD_PINS["raspberry-pi-pico"]` to the new rc-pi-pico names `GP0..GP28, GND.1..GND.8, VBUS, VSYS, 3V3, 3V3_EN, ADC_VREF, RUN, AGND`, and replace `GPIO_TO_NANO` with `const gpioToPico = (n: string) => \`GP\${n}\`` for numeric pins) — verify the emitted JSON diff shows exactly those two wire changes plus no other regressions (`git -C robocode-backend diff prisma/content/generated/baked-diagrams.json`).
- [ ] **Step 3: Shared tables + key.** Move `BOARD_PINS`/`COMP_PINS`/`fixBoardPin` into `scripts/element-pins.ts`; import from both scripts. In `robocode-backend/prisma/baked-diagrams.ts` export `export const bakedKey = (lessonSlug: string, code: string) => \`\${lessonSlug}:\${sha1(code)}\`` (move the sha1 helper there) and use it in `bake-diagrams.ts` (which already imports backend modules) and in the seed-merge path.
- [ ] **Step 4: Bake-time validation.** In `bake-diagrams.ts`: feed the AI the REAL element pin names (from `element-pins.ts`) instead of `boards.ts` gpio labels, and extend `sanitize()` to run every `mcu:` wire endpoint through `fixBoardPin`, dropping the diagram (with a console warning) if any endpoint still fails.
- [ ] **Step 5: Restore the two excluded Pico diagrams.** Remove `pico-button-adc`/`pico-pwm-servo` from `EXCLUDE`. Write `scripts/add-pico-diagrams.ts`: import the two lessons' code strings from `robocode-backend/prisma/content/robo-pico.ts` exports (read the file; the code constants are `BUTTON_ADC_CODE` and `PWM_SERVO_CODE` — export them if not already), compute keys with `bakedKey`, and insert hand-authored entries:
  - `pico-button-adc`: parts `mcu(__board__:raspberry-pi-pico)`, `pushbutton btn-1`, `potentiometer pot-1`; wires `btn-1:1.l→mcu:GP14`, `btn-1:2.r→mcu:3V3`, `pot-1:SIG→mcu:GP26`, `pot-1:VCC→mcu:3V3`, `pot-1:GND→mcu:GND.1`.
  - `pico-pwm-servo`: parts `mcu`, `led led-1`, `resistor r-1`, `buzzer bz-1`, `servo servo-1`; wires `led-1:A→r-1:1`, `r-1:2→mcu:GP15`, `led-1:C→mcu:GND.3`, `bz-1:1→mcu:GP16`, `bz-1:2→mcu:GND.3`, `servo-1:PWM→mcu:GP0`, `servo-1:V+→mcu:VBUS`, `servo-1:GND→mcu:GND.1`.
  Use the repair script's positioning convention (board left at x≈120,y≈40; components column right, 150px vertical spacing). Run the script, then the repair validation pass — 18 entries, 0 problems.
- [ ] **Step 6: bake-schema-smoke must not destroy committed data.** `scripts/bake-schema-smoke.ts` runs the real baker `--mock --force --only intro-robotics` against the committed `baked-diagrams.json` and never restores it. Add backup/restore exactly like `seed-merge-smoke.ts` does (copy the JSON to a temp path before the run, restore in a `finally`). Verify: run the smoke, then `git -C robocode-backend status --short prisma/content/generated/` shows no modification.
- [ ] **Step 7:** Typecheck both repos; commit frontend + backend (`fix(content): repair tilt/pico wiring data; bake validates real element pins; restore 2 pico diagrams`).

---

### Task 12: Studio hardening — diagram URL sanitization + robust sim start

**Files:**
- Create: `robocode-frontend/src/lib/studio/sanitize-diagram.ts` (move `sanitizeDiagram` out of `run-validation.ts`, export it; keep a re-export or update imports)
- Modify: `robocode-frontend/src/app/studio/[projectId]/page.tsx`, `robocode-frontend/src/lib/sim/use-simulation.ts`, `robocode-frontend/src/lib/sim/engine.ts` (SimEngine cleanup)

- [ ] **Step 1:** `/studio/new?diagram=` path: after `decodeStudioDiagram`, run the decoded value through `sanitizeDiagram` (unknown part types dropped, ids containing `:` re-generated, single `mcu` head enforced, `props` restricted to primitives) before casting to `Diagram`. Remove the `as unknown as Diagram` force-cast.
- [ ] **Step 2:** `use-simulation.ts`: wrap `createEngine` AND `eng.start()` in one try/catch; on any throw: `appendSerial("⛔ " + message)`, `setRunning(false)`, `setActiveEngine(null)`, `engineRef.current = null`. Keep the `SimUnsupportedEngineError` message path.
- [ ] **Step 3:** Remove the unused `machine?: Machine` member from `SimEngine` (and its comment; keep `InterpreterEngine.machine` concrete).
- [ ] **Step 4: No engine leak on double-Run.** In `use-simulation.ts` `start()`, first line: `if (engineRef.current) { engineRef.current.stop(); engineRef.current = null; }` — rapid double-click on Run must not orphan a live engine (for Pico that's a Web Worker running a full emulator that nothing can stop).
- [ ] **Step 5: DiagramPreview registry collisions.** `src/components/learn/diagram-preview.tsx` registers parts in the module-global pin registry under bare ids (`mcu`, `led-1`) that every baked diagram reuses — two diagram blocks on one lesson page overwrite each other, and unmount kills the survivor's lookups. Namespace: generate `const ns = React.useId()` in the preview, register/look up parts as `${ns}${part.id}` everywhere inside the preview (the sim engines never touch preview registrations, so this is self-contained).
- [ ] **Step 6:** Typecheck; repro scripts still pass; commit frontend.

---

### Task 13: Backend/scripts cleanups

**Files:**
- Modify: `robocode-backend/prisma/seed.ts` (drop `isDirectRun` guard → unconditional `main()`), `robocode-backend/prisma/seed-merge-smoke.ts` (fix stale header comment), `robocode-backend/src/sim/smoke.ts` (delete the tautological "pico unsupported routing" fixture)
- Modify: `robocode-frontend/src/lib/domain/components.ts` (export `DEFAULT_I2C_ADDRESS: Record<"lcd" | "oled", number> = { lcd: 0x27, oled: 0x3c }`), `robocode-frontend/src/components/studio/inspector.tsx` + `robocode-frontend/src/lib/sim/rp2040-engine.ts` (consume it; also fix the address parse: `const parsed = parseInt(raw.trim(), raw.trim().toLowerCase().startsWith("0x") ? 16 : /^[0-9]+$/.test(raw.trim()) ? 10 : 16);` — bare hex like "3C" parses as hex, and `parseInt("zz") → NaN → default` still holds)
- Modify: `robocode-frontend/src/lib/studio/open-in-studio.ts` + `robocode-frontend/src/components/learn/lesson-body.tsx` + `robocode-frontend/scripts/bake-diagrams.ts` (single `BakedDiagram` type: keep the declaration in `open-in-studio.ts`, import it in the other two)

- [ ] **Step 1:** Apply all edits above. Backend smoke passes (minus the deleted fixture), seeds still run: `pnpm -C robocode-backend db:seed` completes against the local DB.
- [ ] **Step 2:** Typecheck both repos; commit each repo touched.

---

### Task 14: Mobile parity — diagram blocks, board-aware Studio links, small perf

**Files:**
- Modify: `robocode-mobile/lib/models/content.dart`, `robocode-mobile/lib/widgets/rich_content.dart`, `robocode-mobile/lib/studio/open_in_studio.dart`, `robocode-mobile/lib/screens/projects/project_detail_screen.dart`

- [ ] **Step 1: Model.** `CodeBlock` gains `final String? board;` (parse `item['board']`). New `DiagramBlock { final String board; final String code; final Map<String, dynamic> diagram; }` parsed from `type == 'diagram'` (fields per backend `diagramBlock(...)` — read `robocode-backend/prisma/baked-diagrams.ts` for the exact emitted shape before coding).
- [ ] **Step 2: studioHref parity with web.** Port the web logic: `const roboticsBoards = {'arduino-uno', 'esp32', 'raspberry-pi-pico'};` signature `studioHref(String language, String code, {String? board, Map<String, dynamic>? diagram})`; mode=robotics when `board ∈ roboticsBoards` OR language == 'arduino'; pass `board` through; when a diagram is given and its base64url encoding ≤ 16000 chars, append `&diagram=`. Update the call site in `rich_content.dart` to pass `block.board`.
- [ ] **Step 3: Render diagram blocks.** In `rich_content.dart`, `DiagramBlock` renders a card: bolt icon + "Wiring diagram" + component count + a "View in Studio" button opening `studioHref(languageForBoard, block.code, board: block.board, diagram: block.diagram)` in the Studio WebView (same navigation as the existing Open-in-Studio button).
- [ ] **Step 4: Perf.** `project_detail_screen.dart` `_load()`: start `_loadPreview()` and `_loadWall(reset: true)` BEFORE `await`ing detail. `rich_content.dart`: build the `MarkdownStyleSheet` once per `build()` and pass it to `_block`/`_Callout`.
- [ ] **Step 5: Due-date timezone fix.** `lib/screens/teacher/assignments_screen.dart`: the due date is picked as local midnight, sent as `.toUtc()` ISO, then rendered date-only via `due.split('T').first` — in UTC+2 (Harare) every displayed date is one day early. Fix BOTH ends: render with `DateTime.parse(due).toLocal()` formatted date-only, and send the picked date as UTC midnight of the calendar date (`DateTime.utc(y, m, d).toIso8601String()`). Check other date-only renders of the same field (student assignment views) and fix identically.
- [ ] **Step 6: WebView allowlist fallback.** `lib/screens/studio_screen.dart`: navigations to non-allowlisted hosts are Prevented silently. Change: allow only `https:` (or dev `http://localhost`) for in-WebView hosts; for any other host/scheme, `launchUrl(uri, mode: LaunchMode.externalApplication)` (url_launcher is already a dependency — verify in pubspec) and still Prevent in-WebView. External links then open in the browser instead of dying.
- [ ] **Step 7:** `flutter analyze` clean. Commit mobile (`feat(learn): render baked wiring diagrams + board-aware studio links; fix: due-date TZ, WebView external links; perf: parallel detail loads, shared markdown stylesheet`).

---

### Task 15: Full verification sweep

- [ ] `pnpm -C robocode-frontend typecheck && pnpm -C robocode-backend typecheck && (cd robocode-mobile && flutter analyze)`
- [ ] `bash scripts/sim-diff-guard.sh` (outer repo) — passes with the extended pair list.
- [ ] `npx tsx robocode-backend/src/sim/smoke.ts` — all fixtures pass (incl. new analogReadResolution, BluetoothSerial, T3 fixtures).
- [ ] `npx tsx robocode-frontend/scripts/rp2040-smoke.ts` — passes (incl. the new 50 Hz PWM freq probe).
- [ ] Dev servers up → `node robocode-frontend/scripts/_repro-esp32.mjs` (LED on, pot≈2047, 7seg segments light, board `led1` blinks) and `node robocode-frontend/scripts/_repro-pico.mjs` (board `ledBuiltIn` blinks, pot≈32768 immediately after ready, active-high button reads 0/1 correctly).
- [ ] Delete the temporary `_repro-*.mjs`? **No** — rename to `scripts/repro-esp32.mjs` / `repro-pico.mjs` and commit them as regression harnesses (they're the only end-to-end wiring tests).
- [ ] Commit any stragglers per repo.
