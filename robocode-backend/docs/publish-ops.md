# Publish-to-subdomain: ops guide

The publish feature (`src/modules/publish`) lets a student/teacher publish a
project to `<name>.robocode.studio` or `<name>.robocode.africa`. This doc
covers the one-time DNS setup an operator does, wildcard TLS, and reverse-proxy
routing. It does **not** cover the in-app publish flow itself (see
`src/modules/publish/publish.service.ts` and `src/modules/publish/godaddy.service.ts`).

## Current state

- **`*.robocode.africa`** already has a wildcard DNS record — it's been serving
  white-label school tenant subdomains since before the publish feature existed
  (see `robocode-frontend/deploy/nginx/robocode.africa.conf` and
  `robocode-frontend/deploy/DEPLOY.md`). **Nothing to do here.**
- **`*.robocode.studio`** is new and needs a one-time wildcard record created,
  pointing at the same ingress as the Next.js app (`robocode-frontend`, port
  3100 behind nginx). That's what `scripts/ensure-wildcard.ts` does.

## 1. Set the environment variables

In `robocode-backend/.env` (see `.env.example` for the full block):

```ini
# GoDaddy Domains API credentials. Leave both empty to stay in dry-run mode
# (every DNS mutation is logged, never sent) — the safe default until real
# creds are provisioned.
GODADDY_API_KEY="..."
GODADDY_API_SECRET="..."
# Set to "true" to hit GoDaddy's OTE (sandbox) API instead of production —
# use this to test the flow against GoDaddy's test environment first.
GODADDY_OTE=""

# Domains users may publish a project to.
PUBLISH_DOMAINS="robocode.studio,robocode.africa"

# DNS record type/value the wildcard (*.<domain>) should point at.
PUBLISH_TARGET_TYPE="A"          # or "CNAME"
PUBLISH_TARGET_VALUE=""          # the ingress IP (type A) or CNAME target
```

`PUBLISH_TARGET_VALUE` is the same ingress every domain's wildcard should
point at — in production that's the `robocode.africa` server's public IP
(the box nginx runs on, in front of the `robocode-frontend` service on port
3100), or a CNAME to it if you're fronting with something else.

Get real GoDaddy API credentials from
[developer.godaddy.com/keys](https://developer.godaddy.com/keys) — the
account must have the `robocode.studio` domain registered under it (or
delegate DNS to GoDaddy's nameservers) for the API to manage its records.

## 2. Run the one-time wildcard script

Once creds + `PUBLISH_TARGET_VALUE` are set:

```sh
cd robocode-backend
npx tsx scripts/ensure-wildcard.ts                 # creates *.robocode.studio
npx tsx scripts/ensure-wildcard.ts robocode.africa  # optional: re-verify africa's record too
```

This is a thin CLI wrapper around `GoDaddyService.ensureWildcard()` — the
exact same call `PublishService.publish()` makes on every publish (best-effort,
so an occasional DNS hiccup there never fails a user's publish). Running the
script is only needed **once** to seed the wildcard before the first
`robocode.studio` publish happens; after that, `ensureWildcard()` self-heals
the record on every publish call anyway.

**It's safe to run repeatedly** — `ensureWildcard()` checks the existing
record first and only PUTs when it's absent or points somewhere else.

**It's safe to run with no credentials** — with `GODADDY_API_KEY`/
`GODADDY_API_SECRET` unset (`.env.example`'s default), the script and the
underlying `GoDaddyService` make **zero network calls**. It just prints:

```
DRY RUN (set GODADDY_API_KEY/SECRET to go live) — would create *.robocode.studio -> A <target>
```

and exits 0. This mirrors the `RUN_SANDBOX_DISABLED`-style "off unless
explicitly armed" convention used by the code-runner sandbox
(`docs/sandbox-ops.md`) — nothing here can touch live DNS until both GoDaddy
creds are deliberately set.

## 3. Wildcard TLS for `*.robocode.studio`

A wildcard cert is required (the reverse proxy terminates TLS for every
`<name>.robocode.studio` host, and CAs won't issue for the bare wildcard via
HTTP-01). Two options, same tradeoff `*.robocode.africa` already faces:

- **Certbot, manual DNS-01 (matches how `*.robocode.africa` was issued today):**
  ```sh
  sudo certbot certonly --manual --preferred-challenges dns -d '*.robocode.studio'
  ```
  Certbot prints a TXT record to create; you create it in the GoDaddy DNS
  panel (or via the API), certbot verifies it, and issues the cert. **Renewal
  is manual** every ~90 days unless automated (see next option) — this is
  the same manual step `*.robocode.africa`'s cert already requires.

- **Automated DNS-01 via a GoDaddy plugin (recommended for `robocode.studio`
  so renewal doesn't require a human every 90 days):**
  - Certbot: the community `certbot-dns-godaddy` plugin authenticates the
    DNS-01 challenge using `GODADDY_API_KEY`/`GODADDY_API_SECRET` — the same
    credentials this feature already uses — and lets `certbot renew` run
    unattended via cron/systemd-timer.
  - Caddy: if the reverse proxy is (or moves to) Caddy instead of nginx, the
    [`caddy-dns/godaddy`](https://github.com/caddy-dns/godaddy) module handles
    wildcard issuance + auto-renewal natively, again using the same API
    credentials — `tls { dns godaddy {env.GODADDY_API_KEY} }` in the Caddyfile
    for the `robocode.studio` site block.

Either way, the cert must cover `*.robocode.studio` (and, for the apex
redirect, `robocode.studio` itself) — same shape as the existing
`*.robocode.africa` wildcard cert.

## 4. Reverse-proxy routing

Both wildcard domains route to the **same** `robocode-frontend` Next.js app
(port 3100) by `Host` header — the app resolves the tenant/published project
from `Host`/`X-Forwarded-Host`, not from a separate proxy route per domain.
Add a server block for `robocode.studio` alongside the existing
`robocode.africa` one (see `robocode-frontend/deploy/nginx/robocode.africa.conf`
for the pattern to copy):

```nginx
server {
    listen 443 ssl;
    server_name robocode.studio *.robocode.studio;

    ssl_certificate     /etc/letsencrypt/live/robocode.studio/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/robocode.studio/privkey.pem;

    client_max_body_size 12m;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;   # published-project resolution depends on this
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 200s;
    }
}
```

`*.robocode.africa`'s existing block already does the equivalent for that
domain — no changes needed there, only the new `robocode.studio` block plus
the wildcard record from step 2 and the cert from step 3.

## Summary checklist

- [ ] `GODADDY_API_KEY` / `GODADDY_API_SECRET` set (real creds, not OTE, for
      production)
- [ ] `PUBLISH_TARGET_VALUE` set to the ingress IP or CNAME
- [ ] `npx tsx scripts/ensure-wildcard.ts` run once — confirms
      `*.robocode.studio` DNS record exists
- [ ] Wildcard TLS cert issued for `*.robocode.studio` (+ auto-renewal wired
      up via a GoDaddy DNS plugin, so it doesn't silently expire)
- [ ] nginx (or Caddy) has a `robocode.studio` / `*.robocode.studio` server
      block proxying to the same Next.js app as `robocode.africa`
- [x] `*.robocode.africa` — already done, no action needed
