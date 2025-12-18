
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Product, Category, Brand, Model, Material, ProductMedia, Color, Toast, ProductSize, ProductMarker } from '../types';
import { generateDescription } from '../services/geminiService';
import { SparklesIcon, TrashIcon, GripVerticalIcon, VideoCameraIcon, ChevronLeftIcon, TagIcon } from '../components/icons/Icons';
import ImageMarkerModal from '../components/ImageMarkerModal';

interface ProductFormProps {
  onBack: () => void;
  onSave: (product: Product | Omit<Product, 'id'>) => void;
  product: Product | null;
  categories: Category[];
  brands: Brand[];
  models: Model[];
  materials: Material[];
  colors: Color[];
  showToast: (message: string, type: Toast['type']) => void;
}

const initialState: Omit<Product, 'id'> = {
  name: '',
  sku: '',
  price: '',
  promotionalPrice: '',
  stock: '0',
  sizes: [],
  categoryId: '',
  brandId: '',
  modelId: '',
  materialId: '',
  colorId: '',
  media: [],
  description: '',
  condition: 'Novo',
  status: 'Ativo',
  width: '',
  height: '',
  depth: '',
  weight: '',
};

const ProductForm: React.FC<ProductFormProps> = ({ onBack, onSave, product, categories, brands, models, materials, colors, showToast }) => {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>(initialState);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<ProductMedia[]>([]);
  const [newSizeName, setNewSizeName] = useState('');
  const [newSizeQuantity, setNewSizeQuantity] = useState(0);
  const [markerModalConfig, setMarkerModalConfig] = useState<{isOpen: boolean, mediaId: string | null}>({isOpen: false, mediaId: null});

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    if (product) {
        setFormData({ ...product, sizes: product.sizes || [], promotionalPrice: product.promotionalPrice || '' });
        setMediaFiles(product.media.sort((a, b) => a.order - b.order));
    } else {
        setFormData(initialState);
        setMediaFiles([]);
    }
  }, [product]);

  useEffect(() => {
      if (formData.sizes && formData.sizes.length > 0) {
          const total = formData.sizes.reduce((acc, curr) => acc + curr.quantity, 0);
          setFormData(prev => ({ ...prev, stock: total.toString() }));
      } else {
          setFormData(prev => ({ ...prev, stock: '0' }));
      }
  }, [formData.sizes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateDescription = async () => {
    const categoryName = categories.find(c => c.id === formData.categoryId)?.name;
    if (!formData.name || !categoryName) {
      showToast("Preencha nome e categoria para gerar a descrição.", "error");
      return;
    }
    setIsGenerating(true);
    const description = await generateDescription(formData.name, categoryName);
    setFormData(prev => ({ ...prev, description }));
    setIsGenerating(false);
  };
  
  const handleAddSize = () => {
      if (!newSizeName.trim()) return;
      if (formData.sizes.some(s => s.name.toLowerCase() === newSizeName.toLowerCase())) {
          showToast('Tamanho já adicionado.', 'error');
          return;
      }
      const newSize: ProductSize = { name: newSizeName.toUpperCase(), quantity: newSizeQuantity };
      setFormData(prev => ({ ...prev, sizes: [...prev.sizes, newSize] }));
      setNewSizeName('');
      setNewSizeQuantity(0);
  };

  const handleRemoveSize = (index: number) => {
      setFormData(prev => ({
          ...prev,
          sizes: prev.sizes.filter((_, i) => i !== index)
      }));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      try {
        const newMediaPromises = files.map(async (file, index) => {
          const base64 = await fileToBase64(file);
          return {
            id: `new-${Date.now()}-${index}`,
            url: base64,
            type: file.type.startsWith('video') ? 'video' : 'image',
            order: mediaFiles.length + index + 1,
            markers: [],
          } as ProductMedia;
        });
        const newFiles = await Promise.all(newMediaPromises);
        setMediaFiles(prev => [...prev, ...newFiles]);
      } catch (error) {
        showToast("Erro ao processar as imagens.", "error");
      }
    }
  };

  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const newMediaFiles = [...mediaFiles];
    const draggedItemContent = newMediaFiles.splice(dragItem.current, 1)[0];
    newMediaFiles.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setMediaFiles(newMediaFiles.map((item, index) => ({ ...item, order: index + 1 })));
  };

  const handleOpenMarkerModal = (mediaId: string) => {
    setMarkerModalConfig({ isOpen: true, mediaId });
  };

  const handleSaveMarkers = (markers: ProductMarker[]) => {
    const { mediaId } = markerModalConfig;
    if (mediaId) {
      setMediaFiles(prev => prev.map(m => m.id === mediaId ? { ...m, markers } : m));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData = { ...formData, media: mediaFiles };
    onSave(product ? { ...productData, id: product.id } : productData);
  };
  
  const categoryOptions = useMemo(() => {
    const parentCategories = categories.filter(c => !c.parentId);
    return parentCategories.map(parent => {
        const children = categories.filter(c => c.parentId === parent.id);
        return (
            <optgroup key={parent.id} label={parent.name}>
                {children.length === 0 && <option value={parent.id}>{parent.name}</option>}
                {children.map(child => <option key={child.id} value={child.id}>&nbsp;&nbsp;{child.name}</option>)}
            </optgroup>
        );
    });
  }, [categories]);

  return (
    <div className="p-8">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="text-primary hover:text-primary-light mr-4 p-2 rounded-full hover:bg-gray-800">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-bold text-white">{product ? 'Editar Produto' : 'Adicionar Produto'}</h2>
      </div>
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-4xl text-white mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          <fieldset className="border border-gray-700 p-4 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-gray-300">Informações e Estado</legend>
            <div className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
                    <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                    <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-300 mb-2">SKU</label>
                    <input id="sku" type="text" name="sku" value={formData.sku} onChange={handleChange} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">Preço (R$)</label>
                    <input id="price" type="number" name="price" value={formData.price} onChange={handleChange} step="0.01" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                    <div>
                    <label htmlFor="promotionalPrice" className="block text-sm font-medium text-gray-300 mb-2">Preço Promo. (R$)</label>
                    <input id="promotionalPrice" type="number" name="promotionalPrice" value={formData.promotionalPrice} onChange={handleChange} step="0.01" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                    <label htmlFor="condition" className="block text-sm font-medium text-gray-300 mb-2">Conservação</label>
                    <select id="condition" name="condition" value={formData.condition} onChange={handleChange} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="Novo">Novo</option>
                        <option value="Usado">Usado</option>
                    </select>
                    </div>
                    <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">Status Loja</label>
                    <select id="status" name="status" value={formData.status} onChange={handleChange} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                    </select>
                    </div>
                </div>
            </div>
          </fieldset>

          <fieldset className="border border-gray-700 p-4 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-gray-300">Mídias e Avarias</legend>
             <div className="pt-4">
                <label htmlFor="media" className="block text-sm font-medium text-gray-300 mb-2">Fotos e Vídeos (Arraste para ordenar)</label>
                <div className="bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                    <input id="media" type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"/>
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {mediaFiles.map((media, index) => (
                        <div key={media.id} className="relative group bg-gray-700 rounded-lg aspect-square overflow-hidden cursor-grab" draggable onDragStart={() => dragItem.current = index} onDragEnter={() => dragOverItem.current = index} onDragEnd={handleDragSort} onDragOver={(e) => e.preventDefault()}>
                            <img src={media.url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {media.type === 'image' && (
                                    <button type="button" onClick={() => handleOpenMarkerModal(media.id)} className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-2" title="Marcar Avarias">
                                        <TagIcon className="w-4 h-4"/>
                                    </button>
                                )}
                                <button type="button" onClick={() => setMediaFiles(prev => prev.filter(m => m.id !== media.id))} className="bg-red-600 hover:bg-red-500 text-white rounded-full p-2">
                                    <TrashIcon className="w-4 h-4"/>
                                </button>
                            </div>
                            {media.markers && media.markers.length > 0 && (
                                <div className="absolute top-1 left-1 bg-yellow-500 text-black text-[10px] font-bold px-1 rounded shadow">
                                    {media.markers.length} TAG
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
          </fieldset>

          <fieldset className="border border-gray-700 p-4 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-gray-300">Tamanhos e Detalhes</legend>
            <div className="pt-4 space-y-6">
                <div className="space-y-4">
                    <div className="flex gap-2 items-end bg-gray-700/30 p-3 rounded-lg">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-400 mb-1">Tamanho</label>
                            <input type="text" value={newSizeName} onChange={(e) => setNewSizeName(e.target.value)} placeholder="Ex: P, M, 42" className="bg-gray-700 p-2 rounded-md w-full text-sm outline-none" />
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-medium text-gray-400 mb-1">Qtd</label>
                            <input type="number" value={newSizeQuantity} onChange={(e) => setNewSizeQuantity(Number(e.target.value))} className="bg-gray-700 p-2 rounded-md w-full text-sm outline-none" />
                        </div>
                        <button type="button" onClick={handleAddSize} className="bg-primary hover:bg-primary-dark px-4 py-2 rounded-md text-sm font-bold transition-colors">Adicionar Tamanho</button>
                    </div>

                    {/* Lista de Tamanhos Registrados */}
                    {formData.sizes.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {formData.sizes.map((size, index) => (
                                <div key={index} className="bg-gray-700 border border-gray-600 rounded-lg p-2 flex flex-col items-center relative group">
                                    <span className="text-xs font-bold text-primary">{size.name}</span>
                                    <span className="text-sm font-medium">{size.quantity} un.</span>
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveSize(index)}
                                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <TrashIcon className="w-3 h-3"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Estoque Total calculado: <span className="font-bold text-white">{formData.stock}</span></p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
                        <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="bg-gray-700 p-3 rounded-md w-full outline-none" required>
                            <option value="">Selecione</option>
                            {categoryOptions}
                        </select>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="bg-gray-700 p-3 rounded-md w-full outline-none" required />
                        <button type="button" onClick={handleGenerateDescription} disabled={isGenerating} className="absolute bottom-2 right-2 bg-primary-dark hover:bg-primary text-white p-2 rounded-md flex items-center gap-1 text-xs transition-colors">
                            <SparklesIcon /> {isGenerating ? '...' : 'IA'}
                        </button>
                    </div>
                </div>
            </div>
          </fieldset>
          
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onBack} className="bg-gray-600 px-6 py-2 rounded-md font-bold hover:bg-gray-500 transition-colors">Cancelar</button>
            <button type="submit" className="bg-primary px-8 py-2 rounded-md font-bold hover:bg-primary-dark transition-colors">Salvar Produto</button>
          </div>
        </form>
      </div>

      <ImageMarkerModal
        isOpen={markerModalConfig.isOpen}
        onClose={() => setMarkerModalConfig({ isOpen: false, mediaId: null })}
        imageSrc={mediaFiles.find(m => m.id === markerModalConfig.mediaId)?.url || ''}
        markers={mediaFiles.find(m => m.id === markerModalConfig.mediaId)?.markers || []}
        onSave={handleSaveMarkers}
      />
    </div>
  );
};

export default ProductForm;
