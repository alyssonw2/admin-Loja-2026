import React, { useState, useEffect } from 'react';
import type { Color, Toast } from '../types';

interface ColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (color: Color | Omit<Color, 'id'>) => void;
  color: Color | null;
  showToast: (message: string, type: Toast['type']) => void;
}

const ColorModal: React.FC<ColorModalProps> = ({ isOpen, onClose, onSave, color, showToast }) => {
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#000000');

  useEffect(() => {
    if (isOpen) {
      if (color) {
        setName(color.name);
        setHex(color.hex);
      } else {
        setName('');
        setHex('#000000');
      }
    }
  }, [color, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !hex.trim()) {
        showToast('O nome e o código hexadecimal da cor são obrigatórios.', 'error');
        return;
    }
    if (!/^#([0-9A-F]{3}){1,2}$/i.test(hex)) {
        showToast('O código hexadecimal é inválido. Use um formato como #FFF ou #FFFFFF.', 'error');
        return;
    }
    const colorData = { name, hex };
    onSave(color ? { ...colorData, id: color.id } : colorData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md text-white">
        <h2 className="text-2xl font-bold mb-6">{color ? 'Editar Cor' : 'Adicionar Cor'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Nome da Cor</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Azul Marinho"
              className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
                <label htmlFor="hex" className="block text-sm font-medium text-gray-300 mb-2">Código Hexadecimal</label>
                <input
                id="hex"
                type="text"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className="bg-gray-700 p-3 rounded-md w-full font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                required
                />
            </div>
             <div>
                <label htmlFor="color-picker" className="block text-sm font-medium text-gray-300 mb-2">Seletor</label>
                <input
                    id="color-picker"
                    type="color"
                    value={hex}
                    onChange={(e) => setHex(e.target.value)}
                    className="p-1 h-12 w-16 block bg-gray-700 border border-gray-600 cursor-pointer rounded-lg"
                />
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

export default ColorModal;