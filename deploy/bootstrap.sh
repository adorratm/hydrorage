#!/usr/bin/env bash
# First-time bootstrap — builds on the VPS (no GHCR).
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/opt/hydrorage}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
COLOR_FILE="${COLOR_FILE:-$ROOT_DIR/ACTIVE_COLOR}"
IMAGE_TAG="${1:-${IMAGE_TAG:-local}}"

cd "$ROOT_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ROOT_DIR/$ENV_FILE — copy from .env.prod.example" >&2
  exit 1
fi

POSTGRES_USER="$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '\r')"
POSTGRES_USER="${POSTGRES_USER:-hydrorage}"

export IMAGE_TAG
COMPOSE=(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE")

mkdir -p docker/nginx/conf.d
sed 's/api_COLOR/api_blue/' docker/nginx/templates/upstream.conf.template \
  > docker/nginx/conf.d/upstream.conf

echo "==> Starting postgres / pgbouncer / redis"
"${COMPOSE[@]}" up -d postgres pgbouncer redis

echo "==> Waiting for postgres"
for i in $(seq 1 40); do
  if "${COMPOSE[@]}" exec -T postgres pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "==> Building images (first run can take several minutes)"
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" --profile blue build api_blue web admin

echo "==> Migrate + seed"
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" --profile migrate run --rm --build migrate

echo "==> Start api_blue + web + admin + nginx"
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" --profile blue up -d api_blue web admin nginx

echo blue >"$COLOR_FILE"
echo "==> Bootstrap done. ACTIVE_COLOR=blue"
echo "    Docker edge: 127.0.0.1:9080 (loopback — other sites keep :80/:443)"
echo "    Next (once): sudo ./deploy/install-host-nginx.sh"
