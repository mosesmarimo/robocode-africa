# Functional Requirements: Administration, Analytics and Reporting

## Overview

This section specifies the functional requirements for the administration, analytics, and reporting capabilities of RoboCode.Africa. It covers four distinct but interconnected administrative tiers: the Super Admin / Platform Moderator global console; the School Admin (Tenant Admin) console; the Teacher / Educator classroom console; and the cross-cutting Analytics and Reporting Service. Each tier operates within a strict RBAC boundary enforced at both the API Gateway and the PostgreSQL Row-Level Security (RLS) layer, ensuring no tier can access data or actions beyond its defined scope.

All requirements in this section use the `FR-ADM-nnn` identifier prefix. Cross-references to adjacent modules use their canonical prefix (e.g., `FR-AUTH`, `FR-TEN`, `FR-MOD`, `FR-GAM`, `FR-LRN`).

**Child safety is the prime directive.** Wherever a requirement conflicts with administrative convenience, safety and data-protection obligations take precedence. No student account activation, no data export, and no moderation action is exempt from this principle.

---

## Architecture Overview

The diagram below illustrates the high-level structure of the Administration layer, its consoles, and the services they consume.

```
+------------------------------------------------------------------+
|           RoboCode.Africa — Administration Layer                 |
+---------------------------+--------------------------------------+
|  SUPER ADMIN CONSOLE      |  PLATFORM MODERATOR CONSOLE          |
|  (global scope)           |  (delegated global scope)            |
|  • Tenant lifecycle       |  • Global moderation queue           |
|  • Global approval queue  |  • Safeguarding escalations          |
|  • Global content library |  • User ban / suspension             |
|  • Platform config        |  • Direct-signup approvals           |
|  • Feature flags          |  • Audit log search (auth/mod)       |
|  • Billing & plans        |                                      |
|  • System health          |                                      |
|  • Global reports         |                                      |
+---------------------------+--------------------------------------+
|               API Gateway — RBAC / JWT Enforcement               |
+------------------------------------------------------------------+
|  SCHOOL ADMIN CONSOLE (per Tenant)                               |
|  • Student mgmt & approvals  • Branding / domain (FR-TEN)        |
|  • Teacher mgmt              • School policies                   |
|  • Teams & seat limits       • School analytics & reports        |
+------------------------------------------------------------------+
|               Tenant Boundary — PostgreSQL RLS (tenant_id)       |
+------------------------------------------------------------------+
|  TEACHER CONSOLE (per Class, within Tenant)                      |
|  • Class & enrolment mgmt    • Submission inbox & grading        |
|  • Assignment authoring      • Student progress & mentoring      |
|  • Class reports & exports                                       |
+------------------------------------------------------------------+
                |               |               |
         PostgreSQL        Redis (cache,   S3-compatible
       (multi-tenant,       queues,        storage
        tenant_id + RLS)   leaderboards)  (exports, assets)
```

---

## Super Admin Console

The Super Admin holds the highest-privilege role on the platform. Super Admin accounts must have TOTP MFA enrolled at all times (FR-AUTH-060) and are subject to the shortest session-inactivity timeout (FR-AUTH-075). All capabilities described in this sub-section operate across every tenant and every user on the platform.

### Tenant Lifecycle Management

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-001 | The system **shall** provide a Tenant Management console enabling the Super Admin to create, view, edit, suspend, reinstate, and permanently delete tenant (school) records. | Must | Deletion is a two-step confirmation: preview then typed confirmation string. Triggers tenant-offboarding workflow (FR-TEN). |
| FR-ADM-002 | Each tenant record **shall** display: tenant name, subdomain, custom domain (if configured), subscription plan tier, seat limit, active student count, active teacher count, account status, creation date, and last-activity date. | Must | Sortable, filterable table; CSV export available. See FR-TEN for domain/branding fields. |
| FR-ADM-003 | The system **shall** allow the Super Admin to assign or change the subscription plan for any tenant, effective immediately or at the next billing cycle; a plan-change notification email **shall** be dispatched to the School Admin of the affected tenant within 60 seconds. | Must | Plan tier determines seat limit, content access, and feature-flag grants (FR-ADM-023). |
| FR-ADM-004 | The system **shall** allow the Super Admin to suspend or reinstate a tenant. A suspension **shall** require a mandatory reason field, immediately revoke all active user sessions in the tenant, display a tenant-suspension notice on login attempts, and write an immutable audit log entry. | Must | FR-AUTH-073 session-revocation path used. Reinstatement restores access without requiring re-approval of individual accounts. |
| FR-ADM-005 | The Super Admin **shall** be able to assume the context of a School Admin for diagnostic purposes ("sudo into tenant", FR-AUTH-103). The impersonation session **shall** display a persistent banner, be time-limited to 60 minutes, prevent billing changes or data deletions, and write all actions to the audit log attributed to both the Super Admin actor and the impersonated identity. | Should | Impersonation session must be automatically terminated at the 60-minute mark. |
| FR-ADM-006 | The Super Admin **shall** be able to search for any user across all tenants by email address, username, or internal user ID; results **shall** return only the fields necessary for identification and triage, observing data-minimisation obligations. | Must | Cross-tenant search must not return raw dates of birth; only age-band classification returned. |
| FR-ADM-007 | The system **shall** allow the Super Admin to export a filtered or full tenant list as CSV or JSON, including: plan tier, seat count, contract start/end dates, and billing contact email. | Should | Export URL is pre-signed, time-limited (24 h), not CDN-cached; export event is audit-logged. |

### Global Approval Queue

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-010 | The system **shall** maintain a Global Approval Queue visible to the Super Admin and delegated Platform Moderators, containing all accounts registered directly on `robocode.africa` that are in `PENDING_APPROVAL` or `UNDER_REVIEW` state (FR-AUTH-030). | Must | Queue displays: applicant name, email, declared role, age band, registration date, email-verification status, and parental-consent status. |
| FR-ADM-011 | The Super Admin and Platform Moderator **shall** be able to approve or reject individual applications, or perform a bulk approve/reject on up to 100 records in a single operation; rejection **shall** require selection of a reason from a controlled vocabulary plus an optional free-text note. | Must | Bulk operations must complete transactionally; partial failure must roll back the batch and report per-record errors. |
| FR-ADM-012 | Rejected applicants **shall** receive an automated email explaining the rejection reason at a language level appropriate to the applicant's declared age; minor rejection emails **shall** be addressed to the guardian email where one is on record. | Must | Email templates editable by Super Admin via Platform Configuration (FR-ADM-030). |
| FR-ADM-013 | The approval queue **shall** surface any pending parental-consent verification items alongside the associated student application; an account **shall not** be activatable while parental consent remains pending (FR-AUTH-020). | Must | Co-located display prevents premature approval. |
| FR-ADM-014 | The Super Admin **shall** be able to delegate approval authority for specific registration categories (e.g., direct-signup students, direct-signup teachers) to a Platform Moderator without delegating Super Admin-level system configuration or billing access. | Should | Delegation is role-scoped and revocable at any time; delegation events are audit-logged. |

### Global Content Library Management

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-020 | The system **shall** provide a Global Content Library console enabling the Super Admin to create, edit, version, publish, unpublish, archive, and permanently delete courses, modules, lesson templates, project templates, and component catalogue definitions. | Must | Published-content changes must not corrupt existing student progress records; the system must retain at least 3 prior content versions and support rollback. |
| FR-ADM-021 | The Super Admin **shall** be able to designate content items as "platform-required" (pushed to all tenants) or "optional" (available for School Admin opt-in); platform-required content **shall not** be removable or overridden by a School Admin. | Should | Plan-tier gating (FR-ADM-022) may restrict which tenants see optional content. |
| FR-ADM-022 | The Super Admin **shall** be able to restrict content items to specific subscription plan tiers; content not accessible under a tenant's plan **shall** appear as locked/preview-only to School Admins and Teachers in that tenant. | Should | Gate evaluated at content-delivery API; not a UI-only check. |
| FR-ADM-023 | The Super Admin **shall** be able to preview any content item as it would appear to a Student, Teacher, or School Admin before publishing; previews of interactive project templates **shall** render in a sandboxed instance of RoboCode Studio. | Must | Preview mode must be read-only and not create persistent session state. |
| FR-ADM-024 | The system **shall** manage the simulator component catalogue (FR-SIM, FR-CODE): the Super Admin **shall** be able to add new component definitions, update component metadata, and retire deprecated components; retiring a component **shall** require a migration path for existing projects that reference it, maintaining backwards-compatibility for at least two prior component schema versions. | Must | Component catalogue changes must not corrupt saved project files. See Component and Sensor Library Specification section. |
| FR-ADM-025 | The system **shall** manage an extensible, data-driven board library using the wokwi-boards manifest format (github.com/wokwi/wokwi-boards) as the canonical board schema: the Super Admin **shall** be able to upload, validate, approve, and retire board definitions; the built-in library (Arduino UNO R3 simulated with avr8js, ESP32 DevKit simulated with the ESP32 core, and Raspberry Pi Pico simulated with rp2040js, plus other standard wokwi-boards entries) **shall** always be available; no code deployment is required to add a board. | Must | Each board definition (board.json + SVG asset) is validated against the JSON schema and a pin-sanity check on upload. Non-admin uploads (approved advanced users / Teachers) pass through the standard approval/moderation workflow before becoming available to learners. Each definition binds to an MCU core target (avr8js / rp2040js / ESP32 core). |

### Global Moderation Console

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-030 | The system **shall** provide a Global Moderation Console, accessible to the Super Admin and Platform Moderator, displaying all escalated content flags, safeguarding reports, and automated moderation alerts across all tenants, filterable by tenant, severity, flag type, date range, and resolution status. | Must | See Communication, Notifications and Moderation section (FR-MOD) for the full moderation pipeline. |
| FR-ADM-031 | The Super Admin **shall** be able to configure global moderation rules: profanity and PII filter word lists, automated content-scan thresholds, and escalation routing rules; all rule changes **shall** be audit-logged with before/after values and version-controlled. | Must | Rule changes must propagate to the moderation pipeline within 60 seconds. |
| FR-ADM-032 | The Super Admin **shall** be able to suspend, deactivate, or permanently ban any user account across any tenant from the Moderation Console, with a mandatory reason field and an immediate immutable audit log entry; permanent bans **shall** prevent re-registration with the same verified email or identity. | Must | Ban propagation to session store via FR-AUTH-073 within 5 seconds. |
| FR-ADM-033 | Safeguarding escalations that meet the platform-policy threshold **shall** trigger an automated notification to the Super Admin on-call within 5 minutes of the escalation event, and **shall** generate a structured safeguarding report in a configurable format suitable for transmission to relevant authorities. | Must | Multi-channel delivery: email + webhook (PagerDuty/Opsgenie). See FR-MOD safeguarding escalation requirements. |
| FR-ADM-034 | The Super Admin **shall** be able to view, search, and export the complete audit trail for any user or tenant, including authentication events (FR-AUTH-110–113), moderation actions, and all administrative actions, filterable by actor, target, event type, and date range. | Must | Audit log export is encrypted, access-controlled, and itself logged. Retention: 7 years minimum for safeguarding events, 12 months for standard events. |

### Platform Configuration and Feature Flags

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-040 | The system **shall** provide a Platform Configuration console enabling the Super Admin to manage: supported languages and locales, subscription plan definitions, default session-timeout values, MFA enforcement policies, maintenance-window schedules, and global feature flags; all changes **shall** be audit-logged with before/after values. | Must | Configuration values stored in a versioned config store; changes do not require a code deployment. |
| FR-ADM-041 | Feature flags **shall** allow the Super Admin to enable or disable specific platform capabilities (e.g., 3D simulation view, block-based coding mode, team collaboration, RoboPoints, specific component families) globally or per subscription plan tier; flag changes **shall** propagate to all active user sessions within 60 seconds via a real-time config-push mechanism or short-lived cache expiry. | Should | Feature flag store backed by Redis with a pub/sub broadcast to connected Socket.IO clients. |
| FR-ADM-042 | The Super Admin **shall** be able to configure and schedule maintenance windows; during a scheduled maintenance window the platform **shall** display a configurable maintenance notice, gracefully decline new logins, and dispatch advance notice to all active users at least 24 hours before the window via the notification system (FR-COMM). | Must | Maintenance notice content is editable by Super Admin; must support internationalisation (FR-I18N). |
| FR-ADM-043 | The system **shall** allow the Super Admin to manage transactional email templates for the platform (registration, consent, approval, rejection, notification, digest, maintenance-notice emails); templates **shall** support variable substitution, plain-text equivalents, and per-locale variants. | Should | Templates stored in S3-compatible object storage; versioned. Changes audited. |
| FR-ADM-044 | The Super Admin **shall** be able to configure active payment processors (Stripe, Paystack, Flutterwave) per region; payment processor credentials **shall** be stored using encrypted secrets management; no plaintext credentials **shall** appear in audit logs or configuration exports. | Must | See FR-ADM-050 for billing console requirements. |

### Billing and Subscription Plan Management

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-050 | The system **shall** provide a Billing Console displaying all tenants' subscription plans, billing cycles, payment statuses, outstanding invoices, and seat utilisation; the console **shall** be filterable by plan tier, payment status, and region. | Must | Billing console is restricted to Super Admin; Platform Moderator has no billing access. |
| FR-ADM-051 | The Super Admin **shall** be able to define, edit, and retire subscription plan tiers, specifying: plan name, price, seat limits, included feature flags, content access level, and trial duration; retiring a plan **shall not** automatically change existing tenants on that plan — affected tenants must be explicitly migrated by the Super Admin. | Must | Plan definitions version-controlled; retirement requires explicit migration confirmation. |
| FR-ADM-052 | The platform **shall** automatically notify both the Super Admin and the affected School Admin when a subscription payment fails; a configurable grace period (default 7 days) **shall** be enforced before service degradation; service degradation during the grace period **shall** present a read-only mode rather than immediate lockout. | Must | Grace period and degradation behaviour configurable per plan tier. |
| FR-ADM-053 | The Super Admin **shall** be able to manually issue or revoke subscription credits, apply promotional discounts, or extend trial periods for individual tenants; all manual billing adjustments **shall** require a mandatory reason field and be audit-logged. | Should | Adjustment history visible in the tenant's billing record. |

### System Health Dashboard

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-060 | The system **shall** provide a System Health dashboard for the Super Admin displaying real-time and historical metrics: API Gateway latency (p50, p95, p99), RoboCode Simulation Engine (RSE) throughput and error rate, active user sessions, background-job queue depths, Redis cache hit rate, and PostgreSQL connection-pool utilisation. | Must | Dashboard built on the platform's OpenTelemetry / Prometheus / Grafana observability stack. See Observability, Logging, Monitoring and Support section. |
| FR-ADM-061 | The System Health dashboard **shall** surface active incidents and platform alerts with the ability to acknowledge and annotate incidents without leaving the admin console; alert integration **shall** support PagerDuty, Opsgenie, or an equivalent webhook target. | Should | Alert state stored in Redis; acknowledgements audit-logged. |
| FR-ADM-062 | The Super Admin **shall** be able to view CDN and edge performance metrics segmented by geographic region, with particular visibility into Africa-region delivery latency (Cloudflare/CloudFront, `af-south-1` cloud region) to support SLA monitoring for low-bandwidth African markets. | Should | Metrics sourced from Cloudflare Analytics API and cloud provider CloudWatch/Monitoring APIs. |
| FR-ADM-063 | The system **shall** dispatch automated alerts to the Super Admin and configured on-call channels when any of the following thresholds are breached: API error rate above 1 %, RSE failure rate above 0.5 %, p95 API latency above 2 000 ms, or any microservice reporting zero healthy instances; alert latency from threshold breach **shall not** exceed 2 minutes. | Must | Prometheus alerting rules; multi-channel delivery. See NFR-AVAIL and Observability section. |

### Global Analytics and Reports

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-070 | The system **shall** provide a Global Analytics dashboard for the Super Admin displaying platform-wide metrics: total active tenants, registered and active users by role, new registrations over time, daily and monthly active users (DAU/MAU), RoboPoints issued and redeemed, course and module completions, and RSE session volumes; the dashboard **shall** be filterable by date range and exportable as CSV and PDF. | Must | Metrics aggregated by the Analytics Service on a scheduled pipeline; near-real-time (< 1 h lag) for session counts. |
| FR-ADM-071 | The Super Admin **shall** be able to generate cross-tenant comparative reports showing engagement, learning outcomes, and retention metrics per tenant; such reports **shall** anonymise individual student data and **shall not** expose PII of students from any single tenant. | Should | Anonymisation applied at the query layer, not just the export layer. |
| FR-ADM-072 | The system **shall** produce a Safeguarding Incidents Report for the Super Admin and Platform Moderator summarising moderation actions, escalations, and resolutions by tenant and time period; this report **shall** be role-restricted, exportable in a structured format suitable for regulatory submission, and encrypted and watermarked on export. | Must | Report access is itself audit-logged; export links are pre-signed and single-use. |
| FR-ADM-073 | The system **shall** generate automated weekly and monthly summary reports delivered by email to configured Super Admin recipients, covering: new tenant activations, churn, platform errors, moderation activity summary, and financial summary; report recipients must be configurable (multiple Super Admin addresses supported). | Should | Report generation triggered by a scheduled background job; delivery via transactional email (SES/SendGrid). |

---

## School Admin Console

The School Admin manages a single tenant (school). Their scope is strictly limited to their own tenant; the PostgreSQL RLS policy and the JWT `tenant_id` claim enforce this boundary at the data layer regardless of the API call path. Branding and custom-domain configuration requirements are specified in the Multi-Tenancy, Custom Domains and White-Labelling section (FR-TEN) and are not repeated here.

### Student Account Management and Approvals

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-080 | The system **shall** provide a Student Management console for the School Admin displaying all student accounts in the tenant with columns: name, username, grade/year group, registration date, account status, last-active date, RoboPoints total, and assigned Teacher(s); the console **shall** support sorting, filtering by status/grade/teacher, and CSV export. | Must | Tenant-scoped; RLS prevents cross-tenant data leakage. |
| FR-ADM-081 | The School Admin **shall** have a Signup Approvals queue for all accounts registered via the school's subdomain or custom domain, surfacing: applicant name, email, declared role, age band, registration date, email-verification status, and parental-consent status for minors; individual and bulk approve/reject (up to 100 records) **shall** be supported. | Must | An account **shall not** be activatable while parental consent is pending (FR-AUTH-020). |
| FR-ADM-082 | Rejection of a student application **shall** require a reason from a controlled vocabulary; the rejection reason **shall** be communicated by email to the applicant (and the guardian email for minors). | Must | Email templates configurable by the School Admin within the bounds set by the Super Admin. |
| FR-ADM-083 | The School Admin **shall** be able to suspend, reinstate, or permanently deactivate individual student accounts with a mandatory reason field; suspension **shall** immediately invalidate all active sessions (FR-AUTH-073) and notify the student. | Must | Permanent deactivation initiates the data-retention and deletion workflow (FR-AUTH-082). |
| FR-ADM-084 | The School Admin **shall** be able to perform a supervised password reset on behalf of any student in the school; all supervised resets **shall** generate an immutable audit log entry and notify the student. | Must | Minor account resets additionally notify the linked guardian (FR-AUTH-097). |
| FR-ADM-085 | The School Admin **shall** be able to manually assign or re-assign students to classes and to Teacher accounts within the tenant without requiring teacher or student action; assignment changes **shall** trigger notifications to the affected Teacher and optionally the student. | Must | Notification delivery via FR-COMM notification service. |
| FR-ADM-086 | The School Admin **shall** be able to bulk-import student accounts via a downloadable CSV template; each row **shall** be validated before processing; per-row errors **shall** be reported without failing the entire import; imported accounts **shall** enter the Signup Approvals queue (not auto-approved). | Should | CSV template includes: first name, last name, email, grade, year group, guardian email (optional). |
| FR-ADM-087 | The School Admin **shall** be able to view and manage parental/guardian consent records for all minor students in the tenant, and manually mark consent as received (for paper consent obtained outside the platform) with a mandatory supporting note; manual consent-marking **shall** generate an audit log entry and notify the Super Admin for oversight. | Must | Manual consent marks are flagged in the consent record as "manual override" alongside the actor identity and note. |

### Teacher Account Management

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-090 | The School Admin **shall** be able to invite Teacher / Educator accounts by email; invitees **shall** receive a time-limited (72-hour) invitation link; Teacher accounts **shall** require School Admin approval before activation; issued invitation links **shall** be revocable before use and re-sendable on expiry. | Must | Invitation tokens are single-use; expiry generates an audit log entry. |
| FR-ADM-091 | The School Admin **shall** be able to view all Teacher accounts in the tenant with columns: name, email, assigned classes, last-active date, and MFA enrollment status. | Must | MFA-status visibility enables enforcement of FR-AUTH-060. |
| FR-ADM-092 | The School Admin **shall** be able to assign or remove a Teacher's access to specific classes; a Teacher with no assigned classes retains their account but cannot access any student data; removal from all classes **shall** trigger a notification to the affected Teacher. | Must | Class assignment changes are audit-logged. |
| FR-ADM-093 | The School Admin **shall** be able to suspend or permanently deactivate Teacher accounts; active class assignments **shall** be reassigned or unassigned before permanent deactivation completes; the console **shall** surface a blocking warning if unresolved assignments exist. | Must | Deactivation follows FR-AUTH-082; audit-logged with mandatory reason. |
| FR-ADM-094 | The School Admin **shall** be able to enforce MFA as mandatory for all Teacher accounts in the tenant; affected Teachers **shall** receive a notification with a configurable grace period (default 48 hours) before the policy takes effect. | Should | Policy enforcement evaluated at login; non-compliant Teachers redirected to MFA enrollment gate (FR-AUTH-063). |

### Seat Management and Teams

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-095 | The School Admin **shall** be able to set and modify the maximum number of active student seats for the tenant within the limits of the subscription plan; attempts to activate accounts beyond the seat limit **shall** be blocked with a clear upgrade prompt; seat-count changes **shall** be reflected in the Super Admin Billing Console in real time. | Must | Seat usage = count of ACTIVE student accounts in the tenant. |
| FR-ADM-096 | The School Admin **shall** be able to view all teams in the tenant: team name, members, assigned Teacher mentor, competition entries, and current status; team management actions (forming, dissolving) are delegated to Teachers and governed by the Teams, Competitions and Gamification section (FR-TEAM). | Must | Read-only team overview in the School Admin console. |
| FR-ADM-097 | The School Admin **shall** be able to enrol the tenant in platform-hosted competitions and approve teams from the school for competition entry; competition-enrolment approval **shall** trigger notifications to the Teacher mentor and team members. | Should | Competition eligibility governed by FR-TEAM. |

### School Policies

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-100 | The system **shall** allow the School Admin to configure tenant-level policies: minimum password complexity for student accounts (within platform minimums, FR-AUTH-041), MFA enforcement for Teachers (FR-ADM-094), shared-device/classroom-mode defaults, session-timeout overrides (within platform-defined bounds, FR-AUTH-075), and whether custom avatar uploads are permitted for high-school students. | Must | Policy changes take effect within 60 seconds and are audit-logged. |
| FR-ADM-101 | The School Admin **shall** be able to configure notification delivery preferences for the tenant: which events generate email notifications, whether optional SMS notifications are enabled for low-connectivity contexts, and the frequency of digest notifications sent to Teachers. | Should | Tenant notification preferences must not override individual user preferences where those preferences are more restrictive. |
| FR-ADM-102 | The School Admin **shall** be able to restrict student access to specific global content items (courses or modules) by blocking them at the tenant level; blocked content **shall** appear as locked/unavailable to students in the tenant but remain visible to the School Admin. | Should | Block list is per-tenant; does not affect global library availability for other tenants. |

### School Analytics and Reports

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-110 | The system **shall** provide a School Analytics dashboard for the School Admin displaying: total enrolled students, students active in the last 7 and 30 days, course completion rates, average RoboPoints per student, top-performing classes, RSE session count, and engagement breakdown by grade/year group; metrics **shall** be refreshed at least daily (near-real-time preferred). | Must | Dashboard data is tenant-scoped via RLS; no cross-tenant data exposed. |
| FR-ADM-111 | The School Admin **shall** be able to drill down from the School Analytics dashboard to per-class and per-student views; drill-down **shall** observe data-minimisation: aggregate metrics only at the admin level unless a safeguarding reason overrides; private student project portfolios **shall not** be accessible to the School Admin except under a documented safeguarding procedure. | Must | Privacy-first drill-down; safeguarding override path is audit-logged with mandatory reason. |
| FR-ADM-112 | The system **shall** support generation and export of the following school-scoped report types: Student Enrolment Report (students by class, status, grade), Engagement Report (session frequency, course progress), Assessment Report (task completion rates and grade distributions, anonymised at aggregate level), and Safeguarding Report (moderation flags and resolutions for the tenant). | Must | Reports exportable as CSV and PDF; PDF **shall** include the school's white-label branding (logo, school name, FR-TEN). |
| FR-ADM-113 | The School Admin **shall** receive an automated weekly digest email covering: new student registrations, pending approval count, class activity summary, and any unresolved moderation flags; the digest email body **shall not** contain PII of flagged students but **shall** link to the secure console. | Should | Digest frequency configurable (weekly / bi-weekly); configurable recipient list within the tenant's School Admins. |
| FR-ADM-114 | The School Admin **shall** be able to view and export the authentication event audit log for all users within the tenant (FR-AUTH-113), filterable by user, event type, and date range; the export action **shall** be itself audit-logged. | Must | Audit log is append-only; School Admin cannot delete or alter log entries. |

---

## Teacher Console

The Teacher / Educator administers learning and progress at the classroom level. Teachers hold read-write access to classes, assignments, and student records exclusively within their assigned classes in the same tenant. They have no visibility into other Teachers' classes unless explicitly granted by the School Admin. All Teacher actions are evaluated against the JWT `tenant_id` and the class-assignment lookup table at the service layer.

### Class Management

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-120 | The system **shall** allow the Teacher to create and manage classes, specifying: class name, grade/year group, academic year, and an optional description; created classes **shall** be visible in the School Admin's tenant view immediately on creation. | Must | A Teacher may only manage classes to which the School Admin has assigned them. |
| FR-ADM-121 | The Teacher **shall** be able to add students from the tenant's approved student roster to a class, and remove students from a class without deactivating their account; add and remove events **shall** trigger notifications to the affected student. | Must | Roster-based addition prevents adding unapproved accounts. |
| FR-ADM-122 | The Teacher **shall** be able to archive a class at the end of an academic period; archived classes **shall** be read-only but their data (assignments, submissions, grades) **shall** be retained and accessible for reporting; archived classes **shall not** consume active-seat headroom. | Must | Archiving does not delete student progress records (FR-LRN). |
| FR-ADM-123 | The Teacher **shall** be able to configure shared-device/classroom mode for a class; shared-device mode activation **shall** be logged and visible to the School Admin. | Must | Shared-device mode reduces session-timeout to a shorter value defined by the School Admin policy (FR-ADM-100). |
| FR-ADM-124 | The Teacher **shall** be able to duplicate an existing class structure (assignment templates, grading rubrics, class settings) without copying student enrolments or historical submission data, to bootstrap a new class for a new academic year. | Should | Duplication is a server-side copy operation; the duplicate class enters an unarchived, unenrolled state. |

### Assignment and Task Authoring

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-130 | The system **shall** allow the Teacher to create coding tasks and robotics project assignments specifying: title, rich-text description, learning objectives, due date, allowed programming modes (block-based / Arduino C++ / MicroPython / CircuitPython / all), target board (Arduino UNO R3 / ESP32 / Raspberry Pi Pico / custom board from the extensible board library), starter project template, required component list, grading rubric, and whether collaborative team submission is permitted. | Must | Rich-text editor must support embedding of reference diagrams and images. Assignment creation integrates with FR-LRN (Learning Management) for curriculum alignment. Custom boards available to a Teacher are those approved in the tenant's board library (see FR-ADM-024). |
| FR-ADM-131 | The Teacher **shall** be able to assign tasks to a whole class, a sub-group of students within a class, or individual students; assignments **shall** appear on assigned students' dashboards on activation. | Must | Bulk assignment operable from a class view with multi-select. |
| FR-ADM-132 | The Teacher **shall** be able to set a visible or hidden due date, and enable or disable late submissions with an optional late-penalty configuration (e.g., deduct n % per day late). | Should | Hidden due dates support surprise assessments. Late-penalty amounts are configurable per assignment. |
| FR-ADM-133 | The Teacher **shall** be able to publish an assignment immediately or schedule it for future release; scheduled release **shall** respect the tenant's configured timezone (FR-TEN). | Should | Scheduled releases are queued in Redis and dispatched by the background-job service. |
| FR-ADM-134 | The Teacher **shall** be able to edit an assignment after publication; a change-notification **shall** be sent to all assigned students; edits that alter the due date **shall** surface a warning if submissions already exist; all edits **shall** be versioned so the grader can see which version each submission was made against. | Must | Versioning uses immutable content snapshots stored in S3-compatible object storage. |

### Submission Inbox and Grading

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-140 | The system **shall** provide a Submission Inbox for the Teacher displaying all student project submissions for an assignment, sortable by student name, submission date, and grade status; the Teacher **shall** be able to view, open in preview, and download any submission. | Must | Opening a submission in RoboCode Studio must load the student's exact saved project state at submission time (not the current live project state). See FR-CODE for project snapshot mechanics. |
| FR-ADM-141 | The Teacher **shall** be able to run (simulate) a student's submitted project in RoboCode Studio from the grading view without altering the submission record or the student's live project state. | Must | Simulation is launched in a read-only, sandboxed context; no writes to the student's project or submission. |
| FR-ADM-142 | The Teacher **shall** be able to grade student submissions against the assignment rubric: entering a numeric score and qualitative written feedback per submission; grades and feedback **shall** be visible to the student only after the Teacher explicitly publishes results; no grade data **shall** be accessible to students before publication. | Must | Grade publication is a deliberate, explicit action; cannot be triggered accidentally. Audit-logged. |
| FR-ADM-143 | The system **shall** support automated grading for tasks with deterministic expected outputs (e.g., LED blink frequency verified against RSE state logs); a manual review override **shall** always be possible; automated grading **shall** log the test conditions, expected outputs, and actual outputs for audit purposes. | Should | Automated grading results surface in the Submission Inbox alongside the manual-review option. |
| FR-ADM-144 | The Teacher **shall** be able to return a submission to the student for revision with written feedback attached; the student **shall** be notified and may resubmit once within the configured resubmission window; resubmission **shall** overwrite the previous submission in the inbox but retain a version history accessible to the Teacher. | Should | Version history stored in S3-compatible object storage with submission timestamps. |
| FR-ADM-145 | The Teacher **shall** be able to award bonus RoboPoints to a student for exceptional work as part of the grading action; the award **shall** be recorded in the RoboPoints ledger with the Teacher's user ID and the assignment reference (FR-GAM); the award **shall** be visible to the School Admin in the school's RoboPoints report. | Could | Bonus award amounts are configurable by the Teacher within a maximum defined by the School Admin policy. |

### Student Progress and Mentoring

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-150 | The system **shall** allow the Teacher to view an individual student's progress dashboard within their assigned class: completed and in-progress tasks, submission dates, grades received, RoboPoints earned, RSE session history, and any safeguarding flags associated with the student; visibility is limited to the Teacher's own assigned classes. | Must | Cross-class access requires explicit School Admin grant. Progress dashboard data is sourced from FR-LRN learning-progress service. |
| FR-ADM-151 | The Teacher **shall** be able to record private mentoring notes on a student's profile (visible only to Teachers and the School Admin within the tenant, not to the student); notes **shall** be dated, attributable to the authoring Teacher, and included in safeguarding escalation reports if the student is subsequently reported. | Should | Mentoring notes stored as an append-only series; the Teacher may add but not delete notes. |
| FR-ADM-152 | The Teacher **shall** be able to manage team mentoring within their assigned classes: viewing team composition, team project progress, and team RoboPoints for teams in the class; and accepting or declining a request to mentor a specific team. Team formation and dissolution are governed by FR-TEAM. | Must | Teacher-level team oversight is read-write on the mentoring relationship; team composition changes are the domain of FR-TEAM. |
| FR-ADM-153 | The Teacher **shall** be able to raise a student behaviour, content, or safeguarding concern from the student profile view, escalating it to the School Admin's moderation console; escalation **shall** generate an immediate notification to the School Admin and an immutable audit log entry with the Teacher's identity, timestamp, and concern description. | Must | Escalation path integrates with FR-MOD safeguarding pipeline. Notification latency: < 5 minutes. |

### Class Reports

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-160 | The system **shall** provide a Class Reports section for the Teacher including: assignment completion rate per assignment, grade distribution per assignment (histogram), per-student progress summary, class-level RoboPoints leaderboard, and RSE usage statistics (session count, average session duration); reports **shall** be limited to the Teacher's assigned classes. | Must | Histogram data computed server-side; leaderboard sourced from Redis sorted set (FR-GAM). |
| FR-ADM-161 | The Teacher **shall** be able to generate and download a per-student Progress Report as a PDF; the report **shall** include: completed tasks, grades, teacher-feedback headlines, and RoboPoints total; the PDF **shall** include the school's white-label branding; granular rubric breakdowns **shall** be toggleable. | Must | PDF generation server-side; delivered via pre-signed S3 URL (24-hour TTL, not CDN-cached). |
| FR-ADM-162 | The Teacher **shall** be able to export the full class grade book as a CSV file containing: student names (with optional anonymisation to student IDs), assignment names, scores, submission dates, and final grade per assignment. | Must | Anonymised export supports use in external assessment systems without exposing PII. |
| FR-ADM-163 | The Teacher **shall** be able to view aggregated class engagement trends over time: weekly active student count, cumulative RSE session hours, task-completion velocity (tasks completed per week), and RoboPoints earning rate; trend data **shall** be presented as chart visualisations within the console; raw data **shall** be exportable as CSV. | Should | Charts rendered client-side (React); raw data from Analytics Service via GraphQL. |

---

## Analytics and Reporting Service

The Analytics and Reporting Service is the shared backend subsystem that underpins all dashboards, on-demand reports, and scheduled exports across all administrative tiers.

### Architecture and Data Pipeline

```
+----------------------------------------------------------+
|           Analytics and Reporting Service                |
+------------------+---------------------------------------+
|  Event Ingestion |  Sources: API Gateway, RSE,           |
|  (OpenTelemetry) |  Auth Service, LRN Service,           |
|                  |  GAM Service, MOD Service             |
+------------------+-------+-------------------------------+
|  Event Bus (Redis Streams / Kafka)                       |
+------------------------------------------+--------------+
|  Aggregation Workers      |  Scheduled   |  On-demand   |
|  (NestJS consumers)       |  Report Jobs |  Query API   |
+---------------------------+--------------+--------------+
|  Analytics Store          |  Report Store                |
|  (PostgreSQL OLAP schema  |  (S3: pre-signed             |
|   or OpenSearch)          |   CSV / PDF exports)         |
+----------------------------------------------------------+
```

### Event Ingestion and Aggregation

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-170 | The Analytics Service **shall** ingest structured events from all platform microservices via the internal event bus (Redis Streams or Kafka); events **shall** include: simulator session start/end, code compilation/execution events, task submission, task grade published, RoboPoints awarded, login/logout, approval actions, and moderation actions. | Must | Events are structured JSON with `tenant_id`, `user_id`, `timestamp`, `event_type`, and a typed payload. No raw PII in event payloads beyond the opaque `user_id`. |
| FR-ADM-171 | The Analytics Service **shall** maintain pre-aggregated counters and time-series metrics per tenant, per class, and per student, updated at most 60 minutes after each raw event; aggregations **shall** be partitioned by `tenant_id` to enforce tenant isolation at the analytics layer. | Must | Pre-aggregation reduces on-demand query latency. Partitioned by `tenant_id` in the analytics schema. |
| FR-ADM-172 | The Analytics Service **shall** expose a query API (GraphQL) consumed by all administrative console dashboards; queries **shall** be authorised by the caller's JWT role and `tenant_id` before execution; a Super Admin may query any tenant; a School Admin may query only their own tenant; a Teacher may query only their assigned classes. | Must | GraphQL resolvers enforce RBAC and call tenant-scoped analytics queries. |
| FR-ADM-173 | The Analytics Service **shall** retain raw events for 90 days and aggregated metrics for 3 years; retention schedules **shall** be configurable by the Super Admin within bounds set by the applicable data-protection regulations. | Must | Retention schedule informed by GDPR, POPIA, Zimbabwe Cyber and Data Protection Act. |

### On-Demand and Scheduled Report Generation

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-180 | The system **shall** support on-demand generation of all report types defined in FR-ADM-070 through FR-ADM-073 (Super Admin), FR-ADM-110 through FR-ADM-114 (School Admin), and FR-ADM-160 through FR-ADM-163 (Teacher); on-demand report generation **shall** be asynchronous; the user **shall** receive a notification when the report is ready. | Must | Report generation queued in Redis; progress indicated in the console. Notification via FR-COMM. |
| FR-ADM-181 | All generated report files (CSV, PDF) **shall** be stored in S3-compatible object storage, delivered to the requesting user via a pre-signed URL with a 24-hour TTL; URLs **shall not** be cached at the CDN edge; each URL-generation event **shall** be audit-logged. | Must | Pre-signed URL generated by the Report Service; CDN cache bypass header applied. |
| FR-ADM-182 | The system **shall** support scheduled recurring reports: the Super Admin **shall** be able to define schedules (daily, weekly, monthly) for any report type, specifying recipient email addresses; the School Admin **shall** be able to define schedules for school-scoped reports; the Teacher **shall** be able to schedule class-level reports. | Should | Schedules stored in PostgreSQL; dispatched by a cron-based job service. Delivery via transactional email with a pre-signed download link. |
| FR-ADM-183 | PDF reports **shall** be generated server-side using a headless rendering engine; school-scoped and class-scoped PDF reports **shall** incorporate the tenant's white-label branding tokens (logo, colour scheme, school name) sourced from the tenant configuration (FR-TEN). | Must | Headless renderer (e.g., Puppeteer/Playwright) runs in a containerised sidecar; no client-side PDF generation. |
| FR-ADM-184 | The system **shall** support export of learning-outcome statistics in a structured data format (CSV with a versioned schema) suitable for import into external student information systems (SIS) or Learning Management Systems (LMS); the export schema **shall** be documented in the API Specification and Integration Interfaces section (IR). | Could | Schema aligned with common LMS interchange formats where feasible. |

### Engagement and Learning Outcome Metrics

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-190 | The Analytics Service **shall** compute and expose the following engagement metrics: daily and monthly active users (DAU/MAU), session frequency and duration per student, course and module completion rate, task submission rate, and on-time vs. late submission ratio. | Must | Computed from aggregated event store; exposed via Analytics Query API. |
| FR-ADM-191 | The Analytics Service **shall** compute and expose the following learning-outcome metrics: average grade per assignment, grade distribution (histogram), rubric-criterion mean scores, RoboPoints earned per student per period, and progression through curriculum stages (FR-LRN). | Must | Metrics surfaced in Teacher Class Reports (FR-ADM-160) and School Analytics dashboard (FR-ADM-110). |
| FR-ADM-192 | The Analytics Service **shall** compute and expose RSE usage metrics: simulator session count and duration by board type (Arduino UNO R3, ESP32, Raspberry Pi Pico, and any custom boards in the extensible board library), component category utilisation frequency, code-compilation success/failure rate, and most-used components across the platform and per tenant. | Should | RSE metrics inform platform optimisation and component catalogue priorities. Sourced from RSE event stream. |
| FR-ADM-193 | The Analytics Service **shall** compute and expose competition and gamification statistics: leaderboard rankings per competition, team performance metrics, RoboPoints issued by source type (task completion, bonus award, competition placement), and badge/achievement distribution across the platform and per tenant. | Should | Competition and gamification metrics governed by FR-TEAM and FR-GAM; Analytics Service consumes their event streams. |

---

## Platform-Wide Audit Trail

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-200 | The system **shall** maintain an immutable, structured audit trail for all administrative actions across all tiers: account approval/rejection, account suspension/deactivation, content publish/unpublish, role changes, billing adjustments, policy changes, feature-flag toggles, report generation/download, impersonation sessions, and manual consent overrides. | Must | Audit entries are append-only; no update or delete operations are permitted on the audit log store. |
| FR-ADM-201 | Each audit log entry **shall** include: `event_type`, `actor_user_id`, `actor_role`, `target_entity_type`, `target_entity_id`, `tenant_id`, `ip_address`, `user_agent`, `timestamp` (UTC ISO-8601), `outcome` (success / failure), `reason` (where applicable), and a `correlation_id` for distributed-trace linkage. | Must | Schema consistent with FR-AUTH-111 auth audit entries. Forwarded to centralised log store (OpenTelemetry / Loki). |
| FR-ADM-202 | Administrative audit logs **shall** be retained for a minimum of 7 years for safeguarding-related entries and 12 months for standard administrative events, consistent with GDPR, COPPA, Zimbabwe Cyber and Data Protection Act, POPIA, Nigeria NDPR, and Kenya Data Protection Act obligations. | Must | Retention policy enforced by a scheduled purge job that exempts safeguarding-flagged entries. |
| FR-ADM-203 | The Super Admin and Platform Moderator **shall** be able to search and export audit logs across all tenants; the School Admin **shall** be able to search and export audit logs scoped to their own tenant; search parameters **shall** include: actor, target, event type, date range, and outcome. | Must | Export subject to FR-ADM-181 pre-signed URL delivery. Search is paginated (default 25 rows). |

---

## Cross-Cutting Administration Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-210 | All administrative console interfaces **shall** meet WCAG 2.2 Level AA accessibility requirements: full keyboard navigation, screen-reader compatibility (ARIA landmarks and live regions), sufficient colour contrast (minimum 4.5:1 for normal text), and managed focus transitions in modal dialogs. | Must | Accessibility applies equally to Super Admin, School Admin, and Teacher consoles. See Accessibility, Internationalisation and Low-Bandwidth Design section. |
| FR-ADM-211 | Administrative console interfaces **shall** be usable on tablet-sized screens (minimum 768 px viewport width); desktop (1 280 px and above) is the primary target; large report tables **shall** be lazy-loaded; data sets **shall** be paginated with a default of 25 rows per page (configurable to 50 or 100). | Must | Server-side rendering (Next.js App Router) applied to initial console loads to support low-bandwidth African network conditions. |
| FR-ADM-212 | Every destructive administrative action (account deletion, tenant suspension, bulk rejection, data export of sensitive reports) **shall** require a two-step explicit confirmation (preview then confirm), and the confirmed action **shall** generate an immutable audit log entry (FR-ADM-200). | Must | Two-step confirmation modal must state the action, its scope, and its irreversibility (where applicable). |
| FR-ADM-213 | RBAC enforcement **shall** be applied at the API Gateway and the service layer for every administrative API call; a Teacher **shall not** be able to access School Admin functions; a School Admin **shall not** access data from another tenant; a Platform Moderator **shall not** access billing or system-configuration functions reserved for the Super Admin; any out-of-scope API call **shall** return HTTP 403 Forbidden and be recorded as a security event in the audit log. | Must | Client-side role checks are supplementary only and never the sole enforcement mechanism. See FR-AUTH-100. |
| FR-ADM-214 | All data export files generated by the administration layer **shall** be produced server-side, transmitted to the requesting user via a pre-signed, time-limited (24-hour) download URL, and **shall not** be cached at CDN edge nodes; URL generation events **shall** be logged in the audit trail. | Must | Applies to CSV, PDF, and JSON exports at all administrative tiers. |

---

## MoSCoW Priority Summary

| ID Range | Area | Must | Should | Could | Won't |
|----------|------|------|--------|-------|-------|
| FR-ADM-001–007 | Tenant lifecycle management | 6 | 1 | 0 | 0 |
| FR-ADM-010–014 | Global approval queue | 4 | 1 | 0 | 0 |
| FR-ADM-020–025 | Global content library | 4 | 2 | 0 | 0 |
| FR-ADM-030–034 | Global moderation console | 5 | 0 | 0 | 0 |
| FR-ADM-040–044 | Platform config and feature flags | 3 | 2 | 0 | 0 |
| FR-ADM-050–053 | Billing and subscription plans | 3 | 1 | 0 | 0 |
| FR-ADM-060–063 | System health dashboard | 2 | 2 | 0 | 0 |
| FR-ADM-070–073 | Global analytics and reports | 2 | 2 | 0 | 0 |
| FR-ADM-080–087 | School admin: student management | 7 | 1 | 0 | 0 |
| FR-ADM-090–094 | School admin: teacher management | 4 | 1 | 0 | 0 |
| FR-ADM-095–097 | School admin: seats and teams | 2 | 1 | 0 | 0 |
| FR-ADM-100–102 | School policies | 1 | 2 | 0 | 0 |
| FR-ADM-110–114 | School analytics and reports | 4 | 1 | 0 | 0 |
| FR-ADM-120–124 | Teacher: class management | 4 | 1 | 0 | 0 |
| FR-ADM-130–134 | Teacher: assignment authoring | 3 | 2 | 0 | 0 |
| FR-ADM-140–145 | Teacher: grading and submission inbox | 4 | 1 | 1 | 0 |
| FR-ADM-150–153 | Teacher: student progress and mentoring | 3 | 1 | 0 | 0 |
| FR-ADM-160–163 | Teacher: class reports | 3 | 1 | 0 | 0 |
| FR-ADM-170–173 | Analytics service: ingestion and aggregation | 4 | 0 | 0 | 0 |
| FR-ADM-180–184 | Analytics service: report generation | 3 | 1 | 1 | 0 |
| FR-ADM-190–193 | Analytics service: engagement and outcome metrics | 2 | 2 | 0 | 0 |
| FR-ADM-200–203 | Platform-wide audit trail | 4 | 0 | 0 | 0 |
| FR-ADM-210–214 | Cross-cutting admin requirements | 5 | 0 | 0 | 0 |
| **Totals** | | **87** | **26** | **2** | **0** |

---

## Cross-References

- **FR-AUTH** (Identity, Authentication and Authorization): account state machine, parental-consent gating, session revocation, RBAC scopes, auth audit-log entries; FR-AUTH-060 MFA enforcement; FR-AUTH-073 session revocation; FR-AUTH-082 deactivation; FR-AUTH-110–113 auth audit logging.
- **FR-TEN** (Multi-Tenancy, Custom Domains and White-Labelling): tenant subdomain/custom-domain resolution, RLS enforcement, white-label branding tokens used in PDF reports, tenant offboarding data export.
- **FR-LRN** (Learning Management and Content): curriculum stages, task/assignment data model, student progress records consumed by Teacher console and Analytics Service.
- **FR-TEAM** (Teams, Competitions and Gamification): team formation/dissolution, competition eligibility, RoboPoints ledger, leaderboard data (Redis sorted sets) consumed by analytics.
- **FR-GAM** (Gamification): RoboPoints award events ingested by the Analytics Service; badge/achievement distribution metrics.
- **FR-MOD** (Communication, Notifications and Moderation): content moderation pipeline, safeguarding escalation routing, notification delivery (FR-COMM); data surfaced in the Global and School Moderation consoles.
- **FR-SIM** (RoboCode Simulation Engine): RSE session events ingested by the Analytics Service; component utilisation metrics.
- **FR-CODE** (Code Authoring, Validation and Execution): project snapshot mechanics used when opening student submissions in RoboCode Studio from the grading view.
- **NFR-PERF** (Non-Functional Requirements: Performance): analytics query response time budgets; report generation SLOs.
- **NFR-SEC** (Non-Functional Requirements: Security): audit log tamper-evidence, encrypted export files, secrets management for payment processor credentials.
- **SR** (Security, Privacy and Child Safety): data-minimisation obligations for analytics, cross-jurisdiction data-protection compliance evidence.
- **IR** (API Specification and Integration Interfaces): Analytics Query API (GraphQL) schema; report export schema for external SIS/LMS integration.
- **Observability, Logging, Monitoring and Support section**: System Health dashboard data sources (Prometheus/Grafana); centralised log store (OpenTelemetry/Loki); alerting channels (PagerDuty/Opsgenie).
- **Accessibility, Internationalisation and Low-Bandwidth Design section**: WCAG 2.2 AA requirements applied to all administrative consoles; internationalisation of email templates and maintenance notices.
