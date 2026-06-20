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
