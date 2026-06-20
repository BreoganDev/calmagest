import { auth } from '@/auth';
import { getRequestId, jsonWithRequestId } from '@/lib/server/request-context';

function detectSeparator(text: string): string {
  const firstLine = text.split(/\r?\n/)[0] ?? '';
  return firstLine.includes(';') ? ';' : ',';
}

function parseRow(line: string, sep: string): string[] {
  return line.split(sep).map((cell) => cell.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
}

function stripAccents(s: string): string {
  // Remove Unicode combining diacritical marks (U+0300-U+036F)
  return s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

function suggestMapping(headers: string[]): { dateCol: number; descCol: number; amountCol: number } {
  const lower = headers.map(stripAccents);

  const find = (keywords: string[]) =>
    lower.findIndex((h) => keywords.some((kw) => h.includes(kw)));

  let dateCol = find(['fecha', 'date', 'fec', 'dia']);
  let descCol = find(['concepto', 'descripcion', 'description', 'movimiento', 'detalle', 'operacion', 'referencia']);
  let amountCol = find(['importe', 'amount', 'cargo', 'abono', 'valor', 'cantidad']);

  if (dateCol === -1) dateCol = 0;
  if (descCol === -1) descCol = Math.min(1, headers.length - 1);
  if (amountCol === -1) amountCol = Math.min(2, headers.length - 1);

  return { dateCol, descCol, amountCol };
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return jsonWithRequestId({ message: 'Unauthorized' }, requestId, { status: 401 });
  }

  const body = await request.text();
  if (!body.trim()) {
    return jsonWithRequestId({ message: 'CSV vacio' }, requestId, { status: 400 });
  }

  const lines = body.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    return jsonWithRequestId({ message: 'CSV sin cabeceras' }, requestId, { status: 400 });
  }

  const sep = detectSeparator(body);
  const headers = parseRow(lines[0], sep);
  const rows = lines.slice(1, 6).map((l) => parseRow(l, sep));
  const suggestedMapping = suggestMapping(headers);

  return jsonWithRequestId({ headers, rows, suggestedMapping }, requestId);
}
