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
