-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DrinkType" AS ENUM ('WATER', 'BOTTLE', 'COFFEE', 'TEA', 'ELECTROLYTE', 'SODA', 'ALCOHOL', 'PROTEIN', 'MEDICINE', 'ENERGY', 'MINERAL', 'ESPRESSO', 'FILTER_COFFEE');

-- CreateEnum
CREATE TYPE "ProfanityLevel" AS ENUM ('MOCKING', 'NEIGHBORHOOD', 'MILITARY', 'UNFILTERED');

-- CreateEnum
CREATE TYPE "PunishmentIntensity" AS ENUM ('LIGHT', 'HARD', 'SIREN');

-- CreateEnum
CREATE TYPE "RoutineKind" AS ENUM ('INTERVAL', 'SPECIFIC_TIMES');

-- CreateEnum
CREATE TYPE "ThreatStatus" AS ENUM ('PENDING', 'PLAYED', 'COMPLETED', 'MISSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "dailyGoalMl" INTEGER NOT NULL DEFAULT 2500,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastGoalDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voiceNotifications" BOOLEAN NOT NULL DEFAULT true,
    "profanityLevel" "ProfanityLevel" NOT NULL DEFAULT 'UNFILTERED',
    "activeCharacterId" TEXT,
    "officeMute" BOOLEAN NOT NULL DEFAULT true,
    "nightMode" BOOLEAN NOT NULL DEFAULT true,
    "nightStartHour" INTEGER NOT NULL DEFAULT 23,
    "nightEndHour" INTEGER NOT NULL DEFAULT 8,
    "remindWater" BOOLEAN NOT NULL DEFAULT true,
    "remindCaffeine" BOOLEAN NOT NULL DEFAULT true,
    "remindMedicine" BOOLEAN NOT NULL DEFAULT true,
    "remindElectrolyte" BOOLEAN NOT NULL DEFAULT false,
    "remindWalk" BOOLEAN NOT NULL DEFAULT true,
    "waterIntervalMinutes" INTEGER NOT NULL DEFAULT 45,
    "publicShameProtection" BOOLEAN NOT NULL DEFAULT true,
    "whisperVolume" INTEGER NOT NULL DEFAULT 45,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "badge" TEXT,
    "maxDb" INTEGER NOT NULL DEFAULT 96,
    "dosageLabel" TEXT NOT NULL DEFAULT 'Ölümcül',
    "recordingCount" INTEGER NOT NULL DEFAULT 42,
    "unlockStreakDays" INTEGER NOT NULL DEFAULT 0,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreatTemplate" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "profanityLevel" "ProfanityLevel" NOT NULL DEFAULT 'NEIGHBORHOOD',
    "characterId" TEXT,
    "userId" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThreatTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intake" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DrinkType" NOT NULL,
    "label" TEXT NOT NULL,
    "amountMl" INTEGER NOT NULL,
    "penaltyMl" INTEGER NOT NULL DEFAULT 0,
    "netMl" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Intake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreatEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "characterId" TEXT,
    "message" TEXT NOT NULL,
    "status" "ThreatStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "playedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreatEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Routine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "drinkType" "DrinkType" NOT NULL DEFAULT 'WATER',
    "amountMl" INTEGER NOT NULL DEFAULT 350,
    "kind" "RoutineKind" NOT NULL DEFAULT 'SPECIFIC_TIMES',
    "intervalMinutes" INTEGER,
    "specificTimes" TEXT[],
    "intensity" "PunishmentIntensity" NOT NULL DEFAULT 'HARD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineLog" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plannedAt" TIMESTAMP(3) NOT NULL,
    "status" "ThreatStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoutineLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Character_slug_key" ON "Character"("slug");

-- CreateIndex
CREATE INDEX "Intake_userId_createdAt_idx" ON "Intake"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ThreatEvent_userId_scheduledAt_idx" ON "ThreatEvent"("userId", "scheduledAt");

-- CreateIndex
CREATE INDEX "RoutineLog_userId_plannedAt_idx" ON "RoutineLog"("userId", "plannedAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_activeCharacterId_fkey" FOREIGN KEY ("activeCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreatTemplate" ADD CONSTRAINT "ThreatTemplate_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreatTemplate" ADD CONSTRAINT "ThreatTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intake" ADD CONSTRAINT "Intake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreatEvent" ADD CONSTRAINT "ThreatEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreatEvent" ADD CONSTRAINT "ThreatEvent_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ThreatTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreatEvent" ADD CONSTRAINT "ThreatEvent_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineLog" ADD CONSTRAINT "RoutineLog_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineLog" ADD CONSTRAINT "RoutineLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

