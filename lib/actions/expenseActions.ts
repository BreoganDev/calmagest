'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { expenseCreateSchema, expenseSchema } from '@/lib/validation';
import { auth } from '@/auth';
import { refreshFinancialSignals } from '@/lib/services/financialRefreshService';
import { normalizeCategory } from '@/lib/services/textService';

export async function createExpense(monthId: string, input: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const parsed = expenseCreateSchema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid data');

  await prisma.expense.create({
    data: {
      userId: session.user.id,
      monthId,
      name: parsed.data.name,
      amount: parsed.data.amount,
      category: parsed.data.category,
      importance: parsed.data.importance,
      notes: parsed.data.notes,
      date: new Date(parsed.data.date)
    }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/expenses');
}

export async function updateExpense(id: string, input: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const parsed = expenseSchema.partial().safeParse(input);
  if (!parsed.success) throw new Error('Invalid data');

  await prisma.expense.update({
    where: { id, userId: session.user.id },
    data: {
      name: parsed.data.name,
      amount: parsed.data.amount,
      category: parsed.data.category,
      notes: parsed.data.notes,
      importance: parsed.data.importance,
      date: parsed.data.date ? new Date(parsed.data.date) : undefined
    }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/expenses');
}

export async function deleteExpense(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.expense.delete({
    where: { id, userId: session.user.id }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/expenses');
}

export async function convertExpenseToFixed(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const expense = await prisma.expense.findFirst({
    where: { id, userId: session.user.id }
  });
  if (!expense) return;

  const budgets = await prisma.fixedBudget.findMany({
    where: { userId: session.user.id, active: true }
  });
  const normalized = normalizeCategory(expense.category);
  const budgetMatch = budgets.find((b) => normalizeCategory(b.category) === normalized);
  const category = budgetMatch?.category ?? expense.category;

  const fixed = await prisma.fixedExpense.upsert({
    where: {
      userId_name: {
        userId: session.user.id,
        name: expense.name
      }
    },
    update: {
      amount: expense.amount,
      category,
      active: true
    },
    create: {
      userId: session.user.id,
      name: expense.name,
      amount: expense.amount,
      category,
      active: true
    }
  });

  const existing = await prisma.monthFixedExpense.findFirst({
    where: { monthId: expense.monthId, name: fixed.name, userId: session.user.id }
  });

  if (existing) {
    await prisma.monthFixedExpense.update({
      where: { id: existing.id },
      data: {
        amount: fixed.amount,
        category: fixed.category,
        active: fixed.active
      }
    });
  } else {
    await prisma.monthFixedExpense.create({
      data: {
        userId: session.user.id,
        monthId: expense.monthId,
        name: fixed.name,
        amount: fixed.amount,
        category: fixed.category,
        active: fixed.active
      }
    });
  }

  await prisma.expense.delete({
    where: { id: expense.id }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/expenses');
  revalidatePath('/app/fixed');
  revalidatePath('/app');
}
