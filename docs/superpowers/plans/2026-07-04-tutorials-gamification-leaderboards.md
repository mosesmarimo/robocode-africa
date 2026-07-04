# Tutorials + Gamification + Leaderboards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** ≥5 W3Schools-style tutorials per language (12), every task gamified (XP+streak+badges, idempotent), and leaderboards per language + platform-wide Robotics + platform-wide Coding.

**Architecture:** `RoboPointLedger` gains `language`/`track` tags; a single `GamificationService.completeTask` funnels every completion (XP+streak+badge, idempotent) and every completion path routes through it; a `leaderboard` module GROUP BYs the tagged ledger. Tutorials are Course/Lesson content with new `tryit`/`exercise` blocks that reuse the code sandbox / Studio sim.

**Tech Stack:** NestJS + Prisma, Next.js 15 (read `robocode-frontend/node_modules/next/dist/docs/` first), Flutter.

## Global Constraints

- Three repos; commit per repo. End every commit message with:

```
Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SxfjwdvQNhvtgpE2HSPeFf
```

- **DO NOT add or remove any language.** Frozen set (12): coding {python, javascript, typescript, html, css, go, rust, cpp, csharp, sql} + robotics {arduino, micropython}. Tutorials/leaderboards cover exactly these.
- **Robotics code generation stays AI-powered**; robotics run = Studio sim; the code sandbox is coding-only. A robotics `tryit` opens the Studio (Open-in-Studio), it does NOT run through the code sandbox.
- No test frameworks: typecheck; backend smokes (`npx tsx`); Playwright repro; `flutter analyze`. Do NOT run `db:seed`/`db:reset` (destructive) — use `db push` + targeted seed scripts.
- XP table (verbatim): lesson-complete 20, tutorial-lesson-complete 15, tryit-first-run 5, exercise-complete 25, challenge-pass 50/100/150 by difficulty, course-complete bonus 100. Idempotent `idemKey="task:<type>:<refId>:<userId>"`.
- `track` ∈ {coding, robotics}. Coding = the 10 coding languages; robotics = {arduino, micropython}.
- Leaderboards show displayName + avatarSeed + xp only — never email; cross-tenant by default with optional `tenant` filter; all-time + this-week scopes; include caller's own rank.

---

## PHASE A — Backend infra (ledger tags, GamificationService, leaderboard module)

### Task A1: Ledger `language`/`track` columns + indexes
**Files:** Modify `robocode-backend/prisma/schema.prisma`.
- [ ] Add to `RoboPointLedger`: `language String?`, `track String?`, `@@index([language])`, `@@index([track])`. `cd robocode-backend && npx prisma format && npx prisma validate`; `npx prisma db push --accept-data-loss --skip-generate` (additive nullable cols + indexes — confirm no drop/reset; STOP+report if it wants to reset); `npx prisma generate`; `npm run typecheck` clean.
- [ ] Commit `feat(schema): RoboPointLedger language/track tags for leaderboards`.

### Task A2: `GamificationService.completeTask` + XP constants + route existing paths
**Files:** Create `robocode-backend/src/common/gamification.service.ts`, add to `common.module.ts` exports. Modify `constants.ts` (XP table, `trackForLanguage`), `points.service.ts` (accept language/track on awardPoints — additive optional args), and the existing completion paths: lesson progress (`learn.service.ts`), challenge grading (`competitions.service.ts`).
**Interfaces:** `completeTask({ userId, type, refId, language?, track?, xpOverride? }): Promise<{ awarded:number; alreadyDone:boolean }>` — resolves XP from the type (constants), resolves track from language when track absent (`trackForLanguage`), calls `awardPoints({ userId, delta:xp, reason:\`task:${type}\`, refType:type, refId, idemKey:\`task:${type}:${refId}:${userId}\`, language, track })`, then `streak.touch(userId)`, then badge checks (per-language XP-threshold badges — seed the badge codes: `<lang>_novice/adept/master`, and generic `first_run`, `ten_exercises`). Idempotent (awardPoints P2002-safe returns alreadyDone).
- [ ] `awardPoints` gains optional `language?`/`track?` persisted on the ledger row (additive; existing callers unaffected).
- [ ] Route lesson-complete (LessonProgress upsert) and challenge-pass (Submission grading) through `completeTask` with the right language/track (challenge language from the task; lesson language from the course). Keep existing point awards working (do not double-award — replace the direct awardPoints in those paths with completeTask, or guard).
- [ ] Seed per-language badge codes + generic ones into `prisma/seed.ts` badge catalog (do NOT run seed; just add to the catalog + upsert in the smoke).
- [ ] Smoke `src/common/gamification.smoke.ts`: completeTask awards the right XP, tags language+track, is idempotent (2nd call alreadyDone, no double-pay), touches streak, grants a badge at threshold. Run it. Typecheck clean.
- [ ] Commit `feat(gamification): completeTask funnel (xp+streak+badges, tagged, idempotent)`.

### Task A3: `leaderboard` module + endpoints
**Files:** Create `robocode-backend/src/modules/leaderboard/{leaderboard.service.ts, leaderboard.controller.ts, dto.ts, leaderboard.module.ts}`; register in `app.module.ts`.
**Interfaces:** `GET /leaderboards/language/:language?scope=all|week&tenant=`, `GET /leaderboards/track/:track` (robotics|coding), each → `{ rows:[{rank,userId,displayName,avatarSeed,xp}], me:{rank,xp}|null }`.
- [ ] `leaderboardByLanguage(language, scope, tenant?)` / `byTrack(track, scope, tenant?)`: `roboPointLedger.groupBy({ by:["userId"], where:{ language|track, ...(scope==="week"?{createdAt:{gte: startOfWeekUTC}}:{}) , ...(tenant?{user:{tenantId:tenant}}:{}) }, _sum:{delta} })` → fetch user display fields → sort desc → top 50 + the caller's own rank (compute separately if outside top-50). Validate `language ∈ frozen 12` / `track ∈ {coding,robotics}` (400 otherwise).
- [ ] Smoke `leaderboard.smoke.ts` (throwaway users + tagged ledger rows, cleanup): per-language ranking correct; track ranking sums the right languages; weekly window excludes older rows; own-rank returned when outside top-N; cross-tenant vs tenant filter. Run it. Typecheck clean.
- [ ] Commit `feat(leaderboard): per-language + track leaderboards (all-time/weekly, own-rank)`.

---

## PHASE B — Try-it/exercise blocks + tutorial content

### Task B1: `tryit` + `exercise` lesson block types + renderers
**Files:** Frontend — `src/lib/studio/blocks.ts` (or the lesson block union), `src/components/learn/` renderers; reuse `src/lib/run` (`runInBrowser`) + server `runProject` for execution; robotics tryit → Open-in-Studio. Backend — the content block types (`prisma/content/types.ts`).
- [ ] Add `tryit` block `{ type:"tryit", language, code, expectedOutput? }` and `exercise` block `{ type:"exercise", language, prompt, starter, solution, check? }` to the block union (backend content types + frontend LessonBlock union — keep them in sync).
- [ ] Renderer: `TryItBlock` — an editable code area + **Run** → coding langs use `runInBrowser` (py/js/ts/sql) or `runProject` (cpp/cs/go/rust); html/css → iframe preview; robotics (arduino/micropython) → an "Open in Studio" button (NOT the sandbox). On first successful run, call a gamification hook (`completeTask` type `tryit`, language). `ExerciseBlock` — editable + **Show Answer** (reveals `solution`) + optional **Check** (runs `check` via sandbox, marks `exercise` complete → completeTask).
- [ ] Typecheck; a Playwright check renders a python tryit, Runs it (browser sandbox) → output + an XP toast. Commit frontend (+ backend types) `feat(learn): tryit + exercise lesson blocks (sandbox-powered, gamified)`.

### Task B2..B13: Author ≥5 W3Schools-style tutorials per language (fan-out, one per language)
**Files (per language L):** Create `robocode-backend/prisma/content/tutorials-<L>.ts`; wire into `prisma/content/index.ts` + the content seed.
- [ ] For EACH of the 12 languages, a subagent authors a "<Language> Tutorial" course with ≥5 lessons, each W3Schools-style: a short explanation (md), ≥1 `tryit` block (real runnable example in that language — coding langs runnable in the sandbox; arduino/micropython as Studio sim examples), a compact reference/example, and 1–3 `exercise` blocks with solutions. Tag the course/lessons `language:L` (+ `kind:"tutorial"`). Content must be correct and run clean (coding tryit examples must actually produce their `expectedOutput` in the sandbox; verify a couple).
- [ ] Wire each into the content index + seed-content. Typecheck. A `tutorials.smoke.ts` asserts every one of the 12 languages has ≥5 tutorial lessons, each with ≥1 tryit block and a valid `language`.
- [ ] Commit per language `content(tutorials): W3Schools-style <Language> tutorial (5+ lessons)`.

---

## PHASE C — Frontend + mobile surfaces

### Task C1: Web leaderboards + XP surfaces
**Files:** `src/app/app/leaderboards/page.tsx` + `src/lib/leaderboards/actions.ts`; XP bar in the app header; completion toasts; per-course "Top learners".
- [ ] Leaderboards page: tabs **Coding** / **Robotics** + a **language** picker (12), All-time / This-week toggle, top-N list + "your rank". Link from dashboard + Academy. Language board also on each tutorial course page.
- [ ] XP bar/level in the header; a "+X XP" toast on task completion (lesson/tryit/exercise/challenge). Typecheck; Playwright: open a language leaderboard → ranked list; complete a tryit → toast. Commit `feat(app): leaderboards page + XP bar + completion toasts`.

### Task C2: Mobile leaderboards + XP surfaces + tutorials rendering
**Files:** `robocode-mobile/lib/screens/leaderboards/`, `lib/api/leaderboards_api.dart`; render `tryit`/`exercise` blocks in the mobile lesson view (tryit coding → the sandbox is web-only in the WebView Studio; on mobile, a tryit opens the Studio WebView / shows read-only run — match the app's existing lesson-run pattern); XP + streak already in header.
- [ ] Leaderboards screen (coding/robotics/language tabs, all-time/weekly, own-rank); render the new block types; nav entry. `flutter analyze` clean + `flutter test`. Commit `feat(mobile): leaderboards + tryit/exercise lesson blocks`.

---

## PHASE D — Verification sweep
- [ ] Typecheck backend+frontend; `flutter analyze` mobile.
- [ ] Backend smokes pass: gamification (idempotent, tagged, streak, badge), leaderboard (per-language/track, weekly, own-rank, tenant), tutorials (≥5×12 with tryit).
- [ ] Dev servers up → Playwright: run a python tryit (browser sandbox) → XP toast; open Python + Robotics + Coding leaderboards → ranked.
- [ ] Confirm no language added/removed (exactly 12 everywhere); robotics tryit uses Studio (not sandbox); leaderboards leak no PII.
- [ ] Commit repro harnesses.
