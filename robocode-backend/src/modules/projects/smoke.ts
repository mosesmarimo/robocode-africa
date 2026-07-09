// Smoke test for ProjectsService.remix (attribution + idempotent author
// reward + visibility gate). No test framework (repo convention): hand-rolled
// PASS/FAIL checks running against the real dev DB via PrismaService. Creates
// throwaway users/projects under a unique `projtest-<random>-*` prefix and
// deletes everything it created in a `finally` block.
//
// Run: cd robocode-backend && npx tsx src/modules/projects/smoke.ts
import { PrismaService } from "../../prisma/prisma.service";
import { PointsService } from "../../common/points.service";
import { NotifyService } from "../../common/notify.service";
import { AiService } from "../ai/ai.service";
import { ProjectsService } from "./projects.service";
import { POINTS } from "../../domain/constants";
import { hashPassword } from "../../auth/password.util";
import type { AuthUser } from "../../auth/auth-user.type";

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
  // AiService is only reached via the fire-and-forget autoRank path, which
  // ProjectsService.remix never triggers — a bare instance (no real API key)
  // is enough to satisfy the constructor.
  const ai = new AiService(prisma);
  const projects = new ProjectsService(prisma, points, notify, ai);
  await prisma.$connect();

  const runId = Math.random().toString(36).slice(2, 10);
  const emailPrefix = `projtest-${runId}`;
  const createdUserIds: string[] = [];
  const createdProjectIds: string[] = [];
  const passwordHash = await hashPassword("password123");

  async function makeUser(tenantId: string, suffix: string) {
    const user = await prisma.user.create({
      data: {
        tenantId,
        email: `${emailPrefix}-${suffix}@example.com`,
        displayName: `ProjTest ${suffix}`,
        passwordHash,
        role: "student",
        status: "active",
        isMinor: false,
      },
      include: { tenant: true },
    });
    createdUserIds.push(user.id);
    return user as AuthUser;
  }

  async function makeProject(owner: AuthUser, suffix: string, visibility: "private" | "tenant" | "public") {
    const project = await prisma.project.create({
      data: {
        ownerId: owner.id,
        tenantId: owner.tenantId,
        title: `ProjTest Source ${suffix}`,
        kind: "robotics",
        boardType: "arduino-uno",
        diagram: { parts: [], connections: [] },
        visibility,
      },
    });
    createdProjectIds.push(project.id);
    await prisma.codeFile.create({
      data: { projectId: project.id, filename: "sketch.ino", language: "arduino", content: "// hello" },
    });
    return project;
  }

  try {
    const tenants = await prisma.tenant.findMany({ take: 1, select: { id: true } });
    if (tenants.length < 1) throw new Error("smoke test needs at least 1 tenant in the dev DB");
    const [tenantA] = tenants;

    // --- (a) remixing a private project you don't own is rejected ------------
    {
      const author = await makeUser(tenantA.id, "author-a");
      const remixer = await makeUser(tenantA.id, "remixer-a");
      const source = await makeProject(author, "a", "private");

      let threw = false;
      try {
        await projects.remix(remixer, source.id);
      } catch {
        threw = true;
      }
      check("(a) remixing a private project you don't own is rejected", threw);

      const remixCount = await prisma.project.count({ where: { remixedFromId: source.id } });
      check("(a) no remix project was created", remixCount === 0, `count=${remixCount}`);
    }

    // --- (b) remixing your OWN private project is allowed, no self-payout ----
    {
      const author = await makeUser(tenantA.id, "author-b");
      const source = await makeProject(author, "b", "private");

      const authorBefore = await prisma.user.findUniqueOrThrow({ where: { id: author.id } });
      const result = await projects.remix(author, source.id);
      createdProjectIds.push(result.id);
      const authorAfter = await prisma.user.findUniqueOrThrow({ where: { id: author.id } });

      check(
        "(b) self-remix of a private project succeeds",
        !!result.id,
      );
      check(
        "(b) self-remix does not pay the author",
        authorAfter.roboPoints === authorBefore.roboPoints,
        `before=${authorBefore.roboPoints} after=${authorAfter.roboPoints}`,
      );
    }

    // --- (c) remix a public project twice by the same user -> author credited
    //         exactly once, and a notification is sent exactly once ----------
    {
      const author = await makeUser(tenantA.id, "author-c");
      const remixer = await makeUser(tenantA.id, "remixer-c");
      const source = await makeProject(author, "c", "public");

      const authorBefore = await prisma.user.findUniqueOrThrow({ where: { id: author.id } });

      const first = await projects.remix(remixer, source.id);
      createdProjectIds.push(first.id);
      const second = await projects.remix(remixer, source.id);
      createdProjectIds.push(second.id);

      check("(c) two remixes create two distinct projects", first.id !== second.id);

      const remixRow = await prisma.project.findUniqueOrThrow({ where: { id: first.id } });
      check("(c) remix is owned by the remixer", remixRow.ownerId === remixer.id);
      check("(c) remix title is suffixed", remixRow.title === `${source.title} (remix)`, remixRow.title);
      check("(c) remix.remixedFromId points at the source", remixRow.remixedFromId === source.id);
      check("(c) remix visibility defaults to private", remixRow.visibility === "private", remixRow.visibility);

      const remixFiles = await prisma.codeFile.findMany({ where: { projectId: first.id } });
      check(
        "(c) remix copies the source's files",
        remixFiles.length === 1 && remixFiles[0].content === "// hello",
        JSON.stringify(remixFiles),
      );

      const ledgerCount = await prisma.roboPointLedger.count({
        where: { idemKey: `remix:${source.id}:${remixer.id}` },
      });
      check("(c) exactly one author-reward ledger row across both remixes", ledgerCount === 1, `count=${ledgerCount}`);

      const authorAfter = await prisma.user.findUniqueOrThrow({ where: { id: author.id } });
      check(
        "(c) author credited +10 exactly once despite two remixes",
        authorAfter.roboPoints === authorBefore.roboPoints + POINTS.PROJECT_REMIX_AUTHOR,
        `before=${authorBefore.roboPoints} after=${authorAfter.roboPoints}`,
      );

      const notifCount = await prisma.notification.count({ where: { userId: author.id, type: "remix" } });
      check("(c) exactly one remix notification sent to the author", notifCount === 1, `count=${notifCount}`);
    }

    // --- (d) remixing a "tenant"-shared project is allowed within the tenant -
    {
      const author = await makeUser(tenantA.id, "author-d");
      const remixer = await makeUser(tenantA.id, "remixer-d");
      const source = await makeProject(author, "d", "tenant");

      const result = await projects.remix(remixer, source.id);
      createdProjectIds.push(result.id);
      check("(d) remixing a tenant-shared project within the tenant succeeds", !!result.id);
    }

    // --- (e) a SHARED project (shareId set, visibility still "private") can
    //         be remixed by a non-owner — this is the read-only share-link
    //         path (`readonly-studio-app.tsx`'s "Remix in Studio" button),
    //         which was 403ing before this fix since a shared link doesn't
    //         change `visibility` off "private". Author credited once. -----
    {
      const author = await makeUser(tenantA.id, "author-e");
      const remixer = await makeUser(tenantA.id, "remixer-e");
      const source = await makeProject(author, "e", "private");
      await prisma.project.update({ where: { id: source.id }, data: { shareId: `projtest-share-${runId}` } });

      const authorBefore = await prisma.user.findUniqueOrThrow({ where: { id: author.id } });

      const result = await projects.remix(remixer, source.id);
      createdProjectIds.push(result.id);
      check("(e) remixing a shared (shareId set) private project succeeds", !!result.id);

      const authorAfter = await prisma.user.findUniqueOrThrow({ where: { id: author.id } });
      check(
        "(e) author credited +10 for the shared-project remix",
        authorAfter.roboPoints === authorBefore.roboPoints + POINTS.PROJECT_REMIX_AUTHOR,
        `before=${authorBefore.roboPoints} after=${authorAfter.roboPoints}`,
      );

      const secondResult = await projects.remix(remixer, source.id);
      createdProjectIds.push(secondResult.id);
      const authorAfterSecond = await prisma.user.findUniqueOrThrow({ where: { id: author.id } });
      check(
        "(e) a second remix by the same remixer does not re-pay the author",
        authorAfterSecond.roboPoints === authorAfter.roboPoints,
        `after-first=${authorAfter.roboPoints} after-second=${authorAfterSecond.roboPoints}`,
      );
    }

    // --- (f) a purely-private, unshared, unpublished project is still
    //         rejected for a non-owner (nothing shared to remix) -----------
    {
      const author = await makeUser(tenantA.id, "author-f");
      const remixer = await makeUser(tenantA.id, "remixer-f");
      const source = await makeProject(author, "f", "private");

      let threw = false;
      try {
        await projects.remix(remixer, source.id);
      } catch {
        threw = true;
      }
      check("(f) remixing a purely-private unshared project is still rejected", threw);

      const remixCount = await prisma.project.count({ where: { remixedFromId: source.id } });
      check("(f) no remix project was created", remixCount === 0, `count=${remixCount}`);
    }
  } finally {
    // Cleanup: delete remix projects first (self-referencing FK), then source
    // projects (cascades codeFiles), then the throwaway users (cascades
    // ledger rows + notifications).
    if (createdProjectIds.length > 0) {
      await prisma.project.updateMany({
        where: { id: { in: createdProjectIds } },
        data: { remixedFromId: null },
      });
      await prisma.project.deleteMany({ where: { id: { in: createdProjectIds } } });
    }
    if (createdUserIds.length > 0) {
      await prisma.auditLog.deleteMany({ where: { actorId: { in: createdUserIds } } });
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
