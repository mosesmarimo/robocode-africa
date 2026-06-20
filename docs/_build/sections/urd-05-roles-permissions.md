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
