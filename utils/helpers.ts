import React from 'react';
import { OrderStatus, OrderOrigin } from '../types';
import { GlobeAltIcon, ShoppingCartIcon, ChatIcon } from '../components/icons/Icons';

export const getStatusColorClass = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.Pending: return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-400';
    case OrderStatus.Processing: return 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400';
    case OrderStatus.Shipped: return 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-400';
    case OrderStatus.Delivered: return 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400';
    case OrderStatus.Canceled: return 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400';
    default: return 'bg-gray-100 dark:bg-gray-500/20 text-gray-800 dark:text-gray-400';
  }
};

export const getOriginIcon = (origin: OrderOrigin): React.ReactElement | null => {
    switch(origin) {
        case OrderOrigin.Site:
            return React.createElement('span', { title: 'Site' }, React.createElement(GlobeAltIcon, { className: 'w-5 h-5 text-blue-600 dark:text-blue-400' }));
        case OrderOrigin.MercadoLivre:
            return React.createElement('span', { title: 'Mercado Livre' }, React.createElement(ShoppingCartIcon, { className: 'w-5 h-5 text-yellow-500 dark:text-yellow-400' }));
        case OrderOrigin.Whatsapp:
            return React.createElement('span', { title: 'Whatsapp' }, React.createElement(ChatIcon, { className: 'w-5 h-5 text-green-600 dark:text-green-400' }));
        default:
            return null;
    }
}