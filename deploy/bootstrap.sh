#!/usr/bin/env bash
# First-time bootstrap: infra + blue API + nginx.
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/opt/hydrorage}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
COLOR_FILE="${COLOR_FILE:-$ROOT_DIR/ACTIVE_COLOR}"
IMAGE_TAG="${1:-${IMAGE_TAG:-latest}}"

cd "$ROOT_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ROOT_DIR/$ENV_FILE — copy from .env.prod.example" >&2
  exit 1
fi

GHCR_OWNER="$(grep -E '^GHCR_OWNER=' "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '\r')"
POSTGRES_USER="$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '\r')"
POSTGRES_USER="${POSTGRES_USER:-hydrorage}"

if [[ -z "$GHCR_OWNER" ]]; then
  echo "GHCR_OWNER missing in $ENV_FILE" >&2
  exit 1
fi

export IMAGE_TAG
COMPOSE=(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE")

echo "==> Pulling images (tag=$IMAGE_TAG)"
docker pull "${GHCR_OWNER}/hydrorage-api:${IMAGE_TAG}"
docker pull "${GHCR_OWNER}/hydrorage-web:${IMAGE_TAG}"
docker pull "${GHCR_OWNER}/hydrorage-admin:${IMAGE_TAG}"

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

echo "==> Migrate + seed"
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" --profile migrate run --rm migrate

echo "==> Start api_blue + web + admin + nginx"
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" --profile blue up -d api_blue web admin nginx

echo blue >"$COLOR_FILE"
echo "==> Bootstrap done. ACTIVE_COLOR=blue"
echo "    Docker edge: ${HTTP_BIND:-127.0.0.1:9080} (loopback only — other sites keep :80/:443)"
echo "    Next (once): sudo ./deploy/install-host-nginx.sh"
echo "    Then Cloudflare A records for hydrorage* only (Proxy ON)."
