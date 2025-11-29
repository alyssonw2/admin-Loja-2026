import React from 'react';
import type { Order, AnalyticsChartDataPoint } from '../types';
import DashboardCard from '../components/DashboardCard';
import SalesChart from '../components/SalesChart';
import RecentOrdersTable from '../components/RecentOrdersTable';
import { DollarSignIcon, NewOrderIcon, CustomerIcon, ShipmentIcon } from '../components/icons/Icons';

interface DashboardProps {
    kpi: {
        totalSales: number;
        newOrders: number;
        totalCustomers: number;
        pendingShipments: number;
    };
    recentOrders: Order[];
    salesData: AnalyticsChartDataPoint[];
    theme: 'light' | 'dark';
}

const Dashboard: React.FC<DashboardProps> = ({ kpi, recentOrders, salesData, theme }) => {
  return (
    <div className="p-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Vendas Totais" value={`R$ ${kpi.totalSales.toFixed(2)}`} icon={DollarSignIcon} color="bg-green-500" />
        <DashboardCard title="Novos Pedidos" value={kpi.newOrders} icon={NewOrderIcon} color="bg-blue-500" />
        <DashboardCard title="Total de Clientes" value={kpi.totalCustomers} icon={CustomerIcon} color="bg-yellow-500" />
        <DashboardCard title="Envios Pendentes" value={kpi.pendingShipments} icon={ShipmentIcon} color="bg-indigo-500" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <SalesChart data={salesData} title="Vendas (Mês Atual)" theme={theme} />
        </div>
        <div>
            <RecentOrdersTable orders={recentOrders} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;