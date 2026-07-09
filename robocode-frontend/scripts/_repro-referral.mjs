// Repro for the web referral hub (Task 4): does /app/invite render the
// caller's real code + an absolute join link + live stats, and does hitting
// /join?ref=<code> from a fresh (unauthenticated) browser context capture the
// referral cookie and surface the "invited by" banner on /signup?
//
// Full end-to-end settle (referrer stats incrementing after a second signup +
// activation) is out of scope here per the task brief — this gates the hub
// render + the ref-capture path, which is what Task 4 asks for.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";

let failed = false;
function assertTrue(cond, msg) {
  console.log(cond ? `PASS: ${msg}` : `FAIL: ${msg}`);
  if (!cond) failed = true;
}

const browser = await chromium.launch();

// --- Part 1: log in as A, open /app/invite, read the code + link + stats ---
const authedPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
authedPage.on("console", (m) => {
  if (m.type() === "error") console.log("PAGE ERROR:", m.text().slice(0, 400));
});

await authedPage.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await authedPage.fill("#email", "ada@robocode.africa");
await authedPage.fill("#password", "password123");
await authedPage.click('button:has-text("Sign in")');
await authedPage.waitForURL("**/app", { timeout: 20000 });

await authedPage.goto(`${BASE}/app/invite`, { waitUntil: "networkidle" });
await authedPage.waitForSelector("code", { timeout: 20000 });

const linkText = ((await authedPage.locator("code").first().textContent()) ?? "").trim();
console.log("invite link:", linkText);
assertTrue(/^https?:\/\//.test(linkText), "invite link is an absolute URL");
assertTrue(linkText.includes("/join?ref="), "invite link points at /join?ref=<code>");

const refMatch = linkText.match(/ref=([A-Za-z0-9]+)/);
const code = refMatch?.[1];
assertTrue(!!code, "a referral code was extracted from the invite link");

const bodyText = (await authedPage.locator("body").textContent()) ?? "";
assertTrue(bodyText.includes("Friends referred"), "stats: 'Friends referred' renders");
assertTrue(bodyText.includes("Rewarded signups"), "stats: 'Rewarded signups' renders");
assertTrue(bodyText.includes("RoboPoints earned"), "stats: 'RoboPoints earned' renders");
assertTrue(bodyText.includes("Top recruiters"), "leaderboard section renders");
assertTrue(bodyText.includes(code ?? "\0"), "the referral code chip renders on the page");

await authedPage.close();

// --- Part 2: fresh (unauthenticated) context hits /join?ref=<code> ---
if (code) {
  const anonContext = await browser.newContext();
  const anonPage = await anonContext.newPage();
  anonPage.on("console", (m) => {
    if (m.type() === "error") console.log("PAGE ERROR:", m.text().slice(0, 400));
  });

  await anonPage.goto(`${BASE}/join?ref=${code}`, { waitUntil: "networkidle" });
  await anonPage.waitForURL("**/signup", { timeout: 20000 });

  const cookies = await anonContext.cookies();
  const refCookie = cookies.find((c) => c.name === "rc_ref");
  assertTrue(!!refCookie, "rc_ref cookie is set after /join?ref=<code>");
  assertTrue(refCookie?.value === code, "rc_ref cookie value matches the referral code");

  const signupText = (await anonPage.locator("body").textContent()) ?? "";
  assertTrue(signupText.includes("Invited by a friend"), '"Invited by a friend" banner renders on /signup');

  await anonContext.close();
} else {
  console.log("SKIP: part 2 — no referral code extracted from part 1");
  failed = true;
}

// --- Part 3: signup WITHOUT a ref still works (no banner, no crash) ---
const plainContext = await browser.newContext();
const plainPage = await plainContext.newPage();
await plainPage.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
const plainText = (await plainPage.locator("body").textContent()) ?? "";
assertTrue(!plainText.includes("Invited by a friend"), "no banner on a plain /signup visit (no ref cookie)");
assertTrue(plainText.includes("Create student account") || plainText.includes("I'm a student"), "signup form still renders without a ref");
await plainContext.close();

await browser.close();
console.log(failed ? "REPRO DONE (FAILURES)" : "REPRO DONE (ALL PASS)");
if (failed) process.exitCode = 1;
