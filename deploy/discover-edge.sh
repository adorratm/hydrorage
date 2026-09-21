#!/usr/bin/env bash
# Discover how :80/:443 are served on this shared VPS (Docker vs systemd).
set -euo pipefail

echo "==> systemd nginx?"
systemctl is-active nginx 2>/dev/null || echo "inactive"

echo ""
echo "==> who owns :80 / :443?"
ss -tlnp 2>/dev/null | grep -E ':80 |:443 ' || netstat -tlnp 2>/dev/null | grep -E ':80 |:443 '

echo ""
echo "==> docker containers publishing 80/443"
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}' | head -1
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}' | grep -E '80|443' || echo "(none matched)"

echo ""
echo "==> all docker compose projects (names)"
docker ps -a --format '{{.Names}}' | sed 's/-1$//' | sed 's/_[0-9]*$//' | sort -u | head -40

echo ""
echo "==> hydrorage docker edge"
curl -sI -H 'Host: hydrorage.com.tr' http://127.0.0.1:9080/ | head -3 || echo "9080 down"

echo ""
echo "Next: find the reverse-proxy container for ttengamesstudio and add a"
echo "server_name hydrorage.com.tr → http://127.0.0.1:9080 block THERE"
echo "(not via systemctl nginx — that service is unused on this host)."
