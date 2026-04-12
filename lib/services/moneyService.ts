export function formatMoney(amountCents: number, currency = 'EUR', locale = 'es-ES') {
  const value = amountCents / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

export function parseMoney(input: string) {
  const cleaned = input.replace(/[^0-9,.-]/g, '').replace(',', '.');
  const value = Number(cleaned);
  if (Number.isNaN(value)) return 0;
  return Math.round(value * 100);
}
