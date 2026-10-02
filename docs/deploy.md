# Production deploy (VPS + GitHub Actions + Cloudflare)

## Nasıl çalışır? (CI → GHCR → VPS pull)

Paylaşımlı Hetzner VPS’te sibling siteleri korumak için:

1. `main`’e push
2. GitHub Actions **runner’da** api/web/admin image build eder → GHCR’a push
3. SSH ile sunucuda **sadece** `docker pull` + blue/green switch (`HYDRORAGE_USE_REGISTRY=1`)
4. VPS’te Next/Vite/Nest **build edilmez** (aksi halde diğer sitelerde 502)

| Host | Service |
|---|---|
| `https://hydrorage.com.tr` | Landing |
| `https://admin.hydrorage.com.tr` | Admin |
| `https://api.hydrorage.com.tr` | API |

Node **26.10.0** · Yarn **4.18.1**.

## Shared VPS edge = `ttengamesstudio-nginx`

On this server **:80/:443** are owned by Docker container `ttengamesstudio-nginx` (not systemd nginx).

HydroRage listens on `127.0.0.1:9080` (host curls). Wire into TTEN once:

```bash
cd /opt/hydrorage && git pull
bash deploy/install-into-edge-nginx.sh
```

Connects `hydrorage-nginx-1` to the TTEN Docker network and proxies `hydrorage.*` → `hydrorage-nginx-1:80` (not `172.17.0.1:9080` — that 502s with loopback bind). TTEN / portfolio / kiliccoffee stay untouched.

Do **not** `systemctl start nginx` — it fights Docker for ports 80/443.

## GitHub Secrets (`production` environment)

Sadece bunlar:

| Secret | Purpose |
|---|---|
| `DEPLOY_HOST` | VPS IP |
| `DEPLOY_USER` | SSH kullanıcı |
| `DEPLOY_SSH_KEY` | Private key |

`GITHUB_TOKEN` (Actions) GHCR push/pull için yeterli (`packages: write`).  
İlk GHCR push sonrası paketlerin visibility’sini org/repo ile hizalayın (private OK).

## Sunucu bootstrap (bir kez)

```bash
cd /opt/hydrorage   # git clone ile
cp .env.prod.example .env
# .env düzenle (POSTGRES_PASSWORD, JWT, …)
# pgbouncer ini/userlist şifrelerini eşleştir

chmod +x deploy/*.sh
# Tercihen: ilk image’ları CI’den çekip bootstrap
# export IMAGE_TAG=<sha> HYDRORAGE_USE_REGISTRY=1
# bash deploy/pull-prebuilt.sh && bash deploy/bootstrap.sh "$IMAGE_TAG"
# Acil lokal (diğer siteleri düşürebilir):
./deploy/bootstrap.sh local
bash deploy/install-into-edge-nginx.sh
```

Sonraki deploy’lar: `main` push → Actions otomatik (GHCR pull).

Manuel (registry):
```bash
cd /opt/hydrorage && git pull
export IMAGE_TAG=<sha> HYDRORAGE_USE_REGISTRY=1 HYDRORAGE_IMAGE_PREFIX=ghcr.io/<owner>/hydrorage
bash deploy/gha-remote.sh
```
## Cloudflare

`hydrorage.com.tr` / `api` / `admin` → aynı VPS, Proxy ON.  
Diğer domain DNS’lerine dokunma.

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — PR’da typecheck/build (doğrulama).  
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) — `main` → SSH deploy.

## Next: iOS / Android

EAS Build ayrı adım; API: `https://api.hydrorage.com.tr/api`.
