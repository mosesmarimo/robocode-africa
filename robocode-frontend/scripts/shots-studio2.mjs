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
await page.waitForTimeout(500);

async function openAndShot(name, file) {
  await page.goto(`${BASE}/app/projects`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.click(`a:has-text("${name}")`);
  await page.waitForURL("**/studio/**", { timeout: 15000 });
  await page.waitForTimeout(5000); // wait for wokwi render + auto-fit (450ms)
  await page.screenshot({ path: `screenshots/${file}` });
  console.log("captured", file, "->", name);
}

await openAndShot("My Blinking LED", "29-studio-fit-blink.png");
await openAndShot("LCD Hello World", "30-studio-fit-lcd.png");

// collapse panels for full-width canvas
await page.click('button[aria-label="Hide components"]').catch(()=>{});
await page.click('button[aria-label="Hide code panel"]').catch(()=>{});
await page.waitForTimeout(600);
// re-fit after layout change
await page.click('button[title="Fit to screen"]').catch(()=>{});
await page.waitForTimeout(600);
await page.screenshot({ path: "screenshots/31-studio-fullbleed.png" });
console.log("captured 31-studio-fullbleed");

await browser.close();
