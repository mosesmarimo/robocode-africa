import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "screenshots";
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 920 }, deviceScaleFactor: 1.25 });
const page = await ctx.newPage();

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "tariro@springfield.robocode.africa");
await page.fill("#password", "password123");
await page.click('button:has-text("Sign in")');
await page.waitForURL("**/app", { timeout: 15000 });

await page.goto(`${BASE}/app/projects`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.click('a:has-text("LCD Hello World")');
await page.waitForURL("**/studio/**", { timeout: 15000 });
await page.waitForTimeout(4500);
await page.click('button:has-text("Run")');
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}/21-lcd-sim.png` });
console.log("captured 21-lcd-sim");

await browser.close();
console.log("done");
