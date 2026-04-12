'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Sparkles, AlertTriangle, TrendingUp, ThumbsUp, Leaf } from 'lucide-react';
import { Money } from '@/components/ui/money';
import { DashboardData } from '@/lib/services/dashboardService';

export function CoachWidget({ data }: { data: DashboardData }) {
  const {
    coachInsights,
    currency,
    avgDailyUse,
    remainingDailySafe,
    last7Days,
    alertMessage,
    monthLabel,
    month
  } = data;

  const [activeIndex, setActiveIndex] = useState(0);
  const hasInsights = coachInsights && coachInsights.length > 0;

  if (!hasInsights) {
    return <StaticCoachWidget data={data} />;
  }

  const activeInsight = coachInsights[activeIndex];
  const nextInsight = () => setActiveIndex((prev) => (prev + 1) % 2);
  const weeklyAvg = Math.round(last7Days.reduce((acc, day) => acc + day.value, 0) / 7);
  const topInsights = coachInsights.slice(0, 3);

  const getIcon = (type: string) => {
    if (type === 'alert') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    if (type === 'praise') return <ThumbsUp className="h-4 w-4 text-emerald-500" />;
    return <Sparkles className="h-4 w-4 text-indigo-500" />;
  };

  const coachHref = `/app/coach?ym=${month.yearMonth}`;

  return (
    <div className="card-soft lg:col-span-3 bg-gradient-to-br from-[#E4F0EB] via-[#EDF5F1] to-[#DEEAE4] text-[#2D2D2D] border border-[#D5E3DC] p-4 sm:p-6 min-h-[220px] relative overflow-hidden">
      <div className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-[#7CC9B1]/20 blur-3xl" />
      <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-[#E2A79E]/20 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-[#E5F3ED] text-[#3D8F79] shadow-inner">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#3D8F79]">Coach IA</div>
              <div className="text-xs sm:text-sm text-[#6E827A]">Resumen · {monthLabel}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 w-1.5 rounded-full ${idx === activeIndex ? 'bg-[#3D8F79]' : 'bg-[#CFE3DA]'}`}
              />
            ))}
          </div>
        </div>

        {activeIndex === 0 ? (
          <div className="mt-4 sm:mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-2xl border border-[#E2ECE7] bg-white/70 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-[#3D8F79]">Estado actual</div>
                <Sparkles className="h-4 w-4 text-[#3D8F79]" />
              </div>
              <div className="mt-2 text-sm font-medium text-[#2D2D2D] leading-snug">
                {alertMessage}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 text-xs text-[#6E827A] sm:grid-cols-2">
                <div className="rounded-xl bg-[#F6FBF8] border border-[#E2ECE7] p-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#3D8F79]">Diario medio</div>
                  <div className="mt-1 font-semibold text-[#2D2D2D]">
                    <Money amount={avgDailyUse} currency={currency} />
                  </div>
                </div>
                <div className="rounded-xl bg-[#F6FBF8] border border-[#E2ECE7] p-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#3D8F79]">Semanal medio</div>
                  <div className="mt-1 font-semibold text-[#2D2D2D]">
                    <Money amount={weeklyAvg} currency={currency} />
                  </div>
                </div>
                <div className="rounded-xl bg-[#F6FBF8] border border-[#E2ECE7] p-3 col-span-2">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#3D8F79]">Ritmo seguro</div>
                  <div className="mt-1 font-semibold text-[#2D2D2D]">
                    <Money amount={remainingDailySafe} currency={currency} />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E2ECE7] bg-white/70 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-[#3D8F79]">Insight destacado</div>
                <TrendingUp className="h-4 w-4 text-[#3D8F79]" />
              </div>
              <div className="mt-3 flex items-start gap-3 text-xs text-[#6E827A]">
                <div className="mt-0.5 shrink-0 p-1.5 rounded-full bg-[#E5F3ED]">
                  {getIcon(activeInsight.type)}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#2D2D2D]">
                    {activeInsight.message}
                  </div>
                  {activeInsight.impact && (
                    <div className="mt-1 text-[11px] text-[#6E827A]">
                      Impacto: <Money amount={Math.abs(activeInsight.impact)} currency={currency} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 sm:mt-5 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-2xl border border-[#E2ECE7] bg-white/70 p-4">
              <div className="text-xs font-semibold text-[#3D8F79]">Consejos activos</div>
              <div className="mt-3 grid gap-3">
                {topInsights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs text-[#6E827A]">
                    <div className="mt-0.5 shrink-0 p-1.5 rounded-full bg-[#E5F3ED]">
                      {getIcon(insight.type)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#2D2D2D]">
                        {insight.message}
                      </div>
                      {insight.impact && (
                        <div className="mt-1 text-[11px] text-[#6E827A]">
                          Impacto: <Money amount={Math.abs(insight.impact)} currency={currency} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#E2ECE7] bg-white/70 p-4">
              <div className="text-xs font-semibold text-[#3D8F79]">Propuesta IA</div>
              <p className="mt-2 text-sm text-[#2D2D2D]">
                Reduce superfluos esta semana y mantén el ritmo seguro. Te propongo revisar
                las categorías con mayor impacto en los últimos 7 días.
              </p>
              <div className="mt-3 rounded-xl bg-[#F6FBF8] border border-[#E2ECE7] p-3 text-xs text-[#6E827A]">
                Gasto diario seguro: <Money amount={remainingDailySafe} currency={currency} />.
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Link
            href={coachHref}
            className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-[#0F1C19] bg-[#8FD7C1] hover:opacity-90 text-center"
          >
            Estadísticas Coach IA
          </Link>

          {coachInsights.length > 1 && (
            <button
              onClick={nextInsight}
              className="shrink-0 p-2 rounded-xl bg-[#1C2E27] text-[#7FBDAA] hover:bg-[#2A4038]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StaticCoachWidget({ data }: { data: DashboardData }) {
  const {
    projectedRemaining,
    currency,
    dailyAdjustment,
    avgDailyUse,
    remainingDailySafe,
    last7Days,
    monthLabel
  } = data;

  const weeklyAvg = Math.round(last7Days.reduce((acc, day) => acc + day.value, 0) / 7);

  return (
    <div className="card-soft lg:col-span-3 bg-gradient-to-br from-[#0E1C18] via-[#0F221C] to-[#122A22] text-white border border-[#1D3A31] p-4 sm:p-6">
      <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#7FBDAA]">Coach IA</div>
      <div className="mt-1 text-xs text-[#9FC0B4]">Resumen · {monthLabel}</div>
      <div className="mt-3 text-sm text-white">
        {projectedRemaining < 0 ? (
          <>Con el ritmo actual cerrarás en <Money amount={projectedRemaining} currency={currency} />.</>
        ) : (
          'Vas bien. Mantener el ritmo te ayuda a cerrar en positivo.'
        )}
        <div className="mt-2 text-xs text-[#9FC0B4]">
          {dailyAdjustment > 0 ? (
            <>Ajusta un gasto variable y rescata <Money amount={dailyAdjustment * 7} currency={currency} /> esta semana.</>
          ) : (
            'Sigue registrando tus gastos con calma.'
          )}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#A9CFC1]">
        <div className="rounded-xl bg-[#0F1C19] border border-[#1D3A31] p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#7FBDAA]">Diario</div>
          <div className="mt-1 font-semibold text-white">
            <Money amount={avgDailyUse} currency={currency} />
          </div>
        </div>
        <div className="rounded-xl bg-[#0F1C19] border border-[#1D3A31] p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#7FBDAA]">Semanal</div>
          <div className="mt-1 font-semibold text-white">
            <Money amount={weeklyAvg} currency={currency} />
          </div>
        </div>
        <div className="rounded-xl bg-[#0F1C19] border border-[#1D3A31] p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#7FBDAA]">Ritmo</div>
          <div className="mt-1 font-semibold text-white">
            <Money amount={remainingDailySafe} currency={currency} />
          </div>
        </div>
      </div>
    </div>
  );
}
