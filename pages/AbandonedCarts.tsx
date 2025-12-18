
import React, { useState, useMemo } from 'react';
import type { Cart, CartItem } from '../types';
import { ShoppingCartIcon, ChatIcon, TrashIcon, EyeIcon } from '../components/icons/Icons';

interface AbandonedCartsProps {
  carts: Cart[];
  onViewDetail?: (cart: Cart) => void;
  onRecoverCart?: (jid: string, message: string) => void;
}

const AbandonedCarts: React.FC<AbandonedCartsProps> = ({ carts, onViewDetail, onRecoverCart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCartId, setSelectedCartId] = useState<string | null>(null);

  const groupedCarts = useMemo(() => {
    const map = new Map<string, Cart>();

    carts.forEach(cart => {
        const key = cart.customerId || cart.customerEmail;
        if (map.has(key)) {
            const existing = map.get(key)!;
            
            const mergedItemsMap = new Map<string, CartItem>();
            [...existing.items, ...cart.items].forEach(item => {
                const itemKey = `${item.productId}-${item.size || 'unique'}`;
                if (mergedItemsMap.has(itemKey)) {
                    const found = mergedItemsMap.get(itemKey)!;
                    mergedItemsMap.set(itemKey, {
                        ...found,
                        quantity: found.quantity + item.quantity
                    });
                } else {
                    mergedItemsMap.set(itemKey, { ...item });
                }
            });

            const updatedItems = Array.from(mergedItemsMap.values());
            const updatedTotal = updatedItems.reduce((sum, i) => sum + (Number(i.price) * i.quantity), 0);
            const latestUpdate = new Date(cart.updatedAt) > new Date(existing.updatedAt) ? cart.updatedAt : existing.updatedAt;

            map.set(key, {
                ...existing,
                items: updatedItems,
                total: updatedTotal,
                updatedAt: latestUpdate
            });
        } else {
            map.set(key, { ...cart });
        }
    });

    return Array.from(map.values());
  }, [carts]);

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
    const message = `Olá ${cart.customerName}, vimos que você deixou alguns itens interessantes no carrinho da nossa loja. Podemos te ajudar a finalizar sua escolha? Aproveite o cupom VOLTEI5 para 5% de desconto em sua compra!`;
    
    // Se tivermos a prop de recuperação interna, usamos ela. Caso contrário, fallback para link externo.
    if (onRecoverCart) {
        // Assume que customerId contém o JID ou número se disponível, caso contrário tenta inferir.
        // Se o sistema tiver integração real, o customerId/JID estaria vinculado.
        const jid = cart.customerId.includes('@') ? cart.customerId : `${cart.customerId.replace(/\D/g, '')}@s.whatsapp.net`;
        onRecoverCart(jid, message);
    } else {
        const encodedMsg = encodeURIComponent(message);
        const phone = "5511999999999"; 
        window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
    }
  };

  const filteredCarts = groupedCarts.filter(cart => 
    cart.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    cart.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCart = useMemo(() => {
    return groupedCarts.find(c => (c.customerId || c.customerEmail) === selectedCartId) || null;
  }, [groupedCarts, selectedCartId]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Carrinhos</h2>
            <p className="text-sm text-gray-500">Carrinhos unificados por cliente para melhor acompanhamento.</p>
        </div>
        <div className="flex gap-4">
            <div className="bg-orange-500/10 text-orange-500 px-4 py-2 rounded-lg border border-orange-500/20 text-sm font-bold">
                {groupedCarts.length} Clientes com Carrinho
            </div>
            <div className="bg-green-500/10 text-green-500 px-4 py-2 rounded-lg border border-green-500/20 text-sm font-bold">
                R$ {groupedCarts.reduce((acc, c) => acc + Number(c.total), 0).toFixed(2)} Total Abandonado
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
            <div className="mb-4 relative">
                <input 
                    type="text" 
                    placeholder="Buscar por cliente ou e-mail..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
                />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                    <th className="p-4 text-gray-600 dark:text-gray-300 text-xs uppercase font-bold">Cliente</th>
                    <th className="p-4 text-gray-600 dark:text-gray-300 text-xs uppercase font-bold text-center">Itens Totais</th>
                    <th className="p-4 text-gray-600 dark:text-gray-300 text-xs uppercase font-bold text-right">Valor Unificado</th>
                    <th className="p-4 text-gray-600 dark:text-gray-300 text-xs uppercase font-bold text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredCarts.length === 0 ? (
                        <tr><td colSpan={4} className="text-center p-12 text-gray-500">Nenhum carrinho encontrado.</td></tr>
                    ) : (filteredCarts.map((cart) => {
                        const cartId = cart.customerId || cart.customerEmail;
                        return (
                            <tr 
                                key={cartId} 
                                className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${selectedCartId === cartId ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`} 
                                onClick={() => setSelectedCartId(cartId)}
                            >
                                <td className="p-4">
                                    <p className="font-bold text-gray-900 dark:text-white">{cart.customerName}</p>
                                    <p className="text-xs text-gray-500">Última atualização: {getTimeInCart(cart.updatedAt)} • {cart.customerEmail}</p>
                                </td>
                                <td className="p-4 text-center text-sm font-medium dark:text-gray-300">
                                    {cart.items.reduce((acc, i) => acc + i.quantity, 0)} unid.
                                </td>
                                <td className="p-4 text-right font-bold text-primary">R$ {Number(cart.total).toFixed(2)}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleRecover(cart); }} 
                                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors" 
                                            title="Recuperar via WhatsApp"
                                        >
                                            <ChatIcon className="w-4 h-4"/>
                                        </button>
                                        <button 
                                            onClick={(e) => { 
                                              e.stopPropagation(); 
                                              if (onViewDetail) onViewDetail(cart);
                                              else setSelectedCartId(cartId); 
                                            }} 
                                            className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                                        >
                                            <EyeIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    }))}
                </tbody>
                </table>
            </div>
        </div>

        <div className="lg:col-span-1">
            {selectedCart ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-8 border border-gray-100 dark:border-gray-700 animate-fade-in">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ShoppingCartIcon className="text-primary"/> Itens Unificados
                        </h3>
                        <button onClick={() => setSelectedCartId(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
                    </div>
                    
                    <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <p className="text-xs font-bold text-primary uppercase">Cliente</p>
                        <p className="text-sm font-medium dark:text-white">{selectedCart.customerName}</p>
                    </div>

                    <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedCart.items.map((item, idx) => (
                            <div key={idx} className="flex gap-3 items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all">
                                <img src={item.imageUrl} alt={item.productName} className="w-14 h-14 rounded-md object-cover bg-gray-200 border border-gray-300 dark:border-gray-600"/>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.productName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        <span className="font-bold text-primary">{item.quantity}x</span> R$ {Number(item.price).toFixed(2)}
                                    </p>
                                    {item.size && (
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-[10px] font-bold rounded uppercase">Tam: {item.size}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                        <div className="flex justify-between font-bold text-xl">
                            <span className="text-gray-500 dark:text-gray-400">Total:</span>
                            <span className="text-primary">R$ {Number(selectedCart.total).toFixed(2)}</span>
                        </div>
                        <button onClick={() => handleRecover(selectedCart)} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95">
                            <ChatIcon/> Recuperar agora no Chat
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-100 dark:bg-gray-800/30 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center h-full flex flex-col justify-center animate-pulse">
                    <div className="bg-white dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <ShoppingCartIcon className="w-8 h-8 text-gray-400"/>
                    </div>
                    <p className="text-gray-500 font-medium">Selecione um cliente na lista para ver o carrinho unificado.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AbandonedCarts;
