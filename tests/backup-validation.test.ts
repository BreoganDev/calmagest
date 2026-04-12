import test from 'node:test';
import assert from 'node:assert/strict';
import { userBackupSchema } from '@/lib/validation';
import { BACKUP_SCHEMA_HASH } from '@/lib/services/exportService';

function buildValidBackup() {
  return {
    meta: {
      version: 2,
      schemaHash: BACKUP_SCHEMA_HASH,
      exportedAt: '2026-04-11T10:00:00.000Z'
    },
    user: {
      id: 'user_1',
      email: 'user@example.com',
      name: 'User',
      currency: 'EUR',
      timezone: 'Europe/Madrid',
      defaultIncome: 120000,
      defaultBudget: 80000
    },
    months: [],
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

test('user backup schema accepts a minimal valid backup', () => {
  const parsed = userBackupSchema.safeParse(buildValidBackup());
  assert.equal(parsed.success, true);
});

test('user backup schema rejects unsupported backup versions', () => {
  const invalid = {
    ...buildValidBackup(),
    meta: {
      version: 1,
      schemaHash: BACKUP_SCHEMA_HASH,
      exportedAt: '2026-04-11T10:00:00.000Z'
    }
  };

  const parsed = userBackupSchema.safeParse(invalid);
  assert.equal(parsed.success, false);
});
