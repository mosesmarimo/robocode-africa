# User Requirements: RoboCode Studio Canvas, Components and Wiring

## Overview

This section specifies the user requirements for the **RoboCode Studio** visual canvas — the drag-and-drop electronics design workspace that forms the centrepiece of the RoboCode.Africa platform. The canvas allows Students (both primary-school and high-school), supervised by Teachers and School Admins, to assemble virtual circuits from a catalogue of real-world components, wire them on a virtual breadboard, and run simulations through the RoboCode Simulation Engine (RSE) without needing physical hardware.

Requirements in this section carry the prefix **UR-STU-** in accordance with the REQUIREMENT-ID SCHEME defined for the User Requirements Document. Priority follows MoSCoW notation: **Must**, **Should**, **Could**, **Won-t** (this release).

Cross-references:
- Simulation behaviour is specified in *User Requirements: Simulation Experience*.
- Code execution tied to canvas state is specified in *User Requirements: Code Editor and Programming*.
- Gamification hooks (RoboPoints earned for completing wiring tasks) are specified in *User Requirements: Gamification, RoboPoints and Leaderboards*.
- Collaboration and sharing flows are specified in *User Requirements: Teams, Competitions and Collaboration*.
- Accessibility expectations apply throughout and are elaborated in *User Requirements: Non-Functional User Expectations*.

---

## Scope

The canvas interface encompasses:

1. The **Component Palette** — browsable and searchable catalogue of all supported boards, prototyping parts, LEDs/displays, passives, sensors, actuators, communication modules, and power components.
2. The **Design Canvas** — a spatial, zoomable, pannable workspace on which components are placed and arranged.
3. The **Wiring Layer** — a pin-to-pin, breadboard-aware connection system with visual feedback.
4. **View Modes** — 2D schematic-style and 3D perspective views, with graceful fallback.
5. **Canvas Tools** — selection, move, rotate, duplicate, delete, multi-select, undo/redo, zoom/pan.
6. **Connection Validation** — real-time, student-friendly electrical rule checking.
7. **Project Management** — save, version, template, and share capabilities at the canvas level.

The canvas is rendered entirely in the browser. 2D rendering uses **wokwi-elements** web components. 3D rendering uses **Three.js + React Three Fiber + drei** with WebGL2, with progressive upgrade to WebGPU where available. The simulation core (avr8js for Arduino UNO / ATmega328P; rp2040js for Raspberry Pi Pico / RP2040; ESP32 core simulation for the ESP32) is invoked from the Code Editor and reads canvas state; it is out of scope for this section. Board definitions for all three first-class boards and any custom boards follow the **wokwi-boards** manifest format.

---

## Component Palette

### Description

The Component Palette is the primary discovery interface through which a Student selects hardware to place on the canvas. It must be approachable to a primary-school learner encountering electronics for the first time, while remaining efficient for a high-school student assembling a multi-component project.

### Requirements — Component Palette

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-STU-001 | The palette shall display all components in the supported catalogue, grouped into named categories. | Must | Categories: Boards, Prototyping, LEDs & Displays, Passives & Discretes, Sensors, Actuators & Output, Communication, Power. |
| UR-STU-002 | The palette shall provide a real-time text search that filters components by name, keyword, or model number as the Student types. | Must | Debounce ≤ 150 ms; results update without page reload. |
| UR-STU-003 | Each catalogue entry shall show a thumbnail image (2D render or icon), common name, and a one-line description. | Must | Thumbnail must be legible at palette width (min 64 px). |
| UR-STU-004 | The palette shall indicate which components are available for the currently selected board (Arduino UNO R3, ESP32 DevKit, Raspberry Pi Pico, or any custom board). | Must | Incompatible components are shown but visually dimmed with a tooltip explanation. Compatibility is derived from the board's MCU core target (avr8js / rp2040js / ESP32 core). |
| UR-STU-005 | A Teacher or School Admin shall be able to configure a restricted palette for a specific class or assignment, hiding components not relevant to the lesson. | Should | Restriction stored per-assignment; overridden by School Admin. |
| UR-STU-006 | The palette shall surface a "Recently Used" section showing the last eight components the Student placed in any session. | Should | Persisted per-user in backend; shown at top of palette. |
| UR-STU-007 | The palette shall offer a "Favourites" list; a Student can add or remove components by clicking a star icon. | Could | Stored per-user; max 20 favourites. |
| UR-STU-008 | The palette shall be collapsible to maximise canvas space on small screens (min supported viewport: 1024 × 600 px). | Must | Collapse/expand via keyboard shortcut and visible button; state persisted per-session. |
| UR-STU-009 | Each component entry shall link to a brief reference card (name, photo, typical use, pin-out table) accessible without leaving the Studio. | Should | Opens in a side panel, not a new tab. Reference cards are part of the global content library (see *User Requirements: Learning, Courses, Tasks and Assessment*). |
| UR-STU-010 | The palette shall be fully keyboard-navigable and screen-reader accessible (WCAG 2.2 AA). | Must | Arrow keys navigate categories and items; Enter/Space initiates placement. |

---

## Board Selection and Custom Board Definitions

### Description

Before or during assembly, a Student selects the target development board for their project. RoboCode Studio ships three first-class boards — **Arduino UNO R3**, **ESP32 DevKit**, and **Raspberry Pi Pico** — plus an extensible board library drawn from **wokwi-boards** definitions. Platform admins and approved advanced users/teachers may upload additional custom board definitions in the same manifest format, enabling community-created or proprietary boards without any code change to the platform.

### Requirements — Board Selection and Custom Board Definitions

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-STU-075 | A Student shall be able to select the target board for a project from a board picker that lists at minimum the three first-class boards: Arduino UNO R3 (ATmega328P), ESP32 DevKit (ESP-WROOM-32), and Raspberry Pi Pico (RP2040). | Must | Board picker presented when creating a new project and accessible from project settings. Only one board may be active per project. |
| UR-STU-076 | The board picker shall also list additional boards available in the wokwi-boards library (e.g., Arduino Nano, Arduino Mega, ESP32-S3, Raspberry Pi Pico W) and any approved custom boards for the Student's tenant. | Should | Boards grouped by family (Arduino, ESP32, Raspberry Pi, Custom). Search/filter supported. |
| UR-STU-077 | Switching the active board on an existing project shall prompt the Student with a warning that existing wiring connections may need to be updated; the switch shall be confirmed before taking effect. | Must | Incompatible wires/pins flagged in the Warnings panel immediately after the switch. The previous board configuration is saved in the undo stack. |
| UR-STU-078 | When the Raspberry Pi Pico is the active board, the simulator shall use the **rp2040js** library (github.com/wokwi/rp2040js) to execute real RP2040 firmware (UF2/ELF image) in the browser, supporting MicroPython, CircuitPython, and C/C++ (Arduino-Pico core / Pico SDK). | Must | Accurate execution loads the firmware image into rp2040js; dual-core ARM Cortex-M0+ at 133 MHz, 264 KB SRAM, and 2 MB QSPI flash are modelled. |
| UR-STU-079 | The Raspberry Pi Pico board view shall expose its 26 multifunction GPIO pins (GP0–GP28) on the 40-pin header, including: 3 ADC-capable inputs (GP26/GP27/GP28), 2× UART, 2× SPI, 2× I2C, 16 PWM channels, 8 PIO state machines, and USB 1.1. Logic level is 3.3 V. | Must | Pin metadata derived from the wokwi-boards Pico manifest; ADC/PWM/PIO capability tags govern component compatibility checks. |
| UR-STU-080 | A Platform Admin or an approved Teacher/advanced user shall be able to upload a custom board definition using the wokwi-boards manifest format: a `board.json` declaring the board name, MCU core target, and pin array (each pin with name, type, and x/y position), together with an SVG visual asset. | Should | No code change is required to add a board. Uploads are validated against the JSON schema and SVG safety checks; non-admin uploads enter the standard approval/moderation workflow before becoming available to learners. |
| UR-STU-081 | The custom board upload flow shall validate that each pin entry in `board.json` includes: a unique name, a recognised type (power / ground / gpio / analog / i2c / spi / uart), and numeric x/y coordinates; and that the companion SVG passes an allowlist-based sanitisation check. | Must | Validation errors returned as a structured list with field-level detail; upload is rejected until all errors are resolved. |
| UR-STU-082 | A custom board definition uploaded by a non-admin user shall be visible only to the uploader until it has passed the moderation workflow; once approved, it becomes available to all users in the uploader's tenant (or platform-wide, at a Platform Admin's discretion). | Must | Moderation status (Pending / Approved / Rejected) displayed to the uploader in the board library management view. |
| UR-STU-083 | Each board definition (built-in or custom) shall declare its MCU core target so the simulator selects the correct execution engine: avr8js for AVR/ATmega boards, rp2040js for RP2040 boards, and the ESP32 core for ESP32-family boards. | Must | Unknown core targets render the board visually but disable the Simulate button with an explanatory tooltip. |

---

## Drag-and-Drop Component Placement

### Description

Students drag components from the palette onto the canvas, or click a component to enter placement mode (for pointer/touch devices where drag initiation is ambiguous). The canvas must provide clear spatial feedback during and after placement.

### Requirements — Component Placement

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-STU-011 | A Student shall be able to drag any component from the palette and drop it onto the canvas to place it. | Must | Drag ghost (semi-transparent component preview) follows the pointer during drag. |
| UR-STU-012 | A Student shall be able to click a component in the palette to enter placement mode, then click on the canvas to place it (alternative for touch and accessibility). | Must | Escape key cancels placement mode. |
| UR-STU-013 | The canvas shall snap components to a configurable grid (default: 2.54 mm pitch, matching breadboard spacing). | Must | Snap can be temporarily disabled by holding the Alt/Option key. |
| UR-STU-014 | Placing a breadboard shall automatically render all 830 tie-point holes; placing a half-breadboard shall render its tie-point layout. | Must | Tie-point columns labelled a–j; rows numbered 1–63 (full) or 1–30 (half). Power rail labels (+/−) displayed. |
| UR-STU-015 | An Arduino UNO R3, ESP32 DevKit, or Raspberry Pi Pico placed on the canvas shall display all labelled pins in a 2D silk-screen style view, matching real component pin labels. | Must | Pin labels match the physical board (D0–D13, A0–A5 for UNO; GPIO numbering for ESP32; GP0–GP28 plus power/GND labels on the 40-pin header for Pico). |
| UR-STU-016 | When a component is dragged over a breadboard, valid tie-point insertion positions shall be highlighted in real time. | Must | Highlight colour: green for valid, red for occupied or invalid span. |
| UR-STU-017 | Multi-legged through-hole components (e.g., LED, resistor, push button) shall snap their pins to appropriate breadboard tie-points automatically, respecting component body span. | Must | Component body span derived from wokwi-elements geometry data. |
| UR-STU-018 | The canvas shall support placing an unlimited number of components, subject to browser memory constraints; the platform shall warn when projected memory usage exceeds 80 % of an estimated safe budget. | Should | Warning dismissable; project save is still allowed. |
| UR-STU-019 | The canvas shall support touch-based drag-and-drop on tablets (min. 10-inch screen) running a modern mobile browser. | Should | Pointer Events API used; tested on Chrome/Android and Safari/iPadOS. |

---

## Component Manipulation

### Description

Once placed, components must be easy to reposition, orient, copy, and remove. These actions must be intuitive for learners from age 8 upward.

### Requirements — Component Manipulation

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-STU-020 | A Student shall be able to move a placed component by dragging it to a new position on the canvas. | Must | Attached wires follow the component (rubber-band behaviour). |
| UR-STU-021 | A Student shall be able to rotate a component in 90-degree increments using a context menu, keyboard shortcut (R), or rotation handle. | Must | Rotation applies to 2D view; 3D view updates correspondingly. |
| UR-STU-022 | A Student shall be able to duplicate a selected component (Ctrl/Cmd+D or context menu "Duplicate"), placing the copy offset by one grid unit. | Must | Duplicated component carries the same properties but no wire connections. |
| UR-STU-023 | A Student shall be able to delete a selected component (Delete/Backspace key or context menu "Remove"), removing its attached wires simultaneously. | Must | Confirmation prompt shall not be shown for single-component deletions to reduce friction; undo is available (UR-STU-030). |
| UR-STU-024 | A Student shall be able to select multiple components simultaneously by rubber-band selection (click-and-drag on empty canvas area) or by Shift-clicking individual components. | Must | Selected items highlighted with a group bounding box. |
| UR-STU-025 | Move, rotate, duplicate, and delete operations shall apply to the entire multi-selection as a unit. | Must | Wires between selected components are preserved; external wires rubber-band. |
| UR-STU-026 | Right-clicking (or long-pressing on touch) a component shall open a context menu with: Move to Front, Move to Back, Duplicate, Rotate CW, Rotate CCW, Properties, Remove. | Should | "Properties" opens a panel showing configurable component attributes (e.g., LED colour, resistor value). |
| UR-STU-027 | A Student shall be able to configure component properties (where applicable) via an inspector panel: resistor ohmic value, LED colour, potentiometer range, DHT sensor variant (DHT11/DHT22), LCD dimensions, etc. | Must | Property changes are reflected immediately in the canvas rendering and in the RSE model. |
| UR-STU-028 | The canvas shall maintain a Z-order for overlapping components; Move to Front / Move to Back operations shall reorder Z-order within the same layer. | Should | Board, breadboard, and wires occupy dedicated layers beneath discrete components. |

---

## Wiring — Pin-to-Pin Jumper Connections

### Description

Wiring is the core activity of circuit assembly. Students draw jumper wire connections between component pins and breadboard tie-points. The wiring layer must faithfully model breadboard electrical topology (column-shared rows, isolated power rails) and provide real-time feedback.

### Breadboard Topology Model

```
Full-size Breadboard (830 tie-points) — electrical topology
+-------------------------------------------------------------+
|  [+] [+] [+] [+] [+] ... (power rail, all connected) [+]  |
|  [-] [-] [-] [-] [-] ... (power rail, all connected) [-]  |
|                                                             |
|   a  b  c  d  e    f  g  h  i  j   <- hole columns        |
|  [1][1][1][1][1]  [1][1][1][1][1]  <- row 1 (a1–e1 tied) |
|  [2][2][2][2][2]  [2][2][2][2][2]  <- row 2 (a2–e2 tied) |
|   ...                                                       |
|  [63]...                            <- row 63              |
|                                                             |
|  [+] [+] ... (bottom power rail)                           |
|  [-] [-] ... (bottom power rail)                           |
+-------------------------------------------------------------+
Note: a–e share one node per row; f–j share a separate node per row.
Power rails run full length on each side (top and bottom).
```

### Requirements — Wiring

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-STU-029 | A Student shall be able to draw a jumper wire between any two compatible pins or tie-points by clicking the source pin, then clicking the destination pin (two-click wiring). | Must | Cursor changes to crosshair when hovering a connectable pin. Cancel with Escape. |
| UR-STU-030 | While drawing a wire, valid destination pins/tie-points shall be highlighted; invalid targets (wrong type, already connected to same net) shall be visually dimmed. | Must | Valid targets: green ring; invalid: no highlight. |
| UR-STU-031 | Jumper wires shall snap precisely to breadboard tie-points, board pin headers, and component lead positions on the canvas grid. | Must | Snap tolerance: 4 px at 100 % zoom. |
| UR-STU-032 | The wiring layer shall correctly model breadboard electrical topology: all tie-points in the same row-half (a–e or f–j) on the same row are electrically connected; power rails on the same side run the full length of the board. | Must | Connection validation (UR-STU-051 onward) uses this model. |
| UR-STU-033 | The platform shall route wires automatically in a readable rectilinear (Manhattan) path, avoiding overlap with component bodies where possible. | Should | Student may manually drag intermediate wire segments to reroute. |
| UR-STU-034 | Each wire shall be colour-selectable from a palette of at least eight standard colours (red, black, orange, yellow, green, blue, white, grey). | Must | Default colour assignment: red for VCC/5V, black for GND, others auto-assigned per net. Student may override. |
| UR-STU-035 | A Student shall be able to add a text label to any wire or net; the label shall appear on the canvas at the midpoint of the wire segment. | Could | Labels max 24 characters; font size scales with zoom. |
| UR-STU-036 | Hovering over a wire shall highlight the entire net (all electrically connected tie-points and pins) in a distinct highlight colour. | Should | Net highlight is transient; disappears when cursor moves away. |
| UR-STU-037 | A Student shall be able to delete a wire by selecting it (click) and pressing Delete/Backspace, or by right-clicking and choosing "Remove Wire". | Must | Multiple wires can be selected for batch deletion. |
| UR-STU-038 | The platform shall allow a wire to be split at an intermediate point to insert a new node by double-clicking the wire segment. | Could | Useful for adding additional connections to a mid-wire junction. |
| UR-STU-039 | Wire endpoints that terminate at a breadboard tie-point shall display the tie-point address (e.g., "a5", "+rail-L") in a tooltip on hover. | Should | Tooltip also shows net name if one has been auto-assigned or labelled. |
| UR-STU-040 | Wire undo/redo shall operate at the granularity of individual wire draw or delete actions (see UR-STU-058, UR-STU-059). | Must | Part of unified undo/redo stack. |

---

## Undo, Redo, Zoom and Pan

### Requirements — Canvas Navigation and History

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-STU-041 | The canvas shall provide an unlimited-depth undo stack for all canvas actions (place, move, rotate, delete, wire, property change) within a session. | Must | Ctrl/Cmd+Z to undo; Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y to redo. Stack is per-session; cleared on page reload unless auto-saved. |
| UR-STU-042 | The canvas shall provide a redo stack that replays undone actions in order. | Must | Redo stack is cleared when a new canvas action is performed after an undo. |
| UR-STU-043 | The canvas shall support smooth zoom in/out via mouse scroll wheel, trackpad pinch-to-zoom, and +/− keyboard shortcuts. | Must | Zoom range: 20 %–400 %. Default: 100 %. |
| UR-STU-044 | A "Fit to Screen" button (keyboard shortcut: F) shall scale and centre the canvas to show all placed components. | Must | Animates smoothly over 200 ms. |
| UR-STU-045 | The canvas shall support pan via middle-mouse drag, Space+left-mouse drag, or two-finger trackpad scroll. | Must | Pan velocity damped; no abrupt snapping. |
| UR-STU-046 | A minimap (thumbnail of the full canvas) shall be displayed in the corner for projects with a large component count (> 10 components). | Could | Minimap is interactive: clicking navigates; dragging pans. Toggleable. |
| UR-STU-047 | Zoom level and viewport position shall be saved with the project so that re-opening a project restores the last view. | Should | Stored in project metadata, not browser state. |

---

## 2D and 3D View Toggle

### Requirements — View Modes

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-STU-048 | The canvas shall offer a 2D view (top-down schematic-style) using wokwi-elements web components as the default view mode. | Must | 2D renders component silk screens, breadboard grid, and colour-coded wires on an SVG/Canvas layer. |
| UR-STU-049 | The canvas shall offer a 3D perspective view rendered via Three.js + React Three Fiber + drei (WebGL2), toggled by a "3D View" button or keyboard shortcut (shortcut: 3). | Should | 3D view is read-and-interact; drag-to-orbit, scroll-to-zoom. Component placement and wiring remain in 2D mode; 3D is a companion visualisation mode. |
| UR-STU-050 | On devices where WebGL2 is unavailable or GPU performance is below threshold, the platform shall gracefully fall back to 2D view, notifying the Student with a plain-language message. | Must | Performance threshold: < 30 FPS on a sustained 5-second render test at canvas open. 3D button is disabled and replaced by an explanatory tooltip. |

---

## Connection Validation and Student-Friendly Feedback

### Description

The Connection Validation subsystem is one of the most educationally important features of RoboCode Studio. It must detect common wiring errors — wrong polarity, missing current-limiting resistors, short circuits, unpowered components — and communicate them in language appropriate for the age group, without simply providing the answer.

### Requirements — Validation and Feedback

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-STU-051 | The platform shall continuously analyse the canvas netlist and report wiring errors in real time as the Student wires components. | Must | Analysis runs in a Web Worker to avoid blocking the UI thread; latency ≤ 300 ms after each change. |
| UR-STU-052 | Detected errors shall be displayed in a dismissable Warnings panel that lists each issue with: a student-friendly plain-language title, a one-sentence explanation, and a "Learn More" link to the relevant reference card. | Must | Panel visible without obscuring the canvas; collapsible. Icon badge shows error count. |
| UR-STU-053 | Erroneous wires or unconnected pins involved in a detected fault shall be highlighted on the canvas (orange for warning, red for error) while the corresponding entry in the Warnings panel is active. | Must | Highlight removed when the fault is corrected. |
| UR-STU-054 | The platform shall detect and report **wrong polarity** on polarised components (LEDs, electrolytic capacitors, active buzzers) — for example, "Your LED's longer leg (anode +) should connect to the positive side. Try swapping the ends of the wire." | Must | Uses pin metadata (anode/cathode tags) from the component catalogue. |
| UR-STU-055 | The platform shall detect and report a **missing current-limiting resistor** on an LED connected directly to a 5 V or 3.3 V power pin, using language such as: "LEDs need a resistor to protect them. Add a resistor (220 Ω is a good start) in series between the pin and the LED." | Must | Rule applied per LED instance; checks the direct net path to MCU pin or power rail. |
| UR-STU-056 | The platform shall detect and report a **short circuit** (VCC net directly connected to GND net without a load), using language such as: "Oops! Power and ground are directly connected — this is a short circuit. Check your wires." | Must | Short-circuit detection runs on the netlist graph; flagged before simulation starts. |
| UR-STU-057 | The platform shall detect and report **unpowered components** — components whose VCC/power pin is not connected to any power source — using language such as: "Your [component name] does not have power. Connect its VCC pin to 5V (or 3.3V for ESP32)." | Must | Also detects floating GND pin. |
| UR-STU-058 | The platform shall detect and warn about **floating input pins** on the MCU (digital input not pulled high or low), using language such as: "Pin D2 is connected but has no pull-up or pull-down resistor. It may read random values. Add a 10kΩ resistor to VCC or GND." | Should | Warning only; simulation proceeds. |
| UR-STU-059 | Validation messages shall be tailored by reading level: primary-school Students (age 8–12) receive shorter, simpler sentences; high-school Students (age 13–18) receive more technical detail. | Could | Reading level inferred from school-grade field in Student profile. |
| UR-STU-060 | The Warnings panel shall include a "Run Check" button allowing a Student to manually re-trigger the full validation pass at any time. | Should | Useful after bulk edits when real-time latency is noticeable. |

---

## Save, Version Control and Sharing

### Description

Projects created in RoboCode Studio must be persistently saved and versioned so that Students can iterate safely, Teachers can review work, and projects can be shared for collaboration or submission.

### Requirements — Project Save, Versioning and Sharing

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-STU-061 | The platform shall auto-save the current canvas state at regular intervals (default: every 60 seconds) while the Student is active, and immediately on closing/navigating away (beforeunload). | Must | Auto-save is silent; a "Last saved" timestamp is shown in the status bar. |
| UR-STU-062 | A Student shall be able to manually save a named project at any time (Ctrl/Cmd+S). | Must | If the project is unnamed, a "Save As" dialog prompts for a project name. |
| UR-STU-063 | Each manual save and each auto-save shall create a versioned snapshot. A Student shall be able to view a version history list and restore any previous snapshot. | Should | Version list shows: timestamp, auto/manual flag, thumbnail. Restoring a version creates a new snapshot (non-destructive). |
| UR-STU-064 | A Student shall be able to rename or duplicate a project from the project management view. | Must | Duplicate copies canvas state and code; a new project ID is assigned. |
| UR-STU-065 | A Student shall be able to generate a shareable link for a project. The link shall open a read-only view of the canvas and code for any authenticated user with the link. | Should | Shareable links are tenant-scoped; sharing outside the school's tenant requires explicit approval by a Teacher or School Admin. |
| UR-STU-066 | A Teacher shall be able to view, comment on, and annotate any Student's project within their assigned classes without altering the Student's canvas. | Must | Teacher annotations stored separately from Student canvas data. |
| UR-STU-067 | A Student shall be able to export their project as a JSON file containing the full canvas netlist, component list, and code, compatible with Wokwi project format where applicable. | Could | Export available from the project settings menu. |
| UR-STU-068 | A Student shall be able to import a Wokwi-compatible JSON project file into RoboCode Studio. | Could | Import validates schema; unknown component types are flagged. |
| UR-STU-069 | Projects are stored under the Student's tenant (school). Projects are not publicly listed. Sharing is governed by RBAC and school policy settings. | Must | Aligns with COPPA/GDPR-K data-minimisation requirements. See *User Requirements: Onboarding, Signup and Approval*. |

---

## Starter Templates

### Description

Starter templates lower the barrier for new Students by providing pre-wired, commented project skeletons that demonstrate best practices and can be customised.

### Requirements — Starter Templates

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-STU-070 | The platform shall provide a library of at least 20 starter templates covering common beginner circuits (e.g., Blink LED, Traffic Light, Buzzer Melody, Servo Sweep, Ultrasonic Distance, DHT11 Weather Station, LCD Hello World, 7-Segment Counter). | Must | Templates are part of the global content library managed by Super Admin / Platform Moderator. |
| UR-STU-071 | Each starter template shall include: a pre-wired canvas, starter code in the Code Editor, a brief description, difficulty rating (Beginner / Intermediate / Advanced), and the target board (UNO R3, ESP32, Raspberry Pi Pico, or a custom board). | Must | Difficulty rating displayed with a coloured badge in the template gallery. Pico templates may include MicroPython, CircuitPython, or C/C++ starter code variants. |
| UR-STU-072 | A Teacher shall be able to create and publish custom starter templates scoped to their school or to a specific class. | Should | Custom templates stored in the school's content library; not visible to other tenants. |
| UR-STU-073 | Starting from a template shall always create a copy owned by the Student; the original template is never modified. | Must | Copy-on-open enforced server-side. |
| UR-STU-074 | A Student shall be able to browse templates filtered by board type, difficulty, and topic (e.g., "Sensors", "Displays", "Motors"). | Should | Template gallery accessible from the Studio "New Project" flow and from the learning dashboard. |

---

## MoSCoW Summary Table

The following table consolidates the priority of all UR-STU requirements in this section for planning and traceability.

| Priority | Requirement IDs |
|---|---|
| **Must** | UR-STU-001, 002, 003, 004, 008, 010, 011, 012, 013, 014, 015, 016, 017, 020, 021, 022, 023, 024, 025, 027, 029, 030, 031, 032, 034, 037, 040, 041, 042, 043, 044, 045, 048, 050, 051, 052, 053, 054, 055, 056, 057, 061, 062, 064, 066, 069, 070, 071, 073, 075, 077, 078, 079, 081, 082, 083 |
| **Should** | UR-STU-005, 006, 009, 019, 026, 028, 033, 036, 039, 046, 047, 049, 058, 060, 063, 065, 072, 074, 076, 080 |
| **Could** | UR-STU-007, 035, 038, 046, 059, 067, 068 |
| **Won-t** | UR-STU-018 (unlimited component count with memory warning deferred to post-launch capacity review) |

---

## Constraints and Assumptions

1. **Browser support**: RoboCode Studio targets the last two major versions of Chrome, Firefox, Safari, and Edge. Internet Explorer is not supported.
2. **Minimum viewport**: 1024 × 600 px for the full Studio UI; below this, the platform redirects to a "device not supported" page.
3. **Wokwi compatibility**: The wokwi-elements component library, avr8js, rp2040js, the ESP32 core simulator, and wokwi-boards are consumed as open-source dependencies (github.com/wokwi). The platform must track upstream releases and apply security patches within 14 days of disclosure. The wokwi-boards manifest format is the canonical schema for all board definitions — built-in and custom.
4. **Offline support**: The canvas relies on cloud auto-save (UR-STU-061); offline / local-only operation is out of scope for this release. A future release may introduce a Service Worker cache for read-only project viewing.
5. **Multi-user simultaneous editing** on a single canvas is a Teams/Collaboration feature covered in *User Requirements: Teams, Competitions and Collaboration* using Yjs CRDT; the requirements in this section assume a single active editor per canvas at a time.
6. **Accessibility**: All interactive canvas controls (palette, toolbar, context menus, Warnings panel, zoom controls) shall conform to WCAG 2.2 AA as elaborated in *User Requirements: Non-Functional User Expectations*. The canvas drawing area itself (SVG/WebGL) follows best-effort accessible alternatives (keyboard-navigable component selection, ARIA live regions for validation errors).
7. **Low-connectivity environments**: Component thumbnails and reference card images shall be served via CDN/edge (Cloudflare/CloudFront) with appropriate cache headers to minimise round-trips for Students in Africa on constrained networks. Canvas state serialisation is compact JSON; large 3D assets are lazy-loaded.

---

## Glossary (section-local terms)

| Term | Definition |
|---|---|
| Canvas | The zoomable, pannable workspace in RoboCode Studio on which components are placed and wired. |
| Netlist | A data structure representing all components and their electrical connections, derived from the canvas state. Used by the RSE and connection validation. |
| Tie-point | An individual hole in a breadboard. Each tie-point belongs to an electrical node shared with its row-half neighbours (or the full power rail). |
| Net | A set of electrically connected pins and tie-points forming a single electrical node. |
| RSE | RoboCode Simulation Engine — the subsystem that executes simulation from the netlist and MCU firmware. |
| RVM | RoboCode Virtual Machine — the simplified/interpreted execution path for younger learners. |
| wokwi-elements | The open-source web-component library (github.com/wokwi/wokwi-elements) providing 2D rendered electronic component visuals. |
| avr8js | The open-source JavaScript AVR/ATmega328P instruction-set simulator (github.com/wokwi/avr8js) used as the accurate execution core for Arduino UNO sketches. |
| rp2040js | The open-source JavaScript RP2040 instruction-set simulator (github.com/wokwi/rp2040js) used as the accurate execution core for Raspberry Pi Pico firmware (MicroPython, CircuitPython, and C/C++ UF2/ELF images). |
| wokwi-boards | The open-source data-driven board definition library (github.com/wokwi/wokwi-boards) whose manifest format (board.json + SVG) is the canonical schema used by RoboCode Studio for all built-in and custom board definitions. |
| RP2040 | The dual-core ARM Cortex-M0+ microcontroller (133 MHz, 264 KB SRAM, 2 MB QSPI flash) at the heart of the Raspberry Pi Pico; simulated by rp2040js. |
