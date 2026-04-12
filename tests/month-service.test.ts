import test from 'node:test';
import assert from 'node:assert/strict';
import { addMonths, buildYearMonthRange, isValidYearMonth } from '@/lib/services/monthService';

test('isValidYearMonth validates strict YYYY-MM', () => {
  assert.equal(isValidYearMonth('2026-01'), true);
  assert.equal(isValidYearMonth('2026-12'), true);
  assert.equal(isValidYearMonth('2026-00'), false);
  assert.equal(isValidYearMonth('2026-13'), false);
  assert.equal(isValidYearMonth('26-01'), false);
  assert.equal(isValidYearMonth('2026-1'), false);
});

test('addMonths moves correctly across year boundaries', () => {
  assert.equal(addMonths('2026-01', -1), '2025-12');
  assert.equal(addMonths('2026-12', 1), '2027-01');
});

test('buildYearMonthRange includes center and requested boundaries', () => {
  const range = buildYearMonthRange('2026-04', 2, 1);
  assert.deepEqual(range, ['2026-02', '2026-03', '2026-04', '2026-05']);
});
