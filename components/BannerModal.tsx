import React, { useState, useEffect } from 'react';
import type { Banner, Toast } from '../types';

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (banner: Banner | Omit<Banner, 'id'>) => void;
  banner: Banner | null;
  showToast: (message: string, type: Toast['type']) => void;
}

const initialState: Omit<Banner, 'id'> = {
  imageUrl: '',
  title: '',
  description: '',
  buttonText: '',
  buttonUrl: '',
};

const BannerModal: React.FC<BannerModalProps> = ({ isOpen, onClose, onSave, banner, showToast }) => {
  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (isOpen) {
      if (banner) {
        setFormData(banner);
      } else {
        setFormData(initialState);
      }
    }
  }, [banner, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.imageUrl) {
      showToast('Título e URL da imagem são obrigatórios.', 'error');
      return;
    }
    onSave(banner ? { ...formData, id: banner.id } : formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl text-white max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{banner ? 'Editar Banner' : 'Adicionar Banner'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-300 mb-2">URL da Imagem do Banner</label>
            <input id="imageUrl" type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://exemplo.com/banner.jpg" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" required />
            {formData.imageUrl && <img src={formData.imageUrl} alt="Preview" className="mt-4 rounded-lg w-full h-auto max-h-48 object-cover bg-gray-700"/>}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Título</label>
            <input id="title" type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Ex: Grande Liquidação" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" required />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Descreva a promoção do banner" rows={3} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="buttonText" className="block text-sm font-medium text-gray-300 mb-2">Texto do Botão</label>
              <input id="buttonText" type="text" name="buttonText" value={formData.buttonText} onChange={handleChange} placeholder="Ex: Ver Produtos" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label htmlFor="buttonUrl" className="block text-sm font-medium text-gray-300 mb-2">URL do Botão</label>
              <input id="buttonUrl" type="url" name="buttonUrl" value={formData.buttonUrl} onChange={handleChange} placeholder="Ex: /promocoes" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" />
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

export default BannerModal;