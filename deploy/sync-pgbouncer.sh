#!/usr/bin/env bash
# Sync docker/pgbouncer/{pgbouncer.ini,userlist.txt} from .env POSTGRES_* values.
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-/opt/hydrorage}"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
OUT_DIR="${OUT_DIR:-$ROOT_DIR/docker/pgbouncer}"

cd "$ROOT_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: missing $ENV_FILE" >&2
  exit 1
fi

POSTGRES_USER="hydrorage"
POSTGRES_PASSWORD=""
POSTGRES_DB="hydrorage"

while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%$'\r'}"
  case "$line" in
    POSTGRES_USER=*) POSTGRES_USER="${line#POSTGRES_USER=}" ;;
    POSTGRES_PASSWORD=*) POSTGRES_PASSWORD="${line#POSTGRES_PASSWORD=}" ;;
    POSTGRES_DB=*) POSTGRES_DB="${line#POSTGRES_DB=}" ;;
  esac
done <"$ENV_FILE"

# strip optional surrounding quotes
strip_q() {
  local v="$1"
  if [[ "${v}" == \"*\" && "${v}" == *\" ]]; then v="${v:1:-1}"; fi
  if [[ "${v}" == \'*\' && "${v}" == *\' ]]; then v="${v:1:-1}"; fi
  printf '%s' "$v"
}

POSTGRES_USER="$(strip_q "$POSTGRES_USER")"
POSTGRES_PASSWORD="$(strip_q "$POSTGRES_PASSWORD")"
POSTGRES_DB="$(strip_q "$POSTGRES_DB")"

if [[ -z "$POSTGRES_PASSWORD" ]]; then
  echo "ERROR: POSTGRES_PASSWORD empty in $ENV_FILE" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

cat >"$OUT_DIR/pgbouncer.ini" <<EOF
[databases]
${POSTGRES_DB} = host=postgres port=5432 user=${POSTGRES_USER} password=${POSTGRES_PASSWORD}

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 5432
unix_socket_dir =
auth_type = plain
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 200
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
ignore_startup_parameters = extra_float_digits
admin_users = ${POSTGRES_USER}
server_tls_sslmode = disable
EOF

printf '"%s" "%s"\n' "$POSTGRES_USER" "$POSTGRES_PASSWORD" >"$OUT_DIR/userlist.txt"

echo "==> pgbouncer synced for user=${POSTGRES_USER} db=${POSTGRES_DB}"
