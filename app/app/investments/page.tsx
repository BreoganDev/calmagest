import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvestmentPlanForm } from '@/components/app/investment-plan-form';
import { deleteInvestmentPlan } from '@/lib/actions/investmentActions';
import { MarketPanel } from '@/components/app/investments/market-panel';
import { InvestmentPlanCard } from '@/components/app/investments/plan-card';
import { PortfolioOverview } from '@/components/app/investments/portfolio-overview';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/ui-state';

export default async function InvestmentsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [user, plansRaw] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { currency: true } }),
    prisma.investmentPlan.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        holdings: { orderBy: { createdAt: 'desc' } },
        contributions: { orderBy: { date: 'asc' } }
      }
    })
  ]);

  const currency = user?.currency ?? 'EUR';

  const plans = plansRaw.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    riskLevel: p.riskLevel,
    targetAmount: p.targetAmount,
    annualInterestPct: p.annualInterestPct,
    currentValue: p.currentValue,
    holdings: p.holdings.map((h) => ({
      id: h.id,
      kind: h.kind,
      name: h.name,
      symbol: h.symbol,
      provider: h.provider,
      providerId: h.providerId,
      quantity: h.quantity.toString(),
      costBasis: h.costBasis
    })),
    contributions: p.contributions.map((c) => ({
      amount: c.amount,
      date: c.date.toISOString()
    }))
  }));

  const allHoldings = plans.flatMap((p) => p.holdings);
  const planOverview = plans.map((plan) => {
    const investedFromHoldings = plan.holdings.reduce((acc, holding) => acc + holding.costBasis, 0);
    const investedFromContributions = plan.contributions
      .filter((contribution) => contribution.amount > 0)
      .reduce((acc, contribution) => acc + contribution.amount, 0);
    const investedCents = investedFromHoldings > 0 ? investedFromHoldings : investedFromContributions;
    const fallbackValueCents = plan.currentValue ?? investedCents;

    return {
      id: plan.id,
      name: plan.name,
      type: plan.type,
      riskLevel: plan.riskLevel,
      investedCents,
      fallbackValueCents,
      holdings: plan.holdings.map((holding) => ({
        id: holding.id,
        quantity: holding.quantity
      }))
    };
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Inversion"
        title="Largo plazo, sin tocar"
        subtitle="Este dinero no se usa para gastos ni liquidez."
      />

      <PortfolioOverview currency={currency} plans={planOverview} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Panel de mercado</CardTitle>
          </CardHeader>
          <CardContent>
            <MarketPanel currency={currency} holdings={allHoldings} />
          </CardContent>
        </Card>

        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Nuevo plan de inversion</CardTitle>
          </CardHeader>
          <CardContent>
            <InvestmentPlanForm currency={currency} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Planes</div>
            <div className="text-lg font-semibold text-slate-900">Planes activos</div>
          </div>
        </div>

        {plans.length === 0 ? (
          <Card className="animate-rise">
            <CardContent className="py-6">
              <EmptyState
                title="Aun no tienes planes de inversion."
                body="Crea tu primer plan y empieza a aportar periodicamente."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {plans.map((plan) => (
              <div key={plan.id} className="grid gap-2">
                <InvestmentPlanCard currency={currency} plan={plan} />
                <form
                  action={async () => {
                    'use server';
                    await deleteInvestmentPlan(plan.id);
                  }}
                >
                  <button className="text-xs text-rd-rose-deep hover:underline">Eliminar plan</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
