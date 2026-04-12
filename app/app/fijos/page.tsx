import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCategoryBudgetSummary } from '@/lib/services/categoryBudgetService';
import { getOrCreateMonthByYearMonth } from '@/lib/queries/monthQueries';
import { formatYearMonthLabel } from '@/lib/services/monthService';
import { Money } from '@/components/ui/money';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { CategoryBudgetCard } from '@/components/app/fijos/category-budget-card';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/ui-state';

export const dynamic = 'force-dynamic';

export default async function FijosPage({
  searchParams
}: {
  searchParams: Promise<{ ym?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const params = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true }
  });

  const month = await getOrCreateMonthByYearMonth(
    session.user.id,
    user?.timezone ?? 'Europe/Madrid',
    params.ym
  );

  const monthLabel = formatYearMonthLabel(month.yearMonth);
  const summary = await getCategoryBudgetSummary(session.user.id, month.yearMonth);

  const totalBudget = summary.reduce((sum, cat) => sum + cat.budget, 0);
  const totalSpent = summary.reduce((sum, cat) => sum + cat.spent, 0);
  const overBudgetCount = summary.filter((cat) => cat.isOverBudget).length;
  const underControlCount = summary.length - overBudgetCount;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Presupuesto por categoría"
        title="Fijos y presupuestos mensuales"
        monthLabel={monthLabel}
        subtitle="Controla límites por categoría y detecta desvíos rápido."
        actions={
          <Button asChild variant="primary">
            <Link href={`/app/fijos/edit?ym=${month.yearMonth}`}>Editar presupuestos</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Presupuesto total</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            <Money amount={totalBudget} />
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Gastado</h3>
          </div>
          <p className="text-3xl font-bold text-amber-600">
            <Money amount={totalSpent} />
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}% del presupuesto
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Estado</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">{underControlCount}</p>
          <p className="mt-1 text-xs text-slate-500">
            {overBudgetCount > 0 ? `${overBudgetCount} categorías excedidas` : 'Todas bajo control'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {summary.length === 0 ? (
          <EmptyState
            title="No hay presupuestos configurados."
            body="Define presupuestos mensuales para cada categoría de gasto."
            action={
              <Button asChild variant="primary">
                <Link href={`/app/fijos/edit?ym=${month.yearMonth}`}>Configurar presupuestos</Link>
              </Button>
            }
          />
        ) : (
          summary.map((cat) => (
            <CategoryBudgetCard
              key={cat.category}
              category={cat.category}
              icon={cat.icon}
              color={cat.color}
              budget={cat.budget}
              spent={cat.spent}
              remaining={cat.remaining}
              percentage={cat.percentage}
              isOverBudget={cat.isOverBudget}
              expenses={cat.expenses}
            />
          ))
        )}
      </div>
    </div>
  );
}
