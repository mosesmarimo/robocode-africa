import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 920 }, deviceScaleFactor: 1.25 });
const page = await ctx.newPage();

// login
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "tariro@springfield.robocode.africa");
await page.fill("#password", "password123");
await page.click('button:has-text("Sign in")');
await page.waitForURL("**/app", { timeout: 15000 });

// projects page
await page.goto(`${BASE}/app/projects`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/06-projects.png` });
console.log("captured projects");

// open first project's studio
const href = await page.getAttribute('a[href^="/studio/"]', "href");
console.log("opening", href);
await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
// wait for wokwi elements + monaco to render
await page.waitForTimeout(4500);
await page.screenshot({ path: `${OUT}/07-studio.png` });
console.log("captured studio");

// add a component from palette to show interaction
try {
  await page.click('button:has-text("Servo Motor (SG90)")', { timeout: 3000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/08-studio-add.png` });
  console.log("captured studio-add");
} catch (e) {
  console.log("add step skipped:", e.message);
}

await browser.close();
console.log("done");
