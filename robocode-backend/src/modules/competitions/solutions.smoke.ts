// Smoke test for the post-solve solutions gallery (Iteration 3 — see
// docs/superpowers/specs/2026-07-04-competitor-iterations.md). No test
// framework (repo convention): hand-rolled PASS/FAIL checks running against
// the real dev DB via PrismaService. Creates a throwaway Task + users under a
// unique `solsmoke-<random>` prefix and deletes them (cascade-deletes their
// submissions/likes) in a `finally` block. Does NOT touch db:seed data.
//
// Only CompetitionsService's gallery/like/exemplar methods are exercised —
// they don't call PointsService/GamificationService/AiService/RunService, so
// those constructor deps are stubbed out rather than wired for real (no
// docker/AI runtime needed for this smoke test).
//
// Run: cd robocode-backend && npx tsx src/modules/competitions/solutions.smoke.ts
import { PrismaService } from "../../prisma/prisma.service";
import { CompetitionsService } from "./competitions.service";
import type { PointsService } from "../../common/points.service";
import type { GamificationService } from "../../common/gamification.service";
import type { AiService } from "../ai/ai.service";
import type { RunService } from "../run/run.service";
import type { TracksService } from "../tracks/tracks.service";
import type { AuthUser } from "../../auth/auth-user.type";
import { hashPassword } from "../../auth/password.util";

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`PASS ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}${detail ? `: ${detail}` : ""}`);
  }
}

async function expectThrows(name: string, fn: () => Promise<unknown>, detailOnMessage?: string) {
  try {
    await fn();
    check(name, false, "did not throw");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    check(name, true);
    if (detailOnMessage) check(`${name} (message mentions "${detailOnMessage}")`, msg.includes(detailOnMessage), msg);
  }
}

async function main() {
  const prisma = new PrismaService();
  // Only prisma is real — the gallery/like/exemplar methods under test never
  // touch these, so stub them rather than wiring real docker/AI runtimes.
  const competitions = new CompetitionsService(
    prisma,
    {} as PointsService,
    {} as GamificationService,
    {} as AiService,
    {} as RunService,
    {} as TracksService,
  );
  await prisma.$connect();

  const runId = Math.random().toString(36).slice(2, 10);
  const createdUserIds: string[] = [];
  let taskId: string | null = null;
  const passwordHash = await hashPassword("password123");

  try {
    const tenants = await prisma.tenant.findMany({ take: 1, select: { id: true } });
    if (tenants.length < 1) throw new Error("smoke test needs at least 1 tenant in the dev DB");
    const [tenant] = tenants;

    async function makeUser(suffix: string): Promise<AuthUser> {
      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: `solsmoke-${runId}-${suffix}@example.com`,
          displayName: `SolSmoke ${suffix}`,
          passwordHash,
          role: "student",
          status: "active",
          isMinor: false,
        },
        include: { tenant: true },
      });
      createdUserIds.push(user.id);
      return user;
    }

    const task = await prisma.task.create({
      data: {
        title: "Solutions Gallery Smoke Task",
        slug: `solutions-smoke-${runId}`,
        description: "throwaway task for solutions.smoke.ts",
        track: "coding",
        difficulty: "beginner",
        language: "python",
        checks: {},
      },
    });
    taskId = task.id;

    const viewer = await makeUser("viewer");
    const authorA = await makeUser("author-a");
    const authorB = await makeUser("author-b");
    const nonPasser = await makeUser("non-passer");
    const failedAuthor = await makeUser("failed-author");

    // viewer + authorA + authorB have each passed the task (viewer's own
    // submission must never appear in its own gallery). authorA passed twice
    // — only the LATEST ("A2") should surface (dedup one-per-author).
    await prisma.submission.create({
      data: { taskId: task.id, userId: viewer.id, code: "viewer-solution", status: "passed", score: 100 },
    });
    const subA1 = await prisma.submission.create({
      data: { taskId: task.id, userId: authorA.id, code: "A1-older", status: "passed", score: 80 },
    });
    // Ensure createdAt ordering is unambiguous (some DBs have low timer
    // resolution) before creating the "later" submission from the same author.
    await new Promise((r) => setTimeout(r, 10));
    const subA2 = await prisma.submission.create({
      data: { taskId: task.id, userId: authorA.id, code: "A2-newer", status: "passed", score: 95 },
    });
    const subB1 = await prisma.submission.create({
      data: { taskId: task.id, userId: authorB.id, code: "B1-solution", status: "passed", score: 90 },
    });
    // nonPasser has only ever failed this task — must be gated the same as
    // never having submitted at all.
    const subFailed = await prisma.submission.create({
      data: { taskId: task.id, userId: nonPasser.id, code: "nonpasser-fail", status: "failed", score: 10 },
    });
    // A submission that IS passed, but by a user unrelated to the like check
    // below (target-must-be-passed check uses this one — kept "failed" so it
    // can double as the "target not passed" like-gate case).
    const subFailedOther = await prisma.submission.create({
      data: { taskId: task.id, userId: failedAuthor.id, code: "failed-other", status: "failed", score: 10 },
    });

    // --- Gate: caller has NOT passed the task -> 403 on the gallery read -----
    await expectThrows(
      "non-passer viewing the gallery is rejected (403 'solve it first')",
      () => competitions.getChallengeSolutions(nonPasser, task.id),
      "Solve it first",
    );

    // --- Gallery for a user who HAS passed -----------------------------------
    const gallery1 = await competitions.getChallengeSolutions(viewer, task.id);
    check("gallery returns exactly 2 solutions (authorA deduped + authorB)", gallery1.solutions.length === 2, `count=${gallery1.solutions.length}`);
    const ids1 = gallery1.solutions.map((s) => s.submissionId);
    check("gallery excludes the viewer's own submission", !ids1.includes((await prisma.submission.findFirstOrThrow({ where: { userId: viewer.id, taskId: task.id } })).id));
    check("gallery includes authorA's LATEST submission (A2)", ids1.includes(subA2.id));
    check("gallery excludes authorA's OLDER submission (A1) — dedup one-per-author", !ids1.includes(subA1.id));
    check("gallery includes authorB's submission", ids1.includes(subB1.id));
    check("gallery excludes the failed/non-passed submissions", !ids1.includes(subFailed.id) && !ids1.includes(subFailedOther.id));

    const rowA2 = gallery1.solutions.find((s) => s.submissionId === subA2.id);
    check("A2 row exposes the submitted code", rowA2?.code === "A2-newer", JSON.stringify(rowA2));
    check("A2 row carries the task's language", rowA2?.language === "python", `language=${rowA2?.language}`);
    check("A2 row starts with likeCount 0 / likedByMe false / exemplar false", rowA2?.likeCount === 0 && rowA2?.likedByMe === false && rowA2?.exemplar === false, JSON.stringify(rowA2));

    // --- Anonymization: no author PII anywhere in the payload ----------------
    const payload = JSON.stringify(gallery1);
    const leakedFields = ["userId", "displayName", "email", "avatarSeed", viewer.email, authorA.email, authorB.email, authorA.displayName, authorB.displayName];
    const leaked = leakedFields.filter((f) => payload.includes(f));
    check("gallery payload leaks no author id/displayName/email/avatarSeed", leaked.length === 0, `leaked=${JSON.stringify(leaked)}`);
    const rowKeys = Object.keys(gallery1.solutions[0] ?? {}).sort();
    check(
      "each row has exactly the documented anonymized shape",
      JSON.stringify(rowKeys) === JSON.stringify(["code", "exemplar", "language", "likeCount", "likedByMe", "submissionId"].sort()),
      `keys=${JSON.stringify(rowKeys)}`,
    );

    // --- Like: gate reuses the same "must have passed" rule -------------------
    await expectThrows(
      "non-passer liking a solution is rejected (403 'solve it first')",
      () => competitions.toggleSolutionLike(nonPasser, subB1.id),
      "Solve it first",
    );

    // --- Like: target submission must itself be passed ------------------------
    await expectThrows(
      "liking a non-passed (failed) submission is rejected",
      () => competitions.toggleSolutionLike(viewer, subFailedOther.id),
      "accepted solutions",
    );

    // --- Like: can't like your own solution -----------------------------------
    await expectThrows(
      "author liking their own passed solution is rejected",
      () => competitions.toggleSolutionLike(authorA, subA2.id),
      "own solution",
    );

    // --- Like: toggle on / off / on, verify count + idempotency ---------------
    const like1 = await competitions.toggleSolutionLike(viewer, subB1.id);
    check("first like: liked=true, likeCount=1", like1.liked === true && like1.likeCount === 1, JSON.stringify(like1));
    const likeRowCountAfter1 = await prisma.solutionLike.count({ where: { submissionId: subB1.id } });
    check("exactly one SolutionLike row exists after the first like", likeRowCountAfter1 === 1, `count=${likeRowCountAfter1}`);

    const like2 = await competitions.toggleSolutionLike(viewer, subB1.id);
    check("second call toggles OFF: liked=false, likeCount=0", like2.liked === false && like2.likeCount === 0, JSON.stringify(like2));
    const likeRowCountAfter2 = await prisma.solutionLike.count({ where: { submissionId: subB1.id } });
    check("SolutionLike row removed after unliking", likeRowCountAfter2 === 0, `count=${likeRowCountAfter2}`);

    const like3 = await competitions.toggleSolutionLike(viewer, subB1.id);
    check("third call toggles back ON: liked=true, likeCount=1 (idempotent, no duplicate rows)", like3.liked === true && like3.likeCount === 1, JSON.stringify(like3));
    const likeRowCountAfter3 = await prisma.solutionLike.count({ where: { submissionId: subB1.id } });
    check("still exactly one SolutionLike row (unique constraint honored)", likeRowCountAfter3 === 1, `count=${likeRowCountAfter3}`);

    // --- Gallery reflects the like: count + likedByMe + ordering --------------
    const gallery2 = await competitions.getChallengeSolutions(viewer, task.id);
    const rowB1 = gallery2.solutions.find((s) => s.submissionId === subB1.id);
    check("gallery shows updated likeCount=1 for B1", rowB1?.likeCount === 1, JSON.stringify(rowB1));
    check("gallery shows likedByMe=true for the viewer who liked it", rowB1?.likedByMe === true, JSON.stringify(rowB1));
    check(
      "liked solution (B1, 1 like) sorts ahead of unliked solution (A2, 0 likes)",
      gallery2.solutions.findIndex((s) => s.submissionId === subB1.id) < gallery2.solutions.findIndex((s) => s.submissionId === subA2.id),
      JSON.stringify(gallery2.solutions.map((s) => s.submissionId)),
    );

    // --- Exemplar toggle (teacher/admin curation) ------------------------------
    const ex1 = await competitions.toggleSolutionExemplar(subB1.id);
    check("exemplar toggle sets isExemplar=true", ex1.isExemplar === true, JSON.stringify(ex1));
    const gallery3 = await competitions.getChallengeSolutions(viewer, task.id);
    check("gallery reflects exemplar=true for B1", gallery3.solutions.find((s) => s.submissionId === subB1.id)?.exemplar === true);
    const ex2 = await competitions.toggleSolutionExemplar(subB1.id);
    check("exemplar toggle flips back to false", ex2.isExemplar === false, JSON.stringify(ex2));
    await expectThrows(
      "marking a non-passed submission as exemplar is rejected",
      () => competitions.toggleSolutionExemplar(subFailedOther.id),
      "accepted solutions",
    );
  } finally {
    // Deleting the throwaway Task cascades its Submissions, which cascades
    // their SolutionLikes — then remove the throwaway users.
    if (taskId) await prisma.task.deleteMany({ where: { id: taskId } });
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
