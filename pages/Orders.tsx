import React, { useState, useMemo } from 'react';
import type { Order } from '../types';
import { OrderStatus, OrderOrigin } from '../types';
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ArrowRightIcon } from '../components/icons/Icons';
import { getStatusColorClass, getOriginIcon } from '../utils/helpers';

interface OrdersProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
}

const ITEMS_PER_PAGE = 10;

type SortKey = keyof Order;

const Orders: React.FC<OrdersProps> = ({ orders, onViewOrder }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'date', direction: 'descending' });
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [originFilter, setOriginFilter] = useState<OrderOrigin | ''>('');

  const handleSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const filteredAndSortedOrders = useMemo(() => {
    let filteredOrders = [...orders];

    if (statusFilter) {
      filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
    }
    
    if (originFilter) {
        filteredOrders = filteredOrders.filter(order => order.origin === originFilter);
    }
    
    if (sortConfig !== null) {
      filteredOrders.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return filteredOrders;
  }, [orders, statusFilter, originFilter, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredAndSortedOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const SortableHeader: React.FC<{ sortKey: SortKey; children: React.ReactNode }> = ({ sortKey, children }) => {
    const isSorted = sortConfig?.key === sortKey;
    const direction = sortConfig?.direction;
    return (
      <th className="p-4 text-gray-600 dark:text-gray-300">
        <button onClick={() => handleSort(sortKey)} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white">
          {children}
          {isSorted && (direction === 'ascending' ? <ChevronUpIcon /> : <ChevronDownIcon />)}
        </button>
      </th>
    );
  };
  
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Gerenciar Pedidos</h2>

      <div className="mb-4 flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-4">
            <label htmlFor="status-filter" className="text-gray-700 dark:text-gray-300 font-medium">Filtrar por Status:</label>
            <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as OrderStatus | '');
                  setCurrentPage(1);
                }}
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md py-2 px-3 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
            >
                <option value="">Todos</option>
                {Object.values(OrderStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                ))}
            </select>
             <label htmlFor="origin-filter" className="text-gray-700 dark:text-gray-300 font-medium">Filtrar por Origem:</label>
            <select
                id="origin-filter"
                value={originFilter}
                onChange={(e) => {
                  setOriginFilter(e.target.value as OrderOrigin | '');
                  setCurrentPage(1);
                }}
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md py-2 px-3 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
            >
                <option value="">Todas</option>
                {Object.values(OrderOrigin).map(origin => (
                    <option key={origin} value={origin}>{origin}</option>
                ))}
            </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-4 text-gray-600 dark:text-gray-300">ID do Pedido</th>
                  <th className="p-4 text-gray-600 dark:text-gray-300">Cliente</th>
                  <SortableHeader sortKey="date">Data</SortableHeader>
                  <th className="p-4 text-gray-600 dark:text-gray-300">Origem</th>
                  <th className="p-4 text-gray-600 dark:text-gray-300">Total</th>
                  <SortableHeader sortKey="status">Status</SortableHeader>
                  <th className="p-4 text-gray-600 dark:text-gray-300">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-gray-500 dark:text-gray-400">Nenhum pedido encontrado com os filtros selecionados.</td>
                    </tr>
                ) : (paginatedOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-4 font-medium text-primary">{order.id}</td>
                    <td className="p-4 text-gray-900 dark:text-white">{order.customerName}</td>
                    <td className="p-4 text-gray-500 dark:text-gray-400">{new Date(order.date).toLocaleDateString('pt-BR')}</td>
                    <td className="p-4">{getOriginIcon(order.origin)}</td>
                    <td className="p-4 text-gray-900 dark:text-white">R$ {order.total.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColorClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button onClick={() => onViewOrder(order)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Ver Detalhes</button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                  Página {currentPage} de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                  <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <ArrowRightIcon className="w-5 h-5" />
                  </button>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;