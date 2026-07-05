# Learning Tracks + Checkpoint Certificates — Design (Iteration 4)

**Date:** 2026-07-05 · **Backlog items:** #4 curated finishable challenge tracks (P0) + #9 checkpoint certificates (P1) · **Sources:** LeetCode study plans, Codecademy skill paths, freeCodeCamp checkpoint certifications.

## Why / reality check

The backlog framed #4 as "pure metadata over the existing challenge bank" — but the bank has only **15 Tasks (one per course, all beginner)**, so challenge-only tracks would be trivial. Meanwhile RoboCode has a rich course bank (22 courses live: 12 language courses, 12 tutorial courses, robotics deep-dives, AI courses). The adaptation that delivers the actual learner value ("what next?" + a finishable checklist + a bankable credential):

**Learning Tracks** — curated, ordered roadmaps whose items are **existing courses and/or challenges** — with per-item progress derived from data RoboCode already records, and a **shareable certificate** auto-issued on track completion. No new languages, no new content required (frozen-language-set constraint respected; tracks only reference existing slugs). Challenge-only tracks become possible later once the bank grows — the model supports them from day one.

## Data model (additive, Prisma)

```prisma
model LearningTrack {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String
  track       String   @default("coding")   // "coding" | "robotics" | "ai" — same vocabulary as Task/Course
  language    String?                        // one of the frozen 12, for per-language paths
  level       String   @default("beginner")
  icon        String?                        // emoji
  order       Int      @default(0)
  published   Boolean  @default(true)
  items       LearningTrackItem[]
  certificates Certificate[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model LearningTrackItem {
  id        String  @id @default(cuid())
  trackId   String
  track     LearningTrack @relation(...)
  order     Int
  // Exactly ONE of the two refs is set (app-validated; seed guarantees it):
  courseId  String?
  taskId    String?
  @@unique([trackId, order])
  @@unique([trackId, courseId])
  @@unique([trackId, taskId])
}

model Certificate {
  id       String   @id @default(cuid())
  code     String   @unique            // "RC-" + 10 crypto-random base32 chars — unguessable verify code
  userId   String
  kind     String   @default("track")  // future: "course"
  trackId  String?
  title    String                       // snapshot of track title at issuance
  issuedAt DateTime @default(now())
  @@unique([userId, kind, trackId])
}
```

**Progress is derived, not stored.** An item is "done" when the idempotent record RoboCode already writes exists:
- task item → `RoboPointLedger.idemKey = task:challenge:<taskId>:<userId>` (written by `submitSolution` on pass),
- course item → `task:course-complete:<courseId>:<userId>` (written by `learn.service` at 100%).

Deriving avoids a progress-sync table AND gives instant retroactive credit — a learner who already finished the Python course starts the Python Path partially complete. (Tracks are ≤ ~10 items; one `findMany` on idemKeys per view is cheap.)

## Completion → certificate + XP

`TracksService.ensureTrackCompletion(userId, trackId)` — idempotent:
1. All items done? If not, return.
2. `gamification.completeTask({ type: "track-complete", refId: trackId, xpOverride via new GAMIFICATION_XP["track-complete"] = 150, language, track })` — idempotent on the ledger idemKey; feeds streak/badges/leaderboards like every other completion.
3. Upsert `Certificate` (unique `[userId, kind, trackId]`), notify (`Notification` — mirror the level-up pattern): "🎓 Certificate earned: Python Path".

Triggered from three places:
- after a passing challenge submission (`competitions.submitSolution` → tracks containing that `taskId`),
- after course-complete fires (`learn.service` → tracks containing that `courseId`),
- lazily on `GET /tracks` (backfill: users who completed everything before the feature shipped).

`"track-complete"` joins `TASK_TYPES` but is **server-emitted only** — the client-facing `POST /learn/complete-task` validation (interactive-block resolver, 454ee1d) already rejects anything that isn't a real tryit/exercise block, so no new abuse surface.

## API (new `tracks` module, mirroring the gallery/publish patterns)

- `GET /tracks` (JWT + `@RequireActive`) → published tracks ordered, each with `{slug,title,description,track,language,level,icon,itemCount,doneCount,certificate?}`; runs the lazy completion check.
- `GET /tracks/:slug` → detail: ordered items `{type:"course"|"challenge", slug, title, language, difficulty|level, done}`, `nextUp` (first not-done item), progress, certificate if earned.
- `GET /certificates` (JWT) → caller's certificates.
- `@Public() GET /certificates/verify/:code` → `{valid, title, trackSlug, holder, issuedAt}` — **PII-free**: `holder` is first name + last initial ("Ada L."), or "RoboCode Learner" if unset. No email, no tenant, no avatar (youth safety; same discipline as `resolvePublished`).

No CRUD endpoints — tracks are seed-defined like courses (YAGNI).

## Seeding

New `prisma/content/tracks.ts` exporting track definitions that reference **existing** course/task slugs; `seed-content.ts` upserts `LearningTrack` by slug, resolves slugs → ids (skip-and-warn on a missing slug so a partial prod library never crashes the seed), and syncs items (delete-and-recreate items per track — items carry no user data). Both `seed.ts` and `seed-content.ts` seed them. Initial curated set (~6, all from live content):

1. **Python Path** (coding/python): tutorial-python → lang-python course → python challenge.
2. **JavaScript Path** (coding/javascript): tutorial-javascript → lang-javascript → js challenge.
3. **Web Foundations** (coding): tutorial-html → lang-html → tutorial-css → lang-css.
4. **Robotics Starter** (robotics): intro-robotics → coding-arduino → lang-arduino → arduino challenge.
5. **Robotics Explorer** (robotics): robo-esp32 → robo-pico → robo-sensors (+ their challenges).
6. **AI Explorer** (ai): ai-junior-appreciation → ai-models → ai-foundations.

(Exact slugs confirmed against `prisma/content/*` at plan time.)

## Web (Next.js)

- **`/app/tracks`** — index grouped by coding/robotics/ai: card = icon, title, description, progress bar `doneCount/itemCount`, cert ribbon when earned, "Continue" → next-up item. Nav entry added next to Challenges.
- **`/app/tracks/[slug]`** — the roadmap: numbered checklist (✓ done / ▶ next / locked-looking-but-clickable rest — soft sequencing, never hard-block, w3schools lesson), each item linking to `/app/learn/[slug]` or `/app/challenges/[slug]`; header progress; certificate CTA when complete.
- **`/cert/[code]`** — **public, chromeless** certificate page (print-friendly = the "download PDF" path; `apiGetPublic`): certificate art (brand colors, learner display name, track title, date, verify code) + "Verified by RoboCode ✓". One URL serves owner-view, share, and third-party verification.
- Challenge pass celebration (`challenge-submit.tsx`): if the task belongs to track(s), a one-line nudge "Python Path: 2/3 done — next: …".
- Profile/badges page links to "My certificates" (list → `/cert/[code]`).

## Mobile (Flutter)

- **Tracks screen** (list + detail checklist; items open course/challenge screens — challenge solving stays web-only as today).
- **Certificates** in profile: list + open public URL / share sheet (reuse the existing share pattern from referrals).
- Thin typed API wrappers (`tracks_api.dart`, certificates in profile API) over `ApiClient`.

## Youth safety / Africa fit

- Public verify payload is PII-free (first name + last initial only, no photo/school/email); cert codes are crypto-random (unguessable, no enumeration).
- Everything is text + one SVG/CSS certificate — light, cacheable, offline-friendly; no new heavy deps (no server-side PDF generation — browser print handles it).
- Soft sequencing only — a track never hard-blocks content a learner could otherwise reach.

## Testing (repo convention: no test frameworks)

- Typecheck all three repos.
- Backend smoke `src/modules/tracks/tracks.smoke.ts` (npx tsx, mirrors `publish.smoke.ts`): derived progress correctness; completion issues cert + XP exactly once (idempotent under double-fire); verify endpoint returns PII-free payload and 404s an unknown code; lazy backfill issues on GET /tracks.
- Playwright spot-check web flows (dev :3000/:4000, ada@robocode.africa/password123); mobile `flutter analyze`.

## Explicit non-goals (this iteration)

Challenge-bank expansion (content follow-up), course-level certificates (`kind:"course"` reserved), admin track CRUD, PDF rendering service, badges per track.
