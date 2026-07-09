// Smoke test for the referrals module (self-referral rejection, unknown-code
// no-op, reward-once idempotency, daily cap, recruiter badge thresholds,
// cross-tenant settlement). No test framework (repo convention): hand-rolled
// PASS/FAIL checks running against the real dev DB via PrismaService.
// Creates throwaway users under a unique `reftest-<random>-*@...` email
// prefix and deletes everything it created in a `finally` block.
//
// Run: cd robocode-backend && npx tsx src/modules/referrals/smoke.ts
import { PrismaService } from "../../prisma/prisma.service";
import { PointsService } from "../../common/points.service";
import { NotifyService } from "../../common/notify.service";
import { ReferralsService } from "./referrals.service";
import { RECRUITER_BADGES, REFERRAL_DAILY_REWARD_CAP, POINTS } from "../../domain/constants";
import { hashPassword } from "../../auth/password.util";
import { studentSignupSchema } from "../../domain/validation";

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`PASS ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}${detail ? `: ${detail}` : ""}`);
  }
}

// Badge display copy — kept in sync with prisma/seed.ts's `badges` catalog.
const RECRUITER_BADGE_SEED: Record<string, { name: string; description: string; icon: string }> = {
  recruiter_bronze: { name: "Bronze Recruiter", description: "Referred 1 friend who joined RoboCode.", icon: "user-plus" },
  recruiter_silver: { name: "Silver Recruiter", description: "Referred 5 friends who joined RoboCode.", icon: "users" },
  recruiter_gold: { name: "Gold Recruiter", description: "Referred 25 friends who joined RoboCode.", icon: "crown" },
};

async function main() {
  const prisma = new PrismaService();
  const notify = new NotifyService(prisma);
  const points = new PointsService(prisma, notify);
  const referrals = new ReferralsService(prisma, points, notify);
  await prisma.$connect();

  const runId = Math.random().toString(36).slice(2, 10);
  const emailPrefix = `reftest-${runId}`;
  const createdUserIds: string[] = [];
  const passwordHash = await hashPassword("password123");

  async function makeUser(tenantId: string, suffix: string, status: "pending" | "active" = "active") {
    const user = await prisma.user.create({
      data: {
        tenantId,
        email: `${emailPrefix}-${suffix}@example.com`,
        displayName: `RefTest ${suffix}`,
        passwordHash,
        role: "student",
        status,
        isMinor: false,
      },
    });
    createdUserIds.push(user.id);
    return user;
  }

  try {
    // Recruiter badges must pre-exist in the Badge table for awardBadge to
    // actually award them (it silently no-ops on an unknown code). These are
    // real catalog rows (also added to prisma/seed.ts), not test fixtures —
    // deliberately NOT cleaned up below.
    for (const { code } of RECRUITER_BADGES) {
      await prisma.badge.upsert({
        where: { code },
        update: {},
        create: { code, ...RECRUITER_BADGE_SEED[code] },
      });
    }

    const tenants = await prisma.tenant.findMany({ take: 2, select: { id: true } });
    if (tenants.length < 2) throw new Error("smoke test needs at least 2 tenants in the dev DB (found " + tenants.length + ")");
    const [tenantA, tenantB] = tenants;

    // --- (a) self-referral is never recorded ----------------------------------
    {
      const solo = await makeUser(tenantA.id, "solo");
      const code = await referrals.ensureCode(solo.id);
      await referrals.recordSignup(solo.id, code);
      const referral = await prisma.referral.findUnique({ where: { refereeId: solo.id } });
      check("(a) self-referral not recorded", referral === null, `referral=${JSON.stringify(referral)}`);
    }

    // --- (b) unknown code is silently ignored ---------------------------------
    {
      const orphan = await makeUser(tenantA.id, "orphan");
      await referrals.recordSignup(orphan.id, "NOPE9999");
      const referral = await prisma.referral.findUnique({ where: { refereeId: orphan.id } });
      check("(b) unknown code ignored", referral === null, `referral=${JSON.stringify(referral)}`);
    }

    // --- (c) pending -> active settles once, idempotent under a 2nd call -----
    // --- (e) recruiter badge granted at the 1-referral threshold -------------
    {
      const referrerC = await makeUser(tenantA.id, "referrer-c");
      const refCode = await referrals.ensureCode(referrerC.id);
      const refereeC = await makeUser(tenantA.id, "referee-c", "pending");

      await referrals.recordSignup(refereeC.id, refCode);
      let referral = await prisma.referral.findUnique({ where: { refereeId: refereeC.id } });
      check("(c) referral recorded pending", referral?.status === "pending", `referral=${JSON.stringify(referral)}`);

      // Activate the referee (mirrors what auth/admin/school/consent flows do).
      await prisma.user.update({ where: { id: refereeC.id }, data: { status: "active" } });

      const referrerBefore = await prisma.user.findUniqueOrThrow({ where: { id: referrerC.id } });
      const refereeBefore = await prisma.user.findUniqueOrThrow({ where: { id: refereeC.id } });

      await referrals.settleIfActive(refereeC.id);
      await referrals.settleIfActive(refereeC.id); // 2nd call — must be a no-op

      referral = await prisma.referral.findUnique({ where: { refereeId: refereeC.id } });
      check("(c) referral rewarded exactly once", referral?.status === "rewarded", `referral=${JSON.stringify(referral)}`);

      const referrerLedgerCount = await prisma.roboPointLedger.count({ where: { idemKey: `referral:${refereeC.id}` } });
      const refereeLedgerCount = await prisma.roboPointLedger.count({ where: { idemKey: `referral-welcome:${refereeC.id}` } });
      check("(c) exactly one referrer ledger row", referrerLedgerCount === 1, `count=${referrerLedgerCount}`);
      check("(c) exactly one referee ledger row", refereeLedgerCount === 1, `count=${refereeLedgerCount}`);

      const referrerAfter = await prisma.user.findUniqueOrThrow({ where: { id: referrerC.id } });
      const refereeAfter = await prisma.user.findUniqueOrThrow({ where: { id: refereeC.id } });
      check(
        "(c) referrer credited +150 exactly once",
        referrerAfter.roboPoints === referrerBefore.roboPoints + POINTS.REFERRAL_REFERRER,
        `before=${referrerBefore.roboPoints} after=${referrerAfter.roboPoints}`,
      );
      check(
        "(c) referee credited +50 exactly once",
        refereeAfter.roboPoints === refereeBefore.roboPoints + POINTS.REFERRAL_WELCOME,
        `before=${refereeBefore.roboPoints} after=${refereeAfter.roboPoints}`,
      );

      const badge = await prisma.userBadge.findFirst({
        where: { userId: referrerC.id, badge: { code: "recruiter_bronze" } },
      });
      check("(e) recruiter_bronze badge granted at threshold 1", !!badge, `badge=${JSON.stringify(badge)}`);
    }

    // --- (d) 21st same-day rewarded referral stays pending (daily cap) -------
    {
      const referrerD = await makeUser(tenantA.id, "referrer-d");
      const refCodeD = await referrals.ensureCode(referrerD.id);

      // Fast-fill the cap: directly create REFERRAL_DAILY_REWARD_CAP referrals
      // already "rewarded" today. This is DB fixture setup for the daily-cap
      // check, not the code path under test (settleIfActive), so it bypasses
      // it deliberately for speed.
      for (let i = 0; i < REFERRAL_DAILY_REWARD_CAP; i++) {
        const filler = await makeUser(tenantA.id, `referrer-d-filler-${i}`, "active");
        await prisma.referral.create({
          data: { referrerId: referrerD.id, refereeId: filler.id, code: refCodeD, status: "rewarded", rewardedAt: new Date() },
        });
      }

      const overflowReferee = await makeUser(tenantA.id, "referrer-d-overflow", "pending");
      await referrals.recordSignup(overflowReferee.id, refCodeD);
      await prisma.user.update({ where: { id: overflowReferee.id }, data: { status: "active" } });
      await referrals.settleIfActive(overflowReferee.id);

      const referral = await prisma.referral.findUnique({ where: { refereeId: overflowReferee.id } });
      check("(d) 21st referral stays pending (daily cap)", referral?.status === "pending", `referral=${JSON.stringify(referral)}`);
      const ledgerRows = await prisma.roboPointLedger.count({ where: { idemKey: `referral:${overflowReferee.id}` } });
      check("(d) no reward issued past the daily cap", ledgerRows === 0, `count=${ledgerRows}`);
    }

    // --- (f) cross-tenant referral still settles ------------------------------
    {
      const referrerF = await makeUser(tenantA.id, "referrer-f");
      const refCodeF = await referrals.ensureCode(referrerF.id);
      const refereeF = await makeUser(tenantB.id, "referee-f", "pending"); // different tenant than referrerF

      await referrals.recordSignup(refereeF.id, refCodeF);
      let referral = await prisma.referral.findUnique({ where: { refereeId: refereeF.id } });
      check("(f) cross-tenant referral recorded", referral?.status === "pending", `referral=${JSON.stringify(referral)}`);

      await prisma.user.update({ where: { id: refereeF.id }, data: { status: "active" } });
      await referrals.settleIfActive(refereeF.id);

      referral = await prisma.referral.findUnique({ where: { refereeId: refereeF.id } });
      check("(f) cross-tenant referral settles", referral?.status === "rewarded", `referral=${JSON.stringify(referral)}`);
      const referrerLedgerCount = await prisma.roboPointLedger.count({ where: { idemKey: `referral:${refereeF.id}` } });
      check("(f) cross-tenant referrer reward recorded", referrerLedgerCount === 1, `count=${referrerLedgerCount}`);
    }

    // --- (i) stats().url is an absolute, clickable URL (not a bare hostname) -
    {
      const referrerI = await makeUser(tenantA.id, "referrer-i");
      const referrerIWithTenant = await prisma.user.findUniqueOrThrow({
        where: { id: referrerI.id },
        include: { tenant: true },
      });
      const stats = await referrals.stats(referrerIWithTenant);
      check("(i) stats().url is absolute (starts with http)", stats.url.startsWith("http"), `url=${stats.url}`);
    }

    // --- (j) concurrent settleIfActive calls are race-safe (no throw, pays once) -
    // Regression check for the P2002-on-idemKey race: two settleIfActive calls
    // for the SAME referee firing at once (e.g. a double-clicked admin
    // approval) must not surface an uncaught PrismaClientKnownRequestError,
    // and the reward must still land exactly once on each side.
    {
      const referrerJ = await makeUser(tenantA.id, "referrer-j");
      const refCodeJ = await referrals.ensureCode(referrerJ.id);
      const refereeJ = await makeUser(tenantA.id, "referee-j", "pending");

      await referrals.recordSignup(refereeJ.id, refCodeJ);
      await prisma.user.update({ where: { id: refereeJ.id }, data: { status: "active" } });

      const referrerBefore = await prisma.user.findUniqueOrThrow({ where: { id: referrerJ.id } });
      const refereeBefore = await prisma.user.findUniqueOrThrow({ where: { id: refereeJ.id } });

      const results = await Promise.allSettled([
        referrals.settleIfActive(refereeJ.id),
        referrals.settleIfActive(refereeJ.id),
      ]);
      const rejected = results.filter((r) => r.status === "rejected");
      check(
        "(j) concurrent double-settle does not throw",
        rejected.length === 0,
        rejected.map((r) => (r as PromiseRejectedResult).reason).join("; "),
      );

      const referral = await prisma.referral.findUnique({ where: { refereeId: refereeJ.id } });
      check("(j) referral rewarded exactly once", referral?.status === "rewarded", `referral=${JSON.stringify(referral)}`);

      const referrerLedgerCount = await prisma.roboPointLedger.count({ where: { idemKey: `referral:${refereeJ.id}` } });
      const refereeLedgerCount = await prisma.roboPointLedger.count({ where: { idemKey: `referral-welcome:${refereeJ.id}` } });
      check("(j) exactly one referrer ledger row under concurrency", referrerLedgerCount === 1, `count=${referrerLedgerCount}`);
      check("(j) exactly one referee ledger row under concurrency", refereeLedgerCount === 1, `count=${refereeLedgerCount}`);

      const referrerAfter = await prisma.user.findUniqueOrThrow({ where: { id: referrerJ.id } });
      const refereeAfter = await prisma.user.findUniqueOrThrow({ where: { id: refereeJ.id } });
      check(
        "(j) referrer credited +150 exactly once under concurrency",
        referrerAfter.roboPoints === referrerBefore.roboPoints + POINTS.REFERRAL_REFERRER,
        `before=${referrerBefore.roboPoints} after=${referrerAfter.roboPoints}`,
      );
      check(
        "(j) referee credited +50 exactly once under concurrency",
        refereeAfter.roboPoints === refereeBefore.roboPoints + POINTS.REFERRAL_WELCOME,
        `before=${refereeBefore.roboPoints} after=${refereeAfter.roboPoints}`,
      );
    }

    // --- (g) the student-signup schema accepts an optional `ref` code --------
    {
      const currentYear = new Date().getFullYear();
      const withRef = studentSignupSchema.safeParse({
        displayName: "Ref Schema Test",
        email: `${emailPrefix}-schema-withref@example.com`,
        password: "supersecurepassword",
        birthYear: currentYear - 20,
        ref: "ABCD1234",
      });
      check(
        "(g) schema parses with ref present",
        withRef.success && withRef.data.ref === "ABCD1234",
        withRef.success ? undefined : JSON.stringify(withRef.error.issues),
      );

      const withoutRef = studentSignupSchema.safeParse({
        displayName: "No Ref Schema Test",
        email: `${emailPrefix}-schema-noref@example.com`,
        password: "supersecurepassword",
        birthYear: currentYear - 20,
      });
      check(
        "(g) schema parses fine without ref (optional)",
        withoutRef.success && withoutRef.data.ref === undefined,
        withoutRef.success ? undefined : JSON.stringify(withoutRef.error.issues),
      );
    }

    // --- (h) studentSignup-style flow: capture ref, settle on activation -----
    // Mirrors AuthService.studentSignup's `if (data.ref) recordSignup(...)`
    // followed by whichever activation path (autoApprove, admin/school
    // approval, or a reinstate-after-consent) eventually flips the user to
    // `active` and calls `settleIfActive`.
    {
      const referrerH = await makeUser(tenantA.id, "referrer-h");
      const refCodeH = await referrals.ensureCode(referrerH.id);

      const parsed = studentSignupSchema.safeParse({
        displayName: "RefTest Referee H",
        email: `${emailPrefix}-referee-h@example.com`,
        password: "supersecurepassword",
        birthYear: new Date().getFullYear() - 20,
        ref: refCodeH,
      });
      if (!parsed.success) throw new Error("expected studentSignupSchema to parse a valid signup with ref");

      // studentSignup creates the user pending (autoApprove=false case) then
      // captures the ref exactly like `if (data.ref) recordSignup(...)`.
      const refereeH = await makeUser(tenantA.id, "referee-h", "pending");
      await referrals.recordSignup(refereeH.id, parsed.data.ref!);

      let referral = await prisma.referral.findUnique({ where: { refereeId: refereeH.id } });
      check("(h) signup-captured ref recorded pending", referral?.status === "pending", `referral=${JSON.stringify(referral)}`);

      // An activation path (admin/school approval, reinstate, etc.) flips the
      // user active and calls settleIfActive.
      await prisma.user.update({ where: { id: refereeH.id }, data: { status: "active" } });
      await referrals.settleIfActive(refereeH.id);

      referral = await prisma.referral.findUnique({ where: { refereeId: refereeH.id } });
      check("(h) activation settles the signup-captured referral", referral?.status === "rewarded", `referral=${JSON.stringify(referral)}`);
    }
  } finally {
    // Clean up every throwaway user (and any audit-log rows referencing them)
    // this run created. Deleting the User cascades to Referral, RoboPoint
    // ledger rows, UserBadge, and Notification rows.
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
