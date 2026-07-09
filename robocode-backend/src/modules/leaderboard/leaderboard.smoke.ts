// Smoke test for LeaderboardService (per-language ranking, track ranking sums
// only its own track's rows, weekly window excludes older rows, own-rank
// returned when outside the top-N, cross-tenant vs tenant-filtered scope). No
// test framework (repo convention): hand-rolled PASS/FAIL checks running
// against the real dev DB via PrismaService. Creates throwaway users (and
// their tagged RoboPointLedger rows directly — no need to route through
// GamificationService for pure ranking behaviour) under a unique
// `lbtest-<random>` prefix and deletes everything it created (ledger rows
// cascade-delete with their user) in a `finally` block.
//
// Run: cd robocode-backend && npx tsx src/modules/leaderboard/leaderboard.smoke.ts
import { PrismaService } from "../../prisma/prisma.service";
import { LeaderboardService } from "./leaderboard.service";
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
  const leaderboard = new LeaderboardService(prisma);
  await prisma.$connect();

  const runId = Math.random().toString(36).slice(2, 10);
  const emailPrefix = `lbtest-${runId}`;
  const createdUserIds: string[] = [];
  const passwordHash = await hashPassword("password123");

  try {
    const tenants = await prisma.tenant.findMany({ take: 2, select: { id: true } });
    if (tenants.length < 2) throw new Error("smoke test needs at least 2 tenants in the dev DB");
    const [tenantA, tenantB] = tenants;

    async function makeUser(tenantId: string, suffix: string) {
      const user = await prisma.user.create({
        data: {
          tenantId,
          email: `${emailPrefix}-${suffix}@example.com`,
          displayName: `LBTest ${suffix}`,
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

    async function ledgerRow(userId: string, delta: number, tags: { language?: string; track?: string }, createdAt?: Date) {
      await prisma.roboPointLedger.create({
        data: {
          userId,
          delta,
          reason: "smoke",
          refType: "smoke",
          language: tags.language,
          track: tags.track,
          ...(createdAt ? { createdAt } : {}),
        },
      });
    }

    // --- (a) per-language ranking is correct (sums multiple rows per user) ----
    {
      const u1 = await makeUser(tenantA.id, "a-low");
      const u2 = await makeUser(tenantA.id, "a-high");
      const u3 = await makeUser(tenantA.id, "a-mid");
      await ledgerRow(u1.id, 10, { language: "typescript", track: "coding" });
      await ledgerRow(u2.id, 30, { language: "typescript", track: "coding" });
      await ledgerRow(u2.id, 20, { language: "typescript", track: "coding" }); // second row -> sums to 50
      await ledgerRow(u3.id, 25, { language: "typescript", track: "coding" });

      const result = await leaderboard.byLanguage(u1 as AuthUser, "typescript", "all");
      check("(a) 3 rows returned", result.rows.length === 3, `rows=${result.rows.length}`);
      check(
        "(a) ranked desc: u2(50) > u3(25) > u1(10)",
        result.rows[0]?.userId === u2.id &&
          result.rows[0]?.xp === 50 &&
          result.rows[1]?.userId === u3.id &&
          result.rows[1]?.xp === 25 &&
          result.rows[2]?.userId === u1.id &&
          result.rows[2]?.xp === 10,
        JSON.stringify(result.rows),
      );
      check("(a) ranks are 1,2,3", result.rows.map((r) => r.rank).join(",") === "1,2,3");
      check("(a) row shape has no email field", !("email" in result.rows[0]));
      check("(a) me is the caller's own rank (u1, rank 3)", result.me?.rank === 3 && result.me?.xp === 10, JSON.stringify(result.me));
    }

    // --- (b) track ranking sums only its own track's rows ---------------------
    {
      const u = await makeUser(tenantA.id, "b-mixed");
      await ledgerRow(u.id, 30, { language: "arduino", track: "robotics" });
      await ledgerRow(u.id, 20, { language: "python", track: "coding" });

      const robotics = await leaderboard.byTrack(u as AuthUser, "robotics", "all");
      const coding = await leaderboard.byTrack(u as AuthUser, "coding", "all");
      check("(b) robotics track sums only the robotics-tagged row (30)", robotics.me?.xp === 30, `xp=${robotics.me?.xp}`);
      check("(b) coding track sums only the coding-tagged row (20)", coding.me?.xp === 20, `xp=${coding.me?.xp}`);
    }

    // --- (c) weekly window excludes older rows ---------------------------------
    {
      const u = await makeUser(tenantA.id, "c-weekly");
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      await ledgerRow(u.id, 40, { language: "go", track: "coding" }); // now (within the week)
      await ledgerRow(u.id, 100, { language: "go", track: "coding" }, tenDaysAgo); // outside the week

      const weekly = await leaderboard.byLanguage(u as AuthUser, "go", "week");
      const allTime = await leaderboard.byLanguage(u as AuthUser, "go", "all");
      check("(c) weekly scope excludes the 10-day-old row (xp=40 only)", weekly.me?.xp === 40, `xp=${weekly.me?.xp}`);
      check("(c) all-time scope includes both rows (xp=140)", allTime.me?.xp === 140, `xp=${allTime.me?.xp}`);
    }

    // --- (d) tenant filter vs cross-tenant default ------------------------------
    {
      const uA = await makeUser(tenantA.id, "d-tenant-a");
      const uB = await makeUser(tenantB.id, "d-tenant-b");
      await ledgerRow(uA.id, 40, { language: "csharp", track: "coding" });
      await ledgerRow(uB.id, 60, { language: "csharp", track: "coding" });

      const crossTenant = await leaderboard.byLanguage(uA as AuthUser, "csharp", "all");
      check(
        "(d) cross-tenant (no filter) sees both tenants' users",
        crossTenant.rows.some((r) => r.userId === uA.id) && crossTenant.rows.some((r) => r.userId === uB.id),
        JSON.stringify(crossTenant.rows),
      );
      check(
        "(d) cross-tenant ranks tenantB's higher xp first",
        crossTenant.rows[0]?.userId === uB.id,
        JSON.stringify(crossTenant.rows),
      );

      const tenantFiltered = await leaderboard.byLanguage(uA as AuthUser, "csharp", "all", tenantA.id);
      check(
        "(d) tenant filter excludes the other tenant's user",
        tenantFiltered.rows.length === 1 && tenantFiltered.rows[0]?.userId === uA.id,
        JSON.stringify(tenantFiltered.rows),
      );
    }

    // --- (e) caller's own rank is returned even when outside the top-N (50) ---
    {
      const fillerIds = Array.from({ length: 51 }, (_, i) => `lbtest-filler-${runId}-${i}`);
      await prisma.user.createMany({
        data: fillerIds.map((id, i) => ({
          id,
          tenantId: tenantA.id,
          email: `${emailPrefix}-filler-${i}@example.com`,
          displayName: `Filler ${i}`,
          passwordHash,
          role: "student",
          status: "active",
          isMinor: false,
        })),
      });
      createdUserIds.push(...fillerIds);
      await prisma.roboPointLedger.createMany({
        data: fillerIds.map((id, i) => ({
          userId: id,
          delta: 1000 - i, // 1000 down to 950 — all rank ahead of the target user below
          reason: "smoke",
          refType: "smoke",
          language: "rust",
          track: "coding",
        })),
      });
      const target = await makeUser(tenantA.id, "e-outside-topn");
      await ledgerRow(target.id, 5, { language: "rust", track: "coding" }); // lowest of all 52 earners

      const result = await leaderboard.byLanguage(target as AuthUser, "rust", "all");
      check("(e) top-N caps at 50 rows", result.rows.length === 50, `rows=${result.rows.length}`);
      check("(e) target user not present in the top-50 rows", !result.rows.some((r) => r.userId === target.id));
      check(
        "(e) target user's own rank is 52 (51 fillers + itself, all ranked ahead)",
        result.me?.rank === 52 && result.me?.xp === 5,
        JSON.stringify(result.me),
      );
    }

    // --- (f) unknown language/track validation (400) ---------------------------
    {
      const { parseLanguageParam, parseTrackParam } = await import("./dto");
      let langThrew = false;
      try {
        parseLanguageParam("cobol");
      } catch {
        langThrew = true;
      }
      check("(f) unknown language rejected", langThrew);
      let trackThrew = false;
      try {
        parseTrackParam("ai");
      } catch {
        trackThrew = true;
      }
      check("(f) unknown track rejected (ai is not a gamification track)", trackThrew);
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
