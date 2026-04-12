import crypto from 'crypto';

const SECRET_PREFIX = 'enc:v1';

function getSecretMaterial() {
  const secret = process.env.APP_ENCRYPTION_KEY ?? process.env.AUTH_SECRET ?? '';
  if (!secret) {
    throw new Error('Missing APP_ENCRYPTION_KEY or AUTH_SECRET');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

export function hashValue(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function isEncryptedValue(value?: string | null) {
  return Boolean(value?.startsWith(`${SECRET_PREFIX}:`));
}

export function encryptValue(value?: string | null) {
  if (!value) return null;
  if (isEncryptedValue(value)) return value;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getSecretMaterial(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    SECRET_PREFIX,
    iv.toString('base64url'),
    encrypted.toString('base64url'),
    tag.toString('base64url')
  ].join(':');
}

export function decryptValue(value?: string | null) {
  if (!value) return null;
  if (!isEncryptedValue(value)) return value;

  const [, , ivRaw, encryptedRaw, tagRaw] = value.split(':');
  if (!ivRaw || !encryptedRaw || !tagRaw) {
    throw new Error('Invalid encrypted payload');
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getSecretMaterial(),
    Buffer.from(ivRaw, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, 'base64url')),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}
