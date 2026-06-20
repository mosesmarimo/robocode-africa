# Glossary and Acronyms

## Overview

This section provides the authoritative reference vocabulary for the RoboCode.Africa User Requirements Document (URD) and its companion System Specification Document (SSD). All terms, abbreviations, and acronyms used throughout both documents are defined here. Where a term has a general industry meaning and a specific meaning within the RoboCode.Africa platform, both are given and the platform-specific meaning is indicated explicitly.

Entries are sorted alphabetically within each sub-section. Cross-references to requirement series are given as `UR-<AREA>-<nnn>` (URD) and `FR-<MODULE>-<nnn>` (SSD).

---

## Domain Term Glossary

### A

| Term | Definition |
|------|-----------|
| **Age-Appropriate Design Code** | A set of design principles — drawn from the UK ICO Children's Code and adopted by RoboCode.Africa as a global baseline — requiring that online services used by children apply data minimisation, high privacy defaults, no behavioural profiling, and content appropriate to the developmental stage of the child user. Referenced in the Safety-First Onboarding requirements (UR-ONB series) and data-protection obligations stated in the canon. |
| **Arduino UNO R3** | A widely-used open-source microcontroller development board built around the ATmega328P 8-bit AVR microcontroller, operating at 5 V with a 16 MHz clock, 32 KB flash, 2 KB SRAM, and 1 KB EEPROM. In RoboCode Studio it is the primary simulated board for Arduino C/C++ projects. Simulation accuracy is provided by the `avr8js` library running real compiled AVR firmware inside a WebAssembly sandbox. |
| **ATmega328P** | The Microchip Technology 8-bit AVR RISC microcontroller at the heart of the Arduino UNO R3. In the RoboCode Simulation Engine (RSE) the `avr8js` library emulates the ATmega328P at cycle-accurate register and peripheral level, enabling unmodified Arduino sketches to run inside the browser. |
| **Audit Log** | An immutable, time-stamped, append-only record of security-relevant and safety-relevant events on the platform — including account approvals, role changes, content moderation decisions, RoboPoints adjustments, and login events. Mandatory for child-safeguarding compliance. Referenced in UR-ADM and UR-COMM requirement series. |
| **avr8js** | An open-source JavaScript/TypeScript library (github.com/wokwi/avr8js) that accurately simulates the ATmega328P microcontroller — including the CPU, timers, UART, SPI, I2C, ADC, and GPIO peripherals — inside a web browser or Node.js environment. It is a core dependency of the RoboCode Simulation Engine (RSE) for the Arduino UNO R3 path. |

### B

| Term | Definition |
|------|-----------|
| **Badge** | A visual achievement award displayed on a Student's profile. Badges are earned by meeting defined milestones (e.g., completing a course, winning a competition, maintaining a RoboPoints streak). They do not carry a monetary or exchange value. See UR-GAM series. |
| **Block-Based Mode** | A visual, drag-and-drop code authoring mode in the RoboCode Studio code editor, intended for primary-school students and beginners. Block-based code is transpiled to Arduino C/C++ before execution by the RSE (MicroPython transpilation is on the roadmap, not in this release). Powered by a Scratch/Blockly-style frontend. See UR-CODE series. |
| **Breadboard** | A solderless prototyping board used to build and test electronic circuits without permanent connections. RoboCode Studio simulates a full-size 830 tie-point breadboard (and a half-size variant). The simulated breadboard respects the standard internal node connectivity: the two power rails run along each long edge, and the main body is arranged in columns of five electrically connected tie-points separated by a central divider. See UR-SIM series. |

### C

| Term | Definition |
|------|-----------|
| **Canvas** | The interactive graphical workspace within RoboCode Studio where Students drag, drop, and arrange simulated electronic components — including the development board, breadboard, and peripherals — and draw jumper-wire connections between them. Rendered via Wokwi wokwi-elements web components (2D) and Three.js/React Three Fiber (3D). See UR-SIM series. |
| **Child Safeguarding** | The collective set of policies, technical controls, and operational procedures on the RoboCode.Africa platform that protect minors from harm, including: mandatory approval before account activation, verifiable parental/guardian consent, moderated communication, PII and profanity filtering, abuse-reporting mechanisms, and safeguarding escalation workflows. The prime directive of the platform. Referenced throughout UR-ONB, UR-AUTH, UR-COMM, and UR-ADM series. |
| **CircuitPython** | An Adafruit-maintained fork of MicroPython, optimised for rapid prototyping on microcontroller boards. On the Raspberry Pi Pico / RP2040 target, RoboCode Studio supports CircuitPython by loading a compiled UF2 firmware image into the `rp2040js` simulator and exposing a CircuitPython-compatible REPL in the Serial Monitor pane. CircuitPython offers a simplified library ecosystem (the Adafruit CircuitPython bundle) and beginner-friendly APIs that complement MicroPython and the C/C++ (Arduino-Pico / Pico SDK) paths available for the Pico. See UR-CODE series. |
| **Class** | A grouping of Students within a School Tenant, created and managed by a Teacher/Educator. Classes are the primary unit for task assignment, grading, and leaderboard scoping. A Student may belong to multiple classes within the same tenant. See UR-SCH and UR-LRN series. |
| **Component Catalogue** | The full set of electronic components available for simulation within RoboCode Studio. It is derived from the Keyestudio ESP32 Learning Kit, the Robotlinking Starter Kit, and common robotics kits, and includes boards, LEDs, displays, passives, sensors, actuators, and communications modules. The definitive list is in the Project Canon. See UR-SIM series. |
| **Custom Domain** | A school's own internet domain name (e.g., `coding.exampleschool.ac.zw`) mapped to the school's RoboCode.Africa tenant instead of the default subdomain. Custom domains require DNS CNAME/TXT verification and automated TLS provisioning via ACME/Let's Encrypt. See UR-SCH series. |

### D

| Term | Definition |
|------|-----------|
| **Data Minimisation** | The principle — mandated by GDPR, GDPR-K, POPIA, and the age-appropriate design code — that the platform collects and retains only the personal data strictly necessary for the stated purpose. For minor users this is given heightened weight: no behavioral advertising data, no unnecessary tracking, and no third-party data sharing. Referenced in UR-ONB and UR-ADM series. |
| **DevKit (ESP32 DevKit)** | The ESP32 DevKit V1 development board (based on the ESP-WROOM-32 module), featuring a dual-core Xtensa LX6 processor, integrated Wi-Fi (802.11 b/g/n) and BLE (Bluetooth 4.2), and 30 or 38 GPIO pins. In RoboCode Studio it is the primary simulated board for MicroPython projects and Wi-Fi/BLE experiments. |

### E

| Term | Definition |
|------|-----------|
| **ESP32** | The Espressif Systems ESP32 system-on-chip (SoC) featuring dual-core Xtensa LX6 CPUs, 520 KB SRAM, integrated Wi-Fi and BLE, and a rich peripheral set. Within RoboCode Studio it is simulated via an ESP32 core simulation layer (distinct from `avr8js`). Supported programming languages in RoboCode Studio are MicroPython and Arduino C/C++ (using the Arduino-ESP32 core). |

### F

| Term | Definition |
|------|-----------|
| **Firmware** | The compiled binary program uploaded to (or in RoboCode Studio, loaded into the simulated) microcontroller. On the accurate execution path, the RoboCode Studio code editor compiles the user's Arduino sketch to AVR ELF/HEX firmware (via a WASM toolchain or compile microservice) and loads it directly into the `avr8js` simulator. See UR-CODE series. |
| **Firmware Compile Path** | See _Accurate Execution Path_ / RoboCode Virtual Machine (RVM). The path in which the user's code is compiled to real machine-code firmware and executed by the MCU simulator, as opposed to the simplified interpreted RVM path. |

### G

| Term | Definition |
|------|-----------|
| **GPIO** | General-Purpose Input/Output. The digital (and sometimes analog-capable) pins on a microcontroller board that can be individually configured as digital inputs, digital outputs, or — on capable pins — as PWM outputs or ADC inputs. RoboCode Studio simulates the full GPIO model of the Arduino UNO R3 (14 digital, 6 analog), ESP32 DevKit (up to 34 GPIO), and Raspberry Pi Pico (26 user-accessible multifunction GPIO pins, GP0–GP28, including 3 ADC-capable inputs on GP26/GP27/GP28). |
| **Guest / Visitor** | The unauthenticated user role on RoboCode.Africa. Guests may view marketing pages and access limited read-only demos. They cannot save projects, earn RoboPoints, or access course content. See UR-ONB and the Roles and Permissions Matrix (Section 5). |

### I

| Term | Definition |
|------|-----------|
| **I2C** | Inter-Integrated Circuit. A two-wire serial communication protocol (SDA data line + SCL clock line) supporting multiple devices on a shared bus, each identified by a 7-bit address. RoboCode Studio simulates I2C for components including the SSD1306 OLED, HD44780 LCD with I2C backpack, MPU6050 IMU, DS1307/DS3231 RTC, and others. |
| **IDE** | Integrated Development Environment. In the context of RoboCode.Africa, this refers to RoboCode Studio as a whole — the combined canvas, component catalogue, wiring editor, code editor, and simulation controls presented as a unified browser-based workspace. |

### J

| Term | Definition |
|------|-----------|
| **Jumper Wire** | A flexible short wire used to make connections on a breadboard or between a breadboard and a development board. RoboCode Studio simulates M-M (male-to-male), M-F (male-to-female), and F-F (female-to-female) jumper wires as draggable canvas elements. Each wire is assigned a colour by the student or auto-assigned by the platform according to convention (red = VCC, black/blue = GND). |

### L

| Term | Definition |
|------|-----------|
| **LCD** | Liquid Crystal Display. A flat-panel display technology. RoboCode Studio simulates the HD44780-based 16×2 and 20×4 character LCD modules, optionally fitted with an I2C backpack for two-wire control. |
| **LDR** | Light-Dependent Resistor (photoresistor). A passive component whose resistance decreases as ambient light intensity increases. The simulated LDR in RoboCode Studio exposes a virtual light-level control that students can adjust with a slider, enabling testing of light-sensitive sketches. |
| **LED** | Light-Emitting Diode. A semiconductor diode that emits light when forward-biased. RoboCode Studio simulates single-colour LEDs (red, green, blue, yellow), RGB LEDs (common-anode and common-cathode), LED bar graphs, 7-segment displays, LED matrices (MAX7219), WS2812/NeoPixel strips and rings. |
| **Leaderboard** | A ranked display of RoboPoints totals (or other metrics) for Students, Teams, or Schools. Leaderboards are scoped to Class, School (Tenant), or Global (platform-wide). Privacy controls restrict visibility for minors as required by GDPR-K and the age-appropriate design code. See UR-GAM series. |

### M

| Term | Definition |
|------|-----------|
| **MicroPython** | A lean implementation of Python 3 optimised for microcontrollers, supported by the ESP32 and the Raspberry Pi Pico (RP2040). RoboCode Studio exposes MicroPython as a first-class language for ESP32 and Raspberry Pi Pico projects, with real-time syntax checking and autocomplete in the Monaco editor. On the Pico target the MicroPython firmware is loaded as a UF2 image into the `rp2040js` simulator. See also CircuitPython. |
| **Monaco Editor** | The open-source code editor that powers Visual Studio Code, used as the code-editing surface within RoboCode Studio. Provides syntax highlighting, real-time lint diagnostics, IntelliSense/autocomplete, and multi-language support (Arduino C/C++, Pico SDK C/C++, MicroPython, CircuitPython, JavaScript). |
| **MoSCoW** | A requirements prioritisation framework used throughout this URD. Priorities are: **Must** (non-negotiable for v1.0 launch), **Should** (important but not critical path), **Could** (desirable if capacity allows), **Won't** (explicitly excluded from v1.0; may appear on roadmap). |

### N

| Term | Definition |
|------|-----------|
| **Netlist** | A structured data representation of all electrical connections (nets) in a circuit. In RoboCode Studio the netlist is derived from the student's canvas wiring and breadboard node connectivity, and is consumed by the RSE to determine which component pins are electrically joined and how signals propagate. Stored as part of the project file. See UR-SIM series. |
| **NeoPixel** | Adafruit's commercial name for WS2812B addressable RGB LEDs, controllable individually via a single data wire using a proprietary timing protocol. RoboCode Studio simulates NeoPixel rings and strips, driven by the `FastLED` or `Adafruit_NeoPixel` library. |

### O

| Term | Definition |
|------|-----------|
| **OLED** | Organic Light-Emitting Diode display. RoboCode Studio simulates the 0.96-inch 128×64 monochrome OLED module (SSD1306 driver), controlled via I2C. The simulated display renders the same pixel output that the SSD1306 library would produce on real hardware. |

### P

| Term | Definition |
|------|-----------|
| **Parent / Guardian** | A user role on RoboCode.Africa representing the parent or legal guardian of a minor Student. In v1.0 their primary function is to provide verifiable consent for their child's account activation and to view a limited progress summary. A full parent portal is a roadmap item. See UR-ONB series and Roles and Permissions Matrix. |
| **PIR Sensor** | Passive Infrared motion sensor (typically the HC-SR501 module). Detects the infrared radiation emitted by warm bodies (humans, animals) moving within its field of view. In RoboCode Studio the simulated PIR exposes a virtual trigger control for testing motion-detection sketches. |
| **PIO (Programmable I/O)** | A hardware subsystem unique to the RP2040 microcontroller, consisting of eight independent state machines (two PIO blocks of four state machines each). Each PIO state machine executes a small, deterministic instruction set in a dedicated hardware FIFO loop, entirely independently of the main Cortex-M0+ cores. This allows the RP2040 to implement arbitrary serial or parallel protocols (WS2812/NeoPixel, I2S, SDIO, custom encoders, etc.) with precise cycle-level timing without consuming CPU time. The `rp2040js` simulator models PIO state machine execution so that firmware relying on PIO-driven peripherals behaves correctly in RoboCode Studio. See UR-SIM series. |
| **Platform Moderator** | A user role delegated by the Super Admin to assist with content moderation, safety escalation, and approval of direct (main-domain) student signups. See Roles and Permissions Matrix (Section 5) and UR-ADM series. |
| **Project** | A named, versioned RoboCode Studio workspace owned by a Student (or collaboratively owned by a Team). A project contains the canvas layout (component positions and connections), the netlist, the source code, and simulation configuration. Projects are persisted to S3-compatible object storage and indexed in PostgreSQL. See UR-SIM and UR-CODE series. |
| **PWA** | Progressive Web Application. A web application that can be installed on a device and (partially) used offline. Offline/PWA mode is explicitly out of scope for RoboCode.Africa v1.0; all functionality requires an active internet connection. Noted here for completeness because the acronym appears in roadmap discussions. |
| **PWM** | Pulse-Width Modulation. A digital technique for approximating an analog output by rapidly switching a digital pin between HIGH and LOW states, where the ratio of HIGH time to total period (the duty cycle) controls the effective average voltage. Used in RoboCode Studio for LED dimming, motor speed control, and servo positioning. |

### R

| Term | Definition |
|------|-----------|
| **Raspberry Pi Pico** | A low-cost, stamp-sized microcontroller development board produced by Raspberry Pi Ltd, built around the RP2040 SoC. It exposes 26 multifunction GPIO pins on a 40-pin header (GP0–GP28), three ADC-capable inputs (GP26, GP27, GP28) plus an internal temperature sensor, 2× UART, 2× SPI, 2× I2C, 16 PWM channels, 8 PIO state machines, USB 1.1, and 3.3 V logic — all operating at up to 133 MHz with 264 KB SRAM and 2 MB on-board QSPI flash. RoboCode Studio simulates the Raspberry Pi Pico as one of its three first-class development boards, using the `rp2040js` library (github.com/wokwi/rp2040js) to execute real RP2040 firmware in the browser. Supported languages are MicroPython, CircuitPython, and C/C++ (Arduino-Pico core and the official Pico SDK). The Pico W variant (CYW43439 Wi-Fi/BLE chip) is a near-term roadmap board. See UR-SIM series and the `rp2040js` and `wokwi-boards` entries. |
| **RBAC** | Role-Based Access Control. The access-control model used throughout RoboCode.Africa, in which permissions are assigned to roles (Super Admin, Platform Moderator, School Admin, Teacher/Educator, Student, Parent/Guardian, Guest/Visitor) and users are assigned to roles. Implemented via JWT claims and enforced in the NestJS API gateway and at the PostgreSQL Row-Level Security layer. See Roles and Permissions Matrix (Section 5). |
| **RLS** | Row-Level Security. A PostgreSQL feature that restricts which rows a database user (or application role) may see or modify within a table, based on a policy evaluated per-row. RoboCode.Africa uses RLS in combination with a `tenant_id` column to enforce strict data isolation between School Tenants, ensuring no tenant can access another tenant's data. See SSD FR-AUTH and FR-TEN series. |
| **RoboCode Studio** | The integrated, browser-based IDE and electronics simulator that is the centrepiece of the RoboCode.Africa platform. It combines the Canvas (component placement and wiring), the Code Editor (Monaco, multi-language), and the Simulation Controls into a unified workspace. Internally it is structured as a rich Single-Page Application (SPA) built with React 18, TypeScript, and the Wokwi open-source libraries. See UR-SIM and UR-CODE series. |
| **RoboCode Simulation Engine (RSE)** | The subsystem within RoboCode Studio responsible for executing component behavioural simulations. For the Arduino UNO R3 path it runs the `avr8js` AVR simulator. For the ESP32 path it runs an ESP32 core simulation. For the Raspberry Pi Pico path it runs the `rp2040js` RP2040 simulator. Component models (LEDs, sensors, displays, etc.) are driven by simulated pin states from the MCU simulator. Audio output for buzzers uses the Web Audio API. See UR-SIM series. |
| **RoboCode Virtual Machine (RVM)** | The simplified, interpreted code-execution layer within RoboCode Studio used when full firmware compilation is unavailable or unsuitable (e.g., very simple sketches, block-based mode output, or low-end devices). The RVM translates code constructs into RSE-level component actions, trading accuracy for speed and simplicity. See UR-CODE series. |
| **RoboPoints** | The platform's unified gamification points currency. Students earn RoboPoints by completing tasks, finishing courses, winning competitions, maintaining activity streaks, and through teacher awards. RoboPoints contribute to leaderboard rankings and may unlock digital rewards. They have no monetary value and cannot be transferred between accounts. See UR-GAM series. |
| **RoboCode.Africa** | The full name of the platform. The main public domain is `robocode.africa`. Do not abbreviate to "RCA" or "Robocode" in official documentation. |
| **RP2040** | The dual-core ARM Cortex-M0+ microcontroller SoC designed by Raspberry Pi Ltd. Key specifications: two Cortex-M0+ cores running at up to 133 MHz, 264 KB on-chip SRAM (split across six independent banks), 2 MB QSPI flash (external, mounted on the Pico PCB), no built-in non-volatile storage (programs load from flash at boot), 30 GPIO pins (26 user-accessible on the Pico board), 3× 12-bit ADC inputs, 2× UART, 2× SPI, 2× I2C, 16 PWM channels, 8 PIO state machines, and USB 1.1 host/device in hardware. Within RoboCode Studio the RP2040 is simulated by the `rp2040js` library. See also Raspberry Pi Pico, rp2040js, and PIO entries. |
| **rp2040js** | An open-source JavaScript/TypeScript library (github.com/wokwi/rp2040js) developed by the Wokwi project that simulates the RP2040 microcontroller — including the dual Cortex-M0+ cores, SRAM, flash, GPIO, ADC, UART, SPI, I2C, PWM, and PIO state machines — inside a web browser or Node.js environment. It executes real RP2040 firmware (UF2 or ELF images compiled for MicroPython, CircuitPython, or the Pico SDK / Arduino-Pico core). `rp2040js` is a core dependency of the RoboCode Simulation Engine (RSE) for the Raspberry Pi Pico target, complementing `avr8js` (ATmega328P) and the ESP32 core simulation layer. See UR-SIM series. |

### S

| Term | Definition |
|------|-----------|
| **School Admin (Tenant Admin)** | A user role representing the administrator of a School Tenant. Responsible for configuring the school's subdomain or custom domain, applying white-label branding, approving student registrations within the tenant, managing teacher accounts and class teams, setting policies and seat limits, and viewing school-level analytics and reports. See Roles and Permissions Matrix (Section 5) and UR-SCH series. |
| **Season** | A defined time period (typically one academic term or quarter) during which RoboPoints accumulate on a seasonal leaderboard. At the end of a Season, seasonal rankings are archived and seasonal balances reset, while all-time lifetime balances are preserved. See UR-GAM series. |
| **Simulation** | The execution of a student's circuit and code within the RSE, producing animated component outputs (lit LEDs, printed LCD text, sensor readings, motor movements, etc.) without requiring physical hardware. The simulation runs entirely in the browser. See UR-SIM series. |
| **SPI** | Serial Peripheral Interface. A four-wire synchronous serial communication protocol (MOSI, MISO, SCK, SS/CS) used for high-speed communication with peripherals such as the MAX7219 LED matrix driver, microSD card module, nRF24L01 radio, and RC522 RFID reader — all of which are simulated in RoboCode Studio. |
| **SSO** | Single Sign-On. An authentication mechanism that allows users to log in once with a school or institutional identity provider (IdP) and gain access to RoboCode.Africa without a separate password. RoboCode.Africa supports school SSO via Google Workspace for Education and Microsoft Entra ID (Azure AD) using OAuth2/OIDC. See UR-AUTH series. |
| **Student** | The primary learner role on RoboCode.Africa. Students build projects in RoboCode Studio, write and run code, complete assigned tasks, join or form Teams, and earn RoboPoints. The role has two sub-classes: primary-school student and high-school student, differentiated by age-appropriate UI, content, and safety controls. See Roles and Permissions Matrix (Section 5). |
| **Super Admin** | The highest-privilege user role, held by RoboCode.Africa platform administrators. Responsible for approving direct (main-domain) student signups, managing all School Tenants, administering the global content library, configuring platform-level settings, managing billing and subscription plans, and overseeing global moderation, safeguarding, and system health. See Roles and Permissions Matrix (Section 5) and UR-ADM series. |

### T

| Term | Definition |
|------|-----------|
| **Teacher / Educator** | A user role within a School Tenant. Teachers create classes, author and assign coding tasks and robotics projects, review and grade student work, mentor Teams, and oversee student activity within their classes. See Roles and Permissions Matrix (Section 5) and UR-LRN, UR-TEAM series. |
| **Team** | A group of two or more Students who collaborate on a shared RoboCode Studio project, typically for competitions or group tasks. Team membership is managed by Teachers or School Admins. Collaborative editing is provided by Yjs CRDT over WebSocket. See UR-TEAM series. |
| **Tenant** | A School organisation that has subscribed to the RoboCode.Africa platform and has its own isolated data environment. Each Tenant is identified by a unique subdomain (`<school>.robocode.africa`) and optionally a custom domain. Tenant data isolation is enforced via PostgreSQL Row-Level Security and a `tenant_id` column on all shared tables. The terms "Tenant" and "School" are used interchangeably in this document. See UR-SCH series. |

### U

| Term | Definition |
|------|-----------|
| **UART** | Universal Asynchronous Receiver-Transmitter. A serial communication protocol that transmits data one bit at a time over a single TX (transmit) and RX (receive) wire pair, with no shared clock. Used by the Arduino UNO R3, ESP32, and Raspberry Pi Pico for USB-to-PC serial communication (the Serial Monitor), and for communication with peripheral modules such as HC-05/HC-06 Bluetooth modules. RoboCode Studio includes a simulated Serial Monitor pane that displays UART output from the running sketch. |
| **UF2** | USB Flashing Format. A binary firmware container format designed by Microsoft and widely adopted by the Raspberry Pi / RP2040 ecosystem. A UF2 file encodes the firmware image in fixed-size blocks (512 bytes each) with a header that includes a magic number, target start address, and data payload. On a real Pico the MCU enumerates as a USB Mass Storage device in BOOTSEL mode, and dragging a UF2 file onto the drive programs the flash. In RoboCode Studio the `rp2040js` simulator accepts a compiled UF2 image and loads it directly into the simulated flash memory, enabling accurate execution of MicroPython, CircuitPython, or Pico SDK / Arduino-Pico C/C++ firmware without a physical board. See UR-CODE and UR-SIM series. |

### W

| Term | Definition |
|------|-----------|
| **White-Label** | The capability for a School Tenant to apply custom branding — including school logo, primary colour palette, and school name — to their tenant's RoboCode.Africa interface, replacing or supplementing the default RoboCode.Africa branding. Implemented via CSS design-token theming in the Tailwind CSS + Radix/shadcn UI layer. See UR-SCH series. |
| **Wokwi** | The open-source electronics simulation project (github.com/wokwi) from which RoboCode Studio derives its core simulation libraries: `wokwi-elements` (web components for simulated parts), `avr8js` (AVR/ATmega328P simulator), `rp2040js` (RP2040 simulator), and related packages. RoboCode.Africa uses these libraries under their respective open-source licences. |
| **wokwi-boards** | The data-driven board-definition format used by the Wokwi project (github.com/wokwi/wokwi-boards) and adopted by RoboCode Studio as its canonical schema for declaring development board layouts. A board definition consists of: (1) a board manifest file (`board.json`) that declares the board name, the MCU core target (`avr8js`, `rp2040js`, or the ESP32 core), and a list of pins — each with a name, a type (`power`, `ground`, `gpio`, `analog`, `i2c`, `spi`, `uart`), and an `x`/`y` canvas position; and (2) an SVG visual asset describing the board's physical appearance. No code change is required to add a board: the simulator resolves all execution and wiring behaviour from the manifest and the bound MCU core. The standard `wokwi-boards` library (Arduino Uno, Nano, Mega, ESP32 family, Raspberry Pi Pico, and more) ships built into RoboCode Studio. Platform admins — and approved advanced users / teachers — may upload custom board definitions in this format; uploads are validated against the JSON schema (pin sanity, name uniqueness, SVG/asset safety) and non-admin submissions pass through the standard content moderation and approval workflow before becoming available to learners. See UR-SIM series and the Raspberry Pi Pico, rp2040js, avr8js, and wokwi-elements entries. |
| **wokwi-elements** | A collection of open-source web components (Custom Elements) from the Wokwi project that render interactive 2D representations of electronic components — LEDs, buttons, LCD displays, 7-segment displays, breadboards, etc. — in the browser. They serve as the 2D rendering layer of the RoboCode Studio Canvas. |

### Y

| Term | Definition |
|------|-----------|
| **Yjs** | An open-source CRDT (Conflict-free Replicated Data Type) framework for building real-time collaborative applications. RoboCode.Africa uses Yjs over WebSocket (Socket.IO) to enable multiple Students (Team members) to simultaneously edit a shared RoboCode Studio project without data conflicts. See UR-TEAM series. |

---

## Acronym List

The following table lists all significant acronyms used in this URD and the companion SSD, with their expansions and a brief gloss.

| Acronym | Expansion | Notes |
|---------|-----------|-------|
| **ADC** | Analog-to-Digital Converter | Peripheral on the Arduino UNO R3 (6-channel, 10-bit), ESP32 (multiple channels, 12-bit), and Raspberry Pi Pico / RP2040 (3× 12-bit channels on GP26/GP27/GP28 plus an internal temperature sensor) that converts an analog voltage to a digital integer. Used by sensors including the LDR, potentiometer, and soil-moisture sensor. |
| **ACME** | Automatic Certificate Management Environment | The protocol (RFC 8555) used by Let's Encrypt and similar CAs to automate TLS certificate provisioning. RoboCode.Africa uses ACME to automatically issue and renew TLS certificates for custom tenant domains. |
| **API** | Application Programming Interface | The programmatic interface between software components. RoboCode.Africa exposes GraphQL and REST APIs via an NestJS API gateway. |
| **AVR** | Alf (and Vegard's) RISC (architecture) | The 8-bit RISC microcontroller architecture used in Microchip (formerly Atmel) chips, including the ATmega328P at the core of the Arduino UNO R3. Simulated by `avr8js` within the RSE. |
| **BLE** | Bluetooth Low Energy | A low-power wireless protocol (Bluetooth 4.x/5.x) supported natively by the ESP32. RoboCode Studio simulates BLE peripheral/central behaviour for ESP32 projects. |
| **CDN** | Content Delivery Network | A geographically distributed network of edge servers that cache and serve static assets close to end users. RoboCode.Africa uses Cloudflare/CloudFront as its CDN to minimise latency for students across Africa. |
| **CNAME** | Canonical Name Record | A DNS record type that maps one domain name to another. Used by School Tenants configuring a custom domain: the school's DNS admin adds a CNAME pointing their domain to the RoboCode.Africa platform. |
| **COPPA** | Children's Online Privacy Protection Act | US federal law (15 U.S.C. §§ 6501–6506) requiring verifiable parental consent before collecting personal information from children under 13. RoboCode.Africa complies with COPPA for all users regardless of jurisdiction, applied as a global baseline. |
| **CRDT** | Conflict-free Replicated Data Type | A data structure that can be concurrently modified by multiple users and merged without conflicts. RoboCode.Africa uses the Yjs CRDT library for real-time collaborative project editing. |
| **CSS** | Cascading Style Sheets | The styling language used for web presentation. RoboCode.Africa uses Tailwind CSS with design tokens for white-label theming. |
| **DPA** | Data Protection Act | Used in context to refer to the Kenya Data Protection Act 2019. Also used generically for national data protection legislation (e.g., Zimbabwe Cyber and Data Protection Act 2021). |
| **EEPROM** | Electrically Erasable Programmable Read-Only Memory | Non-volatile storage on the ATmega328P (1 KB). Simulated by `avr8js` for sketches that persist configuration between simulated power cycles. |
| **ESP32** | Espressif Systems Project 32 | The dual-core Wi-Fi/BLE SoC from Espressif Systems. See Domain Glossary entry. |
| **GDPR** | General Data Protection Regulation | EU Regulation 2016/679, the primary European data protection law. RoboCode.Africa applies GDPR globally as a baseline for personal data handling. |
| **GDPR-K** | GDPR (Children's provisions) | The heightened obligations within GDPR (Article 8, Recital 38) and the UK Children's Code. The GDPR digital-consent age is 16 by default but member states may lower it to as little as 13 (the UK sets 13); RoboCode.Africa adopts the under-16 GDPR default for digital consent. Requires verifiable parental consent, data minimisation, high privacy defaults, and no profiling. Applied by RoboCode.Africa globally. See Section 6 (UR-ONB-027) and Section 21 (UR-NFR-C016) for the single reconciled age-threshold model. |
| **GPIO** | General-Purpose Input/Output | See Domain Glossary entry. |
| **GraphQL** | Graph Query Language | A query language and runtime for APIs, used alongside REST in RoboCode.Africa's backend NestJS microservices. |
| **I2C** | Inter-Integrated Circuit | See Domain Glossary entry. |
| **IaC** | Infrastructure as Code | The practice of managing infrastructure through machine-readable configuration files. RoboCode.Africa uses Terraform for IaC. |
| **ICO** | Information Commissioner's Office | The UK's independent authority for data protection enforcement. The ICO Children's Code underpins RoboCode.Africa's age-appropriate design principles. |
| **IDE** | Integrated Development Environment | See Domain Glossary entry. |
| **IdP** | Identity Provider | A service that manages user identities and authenticates users for other applications via SSO (e.g., Google Workspace for Education, Microsoft Entra ID). |
| **IMU** | Inertial Measurement Unit | A sensor combining accelerometer and gyroscope data. The MPU6050 is the simulated IMU in RoboCode Studio. |
| **JWT** | JSON Web Token | A compact, URL-safe means of representing signed claims between the client and the RoboCode.Africa backend. Used for session management and RBAC enforcement. |
| **LCD** | Liquid Crystal Display | See Domain Glossary entry. |
| **LDR** | Light-Dependent Resistor | See Domain Glossary entry. |
| **LED** | Light-Emitting Diode | See Domain Glossary entry. |
| **MFA** | Multi-Factor Authentication | An authentication mechanism requiring users to verify identity with two or more factors. RoboCode.Africa mandates TOTP-based MFA for Super Admin, Platform Moderator, School Admin, and Teacher roles. See UR-AUTH series. |
| **MCU** | Microcontroller Unit | An integrated circuit containing a CPU, memory, and programmable I/O peripherals on a single chip. In RoboCode Studio the simulated MCUs are the ATmega328P (Arduino UNO R3), the ESP32, and the RP2040 (Raspberry Pi Pico). |
| **NDPR** | Nigeria Data Protection Regulation | Nigeria's primary data protection framework (2019, superseded by the Nigeria Data Protection Act 2023). RoboCode.Africa complies with the NDPR and its successor for Nigerian users. |
| **NFR** | Non-Functional Requirement | A requirement that specifies how the system performs a function, rather than what it does. Addressed in the SSD (NFR-<CAT>-<nnn> identifiers) and in Section 20 of this URD (Non-Functional User Expectations). |
| **OIDC** | OpenID Connect | An identity layer on top of OAuth 2.0 providing standardised authentication via ID tokens. RoboCode.Africa uses OIDC for school SSO integrations and for its own OAuth2 provider. See UR-AUTH series. |
| **OLED** | Organic Light-Emitting Diode | See Domain Glossary entry. |
| **OTP** | One-Time Password | A time- or counter-based single-use code used as a second authentication factor. See also TOTP. |
| **PII** | Personally Identifiable Information | Any data that can identify an individual (name, email address, profile photo, IP address, etc.). RoboCode.Africa applies automatic PII filtering to student-submitted content and messages to prevent inadvertent disclosure. |
| **PIO** | Programmable I/O | See Domain Glossary entry (PIO (Programmable I/O)). A distinctive RP2040 / Raspberry Pi Pico hardware feature; simulated by `rp2040js` within the RSE. |
| **PIR** | Passive Infrared | See Domain Glossary entry (PIR Sensor). |
| **POPIA** | Protection of Personal Information Act | South Africa's primary data protection legislation (Act 4 of 2013). RoboCode.Africa complies with POPIA for South African users and School Tenants. |
| **PWA** | Progressive Web Application | See Domain Glossary entry. Out of scope for v1.0. |
| **PWM** | Pulse-Width Modulation | See Domain Glossary entry. |
| **RBAC** | Role-Based Access Control | See Domain Glossary entry. |
| **RLS** | Row-Level Security | See Domain Glossary entry. |
| **RSE** | RoboCode Simulation Engine | See Domain Glossary entry. |
| **RTC** | Real-Time Clock | A timekeeping integrated circuit (DS1307, DS3231) that maintains the current time even when the microcontroller is powered off. Simulated in RoboCode Studio. |
| **RVM** | RoboCode Virtual Machine | See Domain Glossary entry. |
| **SPA** | Single-Page Application | A web application architecture in which a single HTML page is loaded and content is dynamically updated via JavaScript. RoboCode Studio is delivered as a SPA built with React 18 + TypeScript. |
| **SPI** | Serial Peripheral Interface | See Domain Glossary entry. |
| **SRS** | Software Requirements Specification | The IEEE 830 document type. The RoboCode.Africa SSD follows the SRS convention for functional and non-functional requirements. |
| **SSO** | Single Sign-On | See Domain Glossary entry. |
| **SSD** | System Specification Document | The companion technical document to this URD, containing functional requirements (FR-<MODULE>-<nnn>), non-functional requirements (NFR-<CAT>-<nnn>), interface requirements (IR-<nnn>), data requirements (DR-<nnn>), and security requirements (SR-<nnn>). |
| **TLS** | Transport Layer Security | The cryptographic protocol securing HTTPS connections. All RoboCode.Africa endpoints use TLS 1.2 or higher; TLS 1.3 is preferred. Custom tenant domains receive automated TLS certificates via ACME/Let's Encrypt. |
| **TOTP** | Time-Based One-Time Password | A variant of OTP (RFC 6238) that generates a new code every 30 seconds using a shared secret and the current time. Used for MFA on staff and admin accounts. See UR-AUTH series. |
| **UART** | Universal Asynchronous Receiver-Transmitter | See Domain Glossary entry. |
| **UF2** | USB Flashing Format | See Domain Glossary entry. The binary firmware container format used by the RP2040 / Raspberry Pi Pico ecosystem; loaded into the `rp2040js` simulator for accurate firmware execution in RoboCode Studio. |
| **UI** | User Interface | The visual and interactive presentation layer of a software application. |
| **URD** | User Requirements Document | This document. Defines what users need the RoboCode.Africa platform to do, using UR-<AREA>-<nnn> identifiers. |
| **WASM** | WebAssembly | A binary instruction format for a stack-based virtual machine, enabling near-native performance in web browsers. RoboCode.Africa uses a WASM-based AVR toolchain for in-browser Arduino sketch compilation. |
| **WCAG** | Web Content Accessibility Guidelines | The W3C standard for web accessibility. RoboCode.Africa targets WCAG 2.2 Level AA compliance across all user-facing surfaces. See UR-NFR series and Section 20. |
| **WebGL** | Web Graphics Library | A JavaScript API for rendering 2D and 3D graphics in the browser via the GPU, based on OpenGL ES. The 3D view in RoboCode Studio uses WebGL2 (with progressive WebGPU support). |
| **WebGPU** | Web Graphics Processing Unit API | A next-generation browser graphics and compute API. RoboCode Studio targets progressive WebGPU support for 3D rendering, with graceful fallback to WebGL2. |
| **Wi-Fi** | Wireless Fidelity | The IEEE 802.11 family of wireless networking standards. The ESP32 DevKit simulates Wi-Fi (802.11 b/g/n) connectivity for network-enabled project sketches. |
| **WASM** | WebAssembly | See entry above. |
| **Yjs** | (no expansion; proper name) | See Domain Glossary entry. |

---

## Requirement-ID Reference

For convenience, the full identifier scheme used across this URD and the SSD is summarised below.

```
DOCUMENT  PREFIX   AREA / MODULE       EXAMPLE
--------  ------   ----------------    --------------------
URD       UR-      ONB  Onboarding,     UR-ONB-001
                        Consent &
                        Minor-account
                        protections
                   AUTH Authentication  UR-AUTH-001
                   SCH  School/Tenant   UR-SCH-001
                   STU  RoboCode Studio UR-STU-001
                        Canvas
                   SIM  Simulation      UR-SIM-001
                   CODE Code Editor     UR-CODE-001
                   LRN  Learning        UR-LRN-001
                   TEAM Teams           UR-TEAM-001
                   GAM  Gamification    UR-GAM-001
                   COMM Communication   UR-COMM-001
                   ADM  Administration  UR-ADM-001
                   NFR  Non-functional  UR-NFR-001

URD       UC-      (Use Cases)          UC-001
URD       US-      (User Stories)       US-001

SSD       FR-      AUTH, TEN, STU,      FR-AUTH-001
                   SIM, CODE, LRN,
                   TEAM, GAM, COMM,
                   MOD, ADM

SSD       NFR-     PERF, SEC, AVAIL,    NFR-PERF-001
                   SCALE, ACCESS, etc.

SSD       IR-      (Interface Req.)     IR-001
SSD       DR-      (Data Req.)          DR-001
SSD       SR-      (Security Req.)      SR-001
```

---

## Legal and Regulatory Frameworks Referenced

| Abbreviation | Full Name | Jurisdiction | Key Obligation for RoboCode.Africa |
|---|---|---|---|
| COPPA | Children's Online Privacy Protection Act | United States | Verifiable parental consent for under-13; data minimisation; no behavioural advertising. Applied globally as baseline. |
| GDPR | General Data Protection Regulation (EU) 2016/679 | European Union | Lawful basis for all personal data processing; data subject rights; breach notification within 72 hours. |
| GDPR-K | GDPR children's provisions + UK Children's Code | EU / UK | Heightened consent (under-16 EU; under-13 UK); no profiling; high privacy defaults; age-appropriate design. |
| POPIA | Protection of Personal Information Act 4 of 2013 | South Africa | Lawful processing conditions; data subject rights; mandatory data breach notification to the Information Regulator. |
| NDPR | Nigeria Data Protection Regulation 2019 / Nigeria Data Protection Act 2023 | Nigeria | Consent and lawful basis; data localisation considerations; mandatory privacy impact assessments for large-scale processing. |
| Kenya DPA | Kenya Data Protection Act 2019 | Kenya | Registration with the Office of the Data Protection Commissioner; lawful processing; data subject rights. |
| Zim CDPA | Zimbabwe Cyber and Data Protection Act 2021 | Zimbabwe | Registration with the Postal and Telecommunications Regulatory Authority; lawful processing; cross-border transfer restrictions. |
