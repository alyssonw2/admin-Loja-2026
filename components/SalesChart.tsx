import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { AnalyticsChartDataPoint } from '../types';

interface SalesChartProps {
  data: AnalyticsChartDataPoint[];
  title: string;
  theme: 'light' | 'dark';
}

const SalesChart: React.FC<SalesChartProps> = ({ data, title, theme }) => {
  const gridColor = theme === 'dark' ? '#4d4d4d' : '#e5e7eb';
  const textColor = theme === 'dark' ? '#9e9e9e' : '#6b7280';
  const tooltipBg = theme === 'dark' ? '#1e1e1e' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? '#4d4d4d' : '#e5e7eb';
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-96">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="colorAtual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
             <linearGradient id="colorAnterior" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6b6b6b" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#6b6b6b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="name" stroke={textColor} />
          <YAxis stroke={textColor} tickFormatter={(value) => new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(value as number)} />
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
          <Area type="monotone" dataKey="anterior" name="Período Anterior" stroke="#6b6b6b" fillOpacity={1} fill="url(#colorAnterior)" />
          <Area type="monotone" dataKey="atual" name="Período Atual" stroke="#6366f1" fillOpacity={1} fill="url(#colorAtual)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;