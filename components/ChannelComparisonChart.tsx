import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import type { ChannelDistributionChartDataPoint } from '../types';
import { OrderOrigin } from '../types';

interface ChannelComparisonChartProps {
  data: ChannelDistributionChartDataPoint[];
  title: string;
  theme: 'light' | 'dark';
}

const COLORS = {
  [OrderOrigin.Site]: '#6366f1',
  [OrderOrigin.MercadoLivre]: '#facc15',
  [OrderOrigin.Whatsapp]: '#4ade80',
};

const ChannelComparisonChart: React.FC<ChannelComparisonChartProps> = ({ data, title, theme }) => {
  const textColor = theme === 'dark' ? '#9e9e9e' : '#6b7280';
  const tooltipBg = theme === 'dark' ? '#1e1e1e' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? '#4d4d4d' : '#e5e7eb';

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-96">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: '0.5rem',
            }}
             labelStyle={{ color: theme === 'dark' ? '#ffffff' : '#111827' }}
            formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
          />
          <Legend wrapperStyle={{ color: textColor, paddingTop: '20px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChannelComparisonChart;