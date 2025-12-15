
import React, { useState } from 'react';
import type { Customer, Toast } from '../types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'joinDate' | 'totalSpent'>) => void;
  showToast: (message: string, type: Toast['type']) => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onSave, showToast }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpfCnpj: '',
    phone: '',
    whatsapp: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
          showToast('Endereço encontrado!', 'success');
        } else {
          showToast('CEP não encontrado.', 'error');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        showToast('Erro ao buscar o CEP.', 'error');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      showToast('Nome e Email são obrigatórios.', 'error');
      return;
    }

    const newCustomer = {
      name: formData.name,
      email: formData.email,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`,
      cpfCnpj: formData.cpfCnpj,
      contacts: {
        phone: formData.phone,
        whatsapp: formData.whatsapp
      },
      address: {
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode
      }
    };

    onSave(newCustomer);
    setFormData({
        name: '', email: '', cpfCnpj: '', phone: '', whatsapp: '',
        street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl text-white my-8">
        <h2 className="text-2xl font-bold mb-6">Adicionar Cliente</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Dados Pessoais */}
          <div className="border-b border-gray-700 pb-4">
            <h3 className="text-lg font-medium text-primary mb-4">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nome Completo *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">CPF / CNPJ</label>
                    <input type="text" name="cpfCnpj" value={formData.cpfCnpj} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
            </div>
          </div>

          {/* Contatos */}
          <div className="border-b border-gray-700 pb-4">
            <h3 className="text-lg font-medium text-primary mb-4">Contatos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Telefone</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">WhatsApp</label>
                    <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <h3 className="text-lg font-medium text-primary mb-4">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">CEP</label>
                    <input 
                      type="text" 
                      name="zipCode" 
                      value={formData.zipCode} 
                      onChange={handleChange} 
                      onBlur={handleCepBlur}
                      maxLength={9}
                      placeholder="00000-000"
                      className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary" 
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Rua</label>
                    <input type="text" name="street" value={formData.street} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Número</label>
                    <input type="text" name="number" value={formData.number} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Complemento</label>
                    <input type="text" name="complement" value={formData.complement} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Bairro</label>
                    <input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Cidade</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Estado (UF)</label>
                    <input type="text" name="state" value={formData.state} onChange={handleChange} maxLength={2} className="w-full bg-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary uppercase" />
                </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4 pt-4 border-t border-gray-700">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors">Cancelar</button>
            <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-md transition-colors">Salvar Cliente</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;
