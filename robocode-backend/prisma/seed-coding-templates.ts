/**
 * Seeds platform "Coding example" template projects (6 per language) so they
 * appear in every user's Projects page. Idempotent: re-running updates the files
 * of existing same-title coding templates rather than duplicating them.
 *
 *   pnpm db:seed-coding
 */
import { readFileSync } from "node:fs";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type Tpl = { language: string; title: string; description: string; files: { name: string; content: string }[] };

function monacoLang(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    py: "python", js: "javascript", mjs: "javascript", html: "html", htm: "html", css: "css",
    ts: "typescript", go: "go", rs: "rust", c: "cpp", h: "cpp", cc: "cpp", cpp: "cpp", cs: "csharp", sql: "sql",
    json: "json", md: "markdown",
  };
  return map[ext ?? ""] ?? "plaintext";
}

async function main() {
  const templates: Tpl[] = JSON.parse(readFileSync("prisma/coding-templates.json", "utf8"));

  const tenant = await prisma.tenant.findFirst({ where: { isPlatform: true } });
  if (!tenant) throw new Error("No platform tenant found — seed the base data first.");
  const owner =
    (await prisma.user.findFirst({ where: { tenantId: tenant.id, role: "super_admin" } })) ??
    (await prisma.user.findFirst({ where: { tenantId: tenant.id } }));
  if (!owner) throw new Error("No platform user found to own the templates.");

  // Clean, idempotent reseed: drop existing platform coding templates (codeFiles
  // cascade) then recreate the full set. Titles can repeat across languages, so
  // a title-based upsert would wrongly merge them — a full replace is correct.
  await prisma.project.deleteMany({ where: { isTemplate: true, kind: "coding", tenantId: tenant.id } });

  for (const t of templates) {
    const p = await prisma.project.create({
      data: {
        ownerId: owner.id,
        tenantId: tenant.id,
        title: t.title,
        description: t.description,
        kind: "coding",
        isTemplate: true,
        visibility: "public",
        boardType: "arduino-uno",
        diagram: {} as Prisma.InputJsonValue,
      },
    });
    await prisma.codeFile.createMany({
      data: t.files.map((f) => ({ projectId: p.id, filename: f.name, language: monacoLang(f.name), content: f.content })),
    });
  }
  console.log(`Coding templates seeded: ${templates.length} created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
