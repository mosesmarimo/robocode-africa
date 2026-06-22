#!/usr/bin/env bash
# CI guard: front/back sim engine must not drift in logic.
# machine.ts: identical except the single BoardProfile import line (line 1).
# interpreter.ts: differ only by whitelisted import paths, the MAX_ARRAY_SIZE
#                 guard, and the esp_random literal-vs-constant lines.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONT="$REPO_ROOT/robocode-frontend/src/lib/sim"
BACK="$REPO_ROOT/robocode-backend/src/sim"

fail=0

# --- machine.ts: filter the single BoardProfile import line (path differs) by
#     content, then compare. The import is on line 4 (under a 2-line comment
#     header), so a positional tail -n +2 would NOT drop it — match by content. ---
if diff <(grep -v 'import type { BoardProfile }' "$FRONT/machine.ts") <(grep -v 'import type { BoardProfile }' "$BACK/machine.ts") >/dev/null; then
  echo "OK machine.ts identical (ignoring the BoardProfile import line)"
else
  echo "DRIFT machine.ts differs beyond the BoardProfile import line:"
  diff <(grep -v 'import type { BoardProfile }' "$FRONT/machine.ts") <(grep -v 'import type { BoardProfile }' "$BACK/machine.ts") || true
  fail=1
fi

# --- interpreter.ts: normalize whitelisted differences, then compare ---
# Whitelist transforms applied to BOTH files to collapse known-allowed diffs:
#  1. import paths: "@/lib/sim/X" -> "./X"
#  2. BoardProfile / esp_random import lines (present/differing) -> removed
#  3. backend-only array-size guard removed: the `const MAX_ARRAY_SIZE`
#     declaration + its comments, AND the multi-line allocation guard block
#     (range-deleted `const n = Math.max(... ` .. `arr = new Array(n).fill(0);`),
#     AND the frontend one-liner `arr = new Array(Number(size) || 0).fill(0);`
#     — so the array-allocation region collapses to empty on both sides.
#  4. esp_random literals vs ESP_RAND_* constants -> normalized token
#  5. blank lines stripped so removed-line whitespace does not show as diff
norm() {
  sed -E \
    -e 's#@/lib/sim/#./#g' \
    -e '/from "\.\/board-profile"/d' \
    -e '/import type \{ BoardProfile \}/d' \
    -e '/^const MAX_ARRAY_SIZE/d' \
    -e '/Cap allocation so/d' \
    -e '/Hard cap on dynamically-sized/d' \
    -e '/cannot OOM the/d' \
    -e '/const n = Math\.max\(0, Math\.trunc\(Number\(size\)/,/arr = new Array\(n\)\.fill\(0\);/d' \
    -e '/arr = new Array\(Number\(size\) \|\| 0\)\.fill\(0\);/d' \
    -e 's/0x2545f491|ESP_RAND_SEED/__ESPSEED__/g' \
    -e 's/1664525|ESP_RAND_MUL/__ESPMUL__/g' \
    -e 's/1013904223|ESP_RAND_INC/__ESPINC__/g' \
    "$1" | sed -E '/^[[:space:]]*$/d'
}

if diff <(norm "$FRONT/interpreter.ts") <(norm "$BACK/interpreter.ts") >/dev/null; then
  echo "OK interpreter.ts differs only by whitelisted hunks"
else
  echo "DRIFT interpreter.ts differs beyond the whitelist:"
  diff <(norm "$FRONT/interpreter.ts") <(norm "$BACK/interpreter.ts") || true
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  echo "sim-diff-guard FAILED"
  exit 1
fi
echo "sim-diff-guard PASSED"
