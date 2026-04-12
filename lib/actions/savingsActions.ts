'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { refreshFinancialSignals } from '@/lib/services/financialRefreshService';

async function updateSavingsBalance(userId: string) {
  const total = await prisma.savingsTransaction.aggregate({
    where: { userId },
    _sum: { amount: true }
  });
  const balance = total._sum.amount ?? 0;
  await prisma.savingsAccount.upsert({
    where: { userId },
    update: { balance },
    create: { userId, balance }
  });
}

async function updateInvestmentBalance(userId: string) {
  const total = await prisma.investmentTransaction.aggregate({
    where: { userId },
    _sum: { amount: true }
  });
  const balance = total._sum.amount ?? 0;
  await prisma.investmentAccount.upsert({
    where: { userId },
    update: { balance },
    create: { userId, balance }
  });
}

export async function addSavings(amount: number, note?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.savingsTransaction.create({
    data: { userId: session.user.id, amount, note: note || null }
  });
  await updateSavingsBalance(session.user.id);
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/savings');
  revalidatePath('/app');
}

export async function withdrawSavings(amount: number, note?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.savingsTransaction.create({
    data: { userId: session.user.id, amount: -Math.abs(amount), note: note || null }
  });
  await updateSavingsBalance(session.user.id);
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/savings');
  revalidatePath('/app');
}

export async function addInvestment(amount: number, note?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.investmentTransaction.create({
    data: { userId: session.user.id, amount: Math.abs(amount), note: note || null }
  });
  await updateInvestmentBalance(session.user.id);
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/savings');
  revalidatePath('/app');
}

export async function addGoalContributionWithSource(
  goalId: string,
  amount: number,
  source: 'available' | 'savings',
  type: 'deposit' | 'withdraw'
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const signedAmount = type === 'withdraw' ? -Math.abs(amount) : Math.abs(amount);

  if (source === 'savings' && type === 'deposit') {
    await prisma.savingsTransaction.create({
      data: { userId: session.user.id, amount: -Math.abs(amount), note: 'Aporte a objetivo' }
    });
    await updateSavingsBalance(session.user.id);
  }

  await prisma.goalContribution.create({
    data: {
      goalId,
      amount: signedAmount,
      source,
      type
    }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/goals');
  revalidatePath('/app');
}
