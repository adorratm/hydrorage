# Production deploy (VPS + GitHub Actions + Cloudflare)

## Nasıl çalışır? (GHCR yok)

Eski alışkanlığına yakın akış:

1. `main`’e push
2. GitHub Actions sunucuya SSH açar
3. `git pull` + **sunucuda** `docker compose build`
4. Blue/green ile zero-downtime switch

**Repo public** olması yeterli (git için).  
**GHCR** (GitHub Container Registry) artık deploy için **gerekmiyor**.  
(Repo public ≠ GHCR paket public; o yüzden önceki `denied` hatası oluşuyordu.)

| Host | Service |
|---|---|
| `https://hydrorage.com.tr` | Landing |
| `https://admin.hydrorage.com.tr` | Admin |
| `https://api.hydrorage.com.tr` | API |

Node **26.9.0** · Yarn **4.18.0**.

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

`GHCR_TOKEN` / `GHCR_USERNAME` **gerekmez**.

## Sunucu bootstrap (bir kez)

```bash
cd /opt/hydrorage   # git clone ile
cp .env.prod.example .env
# .env düzenle (POSTGRES_PASSWORD, JWT, …)
# pgbouncer ini/userlist şifrelerini eşleştir

chmod +x deploy/*.sh
./deploy/bootstrap.sh local          # ilk build (uzun sürebilir)
sudo ./deploy/install-host-nginx.sh  # sadece hydrorage vhost
```

Sonraki deploy’lar: `main` push → Actions otomatik.

Manuel:
```bash
cd /opt/hydrorage && git pull && ./deploy/zero-downtime.sh local
```

## Cloudflare

`hydrorage.com.tr` / `api` / `admin` → aynı VPS, Proxy ON.  
Diğer domain DNS’lerine dokunma.

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — PR’da typecheck/build (doğrulama).  
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) — `main` → SSH deploy.

## Next: iOS / Android

EAS Build ayrı adım; API: `https://api.hydrorage.com.tr/api`.
