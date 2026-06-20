import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "screenshots";
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

async function shot(name, url, { email, full = false, wait = 700, w = 1440, h = 900 } = {}, ctxCache = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1.25 });
  const page = await ctx.newPage();
  if (email) {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.fill("#email", email);
    await page.fill("#password", "password123");
    await page.click('button:has-text("Sign in")');
    await page.waitForURL("**/app", { timeout: 15000 });
  }
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  await ctx.close();
  console.log("captured", name);
}

const S = "tariro@springfield.robocode.africa";
const ADMIN = "admin@springfield.robocode.africa";
const SUPER = "super@robocode.africa";
const TEACH = "curie@springfield.robocode.africa";

await shot("11-landing", "/", { full: true, wait: 1000 });
await shot("12-learn", "/app/learn", { email: S });
await shot("13-challenges", "/app/challenges", { email: S });
await shot("14-teams", "/app/teams", { email: S });
await shot("15-competitions", "/app/competitions", { email: S });
await shot("16-leaderboard", "/app/leaderboard", { email: S });
await shot("17-badges", "/app/badges", { email: S });
await shot("18-school-branding", "/app/school/branding", { email: ADMIN });
await shot("19-admin-approvals", "/app/admin/approvals", { email: SUPER });
await shot("20-teacher-classes", "/app/teacher/classes", { email: TEACH });

await browser.close();
console.log("done");
