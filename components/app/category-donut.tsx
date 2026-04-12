'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#E7A9B4', '#F6D6DC', '#B85C6B', '#6FAF8A', '#E9E6E4'];

const tooltipStyle = {
  background: '#FFFFFF',
  borderRadius: 16,
  border: '1px solid #E5E1DF',
  fontSize: 12
};

export function CategoryDonut({
  data,
  currency
}: {
  data: { name: string; value: number }[];
  currency: string;
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number) => [`${(value / 100).toFixed(0)} ${currency}`, '']}
          />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
