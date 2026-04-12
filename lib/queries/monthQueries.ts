import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { calcMonthTotals } from '@/lib/services/calcService';
import { resolveYearMonth } from '@/lib/services/monthService';

export const findCurrentMonth = cache(async (userId: string, timezone: string) => {
  const yearMonth = resolveYearMonth(undefined, timezone);
  return prisma.month.findUnique({
    where: { userId_yearMonth: { userId, yearMonth } }
  });
});

const findMonthByYearMonth = cache(async (userId: string, yearMonth: string) => {
  return prisma.month.findUnique({
    where: { userId_yearMonth: { userId, yearMonth } }
  });
});

export async function getOrCreateMonthByYearMonth(userId: string, timezone: string, yearMonthInput?: string) {
  const yearMonth = resolveYearMonth(yearMonthInput, timezone);
  let month = await findMonthByYearMonth(userId, yearMonth);

  if (!month) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { defaultBudget: true, defaultIncome: true }
    });

    const previousMonth = await prisma.month.findFirst({
      where: { userId, yearMonth: { lt: yearMonth } },
      orderBy: { yearMonth: 'desc' }
    });

    let carryOver = 0;
    let budget = user?.defaultBudget ?? 0;
    let income = user?.defaultIncome ?? 0;

    if (previousMonth) {
      const [previousFixed, previousExpenses] = await Promise.all([
        prisma.monthFixedExpense.findMany({ where: { monthId: previousMonth.id } }),
        prisma.expense.findMany({ where: { monthId: previousMonth.id } })
      ]);
      const { remaining } = calcMonthTotals(previousMonth, previousFixed, previousExpenses);
      carryOver = Math.max(0, remaining);
      budget = previousMonth.budget;
      income = previousMonth.income;
    }

    try {
      month = await prisma.month.create({
        data: {
          userId,
          yearMonth,
          carryOver,
          budget,
          income
        }
      });
    } catch {
      month = await prisma.month.findUnique({
        where: { userId_yearMonth: { userId, yearMonth } }
      });
    }

    if (!month) {
      throw new Error('Failed to initialize month');
    }
    const initializedMonth = month;

    const fixedTemplates = await prisma.fixedExpense.findMany({
      where: { userId, active: true }
    });

    if (fixedTemplates.length) {
      await prisma.monthFixedExpense.createMany({
        data: fixedTemplates.map((item) => ({
          userId,
          monthId: initializedMonth.id,
          name: item.name,
          amount: item.amount,
          category: item.category,
          dayOfMonth: item.dayOfMonth,
          active: item.active
        }))
      });
    }
  }

  return month;
}

export async function ensureCurrentMonth(userId: string, timezone: string) {
  return getOrCreateMonthByYearMonth(userId, timezone);
}

export const getOrCreateCurrentMonth = ensureCurrentMonth;
