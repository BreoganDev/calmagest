import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  BACKUP_SCHEMA_HASH,
  BACKUP_SCHEMA_VERSION,
  type UserBackup
} from '@/lib/services/exportService';
import { encryptValue, hashValue } from '@/lib/server/secret-box';

export type BackupValidationIssue = {
  code: string;
  path: string;
  message: string;
};

export type BackupValidationResult = {
  ok: boolean;
  issues: BackupValidationIssue[];
  stats: {
    months: number;
    expenses: number;
    suggestions: number;
    fixed: number;
    goals: number;
    investments: number;
    notifications: number;
    bank: number;
    pushSubscriptions: number;
    totalRecords: number;
  };
};

function collectDuplicateIssues(
  issues: BackupValidationIssue[],
  label: string,
  items: Array<{ path: string; key: string }>
) {
  const seen = new Set<string>();
  const duplicated = new Set<string>();

  for (const item of items) {
    if (seen.has(item.key)) duplicated.add(item.key);
    seen.add(item.key);
  }

  for (const item of items) {
    if (duplicated.has(item.key)) {
      issues.push({
        code: 'duplicate',
        path: item.path,
        message: `Duplicate ${label}: ${item.key}`
      });
    }
  }
}

function addMissingReferenceIssues(
  issues: BackupValidationIssue[],
  sourceName: string,
  sourceValues: string[],
  referenceSet: Set<string>,
  pathPrefix: string
) {
  sourceValues.forEach((value, index) => {
    if (!referenceSet.has(value)) {
      issues.push({
        code: 'missing_reference',
        path: `${pathPrefix}.${index}`,
        message: `${sourceName} references missing id: ${value}`
      });
    }
  });
}

export function validateUserBackupPayload(backup: UserBackup): BackupValidationResult {
  const issues: BackupValidationIssue[] = [];

  if (backup.meta.version !== BACKUP_SCHEMA_VERSION) {
    issues.push({
      code: 'schema_version_mismatch',
      path: 'meta.version',
      message: `Unsupported backup version ${backup.meta.version}`
    });
  }

  if (backup.meta.schemaHash !== BACKUP_SCHEMA_HASH) {
    issues.push({
      code: 'schema_hash_mismatch',
      path: 'meta.schemaHash',
      message: 'Backup schema hash does not match current server schema'
    });
  }

  const monthIds = new Set(backup.months.map((month) => month.id));
  const goalIds = new Set(backup.goals.map((goal) => goal.id));
  const connectionIds = new Set(backup.bankConnections.map((connection) => connection.id));
  const accountIds = new Set(backup.bankAccounts.map((account) => account.id));
  const planIds = new Set(backup.investmentPlans.map((plan) => plan.id));

  addMissingReferenceIssues(
    issues,
    'monthFixedExpenses.monthId',
    backup.monthFixedExpenses.map((item) => item.monthId),
    monthIds,
    'monthFixedExpenses'
  );
  addMissingReferenceIssues(
    issues,
    'expenses.monthId',
    backup.expenses.map((item) => item.monthId),
    monthIds,
    'expenses'
  );
  addMissingReferenceIssues(
    issues,
    'goalContributions.goalId',
    backup.goalContributions.map((item) => item.goalId),
    goalIds,
    'goalContributions'
  );
  addMissingReferenceIssues(
    issues,
    'bankAccounts.connectionId',
    backup.bankAccounts.map((item) => item.connectionId),
    connectionIds,
    'bankAccounts'
  );
  addMissingReferenceIssues(
    issues,
    'bankTransactions.accountId',
    backup.bankTransactions.map((item) => item.accountId),
    accountIds,
    'bankTransactions'
  );
  addMissingReferenceIssues(
    issues,
    'investmentContributions.planId',
    backup.investmentContributions.map((item) => item.planId),
    planIds,
    'investmentContributions'
  );

  backup.investmentHoldings.forEach((holding, index) => {
    if (holding.planId && !planIds.has(holding.planId)) {
      issues.push({
        code: 'missing_reference',
        path: `investmentHoldings.${index}.planId`,
        message: `investmentHoldings references missing planId: ${holding.planId}`
      });
    }
  });

  collectDuplicateIssues(
    issues,
    'month yearMonth',
    backup.months.map((month, index) => ({
      path: `months.${index}.yearMonth`,
      key: month.yearMonth
    }))
  );
  collectDuplicateIssues(
    issues,
    'fixed expense name',
    backup.fixedExpenses.map((item, index) => ({
      path: `fixedExpenses.${index}.name`,
      key: item.name.trim().toLowerCase()
    }))
  );
  collectDuplicateIssues(
    issues,
    'fixed budget category',
    backup.fixedBudgets.map((item, index) => ({
      path: `fixedBudgets.${index}.category`,
      key: item.category.trim().toLowerCase()
    }))
  );
  collectDuplicateIssues(
    issues,
    'month fixed unique key',
    backup.monthFixedExpenses.map((item, index) => ({
      path: `monthFixedExpenses.${index}`,
      key: `${item.monthId}:${item.name.trim().toLowerCase()}`
    }))
  );
  collectDuplicateIssues(
    issues,
    'category budget unique key',
    backup.categoryBudgets.map((item, index) => ({
      path: `categoryBudgets.${index}`,
      key: `${item.yearMonth}:${item.category.trim().toLowerCase()}`
    }))
  );
  collectDuplicateIssues(
    issues,
    'notification dedupe key',
    backup.notifications.map((item, index) => ({
      path: `notifications.${index}.dedupeKey`,
      key: item.dedupeKey.trim()
    }))
  );
  collectDuplicateIssues(
    issues,
    'bank account unique key',
    backup.bankAccounts.map((item, index) => ({
      path: `bankAccounts.${index}`,
      key: `${item.connectionId}:${item.providerAccountId.trim()}`
    }))
  );
  collectDuplicateIssues(
    issues,
    'bank transaction unique key',
    backup.bankTransactions.map((item, index) => ({
      path: `bankTransactions.${index}`,
      key: `${item.accountId}:${item.providerTransactionId.trim()}`
    }))
  );
  collectDuplicateIssues(
    issues,
    'push subscription endpoint',
    backup.pushSubscriptions.map((item, index) => ({
      path: `pushSubscriptions.${index}.endpoint`,
      key: item.endpoint.trim()
    }))
  );

  const stats = {
    months: backup.months.length,
    expenses: backup.expenses.length,
    suggestions: backup.expenseSuggestions.length,
    fixed: backup.fixedExpenses.length + backup.fixedBudgets.length + backup.monthFixedExpenses.length,
    goals: backup.goals.length + backup.goalContributions.length,
    investments:
      backup.investmentPlans.length +
      backup.investmentHoldings.length +
      backup.investmentContributions.length +
      backup.investmentTransactions.length,
    notifications: backup.notifications.length + backup.notificationPreferences.length + backup.achievements.length,
    bank: backup.bankConnections.length + backup.bankAccounts.length + backup.bankTransactions.length,
    pushSubscriptions: backup.pushSubscriptions.length,
    totalRecords:
      backup.months.length +
      backup.monthFixedExpenses.length +
      backup.fixedExpenses.length +
      backup.fixedBudgets.length +
      backup.expenses.length +
      backup.expenseSuggestions.length +
      backup.categoryBudgets.length +
      backup.goals.length +
      backup.goalContributions.length +
      backup.savingsTransactions.length +
      backup.investmentTransactions.length +
      backup.investmentPlans.length +
      backup.investmentHoldings.length +
      backup.investmentContributions.length +
      backup.classificationRules.length +
      backup.notifications.length +
      backup.notificationPreferences.length +
      backup.achievements.length +
      backup.bankConnections.length +
      backup.bankAccounts.length +
      backup.bankTransactions.length +
      backup.pushSubscriptions.length
  };

  return {
    ok: issues.length === 0,
    issues,
    stats
  };
}

async function createManyInChunks<T>(
  rows: T[],
  createChunk: (chunk: T[]) => Promise<void>,
  chunkSize = 200
) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    if (chunk.length) await createChunk(chunk);
  }
}

export async function restoreUserBackupTransactional(userId: string, backup: UserBackup) {
  const validation = validateUserBackupPayload(backup);
  if (!validation.ok) {
    throw new Error(`Invalid backup payload: ${validation.issues.map((i) => i.message).join('; ')}`);
  }

  await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      await tx.bankTransaction.deleteMany({ where: { account: { connection: { userId } } } });
      await tx.bankAccount.deleteMany({ where: { connection: { userId } } });
      await tx.bankConnection.deleteMany({ where: { userId } });
      await tx.pushSubscription.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.notificationPreference.deleteMany({ where: { userId } });
      await tx.userAchievement.deleteMany({ where: { userId } });
      await tx.expenseSuggestion.deleteMany({ where: { userId } });
      await tx.expense.deleteMany({ where: { userId } });
      await tx.monthFixedExpense.deleteMany({ where: { userId } });
      await tx.month.deleteMany({ where: { userId } });
      await tx.fixedExpense.deleteMany({ where: { userId } });
      await tx.fixedBudget.deleteMany({ where: { userId } });
      await tx.categoryBudget.deleteMany({ where: { userId } });
      await tx.goalContribution.deleteMany({ where: { goal: { userId } } });
      await tx.goal.deleteMany({ where: { userId } });
      await tx.savingsRule.deleteMany({ where: { userId } });
      await tx.savingsTransaction.deleteMany({ where: { userId } });
      await tx.savingsAccount.deleteMany({ where: { userId } });
      await tx.investmentContribution.deleteMany({ where: { userId } });
      await tx.investmentHolding.deleteMany({ where: { userId } });
      await tx.investmentPlan.deleteMany({ where: { userId } });
      await tx.investmentTransaction.deleteMany({ where: { userId } });
      await tx.investmentAccount.deleteMany({ where: { userId } });
      await tx.classificationRule.deleteMany({ where: { userId } });

      await tx.user.update({
        where: { id: userId },
        data: {
          name: backup.user.name,
          defaultIncome: backup.user.defaultIncome ?? 0,
          defaultBudget: backup.user.defaultBudget ?? 0,
          currency: backup.user.currency ?? 'EUR',
          timezone: backup.user.timezone ?? 'Europe/Madrid'
        }
      });

      await createManyInChunks(backup.months, async (chunk) => {
        await tx.month.createMany({
          data: chunk.map((month) => ({
            id: month.id,
            userId,
            yearMonth: month.yearMonth,
            budget: month.budget,
            income: month.income ?? 0,
            carryOver: month.carryOver,
            createdAt: new Date(month.createdAt)
          }))
        });
      });

      await createManyInChunks(backup.monthFixedExpenses, async (chunk) => {
        await tx.monthFixedExpense.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            userId,
            monthId: item.monthId,
            name: item.name,
            amount: item.amount,
            category: item.category,
            dayOfMonth: item.dayOfMonth,
            active: item.active,
            createdAt: new Date(item.createdAt)
          }))
        });
      });

      await createManyInChunks(backup.fixedExpenses, async (chunk) => {
        await tx.fixedExpense.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            userId,
            name: item.name,
            amount: item.amount,
            category: item.category,
            dayOfMonth: item.dayOfMonth,
            active: item.active,
            createdAt: new Date(item.createdAt)
          }))
        });
      });

      await createManyInChunks(backup.fixedBudgets, async (chunk) => {
        await tx.fixedBudget.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            userId,
            category: item.category,
            limitAmount: item.limitAmount,
            active: item.active,
            createdAt: new Date(item.createdAt)
          }))
        });
      });

      await createManyInChunks(backup.expenses, async (chunk) => {
        await tx.expense.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            userId,
            monthId: item.monthId,
            date: new Date(item.date),
            name: item.name,
            amount: item.amount,
            category: item.category,
            importance: item.importance ?? undefined,
            notes: item.notes,
            createdAt: new Date(item.createdAt)
          }))
        });
      });

      await createManyInChunks(backup.expenseSuggestions, async (chunk) => {
        await tx.expenseSuggestion.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            userId,
            date: new Date(item.date),
            name: item.name,
            amount: item.amount,
            category: item.category,
            importance: item.importance,
            notes: item.notes,
            source: item.source,
            status: item.status,
            createdAt: new Date(item.createdAt)
          }))
        });
      });

      await createManyInChunks(backup.categoryBudgets, async (chunk) => {
        await tx.categoryBudget.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            userId,
            category: item.category,
            budget: item.budget,
            yearMonth: item.yearMonth,
            createdAt: new Date(item.createdAt)
          }))
        });
      });

      if (backup.savingsRule) {
        await tx.savingsRule.create({
          data: {
            id: backup.savingsRule.id,
            userId,
            savingsPct: backup.savingsRule.savingsPct,
            investPct: backup.savingsRule.investPct,
            createdAt: new Date(backup.savingsRule.createdAt)
          }
        });
      }

      await createManyInChunks(backup.goals, async (chunk) => {
        await tx.goal.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            userId,
            name: item.name,
            targetAmount: item.targetAmount,
            targetDate: item.targetDate ? new Date(item.targetDate) : null,
            priority: item.priority,
            status: item.status,
            createdAt: new Date(item.createdAt)
          }))
        });
      });

      await createManyInChunks(backup.goalContributions, async (chunk) => {
        await tx.goalContribution.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            goalId: item.goalId,
            amount: item.amount,
            date: new Date(item.date),
            note: item.note,
            source: item.source,
            type: item.type
          }))
        });
      });

      if (backup.savingsAccount) {
        await tx.savingsAccount.create({
          data: {
            id: backup.savingsAccount.id,
            userId,
            balance: backup.savingsAccount.balance,
            createdAt: new Date(backup.savingsAccount.createdAt)
          }
        });
      }

      await createManyInChunks(backup.savingsTransactions, async (chunk) => {
        await tx.savingsTransaction.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            userId,
            amount: item.amount,
            date: new Date(item.date),
            note: item.note
          }))
        });
      });

      if (backup.investmentAccount) {
        await tx.investmentAccount.create({
          data: {
            id: backup.investmentAccount.id,
            userId,
            balance: backup.investmentAccount.balance,
            createdAt: new Date(backup.investmentAccount.createdAt)
          }
        });
      }

      await createManyInChunks(backup.investmentTransactions, async (chunk) => {
        await tx.investmentTransaction.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            userId,
            amount: item.amount,
            date: new Date(item.date),
            note: item.note
          }))
        });
      });

      await createManyInChunks(backup.investmentPlans, async (chunk) => {
        await tx.investmentPlan.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            userId,
            name: item.name,
            type: item.type,
            targetAmount: item.targetAmount,
            riskLevel: item.riskLevel,
            annualInterestPct: item.annualInterestPct,
            currentValue: item.currentValue,
            notes: item.notes,
            createdAt: new Date(item.createdAt)
          }))
        });
      });

      for (const item of backup.investmentHoldings) {
        await tx.investmentHolding.create({
          data: {
            id: item.id,
            userId,
            planId: item.planId,
            kind: item.kind as never,
            name: item.name,
            symbol: item.symbol,
            provider: item.provider,
            providerId: item.providerId,
            quantity: item.quantity,
            costBasis: item.costBasis,
            createdAt: new Date(item.createdAt)
          }
        });
      }

      await createManyInChunks(backup.investmentContributions, async (chunk) => {
        await tx.investmentContribution.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            userId,
            planId: item.planId,
            amount: item.amount,
            date: new Date(item.date),
            note: item.note,
            createdAt: new Date(item.createdAt)
          }))
        });
      });

      await createManyInChunks(backup.classificationRules, async (chunk) => {
        await tx.classificationRule.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            userId,
            pattern: item.pattern,
            category: item.category,
            isFixed: item.isFixed,
            importance: item.importance,
            createdAt: new Date(item.createdAt)
          }))
        });
      });

      await createManyInChunks(backup.notifications, async (chunk) => {
        await tx.notification.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            userId,
            type: item.type,
            severity: item.severity,
            title: item.title,
            body: item.body,
            data: item.data as never,
            dedupeKey: item.dedupeKey,
            readAt: item.readAt ? new Date(item.readAt) : null,
            createdAt: new Date(item.createdAt)
          }))
        });
      });

      await createManyInChunks(backup.notificationPreferences, async (chunk) => {
        await tx.notificationPreference.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            userId,
            type: item.type,
            channel: item.channel,
            enabled: item.enabled,
            createdAt: new Date(item.createdAt)
          }))
        });
      });

      await createManyInChunks(backup.achievements, async (chunk) => {
        await tx.userAchievement.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            userId,
            key: item.key,
            unlockedAt: new Date(item.unlockedAt),
            meta: item.meta as never
          }))
        });
      });

      await createManyInChunks(backup.bankConnections, async (chunk) => {
        await tx.bankConnection.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            userId,
            provider: item.provider,
            status: item.status,
            state: item.state,
            scope: item.scope,
            accessToken: encryptValue(item.accessToken),
            refreshToken: encryptValue(item.refreshToken),
            expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
            createdAt: new Date(item.createdAt)
          }))
        });
      });

      await createManyInChunks(backup.bankAccounts, async (chunk) => {
        await tx.bankAccount.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            connectionId: item.connectionId,
            providerAccountId: item.providerAccountId,
            name: item.name,
            type: item.type,
            currency: item.currency,
            createdAt: new Date(item.createdAt)
          }))
        });
      });

      await createManyInChunks(backup.bankTransactions, async (chunk) => {
        await tx.bankTransaction.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            accountId: item.accountId,
            providerTransactionId: item.providerTransactionId,
            date: new Date(item.date),
            description: item.description,
            amount: item.amount,
            currency: item.currency,
            createdAt: new Date(item.createdAt)
          }))
        });
      });

      await createManyInChunks(backup.pushSubscriptions, async (chunk) => {
        await tx.pushSubscription.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            userId,
            endpoint: encryptValue(item.endpoint) ?? '',
            endpointHash: hashValue(item.endpoint),
            p256dh: encryptValue(item.p256dh) ?? '',
            auth: encryptValue(item.auth) ?? '',
            createdAt: new Date(item.createdAt)
          }))
        });
      });
    },
    {
      maxWait: 15000,
      timeout: 120000
    }
  );
}
