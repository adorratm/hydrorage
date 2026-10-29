#!/usr/bin/env bash
# Align live Postgres role password + PgBouncer with .env POSTGRES_*.
# Docker only applies POSTGRES_PASSWORD on first volume init — later .env edits
# leave the role password stale and Nest dies with "password authentication failed".
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/opt/hydrorage}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"

cd "$ROOT_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: missing $ENV_FILE" >&2
  exit 1
fi

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
DIRECT_URL=""

while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%$'\r'}"
  case "$line" in
    POSTGRES_USER=*) POSTGRES_USER="$(strip_q "${line#POSTGRES_USER=}")" ;;
    POSTGRES_PASSWORD=*) POSTGRES_PASSWORD="$(strip_q "${line#POSTGRES_PASSWORD=}")" ;;
    POSTGRES_DB=*) POSTGRES_DB="$(strip_q "${line#POSTGRES_DB=}")" ;;
    DATABASE_URL=*) DATABASE_URL="$(strip_q "${line#DATABASE_URL=}")" ;;
    DIRECT_URL=*) DIRECT_URL="$(strip_q "${line#DIRECT_URL=}")" ;;
  esac
done <"$ENV_FILE"

if [[ -z "$POSTGRES_PASSWORD" ]]; then
  echo "ERROR: POSTGRES_PASSWORD empty in $ENV_FILE" >&2
  exit 1
fi
if [[ ! "$POSTGRES_USER" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
  echo "ERROR: unsafe POSTGRES_USER=$POSTGRES_USER" >&2
  exit 1
fi

url_pass() {
  # postgresql://user:password@host/...
  printf '%s' "$1" | sed -n 's|^[a-zA-Z][a-zA-Z0-9+.-]*://[^:/@]*:\([^@]*\)@.*|\1|p'
}

check_url_password() {
  local name="$1" url="$2"
  [[ -z "$url" ]] && return 0
  local pass
  pass="$(url_pass "$url")"
  if [[ -z "$pass" ]]; then
    echo "ERROR: cannot parse password from $name" >&2
    exit 1
  fi
  # Compare decoded form when python is available (handles %XX in URL)
  local decoded="$pass"
  if command -v python3 >/dev/null 2>&1; then
    decoded="$(PASSWORD_RAW="$pass" python3 -c 'import os,urllib.parse;print(urllib.parse.unquote(os.environ["PASSWORD_RAW"]))')"
  fi
  if [[ "$decoded" != "$POSTGRES_PASSWORD" && "$pass" != "$POSTGRES_PASSWORD" ]]; then
    echo "ERROR: $name password != POSTGRES_PASSWORD" >&2
    echo "  Fix .env so $name uses the same password as POSTGRES_PASSWORD" >&2
    echo "  (URL-encode reserved characters: @ # : / ? % in the URL form)." >&2
    exit 1
  fi
}

check_url_password DATABASE_URL "$DATABASE_URL"
check_url_password DIRECT_URL "$DIRECT_URL"

COMPOSE=(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE")

echo "==> ensure postgres is up"
"${COMPOSE[@]}" up -d postgres
for i in $(seq 1 40); do
  if "${COMPOSE[@]}" exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Local socket inside the container uses trust/peer — no old password required.
SQL_PASS="${POSTGRES_PASSWORD//\'/\'\'}"
echo "==> ALTER USER ${POSTGRES_USER} password ← .env POSTGRES_PASSWORD"
"${COMPOSE[@]}" exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
  -c "ALTER USER ${POSTGRES_USER} WITH PASSWORD '${SQL_PASS}';"

echo "==> sync pgbouncer ini/userlist from .env"
bash "$ROOT_DIR/deploy/sync-pgbouncer.sh"

echo "==> recreate pgbouncer (auth_file loaded only at start)"
IMAGE_TAG="${IMAGE_TAG:-local}" "${COMPOSE[@]}" up -d --force-recreate --no-deps pgbouncer
for i in $(seq 1 30); do
  if "${COMPOSE[@]}" exec -T pgbouncer pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "==> verify TCP auth with .env password"
if ! "${COMPOSE[@]}" exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres \
  psql -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c 'SELECT 1' >/dev/null; then
  echo "ERROR: TCP auth still failing after ALTER USER" >&2
  exit 1
fi

echo "==> db auth synced (postgres + pgbouncer)"
