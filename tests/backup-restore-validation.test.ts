import test from 'node:test';
import assert from 'node:assert/strict';
import type { UserBackup } from '@/lib/services/exportService';
import { BACKUP_SCHEMA_HASH } from '@/lib/services/exportService';
import { validateUserBackupPayload } from '@/lib/services/backupRestoreService';

function createBackup(): UserBackup {
  return {
    meta: {
      version: 2 as const,
      schemaHash: BACKUP_SCHEMA_HASH,
      exportedAt: '2026-04-11T10:00:00.000Z'
    },
    user: {
      id: 'user-1',
      email: 'user@example.com',
      name: 'User',
      currency: 'EUR',
      timezone: 'Europe/Madrid',
      defaultIncome: 0,
      defaultBudget: 0
    },
    months: [{ id: 'm-1', yearMonth: '2026-04', budget: 0, income: 0, carryOver: 0, createdAt: '2026-04-01T00:00:00.000Z' }],
    monthFixedExpenses: [],
    fixedExpenses: [],
    fixedBudgets: [],
    expenses: [],
    expenseSuggestions: [],
    categoryBudgets: [],
    savingsRule: null,
    goals: [],
    goalContributions: [],
    savingsAccount: null,
    savingsTransactions: [],
    investmentAccount: null,
    investmentTransactions: [],
    investmentPlans: [],
    investmentHoldings: [],
    investmentContributions: [],
    classificationRules: [],
    notifications: [],
    notificationPreferences: [],
    achievements: [],
    bankConnections: [],
    bankAccounts: [],
    bankTransactions: [],
    pushSubscriptions: []
  };
}

test('validateUserBackupPayload accepts coherent backup', () => {
  const result = validateUserBackupPayload(createBackup());
  assert.equal(result.ok, true);
  assert.equal(result.issues.length, 0);
});

test('validateUserBackupPayload reports reference conflicts', () => {
  const backup = createBackup();
  backup.expenses.push({
    id: 'exp-1',
    monthId: 'missing-month',
    date: '2026-04-04T00:00:00.000Z',
    name: 'Expense',
    amount: 100,
    category: 'Variable',
    importance: 'NEUTRO',
    notes: null,
    createdAt: '2026-04-04T00:00:00.000Z'
  });

  const result = validateUserBackupPayload(backup);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.code === 'missing_reference'));
});
