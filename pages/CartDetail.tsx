
import React, { useMemo } from 'react';
import type { Cart } from '../types';
import { ChevronLeftIcon, ShoppingCartIcon, ChatIcon, CustomerIcon, CalendarIcon } from '../components/icons/Icons';
import SankeyFlowChart from '../components/SankeyFlowChart';

interface CartDetailProps {
  cart: Cart | null;
  onBack: () => void;
  theme: 'light' | 'dark';
  onRecoverCart?: (jid: string, message: string) => void;
}

const CartDetail: React.FC<CartDetailProps> = ({ cart, onBack, theme, onRecoverCart }) => {
  if (!cart) return null;

  const items = useMemo(() => {
    if (!cart?.items) return [];
    if (Array.isArray(cart.items)) return cart.items;
    try {
      if (typeof cart.items === 'string') return JSON.parse(cart.items);
    } catch (e) {
      console.error("Failed to parse cart items", e);
    }
    return [];
  }, [cart?.items]);

  const handleRecover = () => {
    const message = `Olá ${cart.customerName}, vimos que você deixou itens incríveis no carrinho! Use o cupom VOLTEI5 para 5% OFF e finalize agora.`;
    
    if (onRecoverCart) {
        const jid = cart.customerId.includes('@') ? cart.customerId : `${cart.customerId.replace(/\D/g, '')}@s.whatsapp.net`;
        onRecoverCart(jid, message);
    } else {
        const phone = "5511999999999"; 
        const encodedMsg = encodeURIComponent(message);
        window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-primary transition-colors">
            <ChevronLeftIcon className="w-8 h-8" />
          </button>
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-indigo-50">Análise da Jornada</h2>
            <p className="text-gray-600 dark:text-gray-400">Rastreamento de passos até o abandono.</p>
          </div>
        </div>
        <button onClick={handleRecover} className="bg-green-600 hover:bg-green-700 text-indigo-50 font-bold py-3 px-8 rounded-xl flex items-center gap-2 shadow-lg shadow-green-600/20 transition-all active:scale-95">
          <ChatIcon /> Recuperar via WhatsApp
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-indigo-50 mb-6 flex items-center gap-2">
               Perfil do Cliente
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(cart.customerName)}&background=random`} className="w-16 h-16 rounded-full border border-gray-100 dark:border-gray-600" />
                <div>
                  <p className="font-bold text-gray-900 dark:text-indigo-50">{cart.customerName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{cart.customerEmail}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Último Acesso:</span>
                <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                   {new Date(cart.updatedAt).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-indigo-50 mb-6 flex items-center gap-2">
               Conteúdo do Carrinho
            </h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-transparent hover:border-primary/20 transition-all">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.productName}</p>
                    <p className="text-xs text-gray-500">Qtd: {item.quantity} • {item.size}</p>
                    <p className="text-sm font-bold text-primary">R$ {Number(item.price).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-gray-500 text-center py-4">Carrinho vazio.</p>}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-end">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Total Acumulado</span>
                <span className="text-2xl font-black text-primary">R$ {Number(cart.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-indigo-50">Fluxo de Conversão (Sankey)</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Visualização volumétrica da jornada do usuário.</p>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">ALTA RETENÇÃO</span>
              </div>
            </div>
            
            <SankeyFlowChart theme={theme} />

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Visitas', val: '1.2k', color: 'bg-orange-400' },
                { label: 'Interesse', val: '45%', color: 'bg-orange-500' },
                { label: 'Abandono', val: '26%', color: 'bg-orange-500' },
                { label: 'Conversão', val: '15%', color: 'bg-green-500' },
              ].map((m, i) => (
                <div key={i} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                  <div className={`w-2 h-2 rounded-full ${m.color} mb-2`}></div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{m.label}</p>
                  <p className="text-xl font-black text-gray-900 dark:text-indigo-50">{m.val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-6 rounded-2xl">
            <h4 className="font-bold text-primary mb-2 flex items-center gap-2">💡 Insights da IA</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              O cliente demonstrou alto interesse na categoria <b className="text-gray-900 dark:text-indigo-50">Camisetas</b>, permanecendo 4 minutos na página do produto antes de adicionar ao carrinho. O abandono ocorreu na etapa de <b className="text-gray-900 dark:text-indigo-50">Cálculo de Frete</b>. Recomendamos oferecer um cupom de frete grátis para converter esta venda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartDetail;
