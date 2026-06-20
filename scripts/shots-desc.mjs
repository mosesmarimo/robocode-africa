import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 920 }, deviceScaleFactor: 1.25 });
const page = await ctx.newPage();
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "tariro@springfield.robocode.africa");
await page.fill("#password", "password123");
await page.click('button:has-text("Sign in")');
await page.waitForURL("**/app", { timeout: 15000 });
await page.goto(`${BASE}/app/projects`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.click('a:has-text("Wokwi: 7-Segment Clock")');
await page.waitForURL("**/studio/**", { timeout: 15000 });
await page.waitForTimeout(5000);
await page.screenshot({ path: "screenshots/36-clock-orthogonal.png" });
console.log("captured simulation (orthogonal wires + file tabs)");
// switch to Description tab
await page.click('button:has-text("Description")');
await page.waitForTimeout(900);
await page.screenshot({ path: "screenshots/37-description.png" });
console.log("captured description");
// click a different file tab
await page.click('button:has-text("Description")'); // ensure not blocking
await page.click('button:has-text("README.md")').catch(()=>{});
await page.waitForTimeout(600);
await page.screenshot({ path: "screenshots/38-readme-tab.png" });
console.log("captured readme file tab");
await browser.close();
