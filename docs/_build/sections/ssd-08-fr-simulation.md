# Functional Requirements: RoboCode Simulation Engine (RSE)

## Overview

This section specifies the functional requirements for the **RoboCode Simulation Engine (RSE)** — the real-time, in-browser electronics and microcontroller simulator that is the technical centrepiece of **RoboCode Studio**. The RSE translates a student's circuit schematic and firmware code into a live, interactive simulation of physical electronics hardware, providing immediate visual, audible, and data feedback that reinforces the connection between written code and physical-world outcomes.

The RSE is built upon the open-source Wokwi ecosystem:

- **avr8js** — a WebAssembly-compiled AVR/ATmega328P emulator for the Arduino UNO R3.
- **rp2040js** — a WebAssembly-compiled RP2040 emulator (github.com/wokwi/rp2040js) for the Raspberry Pi Pico; runs real RP2040 firmware (UF2/ELF) in the browser.
- **wokwi-elements** — a set of web components providing high-fidelity component visuals and behavioural hooks.
- **ESP32 core simulation** — an ESP32 execution environment for MicroPython and Arduino-ESP32 sketches.
- **wokwi-boards** — a data-driven board definition format (github.com/wokwi/wokwi-boards) used as the canonical board schema; each board manifest binds to an MCU core target so the simulator knows how to execute firmware for that board.

All functional requirements in this section carry the identifier prefix **FR-SIM-nnn**. Cross-references to other SSD sections are made by name and requirement-ID prefix. Cross-references to user-facing needs use **UR-SIM-nnn** (User Requirements Document — Simulation Experience).

Child safety and data protection remain the prime directive; simulation-level data (circuit schemas, code, serial output) is treated as student personal data subject to the full retention and access-control rules defined in **Functional Requirements: Administration, Analytics and Reporting** and **Security, Privacy and Child Safety**.

---

## Simulation Pipeline

The end-to-end pipeline from student-authored code to rendered simulation output is shown below. All stages execute in-browser unless the compile microservice path is selected.

```
+------------------------------------------------------------------------+
|                    RSE SIMULATION PIPELINE                             |
|                                                                        |
|  +-----------+    +----------------+    +---------------------------+  |
|  |  Student  |    |  Code Editor   |    |  Schematic / Netlist      |  |
|  |  Code     +--->+  (Monaco)      |    |  (Canvas + Wire Layer)    |  |
|  |  (.ino /  |    |  Syntax Check  |    |  JSON circuit descriptor  |  |
|  |  .py /    |    +-------+--------+    +-------------+-------------+  |
|  |  Blocks)  |            |                           |                |
|  +-----------+            |                     +-----v-----------+    |
|                           |                     | BOARD-TARGET    |    |
|                           |                     | ABSTRACTION     |    |
|                           |                     | (wokwi-boards   |    |
|                           |                     |  manifest ->    |    |
|                           |                     |  MCU core bind) |    |
|                           |                     +-----+-----------+    |
|                           v                           v                |
|               +-----------+---------------------------+              |
|               |          COMPILE / TRANSLATE                          |
|               |  Path A (accurate): WASM toolchain or compile         |
|               |    microservice -> ELF/HEX/UF2 firmware binary        |
|               |  Path B (simplified): RVM interpreter/transpiler      |
|               |    -> RVM instruction set (IR)                        |
|               +-----------+--------------------------+                |
|                           |                          |                |
|                           v                          v                |
|          +----------------+------------------+  +---+--------------+ |
|          |    MCU CORE (selected by board)   |  |  RVM EXECUTOR    | |
|          |  avr8js: ATmega328P @ 16 MHz      |  |  Interprets IR,  | |
|          |    (Arduino UNO R3)               |  |  drives pin-     | |
|          |  rp2040js: RP2040 @ 133 MHz       |  |  state           | |
|          |    (Raspberry Pi Pico)            |  |  transitions     | |
|          |  ESP32 core sim: LX6 @ 240 MHz    |  +--------+---------+ |
|          |    (ESP32 DevKit)                 |           |            |
|          +----------------+------------------+           |            |
|                           |                             |             |
|                           +----------+------------------+             |
|                                      |                                |
|                                      v                                |
|               +----------------------+------------------+             |
|               |           PIN STATE BUS                 |             |
|               |  Digital: HIGH/LOW per pin              |             |
|               |  Analog: 0-5V / 0-3.3V voltage          |             |
|               |  PWM: duty cycle 0-255 / 0-65535        |             |
|               |  Bus protocols: I2C/SPI/UART frames     |             |
|               +-------+------+-------+-------+----------+             |
|                       |      |       |       |                        |
|             +---------v-+ +--v----+ +v-----+ +v----------+           |
|             | LED/Display| |Motor/ | |Sensor| |Audio      |           |
|             | Component  | |Servo  | |Input | |WebAudio   |           |
|             | Models     | |Models | |Models| |Buzzer Tone|           |
|             +-----+------+ +--+----+ +------+ +-----+-----+           |
|                   |           |                     |                 |
|                   v           v                     v                 |
|          +--------+-----------+---------------------+--------+        |
|          |               RENDER LAYER                        |        |
|          |  2D: wokwi-elements web components (SVG/Canvas)   |        |
|          |  3D: Three.js + React Three Fiber (WebGL2)        |        |
|          |  Serial Monitor stream | Pin State Inspector      |        |
|          |  Logic Analyzer / Oscilloscope | Simulation Log   |        |
|          +---------------------------------------------------+        |
+------------------------------------------------------------------------+
```

---

## Electrical Netlist Construction

The RSE derives its understanding of the circuit from the canonical circuit descriptor produced by RoboCode Studio's canvas and wiring layer (see **Functional Requirements: RoboCode Studio IDE**).

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-001 | The RSE **shall** accept the canonical circuit descriptor — a JSON document containing component instances, pin assignments, net connections, and property overrides — as its sole authoritative source of circuit topology. | Must | Format: documented JSON schema versioned with the RSE release. Validated against the JSON Schema before simulation start. |
| FR-SIM-002 | The RSE **shall** construct an in-memory electrical netlist from the circuit descriptor, resolving every net to its connected pins across all component instances, breadboard tie-points, and jumper wires. | Must | Breadboard connectivity matrix (5-tie-point rows, bus rails) must be correctly resolved so that breadboard-routed connections are equivalent to direct wire connections. |
| FR-SIM-003 | The netlist builder **shall** validate the resolved netlist before simulation start and produce a structured list of electrical warnings (floating pins used as inputs, direct VCC-to-GND shorts, missing current-limiting resistors on LED anodes, motor driver wiring errors) without preventing simulation launch unless a catastrophic short circuit is detected. | Must | Warnings surface as FR-SIM-080 runtime error events. Catastrophic short: same net tied to both VCC and GND with no protective element — halts simulation with a friendly error message. |
| FR-SIM-004 | The RSE **shall** re-validate the netlist on every project load and on demand (when the Student or Teacher explicitly requests a circuit check without running the simulation). | Should | Supports a "Check Circuit" action in the RoboCode Studio toolbar. |
| FR-SIM-005 | The netlist builder **shall** support the full component catalogue defined in the platform canon, mapping each component type to its RSE behavioural model and pin-role assignments. | Must | Unknown component types produce a logged warning and are ignored in simulation; they remain visible on the canvas. |

---

## Microcontroller Execution Model

### Arduino UNO R3 (ATmega328P via avr8js)

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-010 | The RSE **shall** execute compiled AVR firmware (ELF/HEX) on the **avr8js** WebAssembly-compiled ATmega328P emulator, running at a simulated clock rate of 16 MHz. | Must | avr8js version pinned to a tested release; upgrade policy governed by the RSE release process. |
| FR-SIM-011 | The RSE **shall** emulate the full ATmega328P register file, SRAM (2 KB), Flash (32 KB), and EEPROM (1 KB) address spaces as modelled by avr8js. | Must | EEPROM write persistence across reset cycles is Should-level; full wear-level emulation is Won-t (this release). |
| FR-SIM-012 | The RSE **shall** emulate all ATmega328P interrupt vectors and the interrupt controller (SREG I-flag, ISR dispatch, interrupt priority) faithfully, including PCINT, external interrupts (INT0/INT1), Timer/Counter overflow, compare-match, UART RX/TX, TWI, and SPI interrupts. | Must | Interrupt latency shall match the AVR specification (4 clock cycles minimum) as modelled by avr8js. |
| FR-SIM-013 | The RSE **shall** emulate the ATmega328P's Timer/Counter peripherals: Timer0 (8-bit), Timer1 (16-bit), and Timer2 (8-bit), including all waveform generation modes (Normal, CTC, Fast PWM, Phase-Correct PWM) and prescaler configurations used by the Arduino `millis()`, `micros()`, `delay()`, `tone()`, and `analogWrite()` implementations. | Must | `millis()` and `micros()` accuracy shall be within ±1 timer tick at 1× speed. |
| FR-SIM-014 | The RSE **shall** emulate the ATmega328P ADC (10-bit, 6 channels on the UNO) including prescaler, single-conversion and free-running modes, and AVCC/AREF reference voltage selection. | Must | ADC conversion time shall be scaled proportionally with the simulated clock. |
| FR-SIM-015 | The RSE **shall** emulate the ATmega328P TWI (I2C) peripheral in master mode, generating correct start/stop/repeated-start conditions, 7-bit addressing, ACK/NACK signalling, and the multi-byte read/write sequences used by the `Wire` library. | Must | I2C slave-mode emulation is Should-level (needed for RFID and RTC modules that respond as I2C slaves). |
| FR-SIM-016 | The RSE **shall** emulate the ATmega328P SPI peripheral in master mode, including CPOL/CPHA mode configuration, SPI clock divisor settings, and the byte-transfer protocol used by the `SPI` library. | Must | SPI slave mode is Won-t (this release). |
| FR-SIM-017 | The RSE **shall** emulate the ATmega328P USART0 peripheral, including baud-rate generation (via UBRR), TX/RX double-buffer registers, and the framing (8N1 default) used by the Arduino `Serial` object. Baud rates from 300 to 115 200 bps must be supported. | Must | Serial output feeds the Serial Monitor stream (FR-SIM-060). Serial input is driven by the Serial Monitor send control. |
| FR-SIM-018 | The RSE **shall** expose the avr8js `MachineState` interface to allow the step-by-step debugger (FR-SIM-054) to read all CPU registers (R0–R31, PC, SP, SREG) and SRAM at any pause point. | Could | Required only when the step-by-step debug mode (FR-SIM-054) is enabled. |

### ESP32 Core Simulation

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-020 | The RSE **shall** provide an ESP32 core simulation capable of executing MicroPython and Arduino-ESP32 sketches targeting the ESP-WROOM-32 module (Tensilica Xtensa LX6, dual-core, 240 MHz). | Must | Implementation may use a dedicated ESP32 WASM simulation layer or a high-fidelity emulation library; the interface must conform to the RSE Pin State Bus contract. |
| FR-SIM-021 | The ESP32 simulation **shall** support all GPIO pins of the ESP32 DevKit V1 pinout (38 pins), including input-only pins (GPIO 34–39), capacitive touch pins (T0–T9), and ADC channels (ADC1: GPIO 32–39; ADC2: GPIO 0, 2, 4, 12–15, 25–27). | Must | ADC2 pins are unavailable during Wi-Fi use; the simulation shall model this constraint. |
| FR-SIM-022 | The ESP32 simulation **shall** support LEDC (LED Control) PWM output on all PWM-capable GPIO pins with configurable frequency and resolution (1–16 bits). | Must | `analogWrite()` in Arduino-ESP32 uses LEDC; `PWM` in MicroPython maps to LEDC. |
| FR-SIM-023 | The ESP32 simulation **shall** provide stub simulation for Wi-Fi and Bluetooth Low Energy (BLE): connection status and `WiFi.connect()` / `WiFi.begin()` shall return configurable mock success/failure responses; data sent via `WiFiClient` shall be echo-looped or routed to a configurable mock server. Full RF simulation and genuine TCP/IP stack behaviour are out of scope for v1.0. | Must | Stub behaviour configurable via a simulation properties panel. |
| FR-SIM-024 | The ESP32 simulation **shall** support I2C (up to 2 buses), SPI (up to 3 buses), UART (up to 3), and CAN (stub) peripheral emulation with the same fidelity level as the ATmega328P equivalents described in FR-SIM-015 to FR-SIM-017. | Must | Bus instance assignment follows the Arduino-ESP32 `Wire`, `SPI`, and `Serial` library defaults. |

### Raspberry Pi Pico (RP2040 via rp2040js)

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-025 | The RSE **shall** execute compiled RP2040 firmware (UF2 or ELF) on the **rp2040js** WebAssembly-compiled RP2040 emulator (github.com/wokwi/rp2040js), simulating a dual-core ARM Cortex-M0+ at 133 MHz with 264 KB SRAM and 2 MB QSPI flash. | Must | rp2040js version pinned to a tested release; upgrade policy governed by the RSE release process. Supported firmware languages: MicroPython, CircuitPython, and C/C++ (Arduino-Pico core / Pico SDK). |
| FR-SIM-026 | The RP2040 simulation **shall** expose all 26 multifunction GPIO pins available on the Raspberry Pi Pico 40-pin header (GP0–GP28), correctly modelling their input/output direction, pull-up/pull-down configuration, and 3.3 V logic levels. The three ADC-capable pins (GP26/GP27/GP28) and the internal temperature sensor ADC channel shall be emulated with 12-bit resolution. | Must | Pin state published to the RSE Pin State Bus in the same manner as avr8js and ESP32 core. ADC voltage range: 0–3.3 V. |
| FR-SIM-027 | The RP2040 simulation **shall** emulate the following RP2040 peripheral blocks at functional fidelity: 2× UART, 2× SPI, 2× I2C, 16 PWM channels (all PWM-capable GPIO), and USB 1.1 (serial CDC stub for Serial Monitor). The 8 PIO state machines **shall** be emulated at instruction-execution level sufficient for WS2812/NeoPixel and common PIO-based protocols. | Must | PWM channels exposed via the Pin State Bus as duty cycle values. USB CDC stub routes to the Serial Monitor stream (FR-SIM-090). Full PIO cycle-accurate emulation of arbitrary custom PIO programs is Should-level; standard Wokwi-tested PIO programs must pass. |
| FR-SIM-028 | The RP2040 simulation **shall** emulate the dual-core nature of the RP2040 to the extent that `multiprocessing` (MicroPython) and `multicore_launch_core1` (Pico SDK) calls execute on a simulated second core with independent register state, sharing SRAM via the rp2040js inter-core FIFO model. Pico W (CYW43439 Wi-Fi/BLE) support is a roadmap item and is out of scope for v1.0. | Should | Full cycle-accurate dual-core race-condition modelling is Won-t (this release); educational correctness (both cores advance, FIFO synchronisation works) is the target. |

### Board-Target Abstraction

The board-target abstraction decouples the active board definition from the MCU core selection, enabling data-driven addition of new boards without code changes.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-029 | The RSE **shall** implement a **board-target abstraction layer** that reads the active board's manifest (in **wokwi-boards** format: github.com/wokwi/wokwi-boards) and uses the manifest's declared `mcu` target field to select the correct MCU core at simulation start: `avr8js` for ATmega-family boards, `rp2040js` for RP2040-family boards, and the ESP32 core for ESP32-family boards. | Must | Selecting an unrecognised MCU target halts simulation with a descriptive error. The three first-class boards (Arduino UNO R3, Raspberry Pi Pico, ESP32 DevKit) are pre-bundled using the standard wokwi-boards definitions. |
| FR-SIM-036 | The RSE **shall** accept custom board definitions uploaded by platform admins or approved users in the wokwi-boards manifest format. A board manifest consists of a `board.json` file declaring the board name and a pin list (each pin with `name`, `type` — one of `power`, `ground`, `gpio`, `analog`, `i2c`, `spi`, `uart` — and `x`/`y` position) together with an SVG visual asset. No RSE code change is required to add a board. | Must | Custom definitions are validated against the wokwi-boards JSON schema and an SVG/asset safety check before being stored. Non-admin uploads pass through the platform moderation/approval workflow before becoming available to learners. |
| FR-SIM-037 | The RSE **shall** ship the standard wokwi-boards library as its built-in board catalogue, covering at minimum: Arduino Uno, Arduino Nano, Arduino Mega, the ESP32 DevKit family, and the Raspberry Pi Pico. Additional boards from the wokwi-boards repository may be included at the discretion of the RSE release team. | Must | Built-in boards are always available without an approval workflow. |

---

## Simulation Clocking, Timing, and Speed Control

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-030 | The RSE **shall** maintain a simulated clock that advances in lockstep with MCU instruction execution, ensuring that time-dependent operations (PWM, UART baud rate, I2C clock, sensor timing windows) are evaluated against simulated time, not wall-clock time. | Must | Guarantees timing correctness independently of host CPU speed fluctuations. |
| FR-SIM-031 | The RSE **shall** expose a configurable speed multiplier affecting the ratio of simulated clock ticks to real wall-clock time. Supported multipliers: 0.25×, 0.5×, 1× (real-time), 2×, and 4×. | Must | Speed change takes effect within one simulation tick (< 1 ms at 1× real-time) without stopping the simulation. Maps to UR-SIM-080. |
| FR-SIM-032 | When the speed multiplier is less than 1×, all protocol timings (WS2812 bit periods, DHT sensor response windows, HC-SR04 echo pulse width, UART bit periods) **shall** be scaled proportionally so that library timeout thresholds continue to be satisfied at the reduced speed. | Must | Failure to scale would cause library timeout errors at slow speed. Maps to UR-SIM-081. |
| FR-SIM-033 | The RSE **shall** monitor wall-clock CPU utilisation and emit a `RSE_THROTTLE` event to the UI when the host device cannot sustain the requested speed multiplier. The simulation shall downgrade to the highest sustainable speed rather than drop simulation ticks silently. | Should | UI reflects throttle state in the simulation status indicator. Maps to UR-SIM-082. |
| FR-SIM-034 | The RSE **shall** provide a deterministic single-step mode that advances the MCU by exactly one instruction cycle per invocation, holding all component models and pin states constant between steps. | Could | Used by the step-by-step debug feature (FR-SIM-054). Maps to UR-SIM-083. |
| FR-SIM-035 | The RSE **shall** expose a `simulatedMillis()` function returning the number of simulated milliseconds elapsed since the last reset, available to all component models and to the Serial Monitor timestamp subsystem. | Must | Must match the value returned by `millis()` inside the sketch. |

---

## Simulation Lifecycle

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-040 | The RSE **shall** implement the following lifecycle state machine: `STOPPED -> COMPILING -> LOADED -> RUNNING <-> PAUSED`, with transitions driven by explicit user commands and error conditions. | Must | State transitions are atomic; concurrent transition requests are queued and executed in order. |
| FR-SIM-041 | On **RUN**, the RSE **shall**: (1) validate the netlist (FR-SIM-003), (2) invoke the compile/translate pipeline (FR-CODE, see **Functional Requirements: Code Authoring, Validation and Execution**), (3) load the resulting firmware or IR into the MCU core, (4) reset all component models to their power-on state, and (5) begin execution. | Must | Total time from RUN command to first MCU instruction execution: target < 3 s for a typical 32 KB sketch with WASM toolchain; < 500 ms for RVM path. |
| FR-SIM-042 | On **PAUSE**, the RSE **shall** freeze the MCU clock, halt all component model state machines, preserve the complete CPU state (registers, SRAM, PC, SP, SREG, all peripheral registers), and notify all registered render hooks to freeze. | Must | Resume from PAUSE must restore execution from the exact suspended instruction. Maps to UR-SIM-002. |
| FR-SIM-043 | On **STOP**, the RSE **shall** halt execution, de-energise all component outputs (set all driven pins to LOW/0 V, stop PWM output, silence audio, stop motor/servo animation), and transition to STOPPED state. The Serial Monitor log and simulation log **shall** be preserved. | Must | Maps to UR-SIM-003. |
| FR-SIM-044 | On **RESET**, the RSE **shall** emulate a hardware reset: re-initialise all MCU registers and SRAM, restore all component models to power-on state, restart execution from the MCU reset vector (address 0x0000 for AVR; ARM reset vector for RP2040 and ESP32), and clear runtime error state. The schematic and code are not modified. | Must | Reset is available from RUNNING, PAUSED, and STOPPED states. Maps to UR-SIM-004. |
| FR-SIM-045 | The RSE **shall** emit lifecycle events (`rse:run`, `rse:pause`, `rse:stop`, `rse:reset`, `rse:error`) as structured messages on a well-defined internal event bus, allowing the RoboCode Studio UI shell and the Simulation Log subsystem to react. | Must | Event payload includes: event type, simulated timestamp, RSE version, and optional error detail. |
| FR-SIM-046 | The RSE **shall** persist the simulation state (RUNNING/PAUSED/STOPPED) in the browser's session storage so that a page reload within the same session can restore the last-known state. MCU register state is not persisted across reloads; a reload from RUNNING/PAUSED produces a STOPPED state with a user notification. | Should | Prevents accidental data loss of simulation settings on accidental refresh. |

---

## GPIO, PWM, ADC, and Bus Peripheral Emulation

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-050 | The RSE **shall** model each MCU pin as a node on the Pin State Bus with the following observable properties: direction (INPUT / OUTPUT / INPUT_PULLUP), digital state (HIGH / LOW), analog voltage (0.0–5.0 V for UNO; 0.0–3.3 V for ESP32 and Raspberry Pi Pico), and PWM duty cycle (0–255 for AVR; 0–65535 for LEDC / RP2040 PWM). | Must | Pin state is updated synchronously with MCU register writes; component models poll pin state on each simulation tick. |
| FR-SIM-051 | The RSE **shall** correctly resolve conflicting pin drivers (two outputs driving the same net) by detecting the conflict, issuing a netlist warning (FR-SIM-003), and driving the net to a defined error state (e.g., indeterminate) rather than crashing. | Should | Mirrors real-world bus contention; educational warning emitted to Simulation Log. |
| FR-SIM-052 | Pull-up and pull-down resistors (internal MCU pull-ups and discrete resistors on the breadboard) **shall** be modelled as voltage sources that establish the net voltage when no active driver is present; floating inputs shall be flagged as netlist warnings. | Must | Internal pull-up for ATmega328P: ~20–50 kΩ (modelled as mid-range 30 kΩ). |
| FR-SIM-053 | The RSE **shall** propagate I2C, SPI, and UART bus transactions from the MCU core to the addressed component models as discrete protocol frames rather than individual pin toggling, enabling component models to decode commands without cycle-accurate bit-bang simulation where the protocol peripheral is available. | Must | Protocol frame dispatch reduces computational overhead for bus-heavy simulations. |
| FR-SIM-054 | In single-step debug mode (FR-SIM-034), the RSE **shall** expose the current values of all CPU registers (R0–R31, PC, SP, SREG) and the values of all memory-mapped I/O registers for the active MCU in a structured object readable by the Debug panel in the RoboCode Studio UI. | Could | Maps to UR-SIM-083. |

---

## Component Behavioural Models

Component models are the RSE's representation of each physical electronic component. They subscribe to pin state changes and translate electrical signals into visual and audible output.

### Model Architecture

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-055 | Each component type in the component catalogue **shall** be backed by an RSE component model that: (a) declares its pin interface (name, role, direction, valid voltage range), (b) subscribes to pin-state changes on the Pin State Bus, (c) maintains its own internal state machine, and (d) exposes render-hook callbacks for the visual and audio render layer. | Must | Component model interface: TypeScript interface `RseComponentModel` with methods `onPinChange(pin, state)`, `onTick(simMillis)`, `getRenderState()`. |
| FR-SIM-056 | The RSE **shall** instantiate component models lazily when a component is added to the canvas, and destroy them when a component is removed. Each model instance is bound to a specific component instance ID in the circuit descriptor. | Must | Prevents stale models from interfering with simulation after schematic edits. |
| FR-SIM-057 | Component models **shall** be loadable from the open-source Wokwi component library as the preferred implementation source; custom RSE-specific overrides or additions may extend Wokwi models where the Wokwi implementation is absent or insufficient for the educational fidelity requirements of RoboCode.Africa. | Must | Wokwi source: github.com/wokwi/wokwi-elements and associated simulation packages. |

### LED and Display Models

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-058 | The single LED model **shall** compute luminous brightness as a function of forward-biased current derived from the supply voltage, the connected resistor value, and the LED's modelled forward voltage (≈ 2.0 V red/yellow, ≈ 3.0 V blue/green). Brightness output is a normalised 0–1 float fed to the render hook. | Must | PWM duty cycle maps linearly to effective average current; perceived brightness uses a gamma-correction curve (γ = 2.2). Maps to UR-SIM-010. |
| FR-SIM-059 | The RGB LED model **shall** compute independent brightness values for the R, G, B channels and blend them into an sRGB colour output for the render hook. Common-anode polarity (active LOW) and common-cathode polarity (active HIGH) must both be correctly handled based on the component's `polarity` property. | Must | Maps to UR-SIM-011. |
| FR-SIM-060 | The 7-segment display model (1-digit and 4-digit / TM1637) **shall** decode segment pin states or the TM1637 serial protocol and compute a per-segment on/off state for the render hook. Multiplexed 4-digit scanning must be correctly handled at simulated clock speed. | Must | Maps to UR-SIM-013. |
| FR-SIM-061 | The 8×8 LED matrix (MAX7219) model **shall** implement the MAX7219 SPI register set, decoding scan limit, intensity, decode mode, and display data registers to produce an 8×8 boolean pixel array for the render hook. | Should | Maps to UR-SIM-014. |
| FR-SIM-062 | The HD44780 LCD model (16×2 and 20×4, I2C backpack via PCF8574) **shall** implement the HD44780 instruction set (RS, RW, E, D4–D7 in 4-bit mode), support custom character RAM (CGRAM), and expose a character-grid framebuffer to the render hook. | Must | Maps to UR-SIM-015. |
| FR-SIM-063 | The SSD1306 OLED model (0.96-inch, I2C) **shall** implement the SSD1306 command set, maintain a 128×64 monochrome framebuffer, and expose it to the render hook on each complete page-write sequence. | Must | Maps to UR-SIM-016. |
| FR-SIM-064 | The WS2812/NeoPixel model **shall** decode the WS2812B one-wire protocol (800 kHz bit stream, RESET > 50 µs) at the simulated clock rate, maintain an array of 24-bit RGB pixel values, and expose the array to the render hook. Incorrect bit-timing shall emit a `[RSE WARNING]` to the Simulation Log. | Must | Maps to UR-SIM-017. |
| FR-SIM-065 | The LED bar graph model **shall** map each of its 10 input pins to an independent brightness value and expose a 10-element array to the render hook. | Must | Maps to UR-SIM-012. |

### Actuator Models

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-066 | The SG90 servo model **shall** decode the PWM signal on the signal pin (50 Hz standard servo, 1–2 ms pulse width = 0°–180°) and output a target angle in degrees (0.0–180.0) to the render hook. The model shall apply a slew-rate limit (≈ 100°/s) so that angle transitions animate smoothly. | Must | Maps to UR-SIM-018. |
| FR-SIM-067 | The DC motor model (via L293D / L298N) **shall** decode the EN, IN1, IN2 pin states from the driver IC model to determine direction (CW/CCW/BRAKE/COAST) and derive an estimated RPM from the PWM duty cycle on the EN pin. The motor's direction and normalised speed (0.0–1.0) are exposed to the render hook. | Must | Maps to UR-SIM-019. |
| FR-SIM-068 | The L293D and L298N driver IC models **shall** implement the full truth table for each H-bridge channel, correctly modelling the enable-pin PWM input and the direction-pin logic to produce the per-channel direction and speed outputs consumed by connected DC motor models. | Must | Both single-motor (2 direction pins + 1 enable) and dual-motor configurations must be supported. |
| FR-SIM-069 | The 28BYJ-48 stepper model (with ULN2003 driver) **shall** decode the 4-pin coil sequence from the ULN2003 driver model, advance the rotor position by one step (full-step or half-step, as detected from the sequence pattern), and expose the cumulative step count and direction to the render hook. | Should | Maps to UR-SIM-020. |
| FR-SIM-070 | The relay module model **shall** decode the coil input pin state (active HIGH or active LOW according to the `activeLevel` property), maintain OPEN/CLOSED contact state, and expose state to the render hook and to the Pin State Bus (normally-open and normally-closed output nets update accordingly). | Should | Maps to UR-SIM-022. |
| FR-SIM-071 | The fan actuator model **shall** derive a normalised speed (0.0–1.0) from the PWM duty cycle on its control pin and expose it to the render hook for animation. | Could | Maps to UR-SIM-021. |

### Sensor Input Injection API

The sensor input injection API provides the mechanism by which interactive user controls in the RoboCode Studio canvas feed simulated sensor readings into the RSE, replacing the need for physical stimuli.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-072 | The RSE **shall** expose a typed `SensorInputAPI` interface that allows the RoboCode Studio UI to inject sensor values into named sensor component models at any time during a running or paused simulation. The API call is: `rse.setSensorInput(componentId: string, inputKey: string, value: number \| boolean)`. | Must | API is synchronous from the UI's perspective; the RSE processes the injection on the next simulation tick. |
| FR-SIM-073 | Push button and tactile switch models **shall** accept a boolean `pressed` input via the Sensor Input API, asserting or de-asserting the connected pin accordingly (respecting wired pull-up/pull-down configuration). Long-press duration must be expressible by holding `pressed = true` across multiple API calls. | Must | Maps to UR-SIM-040. |
| FR-SIM-074 | The potentiometer model **shall** accept a normalised `position` value (0.0–1.0) and compute the wiper voltage as `Vcc × position`, updating the connected ADC pin voltage on the Pin State Bus. | Must | Maps to UR-SIM-041. |
| FR-SIM-075 | The HC-SR04 ultrasonic sensor model **shall** accept a `distance_cm` value (2–400) and compute the ECHO pin pulse width as `distance_cm × 58 µs` (round-trip at speed of sound). The pulse is generated as a timed digital HIGH on the ECHO pin immediately after the TRIG pin goes HIGH. | Must | Maps to UR-SIM-043. |
| FR-SIM-076 | The DHT11/DHT22 model **shall** accept `temperature_c` and `humidity_pct` values and serialise them into the DHT single-wire protocol response, replying correctly to the MCU's measurement request sequence. DHT11 range: 0–50 °C, 20–90 %. DHT22 range: −40–80 °C, 0–100 %. | Must | Maps to UR-SIM-044. |
| FR-SIM-077 | The LM35 model **shall** accept a `temperature_c` value and compute `Vout = 10 mV × temperature_c`, updating the connected ADC pin voltage. Valid range: −55 °C to +150 °C. | Must | Maps to UR-SIM-045. |
| FR-SIM-078 | The photoresistor (LDR) model **shall** accept a `lux` value (0–100 000) and compute the resistance using the LDR characteristic curve (resistance ∝ lux⁻⁰·⁷), then compute the voltage-divider output for the ADC pin. | Must | Maps to UR-SIM-046. |
| FR-SIM-079 | Sensor models for PIR, IR receiver/remote, IR obstacle sensor, sound sensor, soil moisture, water level, gas sensor, flame sensor, tilt switch, and rotary encoder **shall** each accept the appropriate input key(s) via the Sensor Input API and translate them to the correct pin-level output as specified in the component catalogue and UR-SIM-047 through UR-SIM-056. | Should | Priority is reduced relative to Must sensors because these appear in more specialised projects. |

---

## Output Rendering Hooks

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-080 | The RSE **shall** notify registered render hook callbacks whenever a component's `getRenderState()` changes, passing the component instance ID and the new render state object. Render hooks are invoked at a target rate of 60 fps (one per `requestAnimationFrame` tick) or at the simulated refresh rate of the component (e.g., LCD ≈ 30 Hz), whichever is lower. | Must | Decouples simulation tick rate from display frame rate; prevents render blocking the MCU loop. |
| FR-SIM-081 | LED brightness and colour render states **shall** be delivered as normalised float(s) so that the wokwi-elements web component or Three.js mesh material can apply the correct emissive intensity and colour without requiring simulation internals. | Must | Normalised output: `{ brightness: 0.0-1.0, color: { r, g, b } }`. |
| FR-SIM-082 | LCD and OLED framebuffer render states **shall** be delivered as typed arrays (character grid for HD44780; `Uint8Array` 128×64 bit-packed for SSD1306) and updated only when the framebuffer content changes. | Must | Avoids unnecessary re-renders on static displays. |
| FR-SIM-083 | Servo angle render state **shall** be delivered as a `{ angleDeg: number, targetAngleDeg: number }` object, allowing the render layer to animate between current and target positions using the slew-rate model. | Must | |
| FR-SIM-084 | Motor render state **shall** be delivered as `{ direction: 'CW' \| 'CCW' \| 'BRAKE' \| 'COAST', speedNorm: 0.0-1.0 }`. | Must | |
| FR-SIM-085 | The RSE **shall** invoke a WebAudio render hook whenever an active or passive buzzer component model changes state. The hook receives `{ type: 'active' \| 'passive', frequency_hz: number \| null, active: boolean }` and is responsible for starting, updating, or stopping the WebAudio `OscillatorNode`. | Must | Maps to UR-SIM-030 and UR-SIM-031. Frequency range for passive buzzer: 31–65535 Hz (browser AudioContext-limited). |

---

## Serial Monitor Stream

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-090 | The RSE **shall** route all UART TX output from the MCU core to a `SerialMonitorStream` object, which buffers each byte and emits complete lines (or raw bytes in hex/binary mode) as events to the RoboCode Studio Serial Monitor UI component. | Must | Latency from MCU TX register write to Serial Monitor display: < 100 ms at 1× real-time. Maps to UR-SIM-061. |
| FR-SIM-091 | The `SerialMonitorStream` **shall** prepend each emitted line with a simulated timestamp (`simulatedMillis()`) that can be toggled on/off by the user. | Should | Maps to UR-SIM-062. |
| FR-SIM-092 | The Serial Monitor UI **shall** accept user-typed input and pass it to the RSE, which places the bytes into the MCU UART RX buffer at the correct simulated baud rate timing, triggering the `UART_RX_COMPLETE` interrupt. | Must | Maps to UR-SIM-063. |
| FR-SIM-093 | The `SerialMonitorStream` **shall** support selectable display modes (plain text, hex, binary, decimal) and emit a `BAUD_MISMATCH` warning event if the baud rate requested by the sketch differs from the expected baud rate. | Should | Maps to UR-SIM-064. |
| FR-SIM-094 | The Serial Monitor log **shall** be bounded to a configurable maximum line count (default: 1000, maximum: 10 000) with automatic trimming from the oldest entry; the full unbounded log **shall** be downloadable as a `.txt` file via a UI action. | Should | Maps to UR-SIM-066. |
| FR-SIM-095 | The `SerialMonitorStream` **shall** survive simulation pause/resume cycles intact, and the log **shall** be preserved on STOP until the next RUN command. | Must | Maps to UR-SIM-067. |

---

## Logic Analyzer and Pin State Inspector

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-100 | The RSE **shall** maintain a rolling ring-buffer for each MCU pin capturing digital state transitions (timestamp + value) over a configurable window (default: 2 s of simulated time). This buffer feeds both the Pin State Inspector and the logic analyzer. | Must | Ring buffer size: configurable, default 4096 samples per pin. Maps to UR-SIM-060. |
| FR-SIM-101 | The RSE **shall** expose the pin ring-buffer data via a `getPinWaveform(pinId, windowMs)` API, returning an array of `{ t_ms: number, value: 0 \| 1 }` samples that the UI can render as a logic trace. | Must | Required for the logic analyzer view and the mini logic-scope in the Pin State Inspector. Maps to UR-SIM-069. |
| FR-SIM-102 | The RSE **shall** decode I2C and SPI transactions captured in the pin ring-buffer and expose them as structured `{ address, registerOrCommand, data[] }` objects via a `getBusTransactions(busType, windowMs)` API. | Could | Maps to UR-SIM-070. Enables the I2C/SPI decoder panel in the Pin State Inspector. |
| FR-SIM-103 | The Pin State Inspector **shall** update at a minimum display refresh rate of 10 Hz during simulation, showing: pin direction, digital HIGH/LOW, analog voltage (if ADC-capable), and PWM duty cycle for each pin of the active board. | Must | Maps to UR-SIM-060. |
| FR-SIM-104 | Pins that have transitioned within the last 200 ms **shall** be visually highlighted in the Pin State Inspector display until they settle. | Should | Maps to UR-SIM-068. |

---

## Runtime Error Surfacing

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-110 | The RSE **shall** define and emit a structured `RseError` event with the following fields: `{ errorCode: string, severity: 'info' \| 'warning' \| 'error', simMillis: number, componentId?: string, pinId?: string, message: string, friendlyMessage: string, helpUrl?: string }`. | Must | All internal error conditions produce an `RseError` event; no silent failures. |
| FR-SIM-111 | Electrical faults detected at netlist validation or runtime (short circuit, LED without resistor, floating input) **shall** produce `RseError` events with `severity: 'warning'` and a `friendlyMessage` written in plain English at an appropriate reading level for the target student age group. | Must | Example: "It looks like LED1 has no current-limiting resistor. A resistor protects the LED from burning out. Try adding a 220 Ω resistor in series." Maps to UR-SIM-095 and UR-SIM-102. |
| FR-SIM-112 | MCU runtime faults (infinite loop watchdog timeout, stack overflow, AVR hardfault, memory access violation) **shall** halt the simulation, transition to ERROR state, and emit an `RseError` event with `severity: 'error'` and a student-friendly `friendlyMessage` identifying the likely cause. | Must | Maps to UR-SIM-101. Example: "Your program has been running for 8 seconds without responding. Check whether your `loop()` or `while` loop is blocked." |
| FR-SIM-113 | Calls to unsupported library functions or out-of-range arguments **shall** produce `[RSE WARNING] <description>` text appended to the Serial Monitor stream and a concurrent `RseError` event with `severity: 'warning'`. | Must | Maps to UR-SIM-103. |
| FR-SIM-114 | All `RseError` events **shall** be recorded in the Simulation Log, which is downloadable as a `.json` file by the student and reviewable by the Teacher through the assessment interface (see **Functional Requirements: Learning Management and Content**). | Should | Maps to UR-SIM-105. |
| FR-SIM-115 | The RSE **shall** surface a link to the **Simulation Limitations** help article (hosted on the RoboCode.Africa documentation site) from the RoboCode Studio help menu and from any `RseError` event whose root cause is a known simulation fidelity limitation. | Must | Maps to UR-SIM-096. The article must be versioned with each RSE release. |

---

## In-Browser Performance Budget

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-120 | The RSE **shall** complete the full LOAD -> RUNNING transition (netlist build, firmware load, first MCU instruction) within **3 seconds** on the reference device (mid-range Chromebook, 4 GB RAM, 4-core CPU) for a typical 32 KB Arduino sketch using the compile microservice path, and within **500 ms** using the RVM interpreted path. | Must | Measured with the Lighthouse CI performance harness in the CI/CD pipeline. |
| FR-SIM-121 | The RSE simulation loop **shall** sustain real-time (1×) execution of a 16 MHz ATmega328P simulation consuming no more than **60 % of a single CPU core** on the reference device, leaving headroom for the render layer and Monaco editor. | Must | Profiled using the Chrome DevTools Performance panel in the CI performance test suite. |
| FR-SIM-122 | The RSE **shall** limit total heap memory consumption to **200 MB** per open simulation session (covering MCU memory arrays, pin ring-buffers, component model state, and audio nodes). A soft warning shall be emitted at 150 MB. | Must | Prevents out-of-memory crashes on constrained Chromebook and low-cost tablet devices. |
| FR-SIM-123 | The RSE render pipeline (component model -> render hook -> wokwi-elements DOM update) **shall** complete within **16 ms** per frame at 1× speed on the reference device to achieve 60 fps rendering. | Should | Graceful degradation: frame rate may drop to 30 fps on lower-end devices; the simulation loop is not affected. |
| FR-SIM-124 | The RSE **shall** implement adaptive quality reduction: when frame time consistently exceeds 16 ms, it shall disable the 3D render layer and fall back to the 2D wokwi-elements layer automatically, notifying the user with a dismissible banner. | Should | Ensures educational value is preserved on low-end hardware. Aligns with the 3D->2D fallback specification in **Functional Requirements: RoboCode Studio IDE**. |
| FR-SIM-125 | The RSE WebAudio graph **shall** be kept lean: no more than **10 concurrent active audio nodes** at any time. Additional audio requests beyond this limit shall be silently suppressed. | Must | Prevents audio subsystem memory leaks in long-running simulations. |

---

## Simulation Fidelity Limits

The following table declares the known and accepted fidelity boundaries of the RSE v1.0. These limits must be published in the **Simulation Limitations** help article (FR-SIM-115).

| Area | In-Scope (v1.0) | Out of Scope / Won-t (v1.0) |
|------|----------------|------------------------------|
| ATmega328P MCU | Full instruction set, GPIO, ADC, USART, TWI, SPI, Timer0/1/2, interrupts, SRAM, Flash | EEPROM wear-level emulation; watchdog timer; Brown-out detector; hardware multiplier errata |
| RP2040 MCU (rp2040js) | GPIO (GP0–GP28), ADC (GP26–GP28 + temp), 2× UART, 2× SPI, 2× I2C, 16 PWM channels, USB CDC stub, 8 PIO state machines (standard Wokwi-tested programs), basic dual-core (multicore FIFO), SRAM, QSPI flash | Cycle-accurate dual-core race-condition modelling; arbitrary custom PIO programs at full cycle accuracy; Pico W CYW43439 Wi-Fi/BLE; sub-10 µs timing edge-case accuracy |
| Timing accuracy | ≥ 10 µs resolution for protocol timing (I2C, SPI, UART, PWM, DHT, HC-SR04) | Sub-10 µs edge-case accuracy; oscilloscope-grade waveform capture |
| ESP32 | GPIO, ADC, LEDC PWM, I2C, SPI, UART, Wi-Fi/BLE stub | Genuine TCP/IP stack; RF propagation; dual-core task scheduling accuracy; RMT peripheral; I2S; DAC |
| Board definitions | Standard wokwi-boards library (Arduino Uno/Nano/Mega, ESP32 family, Raspberry Pi Pico); custom board manifests uploaded by admins or approved users in wokwi-boards format | Boards not in the catalogue and not uploaded as custom definitions; SPICE netlist-level board models |
| Library support | Arduino standard libs, Wire, SPI, Servo, Stepper, LiquidCrystal, NeoPixel, SSD1306, GFX, DHT, IRremote, Keypad, MFRC522, RTClib, MicroPython builtins, CircuitPython builtins, Arduino-Pico core, Pico SDK standard headers | Third-party libraries not in the stated support matrix; C++ template-heavy libraries requiring full GCC support |
| Component models | All components in the platform canon component catalogue | Components not in the catalogue; custom/third-party breakout boards |
| Electrical fidelity | Logic-level voltage, current-limiting warnings, basic short detection, pull-up/pull-down modelling | SPICE-level analog simulation; transistor I-V curves; capacitor charge/discharge curves; RF/EM effects |

---

## Simulation Log

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-SIM-130 | The RSE **shall** maintain a structured **Simulation Log** that records: lifecycle transitions (start/stop/reset/pause/resume), all `RseError` events, and significant component state changes (relay open/close, motor direction change) with simulated timestamps. | Should | Maps to UR-SIM-105. |
| FR-SIM-131 | The Simulation Log **shall** be accessible as a panel within RoboCode Studio and downloadable as a `.json` file with a schema that is stable across RSE minor versions. | Should | Teachers can download the log as assessment evidence via the Teacher assessment interface (see **Functional Requirements: Learning Management and Content**). |
| FR-SIM-132 | The Simulation Log **shall** be scoped to the current simulation session and cleared on each new RUN command; prior logs **shall** be stored in the browser's IndexedDB for the duration of the Studio session (tab lifetime). | Could | Supports reviewing the history of multiple run attempts within a study session. |

---

## MoSCoW Priority Summary

| Priority | Requirement IDs |
|----------|----------------|
| Must | FR-SIM-001, 002, 003, 005, 010, 011, 012, 013, 014, 015, 016, 017, 020, 021, 022, 023, 024, 025, 026, 027, 029, 030, 031, 032, 035, 036, 037, 040, 041, 042, 043, 044, 045, 050, 052, 053, 055, 056, 057, 058, 059, 060, 062, 063, 064, 065, 066, 067, 068, 072, 073, 074, 075, 076, 077, 078, 080, 081, 082, 083, 084, 085, 090, 092, 095, 100, 101, 103, 110, 111, 112, 113, 115, 120, 121, 122, 125 |
| Should | FR-SIM-004, 018 (partial), 028, 033, 046, 051, 061, 069, 070, 071, 079, 091, 093, 094, 104, 114, 123, 124, 130, 131 |
| Could | FR-SIM-034, 054, 071, 102, 132 |
| Won-t (v1.0) | Full RF/Wi-Fi simulation; SPICE-level analog; EEPROM wear-level; sub-10 µs timing edge-case accuracy; oscilloscope-grade waveform capture; SPI slave mode; full dual-core ESP32 task scheduling accuracy; Pico W CYW43439 Wi-Fi/BLE; cycle-accurate dual-core RP2040 race-condition modelling |

---

## Cross-References

| Related Section | Relationship |
|-----------------|-------------|
| Functional Requirements: RoboCode Studio IDE | Supplies the canonical circuit descriptor (JSON) consumed by FR-SIM-001. The 2D/3D render layer and canvas/wiring UI that host the RSE render hooks are specified there. |
| Functional Requirements: Code Authoring, Validation and Execution | Specifies the compile pipeline (WASM toolchain / compile microservice / RVM transpiler) that produces the firmware or IR loaded by FR-SIM-041. |
| Component and Sensor Library Specification | Defines the complete component catalogue and per-component electrical/timing parameters that RSE component models must faithfully implement (FR-SIM-055 to FR-SIM-079). |
| Functional Requirements: Learning Management and Content | The Simulation Log (FR-SIM-130) and Serial Monitor log (FR-SIM-094) are assessment evidence surfaces consumed by the Teacher assessment workflow. |
| Non-Functional Requirements | Performance budgets (FR-SIM-120 to FR-SIM-125) are verified against targets defined in the NFR section (NFR-PERF-nnn). |
| Security, Privacy and Child Safety | Serial Monitor input/output and simulation logs constitute student-generated content subject to data-minimisation, retention limits, and audit-logging obligations defined in SR-nnn. |
| Accessibility, Internationalisation and Low-Bandwidth Design | All RSE interactive controls (speed slider, sensor input widgets, Serial Monitor) must be keyboard-operable and meet WCAG 2.2 AA as specified in that section. |
