'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { refreshFinancialSignals } from '@/lib/services/financialRefreshService';

export async function updateMonthBudget(monthId: string, budget: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.month.update({
    where: { id: monthId, userId: session.user.id },
    data: { budget }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app');
}

export async function updateMonthIncome(monthId: string, income: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.month.update({
    where: { id: monthId, userId: session.user.id },
    data: { income }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app');
}
