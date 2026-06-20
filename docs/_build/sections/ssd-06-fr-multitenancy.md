# Functional Requirements: Multi-Tenancy, Custom Domains and White-Labelling

## Overview

This section specifies the functional requirements for the multi-tenant architecture of
RoboCode.Africa. The platform must serve many independent schools simultaneously while
preserving strict data isolation between tenants, enabling each school to operate under its
own domain name, and optionally rendering the product under the school's own visual
identity. Every requirement in this section uses the identifier prefix **FR-TEN-nnn** and
is prioritised using MoSCoW notation.

Cross-references to other sections are given by section title and requirement ID; page
numbers are not used because numbering is applied at document assembly.

---

## Definitions and Scope

A **Tenant** is the system-level representation of a school on RoboCode.Africa. Each
tenant owns a logically isolated partition of all platform data, a canonical subdomain, an
optional custom domain, a branding configuration, a set of feature flags and policies, and
a collection of user accounts (School Admins, Teachers, Students) bound to that tenant.

| Term | Definition |
|------|------------|
| Tenant | A school organisation with its own isolated data partition, subdomain, and optional custom domain. |
| School slug | A unique, lowercase URL-safe identifier derived from the school name; forms the subdomain. |
| Canonical subdomain | `<school-slug>.robocode.africa` — always available regardless of custom-domain status. |
| Custom domain | A fully-qualified domain name (FQDN) owned by the school and pointed at the platform. |
| Tenant context | The resolved tenant record attached to every authenticated request, used for RLS enforcement. |
| Design token | A named CSS variable that carries a theme value (colour, spacing, font) injected per tenant. |
| Feature flag | A per-tenant boolean or enumerated configuration value that enables or disables a platform capability. |
| ACME | Automated Certificate Management Environment — the protocol used by Let's Encrypt and equivalent CAs for automated TLS issuance and renewal. |
| RLS | PostgreSQL Row-Level Security — the database mechanism enforcing tenant data isolation. |

---

## Architecture Context

Multi-tenancy in RoboCode.Africa is implemented as a **shared infrastructure / isolated
data** model: all tenants run on the same application cluster and database, but every row
in every tenant-sensitive table is tagged with a `tenant_id` and protected by PostgreSQL
Row-Level Security policies. This model minimises operational cost while providing
strong data boundaries.

The tenant resolution path runs inside the API Gateway / Next.js middleware layer and
attaches the resolved `tenant_id` to every request context before any downstream service
or database query executes. No query that touches tenant-sensitive data may bypass this
middleware.

---

## Host-to-Tenant Resolution

The following ASCII diagram illustrates the full request routing path from an incoming
HTTP(S) request to a resolved tenant context.

```
Incoming HTTPS request
        |
        v
+---------------------+
|  Edge / CDN Layer   |  (Cloudflare / CloudFront)
|  TLS termination    |  Wildcard cert for *.robocode.africa
|  DDoS / WAF         |  Custom-domain certs issued per tenant via ACME
+----------+----------+
           |
           v
+----------+---------------------+
|  API Gateway / Next.js         |
|  Tenant Resolution Middleware  |
|                                |
|  1. Extract Host header        |
|     e.g. myrwadzano.robocode.africa
|         OR code.myrwadzano.edu.zw
|                                |
|  2. Lookup strategy:           |
|     a. Exact match on          |
|        custom_domains table    |
|        (indexed on domain FQDN)|
|     b. If no match, parse      |
|        subdomain from Host and |
|        match tenants.slug      |
|     c. If Host = robocode.africa
|        (no subdomain) → main-  |
|        domain context (no      |
|        tenant; Super Admin /   |
|        marketing site path)    |
|                                |
|  3. Cache hit? (Redis TTL 60s) |
|     YES → attach tenant_id,   |
|            branding tokens,    |
|            feature flags       |
|      NO → DB lookup, hydrate   |
|            Redis cache         |
|                                |
|  4. Tenant status check:       |
|     Active → proceed           |
|     Suspended → serve 451 page |
|     Not found → 404 page       |
|                                |
|  5. Attach tenant_id to        |
|     request context (headers + |
|     AsyncLocalStorage)         |
+----------+---------------------+
           |
           v
+----------+----------+
|  NestJS Microservices|
|  All DB queries via  |
|  tenant-scoped ORM   |
|  (SET app.tenant_id  |
|   per connection;    |
|   RLS enforced by PG)|
+---------------------+
```

---

## TLS Provisioning Flow

The following ASCII diagram details the automated TLS certificate issuance and renewal
flow for custom domains.

```
School Admin                Platform (Cert Manager)         ACME CA (Let's Encrypt)
     |                               |                               |
     | Request custom domain         |                               |
     |------------------------------>|                               |
     |                               | Validate FQDN format          |
     |                               | Check uniqueness              |
     |                               |                               |
     | Return DNS instructions       |                               |
     | (CNAME target + TXT token)    |                               |
     |<------------------------------|                               |
     |                               |                               |
     | (School Admin adds records    |                               |
     |  at DNS registrar)            |                               |
     |                               |                               |
     | Trigger "Verify DNS"          |                               |
     |------------------------------>|                               |
     |                               | DNS check loop (max 72 hrs)   |
     |                               | Check CNAME → platform origin |
     |                               | Check TXT ownership token     |
     |                               |                               |
     |                               |== DNS resolved ==             |
     |                               |                               |
     |                               | Initiate ACME order           |
     |                               |------------------------------>|
     |                               |                               |
     |                               | Serve ACME HTTP-01 or         |
     |                               | DNS-01 challenge response     |
     |                               |<------------------------------|
     |                               |                               |
     |                               | Certificate issued (DV, 90d)  |
     |                               |<------------------------------|
     |                               |                               |
     |                               | Store cert + private key in   |
     |                               | encrypted secrets store       |
     |                               | Provision to edge/CDN         |
     |                               |                               |
     | "Domain active" notification  |                               |
     |<------------------------------|                               |
     |                               |                               |
     |     [30 days before expiry]   |                               |
     |                               | Auto-renewal ACME order       |
     |                               |------------------------------>|
     |                               | New cert issued, hot-swapped  |
     |                               |<------------------------------|
     |                               |                               |
     |                               | On renewal failure:           |
     |                               | Alert Super Admin (email +    |
     |                               | in-app) immediately           |
```

---

## Functional Requirements

### Tenant Provisioning

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEN-001 | On approval of a school registration (see Identity section, FR-AUTH), the system **shall** automatically provision a new tenant record containing: a globally unique `tenant_id` (UUID v4), `school_slug`, display name, country, plan tier, status (`active`), and provisioning timestamp. | Must | Provisioning completes within 60 seconds of approval action. Tenant record atomic; partial provisioning rolled back on error. |
| FR-TEN-002 | The provisioning workflow **shall** create the following resources atomically: tenant database partition (RLS policy set), default branding configuration record, default feature-flag set, and the School Admin user account linked to `tenant_id`. | Must | Idempotent provisioning: re-running on transient failure does not create duplicate records. |
| FR-TEN-003 | The system **shall** assign a `school_slug` by normalising the school name to lowercase ASCII, replacing non-alphanumeric characters with hyphens, trimming leading/trailing hyphens, and appending a numeric suffix if a collision exists. | Must | Slug validation: 3–48 characters; pattern `[a-z0-9][a-z0-9-]*[a-z0-9]`. Collision suffix example: `harare-high-2`. |
| FR-TEN-004 | The `school_slug` **shall** be mutable only by a Super Admin after initial provisioning; a slug change **shall** update all internal references, redirect the old subdomain path to the new one (HTTP 301) for a configurable grace period (default 90 days), and generate an audit log entry. | Must | Teachers and students are notified by email of the URL change. Grace-period redirect preserves deep links. |
| FR-TEN-005 | Tenant provisioning **shall** trigger an automated welcome email to the School Admin containing: the canonical subdomain URL, the admin dashboard URL, a single-use account-activation link (valid 7 days), and a quick-start guide link. | Must | Email sent from platform transactional address. Design tokens apply school display name in subject. |
| FR-TEN-006 | The system **shall** expose a tenant management API (authenticated, Super Admin only) to list, create, suspend, reinstate, and delete tenants programmatically, returning structured JSON with tenant metadata. | Must | REST endpoint: `GET/POST/PATCH/DELETE /admin/tenants`. All mutations audit-logged. |

---

### Subdomain Allocation and Routing

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEN-010 | The system **shall** serve the canonical subdomain `<school-slug>.robocode.africa` for each active tenant using a DNS wildcard record (`*.robocode.africa`) pre-configured at the platform DNS level; no DNS action is required from the School Admin for subdomain activation. | Must | Wildcard record managed by platform operations team (Terraform/IaC). Propagation pre-configured before tenant is provisioned. |
| FR-TEN-011 | The Tenant Resolution Middleware **shall** parse the `Host` request header, extract the subdomain label, look up the corresponding `school_slug` in the tenant registry (Redis cache first, PostgreSQL fallback), and attach the resolved `tenant_id` to the request context before any downstream handler executes. | Must | Cache TTL: 60 seconds. Cache miss triggers a synchronous DB lookup; result is cached on return. Lookup must complete within 5 ms (p99). |
| FR-TEN-012 | The middleware **shall** return HTTP 404 with a platform-branded error page for unrecognised subdomains, and HTTP 451 with an explanatory message for subdomains mapped to a suspended tenant. | Must | 451 page includes contact information for the platform Data Protection Officer. |
| FR-TEN-013 | The subdomain routing **shall** support up to 10,000 active tenants without degradation in middleware resolution latency (p99 < 10 ms with warm cache). | Must | Performance validated by load test (see NFR-PERF section). Redis cluster used for cache; consistent hashing for cache distribution. |
| FR-TEN-014 | Navigation to the main domain `robocode.africa` (no subdomain) **shall** render the marketing site and direct-signup path with no tenant context; attempts to access authenticated school-tenant pages from this host without a tenant context **shall** redirect to the main-domain login page. | Must | Prevents tenant context bleed-through on the main domain. |

---

### Custom Domain Connection

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEN-020 | The system **shall** accept custom domain connection requests from authenticated School Admins (with the `manage_domain` permission) via the School Admin dashboard. The submitted FQDN **shall** be validated against RFC 1123 hostname rules and checked for uniqueness across all active and pending custom-domain records. | Must | Duplicate check is case-insensitive. Wildcard subdomains (e.g. `*.school.edu`) are not accepted. |
| FR-TEN-021 | On receiving a valid custom domain request, the system **shall** generate and persist: (a) a CNAME verification record specifying the target as the platform's edge hostname (e.g. `edge.robocode.africa`), and (b) a unique DNS TXT token for ownership verification, formatted as `robocode-verify=<token>`. Both **shall** be displayed in the School Admin dashboard with copy-to-clipboard controls. | Must | Token is HMAC-signed (SHA-256) using the tenant secret and the FQDN; expires after 72 hours; renewable on demand. |
| FR-TEN-022 | The system **shall** poll DNS for CNAME and TXT record propagation at the following intervals: 5 minutes (first 30 minutes), 15 minutes (30 minutes to 4 hours), 60 minutes (4 hours to 72 hours). DNS lookups **shall** be performed from at least two geographically distributed vantage points to account for split-horizon DNS. | Must | Polling implemented as a background job (BullMQ queue). Failure after 72 hours triggers a School Admin notification with troubleshooting steps. |
| FR-TEN-023 | The School Admin **shall** be able to trigger an immediate DNS re-check from the dashboard at any time during the verification window; the platform **shall** rate-limit manual re-checks to 10 per hour per domain. | Should | Rate limiting prevents abuse of DNS lookup infrastructure. |
| FR-TEN-024 | The system **shall** persist the DNS verification status (`pending`, `cname_verified`, `txt_verified`, `both_verified`, `failed`, `expired`) and make it visible in the School Admin dashboard with a human-readable explanation for each state. | Must | Status updated in real time via WebSocket push when polling job completes. |
| FR-TEN-025 | A School Admin **shall** be able to remove a custom domain. Removal **shall** revoke the TLS certificate for that domain, update the CDN edge configuration within 5 minutes, redirect traffic to the canonical subdomain, and generate an audit log entry. | Should | Confirmation dialog lists impact: existing shared links and any SSO configurations using the custom domain. |
| FR-TEN-026 | The system **shall** enforce a maximum of one active custom domain per tenant. A School Admin wishing to change the custom domain **shall** remove the existing domain before connecting a new one, or invoke a domain-swap API (Super Admin only) that performs the transition atomically. | Must | Constraint prevents conflicting certificate management. Roadmap: multiple custom domains per tenant in a future release. |

---

### Automated TLS Issuance and Renewal

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEN-030 | Upon successful DNS verification of a custom domain (FR-TEN-022), the Cert Manager service **shall** automatically initiate an ACME order with Let's Encrypt (or the configured CA) without any further action from the School Admin. | Must | Cert Manager is a dedicated NestJS microservice backed by a BullMQ queue; it must not block the HTTP request path. |
| FR-TEN-031 | The Cert Manager **shall** support both ACME HTTP-01 and DNS-01 challenge types. HTTP-01 **shall** be the default; DNS-01 **shall** be used as a fallback when HTTP-01 is not feasible (e.g. the custom domain does not resolve to the platform's IP during challenge). | Must | DNS-01 requires integration with the platform's DNS provider API (Route 53 / Cloudflare) for programmatic TXT record injection. |
| FR-TEN-032 | The issued TLS certificate and its corresponding private key **shall** be stored encrypted at rest in the platform secrets store (HashiCorp Vault or AWS Secrets Manager) and provisioned to the edge layer (Cloudflare / CloudFront) via their respective APIs within 10 minutes of issuance. | Must | Private key never stored unencrypted; never written to application logs. |
| FR-TEN-033 | The system **shall** automatically renew TLS certificates no later than 30 days before expiry. Renewal **shall** be transparent with no downtime (hot-swap). | Must | Renewal triggered by a cron job scanning certificates expiring within 35 days. Zero-downtime achieved by provisioning new cert to edge before revoking old. |
| FR-TEN-034 | If auto-renewal fails for any reason, the system **shall** immediately alert the Super Admin via email and in-app notification, and **shall** retry renewal on an exponential backoff schedule (starting at 1 hour, capped at 24 hours) until renewal succeeds or the certificate expires. | Must | If certificate expires, the custom domain is temporarily disabled and traffic is rerouted to the canonical subdomain; tenant is notified. |
| FR-TEN-035 | All HTTP traffic arriving at a custom domain **shall** be permanently redirected to HTTPS (HTTP 301). The platform **shall** send an HTTP Strict-Transport-Security (HSTS) header with `max-age=31536000` (1 year) on all responses from active custom domains. | Must | HSTS preloading is not applied automatically but is available on request via Super Admin configuration. |

---

### Tenant-Routing Middleware Specification

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEN-040 | The Tenant Resolution Middleware **shall** be implemented as a Next.js Edge Middleware function executing at the CDN/edge layer before the request reaches the application origin, ensuring zero additional round-trips for tenant resolution on cache hits. | Must | Uses Next.js `middleware.ts`; runs in the Vercel/Cloudflare Edge runtime or equivalent. Must not rely on Node.js runtime APIs not available at the edge. |
| FR-TEN-041 | The middleware **shall** attach the resolved `tenant_id`, `school_slug`, `plan_tier`, `branding_version`, and `feature_flags_hash` to request headers (e.g. `X-Tenant-ID`, `X-Tenant-Slug`) for consumption by downstream Next.js server components and NestJS microservices. | Must | Downstream services **shall not** independently re-resolve the tenant from the `Host` header; they **shall** trust the middleware-injected headers (validated via shared HMAC). |
| FR-TEN-042 | The middleware **shall** enforce that authenticated JWT tokens contain a `tenant_id` claim that matches the request's resolved tenant. Cross-tenant token use **shall** result in HTTP 403. | Must | Prevents horizontal privilege escalation across tenants. Logged as a security event (see Security, Privacy and Child Safety section). |
| FR-TEN-043 | The middleware **shall** handle multi-region deployments by consulting a global tenant registry replica (read-only PostgreSQL follower or Redis cluster) in the same region as the edge node, avoiding cross-region latency for resolution lookups. | Should | Critical for low-latency delivery from African edge nodes (af-south-1 / Nairobi PoP). |
| FR-TEN-044 | The middleware **shall** log every tenant resolution event (host, resolved tenant_id, resolution path, cache hit/miss, latency) to the structured logging pipeline (OpenTelemetry) for observability and anomaly detection. | Must | Log sampling rate configurable; default 10% for healthy requests; 100% for errors. |

---

### Per-Tenant Branding Configuration

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEN-050 | The system **shall** maintain a `tenant_branding` record per tenant containing: logo URL (light), logo URL (dark), favicon URL, hero image URL, brand primary colour (hex), brand secondary colour (hex), display name, tagline, custom footer text, and a `published_at` timestamp. | Must | Schema version-controlled; migrations run atomically. Defaults are the RoboCode.Africa platform values. |
| FR-TEN-051 | The system **shall** serve a tenant-specific CSS file (generated at publish time) containing all design token overrides as CSS custom properties (e.g. `--color-brand-primary: #1a73e8`). This file **shall** be served from the CDN with a cache key that includes the `branding_version` hash, ensuring instant cache-busting on publish. | Must | CSS file generated server-side; minified; served with `Cache-Control: public, max-age=31536000, immutable` (content-addressed). |
| FR-TEN-052 | The School Admin **shall** be able to upload branding assets via the **Branding & Appearance** dashboard section. Uploads **shall** be validated server-side for MIME type (PNG, SVG, ICO, JPEG, WebP), file size limits, and minimum pixel dimensions before being stored in S3-compatible object storage and served via CDN. | Must | Asset constraints: logo max 512 KB (PNG/SVG), min 200×60 px; favicon max 64 KB (ICO/PNG 32×32 + 180×180); hero image max 2 MB. Server-side validation only; client-side preview is supplementary. |
| FR-TEN-053 | The system **shall** compute and validate the WCAG 2.2 AA contrast ratio (minimum 4.5:1) between each submitted brand colour and white (#FFFFFF). If the contrast ratio falls below threshold, the system **shall** return a non-blocking warning in the API response and display it in the dashboard; it **shall not** reject the colour unless the ratio falls below 3.0:1 (hard block). | Must | Contrast computed using the WCAG 2.1 relative luminance formula. Warning threshold: 4.5:1. Hard block threshold: 3.0:1. |
| FR-TEN-054 | The system **shall** implement a draft/publish workflow for branding changes: all changes are saved as a draft and do not take effect until the School Admin explicitly publishes. Draft state is persisted server-side; refreshing the browser does not lose draft changes. | Must | Draft stored in `tenant_branding_drafts` table; at most one draft per tenant at any time. |
| FR-TEN-055 | On publish, the system **shall** atomically copy the draft to the live `tenant_branding` record, increment the `branding_version`, regenerate and invalidate the tenant CSS file in the CDN, and notify all active WebSocket sessions for that tenant to reload their branding bundle. | Must | CDN cache invalidation via the CDN provider's purge API. WebSocket notification emitted within 5 seconds of publish. Active sessions reflect the new branding within 60 seconds without requiring a page reload. |
| FR-TEN-056 | The system **shall** retain the three most recent published branding snapshots per tenant, enabling the School Admin to revert to any previous snapshot via a **Revert to Previous** action in the dashboard. | Should | Snapshots stored in `tenant_branding_history`; revert is a publish of the historical record, generating a new version entry. |
| FR-TEN-057 | Branding asset uploads **shall** be scanned by the platform's content moderation pipeline (automated image classifier) before being committed to storage. Uploads containing prohibited content (adult imagery, hate symbols) **shall** be rejected with a clear error message and the incident **shall** be escalated to the Super Admin moderation queue. | Must | See also Functional Requirements: Communication, Notifications and Moderation (FR-MOD). |
| FR-TEN-058 | The live branding preview **shall** render the tenant landing page, login page, and student dashboard header in an iframe within the School Admin dashboard using the draft branding tokens, without affecting the published live site. The preview **shall** be available at desktop (1280 px), tablet (768 px), and mobile (375 px) breakpoints via a viewport toggle. | Must | Preview iframe served from a sandboxed origin (e.g. `preview.robocode.africa`) to prevent script injection from the preview context into the admin dashboard. |
| FR-TEN-059 | Unless the tenant holds an active enterprise or premium white-label plan, all tenant-branded pages **shall** include a "Powered by RoboCode.Africa" attribution link in the page footer. On premium white-label plans the attribution may be removed via a Super Admin toggle on the tenant record. | Must | Attribution rendered from server-side layout; not removable by client-side CSS overrides. |

---

### Themable UI and Design Token System

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEN-060 | The frontend **shall** use a Tailwind CSS + Radix/shadcn design token system where all tenant-overridable visual properties are expressed as CSS custom properties injected into the `<html>` element's `style` attribute server-side (SSR), ensuring correct styling on first paint without FOUC. | Must | Token list: `--color-brand-primary`, `--color-brand-secondary`, `--color-brand-text-on-primary`, `--color-brand-text-on-secondary`, `--font-family-brand` (roadmap). |
| FR-TEN-061 | The Tailwind configuration **shall** reference design tokens as semantic colour aliases (e.g. `brand-primary`, `brand-secondary`) mapped to the CSS custom properties, so that all platform UI components automatically adopt tenant colours without per-component customisation. | Must | No hardcoded colour values in component source; all colours referenced through token aliases. |
| FR-TEN-062 | The RoboCode Studio canvas, including the Wokwi component elements and the wiring overlay, **shall** use the platform's own colour palette and **shall not** be overridden by tenant design tokens, preserving the consistent simulator UX. The surrounding application shell (header, sidebar, footer, navigation) **shall** adopt the tenant theme. | Must | Studio canvas is a contained SPA within an iframe or a shadow DOM boundary; parent page shell tokens do not leak into the canvas. |
| FR-TEN-063 | The system **shall** support a dark-mode variant of the tenant theme. Where a School Admin provides a dark-mode logo, it **shall** be used when the user's OS prefers dark mode (`prefers-color-scheme: dark`). Dark-mode colour tokens are automatically derived from the primary/secondary values using HSL lightness inversion if no explicit dark tokens are provided. | Could | Explicit dark-mode colour override by School Admin is a Phase 2 feature. |

---

### Per-Tenant Feature Flags and Policies

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEN-070 | The system **shall** maintain a `tenant_features` record per tenant as a set of named boolean or enumerated flags. The platform **shall** define a canonical flag schema with documented default values; any flag absent from a tenant's record **shall** fall back to the platform default. | Must | Flag schema versioned; flag additions are non-breaking (new flags default to platform default). Breaking changes (flag removal) require migration. |
| FR-TEN-071 | The following feature flags **shall** be configurable per tenant by a School Admin (within plan constraints) or a Super Admin: `studio_3d_mode`, `block_coding_mode`, `esp32_board_support`, `collaboration_mode`, `project_public_sharing`, `public_project_gallery`, `student_peer_messaging`, `gamification_leaderboard`, `parent_dashboard`. | Must | Disabling a flag hides the corresponding UI elements and rejects API calls referencing the disabled feature with HTTP 403. |
| FR-TEN-072 | The following feature flags **shall** be configurable only by a Super Admin (not delegatable to School Admin): `white_label_attribution_removed`, `custom_smtp_enabled`, `seat_limit_override_active`, `beta_features_enabled`. | Must | Super Admin-only flags stored in a separate `tenant_admin_overrides` table; not returned in the School Admin settings API. |
| FR-TEN-073 | Feature flags **shall** be evaluated server-side and reflected in the JWT claims returned to the client (as a compact flags bitmask or hash), ensuring the client cannot enable features by manipulating flag state client-side. | Must | Client uses flags from JWT for UI rendering only; all feature-gated API routes validate flags independently from the JWT on each request. |
| FR-TEN-074 | The system **shall** propagate feature flag changes to active sessions within 60 seconds. Active clients **shall** receive a WebSocket push event (`tenant.flags_updated`) prompting them to re-fetch the current flag set without requiring a logout/login cycle. | Should | Prevents stale flag state from persisting in long-lived sessions. |
| FR-TEN-075 | Tenant policies **shall** include: `student_registration_mode` (invite-only / self-register-with-approval / SSO-only), `parental_consent_method` (platform-email / offline-upload / school-declaration), `content_moderation_level` (standard / strict), `peer_messaging_enabled` (boolean), `school_timezone` (IANA tz string), and `academic_year_start` (date). | Must | Policies stored in `tenant_policies` table. Changes audit-logged with previous and new values. |
| FR-TEN-076 | The system **shall** enforce the `peer_messaging_enabled` policy at the API layer: when `false`, all direct-message creation endpoints between student accounts within the tenant **shall** return HTTP 403. Default is `false`. | Must | Safety-first prime directive. See also Functional Requirements: Communication, Notifications and Moderation (FR-COMM). |

---

### Tenant Data Isolation via PostgreSQL RLS

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEN-080 | Every table in the PostgreSQL schema that contains tenant-sensitive data **shall** include a non-nullable `tenant_id UUID NOT NULL` column with a foreign key constraint to the `tenants` table. | Must | Schema enforced via migration tooling; CI pipeline fails if a new migration adds a tenant-sensitive table without this column. |
| FR-TEN-081 | PostgreSQL Row-Level Security **shall** be enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) on all tenant-sensitive tables. A `USING (tenant_id = current_setting('app.tenant_id')::uuid)` policy **shall** be applied, permitting rows only where the row's `tenant_id` matches the session-level application setting. | Must | Policy applied for SELECT, INSERT, UPDATE, DELETE. `FOR ALL` policy used; separate write policies applied for audit tables (append-only). |
| FR-TEN-082 | The application **shall** set `SET LOCAL app.tenant_id = '<uuid>'` within each database transaction, derived from the middleware-injected `tenant_id` on the request context. No transaction **shall** execute queries against tenant-sensitive tables without first setting this session variable. | Must | ORM interceptor (TypeORM/Prisma middleware) handles the `SET LOCAL` call automatically for every connection pool checkout. Unit-tested to confirm RLS is never bypassed. |
| FR-TEN-083 | Super Admin queries that require cross-tenant access (e.g. global reporting, tenant management) **shall** use a dedicated database role with RLS bypass (`BYPASSRLS` attribute), accessible only through the Super Admin API service, never through tenant-scoped services. | Must | Database roles: `app_tenant_role` (RLS enforced), `app_superadmin_role` (BYPASSRLS). Connection pools are separate per role; credentials stored in Vault. |
| FR-TEN-084 | The system **shall** include automated integration tests that create two tenants, insert data in each, and verify that a query under tenant A's context cannot retrieve rows belonging to tenant B. These tests **shall** run in the CI pipeline on every pull request. | Must | Tests in the `test/rls` suite; failure blocks merge. |
| FR-TEN-085 | Tenant data **shall** never be stored in unpartitioned shared tables without a `tenant_id` column. Any exception (e.g. global reference data, platform configuration) **shall** be documented and reviewed by the Security team, and such tables **shall** be read-only to application roles. | Must | Security review checklist item before any schema change merges. |

---

### School Admin Delegation

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEN-090 | A Super Admin **shall** be able to create and activate a School Admin account for any tenant, linking it to the tenant's `tenant_id` with the `school_admin` RBAC role. A School Admin has full administrative authority within their tenant and none outside it. | Must | Multi-tenant RBAC enforced at API gateway via JWT claims (`role`, `tenant_id`). See Functional Requirements: Identity, Authentication and Authorization (FR-AUTH). |
| FR-TEN-091 | A School Admin **shall** be able to promote any Teacher within their tenant to a **Deputy Admin** sub-role, granting a configurable subset of School Admin permissions (e.g. student approval, branding, but not billing or domain management). | Should | `deputy_admin` role stored as a tenant-scoped permission set; not a separate top-level RBAC role. |
| FR-TEN-092 | Each tenant **shall** support a minimum of one and a maximum of five School Admin accounts. Attempts to create a sixth **shall** be rejected with a clear error. Super Admin may raise this limit per tenant via an override flag. | Should | Limit prevents uncontrolled admin proliferation; five covers typical school hierarchies (principal, deputy, HODs). |
| FR-TEN-093 | A School Admin **shall** receive TOTP-based MFA enrollment as a mandatory step during initial account activation. School Admin actions that modify critical tenant configuration (domain settings, branding publish, policy changes, seat management) **shall** require a valid MFA challenge within the last 15 minutes. | Must | Step-up authentication for sensitive operations. See FR-AUTH for MFA specification. |

---

### White-Label Email (Custom Sender Domain and DKIM)

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEN-100 | By default, all transactional emails sent to users within a tenant **shall** use the platform sender domain (e.g. `noreply@mail.robocode.africa`) with the school display name in the `From` display field (e.g. `Myrwadzano High via RoboCode.Africa <noreply@mail.robocode.africa>`). | Must | Default behaviour; no School Admin action required. DKIM and SPF configured for the platform sender domain by the platform operations team. |
| FR-TEN-101 | On an enterprise or premium plan, a School Admin **shall** be able to configure a custom sender domain (e.g. `noreply@code.myrwadzano.edu.zw`) for tenant email. The platform **shall** present the DNS records (SPF TXT, DKIM CNAME, DMARC TXT) required to authorise the platform's email infrastructure to send on behalf of the custom sender domain. | Should | Custom sender domains available on enterprise plans only. DNS record generation uses the platform's transactional email provider API (SES/SendGrid). |
| FR-TEN-102 | The system **shall** verify that the required SPF and DKIM DNS records are correctly published before activating a custom sender domain for outbound email. Verification **shall** be performed automatically (polling up to 48 hours) and confirmed to the School Admin in the dashboard. | Should | Uses the same polling job architecture as custom-domain DNS verification (FR-TEN-022). |
| FR-TEN-103 | All transactional emails sent to a tenant's users **shall** apply the tenant's display name, logo (where the email client supports HTML), and school-appropriate greeting language as defined in the `tenant_branding` record. | Must | HTML email template uses `<img src="...logo-url...">` with the CDN-served logo asset. Plain-text fallback includes display name only. |
| FR-TEN-104 | Bulk or broadcast email sending to students (e.g. class announcements, task reminders) **shall** pass through the platform's outbound email throttle (maximum 500 emails per minute per tenant) to protect shared email infrastructure reputation. | Must | Throttle enforced by BullMQ rate-limited queue. Excess jobs are delayed, not dropped. |

---

### Tenant Suspension, Offboarding and Export

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-TEN-110 | A Super Admin **shall** be able to suspend a tenant, changing its status to `suspended`. All user logins for the tenant **shall** be immediately invalidated (existing JWT tokens rejected); HTTP 451 served to all requests for the tenant's domains. Active sessions receive a WebSocket disconnect event. | Must | Suspension is reversible. JWT revocation via Redis blocklist. |
| FR-TEN-111 | The reason for suspension **shall** be recorded in the audit log and communicated to the School Admin by email within 5 minutes of the suspension action. The email **shall** include the reason, the date of effect, and a contact pathway to appeal or remediate. | Must | Suspension reasons: non-payment, safeguarding violation, terms breach, manual request by school. |
| FR-TEN-112 | A Super Admin **shall** be able to reinstate a suspended tenant, restoring all user access, within a documented reinstatement workflow that requires the Super Admin to confirm the remediation action has been completed. | Must | Reinstatement audit-logged; School Admin notified by email. |
| FR-TEN-113 | A School Admin **shall** be able to initiate voluntary offboarding (school deletion) via the dashboard. The request **shall** require: a written confirmation of intent, a 30-day notice period during which the tenant remains active, and Super Admin review before final deletion proceeds. | Must | 30-day notice gives the school time to export data and notify users. |
| FR-TEN-114 | Before final tenant deletion, the system **shall** generate a full data export package for the tenant containing: all student project files (JSON/code), RoboPoints history, learning progress records, teacher gradebook data, and audit logs. The export **shall** be delivered as a downloadable archive (ZIP) to the School Admin's email within 24 hours of export initiation. | Must | Export implements GDPR Art. 20 data portability. Archive encrypted with AES-256; decryption key sent in a separate email. |
| FR-TEN-115 | Following the 30-day notice period and Super Admin confirmation, the system **shall** execute tenant deletion: anonymise all student PII (name, email, date-of-birth replaced with hashed values), delete project files from object storage, revoke and delete TLS certificates, remove custom-domain records, release the school slug, and mark the tenant record as `deleted` (soft delete retained for audit). | Must | Deletion is irreversible. Hard-delete of the tenant record is not performed; the record is retained (anonymised) for audit and legal hold purposes for a minimum of 7 years. |
| FR-TEN-116 | During the offboarding notice period, the School Admin **shall** receive weekly reminder emails listing the days remaining and a checklist of recommended actions (notify students, export data, cancel connected SSO). | Should | Reminder emails use the tenant's branding until the tenant is deleted. |

---

## MoSCoW Priority Summary

| ID Range | Capability | Priority |
|----------|------------|----------|
| FR-TEN-001 – FR-TEN-006 | Tenant provisioning | Must |
| FR-TEN-010 – FR-TEN-014 | Subdomain allocation and routing | Must |
| FR-TEN-020 – FR-TEN-022 | Custom domain connection and DNS instructions | Must |
| FR-TEN-023 – FR-TEN-024 | DNS re-check and status tracking | Should / Must |
| FR-TEN-025 – FR-TEN-026 | Custom domain removal and constraints | Should / Must |
| FR-TEN-030 – FR-TEN-035 | ACME TLS issuance, renewal, HSTS | Must |
| FR-TEN-040 – FR-TEN-044 | Tenant-routing middleware | Must / Should |
| FR-TEN-050 – FR-TEN-059 | Branding configuration, assets, draft/publish | Must / Should |
| FR-TEN-060 – FR-TEN-063 | Themable UI design token system | Must / Could |
| FR-TEN-070 – FR-TEN-076 | Feature flags and tenant policies | Must / Should |
| FR-TEN-080 – FR-TEN-085 | PostgreSQL RLS data isolation | Must |
| FR-TEN-090 – FR-TEN-093 | School Admin delegation and MFA | Must / Should |
| FR-TEN-100 – FR-TEN-104 | White-label email and custom sender domain | Must / Should |
| FR-TEN-110 – FR-TEN-116 | Tenant suspension, offboarding, export | Must / Should |

---

## Data Model Sketch

The following table summarises the primary database entities introduced by this section.
Full schema definitions are specified in the Data Architecture and Database Design section.

| Table | Key Columns | RLS Protected |
|-------|-------------|---------------|
| `tenants` | `tenant_id`, `slug`, `status`, `plan_tier`, `created_at` | No (registry table; row-level policy not needed) |
| `custom_domains` | `tenant_id`, `fqdn`, `status`, `cname_target`, `txt_token`, `verified_at` | Yes |
| `tenant_branding` | `tenant_id`, `branding_version`, `logo_url_light`, `logo_url_dark`, `primary_colour`, `secondary_colour`, `published_at` | Yes |
| `tenant_branding_drafts` | `tenant_id`, `draft_payload` (JSONB), `updated_at` | Yes |
| `tenant_branding_history` | `tenant_id`, `version`, `snapshot_payload` (JSONB), `published_at` | Yes |
| `tenant_features` | `tenant_id`, `flag_name`, `flag_value` | Yes |
| `tenant_policies` | `tenant_id`, `policy_name`, `policy_value` | Yes |
| `tls_certificates` | `tenant_id`, `fqdn`, `status`, `expires_at`, `secret_ref` | Yes |

---

## Interface Requirements

| ID | Interface | Description | Notes |
|----|-----------|-------------|-------|
| IR-TEN-01 | Custom Domain DNS API | Platform verifies DNS records via DNS-over-HTTPS (DoH) resolver queries from at least two PoPs. | Google DoH and Cloudflare DoH used as dual-vantage resolvers. |
| IR-TEN-02 | ACME / Let's Encrypt API | Cert Manager initiates ACME orders and responds to challenges via HTTP-01 and DNS-01. | ACME directory URL configurable per environment; staging CA used in non-production. |
| IR-TEN-03 | CDN / Edge Config API | Cert Manager provisions and deprovisions TLS certificates and custom-domain routing rules at the edge layer. | Cloudflare API v4 or CloudFront API; abstracted behind a `CertEdgeAdapter` interface. |
| IR-TEN-04 | Object Storage API | Branding asset uploads are stored in S3-compatible storage; served via CDN with signed URLs for private assets. | AWS S3 or compatible (MinIO for local dev). Bucket policy: private; CDN Origin Access Control. |
| IR-TEN-05 | Email Provider API | Custom sender domain DKIM/SPF record generation uses the email provider's domain authentication API. | SES or SendGrid Domain Authentication API. |

---

## Security Requirements (Multi-Tenancy Specific)

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| SR-TEN-001 | Tenant data isolation **shall** be enforced at the database layer via RLS (FR-TEN-081) independently of application-layer checks. RLS bypass **shall** only be possible by the `app_superadmin_role` database user, not by the regular application role. | Must | Defence in depth: application-layer checks plus DB-layer RLS. |
| SR-TEN-002 | The `tenant_id` injected by the Tenant Resolution Middleware **shall** be HMAC-signed before being passed downstream, and **shall** be validated by each microservice before use, to prevent header injection attacks. | Must | HMAC key rotated via Vault dynamic secrets; 15-minute validity window. |
| SR-TEN-003 | Custom domain TLS private keys **shall** never be logged, never stored in application code or repositories, and **shall** be stored exclusively in the platform secrets manager with access restricted to the Cert Manager service account. | Must | Verified by secrets-scanning CI job (e.g. `truffleHog`) and Vault audit log. |
| SR-TEN-004 | The platform **shall** perform a DNS rebinding attack check before provisioning a TLS certificate for a custom domain, verifying that the FQDN resolves to a platform-owned IP range and not to an internal or loopback address. | Must | Prevents SSRF via custom domain certificate issuance. |

---

## Cross-References

| This Section | Referenced Section | Relationship |
|--------------|--------------------|--------------|
| FR-TEN-001 – FR-TEN-006 | Functional Requirements: Identity, Authentication and Authorization (FR-AUTH) | Tenant provisioning is triggered by the school approval workflow in FR-AUTH. School Admin account creation and MFA enrollment are specified there. |
| FR-TEN-080 – FR-TEN-085 | Data Architecture and Database Design | Full PostgreSQL RLS policy DDL, schema ERDs, and partition strategy are specified there. |
| FR-TEN-050 – FR-TEN-059 | Functional Requirements: RoboCode Studio IDE (FR-STU) | Studio canvas uses platform tokens only; surrounding shell adopts tenant tokens. Token injection boundary defined here. |
| FR-TEN-070 – FR-TEN-076 | Functional Requirements: Learning Management and Content (FR-LRN) | Feature flags govern which learning modes (block coding, ESP32) are active per tenant. |
| FR-TEN-076 | Functional Requirements: Communication, Notifications and Moderation (FR-COMM, FR-MOD) | `peer_messaging_enabled` policy directly gates the messaging capability specified in FR-COMM. |
| FR-TEN-100 – FR-TEN-104 | Functional Requirements: Administration, Analytics and Reporting (FR-ADM) | Email throttle metrics and sender domain status are surfaced in the Super Admin observability dashboard. |
| FR-TEN-110 – FR-TEN-115 | Security, Privacy and Child Safety | Tenant offboarding and PII anonymisation satisfy GDPR Art. 17 and COPPA deletion obligations specified there. |
| FR-TEN-030 – FR-TEN-035 | Infrastructure, Deployment and DevOps | ACME integration, secrets management, and CDN configuration are elaborated in the Infrastructure section. |
| FR-TEN-044 | Observability, Logging, Monitoring and Support | Tenant resolution events feed the OpenTelemetry pipeline specified in that section. |

---

## Constraints and Assumptions

- The platform operates a shared-infrastructure multi-tenancy model; physical database
  separation per tenant is not supported in this release but is noted as a long-term
  roadmap option for enterprise contracts requiring it.
- A DNS wildcard record (`*.robocode.africa`) covering all tenant subdomains is
  pre-configured by the platform operations team as a prerequisite for any tenant
  subdomain to function; this record is not managed dynamically per tenant.
- Free-tier tenants do not have access to custom-domain configuration, custom sender
  domains, or premium white-label features. These capabilities are gated behind paid plan
  tiers enforced via the `plan_tier` field on the tenant record.
- DNS propagation behaviour is outside the platform's control; the 72-hour verification
  window and multi-vantage-point polling strategy are designed to accommodate worst-case
  global TTL behaviour but cannot guarantee faster propagation.
- ACME certificate issuance depends on availability of the CA's API (Let's Encrypt rate
  limits apply: 50 certificates per registered domain per week). The platform caches and
  renews certificates to minimise new issuances.
- The Tenant Resolution Middleware runs at the Edge/CDN layer; it must use only APIs and
  storage mechanisms available in the Edge runtime (Cloudflare Workers KV or equivalent);
  it may not rely on standard Node.js modules not available in that environment.
