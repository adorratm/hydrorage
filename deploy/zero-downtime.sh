#!/usr/bin/env bash
# Blue/green zero-downtime deploy.
# With HYDRORAGE_USE_REGISTRY=1: pull-only (images already tagged by pull-prebuilt.sh).
# Local fallback still builds sequentially with nice/ionice to protect sibling sites.
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/opt/hydrorage}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
COLOR_FILE="${COLOR_FILE:-$ROOT_DIR/ACTIVE_COLOR}"
IMAGE_TAG="${1:-${IMAGE_TAG:-local}}"
USE_REGISTRY="${HYDRORAGE_USE_REGISTRY:-0}"

cd "$ROOT_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ROOT_DIR/$ENV_FILE" >&2
  exit 1
fi

export IMAGE_TAG
COMPOSE=(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE")
export COMPOSE_PARALLEL_LIMIT=1

ACTIVE="blue"
if [[ -f "$COLOR_FILE" ]]; then
  ACTIVE="$(tr -d '[:space:]' <"$COLOR_FILE")"
fi
if [[ "$ACTIVE" != "blue" && "$ACTIVE" != "green" ]]; then
  ACTIVE="blue"
fi

if [[ "$ACTIVE" == "blue" ]]; then
  NEW="green"
  OLD="blue"
else
  NEW="blue"
  OLD="green"
fi

echo "==> Active=$ACTIVE  New=$NEW  Tag=$IMAGE_TAG  registry=$USE_REGISTRY"

echo "==> sync pgbouncer credentials from .env"
bash deploy/sync-pgbouncer.sh
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" up -d pgbouncer

if [[ "$USE_REGISTRY" != "1" ]]; then
  echo "==> Building images on server ONE AT A TIME (nice/ionice — last resort)"
  echo "    Prefer HYDRORAGE_USE_REGISTRY=1 / GHCR to avoid 502 on sibling sites."
  for svc in "api_${NEW}" web admin; do
    echo "--- build: $svc ($(date -Is))"
    nice -n 15 ionice -c2 -n7 \
      env IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" --profile "$NEW" build "$svc" || \
      IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" --profile "$NEW" build "$svc"
  done
else
  echo "==> Using prebuilt images (no compose build)"
fi

echo "==> Starting api_${NEW}"
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" --profile "$NEW" up -d --no-build "api_${NEW}"

echo "==> Waiting for api_${NEW} healthy"
TRIES=90
for i in $(seq 1 "$TRIES"); do
  CID="$("${COMPOSE[@]}" ps -q "api_${NEW}" || true)"
  if [[ -n "$CID" ]]; then
    HEALTH="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$CID" 2>/dev/null || echo starting)"
    if [[ "$HEALTH" == "healthy" ]]; then
      echo "api_${NEW} is healthy"
      break
    fi
  else
    HEALTH="missing"
  fi
  if [[ "$i" -eq "$TRIES" ]]; then
    echo "Timed out waiting for api_${NEW} (last=$HEALTH)" >&2
    "${COMPOSE[@]}" logs --tail=80 "api_${NEW}" || true
    exit 1
  fi
  sleep 3
done

echo "==> Running migrations (prebuilt image, no --build)"
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" --profile migrate run --rm --no-build migrate

echo "==> Switching nginx upstream → api_${NEW}"
mkdir -p docker/nginx/conf.d
sed "s/api_COLOR/api_${NEW}/" docker/nginx/templates/upstream.conf.template \
  > docker/nginx/conf.d/upstream.conf

IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" up -d --no-build --force-recreate web admin
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" up -d --no-build nginx

NGINX_CID="$("${COMPOSE[@]}" ps -q nginx)"
docker exec "$NGINX_CID" nginx -s reload

echo "==> Stopping api_${OLD} (if running)"
"${COMPOSE[@]}" --profile "$OLD" stop "api_${OLD}" 2>/dev/null || true
"${COMPOSE[@]}" --profile "$OLD" rm -f "api_${OLD}" 2>/dev/null || true

echo "$NEW" >"$COLOR_FILE"
echo "==> Deploy complete. Active color: $NEW"
