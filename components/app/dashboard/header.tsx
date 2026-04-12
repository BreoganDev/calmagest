import { DashboardData } from "@/lib/services/dashboardService";

export function DashboardHeader({ data }: { data: DashboardData }) {
    const {
        dayOfMonth,
        daysInMonth,
        alertLevel,
        alertTitle,
        spentPercent
    } = data;

    return (
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    Visión general
                </div>
                <div className="mt-2 text-3xl md:text-4xl font-semibold text-foreground">
                    Resumen · <span className="text-muted-foreground">día {dayOfMonth} de {daysInMonth} días</span>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">Claridad sin culpa, enfoque en futuro financiero.</div>
            </div>
            <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${alertLevel === 'critico'
                        ? 'border-[#EFCFC3] bg-[#F7E7E0] text-[#B16A59]'
                        : alertLevel === 'alerta'
                            ? 'border-[#EFCFC3] bg-[#F7E7E0] text-[#8F6B5B]'
                            : 'border-[#CFE7E1] bg-[#EAF4F1] text-[#2F7C66]'
                    }`}>
                    <span className="h-2 w-2 rounded-full bg-current/70" />
                    {alertTitle}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-[#F7F4EF] px-4 py-2 text-sm font-semibold">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--rd-primary)' }} />
                    Consumo {spentPercent}%
                </span>
            </div>
        </div>
    );
}
