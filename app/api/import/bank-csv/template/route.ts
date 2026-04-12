import { NextResponse } from 'next/server';
import { getRequestId } from '@/lib/server/request-context';

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const csv = 'Fecha,Descripcion,Importe\n2026-02-01,Supermercado,12.50\n2026-02-02,Netflix,9.99\n';
  const response = new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="calma-eco-bank-template.csv"'
    }
  });
  response.headers.set('x-request-id', requestId);
  return response;
}
