
import React from 'react';
import type { Customer, Order } from '../types';
import { ChevronLeftIcon, DollarSignIcon, OrderIcon, CalendarIcon, PhoneIcon, ChatIcon, MapPinIcon } from '../components/icons/Icons';
import { getStatusColorClass } from '../utils/helpers';


interface CustomerProfileProps {
  customer: Customer | null;
  orders: Order[];
  onBack: () => void;
}

const ProfileCard: React.FC<{title: string, value: string, icon: React.ElementType}> = ({title, value, icon: Icon}) => (
    <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-4 border border-gray-700">
        <div className="p-3 bg-gray-700/50 rounded-full">
            <Icon className="w-6 h-6 text-primary"/>
        </div>
        <div>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-tight">{title}</p>
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

  const handleWhatsApp = (number?: string) => {
      if (!number) return;
      const cleanNumber = number.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <button onClick={onBack} className="flex items-center text-sm text-primary hover:text-primary-light mb-4 transition-colors">
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Voltar para Clientes
        </button>
        <div className="flex items-center gap-6">
          <img src={customer.avatarUrl} alt={customer.name} className="w-24 h-24 rounded-full bg-gray-700 border-4 border-primary/20 shadow-xl object-cover" />
          <div>
            <h2 className="text-4xl font-extrabold text-white">{customer.name}</h2>
            <p className="text-gray-400 font-medium">{customer.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProfileCard title="Total Gasto" value={Number(customer.totalSpent).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} icon={DollarSignIcon} />
        <ProfileCard title="Ticket Médio" value={averageTicket.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} icon={OrderIcon} />
        <ProfileCard title="Cliente Desde" value={new Date(customer.joinDate).toLocaleDateString('pt-BR')} icon={CalendarIcon} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
            {/* Dados Pessoais e Contato */}
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-3 flex items-center gap-2">
                    <PhoneIcon className="w-5 h-5 text-primary"/> Dados e Contatos
                </h3>
                <div className="space-y-5">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">CPF / CNPJ</p>
                        <p className="text-white font-medium">{customer.cpfCnpj || 'Não informado'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">E-mail</p>
                        <p className="text-white font-medium">{customer.email}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Telefone</p>
                        <p className="text-white font-medium flex items-center gap-2">
                            {customer.contacts?.phone || 'Não informado'}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">WhatsApp</p>
                        <div className="flex items-center justify-between">
                            <p className="text-white font-medium">{customer.contacts?.whatsapp || 'Não informado'}</p>
                            {customer.contacts?.whatsapp && (
                                <button 
                                    onClick={() => handleWhatsApp(customer.contacts?.whatsapp)}
                                    className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all shadow-sm"
                                    title="Abrir WhatsApp"
                                >
                                    <ChatIcon className="w-4 h-4"/>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Endereço */}
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-3 flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5 text-primary"/> Endereço Principal
                </h3>
                {customer.address ? (
                    <div className="space-y-4">
                        <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-700/50">
                            <p className="text-white font-bold">{customer.address.street}, {customer.address.number}</p>
                            {customer.address.complement && <p className="text-sm text-gray-400">{customer.address.complement}</p>}
                            <p className="text-sm text-gray-400 mt-1">{customer.address.neighborhood}</p>
                            <p className="text-sm text-gray-400">{customer.address.city} - {customer.address.state}</p>
                            <p className="text-xs font-mono text-primary mt-2">{customer.address.zipCode}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic">Endereço não cadastrado.</p>
                )}
            </div>
        </div>

        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-3">Histórico de Compras</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                <thead className="bg-gray-900/50">
                    <tr>
                    <th className="p-4 text-gray-400 text-xs font-black uppercase tracking-widest">ID do Pedido</th>
                    <th className="p-4 text-gray-400 text-xs font-black uppercase tracking-widest">Data</th>
                    <th className="p-4 text-gray-400 text-xs font-black uppercase tracking-widest text-right">Total</th>
                    <th className="p-4 text-gray-400 text-xs font-black uppercase tracking-widest">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {customerOrders.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="p-8 text-center text-gray-500 italic">Este cliente ainda não realizou compras.</td>
                        </tr>
                    ) : (
                        customerOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-700/30 transition-colors">
                            <td className="p-4 font-black text-primary">#{order.id}</td>
                            <td className="p-4 text-gray-300">{new Date(order.date).toLocaleDateString('pt-BR')}</td>
                            <td className="p-4 text-white font-bold text-right">R$ {Number(order.total).toFixed(2)}</td>
                            <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${getStatusColorClass(order.status)}`}>
                                {order.status}
                            </span>
                            </td>
                        </tr>
                        ))
                    )}
                </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
