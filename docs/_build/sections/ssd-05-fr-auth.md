# Functional Requirements: Identity, Authentication and Authorization

## Overview

This section specifies the functional requirements governing how all user identities are created, verified, approved, authenticated, and authorised within the RoboCode.Africa platform. It covers the full account lifecycle from initial registration through to deactivation, including the mandatory multi-path approval workflow, parental-consent capture for minors, session and token management, role-based access control (RBAC), and comprehensive audit logging.

All requirements in this section are mandatory inputs to the Auth module (`FR-AUTH-nnn`) and the Tenant module (`FR-TEN-nnn`) where cross-cutting. References to other sections are made by name and requirement-ID prefix, never by page number.

Child safety is the prime directive. Where a requirement conflicts with convenience, safety and data-protection obligations take precedence.

---

## Account Registration

### Registration Entry Points

RoboCode.Africa supports two distinct registration surfaces, each mapping to a different approval authority.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-AUTH-001 | The platform **shall** provide a public self-registration form on `robocode.africa` for students who are not affiliated with a specific tenant school at sign-up time ("direct signup"). | Must | Marketing site (Next.js App Router). |
| FR-AUTH-002 | The platform **shall** provide a tenant-scoped registration form on `<school>.robocode.africa` and any configured custom domain. The form **shall** automatically bind the new account to the resolving tenant. | Must | See Multi-Tenancy section (FR-TEN). |
| FR-AUTH-003 | Teachers and School Admins **shall** be able to invite users by email; an invitation token embedded in the email link **shall** pre-populate the tenant and role, bypassing the role-selection step. | Must | Token TTL: 72 h. Single-use. |
| FR-AUTH-004 | The registration form **shall** collect: full name, email address, date of birth (for minor detection), role (Student/Teacher/Parent), and optionally a school affiliation code. Password is set after email verification. | Must | Minimum PII for registration; no behavioural data collected. |
| FR-AUTH-005 | The platform **shall** detect registrants under the age of 13 (COPPA threshold) and under 16 (GDPR-K threshold) based on the stated date of birth and **shall** immediately gate activation on verifiable parental consent before any account creation proceeds. | Must | DoB must be stored as an encrypted field; age classification recalculated on each login birthday boundary. |
| FR-AUTH-006 | Guest / Visitor access to the marketing site and the limited demo **shall** require no registration. | Must | Demo is a sandboxed read-only RoboCode Studio instance. |

### Email Verification

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-AUTH-010 | After form submission the platform **shall** send a verification email to the supplied address containing a one-time URL with a signed token (HMAC-SHA256, platform secret). | Must | Token TTL: 24 h. |
| FR-AUTH-011 | Clicking the verification link **shall** confirm ownership of the email address and advance the account to `EMAIL_VERIFIED` state. No login is permitted before this step. | Must | Expired links prompt resend. |
| FR-AUTH-012 | The platform **shall** allow a user to request up to 3 resend attempts within a 1-hour window before requiring a support contact. | Should | Rate limiting per FR-AUTH-090. |
| FR-AUTH-013 | Email addresses **shall** be validated syntactically (RFC 5322 subset) and against a disposable-email blocklist before the verification email is sent. | Should | Reduces abuse and spam. |

---

## Parental-Consent Capture and Verification

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-AUTH-020 | When a registrant's stated date of birth places them under the COPPA threshold (under 13) or GDPR-K threshold (under 16), the platform **shall** immediately collect a parent/guardian email address and **shall not** proceed further until verifiable consent is recorded. | Must | Complies with COPPA, GDPR-K, POPIA, Zimbabwe Cyber and Data Protection Act. |
| FR-AUTH-021 | The platform **shall** send a consent request email to the supplied parent/guardian address explaining: the nature of the platform, data collected, data retention periods, and a clear link to accept or decline consent. | Must | Email templated; plain-language explanation suitable for non-technical guardians. |
| FR-AUTH-022 | The consent email **shall** include a unique, signed consent token (HMAC-SHA256) that expires after 7 days. Following the link **shall** open a consent form on the platform requiring the guardian to re-enter their own full name and confirm their relationship to the child. | Must | Double-check: guardian cannot delegate to the minor. |
| FR-AUTH-023 | Consent records **shall** be stored as an immutable audit entry (guardian name, email, IP address, timestamp, token reference) associated with the minor's account, never deletable, always retrievable by a Super Admin. | Must | DR-CONSENT data record; see Data Architecture section. |
| FR-AUTH-024 | Where a guardian declines consent the student account **shall** be permanently rejected and all collected PII **shall** be purged within 30 days per data-minimisation obligations. A rejection notice **shall** be sent to the original registrant email. | Must | Right to erasure; GDPR Art. 17. |
| FR-AUTH-025 | A Parent / Guardian role account **shall** be created automatically and linked to the minor's account when consent is given, granting the guardian read-only access to the child's progress summary. | Should | Guardian permissions are defined in FR-AUTH-045 and FR-AUTH-046. |
| FR-AUTH-026 | The platform **shall** support re-consent requests when a minor's account is transferred between tenants, when platform data-processing terms materially change, or when a consent record is flagged as suspect. | Must | Admins can trigger re-consent from the administration panel. |
| FR-AUTH-027 | For jurisdictions requiring additional safeguards (e.g., Nigeria NDPR, Kenya Data Protection Act), the consent form **shall** display jurisdiction-specific notices; jurisdiction is inferred from the tenant's registered country or the user's IP address. | Should | Legal copy managed via a CMS; see Administration section. |

---

## Parent / Guardian Read-Only Surface

The full Parent / Guardian portal is out of scope for v1.0 (see Section 1 – Scope Boundaries and Appendix F ROAD-040). The minimal in-scope guardian surface specified below satisfies the consent and progress-visibility obligations of the Parent / Guardian role.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-AUTH-045 | A Parent / Guardian **shall** authenticate to a dedicated, scoped guardian view reachable from the consent confirmation email and from `robocode.africa/guardian`. The view is read-only and exposes only data for minors explicitly linked to that guardian via a consent record. | Should | Guardian uses the `guardian:read` scope (RBAC, FR-AUTH-100 onward). Served via `/guardian/child/:id/summary` per SR-RBAC-015. |
| FR-AUTH-046 | The guardian read-only progress summary **shall** display, for each linked minor: display name, class/school name, count of completed tasks and projects, RoboPoints balance, badges earned, and last-active date. It **shall not** expose other students' data, class rosters, raw code, or free-text peer content. The guardian **shall** be able to initiate a data-subject request (export or erasure, per FR-AUTH-083) and view/withdraw consent (per FR-AUTH-026) from this surface. | Should | Resolves the FR-AUTH-025 reference. Data set is data-minimised; no behavioural profiling. Cross-reference SR-RBAC-015, SR-PRIV-014, FR-GAM-263/264 (leaderboard opt-out and own-child viewing). |

---

## Multi-Path Approval Workflow

### Account States

Every user account moves through a finite set of states. The states and their semantics are defined below.

```
ACCOUNT STATE DEFINITIONS
─────────────────────────────────────────────────────────
State               Description
─────────────────────────────────────────────────────────
PENDING_EMAIL       Account record created; email not yet
                    verified.
PENDING_CONSENT     Email verified; awaiting parental
                    consent (minors only).
PENDING_APPROVAL    Email verified (and consent obtained
                    where required); awaiting Admin review.
UNDER_REVIEW        Approval authority has opened the
                    record for manual review.
ACTIVE              Account fully activated; login allowed.
REJECTED            Approval denied; account blocked.
SUSPENDED           Active account temporarily suspended
                    by an Admin or moderation action.
DEACTIVATED         Account soft-deleted; data retained
                    per retention policy.
─────────────────────────────────────────────────────────
```

### State-Transition Table

| From State | Event | To State | Performed By | Notes |
|---|---|---|---|---|
| (none) | User submits registration form | PENDING_EMAIL | System | FR-AUTH-010 |
| PENDING_EMAIL | User clicks verification link | PENDING_CONSENT (minor) / PENDING_APPROVAL (adult/staff) | System | FR-AUTH-011 |
| PENDING_CONSENT | Guardian submits consent form | PENDING_APPROVAL | System | FR-AUTH-022 |
| PENDING_CONSENT | Guardian declines consent | REJECTED | System | FR-AUTH-024 |
| PENDING_CONSENT | Consent token expires (7 d) | PENDING_CONSENT | System | Re-send consent email; max 2 retries then REJECTED |
| PENDING_APPROVAL | Admin/moderator opens record | UNDER_REVIEW | Super Admin / Platform Moderator (direct) or School Admin (tenant) | FR-AUTH-031 |
| PENDING_APPROVAL | Admin auto-approves (tenant config) | ACTIVE | System | School Admins may enable auto-approve for invited users; FR-AUTH-033 |
| UNDER_REVIEW | Admin approves | ACTIVE | Super Admin / Platform Moderator / School Admin | FR-AUTH-032 |
| UNDER_REVIEW | Admin rejects | REJECTED | Super Admin / Platform Moderator / School Admin | FR-AUTH-034 |
| ACTIVE | Admin/Moderator suspends | SUSPENDED | Super Admin / Platform Moderator / School Admin (own tenant only) | FR-AUTH-080 |
| SUSPENDED | Admin reinstates | ACTIVE | Super Admin / Platform Moderator / School Admin | FR-AUTH-081 |
| ACTIVE / SUSPENDED | Admin deactivates | DEACTIVATED | Super Admin / School Admin | FR-AUTH-082 |
| REJECTED | Admin reverses (within 30 d) | PENDING_APPROVAL | Super Admin | Escalation path only |

### ASCII State Diagram

```
  ┌──────────────────────────────────────────────────────────────────┐
  │              ROBOCODE.AFRICA ACCOUNT STATE MACHINE               │
  └──────────────────────────────────────────────────────────────────┘

  [Registration Submitted]
           │
           ▼
  ┌─────────────────┐   email verified   ┌────────────────────┐
  │  PENDING_EMAIL  │ ─────────────────► │  PENDING_CONSENT   │
  └─────────────────┘   (minor only)     │  (minor path)      │
           │                             └────────────────────┘
           │ email verified                      │
           │ (adult / staff)          consent    │  consent
           │                          granted    │  declined / expired
           ▼                               │     │
  ┌──────────────────┐ ◄──────────────────┘     ▼
  │ PENDING_APPROVAL │                    ┌──────────┐
  └──────────────────┘                    │ REJECTED │ ◄────────────────┐
           │                              └──────────┘                  │
           │ admin opens                        ▲                       │
           ▼                                    │                       │
  ┌──────────────────┐                          │ admin rejects         │
  │   UNDER_REVIEW   │ ─────────────────────────┘                      │
  └──────────────────┘                                                  │
           │ admin approves     auto-approve (invited / tenant policy)  │
           │ ◄──────────────────────────────────────────────────────    │
           ▼                                                            │
  ┌──────────────────┐   admin suspends   ┌───────────────┐            │
  │     ACTIVE       │ ─────────────────► │   SUSPENDED   │            │
  │                  │ ◄───────────────── │               │            │
  └──────────────────┘   admin reinstates └───────────────┘            │
           │                                      │                     │
           │ admin deactivates                    │ admin deactivates   │
           ▼                                      ▼                     │
  ┌──────────────────────────────────────────────────────┐             │
  │                   DEACTIVATED                        │             │
  └──────────────────────────────────────────────────────┘             │
                                                                        │
  [Super Admin may reverse REJECTED → PENDING_APPROVAL within 30 d] ───┘

  APPROVAL AUTHORITY BY PATH:
  ─────────────────────────────────────────────────────────────────────
  Direct signup  (robocode.africa)   → Super Admin / Platform Moderator
  Tenant signup  (<school>.r.a)      → School Admin (own tenant only)
  ─────────────────────────────────────────────────────────────────────
```

### Approval Authority Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-AUTH-030 | Accounts registered directly on `robocode.africa` **shall** be approved by a Super Admin or a delegated Platform Moderator. | Must | No School Admin may approve direct-signup accounts. |
| FR-AUTH-031 | Accounts registered on a tenant subdomain or custom domain **shall** be auto-assigned to that tenant and **shall** be approved by a School Admin of that tenant. | Must | Tenant resolved per FR-TEN multi-tenancy routing. |
| FR-AUTH-032 | The approval interface **shall** surface the registrant's name, email, stated role, date of birth (age band only, not raw DoB), consent status, and any prior rejection history. | Must | Raw DoB shown only to Super Admin. |
| FR-AUTH-033 | School Admins **shall** be able to configure auto-approval for users who register via a valid invitation link issued by that school. Auto-approval **shall not** apply to open (non-invited) registrations. | Should | Default: manual approval required. |
| FR-AUTH-034 | Rejections **shall** require the approving authority to select a rejection reason from a controlled vocabulary and optionally enter a free-text note. The rejection reason **shall** be communicated to the registrant by email. | Must | Audit record retained; PII purged per policy. |

---

## Authentication

### Password Authentication

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-AUTH-040 | The platform **shall** support password-based authentication for all roles. Passwords **shall** be hashed using bcrypt (cost factor ≥ 12) or Argon2id before storage. | Must | Plaintext passwords never stored or logged. |
| FR-AUTH-041 | Password policy **shall** enforce: minimum 10 characters, at least one uppercase letter, one lowercase letter, one digit, one special character. | Must | Configurable by Super Admin; tenant may not weaken below platform minimums. |
| FR-AUTH-042 | Password policy **shall** additionally check new passwords against the HaveIBeenPwned (HIBP) k-anonymity API and reject passwords found in known data breaches. | Should | Failure of the HIBP check **shall not** block login; only registration/change. |
| FR-AUTH-043 | The platform **shall** enforce a password-history policy: users **shall not** reuse any of their last 5 passwords. | Should | — |
| FR-AUTH-044 | Staff roles (Teacher, School Admin, Platform Moderator, Super Admin) **shall** be prompted to change their password at first login if the account was created by an invitation or administrative action. | Must | Force-change flag on account record. |

### Single Sign-On / OIDC

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-AUTH-050 | The platform **shall** support OAuth 2.0 / OIDC-based SSO for school-affiliated users via Google Workspace for Education and Microsoft Entra ID (Azure AD). | Must | Tenant-level IdP configuration by School Admin. |
| FR-AUTH-051 | SSO login **shall** resolve the tenant from the email domain or the subdomain/custom-domain origin, match the OIDC subject to an existing account, or provision a new account in `PENDING_APPROVAL` state if no match exists. | Must | Just-in-time (JIT) provisioning; approval still required. |
| FR-AUTH-052 | The platform **shall** support a magic-link (passwordless email link) authentication method as an optional alternative to password login. | Could | Useful in low-connectivity environments; link TTL: 15 min, single-use. |
| FR-AUTH-053 | All OAuth redirect URIs **shall** be allowlisted and validated; open-redirect vulnerabilities **shall** be prevented. | Must | Security SR-AUTH. |

### Multi-Factor Authentication (MFA)

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-AUTH-060 | TOTP-based MFA (RFC 6238, 30-second window) **shall** be available to all roles and **shall be mandatory** for Teacher, School Admin, Platform Moderator, and Super Admin roles. | Must | Students: optional. |
| FR-AUTH-061 | The platform **shall** present a QR code and the raw TOTP secret during MFA enrollment for compatibility with standard authenticator apps (Google Authenticator, Authy, 1Password, etc.). | Must | — |
| FR-AUTH-062 | The platform **shall** generate 8 one-time recovery codes at MFA enrollment; each code is single-use. Recovery codes **shall** be hashed (SHA-256) before storage. | Must | User instructed to store codes offline. |
| FR-AUTH-063 | Staff users who have not enrolled MFA **shall** be prompted on every login with a mandatory enrollment gate; they **shall not** be able to access protected staff screens until MFA is configured. | Must | Grace period: 0 days for new staff accounts. |
| FR-AUTH-064 | Super Admins **shall** be able to administratively reset a staff user's MFA (invalidating existing TOTP and recovery codes) following a verified support procedure. The reset **shall** be audit-logged. | Must | Audit log entry: FR-AUTH-110. |

---

## Session and Token Management

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-AUTH-070 | Upon successful authentication the platform **shall** issue a short-lived JSON Web Token (JWT) access token (RS256 signed, TTL: 15 minutes) and a long-lived opaque refresh token stored in an HttpOnly, Secure, SameSite=Strict cookie. | Must | Access token never stored in localStorage. |
| FR-AUTH-071 | Refresh tokens **shall** be stored in Redis with a TTL of 7 days for standard users and 1 day for staff accounts. Each refresh operation **shall** rotate the refresh token (refresh-token rotation). | Must | Old refresh token invalidated immediately on use. |
| FR-AUTH-072 | The platform **shall** support concurrent sessions; each session is tracked by a unique session ID. A user **shall** be able to view active sessions and terminate any session remotely. | Should | Session list in account settings. |
| FR-AUTH-073 | Forced logout (session revocation) **shall** be achievable by an Admin for any account. Revocation **shall** propagate to the Redis token store within 5 seconds. | Must | Used during suspension, deactivation, or security incidents. |
| FR-AUTH-074 | JWT access tokens **shall** embed: `sub` (user ID), `tenant_id`, `role`, `scopes[]`, `iat`, `exp`. No PII beyond the user ID **shall** be included in the token payload. | Must | `tenant_id` enables per-tenant RLS enforcement. |
| FR-AUTH-075 | The platform **shall** implement an inactivity timeout: sessions **shall** be invalidated after 30 minutes of inactivity for staff roles; 60 minutes for students. | Should | Configurable by Super Admin within safe bounds. |
| FR-AUTH-076 | WebSocket connections (Socket.IO) **shall** be authenticated at connection time using the short-lived JWT; connections **shall** be dropped on token expiry unless the client refreshes before reconnecting. | Must | See API Specification section (IR). |

---

## Rate Limiting and Account Lockout

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-AUTH-090 | Failed login attempts **shall** be rate-limited: 5 consecutive failures within 15 minutes on a single account **shall** trigger a 15-minute account lockout. The user **shall** receive an email notification. | Must | Redis-backed counter; IP + account-ID composite key. |
| FR-AUTH-091 | After 10 cumulative failed attempts within 24 hours on a single account the system **shall** escalate to a 4-hour lockout and notify the approval authority (School Admin or Platform Moderator). | Must | Protects against slow-brute-force attacks. |
| FR-AUTH-092 | IP-level rate limiting **shall** be applied at the API Gateway: maximum 20 login attempts per IP per minute across all accounts. Exceeding the threshold triggers a CAPTCHA challenge for subsequent attempts. | Must | Cloudflare / API Gateway layer. |
| FR-AUTH-093 | Registration, email-verification-resend, password-reset, and parental-consent-resend endpoints **shall** each be independently rate-limited to prevent enumeration and spam. | Must | Limits defined per-endpoint in API Specification section. |
| FR-AUTH-094 | Account lockout **shall** be manually reversible by a Super Admin, Platform Moderator, or School Admin (own tenant) via the administration panel. Reversal **shall** be audit-logged. | Must | FR-AUTH-110. |

---

## Password Reset and Recovery

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-AUTH-095 | The platform **shall** provide a self-service password-reset flow: user supplies their email address; if an account exists, a signed reset token (TTL: 1 hour, single-use) is emailed. | Must | No account-existence leakage: response is identical whether account exists or not. |
| FR-AUTH-096 | The password-reset link **shall** open a form requiring the new password and confirmation. On success the form **shall** invalidate all active refresh tokens for the account (force re-login everywhere). | Must | Protects against credential-stuffing persistence. |
| FR-AUTH-097 | For minor accounts, password resets **shall** additionally send a notification to the linked parent/guardian email. | Should | Safeguarding transparency. |

---

## Role-Based Access Control (RBAC)

### Role Definitions

The platform defines seven roles as specified in the canon. Each role is assigned a set of permission scopes. Scopes are evaluated at the API Gateway and within each NestJS microservice using JWT claims.

| Role | Scope Prefix | Tenant-Scoped | Notes |
|---|---|---|---|
| Super Admin | `platform:*` | No (global) | All tenants; all resources. |
| Platform Moderator | `moderation:*`, `platform:approve` | No (global) | Delegated by Super Admin; cannot modify billing or system config. |
| School Admin | `tenant:*` | Yes (`tenant_id`) | Own tenant only; cannot cross tenant boundaries. |
| Teacher / Educator | `class:*`, `content:write`, `student:read` | Yes | Own classes and own tenant students. |
| Student | `studio:*`, `project:write`, `task:submit` | Yes | Own projects; cannot access other students' work unless shared. |
| Parent / Guardian | `guardian:read` | Yes (linked minor) | Read-only on linked minor's progress. |
| Guest / Visitor | `public:read` | No | Marketing site; demo sandbox only. |

### Permission Scopes

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-AUTH-100 | The platform **shall** implement RBAC enforced server-side on every API endpoint and WebSocket event. No client-side role check **shall** be the sole enforcement mechanism. | Must | Defence-in-depth. |
| FR-AUTH-101 | Permissions **shall** be evaluated using a deny-by-default model: unless a scope is explicitly granted to a role, access is denied. | Must | Principle of least privilege. |
| FR-AUTH-102 | Tenant scoping **shall** be enforced via the `tenant_id` JWT claim combined with PostgreSQL Row-Level Security (RLS). An authenticated user **shall** be unable to read or mutate data belonging to another tenant regardless of role. | Must | FR-TEN-RLS; see Multi-Tenancy section. |
| FR-AUTH-103 | Super Admins **shall** be able to assume a tenant context ("sudo into tenant") for support purposes. Assumption **shall** be audit-logged with the originating Super Admin identity and the target tenant. | Should | Not a permanent permission grant; single-session only. |
| FR-AUTH-104 | School Admins **shall** be able to delegate a subset of their permissions to a Teacher (e.g., approve new student accounts within a class) without granting full School Admin role. | Could | Fine-grained delegation; roadmap. |
| FR-AUTH-105 | The permission model **shall** be documented in a machine-readable policy file (e.g., Casbin policy or OPA Rego) under version control, enabling automated policy-as-code verification. | Should | Enables CI/CD policy tests. |

### Cross-Cutting Authorisation Rules

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-AUTH-106 | A Teacher **shall** only access student records, projects, and submissions belonging to classes the Teacher is assigned to within the same tenant. | Must | Enforced via RLS + API guard. |
| FR-AUTH-107 | Students **shall not** be able to view other students' code or projects unless the project is explicitly marked as "shared" by the owning student and the recipient is in the same class. | Must | No open peer browsing by default. |
| FR-AUTH-108 | No inter-minor private messaging **shall** be permitted through any API endpoint. Communication channels (see Communication section) are class-scoped and teacher-moderated. | Must | Safeguarding prime directive. |
| FR-AUTH-109 | Guests and Visitors **shall** have access only to public marketing content and the limited demo sandbox. The demo sandbox **shall** be isolated from all production data and user accounts. | Must | Demo: read-only, ephemeral session. |

---

## Auth Audit Logging

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-AUTH-110 | The platform **shall** write an immutable, structured audit log entry for every auth-related event, including: registration submitted, email verified, consent requested, consent granted/declined, approval decision, login success/failure, MFA enrolled/reset, password changed/reset, session created/revoked, role changed, lockout triggered/cleared, account suspended/deactivated. | Must | JSON-structured; forwarded to centralised log store (OpenTelemetry / Loki). |
| FR-AUTH-111 | Each audit log entry **shall** include: `event_type`, `actor_user_id`, `target_user_id` (if different), `tenant_id`, `ip_address`, `user_agent`, `timestamp` (UTC ISO-8601), `outcome` (success/failure), and a `correlation_id` for distributed tracing. | Must | See Observability section. |
| FR-AUTH-112 | Auth audit logs **shall** be retained for a minimum of 7 years and **shall** be non-repudiable (append-only, tamper-evident storage). | Must | Regulatory requirement under GDPR, COPPA, Zimbabwe Cyber and Data Protection Act. |
| FR-AUTH-113 | Super Admins and Platform Moderators **shall** be able to search, filter, and export auth audit logs by user ID, tenant, event type, date range, and IP address. | Must | See Administration, Analytics and Reporting section. |
| FR-AUTH-114 | Anomaly patterns in the auth audit log (e.g., rapid sequential failed logins from multiple IPs, unusual geographic change) **shall** trigger an automated alert to the Platform Moderator queue. | Should | Integrates with Prometheus alerting rules; see Observability section. |

---

## Account Lifecycle Management

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-AUTH-080 | Super Admins, Platform Moderators, and School Admins (own tenant) **shall** be able to suspend an active account. Suspension immediately invalidates all active sessions and prevents new logins. The user **shall** receive a notification. | Must | SUSPENDED state. |
| FR-AUTH-081 | A suspended account **shall** be reinstatable by the same or higher authority that applied the suspension. Reinstatement restores login access without requiring re-approval. | Must | — |
| FR-AUTH-082 | Account deactivation (soft delete) **shall** anonymise display names and pseudonymise PII fields while retaining audit trails and consent records as required by retention policy. | Must | DEACTIVATED state; GDPR right to erasure balanced against audit obligations. |
| FR-AUTH-083 | Users (or, for minors, their guardian) **shall** be able to request account deletion via a self-service form. The request **shall** be reviewed and fulfilled within 30 days as required by GDPR Art. 17 and equivalent regulations. | Must | Audit trail of deletion request retained. |
| FR-AUTH-084 | On tenant offboarding (school subscription ends), all student accounts associated solely with that tenant **shall** transition to DEACTIVATED state and data **shall** be exported to the School Admin before deletion per the agreed retention schedule. | Must | See Multi-Tenancy section (FR-TEN). |

---

## MoSCoW Priority Summary

| ID Range | Area | Must | Should | Could | Won't |
|---|---|---|---|---|---|
| FR-AUTH-001–006 | Registration entry points | 5 | 0 | 0 | 1 |
| FR-AUTH-010–013 | Email verification | 2 | 2 | 0 | 0 |
| FR-AUTH-020–027 | Parental consent | 6 | 2 | 0 | 0 |
| FR-AUTH-045–046 | Parent / Guardian read-only surface | 0 | 2 | 0 | 0 |
| FR-AUTH-030–034 | Approval workflow | 4 | 1 | 0 | 0 |
| FR-AUTH-040–044 | Password authentication | 3 | 2 | 0 | 0 |
| FR-AUTH-050–053 | SSO / OIDC / magic link | 2 | 0 | 1 | 0 |
| FR-AUTH-060–064 | TOTP MFA | 5 | 0 | 0 | 0 |
| FR-AUTH-070–076 | Session / JWT management | 5 | 2 | 0 | 0 |
| FR-AUTH-080–084 | Account lifecycle | 5 | 0 | 0 | 0 |
| FR-AUTH-090–094 | Rate limiting / lockout | 5 | 0 | 0 | 0 |
| FR-AUTH-095–097 | Password reset | 2 | 1 | 0 | 0 |
| FR-AUTH-100–109 | RBAC | 6 | 2 | 1 | 0 |
| FR-AUTH-110–114 | Auth audit logging | 4 | 1 | 0 | 0 |
| **Totals** | | **54** | **15** | **2** | **1** |

---

## Cross-References

- **FR-TEN** (Multi-Tenancy, Custom Domains and White-Labelling): tenant resolution, subdomain/custom-domain routing, RLS enforcement, tenant offboarding.
- **FR-MOD** (Communication, Notifications and Moderation): content moderation pipeline, safeguarding escalation, inter-user communication restrictions.
- **FR-ADM** (Administration, Analytics and Reporting): admin dashboard for approval queues, audit log search, account management actions.
- **FR-STU** (Student): student account data model, RoboPoints association, class enrolment.
- **DR-CONSENT** (Data Architecture): consent record schema, immutable audit storage, PII encryption-at-rest.
- **SR-AUTH** (Security, Privacy and Child Safety): OAuth redirect validation, token signing key management, penetration-test acceptance criteria, GDPR/COPPA/POPIA compliance evidence.
- **NFR-SEC** (Non-Functional Requirements): security NFRs including OWASP Top 10 compliance, dependency scanning, secrets management.
- **IR** (API Specification and Integration Interfaces): auth endpoint schemas, rate-limit headers, WebSocket auth protocol.
