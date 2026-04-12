const YEAR_MONTH_REGEX = /^(\d{4})-(\d{2})$/;

export function getYearMonth(timezone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit'
  });
  const [year, month] = formatter.format(new Date()).split('-');
  return `${year}-${month}`;
}

export function isValidYearMonth(value: string | null | undefined): value is string {
  if (!value) return false;
  const match = value.match(YEAR_MONTH_REGEX);
  if (!match) return false;
  const month = Number(match[2]);
  return Number.isInteger(month) && month >= 1 && month <= 12;
}

export function resolveYearMonth(value: string | null | undefined, timezone: string) {
  return isValidYearMonth(value) ? value : getYearMonth(timezone);
}

export function addMonths(yearMonth: string, delta: number) {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const date = new Date(Date.UTC(year, monthIndex + delta, 1));
  const newYear = date.getUTCFullYear();
  const newMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${newYear}-${newMonth}`;
}

export function formatYearMonthLabel(yearMonth: string, locale = 'es-ES') {
  const [yearStr, monthStr] = yearMonth.split('-');
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
}

export function getMonthDateRange(yearMonth: string) {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  return { start, end };
}

export function buildYearMonthRange(centerYearMonth: string, monthsBack: number, monthsForward: number) {
  const range: string[] = [];

  for (let offset = monthsBack; offset >= 1; offset -= 1) {
    range.push(addMonths(centerYearMonth, -offset));
  }

  range.push(centerYearMonth);

  for (let offset = 1; offset <= monthsForward; offset += 1) {
    range.push(addMonths(centerYearMonth, offset));
  }

  return range;
}
