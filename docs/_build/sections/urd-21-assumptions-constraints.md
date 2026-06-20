# Assumptions, Dependencies and Constraints

## Overview

This section documents the assumptions on which the RoboCode.Africa User Requirements Document (URD) is based, the external dependencies the platform relies upon, and the hard constraints that bound what the platform may and must do. Together these three categories define the envelope of feasibility within which the requirements in Sections 6–20 are valid. Any material change to an assumption, loss of a dependency, or relaxation/tightening of a constraint must trigger a formal review of the affected requirements.

Requirements in this section carry the identifier prefix **UR-NFR-nnn** (shared with "Non-Functional User Expectations", Section 20) and follow MoSCoW prioritisation. Traceability to the System Specification Document (SSD) uses `NFR-<CAT>-<nnn>`, `FR-<MODULE>-<nnn>`, and `SR-<nnn>` prefixes where indicated.

---

## Assumptions

Assumptions are conditions believed to be true for v1.0 that have not been contractually guaranteed. If an assumption proves false, the affected requirements must be reassessed.

### Connectivity and Bandwidth Assumptions

RoboCode.Africa operates entirely in the browser and requires an internet connection. The platform acknowledges the heterogeneous connectivity reality of its primary African market and tiers its feature set accordingly.

```
  Connectivity Tier Model
  ========================

  TIER A — Broadband / School LAN / Wi-Fi
  +-----------------------------------------+
  | Bandwidth: ≥ 5 Mbps sustained           |
  | Latency:   < 100 ms to CDN edge         |
  | Usage:     3D simulation, video content, |
  |            real-time collaboration (Yjs) |
  +-----------------------------------------+
            |
  TIER B — Limited Mobile / Shared Wi-Fi
  +-----------------------------------------+
  | Bandwidth: 1–5 Mbps (variable)          |
  | Latency:   100–400 ms                   |
  | Usage:     2D simulation, Monaco editor, |
  |            compressed assets, no video  |
  +-----------------------------------------+
            |
  TIER C — Very-Low Bandwidth / 2G/3G
  +-----------------------------------------+
  | Bandwidth: 256 kbps – 1 Mbps            |
  | Latency:   400 ms – 2 s                 |
  | Usage:     Text-only tasks, block editor,|
  |            SMS-based notifications only  |
  +-----------------------------------------+
```

| ID | Assumption | Priority | Acceptance / Notes |
|----|------------|----------|--------------------|
| UR-NFR-A001 | The majority of school-based students will access the platform via a shared school Wi-Fi or LAN with a sustained speed of at least 1 Mbps per concurrent user. | Must | Platform performance targets (Section 20) are calibrated to Tier B as the minimum viable tier. Tier A enables full 3D experience. |
| UR-NFR-A002 | A meaningful proportion of students (estimated 20–40 % in v1.0 target markets) will access from mobile devices on 3G/4G connections (Tier C). | Should | The platform must degrade gracefully: 3D to 2D fallback, compressed assets, and reduced WebSocket polling interval. |
| UR-NFR-A003 | Persistent offline operation is NOT assumed in v1.0. All simulation and code execution requires an active internet connection. | Must | Offline/PWA capability is explicitly deferred (see "User Requirements: Onboarding, Signup and Approval", Section 1 — Out of Scope). |
| UR-NFR-A004 | CDN edge nodes are assumed to be available within 50 ms of the majority of target African cities (Nairobi, Lagos, Johannesburg, Harare, Cairo, Accra). | Should | Dependent on Cloudflare/CloudFront edge coverage. Verified against provider point-of-presence maps before launch. |
| UR-NFR-A005 | Schools with very-low-bandwidth (Tier C) may rely on SMS as the fallback notification channel. It is assumed that transactional SMS is commercially available and legally permissible in Zimbabwe, South Africa, Nigeria, and Kenya. | Could | Verified with SMS provider (e.g., Twilio, Africa's Talking) during school onboarding. |

### Device and Browser Assumptions

| ID | Assumption | Priority | Acceptance / Notes |
|----|------------|----------|--------------------|
| UR-NFR-A006 | Students will use a device with a minimum of 2 GB RAM, a dual-core CPU released no earlier than 2016, and a browser meeting the supported-browser floor defined authoritatively in the Supported Browser Matrix of Section 20 (Non-Functional User Expectations). | Must | The authoritative supported-browser floor is Section 20's matrix: Chrome/Edge ≥ 109, Firefox ≥ 115 ESR, Safari ≥ 16.4. These versions are required because the avr8js WASM path and SharedArrayBuffer-backed simulation need recent browser engines. IE is not supported. |
| UR-NFR-A007 | WebGL 2.0 support is available on Tier A and B devices to enable 3D rendering via Three.js and React Three Fiber. Devices without WebGL 2.0 fall back to the 2D wokwi-elements view. | Must | Graceful 3D→2D fallback is mandatory (see "User Requirements: RoboCode Studio Canvas, Components and Wiring", UR-STU series). |
| UR-NFR-A008 | WebAudio API is available on all target browsers to enable buzzer/tone simulation via WebAudio. Devices lacking WebAudio display a silent indicator rather than failing. | Should | WebAudio is supported in all ES2020-capable browsers. |
| UR-NFR-A009 | The primary device class for younger (primary-school) students is a shared school tablet or Chromebook; high-school students are more likely to use a desktop or laptop. | Should | UI/UX must accommodate both form factors; responsive layout and large-tap-target requirements apply. |
| UR-NFR-A010 | Native mobile apps (iOS/Android) are NOT assumed to exist in v1.0. The responsive web application must be functional on mobile browsers as a best-effort surface. | Must | Full-feature RoboCode Studio on a sub-6-inch phone screen is impractical; the platform should surface a guided message on very small viewports rather than a broken layout. |
| UR-NFR-A011 | In-browser WASM compilation of Arduino C/C++ sketches may be too resource-intensive for Tier C devices. A server-side compile microservice is assumed to be available as an alternative execution path. | Must | See "User Requirements: Code Editor and Programming" (UR-CODE series) and SSD FR-CODE-xxx. |

### School IT Capacity Assumptions

| ID | Assumption | Priority | Acceptance / Notes |
|----|------------|----------|--------------------|
| UR-NFR-A012 | Schools operating as Tenants will have at least one designated IT-literate School Admin capable of completing subdomain DNS configuration (CNAME/TXT record creation). | Must | School onboarding documentation must include a step-by-step DNS guide. If CNAME/TXT cannot be set, the school uses the default `school.robocode.africa` subdomain only. |
| UR-NFR-A013 | Teachers are assumed to be comfortable with web-based tools at a basic level (can navigate a browser-based IDE, upload files, set due dates) but are NOT assumed to have programming expertise. | Must | The Teacher interface must hide technical complexity. Content-authoring tools must be WYSIWYG where practical. |
| UR-NFR-A014 | Schools may lack a Google Workspace or Microsoft 365 identity provider for SSO. The platform must support password-based login as the universal fallback. | Must | SSO via Google/Microsoft is a Should-priority enhancement on top of the Must-have password path. |
| UR-NFR-A015 | School network firewalls may block WebSocket connections on non-standard ports. The platform must operate over standard HTTPS (port 443) for all real-time communication. | Must | Socket.IO must be configured to fall back to HTTP long-polling over port 443 when WebSocket upgrade fails. |
| UR-NFR-A016 | Schools will have between 10 and 1,500 active students in v1.0. Larger-scale tenants are a roadmap concern. | Should | Capacity and performance testing must validate concurrent usage up to 1,500 students per tenant and 10,000 across the platform at launch. |

### Parental Reachability and Consent Assumptions

| ID | Assumption | Priority | Acceptance / Notes |
|----|------------|----------|--------------------|
| UR-NFR-A017 | Parents or Guardians of minor students can be reached by email or SMS for consent verification. It is NOT assumed that all parents have a smartphone or reliable email access. | Must | The consent workflow must offer both email-link and SMS-PIN verification paths (see "User Requirements: Onboarding, Signup and Approval", UR-ONB series). |
| UR-NFR-A018 | Parental consent must be re-verified if a student migrates between tenants or if the platform's data processing purposes materially change. One-time initial consent is not assumed to be permanent and transferable. | Must | Traceable to COPPA, GDPR-K, POPIA, and Zimbabwe CDPA obligations. |
| UR-NFR-A019 | Some parents in low-connectivity regions may be unable to complete a digital consent workflow. Schools are assumed to be able to act as a proxy for in-person consent collection, with the School Admin uploading a signed consent document. | Should | The School Admin must attest that the physical consent is on file. This creates an audit record. Legality of proxy consent varies by jurisdiction; the platform flags this for legal review per country. |
| UR-NFR-A020 | The age declared by a student at signup is not independently verifiable by the platform. The platform relies on declared age, school-context corroboration, and parental/guardian attestation. | Must | Age-appropriate defaults are applied based on declared age. Where age is ambiguous the platform defaults to the more protective treatment (minor). |

---

## Dependencies

Dependencies are external systems, services, open-source libraries, or standards that RoboCode.Africa relies on and does not control. Loss, API change, or licence change in a dependency constitutes a risk to the requirements that depend on it.

### Wokwi Open-Source Libraries

The RoboCode Simulation Engine (RSE) and RoboCode Studio are fundamentally dependent on the Wokwi open-source ecosystem. This is the deepest technical dependency in the platform.

```
  RSE Dependency Tree (Wokwi)
  ===========================

  RoboCode Studio (React / Next.js SPA)
       |
       +-- wokwi-elements (Web Components)
       |       Provides: 2D SVG component renderers
       |       (LEDs, LCDs, buttons, breadboard, etc.)
       |
       +-- avr8js
       |       Provides: in-browser ATmega328P (AVR) CPU
       |       simulation for Arduino UNO R3 firmware
       |
       +-- rp2040js
       |       Provides: in-browser RP2040 (ARM Cortex-M0+)
       |       simulation for Raspberry Pi Pico firmware
       |       (MicroPython, CircuitPython, C/C++)
       |
       +-- ESP32 core simulation
       |       Provides: in-browser ESP32 CPU simulation
       |       for ESP32 DevKit firmware
       |
       +-- wokwi-boards (board manifest library)
       |       Provides: data-driven board definitions
       |       (board.json + SVG); standard library ships
       |       UNO, ESP32 family, Pico, and more; custom
       |       boards uploaded by admins/teachers
       |
       +-- Component behavioural models
       |       (avr8js/rp2040js-linked pin-state callbacks,
       |        I2C/SPI/UART peripheral emulation)
       |
       +-- WASM toolchain (optional, bundled separately)
               Provides: in-browser AVR-GCC / avr-libc
               compile path for .ino sketches; UF2/ELF
               loader for Pico firmware via rp2040js
```

| ID | Dependency | Priority | Acceptance / Notes |
|----|------------|----------|--------------------|
| UR-NFR-D001 | **wokwi-elements** (github.com/wokwi/wokwi-elements) — web components for 2D electronic component rendering in RoboCode Studio. | Must | Version pinned in `package.json`. A FOSS (MIT) licence must be maintained. Breaking API changes require a RoboCode Studio update and regression test pass before deployment. |
| UR-NFR-D002 | **avr8js** (github.com/wokwi/avr8js) — JavaScript/WASM implementation of the ATmega328P CPU used for the Arduino UNO R3 accurate execution path. | Must | Version pinned. avr8js is MIT-licensed. Replacement would require re-implementing AVR CPU simulation — classified as a critical dependency. |
| UR-NFR-D002a | **rp2040js** (github.com/wokwi/rp2040js) — JavaScript/WASM implementation of the RP2040 (dual-core ARM Cortex-M0+ at 133 MHz, 264 KB SRAM, 2 MB flash) used for the Raspberry Pi Pico accurate execution path. Accurate execution loads a real UF2/ELF firmware image into rp2040js; supported languages are MicroPython, CircuitPython, and C/C++ (Arduino-Pico core / Pico SDK). | Must | Version pinned. rp2040js is MIT-licensed. Classified as a critical dependency equivalent to avr8js. Loss or relicensing requires an internal fork under the abstraction adapter (see UR-NFR-C024). |
| UR-NFR-D003 | An AVR-GCC / avr-libc toolchain, either compiled to WASM for in-browser use or hosted as a compile microservice, is required to produce flashable firmware from Arduino C/C++ sketches. A UF2/ELF firmware loader is required to supply Raspberry Pi Pico firmware images to rp2040js. | Must | If WASM toolchain is unavailable on a client device, the compile microservice path must be available. Both paths must produce identical firmware output. |
| UR-NFR-D004 | An ESP32 core simulation library (based on Wokwi's ESP32 simulation research or equivalent) is required to simulate ESP32 DevKit (ESP-WROOM-32) behaviour including on-board Wi-Fi/BLE. | Must | ESP32 simulation is explicitly in scope for v1.0. If no suitable open-source library is available at feature-freeze, ESP32 falls back to a limited interpreted RVM mode. |
| UR-NFR-D004a | **wokwi-boards** (github.com/wokwi/wokwi-boards) — the canonical data-driven board definition format used by RoboCode Studio. A board manifest (`board.json`) declares pin names, types, and positions together with an SVG visual asset; no code change is needed to add a board. The standard library (Arduino Uno/Nano/Mega, ESP32 family, Raspberry Pi Pico, and more) ships built in. Platform admins and approved advanced users/teachers may upload custom board definitions in this format; custom uploads are validated (JSON schema, pin sanity, SVG/asset safety) and pass through the moderation workflow before becoming available to learners. | Must | Version pinned. Each board definition binds to an MCU core target (avr8js / rp2040js / ESP32 core) so the simulator knows how to execute firmware for that board. Custom-board approval workflow must be implemented before the feature is exposed to non-admin users. |
| UR-NFR-D005 | Wokwi's component catalogue (breadboard models, component JSON descriptors) for the Keyestudio ESP32 Learning Kit and Robotlinking starter kit component set. | Must | Where Wokwi open-source component models do not exist, RoboCode.Africa must author its own compliant models. A gap analysis against the full component catalogue (see Project Canon) must be completed before v1.0. |

### Browser Platform Dependencies

| ID | Dependency | Priority | Acceptance / Notes |
|----|------------|----------|--------------------|
| UR-NFR-D006 | **WebAssembly (WASM)** — required for in-browser AVR firmware execution (avr8js), RP2040 firmware execution (rp2040js), and optional in-browser compilation. | Must | All target browsers meeting the Section 20 supported-browser floor (Chrome/Edge ≥ 109, Firefox ≥ 115 ESR, Safari ≥ 16.4) support WASM. Server-side fallback mitigates risk for edge cases. |
| UR-NFR-D007 | **WebGL 2.0** — required for 3D simulation rendering via Three.js and React Three Fiber. | Should | Graceful fallback to 2D wokwi-elements rendering is mandatory when WebGL 2.0 is absent (see UR-NFR-A007). |
| UR-NFR-D008 | **WebAudio API** — required for buzzer and tone simulation. | Should | Silent-indicator fallback required when unavailable. |
| UR-NFR-D009 | **Web Workers / SharedArrayBuffer** — used by avr8js and rp2040js to run AVR and RP2040 simulation loops off the main thread. Some browsers restrict SharedArrayBuffer to cross-origin-isolated contexts (COOP/COEP headers required). | Must | The deployment must set `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers. This must be verified against all target browsers before launch, and applies equally to all three simulation paths (Arduino UNO R3, ESP32 DevKit, Raspberry Pi Pico). |
| UR-NFR-D010 | **Yjs CRDT library** — required for real-time collaborative project editing (see "User Requirements: Teams, Competitions and Collaboration", UR-TEAM series). | Should | MIT-licensed. Version pinned. Collaboration features degrade to save-and-share (non-real-time) mode if Yjs WebSocket provider is unavailable. |

### Third-Party Service Dependencies

#### Email and SMS

| ID | Dependency | Priority | Acceptance / Notes |
|----|------------|----------|--------------------|
| UR-NFR-D011 | A transactional email provider (AWS SES or SendGrid) is required for account verification, approval notifications, parental consent emails, and system alerts. | Must | Dual-provider configuration recommended for resilience. Delivery SLA: transactional emails within 60 seconds of trigger. |
| UR-NFR-D012 | An SMS gateway provider with Africa-region coverage (e.g., Africa's Talking, Twilio) is required for SMS-based parental consent PIN delivery and low-connectivity notifications. | Could | Required only where email is confirmed unreliable for a tenant or parent. Must be enabled per-tenant by School Admin or Super Admin. |

#### DNS, TLS and Custom Domain

| ID | Dependency | Priority | Acceptance / Notes |
|----|------------|----------|--------------------|
| UR-NFR-D013 | An ACME-compatible certificate authority (Let's Encrypt or equivalent) is required for automated TLS provisioning for school custom domains (see "User Requirements: School Onboarding, Custom Domain and White-Labelling", UR-SCH series). | Must | Certificate issuance must complete within 10 minutes of DNS verification. Certificate renewal must be fully automated. |
| UR-NFR-D014 | The school's DNS registrar must support CNAME and TXT record creation to complete custom domain verification. This is a dependency on the school's external infrastructure. | Must | RoboCode.Africa cannot provision DNS records on behalf of a school. Onboarding documentation must guide the School Admin through this step. |
| UR-NFR-D015 | A CDN/edge provider (Cloudflare or AWS CloudFront) is required for low-latency static asset delivery across Africa and globally. | Must | Edge nodes must cover at least: Johannesburg, Lagos, Nairobi, Cairo, London, Frankfurt, and US-East. Verified at pre-launch infrastructure audit. |

#### Payment Providers

| ID | Dependency | Priority | Acceptance / Notes |
|----|------------|----------|--------------------|
| UR-NFR-D016 | Payment processing for school subscription billing must be supported via at least one provider with strong Africa-region coverage. Paystack (Nigeria/Ghana/SA/Kenya), Flutterwave (pan-Africa), and Stripe (global/card) are the primary candidates. | Must | At least one provider must be live at launch. Currency support must include USD, ZAR, NGN, KES, and ZWL (or USD equivalent for Zimbabwe). |
| UR-NFR-D017 | Payment provider PCI-DSS compliance eliminates the need for RoboCode.Africa to store raw card data. The platform must use provider-hosted payment pages or tokenisation SDKs exclusively. | Must | No raw card data may be stored or logged. Traceable to SR-xxx in SSD. |

#### School SSO Identity Providers

| ID | Dependency | Priority | Acceptance / Notes |
|----|------------|----------|--------------------|
| UR-NFR-D018 | Google Workspace for Education (OAuth2/OIDC) is a supported SSO identity provider for school staff and students in tenants where the school operates Google Workspace. | Should | Tenant-level configuration by School Admin. Falls back to password login if IdP is unavailable. |
| UR-NFR-D019 | Microsoft Azure AD / Entra ID (OAuth2/OIDC) is a supported SSO identity provider for school staff and students in tenants where the school operates Microsoft 365. | Should | Same fallback policy as UR-NFR-D018. |
| UR-NFR-D020 | The platform's identity layer (NestJS Auth module, OAuth2/OIDC client) must be capable of adding further IdPs (e.g., Clever, ClassLink) in future releases without architectural change. | Could | Extensible IdP configuration is a Should-level design goal for the SSD. |

#### Infrastructure and Observability

| ID | Dependency | Priority | Acceptance / Notes |
|----|------------|----------|--------------------|
| UR-NFR-D021 | A Kubernetes-capable cloud provider with an Africa region (AWS `af-south-1` Cape Town, or equivalent) must be available for primary hosting to meet data residency expectations. | Must | Data residency of African school data within an Africa region is a regulatory expectation under Zimbabwe CDPA, POPIA, NDPR, and Kenya DPA. |
| UR-NFR-D022 | S3-compatible object storage (AWS S3 or equivalent) is required for project file storage, 3D model assets, user-uploaded content, and backup artefacts. | Must | Multi-region replication must be configured for resilience. Data encryption at rest (AES-256) is mandatory. |
| UR-NFR-D023 | OpenTelemetry-compatible observability infrastructure (Prometheus/Grafana for metrics, Sentry for error tracking, centralized structured log aggregation) is required for platform operations. | Must | Monitoring is a pre-condition for the SLA commitments in Section 20. |
| UR-NFR-D024 | GitHub Actions is the assumed CI/CD pipeline. The pipeline must gate deployments on passing test suites and security scans. | Should | CI/CD provider could change without impacting user requirements, but any replacement must offer the same gating capabilities. |

---

## Constraints

Constraints are non-negotiable boundaries imposed by law, ethics, architecture, business decisions, or the laws of physics. Unlike assumptions, constraints are not revisable in v1.0.

### Hard Technical Constraints

| ID | Constraint | Priority | Acceptance / Notes |
|----|------------|----------|--------------------|
| UR-NFR-C001 | **No physical hardware required.** The platform must operate entirely in the browser. No USB cable, serial port driver, or physical microcontroller board is needed at any point in the v1.0 user journey. | Must | This is a core product promise and must never be compromised. Physical hardware integration is explicitly out of scope (see Section 1). |
| UR-NFR-C002 | **Browser-only delivery.** The platform has no native desktop application and no native mobile application in v1.0. All functionality is delivered through a standards-compliant web browser. | Must | The responsive web must be usable on tablets and larger mobile screens. Sub-6-inch phone screens receive a graceful notification. |
| UR-NFR-C003 | **No Internet Explorer support.** Internet Explorer (all versions) is not a supported browser. | Must | IE lacks WASM, ES2020, and WebGL 2.0 support. Attempting to access the platform on IE must display a clear "unsupported browser" page with alternatives listed. |
| UR-NFR-C004 | **WASM as the simulation execution boundary.** All AVR (Arduino UNO R3) simulation must execute within the WASM sandbox provided by avr8js, and all RP2040 (Raspberry Pi Pico) simulation must execute within the WASM sandbox provided by rp2040js. No native code execution or browser plugin is permitted for any supported board. | Must | Security constraint. The WASM sandbox prevents malicious sketch or firmware code from accessing the host OS. Applies equally to Arduino UNO R3, ESP32 DevKit, and Raspberry Pi Pico simulation paths. |
| UR-NFR-C005 | **Performance ceiling on low-end devices.** On a device meeting the minimum specification (UR-NFR-A006), the 2D simulation of a circuit with up to 20 active components must achieve a minimum of 30 simulation frames per second (FPS) and a CPU AVR clock speed of at least 1 MHz simulated. 3D rendering is disabled on such devices. | Must | Measurable in performance regression tests. Failure to meet this on minimum-spec hardware blocks launch. |
| UR-NFR-C006 | **Simulation is deterministic and reproducible.** Given identical sketch firmware, component layout, and input events, the RSE must produce identical observable output every time. | Must | Required for automated grading and task auto-assessment (see "User Requirements: Learning, Courses, Tasks and Assessment", UR-LRN series). |
| UR-NFR-C007 | **Monaco editor is the mandated code editor.** The text-based programming environment in RoboCode Studio is Monaco. No other editor may be substituted in v1.0. | Must | Monaco provides LSP-compatible diagnostics, autocomplete, and accessibility features needed for the UR-CODE requirements. |

### Child-Safety and Legal Constraints

These constraints are non-negotiable. Violation of any of them constitutes a legal, regulatory, or ethical breach and blocks launch or continued operation.

| ID | Constraint | Priority | Acceptance / Notes |
|----|------------|----------|--------------------|
| UR-NFR-C008 | **Mandatory approval before account activation.** No student account (or any account for a user under 18) may be activated without an explicit approval action by a designated human approver (Super Admin, Platform Moderator, or School Admin). Automated activation without human review is not permitted for minors. | Must | Non-negotiable safety constraint. Traceable to COPPA, GDPR-K, Zimbabwe CDPA, POPIA. All onboarding flows must enforce this gate. |
| UR-NFR-C009 | **Verifiable parental consent for minors.** Students identified as under 13 (COPPA jurisdictions) or under 16 (GDPR-K jurisdictions) must obtain verifiable parental or guardian consent before any personal data beyond that strictly necessary for consent collection is processed. | Must | The consent mechanism must be verifiable (not merely a tick-box). Acceptable mechanisms: email-confirmed link, SMS-PIN, or school-proxy attestation with uploaded document. |
| UR-NFR-C010 | **No open private messaging between minors.** No feature of the platform may allow unsupervised, unmoderated private messaging between two or more students who are minors. All student communication channels must be visible to their supervising Teacher and, where applicable, their School Admin. | Must | Absolute safety constraint. Any "direct message" equivalent must route through a supervised channel. |
| UR-NFR-C011 | **No behavioural advertising.** No student behavioural data (browsing history, project content, learning behaviour, gamification activity) may be used for advertising targeting, sold to third parties, or processed for commercial profiling purposes. | Must | Permanent policy constraint. Traceable to age-appropriate design code, GDPR-K, COPPA, and platform privacy policy. |
| UR-NFR-C012 | **Data minimisation for minors.** The platform may only collect personal data from minor students that is strictly necessary for the platform's educational service delivery. No optional data fields beyond educational necessity may be presented to minors during signup or in profile management. | Must | Traceable to GDPR Article 5(1)(c), COPPA, and POPIA Section 10. |
| UR-NFR-C013 | **Right to erasure.** A Parent/Guardian or a student who has reached the age of majority may request erasure of their account and associated personal data. The platform must be able to satisfy a verified erasure request within 30 calendar days. | Must | Traceable to GDPR Article 17, Zimbabwe CDPA, POPIA, Kenya DPA. System architecture must support per-user data deletion without cascade impact on aggregated anonymised analytics. |
| UR-NFR-C014 | **Audit logging is mandatory.** All account approval/rejection actions, consent events, content-moderation decisions, safeguarding escalations, manual RoboPoints adjustments, and admin configuration changes must be recorded in a tamper-evident audit log. Retention follows the authoritative retention schedule in Section 15 (UR-COMM-062 to UR-COMM-065): standard platform audit log minimum 12 months; consent records account-lifetime + 3 years; safeguarding records minimum 7 years (or the longer period required by the most stringent applicable jurisdiction). | Must | Audit logs must be accessible to Super Admin and, for tenant-scoped events, School Admin. Audit log data is not deletable under a student erasure request (legal obligation). |
| UR-NFR-C015 | **Content moderation and PII filtering.** All user-generated text content (project names, descriptions, comments, forum posts) must pass through automated profanity and PII filtering before publication. Content failing the filter must be held for human-moderator review rather than silently dropped or published. | Must | Profanity/PII filter lists must be maintainable by Super Admin and Platform Moderator without code deployment. |
| UR-NFR-C016 | **Jurisdiction-appropriate age thresholds.** The platform applies the single authoritative age-threshold model defined in Section 6 (UR-ONB-027), which separates two distinct thresholds: (a) **verifiable parental consent** is required below the digital-consent age — COPPA under-13 (US), GDPR-K under-16 (EU), defaulting to under-16 when jurisdiction is ambiguous; (b) **heightened child-protection treatment and mandatory human approval** (UR-NFR-C008) apply to any minor under 18, reflecting the under-18 protections of the Zimbabwe CDPA and POPIA. The platform always applies the more protective obligation. | Must | Threshold logic must be reviewed by legal counsel before launch and whenever a new target jurisdiction is added. Consistent with UR-ONB-027 and Section 5 minor-protection requirements (UR-ONB-090..096). |

### Multi-Tenancy Constraints

| ID | Constraint | Priority | Acceptance / Notes |
|----|------------|----------|--------------------|
| UR-NFR-C017 | **Tenant data isolation.** Data belonging to one Tenant (school) must never be accessible to users of another Tenant, regardless of role. Isolation is enforced at the database layer via PostgreSQL Row-Level Security (RLS) using `tenant_id` column scoping. | Must | Any query that does not filter by `tenant_id` at the application layer must be rejected by RLS at the DB layer. Verified by automated data-isolation tests as part of the CI/CD pipeline. |
| UR-NFR-C018 | **Tenant subdomain uniqueness.** Each school subdomain (`school.robocode.africa`) must be globally unique within the platform. A subdomain once assigned to a school may not be reassigned to a different school while user data exists for the original school. | Must | Subdomain uniqueness is enforced at registration time. Retired subdomains must be quarantined for a minimum of 2 years. |
| UR-NFR-C019 | **Custom domain TLS is mandatory.** If a school configures a custom domain, TLS (HTTPS) must be provisioned automatically before the domain is made live. Custom domains without valid TLS must not be activated. | Must | Enforces minimum data-in-transit security and browser security model compliance. |

### Accessibility Constraints

| ID | Constraint | Priority | Acceptance / Notes |
|----|------------|----------|--------------------|
| UR-NFR-C020 | **WCAG 2.2 Level AA compliance.** All user-facing pages and components, including RoboCode Studio, must meet WCAG 2.2 Level AA success criteria. This is a non-negotiable constraint for all markets and is especially important given the educational context. | Must | Verified by automated axe/Lighthouse scans (CI gate) and manual assistive-technology testing before each major release. |
| UR-NFR-C021 | **Keyboard navigability.** All interactive elements within RoboCode Studio and the broader platform must be fully operable by keyboard alone, without reliance on a mouse or touch input. | Must | Critical for students with motor impairments. Canvas drag-and-drop must have a keyboard-accessible alternative (e.g., component palette with directional placement keys). |

### Budget and Commercial Constraints

| ID | Constraint | Priority | Acceptance / Notes |
|----|------------|----------|--------------------|
| UR-NFR-C022 | **Africa-affordable pricing.** The platform's subscription pricing and per-student cost must be set to be accessible to public and semi-government schools in sub-Saharan Africa. Premium features must not wall off core educational functionality. | Must | Pricing is a business constraint, not a technical one, but it bounds the infrastructure cost that can be passed to schools. A free tier or government-subsidised tier is a Should-level commitment for v1.0. |
| UR-NFR-C023 | **Open-source component licence compliance.** All Wokwi open-source libraries (wokwi-elements, avr8js, rp2040js, wokwi-boards) are MIT-licensed. Any modification or derivative work introduced by RoboCode.Africa must comply with the MIT licence terms. Licence compliance must be verified by an automated FOSS licence scanner in the CI/CD pipeline. | Must | Failure to comply could result in licence revocation and loss of access to core simulation dependencies. |
| UR-NFR-C024 | **No permanent vendor lock-in for core simulation.** The RSE must be architected so that avr8js, rp2040js, or wokwi-elements can be replaced with an alternative simulation library without requiring a rewrite of the entire Studio frontend. Abstraction interfaces (adapters) must exist for each MCU core target. | Should | Risk mitigation against upstream library abandonment or licence change. Applies equally to avr8js (AVR), rp2040js (RP2040), and ESP32 core simulation. Traceable to SSD architecture requirements. |

### Scope and Timeline Constraints

| ID | Constraint | Priority | Acceptance / Notes |
|----|------------|----------|--------------------|
| UR-NFR-C025 | **v1.0 first-class board support covers three boards: Arduino UNO R3 (ATmega328P, simulated by avr8js), ESP32 DevKit (ESP-WROOM-32, ESP32 core simulation), and Raspberry Pi Pico (RP2040, simulated by rp2040js).** The extensible wokwi-boards board library ships built in and allows admins and approved teachers to add custom board definitions without a code change. Arduino Nano, ESP8266, and Pico W are roadmap items and must not delay v1.0. | Must | Confirmed in Project Canon and Section 1 (Out of Scope). Requirements referencing Nano, ESP8266, or Pico W are labelled Won-t for v1.0. Custom board upload requires the moderation workflow defined in UR-NFR-D004a to be implemented first. |
| UR-NFR-C026 | **Block-based mode transpiles to text code, not to firmware directly.** The block editor (for primary-school students) must produce an intermediate text representation (Arduino C/C++ or MicroPython) that is then compiled or interpreted by the standard execution paths. Block mode cannot bypass the RSE. | Must | Ensures consistency of simulation output and prevents the block mode from becoming a parallel unmaintainable execution path. |
| UR-NFR-C027 | **AI/ML model training is out of scope for v1.0.** AI as a curriculum topic (learning about AI) and AI-assisted coding hints are in scope; in-browser neural-network training or edge-AI model deployment are explicitly deferred. | Won-t | Confirmed in Section 1 (Out of Scope). Any requirement proposing in-browser ML training is rejected for v1.0. |

---

## Dependency Risk Register

The table below summarises the highest-risk dependencies and their mitigations. It is intended as a living artefact, updated as the project progresses.

| Dependency | Risk Description | Likelihood | Impact | Mitigation |
|------------|-----------------|------------|--------|------------|
| avr8js (Wokwi) | Library abandoned or relicensed | Low | Critical | Maintain an internal fork; abstraction adapter allows swap to alternative; monitor GitHub activity |
| rp2040js (Wokwi) | Library abandoned, relicensed, or RP2040 peripheral support incomplete | Low | Critical | Maintain an internal fork; same abstraction adapter pattern as avr8js; monitor GitHub activity |
| wokwi-boards | Custom board schema breaks on wokwi-boards format update | Low | Medium | Pin schema version; validate custom board manifests against pinned JSON schema at upload time |
| wokwi-elements | Breaking API change in minor version | Medium | High | Pin exact version in `package.json`; lock file committed; canary upgrade process in CI |
| WASM toolchain (AVR-GCC) | Toolchain size too large for client-side load (>50 MB) | Medium | High | Compile microservice as primary path; WASM compile as optional enhancement |
| ESP32 simulation | No mature open-source ESP32 core simulation available | Medium | High | Fallback to RVM interpreted mode for ESP32 in v1.0 if simulation core is unready |
| Let's Encrypt / ACME | Rate limits on certificate issuance for many custom domains | Low | Medium | Wildcard certificate for `*.robocode.africa`; per-school custom cert via ACME with rate-limit monitoring |
| Africa's Talking / SMS | SMS delivery failure in specific country | Medium | Low | Email as primary; SMS as optional fallback; dual-provider SMS configuration in roadmap |
| Cloudflare / CloudFront | Edge node outage in Africa region | Low | Medium | Dual-CDN configuration; origin fallback; SLA monitoring |
| Payment provider (Paystack) | Service outage or jurisdiction expansion blocked | Low | Medium | Dual-provider (Paystack + Flutterwave/Stripe) at launch |

---

## Summary of Key Constraints by Category

```
  Constraint Summary
  ==================

  CATEGORY          | COUNT | HARDEST CONSTRAINT
  ------------------+-------+--------------------------------------------
  Technical         |   7   | No physical hardware; WASM sandbox only
  Child Safety/Legal|   9   | Mandatory human approval; no open DMs;
                    |       | no behavioural advertising; verifiable consent
  Multi-Tenancy     |   3   | RLS isolation; subdomain uniqueness; TLS
  Accessibility     |   2   | WCAG 2.2 AA; keyboard navigability
  Budget/Commercial |   3   | Africa-affordable; OSS licence compliance;
                    |       | no vendor lock-in for simulation core
  Scope/Timeline    |   3   | UNO R3 + ESP32 + Pico; wokwi-boards
                    |       | extensible library; blocks→text→RSE;
                    |       | no in-browser ML training
  ------------------+-------+--------------------------------------------
  TOTAL CONSTRAINTS |  27   |
```

---

## Cross-References

The following sections of this URD and the companion SSD are directly informed by the assumptions, dependencies, and constraints above.

| This Section | Related Section / ID |
|--------------|----------------------|
| UR-NFR-A001 – A005 (connectivity tiers) | Section 20: Non-Functional User Expectations; Section 10: Simulation Experience (UR-SIM series) |
| UR-NFR-A006 – A011 (device/browser) | Section 9: RoboCode Studio Canvas (UR-STU series); Section 11: Code Editor (UR-CODE series) |
| UR-NFR-A012 – A016 (school IT) | Section 8: School Onboarding (UR-SCH series); Section 16: Administration (UR-ADM series) |
| UR-NFR-A017 – A020 (parental consent) | Section 6: Onboarding, Signup and Approval (UR-ONB series) |
| UR-NFR-D001 – D005 (Wokwi libraries: wokwi-elements, avr8js, rp2040js, wokwi-boards, component catalogue) | Section 9 (UR-STU series); Section 10 (UR-SIM series); SSD FR-SIM-xxx |
| UR-NFR-D006 – D010 (browser APIs) | Section 10 (UR-SIM series); Section 11 (UR-CODE series) |
| UR-NFR-D011 – D012 (email/SMS) | Section 6 (UR-ONB series); Section 15: Communication, Notifications and Safety (UR-COMM series) |
| UR-NFR-D013 – D015 (DNS/TLS/CDN) | Section 8 (UR-SCH series); SSD NFR-PERF-xxx, SR-xxx |
| UR-NFR-D016 – D017 (payments) | Section 8 (UR-SCH series); Section 16 (UR-ADM series) |
| UR-NFR-D018 – D020 (SSO IdPs) | Section 7: Authentication and Account Management (UR-AUTH series) |
| UR-NFR-D021 – D024 (infrastructure) | Section 20; SSD NFR-xxx |
| UR-NFR-C001 – C007 (technical) | Sections 9, 10, 11 (Studio, simulation, editor); SSD FR-SIM-xxx, FR-CODE-xxx |
| UR-NFR-C008 – C016 (child safety/legal) | Section 6 (UR-ONB); Section 15 (UR-COMM); SSD SR-xxx, DR-xxx |
| UR-NFR-C017 – C019 (multi-tenancy) | Section 8 (UR-SCH); SSD FR-TEN-xxx, SR-xxx |
| UR-NFR-C020 – C021 (accessibility) | Section 20; all Studio sections; SSD NFR-ACC-xxx |
| UR-NFR-C022 – C024 (commercial) | Section 8 (UR-SCH); Section 16 (UR-ADM) |
| UR-NFR-C025 – C027 (scope/timeline: three first-class boards + wokwi-boards extensible library; blocks→text→RSE; no in-browser ML) | Section 1 (Out of Scope); Section 9 (UR-STU); Section 12 (UR-LRN) |
