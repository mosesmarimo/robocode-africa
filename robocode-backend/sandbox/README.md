# RoboCode code-runner sandbox images

Four Docker images provide jailed execution for the 8 languages the code
runner supports:

| Image                        | Languages                                   | Base               |
|-------------------------------|----------------------------------------------|--------------------|
| `robocode-sandbox-base`      | cpp, python, javascript, typescript, sql     | `alpine:3.20`       |
| `robocode-sandbox-go`        | go                                            | `golang:1.22-alpine`|
| `robocode-sandbox-rust`      | rust                                          | `rust:1.79-alpine`  |
| `robocode-sandbox-csharp`    | csharp                                        | `mono:6.12`         |

Every image carries the same `/run.sh` entrypoint script (`sandbox/run.sh`),
which:

1. `cd /work` and reads a tar of the project files from stdin.
2. Dispatches on `$1` (language) to compile (if needed) and run `$2` (the
   entry filename).
3. Prints compiler/runtime stderr to stdout+stderr and exits non-zero on
   failure; the calling service treats combined stdout+stderr as `output`.

## Security-critical detail: `/work` is exec, `/tmp` is noexec

The service runs each container with `/work` mounted as an **exec** tmpfs and
`/tmp` mounted as a **noexec** tmpfs (see flag set below). Any binary that is
`exec`'d directly (compiled C++/Rust output, the binary `go run` builds
internally) **must** live under `/work`, never `/tmp` — executing a file from
a noexec mount fails with `Permission denied`. `run.sh` therefore:

- Compiles cpp/rust to `/work/a.out` and execs it from there.
- Compiles csharp to `/work/a.exe`; `mono` is executed (not the `.exe`
  directly), so noexec wouldn't strictly matter there, but the artifact still
  lives in `/work` for consistency.
- Bundles typescript to `/work/o.js`, run via `node` (interpreted, not
  exec'd directly).
- Sets `GOTMPDIR=/work` so the binary `go run` builds and executes internally
  lands on the exec-mounted filesystem; `GOCACHE=/tmp` is fine because cache
  entries are only ever read as data by the `go` tool, never exec'd.

## Building

```sh
bash sandbox/build-images.sh
```

Builds all four images, tagged `robocode-sandbox-base`, `robocode-sandbox-go`,
`robocode-sandbox-rust`, `robocode-sandbox-csharp`.

## Running (the flag set the service uses)

```sh
tar -C <project-dir> -cf - <entry-file> | docker run --rm -i \
  --network=none --cap-drop=ALL --security-opt=no-new-privileges \
  --user 65534:65534 --read-only \
  --tmpfs /work:rw,exec,size=64m,uid=65534,gid=65534,mode=1777 \
  --tmpfs /tmp:rw,noexec,size=32m,uid=65534,gid=65534,mode=1777 \
  --pids-limit=128 --cpus=1 --memory=256m \
  <image> /run.sh <language> <entry-file>
```

- `--network=none` — no outbound network access.
- `--cap-drop=ALL --security-opt=no-new-privileges` — no Linux capabilities,
  no privilege escalation via setuid binaries.
- `--user 65534:65534` — runs as `nobody`, never root.
- `--read-only` — the image's own filesystem is immutable; only `/work` and
  `/tmp` (both tmpfs) are writable.
- `--tmpfs ...,uid=65534,gid=65534,mode=1777` — **load-bearing**: Docker's
  default tmpfs mount is owned by `root:root` mode `0755`, which `nobody`
  (uid 65534) cannot write to. Without the explicit `uid`/`gid`/`mode`, `tar
  -xf -` in `run.sh` fails with `Permission denied` before any code runs.
  Verified locally — this was found and fixed during Task 3 verification.
- `--pids-limit=128` — caps fork bombs.
- `--cpus=1 --memory=256m` — caps CPU/memory abuse.
- A wall-clock timeout is enforced by the caller (e.g. running `docker run`
  in the background and `docker kill <container>` after N seconds) — the
  container itself does not self-terminate a long-running script.

## One-time production setup

On the production host (`robocode` user, Debian/Ubuntu):

```sh
sudo apt install docker.io
sudo usermod -aG docker robocode
# re-login (or `newgrp docker`) for the group change to take effect
bash sandbox/build-images.sh
```

Re-run `build-images.sh` whenever `sandbox/` changes (e.g. on deploy).
