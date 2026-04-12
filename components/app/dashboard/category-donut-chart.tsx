'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface CategoryData {
  name: string;
  value: number;
}

interface CategoryDonutChartProps {
  data: CategoryData[];
}

const COLORS = [
  'var(--rd-rose)',
  'var(--rd-secondary)',
  'var(--rd-calm-green)',
  'var(--rd-rose-deep)',
  '#8B5CF6',
  '#3B82F6',
  '#F59E0B',
  '#EC4899',
  '#F97316'
];

const tooltipStyle = {
  background: '#FFFFFF',
  borderRadius: 16,
  border: '1px solid #E5E1DF',
  fontSize: 12
};

export function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-border bg-card/95 p-4 sm:p-6 shadow-lg backdrop-blur-sm">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rd-gray-100">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-sm font-medium text-rd-gray-500">No hay datos para mostrar</p>
        </div>
      </div>
    );
  }

  const topItems = data.slice(0, 7);
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="w-full rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rd-rose/20 to-rd-rose-deep/20">
          <svg className="h-5 w-5 text-rd-rose" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3v18M5 8h6m2 8h6" />
          </svg>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Categorías</div>
          <div className="text-lg font-semibold">Distribución</div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="h-56 sm:h-64 lg:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [`${(value / 100).toFixed(0)} €`, '']}
              />
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid gap-3">
          <div className="text-xs font-semibold text-muted-foreground">Top categorías</div>
          {topItems.map((item, idx) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white/70 px-3 py-2 text-xs text-slate-700"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="truncate">{item.name}</span>
              </div>
              <span className="text-slate-500">{(item.value / 100).toFixed(0)} €</span>
            </div>
          ))}

          <div className="grid gap-2 pt-2">
            {topItems.slice(0, 4).map((item, idx) => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={`${item.name}-bar`} className="grid gap-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span className="truncate">{item.name}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${Math.max(4, pct)}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}