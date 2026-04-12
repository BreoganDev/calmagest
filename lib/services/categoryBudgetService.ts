import { prisma } from '@/lib/prisma';
import { PREDEFINED_CATEGORIES } from '@/lib/catalogs/categories';
import { normalizeCategory } from '@/lib/services/textService';

type CategoryExpenseItem = {
  id: string;
  name: string;
  amount: number;
  date: Date;
  type: 'variable' | 'fijo';
};

async function getMonthCategorySnapshot(userId: string, yearMonth: string) {
  const month = await prisma.month.findUnique({
    where: {
      userId_yearMonth: {
        userId,
        yearMonth
      }
    },
    include: {
      expenses: {
        orderBy: {
          date: 'desc'
        }
      },
      fixedSnapshots: {
        where: {
          active: true
        }
      }
    }
  });

  if (!month) return null;

  const grouped = new Map<string, { label: string; spent: number; expenses: CategoryExpenseItem[] }>();

  for (const expense of month.expenses) {
    const label = expense.category?.trim() || 'Variable';
    const key = normalizeCategory(label);
    const current = grouped.get(key) ?? { label, spent: 0, expenses: [] };
    current.spent += expense.amount;
    current.expenses.push({
      id: expense.id,
      name: expense.name,
      amount: expense.amount,
      date: expense.date,
      type: 'variable'
    });
    grouped.set(key, current);
  }

  for (const fixed of month.fixedSnapshots) {
    const label = fixed.category?.trim() || 'Fijos';
    const key = normalizeCategory(label);
    const current = grouped.get(key) ?? { label, spent: 0, expenses: [] };
    current.spent += fixed.amount;
    current.expenses.push({
      id: fixed.id,
      name: fixed.name,
      amount: fixed.amount,
      date: new Date(`${yearMonth}-${String(fixed.dayOfMonth || 1).padStart(2, '0')}`),
      type: 'fijo'
    });
    grouped.set(key, current);
  }

  for (const entry of grouped.values()) {
    entry.expenses.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  return grouped;
}

export async function getCategoryBudget(userId: string, category: string, yearMonth: string) {
  return prisma.categoryBudget.findUnique({
    where: {
      userId_category_yearMonth: {
        userId,
        category,
        yearMonth
      }
    }
  });
}

export async function getAllCategoryBudgets(userId: string, yearMonth: string) {
  return prisma.categoryBudget.findMany({
    where: {
      userId,
      yearMonth
    },
    orderBy: {
      category: 'asc'
    }
  });
}

export async function upsertCategoryBudget(
  userId: string,
  category: string,
  yearMonth: string,
  budget: number
) {
  return prisma.categoryBudget.upsert({
    where: {
      userId_category_yearMonth: {
        userId,
        category,
        yearMonth
      }
    },
    update: {
      budget
    },
    create: {
      userId,
      category,
      yearMonth,
      budget
    }
  });
}

export async function getCategorySpent(userId: string, category: string, yearMonth: string) {
  const snapshot = await getMonthCategorySnapshot(userId, yearMonth);
  if (!snapshot) return 0;

  return snapshot.get(normalizeCategory(category))?.spent ?? 0;
}

export async function getExpensesByCategory(userId: string, category: string, yearMonth: string) {
  const snapshot = await getMonthCategorySnapshot(userId, yearMonth);
  if (!snapshot) return [];

  return snapshot.get(normalizeCategory(category))?.expenses ?? [];
}

export async function getCategoryBudgetSummary(userId: string, yearMonth: string) {
  const [budgets, snapshot] = await Promise.all([
    getAllCategoryBudgets(userId, yearMonth),
    getMonthCategorySnapshot(userId, yearMonth)
  ]);

  return budgets
    .map((budget) => {
      const grouped = snapshot?.get(normalizeCategory(budget.category));
      const spent = grouped?.spent ?? 0;
      const expenses = grouped?.expenses ?? [];
      const remaining = budget.budget - spent;
      const percentage = budget.budget > 0 ? (spent / budget.budget) * 100 : 0;
      const categoryInfo = PREDEFINED_CATEGORIES.find((item) => item.name === budget.category);

      return {
        category: budget.category,
        icon: categoryInfo?.icon || '✨',
        color: categoryInfo?.color || 'slate',
        budget: budget.budget,
        spent,
        remaining,
        percentage,
        isOverBudget: spent > budget.budget,
        expenses: expenses.map((expense) => ({
          id: expense.id,
          name: expense.name,
          amount: expense.amount,
          date: expense.date.toISOString(),
          type: expense.type
        }))
      };
    })
    .sort((a, b) => b.percentage - a.percentage);
}

export async function getAvailableCategories(_userId: string) {
  return PREDEFINED_CATEGORIES;
}
