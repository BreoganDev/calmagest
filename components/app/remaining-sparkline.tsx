'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

const tooltipStyle = {
  background: '#FFFFFF',
  borderRadius: 12,
  border: '1px solid #E2DDD6',
  fontSize: 12,
  padding: '8px 10px'
};

export function RemainingSparkline({
  data
}: {
  data: { label: string; value: number }[];
}) {
  return (
    <div className="h-28">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8A8A8A' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${(value / 100).toFixed(0)} €`, '']}/>
          <Area type="monotone" dataKey="value" stroke="#59C783" fill="#CFE7E1" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
