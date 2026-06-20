# Functional Requirements: RoboCode Studio IDE

## Overview

RoboCode Studio is the centrepiece web IDE of RoboCode.Africa. It delivers a unified, browser-resident workspace in which Students drag electronic components onto a virtual canvas, wire them through a simulated breadboard, write firmware in Arduino C/C++, MicroPython, or a block-based visual mode, and observe the circuit executing in real time — all without physical hardware. This section specifies the system-level functional requirements for the Studio workspace layer: the canvas, component palette, breadboard model, wiring, rendering, project management, collaboration, and import/export subsystems. Simulation execution behaviour is specified in *Functional Requirements: RoboCode Simulation Engine (RSE)*; code compilation and execution are specified in *Functional Requirements: Code Authoring, Validation and Execution*; component electrical models are specified in *Component and Sensor Library Specification*.

Requirements in this section carry the prefix **FR-STU-** in accordance with the REQUIREMENT-ID SCHEME. Priority follows MoSCoW notation: **Must / Should / Could / Won-t**.

Cross-references:

- Simulation core: *Functional Requirements: RoboCode Simulation Engine (RSE)* (FR-SIM-xxx).
- Code execution: *Functional Requirements: Code Authoring, Validation and Execution* (FR-CODE-xxx).
- Component catalogue and electrical models: *Component and Sensor Library Specification* (FR-SIM-xxx component entries).
- Multi-user collaboration infrastructure: *Functional Requirements: Teams, Competitions and Gamification* (FR-TEAM-xxx).
- RBAC and authorization enforcement: *Functional Requirements: Identity, Authentication and Authorization* (FR-AUTH-xxx).
- Data persistence and schema: *Data Architecture and Database Design* (DR-xxx).
- Non-functional performance and accessibility targets: *Non-Functional Requirements* (NFR-xxx) and *Accessibility, Internationalisation and Low-Bandwidth Design*.

---

## Studio Workspace Layout

RoboCode Studio is implemented as a rich Single-Page Application (SPA) rendered in the browser. The workspace is divided into four primary panels that can be resized and collapsed.

```
+------------------------------------------------------------------+
|  App Shell (Next.js): topbar / user menu / breadcrumb            |
+----------+-----------------------------------+--------------------+
|          |                                   |                    |
| Component|         Design Canvas             |   Code Editor      |
| Palette  |   (SVG/Canvas 2D  or  WebGL 3D)   |   (Monaco)         |
|          |                                   |                    |
| [search] |  [breadboard] [components] [wires]|  [toolbar]         |
| [list]   |                                   |  [editor area]     |
|          |                                   |  [diagnostics]     |
+----------+-----------------------------------+--------------------+
|  Status Bar: zoom level | auto-save status | warnings badge      |
+------------------------------------------------------------------+
|  Warnings / Validation Panel (collapsible, below canvas)         |
+------------------------------------------------------------------+
```

The SPA is bootstrapped via the Next.js App Router shell but operates without full page reloads once mounted. State is managed via Redux Toolkit (global project state) and Zustand (ephemeral UI state such as selection and tool modes). Yjs CRDT document state drives real-time collaboration (see FR-STU-120 through FR-STU-135).

### Requirements — Workspace Layout

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| FR-STU-001 | The Studio workspace shall render in a single browser tab, combining the component palette, design canvas, code editor, and warnings panel without requiring page navigation between them. | Must | Tested: all four panels co-visible at 1440 × 900 px; transitions between tabs (canvas / code) are sub-100 ms. |
| FR-STU-002 | Each primary panel (palette, canvas, code editor, warnings) shall be independently collapsible and resizable by the user via drag handles, with persisted per-user layout preferences. | Should | Layout preferences stored in user profile; default layout restored on new session. |
| FR-STU-003 | The Studio shall support a minimum viewport of 1 024 × 600 px; viewports below this threshold shall display a "device not supported" advisory with a recommendation to use a larger screen or reduce browser zoom. | Must | Advisory is non-blocking; user can proceed if they choose. |
| FR-STU-004 | A global status bar at the bottom of the Studio shall continuously display: current zoom percentage, last auto-save timestamp (or "Unsaved changes"), the active board type (Arduino UNO R3, ESP32 DevKit, Raspberry Pi Pico, or any loaded custom board), and a warnings badge with error count. | Must | Warnings badge click opens/focuses the Warnings panel. |

---

## Component Palette and Library Loading

### Architecture

The component catalogue is defined server-side as a versioned JSON manifest. The Studio SPA fetches the manifest once per session (with HTTP cache headers enabling CDN edge caching) and renders the palette client-side. Individual component assets (2D SVG sprites from `wokwi-elements`, 3D GLTF/GLB models, reference card JSON) are loaded lazily on demand.

```
Browser Session Start
        |
        v
  Fetch /api/studio/components/manifest  (CDN-cached, max-age 3600)
        |
        v
  Palette rendered from manifest
        |
   Component drag
        |
        v
  Lazy-load component assets:
    - wokwi-elements web component JS bundle (if not already registered)
    - 3D GLB model (if 3D view active)
    - Reference card JSON (on info-panel open)
```

### Requirements — Component Palette and Library Loading

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| FR-STU-010 | The platform shall serve a versioned component manifest listing all supported catalogue entries, grouped into eight categories: Boards, Prototyping, LEDs and Displays, Passives and Discretes, Sensors, Actuators and Output, Communication, and Power. | Must | Manifest schema versioned (semver); Studio validates version compatibility on load. |
| FR-STU-011 | The component manifest shall be CDN-cached with a `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` header. The Studio shall display stale manifest data while a background refresh is in progress; a "Library updated — reload to apply" notification shall appear on version mismatch. | Must | Ensures low-latency palette load on African network conditions. |
| FR-STU-012 | The palette shall render all catalogue entries with: a 2D thumbnail (minimum 64 × 64 px, sourced from `wokwi-elements` or a platform-provided sprite), a common display name, and a single-line description. | Must | Thumbnails served via CDN; WebP format with PNG fallback. |
| FR-STU-013 | The palette shall provide real-time text search filtering components by name, model number, and keyword tags, debounced to ≤ 150 ms, with results updated without page reload. | Must | Search operates client-side on the loaded manifest; no server round-trip. |
| FR-STU-014 | The palette shall visually indicate board-compatibility: components incompatible with the currently active board are shown dimmed with a tooltip stating the incompatibility reason (e.g., "Not supported on Arduino UNO R3"). | Must | Compatibility matrix stored in manifest per component entry. |
| FR-STU-015 | The palette shall display a "Recently Used" section listing the last eight components placed by the authenticated user, persisted server-side in the user profile. | Should | Shown at top of palette above category groups. |
| FR-STU-016 | The palette shall support a per-user "Favourites" list of up to 20 components, toggled via a star icon on each entry, stored in the user profile. | Could | Favourites section shown below Recently Used. |
| FR-STU-017 | A Teacher or School Admin shall be able to restrict the palette for a specific assignment or class, hiding catalogue entries irrelevant to the lesson. Restrictions are stored per-assignment and enforced server-side. | Should | Student palette reflects restrictions; a "Component restricted by your teacher" tooltip explains absent entries. |
| FR-STU-018 | Each palette entry shall provide a "Reference Card" link opening an inline side panel (not a new browser tab) showing: component photo, pin-out table, typical use description, and compatibility notes. | Should | Reference card data is part of the global content library managed by Super Admin. |
| FR-STU-019 | The palette panel shall be fully keyboard-navigable: arrow keys move between category groups and entries; Enter or Space initiates component placement mode. WCAG 2.2 AA compliance is mandatory. | Must | ARIA `role="tree"` or `role="listbox"` pattern; screen-reader announcements for filter results. |
| FR-STU-020 | The palette shall be collapsible via a keyboard shortcut (default: `P`) and a visible toggle button, with collapse state persisted for the session. | Must | On collapse the canvas expands to fill the freed horizontal space. |

---

## Board Selection and Custom Board Definitions

### Architecture

RoboCode Studio supports three first-class development boards — Arduino UNO R3, ESP32 DevKit, and Raspberry Pi Pico — as well as additional boards from the extensible wokwi-boards definition library (`github.com/wokwi/wokwi-boards`). Boards are data-driven: a board manifest (`board.json`) declares the board name, its pins (each with a name, type, and x/y position), and an SVG visual asset. No code change is required to add a board to the platform. Each board definition binds to an MCU core target (avr8js for AVR boards, rp2040js for RP2040 boards, or the ESP32 core) so the simulator executes the correct firmware type.

```
Board Library Loading

  Studio Session Start
          |
          v
  Fetch /api/studio/boards/manifest  (CDN-cached)
          |
          v
  Board Selector renders:
    [Arduino UNO R3   ] (avr8js core)
    [ESP32 DevKit     ] (ESP32 core)
    [Raspberry Pi Pico] (rp2040js core)
    [... wokwi-boards standard library ...]
    [Custom boards (tenant / approved) ...]
          |
    User selects board
          |
          v
  Simulator binds MCU core target
  Canvas renders board SVG / wokwi-elements web component
  Component palette filters by board compatibility
```

Custom board definitions follow the `wokwi-boards` manifest format. Platform admins and approved Teachers can upload a `board.json` + SVG asset pair. The upload passes JSON schema validation, pin sanity checks, and SVG/asset safety scanning. Non-admin uploads enter a moderation queue before becoming available to learners.

### Requirements — Board Selection and Custom Board Definitions

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| FR-STU-021 | The Studio shall present a Board Selector (accessible from the project settings toolbar and the "New Project" flow) that lists all available boards: the three first-class boards (Arduino UNO R3, ESP32 DevKit, Raspberry Pi Pico), all boards from the built-in wokwi-boards standard library, and any tenant-approved custom boards. | Must | Board list fetched from `/api/studio/boards/manifest`; CDN-cached with the same stale-while-revalidate policy as the component manifest. |
| FR-STU-022 | Selecting a board shall: (a) update the active MCU core target (avr8js for AVR boards, rp2040js for RP2040, ESP32 core for ESP32-family boards), (b) re-render the board SVG or wokwi-elements web component on the canvas, (c) refresh component palette compatibility filtering, and (d) update the `boardType` field in the project's `diagram.json`. If the project already has placed components, the system shall warn the user that a board change may invalidate existing firmware or pin assignments. | Must | Board change is a reversible command-stack entry (FR-STU-170). Warning is a modal confirmation; user may cancel. |
| FR-STU-023 | The Board Selector shall display for each board: its display name, MCU chip name, a brief specification summary (e.g., "RP2040 — dual-core Cortex-M0+, 264 KB SRAM, 26 GPIO"), supported programming languages, and a thumbnail SVG. | Should | Specification summary sourced from the board manifest `description` field; thumbnails served via CDN. |
| FR-STU-024 | The Raspberry Pi Pico (RP2040) shall be a first-class board option. Its simulation shall use the rp2040js library to execute real RP2040 firmware in the browser. The board shall expose 26 multifunction GPIO pins (GP0–GP28), 3 ADC-capable inputs (GP26, GP27, GP28), 2x UART, 2x SPI, 2x I2C, 16 PWM channels, and 8 PIO state machines on a 40-pin header. Supported firmware languages are MicroPython, CircuitPython, and C/C++ (Arduino-Pico core or Pico SDK). | Must | rp2040js accepts a UF2 or ELF firmware image; the compiler microservice targets the appropriate toolchain based on selected language. Internal temperature sensor (ADC channel 4) also modelled. |
| FR-STU-025 | Platform admins and approved Teachers shall be able to upload a custom board definition consisting of a `board.json` manifest (wokwi-boards format) and an SVG visual asset. The upload shall be validated for: JSON schema conformance, minimum one declared pin, valid pin types (power, ground, gpio, analog, i2c, spi, uart), a declared MCU core target, and SVG safety (no embedded scripts or external resource references). | Must | Validation errors returned as structured JSON with field-level messages; SVG safety checked by a server-side sanitiser (e.g., DOMPurify-equivalent). |
| FR-STU-026 | Custom board uploads by non-admin users shall enter a moderation queue. A Platform Moderator or Platform Admin shall review and approve or reject the submission before the board becomes available in any tenant's Board Selector. Rejection includes a mandatory reason field relayed to the uploader. | Must | Moderation queue visible in the Admin/Moderator dashboard; email notification sent to uploader on decision. |
| FR-STU-027 | Approved custom boards shall be scoped to the uploading tenant by default. A Platform Admin may promote a custom board to the global built-in library, making it available across all tenants. | Should | Scope field in the board manifest: `"scope": "tenant"` or `"scope": "global"`; enforced in the board manifest API response per authenticated tenant. |
| FR-STU-028 | The component palette's compatibility filtering (FR-STU-014) shall respect the MCU core target of the active board, not only the board display name. Components declared compatible with a given core target (avr8js, rp2040js, or ESP32 core) shall be shown for any board bound to that core. | Must | Compatibility matrix in the component manifest uses `coreTarget` keys in addition to specific board IDs. |
| FR-STU-029 | The `diagram.json` schema shall support a `boardType` field accepting: `"arduino-uno-r3"`, `"esp32-devkit"`, `"raspberry-pi-pico"`, or any custom board identifier string registered in the platform's board library. Projects referencing an unrecognised board identifier shall display a non-blocking "Unknown board — simulation unavailable" advisory and allow canvas editing to continue. | Must | Schema validation (Zod/AJV) accepts any non-empty string for `boardType`; unknown-board advisory rendered in the Warnings panel. |

---

## Drag-and-Drop Component Placement

### Requirements — Placement

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| FR-STU-030 | The system shall allow a Student to drag a component from the palette to the canvas using pointer (mouse or stylus) or touch, with a semi-transparent ghost preview following the pointer during drag. | Must | Pointer Events API; tested on Chrome/Android and Safari/iPadOS on ≥ 10-inch screens. |
| FR-STU-031 | The system shall provide a click-to-place mode as an alternative to drag: clicking a palette entry enters placement mode; the next click on the canvas places the component at the clicked position. `Escape` cancels placement mode. | Must | Placement mode is indicated by a crosshair cursor and a highlighted palette entry. |
| FR-STU-032 | The canvas shall snap component placement to a configurable grid with a default pitch of 2.54 mm (matching standard breadboard tie-point spacing). Snap can be temporarily overridden by holding `Alt` (Windows/Linux) or `Option` (macOS) during drag. | Must | Grid pitch configurable per-project; stored in project metadata. |
| FR-STU-033 | Placing a full-size breadboard (830 tie-points) shall automatically render all tie-point holes labelled with column identifiers (a–j) and row numbers (1–63), plus top and bottom power rails labelled `+` and `−`. Placing a half-breadboard shall render its corresponding layout. | Must | Tie-point rendering uses `wokwi-elements` `<wokwi-breadboard>` web component geometry. |
| FR-STU-034 | Placing an Arduino UNO R3, ESP32 DevKit, Raspberry Pi Pico, or any board from the wokwi-boards library on the canvas shall render all labelled pin headers in 2D silk-screen style, using the board's official pin labels (D0–D13, A0–A5, GND, 5V, 3.3V, Vin for UNO; GPIO labelling for ESP32; GP0–GP28, 3.3V, GND for Pico; manifest-declared labels for custom boards). | Must | Rendered via the corresponding `wokwi-elements` board web component for standard boards; custom boards use the SVG asset and pin positions declared in their `board.json` manifest. |
| FR-STU-035 | When a component with through-hole leads (e.g., LED, resistor, push button, DHT11 sensor) is dragged over a breadboard, valid tie-point insertion positions shall be highlighted in green; occupied or invalid positions highlighted in red. Multi-lead components shall snap all leads simultaneously to adjacent tie-points respecting the component body span derived from `wokwi-elements` geometry metadata. | Must | Lead-to-tie-point snap evaluated per-lead; collision detection runs synchronously during drag. |
| FR-STU-036 | The system shall warn (non-blocking toast) if placing a component would cause memory usage to exceed 80 % of the estimated safe browser memory budget; the warning includes a count of components already placed. | Should | Memory budget estimated at runtime using `performance.memory` where available; static estimate otherwise. |

---

## Component Manipulation

### Requirements — Manipulation

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| FR-STU-040 | A placed component shall be movable by dragging it to a new canvas position; all wires attached to the component shall follow it (rubber-band behaviour), recomputing their routed paths. | Must | Wire re-route runs within the same animation frame as the drag; no visual lag at ≤ 30 components. |
| FR-STU-041 | A component shall be rotatable in 90-degree increments via: context menu ("Rotate CW" / "Rotate CCW"), the `R` keyboard shortcut (CW) and `Shift+R` (CCW), or a visible rotation handle on the selection box. Rotation applies symmetrically in 2D; the 3D view reflects the same orientation. | Must | Rotation stored as 0 / 90 / 180 / 270 degrees in the project document; not as a continuous angle. |
| FR-STU-042 | A component shall be duplicable via `Ctrl/Cmd+D` or context menu "Duplicate", placing the copy offset by one grid unit from the original. The duplicate carries the same property values but no wire connections. | Must | Duplicate action pushes a single entry onto the command stack for undo. |
| FR-STU-043 | A selected component or selection group shall be deletable via `Delete` or `Backspace`, or context menu "Remove"; all wire connections to the deleted component(s) are removed simultaneously. No confirmation dialog is shown for single-component deletion; undo (FR-STU-170) is the recovery mechanism. | Must | Multi-component deletion prompts a single confirmation if the selection contains ≥ 5 components. |
| FR-STU-044 | Multi-select shall be supported via: rubber-band (click-and-drag on empty canvas area) and `Shift+click` to add/remove individual components. The selection shall be indicated by a group bounding box with resize/move handles. Move, rotate, duplicate, and delete operations apply to the entire selection as a unit; wires between selected components are preserved; external wires rubber-band. | Must | Rubber-band and `Shift+click` are combinable within a single selection action. |
| FR-STU-045 | A right-click (or long-press on touch) on a selected component shall open a context menu containing: Move to Front, Move to Back, Duplicate, Rotate CW, Rotate CCW, Properties, Remove. | Should | Context menu closes on `Escape` or click outside; accessible via `aria-menu` pattern. |
| FR-STU-046 | Component properties configurable via an inspector panel shall include at minimum: resistor ohmic value, LED colour, potentiometer range, DHT sensor variant (DHT11/DHT22), LCD row/column dimensions, buzzer frequency (active/passive mode), and servo pulse range. Property changes apply immediately to both the canvas rendering and the RSE component model. | Must | Inspector panel opens on "Properties" context menu action or double-click; docked to the right of the canvas. |
| FR-STU-047 | The canvas shall maintain a Z-order layer model: power boards and breadboards occupy layer 0; discrete components occupy layer 1; wires occupy layer 2 (above components for visibility). "Move to Front" and "Move to Back" reorder within layer 1 only. | Should | Z-order stored as an ordered array of component IDs in the project document. |

---

## Breadboard Model and Electrical Node Graph

### Breadboard Topology

The breadboard model is the authoritative source for electrical connectivity derived from physical component placement. The Studio computes a netlist (electrical node graph) by combining: (a) the breadboard tie-point topology, (b) explicit pin-to-pin jumper wires, and (c) per-component lead-to-pin mappings from the catalogue.

```
Breadboard Electrical Node Graph — Full-Size (830 tie-points)

 Top Power Rails (2 nodes):
   VCC_RAIL_TOP:  all (+) holes on top rail   [tied]
   GND_RAIL_TOP:  all (-) holes on top rail   [tied]

 Body rows (126 nodes: 63 rows x 2 half-rows):
   ROW_n_LEFT:   a1–e1, a2–e2, ... a63–e63   [5 holes tied per row-half]
   ROW_n_RIGHT:  f1–j1, f2–j2, ... f63–j63   [5 holes tied per row-half]

 Bottom Power Rails (2 nodes):
   VCC_RAIL_BOT: all (+) holes on bottom rail [tied]
   GND_RAIL_BOT: all (-) holes on bottom rail [tied]

 Total default nodes (no wires): 130
 Merging occurs when jumper wires connect nodes.
```

### Requirements — Breadboard Model and Pin/Connection Model

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| FR-STU-050 | The system shall maintain an in-memory electrical node graph (netlist) that reflects the complete set of electrical connections on the canvas, updated incrementally after every placement, wiring, or deletion action. | Must | Incremental update completes within 50 ms for projects with ≤ 100 components. |
| FR-STU-051 | The netlist shall correctly model breadboard topology: tie-points a–e in the same row are one node; f–j in the same row are a separate node; each power rail is a single node per rail per side. Power rail halves (if a breadboard has a physical break in the rail) are modelled as separate nodes. | Must | Topology definition loaded from `wokwi-elements` breadboard geometry metadata. |
| FR-STU-052 | Component leads inserted into breadboard tie-points shall automatically join the corresponding node in the netlist without requiring an explicit wire. The system shall resolve multi-lead component placement (e.g., an LED occupies two tie-points in different rows, creating two separate node connections) using the component lead-to-pin mapping from the catalogue manifest. | Must | Placement-driven netlist update fires synchronously after snap confirmation. |
| FR-STU-053 | Each wire drawn between two pins or tie-points shall merge their respective netlist nodes into one (union-find merge); deleting the wire shall re-split the nodes if no other path connects them. | Must | Union-find with path compression; full re-evaluation on delete since split is not trivially invertible. |
| FR-STU-054 | The netlist shall be serialisable to a compact JSON representation (the `diagram.json` document format, see FR-STU-160) and reloadable, fully restoring the node graph without re-running placement logic. | Must | Round-trip fidelity verified by automated test: serialise → parse → compare node sets. |

---

## Wiring — Jumper Wire Creation

### Requirements — Jumper Wires

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| FR-STU-060 | The system shall allow a Student to draw a jumper wire between any two connectable endpoints (board pins, component leads, breadboard tie-points) by clicking the source endpoint and then clicking the destination endpoint. `Escape` cancels in-progress wire drawing. | Must | Cursor changes to crosshair when hovering a connectable pin/tie-point; source endpoint is highlighted on click. |
| FR-STU-061 | During wire drawing, valid destination endpoints shall be highlighted with a green ring; endpoints that would create a duplicate connection on an already-connected net are dimmed. | Must | Valid endpoint calculation updates as the cursor moves, ≤ 16 ms latency (one animation frame). |
| FR-STU-062 | Wire routing shall produce a rectilinear (Manhattan) path by default, computed by the Studio to avoid overlap with component bodies where feasible. A Student may drag any intermediate wire segment to manually re-route it. | Should | Auto-route runs in O(n) per wire using a simplified L-route; full A* routing is a future enhancement. |
| FR-STU-063 | Jumper wires shall snap their endpoints to canvas grid positions aligned with tie-point centres and pin header positions, with a snap tolerance of 4 px at 100 % zoom (scaling proportionally at other zoom levels). | Must | Snap evaluated per pointer move event; endpoint snaps on pointer-up. |
| FR-STU-064 | Each wire shall have a selectable colour from a palette of at least eight options: red, black, orange, yellow, green, blue, white, and grey. Default auto-assignment: red for VCC nets, black for GND nets, other colours assigned round-robin for signal nets. A Student may override the colour of any wire. | Must | Colour stored per wire segment in `diagram.json`. |
| FR-STU-065 | Hovering over a wire shall transiently highlight the entire net (all electrically connected pins and tie-points sharing that node) in a distinct highlight colour (default: cyan). The highlight disappears when the cursor leaves the wire. | Should | Net highlight is purely visual; no netlist modification occurs. |
| FR-STU-066 | A Student shall be able to add an optional text label (max 32 characters) to any wire; the label shall be rendered at the midpoint of the primary wire segment, scaled proportionally with canvas zoom. | Could | Labels stored in `diagram.json` per wire; exported in JSON and diagram image exports. |
| FR-STU-067 | Hovering over any wire endpoint shall display a tooltip stating the tie-point address (e.g., "a5", "+ rail top") or the board pin label (e.g., "D13", "GND"), plus the net name if assigned. | Should | Tooltip appears after a 300 ms hover dwell; ARIA live-region equivalent for screen readers. |
| FR-STU-068 | A wire shall be selectable by clicking it; a selected wire shall be deletable via `Delete`/`Backspace` or context menu "Remove Wire". Multiple wires may be added to a selection via `Shift+click` for batch deletion. | Must | Wire selection visual: selected wire segment turns bold/highlighted. |
| FR-STU-069 | Double-clicking a wire segment shall insert a mid-point node, allowing the wire to be split and rerouted through a new path without deleting it. | Could | Mid-point node drag updates the routed path; undo reverts mid-point insertion. |

---

## Connection Validation Rules

### Architecture

Connection validation runs as a Web Worker process that receives the current netlist snapshot after each change event. It applies a rule engine and returns a structured list of diagnostics within 300 ms. Results are rendered in the Warnings panel and overlaid on the canvas.

```
Netlist change event
        |
        v
  Validation Web Worker
  +----------------------------------+
  | Rule: ShortCircuitRule           |
  | Rule: PolarityRule               |
  | Rule: MissingResistorRule        |
  | Rule: UnpoweredComponentRule     |
  | Rule: FloatingInputRule          |
  | Rule: PowerRailUnconnectedRule   |
  | Rule: BusConflictRule            |
  +----------------------------------+
        |
        v
  Diagnostics list [ {severity, ruleId, affectedNodes,
                       message, learnMoreUrl} ]
        |
        v
  Warnings Panel + Canvas overlay highlights
```

### Requirements — Connection Validation

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| FR-STU-070 | The validation engine shall run in a dedicated Web Worker to prevent blocking the UI thread. Each netlist change shall trigger a validation pass; results shall be delivered to the main thread within 300 ms for projects with ≤ 100 components. | Must | Web Worker receives a serialised netlist snapshot; does not share mutable state with the main thread. |
| FR-STU-071 | The Warnings panel shall display each diagnostic with: a severity icon (error/warning/info), a student-friendly plain-language title, a one-sentence explanation, and a "Learn More" link to the relevant reference card in the global content library. Erroneous wires and pins involved in the diagnostic shall be highlighted on the canvas (red for error, orange for warning) while the panel entry is active. | Must | Highlight removed automatically when the fault is corrected on the canvas. |
| FR-STU-072 | The system shall detect and report **short circuits**: any net that directly connects a VCC-type rail node to a GND-type rail node without a resistive or non-linear load element in the path. Message example: "Oops — power and ground are directly connected. This is a short circuit. Check your wires." | Must | Graph traversal: BFS from VCC net; if GND reachable without passing through a load node, flag as short. |
| FR-STU-073 | The system shall detect and report **polarity violations** on polarised components: LEDs (anode must connect to higher potential than cathode), electrolytic capacitors, active buzzers, and diodes. Message example: "Your LED's longer leg (anode, +) should connect to the positive side. Try swapping the wire ends." | Must | Pin metadata in catalogue manifest tags each lead as `anode`/`cathode`/`positive`/`negative`; rule resolves net potentials from power source connections. |
| FR-STU-074 | The system shall detect and report a **missing current-limiting resistor** for each LED connected directly (no series resistor in the net path) to a 5 V, 3.3 V, or MCU digital output pin. Message example: "LEDs need a resistor to protect them. Add a resistor (220 Ω is a good start) between the pin and the LED." | Must | Rule traverses the net from the LED anode to the power source; if no resistor component node is encountered, the rule fires. Reported as a warning, not an error (simulation still proceeds). |
| FR-STU-075 | The system shall detect and report **unpowered components**: components whose designated VCC/power pin is not connected to any power net, and components whose GND pin is floating. Message example: "Your DHT11 sensor does not have power. Connect its VCC pin to 5 V (or 3.3 V for ESP32)." | Must | Applies to all components with a declared `vcc` or `gnd` pin in the catalogue manifest. |
| FR-STU-076 | The system shall detect and report **floating digital input pins**: MCU digital-input pins connected to a signal source but lacking a pull-up or pull-down resistor. Message example: "Pin D2 has no pull-up or pull-down resistor. It may read random values. Add a 10 kΩ resistor to VCC or GND." | Should | Reported as a warning only; simulation is not blocked. |
| FR-STU-077 | The system shall detect and report **power-rail-unconnected** cases: a breadboard power rail that is referenced by component tie-points but has no wire connecting the rail to a board power pin. | Must | Reported as an error; simulation is blocked until resolved (or user explicitly overrides). |
| FR-STU-078 | The Warnings panel shall include a "Run Check" button that manually triggers a full validation pass. An automatic pass shall also be triggered whenever the user initiates a simulation run, blocking the run if any error-severity diagnostics are present unless the user explicitly acknowledges and overrides. | Must | Manual trigger useful after bulk edits; simulation block enforced in FR-SIM-xxx. |
| FR-STU-079 | Validation messages shall support two reading-level variants: a simpler variant (shorter sentences, no technical jargon) for primary-school Students (age 8–12) and a more technical variant for high-school Students (age 13–18). The reading level is selected based on the school-grade field in the Student profile; it defaults to the simpler variant if grade is not set. | Could | Both variants stored per diagnostic in the content library; variant selection is client-side. |
| FR-STU-080 | All validation diagnostics shall be listed in an ARIA live region so that screen-reader users receive real-time announcements of new errors and their clearance. | Must | `aria-live="polite"` for new warnings; `aria-live="assertive"` for error-severity diagnostics. |

---

## 2D Rendering via wokwi-elements

### Requirements — 2D View

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| FR-STU-090 | The 2D view shall be the default and primary view mode for RoboCode Studio, rendering components using `wokwi-elements` Custom Elements (web components) from the Wokwi open-source library (`github.com/wokwi/wokwi-elements`). | Must | Component registration: `customElements.define()` called lazily on first placement of each component type. |
| FR-STU-091 | Component 2D renders shall include silk-screen-style labels, pin legends, and live state animations driven by the RSE (e.g., LED illumination state, LCD character output, 7-segment digit display, servo arm angle). The RSE communicates state updates to `wokwi-elements` via their published JavaScript API. | Must | State update round-trip from RSE pin change to visual update: ≤ one animation frame (≤ 16.7 ms at 60 FPS). |
| FR-STU-092 | Wires shall be rendered on a dedicated SVG layer above the component layer, with colour, routing path, labels, and selection state reflected in SVG attributes to permit CSS transitions and ARIA annotations. | Must | SVG layer uses `pointer-events: stroke` on wire paths to enable precise click targeting. |
| FR-STU-093 | The breadboard shall be rendered as a `<wokwi-breadboard>` element exposing each tie-point as a named slot for wire endpoint snapping and collision detection; its visual state shall reflect power-rail connectivity (powered rail shows a faint glow when VCC is connected). | Must | Tie-point coordinate lookup runs in O(1) via pre-computed map keyed by tie-point address string. |
| FR-STU-094 | The platform shall track upstream `wokwi-elements` npm releases and apply security-relevant patches within 14 days of public disclosure. Non-security updates shall be evaluated quarterly and applied within 30 days of evaluation approval. | Must | Tracked via Dependabot or equivalent; patch SLA monitored in the observability dashboard. |

---

## 3D Rendering via Three.js

### Requirements — 3D View

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| FR-STU-100 | The Studio shall provide an optional 3D perspective view, toggled by a "3D View" button in the toolbar (keyboard shortcut: `3`). The 3D view is a companion visualisation mode; component placement and wiring remain performed in 2D and are reflected in 3D. | Should | Toggle is smooth cross-fade transition ≤ 300 ms. |
| FR-STU-101 | The 3D view shall be rendered using Three.js + React Three Fiber + drei with WebGL2. WebGPU shall be used progressively where `navigator.gpu` is available, upgrading the rendering path without requiring a page reload. | Should | WebGPU path gated behind `if (navigator.gpu)` feature detection; WebGL2 path is the mandatory baseline. |
| FR-STU-102 | The 3D view shall support: orbit (drag to rotate), zoom (scroll wheel / pinch), and pan (right-drag or two-finger drag). Double-clicking a component in 3D shall select it (mirroring the 2D selection state). | Should | Camera controls via `drei` `<OrbitControls>`; camera position persisted per project in `diagram.json`. |
| FR-STU-103 | 3D component models shall be served as GLTF/GLB files from S3-compatible object storage, delivered via CDN, lazy-loaded on first use of each component type, and cached in the browser using `CacheStorage`. Each model shall be optimised to ≤ 500 KB (Draco-compressed). | Should | Model loading shows a spinner placeholder in 3D view while the GLB is fetched. |
| FR-STU-104 | On devices where WebGL2 is unavailable or the platform detects sustained 3D frame-rate below 30 FPS for 5 seconds after canvas load, the 3D view option shall be automatically disabled and replaced with an explanatory tooltip: "3D view is not available on this device. Use 2D view to build your circuit." | Must | FPS measurement uses `requestAnimationFrame` delta timing; automatic disable fires after the 5-second measurement window. |
| FR-STU-105 | Component 3D models shall reflect live simulation state: LED models shall illuminate with the correct colour and brightness driven by RSE pin voltage; servo models shall animate the horn to the commanded angle; LCD models shall render the text output on their 3D face. | Should | State channel shared between RSE and the React Three Fiber scene graph via a Zustand store. |

---

## Canvas Transforms — Zoom, Pan and Fit

### Requirements — Canvas Navigation

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| FR-STU-110 | The canvas shall support continuous zoom from 20 % to 400 % of the nominal component scale (100 %). Zooming shall preserve the pointer position as the focal point (zoom-to-cursor behaviour). | Must | Zoom input sources: scroll wheel, trackpad pinch, `Ctrl/Cmd++` / `Ctrl/Cmd+-` keyboard shortcuts, and the zoom percentage control in the status bar. |
| FR-STU-111 | A "Fit to Screen" action (keyboard shortcut: `F`, and a toolbar button) shall calculate the bounding box of all placed components and animate the canvas viewport to centre and scale them to fill 80 % of the available canvas area, completing the animation in ≤ 200 ms. | Must | If no components are placed, "Fit to Screen" resets to 100 % zoom centred at canvas origin. |
| FR-STU-112 | The canvas shall support panning via: middle-mouse-button drag, `Space` + left-mouse drag, and two-finger trackpad scroll. Pan velocity shall be damped to prevent abrupt snapping. | Must | Pan inertia: velocity decays to zero within 300 ms after pointer release. |
| FR-STU-113 | An optional minimap (thumbnail of the full canvas) shall appear in the bottom-right corner for projects with more than 10 placed components. The minimap shall be interactive: clicking it navigates the viewport; dragging the minimap viewport indicator pans the canvas. The minimap is toggleable via a toolbar button. | Could | Minimap rendered as a 1:20 scale SVG snapshot; updates on each canvas change with 500 ms debounce. |
| FR-STU-114 | The current zoom level and viewport centre coordinates shall be saved with the project document, restoring the exact last view when the project is reopened. | Should | Stored in `diagram.json` `viewport` object alongside component and wire data. |

---

## Undo and Redo via Command Stack

### Architecture

All canvas mutations are expressed as reversible `Command` objects pushed onto a per-project command stack. The command stack is held in memory for the session and is persisted as part of the auto-save snapshot to allow cross-session undo for recent operations.

```
Command Stack Model

     [HEAD] -> PlaceComponent { id, type, pos }
               MoveComponent  { id, from, to }
               DrawWire       { id, src, dst, color }
               DeleteComponent{ id, snapshot }
               ChangeProperty { id, key, old, new }
               ...
               [OLDEST retained entry]

  Undo: HEAD moves back; command.undo() called.
  Redo: HEAD moves forward; command.execute() re-called.
  New action after undo: redo stack cleared; new command pushed.
```

### Requirements — Undo and Redo

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| FR-STU-170 | The system shall maintain an in-session undo stack covering all reversible canvas actions: component placement, movement, rotation, duplication, deletion, wire draw, wire deletion, wire segment re-route, property change, and group operations. | Must | Stack depth: minimum 100 entries retained in memory; older entries may be evicted (with notification) if memory pressure exceeds threshold. |
| FR-STU-171 | Undo shall be invoked via `Ctrl/Cmd+Z`; redo via `Ctrl/Cmd+Shift+Z` or `Ctrl/Cmd+Y`. Toolbar undo/redo buttons shall also be provided, each showing the description of the action to be undone/redone in a tooltip. | Must | Keyboard shortcuts shall not conflict with Monaco editor shortcuts when the editor panel is focused; focus-aware binding dispatching is required. |
| FR-STU-172 | Performing a new canvas action after one or more undo steps shall clear the redo stack. | Must | Standard command-stack semantics. |
| FR-STU-173 | Undo and redo shall be atomic with respect to group operations: a multi-select delete that removes five components and their wires shall be reversed by a single `Ctrl/Cmd+Z` press, restoring all five components and all affected wires. | Must | Group operations are represented as a single composite `Command` on the stack. |
| FR-STU-174 | In a collaborative session (FR-STU-120 through FR-STU-127), undo shall be local: a Student's undo reverses only their own operations, not those of other collaborators. The Yjs CRDT layer manages conflict resolution; local undo is implemented as a Yjs `UndoManager` scoped to the local user's changes. | Must | Yjs `UndoManager` API used directly; undo across collaborator boundaries is disallowed. |

---

## Multi-Select and Grouping

### Requirements — Selection and Groups

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| FR-STU-115 | The system shall support named component groups: a Student may group a multi-selection (`Ctrl/Cmd+G`) and assign an optional name. Group members move and transform together; individual members remain individually accessible within the group. | Could | Groups rendered with a labelled dashed bounding box; displayed in a layers panel. |
| FR-STU-116 | Copy (`Ctrl/Cmd+C`) and paste (`Ctrl/Cmd+V`) of a selection shall duplicate all selected components and the wires connecting them, placed offset by one grid unit from the originals. | Should | Paste respects grid snap. Components receive new IDs; wires between pasted components connect the new IDs. |

---

## Save, Load, Versioning and Autosave

### Requirements — Project Persistence

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| FR-STU-140 | The system shall auto-save the current project state at a minimum interval of every 60 seconds while the Student has the Studio tab active, and immediately on `beforeunload` event (tab close or navigation away). Auto-save is silent; the status bar displays "Last saved HH:MM:SS". | Must | Auto-save is a debounced background POST/PUT to the Studio API. Failures are retried up to 3 times; on persistent failure a non-blocking banner warns the Student to manually save. |
| FR-STU-141 | A Student shall be able to manually save a project at any time via `Ctrl/Cmd+S`. If the project is unsaved and unnamed, a "Save As" dialog prompts for a project name (max 64 characters). | Must | Project names are unique per-Student; a collision prompt offers rename or overwrite. |
| FR-STU-142 | Each manual save shall create a named version snapshot. Each auto-save shall create an auto-save snapshot. The system shall retain at minimum the last 50 named version snapshots and the last 100 auto-save snapshots per project, evicting oldest auto-save entries beyond this limit. | Should | Snapshot metadata: timestamp, type (manual/auto), project name at time of save, thumbnail (320 × 200 px PNG of canvas). |
| FR-STU-143 | A Student shall be able to open the version history list for a project, browsing snapshots by timestamp, and restore any snapshot as a new working version (non-destructive: the restore creates a new snapshot rather than overwriting existing history). | Should | Version history accessible from the project settings menu; thumbnail previews rendered at list display time. |
| FR-STU-144 | A Student shall be able to rename a project from the project management view (pencil-icon inline edit). A Student shall be able to duplicate a project (`Ctrl/Cmd+Shift+D` or context menu "Duplicate Project"); the duplicate is assigned a new project ID and copies canvas state, code, and metadata but not version history. | Must | Duplicate is immediately writable by the Student; the original is unmodified. |

---

## Templates

### Requirements — Starter Templates

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| FR-STU-150 | The platform shall maintain a global library of at minimum 20 starter project templates managed by the Super Admin, covering: Blink LED, RGB Colour Mixer, Traffic Light, Buzzer Melody, Servo Sweep, Ultrasonic Distance Meter, DHT11 Weather Station, LCD Hello World, 4-Digit 7-Segment Counter, NeoPixel Strip, PIR Motion Alert, IR Remote Control, DC Motor Speed Control, Soil Moisture Monitor, Sound Level Indicator, MPU6050 Orientation Display, RFID Entry Logger, Bluetooth Serial Echo (ESP32), Wi-Fi HTTP GET (ESP32), and Line Follower (dual IR sensor). | Must | Templates stored in the global content library; versioned independently of student projects. |
| FR-STU-151 | Each starter template shall include: a fully pre-wired canvas state (`diagram.json`), starter code in the Code Editor, a display name, a short description (max 200 characters), a difficulty badge (Beginner / Intermediate / Advanced), and the target board (Arduino UNO R3, ESP32 DevKit, Raspberry Pi Pico, or any board from the wokwi-boards library). | Must | Difficulty badge colour: green (Beginner), yellow (Intermediate), red (Advanced). |
| FR-STU-152 | Opening a template shall always create a private copy owned by the Student, in their tenant's project store. The original template is immutable to Students; modification of a template requires Super Admin or Platform Moderator access. | Must | Server enforces copy-on-open; the template's project ID is never assigned to the new student copy. |
| FR-STU-153 | Teachers shall be able to author and publish custom starter templates scoped to their school tenant or to a specific class. Custom templates are visible only within the tenant that created them. | Should | Custom template management UI available in the Teacher dashboard; templates stored under the school's content partition (tenant-scoped RLS). |
| FR-STU-154 | The template gallery shall be filterable by board type, difficulty, and topic tag (e.g., "Sensors", "Displays", "Motors", "Wireless"). Template gallery is accessible from both the Studio "New Project" flow and from the student learning dashboard. | Should | Topic tags defined in template metadata; multi-select filter supported. |

---

## Sharing and Embedding

### Requirements — Project Sharing

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| FR-STU-155 | A Student shall be able to generate a shareable read-only link for a project. The link opens a read-only view of the canvas and code (simulation can be run in view-only mode). Shareable links are tenant-scoped by default; sharing outside the school tenant requires explicit approval by a Teacher or School Admin. | Should | Link tokens are JWT-signed, scoped to the project and tenant; expiry configurable (default: 30 days). |
| FR-STU-156 | Teachers shall be able to view any student project within their assigned classes and add timestamped annotations on the canvas (sticky-note style) and inline code comments without altering the Student's canvas state or code. Teacher annotations are stored in a separate annotation layer, not in the student's `diagram.json`. | Must | Annotation layer fetched separately; merged visually on the read-only view. |
| FR-STU-157 | The system shall support embedding a read-only, non-interactive preview of a project in an external web page via an `<iframe>` snippet with a signed embed URL. Embedding is opt-in per project and must be explicitly enabled by the Student's Teacher or School Admin. | Could | Embed URL includes `?embed=1` flag; the Studio renders without the palette, toolbar, or code editor in embed mode. |

---

## Real-Time Multi-User Collaboration via Yjs

### Architecture

Collaborative sessions are implemented using the Yjs CRDT (Conflict-free Replicated Data Type) library. The Studio `diagram.json` document is represented as a Yjs `Y.Doc`; canvas components, wires, and properties are expressed as `Y.Map` and `Y.Array` types. Synchronisation is transported over WebSocket (Socket.IO) rooms, one per project. Presence (cursor, selection, user identity) is transmitted as Yjs Awareness.

```
Collaboration Architecture

 Student A (browser)          Studio Backend (Node.js + NestJS)
 +----------------------+     +----------------------------------+
 | Y.Doc (diagram.json) |<--->| Socket.IO WebSocket room         |
 | Y.Map(components)    | WS  | (project-{id})                   |
 | Y.Map(wires)         |     |                                  |
 | Y.Awareness          |     | Yjs WebSocket Provider           |
 +----------+-----------+     | (persists Y.Doc to PostgreSQL    |
            |                 |  and S3 on update)               |
            v                 +----------------------------------+
 Student B (browser)                         ^
 +----------------------+                    |
 | Y.Doc (same content) |<-------------------+
 | Y.Awareness          |
 +----------------------+
```

### Requirements — Collaboration

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| FR-STU-120 | The system shall support real-time collaborative editing of a project canvas by up to 10 simultaneous users. Changes made by any collaborator shall be reflected on all other collaborators' canvases within 500 ms under normal network conditions (< 100 ms RTT to the server). | Should | Yjs CRDT ensures convergence; no locking required for concurrent non-conflicting edits. |
| FR-STU-121 | Each active collaborator shall be represented by a distinct named colour cursor visible to all other collaborators on the canvas, labelled with the user's display name. Cursor positions shall be updated via Yjs Awareness at a rate of ≤ 100 ms per update. | Should | Cursor colour assigned from a palette of 10 distinct accessible colours (WCAG AA contrast on canvas background). |
| FR-STU-122 | The system shall display an active-users presence panel (avatars with display names and colour dots) at the top of the Studio, listing all current collaborators in the project. | Should | Presence panel updates reactively from Yjs Awareness state. |
| FR-STU-123 | A Teacher collaborating on a student project shall have a "Soft Lock" capability allowing them to lock any individual component or wire from editing by other collaborators. Locked elements are visually indicated (padlock icon) and emit a tooltip when hovered: "Locked by [Teacher name]". | Should | Lock state stored as a Yjs Awareness field; lock ownership checked before applying mutations from other users. |
| FR-STU-124 | Yjs document updates shall be persisted to the backend (PostgreSQL binary blob and/or S3 for large documents) on every change batch, with a server-side debounce of 500 ms to avoid excessive write amplification. Full `Y.Doc` snapshots shall be created on every manual save and every 50 Yjs update operations (whichever comes first). | Must | Snapshot policy ensures recovery is possible from at most 50 unsnapshotted operations. |
| FR-STU-125 | When a user joins a project that has an active collaboration session, the system shall provide the latest `Y.Doc` state as a full snapshot over the WebSocket handshake to minimise join latency; incremental updates are then exchanged. | Must | Join latency target: initial snapshot delivered within 2 seconds for projects up to 5 MB serialised. |
| FR-STU-126 | Local undo/redo in a collaborative session shall be scoped to the local user's own changes via Yjs `UndoManager`; it shall not reverse operations made by other collaborators. | Must | Yjs `UndoManager` configured with `trackedOrigins` containing the local user's client origin tag. |
| FR-STU-127 | The collaboration system shall enforce tenant isolation: a user may only join the collaboration session for a project within their own tenant (school), unless a cross-tenant share link has been explicitly issued and approved per FR-STU-155 rules. | Must | WebSocket room join is authenticated via JWT; tenant claim validated server-side before room admission. |

---

## Import and Export of diagram.json

### Document Schema

The canonical project document format is `diagram.json`. Its schema aligns with the Wokwi open-source project format (used by `wokwi.com`) with RoboCode-specific extension fields under a `robocode` namespace.

```
diagram.json — Top-Level Schema (abbreviated)

{
  "version": "1.0",
  "robocode": {
    "tenantId": "...",
    "projectId": "...",
    "boardType": "arduino-uno-r3" | "esp32-devkit" | "raspberry-pi-pico" | "<custom-board-id>",
    "viewport": { "x": 0, "y": 0, "zoom": 1.0 }
  },
  "parts": [
    {
      "id": "led1",
      "type": "wokwi-led",
      "top": 120,
      "left": 200,
      "rotate": 0,
      "attrs": { "color": "red" }
    },
    ...
  ],
  "connections": [
    ["led1:A", "bb1:a5", "red", []],
    ...
  ],
  "wires": [
    {
      "id": "w1",
      "src": "uno1:D13",
      "dst": "bb1:b5",
      "color": "green",
      "label": "",
      "segments": [[200,150],[200,200],[250,200]]
    },
    ...
  ]
}
```

### Requirements — Import and Export

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| FR-STU-160 | The system shall define and maintain a versioned `diagram.json` schema (SemVer) representing the complete canvas state: board type, all placed components with position/rotation/properties, all wire connections with routing segments and colours, viewport state, and `robocode`-namespace metadata. The schema shall be published in the platform's API documentation. | Must | Schema validation library (e.g., Zod or AJV) enforces schema on every save, import, and export. |
| FR-STU-161 | A Student shall be able to export their project as a `diagram.json` file download from the project settings menu ("Export Project"). The exported file shall be self-contained (no external asset references required to interpret the structure). | Could | Code is exported separately as `sketch.ino` (Arduino C/C++) or `main.py` (MicroPython); a combined ZIP archive option bundles both. |
| FR-STU-162 | A Student shall be able to import a `diagram.json` file (or ZIP archive) into RoboCode Studio via a "Import Project" dialog. The system shall validate the schema, report any unknown component types or schema version mismatches with plain-language guidance, and refuse to import files exceeding 10 MB. | Could | Unknown component types are flagged in an import report; the import proceeds with unknowns replaced by a placeholder element rendered as a warning box on the canvas. |
| FR-STU-163 | Imported projects from the Wokwi public format (`wokwi.com` diagram.json) shall be supported on a best-effort basis: component types present in the RoboCode catalogue are mapped; types not in the catalogue are treated as unknown per FR-STU-162. | Could | Wokwi format compatibility maintained for at minimum the component types listed in the RoboCode component catalogue. |
| FR-STU-164 | The system shall be able to export a PNG or SVG image of the current canvas (2D view) at the current zoom level or at a specified resolution (print quality: 300 DPI equivalent), available from the project settings menu. | Should | Export uses the browser's `OffscreenCanvas` or a server-side render endpoint for high-resolution exports; file download triggered via the browser download mechanism. |

---

## MoSCoW Priority Summary

The following table consolidates the MoSCoW priority of all FR-STU requirements defined in this section.

| Priority | FR-STU Requirement IDs |
|---|---|
| **Must** | FR-STU-001, 003, 004, 010, 011, 012, 013, 014, 019, 020, 021, 022, 024, 025, 026, 028, 029, 030, 031, 032, 033, 034, 035, 040, 041, 042, 043, 044, 046, 050, 051, 052, 053, 054, 060, 061, 063, 064, 068, 070, 071, 072, 073, 074, 075, 077, 078, 080, 090, 091, 092, 093, 094, 104, 110, 111, 112, 124, 125, 126, 127, 140, 141, 144, 150, 151, 152, 156, 160, 170, 171, 172, 173, 174 |
| **Should** | FR-STU-002, 015, 017, 018, 023, 027, 036, 045, 047, 062, 065, 067, 076, 100, 101, 102, 103, 105, 114, 116, 120, 121, 122, 123, 142, 143, 153, 154, 155, 164 |
| **Could** | FR-STU-016, 066, 069, 079, 113, 115, 157, 161, 162, 163 |
| **Won-t** | FR-STU: Physical hardware USB passthrough; AI-assisted auto-wiring; native mobile application support; general-purpose offline editing of arbitrary projects beyond the scoped PWA (the scoped PWA caching the most recent 10 projects is in scope per Section 20 NFR-LBW-013). All others deferred to post-v1.0 roadmap. |

---

## Constraints and Assumptions

1. **Browser support**: RoboCode Studio targets the last two major versions of Chrome, Firefox, Safari, and Edge. Internet Explorer and legacy Edge (EdgeHTML) are not supported.
2. **Wokwi open-source dependency**: `wokwi-elements`, `avr8js`, `rp2040js`, `wokwi-boards`, and related Wokwi npm packages are consumed as open-source build-time dependencies. The platform must track upstream releases; security-relevant patches must be applied within 14 calendar days of public disclosure.
3. **Minimum viewport**: 1 024 × 600 px for the full Studio UI. Below this, a "device not supported" page is shown. 3D view requires a minimum of 1 280 × 720 px for comfortable use.
4. **Offline operation**: A scoped Progressive Web App (PWA) is **in scope for v1.0** (see Section 20, NFR-LBW-013 through NFR-LBW-018): a Service Worker caches simulation assets, lesson content, and the most recent 10 projects, and an IndexedDB-backed sync queue allows offline edits to those projects to be replayed on reconnection. General-purpose offline editing of arbitrary projects (beyond the cached 10) remains out of scope for v1.0.
5. **Collaboration scale**: The Yjs-based collaboration system is specified for up to 10 simultaneous editors per project. Larger groups (e.g., class-wide view-only sessions with one active editor) are supported via the read-only share link mechanism.
6. **Low-connectivity environments**: Component manifest, 2D thumbnails, and reference card data shall be served via CDN edge caches. The `diagram.json` serialisation format is designed for compactness. 3D GLTF models are lazy-loaded and browser-cached. The platform should gracefully degrade to 2D-only operation on connections below 1 Mbps.
7. **Child safety**: All project sharing and collaboration features enforce tenant isolation and RBAC. Cross-tenant sharing requires explicit Teacher or School Admin approval. No publicly anonymous project listing is permitted. These constraints implement the platform's safety-first prime directive as defined in *Security, Privacy and Child Safety* (SR-xxx).

---

## Data Requirements (Cross-Reference)

The following data entities are owned or substantially consumed by this section. Full schema definitions are specified in *Data Architecture and Database Design* (DR-xxx).

| Entity | Key Fields | DR Cross-Reference |
|---|---|---|
| Project | `project_id`, `tenant_id`, `owner_user_id`, `board_type`, `name`, `created_at`, `updated_at` | DR-STU-001 |
| Project Snapshot | `snapshot_id`, `project_id`, `type` (manual/auto), `created_at`, `diagram_json` (S3 key), `thumbnail_url` | DR-STU-002 |
| Component Manifest | `manifest_version`, `components[]`, `compatibility_matrix` | DR-STU-003 |
| Collaboration Session | `session_id`, `project_id`, `ydoc_state` (binary blob), `active_users[]` | DR-STU-004 |
| Template | `template_id`, `tenant_id` (null for global), `name`, `difficulty`, `board_type`, `topic_tags[]` | DR-STU-005 |
| Wire Annotation | `annotation_id`, `project_id`, `author_user_id`, `target_element_id`, `text`, `created_at` | DR-STU-006 |
| Board Definition | `board_id`, `display_name`, `core_target` (avr8js/rp2040js/esp32), `scope` (tenant/global), `manifest_json` (board.json S3 key), `svg_asset_url`, `status` (pending/approved/rejected), `tenant_id` | DR-STU-007 |

---

## Interface Requirements (Cross-Reference)

The following interfaces are relevant to this section. Full specifications are in *API Specification and Integration Interfaces* (IR-xxx).

| Interface | Type | Direction | IR Cross-Reference |
|---|---|---|---|
| Studio REST API (`/api/studio/projects`) | REST/JSON | Client to Backend | IR-001 |
| Component Manifest API (`/api/studio/components/manifest`) | REST/JSON | Client to Backend | IR-002 |
| Yjs WebSocket (Socket.IO room per project) | WebSocket | Bidirectional | IR-003 |
| RSE Pin-State API (in-browser, Worker PostMessage) | In-process | Canvas to RSE | IR-004 |
| Compiler Microservice (compile-and-flash endpoint) | REST/JSON | Backend to Microservice | IR-005 |
| S3-compatible Object Storage (project files, 3D models) | S3 API (presigned URLs) | Backend to Object Store | IR-006 |
