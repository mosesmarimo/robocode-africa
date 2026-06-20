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
