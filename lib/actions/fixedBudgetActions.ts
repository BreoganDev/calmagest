'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { refreshFinancialSignals } from '@/lib/services/financialRefreshService';

export async function upsertFixedBudget(input: {
  category: string;
  limitAmount: number;
  active: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const category = input.category.trim();
  if (!category) throw new Error('Categoria requerida');

  await prisma.fixedBudget.upsert({
    where: {
      userId_category: {
        userId: session.user.id,
        category
      }
    },
    update: {
      limitAmount: input.limitAmount,
      active: input.active
    },
    create: {
      userId: session.user.id,
      category,
      limitAmount: input.limitAmount,
      active: input.active
    }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/fixed');
}

export async function updateFixedBudget(id: string, data: { limitAmount?: number; active?: boolean }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.fixedBudget.update({
    where: { id, userId: session.user.id },
    data
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/fixed');
}

export async function deleteFixedBudget(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.fixedBudget.delete({
    where: { id, userId: session.user.id }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/fixed');
}
