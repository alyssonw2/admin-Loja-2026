
import React, { useState } from 'react';
import type { Coupon, Toast } from '../types';
import CouponModal from '../components/CouponModal';
import { PencilIcon, TrashIcon } from '../components/icons/Icons';
import { CouponType, DiscountType } from '../types';

interface CouponsProps {
  coupons: Coupon[];
  addCoupon: (coupon: Omit<Coupon, 'id'>) => void;
  updateCoupon: (coupon: Coupon) => void;
  deleteCoupon: (couponId: string) => void;
  showToast: (message: string, type: Toast['type']) => void;
}

const Coupons: React.FC<CouponsProps> = ({ coupons, addCoupon, updateCoupon, deleteCoupon, showToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const handleOpenModal = (coupon: Coupon | null = null) => {
    setEditingCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingCoupon(null);
    setIsModalOpen(false);
  };

  const handleSaveCoupon = (couponData: Coupon | Omit<Coupon, 'id'>) => {
    if ('id' in couponData) {
      updateCoupon(couponData as Coupon);
    } else {
      addCoupon(couponData);
    }
  };

  const handleDeleteCoupon = (coupon: Coupon) => {
    if (window.confirm(`Tem certeza que deseja excluir o cupom "${coupon.code}"?`)) {
      deleteCoupon(coupon.id);
    }
  };
  
  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.type === CouponType.FreeShipping) return 'Frete Grátis';
    const val = parseFloat(coupon.discountValue || '0');
    if (coupon.discountType === DiscountType.Percentage) return `${val}%`;
    if (coupon.discountType === DiscountType.FixedAmount) return `R$ ${val.toFixed(2)}`;
    return '-';
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-indigo-50">Gerenciar Cupons de Desconto</h2>
        <button onClick={() => handleOpenModal()} className="bg-primary hover:bg-primary-dark text-indigo-50 font-bold py-2 px-4 rounded-lg">
          Adicionar Cupom
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="p-4 text-gray-700 dark:text-gray-300">Código</th>
              <th className="p-4 text-gray-700 dark:text-gray-300">Tipo</th>
              <th className="p-4 text-gray-700 dark:text-gray-300">Desconto</th>
              <th className="p-4 text-gray-700 dark:text-gray-300">Compra Mínima</th>
              <th className="p-4 text-gray-700 dark:text-gray-300">Status</th>
              <th className="p-4 text-gray-700 dark:text-gray-300 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => {
                const minVal = parseFloat(coupon.minPurchaseValue || '0');
                return (
                  <tr key={coupon.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-4 font-medium text-primary">{coupon.code}</td>
                    <td className="p-4 text-gray-900 dark:text-indigo-50">{coupon.type}</td>
                    <td className="p-4 text-gray-900 dark:text-indigo-50">{getDiscountDisplay(coupon)}</td>
                    <td className="p-4 text-gray-900 dark:text-indigo-50">{minVal > 0 ? `R$ ${minVal.toFixed(2)}` : '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${coupon.isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                        {coupon.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4 space-x-4 text-right">
                      <button onClick={() => handleOpenModal(coupon)} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"><PencilIcon /></button>
                      <button onClick={() => handleDeleteCoupon(coupon)} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"><TrashIcon /></button>
                    </td>
                  </tr>
                );
            })}
          </tbody>
        </table>
      </div>

      <CouponModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCoupon}
        coupon={editingCoupon}
        showToast={showToast}
      />
    </div>
  );
};

export default Coupons;
