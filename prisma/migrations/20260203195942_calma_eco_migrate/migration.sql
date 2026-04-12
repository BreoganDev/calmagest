/*
  Warnings:

  - A unique constraint covering the columns `[userId,name]` on the table `FixedExpense` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FixedExpense_userId_name_key" ON "FixedExpense"("userId", "name");
