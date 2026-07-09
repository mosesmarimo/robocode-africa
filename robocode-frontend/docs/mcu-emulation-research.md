# MCU & SBC Emulation Research — ESP32 and Raspberry Pi

**Date:** 2026-06-22
**Question:** How do we correctly emulate ESP32 and Raspberry Pi, using Arduino and Pico as references?

---

## TL;DR / Bottom line

1. **The current "Arduino/Pico emulation" is not real CPU emulation.** `avr8js` and `rp2040js` are listed in `package.json` but **never imported**. *Every* board — Uno, ESP32, Pico — runs through a hand-written **high-level Arduino-language JavaScript interpreter** (`robocode-frontend/src/lib/sim/`: `lexer → parser → interpreter → machine`). Pin states are plain JS objects synced to the wiring diagram through a netlist. `mcuTarget` (`"avr8js" | "esp32" | "rp2040js"`) exists on each board but is **never read at runtime**.

2. **So the real "reference" is an API-level interpreter, not silicon emulation** — and the architecturally consistent way to "emulate" ESP32 and Pi is the *same* high-level pattern, not heavyweight CPU/Linux emulation:
   - **ESP32 → extend the interpreter** with the Arduino-ESP32 API surface + the correct ESP32 pin map (client-side, instant, diagram-syncable). There is **no client-side ESP32 CPU core in existence** — Wokwi's is proprietary; Espressif's QEMU is server-side only and can't expose pin state without C patching.
   - **Raspberry Pi (Linux) → don't emulate Linux.** Run the student's **real Python in Pyodide** against **gpiozero's built-in mock backend** (`MockFactory`) plus an `RPi.GPIO` shim, piping pin states to the diagram. This is how Trinket, PiForge, and withcode already do it.

3. **If we want *real* emulation anywhere, the Pico is the one place it's genuinely feasible.** `rp2040js` boots the **real MicroPython firmware** and has a clean GPIO listener API ideal for diagram sync. It's currently unused; wiring it up is real but bounded work — and operationally simpler than AVR (no per-run compile server).

---

## 1. What the codebase does today (the reference architecture)

**Run path:** "Run" → `use-simulation.ts` builds a `SimEngine(diagram, sketch)` → `engine.ts` creates an `Interpreter` → `interpreter.ts` `*run()` generator executes `setup()` once then `loop()` forever, calling `machine.advance(1)` per iteration and `yield`ing on `delay()`.

**No hardware emulation.** Arduino C++ / MicroPython is parsed to an AST and walked as JavaScript. There is **no compile step, no machine code, no CPU core**. The `Machine` class (`machine.ts`) is a state bag:

```ts
digital, pwm, modes, tones, servoAngle: Record<string, …>   // board pin → value
analogSources, digitalSources, pulseProviders: Record<string, () => number>  // inputs
displays[], neopixels[], virtualMs
```

**Diagram sync (the integration contract any engine must satisfy):**
- `netlist.ts` `resolveNetlist(diagram)` union-finds wires + breadboard rails + resistor passthrough → `boardPinOf(ref)`.
- On every interpreter yield, `engine.ts` `updateOutputs()` reads `machine.digital/pwm/servoAngle/tones/neopixels/displays` and writes them to the on-canvas Wokwi web-components via DOM props (`wokwi-part.tsx`): LED `value/brightness`, servo `angle`, LCD `text`, buzzer Web-Audio, etc.
- Inputs flow back via `analogSources`/`digitalSources`/`pulseProviders` callbacks, driven by `sim-overlay.tsx` (pot sliders, button presses, ultrasonic distance).
- Pin normalization: `normPin` strips the `D` from ESP32-style `"D13"` so code that uses `"13"` matches.

**ESP32 today:** selecting `esp32` sets `mcuTarget:"esp32"` (unread) and `wokwiTag:"wokwi-esp32-devkit-v1"` (visual only). The **same generic interpreter** runs; pins are just string labels with **no validation** that a pin exists on the board.

**Files:** `src/lib/sim/{engine,machine,interpreter,parser,lexer,netlist,use-simulation,active,grader}.ts`, `src/components/studio/{sim-overlay,wokwi-part}.tsx`, `src/lib/domain/boards.ts`. The backend mirrors `machine/interpreter/parser/lexer/grader` under `robocode-backend/src/sim/` for headless grading.

---

## 2. ESP32 emulation — findings

- **No client-side ESP32 core exists, open or closed.** Wokwi's ESP32 emulator is a **proprietary, from-scratch WASM** core (not in their GitHub org, which only open-sources `avr8js` and `rp2040js`). It runs client-side but is **not self-hostable** except via their licensed VS Code extension / cloud API.
- **Espressif's QEMU fork** (`github.com/espressif/qemu`) emulates ESP32 (Xtensa LX6), S3, C3 only — **server-side/native, no WASM**. It models CPU/RAM/flash/UART/timers but **not Wi-Fi, BT, I2C, SPI, I2S, RMT, or the GPIO matrix**. Critically, it **does not expose live GPIO pin state externally** — `esp32_gpio.c` has no `qemu_irq` out-lines, and QMP can't read pin levels. Driving a wiring diagram would require **patching the fork in C** (exactly what Wokwi did privately).
- **WASM QEMU in the browser is not viable:** the real effort (`ktock/qemu-wasm`) supports only x86_64/aarch64/riscv64 guests — **no Xtensa**, no `qemu-system-xtensa`.
- **Renode** has only experimental/community ESP32 support (no official board); **Velxio** (open studio) routes ESP32 through **server-side QEMU over WebSocket**, confirming no usable pure-JS Xtensa core.
- **Compile pipeline is feasible server-side:** `arduino-cli compile --fqbn esp32:esp32:esp32` against `esp32-arduino-libs` → merge to a flash image with `esptool merge-bin --pad-to-size` → `qemu-system-xtensa`. Warm-container builds are ~3–6 s. (Only needed for the real-firmware path.)

**Options:**
| Option | What | Fidelity | Effort | Browser? |
|---|---|---|---|---|
| **A. Server-side QEMU** | compile firmware + run QEMU, stream UART | High CPU; **low wiring** (no pin state w/o C patch); no Wi-Fi | High | streamed |
| **B. WASM QEMU in browser** | — | — | — | **Not viable (no Xtensa)** |
| **C. High-level Arduino-ESP32 API interpreter** | model `pinMode/digitalWrite/analogWrite(LEDC)/Serial/Wire/SPI/WiFi-stubs` in JS, drive diagram directly | Low at silicon, **high at "does my sketch behave on the diagram"** | Medium, fully in our control | **Yes, client-side** |

**Recommendation: Option C** — and note it's exactly what the codebase already does. The work is to add ESP32 pin/peripheral awareness (correct pin set, LEDC PWM channels, ADC pins, `touchRead`, `Serial2`, `WiFi`/`BluetoothSerial` stubs) and validate pins against the board. Keep **Option A on the shelf** as a future "advanced / real firmware + serial console" mode.

---

## 3. Raspberry Pi (Linux SBC) emulation — findings

- **Full Pi-in-browser is a non-starter.** `qemu-wasm` can boot a `raspi3ap` BusyBox demo, but: TCG is ~12–18× slower under WASM, **~2.3 GB RAM reserved**, **20 s–minutes** to a shell, and Pi OS images are hundreds of MB to GBs. Fails every Chromebook constraint. `v86` is x86-only (no ARM).
- **QEMU `raspi` machines** (`raspi0…raspi4b`, no Pi 5) boot real ARM Linux and **do model the BCM283x GPIO controller**, but the model is **output-biased** — input reads, pull-ups, edge interrupts, and **PWM** are effectively unmodeled (bad for LED-dimming/button/sensor lessons). And like ESP32, **getting live pin levels out needs C patching** of the `qemu_irq` lines (no QMP pin readout).
- **The realistic path — Pyodide + mocked GPIO:** run the student's **real Python** in **Pyodide** (CPython→WASM; `pyodide-core` ≈ **6.5 MB** compressed, few-second cached start). **gpiozero ships exactly the backend we need:** `gpiozero.pins.mock.MockFactory` — outputs are readable (`led.pin.state`, PWM `0–1`), inputs are driveable (`button.pin.drive_high()`, callbacks fire). A thin `MockPin` subclass that emits on state-change drives the diagram reactively. For low-level code, a small `RPi.GPIO` shim records `setmode/setup/output/input/PWM`.
- **How everyone else does it:** Wokwi = **no full Pi** (Pico only). Trinket Sense HAT = Skulpt + mocked `sense_hat`. PiForge browser = Pyodide + simulated GPIO. withcode = browser Python + mocked GPIO. The dominant pattern is **mock the Python GPIO API + animate a diagram**, not emulate Linux.

| Option | Fidelity | Effort | Chromebook? |
|---|---|---|---|
| a. Full QEMU Linux server-side | High OS, weak GPIO model, needs C patch | High (VM fleet) | streamed |
| b. WASM Linux in-browser | high theory | very high, experimental | **No** |
| **c. Pyodide + mocked gpiozero/RPi.GPIO** | high for logic/API | **Moderate** (runtime + mock exist upstream) | **Yes** |
| d. Code + diagram only, no run | low | low | yes |

**Recommendation: Option (c).** It runs the *actual* libraries kids use on real hardware, loads fast, and matches industry practice. This is an **upgrade** over "code + diagram only" — students get real Python execution with diagram feedback. Keep server-side QEMU only for a future "real Linux shell" curriculum (a different goal from GPIO).

---

## 4. avr8js & rp2040js internals (the real-emulation reference)

**avr8js** — pure-TS **AVR CPU core only**. You feed it **pre-compiled Intel HEX**; it models GPIO (`AVRIOPort`), timers, USART, ADC, SPI, TWI, EEPROM. Drive: `loadHex()` → `new CPU()` → batch `avrInstruction(cpu)` + `cpu.tick()` on a microtask scheduler. Observe pins via `port.addListener((value,old)=>…)` / `port.pinState(i)`; push inputs with `port.setPin()`. **Sketch compilation is a cloud service** (`hexi.wokwi.com/build` = `arduino-cli` in Docker on Cloud Run) — **not in-browser**. Production path: self-host `arduino-cli`.

**rp2040js** — TS **single-core ARM Cortex-M0+** (no core1/`_thread`), models GPIO, PIO, ADC, DMA, I2C, SPI, UART, PWM, USB. **It boots the real MicroPython UF2** (`mcu.loadBootrom` → `loadUF2()` → `PC=0x10000000` → `Simulator.execute()`):
- **Run MicroPython:** load official `RPI_PICO` MicroPython UF2 (~0.6–1.6 MB, one-time cached). Inject the student's `main.py` via a **LittleFS image** (auto-runs on boot) or paste over **USB-CDC REPL**. ⚠️ **Filesystem is read-only** (flash-write SSI unimplemented) — no runtime `open('x','w')`. Boot to REPL is **a few seconds** in-browser.
- **GPIO readout:** `gpio[n].addListener((state,old)=>…)`, `gpio[n].value` (`GPIOPinState` enum), `gpio[n].setInputValue()` — **same listener shape as avr8js**, so one netlist-sync adapter serves both.

**Effort/fidelity for the Pico:** Option B (real rp2040js MicroPython) is **worth it if authenticity is the goal** — real `machine`/`utime`/PIO/tracebacks a hand interpreter can't match. Costs: ~1 MB firmware, few-second boot, LittleFS-build step, Web Worker, single-core + read-only-FS limits. Because there's **no per-run compile** (unlike AVR), the Pico is the *simplest* real-emulation path to operate.

---

## 5. Recommended architecture for RoboCode

| Board | Recommended engine | Fidelity | Effort | Notes |
|---|---|---|---|---|
| **Arduino Uno** | Keep high-level interpreter (optionally avr8js + self-hosted `arduino-cli` later) | Approximate | — (today) | Real avr8js needs a compile server |
| **ESP32** | **Extend interpreter** w/ Arduino-ESP32 API + ESP32 pin map (Option C) | Approximate, diagram-accurate | **Medium** | No client-side CPU core exists; this matches current arch |
| **Pico** | **Either** keep interpreter **or** integrate **rp2040js** for real MicroPython | Real (rp2040js) | **Medium-High** | The one viable real-emulation path; currently unused |
| **Raspberry Pi** | **Pyodide + gpiozero `MockFactory`** (+ `RPi.GPIO` shim) | Real Python, mocked GPIO | **Medium** | Don't emulate Linux; runs real student code |

**Cross-cutting:** introduce the long-dormant **per-board engine selection** (`mcuTarget` is already on every board but unused) so the studio can route Uno/ESP32 → interpreter, Pico → rp2040js (optional), Pi → Pyodide — all behind the existing netlist/diagram-sync contract.

---

## 6. Implications for earlier decisions

- **"ESP32 approximate"** ✓ confirmed — Option C (extend the interpreter) is both the only client-side option and consistent with the current architecture.
- **"Pico now via rp2040js"** — feasible and high-value, but **note it's brand-new integration**, not flipping a config: rp2040js is currently unused, so this means booting firmware, a LittleFS injector, a Web Worker, and a GPIO→netlist bridge (single-core + read-only FS caveats).
- **"Pi = code + diagram only"** — research surfaces a **strictly better option** for the same audience: **Pyodide + mocked gpiozero** actually *runs* the student's real Python (~6.5 MB) with diagram feedback. Worth reconsidering.

---

## 7. Sources

**ESP32:** espressif/qemu · esp-toolchain-docs/qemu · ESP-IDF QEMU guide · esp32_gpio.c · ktock/qemu-wasm · Wokwi org + ESP32 docs · Velxio · Renode supported-boards · arduino-esp32 · esptool v5.
**Raspberry Pi:** qemu.org/docs/system/arm/raspi · bcm2835_gpio.c · qemu-discuss GPIO/QOM thread · ktock/qemu-wasm demo · v86 · Pyodide (314 release, downloading/deploying) · micropip API · gpiozero pins API + mock.py · Trinket Sense HAT · PiForge · withcode.
**avr8js/rp2040js:** github.com/wokwi/avr8js (+ blog "Simulate Arduino in JavaScript") · github.com/wokwi/rp2040js · micropython.org/download/RPI_PICO · wokwi/littlefs-wasm · rp2040js issues #88/#80/#133 · docs.wokwi.com/guides/micropython.
