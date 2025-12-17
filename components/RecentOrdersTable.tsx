
import React from 'react';
import type { Order } from '../types';
import { getStatusColorClass, getOriginIcon } from '../utils/helpers';

interface RecentOrdersTableProps {
  orders: Order[];
}

const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({ orders }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Pedidos Recentes</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
              <th className="p-3">ID do Pedido</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Origem</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 5).map((order) => (
              <tr key={order.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-3 font-medium text-primary">{order.id}</td>
                <td className="p-3 text-gray-900 dark:text-white">{order.customerName}</td>
                <td className="p-3">{getOriginIcon(order.origin)}</td>
                <td className="p-3 text-gray-900 dark:text-white">R$ {Number(order.total || 0).toFixed(2)}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColorClass(order.status)}`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrdersTable;
