# W3Schools-style Tutorials + Universal Gamification + Per-Language & Track Leaderboards — Design

**User asks (2026-07-04):** (1) ≥5 tutorials per language in W3Schools format; (2) every task on RoboCode gamified; (3) a leaderboard per language + a platform-wide Robotics board + a platform-wide Coding board.

**Hard constraints (standing):** do NOT add/remove any language — frozen set = coding {python, javascript, typescript, html, css, go, rust, cpp, csharp, sql} + robotics {arduino, micropython} (12). Robotics code generation stays AI-powered; robotics run = Studio sim; the code sandbox is coding-only.

These three interlock and ship as one plan: gamified tasks emit language+track-tagged XP → leaderboards rank that XP → tutorials are new gamified tasks with inline try-it editors.

## 1. W3Schools-format tutorials (≥5 × 12 languages ≈ 60+)

**Format per tutorial (mirrors w3schools):** short prose explanation → an inline **"Try it Yourself"** editable + runnable editor → a compact reference/example → 1–3 low-stakes exercises with a **"Show Answer"** escape hatch (never hard-blocks). Chapters carry a visible progress counter.

**Reuse, don't rebuild:**
- New lesson block type **`tryit`**: `{ type:"tryit", language, code, expectedOutput? }` — renders an editable code box + **Run**. Coding languages run via the **browser sandbox** (`runInBrowser`: python/js/ts/sql) or the **server sandbox** (cpp/csharp/go/rust); html/css render in the existing iframe preview. Robotics (arduino/micropython) `tryit` opens the **Studio sim** (Open-in-Studio) — AI codegen still available there. This is the same sandbox we just built — the try-it editor is its natural home.
- New lesson block type **`exercise`**: `{ type:"exercise", prompt, starter, solution, check? }` — editable, a **Show Answer** button, and (optional) an auto-check via the sandbox → marks the exercise complete (gamified).
- Tutorials are `Course`/`Lesson` rows (existing content model) tagged `kind:"tutorial"` + `language`, seeded via the existing `db:seed-content` pipeline. Each language gets a "<Lang> Tutorial" course with ≥5 lessons.

**Content generation:** fan out one authoring subagent per language (12), each producing a `prisma/content/tutorials-<lang>.ts` module with ≥5 W3Schools-style lessons (explanation + tryit + reference + exercises), wired into the content index + seed. Independent files → parallel authoring; committed per-language.

## 2. Universal gamification (every task)

**Task taxonomy (everything that can be "done"):** lesson-complete, tutorial-lesson-complete, tryit-run (first successful run), exercise-complete, challenge-pass, course-complete. Each is a **gamified task** that, on completion:
- awards **XP** (RoboPoints) via `PointsService.awardPoints`, **tagged with `language` + `track`** (idempotent per task via `idemKey = "task:<type>:<refId>:<userId>"` so re-doing doesn't re-pay);
- updates the **streak** (`StreakService.touch`);
- checks **badge** unlocks (per-language milestones: "Python Novice/Adept/Master" at XP thresholds; "First Run", "10 Exercises", etc.);
- surfaces **progress** (per-lesson %, course %, an XP bar in the header, a "+X XP" toast on completion).

**Backend:** a small `GamificationService.completeTask({ user, type, refId, language, track, xp })` — the single funnel every task-completion path calls (lesson progress, challenge submit, exercise check, tryit run). It wraps awardPoints (tagged) + streak.touch + badge checks, idempotently. Existing completion paths (LessonProgress, Submission grading) are routed through it so nothing is un-gamified. XP-per-task table in `constants.ts` (lesson 20, tutorial-lesson 15, tryit 5, exercise 25, challenge by difficulty 50/100/150, course-complete bonus 100).

**Data:** `RoboPointLedger.language String?` + `RoboPointLedger.track String?` (coding|robotics) — additive; every award now carries them (null for non-task awards like referrals). This is what makes per-language/track leaderboards a simple GROUP BY.

## 3. Leaderboards (per-language + track-wide)

- **Per-language** (×12): rank users by summed XP where `language = X`.
- **Platform Robotics**: rank by summed XP where `track = "robotics"` (arduino + micropython + robotics challenges).
- **Platform Coding**: rank by summed XP where `track = "coding"` (the 10 coding languages + coding challenges).

**Backend `leaderboard` module** (or extend the existing points/people service):
- `GET /leaderboards/language/:language?scope=all|week&tenant=` → top-N `{ rank, userId, displayName, avatarSeed, xp }`.
- `GET /leaderboards/track/:track` (`robotics`|`coding`) → same shape.
- Optional `GET /leaderboards/global` (total RoboPoints) — reuse existing.
- Queries: `roboPointLedger.groupBy({ by:["userId"], where:{ language|track, createdAt≥weekStart? }, _sum:{ delta } })` → join user display fields → order desc → top-N. Add indexes `@@index([language])`, `@@index([track])`. Time scopes: **all-time** + **this week** (weekly resets drive re-engagement). **Cross-tenant platform-wide** by default (matches the social-graph decision), with an optional `tenant` filter for school boards. Show the caller's own rank even if outside top-N.

**Frontend + mobile:** a Leaderboards page/section with tabs — **Coding**, **Robotics**, and a **per-language** picker (the 12) — each with All-time / This-week toggle, top-N list, and "your rank". Link from the dashboard + Academy. Language leaderboards also surface on each language's tutorial course page ("Top learners in Python").

## Youth-safety / Africa fit

Leaderboards show display name + avatar only (already-public social fields), never email; respect existing moderation/blocking. XP/streak are opt-out-safe (no punishment for inactivity beyond streak reset, which the forgiving-ember mechanic — a backlog item — later softens). Low-bandwidth: leaderboards are small JSON; try-it runs client-side (browser sandbox) where possible, no server round-trip.

## Testing

No frameworks: backend smokes — `gamification.smoke.ts` (completeTask idempotency + tags language/track + streak + badge); `leaderboard.smoke.ts` (per-language + track ranking correct, weekly window, own-rank, cross-tenant). Content: a `tutorials` schema smoke asserting each language has ≥5 lessons each with ≥1 tryit block and valid `language`. Frontend Playwright: open a tutorial, run a try-it (browser sandbox) → XP toast; open a language leaderboard → ranked list. Typecheck all repos; `flutter analyze`.

## Iteration shape (this plan = 3 build phases)

- **Phase A (backend infra):** ledger language/track columns + indexes; `GamificationService.completeTask`; route existing completion paths through it; `leaderboard` module + endpoints; smokes.
- **Phase B (tutorials content + try-it/exercise blocks):** the `tryit`/`exercise` block types + renderers (reusing the sandbox); fan-out authoring of ≥5 W3Schools tutorials × 12 languages; seed wiring; gamify tryit/exercise completion.
- **Phase C (frontend/mobile surfaces):** Leaderboards page (coding/robotics/per-language, all-time/weekly, own-rank) on web + mobile; XP bar + completion toasts; per-course "top learners".

## Out of scope (fast-follow)
Per-language certificates, seasonal leaderboard resets/rewards, team leaderboards, anti-cheat beyond idempotency, editable-after-publish tutorial authoring UI.
