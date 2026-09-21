-- Expo push token for server-side reminders
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "expoPushToken" text NULL;
