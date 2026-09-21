#!/usr/bin/env bash
# Invoked by GitHub Actions over SSH after git reset --hard.
set -euo pipefail

cd /opt/hydrorage

echo "==> normalizing deploy/*.sh"
for f in deploy/*.sh; do
  [ -f "$f" ] || continue
  sed -i 's/\r$//' "$f" || true
  chmod +x "$f" || true
  echo "    $f"
done

echo "==> checking .env"
if [ ! -f .env ]; then
  echo "ERROR: missing /opt/hydrorage/.env — copy from .env.prod.example and fill secrets" >&2
  ls -la /opt/hydrorage | head -40 >&2
  exit 1
fi

if [ -f ACTIVE_COLOR ]; then
  ACTIVE="$(tr -d '[:space:]\r' < ACTIVE_COLOR)"
  echo "==> zero-downtime (active=${ACTIVE})"
  bash deploy/zero-downtime.sh local
else
  echo "==> bootstrap"
  bash deploy/bootstrap.sh local
fi

echo "==> wire into ttengamesstudio-nginx edge"
bash deploy/install-into-edge-nginx.sh || echo "WARN: edge wire failed — run manually"

echo "==> smoke"
curl -sS -o /dev/null -w "local9080:%{http_code}\n" -H 'Host: hydrorage.com.tr' http://127.0.0.1:9080/ || true
curl -sS -o /dev/null -w "local9080-api:%{http_code}\n" -H 'Host: api.hydrorage.com.tr' http://127.0.0.1:9080/api/health || true
curl -sS -o /dev/null -w "edge80:%{http_code}\n" -H 'Host: hydrorage.com.tr' http://127.0.0.1/ || true
curl -sS -o /dev/null -w "edge80-api:%{http_code}\n" -H 'Host: api.hydrorage.com.tr' http://127.0.0.1/api/health || true

echo "==> done"
