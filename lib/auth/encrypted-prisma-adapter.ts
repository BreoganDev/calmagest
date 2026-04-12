import { PrismaAdapter } from '@auth/prisma-adapter';
import type { PrismaClient } from '@prisma/client';
import type { Adapter, AdapterAccount } from 'next-auth/adapters';
import { decryptValue, encryptValue } from '@/lib/server/secret-box';

const ACCOUNT_SECRET_FIELDS = ['access_token', 'refresh_token', 'id_token'] as const;

type AccountSecretField = (typeof ACCOUNT_SECRET_FIELDS)[number];
type MaybeAccount = Partial<Record<AccountSecretField, string | null>> | null | undefined;

function mapAccountSecrets<T extends MaybeAccount>(
  account: T,
  transform: (value?: string | null) => string | null
) {
  if (!account) return account;

  const nextAccount = { ...account };
  for (const field of ACCOUNT_SECRET_FIELDS) {
    nextAccount[field] = transform(account[field]);
  }

  return nextAccount;
}

function encryptAccount(account: AdapterAccount) {
  return mapAccountSecrets(account, encryptValue) as AdapterAccount;
}

function decryptAccount<T extends MaybeAccount>(account: T) {
  return mapAccountSecrets(account, decryptValue) as T;
}

export function EncryptedPrismaAdapter(prisma: PrismaClient): Adapter {
  const adapter = PrismaAdapter(prisma) as Adapter;

  return {
    ...adapter,
    async linkAccount(account) {
      const linked = await adapter.linkAccount?.(encryptAccount(account));
      return decryptAccount(linked as AdapterAccount | null | undefined) ?? undefined;
    },
    async getAccount(providerAccountId, provider) {
      const account = await adapter.getAccount?.(providerAccountId, provider);
      return decryptAccount(account as AdapterAccount | null) ?? null;
    }
  };
}
