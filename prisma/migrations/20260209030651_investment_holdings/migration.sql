-- CreateEnum
CREATE TYPE "InvestmentAssetKind" AS ENUM ('STOCK', 'ETF', 'BOND', 'FUND', 'CRYPTO', 'PENSION', 'CASH', 'OTHER');

-- AlterTable
ALTER TABLE "InvestmentPlan" ADD COLUMN     "annualInterestPct" DOUBLE PRECISION,
ADD COLUMN     "currentValue" INTEGER;

-- CreateTable
CREATE TABLE "InvestmentHolding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT,
    "kind" "InvestmentAssetKind" NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "provider" TEXT,
    "providerId" TEXT,
    "quantity" DECIMAL(24,8) NOT NULL,
    "costBasis" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentHolding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentContribution" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestmentContribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvestmentHolding_userId_idx" ON "InvestmentHolding"("userId");

-- CreateIndex
CREATE INDEX "InvestmentHolding_planId_idx" ON "InvestmentHolding"("planId");

-- CreateIndex
CREATE INDEX "InvestmentContribution_userId_date_idx" ON "InvestmentContribution"("userId", "date");

-- CreateIndex
CREATE INDEX "InvestmentContribution_planId_date_idx" ON "InvestmentContribution"("planId", "date");

-- AddForeignKey
ALTER TABLE "InvestmentHolding" ADD CONSTRAINT "InvestmentHolding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentHolding" ADD CONSTRAINT "InvestmentHolding_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InvestmentPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentContribution" ADD CONSTRAINT "InvestmentContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentContribution" ADD CONSTRAINT "InvestmentContribution_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InvestmentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
