import React, { useState, useEffect, useMemo, useRef } from 'react';
// FIX: Added Toast to the import.
import type { Product, Category, Brand, Model, Material, ProductMedia, Color, Toast } from '../types';
import { generateDescription } from '../services/geminiService';
import { SparklesIcon, TrashIcon, GripVerticalIcon, VideoCameraIcon, ChevronLeftIcon } from '../components/icons/Icons';

interface ProductFormProps {
  onBack: () => void;
  onSave: (product: Product | Omit<Product, 'id'>) => void;
  product: Product | null;
  categories: Category[];
  brands: Brand[];
  models: Model[];
  materials: Material[];
  colors: Color[];
  // FIX: Added showToast to the props interface to handle component-specific notifications.
  showToast: (message: string, type: Toast['type']) => void;
}

const initialState: Omit<Product, 'id'> = {
  name: '',
  sku: '',
  price: 0,
  stock: 0,
  categoryId: '',
  brandId: '',
  modelId: '',
  materialId: '',
  colorId: '',
  media: [],
  description: '',
  status: 'Ativo',
  width: 0,
  height: 0,
  depth: 0,
  weight: 0,
};

const ProductForm: React.FC<ProductFormProps> = ({ onBack, onSave, product, categories, brands, models, materials, colors, showToast }) => {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>(initialState);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<ProductMedia[]>([]);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    if (product) {
        setFormData({ ...product });
        setMediaFiles(product.media.sort((a, b) => a.order - b.order));
    } else {
        setFormData(initialState);
        setMediaFiles([]);
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['price', 'stock', 'width', 'height', 'depth', 'weight'];
    setFormData(prev => ({ ...prev, [name]: numericFields.includes(name) ? Number(value) : value }));
  };

  const handleGenerateDescription = async () => {
    const categoryName = categories.find(c => c.id === formData.categoryId)?.name;
    if (!formData.name || !categoryName) {
      // FIX: Replaced alert with showToast for a more integrated notification system.
      showToast("Por favor, preencha o nome e a categoria do produto para gerar uma descrição.", "error");
      return;
    }
    setIsGenerating(true);
    const description = await generateDescription(formData.name, categoryName);
    setFormData(prev => ({ ...prev, description }));
    setIsGenerating(false);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file: File, index) => ({
        id: `new-${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video') ? 'video' : 'image',
        order: mediaFiles.length + index + 1,
      } as ProductMedia));
      setMediaFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveMedia = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover esta mídia?')) {
      setMediaFiles(prev => prev.filter(media => media.id !== id));
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


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.brandId || !formData.modelId || !formData.materialId || !formData.colorId) {
        // FIX: Replaced alert with showToast for consistent error feedback.
        showToast("Por favor, selecione todas as opções: Categoria, Marca, Modelo, Material e Cor.", "error");
        return;
    }
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
                {children.map(child => (
                    <option key={child.id} value={child.id}>&nbsp;&nbsp;{child.name}</option>
                ))}
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
            <legend className="px-2 text-lg font-semibold text-gray-300">Informações Básicas</legend>
            <div className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Nome do Produto</label>
                    <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Camiseta Básica" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                    <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-300 mb-2">SKU</label>
                    <input id="sku" type="text" name="sku" value={formData.sku} onChange={handleChange} placeholder="Ex: CAM-BAS-01" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">Preço (R$)</label>
                    <input id="price" type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0.00" step="0.01" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                    <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-300 mb-2">Estoque</label>
                    <input id="stock" type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="0" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" required />
                    </div>
                </div>
            </div>
          </fieldset>
          
          <fieldset className="border border-gray-700 p-4 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-gray-300">Dimensões e Peso (Embalagem)</legend>
            <div className="pt-4">
                <p className="text-sm text-gray-400 mb-4">
                    Esses valores são usados para o cálculo de frete.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                    <label htmlFor="width" className="block text-sm font-medium text-gray-300 mb-2">Largura (cm)</label>
                    <input id="width" type="number" name="width" value={formData.width} onChange={handleChange} placeholder="0" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                    <label htmlFor="height" className="block text-sm font-medium text-gray-300 mb-2">Altura (cm)</label>
                    <input id="height" type="number" name="height" value={formData.height} onChange={handleChange} placeholder="0" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                    <label htmlFor="depth" className="block text-sm font-medium text-gray-300 mb-2">Profundidade (cm)</label>
                    <input id="depth" type="number" name="depth" value={formData.depth} onChange={handleChange} placeholder="0" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-300 mb-2">Peso (kg)</label>
                    <input id="weight" type="number" name="weight" value={formData.weight} onChange={handleChange} placeholder="0.0" step="0.1" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                </div>
            </div>
          </fieldset>

          <fieldset className="border border-gray-700 p-4 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-gray-300">Categorização</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
                    <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" required>
                        <option value="">Selecione a Categoria</option>
                        {categoryOptions}
                    </select>
                </div>
                <div>
                    <label htmlFor="brandId" className="block text-sm font-medium text-gray-300 mb-2">Marca</label>
                    <select id="brandId" name="brandId" value={formData.brandId} onChange={handleChange} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" required>
                        <option value="">Selecione a Marca</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="modelId" className="block text-sm font-medium text-gray-300 mb-2">Modelo</label>
                    <select id="modelId" name="modelId" value={formData.modelId} onChange={handleChange} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" required>
                        <option value="">Selecione o Modelo</option>
                        {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="materialId" className="block text-sm font-medium text-gray-300 mb-2">Material</label>
                    <select id="materialId" name="materialId" value={formData.materialId} onChange={handleChange} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" required>
                        <option value="">Selecione o Material</option>
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="colorId" className="block text-sm font-medium text-gray-300 mb-2">Cor</label>
                    <select id="colorId" name="colorId" value={formData.colorId} onChange={handleChange} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" required>
                        <option value="">Selecione a Cor</option>
                        {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>
          </fieldset>
          
          <fieldset className="border border-gray-700 p-4 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-gray-300">Mídia</legend>
             <div className="pt-4">
                <label htmlFor="media" className="block text-sm font-medium text-gray-300 mb-2">Mídias do Produto (Imagens e Vídeos)</label>
                <div className="bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                    <input
                    id="media"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-2">Arraste e solte para ordenar. A primeira imagem será a principal.</p>
                </div>
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {mediaFiles.map((media, index) => (
                        <div
                            key={media.id}
                            className="relative group bg-gray-700 rounded-lg aspect-square flex items-center justify-center cursor-grab"
                            draggable
                            onDragStart={() => (dragItem.current = index)}
                            onDragEnter={() => (dragOverItem.current = index)}
                            onDragEnd={handleDragSort}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            {media.type === 'image' ? (
                                <img src={media.url} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <video src={media.url} className="w-full h-full object-cover rounded-lg" />
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1">
                            <span className="text-white text-xs text-center">{index === 0 ? "Principal" : `Posição ${index + 1}`}</span>
                            </div>
                            <button type="button" onClick={() => handleRemoveMedia(media.id)} className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-500 text-white rounded-full p-1 z-10">
                                <TrashIcon className="w-3 h-3"/>
                            </button>
                            {media.type === 'video' && <VideoCameraIcon className="absolute bottom-1 right-1 text-white w-4 h-4"/> }
                            <GripVerticalIcon className="absolute left-1 top-1/2 -translate-y-1/2 text-white/50 w-4 h-4" />
                        </div>
                    ))}
                </div>
            </div>
          </fieldset>

          <fieldset className="border border-gray-700 p-4 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-gray-300">Publicação</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select id="status" name="status" value={formData.status} onChange={handleChange} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    </select>
                </div>
                <div className="relative">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Descreva o produto..." rows={5} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" required />
                    <button type="button" onClick={handleGenerateDescription} disabled={isGenerating} className="absolute bottom-3 right-3 bg-primary-dark hover:bg-primary text-white font-semibold py-1 px-3 rounded-md flex items-center gap-2 text-sm disabled:bg-gray-600 transition-colors">
                    <SparklesIcon />
                    {isGenerating ? 'Gerando...' : 'Gerar com IA'}
                    </button>
                </div>
            </div>
          </fieldset>
          
          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onBack} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors">Cancelar</button>
            <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-md transition-colors">Salvar Produto</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
