# Security, Privacy and Child Safety

## Overview

This section specifies all security, privacy, and child-safety requirements for the RoboCode.Africa platform. Child safety is the prime directive: wherever a requirement conflicts with operational convenience, safety and data-protection obligations unconditionally prevail.

The requirements in this section use the following identifier prefixes:

- **SR-nnn** — Security requirements (cross-cutting)
- **FR-MOD-nnn** — Moderation and safeguarding functional requirements (cross-reference to Functional Requirements: Communication, Notifications and Moderation)
- **NFR-SEC-nnn** — Non-functional security requirements
- **NFR-PRIV-nnn** — Non-functional privacy requirements

MoSCoW priority is applied throughout. Cross-references to other sections are by section title and requirement ID.

---

## Security Objectives

The following security objectives govern all design, implementation, and operational decisions for RoboCode.Africa.

| ID | Objective | Priority |
|----|-----------|----------|
| SR-001 | Protect the confidentiality, integrity, and availability of all platform data, with heightened protections for the PII of minors. | Must |
| SR-002 | Prevent unauthorised access to any tenant's data, project files, or user records. | Must |
| SR-003 | Ensure every student account activation is gated by an explicit human approval step and, for minors, verifiable parental/guardian consent. | Must |
| SR-004 | Provide a fully auditable trail of all administrative, moderation, and access-control decisions. | Must |
| SR-005 | Eliminate unsupervised communication channels between minors. | Must |
| SR-006 | Maintain secure software supply chains, including open-source dependencies (Wokwi libraries, avr8js, Monaco, etc.) and containerised infrastructure. | Must |
| SR-007 | Limit data collection to the minimum necessary for platform function; never collect data for behavioural advertising. | Must |
| SR-008 | Enable full recoverability from a security incident within defined RTO/RPO targets (see Non-Functional Requirements). | Must |
| SR-009 | Comply with all applicable data-protection laws identified in the regulatory-compliance table in this section. | Must |
| SR-010 | Achieve and maintain WCAG 2.2 AA accessibility in all security-facing user interfaces (consent forms, approval pages, MFA screens). | Should |

---

## STRIDE Threat Model

The following table maps STRIDE threat categories to affected assets and the primary mitigations applied in RoboCode.Africa.

| Threat | Threat Category | Affected Asset | Mitigation |
|--------|----------------|---------------|------------|
| Session token theft via XSS | Spoofing | JWT / session tokens | `HttpOnly`+`Secure` cookies; strict `Content-Security-Policy`; Monaco sandboxing (see FR-CODE sandbox). |
| Credential stuffing | Spoofing | Auth service, student accounts | Bcrypt password hashing (work-factor ≥12); account lockout (FR-AUTH-090); CAPTCHA on public registration. |
| Impersonation of School Admin | Spoofing | Tenant administration panel | TOTP MFA mandatory for all Staff/Admin roles (SR-AUTH-020); role assertions in JWT verified server-side on every request. |
| Privilege escalation via crafted JWT | Tampering | API Gateway, RBAC middleware | JWTs signed with RS256; public key pinned server-side; role claims never trusted from client payload. |
| Project-file corruption | Tampering | S3-compatible object store | S3 versioning enabled; object integrity check (ETag/SHA-256) on read; immutable backups. |
| SQL injection across tenant boundary | Tampering | PostgreSQL, RLS policies | Parameterised queries only (NestJS TypeORM); RLS policy enforced at DB layer; no dynamic SQL construction. |
| Repudiation of moderation actions | Repudiation | Moderation audit log | Append-only audit table (PostgreSQL trigger-enforced); log signed with HMAC; exported to tamper-evident cold store. |
| Repudiation of parental consent | Repudiation | Consent records | Immutable consent event stored with IP, timestamp, guardian name; never deletable (FR-AUTH-023). |
| Student PII exposure in logs | Information Disclosure | Structured logs, Sentry | PII scrubbing middleware on log pipeline; Sentry `beforeSend` hook to strip email/name/DoB fields. |
| Cross-tenant data leak via API | Information Disclosure | NestJS microservices, GraphQL | Tenant context attached at gateway; RLS enforced at DB; GraphQL field-level auth guards. |
| Simulator WASM escape | Information Disclosure | avr8js / RSE WASM sandbox | avr8js runs in Web Worker with `blob:` origin; no Node.js `fs` or `net` access; CSP restricts worker sources. |
| Denial of Service (compile endpoint) | Denial of Service | Compile microservice | Request queue with per-tenant rate limits; maximum sketch size (256 KB); compile timeout (30 s); autoscale. |
| API rate-limit exhaustion | Denial of Service | API Gateway | Per-user and per-IP rate limits enforced at gateway (Redis sliding-window); 429 responses with `Retry-After`. |
| Elevation via School Admin invitation token | Elevation of Privilege | Invitation flow (FR-AUTH-003) | Single-use tokens; HMAC-SHA256 signed; 72 h TTL; role ceiling capped at inviter's role. |
| Supply-chain compromise of npm packages | Elevation of Privilege | Build pipeline, Wokwi libs | Lock-file pinning; automated audit via `npm audit`/Dependabot; SBOM generated per release (SR-SDLC-030). |
| Unsafe student code execution on server | Elevation of Privilege | Code execution service | Compiled firmware runs only inside avr8js MCU simulator (client-side WASM) or isolated container; no host syscalls. |

---

## Identity and Access Controls

### Authentication Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| SR-AUTH-010 | All transport to the authentication service **shall** use TLS 1.2 or higher; TLS 1.0/1.1 **shall** be disabled. | Must | Verified by TLS scanner in CI (see SR-SDLC-050). |
| SR-AUTH-011 | Passwords **shall** be hashed with Bcrypt at a work-factor of no less than 12 before storage; plaintext passwords **shall** never be logged, cached, or transmitted after the initial form submission. | Must | Argon2id is an acceptable alternative with equivalent cost parameters. |
| SR-AUTH-012 | TOTP-based MFA (RFC 6238) **shall** be mandatory for Super Admin, Platform Moderator, and School Admin roles; **should** be available (opt-in) for Teacher roles. | Must | TOTP QR code provisioning via authenticator app; backup recovery codes stored hashed. |
| SR-AUTH-013 | The platform **shall** implement account lockout after 5 consecutive failed login attempts within a 15-minute window; locked accounts require email-based unlock or admin reset. | Must | Aligns with FR-AUTH-090 in Identity, Authentication and Authorization section. |
| SR-AUTH-014 | JWTs **shall** be signed with RS256 (2048-bit RSA); the private key **shall** be stored in a secrets manager (AWS Secrets Manager or equivalent) and rotated at least every 90 days. | Must | Public key published at OIDC well-known endpoint. |
| SR-AUTH-015 | JWT access tokens **shall** have a maximum lifetime of 15 minutes; refresh tokens **shall** be single-use (rotation on each use) and expire after 7 days of inactivity. | Must | Revocation list in Redis for compromised tokens. |
| SR-AUTH-016 | OAuth2/OIDC flows for school SSO (Google Workspace, Microsoft Entra) **shall** validate `id_token` signature, `aud`, `iss`, and `exp` claims before trusting identity assertions. | Must | See Identity, Authentication and Authorization section (FR-AUTH-SSO). |
| SR-AUTH-017 | All sessions **shall** be invalidated server-side on explicit logout; session tokens **shall** be rotated after privilege changes (role grants, password resets). | Must | Redis session store with explicit `DEL` on logout. |
| SR-AUTH-018 | The platform **shall** detect and block concurrent sessions from geographically improbable IP combinations (impossible-travel detection) and alert the account owner. | Should | Heuristic: >500 km displacement in <1 h. |

### Role-Based Access Control (RBAC)

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| SR-RBAC-010 | The platform **shall** implement RBAC with the seven canonical roles defined in the PROJECT CANON: Super Admin, Platform Moderator, School Admin, Teacher/Educator, Student (primary/high-school sub-classes), Parent/Guardian, and Guest/Visitor. | Must | Roles are non-hierarchical permissions sets; combined only where explicitly stated. |
| SR-RBAC-011 | Role assignments **shall** be stored in the database and asserted server-side; no role claim from a client-supplied payload **shall** be trusted without server-side validation. | Must | JWT role claims are read-only projections; authoritative source is the DB. |
| SR-RBAC-012 | The principle of least privilege **shall** apply: each role **shall** be granted only the permissions required for its stated function; no role **shall** inherit permissions of a higher-privileged role unless explicitly defined. | Must | Permission matrix maintained in code (NestJS guards); audited in each release. |
| SR-RBAC-013 | Teachers **shall** have no administrative access to another teacher's classes or to the tenant's billing and configuration settings. | Must | Enforced by scoped permission checks in API guards. |
| SR-RBAC-014 | Students **shall** not be able to view other students' code, project files, or progress data except within explicitly scoped Team contexts (see Functional Requirements: Teams, Competitions and Gamification). | Must | GraphQL resolvers check ownership and team membership. |
| SR-RBAC-015 | Parent/Guardian accounts **shall** have read-only, scoped visibility limited to the linked minor's progress summary; no access to class rosters or other students' data. | Must | Data returned via a dedicated `/guardian/child/:id/summary` endpoint with separate auth guard. |
| SR-RBAC-016 | Super Admin actions on tenant data **shall** require an additional confirmation step (reason entry + password re-verification) to prevent accidental bulk operations. | Should | "Break-glass" audit entry created on each such action. |

---

## Tenant-Isolation Security

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| SR-TEN-010 | Every database query against a tenant-sensitive table **shall** include the `tenant_id` constraint enforced by PostgreSQL Row-Level Security (RLS) policies; no application-layer-only enforcement is sufficient without DB-layer RLS. | Must | See Multi-Tenancy section (FR-TEN); RLS tested by automated cross-tenant penetration test in CI. |
| SR-TEN-011 | The API Gateway **shall** resolve the `tenant_id` from the incoming hostname (subdomain or custom domain) before any downstream processing; a request with an unresolvable host **shall** be rejected with HTTP 403. | Must | Middleware layer; no bypass path permitted. |
| SR-TEN-012 | S3 object storage keys **shall** be namespaced by `tenant_id`; IAM bucket policies **shall** restrict service accounts to their own namespace prefix; no wildcard `/*` grants to shared service accounts. | Must | Scoped IAM roles per service, not per tenant, but key-prefix enforcement prevents cross-tenant object access. |
| SR-TEN-013 | Redis keys **shall** be namespaced by `tenant_id` (e.g., `t:{tenant_id}:session:{token_hash}`); tenant isolation in Redis **shall** be enforced by application-layer key namespacing, not Redis ACLs alone, because the shared cluster model precludes per-tenant Redis instances at launch. | Must | Redis ACLs added as a Should for future enhancement. |
| SR-TEN-014 | Outbound webhooks and email notifications **shall** be rendered with the sending tenant's configuration only; cross-tenant branding bleed (e.g., wrong school logo) **shall** be treated as a severity-2 security incident. | Should | Template renderer validated in integration tests with mock tenants. |
| SR-TEN-015 | The compile microservice **shall** accept sketch compilation requests only from authenticated requests bearing a valid `tenant_id`; compiled firmware artefacts **shall** be stored under the submitting tenant's S3 prefix and never returned to a different tenant. | Must | Artefact URL is a signed S3 pre-signed URL valid for 15 minutes. |

---

## Data Protection

### Encryption in Transit

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| SR-ENC-010 | All external HTTP communication **shall** use TLS 1.2 as the minimum version; TLS 1.3 is the preferred negotiated version. | Must | Enforced at CDN/load-balancer (Cloudflare/CloudFront); old cipher suites disabled. |
| SR-ENC-011 | Internal service-to-service communication within the Kubernetes cluster **shall** use mutual TLS (mTLS) via a service mesh (e.g., Istio or Linkerd) or, at minimum, TLS 1.2 with service-account certificate pinning. | Should | mTLS enforced at launch for auth and payment services; extended to all services in roadmap. |
| SR-ENC-012 | HTTP Strict Transport Security (HSTS) headers **shall** be applied on all public endpoints with `max-age` of at least 31536000 seconds; `includeSubDomains` and `preload` directives **shall** be set. | Must | Verified in CI security headers scan. |
| SR-ENC-013 | WebSocket (Socket.IO) connections **shall** use WSS (WebSocket over TLS); plain WS **shall** be rejected. | Must | Enforced at ingress controller. |

### Encryption at Rest and Key Management

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| SR-ENC-020 | PostgreSQL volumes and S3 buckets **shall** use AES-256 encryption at rest via provider-managed keys (AWS KMS / GCP KMS / Azure Key Vault) with automatic annual key rotation. | Must | Customer-managed key (CMK) option available to tenants on premium plans. |
| SR-ENC-021 | Sensitive PII fields (date of birth, consent records, national-ID equivalents) **shall** be encrypted at the application layer with a per-tenant AES-256-GCM key in addition to volume-level encryption (double-layer). | Must | Key stored in Secrets Manager; data decrypted only at the service owning that field. |
| SR-ENC-022 | Secrets (API keys, database passwords, JWT signing keys, SMTP credentials) **shall** be stored exclusively in a dedicated secrets manager; hard-coded or environment-variable embedded secrets in source code or container images **shall** not be permitted. | Must | Pre-commit hook and CI step (Trufflehog / Gitleaks) blocks commits containing secrets. |
| SR-ENC-023 | Key rotation events **shall** be logged in the audit trail and **shall** not cause service interruption; dual-key periods (old key valid for decryption, new key for encryption) are required during rotation. | Must | Key version identifier stored alongside ciphertext. |

### PII Classification and Data Minimisation

The following table defines the PII classification tiers used throughout the platform.

| Tier | Classification | Examples | Handling |
|------|---------------|---------|---------|
| Tier 1 — Critical | Minor's direct identifiers | Date of birth, full name, guardian name/email, parental consent records | Application-layer encryption (SR-ENC-021); access by Super Admin only; not exposed to tenant staff without explicit need. |
| Tier 2 — Sensitive | User contact and account data | Email address, password hash, IP address logs, school enrolment record | Volume-level encryption; scoped access by role; PII scrubbed from logs (SR-LOG-020). |
| Tier 3 — Restricted | Behavioural and progress data | RoboPoints balance, task completion, code submissions, session timestamps | Tenant-scoped access; exportable by School Admin for the tenant's own students only. |
| Tier 4 — Internal | Non-PII operational data | Compiled firmware artefacts (no PII), simulator performance metrics | Standard access controls; no special handling beyond tenant namespacing. |

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| SR-PRIV-010 | The platform **shall** collect only the data fields enumerated in the registration form (FR-AUTH-004) and subsequently needed for platform function; additional optional fields **shall** be clearly labelled optional and used only for the stated purpose. | Must | Data-minimisation principle (GDPR Art. 5(1)(c)). |
| SR-PRIV-011 | Behavioural advertising profiles **shall** not be created; third-party advertising SDKs **shall** not be included in the platform. | Must | Privacy policy commitment; enforced by code review gate. |
| SR-PRIV-012 | Data retention periods **shall** conform to the Authoritative Data Retention Schedule (Data Architecture and Database Design section): active accounts — for the lifetime of the account; inactive accounts — a re-consent/review notification is triggered at 24 months of inactivity, and PII is pseudonymised 3 years after account deactivation if re-consent is not obtained (configurable per tenant by School Admin within these maxima); parental consent records — retained for the account lifetime plus 7 years for compliance evidence. | Must | Automated retention job scheduled daily; deletions logged. |
| SR-PRIV-013 | Students (or their guardian for minors) **shall** be able to request a full export of their personal data in machine-readable format (JSON) and request deletion; deletion requests **shall** be fulfilled within 30 days except where retention is legally mandated. | Must | GDPR Art. 15, 17, 20; POPIA s. 23–24; NDPR Art. 3.1.9. |
| SR-PRIV-014 | Analytics and reporting features **shall** present aggregated or anonymised data to Admins and Teachers; individual student raw PII **shall** not be displayed in bulk analytics exports. | Should | Guardian consent may unlock individual reports for own child only. |
| SR-PRIV-015 | IP addresses **shall** be handled by a single canonical rule per store tier: (a) **operational logs** — truncated (IPv4 last octet zeroed; IPv6 to /48) before persistence, per NFR-LOG-005; (b) **security/safeguarding audit log** — stored as SHA-256 hash with daily rotating salt, raw IP discarded within 24 h, per the audit-log schema in this section and NFR-AUD-002; (c) **consent records** — stored as a SHA-256 hash for COPPA verifiability, never as raw inet. No other store shall retain a raw IP beyond 24 h. | Must | Resolves the consent_records (DR), audit-log, FR-AUTH-111, and NFR-LOG-005 handling into one rule. |

---

## Child Safety and Safeguarding

### Mandatory Approval and Consent

These requirements reinforce and cross-reference Identity, Authentication and Authorization (FR-AUTH-020 through FR-AUTH-027) and are restated here for the integrity of the safety specification.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| SR-SAFE-010 | No student account **shall** be activated until an explicit approval decision is recorded: direct-signup students require Super Admin or Platform Moderator approval; tenant students require School Admin approval. | Must | Account state machine: `PENDING_APPROVAL` → `ACTIVE`. No intermediate active state. |
| SR-SAFE-011 | Students under 13 (COPPA) and under 16 (GDPR-K) **shall** not have their accounts created in the active state until verifiable parental consent is on record; the consent record reference **shall** be a prerequisite field for any status transition that allows platform access. | Must | Enforced at the account-state-transition service level; DB constraint prevents bypass. |
| SR-SAFE-012 | The platform **shall** display age-gating where student-generated content could be publicly indexed; no minor's submitted project **shall** be publicly discoverable without explicit School Admin and guardian opt-in. | Must | Default: projects are private to tenant; sharing requires explicit action. |
| SR-SAFE-013 | School Admins **shall** be able to set a minimum age-gate for their tenant, raising the minimum activation age above platform defaults for their jurisdiction. | Should | Useful for primary-school-only deployments. |

### Communication Safeguards

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| SR-SAFE-020 | Open private messaging between minor students **shall** not be supported; any student-to-student communication channel **shall** be visible to the Teacher of the shared class and to the School Admin. | Must | No direct-message inbox for Student role. |
| SR-SAFE-021 | All student-generated text content (comments, project descriptions, team posts, forum replies) **shall** pass through an automated content-moderation filter (profanity, PII detection, hate speech) before being stored or displayed to other users. | Must | Synchronous filter for short text; async for long submissions; reject or flag on match. |
| SR-SAFE-022 | PII inadvertently submitted by a student (email addresses, phone numbers, full name patterns detected in a code comment or description field) **shall** be automatically redacted or flagged for moderator review before the content is visible to peers. | Must | Regex + ML classifier; high-confidence matches auto-redact; low-confidence matches queued for human review. |
| SR-SAFE-023 | Students **shall** be able to submit an in-platform abuse/safety report for any content or user; reports **shall** be routed to the School Admin for tenant-scoped reports and to the Platform Moderator/Super Admin for cross-tenant or direct-signup reports within 24 hours. | Must | FR-MOD-050 through FR-MOD-053 (Abuse Reporting) in Communication, Notifications and Moderation section. |
| SR-SAFE-024 | The platform **shall** maintain a dedicated safeguarding-escalation path: high-severity reports (harm to self/others, CSAM indicators) **shall** trigger an immediate email and push notification to the Super Admin and, where applicable, the School's designated safeguarding lead. | Must | P1 incident; response SLA: acknowledge within 2 hours, escalate to authorities where required. |
| SR-SAFE-025 | No student profile picture or avatar uploaded by the student **shall** be displayed until it is reviewed and approved by a Teacher or School Admin, or passes automated image-safety classification. | Should | Default avatar assigned on registration. |

### Age-Appropriate Design Code (AADC) Alignment

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| SR-AADC-010 | The platform **shall** apply high-privacy defaults for all users identified as under 18; privacy settings **shall** default to the most restrictive option and **shall** require affirmative action (by guardian for minors) to relax. | Must | AADC Standard 7 (default settings). |
| SR-AADC-011 | The platform **shall** not employ dark patterns, compulsive design features, or streak-loss penalties in gamification that could cause distress to minor users. RoboPoints rewards **shall** be positive-only; there **shall** be no punitive point deductions without Teacher/Admin action with a stated reason. | Must | AADC Standard 10 (online tools); pairs with Functional Requirements: Teams, Competitions and Gamification. |
| SR-AADC-012 | Content that is not age-appropriate **shall** be filtered from students' visible content feeds; the platform **shall** not recommend or surface content outside the curated curriculum unless approved by a Teacher. | Must | AADC Standard 11 (profiling for recommendations). |
| SR-AADC-013 | Geolocation data **shall** not be collected from minor users without explicit parental consent and a clearly stated purpose; IP-derived country is permitted solely for jurisdiction detection (SR-PRIV-010) and **shall** not be stored beyond the session. | Must | AADC Standard 4 (data sharing). |
| SR-AADC-014 | The platform **shall** provide a "student-safe" language and UI mode for primary-school users, with simplified terminology and no references to external social platforms. | Should | AADC Standard 12 (nudge techniques). |

---

## Regulatory Compliance Mapping

The following table maps each applicable data-protection regulation to the RoboCode.Africa controls that fulfil it.

| Regulation | Key Obligations | RoboCode.Africa Controls |
|-----------|----------------|--------------------------|
| COPPA (US, under-13) | Verifiable parental consent before data collection; no behavioural advertising; data minimisation; parental right to delete. | SR-SAFE-011, FR-AUTH-020–027, SR-PRIV-011, SR-PRIV-013. |
| GDPR + GDPR-K (EU, general + under-16) | Lawful basis; consent for minors; data subject rights (access, portability, erasure); DPA notification; privacy by design; DPIA for high-risk processing. | SR-PRIV-010–014, SR-ENC-010–023, SR-AUTH-014, SR-SAFE-011, SR-AADC-010. DPIA required before launch (SR-COMP-030). |
| Zimbabwe Cyber and Data Protection Act (2021) | Consent, data minimisation, cross-border transfer controls, security safeguards, breach notification within 72 h. | SR-PRIV-010, SR-ENC-020–021, SR-IR-030 (72 h notification), SR-SAFE-011. |
| South Africa POPIA | Conditions for lawful processing; children's personal information requires parental consent; data subject rights; information officer designation; POPIA § 58 security safeguards. | FR-AUTH-020–027, SR-PRIV-013, SR-ENC-020, SR-LOG-010. Designated Information Officer required (SR-COMP-031). |
| Nigeria NDPR (2019) | Consent; data subject rights; lawful basis; data protection impact assessment; registration with NITDA for large processors. | SR-PRIV-010–013, SR-COMP-032 (NITDA registration). |
| Kenya Data Protection Act (2019) | Consent; data minimisation; data subject rights; appointment of Data Protection Officer; notification of breaches. | FR-AUTH-027 (jurisdiction notices), SR-PRIV-013, SR-IR-030, SR-COMP-033 (DPO appointment). |

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| SR-COMP-030 | A Data Protection Impact Assessment (DPIA) **shall** be completed and approved by the designated Data Protection Officer before the platform processes personal data of minors at scale (>100 minor users). | Must | GDPR Art. 35; POPIA § 4(1); output published internally. |
| SR-COMP-031 | RoboCode.Africa **shall** designate an Information Officer (South Africa POPIA) and a Data Protection Officer (GDPR/Kenya DPA) and register with the relevant authorities before serving users in those jurisdictions. | Must | Contact details published in Privacy Policy. |
| SR-COMP-032 | RoboCode.Africa **shall** register with NITDA as a data processor before serving Nigerian users at volume. | Should | Required by Nigeria NDPR; threshold determined by NITDA guidance. |
| SR-COMP-033 | The platform's Privacy Policy **shall** be written at a reading age accessible to the platform's youngest users (approximately 10 years); a plain-language summary **shall** be displayed alongside any consent form. | Must | Reviewed by legal counsel with child-literacy expertise. |
| SR-COMP-034 | Cross-border data transfers **shall** be governed by Standard Contractual Clauses (SCCs) or equivalent transfer mechanisms when personal data of EU or UK subjects is processed outside the EEA/UK. | Must | Applicable to infrastructure providers (AWS/GCP/Azure) and third-party processors (SES, Sentry, etc.). |

---

## Secure Software Development Lifecycle (SSDLC)

```
SSDLC Phase           Controls Applied
─────────────────────────────────────────────────────────────────────
Requirements          Security requirements reviewed against STRIDE model (this section).
                      DPIA gate before processing minor PII at scale (SR-COMP-030).

Design                Threat model reviewed per feature; peer sign-off by Security Lead.
                      Architecture Decision Records (ADRs) document security trade-offs.

Development           Pre-commit hooks: Trufflehog / Gitleaks (secrets), ESLint security
                      plugin, TypeScript strict mode.
                      Dependency locking: package-lock.json pinned; Dependabot auto-PRs.
                      SBOM generated per release (CycloneDX format).

CI Pipeline           SAST: CodeQL (JavaScript/TypeScript), Semgrep custom rule sets.
                      Dependency audit: `npm audit --audit-level=high` blocks merge.
                      Container scan: Trivy on all Docker images.
                      TLS/header scan: automated against staging environment.
                      OWASP ZAP baseline scan against staging API.

Staging / Pre-prod    Penetration test (external, CREST-qualified) at least annually and
                      before each major release handling new PII categories.
                      Cross-tenant isolation test suite runs in every staging deploy.

Production            Runtime: WAF rules (Cloudflare/AWS WAF); anomaly detection.
                      Secrets rotation enforced (SR-ENC-022–023).
                      Incident Response playbooks tested quarterly (SR-IR-040).

Post-Incident         Root-cause analysis; security-backlog item created; regression test
                      added to CI.
─────────────────────────────────────────────────────────────────────
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| SR-SDLC-010 | All source code **shall** be reviewed by at least one peer before merge to the main branch; security-sensitive changes (auth, consent flows, RBAC, RLS policies) **shall** require sign-off from the Security Lead. | Must | Branch-protection rule enforced in GitHub; no direct push to `main`. |
| SR-SDLC-020 | Static Application Security Testing (SAST) **shall** run on every pull request; high or critical findings **shall** block merge. | Must | CodeQL + Semgrep in GitHub Actions. |
| SR-SDLC-030 | A Software Bill of Materials (SBOM) in CycloneDX format **shall** be generated and archived for every production release. | Must | `cyclonedx-npm` in release pipeline. |
| SR-SDLC-040 | Open-source dependency updates **shall** be reviewed and applied within 7 days of a CVE rated CVSS ≥7.0 being published affecting a direct dependency; Wokwi libraries (wokwi-elements, avr8js) **shall** be treated as direct dependencies for this purpose. | Must | Dependabot + manual SLA. |
| SR-SDLC-050 | Container images **shall** be scanned with Trivy before deployment; images with critical CVEs **shall** not be promoted to production. | Must | CI gate; base images pinned to digest. |
| SR-SDLC-060 | Secrets **shall** never appear in source code, container images, or Terraform state files; detection is enforced by Gitleaks pre-commit hook and Trufflehog CI scan. | Must | Any detected secret triggers immediate rotation and a security incident. |
| SR-SDLC-070 | A penetration test by a qualified external party (CREST or OSCP-certified) **shall** be conducted before the platform reaches 1 000 student users and at least annually thereafter. | Must | Remediation of critical/high findings required before the next release cycle. |

---

## Audit Logging and Incident Response

### Audit Logging

```
Audit Log Entry Schema (structured JSON, OpenTelemetry-compatible)
──────────────────────────────────────────────────────────────────
{
  "timestamp":     ISO-8601 UTC,
  "event_id":      UUID v4,
  "event_type":    enum (see catalogue below),
  "actor_id":      user UUID | "SYSTEM",
  "actor_role":    enum (SuperAdmin | PlatformMod | SchoolAdmin | ...),
  "tenant_id":     UUID | null,
  "resource_type": string,
  "resource_id":   string,
  "outcome":       "SUCCESS" | "FAILURE" | "BLOCKED",
  "ip_address":    hashed (SHA-256 + daily salt; raw IP not stored beyond 24 h),
  "user_agent":    string (truncated to 256 chars),
  "detail":        object (event-specific metadata, PII-scrubbed)
}
──────────────────────────────────────────────────────────────────
```

**Mandatory audit event catalogue (non-exhaustive):**

- Account lifecycle: registration, email verification, parental consent grant/revoke, account approval, activation, suspension, deletion.
- Authentication: login success/failure, MFA challenge, token refresh, session termination, SSO assertion.
- RBAC: role assignment, role revocation, privilege escalation attempt (blocked).
- Tenant: tenant creation, custom-domain verification, branding update, policy change.
- Moderation: content flagged, content removed, abuse report submitted/resolved, safeguarding escalation created.
- Data: personal-data export request, personal-data deletion request, data-retention job execution.
- Administrative: break-glass Super Admin action (SR-RBAC-016), key rotation (SR-ENC-023).
- Security events: account lockout, impossible-travel alert (SR-AUTH-018), secrets-scan alert.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| SR-LOG-010 | All events in the mandatory audit catalogue **shall** be written to an append-only audit log; no application process **shall** have `UPDATE` or `DELETE` permissions on the audit table. | Must | PostgreSQL trigger denies modification; audit rows replicated to S3 cold store within 1 h. |
| SR-LOG-020 | PII fields (email, full name, date of birth) **shall** be scrubbed or pseudonymised in application logs before ingestion into the log aggregator (Grafana Loki / OpenSearch); raw PII is stored only in the dedicated audit table under access control. | Must | Log scrubbing middleware validated in CI with canary PII strings. |
| SR-LOG-030 | Audit logs **shall** be retained for a minimum of 7 years for all audit events, per the Authoritative Data Retention Schedule (Data Architecture and Database Design section); cold-storage copies **shall** be immutable (S3 Object Lock / WORM). | Must | Retention tier applied automatically on ingest; aligns with DR-005, NFR-AUD-003, NFR-COMP-005. |
| SR-LOG-040 | Parental consent records **shall** be retained for the account lifetime plus 7 years per the Authoritative Data Retention Schedule; superseded records **shall** also be retained for that window to provide a complete consent history. | Must | Legal compliance evidence; immutable by DB constraint (FR-AUTH-023); consistent with SR-PRIV-012 and DR-003. |
| SR-LOG-050 | Audit logs **shall** be exportable by Super Admin in JSON and CSV format for regulatory submissions; exports themselves **shall** be logged as audit events. | Must | Rate-limited to 5 exports per 24 h per admin to prevent mass extraction. |

### Incident Response

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| SR-IR-010 | A formal Incident Response Plan (IRP) **shall** be documented, version-controlled, and reviewed at least annually; all staff with production access **shall** be trained on the IRP. | Must | IRP stored in the internal runbook repository. |
| SR-IR-020 | Security incidents **shall** be classified by severity: P1 (active breach, CSAM, harm to minor), P2 (data leak, account takeover), P3 (vulnerability discovered, no confirmed exploit), P4 (policy deviation, no data impact). | Must | P1: immediate escalation; P2: 4 h response SLA. |
| SR-IR-030 | In the event of a personal-data breach affecting minors or any breach triggering regulatory notification, the platform **shall** notify the relevant supervisory authority within 72 hours of becoming aware; affected users **shall** be notified within 96 hours where required by the applicable regulation. | Must | Zimbabawe Cyber and Data Protection Act, GDPR Art. 33–34, POPIA § 22; notifications templated and pre-approved by legal. |
| SR-IR-040 | Incident response playbooks for the highest-risk scenarios (data breach, CSAM discovery, account takeover of a minor, DDoS) **shall** be tested in a tabletop exercise at least quarterly. | Must | Exercise outcomes logged and remediation tracked. |
| SR-IR-050 | A post-incident root-cause analysis **shall** be published internally within 5 business days of incident resolution; a security-backlog item and regression test **shall** be created for each root cause. | Should | Blameless culture; focus on systemic improvement. |

---

## Vulnerability Management and Penetration Testing

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| SR-VULN-010 | A vulnerability-disclosure policy (responsible-disclosure / bug-bounty programme) **shall** be published at `robocode.africa/security`; all reports **shall** receive an acknowledgement within 5 business days. | Must | Minimum viable: email address + PGP key. Bug-bounty programme on roadmap. |
| SR-VULN-020 | Disclosed vulnerabilities **shall** be triaged and assigned a CVSS v3.1 score; Critical (CVSS ≥9.0) findings **shall** be remediated within 24 hours of confirmation; High (7.0–8.9) within 7 days; Medium (4.0–6.9) within 30 days. | Must | Tracked in the security backlog; SLA reported to the Security Lead monthly. |
| SR-VULN-030 | An OWASP ZAP automated baseline scan **shall** run against the staging environment on every production-candidate build; scan results **shall** be published in the CI artefact store and reviewed by the Security Lead before promotion to production. | Must | Blocking gate for OWASP high-severity findings. |
| SR-VULN-040 | The RoboCode Simulation Engine (RSE) WASM sandbox (avr8js, ESP32 core) **shall** be specifically included in the annual penetration test scope; escape-from-sandbox scenarios **shall** be included as test cases. | Must | Relevant to the elevated risk of student-authored code. |
| SR-VULN-050 | Network-level vulnerability scans (Nessus or equivalent) **shall** be executed against the production infrastructure at least quarterly; identified open ports or services beyond those specified in the Infrastructure, Deployment and DevOps section **shall** be treated as P2 incidents. | Should | Coordinated with cloud provider maintenance windows. |

---

## Content Security Policy and Browser Security Headers

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| SR-HDR-010 | The platform **shall** serve a strict `Content-Security-Policy` header on all pages; the policy **shall** disallow inline scripts except where a nonce is used; `unsafe-eval` **shall** be disallowed on all pages except the RoboCode Studio editor tab, where it **shall** be restricted to the Monaco editor `blob:` worker origin only. | Must | CSP header validated by automated security scanner in CI. |
| SR-HDR-020 | The following headers **shall** be applied to all responses: `X-Content-Type-Options: nosniff`; `X-Frame-Options: SAMEORIGIN` (or `Content-Security-Policy: frame-ancestors 'self'`); `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy` disabling camera, microphone, geolocation, and payment. | Must | Verified by headers scan in CI (e.g., `securityheaders.com` API). |
| SR-HDR-030 | Subresource Integrity (SRI) attributes **shall** be applied to all third-party scripts and stylesheets loaded from a CDN; first-party assets served from the same origin are exempt. | Should | Calculated and injected at build time by Next.js. |

---

## Summary of Security Requirement IDs Used in This Section

The table below lists all requirement IDs introduced in this section for traceability (cross-reference to Requirements Traceability and Verification).

| ID Range | Area |
|----------|------|
| SR-001 – SR-010 | Security objectives |
| SR-AUTH-010 – SR-AUTH-018 | Authentication requirements |
| SR-RBAC-010 – SR-RBAC-016 | Role-based access control |
| SR-TEN-010 – SR-TEN-015 | Tenant-isolation security |
| SR-ENC-010 – SR-ENC-023 | Encryption in transit and at rest |
| SR-PRIV-010 – SR-PRIV-015 | PII and data minimisation |
| SR-SAFE-010 – SR-SAFE-025 | Child safety and safeguarding |
| SR-AADC-010 – SR-AADC-014 | Age-appropriate design code alignment |
| SR-COMP-030 – SR-COMP-034 | Regulatory compliance |
| SR-SDLC-010 – SR-SDLC-070 | Secure SDLC and supply-chain security |
| SR-LOG-010 – SR-LOG-050 | Audit logging |
| SR-IR-010 – SR-IR-050 | Incident response |
| SR-VULN-010 – SR-VULN-050 | Vulnerability management and pen testing |
| SR-HDR-010 – SR-HDR-030 | Browser security headers and CSP |
