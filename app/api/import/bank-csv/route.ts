import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { classifyWithUserRules } from '@/lib/services/classifierServer';
import { getRequestId, jsonWithRequestId } from '@/lib/server/request-context';

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];
  const header = lines[0];
  const separator = header.includes(';') ? ';' : ',';
  const rows = lines.slice(1).map((line) =>
    line.split(separator).map((cell) => cell.replace(/^"|"$/g, '').replace(/""/g, '"'))
  );
  return rows;
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return jsonWithRequestId({ message: 'Unauthorized' }, requestId, { status: 401 });
  }

  const body = await request.text();
  if (!body) return jsonWithRequestId({ message: 'CSV vacio' }, requestId, { status: 400 });

  const rows = parseCsv(body);
  if (rows.length === 0) return jsonWithRequestId({ message: 'CSV sin datos' }, requestId, { status: 400 });

  const connection = await prisma.bankConnection.findFirst({
    where: { userId: session.user.id, provider: 'csv', status: 'active' }
  });

  const conn =
    connection ??
    (await prisma.bankConnection.create({
      data: {
        userId: session.user.id,
        provider: 'csv',
        status: 'active'
      }
    }));

  const account = await prisma.bankAccount.upsert({
    where: {
      connectionId_providerAccountId: {
        connectionId: conn.id,
        providerAccountId: 'csv-default'
      }
    },
    update: { name: 'Import CSV', type: 'csv' },
    create: { connectionId: conn.id, providerAccountId: 'csv-default', name: 'Import CSV', type: 'csv' }
  });

  for (const row of rows) {
    const [dateStr, description, amountStr] = row;
    const date = new Date(dateStr);
    if (!description || Number.isNaN(date.getTime())) continue;

    const amount = Math.round(Number(String(amountStr).replace(',', '.')) * 100);
    if (Number.isNaN(amount)) continue;

    const providerTransactionId = `${dateStr}-${description}-${amount}`.slice(0, 190);
    const suggestion = await classifyWithUserRules(session.user.id, description);

    await prisma.bankTransaction.upsert({
      where: {
        accountId_providerTransactionId: {
          accountId: account.id,
          providerTransactionId
        }
      },
      update: {
        description,
        amount,
        currency: 'EUR',
        date
      },
      create: {
        accountId: account.id,
        providerTransactionId,
        description,
        amount,
        currency: 'EUR',
        date
      }
    });

    const normalizedAmount = Math.abs(amount);
    await prisma.expenseSuggestion.create({
      data: {
        userId: session.user.id,
        date,
        name: description,
        amount: normalizedAmount,
        category: suggestion?.category ?? 'Variable',
        importance: suggestion?.importance ?? 'NEUTRO',
        source: 'csv'
      }
    });
  }

  return jsonWithRequestId({ ok: true }, requestId);
}
