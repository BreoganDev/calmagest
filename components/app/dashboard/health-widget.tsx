import { Money } from '@/components/ui/money';
import { DashboardData } from "@/lib/services/dashboardService";

export function HealthWidget({ data }: { data: DashboardData }) {
    const {
        healthDisplayPercent,
        daysLeft,
        idealDaily,
        currency
    } = data;

    return (
        <div className="card-soft lg:col-span-4 bg-white border border-border p-5">
            <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Salud del mes</div>
                <div className="text-lg font-semibold text-[var(--rd-primary)]">{healthDisplayPercent}%</div>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-[#E6E1DA] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.max(6, healthDisplayPercent)}%`, background: 'linear-gradient(to right, #59C783, #6FB6AA)' }} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#F7F4EF] border border-border p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">días restantes</div>
                    <div className="mt-2 text-sm font-semibold text-foreground">{daysLeft} días</div>
                </div>
                <div className="rounded-2xl bg-[#F7F4EF] border border-border p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Ritmo ideal</div>
                    <div className="mt-2 text-sm font-semibold text-foreground"><Money amount={idealDaily} currency={currency} /></div>
                </div>
            </div>
        </div>
    );
}
