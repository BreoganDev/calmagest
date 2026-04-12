import test from 'node:test';
import assert from 'node:assert/strict';
import { decryptValue, encryptValue, hashValue } from '../lib/server/secret-box';

process.env.APP_ENCRYPTION_KEY = 'test-secret-key';

test('secret-box roundtrip preserves plaintext', () => {
  const encrypted = encryptValue('sensitive-value');
  assert.ok(encrypted);
  assert.notEqual(encrypted, 'sensitive-value');
  assert.equal(decryptValue(encrypted), 'sensitive-value');
});

test('hashValue is deterministic', () => {
  assert.equal(hashValue('abc'), hashValue('abc'));
  assert.notEqual(hashValue('abc'), hashValue('abcd'));
});
