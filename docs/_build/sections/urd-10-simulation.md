# User Requirements: Simulation Experience

## Overview

This section specifies the user-facing requirements for the simulation experience within RoboCode Studio — the interactive 2D/3D electronics simulator that is the centrepiece of the RoboCode.Africa platform. The requirements cover how Students, Teachers, and other authorised users start, control, and interact with a simulation; the real-time visual and audible feedback they must receive; the interactive sensor-input mechanisms; the Serial Monitor; simulation speed control; pin and logic-state inspection; fidelity expectations; and student-friendly error handling.

These requirements are grounded in the RoboCode Simulation Engine (RSE), which reuses the open-source Wokwi component library (wokwi-elements web components, avr8js for Arduino UNO R3 firmware execution, the ESP32 core simulation, and rp2040js for Raspberry Pi Pico RP2040 firmware execution). The RSE supports three first-class development boards — Arduino UNO R3, ESP32 DevKit, and Raspberry Pi Pico — plus an extensible, data-driven board library based on the wokwi-boards definition format. Requirements in this section carry the identifier prefix **UR-SIM**. Related functional requirements in the System Specification Document (SSD) are labelled **FR-SIM**. Cross-references to the canvas and wiring section ("User Requirements: RoboCode Studio Canvas, Components and Wiring") and the code editor section ("User Requirements: Code Editor and Programming") are indicated inline.

---

## Simulation Control

The simulation control subsystem exposes the fundamental lifecycle operations that a Student or Teacher uses to drive a simulation session. Every project has a persistent simulation state that survives page reloads within the same browser session.

### Simulation Lifecycle

```
+-------------------------------------------------------+
|                 Simulation Lifecycle                  |
|                                                       |
|  [STOPPED] --RUN--> [RUNNING] --PAUSE--> [PAUSED]    |
|      ^                  |                   |         |
|      |                  |                   |         |
|      +------STOP--------+------STOP/RESET---+         |
|                                                       |
|  RESET from any state --> reinitialise MCU + canvas  |
+-------------------------------------------------------+
```

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-SIM-001 | A Student or Teacher shall be able to **start** a simulation by clicking a clearly labelled Run button (or pressing a keyboard shortcut), which compiles or loads the current sketch and begins MCU execution. | Must | Run button is enabled only when the circuit contains at least one supported development board. |
| UR-SIM-002 | A running simulation shall be **paused** at any moment, freezing MCU clock and all component states without losing runtime context (registers, memory, pin states, timers). | Must | Resuming from pause must continue execution from the exact point at which it was paused. |
| UR-SIM-003 | A running or paused simulation shall be **stopped**, which halts execution, de-energises all component outputs (LEDs off, motors stopped, servos at rest), and returns all pin-output states to their de-energised defaults. | Must | Stopping does not clear the Serial Monitor log or the code editor. |
| UR-SIM-004 | The user shall be able to **reset** the simulation from any state, which reinitialises the MCU (equivalent to a hardware reset/power-cycle), restores all component models to their power-on state, and restarts execution from `setup()`. | Must | Reset does not modify the schematic or code. |
| UR-SIM-005 | A persistent **simulation status indicator** shall be visible at all times in the RoboCode Studio toolbar, displaying the current state (Stopped / Running / Paused / Error / Compiling). | Must | Colour-coded: green = Running, yellow = Paused, red = Error, grey = Stopped. |
| UR-SIM-006 | While a simulation is running, modifications to the schematic (adding/removing components or wires) shall be blocked with a contextual tooltip explaining that the simulation must be stopped first. | Must | Prevents circuit changes that would corrupt MCU state. Consistent with "User Requirements: RoboCode Studio Canvas, Components and Wiring". |
| UR-SIM-007 | While a simulation is running, code edits shall be permitted; clicking **Run** again after an edit shall stop the current run, recompile/reload, and restart automatically. | Should | An optional prompt ("Stop current simulation and restart?") may be shown. |

---

## Real-Time Visual Feedback

Students must receive immediate, believable visual responses from simulated components so that the connection between code and physical outcome is clear and motivating.

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-SIM-010 | **Single LEDs** (red, green, blue, yellow) shall illuminate with the correct colour and a visible glow/brightness effect when their anode pin is driven HIGH (or the corresponding PWM duty cycle) and extinguish when driven LOW. | Must | Brightness scales linearly with PWM duty cycle (0–255). |
| UR-SIM-011 | **RGB LEDs** (common-anode and common-cathode variants) shall display the blended colour computed from the three PWM channel values applied to the R, G, B pins. | Must | Common-anode and common-cathode polarity logic must both be correctly modelled. |
| UR-SIM-012 | **LED bar graphs** shall illuminate each segment bar independently in response to the corresponding pin state. | Must | 10-segment bar must render all 10 states simultaneously. |
| UR-SIM-013 | **1-digit and 4-digit 7-segment displays** shall render the correct digit(s) and decimal points in real time, updating within one display-refresh cycle of the simulated MCU writing to the segment pins or the TM1637/MAX7219 SPI bus. | Must | Multiplexed scanning must be visually smooth at normal simulation speed. |
| UR-SIM-014 | The **8×8 LED matrix** (MAX7219) shall render each pixel as an illuminated dot, supporting scrolling and animation as driven by the sketch. | Should | MAX7219 SPI protocol must be accurately modelled. |
| UR-SIM-015 | **16×2 and 20×4 character LCD displays** (HD44780 + I2C backpack) shall render text characters, custom glyphs, and cursor positioning exactly as produced by the `LiquidCrystal_I2C` library calls in the sketch. | Must | Backlight on/off control and contrast modelling are Should-level. |
| UR-SIM-016 | The **0.96-inch OLED display** (SSD1306, I2C) shall render monochrome pixel graphics and text as produced by Adafruit GFX / U8g2 library calls. | Must | Pixel-accurate rendering within one I2C transaction of the MCU writing. |
| UR-SIM-017 | **WS2812/NeoPixel rings and strips** shall render each addressable LED with the correct 24-bit RGB colour set by the sketch, updating within one data-frame transmission time. | Must | Timing-sensitive WS2812 protocol (800 kHz) must be accurately modelled; incorrect timing shall generate a runtime warning. |
| UR-SIM-018 | **Servo motors** (SG90 and compatible) shall visually rotate their arm/horn to the angle commanded by the PWM signal (0°–180°), animating smoothly rather than snapping. | Must | Animation speed should approximate the rated slew rate of the SG90 (≈ 100°/s). |
| UR-SIM-019 | **DC motors** connected through an L293D or L298N driver module shall spin a rendered rotor graphic at a speed and direction proportional to the PWM duty cycle and direction pins, including a stopped state when enable is LOW. | Must | RPM display (estimated) is a Should-level enhancement. |
| UR-SIM-020 | The **28BYJ-48 stepper motor** with ULN2003 driver shall animate step-by-step rotation in the correct direction and at a speed proportional to the step interval set in the sketch. | Should | Step accuracy (full-step vs half-step) must be correctly reflected. |
| UR-SIM-021 | A **fan** actuator shall render spinning blades whose visible speed reflects the PWM duty cycle applied to its control pin. | Could | Visual representation is sufficient; airflow simulation is out of scope. |
| UR-SIM-022 | **Relay modules** shall display a clearly labelled OPEN/CLOSED state change and an optional click visual cue when the coil is energised or de-energised. | Should | Relay state must be reflected in the pin-state inspector (UR-SIM-060). |

---

## Real-Time Audible Feedback

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-SIM-030 | An **active buzzer** shall produce an audible tone (approximately 2.3 kHz) through the browser's audio output when driven HIGH, and be silent when driven LOW. | Must | Implemented via the Web Audio API. Requires user gesture to unlock audio context on first interaction. |
| UR-SIM-031 | A **passive buzzer** shall produce a tone whose frequency matches the PWM signal applied to its pin, supporting the full audible range used by Arduino `tone()` (31 Hz – 65535 Hz, browser-limited in practice). | Must | Waveform is a square wave approximation. Volume is adjustable via the simulation toolbar. |
| UR-SIM-032 | A **global simulation audio volume control** (mute / 0–100%) shall be present in the RoboCode Studio toolbar, persisted per user session. | Must | Default volume shall be 50% to avoid startling students. |
| UR-SIM-033 | When the browser tab is hidden or minimised, audio output shall be silenced automatically and resume when the tab is restored. | Should | Reduces distraction in classroom settings. |

---

## Interactive Sensor Inputs

Students must be able to interact with simulated sensors and input devices during a running simulation to test how their code responds to real-world stimuli. All interactive controls are surfaced in the RoboCode Studio canvas panel.

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-SIM-040 | **Push buttons and tactile switches** shall be clickable (and keyboard-activatable) during simulation; holding the control pressed shall assert the pin LOW or HIGH according to the button's wiring, releasing shall de-assert it. | Must | Must also support long-press hold for testing debounce code. |
| UR-SIM-041 | A **rotary potentiometer** shall display a draggable knob widget during simulation; rotating the knob from 0° to 300° shall drive the corresponding ADC pin between 0 V and VCC (mapped to 0–1023 on a 10-bit ADC). | Must | Knob position persists between pause/resume cycles. |
| UR-SIM-042 | An **analog joystick** shall display two perpendicular slider widgets (X and Y axes) plus a button control; each axis shall drive the respective ADC pin across the full 0–1023 ADC range. | Must | Sliders snap back to the centre (512) when released, unless a lock mode is enabled. |
| UR-SIM-043 | The **ultrasonic distance sensor** (HC-SR04) shall expose a numeric input field (range: 2 cm – 400 cm) during simulation, settable by the Student at any time; the RSE shall compute the ECHO pulse width accordingly. | Must | Input shall also accept slider control. Real-time update while simulation is running. |
| UR-SIM-044 | The **DHT11/DHT22 temperature-humidity sensor** shall expose two numeric input fields (temperature in °C, humidity in %) during simulation, accepting values within the sensor's rated range. | Must | DHT11: temp 0–50 °C, humidity 20–90 %. DHT22: temp −40 to 80 °C, humidity 0–100 %. |
| UR-SIM-045 | The **LM35 temperature sensor** shall expose a numeric input field for temperature (°C), which RSE translates to the correct analog output voltage (10 mV/°C). | Must | Range: −55 °C to +150 °C. |
| UR-SIM-046 | A **photoresistor (LDR)** shall expose a light-level input (lux, 0–100 000) or a simplified Low/Medium/High selector; the RSE shall compute the corresponding resistance/voltage divider output. | Must | Simple percentage slider is acceptable for the V1 release. |
| UR-SIM-047 | The **PIR motion sensor** (HC-SR501) shall expose a **Trigger Motion** button during simulation; pressing it briefly asserts the output pin HIGH for the sensor's programmed delay period. | Must | Delay and sensitivity potentiometer values shall be configurable via a properties panel. |
| UR-SIM-048 | The **IR receiver + remote** component pair shall allow the Student to click virtual remote buttons during simulation, generating the correct NEC protocol pulse trains on the receiver's output pin. | Should | At minimum, a set of common remote-control button codes must be supported. |
| UR-SIM-049 | The **IR obstacle / line-tracking sensor** shall expose a toggle (obstacle detected / clear) or a reflectance slider during simulation, which RSE uses to assert the digital output pin accordingly. | Should | Obstacle detection threshold potentiometer setting shall be configurable. |
| UR-SIM-050 | The **sound/microphone sensor** (digital and analog variants) shall expose a sound-level slider or a **Clap** trigger button; the digital pin output shall toggle when the level crosses the threshold. | Could | Analog microphone variant should output a voltage proportional to sound level. |
| UR-SIM-051 | The **soil moisture sensor** and **water-level sensor** shall each expose a moisture/level percentage slider that RSE maps to the sensor's analog and digital output pins. | Could | Useful for agriculture-themed projects. |
| UR-SIM-052 | The **gas sensor (MQ-2)** shall expose a gas-concentration slider (0–100 % scale) during simulation; RSE maps this to the analog voltage output and digital alarm pin. | Could | Threshold potentiometer on the module shall be configurable. |
| UR-SIM-053 | The **flame sensor** shall expose a flame detected / not detected toggle during simulation. | Could | |
| UR-SIM-054 | The **4×4 membrane keypad** shall render a clickable virtual keypad overlay during simulation; pressing a key asserts the corresponding row/column pin intersections so the sketch's keypad-scanning code can detect it. | Must | Must support simultaneous key-press for multi-key scanning. |
| UR-SIM-055 | The **rotary encoder** shall expose a clickable increment/decrement widget and a button press control during simulation, generating the correct quadrature (A/B) signal transitions and index pulse. | Should | Encoder resolution (PPR) shall match the wired component's datasheet value. |
| UR-SIM-056 | The **tilt/ball switch** shall expose a tilt toggle (tilted / upright) during simulation. | Should | |
| UR-SIM-057 | All interactive sensor input controls shall be clearly differentiated visually from static component labels on the canvas — for example, by highlighted border, interactive cursor, and a brief tooltip describing the control. | Must | Accessibility: all controls must be keyboard-operable (WCAG 2.2 AA, UR-NFR cross-reference). |

---

## Serial Monitor

The Serial Monitor surfaces `Serial.print()` / `Serial.println()` output from the simulated MCU and allows the Student to send bytes back to the MCU's serial input.

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-SIM-061 | RoboCode Studio shall include a **Serial Monitor** panel that displays all text written to the simulated UART by the sketch (via `Serial.begin()`, `Serial.print()`, etc.) in real time during simulation. | Must | Output must appear within one UART transmission time (simulated) of the MCU writing. |
| UR-SIM-062 | The Serial Monitor shall display each received line with a faint timestamp (simulated milliseconds since reset, togglable). | Should | Helps Students understand timing and `millis()` usage. |
| UR-SIM-063 | The Student shall be able to **type and send** ASCII strings or individual bytes to the MCU's serial input via a text field + Send button (or Enter key) in the Serial Monitor panel. | Must | Enables testing `Serial.read()` / `Serial.available()` logic. |
| UR-SIM-064 | The Serial Monitor shall support selectable **baud rate display modes** (plain text, hex, binary, decimal) matching the `Serial.begin()` baud rate in the sketch; a mismatch warning shall be shown if detected. | Should | Common rates: 9600, 115200 bps minimum. |
| UR-SIM-065 | The Serial Monitor shall provide **Clear**, **Pause scroll** (freeze output in place), and **Copy to clipboard** actions. | Must | Clear action prompts for confirmation to avoid accidental data loss. |
| UR-SIM-066 | The Serial Monitor log shall be limited to a configurable maximum line count (default: 1000 lines) with automatic trimming from the top; a persistent full log shall be downloadable as a `.txt` file. | Should | Prevents excessive memory use in long-running simulations. |
| UR-SIM-067 | When a simulation is stopped, the Serial Monitor log shall be retained until the next Run, so the Student can review the full output. | Must | |

---

## Pin and Logic State Inspector

> Note: the Pin State Inspector lead requirement retains its original identifier `UR-SIM-060` (referenced by other sections and by the SSD traceability matrix, FR-SIM-100..104); the remaining inspector requirements continue in the `068..070` band. The IDs are permanent and unique; the non-sequential ordering relative to the Serial Monitor band (`061..067`) is intentional and does not indicate a missing requirement.

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-SIM-060 | RoboCode Studio shall provide a **Pin State Inspector** panel (or overlay) showing the current digital HIGH/LOW state and, where applicable, the analog voltage level (0–5 V for Arduino UNO, 0–3.3 V for ESP32 and Raspberry Pi Pico) or PWM duty cycle of every pin on the active development board in real time during simulation. | Must | Updated at a display refresh rate of ≥ 10 Hz so transitions are visible. |
| UR-SIM-068 | The Pin State Inspector shall highlight pins that have changed state within the last 200 ms using a visual flash or colour change to draw the Student's attention. | Should | Helps Students verify which pins their code is toggling. |
| UR-SIM-069 | The Student shall be able to click any pin in the Inspector to see a **mini logic-scope** graph showing a rolling 2-second window of that pin's digital waveform (HIGH/LOW over time). | Could | Particularly useful for PWM and bitbang-protocol debugging. |
| UR-SIM-070 | For I2C and SPI buses, the Pin State Inspector shall decode and display the last transmitted address and data bytes in human-readable form in a tooltip or sub-panel. | Could | Supports deeper learning of communication protocols. |

---

## Simulation Speed Control

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-SIM-080 | The Student shall be able to adjust simulation speed via a **speed slider** in the RoboCode Studio toolbar, covering at minimum: 0.25×, 0.5×, 1× (real-time), 2×, 4× of real MCU clock speed. | Must | Default is 1× (real-time). Speed changes take effect immediately without stopping the simulation. |
| UR-SIM-081 | At reduced speeds (< 1×), timing-sensitive components (NeoPixels, DHT sensors, ultrasonic sensors) shall scale their protocol timing proportionally so that code continues to function correctly. | Must | Failure to scale timing would cause library timeouts at slow speed, confusing Students. |
| UR-SIM-082 | At accelerated speeds (> 1×), the platform shall warn if the host device's CPU cannot sustain the requested speed and shall automatically throttle rather than drop frames silently. | Should | Throttle notification displayed in the simulation status indicator. |
| UR-SIM-083 | A **step-by-step** (single-instruction) execution mode shall be available via the Pin State Inspector or a dedicated Debug toolbar for advanced high-school Students. | Could | Allows inspection of MCU register states one instruction at a time (AVR registers for Arduino UNO, RP2040 Cortex-M0+ registers for Raspberry Pi Pico). |

---

## Simulation Fidelity Expectations

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-SIM-090 | Sketches that run correctly on a physical Arduino UNO R3 with the same circuit shall, in the general case, run correctly in RoboCode Studio without modification, using the avr8js simulation of the ATmega328P. | Must | "General case" excludes timing edge cases below ~10 µs and hardware-specific errata not modelled by avr8js. |
| UR-SIM-091 | The platform shall accurately simulate the ATmega328P's 16 MHz clock, interrupt vectors, ADC resolution (10-bit), PWM channels, I2C (TWI), SPI, and UART peripherals as supported by the avr8js library. | Must | Known limitations (e.g., EEPROM simulation, watchdog timer) shall be disclosed in a Simulation Limitations help article linked from the RoboCode Studio UI. |
| UR-SIM-092 | The ESP32 simulation path shall accurately execute MicroPython or Arduino-ESP32 sketches through the ESP32 core simulator for the components listed in the component catalogue; behaviour shall match a physical ESP32 DevKit for common GPIO, ADC, PWM, I2C, SPI, UART, and Wi-Fi/BLE stub operations. | Must | Wi-Fi and BLE simulation is a stub that returns configurable mock responses; full RF simulation is out of scope. |
| UR-SIM-093 | Library compatibility: the RSE shall support, at minimum, the Arduino standard libraries (`Wire`, `SPI`, `Servo`, `Stepper`, `LiquidCrystal`, `LiquidCrystal_I2C`, `Adafruit_NeoPixel`, `Adafruit_SSD1306`, `Adafruit_GFX`, `DHT`, `IRremote`, `Keypad`, `MFRC522`, `RTClib`) and the equivalent MicroPython modules for the ESP32; for the Raspberry Pi Pico the RSE shall support MicroPython, CircuitPython, and C/C++ firmware built with the Arduino-Pico core or the Pico SDK. | Must | Library support matrix shall be published in the platform documentation and discoverable from within RoboCode Studio. |
| UR-SIM-094 | Component models shall accurately implement the electrical and timing characteristics defined in the Wokwi open-source component library for all components in the component catalogue defined in the platform canon. | Must | Deviations or unimplemented behaviours shall be noted in per-component simulation notes accessible from the canvas. |
| UR-SIM-095 | The RSE shall model basic short-circuit and over-current conditions (e.g., LED connected without resistor) with a visible warning indicator on the affected component, rather than silently allowing incorrect circuits. | Should | Warning must be educational in tone: "This LED may burn out without a current-limiting resistor." |
| UR-SIM-096 | Students and Teachers shall have access to a **Simulation Limitations** reference, linked from the RoboCode Studio help menu, that lists all known deviations from physical hardware behaviour and unsupported library functions. | Must | Must be maintained and versioned with each RSE release. |
| UR-SIM-097 | The Raspberry Pi Pico (RP2040) simulation path shall accurately execute UF2/ELF firmware images through the rp2040js library, modelling the dual-core ARM Cortex-M0+ at 133 MHz, 264 KB SRAM, 26 multifunction GPIO (GP0–GP28), 3 ADC-capable inputs (GP26/GP27/GP28) plus internal temperature sensor, 2× UART, 2× SPI, 2× I2C, 16 PWM channels, and 8 PIO state machines. Behaviour shall match a physical Raspberry Pi Pico for the components listed in the component catalogue. | Must | Known limitations of rp2040js (e.g., USB device emulation, PIO edge cases) shall be disclosed in the Simulation Limitations article (UR-SIM-096). Pico W (CYW43439 Wi-Fi/BLE) is a near-term roadmap variant; its Wi-Fi/BLE stub follows the same approach as the ESP32 (UR-SIM-092). |
| UR-SIM-098 | The RSE shall support an extensible, data-driven **board library** based on the wokwi-boards definition format. Platform admins and approved advanced users/Teachers shall be able to upload custom board manifests (`board.json` + SVG asset) that declare the board name, pin names, pin types, and pin positions. No code change shall be required to add a supported board; each manifest binds to an MCU core target (avr8js, rp2040js, or ESP32 core) so the RSE knows how to execute firmware for that board. | Must | Custom-board uploads are validated against the wokwi-boards JSON schema (pin sanity, SVG/asset safety) and, for non-admin users, pass through the standard approval/moderation workflow before becoming available to learners. The built-in wokwi-boards library (Arduino Uno/Nano/Mega, ESP32 family, Raspberry Pi Pico, and others) ships pre-installed. |

---

## Student-Friendly Runtime Error Messages

Error messages produced during simulation must be educational, specific, and free of low-level technical jargon that would confuse primary or high-school Students.

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-SIM-100 | When a sketch fails to compile, RoboCode Studio shall display a **friendly compile-error panel** that (a) highlights the offending line in the Monaco editor, (b) shows a plain-English explanation of the error alongside the raw compiler message (toggleable), and (c) links to a relevant tutorial or documentation article where one exists. | Must | Cross-reference "User Requirements: Code Editor and Programming" for compile-error UX. |
| UR-SIM-101 | When the MCU encounters a runtime fault (e.g., infinite loop detected, stack overflow, null pointer, watchdog timeout, hardfault on ESP32), the simulation shall halt and display a contextual error message identifying the likely cause in student-friendly language. | Must | Example: "Your program seems to be stuck in a loop. Check if your `while` loop has an exit condition." |
| UR-SIM-102 | Detected electrical problems (short circuit, incorrect voltage level, floating pin used as input) shall display a **yellow warning badge** on the affected component on the canvas with a plain-English tooltip describing the issue and how to fix it. | Should | Warnings must not stop the simulation unless the condition is catastrophically destructive (e.g., simulated over-voltage). |
| UR-SIM-103 | If the RSE detects an unsupported library call or an out-of-range function argument, it shall output a descriptive warning to the Serial Monitor rather than silently failing, formatted as `[RSE WARNING] <description>`. | Must | Allows the Student to diagnose issues without external tools. |
| UR-SIM-104 | Runtime error messages shall be available in the platform's supported interface languages (English at minimum; additional languages per the localisation roadmap) so that non-English-speaking Students in the African market receive messages in a familiar language. | Should | Localisation of error messages is a V2 feature; V1 must be English with clear, simple vocabulary. |
| UR-SIM-105 | A persistent **Simulation Log** panel (separate from the Serial Monitor) shall record all RSE warnings, errors, and significant state transitions (start, stop, reset) with simulated timestamps and a severity level (Info / Warning / Error). | Should | Log is downloadable as `.json` for Teacher review and assessment purposes (cross-reference "User Requirements: Learning, Courses, Tasks and Assessment"). |

---

## MoSCoW Priority Summary

| Priority | Requirement IDs |
|---|---|
| **Must** | UR-SIM-001, 002, 003, 004, 005, 006, 010, 011, 012, 013, 015, 016, 017, 018, 019, 030, 031, 032, 040, 041, 042, 043, 044, 045, 046, 047, 054, 057, 060, 061, 063, 065, 067, 080, 081, 090, 091, 092, 093, 094, 096, 097, 098, 100, 101, 103 |
| **Should** | UR-SIM-007, 014, 020, 022, 033, 048, 049, 055, 056, 062, 064, 066, 068, 082, 095, 102, 104, 105 |
| **Could** | UR-SIM-021, 050, 051, 052, 053, 069, 070, 083 |
| **Won-t (this release)** | Full RF simulation for Wi-Fi/BLE (ESP32 or Pico W); EEPROM/flash wear-level emulation; sub-10 µs timing edge-case accuracy; oscilloscope-grade waveform capture; USB device emulation for Raspberry Pi Pico. |

---

## Assumptions and Constraints

- The browser must support WebAssembly (for avr8js, rp2040js, and the WASM compile toolchain), Web Audio API (for buzzer simulation), and WebGL2 (for 3D rendering). See "Non-Functional User Expectations" for the minimum supported browser matrix.
- Audio output requires a prior user gesture to unlock the Web Audio context; this is a browser security constraint that cannot be overridden.
- 3D rendering of components gracefully degrades to 2D wokwi-elements rendering on devices that do not support WebGL2 (see "User Requirements: RoboCode Studio Canvas, Components and Wiring").
- The interactive sensor input controls defined in this section (UR-SIM-040 – UR-SIM-057) are only available while the simulation is in the Running or Paused state.
- The accuracy of ESP32 Wi-Fi/BLE behaviour is limited to stub simulation (mock responses); projects requiring genuine TCP/IP stack behaviour are out of scope for V1. The same stub approach applies to the Raspberry Pi Pico W (CYW43439 Wi-Fi/BLE), which is a near-term roadmap variant of the Raspberry Pi Pico board.
- The simulation operates entirely in-browser; no MCU state is sent to the backend. Project files (schematic + code) are persisted via the backend API as defined in "User Requirements: RoboCode Studio Canvas, Components and Wiring".

---

## Relationship to Other Sections

| Related Section | Relationship |
|---|---|
| User Requirements: RoboCode Studio Canvas, Components and Wiring | Defines the component catalogue and schematic authoring from which the RSE reads its circuit description. Simulation cannot start without a valid circuit (UR-SIM-001). |
| User Requirements: Code Editor and Programming | Defines the Monaco editor, compile pipeline, and block-code transpilation whose output the RSE executes. Compile errors surface both in that section and in UR-SIM-100. |
| User Requirements: Learning, Courses, Tasks and Assessment | Simulation state, Serial Monitor output, and Simulation Log may be captured as assessment evidence and shared with Teachers. |
| User Requirements: Administration and Reporting | Teachers and School Admins may access aggregated simulation usage analytics (sessions, error frequency, components used) for pedagogical insights. |
| Non-Functional User Expectations | Performance, reliability, accessibility (WCAG 2.2 AA), and browser compatibility expectations apply globally to the simulation experience. |
