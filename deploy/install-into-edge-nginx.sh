#!/usr/bin/env bash
# Wire HydroRage into ttengamesstudio-nginx (the container that owns :80/:443).
# Does NOT replace TTEN / portfolio / kiliccoffee server blocks — only adds hydrorage.*.
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/opt/hydrorage}"
EDGE="${EDGE_CONTAINER:-ttengamesstudio-nginx}"
SNIPPET="$ROOT_DIR/docker/nginx/host/hydrorage.edge-snippet.conf"
SSL_HOST_DIR="${SSL_HOST_DIR:-/opt/hydrorage/docker/nginx/ssl-hydrorage}"

if ! docker ps --format '{{.Names}}' | grep -qx "$EDGE"; then
  echo "ERROR: edge container '$EDGE' not running" >&2
  docker ps --format '{{.Names}}' | head -20 >&2
  exit 1
fi

if [[ ! -f "$SNIPPET" ]]; then
  echo "Missing $SNIPPET — git pull" >&2
  exit 1
fi

echo "==> Inspecting mounts on $EDGE"
docker inspect "$EDGE" --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'

# Prefer conf.d inside the container
CONF_D="$(docker exec "$EDGE" sh -c 'if [ -d /etc/nginx/conf.d ]; then echo /etc/nginx/conf.d; elif [ -d /etc/nginx/sites-enabled ]; then echo /etc/nginx/sites-enabled; else echo /etc/nginx/conf.d; fi')"

# Ensure upgrade map exists in edge nginx
if ! docker exec "$EDGE" sh -c "grep -Rqs 'map \\\$http_upgrade \\\$connection_upgrade' /etc/nginx/ 2>/dev/null"; then
  echo "==> Adding upgrade map inside $EDGE"
  docker exec -i "$EDGE" sh -c "cat > /etc/nginx/conf.d/00-upgrade-map.conf" <<'EOF'
map $http_upgrade $connection_upgrade {
  default upgrade;
  '' close;
}
EOF
fi

# TLS material on host, bind-mounted or copied into container
mkdir -p "$SSL_HOST_DIR"
if [[ ! -f "$SSL_HOST_DIR/fullchain.pem" ]]; then
  echo "==> Creating self-signed cert for Cloudflare Full"
  openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
    -keyout "$SSL_HOST_DIR/privkey.pem" \
    -out "$SSL_HOST_DIR/fullchain.pem" \
    -subj "/CN=hydrorage.com.tr" \
    -addext "subjectAltName=DNS:hydrorage.com.tr,DNS:www.hydrorage.com.tr,DNS:admin.hydrorage.com.tr,DNS:api.hydrorage.com.tr"
fi

echo "==> Copying certs + vhost into $EDGE"
docker exec "$EDGE" mkdir -p /etc/nginx/ssl/hydrorage
docker cp "$SSL_HOST_DIR/fullchain.pem" "$EDGE:/etc/nginx/ssl/hydrorage/fullchain.pem"
docker cp "$SSL_HOST_DIR/privkey.pem" "$EDGE:/etc/nginx/ssl/hydrorage/privkey.pem"
docker cp "$SNIPPET" "$EDGE:$CONF_D/hydrorage.com.tr.conf"

# Also try to persist onto a host bind-mount if conf.d is mounted
HOST_CONF_D="$(docker inspect "$EDGE" --format '{{range .Mounts}}{{if eq .Destination "/etc/nginx/conf.d"}}{{.Source}}{{end}}{{end}}')"
if [[ -n "$HOST_CONF_D" && -d "$HOST_CONF_D" ]]; then
  echo "==> Persisting to host mount $HOST_CONF_D"
  cp "$SNIPPET" "$HOST_CONF_D/hydrorage.com.tr.conf"
fi

echo "==> nginx -t inside $EDGE"
docker exec "$EDGE" nginx -t

echo "==> reload $EDGE"
docker exec "$EDGE" nginx -s reload

echo ""
echo "==> Verify"
curl -sI -H 'Host: hydrorage.com.tr' http://127.0.0.1/ | head -5
curl -skI -H 'Host: hydrorage.com.tr' https://127.0.0.1/ | head -5
curl -sI https://ttengamesstudio.com.tr/ | head -3
echo ""
echo "==> Done. hydrorage.* → 172.17.0.1:9080 via $EDGE"
echo "    If 502: ensure hydrorage-nginx is up on 127.0.0.1:9080"
echo "    curl -sI -H 'Host: hydrorage.com.tr' http://127.0.0.1:9080/ | head -3"
