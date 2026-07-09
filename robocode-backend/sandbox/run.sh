#!/bin/sh
# args: $1 = language, $2 = entry filename. Project files arrive as a tar on stdin.
#
# Security note: the container is run with /work mounted as an exec tmpfs and
# /tmp mounted as a noexec tmpfs (see build-images.sh / README.md for the full
# flag set). Any compiled binary that we intend to `exec` directly MUST be
# written to /work, never /tmp, or the kernel refuses with "Permission denied".
set -e
cd /work
tar -xf - 2>/dev/null || { echo "failed to read project"; exit 1; }
lang="$1"; entry="./$2"
case "$lang" in
  cpp)
    g++ -O0 -std=c++17 -o /work/a.out "$entry" 2>&1 && exec /work/a.out
    ;;
  python)
    exec python3 "$entry"
    ;;
  javascript)
    exec node "$entry"
    ;;
  typescript)
    esbuild "$entry" --bundle --platform=node --log-level=error --outfile=/work/o.js 2>&1 && exec node /work/o.js
    ;;
  sql)
    exec sqlite3 :memory: < "$entry"
    ;;
  go)
    export GOTMPDIR=/work HOME=/work
    # Seed this run's writable cache from the image's prewarmed one (baked
    # in at build time — see Dockerfile.go) so std-library packages don't
    # recompile from scratch on every request. /work is exec+64m (vs /tmp's
    # noexec+32m) so it has headroom for both the cache and the temp binary
    # `go run` builds via GOTMPDIR.
    export GOCACHE=/work/gocache
    mkdir -p "$GOCACHE"
    if [ -d /opt/gocache-seed ]; then
      cp -r /opt/gocache-seed/. "$GOCACHE"/ 2>/dev/null || true
    fi
    exec go run "$entry"
    ;;
  rust)
    rustc -O -o /work/a.out "$entry" 2>&1 && exec /work/a.out
    ;;
  csharp)
    mcs -out:/work/a.exe "$entry" 2>&1 && exec mono /work/a.exe
    ;;
  *)
    echo "unsupported language: $lang"
    exit 1
    ;;
esac
