// Smoke test for AuthService.schoolSignup's reverse tenant/publish collision
// guard (see auth.service.ts): a school-signup slug already occupied by a
// published project on robocode.africa must be rejected — the proxy resolves
// a published project's subdomain BEFORE tenant validation, so letting a new
// tenant claim the same slug would silently shadow the published project (or
// vice versa). This mirrors PublishService.checkAvailability's existing
// "reserved-by-a-school" guard (see publish.smoke.ts) in the other direction.
// No test framework (repo convention): hand-rolled PASS/FAIL checks running
// against the real dev DB via PrismaService. Creates a throwaway
// user/project/tenant under a unique `authtest-<random>` prefix and deletes
// everything it created in a `finally` block.
//
// Run: cd robocode-backend && npx tsx src/auth/auth.smoke.ts
import { BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotifyService } from "../common/notify.service";
import { PointsService } from "../common/points.service";
import { StreakService } from "../common/streak.service";
import { ReferralsService } from "../modules/referrals/referrals.service";
import { JwtService } from "./jwt.service";
import { AuthService } from "./auth.service";
import { hashPassword } from "./password.util";

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
  const referrals = new ReferralsService(prisma, points, notify);
  const jwt = new JwtService();
  const auth = new AuthService(prisma, notify, jwt, referrals, streak);
  await prisma.$connect();

  const runId = Math.random().toString(36).slice(2, 10);
  const createdUserIds: string[] = [];
  const createdProjectIds: string[] = [];
  const createdTenantIds: string[] = [];
  const passwordHash = await hashPassword("password123");

  try {
    const tenants = await prisma.tenant.findMany({ take: 1, select: { id: true } });
    if (tenants.length < 1) throw new Error("smoke test needs at least 1 tenant in the dev DB");
    const [tenantA] = tenants;

    // --- (a) a slug already occupied by a published project on
    // robocode.africa must reject school-signup with the same "subdomain is
    // taken" error shape a plain tenant-slug collision gets -----------------
    {
      const owner = await prisma.user.create({
        data: {
          tenantId: tenantA.id,
          email: `authtest-${runId}-owner@example.com`,
          displayName: "AuthTest Owner",
          passwordHash,
          role: "student",
          status: "active",
          isMinor: false,
        },
      });
      createdUserIds.push(owner.id);

      const slug = `collidetest${runId}`;
      const project = await prisma.project.create({
        data: {
          ownerId: owner.id,
          tenantId: owner.tenantId,
          title: "AuthTest Published Project",
          kind: "robotics",
          boardType: "arduino-uno",
          diagram: { parts: [], connections: [] },
          visibility: "public",
          subdomain: slug,
          publishDomain: "robocode.africa",
          publishedAt: new Date(),
        },
      });
      createdProjectIds.push(project.id);

      let rejected = false;
      let responseBody: unknown;
      try {
        await auth.schoolSignup({
          schoolName: "Collide School",
          slug,
          adminName: "Collide Admin",
          email: `authtest-${runId}-admin@example.com`,
          password: "password123",
        });
      } catch (e) {
        rejected = e instanceof BadRequestException;
        responseBody = e instanceof BadRequestException ? e.getResponse() : e;
      }
      check(
        "(a) schoolSignup rejects a slug already occupied by a published robocode.africa project",
        rejected,
        JSON.stringify(responseBody),
      );
      check(
        "(a) rejection uses the same 'subdomain is taken' message as a tenant-slug collision",
        typeof responseBody === "object" &&
          responseBody !== null &&
          (responseBody as { message?: string }).message === "That subdomain is taken.",
        JSON.stringify(responseBody),
      );

      const tenantCreated = await prisma.tenant.findUnique({ where: { slug } });
      check("(a) no tenant was created for the colliding slug", tenantCreated === null);
    }

    // --- (b) sanity: a genuinely free slug still succeeds (guard isn't
    // over-broad) -----------------------------------------------------------
    {
      const slug = `freeslug${runId}`;
      const result = await auth.schoolSignup({
        schoolName: "Free School",
        slug,
        adminName: "Free Admin",
        email: `authtest-${runId}-free-admin@example.com`,
        password: "password123",
      });
      check("(b) schoolSignup succeeds for a free slug", result.ok === true, JSON.stringify(result));

      const tenant = await prisma.tenant.findUnique({ where: { slug } });
      check("(b) tenant created for the free slug", !!tenant);
      if (tenant) {
        createdTenantIds.push(tenant.id);
        const admin = await prisma.user.findFirst({ where: { tenantId: tenant.id, role: "school_admin" } });
        if (admin) createdUserIds.push(admin.id);
      }
    }
  } finally {
    if (createdProjectIds.length > 0) {
      await prisma.project.deleteMany({ where: { id: { in: createdProjectIds } } });
    }
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    if (createdTenantIds.length > 0) {
      await prisma.tenant.deleteMany({ where: { id: { in: createdTenantIds } } });
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
