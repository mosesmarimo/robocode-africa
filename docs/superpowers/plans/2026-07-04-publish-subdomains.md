# Publish Projects to Subdomains Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Let users publish a project at `<name>.robocode.studio` or `<name>.robocode.africa` — a public read-only page — with a one-time GoDaddy wildcard per domain and Host-based routing.

**Architecture:** New backend `publish` module (`GoDaddyService` dry-run-safe client + `PublishService` + controller) and `Project.{subdomain,publishDomain,publishedAt}`. Frontend: `*.robocode.studio` rewrites to a chromeless `_site` route; `*.robocode.africa` keeps tenant routing with a server-side published-project fallback when no tenant matches. Publish UI in the Studio.

**Tech Stack:** NestJS + Prisma, Next.js 15 (read `robocode-frontend/node_modules/next/dist/docs/` before proxy/app-router work), GoDaddy v1 DNS API.

## Global Constraints

- Three repos under `/Users/marimo/Dev/robocode`; commit per repo. End every commit message with:

```
Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SxfjwdvQNhvtgpE2HSPeFf
```

- No test frameworks: typecheck each repo; backend smoke (`npx tsx <file>`); Playwright repro (dev :3000/:4000, login `ada@robocode.africa`/`password123`).
- Publish domains: `robocode.studio` (publish-only) and `robocode.africa` (shared with school tenants — **tenants always win**; a published name on africa must not be an existing tenant slug).
- Name rule (verbatim): lowercase, `^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$` (3–32 chars); reject reserved (`www api app admin studio mail ftp ns1 ns2 smtp webmail cpanel dashboard login signup static assets cdn help support blog docs status`) and a profanity blocklist.
- `@@unique([publishDomain, subdomain])`. Publish forces `visibility="public"`.
- GoDaddy: `Authorization: sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}`; base `https://api.godaddy.com` (or ote when `GODADDY_OTE=true`). **When key/secret unset → DRY-RUN: log intended change, no network call.** Never mutate live DNS without the user's confirmation.
- Published payload is public read-only render fields only — never owner email or private data.

---

### Task 1: Schema — `Project.{subdomain, publishDomain, publishedAt}`

**Files:** Modify `robocode-backend/prisma/schema.prisma`.

- [ ] **Step 1:** Add to `model Project`: `subdomain String?`, `publishDomain String?`, `publishedAt DateTime?`, and `@@unique([publishDomain, subdomain])` (alongside existing indexes).
- [ ] **Step 2:** `cd robocode-backend && npx prisma format && npx prisma validate` clean; `npx prisma db push --accept-data-loss` (the unique index on two new nullable columns is a safe additive change — confirm the push reports "in sync" and does NOT drop/reset any table; if it wants to reset data, STOP and report). `npx prisma generate`. `npm run typecheck` clean.
- [ ] **Step 3:** Commit backend `feat(schema): Project publish fields (subdomain, publishDomain, publishedAt)`.

---

### Task 2: `GoDaddyService` — dry-run-safe DNS client

**Files:** Create `robocode-backend/src/modules/publish/godaddy.service.ts`, `publish.module.ts`. Modify `robocode-backend/.env.example`.

**Interfaces:**
- Produces: `GoDaddyService.ensureWildcard(domain: string, target: {type:"A"|"CNAME"; value:string}): Promise<{dryRun:boolean; changed:boolean}>`, `upsertRecord(domain,type,name,value,ttl?)`, `deleteRecord(domain,type,name)`, `getRecord(domain,type,name)`, `isLive(): boolean`.

- [ ] **Step 1:** Implement the client. Read creds from env; `isLive()` = both key+secret present. Base URL from `GODADDY_OTE`. Each mutating method: if `!isLive()`, `this.logger.log("[godaddy dry-run] would PUT ...")` and return `{dryRun:true, changed:false}`. When live, call `fetch` with the `sso-key` auth header and the v1 records endpoints:
  - `getRecord` → `GET /v1/domains/{domain}/records/{type}/{name}`
  - `upsertRecord`/`ensureWildcard` → `PUT /v1/domains/{domain}/records/{type}/{name}` with body `[{data, ttl}]` (idempotent replace).
  - `deleteRecord` → `DELETE /v1/domains/{domain}/records/{type}/{name}`.
  `ensureWildcard(domain, target)`: name=`*`, type=target.type, data=target.value; getRecord first, PUT only if absent/different (idempotent); return `changed`. Handle non-2xx by throwing a clear error (caller catches so a DNS hiccup never fails publish — the wildcard is best-effort once).
- [ ] **Step 2:** `.env.example`: add `GODADDY_API_KEY=`, `GODADDY_API_SECRET=`, `GODADDY_OTE=`, `PUBLISH_DOMAINS=robocode.studio,robocode.africa`, `PUBLISH_TARGET_TYPE=A`, `PUBLISH_TARGET_VALUE=` (the ingress IP or CNAME) — all documented, empty by default (→ dry-run).
- [ ] **Step 3:** Smoke `src/modules/publish/godaddy.smoke.ts`: with creds unset, `ensureWildcard`/`upsertRecord`/`deleteRecord` return `{dryRun:true}` and make NO network call (assert by stubbing global fetch to throw and confirming it's never invoked). Run it.
- [ ] **Step 4:** typecheck; smoke passes. Commit backend `feat(publish): GoDaddy DNS client (dry-run-safe)`.

---

### Task 3: `PublishService` + validation + controller

**Files:** Create `robocode-backend/src/modules/publish/{publish.service.ts, publish.controller.ts, dto.ts, constants.ts}`. Modify `publish.module.ts`, `src/app.module.ts` (register), and the admin/moderation controller (takedown).

**Interfaces:**
- Consumes: `GoDaddyService` (Task 2), `PrismaService`, the tenant table (for africa collision check).
- Produces endpoints: `GET /publish/domains`, `GET /publish/check?domain=&subdomain=`, `POST /projects/:id/publish {domain,subdomain}`, `POST /projects/:id/unpublish`, `GET /published?domain=&subdomain=` (PUBLIC).

- [ ] **Step 1:** `constants.ts` — `PUBLISH_DOMAINS` (from env, default `["robocode.studio","robocode.africa"]`), `RESERVED_SUBDOMAINS` (Set), `PROFANITY_BLOCKLIST` (Set — a reasonable youth-safe list). `dto.ts` — Zod: `publishSchema { domain: z.enum-ish (must be ∈ PUBLISH_DOMAINS), subdomain: string }`.
- [ ] **Step 2:** `publish.service.ts`:
  - `listDomains()` → `PUBLISH_DOMAINS`.
  - `validateName(name)` → throws BadRequest with a specific message on format/reserved/profanity failure.
  - `checkAvailability(domain, name)` → `{available, reason?}`: validateName; ensure `domain ∈ PUBLISH_DOMAINS`; not taken by a published project `findUnique({publishDomain_subdomain})`; if `domain==="robocode.africa"`, also reject when `tenant.findUnique({slug:name})` exists (reason `"reserved-by-a-school"`).
  - `publish(user, projectId, domain, subdomain)` → load project, assert `ownerId===user.id` (else Forbidden); `checkAvailability` (throw if not); `$transaction` update `{subdomain, publishDomain:domain, publishedAt:new Date(), visibility:"public"}`; then `try { await goDaddy.ensureWildcard(domain, {type:PUBLISH_TARGET_TYPE, value:PUBLISH_TARGET_VALUE}) } catch { /* best-effort, logged */ }`; return `{ url:`https://${subdomain}.${domain}` }`. Rate-limit (mirror the run module's per-user limiter or a simple in-memory 5/min).
  - `unpublish(user, projectId)` → owner check; clear the three fields.
  - `resolvePublished(domain, subdomain)` → `findFirst({ where:{ publishDomain:domain, subdomain, visibility:"public" }, include:{ owner:{ select:{displayName, referralCode} }, codeFiles:true }})`; 404 if none; return `{ title, kind, boardType, diagram, files: codeFiles.map(f=>({name:f.name,content:f.content})), ownerDisplayName, ownerReferralCode, updatedAt }` — NO email/PII.
  - `takedown(domain, subdomain)` → clear fields + create a ModerationCase (match the existing model's required fields).
- [ ] **Step 3:** `publish.controller.ts` — the 5 routes (JWT via the app's global guard except `GET /published` which must be PUBLIC — check how other public routes opt out of the global JwtAuthGuard, e.g. a `@Public()` decorator or route-level `@SetMetadata`; the consent/shell routes are public — copy that pattern). Add takedown to the admin/moderation controller (admin/mod role). Register `PublishModule`.
- [ ] **Step 4:** Smoke `src/modules/publish/publish.smoke.ts` (throwaway users/projects, cleanup in finally): validateName rejects reserved/profanity/format; availability rejects a taken name and (on africa) an existing tenant slug; publish→resolvePublished round-trip returns the render payload with no email; unpublish frees the name; publish by a non-owner is Forbidden; publishing forces visibility public. Run it.
- [ ] **Step 5:** typecheck; smoke passes. Commit backend `feat(publish): publish/unpublish/resolve + availability + takedown`.

---

### Task 4: Frontend — studio-domain routing + `_site` published view

**Files:** Modify `robocode-frontend/src/proxy.ts`, `robocode-frontend/.env.example`. Create `robocode-frontend/src/app/_site/[domain]/[subdomain]/page.tsx` + a client renderer, `robocode-frontend/src/lib/publish/actions.ts`.

**Interfaces:** Consumes `GET /published?domain=&subdomain=`.

- [ ] **Step 1:** `.env.example` + read `NEXT_PUBLIC_PUBLISH_DOMAINS=robocode.studio,robocode.africa`. In `proxy.ts`: compute the studio domain(s) (any publish domain that is NOT the ROOT tenant domain — i.e. `robocode.studio`). For a host `<sub>.robocode.studio` (not apex, not `www`), `return NextResponse.rewrite(new URL(`/_site/robocode.studio/${sub}${url.pathname==="/"?"":url.pathname}`, req.url))`. Leave the `*.robocode.africa` tenant branch UNCHANGED. Ensure the `_site` path is exempt from the auth redirect. (Read the current Next docs for `rewrite` semantics in this version first.)
- [ ] **Step 2:** `actions.ts` — `getPublishedSite(domain, subdomain)` server fn → `GET /published?...`; returns the payload or null.
- [ ] **Step 3:** `_site/[domain]/[subdomain]/page.tsx` (server component, async params per this Next version): fetch the payload; if null → a friendly 404 ("This site isn't published"). Else render a chromeless page:
  - `kind==="robotics"` → reuse the existing **read-only Studio** component (the one used for shared read-only projects — find it, e.g. `readonly-studio-*`) hydrated with the diagram + files, read-only.
  - `kind==="coding"` with html/css/js files → an iframe `srcDoc` built from the files (reuse the Coding Studio's preview-doc builder if one exists).
  - other coding → a read-only code view + a Run button using the browser sandbox (`runInBrowser` from `src/lib/run`).
  - Footer CTA: "Built with RoboCode — make your own" → `${ROOT_ORIGIN}/join?ref=${ownerReferralCode ?? ""}`.
- [ ] **Step 4:** Verify: typecheck. Playwright `scripts/_repro-publish.mjs`: (needs a published project — the repro can call the backend publish endpoint as `ada` after logging in, publishing a project to `robocode.studio`, then) fetch `http://localhost:3000/_site/robocode.studio/<sub>` (the rewrite target directly, since we can't spoof a real subdomain host locally without /etc/hosts — hitting the rewrite target path is the gate) and assert the read-only render appears + the CTA link carries the ref. Assert; exit non-zero on failure.
- [ ] **Step 5:** Commit frontend `feat(publish): studio-domain routing + read-only published site view`.

---

### Task 5: Frontend — africa published fallback + Publish UI in Studio

**Files:** Modify the frontend's africa "unknown subdomain" handling (find where a `*.robocode.africa` subdomain with no tenant is handled — likely a layout/page that reads the tenant and shows a not-found/landing); create `robocode-frontend/src/components/studio/publish-dialog.tsx` + wire a "Publish" button into the Studio header; modify the project header to show the live URL.

- [ ] **Step 1: Africa fallback.** Where a `*.robocode.africa` subdomain resolves to no tenant, add: call `getPublishedSite("robocode.africa", sub)`; if a published project exists, render the `_site` view component (extract the renderer from Task 4 into a shared component so both routes reuse it). Tenant match still takes precedence (only fires when tenant is null). Verify tenant subdomains are unaffected.
- [ ] **Step 2: Publish UI.** `publish-dialog.tsx` (client): a domain `<select>` from `GET /publish/domains`, a subdomain input with debounced availability check (`GET /publish/check?domain=&subdomain=`, green/red), Publish → `POST /projects/:id/publish` → show the live `https://<sub>.<domain>` URL with copy + a share button (ref-tagged). If already published, show the URL + an Unpublish button (`POST /projects/:id/unpublish`). Add a "Publish" button to the Studio header (robotics + coding studios). Use the frontend-design-guidelines conventions.
- [ ] **Step 3:** Verify: typecheck; extend the repro to publish via the UI (or assert the dialog's availability check works). Commit frontend `feat(studio): Publish-to-web dialog + africa published fallback`.

---

### Task 6: Ops docs + one-time wildcard script

**Files:** Create `robocode-backend/docs/publish-ops.md` (or top-level `docs/`), `robocode-backend/scripts/ensure-wildcard.ts`.

- [ ] **Step 1:** `scripts/ensure-wildcard.ts` — loads env, instantiates `GoDaddyService`, calls `ensureWildcard("robocode.studio", {type: PUBLISH_TARGET_TYPE, value: PUBLISH_TARGET_VALUE})`; prints the result (dry-run or changed). Safe to run repeatedly.
- [ ] **Step 2:** `docs/publish-ops.md` — how to set `GODADDY_*` + `PUBLISH_TARGET_VALUE`, run `npx tsx scripts/ensure-wildcard.ts` (one-time, creates `*.robocode.studio`), the wildcard-TLS note (Let's Encrypt DNS-01 via GoDaddy / Caddy plugin), reverse-proxy Host routing, and that `*.robocode.africa` already exists so only studio needs a new record.
- [ ] **Step 3:** typecheck; commit backend `docs(publish): ops guide + ensure-wildcard script`.

---

### Task 7: Verification sweep

- [ ] Typecheck backend + frontend clean.
- [ ] `npx tsx robocode-backend/src/modules/publish/godaddy.smoke.ts` (dry-run, no network) and `publish.smoke.ts` (validation, availability incl. africa tenant collision, publish→resolve, unpublish, non-owner forbidden) pass.
- [ ] Dev servers up → `node robocode-frontend/scripts/_repro-publish.mjs`: publish a project to robocode.studio, load the `_site` route, assert read-only render + ref-tagged CTA.
- [ ] Confirm `GET /published` is PUBLIC (no auth) and leaks no PII; confirm a non-owner can't publish; confirm an africa name equal to an existing tenant slug is rejected.
- [ ] Leave GoDaddy in dry-run (no live DNS) — the one-time `*.robocode.studio` creation happens only when the user sets creds + confirms.
- [ ] Rename repro → `scripts/repro-publish.mjs`, commit.
