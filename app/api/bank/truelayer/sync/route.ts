import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { fetchAccounts, fetchTransactions } from '@/lib/services/truelayerService';
import { decryptValue } from '@/lib/server/secret-box';
import { getRequestId, jsonWithRequestId } from '@/lib/server/request-context';

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return jsonWithRequestId({ message: 'Unauthorized' }, requestId, { status: 401 });
  }

  const connection = await prisma.bankConnection.findFirst({
    where: { userId: session.user.id, provider: 'truelayer', status: 'active' }
  });

  const accessToken = decryptValue(connection?.accessToken);
  if (!accessToken || !connection) {
    return jsonWithRequestId({ message: 'No connection' }, requestId, { status: 404 });
  }

  const accounts = await fetchAccounts(accessToken);

  for (const accountRaw of accounts.results) {
    const account = await prisma.bankAccount.upsert({
      where: {
        connectionId_providerAccountId: {
          connectionId: connection.id,
          providerAccountId: accountRaw.account_id
        }
      },
      update: {
        name: accountRaw.display_name ?? 'Cuenta',
        type: accountRaw.account_type,
        currency: accountRaw.currency
      },
      create: {
        connectionId: connection.id,
        providerAccountId: accountRaw.account_id,
        name: accountRaw.display_name ?? 'Cuenta',
        type: accountRaw.account_type,
        currency: accountRaw.currency
      }
    });

    const transactions = await fetchTransactions(accessToken, accountRaw.account_id);
    for (const item of transactions.results) {
      await prisma.bankTransaction.upsert({
        where: {
          accountId_providerTransactionId: {
            accountId: account.id,
            providerTransactionId: item.transaction_id
          }
        },
        update: {
          description: item.description ?? 'Movimiento',
          amount: Math.round(item.amount * 100),
          currency: item.currency,
          date: new Date(item.timestamp)
        },
        create: {
          accountId: account.id,
          providerTransactionId: item.transaction_id,
          description: item.description ?? 'Movimiento',
          amount: Math.round(item.amount * 100),
          currency: item.currency,
          date: new Date(item.timestamp)
        }
      });
    }
  }

  return jsonWithRequestId({ ok: true }, requestId);
}
