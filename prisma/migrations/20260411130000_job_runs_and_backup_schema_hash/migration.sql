-- Create enums for job tracking
CREATE TYPE "JobRunType" AS ENUM ('WEEKLY_SUMMARY');
CREATE TYPE "JobRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED', 'DEGRADED');
CREATE TYPE "JobRunItemStatus" AS ENUM ('SENT', 'SKIPPED', 'FAILED', 'TIMED_OUT');

-- Create job run table
CREATE TABLE "JobRun" (
  "id" TEXT NOT NULL,
  "type" "JobRunType" NOT NULL,
  "status" "JobRunStatus" NOT NULL DEFAULT 'RUNNING',
  "requestId" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "metrics" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- Create job run item table
CREATE TABLE "JobRunItem" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "userId" TEXT,
  "status" "JobRunItemStatus" NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "durationMs" INTEGER,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobRunItem_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "JobRun_type_startedAt_idx" ON "JobRun"("type", "startedAt");
CREATE INDEX "JobRun_status_startedAt_idx" ON "JobRun"("status", "startedAt");
CREATE INDEX "JobRunItem_runId_status_idx" ON "JobRunItem"("runId", "status");
CREATE INDEX "JobRunItem_userId_idx" ON "JobRunItem"("userId");

-- FKs
ALTER TABLE "JobRunItem"
ADD CONSTRAINT "JobRunItem_runId_fkey"
FOREIGN KEY ("runId") REFERENCES "JobRun"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobRunItem"
ADD CONSTRAINT "JobRunItem_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
