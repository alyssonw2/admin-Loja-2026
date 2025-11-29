import React, { useState, useEffect } from 'react';
import type { Category, Toast } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Category | Omit<Category, 'id'>) => void;
  category: Category | null;
  allCategories: Category[];
  showToast: (message: string, type: Toast['type']) => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, onSave, category, allCategories, showToast }) => {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setName(category.name);
        setParentId(category.parentId);
      } else {
        setName('');
        setParentId(undefined);
      }
    }
  }, [category, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('O nome da categoria não pode estar em branco.', 'error');
      return;
    }
    const categoryData: Omit<Category, 'id'> = {
      name,
      ...(parentId && { parentId }),
    };
    onSave(category ? { ...categoryData, id: category.id } : categoryData);
    onClose();
  };

  if (!isOpen) return null;
  
  const possibleParents = allCategories.filter(c => c.id !== category?.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg text-white">
        <h2 className="text-2xl font-bold mb-6">{category ? 'Editar Categoria' : 'Adicionar Categoria'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Nome da Categoria</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Camisetas"
              className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label htmlFor="parentId" className="block text-sm font-medium text-gray-300 mb-2">Categoria Pai (Opcional)</label>
            <select
              id="parentId"
              value={parentId || ''}
              onChange={(e) => setParentId(e.target.value || undefined)}
              className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Nenhuma (Categoria Principal) --</option>
              {possibleParents.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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

export default CategoryModal;