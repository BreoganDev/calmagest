import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Money } from '@/components/ui/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SavingsRuleForm } from '@/components/app/savings-rule-form';
import { SavingsActions } from '@/components/app/savings-actions';
import { SavingsDrawer } from '@/components/app/savings-drawer';
import { getOrCreateMonthByYearMonth } from '@/lib/queries/monthQueries';
import { addMonths, formatYearMonthLabel, getMonthDateRange } from '@/lib/services/monthService';
import { SavingsFlowBars } from '@/components/app/savings-flow-bars';
import { ArrowDownLeft, ArrowUpRight, PiggyBank, TrendingUp } from 'lucide-react';

export default async function SavingsPage({
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
  const currency = user?.currency ?? 'EUR';
  const timezone = user?.timezone ?? 'Europe/Madrid';

  const rule = await prisma.savingsRule.findUnique({ where: { userId: session.user.id } });
  const savingsPct = rule?.savingsPct ?? 10;
  const investPct = rule?.investPct ?? 10;

  const month = await getOrCreateMonthByYearMonth(session.user.id, timezone, params.ym);
  const { start, end } = getMonthDateRange(month.yearMonth);

  const months = Array.from({ length: 6 }).map((_, i) => addMonths(month.yearMonth, -(5 - i)));
  const flowStart = getMonthDateRange(months[0]).start;

  const [
    savingsAccount,
    savingsRecent,
    investRecent,
    savingsDepositsAgg,
    savingsWithdrawalsAgg,
    investDepositsAgg,
    investedHoldingsAgg,
    savingsFlow,
    investFlow
  ] = await Promise.all([
    prisma.savingsAccount.findUnique({ where: { userId: session.user.id } }),
    prisma.savingsTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      take: 8
    }),
    prisma.investmentContribution.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      take: 8
    }),
    prisma.savingsTransaction.aggregate({
      where: { userId: session.user.id, date: { gte: start, lt: end }, amount: { gt: 0 } },
      _sum: { amount: true }
    }),
    prisma.savingsTransaction.aggregate({
      where: { userId: session.user.id, date: { gte: start, lt: end }, amount: { lt: 0 } },
      _sum: { amount: true }
    }),
    prisma.investmentContribution.aggregate({
      where: { userId: session.user.id, date: { gte: start, lt: end }, amount: { gt: 0 } },
      _sum: { amount: true }
    }),
    prisma.investmentHolding.aggregate({
      where: { userId: session.user.id },
      _sum: { costBasis: true }
    }),
    prisma.savingsTransaction.findMany({
      where: { userId: session.user.id, date: { gte: flowStart, lt: end } },
      orderBy: { date: 'asc' }
    }),
    prisma.investmentContribution.findMany({
      where: { userId: session.user.id, date: { gte: flowStart, lt: end } },
      orderBy: { date: 'asc' }
    })
  ]);

  const monthIncomeBase = month.income > 0 ? month.income : month.budget;
  const savingsTarget = Math.round((monthIncomeBase * savingsPct) / 100);
  const investTarget = Math.round((monthIncomeBase * investPct) / 100);

  const savingsDeposits = savingsDepositsAgg._sum.amount ?? 0;
  const savingsWithdrawalsAbs = Math.abs(savingsWithdrawalsAgg._sum.amount ?? 0);
  const savingsNet = savingsDeposits - savingsWithdrawalsAbs;
  const investDeposits = investDepositsAgg._sum.amount ?? 0;
  const investedTotal = investedHoldingsAgg._sum.costBasis ?? 0;

  const monthProgress = (actual: number, target: number) => {
    if (!target || target <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((actual / target) * 100)));
  };

  const savingsProgress = monthProgress(savingsDeposits, savingsTarget);
  const investProgress = monthProgress(investDeposits, investTarget);

  const ymFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit'
  });
  const savingsByMonth = new Map<string, { net: number }>();
  for (const t of savingsFlow) {
    const ym = ymFormatter.format(new Date(t.date));
    const prev = savingsByMonth.get(ym) ?? { net: 0 };
    // Savings tx: deposits are +, withdrawals are -
    savingsByMonth.set(ym, { net: prev.net + t.amount });
  }
  const investByMonth = new Map<string, { sum: number }>();
  for (const t of investFlow) {
    const ym = ymFormatter.format(new Date(t.date));
    const prev = investByMonth.get(ym) ?? { sum: 0 };
    investByMonth.set(ym, { sum: prev.sum + t.amount });
  }

  const flowData = months.map((ym) => ({
    label: formatYearMonthLabel(ym).slice(0, 3),
    savingsNet: savingsByMonth.get(ym)?.net ?? 0,
    invest: investByMonth.get(ym)?.sum ?? 0
  }));

  return (
    <div className="grid w-full gap-4 sm:gap-6 lg:grid-cols-12 min-w-0">
      {/* Main (left) */}
      <div className="grid gap-4 sm:gap-6 lg:col-span-7 min-w-0">
        <div className="animate-rise">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tu colchon</div>
          <div className="text-2xl font-semibold text-slate-900">Ahorro e inversion</div>
          <p className="text-sm text-muted-foreground">
            {formatYearMonthLabel(month.yearMonth)} · Depositos y retiros del ahorro. Inversion es largo plazo.
          </p>
        </div>

        <Card variant="glass" className="relative animate-rise rounded-3xl shadow-lg overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-rd-calm-green/18 via-transparent to-rd-rose-soft/45" />
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-rd-calm-green/10 blur-3xl" />

          <CardHeader className="relative p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 border border-border shadow-sm">
                  <PiggyBank className="h-5 w-5 text-rd-calm-green" />
                </div>
                <div>
                  <CardTitle>Ahorro</CardTitle>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Objetivo mes:{' '}
                    {savingsTarget > 0 ? <Money amount={savingsTarget} currency={currency} /> : 'sin regla'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Balance</div>
                <div className="text-2xl sm:text-3xl font-semibold text-slate-900">
                  <Money amount={savingsAccount?.balance ?? 0} currency={currency} />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-white/60 p-3 shadow-soft">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ArrowUpRight className="h-4 w-4 text-rd-calm-green" />
                    Depositos (mes)
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    <Money amount={savingsDeposits} currency={currency} />
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-white/60 p-3 shadow-soft">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ArrowDownLeft className="h-4 w-4 text-rd-danger" />
                    Retiros (mes)
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    <Money amount={-savingsWithdrawalsAbs} currency={currency} />
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-white/60 p-3 shadow-soft">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-rd-rose-deep" />
                    Neto (mes)
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    <Money amount={savingsNet} currency={currency} />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progreso objetivo</span>
                  <span>{savingsProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-rd-gray-100 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-rd-calm-green via-rd-secondary to-rd-rose transition-all"
                    style={{ width: `${Math.max(2, savingsProgress)}%` }}
                  />
                </div>
              </div>

              <div className="hidden md:block">
                <SavingsActions type="savings" compact />
              </div>
              <SavingsDrawer type="savings" label="Nuevo movimiento ahorro" />

              <div className="grid gap-2">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Reciente</div>
                <div className="grid gap-2 max-h-56 overflow-auto pr-1">
                  {savingsRecent.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/70 px-3 py-2 text-xs shadow-soft"
                    >
                      <div className="min-w-0">
                        <div className="text-slate-800 truncate">{t.note ?? 'Movimiento'}</div>
                        <div className="text-muted-foreground">{new Date(t.date).toLocaleDateString('es-ES')}</div>
                      </div>
                      <div className="shrink-0 font-semibold text-slate-900">
                        <Money amount={t.amount} currency={currency} />
                      </div>
                    </div>
                  ))}
                  {savingsRecent.length === 0 && <p className="text-sm text-muted-foreground">Sin movimientos.</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="animate-rise rounded-3xl shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle>Flujo (6 meses)</CardTitle>
                <div className="text-sm text-muted-foreground">Ahorro neto e inversion aportada.</div>
              </div>
              <div className="text-xs text-muted-foreground">{formatYearMonthLabel(month.yearMonth)}</div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <SavingsFlowBars data={flowData} currency={currency} />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/60 px-3 py-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#6BA89E]" />
                Ahorro neto
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/60 px-3 py-1">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E7A9B4]" />
                Inversion
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar (right) */}
      <div className="grid gap-4 sm:gap-6 lg:col-span-5 min-w-0">
        <Card variant="glass" className="relative animate-rise rounded-3xl shadow-lg overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-rd-rose-soft/55 via-transparent to-rd-nude/70" />
          <CardHeader className="relative p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 border border-border shadow-sm">
                  <TrendingUp className="h-5 w-5 text-rd-rose-deep" />
                </div>
                <div>
                  <CardTitle>Inversion</CardTitle>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Objetivo mes:{' '}
                    {investTarget > 0 ? <Money amount={investTarget} currency={currency} /> : 'sin regla'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Invertido total</div>
                <div className="text-2xl sm:text-3xl font-semibold text-slate-900">
                  <Money amount={investedTotal} currency={currency} />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-white/60 p-3 shadow-soft">
                  <div className="text-xs text-muted-foreground">Aportado este mes</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    <Money amount={investDeposits} currency={currency} />
                  </div>
                </div>
                <a
                  href="/app/investments"
                  className="rounded-2xl border border-border bg-white/60 p-3 shadow-soft transition hover:bg-white/80"
                >
                  <div className="text-xs text-muted-foreground">Gestionar inversiones</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">Ver panel y planes</div>
                </a>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progreso objetivo</span>
                  <span>{investProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-rd-gray-100 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-rd-rose via-rd-luxe to-rd-calm-green transition-all"
                    style={{ width: `${Math.max(2, investProgress)}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Reciente</div>
                <div className="grid gap-2 max-h-56 overflow-auto pr-1">
                  {investRecent.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/70 px-3 py-2 text-xs shadow-soft"
                    >
                      <div className="min-w-0">
                        <div className="text-slate-800 truncate">{t.note ?? 'Movimiento'}</div>
                        <div className="text-muted-foreground">{new Date(t.date).toLocaleDateString('es-ES')}</div>
                      </div>
                      <div className="shrink-0 font-semibold text-slate-900">
                        <Money amount={t.amount} currency={currency} />
                      </div>
                    </div>
                  ))}
                  {investRecent.length === 0 && <p className="text-sm text-muted-foreground">Sin movimientos.</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="animate-rise rounded-3xl shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>Reglas</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <SavingsRuleForm savingsPct={savingsPct} investPct={investPct} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
