export type ParsedRow = { dateStr: string; description: string; amountStr: string };

export function parseCsv(text: string, dateCol: number, descCol: number, amountCol: number): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];

  const sep = lines[0].includes(';') ? ';' : ',';
  const parseCell = (cell: string) => cell.replace(/^"|"$/g, '').replace(/""/g, '"').trim();

  return lines.slice(1).map((line) => {
    const cols = line.split(sep).map(parseCell);
    return {
      dateStr: cols[dateCol] ?? '',
      description: cols[descCol] ?? '',
      amountStr: cols[amountCol] ?? ''
    };
  });
}

export function parseBankDate(raw: string): Date | null {
  const value = raw.trim();
  if (!value) return null;

  const slashMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  }

  const dashMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dashMatch) {
    const [, day, month, year] = dashMatch;
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseBankAmountToCents(raw: string): number {
  const normalized = raw
    .trim()
    .replace(/\s/g, '')
    .replace(/[€$]/g, '')
    .replace(/\.(?=\d{3}(?:[,.]|$))/g, '')
    .replace(',', '.');

  return Math.round(Number(normalized) * 100);
}
