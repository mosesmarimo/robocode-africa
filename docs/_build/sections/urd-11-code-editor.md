# User Requirements: Code Editor and Programming

## Overview

This section defines the user requirements for the RoboCode Studio code editor and the programming experience it delivers. The code editor is the primary authoring environment within RoboCode Studio where Students write, run, inspect, and iterate on programs that drive simulated electronics and robotics. It must cater to a wide spectrum of learners—from primary-school students using a visual block-based interface to high-school students writing production-quality Arduino C/C++ or MicroPython—while consistently mapping code to simulator actions in real time through the RoboCode Simulation Engine (RSE) and RoboCode Virtual Machine (RVM).

The editor resides in a dedicated **Code** tab within RoboCode Studio, side-by-side with the **Canvas** tab (component placement and wiring). The two tabs share persistent project state; code and circuit topology are saved and versioned together. Cross-references to the canvas and wiring requirements appear in *User Requirements: RoboCode Studio Canvas, Components and Wiring*. Cross-references to simulation execution appear in *User Requirements: Simulation Experience*. Cross-references to task submission and assessment appear in *User Requirements: Learning, Courses, Tasks and Assessment*.

---

## Programming Language and Mode Support

RoboCode Studio exposes five authoring modes, selectable per project by the Student (subject to age-tier policy set by the School Admin or Teacher):

| Mode | Languages / Syntax | Target Audience |
|---|---|---|
| Block-Based | Graphical Scratch-style blocks; transpiles to Arduino C/C++ | Primary-school students (typically ages 8–12) |
| Text – Arduino C/C++ | Arduino dialect of C/C++ (avr-gcc / Arduino-Pico core compatible) | High-school students, UNO R3, ESP32, Raspberry Pi Pico (C path) |
| Text – MicroPython | MicroPython for ESP32 and Raspberry Pi Pico (`machine`, `uasyncio`, `rp2040` libs) | High-school students, ESP32 and Pico boards |
| Text – CircuitPython | CircuitPython targeting the Raspberry Pi Pico (RP2040) | High-school students, Raspberry Pi Pico board |
| Text – Pico SDK C/C++ | Pico SDK C/C++ targeting the RP2040 directly (no Arduino layer) | Advanced students, Raspberry Pi Pico board |

Switching from Block-Based to a text mode shows the generated source code and offers a one-way promotion dialog. Switching back after manual text edits is disallowed to preserve student intent; a warning dialog explains this.

---

## User Requirements Table

### UR-CODE-001 to UR-CODE-020: Authoring Modes

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-CODE-001 | A Student shall be able to select Block-Based, Arduino C/C++, MicroPython, CircuitPython, or Pico SDK C/C++ mode per project, subject to board and teacher policy. | Must | Mode selector visible in editor toolbar; board-incompatible modes are greyed with a tooltip explaining the restriction (e.g. CircuitPython and Pico SDK options are hidden when the active board is UNO R3 or ESP32). |
| UR-CODE-002 | Block-Based mode shall provide a drag-and-drop palette of blocks covering: digital/analog I/O, delay, loops, conditionals, variables, math, strings, serial print, sensor reads, actuator controls, and functions. | Must | All palette categories visible on a standard 1280×720 viewport without horizontal scrolling. |
| UR-CODE-003 | A Student in Block-Based mode shall be able to view the equivalent generated Arduino C/C++ source at any time in a read-only preview pane. | Must | Preview pane is syntax-highlighted and updates live as blocks change. |
| UR-CODE-004 | A Student shall be able to promote (graduate) a Block-Based project to Arduino C/C++ mode with a single action. | Should | A dialog warns that the promotion is one-way and that blocks will no longer be editable. |
| UR-CODE-005 | The Arduino C/C++ editor shall accept the full Arduino language API (core functions, data types, macros) compatible with avr-gcc for the UNO R3, the ESP32 Arduino core for the ESP32, and the Arduino-Pico core for the Raspberry Pi Pico. | Must | Validate by compiling a sketch that calls `setup()`, `loop()`, `digitalWrite()`, `analogRead()`, `Serial.begin()`, `Wire.begin()`, `SPI.begin()` without errors on each supported board target. |
| UR-CODE-006 | The MicroPython editor shall accept standard MicroPython syntax and imports targeting the ESP32 (`machine`, `utime`, `uasyncio`, `network`, `ujson`) and the Raspberry Pi Pico (`machine`, `utime`, `rp2040`, `uasyncio`). | Must | Validate by running a sketch that blinks an LED and reads a sensor using `machine.Pin` and `machine.ADC` on both boards. |
| UR-CODE-006A | The CircuitPython editor shall accept CircuitPython syntax and the standard CircuitPython library bundle targeting the Raspberry Pi Pico (RP2040), including `board`, `busio`, `digitalio`, `analogio`, `pwmio`, and `adafruit_*` modules. | Must | Validate by running a CircuitPython sketch that toggles a GPIO pin and reads an ADC channel on the Pico. CircuitPython mode is only selectable when the project board is Raspberry Pi Pico. |
| UR-CODE-006B | The Pico SDK C/C++ editor shall accept standard Pico SDK C/C++ source targeting the RP2040, exposing the full `pico/stdlib.h` API including GPIO, ADC, PWM, UART, SPI, I2C, PIO, and multicore primitives. | Should | Validate by compiling and loading a Pico SDK sketch using `gpio_init()`, `adc_read()`, and `uart_puts()` without errors. |
| UR-CODE-007 | Switching between language/mode selections shall preserve the project source file associated with the new mode; each mode may have its own separate source file within the project. | Should | Switching does not discard the other mode's file; a project may contain a `.ino`, a `.py`, a `.cpp` (Pico SDK), and a blocks `.json`. |

### UR-CODE-021 to UR-CODE-040: Editor Features — Highlighting, Autocomplete and Diagnostics

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-CODE-021 | The code editor shall render full syntax highlighting for Arduino C/C++ and MicroPython, covering keywords, literals, comments, preprocessor directives, and string delimiters. | Must | Implemented via Monaco editor language extensions; highlight accuracy verified against Arduino and MicroPython language grammars. |
| UR-CODE-022 | The editor shall provide context-aware autocomplete that surfaces: standard language keywords, Arduino core API symbols, MicroPython builtins/modules, third-party library APIs included in the project, and user-defined functions/variables. | Must | Autocomplete triggers on typing (minimum 1 character) and on Ctrl+Space. Suggestions appear within 300 ms on a standard connection. |
| UR-CODE-023 | Autocomplete suggestions shall include an inline documentation snippet (signature, short description, and a usage example) displayed in a side panel or popover without requiring a separate page load. | Should | Documentation sourced from bundled JSDoc/docstring stubs for Arduino API and MicroPython stubs. |
| UR-CODE-024 | The editor shall display real-time inline lint and syntax-error diagnostics as a Student types, without requiring a manual build step. | Must | Errors and warnings underlined red/yellow; hovering shows the diagnostic message. Diagnostics update within 1 s of the last keystroke. |
| UR-CODE-025 | Lint diagnostics shall cover: undeclared identifiers, type mismatches (C/C++), missing semicolons, mismatched braces/parentheses, unused variables, and calls to undefined functions. | Must | Test by introducing each class of error and verifying a corresponding diagnostic appears. |
| UR-CODE-026 | A gutter panel shall display error, warning, and info severity indicators on the line number margin, and a minimap/scrollbar overlay shall highlight all diagnostic lines for navigation in long sketches. | Should | Clicking a gutter indicator jumps the cursor to the relevant line. |
| UR-CODE-027 | Before the Student initiates a simulation run, the editor shall perform a full pre-run validation pass and block execution if errors of severity Error or above are present, displaying a summary panel listing all errors. | Must | The Run button is disabled or shows an error badge; the error summary lists filename, line number, and message. Warnings do not block execution but are shown. |
| UR-CODE-028 | The editor shall support line-level code folding for functions, loops, and comment blocks to help Students manage long sketches. | Should | Fold/unfold widgets appear in the gutter on hover. |
| UR-CODE-029 | The editor shall support multi-cursor editing (Ctrl+D, Alt+Click) and column/box selection. | Could | Standard Monaco editor multi-cursor behaviour. |
| UR-CODE-030 | The editor shall support find and replace (Ctrl+H) with regex toggle and match-case toggle. | Should | Replace-all confirmation dialog prevents accidental mass replacement. |

### UR-CODE-041 to UR-CODE-060: Component/Library Includes and Templates

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-CODE-041 | When a Student places a component on the Canvas, the editor shall automatically suggest (and optionally auto-insert) the corresponding `#include` directives and initialisation boilerplate for that component's library. | Must | Suggestions appear as a non-blocking notification banner within the editor. Student can accept, dismiss, or view the full snippet before insertion. |
| UR-CODE-042 | The editor shall provide a searchable **Library Manager** panel listing all pre-bundled libraries (mapped to the Component Catalogue) from which the Student can insert include statements and skeleton usage code. | Must | Panel accessible via editor toolbar icon. Search returns results within 500 ms. |
| UR-CODE-043 | The following libraries shall be pre-bundled and available without internet access: `Wire` (I2C), `SPI`, `Servo`, `LiquidCrystal_I2C`, `Adafruit_SSD1306`, `Adafruit_GFX`, `DHT sensor library`, `OneWire`, `DallasTemperature`, `MFRC522`, `FastLED`/`Adafruit_NeoPixel`, `Stepper`, `Keypad`, `IRremote`, `MPU6050`, and their MicroPython equivalents where applicable. | Must | Validate by inserting each `#include` and verifying no "file not found" diagnostic appears. |
| UR-CODE-044 | The editor shall provide a **Code Templates** panel offering starter sketches for common component patterns (blink an LED, read a sensor, drive a motor, etc.) drawn from the Component Catalogue. | Must | Templates are filterable by component name and by board (UNO R3 / ESP32 / Raspberry Pi Pico) and by language mode (Arduino C/C++, MicroPython, CircuitPython, Pico SDK C/C++). |
| UR-CODE-045 | A Teacher shall be able to author custom code templates and snippets and publish them to their class's Code Templates panel, optionally locking portions of the template as read-only scaffolding. | Should | Read-only scaffold regions are rendered with a distinct background colour; Students cannot edit them but can add code in designated editable regions. |
| UR-CODE-046 | The editor shall provide keyboard shortcut documentation accessible from the editor toolbar, listing all editor-level and RoboCode Studio shortcuts. | Should | Accessible via a `?` icon or `Ctrl+Shift+/` shortcut. |

### UR-CODE-061 to UR-CODE-080: Mapping Code to Simulator Actions

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-CODE-061 | When a Student clicks **Run**, the code editor shall initiate execution via the RSE: for accurate mode, compile the sketch to firmware and load it into the appropriate simulator — avr8js for the Arduino UNO R3, the ESP32 core simulator for the ESP32, or rp2040js (github.com/wokwi/rp2040js) for the Raspberry Pi Pico; for simplified mode, pass the code to the RVM interpreter. For the Raspberry Pi Pico on the accurate path, the compiler produces a UF2 or ELF firmware image which is loaded into rp2040js to run real RP2040 machine code in the browser. | Must | Execution start-to-first-simulation-tick latency shall not exceed 3 s on a standard mid-range device for sketches under 2,000 lines. UF2/ELF load into rp2040js completes within the same 3 s budget. |
| UR-CODE-061A | When the active board is the Raspberry Pi Pico, the editor shall support MicroPython, CircuitPython, and C/C++ (Arduino-Pico core or Pico SDK) as selectable language modes for that project. Each language path compiles or packages to a firmware image (UF2 for MicroPython/CircuitPython runtimes; UF2 or ELF for C/C++) loaded into rp2040js. The editor shall expose Pico-specific autocomplete symbols: `machine.Pin`, `rp2040.PIO`, `machine.ADC` channels GP26/GP27/GP28, and the internal temperature sensor. | Must | Validate by running a MicroPython sketch, a CircuitPython sketch, and an Arduino-Pico C++ sketch each on the Pico simulator without error; confirm GP26/GP27/GP28 appear as ADC options in autocomplete. |
| UR-CODE-062 | While a simulation is running, the editor shall visually indicate the currently executing line (execution cursor / line highlight) in real time so Students can follow program flow. | Must | Execution cursor must not introduce more than 100 ms of display lag relative to simulator state. Disabled for high-frequency loops unless stepped. |
| UR-CODE-063 | The editor shall display a **Serial Monitor** pane that shows output from `Serial.print()` / `Serial.println()` (Arduino) and `print()` (MicroPython) in real time during simulation, and that also accepts serial input fed back to the simulated board. | Must | Serial Monitor is dockable (bottom or side); font is monospace; output is timestamped. Input field sends ASCII text on Enter or newline character. |
| UR-CODE-064 | The editor shall support **Step-Through / Debug** mode where the Student can pause simulation, step line-by-line, and inspect the values of declared variables in a Watch panel. | Should | Watch panel shows variable name, type, and current value; arrays truncated to first 10 elements with an expand option. |
| UR-CODE-065 | The editor shall allow Students to set breakpoints (by clicking the gutter) that pause the simulation at that line so pin states and variable values can be inspected. | Should | Breakpoints persist for the session; they are shown as filled circles in the gutter and listed in the Debug panel. |
| UR-CODE-066 | Pin state changes triggered by code execution (e.g., `digitalWrite(13, HIGH)`) shall be reflected on the Canvas in the RSE with no perceptible rendering lag (target < 50 ms). | Must | Cross-reference: *User Requirements: Simulation Experience*, UR-SIM-nnn. |
| UR-CODE-067 | Errors thrown during simulation runtime (e.g., stack overflow, infinite loop watchdog, illegal instruction) shall be caught, displayed in an **Error Console** panel within the editor, and the simulation halted with a meaningful error message that includes the instruction address or sketch line number where possible. | Must | Error messages are plain-language rather than raw register dumps; a "Learn more" link opens the help panel for that error class. |
| UR-CODE-068 | The editor shall provide a **Stop** button that halts simulation, resets the simulated board to its power-on state, and clears the Serial Monitor. | Must | Stopping simulation does not discard unsaved code. |

### UR-CODE-081 to UR-CODE-095: Worked Examples and Help / Documentation Panel

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-CODE-081 | The editor shall include a **Help & Docs** panel (collapsible sidebar or tab) providing: Arduino Language Reference, MicroPython stdlib reference, CircuitPython library reference, Pico SDK C/C++ API reference, library API references for all pre-bundled libraries, and RoboCode Studio editor keyboard shortcuts. | Must | Panel is searchable; search returns results within 500 ms; content is versioned alongside the platform. |
| UR-CODE-082 | API documentation entries shall show: function signature, parameter descriptions, return type, a runnable in-editor code example, and links to related functions. | Must | "Try this example" inserts the snippet into a new project or a sandbox area without overwriting the Student's work. |
| UR-CODE-083 | The Help & Docs panel shall include a curated set of **Worked Examples** for each major component in the Component Catalogue (e.g., blink single LED, read HC-SR04 ultrasonic distance, display text on LCD, spin servo to angle, read DHT11 temperature). | Must | Each worked example includes: annotated source code, a pre-wired canvas configuration that loads alongside the code, and an explanation panel written at two reading levels (primary / high school, selectable). |
| UR-CODE-084 | Worked Examples shall be launchable as isolated sandbox projects that do not overwrite a Student's current work-in-progress. | Must | Launching a worked example opens a new project tab or prompts to save the current project first. |
| UR-CODE-085 | A Teacher shall be able to contribute worked examples to the school's local example library, visible to their class Students. | Should | Teacher-authored examples are flagged as school-scoped and are not visible outside the tenant. |
| UR-CODE-086 | The Help & Docs panel content shall be available offline (cached after first load) so that Students in low-connectivity environments can access it without an active internet connection. | Should | Implemented via service-worker cache; content version mismatch triggers a background re-fetch when connectivity is restored. |

### UR-CODE-096 to UR-CODE-115: AI Hint Assistant

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-CODE-096 | The editor shall include a **guarded AI Hint Assistant** that a Student can invoke to request contextual hints about their code, error messages, or next-step suggestions without receiving a direct solution. | Must | AI Hint Assistant is a distinct UI panel; it does not auto-appear without Student action (opt-in, not ambient). |
| UR-CODE-097 | The AI Hint Assistant shall operate in **hint-only / Socratic mode**: it guides the Student toward the solution with questions and partial clues; it shall not emit complete correct code blocks, complete loop bodies, or complete function implementations in response to a Student request for help on an assigned task. | Must | Guardrail enforced at the prompt/system-instruction level. Teacher and School Admin can configure the maximum specificity level of hints per class or per assignment. |
| UR-CODE-098 | The AI Hint Assistant shall be contextually aware of: the current sketch (passed as context), the active error diagnostics, the canvas component topology, and the current task description if one is loaded. | Must | Context window includes at minimum the full current sketch and the most recent 5 error messages. Canvas topology is summarised as a component-and-pin list. |
| UR-CODE-099 | All AI Hint Assistant interactions shall be logged per Student, per session, with timestamps, prompt text, and response text, retained for Teacher and School Admin review for safeguarding and academic integrity purposes. | Must | Logs viewable in the Admin/Teacher reporting interface; retained per the authoritative retention schedule in Section 15 (UR-COMM-063): minimum 12 months (or the school's data-retention policy, whichever is longer). Cross-reference: *User Requirements: Administration and Reporting*. |
| UR-CODE-105 | The AI Hint Assistant shall be governed as a child-facing AI feature: (a) RBAC — only Students may invoke it; Teachers/School Admins control availability per UR-CODE-100; the capability is reflected in the Roles and Permissions Matrix (Section 5); (b) all prompts and responses pass through the central content moderation pipeline of Section 15 (UR-COMM-018 to UR-COMM-021); (c) the underlying model provider must be contracted under a data-processing agreement that prohibits use of student prompts for model training or behavioural profiling. | Must | No student data may be retained by the AI provider beyond the request lifecycle. Verified at vendor onboarding and reviewed annually. |
| UR-CODE-100 | A Teacher shall be able to disable the AI Hint Assistant for a specific assignment or for an entire class, with the disabled state enforced in the editor UI (the Hint button is hidden or greyed with a tooltip). | Must | Disabled state syncs to all active Student sessions within 5 s. |
| UR-CODE-101 | The AI Hint Assistant shall apply content moderation filters to both incoming Student prompts and outgoing responses: profanity filter, PII detection (to avoid echoing back personal information), and off-topic deflection for non-programming queries. | Must | Content moderation is applied before responses are displayed; rejected responses are replaced with a generic deflection message. |
| UR-CODE-102 | The AI Hint Assistant shall display a visible disclaimer to the Student stating that responses are AI-generated, may contain errors, and should be verified by running the code and consulting the Help & Docs panel. | Must | Disclaimer appears as a persistent footer in the Hint panel; cannot be permanently dismissed. |
| UR-CODE-103 | For primary-school Students (age < 13), the AI Hint Assistant shall be restricted to block-based guidance only (block palette suggestions, visual explanations) and shall not return text-code snippets. | Must | Age tier is determined by the Student's profile and enforced server-side; client-side enforcement is supplementary. |
| UR-CODE-104 | The AI Hint Assistant shall support rate-limiting per Student: a maximum of 10 AI hint requests per hour per Student account, configurable by the School Admin. | Should | Rate-limit counter displayed in the Hint panel ("8 of 10 hints used this hour"). Counter resets on the hour. |

### UR-CODE-116 to UR-CODE-130: Save, Versioning and Project Association

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-CODE-116 | Code shall be saved as part of the project, co-located with the canvas layout, wiring configuration, and simulation state in a single project bundle. | Must | Project bundle format is documented in the system specification; it includes source files for each mode, canvas JSON, and metadata. |
| UR-CODE-117 | The editor shall auto-save code to the platform backend at a minimum interval of every 30 seconds while a Student is actively editing, and immediately upon a deliberate save action (Ctrl+S or Save button). | Must | Auto-save indicator (e.g., spinning icon → checkmark) shown in the editor toolbar; loss of fewer than 30 seconds of work guaranteed per session on clean disconnect. |
| UR-CODE-118 | The platform shall maintain a **version history** of every saved state of the project code, retaining at minimum the last 50 auto-save snapshots and all manual save points, for a minimum of 90 days. | Should | Version history accessible from a History panel in the editor; each entry shows timestamp, word-count change delta, and an optional Student-provided label. |
| UR-CODE-119 | A Student shall be able to restore any version from the history with a one-click action; the current unsaved state shall be offered as a separate save-point before restoration proceeds. | Should | Restoration is non-destructive; the previous current state is saved as a checkpoint before the restore. |
| UR-CODE-120 | A Teacher shall be able to view the version history of any Student's project (within their class) for assessment and academic-integrity review without altering the Student's work. | Must | Read-only access; Teacher's view is logged in the audit trail. Cross-reference: *User Requirements: Learning, Courses, Tasks and Assessment*. |
| UR-CODE-121 | When a Student submits an assignment, the platform shall capture and lock a **submission snapshot** of the code and canvas state at the time of submission. The snapshot is immutable and associated with the assessment record. | Must | Submission snapshot stored separately from the working copy; Student can continue editing the working copy after submission. |
| UR-CODE-122 | Code projects shall be exportable by the Student as a downloadable `.ino` (Arduino C/C++), `.py` (MicroPython / CircuitPython), `.cpp` (Pico SDK C/C++), or compiled `.uf2` firmware image (Raspberry Pi Pico), or as a ZIP archive containing all project files. | Should | Export action in File menu; export includes a `diagram.json` compatible with Wokwi's format for interoperability. UF2 export is only available for Pico projects on the accurate simulation path. |
| UR-CODE-123 | For collaborative projects, the code editor shall support real-time co-editing by multiple Students simultaneously (Yjs CRDT), with each collaborator's cursor shown in a distinct colour with their display name. | Should | Concurrent edit conflicts resolved by CRDT merge; no data loss. Cross-reference: *User Requirements: Teams, Competitions and Collaboration*. |

---

## MoSCoW Priority Summary

| Priority | Requirement IDs |
|---|---|
| Must | UR-CODE-001, 002, 003, 005, 006, 006A, 021, 022, 024, 025, 027, 041, 042, 043, 044, 061, 061A, 062, 063, 066, 067, 068, 081, 082, 083, 084, 096, 097, 098, 099, 100, 101, 102, 103, 116, 117, 120, 121 |
| Should | UR-CODE-004, 006B, 007, 023, 026, 028, 030, 045, 046, 064, 065, 085, 086, 104, 118, 119, 122, 123 |
| Could | UR-CODE-029 |
| Won-t (this release) | Block-Based to MicroPython transpilation; full hardware debugger JTAG integration; AI-generated complete project scaffolding for Students. |

---

## Editor Architecture Overview

The diagram below shows the structural layout of the Code Editor within RoboCode Studio and its integration points.

```
+------------------------------------------------------------------+
|  RoboCode Studio – Code Tab                                      |
|                                                                  |
|  +-------------------+  +-----------------------------------+   |
|  | Toolbar           |  | Library Manager / Code Templates  |   |
|  | [Mode Selector]   |  | [Searchable list of libs/snippets]|   |
|  | [Run] [Stop]      |  | [Worked Examples]                 |   |
|  | [Save] [History]  |  | [Help & Docs panel]               |   |
|  | [AI Hint] [Export]|  | [AI Hint Assistant panel]         |   |
|  +-------------------+  +-----------------------------------+   |
|                                                                  |
|  +---------------------------------------------+               |
|  |  Monaco Editor                              |               |
|  |  - Syntax highlighting                      |               |
|  |  - Autocomplete (language + library APIs)   |               |
|  |  - Inline lint diagnostics (gutter + wave)  |               |
|  |  - Execution cursor (run-time line marker)  |               |
|  |  - Breakpoint gutter                        |               |
|  |  - Code folding                             |               |
|  |  - Multi-cursor, find/replace               |               |
|  +---------------------------------------------+               |
|                                                                  |
|  +---------------------------------------------+               |
|  |  Serial Monitor / Debug Console / Watch     |               |
|  |  [Serial output  | Variable watch | Errors] |               |
|  +---------------------------------------------+               |
|                                                                  |
|  Integration layer:                                             |
|    Code <--[compile/interpret]--> RSE / RVM                     |
|    Code <--[project bundle]-----> Backend (versioned saves)     |
|    Code <--[CRDT sync]----------> Yjs (collaborative editing)   |
+------------------------------------------------------------------+
```

---

## Block-Based Mode — Palette Structure

```
+------------------------------------------------------------+
|  Block Palette (Block-Based Mode)                          |
|                                                            |
|  [Control]   [Logic]    [Loops]    [Math]    [Text]        |
|  if/else     and/or     repeat     +/-/*//   join          |
|  wait        not        forever    random    print         |
|  call fn     compare    for range  abs/round length        |
|                                                            |
|  [I/O – Digital]  [I/O – Analog]   [I/O – Serial]         |
|  digitalWrite     analogRead        Serial.begin           |
|  digitalRead      analogWrite       Serial.print           |
|  pinMode          map()             Serial.println         |
|                                                            |
|  [Components]  (auto-populated from Canvas)                |
|  LED on/off    Servo set angle     Buzzer tone             |
|  LCD print     Motor speed/dir     Sensor read             |
|                                                            |
|  [Functions]                                               |
|  Define function     Call function     Return value        |
+------------------------------------------------------------+
```

---

## Accessibility and Internationalisation

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-CODE-131 | The code editor and all associated panels shall meet WCAG 2.2 Level AA: keyboard-navigable, screen-reader-compatible ARIA labels on all interactive controls, sufficient colour contrast. | Must | Third-party audit or automated axe-core scan with zero critical/serious violations. |
| UR-CODE-132 | Syntax highlighting colour themes shall include a high-contrast option (dark and light) meeting WCAG 2.2 contrast ratios. | Must | Default themes: Light, Dark, High-Contrast Dark, High-Contrast Light. |
| UR-CODE-133 | Editor UI labels, error messages, and documentation shall support localisation; initial release shall ship English (en-GB / en-US); additional locales (French, Swahili, Shona, Zulu) deliverable post-launch. | Should | All user-facing strings externalised to an i18n resource file; no hard-coded English strings in components. |

---

## Constraints and Dependencies

| Constraint / Dependency | Detail |
|---|---|
| Monaco Editor | The code editor is implemented using Monaco Editor (MIT licence, the engine behind VS Code). All editor feature requirements (UR-CODE-021 to UR-CODE-030) are implemented on top of Monaco's extension APIs. |
| avr8js / ESP32 core / rp2040js simulation | Code execution in accurate mode depends on avr8js (Wokwi open-source) for the Arduino UNO R3, the ESP32 core simulator for the ESP32, and rp2040js (github.com/wokwi/rp2040js) for the Raspberry Pi Pico (RP2040). rp2040js runs real RP2040 firmware (UF2 or ELF images) in the browser via WebAssembly. Compilation may invoke an in-browser WASM toolchain or a backend compile microservice; compile microservice latency must not exceed 5 s p95 for all three board targets. |
| Yjs CRDT | Collaborative co-editing (UR-CODE-123) depends on the Yjs library and the Socket.IO realtime channel. |
| Child-safety regulations | AI Hint Assistant guardrails (UR-CODE-097, 099, 101, 103) must comply with COPPA, GDPR-K, Zimbabwe Cyber and Data Protection Act, POPIA, NDPR, and Kenya Data Protection Act. AI log retention must be reconciled against data-minimisation obligations for minors. |
| Offline / low-connectivity | Africa-region delivery via CDN edge (Cloudflare/CloudFront). Help & Docs offline caching (UR-CODE-086) implemented via service worker. Compile microservice requires connectivity; in-browser WASM path is the offline/low-bandwidth fallback. |

---

## Rationale Notes

**Why five authoring modes?** The primary-school cohort (ages 8–12) benefits most from the cognitive scaffolding of block-based programming before transitioning to text-based syntax. The text modes — Arduino C/C++, MicroPython, CircuitPython, and Pico SDK C/C++ — reflect the three first-class boards (Arduino UNO R3, ESP32, and Raspberry Pi Pico) and their natural development ecosystems. MicroPython and CircuitPython are widely taught as accessible Python-based languages for the Pico; Pico SDK C/C++ supports advanced students who need bare-metal RP2040 access. This range matches industry practice and curricula in use across African STEM education programmes.

**Why a guarded AI Hint Assistant rather than a full AI pair-programmer?** Academic integrity and genuine skill development require that Students work through problems themselves. A Socratic hint model mirrors best practice in pedagogy: the assistant scaffolds understanding rather than supplying answers. Strict logging and Teacher oversight mean the assistant serves as a transparent learning aid rather than a black box.

**Why auto-include suggestions on component placement?** A common pain point for beginners is the disconnect between placing a sensor on the canvas and not knowing which library to import. Bridging this gap at the moment of action reduces frustration and keeps the learning loop tight, reinforcing the relationship between physical components and code.
