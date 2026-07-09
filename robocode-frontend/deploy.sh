#!/usr/bin/env bash
# Server-side deploy for the RoboCode frontend (run by GitHub Actions over SSH,
# under the robocode user on robocode.africa). Builds BEFORE restarting so a
# failed build leaves the running service untouched.
set -euo pipefail

export XDG_RUNTIME_DIR="/run/user/$(id -u)"
export NVM_DIR="/srv/robocode/.nvm"
# shellcheck disable=SC1091
source "$NVM_DIR/nvm.sh"
corepack enable >/dev/null 2>&1 || true

cd /srv/robocode/frontend

echo "[deploy:frontend] git fetch + reset --hard origin/main"
git fetch origin main
git reset --hard origin/main

echo "[deploy:frontend] pnpm install"
pnpm install --frozen-lockfile

echo "[deploy:frontend] build"
pnpm run build

echo "[deploy:frontend] restart service"
systemctl --user restart robocode-frontend

echo "[deploy:frontend] verify active"
systemctl --user is-active robocode-frontend
echo "[deploy:frontend] done"
