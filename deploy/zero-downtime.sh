#!/usr/bin/env bash
# Blue/green zero-downtime deploy for HydroRage API (+ web/admin recreate).
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/opt/hydrorage}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
COLOR_FILE="${COLOR_FILE:-$ROOT_DIR/ACTIVE_COLOR}"
IMAGE_TAG="${1:-${IMAGE_TAG:-latest}}"

cd "$ROOT_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ROOT_DIR/$ENV_FILE" >&2
  exit 1
fi

# Read GHCR_OWNER without sourcing the whole env (secrets may break bash)
GHCR_OWNER="$(grep -E '^GHCR_OWNER=' "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '\r')"
if [[ -z "$GHCR_OWNER" ]]; then
  echo "GHCR_OWNER missing in $ENV_FILE" >&2
  exit 1
fi

export IMAGE_TAG
COMPOSE=(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE")

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

echo "==> Active=$ACTIVE  New=$NEW  Tag=$IMAGE_TAG  Registry=$GHCR_OWNER"

echo "==> Pulling images"
docker pull "${GHCR_OWNER}/hydrorage-api:${IMAGE_TAG}"
docker pull "${GHCR_OWNER}/hydrorage-web:${IMAGE_TAG}"
docker pull "${GHCR_OWNER}/hydrorage-admin:${IMAGE_TAG}"

echo "==> Starting api_${NEW}"
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" --profile "$NEW" up -d "api_${NEW}"

echo "==> Waiting for api_${NEW} healthy"
TRIES=60
CID=""
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

echo "==> Running migrations"
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" --profile migrate run --rm migrate

echo "==> Switching nginx upstream → api_${NEW}"
mkdir -p docker/nginx/conf.d
sed "s/api_COLOR/api_${NEW}/" docker/nginx/templates/upstream.conf.template \
  > docker/nginx/conf.d/upstream.conf

IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" up -d --force-recreate web admin
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" up -d nginx

NGINX_CID="$("${COMPOSE[@]}" ps -q nginx)"
docker exec "$NGINX_CID" nginx -s reload

echo "==> Stopping api_${OLD} (if running)"
"${COMPOSE[@]}" --profile "$OLD" stop "api_${OLD}" 2>/dev/null || true
"${COMPOSE[@]}" --profile "$OLD" rm -f "api_${OLD}" 2>/dev/null || true

echo "$NEW" >"$COLOR_FILE"
echo "==> Deploy complete. Active color: $NEW"
