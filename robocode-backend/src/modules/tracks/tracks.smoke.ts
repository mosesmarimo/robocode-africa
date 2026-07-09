// Smoke test for TracksService (learning tracks + certificates): derived
// progress with zero completions, the three done-detection mechanisms
// (Enrollment.completedAt, a course-complete ledger row, a passed
// Submission), lazy certificate issuance on full completion, idempotent
// re-issuance, the PII-safe public verify payload, and the `current` item
// marker. No test framework (repo convention): hand-rolled PASS/FAIL checks
// running against the real dev DB via PrismaService. Uses the real
// "python-path" track seeded by prisma/content/tracks.ts (run
// `npx tsx prisma/seed-content.ts` first) and a throwaway user under a
// unique `trktest-<random>` prefix; deletes everything it created in a
// `finally` block.
//
// Run: cd robocode-backend && npx tsx src/modules/tracks/tracks.smoke.ts
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PointsService } from "../../common/points.service";
import { StreakService } from "../../common/streak.service";
import { GamificationService } from "../../common/gamification.service";
import { NotifyService } from "../../common/notify.service";
import { TracksService } from "./tracks.service";
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

async function main() {
  const prisma = new PrismaService();
  const notifier = new NotifyService(prisma);
  const points = new PointsService(prisma, notifier);
  const streak = new StreakService(prisma, points);
  const gamification = new GamificationService(prisma, points, streak);
  const tracks = new TracksService(prisma, gamification, notifier);
  await prisma.$connect();

  const runId = Math.random().toString(36).slice(2, 10);
  const emailPrefix = `trktest-${runId}`;
  let userId: string | null = null;

  try {
    // --- fixtures: the real "python-path" track (seeded by
    // prisma/content/tracks.ts) + a throwaway user -----------------------
    const track = await prisma.learningTrack.findUnique({
      where: { slug: "python-path" },
      include: { items: { orderBy: { order: "asc" }, select: { order: true, courseId: true, taskId: true } } },
    });
    if (!track) throw new Error('smoke test needs the "python-path" track — run `npx tsx prisma/seed-content.ts` first');
    check("fixture: python-path has exactly 3 items", track.items.length === 3, JSON.stringify(track.items));

    const [tutorialPython, langPython] = await Promise.all([
      prisma.course.findUniqueOrThrow({ where: { slug: "tutorial-python" }, select: { id: true } }),
      prisma.course.findUniqueOrThrow({ where: { slug: "lang-python" }, select: { id: true } }),
    ]);
    const challengePython = await prisma.task.findUniqueOrThrow({ where: { slug: "challenge-python" }, select: { id: true } });

    const tenants = await prisma.tenant.findMany({ take: 1, select: { id: true } });
    if (tenants.length < 1) throw new Error("smoke test needs at least 1 tenant in the dev DB");
    const [tenant] = tenants;

    const passwordHash = await hashPassword("password123");
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: `${emailPrefix}@example.com`,
        // Two-word displayName so the holder assertion (first name + last
        // initial) in (d) below is meaningful.
        displayName: "Ada Lovelace",
        passwordHash,
        role: "student",
        status: "active",
        isMinor: false,
      },
    });
    userId = user.id;

    // --- (a) no completions -> doneCount 0, no certificate ----------------
    {
      const { tracks: rows } = await tracks.listTracks(user.id);
      const row = rows.find((r) => r.slug === "python-path");
      check("(a) listTracks includes python-path", !!row, JSON.stringify(rows.map((r) => r.slug)));
      check(
        "(a) python-path shows itemCount 3 / doneCount 0 / no certificate",
        row?.itemCount === 3 && row?.doneCount === 0 && row?.certificate === null,
        JSON.stringify(row),
      );
    }

    // --- (e) getTrack marks `current` on the first not-done item ----------
    {
      const detail = await tracks.getTrack(user.id, "python-path");
      check(
        "(e) before any completion, item 0 (tutorial-python) is current",
        detail.items[0]?.slug === "tutorial-python" && detail.items[0]?.current === true && detail.items[0]?.done === false,
        JSON.stringify(detail.items),
      );
      check(
        "(e) items 1/2 are not current while item 0 is incomplete",
        detail.items[1]?.current === false && detail.items[2]?.current === false,
        JSON.stringify(detail.items),
      );
    }

    // --- item 0 done via Enrollment.completedAt ---------------------------
    await prisma.enrollment.create({
      data: { userId: user.id, courseId: tutorialPython.id, completedAt: new Date() },
    });
    {
      const detail = await tracks.getTrack(user.id, "python-path");
      check(
        "(e) item 0 done via Enrollment.completedAt -> item 1 (lang-python) becomes current",
        detail.items[0]?.done === true && detail.items[1]?.slug === "lang-python" && detail.items[1]?.current === true,
        JSON.stringify(detail.items),
      );
    }

    // --- item 1 done via a course-complete ledger row ---------------------
    await prisma.roboPointLedger.create({
      data: {
        userId: user.id,
        delta: 100,
        reason: "task:course-complete",
        refType: "course-complete",
        refId: langPython.id,
        idemKey: `task:course-complete:${langPython.id}:${user.id}`,
        language: "python",
        track: "coding",
      },
    });
    {
      const detail = await tracks.getTrack(user.id, "python-path");
      check(
        "(e) item 1 done via ledger course-complete row -> item 2 (challenge-python) becomes current",
        detail.items[1]?.done === true && detail.items[2]?.slug === "challenge-python" && detail.items[2]?.current === true,
        JSON.stringify(detail.items),
      );
    }

    // --- item 2 (task) done via a passed Submission -> track now 100% -----
    await prisma.submission.create({
      data: { taskId: challengePython.id, userId: user.id, status: "passed", code: "print(sum(range(1, 101)))" },
    });

    // --- (b) listTracks lazily issues the certificate + track-complete ledger row
    {
      const { tracks: rows } = await tracks.listTracks(user.id);
      const row = rows.find((r) => r.slug === "python-path");
      check(
        "(b) listTracks: python-path now fully done with a certificate",
        row?.doneCount === 3 && row?.itemCount === 3 && !!row?.certificate,
        JSON.stringify(row),
      );

      const certCount = await prisma.certificate.count({ where: { userId: user.id, kind: "track", trackId: track.id } });
      check("(b) exactly one Certificate row exists", certCount === 1, String(certCount));

      const ledgerRow = await prisma.roboPointLedger.findUnique({
        where: { idemKey: `task:track-complete:${track.id}:${user.id}` },
      });
      check(
        "(b) a track-complete ledger row exists with delta 150",
        !!ledgerRow && ledgerRow.delta === 150,
        JSON.stringify(ledgerRow),
      );
    }

    // --- (c) calling ensureTrackCompletion again is idempotent -------------
    {
      await tracks.ensureTrackCompletion(user.id, track.id);
      await tracks.ensureTrackCompletion(user.id, track.id);

      const certCount = await prisma.certificate.count({ where: { userId: user.id, kind: "track", trackId: track.id } });
      check("(c) still exactly ONE certificate after repeat calls", certCount === 1, String(certCount));

      const ledgerCount = await prisma.roboPointLedger.count({
        where: { userId: user.id, refType: "track-complete", refId: track.id },
      });
      check("(c) still exactly ONE track-complete ledger row after repeat calls", ledgerCount === 1, String(ledgerCount));
    }

    // --- (d) verifyCertificate: PII-safe holder name; unknown code 404s ----
    {
      const cert = await prisma.certificate.findFirstOrThrow({ where: { userId: user.id, kind: "track", trackId: track.id } });
      const payload = await tracks.verifyCertificate(cert.code);
      check(
        "(d) verifyCertificate returns holder as first-name + last-initial",
        payload.holder === "Ada L.",
        payload.holder,
      );
      const serialized = JSON.stringify(payload);
      check(
        "(d) verify payload has NO email/id fields",
        !("email" in payload) && !("id" in payload) && !("userId" in payload) && !serialized.toLowerCase().includes("email"),
        serialized,
      );

      let notFoundThrew = false;
      try {
        await tracks.verifyCertificate("RC-NOPE0-NOPE0");
      } catch (e) {
        notFoundThrew = e instanceof NotFoundException;
      }
      check("(d) verifyCertificate 404s for an unknown code", notFoundThrew);
    }
  } finally {
    // --- (f) cleanup: delete everything this smoke created -----------------
    if (userId) {
      await prisma.notification.deleteMany({ where: { userId } });
      await prisma.certificate.deleteMany({ where: { userId } });
      await prisma.roboPointLedger.deleteMany({ where: { userId } });
      await prisma.submission.deleteMany({ where: { userId } });
      await prisma.enrollment.deleteMany({ where: { userId } });
      await prisma.userBadge.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
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
