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

echo "==> sync postgres role + pgbouncer from .env (fixes volume password drift)"
bash deploy/sync-db-auth.sh

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

echo "==> Starting api_${NEW} (force-recreate so .env / image tag apply)"
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" --profile "$NEW" up -d --no-build --force-recreate --no-deps "api_${NEW}"

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

echo "==> Running migrations (prebuilt image; compose run has no --no-build flag)"
# Do NOT pass --no-build here — Compose v2 `run` rejects it (exit 1 → 502 deploy).
# Image already tagged by pull-prebuilt.sh; omit --build so run won't rebuild.
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" --profile migrate run --rm migrate

echo "==> Switching nginx upstream → api_${NEW}"
mkdir -p docker/nginx/conf.d
sed "s/api_COLOR/api_${NEW}/" docker/nginx/templates/upstream.conf.template \
  > docker/nginx/conf.d/upstream.conf

IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" up -d --no-build --force-recreate --remove-orphans web admin

echo "==> Waiting for web/admin running"
for svc in web admin; do
  for i in $(seq 1 40); do
    CID="$("${COMPOSE[@]}" ps -q "$svc" || true)"
    if [[ -n "$CID" ]]; then
      ST="$(docker inspect --format='{{.State.Status}}' "$CID" 2>/dev/null || echo missing)"
      if [[ "$ST" == "running" ]]; then
        break
      fi
    else
      ST="missing"
    fi
    if [[ "$i" -eq 40 ]]; then
      echo "ERROR: $svc not running (last=$ST)" >&2
      "${COMPOSE[@]}" logs --tail=40 "$svc" || true
      exit 1
    fi
    sleep 1
  done
done

# Force-recreate loads new upstream.conf; avoid flaky reload on a crash-looping container.
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" up -d --no-build --force-recreate --remove-orphans nginx

echo "==> Waiting for nginx running"
NGINX_CID=""
for i in $(seq 1 45); do
  NGINX_CID="$("${COMPOSE[@]}" ps -q nginx || true)"
  if [[ -n "$NGINX_CID" ]]; then
    ST="$(docker inspect --format='{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' "$NGINX_CID" 2>/dev/null || echo missing)"
    # Status must be running and not in Restarting (inspect Status stays "running" while RestartingCount climbs — check State.Restarting)
    RESTARTING="$(docker inspect --format='{{.State.Restarting}}' "$NGINX_CID" 2>/dev/null || echo true)"
    if [[ "$RESTARTING" == "false" ]]; then
      RUNNING="$(docker inspect --format='{{.State.Running}}' "$NGINX_CID" 2>/dev/null || echo false)"
      if [[ "$RUNNING" == "true" ]]; then
        if docker exec "$NGINX_CID" nginx -t >/dev/null 2>&1; then
          echo "nginx is up"
          break
        fi
      fi
    fi
  else
    ST="missing"
    RESTARTING="true"
  fi
  if [[ "$i" -eq 45 ]]; then
    echo "ERROR: nginx failed to stay up (state=$ST restarting=$RESTARTING)" >&2
    "${COMPOSE[@]}" logs --tail=80 nginx || true
    docker inspect "$NGINX_CID" --format='{{json .State}}' 2>/dev/null || true
    exit 1
  fi
  sleep 1
done

echo "==> Stopping api_${OLD} (if running)"
"${COMPOSE[@]}" --profile "$OLD" stop "api_${OLD}" 2>/dev/null || true
"${COMPOSE[@]}" --profile "$OLD" rm -f "api_${OLD}" 2>/dev/null || true

echo "$NEW" >"$COLOR_FILE"
echo "==> Deploy complete. Active color: $NEW"
