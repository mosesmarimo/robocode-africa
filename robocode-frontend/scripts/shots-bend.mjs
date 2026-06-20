import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1.5 });
const page = await ctx.newPage();
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "tariro@springfield.robocode.africa");
await page.fill("#password", "password123");
await page.click('button:has-text("Sign in")');
await page.waitForURL("**/app", { timeout: 15000 });
await page.goto(`${BASE}/app/projects`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.click('a:has-text("Distance Alarm Robot")'); // ultrasonic: wires run over open canvas
await page.waitForURL("**/studio/**", { timeout: 15000 });
await page.waitForTimeout(5000);
await page.click('button[aria-label="Hide code panel"]').catch(()=>{});
await page.waitForTimeout(300);
await page.click('button[title="Fit to screen"]').catch(()=>{});
await page.waitForTimeout(400);

async function pointOnWire(idx, frac) {
  return await page.evaluate(({ idx, frac }) => {
    const paths = [...document.querySelectorAll('svg path[stroke="transparent"]')];
    const p = paths[idx]; if (!p) return null;
    const pt = p.getPointAtLength(p.getTotalLength() * frac);
    const m = p.getScreenCTM();
    return { x: m.a * pt.x + m.c * pt.y + m.e, y: m.b * pt.x + m.d * pt.y + m.f };
  }, { idx, frac });
}
// add + drag bends on two different wires to make tidy routes
for (const [idx, frac, dx, dy] of [[2, 0.5, 0, -90], [4, 0.5, 0, 90]]) {
  let q = await pointOnWire(idx, frac);
  if (q) { await page.mouse.dblclick(q.x, q.y); await page.waitForTimeout(350);
    q = await pointOnWire(idx, frac);
    await page.mouse.move(q.x, q.y); await page.mouse.down();
    await page.mouse.move(q.x + dx, q.y + dy, { steps: 10 }); await page.mouse.up();
    await page.waitForTimeout(300);
  }
}
await page.screenshot({ path: "screenshots/33-bend.png" });
console.log("done");
await browser.close();
