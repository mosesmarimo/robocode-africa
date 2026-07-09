// Smoke test for GamificationService.completeTask (XP table resolution,
// language/track tagging, idempotency, streak touch, per-language +
// generic badge thresholds). No test framework (repo convention): hand-rolled
// PASS/FAIL checks running against the real dev DB via PrismaService. Creates
// a throwaway user under a unique `gamtest-<random>` prefix and deletes it
// (cascade-deletes its ledger/badge rows) in a `finally` block. The badge
// catalog rows this exercises (first_run, ten_exercises, <lang>_novice/
// adept/master) are UPSERTED here rather than cleaned up — they're meant to
// become permanent catalog data (see prisma/seed.ts), and db:seed must NOT be
// run against this DB (destructive).
//
// Run: cd robocode-backend && npx tsx src/common/gamification.smoke.ts
import { PrismaService } from "../prisma/prisma.service";
import { NotifyService } from "./notify.service";
import { PointsService } from "./points.service";
import { StreakService } from "./streak.service";
import { GamificationService } from "./gamification.service";
import { LearnService } from "../modules/learn/learn.service";
import type { TracksService } from "../modules/tracks/tracks.service";
import { challengeXp, INTERACTIVE_TASK_DAILY_CAP } from "../domain/constants";
import { hashPassword } from "../auth/password.util";

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`PASS ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}${detail ? `: ${detail}` : ""}`);
  }
}

async function main() {
  const prisma = new PrismaService();
  const notify = new NotifyService(prisma);
  const points = new PointsService(prisma, notify);
  const streak = new StreakService(prisma, points);
  const gamification = new GamificationService(prisma, points, streak);
  // Only completeTask (tryit/exercise) is exercised below — completeLesson
  // (the only method touching tracks) is never called, so stub it like the
  // other unused deps in solutions.smoke.ts.
  const learn = new LearnService(prisma, gamification, {} as TracksService);
  await prisma.$connect();

  const runId = Math.random().toString(36).slice(2, 10);
  const createdUserIds: string[] = [];
  const passwordHash = await hashPassword("password123");

  // Badge catalog rows completeTask's badge checks need — upsert (not
  // create) so re-running this smoke never collides on the unique `code`.
  const badgeCodes = [
    { code: "first_run", name: "First Run", description: "Ran your first try-it example.", icon: "play" },
    { code: "ten_exercises", name: "Ten Exercises", description: "Completed 10 practice exercises.", icon: "check-circle" },
    { code: "python_novice", name: "Python Novice", description: "Earned novice-level XP in python.", icon: "award" },
    { code: "python_adept", name: "Python Adept", description: "Earned adept-level XP in python.", icon: "award" },
    { code: "python_master", name: "Python Master", description: "Earned master-level XP in python.", icon: "award" },
  ];
  for (const b of badgeCodes) {
    await prisma.badge.upsert({ where: { code: b.code }, create: b, update: {} });
  }

  try {
    const tenants = await prisma.tenant.findMany({ take: 1, select: { id: true } });
    if (tenants.length < 1) throw new Error("smoke test needs at least 1 tenant in the dev DB");
    const [tenant] = tenants;

    async function makeUser(suffix: string) {
      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: `gamtest-${runId}-${suffix}@example.com`,
          displayName: `GamTest ${suffix}`,
          passwordHash,
          role: "student",
          status: "active",
          isMinor: false,
        },
      });
      createdUserIds.push(user.id);
      return user;
    }

    // --- (a) XP resolved from the type table + language/track tagging --------
    {
      const user = await makeUser("a-xp-tag");
      const result = await gamification.completeTask({
        userId: user.id,
        type: "exercise",
        refId: "ex1",
        language: "python",
      });
      check("(a) exercise awards 25 XP", result.awarded === 25, `awarded=${result.awarded}`);
      check("(a) not alreadyDone on first call", result.alreadyDone === false);

      const ledger = await prisma.roboPointLedger.findUnique({
        where: { idemKey: `task:exercise:ex1:${user.id}` },
      });
      check("(a) ledger row created", !!ledger);
      check("(a) ledger tagged language=python", ledger?.language === "python", `language=${ledger?.language}`);
      check(
        "(a) track auto-resolved to coding from language",
        ledger?.track === "coding",
        `track=${ledger?.track}`,
      );

      const after = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      check("(a) roboPoints incremented by 25", after.roboPoints === 25, `roboPoints=${after.roboPoints}`);

      // --- (b) idempotent: repeat call is a no-op (no double-pay) ------------
      const repeat = await gamification.completeTask({
        userId: user.id,
        type: "exercise",
        refId: "ex1",
        language: "python",
      });
      check("(b) repeat call reports alreadyDone", repeat.alreadyDone === true);
      check("(b) repeat call awards 0", repeat.awarded === 0, `awarded=${repeat.awarded}`);
      const afterRepeat = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      check(
        "(b) roboPoints unchanged after repeat (no double-pay)",
        afterRepeat.roboPoints === 25,
        `roboPoints=${afterRepeat.roboPoints}`,
      );
      const ledgerCount = await prisma.roboPointLedger.count({
        where: { idemKey: `task:exercise:ex1:${user.id}` },
      });
      check("(b) exactly one ledger row for that idemKey", ledgerCount === 1, `count=${ledgerCount}`);

      // --- (c) streak touched on first (non-repeat) completion ----------------
      const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { prefs: true } });
      const prefs = row.prefs as { streak?: { count: number } } | null;
      check("(c) streak touched (count=1)", prefs?.streak?.count === 1, JSON.stringify(prefs));
    }

    // --- (d) explicit track passed through untouched --------------------------
    {
      const user = await makeUser("d-explicit-track");
      await gamification.completeTask({
        userId: user.id,
        type: "lesson",
        refId: "lesson1",
        track: "coding",
      });
      const ledger = await prisma.roboPointLedger.findUnique({
        where: { idemKey: `task:lesson:lesson1:${user.id}` },
      });
      check("(d) lesson awards 20 XP", ledger?.delta === 20, `delta=${ledger?.delta}`);
      check("(d) explicit track kept (no language given)", ledger?.track === "coding", `track=${ledger?.track}`);
      check("(d) language left null", ledger?.language === null, `language=${ledger?.language}`);
    }

    // --- (e) robotics language auto-resolves to the robotics track ------------
    {
      const user = await makeUser("e-robotics-track");
      await gamification.completeTask({
        userId: user.id,
        type: "lesson",
        refId: "lesson-robo",
        language: "arduino",
      });
      const ledger = await prisma.roboPointLedger.findUnique({
        where: { idemKey: `task:lesson:lesson-robo:${user.id}` },
      });
      check(
        "(e) arduino language auto-resolves track=robotics",
        ledger?.track === "robotics",
        `track=${ledger?.track}`,
      );
    }

    // --- (f) challenge XP resolved via xpOverride/challengeXp by difficulty ---
    {
      const user = await makeUser("f-challenge-xp");
      const beginner = await gamification.completeTask({
        userId: user.id,
        type: "challenge",
        refId: "chal-beg",
        language: "python",
        xpOverride: challengeXp("beginner"),
      });
      check("(f) beginner challenge awards 50 XP", beginner.awarded === 50, `awarded=${beginner.awarded}`);
      const intermediate = await gamification.completeTask({
        userId: user.id,
        type: "challenge",
        refId: "chal-int",
        language: "python",
        xpOverride: challengeXp("intermediate"),
      });
      check("(f) intermediate challenge awards 100 XP", intermediate.awarded === 100, `awarded=${intermediate.awarded}`);
      const advanced = await gamification.completeTask({
        userId: user.id,
        type: "challenge",
        refId: "chal-adv",
        language: "python",
        xpOverride: challengeXp("advanced"),
      });
      check("(f) advanced challenge awards 150 XP", advanced.awarded === 150, `awarded=${advanced.awarded}`);

      // completeTask must refuse to silently zero-XP a challenge with no
      // xpOverride supplied (challenge has no flat per-type XP entry).
      let threw = false;
      try {
        await gamification.completeTask({ userId: user.id, type: "challenge", refId: "chal-noxp" });
      } catch {
        threw = true;
      }
      check("(f) challenge without xpOverride throws instead of awarding 0", threw);
    }

    // --- (g) tryit-first-run generic badge -------------------------------------
    {
      const user = await makeUser("g-first-run");
      const result = await gamification.completeTask({
        userId: user.id,
        type: "tryit",
        refId: "tryit1",
        language: "javascript",
      });
      check("(g) tryit awards 5 XP", result.awarded === 5, `awarded=${result.awarded}`);
      const badge = await prisma.userBadge.findFirst({
        where: { userId: user.id, badge: { code: "first_run" } },
      });
      check("(g) first_run badge granted on first tryit", !!badge);
    }

    // --- (h) per-language XP-threshold badges + ten_exercises ------------------
    {
      const user = await makeUser("h-thresholds");
      // 10 exercise completions @ 25 XP each, all tagged language=python:
      // total 250 XP crosses both the novice (50) and adept (200) thresholds,
      // and the 10th exercise completion crosses the ten_exercises count badge.
      for (let i = 1; i <= 10; i++) {
        await gamification.completeTask({
          userId: user.id,
          type: "exercise",
          refId: `ex-${i}`,
          language: "python",
        });
      }
      const after = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      check("(h) total XP after 10 exercises is 250", after.roboPoints === 250, `roboPoints=${after.roboPoints}`);

      const [novice, adept, master, tenEx] = await Promise.all([
        prisma.userBadge.findFirst({ where: { userId: user.id, badge: { code: "python_novice" } } }),
        prisma.userBadge.findFirst({ where: { userId: user.id, badge: { code: "python_adept" } } }),
        prisma.userBadge.findFirst({ where: { userId: user.id, badge: { code: "python_master" } } }),
        prisma.userBadge.findFirst({ where: { userId: user.id, badge: { code: "ten_exercises" } } }),
      ]);
      check("(h) python_novice badge granted at 50 XP", !!novice);
      check("(h) python_adept badge granted at 200 XP", !!adept);
      check("(h) python_master NOT granted (250 < 500 threshold)", !master);
      check("(h) ten_exercises badge granted at the 10th exercise", !!tenEx);
    }

    // --- (i) LearnService.completeTask (POST /learn/complete-task wrapper):
    // refId MUST resolve to a real tryit/exercise block in an accessible
    // lesson — this is the fix for the XP-farming hole where any arbitrary
    // refId string used to mint unlimited XP. A fabricated refId is now
    // REJECTED (no XP, no ledger row); a refId pointing at a REAL seeded
    // tutorial tryit/exercise block IS paid once, idempotently -------------
    {
      const created = await makeUser("i-complete-task");
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: created.id },
        include: { tenant: true },
      });

      // A fabricated refId (no real lesson behind it) — previously this
      // minted 5 XP unconditionally. Must now throw and award nothing.
      let fabricatedRejected = false;
      try {
        await learn.completeTask(user, { type: "tryit", refId: "totally-fake-lesson-id#0", language: "python" });
      } catch {
        fabricatedRejected = true;
      }
      check("(i) fabricated refId is rejected (no XP)", fabricatedRejected);
      const fabricatedLedger = await prisma.roboPointLedger.findUnique({
        where: { idemKey: `task:tryit:totally-fake-lesson-id#0:${user.id}` },
      });
      check("(i) fabricated refId did not create a ledger row", !fabricatedLedger);

      // A well-formed refId (real lesson id + in-range index) but pointing at
      // a block that isn't a tryit (e.g. index 0 is markdown in every
      // tutorial lesson) must also be rejected.
      const introLesson = await prisma.lesson.findFirst({
        where: { course: { slug: "tutorial-python" }, slug: "python-tut-intro" },
        select: { id: true, body: true },
      });
      if (!introLesson) {
        throw new Error(
          "smoke test needs the seeded tutorial-python / python-tut-intro lesson — run db:seed-content first",
        );
      }
      const blocks = ((introLesson.body as { blocks?: Array<Record<string, unknown>> }).blocks ?? []) as Array<{
        type: string;
        language?: string;
      }>;
      check("(i) block 0 of python-tut-intro is markdown (sanity check)", blocks[0]?.type === "markdown");
      let nonInteractiveRejected = false;
      try {
        await learn.completeTask(user, { type: "tryit", refId: `${introLesson.id}#0`, language: "python" });
      } catch {
        nonInteractiveRejected = true;
      }
      check("(i) refId pointing at a non-tryit/exercise block is rejected", nonInteractiveRejected);

      // Now resolve the REAL interactive (tryit/exercise) blocks in that
      // lesson, in body order — these are the refIds the frontend
      // (components/learn/lesson-body.tsx) and mobile (rich_content.dart)
      // clients actually construct: `${lessonId}#${blockIndex}`.
      const interactive = blocks
        .map((b, idx) => ({ b, idx }))
        .filter(({ b }) => b.type === "tryit" || b.type === "exercise");
      check("(i) python-tut-intro has >= 3 interactive blocks (needed below)", interactive.length >= 3, `count=${interactive.length}`);
      const [block0, block1] = interactive;
      const realRefId = `${introLesson.id}#${block0.idx}`;
      const realLanguage = block0.b.language!;

      const first = await learn.completeTask(user, { type: block0.b.type as "tryit" | "exercise", refId: realRefId, language: realLanguage });
      check(`(i) real ${block0.b.type} block awards XP`, first.awarded > 0, `awarded=${first.awarded}`);
      check("(i) first call is not alreadyDone", first.alreadyDone === false);

      const second = await learn.completeTask(user, { type: block0.b.type as "tryit" | "exercise", refId: realRefId, language: realLanguage });
      check("(i) repeat call for the same (type,refId,user) reports alreadyDone", second.alreadyDone === true);
      check("(i) repeat call awards 0 (no double-pay)", second.awarded === 0, `awarded=${second.awarded}`);

      const ledger = await prisma.roboPointLedger.findUnique({
        where: { idemKey: `task:${block0.b.type}:${realRefId}:${user.id}` },
      });
      check("(i) ledger tagged with the block's own language", ledger?.language === realLanguage, `language=${ledger?.language}`);
      const ledgerCount = await prisma.roboPointLedger.count({
        where: { idemKey: `task:${block0.b.type}:${realRefId}:${user.id}` },
      });
      check("(i) exactly one ledger row for that idemKey", ledgerCount === 1, `count=${ledgerCount}`);

      // A real, in-range refId but with a language that doesn't match the
      // block's own language must be rejected too — otherwise a caller could
      // pair a real refId with a different language to mistag XP onto
      // another leaderboard. This must reject even though this refId+type is
      // already paid (the language check runs before the idempotency check).
      let mismatchRejected = false;
      try {
        await learn.completeTask(user, { type: block0.b.type as "tryit" | "exercise", refId: realRefId, language: "klingon" });
      } catch {
        mismatchRejected = true;
      }
      check("(i) mismatched language against a real block is rejected", mismatchRejected);

      // --- (j) per-user daily cap backstops tryit/exercise XP even for real,
      // distinct refIds (defense in depth on top of the refId validation) ---
      // This user already banked exactly 1 genuinely-new tryit/exercise award
      // today (block0, above — the fabricated/non-interactive/repeat/mismatch
      // calls all threw or were idempotency no-ops, so none added rows).
      // Fast-fill CAP - 2 more synthetic rows (mirrors referrals/smoke.ts's
      // fast-fill-the-cap pattern — seeding CAP real completions one-by-one
      // would be slow) to land exactly one award short of the cap.
      await prisma.roboPointLedger.createMany({
        data: Array.from({ length: INTERACTIVE_TASK_DAILY_CAP - 2 }, (_, i) => ({
          userId: user.id,
          delta: 5,
          reason: "task:tryit",
          refType: "tryit",
          refId: `cap-fill-${i}`,
          idemKey: `task:tryit:cap-fill-${i}:${user.id}`,
        })),
      });
      const countBeforeBlock1 = await prisma.roboPointLedger.count({
        where: { userId: user.id, refType: { in: ["tryit", "exercise"] } },
      });
      check(
        "(j) exactly CAP - 1 tryit/exercise awards banked before block1",
        countBeforeBlock1 === INTERACTIVE_TASK_DAILY_CAP - 1,
        `count=${countBeforeBlock1}`,
      );

      // One below the cap: a fresh, real, unpaid block must still award XP.
      const block1RefId = `${introLesson.id}#${block1.idx}`;
      const block1Result = await learn.completeTask(user, {
        type: block1.b.type as "tryit" | "exercise",
        refId: block1RefId,
        language: block1.b.language!,
      });
      check("(j) below the cap: a real new block still awards XP", block1Result.awarded > 0, `awarded=${block1Result.awarded}`);

      // Now exactly at the cap — a further brand-new real block must no-op
      // (0 XP, alreadyDone-shaped) rather than award or error.
      const [, , block2] = interactive;
      const block2RefId = `${introLesson.id}#${block2.idx}`;
      const cappedCountBefore = await prisma.roboPointLedger.count({
        where: { userId: user.id, refType: { in: ["tryit", "exercise"] } },
      });
      check("(j) daily cap reached before the capped call", cappedCountBefore === INTERACTIVE_TASK_DAILY_CAP, `count=${cappedCountBefore}`);
      const cappedResult = await learn.completeTask(user, {
        type: block2.b.type as "tryit" | "exercise",
        refId: block2RefId,
        language: block2.b.language!,
      });
      check("(j) capped call awards 0 XP", cappedResult.awarded === 0, `awarded=${cappedResult.awarded}`);
      check("(j) capped call reports alreadyDone (no-op shape)", cappedResult.alreadyDone === true);
      const cappedLedger = await prisma.roboPointLedger.findUnique({
        where: { idemKey: `task:${block2.b.type}:${block2RefId}:${user.id}` },
      });
      check("(j) capped call created no ledger row", !cappedLedger);
    }
  } finally {
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await prisma.$disconnect();
  }

  if (failures > 0) {
    console.log(`\n${failures} failure(s)`);
    process.exit(1);
  }
  console.log("\nAll smoke checks passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
