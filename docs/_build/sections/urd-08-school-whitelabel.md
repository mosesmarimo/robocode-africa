# User Requirements: School Onboarding, Custom Domain and White-Labelling

## Overview

This section defines the user requirements for the end-to-end journey of onboarding a school (Tenant) onto RoboCode.Africa: from initial organisation account creation through subdomain/custom-domain configuration, DNS verification, automatic TLS provisioning, branding and white-labelling, policy governance, and seat/licence management. Together these requirements enable any accredited school to operate a fully isolated, optionally branded instance of RoboCode.Africa under its own domain while remaining governed by the platform's safety-first policies.

Cross-references: requirements in this section complement the account authentication requirements in **Section 7 (User Requirements: Authentication and Account Management)** and the administration and reporting requirements in **Section 16 (User Requirements: Administration and Reporting)**. The underlying technical implementation (multi-tenant Postgres RLS, subdomain/custom-domain routing, ACME/Let's Encrypt TLS, white-label design tokens) is specified in the System Specification Document sections on **Multi-Tenancy (TEN module)** and **Identity (AUTH module)**.

> **Requirement-ID banding (this section).** UR-SCH identifiers in this section are deliberately banded by topic, so non-contiguous numbering (e.g., -008 then -010, -014 then -020) indicates an intentional gap reserved for future requirements within that band, not an omission. The bands are: 001–019 registration & subdomain; 020–029 custom domain, DNS & TLS; 030–039 branding & white-label; 040–049 registration mode & age groups; 050–059 seat/licence management; 060–069 policy & branding governance. Note: the tenant-scoping access-control rules `UR-SCH-090..095` are defined in Section 5 (Roles and Permissions), not here.

---

## Context and Scope

A **Tenant** in RoboCode.Africa is a School represented as an isolated organisational unit with:

- A dedicated subdomain: `<school-slug>.robocode.africa`
- An optional custom domain: e.g. `code.myrwadzano.ac.zw`
- Its own branding (logo, colours, favicon, landing page copy)
- A private student roster approved by the **School Admin**
- Configurable feature policies, age-group settings, and seat quotas

The **School Admin (Tenant Admin)** role owns the onboarding journey. The **Super Admin** approves or rejects the school registration before the tenant is activated. All requirements in this section apply to the onboarding flow experienced by a School Admin, with Super Admin oversight noted where applicable.

---

## School Organisation Account Creation

### Description

A representative of a school (prospective School Admin) registers the school as an organisation on RoboCode.Africa. The registration is submitted as a request and must be approved by a **Super Admin** or **Platform Moderator** before the tenant is activated. Until approval, no students or teachers may sign up under that school.

### Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-SCH-001 | A prospective School Admin shall be able to submit a new school registration request via a dedicated **Register Your School** form on the `robocode.africa` marketing site. | Must | Form is publicly accessible without prior authentication. |
| UR-SCH-002 | The registration form shall collect: legal school name, country, physical address, school type (primary / secondary / both), estimated student count, School Admin full name, work email address, contact phone number, and agreement to the Platform Terms of Service and Data Processing Agreement. | Must | All fields mandatory. Email must be a verifiable institutional address (domain not blacklisted). |
| UR-SCH-003 | The system shall send an email verification link to the School Admin's submitted work email address; the registration request shall not be forwarded to Super Admin review until the email address is verified. | Must | Link expires after 48 hours; re-send available. |
| UR-SCH-004 | Upon email verification, the system shall create the school registration in **Pending Approval** status and notify the Super Admin / Platform Moderator queue for review. | Must | Super Admin sees all pending school requests in the Administration dashboard (see Section 16). |
| UR-SCH-005 | The Super Admin shall be able to approve, request changes to, or reject a school registration, with a mandatory free-text reason for any rejection or change request. | Must | Rejection reason is emailed to the School Admin. |
| UR-SCH-006 | Upon approval, the system shall automatically provision the tenant: create the database partition (tenant_id with Row-Level Security), assign the default subdomain, and send the School Admin an account-activation link. | Must | Activation link is single-use and expires after 7 days. |
| UR-SCH-007 | The School Admin shall set a strong password (minimum 12 characters, uppercase, lowercase, digit, symbol) and configure TOTP-based MFA as part of the initial activation flow before accessing the tenant dashboard. | Must | TOTP MFA is mandatory for all School Admins and Teachers (see UR-AUTH-xxx). |
| UR-SCH-008 | The system shall record a complete audit log entry for every state transition of the school registration (submitted, email-verified, pending-review, approved/rejected, activated). | Must | Audit logs stored for a minimum of 7 years per data-protection requirements. |

---

## Subdomain Assignment

### Description

Every approved school is automatically assigned a canonical subdomain of the form `<school-slug>.robocode.africa`. The school slug is derived from the school name but is editable during onboarding, subject to uniqueness and formatting constraints.

### Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-SCH-010 | The system shall auto-generate a suggested school slug from the legal school name (lower-case, ASCII, hyphens; no spaces or special characters) and present it for confirmation during activation. | Must | Example: "Harare High School" → `harare-high-school`. |
| UR-SCH-011 | The School Admin shall be able to edit the auto-generated slug during initial activation, subject to: 3–48 characters, letters/digits/hyphens only, no leading or trailing hyphen, and global uniqueness across all tenants. | Must | Real-time availability check via the API before submission. |
| UR-SCH-012 | Once the subdomain is confirmed and the tenant activated, the school slug shall be immutable unless changed by a Super Admin, to protect existing links and SSO configurations. | Must | School Admin may request a slug change via a support ticket visible in the admin panel. |
| UR-SCH-013 | The resulting subdomain (`<slug>.robocode.africa`) shall be routed to the tenant's branded landing/login page within 5 minutes of activation. | Must | DNS wildcard `*.robocode.africa` is pre-configured at the platform level; no DNS action required from the school for the subdomain. |
| UR-SCH-014 | The School Admin dashboard shall display the active subdomain URL prominently with a one-click copy button and a **Share with Students** mailto/link helper. | Should | |

---

## Custom Domain Configuration

### Description

Schools may optionally connect their own domain or subdomain (e.g. `code.myschool.edu`) to their RoboCode.Africa tenant. The platform guides the School Admin through the required DNS changes, verifies ownership, and automatically provisions a TLS certificate. This is an advanced step available after initial tenant activation.

### Custom Domain Flow

```
School Admin                 RoboCode.Africa Platform           DNS / CA
     |                               |                              |
     |-- Request custom domain ----->|                              |
     |                               |-- Generate TXT/CNAME ------->|
     |<-- Show DNS instructions -----|    verification tokens        |
     |                               |                              |
     |  (Admin adds CNAME/TXT        |                              |
     |   records at registrar)       |                              |
     |                               |                              |
     |-- Click "Verify DNS" -------->|                              |
     |                               |-- Poll / check DNS records ->|
     |                               |<-- Records resolved ----------|
     |                               |                              |
     |                               |-- ACME challenge (Let's Encrypt)
     |                               |-- TLS certificate issued ----|
     |<-- Domain active confirmation-|                              |
     |                               |                              |
     |  (All traffic to custom       |                              |
     |   domain served over HTTPS    |                              |
     |   by the platform CDN/edge)   |                              |
```

### Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-SCH-020 | The School Admin shall be able to initiate custom-domain configuration from the **Domain Settings** section of the School Admin dashboard at any point after tenant activation. | Should | Available only to School Admins with the `manage_domain` permission. |
| UR-SCH-021 | The system shall accept a fully qualified domain name (FQDN) or subdomain (e.g. `code.myschool.edu` or `robocode.stjohn.ac.za`), validate its format, and check that it is not already in use by another tenant. | Must | Validation: valid hostname per RFC 1123; duplicate check against all active and pending custom domains. |
| UR-SCH-022 | The system shall present the School Admin with clear, step-by-step DNS configuration instructions, including: the exact CNAME record (name and target value), an optional TXT ownership-verification record, and links to help guides for common registrars (GoDaddy, Namecheap, Google Domains, afriDNS, etc.). | Must | The canonical CNAME target value is `<tenant-id>.proxy.robocode.africa` (consistent with UC-002 and US-078). Instructions must be copyable as text. No HTML-only display. |
| UR-SCH-023 | The system shall automatically verify DNS propagation (polling at intervals up to 72 hours) and notify the School Admin by email when verification succeeds or when it has not resolved within 72 hours. | Must | Platform checks CNAME/TXT resolution from multiple vantage points; acknowledges propagation delays up to 48 hours and continues polling. |
| UR-SCH-024 | The School Admin shall be able to trigger an immediate DNS re-check at any time during the verification window from the dashboard. | Should | Useful when propagation is faster than the polling interval. |
| UR-SCH-025 | Upon successful DNS verification, the system shall automatically provision a TLS certificate for the custom domain using the ACME protocol (Let's Encrypt or equivalent CA) without requiring any action from the School Admin. | Must | Certificate provisioning shall complete within 10 minutes of DNS verification. |
| UR-SCH-026 | The system shall automatically renew TLS certificates before expiry (at least 30 days in advance) without requiring School Admin intervention, and shall alert the Super Admin if auto-renewal fails. | Must | Zero-downtime renewal. |
| UR-SCH-027 | Once a custom domain is active, all HTTP traffic to that domain shall be permanently redirected (HTTP 301) to HTTPS. The tenant's canonical subdomain (`<slug>.robocode.africa`) shall continue to function as a fallback. | Must | HSTS header required (min-age 1 year, includeSubDomains) for domains that opt in. |
| UR-SCH-028 | The School Admin shall be able to remove a custom domain from the dashboard, reverting all traffic to the canonical subdomain, with a confirmation dialog warning of the impact on existing links and SSO configurations. | Should | Removal takes effect within 5 minutes; old certificate is revoked. |

---

## Branding and White-Labelling

### Description

A School Admin can upload branding assets and set colour themes to replace the default RoboCode.Africa visual identity with the school's own identity on all tenant-scoped pages: the landing page, login/signup page, student dashboard, and teacher dashboard. The RoboCode Studio canvas remains the platform's own, but the surrounding shell (header, footer, sidebar) adopts the tenant theme.

### Branding Assets

| Asset | Format / Constraints | Where Used |
|-------|----------------------|------------|
| School logo (light backgrounds) | PNG/SVG, max 512 KB, min 200×60 px | Header, email headers, student dashboard |
| School logo (dark backgrounds) | PNG/SVG, max 512 KB, min 200×60 px | Dark-mode header, login page hero |
| Favicon | ICO/PNG 32×32 and 180×180 (Apple touch), max 64 KB | Browser tab, mobile home-screen icon |
| Landing page hero image | PNG/JPEG/WebP, max 2 MB, 1920×1080 min | Tenant landing page |
| Brand primary colour | Hex colour code | Buttons, links, active states, progress bars |
| Brand secondary / accent colour | Hex colour code | Highlights, badges, hover states |
| School display name | Plain text, max 80 characters | Page titles, email subjects, dashboards |
| School tagline (optional) | Plain text, max 140 characters | Landing page sub-heading |
| Custom footer text (optional) | Plain text, max 300 characters | Footer of all tenant pages |

### Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-SCH-030 | The School Admin shall be able to upload all branding assets defined in the Branding Assets table above via a **Branding & Appearance** section in the School Admin dashboard. | Must | Uploads stored in S3-compatible object storage; served via CDN. |
| UR-SCH-031 | The system shall validate each uploaded asset for file type, file size, minimum dimensions (where applicable), and shall reject files that fail validation with a clear, actionable error message. | Must | Server-side validation only; client-side preview is in addition to, not a replacement for, server-side validation. |
| UR-SCH-032 | The system shall apply the brand primary and secondary colours as CSS design tokens throughout the tenant shell (header, sidebar, buttons, links, progress indicators, notification badges) using the Tailwind CSS + Radix/shadcn theming system. | Must | Colour tokens: `--color-brand-primary` and `--color-brand-secondary`; default platform tokens used until overridden. |
| UR-SCH-033 | The system shall enforce a minimum contrast ratio of 4.5:1 (WCAG 2.2 AA) between the chosen brand primary colour and white text, and shall warn the School Admin (non-blocking) if the contrast ratio falls below this threshold. | Must | Accessibility requirement; WCAG 2.2 AA compliance. |
| UR-SCH-034 | The School Admin shall be able to customise the tenant landing page (the page users see before logging in) with the school logo, hero image, display name, tagline, and a **Register / Log In** call-to-action. | Must | Rich-text body content is a Should (roadmap). |
| UR-SCH-035 | The School Admin shall be able to customise the login and student-signup page with the school logo and colour theme, replacing the default RoboCode.Africa branding. | Must | A discrete "Powered by RoboCode.Africa" attribution link shall remain visible in the footer on white-labelled pages unless a premium white-label plan is active. |
| UR-SCH-036 | The platform shall provide a **Live Branding Preview** mode within the dashboard that renders the landing page and login page with the current (saved or unsaved) branding settings before the School Admin publishes the changes. | Must | Preview shall be device-responsive: desktop and mobile viewports toggled within the preview pane. |
| UR-SCH-037 | The School Admin shall be able to **Publish** or **Discard** pending branding changes; changes shall only take effect tenant-wide upon explicit Publish action. | Must | A timestamped publish history with revert-to-previous capability is a Should. |
| UR-SCH-038 | Branding changes shall propagate to all active user sessions in the tenant within 60 seconds of being published, without requiring users to log out. | Should | Cache-busting via CDN cache invalidation on the branding CSS/asset bundle. |
| UR-SCH-039 | The system shall apply the school display name in all outbound transactional emails sent to users of that tenant (subject lines, greeting, sender name) in place of the default "RoboCode.Africa". | Should | Sender address remains a platform-managed domain (e.g. `noreply@mail.robocode.africa`) unless the school has configured a custom SMTP sender on an enterprise plan. |

---

## School Policy Configuration

### Description

The School Admin configures operational policies that govern how students and teachers interact with the platform within the tenant. Policies include student approval rules, allowed features, age group mappings, communication restrictions, and content visibility.

### Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-SCH-040 | The School Admin shall be able to configure the **student registration mode** for the tenant: (a) invite-only (students receive an email invite link), (b) self-registration with approval (student submits request; School Admin approves), or (c) SSO-only (Google/Microsoft school SSO provisions accounts automatically). | Must | Default is mode (b). Approval requirement cannot be disabled; it can only be delegated to a Teacher in mode (b). |
| UR-SCH-041 | The School Admin shall be able to define one or more **age groups** active in the school (e.g. "Primary Grade 4–7: ages 9–12", "High School Form 1–6: ages 13–18"), each with an associated set of permitted features and component catalogues. | Must | Age groups map to curriculum levels in the Learning module (see Section 12). |
| UR-SCH-042 | The School Admin shall be able to enable or disable specific RoboCode Studio features at the tenant level, including: 3D simulation mode, block-based coding mode, ESP32 board support, collaboration mode, external URL sharing of projects, and the public projects gallery. | Should | Platform-level defaults are used for any feature not explicitly toggled. Disabling a feature hides its UI elements for all users in the tenant. |
| UR-SCH-043 | The School Admin shall be able to configure the **parental/guardian consent** collection method: (a) platform-managed email consent workflow, (b) upload of offline consent form PDF per student, or (c) school-managed consent with a declaration. All minors (under-16 for GDPR-K, under-13 for COPPA) require verifiable consent before account activation. | Must | See also UR-ONB-xxx (Section 6) and child-safety requirements. No minor account may be activated without confirmed consent. |
| UR-SCH-044 | The School Admin shall be able to define a **content moderation policy level** for the tenant: Standard (platform default filters), Strict (enhanced profanity/PII filter, all shared content moderated before publishing), or Custom (Super Admin-assisted configuration). | Should | Content moderation requirements are also specified in Section 15 (Communication, Notifications and Safety). |
| UR-SCH-045 | The School Admin shall be able to restrict student-to-student communication to teacher-supervised class channels only, disabling any peer direct-messaging capabilities for students within the tenant. | Must | Safety-first prime directive; peer private messaging between minors is off by default and requires explicit School Admin opt-in subject to Super Admin approval. |
| UR-SCH-046 | The School Admin shall be able to set a **school timezone** and **academic year calendar** (term start/end dates) that drive task due-date defaults and report period filters in the tenant. | Should | |
| UR-SCH-047 | All policy changes shall be logged in the audit trail with the School Admin's identity, timestamp, previous value, and new value. | Must | Audit trail accessible to Super Admin; School Admin can view their own change history. |

---

## Seat and Licence Management

### Description

A school's subscription plan defines the maximum number of active student and teacher accounts (seats) permitted. The School Admin manages seat quotas within the allocated licence and can request additional seats.

### Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-SCH-050 | The School Admin shall be able to view the current seat allocation: total purchased student seats, total purchased teacher seats, seats currently in use, and seats remaining. | Must | Displayed on the School Admin dashboard home and in the **Subscription & Seats** section. |
| UR-SCH-051 | The system shall prevent the School Admin from approving new student or teacher accounts when the respective seat quota is exhausted, displaying a clear message and a call-to-action to upgrade the plan or request additional seats. | Must | Pending approval requests are retained in the queue; they are not rejected automatically. |
| UR-SCH-052 | The School Admin shall be able to initiate a seat upgrade request or self-service seat purchase (where available under the school's billing plan) directly from the dashboard without leaving the tenant management area. | Should | Payments via Stripe, Paystack, or Flutterwave depending on region. |
| UR-SCH-053 | The School Admin shall be able to deactivate (not delete) individual student or teacher accounts to free up seats for new users. Deactivated accounts retain all project data for a configurable retention period (default 90 days). | Must | Student RoboPoints and project history are preserved; account can be reactivated by School Admin within the retention window. |
| UR-SCH-054 | The system shall send an automated notification to the School Admin when seat usage reaches 80% and 95% of the licensed quota, prompting them to review or upgrade. | Should | Notifications delivered via in-app notification and email. |
| UR-SCH-055 | The Super Admin shall be able to override the seat limit for a specific tenant on a temporary basis (e.g. for a trial extension or competition event) with a defined expiry date and a reason recorded in the audit log. | Should | |

---

## Branding Preview and Publishing Workflow

### Description

Before applying branding changes tenant-wide, the School Admin uses a preview workflow to inspect the appearance across key page templates, adjust, and then publish in a single atomic operation.

### Preview Workflow

```
 +---------------------+       +---------------------+       +---------------------+
 |  Branding Settings  |       |   Live Preview Pane |       |  Publish / Discard  |
 |  (School Admin      |------>|  (Desktop / Mobile  |------>|  Confirmation       |
 |   dashboard)        | Save  |   viewport toggle)  | OK    |  Dialog             |
 +---------------------+ Draft +---------------------+       +----------+----------+
                                                                         |
                                                     Published (atomic) |
                                                                         v
                                                          +--------------+----------+
                                                          |  CDN cache invalidated  |
                                                          |  All tenant pages use   |
                                                          |  new branding tokens    |
                                                          +-------------------------+
```

### Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| UR-SCH-060 | The preview pane shall render a realistic representation of the tenant landing page, login page, and student dashboard header using the in-progress (draft) branding assets without publishing. | Must | Preview uses the same Tailwind/shadcn design token pipeline as the live tenant, not a synthetic mock. |
| UR-SCH-061 | The preview pane shall include a viewport toggle allowing the School Admin to preview at desktop (1280 px), tablet (768 px), and mobile (375 px) widths. | Must | |
| UR-SCH-062 | The preview shall clearly indicate that it is a preview (e.g. a banner reading "Preview mode — not yet published") to avoid confusion with the live site. | Must | |
| UR-SCH-063 | Branding assets shall be stored as a draft until the School Admin explicitly selects **Publish**; a Publish confirmation dialog shall summarise the changes about to go live. | Must | |
| UR-SCH-064 | The system shall retain the last three published branding snapshots and allow the School Admin to revert to a previous snapshot via a **Revert to Previous** action. | Should | Each snapshot stores all asset URLs and colour tokens at the time of publication. |

---

## MoSCoW Priority Summary

| ID Range | Capability | Priority |
|----------|------------|----------|
| UR-SCH-001 – UR-SCH-008 | School organisation account creation and approval | Must |
| UR-SCH-010 – UR-SCH-014 | Subdomain assignment and routing | Must |
| UR-SCH-020 – UR-SCH-028 | Custom domain configuration, DNS verification, TLS | Must / Should |
| UR-SCH-030 – UR-SCH-039 | Branding assets, white-labelling, design tokens | Must / Should |
| UR-SCH-040 – UR-SCH-047 | School policy configuration | Must / Should |
| UR-SCH-050 – UR-SCH-055 | Seat and licence management | Must / Should |
| UR-SCH-060 – UR-SCH-064 | Branding preview and publish workflow | Must / Should |

---

## Relationships to Other Requirements

| This Section | Related Requirement Area | Nature of Relationship |
|---|---|---|
| UR-SCH-007 | Section 7 — Authentication and Account Management | School Admin MFA is mandated by auth policy; this section triggers the MFA setup flow. |
| UR-SCH-040 – UR-SCH-043 | Section 6 — Onboarding, Signup and Approval | Student approval and parental consent rules are set here; execution happens in the onboarding flow. |
| UR-SCH-042, UR-SCH-045 | Section 15 — Communication, Notifications and Safety | Tenant-level feature toggles and moderation policy link to platform-wide safeguarding rules. |
| UR-SCH-044 – UR-SCH-045 | Section 15 — Communication, Notifications and Safety | Content moderation policy level and peer-messaging restrictions drive the moderation pipeline. |
| UR-SCH-050 – UR-SCH-055 | Section 16 — Administration and Reporting | Super Admin seat overrides and billing events appear in the global administration dashboard. |
| UR-SCH-010 – UR-SCH-028 | SSD Multi-Tenancy (TEN module) | DNS, ACME/TLS, RLS isolation, subdomain routing are specified at the functional level in the SSD. |
| UR-SCH-030 – UR-SCH-039 | SSD Front-End (AUTH/TEN modules) | Tailwind/shadcn design token injection and CDN asset serving are specified in the SSD. |

---

## Constraints and Assumptions

- A school must be registered as a legal entity (government or private school) before applying; the Super Admin review step is intended to verify institutional legitimacy.
- Free/trial tenants are limited to the default `<slug>.robocode.africa` subdomain; custom-domain configuration requires a paid plan.
- The "Powered by RoboCode.Africa" attribution in the footer is mandatory for free and standard plans; it may be removed only on an enterprise or premium white-label plan approved by the Super Admin.
- DNS propagation is outside the platform's control; the 72-hour verification window accommodates worst-case global DNS TTL behaviour.
- All branding images are served from the platform CDN (Cloudflare/CloudFront) and are subject to the platform's acceptable-use policy. Uploaded content is scanned for prohibited material.
- School policy changes (especially consent-method changes and communication restrictions) take effect prospectively; existing activated accounts are not retroactively deactivated when policies are tightened, but a migration prompt is shown to the School Admin.
