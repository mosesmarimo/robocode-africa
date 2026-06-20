import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 920 }, deviceScaleFactor: 1.25 });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("PAGE ERROR:", m.text().slice(0, 200)); });

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "tariro@springfield.robocode.africa");
await page.fill("#password", "password123");
await page.click('button:has-text("Sign in")');
await page.waitForURL("**/app", { timeout: 15000 });

await page.goto(`${BASE}/app/projects`, { waitUntil: "networkidle" });
const hrefs = await page.$$eval('a[href^="/studio/"]', (els) => els.map((e) => e.getAttribute("href")));
const projHref = hrefs.find((h) => h && h !== "/studio/new");
console.log("opening project:", projHref);
await page.goto(`${BASE}${projHref}`, { waitUntil: "networkidle" });
await page.waitForTimeout(4500);
await page.screenshot({ path: `${OUT}/09-studio-loaded.png` });

// Run the simulation
await page.click('button:has-text("Run")');
// capture a few frames to catch the LED ON phase
for (let i = 0; i < 5; i++) {
  await page.waitForTimeout(220);
  await page.screenshot({ path: `${OUT}/10-sim-${i}.png` });
}
// read serial monitor text
const serial = await page.evaluate(() => {
  const el = [...document.querySelectorAll("div")].find((d) => d.textContent?.includes("Serial Monitor"));
  return el ? el.textContent : "(serial not found)";
});
console.log("serial area:", (serial || "").replace(/\s+/g, " ").slice(0, 200));

await browser.close();
console.log("done");
