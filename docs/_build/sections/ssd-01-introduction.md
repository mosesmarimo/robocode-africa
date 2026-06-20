# Introduction

## Purpose and Scope of This Document

This System Specification Document (SSD) defines the complete set of system-level requirements for **RoboCode.Africa** — a browser-based platform for teaching Robotics, Coding and Artificial Intelligence to primary and high school students. It translates the user needs captured in the companion **User Requirements Document (URD)** into precise, verifiable, and implementation-ready requirements that engineering, quality assurance, security, and infrastructure teams can act upon directly.

Where the URD asks *what* users need, this SSD specifies *what the system shall do* and *how it shall behave* to satisfy those needs. It covers:

- Functional requirements, decomposed by module (authentication, tenancy, Studio, simulation, code execution, learning management, gamification, communication, moderation, and administration).
- Non-functional requirements across performance, scalability, reliability, availability, maintainability, and portability.
- Interface requirements for external systems, APIs, and integration points.
- Data architecture requirements including schema constraints, retention, and privacy rules.
- Security and child-safety requirements enforcing the platform's safety-first prime directive.
- Infrastructure, deployment, observability, accessibility, and internationalisation requirements.

### Scope Boundaries

This SSD governs the **v1.0 release** of RoboCode.Africa. Scope boundaries are fully inherited from the URD (see **URD Section 1 – Scope**). In summary:

- **In scope:** all capabilities listed in the URD v1.0 in-scope table, including RoboCode Studio IDE, the RoboCode Simulation Engine (RSE), the RoboCode Virtual Machine (RVM), multi-tenant school management, user RBAC, learning management, gamification via RoboPoints, moderated communication, administration dashboards, child-safety compliance, and a **scoped Progressive Web App (PWA) with offline caching** of lesson content, simulation assets, and the most recent 10 student projects, plus an offline edit-and-queue path for those projects (specified in **Section 20 – Accessibility, Internationalisation and Low-Bandwidth Design**, NFR-LBW-013 through NFR-LBW-018). This scoped offline capability is included for v1.0 in response to the African low-connectivity context; it supersedes the URD's original out-of-scope listing for offline/PWA.
- **Out of scope (v1.0):** physical hardware integration, Arduino Nano and ESP8266 board simulation, native mobile applications, in-browser AI/ML model training, a full Parent / Guardian portal, general-purpose offline editing of arbitrary projects (beyond the scoped PWA above), live hardware streaming, and behavioural advertising.

---

## Product Perspective

### System Context

RoboCode.Africa is a multi-tenant, cloud-hosted, browser-delivered Software-as-a-Service (SaaS) platform. It operates at the intersection of an educational Learning Management System (LMS), a web-based Integrated Development Environment (IDE), and a real-time electronics simulator.

```
+--------------------------------------------------------------+
|                        PUBLIC INTERNET                       |
+------+-------------------+-------------------+--------------+
       |                   |                   |
  robocode.africa   school.robocode.africa   custom-domain
  (direct signup)    (school tenant)         (white-label)
       |                   |                   |
+------v-------------------v-------------------v--------------+
|              Cloudflare / CloudFront CDN / Edge             |
+------------------------------+-------------------------------+
                               |
                 +-------------v--------------+
                 |     Next.js App Shell       |
                 |  (marketing + auth flows)   |
                 +-------------+--------------+
                               |
                 +-------------v--------------+
                 |      RoboCode Studio        |
                 |  (React SPA: editor +       |
                 |   canvas + simulator)        |
                 +--+----------+-----------+--+
                    |          |           |
           +--------v--+  +----v----+  +--v-------+
           |  Monaco   |  |  RSE    |  |  RVM /   |
           |  Editor   |  | (avr8js |  | Compiler |
           |           |  | +ESP32  |  | Service  |
           |           |  |+rp2040js|  |          |
           +-----------+  +---------+  +----------+
                               |
               +---------------v---------------+
               |     NestJS Microservices       |
               |  (API Gateway / GraphQL/REST)  |
               +---+----------+----------+-----+
                   |          |          |
           +-------v-+  +-----v--+  +---v------+
           |PostgreSQL|  | Redis  |  |   S3     |
           |(RLS/     |  |(cache/ |  |(assets/  |
           | tenant)  |  | queues)|  | projects)|
           +----------+  +--------+  +----------+
```

*Figure 1.1 — RoboCode.Africa high-level system context diagram.*

### Relationship to External Systems

| External System | Role | Integration Point |
|-----------------|------|-------------------|
| Wokwi open-source libraries (github.com/wokwi) | Simulation core (avr8js, rp2040js, wokwi-elements, wokwi-boards) | Bundled as open-source dependencies; no runtime API call |
| School SSO Identity Providers (Google, Microsoft) | OAuth2/OIDC login for school staff and students | OAuth2 Authorization Code Flow; OIDC discovery endpoints |
| Email provider (SES / SendGrid) | Transactional email (approval, consent, notifications) | SMTP / provider REST API |
| SMS gateway | Low-connectivity fallback notifications | Provider REST API (optional) |
| Payment providers (Stripe, Paystack, Flutterwave) | School subscription billing suited to Africa | REST API; webhook callbacks |
| DNS / ACME (Let's Encrypt) | Automated TLS for custom domains | ACME protocol; CNAME/TXT DNS verification |
| OpenSearch | Full-text search (optional) | REST API |
| Sentry / OpenTelemetry | Error tracking and distributed tracing | SDK; OTLP exporter |

---

## Intended Audience

This SSD is addressed to the following readers. Each audience should pay particular attention to the sections noted.

| Audience | Primary Sections of Interest |
|----------|------------------------------|
| Platform and Backend Engineers | Sections 3, 4, 5, 6, 15, 16, 19 (architecture, stack, auth, tenancy, data, API, infra) |
| Frontend and Studio Engineers | Sections 7, 8, 9, 10 (Studio IDE, RSE, code execution, component catalogue) |
| QA and Test Engineers | All functional sections (5–14); Sections 17, 22 (NFR, traceability) |
| Security and Compliance Officers | Sections 5, 18, 22 (auth, security/privacy, traceability) |
| Data Architects and DBAs | Sections 15, 18 (data architecture, privacy/retention) |
| DevOps and Infrastructure Engineers | Sections 19, 21 (deployment/DevOps, observability) |
| Accessibility Specialists | Section 20 (accessibility, i18n, low-bandwidth) |
| Product Managers | All sections; especially Sections 1, 2, 22 (intro, overview, traceability) |
| Legal and Data Protection Officers | Sections 18, 20 (child safety, data protection, GDPR-K/COPPA) |
| Executive Stakeholders | Sections 1, 2, 17 (intro, context, NFR summary) |

---

## Document Conventions

### Heading Hierarchy

Section numbering is applied automatically at document-assembly time. Within each section file, `##` denotes a major subsection and `###` a sub-subsection. Do not infer global ordering from heading depth alone; use the assembled table of contents.

### Requirement Notation

All requirements in this SSD carry a unique, permanent identifier following the scheme below. A retired requirement is marked `[DEPRECATED]` rather than renumbered.

```
FR-<MODULE>-<nnn>   — Functional Requirement
NFR-<CAT>-<nnn>     — Non-Functional Requirement
IR-<nnn>            — Interface Requirement
DR-<nnn>            — Data Requirement
SR-<nnn>            — Security / Privacy Requirement
```

### Module Codes (FR prefix)

| Code | Module |
|------|--------|
| AUTH | Identity, Authentication and Authorization |
| TEN | Multi-Tenancy, Custom Domains and White-Labelling |
| STU | RoboCode Studio IDE (canvas, wiring, 3D/2D view) |
| SIM | RoboCode Simulation Engine (RSE) |
| CODE | Code Authoring, Validation and Execution |
| LRN | Learning Management and Content |
| TEAM | Teams, Competitions and Collaboration |
| GAM | Gamification, RoboPoints and Leaderboards |
| COMM | Communication, Notifications and Moderation |
| MOD | Content Moderation and Safeguarding |
| ADM | Administration, Analytics and Reporting |

### Non-Functional Requirement Category Codes (NFR prefix)

| Code | Category |
|------|----------|
| PERF | Performance and Response Time |
| SCAL | Scalability and Elasticity |
| AVAIL | Availability and Reliability |
| SEC | Security |
| PRIV | Privacy and Data Protection |
| MAINT | Maintainability and Extensibility |
| PORT | Portability and Browser Compatibility |
| ACC | Accessibility |
| I18N | Internationalisation and Localisation |
| BW | Low-Bandwidth and Connectivity |

### Requirement Tables

All requirements are presented in tables with the following standard columns:

| Column | Meaning |
|--------|---------|
| **ID** | Unique permanent requirement identifier |
| **Requirement** | Precise shall-statement of system behaviour |
| **Priority** | MoSCoW label: Must / Should / Could / Won-t |
| **Acceptance / Notes** | Measurable acceptance criterion or rationale note |

### Priority Scale (MoSCoW)

| Label | Meaning |
|-------|---------|
| **Must** | Non-negotiable for v1.0; system launch is blocked without it |
| **Should** | High-value; included unless resource or time forces deferral |
| **Could** | Desirable; included only if capacity allows |
| **Won-t** | Explicitly excluded from v1.0; may be revisited in a future release |

> Note: "Won-t" is hyphenated to avoid apostrophe rendering issues in certain PDF toolchains.

### Shall / Should / May Language

This document follows RFC 2119 modal-verb conventions adapted to requirements engineering:

- **shall** — a binding requirement; non-compliance is a defect.
- **should** — a strong recommendation; deviation requires documented justification.
- **may** — permitted but not required.

### Diagrams

All diagrams in this SSD are ASCII block diagrams presented inside fenced code blocks (three backticks). No Mermaid, HTML, or external image links are used, ensuring compatibility with all PDF and Markdown renderers.

### Cross-References

Requirements cross-reference other parts of this SSD by **section name and requirement ID**, never by page number. Cross-references to the URD use `UR-<AREA>-<nnn>`, `UC-<nnn>`, or `US-<nnn>` prefixes. Cross-references to SSD requirements use the `FR-`, `NFR-`, `IR-`, `DR-`, or `SR-` prefixes defined above.

### Canonical Names

The following names are used consistently throughout this SSD and must not be substituted with synonyms or abbreviations unless the abbreviation is introduced in parentheses at first use.

| Canonical Name | Refers To |
|----------------|-----------|
| RoboCode.Africa | The overall platform and its public domain (robocode.africa) |
| RoboCode Studio | The browser-based IDE and simulator workspace |
| RoboCode Simulation Engine (RSE) | The simulation execution layer: avr8js + rp2040js + ESP32 core + component behavioural models |
| RoboCode Virtual Machine (RVM) | The simplified/interpreted code execution path within RSE |
| RoboPoints | The platform gamification points currency |
| Tenant | A school with its own subdomain (school.robocode.africa) and optional custom domain |
| Super Admin | RoboCode.Africa platform administrator (global scope) |
| Platform Moderator | Delegated content and safety moderator (global scope) |
| School Admin | Tenant-level administrator |
| Teacher | Educator creating classes and assignments within a tenant |
| Student | Learner (primary-school or high-school sub-class) |
| Parent / Guardian | Consent provider and limited progress viewer |
| Guest / Visitor | Unauthenticated marketing-site and demo user |

---

## Pointer to Glossary

All technical terms, acronyms, and domain-specific vocabulary used in this SSD are defined in **Section 23 – Appendices**, which includes a full Glossary and Acronyms table. On first use in each section, a term is written in full with its acronym in parentheses; thereafter the acronym alone may be used. Readers encountering an unfamiliar term should consult Section 23 before raising a query.

---

## References

The following standards, specifications, frameworks, open-source libraries, regulatory instruments, and component-kit references are cited in this SSD. Normative references impose binding obligations on the system; informative references provide guidance and context.

### Normative Standards and Frameworks

| Reference | Title / Description | Relevance to This SSD |
|-----------|---------------------|-----------------------|
| ISO/IEC/IEEE 29148:2018 | Systems and software engineering — Life cycle processes — Requirements engineering | Requirement notation, well-formedness rules, and traceability approach used throughout this SSD |
| IEEE Std 830-1998 | IEEE Recommended Practice for Software Requirements Specifications | SRS structure, completeness criteria, and quality attributes used as baseline |
| WCAG 2.2, Level AA (W3C, October 2023) | Web Content Accessibility Guidelines | Binding accessibility standard for all user-facing surfaces; see **Section 20 – Accessibility, Internationalisation and Low-Bandwidth Design** |
| OWASP Top 10 (2021 edition) | Open Web Application Security Project Top 10 Web Application Security Risks | Security baseline for authentication, injection, authorisation, and data-protection controls; see **Section 18 – Security, Privacy and Child Safety** |
| OWASP ASVS 4.0 | Application Security Verification Standard | Verification criteria for security requirements in Section 18 |

### Informative Standards

| Reference | Title / Description | Relevance |
|-----------|---------------------|-----------| 
| RFC 2119 (IETF, 1997) | Key words for use in RFCs to indicate requirement levels | Modal-verb conventions (shall/should/may) used in requirement statements |
| RFC 8414 (IETF, 2018) | OAuth 2.0 Authorization Server Metadata | Discovery endpoint for school SSO integrations (FR-AUTH module) |
| OpenID Connect Core 1.0 (OIDC) | OIDC authentication layer over OAuth 2.0 | School SSO identity federation requirements |

### Open-Source Library References

| Reference | URL | Relevance |
|-----------|-----|-----------|
| Wokwi GitHub Organisation | https://github.com/wokwi | Parent organisation for simulator libraries reused by the RSE |
| wokwi-elements | https://github.com/wokwi/wokwi-elements | Web components for 2D electronic component rendering in RoboCode Studio; referenced in **Section 8 – RSE** and **Section 10 – Component Library** |
| avr8js | https://github.com/wokwi/avr8js | JavaScript/WASM ATmega328P simulator powering the Arduino UNO R3 accurate execution path; referenced in **Sections 8 and 9** |
| rp2040js | https://github.com/wokwi/rp2040js | JavaScript/WASM RP2040 simulator powering the Raspberry Pi Pico accurate execution path (runs real UF2/ELF firmware in the browser); referenced in **Sections 8 and 9** |
| wokwi-boards | https://github.com/wokwi/wokwi-boards | Data-driven board manifest schema (board.json + SVG) used as the canonical format for all built-in and custom board definitions in RoboCode Studio; referenced in **Section 8 – RSE** |

### Component Kit References

| Reference | Description | Relevance |
|-----------|-------------|-----------|
| Keyestudio ESP32 Learning Kit | 37-in-1 sensor and component starter kit for ESP32 boards (Alibaba product listing) | Primary source for the ESP32-side component catalogue in **Section 10 – Component and Sensor Library Specification** |
| Robotlinking Arduino Starter Kit | Arduino UNO-compatible starter kit with breadboard, sensors, and actuators (Alibaba product listing) | Primary source for the UNO-side component catalogue in **Section 10** |
| Keyestudio Raspberry Pi Pico Starter Kit | Sensor and component starter kit for Raspberry Pi Pico / RP2040 boards (Alibaba product listing) | Primary source for the Pico-side component catalogue in **Section 10** |

### Regulatory and Legal Instruments

| Instrument | Jurisdiction | Key Obligation for This System |
|------------|-------------|-------------------------------|
| Children's Online Privacy Protection Act (COPPA) | United States | Verifiable parental consent for users under 13; data minimisation; no behavioural advertising; see SR requirements in **Section 18** |
| General Data Protection Regulation (GDPR, EU 2016/679) | European Union | Lawful basis for processing; data subject rights; data minimisation; cross-border transfer rules |
| GDPR — Children's Provisions (GDPR-K) | European Union | Age-appropriate design; consent age threshold (typically 16, variable by member state); no profiling of minors |
| Age Appropriate Design Code (UK ICO, 2021) | United Kingdom | Best-interests-of-the-child design defaults; no coercive design patterns targeting minors |
| Zimbabwe Cyber and Data Protection Act (CDPA, 2021) | Zimbabwe | Data protection obligations; lawful processing; cross-border transfer restrictions; primary African jurisdiction for the platform operator |
| Protection of Personal Information Act (POPIA, 2013) | South Africa | Conditions for lawful processing; special conditions for children's personal information |
| Nigeria Data Protection Regulation (NDPR, 2019) | Nigeria | Data processing principles; consent; data subject rights |
| Kenya Data Protection Act (DPA, 2019) | Kenya | Registration of data controllers; processing principles; protections for children's data |

---

## Relationship to the User Requirements Document (URD)

This SSD is the direct downstream specification of the **RoboCode.Africa User Requirements Document (URD), Version 1.0, dated 19 June 2026**. The two documents form a complementary pair:

| Dimension | URD | This SSD |
|-----------|-----|----------|
| Perspective | User / stakeholder needs | System behaviour and constraints |
| Language | "The system shall allow a Teacher to…" | "FR-LRN-042: The system shall…" |
| Audience | Product, design, legal, business | Engineering, QA, security, DevOps |
| Traceability direction | Upstream source | Downstream realisation |

Every functional requirement in this SSD is traceable to one or more URD requirements (`UR-<AREA>-<nnn>`), use cases (`UC-<nnn>`), or user stories (`US-<nnn>`). Where a system requirement arises from an architectural decision rather than a direct user need, the rationale is documented in the requirement's Acceptance / Notes cell with the prefix `[ARCH]`.

### Traceability Approach

Bidirectional traceability is maintained throughout the SSD:

- **Forward traceability (URD → SSD):** Each URD requirement in scope for v1.0 maps to one or more FR, NFR, IR, DR, or SR identifiers in this SSD. This ensures no user need is left unaddressed.
- **Backward traceability (SSD → URD):** Each SSD requirement cites its originating URD requirement ID(s) in the Acceptance / Notes column. Orphaned requirements (no URD parent) are explicitly justified.
- **Verification traceability (SSD → Test):** Section 22 – Requirements Traceability and Verification provides a full Requirements Traceability Matrix (RTM) mapping each SSD requirement to its verification method (inspection, demonstration, test, or analysis) and the responsible test artefact.

Traceability is maintained as a living artefact in the project requirements management tooling and is reconciled against the URD and the test plan at each sprint boundary.

---

## Document Control

| Field | Value |
|-------|-------|
| Document Title | RoboCode.Africa — System Specification Document (SSD) |
| Section | 1 — Introduction |
| Version | 1.0 |
| Date | 19 June 2026 |
| Author | RoboCode.Africa Engineering Team |
| Status | Draft for Review |
| Approved By | — (pending) |
| Next Review Date | 03 July 2026 |
| Distribution | Engineering, QA, Security, DevOps, Legal, Product |

### Revision History

| Version | Date | Author | Change Summary |
|---------|------|--------|----------------|
| 0.1 | 05 June 2026 | RoboCode.Africa Engineering Team | Initial SSD outline and section scaffold |
| 0.9 | 16 June 2026 | RoboCode.Africa Engineering Team | Full first draft of all sections; internal engineering review |
| 1.0 | 19 June 2026 | RoboCode.Africa Engineering Team | Issued for stakeholder and legal review |

### Configuration and Change Control

After issue at v1.0, changes to this SSD follow the project Change Control Procedure:

1. A Change Request (CR) is raised citing the affected requirement ID(s), the proposed change, and the impact on the URD, test plan, and RTM.
2. The Engineering Lead and Product Manager jointly approve or reject the CR.
3. Approved CRs result in a minor version increment (e.g., 1.0 → 1.1) with a new Revision History entry.
4. Approved changes that alter scope, priority, or user-facing behaviour require re-approval by the Legal and Compliance Officer where child-safety or data-protection requirements are affected.
5. Requirement IDs are never reused; retired requirements are marked `[DEPRECATED vX.Y date]` in-line.
