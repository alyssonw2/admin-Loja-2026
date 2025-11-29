
import React, { useState, useEffect } from 'react';
import type { Toast } from '../types';

interface CatalogItem {
  id: string;
  name: string;
}

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, id?: string) => void;
  item: CatalogItem | null;
  title: string;
  itemName: string; // Ex: "Marca", "Modelo"
  showToast: (message: string, type: Toast['type']) => void;
}

const CatalogModal: React.FC<CatalogModalProps> = ({ isOpen, onClose, onSave, item, title, itemName, showToast }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setName(item.name);
      } else {
        setName('');
      }
    }
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast(`O nome do(a) ${itemName.toLowerCase()} é obrigatório.`, 'error');
      return;
    }
    onSave(name, item?.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md text-white">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Ex: Novo(a) ${itemName}`}
              className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              required
            />
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

export default CatalogModal;
