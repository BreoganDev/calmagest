'use client';

import { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, LineChart, Wallet } from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Money } from '@/components/ui/money';
import { cn } from '@/lib/utils';
import { useMarketQuotes } from '@/components/app/investments/market-data-store';

type PlanHolding = {
  id: string;
  quantity: string;
};

type PlanOverview = {
  id: string;
  name: string;
  type: string;
  riskLevel: string;
  investedCents: number;
  fallbackValueCents: number;
  holdings: PlanHolding[];
};

type DerivedPlan = PlanOverview & {
  valueCents: number | null;
  gainCents: number | null;
  gainPct: number | null;
  valuationMode: 'live' | 'fallback';
};

const ALLOCATION_COLORS = ['#6BA89E', '#E8B0A8', '#8ABFD2', '#D89A92', '#5CB986', '#B7A9E8', '#F0C27B', '#9AB7D3'];

function formatCurrency(amountCents: number, currency: string) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amountCents / 100);
}

function shortPlanName(name: string) {
  return name.length > 14 ? `${name.slice(0, 14)}...` : name;
}

export function PortfolioOverview({
  currency,
  plans
}: {
  currency: string;
  plans: PlanOverview[];
}) {
  const quotes = useMarketQuotes();

  const derivedPlans = useMemo<DerivedPlan[]>(() => {
    return plans.map((plan) => {
      let valueCents: number | null = null;
      let valuationMode: 'live' | 'fallback' = 'fallback';

      if (plan.holdings.length === 0) {
        valueCents = plan.fallbackValueCents;
      } else {
        let comparableQuotes = 0;
        let sum = 0;
        for (const holding of plan.holdings) {
          const quote = quotes[holding.id];
          const qty = Number(holding.quantity);
          if (!quote || quote.priceCents == null || !Number.isFinite(qty)) continue;
          if (quote.currency !== currency) continue;
          comparableQuotes += 1;
          sum += Math.round(qty * quote.priceCents);
        }
        if (comparableQuotes === plan.holdings.length) {
          valueCents = sum;
          valuationMode = 'live';
        } else {
          valueCents = plan.fallbackValueCents;
        }
      }

      const gainCents = valueCents == null ? null : valueCents - plan.investedCents;
      const gainPct = gainCents == null || plan.investedCents <= 0 ? null : (gainCents / plan.investedCents) * 100;

      return {
        ...plan,
        valueCents,
        gainCents,
        gainPct,
        valuationMode
      };
    });
  }, [plans, quotes, currency]);

  const comparablePlans = derivedPlans.filter((plan) => plan.valueCents != null && plan.gainCents != null);
  const nonComparablePlans = derivedPlans.filter((plan) => plan.holdings.length > 0 && plan.valuationMode === 'fallback').length;

  const totals = comparablePlans.reduce(
    (acc, plan) => {
      acc.invested += plan.investedCents;
      acc.value += plan.valueCents as number;
      acc.gain += plan.gainCents as number;
      return acc;
    },
    { invested: 0, value: 0, gain: 0 }
  );

  const gainPct = totals.invested > 0 ? (totals.gain / totals.invested) * 100 : 0;
  const isPositive = totals.gain >= 0;
  const positivePlans = comparablePlans.filter((plan) => (plan.gainCents as number) >= 0).length;
  const negativePlans = comparablePlans.filter((plan) => (plan.gainCents as number) < 0).length;

  const performanceData = comparablePlans.map((plan) => ({
    id: plan.id,
    name: shortPlanName(plan.name),
    fullName: plan.name,
    gainCents: plan.gainCents as number
  }));

  const allocationData = comparablePlans
    .filter((plan) => (plan.valueCents as number) > 0)
    .sort((a, b) => (b.valueCents as number) - (a.valueCents as number))
    .map((plan) => ({
      id: plan.id,
      name: shortPlanName(plan.name),
      fullName: plan.name,
      valueCents: plan.valueCents as number
    }));

  return (
    <div className="grid gap-4 sm:gap-6">
      {nonComparablePlans > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          KPI combinado: {nonComparablePlans} plan(es) usando valor de referencia (faltan cotizaciones en tu moneda).
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="animate-rise">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Invertido total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <div className="text-xl font-semibold text-slate-900">
                <Money amount={totals.invested} currency={currency} />
              </div>
              <Wallet className="h-5 w-5 text-slate-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="animate-rise">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Valor estimado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <div className="text-xl font-semibold text-slate-900">
                {comparablePlans.length > 0 ? <Money amount={totals.value} currency={currency} /> : '-'}
              </div>
              <LineChart className="h-5 w-5 text-slate-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="animate-rise">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Ganancia / perdida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <div className={cn('text-xl font-semibold', isPositive ? 'text-emerald-700' : 'text-rd-danger')}>
                {comparablePlans.length > 0 ? <Money amount={totals.gain} currency={currency} /> : '-'}
              </div>
              {isPositive ? (
                <ArrowUpRight className="h-5 w-5 text-emerald-700" />
              ) : (
                <ArrowDownRight className="h-5 w-5 text-rd-danger" />
              )}
            </div>
            <div className={cn('mt-1 text-xs font-medium', isPositive ? 'text-emerald-700' : 'text-rd-danger')}>
              {comparablePlans.length > 0 ? `${isPositive ? '+' : ''}${gainPct.toFixed(2)}%` : '-'}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-rise">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Estado cartera</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              )}
            >
              {isPositive ? 'Conjunto positivo' : 'Conjunto en perdida'}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {positivePlans} en positivo · {negativePlans} en negativo
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Rendimiento por inversion</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin planes comparables.</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" minTickGap={10} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(value) => formatCurrency(value, currency)}
                    />
                    <ReferenceLine y={0} stroke="#cbd5e1" />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value, currency)}
                      labelFormatter={(value) => {
                        const row = performanceData.find((item) => item.name === value);
                        return row?.fullName ?? String(value);
                      }}
                    />
                    <Bar dataKey="gainCents" radius={[8, 8, 0, 0]}>
                      {performanceData.map((item) => (
                        <Cell key={item.id} fill={item.gainCents >= 0 ? '#16a34a' : '#dc2626'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Distribucion de cartera</CardTitle>
          </CardHeader>
          <CardContent>
            {allocationData.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin valor suficiente para mostrar distribucion.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-[220px_1fr] sm:items-center min-w-0">
                <div className="mx-auto h-56 w-full max-w-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={allocationData} dataKey="valueCents" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2}>
                        {allocationData.map((item, index) => (
                          <Cell key={item.id} fill={ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value, currency)}
                        labelFormatter={(value) => {
                          const row = allocationData.find((item) => item.name === value);
                          return row?.fullName ?? String(value);
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid gap-2 min-w-0">
                  {allocationData.map((item, index) => {
                    const pct = totals.value > 0 ? (item.valueCents / totals.value) * 100 : 0;
                    return (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/80 px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length] }}
                          />
                          <span className="truncate text-sm text-slate-800">{item.fullName}</span>
                        </div>
                        <div className="text-right text-xs">
                          <div className="font-semibold text-slate-900">{pct.toFixed(1)}%</div>
                          <div className="text-muted-foreground">{formatCurrency(item.valueCents, currency)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="animate-rise">
        <CardHeader>
          <CardTitle>Planes en un vistazo</CardTitle>
        </CardHeader>
        <CardContent>
          {derivedPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aun no hay planes.</p>
          ) : (
            <div className="grid gap-2">
              {derivedPlans.map((plan) => (
                <div key={plan.id} className="grid gap-2 rounded-2xl border border-border bg-card/80 px-4 py-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.type} · Riesgo {plan.riskLevel}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Invertido
                    <p className="text-sm font-semibold text-slate-900">
                      <Money amount={plan.investedCents} currency={currency} />
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Valor
                    <p className="text-sm font-semibold text-slate-900">
                      {plan.valueCents == null ? '-' : <Money amount={plan.valueCents} currency={currency} />}
                    </p>
                  </div>
                  <div className={cn('text-xs', (plan.gainCents ?? 0) >= 0 ? 'text-emerald-700' : 'text-rd-danger')}>
                    P/L
                    <p className="text-sm font-semibold">
                      {plan.gainCents == null || plan.gainPct == null ? (
                        '-'
                      ) : (
                        <>
                          <Money amount={plan.gainCents} currency={currency} /> ({plan.gainPct >= 0 ? '+' : ''}
                          {plan.gainPct.toFixed(2)}%)
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
