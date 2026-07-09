/**
 * Seeds the platform's robotics "starter template" projects (5 per board: Arduino
 * UNO, ESP32, Raspberry Pi Pico) so every user sees them on the Projects page.
 * Idempotent: deletes ALL existing robotics (non-coding) templates across every
 * tenant — the starter catalogue is platform-wide, so legacy per-school copies are
 * replaced too — then recreates the full set (owned by the platform tenant) from
 * the shared definitions in prisma/robotics-templates.ts.
 *
 *   pnpm db:seed-robotics
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { ROBOTICS_TEMPLATES } from "./robotics-templates";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { isPlatform: true } });
  if (!tenant) throw new Error("No platform tenant found — seed the base data first.");
  const owner =
    (await prisma.user.findFirst({ where: { tenantId: tenant.id, role: "super_admin" } })) ??
    (await prisma.user.findFirst({ where: { tenantId: tenant.id } }));
  if (!owner) throw new Error("No platform user found to own the templates.");

  // Clean, idempotent reseed. Robotics starter templates are a PLATFORM-WIDE
  // catalogue, so the delete is deliberately NOT scoped to a tenant: legacy
  // pre-existing sets (prod's original 6 under its school tenant, seed.ts's dev
  // demo set under "springfield") must be replaced too, or the UI shows the old
  // and new sets side by side as duplicates. Coding-track templates (kind:
  // "coding", owned per-tenant by seed-coding-templates.ts) are excluded and
  // never touched; user projects are safe (isTemplate: false).
  await prisma.project.deleteMany({ where: { isTemplate: true, NOT: { kind: "coding" } } });

  for (const t of ROBOTICS_TEMPLATES) {
    const p = await prisma.project.create({
      data: {
        ownerId: owner.id,
        tenantId: tenant.id,
        title: t.title,
        description: t.description,
        isTemplate: true,
        visibility: "public",
        boardType: t.boardType,
        diagram: t.diagram as Prisma.InputJsonValue,
      },
    });
    await prisma.codeFile.createMany({
      data: t.files.map((f) => ({ projectId: p.id, filename: f.name, language: f.language, content: f.content })),
    });
  }
  console.log(`Robotics templates seeded: ${ROBOTICS_TEMPLATES.length} created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
