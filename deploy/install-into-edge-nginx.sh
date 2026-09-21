#!/usr/bin/env bash
# Wire HydroRage into ttengamesstudio-nginx (:80/:443 owner).
# SSL files go into conf.d (writable); /etc/nginx/ssl is read-only on this stack.
set -euo pipefail

EDGE="${EDGE_CONTAINER:-ttengamesstudio-nginx}"
ROOT_DIR="${ROOT_DIR:-/opt/hydrorage}"

if ! docker ps --format '{{.Names}}' | grep -qx "$EDGE"; then
  echo "ERROR: $EDGE not running" >&2
  exit 1
fi

echo "==> mounts"
docker inspect "$EDGE" --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'

TMP="$(mktemp -d)"
openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
  -keyout "$TMP/privkey.pem" -out "$TMP/fullchain.pem" \
  -subj "/CN=hydrorage.com.tr" \
  -addext "subjectAltName=DNS:hydrorage.com.tr,DNS:www.hydrorage.com.tr,DNS:admin.hydrorage.com.tr,DNS:api.hydrorage.com.tr" \
  2>/dev/null

# Persist certs inside writable conf.d
docker cp "$TMP/fullchain.pem" "$EDGE:/etc/nginx/conf.d/hydrorage.fullchain.pem"
docker cp "$TMP/privkey.pem" "$EDGE:/etc/nginx/conf.d/hydrorage.privkey.pem"
rm -rf "$TMP"

# Ensure upgrade map (ignore if map already in http{})
docker exec -i "$EDGE" sh -c 'cat > /etc/nginx/conf.d/00-upgrade-map.conf' <<'EOF' || true
map $http_upgrade $connection_upgrade {
  default upgrade;
  '' close;
}
EOF

docker exec -i "$EDGE" sh -c 'cat > /etc/nginx/conf.d/hydrorage.com.tr.conf' <<'EOF'
upstream hydrorage_edge {
  server 172.17.0.1:9080;
  keepalive 8;
}

server {
  listen 80;
  listen [::]:80;
  server_name hydrorage.com.tr www.hydrorage.com.tr
               admin.hydrorage.com.tr api.hydrorage.com.tr;

  location / {
    proxy_pass http://hydrorage_edge;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_read_timeout 120s;
  }
}

server {
  listen 443 ssl;
  listen [::]:443 ssl;
  server_name hydrorage.com.tr www.hydrorage.com.tr
               admin.hydrorage.com.tr api.hydrorage.com.tr;

  ssl_certificate     /etc/nginx/conf.d/hydrorage.fullchain.pem;
  ssl_certificate_key /etc/nginx/conf.d/hydrorage.privkey.pem;
  ssl_protocols       TLSv1.2 TLSv1.3;

  location / {
    proxy_pass http://hydrorage_edge;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_read_timeout 120s;
  }
}
EOF

# Persist onto host bind-mount if conf.d is mounted
HOST_CONF="$(docker inspect "$EDGE" --format '{{range .Mounts}}{{if eq .Destination "/etc/nginx/conf.d"}}{{.Source}}{{end}}{{end}}')"
if [[ -n "$HOST_CONF" && -d "$HOST_CONF" ]]; then
  echo "==> host mount: $HOST_CONF"
  docker cp "$EDGE:/etc/nginx/conf.d/hydrorage.com.tr.conf" "$HOST_CONF/hydrorage.com.tr.conf"
  docker cp "$EDGE:/etc/nginx/conf.d/hydrorage.fullchain.pem" "$HOST_CONF/hydrorage.fullchain.pem" 2>/dev/null || true
  docker cp "$EDGE:/etc/nginx/conf.d/hydrorage.privkey.pem" "$HOST_CONF/hydrorage.privkey.pem" 2>/dev/null || true
fi

echo "==> nginx -t"
docker exec "$EDGE" nginx -t

echo "==> reload"
docker exec "$EDGE" nginx -s reload

echo ""
echo "==> checks"
curl -sI -H 'Host: hydrorage.com.tr' http://127.0.0.1/ | head -5
curl -skI -H 'Host: hydrorage.com.tr' https://127.0.0.1/ | head -8
curl -sI https://ttengamesstudio.com.tr/ | head -3
echo "Public: curl -sI https://hydrorage.com.tr/ | head -8"
echo "Expect HydroRage HTML (not Nuxt). Purge Cloudflare cache if stale."
