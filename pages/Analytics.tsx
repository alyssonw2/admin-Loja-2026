import React from 'react';
// FIX: 'AnalyticsPeriod' is a value (enum) and should not be imported as a type.
import { AnalyticsPeriod } from '../types';
import type { AnalyticsData } from '../types';
import AnalyticsCard from '../components/AnalyticsCard';
import SalesChart from '../components/SalesChart';
import ChannelComparisonChart from '../components/ChannelComparisonChart';
import { EyeIcon, DollarSignIcon, ArrowUturnLeftIcon, CustomerIcon, ChatIcon, TicketIcon, RepeatUserIcon } from '../components/icons/Icons';

interface AnalyticsProps {
  data: AnalyticsData;
  period: AnalyticsPeriod;
  setPeriod: (period: AnalyticsPeriod) => void;
  theme: 'light' | 'dark';
}

const Analytics: React.FC<AnalyticsProps> = ({ data, period, setPeriod, theme }) => {
    
    const kpiConfig = [
        { key: 'accesses', label: 'Acessos', icon: EyeIcon, format: (v: number) => v.toLocaleString('pt-BR') },
        { key: 'sales', label: 'Vendas', icon: DollarSignIcon, format: (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
        { key: 'returns', label: 'Devoluções', icon: ArrowUturnLeftIcon, format: (v: number) => v.toString() },
        { key: 'newCustomers', label: 'Clientes Novos', icon: CustomerIcon, format: (v: number) => v.toLocaleString('pt-BR') },
        { key: 'whatsappContacts', label: 'Contatos WhatsApp', icon: ChatIcon, format: (v: number) => v.toLocaleString('pt-BR') },
        { key: 'couponsUsed', label: 'Cupons Utilizados', icon: TicketIcon, format: (v: number) => v.toLocaleString('pt-BR') },
        { key: 'recurringCustomers', label: 'Recorrência de Clientes', icon: RepeatUserIcon, format: (v: number) => `${v.toFixed(1)}%` },
    ];

    const chartTitle = `Comparativo de Vendas (${period})`;

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Análises de Desempenho</h2>
                <div>
                    <label htmlFor="period-select" className="sr-only">Selecionar Período</label>
                    <select
                        id="period-select"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
                        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md py-2 px-4 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        {Object.values(AnalyticsPeriod).map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {kpiConfig.map(kpi => (
                    <AnalyticsCard
                        key={kpi.key}
                        title={kpi.label}
                        value={kpi.format(data.metrics[kpi.key as keyof typeof data.metrics].value)}
                        change={data.metrics[kpi.key as keyof typeof data.metrics].change}
                        icon={kpi.icon}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SalesChart data={data.chart} title={chartTitle} theme={theme} />
              <ChannelComparisonChart data={data.channelDistribution} title="Distribuição por Canal" theme={theme} />
            </div>
        </div>
    );
};

export default Analytics;