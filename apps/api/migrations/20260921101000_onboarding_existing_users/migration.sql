-- Mevcut hesaplar onboarding'i atlamasın diye tamamlanmış işaretle
UPDATE "UserSettings" SET "onboardingCompleted" = true WHERE "onboardingCompleted" = false;
