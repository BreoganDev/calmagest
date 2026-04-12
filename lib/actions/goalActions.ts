'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { addGoalContributionWithSource } from '@/lib/actions/savingsActions';
import { refreshFinancialSignals } from '@/lib/services/financialRefreshService';

export async function updateSavingsRule(savingsPct: number, investPct: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.savingsRule.upsert({
    where: { userId: session.user.id },
    update: { savingsPct, investPct },
    create: { userId: session.user.id, savingsPct, investPct }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app');
  revalidatePath('/app/settings');
}

export async function createGoal(input: { name: string; targetAmount: number; targetDate?: string; priority?: number }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.goal.create({
    data: {
      userId: session.user.id,
      name: input.name,
      targetAmount: input.targetAmount,
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
      priority: input.priority ?? 2,
      status: 'active'
    }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/goals');
}

export async function addGoalContribution(goalId: string, amount: number, note?: string) {
  await addGoalContributionWithSource(goalId, amount, 'available', 'deposit');
  if (note) {
    await prisma.goalContribution.updateMany({
      where: { goalId, amount: Math.abs(amount), source: 'available', type: 'deposit' },
      data: { note }
    });
  }
}

export async function pauseGoal(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.goal.update({
    where: { id, userId: session.user.id },
    data: { status: 'paused' }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/goals');
}

export async function resumeGoal(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.goal.update({
    where: { id, userId: session.user.id },
    data: { status: 'active' }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/goals');
}

export async function completeGoal(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.goal.update({
    where: { id, userId: session.user.id },
    data: { status: 'completed' }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/goals');
}
