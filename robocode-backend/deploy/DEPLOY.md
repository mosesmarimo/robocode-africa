# Deploying robocode-backend (NestJS API)

Direct (no-Docker) deployment to the **robocode.africa** server, mirroring the
zivocloud/funda apps already on that box. CI/CD = GitHub Actions → SSH → `deploy.sh`.

- Runs as the **`robocode`** user (linger enabled) under a `systemctl --user` service
  `robocode-backend` on port **4100**, behind **nginx** at `api.robocode.africa` with
  **Let's Encrypt** TLS. Node comes from robocode's **nvm** (`/srv/robocode/.nvm`).
- Code lives at **`/srv/robocode/backend`** (a git checkout of `main`). Database: **PostgreSQL**.

## CI/CD

`.github/workflows/deploy.yml` runs on push to `main`: it SSHes in and runs
`bash /srv/robocode/backend/deploy.sh`, which does `git reset --hard origin/main` →
`pnpm install` → `prisma generate` + `prisma migrate deploy` → `pnpm build` →
`systemctl --user restart robocode-backend`. Build happens before restart, so a failed
build leaves the running service untouched.

GitHub secrets (repo → Settings → Secrets → Actions):

| Secret | Value |
| --- | --- |
| `SSH_PRIVATE_KEY` | deploy private key (its public half is in `robocode`'s `~/.ssh/authorized_keys`) |
| `KNOWN_HOSTS` | output of `ssh-keyscan robocode.africa` |
| `SSH_HOST` | `robocode.africa` |
| `SSH_USER` | `robocode` |

## Server env `/srv/robocode/backend/.env`

```ini
DATABASE_URL="postgresql://robocode:<pw>@localhost:5432/robocode?schema=public"
AUTH_SECRET="<32+ char random>"
PORT=4100
FRONTEND_ORIGIN="https://robocode.africa"
ROOT_DOMAIN="robocode.africa"
DEEPSEEK_API_KEY="<key>"
DEEPSEEK_MODEL="deepseek-v4-pro"
```

## First-time provisioning

See `robocode-frontend/deploy/provision.sh` (the master script): it creates the
`robocode` user + nvm + node, the Postgres role/DB, the systemd user units, the nginx
sites, and issues the TLS certs. The unit file for this service is
`deploy/robocode-backend.service`; the nginx block is `deploy/nginx/api.robocode.africa.conf`.
