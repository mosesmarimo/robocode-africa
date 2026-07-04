# Publish Projects to `*.robocode.studio` Subdomains — Design

**User-approved decisions (2026-07-04):** wildcard DNS (GoDaddy touched once per domain; app routes by Host) · served content = the read-only published project · any signed-in user may publish a project they own, forced public, with moderated/validated names · GoDaddy client built behind env config with a dry-run fallback; user supplies credentials; no live DNS mutation without confirmation. **Two publish domains: `robocode.studio` AND `robocode.africa` — the publishing user chooses per project.**

## Goal

A user saves a project and publishes it at `myproject.robocode.studio` (or `myproject.robocode.africa`) — a public, read-only, shareable page. One-time GoDaddy setup points `*.<domain>` at the app for each publish domain; each publish is then a fast app-side operation (assign a subdomain slug on the chosen domain), and the app serves the right view by Host header.

## Two domains + tenant disambiguation (robocode.africa)

The user chooses `robocode.studio` OR `robocode.africa` when publishing. `robocode.studio` is **publish-only** (no tenants) — clean namespace. `robocode.africa` is **shared** with school tenants (`springfield.robocode.africa` resolves to a Tenant), so:

- **Precedence:** on `robocode.africa`, a subdomain that matches a Tenant slug is ALWAYS the tenant (schools win). A published project can never take or shadow a tenant slug.
- **Availability on africa** therefore rejects: existing tenant slugs, reserved infra names, taken published names, format/profanity failures. (Availability on studio: reserved + profanity + taken published names + format.)
- **Routing:** `*.robocode.studio` host → always the published-site route. `*.robocode.africa` host → resolve tenant first (unchanged existing behavior); only when NO tenant matches does the app fall back to resolving a published project for that africa subdomain and render the published site. Wildcard `*.robocode.africa` already exists for tenants, so no new DNS record is needed for the africa case — GoDaddy is only needed to add `*.robocode.studio` (and the ACME TXT for its wildcard cert).

## Why wildcard (not per-subdomain GoDaddy records)

Per-user DNS records via GoDaddy would add propagation delay per publish, API rate limits at scale, and per-name TLS. A single `*.robocode.studio` record + Host routing (the pattern the app already uses for `*.robocode.africa` tenants) makes publish instant and infinitely scalable. GoDaddy is still used — once, to create the wildcard A/CNAME (and it powers the DNS-01 challenge for the wildcard TLS cert). The `GoDaddyService` also exposes per-record upsert/delete for future reserved/custom names.

## Architecture

### Data model (`prisma/schema.prisma`, additive)
- `Project.subdomain String?` — lowercase DNS label; `null` = not published.
- `Project.publishDomain String?` — `"robocode.studio"` or `"robocode.africa"` (null = not published).
- `Project.publishedAt DateTime?`.
- `@@unique([publishDomain, subdomain])` — the name is unique WITHIN a domain (so `foo.robocode.studio` and `foo.robocode.africa` can be different projects). Partial-null pairs are fine (unpublished projects have both null).
- Publish also forces `visibility = "public"`. (Reuse existing `visibility`; a published project is inherently public-readable.)

### Backend — new `publish` module (`src/modules/publish/`)
- `GoDaddyService` (`godaddy.service.ts`): thin GoDaddy v1 client. Auth header `Authorization: sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}`, base `https://api.godaddy.com` (or `https://api.ote-godaddy.com` when `GODADDY_OTE=true`). Methods: `ensureWildcard(domain, target)` (idempotent PUT of the `*` record for that domain → app ingress), `upsertRecord(domain,type,name,value)`, `deleteRecord(domain,type,name)`, `getRecord(domain,type,name)`. **Dry-run**: when `GODADDY_API_KEY`/`SECRET` are unset, every method logs the intended change and returns `{ dryRun:true }` WITHOUT any network call — lets us build/test safely; user flips live by setting env. `PUBLISH_DOMAINS = ["robocode.studio","robocode.africa"]` (configurable); GoDaddy manages the zone for whichever domains it has API access to.
- `constants.ts`: `PUBLISH_DOMAINS`, `RESERVED_SUBDOMAINS`, `PROFANITY_BLOCKLIST` (shared).
- `publish.service.ts` (all methods take the chosen `domain`, validated ∈ `PUBLISH_DOMAINS`):
  - `validateName(name)` — lowercase; regex `^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$` (3–32 chars); reject RESERVED (`www api app admin studio mail ftp ns1 ns2 smtp webmail cpanel dashboard login signup static assets cdn help support blog docs status` + platform infra names); reject profanity blocklist.
  - `checkAvailability(domain, name)` → `{ available, reason? }`: format + reserved + profanity + not-taken-by-a-published-project(domain,name); **AND if `domain==="robocode.africa"`, also reject if a Tenant with `slug===name` exists** (tenants win).
  - `publish(user, projectId, domain, subdomain)` — owner-only; validate `domain ∈ PUBLISH_DOMAINS` + availability; transaction sets `subdomain`, `publishDomain=domain`, `publishedAt`, `visibility="public"`; call `goDaddy.ensureWildcard(domain, target)` (idempotent, dry-run-safe — a no-op for africa whose wildcard already exists); return `{ url: "https://<sub>.<domain>" }`. Rate-limited (a few publishes/min/user).
  - `unpublish(user, projectId)` — owner-only; clear `subdomain`/`publishDomain`/`publishedAt`. Frees the name.
  - `resolvePublished(domain, subdomain)` — PUBLIC read model: return `{ title, ownerDisplayName, ownerReferralCode?, kind, boardType, diagram, files:[{name,content}], updatedAt }` ONLY when a project has that `(publishDomain,subdomain)` and `visibility="public"`; else 404. No private fields, no owner email. (`ownerReferralCode` powers the "make your own" footer CTA → viral loop.)
  - `takedown(domain, subdomain)` — admin/moderator: clear it + record a moderation case.
- `publish.controller.ts`:
  - `GET /publish/domains` (JWT) → the list of publishable domains (so the UI offers the choice).
  - `GET /publish/check?domain=&subdomain=` (JWT) → availability.
  - `POST /projects/:id/publish { domain, subdomain }` (JWT, owner) → `{ url }`.
  - `POST /projects/:id/unpublish` (JWT, owner).
  - `GET /published?domain=&subdomain=` (PUBLIC, no guard) → read-only render payload. (Query params, not a path segment, since a subdomain label collides with nothing and domain must be explicit.)
  - Takedown folded into the existing admin/moderation controller.

### Frontend — domain routing + published view + publish UI
- Env: `NEXT_PUBLIC_PUBLISH_DOMAINS=robocode.studio,robocode.africa` (client), `PUBLISH_DOMAINS` server-side. `robocode.africa` already = `NEXT_PUBLIC_ROOT_DOMAIN`.
- `src/proxy.ts`:
  - `*.robocode.studio` host (studio is publish-only) → **rewrite** to `/_site/robocode.studio/<sub>`. Apex `robocode.studio` → landing or redirect to robocode.africa.
  - `*.robocode.africa` host → UNCHANGED tenant path (set `x-tenant`). Published-project fallback for africa is handled server-side (below), NOT in the edge proxy, so tenant routing/precedence is untouched and the proxy stays DB-free.
- `src/app/_site/[domain]/[subdomain]/page.tsx`: server-fetches `GET /published?domain=&subdomain=`; renders a chromeless public page:
  - `kind==="robotics"` → the existing **read-only Studio** component (canvas + code + Run using the client sim engines — the ESP32/Pico fixes we just shipped) — read-only, no editing/save.
  - `kind==="coding"` + html/css/js → the **live rendered site** in a sandboxed iframe (`srcdoc` from the project's files; the same preview the Coding Studio builds).
  - other coding langs → code view + a "Run" button using the **browser sandbox** we just built (Pyodide/sql.js/JS worker) — real output, no server needed.
  - Footer: "Built on RoboCode · Make your own" → `https://robocode.africa/join?ref=<ownerReferralCode>` (viral loop — every published site is an invite).
  - 404 page for unknown/unpublished subdomains.
- **Africa published-project fallback (server-side):** for a `*.robocode.africa` request whose subdomain resolves to NO tenant, the existing tenant "not found"/catch path additionally calls `GET /published?domain=robocode.africa&subdomain=<sub>` and, if a published project exists, renders the same `_site` view (reuse the component). Tenant match always wins; this only fires when there is no tenant. (Locate the current "unknown subdomain" handling — `getActiveTenant` → null — and add the published fallback there.)
- Publish UI (`src/components/studio/publish-dialog.tsx` + a "Publish" button in the Studio header): owner picks a **domain** (from `/publish/domains`) and a subdomain, live availability check (`/publish/check?domain=&subdomain=`), publish → shows the live `https://<sub>.<domain>` URL with copy + share (ref-tagged). Unpublish button when already published. Show current published URL in the project header.

### Ops / TLS (`docs/publish-ops.md`)
- One-time per NEW domain: with GoDaddy creds set, run `ensureWildcard("robocode.studio", target)` (a tiny admin script `scripts/ensure-wildcard.ts` or a boot-time idempotent call) to create `*.robocode.studio` → the app's ingress IP/CNAME. `*.robocode.africa` already exists (tenants) — no new record. **Outward-facing — the studio wildcard is created only with the user's explicit confirmation.**
- Wildcard TLS: `*.robocode.studio` needs a wildcard cert (Let's Encrypt DNS-01 via the GoDaddy API, or Caddy with the GoDaddy DNS plugin); `*.robocode.africa` cert already covers the africa case. The GoDaddyService `upsertRecord`/`deleteRecord` supports the `_acme-challenge` TXT dance.
- The reverse proxy must route `*.robocode.studio` (and existing `*.robocode.africa`) to the Next app (same app, Host-based).

## Security
- Subdomain is a strict DNS label (charset `[a-z0-9-]`) — no XSS/path-injection surface from the name; validated on both check and publish.
- Reserved + profanity blocklists (a youth platform); admin takedown; publishes rate-limited.
- Published payload is read-only and public-by-definition; `resolvePublished` returns only render fields, never private/owner-PII. No code runs server-side (sandbox is client-side).
- The `*.robocode.studio` origin is SEPARATE from `*.robocode.africa` (tenant/auth) — published pages carry no session cookie context and can't reach authed tenant data. Confirm the published route sets no auth and reads only the public endpoint.
- GoDaddy credentials only in server env; never shipped to the client; dry-run when absent.

## Testing
No test frameworks: backend `src/modules/publish/smoke.ts` (subdomain validation incl. reserved/profanity/format; availability; publish→resolve round-trip; unpublish frees the name; takedown; GoDaddy dry-run makes no network call). Frontend Playwright `scripts/_repro-publish.mjs` (publish a project, hit the `_site` route with a spoofed Host, assert the read-only render). Typecheck all repos.

## Out of scope (fast-follows)
Custom apex domains for user sites, per-subdomain analytics, edit-after-publish live sync, published-site theming, paid/premium subdomains, automated wildcard-cert renewal wiring (documented, not automated here).
