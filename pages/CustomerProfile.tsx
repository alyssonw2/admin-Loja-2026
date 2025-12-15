
import React from 'react';
import type { Customer, Order } from '../types';
import { ChevronLeftIcon, DollarSignIcon, OrderIcon, CalendarIcon } from '../components/icons/Icons';
import { getStatusColorClass } from '../utils/helpers';


interface CustomerProfileProps {
  customer: Customer | null;
  orders: Order[];
  onBack: () => void;
}

const ProfileCard: React.FC<{title: string, value: string, icon: React.ElementType}> = ({title, value, icon: Icon}) => (
    <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-4">
        <div className="p-3 bg-gray-700 rounded-full">
            <Icon className="w-6 h-6 text-primary"/>
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-lg font-bold text-white">{value}</p>
        </div>
    </div>
);

const CustomerProfile: React.FC<CustomerProfileProps> = ({ customer, orders, onBack }) => {
  if (!customer) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-white">Cliente não encontrado</h2>
        <button onClick={onBack} className="mt-4 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg inline-flex items-center">
          <ChevronLeftIcon className="w-5 h-5 mr-2" />
          Voltar para Clientes
        </button>
      </div>
    );
  }

  const customerOrders = orders.filter(o => o.customerName === customer.name);
  const averageTicket = customerOrders.length > 0 ? Number(customer.totalSpent) / customerOrders.length : 0;

  return (
    <div className="p-8 space-y-8">
      <div>
        <button onClick={onBack} className="flex items-center text-sm text-primary hover:text-primary-light mb-4">
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Voltar para Clientes
        </button>
        <div className="flex items-center gap-4">
          <img src={customer.avatarUrl} alt={customer.name} className="w-20 h-20 rounded-full bg-gray-700" />
          <div>
            <h2 className="text-3xl font-bold text-white">{customer.name}</h2>
            <p className="text-gray-400">{customer.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProfileCard title="Total Gasto" value={Number(customer.totalSpent).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} icon={DollarSignIcon} />
        <ProfileCard title="Ticket Médio" value={averageTicket.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} icon={OrderIcon} />
        <ProfileCard title="Cliente Desde" value={new Date(customer.joinDate).toLocaleDateString('pt-BR')} icon={CalendarIcon} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg shadow-lg h-fit">
            <h3 className="text-xl font-bold text-white mb-4">Dados Pessoais</h3>
            <div className="space-y-3">
                <div>
                    <p className="text-sm text-gray-400">Nome Completo</p>
                    <p className="text-white font-medium">{customer.name}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-white font-medium">{customer.email}</p>
                </div>
            </div>
        </div>
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-white mb-4">Últimas Compras</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                <thead className="border-b border-gray-700">
                    <tr>
                    <th className="p-3 text-gray-400 text-sm">ID do Pedido</th>
                    <th className="p-3 text-gray-400 text-sm">Data</th>
                    <th className="p-3 text-gray-400 text-sm">Total</th>
                    <th className="p-3 text-gray-400 text-sm">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {customerOrders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="p-3 font-medium text-primary">{order.id}</td>
                        <td className="p-3 text-gray-300">{new Date(order.date).toLocaleDateString('pt-BR')}</td>
                        <td className="p-3 text-white">R$ {Number(order.total).toFixed(2)}</td>
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
      </div>
    </div>
  );
};

export default CustomerProfile;
