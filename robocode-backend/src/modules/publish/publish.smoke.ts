// Smoke test for PublishService (validateName, checkAvailability incl. the
// robocode.africa school-slug collision, publish/resolvePublished round
// trip, unpublish, ownership enforcement, a publish name-taken race, and the
// PUBLISH_DOMAINS allowlist guard on resolvePublished/takedown). No test
// framework (repo convention): hand-rolled PASS/FAIL checks running against
// the real dev DB via PrismaService. Creates throwaway users/projects/a
// tenant under a unique `pubtest-<random>` prefix and deletes everything it
// created in a `finally` block.
//
// Run: cd robocode-backend && npx tsx src/modules/publish/publish.smoke.ts
import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { GoDaddyService } from "./godaddy.service";
import { PublishService } from "./publish.service";
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
  const goDaddy = new GoDaddyService(); // creds unset in this run -> dry-run, no network calls
  const publish = new PublishService(prisma, goDaddy);
  await prisma.$connect();

  const runId = Math.random().toString(36).slice(2, 10);
  const emailPrefix = `pubtest-${runId}`;
  const namePrefix = `pubtest${runId}`; // subdomain names: lowercase alnum only, no separators
  const createdUserIds: string[] = [];
  const createdProjectIds: string[] = [];
  const createdTenantIds: string[] = [];
  const passwordHash = await hashPassword("password123");

  async function makeUser(tenantId: string, suffix: string) {
    const user = await prisma.user.create({
      data: {
        tenantId,
        email: `${emailPrefix}-${suffix}@example.com`,
        displayName: `PubTest ${suffix}`,
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

  async function makeProject(owner: AuthUser, suffix: string) {
    const project = await prisma.project.create({
      data: {
        ownerId: owner.id,
        tenantId: owner.tenantId,
        title: `PubTest Project ${suffix}`,
        kind: "robotics",
        boardType: "arduino-uno",
        diagram: { parts: [], connections: [] },
        visibility: "private",
      },
    });
    createdProjectIds.push(project.id);
    await prisma.codeFile.create({
      data: { projectId: project.id, filename: "sketch.ino", language: "arduino", content: "// hello world" },
    });
    return project;
  }

  try {
    const tenants = await prisma.tenant.findMany({ take: 1, select: { id: true } });
    if (tenants.length < 1) throw new Error("smoke test needs at least 1 tenant in the dev DB");
    const [tenantA] = tenants;

    // --- (a) validateName: format / reserved / profanity / accepts a good name ---
    {
      let threw = false;
      try {
        publish.validateName("ab"); // too short
      } catch {
        threw = true;
      }
      check("(a) validateName rejects a too-short name", threw);

      threw = false;
      try {
        publish.validateName("-badstart-"); // leading/trailing hyphen
      } catch {
        threw = true;
      }
      check("(a) validateName rejects bad format (leading/trailing hyphen)", threw);

      threw = false;
      try {
        publish.validateName("www"); // reserved
      } catch {
        threw = true;
      }
      check("(a) validateName rejects a reserved name", threw);

      threw = false;
      try {
        publish.validateName("thisisfuckingcool"); // profanity substring
      } catch {
        threw = true;
      }
      check("(a) validateName rejects profanity", threw);

      threw = false;
      try {
        publish.validateName(`${namePrefix}good`);
      } catch {
        threw = true;
      }
      check("(a) validateName accepts a good name", !threw);
    }

    // --- (b) checkAvailability: taken name + africa school-slug collision ---
    {
      const owner = await makeUser(tenantA.id, "avail-owner");
      const takenProject = await makeProject(owner, "avail-taken");
      const takenName = `${namePrefix}taken`;
      await prisma.project.update({
        where: { id: takenProject.id },
        data: {
          subdomain: takenName,
          publishDomain: "robocode.studio",
          publishedAt: new Date(),
          visibility: "public",
        },
      });

      const takenResult = await publish.checkAvailability("robocode.studio", takenName);
      check(
        "(b) checkAvailability rejects a taken name",
        takenResult.available === false && takenResult.reason === "taken",
        JSON.stringify(takenResult),
      );

      const schoolSlug = `${namePrefix}school`;
      const tenant = await prisma.tenant.create({ data: { slug: schoolSlug, name: "PubTest School" } });
      createdTenantIds.push(tenant.id);

      const africaResult = await publish.checkAvailability("robocode.africa", schoolSlug);
      check(
        "(b) checkAvailability rejects an existing tenant slug on robocode.africa",
        africaResult.available === false && africaResult.reason === "reserved-by-a-school",
        JSON.stringify(africaResult),
      );

      // The school-slug reservation is africa-only — the same name is fine on .studio.
      const studioResult = await publish.checkAvailability("robocode.studio", schoolSlug);
      check(
        "(b) the same name IS available on robocode.studio (school reservation is africa-only)",
        studioResult.available === true,
        JSON.stringify(studioResult),
      );
    }

    // --- (c) publish -> resolvePublished round trip; forces public; no PII ---
    {
      const owner = await makeUser(tenantA.id, "publish-owner");
      const project = await makeProject(owner, "publish");
      const name = `${namePrefix}roundtrip`;

      const result = await publish.publish(owner, project.id, "robocode.studio", name);
      check("(c) publish returns the expected URL", result.url === `https://${name}.robocode.studio`, result.url);

      const row = await prisma.project.findUniqueOrThrow({ where: { id: project.id } });
      check("(c) publish forces visibility=public", row.visibility === "public", row.visibility);
      check(
        "(c) publish sets subdomain/publishDomain/publishedAt",
        row.subdomain === name && row.publishDomain === "robocode.studio" && row.publishedAt !== null,
        JSON.stringify(row),
      );

      const payload = await publish.resolvePublished("robocode.studio", name);
      check("(c) resolvePublished returns the project title", payload.title === project.title, payload.title);
      check(
        "(c) resolvePublished returns the owner's display name",
        payload.ownerDisplayName === owner.displayName,
        payload.ownerDisplayName,
      );
      check(
        "(c) resolvePublished returns the project's files",
        payload.files.length === 1 && payload.files[0].content === "// hello world",
        JSON.stringify(payload.files),
      );
      const serialized = JSON.stringify(payload);
      check(
        "(c) resolvePublished payload contains NO email/PII",
        !("email" in payload) && !serialized.includes(owner.email) && !serialized.toLowerCase().includes("email"),
        serialized,
      );

      // --- (d) unpublish frees the name AND reverts visibility ---------------
      await publish.unpublish(owner, project.id);
      const afterUnpublish = await prisma.project.findUniqueOrThrow({ where: { id: project.id } });
      check(
        "(d) unpublish clears subdomain/publishDomain/publishedAt",
        afterUnpublish.subdomain === null && afterUnpublish.publishDomain === null && afterUnpublish.publishedAt === null,
        JSON.stringify(afterUnpublish),
      );
      check(
        "(d) unpublish reverts visibility to private (no longer public platform-wide)",
        afterUnpublish.visibility === "private",
        afterUnpublish.visibility,
      );

      const availableAgain = await publish.checkAvailability("robocode.studio", name);
      check("(d) unpublish frees the name", availableAgain.available === true, JSON.stringify(availableAgain));

      let notFoundThrew = false;
      try {
        await publish.resolvePublished("robocode.studio", name);
      } catch {
        notFoundThrew = true;
      }
      check("(d) resolvePublished 404s once unpublished", notFoundThrew);
    }

    // --- (e) publish by a non-owner is rejected as Forbidden ----------------
    {
      const owner = await makeUser(tenantA.id, "forbid-owner");
      const stranger = await makeUser(tenantA.id, "forbid-stranger");
      const project = await makeProject(owner, "forbid");

      let isForbidden = false;
      try {
        await publish.publish(stranger, project.id, "robocode.studio", `${namePrefix}forbid`);
      } catch (e) {
        isForbidden = e instanceof ForbiddenException;
      }
      check("(e) non-owner publish throws ForbiddenException", isForbidden);

      const row = await prisma.project.findUniqueOrThrow({ where: { id: project.id } });
      check(
        "(e) non-owner publish attempt did not mutate the project",
        row.subdomain === null && row.visibility === "private",
        JSON.stringify(row),
      );
    }

    // --- (f) publish name-taken race: two projects racing for the same
    // (domain,subdomain) — one must win, the loser must get a friendly
    // BadRequest ("name taken"), never an uncaught 500. Firing both publish()
    // calls concurrently (rather than strictly sequentially) means whichever
    // loses may be caught either by the checkAvailability pre-check or by the
    // DB's unique-constraint (P2002) catch in publish() — both are expected
    // to surface as BadRequestException, so the assertion holds either way. --
    {
      const ownerA = await makeUser(tenantA.id, "race-a");
      const ownerB = await makeUser(tenantA.id, "race-b");
      const projectA = await makeProject(ownerA, "race-a");
      const projectB = await makeProject(ownerB, "race-b");
      const raceName = `${namePrefix}race`;

      const results = await Promise.allSettled([
        publish.publish(ownerA, projectA.id, "robocode.studio", raceName),
        publish.publish(ownerB, projectB.id, "robocode.studio", raceName),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
      check("(f) publish race: exactly one publish wins", fulfilled.length === 1, JSON.stringify(results));
      check(
        "(f) publish race: the loser gets a BadRequestException, not an uncaught 500",
        rejected.length === 1 && rejected[0].reason instanceof BadRequestException,
        rejected.length === 1 ? String(rejected[0].reason) : "no rejection",
      );
    }

    // --- (g) domain allowlist guard: resolvePublished 404s / takedown
    // rejects with BadRequest for a domain outside PUBLISH_DOMAINS ----------
    {
      const actor = await makeUser(tenantA.id, "domainguard-actor");
      const badDomain = "not-a-real-publish-domain.example";

      let resolveWas404 = false;
      try {
        await publish.resolvePublished(badDomain, `${namePrefix}whatever`);
      } catch (e) {
        resolveWas404 = e instanceof NotFoundException;
      }
      check("(g) resolvePublished rejects a domain outside PUBLISH_DOMAINS with 404", resolveWas404);

      let takedownWasBadRequest = false;
      try {
        await publish.takedown(badDomain, `${namePrefix}whatever`, actor, "domain guard smoke check");
      } catch (e) {
        takedownWasBadRequest = e instanceof BadRequestException;
      }
      check(
        "(g) takedown rejects a domain outside PUBLISH_DOMAINS with BadRequestException",
        takedownWasBadRequest,
      );
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
