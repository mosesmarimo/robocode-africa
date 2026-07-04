# Referral Program + Viral Loops Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Ship a double-sided referral program, ref-tagged shares, project remix, and daily streaks across backend + web + mobile.

**Architecture:** New backend `referrals` module + `Referral` model + `User.referralCode`; rewards flow through the existing `PointsService` (idempotent ledger). `AuthService` captures `?ref=` at signup and settles rewards at every `active` transition. Web/mobile get an Invite hub, signup capture, remix button, and a streak flame.

**Tech Stack:** NestJS + Prisma (Postgres), Next.js 15 (read `robocode-frontend/node_modules/next/dist/docs/` before Next-specific changes), Flutter.

## Global Constraints

- Three repos under `/Users/marimo/Dev/robocode`; commit per repo. End every commit message with:

```
Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SxfjwdvQNhvtgpE2HSPeFf
```

- No test frameworks: typecheck each repo, backend smoke (`npx tsx <file>`), Playwright repro (dev :3000/:4000, login `ada@robocode.africa`/`password123`), `flutter analyze` mobile.
- Reward params (verbatim): referrer **+150** RoboPoints, referee **+50**, on referee `status="active"`, once per referee (`idemKey = "referral:<refereeId>"`), per-referrer cap **20 rewarded/day**, recruiter badges at **1/5/25** (Bronze/Silver/Gold). Remix: author **+10** per unique remixer. Streak milestones at **3/7/30** days.
- Referral is **platform-wide / cross-tenant** (a referee may join any tenant). Self-referral and duplicate referral are silently un-rewarded (audit-logged), never an error to the signup flow.
- All point awards go through `PointsService.awardPoints({ userId, delta, reason, refType, refId, idemKey })` — never write the ledger directly.

---

### Task 1: Schema — `Referral` model, `User.referralCode`, `Project.remixedFromId`

**Files:**
- Modify: `robocode-backend/prisma/schema.prisma`
- Migrate: `npx prisma db push` against the local DB (dev convention — the repo uses db push, not migrations; verify in package.json)

- [ ] **Step 1:** Add to `model User`: `referralCode String? @unique` and relations `referralsMade Referral[] @relation("Referrer")` and `referredBy Referral? @relation("Referee")`. Add to `model Project`: `remixedFromId String?` and self-relations `remixedFrom Project? @relation("Remix", fields: [remixedFromId], references: [id])` + `remixes Project[] @relation("Remix")`.

- [ ] **Step 2:** Add:

```prisma
model Referral {
  id         String   @id @default(cuid())
  referrerId String
  referrer   User     @relation("Referrer", fields: [referrerId], references: [id], onDelete: Cascade)
  refereeId  String   @unique
  referee    User     @relation("Referee", fields: [refereeId], references: [id], onDelete: Cascade)
  code       String
  status     String   @default("pending") // pending | rewarded
  rewardedAt DateTime?
  createdAt  DateTime @default(now())
  @@index([referrerId])
}
```

- [ ] **Step 3:** `cd robocode-backend && npx prisma db push && npx prisma generate`. Expect: schema in sync, client regenerated. `npm run typecheck` clean.
- [ ] **Step 4:** Commit backend `feat(schema): Referral model + User.referralCode + Project.remixedFromId`.

---

### Task 2: `referrals` service + controller (code, record, settle, stats, leaderboard)

**Files:**
- Create: `robocode-backend/src/modules/referrals/referrals.service.ts`, `referrals.controller.ts`, `referrals.module.ts`, `dto.ts`
- Modify: `robocode-backend/src/app.module.ts` (register), `robocode-backend/src/common/constants.ts` or `points.service.ts` (reason strings)
- Test: `robocode-backend/src/modules/referrals/smoke.ts`

**Interfaces:**
- Produces: `ReferralsService.ensureCode(userId): Promise<string>`, `recordSignup(refereeId, code): Promise<void>`, `settleIfActive(refereeId): Promise<void>`, `stats(user): Promise<{code,url,totalReferred,rewardedCount,pointsEarned,nextBadgeAt}>`, `leaderboard(scope): Promise<Row[]>`. Consumed by Tasks 3 (auth wiring) and 4 (web).

- [ ] **Step 1:** `ensureCode` — if `user.referralCode` set, return it; else generate `nanoid` 8-char from a no-ambiguous-chars alphabet (`23456789ABCDEFGHJKLMNPQRSTUVWXYZ`), set on user (retry on unique collision), return. URL = `${process.env.ROOT_DOMAIN ?? "https://robocode.africa"}/join?ref=${code}`.

- [ ] **Step 2:** `recordSignup(refereeId, code)` — resolve `referrer = user.findFirst({ where: { referralCode: code } })`; if none, or `referrer.id === refereeId`, or a `Referral{refereeId}` already exists → return silently (audit-log self/dupe via existing AuditLog if one exists; else skip). Else `referral.create({ referrerId, refereeId, code, status:"pending" })`.

- [ ] **Step 3:** `settleIfActive(refereeId)` — load `Referral{refereeId, status:"pending"}` (include referrer). If none, return. Re-check referee is now `active`. Daily-cap check: count `Referral{referrerId, status:"rewarded", rewardedAt >= startOfTodayUTC}` ≥ 20 → leave pending, return. Then:
  - `awardPoints({ userId: referrerId, delta:150, reason:"referral_referrer", refType:"referral", refId: referral.id, idemKey:\`referral:${refereeId}\` })`
  - `awardPoints({ userId: refereeId, delta:50, reason:"referral_welcome", refType:"referral", refId: referral.id, idemKey:\`referral-welcome:${refereeId}\` })`
  - `referral.update({ status:"rewarded", rewardedAt: now })`
  - recount `rewardedCount` for referrer; award badge via `PointsService.awardBadge(referrerId, code)` at 1/5/25 (`recruiter_bronze|silver|gold` — add these badge codes to the seed/badge catalog if the badge system requires pre-registered codes; check how `awardBadge` resolves codes and add the three rows if needed).
  - notify referrer (`NotifyService`) "🎉 <referee> joined with your invite — +150 RoboPoints!"

- [ ] **Step 4:** `stats` and `leaderboard` per the design. `GET /referrals/me`, `GET /referrals/leaderboard?scope=platform|tenant` in the controller (JWT-guarded). Register module.

- [ ] **Step 5:** `smoke.ts` (uses PrismaService against the dev DB; create throwaway users with a unique email prefix, clean up after): assert self-referral not recorded; pending→active settles once and is idempotent under a second `settleIfActive` call (ledger has one `referral:<id>` row); 21st same-day referral stays pending; badge granted at threshold; a referee in a different tenant still settles. Run `npx tsx src/modules/referrals/smoke.ts`.

- [ ] **Step 6:** typecheck clean, smoke passes. Commit backend `feat(referrals): service, controller, rewards, leaderboard, smoke`.

---

### Task 3: Wire referral capture + settlement into auth/approval/consent

**Files:**
- Modify: `robocode-backend/src/domain/validation.ts` (studentSignup schema gains optional `ref`), `robocode-backend/src/auth/auth.service.ts`, `robocode-backend/src/auth/auth.controller.ts` (pass `ref` through), and the approval/consent services that flip a user to `active`
- Modify: `robocode-backend/src/modules/referrals/referrals.module.ts` exports; import into AuthModule + the approval module

- [ ] **Step 1:** Add optional `ref: z.string().max(16).optional()` to the student-signup schema; thread it from controller → `studentSignup(data, tenant)`.

- [ ] **Step 2:** In `studentSignup`, after `user.create`: `if (data.ref) await this.referrals.recordSignup(user.id, data.ref)`. When `autoApprove` (user created `active`): `await this.referrals.settleIfActive(user.id)`.

- [ ] **Step 3:** Grep `status: "active"` / status transitions to `active` (admin approval, school approval, guardian consent). At each, after the update commits, call `await this.referrals.settleIfActive(userId)`. (Inject ReferralsService into those services; add to their modules' providers/imports.)

- [ ] **Step 4:** typecheck clean. Extend `referrals/smoke.ts` or add a quick check that a signup with `ref` on the platform tenant records a pending referral. Commit backend `feat(referrals): capture ref at signup, settle on every activation path`.

---

### Task 4: Web — Invite hub, signup capture, leaderboard

**Files:**
- Create: `robocode-frontend/src/app/app/invite/page.tsx`, `robocode-frontend/src/lib/referrals/actions.ts`, `robocode-frontend/src/app/join/page.tsx` (or a route that captures `?ref=` → cookie → redirects to signup)
- Modify: the signup page/form (read the ref cookie, show the "invited by" banner, include `ref` in the POST), dashboard + profile nav (link to Invite)

- [ ] **Step 1:** `actions.ts`: `getReferralStats()` → `GET /referrals/me`; `getReferralLeaderboard(scope)` → `GET /referrals/leaderboard`. Types mirror the backend.

- [ ] **Step 2:** `/join` route: read `?ref=`, set an httpOnly-not-required cookie `rc_ref` (max-age 30d), redirect to the student signup page. Signup page reads `rc_ref` (server component → pass to the client form), renders a subtle banner "Invited by a friend — you'll both earn RoboPoints", and includes `ref` in the signup action body. Clear the cookie after a successful signup.

- [ ] **Step 3:** `/app/invite` page: shows the code, a copy-able `…/join?ref=CODE` link, a native `navigator.share` button (client), live stats (referred / rewarded / points, progress bar to next recruiter badge), and the leaderboard table. Follow existing app-page styling (use the frontend-design guidelines skill for the layout).

- [ ] **Step 4:** Add an "Invite friends" entry to the dashboard quick-actions and the profile menu.

- [ ] **Step 5:** Playwright repro `scripts/_repro-referral.mjs`: log in as A, open `/app/invite`, read the code; in a fresh context hit `/join?ref=CODE`, sign up B (platform tenant, adult birth year so it auto-approves if the tenant policy allows — otherwise approve B via an admin API call as super@); re-open A's invite page and assert `referred`/`points` incremented. Assert; exit non-zero on failure.

- [ ] **Step 6:** typecheck clean, repro passes. Commit frontend `feat(invite): referral hub, signup capture, leaderboard`.

---

### Task 5: Web — ref-tagged shares + project remix

**Files:**
- Modify: the read-only share URL builder + share UI (append `?ref=<myCode>`), the shared read-only project page (add "Remix in Studio")
- Create: `robocode-frontend/src/lib/studio/remix-action.ts`
- Modify: `robocode-backend` — a `POST /projects/:id/remix` endpoint (or extend the projects controller/service) cloning a public project into the caller's account with `remixedFromId`, crediting + awarding the author (idempotent per remixer via ledger `idemKey = "remix:<sourceId>:<remixerId>"`)

- [ ] **Step 1 (backend):** `ProjectsService.remix(user, sourceId)` — load source; require `visibility` public (or shared); create a new project owned by `user` copying title ("<title> (remix)"), files, diagram, board, with `remixedFromId = sourceId`; `awardPoints` +10 to the author with the idempotent key above (so repeat remixes by the same user don't re-pay); notify the author. Return the new project id. Controller route JWT-guarded. Backend smoke: remix twice by the same user → author paid once.

- [ ] **Step 2 (frontend):** shared read-only project view gains a "Remix in Studio" button → `remix-action.ts` → `POST /projects/:id/remix` → redirect to the new project's Studio. Unauthenticated visitor → redirect to `/join?ref=<authorCode>` first (author's code travels on the shared link).

- [ ] **Step 3:** share/copy-link affordances append `?ref=<myCode>` to the shared URL (fetch the caller's code once via the invite stats action or embed server-side).

- [ ] **Step 4:** typecheck both repos; a Playwright check remixes a public project and asserts the new project exists + author credited. Commit backend then frontend.

---

### Task 6: Daily streak (backend touch + header flame)

**Files:**
- Create: `robocode-backend/src/common/streak.service.ts`
- Modify: `auth.service.ts` (login calls `streak.touch`), `points.service.ts` (awardPoints calls `streak.touch`), the `/account` or `/auth/me` response to include `streak`
- Modify: web header + mobile header to render the flame

- [ ] **Step 1:** `StreakService.touch(userId)` — read `user.prefs.streak = { count, lastActiveDate }` (Json). Compare `lastActiveDate` (YYYY-MM-DD, UTC) to today: same → no-op; yesterday → `count++`; else → `count=1`. Persist back into `prefs`. At new count 3/7/30, `awardPoints` a small milestone bonus (idemKey `streak:<userId>:<count>:<isoWeekOrDate>` — ensure a given milestone pays once per achievement; simplest: key on the date reached). Return `{ count }`. Guard against `touch` recursion via awardPoints (pass a flag or have awardPoints call a private no-award `bump`).

- [ ] **Step 2:** Call `touch` on login and expose `streak` in the user/me payload. Web + mobile header show a 🔥 with the count when `count >= 2`.

- [ ] **Step 3:** typecheck; a smoke asserts consecutive-day increment and same-day no-op (inject a fixed "today" for the test). Commit backend then frontend.

---

### Task 7: Mobile — invite screen, signup capture, remix, streak

**Files:**
- Create: `robocode-mobile/lib/screens/invite/invite_screen.dart`, `robocode-mobile/lib/api/referrals_api.dart`
- Modify: signup screen (capture a `ref` from a deep link / paste field, include in signup), a nav entry, shared-project view (Remix button in the WebView-aware flow), header flame

- [ ] **Step 1:** `referrals_api.dart` — `stats()` and `leaderboard()` calling `/referrals/me` and `/referrals/leaderboard` via the existing `ApiClient`.
- [ ] **Step 2:** `invite_screen.dart` — code, share link, `Share.share(...)` (share_plus — verify in pubspec; add if missing), stats, leaderboard. Nav entry from the dashboard/profile.
- [ ] **Step 3:** signup screen: optional "Have an invite code?" field (and, if deep-linking is wired, read it from the launch URI); include `ref` in the signup call.
- [ ] **Step 4:** shared project view: "Remix in Studio" hitting `/projects/:id/remix` then opening the new project; header 🔥 from the me payload.
- [ ] **Step 5:** `flutter analyze` clean. Commit mobile `feat(invite): referral screen, signup capture, remix, streak flame`.

---

### Task 8: Verification sweep

- [ ] typecheck backend + frontend; `flutter analyze` mobile — all clean.
- [ ] `npx tsx robocode-backend/src/modules/referrals/smoke.ts` — self-referral rejected, reward-once idempotent, daily cap, badge thresholds, cross-tenant OK, remix pays author once, streak increments.
- [ ] Dev servers up → `node robocode-frontend/scripts/_repro-referral.mjs` — B joins via A's link, activates, A's stats + both ledgers credited.
- [ ] Seed the three recruiter badge codes if the badge catalog needs pre-registration (`recruiter_bronze/silver/gold`); confirm they render.
- [ ] Rename repro → `scripts/repro-referral.mjs`, commit as a regression harness.
