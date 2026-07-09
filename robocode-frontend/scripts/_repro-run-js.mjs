// Temporary repro: does the locked-worker JS sandbox (src/lib/run/run-js.ts)
// actually execute code, actually kill infinite loops at the real wall-clock
// limit, block network access, and block nested-Worker egress? This mirrors
// the production worker preamble/race verbatim (Web Workers can't be
// imported from Node, only exercised in a real page), then asserts on the
// load-bearing behaviors.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Derive the real shipped wall-clock limit from src/lib/run/types.ts instead
// of hardcoding a guessed value — this is what makes the timing assertion
// below actually verify the shipped constant, not an independent number that
// happens to also pass.
const typesSrc = readFileSync(path.join(__dirname, "../src/lib/run/types.ts"), "utf8");
const wallMatch = typesSrc.match(/BROWSER_WALL_MS\s*=\s*(\d+)/);
if (!wallMatch) throw new Error("Could not find BROWSER_WALL_MS in src/lib/run/types.ts");
const BROWSER_WALL_MS = Number(wallMatch[1]);

const BASE = "http://localhost:3000";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("console", (m) => { if (m.type() === "error") console.log("PAGE ERROR:", m.text().slice(0, 300)); });

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "ada@robocode.africa");
await page.fill("#password", "password123");
await page.click('button:has-text("Sign in")');
await page.waitForURL("**/app", { timeout: 20000 });

const result = await page.evaluate(async (WALL_MS) => {
  // Verbatim mirror of the WORKER_SRC in src/lib/run/run-js.ts.
  const WORKER_SRC = `
    self.fetch = () => { throw new Error("Network access is disabled in the sandbox."); };
    self.XMLHttpRequest = undefined; self.WebSocket = undefined;
    self.EventSource = undefined; self.importScripts = () => { throw new Error("importScripts disabled"); };
    self.Worker = undefined; self.SharedWorker = undefined;
    try {
      Object.defineProperty(self, "caches", { configurable: true, value: undefined });
    } catch (e) { /* best effort; fetch/XHR/WebSocket/Worker are already gone regardless */ }
    try {
      self.navigator.sendBeacon = () => { throw new Error("sendBeacon is disabled in the sandbox."); };
    } catch (e) {
      try {
        Object.defineProperty(self.navigator, "sendBeacon", {
          configurable: true,
          value: () => { throw new Error("sendBeacon is disabled in the sandbox."); },
        });
      } catch (e2) { /* nothing more we can do; fetch/XHR/WebSocket/Worker are already gone */ }
    }
    let __out = "";
    const __w = (...a) => { __out += a.map(x => typeof x === "string" ? x : (()=>{try{return JSON.stringify(x)}catch{return String(x)}})()).join(" ") + "\\n"; };
    console.log = __w; console.info = __w; console.warn = __w; console.error = __w;
    self.onmessage = (e) => {
      try { (0, eval)(e.data); self.postMessage({ ok: true, out: __out }); }
      catch (err) { __out += (err && err.stack ? err.stack : String(err)); self.postMessage({ ok: true, out: __out, error: true }); }
    };
  `;

  function runInWorker(source, wallMs) {
    const start = Date.now();
    return new Promise((resolve) => {
      const blob = new Blob([WORKER_SRC], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      const worker = new Worker(url);
      let settled = false;
      const cleanup = () => {
        clearTimeout(timer);
        worker.terminate();
        URL.revokeObjectURL(url);
      };
      const finish = (outcome) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(outcome);
      };
      const timer = setTimeout(() => {
        finish({ timedOut: true, error: true, output: "timeout", durationMs: Date.now() - start });
      }, wallMs);
      worker.onmessage = (e) => {
        const msg = e.data;
        finish({ timedOut: false, error: !!msg?.error, output: msg?.out ?? "", durationMs: Date.now() - start });
      };
      worker.onerror = (e) => {
        e.preventDefault();
        finish({ timedOut: false, error: true, output: e.message || "worker error", durationMs: Date.now() - start });
      };
      worker.postMessage(source);
    });
  }

  // Sandbox code that tries to spawn a nested Worker (whose fresh global scope
  // would otherwise have fully intact fetch/XHR/WebSocket, and would attach
  // cookies to same-origin requests — defeating "network disabled"). With
  // self.Worker neutered above, the constructor call itself must throw before
  // the nested worker (and its fetch) ever exists.
  const NESTED_WORKER_SRC = `
    try {
      new Worker(URL.createObjectURL(new Blob(["fetch('http://example.com')"])));
      console.log("WORKER_SPAWNED");
    } catch (e) {
      console.log("WORKER_BLOCKED:", e && e.message);
    }
  `;

  const a = await runInWorker("console.log(2 + 2);", WALL_MS);
  // Use the SAME wall-clock budget as production (BROWSER_WALL_MS, passed in
  // as WALL_MS) so this actually verifies the shipped constant kills an
  // infinite loop at ~5s, not some looser number that happens to also pass.
  const b = await runInWorker("while (true) {}", WALL_MS);
  const c = await runInWorker('fetch("http://example.com");', WALL_MS);
  const d = await runInWorker(NESTED_WORKER_SRC, WALL_MS);
  // caches is a getter-only accessor inherited from the WorkerGlobalScope
  // prototype chain, so a plain `self.caches = undefined` silently no-ops —
  // this asserts the Object.defineProperty neutering actually took effect
  // (regression check for the bug this repro was written to catch).
  const e = await runInWorker("console.log(typeof caches, caches);", WALL_MS);

  return { a, b, c, d, e };
}, BROWSER_WALL_MS);

let failed = false;

const aOk = !result.a.error && result.a.output.trim() === "4";
console.log(aOk ? `PASS: console.log(2+2) -> "${result.a.output.trim()}"` : `FAIL: expected "4", got ${JSON.stringify(result.a)}`);
if (!aOk) failed = true;

// Assert the loop is killed at ~the real BROWSER_WALL_MS limit (with slack
// for scheduling jitter), not merely "before some looser number" — this is
// what actually verifies the shipped constant rather than an unrelated one.
const bOk =
  result.b.timedOut === true &&
  result.b.durationMs >= BROWSER_WALL_MS - 50 &&
  result.b.durationMs < BROWSER_WALL_MS + 2000;
console.log(
  bOk
    ? `PASS: while(true){} timed out after ${result.b.durationMs}ms (BROWSER_WALL_MS=${BROWSER_WALL_MS}, worker terminated)`
    : `FAIL: infinite loop did not time out at the real ${BROWSER_WALL_MS}ms limit: ${JSON.stringify(result.b)}`,
);
if (!bOk) failed = true;

const cOk = result.c.error === true && /disabled/i.test(result.c.output);
console.log(cOk ? `PASS: fetch() blocked -> "${result.c.output.trim()}"` : `FAIL: fetch was not blocked: ${JSON.stringify(result.c)}`);
if (!cOk) failed = true;

const dOk = /WORKER_BLOCKED/.test(result.d.output) && !/WORKER_SPAWNED/.test(result.d.output);
console.log(dOk ? `PASS: nested Worker() blocked -> "${result.d.output.trim()}"` : `FAIL: nested Worker was not blocked: ${JSON.stringify(result.d)}`);
if (!dOk) failed = true;

const eOk = !result.e.error && /^undefined/.test(result.e.output.trim());
console.log(eOk ? `PASS: caches neutered -> "${result.e.output.trim()}"` : `FAIL: caches was not neutered (still a live accessor): ${JSON.stringify(result.e)}`);
if (!eOk) failed = true;

await browser.close();
console.log(failed ? "REPRO DONE (FAILURES)" : "REPRO DONE (ALL PASS)");
if (failed) process.exitCode = 1;
