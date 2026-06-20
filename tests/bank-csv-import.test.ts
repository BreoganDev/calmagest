import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBankAmountToCents, parseBankDate } from '@/lib/services/bankCsvImport';

test('parseBankDate soporta dd/mm/yyyy de BBVA', () => {
  const parsed = parseBankDate('20/06/2026');
  assert.ok(parsed instanceof Date);
  assert.equal(parsed?.toISOString(), '2026-06-20T00:00:00.000Z');
});

test('parseBankDate soporta dd-mm-yyyy de BBVA', () => {
  const parsed = parseBankDate('20-06-2026');
  assert.ok(parsed instanceof Date);
  assert.equal(parsed?.toISOString(), '2026-06-20T00:00:00.000Z');
});

test('parseBankAmountToCents soporta importes españoles con miles y coma decimal', () => {
  assert.equal(parseBankAmountToCents('1.234,56'), 123456);
  assert.equal(parseBankAmountToCents('-1.234,56'), -123456);
});
