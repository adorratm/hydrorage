-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'APPLE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "provider" "AuthProvider";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "providerId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Backfill legacy email/password rows (if any) so NOT NULL constraints can apply
UPDATE "User"
SET
  "provider" = 'GOOGLE',
  "providerId" = COALESCE("providerId", 'legacy:' || "id")
WHERE "provider" IS NULL OR "providerId" IS NULL;

ALTER TABLE "User" ALTER COLUMN "provider" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "providerId" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_provider_providerId_key" ON "User"("provider", "providerId");
