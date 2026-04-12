import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { calcMonthTotals } from '@/lib/services/calcService';
import Link from 'next/link';
import { formatYearMonthLabel, getYearMonth, isValidYearMonth } from '@/lib/services/monthService';
import { Money } from '@/components/ui/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MonthlyBars } from '@/components/app/monthly-bars';
import { CategoryDonut } from '@/components/app/category-donut';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/ui-state';

export default async function HistoryPage({
  searchParams
}: {
  searchParams: Promise<{ ym?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const params = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { currency: true, timezone: true }
  });

  const months = await prisma.month.findMany({
    where: { userId: session.user.id },
    orderBy: { yearMonth: 'asc' },
    take: 12
  });

  const barsData = await Promise.all(
    months.map(async (month) => {
      const [fixed, expenses] = await Promise.all([
        prisma.monthFixedExpense.findMany({ where: { monthId: month.id } }),
        prisma.expense.findMany({ where: { monthId: month.id } })
      ]);
      const totals = calcMonthTotals(month, fixed, expenses);
      return {
        label: month.yearMonth,
        budget: month.budget,
        spent: totals.spent,
        diff: totals.remaining
      };
    })
  );

  const latestMonth = months[months.length - 1];
  const selectedYearMonth = isValidYearMonth(params.ym)
    ? params.ym
    : latestMonth?.yearMonth ?? getYearMonth(user?.timezone ?? 'Europe/Madrid');
  const focusMonth = months.find((month) => month.yearMonth === selectedYearMonth) ?? latestMonth;
  const focusMonthLabel = formatYearMonthLabel(selectedYearMonth);
  const focusMonthBar = barsData.find((bar) => bar.label === selectedYearMonth);

  const currentExpenses = focusMonth
    ? await prisma.expense.findMany({ where: { monthId: focusMonth.id } })
    : [];

  const categoryMap = new Map<string, number>();
  currentExpenses.forEach((exp) => {
    categoryMap.set(exp.category, (categoryMap.get(exp.category) ?? 0) + exp.amount);
  });
  const donutData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Tendencias"
        title="Histórico"
        monthLabel={focusMonthLabel}
        subtitle="Compara meses y abre rápido el módulo exacto del período."
      />

      <Card className="animate-rise">
        <CardHeader>
          <CardTitle>Acceso rápido al mes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            {months.map((month) => {
              const isSelected = month.yearMonth === selectedYearMonth;
              return (
                <Link
                  key={month.id}
                  href={`/app/history?ym=${month.yearMonth}`}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    isSelected
                      ? 'border-rd-rose bg-rd-rose-soft text-rd-gray-800'
                      : 'border-border bg-card text-muted-foreground hover:bg-card/80'
                  }`}
                >
                  {formatYearMonthLabel(month.yearMonth)}
                </Link>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/app?ym=${selectedYearMonth}`} className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm hover:bg-card/80">
              Abrir resumen
            </Link>
            <Link href={`/app/expenses?ym=${selectedYearMonth}`} className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm hover:bg-card/80">
              Abrir gastos
            </Link>
            <Link href={`/app/fijos?ym=${selectedYearMonth}`} className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm hover:bg-card/80">
              Abrir fijos
            </Link>
            <Link href={`/app/savings?ym=${selectedYearMonth}`} className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm hover:bg-card/80">
              Abrir ahorro
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-rise">
        <CardHeader>
          <CardTitle>Presupuesto vs gasto (12 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          {barsData.length === 0 ? (
            <EmptyState title="Aún no hay meses para comparar." body="Registra gastos en más meses para ver tendencia." />
          ) : (
            <MonthlyBars data={barsData} currency={user?.currency ?? 'EUR'} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Categorías del mes ({focusMonthLabel})</CardTitle>
          </CardHeader>
          <CardContent>
            {donutData.length === 0 ? (
              <EmptyState title="Aún no hay gastos en este mes." body="Prueba abrir el mes en Gastos para registrar movimientos." />
            ) : (
              <CategoryDonut data={donutData} currency={user?.currency ?? 'EUR'} />
            )}
          </CardContent>
        </Card>
        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Resumen rápido</CardTitle>
          </CardHeader>
          <CardContent>
            {focusMonth ? (
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Presupuesto</span>
                  <span><Money amount={focusMonth.budget} currency={user?.currency} /></span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Carry over</span>
                  <span><Money amount={focusMonth.carryOver} currency={user?.currency} /></span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Gasto total</span>
                  <span>
                    <Money amount={focusMonthBar?.spent ?? 0} currency={user?.currency} />
                  </span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span>Restante</span>
                  <span>
                    <Money amount={focusMonthBar?.diff ?? 0} currency={user?.currency} />
                  </span>
                </div>
              </div>
            ) : (
              <EmptyState title="Sin datos todavía." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
