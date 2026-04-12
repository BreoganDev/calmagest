'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { InvestmentAssetKind, Prisma } from '@prisma/client';
import { refreshFinancialSignals } from '@/lib/services/financialRefreshService';

function riskFromHoldings(kinds: InvestmentAssetKind[]): string {
  const set = new Set(kinds);
  if (set.has('CRYPTO') || set.has('STOCK')) return 'alto';
  if (set.has('ETF') || set.has('FUND') || set.has('OTHER')) return 'medio';
  if (set.has('BOND') || set.has('PENSION') || set.has('CASH')) return 'bajo';
  return 'medio';
}

export async function addInvestmentContribution(input: {
  planId: string;
  amount: number; // cents, signed
  note?: string;
  date?: string; // YYYY-MM-DD
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.investmentContribution.create({
    data: {
      userId: session.user.id,
      planId: input.planId,
      amount: input.amount,
      note: input.note ?? null,
      date: input.date ? new Date(input.date) : undefined
    }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/investments');
}

export async function updateInvestmentPlanValue(input: {
  planId: string;
  currentValue: number | null; // cents
  annualInterestPct: number | null;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.investmentPlan.update({
    where: { id: input.planId, userId: session.user.id },
    data: {
      currentValue: input.currentValue,
      annualInterestPct: input.annualInterestPct
    }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/investments');
}

export async function createInvestmentHolding(input: {
  planId?: string;
  kind: InvestmentAssetKind;
  name: string;
  symbol?: string;
  provider?: string;
  providerId?: string;
  quantity: string; // decimal
  costBasis: number; // cents
  createContribution?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const holding = await prisma.investmentHolding.create({
    data: {
      userId: session.user.id,
      planId: input.planId ?? null,
      kind: input.kind,
      name: input.name,
      symbol: input.symbol ?? null,
      provider: input.provider ?? null,
      providerId: input.providerId ?? null,
      quantity: new Prisma.Decimal(input.quantity),
      costBasis: input.costBasis
    }
  });

  if (input.planId && input.costBasis > 0 && input.createContribution !== false) {
    await prisma.investmentContribution.create({
      data: {
        userId: session.user.id,
        planId: input.planId,
        amount: input.costBasis,
        note: `Compra: ${input.name}`
      }
    });
  }

  if (input.planId) {
    const holdings = await prisma.investmentHolding.findMany({
      where: { planId: input.planId, userId: session.user.id },
      select: { kind: true }
    });
    const riskLevel = riskFromHoldings(holdings.map((h) => h.kind));
    await prisma.investmentPlan.update({
      where: { id: input.planId, userId: session.user.id },
      data: { riskLevel }
    });
  }
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/investments');
  return holding.id;
}

export async function deleteInvestmentHolding(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.investmentHolding.delete({
    where: { id, userId: session.user.id }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/investments');
}

export async function updateInvestmentHoldingQuantity(input: { id: string; quantity: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.investmentHolding.update({
    where: { id: input.id, userId: session.user.id },
    data: { quantity: new Prisma.Decimal(input.quantity) }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/investments');
}
