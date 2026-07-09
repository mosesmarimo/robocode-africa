#!/usr/bin/env bash
# Server-side deploy for the RoboCode backend (run by GitHub Actions over SSH,
# under the robocode user on robocode.africa). Builds BEFORE restarting so a
# failed build leaves the running service untouched.
set -euo pipefail

# Make 'systemctl --user' work over a non-login SSH session.
export XDG_RUNTIME_DIR="/run/user/$(id -u)"

# Load robocode's nvm so node/pnpm are on PATH.
export NVM_DIR="/srv/robocode/.nvm"
# shellcheck disable=SC1091
source "$NVM_DIR/nvm.sh"
corepack enable >/dev/null 2>&1 || true

cd /srv/robocode/backend

echo "[deploy:backend] git fetch + reset --hard origin/main"
git fetch origin main
git reset --hard origin/main

echo "[deploy:backend] pnpm install"
pnpm install --frozen-lockfile

echo "[deploy:backend] prisma generate + migrate deploy"
pnpm exec prisma generate
pnpm exec prisma migrate deploy

# Publish the Content Library (courses, lessons, challenges) into the DB.
# Idempotent + non-destructive (upserts by slug; preserves lesson ids/progress).
# Non-fatal: a content hiccup must never block the app from deploying.
echo "[deploy:backend] seed content (idempotent)"
pnpm run db:seed-content || echo "[deploy:backend] WARN: content seed failed — continuing deploy"

# Publish the "Coding example" template projects (6 per language) into the DB.
# Idempotent: replaces only platform isTemplate coding projects; never touches
# user-owned projects. Non-fatal so it can't block a deploy.
echo "[deploy:backend] seed coding examples (idempotent)"
pnpm run db:seed-coding || echo "[deploy:backend] WARN: coding-examples seed failed — continuing deploy"

# Publish the robotics "starter template" projects (5 per board: Arduino UNO,
# ESP32, Raspberry Pi Pico). Idempotent: replaces only platform isTemplate
# robotics projects; never touches user-owned projects. Non-fatal so it can't
# block a deploy.
echo "[deploy:backend] seed robotics templates (idempotent)"
pnpm run db:seed-robotics || echo "[deploy:backend] WARN: robotics-templates seed failed — continuing deploy"

echo "[deploy:backend] build"
pnpm run build

echo "[deploy:backend] restart service"
systemctl --user restart robocode-backend

echo "[deploy:backend] verify active"
systemctl --user is-active robocode-backend
echo "[deploy:backend] done"
