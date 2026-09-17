# HydroRage

Küfürlü hidrasyon takip uygulaması — Expo (iOS/Android) + NestJS 12 + PostgreSQL.

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
| Postgres | `5434` | Direkt DB (migrate / seed / `DIRECT_URL`) |
| PgBouncer | `6432` | Connection pool (runtime `DATABASE_URL`) |
| Redis | `6379` | Socket.IO adapter + BullMQ (`REDIS_URL`) |
| API | `3000` | NestJS · WS `/realtime` · Bull Board `/api/admin/queues` |

TypeORM: runtime PgBouncer (`DATABASE_URL` → `:6432`), migration/seed `DIRECT_URL` ile Postgres’e (`:5434`).

Veri katmanı: **EntityManager** (`@InjectEntityManager`) — Repository kullanılmaz.
Anlık: **Socket.IO** + **ioredis** · kuyruk: **BullMQ** · panel: **Bull Board** (`/api/admin/queues`).
SQL şema: `apps/api/migrations` · seed: `yarn db:seed`

## Auth

Yalnızca sosyal giriş:
- **Google** — Android + iOS
- **Apple** — yalnızca iOS (`expo-apple-authentication`)

E-posta/şifre kaydı yok. Google Client ID’lerini `apps/mobile/app.json` → `extra` ve `apps/api/.env` içine yaz.

| Env | Açıklama |
|---|---|
| `GOOGLE_CLIENT_ID_IOS` / `ANDROID` / `WEB` | ID token audience doğrulama |
| `APPLE_CLIENT_ID` | Bundle id (`com.hydrorage.app`) |

API: `POST /api/auth/google` `{ idToken }` · `POST /api/auth/apple` `{ identityToken, fullName?, email? }`

## Özellikler

- Takip panosu, hızlı sıvı ekleme, azar sayacı
- İçecek / kafein cezası dengesi
- Sesli tehdit (Expo Speech TTS), küfür seviyesi, karakterler
- Kullanıcı tehdit şablonları (CRUD)
- Rutin planlayıcı + bildirimler
- Haftalık utanç karnesi + paylaşım

## NestJS build (Rspack)

API `@rspack/core` **≥ 2.2.4** ile derlenir (`nest build --builder rspack`).

```bash
yarn workspace @hydrorage/api build
```

```
apps/api      NestJS + TypeORM (EntityManager)
apps/mobile  Expo SDK 57
packages/shared  Ortak sabitler
```

Stitch tasarım kaynakları: `stitch/`
