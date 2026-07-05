# Competitor-Feature Iterations — Build Log

Source backlog: `docs/superpowers/specs/2026-07-04-competitor-feature-backlog.md` (24 items). Standing directive: implement the best competitor features across several review-gated iterations. Constraints (standing): frozen language set (12), robotics code generation stays AI + sim.

## Iteration 1 — Tutorials + Gamification + Leaderboards ✅ DONE
Delivered as its own plan (`2026-07-04-tutorials-gamification-leaderboards`). Covers backlog items: W3Schools "Try it Yourself" inline editor + reference tutorials (≥5 × 12 languages), universally gamified tasks (XP/streak/badges via `completeTask`), per-language + platform Coding/Robotics leaderboards (boot.dev/Sololearn/LeetCode). Complete across backend + web + mobile.

## Iteration 2 — Forgiving streak (embers + freeze) — boot.dev/LeetCode ✅ DONE
Shipped 2026-07-04/05 across backend (`2fe59e4`), web (`e6c65dd`), mobile (`f6caa99`); reviewed (10-angle finder pass) and deployed live (backend `7d275cc` migration applied, frontend `17485dc`).
**Why:** the #3 P0. Softens all-or-nothing daily-streak anxiety (a top churn cause for youth learners); builds on the existing `StreakService`.
**Scope (small):**
- `User.prefs.streak` gains `embers` (0..N) and `frozenUntil?`. Over-performing (a day with ≥K completed tasks, or ≥2 consecutive active days) banks 1 ember (cap ~3). On a missed day, `StreakService.touch` spends 1 ember to preserve `count` instead of resetting (so an occasional miss doesn't break the streak). A rarer "freeze" (earned at a streak milestone) protects a multi-day gap.
- Surface: header flame shows the ember count (🔥 + a small "🛡×2"); a toast "Your streak was saved by an ember!" when one is spent.
- Backend `StreakService.touch` becomes: same-day no-op; yesterday→+1 (and maybe bank an ember); gap of 1 day with embers→spend ember, keep count; gap beyond protection→reset to 1. Idempotent milestone awards unchanged.
- Smoke: ember earned on over-performance; a 1-day gap with an ember preserves the streak and decrements embers; a gap with 0 embers resets.
- Web + mobile: show embers/freeze in the streak UI.

## Iteration 3 — Post-solve solutions gallery — Codewars/Exercism ✅ DONE
Shipped 2026-07-04/05 across backend (`d73a983`), web (`c531ee2`), mobile (`8ca0140`); anonymized, pass-gated, likeable, exemplar flag included. Deployed live with Iteration 2.
**Why:** the #1 P0. After a student PASSES a coding challenge (real sandbox grade), reveal an anonymized gallery of other accepted solutions + an exemplar — turning every challenge into a mini code-review class. Reuses the grader/sandbox + existing Submission data; no new infra.
**Scope:**
- Backend: on a passing `Submission`, it's eligible for the gallery. `GET /challenges/:taskId/solutions` (JWT, only if the caller has themselves passed that task — prevents spoiling) → up to N anonymized accepted solutions (code + language + a like count), ordered by likes/recency, excluding the caller's own; author shown as anonymized (no name) or opt-in attribution. A `SolutionLike` (or reuse a like model) for upvotes. Optionally a curated `exemplar` flag an admin/teacher can set.
- Frontend + mobile: after a pass, a "See how others solved it" panel showing the gallery (syntax-highlighted, read-only) + like buttons.
- Youth-safety: anonymized by default; only unlocked after the viewer passes; moderation/report reuse.

## Iteration 4 — Learning tracks + checkpoint certificates ✅ DONE
Backlog #4 (curated finishable tracks, P0) + #9 (checkpoint certificates, P1) — LeetCode study plans / Codecademy paths / freeCodeCamp checkpoint certs. Reality-adapted: the challenge bank has only 15 tasks, so tracks span existing courses AND challenges (polymorphic `LearningTrackItem`); progress derived from existing pass records (no progress table, instant retroactive credit); certificate + 150 XP auto-issued on completion (idempotent, hooks + lazy backfill); public PII-free verify page `/cert/[code]`. 6 curated tracks seeded (python/javascript paths, web-foundations, robotics starter/explorer, ai-explorer). Shipped 2026-07-05 across backend (`bc43a0d..3e00fc9` + migration), web (`5d719d8..bf212fd`), mobile (`49910a0`); design `2026-07-05-learning-tracks-certificates-design.md`, plan `2026-07-05-learning-tracks-certificates.md`; per-task reviews + final whole-branch review READY TO DEPLOY; e2e verified live (real cert issuance + public verify). Follow-ups logged in the review: unpublish-missing-tracks in sync, $transaction wrap, cert-vs-new-item card behavior.

## Later (backlog, not yet scheduled)
Manipulate-before-explain Studio-sim widgets (Brilliant — high effort); spaced-repetition practice deck (Codecademy Go / boot.dev Training Grounds); checkpoint certificates (freeCodeCamp); community boss-battle event (boot.dev). See the backlog doc for the full 24.
