# Product Vision, Goals and Objectives

## Problem Statement

### The Hardware Access Crisis in African Schools

Physical robotics and electronics education requires hands-on access to hardware: microcontroller development boards, breadboards, sensors, actuators, motors, and the supporting components that constitute a typical robotics starter kit. In the African school context this hardware is largely inaccessible, for three compounding reasons.

**Cost and foreign-exchange barriers.** A complete Arduino UNO R3 or ESP32 starter kit — containing the development board, breadboard, jumper wires, and a representative selection of sensors and actuators — costs between USD 25 and USD 80 at import price. For government schools operating on per-learner budgets that may be below USD 50 per year across all subjects, outfitting a single class of thirty students with individual kits is economically prohibitive. Purchasing even a single shared demonstration kit often requires special procurement processes or donor funding. Currency instability and import duties in many African markets push effective local prices higher still, and foreign-currency shortages in countries such as Zimbabwe make dollar-denominated hardware orders acutely difficult.

**Infrastructure scarcity.** Laboratory space, storage, qualified technicians to maintain hardware, and reliable electrical supply are not universally available. Hardware breaks, components are lost or stolen, and repairs are slow. In rural and peri-urban schools these constraints are more acute. Even where computers are present, they are often shared across many subjects, leaving limited scheduled time for any single discipline.

**Teacher capacity gaps.** Robotics, electronics, and embedded programming are specialist domains. The pipeline of pre-service teachers trained in these areas is thin, and continuous professional development opportunities are rare. Many teachers who would willingly integrate coding and robotics into their lessons lack the foundational technical confidence to set up and debug physical hardware in real time with students. Without confidence, teachers default to passive delivery, eliminating the experiential learning that makes robotics education effective.

The combined effect is that millions of primary and secondary school students across Africa are denied access to the practical robotics, coding and electronics experience that is standard in schools in higher-income regions. This compounds existing digital-skills inequity at precisely the moment when those skills are most economically consequential.

### The Online-Safety Gap

Where students do access online coding environments, those environments are typically designed for adult learners or for markets with strong existing data-protection frameworks. Child-specific protections — verifiable parental consent, supervised communication, content moderation, prohibition of behavioural advertising, and age-appropriate design — are either absent or bolted on as afterthoughts. African regulators are progressively enacting data-protection legislation (Zimbabwe Cyber and Data Protection Act, POPIA in South Africa, NDPR in Nigeria, Kenya Data Protection Act) that demands compliance, yet most available platforms provide no compliant path for schools to onboard minors.

### The Teacher Delivery Gap

Even where digital coding tools exist, they do not close the teacher-capacity gap. General-purpose online IDEs do not offer curriculum-aligned scaffolding, classroom-level task assignment and grading workflows, or the ability for a teacher to observe and guide multiple students simultaneously. Teachers are left to improvise lesson structure, which requires both subject expertise and pedagogical design skill — a combination that is scarce.

---

## Vision Statement

> **RoboCode.Africa will be the leading browser-based platform on which every school student in Africa — regardless of their school's hardware budget, internet speed, or geographic location — can learn robotics, electronics, coding and artificial intelligence through safe, teacher-guided, curriculum-aligned, gamified project work; simulating real circuits and real code on real microcontroller models without needing to own a single physical component.**

The platform eliminates the hardware barrier by providing a high-fidelity, browser-native simulation of three first-class development boards — the Arduino UNO R3, the ESP32 DevKit, and the Raspberry Pi Pico (RP2040) — together with a full-size breadboard and the complete component catalogue found in a typical robotics starter kit, all executable in any modern browser on any device, including low-specification shared school computers. An extensible board library (wokwi-boards format) allows platform admins and approved educators to add further boards without code changes. It eliminates the teacher-capacity barrier by embedding structured learning pathways, guided project templates and grading tools directly in the teacher workflow. It eliminates the online-safety barrier by building child protection, parental consent, content moderation and multi-jurisdictional data-protection compliance into the platform architecture from inception — not as an add-on.

---

## Primary Goals and Measurable Objectives

The following goals and key performance indicators (KPIs) define success for RoboCode.Africa at platform launch (Version 1.0) and at the twelve-month post-launch mark.

### Goal 1 — Equitable Access

Make practical robotics and coding education accessible to students and schools that cannot afford physical hardware.

| ID | Objective | KPI | Target (Launch) | Target (12 Months) |
|----|-----------|-----|-----------------|-------------------|
| OBJ-01 | Platform loads and is usable on a shared school computer with 2 GB RAM and a 2 Mbps internet connection | Median first-meaningful-paint ≤ 3 s on reference hardware at 2 Mbps | Must ship | Must ship |
| OBJ-02 | RoboCode Studio simulator supports the complete component catalogue from a standard robotics starter kit | Component coverage ≥ 40 unique component types from the canon catalogue | Must ship | ≥ 60 components |
| OBJ-03 | Students can complete full project cycles without owning any physical hardware | End-to-end project completion rate in simulation ≥ 75 % of started projects | Baseline collected | ≥ 75 % |
| OBJ-04 | Platform is deployed from an African cloud region | Primary deployment in af-south-1 (AWS Cape Town) or equivalent | Must ship | Must ship |

### Goal 2 — Child Safety and Regulatory Compliance

Ensure every minor using the platform is protected in accordance with applicable law and the age-appropriate design code.

| ID | Objective | KPI | Target (Launch) | Target (12 Months) |
|----|-----------|-----|-----------------|-------------------|
| OBJ-05 | Every student account activation requires explicit approval | Approval gate present for 100 % of student signup flows | Must ship | Must ship |
| OBJ-06 | Verifiable parental/guardian consent is obtained for minors before activation | Consent workflow covers COPPA (under-13) and GDPR-K (under-16) | Must ship | Must ship |
| OBJ-07 | No unmoderated peer-to-peer messaging between minors | Private messaging between minors is architecturally absent; teacher-supervised channels only | Must ship | Must ship |
| OBJ-08 | Content moderation and safeguarding escalation pathways are operational | Zero unresolved safeguarding flags after 72 hours; audit log retention ≥ 12 months | Must ship | Must ship |
| OBJ-09 | Data-minimisation policy for minors is enforced | Personal data collected for minors is limited to name, age-band, school, and credentials; zero behavioural-advertising events | Must ship | Must ship |

### Goal 3 — Teacher Empowerment

Enable teachers with limited specialist knowledge to deliver structured robotics and coding lessons effectively.

| ID | Objective | KPI | Target (Launch) | Target (12 Months) |
|----|-----------|-----|-----------------|-------------------|
| OBJ-10 | Teacher can create and assign a structured coding/robotics task without writing code themselves | Task-creation workflow completion time ≤ 10 minutes for a first-time teacher | Must ship | Must ship |
| OBJ-11 | Teacher can monitor all students' live simulation sessions from a class dashboard | Classroom dashboard with real-time status for ≥ 30 concurrent students | Must ship | Must ship |
| OBJ-12 | Auto-grading and rubric-based assessment tools are available | ≥ 80 % of task submissions receive an auto-grade suggestion | Should ship v1 | ≥ 80 % |
| OBJ-13 | Teachers can access a global content library of pre-built lessons and project templates | ≥ 20 curriculum-aligned project templates available at launch | Must ship | ≥ 100 templates |

### Goal 4 — Engagement and Learning Outcomes

Sustain student motivation and demonstrate measurable learning progress.

| ID | Objective | KPI | Target (Launch) | Target (12 Months) |
|----|-----------|-----|-----------------|-------------------|
| OBJ-14 | Gamification system (RoboPoints, badges, leaderboards) is live and drives return visits | ≥ 60 % weekly active student retention across a 4-week period | Baseline collected | ≥ 60 % |
| OBJ-15 | Progressive difficulty tracks for primary and high-school students are distinct and age-appropriate | Two separate learning tracks (primary / high school) with ≥ 3 difficulty levels each | Must ship | Must ship |
| OBJ-16 | Block-based mode for younger students transpiles correctly to text code | Block-to-text transpilation accuracy = 100 % with no silent failures | Must ship | Must ship |

### Goal 5 — School and Tenant Growth

Achieve sustainable adoption by schools across Africa.

| ID | Objective | KPI | Target (Launch) | Target (12 Months) |
|----|-----------|-----|-----------------|-------------------|
| OBJ-17 | School onboarding (subdomain, branding, admin account) completes within one business day | Onboarding workflow elapsed time ≤ 24 hours | Must ship | Must ship |
| OBJ-18 | Schools can operate on the school's own domain with white-label branding | Custom-domain CNAME + TLS provisioning fully automated | Must ship | Must ship |
| OBJ-19 | Number of active school tenants | Paying or trial school tenants | 5 pilot schools | 50 schools |
| OBJ-20 | Registered active students | Monthly active students (≥ 1 session/month) | 500 | 10 000 |

---

## Value Propositions by Stakeholder

### Student

- Access to a fully equipped electronics laboratory — boards, breadboards, wires, sensors, actuators, motors — at no personal cost, from any device with a browser.
- Write real code (Arduino C/C++, MicroPython, CircuitPython, or block-based) and watch real firmware run on an accurate microcontroller simulation — avr8js for AVR boards, rp2040js for the Raspberry Pi Pico, and ESP32 core for the ESP32 — building transferable skills.
- Earn RoboPoints, badges and leaderboard rankings, making learning intrinsically motivating.
- Collaborate on team projects and participate in competitions, developing soft skills alongside technical ones.
- A safe environment: no exposure to strangers, no unsupervised messaging, no advertising.

### Teacher / Educator

- Remove the burden of procuring, maintaining and troubleshooting physical hardware.
- Deliver structured, curriculum-aligned lessons using pre-built project templates, or author custom tasks with an intuitive workflow.
- Monitor every student's live simulation in a class dashboard; intervene, annotate and provide feedback without leaving the browser.
- Auto-grading assistance reduces administrative overhead while rubric-based assessment maintains pedagogical rigour.
- Professional confidence through a platform that guides lesson structure, removing the requirement for deep electronics specialist knowledge.

### School Admin (Tenant Admin) / School

- Institutional identity preserved through custom subdomain, optional custom domain, and white-label branding with school logo and colours.
- School-controlled approval and onboarding of students and teachers: the School Admin is the gatekeeper for their tenant.
- Dashboards and reports on student progress, course completion, time-on-task and gamification standing, supporting evidence-based school improvement.
- A single, cost-predictable subscription covers all seats, eliminating hardware procurement, breakage, storage and maintenance costs.
- Compliance confidence: the platform handles parental consent, data minimisation and regulatory alignment on behalf of the school.

### Parent / Guardian

- Transparent, verifiable consent process before a minor's account is activated.
- Progress summary dashboard showing courses completed, RoboPoints earned and time-on-task — without exposing full session data.
- Assurance that the child's online environment is supervised, moderated and free of contact from strangers or advertising.

### RoboCode.Africa (Platform)

- A scalable multi-tenant SaaS business model with school subscriptions as the primary revenue unit.
- African-first positioning in a structurally underserved market with strong digital-skills demand, government ICT education mandates, and growing private-school investment.
- An open-source simulation core (Wokwi) that reduces the cost and timeline for component development while benefiting from community maintenance.
- Network effects: schools onboard students, students progress, leaderboards and competitions draw more schools, expanding the content library improves teacher retention.

---

## Guiding Principles

The following principles govern all product, architectural and operational decisions on the platform. They are ordered by precedence; where principles conflict, the higher-ranked principle prevails.

| Rank | Principle | Meaning for RoboCode.Africa |
|------|-----------|---------------------------|
| 1 | **Safety First** | Child protection, verifiable consent, content moderation, and safeguarding are non-negotiable constraints, not features. No capability is shipped that creates unsupervised access or unmoderated content for minors. |
| 2 | **Affordability and Equity** | The platform must be accessible to schools with constrained budgets. Pricing tiers, free trials, and government/NGO partnership plans are built into the commercial model. No capability requires students to purchase hardware or software. |
| 3 | **Low-Bandwidth First** | Every feature is designed to function on a 2 Mbps connection with a low-specification device. 3D graphics degrade gracefully to 2D. Assets are CDN-served and cached. Offline-capable project authoring is a roadmap goal. |
| 4 | **Curriculum Alignment** | Learning content, project templates and assessment rubrics map to recognisable African secondary-school ICT and technology curricula (Zimbabwe ZIMSEC, South Africa CAPS, Nigeria NERDC, Kenya KICD and others). |
| 5 | **Gamification as Pedagogy** | RoboPoints, badges, streaks, leaderboards and team competitions are not decorative. They are designed as motivational scaffolding to sustain engagement across a full academic year, particularly for students with no prior exposure to electronics. |
| 6 | **Openness and Reuse** | The simulation core reuses the Wokwi open-source ecosystem (wokwi-elements, avr8js, rp2040js, wokwi-boards, and associated libraries). Where community-maintained open-source components exist, they are preferred over proprietary alternatives. |
| 7 | **Teacher as First-Class User** | No student-facing feature is designed without a corresponding teacher-facing workflow. Teachers must be able to observe, guide, assess and moderate every student activity the platform supports. |

---

## High-Level Platform Capabilities Summary

The following table summarises the principal capabilities of RoboCode.Africa at the Version 1.0 milestone. Detailed user requirements for each capability area are specified in the sections cross-referenced in the right-hand column.

| Capability Area | Description | URD Section |
|-----------------|-------------|-------------|
| **Onboarding and Signup** | School-based and direct student registration with mandatory approval gates, parental consent workflows, and role-based onboarding for Super Admins, School Admins, Teachers, Students and Parents | User Requirements: Onboarding, Signup and Approval |
| **Authentication** | OAuth2/OIDC, school SSO (Google/Microsoft), TOTP MFA for staff, JWT session management, account recovery | User Requirements: Authentication and Account Management |
| **School Tenancy** | Subdomain and custom-domain routing per school, automated TLS provisioning, white-label branding (logo, colours, design tokens), seat management | User Requirements: School Onboarding, Custom Domain and White-Labelling |
| **RoboCode Studio — Canvas** | Drag-and-drop component canvas (Arduino UNO R3, ESP32 DevKit, Raspberry Pi Pico, breadboard, 60+ components), wiring tool, 2D wokwi-elements rendering with optional Three.js / React Three Fiber 3D view, graceful 2D fallback; extensible board library via wokwi-boards manifests | User Requirements: RoboCode Studio Canvas, Components and Wiring |
| **Simulation Engine (RSE)** | Real-time pin-state simulation using avr8js (ATmega328P), ESP32 core, and rp2040js (RP2040); component behavioural models; WebAudio for buzzer/tone; simulation run/pause/reset; interactive sensor injection | User Requirements: Simulation Experience |
| **Code Editor and RVM** | Monaco editor with Arduino C/C++, MicroPython, CircuitPython and block-based modes; real-time lint diagnostics; in-browser WASM compile toolchain or compile microservice; RoboCode Virtual Machine (RVM) simplified interpretation path; block-to-text transpilation | User Requirements: Code Editor and Programming |
| **Learning, Courses and Assessment** | Structured learning pathways (primary and high-school tracks), teacher-authored and library tasks, rubric-based and auto-graded assessment, progress tracking, certificate generation | User Requirements: Learning, Courses, Tasks and Assessment |
| **Teams and Collaboration** | Team formation, collaborative project editing (Yjs CRDT), shared RoboCode Studio sessions, team leaderboards, competition events | User Requirements: Teams, Competitions and Collaboration |
| **Gamification** | RoboPoints currency, badges/achievements, streaks, class and global leaderboards, Redis-backed ranking, anti-cheat validation | User Requirements: Gamification, RoboPoints and Leaderboards |
| **Communication and Safety** | Teacher-moderated class announcements, assignment feedback threads, PII/profanity filtering, abuse reporting, safeguarding escalation, audit logging | User Requirements: Communication, Notifications and Safety |
| **Administration and Reporting** | Super Admin platform console, School Admin tenant console, billing/plan management, user lifecycle management, compliance reports, data-export and erasure tooling | User Requirements: Administration and Reporting |

---

## Relationship to Requirements Areas

The goals and principles stated in this section are the authoritative basis for the requirements specified in all subsequent sections of this document. Every user requirement (UR-\*), use case (UC-\*) and user story (US-\*) must be traceable to one or more of the objectives OBJ-01 through OBJ-20 and to one or more of the guiding principles listed above. Requirements in conflict with the Safety First principle (Rank 1) are not permissible regardless of other prioritisation.

Measurable KPIs defined in this section (OBJ-\*) shall be implemented as observable platform metrics through the observability stack (OpenTelemetry, Prometheus/Grafana, Sentry) and reported in the monthly platform health dashboard available to Super Admins. KPIs relating to student learning outcomes (OBJ-14 through OBJ-16) shall additionally be surfaced in the School Admin reporting console for per-tenant visibility.
