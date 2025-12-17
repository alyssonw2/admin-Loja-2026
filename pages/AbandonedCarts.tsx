
import React, { useState } from 'react';
import type { Cart, CartItem } from '../types';
import { ShoppingCartIcon, ChatIcon, TrashIcon, EyeIcon } from '../components/icons/Icons';

interface AbandonedCartsProps {
  carts: Cart[];
}

const AbandonedCarts: React.FC<AbandonedCartsProps> = ({ carts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);

  const getTimeInCart = (updatedAt: string) => {
    const diffMs = new Date().getTime() - new Date(updatedAt).getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (days > 0) return `${days} dia(s) atrás`;
    if (hours > 0) return `${hours} hora(s) atrás`;
    return `${mins} min atrás`;
  };

  const handleRecover = (cart: Cart) => {
    const message = encodeURIComponent(`Olá ${cart.customerName}, vimos que você deixou alguns itens no carrinho da nossa loja. Podemos te ajudar a finalizar a compra? Aproveite o cupom VOLTEI5 para 5% de desconto!`);
    // Simulando que o JID/Telefone é o email ou um campo extra se existisse
    const phone = "5511999999999"; 
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const filteredCarts = carts.filter(cart => 
    cart.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    cart.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Carrinhos</h2>
        <div className="flex gap-4">
            <div className="bg-orange-500/10 text-orange-500 px-4 py-2 rounded-lg border border-orange-500/20 text-sm font-bold">
                {carts.length} Carrinhos Abandonados
            </div>
            <div className="bg-green-500/10 text-green-500 px-4 py-2 rounded-lg border border-green-500/20 text-sm font-bold">
                R$ {carts.reduce((acc, c) => acc + Number(c.total), 0).toFixed(2)} Recuperáveis
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
            <div className="mb-4 relative">
                <input 
                    type="text" 
                    placeholder="Buscar cliente..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                    <th className="p-4 text-gray-600 dark:text-gray-300 text-xs uppercase font-bold">Cliente</th>
                    <th className="p-4 text-gray-600 dark:text-gray-300 text-xs uppercase font-bold text-center">Itens</th>
                    <th className="p-4 text-gray-600 dark:text-gray-300 text-xs uppercase font-bold text-right">Total</th>
                    <th className="p-4 text-gray-600 dark:text-gray-300 text-xs uppercase font-bold text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredCarts.length === 0 ? (
                        <tr><td colSpan={4} className="text-center p-8 text-gray-500">Nenhum carrinho encontrado.</td></tr>
                    ) : (filteredCarts.map((cart) => (
                    <tr key={cart.id} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${selectedCart?.id === cart.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`} onClick={() => setSelectedCart(cart)}>
                        <td className="p-4">
                            <p className="font-bold text-gray-900 dark:text-white">{cart.customerName}</p>
                            <p className="text-xs text-gray-500">{getTimeInCart(cart.updatedAt)} • {cart.customerEmail}</p>
                        </td>
                        <td className="p-4 text-center text-sm">{cart.items.length} unid.</td>
                        <td className="p-4 text-right font-bold text-primary">R$ {Number(cart.total).toFixed(2)}</td>
                        <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={(e) => { e.stopPropagation(); handleRecover(cart); }} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors" title="Recuperar via WhatsApp">
                                    <ChatIcon className="w-4 h-4"/>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setSelectedCart(cart); }} className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
                                    <EyeIcon className="w-4 h-4"/>
                                </button>
                            </div>
                        </td>
                    </tr>
                    )))}
                </tbody>
                </table>
            </div>
        </div>

        <div className="lg:col-span-1">
            {selectedCart ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-8">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <ShoppingCartIcon className="text-primary"/> Itens do Carrinho
                    </h3>
                    <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
                        {selectedCart.items.map((item, idx) => (
                            <div key={idx} className="flex gap-3 items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                                <img src={item.imageUrl} alt={item.productName} className="w-12 h-12 rounded object-cover bg-gray-200"/>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.productName}</p>
                                    <p className="text-xs text-gray-500">{item.quantity}x R$ {Number(item.price).toFixed(2)} {item.size && `• Tam: ${item.size}`}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                        <div className="flex justify-between font-bold text-lg">
                            <span className="text-gray-500">Total:</span>
                            <span className="text-primary">R$ {Number(selectedCart.total).toFixed(2)}</span>
                        </div>
                        <button onClick={() => handleRecover(selectedCart)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
                            <ChatIcon/> Recuperar agora
                        </button>
                        <p className="text-[10px] text-center text-gray-500">
                            A mensagem será aberta em uma nova aba para você revisar e enviar.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center h-full flex flex-col justify-center">
                    <ShoppingCartIcon className="w-12 h-12 mx-auto text-gray-400 mb-4"/>
                    <p className="text-gray-500 font-medium">Selecione um carrinho para ver os detalhes e recuperar.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AbandonedCarts;
