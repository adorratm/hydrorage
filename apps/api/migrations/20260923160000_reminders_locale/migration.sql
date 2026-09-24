ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "lastAppOpenedAt" timestamptz NULL,
  ADD COLUMN IF NOT EXISTS "lastComebackAt" timestamptz NULL;

ALTER TABLE "UserSettings"
  ADD COLUMN IF NOT EXISTS "remindersEnabled" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "nagCount" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "locale" text NOT NULL DEFAULT 'tr';
