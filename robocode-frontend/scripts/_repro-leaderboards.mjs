// Verifies /app/leaderboards (Phase C1 — src/app/app/leaderboards/page.tsx)
// end-to-end in a real browser: the Coding/Robotics track tabs, the 12-language
// picker, the All-time/This-week scope toggle, and the dashboard + Academy
// links into the page. The dev DB may or may not have tagged XP yet (Phase B0
// backfill + tutorial content land in parallel), so this asserts the page
// *loads and behaves correctly* for every interaction rather than asserting
// specific row counts — an empty board is a valid, correctly-rendered state.
//
// Note: the app sidebar (present on every /app/* page) has its own "Coding" /
// "Robotics" links (the Academy track shortcuts), so every page-content
// lookup below is scoped to `<main>` (src/app/app/layout.tsx) — matching
// against the whole page would silently pick up the sidebar link instead.
//
// Requires: robocode-frontend dev server on :3000, robocode-backend dev
// server (+ Postgres) on :4000, and the seeded user ada@robocode.africa /
// password123 (robocode-backend/prisma/seed.ts).
import { chromium } from "playwright";

const BASE = "http://localhost:3000";

let failed = false;
const check = (label, ok, detail) => {
  console.log(ok ? `PASS: ${label}` : `FAIL: ${label} ${detail ?? ""}`);
  if (!ok) failed = true;
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const main = page.locator("main");

const consoleErrors = [];
page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(`console.error: ${msg.text()}`);
});

try {
  // --- Login ---
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", "ada@robocode.africa");
  await page.fill("#password", "password123");
  await page.click('button:has-text("Sign in")');
  await page.waitForURL("**/app", { timeout: 20000 });
  // Explicit re-nav (rather than trusting the post-login redirect's render
  // timing) so the dashboard link check below isn't racing hydration.
  await page.goto(`${BASE}/app`, { waitUntil: "networkidle" });

  // --- Dashboard links to the new page ---
  check(
    "dashboard has a link into /app/leaderboards",
    (await page.locator('a[href="/app/leaderboards"]').count()) > 0,
  );

  // --- Academy page links to the new page ---
  await page.goto(`${BASE}/app/learn`, { waitUntil: "networkidle" });
  check(
    "Academy page has a link into /app/leaderboards",
    (await page.locator('a[href="/app/leaderboards"]').count()) > 0,
  );

  // --- Leaderboards page: default load (Coding, all-time) ---
  await page.goto(`${BASE}/app/leaderboards`, { waitUntil: "networkidle" });
  check("page heading renders", (await main.locator("h1", { hasText: "Leaderboards" }).count()) > 0);

  const codingTab = main.locator('a[href*="/app/leaderboards?track=coding"]').first();
  const roboticsTab = main.locator('a[href*="/app/leaderboards?track=robotics"]').first();
  check("Coding tab renders", (await codingTab.count()) > 0);
  check("Robotics tab renders", (await roboticsTab.count()) > 0);
  check("Coding tab is active by default", (await codingTab.getAttribute("aria-current")) === "page");

  // A "board" is either a ranked list or the empty-state card — both are a
  // correctly-rendered board (dev DB may have zero tagged XP for this track).
  check("Coding track board renders (heading present)", (await main.locator("text=Top learners").count()) > 0);

  // --- Switch to Robotics tab ---
  await roboticsTab.click();
  await page.waitForURL(/track=robotics/, { timeout: 10000 });
  await page.waitForLoadState("networkidle");
  check("URL reflects track=robotics after tab switch", page.url().includes("track=robotics"));
  const roboticsTabActive = main.locator('a[href*="/app/leaderboards?track=robotics"]').first();
  check("Robotics tab is active after switch", (await roboticsTabActive.getAttribute("aria-current")) === "page");
  check("Robotics track board renders after switch", (await main.locator("text=Top learners").count()) > 0);

  // --- Language picker: narrow Robotics down to a specific language ---
  const picker = main.getByLabel("Filter by language");
  check("language picker renders", (await picker.count()) > 0);
  await picker.click();
  await page.locator('[role="option"]', { hasText: "Arduino" }).click();
  await page.waitForURL(/language=arduino/, { timeout: 10000 });
  await page.waitForLoadState("networkidle");
  check("URL reflects language=arduino after picking", page.url().includes("language=arduino"));
  check("Arduino language board renders", (await main.locator("text=Top learners — Arduino").count()) > 0);

  // --- Scope toggle: All-time -> This week ---
  await main.locator('a:has-text("This week")').click();
  await page.waitForURL(/scope=week/, { timeout: 10000 });
  await page.waitForLoadState("networkidle");
  check("URL reflects scope=week after scope toggle", page.url().includes("scope=week"));
  check("board still renders after scope toggle", (await main.locator("text=Top learners").count()) > 0);

  // --- Direct nav to a coding language board (Python) ---
  await page.goto(`${BASE}/app/leaderboards?track=coding&language=python&scope=all`, {
    waitUntil: "networkidle",
  });
  check(
    "Python language board renders via direct URL",
    (await main.locator("text=Top learners — Python").count()) > 0,
  );

  check("no console/page errors across the whole flow", consoleErrors.length === 0, JSON.stringify(consoleErrors));
} catch (e) {
  console.log("FAIL: unexpected exception", e?.stack ?? e);
  failed = true;
} finally {
  await browser.close();
}

if (failed) {
  console.log("\nRESULT: FAIL");
  process.exit(1);
} else {
  console.log("\nRESULT: PASS");
}
