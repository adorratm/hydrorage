#!/usr/bin/env bash
# First-time bootstrap.
# With HYDRORAGE_USE_REGISTRY=1: pull-only. Otherwise sequential local build (last resort).
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/opt/hydrorage}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
COLOR_FILE="${COLOR_FILE:-$ROOT_DIR/ACTIVE_COLOR}"
IMAGE_TAG="${1:-${IMAGE_TAG:-local}}"
USE_REGISTRY="${HYDRORAGE_USE_REGISTRY:-0}"

cd "$ROOT_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ROOT_DIR/$ENV_FILE — copy from .env.prod.example" >&2
  exit 1
fi

POSTGRES_USER="$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '\r')"
POSTGRES_USER="${POSTGRES_USER:-hydrorage}"

export IMAGE_TAG
COMPOSE=(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE")
export COMPOSE_PARALLEL_LIMIT=1

mkdir -p docker/nginx/conf.d
sed 's/api_COLOR/api_blue/' docker/nginx/templates/upstream.conf.template \
  > docker/nginx/conf.d/upstream.conf

echo "==> sync pgbouncer credentials from .env"
bash deploy/sync-pgbouncer.sh

echo "==> Starting postgres / pgbouncer / redis"
"${COMPOSE[@]}" up -d postgres pgbouncer redis

echo "==> Waiting for postgres"
for i in $(seq 1 40); do
  if "${COMPOSE[@]}" exec -T postgres pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if [[ "$USE_REGISTRY" != "1" ]]; then
  echo "==> Building images ONE AT A TIME (prefer GHCR / HYDRORAGE_USE_REGISTRY=1)"
  for svc in api_blue web admin; do
    echo "--- build: $svc"
    nice -n 15 ionice -c2 -n7 \
      env IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" --profile blue build "$svc" || \
      IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" --profile blue build "$svc"
  done
else
  echo "==> Using prebuilt images (no compose build)"
fi

echo "==> Migrate + seed"
# Compose v2 `run` does not accept --no-build; image must already exist (pull or prior build).
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" --profile migrate run --rm migrate

echo "==> Start api_blue + web + admin + nginx"
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" --profile blue up -d --no-build api_blue web admin nginx

echo blue >"$COLOR_FILE"
echo "==> Bootstrap done. ACTIVE_COLOR=blue"
echo "    Docker edge: 127.0.0.1:9080 (loopback — other sites keep :80/:443)"
echo "    Next (once): bash deploy/install-into-edge-nginx.sh"
echo "    Do NOT systemctl start nginx — :80/:443 belong to ttengamesstudio-nginx"
