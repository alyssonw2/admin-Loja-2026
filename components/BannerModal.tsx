
import React, { useState, useEffect, useRef } from 'react';
import type { Banner, Toast } from '../types';
import { PhotographIcon, TrashIcon } from './icons/Icons';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Optional: Check file size (e.g., limit to 2MB to prevent huge payloads)
      if (file.size > 2 * 1024 * 1024) {
        showToast('A imagem é muito grande. O limite é 2MB.', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
            setFormData(prev => ({ ...prev, imageUrl: event.target?.result as string }));
        }
      };
      reader.onerror = () => {
          showToast('Erro ao ler o arquivo.', 'error');
      }
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
      setFormData(prev => ({ ...prev, imageUrl: '' }));
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.imageUrl) {
      showToast('Título e Imagem são obrigatórios.', 'error');
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Imagem do Banner</label>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
            />

            {!formData.imageUrl ? (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-700 hover:border-gray-500 transition-colors"
                >
                    <PhotographIcon className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-gray-300 font-medium">Clique para fazer upload da imagem</span>
                    <span className="text-xs text-gray-500 mt-1">Recomendado: 1200x400px (JPG, PNG)</span>
                </div>
            ) : (
                <div className="relative group">
                    <img 
                        src={formData.imageUrl} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg bg-gray-700 border border-gray-600"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-md text-sm font-medium"
                        >
                            Trocar
                        </button>
                        <button 
                            type="button"
                            onClick={handleRemoveImage}
                            className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-md text-sm font-medium flex items-center"
                        >
                            <TrashIcon className="w-4 h-4 mr-1"/> Remover
                        </button>
                    </div>
                </div>
            )}
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
              <input id="buttonUrl" type="text" name="buttonUrl" value={formData.buttonUrl} onChange={handleChange} placeholder="Ex: /promocoes" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" />
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
