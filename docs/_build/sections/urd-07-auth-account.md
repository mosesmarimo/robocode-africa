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
