#!/usr/bin/env bash
# Install HydroRage host nginx vhost WITHOUT touching other sites.
# Safe on a shared VPS (ttengamesstudio, emrekilic, kiliccoffeeroaster, …).
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/opt/hydrorage}"
SRC="$ROOT_DIR/docker/nginx/host/hydrorage.conf"
AVAILABLE="${NGINX_AVAILABLE:-/etc/nginx/sites-available/hydrorage.com.tr}"
ENABLED="${NGINX_ENABLED:-/etc/nginx/sites-enabled/hydrorage.com.tr}"

if [[ ! -f "$SRC" ]]; then
  echo "Missing $SRC" >&2
  exit 1
fi

if ! command -v nginx >/dev/null 2>&1; then
  echo "Host nginx not found. If you use Caddy, see docker/nginx/host/Caddyfile.hydrorage.snippet" >&2
  exit 1
fi

# Ensure map for websocket Connection header exists once (idempotent)
CONF_MAIN="${NGINX_CONF:-/etc/nginx/nginx.conf}"
if [[ -f "$CONF_MAIN" ]] && ! grep -q 'map \$http_upgrade \$connection_upgrade' "$CONF_MAIN" 2>/dev/null; then
  # Prefer conf.d snippet so we never rewrite other site files
  MAP_SNIPPET=/etc/nginx/conf.d/00-hydrorage-upgrade-map.conf
  if [[ -d /etc/nginx/conf.d ]]; then
    sudo tee "$MAP_SNIPPET" >/dev/null <<'EOF'
map $http_upgrade $connection_upgrade {
  default upgrade;
  '' close;
}
EOF
    echo "==> Wrote $MAP_SNIPPET"
  fi
fi

echo "==> Installing vhost → $AVAILABLE"
sudo cp "$SRC" "$AVAILABLE"

if [[ -d "$(dirname "$ENABLED")" ]]; then
  sudo ln -sfn "$AVAILABLE" "$ENABLED"
  echo "==> Enabled → $ENABLED"
else
  echo "Note: no sites-enabled dir; ensure $AVAILABLE is included from nginx.conf" >&2
fi

echo "==> nginx -t"
sudo nginx -t

echo "==> reload nginx (other vhosts unchanged)"
if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet nginx; then
  sudo systemctl reload nginx
else
  sudo nginx -s reload
fi

echo "==> Done. Only hydrorage.* server_name blocks were added."
echo "    Existing sites were not modified."
