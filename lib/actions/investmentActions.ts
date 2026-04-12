'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { InvestmentAssetKind, Prisma } from '@prisma/client';
import { refreshFinancialSignals } from '@/lib/services/financialRefreshService';

function riskFromType(type: string): string {
  const t = (type ?? '').toLowerCase();
  if (t.includes('crip')) return 'alto';
  if (t.includes('accion')) return 'alto';
  if (t.includes('etf') || t.includes('fondo')) return 'medio';
  if (t.includes('bono') || t.includes('pension') || t.includes('efectivo')) return 'bajo';
  return 'medio';
}

export async function createInvestmentPlan(input: {
  name: string;
  type: string;
  targetAmount?: number;
  annualInterestPct?: number;
  currentValue?: number;
  notes?: string;
  initialHolding?: {
    kind: InvestmentAssetKind;
    name: string;
    symbol?: string;
    provider?: string;
    providerId?: string;
    quantity: string; // decimal
    costBasis: number; // cents
  };
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const plan = await prisma.investmentPlan.create({
    data: {
      userId: session.user.id,
      name: input.name,
      type: input.type,
      targetAmount: input.targetAmount ?? null,
      riskLevel: riskFromType(input.type),
      annualInterestPct: input.annualInterestPct ?? null,
      currentValue: input.currentValue ?? null,
      notes: input.notes ?? null
    }
  });

  if (input.initialHolding) {
    await prisma.investmentHolding.create({
      data: {
        userId: session.user.id,
        planId: plan.id,
        kind: input.initialHolding.kind,
        name: input.initialHolding.name,
        symbol: input.initialHolding.symbol ?? null,
        provider: input.initialHolding.provider ?? null,
        providerId: input.initialHolding.providerId ?? null,
        quantity: new Prisma.Decimal(input.initialHolding.quantity),
        costBasis: input.initialHolding.costBasis
      }
    });

    // Investment = acquisition of an asset. Mirror it as a contribution for historical/AJR calculations.
    if (input.initialHolding.costBasis > 0) {
      await prisma.investmentContribution.create({
        data: {
          userId: session.user.id,
          planId: plan.id,
          amount: input.initialHolding.costBasis,
          note: `Compra: ${input.initialHolding.name}`
        }
      });
    }
  }
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/investments');
}

export async function deleteInvestmentPlan(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.investmentPlan.delete({
    where: { id, userId: session.user.id }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/investments');
}
