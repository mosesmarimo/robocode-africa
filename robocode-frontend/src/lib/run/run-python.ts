import { type RunOutcome, capOutput, BROWSER_WALL_MS } from "./types";

// Pyodide's cold load (fetching + wasm-compiling the self-hosted runtime
// under /sandbox/pyodide/) can take 10-30s depending on network/CPU. That
// cost must never count against BROWSER_WALL_MS — the per-run execution
// budget an infinite `while True: pass` gets killed by — or every first run
// would falsely "time out" before a single line of Python executed. So
// loading gets its own, much larger budget below, and only the actual
// runPythonAsync() call races BROWSER_WALL_MS.
const PYODIDE_LOAD_TIMEOUT_MS = 45000;

// The worker is a real static file (public/sandbox/pyodide-worker.js), not
// a Blob URL built from an inline string like run-js.ts's WORKER_SRC. That's
// deliberate: `blob:` is a non-special URL scheme, so a worker created from
// one can't resolve root-relative importScripts()/fetch() paths like
// "/sandbox/pyodide/pyodide.js" against it (it throws "The URL '...' is
// invalid" rather than 404ing). A worker loaded from a normal http(s): URL
// doesn't have that problem. See pyodide-worker.js for the worker-side
// protocol and the fresh-globals-per-run isolation strategy.
const WORKER_URL = "/sandbox/pyodide-worker.js";

interface PyodideWorkerHandle {
  worker: Worker;
  ready: Promise<void>;
}

// Module-level so the worker (and its loaded Pyodide instance) survives
// across multiple runPython() calls in the same tab — reloading an 8MB+
// wasm blob on every keystroke's "Run" click would be unusable.
let handle: PyodideWorkerHandle | null = null;

function createWorker(): PyodideWorkerHandle {
  const worker = new Worker(WORKER_URL);

  const ready = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Python runtime took too long to load."));
    }, PYODIDE_LOAD_TIMEOUT_MS);

    worker.onmessage = (e: MessageEvent) => {
      const data = e.data;
      if (data?.type === "ready") {
        clearTimeout(timer);
        resolve();
      } else if (data?.type === "load-error") {
        clearTimeout(timer);
        reject(new Error(data.message || "Python runtime failed to load."));
      }
    };
    worker.onerror = (e: ErrorEvent) => {
      e.preventDefault();
      clearTimeout(timer);
      reject(new Error(e.message || "Python runtime failed to load."));
    };
  });

  return { worker, ready };
}

function terminateWorker(): void {
  if (handle) {
    handle.worker.terminate();
    handle = null;
  }
}

function getHandle(): PyodideWorkerHandle {
  if (!handle) handle = createWorker();
  return handle;
}

/**
 * Executes `source` as Python inside a persistent Pyodide Web Worker. The
 * worker's first load races its own generous timeout (Pyodide's cold boot),
 * then every individual run races BROWSER_WALL_MS — an infinite loop
 * terminates the worker (the next run cold-boots a fresh interpreter)
 * rather than hanging the page forever. Python exceptions are captured as
 * normal output (traceback text) with error:true, not thrown.
 */
export async function runPython(source: string): Promise<RunOutcome> {
  const start = Date.now();

  let h: PyodideWorkerHandle;
  try {
    h = getHandle();
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

  try {
    await h.ready;
  } catch (err) {
    terminateWorker();
    return {
      ok: true,
      configured: true,
      output: capOutput(err instanceof Error ? err.message : String(err)),
      error: true,
      engine: "browser",
      durationMs: Date.now() - start,
    };
  }

  const { worker } = h;

  return new Promise<RunOutcome>((resolve) => {
    let settled = false;

    const finish = (outcome: RunOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(outcome);
    };

    const timer = setTimeout(() => {
      terminateWorker();
      finish({
        ok: true,
        configured: true,
        output: "⏱ Program exceeded the 5-second limit.",
        error: true,
        engine: "browser",
        durationMs: Date.now() - start,
      });
    }, BROWSER_WALL_MS);

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (!msg || msg.type !== "result") return;
      finish({
        ok: true,
        configured: true,
        output: capOutput(msg.out ?? ""),
        error: !!msg.error,
        engine: "browser",
        durationMs: Date.now() - start,
      });
    };

    // Defensive net: user exceptions are already caught inside the worker's
    // onmessage handler, so this should be unreachable except for a truly
    // uncaught sandbox-level failure (e.g. Pyodide itself crashing mid-run).
    worker.onerror = (e: ErrorEvent) => {
      e.preventDefault();
      terminateWorker();
      finish({
        ok: true,
        configured: true,
        output: capOutput(e.message || "Unknown sandbox error."),
        error: true,
        engine: "browser",
        durationMs: Date.now() - start,
      });
    };

    worker.postMessage({ type: "run", code: source });
  });
}
