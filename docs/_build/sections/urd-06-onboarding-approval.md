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
