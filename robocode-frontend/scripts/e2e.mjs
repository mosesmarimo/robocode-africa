import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "screenshots";
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const pass = [];
const fail = [];
const check = (name, ok) => (ok ? pass : fail).push(name) && console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);

const email = `newstudent_${Date.now()}@example.com`;

// 1) Signup as a new student
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
  await page.fill("#displayName", "Test Student");
  await page.fill("#email", email);
  await page.fill("#password", "password123");
  await page.fill("#birthYear", "2010");
  await page.click('button:has-text("Create student account")');
  await page.waitForURL("**/pending", { timeout: 15000 }).catch(() => {});
  check("Signup redirects to /pending (approval-gated)", page.url().includes("/pending"));
  await ctx.close();
}

// 2) Pending student cannot log in
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", email);
  await page.fill("#password", "password123");
  await page.click('button:has-text("Sign in")');
  await page.waitForTimeout(1500);
  const body = await page.textContent("body");
  check("Pending student is blocked at login", page.url().includes("/login") && /await/i.test(body || ""));
  await ctx.close();
}

// 3) Super admin approves pending signups
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", "super@robocode.africa");
  await page.fill("#password", "password123");
  await page.click('button:has-text("Sign in")');
  await page.waitForURL("**/app", { timeout: 15000 });
  await page.goto(`${BASE}/app/admin/approvals`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const sawStudent = (await page.textContent("body"))?.includes(email);
  check("Admin approvals shows the new student", !!sawStudent);
  await page.screenshot({ path: `${OUT}/22-admin-approvals-pending.png` });
  // approve all pending
  for (let i = 0; i < 8; i++) {
    const b = page.locator('button:has-text("Approve")').first();
    if ((await b.count()) === 0) break;
    await b.click().catch(() => {});
    await page.waitForTimeout(900);
  }
  await ctx.close();
}

// 4) Approved student can now log in
let studentCtx;
{
  studentCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await studentCtx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", email);
  await page.fill("#password", "password123");
  await page.click('button:has-text("Sign in")');
  await page.waitForURL("**/app", { timeout: 15000 }).catch(() => {});
  check("Approved student reaches the dashboard", page.url().endsWith("/app"));
}

// 5) Student solves the Blink challenge and earns points
{
  const page = await studentCtx.newPage();
  await page.goto(`${BASE}/app/challenges/blink-led`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const ta = page.locator("textarea").first();
  if ((await ta.count()) > 0) {
    await ta.fill(`void setup(){ pinMode(13,OUTPUT); Serial.begin(9600); Serial.println("LED ready"); }
void loop(){ digitalWrite(13,HIGH); delay(300); digitalWrite(13,LOW); delay(300); }`);
    await page.click('button:has-text("submit"), button:has-text("Submit"), button:has-text("checks")').catch(() => {});
    await page.waitForTimeout(2500);
    const body = (await page.textContent("body")) || "";
    check("Challenge submission grades as passed", /100%|passed|solved|great|correct/i.test(body));
    await page.screenshot({ path: `${OUT}/23-challenge-passed.png` });
  } else {
    check("Challenge submission grades as passed", false);
  }
  await studentCtx.close();
}

await browser.close();
console.log(`\n==== E2E: ${pass.length} passed, ${fail.length} failed ====`);
if (fail.length) console.log("Failed:", fail.join("; "));
