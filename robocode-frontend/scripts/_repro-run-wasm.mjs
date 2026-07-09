// Temporary repro: do the Pyodide (Python) and sql.js (SQL) browser-sandbox
// engines actually execute code, actually kill an infinite Python loop, and
// actually surface errors as captured output? Mirrors _repro-run-js.mjs's
// approach: exercise the worker/wasm protocol directly in a real browser tab
// (Node can't run Web Workers or compile wasm the same way a browser does),
// against the REAL self-hosted assets served at runtime —
// public/sandbox/pyodide-worker.js is the actual file
// src/lib/run/run-python.ts instantiates via `new Worker(...)`, and
// public/sandbox/sql-wasm.{js,wasm} are the actual files run-sql.ts loads.
// The SQL case below re-implements run-sql.ts's exec/format logic inline
// (same reasoning as run-js.ts's WORKER_SRC mirror: this is what's
// Node-unreachable, not what's hard to import) — see run-sql.ts for the
// production formatting/guard logic this approximates.
//
// Pyodide's cold boot (fetching + wasm-compiling ~10MB of self-hosted
// assets) can take 10-30s, so this uses a generous timeout for the Python
// cases.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("console", (m) => {
  if (m.type() === "error") console.log("PAGE ERROR:", m.text().slice(0, 400));
});

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill("#email", "ada@robocode.africa");
await page.fill("#password", "password123");
await page.click('button:has-text("Sign in")');
await page.waitForURL("**/app", { timeout: 20000 });

function runPythonInPage(code, wallMs) {
  return page.evaluate(
    async ({ code, wallMs }) => {
      const worker = new Worker("/sandbox/pyodide-worker.js");
      try {
        await new Promise((resolve, reject) => {
          worker.onmessage = (e) => {
            if (e.data?.type === "ready") resolve();
            else if (e.data?.type === "load-error") reject(new Error(e.data.message));
          };
          worker.onerror = (e) => reject(new Error(e.message || "worker error"));
        });
      } catch (err) {
        worker.terminate();
        return { timedOut: false, error: true, output: String(err), durationMs: 0 };
      }

      // Measured from here, not from worker creation: Pyodide's cold boot
      // (awaited above) must never count against wallMs, or the timing
      // assertion below would be measuring load time, not kill latency.
      const start = Date.now();
      return new Promise((resolve) => {
        let settled = false;
        const finish = (v) => {
          if (settled) return;
          settled = true;
          resolve(v);
        };
        const timer = setTimeout(() => {
          worker.terminate();
          finish({ timedOut: true, error: true, output: "timeout", durationMs: Date.now() - start });
        }, wallMs);
        worker.onmessage = (e) => {
          if (e.data?.type !== "result") return;
          clearTimeout(timer);
          finish({
            timedOut: false,
            error: !!e.data.error,
            output: e.data.out ?? "",
            durationMs: Date.now() - start,
          });
        };
        worker.postMessage({ type: "run", code });
      });
    },
    { code, wallMs },
  );
}

function runSqlInPage(sql) {
  return page.evaluate(async (sql) => {
    await new Promise((resolve, reject) => {
      if (window.initSqlJs) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = "/sandbox/sql-wasm.js";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("failed to load sql.js"));
      document.head.appendChild(s);
    });
    const SQL = await window.initSqlJs({ locateFile: () => "/sandbox/sql-wasm.wasm" });
    const db = new SQL.Database();
    const tables = [];
    let errorOut = null;
    try {
      for (const stmt of db.iterateStatements(sql)) {
        const columns = stmt.getColumnNames();
        const rows = [];
        try {
          while (stmt.step()) rows.push(stmt.get());
        } finally {
          stmt.free();
        }
        if (columns.length > 0) {
          tables.push(columns.join(" | ") + "\n" + rows.map((r) => r.join(" | ")).join("\n"));
        }
      }
    } catch (err) {
      errorOut = err && err.message ? err.message : String(err);
    } finally {
      db.close();
    }
    return {
      error: errorOut !== null,
      output: errorOut ?? (tables.length ? tables.join("\n\n") : "(no rows returned)"),
    };
  }, sql);
}

let failed = false;

const py = await runPythonInPage("print(sum(range(10)))", 60000);
const pyOk = !py.error && py.output.includes("45");
console.log(pyOk ? `PASS: python sum(range(10)) -> ${JSON.stringify(py.output)}` : `FAIL: python: ${JSON.stringify(py)}`);
if (!pyOk) failed = true;

const pyLoop = await runPythonInPage("while True:\n    pass\n", 6000);
const pyLoopOk = pyLoop.timedOut === true && pyLoop.durationMs < 6500;
console.log(pyLoopOk ? `PASS: python infinite loop timed out after ${pyLoop.durationMs}ms (worker terminated)` : `FAIL: python infinite loop: ${JSON.stringify(pyLoop)}`);
if (!pyLoopOk) failed = true;

// Security: js.fetch (and friends) must be unusable by the time user Python runs — see
// public/sandbox/pyodide-worker.js's neuterNetworkEgress(). `import js; js.fetch(...)`
// bridges straight into the worker's global scope via Pyodide's `js` module, which is
// exactly how untrusted Python could otherwise reach the sandbox's own fetch/XHR/etc.
// Note: `hasattr(js, "fetch")` is NOT a valid check here — reassigning `self.fetch =
// undefined` (or to a throwing function) keeps the property KEY on the object, so
// `hasattr`/`in` still report it present. The only invariant that matters is that
// actually CALLING it raises (fetch) or is not callable (XHR/WebSocket/Worker, all
// undefined).
const pyNoFetch = await runPythonInPage(
  [
    "import js",
    "results = []",
    "try:",
    "    js.fetch('http://example.com')",
    "    results.append('fetch:NOT_BLOCKED')",
    "except Exception as e:",
    "    results.append('fetch:BLOCKED')",
    "for name in ('XMLHttpRequest', 'WebSocket', 'Worker', 'SharedWorker', 'EventSource', 'caches'):",
    "    val = getattr(js, name, 'MISSING')",
    "    results.append(f'{name}:{\"UNDEFINED\" if val is None else val}')",
    "print(' '.join(results))",
    "",
  ].join("\n"),
  20000,
);
const pyNoFetchOk =
  !pyNoFetch.error &&
  pyNoFetch.output.includes("fetch:BLOCKED") &&
  ["XMLHttpRequest", "WebSocket", "Worker", "SharedWorker", "EventSource", "caches"].every((n) =>
    pyNoFetch.output.includes(`${n}:UNDEFINED`),
  );
console.log(pyNoFetchOk ? `PASS: js.fetch raises + XMLHttpRequest/WebSocket/Worker/SharedWorker/EventSource/caches all undefined -> ${JSON.stringify(pyNoFetch.output)}` : `FAIL: network egress not blocked: ${JSON.stringify(pyNoFetch)}`);
if (!pyNoFetchOk) failed = true;

const sql = await runSqlInPage("SELECT 3+4 AS n;");
const sqlOk = !sql.error && sql.output.includes("7");
console.log(sqlOk ? `PASS: sql SELECT 3+4 -> ${JSON.stringify(sql.output)}` : `FAIL: sql: ${JSON.stringify(sql)}`);
if (!sqlOk) failed = true;

const sqlErr = await runSqlInPage("SELCT 1;");
const sqlErrOk = sqlErr.error === true && sqlErr.output.length > 0;
console.log(sqlErrOk ? `PASS: sql syntax error captured -> ${JSON.stringify(sqlErr.output)}` : `FAIL: sql syntax error: ${JSON.stringify(sqlErr)}`);
if (!sqlErrOk) failed = true;

await browser.close();
console.log(failed ? "REPRO DONE (FAILURES)" : "REPRO DONE (ALL PASS)");
if (failed) process.exitCode = 1;
