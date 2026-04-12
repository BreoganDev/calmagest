import type { Month, MonthFixedExpense, Expense } from '@prisma/client';

export function calcMonthTotals(
  month: Month,
  fixed: MonthFixedExpense[],
  expenses: Expense[]
) {
  const fixedTotal = fixed
    .filter((f) => f.active)
    .reduce((acc, f) => acc + Math.abs(f.amount), 0);
  const variableTotal = expenses.reduce((acc, e) => acc + Math.abs(e.amount), 0);
  const spent = fixedTotal + variableTotal;
  const base = Math.max(month.income, month.budget) + month.carryOver;
  const remaining = base - spent;
  const percent = base > 0 ? Math.min(100, Math.round((spent / base) * 100)) : 0;

  return { fixedTotal, variableTotal, spent, remaining, percent };
}
