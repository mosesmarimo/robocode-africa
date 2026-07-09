// Temporary repro: does the Coding Studio's Run button actually drive the
// tiered browser -> server -> AI resolution (Tasks 5+6), not just the AI
// fallback it used exclusively before this change? Exercises the real UI in
// a real browser tab (Monaco + the Studio's Web Worker sandboxes can't be
// driven from Node), asserting both the visible output AND the engine badge
// rendered next to "Output" in the panel header (coding-studio.tsx).
//
// - cpp is DEFAULT_CODE_LANG (src/lib/studio/coding.ts), so a fresh
//   `/studio/new?mode=coding` loads with the cpp starter already active —
//   no language switch needed for the server-tier assertion. cpp routes to
//   `robocode-sandbox-base` (robocode-backend/src/modules/run/sandbox.service.ts),
//   which is confirmed built locally, so this always runs the real
//   assertion rather than skipping it.
// - python and javascript are switched to via the language <Select> in the
//   toolbar; both have real browser engines (Pyodide / Web Worker) and their
//   starter code prints "Hello World!!!", so a real browser-tier run is
//   asserted for each.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.on("dialog", (d) => d.accept()); // changeLang()'s window.confirm, if ever triggered
page.on("console", (m) => {
  if (m.type() === "error") console.log("PAGE ERROR:", m.text().slice(0, 400));
});

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "ada@robocode.africa");
await page.fill("#password", "password123");
await page.click('button:has-text("Sign in")');
await page.waitForURL("**/app", { timeout: 20000 });

await page.goto(`${BASE}/studio/new?mode=coding`, { waitUntil: "networkidle" });
// Monaco mounts async; wait for the editor surface before touching anything.
await page.waitForSelector(".monaco-editor", { timeout: 20000 });

const outputHeader = page.locator("div.border-b.border-border.bg-card", { hasText: "Output" }).first();
const outputPre = page.locator("pre");

async function run(label) {
  await page.click('button:has-text("Run")');
  // Real runs (server compile, worker execute) take a moment; poll until the
  // "Running…" placeholder is replaced.
  await page.waitForFunction(
    () => {
      const pre = document.querySelector("pre");
      return !!pre && pre.textContent !== "Running…";
    },
    { timeout: 30000 },
  );
  const text = (await outputPre.textContent()) ?? "";
  const badge = (await outputHeader.textContent()) ?? "";
  console.log(`--- ${label} ---`);
  console.log("output:", JSON.stringify(text.slice(0, 200)));
  console.log("header:", JSON.stringify(badge.replace(/\s+/g, " ").trim()));
  return { text, badge };
}

let failed = false;
function assertTrue(cond, msg) {
  console.log(cond ? `PASS: ${msg}` : `FAIL: ${msg}`);
  if (!cond) failed = true;
}

// --- cpp (default language): server tier ---
const cpp = await run("cpp (server tier)");
assertTrue(cpp.text.includes("Hello World!!!"), "cpp run output contains 'Hello World!!!'");
assertTrue(cpp.badge.includes("Ran on server"), "cpp run shows the 'Ran on server' badge");

// --- python: browser tier ---
await page.getByRole("combobox").click();
await page.getByRole("option", { name: "Python" }).click();
await page.waitForSelector(".monaco-editor");
const py = await run("python (browser tier)");
assertTrue(py.text.includes("Hello World!!!"), "python run output contains 'Hello World!!!'");
assertTrue(py.badge.includes("Ran in your browser"), "python run shows the 'Ran in your browser' badge");

// --- javascript: browser tier ---
await page.getByRole("combobox").click();
await page.getByRole("option", { name: "JavaScript" }).click();
await page.waitForSelector(".monaco-editor");
const js = await run("javascript (browser tier)");
assertTrue(js.text.includes("Hello World!!!"), "javascript run output contains 'Hello World!!!'");
assertTrue(js.badge.includes("Ran in your browser"), "javascript run shows the 'Ran in your browser' badge");

await browser.close();
console.log(failed ? "REPRO DONE (FAILURES)" : "REPRO DONE (ALL PASS)");
if (failed) process.exitCode = 1;
