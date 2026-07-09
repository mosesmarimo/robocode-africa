# Code-runner sandbox: ops guide

The Studio "Run" button executes student code two ways, in priority order:

1. **Server tier** (primary) — a jailed `docker run` per execution
   (`src/modules/run/sandbox.service.ts`), covering 8 languages
   (cpp, python, javascript, typescript, sql, go, rust, csharp).
2. **AI-simulated fallback** — `AiService.runCode()`
   (`src/modules/ai/ai.service.ts`), badged "AI-simulated" in the UI. Used
   whenever the server tier is unavailable, misconfigured, or explicitly
   disabled (see the kill-switch below).

`RunService.execute()` (`src/modules/run/run.service.ts`) returns
`configured: false` whenever the server tier can't run the request; the
frontend/`CompetitionsService` treat that as "fall back to AI" rather than a
hard error.

## One-time production setup

On the production host (the `robocode` user, Debian/Ubuntu, `/srv/robocode/backend`):

```sh
sudo apt install docker.io
sudo usermod -aG docker robocode
# re-login (or `newgrp docker`) as the robocode user for the group change to
# take effect — `docker run` will fail with a permission error otherwise.

cd /srv/robocode/backend
bash sandbox/build-images.sh
```

This builds the four images the sandbox runs against:
`robocode-sandbox-base`, `robocode-sandbox-go`, `robocode-sandbox-rust`,
`robocode-sandbox-csharp`.

**Rebuild after every deploy that touches `sandbox/`** — in particular, prod
must rebuild to pick up the Go-cache fix (Task 4): the original
`sandbox/Dockerfile.go` prewarmed a build cache at image-build time that
`run.sh` never actually pointed `GOCACHE` at, so every Go run recompiled the
standard library from scratch (46.6s vs. the 10s wall-clock budget — every Go
submission timed out). The fix bakes the prewarmed cache at
`/opt/gocache-seed` and has `run.sh` seed `/work/gocache` from it before
`exec go run`. An image built before this fix will still time out every Go
run. Re-run `bash sandbox/build-images.sh` any time `sandbox/` changes.

## Security-flag rationale

Every `docker run` invocation (`SandboxService.run`, see also
`sandbox/README.md`) uses this flag set — each flag is load-bearing:

| Flag | Why |
|---|---|
| `--network=none` | No outbound network access from student code — blocks exfiltration and abuse of the host's network. |
| `--cap-drop=ALL` | Drops every Linux capability; the container can't do anything requiring elevated kernel privileges. |
| `--security-opt=no-new-privileges` | Blocks privilege escalation via setuid/setgid binaries even if one somehow existed in the image. |
| `--user 65534:65534` | Runs as `nobody`, never root — even a container escape lands as an unprivileged user. |
| `--read-only` | The image's own filesystem is immutable; only the two tmpfs mounts below are writable. |
| `--tmpfs /work:rw,exec,size=64m,uid=65534,gid=65534,mode=1777` | Writable+executable scratch space for compiled binaries (a.out, go run's internal binary). **The explicit `uid=65534,gid=65534,mode=1777` is corrected from Docker's tmpfs default (`root:root 0755`)** — without it, `nobody` can't write here at all and `tar -xf -` fails with `Permission denied` before any code runs (found and fixed during Task 3/4 verification). |
| `--tmpfs /tmp:rw,noexec,size=32m,uid=65534,gid=65534,mode=1777` | Writable scratch space that can never execute anything — any file dropped here (e.g. by a compiler) can't be run as a binary. Same uid/gid/mode correction as `/work`. |
| `--pids-limit=128` | Caps fork bombs — a process tree can't exhaust the host's PID table. |
| `--cpus=1` | Caps CPU abuse — one core per run, regardless of host size. |
| `--memory=<256m or 512m>` | Caps memory abuse (rust/csharp get 512m — slower-compiling toolchains; everything else gets 256m). See resource envelope below. |
| Wall-clock timeout (10s or 20s), enforced by the Node caller via `docker kill <container-name>` | The container does **not** self-terminate a long-running script; `SandboxService` starts a timer and force-kills by container name (not by killing the `docker run` client process, which would only detach). |

No shell is ever invoked — `spawn("docker", [...argv])` passes each argument
as a discrete array element, so a crafted filename can never be interpreted
as an additional flag or break out of its argument position. Filenames/entry
are further restricted by a Zod schema (`src/modules/run/dto.ts`) to a safe
charset with no leading hyphen/dot and no `..`, before they ever reach the
sandbox.

## Resource envelope

- **Concurrency:** at most **2** concurrent `docker run` processes host-wide
  (`Semaphore` in `run.service.ts`, `MAX_CONCURRENT_RUNS = 2`). Additional
  requests queue FIFO for a free slot rather than spawning unbounded
  containers.
- **Memory per container:** up to **512m** (rust/csharp; 256m for the other
  six languages) — so worst case, the sandbox tier can commit **2 × 512m =
  1GB** of container memory at once, plus the Node process itself.
- **Wall-clock:** 10s per run (20s for rust/csharp), enforced by
  `docker kill`.
- **Output:** capped at 64,000 characters (combined stdout+stderr); excess is
  truncated with a `"… output truncated"` marker rather than buffered
  unbounded.

## Rate limiting

`SlidingWindowRateLimiter` in `run.service.ts` caps each user to **10 runs
per rolling 60-second window**. Exceeding it throws
`RateLimitExceededError`, which the controller maps to HTTP 429 and which
`CompetitionsService.submitSolution` catches to fall back to the AI runner
instead of failing the submission.

This limiter (like the semaphore above) is **in-process, in-memory** — correct
for a single backend instance. If the backend is ever scaled out to multiple
processes/instances, both the rate limiter and the concurrency semaphore need
to move to a shared store (e.g. Redis) to stay globally accurate; a
single-instance deploy does not need this.

## Kill-switch: `RUN_SANDBOX_DISABLED`

Set the env var `RUN_SANDBOX_DISABLED=1` (or `"true"`) to disable the server
sandbox tier **without a deploy** — e.g. if Docker is misbehaving on the
production host, or during an incident.

When set, `RunService.execute()` returns immediately:

```ts
{ ok: false, configured: false, output: "", error: true, engine: "server", text: "Server runner disabled." }
```

before touching the rate limiter, the concurrency semaphore, or Docker at
all. Every caller (Studio "Run", competition submission grading) already
treats `configured: false` as "fall back to the AI-simulated runner", so
flipping this env var and restarting the backend process is enough to take
the whole server tier offline while keeping the product usable.

Unset (or empty/anything other than `"1"`/`"true"`) means the server tier is
enabled — this is the default and the normal production state once Docker
and the sandbox images are set up (see above).
