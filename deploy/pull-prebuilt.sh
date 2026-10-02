#!/usr/bin/env bash
# Pull CI-built images from GHCR and retag to names used by docker-compose.prod.yml.
# VPS never compiles Nest/Vite — protects shared nginx and sibling sites (502).
set -euo pipefail

TAG="${IMAGE_TAG:?IMAGE_TAG required (git sha)}"
PREFIX="${HYDRORAGE_IMAGE_PREFIX:-ghcr.io/adorratm/hydrorage}"

SERVICES=(api web admin)

echo "==> Pull prebuilt images (tag=$TAG prefix=$PREFIX)"

for svc in "${SERVICES[@]}"; do
  remote="${PREFIX}/${svc}:${TAG}"
  local_img="hydrorage-${svc}"
  echo "--> $remote"
  docker pull "$remote"
  docker tag "$remote" "${local_img}:${TAG}"
  docker tag "$remote" "${local_img}:latest"
  echo "    tagged ${local_img}:${TAG}"
done

echo "==> Prebuilt images ready (no on-server yarn/vite build)"
