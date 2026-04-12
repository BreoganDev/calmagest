import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getDashboardData } from '@/lib/services/dashboardService';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, Lightbulb, ArrowRight } from 'lucide-react';
import { Money } from '@/components/ui/money';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/ui-state';

export const dynamic = 'force-dynamic';

type CoachInsight = {
  type: 'alert' | 'praise' | 'tip' | string;
  message: string;
  impact?: number;
  actionLabel?: string;
  actionUrl?: string;
};

export default async function CoachPage({
  searchParams
}: {
  searchParams: Promise<{ ym?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const params = await searchParams;
  const data = await getDashboardData(session.user.id, params.ym);
  const {
    balance,
    monthLabel,
    coachInsights,
    donutData,
    spendRate,
    savingsRate,
    investRate,
    daysLeft,
    remainingDailySafe,
    projectedRemaining
  } = data;

  const insights = (coachInsights ?? []) as CoachInsight[];
  const alerts = insights.filter((i) => i.type === 'alert');
  const praises = insights.filter((i) => i.type === 'praise');
  const tips = insights.filter((i) => i.type === 'tip');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Asistente financiero"
        title="Coach IA"
        monthLabel={monthLabel}
        subtitle="Insights personalizados para decidir mejor este mes."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Fortalezas</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">{praises.length}</p>
          <p className="mt-1 text-xs text-slate-500">Aspectos positivos detectados</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Alertas</h3>
          </div>
          <p className="text-3xl font-bold text-amber-600">{alerts.length}</p>
          <p className="mt-1 text-xs text-slate-500">Áreas que requieren atención</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <Lightbulb className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Consejos</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">{tips.length}</p>
          <p className="mt-1 text-xs text-slate-500">Recomendaciones accionables</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 shadow-lg">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Salud financiera del mes</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <MetricBar label="Tasa de gasto" value={spendRate} tone={spendRate > 90 ? 'danger' : spendRate > 70 ? 'warning' : 'ok'} />
          <MetricBar label="Tasa de ahorro" value={savingsRate} tone="ok" />
          <MetricBar label="Tasa de inversión" value={investRate} tone="info" />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Proyección fin de mes</span>
              <span className={`text-sm font-bold ${projectedRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <Money amount={projectedRemaining} />
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all ${projectedRemaining >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${projectedRemaining >= 0 ? 100 : 50}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="mb-1 text-xs font-semibold text-blue-900">Gasto diario seguro</p>
            <p className="text-2xl font-bold text-blue-700">
              <Money amount={remainingDailySafe} />
            </p>
            <p className="mt-1 text-xs text-blue-600">Para los próximos {daysLeft} días</p>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <p className="mb-1 text-xs font-semibold text-purple-900">Balance disponible</p>
            <p className="text-2xl font-bold text-purple-700">
              <Money amount={balance} />
            </p>
            <p className="mt-1 text-xs text-purple-600">Actualizado ahora</p>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <InsightBlock
          title="Alertas importantes"
          tone="amber"
          icon={<AlertTriangle className="h-6 w-6 text-amber-600" />}
          items={alerts}
        />
      )}

      {praises.length > 0 && (
        <InsightBlock
          title="Muy bien"
          tone="green"
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          items={praises}
        />
      )}

      {tips.length > 0 ? (
        <InsightBlock
          title="Consejos personalizados"
          tone="blue"
          icon={<Lightbulb className="h-6 w-6 text-blue-600" />}
          items={tips}
        />
      ) : (
        <EmptyState title="Sin consejos por ahora." body="Sigue registrando tus gastos para obtener recomendaciones más precisas." />
      )}

      {donutData.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-bold text-slate-900">Categorías con mayor gasto</h2>
          <div className="space-y-3">
            {donutData.slice(0, 5).map((cat: { name: string; value: number }, idx: number) => (
              <div key={`${cat.name}-${idx}`} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                    <span className="text-sm font-bold text-slate-900">
                      <Money amount={cat.value} />
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500"
                      style={{ width: `${(cat.value / donutData[0].value) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricBar({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: 'ok' | 'warning' | 'danger' | 'info';
}) {
  const className =
    tone === 'danger'
      ? 'bg-red-500'
      : tone === 'warning'
        ? 'bg-amber-500'
        : tone === 'info'
          ? 'bg-blue-500'
          : 'bg-green-500';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="text-sm font-bold text-slate-900">{value}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full transition-all ${className}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function InsightBlock({
  title,
  tone,
  icon,
  items
}: {
  title: string;
  tone: 'amber' | 'green' | 'blue';
  icon: ReactNode;
  items: CoachInsight[];
}) {
  const boxTone =
    tone === 'amber'
      ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50'
      : tone === 'green'
        ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'
        : 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50';

  const itemTone =
    tone === 'amber'
      ? 'border-amber-200'
      : tone === 'green'
        ? 'border-green-200'
        : 'border-blue-200';

  return (
    <div className={`rounded-3xl border-2 p-6 shadow-lg ${boxTone}`}>
      <div className="mb-4 flex items-center gap-3">
        {icon}
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      </div>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={`${item.message}-${idx}`} className={`rounded-xl border bg-white p-4 ${itemTone}`}>
            <p className="mb-1 text-sm font-semibold text-slate-900">{item.message}</p>
            {item.impact ? (
              <p className="text-xs text-slate-600">
                Impacto estimado: <Money amount={item.impact} />
              </p>
            ) : null}
            {item.actionLabel && item.actionUrl ? (
              <a href={item.actionUrl} className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-800">
                {item.actionLabel}
                <ArrowRight className="h-3 w-3" />
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
