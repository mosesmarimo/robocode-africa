// Smoke test for StreakService.touch (same-day no-op, consecutive-day
// increment, gap reset, milestone-pays-once, prefs merge doesn't clobber
// other keys, forgiving-streak embers + milestone freeze). No test
// framework (repo convention): hand-rolled PASS/FAIL checks running against
// the real dev DB via PrismaService. Creates throwaway users under a unique
// `streaktest-<random>-*` prefix and deletes everything it created in a
// `finally` block.
//
// Run: cd robocode-backend && npx tsx src/common/streak.smoke.ts
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { PointsService } from "./points.service";
import { NotifyService } from "./notify.service";
import { StreakService } from "./streak.service";
import { POINTS } from "../domain/constants";
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

function dateStr(daysAgoFromToday: number, today: string): string {
  const d = new Date(`${today}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - daysAgoFromToday);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const prisma = new PrismaService();
  const notify = new NotifyService(prisma);
  const points = new PointsService(prisma, notify);
  const streak = new StreakService(prisma, points);
  await prisma.$connect();

  const runId = Math.random().toString(36).slice(2, 10);
  const emailPrefix = `streaktest-${runId}`;
  const createdUserIds: string[] = [];
  const passwordHash = await hashPassword("password123");

  // Fixed "today" for the whole test so day arithmetic is deterministic
  // regardless of when the smoke actually runs.
  const TODAY = "2026-03-15";
  const YESTERDAY = dateStr(1, TODAY);
  const TWO_DAYS_AGO = dateStr(2, TODAY);

  async function makeUser(tenantId: string, suffix: string, prefs?: Record<string, unknown>) {
    const user = await prisma.user.create({
      data: {
        tenantId,
        email: `${emailPrefix}-${suffix}@example.com`,
        displayName: `StreakTest ${suffix}`,
        passwordHash,
        role: "student",
        status: "active",
        isMinor: false,
        prefs: (prefs ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    createdUserIds.push(user.id);
    return user;
  }

  try {
    const tenants = await prisma.tenant.findMany({ take: 1, select: { id: true } });
    if (tenants.length < 1) throw new Error("smoke test needs at least 1 tenant in the dev DB");
    const [tenantA] = tenants;

    // --- (a) first-ever touch starts the streak at 1 -------------------------
    {
      const user = await makeUser(tenantA.id, "first-touch");
      const result = await streak.touch(user.id, TODAY);
      check("(a) first touch starts count at 1", result.count === 1, `count=${result.count}`);

      const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { prefs: true } });
      const prefs = row.prefs as { streak?: { count: number; lastActiveDate: string } };
      check(
        "(a) prefs.streak persisted",
        prefs.streak?.count === 1 && prefs.streak?.lastActiveDate === TODAY,
        JSON.stringify(prefs),
      );
    }

    // --- (b) same-day second touch is a no-op ---------------------------------
    {
      const user = await makeUser(tenantA.id, "same-day", { streak: { count: 4, lastActiveDate: TODAY } });
      const result = await streak.touch(user.id, TODAY);
      check("(b) same-day touch is a no-op (count unchanged)", result.count === 4, `count=${result.count}`);
    }

    // --- (c) touching on the consecutive next day increments ------------------
    {
      const user = await makeUser(tenantA.id, "consecutive", { streak: { count: 4, lastActiveDate: YESTERDAY } });
      const result = await streak.touch(user.id, TODAY);
      check("(c) consecutive-day touch increments", result.count === 5, `count=${result.count}`);
    }

    // --- (d) touching after a gap (>1 day) resets to 1 ------------------------
    {
      const user = await makeUser(tenantA.id, "gap", { streak: { count: 9, lastActiveDate: TWO_DAYS_AGO } });
      const result = await streak.touch(user.id, TODAY);
      check("(d) gapped touch resets to 1", result.count === 1, `count=${result.count}`);
    }

    // --- (e) merge into prefs doesn't clobber unrelated keys ------------------
    {
      const user = await makeUser(tenantA.id, "prefs-merge", { theme: "dark", streak: { count: 2, lastActiveDate: YESTERDAY } });
      await streak.touch(user.id, TODAY);
      const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { prefs: true } });
      const prefs = row.prefs as { theme?: string; streak?: { count: number } };
      check("(e) unrelated prefs key survives the streak update", prefs.theme === "dark", JSON.stringify(prefs));
      check("(e) streak still updated alongside it", prefs.streak?.count === 3, JSON.stringify(prefs));
    }

    // --- (f) milestone (3) pays exactly once, even across a reset+reclimb ----
    {
      const user = await makeUser(tenantA.id, "milestone");
      // Day 1, 2, 3: climb straight to the count=3 milestone.
      await streak.touch(user.id, dateStr(2, TODAY)); // count=1
      await streak.touch(user.id, dateStr(1, TODAY)); // count=2
      const atThree = await streak.touch(user.id, TODAY); // count=3 -> milestone
      check("(f) reaches milestone count 3", atThree.count === 3, `count=${atThree.count}`);

      const userAfterMilestone = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      const ledgerCount = await prisma.roboPointLedger.count({ where: { idemKey: `streak-milestone:${user.id}:3` } });
      check("(f) exactly one milestone ledger row at count=3", ledgerCount === 1, `count=${ledgerCount}`);
      check(
        "(f) milestone bonus applied to roboPoints",
        userAfterMilestone.roboPoints === POINTS.DAILY_STREAK,
        `roboPoints=${userAfterMilestone.roboPoints}`,
      );

      // Break the streak (gap), then re-climb back through count=3 — must NOT
      // pay a second time.
      const gapDay = dateStr(-10, TODAY); // 10 days after TODAY — definitely a gap from TODAY
      await streak.touch(user.id, gapDay); // count resets to 1
      const nextDay = dateStr(-11, TODAY);
      await streak.touch(user.id, nextDay); // count=2
      const thirdDay = dateStr(-12, TODAY);
      const reclimbed = await streak.touch(user.id, thirdDay); // count=3 again
      check("(f) re-climbs back to count 3 after a reset", reclimbed.count === 3, `count=${reclimbed.count}`);

      const ledgerCountAfter = await prisma.roboPointLedger.count({ where: { idemKey: `streak-milestone:${user.id}:3` } });
      check("(f) still exactly one milestone ledger row after re-climb", ledgerCountAfter === 1, `count=${ledgerCountAfter}`);

      const userFinal = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      check(
        "(f) milestone bonus not paid a second time",
        userFinal.roboPoints === POINTS.DAILY_STREAK,
        `roboPoints=${userFinal.roboPoints}`,
      );
    }

    // --- (g) advancing to a count that's a multiple of 3 banks an ember ------
    {
      const user = await makeUser(tenantA.id, "ember-earn", { streak: { count: 2, lastActiveDate: YESTERDAY, embers: 0 } });
      const result = await streak.touch(user.id, TODAY);
      check(
        "(g) advancing to count 3 banks an ember",
        result.count === 3 && result.embers === 1,
        JSON.stringify(result),
      );
    }

    // --- (h) a 1-day miss WITH an ember preserves + advances the streak ------
    {
      const user = await makeUser(tenantA.id, "ember-spend", { streak: { count: 5, lastActiveDate: TWO_DAYS_AGO, embers: 1 } });
      const result = await streak.touch(user.id, TODAY);
      check(
        "(h) 1-day miss with an ember preserves + advances the streak",
        result.count === 6 && result.embers === 0 && result.emberSpent === true,
        JSON.stringify(result),
      );

      const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { prefs: true } });
      const prefs = row.prefs as { streak?: { count: number; lastActiveDate: string; embers: number } };
      check(
        "(h) persisted streak reflects the spent ember",
        prefs.streak?.count === 6 && prefs.streak?.embers === 0 && prefs.streak?.lastActiveDate === TODAY,
        JSON.stringify(prefs),
      );
    }

    // --- (i) a 1-day miss with 0 embers resets to 1 --------------------------
    {
      const user = await makeUser(tenantA.id, "ember-spend-none", { streak: { count: 5, lastActiveDate: TWO_DAYS_AGO, embers: 0 } });
      const result = await streak.touch(user.id, TODAY);
      check(
        "(i) 1-day miss with no embers resets to 1",
        result.count === 1 && result.emberSpent === undefined,
        JSON.stringify(result),
      );
    }

    // --- (j) embers cap at MAX_EMBERS (3) -------------------------------------
    {
      const user = await makeUser(tenantA.id, "ember-cap", { streak: { count: 8, lastActiveDate: YESTERDAY, embers: 3 } });
      const result = await streak.touch(user.id, TODAY); // count -> 9 (multiple of 3), already at cap
      check("(j) embers cap at MAX_EMBERS", result.count === 9 && result.embers === 3, JSON.stringify(result));
    }

    // --- (k) same-day touch is still a no-op, embers pass through unchanged --
    {
      const user = await makeUser(tenantA.id, "same-day-embers", {
        streak: { count: 4, lastActiveDate: TODAY, embers: 2, frozenUntil: dateStr(-3, TODAY) },
      });
      const result = await streak.touch(user.id, TODAY);
      check(
        "(k) same-day touch is a no-op and reports current embers",
        result.count === 4 && result.embers === 2,
        JSON.stringify(result),
      );
    }

    // --- (l) milestone at 7 grants a freeze that preserves a 2-day gap -------
    {
      // day0 -> day1 is a normal consecutive-day advance (count 6 -> 7),
      // which crosses the freeze milestone and grants frozenUntil = day1+2.
      const day0 = dateStr(6, TODAY);
      const day1 = dateStr(5, TODAY); // day0 + 1
      const day3 = dateStr(3, TODAY); // day1 + 2

      const user = await makeUser(tenantA.id, "freeze-milestone", { streak: { count: 6, lastActiveDate: day0, embers: 0 } });
      const atSeven = await streak.touch(user.id, day1);
      check("(l) reaches milestone count 7", atSeven.count === 7, `count=${atSeven.count}`);

      const rowAfterMilestone = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { prefs: true } });
      const prefsAfterMilestone = rowAfterMilestone.prefs as { streak?: { frozenUntil?: string } };
      check(
        "(l) milestone grants a freeze valid through day+2",
        prefsAfterMilestone.streak?.frozenUntil === day3,
        JSON.stringify(prefsAfterMilestone),
      );

      // The user misses day1+1 entirely and doesn't return until day3 (a
      // 2-day gap) — the freeze (not an ember; embers are 0 here) absorbs it.
      const afterGap = await streak.touch(user.id, day3);
      check(
        "(l) freeze preserves the 2-day gap and advances the streak",
        afterGap.count === 8 && afterGap.frozen === true,
        JSON.stringify(afterGap),
      );

      const rowFinal = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { prefs: true } });
      const prefsFinal = rowFinal.prefs as { streak?: { frozenUntil?: string; count: number; lastActiveDate: string } };
      check(
        "(l) freeze is consumed (cleared) after use",
        prefsFinal.streak?.frozenUntil === undefined && prefsFinal.streak?.count === 8 && prefsFinal.streak?.lastActiveDate === day3,
        JSON.stringify(prefsFinal),
      );
    }
  } finally {
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
