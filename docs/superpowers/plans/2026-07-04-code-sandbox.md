# Real Code Execution Sandbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the DeepSeek "pretend to run code" path with real execution — browser WASM sandboxes for python/js/ts/sql, a Docker-jailed server runner for cpp/csharp/go/rust and all grading, with a visibly-badged AI fallback.

**Architecture:** Frontend `src/lib/run/` resolves Run in order browser→server→AI(badged). Backend `src/modules/run/` runs untrusted code in per-run `--network=none` containers behind a small concurrency queue. Grading (`competitions.service.ts`) switches from `ai.runCode` to the server runner.

**Tech Stack:** Next.js 15 (read `robocode-frontend/node_modules/next/dist/docs/` before Next-specific changes), NestJS, Pyodide + sql.js (self-hosted WASM), Docker (local dev daemon present; prod needs `apt install docker.io`).

## Global Constraints

- Three independent repos under `/Users/marimo/Dev/robocode`: `robocode-backend`, `robocode-frontend`, `robocode-mobile`. Commit per repo touched. End every commit message with:

```
Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SxfjwdvQNhvtgpE2HSPeFf
```

- No test frameworks: verify with typecheck (`npm run typecheck` each repo), backend smoke scripts (`npx tsx <file>`), and Playwright repros (dev servers on :3000/:4000, login `ada@robocode.africa` / `password123`).
- Output cap 64000 chars everywhere. Wall clock: browser 5000ms, server 10000ms (20000ms rust/csharp cold compile). Server memory 256m default, 512m rust/csharp.
- `RunOutcome` shape (canonical, all tiers): `{ ok: boolean; configured: boolean; output: string; error: boolean; engine: "browser" | "server" | "ai"; text?: string; durationMs?: number }`. It is a superset of the existing `RunCodeResult` (adds `engine`, `durationMs`) so the AI path stays compatible.
- Real output is NEVER silently replaced by AI. AI output is only shown behind an amber "AI-simulated (approximate)" badge, driven by `engine === "ai"`.
- The 8 coding languages (ids): python, javascript, typescript, sql (browser tier) + cpp, csharp, go, rust (server tier); html, css keep the existing iframe render path (untouched).
- Security defaults for every container (CORRECTED in Task 3 — default tmpfs is root-owned 0755 and blocks the unprivileged user, so uid/gid/mode are required): `--rm -i --network=none --cap-drop=ALL --security-opt=no-new-privileges --user 65534:65534 --read-only --tmpfs /work:rw,exec,size=64m,uid=65534,gid=65534,mode=1777 --tmpfs /tmp:rw,noexec,size=32m,uid=65534,gid=65534,mode=1777 --pids-limit=128 --cpus=1`. Compiled binaries go to `/work` (exec), caches to `/tmp` (noexec). Timeout enforcement uses a named container (`--name run-<uuid>`) + `docker kill` (killing the client process orphans the container). The verified image tags are `robocode-sandbox-base` (cpp/python/javascript/typescript/sql), `robocode-sandbox-go`, `robocode-sandbox-rust`, `robocode-sandbox-csharp`.

---

### Task 1: `src/lib/run/` browser framework — types + JS/TS engines

**Files:**
- Create: `robocode-frontend/src/lib/run/types.ts`, `run-js.ts`, `run-ts.ts`, `index.ts`
- Test: `robocode-frontend/scripts/_repro-run-js.mjs`

**Interfaces:**
- Produces: `types.ts` — `interface RunOutcome { ok: boolean; configured: boolean; output: string; error: boolean; engine: "browser"|"server"|"ai"; text?: string; durationMs?: number }`, `const OUTPUT_CAP = 64000`, `const BROWSER_WALL_MS = 5000`, helper `capOutput(s: string): string` (truncates with a `\n…(output truncated)` marker).
- Produces: `run-js.ts` — `runJs(source: string): Promise<RunOutcome>` (executes JS in a locked Web Worker).
- Produces: `run-ts.ts` — `runTs(source: string): Promise<RunOutcome>` (transpile then delegate to runJs).
- Produces: `index.ts` — `runInBrowser(lang: string, files: {name:string;content:string}[], entry?: string): Promise<RunOutcome | null>` (null = not a browser language). Task 2 extends it with python/sql.

- [ ] **Step 1:** Write `types.ts` exactly as the Interfaces block specifies. `capOutput`: if `s.length > OUTPUT_CAP` return `s.slice(0, OUTPUT_CAP) + "\n…(output truncated)"` else `s`.

- [ ] **Step 2:** Write `run-js.ts`. Build a Worker from a Blob. Worker preamble (runs before user code) hardens the environment:

```ts
const WORKER_SRC = `
  self.fetch = () => { throw new Error("Network access is disabled in the sandbox."); };
  self.XMLHttpRequest = undefined; self.WebSocket = undefined;
  self.EventSource = undefined; self.importScripts = () => { throw new Error("importScripts disabled"); };
  let __out = "";
  const __w = (...a) => { __out += a.map(x => typeof x === "string" ? x : (()=>{try{return JSON.stringify(x)}catch{return String(x)}})()).join(" ") + "\\n"; };
  console.log = __w; console.info = __w; console.warn = __w; console.error = __w;
  self.onmessage = (e) => {
    try { (0, eval)(e.data); self.postMessage({ ok: true, out: __out }); }
    catch (err) { __out += (err && err.stack ? err.stack : String(err)); self.postMessage({ ok: true, out: __out, error: true }); }
  };
`;
```

`runJs(source)`: create the worker, `postMessage(source)`, race against a `BROWSER_WALL_MS` timer; on timeout `worker.terminate()` and resolve `{ ok:true, configured:true, output:"⏱ Program exceeded the 5-second limit.", error:true, engine:"browser", durationMs }`. On message resolve `{ ok:true, configured:true, output: capOutput(msg.out), error: !!msg.error, engine:"browser", durationMs }`. Always `terminate()` and `clearTimeout`. Wrap Worker construction in try/catch → return `null` is wrong here (caller expects RunOutcome); instead on construction failure resolve `{ ok:false, configured:true, output:"", error:true, engine:"browser", text:"Your browser can't run the sandbox." }`.

- [ ] **Step 3:** Write `run-ts.ts`. Transpile with a lazy `import("typescript")` (already a transitive dep via Monaco; if the import fails, return an outcome with `text:"TypeScript transpiler unavailable."`): `const ts = await import("typescript"); const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None } }).outputText;` then `return runJs(js)`. On transpile throw, return `{ ok:true, configured:true, output:String(err), error:true, engine:"browser" }` (compile errors are normal output).

- [ ] **Step 4:** Write `index.ts`:

```ts
import type { RunOutcome } from "./types";
import { runJs } from "./run-js";
import { runTs } from "./run-ts";
export async function runInBrowser(lang: string, files: {name:string;content:string}[], entry?: string): Promise<RunOutcome | null> {
  const src = (files.find(f => f.name === entry) ?? files[0])?.content ?? "";
  switch (lang) {
    case "javascript": return runJs(src);
    case "typescript": return runTs(src);
    default: return null;
  }
}
```

- [ ] **Step 5:** Repro `scripts/_repro-run-js.mjs` — this is browser-only code, so drive it through the Coding Studio with Playwright OR (simpler, no dev server) a jsdom-free check: since Workers need a browser, write the repro as a Playwright script that navigates to `/app` (login first, pattern from `scripts/_repro-esp32.mjs`), opens `/studio/new?mode=coding&lang=javascript`, types `console.log(2+2)` via the Monaco editor OR evaluates `runInBrowser` in-page. Simpler and robust: `page.evaluate` a small inline JS-worker test that mirrors run-js semantics and asserts `"4"` and that a `while(true){}` terminates within ~6s. Assert both; exit non-zero on failure.

- [ ] **Step 6:** `npm run typecheck` clean; repro passes. Commit frontend `feat(run): browser sandbox framework + JS/TS worker engines`.

---

### Task 2: Python (Pyodide) + SQL (sql.js) browser engines

**Files:**
- Create: `robocode-frontend/src/lib/run/run-python.ts`, `run-sql.ts`, `robocode-frontend/public/sandbox/README.md`
- Modify: `robocode-frontend/src/lib/run/index.ts`, `robocode-frontend/package.json`
- Assets: self-host Pyodide + sql.js under `public/sandbox/` (download in the build step; committed as an asset dir or fetched — see Step 1)

**Interfaces:**
- Consumes: `RunOutcome`, `OUTPUT_CAP`, `capOutput`, `BROWSER_WALL_MS` from Task 1 `types.ts`.
- Produces: `runPython(source: string): Promise<RunOutcome>`, `runSql(source: string): Promise<RunOutcome>`; `index.ts` adds `case "python"` / `case "sql"`.

- [ ] **Step 1:** Add deps to `robocode-frontend/package.json`: `pyodide` (pinned, e.g. `0.26.x`) and `sql.js` (pinned `1.x`). Self-host: the Pyodide npm package ships its wasm/data under `node_modules/pyodide`; copy the runtime files to `public/sandbox/pyodide/` via a `postinstall`-style note in `public/sandbox/README.md` and a script `scripts/copy-sandbox-assets.mjs` (copies `pyodide.asm.*`, `pyodide.js`, `python_stdlib.zip`, `pyodide-lock.json` and `sql-wasm.wasm`). Wire that script into the frontend `build` script (prepend `node scripts/copy-sandbox-assets.mjs &&`). Rationale for self-hosting: the app CSP/offline story and no third-party CDN dependency.

- [ ] **Step 2:** `run-python.ts`. Load Pyodide once per tab (module-level `let pyodidePromise`). Run inside a Worker is ideal but Pyodide-in-worker is heavier to wire; for v1 run on the main thread with a cooperative timeout is unacceptable (can't interrupt). Use Pyodide's Web Worker pattern: create a dedicated worker that `importScripts("/sandbox/pyodide/pyodide.js")`, loads Pyodide, sets `stdout`/`stderr` batched handlers, runs `await pyodide.runPythonAsync(code)` in fresh globals (`pyodide.globals` cleared or a new namespace dict per run), posts captured output. Main-thread `runPython` posts source, races `BROWSER_WALL_MS`; on timeout `terminate()` the worker (interpreter cold-boots next run) and resolve the ⏱ outcome. Python exceptions → `output` with `error:true` (capture the traceback string). First run lazy-loads Pyodide (surface `output:"Loading Python…"`? No — just await; the Studio already shows "Running…").

- [ ] **Step 3:** `run-sql.ts`. Lazy `initSqlJs({ locateFile: () => "/sandbox/sql-wasm.wasm" })` cached per tab. Per run: `const db = new SQL.Database()` (fresh in-memory), split/exec the source, format each result set as an aligned text table (columns header + rows), multiple statements concatenated; `db.close()` in a finally. SQL errors → `output` + `error:true`. No worker needed (sql.js is synchronous and fast; guard with a statement-count sanity cap rather than a timer).

- [ ] **Step 4:** Extend `index.ts` switch with `case "python": return runPython(src);` and `case "sql": return runSql(src);`.

- [ ] **Step 5:** Playwright repro `scripts/_repro-run-wasm.mjs`: login, open `/studio/new?mode=coding&lang=python`, replace editor content with `print(sum(range(10)))`, click Run, assert output contains `45` and the engine badge reads a "browser" indicator (Task 6 adds the badge — if running Task 2 before Task 6, assert on the output panel text only and note the badge assertion is deferred). Add a SQL case: `SELECT 3+4 AS n;` → output contains `7`. Assert; exit non-zero on failure.

- [ ] **Step 6:** typecheck clean; repro passes (Pyodide first-load may take 10-30s — allow generous timeout). Commit frontend `feat(run): Pyodide Python + sql.js SQL browser engines (self-hosted WASM)`.

---

### Task 3: Docker sandbox images + `/run.sh` entrypoints

**Files:**
- Create: `robocode-backend/sandbox/Dockerfile.base`, `Dockerfile.go`, `Dockerfile.rust`, `Dockerfile.csharp`, `run.sh` (one shared, language-dispatch by arg), `build-images.sh`, `README.md`

**Interfaces:**
- Produces: images `robocode-sandbox-base`, `robocode-sandbox-go`, `robocode-sandbox-rust`, `robocode-sandbox-csharp`, each with `/run.sh` as a known entrypoint accepting `<language> <entryFilename>` and reading a tar of project files on stdin.

- [ ] **Step 1:** `run.sh` (POSIX sh, lives in every image at `/run.sh`, `chmod +x`):

```sh
#!/bin/sh
# args: $1 = language, $2 = entry filename. Project files arrive as a tar on stdin.
set -e
cd /work
tar -xf - 2>/dev/null || { echo "failed to read project"; exit 1; }
lang="$1"; entry="$2"
case "$lang" in
  cpp)    g++ -O0 -std=c++17 -o /tmp/a.out "$entry" 2>&1 && exec /tmp/a.out ;;
  python) exec python3 "$entry" ;;
  javascript) exec node "$entry" ;;
  typescript) node --input-type=module -e "require('esbuild')" 2>/dev/null; esbuild "$entry" --bundle --platform=node --outfile=/tmp/o.js 2>&1 && exec node /tmp/o.js ;;
  sql)    exec sqlite3 :memory: < "$entry" ;;
  go)     export GOCACHE=/tmp/gocache HOME=/tmp; exec go run "$entry" ;;
  rust)   rustc -O -o /tmp/a.out "$entry" 2>&1 && exec /tmp/a.out ;;
  csharp) mcs -out:/tmp/a.exe "$entry" 2>&1 && exec mono /tmp/a.exe ;;
  *) echo "unsupported language: $lang"; exit 1 ;;
esac
```

Note: compile stderr is printed then a non-zero exit — the service treats stdout+stderr as `output`. (For typescript on server, base image includes esbuild globally; adjust the line to the actual esbuild CLI invocation verified in Step 3.)

- [ ] **Step 2:** `Dockerfile.base` (FROM `alpine:3.20`): `apk add --no-cache g++ python3 nodejs npm sqlite libc6-compat`; `npm i -g esbuild`; `COPY run.sh /run.sh`; `RUN chmod +x /run.sh`; `WORKDIR /work`; `USER 65534`. Tag `robocode-sandbox-base`. This image serves cpp/python/javascript/typescript/sql.

- [ ] **Step 3:** `Dockerfile.go` FROM `golang:1.22-alpine` (+ copy run.sh, prewarm: `RUN GOCACHE=/root/.cache/go-build go env` — actually prewarm a hello build so GOCACHE is warm; keep it simple: rely on `GOCACHE=/tmp`), `Dockerfile.rust` FROM `rust:1.79-alpine` (+ `apk add musl-dev`), `Dockerfile.csharp` FROM `mono:6.12` (Debian-based; `apt`? mono image already has mcs+mono; copy run.sh). Each ends `WORKDIR /work; USER 65534` (verify the uid exists / is writable on the tmpfs at runtime — the service mounts `/work` as tmpfs owned appropriately; if `USER 65534` can't write the image layer that's fine, /work is a runtime tmpfs).

- [ ] **Step 4:** `build-images.sh`: `docker build -f sandbox/Dockerfile.base -t robocode-sandbox-base sandbox` etc. for all four. `README.md`: documents the prod one-time `sudo apt install docker.io`, adding the `robocode` user to the `docker` group, and running `build-images.sh`.

- [ ] **Step 5: Verify locally (Docker daemon is running on this dev machine).** Build all four images (`bash sandbox/build-images.sh`). For each language, pipe a hello-world tar into a container with the full security flag set and confirm real output:

```bash
printf 'int main(){printf("hi");}' # -> proper C file; use a heredoc to /tmp then tar
# Example for cpp:
mkdir -p /tmp/t && printf '#include <cstdio>\nint main(){printf("hi\\n");}' > /tmp/t/main.cpp
tar -C /tmp/t -cf - main.cpp | docker run --rm -i --network=none --cap-drop=ALL \
  --security-opt=no-new-privileges --user 65534:65534 --read-only \
  --tmpfs /work:rw,exec,size=64m --tmpfs /tmp:rw,noexec,size=32m --pids-limit=128 \
  --cpus=1 --memory=256m robocode-sandbox-base /run.sh cpp main.cpp
# expect: hi
```

Repeat for go/rust/csharp (their images). Record actual outputs in the commit/report. Fix `run.sh`/Dockerfiles until all four print correctly. **Note the noexec on /work if a compiled binary is placed in /work** — the plan compiles to `/tmp`… but `/tmp` is `noexec`; FIX: compile binaries to `/work` (which is `exec`) not `/tmp`, or drop `noexec` on `/tmp`. Resolve this concretely: put compiled artifacts in `/work` (exec) and keep `/tmp` for caches. Update `run.sh` accordingly (`-o /work/a.out`, `exec /work/a.out`).

- [ ] **Step 6:** Commit backend `feat(sandbox): docker images + run.sh for cpp/csharp/go/rust/python/js/ts/sql`.

---

### Task 4: Backend `run` module — controller, queue service, docker spawner

**Files:**
- Create: `robocode-backend/src/modules/run/run.controller.ts`, `run.service.ts`, `sandbox.service.ts`, `dto.ts`, `run.module.ts`
- Modify: `robocode-backend/src/app.module.ts` (register RunModule)
- Test: `robocode-backend/src/modules/run/smoke.ts`

**Interfaces:**
- Consumes: Docker images from Task 3.
- Produces: `POST /run/execute` returning `RunOutcome`-shaped JSON `{ ok, configured, output, error, engine:"server", durationMs }`. Exposes `RunService.execute(user, language, files, entry?): Promise<RunOutcome>` for grading (Task 7).

- [ ] **Step 1:** `dto.ts` — Zod `runExecuteSchema`: `language` enum of the 8 ids; `files` array (1..10) of `{ name: string (1..64, safe charset `/^[A-Za-z0-9_.-]+$/`), content: string (max 64000) }`; `entry` optional string. Export `RunExecuteInput`. Reject path-traversal names at the schema level (the safe charset excludes `/` and `..`).

- [ ] **Step 2:** `sandbox.service.ts` — `IMAGE_BY_LANG: Record<string,{image:string; mem:string; wallMs:number}>` (base for cpp/python/javascript/typescript/sql at 256m/10000; go base-`robocode-sandbox-go` 256m/10000; rust `robocode-sandbox-rust` 512m/20000; csharp `robocode-sandbox-csharp` 512m/20000). `async run(language, files, entry): Promise<{output:string; error:boolean; durationMs:number}>`: build a tar buffer of files in-memory (use `tar-stream`, add to backend deps, OR shell out to `tar` via a temp dir — prefer `tar-stream`, no temp files); `spawn("docker", [run args...])`; write the tar to stdin; collect stdout+stderr (combined, capped at 64000); `setTimeout` hard-kill (`docker kill` the named container — pass `--name run-<uuid>` and kill by name, since killing the client process may orphan the container) at wallMs; resolve with combined output, `error = exitCode !== 0`, durationMs. Map kill→"⏱ exceeded", 137→"ran out of memory".

- [ ] **Step 3:** `run.service.ts` — a small semaphore (max 2 concurrent `sandbox.run`) via a counter + queue of resolvers; per-user rate limit (10 runs / 60s sliding window in an in-memory Map keyed by userId). `execute(user, language, files, entry)`: rate-limit check (throw a 429-mapped error if exceeded), acquire semaphore, call `sandbox.run`, release in finally, wrap into `RunOutcome` (`ok:true, configured:true, engine:"server"`). On docker-missing / spawn error, return `{ ok:false, configured:false, output:"", error:true, engine:"server", text:"Server runner unavailable." }` so the frontend can fall back to AI.

- [ ] **Step 4:** `run.controller.ts` — `@Controller("run")`, `@UseGuards(JwtAuthGuard)`, `@Post("execute")` with `ZodPipe(runExecuteSchema)` → `runService.execute(user, ...)`. Map the rate-limit error to HTTP 429. Register `RunModule` in `app.module.ts`.

- [ ] **Step 5:** `smoke.ts` (gated: if `docker` not on PATH, print SKIP and exit 0): per language, call `sandbox.run` with hello-world and assert expected substring; plus three security probes on the base image — infinite loop (`while True: pass`) times out within wallMs+slack; fork bomb (`:(){ :|: };:` equivalent in python via os.fork loop) hits pids-limit and still returns; network probe (`python3 -c "import urllib.request; urllib.request.urlopen('http://example.com')"`) fails with a network error. Run: `cd robocode-backend && npx tsx src/modules/run/smoke.ts`.

- [ ] **Step 6:** typecheck clean; smoke passes locally (Docker present). Commit backend `feat(run): jailed docker runner module (queue, rate-limit, /run/execute)`.

---

### Task 5: Frontend server-tier client + `runInBrowser`→server→AI resolution

**Files:**
- Modify: `robocode-frontend/src/lib/studio/coding-actions.ts`, `robocode-frontend/src/lib/run/index.ts`
- Create: `robocode-frontend/src/lib/run/run-server.ts`

**Interfaces:**
- Consumes: `POST /run/execute` (Task 4), `runInBrowser` (Tasks 1-2), `RunOutcome`.
- Produces: `runProject(lang, files, entry): Promise<RunOutcome>` — the single entry the Coding Studio calls; resolves browser→server→AI(badged).

- [ ] **Step 1:** `run-server.ts` — `runOnServer(lang, files, entry): Promise<RunOutcome>` calling `apiPost<RunOutcome>("/run/execute", { language: lang, files, entry })`; on ApiError 429 return `{ ok:false, configured:true, output:"", error:true, engine:"server", text:"You're running code too quickly — wait a few seconds." }`; on other ApiError return an outcome with `configured:false` so the caller falls back to AI.

- [ ] **Step 2:** In `coding-actions.ts`, keep `runCodeAction` (the AI path) but change its return type to `RunOutcome` and set `engine:"ai"` on every branch (so the badge shows). Add `runProject`:

```ts
const BROWSER_LANGS = new Set(["python","javascript","typescript","sql"]);
const SERVER_LANGS = new Set(["cpp","csharp","go","rust"]);
export async function runProject(lang: string, files: {name:string;content:string}[], entry?: string): Promise<RunOutcome> {
  // browser tier (client-only): callable from the client component, not here (server action).
  // This function runs the SERVER + AI tiers; the browser tier is attempted in the client before calling this.
  if (SERVER_LANGS.has(lang)) {
    const r = await runOnServer(lang, files, entry);
    if (r.configured) return r;              // includes real errors & 429
    return runCodeAction(lang, files, entry); // server unavailable → AI(badged)
  }
  return runCodeAction(lang, files, entry);   // any other lang w/o browser support → AI(badged)
}
```

Note the architecture wrinkle: `coding-actions.ts` is `"use server"`, but browser engines must run in the client. Resolution: the browser tier is invoked in the client component (Task 6) BEFORE calling the server action. `runProject` (server action) owns only server+AI tiers. Document this in a file comment.

- [ ] **Step 3:** typecheck clean. Commit frontend `feat(run): server-tier client + browser→server→AI resolution`.

---

### Task 6: Coding Studio Run button → tiered execution + engine badge

**Files:**
- Modify: `robocode-frontend/src/components/studio/coding-studio.tsx`, `robocode-frontend/src/lib/studio/coding.ts` (add `browserRunnable` flag if useful)
- Test: extend `scripts/_repro-run-wasm.mjs`

**Interfaces:**
- Consumes: `runInBrowser` (client), `runProject` (server action), `RunOutcome`.

- [ ] **Step 1:** In `coding-studio.tsx` `run()`: for non-render langs, first try the browser tier in the client:

```ts
import { runInBrowser } from "@/lib/run";
import { runProject } from "@/lib/studio/coding-actions";
// ...
const browser = await runInBrowser(lang, files, files[0]?.name); // null if not a browser lang
const r = browser ?? await runProject(lang, files, files[0]?.name);
setOutput({ mode: "run", text: r.output || (r.error ? (r.text||"Error") : "(program finished with no output)"), error: r.error, engine: r.engine });
```

- [ ] **Step 2:** Extend the `output` state type with `engine?: "browser"|"server"|"ai"` and render a small badge in the output panel header: browser → subtle "Ran in your browser", server → "Ran on server", ai → amber pill "AI-simulated (approximate)". Match existing output-panel styling.

- [ ] **Step 3:** Repro: assert the python run shows a browser badge, and (if a server image is built + backend running) a cpp run shows "Ran on server" with real output `hi`. Assert; exit non-zero on failure.

- [ ] **Step 4:** typecheck clean; repro passes. Commit frontend `feat(studio): tiered code execution with engine badge`.

---

### Task 7: Grading switches to the sandbox runner

**Files:**
- Modify: `robocode-backend/src/modules/competitions/competitions.service.ts:~405-415`, `robocode-backend/src/modules/competitions/competitions.module.ts` (import RunModule/RunService)

**Interfaces:**
- Consumes: `RunService.execute` (Task 4). Feeds `gradeOutput(run.output, checks, runError)` (backend grader, unchanged).

- [ ] **Step 1:** Inject `RunService` into `CompetitionsService`. In the coding-challenge branch, replace `const run = await this.ai.runCode(user, lang, [{ name:..., content: code }]);` with `const run = await this.runService.execute(user, lang, [{ name: \`main.${ext}\`, content: code }]);`. If `run.configured === false` (server unavailable), fall back to `this.ai.runCode(...)` and set the recorded `autoResult.engine = run.engine` (so a graded result is auditable as AI vs sandbox). Keep the existing `gradeOutput` call and check shape.

- [ ] **Step 2:** Add a smoke fixture to `robocode-backend/src/modules/run/smoke.ts` (or a small new script) that grades a known coding task end-to-end through `RunService.execute` + `gradeOutput` and asserts pass. Gate on Docker present.

- [ ] **Step 3:** typecheck clean; smoke passes. Commit backend `feat(competitions): grade coding challenges via the sandbox runner`.

---

### Task 8: Retire the AI run path from the default UX + docs/ops

**Files:**
- Modify: `robocode-backend/.env.example` (note runner needs Docker), `docs/production-deploy` note (via memory or a docs file — add `docs/sandbox-ops.md`), `robocode-frontend` output copy
- Modify: `robocode-backend/src/modules/ai/ai.service.ts` (keep `runCode` — it's the badged fallback; add a one-line comment that it is fallback-only, not the primary path)

- [ ] **Step 1:** Write `docs/sandbox-ops.md`: prod install (`apt install docker.io`, add `robocode` to `docker` group, `cd /srv/robocode/backend && bash sandbox/build-images.sh`), the security flag rationale, resource envelope (2 concurrent × 512m), and how to disable the server tier (env `RUN_SANDBOX_DISABLED=1` → service returns `configured:false` so everything falls back to AI). Implement that env switch in `run.service.ts`.
- [ ] **Step 2:** typecheck clean. Commit backend + docs.

---

### Task 9: Full verification sweep

- [ ] `npm run typecheck` in robocode-frontend and robocode-backend — clean.
- [ ] `cd robocode-backend && npx tsx src/modules/run/smoke.ts` — all languages hello-world PASS; timeout/pids/network probes PASS (Docker present locally).
- [ ] Dev servers up → `node robocode-frontend/scripts/_repro-run-wasm.mjs`: python `45`, sql `7`, js `4`, and (images built) cpp `hi` on server; badges correct.
- [ ] Confirm a coding challenge grades via the sandbox (engine recorded "server"), and that killing Docker makes it fall back to AI (engine "ai") without a 500.
- [ ] Rename `_repro-run-*.mjs` → `scripts/repro-sandbox-*.mjs` and commit as regression harnesses.
