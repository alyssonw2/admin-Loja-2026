
import React, { useState } from 'react';
import type { Customer, Toast } from '../types';
import CustomerModal from '../components/CustomerModal';

interface CustomersProps {
  customers: Customer[];
  onViewProfile: (customer: Customer) => void;
  addCustomer?: (customer: Omit<Customer, 'id' | 'joinDate' | 'totalSpent'>) => void;
  showToast?: (message: string, type: Toast['type']) => void;
}

const Customers: React.FC<CustomersProps> = ({ customers, onViewProfile, addCustomer, showToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveCustomer = (newCustomer: Omit<Customer, 'id' | 'joinDate' | 'totalSpent'>) => {
      if (addCustomer) {
          addCustomer(newCustomer);
      }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h2>
        {addCustomer && (
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg"
            >
                Adicionar Cliente
            </button>
        )}
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="p-4 text-gray-600 dark:text-gray-300">Cliente</th>
              <th className="p-4 text-gray-600 dark:text-gray-300">Email</th>
              <th className="p-4 text-gray-600 dark:text-gray-300">Telefone</th>
              <th className="p-4 text-gray-600 dark:text-gray-300">Data de Cadastro</th>
              <th className="p-4 text-gray-600 dark:text-gray-300">Total Gasto</th>
              <th className="p-4 text-gray-600 dark:text-gray-300">Ações</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
               <tr>
                  <td colSpan={6} className="text-center p-8 text-gray-500 dark:text-gray-400">Nenhum cliente encontrado.</td>
                </tr>
            ) : (customers.map((customer) => (
              <tr key={customer.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-4 flex items-center">
                  <img src={customer.avatarUrl} alt={customer.name} className="w-10 h-10 rounded-full mr-4 object-cover bg-gray-200 dark:bg-gray-600" />
                  <span className="font-medium text-gray-900 dark:text-white">{customer.name}</span>
                </td>
                <td className="p-4 text-gray-500 dark:text-gray-400">{customer.email}</td>
                <td className="p-4 text-gray-500 dark:text-gray-400">{customer.contacts?.phone || customer.contacts?.whatsapp || '-'}</td>
                <td className="p-4 text-gray-500 dark:text-gray-400">{new Date(customer.joinDate).toLocaleDateString('pt-BR')}</td>
                <td className="p-4 text-gray-900 dark:text-white">R$ {Number(customer.totalSpent).toFixed(2)}</td>
                <td className="p-4">
                  <button onClick={() => onViewProfile(customer)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Ver Perfil</button>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {showToast && (
          <CustomerModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveCustomer}
            showToast={showToast}
          />
      )}
    </div>
  );
};

export default Customers;
