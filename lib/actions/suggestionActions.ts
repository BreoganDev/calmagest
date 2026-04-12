'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { ensureCurrentMonth } from '@/lib/queries/monthQueries';
import { classifyWithUserRules } from '@/lib/services/classifierServer';
import { refreshFinancialSignals } from '@/lib/services/financialRefreshService';
import { normalizeCategory } from '@/lib/services/textService';

async function ensureMonth(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true }
  });
  return ensureCurrentMonth(userId, user?.timezone ?? 'Europe/Madrid');
}

type AcceptSuggestionInput = {
  category?: string | null;
  isFixed?: boolean;
  importance?: 'VITAL' | 'NEUTRO' | 'SUPERFLUO' | null;
};

export async function acceptSuggestion(id: string, input?: AcceptSuggestionInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const suggestion = await prisma.expenseSuggestion.findFirst({
    where: { id, userId: session.user.id, status: 'PENDING' }
  });
  if (!suggestion) return;

  const month = await ensureMonth(session.user.id);
  const rawCategory = (input?.category ?? suggestion.category ?? 'Variable').trim();
  const category = rawCategory.length ? rawCategory : 'Variable';
  const importance = input?.importance ?? suggestion.importance;

  if (input?.isFixed) {
    const budgets = await prisma.fixedBudget.findMany({
      where: { userId: session.user.id, active: true }
    });
    const normalized = normalizeCategory(category);
    const budgetMatch = budgets.find((b) => normalizeCategory(b.category) === normalized);
    const finalCategory = budgetMatch?.category ?? category;

    const fixed = await prisma.fixedExpense.upsert({
      where: {
        userId_name: {
          userId: session.user.id,
          name: suggestion.name
        }
      },
      update: {
        amount: Math.abs(suggestion.amount),
        category: finalCategory,
        active: true
      },
      create: {
        userId: session.user.id,
        name: suggestion.name,
        amount: Math.abs(suggestion.amount),
        category: finalCategory,
        active: true
      }
    });

    const existing = await prisma.monthFixedExpense.findFirst({
      where: { monthId: month.id, name: fixed.name, userId: session.user.id }
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
          monthId: month.id,
          name: fixed.name,
          amount: fixed.amount,
          category: fixed.category,
          active: fixed.active
        }
      });
    }

    await prisma.expenseSuggestion.update({
      where: { id: suggestion.id },
      data: {
        status: 'ACCEPTED',
        category: finalCategory,
        importance,
        notes: `${suggestion.notes ? suggestion.notes + ' · ' : ''}Convertido a fijo`
      }
    });
    await refreshFinancialSignals(session.user.id);

    revalidatePath('/app/expenses');
    revalidatePath('/app/fixed');
    revalidatePath('/app');
    return;
  }

  await prisma.$transaction([
    prisma.expense.create({
      data: {
        userId: session.user.id,
        monthId: month.id,
        date: suggestion.date,
        name: suggestion.name,
        amount: Math.abs(suggestion.amount),
        category,
        importance,
        notes: `${suggestion.notes ? suggestion.notes + ' · ' : ''}Importado desde ${suggestion.source}`
      }
    }),
    prisma.expenseSuggestion.update({
      where: { id: suggestion.id },
      data: { status: 'ACCEPTED', category, importance }
    })
  ]);
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/expenses');
}

export async function rejectSuggestion(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.expenseSuggestion.update({
    where: { id, userId: session.user.id },
    data: { status: 'REJECTED' }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/expenses');
}

export async function acceptAllSuggestions(source?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const month = await ensureMonth(session.user.id);
  const suggestions = await prisma.expenseSuggestion.findMany({
    where: {
      userId: session.user.id,
      status: 'PENDING',
      ...(source ? { source } : {})
    }
  });

  if (!suggestions.length) return;

  const budgets = await prisma.fixedBudget.findMany({
    where: { userId: session.user.id, active: true }
  });

  for (const suggestion of suggestions) {
    const ai = await classifyWithUserRules(session.user.id, suggestion.name);
    if (ai?.isFixed) {
      const normalized = normalizeCategory(suggestion.category);
      const budgetMatch = budgets.find((b) => normalizeCategory(b.category) === normalized);
      const category = budgetMatch?.category ?? suggestion.category;
      const amount = Math.abs(suggestion.amount);

      const fixed = await prisma.fixedExpense.upsert({
        where: {
          userId_name: {
            userId: session.user.id,
            name: suggestion.name
          }
        },
        update: {
          amount,
          category,
          active: true
        },
        create: {
          userId: session.user.id,
          name: suggestion.name,
          amount,
          category,
          active: true
        }
      });

      const existing = await prisma.monthFixedExpense.findFirst({
        where: { monthId: month.id, name: fixed.name, userId: session.user.id }
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
            monthId: month.id,
            name: fixed.name,
            amount: fixed.amount,
            category: fixed.category,
            active: fixed.active
          }
        });
      }

      await prisma.expenseSuggestion.update({
        where: { id: suggestion.id },
        data: {
          status: 'ACCEPTED',
          category,
          importance: suggestion.importance,
          notes: `${suggestion.notes ? suggestion.notes + ' · ' : ''}Convertido a fijo`
        }
      });
    } else {
      await prisma.$transaction([
        prisma.expense.create({
          data: {
            userId: session.user.id,
            monthId: month.id,
            date: suggestion.date,
            name: suggestion.name,
            amount: Math.abs(suggestion.amount),
            category: suggestion.category,
            importance: suggestion.importance,
            notes: `${suggestion.notes ? suggestion.notes + ' · ' : ''}Importado desde ${suggestion.source}`
          }
        }),
        prisma.expenseSuggestion.update({
          where: { id: suggestion.id },
          data: { status: 'ACCEPTED' }
        })
      ]);
    }
  }
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/expenses');
  revalidatePath('/app/fixed');
  revalidatePath('/app');
}

export async function reclassifySuggestions(source?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const month = await ensureMonth(session.user.id);

  const suggestions = await prisma.expenseSuggestion.findMany({
    where: {
      userId: session.user.id,
      status: 'PENDING',
      ...(source ? { source } : {})
    }
  });

  if (!suggestions.length) return;

  const budgets = await prisma.fixedBudget.findMany({
    where: { userId: session.user.id, active: true }
  });

  for (const item of suggestions) {
    const suggestion = await classifyWithUserRules(session.user.id, item.name);
    if (!suggestion) continue;

    if (suggestion.isFixed) {
      const amount = Math.abs(item.amount);
      await prisma.$transaction(async (tx) => {
        const normalized = normalizeCategory(suggestion.category);
        const budgetMatch = budgets.find((b) => normalizeCategory(b.category) === normalized);
        const category = budgetMatch?.category ?? suggestion.category;

        const fixed = await tx.fixedExpense.upsert({
          where: {
            userId_name: {
              userId: session.user.id,
              name: item.name
            }
          },
          update: {
            amount,
            category,
            active: true
          },
          create: {
            userId: session.user.id,
            name: item.name,
            amount,
            category,
            active: true
          }
        });

        const existing = await tx.monthFixedExpense.findFirst({
          where: { monthId: month.id, name: fixed.name, userId: session.user.id }
        });

        if (existing) {
          await tx.monthFixedExpense.update({
            where: { id: existing.id },
            data: {
              amount: fixed.amount,
              category: fixed.category,
              active: fixed.active
            }
          });
        } else {
          await tx.monthFixedExpense.create({
            data: {
              userId: session.user.id,
              monthId: month.id,
              name: fixed.name,
              amount: fixed.amount,
              category: fixed.category,
              active: fixed.active
            }
          });
        }

        await tx.expenseSuggestion.update({
          where: { id: item.id },
          data: {
            category,
            importance: suggestion.importance,
            status: 'ACCEPTED',
            notes: `${item.notes ? item.notes + ' · ' : ''}Convertido a fijo`
          }
        });
      });
    } else {
      await prisma.expenseSuggestion.update({
        where: { id: item.id },
        data: {
          category: suggestion.category,
          importance: suggestion.importance
        }
      });
    }
  }
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/expenses');
  revalidatePath('/app/fixed');
}

type ReceiptSuggestionInput = {
  name: string;
  amount: number;
  date?: string;
  notes?: string;
};

export async function createReceiptSuggestion(input: ReceiptSuggestionInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const name = input.name.trim();
  if (!name) throw new Error('Nombre requerido');
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('Importe requerido');

  const suggestion = await classifyWithUserRules(session.user.id, name);
  const date = input.date ? new Date(input.date) : new Date();

  await prisma.expenseSuggestion.create({
    data: {
      userId: session.user.id,
      date,
      name,
      amount: Math.abs(Math.round(input.amount)),
      category: suggestion?.category ?? 'Variable',
      importance: suggestion?.importance ?? 'NEUTRO',
      source: 'receipt',
      notes: input.notes
    }
  });
  await refreshFinancialSignals(session.user.id);

  revalidatePath('/app/expenses');
}
