
import React, { useState } from 'react';
import type { Cart } from '../types';
import { ShoppingCartIcon } from '../components/icons/Icons';

interface AbandonedCartsProps {
  carts: Cart[];
}

const AbandonedCarts: React.FC<AbandonedCartsProps> = ({ carts }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Helper function to calculate time since abandonment
  const getTimeInCart = (updatedAt: string) => {
    const now = new Date();
    const updated = new Date(updatedAt);
    const diffMs = now.getTime() - updated.getTime();
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays > 0) return `${diffDays} dia(s) atrás`;
    if (diffHours > 0) return `${diffHours} hora(s) atrás`;
    return `${diffMins} minuto(s) atrás`;
  };

  const filteredCarts = carts.filter(cart => 
    cart.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    cart.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Carrinhos Abandonados</h2>

      <div className="mb-6 relative">
        <input 
            type="text" 
            placeholder="Buscar por cliente ou e-mail..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3 p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="p-4 text-gray-600 dark:text-gray-300">Cliente</th>
              <th className="p-4 text-gray-600 dark:text-gray-300">Itens</th>
              <th className="p-4 text-gray-600 dark:text-gray-300">Total</th>
              <th className="p-4 text-gray-600 dark:text-gray-300">Tempo no Carrinho</th>
              <th className="p-4 text-gray-600 dark:text-gray-300 w-24">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredCarts.length === 0 ? (
                <tr>
                    <td colSpan={5} className="text-center p-8 text-gray-500 dark:text-gray-400">
                        Nenhum carrinho abandonado encontrado.
                    </td>
                </tr>
            ) : (filteredCarts.map((cart) => (
              <tr key={cart.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-4">
                    <p className="font-medium text-gray-900 dark:text-white">{cart.customerName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{cart.customerEmail}</p>
                </td>
                <td className="p-4 text-gray-900 dark:text-white">
                    <div className="flex flex-col">
                        <span className="font-medium">{cart.items.length} produto(s)</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {cart.items.map(i => i.productName).join(', ')}
                        </span>
                    </div>
                </td>
                <td className="p-4 font-bold text-gray-900 dark:text-white">
                    R$ {Number(cart.total).toFixed(2)}
                </td>
                <td className="p-4 text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded text-xs font-semibold">
                        {getTimeInCart(cart.updatedAt)}
                    </span>
                </td>
                <td className="p-4">
                    <button className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" title="Ver detalhes">
                        <ShoppingCartIcon className="w-5 h-5" />
                    </button>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AbandonedCarts;
