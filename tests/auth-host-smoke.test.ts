import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('auth host hardening is configured in source files', () => {
  const root = process.cwd();
  const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
  const authConfig = fs.readFileSync(path.join(root, 'auth.config.ts'), 'utf8');

  assert.match(envExample, /AUTH_TRUST_HOST=/);
  assert.match(authConfig, /trustHost\s*,|trustHost:/);
  assert.match(authConfig, /AUTH_TRUST_HOST/);
  assert.match(authConfig, /AUTH_URL|NEXTAUTH_URL/);
  assert.match(authConfig, /NODE_ENV\s*!==\s*'production'/);
});
