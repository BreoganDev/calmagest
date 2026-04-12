import { Money } from '@/components/ui/money';
import { DashboardData } from "@/lib/services/dashboardService";

export function InsightCard({ data }: { data: DashboardData }) {
    const {
        insightMessage,
        dailyAdjustment,
        currency
    } = data;

    return (
        <div className="card-soft lg:col-span-5 lg:row-span-2 border border-border p-5" style={{ backgroundColor: '#EAF7F2' }}>
            <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#2F7C66]">Insight del día</div>
                <span className="text-[#2F7C66]">✦</span>
            </div>
            <div className="mt-3 text-base leading-relaxed text-[#2F7C66]">
                {insightMessage}
            </div>
            {dailyAdjustment > 0 ? (
                <div className="mt-3 rounded-2xl border border-border bg-white/80 px-5 py-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2F7C66]">Ajuste recomendado</div>
                    <div className="mt-2 text-lg font-semibold text-foreground">Ahorrar <Money amount={dailyAdjustment} currency={currency} /> al día.</div>
                    <div className="mt-3 text-xs text-[#2F7C66]">Sugerencia inteligente basada en tu ritmo.</div>
                </div>
            ) : null}
        </div>
    );
}
