#!/usr/bin/env bash
# Install HydroRage host nginx vhost WITHOUT touching other sites.
# Fixes: hydrorage.com.tr showing ttengamesstudio (default_server catch-all).
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/opt/hydrorage}"
SRC="$ROOT_DIR/docker/nginx/host/hydrorage.conf"
AVAILABLE="${NGINX_AVAILABLE:-/etc/nginx/sites-available/hydrorage.com.tr}"
ENABLED="${NGINX_ENABLED:-/etc/nginx/sites-enabled/hydrorage.com.tr}"
SSL_DIR="${SSL_DIR:-/etc/nginx/ssl/hydrorage}"

if [[ ! -f "$SRC" ]]; then
  echo "Missing $SRC — git pull first" >&2
  exit 1
fi

if ! command -v nginx >/dev/null 2>&1; then
  echo "Host nginx not found. For Caddy see docker/nginx/host/Caddyfile.hydrorage.snippet" >&2
  exit 1
fi

# WebSocket upgrade map (idempotent)
if [[ -d /etc/nginx/conf.d ]] && ! grep -Rqs 'map \$http_upgrade \$connection_upgrade' /etc/nginx/conf.d /etc/nginx/nginx.conf 2>/dev/null; then
  sudo tee /etc/nginx/conf.d/00-hydrorage-upgrade-map.conf >/dev/null <<'EOF'
map $http_upgrade $connection_upgrade {
  default upgrade;
  '' close;
}
EOF
  echo "==> Wrote upgrade map"
fi

# Self-signed cert for Cloudflare Full (browser still sees CF cert)
if [[ ! -f "$SSL_DIR/fullchain.pem" || ! -f "$SSL_DIR/privkey.pem" ]]; then
  echo "==> Generating self-signed TLS cert for origin (Cloudflare Full)"
  sudo mkdir -p "$SSL_DIR"
  sudo openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
    -keyout "$SSL_DIR/privkey.pem" \
    -out "$SSL_DIR/fullchain.pem" \
    -subj "/CN=hydrorage.com.tr" \
    -addext "subjectAltName=DNS:hydrorage.com.tr,DNS:www.hydrorage.com.tr,DNS:admin.hydrorage.com.tr,DNS:api.hydrorage.com.tr"
  sudo chmod 640 "$SSL_DIR/privkey.pem"
fi

echo "==> Installing vhost → $AVAILABLE"
sudo cp "$SRC" "$AVAILABLE"

if [[ -d "$(dirname "$ENABLED")" ]]; then
  sudo ln -sfn "$AVAILABLE" "$ENABLED"
  echo "==> Enabled → $ENABLED"
else
  # Some panels use conf.d only
  if [[ -d /etc/nginx/conf.d ]]; then
    sudo cp "$SRC" /etc/nginx/conf.d/hydrorage.com.tr.conf
    echo "==> Installed → /etc/nginx/conf.d/hydrorage.com.tr.conf"
  fi
fi

echo "==> nginx -t"
sudo nginx -t

echo "==> reload nginx (other vhosts untouched)"
if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet nginx; then
  sudo systemctl reload nginx
else
  sudo nginx -s reload
fi

echo ""
echo "==> Verify (Docker edge must be up on :9080):"
echo "    curl -sI -H 'Host: hydrorage.com.tr' http://127.0.0.1:9080/ | head -5"
echo "    curl -skI --resolve hydrorage.com.tr:443:127.0.0.1 https://hydrorage.com.tr/ | head -5"
echo "    curl -sI https://ttengamesstudio.com.tr/ | head -3   # still TTEN"
echo ""
echo "==> Done. hydrorage.* → 127.0.0.1:9080 ; other sites unchanged."
