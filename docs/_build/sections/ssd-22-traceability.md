# Requirements Traceability and Verification

## Overview

This section defines the requirements traceability framework and the verification and
validation (V&V) strategy for RoboCode.Africa. It establishes how every user-facing need
documented in the User Requirements Document (URD) is traced forward to one or more
functional, non-functional, security, or data requirements in this System Specification
Document (SSD), and how each of those requirements is demonstrated to be satisfied before
the platform is released to production.

Traceability is maintained as a living artefact throughout the development lifecycle. The
authoritative source of truth is the requirement traceability matrix (RTM) maintained in
the project issue-tracking system; the representative extract in this section provides the
formal record for audit and certification purposes.

---

## Traceability Approach

### Scope and Terminology

| Term | Definition |
|------|------------|
| URD | User Requirements Document — the complete set of user needs, use cases, and user stories authored from stakeholder input. |
| SSD | System Specification Document — this document; contains all FR-*, NFR-*, SR-*, DR-*, and IR-* identifiers. |
| RTM | Requirements Traceability Matrix — the mapping table linking URD artefacts to SSD requirements and to verification evidence. |
| Verification | Objective confirmation that a specified requirement has been met by the implemented system. |
| Validation | Confirmation that the built system satisfies stakeholder needs under realistic operating conditions. |
| Test (T) | Execution of a repeatable test case against the running system to produce pass/fail evidence. |
| Inspection (I) | Formal review of an artefact (code, configuration, document, schema) against the requirement without execution. |
| Demonstration (D) | Operational walk-through of the system by a qualified observer to confirm visible behaviour. |
| Analysis (A) | Mathematical, statistical, or model-based reasoning to confirm a requirement is satisfied. |

### Traceability Chain

Requirements flow through three linked layers. Every item at a higher layer must be
covered by at least one item at the layer below.

```
TRACEABILITY CHAIN
══════════════════════════════════════════════════════════════
Layer 1 — User Needs (URD)
  UR-<AREA>-nnn  User requirements
  UC-nnn         Use cases
  US-nnn         User stories
        │
        │  (refined into)
        ▼
Layer 2 — System Specification (SSD)
  FR-<MODULE>-nnn  Functional requirements
  NFR-<CAT>-nnn    Non-functional requirements
  SR-nnn           Security requirements
  DR-nnn           Data requirements
  IR-nnn           Interface requirements
        │
        │  (verified by)
        ▼
Layer 3 — Verification Evidence
  Test case IDs (TC-nnn) in the test management system
  Inspection records (IN-nnn)
  UAT sign-off records (UAT-nnn)
  Security assessment reports (SEC-nnn)
══════════════════════════════════════════════════════════════
```

### Coverage Rules

1. Every UR-*, UC-*, and US-* item shall trace to at least one SSD requirement.
2. Every SSD requirement shall trace to at least one verification method and, where the
   requirement is Must-priority, at least one automated test case.
3. Orphaned requirements (no trace in either direction) are treated as defects and raised
   against the relevant module owner before a release gate may be passed.
4. SSD requirements that have no corresponding URD item are marked as **Derived** in the
   RTM; they arise from architectural decisions, regulatory mandates, or safety controls.

---

## Requirements Traceability Matrix

The following tables present a representative, structured extract of the RTM, grouped by
functional area. Each cited SSD identifier corresponds to a requirement actually defined in
the referenced functional section (RoboCode Studio = FR-STU; Simulation Engine = FR-SIM;
Code = FR-CODE; Auth = FR-AUTH; Tenancy = FR-TEN; Learning = FR-LRN; Teams = FR-TEAM;
Gamification = FR-GAM; Communication = FR-COMM; Moderation = FR-MOD; Administration =
FR-ADM; and NFR categories PERF, SCAL, REL, MAINT, PORT, COMP, plus INF/LOG/AUD in the
observability and infrastructure sections). Verification method codes: **T** = Test,
**I** = Inspection, **D** = Demonstration, **A** = Analysis. The full row-by-row trace is
maintained in the project issue-tracking RTM; the extract here is the formal audit record.

### Identity, Authentication and Authorization (FR-AUTH)

| URD Reference | SSD Requirement | Priority | Verification |
|---------------|----------------|----------|--------------|
| UR-AUTH-001, UC-004, US-001 | FR-AUTH-001 — Direct student self-registration form on `robocode.africa`. | Must | T, D |
| UR-AUTH-002, UC-004 | FR-AUTH-002 — Tenant-scoped registration form auto-binds account to resolving tenant. | Must | T |
| UR-ONB-002, UC-005, US-002 | FR-AUTH-005 — Minor detection (COPPA <13, GDPR-K <16) gates activation on verifiable parental consent. | Must | T, I |
| UR-ONB-002, UC-005 | FR-AUTH-020 through FR-AUTH-027 — Parental consent capture, token, storage, re-consent. | Must | T, I |
| UR-ONB-003, UC-006, US-003 | FR-AUTH-030 — Super Admin / Platform Moderator approval queue for direct signups. | Must | T, D |
| UR-AUTH-005 | FR-AUTH-010 through FR-AUTH-013 — Email verification with signed token, TTL, and resend limits. | Must | T |
| UR-AUTH-010, US-004 | FR-AUTH-002 — School tenant registration auto-routes to School Admin approval queue. | Must | T |
| UR-AUTH-020 | FR-AUTH-050 to FR-AUTH-053 — OAuth2/OIDC SSO with Google Workspace and Microsoft Entra for school staff. | Must | T, D |
| UR-AUTH-025 | FR-AUTH-060 to FR-AUTH-064 — TOTP-based MFA mandatory for Teacher, School Admin, Platform Moderator, and Super Admin. | Must | T, I |
| UR-AUTH-030 | FR-AUTH-100 to FR-AUTH-109 — RBAC: seven-role model enforced at API gateway and service layer. | Must | T, I |
| UR-ONB-002 | FR-AUTH-045, FR-AUTH-046 — Parent / Guardian read-only progress surface and data-subject-request initiation. | Should | T, D |
| UC-006 | FR-AUTH-090 to FR-AUTH-094 — Rate limiting and account lockout on auth endpoints (login, resend, consent). | Must | T, A |
| Derived (GDPR Art. 17) | FR-AUTH-024 — PII purge within 30 days on guardian consent decline. | Must | T, I |

### Multi-Tenancy, Custom Domains and White-Labelling (FR-TEN)

| URD Reference | SSD Requirement | Priority | Verification |
|---------------|----------------|----------|--------------|
| UR-SCH-001, UC-001, US-004 | FR-TEN-001 to FR-TEN-006 — Tenant provisioning on school registration approval: RLS partition, subdomain, slug. | Must | T, I |
| UR-SCH-002, UC-002 | FR-TEN-020 to FR-TEN-026 — Custom-domain connection with DNS (CNAME/TXT) verification. | Must | T, D |
| UR-SCH-002 | FR-TEN-030 to FR-TEN-035 — Automated ACME/Let's Encrypt TLS issuance for custom domains. | Must | T, D |
| UR-SCH-003, UC-003 | FR-TEN-050 to FR-TEN-060 — White-label branding: per-tenant design tokens (logo, colours, font), draft/publish. | Should | D, I |
| UR-SCH-005 | FR-TEN-042, FR-AUTH-102 — Tenant data isolation: tenant-sensitive queries enforced by Postgres RLS; no cross-tenant leakage. | Must | T, I, A |
| UR-SCH-006, UC-016 | FR-ADM-100, FR-ADM-102 — School Admin seat/quota management and student capability restriction. | Must | T |
| UR-SCH-007 | FR-TEN-033, FR-TEN-034 — Automated TLS renewal at least 30 days before expiry; alert on failure. | Must | T, A |
| Derived (security) | FR-TEN-040, FR-TEN-041 — Host-to-tenant resolution middleware attaches `tenant_id` before any downstream query. | Must | I, T |

### RoboCode Studio IDE (FR-STU), Simulation Engine (FR-SIM), Code (FR-CODE)

| URD Reference | SSD Requirement | Priority | Verification |
|---------------|----------------|----------|--------------|
| UR-SIM-001, UC-008 | FR-STU-030 — Component drag-and-drop placement on canvas (Arduino UNO R3, ESP32, and Raspberry Pi Pico); extensible wokwi-boards library allows platform admins and approved users to upload custom board definitions. | Must | D, T |
| UR-SIM-002 | FR-STU-033, FR-STU-050 to FR-STU-054 — Full/half breadboard model and electrical node graph (netlist). | Must | T, A |
| UR-SIM-003 | FR-STU-060 to FR-STU-068 — Jumper-wire creation and routing; FR-STU-070 to FR-STU-080 connection validation (short-circuit / floating-input DRC). | Must | T, A |
| UR-SIM-004, UC-008 | FR-STU-090 — 2D rendering via wokwi-elements; FR-STU-104 graceful 3D→2D fallback on low-end devices. | Must | T, D |
| UR-SIM-005 | FR-STU-100 to FR-STU-105 — 3D rendering via Three.js / React Three Fiber / drei on WebGL2-capable devices. | Should | D |
| UR-SIM-006 | FR-SIM-050 — Real-time pin-state bus exposing digital HIGH/LOW, analog voltage, PWM duty, and I2C/SPI/UART frames. | Must | T, A |
| UR-SIM-007 | FR-SIM-040 to FR-SIM-044 — Simulation lifecycle: run, pause, step (FR-SIM-034), resume, reset. | Must | T, D |
| UR-SIM-001 | FR-SIM-001 — RSE accepts the canonical circuit descriptor as the authoritative source of circuit topology. | Must | T, I |
| UR-CODE-001, UC-008, US-001 | FR-CODE-001 to FR-CODE-006 — Monaco editor hosting Arduino C/C++, MicroPython, and CircuitPython (plus C/C++ via Pico SDK for RP2040 targets) with highlighting and live diagnostics. | Must | T, D |
| UR-CODE-002 | FR-CODE-010 to FR-CODE-015 — Block-based editor for primary-school learners; transpiles to Arduino C/C++. | Must | D, T |
| UR-CODE-003, UC-015 | FR-CODE-030 to FR-CODE-035 (lint/diagnostics) and FR-CODE-040 to FR-CODE-044 (autocomplete for component/library APIs). | Should | T, D |
| UR-CODE-010 | FR-CODE-060 to FR-CODE-064 — Accurate execution path: WASM toolchain / compile microservice → firmware → avr8js (AVR targets), rp2040js (RP2040 targets), or ESP32 core (ESP32 targets). | Must | T, A |
| UR-CODE-011 | FR-CODE-065 to FR-CODE-067 — Simplified execution path: RVM interprets/translates code to pin-state instructions. | Must | T |
| UR-SIM-001, UR-CODE-010 | FR-SIM-025 to FR-SIM-028 — Raspberry Pi Pico (RP2040) simulation via rp2040js: loads UF2/ELF firmware image, exposes dual-core ARM Cortex-M0+ execution, GPIO/ADC/PWM/PIO pin-state bus, UART/I2C/SPI frames, and USB 1.1 to the RSE. Supported languages: MicroPython, CircuitPython, C/C++ (Arduino-Pico core / Pico SDK). | Must | T, A |
| Derived (extensibility) | FR-STU-031, FR-STU-032 — Custom board definitions in wokwi-boards manifest format (board.json + SVG) uploadable by platform admins and approved users; validated against JSON schema, pin sanity, and SVG safety; non-admin uploads pass the moderation workflow before becoming available to learners; each manifest binds to an MCU core target (avr8js / rp2040js / ESP32 core). | Should | T, I |
| UR-CODE-015 | FR-CODE-120, FR-CODE-121, FR-SIM-090 to FR-SIM-095 — Serial Monitor rendering UART output at correct baud with timestamp. | Must | T |
| UR-CODE-020 | FR-CODE-100 to FR-CODE-103 — Project save (auto-save), version history (last 50 snapshots), and restore. | Must | T, I |
| UR-CODE-025, UC-014 | FR-CODE-107, FR-STU-120 to FR-STU-127 — Collaborative multi-user editing via Yjs CRDT with cursor/selection display. | Should | T, D |

### RoboCode Simulation Engine — Component Fidelity (FR-SIM)

| URD Reference | SSD Requirement | Priority | Verification |
|---------------|----------------|----------|--------------|
| UR-SIM-010, UC-008 | FR-SIM-058, FR-SIM-059, FR-SIM-065 — LED (single, RGB, bar graph) correct state from digital/PWM output. | Must | T, A |
| UR-SIM-011 | FR-SIM-060 — 7-segment (1-digit, 4-digit / TM1637) correct digit and decimal-point display. | Must | T |
| UR-SIM-012 | FR-SIM-061 — 8×8 LED matrix (MAX7219) correct pixel map from SPI frames. | Should | T |
| UR-SIM-013 | FR-SIM-062 — 16×2 / 20×4 LCD (HD44780 + I2C backpack) character rendering and cursor control. | Must | T |
| UR-SIM-014 | FR-SIM-063 — OLED (SSD1306) pixel-level graphical rendering via simulated I2C. | Must | T |
| UR-SIM-015 | FR-SIM-064 — WS2812/NeoPixel strip and ring: correct colour-per-pixel from single-wire protocol. | Must | T |
| UR-SIM-020 | FR-SIM-073 — Push buttons, tactile switches, and tilt switches respond to simulated user interaction. | Must | T, D |
| UR-SIM-021 | FR-SIM-075 — HC-SR04 ultrasonic sensor: simulated distance settable by student via slider. | Must | T, D |
| UR-SIM-022 | FR-SIM-076 — DHT11/DHT22: simulated temperature and humidity values via slider; correct bit protocol. | Must | T, A |
| UR-SIM-023 | FR-SIM-079 — IR receiver and other specialised sensors via the Sensor Input API. | Should | T |
| UR-SIM-024 | FR-SIM-079 — PIR motion sensor: configurable trigger event via the Sensor Input API. | Should | T, D |
| UR-SIM-030 | FR-SIM-085 — Active and passive buzzers: WebAudio tone at correct frequency from pin state / tone(). | Must | T, D |
| UR-SIM-031 | FR-SIM-067, FR-SIM-068 — DC motor with L293D/L298N: rotation direction and speed from PWM duty. | Must | T, A |
| UR-SIM-032 | FR-SIM-066 — SG90 servo: angle visualised from PWM pulse width. | Must | T, A |
| UR-SIM-033 | FR-SIM-069 — 28BYJ-48 stepper with ULN2003: step-sequence visualisation. | Should | T |
| UR-SIM-040 | FR-SIM-074 — Potentiometer: analog voltage read by ADC pin matches slider position. | Must | T, A |
| UR-SIM-041 | FR-SIM-078 — LDR (photoresistor): simulated resistance varies with light-level slider. | Must | T |
| UR-SIM-042 | FR-SIM-079 — MPU6050: simulated accelerometer/gyro values via 3-axis input panel. | Should | T, A |
| UR-SIM-060 | FR-SIM-100 to FR-SIM-104 — Logic Analyzer / Pin State Inspector waveform capture and display. | Must | T |
| UR-SIM-090 | FR-SIM-200 to FR-SIM-212 — Full component catalogue simulated; manifest schema, DRC, and accessibility of controls. | Must | T, I |

### Learning Management and Content (FR-LRN)

| URD Reference | SSD Requirement | Priority | Verification |
|---------------|----------------|----------|--------------|
| UR-LRN-001, UC-010 | FR-LRN-070 to FR-LRN-074, FR-LRN-100 — Teacher can create five task types and publish/assign them to a class. | Must | T, D |
| UR-LRN-002, UC-011 | FR-LRN-104, FR-LRN-110 to FR-LRN-113 — Teacher review and grading interface with rubric scoring and feedback. | Must | T, D |
| UR-LRN-003, UC-015 | FR-LRN-010 to FR-LRN-016, FR-LRN-020 to FR-LRN-024 — Lesson authoring (content types, WYSIWYG, publishing). | Must | D |
| UR-LRN-004 | FR-LRN-001 to FR-LRN-003, FR-LRN-060, FR-LRN-061 — Global vs tenant content library with RLS scoping. | Should | T, I |
| UR-LRN-005 | FR-LRN-004 — Prerequisite enforcement (learning-path locks) with Teacher override. | Should | T |
| UR-LRN-006 | FR-LRN-080 to FR-LRN-089, FR-LRN-103 — Auto-Grader, submission tracking, and grade results. | Must | T, I |
| UR-LRN-007 | FR-CODE-090 to FR-CODE-099 — Guarded AI Hint Assistant: progressive hints without revealing the answer. | Could | T, D |
| UR-LRN-008 | FR-LRN-060, FR-LRN-064 — Curriculum alignment tagging (e.g., Zimbabwe ZIMSEC, South Africa CAPS) and mapping report. | Should | I |

### Teams, Competitions and Gamification (FR-TEAM / FR-GAM)

| URD Reference | SSD Requirement | Priority | Verification |
|---------------|----------------|----------|--------------|
| UR-TEAM-001, UC-012 | FR-TEAM-001 to FR-TEAM-007 — Student can create or join a team; teacher/admin sets team size limits. | Must | T, D |
| UR-TEAM-002, UC-014 | FR-TEAM-050 to FR-TEAM-066 — Real-time collaborative RoboCode Studio session shared across team members via Yjs CRDT. | Must | T, D |
| UR-TEAM-003, UC-012 | FR-TEAM-100 to FR-TEAM-108 — Competition creation by Super Admin or School Admin with dates, entry rules, scoring. | Must | T, D |
| UR-TEAM-004 | FR-TEAM-140 to FR-TEAM-142 — Submission scoring pipeline: automated checker runs against submitted project. | Should | T, A |
| UR-GAM-001, UC-013, US-013 | FR-GAM-200 to FR-GAM-205 — RoboPoints awarded on verified events; append-only ledger; teacher award/deduction. | Must | T, I |
| UR-GAM-002 | FR-GAM-250 to FR-GAM-257 — Leaderboards (class, school, global) backed by Redis sorted sets; near-real-time refresh. | Should | T, A |
| UR-GAM-003 | FR-GAM-230 to FR-GAM-236 — Badge / achievement system with unlockable criteria and minor-safe sharing controls. | Should | D, T |

### Communication, Notifications and Moderation (FR-COMM / FR-MOD)

| URD Reference | SSD Requirement | Priority | Verification |
|---------------|----------------|----------|--------------|
| UR-COMM-001 | FR-COMM-050, FR-COMM-051, FR-COMM-055, FR-COMM-066 — Transactional email/in-app notifications for account events, approvals, deadlines. | Must | T |
| UR-COMM-002 | FR-COMM-010, FR-COMM-020, FR-COMM-021, FR-COMM-030 to FR-COMM-034 — Supervised class/team channels; no unsupervised private messaging between minors. | Must | T, I |
| UR-COMM-003 | FR-MOD-020 to FR-MOD-024 (profanity), FR-MOD-030 to FR-MOD-033 (PII) — Filters applied to all student text before storage/display. | Must | T, I |
| UR-COMM-004 | FR-MOD-050 to FR-MOD-055 — Abuse reporting flow: any user may report content; reports enter the moderation queue. | Must | T, D |
| UR-COMM-005 | FR-MOD-045 to FR-MOD-049 — Moderator review of flagged content: approve / reject / escalate. | Must | T, D |
| UR-COMM-006 | FR-MOD-040 to FR-MOD-042 (grooming detection), FR-MOD-060 to FR-MOD-066 (safeguarding escalation to School Admin and safeguarding lead). | Must | T, I |
| UR-COMM-007 | FR-COMM-050, FR-COMM-060 — Optional SMS notification channel for low-connectivity regions (configurable per tenant). | Could | T |
| Derived (GDPR) | FR-COMM-120, FR-COMM-131, FR-MOD-013 — Immutable audit log of all moderation actions with actor, timestamp, and reason. | Must | I, T |

### Administration, Analytics and Reporting (FR-ADM)

| URD Reference | SSD Requirement | Priority | Verification |
|---------------|----------------|----------|--------------|
| UR-ADM-001, UC-016 | FR-ADM-080 to FR-ADM-087, FR-ADM-110 to FR-ADM-114 — School Admin student management and School Analytics dashboard. | Must | T, D |
| UR-ADM-002 | FR-ADM-001 to FR-ADM-007, FR-ADM-060 to FR-ADM-063, FR-ADM-070 — Super Admin tenant-management, system-health, and global analytics. | Must | T, D |
| UR-ADM-003 | FR-ADM-071, FR-ADM-073, FR-ADM-112, FR-ADM-114 — Exportable reports (CSV, PDF) scoped by tenant, class, date range, metric. | Should | T, D |
| UR-ADM-004 | FR-ADM-050 to FR-ADM-053 — Billing and plan management: seat counts, plan tiers, Paystack/Stripe/Flutterwave integration. | Must | T |
| UR-ADM-005 | DR-004, DR-012, FR-AUTH-082, FR-AUTH-083 — Data-retention enforcement: pseudonymisation/purge of inactive minor accounts (Authoritative Retention Schedule). | Must | T, I |
| UC-016 | FR-AUTH-083, FR-AUTH-046, NFR-COMP-003 — GDPR/POPIA/NDPR/COPPA data-subject request handling: export, rectification, erasure within 30-day SLA. | Must | T, D |
| UR-ADM-006 | FR-ADM-300 to FR-ADM-306 — Automated per-tenant custom-domain TLS onboarding (Infrastructure section). | Must | T, D |

### Non-Functional and Security Requirements

| URD Reference | SSD Requirement | Priority | Verification |
|---------------|----------------|----------|--------------|
| UR-NFR-001 | NFR-PERF-001 — Marketing-site page load (LCP) ≤ 2.5 s at the reference network/device config from an African PoP. | Must | A, T |
| UR-NFR-002 | NFR-PERF-020, NFR-PERF-022 — Simulation frame rate ≥ 30 fps and AVR clock floor on the reference device tiers. | Must | T, A |
| UR-NFR-003 | NFR-REL-001 — Platform availability ≥ 99.9 % monthly for authenticated access (NFR-REL-002 = 99.5 % marketing site). | Must | A |
| UR-NFR-004 | NFR-SCAL-003, NFR-SCAL-004 — Architecture supports 2,000 peak (5,000 design-point) concurrent simulation sessions. | Must | A, T |
| UR-NFR-005 | NFR-COMP-010 to NFR-COMP-012 — UI meets WCAG 2.2 AA across all critical user journeys. | Must | T, I |
| UR-NFR-006 | NFR-PORT-020, NFR-PORT-023, NFR-LBW-013 — Core Studio functional at 1 Mbps; scoped offline/PWA with edit-and-queue. | Should | T, A |
| Derived (OWASP) | SR-001, SR-SDLC-020, SR-SDLC-070, SR-VULN-030 — OWASP Top 10 mitigations verified by independent penetration test. | Must | I, T |
| Derived (COPPA) | SR-SAFE-011, SR-PRIV-011, FR-AUTH-023 — Verifiable parental consent stored immutably; no minor data used for advertising. | Must | I |
| Derived (GDPR) | SR-ENC-020, SR-ENC-021, SR-ENC-010 — Encryption at rest (AES-256) for PII; TLS 1.2+ (1.3 preferred) in transit. | Must | I, A |
| Derived (child safety) | SR-LOG-010, SR-LOG-030, NFR-AUD-003, DR-005 — Audit log entries immutable; 7-year retention for safeguarding events. | Must | I, T |

---

## Coverage Summary

The table below quantifies the traceability coverage across requirement categories at the
time this specification is baselined. Coverage is computed as the proportion of URD items
with at least one bidirectional trace to an SSD requirement that has at least one
associated verification method.

```
REQUIREMENTS COVERAGE SUMMARY (Baseline)
═══════════════════════════════════════════════════════════════════
URD Area           URD Items   Traced to SSD   Coverage
───────────────────────────────────────────────────────────────────
ONB (Onboarding)       12           12           100 %
AUTH (Authentication)  18           18           100 %
SCH (School/Tenant)    14           14           100 %
STU (Student)          10           10           100 %
SIM (Simulation)       32           32           100 %
CODE (Code Editor)     16           16           100 %
LRN (Learning)         12           12           100 %
TEAM (Teams)            8            8           100 %
GAM (Gamification)      8            8           100 %
COMM (Communication)   10           10           100 %
ADM (Administration)   10           10           100 %
NFR (Non-functional)   14           14           100 %
Use Cases (UC)         16           16           100 %
User Stories (US)      40           40           100 %
───────────────────────────────────────────────────────────────────
TOTAL                 220          220           100 %
═══════════════════════════════════════════════════════════════════
Note: Derived requirements (no URD parent) are tracked separately in
      the issue-tracking RTM and are not included in this count.
```

Any coverage gap discovered during development must be resolved before the affected
module may enter the integration test phase. The RTM is updated on every sprint release;
the coverage summary above is regenerated automatically by the CI/CD pipeline and
attached to each release artefact.

---

## Verification and Validation Strategy

### Verification Levels

The platform employs a four-level verification pyramid consistent with ISO/IEC/IEEE 29148
and IEEE 830 principles:

```
VERIFICATION PYRAMID
                       ▲
                      /│\
                     / │ \
                    / UAT \      ← Pilot-school acceptance testing
                   /───────\
                  / System  \    ← End-to-end + security + accessibility
                 /───────────\
                / Integration \  ← Service-to-service + simulation accuracy
               /───────────────\
              /    Unit Tests    \  ← Component and function level
             /─────────────────────\
```

### Unit Testing

**Scope:** Individual functions, classes, React components, and RSE sub-modules.

**Tooling:** Jest + React Testing Library (client); Jest + NestJS Testing utilities (server). Simulation unit tests use pre-compiled firmware ELF/UF2 binaries produced by the CI pipeline and run against the appropriate simulator core (avr8js for AVR targets, rp2040js for RP2040 targets, ESP32 core for ESP32 targets).

| Area | Focus | Minimum Coverage Target |
|------|-------|------------------------|
| Auth module | Registration state machine, token generation, consent record creation | 90 % branch |
| Tenant module | Slug generation, RLS policy application, domain resolver | 90 % branch |
| RSE component models | Each sensor/actuator behavioural model | 85 % branch |
| RVM interpreter | Instruction set for each supported command | 90 % branch |
| FR-CODE build pipeline | Compiler integration, firmware load into avr8js / rp2040js / ESP32 core, error propagation | 85 % branch |
| FR-GAM points engine | RoboPoints award logic, leaderboard update | 90 % branch |
| FR-MOD filter | Profanity and PII detection per supported language | 90 % statement |

### Integration Testing

**Scope:** Interactions between microservices and between the browser client and the backend
API. Covers the full request path from API gateway through service layer to database and
back.

**Tooling:** Supertest for REST/GraphQL endpoints; Playwright component tests for Studio
integration; custom WebSocket harness for collaborative-editing (Yjs) sessions.

Key integration test suites:

- **Auth-to-Tenant flow:** registration → email verification → parental consent → admin
  approval → ACTIVE account, verified against Postgres account state and audit log.
- **Host-to-tenant resolution:** HTTP request with subdomain and custom-domain headers
  resolves to correct `tenant_id` and RLS context; cross-tenant query returns empty result
  set, not a 403, confirming data invisibility.
- **Code-to-simulation pipeline:** a reference set of firmware sketches (covering all
  Must-priority components across all three first-class boards) is compiled by the WASM
  toolchain and loaded into the appropriate simulator core — avr8js for Arduino UNO R3
  (AVR) targets, rp2040js for Raspberry Pi Pico (RP2040) targets, and the ESP32 core for
  ESP32 targets — and pin states are asserted against reference output vectors within
  50 ms of simulation start.
- **Yjs CRDT collaboration:** two simulated browser sessions edit the same project
  concurrently; final merged state is deterministic and matches expected conflict-resolution
  output.
- **RoboPoints award pipeline:** task-completion event from LRN service → GAM service →
  Redis leaderboard update → WebSocket push to client, verified end-to-end.

### Simulation Accuracy Testing

The RSE requires its own dedicated accuracy test suite because behavioural correctness of
component models is a core product promise and is not fully covered by standard software
tests.

**Methodology:** Each component under test is exercised by a reference firmware sketch that
produces a known, deterministic sequence of pin-state transitions. The RSE output is
compared against the expected sequence (derived from the component datasheet and validated
against the physical Wokwi simulator where feasible).

```
SIMULATION ACCURACY TEST PROTOCOL
═════════════════════════════════════════════════════════════════
Step 1 — Reference firmware authoring
  Each Must-priority component: one reference sketch per
  applicable board target, using the standard library for that
  component (Arduino C/C++ for UNO R3 / AVR; MicroPython or
  CircuitPython for Raspberry Pi Pico / RP2040; Arduino C/C++
  or IDF for ESP32).

Step 2 — Expected output capture
  Expected pin state / protocol frame sequences are defined
  manually and encoded as JSON test vectors.

Step 3 — RSE execution
  Reference firmware compiled (WASM toolchain) and loaded into
  the appropriate simulator core:
    - avr8js  for Arduino UNO R3 (ATmega328P / AVR) targets.
    - rp2040js for Raspberry Pi Pico (RP2040) targets.
    - ESP32 core for ESP32 DevKit targets.
  RSE executes for a fixed simulated duration (typically
  500 ms – 10 s of simulated time).

Step 4 — Assertion
  RSE pin-state log is compared to test vectors.
  Pass criteria:
    - Digital output: exact match.
    - Analog output: within ±2 % of expected voltage.
    - Timing (PWM, servo pulse width): within ±1 % of expected.
    - Protocol frames (I2C/SPI/UART): exact byte-sequence match.

Step 5 — Regression
  All accuracy tests run on every commit that touches the
  FR-SIM module, any component model file, or the avr8js /
  rp2040js / ESP32 core integration layer.
═════════════════════════════════════════════════════════════════
```

Minimum passing bar: 100 % of Must-priority components; 90 % of Should-priority
components before v1.0 release.

### End-to-End (E2E) Testing

**Tooling:** Playwright against a staging environment populated with representative seed
data covering all roles.

**Critical user-journey test cases (Must-complete before any release gate):**

| TC ID | Journey | Roles Exercised | Verification Method |
|-------|---------|-----------------|---------------------|
| TC-E2E-001 | Student registers, minor consent obtained, approved, logs in, opens Studio | Student, Parent, Super Admin | T |
| TC-E2E-002 | School Admin registers school, configures custom domain and branding, invites teacher | School Admin | T, D |
| TC-E2E-003 | Teacher creates class, assigns coding task, student submits, teacher grades | Teacher, Student | T |
| TC-E2E-004 | Student drags LED and resistor to canvas, wires to Arduino UNO R3, writes Blink sketch, runs simulation | Student | T, D |
| TC-E2E-005 | Student writes HC-SR04 ultrasonic distance sketch, simulation reads correct value from slider | Student | T, A |
| TC-E2E-006 | Team of two students collaborates in real time on shared project; conflict-free merge verified | Student | T |
| TC-E2E-007 | Student posts content with profanity; content is blocked and abuse flag is raised | Student, Platform Moderator | T |
| TC-E2E-008 | Super Admin runs data-subject erasure request; minor PII purged from all tables | Super Admin | T, I |
| TC-E2E-009 | Guest accesses limited demo; no account creation, no PII collected | Guest | T, I |
| TC-E2E-010 | School Admin bulk-imports 30 students via CSV; all valid rows enter pending-consent state | School Admin | T |
| TC-E2E-011 | Student selects Raspberry Pi Pico board, writes a MicroPython blink sketch, compiles to UF2, simulation runs via rp2040js and LED toggles at correct interval | Student | T, D |
| TC-E2E-012 | Platform admin uploads a custom wokwi-boards board definition (board.json + SVG); definition passes JSON schema / pin-sanity / SVG validation and becomes selectable in the Studio canvas | Platform Admin | T, I |

### Accessibility Testing

All critical user journeys must be verified against WCAG 2.2 AA (NFR-ACC-001). The
accessibility test process is:

1. **Automated scan:** Axe-core integrated into the Playwright E2E suite; run on every
   CI build. Zero critical or serious violations permitted at release gate.
2. **Keyboard-only walkthrough:** Each critical user journey in the E2E suite table above
   is executed using keyboard input only (no pointer device) by a QA engineer.
3. **Screen-reader test:** NVDA (Windows) and VoiceOver (macOS/iOS) walkthroughs of the
   registration flow, RoboCode Studio canvas interaction, and task submission.
4. **Colour-contrast audit:** Design tokens for all tenant themes are validated for a
   minimum contrast ratio of 4.5:1 (normal text) and 3:1 (large text / UI components)
   using a contrast-checking tool in the CI pipeline.
5. **Reduced-motion test:** Animations respect the `prefers-reduced-motion` media query;
   verified by disabling motion in OS settings and re-running E2E suite.

Accessibility defects are classified as severity 1 (critical) and block release if
unfixed, consistent with the WCAG 2.2 AA commitment.

### Security Testing

Security requirements (SR-*) are verified through a combination of automated scanning,
code inspection, and third-party penetration testing.

| Test Type | Scope | Trigger | Acceptance Criterion |
|-----------|-------|---------|----------------------|
| SAST (static) | All backend and frontend source | Every CI build | Zero high/critical findings unresolved |
| Dependency audit | npm/yarn lock files | Every CI build | Zero critical CVEs in production deps |
| DAST (dynamic) | Staging environment full API surface | Weekly scheduled + pre-release | Zero OWASP Top 10 findings |
| Penetration test | Full platform (black-box + grey-box) | Pre-v1.0 release; annually thereafter | All critical/high findings remediated before go-live |
| Multi-tenant isolation test | Cross-tenant data access attempts | Pre-release | Zero cross-tenant data returned |
| Consent bypass test | Attempt to activate minor account without consent record | Pre-release | Account remains in PENDING_CONSENT; 403 on all resource access |
| Audit log integrity | Attempt to modify or delete audit log entries | Inspection | Immutability confirmed via DB constraints and write-once bucket policy |

The penetration test report is a mandatory gate artefact for the v1.0 release (see
Release Acceptance Criteria below).

### User Acceptance Testing (UAT) with Pilot Schools

UAT is conducted with two pilot schools prior to the general availability (GA) release:
one primary school and one secondary/high school, each in a different African country to
validate cross-jurisdictional compliance.

**UAT Objectives:**

- Confirm that students of the target age groups can complete core workflows without
  developer assistance.
- Verify that School Admins and Teachers find the administration and teaching tools fit
  for purpose.
- Identify usability gaps, missing localisation, and connectivity issues under realistic
  African school network conditions (including shared Wi-Fi and mobile data).

**UAT Plan:**

```
UAT EXECUTION PLAN
══════════════════════════════════════════════════════════
Phase 1 — Environment setup (2 weeks before UAT start)
  - Provision pilot school tenants on staging environment.
  - Onboard School Admin and Teacher accounts.
  - Prepare structured UAT scripts aligned to TC-E2E-001
    through TC-E2E-012.

Phase 2 — School Admin and Teacher pre-testing (2 days)
  - School Admin configures branding, creates classes,
    imports students (CSV).
  - Teacher creates and assigns tasks; reviews dummy
    student submissions.

Phase 3 — Student sessions (3 days, 1–2 sessions/day)
  - Students complete assigned tasks in RoboCode Studio.
  - Observers record SUS (System Usability Scale) scores,
    task completion rates, and error incidents.

Phase 4 — Guardian consent dry run (1 day)
  - Simulate minor registration and parental-consent flow
    with school staff playing guardian roles.

Phase 5 — Defect triage and fix (1 week)
  - Critical and high-severity UAT defects fixed.
  - Regression suite re-run.

Phase 6 — UAT sign-off
  - School Admin and Teacher sign UAT-001 acceptance record.
  - Super Admin reviews compliance checklist and signs
    UAT-002 safeguarding acceptance record.
══════════════════════════════════════════════════════════
```

**UAT Acceptance Threshold:**

- SUS score ≥ 70 (Good) across student, teacher, and School Admin cohorts.
- Task completion rate ≥ 85 % for all Must-priority journeys without facilitator
  intervention.
- Zero critical or high child-safety defects open at sign-off.
- Zero data-protection compliance defects open at sign-off.

---

## Release Acceptance Criteria

A production release of RoboCode.Africa may proceed only when all of the following gates
are passed. Gates are evaluated in order; failure at any gate blocks the release.

| Gate | Criterion | Evidence Required |
|------|-----------|-------------------|
| G-01 | All Must-priority SSD requirements implemented and traced in the RTM | RTM coverage report (100 % Must) |
| G-02 | Unit test suite passes; branch coverage ≥ 85 % across all modules | CI pipeline green; coverage report |
| G-03 | Integration test suite passes with zero failures | CI pipeline green |
| G-04 | Simulation accuracy tests pass for 100 % Must-priority components | Accuracy test report |
| G-05 | All TC-E2E-001 through TC-E2E-012 pass on staging environment (includes Raspberry Pi Pico rp2040js simulation and custom wokwi-boards upload journeys) | Playwright report |
| G-06 | Axe-core accessibility scan: zero critical/serious violations | Axe CI report |
| G-07 | Keyboard-only and screen-reader walkthroughs pass for Must journeys | QA sign-off record |
| G-08 | SAST and dependency audit: zero critical/high unresolved findings | Security tool reports |
| G-09 | DAST scan: zero OWASP Top 10 findings on staging | DAST report |
| G-10 | Third-party penetration test: all critical/high findings remediated | Pen test report + remediation evidence |
| G-11 | Multi-tenant isolation test: zero cross-tenant data returned | Isolation test report |
| G-12 | Consent-bypass test passes (minor cannot activate without consent) | Security test report |
| G-13 | UAT sign-off received from both pilot schools (UAT-001 and UAT-002) | Signed UAT acceptance records |
| G-14 | Data-protection legal review completed (COPPA, GDPR-K, POPIA, NDPR, Kenya DPA, Zimbabwe Cyber Act) | Legal counsel sign-off |
| G-15 | No open Severity-1 or Severity-2 defects in the issue tracker | Defect dashboard screenshot at gate review |

The release gate review is chaired by the Engineering Lead and attended by the Product
Owner, QA Lead, Security Lead, and one School Admin representative from a pilot school.
The outcome (Pass / Conditional Pass / Fail) and any deferred items are recorded in the
release gate document, which becomes part of the immutable project audit trail.

---

## Traceability Maintenance

The RTM is a living document maintained throughout the product lifecycle.

- **On every sprint start:** New or revised requirements are added to the RTM with status
  `In Development`; verification artefacts are linked when available.
- **On every sprint end:** Completed requirements are marked `Implemented — Unverified`;
  test cases are linked and marked `Verification Pending`.
- **On CI green:** Automated test results are ingested by the RTM tool; passing
  requirements advance to `Verified`.
- **On release:** The RTM snapshot is exported and archived alongside the release artefact.
- **On post-release change:** Any change to a requirement triggers a re-verification
  assessment; impacted test cases are re-executed before the patch or minor version is
  deployed.

Orphaned requirements (no SSD link) and dangling traces (SSD requirement with no test
case) are automatically flagged by the CI pipeline and reported as RTM hygiene defects
assigned to the module owner within one business day.
