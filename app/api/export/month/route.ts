import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/services/exportService';
import { getRequestId } from '@/lib/server/request-context';

function toCsv(rows: string[][]) {
  return rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n');
}

function isUnauthorized(error: unknown) {
  return error instanceof Error && error.message === 'Unauthorized';
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  let userId = '';
  try {
    userId = await getUserSession();
  } catch (error) {
    if (isUnauthorized(error)) {
      const response = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      response.headers.set('x-request-id', requestId);
      return response;
    }
    throw error;
  }

  const month = await prisma.month.findFirst({
    where: { userId },
    orderBy: { yearMonth: 'desc' }
  });
  if (!month) {
    const response = NextResponse.json({ message: 'No hay meses' }, { status: 404 });
    response.headers.set('x-request-id', requestId);
    return response;
  }

  const expenses = await prisma.expense.findMany({
    where: { monthId: month.id },
    orderBy: { date: 'asc' }
  });

  const rows = [
    ['Fecha', 'Nombre', 'Cantidad', 'Categoria', 'Notas'],
    ...expenses.map((e) => [
      e.date.toISOString().slice(0, 10),
      e.name,
      String(e.amount),
      e.category,
      e.notes ?? ''
    ])
  ];

  const csv = toCsv(rows);

  const response = new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="calma-eco-${month.yearMonth}.csv"`
    }
  });
  response.headers.set('x-request-id', requestId);
  return response;
}
