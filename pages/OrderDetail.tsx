import React, { useState, useMemo } from 'react';
// FIX: Added Toast to the import.
import type { Order, Review, OrderEvent, Toast } from '../types';
import { OrderStatus, OrderOrigin } from '../types';
import { ChevronLeftIcon, CheckCircleIcon, StarIcon, DocumentArrowUpIcon } from '../components/icons/Icons';
import { getStatusColorClass, getOriginIcon } from '../utils/helpers';

interface OrderDetailProps {
  order: Order | null;
  reviews: Review[];
  onBack: () => void;
  updateOrder: (order: Order) => void;
  // FIX: Added showToast to the props interface for displaying notifications.
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

  if (!order) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-white">Pedido não encontrado</h2>
        <p className="text-gray-400 mt-2">Selecione um pedido para ver os detalhes.</p>
        <button onClick={onBack} className="mt-4 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg inline-flex items-center">
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
        events: [...order.events, newEvent],
        ...data,
    };
    updateOrder(updatedOrder);
  };
  
  const handleAddTrackingCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) {
        // FIX: Replaced alert with showToast for better user feedback.
        showToast("Por favor, insira um código de rastreio.", "error");
        return;
    }
    handleUpdateStatus(OrderStatus.Shipped, `Pedido enviado com rastreio: ${trackingCode}`, { trackingCode });
  };
  
  const statusColor = getStatusColorClass(order.status).replace('bg-', 'text-').split(' ')[0];
  const statusBorderColor = getStatusColorClass(order.status).replace('bg-yellow-500/20', 'border-yellow-500/30').replace('bg-blue-500/20', 'border-blue-500/30').replace('bg-indigo-500/20', 'border-indigo-500/30').replace('bg-green-500/20', 'border-green-500/30').replace('bg-red-500/20', 'border-red-500/30');


  return (
    <div className="p-8">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="text-primary hover:text-primary-light mr-4 p-2 rounded-full hover:bg-gray-800">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <div>
            <h2 className="text-3xl font-bold text-white">Detalhes do Pedido #{order.id}</h2>
            <div className="flex items-center gap-2 mt-1 text-gray-400">
                {getOriginIcon(order.origin)}
                <span>Venda via {order.origin}</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-white mb-4">Itens do Pedido</h3>
            <div className="space-y-4">
              {order.items.map(item => (
                <div key={item.productId} className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-700/50">
                  <img src={item.imageUrl} alt={item.productName} className="w-16 h-16 rounded-md object-cover bg-gray-700" />
                  <div className="flex-1">
                    <p className="font-semibold text-white">{item.productName}</p>
                    <p className="text-sm text-gray-400">Qtd: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-white">R$ {(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-700 mt-4 pt-4 flex justify-end">
                <div className="text-lg">
                    <span className="font-bold text-gray-300">Total do Pedido: </span>
                    <span className="font-bold text-primary">R$ {order.total.toFixed(2)}</span>
                </div>
            </div>
          </div>
          
           {customerReview && (
             <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4">Avaliação do Cliente</h3>
                <div className="flex items-start gap-4">
                    <img src={customerReview.customerPhotoUrl} alt={customerReview.customerName} className="w-12 h-12 rounded-full bg-gray-700" />
                    <div>
                        <StarRating rating={customerReview.rating} />
                        <p className="text-gray-300 mt-2 italic">"{customerReview.comment}"</p>
                        <p className="text-xs text-gray-500 mt-2">{new Date(customerReview.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
             </div>
           )}

        </div>

        <div className="space-y-8">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                 <h3 className="text-xl font-bold text-white mb-4">Gerenciar Pedido</h3>
                 <div className="space-y-4">
                    {order.status === OrderStatus.Pending && (
                        <button onClick={() => handleUpdateStatus(OrderStatus.Processing, "Pedido aceito e em preparação.")} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg">
                            Aceitar Pedido
                        </button>
                    )}

                    {order.status === OrderStatus.Processing && (
                       <div className="space-y-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                                    <DocumentArrowUpIcon /> Nota Fiscal (PDF)
                                </label>
                                <input type="file" accept=".pdf" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"/>
                            </div>
                            <form onSubmit={handleAddTrackingCode}>
                                <label htmlFor="trackingCode" className="block text-sm font-medium text-gray-300 mb-2">Código de Rastreio</label>
                                <div className="flex gap-2">
                                    <input id="trackingCode" type="text" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="Insira o código" className="flex-1 bg-gray-700 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" required/>
                                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg">
                                        Marcar como Enviado
                                    </button>
                                </div>
                            </form>
                       </div>
                    )}

                    {order.status === OrderStatus.Shipped && (
                        <button onClick={() => handleUpdateStatus(OrderStatus.Delivered, "Pedido entregue ao cliente.")} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg">
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

             <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-white mb-4">Linha do Tempo</h3>
                <ul className="space-y-4">
                    {order.events.map((event, index) => {
                        const eventStatusColor = getStatusColorClass(event.status);
                        const eventTextColor = eventStatusColor.replace(/bg-\w+-\d+\/\d+/, '').trim();
                        const eventBorderColor = eventStatusColor.replace('bg-yellow-500/20', 'border-yellow-500/30').replace('bg-blue-500/20', 'border-blue-500/30').replace('bg-indigo-500/20', 'border-indigo-500/30').replace('bg-green-500/20', 'border-green-500/30').replace('bg-red-500/20', 'border-red-500/30').split(' ')[0];
                        
                        return (
                            <li key={index} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${eventStatusColor} ${eventBorderColor}`}>
                                        <CheckCircleIcon className="w-5 h-5"/>
                                    </div>
                                    {index < order.events.length -1 && <div className="w-0.5 flex-1 bg-gray-700 my-1"></div>}
                                </div>
                                <div>
                                    <p className={`font-semibold ${eventTextColor}`}>{event.status}</p>
                                    <p className="text-sm text-gray-300">{event.description}</p>
                                    <p className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString('pt-BR')}</p>
                                </div>
                            </li>
                        )
                    })}
                </ul>
             </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-white mb-4">Cliente e Entrega</h3>
            <div className="space-y-3">
              <div>
                  <p className="text-sm text-gray-400">Cliente</p>
                  <p className="font-semibold text-white">{order.customerName}</p>
                  <p className="text-sm text-gray-400">{order.customerEmail}</p>
              </div>
              <div>
                  <p className="text-sm text-gray-400">Endereço de Entrega</p>
                  <p className="text-sm text-white">{order.shippingAddress}</p>
              </div>
               <div>
                  <p className="text-sm text-gray-400">ID da Transação (Gateway)</p>
                  <p className="font-mono text-sm text-white bg-gray-700 p-1 rounded-md inline-block">{order.gatewayTransactionId}</p>
              </div>
               {order.trackingCode && (
                 <div>
                    <p className="text-sm text-gray-400">Código de Rastreio</p>
                    <p className="font-mono text-sm text-primary bg-gray-700 p-1 rounded-md inline-block">{order.trackingCode}</p>
                </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
