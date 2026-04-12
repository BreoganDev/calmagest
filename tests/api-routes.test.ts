import test from 'node:test';
import assert from 'node:assert/strict';
import type { UserBackup } from '@/lib/services/exportService';
import { BACKUP_SCHEMA_HASH } from '@/lib/services/exportService';
import { handleExportBackup } from '@/lib/api/exportBackupHandler';
import { handleImportBackup } from '@/lib/api/importBackupHandler';
import { handleWeeklySystemPost } from '@/lib/api/weeklySystemHandler';
import { handleHealthGet } from '@/lib/api/healthHandler';

function buildValidBackup(): UserBackup {
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

test('GET /api/export/backup returns 401 when session is missing', async () => {
  const req = new Request('http://localhost/api/export/backup', {
    headers: { 'x-request-id': 'req-export-401' }
  });
  const response = await handleExportBackup(req, {
    getUserSession: async () => {
      throw new Error('Unauthorized');
    },
    buildUserBackup: async () => buildValidBackup(),
    now: () => new Date('2026-04-11T10:00:00.000Z')
  });

  assert.equal(response.status, 401);
  assert.equal(response.headers.get('x-request-id'), 'req-export-401');
  assert.deepEqual(await response.json(), { message: 'Unauthorized' });
});

test('GET /api/export/backup returns backup payload with request id', async () => {
  const req = new Request('http://localhost/api/export/backup', {
    headers: { 'x-request-id': 'req-export-200' }
  });
  const response = await handleExportBackup(req, {
    getUserSession: async () => 'user_1',
    buildUserBackup: async () => buildValidBackup(),
    now: () => new Date('2026-04-11T10:00:00.000Z')
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-request-id'), 'req-export-200');
  assert.match(response.headers.get('content-disposition') ?? '', /calma-eco-backup-2026-04-11/);
});

test('POST /api/import/backup returns 401 when session is missing', async () => {
  const req = new Request('http://localhost/api/import/backup', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'req-import-401'
    },
    body: JSON.stringify(buildValidBackup())
  });
  const response = await handleImportBackup(req, {
    getUserSession: async () => {
      throw new Error('Unauthorized');
    },
    validateUserBackupPayload: () => ({
      ok: true,
      issues: [],
      stats: {
        months: 0,
        expenses: 0,
        suggestions: 0,
        fixed: 0,
        goals: 0,
        investments: 0,
        notifications: 0,
        bank: 0,
        pushSubscriptions: 0,
        totalRecords: 0
      }
    }),
    restoreUserBackupTransactional: async () => {}
  });

  assert.equal(response.status, 401);
  assert.equal(response.headers.get('x-request-id'), 'req-import-401');
  assert.deepEqual(await response.json(), { message: 'Unauthorized' });
});

test('POST /api/import/backup returns 400 on invalid payload', async () => {
  const req = new Request('http://localhost/api/import/backup', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'req-import-400'
    },
    body: JSON.stringify({ invalid: true })
  });
  const response = await handleImportBackup(req, {
    getUserSession: async () => 'user_1',
    validateUserBackupPayload: () => ({
      ok: true,
      issues: [],
      stats: {
        months: 0,
        expenses: 0,
        suggestions: 0,
        fixed: 0,
        goals: 0,
        investments: 0,
        notifications: 0,
        bank: 0,
        pushSubscriptions: 0,
        totalRecords: 0
      }
    }),
    restoreUserBackupTransactional: async () => {}
  });

  assert.equal(response.status, 400);
  assert.equal(response.headers.get('x-request-id'), 'req-import-400');
  assert.deepEqual(await response.json(), { message: 'JSON invalido' });
});

test('POST /api/import/backup?dryRun=true returns 200 without restore mutation', async () => {
  const req = new Request('http://localhost/api/import/backup?dryRun=true', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'req-import-dryrun'
    },
    body: JSON.stringify(buildValidBackup())
  });
  let restored = false;
  const response = await handleImportBackup(req, {
    getUserSession: async () => 'user_1',
    validateUserBackupPayload: () => ({
      ok: true,
      issues: [],
      stats: {
        months: 0,
        expenses: 0,
        suggestions: 0,
        fixed: 0,
        goals: 0,
        investments: 0,
        notifications: 0,
        bank: 0,
        pushSubscriptions: 0,
        totalRecords: 0
      }
    }),
    restoreUserBackupTransactional: async () => {
      restored = true;
    }
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-request-id'), 'req-import-dryrun');
  assert.equal(restored, false);
  assert.deepEqual(await response.json(), {
    ok: true,
    dryRun: true,
    stats: {
      months: 0,
      expenses: 0,
      suggestions: 0,
      fixed: 0,
      goals: 0,
      investments: 0,
      notifications: 0,
      bank: 0,
      pushSubscriptions: 0,
      totalRecords: 0
    }
  });
});

test('POST /api/notifications/weekly/system returns 401 with invalid token', async () => {
  const req = new Request('http://localhost/api/notifications/weekly/system', {
    method: 'POST',
    headers: { 'x-request-id': 'req-weekly-401' }
  });
  const response = await handleWeeklySystemPost(req, {
    runWeeklySummaryJob: async () => ({
      runId: 'run_1',
      total: 1,
      sent: 1,
      skipped: 0,
      failed: 0,
      timedOut: 0,
      retried: 0,
      degraded: false,
      durationMs: 100
    }),
    getExpectedToken: () => 'secret'
  });

  assert.equal(response.status, 401);
  assert.equal(response.headers.get('x-request-id'), 'req-weekly-401');
  assert.deepEqual(await response.json(), { message: 'Unauthorized' });
});

test('POST /api/notifications/weekly/system returns 200 with valid token', async () => {
  const req = new Request('http://localhost/api/notifications/weekly/system', {
    method: 'POST',
    headers: {
      'x-request-id': 'req-weekly-200',
      'x-cron-token': 'secret'
    }
  });
  const response = await handleWeeklySystemPost(req, {
    runWeeklySummaryJob: async () => ({
      runId: 'run_1',
      total: 2,
      sent: 2,
      skipped: 0,
      failed: 0,
      timedOut: 0,
      retried: 0,
      degraded: false,
      durationMs: 120
    }),
    getExpectedToken: () => 'secret'
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-request-id'), 'req-weekly-200');
  assert.deepEqual(await response.json(), {
    ok: true,
    runId: 'run_1',
    total: 2,
    sent: 2,
    skipped: 0,
    failed: 0,
    timedOut: 0,
    retried: 0,
    degraded: false,
    durationMs: 120
  });
});

test('GET /api/health returns 200 and x-request-id', async () => {
  const req = new Request('http://localhost/api/health', {
    headers: { 'x-request-id': 'req-health-200' }
  });
  const response = await handleHealthGet(req, {
    pingDatabase: async () => {},
    now: () => new Date('2026-04-11T10:00:00.000Z'),
    uptimeSeconds: () => 42
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-request-id'), 'req-health-200');
  const payload = await response.json();
  assert.equal(payload.status, 'ok');
  assert.equal(payload.requestId, 'req-health-200');
});
