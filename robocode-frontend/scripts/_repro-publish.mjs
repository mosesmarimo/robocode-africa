// Temporary repro: publish-to-subdomain routing (Task 4) — does publishing a
// project to robocode.studio actually serve a chromeless, read-only render at
// the rewrite target `/_site/<domain>/<subdomain>` (a real *.robocode.studio
// host can't be spoofed locally without /etc/hosts, so this hits the rewrite
// target directly — the same URL src/proxy.ts rewrites a real subdomain
// request to), with the "Built with RoboCode — make your own" footer CTA
// carrying the publisher's referral code?
//
// Flow: log in as ada -> create a fresh robotics project via the API -> read
// ada's real referral code off /app/invite (mirrors _repro-referral.mjs) ->
// publish the project to a random robocode.studio subdomain -> GET the
// rewrite target and assert the read-only Studio render + the CTA's ref.
//
// Part 2 (Task 5): the Publish dialog itself (src/components/studio/publish-
// dialog.tsx) — opens already-published (shows the live URL + Unpublish),
// Unpublish flips it back to the picker, the debounced availability check
// goes red for a reserved name and green for a fresh one, and Publish from
// the dialog actually lands the project on a live, real _site render.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";

let failed = false;
function assertTrue(cond, msg) {
  console.log(cond ? `PASS: ${msg}` : `FAIL: ${msg}`);
  if (!cond) failed = true;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("console", (m) => {
  if (m.type() === "error") console.log("PAGE ERROR:", m.text().slice(0, 400));
});

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "ada@robocode.africa");
await page.fill("#password", "password123");
await page.click('button:has-text("Sign in")');
await page.waitForURL("**/app", { timeout: 20000 });

// Real referral code, off /app/invite (same extraction as _repro-referral.mjs).
await page.goto(`${BASE}/app/invite`, { waitUntil: "networkidle" });
await page.waitForSelector("code", { timeout: 20000 });
const linkText = ((await page.locator("code").first().textContent()) ?? "").trim();
const refMatch = linkText.match(/ref=([A-Za-z0-9]+)/);
const adaRefCode = refMatch?.[1];
assertTrue(!!adaRefCode, `extracted ada's real referral code from /app/invite (got ${JSON.stringify(adaRefCode)})`);

// Create a fresh robotics project to publish (page.request shares the
// browser context's rc_session cookie; the backend's JwtAuthGuard accepts
// either the cookie or a Bearer header — see robocode-backend/src/auth/jwt-auth.guard.ts).
const title = `Publish Test ${Date.now()}`;
const createRes = await page.request.post(`${BASE}/api/v1/projects`, {
  data: {
    title,
    kind: "robotics",
    board: "arduino-uno",
    diagram: { board: "arduino-uno", parts: [{ id: "mcu", type: "__board__:arduino-uno", x: 360, y: 220, rotation: 0 }], wires: [] },
    files: [{ name: "sketch.ino", language: "arduino", content: "void setup() {}\nvoid loop() {}\n" }],
  },
});
assertTrue(createRes.ok(), `POST /projects created a project (status ${createRes.status()})`);
const created = await createRes.json();
const projectId = created.projectId;
assertTrue(!!projectId, `got a projectId back (${JSON.stringify(projectId)})`);

// Publish it to a random robocode.studio subdomain.
const subdomain = `sitetest${Date.now().toString(36)}`;
const publishRes = await page.request.post(`${BASE}/api/v1/projects/${projectId}/publish`, {
  data: { domain: "robocode.studio", subdomain },
});
assertTrue(publishRes.ok(), `POST /projects/:id/publish succeeded (status ${publishRes.status()})`);
const published = await publishRes.json();
assertTrue(published.url === `https://${subdomain}.robocode.studio`, `publish response url is https://${subdomain}.robocode.studio (got ${JSON.stringify(published.url)})`);

// Hit the rewrite target directly (proxy.ts rewrites a real
// `<sub>.robocode.studio` host to this exact path — can't spoof that host
// locally without /etc/hosts, so this exercises the _site route itself).
await page.goto(`${BASE}/_site/robocode.studio/${subdomain}`, { waitUntil: "networkidle" });

const bodyText = (await page.locator("body").textContent()) ?? "";
assertTrue(!/isn.t published/i.test(bodyText), "the published site did NOT render the 'not published' fallback");
assertTrue(bodyText.includes(title), `the project title ("${title}") renders on the published site`);
assertTrue(bodyText.includes("Arduino UNO R3"), "the board name renders (confirms the real read-only Studio, not a generic view)");
assertTrue(bodyText.includes("Built with RoboCode"), "the footer CTA copy renders");

const ctaHref = await page.locator('a:has-text("Make your own")').first().getAttribute("href");
console.log("CTA href:", ctaHref);
assertTrue(!!ctaHref && ctaHref.includes("/join?ref="), "the CTA links to /join?ref=...");
assertTrue(!!ctaHref && ctaHref.includes(`ref=${adaRefCode}`), `the CTA's ref matches ada's real referral code (${adaRefCode})`);

// The read-only Studio canvas/editor actually mounted (client-hydrated), not
// just a static shell — the Run control is part of that hydrated component.
await page.waitForSelector('button:has-text("Run")', { timeout: 20000 });
assertTrue(true, "the read-only Studio's Run control mounted");

// --- Part 2: the Publish dialog UI, on the project's real Studio page ---
await page.goto(`${BASE}/studio/${projectId}`, { waitUntil: "networkidle" });
await page.waitForSelector('button:has-text("Publish")', { timeout: 20000 });
await page.click('button:has-text("Publish")');

// Already published (via the API, above) — the dialog should open straight
// to the "published" phase: the live URL + an Unpublish button.
const dialog = page.locator('[role="dialog"]');
await dialog.waitFor({ timeout: 10000 });
const publishedCode = dialog.locator("code");
await publishedCode.waitFor({ timeout: 10000 });
const shownUrl = ((await publishedCode.textContent()) ?? "").trim();
assertTrue(shownUrl === `https://${subdomain}.robocode.studio`, `dialog opens to "published" phase showing the live URL (got ${JSON.stringify(shownUrl)})`);

await dialog.locator('button:has-text("Unpublish")').click();
const subdomainInput = dialog.locator("#publish-subdomain");
await subdomainInput.waitFor({ timeout: 10000 });
assertTrue(true, 'Unpublish flips the dialog back to the "unpublished" picker (domain select + address input)');

// A reserved name → the debounced availability check should go red.
await subdomainInput.fill("admin");
await page.waitForFunction(
  () => document.body.textContent?.includes("belongs to a school") || document.body.textContent?.includes("reserved") || document.body.textContent?.includes("isn't available"),
  { timeout: 10000 },
);
const reservedMsg = (await dialog.textContent()) ?? "";
assertTrue(/reserved|isn.t available|belongs to a school/i.test(reservedMsg), "a reserved subdomain name shows an unavailable (red) reason");
const publishBtn = dialog.locator('button:has-text("Publish")');
assertTrue(await publishBtn.isDisabled(), "Publish stays disabled while the name is unavailable");

// A fresh, available name → green, then actually publish through the dialog.
const dialogSub = `dlgtest${Date.now().toString(36)}`;
await subdomainInput.fill("");
await subdomainInput.fill(dialogSub);
await page.waitForFunction(
  (name) => document.body.textContent?.includes(`${name}.robocode.studio is available`),
  dialogSub,
  { timeout: 10000 },
);
assertTrue(true, `a fresh subdomain ("${dialogSub}") shows as available (green)`);
assertTrue(!(await publishBtn.isDisabled()), "Publish becomes enabled once the name is available");

await publishBtn.click();
await publishedCode.waitFor({ timeout: 15000 });
const dialogPublishedUrl = ((await publishedCode.textContent()) ?? "").trim();
assertTrue(
  dialogPublishedUrl === `https://${dialogSub}.robocode.studio`,
  `publishing from the dialog succeeded and shows the new live URL (got ${JSON.stringify(dialogPublishedUrl)})`,
);

// And it's really live — the _site route serves it, same as Part 1.
await page.goto(`${BASE}/_site/robocode.studio/${dialogSub}`, { waitUntil: "networkidle" });
const dialogSiteText = (await page.locator("body").textContent()) ?? "";
assertTrue(dialogSiteText.includes(title), "the project published via the dialog is live at its new _site render");

await browser.close();
console.log(failed ? "REPRO DONE (FAILURES)" : "REPRO DONE (ALL PASS)");
if (failed) process.exitCode = 1;
