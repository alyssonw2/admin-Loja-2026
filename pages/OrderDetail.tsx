
import React, { useState, useMemo } from 'react';
import type { Order, Review, OrderEvent, Toast } from '../types';
import { OrderStatus, OrderOrigin } from '../types';
import { ChevronLeftIcon, CheckCircleIcon, StarIcon, DocumentArrowUpIcon } from '../components/icons/Icons';
import { getStatusColorClass, getOriginIcon } from '../utils/helpers';

interface OrderDetailProps {
  order: Order | null;
  reviews: Review[];
  onBack: () => void;
  updateOrder: (order: Order) => void;
  showToast: (message: string, type: Toast['type']) => void;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex">
    {[...Array(5)].map((_, i) => (
      <StarIcon key={i} className="w-5 h-5 text-yellow-400" filled={i < rating} />
    ))}
  </div>
);

const OrderDetail: React.FC<OrderDetailProps> = ({ order, reviews, onBack, updateOrder, showToast }) => {
  const [trackingCode, setTrackingCode] = useState('');
  
  const customerReview = useMemo(() => {
    if (!order) return null;
    return reviews.find(r => r.orderId === order.id);
  }, [order, reviews]);

  const items = useMemo(() => {
    if (!order?.items) return [];
    if (Array.isArray(order.items)) return order.items;
    try {
      if (typeof order.items === 'string') return JSON.parse(order.items);
    } catch (e) {
      console.error("Failed to parse order items", e);
    }
    return [];
  }, [order?.items]);

  const events = useMemo(() => {
    if (!order?.events) return [];
    if (Array.isArray(order.events)) return order.events;
    try {
      if (typeof order.events === 'string') return JSON.parse(order.events);
    } catch (e) {
      console.error("Failed to parse order events", e);
    }
    return [];
  }, [order?.events]);

  if (!order) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-indigo-50">Pedido não encontrado</h2>
        <button onClick={onBack} className="mt-4 bg-primary hover:bg-primary-dark text-indigo-50 font-bold py-2 px-4 rounded-lg inline-flex items-center">
          <ChevronLeftIcon className="w-5 h-5 mr-2" />
          Voltar para Pedidos
        </button>
      </div>
    );
  }
  
  const handleUpdateStatus = (newStatus: OrderStatus, description: string, data: Partial<Order> = {}) => {
     const newEvent: OrderEvent = {
        timestamp: new Date().toISOString(),
        status: newStatus,
        description,
    };
    const updatedOrder: Order = {
        ...order,
        status: newStatus,
        events: [...events, newEvent],
        ...data,
    };
    updateOrder(updatedOrder);
  };
  
  const handleAddTrackingCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) {
        showToast("Por favor, insira um código de rastreio.", "error");
        return;
    }
    handleUpdateStatus(OrderStatus.Shipped, `Pedido enviado com rastreio: ${trackingCode}`, { trackingCode });
  };

  return (
    <div className="p-8">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="text-primary hover:text-primary-light mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-indigo-50">Detalhes do Pedido #{order.id}</h2>
            <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-gray-400">
                {getOriginIcon(order.origin)}
                <span>Venda via {order.origin}</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-indigo-50 mb-4">Itens do Pedido</h3>
            <div className="space-y-4">
              {items.map((item: any, idx: number) => (
                <div key={`${item.productId}-${idx}`} className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-600">
                  <img src={item.imageUrl} alt={item.productName} className="w-16 h-16 rounded-md object-cover bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-indigo-50">{item.productName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Qtd: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-indigo-50">R$ {(Number(item.price || 0) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              {items.length === 0 && <p className="text-gray-500 text-center py-4">Nenhum item encontrado para este pedido.</p>}
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 mt-4 pt-4 flex justify-end">
                <div className="text-lg">
                    <span className="font-bold text-gray-500 dark:text-gray-400">Total do Pedido: </span>
                    <span className="font-bold text-primary">R$ {Number(order.total || 0).toFixed(2)}</span>
                </div>
            </div>
          </div>
          
           {customerReview && (
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-indigo-50 mb-4">Avaliação do Cliente</h3>
                <div className="flex items-start gap-4">
                    <img src={customerReview.customerPhotoUrl} alt={customerReview.customerName} className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 object-cover" />
                    <div>
                        <StarRating rating={customerReview.rating} />
                        <p className="text-gray-600 dark:text-gray-300 mt-2 italic">"{customerReview.comment}"</p>
                        <p className="text-xs text-gray-400 mt-2">{new Date(customerReview.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
             </div>
           )}
        </div>

        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
                 <h3 className="text-xl font-bold text-gray-900 dark:text-indigo-50 mb-4">Gerenciar Pedido</h3>
                 <div className="space-y-4">
                    {order.status === OrderStatus.Pending && (
                        <button onClick={() => handleUpdateStatus(OrderStatus.Processing, "Pedido aceito e em preparação.")} className="w-full bg-blue-600 hover:bg-blue-500 text-indigo-50 font-bold py-3 px-4 rounded-lg shadow-md transition-all active:scale-95">
                            Aceitar Pedido
                        </button>
                    )}
                    {order.status === OrderStatus.Processing && (
                       <div className="space-y-4">
                            <form onSubmit={handleAddTrackingCode}>
                                <label htmlFor="trackingCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Código de Rastreio</label>
                                <div className="flex gap-2">
                                    <input id="trackingCode" type="text" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="BR123..." className="flex-1 bg-gray-50 dark:bg-gray-900 p-3 rounded-md border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-indigo-50" required/>
                                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-indigo-50 font-bold py-2 px-4 rounded-lg shadow-md transition-all active:scale-95">
                                        Enviar
                                    </button>
                                </div>
                            </form>
                       </div>
                    )}
                    {order.status === OrderStatus.Shipped && (
                        <button onClick={() => handleUpdateStatus(OrderStatus.Delivered, "Pedido entregue ao cliente.")} className="w-full bg-green-600 hover:bg-green-500 text-indigo-50 font-bold py-3 px-4 rounded-lg shadow-md transition-all active:scale-95">
                            Marcar como Entregue
                        </button>
                    )}
                    {(order.status === OrderStatus.Delivered || order.status === OrderStatus.Canceled) && (
                        <div className={`p-4 rounded-lg text-center font-semibold ${getStatusColorClass(order.status)}`}>
                            {order.status === OrderStatus.Delivered ? 'Pedido Finalizado' : 'Pedido Cancelado'}
                        </div>
                    )}
                 </div>
            </div>

             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-indigo-50 mb-4">Linha do Tempo</h3>
                <ul className="space-y-4">
                    {events.map((event: any, index: number) => (
                        <li key={index} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${getStatusColorClass(event.status)} bg-white dark:bg-gray-800`}>
                                    <CheckCircleIcon className="w-5 h-5"/>
                                </div>
                                {index < events.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 dark:bg-gray-700 my-1"></div>}
                            </div>
                            <div>
                                <p className={`font-bold text-sm text-gray-900 dark:text-indigo-50`}>{event.status}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-300">{event.description}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">{new Date(event.timestamp).toLocaleString('pt-BR')}</p>
                            </div>
                        </li>
                    ))}
                    {events.length === 0 && <p className="text-sm text-gray-500 italic">Nenhum evento registrado.</p>}
                </ul>
             </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
