-- +18 / güvenli mod: küfürsüz SAFE şablon seviyesi + kullanıcı tercihi
ALTER TYPE "ProfanityLevel" ADD VALUE IF NOT EXISTS 'SAFE';

ALTER TABLE "UserSettings"
  ADD COLUMN IF NOT EXISTS "plus18Mode" boolean NOT NULL DEFAULT true;
