---
title: "RoboCode.Africa — User Requirements Document"
subtitle: "Learn Robotics, Coding and AI"
author: "RoboCode.Africa Product Team"
date: "19 June 2026"
version: "1.0"
lang: en
toc: true
toc-depth: 3
numbersections: true
papersize: us-letter
fontsize: 10pt
margin:
  x: 1.5cm
  y: 1.8cm
---

# Introduction

## Purpose of This Document

This User Requirements Document (URD) defines the complete set of user-facing requirements for **RoboCode.Africa**, a browser-based platform for teaching Robotics, Coding and Artificial Intelligence to primary and high school students across Africa and the wider world. It captures what users of every role need the system to do, why they need it, and the conditions under which those needs are considered satisfied. It does not prescribe how the system shall be built internally; that is the concern of the companion System Specification Document (SSD).

The URD is the authoritative contract between the RoboCode.Africa Product Team and all downstream engineering, design, and quality-assurance teams. Every user requirement stated here must be traceable to one or more functional requirements in the SSD, and every SSD functional requirement must be traceable back to this document or to a documented architectural decision.

---

## Product Summary

RoboCode.Africa is a browser-based, multi-tenant learning platform that gives primary and high school students an accessible, safe, and engaging path into Robotics, Coding and AI without requiring any physical hardware. Its centrepiece is **RoboCode Studio**, a Wokwi-style web IDE containing an interactive 2D/3D electronics simulator for three first-class development boards: the **Arduino UNO R3** (ATmega328P), the **ESP32** (ESP-WROOM-32), and the **Raspberry Pi Pico** (RP2040). Students drag components from a curated catalogue onto a virtual canvas, wire them through a simulated full-size breadboard using jumper wires, and write code in a Monaco-based editor supporting Arduino C/C++, MicroPython, CircuitPython, and a block-based visual mode for younger learners. The **RoboCode Simulation Engine (RSE)** — built on the Wokwi open-source libraries `avr8js` (AVR/UNO), `rp2040js` (Raspberry Pi Pico), the ESP32 core simulator, `wokwi-elements`, and related packages — translates and executes that code, loading real compiled firmware images and animating LEDs, LCDs, buzzers, motors, sensors, and the full component catalogue in the browser in real time. Beyond the three built-in boards, RoboCode Studio supports an extensible, data-driven board library using the `wokwi-boards` manifest format, allowing platform admins and approved educators to add custom board definitions without code changes. Schools subscribe as tenants, each receiving an isolated subdomain (`school.robocode.africa`) and optional custom domain with white-label branding. Structured courses, gamification via **RoboPoints**, competitions, and rigorous child-safety controls complete the offering.

---

## Scope

### In Scope — Version 1.0

The following capabilities are in scope for the v1.0 release of RoboCode.Africa.

| # | Capability Area | Brief Description |
|---|-----------------|-------------------|
| 1 | Multi-tenant school onboarding | Subdomain and custom-domain tenants, white-label branding, School Admin management |
| 2 | User registration and approval | Role-based sign-up flows, mandatory admin approval, verifiable parental consent for minors |
| 3 | Authentication and account management | OAuth2/OIDC, school SSO (Google/Microsoft), MFA for staff, JWT sessions |
| 4 | RoboCode Studio — canvas and wiring | Drag-and-drop component placement, breadboard wiring, 2D view via wokwi-elements |
| 5 | RoboCode Studio — 3D view | Three.js/React Three Fiber 3D rendering with graceful fallback to 2D on low-end devices |
| 6 | Simulation Engine (RSE) | avr8js AVR firmware execution (UNO), rp2040js RP2040 firmware execution (Raspberry Pi Pico), ESP32 core simulation, component behavioural models; extensible board library via wokwi-boards manifest format |
| 7 | Code Editor | Monaco editor, Arduino C/C++, MicroPython, block-based mode, real-time lint/autocomplete |
| 7a | AI Hint Assistant | Guarded, child-safe AI-assisted coding hints (UR-CODE-096..104); logged, teacher-controllable, no in-browser model training |
| 8 | Code execution paths | Compiled firmware path (WASM/microservice) and simplified RVM interpreted path |
| 9 | Component catalogue | Full set of components from Keyestudio ESP32 kit, Robotlinking starter kit, and common robotics kits (see canon) |
| 10 | Learning management | Courses, modules, tasks, automated grading, teacher-authored content, assignment workflows |
| 11 | Gamification | RoboPoints earning/spending, XP and Levels, badges/achievements, Seasons with resets, cosmetic Rewards catalogue, leaderboards (class, school, global), anti-cheat |
| 12 | Teams and competitions | Team formation, collaborative projects via Yjs CRDT, competition hosting |
| 13 | Communication and safety | Moderated messaging, profanity/PII filtering, abuse reporting, safeguarding escalation, audit logs |
| 14 | Administration and reporting | Super Admin, Platform Moderator, School Admin, Teacher dashboards; analytics; billing |
| 15 | Child-safety and data protection | COPPA, GDPR/GDPR-K, Zimbabwe CDPA, POPIA, NDPR, Kenya DPA compliance |
| 16 | Accessibility | WCAG 2.2 Level AA across all user-facing surfaces |
| 17 | Low-bandwidth/Africa-region delivery | CDN/edge via Cloudflare/CloudFront, Africa region cloud hosting (af-south-1), optional SMS |

### Out of Scope — Roadmap (Not in v1.0)

The following items have been explicitly deferred to a future release:

| # | Item | Notes |
|---|------|-------|
| 1 | Physical hardware integration | The platform is entirely browser-based; no device drivers, USB/serial flashing, or physical board tethering in v1.0 |
| 2 | Arduino Nano board simulation | Roadmap board; UNO R3, ESP32, and Raspberry Pi Pico are v1.0 |
| 3 | ESP8266 board simulation | Roadmap board |
| 4 | Native mobile applications (iOS/Android) | Responsive web only in v1.0; native apps are a roadmap item |
| 5 | AI/ML model training within Studio | AI learning content and the guarded AI Hint Assistant (rule-based or pre-trained models) are in scope; in-browser neural-network/model training is roadmap (UR-NFR-C027) |
| 6 | Marketplace for third-party content | Platform-authored content only in v1.0 |
| 7 | Parent/Guardian portal | Consent workflow is v1.0; a full parent dashboard is roadmap |
| 8 | Persistent offline mode / installable PWA | Full offline operation and an installable PWA are out of scope; all core functionality requires an active internet connection in v1.0 (UR-NFR-A003). Limited transient connectivity-resilience (e.g., short-lived in-session edit buffering, Service-Worker caching of recently opened projects/docs) is permitted as Could/Should items only (UR-NFR-083, UR-NFR-084, UR-CODE-086). |
| 9 | Live hardware streaming / remote labs | Out of scope |
| 10 | Behavioural advertising or third-party analytics | Permanently excluded by child-safety policy |

---

## Intended Audience

This document is written for the following readers. Each should pay particular attention to the sections noted.

| Audience | Relevant Sections |
|----------|-------------------|
| Product Managers and Owners | All sections — this is the primary product contract |
| UX/UI Designers | Sections 3–5 (personas, roles), 6–15 (user requirements), 19 (user journeys) |
| Frontend and Studio Engineers | Sections 9–12 (Studio, simulation, editor, learning) |
| Backend and Platform Engineers | Sections 6–8, 13, 16 (onboarding, auth, tenancy, admin) |
| QA and Test Engineers | Sections 6–18 (requirements and acceptance criteria), 20 (non-functional expectations) |
| Security and Compliance Officers | Sections 6–7, 15 (safety, consent), 20–21 (NFR, constraints) |
| School Administrators and Pilot Partners | Sections 3–4, 8, 16 (tenancy, reporting) |
| Legal and Data Protection Officers | Sections 6, 15, 20–21 (child safety, data protection) |
| Executive Stakeholders | Sections 1–2, 21 (vision, constraints) |

---

## Document Conventions

### Heading Hierarchy

Sections are numbered at document-assembly time. Within each section, `##` denotes a major subsection and `###` a sub-subsection. Do not infer ordering from heading depth alone; use the assembled table of contents.

### Requirement Identifiers

All requirements in this URD follow the scheme below. IDs are permanent; a retired requirement is marked `[DEPRECATED]` rather than renumbered.

```
UR-<AREA>-<nnn>   — User Requirement
UC-<nnn>          — Use Case
US-<nnn>          — User Story
```

**AREA codes used in this URD:**

| Code | Area |
|------|------|
| ONB  | Onboarding, Signup and Approval |
| AUTH | Authentication and Account Management |
| SCH  | School Onboarding, Custom Domain and White-Labelling |
| STU  | RoboCode Studio Canvas, Components and Wiring |
| SIM  | Simulation Experience |
| CODE | Code Editor and Programming |
| LRN  | Learning, Courses, Tasks and Assessment |
| TEAM | Teams, Competitions and Collaboration |
| GAM  | Gamification, RoboPoints and Leaderboards |
| COMM | Communication, Notifications and Safety |
| ADM  | Administration and Reporting |
| NFR  | Non-Functional User Expectations |

### Requirement Tables

All user requirements are presented in tables with the following standard columns:

| Column | Meaning |
|--------|---------|
| **ID** | Unique requirement identifier (e.g., `UR-ONB-001`) |
| **Requirement** | Plain-language statement of what the user needs |
| **Priority** | MoSCoW: Must / Should / Could / Won-t |
| **Acceptance / Notes** | Measurable acceptance criterion or explanatory note |

### Priority Scale (MoSCoW)

| Label | Meaning |
|-------|---------|
| **Must** | Non-negotiable for v1.0; launch is blocked without it |
| **Should** | High-value; included unless time/resource forces deferral |
| **Could** | Desirable if capacity allows; not critical path |
| **Won-t** | Explicitly excluded from v1.0; may be revisited in future releases |

> Note: "Won-t" is spelled with a hyphen to avoid punctuation rendering issues in certain PDF toolchains.

### Cross-References

Requirements cross-reference other parts of this document by **section name and requirement ID**, never by page number. References to the System Specification Document use the prefix `FR-<MODULE>-<nnn>` (functional), `NFR-<CAT>-<nnn>` (non-functional), `SR-<nnn>` (security), or `DR-<nnn>` (data).

### Role Names

The following canonical role names are used throughout this document. Use these exact strings; do not substitute synonyms.

| Canonical Name | Description |
|----------------|-------------|
| Super Admin | RoboCode.Africa platform administrator |
| Platform Moderator | Delegated content/safety moderator |
| School Admin | Tenant-level administrator for a school |
| Teacher | Educator who creates classes and assignments |
| Student | Learner (primary-school or high-school) |
| Parent / Guardian | Consent provider and limited progress viewer |
| Guest / Visitor | Unauthenticated marketing-site and demo user |

### Product and Component Names

Key names used consistently throughout this document:

| Canonical Name | Refers To |
|----------------|-----------|
| RoboCode.Africa | The overall platform |
| RoboCode Studio | The browser-based IDE and simulator workspace |
| RoboCode Simulation Engine (RSE) | The simulation execution layer (avr8js + rp2040js + ESP32 core + component models + wokwi-boards extensible board library) |
| RoboCode Virtual Machine (RVM) | The simplified/interpreted code execution path |
| RoboPoints | The platform's gamification points currency |
| Tenant | A school with its own subdomain and optional custom domain |

---

## Pointer to Glossary

All technical terms, acronyms, and domain-specific vocabulary used in this document are defined in **Section 22: Glossary and Acronyms**. On first use, a term is written in full with its acronym in parentheses; thereafter the acronym alone may be used. Readers encountering an unfamiliar term should consult Section 22 before raising a query.

---

## References

The following standards, specifications, frameworks, and legal instruments are normative or informative references for this document.

### Standards and Frameworks

| Reference | Title / Description | Relevance |
|-----------|---------------------|-----------|
| ISO/IEC/IEEE 29148:2018 | Systems and software engineering — Life cycle processes — Requirements engineering | Requirements engineering process and notation style |
| IEEE Std 830-1998 | IEEE Recommended Practice for Software Requirements Specifications | SRS structure guidance |
| WCAG 2.2 (W3C, 2023) | Web Content Accessibility Guidelines, Level AA | Accessibility requirements throughout (see Section 20) |
| OWASP Top 10 (2021) | Open Web Application Security Project Top 10 | Security baseline referenced in child-safety and auth sections |

### Open-Source Libraries

| Reference | URL | Relevance |
|-----------|-----|-----------|
| Wokwi GitHub Organisation | https://github.com/wokwi | Parent repository for wokwi-elements, avr8js, and related simulator libraries reused by RSE |
| wokwi-elements | https://github.com/wokwi/wokwi-elements | Web components for 2D electronic component rendering in RoboCode Studio |
| avr8js | https://github.com/wokwi/avr8js | JavaScript/WASM AVR (ATmega328P) simulator powering the UNO R3 accurate execution path |
| rp2040js | https://github.com/wokwi/rp2040js | JavaScript/WASM RP2040 simulator powering the Raspberry Pi Pico accurate execution path (runs real UF2/ELF firmware in the browser) |
| wokwi-boards | https://github.com/wokwi/wokwi-boards | Data-driven board manifest format (board.json + SVG) used by RSE as the canonical schema for all board definitions, including custom/admin-uploaded boards |

### Component Kit References

| Reference | Description | Relevance |
|-----------|-------------|-----------|
| Keyestudio ESP32 Learning Kit (Alibaba listing) | 37-in-1 sensor and component starter kit for ESP32 | Primary source for ESP32-side component catalogue |
| Robotlinking Arduino Starter Kit (Alibaba listing) | Arduino UNO-compatible starter kit with breadboard, sensors, and actuators | Primary source for UNO-side component catalogue |

### Legal and Regulatory Instruments

| Instrument | Jurisdiction | Key Obligation |
|------------|-------------|----------------|
| Children's Online Privacy Protection Act (COPPA) | United States | Verifiable parental consent for users under 13; data minimisation |
| General Data Protection Regulation (GDPR) | European Union | Lawful basis for processing; data subject rights; data minimisation |
| GDPR — Children's provisions (GDPR-K) | European Union | Age-appropriate design; digital-consent threshold under-16 by default, member states may lower to 13 (RoboCode.Africa adopts under-16; see UR-ONB-027) |
| Age Appropriate Design Code (Children's Code) | United Kingdom / ICO | Best-interests-of-the-child default settings; no profiling of minors |
| Zimbabwe Cyber and Data Protection Act (CDPA 2021) | Zimbabwe | Data protection obligations; lawful processing; cross-border transfer restrictions |
| Protection of Personal Information Act (POPIA 2013) | South Africa | Conditions for lawful processing; special conditions for children's data |
| Nigeria Data Protection Regulation (NDPR 2019) | Nigeria | Data processing principles; consent; data subject rights |
| Kenya Data Protection Act (DPA 2019) | Kenya | Registration of data controllers; processing principles; children's data |

---

## Document Control

| Field | Value |
|-------|-------|
| Document Title | RoboCode.Africa — User Requirements Document (URD) |
| Section | 1 — Introduction |
| Version | 1.1 |
| Date | 19 June 2026 |
| Author | RoboCode.Africa Product Team |
| Status | Draft for Review |
| Approved By | — (pending) |
| Next Review Date | 03 July 2026 |
| Distribution | Product, Engineering, Design, Legal, QA |

### Revision History

| Version | Date | Author | Change Summary |
|---------|------|--------|----------------|
| 0.1 | 05 June 2026 | RoboCode.Africa Product Team | Initial outline and scope draft |
| 0.9 | 16 June 2026 | RoboCode.Africa Product Team | Full first draft; internal review |
| 1.0 | 19 June 2026 | RoboCode.Africa Product Team | Issued for stakeholder review |
| 1.1 | 19 June 2026 | RoboCode.Africa Product Team | Added Raspberry Pi Pico (RP2040 / rp2040js) as third first-class board; added extensible board library (wokwi-boards); updated Product Summary, Scope, component names table, and library references accordingly |


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


# Stakeholders and User Classes

## Overview

This section identifies all stakeholders and user classes for RoboCode.Africa, defines their roles, responsibilities, technical context, and primary needs. Stakeholders are any individual, group, or organisation with a material interest in or influence over the platform. User classes are the distinct categories of people who interact directly with the system at runtime.

The distinction between stakeholder and user class is maintained throughout: a regulatory body is a stakeholder but not a user class; a Teacher is both. Cross-references to the User Roles and Permissions Matrix (Section 5) and User Personas (Section 4) are provided where applicable.

---

## Internal User Classes

The following user classes are defined by the Role-Based Access Control (RBAC) model and are used consistently across all sections of this document. Requirement-ID prefix for this area: **UR-ONB** (onboarding) and **UR-ADM** (administration). User-class identifiers in the Permissions Matrix use the codes in parentheses below.

---

### Super Admin (`SUPER_ADMIN`)

| Attribute | Detail |
|---|---|
| Description | The RoboCode.Africa platform owner-operator administrator. Holds the highest privilege level. Responsible for the health, integrity, and governance of the entire multi-tenant platform. |
| Key Responsibilities | Approve or reject direct student signups on robocode.africa; create, configure, suspend, and remove tenant schools; manage the global content library; set platform-wide configuration and feature flags; oversee billing and subscription plans; perform global content and safeguarding moderation; maintain system health dashboards; appoint Platform Moderators. |
| Technical Proficiency | High. Comfortable with dashboards, administrative UIs, structured reports, and basic configuration files. Not required to write code. |
| Frequency of Use | Daily during business hours; on-call for critical incidents. |
| Environment / Device | Desktop browser (Chrome/Firefox/Edge, 1080p+). Stable broadband. May access reports on mobile in read-only mode. |
| Primary Needs | A centralised admin console with tenant management, real-time platform health metrics, safeguarding and moderation queues, billing management, and global content governance tools. |

---

### Platform Moderator (`PLATFORM_MOD`)

| Attribute | Detail |
|---|---|
| Description | A trust-and-safety specialist delegated by the Super Admin. Focuses on content moderation, safeguarding of minors, and approval of direct-signup student accounts on the main domain. |
| Key Responsibilities | Review and action content moderation queues (profanity, PII, inappropriate submissions); approve or reject direct-domain student signup applications; escalate safeguarding incidents to the Super Admin or relevant authorities; maintain audit logs; coordinate with School Admins on cross-tenant issues. |
| Technical Proficiency | Medium. Comfortable with moderation dashboards, structured queues, and basic report views. |
| Frequency of Use | Daily, multiple sessions per day during active school periods. |
| Environment / Device | Desktop browser. Stable broadband. |
| Primary Needs | Efficient moderation queues with context-rich previews, one-click approve/reject/escalate actions, clear audit trails, direct communication channel to Super Admin and School Admins, and age/consent-status visibility for each account. |

---

### School Admin (`SCHOOL_ADMIN`)

| Attribute | Detail |
|---|---|
| Description | The administrator for a single tenant school. Manages the school's subdomain or custom domain, branding, staff, students, and school-level policies. Corresponds to the tenant administrator in the multi-tenant model. |
| Key Responsibilities | Configure the school subdomain (`school.robocode.africa`) and optional custom domain including DNS/TLS setup; apply white-label branding (logo, colours, theme tokens); approve or reject student signup applications for their school; manage Teacher accounts and class structures; set school-level policies (e.g., allowed programming languages, seat limits, session timeout); view school-scoped reports and analytics; manage subscription seats and billing contacts. |
| Technical Proficiency | Medium. Comfortable with web-based admin panels. No coding required. Some users may have IT administration background. |
| Frequency of Use | Several times per week during the academic term; more frequently at term start for onboarding new students. |
| Environment / Device | Desktop or laptop browser. School network (may have firewall restrictions). Stable or moderate broadband. |
| Primary Needs | A school-scoped admin dashboard; clear DNS and custom domain setup wizard; branding/white-label configuration UI; student approval queue with parental consent status; staff management with role assignment; and exportable school performance reports. |

---

### Teacher / Educator (`TEACHER`)

| Attribute | Detail |
|---|---|
| Description | A qualified educator at a tenant school (or, in future, a content author operating under the platform directly). Creates the learning environment in which students use RoboCode Studio. |
| Key Responsibilities | Create and manage classes; author, curate, and assign coding tasks and robotics projects; set deadlines and grading rubrics; review and grade student project submissions; monitor student progress and RoboPoints activity; mentor teams for competitions; facilitate safe in-platform communication; flag safeguarding concerns to the School Admin. |
| Technical Proficiency | Low to medium. Expected to be comfortable with general web applications. May have varying levels of coding and electronics experience; the platform must support non-expert teachers through clear authoring tools. |
| Frequency of Use | Daily during school days; peak usage at assignment creation (beginning of unit) and grading (end of unit). |
| Environment / Device | Desktop or laptop browser; school network. Occasional tablet use for monitoring during a lab session. |
| Primary Needs | Intuitive class and task authoring tools; a live progress dashboard showing each student's simulator activity, code submissions, and RoboPoints; a grading interface with inline code review and annotation; safeguarding and moderation tools relevant to their classes; and assignment templates and a global content library to reduce authoring effort. |

---

### Student (`STUDENT`)

The Student user class has two defined sub-classes reflecting age, cognitive development, and curriculum stage. Both sub-classes share a single top-level role type but differ in accessible features, UI complexity, and consent/safety rules.

#### Primary-School Student (`STUDENT_PRIMARY`)

| Attribute | Detail |
|---|---|
| Description | A learner in primary school (approximate ages 7–12). Engages with the platform primarily through block-based programming and guided simulation activities designed for early STEM learners. |
| Key Responsibilities | Complete assigned tasks and projects in RoboCode Studio; drag and connect components on the simulator canvas; write or compose code in block-based mode; earn RoboPoints; participate in team activities under teacher supervision. |
| Technical Proficiency | Very low. Likely their first exposure to electronics and coding. Requires visual, gamified, and scaffolded interfaces. |
| Frequency of Use | During timetabled class sessions; some students may use the platform at home with parental oversight. |
| Environment / Device | School lab desktop or laptop; home tablet or family computer. Lower-end hardware is common; the platform must degrade gracefully (2D mode fallback, lighter assets). Network quality may vary; offline-tolerant caching is desirable. |
| Primary Needs | Age-appropriate, visually engaging UI with minimal text barriers; block-based code mode; step-by-step guided tasks; large hit-targets for drag-and-drop wiring; clear visual feedback from the simulator; safe and supervised communication with teacher; simple RoboPoints progress display. Parental/guardian consent is mandatory before account activation (COPPA/GDPR-K). |
| Safety Notes | No private messaging. All communication overseen by teacher. Parental consent required. Data minimisation and no behavioural advertising apply. |

#### High-School Student (`STUDENT_HIGHSCHOOL`)

| Attribute | Detail |
|---|---|
| Description | A learner in secondary/high school (approximate ages 13–18). Engages with text-based programming (Arduino C/C++ and MicroPython), more complex simulation projects, and competitive team activities. |
| Key Responsibilities | Build complex multi-component electronics projects in RoboCode Studio; write text-based Arduino C/C++ or MicroPython code; debug firmware against the simulator; collaborate in teams on competition projects; complete assessed tasks with code quality criteria; earn and track RoboPoints and leaderboard position. |
| Technical Proficiency | Low to medium (growing). Comfortable with general web apps; some prior exposure to coding likely but not assumed. |
| Frequency of Use | During timetabled sessions and independently at home for project work and competition preparation. |
| Environment / Device | School lab desktop; personal laptop or home computer. Generally more capable hardware than primary-school context. Mobile may be used for checking progress and notifications, not for IDE work. |
| Primary Needs | Full-featured Monaco code editor with Arduino/MicroPython autocomplete and diagnostics; 2D and 3D simulator views; clear compilation and simulation error messages; team/collaborative project workspace; leaderboard and competition tools; peer and teacher feedback on code submissions. For students under 16, parental consent rules apply (GDPR-K). |
| Safety Notes | Moderated team communication only. No open private messaging between students. Safeguarding escalation paths apply. |

---

### Parent / Guardian (`PARENT_GUARDIAN`)

| Attribute | Detail |
|---|---|
| Description | The parent or legal guardian of a minor student. Primarily engaged during signup and consent verification, and for periodic progress review. |
| Key Responsibilities | Provide and verify parental/guardian consent for a minor's account activation; review a summary of the child's platform activity and progress; receive safeguarding notifications if relevant; update consent preferences or withdraw consent. |
| Technical Proficiency | Low to medium. General consumer-level web and email literacy. Must not be expected to understand technical platform details. |
| Frequency of Use | Low. Primary interaction at consent verification; occasional check-ins for progress summaries. |
| Environment / Device | Personal smartphone (primary), tablet, or home computer. Mobile-friendly consent flow is essential. |
| Primary Needs | A clear, plain-language consent verification flow; a read-only child progress summary view; notifications about significant events (e.g., safeguarding alerts); the ability to withdraw consent and initiate account deletion. No access to other students' data. |

---

### Guest / Visitor (`GUEST`)

| Attribute | Detail |
|---|---|
| Description | An unauthenticated user browsing the marketing site at robocode.africa or accessing a limited public demo of RoboCode Studio. May be a prospective student, parent, teacher, school administrator, or general member of the public. |
| Key Responsibilities | Browse platform features, pricing, and case studies; try a limited, sandboxed demo simulation; initiate a signup or school onboarding inquiry. |
| Technical Proficiency | Unknown; must be assumed to be non-technical. |
| Frequency of Use | One-time or infrequent; typically part of a discovery/evaluation journey. |
| Environment / Device | Any device; often mobile. Varying network quality (African contexts may include 3G). |
| Primary Needs | Fast-loading, accessible marketing pages; a compelling and functional demo of RoboCode Studio without requiring signup; clear calls-to-action for signup, school onboarding, and contact. No personal data stored beyond session analytics; no consent gate required for the demo itself (no account created). |

---

## External Stakeholders

External stakeholders are not direct users of the platform at runtime but have legitimate interests that shape requirements, compliance obligations, or operational dependencies.

### Schools as Organisations

| Attribute | Detail |
|---|---|
| Description | Primary and secondary schools across Africa that subscribe to the RoboCode.Africa platform as tenant organisations. |
| Interests | Reliable, branded learning environment for their students; data privacy compliance aligned with local regulations; manageable cost (per-seat or institutional pricing); integration with existing school identity providers (Google Workspace, Microsoft 365). |
| Influence on Requirements | Drives multi-tenancy isolation, white-label branding, school SSO (OAuth2/OIDC with Google/Microsoft), seat-based billing, and school-level reporting. |

### RoboCode.Africa Operations Team

| Attribute | Detail |
|---|---|
| Description | The internal product, engineering, DevOps, and customer-success team that builds and operates the platform. |
| Interests | Scalable and maintainable infrastructure; clear observability and alerting; low operational overhead for tenant provisioning; CI/CD pipeline reliability. |
| Influence on Requirements | Drives infrastructure requirements (Kubernetes, Terraform, CDN, Africa-region deployment), observability stack (OpenTelemetry, Prometheus/Grafana, Sentry), automated TLS/ACME provisioning, and multi-tenant database design (Postgres RLS). |

### Content Authors / Curriculum Designers

| Attribute | Detail |
|---|---|
| Description | Specialists (internal staff or contracted third parties) who design and author the global curriculum content, coding tasks, course modules, and assessment rubrics published in the global content library. |
| Interests | Powerful but accessible content authoring tools; rich media support; versioning and approval workflow for published content; ability to map content to national curriculum standards. |
| Influence on Requirements | Drives the content library, task authoring, curriculum mapping, and Teacher-facing content management features described in Section 12 (User Requirements: Learning, Courses, Tasks and Assessment). |

### Regulators and Standards Bodies

| Attribute | Detail |
|---|---|
| Description | Government and standards bodies in the jurisdictions where RoboCode.Africa operates or whose citizens it serves, including data protection authorities. Key instruments include: COPPA (US), GDPR and GDPR-K (EU/UK), Zimbabwe Cyber and Data Protection Act, South Africa POPIA, Nigeria NDPR, and the Kenya Data Protection Act. Additionally, accessibility standards (WCAG 2.2 AA) and international standards bodies (ISO/IEC/IEEE). |
| Interests | Lawful processing of personal data; verifiable parental consent for minors; data minimisation; right to erasure; audit logs; no behavioural advertising targeting minors. |
| Influence on Requirements | Safety-first prime directive; mandatory parental consent gate; age-appropriate design; data residency considerations (Africa-region cloud deployment); audit logging; full erasure workflow. These obligations permeate every section of this document. |

### Third-Party Technology Partners

| Attribute | Detail |
|---|---|
| Description | Vendors whose open-source or commercial components are integral to the platform. Key examples: Wokwi open-source project (wokwi-elements, avr8js, component libraries); payment providers (Stripe, Paystack, Flutterwave); email/SMS providers (SES/SendGrid); cloud infrastructure providers (AWS af-south-1, GCP, Azure); Cloudflare/CloudFront CDN. |
| Interests | Appropriate attribution and licence compliance (Wokwi); uptime SLA compliance; API stability; payment processing regulatory alignment. |
| Influence on Requirements | Technology stack selection, open-source licence obligations (wokwi-elements and avr8js are open-source; attribution and licence terms must be honoured), payment gateway integration requirements, and CDN/edge routing configuration for low-latency African delivery. |

### Parents and Guardian Community (Collective)

| Attribute | Detail |
|---|---|
| Description | Beyond individual Parent/Guardian users, the broader community of parents is a collective stakeholder in child-safety policy decisions, transparency reports, and safeguarding practices. |
| Interests | Transparency about how their children's data is used; robust safeguarding; easy consent management; clear escalation paths for concerns. |
| Influence on Requirements | Privacy notices, safeguarding escalation paths, transparency reports, and data-minimisation policies. |

---

## Stakeholder and User Class Summary Table

The table below provides a consolidated reference. Priority in the context of this table denotes the platform's investment priority in supporting that class's needs, using MoSCoW.

| User / Stakeholder Class | Type | RBAC Code | Priority | Primary Interaction Point |
|---|---|---|---|---|
| Super Admin | Internal User | `SUPER_ADMIN` | Must | Admin console, platform dashboard |
| Platform Moderator | Internal User | `PLATFORM_MOD` | Must | Moderation queue, approval dashboard |
| School Admin | Internal User | `SCHOOL_ADMIN` | Must | School admin portal, tenant config |
| Teacher / Educator | Internal User | `TEACHER` | Must | Class management, Studio observer view |
| Primary-School Student | Internal User | `STUDENT_PRIMARY` | Must | RoboCode Studio (block mode), task list |
| High-School Student | Internal User | `STUDENT_HIGHSCHOOL` | Must | RoboCode Studio (text mode), team workspace |
| Parent / Guardian | Internal User | `PARENT_GUARDIAN` | Must | Consent flow, progress summary view |
| Guest / Visitor | Public (Unauthenticated) | `GUEST` | Should | Marketing site, public demo |
| Schools as Organisations | External Stakeholder | — | Must | Contract, billing, school admin |
| RoboCode Operations Team | External Stakeholder | — | Must | CI/CD, observability, ops console |
| Content Authors | External Stakeholder | — | Should | Content authoring tools (Section 12) |
| Regulators / Standards Bodies | External Stakeholder | — | Must | Compliance artefacts, audit logs |
| Third-Party Tech Partners | External Stakeholder | — | Must | API integrations, licences |
| Parent / Guardian Community | External Stakeholder | — | Should | Privacy notices, transparency reports |

---

## Relationship Diagram

The following ASCII diagram illustrates the relationships between user classes and the platform's primary surfaces.

```
+-------------------------------------------------------------+
|                   robocode.africa (Platform)                |
|                                                             |
|  +-----------+    +-----------+    +---------------------+  |
|  |  Super    |    | Platform  |    |   Global Content    |  |
|  |  Admin    |--->| Moderator |    |   Library           |  |
|  +-----------+    +-----------+    +---------------------+  |
|        |                |                   ^               |
|        v                v                   |               |
|  +-----------+    +-----------+    +---------------------+  |
|  |  Tenant   |    | Approval  |    | Content Authors     |  |
|  |  School   |    |  Queues   |    | (ext. stakeholder)  |  |
|  |  (org)    |    +-----------+    +---------------------+  |
|  +-----------+                                              |
|        |                                                    |
|  +-----+----------------+                                  |
|  |   school.robocode.africa  (Tenant subdomain / custom    |
|  |   domain)                                               |
|  |                                                         |
|  |  +---------------+     +---------------------------+   |
|  |  | School Admin  |---->| School Portal             |   |
|  |  +---------------+     +---------------------------+   |
|  |         |                                              |
|  |  +------+-------+                                     |
|  |  |              |                                     |
|  |  v              v                                     |
|  | +---------+ +---------+   +--------------------+     |
|  | | Teacher | | Student |-->| RoboCode Studio    |     |
|  | +---------+ | PRIMARY |   | - Canvas / Wiring  |     |
|  |      |      | HIGHSCHL|   | - Simulator (RSE)  |     |
|  |      |      +---------+   | - Code Editor      |     |
|  |      |           |        +--------------------+     |
|  |      |           v                                    |
|  |      |    +-----------+                               |
|  |      |    | Teams /   |                               |
|  |      |    | Projects  |                               |
|  |      |    +-----------+                               |
|  |      |                                                |
|  |      v                                                |
|  | +-----------+   +-----------+                         |
|  | | Grading / |   | Parent /  |                         |
|  | | Progress  |   | Guardian  |                         |
|  | | Dashboard |   | (consent) |                         |
|  | +-----------+   +-----------+                         |
|  +-------------------------------------------------------+
|                                                             |
|  +-------------------+    +--------------------------+     |
|  | Guest / Visitor   |--->| Marketing Site + Demo    |     |
|  +-------------------+    +--------------------------+     |
|                                                             |
|  External: Regulators, Tech Partners, Ops Team             |
+-------------------------------------------------------------+
```

---

## Notes on Scope and Cross-References

- Detailed permission assignments for each user class are specified in **Section 5: User Roles and Permissions Matrix**.
- Detailed persona narratives for representative individuals within each user class are provided in **Section 4: User Personas**.
- Onboarding flows for each user class, including the parental consent gate, are specified in **Section 6: User Requirements: Onboarding, Signup and Approval** (requirement IDs UR-ONB-001 through UR-ONB-nnn).
- School Admin tenant configuration (subdomain, custom domain, branding) is detailed in **Section 8: User Requirements: School Onboarding, Custom Domain and White-Labelling**.
- Child-safety, data-protection, and moderation requirements affecting all user classes involving minors are detailed in **Section 15: User Requirements: Communication, Notifications and Safety**.
- Administration tools for Super Admin and School Admin are detailed in **Section 16: User Requirements: Administration and Reporting**.


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


# User Roles and Permissions Matrix

## Overview

This section defines the Role-Based Access Control (RBAC) model for RoboCode.Africa. It establishes the seven canonical user roles, describes tenant scoping and how it constrains role authority, and provides a comprehensive permissions matrix across all major capability groups. Requirements in this section govern the enforcement boundaries that all downstream system components — including the identity service, API gateway, RoboCode Studio, learning management functions, and administration interfaces — must implement.

This section cross-references:
- **Section 3 – Stakeholders and User Classes** for the qualitative role descriptions.
- **Section 6 – User Requirements: Onboarding, Signup and Approval** for the approval flows that gate role activation.
- **Section 7 – User Requirements: Authentication and Account Management** for credential and session policies that apply per role.
- **Section 15 – User Requirements: Communication, Notifications and Safety** for the moderation and safeguarding obligations that constrain all roles interacting with minors.

---

## Roles Defined

### Role Catalogue

| ID | Role Name | Scope | Description |
|----|-----------|-------|-------------|
| R-01 | Super Admin | Platform-global | RoboCode.Africa platform administrator. Has unrestricted authority across all tenants, all content, all users. Responsible for tenant provisioning, billing, global content library, platform configuration, and safeguarding escalation. |
| R-02 | Platform Moderator | Platform-global (delegated) | Delegated by a Super Admin for content and safety moderation. Reviews flagged content, approves direct-signup students, and assists with safeguarding. Cannot manage billing or tenant infrastructure. |
| R-03 | School Admin | Tenant-scoped | Administers a single school tenant (subdomain or custom domain). Configures branding, domain, school policies, teacher accounts, class structures, and seat allocation. Approves school students. Cannot access data from other tenants. |
| R-04 | Teacher / Educator | Tenant-scoped, class-scoped | Creates and manages classes within a school tenant. Authors and assigns coding tasks and robotics projects. Reviews and grades student submissions. Mentors teams. Cannot modify school-level configuration or billing. |
| R-05 | Student | Tenant-scoped or direct (robocode.africa) | Builds projects in RoboCode Studio, writes and runs code, completes assigned tasks, joins or forms teams, earns RoboPoints. Subject to age-appropriate permission restrictions. Sub-classes: Primary-School Student (younger learner, block-based mode default) and High-School Student. |
| R-06 | Parent / Guardian | Cross-tenant, child-linked | Linked to one or more Student accounts. Provides verifiable parental consent for minor activation. May view a read-only progress summary for linked children. Has no authoring, moderation, or administrative capabilities. |
| R-07 | Guest / Visitor | Public (unauthenticated) | Accesses the RoboCode.Africa marketing site and a limited non-persistent demo of RoboCode Studio. No account, no data persistence, no community access. |

---

## Tenant Scoping Model

### Scope Hierarchy

```
PLATFORM GLOBAL (Super Admin, Platform Moderator)
│
├── TENANT: school-a.robocode.africa  (School Admin R-03)
│   ├── CLASS: Grade-7 Science        (Teacher R-04)
│   │   ├── Student A (R-05)
│   │   └── Student B (R-05)
│   └── CLASS: Robotics Club          (Teacher R-04)
│       └── Student C (R-05)
│
├── TENANT: school-b.robocode.africa  (School Admin R-03)
│   └── ...
│
└── DIRECT SIGNUP SPACE (robocode.africa)
    ├── Student D (R-05, approved by R-01/R-02)
    └── Student E (R-05, approved by R-01/R-02)
```

### Scoping Rules

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-SCH-090 | Each school tenant must be isolated so that no user with a tenant-scoped role (R-03, R-04, R-05) can read, write, or enumerate data belonging to another tenant. | Must | Enforced by PostgreSQL Row-Level Security with `tenant_id` on every relevant table. Verified by cross-tenant API penetration tests. |
| UR-SCH-091 | A School Admin (R-03) must only exercise administrative authority within the tenant to which their account belongs. | Must | Attempting actions on a different tenant's resources must return a 403 Forbidden response. |
| UR-SCH-092 | A Teacher (R-04) must only access classes, students, submissions, and grades within classes they are assigned to or own. | Must | Teachers may be assigned to multiple classes within the same tenant; cross-class access within the same tenant is governed by assignment, not open to all teachers in the school. |
| UR-SCH-093 | A Student (R-05) must only access their own project files, assigned tasks, and the shared class resources (e.g., course content) within their enrolled classes. | Must | Students must not be able to view other students' private project files or grades without explicit sharing by a Teacher. |
| UR-SCH-094 | Super Admins (R-01) and Platform Moderators (R-02) must be able to act across all tenants for moderation and support purposes, with every such cross-tenant action logged in the audit trail. | Must | Audit log entries must capture the acting user, the target tenant, the affected resource, and a timestamp. |
| UR-SCH-095 | A Parent / Guardian (R-06) must only access progress summaries for Student accounts explicitly linked to them through the consent and linking workflow. | Must | Linking requires both a Parent email verification and a School Admin or Super Admin confirmation step. |

> Note: tenant-scoping access-control rules use the `UR-SCH-090..095` band to keep them distinct from the school registration and white-label requirements (`UR-SCH-001..064`) defined in Section 8.

---

## Permissions Matrix

The matrix below covers all major capability groups. Each cell uses one of three values:

- **Yes** — the role is permitted by default.
- **Cond** — permitted under specific conditions defined in the note column below the table.
- **No** — explicitly denied; the system must enforce this as a hard boundary.

Where a capability group spans multiple screens or microservices, the matrix reflects the aggregate permission. Finer-grained rules are specified in functional requirements (FR-AUTH-*, FR-TEN-*, etc.) in the System Specification Document.

### Table 1 — Account and Identity Management

| Capability | Super Admin | Platform Mod | School Admin | Teacher | Student | Parent | Guest |
|------------|:-----------:|:------------:|:------------:|:-------:|:-------:|:------:|:-----:|
| Create / invite Super Admin accounts | Yes | No | No | No | No | No | No |
| Create / invite Platform Moderator accounts | Yes | No | No | No | No | No | No |
| Create / invite School Admin accounts | Yes | No | No | No | No | No | No |
| Create / invite Teacher accounts | Yes | No | Yes | No | No | No | No |
| Self-register as Student (direct domain) | Cond | No | No | No | Yes | No | No |
| Self-register as Student (school domain) | No | No | Cond | No | Yes | No | No |
| Register / link as Parent / Guardian | No | No | No | No | No | Yes | No |
| View own profile | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Edit own profile | Yes | Yes | Yes | Yes | Cond | Cond | No |
| View any user profile (platform-wide) | Yes | Yes | No | No | No | No | No |
| View user profiles within tenant | Yes | Yes | Yes | Yes | No | No | No |
| Deactivate / suspend any account | Yes | Cond | Cond | No | No | No | No |
| Delete user account (GDPR erasure) | Yes | No | Cond | No | Cond | No | No |
| Reset password (own) | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Reset password (on behalf of other) | Yes | Cond | Cond | No | No | No | No |
| Enable / require MFA for staff roles | Yes | No | Yes | No | No | No | No |

**Conditions:**
- Self-register as Student (direct domain): the student submits the form; activation requires Super Admin / Platform Moderator approval and, if a minor, verified parental consent.
- Self-register as Student (school domain): approval is by the School Admin of the matched tenant.
- Student editing own profile: restricted fields (e.g., age, email) require re-approval or parental confirmation for minors under the age thresholds defined in Section 6.
- Platform Moderator deactivating/suspending: limited to accounts flagged for safety; cannot deactivate Super Admins.
- School Admin deactivating: restricted to users within their own tenant; cannot deactivate Teachers without Super Admin oversight log.
- School Admin deleting: permitted for students within their tenant subject to a retention hold and audit entry; Super Admin must confirm deletion of Teacher accounts.
- Student GDPR erasure request: routed to School Admin or Super Admin for fulfilment; student cannot self-delete data subject to legal retention obligations.

---

### Table 2 — Signup Approval and Consent

| Capability | Super Admin | Platform Mod | School Admin | Teacher | Student | Parent | Guest |
|------------|:-----------:|:------------:|:------------:|:-------:|:-------:|:------:|:-----:|
| Approve / reject direct student signups | Yes | Yes | No | No | No | No | No |
| Approve / reject school student signups | Yes | No | Yes | No | No | No | No |
| Submit parental consent for minor | No | No | No | No | No | Yes | No |
| View consent records | Yes | Yes | Yes | No | No | Cond | No |
| Revoke parental consent | Yes | No | No | No | No | Yes | No |
| Bulk-invite students (CSV upload) | Yes | No | Yes | Cond | No | No | No |

**Conditions:**
- Parent viewing consent records: limited to their own submitted consent records for their linked children.
- Teacher bulk-invite: only if explicitly delegated by the School Admin; results still require School Admin approval before activation.

---

### Table 3 — RoboCode Studio (Canvas, Components and Wiring)

| Capability | Super Admin | Platform Mod | School Admin | Teacher | Student | Parent | Guest |
|------------|:-----------:|:------------:|:------------:|:-------:|:-------:|:------:|:-----:|
| Access RoboCode Studio (full, persistent) | Yes | Yes | Yes | Yes | Yes | No | No |
| Access RoboCode Studio (demo, ephemeral) | Yes | Yes | Yes | Yes | Yes | No | Yes |
| Create new project | Yes | Yes | Yes | Yes | Yes | No | No |
| Open / edit own project | Yes | Yes | Yes | Yes | Yes | No | No |
| Open / view student project (read-only) | Yes | Yes | Yes | Yes | No | No | No |
| Open / edit student project (with write) | Yes | No | No | Cond | No | No | No |
| Delete own project | Yes | Yes | Yes | Yes | Yes | No | No |
| Delete another user's project | Yes | No | Cond | No | No | No | No |
| Add / remove components on canvas | Yes | Yes | Yes | Yes | Yes | No | No |
| Configure component properties | Yes | Yes | Yes | Yes | Yes | No | No |
| Save and load wiring diagrams | Yes | Yes | Yes | Yes | Yes | No | No |
| Export project (JSON / image / BOM) | Yes | Yes | Yes | Yes | Yes | No | No |
| Share project (view link) | Yes | Yes | Yes | Yes | Yes | No | No |
| Collaborative real-time editing | Yes | Yes | Yes | Yes | Cond | No | No |

**Conditions:**
- Teacher editing a student project with write: only in an active review / mentorship context where the teacher is assigned to the student's class.
- School Admin deleting a student project: only within their tenant, with an audit log entry.
- Student collaborative editing: only within teacher-initiated collaborative sessions or team projects; students cannot grant write access to arbitrary peers.

---

### Table 4 — Simulation (RSE / RVM)

| Capability | Super Admin | Platform Mod | School Admin | Teacher | Student | Parent | Guest |
|------------|:-----------:|:------------:|:------------:|:-------:|:-------:|:------:|:-----:|
| Run simulation (full firmware path) | Yes | Yes | Yes | Yes | Yes | No | No |
| Run simulation (simplified RVM path) | Yes | Yes | Yes | Yes | Yes | No | Yes |
| Pause, reset, step simulation | Yes | Yes | Yes | Yes | Yes | No | No |
| View simulation output (Serial Monitor) | Yes | Yes | Yes | Yes | Yes | No | No |
| Access 3D simulation view | Yes | Yes | Yes | Yes | Yes | No | Cond |
| Access 2D simulation view | Yes | Yes | Yes | Yes | Yes | No | Yes |
| Configure simulation speed | Yes | Yes | Yes | Yes | Yes | No | No |
| Inspect component pin states | Yes | Yes | Yes | Yes | Yes | No | No |
| Override simulation parameters (testing) | Yes | No | No | No | No | No | No |

**Conditions:**
- Guest 3D simulation view: available in the public demo only if the device supports WebGL2; falls back to 2D automatically.

---

### Table 5 — Code Editor and Programming

| Capability | Super Admin | Platform Mod | School Admin | Teacher | Student | Parent | Guest |
|------------|:-----------:|:------------:|:------------:|:-------:|:-------:|:------:|:-----:|
| Write and edit code (Arduino C/C++) | Yes | Yes | Yes | Yes | Yes | No | No |
| Write and edit code (MicroPython) | Yes | Yes | Yes | Yes | Yes | No | No |
| Use block-based coding mode | Yes | Yes | Yes | Yes | Yes | No | Yes |
| Compile / upload sketch to simulator | Yes | Yes | Yes | Yes | Yes | No | No |
| View real-time lint / syntax errors | Yes | Yes | Yes | Yes | Yes | No | No |
| Access autocomplete and API hints | Yes | Yes | Yes | Yes | Yes | No | No |
| Manage included libraries | Yes | Yes | Yes | Yes | Cond | No | No |
| Author / publish shared code snippets | Yes | No | No | Yes | Cond | No | No |
| Use AI Hint Assistant | No | No | No | No | Cond | No | No |
| Enable / disable AI Hint Assistant (per class/assignment) | Yes | No | Cond | Yes | No | No | No |

**Conditions:**
- Student managing included libraries: limited to the approved library catalogue; cannot add arbitrary third-party libraries unless a Teacher or School Admin has pre-approved the library for that class or school.
- Student publishing shared code snippets: subject to moderation approval before snippets become visible to other students.
- Student using AI Hint Assistant: only when enabled by the Teacher/School Admin for the class or assignment, subject to age-tier restrictions and rate limits (see Section 11, UR-CODE-096 to UR-CODE-105). Primary-school students (under 13) receive block-based guidance only.
- School Admin enabling/disabling AI Hint Assistant: at tenant scope; cannot override a platform-level disablement.

---

### Table 6 — Content Authoring and Learning Management

| Capability | Super Admin | Platform Mod | School Admin | Teacher | Student | Parent | Guest |
|------------|:-----------:|:------------:|:------------:|:-------:|:-------:|:------:|:-----:|
| Author global courses / lesson templates | Yes | No | No | No | No | No | No |
| Publish content to global library | Yes | No | No | No | No | No | No |
| Author school-level courses / tasks | Yes | No | Yes | Yes | No | No | No |
| Assign tasks / projects to a class | Yes | No | Yes | Yes | No | No | No |
| View assigned tasks | Yes | Yes | Yes | Yes | Yes | No | No |
| Submit task / project for grading | No | No | No | No | Yes | No | No |
| Grade / annotate student submission | Yes | No | Yes | Yes | No | No | No |
| View own grades and feedback | No | No | No | No | Yes | No | No |
| View all grades within tenant | Yes | No | Yes | No | No | No | No |
| View class grades (own classes) | No | No | No | Yes | No | No | No |
| View child's grades (linked student) | No | No | No | No | No | Yes | No |

---

### Table 7 — Teams, Competitions and Collaboration

| Capability | Super Admin | Platform Mod | School Admin | Teacher | Student | Parent | Guest |
|------------|:-----------:|:------------:|:------------:|:-------:|:-------:|:------:|:-----:|
| Create / archive a competition | Yes | No | Cond | No | No | No | No |
| Enrol a class / school in competition | Yes | No | Yes | Cond | No | No | No |
| Create a team | Yes | No | No | Yes | Cond | No | No |
| Invite / remove team members | Yes | No | No | Yes | Cond | No | No |
| View team projects | Yes | Yes | Yes | Yes | Cond | No | No |
| Submit team project to competition | Yes | No | No | Cond | Cond | No | No |
| Judge / score competition submissions | Yes | No | Cond | Cond | No | No | No |
| View competition results / leaderboard | Yes | Yes | Yes | Yes | Yes | No | Yes |

**Conditions:**
- School Admin creating competition: restricted to school-internal competitions; cross-platform competitions require Super Admin creation.
- Teacher enrolling class in competition: only competitions the School Admin has authorised the school to participate in.
- Student creating a team: only within teacher-created team structures or teacher-sanctioned team formation workflows; students cannot form unsupervised ad-hoc teams involving students from other classes without Teacher approval.
- Student inviting / removing team members: restricted to peers within the same class or competition; requires Teacher confirmation before a member change is finalised.
- Student submitting team project: requires at least one Teacher to have marked the submission as eligible.
- Teacher judging: only in competitions where they have been explicitly assigned as a judge by a School Admin or Super Admin.
- School Admin judging: only for school-internal competitions they administrate.

---

### Table 8 — Gamification and RoboPoints

| Capability | Super Admin | Platform Mod | School Admin | Teacher | Student | Parent | Guest |
|------------|:-----------:|:------------:|:------------:|:-------:|:-------:|:------:|:-----:|
| Award bonus RoboPoints manually | Yes | No | Cond | Yes | No | No | No |
| Deduct / adjust RoboPoints | Yes | No | No | No | No | No | No |
| Configure badge / achievement rules | Yes | No | No | No | No | No | No |
| View own RoboPoints and badges | Yes | Yes | Yes | Yes | Yes | No | No |
| View class / school leaderboard | Yes | Yes | Yes | Yes | Yes | No | No |
| View platform-wide leaderboard | Yes | Yes | No | No | Yes | No | Yes |
| Opt student out of public leaderboard | Yes | No | Yes | Cond | Cond | Yes | No |

**Conditions:**
- School Admin awarding bonus RoboPoints: limited to students within their tenant.
- Teacher opting a student out of leaderboard: the Teacher may recommend an opt-out for a student in their class, which is confirmed by the School Admin or the student's Parent.
- Student opting themselves out: a student (or their Parent for minors) may request opt-out from the public leaderboard; the system must honour the request without requiring approval.

---

### Table 9 — Communication, Notifications and Safety Moderation

| Capability | Super Admin | Platform Mod | School Admin | Teacher | Student | Parent | Guest |
|------------|:-----------:|:------------:|:------------:|:-------:|:-------:|:------:|:-----:|
| Send platform-wide announcements | Yes | Cond | No | No | No | No | No |
| Send school-wide announcements | Yes | No | Yes | No | No | No | No |
| Send class announcements | Yes | No | Yes | Yes | No | No | No |
| Send direct message to Teacher | Yes | No | Yes | Yes | Yes | No | No |
| Send direct message to Student (minor) | Yes | No | Cond | Cond | No | No | No |
| Student-to-student private messaging | No | No | No | No | No | No | No |
| Post in moderated class forum | Yes | Yes | Yes | Yes | Yes | No | No |
| Flag / report content or user | Yes | Yes | Yes | Yes | Yes | No | No |
| Review and action moderation flags | Yes | Yes | Cond | No | No | No | No |
| Configure profanity / PII filter rules | Yes | No | Cond | No | No | No | No |
| Escalate safeguarding incident | Yes | Yes | Yes | Yes | Yes | No | No |
| Receive safety notifications | Yes | Yes | Yes | Yes | No | Yes | No |

**Conditions:**
- Platform Moderator sending platform-wide announcements: only for safety-related notices; general announcements require Super Admin.
- Teacher / School Admin direct messaging to a minor student: all messages are stored and visible in the moderation queue; no private one-to-one channel invisible to the platform's moderation layer exists.
- Student-to-student private messaging: explicitly prohibited. All student-to-student communication occurs in moderated class forums or structured team channels visible to the assigned Teacher.
- School Admin reviewing moderation flags: restricted to flags raised within their tenant.
- School Admin configuring PII/profanity filter rules: may tighten the platform-default rules for their tenant, but cannot loosen below platform minimums.

---

### Table 10 — Branding, Domain and School Configuration

| Capability | Super Admin | Platform Mod | School Admin | Teacher | Student | Parent | Guest |
|------------|:-----------:|:------------:|:------------:|:-------:|:-------:|:------:|:-----:|
| Provision new school tenant | Yes | No | No | No | No | No | No |
| Configure school subdomain | Yes | No | Yes | No | No | No | No |
| Configure school custom domain | Yes | No | Yes | No | No | No | No |
| Upload school logo / brand colours | Yes | No | Yes | No | No | No | No |
| Configure school-level policies | Yes | No | Yes | No | No | No | No |
| Set seat / licence limits | Yes | No | No | No | No | No | No |
| Enable / disable platform features per school | Yes | No | Cond | No | No | No | No |
| View DNS / ACME verification records | Yes | No | Yes | No | No | No | No |

**Conditions:**
- School Admin enabling / disabling platform features: restricted to the subset of features that the Super Admin has made configurable at tenant level. Core safety features (moderation, consent, audit log) cannot be disabled by any role.

---

### Table 11 — Billing and Subscription Management

| Capability | Super Admin | Platform Mod | School Admin | Teacher | Student | Parent | Guest |
|------------|:-----------:|:------------:|:------------:|:-------:|:-------:|:------:|:-----:|
| View all tenant billing records | Yes | No | No | No | No | No | No |
| View own school's billing / invoices | Yes | No | Yes | No | No | No | No |
| Update payment method | Yes | No | Yes | No | No | No | No |
| Upgrade / downgrade subscription plan | Yes | No | Cond | No | No | No | No |
| Issue refunds | Yes | No | No | No | No | No | No |
| Configure pricing plans | Yes | No | No | No | No | No | No |

**Conditions:**
- School Admin upgrading/downgrading plan: may select from available plan tiers defined by Super Admin; cannot access pricing plan configuration.

---

### Table 12 — Reporting and Analytics

| Capability | Super Admin | Platform Mod | School Admin | Teacher | Student | Parent | Guest |
|------------|:-----------:|:------------:|:------------:|:-------:|:-------:|:------:|:-----:|
| View platform-wide usage analytics | Yes | No | No | No | No | No | No |
| View platform-wide safety reports | Yes | Yes | No | No | No | No | No |
| View school-level reports | Yes | No | Yes | No | No | No | No |
| View class-level progress reports | Yes | No | Yes | Yes | No | No | No |
| View own learning progress | No | No | No | No | Yes | No | No |
| View linked child's progress summary | No | No | No | No | No | Yes | No |
| Export reports (CSV / PDF) | Yes | Cond | Yes | Yes | Cond | No | No |
| View audit log | Yes | Cond | Cond | No | No | No | No |

**Conditions:**
- Platform Moderator exporting reports: restricted to safety and moderation reports.
- Platform Moderator viewing audit log: restricted to entries related to content moderation and safety escalations.
- School Admin viewing audit log: restricted to entries within their tenant.
- Student exporting reports: limited to their own progress data (learning transcript), for personal data portability compliance.

---

## Least-Privilege Principles

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-AUTH-090 | Every role must be granted only the minimum set of permissions necessary to perform its defined function on the platform. No role may accumulate broad administrative permissions that are not inherent to its operational purpose. | Must | Verified through a role-rights audit prior to each major release. |
| UR-AUTH-091 | Permissions must be denied by default. Access is granted only by explicit assignment to a role, not through the absence of a denial rule. | Must | API gateway and service-layer middleware must implement deny-by-default; any endpoint not covered by an explicit permission rule must return 403. |
| UR-AUTH-092 | Role escalation (e.g., a Teacher acting as School Admin) must not be possible through any UI path, API parameter, or token manipulation. | Must | Penetration testing must include horizontal and vertical privilege escalation scenarios in the security acceptance criteria. |
| UR-AUTH-093 | Temporary elevated permissions (e.g., Super Admin impersonating a user for support purposes) must require a second Super Admin to co-authorise the session, must be time-limited (maximum 60 minutes), and must generate an immutable audit log entry before the session begins. | Should | Impersonation sessions must be visually distinguished in the UI with a prominent banner and cannot be used to perform irreversible actions (deletion, billing changes). |
| UR-AUTH-094 | Platform Moderator (R-02) must be unable to access billing, tenant provisioning, or pricing configuration. The role is scoped strictly to content safety and approval workflows. | Must | Any attempt to access out-of-scope endpoints must be logged as a security event. |

> Note: least-privilege and delegation rules use the `UR-AUTH-090..102` band to keep them distinct from the authentication and account-management requirements (`UR-AUTH-001..058`) defined in Section 7.

---

## Delegation Model

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-AUTH-100 | A Super Admin may delegate a subset of their approval and moderation authority to a Platform Moderator (R-02). The delegation must be explicit and recorded in the audit log. | Must | Delegation must define the scope (e.g., direct-signup approvals only, or moderation queue only); blanket full-delegation is not permitted. |
| UR-AUTH-101 | A School Admin may delegate the ability to bulk-invite students to a specific Teacher within their tenant. The delegation must be revocable and must be logged. | Should | Delegated Teacher cannot further sub-delegate this capability. |
| UR-AUTH-102 | Delegation does not transfer ownership. A delegated authority holder acts within the scope of the delegation; they cannot grant further permissions to other users beyond those they themselves hold. | Must | Enforced at the API layer; delegation grants a scoped token or claim, not a permanent role change. |

---

## Minor-Student Restrictions

A minor Student is any Student below the operative protected-age threshold defined authoritatively in Section 6 (UR-ONB-027) and Section 21 (UR-NFR-C016): the platform applies the strictest applicable threshold for the student's country of record, with a default of under-18 for human-approval and heightened-protection purposes where the jurisdiction is ambiguous, and the consent thresholds of COPPA (under-13) and GDPR-K (under-16) where those laws apply. See Section 6 for the single reconciled age-threshold model.

These minor-protection rules use the `UR-ONB-090..096` band (Onboarding/Consent area). The canon ID scheme has no area code for the generic "Student" account; the `UR-STU` prefix is reserved for RoboCode Studio Canvas requirements (Section 9). Minor/account-protection requirements therefore live in the Onboarding (`UR-ONB`) area.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ONB-090 | A minor Student account must not be activated until verifiable parental or guardian consent has been recorded in the system. | Must | Consent record must include: consenting adult's name, relationship, email address, confirmation timestamp, IP address, and consent version. |
| UR-ONB-091 | A minor Student must not be able to participate in any unsupervised direct messaging or private communication channel with any other user, including peers, Teachers, or external contacts. | Must | The system must present no UI affordance for private messaging to minor Students. The restriction must also be enforced at the API layer. |
| UR-ONB-092 | A minor Student's profile must collect only the minimum data fields required for platform operation. Fields such as full home address, phone number, or profile photograph are not permitted for minor accounts. | Must | Data schema for minor Student profile must be reviewed against COPPA, GDPR-K, and the Africa regional data protection acts listed in Section 2 before launch. |
| UR-ONB-093 | A minor Student's presence on the public platform-wide leaderboard must be opt-in by default (off). Parents and School Admins may enable public leaderboard visibility; the student may opt in at the age of majority threshold. | Must | Default leaderboard display for minors shows only within-class or within-school rank, never a public cross-school ranking with identifiable name. |
| UR-ONB-094 | Content that a minor Student posts (forum messages, project descriptions, code comments) must be passed through the platform's profanity and PII filter before publication. | Must | PII filter must detect and redact or block email addresses, phone numbers, and full names appearing in free-text fields. |
| UR-ONB-095 | A minor Student's data must not be used for behavioural advertising, profile-based targeting, or shared with third-party advertising platforms. | Must | No advertising SDKs, tracking pixels, or third-party analytics with user-level tracking may be loaded on any page accessible to minor Student accounts. |
| UR-ONB-096 | A Parent / Guardian (R-06) must be able to request the deletion of all personal data for their linked minor Student at any time. The request must be fulfilled within the timelines mandated by the applicable data protection law (30 days for GDPR, 45 days for COPPA). | Must | Deletion workflow must trigger a confirmation to the Parent, notify the School Admin, and generate a deletion certificate in the audit log. Data subject to legal retention obligations (e.g., safeguarding records) must be flagged and retained separately under restricted access. |

---

## Cross-References

- Signup approval flows: see Section 6 (UR-ONB-*) for the step-by-step approval workflows that operationalise the Cond cells in Tables 1 and 2 above.
- Authentication requirements (MFA, SSO, session management): see Section 7 (UR-AUTH-*).
- School configuration and white-labelling: see Section 8 (UR-SCH-*).
- Communication safety and moderation enforcement: see Section 15 (UR-COMM-*, UR-MOD-*).
- Functional enforcement: see System Specification Document FR-AUTH-*, FR-TEN-*, SR-* for implementation of the rules enumerated here.
- Use cases exercising RBAC boundaries: see Section 17 (UC-001 through UC-020).


# User Requirements: Onboarding, Signup and Approval

## Overview

This section specifies the user requirements governing how new users are enrolled onto the
RoboCode.Africa platform and how those enrolments are reviewed, approved, and activated.
Onboarding is the first substantive interaction any user has with the platform; it must
balance openness and accessibility with the platform's prime directive of child safety and
data protection compliance across all target jurisdictions (Zimbabwe, South Africa, Nigeria,
Kenya, the EU, and the US).

The requirements in this section use the identifier prefix **UR-ONB-nnn** and follow
MoSCoW prioritisation. Related authentication requirements are defined separately in
"User Requirements: Authentication and Account Management" (UR-AUTH). School
configuration and white-labelling requirements follow in "User Requirements: School
Onboarding, Custom Domain and White-Labelling" (UR-SCH).

---

## Actors Involved in Onboarding

| Actor | Role in Onboarding |
|---|---|
| Super Admin | Approves or rejects direct (robocode.africa) student/parent signups; creates tenant records; invites School Admins |
| Platform Moderator | Delegated approver for direct signups; flags safeguarding concerns |
| School Admin | Approves or rejects tenant-routed student signups; invites Teachers; imports students in bulk |
| Teacher / Educator | Invites or bulk-imports students into a class; accepts teacher invitation |
| Student | Completes self-registration form; awaits approval; accepts class invite |
| Parent / Guardian | Provides verifiable parental consent for minor students |
| Guest / Visitor | Browses marketing site and limited demo; can initiate self-registration |

---

## Account State Model

All user accounts pass through a defined lifecycle. The platform must enforce these states
throughout the onboarding pipeline.

The state names below are the canonical set defined authoritatively in UR-ONB-056
(`Unverified`, `Pending Parental Consent`, `Pending Approval`, `Waitlisted`, `Active`,
`Suspended`, `Rejected`, `Deleted`). These exact names are used consistently throughout
this section.

```
   [Not Registered]
         |
         | User submits registration
         v
   [Unverified]
         |
         | User clicks email link
         v
   (Minor under digital-consent age?) -- yes --> [Pending Parental Consent]
         |                                                |
         | no                                             | Consent received
         v                                                v
   [Pending Approval]  <--------------------------------- +
         |
         | Approver action
        / \
       /   \
  [Active]   [Rejected]
       |
       | Admin action
       v
  [Suspended]
       |
       | Admin reinstatement
       v
  [Active]

  [Waitlisted]  <-- optional overflow state for main-domain signups
       |
       | Admin promotion
       v
  [Pending Approval]
```

Permitted transitions and their triggers are captured in UR-ONB-016.

---

## Signup Pathways

Two distinct signup entry points exist, each routing to a different approval authority.

```
  Entry URL                    Tenant Assignment         Approver
  ─────────────────────────────────────────────────────────────────
  robocode.africa/signup       No tenant (direct)        Super Admin /
                                                         Platform Moderator

  <school>.robocode.africa/signup  Auto-assign to school  School Admin
  OR school's custom domain

  Teacher invitation link      School tenant pre-set     School Admin /
                               (embedded in token)       Auto on teacher confirm
```

---

## Requirements Tables

### School Self-Registration (UR-ONB-001 to UR-ONB-009)

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-ONB-001 | A School Admin representative **shall** be able to self-register a school (tenant) via a public form on robocode.africa/schools/register, providing school name, country, level (primary/secondary/both), contact email, and an optional logo. | Must | Form is publicly accessible without login. |
| UR-ONB-002 | The school registration form **shall** require acceptance of the RoboCode.Africa Terms of Service and the Data Processing Agreement (DPA). | Must | Checkbox with dated audit record stored. |
| UR-ONB-003 | On school form submission the system **shall** send an email-verification link to the registrant. The link **shall** expire in 24 hours. | Must | Failure sends a re-send option. |
| UR-ONB-004 | After email verification the Super Admin **shall** be notified and **shall** be able to approve or reject the school registration within the Admin dashboard. | Must | Notification via email and in-app alert. |
| UR-ONB-005 | On approval, the system **shall** automatically provision a subdomain (`<slug>.robocode.africa`), an isolated tenant record with a unique `tenant_id`, and a Row-Level Security boundary in the database. | Must | Slug derived from school name; conflicts resolved with numeric suffix. |
| UR-ONB-006 | The approved School Admin **shall** receive a time-limited (72-hour) account-setup link to set a password and configure initial school settings. | Must | Link is single-use and invalidated on first use. |
| UR-ONB-007 | The school self-registration form **should** support selection of a subscription plan (free trial / paid tier) with Africa-appropriate payment methods (Stripe, Paystack, Flutterwave). | Should | Billing integration; free trial requires no payment at registration. |
| UR-ONB-008 | The platform **should** notify the applicant school within 2 business days if the registration has not yet been reviewed, providing an estimated review timeline. | Should | Automated status-check email. |
| UR-ONB-009 | A school registration that is rejected **shall** provide the applicant with a written reason and an option to reapply after addressing the stated issues. | Must | Reason stored in audit log. |

---

### Student Signup — Main Domain (Direct) (UR-ONB-010 to UR-ONB-018)

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-ONB-010 | A prospective student visiting robocode.africa **shall** be able to initiate a self-registration form requesting: username (or display name), email address, age/date-of-birth, country, and school affiliation (optional free-text). | Must | Date-of-birth determines minor status for consent gating. |
| UR-ONB-011 | The signup form **shall** validate the email address via a verification link sent to the provided address before advancing the account to the approval queue. | Must | Unverified accounts are purged after 48 hours. |
| UR-ONB-012 | A direct-signup student account **shall** remain in `Pending Approval` state and **shall not** gain access to any studio or course content until a Super Admin or Platform Moderator explicitly approves the account. | Must | Core safety gate; no self-activation path exists. |
| UR-ONB-013 | The approval queue **shall** be accessible from the Super Admin dashboard and the Platform Moderator dashboard, showing account name, email, age, country, signup date, and verification status. | Must | Sortable and filterable table. |
| UR-ONB-014 | A Super Admin or Platform Moderator **shall** be able to approve, reject, or move a pending account to a **Waitlist** status with a reason and an optional release date. | Must | Bulk action on multiple accounts supported. |
| UR-ONB-015 | On approval, the student **shall** receive an activation email with a secure login link (valid 24 hours), after which they can set a password and begin using the platform. | Must | Link is single-use. |
| UR-ONB-016 | The platform **shall** enforce the account state machine using the canonical state names of UR-ONB-056 (`Unverified` → [`Pending Parental Consent` if minor] → `Pending Approval` → `Active` \| `Rejected` \| `Suspended` \| `Waitlisted`) and **shall** reject any action that violates permitted transitions. | Must | State transitions logged with actor, timestamp, and reason. |
| UR-ONB-017 | A rejected direct-signup applicant **shall** receive a notification with a non-identifying reason and **should** be offered a pathway to sign up through a registered school. | Must / Should | Reason must not expose internal reviewer notes. |
| UR-ONB-018 | A waitlisted student **shall** receive an automated notification when their waitlist position changes or when they are promoted to the approval queue. | Should | Position estimate displayed in the notification. |

---

### Student Signup — School Domain (Tenant-Routed) (UR-ONB-019 to UR-ONB-026)

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-ONB-019 | When a student accesses a signup form via a school subdomain or custom domain, the system **shall** automatically assign the resulting account to that school's tenant. | Must | Tenant resolved from hostname at request time; stored immutably. |
| UR-ONB-020 | A tenant-routed student account **shall** be presented to the School Admin's approval queue (not to the Super Admin queue) for review. | Must | Super Admin retains visibility but delegates primary approval. |
| UR-ONB-021 | A School Admin **shall** be able to approve, reject, or suspend individual or groups of pending student accounts from within the school management dashboard. | Must | Bulk approve supported for efficient class onboarding. |
| UR-ONB-022 | The school signup form **may** be configured by the School Admin to collect additional school-specific fields (e.g., student ID, class/grade). | Could | Extra fields are stored as tenant-scoped profile attributes. |
| UR-ONB-023 | The School Admin **should** be able to configure an optional auto-approve policy for student signups originating from a verified school email domain (e.g., @school.edu.zw), bypassing manual review for emails matching that domain while still requiring email verification and parental consent where applicable. | Should | Domain whitelist configured in tenant settings (UR-SCH). |
| UR-ONB-024 | A School Admin **shall** receive an in-app and email notification whenever a new student signup enters their approval queue, with a configurable digest frequency (immediate / daily / weekly). | Must | Notification preference in School Admin profile. |
| UR-ONB-025 | The platform **shall** prevent a student already enrolled in one tenant from registering a second account under the same email address in another tenant without explicit Super Admin intervention. | Must | Duplicate-email detection cross-tenant at verified-email stage. |
| UR-ONB-026 | On rejection of a tenant-routed signup, the School Admin **shall** supply a reason, and the applicant **shall** be notified with that reason. The student data **shall** be purged or anonymised within 30 days of rejection in accordance with data minimisation obligations. | Must | Purge job scheduled automatically; audit record retained (anonymised). |

---

### Verifiable Parental / Guardian Consent for Minors (UR-ONB-027 to UR-ONB-036)

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-ONB-027 | The platform **shall** determine, at signup from the declared date of birth, two thresholds that govern different obligations (this is the single authoritative age-threshold model for the URD; Section 5 and Section 21 defer to it): (a) **Verifiable parental consent** is required for any student below the digital-consent age — under 13 (COPPA), under 16 (GDPR-K), defaulting to **under 16** when the jurisdiction is uncertain; (b) **Heightened child-protection treatment and human (non-automated) account approval** apply to any student who is a **minor under 18**, reflecting the under-18 protections of the Zimbabwe CDPA and South Africa POPIA. The platform always applies the stricter obligation for the student's country of record. | Must | Age gate applied at form submission; not bypassable. Consent threshold (under-16 default) and minor/approval threshold (under-18) are distinct and both enforced. |
| UR-ONB-028 | For a student determined to be a minor, the system **shall** require a parent or guardian email address to be supplied at signup before the account advances. | Must | Parent email must differ from the student email. |
| UR-ONB-029 | The system **shall** send a consent request email to the provided parent/guardian email address. The email **shall** describe the platform's purpose, the data collected about the child, the rights of the parent, and how to exercise those rights. | Must | Email content reviewed by legal counsel; must comply with COPPA notice requirements. |
| UR-ONB-030 | The consent email **shall** contain an unambiguous "I consent" action link and a "I do not consent" / "report concerns" link. Consent **shall** require the parent to confirm their name and relationship before the action is recorded. | Must | Consent token is time-limited to 14 days; re-send available. |
| UR-ONB-031 | A minor's account **shall** remain in `Pending Parental Consent` state and **shall not** advance to the approval queue until verifiable consent is received. | Must | No content access at this state. |
| UR-ONB-032 | If the parent selects "I do not consent" or if the consent token expires, the system **shall** notify the student (and School Admin if tenant-routed) that the account cannot proceed, and the student data **shall** be scheduled for deletion within 14 days. | Must | Deletion job runs automatically; student receives final notice. |
| UR-ONB-033 | A parent or guardian **shall** be able to withdraw consent at any time via a self-service link in their original consent email or by contacting the platform's Data Protection contact. Withdrawal **shall** trigger account suspension and a 30-day deletion countdown with notification to the student and applicable School Admin. | Must | Satisfies GDPR Art. 7(3) and COPPA parental withdrawal rights. |
| UR-ONB-034 | The platform **should** provide a lightweight parent dashboard (accessible via the consent link or a dedicated login) where the parent can view a summary of the child's activity, update consent, and submit data-subject requests on the child's behalf. | Should | GDPR-K and COPPA parental access right. |
| UR-ONB-035 | Parental consent records **shall** be stored with: parent name, consent action (granted/denied/withdrawn), timestamp, IP address (hashed), and the exact consent text version presented. These records **shall** be retained for the lifetime of the minor's account plus 3 years, and then deleted. | Must | Consent text versioned; any re-consent required on material change. |
| UR-ONB-036 | Where a student's declared age is at or near a jurisdiction boundary (e.g., 15 years 11 months), the platform **shall** still apply the consent requirement and **shall** not rely solely on re-age-verification at the 16th birthday to lift it automatically without a new review. | Must | Conservative posture; re-evaluation triggered on birthday with admin notification. |

---

### Teacher Invitation Flow (UR-ONB-037 to UR-ONB-043)

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-ONB-037 | A School Admin **shall** be able to invite one or more Teachers to the school tenant by entering their email addresses in the school management dashboard; the system sends each a personalised invitation email. | Must | Invitation email includes school name, inviting admin name, and an accept link. |
| UR-ONB-038 | A teacher invitation link **shall** expire after 7 days. An expired link must prompt the invitee to request a re-send, which the School Admin can action from the pending-invitations list. | Must | Re-send available in admin UI; one re-send without admin action (automated). |
| UR-ONB-039 | On accepting an invitation, the Teacher **shall** complete a profile (display name, subject specialisation, optional photo) and set a password, after which their account is immediately activated without a separate approval step. | Must | Teachers are trusted invitees; no additional approval queue. |
| UR-ONB-040 | If a teacher invitee does not already have a RoboCode.Africa account, accepting the invitation **shall** create a new Teacher-role account scoped to the inviting school's tenant. | Must | New account inherits school's branding and tenant_id. |
| UR-ONB-041 | If the invitee already has a RoboCode.Africa account under a different role or tenant, the platform **shall** prompt them to either use the existing account (adding the Teacher role for the new school) or create a separate account, with clear disclosure of data implications. | Should | Dual-tenant teacher support; handled in UR-AUTH. |
| UR-ONB-042 | A School Admin **shall** be able to revoke a pending invitation before it is accepted, immediately invalidating the invite token. | Must | Revoked token returns a clear "invitation cancelled" message if accessed. |
| UR-ONB-043 | The platform **should** support bulk teacher invitation via CSV upload (email, first name, last name, optional subject) with per-row validation and a preview step before sending. | Should | Validation errors shown per row; partial sends not permitted. |

---

### Email Verification (UR-ONB-044 to UR-ONB-048)

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-ONB-044 | All self-registration paths (student, parent, school admin) **shall** require successful email verification as a mandatory first step before any other onboarding action can proceed. | Must | Verification token is HMAC-signed and single-use. |
| UR-ONB-045 | The email verification link **shall** expire in 48 hours for students and parents, and 24 hours for school admin registrations. An in-page prompt **shall** allow resending; the platform **shall** rate-limit resends to 3 per hour per email address. | Must | Rate limiting prevents email-flood abuse. |
| UR-ONB-046 | An unverified account that has not been verified within 7 days **shall** be automatically purged from the system. The applicant **shall** receive a final reminder at 5 days. | Must | Purge job scheduled; reminder email templated. |
| UR-ONB-047 | If an email address is found to be associated with an existing active account during verification, the system **shall** present a "sign in to existing account" path and **shall not** create a duplicate record. | Must | Duplicate prevention; user prompted to log in or recover account. |
| UR-ONB-048 | The platform **should** support email domain allowlist/blocklist configuration at the tenant and global level, preventing signup with known disposable email domains. | Should | Global blocklist maintained by Super Admin; tenant-level additions by School Admin. |

---

### Bulk Student Import (UR-ONB-049 to UR-ONB-055)

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-ONB-049 | A School Admin or Teacher **shall** be able to import multiple students into the school tenant via a CSV file. The required columns are: first name, last name, email address, grade/year group; optional columns include student ID, date of birth, and parent/guardian email. | Must | Template CSV downloadable from the import UI. |
| UR-ONB-050 | The import pipeline **shall** validate each row before processing: email format, duplicate detection (within the tenant and cross-tenant), mandatory field presence, and date-of-birth format. Validation errors **shall** be reported per row in a downloadable error report. | Must | No partial import on validation failure; fix-and-resubmit model. |
| UR-ONB-051 | For each imported student record where a date of birth is provided and the student is a minor, the system **shall** send a parental consent request to the supplied parent email (if present) or flag the record for manual consent collection. | Must | Records without parent email are marked `Consent Pending – Manual` and held. |
| UR-ONB-052 | Bulk-imported students **shall** receive a welcome email with a time-limited (7-day) account-setup link to set their password; the account is created in `Pending Approval` state until the School Admin confirms the batch. | Must | School Admin reviews the import summary before accounts are activated. |
| UR-ONB-053 | The bulk import **shall** support a "preview and confirm" step showing the number of records to be created, the number flagged for consent, and the number with validation warnings, before any accounts are written. | Must | Prevents accidental mass creation. |
| UR-ONB-054 | A School Admin **shall** be able to download an import result report showing per-student outcome (created, duplicate, error, consent-pending) after import completion. | Must | Report available for 30 days after import. |
| UR-ONB-055 | The platform **should** support Google Classroom and Microsoft Teams roster sync as an alternative to CSV import, pulling student names and school emails from the connected IdP. | Should | Phase 2 feature; requires school SSO configuration (UR-AUTH, UR-SCH). |

---

### Account States and Lifecycle (UR-ONB-056 to UR-ONB-062)

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-ONB-056 | The platform **shall** maintain the following named account states for student accounts: `Unverified`, `Pending Parental Consent`, `Pending Approval`, `Waitlisted`, `Active`, `Suspended`, `Rejected`, `Deleted`. Each state **shall** have defined permitted successor states. | Must | State machine enforced server-side; any client attempt to bypass is rejected. |
| UR-ONB-057 | A `Suspended` student account **shall** retain all project data and progress but **shall** deny login. The student **shall** receive a suspension notification with a stated reason and, where applicable, a reinstatement pathway. | Must | GDPR data retention: suspension does not delete data. |
| UR-ONB-058 | A `Rejected` account **shall** have its personal data minimised (name and email replaced with hashed/anonymised values) within 30 days of rejection, retaining only the anonymised audit record. | Must | Data minimisation for minors: mandatory; for adults: default. |
| UR-ONB-059 | A `Deleted` account state **shall** be triggered by: user-initiated account deletion request, admin deletion, parental withdrawal of consent (for minors), or automated purge of unverified/abandoned registrations. Deletion **shall** irreversibly anonymise PII within 30 days subject to legal retention obligations. | Must | Right to erasure (GDPR Art. 17); COPPA deletion obligations. |
| UR-ONB-060 | A Super Admin or School Admin **shall** be able to reinstate a `Suspended` account to `Active` with a documented reason. | Must | Reinstatement audit-logged. |
| UR-ONB-061 | The platform **shall** provide Super Admins and School Admins with a filterable account-state dashboard showing counts and lists for each account state within their scope. | Must | Real-time or near-real-time counts (max 60-second lag). |
| UR-ONB-062 | The platform **should** send automated reminders to approvers when accounts have been in `Pending Approval` state for more than 3 business days, escalating to the Super Admin if no action is taken within 7 days. | Should | Configurable escalation thresholds. |

---

### Waitlist and Notifications (UR-ONB-063 to UR-ONB-066)

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-ONB-063 | The Super Admin **shall** be able to activate a waitlist mode for direct signups on the main domain, routing new applicants to `Waitlisted` instead of `Pending Approval` when platform capacity constraints apply. | Could | Capacity management feature; off by default. |
| UR-ONB-064 | A waitlisted applicant **shall** receive an email confirming their waitlist position and expected wait time (if known), and **shall** be notified by email when promoted to the approval queue. | Must | Applies if waitlist mode is active (UR-ONB-063). |
| UR-ONB-065 | A student **shall** be able to withdraw their own application while in `Pending Approval` or `Waitlisted` state, triggering data minimisation within 14 days. | Should | Self-service withdrawal link in the "your application is pending" email. |
| UR-ONB-066 | All notification emails sent during onboarding **shall** use the tenant's white-label branding (logo, colours, sender name) when originating from a school domain, and RoboCode.Africa default branding on the main domain. | Must | Email template system respects tenant theme tokens (UR-SCH). |

---

## Approval Experience by Actor

### Super Admin / Platform Moderator View

The Super Admin accesses a global **Pending Approvals** panel within the Admin dashboard.
This panel aggregates all direct-signup applications (no tenant assignment). Each row
shows: applicant display name, email (masked after first character), declared age,
country, signup date, email-verification status, and parental-consent status (for minors).

Actions available per row and in bulk: Approve, Reject (with required reason), Move to
Waitlist (with optional release date), View full application detail. All actions are
timestamped and recorded against the acting administrator's account in the audit log.

The Platform Moderator has identical access to this panel but cannot alter platform-wide
settings. Approval emails are dispatched immediately on action. Safeguarding flags raised
during application review (e.g., concerning profile content) are escalated to the Super
Admin via a dedicated moderation queue, cross-referencing "User Requirements:
Communication, Notifications and Safety" (UR-COMM).

### School Admin View

The School Admin sees a tenant-scoped **Student Approvals** panel within the school
management area. Only applicants who registered via that school's subdomain or custom
domain appear here. The panel shows class/grade (if supplied), student ID (if supplied),
email, date, and consent status.

The School Admin can approve individual students or bulk-approve an entire class cohort
after reviewing the list. For minor students awaiting parental consent the approval button
is disabled until consent is received (or the School Admin has documented offline consent
collection). The School Admin cannot approve accounts that belong to a different tenant.

On approval, student accounts transition to `Active` and the student receives an
activation email branded with the school's theme.

### Student Applicant View

After submitting the registration form, the student sees a confirmation page stating that:

1. A verification email has been sent.
2. Once verified, the application will be reviewed.
3. If they are a minor, a consent request will be sent to the provided parent/guardian
   email.

The student receives status emails at each state transition. A status-check URL (no login
required) allows the student to view the current state of their application without
exposing approval queue details.

### Parent / Guardian View

After the student submits the registration form naming a parent/guardian email, the parent
receives a consent-request email (see UR-ONB-029). The email presents:

- Platform name and purpose
- What personal data will be collected from the child
- How data is protected and deleted
- Contact details for the Data Protection Officer
- "I give consent" button
- "I do not consent / report concern" button

Clicking "I give consent" presents a brief form to confirm the parent's name and
relationship before recording consent (see UR-ONB-030). The parent is then directed to a
confirmation page and, optionally, offered a link to create a parent account for
on-going activity visibility (UR-ONB-034).

---

## Compliance Mapping

| Requirement Cluster | Legal Obligation | Key Standard |
|---|---|---|
| Minor consent gate (UR-ONB-027 to UR-ONB-036) | COPPA (under 13), GDPR-K (under 16), POPIA, NDPR | Verifiable parental consent before data processing |
| Email verification (UR-ONB-044 to UR-ONB-048) | Data minimisation; fraud prevention | GDPR Art. 5(1)(c) |
| Data deletion on rejection/withdrawal (UR-ONB-026, UR-ONB-032, UR-ONB-058, UR-ONB-059) | Right to erasure | GDPR Art. 17; COPPA; Zimbabwe CDPA |
| Audit logging of all approval actions | Accountability principle | GDPR Art. 5(2); POPIA; NDPR |
| Consent record retention (UR-ONB-035) | Demonstrable compliance | GDPR Art. 7(1); COPPA 312.5 |
| Parental withdrawal (UR-ONB-033) | Right to withdraw consent | GDPR Art. 7(3); COPPA |

---

## Cross-References

- "User Requirements: Authentication and Account Management" (UR-AUTH) — password
  policies, SSO, MFA, session management after account activation.
- "User Requirements: School Onboarding, Custom Domain and White-Labelling" (UR-SCH) —
  subdomain provisioning, custom domain DNS, white-label email branding.
- "User Requirements: Administration and Reporting" (UR-ADM) — audit log access,
  platform-wide user management, seat limits.
- "User Requirements: Communication, Notifications and Safety" (UR-COMM) — safeguarding
  escalation, moderation queue, profanity/PII filtering in user-submitted fields.
- "User Requirements: Teams, Competitions and Collaboration" (UR-TEAM) — team formation
  rules that depend on account being in `Active` state.
- Use Cases (UC section) — UC-001 (Student Self-Registration), UC-002 (School
  Registration), UC-003 (Parental Consent), UC-004 (Bulk Student Import), UC-005
  (Teacher Invitation).

---

## Summary of MoSCoW Priorities

| Priority | Count | Requirement IDs |
|---|---|---|
| Must | 52 | UR-ONB-001 to -006, -009 to -016, -019 to -021, -024 to -033, -035 to -040, -042, -044 to -047, -049 to -054, -056 to -061, -064, -066 |
| Should | 11 | UR-ONB-007 to -008, -018, -023, -034, -041, -043, -048, -055, -062, -065 |
| Could | 2 | UR-ONB-022, UR-ONB-063 |
| Must / Should | 1 | UR-ONB-017 (Must for notification; Should for school-pathway offer) |
| Won't (this release) | 0 | — |

Total: 66 requirements (UR-ONB-001 to UR-ONB-066). The seven minor-protection requirements UR-ONB-090 to UR-ONB-096 are defined in Section 5 (Minor-Student Restrictions) and are all Must.


# User Requirements: Authentication and Account Management

## Overview

This section defines user requirements for all aspects of identity verification, credential management, session control, profile self-service, and account lifecycle on RoboCode.Africa. It applies across the main domain (`robocode.africa`) and all school tenants (`<school>.robocode.africa` and custom domains). Requirements are grounded in the child-safety and data-protection legal set described in the project canon: COPPA, GDPR/GDPR-K, Zimbabwe Cyber and Data Protection Act, South Africa POPIA, Nigeria NDPR, and Kenya Data Protection Act.

All requirements apply to the seven defined user roles: **Super Admin**, **Platform Moderator**, **School Admin**, **Teacher / Educator**, **Student** (primary and high-school sub-classes), **Parent / Guardian**, and **Guest / Visitor**. Where a requirement is role-specific, the applicable role(s) are noted in the Acceptance / Notes column.

Cross-references to adjacent sections: _User Requirements: Onboarding, Signup and Approval_ (UR-ONB) for pre-activation flows; _User Requirements: School Onboarding, Custom Domain and White-Labelling_ (UR-SCH) for SSO federation; _User Requirements: Administration and Reporting_ (UR-ADM) for audit log access and account moderation tools; _User Requirements: Communication, Notifications and Safety_ (UR-COMM) for notification delivery preferences.

---

## Login Methods

### Email / Username and Password Authentication

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-AUTH-001 | The platform shall allow every activated account holder to sign in with either their registered email address or a chosen username, combined with their password. | Must | Both identifiers must resolve to the same account. Username must be unique per platform. |
| UR-AUTH-002 | Login credentials shall be transmitted exclusively over TLS 1.2 or higher; the platform must refuse plaintext HTTP submissions. | Must | Applies to main domain and all tenant subdomains/custom domains. |
| UR-AUTH-003 | Failed login attempts shall be rate-limited; after five consecutive failures the platform shall impose a time-based lockout (minimum 15 minutes) and notify the account holder via email. | Must | Lockout duration must be configurable by Super Admin. Lockout notification must not reveal whether the account exists (to prevent enumeration). |
| UR-AUTH-004 | The platform shall display a user-friendly, role-appropriate error message on authentication failure that does not disclose whether the email/username or the password was incorrect. | Must | Error text must be identical for both failure modes. |
| UR-AUTH-005 | The platform shall support a "Remember this device" persistent-session option (up to 30 days) that a user may opt into at login. | Should | Persistent sessions must be revocable individually from the Sessions screen. Not available on shared-device mode (see UR-AUTH-030). |

### School Single Sign-On (SSO)

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-AUTH-006 | School tenants shall be able to federate authentication via OAuth 2.0 / OIDC with Google Workspace for Education and Microsoft Azure AD (Entra ID), enabling students and teachers to sign in with school-issued accounts. | Must | SSO configuration is performed by the School Admin (see UR-SCH). |
| UR-AUTH-007 | When a student or teacher arrives from an SSO provider for the first time, the platform shall automatically match them to an existing pending account (matched on email) or create a new account record and route it through the standard approval workflow before granting access. | Must | First-time SSO login must not bypass the approval and, where applicable, parental-consent gate (see UR-ONB). |
| UR-AUTH-008 | If a school's SSO provider is unavailable, users belonging to that tenant shall be able to fall back to email/password authentication, provided they have set a local password. | Should | Fallback availability must be communicated to users on the login screen. |
| UR-AUTH-009 | The platform shall surface a clear indication on the login page of each tenant as to which SSO providers are available, using the tenant's white-label branding. | Should | SSO buttons must use official IdP brand assets (Google, Microsoft icons) per their brand guidelines. |
| UR-AUTH-010 | SAML 2.0 federation shall be supported for enterprise or government school districts that cannot use OIDC. | Could | SAML implementation may be deferred to a later release but the architecture must not preclude it. |

---

## Password Policy

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-AUTH-011 | Password policy shall be age-adaptive: for primary-school students (under 13) a minimum of 8 characters with at least one letter and one digit is required; for high-school students and adult roles a minimum of 10 characters with at least one uppercase letter, one digit, and one special character is required. | Must | Policy must be clearly communicated at the point of password creation with a real-time strength indicator. |
| UR-AUTH-012 | The platform shall check new passwords against a known-breached-passwords list (e.g., Have I Been Pwned k-anonymity API) and reject any password found on that list, regardless of complexity. | Must | The rejection message must not disclose which list or service was consulted. |
| UR-AUTH-013 | Passwords must be stored using a modern adaptive hashing algorithm (bcrypt, Argon2id, or scrypt with appropriate cost factors); plaintext or reversible storage is strictly prohibited. | Must | Hashing algorithm and cost factor must be reviewed and updated as hardware performance increases. |
| UR-AUTH-014 | Users shall be prompted to change their password if it was set more than 365 days ago; the prompt must be advisory (non-blocking) for students and mandatory (blocking) for Super Admin, Platform Moderator, and School Admin accounts. | Should | Admin-role mandatory rotation period must be configurable (default 90 days). |
| UR-AUTH-015 | The platform shall prevent reuse of the previous five passwords when a user changes their password. | Should | Applies to all roles. |

---

## Multi-Factor Authentication (MFA)

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-AUTH-016 | MFA shall be mandatory for Super Admin and Platform Moderator accounts; the platform shall block access until MFA is enrolled. | Must | Applies from first login after account activation. |
| UR-AUTH-017 | MFA shall be mandatory for School Admin accounts; School Admins must enrol within 48 hours of account activation or the account will be suspended pending enrolment. | Must | Grace period and suspension behaviour must be communicated at activation. |
| UR-AUTH-018 | MFA shall be strongly recommended (opt-in with a persistent reminder) for Teacher / Educator accounts. | Should | School Admin may enforce MFA for all teachers in their tenant via policy settings (UR-SCH). |
| UR-AUTH-019 | MFA shall be optional and not promoted to primary-school students; high-school students (13 and above) may opt in to MFA if they choose. | Could | Offering MFA to minors must be subject to parental consent if required by applicable jurisdiction. |
| UR-AUTH-020 | Supported MFA methods shall include: TOTP authenticator app (RFC 6238 compliant, e.g., Google Authenticator, Authy, Microsoft Authenticator) and email one-time passcode (OTP) as a fallback channel. | Must | SMS OTP shall be offered as a secondary fallback where SMS connectivity is available (low-connectivity accommodation for African regions). |
| UR-AUTH-021 | Users with MFA enrolled shall be given one-time backup codes (minimum eight, each single-use) at enrolment; the user must acknowledge they have stored the codes before enrolment is considered complete. | Must | Backup codes must be regeneratable; regeneration invalidates all previous codes and triggers an audit log entry and email notification. |
| UR-AUTH-022 | MFA challenges shall time out after 5 minutes; a new challenge code must be requestable by the user. | Must | TOTP codes follow the 30-second RFC 6238 window; the platform shall accept the current and immediately preceding interval to accommodate clock skew. |

---

## Account Recovery

### Self-Service Password Reset

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-AUTH-023 | Any account holder with a verified email address shall be able to initiate a self-service password reset via a "Forgot password" flow; the platform shall send a time-limited reset link (valid for 60 minutes, single-use) to the registered email. | Must | Reset link must be invalidated immediately after use or expiry. |
| UR-AUTH-024 | After a successful password reset, all existing sessions for that account shall be immediately invalidated; the user must be notified of the reset by email and, if available, SMS. | Must | Notification must include a link to report the reset as unauthorised. |
| UR-AUTH-025 | If MFA is enrolled, the password reset flow shall require the user to pass an MFA challenge before presenting the new-password form, OR (if MFA device is also lost) escalate to an admin-assisted recovery path. | Must | Admin-assisted path: for staff roles → Super Admin or Platform Moderator; for students → School Admin or Teacher. |

### Guardian- and Admin-Assisted Recovery for Minors

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-AUTH-026 | For student accounts where the student cannot complete self-service recovery (no access to registered email, MFA device lost), the Teacher or School Admin shall be able to initiate a supervised password reset on behalf of the student, with a full audit trail. | Must | The supervised reset must generate a temporary password valid for one login, forcing the student to set a new permanent password immediately. |
| UR-AUTH-027 | For minor students, a verified Parent / Guardian shall be able to request an account-recovery review on behalf of their child; the School Admin must approve the recovery action before it is executed. | Should | Recovery request must be logged with requestor identity, timestamp, and approval action. |
| UR-AUTH-028 | All admin-assisted and guardian-assisted recovery actions shall generate an immutable audit log entry and trigger an email notification to the affected account holder. | Must | Notification must be sent to both the student's email and the guardian's email where a guardian is associated. |

### Username Reminder

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-AUTH-029 | The platform shall provide a "Remind me of my username" function accessible from the login page; entering a verified email address shall trigger an email listing the username(s) associated with that address. | Must | The email must not include any password hint or credential information. |

---

## Session Management

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-AUTH-030 | The platform shall support a "Shared device / classroom mode" that disables persistent sessions, clears cookies on browser close, and enforces re-authentication on each visit; this mode shall be activatable by a Teacher or School Admin for a given classroom or device group. | Must | In shared-device mode, "Remember this device" (UR-AUTH-005) must be hidden. |
| UR-AUTH-031 | Idle sessions shall be automatically invalidated after a configurable inactivity timeout: default 30 minutes for student accounts, default 60 minutes for staff accounts, and default 15 minutes for Super Admin and Platform Moderator accounts. | Must | Timeout values must be configurable by Super Admin within defined minimum/maximum bounds. |
| UR-AUTH-032 | Users shall be warned 2 minutes before their session expires with an option to extend the session without re-entering credentials (for non-admin roles). | Should | Admin roles must re-authenticate to extend. |
| UR-AUTH-033 | Each account holder shall have a self-service "Active Sessions" screen showing all currently active sessions (device type, browser, approximate location derived from IP, last active time) with the ability to revoke any or all individual sessions. | Must | Location data displayed must be at city level at most; precise IP must not be shown to the user. |
| UR-AUTH-034 | When a user's role or account status changes (e.g., suspension, role revocation), all active sessions for that account must be invalidated within 60 seconds. | Must | Session invalidation must propagate to all services via token revocation list or short-lived JWT with real-time revocation check. |
| UR-AUTH-035 | JWTs issued as access tokens shall have a maximum lifespan of 15 minutes; refresh tokens shall have a maximum lifespan of 7 days and must be rotated on each use (rotation invalidates the previous refresh token). | Must | Refresh token rotation must be idempotent within a short race window (< 5 s) to handle network retries. |

---

## Profile Management

### Personal Information and Avatars

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-AUTH-036 | Every user shall have an editable profile comprising: display name, username, email address (change requires re-verification), optional bio, avatar, preferred language, and accessibility preferences. | Must | Fields collected from minors must be limited to what is strictly necessary (data minimisation). |
| UR-AUTH-037 | Avatar selection for student accounts shall be restricted to a curated library of safe, non-identifying cartoon/robot/STEM-themed avatars provided by the platform; upload of custom photo avatars by students shall be disabled by default. | Must | School Admin may enable custom avatar upload for high-school student accounts if their safeguarding policy permits; any uploaded image must pass automated content moderation before display. |
| UR-AUTH-038 | Adult roles (Teacher, School Admin, Platform Moderator, Super Admin) may upload a custom profile photo; uploaded images must be scanned for inappropriate content using an automated moderation service before being displayed publicly. | Should | Moderation service must be configurable by Super Admin (e.g., AWS Rekognition or equivalent). |
| UR-AUTH-039 | Display names for student accounts must be subject to a profanity/PII filter before acceptance; the filter must be applied on create and update, and flag results must be reviewed by a Teacher or School Admin. | Must | The filter must align with the moderation rules defined in UR-COMM. |
| UR-AUTH-040 | Users shall be able to update their email address; the update must require re-entry of the current password, send a verification link to the new address (valid 24 hours), and send a notification to the old address informing the holder of the change. | Must | For minor students, an email address change must also notify the associated Parent / Guardian. |

### Language and Accessibility Preferences

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-AUTH-041 | The platform UI shall be internationalised (i18n); each user shall be able to select their preferred display language from the languages supported by the platform; the preference must persist across sessions. | Must | Initial release must support English; the architecture must support addition of further languages (Shona, Zulu, Swahili, French, Portuguese, Hausa) without code changes. |
| UR-AUTH-042 | Users shall be able to set accessibility preferences in their profile, including: high-contrast mode, reduced-motion mode, enlarged text size, and screen-reader-optimised mode; all preferences must be respected throughout the platform including RoboCode Studio. | Must | Accessibility preferences must comply with WCAG 2.2 AA (see UR-NFR). |
| UR-AUTH-043 | Accessibility and language preferences shall be applied immediately upon change without requiring a page reload or re-login. | Should | Implementation via CSS custom properties / design tokens and real-time state update. |

### Privacy Settings

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-AUTH-044 | Each user shall have a Privacy Settings screen allowing them to control: visibility of their profile to other students (within class, within school, or private); whether their RoboPoints score and leaderboard position are publicly visible; and whether their project portfolio is publicly accessible. | Must | Default privacy settings for minor students must be the most restrictive option (private / class-only). |
| UR-AUTH-045 | Student privacy settings must not be overridable by a Teacher or School Admin to a less restrictive level than the student or their guardian has selected; Admins may only enforce more restrictive settings. | Must | Ensures minor data protection compliance. |
| UR-AUTH-046 | No behavioural advertising, tracking pixels, or third-party analytics that profile individual users shall be enabled on any minor account at any time, irrespective of privacy settings. | Must | Applies globally across main domain and all tenant domains. |

---

## Data Export and Account Deletion

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-AUTH-047 | Every account holder (and, for minors, their Parent / Guardian or School Admin acting on their behalf) shall be able to request a full export of their personal data in a portable machine-readable format (JSON or CSV) from the Privacy & Data screen. | Must | Export must be generated within 30 days of request (GDPR Art. 20, POPIA, Zimbabwe Cyber and Data Protection Act). Export must be delivered via a time-limited secure download link. |
| UR-AUTH-048 | The data export package shall include: profile information, project files, submitted task responses, RoboPoints history, communication records attributable to the user, and consent records. | Must | Export must exclude other users' personal data; references to other users must be anonymised. |
| UR-AUTH-049 | Any account holder shall be able to request permanent deletion of their account and all associated personal data (right to erasure / right to be forgotten). | Must | GDPR Art. 17, COPPA deletion rights, POPIA, Zimbabwe and other African data laws. |
| UR-AUTH-050 | Account deletion requests for minor students must be initiated or co-approved by a verified Parent / Guardian or the School Admin; self-initiated deletion by a minor alone must trigger an approval workflow rather than immediate deletion. | Must | Protects against accidental or coerced deletion; ensures institutional data continuity. |
| UR-AUTH-051 | Upon confirmed account deletion: all personal data must be purged within 30 days; anonymised or aggregated statistical records that cannot reasonably be re-identified may be retained for platform analytics; audit log entries referencing the account must be pseudonymised but retained for the legally required period. | Must | Retention schedule must be documented in the platform's published Privacy Policy. |
| UR-AUTH-052 | During the deletion cooling-off period (7 days from request confirmation), the user shall be able to cancel the deletion request; after the cooling-off period expires, deletion is irreversible. | Should | User must be notified by email at request time and again 24 hours before the cooling-off period ends. |

---

## Consent Records and Parental Controls

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-AUTH-053 | The platform shall maintain a verifiable, timestamped consent record for every minor account, capturing: consent type (parental, guardian), verification method, consenting party identity (name, email), date, and platform version of the Privacy Policy consented to. | Must | Required by COPPA, GDPR-K, and equivalent African frameworks. Consent records must be immutable and auditable. |
| UR-AUTH-054 | A Parent / Guardian shall be able to withdraw consent for their child's account at any time via a self-service Parental Portal screen; withdrawal of consent must immediately suspend the student account and initiate the deletion workflow (unless the school retains a separate lawful basis). | Must | Suspension is immediate; deletion follows the standard 30-day cycle with School Admin notification. |
| UR-AUTH-055 | The platform must re-seek consent from the Parent / Guardian if the Privacy Policy materially changes in a way that affects data processing for minors; the student account must be suspended until consent is renewed. | Must | Material change detection is the responsibility of the Super Admin/legal team; the platform must support triggering a re-consent campaign. |

---

## Security Events and Audit Logging

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-AUTH-056 | The platform shall log the following authentication events with timestamp, user identifier, IP address (hashed for minors), and outcome: successful login, failed login, MFA challenge success/failure, password reset requested, password reset completed, SSO login, session created, session revoked, account locked, account unlocked. | Must | Logs must be immutable, tamper-evident, and retained for a minimum of 12 months. |
| UR-AUTH-057 | Any anomalous authentication event (login from a new country, login at unusual hours, rapid sequential failures from multiple IPs) shall trigger an automated alert to the account holder by email and, where applicable, to the School Admin or Super Admin. | Should | Anomaly detection thresholds must be configurable by Super Admin. |
| UR-AUTH-058 | Super Admins and Platform Moderators shall have access to a searchable, filterable authentication event log across all tenants; School Admins shall have access to the authentication event log for their own tenant only. | Must | Log access must itself be audit-logged. See UR-ADM. |

---

## MoSCoW Priority Summary

The table below consolidates all requirements in this section by priority tier.

| Priority | Requirement IDs |
|----------|-----------------|
| Must | UR-AUTH-001, 002, 003, 004, 006, 007, 011, 012, 013, 016, 017, 020, 021, 022, 023, 024, 025, 026, 028, 029, 030, 031, 033, 034, 035, 036, 037, 039, 040, 042, 044, 045, 046, 047, 048, 049, 050, 051, 053, 054, 055, 056, 058 |
| Should | UR-AUTH-005, 008, 009, 014, 015, 018, 020 (SMS), 027, 032, 038, 041, 043, 052, 057 |
| Could | UR-AUTH-010, 019 |
| Won't (this release) | _(none identified; SAML deferred architecture-only — see UR-AUTH-010)_ |

---

## Summary of Key Principles

The following principles underpin every requirement in this section and must be carried forward into the System Specification Document (SSD) and implementation:

**Safety first.** Minor student accounts default to the most restrictive, most private, most supervised configuration. Any feature that relaxes this must require an explicit opt-in from an adult (guardian or admin), not from the student alone.

**Age-adaptive UX.** Password rules, MFA options, recovery paths, and consent mechanisms are calibrated to the cognitive level and jurisdictional obligations for the age group in question.

**Zero-knowledge on failure.** Error messages, timing, and HTTP response codes on login and recovery flows must never reveal whether an account exists, whether a password was correct, or what specific rule was violated — protecting all users from enumeration attacks.

**Least-privilege session tokens.** Short-lived access tokens, rotating refresh tokens, and immediate revocation on role or status change minimise the attack surface of any single compromised credential.

**Portable and deletable data.** The right to data portability and the right to erasure are first-class product features, not afterthoughts, honouring the full set of applicable African and international data-protection laws.

**Comprehensive audit trail.** Every authentication and account-management event is logged immutably, enabling safeguarding escalation, compliance demonstration, and incident investigation without relying on user testimony alone.


# User Requirements: School Onboarding, Custom Domain and White-Labelling

## Overview

This section defines the user requirements for the end-to-end journey of onboarding a school (Tenant) onto RoboCode.Africa: from initial organisation account creation through subdomain/custom-domain configuration, DNS verification, automatic TLS provisioning, branding and white-labelling, policy governance, and seat/licence management. Together these requirements enable any accredited school to operate a fully isolated, optionally branded instance of RoboCode.Africa under its own domain while remaining governed by the platform's safety-first policies.

Cross-references: requirements in this section complement the account authentication requirements in **Section 7 (User Requirements: Authentication and Account Management)** and the administration and reporting requirements in **Section 16 (User Requirements: Administration and Reporting)**. The underlying technical implementation (multi-tenant Postgres RLS, subdomain/custom-domain routing, ACME/Let's Encrypt TLS, white-label design tokens) is specified in the System Specification Document sections on **Multi-Tenancy (TEN module)** and **Identity (AUTH module)**.

> **Requirement-ID banding (this section).** UR-SCH identifiers in this section are deliberately banded by topic, so non-contiguous numbering (e.g., -008 then -010, -014 then -020) indicates an intentional gap reserved for future requirements within that band, not an omission. The bands are: 001–019 registration & subdomain; 020–029 custom domain, DNS & TLS; 030–039 branding & white-label; 040–049 registration mode & age groups; 050–059 seat/licence management; 060–069 policy & branding governance. Note: the tenant-scoping access-control rules `UR-SCH-090..095` are defined in Section 5 (Roles and Permissions), not here.

---

## Context and Scope

A **Tenant** in RoboCode.Africa is a School represented as an isolated organisational unit with:

- A dedicated subdomain: `<school-slug>.robocode.africa`
- An optional custom domain: e.g. `code.myrwadzano.ac.zw`
- Its own branding (logo, colours, favicon, landing page copy)
- A private student roster approved by the **School Admin**
- Configurable feature policies, age-group settings, and seat quotas

The **School Admin (Tenant Admin)** role owns the onboarding journey. The **Super Admin** approves or rejects the school registration before the tenant is activated. All requirements in this section apply to the onboarding flow experienced by a School Admin, with Super Admin oversight noted where applicable.

---

## School Organisation Account Creation

### Description

A representative of a school (prospective School Admin) registers the school as an organisation on RoboCode.Africa. The registration is submitted as a request and must be approved by a **Super Admin** or **Platform Moderator** before the tenant is activated. Until approval, no students or teachers may sign up under that school.

### Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-SCH-001 | A prospective School Admin shall be able to submit a new school registration request via a dedicated **Register Your School** form on the `robocode.africa` marketing site. | Must | Form is publicly accessible without prior authentication. |
| UR-SCH-002 | The registration form shall collect: legal school name, country, physical address, school type (primary / secondary / both), estimated student count, School Admin full name, work email address, contact phone number, and agreement to the Platform Terms of Service and Data Processing Agreement. | Must | All fields mandatory. Email must be a verifiable institutional address (domain not blacklisted). |
| UR-SCH-003 | The system shall send an email verification link to the School Admin's submitted work email address; the registration request shall not be forwarded to Super Admin review until the email address is verified. | Must | Link expires after 48 hours; re-send available. |
| UR-SCH-004 | Upon email verification, the system shall create the school registration in **Pending Approval** status and notify the Super Admin / Platform Moderator queue for review. | Must | Super Admin sees all pending school requests in the Administration dashboard (see Section 16). |
| UR-SCH-005 | The Super Admin shall be able to approve, request changes to, or reject a school registration, with a mandatory free-text reason for any rejection or change request. | Must | Rejection reason is emailed to the School Admin. |
| UR-SCH-006 | Upon approval, the system shall automatically provision the tenant: create the database partition (tenant_id with Row-Level Security), assign the default subdomain, and send the School Admin an account-activation link. | Must | Activation link is single-use and expires after 7 days. |
| UR-SCH-007 | The School Admin shall set a strong password (minimum 12 characters, uppercase, lowercase, digit, symbol) and configure TOTP-based MFA as part of the initial activation flow before accessing the tenant dashboard. | Must | TOTP MFA is mandatory for all School Admins and Teachers (see UR-AUTH-xxx). |
| UR-SCH-008 | The system shall record a complete audit log entry for every state transition of the school registration (submitted, email-verified, pending-review, approved/rejected, activated). | Must | Audit logs stored for a minimum of 7 years per data-protection requirements. |

---

## Subdomain Assignment

### Description

Every approved school is automatically assigned a canonical subdomain of the form `<school-slug>.robocode.africa`. The school slug is derived from the school name but is editable during onboarding, subject to uniqueness and formatting constraints.

### Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-SCH-010 | The system shall auto-generate a suggested school slug from the legal school name (lower-case, ASCII, hyphens; no spaces or special characters) and present it for confirmation during activation. | Must | Example: "Harare High School" → `harare-high-school`. |
| UR-SCH-011 | The School Admin shall be able to edit the auto-generated slug during initial activation, subject to: 3–48 characters, letters/digits/hyphens only, no leading or trailing hyphen, and global uniqueness across all tenants. | Must | Real-time availability check via the API before submission. |
| UR-SCH-012 | Once the subdomain is confirmed and the tenant activated, the school slug shall be immutable unless changed by a Super Admin, to protect existing links and SSO configurations. | Must | School Admin may request a slug change via a support ticket visible in the admin panel. |
| UR-SCH-013 | The resulting subdomain (`<slug>.robocode.africa`) shall be routed to the tenant's branded landing/login page within 5 minutes of activation. | Must | DNS wildcard `*.robocode.africa` is pre-configured at the platform level; no DNS action required from the school for the subdomain. |
| UR-SCH-014 | The School Admin dashboard shall display the active subdomain URL prominently with a one-click copy button and a **Share with Students** mailto/link helper. | Should | |

---

## Custom Domain Configuration

### Description

Schools may optionally connect their own domain or subdomain (e.g. `code.myschool.edu`) to their RoboCode.Africa tenant. The platform guides the School Admin through the required DNS changes, verifies ownership, and automatically provisions a TLS certificate. This is an advanced step available after initial tenant activation.

### Custom Domain Flow

```
School Admin                 RoboCode.Africa Platform           DNS / CA
     |                               |                              |
     |-- Request custom domain ----->|                              |
     |                               |-- Generate TXT/CNAME ------->|
     |<-- Show DNS instructions -----|    verification tokens        |
     |                               |                              |
     |  (Admin adds CNAME/TXT        |                              |
     |   records at registrar)       |                              |
     |                               |                              |
     |-- Click "Verify DNS" -------->|                              |
     |                               |-- Poll / check DNS records ->|
     |                               |<-- Records resolved ----------|
     |                               |                              |
     |                               |-- ACME challenge (Let's Encrypt)
     |                               |-- TLS certificate issued ----|
     |<-- Domain active confirmation-|                              |
     |                               |                              |
     |  (All traffic to custom       |                              |
     |   domain served over HTTPS    |                              |
     |   by the platform CDN/edge)   |                              |
```

### Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-SCH-020 | The School Admin shall be able to initiate custom-domain configuration from the **Domain Settings** section of the School Admin dashboard at any point after tenant activation. | Should | Available only to School Admins with the `manage_domain` permission. |
| UR-SCH-021 | The system shall accept a fully qualified domain name (FQDN) or subdomain (e.g. `code.myschool.edu` or `robocode.stjohn.ac.za`), validate its format, and check that it is not already in use by another tenant. | Must | Validation: valid hostname per RFC 1123; duplicate check against all active and pending custom domains. |
| UR-SCH-022 | The system shall present the School Admin with clear, step-by-step DNS configuration instructions, including: the exact CNAME record (name and target value), an optional TXT ownership-verification record, and links to help guides for common registrars (GoDaddy, Namecheap, Google Domains, afriDNS, etc.). | Must | The canonical CNAME target value is `<tenant-id>.proxy.robocode.africa` (consistent with UC-002 and US-078). Instructions must be copyable as text. No HTML-only display. |
| UR-SCH-023 | The system shall automatically verify DNS propagation (polling at intervals up to 72 hours) and notify the School Admin by email when verification succeeds or when it has not resolved within 72 hours. | Must | Platform checks CNAME/TXT resolution from multiple vantage points; acknowledges propagation delays up to 48 hours and continues polling. |
| UR-SCH-024 | The School Admin shall be able to trigger an immediate DNS re-check at any time during the verification window from the dashboard. | Should | Useful when propagation is faster than the polling interval. |
| UR-SCH-025 | Upon successful DNS verification, the system shall automatically provision a TLS certificate for the custom domain using the ACME protocol (Let's Encrypt or equivalent CA) without requiring any action from the School Admin. | Must | Certificate provisioning shall complete within 10 minutes of DNS verification. |
| UR-SCH-026 | The system shall automatically renew TLS certificates before expiry (at least 30 days in advance) without requiring School Admin intervention, and shall alert the Super Admin if auto-renewal fails. | Must | Zero-downtime renewal. |
| UR-SCH-027 | Once a custom domain is active, all HTTP traffic to that domain shall be permanently redirected (HTTP 301) to HTTPS. The tenant's canonical subdomain (`<slug>.robocode.africa`) shall continue to function as a fallback. | Must | HSTS header required (min-age 1 year, includeSubDomains) for domains that opt in. |
| UR-SCH-028 | The School Admin shall be able to remove a custom domain from the dashboard, reverting all traffic to the canonical subdomain, with a confirmation dialog warning of the impact on existing links and SSO configurations. | Should | Removal takes effect within 5 minutes; old certificate is revoked. |

---

## Branding and White-Labelling

### Description

A School Admin can upload branding assets and set colour themes to replace the default RoboCode.Africa visual identity with the school's own identity on all tenant-scoped pages: the landing page, login/signup page, student dashboard, and teacher dashboard. The RoboCode Studio canvas remains the platform's own, but the surrounding shell (header, footer, sidebar) adopts the tenant theme.

### Branding Assets

| Asset | Format / Constraints | Where Used |
|-------|----------------------|------------|
| School logo (light backgrounds) | PNG/SVG, max 512 KB, min 200×60 px | Header, email headers, student dashboard |
| School logo (dark backgrounds) | PNG/SVG, max 512 KB, min 200×60 px | Dark-mode header, login page hero |
| Favicon | ICO/PNG 32×32 and 180×180 (Apple touch), max 64 KB | Browser tab, mobile home-screen icon |
| Landing page hero image | PNG/JPEG/WebP, max 2 MB, 1920×1080 min | Tenant landing page |
| Brand primary colour | Hex colour code | Buttons, links, active states, progress bars |
| Brand secondary / accent colour | Hex colour code | Highlights, badges, hover states |
| School display name | Plain text, max 80 characters | Page titles, email subjects, dashboards |
| School tagline (optional) | Plain text, max 140 characters | Landing page sub-heading |
| Custom footer text (optional) | Plain text, max 300 characters | Footer of all tenant pages |

### Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-SCH-030 | The School Admin shall be able to upload all branding assets defined in the Branding Assets table above via a **Branding & Appearance** section in the School Admin dashboard. | Must | Uploads stored in S3-compatible object storage; served via CDN. |
| UR-SCH-031 | The system shall validate each uploaded asset for file type, file size, minimum dimensions (where applicable), and shall reject files that fail validation with a clear, actionable error message. | Must | Server-side validation only; client-side preview is in addition to, not a replacement for, server-side validation. |
| UR-SCH-032 | The system shall apply the brand primary and secondary colours as CSS design tokens throughout the tenant shell (header, sidebar, buttons, links, progress indicators, notification badges) using the Tailwind CSS + Radix/shadcn theming system. | Must | Colour tokens: `--color-brand-primary` and `--color-brand-secondary`; default platform tokens used until overridden. |
| UR-SCH-033 | The system shall enforce a minimum contrast ratio of 4.5:1 (WCAG 2.2 AA) between the chosen brand primary colour and white text, and shall warn the School Admin (non-blocking) if the contrast ratio falls below this threshold. | Must | Accessibility requirement; WCAG 2.2 AA compliance. |
| UR-SCH-034 | The School Admin shall be able to customise the tenant landing page (the page users see before logging in) with the school logo, hero image, display name, tagline, and a **Register / Log In** call-to-action. | Must | Rich-text body content is a Should (roadmap). |
| UR-SCH-035 | The School Admin shall be able to customise the login and student-signup page with the school logo and colour theme, replacing the default RoboCode.Africa branding. | Must | A discrete "Powered by RoboCode.Africa" attribution link shall remain visible in the footer on white-labelled pages unless a premium white-label plan is active. |
| UR-SCH-036 | The platform shall provide a **Live Branding Preview** mode within the dashboard that renders the landing page and login page with the current (saved or unsaved) branding settings before the School Admin publishes the changes. | Must | Preview shall be device-responsive: desktop and mobile viewports toggled within the preview pane. |
| UR-SCH-037 | The School Admin shall be able to **Publish** or **Discard** pending branding changes; changes shall only take effect tenant-wide upon explicit Publish action. | Must | A timestamped publish history with revert-to-previous capability is a Should. |
| UR-SCH-038 | Branding changes shall propagate to all active user sessions in the tenant within 60 seconds of being published, without requiring users to log out. | Should | Cache-busting via CDN cache invalidation on the branding CSS/asset bundle. |
| UR-SCH-039 | The system shall apply the school display name in all outbound transactional emails sent to users of that tenant (subject lines, greeting, sender name) in place of the default "RoboCode.Africa". | Should | Sender address remains a platform-managed domain (e.g. `noreply@mail.robocode.africa`) unless the school has configured a custom SMTP sender on an enterprise plan. |

---

## School Policy Configuration

### Description

The School Admin configures operational policies that govern how students and teachers interact with the platform within the tenant. Policies include student approval rules, allowed features, age group mappings, communication restrictions, and content visibility.

### Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-SCH-040 | The School Admin shall be able to configure the **student registration mode** for the tenant: (a) invite-only (students receive an email invite link), (b) self-registration with approval (student submits request; School Admin approves), or (c) SSO-only (Google/Microsoft school SSO provisions accounts automatically). | Must | Default is mode (b). Approval requirement cannot be disabled; it can only be delegated to a Teacher in mode (b). |
| UR-SCH-041 | The School Admin shall be able to define one or more **age groups** active in the school (e.g. "Primary Grade 4–7: ages 9–12", "High School Form 1–6: ages 13–18"), each with an associated set of permitted features and component catalogues. | Must | Age groups map to curriculum levels in the Learning module (see Section 12). |
| UR-SCH-042 | The School Admin shall be able to enable or disable specific RoboCode Studio features at the tenant level, including: 3D simulation mode, block-based coding mode, ESP32 board support, collaboration mode, external URL sharing of projects, and the public projects gallery. | Should | Platform-level defaults are used for any feature not explicitly toggled. Disabling a feature hides its UI elements for all users in the tenant. |
| UR-SCH-043 | The School Admin shall be able to configure the **parental/guardian consent** collection method: (a) platform-managed email consent workflow, (b) upload of offline consent form PDF per student, or (c) school-managed consent with a declaration. All minors (under-16 for GDPR-K, under-13 for COPPA) require verifiable consent before account activation. | Must | See also UR-ONB-xxx (Section 6) and child-safety requirements. No minor account may be activated without confirmed consent. |
| UR-SCH-044 | The School Admin shall be able to define a **content moderation policy level** for the tenant: Standard (platform default filters), Strict (enhanced profanity/PII filter, all shared content moderated before publishing), or Custom (Super Admin-assisted configuration). | Should | Content moderation requirements are also specified in Section 15 (Communication, Notifications and Safety). |
| UR-SCH-045 | The School Admin shall be able to restrict student-to-student communication to teacher-supervised class channels only, disabling any peer direct-messaging capabilities for students within the tenant. | Must | Safety-first prime directive; peer private messaging between minors is off by default and requires explicit School Admin opt-in subject to Super Admin approval. |
| UR-SCH-046 | The School Admin shall be able to set a **school timezone** and **academic year calendar** (term start/end dates) that drive task due-date defaults and report period filters in the tenant. | Should | |
| UR-SCH-047 | All policy changes shall be logged in the audit trail with the School Admin's identity, timestamp, previous value, and new value. | Must | Audit trail accessible to Super Admin; School Admin can view their own change history. |

---

## Seat and Licence Management

### Description

A school's subscription plan defines the maximum number of active student and teacher accounts (seats) permitted. The School Admin manages seat quotas within the allocated licence and can request additional seats.

### Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-SCH-050 | The School Admin shall be able to view the current seat allocation: total purchased student seats, total purchased teacher seats, seats currently in use, and seats remaining. | Must | Displayed on the School Admin dashboard home and in the **Subscription & Seats** section. |
| UR-SCH-051 | The system shall prevent the School Admin from approving new student or teacher accounts when the respective seat quota is exhausted, displaying a clear message and a call-to-action to upgrade the plan or request additional seats. | Must | Pending approval requests are retained in the queue; they are not rejected automatically. |
| UR-SCH-052 | The School Admin shall be able to initiate a seat upgrade request or self-service seat purchase (where available under the school's billing plan) directly from the dashboard without leaving the tenant management area. | Should | Payments via Stripe, Paystack, or Flutterwave depending on region. |
| UR-SCH-053 | The School Admin shall be able to deactivate (not delete) individual student or teacher accounts to free up seats for new users. Deactivated accounts retain all project data for a configurable retention period (default 90 days). | Must | Student RoboPoints and project history are preserved; account can be reactivated by School Admin within the retention window. |
| UR-SCH-054 | The system shall send an automated notification to the School Admin when seat usage reaches 80% and 95% of the licensed quota, prompting them to review or upgrade. | Should | Notifications delivered via in-app notification and email. |
| UR-SCH-055 | The Super Admin shall be able to override the seat limit for a specific tenant on a temporary basis (e.g. for a trial extension or competition event) with a defined expiry date and a reason recorded in the audit log. | Should | |

---

## Branding Preview and Publishing Workflow

### Description

Before applying branding changes tenant-wide, the School Admin uses a preview workflow to inspect the appearance across key page templates, adjust, and then publish in a single atomic operation.

### Preview Workflow

```
 +---------------------+       +---------------------+       +---------------------+
 |  Branding Settings  |       |   Live Preview Pane |       |  Publish / Discard  |
 |  (School Admin      |------>|  (Desktop / Mobile  |------>|  Confirmation       |
 |   dashboard)        | Save  |   viewport toggle)  | OK    |  Dialog             |
 +---------------------+ Draft +---------------------+       +----------+----------+
                                                                         |
                                                     Published (atomic) |
                                                                         v
                                                          +--------------+----------+
                                                          |  CDN cache invalidated  |
                                                          |  All tenant pages use   |
                                                          |  new branding tokens    |
                                                          +-------------------------+
```

### Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-SCH-060 | The preview pane shall render a realistic representation of the tenant landing page, login page, and student dashboard header using the in-progress (draft) branding assets without publishing. | Must | Preview uses the same Tailwind/shadcn design token pipeline as the live tenant, not a synthetic mock. |
| UR-SCH-061 | The preview pane shall include a viewport toggle allowing the School Admin to preview at desktop (1280 px), tablet (768 px), and mobile (375 px) widths. | Must | |
| UR-SCH-062 | The preview shall clearly indicate that it is a preview (e.g. a banner reading "Preview mode — not yet published") to avoid confusion with the live site. | Must | |
| UR-SCH-063 | Branding assets shall be stored as a draft until the School Admin explicitly selects **Publish**; a Publish confirmation dialog shall summarise the changes about to go live. | Must | |
| UR-SCH-064 | The system shall retain the last three published branding snapshots and allow the School Admin to revert to a previous snapshot via a **Revert to Previous** action. | Should | Each snapshot stores all asset URLs and colour tokens at the time of publication. |

---

## MoSCoW Priority Summary

| ID Range | Capability | Priority |
|----------|------------|----------|
| UR-SCH-001 – UR-SCH-008 | School organisation account creation and approval | Must |
| UR-SCH-010 – UR-SCH-014 | Subdomain assignment and routing | Must |
| UR-SCH-020 – UR-SCH-028 | Custom domain configuration, DNS verification, TLS | Must / Should |
| UR-SCH-030 – UR-SCH-039 | Branding assets, white-labelling, design tokens | Must / Should |
| UR-SCH-040 – UR-SCH-047 | School policy configuration | Must / Should |
| UR-SCH-050 – UR-SCH-055 | Seat and licence management | Must / Should |
| UR-SCH-060 – UR-SCH-064 | Branding preview and publish workflow | Must / Should |

---

## Relationships to Other Requirements

| This Section | Related Requirement Area | Nature of Relationship |
|---|---|---|
| UR-SCH-007 | Section 7 — Authentication and Account Management | School Admin MFA is mandated by auth policy; this section triggers the MFA setup flow. |
| UR-SCH-040 – UR-SCH-043 | Section 6 — Onboarding, Signup and Approval | Student approval and parental consent rules are set here; execution happens in the onboarding flow. |
| UR-SCH-042, UR-SCH-045 | Section 15 — Communication, Notifications and Safety | Tenant-level feature toggles and moderation policy link to platform-wide safeguarding rules. |
| UR-SCH-044 – UR-SCH-045 | Section 15 — Communication, Notifications and Safety | Content moderation policy level and peer-messaging restrictions drive the moderation pipeline. |
| UR-SCH-050 – UR-SCH-055 | Section 16 — Administration and Reporting | Super Admin seat overrides and billing events appear in the global administration dashboard. |
| UR-SCH-010 – UR-SCH-028 | SSD Multi-Tenancy (TEN module) | DNS, ACME/TLS, RLS isolation, subdomain routing are specified at the functional level in the SSD. |
| UR-SCH-030 – UR-SCH-039 | SSD Front-End (AUTH/TEN modules) | Tailwind/shadcn design token injection and CDN asset serving are specified in the SSD. |

---

## Constraints and Assumptions

- A school must be registered as a legal entity (government or private school) before applying; the Super Admin review step is intended to verify institutional legitimacy.
- Free/trial tenants are limited to the default `<slug>.robocode.africa` subdomain; custom-domain configuration requires a paid plan.
- The "Powered by RoboCode.Africa" attribution in the footer is mandatory for free and standard plans; it may be removed only on an enterprise or premium white-label plan approved by the Super Admin.
- DNS propagation is outside the platform's control; the 72-hour verification window accommodates worst-case global DNS TTL behaviour.
- All branding images are served from the platform CDN (Cloudflare/CloudFront) and are subject to the platform's acceptable-use policy. Uploaded content is scanned for prohibited material.
- School policy changes (especially consent-method changes and communication restrictions) take effect prospectively; existing activated accounts are not retroactively deactivated when policies are tightened, but a migration prompt is shown to the School Admin.


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


# User Requirements: Simulation Experience

## Overview

This section specifies the user-facing requirements for the simulation experience within RoboCode Studio — the interactive 2D/3D electronics simulator that is the centrepiece of the RoboCode.Africa platform. The requirements cover how Students, Teachers, and other authorised users start, control, and interact with a simulation; the real-time visual and audible feedback they must receive; the interactive sensor-input mechanisms; the Serial Monitor; simulation speed control; pin and logic-state inspection; fidelity expectations; and student-friendly error handling.

These requirements are grounded in the RoboCode Simulation Engine (RSE), which reuses the open-source Wokwi component library (wokwi-elements web components, avr8js for Arduino UNO R3 firmware execution, the ESP32 core simulation, and rp2040js for Raspberry Pi Pico RP2040 firmware execution). The RSE supports three first-class development boards — Arduino UNO R3, ESP32 DevKit, and Raspberry Pi Pico — plus an extensible, data-driven board library based on the wokwi-boards definition format. Requirements in this section carry the identifier prefix **UR-SIM**. Related functional requirements in the System Specification Document (SSD) are labelled **FR-SIM**. Cross-references to the canvas and wiring section ("User Requirements: RoboCode Studio Canvas, Components and Wiring") and the code editor section ("User Requirements: Code Editor and Programming") are indicated inline.

---

## Simulation Control

The simulation control subsystem exposes the fundamental lifecycle operations that a Student or Teacher uses to drive a simulation session. Every project has a persistent simulation state that survives page reloads within the same browser session.

### Simulation Lifecycle

```
+-------------------------------------------------------+
|                 Simulation Lifecycle                  |
|                                                       |
|  [STOPPED] --RUN--> [RUNNING] --PAUSE--> [PAUSED]    |
|      ^                  |                   |         |
|      |                  |                   |         |
|      +------STOP--------+------STOP/RESET---+         |
|                                                       |
|  RESET from any state --> reinitialise MCU + canvas  |
+-------------------------------------------------------+
```

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-SIM-001 | A Student or Teacher shall be able to **start** a simulation by clicking a clearly labelled Run button (or pressing a keyboard shortcut), which compiles or loads the current sketch and begins MCU execution. | Must | Run button is enabled only when the circuit contains at least one supported development board. |
| UR-SIM-002 | A running simulation shall be **paused** at any moment, freezing MCU clock and all component states without losing runtime context (registers, memory, pin states, timers). | Must | Resuming from pause must continue execution from the exact point at which it was paused. |
| UR-SIM-003 | A running or paused simulation shall be **stopped**, which halts execution, de-energises all component outputs (LEDs off, motors stopped, servos at rest), and returns all pin-output states to their de-energised defaults. | Must | Stopping does not clear the Serial Monitor log or the code editor. |
| UR-SIM-004 | The user shall be able to **reset** the simulation from any state, which reinitialises the MCU (equivalent to a hardware reset/power-cycle), restores all component models to their power-on state, and restarts execution from `setup()`. | Must | Reset does not modify the schematic or code. |
| UR-SIM-005 | A persistent **simulation status indicator** shall be visible at all times in the RoboCode Studio toolbar, displaying the current state (Stopped / Running / Paused / Error / Compiling). | Must | Colour-coded: green = Running, yellow = Paused, red = Error, grey = Stopped. |
| UR-SIM-006 | While a simulation is running, modifications to the schematic (adding/removing components or wires) shall be blocked with a contextual tooltip explaining that the simulation must be stopped first. | Must | Prevents circuit changes that would corrupt MCU state. Consistent with "User Requirements: RoboCode Studio Canvas, Components and Wiring". |
| UR-SIM-007 | While a simulation is running, code edits shall be permitted; clicking **Run** again after an edit shall stop the current run, recompile/reload, and restart automatically. | Should | An optional prompt ("Stop current simulation and restart?") may be shown. |

---

## Real-Time Visual Feedback

Students must receive immediate, believable visual responses from simulated components so that the connection between code and physical outcome is clear and motivating.

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-SIM-010 | **Single LEDs** (red, green, blue, yellow) shall illuminate with the correct colour and a visible glow/brightness effect when their anode pin is driven HIGH (or the corresponding PWM duty cycle) and extinguish when driven LOW. | Must | Brightness scales linearly with PWM duty cycle (0–255). |
| UR-SIM-011 | **RGB LEDs** (common-anode and common-cathode variants) shall display the blended colour computed from the three PWM channel values applied to the R, G, B pins. | Must | Common-anode and common-cathode polarity logic must both be correctly modelled. |
| UR-SIM-012 | **LED bar graphs** shall illuminate each segment bar independently in response to the corresponding pin state. | Must | 10-segment bar must render all 10 states simultaneously. |
| UR-SIM-013 | **1-digit and 4-digit 7-segment displays** shall render the correct digit(s) and decimal points in real time, updating within one display-refresh cycle of the simulated MCU writing to the segment pins or the TM1637/MAX7219 SPI bus. | Must | Multiplexed scanning must be visually smooth at normal simulation speed. |
| UR-SIM-014 | The **8×8 LED matrix** (MAX7219) shall render each pixel as an illuminated dot, supporting scrolling and animation as driven by the sketch. | Should | MAX7219 SPI protocol must be accurately modelled. |
| UR-SIM-015 | **16×2 and 20×4 character LCD displays** (HD44780 + I2C backpack) shall render text characters, custom glyphs, and cursor positioning exactly as produced by the `LiquidCrystal_I2C` library calls in the sketch. | Must | Backlight on/off control and contrast modelling are Should-level. |
| UR-SIM-016 | The **0.96-inch OLED display** (SSD1306, I2C) shall render monochrome pixel graphics and text as produced by Adafruit GFX / U8g2 library calls. | Must | Pixel-accurate rendering within one I2C transaction of the MCU writing. |
| UR-SIM-017 | **WS2812/NeoPixel rings and strips** shall render each addressable LED with the correct 24-bit RGB colour set by the sketch, updating within one data-frame transmission time. | Must | Timing-sensitive WS2812 protocol (800 kHz) must be accurately modelled; incorrect timing shall generate a runtime warning. |
| UR-SIM-018 | **Servo motors** (SG90 and compatible) shall visually rotate their arm/horn to the angle commanded by the PWM signal (0°–180°), animating smoothly rather than snapping. | Must | Animation speed should approximate the rated slew rate of the SG90 (≈ 100°/s). |
| UR-SIM-019 | **DC motors** connected through an L293D or L298N driver module shall spin a rendered rotor graphic at a speed and direction proportional to the PWM duty cycle and direction pins, including a stopped state when enable is LOW. | Must | RPM display (estimated) is a Should-level enhancement. |
| UR-SIM-020 | The **28BYJ-48 stepper motor** with ULN2003 driver shall animate step-by-step rotation in the correct direction and at a speed proportional to the step interval set in the sketch. | Should | Step accuracy (full-step vs half-step) must be correctly reflected. |
| UR-SIM-021 | A **fan** actuator shall render spinning blades whose visible speed reflects the PWM duty cycle applied to its control pin. | Could | Visual representation is sufficient; airflow simulation is out of scope. |
| UR-SIM-022 | **Relay modules** shall display a clearly labelled OPEN/CLOSED state change and an optional click visual cue when the coil is energised or de-energised. | Should | Relay state must be reflected in the pin-state inspector (UR-SIM-060). |

---

## Real-Time Audible Feedback

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-SIM-030 | An **active buzzer** shall produce an audible tone (approximately 2.3 kHz) through the browser's audio output when driven HIGH, and be silent when driven LOW. | Must | Implemented via the Web Audio API. Requires user gesture to unlock audio context on first interaction. |
| UR-SIM-031 | A **passive buzzer** shall produce a tone whose frequency matches the PWM signal applied to its pin, supporting the full audible range used by Arduino `tone()` (31 Hz – 65535 Hz, browser-limited in practice). | Must | Waveform is a square wave approximation. Volume is adjustable via the simulation toolbar. |
| UR-SIM-032 | A **global simulation audio volume control** (mute / 0–100%) shall be present in the RoboCode Studio toolbar, persisted per user session. | Must | Default volume shall be 50% to avoid startling students. |
| UR-SIM-033 | When the browser tab is hidden or minimised, audio output shall be silenced automatically and resume when the tab is restored. | Should | Reduces distraction in classroom settings. |

---

## Interactive Sensor Inputs

Students must be able to interact with simulated sensors and input devices during a running simulation to test how their code responds to real-world stimuli. All interactive controls are surfaced in the RoboCode Studio canvas panel.

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-SIM-040 | **Push buttons and tactile switches** shall be clickable (and keyboard-activatable) during simulation; holding the control pressed shall assert the pin LOW or HIGH according to the button's wiring, releasing shall de-assert it. | Must | Must also support long-press hold for testing debounce code. |
| UR-SIM-041 | A **rotary potentiometer** shall display a draggable knob widget during simulation; rotating the knob from 0° to 300° shall drive the corresponding ADC pin between 0 V and VCC (mapped to 0–1023 on a 10-bit ADC). | Must | Knob position persists between pause/resume cycles. |
| UR-SIM-042 | An **analog joystick** shall display two perpendicular slider widgets (X and Y axes) plus a button control; each axis shall drive the respective ADC pin across the full 0–1023 ADC range. | Must | Sliders snap back to the centre (512) when released, unless a lock mode is enabled. |
| UR-SIM-043 | The **ultrasonic distance sensor** (HC-SR04) shall expose a numeric input field (range: 2 cm – 400 cm) during simulation, settable by the Student at any time; the RSE shall compute the ECHO pulse width accordingly. | Must | Input shall also accept slider control. Real-time update while simulation is running. |
| UR-SIM-044 | The **DHT11/DHT22 temperature-humidity sensor** shall expose two numeric input fields (temperature in °C, humidity in %) during simulation, accepting values within the sensor's rated range. | Must | DHT11: temp 0–50 °C, humidity 20–90 %. DHT22: temp −40 to 80 °C, humidity 0–100 %. |
| UR-SIM-045 | The **LM35 temperature sensor** shall expose a numeric input field for temperature (°C), which RSE translates to the correct analog output voltage (10 mV/°C). | Must | Range: −55 °C to +150 °C. |
| UR-SIM-046 | A **photoresistor (LDR)** shall expose a light-level input (lux, 0–100 000) or a simplified Low/Medium/High selector; the RSE shall compute the corresponding resistance/voltage divider output. | Must | Simple percentage slider is acceptable for the V1 release. |
| UR-SIM-047 | The **PIR motion sensor** (HC-SR501) shall expose a **Trigger Motion** button during simulation; pressing it briefly asserts the output pin HIGH for the sensor's programmed delay period. | Must | Delay and sensitivity potentiometer values shall be configurable via a properties panel. |
| UR-SIM-048 | The **IR receiver + remote** component pair shall allow the Student to click virtual remote buttons during simulation, generating the correct NEC protocol pulse trains on the receiver's output pin. | Should | At minimum, a set of common remote-control button codes must be supported. |
| UR-SIM-049 | The **IR obstacle / line-tracking sensor** shall expose a toggle (obstacle detected / clear) or a reflectance slider during simulation, which RSE uses to assert the digital output pin accordingly. | Should | Obstacle detection threshold potentiometer setting shall be configurable. |
| UR-SIM-050 | The **sound/microphone sensor** (digital and analog variants) shall expose a sound-level slider or a **Clap** trigger button; the digital pin output shall toggle when the level crosses the threshold. | Could | Analog microphone variant should output a voltage proportional to sound level. |
| UR-SIM-051 | The **soil moisture sensor** and **water-level sensor** shall each expose a moisture/level percentage slider that RSE maps to the sensor's analog and digital output pins. | Could | Useful for agriculture-themed projects. |
| UR-SIM-052 | The **gas sensor (MQ-2)** shall expose a gas-concentration slider (0–100 % scale) during simulation; RSE maps this to the analog voltage output and digital alarm pin. | Could | Threshold potentiometer on the module shall be configurable. |
| UR-SIM-053 | The **flame sensor** shall expose a flame detected / not detected toggle during simulation. | Could | |
| UR-SIM-054 | The **4×4 membrane keypad** shall render a clickable virtual keypad overlay during simulation; pressing a key asserts the corresponding row/column pin intersections so the sketch's keypad-scanning code can detect it. | Must | Must support simultaneous key-press for multi-key scanning. |
| UR-SIM-055 | The **rotary encoder** shall expose a clickable increment/decrement widget and a button press control during simulation, generating the correct quadrature (A/B) signal transitions and index pulse. | Should | Encoder resolution (PPR) shall match the wired component's datasheet value. |
| UR-SIM-056 | The **tilt/ball switch** shall expose a tilt toggle (tilted / upright) during simulation. | Should | |
| UR-SIM-057 | All interactive sensor input controls shall be clearly differentiated visually from static component labels on the canvas — for example, by highlighted border, interactive cursor, and a brief tooltip describing the control. | Must | Accessibility: all controls must be keyboard-operable (WCAG 2.2 AA, UR-NFR cross-reference). |

---

## Serial Monitor

The Serial Monitor surfaces `Serial.print()` / `Serial.println()` output from the simulated MCU and allows the Student to send bytes back to the MCU's serial input.

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-SIM-061 | RoboCode Studio shall include a **Serial Monitor** panel that displays all text written to the simulated UART by the sketch (via `Serial.begin()`, `Serial.print()`, etc.) in real time during simulation. | Must | Output must appear within one UART transmission time (simulated) of the MCU writing. |
| UR-SIM-062 | The Serial Monitor shall display each received line with a faint timestamp (simulated milliseconds since reset, togglable). | Should | Helps Students understand timing and `millis()` usage. |
| UR-SIM-063 | The Student shall be able to **type and send** ASCII strings or individual bytes to the MCU's serial input via a text field + Send button (or Enter key) in the Serial Monitor panel. | Must | Enables testing `Serial.read()` / `Serial.available()` logic. |
| UR-SIM-064 | The Serial Monitor shall support selectable **baud rate display modes** (plain text, hex, binary, decimal) matching the `Serial.begin()` baud rate in the sketch; a mismatch warning shall be shown if detected. | Should | Common rates: 9600, 115200 bps minimum. |
| UR-SIM-065 | The Serial Monitor shall provide **Clear**, **Pause scroll** (freeze output in place), and **Copy to clipboard** actions. | Must | Clear action prompts for confirmation to avoid accidental data loss. |
| UR-SIM-066 | The Serial Monitor log shall be limited to a configurable maximum line count (default: 1000 lines) with automatic trimming from the top; a persistent full log shall be downloadable as a `.txt` file. | Should | Prevents excessive memory use in long-running simulations. |
| UR-SIM-067 | When a simulation is stopped, the Serial Monitor log shall be retained until the next Run, so the Student can review the full output. | Must | |

---

## Pin and Logic State Inspector

> Note: the Pin State Inspector lead requirement retains its original identifier `UR-SIM-060` (referenced by other sections and by the SSD traceability matrix, FR-SIM-100..104); the remaining inspector requirements continue in the `068..070` band. The IDs are permanent and unique; the non-sequential ordering relative to the Serial Monitor band (`061..067`) is intentional and does not indicate a missing requirement.

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-SIM-060 | RoboCode Studio shall provide a **Pin State Inspector** panel (or overlay) showing the current digital HIGH/LOW state and, where applicable, the analog voltage level (0–5 V for Arduino UNO, 0–3.3 V for ESP32 and Raspberry Pi Pico) or PWM duty cycle of every pin on the active development board in real time during simulation. | Must | Updated at a display refresh rate of ≥ 10 Hz so transitions are visible. |
| UR-SIM-068 | The Pin State Inspector shall highlight pins that have changed state within the last 200 ms using a visual flash or colour change to draw the Student's attention. | Should | Helps Students verify which pins their code is toggling. |
| UR-SIM-069 | The Student shall be able to click any pin in the Inspector to see a **mini logic-scope** graph showing a rolling 2-second window of that pin's digital waveform (HIGH/LOW over time). | Could | Particularly useful for PWM and bitbang-protocol debugging. |
| UR-SIM-070 | For I2C and SPI buses, the Pin State Inspector shall decode and display the last transmitted address and data bytes in human-readable form in a tooltip or sub-panel. | Could | Supports deeper learning of communication protocols. |

---

## Simulation Speed Control

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-SIM-080 | The Student shall be able to adjust simulation speed via a **speed slider** in the RoboCode Studio toolbar, covering at minimum: 0.25×, 0.5×, 1× (real-time), 2×, 4× of real MCU clock speed. | Must | Default is 1× (real-time). Speed changes take effect immediately without stopping the simulation. |
| UR-SIM-081 | At reduced speeds (< 1×), timing-sensitive components (NeoPixels, DHT sensors, ultrasonic sensors) shall scale their protocol timing proportionally so that code continues to function correctly. | Must | Failure to scale timing would cause library timeouts at slow speed, confusing Students. |
| UR-SIM-082 | At accelerated speeds (> 1×), the platform shall warn if the host device's CPU cannot sustain the requested speed and shall automatically throttle rather than drop frames silently. | Should | Throttle notification displayed in the simulation status indicator. |
| UR-SIM-083 | A **step-by-step** (single-instruction) execution mode shall be available via the Pin State Inspector or a dedicated Debug toolbar for advanced high-school Students. | Could | Allows inspection of MCU register states one instruction at a time (AVR registers for Arduino UNO, RP2040 Cortex-M0+ registers for Raspberry Pi Pico). |

---

## Simulation Fidelity Expectations

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-SIM-090 | Sketches that run correctly on a physical Arduino UNO R3 with the same circuit shall, in the general case, run correctly in RoboCode Studio without modification, using the avr8js simulation of the ATmega328P. | Must | "General case" excludes timing edge cases below ~10 µs and hardware-specific errata not modelled by avr8js. |
| UR-SIM-091 | The platform shall accurately simulate the ATmega328P's 16 MHz clock, interrupt vectors, ADC resolution (10-bit), PWM channels, I2C (TWI), SPI, and UART peripherals as supported by the avr8js library. | Must | Known limitations (e.g., EEPROM simulation, watchdog timer) shall be disclosed in a Simulation Limitations help article linked from the RoboCode Studio UI. |
| UR-SIM-092 | The ESP32 simulation path shall accurately execute MicroPython or Arduino-ESP32 sketches through the ESP32 core simulator for the components listed in the component catalogue; behaviour shall match a physical ESP32 DevKit for common GPIO, ADC, PWM, I2C, SPI, UART, and Wi-Fi/BLE stub operations. | Must | Wi-Fi and BLE simulation is a stub that returns configurable mock responses; full RF simulation is out of scope. |
| UR-SIM-093 | Library compatibility: the RSE shall support, at minimum, the Arduino standard libraries (`Wire`, `SPI`, `Servo`, `Stepper`, `LiquidCrystal`, `LiquidCrystal_I2C`, `Adafruit_NeoPixel`, `Adafruit_SSD1306`, `Adafruit_GFX`, `DHT`, `IRremote`, `Keypad`, `MFRC522`, `RTClib`) and the equivalent MicroPython modules for the ESP32; for the Raspberry Pi Pico the RSE shall support MicroPython, CircuitPython, and C/C++ firmware built with the Arduino-Pico core or the Pico SDK. | Must | Library support matrix shall be published in the platform documentation and discoverable from within RoboCode Studio. |
| UR-SIM-094 | Component models shall accurately implement the electrical and timing characteristics defined in the Wokwi open-source component library for all components in the component catalogue defined in the platform canon. | Must | Deviations or unimplemented behaviours shall be noted in per-component simulation notes accessible from the canvas. |
| UR-SIM-095 | The RSE shall model basic short-circuit and over-current conditions (e.g., LED connected without resistor) with a visible warning indicator on the affected component, rather than silently allowing incorrect circuits. | Should | Warning must be educational in tone: "This LED may burn out without a current-limiting resistor." |
| UR-SIM-096 | Students and Teachers shall have access to a **Simulation Limitations** reference, linked from the RoboCode Studio help menu, that lists all known deviations from physical hardware behaviour and unsupported library functions. | Must | Must be maintained and versioned with each RSE release. |
| UR-SIM-097 | The Raspberry Pi Pico (RP2040) simulation path shall accurately execute UF2/ELF firmware images through the rp2040js library, modelling the dual-core ARM Cortex-M0+ at 133 MHz, 264 KB SRAM, 26 multifunction GPIO (GP0–GP28), 3 ADC-capable inputs (GP26/GP27/GP28) plus internal temperature sensor, 2× UART, 2× SPI, 2× I2C, 16 PWM channels, and 8 PIO state machines. Behaviour shall match a physical Raspberry Pi Pico for the components listed in the component catalogue. | Must | Known limitations of rp2040js (e.g., USB device emulation, PIO edge cases) shall be disclosed in the Simulation Limitations article (UR-SIM-096). Pico W (CYW43439 Wi-Fi/BLE) is a near-term roadmap variant; its Wi-Fi/BLE stub follows the same approach as the ESP32 (UR-SIM-092). |
| UR-SIM-098 | The RSE shall support an extensible, data-driven **board library** based on the wokwi-boards definition format. Platform admins and approved advanced users/Teachers shall be able to upload custom board manifests (`board.json` + SVG asset) that declare the board name, pin names, pin types, and pin positions. No code change shall be required to add a supported board; each manifest binds to an MCU core target (avr8js, rp2040js, or ESP32 core) so the RSE knows how to execute firmware for that board. | Must | Custom-board uploads are validated against the wokwi-boards JSON schema (pin sanity, SVG/asset safety) and, for non-admin users, pass through the standard approval/moderation workflow before becoming available to learners. The built-in wokwi-boards library (Arduino Uno/Nano/Mega, ESP32 family, Raspberry Pi Pico, and others) ships pre-installed. |

---

## Student-Friendly Runtime Error Messages

Error messages produced during simulation must be educational, specific, and free of low-level technical jargon that would confuse primary or high-school Students.

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-SIM-100 | When a sketch fails to compile, RoboCode Studio shall display a **friendly compile-error panel** that (a) highlights the offending line in the Monaco editor, (b) shows a plain-English explanation of the error alongside the raw compiler message (toggleable), and (c) links to a relevant tutorial or documentation article where one exists. | Must | Cross-reference "User Requirements: Code Editor and Programming" for compile-error UX. |
| UR-SIM-101 | When the MCU encounters a runtime fault (e.g., infinite loop detected, stack overflow, null pointer, watchdog timeout, hardfault on ESP32), the simulation shall halt and display a contextual error message identifying the likely cause in student-friendly language. | Must | Example: "Your program seems to be stuck in a loop. Check if your `while` loop has an exit condition." |
| UR-SIM-102 | Detected electrical problems (short circuit, incorrect voltage level, floating pin used as input) shall display a **yellow warning badge** on the affected component on the canvas with a plain-English tooltip describing the issue and how to fix it. | Should | Warnings must not stop the simulation unless the condition is catastrophically destructive (e.g., simulated over-voltage). |
| UR-SIM-103 | If the RSE detects an unsupported library call or an out-of-range function argument, it shall output a descriptive warning to the Serial Monitor rather than silently failing, formatted as `[RSE WARNING] <description>`. | Must | Allows the Student to diagnose issues without external tools. |
| UR-SIM-104 | Runtime error messages shall be available in the platform's supported interface languages (English at minimum; additional languages per the localisation roadmap) so that non-English-speaking Students in the African market receive messages in a familiar language. | Should | Localisation of error messages is a V2 feature; V1 must be English with clear, simple vocabulary. |
| UR-SIM-105 | A persistent **Simulation Log** panel (separate from the Serial Monitor) shall record all RSE warnings, errors, and significant state transitions (start, stop, reset) with simulated timestamps and a severity level (Info / Warning / Error). | Should | Log is downloadable as `.json` for Teacher review and assessment purposes (cross-reference "User Requirements: Learning, Courses, Tasks and Assessment"). |

---

## MoSCoW Priority Summary

| Priority | Requirement IDs |
|---|---|
| **Must** | UR-SIM-001, 002, 003, 004, 005, 006, 010, 011, 012, 013, 015, 016, 017, 018, 019, 030, 031, 032, 040, 041, 042, 043, 044, 045, 046, 047, 054, 057, 060, 061, 063, 065, 067, 080, 081, 090, 091, 092, 093, 094, 096, 097, 098, 100, 101, 103 |
| **Should** | UR-SIM-007, 014, 020, 022, 033, 048, 049, 055, 056, 062, 064, 066, 068, 082, 095, 102, 104, 105 |
| **Could** | UR-SIM-021, 050, 051, 052, 053, 069, 070, 083 |
| **Won-t (this release)** | Full RF simulation for Wi-Fi/BLE (ESP32 or Pico W); EEPROM/flash wear-level emulation; sub-10 µs timing edge-case accuracy; oscilloscope-grade waveform capture; USB device emulation for Raspberry Pi Pico. |

---

## Assumptions and Constraints

- The browser must support WebAssembly (for avr8js, rp2040js, and the WASM compile toolchain), Web Audio API (for buzzer simulation), and WebGL2 (for 3D rendering). See "Non-Functional User Expectations" for the minimum supported browser matrix.
- Audio output requires a prior user gesture to unlock the Web Audio context; this is a browser security constraint that cannot be overridden.
- 3D rendering of components gracefully degrades to 2D wokwi-elements rendering on devices that do not support WebGL2 (see "User Requirements: RoboCode Studio Canvas, Components and Wiring").
- The interactive sensor input controls defined in this section (UR-SIM-040 – UR-SIM-057) are only available while the simulation is in the Running or Paused state.
- The accuracy of ESP32 Wi-Fi/BLE behaviour is limited to stub simulation (mock responses); projects requiring genuine TCP/IP stack behaviour are out of scope for V1. The same stub approach applies to the Raspberry Pi Pico W (CYW43439 Wi-Fi/BLE), which is a near-term roadmap variant of the Raspberry Pi Pico board.
- The simulation operates entirely in-browser; no MCU state is sent to the backend. Project files (schematic + code) are persisted via the backend API as defined in "User Requirements: RoboCode Studio Canvas, Components and Wiring".

---

## Relationship to Other Sections

| Related Section | Relationship |
|---|---|
| User Requirements: RoboCode Studio Canvas, Components and Wiring | Defines the component catalogue and schematic authoring from which the RSE reads its circuit description. Simulation cannot start without a valid circuit (UR-SIM-001). |
| User Requirements: Code Editor and Programming | Defines the Monaco editor, compile pipeline, and block-code transpilation whose output the RSE executes. Compile errors surface both in that section and in UR-SIM-100. |
| User Requirements: Learning, Courses, Tasks and Assessment | Simulation state, Serial Monitor output, and Simulation Log may be captured as assessment evidence and shared with Teachers. |
| User Requirements: Administration and Reporting | Teachers and School Admins may access aggregated simulation usage analytics (sessions, error frequency, components used) for pedagogical insights. |
| Non-Functional User Expectations | Performance, reliability, accessibility (WCAG 2.2 AA), and browser compatibility expectations apply globally to the simulation experience. |


# User Requirements: Code Editor and Programming

## Overview

This section defines the user requirements for the RoboCode Studio code editor and the programming experience it delivers. The code editor is the primary authoring environment within RoboCode Studio where Students write, run, inspect, and iterate on programs that drive simulated electronics and robotics. It must cater to a wide spectrum of learners—from primary-school students using a visual block-based interface to high-school students writing production-quality Arduino C/C++ or MicroPython—while consistently mapping code to simulator actions in real time through the RoboCode Simulation Engine (RSE) and RoboCode Virtual Machine (RVM).

The editor resides in a dedicated **Code** tab within RoboCode Studio, side-by-side with the **Canvas** tab (component placement and wiring). The two tabs share persistent project state; code and circuit topology are saved and versioned together. Cross-references to the canvas and wiring requirements appear in *User Requirements: RoboCode Studio Canvas, Components and Wiring*. Cross-references to simulation execution appear in *User Requirements: Simulation Experience*. Cross-references to task submission and assessment appear in *User Requirements: Learning, Courses, Tasks and Assessment*.

---

## Programming Language and Mode Support

RoboCode Studio exposes five authoring modes, selectable per project by the Student (subject to age-tier policy set by the School Admin or Teacher):

| Mode | Languages / Syntax | Target Audience |
|---|---|---|
| Block-Based | Graphical Scratch-style blocks; transpiles to Arduino C/C++ | Primary-school students (typically ages 8–12) |
| Text – Arduino C/C++ | Arduino dialect of C/C++ (avr-gcc / Arduino-Pico core compatible) | High-school students, UNO R3, ESP32, Raspberry Pi Pico (C path) |
| Text – MicroPython | MicroPython for ESP32 and Raspberry Pi Pico (`machine`, `uasyncio`, `rp2040` libs) | High-school students, ESP32 and Pico boards |
| Text – CircuitPython | CircuitPython targeting the Raspberry Pi Pico (RP2040) | High-school students, Raspberry Pi Pico board |
| Text – Pico SDK C/C++ | Pico SDK C/C++ targeting the RP2040 directly (no Arduino layer) | Advanced students, Raspberry Pi Pico board |

Switching from Block-Based to a text mode shows the generated source code and offers a one-way promotion dialog. Switching back after manual text edits is disallowed to preserve student intent; a warning dialog explains this.

---

## User Requirements Table

### UR-CODE-001 to UR-CODE-020: Authoring Modes

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-CODE-001 | A Student shall be able to select Block-Based, Arduino C/C++, MicroPython, CircuitPython, or Pico SDK C/C++ mode per project, subject to board and teacher policy. | Must | Mode selector visible in editor toolbar; board-incompatible modes are greyed with a tooltip explaining the restriction (e.g. CircuitPython and Pico SDK options are hidden when the active board is UNO R3 or ESP32). |
| UR-CODE-002 | Block-Based mode shall provide a drag-and-drop palette of blocks covering: digital/analog I/O, delay, loops, conditionals, variables, math, strings, serial print, sensor reads, actuator controls, and functions. | Must | All palette categories visible on a standard 1280×720 viewport without horizontal scrolling. |
| UR-CODE-003 | A Student in Block-Based mode shall be able to view the equivalent generated Arduino C/C++ source at any time in a read-only preview pane. | Must | Preview pane is syntax-highlighted and updates live as blocks change. |
| UR-CODE-004 | A Student shall be able to promote (graduate) a Block-Based project to Arduino C/C++ mode with a single action. | Should | A dialog warns that the promotion is one-way and that blocks will no longer be editable. |
| UR-CODE-005 | The Arduino C/C++ editor shall accept the full Arduino language API (core functions, data types, macros) compatible with avr-gcc for the UNO R3, the ESP32 Arduino core for the ESP32, and the Arduino-Pico core for the Raspberry Pi Pico. | Must | Validate by compiling a sketch that calls `setup()`, `loop()`, `digitalWrite()`, `analogRead()`, `Serial.begin()`, `Wire.begin()`, `SPI.begin()` without errors on each supported board target. |
| UR-CODE-006 | The MicroPython editor shall accept standard MicroPython syntax and imports targeting the ESP32 (`machine`, `utime`, `uasyncio`, `network`, `ujson`) and the Raspberry Pi Pico (`machine`, `utime`, `rp2040`, `uasyncio`). | Must | Validate by running a sketch that blinks an LED and reads a sensor using `machine.Pin` and `machine.ADC` on both boards. |
| UR-CODE-006A | The CircuitPython editor shall accept CircuitPython syntax and the standard CircuitPython library bundle targeting the Raspberry Pi Pico (RP2040), including `board`, `busio`, `digitalio`, `analogio`, `pwmio`, and `adafruit_*` modules. | Must | Validate by running a CircuitPython sketch that toggles a GPIO pin and reads an ADC channel on the Pico. CircuitPython mode is only selectable when the project board is Raspberry Pi Pico. |
| UR-CODE-006B | The Pico SDK C/C++ editor shall accept standard Pico SDK C/C++ source targeting the RP2040, exposing the full `pico/stdlib.h` API including GPIO, ADC, PWM, UART, SPI, I2C, PIO, and multicore primitives. | Should | Validate by compiling and loading a Pico SDK sketch using `gpio_init()`, `adc_read()`, and `uart_puts()` without errors. |
| UR-CODE-007 | Switching between language/mode selections shall preserve the project source file associated with the new mode; each mode may have its own separate source file within the project. | Should | Switching does not discard the other mode's file; a project may contain a `.ino`, a `.py`, a `.cpp` (Pico SDK), and a blocks `.json`. |

### UR-CODE-021 to UR-CODE-040: Editor Features — Highlighting, Autocomplete and Diagnostics

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-CODE-021 | The code editor shall render full syntax highlighting for Arduino C/C++ and MicroPython, covering keywords, literals, comments, preprocessor directives, and string delimiters. | Must | Implemented via Monaco editor language extensions; highlight accuracy verified against Arduino and MicroPython language grammars. |
| UR-CODE-022 | The editor shall provide context-aware autocomplete that surfaces: standard language keywords, Arduino core API symbols, MicroPython builtins/modules, third-party library APIs included in the project, and user-defined functions/variables. | Must | Autocomplete triggers on typing (minimum 1 character) and on Ctrl+Space. Suggestions appear within 300 ms on a standard connection. |
| UR-CODE-023 | Autocomplete suggestions shall include an inline documentation snippet (signature, short description, and a usage example) displayed in a side panel or popover without requiring a separate page load. | Should | Documentation sourced from bundled JSDoc/docstring stubs for Arduino API and MicroPython stubs. |
| UR-CODE-024 | The editor shall display real-time inline lint and syntax-error diagnostics as a Student types, without requiring a manual build step. | Must | Errors and warnings underlined red/yellow; hovering shows the diagnostic message. Diagnostics update within 1 s of the last keystroke. |
| UR-CODE-025 | Lint diagnostics shall cover: undeclared identifiers, type mismatches (C/C++), missing semicolons, mismatched braces/parentheses, unused variables, and calls to undefined functions. | Must | Test by introducing each class of error and verifying a corresponding diagnostic appears. |
| UR-CODE-026 | A gutter panel shall display error, warning, and info severity indicators on the line number margin, and a minimap/scrollbar overlay shall highlight all diagnostic lines for navigation in long sketches. | Should | Clicking a gutter indicator jumps the cursor to the relevant line. |
| UR-CODE-027 | Before the Student initiates a simulation run, the editor shall perform a full pre-run validation pass and block execution if errors of severity Error or above are present, displaying a summary panel listing all errors. | Must | The Run button is disabled or shows an error badge; the error summary lists filename, line number, and message. Warnings do not block execution but are shown. |
| UR-CODE-028 | The editor shall support line-level code folding for functions, loops, and comment blocks to help Students manage long sketches. | Should | Fold/unfold widgets appear in the gutter on hover. |
| UR-CODE-029 | The editor shall support multi-cursor editing (Ctrl+D, Alt+Click) and column/box selection. | Could | Standard Monaco editor multi-cursor behaviour. |
| UR-CODE-030 | The editor shall support find and replace (Ctrl+H) with regex toggle and match-case toggle. | Should | Replace-all confirmation dialog prevents accidental mass replacement. |

### UR-CODE-041 to UR-CODE-060: Component/Library Includes and Templates

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-CODE-041 | When a Student places a component on the Canvas, the editor shall automatically suggest (and optionally auto-insert) the corresponding `#include` directives and initialisation boilerplate for that component's library. | Must | Suggestions appear as a non-blocking notification banner within the editor. Student can accept, dismiss, or view the full snippet before insertion. |
| UR-CODE-042 | The editor shall provide a searchable **Library Manager** panel listing all pre-bundled libraries (mapped to the Component Catalogue) from which the Student can insert include statements and skeleton usage code. | Must | Panel accessible via editor toolbar icon. Search returns results within 500 ms. |
| UR-CODE-043 | The following libraries shall be pre-bundled and available without internet access: `Wire` (I2C), `SPI`, `Servo`, `LiquidCrystal_I2C`, `Adafruit_SSD1306`, `Adafruit_GFX`, `DHT sensor library`, `OneWire`, `DallasTemperature`, `MFRC522`, `FastLED`/`Adafruit_NeoPixel`, `Stepper`, `Keypad`, `IRremote`, `MPU6050`, and their MicroPython equivalents where applicable. | Must | Validate by inserting each `#include` and verifying no "file not found" diagnostic appears. |
| UR-CODE-044 | The editor shall provide a **Code Templates** panel offering starter sketches for common component patterns (blink an LED, read a sensor, drive a motor, etc.) drawn from the Component Catalogue. | Must | Templates are filterable by component name and by board (UNO R3 / ESP32 / Raspberry Pi Pico) and by language mode (Arduino C/C++, MicroPython, CircuitPython, Pico SDK C/C++). |
| UR-CODE-045 | A Teacher shall be able to author custom code templates and snippets and publish them to their class's Code Templates panel, optionally locking portions of the template as read-only scaffolding. | Should | Read-only scaffold regions are rendered with a distinct background colour; Students cannot edit them but can add code in designated editable regions. |
| UR-CODE-046 | The editor shall provide keyboard shortcut documentation accessible from the editor toolbar, listing all editor-level and RoboCode Studio shortcuts. | Should | Accessible via a `?` icon or `Ctrl+Shift+/` shortcut. |

### UR-CODE-061 to UR-CODE-080: Mapping Code to Simulator Actions

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-CODE-061 | When a Student clicks **Run**, the code editor shall initiate execution via the RSE: for accurate mode, compile the sketch to firmware and load it into the appropriate simulator — avr8js for the Arduino UNO R3, the ESP32 core simulator for the ESP32, or rp2040js (github.com/wokwi/rp2040js) for the Raspberry Pi Pico; for simplified mode, pass the code to the RVM interpreter. For the Raspberry Pi Pico on the accurate path, the compiler produces a UF2 or ELF firmware image which is loaded into rp2040js to run real RP2040 machine code in the browser. | Must | Execution start-to-first-simulation-tick latency shall not exceed 3 s on a standard mid-range device for sketches under 2,000 lines. UF2/ELF load into rp2040js completes within the same 3 s budget. |
| UR-CODE-061A | When the active board is the Raspberry Pi Pico, the editor shall support MicroPython, CircuitPython, and C/C++ (Arduino-Pico core or Pico SDK) as selectable language modes for that project. Each language path compiles or packages to a firmware image (UF2 for MicroPython/CircuitPython runtimes; UF2 or ELF for C/C++) loaded into rp2040js. The editor shall expose Pico-specific autocomplete symbols: `machine.Pin`, `rp2040.PIO`, `machine.ADC` channels GP26/GP27/GP28, and the internal temperature sensor. | Must | Validate by running a MicroPython sketch, a CircuitPython sketch, and an Arduino-Pico C++ sketch each on the Pico simulator without error; confirm GP26/GP27/GP28 appear as ADC options in autocomplete. |
| UR-CODE-062 | While a simulation is running, the editor shall visually indicate the currently executing line (execution cursor / line highlight) in real time so Students can follow program flow. | Must | Execution cursor must not introduce more than 100 ms of display lag relative to simulator state. Disabled for high-frequency loops unless stepped. |
| UR-CODE-063 | The editor shall display a **Serial Monitor** pane that shows output from `Serial.print()` / `Serial.println()` (Arduino) and `print()` (MicroPython) in real time during simulation, and that also accepts serial input fed back to the simulated board. | Must | Serial Monitor is dockable (bottom or side); font is monospace; output is timestamped. Input field sends ASCII text on Enter or newline character. |
| UR-CODE-064 | The editor shall support **Step-Through / Debug** mode where the Student can pause simulation, step line-by-line, and inspect the values of declared variables in a Watch panel. | Should | Watch panel shows variable name, type, and current value; arrays truncated to first 10 elements with an expand option. |
| UR-CODE-065 | The editor shall allow Students to set breakpoints (by clicking the gutter) that pause the simulation at that line so pin states and variable values can be inspected. | Should | Breakpoints persist for the session; they are shown as filled circles in the gutter and listed in the Debug panel. |
| UR-CODE-066 | Pin state changes triggered by code execution (e.g., `digitalWrite(13, HIGH)`) shall be reflected on the Canvas in the RSE with no perceptible rendering lag (target < 50 ms). | Must | Cross-reference: *User Requirements: Simulation Experience*, UR-SIM-nnn. |
| UR-CODE-067 | Errors thrown during simulation runtime (e.g., stack overflow, infinite loop watchdog, illegal instruction) shall be caught, displayed in an **Error Console** panel within the editor, and the simulation halted with a meaningful error message that includes the instruction address or sketch line number where possible. | Must | Error messages are plain-language rather than raw register dumps; a "Learn more" link opens the help panel for that error class. |
| UR-CODE-068 | The editor shall provide a **Stop** button that halts simulation, resets the simulated board to its power-on state, and clears the Serial Monitor. | Must | Stopping simulation does not discard unsaved code. |

### UR-CODE-081 to UR-CODE-095: Worked Examples and Help / Documentation Panel

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-CODE-081 | The editor shall include a **Help & Docs** panel (collapsible sidebar or tab) providing: Arduino Language Reference, MicroPython stdlib reference, CircuitPython library reference, Pico SDK C/C++ API reference, library API references for all pre-bundled libraries, and RoboCode Studio editor keyboard shortcuts. | Must | Panel is searchable; search returns results within 500 ms; content is versioned alongside the platform. |
| UR-CODE-082 | API documentation entries shall show: function signature, parameter descriptions, return type, a runnable in-editor code example, and links to related functions. | Must | "Try this example" inserts the snippet into a new project or a sandbox area without overwriting the Student's work. |
| UR-CODE-083 | The Help & Docs panel shall include a curated set of **Worked Examples** for each major component in the Component Catalogue (e.g., blink single LED, read HC-SR04 ultrasonic distance, display text on LCD, spin servo to angle, read DHT11 temperature). | Must | Each worked example includes: annotated source code, a pre-wired canvas configuration that loads alongside the code, and an explanation panel written at two reading levels (primary / high school, selectable). |
| UR-CODE-084 | Worked Examples shall be launchable as isolated sandbox projects that do not overwrite a Student's current work-in-progress. | Must | Launching a worked example opens a new project tab or prompts to save the current project first. |
| UR-CODE-085 | A Teacher shall be able to contribute worked examples to the school's local example library, visible to their class Students. | Should | Teacher-authored examples are flagged as school-scoped and are not visible outside the tenant. |
| UR-CODE-086 | The Help & Docs panel content shall be available offline (cached after first load) so that Students in low-connectivity environments can access it without an active internet connection. | Should | Implemented via service-worker cache; content version mismatch triggers a background re-fetch when connectivity is restored. |

### UR-CODE-096 to UR-CODE-115: AI Hint Assistant

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-CODE-096 | The editor shall include a **guarded AI Hint Assistant** that a Student can invoke to request contextual hints about their code, error messages, or next-step suggestions without receiving a direct solution. | Must | AI Hint Assistant is a distinct UI panel; it does not auto-appear without Student action (opt-in, not ambient). |
| UR-CODE-097 | The AI Hint Assistant shall operate in **hint-only / Socratic mode**: it guides the Student toward the solution with questions and partial clues; it shall not emit complete correct code blocks, complete loop bodies, or complete function implementations in response to a Student request for help on an assigned task. | Must | Guardrail enforced at the prompt/system-instruction level. Teacher and School Admin can configure the maximum specificity level of hints per class or per assignment. |
| UR-CODE-098 | The AI Hint Assistant shall be contextually aware of: the current sketch (passed as context), the active error diagnostics, the canvas component topology, and the current task description if one is loaded. | Must | Context window includes at minimum the full current sketch and the most recent 5 error messages. Canvas topology is summarised as a component-and-pin list. |
| UR-CODE-099 | All AI Hint Assistant interactions shall be logged per Student, per session, with timestamps, prompt text, and response text, retained for Teacher and School Admin review for safeguarding and academic integrity purposes. | Must | Logs viewable in the Admin/Teacher reporting interface; retained per the authoritative retention schedule in Section 15 (UR-COMM-063): minimum 12 months (or the school's data-retention policy, whichever is longer). Cross-reference: *User Requirements: Administration and Reporting*. |
| UR-CODE-105 | The AI Hint Assistant shall be governed as a child-facing AI feature: (a) RBAC — only Students may invoke it; Teachers/School Admins control availability per UR-CODE-100; the capability is reflected in the Roles and Permissions Matrix (Section 5); (b) all prompts and responses pass through the central content moderation pipeline of Section 15 (UR-COMM-018 to UR-COMM-021); (c) the underlying model provider must be contracted under a data-processing agreement that prohibits use of student prompts for model training or behavioural profiling. | Must | No student data may be retained by the AI provider beyond the request lifecycle. Verified at vendor onboarding and reviewed annually. |
| UR-CODE-100 | A Teacher shall be able to disable the AI Hint Assistant for a specific assignment or for an entire class, with the disabled state enforced in the editor UI (the Hint button is hidden or greyed with a tooltip). | Must | Disabled state syncs to all active Student sessions within 5 s. |
| UR-CODE-101 | The AI Hint Assistant shall apply content moderation filters to both incoming Student prompts and outgoing responses: profanity filter, PII detection (to avoid echoing back personal information), and off-topic deflection for non-programming queries. | Must | Content moderation is applied before responses are displayed; rejected responses are replaced with a generic deflection message. |
| UR-CODE-102 | The AI Hint Assistant shall display a visible disclaimer to the Student stating that responses are AI-generated, may contain errors, and should be verified by running the code and consulting the Help & Docs panel. | Must | Disclaimer appears as a persistent footer in the Hint panel; cannot be permanently dismissed. |
| UR-CODE-103 | For primary-school Students (age < 13), the AI Hint Assistant shall be restricted to block-based guidance only (block palette suggestions, visual explanations) and shall not return text-code snippets. | Must | Age tier is determined by the Student's profile and enforced server-side; client-side enforcement is supplementary. |
| UR-CODE-104 | The AI Hint Assistant shall support rate-limiting per Student: a maximum of 10 AI hint requests per hour per Student account, configurable by the School Admin. | Should | Rate-limit counter displayed in the Hint panel ("8 of 10 hints used this hour"). Counter resets on the hour. |

### UR-CODE-116 to UR-CODE-130: Save, Versioning and Project Association

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-CODE-116 | Code shall be saved as part of the project, co-located with the canvas layout, wiring configuration, and simulation state in a single project bundle. | Must | Project bundle format is documented in the system specification; it includes source files for each mode, canvas JSON, and metadata. |
| UR-CODE-117 | The editor shall auto-save code to the platform backend at a minimum interval of every 30 seconds while a Student is actively editing, and immediately upon a deliberate save action (Ctrl+S or Save button). | Must | Auto-save indicator (e.g., spinning icon → checkmark) shown in the editor toolbar; loss of fewer than 30 seconds of work guaranteed per session on clean disconnect. |
| UR-CODE-118 | The platform shall maintain a **version history** of every saved state of the project code, retaining at minimum the last 50 auto-save snapshots and all manual save points, for a minimum of 90 days. | Should | Version history accessible from a History panel in the editor; each entry shows timestamp, word-count change delta, and an optional Student-provided label. |
| UR-CODE-119 | A Student shall be able to restore any version from the history with a one-click action; the current unsaved state shall be offered as a separate save-point before restoration proceeds. | Should | Restoration is non-destructive; the previous current state is saved as a checkpoint before the restore. |
| UR-CODE-120 | A Teacher shall be able to view the version history of any Student's project (within their class) for assessment and academic-integrity review without altering the Student's work. | Must | Read-only access; Teacher's view is logged in the audit trail. Cross-reference: *User Requirements: Learning, Courses, Tasks and Assessment*. |
| UR-CODE-121 | When a Student submits an assignment, the platform shall capture and lock a **submission snapshot** of the code and canvas state at the time of submission. The snapshot is immutable and associated with the assessment record. | Must | Submission snapshot stored separately from the working copy; Student can continue editing the working copy after submission. |
| UR-CODE-122 | Code projects shall be exportable by the Student as a downloadable `.ino` (Arduino C/C++), `.py` (MicroPython / CircuitPython), `.cpp` (Pico SDK C/C++), or compiled `.uf2` firmware image (Raspberry Pi Pico), or as a ZIP archive containing all project files. | Should | Export action in File menu; export includes a `diagram.json` compatible with Wokwi's format for interoperability. UF2 export is only available for Pico projects on the accurate simulation path. |
| UR-CODE-123 | For collaborative projects, the code editor shall support real-time co-editing by multiple Students simultaneously (Yjs CRDT), with each collaborator's cursor shown in a distinct colour with their display name. | Should | Concurrent edit conflicts resolved by CRDT merge; no data loss. Cross-reference: *User Requirements: Teams, Competitions and Collaboration*. |

---

## MoSCoW Priority Summary

| Priority | Requirement IDs |
|---|---|
| Must | UR-CODE-001, 002, 003, 005, 006, 006A, 021, 022, 024, 025, 027, 041, 042, 043, 044, 061, 061A, 062, 063, 066, 067, 068, 081, 082, 083, 084, 096, 097, 098, 099, 100, 101, 102, 103, 116, 117, 120, 121 |
| Should | UR-CODE-004, 006B, 007, 023, 026, 028, 030, 045, 046, 064, 065, 085, 086, 104, 118, 119, 122, 123 |
| Could | UR-CODE-029 |
| Won-t (this release) | Block-Based to MicroPython transpilation; full hardware debugger JTAG integration; AI-generated complete project scaffolding for Students. |

---

## Editor Architecture Overview

The diagram below shows the structural layout of the Code Editor within RoboCode Studio and its integration points.

```
+------------------------------------------------------------------+
|  RoboCode Studio – Code Tab                                      |
|                                                                  |
|  +-------------------+  +-----------------------------------+   |
|  | Toolbar           |  | Library Manager / Code Templates  |   |
|  | [Mode Selector]   |  | [Searchable list of libs/snippets]|   |
|  | [Run] [Stop]      |  | [Worked Examples]                 |   |
|  | [Save] [History]  |  | [Help & Docs panel]               |   |
|  | [AI Hint] [Export]|  | [AI Hint Assistant panel]         |   |
|  +-------------------+  +-----------------------------------+   |
|                                                                  |
|  +---------------------------------------------+               |
|  |  Monaco Editor                              |               |
|  |  - Syntax highlighting                      |               |
|  |  - Autocomplete (language + library APIs)   |               |
|  |  - Inline lint diagnostics (gutter + wave)  |               |
|  |  - Execution cursor (run-time line marker)  |               |
|  |  - Breakpoint gutter                        |               |
|  |  - Code folding                             |               |
|  |  - Multi-cursor, find/replace               |               |
|  +---------------------------------------------+               |
|                                                                  |
|  +---------------------------------------------+               |
|  |  Serial Monitor / Debug Console / Watch     |               |
|  |  [Serial output  | Variable watch | Errors] |               |
|  +---------------------------------------------+               |
|                                                                  |
|  Integration layer:                                             |
|    Code <--[compile/interpret]--> RSE / RVM                     |
|    Code <--[project bundle]-----> Backend (versioned saves)     |
|    Code <--[CRDT sync]----------> Yjs (collaborative editing)   |
+------------------------------------------------------------------+
```

---

## Block-Based Mode — Palette Structure

```
+------------------------------------------------------------+
|  Block Palette (Block-Based Mode)                          |
|                                                            |
|  [Control]   [Logic]    [Loops]    [Math]    [Text]        |
|  if/else     and/or     repeat     +/-/*//   join          |
|  wait        not        forever    random    print         |
|  call fn     compare    for range  abs/round length        |
|                                                            |
|  [I/O – Digital]  [I/O – Analog]   [I/O – Serial]         |
|  digitalWrite     analogRead        Serial.begin           |
|  digitalRead      analogWrite       Serial.print           |
|  pinMode          map()             Serial.println         |
|                                                            |
|  [Components]  (auto-populated from Canvas)                |
|  LED on/off    Servo set angle     Buzzer tone             |
|  LCD print     Motor speed/dir     Sensor read             |
|                                                            |
|  [Functions]                                               |
|  Define function     Call function     Return value        |
+------------------------------------------------------------+
```

---

## Accessibility and Internationalisation

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-CODE-131 | The code editor and all associated panels shall meet WCAG 2.2 Level AA: keyboard-navigable, screen-reader-compatible ARIA labels on all interactive controls, sufficient colour contrast. | Must | Third-party audit or automated axe-core scan with zero critical/serious violations. |
| UR-CODE-132 | Syntax highlighting colour themes shall include a high-contrast option (dark and light) meeting WCAG 2.2 contrast ratios. | Must | Default themes: Light, Dark, High-Contrast Dark, High-Contrast Light. |
| UR-CODE-133 | Editor UI labels, error messages, and documentation shall support localisation; initial release shall ship English (en-GB / en-US); additional locales (French, Swahili, Shona, Zulu) deliverable post-launch. | Should | All user-facing strings externalised to an i18n resource file; no hard-coded English strings in components. |

---

## Constraints and Dependencies

| Constraint / Dependency | Detail |
|---|---|
| Monaco Editor | The code editor is implemented using Monaco Editor (MIT licence, the engine behind VS Code). All editor feature requirements (UR-CODE-021 to UR-CODE-030) are implemented on top of Monaco's extension APIs. |
| avr8js / ESP32 core / rp2040js simulation | Code execution in accurate mode depends on avr8js (Wokwi open-source) for the Arduino UNO R3, the ESP32 core simulator for the ESP32, and rp2040js (github.com/wokwi/rp2040js) for the Raspberry Pi Pico (RP2040). rp2040js runs real RP2040 firmware (UF2 or ELF images) in the browser via WebAssembly. Compilation may invoke an in-browser WASM toolchain or a backend compile microservice; compile microservice latency must not exceed 5 s p95 for all three board targets. |
| Yjs CRDT | Collaborative co-editing (UR-CODE-123) depends on the Yjs library and the Socket.IO realtime channel. |
| Child-safety regulations | AI Hint Assistant guardrails (UR-CODE-097, 099, 101, 103) must comply with COPPA, GDPR-K, Zimbabwe Cyber and Data Protection Act, POPIA, NDPR, and Kenya Data Protection Act. AI log retention must be reconciled against data-minimisation obligations for minors. |
| Offline / low-connectivity | Africa-region delivery via CDN edge (Cloudflare/CloudFront). Help & Docs offline caching (UR-CODE-086) implemented via service worker. Compile microservice requires connectivity; in-browser WASM path is the offline/low-bandwidth fallback. |

---

## Rationale Notes

**Why five authoring modes?** The primary-school cohort (ages 8–12) benefits most from the cognitive scaffolding of block-based programming before transitioning to text-based syntax. The text modes — Arduino C/C++, MicroPython, CircuitPython, and Pico SDK C/C++ — reflect the three first-class boards (Arduino UNO R3, ESP32, and Raspberry Pi Pico) and their natural development ecosystems. MicroPython and CircuitPython are widely taught as accessible Python-based languages for the Pico; Pico SDK C/C++ supports advanced students who need bare-metal RP2040 access. This range matches industry practice and curricula in use across African STEM education programmes.

**Why a guarded AI Hint Assistant rather than a full AI pair-programmer?** Academic integrity and genuine skill development require that Students work through problems themselves. A Socratic hint model mirrors best practice in pedagogy: the assistant scaffolds understanding rather than supplying answers. Strict logging and Teacher oversight mean the assistant serves as a transparent learning aid rather than a black box.

**Why auto-include suggestions on component placement?** A common pain point for beginners is the disconnect between placing a sensor on the canvas and not knowing which library to import. Bridging this gap at the moment of action reduces frustration and keeps the learning loop tight, reinforcing the relationship between physical components and code.


# User Requirements: Learning, Courses, Tasks and Assessment

## Overview

This section defines user requirements governing the structured learning experience on RoboCode.Africa. It covers the end-to-end curriculum architecture — from enrolment in a learning track through lesson delivery, guided project work, coding tasks, assessment and certification — as experienced by Students, Teachers/Educators, School Admins and Super Admins. Requirements here apply to both the direct (robocode.africa) context and the multi-tenant (school subdomain / custom domain) context.

All requirements in this section carry the prefix `UR-LRN-`. Cross-references to upstream identity, approval and safety controls are found in *User Requirements: Onboarding, Signup and Approval* and *User Requirements: Authentication and Account Management*. Cross-references to the simulation canvas and code editor are found in *User Requirements: RoboCode Studio Canvas, Components and Wiring* (Section 9), *User Requirements: Simulation Experience* (Section 10), and *User Requirements: Code Editor and Programming* (Section 11). Gamification outcomes such as RoboPoints and badge awards are elaborated in *User Requirements: Gamification, RoboPoints and Leaderboards* (Section 14).

---

## Curriculum Architecture

### Learning Tracks

RoboCode.Africa organises content into structured **Learning Tracks** — curated sequences of modules aligned to learner age, prior knowledge and curriculum standard. Two primary track families exist: **Robotics & Coding** and **AI Fundamentals**, each subdivided by school level.

```
LEARNING TRACK HIERARCHY
═══════════════════════════════════════════════════════════
Track Family
  └── Track (level-specific)
        └── Module (topic unit, e.g. "Sensors & Sensing")
              └── Lesson (atomic instructional unit)
                    ├── Content Pages (text / video / interactive)
                    ├── Guided Tutorial / Project
                    └── Coding Task / Challenge
              └── Module Quiz
        └── Module Project (capstone, assessed)
  └── Certificate of Completion
═══════════════════════════════════════════════════════════
```

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-001 | The platform SHALL provide at least two distinct Learning Track families: **Robotics & Coding** and **AI Fundamentals**. | Must | Both families present at launch with at least one track each. |
| UR-LRN-002 | Each track family SHALL contain separate tracks differentiated by school level: **Primary** (ages 9–13, Grades 4–7) and **High School** (ages 13–18, Grades 8–12). | Must | Track metadata must record `level: primary | high_school`. |
| UR-LRN-003 | Tracks SHALL be sequentially ordered so that prerequisites are satisfied before a learner can begin an advanced track; the system SHALL enforce this sequencing unless a Teacher or School Admin explicitly overrides it for a student or class. | Must | Locked track displays prerequisite name and completion percentage required. |
| UR-LRN-004 | Track, module and lesson metadata SHALL include curriculum alignment tags (e.g., Zimbabwe O-Level ICT Syllabus, South African CAPS Technology, Nigerian Basic Technology, Kenyan CBC Technology strand) so that teachers can filter content by national curriculum. | Should | Tags managed by Super Admin in the global content library. |
| UR-LRN-005 | The Super Admin and Platform Moderator SHALL maintain a **Global Content Library** from which School Admins and Teachers can import tracks, modules or individual lessons into their school context. | Must | School-imported items are read-only clones; original is preserved in the library. |
| UR-LRN-006 | Teachers SHALL be able to create custom modules and lessons scoped to their school tenant, assigning them to classes independently of the global library. | Must | Custom content is isolated to the creating tenant and not visible platform-wide. |

### Module and Lesson Structure

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-007 | Each **Module** SHALL have: a title, description, learning objectives, estimated duration, difficulty label (Beginner / Intermediate / Advanced), prerequisite module references, and an ordered list of lessons. | Must | Rendered in the module overview page before a student enters. |
| UR-LRN-008 | Each **Lesson** SHALL support at least the following content types: rich-text pages with embedded static images, embedded video (hosted or external URL), and interactive RoboCode Studio widgets (pre-configured component canvases). | Must | Interactive widgets must launch RoboCode Studio in an embedded or full-screen mode. |
| UR-LRN-009 | Lessons SHOULD support step-by-step instructional pagination (one concept per page) with explicit **Next / Back** navigation and a progress indicator showing current page within the lesson. | Should | Minimum step count is 3; maximum recommended is 15 pages per lesson. |
| UR-LRN-010 | Lesson content SHALL be authored in a WYSIWYG/Markdown editor by Teachers (for school-scoped content) and by Super Admin staff (for global library content). | Must | Content editor must support code blocks with syntax highlighting, inline images and tables. |
| UR-LRN-011 | Video content embedded in lessons SHALL support manual closed captions / subtitles, playback speed control (0.5×–2×), and full-screen mode, to meet WCAG 2.2 AA accessibility requirements. | Must | Auto-captions via third-party service are acceptable if editable. |
| UR-LRN-012 | The platform SHALL track and persist each student's position within a lesson (current page) so that reloading the browser or returning later resumes from the last-visited page. | Must | Position stored server-side; not reliant on browser local storage alone. |

---

## Guided Tutorials and Projects

### Guided Tutorials

Guided tutorials are teacher- or platform-authored walkthroughs that lead a student step-by-step through building a circuit in RoboCode Studio and writing corresponding code. They sit inside a lesson and launch the full IDE in a guided mode.

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-013 | The platform SHALL support **Guided Tutorial** mode within RoboCode Studio, where a sidebar displays numbered instructional steps that the student follows in sequence to assemble a specified circuit and write corresponding code. | Must | Sidebar steps are authored alongside the tutorial definition. |
| UR-LRN-014 | Each tutorial step SHALL be able to: display instructional text and images; highlight a specific component, pin or wire on the canvas; and optionally gate progression until the student performs a specified action (e.g., places a component, connects a wire, writes a code keyword). | Must | Gate conditions are optional per step; authors may leave steps ungated. |
| UR-LRN-015 | The system SHALL provide a **Hint** mechanism per tutorial step, offering one or more progressive hints (first hint: general; second hint: specific; third hint: reveals answer) without penalising the student's completion record. | Should | Hint usage is logged for teacher visibility but does not affect task grade. |
| UR-LRN-016 | On completing all tutorial steps, the student SHALL receive a visual completion confirmation and automatic progress credit for that lesson/tutorial node. | Must | Credit is awarded only once per unique tutorial per student. |
| UR-LRN-017 | Teachers SHALL be able to author guided tutorials using a step-definition editor that supports text, image upload, canvas action triggers and optional gate conditions without requiring programming knowledge. | Should | Author preview mode must simulate the student experience. |

### Projects

Projects are open-ended or semi-structured practical assignments where students apply multiple skills learnt across lessons to build a working circuit + code solution in RoboCode Studio.

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-018 | Each **Project** SHALL have a brief (title, description, learning outcomes, required components list, acceptance criteria) visible to the student before they begin work. | Must | Required components list should reference the canonical component names from the Component Catalogue. |
| UR-LRN-019 | Students SHALL work on projects within a dedicated **Project Workspace** in RoboCode Studio that is saved separately from their personal sandbox and is linked to the specific assignment or task. | Must | Workspace auto-saved continuously; versioned snapshots on each simulation run. |
| UR-LRN-020 | Module **Capstone Projects** SHALL be marked as the terminal assessment for their module and SHALL trigger a certificate evaluation upon successful submission and grading. | Must | Capstone Projects are distinct from routine tasks in metadata and UI treatment. |
| UR-LRN-021 | The platform SHOULD allow collaborative projects where two or more students work in a shared RoboCode Studio workspace with real-time collaboration (Yjs CRDT). Collaborative rules and team formation requirements are detailed in *User Requirements: Teams, Competitions and Collaboration* (Section 13). | Should | Collaboration requires explicit Teacher or School Admin enablement per assignment. |

---

## Coding Tasks and Challenges

### Task Types

| Task Type | Description | Evaluated By |
|---|---|---|
| Guided Coding Task | Structured; student completes partial code scaffold | Auto-checker against expected simulation output |
| Open Coding Challenge | Unstructured; student writes full solution | Auto-checker + optional teacher rubric |
| Debug Challenge | Student is given broken code and must fix it | Auto-checker verifies corrected behaviour |
| Timed Challenge | Open challenge with countdown timer | Auto-checker; time recorded for leaderboard |
| Teacher-Assigned Task | Specific brief assigned to a class or individual | Teacher grades via rubric + optional auto-check |

### Task Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-022 | The platform SHALL support all five Task Types listed in the Task Types table above, each launchable within RoboCode Studio. | Must | Task type is recorded in task metadata; UI treatment varies by type. |
| UR-LRN-023 | For **auto-checked tasks**, the system SHALL evaluate student submissions by running the submitted code + circuit against a set of **expected simulation outcomes** (e.g., LED on at pin 13 after 500 ms, sensor reading in range 20–30 cm) and reporting pass/fail per test case. | Must | Test cases are authored by Teachers or Super Admin staff alongside the task definition. |
| UR-LRN-024 | Auto-check test cases SHALL support at minimum: pin state assertions (HIGH/LOW), analog reading range assertions, timing assertions (event within N ms), serial output string matching, and component visual state checks (e.g., LCD text content). | Must | Additional assertion types may be added in future releases. |
| UR-LRN-025 | The auto-checker SHALL provide the student with a **test results panel** showing each test case name, pass/fail status, and — where the task author permits — an explanatory message for failed cases, without revealing the full expected answer. | Must | Explanation text is optional and authored per test case. |
| UR-LRN-026 | Students SHALL be permitted a configurable number of submission attempts (default: unlimited; Teacher may cap attempts per task). Between re-attempts the student must make at least one change to code or circuit before re-submitting. | Should | Attempt count and change-detection are logged server-side. |
| UR-LRN-027 | **Debug Challenges** SHALL provide the student with a pre-built circuit and intentionally broken code; the task brief SHALL describe the expected (correct) behaviour, and the auto-checker SHALL verify that the student's corrected code produces that behaviour. | Must | The broken code and circuit are locked read-only for the circuit portion; only code is editable unless the task specifies otherwise. |
| UR-LRN-028 | **Timed Challenges** SHALL display a countdown timer in the RoboCode Studio interface; on expiry the workspace is automatically submitted in its current state. | Should | Timer can be paused only by a Teacher/Admin for accessibility accommodations. |
| UR-LRN-029 | Tasks SHALL support a **starter file** (partial code scaffold and/or partial circuit layout) provided by the task author and pre-loaded into the student workspace when the task is opened. | Must | Starter file is immutable from the student's perspective (read-only scaffold sections); editable sections are clearly marked. |
| UR-LRN-030 | Task descriptions and briefs SHALL support rich text, embedded images, component diagrams, and embedded video, consistent with the lesson content authoring capabilities (see UR-LRN-010). | Should | Same content editor used for lesson authoring and task authoring. |

---

## Quizzes and Knowledge Checks

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-031 | The platform SHALL support **inline Knowledge Checks** (1–5 questions embedded within a lesson) and standalone **Module Quizzes** (5–30 questions covering a full module). | Must | Both types must be completable without leaving the lesson/module context. |
| UR-LRN-032 | Supported question types SHALL include: multiple choice (single answer), multiple choice (multi-select), true/false, short-answer text (exact match or keyword match), and code-snippet completion (fill in the blank in a code block). | Must | Additional types (drag-and-drop, ordering) are Should for v2. |
| UR-LRN-033 | Module Quizzes SHALL support a configurable time limit, randomisation of question order, and randomisation of answer option order, all set by the Teacher or content author. | Should | Defaults: no time limit, no randomisation. |
| UR-LRN-034 | On quiz completion, the student SHALL immediately see their score (percentage and pass/fail against a Teacher-configured pass mark, default 70 %), per-question feedback for questions the student got wrong, and — if they passed — a progress credit. | Must | Per-question feedback text is authored per question; defaults to showing the correct answer if no custom feedback is written. |
| UR-LRN-035 | Students who fail a Module Quiz SHALL be able to retake it after a Teacher-configured cooldown period (default: 24 hours). Teachers may reset the cooldown or grant an immediate retry for an individual student. | Should | Max attempts may be set to unlimited or a fixed cap. |
| UR-LRN-036 | Quiz results SHALL be stored per student and accessible to the assigned Teacher for analytics and grading purposes. | Must | Results are accessible via the teacher dashboard described in *User Requirements: Administration and Reporting* (Section 16). |

---

## Teacher-Assigned Assignments

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-037 | Teachers SHALL be able to create **Assignments** by composing one or more tasks, quizzes and/or project briefs, setting a due date, and assigning the Assignment to one or more classes or individual students within their school tenant. | Must | Assignment creation requires Teacher role at minimum; School Admin may also create. |
| UR-LRN-038 | Teachers SHALL be able to set per-assignment configuration including: due date and time, max attempts per task, late submission policy (accepted / not accepted / accepted with penalty), visible/hidden auto-check results, and grading rubric attachment. | Must | Defaults are platform-configurable by School Admin. |
| UR-LRN-039 | Students SHALL receive a notification (in-platform and optionally via email) when a new Assignment is posted to their class, including assignment title, description, due date and a link to begin. Notification requirements are detailed in *User Requirements: Communication, Notifications and Safety* (Section 15). | Must | Notification sent at time of assignment publication; reminder sent 24 h before due date by default. |
| UR-LRN-040 | Students SHALL be able to view all their Assignments in a **My Assignments** dashboard listing pending, in-progress and submitted assignments with due dates, status indicators and direct launch into the relevant workspace. | Must | Dashboard must be sortable by due date and filterable by status and class. |
| UR-LRN-041 | On student submission of an Assignment (or on due-date expiry), the Teacher SHALL be notified and the submission SHALL appear in the Teacher's **Grading Queue** with the student's name, submission timestamp, auto-check score (if applicable) and a link to open the student's workspace read-only for review. | Must | Teacher can open the submitted workspace in a read-only view of the circuit, code and simulation replay if available. |

### Submission and Grading

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-042 | Teachers SHALL be able to grade assignment submissions using a **Rubric** with configurable criteria (e.g., Circuit Assembly, Code Quality, Correct Output, Documentation/Comments) and a numeric or descriptive scale per criterion. | Must | Rubric is defined at assignment creation; point weights per criterion are configurable. |
| UR-LRN-043 | Teachers SHALL be able to attach written feedback comments to a submission, viewable by the student after grading is published. | Must | Feedback is plain text minimum; rich-text with code snippets is Should. |
| UR-LRN-044 | Teachers SHALL be able to mark a submission for revision and return it to the student with feedback, allowing the student to resubmit before final grading closes. | Should | Revision cycle limited to a Teacher-configured maximum number of rounds. |
| UR-LRN-045 | Grades SHALL be stored per student per assignment and aggregated into the student's progress record accessible to the Teacher and School Admin. | Must | Grades must not be visible to other students (no peer-visible scores unless Teacher explicitly enables peer review). |
| UR-LRN-046 | The platform SHOULD support **peer review** of submissions where a Teacher enables it, with student reviewers assigned anonymously and guided by a provided rubric. Peer review scores are advisory and not automatically applied to the official grade. | Could | Peer review is subject to the same safeguarding and moderation controls as all student communication. |

---

## Progress and Mastery Tracking

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-047 | The platform SHALL maintain a **Learning Progress Record** for each student tracking: track enrolment and completion status, module completion percentage, lesson completion status, task submission history and scores, quiz scores, assignment grades, and total RoboPoints earned from learning activities. | Must | Progress Record is the authoritative data source for certificates, leaderboards and teacher reporting. |
| UR-LRN-048 | Students SHALL have a **My Progress** dashboard showing: enrolled tracks with overall completion %, current module and lesson, streak (consecutive days of activity), recent achievements, and recommended next step. | Must | Dashboard must load within 2 seconds on a standard school internet connection (defined as ≥ 2 Mbps). |
| UR-LRN-049 | The platform SHALL implement **Mastery Levels** per module: Not Started, In Progress, Completed, Mastered. Mastered status is awarded when the student completes all lessons, achieves ≥ 80 % on the module quiz, and submits and passes the capstone project (where present). | Should | Mastery level is displayed on the student's profile and reported to Teachers. |
| UR-LRN-050 | Teachers SHALL have access to a **Class Progress View** showing all students in a class with their completion percentages per module, quiz scores and assignment grades, sortable and filterable. | Must | Class Progress View is part of the teacher dashboard described in Section 16. |
| UR-LRN-051 | Progress data SHALL be exportable by Teachers and School Admins in CSV format for offline record-keeping and reporting to school leadership. | Must | Export includes student name, ID, module, lesson, score and date columns. |
| UR-LRN-052 | The system SHALL detect and surface students who are significantly behind the class average (configurable threshold, default: 2 or more modules behind) and alert the assigned Teacher via a dashboard flag. | Should | Alert does not notify the student directly; teacher decides how to respond. |

---

## Certificates and Badges

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-053 | On completing a Learning Track (all modules completed and mastery criteria met), the platform SHALL automatically award a **Certificate of Completion** to the student. | Must | Certificate is generated as a PDF with the student's name, track name, completion date and platform logo. White-label tenants may have school logo substituted per tenant branding settings. |
| UR-LRN-054 | Certificates SHALL include a unique verifiable code (URL) that any third party can use to confirm the certificate's authenticity on robocode.africa without requiring a login. | Should | Verification page shows name, track, date and issuing entity (platform or school). |
| UR-LRN-055 | The platform SHALL award digital **Skill Badges** for completing individual modules, achieving mastery, completing a specified number of tasks, and other learning milestones as defined in the gamification system (see *User Requirements: Gamification, RoboPoints and Leaderboards*, Section 14). | Must | Badge artwork is maintained by Super Admin in the global badge library; tenant-specific badges may be created by School Admin. |
| UR-LRN-056 | Students SHALL be able to view all earned certificates and badges on their **My Achievements** profile page and, subject to parental consent for minors, share them via a public link. | Should | Share link links to the public verification URL; no personal data other than name and achievement is exposed. |
| UR-LRN-057 | Teachers SHALL be able to manually award **Teacher Recognition Badges** to individual students for outstanding work, good citizenship or other qualitative achievements, with a brief citation attached. | Could | Manual badges are distinguished from system-awarded badges in the student's achievement list. |

---

## Curriculum Alignment

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-058 | All globally published tracks and modules SHALL be tagged against at least one national or regional curriculum standard relevant to the target learner market (see UR-LRN-004). | Must | Curriculum tags are mandatory before a module is published to the Global Content Library. |
| UR-LRN-059 | Teachers SHALL be able to filter and search the Global Content Library by curriculum tag, level, topic, component type and difficulty, to find suitable content for their students. | Must | Search must return results within 1 second. |
| UR-LRN-060 | The platform SHOULD provide a **Curriculum Mapping Report** for School Admins and Teachers showing which national curriculum outcomes are covered by the tracks and modules assigned to their school, and which remain uncovered, to support lesson planning. | Should | Report is exportable as PDF or CSV. |
| UR-LRN-061 | Where a module directly addresses AI literacy concepts (e.g., machine learning basics, data training, bias in AI), it SHALL be tagged with the AI Fundamentals track family tag and comply with age-appropriate framing aligned to the learner level (primary vs high school). | Must | AI content targeting primary students must be reviewed by a Platform Moderator before global publication. |
| UR-LRN-062 | At launch the Global Content Library SHALL contain concrete curriculum-mapped content, not merely a tag taxonomy: at minimum one complete track mapped to each of the named target syllabi — Zimbabwe ZIMSEC/O-Level ICT, South Africa CAPS Technology, Nigeria NERDC Basic Technology, and Kenya KICD/CBC Technology strand — with each constituent module carrying outcome-level tags. | Must | Verified by a pre-launch curriculum-coverage audit; satisfies OBJ-13's ">=20 templates" with documented curriculum coverage. |
| UR-LRN-063 | The **AI Fundamentals** track family SHALL define, at minimum, the following age-framed content units (no in-browser ML model training, which is out of scope per UR-NFR-C027): (primary) what AI is, everyday examples of AI, rule-based decision-making with sensors on the simulator, and an introduction to bias/fairness; (high school) how rule-based vs data-driven AI differ, applying a pre-trained or rule-based model in a RoboCode Studio project, data and bias literacy, and AI ethics. | Must | AI Fundamentals is delivered as conceptual lessons plus simulator activities using rule-based or pre-trained components only; it does not require training models in the browser. |

---

## Child Safety and Data Protection in Learning

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-LRN-062 | All student learning data (progress records, quiz answers, submitted code, project files, grades) is classified as **personal data** and SHALL be subject to the data minimisation and retention controls mandated under COPPA, GDPR-K, Zimbabwe Cyber and Data Protection Act, POPIA, NDPR and Kenya DPA as applicable. | Must | Retention period is configurable by Super Admin with defaults compliant with the strictest applicable jurisdiction. |
| UR-LRN-063 | Student assignment submissions and project workspaces SHALL only be accessible to: the submitting student, their assigned Teacher(s), the School Admin of their tenant, and (read-only) the Super Admin for audit/safeguarding purposes. No other student may view another's submitted work unless the Teacher explicitly enables a supervised peer-review session. | Must | Access control enforced at the API layer via Row-Level Security in PostgreSQL (see technology stack). |
| UR-LRN-064 | Any free-text content entered by a student in quiz answers, code comments or assignment notes SHALL pass through the platform's profanity/PII filter before being stored or displayed to other users, consistent with safeguarding requirements defined in *User Requirements: Communication, Notifications and Safety* (Section 15). | Must | Filter may flag for Teacher/Moderator review rather than auto-delete to avoid incorrect censorship of technical content. |

---

## MoSCoW Priority Summary

| ID | Requirement Summary | Priority |
|---|---|---|
| UR-LRN-001 | Two Learning Track families (Robotics & Coding; AI Fundamentals) | Must |
| UR-LRN-002 | Primary and High School level tracks per family | Must |
| UR-LRN-003 | Sequential prerequisite enforcement with Teacher override | Must |
| UR-LRN-004 | Curriculum alignment tags (multi-country) | Should |
| UR-LRN-005 | Global Content Library managed by Super Admin | Must |
| UR-LRN-006 | Teacher-authored custom modules per tenant | Must |
| UR-LRN-007 | Module metadata (objectives, duration, difficulty, prerequisites) | Must |
| UR-LRN-008 | Lesson content types: text, video, interactive widget | Must |
| UR-LRN-009 | Step-by-step lesson pagination with progress indicator | Should |
| UR-LRN-010 | WYSIWYG/Markdown lesson authoring for Teachers and Staff | Must |
| UR-LRN-011 | WCAG 2.2 AA video accessibility (captions, speed control) | Must |
| UR-LRN-012 | Server-side lesson position persistence across sessions | Must |
| UR-LRN-013 | Guided Tutorial mode with sidebar steps in RoboCode Studio | Must |
| UR-LRN-014 | Tutorial step gating on student actions | Must |
| UR-LRN-015 | Progressive Hint mechanism in tutorials | Should |
| UR-LRN-016 | Automatic progress credit on tutorial completion | Must |
| UR-LRN-017 | Teacher tutorial authoring with step editor | Should |
| UR-LRN-018 | Project brief with component list and acceptance criteria | Must |
| UR-LRN-019 | Dedicated project workspace in RoboCode Studio | Must |
| UR-LRN-020 | Module capstone project and certificate trigger | Must |
| UR-LRN-021 | Collaborative projects via Yjs CRDT (Teacher-enabled) | Should |
| UR-LRN-022 | Five task types supported | Must |
| UR-LRN-023 | Auto-check against expected simulation outcomes | Must |
| UR-LRN-024 | Auto-check assertion types: pin, analog, timing, serial, visual | Must |
| UR-LRN-025 | Test results panel for students with per-case feedback | Must |
| UR-LRN-026 | Configurable attempt limits; change-detection before retry | Should |
| UR-LRN-027 | Debug Challenges with locked circuit and editable code | Must |
| UR-LRN-028 | Timed Challenges with countdown and auto-submit | Should |
| UR-LRN-029 | Starter file (partial scaffold) pre-loaded into workspace | Must |
| UR-LRN-030 | Rich-text task descriptions with embedded media | Should |
| UR-LRN-031 | Inline Knowledge Checks and standalone Module Quizzes | Must |
| UR-LRN-032 | Multiple choice, true/false, short-answer, code-fill question types | Must |
| UR-LRN-033 | Quiz time limit, question and answer randomisation | Should |
| UR-LRN-034 | Immediate quiz results with per-question feedback | Must |
| UR-LRN-035 | Failed quiz retake with configurable cooldown | Should |
| UR-LRN-036 | Quiz results stored and accessible to Teacher | Must |
| UR-LRN-037 | Teacher creates Assignments from tasks/quizzes/projects | Must |
| UR-LRN-038 | Assignment configuration (due date, attempts, late policy, rubric) | Must |
| UR-LRN-039 | Student notification on Assignment posting and due-date reminder | Must |
| UR-LRN-040 | My Assignments dashboard for students | Must |
| UR-LRN-041 | Teacher Grading Queue with read-only student workspace view | Must |
| UR-LRN-042 | Rubric-based grading with configurable criteria and weights | Must |
| UR-LRN-043 | Teacher written feedback attached to submissions | Must |
| UR-LRN-044 | Mark for revision and student resubmission cycle | Should |
| UR-LRN-045 | Grades stored per student and accessible to Teacher/Admin | Must |
| UR-LRN-046 | Optional anonymous peer review (Teacher-enabled) | Could |
| UR-LRN-047 | Learning Progress Record per student | Must |
| UR-LRN-048 | My Progress dashboard for students | Must |
| UR-LRN-049 | Module Mastery Levels (Not Started → Mastered) | Should |
| UR-LRN-050 | Class Progress View for Teachers | Must |
| UR-LRN-051 | CSV export of progress data for Teachers and School Admins | Must |
| UR-LRN-052 | Behind-average student alert to Teacher | Should |
| UR-LRN-053 | Certificate of Completion on track completion | Must |
| UR-LRN-054 | Verifiable certificate URL (unauthenticated confirmation) | Should |
| UR-LRN-055 | Skill Badges for module completion and milestones | Must |
| UR-LRN-056 | My Achievements page with shareable links (consent-gated for minors) | Should |
| UR-LRN-057 | Teacher Recognition Badges (manual award) | Could |
| UR-LRN-058 | Mandatory curriculum alignment tagging before global publication | Must |
| UR-LRN-059 | Content library search by curriculum tag, level, topic | Must |
| UR-LRN-060 | Curriculum Mapping Report for Schools | Should |
| UR-LRN-061 | AI Fundamentals content tagged and age-framed; Moderator review | Must |
| UR-LRN-062 | Concrete curriculum-mapped tracks for ZIMSEC/CAPS/NERDC/KICD at launch | Must |
| UR-LRN-063 | AI Fundamentals content units defined (no in-browser ML training) | Must |
| UR-LRN-062 | Student learning data subject to multi-jurisdiction data protection | Must |
| UR-LRN-063 | Submission access restricted to student, Teacher, Admin, Super Admin | Must |
| UR-LRN-064 | Profanity/PII filter on student free-text before storage/display | Must |

---

## Assumptions and Constraints

- It is assumed that all student learning interactions occur within an authenticated, approved account context as defined in *User Requirements: Onboarding, Signup and Approval* (Section 6) and *User Requirements: Authentication and Account Management* (Section 7). No learning content other than the publicly accessible marketing demo is available to unauthenticated Guests.
- It is assumed that the in-browser WASM toolchain or compile microservice for auto-checking task submissions is available with a p95 response time of ≤ 10 seconds for compilation and simulation execution, consistent with non-functional expectations in Section 20.
- Offline lesson content caching (Service Worker / PWA) is a roadmap item and is not a requirement for the initial release.
- Curriculum content authoring quality and pedagogical accuracy are the responsibility of the Super Admin and Teacher user roles respectively; the platform provides the tooling but not editorial review.
- The maximum number of test cases per auto-checked task is 50 per submission in v1; this limit may be increased in future versions.


# User Requirements: Teams, Competitions and Collaboration

## Overview

This section specifies user requirements governing how students form and manage teams, how schools organise and participate in inter-school competitions, how individuals participate in challenges, and how real-time collaborative project work is conducted inside RoboCode Studio. All requirements apply across both school-tenant accounts (subdomain or custom domain) and direct robocode.africa accounts. Child-safety and data-protection constraints from Section 6 (Onboarding, Signup and Approval) and Section 15 (Communication, Notifications and Safety) remain in force at all times.

Requirements are identified with the prefix **UR-TEAM-nnn**. Use-case cross-references follow the scheme **UC-nnn** defined in Section 17. Priority uses MoSCoW notation.

---

## Definitions

| Term | Meaning in this section |
|---|---|
| Team | A named group of one or more Students, scoped to a school tenant or the platform. |
| Captain | The Student who holds owner-level permissions within a Team. |
| Member | A Student who belongs to a Team without captain privileges. |
| Competition | A structured event with defined rounds, deadlines, challenge types, and a scoring mechanism, created by a Teacher, School Admin, or Super Admin. |
| Challenge | A single competitive task within a Competition (coding, simulator build, or AI task). |
| Bracket | A single-elimination or round-robin structure that organises Team matchups within a Competition round. |
| Submission | A Team's or individual's completed Challenge artefact submitted before the deadline. |
| Rubric | A weighted, criterion-based scoring guide used by human judges in addition to or instead of automated scoring. |
| Collaborative Project | A RoboCode Studio project shared among multiple Students or Team members, edited concurrently via CRDT synchronisation. |

---

## Team Formation and Membership

### Team Creation

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-001 | A Student must be able to create a named Team within the school tenant to which they belong. | Must | Team name is unique per tenant; max 64 characters; profanity-filtered. |
| UR-TEAM-002 | A Student creating a Team automatically becomes the Team Captain. | Must | Only one Captain per Team at a time. |
| UR-TEAM-003 | A Teacher or School Admin must be able to create Teams on behalf of Students. | Must | Useful for class-organised competitions and younger primary-school cohorts. |
| UR-TEAM-004 | The system must enforce a configurable minimum and maximum Team size set per Competition or per school policy. | Must | Default: min 1, max 6. School Admin or Teacher overrides per event. |
| UR-TEAM-005 | A Student must only belong to one Team per Competition at a time. | Must | Students may belong to separate standing Teams outside of competitions. |
| UR-TEAM-006 | The system must allow a Student to be a member of multiple standing (non-competition) Teams simultaneously, up to a platform-configured cap. | Should | Default cap: 5 Teams per Student. |

### Team Roles

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-007 | Every Team must have exactly one Captain at all times. | Must | If a Captain leaves, the system must prompt remaining members or a Teacher to assign a new Captain before the vacancy is persisted. |
| UR-TEAM-008 | The Captain must be able to invite Students (by username or school email) to join the Team. | Must | Invitations are subject to approval; see UR-TEAM-010. |
| UR-TEAM-009 | The Captain must be able to remove Members from the Team, subject to any competition freeze period. | Must | Removals during a freeze period require Teacher or School Admin approval. |
| UR-TEAM-010 | The Captain must be able to transfer the Captain role to any current Member. | Should | Transfer requires the receiving Member to accept. |
| UR-TEAM-011 | Members must be able to view the Team profile, shared projects, competition standings, and Team chat (where enabled by Teacher). | Must | Read access is always granted; write access governed by collaboration rules. |
| UR-TEAM-012 | Members must be able to leave a Team voluntarily, subject to competition freeze rules. | Must | |

### Invitations and Approvals

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-013 | Team invitations sent to another Student within the same school tenant must be delivered via the in-platform notification system (see Section 15) and optionally via email, never via direct unsupervised messaging. | Must | Child-safety constraint: no private unmoderated messaging between minors. |
| UR-TEAM-014 | An invited Student must explicitly accept or decline a Team invitation; acceptance is not automatic. | Must | Invitations expire after a configurable period (default: 7 days). |
| UR-TEAM-015 | For Students under 16, a Teacher or School Admin must be able to configure the school policy so that all Team join actions require Teacher counter-approval before becoming effective. | Should | Required for schools with strict safeguarding policies. |
| UR-TEAM-016 | Cross-school Team invitations (for inter-school competitions) must be brokered through the competition management interface and approved by the School Admins of both schools. | Must | Prevents unsupervised contact between Students at different schools. |
| UR-TEAM-017 | The system must log all Team invitation events (sent, accepted, declined, expired, revoked) in the audit trail (see Section 16). | Must | |

### Team Profiles and Branding

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-018 | Each Team must have a public-within-tenant profile page showing the Team name, members, school, competition history, RoboPoints total, and shared public projects. | Should | Profile visibility can be restricted to school-only by School Admin. |
| UR-TEAM-019 | The Captain must be able to upload a Team avatar/logo (image file, max 2 MB, content-moderated). | Could | Platform defaults to a generated avatar if none is uploaded. |
| UR-TEAM-020 | The system must allow Teams to earn and display a configurable set of achievement badges on their profile. | Could | Badges are awarded via the Gamification system (see Section 14). |

---

## Individual Participation

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-021 | A Student who is not part of a Team must be able to participate in Competitions that allow individual entries. | Must | The system treats an individual entry as a single-member pseudo-Team for scoring purposes. |
| UR-TEAM-022 | A Competition creator must be able to designate a Competition as Team-only, individual-only, or open (Team or individual). | Must | |
| UR-TEAM-023 | Individual participants must have access to all Challenge materials and submission workflows identically to Team participants. | Must | |

---

## Collaborative Projects in RoboCode Studio

### Real-Time Collaboration

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-024 | Team members must be able to open a shared Team project in RoboCode Studio and edit it concurrently in real time. | Must | Concurrent editing is synchronised via Yjs CRDT over Socket.IO WebSocket; see Technology Stack. |
| UR-TEAM-025 | Each collaborator's cursor position and selected component must be visible to other active collaborators via a distinct colour-coded presence indicator. | Must | Presence indicators show the Student's display name alongside the cursor. |
| UR-TEAM-026 | The system must prevent conflicting simultaneous edits to the same wiring connection or component property through optimistic concurrency resolved by CRDT merge semantics. | Must | Last-write-wins is not acceptable for wiring; structural merge is required. |
| UR-TEAM-027 | The system must maintain a versioned history of collaborative project changes, allowing a Teacher or Captain to roll back to any prior saved state. | Must | Minimum 30 saved versions retained; older snapshots may be pruned by policy. |
| UR-TEAM-028 | A Teacher assigned to a class must be able to join any Team project in that class as a read-only observer or in an annotate-only mode without interfering with Student edits. | Must | |
| UR-TEAM-029 | The system must support asynchronous collaboration: a Team member who is offline can open the last synced state and their changes will merge on reconnection. | Should | Conflict resolution follows the Yjs CRDT model; merge conflicts are surfaced to the Captain for resolution. |
| UR-TEAM-030 | A Student must be able to add inline comments to components or code lines within a shared project; comments are visible to all Team members and the supervising Teacher. | Should | Comments are subject to profanity/PII filtering (see Section 15). |

### Project Sharing and Permissions

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-031 | A Captain must be able to set a Team project as private (Team-only), school-visible, or public (platform-wide). | Must | Public projects are moderated before appearing in the global gallery. |
| UR-TEAM-032 | A Teacher must be able to fork a Team's project for grading or exemplar purposes without modifying the original. | Must | |
| UR-TEAM-033 | Shared projects must clearly identify the contributing authors (Student display names) in the project metadata. | Must | Supports academic integrity and fair-play assessment. |

---

## Competitions and Tournaments

### Competition Creation and Configuration

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-034 | A Teacher must be able to create an intra-school Competition visible only to Students and Teams within their school. | Must | |
| UR-TEAM-035 | A School Admin must be able to create school-level Competitions and open them to inter-school participation by inviting other school tenants on the platform. | Must | Inter-school competitions require Super Admin or Platform Moderator visibility for safety review. |
| UR-TEAM-036 | A Super Admin must be able to create platform-wide Competitions open to all registered Students or all registered school tenants. | Must | |
| UR-TEAM-037 | A Competition creator must be able to configure: name, description, start and end dates, registration deadline, eligibility (grade levels, age ranges, school, or platform-wide), Team or individual mode (UR-TEAM-022), maximum participants/teams, challenge list, scoring weights, judging method, and public or private visibility. | Must | |
| UR-TEAM-038 | A Competition must support multiple sequential rounds (e.g., Qualifier, Semi-Final, Final) each with independent deadlines and challenge sets. | Must | |
| UR-TEAM-039 | The system must enforce registration deadlines; no new Team or individual may register after the deadline has passed unless overridden by the Competition creator. | Must | |
| UR-TEAM-040 | A Competition creator must be able to publish, unpublish, postpone, or cancel a Competition; enrolled participants must be notified of any status change via the notification system. | Must | |

### Challenge Types

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-041 | A Competition must support coding Challenges, where participants write Arduino C/C++ or MicroPython code to fulfil a specification and the submission is evaluated by automated test cases and/or a rubric. | Must | |
| UR-TEAM-042 | A Competition must support robotics simulator build Challenges, where participants construct a circuit on the RoboCode Studio canvas (components, breadboard, wiring) and write supporting code; the full simulator state (JSON schematic + code) is the submission artefact. | Must | |
| UR-TEAM-043 | A Competition must support AI task Challenges, where participants design, integrate, or apply a rule-based or pre-trained AI component within a RoboCode Studio project (e.g., gesture recognition via MPU6050, sensor-fusion logic). | Should | In-browser ML model training is out of scope for v1.0 (Section 1 and UR-NFR-C027); challenges use rule-based or pre-trained models only. AI task judging always requires a human rubric component given interpretive complexity. |
| UR-TEAM-044 | A single Competition may include a mix of Challenge types across its rounds. | Should | |
| UR-TEAM-045 | Each Challenge must have: a title, description, resource links, starter project (optional), required components list, evaluation criteria, maximum score, and per-criterion weighting if rubric-judged. | Must | |

### Submission Workflow

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-046 | A Team (via the Captain) or an individual must be able to submit a Submission before the Challenge deadline. | Must | |
| UR-TEAM-047 | The system must allow multiple draft saves before final submission; only the explicitly submitted version is evaluated. | Must | |
| UR-TEAM-048 | Once a Submission is finalised, the Captain or individual must not be able to modify it unless the Competition creator opens a resubmission window. | Must | Immutability protects fair-play integrity. |
| UR-TEAM-049 | The system must capture the submission timestamp, submitting user ID, Team ID, and a cryptographic hash of the submission artefact in the audit log (see Section 16). | Must | |
| UR-TEAM-050 | The system must confirm receipt of a Submission to the submitting Captain or individual via an in-platform notification and email. | Must | |
| UR-TEAM-051 | Late submissions must be rejected automatically after the deadline unless the Competition creator has configured a grace period. | Must | |

### Judging: Automated Scoring

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-052 | The platform must support automated evaluation of coding Challenges via a test-runner that executes the submitted firmware against a set of hidden test cases inside the RSE and reports a pass/fail score per test case. | Must | Test cases are authored by the Challenge creator and not visible to participants before results are released. |
| UR-TEAM-053 | Automated scoring must complete within a configurable timeout (default: 120 seconds per submission) and report a timeout failure if exceeded. | Must | |
| UR-TEAM-054 | For simulator build Challenges, automated checks must validate that the submitted schematic contains required components, correct wiring topology (as specified in the Challenge), and that the firmware produces expected pin/output states when simulated. | Must | |
| UR-TEAM-055 | The automated score for each Submission must be visible to the submitting Team/individual and to Teachers and judges immediately after the judging run completes, or at a reveal time configured by the Competition creator. | Must | |

### Judging: Rubric-Based (Human) Scoring

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-056 | A Teacher or designated judge must be able to access a judging dashboard that lists all Submissions for their assigned Challenge, ordered by submission time. | Must | |
| UR-TEAM-057 | The judging dashboard must display the full Submission artefact (code, schematic, live simulation replay) alongside the rubric criteria and a numeric or level-based scoring control per criterion. | Must | |
| UR-TEAM-058 | A judge must be able to add written feedback per criterion; feedback is delivered to the Team/individual after scores are published. | Must | Feedback text is retained in the audit log. |
| UR-TEAM-059 | The system must support multiple judges scoring the same Submission independently; final rubric score is the mean (or a configured aggregation) of all judge scores. | Should | Reduces individual judge bias for high-stakes events. |
| UR-TEAM-060 | The Competition creator must be able to set a score-release date; rubric scores and feedback are not visible to participants until that date. | Must | |
| UR-TEAM-061 | Judges must not be able to view scores submitted by other judges for the same Submission until after the score-release date to prevent anchoring bias. | Should | |

### Brackets, Rounds and Leaderboards

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-062 | The Competition creator must be able to configure the bracket format for each round: single-elimination, double-elimination, round-robin, or points-table (no bracket). | Must | |
| UR-TEAM-063 | The system must automatically populate bracket matchups from registered Teams/individuals at the start of each round, based on seeding (prior round scores) or random draw as configured. | Must | |
| UR-TEAM-064 | A participant-facing Competition page must display the current bracket, round schedule, each Team's score, and remaining time until the next deadline. | Must | |
| UR-TEAM-065 | The Competition leaderboard must update in real time (or near-real-time, within 60 seconds) as automated scores are published. | Must | |
| UR-TEAM-066 | The system must support a platform-wide aggregate leaderboard that ranks schools by their cumulative competition performance (RoboPoints earned in competitions) across a configurable period (week/month/term/year). | Should | See also Section 14: Gamification, RoboPoints and Leaderboards. |
| UR-TEAM-067 | Leaderboard entries for minors must not expose full real names or personal identifiers; only the Student's chosen display name and school name are shown. | Must | Data-protection constraint; see also Section 15. |

### Prizes, Awards and RoboPoints

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-068 | Winning Teams and individuals must automatically receive a configured RoboPoints award upon Competition conclusion; the award scales by placement (1st, 2nd, 3rd, participation). | Must | RoboPoints mechanics are defined in Section 14. |
| UR-TEAM-069 | The system must generate a digital certificate (downloadable PDF) for competition winners and finalists; the certificate template is customisable by the Competition creator. | Should | |
| UR-TEAM-070 | Achievement badges earned through Competition wins must appear on the Student's profile and the Team profile. | Should | |

### Fair-Play Rules

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-071 | The system must detect and flag suspiciously similar code submissions (using AST-based similarity analysis) to the Competition creator and assigned Teachers for review. | Must | Flagging is for human review; no automatic disqualification based solely on automated detection. |
| UR-TEAM-072 | A Competition creator or Super Admin must be able to disqualify a Team or individual from a Competition, with a mandatory reason recorded in the audit log. | Must | The affected Student(s) receive a notification; Teacher and School Admin are also notified. |
| UR-TEAM-073 | Submission timestamps must be server-authoritative; client-side clocks are not trusted for deadline enforcement. | Must | |
| UR-TEAM-074 | A Competition creator must be able to define explicit fair-play rules that participants must acknowledge (checkbox + timestamp) at registration. | Must | |
| UR-TEAM-075 | All judging decisions and score adjustments must be recorded in the immutable audit log with the judge's identity and a timestamp. | Must | Supports dispute resolution and appeals. |
| UR-TEAM-076 | A Student or Team must be able to raise a formal appeal against a scoring decision; appeals are routed to the Competition creator and, if unresolved, escalated to a Super Admin or Platform Moderator. | Should | |

---

## Inter-School Competition Safety

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-077 | Inter-school Competition pages must not expose individual Student contact information or personal details to Students from other schools. | Must | Only display names and school names are visible across tenant boundaries. |
| UR-TEAM-078 | Any communication feature on a Competition page (e.g., public discussion board) must be moderated in accordance with Section 15 (Communication, Notifications and Safety). | Must | |
| UR-TEAM-079 | Super Admin or Platform Moderator must review and approve any inter-school Competition before it opens for registration. | Must | Approval is logged with the reviewer identity and timestamp. |

---

## Teacher and Admin Controls

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-080 | A Teacher must be able to view a dashboard of all Teams and individual participants in their class and their competition status, scores, and submission history. | Must | |
| UR-TEAM-081 | A Teacher must be able to add or remove Students from Teams within their class prior to a Competition freeze date. | Must | |
| UR-TEAM-082 | A School Admin must be able to view all active and historic Competitions involving their school's Students, including inter-school events. | Must | |
| UR-TEAM-083 | A School Admin must be able to withdraw their school from an inter-school Competition and receive a confirmation that participant data shared with the Competition will be deleted or anonymised within the platform's data retention policy. | Should | |
| UR-TEAM-084 | A Super Admin must be able to clone an existing Competition as a template for a new one, retaining configuration but clearing participant registrations and submissions. | Should | |

---

## Notifications

| ID | Requirement | Priority | Acceptance / Notes |
|---|---|---|---|
| UR-TEAM-085 | The system must send notifications to relevant roles (Captain, Members, Teacher, School Admin) for: Team invitation sent/accepted/declined, Competition registration open/close, round start/end, submission received, score published, bracket updated, disqualification, appeal status change, and Competition cancelled/postponed. | Must | Notification channels follow Section 15 rules; email and in-platform at minimum. |
| UR-TEAM-086 | Notification frequency must be rate-limited to prevent flooding; a digest option must be available for Teachers and School Admins. | Should | |

---

## MoSCoW Priority Summary

| ID | Requirement Summary | Priority |
|---|---|---|
| UR-TEAM-001 | Student creates a named Team within their school tenant | Must |
| UR-TEAM-002 | Team creator auto-assigned as Captain | Must |
| UR-TEAM-003 | Teacher/School Admin creates Teams on behalf of Students | Must |
| UR-TEAM-004 | Configurable min/max Team size per Competition | Must |
| UR-TEAM-005 | One Team per Student per Competition | Must |
| UR-TEAM-006 | Student in multiple standing Teams up to platform cap | Should |
| UR-TEAM-007 | Exactly one Captain per Team at all times | Must |
| UR-TEAM-008 | Captain invites Students by username or school email | Must |
| UR-TEAM-009 | Captain removes Members (freeze rules apply) | Must |
| UR-TEAM-010 | Captain transfers role to a Member | Should |
| UR-TEAM-011 | Members view profile, projects, standings, Team chat | Must |
| UR-TEAM-012 | Members leave Team voluntarily | Must |
| UR-TEAM-013 | Team invitations via in-platform notifications only | Must |
| UR-TEAM-014 | Invitation requires explicit accept/decline | Must |
| UR-TEAM-015 | Under-16 Team join requires Teacher counter-approval | Should |
| UR-TEAM-016 | Cross-school invites brokered through competition interface | Must |
| UR-TEAM-017 | Audit log for all Team invitation events | Must |
| UR-TEAM-018 | Team public profile page | Should |
| UR-TEAM-019 | Captain uploads Team avatar/logo | Could |
| UR-TEAM-020 | Teams earn achievement badges on profile | Could |
| UR-TEAM-021 | Individual Students participate in open Competitions | Must |
| UR-TEAM-022 | Competition type: Team-only / individual-only / open | Must |
| UR-TEAM-023 | Identical workflow for individual vs. Team participants | Must |
| UR-TEAM-024 | Real-time concurrent editing of shared Team projects | Must |
| UR-TEAM-025 | Colour-coded presence indicators per collaborator | Must |
| UR-TEAM-026 | CRDT merge semantics for wiring conflicts | Must |
| UR-TEAM-027 | Versioned project history with rollback | Must |
| UR-TEAM-028 | Teacher joins Team project as read-only / annotate observer | Must |
| UR-TEAM-029 | Asynchronous offline collaboration with merge-on-reconnect | Should |
| UR-TEAM-030 | Inline comments on components/code in shared projects | Should |
| UR-TEAM-031 | Captain sets project visibility (private/school/public) | Must |
| UR-TEAM-032 | Teacher forks Team project for grading | Must |
| UR-TEAM-033 | Project metadata identifies contributing authors | Must |
| UR-TEAM-034 | Teacher creates intra-school Competition | Must |
| UR-TEAM-035 | School Admin creates inter-school Competition | Must |
| UR-TEAM-036 | Super Admin creates platform-wide Competition | Must |
| UR-TEAM-037 | Full Competition configuration fields | Must |
| UR-TEAM-038 | Multi-round Competitions with independent deadlines | Must |
| UR-TEAM-039 | Registration deadline enforcement | Must |
| UR-TEAM-040 | Competition lifecycle management (publish/postpone/cancel) | Must |
| UR-TEAM-041 | Coding Challenge type | Must |
| UR-TEAM-042 | Robotics simulator build Challenge type | Must |
| UR-TEAM-043 | AI task Challenge type | Should |
| UR-TEAM-044 | Mixed Challenge types within one Competition | Should |
| UR-TEAM-045 | Challenge metadata (title, description, components, criteria) | Must |
| UR-TEAM-046 | Submission by Captain or individual before deadline | Must |
| UR-TEAM-047 | Multiple draft saves; explicit final submission | Must |
| UR-TEAM-048 | Submission immutability after finalisation | Must |
| UR-TEAM-049 | Audit-logged submission with cryptographic hash | Must |
| UR-TEAM-050 | Submission receipt notification | Must |
| UR-TEAM-051 | Automatic rejection of late submissions | Must |
| UR-TEAM-052 | Automated test-runner for coding Challenges | Must |
| UR-TEAM-053 | Automated scoring timeout (default 120 s) | Must |
| UR-TEAM-054 | Automated schematic/wiring validation for build Challenges | Must |
| UR-TEAM-055 | Automated score visibility after judging run | Must |
| UR-TEAM-056 | Judge dashboard with Submission list | Must |
| UR-TEAM-057 | Rubric scoring controls with live simulation replay | Must |
| UR-TEAM-058 | Written feedback per rubric criterion | Must |
| UR-TEAM-059 | Multiple independent judges; score aggregation | Should |
| UR-TEAM-060 | Score-release date configuration | Must |
| UR-TEAM-061 | Judges blind to other judges' scores pre-release | Should |
| UR-TEAM-062 | Bracket format configuration per round | Must |
| UR-TEAM-063 | Auto-populated bracket matchups | Must |
| UR-TEAM-064 | Participant-facing bracket and standings page | Must |
| UR-TEAM-065 | Real-time leaderboard updates (within 60 s) | Must |
| UR-TEAM-066 | Platform-wide school aggregate leaderboard | Should |
| UR-TEAM-067 | Leaderboard shows display names only (no personal data) | Must |
| UR-TEAM-068 | Automatic RoboPoints award by placement | Must |
| UR-TEAM-069 | Digital certificate (PDF) for winners/finalists | Should |
| UR-TEAM-070 | Competition badges on Student and Team profiles | Should |
| UR-TEAM-071 | AST similarity detection for plagiarism flagging | Must |
| UR-TEAM-072 | Competition creator/Super Admin can disqualify with reason | Must |
| UR-TEAM-073 | Server-authoritative submission timestamps | Must |
| UR-TEAM-074 | Explicit fair-play rules acknowledgement at registration | Must |
| UR-TEAM-075 | Immutable audit log for all judging decisions | Must |
| UR-TEAM-076 | Formal appeal mechanism with escalation path | Should |
| UR-TEAM-077 | No personal data exposed across school boundaries | Must |
| UR-TEAM-078 | Competition communication moderated per Section 15 | Must |
| UR-TEAM-079 | Super Admin approves inter-school Competitions | Must |
| UR-TEAM-080 | Teacher dashboard: Teams, submissions, scores | Must |
| UR-TEAM-081 | Teacher adds/removes Students from Teams pre-freeze | Must |
| UR-TEAM-082 | School Admin views all Competitions involving their school | Must |
| UR-TEAM-083 | School Admin withdraws school from inter-school Competition | Should |
| UR-TEAM-084 | Super Admin clones Competition as template | Should |
| UR-TEAM-085 | Notifications for all Team and Competition lifecycle events | Must |
| UR-TEAM-086 | Notification rate-limiting and digest mode | Should |

---

## Competition Lifecycle State Machine

```
+----------------+       publish        +------------+
|    DRAFT       |  ─────────────────>  |  PUBLISHED |
| (creator only) |                      | (visible)  |
+----------------+                      +-----+------+
        ^                                     |
        | unpublish                           | registration opens
        |                                     v
+-------+--------+      postpone       +------------+
|   CANCELLED    |  <───────────────── | REGISTERING|
+----------------+                     +-----+------+
                                             |
                                             | deadline passes
                                             v
                                       +------------+
                                       |  IN PROGRESS|
                                       |  (rounds)   |
                                       +-----+------+
                                             |
                                             | all rounds scored
                                             v
                                       +------------+
                                       |  SCORING   |
                                       | (judging)  |
                                       +-----+------+
                                             |
                                             | scores released
                                             v
                                       +------------+
                                       |  CONCLUDED |
                                       | (archived) |
                                       +------------+
```

---

## Team Collaboration Flow within RoboCode Studio

```
  Captain / Member A                 Platform (Yjs + Socket.IO)        Member B
  ──────────────────                 ───────────────────────────        ──────────
  Opens shared project  ─────────>  Loads CRDT document state  ──────> Receives state
  Edits component        ─────────>  Broadcasts op (CRDT delta)  ──────> Applies op; sees
  (drag, wire, code)                                                     cursor of A
  Saves draft            ─────────>  Persists version snapshot   ──────> Notification: saved
  Submits (Captain only) ─────────>  Locks artefact (immutable)  ──────> Notification: submitted
                                     Audit entry created
  Teacher observer       ─────────>  Read-only / annotate stream ──────> (no edits sent)
```

---

## Cross-References

- **Section 6 (UR-ONB)** — Student signup and approval; parental consent for minors governs Team participation eligibility.
- **Section 5 (Roles and Permissions)** — Role-based access control (RBAC) underpins all Team and Competition permission checks.
- **Section 9 (UR-STU) and Section 10 (UR-SIM)** — RoboCode Studio canvas, component catalogue, wiring model, and simulation experience used in simulator build Challenges.
- **Section 11 (UR-CODE)** — Code editor, Monaco, and language support relevant to coding Challenge submission artefacts.
- **Section 14 (UR-GAM)** — RoboPoints, badges, and leaderboards awarded through Competition outcomes.
- **Section 15 (UR-COMM)** — Moderation, notifications, safeguarding, and child-safe communication rules apply to all Team and Competition interactions.
- **Section 16 (UR-ADM)** — Audit logging, reporting, and admin dashboards that surface Team and Competition data.
- **Section 17 (UC)** — Use cases UC-nnn detailing actor-system interactions for Competition creation, submission, and judging.
- **Section 18 (US)** — User stories with acceptance criteria for key Team and Competition workflows.


# User Requirements: Gamification, RoboPoints and Leaderboards

## Overview

This section specifies the user requirements governing the gamification systems within RoboCode.Africa. Gamification is a central motivational mechanism designed to sustain engagement, reward learning progress, promote healthy competition, and build a sense of community among students at both primary-school and high-school levels. The system operates across three tiers: individual Students, Teams (see _User Requirements: Teams, Competitions and Collaboration_), and Schools (Tenants). All gamification features must comply with the child-safety and data-protection obligations stated in the Project Canon, including COPPA, GDPR-K, POPIA, Zimbabwe Cyber and Data Protection Act, Nigeria NDPR, and Kenya Data Protection Act. Visibility controls and privacy defaults are treated as first-class requirements, not optional add-ons.

The gamification system is composed of the following subsystems:

```
+-----------------------------------------------------------+
|                RoboCode.Africa Gamification               |
|                                                           |
|  +-----------+   +-----------+   +---------------------+ |
|  | RoboPoints|   |  XP /     |   | Badges &            | |
|  | Earning   +-->+ Levels    +-->+ Achievements        | |
|  +-----------+   +-----------+   +---------------------+ |
|        |                                  |               |
|        v                                  v               |
|  +-----------+   +-----------+   +---------------------+ |
|  | Seasons & |   |Leaderboards|  | Rewards &           | |
|  | Resets    +-->+ (Ind/Team/ +->+ Redemption          | |
|  +-----------+   |  School)  |   +---------------------+ |
|                  +-----------+                            |
|        |                |              |                  |
|        v                v              v                  |
|  +------------------+  +------------------------------+  |
|  | Anti-Cheat /     |  | Privacy / Visibility Controls|  |
|  | Fairness Engine  |  | (Minor-Safe Defaults)        |  |
|  +------------------+  +------------------------------+  |
+-----------------------------------------------------------+
```

---

## RoboPoints Earning Rules

RoboPoints are the platform's unified points currency. Every Student account carries a RoboPoints balance that accumulates over time and within Seasons. Points are awarded by the platform automatically on verified completion events and by Teacher/Educator manual awards for qualitative assessment outcomes.

### Earning Sources

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-GAM-001 | The platform shall award RoboPoints to a Student upon verified completion of a coding task assigned by a Teacher. | Must | Points are credited only after the task submission is marked complete or graded by the Teacher. Auto-graded tasks credit immediately on passing test harness. |
| UR-GAM-002 | The platform shall award RoboPoints to a Student upon verified completion of a learning module or course unit (see _User Requirements: Learning, Courses, Tasks and Assessment_, UR-LRN series). | Must | Partial completion awards a proportional fraction defined by the course author. |
| UR-GAM-003 | The platform shall award RoboPoints when a Student successfully saves and runs a RoboCode Studio project that meets the minimum viability criteria (at least one simulated component active, simulation runs without fatal error). | Must | Prevents empty submissions farming points. RSE must confirm a non-trivial simulation state. |
| UR-GAM-004 | The platform shall award bonus RoboPoints for competition placements (1st, 2nd, 3rd and participation tiers) as configured per competition by a Teacher or School Admin. | Must | Participation points are awarded to all entrants; placement bonuses are additional. See _User Requirements: Teams, Competitions and Collaboration_. |
| UR-GAM-005 | The platform shall award Streak Bonus RoboPoints when a Student maintains a daily-login-and-activity streak of 3 or more consecutive days, with escalating bonuses at 7, 14, and 30-day milestones. | Should | Activity must include at least one meaningful action (task submission, project save, quiz answer) per day, not mere login. |
| UR-GAM-006 | The platform shall award First-Attempt Bonus RoboPoints when a Student passes an auto-graded task on the first submission attempt. | Should | Encourages careful, considered work before submission. |
| UR-GAM-007 | The platform shall award Peer-Help RoboPoints when a Student's public forum post or resource is endorsed by a Teacher as helpful (see _User Requirements: Communication, Notifications and Safety_). | Could | Teacher endorsement required; students cannot self-award or peer-award without staff oversight. |
| UR-GAM-008 | A Teacher shall be able to manually award or deduct a configurable number of RoboPoints to/from any Student in their class, with a mandatory reason field, subject to School Admin-defined limits. | Must | Default per-award bound is 1 to 500 RoboPoints; School Admins may tighten (but not raise) this default within tenant policy. All manual adjustments are logged in the audit trail (see UR-ADM series). Deductions must be bounded to prevent negative total balances. |
| UR-GAM-009 | The platform shall publish a School-level point schedule that is visible to Students and Parents/Guardians before any points are earned, ensuring transparency. | Must | Honoring data-minimisation and transparency principles under GDPR-K and age-appropriate design code. |
| UR-GAM-010 | RoboPoints awarded through cheating-detected events shall be revoked automatically and flagged for admin review (see UR-GAM-041 through UR-GAM-046). | Must | Revocation is logged; the Student is notified of the reason. |

### Point Schedule (Reference Values)

The following table provides baseline reference point values. School Admins may configure multipliers (0.5x – 2x) per activity type within their tenant.

| Earning Event | Base RoboPoints | Notes |
|---------------|----------------|-------|
| Task completion (standard) | 50 | Scaled by task difficulty tier (1–5) |
| Task completion (first attempt) | +25 bonus | Added on top of base |
| Project save + simulation run | 10 | Once per project per day |
| Course unit completion | 30 | Proportional for partial |
| Competition participation | 20 | All entrants |
| Competition 3rd place | +100 bonus | Team or individual |
| Competition 2nd place | +200 bonus | Team or individual |
| Competition 1st place | +350 bonus | Team or individual |
| Daily streak (3+ days) | 15/day | While streak is active |
| 7-day streak milestone | +50 bonus | One-off per streak |
| 14-day streak milestone | +100 bonus | One-off per streak |
| 30-day streak milestone | +300 bonus | One-off per streak |
| Teacher peer-help endorsement | 40 | Per endorsed post |
| Manual Teacher award | Configurable | Capped by School Admin policy |

---

## Experience Points (XP) and Levels

RoboPoints and XP are related but distinct. XP accumulates from a subset of earning events and determines a Student's Level within the platform. Levels serve as a persistent rank that does not reset with Seasons.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-GAM-011 | The platform shall maintain a separate Experience Points (XP) tally for each Student, accumulating over the lifetime of the account (never reset). | Must | XP is always increasing; only RoboPoints fluctuate seasonally. |
| UR-GAM-012 | The platform shall map XP to a named Level using a progressive threshold table (e.g., Level 1 Beginner through Level 20 RoboCode Master), visible on the Student profile. | Must | Level name and badge icon are displayed on the Student's profile and within RoboCode Studio. |
| UR-GAM-013 | Levelling up shall trigger an in-platform notification and a visual celebration animation in RoboCode Studio. | Should | Animation must be skippable and must not interrupt an active simulation or code-run. |
| UR-GAM-014 | The Level thresholds table shall be configurable by Super Admin without a code deployment. | Should | Supports gradual balancing post-launch. |
| UR-GAM-015 | The Student's current Level and XP progress toward the next Level shall be visible at all times in the platform navigation header when logged in. | Must | Progress bar with next-level XP requirement clearly shown. |

### Level Reference Table

| Level | Name | Cumulative XP Required |
|-------|------|------------------------|
| 1 | Circuit Beginner | 0 |
| 2 | Wire Connector | 200 |
| 3 | LED Tinkerer | 500 |
| 4 | Breadboard Builder | 900 |
| 5 | Sensor Scout | 1,400 |
| 6 | Code Cadet | 2,000 |
| 7 | Signal Sender | 2,800 |
| 8 | Loop Master | 3,800 |
| 9 | Firmware Pioneer | 5,000 |
| 10 | Microcontroller Pro | 6,500 |
| 11–15 | (Intermediate tiers) | +2,000 per level |
| 16–19 | (Advanced tiers) | +4,000 per level |
| 20 | RoboCode Master | 40,000 |

---

## Badges and Achievements

Badges are discrete, named awards for specific milestone events or accomplishments. They are displayed on the Student profile and may be shared (subject to privacy controls).

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-GAM-016 | The platform shall award Badges to Students upon meeting predefined achievement conditions, with the Badge name, icon, and description visible on the Student's profile. | Must | Badge conditions are evaluated automatically by the platform in real time. |
| UR-GAM-017 | The platform shall provide at minimum the following Badge categories: Skill Badges (component/sensor mastery), Consistency Badges (streaks), Competition Badges (placement), Collaboration Badges (team activities), Milestone Badges (level, XP, projects completed), and Special/Event Badges (seasonal, teacher-awarded). | Must | Super Admin may create additional global badge types; School Admin may create tenant-specific badges. |
| UR-GAM-018 | A Student shall be able to view all available Badges (earned and unearned), with a locked-state icon and a progress indicator for partially-met conditions, to enable discovery and motivation. | Must | Unearned badges show the earning condition description, not hidden, per age-appropriate design principles. |
| UR-GAM-019 | Badge awards shall generate a platform notification to the Student (see _User Requirements: Communication, Notifications and Safety_, UR-COMM series). | Should | Notification must not include personal information about other students. |
| UR-GAM-020 | A Teacher shall be able to award a Special Badge (from a school-defined library) to any Student in their class, with a custom message, subject to content moderation filters. | Should | Special Badge awards are logged. Custom message is filtered for PII and profanity before display. |
| UR-GAM-021 | Badges earned on the platform shall not be automatically shared to any external social network or third-party service without explicit, informed consent from the student (and parent/guardian for minors). | Must | No share-to-social widget active for users under 16. Consent UI required for 16+ before any external share. |
| UR-GAM-022 | The platform shall prevent duplicate Badge awards for the same achievement event. | Must | Idempotent award logic: re-triggering the same event does not re-grant the badge. |

### Sample Badge Catalogue

| Badge Name | Category | Earning Condition |
|------------|----------|-------------------|
| Hello LED | Skill | Simulate first LED circuit in RoboCode Studio |
| Sensor Explorer | Skill | Use 5 distinct sensor types in projects |
| Breadboard Wizard | Skill | Complete 10 breadboard wiring tasks correctly |
| 7-Day Streak | Consistency | Maintain 7-day activity streak |
| 30-Day Streak | Consistency | Maintain 30-day activity streak |
| Podium Finisher | Competition | Earn 1st, 2nd or 3rd in any competition |
| Team Player | Collaboration | Complete 3 team projects |
| Century Builder | Milestone | Complete 100 RoboPoints-earning events |
| Level 10 Achiever | Milestone | Reach Level 10 |
| Season Champion | Special/Event | Top of school leaderboard at season close |
| Most Improved | Special/Event | Teacher-awarded; highest XP gain in a term |

---

## Leaderboards

Leaderboards provide visible ranking of Students, Teams, and Schools. They are designed to motivate constructive competition while respecting the privacy and wellbeing of minor users.

### Leaderboard Scope and Tiers

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-GAM-023 | The platform shall provide Individual Leaderboards at the following scopes: (a) within-class, (b) within-school (tenant), (c) global (across all tenants). | Must | Students are shown in the leaderboard by display name; real names are not required for global scope. |
| UR-GAM-024 | The platform shall provide Team Leaderboards at: (a) within-school and (b) global scope (see _User Requirements: Teams, Competitions and Collaboration_). | Must | Team score is the aggregate of member RoboPoints over the season. |
| UR-GAM-025 | The platform shall provide a School (Tenant) Leaderboard visible to Super Admin and optionally to School Admin, comparing aggregate school statistics (average student RoboPoints, task completion rate, active student count). | Should | School names are shown on the global school leaderboard. Individual student data is never exposed on cross-tenant views. |
| UR-GAM-026 | Each leaderboard shall support both a Weekly view (points earned in the current 7-day window) and an All-Time view (cumulative since account creation or season start). | Must | Weekly resets occur at midnight UTC on the configured day (default: Monday). |
| UR-GAM-027 | Leaderboards shall be filterable by class (for Teachers), by grade/age-band, and by active season. | Should | Reduces information overload for schools with many classes. |
| UR-GAM-028 | A Student's position in the leaderboard shall be shown even when they do not appear in the top N visible rows (e.g., "You are ranked 42nd"). | Must | Inclusive design: avoids excluding or demotivating lower-ranked students. |
| UR-GAM-029 | A School Admin shall be able to disable the global individual leaderboard for their school's students, limiting visibility to within-school rankings only. | Must | Privacy control required by GDPR-K and age-appropriate design code — schools must have opt-out control. |
| UR-GAM-030 | A Parent/Guardian shall be able to view their child's leaderboard position within their school but shall not be able to view the positions or scores of other students by name. | Must | Protects other minors' data per COPPA and GDPR-K. |

### Leaderboard Display Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-GAM-031 | The leaderboard shall display at minimum: rank position, display name, Level icon, RoboPoints total, and XP total for the selected scope and time window. | Must | No real name, school name, or location visible on global leaderboard without School Admin opt-in. |
| UR-GAM-032 | The leaderboard shall refresh at least every 5 minutes when viewed live, with a visible last-updated timestamp. | Should | Near-real-time updates are motivating; exact real-time is Could priority. |
| UR-GAM-033 | Ties in leaderboard ranking shall be broken first by XP, then by most recent point-earning event timestamp. | Must | Tie-breaking logic is documented in-platform and disclosed to students. |

---

## Seasons and Resets

Seasons provide periodic fresh starts, sustaining long-term engagement and preventing early adopters from permanently dominating leaderboards.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-GAM-034 | The platform shall support configurable Seasons, each with a defined start date, end date, and an optional theme name. | Must | Super Admin defines global seasons; School Admins may define additional tenant seasons within a global season. |
| UR-GAM-035 | At Season end, each Student's seasonal RoboPoints balance shall be archived (not deleted) and the seasonal leaderboard snapshot shall be preserved for retrospective viewing for at least 2 years. | Must | Students can view their past season performance. Archive satisfies audit/data-retention obligations. |
| UR-GAM-036 | At Season start, the active RoboPoints balance used for leaderboard ranking shall reset to zero; XP and Levels shall never reset. | Must | Clearly communicates to students that effort is always retained (XP/Level) while competition is refreshed (RoboPoints). |
| UR-GAM-037 | Students shall receive an in-platform notification at least 7 days before Season end, with a summary of their current standings and badges earned in the season. | Should | Motivates a final push and manages expectations for the reset. |
| UR-GAM-038 | Badges and achievements earned in a Season shall be permanently retained on the student profile regardless of resets. | Must | Consistent with XP/Level retention philosophy. |
| UR-GAM-039 | Super Admin shall be able to define Season-specific leaderboard themes, bonus-point event multipliers, and limited-time Badges that are only available during that Season. | Should | Seasonal novelty sustains re-engagement. |
| UR-GAM-040 | School Admins shall receive a Season Summary Report for their school at season close, showing aggregate statistics without revealing individual student data to parents or unapproved third parties. | Should | Report generated automatically; see _User Requirements: Administration and Reporting_. |

---

## Anti-Cheating and Fairness

Maintaining the integrity of the gamification system is essential to its motivational value and to safeguarding fairness for all students.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-GAM-041 | The platform shall detect and suppress rapid-repeat event submissions that exceed statistical norms for the activity type, flagging them as potential gaming attempts. | Must | Rate-limiting per event type per student per hour; configurable thresholds by Super Admin. |
| UR-GAM-042 | The platform shall detect copy-paste plagiarism in code submissions by comparing against a configurable similarity threshold across the tenant's student submissions, and flag matches for Teacher review. | Must | Flagged submissions earn zero points pending Teacher review; the Student is informed the submission is under review. |
| UR-GAM-043 | The platform shall require that RoboCode Studio simulation run events originate from a genuine simulation session (RSE heartbeat token), preventing direct API calls that spoof simulation completion. | Must | Prevents scripted point farming via API manipulation. |
| UR-GAM-044 | Teachers and School Admins shall receive an Anti-Cheat Alerts dashboard showing flagged submissions and unusual point-earning patterns within their scope. | Must | Alerts include suggested action (review, revoke, dismiss). No false-positive auto-revoke without Teacher/Admin confirmation. |
| UR-GAM-045 | Super Admin and Platform Moderators shall have a global Anti-Cheat view showing cross-tenant anomalies and coordinated gaming patterns. | Must | Necessary for platform integrity; distinct from per-school views. |
| UR-GAM-046 | All anti-cheat decisions (flag, revoke, dismiss) shall be logged in the audit trail with the actor identity, timestamp, and justification (see _User Requirements: Administration and Reporting_, UR-ADM series). | Must | Audit log entries are immutable and retained per the authoritative retention schedule in Section 15 (UR-COMM-063): standard platform audit log minimum 12 months. |

---

## Rewards

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-GAM-047 | The platform shall support a Rewards Catalogue where RoboPoints can be redeemed for non-monetary in-platform rewards (e.g., profile themes, avatar items, Studio colour schemes, badge frames). | Should | No real-money or real-goods redemption in v1. Avoids regulatory complications in multi-jurisdiction Africa deployment. |
| UR-GAM-048 | Reward redemption shall deduct the corresponding RoboPoints from the Student's seasonal balance; XP is unaffected. | Must | Students must be clearly informed that redemption reduces their leaderboard-competing balance. |
| UR-GAM-049 | A Teacher or School Admin shall be able to define school-specific reward items (e.g., early-access to a new lesson, a digital certificate) with configurable RoboPoints costs. | Could | Extends the reward system without requiring platform-level changes. |
| UR-GAM-050 | All reward items must be age-appropriate and must not include any advertising, brand sponsorship, or external commercial links visible to minor students without verifiable parental consent. | Must | Compliance with age-appropriate design code, COPPA, and GDPR-K. |

---

## Privacy and Visibility Controls for Minors

Privacy is a design requirement, not an afterthought. The following requirements reflect age-appropriate design code principles, GDPR-K, COPPA, and the multi-jurisdiction data protection obligations specified in the Project Canon.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-GAM-051 | The default visibility of a Student's leaderboard profile shall be limited to within-school (tenant) scope until a School Admin explicitly opts the school into global leaderboard participation. | Must | Privacy-by-default for minors. Global participation requires School Admin action, not student action. |
| UR-GAM-052 | Students aged under 13 (COPPA) or under 16 (GDPR-K) shall have their real name replaced with their display name (chosen at signup, reviewed for appropriateness) on all leaderboards and badge displays. | Must | Real name is never exposed on leaderboards. Display name must pass content-moderation filter at creation. |
| UR-GAM-053 | A Parent/Guardian shall be able to opt their child out of all leaderboards (school and global) via the Parent/Guardian account settings, and this preference must be respected immediately across all views. | Must | Opt-out persists across Season resets. Re-opt-in requires parent/guardian action. |
| UR-GAM-054 | The platform shall not use gamification data (RoboPoints, badges, level, leaderboard position) for targeted advertising, profiling, or any commercial purpose beyond the educational experience. | Must | Absolute prohibition; applies to all student age groups. |
| UR-GAM-055 | Students shall be able to view who can see their gamification data through a simple "Who can see this?" control on their profile, appropriate for their age and reading level. | Must | Age-appropriate transparency requirement from the age-appropriate design code. |
| UR-GAM-056 | Super Admin shall be able to define platform-wide minimum age thresholds above which certain gamification features (e.g., global leaderboard, public badge sharing) become available, enforced by date-of-birth verification at account level. | Should | Enables jurisdiction-specific tuning without code changes. |
| UR-GAM-057 | All gamification data for a Student whose account is deleted or whose parent/guardian withdraws consent shall be anonymised or deleted within 30 days, with leaderboard historical entries replaced by "Deleted User." | Must | Right to erasure under GDPR Art. 17; COPPA deletion obligations. Historical season archives retain anonymised placeholders for statistical integrity. |

---

## MoSCoW Priority Summary

| ID | Requirement Summary | Priority |
|----|---------------------|----------|
| UR-GAM-001 | Award points on task completion | Must |
| UR-GAM-002 | Award points on course unit completion | Must |
| UR-GAM-003 | Award points on project save + simulation run | Must |
| UR-GAM-004 | Award competition placement points | Must |
| UR-GAM-005 | Streak Bonus RoboPoints with milestones | Should |
| UR-GAM-006 | First-Attempt Bonus | Should |
| UR-GAM-007 | Peer-Help points via Teacher endorsement | Could |
| UR-GAM-008 | Teacher manual point awards and deductions | Must |
| UR-GAM-009 | Published, transparent point schedule | Must |
| UR-GAM-010 | Revoke cheating-detected points | Must |
| UR-GAM-011 | Lifetime XP tally (never reset) | Must |
| UR-GAM-012 | XP-to-Level mapping with named tiers | Must |
| UR-GAM-013 | Level-up notification and animation | Should |
| UR-GAM-014 | Configurable Level thresholds by Super Admin | Should |
| UR-GAM-015 | Level and XP progress in navigation header | Must |
| UR-GAM-016 | Badge awards on achievement conditions | Must |
| UR-GAM-017 | Minimum badge category coverage | Must |
| UR-GAM-018 | View all badges (earned and unearned) with progress | Must |
| UR-GAM-019 | Notification on badge award | Should |
| UR-GAM-020 | Teacher Special Badge award | Should |
| UR-GAM-021 | No external badge sharing for minors without consent | Must |
| UR-GAM-022 | No duplicate badge awards | Must |
| UR-GAM-023 | Individual leaderboards (class / school / global) | Must |
| UR-GAM-024 | Team leaderboards (school / global) | Must |
| UR-GAM-025 | School aggregate leaderboard | Should |
| UR-GAM-026 | Weekly and All-Time leaderboard views | Must |
| UR-GAM-027 | Leaderboard filters (class, grade, season) | Should |
| UR-GAM-028 | Student's own rank shown outside top N | Must |
| UR-GAM-029 | School Admin opt-out from global individual leaderboard | Must |
| UR-GAM-030 | Parent/Guardian restricted leaderboard view | Must |
| UR-GAM-031 | Leaderboard display fields | Must |
| UR-GAM-032 | Leaderboard refresh every 5 minutes | Should |
| UR-GAM-033 | Tie-breaking by XP then timestamp | Must |
| UR-GAM-034 | Configurable Seasons with dates and themes | Must |
| UR-GAM-035 | Archive seasonal RoboPoints and snapshot | Must |
| UR-GAM-036 | Seasonal RoboPoints reset; XP/Level never reset | Must |
| UR-GAM-037 | 7-day pre-season-end student notification | Should |
| UR-GAM-038 | Permanent retention of badges regardless of resets | Must |
| UR-GAM-039 | Season-specific themes, multipliers, and badges | Should |
| UR-GAM-040 | Season Summary Report for School Admin | Should |
| UR-GAM-041 | Rapid-repeat event detection (rate limiting) | Must |
| UR-GAM-042 | Code plagiarism detection with Teacher review | Must |
| UR-GAM-043 | Simulation run events require genuine RSE session | Must |
| UR-GAM-044 | Anti-Cheat Alerts dashboard for Teachers and Admins | Must |
| UR-GAM-045 | Global Anti-Cheat view for Super Admin | Must |
| UR-GAM-046 | Audit logging of all anti-cheat decisions | Must |
| UR-GAM-047 | In-platform Rewards Catalogue (cosmetic only) | Should |
| UR-GAM-048 | Reward redemption deducts RoboPoints (not XP) | Must |
| UR-GAM-049 | School-specific custom reward items | Could |
| UR-GAM-050 | Age-appropriate, advertising-free rewards | Must |
| UR-GAM-051 | Default leaderboard visibility within-school | Must |
| UR-GAM-052 | Display name only (no real name) on leaderboards | Must |
| UR-GAM-053 | Parent/Guardian opt-out from all leaderboards | Must |
| UR-GAM-054 | No commercial use of gamification data | Must |
| UR-GAM-055 | "Who can see this?" transparency control | Must |
| UR-GAM-056 | Configurable age thresholds for feature access | Should |
| UR-GAM-057 | Gamification data erasure on account deletion | Must |

---

## Cross-References

- _User Requirements: Onboarding, Signup and Approval_ — UR-ONB series: Student account creation and parental consent process that underpins age-gating for gamification features.
- _User Requirements: Authentication and Account Management_ — UR-AUTH series: Parent/Guardian account linking required for consent-based leaderboard opt-in/opt-out (UR-GAM-053).
- _User Requirements: School Onboarding, Custom Domain and White-Labelling_ — UR-SCH series: Tenant isolation that bounds school-scoped leaderboards (UR-GAM-023, UR-GAM-024, UR-GAM-029).
- _User Requirements: Learning, Courses, Tasks and Assessment_ — UR-LRN series: Task and course completion events that trigger RoboPoints and XP (UR-GAM-001, UR-GAM-002).
- _User Requirements: Teams, Competitions and Collaboration_ — UR-TEAM series: Team formation, competition structure, and competition-placement point awards (UR-GAM-004, UR-GAM-024).
- _User Requirements: Communication, Notifications and Safety_ — UR-COMM series: Notification delivery for badge awards, streak milestones, season-end alerts, and anti-cheat decisions.
- _User Requirements: Administration and Reporting_ — UR-ADM series: Audit logging, season summary reports, and anti-cheat alert dashboards.
- _User Requirements: RoboCode Studio Canvas, Components and Wiring_ and _User Requirements: Simulation Experience_ — UR-SIM series: RSE session token used to validate simulation-run point events (UR-GAM-043).


# User Requirements: Communication, Notifications and Safety

## Overview

This section defines all user requirements governing communication between platform participants, the notification system, and — above all — the safety of children who use RoboCode.Africa. Safety is the prime directive of this section and overrides every convenience or engagement objective. Requirements that protect minors are non-negotiable Must items; no commercial or pedagogical rationale supersedes them.

The scope covers:

- Moderated in-platform communication (class announcements, teacher-to-student messaging, team channels, project comments)
- Notifications (in-app, email, optional SMS)
- Content moderation infrastructure (profanity filter, PII detection, moderation queues)
- Abuse reporting and flagging
- Safeguarding escalation pathways
- Audit logging and evidence preservation
- Compliance with the child-safety legal set (COPPA, GDPR-K, Zimbabwe CDPA, POPIA, NDPR, Kenya DPA)

All requirement identifiers in this section use the prefix **UR-COMM**. Cross-references to the System Specification Document use **FR-COMM**, **SR-nnn**, and **DR-nnn** prefixes. Related requirements in adjacent sections are cross-referenced by name and ID.

---

## Safety-First Prime Directive

> **No unsupervised private messaging between minors is permitted on RoboCode.Africa under any circumstances.** Every communication channel that can reach a Student is either teacher/admin-overseen or does not exist. This constraint is permanent and architectural, not configurable.

The following principles flow from this directive and are binding on all design, engineering, and operational decisions in this section:

1. **Supervised channels only.** Direct peer-to-peer messaging between students is not available. All channels route through, or are visible to, the responsible Teacher or School Admin.
2. **Default-safe.** Every communication feature defaults to the most restrictive safe setting. Relaxation requires explicit opt-in by a Teacher or School Admin and is bounded by platform policy.
3. **Transparent to guardians.** The existence, scope, and moderation of every communication channel is disclosed in the platform Privacy Notice. Significant safeguarding events trigger Parent/Guardian notification.
4. **Content moderated before persistence.** All user-generated text passes through automated screening before storage or display to others. Flagged content is held in a moderation queue.
5. **Full audit trail.** Every communication event, moderation action, escalation, and safeguarding decision is logged with tamper-evident timestamps and actor identities.
6. **Legal compliance.** All channels comply with COPPA, GDPR-K, the Zimbabwe CDPA, South Africa POPIA, Nigeria NDPR, and the Kenya DPA. Data minimisation applies; only data necessary to deliver and moderate the channel is collected.

---

## Communication Channels

RoboCode.Africa provides a structured, layered set of communication channels. The following ASCII diagram illustrates the channel hierarchy and the oversight relationships.

```
+---------------------------------------------------------------+
|               RoboCode.Africa Communication Model             |
+---------------------------------------------------------------+
|                                                               |
|  LAYER 1 — PLATFORM-WIDE (Super Admin / Platform Moderator)  |
|  +---------------------------------------------------------+  |
|  |  Platform Announcements  (read-only broadcast)          |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  LAYER 2 — SCHOOL / TENANT (School Admin → Teachers)         |
|  +---------------------------------------------------------+  |
|  |  School Announcements    (School Admin broadcasts)      |  |
|  |  Teacher Notifications   (admin → individual teacher)  |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  LAYER 3 — CLASS (Teacher → Students, fully overseen)        |
|  +---------------------------------------------------------+  |
|  |  Class Announcements     (teacher broadcasts)           |  |
|  |  Task / Assignment Feed  (teacher posts, system events) |  |
|  |  Teacher ↔ Student DM    (1:1, teacher-initiated only)  |  |
|  |  Project Comments        (on a submitted project/task)  |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  LAYER 4 — TEAM (supervised team channel)                    |
|  +---------------------------------------------------------+  |
|  |  Team Channel            (members + supervising teacher)|  |
|  |  Team Project Comments   (on shared project artefacts)  |  |
|  +---------------------------------------------------------+  |
|                                                               |
|  CROSS-CUTTING                                                |
|  +---------------------------------------------------------+  |
|  |  Abuse / Safety Reports  (any user → moderation queue)  |  |
|  |  Safeguarding Escalation (teacher/mod → admin/external) |  |
|  +---------------------------------------------------------+  |
+---------------------------------------------------------------+
```

### What Is Explicitly Not Permitted

The following channel types are architecturally excluded and must not be implemented:

- Student-to-student direct messaging (any form, any age group)
- Anonymous public forums or global chat rooms involving students
- Social media-style open comment feeds visible to the general public
- Third-party chat embeds (e.g., Discord, WhatsApp) linked from within the authenticated platform

---

## Requirements: Moderated Communication

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-COMM-001 | The platform shall provide a Class Announcements channel per class, through which a Teacher may broadcast read-only messages to all enrolled Students. | Must | Students cannot reply directly to a class announcement; the teacher controls the discussion. |
| UR-COMM-002 | The platform shall provide a Task / Assignment Feed per class, automatically publishing system-generated events (task assigned, deadline changed, task graded) alongside optional teacher commentary. | Must | Events are generated by the LRN module. Feed is read-only for Students. |
| UR-COMM-003 | The platform shall allow a Teacher to send a one-to-one message to an individual Student (Teacher-initiated DM). Students may reply to the Teacher only, within that thread. | Must | Students cannot initiate a DM to a Teacher. The Teacher-DM thread is visible to the School Admin. Messages pass through content moderation before delivery. |
| UR-COMM-004 | The platform shall provide a Team Channel per team, visible to all team members and to the supervising Teacher(s) and School Admin. Students may post within the team channel. | Must | The Team Channel is not visible to students outside the team or to the public. Teacher and School Admin have read-only access by default; they may post as moderators. Content passes through automated screening. |
| UR-COMM-005 | The platform shall provide a Project Comments thread on each submitted project or task artefact, allowing the Teacher to post feedback and the Student author (or team) to respond. | Must | Comment threads are scoped to the project artefact. Other students in the class may not read or post to another student's project comments unless the teacher explicitly makes a project public within the class for peer review. |
| UR-COMM-006 | The platform shall allow a School Admin to broadcast a School Announcement to all Teachers and/or Students in the school. | Must | School Announcements are read-only for recipients. Students cannot reply to a School Announcement. |
| UR-COMM-007 | The platform shall allow a Super Admin or Platform Moderator to broadcast a Platform Announcement to all authenticated users, or to a scoped subset (e.g., all School Admins, all Teachers). | Must | Platform Announcements are read-only for recipients. Used for maintenance notices, policy updates, and critical safety communications. |
| UR-COMM-008 | The platform shall not provide any direct student-to-student messaging capability, including but not limited to: 1:1 DMs, group chats not overseen by a Teacher, anonymous posting, and reaction threads that can identify peer identities to other students. | Must | This is a hard architectural constraint enforced at the API layer. Attempts to circumvent (e.g., encoding messages in project names) shall be detectable via the content moderation pipeline. |
| UR-COMM-009 | The platform shall make all Teacher ↔ Student DM threads and Team Channel history accessible in read-only view to the School Admin for safeguarding review at any time, without prior notice to participants. | Must | Disclosed in the platform Terms of Service and Privacy Notice. |
| UR-COMM-010 | The platform shall retain all communication content, including deleted messages, in an immutable audit log for a minimum of 12 months, accessible only to Super Admin and authorised safeguarding roles. | Must | Deletion by a user marks the message hidden in the UI but does not remove it from the audit log. See UR-COMM-057. |
| UR-COMM-011 | A Teacher shall be able to mute or remove a specific Student from a Team Channel, with the action logged and visible to the School Admin. | Must | Mute/remove is reversible. The Teacher may also escalate the underlying conduct to the School Admin via the safeguarding workflow (UR-COMM-045). |
| UR-COMM-012 | The platform shall support optional peer-review of projects within a class, where the Teacher explicitly enables Students to view and comment on one another's published project artefacts. Peer-review comments are visible to the Teacher and School Admin. | Could | Only available when explicitly activated by a Teacher per task/assignment. Student anonymity option within peer review should be supported to reduce social pressure. |

---

## Requirements: Notifications

### Notification Delivery Channels

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-COMM-013 | The platform shall deliver in-app notifications within the authenticated UI for all system events relevant to the receiving user. | Must | In-app notifications must be visible within 5 seconds of the triggering event during normal platform operation (see Section 20: Non-Functional User Expectations). |
| UR-COMM-014 | The platform shall send email notifications for critical events, including: account activation, password reset, parental consent requests, safeguarding escalation confirmations, assignment deadlines (configurable lead time), and system-wide announcements. | Must | Transactional email is delivered via SES/SendGrid. Email templates must be plain-language, mobile-optimised, and WCAG 2.2 AA accessible. |
| UR-COMM-015 | The platform shall support optional SMS notification as a delivery channel for time-critical events (e.g., safeguarding alerts, account approval) in low-connectivity contexts. | Should | SMS is an opt-in supplement, not a replacement for email. Delivery via an Africa-suitable SMS gateway. Consent for SMS must be captured separately from general account consent. |
| UR-COMM-016 | Users shall be able to configure their notification preferences (channel and frequency) for each notification category from within their account settings, subject to mandatory notifications that cannot be disabled. | Must | Mandatory (non-configurable) notifications include: parental consent requests, safeguarding alerts, account security events (login from new device, password changed, MFA change), and platform-wide critical notices. |
| UR-COMM-017 | The platform shall support notification digest mode, allowing daily or weekly digest emails to replace individual-event emails for lower-priority notification categories (e.g., RoboPoints earned, new task available). | Should | Digest cadence is user-configurable. Critical and safety notifications are always sent immediately regardless of digest settings. |

### Notification Events by Role

The following table lists the principal notification events and the roles that receive them.

| Event | Super Admin | Platform Mod | School Admin | Teacher | Student | Parent / Guardian |
|-------|-------------|--------------|--------------|---------|---------|-------------------|
| New student signup (direct domain) | Yes | Yes | — | — | — | — |
| New student signup (school domain) | — | — | Yes | — | — | — |
| Parental consent request sent/responded | — | — | Yes | — | — | Yes |
| Student account approved / rejected | — | — | — | — | Yes | Yes |
| Task assigned / deadline | — | — | — | — | Yes | — |
| Task graded | — | — | — | — | Yes | — |
| Abuse report submitted | Yes | Yes | Yes | Yes | — | — |
| Safeguarding escalation | Yes | Yes | Yes | Yes | — | Yes (if involves their child) |
| Content moderation queue item | — | Yes | Yes (school-scoped) | — | — | — |
| RoboPoints milestone | — | — | — | — | Yes | Could |
| New class announcement | — | — | — | — | Yes | — |
| Account security event | — | — | — | Yes | Yes | — |
| Subscription/billing event | Yes | — | Yes | — | — | — |
| Platform maintenance notice | Yes | Yes | Yes | Yes | Yes | — |

> Note: "Could" in the Parent/Guardian column for RoboPoints milestone indicates an optional progress summary feature that is Could-priority for v1.0.

---

## Requirements: Content Moderation

Content moderation is a mandatory, always-on layer that applies to all user-generated text before it is stored or displayed to another user.

```
+------------------------------------------+
|       Content Moderation Pipeline         |
+------------------------------------------+
|                                          |
|  User submits text (message / comment /  |
|  project name / code comment)            |
|          |                               |
|          v                               |
|  [1] Profanity / Hate-Speech Filter      |
|      (configurable word-list + ML        |
|       classifier)                        |
|          |                               |
|  [2] PII Detection                       |
|      (email, phone, address, ID number   |
|       pattern matching + NER model)      |
|          |                               |
|  [3] Grooming / Solicitation Signals     |
|      (keyword pattern + ML classifier)  |
|          |                               |
|  Result: CLEAN | FLAG | BLOCK            |
|          |                               |
|  CLEAN ---> Stored and displayed         |
|  FLAG  ---> Held + queued for moderator  |
|             review; user sees "pending"  |
|  BLOCK ---> Rejected; user sees error;   |
|             incident logged; reporter    |
|             notified                     |
+------------------------------------------+
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-COMM-018 | All user-generated text submitted through any platform communication channel shall pass through the automated content moderation pipeline before being stored or displayed to any other user. | Must | The pipeline must complete screening within 2 seconds for messages up to 2 000 characters. |
| UR-COMM-019 | The content moderation pipeline shall include a configurable profanity and hate-speech filter driven by a curated word list plus an ML-based classifier. The word list shall be maintainable by the Super Admin and Platform Moderator without a code deployment. | Must | The default word list must include English profanity and common slang; School Admins may add school-specific terms to the school-scoped list. |
| UR-COMM-020 | The content moderation pipeline shall include PII detection covering at minimum: email addresses, phone numbers, home addresses, national identification numbers, and URLs that appear to be off-platform contact details. | Must | Detected PII in messages from or to minors must result in BLOCK status. Detected PII in messages between adults may result in FLAG status with moderator review. |
| UR-COMM-021 | The content moderation pipeline shall include a pattern-matching and ML-based grooming / solicitation signal detector that flags messages containing known grooming patterns or attempts to move conversation to off-platform channels. | Must | Any positive detection involving a minor participant shall result in immediate BLOCK and automatic escalation to the safeguarding queue (see UR-COMM-044). |
| UR-COMM-022 | Content that results in BLOCK status shall be rejected before storage. The submitting user shall see a non-specific error message ("Your message could not be sent") without revealing the specific filter rule triggered. The incident shall be logged with full content, timestamp, and actor identity in the audit log. | Must | Non-specific error message is intentional to prevent adversarial filter circumvention. The full content is retained in the audit log, not displayed to other users. |
| UR-COMM-023 | Content that results in FLAG status shall be held in a moderation queue, invisible to the intended recipient until a moderator approves it. The submitter shall see a "message pending review" status. | Must | Moderation queues are visible to Platform Moderators (all queues) and School Admins (school-scoped queue). Target review time is within 4 business hours. |
| UR-COMM-024 | A Platform Moderator or School Admin (within their scope) shall be able to: approve a flagged item (making it visible to the recipient), reject it (blocking permanently, logging, and optionally notifying the Teacher), or escalate it to the safeguarding workflow. | Must | All moderation decisions are logged with the moderator's identity, timestamp, and decision rationale. |
| UR-COMM-025 | The Super Admin shall be able to view aggregate content moderation statistics (items processed, flagged rate, block rate, average review time) in the admin dashboard, filterable by school, time range, and content type. | Must | Statistics must update at most every 5 minutes. |
| UR-COMM-026 | The content moderation pipeline shall be applied not only to chat messages but also to: project titles and descriptions, code comments and string literals visible in submissions, team and project names, user-controlled display names, and AI Hint Assistant prompts and responses (see Section 11, UR-CODE-101). | Should | Code comments and string literals are lower-risk but still scanned; false-positive rate must be acceptable for typical teaching code (e.g., `// turn on LED`). AI Hint prompts/responses are screened before display to the Student. |
| UR-COMM-027 | School Admins shall be able to view the school-scoped moderation queue and take moderation decisions on items originating within their school. They shall not be able to access moderation data from other schools. | Must | Multi-tenant data isolation enforced via Postgres RLS (see Section 8: User Requirements: School Onboarding, Custom Domain and White-Labelling). |
| UR-COMM-028 | The platform shall support bulk moderation actions (approve all, reject all within a filter) for Platform Moderators managing high-volume queues. | Should | Bulk actions require a confirmation step and are audit-logged at the individual item level. |

---

## Requirements: Abuse Reporting and Flagging

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-COMM-029 | Any authenticated user shall be able to report any piece of content or any user account as abusive, inappropriate, or concerning, using a one-tap/one-click Report function accessible on every message, comment, and user profile. | Must | The report function must be visible without requiring additional navigation. It must be accessible and labelled clearly (not hidden behind a menu if practical). |
| UR-COMM-030 | The abuse report form shall allow the reporter to select a category (e.g., Inappropriate content, Harassment, Grooming concern, Spam, Other) and optionally provide a free-text description of up to 500 characters. | Must | Submission of a report shall be confirmed to the reporter with a reference number. Reporter identity is kept confidential from the reported party. |
| UR-COMM-031 | Submitted abuse reports shall be routed to the appropriate moderation queue: reports originating within a school are routed to the School Admin's queue first and to the Platform Moderator's queue; platform-level reports are routed to the Platform Moderator's queue. Safeguarding-category reports are simultaneously escalated to the safeguarding workflow (UR-COMM-044). | Must | Routing logic must be deterministic and audited. A report must appear in a queue within 60 seconds of submission. |
| UR-COMM-032 | A moderator actioning an abuse report shall have access to: the reported content in full, the reporting user's identity (confidential from others), the reported user's account details and prior moderation history, and the surrounding message context (up to 50 messages before and after in the same channel). | Must | Context window is configurable by Super Admin. Moderator access to this extended context is itself audit-logged. |
| UR-COMM-033 | Upon completing an abuse report review, the moderator shall select an outcome: No action (dismissed), Content removed, User warned, User suspended (temporary), User deactivated (pending Super Admin review), or Escalated to safeguarding. All outcomes are logged. | Must | User suspensions and deactivations triggered by a moderator require Super Admin confirmation before taking effect, except for accounts involving minor-protection incidents where immediate suspension is permitted. |
| UR-COMM-034 | The reporting user shall receive a notification when their report has been actioned, confirming that it was reviewed. The notification shall not reveal the specific outcome taken against the reported party. | Should | Non-disclosure of outcomes protects both parties and prevents retaliation. The reporter may contact the platform at a published safeguarding contact address for further enquiry. |
| UR-COMM-035 | Teachers shall be able to flag a student's behaviour or communication as a safeguarding concern directly from within the class or team communication view, in addition to the generic report function. | Must | A teacher-initiated safeguarding flag bypasses the general moderation queue and enters the safeguarding escalation workflow directly (UR-COMM-044). |

---

## Requirements: Profanity and PII Filtering

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-COMM-036 | The profanity filter shall operate on a real-time basis, screening each submission before persistence. It shall be tunable via an admin-maintained word list and an ML confidence threshold without a code deployment. | Must | False-positive rate on typical educational content should be below 0.5% in testing. False-negative rate on clearly profane content should be below 1%. |
| UR-COMM-037 | The PII filter shall detect and block the following data types at minimum when found in communication channels involving a minor participant: email addresses, telephone numbers, physical addresses, national ID / passport numbers, social media handles, and explicit off-platform URLs used as contact vectors. | Must | The filter should use both regex pattern matching and a Named Entity Recognition (NER) model to improve accuracy over regex alone. |
| UR-COMM-038 | When PII is detected in a submission by or to a minor, the platform shall: block the submission, log the full content in the safeguarding audit log, and (if the pattern matches a grooming/contact-solicitation vector) automatically trigger a safeguarding flag. | Must | The minor-submitting-PII case (e.g., a child accidentally sharing their home address) should trigger a quieter internal flag rather than an error visible to potential bad actors. |
| UR-COMM-039 | The platform shall not store filtered/blocked content in any user-visible location. Blocked content persists only in the immutable safeguarding audit log with restricted access. | Must | Ensures that blocked content cannot be retrieved by the submitter or recipient through any platform UI path. |
| UR-COMM-040 | School Admins and Teachers shall be able to add school-specific terms to a school-scoped augmented word list that supplements (but does not replace) the platform-level list. | Should | School-scoped additions must be approved by the School Admin (not individual teachers). All additions are audit-logged. |

---

## Requirements: Safeguarding Escalation

Safeguarding escalation is the process by which a potential child-protection concern is elevated from an automated or user-generated flag to a structured response involving the appropriate human decision-makers and, where required, external authorities.

```
+------------------------------------------------------+
|           Safeguarding Escalation Pathway            |
+------------------------------------------------------+
|                                                      |
|  TRIGGER (any of):                                   |
|  - Automated: grooming/solicitation signal detected  |
|  - User report: category = safeguarding concern      |
|  - Teacher flag: via safeguarding flag function      |
|  - Moderator escalation from moderation queue        |
|          |                                           |
|          v                                           |
|  [1] SAFEGUARDING QUEUE                              |
|      Visible to: School Admin (in-scope)             |
|                  Platform Moderator                  |
|                  Super Admin                         |
|      SLA: acknowledge within 1 business hour         |
|          |                                           |
|          v                                           |
|  [2] TRIAGE (School Admin / Platform Moderator)      |
|      Outcome A: No concern (log and close)           |
|      Outcome B: Internal action (warn/suspend user)  |
|      Outcome C: Escalate to Super Admin              |
|      Outcome D: Refer to external authority          |
|          |                                           |
|          v                                           |
|  [3] SUPER ADMIN REVIEW (if escalated)               |
|      Outcome: Platform-level action; possible        |
|      referral to law enforcement / child protection  |
|      authority; notification to Parent/Guardian;     |
|      account deactivation                            |
|          |                                           |
|          v                                           |
|  [4] CLOSE WITH FULL AUDIT RECORD                    |
|      All steps, decisions, actors, and timestamps    |
|      recorded in immutable safeguarding audit log    |
+------------------------------------------------------+
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-COMM-041 | The platform shall maintain a dedicated Safeguarding Queue, separate from the general content moderation queue, visible only to the School Admin (school-scoped), Platform Moderator, and Super Admin. | Must | The queue must surface: trigger type, involved accounts, timestamp, severity classification, and associated evidence (message content, prior flags). |
| UR-COMM-042 | The Safeguarding Queue shall impose a mandatory acknowledgement SLA: items must be acknowledged by an authorised role within 1 business hour of entering the queue. The platform shall send escalating notifications (in-app and email) to the responsible parties until acknowledged. | Must | SLA clock starts at item creation. If not acknowledged within 1 business hour, the notification escalates to the next level in the hierarchy (e.g., from School Admin to Platform Moderator to Super Admin). |
| UR-COMM-043 | Each safeguarding queue item shall carry a severity classification (Low / Medium / High / Critical) assigned by the automated pipeline or adjustable by the triage moderator. Critical items (e.g., confirmed grooming signal, CSAM detection) must trigger immediate notification to Super Admin regardless of school-level triage status. | Must | The severity classification is editable by moderators but all changes are audit-logged and require a written rationale. |
| UR-COMM-044 | The safeguarding escalation workflow shall support four documented outcome types: (a) No concern — logged and closed; (b) Internal action — warning, suspension, or content removal with audit record; (c) Super Admin escalation — for cross-school, serious, or repeat issues; (d) External referral — documented referral to law enforcement or a recognised child-protection authority, with a case reference captured in the log. | Must | The platform must provide a structured referral documentation template that a Super Admin can export for use with external authorities. |
| UR-COMM-045 | When a safeguarding case involves a minor, the platform shall notify the associated Parent/Guardian of the existence of a safeguarding concern and the fact that it is under review, using language appropriate for a non-technical audience. The notification must not contain details that could compromise an ongoing investigation or identify the reporting party. | Must | The exact timing and content of the Parent/Guardian notification is subject to the triage decision (outcome b, c, or d). For Critical items, notification occurs automatically upon classification. |
| UR-COMM-046 | The platform shall provide the Super Admin with a Safeguarding Incidents Dashboard showing: open incidents by severity, average acknowledgement time, average time-to-close, incidents per school (anonymised for external reporting), and outcomes over a configurable time range. | Must | Dashboard data must comply with data minimisation; aggregate statistics must be available for export as a structured CSV or PDF report for regulatory purposes. |
| UR-COMM-047 | All safeguarding audit records shall be retained for a minimum of 7 years (or longer if required by applicable law), stored separately from general operational logs, with access restricted to Super Admin and authorised safeguarding officers. | Must | Retention policy aligns with the most conservative applicable legal instrument across COPPA, GDPR-K, Zimbabwe CDPA, POPIA, NDPR, and Kenya DPA. |
| UR-COMM-048 | The platform shall publish a clear, plain-language Safeguarding Policy accessible from the footer of the marketing site and from within the authenticated platform. The policy shall identify: the named Designated Safeguarding Lead (DSL) for the platform, the reporting procedure, the applicable laws and standards, and the external escalation contacts. | Must | The DSL is a named Super Admin or a designated member of the RoboCode.Africa operations team. |

---

## Requirements: Audit Logging

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-COMM-049 | The platform shall maintain an immutable audit log covering all communication and moderation events, including: message sent, message delivered, message held (flagged), message blocked, message deleted (by user), report submitted, report actioned, moderation decision, safeguarding item created, safeguarding item actioned, notification sent, and notification preference changed. | Must | "Immutable" means log entries cannot be modified or deleted through any normal platform operation. The log may be stored in append-only storage (e.g., S3-compatible object store with object lock). |
| UR-COMM-050 | Each audit log entry shall record at minimum: a unique event ID, event type, event timestamp (UTC, millisecond precision), actor user ID and role, target resource (user, message, channel, or case ID), outcome, and IP address. | Must | Audit log schema must be stable; additions to the schema are permitted but deletions are not without a documented deprecation cycle. |
| UR-COMM-051 | The audit log shall be accessible to the Super Admin via a structured search interface supporting filters on: time range, event type, actor, school, and outcome. | Must | Search results must be exportable in CSV format. |
| UR-COMM-052 | Access to the audit log by platform staff shall itself be logged, creating a meta-audit trail. | Must | Meta-audit log entries are subject to the same retention and immutability requirements as the primary audit log. |
| UR-COMM-053 | The platform shall provide School Admins with a school-scoped view of the audit log covering communication events within their school. School Admins shall not be able to access audit log entries from other schools. | Must | Multi-tenant isolation enforced via Postgres RLS; see Section 8 (School Onboarding, Custom Domain and White-Labelling) and FR-COMM and SR-nnn in the SSD. |
| UR-COMM-054 | The platform shall support export of a full school-scoped or platform-wide audit log in a structured format (JSON-L or CSV) for regulatory inspection or legal disclosure, accessible only to the Super Admin. | Must | Export must be possible within 24 hours of request. Large exports must be queued and delivered by a secure download link with a time-limited expiry. |
| UR-COMM-055 | Notification delivery events (sent, bounced, opened for email) shall be recorded in the audit log. Notification preference changes shall also be logged with the before and after state. | Should | Email open-tracking is permissible only for transactional system emails; must not be used for engagement analytics or behavioural profiling. |
| UR-COMM-056 | The platform shall implement log integrity verification (e.g., a cryptographic hash chain or WORM storage policy) so that tampering with historical audit log entries can be detected. | Must | Integrity verification mechanism must be documented in the SSD security controls section (SR-nnn). |
| UR-COMM-057 | When a user deletes a message, the message text and metadata shall be removed from the user-visible conversation view but retained in the audit log with a `deleted_by` marker, timestamp, and original content. | Must | This retention is disclosed in the platform Terms of Service and Privacy Notice. Deleted messages in the audit log are subject to the same access restrictions as other audit data. |

---

## Authoritative Retention Schedule

This table is the single, authoritative log- and record-retention schedule for the entire
URD. Every other section that states a retention period (Sections 7, 11, 14, 16, 20, 21)
**defers to this table**; where an earlier draft stated a different figure, this schedule
governs. The categories are deliberately distinct: different record classes have different
minima because they serve different legal purposes, not because the document is
inconsistent.

| ID | Record category | Minimum retention | Acceptance / Notes |
|----|-----------------|-------------------|--------------------|
| UR-COMM-062 | Operational / application logs (non-audit) | 90 days | Performance and debug logs; not safety-relevant; rotated after 90 days. |
| UR-COMM-063 | Platform audit log — standard (admin actions, approvals, role changes, RoboPoints adjustments, anti-cheat events, AI Hint Assistant interactions, security/auth events, communication & moderation events) | 12 months | Single standard minimum for all "audit log — standard" categories across the platform. Supersedes any 3-year or 5-year figure stated elsewhere for these categories. |
| UR-COMM-064 | Parental / guardian consent records | Lifetime of the minor account + 3 years | Then deleted. Mirrors UR-ONB-035. |
| UR-COMM-065 | Safeguarding records (incidents, escalations, blocked-content evidence) | Minimum 7 years (or longer if required by law) | Stored separately from operational logs with restricted access. Mirrors UR-COMM-047. |

> Where a national law mandates a longer minimum than a figure above for a given record
> class, the longer statutory minimum applies for the affected data subjects.

---

## MoSCoW Priority Summary

The following table provides a consolidated, scannable MoSCoW view of all UR-COMM requirements.

| ID | Short Title | Priority |
|----|-------------|----------|
| UR-COMM-001 | Class Announcements channel | Must |
| UR-COMM-002 | Task/Assignment Feed | Must |
| UR-COMM-003 | Teacher-initiated Student DM | Must |
| UR-COMM-004 | Team Channel with teacher oversight | Must |
| UR-COMM-005 | Project Comments thread | Must |
| UR-COMM-006 | School Admin broadcast announcements | Must |
| UR-COMM-007 | Platform-wide broadcast announcements | Must |
| UR-COMM-008 | No student-to-student direct messaging | Must |
| UR-COMM-009 | School Admin read access to all comms | Must |
| UR-COMM-010 | 12-month immutable communication retention | Must |
| UR-COMM-011 | Teacher mute/remove from Team Channel | Must |
| UR-COMM-012 | Peer review within class (teacher-enabled) | Could |
| UR-COMM-013 | In-app notifications | Must |
| UR-COMM-014 | Email notifications for critical events | Must |
| UR-COMM-015 | Optional SMS notifications | Should |
| UR-COMM-016 | User-configurable notification preferences | Must |
| UR-COMM-017 | Notification digest mode | Should |
| UR-COMM-018 | Automated content moderation on all channels | Must |
| UR-COMM-019 | Profanity / hate-speech filter (configurable) | Must |
| UR-COMM-020 | PII detection in content pipeline | Must |
| UR-COMM-021 | Grooming/solicitation signal detection | Must |
| UR-COMM-022 | BLOCK behaviour (reject + log + non-specific error) | Must |
| UR-COMM-023 | FLAG behaviour (hold + queue + pending status) | Must |
| UR-COMM-024 | Moderator actions on flagged content | Must |
| UR-COMM-025 | Moderation statistics in admin dashboard | Must |
| UR-COMM-026 | Moderation applied to project names and code comments | Should |
| UR-COMM-027 | School-scoped moderation queue for School Admin | Must |
| UR-COMM-028 | Bulk moderation actions | Should |
| UR-COMM-029 | One-click abuse report on any content/profile | Must |
| UR-COMM-030 | Abuse report category and free-text form | Must |
| UR-COMM-031 | Abuse report routing to appropriate queue | Must |
| UR-COMM-032 | Moderator context view for abuse reports | Must |
| UR-COMM-033 | Structured abuse report outcome options | Must |
| UR-COMM-034 | Reporter notification upon report actioned | Should |
| UR-COMM-035 | Teacher safeguarding flag from comms view | Must |
| UR-COMM-036 | Real-time profanity filter with tunable thresholds | Must |
| UR-COMM-037 | PII filter: specific data types blocked for minors | Must |
| UR-COMM-038 | Minor-involving PII auto-triggers safeguarding flag | Must |
| UR-COMM-039 | Blocked content not visible via any UI path | Must |
| UR-COMM-040 | School-scoped word list augmentation | Should |
| UR-COMM-041 | Dedicated Safeguarding Queue | Must |
| UR-COMM-042 | 1-business-hour acknowledgement SLA with escalating alerts | Must |
| UR-COMM-043 | Severity classification on safeguarding items | Must |
| UR-COMM-044 | Four structured outcome types in safeguarding workflow | Must |
| UR-COMM-045 | Parent/Guardian notification for minor safeguarding cases | Must |
| UR-COMM-046 | Safeguarding Incidents Dashboard for Super Admin | Must |
| UR-COMM-047 | 7-year safeguarding audit record retention | Must |
| UR-COMM-048 | Published Safeguarding Policy with named DSL | Must |
| UR-COMM-049 | Immutable communication and moderation audit log | Must |
| UR-COMM-050 | Minimum audit log entry schema | Must |
| UR-COMM-051 | Super Admin audit log search and export | Must |
| UR-COMM-052 | Meta-audit trail for audit log access | Must |
| UR-COMM-053 | School-scoped audit log view for School Admin | Must |
| UR-COMM-054 | Full audit log export for regulatory disclosure | Must |
| UR-COMM-055 | Notification delivery events in audit log | Should |
| UR-COMM-056 | Audit log integrity verification | Must |
| UR-COMM-057 | Deleted-message retention in audit log | Must |
| UR-COMM-062 | Operational/application log retention (90 days) | Must |
| UR-COMM-063 | Standard platform audit log retention (12 months) | Must |
| UR-COMM-064 | Consent record retention (account lifetime + 3 years) | Must |
| UR-COMM-065 | Safeguarding record retention (minimum 7 years) | Must |

---

## Accessibility Requirements for Communication Features

All communication interfaces must meet WCAG 2.2 Level AA. The following specific obligations apply to the communication and notification components.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-COMM-058 | All notification elements (in-app banners, badges, toast messages) shall be announced by screen readers using ARIA live regions with appropriate politeness levels (assertive for critical alerts, polite for informational updates). | Must | Verify with NVDA + Firefox and VoiceOver + Safari. |
| UR-COMM-059 | The abuse report function shall be keyboard-accessible and operable without a mouse, with a visible focus indicator. | Must | WCAG 2.2 SC 2.1.1 (Keyboard) and SC 2.4.11 (Focus Appearance). |
| UR-COMM-060 | Notification email templates shall use semantic HTML, a minimum body font size of 14px, sufficient colour contrast (4.5:1 for normal text), and a plain-text alternative. | Must | Test with Litmus or equivalent cross-client tool. |
| UR-COMM-061 | The moderation queue UI shall be fully keyboard-navigable, with all approve/reject/escalate actions operable via keyboard shortcut and screen-reader-friendly labelling. | Must | Moderators often process large queues; keyboard efficiency is a functional requirement as well as an accessibility requirement. |

---

## Compliance Mapping

The following table maps the principal child-data-protection legal instruments to the requirements in this section that fulfil them.

| Legal Instrument | Key Obligation | Fulfilled By |
|------------------|---------------|--------------|
| COPPA (US, under-13) | Verifiable parental consent; no personal data collection without consent; right to deletion | UR-COMM-037, UR-COMM-038; cross-ref UR-ONB (Section 6) for consent gate |
| GDPR-K (EU, under-16) | Age-appropriate design; data minimisation; no profiling; right to erasure | UR-COMM-008, UR-COMM-020, UR-COMM-039, UR-COMM-057 |
| UK Children's Code | Best-interests default; no nudge techniques; privacy by default | UR-COMM-008, UR-COMM-016 (mandatory non-configurable safety notifications), UR-COMM-022 |
| Zimbabwe CDPA 2021 | Lawful processing; data subject rights; cross-border transfer restrictions | UR-COMM-049 through UR-COMM-057 (audit trail); data residency addressed in Section 20 (NFR) |
| South Africa POPIA | Conditions for lawful processing; special conditions for children | UR-COMM-045 (guardian notification); UR-COMM-047 (retention) |
| Nigeria NDPR 2019 | Consent; data subject rights; data processing principles | UR-COMM-016, UR-COMM-054 (regulatory export capability) |
| Kenya DPA 2019 | Registration of data controllers; processing principles; children's data | UR-COMM-048 (published safeguarding policy); UR-COMM-046 (incident dashboard for regulatory reporting) |

---

## Cross-References

The requirements in this section interact closely with the following other sections of this URD and the companion SSD:

- **Section 6: User Requirements: Onboarding, Signup and Approval** — UR-ONB requirements for parental consent collection and minor account activation gates that are the precondition for minor access to communication channels.
- **Section 7: User Requirements: Authentication and Account Management** — UR-AUTH requirements for account suspension and deactivation outcomes referenced in UR-COMM-033 and UR-COMM-044.
- **Section 8: User Requirements: School Onboarding, Custom Domain and White-Labelling** — Multi-tenant data isolation (Postgres RLS) that underpins school-scoped moderation queues and audit log views (UR-COMM-027, UR-COMM-053).
- **Section 13: User Requirements: Teams, Competitions and Collaboration** — UR-TEAM requirements for team formation and team project workspaces; the Team Channel (UR-COMM-004) is the communication layer for those teams.
- **Section 16: User Requirements: Administration and Reporting** — UR-ADM requirements for the admin console dashboards that surface moderation statistics, safeguarding incident summaries, and audit log access.
- **Section 20: Non-Functional User Expectations** — NFR requirements for notification latency, content moderation pipeline throughput, and audit log search performance that the communication system must satisfy.
- **SSD FR-COMM** — Functional requirements for the communication microservice, WebSocket channel management (Socket.IO), and Yjs CRDT integration.
- **SSD SR-nnn** — Security requirements including audit log integrity controls and access control enforcement on safeguarding records.
- **SSD DR-nnn** — Data requirements including audit log schema, retention policies, and data residency constraints for communication records.

---

## Assumptions and Constraints

| # | Statement |
|---|-----------|
| 1 | The content moderation pipeline (profanity filter, PII detector, grooming signal detector) is implemented as a platform-managed service, not outsourced to a third-party consumer-facing API that would receive raw student content. |
| 2 | SMS notification capability is dependent on the availability of a suitable SMS gateway for the target African markets. The specific gateway is a deployment-time configuration; the feature is architecturally supported. |
| 3 | The Designated Safeguarding Lead (DSL) named in the Safeguarding Policy (UR-COMM-048) is a human individual reachable during business hours. The platform supplements but does not replace human judgement in safeguarding decisions. |
| 4 | Teachers are trusted to use the Teacher-initiated DM (UR-COMM-003) appropriately. Misuse of teacher-to-student messaging is subject to the same abuse-reporting mechanism (UR-COMM-029) and is visible in the audit log. |
| 5 | Notification email deliverability is subject to the reputation and configuration of the chosen transactional email provider (SES/SendGrid). The platform is responsible for correct SPF/DKIM/DMARC DNS configuration; deliverability rates above 98% are targeted but not unconditionally guaranteed. |
| 6 | The 1-business-hour safeguarding acknowledgement SLA (UR-COMM-042) is defined relative to the platform's operational business hours, which must be defined in the platform operational policy and published in the Safeguarding Policy document. |


# User Requirements: Administration and Reporting

## Overview

This section defines all user requirements for the administration and reporting capabilities of RoboCode.Africa across every administrative tier. Administration spans four distinct tiers of responsibility: the **Super Admin** (RoboCode.Africa platform administrator) and delegated **Platform Moderator** at the global level; the **School Admin** (Tenant Admin) at the per-school level; and the **Teacher / Educator** at the classroom level. Each tier has a distinct scope of authority, data visibility, and tooling, governed by the platform's role-based access control (RBAC) model described in _Section 5: User Roles and Permissions Matrix_.

The requirements in this section are critical to safe, compliant operation of the platform at scale. They encompass: tenant lifecycle management, global and school-level signup approvals, content library governance, content and safety moderation, platform configuration and feature flags, billing and subscription plan management, system health visibility, analytics and reporting at global and school scope, student and teacher account management, class and assignment administration, and teacher-level class reporting.

Cross-references:

- _User Requirements: Onboarding, Signup and Approval_ (UR-ONB) — approval workflows that Admin interfaces surface.
- _User Requirements: Authentication and Account Management_ (UR-AUTH) — audit log access, session management, account suspension.
- _User Requirements: School Onboarding, Custom Domain and White-Labelling_ (UR-SCH) — domain configuration and branding managed by School Admin.
- _User Requirements: Communication, Notifications and Safety_ (UR-COMM) — moderation, safeguarding escalation and notification channels.
- _User Requirements: Gamification, RoboPoints and Leaderboards_ (UR-GAM) — leaderboard data surfaced in reports.
- _User Requirements: Learning, Courses, Tasks and Assessment_ (UR-LRN) — assignment and grading workflows administered by Teachers.

---

## Super Admin Requirements

The Super Admin is the highest-privilege role on the platform. Super Admin accounts must always have MFA enrolled (UR-AUTH-016) and are subject to the shortest session timeouts (UR-AUTH-031). Super Admin capabilities affect all tenants, all users, and all content globally.

### Tenant Management

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-001 | The Super Admin shall be able to create, view, edit, suspend, and permanently delete tenant (school) records from a global Tenant Management console. | Must | Deletion must be a two-step confirmation action with a typed confirmation string. Deletion purges all tenant data subject to the data-retention schedule. |
| UR-ADM-002 | Each tenant record shall display: tenant name, plan tier, subdomain, custom domain (if configured), number of active seats, active student and teacher counts, creation date, last activity date, and account status (active, suspended, churned). | Must | Surfaced in a sortable, filterable table supporting pagination and CSV export. |
| UR-ADM-003 | The Super Admin shall be able to assign or change the subscription plan for any tenant, effective immediately or at the next billing cycle. | Must | Plan change must trigger a notification email to the School Admin of the affected tenant. |
| UR-ADM-004 | The Super Admin shall be able to suspend or reinstate a tenant with a mandatory reason field; all users in a suspended tenant must immediately lose access with a tenant-suspension notice on login. | Must | Suspension and reinstatement events must be logged in the immutable audit trail with timestamp, actor, and reason. |
| UR-ADM-005 | The Super Admin shall be able to impersonate a School Admin for diagnostic purposes with full audit logging; impersonation sessions must be clearly marked with a persistent banner and must not allow data deletion or billing changes. | Should | Impersonation must be time-limited (maximum 60 minutes) and requires a reason field; all actions taken during impersonation must appear in the audit log attributed to both the actor and the impersonated identity. |
| UR-ADM-006 | The Super Admin shall be able to search for any user across all tenants by email, username, or user ID, and navigate directly to that user's profile management screen. | Must | Cross-tenant search results must respect the data-minimisation principle; only the fields necessary for identification and triage are returned by default. |
| UR-ADM-007 | The Super Admin shall be able to export a full or filtered list of tenants as a CSV or JSON file for billing reconciliation and external reporting. | Should | Export must include plan tier, seat count, contract start/end dates, and billing contact. |

### Global Signup Approvals

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-008 | The Super Admin and Platform Moderator shall have a dedicated Signup Approvals queue for all accounts that registered directly on `robocode.africa` (i.e., not via a school subdomain or custom domain). | Must | Queue must display applicant name, email, declared role, declared age/date-of-birth, registration date, and parental-consent status for minors. |
| UR-ADM-009 | The approvals interface shall allow bulk approval or bulk rejection of multiple pending accounts in a single action, with a mandatory reason for rejection. | Must | Bulk actions must support selection of up to 100 records per operation. |
| UR-ADM-010 | Rejected applicants must receive an automated, templated email explaining the rejection reason at a level appropriate to the applicant's declared age; the rejection email must include a contact address for appeal. | Must | Email templates must be editable by the Super Admin. Minor rejection emails must be addressed to the guardian where a guardian email is on record. |
| UR-ADM-011 | The Super Admin shall be able to delegate approval authority to a Platform Moderator for specific registration categories (e.g., direct-signup students, direct-signup teachers) without delegating full Super Admin access. | Should | Delegation must be role-scoped and revocable at any time; delegation events are audit-logged. |
| UR-ADM-012 | The approvals queue must surface any pending parental-consent verification items alongside the associated student application so that approval of the student account and confirmation of consent can be co-ordinated. | Must | An account must not be activated until both the approval and the required parental consent (where applicable) are satisfied. See UR-ONB. |

### Global Content Library

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-013 | The Super Admin shall maintain a Global Content Library from which courses, modules, lesson templates, project templates, and component catalogue definitions are managed and published to all tenants. | Must | Content in the global library is available to all tenants unless explicitly restricted by plan tier. |
| UR-ADM-014 | The Super Admin shall be able to create, edit, version, publish, unpublish, archive, and permanently delete global content items. | Must | Published content changes must not break existing student progress records; versioning must allow rollback to a prior version. |
| UR-ADM-015 | The Super Admin shall be able to designate specific courses or modules as "platform-required" (visible and assigned to all tenants) or "optional" (available for School Admin opt-in). | Should | Platform-required content cannot be removed or overridden by a School Admin. |
| UR-ADM-016 | The Super Admin shall be able to restrict specific content items to particular plan tiers (e.g., advanced AI courses available only on the Pro plan). | Should | Content not accessible under a tenant's plan must be visible as locked/preview-only to the School Admin and Teachers. |
| UR-ADM-017 | The Super Admin shall be able to preview any content item as it would appear to a Student, Teacher, or School Admin before publishing. | Must | Preview must render inside RoboCode Studio for any interactive project templates. |

### Moderation and Safeguarding

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-018 | The Super Admin and Platform Moderator shall have access to a global Moderation Console displaying all escalated content flags, safeguarding reports, and automated moderation alerts across all tenants. | Must | Console must support filtering by tenant, severity, flag type, date range, and resolution status. |
| UR-ADM-019 | The Super Admin shall be able to configure global moderation rules including profanity/PII filter word lists, automated content-scan thresholds, and escalation routing rules. | Must | Changes to moderation rules must be audit-logged and version-controlled. |
| UR-ADM-020 | The Super Admin shall be able to suspend, delete, or permanently ban any user account across any tenant from the moderation console, with a mandatory reason and immediate audit log entry. | Must | Permanent bans must prevent re-registration with the same email or verified identity. |
| UR-ADM-021 | Safeguarding escalations that meet the threshold defined by platform policy must trigger an automatic notification to the Super Admin on-call and, where applicable, generate a structured safeguarding report for transmission to relevant authorities. | Must | Notification must be delivered within 5 minutes of escalation trigger. Report format must be configurable. |
| UR-ADM-022 | The Super Admin shall be able to view, search, and export the complete audit trail for any user or tenant, including all authentication events (see UR-AUTH-056), moderation actions, and administrative actions. | Must | Audit logs must be immutable and retained per the authoritative retention schedule in Section 15 (UR-COMM-062 to UR-COMM-065): standard platform audit log minimum 12 months; safeguarding records minimum 7 years. |

### Platform Configuration and Feature Flags

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-023 | The Super Admin shall have a Platform Configuration console allowing management of: supported languages, available subscription plan definitions, default session timeout values, MFA enforcement policies, maintenance windows, and global feature flags. | Must | All configuration changes must be audit-logged with before/after values. |
| UR-ADM-024 | Feature flags shall allow the Super Admin to enable or disable specific platform capabilities (e.g., 3D simulation view, block-based coding mode, team collaboration, RoboPoints) globally or per-plan-tier without a code deployment. | Should | Feature flags must propagate to all active user sessions within 60 seconds of change (via real-time config push or short-lived cache expiry). |
| UR-ADM-025 | The Super Admin shall be able to configure and schedule maintenance windows; during a scheduled maintenance window, the platform must display a configurable maintenance notice to all users and gracefully decline new logins. | Must | Maintenance notices must be announced to all active users at least 24 hours in advance via the notification system (UR-COMM). |
| UR-ADM-026 | The Super Admin shall be able to manage the component catalogue: adding new simulator component definitions, updating existing component metadata, and retiring deprecated components with a migration path for existing projects. The Super Admin shall also be able to manage custom board definitions (wokwi-boards manifest format), including approving or rejecting board definitions submitted by platform admins or advanced users, and retiring deprecated board definitions. | Must | Component catalogue and board definition changes must not corrupt existing saved project files; the system must maintain backwards-compatibility for at least two prior component/board schema versions. Custom board definitions submitted by non-admins must pass through the approval/moderation workflow before becoming available to learners. |
| UR-ADM-098 | The Super Admin shall be able to upload, review, approve, reject, and retire custom board definitions in the wokwi-boards manifest format (board.json plus SVG asset). Approved platform admins and advanced users or teachers may submit custom board definitions; these submissions must be validated (JSON schema, pin sanity, SVG/asset safety check) and routed through the moderation/approval workflow before becoming available to learners. Each approved board definition must declare its MCU core target (avr8js, rp2040js, or ESP32 core) so the simulator can execute firmware for that board. | Must | The built-in wokwi-boards library (covering Arduino UNO/Nano/Mega, the ESP32 family, and the Raspberry Pi Pico) ships pre-approved and requires no upload. Custom-board approvals must be audit-logged with reviewer identity and decision rationale. |

### Billing and Subscription Plan Management

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-027 | The Super Admin shall have a Billing Console displaying all tenants' subscription plans, billing cycles, payment statuses, invoices, and seat utilisation. | Must | Console must support filtering by plan tier, payment status, and region. |
| UR-ADM-028 | The Super Admin shall be able to define, edit, and retire subscription plan tiers including: plan name, price, seat limits, included features, content access level, and trial duration. | Must | Retiring a plan must not automatically change existing tenants on that plan; Super Admin must explicitly migrate affected tenants. |
| UR-ADM-029 | The platform shall support multiple payment processors appropriate for African markets (Stripe, Paystack, Flutterwave); the Super Admin must be able to configure which processors are active for which regions. | Must | Payment processor configuration must include API credential management with secure encrypted storage. |
| UR-ADM-030 | The Super Admin shall be able to manually issue or revoke subscription credits, apply promotional discounts, or extend trial periods for individual tenants with a mandatory reason field. | Should | All manual billing adjustments must be audit-logged. |
| UR-ADM-031 | The platform shall automatically notify the Super Admin and the affected School Admin when a subscription payment fails; a configurable grace period (default 7 days) must be available before service degradation. | Must | Service degradation during grace period must show read-only mode rather than immediate lockout. |

### System Health and Observability

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-032 | The Super Admin shall have a System Health dashboard displaying real-time and historical metrics including: API gateway latency (p50, p95, p99), simulator engine throughput, error rates by service, active user sessions, queue depths, and database connection pool utilisation. | Must | Dashboard must be built on the platform's observability stack (OpenTelemetry/Prometheus/Grafana). |
| UR-ADM-033 | The System Health dashboard must surface active incidents and alerts from the platform's alerting system, with the ability to acknowledge and annotate incidents without leaving the admin console. | Should | Alert integration must support PagerDuty, Opsgenie, or equivalent via webhook. |
| UR-ADM-034 | The Super Admin shall be able to view CDN and edge performance metrics segmented by geographic region, with particular visibility into Africa-region latency to support SLA monitoring for low-bandwidth markets. | Should | Must include metrics for the primary Africa CDN edge (Cloudflare/CloudFront) and the `af-south-1` cloud region. |
| UR-ADM-035 | The Super Admin shall receive automated alerts when any critical threshold is breached: API error rate above 1 %, simulator engine failure rate above 0.5 %, p95 API latency above 2 000 ms, or any service reporting zero healthy instances. | Must | Alert delivery must use multiple channels (email + PagerDuty/webhook) with a maximum 2-minute alert latency from threshold breach. |

### Global Reports

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-036 | The Super Admin shall have a Global Analytics dashboard showing platform-wide metrics: total active tenants, total registered and active users by role, new registrations over time, daily/monthly active users (DAU/MAU), RoboPoints issued and redeemed, course completions, and simulator session volumes. | Must | Dashboard must be filterable by date range and exportable as CSV and PDF. |
| UR-ADM-037 | The Super Admin shall be able to generate cross-tenant comparative reports showing engagement, learning outcomes, and retention metrics per tenant, anonymised to prevent School Admin identification of individual students from other schools. | Should | Comparative reports must never expose personally identifiable information of students from other tenants. |
| UR-ADM-038 | The Super Admin shall have access to a safeguarding incidents report summarising moderation actions, escalations, and resolutions by tenant and time period, exportable in a structured format suitable for regulatory submission. | Must | Safeguarding report must be role-restricted to Super Admin and Platform Moderator; export must be encrypted and watermarked. |
| UR-ADM-039 | The platform shall generate automated weekly and monthly summary reports delivered by email to the Super Admin covering: new tenant activations, churn, platform errors, moderation activity, and financial summary. | Should | Report recipients must be configurable; multiple Super Admins must be supportable. |

### Super Admin MoSCoW Summary

| Priority | Requirement IDs |
|----------|-----------------|
| Must | UR-ADM-001, 002, 003, 004, 006, 008, 009, 010, 012, 013, 014, 017, 018, 019, 020, 021, 022, 023, 025, 026, 027, 028, 029, 031, 032, 035, 036, 038, 098 |
| Should | UR-ADM-005, 007, 011, 015, 016, 024, 030, 033, 034, 037, 039 |
| Could | _(none in this tier; all Super Admin requirements are Must or Should)_ |
| Won-t | _(none; all items are in scope for v1.0 unless noted as roadmap in canon)_ |

---

## School Admin Requirements

The School Admin manages a single tenant (school). Their scope is strictly limited to their own tenant; they cannot access data belonging to other tenants. School Admin accounts must always have MFA enrolled (UR-AUTH-017). Branding and custom-domain configuration requirements are defined in _User Requirements: School Onboarding, Custom Domain and White-Labelling_ (UR-SCH) and are not duplicated here.

### Student Account Management and Approvals

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-040 | The School Admin shall have a Student Management console displaying all student accounts in the school with columns: name, username, grade/year group, registration date, account status, last active date, RoboPoints total, and assigned Teacher(s). | Must | Table must be sortable and filterable by status, grade, and teacher; supports CSV export. |
| UR-ADM-041 | The School Admin shall have a dedicated Signup Approvals queue for all student accounts registered under the school's subdomain or custom domain, with the same capabilities as the global queue (UR-ADM-008 through UR-ADM-010) scoped to their tenant. | Must | The School Admin approvals queue must display parental-consent status for each minor applicant. |
| UR-ADM-042 | The School Admin shall be able to approve or reject individual or bulk student applications, with rejection reasons that are emailed to the applicant (and guardian for minors). | Must | Approval must not be possible for a minor account where parental consent is still pending. |
| UR-ADM-043 | The School Admin shall be able to suspend, reinstate, or permanently deactivate individual student accounts with a mandatory reason field; suspended accounts must lose access immediately. | Must | Permanent deactivation must initiate the standard data-retention and deletion workflow (see UR-AUTH-049 to 051). |
| UR-ADM-044 | The School Admin shall be able to perform a supervised password reset on behalf of any student in their school (see UR-AUTH-026) and initiate the admin-assisted recovery path for students who have lost access. | Must | All supervised resets must generate an immutable audit log entry. |
| UR-ADM-045 | The School Admin shall be able to manually assign or re-assign students to classes and to Teacher accounts within the school without requiring the teacher's or student's action. | Must | Assignment changes must trigger a notification to the affected Teacher and (optionally) the student. |
| UR-ADM-046 | The School Admin shall be able to bulk-import student accounts via a CSV upload template; the system must validate each row before processing and report per-row errors without failing the entire import. | Should | CSV template must be downloadable from the console; imported accounts must enter the approval queue (not be auto-approved). |
| UR-ADM-047 | The School Admin shall be able to view and manage parental/guardian consent records for all minor students in the school, including manually marking consent as received (where paper consent has been obtained outside the platform) with a mandatory supporting note. | Must | Manual consent marking must generate an audit log entry and notify the Super Admin for oversight. |

### Teacher Account Management

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-048 | The School Admin shall be able to invite Teacher / Educator accounts by email; invitees must receive an invitation email with a time-limited (72-hour) registration link; Teacher accounts require School Admin approval before activation. | Must | Invitation links must be revocable before use. Expired invitations can be re-sent. |
| UR-ADM-049 | The School Admin shall be able to view all Teacher accounts in the school with columns: name, email, classes assigned, last active date, and MFA status. | Must | MFA status visibility enables enforcement of UR-AUTH-017/018. |
| UR-ADM-050 | The School Admin shall be able to assign or remove Teacher access to specific classes; a Teacher with no assigned classes retains their account but cannot access any student data. | Must | Removal from all classes must trigger a notification to the affected Teacher. |
| UR-ADM-051 | The School Admin shall be able to suspend or permanently deactivate Teacher accounts with a mandatory reason and audit log entry; active class assignments must be reassigned or unassigned before permanent deactivation completes. | Must | Pending class assignments on deactivation must surface a warning and require resolution before the deactivation is confirmed. |
| UR-ADM-052 | The School Admin shall be able to configure MFA as mandatory for all Teacher accounts in their tenant, overriding the platform default of advisory-only for Teachers (UR-AUTH-018). | Should | MFA enforcement policy change must be notified to all affected Teachers with a configurable grace period (default 48 hours). |

### Teams, Competitions and Seat Management

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-053 | The School Admin shall be able to view all teams registered in the school, their members, assigned Teacher mentor, competition entries, and current status. | Must | Team data must be accessible as a read-only report; team management actions are delegated to Teachers (see UR-ADM-075). |
| UR-ADM-054 | The School Admin shall be able to set and modify the maximum number of active student seats for the school within the limits of their subscription plan; attempts to exceed the seat limit must be blocked with a clear upgrade prompt. | Must | Seat count changes must be reflected in real time in the Billing Console visible to the Super Admin. |
| UR-ADM-055 | The School Admin shall be able to enrol the school in platform-hosted competitions and approve teams from their school for competition entry. | Should | Competition enrolment approval must trigger notification to the Teacher mentor and Team members. |

### School Policies

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-056 | The School Admin shall be able to configure school-level policies including: minimum password complexity for student accounts, MFA enforcement for Teachers (UR-ADM-052), shared-device/classroom mode default (UR-AUTH-030), session timeout overrides (within platform-defined bounds), and whether custom avatar uploads are permitted for high-school students (UR-AUTH-037). | Must | Policy changes must take effect within 60 seconds and must be logged in the audit trail. |
| UR-ADM-057 | The School Admin shall be able to configure the notification delivery preferences for the school: which events generate email notifications, whether SMS notifications are enabled, and the frequency of digest notifications sent to teachers. | Should | Notification policy must not override individual user notification preferences that are more restrictive. |
| UR-ADM-058 | The School Admin shall be able to restrict student access to specific content: blocking individual courses or modules from their students without removing the content from the global library. | Should | Blocked content must appear as locked/unavailable to students but remain visible to the School Admin. |

### School Analytics and Reports

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-059 | The School Admin shall have a School Analytics dashboard displaying: total enrolled students, active students in the last 7/30 days, course completion rates, average RoboPoints per student, top performing classes, simulator session count, and a breakdown of engagement by grade/year group. | Must | Dashboard metrics must be updated at least daily (near-real-time refresh preferred). |
| UR-ADM-060 | The School Admin shall be able to drill down from the School Analytics dashboard to per-class and per-student views, subject to the data minimisation principle (only data relevant to administration is shown at admin level, not granular individual task responses). | Must | Drill-down must honour student privacy settings; the School Admin cannot view private project portfolios set as private by the student unless there is a safeguarding reason. |
| UR-ADM-061 | The School Admin shall be able to generate and export the following report types: Student Enrolment Report (all students by class, status, grade), Engagement Report (session frequency, course progress), Assessment Report (task completion rates and grade distributions, anonymised at aggregate level), Safeguarding Report (moderation flags and resolutions for the school). | Must | Reports must be exportable as CSV and PDF; PDF must include the school's white-label branding (logo, school name). |
| UR-ADM-062 | The School Admin shall receive an automated weekly summary digest email covering: new student registrations, pending approvals, class activity summary, and any unresolved moderation flags. | Should | Digest frequency must be configurable; digest must not contain personally identifying details of flagged students in the email body but must link to the secure console. |
| UR-ADM-063 | The School Admin shall be able to view and export the complete authentication event audit log for all users within their school (see UR-AUTH-058), filterable by user, event type, and date range. | Must | Audit log export must be access-controlled and itself logged. |

### School Admin MoSCoW Summary

| Priority | Requirement IDs |
|----------|-----------------|
| Must | UR-ADM-040, 041, 042, 043, 044, 045, 047, 048, 049, 050, 051, 053, 054, 056, 059, 060, 061, 063 |
| Should | UR-ADM-046, 052, 055, 057, 058, 062 |
| Could | _(none identified at this tier)_ |
| Won-t | _(none; all items are in scope for v1.0)_ |

---

## Teacher Requirements

The Teacher / Educator administers learning and progress at the classroom level. They have read and write access to class membership, assignment authoring and grading, and student progress within their own classes only. Teachers have no visibility into other Teachers' classes unless explicitly granted by the School Admin. All Teacher capabilities described here operate within the boundaries of classes and students assigned to them by the School Admin.

### Class Management

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-064 | The Teacher shall be able to create and manage classes, specifying a class name, grade/year group, academic year, and optionally a description; the class must be visible in the School Admin's tenant view upon creation. | Must | A Teacher may only manage classes to which they are assigned by the School Admin. |
| UR-ADM-065 | The Teacher shall be able to add students from the school's approved student roster to their class, and remove students from a class (without deactivating their account). | Must | Adding a student to a class must trigger a notification to that student. Removal must also notify the student. |
| UR-ADM-066 | The Teacher shall be able to archive a class at the end of an academic period; archived classes are read-only but their data (assignments, submissions, grades) is retained and accessible for reporting. | Must | Archiving must not delete student progress data; archived classes must not count towards active-class seat limits. |
| UR-ADM-067 | The Teacher shall be able to configure shared-device/classroom mode (UR-AUTH-030) for their class, overriding individual student session settings. | Must | Shared-device mode activation must be logged and visible to the School Admin. |
| UR-ADM-068 | The Teacher shall be able to duplicate an existing class structure (without student enrolments or historical data) to bootstrap a new class for a new academic year. | Should | Duplication must copy assignment templates, grading rubrics, and class settings but not student records or submission history. |

### Assignment and Task Management

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-069 | The Teacher shall be able to create coding tasks and robotics project assignments, specifying: title, description, learning objectives, due date, allowed programming modes (block/text/both), target board (Arduino UNO R3 / ESP32 / Raspberry Pi Pico, or any approved custom board from the wokwi-boards library), starter project template, required components, grading rubric, and whether collaborative team submission is permitted. | Must | Assignment creation UI must support rich-text description authoring and embedding of reference diagrams or images. |
| UR-ADM-070 | The Teacher shall be able to assign tasks to a whole class, a sub-group of students within a class, or individual students; assignments must appear on the assigned students' dashboards. | Must | Bulk assignment must be operable from a class view with student multi-select. |
| UR-ADM-071 | The Teacher shall be able to set a visible or hidden due date for an assignment, and enable or disable late submissions with an optional late-penalty configuration. | Should | Due date visibility must be configurable; hidden due dates allow surprise assessments. |
| UR-ADM-072 | The Teacher shall be able to publish assignments immediately or schedule them for future release to students. | Should | Scheduled release must respect the school's configured timezone. |
| UR-ADM-073 | The Teacher shall be able to edit an assignment after publication, with a change-notification sent to all assigned students; edits that change the due date must surface a warning if submissions already exist. | Must | Edits must be versioned; the grader must see which version of the assignment each submission was made against. |
| UR-ADM-074 | The Teacher shall be able to view, open in preview, and download all student project submissions for an assignment from a Submission Inbox, sorted by student name, submission date, or grade status. | Must | Opening a submission in RoboCode Studio must load the student's exact saved project state at submission time, not the current project state. |

### Grading and Feedback

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-075 | The Teacher shall be able to grade student submissions against the assignment rubric, entering a numeric score and qualitative written feedback per submission; grades and feedback must be visible to the student after the Teacher publishes results. | Must | Grade publishing must be a deliberate explicit action; results must not leak to students before publication. |
| UR-ADM-076 | The Teacher shall be able to use the grading interface to run (simulate) a student's submitted project in RoboCode Studio without altering the submission, to observe its behaviour in the simulator as part of assessment. | Must | Simulation run from the grading view must not modify the student's submission record or project state. |
| UR-ADM-077 | The Teacher shall be able to configure automatic grading for tasks with deterministic expected outputs (e.g., LED blinks at a specified frequency verified by simulator state logging); manual review must always be possible as an override. | Should | Automated grading must log the test conditions, expected outputs, and actual outputs for audit purposes. |
| UR-ADM-078 | The Teacher shall be able to return a submission to the student for revision, attaching feedback; the student must be notified and may resubmit once within the configured resubmission window. | Should | Resubmission must overwrite the previous submission in the inbox but retain a version history accessible to the Teacher. |
| UR-ADM-079 | The Teacher shall be able to award bonus RoboPoints to a student for exceptional work as part of the grading action; the award must be logged in the RoboPoints ledger with the Teacher's name and assignment reference (see UR-GAM). | Could | Bonus RoboPoints awards must be visible to the School Admin in the school's RoboPoints report. |

### Student Progress and Mentoring

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-080 | The Teacher shall be able to view an individual student's progress dashboard within their class: completed and in-progress tasks, submission dates, grades received, RoboPoints earned, simulator session history, and any safeguarding flags associated with the student. | Must | Student progress data is limited to the Teacher's own class; no cross-class visibility unless the School Admin grants it. |
| UR-ADM-081 | The Teacher shall be able to leave mentoring notes on a student's profile (visible only to Teachers and the School Admin within the tenant, not to the student); notes must be dated and attributable. | Should | Mentoring notes must be included in safeguarding escalations if the student is reported. |
| UR-ADM-082 | The Teacher shall be able to manage team mentoring assignments: viewing team composition, team project progress, and team RoboPoints for teams within their class; accepting or declining a request to mentor a specific team. | Must | Team management actions (forming, dissolving teams) are governed by UR-TEAM; the Teacher's role here is oversight and mentoring. |
| UR-ADM-083 | The Teacher shall be able to flag a student's behaviour, content, or safeguarding concern from the student profile view, escalating it to the School Admin's moderation console (see UR-COMM). | Must | Escalation must generate an immediate notification to the School Admin and an audit log entry. |

### Class Reports

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-084 | The Teacher shall have a Class Reports section providing: assignment completion rate per assignment, grade distribution per assignment (histogram), per-student progress summary, class-level RoboPoints leaderboard, and simulator usage statistics (session count, average duration). | Must | Reports must be limited to the Teacher's assigned classes; cross-class aggregation is not available at Teacher level. |
| UR-ADM-085 | The Teacher shall be able to generate and download a per-student Progress Report as a PDF for parent/guardian meetings or school administrative records; the report must include completed tasks, grades, teacher feedback headlines, and RoboPoints total. | Must | PDF must include the school's white-label branding. Student name and class must appear on the report. Detailed rubric breakdowns may be included or excluded via a toggle. |
| UR-ADM-086 | The Teacher shall be able to export the full class grade book as a CSV file containing: student names (anonymised ID optional), assignment names, scores, submission dates, and final grade for each assignment. | Must | Export must support optional anonymisation (replace names with student IDs) for use in external assessment systems. |
| UR-ADM-087 | The Teacher shall be able to view aggregated class engagement trends over time: weekly active students, cumulative simulator session hours, task completion velocity (tasks completed per week), and RoboPoints earning rate. | Should | Trend data must be presented as a chart (line/bar) within the Teacher console; raw data must be exportable as CSV. |

### Teacher MoSCoW Summary

| Priority | Requirement IDs |
|----------|-----------------|
| Must | UR-ADM-064, 065, 066, 067, 069, 070, 073, 074, 075, 076, 080, 082, 083, 084, 085, 086 |
| Should | UR-ADM-068, 071, 072, 077, 078, 081, 087 |
| Could | UR-ADM-079 |
| Won-t | _(none identified at this tier)_ |

---

## Parent / Guardian Requirements

The Parent / Guardian is not an administrative role in the operational sense, but in v1.0 they hold a small, legally mandated set of read-only and consent-management capabilities that must have an authoritative home. The full parent portal is a roadmap item (see Section 1, Out of Scope); the requirements below define the v1.0 read-only and consent surface, accessible via the consent link or a dedicated parent login (see UR-ONB-034). All capabilities are scoped strictly to the Parent's own linked children (see Section 5, UR-SCH-095).

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-093 | A Parent / Guardian shall be able to view a read-only progress summary for each linked child, showing: completed tasks, RoboPoints total, badges earned, and a high-level engagement indicator. | Must | No granular task responses, code, or other students' data are shown. Honours the child's privacy settings and data minimisation. |
| UR-ADM-094 | A Parent / Guardian shall be able to view, grant, and withdraw verifiable consent for each linked minor child at any time (see UR-ONB-030, UR-ONB-033). Withdrawal triggers account suspension and the deletion/retention review workflow. | Must | Consent actions are audit-logged and notify the School Admin. Mirrors UR-ONB-090 and UR-ONB-096. |
| UR-ADM-095 | A Parent / Guardian shall be able to submit a data-subject request on behalf of a linked minor child — data export (machine-readable) and erasure — and track its status. | Must | Export and deletion fulfilled within the timelines of UR-ONB-096 (30 days GDPR, 45 days COPPA). Routed to School Admin / Super Admin for fulfilment. |
| UR-ADM-096 | A Parent / Guardian shall be able to set leaderboard and external-sharing visibility preferences for a linked minor child, including opting the child out of all leaderboards (see UR-GAM-053). | Must | Preference is respected immediately across all views and persists across Season resets. |
| UR-ADM-097 | A Parent / Guardian shall receive safeguarding notifications concerning their own child where the triage decision requires it (see UR-COMM-045), in plain, non-technical language. | Must | Notification content must not compromise an ongoing investigation or identify a reporting party. |

### Parent / Guardian MoSCoW Summary

| Priority | Requirement IDs |
|----------|-----------------|
| Must | UR-ADM-093, 094, 095, 096, 097 |
| Should | _(none; full parent portal is roadmap)_ |
| Could | _(none)_ |
| Won-t | _(full interactive parent dashboard deferred to roadmap per Section 1)_ |

---

## Cross-Tier Requirements

The following requirements apply across all administrative tiers or govern the shared infrastructure supporting administration.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-ADM-088 | All administrative console interfaces must be fully accessible to WCAG 2.2 Level AA, including keyboard navigation, screen-reader compatibility, sufficient colour contrast, and focus management in modal dialogs. | Must | Applies to Super Admin, School Admin, and Teacher consoles equally. |
| UR-ADM-089 | Administrative console interfaces must be responsive and usable on tablet-sized screens (minimum 768 px viewport width); desktop (1 280 px and above) is the primary target. | Must | Low-bandwidth optimisation must be applied: lazy-load large report tables, paginate data sets (default 25 rows per page, configurable to 50/100). |
| UR-ADM-090 | Every destructive administrative action (account deletion, tenant suspension, bulk rejection, data export) must require explicit confirmation from the acting user (two-step confirmation: preview then confirm) and must generate an immutable audit log entry containing: actor identity, action type, target entity, timestamp, and reason field value. | Must | Audit log entries must be viewable by Super Admin globally and by School Admin for their own tenant. |
| UR-ADM-091 | All data export files produced by the administration layer (CSV, PDF, JSON) must be generated server-side, delivered via a time-limited (24-hour) secure pre-signed download URL, and must not be cached on the CDN edge. | Must | Download URL generation must be logged; URL expiry must be enforced server-side. |
| UR-ADM-092 | The administration layer must enforce strict role-based access control: a Teacher must not access School Admin functions; a School Admin must not access data belonging to another tenant; a Platform Moderator must not access billing or platform configuration functions reserved for the Super Admin. | Must | RBAC enforcement must be applied at the API gateway and service level, not only the UI level. Any API call made outside the caller's RBAC scope must return HTTP 403 Forbidden and be logged as a security event. |

### Cross-Tier MoSCoW Summary

| Priority | Requirement IDs |
|----------|-----------------|
| Must | UR-ADM-088, 089, 090, 091, 092 |
| Should | _(none additional)_ |
| Could | _(none)_ |
| Won-t | _(none)_ |

---

## Administration Architecture Overview

The following ASCII block diagram illustrates the high-level relationship between administrative tiers, their consoles, and the underlying platform services:

```
+-------------------------------------------------------------+
|               RoboCode.Africa Administration Layer          |
+---------------------+---------------------------------------+
|   SUPER ADMIN       |   PLATFORM MODERATOR                  |
|   Global Console    |   Moderation Console                  |
|   - Tenant Mgmt     |   - Content Flags                     |
|   - Global Approvals|   - Safeguarding Escalations          |
|   - Content Library |   - User Bans                         |
|   - Platform Config |   - Approval Delegation               |
|   - Billing         |                                       |
|   - System Health   |                                       |
|   - Global Reports  |                                       |
+---------------------+---------------------------------------+
|               API Gateway (RBAC Enforcement)                |
+---------------------+---------------------------------------+
|   SCHOOL ADMIN (per Tenant)                                 |
|   School Console                                            |
|   - Student Mgmt & Approvals                                |
|   - Teacher Mgmt                                            |
|   - Teams & Seat Mgmt                                       |
|   - School Policies                                         |
|   - School Analytics & Reports                              |
+-----------------------------------------------------+-------+
|               Tenant Isolation (Postgres RLS)               |
+-----------------------------------------------------+-------+
|   TEACHER (per Class, within Tenant)                        |
|   Classroom Console                                         |
|   - Class & Student Mgmt                                    |
|   - Assignment Authoring & Publishing                       |
|   - Submission Inbox & Grading                              |
|   - Student Progress & Mentoring                            |
|   - Class Reports                                           |
+-------------------------------------------------------------+
            |                     |                |
     PostgreSQL           Redis (cache,     S3-compatible
  (multi-tenant,          queues, leader-    storage
   tenant_id + RLS)        boards)          (reports, exports)
```

---

## Key Principles

**Strict tier isolation.** Each administrative tier can only access data and actions within its defined scope. This is enforced at the API gateway via JWT claims and at the data layer via Postgres Row-Level Security (RLS), not only in the UI.

**Audit by default.** Every administrative action — approval, rejection, suspension, configuration change, data export, impersonation — produces an immutable, timestamped audit log entry. There are no administrative actions that leave no trace.

**Safety-first approval gates.** No student account is ever activated without an explicit human approval decision. No minor account is activated without both approval and verified parental consent. These gates cannot be bypassed programmatically or administratively.

**Data minimisation in reporting.** Analytics and reports surface the minimum data necessary for legitimate administrative purposes. Individual student personally identifiable information is not exposed in aggregate reports; Super Admin cross-tenant reports anonymise individual tenant students.

**Accessible, low-bandwidth consoles.** Administrative interfaces serve educators and administrators in African markets where bandwidth may be constrained. Server-side rendering, paginated data loads, and efficient exports are non-negotiable.

**RBAC at every layer.** Role boundaries are enforced at the API and data layers independently of the UI. A Teacher who crafts a direct API call cannot retrieve School Admin data; a School Admin cannot retrieve another tenant's data regardless of how the API is called.


# Use Cases

## Overview

This section presents the detailed use cases that express how users of every role interact with RoboCode.Africa to accomplish their primary goals. Each use case (UC-nnn) follows the IEEE 830 / ISO/IEC/IEEE 29148 template: unique identifier, title, actors, preconditions, main success flow, alternate and exception flows, and postconditions.

The use cases in this section are the primary bridge between the user requirements stated in Sections 6–16 and the user stories and acceptance criteria in **Section 18 (User Stories and Acceptance Criteria)**. Every use case traces to one or more user requirement IDs (UR-*) and, where relevant, to functional requirements in the System Specification Document (FR-* / SR-* / DR-*).

The full set covers:

| UC ID | Title | Primary Actor |
|-------|-------|---------------|
| UC-001 | School Registers and Configures Its Tenant | School Admin |
| UC-002 | School Admin Configures Custom Domain | School Admin |
| UC-003 | School Admin Applies White-Label Branding | School Admin |
| UC-004 | Student Signs Up via School Domain and Is Approved | Student, School Admin |
| UC-005 | Parent / Guardian Provides Verifiable Consent | Parent / Guardian |
| UC-006 | Super Admin Approves a Direct Signup | Super Admin / Platform Moderator |
| UC-007 | Super Admin Moderates Flagged Content | Super Admin / Platform Moderator |
| UC-008 | Student Builds and Simulates a Blink LED Project | Student |
| UC-009 | Student Builds an Ultrasonic Obstacle-Avoiding Robot | Student |
| UC-010 | Teacher Creates and Assigns a Coding Task | Teacher |
| UC-011 | Teacher Reviews and Grades a Student Submission | Teacher |
| UC-012 | Team Forms and Enters a Competition | Student, Teacher, School Admin |
| UC-013 | Student Earns RoboPoints and Rises on the Leaderboard | Student |
| UC-014 | Student Collaborates in Real Time on a Team Project | Student, Teacher |
| UC-015 | Teacher Authors a Block-Based Lesson for Primary Students | Teacher |
| UC-016 | School Admin Monitors School-Level Reports and Compliance | School Admin |

---

## Use Case Conventions

Each use case is presented with the following structure:

```
UC-nnn  Title
─────────────────────────────────────────────────────
Actor(s)         : Primary actor; secondary actors
Preconditions    : State of the system before the flow begins
Main Success Flow: Numbered steps of the primary path
Alternate Flows  : Alternative valid paths (A-nnn.n)
Exception Flows  : Error / failure paths (E-nnn.n)
Postconditions   : State of the system on success
Traces to        : UR-* requirement IDs
```

Steps that generate an audit log entry are marked **(AUDIT)**.
Steps that enforce a safety control are marked **(SAFETY)**.
Steps involving a minor are marked **(MINOR)**.

---

## UC-001 — School Registers and Configures Its Tenant

**Actor(s):** Primary — School Admin (prospective); Secondary — Super Admin, Platform Moderator

**Preconditions:**
- The school does not yet have an account on RoboCode.Africa.
- The prospective School Admin has access to a valid institutional email address.
- The `robocode.africa` marketing site is publicly accessible.

**Main Success Flow:**

1. The prospective School Admin navigates to `robocode.africa` and selects **Register Your School**.
2. The system presents the school registration form. The prospective School Admin enters: legal school name, country, physical address, school type (primary / secondary / both), estimated student count, their full name, institutional work email, contact phone number, and accepts the Platform Terms of Service and Data Processing Agreement.
3. The system validates all fields, checks that the email domain is not blocklisted, and submits the registration in **Unverified** status (pending email verification; per UR-ONB-056).
4. The system sends an email verification link to the submitted work email address. **(AUDIT)**
5. The prospective School Admin clicks the verification link within 48 hours.
6. The system transitions the registration to **Pending Admin Review** and notifies the Super Admin / Platform Moderator queue. **(AUDIT)**
7. A Super Admin or Platform Moderator reviews the submission in the Administration dashboard (see **Section 16: User Requirements: Administration and Reporting**), finds no issues, and clicks **Approve**.
8. The system provisions the tenant: creates the isolated database partition with `tenant_id` and Row-Level Security, auto-generates the school slug from the school name (e.g. `harare-high` → `harare-high.robocode.africa`), and transitions to **Activated — Pending School Admin Setup**. **(AUDIT)**
9. The system sends the School Admin an account-activation email containing a single-use link valid for 7 days.
10. The School Admin clicks the activation link, sets a strong password (minimum 12 characters: uppercase, lowercase, digit, symbol), and configures TOTP-based MFA before accessing the tenant dashboard. **(AUDIT)**
11. The system presents the **School Setup Wizard**: confirm/edit the school slug (3–48 characters, unique), upload a school logo, set primary brand colour, select the default student age group, and configure the default communication language.
12. The School Admin completes the wizard. The system saves the configuration, resolves `<slug>.robocode.africa` to the tenant's branded login page, and marks the tenant as **Active**. **(AUDIT)**

**Alternate Flows:**

- **A-001.1 — School Admin edits auto-generated slug:** At step 11, the School Admin types an alternative slug. The system performs a real-time availability check; if unique and format-valid, it accepts the slug. If not, it displays a validation error and suggests alternatives.
- **A-001.2 — Super Admin requests changes:** At step 7, the Super Admin selects **Request Changes**, enters a mandatory free-text reason, and the system emails the School Admin with the change request. The School Admin updates the registration and resubmits; the flow resumes from step 6.

**Exception Flows:**

- **E-001.1 — Email verification link expires:** If the School Admin does not click the link within 48 hours, the link expires. The School Admin must request a new link from the registration confirmation page; the system re-sends a fresh link. **(AUDIT)**
- **E-001.2 — Super Admin rejects the registration:** At step 7, the Super Admin selects **Reject**, provides a mandatory reason, and the system notifies the School Admin by email. The tenant is not provisioned. The School Admin may reapply after correcting the identified issues. **(AUDIT)**
- **E-001.3 — Activation link expires:** If the School Admin does not activate within 7 days of step 9, the link expires and the tenant is placed in **Provisioned — Activation Expired** status. The Super Admin is notified; a new activation link is issued on request.

**Postconditions (Success):**
- A new school tenant exists, is isolated by RLS, and is accessible at `<slug>.robocode.africa`.
- The School Admin account is active, MFA-protected, and holds the `School Admin` role scoped to this tenant.
- An immutable audit log records all state transitions.

**Traces to:** UR-SCH-001 through UR-SCH-008 (Section 8 school registration), UR-SCH-007 and UR-AUTH-016/UR-AUTH-017 (staff MFA), UR-SCH-090 through UR-SCH-095 (tenant isolation), FR-TEN-*, SR-001.

---

## UC-002 — School Admin Configures Custom Domain

**Actor(s):** Primary — School Admin; Secondary — DNS/ACME infrastructure (automated)

**Preconditions:**
- The school tenant is Active (UC-001 completed).
- The School Admin has access to their school's DNS registrar or DNS control panel.
- The desired custom domain (e.g. `code.myschool.edu`) is owned by the school.

**Main Success Flow:**

1. The School Admin navigates to **School Settings → Custom Domain** in the tenant dashboard.
2. The School Admin enters the desired custom domain name (e.g. `code.myschool.edu`) and selects **Add Domain**.
3. The system validates that the domain string is well-formed and is not already claimed by another tenant. **(AUDIT)**
4. The system generates a unique CNAME target and a TXT verification token and displays them to the School Admin in a step-by-step DNS instructions panel.
5. The School Admin logs in to their DNS registrar and adds both records:
   - `CNAME code.myschool.edu → <tenant-id>.proxy.robocode.africa`
   - `TXT _robocodeproof.code.myschool.edu → <verification-token>`
6. The School Admin returns to the dashboard and selects **Verify Domain**.
7. The system queries DNS for both records. Both records resolve correctly.
8. The system issues a TLS certificate for the custom domain via ACME / Let's Encrypt, stores the certificate, and configures the edge routing layer to serve the tenant at the custom domain. **(AUDIT)**
9. The system marks the custom domain as **Active** and displays a success confirmation. Within 5 minutes the custom domain serves the tenant's branded login page over HTTPS.

**Alternate Flows:**

- **A-002.1 — DNS propagation delay:** At step 7, DNS records are not yet visible due to propagation delay. The system schedules an automatic retry every 15 minutes for up to 48 hours and notifies the School Admin by email once verification succeeds.
- **A-002.2 — School Admin removes the custom domain:** At any point after step 9, the School Admin may navigate to **Custom Domain → Remove** to detach the custom domain. The system revokes the certificate and restores service to the subdomain only. **(AUDIT)**

**Exception Flows:**

- **E-002.1 — Domain already claimed:** At step 3, if the domain is claimed by another tenant, the system displays an error and instructs the School Admin to contact platform support. **(AUDIT)**
- **E-002.2 — ACME certificate issuance fails:** At step 8, if Let's Encrypt rate-limits or fails, the system retries using exponential backoff, notifies the Super Admin, and displays a pending notice to the School Admin. The subdomain continues to function during the retry window.
- **E-002.3 — Verification timeout:** If DNS records are not verified within 48 hours, the pending request is cancelled, the School Admin is notified by email, and the domain may be resubmitted.

**Postconditions (Success):**
- The custom domain resolves to the tenant's branded login page over HTTPS.
- The school subdomain continues to function in parallel.
- An audit record captures the domain addition, verification, and certificate issuance timestamps.

**Traces to:** UR-SCH-020 through UR-SCH-030, FR-TEN-020, SR-002.

---

## UC-003 — School Admin Applies White-Label Branding

**Actor(s):** Primary — School Admin

**Preconditions:**
- The school tenant is Active.
- The School Admin is authenticated and has navigated to **School Settings → Branding**.

**Main Success Flow:**

1. The School Admin opens the **Branding** panel. The system displays a live preview panel alongside the configuration controls.
2. The School Admin uploads a school logo (PNG or SVG, max 2 MB). The system validates the file, generates optimised variants (favicon, navbar logo, email header), and stores them in S3-compatible object storage.
3. The School Admin sets a primary brand colour using the colour-picker or by entering a hex code. The system derives a full design-token palette (primary, secondary, surface, text, accent) from the chosen colour using the platform's white-label token generator and applies them to the live preview.
4. The School Admin optionally sets a custom landing-page tagline (max 120 characters) and a school-specific welcome message displayed to students on first login.
5. The School Admin selects **Save Branding**. The system validates and persists the branding configuration.
6. The system applies the new design tokens to all pages served under the tenant's subdomain and custom domain (if configured). The change propagates to the CDN edge within 60 seconds.
7. The system logs the branding change with the acting user's identity and a before/after record. **(AUDIT)**

**Alternate Flows:**

- **A-003.1 — School Admin resets branding to platform defaults:** The School Admin selects **Reset to Default**. The system removes all custom tokens, reverts to the RoboCode.Africa default theme, and logs the reset. **(AUDIT)**

**Exception Flows:**

- **E-003.1 — Invalid logo file:** If the uploaded file exceeds 2 MB or is not PNG/SVG, the system rejects it with a clear error message and does not alter the existing logo.
- **E-003.2 — Colour accessibility failure:** If the derived palette produces insufficient contrast ratios (below WCAG 2.2 AA 4.5:1 for normal text), the system displays a warning in the live preview, highlights the failing elements, and requires the School Admin to adjust the colour before saving. Core safety features (moderation banners, consent notices) cannot be overridden by tenant branding.

**Postconditions (Success):**
- The tenant's subdomain and custom domain display the school logo and brand colours across all authenticated and public-facing pages.
- An audit record captures the change.

**Traces to:** UR-SCH-040 through UR-SCH-047, FR-TEN-030, NFR-ACCESS-001.

---

## UC-004 — Student Signs Up via a School Domain and Is Approved

**Actor(s):** Primary — Student; Secondary — School Admin; Tertiary — Parent / Guardian (if minor) **(MINOR)**

**Preconditions:**
- The school tenant is Active.
- The Student has been given the school subdomain URL or custom domain URL by a Teacher or School Admin.
- The Student does not yet have an account on RoboCode.Africa.

**Main Success Flow:**

1. The Student navigates to the school's URL (e.g. `harare-high.robocode.africa`) and selects **Sign Up as Student**.
2. The system presents the student registration form branded with the school's identity. The Student enters: chosen display name, email address, year/grade level, and a password. The system collects date of birth to determine if parental consent is required. **(MINOR)**
3. The system validates fields and determines the student's age against the applicable consent threshold (under 13 for COPPA; under 16 for GDPR-K; the most restrictive applicable threshold is used). **(SAFETY)**
4. If the student is above the consent threshold: the system sends an email verification link to the student's email and places the registration in **Unverified** status (pending email verification; per UR-ONB-056).
5. The Student clicks the verification link. The system transitions the registration to **Pending School Admin Approval** and notifies the School Admin. **(AUDIT)**
6. The School Admin reviews the pending student in the **Approval Queue** of the school dashboard, verifies the student's grade and enrolment legitimacy, and selects **Approve**. **(AUDIT)**
7. The system activates the Student account, assigns the `Student` role scoped to this tenant, sends the Student a welcome email with login instructions, and optionally enrolls them in the default class if the School Admin has configured auto-enrollment.
8. The Student logs in and completes a first-login profile setup (avatar selection from an approved gallery, optional bio, preferred coding language). The system records the completed first-login timestamp.

**Alternate Flows:**

- **A-004.1 — Student is a minor (consent required):** At step 3, if the student is below the consent threshold, after step 4 the system additionally initiates the parental consent workflow (see UC-005). The account remains in **Pending Parental Consent** status until consent is received; thereafter it enters **Pending School Admin Approval** and the flow continues from step 6.
- **A-004.2 — School Admin bulk-invites students:** The School Admin uploads a CSV of student names and email addresses. The system generates invitation links for each student. Students who click their invitation link are pre-assigned to the correct class and bypass some registration fields. The approval step at step 6 is still required unless the School Admin has enabled auto-approval for CSV-invited students.

**Exception Flows:**

- **E-004.1 — Email already registered:** If the email address at step 2 is already registered (in any tenant or at the main domain), the system informs the student and offers a **Sign In** link instead.
- **E-004.2 — School Admin rejects the signup:** At step 6, the School Admin selects **Reject** and provides a mandatory reason. The system notifies the Student by email. The account is not activated. The student may contact the School Admin to resolve the issue and reapply.
- **E-004.3 — Email verification link expires:** If the Student does not verify their email within 48 hours, the link expires. The Student may request a resend from the login page.

**Postconditions (Success):**
- The Student account is Active, scoped to the school tenant, and the Student can log in and access RoboCode Studio.
- If applicable, parental consent is on record.
- An audit log captures registration, email verification, and approval timestamps.

**Traces to:** UR-ONB-001 through UR-ONB-020, UR-ONB-090 through UR-ONB-096 (minor protections), FR-AUTH-010, DR-001.

---

## UC-005 — Parent / Guardian Provides Verifiable Consent

**Actor(s):** Primary — Parent / Guardian; Secondary — Student (minor), School Admin **(MINOR) (SAFETY)**

**Preconditions:**
- A minor Student has completed the registration form (UC-004, step 2–3) and been identified as below the consent age threshold.
- The Parent / Guardian's email address has been captured from the Student's registration form.
- The Student account is in **Pending Parental Consent** status.

**Main Success Flow:**

1. The system sends a consent request email to the Parent / Guardian's email address. The email includes: the platform name and logo, a plain-language description of data collected and how it is used (COPPA/GDPR-K notice), a list of features the child will access, and a secure consent link valid for 7 days.
2. The Parent / Guardian opens the consent link. The system presents the Parental Consent form, which includes: the full consent notice (data minimisation policy, no behavioural advertising, no private messaging for minors, right to withdraw consent, right to erasure), and requires the Parent / Guardian to enter: their full name, their relationship to the child, and confirmation of the child's name and date of birth.
3. The Parent / Guardian reads the notice, checks **I have read and understood the above**, and selects **Give Consent**. **(SAFETY)**
4. The system records the consent: consenting adult's name, relationship, email address, IP address, timestamp, platform privacy policy version, and consent record ID. This record is stored immutably in the audit database. **(AUDIT)**
5. The system transitions the student registration from **Pending Parental Consent** to **Pending School Admin Approval** (if not already in that state) and notifies the School Admin.
6. The system sends a confirmation email to the Parent / Guardian acknowledging that their consent has been recorded and explaining how to withdraw consent.

**Alternate Flows:**

- **A-005.1 — Parent / Guardian declines consent:** At step 3, the Parent / Guardian selects **Decline**. The system records the decline, notifies the Student (at their own email, if provided), and places the student account in **Consent Declined — Not Activated** status. The decline is logged. **(AUDIT)**
- **A-005.2 — Parent / Guardian withdraws previously given consent:** At any point after step 4, the Parent / Guardian may click the **Withdraw Consent** link in their confirmation email or log in to the Parental Consent portal. The system deactivates the minor's account, initiates the data deletion / retention review workflow (see UR-ONB-096), notifies the School Admin, and logs the withdrawal. **(AUDIT)**

**Exception Flows:**

- **E-005.1 — Consent link expires:** If the consent link is not used within 7 days, it expires. The system sends a reminder email to the Parent / Guardian at day 5. If still unused at day 7, the system notifies the School Admin that consent is overdue; the School Admin may request the system to re-send the consent request email.
- **E-005.2 — Suspected fraudulent consent:** If the consent email address domain matches the student's own email domain (suggesting self-consent), the system flags the record for Platform Moderator review before activating the account. **(SAFETY) (AUDIT)**

**Postconditions (Success):**
- An immutable parental consent record is stored.
- The minor Student's account may proceed to School Admin approval.
- The Parent / Guardian has received confirmation and understands their rights.

**Traces to:** UR-ONB-015, UR-ONB-027 through UR-ONB-036 (consent gate), UR-ONB-090, UR-ONB-096, SR-003, DR-002, FR-AUTH-015.

---

## UC-006 — Super Admin Approves a Direct Signup

**Actor(s):** Primary — Super Admin or Platform Moderator; Secondary — Student (direct signup)

**Preconditions:**
- A Student has self-registered at `robocode.africa` (not via a school domain) and completed email verification.
- If a minor, parental consent has been received (UC-005).
- The student account is in **Pending Approval** status in the platform's central approval queue (per UR-ONB-056).

**Main Success Flow:**

1. The Super Admin or Platform Moderator logs in to the Administration Dashboard and navigates to **Signup Approval Queue → Direct Signups**.
2. The queue displays all pending direct-signup student accounts sorted by submission date, showing: display name, email domain, country, age group, and consent status.
3. The Super Admin / Platform Moderator selects a pending account and reviews the details. The system displays the full registration record including submitted data, email verification timestamp, and (if minor) consent record.
4. The Super Admin / Platform Moderator optionally performs a content-safety check: verifies the display name does not contain profanity, PII, or inappropriate content. **(SAFETY)**
5. The Super Admin / Platform Moderator selects **Approve**. **(AUDIT)**
6. The system activates the Student account in the direct-signup space (accessible at `robocode.africa`), sends the Student a welcome email with login instructions, and removes the record from the approval queue.

**Alternate Flows:**

- **A-006.1 — Platform Moderator reviews in bulk:** The Platform Moderator can select multiple records and perform a bulk approve action for straightforward cases. Each approval is individually logged with the Moderator's identity. **(AUDIT)**
- **A-006.2 — Super Admin requests clarification:** At step 3, the Super Admin selects **Request Information**, enters a message, and the system emails the Student. The account remains Pending until the student responds and the Super Admin re-reviews.

**Exception Flows:**

- **E-006.1 — Super Admin rejects the signup:** At step 5, the Super Admin / Platform Moderator selects **Reject**, provides a mandatory reason (selected from a categorised dropdown: suspected fraud, inappropriate display name, missing consent, duplicate account, other), and the system notifies the Student by email with a brief explanation (not disclosing moderation details). **(AUDIT)**
- **E-006.2 — Minor consent missing or fraudulent:** If a minor's consent record is flagged (see UC-005, E-005.2), the system blocks the approval option and requires the Platform Moderator to resolve the consent flag first. **(SAFETY)**

**Postconditions (Success):**
- The Student account is Active at `robocode.africa` and the Student can access RoboCode Studio.
- An audit log records the approving actor, timestamp, and rationale.

**Traces to:** UR-ONB-010, UR-ONB-012 through UR-ONB-015, UR-ADM-008 through UR-ADM-012 (signup approvals), FR-AUTH-010, SR-004.

---

## UC-007 — Super Admin Moderates Flagged Content

**Actor(s):** Primary — Super Admin or Platform Moderator; Secondary — Teacher (reporter), Student (subject) **(SAFETY)**

**Preconditions:**
- A piece of content (project description, forum post, code comment, or display name) has been flagged either automatically by the profanity/PII filter or manually by a Teacher, School Admin, or Student.
- The Super Admin or Platform Moderator is logged in and navigating the **Moderation Queue**.

**Main Success Flow:**

1. The system displays the Moderation Queue, listing flagged items in priority order. Each item shows: content type, snippet, flagging source (automated filter or reporter role), tenant (if applicable), timestamp, and a severity indicator.
2. The Super Admin / Platform Moderator opens a flagged item. The system presents: the full content in context, the flag reason, the reporter identity (visible to moderators, not to the subject), and the subject user's account history and prior flags.
3. The moderator reviews the content and determines a disposition:
   - **Clear** — flag was a false positive; content is restored/published without action.
   - **Edit/Redact** — moderator removes the offending text and notifies the user with guidance.
   - **Remove** — content is removed and the user receives a warning notification.
   - **Suspend Account** — for severe/repeated violations; account is suspended pending review.
   - **Escalate (Safeguarding)** — content contains indicators of child abuse, self-harm, or criminal activity; the system triggers the safeguarding escalation protocol. **(SAFETY)**
4. The moderator selects a disposition and adds a mandatory moderator note. **(AUDIT)**
5. The system applies the disposition, logs every action with the moderator's identity, the content hash, and a timestamp, and notifies the affected user of the outcome (without revealing the reporter identity or internal notes). **(AUDIT)**
6. If the tenant has a School Admin, the system notifies the School Admin of any moderation actions taken on students within their school. **(AUDIT)**

**Alternate Flows:**

- **A-007.1 — School Admin moderates within tenant:** A School Admin may access a tenant-scoped moderation queue and apply Clear, Edit/Redact, or Remove dispositions for their own tenant's content. Actions that rise to Suspend or Escalate are forwarded to the Super Admin / Platform Moderator and flagged for cross-tenant review.

**Exception Flows:**

- **E-007.1 — Safeguarding escalation:** At step 3, if the moderator selects **Escalate (Safeguarding)**, the system immediately: preserves the content in a locked evidence store, notifies the Super Admin, generates a safeguarding incident report, and (per the school's configured policy) may send an email notification to the School Admin and the associated school's safeguarding lead. A mandatory follow-up timer is set; if not resolved within 24 hours, the system sends an escalation reminder. **(SAFETY) (AUDIT)**
- **E-007.2 — Moderator conflict of interest:** If the content involves the moderator's own school (Platform Moderator with school affiliation), the system assigns the item to a different available moderator or escalates to a Super Admin.

**Postconditions (Success):**
- The flagged content has been dispositioned and an immutable audit record exists.
- The affected user and (where applicable) the School Admin have been notified.
- If safeguarding was triggered, the incident is being tracked to resolution.

**Traces to:** UR-COMM-018 through UR-COMM-035 (moderation and reporting), UR-ADM-018 through UR-ADM-021 (global moderation console), SR-005, FR-MOD-*, DR-003.

---

## UC-008 — Student Builds and Simulates a Blink LED Project

**Actor(s):** Primary — Student

**Preconditions:**
- The Student is authenticated and their account is Active.
- The Student has navigated to RoboCode Studio (either from the dashboard or from an assigned task).
- The Student has basic familiarity with the Studio interface (or is following a guided lesson step).

**Main Success Flow:**

1. The Student selects **New Project** in RoboCode Studio. The system creates an empty project workspace with the canvas panel on the left, the code editor on the right, and the component panel on the top or side.
2. The Student opens the **Components** panel and locates the **Arduino UNO R3** board. They drag it onto the canvas. The system renders the UNO R3 using the wokwi-elements web component with all GPIO pin labels visible.
3. The Student drags a **full-size breadboard** (830 tie-points) onto the canvas and positions it below the UNO.
4. The Student drags a **red LED** component and a **220 ohm resistor** onto the breadboard. The system renders them in the correct tie-point rows.
5. The Student uses the wiring tool to connect: a jumper wire from UNO pin D13 to the resistor's anode row on the breadboard; a wire from the resistor to the LED anode; a wire from the LED cathode row to the GND rail; and a wire from the UNO GND pin to the breadboard GND rail.
6. The system validates the electrical connections in real time, highlights any open circuits or short circuits in the wiring overlay, and shows a connection status indicator. All connections are valid.
7. The Student switches to the **Code** tab. The system opens the Monaco editor pre-populated with the Arduino C/C++ skeleton (`setup()` and `loop()` functions) for the UNO. Autocomplete and syntax highlighting are active.
8. The Student writes the Blink sketch:

   ```
   void setup() {
     pinMode(13, OUTPUT);
   }
   void loop() {
     digitalWrite(13, HIGH);
     delay(1000);
     digitalWrite(13, LOW);
     delay(1000);
   }
   ```

9. The Student selects **Run Simulation**. The RoboCode Simulation Engine (RSE) compiles the sketch via the in-browser WASM toolchain (or compile microservice), loads the firmware into the avr8js ATmega328P simulator (for the Arduino UNO R3; rp2040js is used for Raspberry Pi Pico projects), and begins execution.
10. The LED component on the canvas animates: it illuminates red for one second and extinguishes for one second, repeating the blink cycle. The Serial Monitor panel shows no output (no `Serial.print` calls).
11. The Student selects **Pause** to halt the simulation. They modify the `delay` value to 500ms and select **Run** again. The LED blinks faster.
12. The Student selects **Save Project**, enters the project name "Blink LED", and the system saves the project (canvas state as JSON, code as a text file) to the database associated with the student's account.
13. If the project was opened from an assigned task, the Student selects **Submit for Grading**. The system creates a submission record linked to the task and notifies the Teacher. (See UC-011.)

**Alternate Flows:**

- **A-008.1 — Student uses 3D view:** At any step, the Student may toggle the canvas to 3D view. The system renders the UNO, breadboard, LED, and wires in Three.js / React Three Fiber. Simulation behaviour is identical.
- **A-008.2 — Student uses Block-Based mode (primary school):** For younger students (primary-school sub-class or block mode enabled by Teacher), the code editor presents a block-based interface. The student drags a `set pin 13 to OUTPUT` block and a `blink pin 13 every 1 second` block. The system transpiles the blocks to Arduino C/C++ and executes identically from step 9.
- **A-008.3 — Low-end device fallback:** If the browser does not support WebGL2, the system detects this and serves the 2D wokwi-elements canvas only. A notice informs the student that 3D view is unavailable.
- **A-008.4 — Student uses Raspberry Pi Pico board:** Instead of the Arduino UNO R3, the Student selects the **Raspberry Pi Pico (RP2040)** from the Components panel (sourced from the built-in wokwi-boards library). The blink sketch is written in MicroPython, CircuitPython, or C/C++ (Arduino-Pico core). The RSE loads the compiled UF2/ELF firmware image into the rp2040js simulator; the LED connected to a GPIO pin (e.g. GP15) blinks identically. The pin wiring and code differ from the UNO example but all simulation steps (steps 9–13) proceed in the same manner.

**Exception Flows:**

- **E-008.1 — Compilation error:** At step 9, if the code contains a syntax error, the RSE returns the compiler error output. The Monaco editor underlines the offending line(s) and the error is displayed in an error panel below the editor. The simulation does not start. The student corrects the code and retries.
- **E-008.2 — Open circuit detected:** At step 6, if the LED is wired without a resistor (short/overload path), the system highlights the connection in red and displays a circuit warning: "LED may be damaged without a current-limiting resistor." The simulation may still run but the LED component shows a visual "burnt" state and a warning badge.
- **E-008.3 — Project save fails:** If the network drops briefly at step 12, the system buffers the in-progress save in the active browser session (short-lived transient buffer) and displays a "Save pending — reconnecting" notice, retrying automatically when connectivity returns. This is transient in-session resilience only; persistent offline operation/PWA is out of scope for v1.0 (Section 1; UR-NFR-A003). If connectivity is not restored within the session, the user is warned before unload.

**Postconditions (Success):**
- The project is saved to the student's account.
- The LED blinks in the simulator as coded.
- If submitted for grading, a submission record exists and the Teacher is notified.

**Traces to:** UR-STU-001, UR-STU-005, UR-SIM-001 through UR-SIM-015, UR-CODE-001, UR-CODE-005, FR-SIM-010, FR-CODE-020.

---

## UC-009 — Student Builds an Ultrasonic Obstacle-Avoiding Robot

**Actor(s):** Primary — Student (typically high-school)

**Preconditions:**
- The Student is authenticated, account Active, and has intermediate RoboCode Studio experience.
- A task "Build an Obstacle-Avoiding Robot" has been assigned by the Teacher (see UC-010), or the Student is creating a free project.

**Main Success Flow:**

1. The Student creates a new project in RoboCode Studio and drags an **Arduino UNO R3** onto the canvas.
2. The Student adds the following components from the catalogue and places them on the canvas: full-size breadboard, **HC-SR04 ultrasonic distance sensor**, **L298N dual H-bridge motor driver module**, two **DC motors**, one **active buzzer**.
3. The Student wires the circuit:
   - HC-SR04 VCC → 5V; GND → GND; TRIG → D9; ECHO → D10.
   - L298N: ENA → D5 (PWM), IN1 → D6, IN2 → D7, ENB → D4 (PWM), IN3 → D2, IN4 → D3; Motor-A and Motor-B terminals to respective DC motors.
   - Active buzzer: positive → D11, negative → GND.
   - L298N 12V input → UNO Vin (or external supply); GND → common GND.
4. The system validates all pin assignments and electrical connections and confirms no conflicts.
5. The Student opens the Code tab and writes the obstacle-avoidance sketch in Arduino C/C++, using `#include <NewPing.h>` for the HC-SR04. The sketch reads distance, stops and sounds the buzzer if an obstacle is detected within 20 cm, otherwise drives the motors forward.
6. The Student selects **Run Simulation**. The RSE compiles the firmware and loads it into the avr8js simulator.
7. The simulation canvas displays the robot circuit. The Student uses the **Sensor Control Panel** to simulate HC-SR04 distance readings by dragging a virtual obstacle slider.
8. When the slider is moved to 15 cm (within 20 cm threshold): the motor outputs go LOW (motors stop in simulation), the buzzer component activates (WebAudio tone plays through the browser speaker), and the Serial Monitor shows "Obstacle detected at 15 cm — stopping".
9. When the slider is moved to 50 cm: motors resume, buzzer deactivates, Serial Monitor shows "Path clear — moving forward".
10. The Student saves the project and, if task-assigned, submits for grading.

**Alternate Flows:**

- **A-009.1 — ESP32 variant:** The Student replaces the UNO with an **ESP32 DevKit** board. The pin assignments change. MicroPython is selected as the language. The RSE switches to the ESP32 core simulation. The NewPing library is replaced by MicroPython equivalent code using machine.Pin and direct timing.
- **A-009.2 — Raspberry Pi Pico variant:** The Student replaces the UNO with a **Raspberry Pi Pico (RP2040)** board (from the wokwi-boards built-in library). The HC-SR04 TRIG/ECHO lines are rewired to two GP pins (e.g. GP9/GP10); the L298N motor control signals go to additional GP pins. The code is written in MicroPython or C/C++ (Arduino-Pico core). The RSE loads the compiled UF2/ELF firmware into the rp2040js simulator; sensor and motor simulation proceed identically to the UNO path.
- **A-009.3 — Wiring error assistance:** If the Student wires ECHO to a non-interrupt-capable pin and the system detects a known incompatibility, it displays a contextual hint: "HC-SR04 ECHO typically connected to a digital input pin. Consider D10 or D2."

**Exception Flows:**

- **E-009.1 — Library not found:** At step 5, if `NewPing.h` is not in the approved library catalogue, the compiler returns an error. The code editor's autocomplete suggests the correct import path from the platform's supported library list. The student selects the correct library and the code compiles.
- **E-009.2 — Pin conflict:** If the Student assigns two components to the same pin, the system highlights both conflicting assignments in the wiring overlay and displays a conflict warning before simulation is attempted.

**Postconditions (Success):**
- The obstacle-avoidance circuit is wired and simulated correctly.
- The simulation responds accurately to virtual sensor inputs.
- Project saved; submission sent to Teacher if task-assigned.

**Traces to:** UR-STU-010, UR-SIM-020 through UR-SIM-030, UR-CODE-010, FR-SIM-020, FR-CODE-030.

---

## UC-010 — Teacher Creates and Assigns a Coding Task

**Actor(s):** Primary — Teacher; Secondary — Students (recipients)

**Preconditions:**
- The Teacher is authenticated with the `Teacher` role scoped to their tenant.
- At least one class exists with enrolled, Active students.
- The Teacher has navigated to **My Classes → [Class Name] → Assignments**.

**Main Success Flow:**

1. The Teacher selects **Create Assignment**. The system presents the assignment authoring form.
2. The Teacher enters: assignment title, description (rich text with code snippets and image attachments), learning objectives (selectable from the curriculum tag taxonomy), target grade level, estimated duration (minutes), and due date/time.
3. The Teacher selects the starter project type: **Blank Project**, **Template** (from the global or school content library), or **Fork of an existing project**. The system attaches the selected starter to the assignment.
4. The Teacher configures grading criteria using the rubric builder: adds rubric rows (e.g. "Circuit correctly wired — 30 pts", "Code compiles without errors — 20 pts", "Simulation behaves as specified — 50 pts"), and sets the total point value.
5. The Teacher configures the RoboPoints reward for successful completion (e.g. 150 RoboPoints for full marks). **(GAM)**
6. The Teacher assigns the task to one or more classes. The system displays a student count preview.
7. The Teacher selects **Publish**. The system creates the assignment record, associates it with the selected classes, and sends an in-platform notification and email to each enrolled Student. **(AUDIT)**
8. The assignment appears in each Student's **My Tasks** dashboard with the due date, description, starter project link, and RoboPoints potential.

**Alternate Flows:**

- **A-010.1 — Teacher saves as draft:** At step 7, the Teacher selects **Save as Draft**. The assignment is not visible to students. The Teacher may continue editing and publish later.
- **A-010.2 — Teacher schedules a future publish time:** The Teacher sets a **Publish At** date/time. The system publishes the assignment automatically at the scheduled time.
- **A-010.3 — Teacher imports from global content library:** At step 3, the Teacher selects a task template authored by the RoboCode.Africa content team from the global library, customises the description and rubric, and publishes.

**Exception Flows:**

- **E-010.1 — No enrolled students:** If the selected class has zero enrolled Active students, the system warns the Teacher and prevents publishing until at least one student is enrolled.
- **E-010.2 — RoboPoints value exceeds school policy maximum:** If the School Admin has set a per-task RoboPoints cap and the Teacher's value exceeds it, the system displays a validation error and shows the allowable maximum.

**Postconditions (Success):**
- The assignment is visible in each enrolled Student's task list.
- Students receive notification of the new task.
- An audit log records the assignment creation and publication.

**Traces to:** UR-LRN-001 through UR-LRN-015, UR-GAM-010, FR-LRN-010, FR-GAM-005.

---

## UC-011 — Teacher Reviews and Grades a Student Submission

**Actor(s):** Primary — Teacher; Secondary — Student

**Preconditions:**
- An assignment exists and has been published (UC-010).
- At least one Student has submitted their project for grading (UC-008, step 13).
- The Teacher is authenticated and navigates to **My Classes → [Class] → Assignments → [Assignment] → Submissions**.

**Main Success Flow:**

1. The Teacher opens the Submissions panel. The system lists all student submissions, showing: student display name, submission timestamp, submission status (Submitted / Late / Draft), and current grade (blank for ungraded).
2. The Teacher selects a student submission. The system opens the submission view, which displays: a read-only (teacher-view) copy of the student's RoboCode Studio project (canvas + code), the submission timestamp, and the assignment rubric.
3. The Teacher launches the simulation in review mode. The RSE runs the student's saved firmware/code in the simulator, allowing the Teacher to interact with sensor controls and verify behaviour.
4. The Teacher scores each rubric row by clicking a point value or entering a score. The system running total updates in real time.
5. The Teacher adds inline code annotations: highlights specific lines in the Monaco editor and attaches comments (e.g. "Good use of PWM for speed control" or "Missing `delay()` in loop — motor will spin at full speed without control").
6. The Teacher enters overall written feedback in the Summary Feedback text area.
7. The Teacher selects **Submit Grade**. The system saves the grade record, marks the submission as **Graded**, and sends the Student an in-platform notification and email: "Your submission for [Assignment] has been graded." **(AUDIT)**
8. The Student can view their grade, rubric scores, inline annotations, and overall feedback in their **My Tasks → [Assignment] → My Submission** view. **(MINOR)** — Grade data is not shared with other students.

**Alternate Flows:**

- **A-011.1 — Teacher returns submission for revision:** Instead of submitting a grade, the Teacher selects **Return for Revision**, adds mandatory feedback notes, and the Student's submission status reverts to **Revision Required**. The Student may resubmit once before the due date.
- **A-011.2 — Auto-grading of objective criteria:** If the assignment has auto-gradeable criteria (e.g. "Code must compile without errors"), the system automatically scores those rubric rows on submission and pre-fills the Teacher's rubric. The Teacher reviews and may override the auto-grade.

**Exception Flows:**

- **E-011.1 — Student project fails to load in review mode:** If the saved project JSON is corrupted or a required component model is missing, the system displays an error and offers the Teacher a raw JSON view of the project file. The Teacher may still enter manual grades and feedback.
- **E-011.2 — Late submission:** If the submission timestamp is after the due date, the system displays a **LATE** badge on the submission. The Teacher may apply a late penalty per the rubric or override and accept the submission at full marks.

**Postconditions (Success):**
- The submission is graded and the grade record is stored.
- The Student receives their grade and feedback.
- If RoboPoints were configured, the system awards them to the Student (see UC-013).
- An audit log records the grading event.

**Traces to:** UR-LRN-020 through UR-LRN-030, UR-GAM-015, FR-LRN-020, FR-GAM-010.

---

## UC-012 — Team Forms and Enters a Competition

**Actor(s):** Primary — Teacher; Secondary — Students, School Admin, Super Admin

**Preconditions:**
- A competition has been created (by Super Admin for platform-wide, or School Admin for school-internal).
- The school has been enrolled in the competition by the School Admin.
- The Teacher has been authorised by the School Admin to form teams for this competition.

**Main Success Flow:**

1. The Teacher navigates to **Competitions → [Competition Name] → Teams** and selects **Create Team**.
2. The Teacher enters a team name, selects up to 4 students from their enrolled classes, and assigns themselves as Team Mentor. The system validates that all selected students are Active and enrolled in the current tenant. **(AUDIT)**
3. Each selected Student receives an in-platform notification: "You have been added to team [Team Name] for [Competition]. Accept or Decline?"
4. Each Student logs in, views the team invitation, and selects **Accept**. On acceptance, the Student's team membership is confirmed.
5. The Teacher creates a Collaborative Project for the team in RoboCode Studio. The system creates a shared Yjs CRDT document and provisions a real-time collaborative workspace. **(AUDIT)**
6. Team members work collaboratively on the project (see UC-014). The Teacher monitors progress via the read-only mentor view.
7. When the project meets the team's quality criteria, the Teacher marks the submission as **Eligible for Competition Entry** in the team project dashboard.
8. One designated team member (or the Teacher) opens the competition submission form, attaches the team project, enters a project title, description (max 300 words), and a short video/screenshot (optional), and selects **Submit to Competition**. **(AUDIT)**
9. The system records the competition submission, timestamps it, confirms it is within the competition deadline, and sends a confirmation notification to all team members and the Teacher.
10. After the competition judging period, the results are published. Students and Teachers receive a notification. The competition leaderboard is updated.

**Alternate Flows:**

- **A-012.1 — Student-initiated team (Teacher-sanctioned):** A Teacher enables student-led team formation for a specific competition. A Student selects **Form a Team**, invites peers from the same class, and the system creates the team pending Teacher confirmation. The Teacher must confirm before the team is official.
- **A-012.2 — Competition extends the deadline:** The Super Admin or School Admin extends the competition deadline. The system notifies all enrolled teams and updates the submission portal's displayed deadline.

**Exception Flows:**

- **E-012.1 — Student declines team invitation:** At step 4, a Student declines. The system notifies the Teacher, who may invite a replacement student or proceed with a smaller team (if the competition rules allow).
- **E-012.2 — Submission after deadline:** At step 8, if the submission timestamp is past the competition closing time, the system rejects the submission, notifies the team and Teacher with the closure message, and does not create a competition entry.
- **E-012.3 — Team project contains flagged content:** Before competition submission is confirmed, the system runs the profanity/PII filter on the project title and description. If flagged, the submission is held in **Pending Moderation** status. **(SAFETY) (AUDIT)**

**Postconditions (Success):**
- The team's project is recorded as a competition entry before the deadline.
- All team members and the Teacher are notified.
- On competition close, results are published and RoboPoints are awarded (if configured).

**Traces to:** UR-TEAM-001 through UR-TEAM-020, UR-GAM-020, FR-TEAM-010, FR-GAM-015.

---

## UC-013 — Student Earns RoboPoints and Rises on the Leaderboard

**Actor(s):** Primary — Student; Secondary — Platform (automated gamification engine), Teacher

**Preconditions:**
- The Student is Active and enrolled in at least one class.
- One or more RoboPoints-earning events have occurred (task submission, graded assignment, first simulation run, badge unlocked, competition result).

**Main Success Flow:**

1. A qualifying event occurs — for example, the Teacher submits a grade for the student's assignment and the assignment awards 150 RoboPoints on completion (as configured in UC-010, step 5).
2. The gamification engine computes the RoboPoints award: base points (150) plus any multipliers (e.g. ×1.2 if submitted before the due date, ×1.5 if first attempt earns full marks). The computed award is logged.
3. The system credits the RoboPoints to the Student's account balance and appends a timestamped entry to the Student's RoboPoints history ledger. **(AUDIT)**
4. The system evaluates badge rules. If the credit pushes the Student's total past a badge threshold (e.g. "Circuit Champion — first simulation run graded ≥ 80%"), the badge is unlocked and the Student receives an in-platform toast notification: "Badge unlocked: Circuit Champion!"
5. The system recalculates the Student's rank on three leaderboards: class, school, and (if not opted out) platform-wide.
6. The Student's rank has improved. The system sends a rank-up notification if the Student enters the top 10 of their class or school leaderboard: "You've climbed to 4th in your class!"
7. The Student navigates to **My Profile → RoboPoints** and views: total balance, rank, badge collection, and a full transaction history showing each earning event, the source (graded by Teacher, first-time simulation, competition bonus, etc.), and the timestamp.
8. The Student optionally views the **Class Leaderboard** and the **School Leaderboard**. For minors, the platform-wide leaderboard displays an anonymised handle unless the parent has enabled full public visibility (per UR-ONB-093).

**Alternate Flows:**

- **A-013.1 — Teacher awards bonus RoboPoints manually:** A Teacher navigates to a student's profile within their class and selects **Award Bonus RoboPoints**, enters a value and a mandatory reason (e.g. "Outstanding project presentation"). The system credits the points and logs the manual award, including the Teacher's identity. **(AUDIT)**
- **A-013.2 — Student opts out of public leaderboard:** The Student (or their Parent for a minor) navigates to **Account Settings → Privacy → Leaderboard Visibility** and sets visibility to **Class Only**. The system immediately removes the student from the platform-wide and school leaderboards without removing their RoboPoints balance or badges.

**Exception Flows:**

- **E-013.1 — Duplicate point award:** If a grading event is re-submitted due to a system error, the gamification engine checks the event ID for idempotency and does not double-credit RoboPoints. The duplicate event is logged as a no-op. **(AUDIT)**
- **E-013.2 — RoboPoints deduction (misconduct):** A Super Admin may deduct RoboPoints from a student's account (e.g. as a consequence of a safeguarding violation finding). Deductions are only performable by Super Admins, are always explained with a mandatory reason, and are logged immutably. **(AUDIT)**

**Postconditions (Success):**
- The Student's RoboPoints balance is updated.
- Applicable badges are unlocked.
- Leaderboard rankings are refreshed in real time (or within 60 seconds for Redis-cached leaderboards).
- An audit record exists for every credit and debit event.

**Traces to:** UR-GAM-001 through UR-GAM-030, FR-GAM-020, DR-004.

---

## UC-014 — Student Collaborates in Real Time on a Team Project

**Actor(s):** Primary — Student (multiple team members); Secondary — Teacher (mentor observer)

**Preconditions:**
- A team has been formed (UC-012).
- The Teacher has created a collaborative project for the team (UC-012, step 5).
- Team members are authenticated and have accepted their team invitations.

**Main Success Flow:**

1. Student A opens the team project from **My Teams → [Team Name] → Project**. The system loads the shared RoboCode Studio workspace backed by a Yjs CRDT document.
2. Student B and Student C open the same project link. The system establishes WebSocket connections (Socket.IO) for each member and merges them into the shared session.
3. The system displays online presence indicators for each active team member: coloured cursors on the canvas and coloured highlights in the code editor showing each member's cursor position.
4. Student A drags an ESP32 board onto the canvas. The change is immediately propagated via Yjs to Students B and C, who see the component appear on their canvases in real time.
5. Student B edits the code in the Monaco editor. Keystrokes are synchronised character-by-character via the Yjs text binding. Students A and C see Student B's cursor and the text appearing in real time.
6. Student C adds a component property conflict — moves the same component that Student A is configuring. The CRDT resolves the conflict automatically using last-write-wins for property values and notifies both students with a brief conflict-resolution banner.
7. The Teacher opens the project in **Read-Only Mentor View**. The Teacher can observe all changes in real time without blocking any student action. The Teacher may add mentor comments (pinned annotations on the canvas or in the code editor margin) that are visible to all team members. **(AUDIT)**
8. A team member selects **Save Snapshot** to create a named checkpoint of the project state. Snapshots allow the team to revert to a prior state if needed. **(AUDIT)**
9. The team runs the simulation collaboratively: one student controls the Sensor Control Panel (adjusting virtual sensor inputs) while others observe the circuit behaviour on their own canvases.

**Alternate Flows:**

- **A-014.1 — Member with a brief network drop rejoins:** If Student C experiences a short connectivity drop within an active session, edits made during the gap are held in the in-session Yjs buffer and synced to the shared Yjs document on reconnection. Conflicts are resolved by the CRDT. The other team members see a "Student C reconnected" presence update. (This covers transient drops only; persistent offline editing is out of scope for v1.0 per Section 1 and UR-NFR-A003.)
- **A-014.2 — Teacher takes control for demonstration:** The Teacher temporarily switches from Read-Only to **Demo Mode** (if explicitly enabled by the School Admin for this competition/class), makes a demonstration change on the canvas, narrates it via a text annotation, and returns to Read-Only. Demo Mode usage is audit-logged. **(AUDIT)**

**Exception Flows:**

- **E-014.1 — Session conflict: too many concurrent editors:** If more than the supported maximum of concurrent editors (initial v1.0 cap: 10 per project) attempt to connect, the system queues additional connections and notifies the queued user: "Waiting for a slot — please wait a moment."
- **E-014.2 — CRDT sync failure:** If the Yjs document state becomes desynchronised between clients (e.g. an extended connectivity gap with complex edits), the system detects the divergence, prompts the affected client to reload, and merges the in-session buffer on reconnection.

**Postconditions (Success):**
- All team members see a consistent shared project state.
- The project history (snapshots and Yjs operation log) is stored for audit and revert.
- The Teacher's annotations are visible to the team.

**Traces to:** UR-TEAM-010, UR-TEAM-015, UR-STU-020, FR-TEAM-020, FR-COMM-010.

---

## UC-015 — Teacher Authors a Block-Based Lesson for Primary Students

**Actor(s):** Primary — Teacher; Secondary — Primary-School Students

**Preconditions:**
- The Teacher is authenticated and is assigned to a class with primary-school students enrolled.
- The school tenant has the block-based coding mode enabled (default On for primary-school classes).

**Main Success Flow:**

1. The Teacher navigates to **Content Library → Create Lesson** and selects **Block-Based Mode** as the coding interface for this lesson.
2. The Teacher authors the lesson: title, learning objective (e.g. "Make an LED blink using block commands"), step-by-step written instructions with annotated screenshots, and a starter project with the chosen board (typically the Arduino UNO, but the Teacher may select the ESP32 DevKit or Raspberry Pi Pico from the wokwi-boards library) and an LED pre-wired.
3. The Teacher opens the starter project in the authoring preview. The block editor displays categorised block drawers: **Control**, **Digital I/O**, **Timing**, **Variables**, and **Sensors** (contextual to the components on the canvas).
4. The Teacher drags a **Set pin [13] to [OUTPUT]** block into the `setup` area and a **Blink pin [13] every [1] seconds** block into the `loop` area, demonstrating the intended solution.
5. The Teacher locks certain blocks as **Required** (the student must use them) and marks the LED pin as a **Constrained Variable** (student can change the pin number within an allowed range defined by the Teacher).
6. The Teacher sets the lesson's assessment criteria: "Simulation must run for 10 seconds without error; LED must blink at 1 Hz (±0.1 Hz)." The system stores these as auto-gradeable criteria.
7. The Teacher publishes the lesson to the class. Students see it in their **My Lessons** feed.
8. A primary-school Student opens the lesson. The RoboCode Studio interface loads in Block Mode: the block drawer is visible; the text code editor is hidden (or shown as read-only transpiled output below, for transparency). The pre-wired circuit is on the canvas.
9. The Student drags blocks, connects them, and selects **Run**. The RSE transpiles the blocks to the appropriate language for the board (Arduino C/C++ for UNO, MicroPython for Pico or ESP32) and compiles/executes them on the corresponding simulator (avr8js for the UNO, rp2040js for the Raspberry Pi Pico). The LED blinks as expected.
10. The Student selects **Submit**. The auto-grader checks the blink frequency criterion and awards the configured RoboPoints if met.

**Alternate Flows:**

- **A-015.1 — Student switches to text mode:** A Student (or Teacher, for older primary students) may toggle from Block Mode to Text Mode mid-lesson to see the generated C++ code. The system transpiles the current blocks and opens the Monaco editor. Changes made in Text Mode update the block representation bidirectionally.

**Exception Flows:**

- **E-015.1 — Block configuration yields invalid code:** If the student's block arrangement produces a logical error (e.g. infinite `delay` blocking the loop), the simulation freezes. The system detects a simulation timeout (no pin state change for 10 s) and displays a "Simulation may be stuck — check your loop for long delays" hint block, highlighting the likely problematic block.

**Postconditions (Success):**
- Primary-school students have completed a guided block-based coding exercise.
- Auto-graded results are recorded and RoboPoints awarded.

**Traces to:** UR-CODE-030, UR-LRN-010, UR-GAM-010, FR-CODE-030.

---

## UC-016 — School Admin Monitors School-Level Reports and Compliance

**Actor(s):** Primary — School Admin

**Preconditions:**
- The School Admin is authenticated and their tenant is Active with enrolled students and teachers.
- At least one reporting period (e.g. one week) of student activity has occurred.

**Main Success Flow:**

1. The School Admin navigates to **School Dashboard → Reports**.
2. The system presents a summary dashboard showing: total active students, active teachers, total projects created, total simulation runs, tasks published, average task completion rate, and total RoboPoints awarded in the current period.
3. The School Admin selects **Student Progress Report** for a date range. The system generates a table: student display name, grade/class, tasks assigned, tasks completed, tasks graded, average grade, RoboPoints balance, and last active date.
4. The School Admin selects a specific student and drills into their individual progress view: task-by-task breakdown, grade history, project list, simulation run count, badge collection, and consent record status. **(MINOR)**
5. The School Admin navigates to **Reports → Safeguarding and Moderation**. The system shows: open moderation flags (for this tenant), resolved flags in the period, safeguarding escalations (if any), and student consent records with expiry warnings for those approaching annual re-consent requirements. **(SAFETY) (AUDIT)**
6. The School Admin selects **Export** on any report. The system generates a CSV or PDF and emails a download link to the School Admin's registered address. All exported reports are logged. **(AUDIT)**
7. The School Admin reviews the **Seat Usage** panel: seats used vs. licenced, seat renewal date, and a projection of seat consumption if enrolment continues at the current rate. The School Admin may initiate a seat upgrade from this view.
8. The School Admin navigates to **Reports → Audit Log** and views the tenant-scoped audit log: a chronological list of all administrative actions within the school (teacher creations, student approvals, assignment publications, moderation actions, branding changes), searchable by actor, action type, and date. **(AUDIT)**

**Alternate Flows:**

- **A-016.1 — Teacher-level report delegation:** The School Admin selects **Delegate Report Access** to share a read-only view of the class progress report with specific Teachers (they see only their own classes).

**Exception Flows:**

- **E-016.1 — Report generation timeout:** If the date range is very large (e.g. full academic year), report generation may exceed 30 seconds. The system runs the generation asynchronously, notifies the School Admin by email when ready, and provides a secure download link valid for 48 hours.
- **E-016.2 — Data export blocked pending data-protection review:** If the Super Admin has placed a compliance hold on the tenant (e.g. during a safeguarding investigation), the export function is disabled and the School Admin sees a notice to contact the platform administrator.

**Postconditions (Success):**
- The School Admin has reviewed school-level progress and safeguarding status.
- Any exported reports are logged in the audit trail.

**Traces to:** UR-ADM-036 through UR-ADM-039 (global reports), UR-COMM-055, FR-ADM-010, DR-005.

---

## Cross-References

The use cases in this section are elaborated into atomic user stories in **Section 18 (User Stories and Acceptance Criteria)** and placed in context in **Section 19 (User Journey Maps)**. The detailed functional behaviour required to implement each use case is specified in the System Specification Document, in the modules referenced by each `Traces to` line above.

The following sections provide the requirements that constrain the flows described here:

| Cross-Reference | Applies To |
|----------------|------------|
| Section 6 — User Requirements: Onboarding, Signup and Approval | UC-004, UC-005, UC-006 |
| Section 7 — User Requirements: Authentication and Account Management | UC-001, UC-002, UC-006 |
| Section 8 — User Requirements: School Onboarding, Custom Domain and White-Labelling | UC-001, UC-002, UC-003 |
| Section 9 — User Requirements: RoboCode Studio Canvas, Components and Wiring | UC-008, UC-009, UC-014, UC-015 |
| Section 10 — User Requirements: Simulation Experience | UC-008, UC-009 |
| Section 11 — User Requirements: Code Editor and Programming | UC-008, UC-009, UC-015 |
| Section 12 — User Requirements: Learning, Courses, Tasks and Assessment | UC-010, UC-011, UC-015 |
| Section 13 — User Requirements: Teams, Competitions and Collaboration | UC-012, UC-014 |
| Section 14 — User Requirements: Gamification, RoboPoints and Leaderboards | UC-013 |
| Section 15 — User Requirements: Communication, Notifications and Safety | UC-005, UC-007 |
| Section 16 — User Requirements: Administration and Reporting | UC-016 |


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


# User Journey Maps

## Overview

This section presents narrative user journey maps for the four primary actor journeys through RoboCode.Africa. Each journey map traces the complete path a user archetype follows — from initial awareness through sustained engagement — capturing the stages they pass through, the actions they take, the platform touchpoints they encounter, the emotional context and friction they experience, and the design opportunities those observations reveal.

Journey maps in this section are informed by the user personas defined in *Stakeholders and User Classes* and *User Personas* (Sections 3–4), the user requirements specified in *User Requirements: Onboarding, Signup and Approval* (UR-ONB), *User Requirements: Authentication and Account Management* (UR-AUTH), *User Requirements: School Onboarding, Custom Domain and White-Labelling* (UR-SCH), *User Requirements: RoboCode Studio Canvas, Components and Wiring* (UR-SIM / UR-CODE), *User Requirements: Learning, Courses, Tasks and Assessment* (UR-LRN), *User Requirements: Teams, Competitions and Collaboration* (UR-TEAM), and *User Requirements: Gamification, RoboPoints and Leaderboards* (UR-GAM).

Journey maps complement — but do not replace — the formal use cases (Section 17) and user stories (Section 18). They are design artefacts intended to guide UX, product and engineering teams in prioritising features and eliminating friction at the moments that matter most.

---

## Conventions

Each journey map follows a five-column table structure for the stage-by-stage detail. Emotions are reported inline with actions because they arise from and respond to those actions; separating them would exceed the column limit and reduce readability.

| Column | Meaning |
|---|---|
| Stage | A named phase of the user's journey, from first contact to habitual use |
| User Actions and Emotions | What the user does and feels at this stage (observable behaviour and affective state) |
| Touchpoints | Platform surfaces, communications or external systems the user interacts with |
| Pain Points | Friction, confusion or failure modes the user may encounter |
| Opportunities | Platform design decisions that can improve experience at this stage |

Emotional tone shorthand: Positive (+), Neutral (~), Negative (–), Mixed (+/–), Strongly positive (++).

---

## Journey Map 1: A School Adopting RoboCode.Africa

### Narrative

A secondary school ICT head of department ("Thabo", Zimbabwe) discovers RoboCode.Africa after seeing a social-media post shared by a colleague. He investigates the platform on behalf of his school, builds an internal case for adoption, obtains administrative buy-in, configures the school tenant, deploys it to a pilot class of 15 students, and moves from trial to a paid institutional subscription. This journey spans approximately 4–8 weeks and involves multiple stakeholders: the school HoD, the school principal or IT administrator, the Super Admin / Platform Moderator, and eventually teachers and students.

The school adoption journey is the critical commercial and operational onboarding path. It introduces the tenant model (UR-SCH), white-label branding configuration, subdomain provisioning, user approval workflows (UR-ONB), seat management, and billing. Every friction point in this journey is a potential deal-breaker; every well-designed touchpoint is an opportunity to build lasting institutional trust.

```
SCHOOL ADOPTION JOURNEY — HIGH-LEVEL FLOW
═══════════════════════════════════════════════════════════════════
  [DISCOVERY] → [EVALUATION] → [INTERNAL APPROVAL] → [SIGNUP]
        ↓
  [TENANT SETUP] → [PILOT CLASS] → [FULL DEPLOYMENT] → [RENEWAL]
═══════════════════════════════════════════════════════════════════
```

### Stage-by-Stage Detail

| Stage | User Actions and Emotions | Touchpoints | Pain Points | Opportunities |
|---|---|---|---|---|
| **1. Discovery** | HoD searches for online robotics tools; reads a shared article; visits robocode.africa; watches the product demo video. (+) Curious, hopeful that this solves the hardware-cost problem. | Marketing site (robocode.africa), social media link, embedded product demo video. | Demo may not clearly show Africa-region relevance or network resilience. | Showcase African school case studies and local curriculum alignment prominently on the home page. Surface bandwidth and device requirements upfront. |
| **2. Self-Evaluation** | HoD registers as a Guest; explores the free demo RoboCode Studio; tries wiring an LED to an Arduino UNO R3 and a second circuit on the Raspberry Pi Pico; checks the component catalogue and the three first-class boards (Arduino UNO, ESP32 DevKit, Raspberry Pi Pico). (+) Excited by the simulator; (~) uncertain about curriculum depth. | Guest demo mode (limited RoboCode Studio), component catalogue browser, board selection panel, pricing and plans page. | Demo scope is limited without registering. May not find the exact components from the school's physical starter kit listed. HoD may not realise the platform supports both AVR (avr8js) and RP2040 (rp2040js) simulation. | Offer a richer interactive demo without requiring account creation. List the full component catalogue publicly. Provide a "Works with your kit" cross-reference page that maps physical starter-kit hardware to supported boards including the Raspberry Pi Pico. |
| **3. Internal Approval** | HoD drafts a proposal; presents to principal; shares a screen recording; requests budget approval for an annual subscription. (~) Optimistic but anxious about budget and principal's scepticism. | Internal school channels (email, meetings); robocode.africa pricing page; quote request form. | Pricing page may not articulate ROI clearly or compare to cost of physical kits. No printable quote or proposal template is available. | Provide a downloadable institutional proposal template, a TCO calculator comparing platform cost to physical lab cost, and a formal quote-request flow generating a PDF. |
| **4. School Admin Registration** | HoD submits a School Admin registration form; enters school name, country, grade levels, student count, and institutional email. Awaits Super Admin approval (UR-ONB-020 – UR-ONB-025). (~) Hopeful but impatient waiting for approval. | robocode.africa signup form, email verification flow, Super Admin approval queue. | Approval delay is opaque; no status tracker shown after submission. Institutional email domain may not match expected patterns. | Show a real-time approval-status tracker ("Your application is under review — typically approved within 1 business day"). Send an acknowledgement email with an estimated SLA. |
| **5. Tenant Provisioning** | Super Admin approves the school; platform auto-provisions `school.robocode.africa`; HoD receives a welcome email with the tenant dashboard link and setup guide (UR-SCH-001 – UR-SCH-010). (+) Excited to have a dedicated school space. | Welcome email, School Admin dashboard, subdomain URL, optional custom domain setup wizard. | Welcome email may be too technical (DNS CNAME records confusing for non-IT HoDs). | Include a plain-language setup guide with step-by-step screenshots. Offer a "Set up custom domain later" bypass so the school can start on the subdomain immediately. |
| **6. Branding and Domain Setup** | School Admin uploads school logo; sets primary colour; optionally initiates custom domain CNAME/TXT DNS verification for a school domain (UR-SCH-015 – UR-SCH-030). (+/–) Pleased by branding control; frustrated if DNS steps are unclear. | School Admin branding panel, DNS record wizard, automated ACME/Let's Encrypt TLS provisioning. | DNS propagation delay (up to 48 h) can stall setup. Error messages on DNS verification may be cryptic. | Show a live DNS propagation checker in the dashboard. Provide copy-paste DNS values and a "Verify now" button. Email the School Admin when TLS is provisioned successfully. |
| **7. Inviting Teachers** | School Admin sends invitation emails to two teachers; sets their roles (Teacher / Educator); monitors acceptance (UR-ONB-030 – UR-ONB-035). (+) In control and organised. | School Admin user-management panel, invitation emails, teacher signup form. | Teachers may miss the invitation email (spam filters). No reminder-nudge mechanism is visible. | Allow School Admin to resend invitations with one click. Show invitation status (Sent / Accepted / Expired) per teacher in the panel. |
| **8. Pilot Class Setup** | A Teacher creates a class "Grade 9 ICT Pilot"; imports 15 students via CSV; assigns the "Robotics Basics" learning track (UR-LRN-001 – UR-LRN-006); configures parental consent flow for minors (UR-ONB-040 – UR-ONB-055). (+) Motivated; (~) mildly overwhelmed. | Teacher class-management panel, CSV bulk-import tool, parental consent email workflow, learning track assignment UI. | CSV import may fail silently on malformed rows. Parental consent emails may not reach parents who use SMS only. | Provide a CSV import validator with row-level error reporting before committing. Offer SMS consent notification for low-connectivity parents (optional SMS integration). |
| **9. Student Activation** | Students receive invitation emails; register accounts; parents/guardians receive and approve consent requests (for under-16); School Admin approves student accounts (UR-ONB-050 – UR-ONB-070). Students: (+) Curious. Parents: (~) Cautious. | Student signup emails, parental consent emails, School Admin approval queue, student account activation email. | Some parents may not respond to consent emails promptly, blocking student activation. Approval queue may be daunting with 15+ students arriving at once. | Batch-approval UI with "Approve all verified" action. Automated parental-consent reminders at 24 h, 48 h and 72 h. Dashboard counter showing "X students awaiting approval". |
| **10. Pilot Running** | Pilot class completes first two modules over two weeks; Teacher reviews progress dashboard; School Admin views tenant-level analytics (UR-LRN, UR-ADM). (+) Increasingly enthusiastic. | Teacher progress dashboard, student project views, RoboCode Studio, School Admin analytics panel. | Teacher may struggle to identify which students are stuck without a clear alert mechanism. | Implement an "at-risk student" flag in the Teacher dashboard based on inactivity or repeated failed task submissions (UR-LRN, UR-ADM cross-reference). |
| **11. Subscription Upgrade** | School Admin reviews pilot outcome; initiates upgrade from trial to full annual plan; completes payment via Paystack / Flutterwave / Stripe; receives invoice and subscription confirmation (UR-ADM billing). (+) Confident in ROI; (~) anxious about commitment. | Subscription and billing panel, payment gateway (Paystack / Flutterwave / Stripe), invoice email. | African payment gateways may require additional verification steps unfamiliar to the School Admin. Invoice format may not satisfy school procurement requirements. | Support multiple African payment methods. Generate formal purchase-order-compatible invoices with school letterhead fields. Offer annual payment with a discount. |
| **12. Full Deployment and Renewal** | School Admin scales to all classes (180+ students); Teachers author custom modules; school participates in a platform-hosted competition; School Admin reviews end-of-year report and renews subscription. (++) Proud of the school's digital transformation. | Full platform access, Teacher content authoring tool, competition module (UR-TEAM), annual report download, renewal notification emails. | Report may not include the metrics the principal needs for board reporting. Renewal notice may arrive too close to the budget cycle. | Provide a downloadable annual impact report in PDF with customisable metrics. Send renewal reminders 60 days and 30 days before expiry. |

---

## Journey Map 2: A Primary Student Building a First Project

### Narrative

"Amara" is a 10-year-old primary school student (Grade 5, Lagos, Nigeria) who has just been activated on her school's RoboCode.Africa tenant. She has never written code before. Her Teacher has assigned the "My First LED" guided tutorial as her first task. She logs in from the school's computer lab on a shared Chromebook, completes the tutorial, gets her LED blinking in the simulator, earns her first RoboPoints and badge, and saves and submits her project. This journey spans a single 45-minute school session but has lasting motivational implications for continued engagement.

This journey exercises RoboCode Studio's core usability for the youngest and least experienced user segment. It is the most consequential journey for accessibility, block-based coding mode, guided-step UX, 2D simulation fidelity, and the gamification first-moment (UR-GAM-003, UR-GAM first-badge). Every friction point risks permanent disengagement from the platform and from coding itself.

```
PRIMARY STUDENT FIRST-PROJECT JOURNEY
══════════════════════════════════════════════════════════════
  [LOGIN] → [DASHBOARD] → [TASK OPEN] → [STUDIO LOAD]
                                              ↓
  [PLACE COMPONENT] → [WIRE] → [BLOCK CODE] → [SIMULATE]
                                              ↓
  [SUCCESS + BADGE] → [SAVE] → [SUBMIT] → [FEEDBACK]
══════════════════════════════════════════════════════════════
```

### Stage-by-Stage Detail

| Stage | User Actions and Emotions | Touchpoints | Pain Points | Opportunities |
|---|---|---|---|---|
| **1. Login** | Amara types her username and password on a shared Chromebook. Teacher has set simple credentials for the class. (~) Slightly nervous; first time using the platform independently. | Login page (school subdomain), password field, optional Google SSO button. | Password too complex for a 10-year-old; shared Chromebook may have saved a classmate's credentials. | Support teacher-generated simple PIN or QR-code login for primary school students (UR-AUTH configurable per tenant). Show a "Shared device" warning if a different account is already cached. |
| **2. Student Dashboard** | Amara sees her dashboard: assigned tasks, RoboPoints balance (0), empty badges panel, and a welcome message from her Teacher. (+) Excited by the colourful dashboard; curious about badges. | Student home dashboard, task card for "My First LED", new-task notification. | Empty badges panel may feel discouraging. Zero RoboPoints balance is not inviting. | Show a "Your first badge is one task away!" prompt next to the empty badges panel. Award a small "Welcome" RoboPoints bonus on first login (UR-GAM-001 cross-reference). |
| **3. Opening the Task** | Amara clicks the "My First LED" task card; reads the task description; clicks "Start Task" to open the guided tutorial within RoboCode Studio. (+) Curious and eager. | Task detail page, "Start Task" button, RoboCode Studio load screen. | Studio load time on a slow school connection may exceed 5 seconds, breaking engagement. | Show a branded progress animation during Studio load. Cache wokwi-elements web components aggressively via the CDN/edge layer (Cloudflare), targeting under 3 s on a 3G connection. |
| **4. Guided Step — Place Board** | RoboCode Studio opens in guided mode. A side panel shows Step 1: "Drag the Arduino UNO R3 from the component tray onto the canvas." An animated arrow highlights the UNO R3 in the tray. (+) Delighted by the animation; focused. | RoboCode Studio guided-step panel, component tray, 2D canvas (wokwi-elements), animated hint overlay. | If Amara dismisses the hint overlay accidentally, she may not know how to restore it. Touch targets on a small Chromebook screen may be too small for a child's fingers. | Make hint overlays re-openable via a persistent "?" button. Ensure all drag targets meet WCAG 2.2 AA minimum touch target size (44 × 44 px). |
| **5. Placing the LED and Resistor** | Amara drags a red LED from the component tray and drops it onto the breadboard. The LED snaps to a breadboard row. She also drags a 220-ohm resistor. (+) Satisfied by the snap-and-place feedback. | RoboCode Studio 2D canvas, component snap-to-grid, breadboard tie-point highlighting. | Child may not understand which breadboard row to place the LED on without clear visual guidance. | Highlight valid placement zones in green as the user drags a component. Show a tooltip with the component name and a one-line description on hover or long-press. |
| **6. Wiring** | Step 3 instructs Amara to connect the LED anode to pin 13 of the Arduino UNO R3 and the cathode to GND via the resistor. She clicks a pin, drags a jumper wire, and releases on the destination pin. (+/–) Excited but mildly confused by pin labels. | RoboCode Studio wiring layer (SVG/Canvas), pin labels, breadboard column highlighting, wire colour selector. | Pin labels may be too small at default zoom. Child may accidentally connect to the wrong row without visible error feedback. | Auto-zoom onto the selected board when wiring mode is active. Display a live circuit-validity indicator using the RSE's pin-state validation ("Something looks wrong — check your resistor connection"). |
| **7. Block-Based Coding** | Amara switches to the Code Editor tab in Block mode. She finds the "Digital Write" block, drags it into the loop function area, sets pin 13 to HIGH, adds a Delay block of 500 ms, duplicates the pair and sets the second to LOW. (+) Engaged; enjoys the visual puzzle-like feel of blocks. | Monaco / block editor in block mode, block palette, drag-and-drop block canvas, loop/setup function containers. | Block categories may not be intuitively labelled for a primary student (e.g., "Digital I/O" vs "Lights"). Dragging blocks on a small trackpad can be imprecise. | Label block categories with child-friendly language ("Turn things ON/OFF", "Wait", "Repeat"). Support click-to-place as an alternative to drag-and-drop for blocks. |
| **8. Running the Simulation** | Amara clicks the green "Run" button. The RSE / RVM interprets the block code. The LED on the canvas begins blinking at 1-second intervals. (++) Delighted — the LED blinks! First success moment. | RoboCode Studio toolbar (Run / Stop / Reset), RSE/RVM execution, wokwi-elements LED animation, WebAudio (if buzzer were used). | If there is a wiring error, the simulation may fail silently or show a cryptic error message. | Display a friendly, age-appropriate error explainer ("Oops! Check that your LED is connected to pin 13") instead of raw error codes. Offer a "Help me fix it" hint that highlights the problematic wire in red. |
| **9. Badge and RoboPoints Award** | The platform detects a successful, non-trivial simulation run (UR-GAM-003). A celebration animation appears: "You earned 50 RoboPoints and the 'First Blink' badge!" Amara's RoboPoints balance updates in the header. (++) Joy, pride, desire to share. | In-Studio achievement pop-up, RoboPoints counter in header, badge notification, confetti animation. | Celebration animation may interrupt the student if she was about to save or explore further. | Make the celebration overlay dismissible with a single tap; ensure it does not block Save. Offer a "Share with my teacher" one-click button on the achievement card. |
| **10. Saving the Project** | Amara clicks "Save" from the Studio toolbar. The project is saved to her account as "My First LED — 19 Jun 2026". She can rename it. (+) Secure; pleased that her work is preserved. | RoboCode Studio toolbar Save button, auto-save confirmation toast, "My Projects" panel. | Auto-save may not be obvious; student may close the tab thinking work is lost. | Implement auto-save every 60 seconds with a visible "Saved" indicator. Show a "Don't forget to save!" prompt if the tab is closed with unsaved changes. |
| **11. Task Submission** | Amara clicks "Submit Task" from the task panel. The platform captures a snapshot of her project and simulation state and sends it to her Teacher's review queue (UR-LRN assessment). (+) Accomplished and proud. | Task submission button, submission confirmation screen, Teacher notification (background). | Amara may not understand the difference between saving and submitting; she may submit prematurely or not at all. | Present a clear two-step confirmation: "Are you ready to submit? Your teacher will review your work." Show the task rubric before submission so she can self-check. |
| **12. Teacher Feedback** | Teacher reviews Amara's submission, adds a text comment ("Great work! Try changing the delay to make it blink faster!"), and marks it complete. Amara receives a notification and views the feedback. (+) Validated and motivated to iterate. | Teacher grading panel, student notification (in-app + optional email), student task view with feedback comment. | Feedback notification may be missed if Amara does not log in again promptly. | Allow teachers to send feedback as an optional SMS or email notification to the parent/guardian, ensuring the student receives encouragement even outside school hours. |

---

## Journey Map 3: A High-School Competitive Team Preparing for a Tournament

### Narrative

"Team Hydra" is a four-member high-school team at a South African school (Grades 10–11, ages 15–17) preparing for the first inter-school RoboCode.Africa Regional Tournament. Their teacher mentor ("Ms Dube") has enrolled them in the competition. The team must design, build and code a simulated robotic solution — a line-following robot using the Arduino UNO R3, two IR obstacle/line-tracking sensors, an L298N motor driver and two DC motors — within four weeks, collaborating in real time across two sub-locations (one team member is a remote learner). They must submit a project and a project report, and participate in a live judge review.

This journey exercises the collaborative project mode (Yjs CRDT, UR-TEAM), the advanced component catalogue (IR sensor, L298N, DC motors), the code editor in Arduino C/C++ mode, competition workflows, team communication under moderation rules, and the gamification competition-placement awards (UR-GAM-004).

```
COMPETITIVE TEAM JOURNEY — 4-WEEK SPRINT
══════════════════════════════════════════════════════════════════
  [TEAM FORMATION] → [COMPETITION ENROL] → [PROJECT KICKOFF]
          ↓
  [COLLABORATIVE BUILD] → [ITERATE CODE+SIM] → [PEER REVIEW]
          ↓
  [SUBMISSION] → [JUDGE REVIEW SESSION] → [RESULTS + AWARDS]
══════════════════════════════════════════════════════════════════
```

### Stage-by-Stage Detail

| Stage | User Actions and Emotions | Touchpoints | Pain Points | Opportunities |
|---|---|---|---|---|
| **1. Team Formation** | Teacher Ms Dube creates "Team Hydra" in the class panel; invites four named students; assigns a team captain (Sipho, Grade 11). Team members accept invitations (UR-TEAM). (+) Excited; team identity forms immediately. | Teacher team-management panel, student invitation notifications, team dashboard, team-captain role assignment UI. | Students from a partner school are on a different tenant; cross-tenant team invitation may be unsupported or complex. | Define a cross-tenant team invitation flow where a Super Admin can federate teams across school tenants for competitions while maintaining each student's home-tenant data isolation. |
| **2. Competition Enrolment** | Ms Dube navigates to the Competitions panel; finds "Regional Tournament — Term 3 2026"; reviews rules, timeline and judging rubric; clicks "Enrol Team"; enters Team Hydra. Team receives a confirmation and competition brief. (+) Motivated; (~) slightly anxious about the rules and deadline. | Competitions directory, competition detail page, enrolment form, team confirmation email, competition brief PDF download. | Competition rules may be long and complex; students may miss key requirements (e.g., mandatory project report format). | Provide a competition "checklist" that breaks the rules into actionable items and tracks completion. Send countdown reminders at T-14, T-7, T-3 and T-1 days. |
| **3. Collaborative Project Kickoff** | Team captain Sipho creates a new collaborative project "Line Follower v1" in RoboCode Studio; shares it with team members; all four members open the project simultaneously (Yjs CRDT collaborative mode, UR-TEAM collab). (+) Energised by seeing teammates' cursors on the shared canvas. | RoboCode Studio project creation, collaborative project sharing panel, real-time presence indicators (avatar cursors), Yjs CRDT sync engine. | Conflicts arise when two members drag the same component simultaneously. Remote team member on a slow connection may experience lag or disconnection. | Implement component-level optimistic locking ("Sipho is placing this component"). Show a connection-quality indicator and auto-reconnect. Cache project state locally (IndexedDB) and sync on reconnect. |
| **4. Circuit Design Sprint** | Team divides tasks: Sipho wires the Arduino UNO R3 and L298N; Kefilwe places two IR line-tracking sensors; Amahle wires the DC motors; remote member Liam adds power wiring. Components used: UNO R3, L298N driver, 2× IR sensors, 2× DC motors, breadboard power module, 9V battery. (+) Collaborative and focused. | RoboCode Studio 2D/3D canvas, component catalogue (L298N, IR sensor, DC motor), breadboard, jumper wires, 3D view (React Three Fiber). | In 3D view, complex wiring overlaps and becomes hard to distinguish. Component labels may not be visible at default camera angles. | Colour-code wires by team member in collaborative mode. Provide a "Wiring list" net-list panel that tabulates all connections independent of view mode. Support 2D/3D toggle at any time without losing state. |
| **5. Code Development** | Sipho takes the lead on the Arduino C/C++ code in the Monaco editor. He implements a PID-based line-follower algorithm. Ms Dube reviews a draft and leaves an inline comment. Real-time autocomplete for digitalRead(), analogRead() and L298N motor-control APIs is active. (+) Absorbed and challenged. | Monaco editor (C/C++ mode), library autocomplete (L298N, IR sensor APIs), Teacher inline comments, code version history. | Autocomplete may not suggest algorithm-level patterns, only API symbols. Version history may not show which team member made which change. | Integrate a teacher-curated "code snippets" library for common patterns (PID loop, motor control) accessible from within the editor. Show per-line authorship in version history for non-minor contexts. |
| **6. Simulation Iteration** | Team runs the simulation: the two IR sensors detect the virtual black line; the L298N drives the DC motors; the RSE simulates motor PWM. They observe erratic steering and adjust PID constants. Several run/stop/tweak cycles occur. (+/–) Persistent; frustrated by bugs but motivated by incremental improvement. | RSE simulation engine, avr8js AVR firmware execution (Arduino UNO R3) or rp2040js RP2040 firmware execution (Raspberry Pi Pico builds), L298N behavioural model, IR sensor pin-state feedback, 2D robot-motion canvas, serial monitor. | Serial monitor scrolls too fast to be readable during a live run. Recompile times (WASM toolchain) may interrupt the tight iteration loop. Board-specific differences in GPIO behaviour (AVR vs RP2040) may confuse teams switching between targets. | Add a serial monitor filter and search. Cache the last compiled firmware binary and re-use it if code has not changed. Show a compile-progress indicator. Display the active MCU core (avr8js / rp2040js) in the Studio toolbar so teams always know which target is running. |
| **7. Peer Review and Mentor Session** | After week 3, Ms Dube opens the team's project read-only; runs the simulation; leaves timestamped comments on specific wiring choices and code lines. Team addresses the feedback. (+/–) Teacher: analytical and encouraging. Team: (~) anxious to receive critique. | Teacher read-only project view, timestamped comment threads anchored to canvas positions and code lines, revision history, team task checklist. | If comments are anchored to raw line numbers and the code is subsequently edited, comment anchors may drift. | Implement comment anchoring to code tokens or blocks rather than line numbers. Allow Teacher to mark a comment as "Resolved" once the team has addressed it. |
| **8. Final Submission** | Captain Sipho locks the project ("Submission Version") and clicks "Submit to Competition". Platform captures a project snapshot (circuit + code + simulation video recording) and the team's written project report (uploaded PDF). (+) Relieved and proud. | Competition submission form, project snapshot, auto-generated simulation video (MP4), PDF report upload, submission confirmation receipt. | Video recording of the simulation may require high CPU and stall on low-end machines. PDF report upload size limit may reject a report with many screenshots. | Offer a server-side simulation video render option so students are not bottlenecked by device CPU. Set a generous PDF size limit (50 MB) and compress server-side. Provide a submission receipt with a timestamp and a "Check your submission" preview link. |
| **9. Live Judge Review** | Judges access submitted projects in the judging panel; Team Hydra is invited to a 15-minute review session; judges ask questions; team demonstrates their simulator live. (+) Excited and nervous; this is the culminating moment. | Judging panel (Teacher / Super Admin role), team notification for review slot, RoboCode Studio live-share in judge-view mode, moderated chat / Q&A panel. | Live-share with judges may introduce latency if the judge is on a different continent. Moderated chat may have a delay that disrupts live Q&A. | Pre-render the project in a cloud sandbox so judges can run the simulation independently without relying on the student's connection. Provide a low-latency Q&A panel distinct from the general moderated messaging channel. |
| **10. Results and Awards** | Competition results are published on the platform leaderboard. Team Hydra places 2nd. Each member earns placement RoboPoints (UR-GAM-004), a "Regional Finalist" badge, and a downloadable certificate PDF. Ms Dube receives a Teacher achievement notification. The school appears on the school leaderboard. (++) Elation and pride; desire to compete again. | Competition results page, leaderboard (team and school tiers), in-app badge award notifications, certificate PDF download, Teacher achievement notification, school leaderboard update. | Certificate PDF may not be professional enough for school prize-giving events. Minor students may want to share results publicly but privacy settings restrict public profiles. | Produce competition certificates in a printable, school-letterhead-compatible format. Provide a parent-shareable results card (opt-in, requires parental consent) that respects GDPR-K and COPPA constraints on public sharing for minors. |

---

## Journey Map 4: A Teacher Onboarding a Class

### Narrative

"Mrs Chukwu" is an experienced ICT teacher at a Nigerian secondary school whose School Admin has already set up the school's RoboCode.Africa tenant. She has received her Teacher invitation email, activated her account, and now needs to set up her first class of 35 Grade 10 students, assign a structured learning track, configure the first three weeks of tasks, and prepare for the first lab session next Monday. She is digitally literate but new to the RoboCode.Africa platform.

This journey exercises the Teacher role's primary operational workflow: account activation, class creation, student roster management, learning-track assignment, task authoring, and preparation for live classroom use. It is tightly coupled to the onboarding requirements (UR-ONB-030), school management (UR-SCH), learning management (UR-LRN), and the overall Teacher experience quality that determines whether teachers become platform advocates or detractors.

```
TEACHER CLASS ONBOARDING JOURNEY
════════════════════════════════════════════════════════════
  [INVITATION] → [ACCOUNT SETUP] → [FIRST LOGIN]
         ↓
  [CLASS CREATION] → [STUDENT IMPORT] → [TRACK ASSIGNMENT]
         ↓
  [TASK CONFIGURATION] → [PRE-FLIGHT CHECK] → [FIRST LAB]
         ↓
  [PROGRESS MONITORING] → [GRADING] → [ONGOING USE]
════════════════════════════════════════════════════════════
```

### Stage-by-Stage Detail

| Stage | User Actions and Emotions | Touchpoints | Pain Points | Opportunities |
|---|---|---|---|---|
| **1. Receiving the Invitation** | Mrs Chukwu receives a "You've been invited as a Teacher" email from her School Admin. She clicks the invitation link. (~) Curious; slightly sceptical ("another new platform"). | Teacher invitation email, email client, invitation acceptance landing page. | Invitation email may land in spam. The link may appear phishing-like if the email is from an unfamiliar domain. | Send invitations from a verifiable address (noreply@robocode.africa or the school's custom domain). Include the School Admin's name and school name in the subject line. Ensure SPF/DKIM signing to reduce spam false positives. |
| **2. Account Activation** | Mrs Chukwu sets her password (or links her Google Workspace account via SSO); completes her profile; accepts the platform Terms of Service and the school's data-processing agreement. (~) Routine but slightly tedious. | Account activation form, SSO option (Google / Microsoft), profile setup page, Terms of Service / DPA acceptance modal. | If Google SSO is not configured for her school she must remember yet another password. DPA text may be long and in legalese. | Make school SSO the prominent default option; offer "Set a password instead" as secondary. Provide a plain-language DPA summary alongside the full legal text. |
| **3. Dashboard Orientation** | First login delivers an onboarding tour highlighting the Classes panel, Assignment panel, Learning Library and Student Progress panel. Tour is skippable. (+) Interested; (~) mildly overwhelmed by the breadth of features. | Teacher dashboard, interactive onboarding tooltip overlay, "Quick Start" checklist widget. | Tour moves too fast or covers features she does not need yet (e.g., competitions). Quick Start checklist may list 10+ items, which feels daunting. | Limit the initial tour to the three most critical actions: "Create a class", "Add students", "Assign a task". Surface the Quick Start checklist as a collapsible widget, not a blocking modal. |
| **4. Class Creation** | Mrs Chukwu clicks "New Class"; enters class name ("Grade 10 ICT — Term 3 2026"), grade level, academic year, and description. Saves. Class is created with a unique join code and class link. (+) Straightforward and satisfying. | Class creation form, class dashboard, join-code display, class invitation link. | Class join code is not immediately obvious in the UI; Mrs Chukwu may not know to share it with students. | Show the class join code and a "Copy invite link" button prominently on the class creation success screen. Offer a printable class-invitation QR code for low-tech classroom distribution. |
| **5. Student Roster Import** | Mrs Chukwu uploads a CSV file of 35 students. Platform validates the CSV, previews the rows, and flags errors (missing email, duplicate names). She confirms the import. Platform sends student invitation emails; parental-consent emails go to parent addresses for under-16 students. (~) Methodical; moderately anxious that the CSV will have errors. | CSV bulk-import tool, validation preview table, error-row highlighting, import confirmation button, automated invitation and parental consent emails. | The school's roster may be in Excel format rather than CSV. Parents may not receive consent emails if school records have outdated parent email addresses. | Accept Excel (.xlsx) and CSV formats. Provide a downloadable CSV template pre-filled with column headers. Offer a "Re-send consent request" button per student in the approval queue so Mrs Chukwu can chase non-responding parents. |
| **6. Approval Queue Management** | Over the next two days, Mrs Chukwu monitors the student activation queue. She approves students whose parental consent is confirmed. Unapproved students display their reason in "Pending" status. (~) Patient but watching carefully; anxious about Monday's lab. | Teacher / School Admin approval queue, per-student status panel (Pending / Consent Received / Approved / Rejected), bulk-approve button, reminder-send button. | If 10+ students are still pending by Friday, she cannot run a full class session on Monday. The approval workflow may feel bureaucratic under time pressure. | Provide a "Lab-Ready Count" widget: "X of 35 students ready for Monday". Allow Mrs Chukwu to flag urgency to the School Admin from the approval queue. Send an automated alert if less than 80% of a class is approved 48 h before the first scheduled session. |
| **7. Learning Track Assignment** | Mrs Chukwu opens the Learning Library; filters by "High School" and "Nigeria CBC Technology"; selects the "Robotics Foundations: Arduino UNO R3" track (or an equivalent track targeting the ESP32 DevKit or Raspberry Pi Pico); assigns it to Grade 10 ICT; sets start date (Monday) and end date (end of term). (+) Clear and purposeful. | Learning Library browser, curriculum filter panel (country, grade, subject tags, target board), track assignment workflow, class schedule panel. | Track content may not be tagged for the Nigerian CBC Technology syllabus if tagging is incomplete in the Global Content Library. Teachers may not know which board track to choose if the school has not standardised on one of the three first-class boards. | Super Admin must ensure content is tagged for all supported national curricula before launch. Provide a "Request tagging" flag Teachers can raise for untagged content (UR-LRN-004 cross-reference). Display a board-compatibility note on each track (e.g., "This track uses the Arduino UNO R3 — simulated with avr8js" or "Raspberry Pi Pico — simulated with rp2040js") so Teachers can make an informed choice. |
| **8. Task Configuration (Weeks 1–3)** | Mrs Chukwu configures the first three weekly tasks: sets due dates, grading weights, RoboPoints values, and an optional rubric for each. She previews each task as a student would see it. For Task 1 she enables block-code mode only. (+) Creative and in control; this feels like familiar lesson planning. | Task configuration panel, task editor, grading rubric builder, RoboPoints weight input, student-preview mode. | Setting due dates across three tasks individually is repetitive; bulk scheduling is not immediately obvious. Block-code vs text-code restriction per task may not be discoverable. | Provide a "Schedule all tasks" bulk-date-picker that distributes tasks evenly across the term. Surface the coding-mode restriction toggle prominently in the task editor with a tooltip. |
| **9. Studio Orientation Run** | Before Monday, Mrs Chukwu opens RoboCode Studio herself, completes the "My First LED" task as a student would, and verifies that the simulation runs correctly and the auto-grading rubric behaves as expected. (+) Confident after completing the task herself. | RoboCode Studio (Teacher test-run mode), RSE simulation, auto-grading preview, rubric preview panel. | Teacher test-run mode may not be clearly distinguished from student mode, causing confusion about whether her test submission affects grade records. | Clearly label "Teacher Preview Mode" in the Studio header. Ensure preview submissions are sandboxed and do not appear in student submission queues or affect any reporting metrics. |
| **10. First Lab Session** | Monday: Mrs Chukwu projects the class dashboard. Students log in. She monitors the live activity feed: who is connected, who has opened the task, who has placed the first component. She intervenes where students are stuck. (+) Engaged and purposeful; (~) moments of stress when multiple students are stuck simultaneously. | Live class activity feed (Teacher dashboard), projected class view, RoboCode Studio (students), in-class verbal instruction. | The live activity feed may be too granular (35 rows of events scrolling fast) to be actionable in real time. | Aggregate the activity feed into a visual "class heatmap" showing completion progress per student as a colour-coded grid. Allow Teacher to click a student's name to open their live project in a read-only monitor view. |
| **11. Progress Monitoring and Grading** | After the lab, Mrs Chukwu reviews submissions. Auto-graded tasks show pass/fail with RSE run results. She adds qualitative comments to three students who showed interesting circuit choices. She views a class-level progress chart. (+) Satisfied with visibility; finds manual commenting time-consuming for 35 students. | Teacher grading panel, auto-grade results panel, qualitative comment field, class progress chart (completion % per task, average RoboPoints). | Reviewing 35 submissions individually for qualitative feedback is time-intensive. No batch-comment or rubric-copy feature is available. | Add a "Reuse previous comment" feature to the grading panel. Provide AI-assisted draft comments (where enabled by School Admin) based on the RSE run results, subject to teacher approval before sending. |
| **12. Ongoing Use and Content Authoring** | Over the following weeks Mrs Chukwu assigns new tasks, authors a custom module (soil-moisture sensor alarm using the ESP32 and the soil-moisture sensor component, then a second variant using the Raspberry Pi Pico with MicroPython), shares both with a colleague, and submits them to the Global Content Library for Super Admin review. She also uploads a custom board definition in wokwi-boards format for a locally sourced shield; the upload is validated and enters the approval/moderation workflow. (++) A sense of professional contribution and ownership. | Custom module authoring tool, content sharing panel, Global Content Library submission form, colleague sharing (school-tenant scope), custom board upload panel (wokwi-boards manifest + SVG). | The custom module authoring tool may be complex for a first-time content author. Submission to the global library may take a long time to be reviewed and approved. The wokwi-boards manifest format may be unfamiliar to teachers without JSON experience. | Provide a guided module-authoring wizard for first-time authors. Set a clear SLA for global library review (e.g., 5 business days) and notify Mrs Chukwu when her submission is approved or returned with feedback. Offer a visual board-definition builder that generates a valid wokwi-boards board.json and prompts for an SVG asset, lowering the barrier for non-technical content authors. |

---

## Cross-Journey Themes and Systemic Opportunities

The four journey maps share recurring structural themes. The following table consolidates these systemic observations into platform-level design imperatives, cross-referenced to the relevant requirement areas.

| Theme | Observed Across Journeys | Design Imperative | Relevant Requirements |
|---|---|---|---|
| **First-moment delight** | Primary student (Stage 9), Competitive team (Stage 10) | Celebrate every milestone with proportionate feedback; never let a first success go unacknowledged. | UR-GAM-001, UR-GAM-003, UR-GAM-004 |
| **Approval-queue anxiety** | School adoption (Stage 9), Teacher onboarding (Stage 6) | Surface approval status prominently; provide bulk actions; communicate SLAs; send proactive reminders. | UR-ONB-050 – UR-ONB-070, UR-ADM |
| **Load-time on low bandwidth** | Primary student (Stage 3), Competitive team (Stage 6) | Aggressive CDN caching of wokwi-elements, the rp2040js WASM binary, and wokwi-boards assets; progressive load; simulate in-browser; target under 3 s on 3G. | NFR performance, CDN/edge infrastructure |
| **Child-safe sharing** | Primary student (Stage 9), Competitive team (Stage 10) | Sharing results with parents or publicly must be opt-in, consent-gated, and strip identifying metadata for under-16 users. | UR-ONB-040 – UR-ONB-055, GDPR-K, COPPA, POPIA |
| **Collaboration conflict** | Competitive team (Stages 3–4) | Yjs CRDT is necessary but not sufficient; component-level presence locking and visual indicators of co-editing prevent destructive conflicts. | UR-TEAM collaborative project requirements |
| **Teacher as platform champion** | Teacher onboarding (all stages), School adoption (Stages 7–10) | The teacher's ease-of-use and sense of professional agency determines platform retention. Invest in grading efficiency, content authoring, and live-class monitoring tools. | UR-LRN, UR-ADM teacher dashboard |
| **DNS and domain complexity** | School adoption (Stage 6) | Custom domain setup is a technical barrier; provide wizards, live DNS checkers, and graceful fallback to the school subdomain. | UR-SCH-015 – UR-SCH-030 |
| **Age-appropriate error messages** | Primary student (Stage 8), Competitive team (Stage 6) | All RSE / RVM errors surfaced to students must be age-appropriate, actionable and non-technical; engineers must not expose stack traces to student-facing UX. | UR-SIM, UR-CODE, WCAG 2.2 AA accessibility |

---

## Journey Map Validation Criteria

Each journey map is considered implemented to a satisfactory level when the acceptance criteria in the following table are met in usability testing with representative users from the corresponding archetype.

| Journey | Archetype | Key Success Metric | Acceptance Threshold |
|---|---|---|---|
| School Adoption | School Admin (HoD) | Time from receiving approval email to first student active in a class | Less than 2 hours with no external support required |
| Primary Student First Project | Primary student (age 9–12) | Task completion rate on first unsupported attempt for "My First LED" guided tutorial | At least 80% of test participants complete the full task and observe the simulation run |
| Competitive Team Tournament | High-school team (ages 14–17) | Team able to establish a collaborative project, divide wiring tasks, and run a shared simulation within a single 60-minute session | All four team members successfully contribute to one shared project and observe a successful simulation run |
| Teacher Class Onboarding | Teacher (new to platform) | Time from first login to first task assigned to a class with at least one active student | Less than 90 minutes with access to the in-platform Quick Start guide only |

These metrics shall be evaluated in formal usability testing conducted before each major release milestone. Results shall be fed back into the iterative design cycle and documented in the platform's UX research log, which is maintained separately from this URD.


# Non-Functional User Expectations

## Overview

This section specifies the user-facing non-functional requirements (UR-NFR series) for RoboCode.Africa and RoboCode Studio. Non-functional requirements describe the qualities — not the features — that every user must be able to depend on: how fast the platform feels, how easy it is to pick up for an eight-year-old student on a borrowed Chromebook with a slow rural internet connection, how safe and private the experience is, how accessible it is to students with disabilities, and what minimum device and browser configuration is needed to participate.

These requirements apply platform-wide. Functional sections — including _User Requirements: RoboCode Studio Canvas, Components and Wiring_, _User Requirements: Simulation Experience_, _User Requirements: Code Editor and Programming_, and _User Requirements: Learning, Courses, Tasks and Assessment_ — inherit and must satisfy every UR-NFR constraint listed here. Corresponding system-level non-functional requirements are labelled NFR-CAT-nnn in the System Specification Document (SSD).

Requirements in this section use the identifier prefix **UR-NFR** and are grouped by quality attribute. MoSCoW priorities are assigned per the project canon convention: Must / Should / Could / Won-t (this release).

---

## Usability and Age-Appropriate Design

RoboCode.Africa serves primary-school students (approximately ages 8–12) and high-school students (approximately ages 13–18) within the same platform. The interface must be immediately comprehensible to both groups without extensive reading, while remaining professional enough for Teachers, School Admins, and Super Admins who use the same shell.

```
+-----------------------------------------------------------+
|           Age-Appropriate Interface Strategy              |
|                                                           |
|  Primary Mode (ages 8-12)   High-School Mode (13-18+)    |
|  +----------------------+   +--------------------------+  |
|  | Large icons          |   | Full editor controls     |  |
|  | Block-code default   |   | Text code (C/C++/Python) |  |
|  | Minimal text labels  |   | Advanced diagnostics     |  |
|  | Guided prompts       |   | Pro toolbar options      |  |
|  | Simplified error msg |   | Raw compiler output opt  |  |
|  +----------------------+   +--------------------------+  |
|                    |                 |                     |
|         Shared foundation: WCAG 2.2 AA, multilingual,     |
|         offline-capable, low-bandwidth, cross-device       |
+-----------------------------------------------------------+
```

### Interface Clarity and Simplicity

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-001 | The platform UI shall use a consistent visual language (icons, colour coding, button shapes) that allows a first-time student to identify the primary actions — create project, run simulation, submit task — without reading any on-screen text beyond a single label. | Must | Usability test with grade-4 student cohort: > 80 % must locate Run without assistance within 60 seconds. |
| UR-NFR-002 | All body text, labels, tooltips, and instructions presented to primary-school students shall target a reading grade level of Grade 4–5 (Flesch-Kincaid Grade Level ≤ 6) by default. | Must | Automated readability checks applied during content authoring. Teachers may author tasks at any level; the platform shell itself must comply. |
| UR-NFR-003 | The platform shall not require a student to read a block of text longer than three sentences before being able to take the next action. | Should | UI copy review must flag blocks exceeding this limit. |
| UR-NFR-004 | Primary-school students shall default to the block-based coding mode in RoboCode Studio (see _User Requirements: Code Editor and Programming_); a single clearly labelled toggle shall switch to text-code mode, with a confirmation prompt explaining the change. | Must | Default mode is determined by the student's grade-band setting, configurable by School Admin and Teacher. |
| UR-NFR-005 | Icons shall be accompanied by a short text label in all primary navigation elements; icons-only navigation is not acceptable in the main UI for student-facing pages. | Must | Exception: RoboCode Studio toolbar icons may omit text labels if a persistent tooltip appears on hover/focus within 500 ms. |
| UR-NFR-006 | The platform shall provide contextual inline help — a "?" icon that reveals a plain-English explanation and/or a short illustrative animation — alongside every non-obvious UI element in RoboCode Studio. | Must | Inline help must be available without leaving the current page or opening a new browser tab. |
| UR-NFR-007 | Error messages, warnings, and validation feedback displayed to students shall use plain, encouraging language; they shall identify what went wrong and suggest a corrective action, and shall never use raw system identifiers, stack traces, or HTTP status codes as the primary message. | Must | See also UR-SIM-100 through UR-SIM-104 for simulation-specific error message requirements. |
| UR-NFR-008 | The platform shall support a "Student View" and a "Teacher View" of the same page where layout complexity differs substantially — for example, a Teacher's gradebook dashboard must not impose its data density on a student's task submission page. | Must | Verified by role-based UI routing and separate component trees for each view. |
| UR-NFR-009 | All user-facing date and time displays shall use a human-readable format (e.g., "3 days left", "Due Monday 23 June") rather than raw ISO timestamps, except in admin/reporting exports. | Should | Timezone must be configurable per school (tenant); defaults to Africa/Harare (UTC+2). |
| UR-NFR-010 | Interactive onboarding tours shall be available for first-time login for each user role (Student, Teacher, School Admin), auto-triggered on first login and re-accessible from the help menu at any time. | Should | Tours must be skippable at any step. Completion state persisted per user account. |

---

## Accessibility

RoboCode.Africa must be accessible to students and educators with visual, motor, cognitive, and hearing differences. The platform targets WCAG 2.2 Level AA as its minimum accessibility standard.

### WCAG 2.2 AA Compliance

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-020 | The entire student-facing UI, teacher-facing UI, and admin-facing UI shall conform to WCAG 2.2 Level AA success criteria across all supported browsers and device types. | Must | Automated axe-core / Lighthouse scans plus manual screen-reader testing (NVDA on Windows, VoiceOver on macOS/iOS, TalkBack on Android) required before each major release. |
| UR-NFR-021 | All text elements shall maintain a minimum contrast ratio of 4.5:1 against their background (3:1 for large text ≥ 18 pt or 14 pt bold), across all platform themes including white-label tenant themes. | Must | White-label design-token generation (see _User Requirements: School Onboarding, Custom Domain and White-Labelling_) must enforce contrast validation at token-creation time. |
| UR-NFR-022 | The platform shall not rely solely on colour to convey information; every colour-coded indicator (e.g., simulation status, error/warning states, leaderboard ranks, pin states) shall include a supplementary text label, pattern, or icon. | Must | Tested against deuteranopia and protanopia simulation profiles. |
| UR-NFR-023 | All non-text content — including component icons in RoboCode Studio, badge images, avatar graphics, and tutorial diagrams — shall have a text alternative (alt text or aria-label) that conveys equivalent information to a screen reader user. | Must | Decorative images use empty alt="". No informational image is rendered without alt text. |
| UR-NFR-024 | All animations and motion effects (celebration animations, component movement in RoboCode Studio, level-up effects) shall respect the `prefers-reduced-motion` CSS media query, substituting instant state changes for animated transitions when the user has indicated a preference for reduced motion. | Must | Verified on all major browsers. Applies to both 2D canvas and 3D WebGL rendering paths. |
| UR-NFR-025 | Audio output from the simulation (buzzers, tone generation) shall be accompanied by a visible indicator on the simulated component (e.g., a speaker/sound icon with animation) so that deaf or hard-of-hearing students can observe that audio is being produced. | Must | Visual indicator active whenever the Web Audio API is producing non-zero audio output for that component. |

### Keyboard and Motor Accessibility

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-030 | All platform functionality accessible via mouse or touch shall also be fully operable via keyboard alone, including RoboCode Studio canvas interactions (component selection, wiring initiation, component property editing, simulation controls). | Must | Tab order on all pages must be logical and announced correctly by screen readers. Focus must be visibly styled (minimum 2 px outline, 3:1 contrast against surrounding colour per WCAG 2.2 SC 2.4.11). |
| UR-NFR-031 | All interactive sensor-input controls in RoboCode Studio (button press, potentiometer knob, joystick sliders, etc.) must be operable via keyboard (arrow keys, Space, Enter) and must expose appropriate ARIA roles and live-region announcements so screen-reader users are informed of state changes. | Must | See also UR-SIM-057. ARIA `role="slider"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` for range inputs. |
| UR-NFR-032 | Drag-and-drop component placement on the RoboCode Studio canvas shall provide a keyboard-alternative workflow (e.g., component search + place command) that achieves the same result without requiring pointer input. | Must | Keyboard alternative must be discoverable from the canvas (announced by screen reader on canvas focus). |
| UR-NFR-033 | The platform shall provide a comprehensive keyboard shortcuts reference accessible from the help menu and from within RoboCode Studio, covering at minimum: run/stop/pause simulation, save project, switch editor tab, zoom canvas in/out, delete selected component. | Should | Shortcut reference is displayed in a modal, not a new tab. |
| UR-NFR-034 | Focus management shall be handled correctly when modals, drawers, and notification toasts appear: focus shall move into the modal/toast on appearance and return to the triggering element on dismissal. | Must | Verified by screen-reader testing protocol. |

### Cognitive and Dyslexia Accessibility

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-040 | The platform shall offer a dyslexia-friendly typography option (e.g., OpenDyslexic font or similar) as a user-preference setting, applied platform-wide including in the Monaco code editor. | Should | Setting is persisted per user account. No impact on layout must be introduced when the font is activated. |
| UR-NFR-041 | The platform shall support adjustable font size (at minimum: Small / Medium / Large / Extra Large) as a user-preference setting, with all layouts reflowing correctly at each size without horizontal scrolling on a 1024 px-wide viewport. | Should | Tested at 1024 px width, 150 % browser zoom, and 200 % browser zoom. |
| UR-NFR-042 | Where instructions consist of multiple sequential steps, they shall be presented as a numbered list or step-by-step wizard rather than a prose paragraph, to support students with attention or reading difficulties. | Must | Applies to all onboarding flows, course unit introductions, and task brief layouts. |
| UR-NFR-043 | The platform shall not implement auto-playing audio or video that begins without user initiation. Audio from the simulation is exempt when the student explicitly clicks Run; all tutorial or marketing media must require an explicit play action. | Must | Browser autoplay policy compliance is a floor, not a ceiling — the requirement is stronger than browser defaults. |

### Multilingual and African Language Support

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-050 | The platform UI shall be fully internationalised (i18n) using a standard message-catalogue approach (e.g., i18next / React-Intl), with all UI strings externalised and translatable without code changes. | Must | No hard-coded UI strings in component source code. Enforced by CI linting rule. |
| UR-NFR-051 | English shall be the primary and default interface language for V1. The localisation framework shall be in place so that additional language packs can be added without a platform release. | Must | Language packs are loaded as separate JSON bundles; switching language does not require a page reload. |
| UR-NFR-052 | The platform shall support at minimum the following languages in V2 of the interface: Shona (Zimbabwe), Ndebele (Zimbabwe), Swahili (Kenya/Tanzania/East Africa), Zulu (South Africa), Xhosa (South Africa), Hausa (Nigeria), French (francophone Africa), Portuguese (Mozambique/Angola). | Should | V2 target. V1 must establish the i18n infrastructure and accept community-contributed translations. |
| UR-NFR-053 | All locale-specific data formatting (dates, numbers, currency symbols) shall automatically adapt to the active language locale; no locale-specific formatting shall be hard-coded. | Should | Managed via Intl browser APIs or equivalent library. |
| UR-NFR-054 | RTL (right-to-left) layout support is not required for V1 but the CSS architecture (Tailwind CSS with logical properties) shall not architecturally block RTL addition in a future version. | Could | Logical CSS properties (`margin-inline-start` etc.) preferred over physical directional properties. |

---

## Performance on Low-End Devices, Chromebooks and Low-Bandwidth Environments

The primary addressable market for RoboCode.Africa includes students in sub-Saharan Africa who may use shared Chromebooks, low-specification Android tablets, or refurbished laptops on 2G/3G mobile connections or VSAT broadband. Performance requirements must reflect these real-world constraints.

### Device Performance Targets

```
+--------------------------------------------------------------+
|               Device Performance Tier Model                  |
|                                                              |
|  Tier 1 — Low-end (Chromebook/Android tablet, 2GB RAM,      |
|            quad-core ARM, 720p display):                     |
|    2D simulation must run at >= 30 FPS; 3D degrades to 2D   |
|                                                              |
|  Tier 2 — Mid-range (Chromebook/Windows laptop, 4GB RAM,    |
|            x86/ARM, 1080p display):                          |
|    2D >= 60 FPS; 3D >= 30 FPS (WebGL2)                      |
|                                                              |
|  Tier 3 — High-end (Desktop/MacBook, 8GB+ RAM,              |
|            dedicated GPU):                                   |
|    2D >= 60 FPS; 3D >= 60 FPS (WebGL2 / progressive WebGPU) |
+--------------------------------------------------------------+
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-060 | The RoboCode Studio 2D simulation view shall render at a minimum of 30 frames per second on a Tier 1 device (defined above) running a circuit of up to 20 components, measured in Chrome 120+ on a Chromebook with ARM Cortex-A72 or equivalent. | Must | FPS measurement taken during an active simulation with LEDs, an LCD, and a servo in the circuit. |
| UR-NFR-061 | The RoboCode Studio 3D simulation view shall automatically and transparently degrade to the 2D wokwi-elements rendering path when WebGL2 is not available or when the device GPU benchmark score falls below a platform-defined threshold detectable at session start. | Must | Degradation is silent but notified to the user by a brief dismissible banner: "3D view not available on this device — using 2D mode." |
| UR-NFR-062 | The 3D-to-2D degradation detection and switch shall complete within 3 seconds of first canvas load; the student shall not be shown a blank canvas or an error screen during the switch. | Must | Spinner with "Loading your workspace…" shown during detection. |
| UR-NFR-063 | The total JavaScript bundle delivered to a student's browser for the initial RoboCode Studio load shall not exceed 2 MB compressed (Brotli/Gzip), excluding the Monaco editor (loaded on demand) and WASM binaries (loaded on demand at simulation start). | Should | Webpack/Next.js build output is checked in CI; build fails if bundle exceeds the limit. |
| UR-NFR-064 | The Monaco editor and the AVR/ESP32 WASM simulation binaries shall be loaded lazily (on-demand), not included in the initial page load. | Must | Lazy loading is verified by Network waterfall analysis in CI. |
| UR-NFR-065 | The platform shall use progressive image loading (low-resolution placeholder → full resolution) for all component catalogue images, course thumbnail images, and avatar graphics. | Should | Reduces perceived load time on slow connections. |
| UR-NFR-066 | The RoboCode Studio canvas shall not block the browser's main thread for more than 50 ms during any user interaction (component drag, wire routing, property panel open) as measured by the Chrome Long Tasks API. | Should | Long-task violations reported to the platform's observability stack (OpenTelemetry). |
| UR-NFR-067 | The platform shall not require more than 512 MB of browser memory (measured by the Performance.memory API in Chrome) for a typical student session involving a 20-component circuit simulation and active Monaco editor. | Should | Memory usage reported in automated performance regression tests. |

### Page Load and Time-to-Interactive Targets

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-070 | The marketing site home page (robocode.africa) shall achieve a Largest Contentful Paint (LCP) of ≤ 2.5 s and a Cumulative Layout Shift (CLS) score of ≤ 0.10, measured by Lighthouse on a simulated Slow 4G connection from the closest African CDN edge (Cloudflare/CloudFront). | Must | Measured in CI on every marketing-site deployment. |
| UR-NFR-071 | The student dashboard page (post-login) shall load and be interactive (Time to Interactive ≤ 5 s) on a Tier 1 device over a Slow 4G (8 Mbps downlink, 400 ms latency) network, as measured by a Lighthouse lab report. | Must | Measurement target: Lighthouse TTI ≤ 5 s at the 75th percentile. |
| UR-NFR-072 | RoboCode Studio shall achieve an interactive canvas (first component placeable, simulation controls enabled) within 8 seconds of the student navigating to an existing project on a Tier 1 device over a Slow 4G network. | Must | Measured from navigation start to first meaningful paint of the canvas with the project's components visible. |
| UR-NFR-073 | Subsequent navigations between pages within the platform shall complete in ≤ 1.5 s using client-side routing (Next.js App Router client navigation), excluding the initial page load. | Should | Applies to dashboard → project, project → task, leaderboard → profile, etc. |

---

## Low-Bandwidth and Offline Expectations

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-080 | The platform shall function with a minimum sustained download bandwidth of 1 Mbps for the core student experience (viewing course content, coding in Monaco, running a 2D simulation). Higher-bandwidth features (3D rendering, video tutorials) gracefully degrade or are unavailable at lower speeds. | Must | Bandwidth detection at session start presents a low-bandwidth mode option if connection speed is below 1 Mbps. |
| UR-NFR-081 | All text-based course content (lesson text, task briefs, code examples) shall be served as static assets via the CDN and shall be cacheable by the browser for at least 7 days, enabling re-read without re-downloading. | Must | Cache-Control headers set appropriately; Next.js static generation used for content pages where possible. |
| UR-NFR-082 | The platform shall support a low-bandwidth mode that disables autoplay video, 3D rendering, large image assets, and non-critical animations, reducing the data transferred per page to ≤ 200 KB. | Should | Low-bandwidth mode toggled manually by the student or suggested automatically when slow connectivity is detected. |
| UR-NFR-083 | A student shall be able to compose and edit code in RoboCode Studio and locally simulate (run) a project they have previously opened, even when the internet connection is temporarily interrupted, provided the project was cached by the Service Worker on last visit. | Could | V1 Service Worker caches the last 5 opened projects and the simulation WASM binaries. Saves are queued and synced when connectivity is restored. |
| UR-NFR-084 | When the platform detects loss of connectivity, it shall display a visible but non-blocking offline indicator and shall not lose any unsaved edits for up to 15 minutes; it shall attempt to auto-save when connectivity is restored. | Should | Auto-save state stored in IndexedDB. User is informed of the pending sync. |
| UR-NFR-085 | Platform notifications and badge awards that occur while a student is offline shall be queued server-side and delivered in a batch when the student next connects, without loss of notification content. | Should | Server-side notification queue with a minimum retention of 30 days. |
| UR-NFR-086 | The platform shall support SMS-based notifications for critical events (account approval, password reset, parental consent request) as an alternative channel for students and parents who may not have reliable email or push notification access. | Should | Optional SMS channel via an Africa-compatible SMS gateway (e.g., Twilio, Africa's Talking). Opt-in only; phone number collection subject to data-minimisation policy. |

---

## Availability, Reliability and Resilience

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-090 | Students and Teachers shall expect the platform to be available 99.5 % of the time on a monthly basis (excluding pre-announced maintenance windows), equating to no more than approximately 3.6 hours of unplanned downtime per month. | Must | SLA measured by external uptime monitoring. Status page at status.robocode.africa updated in real time. |
| UR-NFR-091 | Scheduled maintenance shall be communicated to all users with at minimum 48 hours' notice via in-platform banner, email, and the status page. Maintenance windows shall be scheduled outside peak school hours for the Africa/Harare timezone (UTC+2) — preferably 20:00–04:00 local time on weekdays. | Must | Super Admin configures maintenance schedule; notification is sent automatically by the platform. |
| UR-NFR-092 | A student's active simulation session shall not be terminated by a backend service restart or deployment; the simulation runs in-browser (client-side) and shall be resilient to backend unavailability for its core operation. | Must | Backend is required only for project save, authentication, and real-time collaboration (Yjs). Local simulation continues uninterrupted during backend intermittency. |
| UR-NFR-093 | The platform shall implement graceful degradation: if a non-critical microservice (e.g., leaderboard service, notification service, gamification engine) is unavailable, the core student experience — coding, simulating, and viewing course content — shall remain fully functional. | Must | Circuit-breaker patterns required at the API gateway level. Error states for degraded services are communicated as in-platform service status indicators, not as blank pages or uncaught errors. |
| UR-NFR-094 | Student project files (schematic, code) shall be auto-saved at least every 60 seconds while the project is open, and the platform shall retain a minimum of 10 previous versions per project (autosave history) restorable by the student. | Must | Version history accessible from the project options menu. |
| UR-NFR-095 | All user data at rest shall be backed up at minimum daily, with a recovery point objective (RPO) of 24 hours and a recovery time objective (RTO) of 4 hours for full platform restoration from backup, as operationally verifiable by the Super Admin. | Must | Backup and RTO/RPO targets are verified by platform operations team on a quarterly basis. |

---

## Safety, Privacy and Data-Protection Expectations

Safety is the prime directive for RoboCode.Africa. The following user-facing expectations reflect the legal obligations (COPPA, GDPR, GDPR-K, Zimbabwe Cyber and Data Protection Act, POPIA, NDPR, Kenya Data Protection Act) and the age-appropriate design code principles specified in the project canon. Platform-level enforcement mechanisms are specified in the SSD (SR-nnn series); this section captures what users must be able to observe and rely on.

### Privacy Transparency

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-100 | Every user (student, teacher, parent/guardian, admin) shall be presented with a clear, plain-language privacy notice at the point of account creation that explains: what personal data is collected, why it is collected, who it is shared with, how long it is retained, and how to request deletion. | Must | Privacy notice for minors must be written at a reading level appropriate for the minor's age band. A separate, more detailed notice is available for parents/guardians and adults. |
| UR-NFR-101 | The platform shall not collect any personal data from a student that is not strictly necessary for the delivery of the educational service. The sign-up form for students shall request only: first name, last name, email or school ID, date of birth (for age-gating), and grade/year. | Must | Data minimisation per GDPR Art. 5(1)(c) and COPPA § 312.3. Optional fields (avatar, bio) are never required and are clearly marked optional. |
| UR-NFR-102 | Students (and parents/guardians for minors) shall be able to view, download, and request deletion of all personal data held by the platform via a self-service Data and Privacy centre accessible from the account settings page, without needing to email support. | Must | Data export in machine-readable format (JSON). Deletion request initiates a verified workflow subject to applicable retention obligations (e.g., audit logs). |
| UR-NFR-103 | The platform shall not use any student's personal data, usage data, or gamification data for behavioural advertising, profiling for commercial purposes, or sale to third parties. This prohibition applies regardless of the student's age. | Must | Absolute constraint. Violation would constitute a fundamental breach of the platform's child-safety mandate and applicable law. |
| UR-NFR-104 | A student or parent/guardian shall be able to withdraw consent at any time, which shall immediately suspend data processing activities beyond operational necessity and initiate account deactivation within 24 hours. | Must | Withdrawal of parental consent for a minor triggers immediate account suspension pending deletion confirmation. |
| UR-NFR-105 | The platform shall display a clear, persistent and age-appropriate "Who can see my data?" summary on the student's profile settings page, explaining the current visibility settings for their name, projects, leaderboard rank, and gamification badges. | Must | Aligned with age-appropriate design code transparency principle. See also UR-GAM-055. |

### Safeguarding and Communication Safety

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-110 | No unsupervised private messaging between minor students shall be enabled at any time. All communication channels available to students shall be visible to their assigned Teacher and to the School Admin. | Must | See _User Requirements: Communication, Notifications and Safety_ for detailed communication channel requirements (UR-COMM series). |
| UR-NFR-111 | All student-generated content visible to other users (project names, descriptions, comments, display names, chat messages) shall pass through automated profanity and PII filtering before publication, with flagged content held for moderation. | Must | Filtering applies in real time; the student sees their own content immediately but it is held from other users until cleared or rejected. |
| UR-NFR-112 | Any user shall be able to report inappropriate content or behaviour via a clearly visible, one-click "Report" button accessible on all social-facing surfaces (leaderboards, project gallery, comment threads, chat). Report submission shall be acknowledged within the UI immediately, and the moderation outcome notified to the reporter within 72 hours. | Must | Anonymous reporting is supported; reporter identity is never disclosed to the reported user. |
| UR-NFR-113 | The platform shall escalate safeguarding concerns (reports of abuse, harm, self-harm, or exploitation) to the designated School Admin (for school-enrolled students) and to the Super Admin within 1 hour of report submission, via in-platform alert and email. | Must | Escalation does not depend on the automated content filter; human moderator review is triggered immediately for safeguarding categories. |
| UR-NFR-114 | Audit logs of all moderation actions, user consent events, data access events, and administrative actions on student accounts shall be tamper-evident (append-only log with cryptographic integrity verification) and retained per the authoritative retention schedule in Section 15 (UR-COMM-062 to UR-COMM-065): standard platform audit log minimum 12 months; consent records account-lifetime + 3 years; safeguarding records minimum 7 years. | Must | Audit log is accessible to Super Admin and, within scope, to School Admin. Students may request a summary of access events on their account via the Data and Privacy centre (UR-NFR-102). |

### Session and Account Security

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-120 | Student sessions shall expire automatically after 30 minutes of inactivity on a shared/public device configuration, and after 8 hours on a personal device configuration; the school's device-trust policy (set by School Admin) determines which regime applies. | Must | Session expiry is configurable per tenant by School Admin within the Super Admin-defined bounds (5 min – 24 hours). |
| UR-NFR-121 | The platform shall detect concurrent logins from different devices for the same student account and notify the student (and the student's Teacher for minors) with an option to terminate other sessions. | Should | Concurrent login notification delivered as an in-platform notification and optionally via email. |
| UR-NFR-122 | Password reset and account recovery flows for minor students shall require verification via the parent/guardian's registered email or the school's administrative contact, not solely the student's own email, to prevent account takeover via a compromised student email. | Must | School SSO (Google/Microsoft) accounts use IdP-managed recovery; this requirement applies to email-and-password accounts only. |

---

## Supported Devices and Browsers

The following matrix defines the minimum configuration required for a full student experience (2D simulation, Monaco editor, course content). Configurations below the minimum may access marketing pages and limited demo content.

### Supported Browser Matrix

| Browser | Minimum Version | Platform | Notes |
|---------|----------------|----------|-------|
| Google Chrome | 109 | Windows, macOS, ChromeOS, Android | Primary reference browser for CI testing |
| Microsoft Edge | 109 | Windows, macOS | Chromium-based; parity with Chrome |
| Mozilla Firefox | 115 ESR | Windows, macOS, Linux | WebAssembly and WebGL2 required; verify avr8js WASM compat |
| Apple Safari | 16.4 | macOS, iPadOS, iOS | Web Audio, WebGL2, and SharedArrayBuffer support verified |
| Samsung Internet | 20 | Android | Chromium-based; secondary validation tier |
| Chrome for Android | 109 | Android 8+ | Mobile-optimised 2D-only simulation mode |

> 3D simulation (Three.js / React Three Fiber / WebGL2) requires WebGL2 support. Browsers that lack WebGL2 receive the 2D simulation path automatically (UR-NFR-061).

### Device Minimum Specifications

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-130 | The platform shall support the core student experience (2D simulation, code editor, course content) on a device with a minimum specification of: 2 GB RAM, ARMv8 or x86-64 CPU at ≥ 1.5 GHz, 720p (1280 × 720) display, and a supported browser as listed above. | Must | Verified by Tier 1 device performance testing (UR-NFR-060). Chromebook with MediaTek MT8173 or Rockchip RK3399 is the reference Tier 1 device. |
| UR-NFR-131 | On mobile devices (Android smartphones, ≥ 5.5-inch display), the platform shall present a responsive layout that allows students to view course content, read code, and interact with the 2D simulation canvas; the Monaco editor is accessible but secondary on mobile. | Should | Minimum supported Android version: Android 8.0 (Oreo) on Chrome 109+. Monaco editor falls back to a simplified text area on displays narrower than 600 px. |
| UR-NFR-132 | Tablet and iPad support (≥ 9.7-inch display, iPadOS 16+, Android tablet with ≥ 4 GB RAM) shall deliver the full 2D simulation experience with touch-friendly component placement and wiring interactions. | Should | Touch-friendly canvas interactions (tap to select, two-finger zoom, drag to place) verified on iPad Air (5th gen) and a mid-range Android tablet reference device. |
| UR-NFR-133 | The platform shall not require the installation of any browser plugin, extension, or desktop application to deliver the full core student experience. All functionality shall run within a standard browser sandbox. | Must | No Java, Flash, Silverlight, or native extensions. WASM and Web APIs only. |
| UR-NFR-134 | The platform shall be fully operable with JavaScript enabled in the browser; a no-JavaScript fallback shall be provided only for the marketing site home page (a static HTML page with a "Please enable JavaScript" notice). RoboCode Studio requires JavaScript and cannot degrade to a no-JS mode. | Must | Progressive enhancement for the marketing site only. |

### Screen Size and Responsive Layout

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-NFR-140 | All student-facing and teacher-facing pages shall be fully responsive and usable at viewport widths from 360 px (small Android phone) to 2560 px (large desktop monitor), without horizontal scrolling at any supported width. | Must | Breakpoints tested at 360 px, 768 px, 1024 px, 1280 px, 1920 px. |
| UR-NFR-141 | RoboCode Studio shall adapt its panel layout to the available viewport: at widths < 1024 px, the canvas, code editor, and Serial Monitor shall be navigable via a tab switcher rather than displayed simultaneously side-by-side; at ≥ 1024 px, a split-panel (resizable) layout is the default. | Must | Panel layout preference (tabs vs split) is user-configurable and persisted per account. |
| UR-NFR-142 | Text shall scale correctly with browser zoom levels from 50 % to 200 % without content overlap, truncation of interactive controls, or loss of functionality. | Must | Verified at 50 %, 100 %, 150 %, and 200 % browser zoom in CI screenshot tests. |

---

## MoSCoW Priority Summary

| ID | Requirement Summary | Priority |
|----|---------------------|----------|
| UR-NFR-001 | Single-label primary-action discoverability for students | Must |
| UR-NFR-002 | Grade 4–5 reading level for primary student UI text | Must |
| UR-NFR-003 | No more than three sentences before next action | Should |
| UR-NFR-004 | Block-code default for primary students, text toggle | Must |
| UR-NFR-005 | Icon + text label in all primary navigation | Must |
| UR-NFR-006 | Contextual inline help in RoboCode Studio | Must |
| UR-NFR-007 | Plain, encouraging error messages with corrective guidance | Must |
| UR-NFR-008 | Student View vs Teacher View layout separation | Must |
| UR-NFR-009 | Human-readable date/time display for students | Should |
| UR-NFR-010 | Role-specific onboarding tours | Should |
| UR-NFR-020 | WCAG 2.2 AA compliance across all user-facing UI | Must |
| UR-NFR-021 | Minimum 4.5:1 text contrast across all themes | Must |
| UR-NFR-022 | No colour-only information conveyance | Must |
| UR-NFR-023 | Alt text / aria-label on all non-text content | Must |
| UR-NFR-024 | Reduced-motion preference respected for all animations | Must |
| UR-NFR-025 | Visual indicator for simulation audio output | Must |
| UR-NFR-030 | Full keyboard operability including canvas interactions | Must |
| UR-NFR-031 | Keyboard-operable sensor input controls with ARIA | Must |
| UR-NFR-032 | Keyboard alternative to drag-and-drop component placement | Must |
| UR-NFR-033 | Keyboard shortcuts reference in help menu | Should |
| UR-NFR-034 | Correct focus management for modals and toasts | Must |
| UR-NFR-040 | Dyslexia-friendly typography option | Should |
| UR-NFR-041 | Adjustable font size (Small/Medium/Large/XL) | Should |
| UR-NFR-042 | Step-by-step instruction presentation | Must |
| UR-NFR-043 | No auto-playing audio or video | Must |
| UR-NFR-050 | Fully internationalised (i18n) UI string catalogue | Must |
| UR-NFR-051 | English as default language with V1 framework in place | Must |
| UR-NFR-052 | V2 African language packs (Shona, Swahili, Zulu, etc.) | Should |
| UR-NFR-053 | Locale-specific date/number/currency formatting | Should |
| UR-NFR-054 | CSS logical properties (no RTL block) | Could |
| UR-NFR-060 | 2D simulation ≥ 30 FPS on Tier 1 device | Must |
| UR-NFR-061 | Auto 3D-to-2D fallback on unsupported GPU | Must |
| UR-NFR-062 | 3D-to-2D switch within 3 s, no blank canvas | Must |
| UR-NFR-063 | Initial JS bundle ≤ 2 MB compressed | Should |
| UR-NFR-064 | Monaco and WASM binaries loaded lazily | Must |
| UR-NFR-065 | Progressive image loading | Should |
| UR-NFR-066 | No main-thread block > 50 ms per interaction | Should |
| UR-NFR-067 | ≤ 512 MB browser memory for typical session | Should |
| UR-NFR-070 | Marketing site LCP ≤ 2.5 s on Slow 4G | Must |
| UR-NFR-071 | Dashboard TTI ≤ 5 s on Tier 1 / Slow 4G | Must |
| UR-NFR-072 | Studio interactive canvas within 8 s on Tier 1 / Slow 4G | Must |
| UR-NFR-073 | Client-side page transitions ≤ 1.5 s | Should |
| UR-NFR-080 | Platform functional at ≥ 1 Mbps sustained bandwidth | Must |
| UR-NFR-081 | Static course content cacheable for 7 days | Must |
| UR-NFR-082 | Low-bandwidth mode ≤ 200 KB per page | Should |
| UR-NFR-083 | Offline simulation for cached projects (Service Worker) | Could |
| UR-NFR-084 | Offline indicator; no edit loss for 15 minutes | Should |
| UR-NFR-085 | Offline notifications queued and delivered on reconnect | Should |
| UR-NFR-086 | SMS notification fallback channel (opt-in) | Should |
| UR-NFR-090 | 99.5 % monthly availability SLA | Must |
| UR-NFR-091 | 48-hour maintenance notice; off-peak windows | Must |
| UR-NFR-092 | Simulation resilient to backend unavailability | Must |
| UR-NFR-093 | Core experience maintained during non-critical service outage | Must |
| UR-NFR-094 | Auto-save every 60 s; 10-version project history | Must |
| UR-NFR-095 | RPO 24 h / RTO 4 h; daily backups | Must |
| UR-NFR-100 | Plain-language privacy notice at account creation | Must |
| UR-NFR-101 | Minimum personal data collected at student signup | Must |
| UR-NFR-102 | Self-service data view, download, deletion | Must |
| UR-NFR-103 | No behavioural advertising or data sale | Must |
| UR-NFR-104 | Consent withdrawal within 24 hours | Must |
| UR-NFR-105 | "Who can see my data?" summary on profile | Must |
| UR-NFR-110 | No unsupervised private messaging for minors | Must |
| UR-NFR-111 | Real-time profanity/PII filtering on student content | Must |
| UR-NFR-112 | One-click content/behaviour reporting | Must |
| UR-NFR-113 | Safeguarding escalation within 1 hour | Must |
| UR-NFR-114 | Tamper-evident audit logs retained per Section 15 schedule (audit ≥ 12 months; safeguarding ≥ 7 years) | Must |
| UR-NFR-120 | Inactivity session expiry (30 min shared / 8 h personal) | Must |
| UR-NFR-121 | Concurrent login detection and notification | Should |
| UR-NFR-122 | Minor account recovery via parent/guardian or school | Must |
| UR-NFR-130 | Minimum device spec: 2 GB RAM, 1.5 GHz, 720p | Must |
| UR-NFR-131 | Responsive layout on Android smartphones ≥ 5.5 in | Should |
| UR-NFR-132 | Full 2D simulation on tablets ≥ 9.7 in | Should |
| UR-NFR-133 | No browser plugins or desktop installation required | Must |
| UR-NFR-134 | No JS fallback for marketing site only | Must |
| UR-NFR-140 | Responsive 360 px – 2560 px without horizontal scroll | Must |
| UR-NFR-141 | Studio panel layout: tabs < 1024 px, split ≥ 1024 px | Must |
| UR-NFR-142 | Text scales correctly at 50 %–200 % browser zoom | Must |

---

## Cross-References

- _User Requirements: Onboarding, Signup and Approval_ — UR-ONB series: Age-gating at signup underpins UR-NFR-100, UR-NFR-101, and the COPPA/GDPR-K consent requirements.
- _User Requirements: Authentication and Account Management_ — UR-AUTH series: Session expiry (UR-NFR-120), MFA for staff, and minor account recovery (UR-NFR-122).
- _User Requirements: School Onboarding, Custom Domain and White-Labelling_ — UR-SCH series: White-label theme generation must enforce contrast requirements (UR-NFR-021); timezone and device-trust policy are tenant-configurable.
- _User Requirements: RoboCode Studio Canvas, Components and Wiring_ — UR-STU series: Canvas keyboard operability (UR-NFR-030, UR-NFR-032) and 3D-to-2D fallback (UR-NFR-061) are directly exercised in the canvas.
- _User Requirements: Simulation Experience_ — UR-SIM series: Simulation frame-rate targets (UR-NFR-060), audio visual indicators (UR-NFR-025), student-friendly error messages (UR-NFR-007), and ARIA-annotated sensor controls (UR-NFR-031) all apply to the RSE.
- _User Requirements: Code Editor and Programming_ — UR-CODE series: Monaco lazy loading (UR-NFR-064), dyslexia font in editor (UR-NFR-040), and block-code default for primary students (UR-NFR-004).
- _User Requirements: Learning, Courses, Tasks and Assessment_ — UR-LRN series: Reading-level requirements (UR-NFR-002) and step-by-step instruction presentation (UR-NFR-042) apply to all course and task content.
- _User Requirements: Gamification, RoboPoints and Leaderboards_ — UR-GAM series: Privacy visibility controls (UR-NFR-105) complement UR-GAM-055; no behavioural advertising (UR-NFR-103) extends UR-GAM-054.
- _User Requirements: Communication, Notifications and Safety_ — UR-COMM series: Safeguarding escalation (UR-NFR-113), content reporting (UR-NFR-112), and no unsupervised messaging (UR-NFR-110) are enforced by the communication subsystem.
- _User Requirements: Administration and Reporting_ — UR-ADM series: Audit log requirements (UR-NFR-114) and backup/RTO/RPO targets (UR-NFR-095) are verified and managed by the Super Admin and School Admin administrative tooling.


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


