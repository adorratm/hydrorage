# HydroRage

Küfürlü hidrasyon takip uygulaması — Expo (iOS/Android) + NestJS 12 + PostgreSQL + web landing + admin.

## Domainler

| Yüzey | Domain | Lokal |
|---|---|---|
| Landing | https://hydrorage.com.tr | `yarn web` → `:5173` |
| Admin | https://admin.hydrorage.com.tr | `yarn admin` → `:5174` |
| API | https://api.hydrorage.com.tr | `yarn api` → `:3000` |

Cloudflare DNS (örnek):

| Tip | Ad | Hedef |
|---|---|---|
| A / CNAME | `@` | Landing host |
| CNAME | `www` | `hydrorage.com.tr` |
| CNAME | `api` | API host |
| CNAME | `admin` | Admin host |

## Gereksinimler

- [Volta](https://volta.sh) (Node **26.9.0**, Yarn **4.18.0** otomatik pinlenir)
- Docker Desktop (API + Postgres + PgBouncer + Redis)
- Expo Go veya native toolchain (iOS için macOS)

## Hızlı başlangıç

```bash
# 1) Bağımlılıklar
yarn install

# 2) Postgres + PgBouncer (+ isteğe bağlı API image)
docker compose up -d --build

# veya sadece altyapı + lokal API:
docker compose up -d postgres pgbouncer redis
yarn db:migrate
yarn db:seed
yarn api
```

| Servis | Host port | Açıklama |
|---|---|---|
| Postgres | `5434` | Direkt DB (migrate / seed / `DIRECT_URL`) · **PostgreSQL 18** |
| PgBouncer | `6433` | Connection pool (runtime `DATABASE_URL`) · host `6432` çakışmasın diye |
| Redis | `6379` | Socket.IO adapter + BullMQ (`REDIS_URL`) |
| API | `3000` | NestJS · WS `/realtime` · Bull Board `/api/admin/queues` |
| Landing | `5173` | `@hydrorage/web` |
| Admin | `5174` | `@hydrorage/admin` |

TypeORM: runtime PgBouncer (`DATABASE_URL` → `:6432`), migration/seed `DIRECT_URL` ile Postgres’e (`:5434`).

Veri katmanı: **EntityManager** (`@InjectEntityManager`) — Repository kullanılmaz.
Anlık: **Socket.IO** + **ioredis** · kuyruk: **BullMQ** · panel: **Bull Board** (`/api/admin/queues`).
SQL şema: `apps/api/migrations` · seed: `yarn db:seed`

## Auth

### Mobil
- **Google** — Android + iOS (`idToken` → `POST /api/auth/google`)
- **Apple** — yalnızca iOS (`expo-apple-authentication`)

### Web admin (OAuth redirect)
1. Admin → Google: `GET /api/auth/google/start`
2. Google → API: `GET /api/auth/google/callback`
3. API → Admin: `https://admin.hydrorage.com.tr/auth/callback?accessToken=…&refreshToken=…`

Google Cloud **Web** client redirect URI:
- Prod: `https://api.hydrorage.com.tr/api/auth/google/callback`
- Lokal: `http://localhost:3000/api/auth/google/callback`

Authorized JavaScript origins (örnek):
- `https://admin.hydrorage.com.tr`
- `https://hydrorage.com.tr`

| Env | Açıklama |
|---|---|
| `GOOGLE_CLIENT_ID_IOS` / `ANDROID` / `WEB` | ID token audience doğrulama |
| `GOOGLE_CLIENT_SECRET` | Web OAuth code exchange |
| `GOOGLE_REDIRECT_URI` | Callback URL (yukarıdaki) |
| `ADMIN_APP_URL` | Admin origin (`https://admin.hydrorage.com.tr`) |
| `LANDING_URL` | Landing (`https://hydrorage.com.tr`) |
| `ADMIN_EMAILS` | Virgülle ayrılmış allowlist (boşsa herkes) |
| `APPLE_CLIENT_ID` | Bundle id (`com.hydrorage.app`) |

E-posta/şifre kaydı yok. Google Client ID’lerini `apps/mobile/app.json` → `extra` ve `apps/api/.env` içine yaz.

## Özellikler

- Takip panosu, hızlı sıvı ekleme, azar sayacı
- İçecek / kafein cezası dengesi
- Sesli tehdit (Expo Speech TTS), küfür seviyesi, karakterler
- Kullanıcı tehdit şablonları (CRUD)
- Rutin planlayıcı + bildirimler
- Haftalık utanç karnesi + paylaşım
- Landing + admin paneli (Google OAuth)
- Landing CMS: `GET /api/landing` (public) · `PUT /api/admin/landing` (admin)

## NestJS build (Rspack)

API `@rspack/core` **≥ 2.2.4** ile derlenir (`nest build --builder rspack`).

```bash
yarn workspace @hydrorage/api build
```

```
apps/api      NestJS + TypeORM (EntityManager)
apps/mobile  Expo SDK 57
apps/web     Landing (Vite) → hydrorage.com.tr
apps/admin   Admin (Vite) → admin.hydrorage.com.tr
packages/shared  Ortak sabitler
```

Stitch tasarım kaynakları: `stitch/`
