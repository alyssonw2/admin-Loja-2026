import React, { useState, useEffect } from 'react';
import type { Review, Toast } from '../types';
import { StarIcon } from './icons/Icons';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (review: Review | Omit<Review, 'id'>) => void;
  review: Review | null;
  showToast: (message: string, type: Toast['type']) => void;
}

const initialState: Omit<Review, 'id'| 'date'> = {
  customerName: '',
  customerPhotoUrl: '',
  rating: 0,
  comment: '',
};

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onSave, review, showToast }) => {
  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (isOpen) {
      if (review) {
        setFormData(review);
      } else {
        setFormData(initialState);
      }
    }
  }, [review, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.rating === 0) {
        showToast("Por favor, selecione uma classificação em estrelas.", "error");
        return;
    }
    const finalData = { ...formData, date: new Date().toISOString().split('T')[0] };
    onSave(review ? { ...finalData, id: review.id } : finalData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl text-white">
        <h2 className="text-2xl font-bold mb-6">{review ? 'Editar Avaliação' : 'Adicionar Avaliação'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
              {formData.customerPhotoUrl ? (
                <img src={formData.customerPhotoUrl} alt="Preview" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-gray-500 text-sm">Foto</span>
              )}
            </div>
            <div className="flex-1">
              <label htmlFor="customerPhotoUrl" className="block text-sm font-medium text-gray-300 mb-2">URL da Foto do Cliente</label>
              <input id="customerPhotoUrl" type="text" name="customerPhotoUrl" value={formData.customerPhotoUrl} onChange={handleChange} placeholder="https://exemplo.com/foto.jpg" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
          </div>

          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-300 mb-2">Nome do Cliente</label>
            <input id="customerName" type="text" name="customerName" value={formData.customerName} onChange={handleChange} placeholder="Ex: João da Silva" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Classificação</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setFormData(prev => ({...prev, rating: star}))}
                  className={`transition-colors ${formData.rating >= star ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-500'}`}
                >
                  <StarIcon className="w-8 h-8" />
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-300 mb-2">Comentário</label>
            <textarea id="comment" name="comment" value={formData.comment} onChange={handleChange} placeholder="Escreva a avaliação do cliente aqui..." rows={4} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" required />
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

export default ReviewModal;