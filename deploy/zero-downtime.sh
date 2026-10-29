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
# Bind mounts update on disk, but pgbouncer only reads auth at start — must recreate.
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" up -d --force-recreate --no-deps pgbouncer
for i in $(seq 1 30); do
  if "${COMPOSE[@]}" exec -T pgbouncer pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "==> preflight: Postgres password must match .env (volume keeps first-init password)"
strip_q() {
  local v="$1"
  v="${v%$'\r'}"
  if [[ "${v}" == \"*\" && "${v}" == *\" ]]; then v="${v:1:-1}"; fi
  if [[ "${v}" == \'*\' && "${v}" == *\' ]]; then v="${v:1:-1}"; fi
  printf '%s' "$v"
}
POSTGRES_USER="hydrorage"
POSTGRES_PASSWORD=""
POSTGRES_DB="hydrorage"
DATABASE_URL=""
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%$'\r'}"
  case "$line" in
    POSTGRES_USER=*) POSTGRES_USER="$(strip_q "${line#POSTGRES_USER=}")" ;;
    POSTGRES_PASSWORD=*) POSTGRES_PASSWORD="$(strip_q "${line#POSTGRES_PASSWORD=}")" ;;
    POSTGRES_DB=*) POSTGRES_DB="$(strip_q "${line#POSTGRES_DB=}")" ;;
    DATABASE_URL=*) DATABASE_URL="$(strip_q "${line#DATABASE_URL=}")" ;;
  esac
done <"$ENV_FILE"
if [[ -z "$POSTGRES_PASSWORD" ]]; then
  echo "ERROR: POSTGRES_PASSWORD empty in $ENV_FILE" >&2
  exit 1
fi
if ! "${COMPOSE[@]}" exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres \
  psql -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c 'SELECT 1' >/dev/null 2>&1; then
  echo "ERROR: POSTGRES_PASSWORD in .env does not match the live postgres volume." >&2
  echo "  Fix (keep data) — socket auth inside postgres ignores password:" >&2
  echo "    docker compose -f $COMPOSE_FILE --env-file $ENV_FILE exec postgres \\" >&2
  echo "      psql -U $POSTGRES_USER -d $POSTGRES_DB -c \"ALTER USER $POSTGRES_USER WITH PASSWORD 'YOUR_.ENV_PASSWORD';\"" >&2
  echo "  Then re-run deploy (sync-pgbouncer + recreate pgbouncer)." >&2
  exit 1
fi
echo "    postgres TCP auth OK"
if [[ -n "$DATABASE_URL" ]]; then
  # postgresql://user:password@host/...  (password must match POSTGRES_PASSWORD; URL-encode special chars)
  DBURL_PASS="$(printf '%s' "$DATABASE_URL" | sed -n 's|^[a-zA-Z][a-zA-Z0-9+.-]*://[^:/@]*:\([^@]*\)@.*|\1|p')"
  if [[ -n "$DBURL_PASS" && "$DBURL_PASS" != "$POSTGRES_PASSWORD" ]]; then
    echo "ERROR: DATABASE_URL password != POSTGRES_PASSWORD (api will fail auth)." >&2
    echo "  Keep them identical in .env (and URL-encode reserved chars in DATABASE_URL)." >&2
    exit 1
  fi
  echo "    DATABASE_URL password matches POSTGRES_PASSWORD"
fi

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

IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" up -d --no-build --force-recreate web admin
IMAGE_TAG="$IMAGE_TAG" "${COMPOSE[@]}" up -d --no-build nginx

NGINX_CID="$("${COMPOSE[@]}" ps -q nginx)"
docker exec "$NGINX_CID" nginx -s reload

echo "==> Stopping api_${OLD} (if running)"
"${COMPOSE[@]}" --profile "$OLD" stop "api_${OLD}" 2>/dev/null || true
"${COMPOSE[@]}" --profile "$OLD" rm -f "api_${OLD}" 2>/dev/null || true

echo "$NEW" >"$COLOR_FILE"
echo "==> Deploy complete. Active color: $NEW"
