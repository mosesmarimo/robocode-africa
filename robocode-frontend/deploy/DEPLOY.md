# Deploying robocode-frontend (Next.js) + master server runbook

Direct (no-Docker) deployment to the **robocode.africa** server, mirroring the
zivocloud/funda apps already there. CI/CD = GitHub Actions → SSH → `deploy.sh`.

- Runs as the **`robocode`** user (linger enabled) under a `systemctl --user` service
  `robocode-frontend` on port **3100** (`next start`), behind **nginx** at
  `robocode.africa` (+ `www`, `*.robocode.africa`) with **Let's Encrypt** TLS.
- Code lives at **`/srv/robocode/frontend`**; node from robocode's nvm (`/srv/robocode/.nvm`).
- The API is `robocode-backend` on port 4100 (`api.robocode.africa`).

## One-time provisioning

Run `deploy/provision.sh` as a sudo-capable admin (pass `DEPLOY_PUBKEY=...` to seed the
CI deploy key). It creates the `robocode` user + nvm/node + pnpm, the Postgres role/DB,
clones both repos into `/srv/robocode/{backend,frontend}`, installs the systemd user
units, runs the first build, wires nginx, and issues TLS certs.

## CI/CD

`.github/workflows/deploy.yml` runs on push to `main`: SSHes in and runs
`bash /srv/robocode/frontend/deploy.sh` (`git reset --hard origin/main` → `pnpm install`
→ `pnpm build` → `systemctl --user restart robocode-frontend`). Build precedes restart,
so a failed build leaves the live service running.

GitHub secrets (both repos): `SSH_PRIVATE_KEY`, `KNOWN_HOSTS` (`ssh-keyscan robocode.africa`),
`SSH_HOST=robocode.africa`, `SSH_USER=robocode`.

## Server env `/srv/robocode/frontend/.env`

```ini
# build-time (inlined by next build):
NEXT_PUBLIC_APP_NAME="RoboCode.Africa"
NEXT_PUBLIC_ROOT_DOMAIN="robocode.africa"
NEXT_PUBLIC_API_BASE="/api/v1"
# runtime:
BACKEND_URL="http://127.0.0.1:4100"
PORT=3100
```

The browser hits `robocode.africa`; Next serves the UI and proxies `/api/v1/*` to the
backend (same-origin cookie). Tenant white-labelling is driven by the `Host` header,
forwarded by nginx as `X-Forwarded-Host`.

## Published-project subdomains (`*.robocode.studio` / `*.robocode.africa`)

Server-side routing is already installed (2026-07-05): nginx
`robocode-publish.conf` (from `deploy/nginx/robocode-publish.conf`) forwards
both wildcards to the frontend on :3100, and the backend has
`PUBLISH_DOMAINS` / `PUBLISH_TARGET_TYPE` / `PUBLISH_TARGET_VALUE` in its
`.env` (GoDaddy API keys intentionally empty → the DNS client stays dry-run).

**Status 2026-07-06: COMPLETE.** Wildcard DNS (`*` A → 20.164.2.107) live on
both domains; HTTPS everywhere with HTTP→HTTPS redirects. Cert lineages:
`/etc/letsencrypt/live/robocode.studio` (`*.robocode.studio` + apex, DNS-01)
and `/etc/letsencrypt/live/robocode.africa-wildcard` (`*.robocode.africa`,
DNS-01). Published projects AND school tenant subdomains serve over TLS.

**Issuing/renewing the DNS-01 wildcard certs** (no GoDaddy API key — the DNS
API needs a 10+-domain account): use the blocking auth hook so nothing waits
on an interactive terminal:

```bash
sudo certbot certonly --manual --preferred-challenges dns \
  --manual-auth-hook /root/acme-wait-hook.sh \
  -d '*.robocode.studio' -d robocode.studio --non-interactive
```

The hook appends the required value to
`/tmp/acme-needed-<domain>.txt` and blocks (up to 60 min) until the matching
`TXT _acme-challenge` record is visible on the domain's nameserver — add it
in the GoDaddy dashboard, and issuance completes by itself.

⚠️ These DNS-01 certs do **not** auto-renew (90 days — check
`sudo certbot certificates`): repeat the TXT dance each quarter, or provision
a GoDaddy API key and switch to a DNS-plugin ACME client. The
`robocode.africa` apex/api/www cert is HTTP-01 and keeps auto-renewing.
(Redundant lineages `robocode.studio-0001`/`robocode.studio-wildcard` were
deleted 2026-07-06.) **Renewal due ~2026-10-04 for both DNS-01 wildcards.**
