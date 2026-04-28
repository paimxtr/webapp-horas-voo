-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('COMMANDER', 'CREW_MEMBER');

-- CreateEnum
CREATE TYPE "FlightLogStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LimitPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "DutyScheduleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CHANGED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rank" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "unitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aircraft" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tailNumber" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aircraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlightLog" (
    "id" TEXT NOT NULL,
    "crewMemberId" TEXT NOT NULL,
    "aircraftId" TEXT NOT NULL,
    "missionTypeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "arrivalTime" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "dutyRole" TEXT NOT NULL,
    "notes" TEXT,
    "status" "FlightLogStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlightLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlightLogAttachment" (
    "id" TEXT NOT NULL,
    "flightLogId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlightLogAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HourLimit" (
    "id" TEXT NOT NULL,
    "period" "LimitPeriod" NOT NULL,
    "maxMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HourLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserHourLimit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" "LimitPeriod" NOT NULL,
    "maxMinutes" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserHourLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LimitExemption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" "LimitPeriod" NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "justification" TEXT NOT NULL,
    "grantedById" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LimitExemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DutySchedule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "DutyScheduleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DutySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DutyScheduleAssignment" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleLabel" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DutyScheduleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FlightLogAdditionalCrew" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FlightLogAdditionalCrew_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_name_key" ON "Unit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Aircraft_code_key" ON "Aircraft"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MissionType_name_key" ON "MissionType"("name");

-- CreateIndex
CREATE INDEX "FlightLog_crewMemberId_status_date_idx" ON "FlightLog"("crewMemberId", "status", "date");

-- CreateIndex
CREATE INDEX "FlightLog_status_date_idx" ON "FlightLog"("status", "date");

-- CreateIndex
CREATE INDEX "FlightLogAttachment_flightLogId_idx" ON "FlightLogAttachment"("flightLogId");

-- CreateIndex
CREATE UNIQUE INDEX "HourLimit_period_key" ON "HourLimit"("period");

-- CreateIndex
CREATE INDEX "UserHourLimit_userId_idx" ON "UserHourLimit"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserHourLimit_userId_period_key" ON "UserHourLimit"("userId", "period");

-- CreateIndex
CREATE INDEX "LimitExemption_userId_validUntil_idx" ON "LimitExemption"("userId", "validUntil");

-- CreateIndex
CREATE INDEX "DutySchedule_status_startAt_idx" ON "DutySchedule"("status", "startAt");

-- CreateIndex
CREATE INDEX "DutyScheduleAssignment_userId_idx" ON "DutyScheduleAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DutyScheduleAssignment_scheduleId_userId_key" ON "DutyScheduleAssignment"("scheduleId", "userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "_FlightLogAdditionalCrew_B_index" ON "_FlightLogAdditionalCrew"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightLog" ADD CONSTRAINT "FlightLog_aircraftId_fkey" FOREIGN KEY ("aircraftId") REFERENCES "Aircraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightLog" ADD CONSTRAINT "FlightLog_crewMemberId_fkey" FOREIGN KEY ("crewMemberId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightLog" ADD CONSTRAINT "FlightLog_missionTypeId_fkey" FOREIGN KEY ("missionTypeId") REFERENCES "MissionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightLog" ADD CONSTRAINT "FlightLog_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightLogAttachment" ADD CONSTRAINT "FlightLogAttachment_flightLogId_fkey" FOREIGN KEY ("flightLogId") REFERENCES "FlightLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHourLimit" ADD CONSTRAINT "UserHourLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LimitExemption" ADD CONSTRAINT "LimitExemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LimitExemption" ADD CONSTRAINT "LimitExemption_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyScheduleAssignment" ADD CONSTRAINT "DutyScheduleAssignment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "DutySchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DutyScheduleAssignment" ADD CONSTRAINT "DutyScheduleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FlightLogAdditionalCrew" ADD CONSTRAINT "_FlightLogAdditionalCrew_A_fkey" FOREIGN KEY ("A") REFERENCES "FlightLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FlightLogAdditionalCrew" ADD CONSTRAINT "_FlightLogAdditionalCrew_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

