#!/usr/bin/env bash
# Invoked by GitHub Actions over SSH after git reset --hard.
# Prefer registry images (HYDRORAGE_USE_REGISTRY=1); never build on VPS when set.
set -euo pipefail

cd /opt/hydrorage

DEPLOY_LOCK="${DEPLOY_LOCK:-/var/lock/hetzner-site-deploy.lock}"
mkdir -p "$(dirname "$DEPLOY_LOCK")"
exec 9>"$DEPLOY_LOCK"
echo "==> waiting for shared deploy lock ($DEPLOY_LOCK)"
if ! flock -w 3600 9; then
  echo "ERROR: another site deploy still holds $DEPLOY_LOCK" >&2
  exit 1
fi
echo "==> acquired deploy lock"

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

IMAGE_TAG="${IMAGE_TAG:-local}"
export IMAGE_TAG
export HYDRORAGE_IMAGE_PREFIX="${HYDRORAGE_IMAGE_PREFIX:-ghcr.io/adorratm/hydrorage}"

if [[ "${HYDRORAGE_USE_REGISTRY:-0}" == "1" ]]; then
  echo "==> registry mode (pull only, no VPS build)"
  bash deploy/pull-prebuilt.sh
fi

if [ -f ACTIVE_COLOR ]; then
  ACTIVE="$(tr -d '[:space:]\r' < ACTIVE_COLOR)"
  echo "==> zero-downtime (active=${ACTIVE} tag=${IMAGE_TAG})"
  bash deploy/zero-downtime.sh "$IMAGE_TAG"
else
  echo "==> bootstrap (tag=${IMAGE_TAG})"
  bash deploy/bootstrap.sh "$IMAGE_TAG"
fi

echo "==> wire into ttengamesstudio-nginx edge"
bash deploy/install-into-edge-nginx.sh || echo "WARN: edge wire failed — run manually"

echo "==> smoke"
curl -sS -o /dev/null -w "local9080:%{http_code}\n" -H 'Host: hydrorage.com.tr' http://127.0.0.1:9080/ || true
curl -sS -o /dev/null -w "local9080-api:%{http_code}\n" -H 'Host: api.hydrorage.com.tr' http://127.0.0.1:9080/api/health || true
curl -sS -o /dev/null -w "edge80:%{http_code}\n" -H 'Host: hydrorage.com.tr' http://127.0.0.1/ || true
curl -sS -o /dev/null -w "edge80-api:%{http_code}\n" -H 'Host: api.hydrorage.com.tr' http://127.0.0.1/api/health || true

echo "==> done"
