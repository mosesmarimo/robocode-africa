import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 920 }, deviceScaleFactor: 1.5 });
const page = await ctx.newPage();
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "tariro@springfield.robocode.africa");
await page.fill("#password", "password123");
await page.click('button:has-text("Sign in")');
await page.waitForURL("**/app", { timeout: 15000 });

async function open(name) {
  await page.goto(`${BASE}/app/projects`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.click(`a:has-text("${name}")`);
  await page.waitForURL("**/studio/**", { timeout: 15000 });
  await page.waitForTimeout(5000);
}

// ESP32 — run + verify wires to correct pins
await open("ESP32 Blink");
// collapse code panel for a bigger view
await page.click('button[aria-label="Hide code panel"]').catch(()=>{});
await page.waitForTimeout(400);
await page.click('button[title="Fit to screen"]').catch(()=>{});
await page.waitForTimeout(400);
await page.click('button:has-text("Run")');
await page.waitForTimeout(1200);
await page.screenshot({ path: "screenshots/32-esp32-run.png" });
console.log("captured 32-esp32-run");

// Bend point demo on UNO blink
await open("My Blinking LED");
const hit = page.locator('svg path[stroke="transparent"]').first();
const box = await hit.boundingBox();
if (box) {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.dblclick(cx, cy);
  await page.waitForTimeout(500);
  // drag the bend handle a bit
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy - 60, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(500);
}
await page.screenshot({ path: "screenshots/33-bend.png" });
console.log("captured 33-bend");
await browser.close();
