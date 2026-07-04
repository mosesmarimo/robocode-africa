# Referral Program + Viral Growth Loops — Design

**Autonomous session note:** the user asked for "referral features" plus "innovative features to make this project go viral." The user is not watching live, so product parameters below are chosen as sensible defaults and called out explicitly so they can be tuned later.

## Goals

Turn RoboCode's existing assets (RoboPoints, badges, social graph, shareable read-only projects) into growth loops. Two loops ship here:

1. **Direct referral loop** — every user has an invite link; a friend who joins *and activates* rewards both sides; progress is visible and competitive.
2. **Content loop** — every shared project/badge link carries the sharer's referral code, and any visitor can **remix** a shared public project into their own Studio (attribution back to the author). Sharing becomes inviting; remixing creates new sharers.

Retention underpins both, so a lightweight **daily streak** ships to keep invited users coming back (a referral that churns in a day isn't viral).

## Decisions (defaults — tunable)

| Parameter | Default | Why |
|---|---|---|
| Referral code | 8-char base32 (`nanoid`, no ambiguous chars), one per user, stable | Shareable, hard to guess, stable across renames |
| Reward trigger | Referee reaches `status = "active"` (approved + consent if <13) | Prevents sign-up farming; rewards real users |
| Reward (both sides) | Referrer +150 RoboPoints, referee +50 welcome bonus | Double-sided is the proven pattern; referrer weighted higher |
| Idempotency | One reward per referred user, ever (`idemKey = referral:<refereeId>`) | Uses the ledger's existing `idemKey @unique` |
| Anti-abuse | Can't refer self (same email/user); referrer must be `active`; per-referrer cap 20 rewarded referrals/day; referee tenant may differ (cross-tenant allowed) | Matches the platform-wide social-graph decision |
| Recruiter badges | 1 / 5 / 25 rewarded referrals → Bronze / Silver / Gold Recruiter | Reuses the existing badge system |
| Attribution window | Ref code captured at signup is permanent on the referee's Referral row | Simple, auditable |

## Architecture

### Backend (`robocode-backend`) — new `referrals` module + schema

**Schema (`prisma/schema.prisma`):**
- `User.referralCode String? @unique` (backfilled lazily / at signup).
- New `model Referral { id; referrerId; refereeId @unique; code; status ("pending"|"rewarded"); rewardedAt; createdAt; @@index([referrerId]) }`. `refereeId @unique` enforces "a user can only be referred once."

**`referrals.service.ts`:**
- `myCode(user)` — returns/creates the caller's `referralCode` and the share URL (`${ROOT_DOMAIN}/join?ref=CODE`).
- `recordSignup(refereeId, code)` — called from `AuthService` right after a user is created with a captured `?ref=`. Resolves `code → referrer`; rejects self-referral and unknown codes silently (no error to the signup flow). Creates a `Referral{status:"pending"}`.
- `settleIfActive(refereeId)` — called whenever a user transitions to `active` (signup auto-approve, admin/school approval, guardian consent). If a `pending` Referral exists and daily cap not exceeded: award both sides via `PointsService.awardPoints` (idempotent), flip to `rewarded`, award recruiter badges by threshold, notify the referrer.
- `stats(user)` — `{ code, url, totalReferred, rewardedCount, pointsEarned, nextBadgeAt }`.
- `leaderboard(scope)` — top referrers by `rewardedCount` (platform-wide and, optionally, within-tenant); returns display-safe rows.

**`referrals.controller.ts`** (JWT-guarded): `GET /referrals/me` (stats+code), `GET /referrals/leaderboard`.

**Wiring:** `AuthService.studentSignup` accepts an optional `ref` (from the signup DTO), calls `recordSignup` after create, and calls `settleIfActive` when it auto-approves. The three other activation points — admin approval, school approval, guardian consent — each call `settleIfActive(userId)`. (Grep for `status: "active"` transitions; there are 3–4.)

### Content loop — share links carry ref + project remix

- **Ref-tagged shares:** the existing read-only share URL builder and the Studio "Open in Studio" / share affordances append `?ref=<myCode>` (web + mobile). Anyone landing on a shared project sees a "Join RoboCode" CTA pre-filled with the code.
- **Remix:** a shared *public* project's read-only view gets a **"Remix in Studio"** button → server action `remixProject(sourceId)` clones the project (files + diagram + board) into the current user's account with `remixedFromId` set and a visible "Remixed from @author" credit; the author gets a notification and +10 RoboPoints per unique remixer (idempotent). New schema field `Project.remixedFromId String?`. Unauthenticated visitors are routed to `/join?ref=<author code>` first, so remix is itself an invite.

### Retention — daily streak

- `User.prefs` already exists (Json) — store `{ streak: { count, lastActiveDate } }` there (no migration). A `StreakService.touch(user)` runs on login and on any RoboPoint-earning action: if `lastActiveDate` is yesterday → `count++`; if today → no-op; else reset to 1. Milestone RoboPoints at 3/7/30 days. Surfaced as a flame badge in the header (web + mobile).

### Frontend (`robocode-frontend`) + Mobile (`robocode-mobile`)

- **Invite hub** (`/app/invite` web; a "Invite friends" screen mobile): the user's code + copy-able link + native share sheet, live stats (referred / rewarded / points), progress to next recruiter badge, and the referral leaderboard. Reachable from the dashboard and profile.
- **Signup capture:** `/join?ref=CODE` (and any page reading `?ref=`) persists the code (cookie/localStorage; mobile: in-memory + deep link) and pre-fills it into the signup POST. A subtle "Invited by @name — you'll both earn RoboPoints" banner on the signup form.
- **Remix button** on shared read-only project pages (web + mobile WebView-aware).
- **Streak flame** in the app header.

## Error handling & fairness

- Unknown/absent ref code → normal signup, no error.
- Self-referral, duplicate referral, or over-cap → silently not rewarded (logged, visible to admins in the audit log).
- All rewards flow through `PointsService.awardPoints` with `idemKey`, so retries and concurrent activations can't double-pay.
- Referral counts shown publicly use display names/avatars already public in the social graph; no email exposure.

## Testing

No test frameworks (convention): backend `src/modules/referrals/smoke.ts` (self-referral rejected; reward-once idempotency under double activation; daily cap; badge thresholds; cross-tenant referral allowed). Frontend Playwright repro: sign up B via A's link, activate B, assert A's stats increment and both ledgers credited. Typecheck all repos; `flutter analyze` mobile.

## Out of scope (fast-follows, noted not built)

Email-invite sending with tracked opens, referral tiers beyond Gold, fraud ML, paid rewards/withdrawals, A/B testing reward amounts, deep-link attribution on app-store installs.
