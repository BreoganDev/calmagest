'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { fixedExpenseCreateSchema, fixedExpenseSchema } from '@/lib/validation';
import { auth } from '@/auth';
import { refreshFinancialSignals } from '@/lib/services/financialRefreshService';
import { normalizeCategory } from '@/lib/services/textService';

export async function createFixedExpenseForMonth(monthId: string, input: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const parsed = fixedExpenseCreateSchema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid data');

  const fixed = await prisma.fixedExpense.upsert({
    where: {
      userId_name: {
        userId: session.user.id,
        name: parsed.data.name
      }
    },
    update: {
      amount: parsed.data.amount,
      category: parsed.data.category,
      dayOfMonth: parsed.data.dayOfMonth,
      active: parsed.data.active
    },
    create: {
      userId: session.user.id,
      name: parsed.data.name,
      amount: parsed.data.amount,
      category: parsed.data.category,
      dayOfMonth: parsed.data.dayOfMonth,
      active: parsed.data.active
    }
  });

  const existing = await prisma.monthFixedExpense.findFirst({
    where: { monthId, name: fixed.name, userId: session.user.id }
  });

  if (existing) {
    await prisma.monthFixedExpense.update({
      where: { id: existing.id },
      data: {
        amount: fixed.amount,
        category: fixed.category,
        active: fixed.active,
        dayOfMonth: fixed.dayOfMonth
      }
    });
  } else {
    await prisma.monthFixedExpense.create({
      data: {
        userId: session.user.id,
        monthId,
        name: fixed.name,
        amount: fixed.amount,
        category: fixed.category,
        active: fixed.active,
        dayOfMonth: fixed.dayOfMonth
      }
    });
  }
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/fixed');
  revalidatePath('/app');
}

export async function createFixedExpense(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const parsed = fixedExpenseCreateSchema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid data');

  await prisma.fixedExpense.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      amount: parsed.data.amount,
      category: parsed.data.category,
      dayOfMonth: parsed.data.dayOfMonth,
      active: parsed.data.active
    }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/fixed');
}

export async function updateFixedExpense(id: string, input: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const parsed = fixedExpenseSchema.partial().safeParse(input);
  if (!parsed.success) throw new Error('Invalid data');

  await prisma.fixedExpense.update({
    where: { id, userId: session.user.id },
    data: parsed.data
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/fixed');
}

export async function deleteFixedExpense(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.fixedExpense.delete({
    where: { id, userId: session.user.id }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/fixed');
}

export async function assignFixedToCategory(id: string, category: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const fixed = await prisma.fixedExpense.findFirst({
    where: { id, userId: session.user.id }
  });
  if (!fixed) return;

  const normalized = normalizeCategory(category);
  const budgets = await prisma.fixedBudget.findMany({
    where: { userId: session.user.id, active: true }
  });
  const match = budgets.find((b) => normalizeCategory(b.category) === normalized);
  const finalCategory = match?.category ?? category;

  await prisma.$transaction([
    prisma.fixedExpense.update({
      where: { id: fixed.id },
      data: { category: finalCategory }
    }),
    prisma.monthFixedExpense.updateMany({
      where: { userId: session.user.id, name: fixed.name },
      data: { category: finalCategory }
    })
  ]);
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/fixed');
  revalidatePath('/app');
}
