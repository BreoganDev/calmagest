import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Money } from '@/components/ui/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FixedForm from './fixed-form';
import { FixedRowActions } from '@/components/app/fixed-row-actions';
import { FixedEditForm } from '@/components/app/fixed-edit-form';
import { FixedBudgetForm } from '@/components/app/fixed-budget-form';
import { FixedBudgetList } from '@/components/app/fixed-budget-list';
import { getOrCreateMonthByYearMonth } from '@/lib/queries/monthQueries';
import { formatYearMonthLabel } from '@/lib/services/monthService';
import { normalizeCategory } from '@/lib/services/textService';
import { UnassignedFixedList } from '@/components/app/unassigned-fixed-list';
import { FixedDrawer } from '@/components/app/fixed-drawer';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/ui-state';

export default async function FixedPage({
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

  const month = await getOrCreateMonthByYearMonth(
    session.user.id,
    user?.timezone ?? 'Europe/Madrid',
    params.ym
  );
  const monthLabel = formatYearMonthLabel(month.yearMonth);

  const [fixed, fixedBudgets, monthFixed] = await Promise.all([
    prisma.fixedExpense.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.fixedBudget.findMany({
      where: { userId: session.user.id },
      orderBy: { category: 'asc' }
    }),
    prisma.monthFixedExpense.findMany({ where: { monthId: month.id, userId: session.user.id } })
  ]);

  const total = fixed.filter((f) => f.active).reduce((acc, f) => acc + f.amount, 0);
  const budgetTotal = fixedBudgets.filter((b) => b.active).reduce((acc, b) => acc + b.limitAmount, 0);
  const spentByCategory = monthFixed.reduce<Record<string, number>>((acc, item) => {
    if (!item.active) return acc;
    const key = normalizeCategory(item.category);
    acc[key] = (acc[key] ?? 0) + Math.abs(item.amount);
    return acc;
  }, {});
  const budgetCategoryKeys = new Set(fixedBudgets.map((b) => normalizeCategory(b.category)));
  const unassignedSpent = monthFixed.reduce((acc, item) => {
    if (!item.active) return acc;
    const key = normalizeCategory(item.category);
    if (!budgetCategoryKeys.has(key)) {
      return acc + Math.abs(item.amount);
    }
    return acc;
  }, 0);
  const budgetRows = fixedBudgets.map((b) => ({
    ...b,
    spent: spentByCategory[normalizeCategory(b.category)] ?? 0
  }));
  const budgetRowsWithUnassigned =
    unassignedSpent > 0
      ? [
        ...budgetRows,
        {
          id: 'unassigned',
          userId: session.user.id,
          category: 'Sin asignar',
          limitAmount: 0,
          active: true,
          createdAt: new Date(),
          spent: unassignedSpent
        }
      ]
      : budgetRows;

  const unassignedFixed = fixed.filter(
    (item) => item.active && !budgetCategoryKeys.has(normalizeCategory(item.category))
  );
  const budgetCategories = fixedBudgets.map((b) => b.category);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Base tranquila"
        title="Gastos fijos"
        monthLabel={monthLabel}
        subtitle="Lo constante te da espacio. Aquí viven tus esenciales."
        actions={
          <div className="rounded-2xl border border-border bg-card px-4 py-2 text-sm">
            Fijos activos: <Money amount={total} currency={user?.currency} /> · Presupuesto fijo:{' '}
            <Money amount={budgetTotal} currency={user?.currency} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Presupuesto fijo por categoria</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FixedBudgetForm />
            <FixedBudgetList budgets={budgetRowsWithUnassigned} currency={user?.currency ?? 'EUR'} />
          </CardContent>
        </Card>
        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Sin asignar</CardTitle>
          </CardHeader>
          <CardContent>
            <UnassignedFixedList
              items={unassignedFixed}
              categories={budgetCategories}
              currency={user?.currency ?? 'EUR'}
            />
          </CardContent>
        </Card>
        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Lista de fijos</CardTitle>
          </CardHeader>
          <CardContent>
            {fixed.length === 0 ? (
              <EmptyState
                title="Aún no tienes gastos fijos."
                body="Empieza por los esenciales. Un fijo claro reduce ruido mental."
              />
            ) : (
              <div className="grid gap-3">
                {fixed.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-3 rounded-2xl border border-border bg-card/80 px-4 py-3 shadow-soft"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.category}</div>
                      </div>
                      <div className="text-sm font-semibold">
                        <Money amount={item.amount} currency={user?.currency} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <div>
                        {item.active ? 'Activo' : 'Pausado'}
                        {item.dayOfMonth ? ` · Dia ${item.dayOfMonth}` : ''}
                      </div>
                      <FixedRowActions id={item.id} active={item.active} />
                    </div>
                    <details className="rounded-2xl border border-border bg-card/80 p-3 shadow-soft">
                      <summary className="cursor-pointer text-xs text-muted-foreground">Editar</summary>
                      <div className="mt-3">
                        <FixedEditForm item={item} />
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="hidden md:block animate-rise">
          <CardHeader>
            <CardTitle>Nuevo fijo</CardTitle>
          </CardHeader>
          <CardContent>
            <FixedForm />
          </CardContent>
        </Card>
      </div>

      <FixedDrawer />
    </div>
  );
}
