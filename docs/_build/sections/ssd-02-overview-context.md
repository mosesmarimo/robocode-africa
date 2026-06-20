# System Overview and Context

## Product Context

RoboCode.Africa is a browser-based, multi-tenant educational platform that equips primary and high school students across Africa and beyond with practical skills in Robotics, Coding and Artificial Intelligence. Its defining characteristic is that it requires no physical hardware: the platform delivers a high-fidelity simulation of real microcontroller boards, electronics components, and embedded code execution entirely within a modern web browser.

The centrepiece of the platform is **RoboCode Studio**, a Wokwi-style web IDE that combines a drag-and-drop electronics canvas, a breadboard and wiring simulator, and a Monaco-based code editor in a single cohesive workspace. Students select components from a curated catalogue that mirrors a physical robotics starter kit, place them on a virtual canvas, connect them through a simulated full-size breadboard, and write firmware in Arduino C/C++, MicroPython, CircuitPython, or a block-based visual mode. The **RoboCode Simulation Engine (RSE)** — built on the Wokwi open-source libraries (`avr8js`, `rp2040js`, `wokwi-elements`, and related packages published at `github.com/wokwi`) — executes that code against accurate microcontroller models for the Arduino UNO R3 (ATmega328P), the ESP32 DevKit, and the Raspberry Pi Pico (RP2040), animating LEDs, LCDs, buzzers, servo motors, sensors, and every other component in the catalogue in real time. An extensible, data-driven board library (using the `wokwi-boards` manifest format) allows platform admins and approved educators to add custom board definitions without code changes.

Schools subscribe to RoboCode.Africa as isolated tenants, each receiving a private subdomain (`school.robocode.africa`) and optionally a fully verified custom domain with white-label branding. Structured learning pathways, a gamification economy built on **RoboPoints**, team competition hosting, rigorous content moderation, and multi-jurisdictional child-safety compliance complete the ecosystem.

RoboCode.Africa sits at the intersection of three established product categories:

| Category | Adjacent Products | RoboCode.Africa Differentiator |
|---|---|---|
| Browser-based electronics simulators | Wokwi.com, Tinkercad Circuits, Falstad | Multi-tenant school model, teacher/grade workflows, K-12 curriculum alignment, Africa-first child-safety compliance |
| K-12 coding platforms | Scratch, Code.org, Replit Teams | Full electronics simulation with real MCU firmware execution, not just block-based abstraction |
| Learning Management Systems | Google Classroom, Moodle, Canvas | Integrated IDE + simulator; no separate tool required; RoboPoints gamification; Africa-region infrastructure |

---

## System Boundary

The system boundary encompasses all software components owned, operated, and maintained by the RoboCode.Africa platform team. Everything outside the boundary is an external system or actor that communicates with the platform through defined interfaces.

### Inside the Boundary

- The RoboCode.Africa web application (marketing site, app shell, and RoboCode Studio SPA).
- The backend microservices layer (API gateway, auth service, tenant service, LMS service, studio service, gamification service, moderation service, notification service, reporting service).
- The **RoboCode Simulation Engine (RSE)** executing in-browser via WASM and the Wokwi open-source libraries.
- The **RoboCode Virtual Machine (RVM)** simplified/interpreted code execution path.
- Platform databases (PostgreSQL with Row-Level Security per tenant, Redis, S3-compatible object storage).
- The platform's internal identity and session management layer.
- Administrative dashboards (Super Admin, Platform Moderator, School Admin, Teacher, reporting).
- The real-time collaboration layer (WebSocket/Socket.IO, Yjs CRDT).
- Content moderation, safeguarding escalation, and audit-logging pipelines.
- CI/CD infrastructure, Kubernetes cluster, CDN configuration, and observability stack managed by the platform team.

### Outside the Boundary (External Systems)

| External System | Interface Type | Direction |
|---|---|---|
| DNS registrars (school custom domains) | DNS CNAME/TXT record delegation | Outbound verification |
| ACME/Let's Encrypt (automated TLS) | ACME protocol over HTTPS | Outbound certificate issuance |
| School SSO Identity Providers (Google, Microsoft) | OAuth2/OIDC federation | Inbound authentication |
| Transactional email providers (SES/SendGrid) | SMTP/API | Outbound |
| SMS gateway (optional, low-connectivity fallback) | HTTP API | Outbound |
| Payment gateways (Stripe, Paystack, Flutterwave) | REST/webhook | Bidirectional |
| CDN/Edge layer (Cloudflare/CloudFront) | HTTP/TLS proxy; edge caching | Inbound/Outbound |
| Cloud object storage (S3-compatible) | S3 API (presigned URLs) | Bidirectional |
| AI assistant provider (Claude/OpenAI-compatible API) | REST streaming API | Outbound |
| Wokwi open-source libraries (`avr8js`, `rp2040js`, `wokwi-elements`, `wokwi-boards`) — build-time dependency | npm package; WASM artefacts | Build-time inbound |
| OpenSearch (optional full-text search) | REST | Bidirectional |

---

## Primary Actors

The following actors interact directly with the system. Full role definitions and RBAC rules are specified in the companion SSD section *Functional Requirements: Identity, Authentication and Authorization*.

| Actor | Type | Primary Interaction |
|---|---|---|
| Super Admin | Internal human | Platform configuration, tenant management, global content library, billing, safeguarding escalation, system health |
| Platform Moderator | Internal human | Content moderation, safeguarding triage, direct-signup approval (delegated from Super Admin) |
| School Admin (Tenant Admin) | External human | School subdomain/domain configuration, branding, teacher and student management, school-level reporting |
| Teacher / Educator | External human | Course authoring, task assignment, project review, grading, class management |
| Student | External human | RoboCode Studio project work, code authoring, task completion, RoboPoints earning, team participation |
| Parent / Guardian | External human | Verifiable consent submission; limited read-only view of child progress |
| Guest / Visitor | Anonymous human | Marketing site and limited demo (no account required) |

---

## Major Subsystems

The platform is decomposed into the following major subsystems. Each subsystem is specified in detail in the functional requirements sections identified in the cross-reference column.

| Subsystem | One-line Purpose | SSD Section |
|---|---|---|
| **Identity and Auth Service** | OAuth2/OIDC authentication, JWT session management, MFA, school SSO federation, RBAC enforcement | FR-AUTH |
| **Tenant Service** | Multi-tenant isolation, subdomain and custom-domain routing, white-label branding config, school onboarding | FR-TEN |
| **RoboCode Studio SPA** | Browser-resident IDE delivering canvas, wiring editor, code editor, and simulation controls in a single workspace | FR-SIM, FR-CODE |
| **RoboCode Simulation Engine (RSE)** | In-browser execution of avr8js AVR firmware (UNO R3), rp2040js RP2040 firmware (Raspberry Pi Pico), and ESP32 core simulation; extensible wokwi-boards board library; component behavioural models | FR-SIM |
| **RoboCode Virtual Machine (RVM)** | Simplified interpreted execution path for block-based and beginner code; translates instructions to component pin actions | FR-CODE |
| **Code Authoring and Execution Service** | Monaco editor integration, block-to-text transpilation, WASM/cloud compile microservice, lint and autocomplete | FR-CODE |
| **Component and Sensor Library** | Catalogue of simulated boards, passive components, sensors, actuators, displays, and comms modules | FR-SIM |
| **Learning Management Service (LMS)** | Courses, modules, tasks, assignments, automated grading, teacher-authored content, curriculum alignment | FR-LRN |
| **Gamification Service** | RoboPoints ledger, badge engine, class/school/global leaderboards, achievement unlocks | FR-GAM |
| **Teams and Competition Service** | Team formation, Yjs CRDT collaborative projects, competition lifecycle, bracket and scoring management | FR-TEAM |
| **Communication and Moderation Service** | Moderated class messaging, profanity/PII filtering, abuse reporting, safeguarding escalation, audit logging | FR-COMM, FR-MOD |
| **Notification Service** | Transactional email (SES/SendGrid), optional SMS, in-app push notifications, digest scheduling | FR-COMM |
| **Administration and Reporting Service** | Super Admin, Platform Moderator, School Admin and Teacher dashboards; analytics pipelines; billing integration | FR-ADM |
| **API Gateway** | Single ingress for all client traffic; routing, rate limiting, auth token validation, observability instrumentation | IR |
| **Realtime Collaboration Layer** | WebSocket/Socket.IO event bus; Yjs CRDT document sync for multi-user project editing | FR-TEAM, FR-SIM |
| **Observability Stack** | OpenTelemetry instrumentation, Prometheus/Grafana metrics, Sentry error tracking, centralized structured logging | NFR-OBS |

---

## Context Diagram

The following ASCII context diagram depicts the platform (centre box) in relation to all primary actors and external systems. Arrow directions indicate the primary flow of control or data; most interfaces are bidirectional but the dominant direction is shown.

```
                         +--------------------------------------+
                         |  DNS Registrar (School Custom Domain)|
                         +-------------------+------------------+
                                             |  CNAME/TXT delegation
                         +-------------------v------------------+
                         |     ACME / Let's Encrypt             |
                         |   (Automated TLS Certificates)       |
                         +-------------------+------------------+
                                             |  TLS cert issuance
                                             |
  +------------------+    HTTPS / WSS        v
  |  Guest / Visitor +-------+    +==============================+
  +------------------+       |    ||                            ||
                             |    ||    CDN / Edge Layer        ||
  +------------------+       +--->||  (Cloudflare/CloudFront)   ||
  |    Parent /       |      |    ||                            ||
  |    Guardian       +------+    +============+===============++
  +------------------+       |                |
                             |     HTTPS/WSS  | origin
  +------------------+       |                v
  |    Student        +------+    +==============================+
  +------------------+       |    ||                            ||
                             |    ||   RoboCode.Africa          ||
  +------------------+       +--->||   Platform Boundary        ||
  |    Teacher /      |      |    ||                            ||
  |    Educator       +------+    ||  +------------------------+||
  +------------------+       |    ||  |  API Gateway           |||
                             |    ||  +------------------------+||
  +------------------+       |    ||  |  Auth Service  (FR-AUTH)|||
  |   School Admin    +------+    ||  |  Tenant Service(FR-TEN) |||
  +------------------+       |    ||  |  RoboCode Studio SPA   |||
                             |    ||  |  RSE (avr8js/rp2040js) |||
  +------------------+       |    ||  |  RVM (interpreted)     |||
  | Platform Moderator+------+    ||  |  Code Exec Service     |||
  +------------------+       |    ||  |  LMS Service   (FR-LRN)|||
                             |    ||  |  Gamification  (FR-GAM)|||
  +------------------+       |    ||  |  Teams Service (FR-TEAM)|||
  |   Super Admin     +------+    ||  |  Moderation    (FR-MOD)|||
  +------------------+            ||  |  Notification  (FR-COMM)|||
                                  ||  |  Admin/Reports (FR-ADM)|||
                                  ||  |  Realtime / Yjs CRDT   |||
                                  ||  |  Observability Stack    |||
                                  ||  +------------------------+||
                                  ||                            ||
                                  +==============================+
                                       |    |    |    |    |
           +---------+---------+-------+    |    |    +-------+----------+
           |         |         |            |    |            |          |
           v         v         v            v    v            v          v
  +--------+--+  +---+-----+  +---------+  ++--++  +--------+--+  +-----+------+
  |PostgreSQL |  |  Redis  |  |   S3    |  |Email|  |  Payment  |  | AI Assist. |
  |(RLS/       |  |(cache,  |  |Object  |  | SMS |  |  Gateway  |  | Provider   |
  | multi-    |  | sessions|  |Storage |  |     |  |(Stripe/   |  |(Claude/    |
  | tenant)   |  | queues) |  |(assets,|  |(SES/|  | Paystack/ |  | OpenAI-    |
  |           |  |         |  | models)|  |SMS) |  | Flutterwv)|  | compatible)|
  +-----------+  +---------+  +---------+  +----+  +-----------+  +------------+

           +----------------------------+   +-----------------------------+
           | School SSO IdP             |   | Wokwi Open-Source Libraries |
           | (Google / Microsoft OIDC)  |   | (avr8js, rp2040js,          |
           | - Inbound auth federation  |   |  wokwi-elements, wokwi-     |
           +----------------------------+   |  boards; npm/WASM build dep)|
                                            +-----------------------------+
```

---

## Operating Environment

### Client Environment

RoboCode Studio and all student/teacher-facing surfaces are delivered as a browser-resident application. The target client environment is deliberately broad to support African school conditions.

| Dimension | Minimum Supported | Recommended |
|---|---|---|
| Browser | Chrome 109, Edge 109, Firefox 115 ESR, Safari 16.4 (authoritative baseline: NFR-PORT matrix, NFR section) | Latest stable Chrome or Edge |
| Device | Shared school desktop/laptop, 2 GB RAM, 1366 x 768 display | Personal laptop/desktop, 4 GB+ RAM, 1080p |
| Network | 2 Mbps sustained; tolerant of latency up to 200 ms RTT | 10 Mbps+ |
| 3D rendering | Graceful fallback to 2D if WebGL2 unavailable | WebGL2; progressive WebGPU where supported |
| Accessibility | WCAG 2.2 Level AA; keyboard navigable; screen-reader compatible | -- |
| JavaScript | ES2020+ (transpiled by Next.js/Vite build pipeline) | -- |

The simulator core (`avr8js`, `rp2040js`, `wokwi-elements`) runs entirely in-browser as WASM/JavaScript, supporting all three first-class boards: the Arduino UNO R3 (ATmega328P via avr8js), the Raspberry Pi Pico (RP2040 via rp2040js), and the ESP32 DevKit. The Monaco editor and Yjs CRDT collaborative engine also operate client-side. Network round-trips are required only for: authentication, project persistence, LMS interactions, compilation (if using the cloud compile microservice), and real-time collaboration events.

### Cloud Backend Environment

The backend is deployed as containerised microservices on a Kubernetes cluster hosted in a cloud provider offering an Africa-region presence (primary: AWS `af-south-1` — Cape Town; secondary region for DR configurable at deployment). Key environmental characteristics:

| Dimension | Specification |
|---|---|
| Container runtime | Docker images, Kubernetes orchestration |
| API surface | REST + GraphQL behind a single API gateway; WebSocket (Socket.IO) for realtime |
| Primary data store | PostgreSQL (multi-tenant, tenant_id isolation + Row-Level Security) |
| Cache / sessions / queues | Redis |
| Object storage | S3-compatible (AWS S3 or equivalent) |
| Edge / CDN | Cloudflare or CloudFront terminating TLS and caching static assets at PoPs closest to African users |
| Custom domain TLS | Automated via ACME/Let's Encrypt with CNAME/TXT DNS verification per tenant |
| IaC | Terraform; CI/CD via GitHub Actions |
| Observability | OpenTelemetry, Prometheus/Grafana, Sentry, centralized structured logging |

---

## High-Level Data Flow

The following subsections describe the dominant data flows that connect actors, subsystems, and external systems.

### Student Project Session

```
Student Browser
  |
  |-- 1. HTTPS: Authenticate (JWT via Auth Service / SSO IdP) -------> Auth Service
  |<- 2. JWT access token + tenant context ---------------------------> Auth Service
  |
  |-- 3. Load RoboCode Studio SPA (CDN-cached static assets) ---------> CDN
  |<- 4. HTML/JS/WASM bundle (wokwi-elements, avr8js, rp2040js, Monaco) -> CDN
  |
  |-- 5. GraphQL: Load project (components, wiring, code) ------------> API Gateway
  |                                                                     -> Studio Service
  |                                                                     -> PostgreSQL / S3
  |<- 6. Project payload (board type, positions, netlist, sketch) <--- Studio Service
  |
  |   [In-browser: RSE initialises MCU core (avr8js for UNO R3, rp2040js for Pico,
  |    ESP32 core for ESP32) + component models from wokwi-boards library]
  |
  |-- 7. Code editor: type sketch / drag blocks -> transpile -> lint  [Monaco + RVM in-browser]
  |
  |-- 8. Compile: POST sketch to WASM toolchain or compile service ---> Code Exec Service
  |<- 9. Compiled firmware blob (ELF/HEX/UF2) ----------------------<- Code Exec Service
  |
  |   [In-browser: selected MCU core (avr8js/rp2040js/ESP32) loads firmware;
  |    RSE steps simulation clock; component models respond to pin changes;
  |    wokwi-elements re-render]
  |
  |-- 10. Auto-save: PUT project state (periodic + on pause) --> Studio Service -> S3/PostgreSQL
  |
  |-- 11. Gamification event: task complete -> POST completion --------> LMS Service
  |                                                                     -> Gamification Service
  |<- 12. RoboPoints delta + badge notifications --<- Gamification / Notification Service
```

### School Tenant Onboarding and Custom Domain Activation

```
School Admin
  |-- 1. Register school (POST tenant) -> Tenant Service -> PostgreSQL
  |-- 2. Configure custom domain (PATCH tenant.custom_domain)
  |        -> Tenant Service verifies CNAME/TXT with DNS registrar
  |        -> ACME/Let's Encrypt issues TLS cert for custom domain
  |<- 3. Subdomain (school.robocode.africa) + custom domain activated
  |-- 4. Upload branding (logo, colours) -> Object Storage (S3)
  |<- 5. White-label design tokens applied platform-wide for tenant
```

### Student Signup, Parental Consent, and Activation

```
Student (or Parent on behalf of minor)
  |-- 1. POST /signup (school subdomain) -> Auth Service -> Tenant Service
  |        -> Account created with status=PENDING_CONSENT
  |-- 2. Parental consent email dispatched -> Email Provider (SES/SendGrid)
  |-- 3. Parent follows consent link -> Auth Service records verifiable consent
  |        -> Account transitions to status=PENDING_APPROVAL
  |-- 4. School Admin receives approval notification (email + in-app)
  |-- 5. School Admin approves -> Auth Service activates account
  |<- 6. Student receives activation confirmation email
  |-- 7. Student logs in and accesses RoboCode Studio
```

### Content Moderation and Safeguarding Flow

```
Student submits content (project name, chat message, assignment comment)
  |-- 1. Content passes through Moderation Service
  |        -> Profanity/PII filter (in-process or external API)
  |        -> If flagged: content quarantined; Teacher + School Admin notified
  |-- 2. Teacher reviews flagged item -> marks resolved or escalates
  |-- 3. Escalation -> Platform Moderator / Super Admin via Notification Service
  |-- 4. All moderation actions appended to immutable audit log (PostgreSQL)
  |        -> Retained for minimum 12 months
```

---

## Assumptions and Constraints

The following assumptions and constraints inform the system boundary and the operating environment described in this section. Detailed constraints are propagated into the relevant functional and non-functional requirement sections.

| ID | Type | Statement |
|---|---|---|
| ASM-01 | Assumption | Students access the platform via a shared school computer with a minimum of 2 GB RAM and a sustained 2 Mbps internet connection. |
| ASM-02 | Assumption | Every school tenant has at least one designated School Admin who is responsible for approving student accounts and configuring the school subdomain. |
| ASM-03 | Assumption | The Wokwi open-source libraries (`avr8js`, `rp2040js`, `wokwi-elements`, `wokwi-boards`) are available under their current open-source licences for bundling and redistribution within the platform. |
| ASM-04 | Assumption | Parental/guardian contact details are collected at student signup time; the platform does not independently verify that a consenter is the legal guardian. |
| ASM-05 | Assumption | School SSO federation (Google Workspace for Education, Microsoft Entra) is provided and managed by the subscribing school. The platform acts as OAuth2 relying party only. |
| CON-01 | Constraint | No behavioural advertising, data brokering, or third-party tracking scripts may be deployed on any page accessible to minor users. This is architecturally enforced, not configurable. |
| CON-02 | Constraint | Private peer-to-peer messaging between student accounts is architecturally absent; all communication channels are teacher/admin-supervised. |
| CON-03 | Constraint | The Arduino Nano and ESP8266 boards are out of scope for v1.0 simulation; the three first-class boards at launch are the Arduino UNO R3 (ATmega328P, simulated via avr8js), the ESP32 DevKit (ESP32 core), and the Raspberry Pi Pico (RP2040, simulated via rp2040js). Additional boards may be added via the extensible wokwi-boards manifest library by platform admins and approved educators. |
| CON-04 | Constraint | The platform must be deployable from an Africa-region cloud zone (e.g., AWS `af-south-1`) as the primary region to meet latency targets for African users. |
| CON-05 | Constraint | All user-facing surfaces must conform to WCAG 2.2 Level AA. Accessibility is not optional and cannot be deferred post-launch. |
| CON-06 | Constraint | Audit logs for moderation, consent, and authentication events must be retained for a minimum of 12 months and must be append-only / tamper-evident. |
| CON-07 | Constraint | Physical hardware integration (USB/serial, real-device flashing) is out of scope; the platform is entirely browser-resident. |

---

## Relationship to Other SSD Sections

This section establishes context, boundary, and high-level data flows. All actors, subsystems, and external interfaces described here are elaborated in the sections listed below. Requirements stated here are non-normative summaries only; normative functional and non-functional requirements are located in the sections cross-referenced.

| Topic Introduced Here | Normative Specification |
|---|---|
| Identity, authentication, SSO, parental consent | *Functional Requirements: Identity, Authentication and Authorization* (FR-AUTH) |
| Multi-tenancy, custom domains, white-labelling | *Functional Requirements: Multi-Tenancy, Custom Domains and White-Labelling* (FR-TEN) |
| RoboCode Studio canvas and wiring | *Functional Requirements: RoboCode Studio IDE* (FR-STU) |
| RSE simulation engine and component models | *Functional Requirements: RoboCode Simulation Engine* (FR-SIM) |
| Code editor, compilation, RVM | *Functional Requirements: Code Authoring, Validation and Execution* (FR-CODE) |
| Component and sensor catalogue | *Component and Sensor Library Specification* |
| LMS, courses, grading | *Functional Requirements: Learning Management and Content* (FR-LRN) |
| Teams, competitions, RoboPoints | *Functional Requirements: Teams, Competitions and Gamification* (FR-TEAM, FR-GAM) |
| Moderation, safeguarding, audit logs | *Functional Requirements: Communication, Notifications and Moderation* (FR-COMM, FR-MOD) |
| Admin dashboards, analytics, billing | *Functional Requirements: Administration, Analytics and Reporting* (FR-ADM) |
| API gateway, integrations, external interfaces | *API Specification and Integration Interfaces* (IR) |
| Non-functional targets (performance, availability) | *Non-Functional Requirements* (NFR) |
| Security, privacy, COPPA/GDPR-K compliance | *Security, Privacy and Child Safety* (SR) |
| Infrastructure, Kubernetes, Terraform, CI/CD | *Infrastructure, Deployment and DevOps* |
| CDN, low-bandwidth, Africa-region delivery | *Accessibility, Internationalisation and Low-Bandwidth Design* (NFR-PERF, NFR-ACCESS) |
| Observability, logging, monitoring | *Observability, Logging, Monitoring and Support* (NFR-OBS) |
