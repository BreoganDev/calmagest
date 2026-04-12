type Attempt = { count: number; last: number };

const attempts = new Map<string, Attempt>();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function canAttemptLogin(key: string) {
  const now = Date.now();
  const existing = attempts.get(key);
  if (!existing || now - existing.last > WINDOW_MS) {
    attempts.set(key, { count: 1, last: now });
    return true;
  }

  if (existing.count >= MAX_ATTEMPTS) return false;

  attempts.set(key, { count: existing.count + 1, last: now });
  return true;
}

export function resetLoginAttempts(key: string) {
  attempts.delete(key);
}
