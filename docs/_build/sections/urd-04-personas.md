# User Personas

## Overview

This section presents seven representative personas that collectively span the full RoboCode.Africa user base. Each persona is grounded in realistic device, bandwidth, literacy and motivational contexts drawn from the African primary and secondary education landscape. The personas inform requirement prioritisation throughout the URD and should be consulted when evaluating any feature proposal or acceptance criterion.

The personas map directly to the seven User Roles defined in the Stakeholders and User Classes section and the permissions matrix in the User Roles and Permissions Matrix section. Cross-references to specific user requirements appear as requirement IDs (e.g., UR-ONB-001) and use cases (e.g., UC-001).

---

## Persona 1 — Amara Diallo (Primary Student)

### Profile

| Attribute | Detail |
|-----------|--------|
| Name | Amara Diallo |
| Age | 9 years old |
| Role | Student (primary school, Grade 4) |
| Location | Harare, Zimbabwe (urban public school) |
| Device | Shared school computer lab, Windows 10, 4 GB RAM, integrated Intel graphics |
| Browser | Chrome 120 (school-managed) |
| Connectivity | 4 Mbps school Wi-Fi shared across 30 students; occasional mobile-data fallback via teacher hotspot |
| Language | English (second language; Shona is first language) |
| Parent/Guardian | Mother, semi-literate in English, has a smartphone |

### Biography

Amara is a lively, curious nine-year-old who loves drawing robots in her exercise book and asking her teacher how phones "know things". She has limited prior exposure to computers beyond typing exercises and occasional YouTube videos. Her school recently joined RoboCode.Africa as a tenant (school subdomain: `harare-primary.robocode.africa`). Amara shares a computer with one other student during 45-minute weekly sessions supervised by her teacher, Mr. Tendai. Her mother signed a paper consent form that the school digitised on her behalf; Amara's account required School Admin approval before activation, per the platform safety-first directive (UR-ONB-002, UR-ONB-006).

### Goals

- Drag LED, buzzer and button components onto the canvas and see them light up or beep without needing to type code first.
- Earn RoboPoints and show her progress sticker to her mother.
- Complete guided "Try It" missions that tell her exactly what to do next.
- Understand simple cause-and-effect: "press button → LED turns on."

### Frustrations

- Interfaces with small hit targets are hard to use on a low-resolution 1366×768 monitor with a worn trackpad.
- English-only instructions slow her down; she sometimes asks a classmate to translate.
- The shared computer is slow; long loading times mean she loses half her session.
- She has forgotten her password twice and cannot reset it herself because her email address belongs to the school.

### How RoboCode.Africa Helps

- The block-based drag-and-drop mode (UR-CODE-001) removes the need to write C/C++ syntax; Amara builds logic visually.
- Component drag-and-drop on the 2D canvas (UR-SIM-001) with large snap targets is accessible on a trackpad.
- Graceful 3D-to-2D fallback (UR-SIM-009) ensures the simulation renders on low-end integrated graphics without WebGL failures.
- RoboPoints and achievement badges (UR-GAM-001) provide tangible progress she can show at home.
- The Teacher (Mr. Tendai) can reset her password directly from the class dashboard (UR-AUTH-005), removing the dependency on a personal email.
- Guided "Step-by-Step" task mode (UR-LRN-003) provides scaffolded instructions in plain language appropriate for younger learners.
- CDN/edge delivery of static content and long browser caching of course assets (UR-NFR-070, UR-NFR-081) reduce the impact of shared low-bandwidth connectivity. (Persistent offline/PWA operation is out of scope for v1.0 per Section 1 and UR-NFR-A003.)

### Representative Quote

> "I pressed the button and the light went ON! Can I make it blink?"

---

## Persona 2 — Tafadzwa Moyo (High-School Maker)

### Profile

| Attribute | Detail |
|-----------|--------|
| Name | Tafadzwa Moyo |
| Age | 15 years old |
| Role | Student (high school, Form 3) |
| Location | Bulawayo, Zimbabwe (private high school) |
| Device | Personal laptop, Ubuntu 22.04, 8 GB RAM, NVIDIA GTX 1050 |
| Browser | Firefox 124 |
| Connectivity | 20 Mbps home fibre; school Wi-Fi 10 Mbps |
| Language | English (fluent) |
| Parent/Guardian | Father, software developer |

### Biography

Tafadzwa discovered electronics at age 12 when his father showed him how to wire an LED to a battery. He has since built several physical Arduino projects at home and has a growing GitHub account. He joined RoboCode.Africa through his school's subdomain (`private-high-byo.robocode.africa`) and immediately navigated past the block editor into the Arduino C/C++ text mode. He uses RoboCode Studio after school to prototype wiring layouts before buying physical components, saving pocket money. He is considering entering the upcoming national RoboCode.Africa robotics competition.

### Goals

- Write real Arduino C/C++ sketches in Monaco editor with autocomplete and compile-and-run against the avr8js AVR simulator (UR-CODE-004, UR-SIM-003).
- Wire HC-SR04 ultrasonic sensors, servo motors and L298N motor drivers on the breadboard canvas and verify logic before touching physical hardware.
- Save, version and share projects with teammates via collaborative editing (UR-TEAM-002).
- Push himself toward a top-10 leaderboard ranking to secure a competition slot (UR-GAM-005).

### Frustrations

- Simulation accuracy matters to him; any mismatch between simulated and real hardware behaviour wastes physical build time.
- He wants to import his own `.ino` files rather than paste code manually.
- The IDE must support the full Arduino standard library, not a stripped subset.
- He dislikes platforms that treat him like a beginner after he has demonstrated mastery.

### How RoboCode.Africa Helps

- The accurate compiled path (avr8js + in-browser WASM toolchain or compile microservice) runs his real sketch firmware on the ATmega328P simulator, ensuring high fidelity (UR-SIM-005).
- Monaco editor provides full Arduino C/C++ syntax highlighting, real-time lint diagnostics, and library autocomplete (UR-CODE-002, UR-CODE-003).
- The full component catalogue — including HC-SR04, SG90 servo, L298N, and NeoPixel strip — is available on the canvas (UR-SIM-002).
- Project file import/export (UR-CODE-008) allows him to bring existing `.ino` and wiring JSON files in and out of the studio.
- Adaptive skill tracking skips beginner steps once a mastery threshold is met (UR-LRN-009).
- Teams and competition modules (UR-TEAM-001, UR-GAM-005) connect him to peer challengers and the leaderboard.

### Representative Quote

> "If the simulation matches what my physical board does, I can design at night and build at the weekend. That's how I want to work."

---

## Persona 3 — Chidinma Okafor (Competitive Team Captain)

### Profile

| Attribute | Detail |
|-----------|--------|
| Name | Chidinma Okafor |
| Age | 16 years old |
| Role | Student (high school, team captain) |
| Location | Lagos, Nigeria (international school) |
| Device | MacBook Air M2, macOS 14, 16 GB RAM |
| Browser | Chrome 124 |
| Connectivity | 50 Mbps home fibre; school Wi-Fi 25 Mbps |
| Language | English (fluent), Igbo (conversational) |
| Parent/Guardian | Both parents are professionals; mother is the consent holder |

### Biography

Chidinma is a driven, organised student who captains her school's five-person robotics team. She discovered a passion for AI and embedded systems last year and has since led her team to two regional competition finals. Her school (`intl-lagos.robocode.africa`) is a premium tenant with white-label branding and full seat allocation. Chidinma coordinates task assignments, reviews teammates' code, and communicates with her teacher-mentor through the platform's supervised messaging system. She is acutely aware that her team's leaderboard position determines their entry into the RoboCode.Africa Pan-Africa Championship.

### Goals

- Assign sub-tasks to team members, track individual contributions and merge work in a shared collaborative project (UR-TEAM-002, UR-TEAM-005).
- Review teammates' code and wiring in real time using co-edit mode and leave structured comments (UR-TEAM-006).
- Monitor the team's aggregate RoboPoints and competition rank against other school teams on the national and continental leaderboard (UR-GAM-005, UR-GAM-006).
- Access 3D simulation view to produce screen-recorded demos for competition presentations (UR-SIM-007).

### Frustrations

- Collaboration features must allow simultaneous editing without conflicts overwriting each other's work.
- The platform must enforce moderated channels; she does not want unsupervised direct messages creating safeguarding issues for younger teammates.
- Competition rules and deadlines need to be visible in-platform so the team never misses a submission window.
- Role-based task locking should prevent a teammate from accidentally deleting another's component layout.

### How RoboCode.Africa Helps

- Yjs CRDT-based real-time collaborative editing (UR-TEAM-002) prevents conflicts and shows live cursors per collaborator.
- Moderated team messaging (UR-COMM-003) ensures all communication is supervised by the teacher-mentor and audited, satisfying the platform safeguarding directive.
- Competition module (UR-GAM-005) surfaces deadline countdowns, submission gates, and judge-facing project snapshots.
- 3D simulation mode via Three.js/React Three Fiber (UR-SIM-007) allows high-fidelity screen captures for presentation materials.
- Per-task role locking (UR-TEAM-005) lets Chidinma assign ownership of specific canvas regions or code modules to individual teammates.
- Leaderboards display team and individual ranks filterable by school, region and competition tier (UR-GAM-006).

### Representative Quote

> "I need to see everyone's progress at a glance and know we're on track before the submission deadline. The platform has to keep us coordinated, not just individually coding."

---

## Persona 4 — Mr. Tendai Ncube (Secondary-School STEM Teacher)

### Profile

| Attribute | Detail |
|-----------|--------|
| Name | Mr. Tendai Ncube |
| Age | 34 years old |
| Role | Teacher / Educator |
| Location | Harare, Zimbabwe (same school as Amara, Persona 1) |
| Device | School-issued Windows 11 laptop, 8 GB RAM; personal Android phone |
| Browser | Chrome 122 (laptop); Chrome Mobile (phone) |
| Connectivity | 4 Mbps school Wi-Fi; 3G/4G mobile data at home |
| Language | English (fluent), Shona |
| Background | Bachelor of Education (Science), 8 years teaching Physics and ICT |

### Biography

Mr. Tendai is passionate about making electronics tangible for students who have never held a circuit board. He manages two classes of 35 students each, running weekly 45-minute computer-lab sessions. He creates his own structured tasks in RoboCode Studio, grades submitted projects, and monitors student progress from a class dashboard. He has moderate technical skill — comfortable with spreadsheets and basic JavaScript — but is not a software developer. He relies on the platform to handle simulation accuracy so he can focus on pedagogy. He also acts as the first safeguarding contact for his classes, receiving escalated content moderation alerts.

### Goals

- Create, clone and assign coding tasks and robotics projects to specific classes with configurable deadlines and rubrics (UR-LRN-001, UR-LRN-002).
- Monitor per-student progress in real time: time-on-task, component placements, code submissions, RoboPoints earned (UR-ADM-003, UR-LRN-007).
- Grade and annotate student project submissions with structured feedback (UR-LRN-006).
- Receive automated alerts when a student's project triggers content moderation or safeguarding flags (UR-COMM-007).
- Reset student passwords and manage class membership without waiting for School Admin intervention (UR-AUTH-005).

### Frustrations

- A class dashboard that is slow or requires many clicks to find a single student's work wastes precious lab time.
- He cannot realistically review 70 individual submissions manually; he needs automated scoring support for objective criteria.
- School bandwidth limits mean large 3D assets must not block page load when he is demoing to the full class on a projector.
- He wants to share his task templates with colleagues at other schools but is uncertain about content ownership and licensing.

### How RoboCode.Africa Helps

- The Teacher dashboard (UR-ADM-003) provides a class-level activity feed, per-student progress tiles and submission inbox in a single view.
- Auto-grading for objective criteria (correct component wiring, expected pin states, passing test cases) reduces manual review burden (UR-LRN-006).
- Annotation tools allow him to place inline comments on student code and canvas screenshots (UR-LRN-006).
- Safeguarding escalation module (UR-COMM-007) sends immediate notifications to his dashboard and email when a flagged event occurs in his class.
- Password reset for class members is a one-click Teacher action (UR-AUTH-005), scoped to his own classes only.
- Global content library sharing (UR-LRN-010) lets him publish task templates for use by teachers at other tenant schools, with licensing attribution.
- Progressive loading strategy and 3D-to-2D fallback (UR-SIM-009) ensure projector demos do not stall on the shared connection.

### Representative Quote

> "I want my students to experience the 'aha' moment when the LED blinks, and I want to be told instantly if something inappropriate is going on. Everything else can be automatic."

---

## Persona 5 — Mrs. Faith Sibanda (School Admin / IT Coordinator)

### Profile

| Attribute | Detail |
|-----------|--------|
| Name | Mrs. Faith Sibanda |
| Age | 42 years old |
| Role | School Admin (Tenant Admin) |
| Location | Gweru, Zimbabwe (mid-size government secondary school) |
| Device | Windows 10 desktop, 8 GB RAM; personal iPhone 13 |
| Browser | Edge 122 (desktop); Safari (phone) |
| Connectivity | 8 Mbps school fibre; home 4G |
| Language | English, Ndebele |
| Background | BSc Computer Science, 12 years as school IT coordinator |

### Biography

Mrs. Sibanda is the school's de facto technology leader. She negotiated the RoboCode.Africa subscription, set up the school subdomain (`gweru-secondary.robocode.africa`), and now manages teacher accounts, student roster imports, seat limits and billing queries on behalf of the school principal. She is meticulous about data protection and expects the platform to enforce GDPR-K and Zimbabwe's Cyber and Data Protection Act without requiring her to configure it manually. She is also responsible for configuring the school's white-label branding (school logo and colours) and enabling Google SSO for staff.

### Goals

- Self-service subdomain and optional custom domain setup with guided CNAME/TXT DNS verification and automated TLS provisioning (UR-SCH-001, UR-SCH-002).
- Bulk import student and teacher rosters via CSV or direct Google Classroom / Microsoft 365 directory sync (UR-SCH-004).
- Approve or reject individual student signup requests that arrive in the school queue, with filters by class group (UR-ONB-004).
- Configure white-label branding: upload school logo, set primary and secondary colour tokens, apply to the school subdomain (UR-SCH-005).
- View a school-level compliance dashboard showing consent status, data residency settings and audit log export (UR-ADM-005).

### Frustrations

- DNS configuration steps are error-prone if the guidance is vague; she needs exact record values and live propagation feedback.
- Billing and seat-count management should not require calls to a sales team; self-service is essential.
- She is accountable if a minor's data is mishandled; the platform must surface compliance status clearly, not bury it in settings.
- Single Sign-On must work reliably with the school's existing Google Workspace directory so teachers do not manage a separate set of credentials.

### How RoboCode.Africa Helps

- The School Admin onboarding wizard (UR-SCH-001) provides step-by-step DNS configuration with record previews, a propagation status checker and automated Let's Encrypt TLS provisioning.
- Roster import (UR-SCH-004) accepts CSV and Google Classroom / Microsoft 365 sync, with a dry-run diff showing additions and removals before commit.
- The student approval queue (UR-ONB-004) supports bulk approve/reject with filter and search, and sends automated welcome or rejection emails.
- White-label branding is applied via design tokens (Tailwind CSS custom theme) scoped to the school subdomain (UR-SCH-005); changes are previewed before publish.
- Self-service billing portal (UR-ADM-006) shows current seat usage, invoice history and upgrade/downgrade options.
- A compliance dashboard (UR-ADM-005) lists each student's consent status, account age, data residency setting and last activity, with a one-click audit-log CSV export for regulatory submissions.
- Google and Microsoft OIDC SSO for staff (UR-AUTH-003) are configured through a guided integration panel requiring only the school's tenant domain.

### Representative Quote

> "I need to set this up once, know it's compliant, and then manage it in ten minutes a week. I don't have time for IT tickets every time a student forgets a password."

---

## Persona 6 — Mr. Solomon Osei (Parent / Guardian)

### Profile

| Attribute | Detail |
|-----------|--------|
| Name | Mr. Solomon Osei |
| Age | 47 years old |
| Role | Parent / Guardian |
| Location | Accra, Ghana |
| Device | Android smartphone (Samsung Galaxy A14), 4 GB RAM |
| Browser | Chrome Mobile 124 |
| Connectivity | 4G mobile data; variable signal |
| Language | English, Twi |
| Background | Small business owner; no technical background |
| Child | Kwame Osei, 11 years old, primary student |

### Biography

Solomon's son Kwame attends a private primary school in Accra that recently onboarded to RoboCode.Africa. When the school sent home a consent request — delivered via email and SMS link — Solomon was asked to verify his identity and provide parental consent for Kwame's account before it could be activated. Solomon is supportive of technology education but cautious about screen time and online safety. He checks Kwame's progress once a fortnight and occasionally helps him complete a "Take It Home" challenge that the platform makes accessible without requiring a student login.

### Goals

- Receive a clear, plain-language consent request by email and SMS with a simple verification step that works on a smartphone (UR-ONB-006, UR-COMM-001).
- View a read-only progress summary for Kwame: courses completed, RoboPoints earned, teacher feedback, time spent on platform (UR-ADM-004).
- Be notified if the platform detects a safeguarding concern involving Kwame's account (UR-COMM-007).
- Withdraw consent and request data deletion for Kwame's account at any time through a self-service link (UR-ONB-008).

### Frustrations

- Consent forms that are long, legal-heavy or require desktop access are barriers; he needs mobile-first, plain-language flows.
- He has no desire to learn the platform itself; he just wants assurance his son is safe and progressing.
- Notifications should be meaningful — not spam — and must reach him via SMS if email bounces.
- He should never be able to accidentally alter his son's course or settings while browsing the parent view.

### How RoboCode.Africa Helps

- The parental consent flow (UR-ONB-006) is a mobile-responsive, two-step process: email/SMS link → identity check (full name + child's school ID) → digital signature. Compliant with COPPA, GDPR-K, and Ghana Data Protection Act.
- The Parent Progress View (UR-ADM-004) is a read-only, mobile-optimised summary card: current course, last session date, RoboPoints, teacher comments. No platform features are accessible from this view.
- Safeguarding alerts (UR-COMM-007) are delivered via both email and SMS with a one-tap acknowledgement link.
- Consent withdrawal and data-deletion request (UR-ONB-008) is a single authenticated action from the parent portal, triggering a right-to-erasure workflow audited under GDPR-K and local regulations.
- SMS fallback (UR-COMM-002) ensures communication reaches Solomon even when email deliverability is unreliable on mobile data.

### Representative Quote

> "I just need to know Kwame is safe, learning something real, and that I can pull him off the platform immediately if I need to."

---

## Persona 7 — Rutendo Chikwanda (Platform Operations Admin)

### Profile

| Attribute | Detail |
|-----------|--------|
| Name | Rutendo Chikwanda |
| Age | 29 years old |
| Role | Super Admin (RoboCode.Africa platform operator) |
| Location | Harare, Zimbabwe (remote-first; also travels to Nairobi and Lagos) |
| Device | MacBook Pro M3, macOS 14, 32 GB RAM; dual monitors |
| Browser | Chrome 124 + Arc |
| Connectivity | 100 Mbps fibre at home office; enterprise Wi-Fi on the road |
| Language | English (fluent), Shona |
| Background | BSc Computer Science, 5 years SaaS operations and DevOps |
| MFA | TOTP enforced on all admin actions |

### Biography

Rutendo is one of two Super Admins at RoboCode.Africa (the other is the CTO). She is responsible for day-to-day platform operations: onboarding new school tenants, approving direct-signup students, monitoring system health, escalating content moderation incidents, managing the global component and course library, and coordinating billing with partner schools across seven African countries. She is deeply technical and uses the admin panel, direct database queries (read-only replica), OpenTelemetry dashboards, and Sentry error tracking daily. She is the final escalation point for safeguarding incidents.

### Goals

- Onboard a new school tenant end-to-end: create tenant record, configure subdomain, set seat limit, assign initial School Admin, trigger welcome email sequence (UR-SCH-001, UR-ADM-001).
- Review and approve or reject direct-signup student accounts from the platform approval queue, with contextual information to assess legitimacy (UR-ONB-003).
- Monitor real-time platform health: active simulation sessions, CPU/memory per microservice, error rates, WebSocket connection counts (UR-NFR-005).
- Manage the global content library: publish, retire or promote community-contributed tasks and component models (UR-LRN-010).
- Investigate and escalate safeguarding incidents: view full audit trail, communicate with School Admin and, if required, law enforcement liaison (UR-COMM-008).
- Manage platform billing and subscription plans for all tenants, including grace-period enforcement and seat overages (UR-ADM-006).

### Frustrations

- The admin panel must present a 360° view of any user or tenant without requiring direct database access for routine tasks.
- Safeguarding incident workflows must be time-stamped, immutable and exportable; any gap in the audit trail is a compliance failure.
- Cross-tenant content must never leak between school subdomains, even during bulk operations; Postgres Row-Level Security enforcement must be visibly verifiable.
- System health alerts must arrive via PagerDuty integration, not just a dashboard she has to proactively check.

### How RoboCode.Africa Helps

- The Super Admin tenant management panel (UR-ADM-001) provides a full tenant directory with one-click drill-down into any school's configuration, users, billing and audit events.
- The direct-signup approval queue (UR-ONB-003) shows each applicant's self-declared school, age, email domain and risk signals, enabling informed approve/reject decisions with a reason recorded for audit.
- Platform health monitoring (UR-NFR-005) is exposed via an embedded Grafana dashboard surfacing OpenTelemetry metrics, Prometheus alerts and Sentry error streams, with PagerDuty webhook integration for on-call escalation.
- The global content library management interface (UR-LRN-010) supports draft, review, published and retired lifecycle states with contributor attribution and version history.
- Safeguarding incident records (UR-COMM-008) are append-only, cryptographically timestamped, and exportable as signed PDF bundles for regulatory or legal use.
- RLS tenant isolation is surfaced in the admin panel as a live tenant-context indicator that changes colour when a Super Admin is viewing cross-tenant data, reducing the risk of accidental data exposure.

### Representative Quote

> "I need to be everywhere at once — tenant config, student safety, system uptime. The admin panel has to be my single source of truth, and the audit log has to be airtight."

---

## Persona Summary Table

| # | Name | Age | Role | Device Class | Connectivity | Key Concern |
|---|------|-----|------|-------------|-------------|-------------|
| 1 | Amara Diallo | 9 | Student (primary) | Shared low-end PC | 4 Mbps shared | Accessibility, consent, simplicity |
| 2 | Tafadzwa Moyo | 15 | Student (high school) | Personal mid-range laptop | 10–20 Mbps | Simulation fidelity, real code |
| 3 | Chidinma Okafor | 16 | Student (team captain) | MacBook Air M2 | 25–50 Mbps | Collaboration, competition |
| 4 | Mr. Tendai Ncube | 34 | Teacher / Educator | School laptop + phone | 4 Mbps shared | Class management, safeguarding |
| 5 | Mrs. Faith Sibanda | 42 | School Admin | Desktop + iPhone | 8 Mbps | Compliance, self-service setup |
| 6 | Mr. Solomon Osei | 47 | Parent / Guardian | Budget Android phone | 4G mobile | Consent, safety visibility |
| 7 | Rutendo Chikwanda | 29 | Super Admin | High-end MacBook Pro | 100 Mbps | Tenant ops, audit integrity |

---

## Persona-to-Requirement Traceability

The table below maps each persona to the primary requirement areas it informs. Detailed requirements are specified in the named sections.

| Persona | Primary Requirement Areas |
|---------|--------------------------|
| Amara Diallo | UR-ONB, UR-AUTH, UR-SIM, UR-CODE (block mode), UR-LRN, UR-GAM, UR-NFR |
| Tafadzwa Moyo | UR-SIM, UR-CODE (text/compiled mode), UR-LRN, UR-GAM, UR-TEAM |
| Chidinma Okafor | UR-TEAM, UR-GAM, UR-SIM, UR-CODE, UR-COMM |
| Mr. Tendai Ncube | UR-LRN, UR-ADM, UR-COMM, UR-AUTH, UR-GAM |
| Mrs. Faith Sibanda | UR-SCH, UR-ONB, UR-ADM, UR-AUTH, UR-COMM |
| Mr. Solomon Osei | UR-ONB, UR-COMM, UR-ADM (parent view) |
| Rutendo Chikwanda | UR-ADM, UR-ONB, UR-SCH, UR-COMM, UR-NFR |
