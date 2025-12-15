
import React, { useState, useRef, useEffect } from 'react';
import type { ProductMarker } from '../types';
import { TrashIcon } from './icons/Icons';

interface ImageMarkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  markers: ProductMarker[];
  onSave: (markers: ProductMarker[]) => void;
}

const ImageMarkerModal: React.FC<ImageMarkerModalProps> = ({ isOpen, onClose, imageSrc, markers, onSave }) => {
  const [currentMarkers, setCurrentMarkers] = useState<ProductMarker[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentMarkers(markers || []);
      setNewLabel('');
      setActiveMarkerId(null);
    }
  }, [isOpen, markers]);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newMarker: ProductMarker = {
      id: `mark-${Date.now()}`,
      x,
      y,
      description: ''
    };

    setCurrentMarkers([...currentMarkers, newMarker]);
    setActiveMarkerId(newMarker.id);
    // Focus input to type description immediately
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleDeleteMarker = (id: string) => {
    setCurrentMarkers(prev => prev.filter(m => m.id !== id));
    if (activeMarkerId === id) {
      setActiveMarkerId(null);
      setNewLabel('');
    }
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewLabel(val);
    if (activeMarkerId) {
      setCurrentMarkers(prev => prev.map(m => m.id === activeMarkerId ? { ...m, description: val } : m));
    }
  };

  const handleMarkerClick = (e: React.MouseEvent, marker: ProductMarker) => {
    e.stopPropagation();
    setActiveMarkerId(marker.id);
    setNewLabel(marker.description);
    inputRef.current?.focus();
  };

  const handleSave = () => {
    onSave(currentMarkers);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Marcar Defeitos / Detalhes</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Image Area */}
          <div className="flex-1 bg-black/50 relative flex items-center justify-center p-4 overflow-hidden">
            <div className="relative inline-block">
              <img 
                ref={imageRef}
                src={imageSrc} 
                alt="Product to annotate" 
                className="max-h-[60vh] max-w-full object-contain cursor-crosshair"
                onClick={handleImageClick}
              />
              {currentMarkers.map((marker, index) => (
                <div
                  key={marker.id}
                  onClick={(e) => handleMarkerClick(e, marker)}
                  className={`absolute w-6 h-6 rounded-full border-2 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-xs font-bold shadow-sm transition-transform hover:scale-125
                    ${activeMarkerId === marker.id ? 'bg-primary border-white text-white z-20 scale-125' : 'bg-red-500 border-white text-white z-10'}
                  `}
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                  title={marker.description}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar / Controls */}
          <div className="w-full md:w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 bg-gray-800">
               <p className="text-sm text-gray-300 mb-2">
                 Clique na imagem para adicionar um ponto. Selecione um ponto para editar a descrição.
               </p>
               <div className="mt-2">
                 <label className="block text-xs font-medium text-gray-400 mb-1">Descrição do Marcador Selecionado</label>
                 <div className="flex gap-2">
                   <input 
                     ref={inputRef}
                     type="text" 
                     value={newLabel} 
                     onChange={handleLabelChange}
                     placeholder="Ex: Mancha, Rasgo..."
                     disabled={!activeMarkerId}
                     className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                   />
                   <button 
                     onClick={() => activeMarkerId && handleDeleteMarker(activeMarkerId)}
                     disabled={!activeMarkerId}
                     className="bg-red-600 hover:bg-red-500 text-white p-1 rounded disabled:opacity-50"
                     title="Excluir marcador"
                   >
                     <TrashIcon className="w-4 h-4"/>
                   </button>
                 </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Lista de Marcadores</h3>
              {currentMarkers.length === 0 ? (
                <p className="text-xs text-gray-500 italic">Nenhum marcador adicionado.</p>
              ) : (
                <ul className="space-y-2">
                  {currentMarkers.map((marker, index) => (
                    <li 
                      key={marker.id} 
                      onClick={(e) => handleMarkerClick(e, marker)}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${activeMarkerId === marker.id ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${activeMarkerId === marker.id ? 'bg-primary text-white' : 'bg-red-500 text-white'}`}>
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-300 truncate flex-1">
                        {marker.description || <span className="text-gray-500 italic">Sem descrição</span>}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteMarker(marker.id); }}
                        className="text-gray-500 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 mt-auto">
               <div className="flex justify-end gap-3">
                 <button onClick={onClose} className="px-4 py-2 text-sm text-gray-300 hover:text-white">Cancelar</button>
                 <button onClick={handleSave} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded text-sm font-bold">Salvar Marcadores</button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageMarkerModal;
