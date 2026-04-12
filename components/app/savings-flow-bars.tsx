'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const tooltipStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.96)',
  borderRadius: 16,
  border: '1px solid rgba(229,225,223,1)',
  fontSize: 12
};

function formatCents(value: number, currency: string) {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  return `${sign}${(abs / 100).toFixed(0)} ${currency}`;
}

export function SavingsFlowBars({
  data,
  currency
}: {
  data: { label: string; savingsNet: number; invest: number }[];
  currency: string;
}) {
  return (
    <div className="h-56 sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.18)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            cursor={{ fill: 'rgba(231,169,180,0.12)' }}
            contentStyle={tooltipStyle}
            formatter={(v: number, name: string) => {
              const label = name === 'savingsNet' ? 'Ahorro neto' : 'Inversion';
              return [formatCents(Number(v), currency), label];
            }}
          />
          <Bar dataKey="savingsNet" fill="#6BA89E" radius={[10, 10, 0, 0]} />
          <Bar dataKey="invest" fill="#E7A9B4" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

