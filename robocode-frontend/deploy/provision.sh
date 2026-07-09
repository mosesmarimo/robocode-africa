#!/usr/bin/env bash
# One-time provisioning for RoboCode.Africa on the shared robocode.africa server,
# mirroring the zivocloud/funda apps already on that box. Run by a sudo-capable
# admin. Creates the robocode user (nvm + node), Postgres DB, user systemd
# services, nginx sites and TLS. Ports: frontend 3100, backend 4100.
set -euo pipefail

NODE_VERSION="22"
DEPLOY_PUBKEY="${DEPLOY_PUBKEY:-}"   # public half of the GitHub Actions SSH_PRIVATE_KEY

echo "==> base packages (nginx/postgres/certbot already present on the shared box)"
sudo apt-get update -y
sudo apt-get install -y nginx postgresql certbot python3-certbot-nginx git rsync curl

echo "==> robocode user + home at /srv/robocode, with linger so user services persist"
sudo useradd -m -d /srv/robocode -s /bin/bash robocode 2>/dev/null || true
sudo loginctl enable-linger robocode
sudo mkdir -p /srv/robocode/.ssh && sudo chmod 700 /srv/robocode/.ssh
if [ -n "$DEPLOY_PUBKEY" ]; then
  echo "$DEPLOY_PUBKEY" | sudo tee -a /srv/robocode/.ssh/authorized_keys >/dev/null
fi
sudo chmod 600 /srv/robocode/.ssh/authorized_keys 2>/dev/null || true
sudo chown -R robocode:robocode /srv/robocode

echo "==> nvm + node $NODE_VERSION + pnpm (as robocode)"
sudo -u robocode bash -lc '
  export NVM_DIR=/srv/robocode/.nvm
  [ -d "$NVM_DIR" ] || git clone https://github.com/nvm-sh/nvm.git "$NVM_DIR"
  cd "$NVM_DIR" && git checkout v0.40.1 >/dev/null 2>&1 || true
  . "$NVM_DIR/nvm.sh"
  nvm install '"$NODE_VERSION"'
  nvm alias default '"$NODE_VERSION"'
  corepack enable
  corepack prepare pnpm@9.15.9 --activate
'

echo "==> PostgreSQL role + database (edit the password!)"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='robocode'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE ROLE robocode LOGIN PASSWORD 'CHANGE_ME';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='robocode'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE robocode OWNER robocode;"

echo "==> clone the private repos (uses robocode's deploy key / git over SSH)"
sudo -u robocode bash -lc '
  [ -d /srv/robocode/backend/.git ]  || git clone git@github.com:mosesmarimo/robocode-backend.git  /srv/robocode/backend
  [ -d /srv/robocode/frontend/.git ] || git clone git@github.com:mosesmarimo/robocode-frontend.git /srv/robocode/frontend
'

echo "==> place env files (fill in real values!):"
echo "    /srv/robocode/backend/.env  and  /srv/robocode/frontend/.env  (see each repo's .env.example)"

echo "==> install systemd user units"
sudo -u robocode mkdir -p /srv/robocode/.config/systemd/user
sudo cp /srv/robocode/backend/deploy/robocode-backend.service   /srv/robocode/.config/systemd/user/
sudo cp /srv/robocode/frontend/deploy/robocode-frontend.service /srv/robocode/.config/systemd/user/
sudo chown -R robocode:robocode /srv/robocode/.config
sudo -u robocode XDG_RUNTIME_DIR=/run/user/$(id -u robocode) bash -lc '
  systemctl --user daemon-reload
  systemctl --user enable robocode-backend robocode-frontend
'

echo "==> first build + start (run each repo deploy.sh once)"
sudo -u robocode bash /srv/robocode/backend/deploy.sh
sudo -u robocode bash /srv/robocode/frontend/deploy.sh

echo "==> nginx sites"
sudo cp /srv/robocode/frontend/deploy/nginx/robocode.africa.conf      /etc/nginx/sites-available/robocode-web.conf
sudo cp /srv/robocode/backend/deploy/nginx/api.robocode.africa.conf   /etc/nginx/sites-available/robocode-api.conf
sudo ln -sf /etc/nginx/sites-available/robocode-web.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/robocode-api.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "==> TLS (DNS for robocode.africa/www/api must already point here)"
sudo certbot --nginx -d robocode.africa -d www.robocode.africa -d api.robocode.africa \
  --non-interactive --agree-tos -m admin@robocode.africa --redirect

echo "==> done. Add GitHub secrets in both repos: SSH_PRIVATE_KEY, KNOWN_HOSTS,"
echo "    SSH_HOST=robocode.africa, SSH_USER=robocode. Pushes to main then auto-deploy."
