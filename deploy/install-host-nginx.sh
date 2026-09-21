#!/usr/bin/env bash
# Install HydroRage host nginx vhost WITHOUT touching other sites.
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

reload_nginx() {
  echo "==> reloading nginx"
  if command -v systemctl >/dev/null 2>&1; then
    if systemctl is-active --quiet nginx 2>/dev/null; then
      sudo systemctl reload nginx && return 0
    fi
    if systemctl list-unit-files 2>/dev/null | grep -q '^nginx.service'; then
      sudo systemctl restart nginx && return 0
    fi
  fi
  # Fallback when pid file is empty/stale (shared VPS quirk)
  if sudo nginx -s reload 2>/dev/null; then
    return 0
  fi
  echo "WARN: reload failed — trying restart"
  sudo nginx -s stop 2>/dev/null || true
  sudo nginx || sudo systemctl start nginx
}

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
elif [[ -d /etc/nginx/conf.d ]]; then
  sudo cp "$SRC" /etc/nginx/conf.d/hydrorage.com.tr.conf
  echo "==> Installed → /etc/nginx/conf.d/hydrorage.com.tr.conf"
fi

echo "==> nginx -t"
sudo nginx -t

reload_nginx

echo ""
echo "==> Local checks:"
curl -sI -H 'Host: hydrorage.com.tr' http://127.0.0.1:9080/ | head -3 || true
curl -skI --resolve hydrorage.com.tr:443:127.0.0.1 https://127.0.0.1/ | head -5 || true
echo ""
echo "==> Public checks (after Cloudflare):"
echo "    curl -sI https://hydrorage.com.tr/ | head -5"
echo "    curl -sI https://ttengamesstudio.com.tr/ | head -3"
echo "==> Done."
