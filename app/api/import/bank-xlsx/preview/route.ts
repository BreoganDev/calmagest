import * as XLSX from 'xlsx';
import { getRequestId, jsonWithRequestId } from '@/lib/server/request-context';

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .replace(/\u00a0/g, ' ')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickColumn(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (key in row) return row[key];
  }
  return undefined;
}

function parseDate(value: unknown) {
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    return parsed ? new Date(parsed.y, parsed.m - 1, parsed.d) : new Date(NaN);
  }
  const str = String(value ?? '').trim();
  const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  }
  return new Date(str);
}

function numberToCents(value: string) {
  const cleaned = value
    .replace(/\s/g, '')
    .replace(/[€$]/g, '')
    .replace(/[^0-9,\.-]/g, '');
  if (!cleaned) return NaN;
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  let normalized = cleaned;
  if (hasComma && hasDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasComma && !hasDot) {
    normalized = cleaned.replace(',', '.');
  }
  const num = Number(normalized);
  if (Number.isNaN(num)) return NaN;
  return Math.round(num * 100);
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const arrayBuffer = await request.arrayBuffer();
  if (!arrayBuffer.byteLength) return jsonWithRequestId({ message: 'XLSX vacio' }, requestId, { status: 400 });

  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return jsonWithRequestId({ message: 'XLSX sin hojas' }, requestId, { status: 400 });

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  if (!rows.length) return jsonWithRequestId({ message: 'XLSX sin datos' }, requestId, { status: 400 });

  const normalizedRows = rows.map((row) => {
    const mapped: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      mapped[normalizeHeader(String(key))] = value;
    }
    return mapped;
  });

  const preview = normalizedRows.slice(0, 5).map((row) => {
    const dateRaw = pickColumn(row, ['fecha valor', 'fecha']);
    const conceptoRaw = pickColumn(row, ['concepto']);
    const movimientoRaw = pickColumn(row, ['movimiento']);
    const amountRaw = pickColumn(row, ['importe']);

    const description = String(conceptoRaw || movimientoRaw || '').trim();
    const date = parseDate(dateRaw);
    const amount = numberToCents(String(amountRaw ?? '').trim());

    return {
      raw: row,
      parsed: {
        dateRaw,
        description,
        amountRaw,
        date: isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10),
        amount
      }
    };
  });

  return jsonWithRequestId({ preview }, requestId);
}
