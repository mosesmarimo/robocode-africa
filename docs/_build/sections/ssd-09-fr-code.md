# Functional Requirements: Code Authoring, Validation and Execution

## Overview

This section specifies the complete functional requirements for the code-authoring, validation and execution subsystem of RoboCode.Africa. The code editor is hosted within the **Code** tab of **RoboCode Studio** and is the primary programming interface through which Students write, analyse, and execute programs that drive simulated electronics and robotics components. It must serve a wide ability spectrum—from primary-school learners using a visual block-based interface to high-school students writing production-quality Arduino C/C++ or MicroPython—while always mapping code to simulator component actions through the **RoboCode Simulation Engine (RSE)** and the **RoboCode Virtual Machine (RVM)**.

All functional requirements in this section carry the identifier prefix `FR-CODE-nnn`. Cross-references to other sections are made by section name and requirement-ID prefix; page numbers are never used.

Child safety is the prime directive. Where any requirement conflicts with convenience or performance, child-safety and data-protection obligations take precedence.

---

## Subsystem Context

The code-authoring subsystem sits at the intersection of the Monaco editor (client-side), the RSE execution layer (Web Worker, client-side), and the project-persistence backend (NestJS Code Service). The diagram below shows the primary data flows.

```
+------------------------------------------------------------------+
|  Browser — RoboCode Studio (Code Tab)                            |
|                                                                  |
|  +----------------------+   +-------------------------------+   |
|  |  Monaco Editor       |   |  Block-Based Editor           |   |
|  |  - Arduino C/C++     |   |  (Scratch-style blocks)       |   |
|  |  - MicroPython       |   |  transpiles to Arduino C/C++  |   |
|  |  Lint / Diagnostics  |   +-------------------------------+   |
|  |  Autocomplete        |                                       |
|  |  Execution cursor    |   +-------------------------------+   |
|  |  Breakpoint gutter   |   |  Library Manager / Templates  |   |
|  +----------+-----------+   +-------------------------------+   |
|             |                                                    |
|    pre-run validation                                            |
|             |                                                    |
|    +--------v---------+       +----------------------------+    |
|    |  Build Pipeline  |       |  RVM (Simplified Path)     |    |
|    |                  |       |  Interprets/translates      |    |
|    | In-browser WASM  |       |  code to RSE instructions  |    |
|    | toolchain   OR   |       +------------+---------------+    |
|    | Compile Service  |                    |                     |
|    +--------+---------+                   |                     |
|             |                             |                     |
|    firmware binary                        |                     |
|             |                   component pin-state events      |
|    +--------v---------------------------------------+           |
|    |  RoboCode Simulation Engine (RSE) Web Worker  |           |
|    |  avr8js (UNO ATmega328P)                      |           |
|    |  rp2040js (Raspberry Pi Pico RP2040)          |           |
|    |  ESP32 core simulator                         |           |
|    |  Component behavioural models                 |           |
|    +-----------+-----------------------------------+           |
|                |  canvas state updates                          |
|    +-----------v-----------+                                   |
|    |  Canvas / wokwi-      |                                   |
|    |  elements (2D) /      |                                   |
|    |  Three.js/R3F (3D)    |                                   |
+----+-----------------------+-----------------------------------+
             |
       HTTPS / WSS
             |
+------------v---------------------------------------------+
|  Backend — Code Service (NestJS)                         |
|  Project persistence  |  Version history  |  AI Hints   |
|  Compile microservice |  Audit logging    |  CRDT sync   |
+----------------------------------------------------------+
```

---

## Supported Authoring Modes and Languages

RoboCode Studio exposes three authoring modes. A Teacher or School Admin may restrict available modes per class or per age tier.

| Mode | Language / Syntax | Target Audience | Board Support |
|------|------------------|-----------------|---------------|
| Block-Based | Graphical Scratch-style blocks; transpiles to Arduino C/C++ | Primary-school Students (ages 8–12) | UNO R3 |
| Text — Arduino C/C++ | Arduino dialect of C/C++ (avr-gcc / ESP32 Arduino core / Arduino-Pico core) | High-school Students | UNO R3, ESP32, Raspberry Pi Pico |
| Text — MicroPython | MicroPython for ESP32 (`machine`, `uasyncio`, standard libs) and MicroPython for RP2040 (`machine`, `rp2040`, `uasyncio`, standard libs) | High-school Students | ESP32, Raspberry Pi Pico |
| Text — CircuitPython | CircuitPython for RP2040 (`board`, `digitalio`, `analogio`, `busio`, `pulseio`, `countio`, standard libs) | High-school Students | Raspberry Pi Pico |
| Text — C/C++ (Pico SDK) | Raspberry Pi Pico SDK C/C++ (`pico/stdlib.h`, hardware APIs, PIO) | Advanced High-school Students | Raspberry Pi Pico |

Switching from Block-Based to a text mode reveals the generated source and offers a one-way promotion dialog. Switching back after manual text edits is prohibited to preserve Student intent.

---

## Execution Path Architecture

The subsystem supports two distinct execution paths. Both paths share the same pre-run validation gate; they diverge at the build/translation stage.

### Accurate Execution Path (Compiled Firmware)

The accurate path compiles the sketch to real MCU firmware and loads it into the hardware simulator. This path is the default for Arduino C/C++ on the UNO R3, for the C/C++ Arduino core on the ESP32, and for MicroPython, CircuitPython, and C/C++ (Arduino-Pico core / Pico SDK) on the Raspberry Pi Pico.

```
Student sketch (Arduino C/C++ / MicroPython /
                CircuitPython / Pico SDK C/C++)
         |
         v
 Pre-run Validation (FR-CODE-070)
         |
     [PASS]
         |
         v
 Build Pipeline
   +-----+-----+
   |           |
   v           v
In-browser   Compile
WASM         Micro-
toolchain    service
(offline     (cloud,
 fallback)    < 5 s p95)
   |           |
   +-----+-----+
         |
         v
  Firmware binary
  (.hex / .elf for AVR/ESP32;
   .uf2 / .elf for RP2040)
         |
         v
  Loaded into MCU simulator
  (avr8js for UNO ATmega328P /
   rp2040js for Raspberry Pi Pico /
   ESP32 core sim for ESP32)
         |
         v
  MCU executes firmware at
  simulated clock rate
  (~16 MHz AVR / 133 MHz RP2040 /
   240 MHz ESP32)
         |
  Pin state changes emitted
         |
         v
  RSE component models
  react to pin transitions
         |
         v
  wokwi-elements / Three.js
  canvas reflects component state
```

This path provides cycle-accurate register behaviour, interrupt handling, timer/PWM fidelity, and peripheral register emulation — the highest fidelity available in the platform. For the Raspberry Pi Pico the UF2 or ELF firmware image is loaded directly into the rp2040js RP2040 simulator (github.com/wokwi/rp2040js), which runs real RP2040 firmware in the browser including dual-core execution, PIO state machines, and the full ARM Cortex-M0+ instruction set.

### Simplified Execution Path (RoboCode Virtual Machine)

The RVM path interprets or translates code into a set of high-level simulator instructions without compiling to native firmware. It targets low-end devices, offline scenarios, and cases where the WASM toolchain is unavailable.

```
Student sketch (Arduino C/C++ or MicroPython)
         |
         v
 Pre-run Validation (FR-CODE-070)
         |
     [PASS]
         |
         v
 RVM Translator / Interpreter
   - Parses sketch AST
   - Maps language constructs
     to RVM instruction set
     (SetPin, ReadPin, Delay,
      SerialOut, I2CWrite, etc.)
   - Resolves library calls to
     component-action bindings
         |
         v
  RVM instruction stream
         |
         v
  RSE instruction dispatcher
  (drives component models
   directly without MCU sim)
         |
  Component state changes
         |
         v
  Canvas component rendering
```

The RVM path trades hardware fidelity for speed, offline capability, and reduced device-resource demand. Timing-sensitive sketches (e.g., bit-banged SPI, precise PWM) may behave differently between paths; a visible indicator informs the Student which path is active.

---

## Functional Requirements

### Monaco Editor Integration

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-CODE-001 | The platform **shall** embed Monaco Editor as the primary text-based code-authoring component within the RoboCode Studio Code tab. | Must | Monaco Editor (MIT licence); version pinned in package.json; loaded from CDN with SRI hash or bundled. |
| FR-CODE-002 | Monaco **shall** be configured with language-service extensions for Arduino C/C++ (clangd-derived grammar and completions), MicroPython (Pylance-compatible Python language server subset), and CircuitPython (Python language server subset with CircuitPython-specific stubs for `board`, `digitalio`, `analogio`, `busio`, and related RP2040 modules). | Must | Language services load asynchronously; editor is interactive before they complete (graceful degradation). |
| FR-CODE-003 | The editor **shall** support all Monaco built-in keyboard shortcuts including multi-cursor (Ctrl+D, Alt+Click), column selection, code folding, find/replace (Ctrl+H with regex and case toggles), and go-to-definition. | Should | Keyboard shortcut reference accessible via Ctrl+Shift+/ or a toolbar `?` button. |
| FR-CODE-004 | The editor **shall** support a minimum of three colour themes: Light, Dark, and High-Contrast Dark, selectable per user. All themes **shall** meet WCAG 2.2 Level AA contrast ratios. | Must | Theme preference stored in user profile; applied without page reload. |
| FR-CODE-005 | The editor **shall** remain interactive and accept input during asynchronous background operations (lint analysis, autocomplete fetch, project save) without blocking the UI thread. | Must | Web Workers and async APIs used for all non-trivial background work. |
| FR-CODE-006 | The editor **shall** render the execution cursor (a highlighted line indicator) in real time during simulation to show the currently executing line of code. | Must | Execution cursor lags the simulator state by at most 100 ms. Disabled automatically for tight loops executing faster than 20 iterations per second to avoid visual flicker. |

### Block-Based Authoring Mode

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-CODE-010 | The platform **shall** provide a block-based authoring environment for primary-school Students using a Scratch-style drag-and-drop block palette. | Must | Block editor is a distinct view within the Code tab, toggled by the mode selector. |
| FR-CODE-011 | The block palette **shall** include categories covering: Control (if/else, wait, call function), Logic (and/or/not, compare), Loops (repeat N, repeat forever, for-range), Math (arithmetic, random, abs, map), Text (join, print, length), Digital I/O (pinMode, digitalWrite, digitalRead), Analog I/O (analogRead, analogWrite), Serial (Serial.begin, Serial.print, Serial.println), and Components (auto-populated from the current canvas topology). | Must | All palette categories visible on a 1280 × 720 viewport without horizontal scrolling. |
| FR-CODE-012 | The block-based editor **shall** provide a real-time read-only preview of the generated Arduino C/C++ source, syntax-highlighted, updating within 500 ms of any block change. | Must | Preview pane is collapsible; a copy-to-clipboard button is provided. |
| FR-CODE-013 | A Student **shall** be able to promote a Block-Based project to Arduino C/C++ text mode with a single action. A confirmation dialog **shall** warn that the promotion is one-way and that blocks will no longer be editable after promotion. | Should | Promotion is logged in the project version history. |
| FR-CODE-014 | Block-based mode **shall** execute exclusively via the RVM simplified path. The accurate compiled path **shall not** be available in block-based mode for this release. | Must | Mode indicator in the toolbar labels the active execution path clearly. |
| FR-CODE-015 | Block-to-Arduino C/C++ transpilation **shall** produce syntactically valid output passable to the avr-gcc pre-processor without modification, enabling downstream promotion to the accurate path. | Must | Validated by automated test: transpile 50 representative block programmes and compile each to firmware without error. |

### Syntax Highlighting and Semantic Checks

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-CODE-020 | The editor **shall** provide full syntax highlighting for Arduino C/C++ covering: keywords (control flow, types, qualifiers), preprocessor directives (#include, #define, #ifdef), string and character literals, numeric literals (decimal, hex, binary), operators, comments (line and block), and Arduino-specific macros (HIGH, LOW, INPUT, OUTPUT, A0–A7). | Must | Highlighting grammar tested against a suite of 20+ representative Arduino sketches. |
| FR-CODE-021 | The editor **shall** provide full syntax highlighting for MicroPython covering: keywords, builtins, decorators, f-strings, docstrings, dunder methods, and `machine`/`uasyncio` module symbols (including RP2040-specific `rp2` module symbols). The editor **shall** additionally provide full syntax highlighting for CircuitPython covering the same Python constructs plus CircuitPython-specific module symbols (`board`, `digitalio`, `analogio`, `busio`, `pulseio`, `countio`). | Must | MicroPython and CircuitPython grammars registered as distinct Monaco language extensions; the active language ID switches automatically based on the selected board and authoring mode. |
| FR-CODE-022 | The language service **shall** perform semantic analysis for Arduino C/C++: undefined identifiers, implicit type conversions, narrowing casts, use-before-declaration, shadowed variables, and unreachable code after return. | Should | Semantic analysis runs in a Web Worker; results surfaced as Monaco markers within 2 s of the last keystroke. |
| FR-CODE-023 | The language service **shall** perform semantic analysis for MicroPython: undefined names, attribute access on unresolved types, missing imports, and deprecated `uos`/`uhashlib` aliases. | Should | Powered by a bundled MicroPython stub set; updated with platform releases. |

### Real-Time Linting and Diagnostics

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-CODE-030 | The editor **shall** display real-time inline diagnostics (lint, syntax errors, semantic warnings) as the Student types, without requiring a manual build action. | Must | Diagnostics update within 1 s of the last keystroke on a device meeting minimum specifications. |
| FR-CODE-031 | Diagnostics **shall** be rendered as: wavy underlines in the code (red = error, yellow = warning, blue = info); gutter severity icons on the line-number margin; and entries in a collapsible Problems panel listing filename, line, column, and message. | Must | Clicking a Problems panel entry navigates the cursor to the relevant line. |
| FR-CODE-032 | Lint checks for Arduino C/C++ **shall** include at minimum: missing semicolons, mismatched braces/parentheses/brackets, undeclared identifiers, unused variables, calls to undefined functions, and division-by-zero literals. | Must | Each check class has an automated regression test. |
| FR-CODE-033 | Lint checks for MicroPython **shall** include at minimum: indentation errors, undefined names in global scope, mismatched parentheses/brackets, use of Python 3 syntax incompatible with MicroPython (e.g., walrus operator, `match` statement). | Must | MicroPython-specific checks implemented as Monaco diagnostics registered for the `micropython` language ID. |
| FR-CODE-034 | A minimap overlay and scrollbar gutter **shall** highlight all diagnostic lines so Students can navigate to errors in long sketches. | Should | Minimap visible for sketches longer than 100 lines; toggle in editor toolbar. |
| FR-CODE-035 | Diagnostic messages **shall** be written in plain student-friendly language rather than raw compiler output. Where the raw compiler message is included it **shall** appear as a secondary, collapsible detail beneath the plain-language message. | Must | A curated message-mapping table translates the 50 most common avr-gcc and MicroPython error strings to plain language; unmapped messages pass through verbatim. |

### Autocomplete and Component/Library API Integration

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-CODE-040 | The editor **shall** provide context-aware autocomplete for Arduino C/C++ surfacing: standard C/C++ library symbols, the full Arduino core API (core functions, data types, macros), all pre-bundled library APIs, and user-defined functions and variables declared in the current sketch. | Must | Autocomplete triggered on any printable character and on Ctrl+Space. First suggestion appears within 300 ms on a standard connection. |
| FR-CODE-041 | The editor **shall** provide context-aware autocomplete for MicroPython surfacing: Python 3 builtins, MicroPython-specific modules (`machine`, `utime`, `uasyncio`, `network`, `ujson`, `ubinascii`, `urandom`), RP2040-specific MicroPython modules (`rp2`, `machine.Pin`, `machine.ADC`, `machine.PWM`, `machine.I2C`, `machine.SPI`, `machine.UART`), and user-defined names. The editor **shall** additionally provide context-aware autocomplete for CircuitPython surfacing: Python 3 builtins, CircuitPython core modules (`board`, `digitalio`, `analogio`, `busio`, `pulseio`, `countio`, `neopixel`, `adafruit_hid`), and user-defined names. | Must | MicroPython and CircuitPython stubs bundled locally; no network request required for completion on pre-bundled symbols. Stubs are board-scoped: RP2040 stubs activate when the Raspberry Pi Pico board is selected; ESP32 stubs activate for ESP32. |
| FR-CODE-042 | Autocomplete suggestions **shall** include an inline documentation popover showing: function signature, parameter names and types, return type, a one-line description, and a brief usage example. | Should | Documentation sourced from bundled JSDoc/docstring stubs; popover appears within 200 ms of highlighting the suggestion. |
| FR-CODE-043 | When a Student places a component on the Canvas, the editor **shall** automatically suggest the corresponding `#include` directive(s) and initialisation boilerplate via a non-blocking notification banner within the Code tab. | Must | Suggestion can be accepted (inserts snippet), dismissed, or expanded to show the full snippet before insertion. The component-to-library mapping is defined in the Component Catalogue (see *Component and Sensor Library Specification*). |
| FR-CODE-044 | Autocomplete **shall** be aware of which pins a component is wired to on the canvas and **shall** pre-populate pin-number arguments in suggested snippets with the correct values from the current wiring topology. | Should | Pin resolution queries the RSE circuit model. If pins are unconnected the snippet uses a placeholder constant (e.g., `PIN_UNDEFINED`). |

### Wokwi-Compatible Library Management

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-CODE-050 | The platform **shall** provide a searchable **Library Manager** panel listing all pre-bundled libraries. A Student **shall** be able to insert an `#include` directive and skeleton usage code for any library from this panel. | Must | Panel accessible from the editor toolbar; search returns results within 500 ms. |
| FR-CODE-051 | The following libraries **shall** be pre-bundled and available for inclusion without requiring an internet connection or Student-initiated download: `Wire` (I2C), `SPI`, `Servo`, `LiquidCrystal_I2C`, `Adafruit_SSD1306`, `Adafruit_GFX`, `DHT sensor library`, `OneWire`, `DallasTemperature`, `MFRC522`, `FastLED`, `Adafruit_NeoPixel`, `Stepper`, `Keypad`, `IRremote`, `MPU6050`, `Adafruit_PWMServoDriver`, `SD`, and `RTClib`. | Must | Validate by inserting each `#include` in a new sketch and confirming zero "file not found" diagnostics. |
| FR-CODE-052 | Pre-bundled library versions **shall** be pinned and tested for compatibility with the in-browser WASM toolchain and avr8js; version upgrades **shall** require regression testing before deployment. | Must | Library version manifest stored in the repository; CI gate blocks deployment if versions diverge from the manifest. |
| FR-CODE-053 | MicroPython equivalents of the above libraries **shall** be pre-bundled for ESP32 projects where a stable MicroPython port exists (e.g., `ssd1306.py`, `dht.py`, `servo.py`, `neopixel` built-in, `mpu6050.py`). MicroPython and CircuitPython module equivalents **shall** additionally be pre-bundled for Raspberry Pi Pico projects (e.g., `ssd1306.py`, `neopixel` built-in, `servo.py`, CircuitPython `adafruit_ssd1306`, `adafruit_motor`, `adafruit_neopixel`). | Must | MicroPython and CircuitPython module stubs available for autocomplete; actual runtime modules pre-loaded into the rp2040js simulator filesystem for the Raspberry Pi Pico. |
| FR-CODE-054 | The Library Manager **shall** display for each library: library name, version, licence, a short description, supported boards, and a link to the library API reference in the Help & Docs panel. | Should | Information sourced from a bundled library manifest; no live internet request required. |
| FR-CODE-055 | A Teacher **shall** be able to add additional approved libraries to their school's library catalogue via the School Admin panel. Such libraries **shall** undergo a moderation and security review by a Super Admin before becoming available to Students. | Could | Custom library submission workflow; review queue in the platform administration interface. |

### Build and Translation Pipeline

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-CODE-060 | The platform **shall** determine which execution path (accurate / RVM) to use based on: authoring mode, selected board, device capability, and connectivity state. The selection logic **shall** be transparent to the Student via a visible path indicator in the toolbar. | Must | Accurate path: Arduino C/C++ on UNO R3 or ESP32 with WASM toolchain available; MicroPython, CircuitPython, and C/C++ (Arduino-Pico core / Pico SDK) on Raspberry Pi Pico with rp2040js available. RVM path: block-based mode, low-end device fallback, offline fallback. |
| FR-CODE-061 | For the **accurate path**, the platform **shall** compile the Student's sketch to real MCU firmware: AVR firmware using an in-browser WASM AVR toolchain (avr-gcc compiled to WebAssembly) for the UNO R3; Xtensa firmware for the ESP32; or ARM Cortex-M0+ firmware (UF2 or ELF) using the Arduino-Pico core toolchain or the Pico SDK toolchain for the Raspberry Pi Pico. The compiled binary **shall** then be loaded into the appropriate MCU simulator: avr8js (UNO R3), the ESP32 core simulator (ESP32), or rp2040js (Raspberry Pi Pico). MicroPython and CircuitPython images for the Pico are loaded as pre-built runtime UF2 images with the Student's `.py` source injected into the simulator filesystem; no C/C++ compilation step is required for those languages. | Must | End-to-end compile-to-first-simulation-tick latency shall not exceed 3 s for sketches under 2 000 lines on a device meeting the minimum hardware specification defined in *Non-Functional Requirements*. |
| FR-CODE-062 | The platform **shall** provide a **compile microservice** as an alternative compilation backend to the in-browser WASM toolchain. The compile microservice **shall** accept the sketch source, library manifest, and target board identifier over HTTPS; return a firmware binary; and complete the round-trip within 5 s at the 95th percentile under normal load. | Must | The microservice is the primary path when the device cannot run the WASM toolchain efficiently (CPU/RAM constraints detected at session start). |
| FR-CODE-063 | The compile microservice **shall** run in an isolated sandboxed container with no outbound network access, filesystem write access scoped to a per-request ephemeral directory, and a strict CPU/memory ceiling per compilation job. | Must | Security isolation prevents code injection; see *Security, Privacy and Child Safety* (SR-nnn). |
| FR-CODE-064 | Compilation errors from the WASM toolchain or compile microservice **shall** be parsed, mapped to line numbers in the Student's source, and surfaced as Monaco diagnostics using the same plain-language error-mapping table as the real-time linter. | Must | Raw toolchain stderr is retained in the error detail pane but not shown by default. |
| FR-CODE-065 | For the **RVM simplified path**, the platform **shall** parse the sketch into an abstract syntax tree (AST) and translate it into a sequence of RVM instructions. The RVM instruction set **shall** cover: `SetDigitalPin`, `GetDigitalPin`, `SetAnalogPin`, `GetAnalogPin`, `Delay`, `SerialWrite`, `SerialRead`, `I2CWrite`, `I2CRead`, `SPITransfer`, `PWMSet`, `InterruptAttach`, `InterruptDetach`, and a general `ComponentAction` escape hatch for library-specific operations. | Must | RVM instruction set version-controlled; breaking changes require a version bump and migration path. |
| FR-CODE-066 | The RVM **shall** interpret the instruction stream and dispatch each instruction to the corresponding RSE component model at a simulated execution rate configurable between 1x and 100x real-time speed. | Should | Speed control slider in the Studio toolbar; default is 1x. High-speed mode useful for testing long-running state-machine sketches. |
| FR-CODE-067 | The RVM **shall** detect and handle infinite loops by enforcing a configurable watchdog timer (default: 10 s of simulated time per tick without a `Delay` or I/O instruction); on watchdog expiry the RVM **shall** halt and surface a plain-language error ("Your loop is running without any delay — the microcontroller appears stuck. Try adding a `delay()` call."). | Must | Watchdog threshold configurable by Super Admin (platform default) and overridable by Teacher per class. |
| FR-CODE-068 | When the accurate path is active and avr8js detects a hardware exception (stack overflow, illegal instruction, watchdog reset), the RSE **shall** halt simulation, capture the program counter, map it back to the sketch source line, and surface a plain-language error in the Error Console. | Must | Mapping from firmware address to source line requires the debug symbol table (.elf) produced alongside the .hex; compile pipeline must retain this file for the duration of the session. |

### Raspberry Pi Pico (RP2040) Language and Firmware Support

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-CODE-140 | The platform **shall** support MicroPython as a first-class language for the Raspberry Pi Pico board, providing editing, linting, autocomplete, pre-run validation, and accurate-path execution via rp2040js. | Must | A pre-built MicroPython UF2 runtime image for RP2040 is bundled with the platform; the Student's `.py` source is injected into the rp2040js simulator filesystem and executed by the embedded MicroPython interpreter. |
| FR-CODE-141 | The platform **shall** support CircuitPython as a first-class language for the Raspberry Pi Pico board, providing editing, linting, autocomplete, pre-run validation, and accurate-path execution via rp2040js. | Must | A pre-built CircuitPython UF2 runtime image for RP2040 is bundled with the platform; the Student's `code.py` source is injected into the rp2040js simulator filesystem and executed by the embedded CircuitPython interpreter. |
| FR-CODE-142 | The platform **shall** support C/C++ using the Arduino-Pico core as a language and build target for the Raspberry Pi Pico board. The in-browser WASM toolchain or compile microservice **shall** compile the sketch using the Arduino-Pico core (targeting RP2040) and produce a UF2 or ELF firmware image loaded into rp2040js. | Must | Compilation uses the same two-path (WASM / compile microservice) model as for the UNO R3 and ESP32; compile-to-first-tick latency must not exceed 5 s at the 95th percentile. |
| FR-CODE-143 | The platform **shall** support C/C++ using the Raspberry Pi Pico SDK as an advanced language and build target for the Raspberry Pi Pico board. The compile microservice **shall** compile Pico SDK projects (with `CMakeLists.txt` support) and produce an ELF/UF2 firmware image loaded into rp2040js. | Should | Pico SDK projects may define PIO programs; the compile microservice shall include the `pioasm` assembler. In-browser WASM toolchain support for Pico SDK is a future enhancement. |
| FR-CODE-144 | For MicroPython and CircuitPython on the Raspberry Pi Pico, pre-run validation **shall** additionally check: presence of the required entry point (`while True:` loop or `code.py` conventions), valid import statements for RP2040-compatible modules, and ADC pin assignments restricted to GP26, GP27, GP28 or the internal temperature channel. | Must | RP2040-specific validation rules registered in the pre-run validation engine; violations surface as Monaco diagnostics before the Run button is enabled. |
| FR-CODE-145 | When the accurate path is active for a Raspberry Pi Pico project and rp2040js detects a hardware exception or the MicroPython/CircuitPython interpreter raises an unhandled exception, the RSE **shall** halt simulation, capture the traceback, and surface a plain-language error in the Error Console with the offending source line highlighted. | Must | For C/C++ Pico projects the ELF debug symbol table is used to map program-counter addresses to source lines, consistent with FR-CODE-068. For MicroPython/CircuitPython the interpreter traceback provides the line reference directly. |
| FR-CODE-146 | The platform **shall** simulate the Raspberry Pi Pico's PIO (Programmable I/O) state machines within rp2040js for C/C++ Pico SDK projects that define PIO programs. PIO behaviour visible to Student code (FIFO data, GPIO pin states driven by PIO) **shall** be reflected in the canvas component models. | Should | PIO simulation fidelity is subject to rp2040js capabilities; limitations are documented in the Help & Docs. PIO support is not required for MicroPython or CircuitPython modes in this release. |
| FR-CODE-147 | The Serial Monitor **shall** display UART output from Raspberry Pi Pico projects across all supported languages (MicroPython `print()`, CircuitPython `print()`, Arduino-Pico `Serial.print()`, Pico SDK `stdio_usb` / `printf`) in real time during rp2040js simulation. | Must | USB serial emulation in rp2040js routes stdout/UART0 to the Serial Monitor pane; no behavioural difference visible to the Student compared with UNO R3 or ESP32 serial output. |

### Code-to-Component I/O Mapping

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-CODE-069 | The platform **shall** maintain a mapping table from Arduino/MicroPython I/O API calls to RSE component-model actions. This mapping must be bidirectional: code calls update component state, and interactive component state changes (e.g., a Student pressing a simulated button) are reflected as pin-state changes visible to running code. | Must | Mapping table documented in *Component and Sensor Library Specification*; validated per component. The specific I/O-mapping sub-requirements are FR-CODE-074 through FR-CODE-079 below. |
| FR-CODE-074 | `digitalWrite(pin, HIGH/LOW)` **shall** set the corresponding digital output pin on the simulated board; connected components (LED, relay, motor driver) **shall** respond within 50 ms of the pin transition in the 2D canvas. | Must | Latency measured from RSE pin event to wokwi-element visual update. |
| FR-CODE-075 | `analogWrite(pin, value)` **shall** set the simulated PWM duty cycle; components sensitive to PWM (servo position, motor speed, LED brightness) **shall** update their rendered state accordingly. | Must | Servo angle calculation must match the standard 1 ms–2 ms pulse mapping. |
| FR-CODE-076 | `analogRead(pin)` **shall** return a value (0–1023 for UNO 10-bit ADC; 0–4095 for ESP32 12-bit ADC; 0–65535 for Raspberry Pi Pico 12-bit ADC via the RP2040 `machine.ADC` 16-bit-normalised API) derived from the simulated component connected to that pin (potentiometer wiper position, photoresistor illuminance model, thermistor temperature model, etc.). The Pico's three ADC-capable GPIO pins (GP26/GP27/GP28) and internal temperature sensor channel (ADC4) **shall** all be simulated. | Must | Interactive sliders in the 2D canvas let the Student set simulated sensor values during runtime. |
| FR-CODE-077 | `Serial.print()` / `Serial.println()` output **shall** appear in the Serial Monitor in real time; `Serial.read()` / `Serial.available()` **shall** consume characters submitted via the Serial Monitor input field. | Must | Round-trip latency (Student types in Serial Monitor → code reads value) shall not exceed 100 ms. |
| FR-CODE-078 | I2C (`Wire.begin()`, `Wire.beginTransmission()`, `Wire.write()`, `Wire.endTransmission()`, `Wire.requestFrom()`, `Wire.read()`) **shall** be dispatched by the RSE to the I2C peripheral model of the addressed component (LCD backpack, OLED, MPU6050, DS3231, etc.). | Must | I2C address conflicts (two components with same address on the bus) **shall** be detected and flagged as a canvas warning before simulation starts. |
| FR-CODE-079 | Library calls (e.g., `lcd.print()`, `servo.write()`, `strip.setPixelColor()`, `dht.readTemperature()`) **shall** be resolved by the RSE component-binding layer to the corresponding component model actions on the canvas. | Must | Resolution uses the pin-to-component wiring map from the canvas topology; unresolved library calls surface a runtime warning rather than a crash. |

### Pre-Run Validation

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-CODE-070 | Before initiating simulation (on either execution path), the platform **shall** perform a pre-run validation pass covering: syntax errors in the sketch, unresolved `#include` directives, missing `setup()` or `loop()` functions for Arduino C/C++, canvas wiring errors (unconnected required pins, power/ground missing), and I2C address conflicts. | Must | The Run button is disabled and an orange badge shows the error count while any Error-severity diagnostic is present. Warnings do not block execution but appear in the Problems panel. |
| FR-CODE-071 | The pre-run validation report **shall** list all issues grouped by category (Code Errors, Wiring Errors, Library Warnings) with actionable fix suggestions inline. | Must | "Fix" links navigate to the relevant line in the editor or the offending component on the canvas. |
| FR-CODE-072 | Pre-run validation **shall** complete within 500 ms for sketches under 1 000 lines on a device meeting minimum specifications, so it does not introduce perceptible delay between the Student clicking Run and execution starting. | Must | Validation runs synchronously on the main thread for this fast path; longer sketches may use a Web Worker with a progress indicator. |
| FR-CODE-073 | A Teacher **shall** be able to configure additional pre-run checks for an assignment (e.g., "must declare a variable named `sensorValue`", "must call `Serial.begin()`") that are evaluated before the Student can submit the assignment. | Should | Teacher-defined checks are expressed as a simple pattern list in the assignment editor; non-matching sketches show a "Requirements not met" panel rather than a hard block. |

### Runtime Error Reporting

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-CODE-080 | Runtime errors detected during simulation **shall** be surfaced in a dedicated **Error Console** panel within the Code tab, distinct from the pre-run Problems panel. | Must | Error Console auto-opens on first runtime error; Student can close and reopen it from the toolbar. |
| FR-CODE-081 | Each runtime error entry **shall** include: a plain-language error title, a brief explanation of the cause, the sketch line number (where derivable from the debug symbol table or AST), the simulated time at which the error occurred, and a "Learn more" link to the contextual help article for that error class. | Must | Plain-language titles maintained in a curated error catalogue (separate from the lint catalogue); unmapped errors display "Unexpected simulation error" with the raw detail in a collapsible pane. |
| FR-CODE-082 | On a runtime error that halts simulation, the editor **shall** highlight the offending line (or the closest derivable line) with a red gutter marker and a wavy underline distinct from the compile-time lint markers. | Should | Runtime error gutter markers are cleared when the Student clicks Stop or edits the sketch. |
| FR-CODE-083 | The RVM watchdog-timeout error **shall** display a specific, actionable message explaining infinite-loop risk and suggesting `delay()` insertion or loop-termination conditions. | Must | Message text must be age-appropriate; primary-school variant uses simpler vocabulary. |
| FR-CODE-084 | For avr8js hardware exceptions the platform **shall** display the exception class (e.g., "Stack Overflow", "Illegal Instruction", "Watchdog Reset"), the program-counter value, and the closest sketch line if the symbol table is available; otherwise the raw address. | Should | Symbol table availability depends on accurate-path compile retaining the .elf file in session storage. |
| FR-CODE-085 | The Serial Monitor **shall** remain visible and scrollable after a runtime error so that Students can inspect Serial output produced before the halt. | Must | Error state does not clear the Serial Monitor buffer. |

### Guarded AI Hint Assistant

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-CODE-090 | The platform **shall** include a **Guarded AI Hint Assistant** within the Code tab, invocable by the Student via an explicit button action. The assistant **shall not** appear automatically without Student initiation. | Must | UI panel is collapsible; no ambient or push hints are generated without Student request. |
| FR-CODE-091 | The AI Hint Assistant **shall** operate exclusively in **Socratic / hint-only mode**: it guides the Student toward the solution through targeted questions and partial clues, and **shall not** emit complete working code blocks, complete loop bodies, complete function implementations, or direct answers to assigned tasks. | Must | Guardrail enforced at the system-prompt/instruction level of the AI model; output is post-processed with a code-block detector that strips code blocks exceeding a configurable line threshold (default: 3 lines for high school, 0 lines for primary school). |
| FR-CODE-092 | The AI Hint Assistant **shall** receive the following context in its prompt: the full current sketch source, the five most recent error diagnostics (code and message), a summary of the canvas component topology (component names and wired pin assignments), and the current task description if a task is active in the Learning Management system. | Must | Context is assembled server-side by the Code Service; no raw canvas JSON or PII is included in the AI prompt. |
| FR-CODE-093 | All AI Hint Assistant interactions **shall** be logged per Student, per session, with: timestamp, Student account ID (not name), tenant ID, prompt text, and response text. Logs **shall** be retained for a minimum of 12 months or the school's data-retention policy (whichever is longer) and **shall** be accessible to the Teacher and School Admin for safeguarding and academic-integrity review. | Must | Log entries are write-once and immutable; deletion requires Super Admin action with a recorded justification. Cross-reference: *Functional Requirements: Administration, Analytics and Reporting* (FR-ADM). |
| FR-CODE-094 | A Teacher **shall** be able to disable the AI Hint Assistant for a specific assignment or for an entire class. The disabled state **shall** be enforced in the editor UI (the Hint button is hidden or greyed with an explanatory tooltip) and **shall** propagate to all active Student sessions within 5 s. | Must | Disabled state transmitted via the Socket.IO real-time channel as a session-configuration event. |
| FR-CODE-095 | The AI Hint Assistant **shall** apply content-moderation filters to both incoming Student prompts and outgoing AI responses: profanity filter, PII detection (to prevent echoing of personal information), and off-topic deflection for non-programming queries. Rejected or deflected responses **shall** be replaced with a generic explanation ("I can only help with coding questions for this project."). | Must | Filters run server-side before the response reaches the client. Cross-reference: *Functional Requirements: Communication, Notifications and Moderation* (FR-MOD). |
| FR-CODE-096 | For Students whose age tier is primary school (age < 13 on their profile), the AI Hint Assistant **shall** be restricted to block-palette guidance only (visual explanations, block suggestions) and **shall** not return text-code snippets of any length. | Must | Age tier enforced server-side at the Code Service level; client-side enforcement is supplementary. |
| FR-CODE-097 | The AI Hint Assistant **shall** display a persistent disclaimer visible within the panel: "Hints are AI-generated and may contain errors. Always test your code and check the Help & Docs." This disclaimer **shall not** be permanently dismissible. | Must | Disclaimer rendered as a fixed footer within the Hint panel; cannot be hidden by any Student action. |
| FR-CODE-098 | The AI Hint Assistant **shall** be rate-limited to a maximum of 10 hint requests per Student per hour (configurable by the School Admin between 5 and 30). The current usage count **shall** be displayed in the panel ("6 of 10 hints used this hour"). The counter resets on the clock hour. | Should | Rate-limit state tracked in Redis per Student session; enforced server-side. Client shows remaining count. |
| FR-CODE-099 | The AI Hint Assistant **shall** refuse to process requests where the Student prompt contains content that triggers the profanity filter, the off-topic classifier, or PII detection. The refusal message **shall** be plain-language and age-appropriate. | Must | Refusal events are included in the AI interaction log (FR-CODE-093) with a `REFUSED` status flag. |
| FR-CODE-086 | The third-party LLM provider used by the AI Hint Assistant **shall** be governed by a signed Data Processing Agreement (DPA) listing it as a sub-processor; the provider **shall** be contractually obligated to (a) **not** use any prompt or response data for training or improving its models (zero-training / opt-out of model training), and (b) honour a **zero-data-retention** or minimal-retention (≤ 30 days, abuse-monitoring only) policy. Student prompts containing minor data **shall not** be sent to any provider lacking these contractual guarantees. | Must | The LLM provider is added to the public sub-processor list (see API Specification and Integration Interfaces, IR). Verified by procurement/legal review before enabling the feature for any tenant. Resolves the FR-CODE-090 series provider-obligation gap. |
| FR-CODE-087 | LLM inference for the AI Hint Assistant **shall** be routed to a provider endpoint in an EU or African (e.g., South Africa) data region consistent with the student-data residency requirement (NFR-COMP-002); cross-border transfer **shall** be covered by Standard Contractual Clauses (SR-COMP-034). Where no compliant region is available, the feature **shall** remain disabled for affected tenants. | Must | Endpoint region pinned per deployment; verified in IaC/config review. Cross-reference IR sub-processor entries for the AI provider. |

### Code Persistence and Versioning

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-CODE-100 | Code **shall** be persisted as part of the project bundle, co-located with the canvas layout, wiring configuration, and simulation state. The project bundle format **shall** be documented in *Data Architecture and Database Design* (DR-PROJECT). | Must | Bundle includes source files for each authoring mode (.ino, .py, blocks .json), canvas topology JSON, and project metadata. |
| FR-CODE-101 | The editor **shall** auto-save code to the backend at a minimum frequency of every 30 seconds while the Student is actively editing, and immediately on a deliberate save action (Ctrl+S or the Save button). | Must | Auto-save state indicator (spinner → checkmark) shown in the editor toolbar. At most 30 seconds of edits can be lost on a clean disconnect. |
| FR-CODE-102 | The platform **shall** maintain a version history for each project retaining at minimum the last 50 auto-save snapshots and all manual save points, for a minimum of 90 days from the last Student activity on the project. | Should | Version history accessible from the History panel in the Code tab; each entry shows: timestamp, authoring mode, line count delta, and an optional Student-provided label. |
| FR-CODE-103 | A Student **shall** be able to restore any version from the history. Before restoration the platform **shall** offer to save the current unsaved state as a labelled checkpoint. Restoration is non-destructive. | Should | The pre-restore checkpoint is created automatically if unsaved changes exist. |
| FR-CODE-104 | A Teacher **shall** be able to view the full version history of any Student's project within their class in read-only mode, without altering the Student's working copy. Teacher read access **shall** be recorded in the project audit trail. | Must | Cross-reference: *Functional Requirements: Learning Management and Content* (FR-LRN). |
| FR-CODE-105 | When a Student submits an assignment, the platform **shall** capture a **submission snapshot** of the code and canvas state at the exact moment of submission. The snapshot **shall** be stored as an immutable record associated with the assessment. The Student may continue editing their working copy after submission; the snapshot is unaffected. | Must | Submission snapshot stored in S3-compatible object storage with an immutability policy. Cross-reference: *Functional Requirements: Learning Management and Content* (FR-LRN). |
| FR-CODE-106 | A Student **shall** be able to export their project as a downloadable `.ino` (Arduino C/C++) or `.py` (MicroPython) file, or as a ZIP archive containing all project files including a `diagram.json` in Wokwi-compatible format to enable interoperability with the Wokwi online simulator. | Should | Export action in File menu; export excludes any Teacher-provided read-only scaffold regions. |
| FR-CODE-107 | For collaborative projects (where the Team feature is active), the code editor **shall** support real-time co-editing by multiple Students simultaneously using Yjs CRDT. Each collaborator's cursor **shall** be shown in a distinct colour labelled with their display name. | Should | Concurrent edits resolved by CRDT merge with no data loss. Cross-reference: *Functional Requirements: Teams, Competitions and Gamification* (FR-TEAM). |
| FR-CODE-108 | Project files and version snapshots **shall** be stored in S3-compatible object storage with server-side encryption at rest (AES-256). Access **shall** be restricted by tenant and Student ownership via the API layer; no direct S3 presigned URLs exposed to Students for project data. | Must | Cross-reference: *Security, Privacy and Child Safety* (SR-nnn) and *Data Architecture and Database Design* (DR-nnn). |

### Code Templates and Worked Examples

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-CODE-110 | The platform **shall** provide a **Code Templates** panel offering starter sketches for common component patterns drawn from the Component Catalogue (e.g., blink an LED, read HC-SR04 ultrasonic distance, display text on a 16x2 LCD, spin SG90 servo to a target angle, read DHT11 temperature and humidity, WS2812 NeoPixel colour cycle). | Must | Templates filterable by component name and by board (UNO R3 / ESP32 / Raspberry Pi Pico) and by language (Arduino C/C++ / MicroPython / CircuitPython / Pico SDK C/C++). Inserting a template opens a dialog to choose: replace current sketch, insert at cursor, or open in new project. |
| FR-CODE-111 | A Teacher **shall** be able to author custom code templates and publish them to their class's Code Templates panel. Teachers **shall** optionally be able to lock regions of a template as read-only scaffold that Students cannot edit. | Should | Read-only scaffold regions rendered with a visually distinct background (e.g., a subtle stripe pattern). Students can add code in unrestricted regions. |
| FR-CODE-112 | The **Help & Docs** panel **shall** include worked examples for each major component in the Component Catalogue. Each worked example **shall** include: annotated source code, a pre-wired canvas configuration that loads alongside the code, and an explanation written at two reading levels (primary / high school, toggled by the Student). | Must | Worked examples launchable as isolated sandbox projects; launching does not overwrite the Student's current work. |

---

## Serial Monitor and Debug Tools

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-CODE-120 | The platform **shall** provide a **Serial Monitor** pane dockable at the bottom or side of the Code tab. The pane **shall** display `Serial.print()` / `Serial.println()` output (Arduino) and `print()` output (MicroPython) in real time during simulation. | Must | Output is timestamped with simulated time. Font is monospace. Pane scrolls automatically; auto-scroll can be toggled off. |
| FR-CODE-121 | The Serial Monitor **shall** include an input field that accepts ASCII text from the Student, sending it to the simulated board's serial RX buffer on pressing Enter. | Must | Input simulates serial bytes received by the MCU; `Serial.read()` and `Serial.available()` return the correct values. |
| FR-CODE-122 | The platform **shall** provide a **Step-Through / Debug** mode where the Student can pause simulation, step line-by-line through the sketch, and inspect declared variables in a Watch panel. | Should | Watch panel shows: variable name, declared type, current value. Arrays truncated to the first 10 elements with an expand control. |
| FR-CODE-123 | The Student **shall** be able to set persistent breakpoints by clicking the gutter at any executable line. Breakpoints **shall** pause simulation when the execution cursor reaches that line. Breakpoints persist for the session and are listed in the Debug panel. | Should | Breakpoints shown as filled circles in the gutter. Up to 20 breakpoints per session. |

---

## Accessibility and Internationalisation

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-CODE-130 | The code editor and all associated panels **shall** conform to WCAG 2.2 Level AA: fully keyboard-navigable, ARIA labels on all interactive controls, and sufficient colour contrast on all text and iconography. | Must | Validated by automated axe-core scan (zero critical/serious violations) and manual screen-reader test (NVDA/VoiceOver). Cross-reference: *Accessibility, Internationalisation and Low-Bandwidth Design*. |
| FR-CODE-131 | All user-facing strings in the Code tab (error messages, UI labels, diagnostics, templates, AI Hint responses) **shall** be externalised to an i18n resource file. The initial release **shall** ship English (en-GB). Additional locales (French, Swahili, Shona, Zulu) are targeted in post-launch releases. | Should | No hard-coded English strings in React components; all strings keyed through an i18n library (e.g., react-i18next). |
| FR-CODE-132 | The block-based editor **shall** support right-to-left (RTL) layout for future locale support without requiring a re-implementation of the block engine. | Could | RTL layout validated by enabling a test Arabic locale in the block editor. |

---

## MoSCoW Priority Summary

| Priority | Requirement IDs |
|----------|-----------------|
| Must | FR-CODE-001, 002, 004, 005, 006, 010, 011, 012, 014, 015, 020, 021, 030, 031, 032, 033, 035, 040, 041, 043, 050, 051, 052, 053, 060, 061, 062, 063, 064, 065, 067, 068, 069 (all sub-items), 070, 071, 072, 080, 081, 083, 085, 090, 091, 092, 093, 094, 095, 096, 097, 099, 100, 101, 104, 105, 108, 110, 112, 120, 121, 130, 140, 141, 142, 144, 145, 147 |
| Should | FR-CODE-003, 013, 022, 023, 034, 042, 044, 054, 066, 073, 082, 084, 098, 102, 103, 106, 107, 111, 122, 123, 131, 143, 146 |
| Could | FR-CODE-055, 132 |
| Won-t (this release) | Block-Based to MicroPython/CircuitPython transpilation; full hardware JTAG/GDB debugger integration; AI-generated complete project scaffolding; Student-initiated library upload from npm/PyPI; remote flashing to physical hardware; Raspberry Pi Pico W (CYW43439 Wi-Fi/BLE) simulation. |

---

## Cross-References

| Requirement Area | Referenced Section |
|------------------|--------------------|
| RSE component models, pin-state events | Functional Requirements: RoboCode Simulation Engine (RSE) |
| Canvas topology, wiring validation | Functional Requirements: RoboCode Studio IDE |
| Component-to-library mapping | Component and Sensor Library Specification |
| Project bundle format, version storage | Data Architecture and Database Design (DR-PROJECT) |
| Submission snapshots, Teacher access | Functional Requirements: Learning Management and Content (FR-LRN) |
| Collaborative editing (Yjs CRDT) | Functional Requirements: Teams, Competitions and Gamification (FR-TEAM) |
| AI interaction logging, retention | Functional Requirements: Administration, Analytics and Reporting (FR-ADM) |
| Content moderation filters | Functional Requirements: Communication, Notifications and Moderation (FR-MOD) |
| Compile microservice isolation | Security, Privacy and Child Safety (SR-nnn) |
| S3 encryption, access control | Security, Privacy and Child Safety (SR-nnn) |
| WCAG 2.2, i18n, low-bandwidth | Accessibility, Internationalisation and Low-Bandwidth Design |
| Identity, age-tier enforcement | Functional Requirements: Identity, Authentication and Authorization (FR-AUTH) |
| Tenant policy, mode restrictions | Functional Requirements: Multi-Tenancy, Custom Domains and White-Labelling (FR-TEN) |

---

## Rationale

**Two execution paths across three first-class boards.** The accurate compiled path runs real MCU firmware inside hardware simulators (avr8js for the Arduino UNO R3, rp2040js for the Raspberry Pi Pico, and the ESP32 core simulator for the ESP32 DevKit) and is essential for high-school learners who need cycle-accurate timing, interrupt support, and hardware-peripheral fidelity. The Raspberry Pi Pico path extends this to MicroPython, CircuitPython, and C/C++ (Arduino-Pico core / Pico SDK), with UF2/ELF firmware images loaded into rp2040js. The RVM simplified path provides a fast, offline-capable, low-resource fallback critical for the African connectivity context and for primary-school block-based use. Both paths share the same pre-run validation, Serial Monitor, and error-reporting infrastructure so the learning experience is consistent regardless of which path is active.

**Guarded AI Hint Assistant rather than full AI pair-programmer.** Academic integrity and genuine skill development require Students to solve problems themselves. A Socratic hint model mirrors pedagogical best practice: the assistant scaffolds understanding rather than supplying answers. Strict logging and Teacher oversight make the assistant a transparent learning aid rather than an academic-integrity risk. Age-tier restrictions (no code snippets for primary-school Students) reflect both developmental appropriateness and child-safety obligations under COPPA and GDPR-K.

**Wokwi-compatible library set.** Aligning the pre-bundled library set with the Wokwi ecosystem maximises interoperability and allows Students to export projects and continue working in the Wokwi online simulator. It also allows RoboCode Studio to benefit from the active Wokwi community's component models and library ports.

**Auto-include suggestions on component placement.** A persistent pain point for beginners is the disconnect between placing a sensor on the canvas and not knowing which library to import. Bridging this gap at the moment of action reduces frustration and reinforces the relationship between physical components and code — a key pedagogical goal of the platform.
