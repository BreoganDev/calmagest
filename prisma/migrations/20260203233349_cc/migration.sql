-- CreateTable
CREATE TABLE "FixedBudget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "limitAmount" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixedBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FixedBudget_userId_idx" ON "FixedBudget"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FixedBudget_userId_category_key" ON "FixedBudget"("userId", "category");

-- AddForeignKey
ALTER TABLE "FixedBudget" ADD CONSTRAINT "FixedBudget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
