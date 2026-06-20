# User Stories and Acceptance Criteria

## Overview

This section presents the full set of user stories for RoboCode.Africa, organised into
epics that align with the functional areas of the platform. Each story is expressed in
the canonical form **As a ROLE, I want GOAL, so that BENEFIT** and is followed by
structured **Given / When / Then** acceptance criteria that define the observable,
testable conditions for satisfaction.

Story identifiers follow the scheme **US-nnn** (sequential, padded to three digits).
Epics are named groupings only and carry no separate identifier. Each story cross-
references the relevant user requirement (UR-) or use-case (UC-) identifiers defined
elsewhere in this document.

Priority uses MoSCoW notation: **Must**, **Should**, **Could**, **Won-t**.

---

## Epic 1 — Onboarding and Approval

This epic covers all flows by which users first arrive at the platform, create accounts,
obtain consent (where required), and receive approval to access the full experience.
Related requirements: UR-ONB-001 through UR-ONB-nnn; Use Cases: UC-001 through UC-005.

### Story Table — Onboarding and Approval

| ID | User Story | Priority | Cross-Ref |
|----|-----------|----------|-----------|
| US-001 | As a **Student**, I want to self-register on robocode.africa so that I can access learning materials and RoboCode Studio. | Must | UR-ONB-010, UR-ONB-011, UC-004 |
| US-002 | As a **Parent / Guardian**, I want to provide verifiable consent on behalf of my child before the account is activated, so that I am confident the platform has legally obtained my permission. | Must | UR-ONB-027 through UR-ONB-036, UR-ONB-090, UC-005 |
| US-003 | As a **Super Admin**, I want to review and approve (or reject) pending direct-signup accounts, so that no unauthorised or unsafe account gains platform access. | Must | UR-ONB-012 through UR-ONB-014, UR-ADM-008, UC-006 |
| US-004 | As a **Student** registering via my school subdomain, I want my account automatically routed to my school tenant and approved by my School Admin, so that I do not wait for a separate platform-level review. | Must | UR-ONB-019, UR-ONB-020, UR-ADM-041 |
| US-005 | As a **School Admin**, I want to bulk-import students via a CSV file so that I can on-board an entire class quickly at the start of term. | Must | UR-ONB-049 through UR-ONB-054, UR-ADM-046 |
| US-006 | As a **Teacher**, I want to send class-invite links to students that pre-fill their registration and auto-assign them to my class, so that students join the correct class without manual admin effort. | Must | UR-ONB-037 through UR-ONB-043 |
| US-007 | As a **Guest / Visitor**, I want to explore a limited interactive demo of RoboCode Studio without registering, so that I can evaluate the platform before committing to sign-up. | Should | Section 5 Table 3 (Guest ephemeral demo); UR-SIM (RVM demo path) |
| US-008 | As a **Platform Moderator**, I want to receive a prioritised queue of pending approvals with age-risk flags, so that I can process minor accounts with greater care and speed. | Must | UR-ONB-013, UR-ADM-008, UR-ADM-012 |

### Acceptance Criteria — Selected Stories

**US-001 — Student Self-Registration**

```
Given I am an unregistered user on robocode.africa
When I complete the registration form (name, email, school, age, password)
  and submit it
Then the platform sends me an email verification link
  and my account state is set to "Unverified" (per UR-ONB-056)
  and no personal data beyond the minimum required fields is collected
  and if I am under 13 (COPPA) or under 16 (GDPR-K), the platform
    transitions my account to "Pending Parental Consent" after
    email verification before any further progression.
```

**US-002 — Parental Consent**

```
Given my child's account is in state "Pending Parental Consent"
When I receive the consent request email with a unique signed token link
  and I click the link, review the privacy notice, and confirm consent
Then my consent is recorded with a timestamp, IP address, and token
  and my child's account transitions to "Pending Approval"
  and a confirmation email is sent to both the parent and the student
  and the consent record is retained for the duration the account is
    active plus the jurisdiction-required retention period.
```

**US-003 — Super Admin Approval**

```
Given a direct-signup account is in state "Pending Approval"
When I (Super Admin or Platform Moderator) open the approval queue
  and select the account and click "Approve" or "Reject"
Then if Approved:
  - the account transitions to "Active"
  - the student receives an activation email
  - an audit log entry is created with the approver identity and timestamp
If Rejected:
  - the account transitions to "Rejected"
  - the student receives a rejection notification with contact information
  - no personal data is retained beyond the legally required minimum
    after the account is closed.
```

**US-005 — Bulk Student Import**

```
Given I am a School Admin on my school subdomain
When I upload a CSV file containing student name, email, year group,
  and optional parent email columns
Then the platform validates each row for format and duplicate email
  and sends invitation and consent-request emails for valid rows
  and displays a per-row import report (success / validation error /
    duplicate) to me
  and queues successfully parsed rows as "Unverified" (per UR-ONB-056)
  and no row causes a partial silent failure — every error is surfaced.
```

---

## Epic 2 — Studio Build (Canvas and Wiring)

This epic covers students and teachers building circuits on the RoboCode Studio canvas.
Related requirements: UR-STU-001 through UR-STU-nnn; Use Cases referencing Section 9.

### Story Table — Studio Build

| ID | User Story | Priority | Cross-Ref |
|----|-----------|----------|-----------|
| US-009 | As a **Student**, I want to drag components from the component palette onto the canvas so that I can design a virtual circuit without physical hardware. | Must | UR-STU-001, UR-STU-020 (canvas placement) |
| US-010 | As a **Student**, I want to connect component pins through a visual breadboard so that I can learn correct circuit-building technique. | Must | UR-STU-040 through UR-STU-045 (wiring/breadboard) |
| US-011 | As a **Student**, I want real-time visual feedback (colour-coded wire validity, DRC warnings) as I wire components, so that I can correct mistakes immediately rather than discovering them at runtime. | Must | UR-STU-030, UR-STU-051 onward (wire validity / design-rule check) |
| US-012 | As a **Student**, I want to switch between 2D schematic view and 3D perspective view of my circuit so that I can understand the physical layout of components. | Should | UR-STU-048 through UR-STU-050 (2D/3D views and fallback) |
| US-013 | As a **Teacher**, I want to create a starter-template project with a pre-wired circuit that students open and extend, so that class time is spent on the coding objective rather than wiring basics. | Must | UR-STU-070 through UR-STU-072 (starter templates) |
| US-014 | As a **Student**, I want to undo and redo canvas operations (place, move, delete, wire) so that I can experiment freely without fear of losing good work. | Must | UR-STU-040, UR-STU-058, UR-STU-059 (undo/redo) |
| US-015 | As a **Student**, I want to search the component catalogue by keyword or category so that I can quickly find the HC-SR04 ultrasonic sensor or any other specific part. | Must | UR-STU-002 (palette search) |
| US-016 | As a **Student** on a low-end device, I want the canvas to automatically fall back to 2D mode when WebGL2 is unavailable, so that I can still complete my project. | Must | UR-STU-050 (3D-to-2D fallback) |
| US-017 | As a **Student**, I want to save my project at any point and resume it later in the same state so that I do not lose work between sessions. | Must | UR-STU-061, UR-STU-062 (save/load project) |
| US-018 | As a **Teacher**, I want to view and annotate a student's canvas project without overwriting it, so that I can give targeted feedback on the circuit design. | Must | Section 5 Table 3 (read-only open); UR-ADM-074 |

### Acceptance Criteria — Selected Stories

**US-009 — Drag Components onto Canvas**

```
Given I am a Student with an Active account in RoboCode Studio
When I drag an "Arduino UNO R3" from the component palette
  and drop it onto the canvas
Then the component appears at the drop location with correct pin labels
  and appears in the project's component manifest
  and the canvas state is dirtied (unsaved-changes indicator shown)
  and the action is undoable via Ctrl+Z / Cmd+Z.
```

**US-010 — Breadboard Wiring**

```
Given I have an Arduino UNO R3 and an LED on the canvas
  and a full-size breadboard placed between them
When I click pin 13 on the Arduino and drag to a breadboard tie-point
  and then connect the LED anode to an adjacent breadboard column
  and connect a 220-ohm resistor from the LED cathode to the GND rail
Then the wiring layer renders each connection as a coloured wire
  and the breadboard tie-point connection map is updated
  and the Design Rule Check passes with no error (complete circuit path)
  and the RSE is notified of the updated netlist.
```

**US-016 — 3D to 2D Fallback**

```
Given I open RoboCode Studio on a device where WebGL2 is unavailable
When the studio initialises the canvas
Then the canvas renders in 2D mode using wokwi-elements web components
  and a non-blocking banner informs me that 3D mode is unavailable
    on this device
  and all drag, wire, and simulation functions are fully operational
  and no error is thrown to the browser console that blocks interaction.
```

---

## Epic 3 — Simulation Experience

This epic covers the runtime simulation of circuits and components within the
RoboCode Simulation Engine (RSE). Related requirements: UR-SIM-001 through
UR-SIM-nnn; see *User Requirements: Simulation Experience*.

### Story Table — Simulation

| ID | User Story | Priority | Cross-Ref |
|----|-----------|----------|-----------|
| US-019 | As a **Student**, I want to start and stop the simulation from a clearly labelled button so that I can test my circuit at any time during design. | Must | UR-SIM-001 through UR-SIM-005 (run/pause/stop/reset) |
| US-020 | As a **Student**, I want LEDs on the canvas to light up (or change colour) in response to the simulated MCU pin state so that I receive immediate visual feedback on my code's effect. | Must | UR-SIM-010 (LED behavioural model) |
| US-021 | As a **Student**, I want the simulation to emit audio through my browser when my sketch drives a passive or active buzzer, so that I experience the full behaviour of the circuit. | Should | UR-SIM-030 (buzzer/Web Audio) |
| US-022 | As a **Student**, I want to interact with simulated input components (push buttons, potentiometer slider, keypad keys) during a live simulation so that I can test sensor-driven program logic. | Must | UR-SIM-040 (interactive inputs) |
| US-023 | As a **Student**, I want to see live pin-state values and voltage readings in a simulation inspector panel so that I can debug electrical problems without needing an oscilloscope. | Should | UR-SIM-060, UR-SIM-068 through UR-SIM-070 (Pin State Inspector) |
| US-024 | As a **Teacher**, I want to pre-configure virtual sensor readings (e.g., a fixed temperature from a DHT11) in a test scenario, so that student code is tested against a known input without requiring live manipulation. | Should | UR-SIM (sensor behavioural models and virtual controls) |
| US-025 | As a **Student**, I want the simulation to display a friendly error message when my circuit has a short circuit or an unsupported wiring configuration, so that I can understand and fix the problem. | Must | UR-SIM-005 (Error state); UR-STU-051 onward (DRC) |
| US-026 | As a **Student**, I want the LCD (HD44780) on the canvas to display the characters my code sends via the LiquidCrystal library, so that I can prototype real display output. | Must | UR-SIM (HD44780 16x2/20x4 LCD behavioural model) |

### Acceptance Criteria — Selected Stories

**US-019 — Start / Stop Simulation**

```
Given I have a valid project open in RoboCode Studio with at least one
  board and one component wired
When I click the "Run Simulation" button in the toolbar
Then the RSE compiles (or interprets) the sketch and loads it
  and the toolbar button changes to "Stop Simulation"
  and simulated components begin reflecting the MCU output state
  and if compilation fails, a diagnostic panel shows the error
    with line number and friendly description
  and if a fatal runtime error occurs, the simulation stops
    and a non-blocking error banner is displayed.
```

**US-022 — Interactive Input During Simulation**

```
Given a live simulation is running with a push button wired to pin 2
  on an Arduino UNO R3
When I click the on-canvas push-button component with my mouse
Then the RSE receives a pin-state-change event for pin 2 (HIGH)
  and holds that state while my mouse button is held
  and releases to LOW when I release the mouse button
  and any output change driven by that input (e.g., LED toggles)
    is reflected visually within 50 ms of the pin-state event.
```

**US-026 — LCD Character Output**

```
Given my sketch calls lcd.print("Hello, Africa!") on a 16x2 LCD
  wired via I2C to the Arduino UNO R3
When the simulation runs
Then the 16x2 LCD component on the canvas renders "Hello, Africa!"
  on row 0 in the character cell font matching the HD44780 spec
  and subsequent lcd.setCursor / lcd.print calls update the correct
    character cells
  and clearing the display (lcd.clear()) blanks all cells correctly.
```

---

## Epic 4 — Code Editor and Programming

This epic covers the in-browser Monaco editor, language support, compile and run
flows, and the block-to-text transpiler for younger students. Related requirements:
UR-CODE-001 through UR-CODE-nnn; see *User Requirements: Code Editor and
Programming*.

### Story Table — Coding

| ID | User Story | Priority | Cross-Ref |
|----|-----------|----------|-----------|
| US-027 | As a **Student**, I want to write Arduino C/C++ code in the Monaco editor with syntax highlighting and autocomplete so that I can code efficiently and avoid trivial typos. | Must | UR-CODE-005, UR-CODE-022 (autocomplete) |
| US-028 | As a **Student**, I want to write MicroPython code for an ESP32 or Raspberry Pi Pico project so that I can learn Python-based embedded programming on two distinct hardware families. | Must | UR-CODE-006 |
| US-029 | As a **primary-school Student**, I want to assemble block-based code in a Scratch-style block editor that automatically shows and updates equivalent text code, so that I learn programming concepts before text-based syntax. | Must | UR-CODE-001 through UR-CODE-003 (block mode + live preview) |
| US-030 | As a **Student**, I want real-time red-underline linting and inline error messages in the editor so that I can see coding errors as I type. | Must | UR-CODE-024, UR-CODE-025 (lint diagnostics) |
| US-031 | As a **Student**, I want the editor to autocomplete library function names and component APIs (e.g., `servo.write()`, `dht.read()`) so that I can discover the correct API without reading external documentation. | Should | UR-CODE-022, UR-CODE-023 (autocomplete + inline docs) |
| US-032 | As a **Student**, I want to click a "Compile and Run" button that uploads my firmware to the simulated Arduino UNO, ESP32, or Raspberry Pi Pico and starts the simulation immediately, so that the code-test loop is fast and frictionless. | Must | UR-CODE-061 (Run via RSE) |
| US-033 | As a **Student**, I want to see a Serial Monitor panel that shows output from `Serial.println()` calls so that I can debug my code using print statements. | Must | UR-CODE-063 (Serial Monitor) |
| US-034 | As a **Teacher**, I want to lock specific lines of a starter sketch so that students cannot accidentally delete the scaffolding code I have provided. | Should | UR-CODE-045 (read-only scaffold regions) |
| US-035 | As a **Student**, I want the platform to suggest relevant library `#include` statements when I add a sensor component to the canvas, so that I know which library to import. | Should | UR-CODE-041 (auto-suggest includes) |
| US-083 | As a **Student**, I want to write MicroPython, CircuitPython, or C/C++ (Arduino-Pico core / Pico SDK) code for a Raspberry Pi Pico project and run it in the simulated rp2040js environment, so that I can explore RP2040 hardware features such as PIO state machines and dual-core execution without physical hardware. | Must | UR-CODE-006, UR-SIM (rp2040js target) |
| US-084 | As a **Teacher or Platform Admin**, I want to upload a custom board definition (board.json manifest and SVG asset in the wokwi-boards format) so that I can add school-specific or locally-manufactured boards to the component library without requiring a code deployment. | Should | UR-ADM-026, UR-STU (board library extensibility) |

### Acceptance Criteria — Selected Stories

**US-027 — Monaco Editor with Autocomplete**

```
Given I have an Arduino UNO R3 project open in RoboCode Studio
  and the Code Editor tab is active
When I begin typing "digit" in the editor
Then the Monaco editor displays an autocomplete suggestion for
  "digitalWrite(pin, value)" within 300 ms
  and selecting the suggestion inserts the correct snippet with
    tab-stop placeholders for `pin` and `value`
  and the suggestion tooltip shows the function signature and a
    brief description.
```

**US-029 — Block-to-Text Transpilation**

```
Given I am a primary-school Student in block-editor mode
When I drag a "Set LED on pin 13 to HIGH" block into the program area
Then the right-hand text panel updates in real time to show the
  equivalent Arduino C++ code:
    digitalWrite(13, HIGH);
  and the updated text is syntactically valid and compilable
  and switching to text mode preserves the block-derived code
  and I cannot introduce invalid syntax through the block editor alone.
```

**US-033 — Serial Monitor**

```
Given my sketch contains Serial.begin(9600) and Serial.println("tick")
  inside loop()
When the simulation is running
Then the Serial Monitor panel receives "tick" followed by a newline
  on each loop iteration
  and output scrolls automatically
  and I can clear the output buffer with a "Clear" button
  and I can send characters to the simulated MCU via an input field
    that delivers them to Serial.read().
```

**US-083 — Raspberry Pi Pico Simulation (rp2040js)**

```
Given I have a Raspberry Pi Pico project open in RoboCode Studio
  with a MicroPython script that toggles GP25 (the on-board LED)
  every 500 ms
When I click "Compile and Run"
Then the RSE loads the firmware image into the rp2040js RP2040 simulator
  and the on-canvas Pico component's GP25 LED toggles state every 500 ms
  and the REPL / Serial Monitor panel reflects any print() output from
    the MicroPython runtime
  and rp2040js accurately models dual-core ARM Cortex-M0+ execution
    including PIO state machines and ADC inputs on GP26/GP27/GP28
  and the simulation handles a UF2 or ELF firmware image produced by
    the Arduino-Pico core or Pico SDK equally.
```

**US-084 — Custom Board Definition Upload (wokwi-boards)**

```
Given I am a Teacher or Platform Admin with board-upload permission
When I upload a board package consisting of a board.json manifest
  (in the wokwi-boards format, declaring board name, MCU core target,
  and pin definitions each with name, type, and x/y position) together
  with an SVG visual asset
Then the platform validates the manifest against the JSON schema
  and checks pin sanity (no duplicate names, valid types)
  and scans the SVG asset for unsafe content
  and if I am not a Platform Admin, places the definition into the
    moderation queue for review before it becomes available to learners
  and once approved, the custom board appears in the component palette
    under "Custom Boards" within my tenant, bound to the declared MCU
    core target (avr8js, rp2040js, or ESP32 core)
  and no code deployment is required for the board to become usable.
```

---

## Epic 5 — Learning, Courses, Tasks and Assessment

This epic covers structured learning paths, assigned tasks, auto-grading, and teacher
assessment workflows. Related requirements: UR-LRN-001 through UR-LRN-nnn; see
*User Requirements: Learning, Courses, Tasks and Assessment*.

### Story Table — Learning

| ID | User Story | Priority | Cross-Ref |
|----|-----------|----------|-----------|
| US-036 | As a **Student**, I want to browse a catalogue of courses and modules organised by age group and difficulty so that I can find content appropriate for my skill level. | Must | UR-LRN-001, UR-LRN-002, UR-LRN-007 |
| US-037 | As a **Student**, I want to complete interactive in-lesson quizzes and see immediate feedback so that I can check my understanding before moving on. | Must | UR-LRN-031 (Knowledge Checks / quizzes) |
| US-038 | As a **Student**, I want to submit a completed coding task project so that my Teacher can review and grade my work. | Must | UR-LRN-019, UR-LRN-041 (submission to grading queue) |
| US-039 | As a **Teacher**, I want to create a coding task with a description, starter project, deadline, and rubric so that I can assign structured work to my class. | Must | UR-LRN-037, UR-LRN-042 (assignment + rubric) |
| US-040 | As a **Teacher**, I want the platform to auto-grade student submissions against a test-case harness I configure so that objective tasks are assessed consistently without manual effort. | Should | UR-LRN-023, UR-LRN-025 (auto-checked tasks) |
| US-041 | As a **Teacher**, I want to provide written feedback and a grade on a student's submitted project from a grading interface so that the student receives actionable guidance. | Must | UR-LRN-042, UR-LRN-043, UR-LRN-045 |
| US-042 | As a **Student**, I want to see my grade, feedback, and a model solution (after the deadline passes) so that I can learn from any mistakes. | Must | UR-LRN-043, UR-LRN-047 |
| US-043 | As a **School Admin**, I want to assign courses from the global content library to my school's curriculum so that Teachers can then assign them to classes. | Must | UR-LRN-005 (Global Content Library import); UR-ADM-043 |
| US-044 | As a **Teacher**, I want to author a new lesson with mixed content (text, video embed, interactive simulator step) using a rich content editor so that I can create custom teaching material. | Should | UR-LRN-008, UR-LRN-010 (lesson authoring) |

### Acceptance Criteria — Selected Stories

**US-038 — Task Submission**

```
Given I have a coding task assigned by my Teacher that is not past
  its deadline
When I open the task, build my project in RoboCode Studio, and click
  "Submit Task"
Then the platform snapshots my current project state (canvas + code)
  and marks the task as "Submitted" with a submission timestamp
  and notifies my Teacher that a submission is ready for review
  and prevents me from modifying the submitted snapshot (I may still
    work on a new version but the submitted snapshot is immutable)
  and if the deadline has already passed, the platform warns me but
    still accepts the submission and flags it as late.
```

**US-040 — Auto-Grading**

```
Given a Teacher has configured a task with three test cases:
  (1) LED on pin 13 HIGH after 1 s,
  (2) LED LOW after 2 s,
  (3) Serial output contains "Blink"
When a Student submits the project and the auto-grader runs
Then the RSE executes the compiled firmware against each test case
  in isolation
  and each test case is marked PASS or FAIL with a reason
  and the total score is computed as a weighted sum per the Teacher's
    rubric configuration
  and the Student sees only the score and a per-test pass/fail
    summary (not the hidden test-case implementation)
  and the Teacher sees the full test-case detail in the grading panel.
```

**US-041 — Teacher Feedback**

```
Given a Student has submitted a task and I (Teacher) open the
  grading interface
When I enter written feedback, a numeric grade, and click "Publish
  Grade"
Then the Student receives an in-platform notification and email
  stating their grade is available
  and the grade and feedback are stored against the submission record
  and the grade feeds the class progress report
  and the Student's RoboPoints balance is updated per the task's
    configured point award (see US-001 in the Gamification epic,
    UR-GAM-001).
```

---

## Epic 6 — Teams, Competitions and Collaboration

This epic covers team formation, competition entry, real-time collaborative editing,
and result publication. Related requirements: UR-TEAM-001 through UR-TEAM-nnn;
see *User Requirements: Teams, Competitions and Collaboration*.

### Story Table — Teams and Competitions

| ID | User Story | Priority | Cross-Ref |
|----|-----------|----------|-----------|
| US-045 | As a **Student**, I want to create a Team and invite classmates so that we can collaborate on projects and enter competitions together. | Must | UR-TEAM-001, UR-TEAM-008, UR-TEAM-014 |
| US-046 | As a **Student (Team Captain)**, I want to enter my Team into an open Competition so that we can compete against other teams. | Must | UR-TEAM-002, UR-TEAM-022 |
| US-047 | As a **Teacher**, I want to create a Competition with defined challenges, rounds, deadline, and scoring rules so that I can run a structured coding contest for my class or school. | Must | UR-TEAM-034, UR-TEAM-037, UR-TEAM-038 |
| US-048 | As a **Student**, I want to edit a shared Team project simultaneously with my teammates in real time so that we can collaborate efficiently during a competition. | Must | UR-TEAM-024 (real-time co-editing) |
| US-049 | As a **Student**, I want to see live presence indicators (avatar + cursor) for teammates who are editing the same project, so that we can coordinate without talking over each other. | Should | UR-TEAM-025 (presence indicators) |
| US-050 | As a **Teacher**, I want to view a live scoreboard during a Competition round so that I can track standings and make announcements. | Must | UR-TEAM-065 (real-time leaderboard) |
| US-051 | As a **School Admin**, I want to enrol my school into a platform-wide inter-school competition managed by the Super Admin so that our students can compete nationally. | Should | UR-TEAM-035, UR-TEAM-082; UR-ADM-055 |
| US-052 | As a **Student**, I want to receive a digital certificate when my Team achieves a podium placement in a Competition so that I can share my achievement. | Should | UR-TEAM-069 (digital certificate) |

### Acceptance Criteria — Selected Stories

**US-048 — Real-Time Collaborative Editing**

```
Given two Students (A and B) are both Team Members of the same Team
  and both have the Team project open in RoboCode Studio
When Student A drags a new component onto the canvas
Then within 500 ms, Student B's canvas also shows the new component
  at the same position
  and the operation is recorded in the Yjs CRDT document log
  and if either student is briefly offline, their changes are queued
    and merged without data loss upon reconnection
  and concurrent conflicting edits (two students wiring the same pin)
    are resolved deterministically by the CRDT merge strategy
    and both students see the resolved state within 2 s.
```

**US-047 — Create Competition**

```
Given I am a Teacher on a school subdomain
When I complete the Create Competition form (name, description,
  start date, end date, rounds, challenge type, team size limits,
  scoring weights) and publish it
Then the Competition appears in the school's competitions listing
  with status "Open for Registration"
  and eligible students and teams can register
  and I can preview the student-facing competition page before
    publishing
  and the Competition is isolated to my school tenant by default,
    unless I explicitly request Super Admin to make it platform-wide.
```

**US-049 — Live Presence Indicators**

```
Given Student A and Student B are co-editing the same project
When Student B moves their mouse over the canvas
Then Student A's canvas shows a coloured avatar cursor labelled with
  Student B's display name tracking the position
  and if Student B is inactive for 60 s, their presence indicator
    fades to a "idle" state
  and if Student B disconnects, their indicator is removed within 5 s
  and the presence data does not transmit raw cursor co-ordinates
    to any third-party analytics service.
```

---

## Epic 7 — Gamification, RoboPoints and Leaderboards

This epic covers point earning, badge awards, streaks, leaderboards, and redemption.
Related requirements: UR-GAM-001 through UR-GAM-nnn; see *User Requirements:
Gamification, RoboPoints and Leaderboards*.

### Story Table — Gamification

| ID | User Story | Priority | Cross-Ref |
|----|-----------|----------|-----------|
| US-053 | As a **Student**, I want to earn RoboPoints for completing tasks and lessons so that I am motivated to engage consistently with the platform. | Must | UR-GAM-001, UR-GAM-002 |
| US-054 | As a **Student**, I want to see my current RoboPoints balance and XP level on my profile dashboard so that I know my standing at any time. | Must | UR-GAM-015 (Level/XP in header) |
| US-055 | As a **Student**, I want to earn a Streak Bonus when I maintain daily activity for 7 consecutive days so that I am encouraged to practise coding regularly. | Should | UR-GAM-005 (streak bonus) |
| US-056 | As a **Student**, I want to unlock badges for specific achievements (e.g., "First Blink", "ESP32 Explorer", "Pico Pioneer", "Team Captain") so that my milestones are visibly celebrated. | Should | UR-GAM-016, UR-GAM-017 (badges) |
| US-057 | As a **Student**, I want to view the class leaderboard sorted by RoboPoints so that I can see how I rank among my peers. | Should | UR-GAM-023 (individual leaderboards) |
| US-058 | As a **Student**, I want my leaderboard display name to default to a privacy-safe pseudonym so that my real name is not publicly visible without my (or my parent's) explicit opt-in. | Must | UR-GAM-052, UR-ONB-093 |
| US-059 | As a **Teacher**, I want to manually award or deduct RoboPoints with a reason so that I can recognise exceptional effort or correct gaming of the system. | Must | UR-GAM-008 (default cap 1–500) |
| US-060 | As a **School Admin**, I want to reset leaderboard standings at the start of each term (Season) so that students have a fresh competitive baseline each term. | Should | UR-GAM-034, UR-GAM-036 (Seasons/resets) |

### Acceptance Criteria — Selected Stories

**US-053 — Earn RoboPoints on Task Completion**

```
Given I have submitted a task and the Teacher has marked it complete
When the grading event is persisted
Then my RoboPoints balance increases by the configured point value
  for that task (base 50 × difficulty tier multiplier)
  and the award appears in my RoboPoints transaction history with
    the task name, date, and amount
  and a toast notification informs me of the award in-platform
  and the award is reflected on the class leaderboard within 60 s.
```

**US-058 — Leaderboard Privacy**

```
Given I am a Student under 16 with default privacy settings
When my name appears on the class leaderboard
Then my display name is a platform-generated pseudonym (e.g.,
  "CoderStar42"), not my real name
  and my real name is visible only to my Teacher and School Admin
  and I (or my Parent / Guardian if I am under 13) can opt in to
    showing my real name, but only on the school-scoped leaderboard
    — never on a public platform-wide leaderboard
  and the opt-in is revocable at any time.
```

**US-059 — Teacher Manual Point Award**

```
Given I am a Teacher viewing a Student's profile in my class
When I click "Award RoboPoints", enter a value (1–500), and a
  mandatory reason ("Excellent teamwork in today's lab session"),
  and confirm
Then the Student's RoboPoints balance increases by that amount
  and the adjustment is logged in the audit trail with my identity,
    timestamp, amount, and reason
  and the Student receives an in-platform notification
  and if I attempt to award more than the School Admin-configured
    per-award cap, the system blocks the action with a clear message.
```

---

## Epic 8 — Safety, Communication and Notifications

This epic covers in-platform messaging, moderation, notifications, parental oversight,
and safeguarding escalation. Related requirements: UR-COMM-001 through UR-COMM-nnn;
see *User Requirements: Communication, Notifications and Safety*.

### Story Table — Safety and Communication

| ID | User Story | Priority | Cross-Ref |
|----|-----------|----------|-----------|
| US-061 | As a **Student**, I want to post a question in a class discussion board so that I can ask my Teacher and classmates for help. | Must | UR-COMM-004, UR-COMM-005 (moderated class/team channels) |
| US-062 | As a **Teacher**, I want to receive instant in-platform and email notifications when a student submits a task or posts a flagged message so that I can respond promptly. | Must | UR-COMM-013, UR-COMM-014 (notifications) |
| US-063 | As a **Platform Moderator**, I want all student-generated text content to pass through an automated profanity and PII filter before being published, so that harmful content never reaches other users. | Must | UR-COMM-018 through UR-COMM-020 (moderation pipeline) |
| US-064 | As a **Student**, I want to report a message or post as inappropriate using a visible "Report" button so that I can alert moderators to harmful content. | Must | UR-COMM-029, UR-COMM-030 (abuse reporting) |
| US-065 | As a **Parent / Guardian**, I want to receive a weekly summary email of my child's platform activity (lessons completed, RoboPoints earned, time spent) so that I can stay informed. | Should | UR-ADM-093 (parent progress summary); UR-COMM-014 |
| US-066 | As a **Super Admin**, I want to receive an escalation alert when a safeguarding keyword is detected in any student-generated content, so that I can investigate and act immediately. | Must | UR-COMM-021, UR-COMM-041 through UR-COMM-044 (safeguarding) |
| US-067 | As a **Student**, I want to receive a notification when my Teacher grades my submission so that I know when to review my feedback. | Must | UR-COMM-014 (email/in-app notification) |
| US-068 | As a **Teacher**, I want to send a class-wide announcement to all students in my class so that I can communicate deadlines, reminders, and encouragement at scale. | Must | UR-COMM-001 (Class Announcements) |

### Acceptance Criteria — Selected Stories

**US-063 — Profanity and PII Filtering**

```
Given a Student submits a post in a class discussion board
When the post content is processed by the content moderation pipeline
Then profanity patterns are detected and the post is either:
  (a) auto-rejected with an inline warning to the student, or
  (b) held for moderator review before publication
  and PII patterns (email, phone, physical address, surname combined
    with age) are detected and the post is held for review
  and no held post is visible to other students until approved
  and the detection latency is under 2 s from submission.
```

**US-064 — Student Report Button**

```
Given I am viewing a post or message in the platform
When I click the "Report" button and select a reason from the
  dropdown (Inappropriate language / Bullying / Personal information
  / Other) and optionally add a description, then submit
Then the report is logged with a timestamp, my identity, the
  reported content ID, and the reason
  and the Platform Moderator and Teacher receive an alert
  and I receive confirmation that my report was received
  and my identity as the reporter is not disclosed to the
    reported user.
```

**US-066 — Safeguarding Escalation**

```
Given the automated content scanner detects a safeguarding keyword
  (e.g., abuse, self-harm, exploitation) in any student post,
  message, project title, or comment
When the detection event fires
Then the content is immediately withheld from publication
  and a P1 safeguarding alert is sent to the Super Admin and the
    relevant School Admin within 60 s
  and the alert includes the student's name, the flagged content
    excerpt, and a direct link to the full moderation record
  and the event is recorded in the immutable audit log
  and no further action automatically acts on the student account
    — a human must review before any account action is taken.
```

---

## Epic 9 — Administration and Reporting

This epic covers Super Admin and School Admin management of the platform: tenant
management, user management, content management, billing, and reporting. Related
requirements: UR-ADM-001 through UR-ADM-nnn; see *User Requirements: Administration
and Reporting*.

### Story Table — Administration

| ID | User Story | Priority | Cross-Ref |
|----|-----------|----------|-----------|
| US-069 | As a **Super Admin**, I want to create a new School (Tenant) record with a subdomain and plan tier so that a new school can begin using the platform. | Must | UR-ADM-001, UR-ADM-003 |
| US-070 | As a **Super Admin**, I want to view platform-wide health dashboards (active users, simulation load, error rates) so that I can monitor system performance and capacity. | Must | UR-ADM-032, UR-ADM-035 |
| US-071 | As a **School Admin**, I want to view a report of all students' task completion rates and RoboPoints balances so that I can identify students who are disengaged or excelling. | Must | UR-ADM-059, UR-ADM-061 |
| US-072 | As a **School Admin**, I want to deactivate a student account immediately so that I can respond quickly to disciplinary or safeguarding situations. | Must | UR-ADM-043 |
| US-073 | As a **Super Admin**, I want to publish new components and board definitions (in the wokwi-boards manifest format) to the global component catalogue so that all tenants can use newly supported hardware — including custom boards — without a code deployment. | Must | UR-ADM-026 |
| US-074 | As a **School Admin**, I want to export a report of student grades, attendance, and RoboPoints as a CSV for integration with the school's existing reporting system. | Should | UR-ADM-061, UR-ADM-086 |
| US-075 | As a **Super Admin**, I want to configure platform-wide feature flags so that I can enable or disable features in beta without a code deployment. | Should | UR-ADM-024 |
| US-076 | As a **School Admin**, I want to manage my school's subscription plan and seat count through a self-service billing portal so that I can scale up or down without contacting support. | Should | UR-ADM-054 (seats); Section 5 Table 11 (billing) |

### Acceptance Criteria — Selected Stories

**US-069 — Create School Tenant**

```
Given I am a Super Admin on the admin console at admin.robocode.africa
When I complete the New School form (school name, country, contact
  email, plan tier, desired subdomain) and click "Create Tenant"
Then the platform provisions the tenant record with a unique tenant_id
  and the subdomain school.robocode.africa becomes accessible
  and the School Admin invitation email is sent to the contact email
  and a default resource quota (seats, storage, simulators) is applied
    per the selected plan tier
  and the tenant record appears in the global tenants list within 30 s.
```

**US-071 — School Admin Reporting**

```
Given I am a School Admin viewing the Reports section
When I select "Task Completion Report" for a date range
Then the platform generates a table of all students with columns:
  Student Name, Class, Tasks Assigned, Tasks Completed, Completion %,
  Average Grade, and Total RoboPoints
  and I can sort and filter by any column
  and the report respects Row-Level Security: I see only students
    in my tenant
  and I can export the report as CSV with all personal data
    processed under a data-processing agreement.
```

**US-072 — Deactivate Student Account**

```
Given I am a School Admin and a safeguarding concern has been raised
When I navigate to the student's account page and click
  "Deactivate Account" and confirm the action
Then the student's account state is immediately set to "Suspended"
  and all active sessions for that student are invalidated within 5 s
  and the student receives no notification of the suspension
    (to avoid alerting a potential bad actor during investigation)
  and the deactivation event is recorded in the audit log with my
    identity, timestamp, and the mandatory reason field
  and the student's data is retained per data-protection policy
    — not deleted — until a Super Admin authorises deletion.
```

---

## Epic 10 — White-Labelling and Custom Domain

This epic covers school branding, custom domain setup, and per-tenant configuration.
Related requirements: UR-SCH-001 through UR-SCH-nnn; see *User Requirements: School
Onboarding, Custom Domain and White-Labelling*.

### Story Table — White-Labelling

| ID | User Story | Priority | Cross-Ref |
|----|-----------|----------|-----------|
| US-077 | As a **School Admin**, I want to upload my school's logo and set primary and secondary brand colours so that students experience a platform that reflects the school's identity. | Must | UR-SCH-030, UR-SCH-032, UR-SCH-033 |
| US-078 | As a **School Admin**, I want to configure a custom domain (e.g., code.myschool.ac.zw) that points to my school's tenant so that students access the platform through a familiar URL. | Must | UR-SCH-020, UR-SCH-021, UR-SCH-022 |
| US-079 | As a **School Admin**, I want the platform to automatically provision and renew a TLS certificate for my custom domain so that I do not need to manage SSL manually. | Must | UR-SCH-025, UR-SCH-026 (ACME provision/renew) |
| US-080 | As a **School Admin**, I want to configure the platform so that the "Powered by RoboCode.Africa" footer attribution is shown or hidden per my school's plan tier, so that higher-tier schools can fully white-label the experience. | Should | UR-SCH-035 (footer attribution) |
| US-081 | As a **School Admin**, I want students logging in via my custom domain to be automatically offered my school's Google Workspace or Microsoft 365 SSO as the primary login option, so that students do not need separate platform credentials. | Should | UR-SCH-040 (SSO registration mode); UR-AUTH (SSO) |
| US-082 | As a **Super Admin**, I want to verify that a school has correctly set the required DNS CNAME or TXT record before activating their custom domain, so that automated ACME certificate issuance does not fail. | Must | UR-SCH-022, UR-SCH-023 (DNS verification) |

### Acceptance Criteria — Selected Stories

**US-078 — Custom Domain Configuration**

```
Given I am a School Admin in the School Settings panel
When I enter my custom domain "code.myschool.ac.zw" and click "Add
  Domain"
Then the platform displays the required DNS record:
  CNAME code.myschool.ac.zw -> <tenant-id>.proxy.robocode.africa
  and a TXT record for domain verification
  and I am instructed to add these to my DNS provider
  and the platform polls for DNS propagation and displays the
    current status (Pending / Verified / Failed) in real time
  and once verified, TLS certificate provisioning via ACME begins
    automatically
  and students can access my school tenant at the custom domain
    within 15 minutes of certificate issuance.
```

**US-077 — School Branding**

```
Given I am a School Admin in the Branding settings
When I upload a school logo (PNG or SVG, max 2 MB) and enter
  hex colour values for primary (#004A8F) and secondary (#F4A300)
  brand colours and click "Save"
Then the school subdomain and custom domain immediately render the
  uploaded logo in the top-left navigation
  and all primary call-to-action buttons use the configured primary
    colour
  and the design-token system applies the brand colours across all
    themeable Radix/shadcn UI components within the tenant
  and my changes do not affect any other tenant
  and a preview is displayed before I commit the change.
```

**US-081 — School SSO Login**

```
Given a school has Google Workspace SSO configured with a verified
  OAuth2/OIDC client
When a student visits the school's custom domain login page
Then the "Sign in with Google" button is presented as the primary
  login option above the username/password form
  and clicking it initiates the OAuth2 PKCE flow to the school's
    Google Workspace identity provider
  and on successful authentication the student's platform account
    is matched by email and a session is created
  and if no matching platform account exists, the student is directed
    to the registration flow with email pre-filled from the IdP claim
  and the SSO flow respects COPPA/GDPR-K age-gate checks even when
    the external IdP authenticates the user.
```

---

## Summary Index

The table below provides a compact cross-reference of all stories in this section.

| ID | Epic | Role | Priority |
|----|------|------|----------|
| US-001 | Onboarding and Approval | Student | Must |
| US-002 | Onboarding and Approval | Parent / Guardian | Must |
| US-003 | Onboarding and Approval | Super Admin | Must |
| US-004 | Onboarding and Approval | Student | Must |
| US-005 | Onboarding and Approval | School Admin | Must |
| US-006 | Onboarding and Approval | Teacher | Must |
| US-007 | Onboarding and Approval | Guest / Visitor | Should |
| US-008 | Onboarding and Approval | Platform Moderator | Must |
| US-009 | Studio Build | Student | Must |
| US-010 | Studio Build | Student | Must |
| US-011 | Studio Build | Student | Must |
| US-012 | Studio Build | Student | Should |
| US-013 | Studio Build | Teacher | Must |
| US-014 | Studio Build | Student | Must |
| US-015 | Studio Build | Student | Must |
| US-016 | Studio Build | Student | Must |
| US-017 | Studio Build | Student | Must |
| US-018 | Studio Build | Teacher | Must |
| US-019 | Simulation | Student | Must |
| US-020 | Simulation | Student | Must |
| US-021 | Simulation | Student | Should |
| US-022 | Simulation | Student | Must |
| US-023 | Simulation | Student | Should |
| US-024 | Simulation | Teacher | Should |
| US-025 | Simulation | Student | Must |
| US-026 | Simulation | Student | Must |
| US-027 | Coding | Student | Must |
| US-028 | Coding | Student | Must |
| US-029 | Coding | Student (primary) | Must |
| US-030 | Coding | Student | Must |
| US-031 | Coding | Student | Should |
| US-032 | Coding | Student | Must |
| US-033 | Coding | Student | Must |
| US-034 | Coding | Teacher | Should |
| US-035 | Coding | Student | Should |
| US-036 | Learning | Student | Must |
| US-037 | Learning | Student | Must |
| US-038 | Learning | Student | Must |
| US-039 | Learning | Teacher | Must |
| US-040 | Learning | Teacher | Should |
| US-041 | Learning | Teacher | Must |
| US-042 | Learning | Student | Must |
| US-043 | Learning | School Admin | Must |
| US-044 | Learning | Teacher | Should |
| US-045 | Teams and Competitions | Student | Must |
| US-046 | Teams and Competitions | Student (Captain) | Must |
| US-047 | Teams and Competitions | Teacher | Must |
| US-048 | Teams and Competitions | Student | Must |
| US-049 | Teams and Competitions | Student | Should |
| US-050 | Teams and Competitions | Teacher | Must |
| US-051 | Teams and Competitions | School Admin | Should |
| US-052 | Teams and Competitions | Student | Should |
| US-053 | Gamification | Student | Must |
| US-054 | Gamification | Student | Must |
| US-055 | Gamification | Student | Should |
| US-056 | Gamification | Student | Should |
| US-057 | Gamification | Student | Should |
| US-058 | Gamification | Student | Must |
| US-059 | Gamification | Teacher | Must |
| US-060 | Gamification | School Admin | Should |
| US-061 | Safety and Communication | Student | Must |
| US-062 | Safety and Communication | Teacher | Must |
| US-063 | Safety and Communication | Platform Moderator | Must |
| US-064 | Safety and Communication | Student | Must |
| US-065 | Safety and Communication | Parent / Guardian | Should |
| US-066 | Safety and Communication | Super Admin | Must |
| US-067 | Safety and Communication | Student | Must |
| US-068 | Safety and Communication | Teacher | Must |
| US-069 | Administration | Super Admin | Must |
| US-070 | Administration | Super Admin | Must |
| US-071 | Administration | School Admin | Must |
| US-072 | Administration | School Admin | Must |
| US-073 | Administration | Super Admin | Must |
| US-074 | Administration | School Admin | Should |
| US-075 | Administration | Super Admin | Should |
| US-076 | Administration | School Admin | Should |
| US-077 | White-Labelling | School Admin | Must |
| US-078 | White-Labelling | School Admin | Must |
| US-079 | White-Labelling | School Admin | Must |
| US-080 | White-Labelling | School Admin | Should |
| US-081 | White-Labelling | School Admin | Should |
| US-082 | White-Labelling | Super Admin | Must |
| US-083 | Coding | Student | Must |
| US-084 | Coding | Teacher / Platform Admin | Should |
