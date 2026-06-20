import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 920 }, deviceScaleFactor: 1.25 });
const page = await ctx.newPage();
// login
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "tariro@springfield.robocode.africa");
await page.fill("#password", "password123");
await page.click('button:has-text("Sign in")');
await page.waitForURL("**/app", { timeout: 15000 });

// Block editor
await page.goto(`${BASE}/studio/new`, { waitUntil: "networkidle" });
await page.waitForTimeout(4000);
await page.click('button:has-text("Blocks")').catch(()=>{});
await page.waitForTimeout(1200);
await page.screenshot({ path: "screenshots/25-blocks.png" });
console.log("captured 25-blocks");

// NeoPixel sim
await page.goto(`${BASE}/app/projects`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.click('a:has-text("NeoPixel Rainbow")');
await page.waitForURL("**/studio/**", { timeout: 15000 });
await page.waitForTimeout(4000);
await page.click('button:has-text("Run")');
await page.waitForTimeout(1500);
await page.screenshot({ path: "screenshots/26-neopixel.png" });
console.log("captured 26-neopixel");

// Landing footer (language switcher)
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(800);
await page.screenshot({ path: "screenshots/27-footer-i18n.png" });
console.log("captured 27-footer-i18n");

await browser.close();
