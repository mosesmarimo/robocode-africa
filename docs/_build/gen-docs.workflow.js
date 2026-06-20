export const meta = {
  name: 'robocode-docs',
  description: 'Author the RoboCode.Africa User Requirements Document and System Specification Document section-by-section, QA, and repair',
  phases: [
    { title: 'Author sections', detail: '45 agents, one per document section, each writes a markdown file' },
    { title: 'Review', detail: 'one QA critic per document finds gaps and inconsistencies' },
    { title: 'Repair', detail: 'one writer per document fixes the critic findings' },
  ],
}

// ---------------------------------------------------------------------------
// Authoritative project canon. Injected into every agent so all sections agree
// on naming, roles, tech stack, requirement-ID scheme, component catalog, and
// the child-safety legal set.
// ---------------------------------------------------------------------------
const CANON = [
  'PROJECT CANON (authoritative single source of truth - obey exactly):',
  '',
  'PRODUCT: RoboCode.Africa - a browser-based platform that teaches primary and high school students Robotics, Coding and AI. Its centrepiece is RoboCode Studio, a Wokwi-style web IDE with an interactive 2D/3D electronics simulator for the Arduino UNO R3, ESP32 and Raspberry Pi Pico (RP2040) development boards, a breadboard, jumper wires, and the full catalogue of sensors/components found in a typical robotics starter kit. Students drag components onto a canvas, wire them through a breadboard, write code in a separate editor tab, and the platform translates/executes that code on the simulator to drive LEDs, LCDs, buzzers, motors, sensors, etc. RoboCode Studio reuses the open-source Wokwi components and libraries (github.com/wokwi: wokwi-elements web components, avr8js AVR/ATmega328P simulator, rp2040js Raspberry Pi Pico / RP2040 simulator, and related libraries).',
  '',
  'KEY NAMES (use these consistently):',
  '- Platform: RoboCode.Africa. Main public domain: robocode.africa.',
  '- The IDE / simulator workspace: RoboCode Studio.',
  '- The simulation engine: RoboCode Simulation Engine (RSE).',
  '- The code translation/execution layer: RoboCode Virtual Machine (RVM) for simplified/interpreted mode; an accurate compiled path runs real firmware on avr8js (UNO) and an ESP32 core simulation.',
  '- Points currency: RoboPoints. Tenant = a School with its own subdomain (school.robocode.africa) and optional custom domain plus white-label branding.',
  '',
  'USER ROLES (RBAC):',
  '1. Super Admin - RoboCode.Africa platform administrator. Approves direct (main-domain) student signups, manages all tenants/schools, global content library, platform config, billing/plans, global moderation and safeguarding, system health.',
  '2. Platform Moderator - delegated by Super Admin for content/safety moderation and direct-signup approvals.',
  '3. School Admin (Tenant Admin) - configures the school subdomain/custom domain and branding, approves the school students, manages teachers and teams, sets school policies and seats, views school reports.',
  '4. Teacher / Educator - creates classes, authors/assigns coding tasks and robotics projects, reviews and grades student work, mentors teams.',
  '5. Student - builds projects in RoboCode Studio, writes code, completes tasks, joins/forms teams, earns RoboPoints. Sub-classes: primary-school student and high-school student.',
  '6. Parent / Guardian - provides verifiable consent for minors and may view a child progress summary.',
  '7. Guest / Visitor - marketing site and limited demo only.',
  '',
  'APPROVAL & SAFETY (safety-first is the prime directive):',
  '- EVERY student signup requires approval before the account is activated. Direct signups on robocode.africa are approved by a Super Admin/Platform Moderator. Signups via a school custom domain/subdomain are auto-assigned to that school (tenant) and approved by that School Admin.',
  '- Minors require verifiable parental/guardian consent before activation (COPPA under-13, GDPR-K under-16).',
  '- No open/unsupervised private messaging between minors. Communication is moderated and overseen by teachers/admins. Content moderation, profanity/PII filtering, abuse reporting, safeguarding escalation, and audit logging are mandatory.',
  '',
  'REQUIREMENT-ID SCHEME:',
  '- User Requirements Document (URD): user requirements UR-<AREA>-<nnn> (areas: ONB, AUTH, SCH, STU, SIM, CODE, LRN, TEAM, GAM, COMM, ADM, NFR). Use cases UC-<nnn>. User stories US-<nnn>.',
  '- System Specification Document (SSD): functional FR-<MODULE>-<nnn> (modules: AUTH, TEN, STU, SIM, CODE, LRN, TEAM, GAM, COMM, MOD, ADM); non-functional NFR-<CAT>-<nnn>; interface IR-<nnn>; data DR-<nnn>; security SR-<nnn>.',
  '- Priority uses MoSCoW: Must / Should / Could / Won-t (this release).',
  '',
  'TECHNOLOGY STACK (specified):',
  '- Client: React 18 + TypeScript; Next.js (App Router) for marketing site and app shell; RoboCode Studio as a rich SPA. State via Redux Toolkit/Zustand. UI via Tailwind CSS + Radix/shadcn (themable design tokens for white-label).',
  '- Simulator rendering: 2D via Wokwi wokwi-elements web components; 3D via Three.js + React Three Fiber + drei (WebGL2, progressive WebGPU). Canvas/wiring via custom SVG/Canvas layer. Graceful 3D->2D fallback on low-end devices.',
  '- Simulation core: Wokwi open-source - avr8js to run real compiled AVR firmware for the Arduino UNO (ATmega328P); rp2040js to run real RP2040 firmware for the Raspberry Pi Pico; an ESP32 core simulation for the ESP32; component behavioural models driven by pin states. WebAudio for buzzer/tone.',
  '- Board definitions: RoboCode Studio uses the Wokwi wokwi-boards definition format (github.com/wokwi/wokwi-boards) as the canonical board schema. Each board is described by a board manifest (board.json: pins with names/types/positions, plus an SVG visual) so the board catalogue is data-driven and EXTENSIBLE - platform admins (and advanced users, subject to approval) can add custom board definitions without code changes. The standard wokwi-boards library ships built in.',
  '- Code editor: Monaco editor. Languages: Arduino C/C++, MicroPython and CircuitPython (ESP32 and Raspberry Pi Pico), and a block-based mode for younger students that transpiles to text. Real-time syntax/lint diagnostics, autocomplete, component/library APIs.',
  '- Code execution: accurate path compiles the sketch to firmware (in-browser WASM toolchain or a compile microservice) and loads it into the MCU simulator; simplified path interprets/translates code into RVM instructions that drive component actions.',
  '- Backend: Node.js + NestJS microservices behind an API gateway; GraphQL + REST; realtime via WebSocket (Socket.IO) and Yjs CRDT for collaborative projects.',
  '- Data: PostgreSQL (multi-tenant, tenant_id + Row-Level Security), Redis (cache/sessions/queues/leaderboards), S3-compatible object storage (assets, 3D models, project files). Search via OpenSearch (optional).',
  '- Identity: OAuth2/OIDC, JWT, school SSO (Google/Microsoft), TOTP MFA for staff/admins.',
  '- Multi-tenancy: subdomain + custom-domain routing resolved to a tenant; isolation via Postgres RLS; automated TLS for custom domains via ACME/Let-s Encrypt with DNS (CNAME/TXT) verification.',
  '- Infrastructure: Docker + Kubernetes on cloud (AWS/GCP/Azure, including an Africa region such as af-south-1); CDN/edge (Cloudflare/CloudFront) for low-latency African delivery; CI/CD via GitHub Actions; IaC via Terraform.',
  '- Integrations: transactional email (SES/SendGrid), optional SMS for low-connectivity, payments suited to Africa (Stripe/Paystack/Flutterwave), DNS/ACME, school SSO IdPs.',
  '- Observability: OpenTelemetry, Prometheus/Grafana, Sentry, centralized structured logging.',
  '',
  'COMPONENT CATALOGUE to simulate (from the Keyestudio ESP32 Learning kit, the Robotlinking starter kit, and common robotics kits):',
  '- Boards: Arduino UNO R3 (ATmega328P), ESP32 DevKit (ESP-WROOM-32), Raspberry Pi Pico (RP2040, dual-core ARM Cortex-M0+, 26 GPIO, 3 ADC, 2 UART/SPI/I2C, 16 PWM, 8 PIO, 2 MB flash). Additional/custom boards (Arduino Nano/Mega, ESP32 variants, Pico W, etc.) are supported through the board-definition library.',
  '- Prototyping: full-size breadboard (830 tie-points), half breadboard, jumper wires (M-M, M-F, F-F), breadboard power-supply module (3.3V/5V), USB cable, battery holder.',
  '- LEDs/displays: single LEDs (red/green/blue/yellow), RGB LED (common anode/cathode), LED bar graph, 1-digit and 4-digit 7-segment, 8x8 LED matrix (MAX7219), 16x2 and 20x4 character LCD (HD44780 + I2C backpack), 0.96in OLED (SSD1306), WS2812/NeoPixel ring and strip.',
  '- Passives/discretes: resistors (220, 330, 1k, 10k ohm, etc.), rotary potentiometer, capacitors, diodes, NPN/PNP transistors, photoresistor (LDR), thermistor.',
  '- Input sensors: push buttons, tactile switches, tilt/ball switch, PIR motion (HC-SR501), ultrasonic distance (HC-SR04), IR receiver + remote, IR obstacle / line-tracking sensor, DHT11/DHT22 temperature-humidity, LM35 / DS18B20 temperature, MPU6050 accelerometer/gyro, sound/microphone sensor, water-level sensor, soil-moisture sensor, gas sensor (MQ-2), flame sensor, hall sensor, rotary encoder, analog joystick, 4x4 membrane keypad, RFID reader (RC522).',
  '- Actuators/output: active and passive buzzers, DC motors with L293D/L298N driver, SG90 servo, 28BYJ-48 stepper with ULN2003 driver, relay module, fan.',
  '- Comms/modules: HC-05/HC-06 Bluetooth, ESP32 Wi-Fi/BLE (on-board), nRF24L01, RTC (DS1307/DS3231), microSD card module, 74HC595 shift register.',
  '- Power: 9V battery, AA holder, 3.7V Li-ion, breadboard power module.',
  '',
  'CHILD-SAFETY / DATA-PROTECTION legal set to honour: COPPA (US), GDPR and GDPR-K (EU), Zimbabwe Cyber and Data Protection Act, South Africa POPIA, Nigeria NDPR, Kenya Data Protection Act, and the age-appropriate design code principles. Data minimisation for minors, no behavioural advertising, verifiable parental consent, full audit trails.',
  '',
  'STANDARDS: write in the style of ISO/IEC/IEEE 29148 (requirements engineering) and IEEE 830 (SRS), WCAG 2.2 AA for accessibility.',
].join('\n')

// Shared writing rules for every section author.
const RULES = [
  'WRITING RULES:',
  '- Produce professional, precise GitHub-flavoured markdown for an official engineering document.',
  '- The FIRST line of the file must be exactly: # SECTION_TITLE (the title given below), with a single leading hash.',
  '- Do NOT prepend manual numbers to any heading (numbering is applied automatically at assembly). Use ## and ### for subsections.',
  '- Be comprehensive, concrete and self-consistent with the canon. Prefer requirement tables. For requirement lists use a table with columns: ID | Requirement | Priority | Acceptance / Notes.',
  '- Diagrams must be labelled ASCII block diagrams inside fenced code blocks (three backticks), or tables. Never use mermaid, HTML, or image links.',
  '- Keep every table to at most 5 columns and wrap long cell text; never produce a table wider than 5 columns (it breaks PDF rendering).',
  '- Cross-reference other parts by their name and requirement ID, never by page number.',
  '- Use the exact role names, product names, requirement-ID prefixes and component names from the canon.',
  '- Target depth: thorough - typically 900 to 2500 words, more where the scope demands it.',
  '- Write only the section content. Do not add a document title page, global table of contents, or front-matter; those are added at assembly.',
].join('\n')

const BASE = '/Users/marimo/Dev/robocode/docs/_build/sections'

// ---------------------------------------------------------------------------
// Section definitions
// ---------------------------------------------------------------------------
const URD = [
  { n: '01', file: 'urd-01-introduction.md', title: 'Introduction', brief:
    'Purpose of this User Requirements Document; a one-paragraph product summary; scope (in-scope for v1.0 and out-of-scope/roadmap, noting the platform is browser-based with no physical hardware); intended audience; document conventions and how to read requirement IDs; pointer to the glossary; references (the two sample robotics-kit Alibaba listings, the Wokwi GitHub organisation, ISO/IEC/IEEE 29148, WCAG 2.2, and the child-safety/data-protection laws in the canon); and a Document Control table (Version 1.0, Date 19 June 2026, Author RoboCode.Africa Product Team, Status Draft for Review).' },
  { n: '02', file: 'urd-02-vision-goals.md', title: 'Product Vision, Goals and Objectives', brief:
    'Problem statement (cost and scarcity of physical robotics hardware in African schools, the need for safe online learning, teacher capacity); the RoboCode.Africa vision statement; primary goals with measurable objectives and KPIs; value propositions per stakeholder (student, teacher, school, parent, platform); guiding principles (safety-first, affordability, low-bandwidth, curriculum-aligned, gamified); high-level summary of platform capabilities.' },
  { n: '03', file: 'urd-03-stakeholders.md', title: 'Stakeholders and User Classes', brief:
    'Enumerate all stakeholders and user classes from the canon (Super Admin, Platform Moderator, School Admin, Teacher, Student [primary and high-school sub-classes], Parent/Guardian, Guest, plus external stakeholders: schools as organisations, RoboCode operations, content authors, regulators). For each user class give a description, key responsibilities, technical proficiency, expected frequency of use, environment/device context, and primary needs. Include a summary table.' },
  { n: '04', file: 'urd-04-personas.md', title: 'User Personas', brief:
    'Seven detailed personas spanning the user base: a 9-year-old primary student on a shared low-end device; a 15-year-old high-school maker; a competitive team captain (age 16); a secondary-school STEM teacher; a school admin / IT coordinator; a parent/guardian; and a RoboCode platform operations admin. Each persona: name, age/role, bio, goals, frustrations, device and bandwidth context, a representative quote, and how RoboCode.Africa helps them.' },
  { n: '05', file: 'urd-05-roles-permissions.md', title: 'User Roles and Permissions Matrix', brief:
    'Define each RBAC role from the canon and the concept of tenant scoping. Provide a permissions matrix table (rows = capability groups such as account management, signup approval, RoboCode Studio use, content authoring, teams, competitions, moderation, branding/domain config, billing, reporting; columns = the roles; cells = Yes / Conditional / No). Add notes on least-privilege, delegation, and how minors get restricted permissions.' },
  { n: '06', file: 'urd-06-onboarding-approval.md', title: 'User Requirements: Onboarding, Signup and Approval', brief:
    'User requirements (UR-ONB-nnn) for: school self-registration; student signup via the main domain (Super Admin approval) and via a school domain (auto-tenant assignment + School Admin approval); verifiable parental consent for minors; teacher invitation flow; email verification; bulk student import by schools; account states (pending, approved, suspended); waitlist/notification. Use a MoSCoW requirements table and describe the approval experience from each actor view.' },
  { n: '07', file: 'urd-07-auth-account.md', title: 'User Requirements: Authentication and Account Management', brief:
    'UR-AUTH-nnn for: login methods (email/username + password, school SSO), age-appropriate password policy, MFA for staff/admins, account recovery (with guardian/admin assist for minors), profile management, safe avatars, language and accessibility preferences, privacy settings, session management, and data export/account deletion rights. MoSCoW table.' },
  { n: '08', file: 'urd-08-school-whitelabel.md', title: 'User Requirements: School Onboarding, Custom Domain and White-Labelling', brief:
    'UR-SCH-nnn for a school to: create an organisation account; choose a subdomain (school.robocode.africa) and/or connect a custom domain with user-facing DNS verification steps and automatic TLS; upload branding (logo, colours, name, favicon) and customise landing/login pages; set policies (approval rules, allowed features, age groups); manage seats/licences; preview branding before publishing. MoSCoW table; describe the experience, referencing the technical detail to SSD section on multi-tenancy.' },
  { n: '09', file: 'urd-09-studio-canvas.md', title: 'User Requirements: RoboCode Studio Canvas, Components and Wiring', brief:
    'UR-STU-nnn for the visual builder: component palette with search/categories; drag-and-drop placement of board, breadboard and components; pin-to-pin jumper connections with snapping to breadboard tie-points; move/rotate/duplicate/delete; multi-select; undo/redo; zoom/pan; 2D and 3D view toggle; wire colour and labels; connection validation feedback in student-friendly language (wrong polarity, missing resistor, short circuit, unpowered); save/version/share projects; starter templates. MoSCoW table.' },
  { n: '10', file: 'urd-10-simulation.md', title: 'User Requirements: Simulation Experience', brief:
    'UR-SIM-nnn for running the simulation: run/pause/stop/reset; real-time visual/audible feedback (LED light, LCD/OLED text, servo movement, motor spin, buzzer tone); interactive sensor inputs (press buttons, turn potentiometer/joystick, set ultrasonic distance, set temperature/light/gas levels); serial monitor; speed control; inspect pin/logic states; near-real fidelity expectation; student-friendly runtime error messages. MoSCoW table.' },
  { n: '11', file: 'urd-11-code-editor.md', title: 'User Requirements: Code Editor and Programming', brief:
    'UR-CODE-nnn for the code window/tab: write code in Arduino C/C++ and MicroPython, plus a block-based mode for younger students; syntax highlighting, autocomplete, inline lint/error diagnostics, real-time syntax checking before run; component/library includes and templates; mapping code to simulator actions; worked examples and a help/documentation panel; a guarded AI hint assistant; save/version code with the project. MoSCoW table.' },
  { n: '12', file: 'urd-12-learning.md', title: 'User Requirements: Learning, Courses, Tasks and Assessment', brief:
    'UR-LRN-nnn for structured Robotics/Coding/AI tracks by level (primary, high school); lessons with text/video/interactive content; guided tutorials/projects; coding tasks and challenges auto-checked against expected simulation outcomes; quizzes and rubrics; teacher-assigned assignments with submission and grading; progress and mastery tracking; certificates/badges; curriculum alignment. MoSCoW table.' },
  { n: '13', file: 'urd-13-teams-competitions.md', title: 'User Requirements: Teams, Competitions and Collaboration', brief:
    'UR-TEAM-nnn for forming teams within a school, school teams competing inter-school, and individual participation; team roles (captain/member), invites and approvals; shared real-time team projects; competitions/tournaments created by teachers/school admins/super admins; challenge types (coding tasks, robotics simulator builds, AI tasks); submission, judging (auto + rubric), scoring, brackets/rounds, deadlines, and fair-play rules. MoSCoW table.' },
  { n: '14', file: 'urd-14-gamification.md', title: 'User Requirements: Gamification, RoboPoints and Leaderboards', brief:
    'UR-GAM-nnn for RoboPoints earning rules (tasks, projects, competitions, streaks); levels/XP; badges and achievements; leaderboards (individual, team, school; within-tenant and global; weekly and all-time); seasons and resets; rewards; anti-cheating/fairness; and privacy/visibility controls appropriate for minors. MoSCoW table.' },
  { n: '15', file: 'urd-15-comms-safety.md', title: 'User Requirements: Communication, Notifications and Safety', brief:
    'UR-COMM-nnn for safe, moderated communication (team chat/comments with teacher/admin oversight; no unsupervised minor private messaging); announcements; notifications (in-app, email, optional SMS); abuse reporting/flagging; content moderation queue; profanity/PII filtering; safeguarding escalation; and audit trails. Emphasise the safety-first prime directive. MoSCoW table.' },
  { n: '16', file: 'urd-16-administration.md', title: 'User Requirements: Administration and Reporting', brief:
    'UR-ADM-nnn split by tier. Super Admin: tenant management, global signup approvals, content library, moderation, platform config, billing/plans, system health, global reports. School Admin: student/teacher management, approvals, branding/domain (reference UR-SCH), teams, school analytics/reports, policy config, seats. Teacher: class management, assignments, grading, student progress, team mentoring, class reports. MoSCoW tables per tier.' },
  { n: '17', file: 'urd-17-use-cases.md', title: 'Use Cases', brief:
    'Twelve to sixteen detailed use cases (UC-nnn) each with: actor(s), preconditions, main success flow, alternate/exception flows, postconditions. Cover at least: school registers and configures its domain and branding; student signs up via a school domain and is approved; parent gives consent; student builds and simulates a Blink LED project; student builds an ultrasonic obstacle-avoiding robot with code; teacher creates and grades an assignment; team forms and enters a competition; super admin approves a direct signup and moderates flagged content; student earns RoboPoints and rises on the leaderboard; school admin white-labels the platform.' },
  { n: '18', file: 'urd-18-user-stories.md', title: 'User Stories and Acceptance Criteria', brief:
    'Epics mapped to user stories (US-nnn) in the form As a ROLE, I want GOAL, so that BENEFIT, each with Given/When/Then acceptance criteria. Group epics by Onboarding and Approval, Studio Build, Simulation, Coding, Learning, Teams and Competitions, Gamification, Safety and Communication, Administration, and White-Labelling. Provide several stories per epic.' },
  { n: '19', file: 'urd-19-journey-maps.md', title: 'User Journey Maps', brief:
    'Narrative plus staged journey-map tables (columns: Stage | Actions | Touchpoints | Emotions | Pain points | Opportunities) for: a school adopting RoboCode.Africa; a primary student building a first project; a high-school competitive team preparing for a tournament; a teacher onboarding a class.' },
  { n: '20', file: 'urd-20-nonfunctional-expectations.md', title: 'Non-Functional User Expectations', brief:
    'User-facing non-functional requirements (UR-NFR-nnn, MoSCoW) for usability (age-appropriate, intuitive, minimal text for young learners), accessibility (WCAG 2.2 AA, keyboard, screen reader, contrast, dyslexia-friendly, multilingual including African languages), performance on low-end devices and Chromebooks with 3D->2D fallback, low-bandwidth and offline expectations, availability/reliability, safety and privacy expectations, and supported devices/browsers.' },
  { n: '21', file: 'urd-21-assumptions-constraints.md', title: 'Assumptions, Dependencies and Constraints', brief:
    'Tables of assumptions (connectivity tiers, device classes, school IT capacity, parental reachability), dependencies (Wokwi open-source libraries, browser WebGL/WebAudio, third-party email/SMS/DNS/TLS/payment providers, school SSO), and constraints (must run in the browser with no physical hardware, child-safety legal obligations, budget, performance ceilings on low-end devices).' },
  { n: '22', file: 'urd-22-glossary.md', title: 'Glossary and Acronyms', brief:
    'An alphabetical glossary of domain terms and an acronym list with expansions. Include at least: ADC, AVR, BLE, COPPA, CRDT, CDN, ESP32, GDPR / GDPR-K, GPIO, I2C, IDE, LCD, LDR, LED, MFA, OIDC, OLED, PIR, POPIA, PWA, PWM, RBAC, RLS, RoboPoints, RSE, RVM, SPI, SSO, UART, WCAG, plus product-specific terms (RoboCode Studio, tenant/school, white-label, breadboard, jumper, netlist).' },
]

const SSD = [
  { n: '01', file: 'ssd-01-introduction.md', title: 'Introduction', brief:
    'Purpose and scope of this System Specification Document; product perspective; document conventions; intended audience; pointer to glossary; references and standards (ISO/IEC/IEEE 29148, IEEE 830, the two robotics-kit listings, the Wokwi GitHub organisation, WCAG 2.2, and the data-protection laws in the canon); relationship to the URD and the traceability approach; the requirement notation, MoSCoW priority scheme and ID conventions (FR/NFR/IR/DR/SR); and a Document Control table (Version 1.0, Date 19 June 2026, Author RoboCode.Africa Engineering, Status Draft for Review).' },
  { n: '02', file: 'ssd-02-overview-context.md', title: 'System Overview and Context', brief:
    'The product context within its ecosystem; the system boundary; primary actors and external systems (DNS registrars, ACME/Let-s Encrypt, email/SMS providers, payment gateway, school SSO IdPs, CDN, object storage, the bundled Wokwi libraries, the AI-assistant provider); a list of major subsystems each with a one-line purpose; an ASCII context diagram showing actors and external systems around the platform; the operating environment (browser client plus cloud backend); and a high-level data-flow description.' },
  { n: '03', file: 'ssd-03-architecture.md', title: 'System Architecture', brief:
    'Architectural goals and drivers (safety, multi-tenancy, client-heavy simulation, low-bandwidth, scale); the architectural style (SPA client + client-side simulation + service-oriented backend behind an API gateway); a logical layered view (presentation, API, domain services, data, integration) as ASCII; component decomposition listing each service (Studio client, RoboCode Simulation Engine [client-side], Identity, Tenant, Content/LMS, Teams/Competition, Gamification, Notification, Moderation, Reporting/Analytics, Media/Asset, API gateway); an ASCII deployment view (CDN/edge, Kubernetes, Postgres, Redis, object store, queue); the multi-tenant routing-and-isolation approach; the real-time architecture (WebSocket gateway, Yjs CRDT, simulation telemetry); and an architectural-decisions table.' },
  { n: '04', file: 'ssd-04-tech-stack.md', title: 'Technology Stack and Rationale', brief:
    'Enumerate the chosen technologies for every layer (client, 3D rendering, code editor, simulation core including avr8js and wokwi-elements, backend NestJS, GraphQL/REST API, realtime Socket.IO/Yjs, PostgreSQL/Redis, object storage, OIDC identity, Kubernetes/CDN infrastructure, CI/CD, observability) with a rationale and the main alternatives considered for each. Explain the client-vs-server responsibility split and why the simulation runs client-side. State browser/runtime requirements and the build/packaging approach. Use tables.' },
  { n: '05', file: 'ssd-05-fr-auth.md', title: 'Functional Requirements: Identity, Authentication and Authorization', brief:
    'FR-AUTH-nnn for registration; the multi-path approval workflow as a state machine (states and transitions table plus an ASCII state diagram for pending->under-review->approved/rejected->suspended, including parental-consent and tenant-vs-platform approval branches); email verification; parental-consent capture and verification; login (password, SSO/OIDC, optional magic link); TOTP MFA for staff/admins; password policy; session/JWT management; the RBAC model (roles, permissions, scopes, tenant scoping); account lifecycle; rate limiting/lockout; and auth audit logging. MoSCoW table.' },
  { n: '06', file: 'ssd-06-fr-multitenancy.md', title: 'Functional Requirements: Multi-Tenancy, Custom Domains and White-Labelling', brief:
    'FR-TEN-nnn for tenant provisioning; subdomain allocation; custom-domain connection with DNS (CNAME/TXT) verification; automated TLS issuance/renewal via ACME; the tenant-routing/resolution middleware (host -> tenant); per-tenant branding configuration (logo, colour tokens, copy, favicon, theme); themable UI; per-tenant feature flags and policies; tenant data isolation via Postgres RLS; tenant-admin delegation; white-label email (custom sender domain/DKIM); and tenant suspension/offboarding/export. Include an ASCII diagram of host -> tenant resolution and the TLS-provisioning flow. MoSCoW table.' },
  { n: '07', file: 'ssd-07-fr-studio.md', title: 'Functional Requirements: RoboCode Studio IDE', brief:
    'FR-STU-nnn for the project workspace; board selection from the board library (Arduino UNO, ESP32, Raspberry Pi Pico and additional/custom boards loaded from wokwi-boards definitions) and the custom-board-definition import flow; component palette/library loading; drag-drop placement; the breadboard model (power rails, rows, tie-points) and snapping; the pin/connection model building an electrical-node graph; jumper creation; connection validation rules (polarity, power rails, short detection, current/resistor advisories); 2D rendering via wokwi-elements and 3D via Three.js; transforms; undo/redo via a command stack; zoom/pan; multi-select/grouping; save/load/versioning/autosave; templates; sharing/embedding; real-time multi-user collaboration via Yjs with presence and locking; and import/export of a diagram.json-style document. MoSCoW table.' },
  { n: '08', file: 'ssd-08-fr-simulation.md', title: 'Functional Requirements: RoboCode Simulation Engine (RSE)', brief:
    'FR-SIM-nnn for the simulation core: building the electrical netlist from connections; the microcontroller execution model (real AVR firmware on avr8js for the UNO; real RP2040 firmware on rp2040js for the Raspberry Pi Pico; an ESP32 core simulation); a board-target abstraction that binds the active board definition (wokwi-boards format) to the appropriate MCU core; clocking/timing; emulation of GPIO/PWM/ADC/I2C/SPI/UART peripherals; component behavioural models driven by pin state; the sensor-input injection API for interactive controls; output rendering hooks (LED brightness, LCD/OLED framebuffer, servo angle, motor RPM, buzzer tone via WebAudio); the serial monitor stream; a logic analyzer/oscilloscope; the simulation lifecycle (load->run->pause->reset); deterministic stepping and speed control; the in-browser performance budget; runtime-error surfacing; and stated fidelity limits. Include an ASCII pipeline: code -> firmware/IR -> MCU core -> pin states -> component models -> render. MoSCoW table.' },
  { n: '09', file: 'ssd-09-fr-code.md', title: 'Functional Requirements: Code Authoring, Validation and Execution', brief:
    'FR-CODE-nnn for Monaco editor integration; supported languages (Arduino C/C++, MicroPython and CircuitPython for ESP32 and Raspberry Pi Pico, and a block-based mode that transpiles to text); syntax highlighting and semantic checks; real-time linting/diagnostics; autocomplete with component/library APIs; Wokwi-compatible library management (e.g. LiquidCrystal, Servo, NeoPixel-style); the build/translation pipeline (the accurate path compiling sketches to firmware via an in-browser WASM toolchain or compile microservice then loading into the matching MCU simulator - avr8js for UNO, rp2040js for the Pico including MicroPython/CircuitPython UF2 firmware images, ESP32 core for ESP32 - and the simplified RoboCode Virtual Machine path that interprets/translates code into simulator instructions); mapping of code I/O calls to component actions; pre-run validation; student-friendly runtime-error reporting; the guarded AI hint assistant; and code persistence/versioning. Clearly explain BOTH execution paths. MoSCoW table.' },
  { n: '10', file: 'ssd-10-component-library.md', title: 'Component and Sensor Library Specification', brief:
    'The full simulated catalogue. Provide category tables (Component | Part/Model | Pins/Interface | Simulated behaviour | Key parameters) covering boards, breadboard/jumpers, LEDs/displays, passives/discretes, input sensors, actuators, comms modules and power - using the exact catalogue in the canon. Give GPIO/pin summary tables for the Arduino UNO, the ESP32 and the Raspberry Pi Pico (RP2040). Define the component-model schema (id, 2D and 3D visual assets, pins[], electrical parameters, behaviour hooks, configurable properties, datasheet reference) and explain extensibility via a component manifest. Also specify the BOARD-definition model based on the Wokwi wokwi-boards format (board.json describing pins with names/types/positions plus an SVG visual), the built-in board library, and how platform admins or approved advanced users add CUSTOM board definitions without code changes. Keep tables to 5 columns. This is a large, thorough section.' },
  { n: '11', file: 'ssd-11-fr-learning.md', title: 'Functional Requirements: Learning Management and Content', brief:
    'FR-LRN-nnn for course/lesson/module data structures; content authoring and publishing workflow; content types (rich text, adaptive low-bandwidth video, interactive simulation embeds, quizzes); tasks/challenges with automated verification (asserting on simulation state, serial output, or expected wiring); rubrics and manual grading; assignments (teacher to class); submissions; progress and mastery tracking; prerequisites/learning paths; certificate and badge issuance; curriculum tagging and localisation. Describe the auto-grader architecture (running a student project in a headless simulation and asserting outcomes). MoSCoW table.' },
  { n: '12', file: 'ssd-12-fr-teams-gamification.md', title: 'Functional Requirements: Teams, Competitions and Gamification', brief:
    'FR-TEAM-nnn and FR-GAM-nnn for team CRUD within a tenant and cross-tenant school teams; membership/roles/invites/approvals; shared team projects; the competition/tournament engine (types, rounds/brackets, scheduling, deadlines, submission, judging pipeline combining auto-grading and manual rubric, scoring and tiebreakers, results publication); the RoboPoints engine (earning rules, ledger, idempotency, anti-abuse); levels and badges; the leaderboard service (Redis sorted sets, scopes individual/team/school, time windows, privacy for minors); and seasons/resets. MoSCoW table.' },
  { n: '13', file: 'ssd-13-fr-comms-moderation.md', title: 'Functional Requirements: Communication, Notifications and Moderation', brief:
    'FR-COMM-nnn and FR-MOD-nnn for the notification service (in-app/email/SMS channels, templates, preferences, batching, localisation); announcements/broadcast; moderated messaging and comments (pre/post moderation, no unsupervised minor DMs); moderation tooling (queue, profanity/PII/link filters, automated classifiers, human review, safeguarding escalation, reporting/flagging, blocklists); and audit/retention of communications for safety. MoSCoW table.' },
  { n: '14', file: 'ssd-14-fr-admin.md', title: 'Functional Requirements: Administration, Analytics and Reporting', brief:
    'FR-ADM-nnn for the super-admin console (tenant lifecycle, global approval queue, content library management, plan/billing, feature flags, system-health dashboards, global moderation); the school-admin console (user management, approvals, seats, branding/domain management, policy config, reports); the teacher console (class/assignment/grading/progress); the analytics and reporting service (engagement, learning outcomes, usage, competition statistics, exportable CSV/PDF, scheduled reports); and platform configuration and audit. MoSCoW table.' },
  { n: '15', file: 'ssd-15-data-architecture.md', title: 'Data Architecture and Database Design', brief:
    'Data-architecture overview; the multi-tenant data model (tenant_id + RLS); core entities and relationships (Tenant/School, User, Role, ConsentRecord, ApprovalRequest, Project, Diagram, CodeFile, ComponentLibraryItem, SimulationRun, Course, Lesson, Task, Submission, Grade, Team, Competition, Round/Match, Score, RoboPointLedger, Badge, LeaderboardEntry, Notification, ModerationCase, AuditLog, BrandingConfig, Domain, Plan/Subscription); an ASCII ERD; key table schemas (columns, types, keys) for the most important entities; indexing and performance; partitioning/sharding strategy; Redis caching usage; object-storage layout for assets/projects/3D models; and data retention/minimisation for child data, backup and archival. DR-nnn table.' },
  { n: '16', file: 'ssd-16-api-integrations.md', title: 'API Specification and Integration Interfaces', brief:
    'API design principles; authentication (OAuth2/JWT, scopes, tenant context via subdomain/header); a GraphQL schema overview and REST resource list; a representative endpoints table (Method | Path | Purpose | Roles) across auth, tenants, projects, simulation, content, teams, gamification and admin; WebSocket events (collaboration, simulation telemetry, notifications); webhooks/eventing; rate limiting, versioning and error format; and external integrations (DNS/ACME for custom domains, email/SMS, payment gateways suited to Africa such as Stripe/Paystack/Flutterwave, SSO/OIDC IdPs, CDN/object storage, the bundled Wokwi libraries with a licensing note, and the AI-assistant provider). IR-nnn table.' },
  { n: '17', file: 'ssd-17-nfr.md', title: 'Non-Functional Requirements', brief:
    'NFR-nnn with measurable targets and MoSCoW priority for: performance (page load and time-to-interactive on low-end devices, simulation real-time factor/frame rate, API p95 latency, concurrent-user targets), scalability (horizontal/stateless scaling, tenant growth, autoscaling targets), reliability and availability (SLA target such as 99.9%, graceful 3D->2D degradation, offline tolerance), capacity/sizing assumptions, maintainability (modularity, coding standards, test-coverage targets), portability (browser/device matrix), and compliance NFRs. Use tables grouped by category.' },
  { n: '18', file: 'ssd-18-security-safety.md', title: 'Security, Privacy and Child Safety', brief:
    'SR-nnn covering security objectives; a STRIDE threat-model table (threat | affected asset | mitigation); identity and access controls; tenant-isolation security; data protection (TLS 1.2+ in transit, encryption at rest, key management, PII classification, data minimisation for minors); child-safety and safeguarding controls (mandatory approvals, parental-consent flows, no open communications, moderation, age-appropriate design code alignment); a regulatory-compliance mapping table (COPPA, GDPR/GDPR-K, Zimbabwe Cyber and Data Protection Act, POPIA, NDPR, Kenya DPA -> controls); secure SDLC, dependency/supply-chain security and secrets management; logging/audit and incident response; and penetration-testing/vulnerability management. MoSCoW where applicable.' },
  { n: '19', file: 'ssd-19-infra-devops.md', title: 'Infrastructure, Deployment and DevOps', brief:
    'Cloud architecture and region selection (including an Africa region/edge for latency, e.g. af-south-1 plus Cloudflare/CloudFront PoPs); containerisation and Kubernetes orchestration; environments (dev/staging/prod); the CI/CD pipeline (build/test/security-scan/deploy) with Terraform IaC; blue-green/canary releases; configuration and secrets management; autoscaling; database HA/replicas/backups; disaster recovery with RPO/RTO targets; CDN and caching strategy; asset delivery; cost considerations; and automated per-tenant custom-domain TLS onboarding. Use ASCII deployment/pipeline diagrams and tables.' },
  { n: '20', file: 'ssd-20-accessibility-i18n.md', title: 'Accessibility, Internationalisation and Low-Bandwidth Design', brief:
    'WCAG 2.2 AA conformance requirements (keyboard, screen reader, contrast, reduced motion, age-appropriate UI); internationalisation (i18n framework, RTL, locale handling, African languages such as Shona, Ndebele, Swahili, Zulu, Hausa, plus French, Portuguese and Arabic) and the localisation workflow; and the low-bandwidth/offline strategy (asset optimisation, lazy-loaded 3D with 2D fallback, adaptive media, PWA offline caching of lessons and Studio with sync on reconnect, low-end Chromebook/Android-tablet support). Requirements tables.' },
  { n: '21', file: 'ssd-21-observability.md', title: 'Observability, Logging, Monitoring and Support', brief:
    'Logging standards (structured logs, correlation IDs, no PII leakage, especially for minors); metrics (RED/USE, simulation performance, learning-analytics infrastructure); distributed tracing via OpenTelemetry; dashboards and alerting with SLOs and error budgets; uptime/synthetic monitoring; security and safeguarding audit logs; error tracking via Sentry; the analytics data pipeline; and support tooling and runbooks. Tables where useful.' },
  { n: '22', file: 'ssd-22-traceability.md', title: 'Requirements Traceability and Verification', brief:
    'Explain the traceability approach; provide a traceability matrix table mapping representative URD requirements/use cases -> SSD functional requirements -> verification method (Test / Inspection / Demonstration / Analysis); give a coverage summary; and describe the verification and validation strategy (unit, integration, end-to-end, simulation-accuracy tests, accessibility tests, security tests, and UAT with pilot schools) plus the release acceptance criteria.' },
  { n: '23', file: 'ssd-23-appendices.md', title: 'Appendices', brief:
    'Appendix A: Arduino UNO, ESP32 and Raspberry Pi Pico (RP2040) pin reference tables. Appendix B: the component-model manifest schema as a JSON example inside a fenced code block. Appendix C: an example diagram.json structure (board, parts, connections) inside a fenced code block, plus an example board.json in the wokwi-boards definition format (pins with name/type/x/y and the SVG reference) for a custom board. Appendix D: glossary and acronyms (may reference the URD glossary). Appendix E: standards and references. Appendix F: open issues and future roadmap (real-hardware firmware export, more boards, an AI tutor, a community project/marketplace). Use H2 headings per appendix.' },
]

function outlineOf(arr, docName) {
  return docName + ' OUTLINE (your section is one of these; respect boundaries and avoid overlap):\n' +
    arr.map((s, i) => (i + 1) + '. ' + s.title).join('\n')
}

const URD_OUTLINE = outlineOf(URD, 'USER REQUIREMENTS DOCUMENT')
const SSD_OUTLINE = outlineOf(SSD, 'SYSTEM SPECIFICATION DOCUMENT')

function writePrompt(docName, outline, s) {
  const path = BASE + '/' + s.file
  return [
    'You are a senior technical writer and systems analyst producing one section of the official ' + docName + ' for RoboCode.Africa.',
    '',
    CANON,
    '',
    outline,
    '',
    'YOUR SECTION TITLE (use verbatim as the H1 first line): ' + s.title,
    '',
    'REQUIRED COVERAGE FOR THIS SECTION:',
    s.brief,
    '',
    RULES,
    '',
    'DELIVERABLE:',
    '1. Use the Write tool to write the complete markdown for this section to this exact absolute path: ' + path,
    '2. Do not create or modify any other file.',
    '3. Then return the structured status object describing what you wrote.',
  ].join('\n')
}

const STATUS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['file', 'title', 'approxWords', 'status'],
  properties: {
    file: { type: 'string' },
    title: { type: 'string' },
    approxWords: { type: 'number' },
    idPrefixesUsed: { type: 'array', items: { type: 'string' } },
    crossRefs: { type: 'array', items: { type: 'string' } },
    assumptions: { type: 'array', items: { type: 'string' } },
    status: { type: 'string' },
  },
}

const GAP_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['doc', 'gaps', 'inconsistencies', 'overallAssessment'],
  properties: {
    doc: { type: 'string' },
    gaps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['file', 'issue', 'severity'],
        properties: {
          file: { type: 'string' },
          issue: { type: 'string' },
          severity: { type: 'string' },
        },
      },
    },
    inconsistencies: { type: 'array', items: { type: 'string' } },
    overallAssessment: { type: 'string' },
  },
}

const REPAIR_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['doc', 'summary'],
  properties: {
    doc: { type: 'string' },
    filesModified: { type: 'array', items: { type: 'string' } },
    editsApplied: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
}

// ---------------------------------------------------------------------------
// Phase 1: author every section in parallel (each writes its own file).
// ---------------------------------------------------------------------------
phase('Author sections')
const allSections = [
  ...URD.map(s => ({ doc: 'URD', docName: 'USER REQUIREMENTS DOCUMENT', outline: URD_OUTLINE, s })),
  ...SSD.map(s => ({ doc: 'SSD', docName: 'SYSTEM SPECIFICATION DOCUMENT', outline: SSD_OUTLINE, s })),
]

const authored = await parallel(allSections.map(item => () =>
  agent(writePrompt(item.docName, item.outline, item.s), {
    label: item.doc + ' ' + item.s.n + ' ' + item.s.title,
    phase: 'Author sections',
    schema: STATUS_SCHEMA,
    agentType: 'general-purpose',
    model: 'sonnet',
    effort: 'high',
  })
))

const ok = authored.filter(Boolean)
log('Authored ' + ok.length + '/' + allSections.length + ' sections (' +
  ok.reduce((a, r) => a + (r.approxWords || 0), 0) + ' words total)')

// ---------------------------------------------------------------------------
// Phase 2 + 3: per-document QA critic, then a repair writer that fixes findings.
// Pipeline so URD and SSD flow independently.
// ---------------------------------------------------------------------------
function criticPrompt(doc, arr) {
  const files = arr.map(s => BASE + '/' + s.file).join('\n')
  const fullName = doc === 'URD' ? 'User Requirements Document' : 'System Specification Document'
  return [
    'You are a meticulous requirements-engineering QA reviewer for the RoboCode.Africa ' + fullName + '.',
    'Read EVERY one of these markdown section files (use the Read tool):',
    files,
    '',
    CANON,
    '',
    'Evaluate the set against the canon and against the expectations for a comprehensive, standards-aligned ' + fullName + '. Identify:',
    '(a) coverage GAPS - required topics missing or only superficially covered;',
    '(b) INCONSISTENCIES across sections - terminology drift, role-name mismatches, technology contradictions, or duplicate/colliding requirement IDs;',
    '(c) sections that are too thin for their scope.',
    'For each gap, name the specific file and the missing/weak content, and rate severity high/medium/low.',
    'Be concrete and actionable. Return the structured gap report.',
  ].join('\n')
}

function repairPrompt(doc, arr, report) {
  const files = arr.map(s => BASE + '/' + s.file).join('\n')
  const fullName = doc === 'URD' ? 'User Requirements Document' : 'System Specification Document'
  return [
    'You are a senior technical writer improving the RoboCode.Africa ' + fullName + '.',
    '',
    CANON,
    '',
    'A QA review produced this report (JSON):',
    JSON.stringify(report),
    '',
    'The section files are here (read with Read, then fix in place with Edit or Write):',
    files,
    '',
    'For each actionable high/medium issue, edit the relevant file(s) to close gaps, deepen thin sections, and resolve inconsistencies. Preserve the formatting rules: the first line of each file stays exactly "# Title" with no manual numbering; requirement tables use ID | Requirement | Priority | Acceptance/Notes; diagrams are ASCII in fenced code blocks (never mermaid); tables stay at most 5 columns; use the canon names and ID prefixes. Do not rename files or create new ones. Return a summary of the edits applied.',
  ].join('\n')
}

const docSets = [
  { doc: 'URD', arr: URD },
  { doc: 'SSD', arr: SSD },
]

const reviewed = await pipeline(
  docSets,
  d => agent(criticPrompt(d.doc, d.arr), {
    label: 'critic:' + d.doc,
    phase: 'Review',
    schema: GAP_SCHEMA,
    agentType: 'general-purpose',
    effort: 'high',
  }),
  (report, d) => report ? agent(repairPrompt(d.doc, d.arr, report), {
    label: 'repair:' + d.doc,
    phase: 'Repair',
    schema: REPAIR_SCHEMA,
    agentType: 'general-purpose',
    effort: 'high',
  }) : null
)

return {
  authoredCount: ok.length,
  totalSections: allSections.length,
  totalWords: ok.reduce((a, r) => a + (r.approxWords || 0), 0),
  sections: ok.map(r => ({ file: r.file, title: r.title, words: r.approxWords })),
  reviews: reviewed.filter(Boolean),
}
