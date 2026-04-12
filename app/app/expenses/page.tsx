import { auth } from '@/auth';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrCreateMonthByYearMonth } from '@/lib/queries/monthQueries';
import { formatYearMonthLabel } from '@/lib/services/monthService';
import { Money } from '@/components/ui/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ExpenseForm from './expense-form';
import { ExpenseFilters } from '@/components/app/expense-filters';
import { Pagination } from '@/components/app/pagination';
import { ExpenseRowActions } from '@/components/app/expense-row-actions';
import { ExpenseEditForm } from '@/components/app/expense-edit-form';
import { AcceptAllSuggestions } from '@/components/app/accept-all-suggestions';
import { ReclassifySuggestions } from '@/components/app/reclassify-suggestions';
import SuggestionRow from '@/components/app/suggestion-row';
import { classifyWithUserRules } from '@/lib/services/classifierServer';
import { CategoryDonut } from '@/components/app/category-donut';
import ReceiptScan from '@/components/app/receipt-scan';
import { BarChart3, Camera, PlusCircle, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState, UiState } from '@/components/app/ui-state';

const PAGE_SIZE = 50;

type SearchParams = {
  q?: string;
  cat?: string;
  sort?: string;
  page?: string;
  source?: string;
  ym?: string;
};

export default async function ExpensesPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
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

  const query = params.q?.trim();
  const category = params.cat?.trim();
  const sort = params.sort ?? 'date_desc';
  const page = Math.max(1, Number(params.page ?? 1));
  const source = params.source?.trim();

  const where = {
    monthId: month.id,
    ...(query
      ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' as Prisma.QueryMode } },
          { category: { contains: query, mode: 'insensitive' as Prisma.QueryMode } },
          { notes: { contains: query, mode: 'insensitive' as Prisma.QueryMode } }
        ]
      }
      : {}),
    ...(category ? { category } : {})
  };

  const orderBy =
    sort === 'amount_asc'
      ? { amount: 'asc' as Prisma.SortOrder }
      : sort === 'amount_desc'
        ? { amount: 'desc' as Prisma.SortOrder }
        : sort === 'date_asc'
          ? { date: 'asc' as Prisma.SortOrder }
          : { date: 'desc' as Prisma.SortOrder };

  const [allExpenses, fixedSnapshots] = await Promise.all([
    prisma.expense.findMany({
      where: { monthId: month.id },
      select: { category: true, amount: true }
    }),
    prisma.monthFixedExpense.findMany({
      where: { userId: session.user.id, monthId: month.id, active: true },
      select: { category: true, amount: true }
    })
  ]);

  const variableTotal = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const fixedTotal = fixedSnapshots.reduce((sum, item) => sum + item.amount, 0);
  const totalSpent = variableTotal + fixedTotal;

  const variableCategoryMap = new Map<string, number>();
  allExpenses.forEach((item) => {
    const key = item.category?.trim() || 'Sin categoría';
    variableCategoryMap.set(key, (variableCategoryMap.get(key) ?? 0) + item.amount);
  });
  const fixedCategoryMap = new Map<string, number>();
  fixedSnapshots.forEach((item) => {
    const key = item.category?.trim() || 'Fijos';
    fixedCategoryMap.set(key, (fixedCategoryMap.get(key) ?? 0) + item.amount);
  });
  const variableDonutData = Array.from(variableCategoryMap.entries()).map(([name, value]) => ({
    name,
    value
  }));
  const fixedDonutData = Array.from(fixedCategoryMap.entries()).map(([name, value]) => ({
    name,
    value
  }));

  const [totalCount, expenses, categories, suggestions] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    prisma.expense.findMany({
      where: { monthId: month.id },
      select: { category: true },
      distinct: ['category']
    }),
    prisma.expenseSuggestion.findMany({
      where: {
        userId: session.user.id,
        status: 'PENDING',
        ...(source ? { source } : {})
      },
      orderBy: { date: 'desc' },
      take: 10
    })
  ]);

  const suggestionsWithMeta = await Promise.all(
    suggestions.map(async (item) => ({
      item,
      ai: await classifyWithUserRules(session.user.id, item.name)
    }))
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const basePath = `/app/expenses?${new URLSearchParams({
    ...(query ? { q: query } : {}),
    ...(category ? { cat: category } : {}),
    ...(sort ? { sort } : {}),
    ym: month.yearMonth
  }).toString()}`;

  return (
    <div className="grid gap-6 min-w-0 pb-12">
      <div className="animate-rise">
        <PageHeader
          eyebrow="Tus movimientos"
          title="Gastos del mes"
          monthLabel={monthLabel}
          subtitle="Un gasto a la vez. Lo importante es la claridad."
        />
      </div>

      {allExpenses.length === 0 && fixedSnapshots.length === 0 && (
        <UiState title="Mes creado, aún sin movimientos." body="Empieza con un gasto o importa desde banco." tone="info" />
      )}

      {suggestionsWithMeta.length > 0 && (
        <Card variant="glass" className="animate-rise rounded-3xl shadow-lg border-rd-rose/30 bg-rd-nude/10">
          <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <CardTitle className="text-base sm:text-lg">Sugeridos desde banco</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`/app/expenses?source=csv&ym=${month.yearMonth}`}
                  className="rounded-full border border-border bg-white/70 px-3 py-1 text-xs shadow-sm hover:bg-white"
                >
                  CSV
                </a>
                <a
                  href={`/app/expenses?source=truelayer&ym=${month.yearMonth}`}
                  className="rounded-full border border-border bg-white/70 px-3 py-1 text-xs shadow-sm hover:bg-white"
                >
                  TrueLayer
                </a>
                <ReclassifySuggestions source={source} />
                <AcceptAllSuggestions source={source} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0">
            <div className="grid gap-3">
              {suggestionsWithMeta.map(({ item, ai }) => (
                <SuggestionRow
                  key={item.id}
                  item={item}
                  currency={user?.currency}
                  defaultIsFixed={ai?.isFixed ?? false}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TOP METRICS ROW (Bento Grid) */}
      {(allExpenses.length > 0 || fixedSnapshots.length > 0) && (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 min-w-0 animate-rise">
          {/* Card 1: Resumen */}
          <Card variant="glass" className="relative shadow-lg overflow-hidden flex flex-col min-w-0 rounded-3xl border-white/60">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-rd-nude/40 via-transparent to-rd-rose-soft/30" />
            <CardHeader className="relative p-4 sm:p-5 pb-0 sm:pb-0 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 border border-border/60 shadow-sm shrink-0">
                  <BarChart3 className="h-5 w-5 text-rd-gray-700" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground truncate">Métricas</div>
                  <CardTitle className="text-base sm:text-lg truncate">Resumen Mensual</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative p-4 sm:p-5 flex-1 flex flex-col justify-end min-w-0 mt-4">
              <div className="grid gap-3 bg-white/40 dark:bg-black/10 rounded-2xl p-4 border border-white/50 dark:border-white/5">
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                  <div className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rd-rose shrink-0" /> Variable
                  </div>
                  <div className="text-sm font-semibold text-slate-900 font-app">
                    <Money amount={variableTotal} currency={user?.currency} />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                  <div className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rd-calm-green shrink-0" /> Fijo
                  </div>
                  <div className="text-sm font-semibold text-slate-900 font-app">
                    <Money amount={fixedTotal} currency={user?.currency} />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-[0.1em]">Total</div>
                  <div className="text-2xl font-extrabold text-slate-900 font-app">
                    <Money amount={totalSpent} currency={user?.currency} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Variables Donut */}
          <Card variant="glass" className="shadow-lg min-w-0 rounded-3xl border-white/60">
            <CardHeader className="p-4 sm:p-5 pb-0 sm:pb-0">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Distribución</div>
              <CardTitle className="text-base">Categorías Variables</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 min-w-0 flex items-center justify-center">
              {variableDonutData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10">Sin gastos variables.</p>
              ) : (
                <div className="w-full">
                  <CategoryDonut data={variableDonutData} currency={user?.currency ?? 'EUR'} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Fijos Donut */}
          <Card variant="glass" className="shadow-lg min-w-0 rounded-3xl border-white/60">
            <CardHeader className="p-4 sm:p-5 pb-0 sm:pb-0">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Distribución</div>
              <CardTitle className="text-base">Categorías Fijas</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 min-w-0 flex items-center justify-center">
              {fixedDonutData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10">Sin gastos fijos.</p>
              ) : (
                <div className="w-full">
                  <CategoryDonut data={fixedDonutData} currency={user?.currency ?? 'EUR'} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] min-w-0 animate-rise mt-2">
        {/* Left Column: List */}
        <section className="grid gap-4 min-w-0 content-start">
          <div className="flex items-end justify-between gap-3 px-1">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Transacciones</div>
              <div className="text-xl font-bold text-slate-900">Listado Variable</div>
            </div>
          </div>
          <ExpenseFilters categories={categories.map((c) => c.category)} />
          
          <Card variant="glass" className="rounded-3xl shadow-lg border-white/60">
            <CardContent className="p-2 sm:p-4 min-w-0">
              {expenses.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="Sin gastos para este filtro."
                    body="Ajusta filtros o añade un nuevo gasto para ver la lista."
                  />
                </div>
              ) : (
                <div className="grid gap-1">
                  {expenses.map((item) => (
                    <div
                      key={item.id}
                      className="group relative grid gap-1 border-b border-border/40 py-3 last:border-0 hover:bg-white/50 dark:hover:bg-white/5 transition-colors px-3 sm:px-4 rounded-2xl"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-rd-gray-900 dark:text-white truncate">
                            {item.name}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-rd-gray-500 mt-1">
                            <span className="font-medium bg-white/60 shadow-xs border border-white dark:bg-rd-gray-800 text-rd-gray-700 dark:text-rd-gray-300 px-2 py-0.5 rounded-md">
                              {item.category}
                            </span>
                            <span>{new Date(item.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-app tabular-nums shrink-0">
                          <Money amount={item.amount} currency={user?.currency} />
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-rd-gray-400 mt-1.5 px-0.5">
                        <div className="truncate italic font-medium opacity-80">{item.notes ? item.notes : 'Sin notas'}</div>
                        <div className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <ExpenseRowActions id={item.id} />
                        </div>
                      </div>
                      <details className="mt-2 text-xs text-rd-gray-500 group-details">
                        <summary className="cursor-pointer hover:text-slate-800 dark:hover:text-rd-gray-300 outline-none select-none transition-colors inline-block font-medium bg-slate-100/50 dark:bg-slate-800 px-2 py-1 rounded-lg">Editar detalle</summary>
                        <div className="mt-3 p-4 bg-white/60 dark:bg-black/20 rounded-2xl border border-white/60 dark:border-white/10 shadow-inner">
                          <ExpenseEditForm item={item} />
                        </div>
                      </details>
                    </div>
                  ))}
                  {totalCount > 100 && (
                    <div className="mt-4 border-t border-border/40 pt-4 px-3">
                      <Pagination current={page} total={totalPages} basePath={basePath} />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right Column: Actions (Sticky Sidebar) */}
        <aside className="flex flex-col gap-4 sm:gap-6 lg:sticky lg:top-8 h-max min-w-0">
          
          <Card variant="glass" className="relative shrink-0 rounded-3xl shadow-lg border-white/60 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-sky-50/50 via-transparent to-rd-nude/30" />
            <CardHeader className="relative p-4 sm:p-5 pb-3 sm:pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 border border-border/50 shadow-sm">
                  <Camera className="h-5 w-5 text-slate-700" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Importar</div>
                  <CardTitle className="text-base">Escanear ticket</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative p-4 sm:p-5 pt-0 sm:pt-0">
              <ReceiptScan />
            </CardContent>
          </Card>

          <Card variant="glass" className="relative shrink-0 rounded-3xl shadow-lg border-white/60 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-50/40 via-transparent to-rd-rose-soft/20" />
            <CardHeader className="relative p-4 sm:p-5 pb-3 sm:pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 border border-border/50 shadow-sm">
                  <PlusCircle className="h-5 w-5 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Crear</div>
                  <CardTitle className="text-base">Nuevo gasto</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative p-4 sm:p-5 pt-0 sm:pt-0">
              <ExpenseForm monthId={month.id} />
            </CardContent>
          </Card>

          <Card variant="glass" className="relative hidden xl:block min-w-0 rounded-3xl shadow-lg border-white/60 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-rd-luxe/60 via-transparent to-rd-secondary/10" />
            <CardHeader className="relative p-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 border border-border/50 shadow-sm">
                  <Sparkles className="h-5 w-5 text-rd-secondary" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Calma</div>
                  <CardTitle className="text-base">Tips suaves</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative p-5 pt-0">
              <div className="grid gap-3 text-sm text-muted-foreground">
                <p>Si no puedes revisarlo todo hoy, céntrate en los importes altos.</p>
                <div className="grid gap-2.5 rounded-2xl border border-white/60 bg-white/50 p-4 shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rd-rose" />
                    <span className="leading-snug">Clasificando tus fijos tendrás menos ruido visual mensual.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rd-secondary" />
                    <span className="leading-snug">Revisa bien los importes al escanear múltiples tickets.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
      
      {/* Spacer to prevent overlap on mobile */}
      <div className="md:hidden h-24 w-full shrink-0" aria-hidden="true" />
    </div>
  );
}
