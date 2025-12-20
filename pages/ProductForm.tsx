
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Product, Category, Brand, Model, Material, ProductMedia, Color, Toast, ProductSize, ProductMarker } from '../types';
import { generateDescription } from '../services/geminiService';
import { SparklesIcon, TrashIcon, GripVerticalIcon, VideoCameraIcon, ChevronLeftIcon, TagIcon, TruckIcon } from '../components/icons/Icons';
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
        // Normalização robusta de tamanhos vindo do banco
        let productSizes: ProductSize[] = [];
        if (product.sizes) {
            try {
                productSizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
            } catch (e) {
                console.error("Erro ao processar tamanhos:", e);
                productSizes = [];
            }
        }

        setFormData({ 
            ...initialState,
            ...product, 
            sizes: Array.isArray(productSizes) ? productSizes : [], 
            promotionalPrice: product.promotionalPrice || '0',
            width: product.width || '',
            height: product.height || '',
            depth: product.depth || '',
            weight: product.weight || '',
            categoryId: product.categoryId || '',
            brandId: product.brandId || '',
            modelId: product.modelId || '',
            materialId: product.materialId || '',
            colorId: product.colorId || '',
        });
        setMediaFiles(product.media ? [...product.media].sort((a, b) => a.order - b.order) : []);
    } else {
        setFormData(initialState);
        setMediaFiles([]);
    }
  }, [product]);

  // Sincroniza o estoque total com base na soma dos tamanhos
  useEffect(() => {
      const total = (formData.sizes || []).reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
      setFormData(prev => ({ ...prev, stock: total.toString() }));
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
      
      const currentSizes = formData.sizes || [];
      if (currentSizes.some(s => s.name.toUpperCase() === newSizeName.toUpperCase().trim())) {
          showToast('Este tamanho já existe.', 'info');
          return;
      }

      const newSize: ProductSize = { name: newSizeName.toUpperCase().trim(), quantity: newSizeQuantity };
      setFormData(prev => ({ ...prev, sizes: [...(prev.sizes || []), newSize] }));
      setNewSizeName('');
      setNewSizeQuantity(0);
  };

  const handleUpdateSizeQuantity = (index: number, newQty: number) => {
    setFormData(prev => {
        const updatedSizes = [...(prev.sizes || [])];
        updatedSizes[index] = { ...updatedSizes[index], quantity: Math.max(0, newQty) };
        return { ...prev, sizes: updatedSizes };
    });
  };

  const handleRemoveSize = (index: number) => {
      setFormData(prev => ({
          ...prev,
          sizes: (prev.sizes || []).filter((_, i) => i !== index)
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
    const productData = { 
        ...formData, 
        media: mediaFiles 
    };
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
        <button onClick={onBack} className="text-primary hover:text-primary-light mr-4 p-2 rounded-full hover:bg-gray-800 transition-colors">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-bold text-white">{product ? 'Editar Produto' : 'Adicionar Produto'}</h2>
      </div>

      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-5xl text-white mx-auto border border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* Sessão 1: Básico e Preços */}
          <fieldset className="border border-gray-700 p-6 rounded-2xl">
            <legend className="px-3 text-lg font-bold text-primary flex items-center gap-2">
               Informações Principais
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Nome do Produto</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="bg-gray-900 p-3 rounded-xl w-full focus:ring-2 focus:ring-primary border border-gray-700 outline-none" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">SKU / Código</label>
                    <input type="text" name="sku" value={formData.sku} onChange={handleChange} className="bg-gray-900 p-3 rounded-xl w-full focus:ring-2 focus:ring-primary border border-gray-700 outline-none" required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Preço (R$)</label>
                        <input type="number" name="price" value={formData.price} onChange={handleChange} step="0.01" className="bg-gray-900 p-3 rounded-xl w-full border border-gray-700" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Promo (R$)</label>
                        <input type="number" min="0" name="promotionalPrice" value={formData.promotionalPrice || 0} onChange={handleChange} step="0.01" className="bg-gray-900 p-3 rounded-xl w-full border border-gray-700" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Condição</label>
                        <select name="condition" value={formData.condition} onChange={handleChange} className="bg-gray-900 p-3 rounded-xl w-full border border-gray-700">
                            <option value="Novo">Novo</option>
                            <option value="Usado">Usado</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="bg-gray-900 p-3 rounded-xl w-full border border-gray-700">
                            <option value="Ativo">Ativo</option>
                            <option value="Inativo">Inativo</option>
                        </select>
                    </div>
                </div>
            </div>
          </fieldset>

          {/* Sessão 2: Atributos de Moda e Grade */}
          <fieldset className="border border-gray-700 p-6 rounded-2xl">
            <legend className="px-3 text-lg font-bold text-primary">Atributos e Grade de Tamanhos</legend>
            
            <div className="mt-4 space-y-8">
                {/* Seletores Técnicos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Categoria *</label>
                        <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="bg-gray-900 p-3 rounded-xl w-full border border-gray-700" required>
                            <option value="">Selecione</option>
                            {categoryOptions}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Marca</label>
                        <select name="brandId" value={formData.brandId} onChange={handleChange} className="bg-gray-900 p-3 rounded-xl w-full border border-gray-700">
                            <option value="">Selecione</option>
                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Modelo</label>
                        <select name="modelId" value={formData.modelId} onChange={handleChange} className="bg-gray-900 p-3 rounded-xl w-full border border-gray-700">
                            <option value="">Selecione</option>
                            {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Material</label>
                        <select name="materialId" value={formData.materialId} onChange={handleChange} className="bg-gray-900 p-3 rounded-xl w-full border border-gray-700">
                            <option value="">Selecione</option>
                            {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Cor Principal</label>
                        <select name="colorId" value={formData.colorId} onChange={handleChange} className="bg-gray-900 p-3 rounded-xl w-full border border-gray-700">
                            <option value="">Selecione</option>
                            {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Grade de Tamanhos */}
                <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Gestão de Estoque por Tamanho</h3>
                    <div className="flex gap-3 mb-6 items-end">
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Novo Tamanho</label>
                            <input type="text" value={newSizeName} onChange={(e) => setNewSizeName(e.target.value)} placeholder="Ex: P, 42, G" className="bg-gray-800 p-3 rounded-lg w-full border border-gray-700 text-sm" />
                        </div>
                        <div className="w-24">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Qtd</label>
                            <input type="number" value={newSizeQuantity} onChange={(e) => setNewSizeQuantity(Number(e.target.value))} className="bg-gray-800 p-3 rounded-lg w-full border border-gray-700 text-sm" />
                        </div>
                        <button type="button" onClick={handleAddSize} className="bg-primary hover:bg-primary-dark px-6 py-3 rounded-lg font-bold text-sm">Adicionar</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.sizes.map((size, index) => (
                            <div key={index} className="bg-gray-800 p-3 rounded-xl border border-gray-700 flex flex-col gap-2 relative group">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-extrabold text-primary">{size.name}</span>
                                    <button type="button" onClick={() => handleRemoveSize(index)} className="text-gray-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-500 uppercase">Qtd:</span>
                                    <input 
                                        type="number" 
                                        value={size.quantity} 
                                        onChange={(e) => handleUpdateSizeQuantity(index, Number(e.target.value))}
                                        className="w-full bg-gray-900 border border-gray-700 rounded p-1 text-xs text-white"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <p className="text-sm font-bold">Estoque Total: <span className="text-primary">{formData.stock}</span></p>
                    </div>
                </div>
            </div>
          </fieldset>

          {/* Sessão 3: Descrição e Logística */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <fieldset className="border border-gray-700 p-6 rounded-2xl h-fit">
                    <legend className="px-3 text-lg font-bold text-primary">Descrição</legend>
                    <div className="relative mt-4">
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={10} className="bg-gray-900 p-4 rounded-xl w-full border border-gray-700 text-sm outline-none focus:ring-1 focus:ring-primary" required />
                        <button type="button" onClick={handleGenerateDescription} disabled={isGenerating} className="absolute bottom-4 right-4 bg-primary-dark hover:bg-primary text-white p-2.5 rounded-xl flex items-center gap-2 text-xs transition-all shadow-xl">
                            <SparklesIcon className="w-4 h-4"/> {isGenerating ? 'Criando...' : 'IA Descrição'}
                        </button>
                    </div>
                </fieldset>

                <fieldset className="border border-gray-700 p-6 rounded-2xl h-fit">
                    <legend className="px-3 text-lg font-bold text-primary flex items-center gap-2">
                        <TruckIcon className="w-5 h-5"/> Dimensões Logísticas
                    </legend>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Peso (kg)</label>
                            <input type="text" name="weight" value={formData.weight} onChange={handleChange} placeholder="0.500" className="bg-gray-900 p-3 rounded-xl w-full border border-gray-700" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Largura (cm)</label>
                            <input type="text" name="width" value={formData.width} onChange={handleChange} placeholder="20" className="bg-gray-900 p-3 rounded-xl w-full border border-gray-700" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Altura (cm)</label>
                            <input type="text" name="height" value={formData.height} onChange={handleChange} placeholder="10" className="bg-gray-900 p-3 rounded-xl w-full border border-gray-700" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Profundidade (cm)</label>
                            <input type="text" name="depth" value={formData.depth} onChange={handleChange} placeholder="30" className="bg-gray-900 p-3 rounded-xl w-full border border-gray-700" />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-500 italic mt-4">Campos essenciais para o cálculo automático de frete.</p>
                </fieldset>
          </div>

          {/* Sessão 4: Mídias */}
          <fieldset className="border border-gray-700 p-6 rounded-2xl">
            <legend className="px-3 text-lg font-bold text-primary">Mídias do Produto</legend>
            <div className="mt-4 space-y-6">
                <div className="bg-gray-900/50 border-2 border-dashed border-gray-700 rounded-2xl p-10 text-center hover:border-primary transition-colors cursor-pointer relative group">
                    <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"/>
                    <div className="space-y-3">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <VideoCameraIcon className="w-8 h-8 text-gray-500"/>
                        </div>
                        <p className="text-gray-400 font-medium">Clique para selecionar ou arraste fotos e vídeos</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {mediaFiles.map((media, index) => (
                        <div key={media.id} className="relative group bg-gray-900 rounded-2xl aspect-square overflow-hidden border border-gray-700 shadow-lg cursor-grab" draggable onDragStart={() => dragItem.current = index} onDragEnter={() => dragOverItem.current = index} onDragEnd={handleDragSort} onDragOver={(e) => e.preventDefault()}>
                            <img src={media.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Preview" />
                            
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20">
                                {media.type === 'image' && (
                                    <button type="button" onClick={() => handleOpenMarkerModal(media.id)} className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-2.5 shadow-xl transition-all hover:scale-110">
                                        <TagIcon className="w-5 h-5"/>
                                    </button>
                                )}
                                <button type="button" onClick={() => setMediaFiles(prev => prev.filter(m => m.id !== media.id))} className="bg-red-600 hover:bg-red-500 text-white rounded-full p-2.5 shadow-xl transition-all hover:scale-110">
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                            
                            <div className="absolute bottom-2 left-2 bg-black/70 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white z-10">#{index + 1}</div>
                            {media.markers && media.markers.length > 0 && (
                                <div className="absolute top-2 left-2 bg-yellow-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg z-10 animate-pulse">
                                    {media.markers.length} MARCADORES
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
          </fieldset>

          <div className="flex justify-end gap-6 pt-6 border-t border-gray-700">
            <button type="button" onClick={onBack} className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold transition-all text-gray-300">Cancelar</button>
            <button type="submit" className="px-12 py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-2xl transition-all transform active:scale-95">
                {product ? 'Salvar Alterações' : 'Cadastrar Produto'}
            </button>
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
