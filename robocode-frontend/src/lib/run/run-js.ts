import { type RunOutcome, capOutput, BROWSER_WALL_MS } from "./types";

// Source for the sandbox Web Worker, built once and instantiated via a Blob
// URL for every run. It hardens the worker's global scope against network
// access before the user's program ever executes, then captures every
// console.* call into a single string. A runtime exception thrown by the
// user's program is caught *inside the worker* and folded into the captured
// output — it's normal program output, not a sandbox failure, so it's never
// allowed to propagate as an uncaught worker error.
//
// Beyond the obvious network APIs, this also neuters every OTHER egress path
// reachable from a Worker global scope:
//   - self.Worker / self.SharedWorker: without these, sandboxed code cannot
//     spawn a NESTED worker whose fresh global scope would have fully intact
//     fetch/XHR/WebSocket — same-origin requests from a nested worker still
//     carry the app's cookies, so an unblocked nested worker would fully
//     defeat "network disabled".
//   - self.caches: Cache Storage can be used to stash/exfiltrate data and to
//     make cross-context requests via CacheStorage.add()/addAll(). `caches`
//     is a getter-only accessor inherited from the WorkerGlobalScope
//     prototype chain (not an own, writable data property), so plain
//     `self.caches = undefined` silently no-ops (in non-strict-mode sloppy
//     scripts, assigning through an inherited accessor with no setter does
//     not create a shadowing own property) — verified against a real
//     worker: after `self.caches = undefined`, `self.caches` still resolves
//     to the live CacheStorage object. Object.defineProperty shadows it
//     with a genuine own property instead, which does take effect. (Mirrors
//     the same fix in public/sandbox/pyodide-worker.js.)
//   - navigator.sendBeacon: a fire-and-forget POST that bypasses the fetch
//     override above. Wrapped in try/catch (falling back to
//     Object.defineProperty) since WorkerNavigator's own-property
//     writability isn't guaranteed across engines.
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

interface WorkerResult {
  ok: boolean;
  out: string;
  error?: boolean;
}

/**
 * Executes `source` as JavaScript inside a locked-down Web Worker. Network
 * APIs are neutered, output is capped, and the run is bounded to
 * BROWSER_WALL_MS wall-clock time — an infinite loop terminates the worker
 * rather than hanging the page forever.
 */
export async function runJs(source: string): Promise<RunOutcome> {
  const start = Date.now();

  let worker!: Worker;
  let blobUrl!: string;
  try {
    const blob = new Blob([WORKER_SRC], { type: "application/javascript" });
    blobUrl = URL.createObjectURL(blob);
    worker = new Worker(blobUrl);
  } catch {
    return {
      ok: false,
      configured: true,
      output: "",
      error: true,
      engine: "browser",
      text: "Your browser can't run the sandbox.",
    };
  }

  return new Promise<RunOutcome>((resolve) => {
    let settled = false;

    const cleanup = () => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(blobUrl);
    };

    const finish = (outcome: RunOutcome) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(outcome);
    };

    const timer = setTimeout(() => {
      finish({
        ok: true,
        configured: true,
        output: "⏱ Program exceeded the 5-second limit.",
        error: true,
        engine: "browser",
        durationMs: Date.now() - start,
      });
    }, BROWSER_WALL_MS);

    worker.onmessage = (e: MessageEvent<WorkerResult>) => {
      const msg = e.data;
      finish({
        ok: true,
        configured: true,
        output: capOutput(msg?.out ?? ""),
        error: !!msg?.error,
        engine: "browser",
        durationMs: Date.now() - start,
      });
    };

    // Defensive net: should be unreachable since user errors are caught
    // inside the worker's onmessage handler, but guards against any
    // uncaught top-level exception (e.g. a malformed worker environment)
    // resolving instead of hanging the caller forever.
    worker.onerror = (e: ErrorEvent) => {
      e.preventDefault();
      finish({
        ok: true,
        configured: true,
        output: capOutput(e.message || "Unknown sandbox error."),
        error: true,
        engine: "browser",
        durationMs: Date.now() - start,
      });
    };

    worker.postMessage(source);
  });
}
