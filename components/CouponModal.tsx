
import React, { useState, useEffect } from 'react';
import type { Coupon, Toast } from '../types';
// FIX: Imported CouponType and DiscountType from types.
import { CouponType, DiscountType } from '../types';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (coupon: Coupon | Omit<Coupon, 'id'>) => void;
  coupon: Coupon | null;
  showToast: (message: string, type: Toast['type']) => void;
}

const initialState: Omit<Coupon, 'id'> = {
  code: '',
  type: CouponType.FirstPurchase,
  discountType: DiscountType.Percentage,
  discountValue: '',
  minPurchaseValue: '',
  expiryDate: '',
  isActive: true,
};

const CouponModal: React.FC<CouponModalProps> = ({ isOpen, onClose, onSave, coupon, showToast }) => {
  const [formData, setFormData] = useState<Omit<Coupon, 'id'>>(initialState);

  useEffect(() => {
    if (isOpen) {
      if (coupon) {
        setFormData(coupon);
      } else {
        setFormData(initialState);
      }
    }
  }, [coupon, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let processedValue: string | boolean = value;
    if (name === 'isActive') {
        processedValue = value === 'true';
    }

    setFormData(prev => {
        const newState = { ...prev, [name]: processedValue } as Omit<Coupon, 'id'>;

        // Logic for Free Shipping
        if (name === 'type' && value === CouponType.FreeShipping) {
            newState.discountType = 'Frete Grátis';
            newState.discountValue = '0';
        } else if (name === 'type' && value !== CouponType.FreeShipping && prev.type === CouponType.FreeShipping) {
            // Revert to a default discount type if changing from Free Shipping
            newState.discountType = DiscountType.Percentage;
        }

        return newState;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      showToast('O código do cupom não pode estar em branco.', 'error');
      return;
    }
    onSave(coupon ? { ...formData, id: coupon.id } : formData);
    onClose();
  };

  if (!isOpen) return null;
  
  const isFreeShipping = formData.type === CouponType.FreeShipping;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl text-white">
        <h2 className="text-2xl font-bold mb-6">{coupon ? 'Editar Cupom' : 'Adicionar Cupom'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">Código do Cupom</label>
              <input id="code" type="text" name="code" value={formData.code} onChange={handleChange} placeholder="Ex: BEMVINDO10" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary uppercase" required />
            </div>
            <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">Tipo de Cupom</label>
                <select id="type" name="type" value={formData.type as string || 'fixed'} onChange={handleChange} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary">
                    {/* FIX: Explicitly cast enum values to fix Type 'unknown' errors. */}
                    {(Object.values(CouponType) as string[]).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
            </div>
          </div>
          
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="discountType" className="block text-sm font-medium text-gray-300 mb-2">Tipo de Desconto</label>
                <select id="discountType" name="discountType" value={(formData.discountType as string) || 'Valor Fixo'} onChange={handleChange} disabled={isFreeShipping} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-600 disabled:cursor-not-allowed">
                    <option value={DiscountType.Percentage}>Porcentagem (%)</option>
                    <option value={DiscountType.FixedAmount}>Valor Fixo (R$)</option>
                </select>
              </div>
              <div>
                <label htmlFor="discountValue" className="block text-sm font-medium text-gray-300 mb-2">Valor do Desconto</label>
                <input id="discountValue" type="number" name="discountValue" value={formData.discountValue} onChange={handleChange} step="0.01" placeholder="0" disabled={isFreeShipping} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-600 disabled:cursor-not-allowed" />
              </div>
           </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="minPurchaseValue" className="block text-sm font-medium text-gray-300 mb-2">Valor Mínimo da Compra (R$)</label>
              <input id="minPurchaseValue" type="number" name="minPurchaseValue" value={formData.minPurchaseValue} onChange={handleChange} step="0.01" placeholder="0.00" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-300 mb-2">Data de Validade</label>
              <input id="expiryDate" type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
              <label htmlFor="isActive" className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select id="isActive" name="isActive" value={formData.isActive.toString()} onChange={handleChange} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors">Cancelar</button>
            <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-md transition-colors">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CouponModal;
