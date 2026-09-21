#!/usr/bin/env bash
# DEPRECATED on this VPS — :80/:443 are owned by ttengamesstudio-nginx (Docker).
# Use: bash deploy/install-into-edge-nginx.sh
set -euo pipefail

echo "ERROR: install-host-nginx.sh is for a dedicated host nginx." >&2
echo "       On this shared VPS run instead:" >&2
echo "         bash /opt/hydrorage/deploy/install-into-edge-nginx.sh" >&2
echo "       Do NOT systemctl start/restart nginx — it fights Docker for :80/:443." >&2
exit 1
