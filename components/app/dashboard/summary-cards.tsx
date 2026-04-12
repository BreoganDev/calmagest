import Link from 'next/link';
import { formatMoney } from '@/lib/services/moneyService';
import { RemainingSparkline } from '@/components/app/remaining-sparkline';
import { DashboardData } from "@/lib/services/dashboardService";
import { Money } from '@/components/ui/money';

export function SummaryCards({ data }: { data: DashboardData }) {
    const {
        remainingAdjusted,
        currency,
        statusMessage,
        last7Days,
        avgDailyUse,
        remainingDailySafe,
        month,
        totals,
        spendRate,
        netFlow,
        runwayDays
    } = data;

    return (
        <>
            {/* Saldo Restante Card */}
            <div className="card-soft lg:col-span-7 lg:row-span-2 bg-white border border-border p-4 relative overflow-hidden animated-border wave-bg">
                <div className="relative">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Saldo restante</div>
                    <div className="mt-0.5 text-5xl font-semibold text-foreground"><Money amount={remainingAdjusted} currency={currency} /></div>
                    <div className="mt-1 text-base text-muted-foreground">{statusMessage}</div>
                    <div className="mt-2 flex gap-3">
                        <Link
                            href="/app/expenses"
                            className="rounded-2xl px-5 py-2 text-sm font-semibold text-white"
                            style={{ backgroundColor: 'var(--rd-primary)' }}
                        >
                            Ver detalle
                        </Link>
                        <Link
                            href="/app/settings"
                            className="rounded-2xl px-5 py-2 text-sm font-semibold border border-border bg-white"
                        >
                            Ajustar
                        </Link>
                    </div>
                    <div className="mt-3 rounded-2xl bg-[#F7F4EF] border border-border p-4">
                        <RemainingSparkline data={last7Days} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-[#F7F4EF] border border-border p-3">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Gasto díario</div>
                            <div className="mt-2 font-semibold text-foreground"><Money amount={avgDailyUse} currency={currency} /></div>
                        </div>
                        <div className="rounded-2xl bg-[#F7F4EF] border border-border p-3">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Ritmo seguro</div>
                            <div className="mt-2 font-semibold text-foreground"><Money amount={remainingDailySafe} currency={currency} /></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Card */}
            <div className="card-soft lg:col-span-5 bg-white border border-border p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">KPIs clave</div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-[#F7F4EF] border border-border p-3">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Ingresos</div>
                        <div className="mt-2 text-lg font-semibold text-foreground"><Money amount={month.income} currency={currency} /></div>
                        <div className="mt-1 text-xs text-[var(--rd-secondary)]">+4% vs mes ant.</div>
                    </div>
                    <div className="rounded-2xl bg-[#F7F4EF] border border-border p-3">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Gastado</div>
                        <div className="mt-2 text-lg font-semibold" style={{ color: '#B16A59' }}><Money amount={totals.spent} currency={currency} /></div>
                        <div className="mt-2 h-1 rounded-full bg-[#E6E1DA]">
                            <div className="h-full rounded-full" style={{ width: `${Math.max(6, spendRate)}%`, background: 'var(--rd-accent)' }} />
                        </div>
                    </div>
                    <div className="rounded-2xl bg-[#F7F4EF] border border-border p-3">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Neto</div>
                        <div className="mt-2 text-lg font-semibold text-foreground"><Money amount={netFlow} currency={currency} /></div>
                        <div className="mt-1 text-xs text-muted-foreground">Runway {runwayDays} días</div>
                    </div>
                </div>
            </div>
        </>
    );
}
