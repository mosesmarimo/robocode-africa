import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shot(name, fn, { width = 1440, height = 900 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  await fn(page);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  await ctx.close();
  console.log("captured", name);
}

async function loginAs(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", email);
  await page.fill("#password", "password123");
  await page.click('button:has-text("Sign in")');
  await page.waitForURL("**/app", { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}

await shot("01-login", async (p) => {
  await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
});

await shot("02-signup", async (p) => {
  await p.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
});

await shot("03-dashboard-student", async (p) => {
  await loginAs(p, "tariro@springfield.robocode.africa");
});

await shot("04-dashboard-admin", async (p) => {
  await loginAs(p, "super@robocode.africa");
});

await shot("05-login-mobile", async (p) => {
  await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
}, { width: 414, height: 896 });

await browser.close();
console.log("done");
