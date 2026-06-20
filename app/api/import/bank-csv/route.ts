import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { parseBankAmountToCents, parseBankDate, parseCsv } from '@/lib/services/bankCsvImport';
import { classifyWithUserRules } from '@/lib/services/classifierServer';
import { getRequestId, jsonWithRequestId } from '@/lib/server/request-context';
import { createHash } from 'crypto';

function dedupeKey(userId: string, dateStr: string, description: string, amount: number): string {
  return createHash('sha256').update(`${userId}:${dateStr}:${description}:${amount}`).digest('hex').slice(0, 32);
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return jsonWithRequestId({ message: 'Unauthorized' }, requestId, { status: 401 });
  }

  const url = new URL(request.url);
  const dateCol = Math.max(0, Number(url.searchParams.get('dateCol') ?? 0));
  const descCol = Math.max(0, Number(url.searchParams.get('descCol') ?? 1));
  const amountCol = Math.max(0, Number(url.searchParams.get('amountCol') ?? 2));

  const body = await request.text();
  if (!body) return jsonWithRequestId({ message: 'CSV vacío' }, requestId, { status: 400 });

  const rows = parseCsv(body, dateCol, descCol, amountCol);
  if (rows.length === 0) return jsonWithRequestId({ message: 'CSV sin datos' }, requestId, { status: 400 });

  let imported = 0;
  let skipped = 0;
  let duplicates = 0;

  for (const { dateStr, description, amountStr } of rows) {
    const date = parseBankDate(dateStr);
    if (!description || !date || Number.isNaN(date.getTime())) { skipped++; continue; }

    const amount = parseBankAmountToCents(amountStr);
    if (Number.isNaN(amount)) { skipped++; continue; }

    const key = dedupeKey(session.user.id, dateStr, description, amount);

    const existing = await prisma.expenseSuggestion.findFirst({
      where: { userId: session.user.id, notes: key }
    });
    if (existing) { duplicates++; continue; }

    const suggestion = await classifyWithUserRules(session.user.id, description);

    await prisma.expenseSuggestion.create({
      data: {
        userId: session.user.id,
        date,
        name: description,
        amount: Math.abs(amount),
        category: suggestion?.category ?? 'Otros',
        importance: suggestion?.importance ?? 'NEUTRO',
        source: 'csv',
        notes: key
      }
    });

    imported++;
  }

  return jsonWithRequestId({ ok: true, imported, skipped, duplicates }, requestId);
}
