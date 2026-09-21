-- Onboarding tamamlandı bayrağı (mevcut kullanıcılar tamamlanmış sayılır)
ALTER TABLE "UserSettings"
  ADD COLUMN IF NOT EXISTS "onboardingCompleted" boolean NOT NULL DEFAULT true;
