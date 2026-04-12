import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { decryptValue } from '@/lib/server/secret-box';

export const BACKUP_SCHEMA_VERSION = 2;
export const BACKUP_SCHEMA_HASH = crypto
  .createHash('sha256')
  .update('calma-gest:user-backup:v2:2026-04')
  .digest('hex');

type BackupMeta = {
  version: typeof BACKUP_SCHEMA_VERSION;
  schemaHash: string;
  exportedAt: string;
};

type BackupRecord = {
  id: string;
  createdAt: string;
};

export type UserBackup = {
  meta: BackupMeta;
  user: {
    id: string;
    email: string;
    name: string | null;
    currency: string;
    timezone: string;
    defaultIncome: number;
    defaultBudget: number;
  };
  months: Array<BackupRecord & {
    yearMonth: string;
    budget: number;
    income: number;
    carryOver: number;
  }>;
  monthFixedExpenses: Array<BackupRecord & {
    userId: string;
    monthId: string;
    name: string;
    amount: number;
    category: string;
    dayOfMonth: number | null;
    active: boolean;
  }>;
  fixedExpenses: Array<BackupRecord & {
    name: string;
    amount: number;
    category: string;
    dayOfMonth: number | null;
    active: boolean;
  }>;
  fixedBudgets: Array<BackupRecord & {
    category: string;
    limitAmount: number;
    active: boolean;
  }>;
  expenses: Array<BackupRecord & {
    monthId: string;
    date: string;
    name: string;
    amount: number;
    category: string;
    importance: 'VITAL' | 'NEUTRO' | 'SUPERFLUO' | null;
    notes: string | null;
  }>;
  expenseSuggestions: Array<BackupRecord & {
    date: string;
    name: string;
    amount: number;
    category: string;
    importance: 'VITAL' | 'NEUTRO' | 'SUPERFLUO';
    notes: string | null;
    source: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  }>;
  categoryBudgets: Array<{
    id: string;
    category: string;
    budget: number;
    yearMonth: string;
    createdAt: string;
  }>;
  savingsRule: {
    id: string;
    savingsPct: number;
    investPct: number;
    createdAt: string;
  } | null;
  goals: Array<BackupRecord & {
    name: string;
    targetAmount: number;
    targetDate: string | null;
    priority: number;
    status: string;
  }>;
  goalContributions: Array<{
    id: string;
    goalId: string;
    amount: number;
    date: string;
    note: string | null;
    source: string;
    type: string;
  }>;
  savingsAccount: {
    id: string;
    balance: number;
    createdAt: string;
  } | null;
  savingsTransactions: Array<{
    id: string;
    amount: number;
    date: string;
    note: string | null;
  }>;
  investmentAccount: {
    id: string;
    balance: number;
    createdAt: string;
  } | null;
  investmentTransactions: Array<{
    id: string;
    amount: number;
    date: string;
    note: string | null;
  }>;
  investmentPlans: Array<BackupRecord & {
    name: string;
    type: string;
    targetAmount: number | null;
    riskLevel: string;
    annualInterestPct: number | null;
    currentValue: number | null;
    notes: string | null;
  }>;
  investmentHoldings: Array<{
    id: string;
    planId: string | null;
    kind: string;
    name: string;
    symbol: string | null;
    provider: string | null;
    providerId: string | null;
    quantity: string;
    costBasis: number;
    createdAt: string;
  }>;
  investmentContributions: Array<BackupRecord & {
    planId: string;
    amount: number;
    date: string;
    note: string | null;
  }>;
  classificationRules: Array<BackupRecord & {
    pattern: string;
    category: string;
    isFixed: boolean;
    importance: 'VITAL' | 'NEUTRO' | 'SUPERFLUO';
  }>;
  notifications: Array<BackupRecord & {
    type: string;
    severity: string;
    title: string;
    body: string;
    data: unknown;
    dedupeKey: string;
    readAt: string | null;
  }>;
  notificationPreferences: Array<{
    id: string;
    type: string;
    channel: string;
    enabled: boolean;
    createdAt: string;
  }>;
  achievements: Array<{
    id: string;
    key: string;
    unlockedAt: string;
    meta: unknown;
  }>;
  bankConnections: Array<{
    id: string;
    provider: string;
    status: string;
    state: string | null;
    scope: string | null;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: string | null;
    createdAt: string;
  }>;
  bankAccounts: Array<{
    id: string;
    connectionId: string;
    providerAccountId: string;
    name: string;
    type: string | null;
    currency: string | null;
    createdAt: string;
  }>;
  bankTransactions: Array<{
    id: string;
    accountId: string;
    providerTransactionId: string;
    date: string;
    description: string;
    amount: number;
    currency: string | null;
    createdAt: string;
  }>;
  pushSubscriptions: Array<{
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    createdAt: string;
  }>;
};

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function buildUserBackup(userId: string): Promise<UserBackup> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!user) throw new Error('User not found');

  const [
    months,
    monthFixedExpenses,
    fixedExpenses,
    fixedBudgets,
    expenses,
    expenseSuggestions,
    categoryBudgets,
    savingsRule,
    goals,
    goalContributions,
    savingsAccount,
    savingsTransactions,
    investmentAccount,
    investmentTransactions,
    investmentPlans,
    investmentHoldings,
    investmentContributions,
    classificationRules,
    notifications,
    notificationPreferences,
    achievements,
    bankConnections,
    bankAccounts,
    bankTransactions,
    pushSubscriptions
  ] = await Promise.all([
    prisma.month.findMany({ where: { userId }, orderBy: { yearMonth: 'asc' } }),
    prisma.monthFixedExpense.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.fixedExpense.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.fixedBudget.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.expense.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
    prisma.expenseSuggestion.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.categoryBudget.findMany({ where: { userId }, orderBy: [{ yearMonth: 'asc' }, { category: 'asc' }] }),
    prisma.savingsRule.findUnique({ where: { userId } }),
    prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.goalContribution.findMany({
      where: { goal: { userId } },
      orderBy: { date: 'asc' }
    }),
    prisma.savingsAccount.findUnique({ where: { userId } }),
    prisma.savingsTransaction.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
    prisma.investmentAccount.findUnique({ where: { userId } }),
    prisma.investmentTransaction.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
    prisma.investmentPlan.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.investmentHolding.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.investmentContribution.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
    prisma.classificationRule.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.notificationPreference.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.userAchievement.findMany({ where: { userId }, orderBy: { unlockedAt: 'asc' } }),
    prisma.bankConnection.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.bankAccount.findMany({
      where: { connection: { userId } },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.bankTransaction.findMany({
      where: { account: { connection: { userId } } },
      orderBy: { date: 'asc' }
    }),
    prisma.pushSubscription.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } })
  ]);

  return {
    meta: {
      version: BACKUP_SCHEMA_VERSION,
      schemaHash: BACKUP_SCHEMA_HASH,
      exportedAt: new Date().toISOString()
    },
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      currency: user.currency,
      timezone: user.timezone,
      defaultIncome: user.defaultIncome,
      defaultBudget: user.defaultBudget
    },
    months: months.map((month) => ({
      id: month.id,
      yearMonth: month.yearMonth,
      budget: month.budget,
      income: month.income,
      carryOver: month.carryOver,
      createdAt: month.createdAt.toISOString()
    })),
    monthFixedExpenses: monthFixedExpenses.map((item) => ({
      id: item.id,
      userId: item.userId,
      monthId: item.monthId,
      name: item.name,
      amount: item.amount,
      category: item.category,
      dayOfMonth: item.dayOfMonth,
      active: item.active,
      createdAt: item.createdAt.toISOString()
    })),
    fixedExpenses: fixedExpenses.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      category: item.category,
      dayOfMonth: item.dayOfMonth,
      active: item.active,
      createdAt: item.createdAt.toISOString()
    })),
    fixedBudgets: fixedBudgets.map((item) => ({
      id: item.id,
      category: item.category,
      limitAmount: item.limitAmount,
      active: item.active,
      createdAt: item.createdAt.toISOString()
    })),
    expenses: expenses.map((expense) => ({
      id: expense.id,
      monthId: expense.monthId,
      date: expense.date.toISOString(),
      name: expense.name,
      amount: expense.amount,
      category: expense.category,
      importance: expense.importance,
      notes: expense.notes,
      createdAt: expense.createdAt.toISOString()
    })),
    expenseSuggestions: expenseSuggestions.map((item) => ({
      id: item.id,
      date: item.date.toISOString(),
      name: item.name,
      amount: item.amount,
      category: item.category,
      importance: item.importance,
      notes: item.notes,
      source: item.source,
      status: item.status,
      createdAt: item.createdAt.toISOString()
    })),
    categoryBudgets: categoryBudgets.map((item) => ({
      id: item.id,
      category: item.category,
      budget: item.budget,
      yearMonth: item.yearMonth,
      createdAt: item.createdAt.toISOString()
    })),
    savingsRule: savingsRule
      ? {
        id: savingsRule.id,
        savingsPct: savingsRule.savingsPct,
        investPct: savingsRule.investPct,
        createdAt: savingsRule.createdAt.toISOString()
      }
      : null,
    goals: goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: iso(goal.targetDate),
      priority: goal.priority,
      status: goal.status,
      createdAt: goal.createdAt.toISOString()
    })),
    goalContributions: goalContributions.map((item) => ({
      id: item.id,
      goalId: item.goalId,
      amount: item.amount,
      date: item.date.toISOString(),
      note: item.note,
      source: item.source,
      type: item.type
    })),
    savingsAccount: savingsAccount
      ? {
        id: savingsAccount.id,
        balance: savingsAccount.balance,
        createdAt: savingsAccount.createdAt.toISOString()
      }
      : null,
    savingsTransactions: savingsTransactions.map((item) => ({
      id: item.id,
      amount: item.amount,
      date: item.date.toISOString(),
      note: item.note
    })),
    investmentAccount: investmentAccount
      ? {
        id: investmentAccount.id,
        balance: investmentAccount.balance,
        createdAt: investmentAccount.createdAt.toISOString()
      }
      : null,
    investmentTransactions: investmentTransactions.map((item) => ({
      id: item.id,
      amount: item.amount,
      date: item.date.toISOString(),
      note: item.note
    })),
    investmentPlans: investmentPlans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      type: plan.type,
      targetAmount: plan.targetAmount,
      riskLevel: plan.riskLevel,
      annualInterestPct: plan.annualInterestPct,
      currentValue: plan.currentValue,
      notes: plan.notes,
      createdAt: plan.createdAt.toISOString()
    })),
    investmentHoldings: investmentHoldings.map((holding) => ({
      id: holding.id,
      planId: holding.planId,
      kind: holding.kind,
      name: holding.name,
      symbol: holding.symbol,
      provider: holding.provider,
      providerId: holding.providerId,
      quantity: holding.quantity.toString(),
      costBasis: holding.costBasis,
      createdAt: holding.createdAt.toISOString()
    })),
    investmentContributions: investmentContributions.map((item) => ({
      id: item.id,
      planId: item.planId,
      amount: item.amount,
      date: item.date.toISOString(),
      note: item.note,
      createdAt: item.createdAt.toISOString()
    })),
    classificationRules: classificationRules.map((item) => ({
      id: item.id,
      pattern: item.pattern,
      category: item.category,
      isFixed: item.isFixed,
      importance: item.importance,
      createdAt: item.createdAt.toISOString()
    })),
    notifications: notifications.map((item) => ({
      id: item.id,
      type: item.type,
      severity: item.severity,
      title: item.title,
      body: item.body,
      data: item.data,
      dedupeKey: item.dedupeKey,
      readAt: iso(item.readAt),
      createdAt: item.createdAt.toISOString()
    })),
    notificationPreferences: notificationPreferences.map((item) => ({
      id: item.id,
      type: item.type,
      channel: item.channel,
      enabled: item.enabled,
      createdAt: item.createdAt.toISOString()
    })),
    achievements: achievements.map((item) => ({
      id: item.id,
      key: item.key,
      unlockedAt: item.unlockedAt.toISOString(),
      meta: item.meta
    })),
    bankConnections: bankConnections.map((item) => ({
      id: item.id,
      provider: item.provider,
      status: item.status,
      state: item.state,
      scope: item.scope,
      // By default backup export does not include third-party provider tokens.
      accessToken: null,
      refreshToken: null,
      expiresAt: iso(item.expiresAt),
      createdAt: item.createdAt.toISOString()
    })),
    bankAccounts: bankAccounts.map((item) => ({
      id: item.id,
      connectionId: item.connectionId,
      providerAccountId: item.providerAccountId,
      name: item.name,
      type: item.type,
      currency: item.currency,
      createdAt: item.createdAt.toISOString()
    })),
    bankTransactions: bankTransactions.map((item) => ({
      id: item.id,
      accountId: item.accountId,
      providerTransactionId: item.providerTransactionId,
      date: item.date.toISOString(),
      description: item.description,
      amount: item.amount,
      currency: item.currency,
      createdAt: item.createdAt.toISOString()
    })),
    pushSubscriptions: pushSubscriptions.map((item) => ({
      id: item.id,
      endpoint: decryptValue(item.endpoint) ?? item.endpoint,
      p256dh: decryptValue(item.p256dh) ?? item.p256dh,
      auth: decryptValue(item.auth) ?? item.auth,
      createdAt: item.createdAt.toISOString()
    }))
  };
}

export async function getUserSession() {
  const { auth } = await import('@/auth');
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}
