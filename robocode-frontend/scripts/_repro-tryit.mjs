// Verifies the tryit/exercise lesson-block renderers (components/learn/
// tryit-block.tsx, exercise-block.tsx) actually render and run in a real
// browser, wired through LessonBody end-to-end (not just the underlying
// sandbox in isolation). The W3Schools-style tutorials aren't seeded into
// content yet, so this seeds one temp global course+lesson directly in the
// sibling robocode-backend repo's dev DB (via its generated Prisma client),
// runs against it, then deletes it again — self-contained and safe to re-run.
//
// Requires: robocode-frontend dev server on :3000, robocode-backend dev
// server (+ Postgres) on :4000, and a seeded user (ada@robocode.africa /
// password123 — from robocode-backend/prisma/seed.ts).
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_DIR = path.resolve(__dirname, "../../robocode-backend");
const BASE = "http://localhost:3000";
const COURSE_SLUG = "verify-tryit-temp";
const LESSON_SLUG = "verify-tryit-lesson";

let failed = false;
const check = (label, ok, detail) => {
  console.log(ok ? `PASS: ${label}` : `FAIL: ${label} ${detail ?? ""}`);
  if (!ok) failed = true;
};

function runInBackend(script) {
  return execFileSync("node", ["-e", script], { cwd: BACKEND_DIR, encoding: "utf8" });
}

const SEED_SCRIPT = `
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const body = {
  blocks: [
    { type: "markdown", text: "# Verify tryit/exercise" },
    { type: "tryit", language: "python", code: 'print("hello from tryit")\\nprint(2 + 2)', expectedOutput: "hello from tryit\\n4", caption: "Verification tryit block" },
    { type: "exercise", language: "python", prompt: "Print \`42\`.", starter: "print(41)", solution: "print(42)", check: '"42"', caption: "Verification exercise block" },
  ],
};
prisma.course.create({
  data: {
    tenantId: null, title: "Verify TryIt (temp)", slug: "${COURSE_SLUG}", track: "coding",
    language: "python", level: "primary", published: true, order: 9999,
    lessons: { create: [{ title: "Verify TryIt Lesson", slug: "${LESSON_SLUG}", order: 0, contentType: "interactive", body, estMinutes: 5 }] },
  },
}).then(() => prisma.$disconnect());
`;

const CLEANUP_SCRIPT = `
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.course.deleteMany({ where: { slug: "${COURSE_SLUG}" } }).then(() => prisma.$disconnect());
`;

console.log("Seeding temp lesson in robocode-backend...");
runInBackend(SEED_SCRIPT);

try {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", "ada@robocode.africa");
  await page.fill("#password", "password123");
  await page.click('button:has-text("Sign in")');
  await page.waitForURL("**/app", { timeout: 20000 });

  await page.goto(`${BASE}/app/learn/${COURSE_SLUG}/${LESSON_SLUG}`, { waitUntil: "networkidle" });

  // --- tryit block: edit + Run in the real Pyodide (browser tier) sandbox ---
  const tryitFigure = page.locator("figure", { hasText: "python — Try it" });
  check("tryit figure rendered", (await tryitFigure.count()) > 0);

  const tryitTextarea = tryitFigure.locator("textarea");
  const tryitCode = await tryitTextarea.inputValue().catch(() => "");
  check("tryit textarea has starter code", tryitCode.includes("hello from tryit"), `got: ${JSON.stringify(tryitCode)}`);
  check("tryit Expected hint shown", (await tryitFigure.locator("text=Expected:").count()) > 0);

  await tryitFigure.locator('button:has-text("Run")').click();
  await page.waitForTimeout(6000); // pyodide cold load can take a few seconds
  const tryitOutput = await tryitFigure.locator("pre").first().textContent().catch(() => null);
  check(
    "tryit Run produced correct python output",
    !!tryitOutput && tryitOutput.includes("hello from tryit") && tryitOutput.includes("4"),
    `got: ${JSON.stringify(tryitOutput)}`,
  );
  check("tryit engine badge shown (browser tier)", (await tryitFigure.locator("text=Ran in your browser").count()) > 0);

  // --- exercise block: edit starter -> correct solution -> Check passes ------
  await page.locator("textarea").last().fill("print(42)");
  await page.locator('button:has-text("Check")').click();
  await page.waitForTimeout(4000);
  check("exercise Check passes on correct solution", (await page.locator("text=Check passed").count()) > 0);

  await page.locator('button:has-text("Show answer")').click();
  check("exercise Show answer reveals solution", (await page.locator("text=Solution").count()) > 0);

  await browser.close();
} finally {
  console.log("Cleaning up temp lesson...");
  runInBackend(CLEANUP_SCRIPT);
}

console.log(failed ? "REPRO DONE (FAILURES)" : "REPRO DONE (ALL PASS)");
if (failed) process.exitCode = 1;
