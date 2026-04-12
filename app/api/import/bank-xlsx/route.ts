import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { classifyWithUserRules } from '@/lib/services/classifierServer';
import { getRequestId, jsonWithRequestId } from '@/lib/server/request-context';
import * as XLSX from 'xlsx';

const MAX_XLSX_BYTES = 5 * 1024 * 1024;
const MAX_XLSX_ROWS = 5000;

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .replace(/\u00a0/g, ' ')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function numberToCents(value: unknown) {
  if (typeof value === 'number') return Math.round(value * 100);
  const cleaned = String(value ?? '')
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

function findHeaderRow(rows: unknown[][]) {
  for (let i = 0; i < rows.length; i += 1) {
    const normalized = rows[i].map((cell) => normalizeHeader(String(cell ?? '')));
    if (normalized.includes('fecha valor') && normalized.includes('importe')) {
      return i;
    }
  }
  return -1;
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonWithRequestId({ message: 'Unauthorized' }, requestId, { status: 401 });
    }

    const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
    const isAllowedType =
      !contentType ||
      contentType.includes('application/octet-stream') ||
      contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
      contentType.includes('application/vnd.ms-excel');
    if (!isAllowedType) {
      return jsonWithRequestId({ message: 'Tipo de archivo no soportado' }, requestId, { status: 415 });
    }

    const arrayBuffer = await request.arrayBuffer();
    if (!arrayBuffer.byteLength) return jsonWithRequestId({ message: 'XLSX vacio' }, requestId, { status: 400 });
    if (arrayBuffer.byteLength > MAX_XLSX_BYTES) {
      return jsonWithRequestId({ message: 'XLSX demasiado grande' }, requestId, { status: 413 });
    }

    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return jsonWithRequestId({ message: 'XLSX sin hojas' }, requestId, { status: 400 });

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
    if (!rows.length) return jsonWithRequestId({ message: 'XLSX sin datos' }, requestId, { status: 400 });
    if (rows.length > MAX_XLSX_ROWS + 1) {
      return jsonWithRequestId({ message: 'XLSX excede limite de filas' }, requestId, { status: 400 });
    }

    const headerIndex = findHeaderRow(rows);
    if (headerIndex === -1) {
      return jsonWithRequestId({ message: 'No se encontro header' }, requestId, { status: 400 });
    }

    const headers = rows[headerIndex].map((cell) => normalizeHeader(String(cell ?? '')));
    const idx = {
      fechaValor: headers.indexOf('fecha valor'),
      fecha: headers.indexOf('fecha'),
      concepto: headers.indexOf('concepto'),
      movimiento: headers.indexOf('movimiento'),
      importe: headers.indexOf('importe'),
      divisa: headers.indexOf('divisa'),
      disponible: headers.indexOf('disponible'),
      observaciones: headers.indexOf('observaciones')
    };

    const connection = await prisma.bankConnection.findFirst({
      where: { userId: session.user.id, provider: 'xlsx', status: 'active' }
    });

    const conn =
      connection ??
      (await prisma.bankConnection.create({
        data: {
          userId: session.user.id,
          provider: 'xlsx',
          status: 'active'
        }
      }));

    const account = await prisma.bankAccount.upsert({
      where: {
        connectionId_providerAccountId: {
          connectionId: conn.id,
          providerAccountId: 'xlsx-default'
        }
      },
      update: { name: 'Import XLSX', type: 'xlsx' },
      create: { connectionId: conn.id, providerAccountId: 'xlsx-default', name: 'Import XLSX', type: 'xlsx' }
    });

    let imported = 0;
    for (let i = headerIndex + 1; i < rows.length; i += 1) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const dateValue = idx.fechaValor !== -1 ? row[idx.fechaValor] : row[idx.fecha];
      const date = parseDate(dateValue);
      if (Number.isNaN(date.getTime())) continue;

      const concepto = idx.concepto !== -1 ? row[idx.concepto] : '';
      const movimiento = idx.movimiento !== -1 ? row[idx.movimiento] : '';
      const description = String(concepto || movimiento || '').trim();
      if (!description) continue;

      const amountValue = idx.importe !== -1 ? row[idx.importe] : '';
      const amount = numberToCents(amountValue);
      if (Number.isNaN(amount)) continue;

      const currencyValue = idx.divisa !== -1 ? row[idx.divisa] : 'EUR';
      const availableValue = idx.disponible !== -1 ? row[idx.disponible] : '';
      const observations = idx.observaciones !== -1 ? row[idx.observaciones] : '';

      const providerTransactionId = `${date.toISOString().slice(0, 10)}-${description}-${amount}`.slice(0, 190);
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
          currency: String(currencyValue || 'EUR'),
          date
        },
        create: {
          accountId: account.id,
          providerTransactionId,
          description,
          amount,
          currency: String(currencyValue || 'EUR'),
          date
        }
      });

      const notesParts = [];
      if (availableValue) notesParts.push(`Saldo disponible: ${availableValue}`);
      if (observations) notesParts.push(`Obs: ${observations}`);
      const notes = notesParts.length ? notesParts.join(' · ') : undefined;

      await prisma.expenseSuggestion.create({
        data: {
          userId: session.user.id,
          date,
          name: description,
          amount,
          category: suggestion?.category ?? 'Variable',
          importance: suggestion?.importance ?? 'NEUTRO',
          source: 'xlsx',
          ...(notes ? { notes } : {})
        }
      });

      imported += 1;
    }

    return jsonWithRequestId({ ok: true, imported }, requestId);
  } catch (err) {
    return jsonWithRequestId(
      { message: 'Import XLSX failed', error: err instanceof Error ? err.message : String(err) },
      requestId,
      { status: 500 }
    );
  }
}
