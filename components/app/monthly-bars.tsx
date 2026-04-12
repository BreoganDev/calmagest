'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const tooltipStyle = {
  background: '#FFFFFF',
  borderRadius: 16,
  border: '1px solid #E5E1DF',
  fontSize: 12
};

export function MonthlyBars({
  data,
  currency
}: {
  data: { label: string; budget: number; spent: number; diff: number }[];
  currency: string;
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: 'rgba(231,169,180,0.15)' }}
            contentStyle={tooltipStyle}
            formatter={(value: number) => [`${(value / 100).toFixed(0)} ${currency}`, '']}
          />
          <Bar dataKey="budget" fill="#E7A9B4" radius={[8, 8, 0, 0]} />
          <Bar dataKey="spent" fill="#B85C6B" radius={[8, 8, 0, 0]} />
          <Bar dataKey="diff" fill="#6FAF8A" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
