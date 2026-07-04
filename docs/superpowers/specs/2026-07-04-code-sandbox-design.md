# Real Code Execution Sandbox (replaces DeepSeek "run-code") — Design

**Decision record (user-approved 2026-07-04):** Hybrid architecture; Docker+hard-limits server jail; AI fallback allowed but visibly badged "AI-simulated (approximate)"; coding-challenge grading switches to the sandbox.

## Problem

`POST /ai/run-code` asks DeepSeek to *pretend* to compile and run Coding Studio projects. Output is hallucinated, slow, costs API quota, and coding-challenge grading (`competitions.service.ts:411`) trusts it. Replace with real execution, per language and per user session, efficient (most runs cost the server nothing) and secure (jailed everywhere).

## Architecture

Two execution tiers plus a labeled fallback. The Studio Run button resolves in order: **browser → server → AI(badged)**.

### Tier 1 — Browser sandboxes (python, javascript, typescript, sql; html/css keep the existing iframe)

New frontend framework `src/lib/run/`:

| File | Responsibility |
|---|---|
| `types.ts` | `RunOutcome { ok, output, error, engine: "browser"\|"server"\|"ai", durationMs }` + shared caps (OUTPUT_CAP 64_000 chars, WALL_MS 5_000 browser / 10_000 server) |
| `run-js.ts` | Blob Web Worker; preamble neuters `fetch/XMLHttpRequest/WebSocket/EventSource/importScripts`; captures `console.*`; controller `terminate()`s at 5s (kills infinite loops) |
| `run-ts.ts` | Transpile via Monaco's already-shipped TypeScript worker (`getEmitOutput`); fall back to lazy `import("typescript")` when Monaco isn't mounted; then delegate to `run-js` |
| `run-python.ts` | Pyodide (self-hosted under `public/pyodide/`, lazy-loaded on first Python run) inside a Web Worker; stdout/stderr via `setStdout` hooks; interpreter cached per tab for speed, per-run fresh globals namespace; on timeout the worker is terminated and the interpreter cold-boots next run |
| `run-sql.ts` | sql.js (SQLite WASM, self-hosted); fresh in-memory DB per run; multi-statement exec; SELECT results formatted as aligned text tables |
| `index.ts` | `runInBrowser(lang, files, entry): Promise<RunOutcome \| null>` — `null` means "not a browser language", caller falls through to the server |

Session isolation = the browser's own process sandbox + fresh worker/DB state per run. Nothing persists server-side; nothing leaves the tab.

### Tier 2 — Server jail (cpp, csharp, go, rust — and ALL grading languages)

New backend module `src/modules/run/`:

- `run.controller.ts` — `POST /run/execute` (JWT-guarded). Zod: `language` enum(8), ≤10 files, ≤64KB/file, entry optional.
- `run.service.ts` — FIFO queue, **max 2 concurrent** containers (4-core box), per-user limit **10 runs/min** (429 beyond), 64KB output cap, `engine:"server"` in the response.
- `sandbox.service.ts` — spawns `docker run` per run:

```
docker run --rm -i --network=none --cap-drop=ALL --security-opt no-new-privileges \
  --user 65534:65534 --read-only --tmpfs /work:rw,exec,size=64m --tmpfs /tmp:rw,noexec,size=32m \
  --memory=<256m|512m per language> --cpus=1 --pids-limit=128 \
  robocode-sandbox-<image> /run.sh <entry>
```

  Project files stream in as a tar on stdin; `/run.sh` untars to `/work`, compiles, runs, prints. Node-side hard kill at wall timeout (10s; 20s for rust/csharp cold compiles). Memory: 256m default, 512m rust/csharp.
- Images (built from `robocode-backend/sandbox/`): `base` (alpine + g++ + python3 + nodejs + sqlite → cpp/python/javascript/typescript*/sql) ~400MB, `go` (golang:alpine, prewarmed GOCACHE) ~300MB, `rust` (rust:alpine) ~800MB, `csharp` (mono — `mcs`+`mono`, far faster than `dotnet run` for single-file programs) ~350MB. ~1.9GB total (16GB free on prod). *TS on server = esbuild-transpile then node (grading only).
- Ops: `sandbox/build-images.sh`; deploy docs gain a one-time `apt install docker.io` + image build step; backend runs with the `robocode` user in the `docker` group.

### Tier 3 — AI fallback (badged)

If the server runner is unavailable/errored (or the browser lacks WASM), the Studio calls the old `/ai/run-code` and the output panel shows a warning badge: **“AI-simulated (approximate)”** (amber, distinct from real output). The response's `engine` field drives the badge; real runs show “Ran in your browser” / “Ran on server” subtly.

### Grading

`competitions.service.ts` coding path swaps `ai.runCode(...)` → `runService.execute(...)` (server jail; all 8 languages). On sandbox failure it falls back to AI and records `autoResult.engine = "ai"` so results are auditable. Deterministic, tamper-proof grading is the point: never grade from a browser-produced output.

## Error handling

- Compile errors/runtime stderr → returned as `output` with `error:true` (same shape the Studio already renders).
- Timeout → `"⏱ Program exceeded the N-second limit."`; OOM/kill → `"Program ran out of memory."`
- Queue full/rate-limited → 429 with retry hint; Studio surfaces it and offers the AI-fallback button rather than silently degrading.

## Testing

No test frameworks (project convention): backend `src/modules/run/smoke.ts` (hello-world + infinite-loop timeout + fork-bomb pids + network-blocked probe, per language, gated on Docker present); frontend Playwright repro `scripts/_repro-sandbox.mjs` (run each browser language in the Coding Studio, assert real output + engine badge); typecheck both repos.

## Out of scope

Interactive stdin, long-running servers, package installation (pip/npm) inside runs, persistent per-user workspaces, mobile-native runners (mobile WebView inherits the browser tier).
