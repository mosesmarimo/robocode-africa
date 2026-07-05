# Learning Tracks + Checkpoint Certificates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Curated, finishable learning tracks (ordered roadmaps over existing courses + challenges, derived per-item progress) with a shareable, publicly-verifiable certificate auto-issued on track completion.

**Architecture:** New backend `tracks` module (`LearningTrack`/`LearningTrackItem`/`Certificate` Prisma models; progress DERIVED from existing pass records, never stored; `ensureTrackCompletion` issues cert + `track-complete` XP idempotently, fired from the challenge-pass hook, the course-complete hook, and lazily on list). Web: `/app/tracks` index + `/app/tracks/[slug]` roadmap + public chromeless `/cert/[code]` + post-pass track nudge. Mobile: tracks screens + certificates in profile with share.

**Tech Stack:** NestJS + Prisma (robocode-backend), Next.js App Router (robocode-frontend — read `node_modules/next/dist/docs/` before router work), Flutter + go_router (robocode-mobile). Spec: `docs/superpowers/specs/2026-07-05-learning-tracks-certificates-design.md`.

## Global Constraints

- Three repos under `/Users/marimo/Dev/robocode`; commit per repo. End every commit message with:

```
Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01DdP9Xvr3ZZQW49qJA4mYhM
```

- NO test frameworks: `npm run typecheck` (backend), `pnpm typecheck` (frontend), `flutter analyze` (mobile). Backend behavior gate = smoke script via `npx tsx`. Web spot-check = Playwright against dev (`:3000` web / `:4000` api, login `ada@robocode.africa` / `password123`).
- **Frozen language set** — tracks only REFERENCE existing course/task slugs; no new languages, no new courses/challenges.
- **Prod migrations are required** (deploy runs `prisma migrate deploy`; `db push` is dev-only). Every schema change lands as a SQL file under `prisma/migrations/<timestamp>_<name>/migration.sql`.
- Youth safety: the public verify payload is PII-free — display name is first name + last initial only; no email/tenant/avatar. Cert codes are crypto-random (unguessable).
- Track/cert reads carry `@RequireActive()`; verification endpoint is `@Public()`.
- A tracks-module failure must NEVER fail a submission or lesson completion — hook methods catch internally and log.

---

### Task 1: Backend — schema, migration, constants

**Files:**
- Modify: `robocode-backend/prisma/schema.prisma` (new models + back-relations on `User`, `Course`, `Task`)
- Modify: `robocode-backend/src/domain/constants.ts` (`TASK_TYPES`, `GAMIFICATION_XP`)
- Create: `robocode-backend/prisma/migrations/20260705100000_learning_tracks_certificates/migration.sql`

**Interfaces (Produces):** Prisma models `LearningTrack`, `LearningTrackItem`, `Certificate`; task type `"track-complete"` with `GAMIFICATION_XP["track-complete"] === 150`.

- [ ] **Step 1:** Add to `schema.prisma` (verbatim; place after `SolutionLike`):

```prisma
model LearningTrack {
  id           String              @id @default(cuid())
  slug         String              @unique
  title        String
  description  String
  track        String              @default("coding") // "coding" | "robotics" | "ai" — same vocabulary as Task/Course
  language     String? // one of the frozen 12, for per-language paths
  level        String              @default("beginner")
  icon         String? // emoji shown on cards
  order        Int                 @default(0)
  published    Boolean             @default(true)
  items        LearningTrackItem[]
  certificates Certificate[]
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt
}

// Exactly ONE of courseId/taskId is set per item (app-validated; seed guarantees it).
model LearningTrackItem {
  id       String        @id @default(cuid())
  trackId  String
  track    LearningTrack @relation(fields: [trackId], references: [id], onDelete: Cascade)
  order    Int
  courseId String?
  course   Course?       @relation(fields: [courseId], references: [id], onDelete: Cascade)
  taskId   String?
  task     Task?         @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@unique([trackId, order])
  @@unique([trackId, courseId])
  @@unique([trackId, taskId])
  @@index([courseId])
  @@index([taskId])
}

model Certificate {
  id       String         @id @default(cuid())
  code     String         @unique // "RC-XXXXX-XXXXX" crypto-random verify code
  userId   String
  user     User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  kind     String         @default("track") // future: "course"
  trackId  String?
  track    LearningTrack? @relation(fields: [trackId], references: [id], onDelete: SetNull)
  title    String // snapshot of track title at issuance
  issuedAt DateTime       @default(now())

  @@unique([userId, kind, trackId])
  @@index([userId])
}
```

Add back-relations: `certificates Certificate[]` on `User`; `trackItems LearningTrackItem[]` on both `Course` and `Task`.

- [ ] **Step 2:** `src/domain/constants.ts`: append `"track-complete"` to `TASK_TYPES` (after `"course-complete"`) and `"track-complete": 150` to `GAMIFICATION_XP`. Note in a comment: server-emitted only — the client `POST /learn/complete-task` path only resolves tryit/exercise blocks, so this type is unreachable from clients.
- [ ] **Step 3:** `npx prisma format && npx prisma validate`. Generate the migration BEFORE syncing the dev DB (diff = live dev DB → new schema, so it contains exactly the additive DDL):

```bash
mkdir -p prisma/migrations/20260705100000_learning_tracks_certificates
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/20260705100000_learning_tracks_certificates/migration.sql
```

Inspect the SQL: CREATE TABLE ×3 + indexes + FKs only (no DROP of existing tables — if any appear, STOP and report). Then `npx prisma db push` (dev sync; expect "already in sync"-equivalent after the diff was captured — push applies the same DDL) and `npx prisma generate`.
- [ ] **Step 4:** `npm run typecheck` clean.
- [ ] **Step 5:** Commit backend: `feat(schema): LearningTrack/LearningTrackItem/Certificate + track-complete XP tier`.

---

### Task 2: Backend — tracks module (service, controllers, hooks)

**Files:**
- Create: `robocode-backend/src/modules/tracks/tracks.service.ts`, `tracks.controller.ts`, `certificates.controller.ts`, `tracks.module.ts`
- Modify: `robocode-backend/src/app.module.ts` (register `TracksModule`)
- Modify: `robocode-backend/src/modules/competitions/competitions.service.ts` (+ its module) — challenge-pass hook
- Modify: `robocode-backend/src/modules/learn/learn.service.ts` (+ its module) — course-complete hook

**Interfaces:**
- Consumes: `GamificationService.completeTask` (`src/common/gamification.service.ts:40`), `NotifyService.notify` (mirror the level-up call in `points.service.ts:83`), Prisma models from Task 1.
- Produces (exact response shapes later tasks rely on):

```ts
// GET /tracks            (JWT + RequireActive)
{ tracks: Array<{ slug: string; title: string; description: string; track: string;
  language: string | null; level: string; icon: string | null;
  itemCount: number; doneCount: number;
  certificate: { code: string; issuedAt: string } | null }> }

// GET /tracks/for-task/:taskId   (JWT + RequireActive) — the post-pass nudge
{ tracks: Array<{ slug: string; title: string; itemCount: number; doneCount: number }> }

// GET /tracks/:slug      (JWT + RequireActive; 404 unknown/unpublished)
{ slug, title, description, track, language, level, icon,
  progress: { done: number; total: number; percent: number },
  certificate: { code: string; issuedAt: string } | null,
  items: Array<{ type: "course" | "challenge"; slug: string; title: string;
    language: string | null; level?: string; difficulty?: string;
    done: boolean; current: boolean }> }   // current = first not-done item

// GET /certificates      (JWT + RequireActive)
{ certificates: Array<{ code: string; title: string; kind: string;
  trackSlug: string | null; issuedAt: string }> }

// GET /certificates/verify/:code  (@Public; 404 unknown)
{ valid: true; code: string; title: string; holder: string;
  trackSlug: string | null; issuedAt: string }
```

- [ ] **Step 1:** `TracksService`. Core pieces (verbatim helpers):

```ts
import { randomBytes } from "crypto";
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I/L/O/0/1 look-alikes
function generateCertCode(): string {
  const bytes = randomBytes(10);
  let out = "";
  for (let i = 0; i < 10; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return `RC-${out.slice(0, 5)}-${out.slice(5)}`;
}
/** PII-safe display name for the PUBLIC verify payload: "Ada Lovelace" -> "Ada L." */
function holderName(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "RoboCode Learner";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}
```

Done-detection (belt + braces — covers passes that predate gamification):
- Load track items (include `course: { select: { slug, title, language, level } }`, `task: { select: { slug, title, language, difficulty } }`).
- Task item done ⇔ a `Submission` exists (`userId`, `taskId`, `status: "passed"`) — one `findMany(distinct taskId, where taskId in [...])`.
- Course item done ⇔ `Enrollment.completedAt != null` OR ledger `idemKey = task:course-complete:<courseId>:<userId>` exists.

Methods: `listTracks(userId)` (published, ordered; per track compute doneCount; for each 100% track call `ensureTrackCompletion` — the lazy backfill — then attach the cert), `getTrack(userId, slug)` (NotFound on unknown/unpublished; item shape above), `getTracksForTask(userId, taskId)` (published tracks whose items include taskId, with progress), `myCertificates(userId)`, `verifyCertificate(code)` (NotFound on miss; `holder: holderName(user.name)`), and:

```ts
/** Idempotent: awards track-complete XP + issues the certificate + notifies, exactly once. */
async ensureTrackCompletion(userId: string, trackId: string): Promise<void> {
  // recompute done; return unless items.length > 0 && all done
  await this.gamification.completeTask({ userId, type: "track-complete", refId: trackId,
    language: track.language,
    track: track.track === "coding" || track.track === "robotics" ? track.track : undefined });
  const existing = await this.prisma.certificate.findFirst({ where: { userId, kind: "track", trackId } });
  if (existing) return;
  try {
    await this.prisma.certificate.create({ data: { code: generateCertCode(), userId, kind: "track", trackId, title: track.title } });
  } catch (err) { if (!isUniqueConstraintError(err)) throw err; return; } // raced — already issued
  await this.notifier.notify({ userId, type: "certificate",
    title: `🎓 Certificate earned: ${track.title}`,
    body: `You completed every step of ${track.title}. View and share your certificate from your Badges page.` });
}
/** Hooks — must never throw into the caller's flow. */
async onChallengePassed(userId: string, taskId: string): Promise<void> { try { /* published tracks containing taskId -> ensureTrackCompletion each */ } catch (e) { this.logger.warn(`tracks hook failed: ${e}`); } }
async onCourseCompleted(userId: string, courseId: string): Promise<void> { /* same pattern for courseId */ }
```

(`isUniqueConstraintError` — reuse the helper points.service.ts uses; import or replicate its P2002 check.)
- [ ] **Step 2:** Controllers, mirroring `competitions.controller.ts` / `publish.controller.ts` conventions: `TracksController` (`@Controller("tracks")`): `@Get() @RequireActive()` list, `@Get("for-task/:taskId") @RequireActive()`, `@Get(":slug") @RequireActive()` (declare `for-task` BEFORE `:slug`). `CertificatesController` (`@Controller("certificates")`): `@Get() @RequireActive()` mine, `@Public() @Get("verify/:code")` verify. `TracksModule` provides+exports `TracksService`; register in `app.module.ts`.
- [ ] **Step 3:** Hooks. `competitions.service.ts` — inside the existing `if (result.passed) { ... }` block of `submitSolution` (~line 474), AFTER `completeTask`: `await this.tracks.onChallengePassed(user.id, taskId);`. `learn.service.ts` — inside the `if (percent >= 100)` block (~line 316), after `completeTask`: `await this.tracks.onCourseCompleted(user.id, courseId);`. Import `TracksModule` into both feature modules.
- [ ] **Step 4:** `npm run typecheck` clean.
- [ ] **Step 5:** Commit backend: `feat(tracks): learning tracks + certificates module (derived progress, idempotent issuance, public verify)`.

---

### Task 3: Backend — seed data + smoke gate

**Files:**
- Create: `robocode-backend/prisma/content/tracks.ts`, `robocode-backend/prisma/content/sync-tracks.ts`
- Modify: `robocode-backend/prisma/seed-content.ts`, `robocode-backend/prisma/seed.ts` (both call the shared sync)
- Create: `robocode-backend/src/modules/tracks/tracks.smoke.ts`

**Interfaces:**
- Produces: `TRACK_DEFS: TrackDef[]` where `type TrackDef = { slug: string; title: string; description: string; track: "coding" | "robotics" | "ai"; language?: string; level: string; icon: string; order: number; items: Array<{ course?: string; task?: string }> }`; `syncLearningTracks(prisma: PrismaClient): Promise<void>`.

- [ ] **Step 1:** `prisma/content/tracks.ts` — the 6 curated tracks (all slugs verified to exist in `prisma/content/*`):

| order | slug | title | track/lang | items (in order) |
|---|---|---|---|---|
| 1 | `python-path` | Python Path 🐍 | coding/python | course `tutorial-python` → course `lang-python` → task `challenge-python` |
| 2 | `javascript-path` | JavaScript Path | coding/javascript | course `tutorial-javascript` → course `lang-javascript` → task `challenge-javascript` |
| 3 | `web-foundations` | Web Foundations | coding | courses `tutorial-html` → `lang-html` → `tutorial-css` → `lang-css` |
| 4 | `robotics-starter` | Robotics Starter | robotics | courses `intro-robotics` → `coding-arduino` → `lang-arduino` → task `challenge-arduino` |
| 5 | `robotics-explorer` | Robotics Explorer | robotics | `robo-esp32` → task `challenge-esp32` → `robo-pico` → task `challenge-pico` → `robo-sensors` → task `challenge-sensors` |
| 6 | `ai-explorer` | AI Explorer | ai | courses `ai-junior-appreciation` → `ai-models` → `ai-foundations` |

Write real one-sentence descriptions and emoji icons (🐍 🟨 🌐 🤖 ⚡ 🧠); `level: "beginner"` except robotics-explorer/ai-explorer `"intermediate"`.
- [ ] **Step 2:** `prisma/content/sync-tracks.ts` — `syncLearningTracks(prisma)`: for each def, resolve item slugs (`course.findUnique({ where: { slug } })` / `task.findUnique`); **skip-and-warn** (console.warn) any item whose slug is missing (a partial prod library must never crash the seed); upsert `LearningTrack` by slug (update title/description/track/language/level/icon/order/published); then `learningTrackItem.deleteMany({ where: { trackId } })` + `createMany` with sequential `order` (items carry no user data — delete-and-recreate is safe; certificates reference the TRACK, not items). Call it at the end of BOTH `seed-content.ts` and `seed.ts`.
- [ ] **Step 3:** Run `npx tsx prisma/seed-content.ts` against dev — expect "6 tracks synced" style output, zero warnings.
- [ ] **Step 4:** `src/modules/tracks/tracks.smoke.ts` (mirror `publish.smoke.ts` bootstrap style; run `npx tsx src/modules/tracks/tracks.smoke.ts`). Assertions:
  - (a) seeded user with no completions → `listTracks` shows `doneCount 0`, no certificate;
  - (b) manufacture completion for the smallest track (create passed `Submission` rows / ledger `course-complete` idemKeys + `Enrollment.completedAt` for every item) → `listTracks` lazily issues: certificate exists, ledger has `task:track-complete:<trackId>:<userId>` with delta 150;
  - (c) call `ensureTrackCompletion` again → still exactly ONE certificate + ONE track-complete ledger row (idempotent);
  - (d) `verifyCertificate(code)` returns `holder` matching first-name + last-initial and NO email/id fields; unknown code → NotFound;
  - (e) `getTrack` marks `current` on the first not-done item;
  - (f) cleanup: delete everything the smoke created (cert, ledger rows, submissions, enrollments, its throwaway user).
- [ ] **Step 5:** Smoke passes; `npm run typecheck` clean.
- [ ] **Step 6:** Commit backend: `feat(tracks): seed 6 curated tracks + smoke (derived progress, idempotent cert issuance)`.

---

### Task 4: Web — tracks index + roadmap + nav

**Files:**
- Create: `robocode-frontend/src/lib/tracks/api.ts`, `robocode-frontend/src/app/app/tracks/page.tsx`, `robocode-frontend/src/app/app/tracks/[slug]/page.tsx`
- Modify: `robocode-frontend/src/lib/nav.ts`

**Interfaces:**
- Consumes: `apiGet` from `src/lib/api/client.ts`; response shapes from Task 2 (copy the TS types into `src/lib/tracks/api.ts` as `TrackSummary`, `TrackDetail`, `TrackDetailItem`, `MyCertificate`).
- Produces: `getTracks(): Promise<TrackSummary[]>`, `getTrack(slug): Promise<TrackDetail | null>` (server helpers used by both pages; `getTrack` returns null on 404 via `apiGetOrNull`).

- [ ] **Step 1:** `src/lib/tracks/api.ts` — types + the two server helpers hitting `/tracks` and `/tracks/${slug}`.
- [ ] **Step 2:** `/app/tracks` page (Server Component; match the look of `badges/page.tsx` / `learn/page.tsx` — same card, heading, and empty-state idioms): sections "Robotics" / "Coding" / "AI" (group by `track`, ordered), card shows icon, title, description, `doneCount/itemCount` progress bar, language chip when set, 🎓 ribbon + "View certificate" link (`/cert/${certificate.code}`) when earned, "Continue" button otherwise (→ detail page).
- [ ] **Step 3:** `/app/tracks/[slug]` page: header (icon/title/description/progress bar + percent), numbered vertical checklist — each item row: ✓ (done, muted) / ▶ highlighted (`current`) / number (rest); item links to `/app/learn/${slug}` for courses, `/app/challenges/${slug}` for challenges; difficulty/level + language chips. When complete: a celebratory banner linking to `/cert/${code}`. Soft sequencing ONLY — every item stays clickable. `notFound()` when `getTrack` returns null.
- [ ] **Step 4:** `nav.ts`: STUDENT main section, after Challenges: `{ label: "Tracks", href: "/app/tracks", icon: "route" }`; TEACHER Community section after Academy: same entry.
- [ ] **Step 5:** `pnpm typecheck` clean.
- [ ] **Step 6:** Commit frontend: `feat(tracks): learning-track index + roadmap pages + nav`.

---

### Task 5: Web — public certificate page, post-pass nudge, certificates on Badges

**Files:**
- Create: `robocode-frontend/src/app/cert/[code]/page.tsx` (+ colocated `print-button.tsx` client component)
- Create: `robocode-frontend/src/lib/tracks/actions.ts` (server actions for the client nudge)
- Modify: `robocode-frontend/src/components/learn/challenge-submit.tsx` (nudge on pass)
- Modify: `robocode-frontend/src/app/app/badges/page.tsx` (My Certificates section)

**Interfaces:**
- Consumes: `apiGetPublic` (`src/lib/api/client.ts:89`) for `/certificates/verify/${code}`; `apiGet` for `/certificates` and `/tracks/for-task/${taskId}`; the solutions-gallery integration point in `challenge-submit.tsx` (the `celebrated` pass state) and its server-action pattern from `src/lib/challenges/solutions-actions.ts`.

- [ ] **Step 1:** `/cert/[code]` — PUBLIC server component (this route is outside `/app`, unauthenticated): fetch verify payload with `apiGetPublic`; unknown → `notFound()`. Render a print-friendly certificate: bordered card (brand colors from globals, works in light/dark), "Certificate of Completion", holder name large, track `title`, `issuedAt` date, verify code + absolute URL, "Verified by RoboCode ✓ — robocode.africa". `generateMetadata` → `RoboCode Certificate — ${title}`. `print-button.tsx`: `"use client"`, `window.print()` labelled "Print / Save as PDF"; add a small `@media print` style hiding the button.
- [ ] **Step 2:** `src/lib/tracks/actions.ts` — `"use server"`: `getTracksForTask(taskId: string)` → `/tracks/for-task/${taskId}` (mirror `solutions-actions.ts` auth/cookie forwarding), returning `{ slug, title, itemCount, doneCount }[]`.
- [ ] **Step 3:** `challenge-submit.tsx`: when the pass celebration renders, fire `getTracksForTask(taskId)`; for each returned track show a compact line: `"{title}: {doneCount}/{itemCount}"` + link "View track →" (`/app/tracks/${slug}`); when `doneCount === itemCount` show "🎓 Track complete — view your certificate" → `/app/badges`. Nothing renders when the array is empty.
- [ ] **Step 4:** `badges/page.tsx`: server-fetch `/certificates`; above the badge grid add "My Certificates" (only when non-empty): card per cert — 🎓, `title`, issued date, "View & share" → `/cert/${code}`.
- [ ] **Step 5:** `pnpm typecheck` clean.
- [ ] **Step 6:** Commit frontend: `feat(certificates): public verify/share page + post-pass track nudge + badges-page list`.

---

### Task 6: Mobile — tracks screens + certificates in profile

**Files:**
- Create: `robocode-mobile/lib/api/tracks_api.dart`, `robocode-mobile/lib/models/tracks.dart`, `robocode-mobile/lib/screens/tracks/tracks_screen.dart`, `robocode-mobile/lib/screens/tracks/track_detail_screen.dart`
- Modify: `robocode-mobile/lib/router.dart`, `robocode-mobile/lib/screens/profile_screen.dart`, plus the home/nav surface that links Leaderboards (mirror commit `b56b823`'s nav wiring for the new Tracks entry)

**Interfaces:**
- Consumes: `ApiClient.instance.get` (`lib/api/api_client.dart`), `share_plus` (already in pubspec), response shapes from Task 2.
- Produces: `TracksApi.list()`, `TracksApi.detail(String slug)`, `TracksApi.myCertificates()`; models `TrackSummary`, `TrackDetail`, `TrackItem`, `CertificateModel` (all with `fromJson`).

- [ ] **Step 1:** Models + `TracksApi` (thin typed wrapper, mirror `lib/api/leaderboards_api.dart` style): GET `/tracks`, `/tracks/$slug`, `/certificates`.
- [ ] **Step 2:** `TracksScreen` — grouped list (Robotics/Coding/AI) of cards: icon emoji, title, description, `LinearProgressIndicator(doneCount/itemCount)`, 🎓 chip when certified. Tap → detail. `TrackDetailScreen` — header + ordered checklist (✓ done / ▶ current / number); course items `context.push('/learn/$slug')` -style route used by existing course navigation, challenge items `context.push('/challenges/$slug')`; completed banner with certificate row.
- [ ] **Step 3:** `router.dart`: `GoRoute(path: '/tracks', ...)` + `GoRoute(path: '/tracks/:slug', ...)` beside the challenges routes (~line 127); add the "Tracks" nav/home entry wherever Leaderboards got its entry point.
- [ ] **Step 4:** `profile_screen.dart`: "My Certificates" section (only when non-empty) via `TracksApi.myCertificates()`: 🎓 `title` + issued date; trailing share icon → `Share.share('https://robocode.africa/cert/${cert.code}')`; tapping opens the same URL with the existing url-launch pattern used elsewhere in the app (search `url_launcher` usage; mirror it).
- [ ] **Step 5:** `flutter analyze` clean (no new warnings).
- [ ] **Step 6:** Commit mobile: `feat(tracks): learning tracks screens + certificates in profile with share`.

---

### Task 7: End-to-end verification (all repos)

**Files:** none created (verification only; fix-forward anything found, committing to the owning repo).

- [ ] **Step 1:** Backend: `npm run typecheck` + re-run `npx tsx src/modules/tracks/tracks.smoke.ts` (passes, cleans up after itself).
- [ ] **Step 2:** Start dev (backend :4000, frontend :3000). Playwright: login `ada@robocode.africa` / `password123` → `/app/tracks` shows the 6 seeded tracks grouped with progress bars → open `python-path` detail: 3 ordered items, `current` marker on the first not-done, items link to learn/challenges → screenshot.
- [ ] **Step 3:** Issue a cert end-to-end without solving everything by hand: with a throwaway tsx script (do NOT commit it), manufacture completions for ada on `web-foundations` (4 course items → set `Enrollment.completedAt` + ledger `task:course-complete:...` idemKeys), then reload `/app/tracks` (lazy issuance fires) → cert ribbon appears; Badges page lists it; copy the code, open `/cert/<code>` logged OUT → renders holder "Ada L." (or seed name equivalent), title, date, verified mark; unknown `/cert/RC-XXXXX-XXXXX` → 404 page. Screenshot the certificate. Clean up the manufactured rows (delete cert + ledger + enrollments the script created, ada keeps her real data).
- [ ] **Step 4:** Frontend `pnpm typecheck`; mobile `flutter analyze` — both clean.
- [ ] **Step 5:** Confirm each repo's working tree is clean (`git status`) and all Task 1–6 commits exist. Report the commit list.
