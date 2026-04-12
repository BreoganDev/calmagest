import test from 'node:test';
import assert from 'node:assert/strict';
import { categoryBudgetBulkSchema, pushSubscriptionSchema } from '../lib/validation';

test('category budget bulk schema accepts sane payloads', () => {
  const parsed = categoryBudgetBulkSchema.safeParse({
    yearMonth: '2026-04',
    budgets: {
      Vivienda: 120000,
      Ocio: 15000
    }
  });

  assert.equal(parsed.success, true);
});

test('push subscription schema rejects invalid payloads', () => {
  const parsed = pushSubscriptionSchema.safeParse({
    endpoint: 'no-url',
    keys: { p256dh: 'short', auth: 'x' }
  });

  assert.equal(parsed.success, false);
});
