
import React, { useState, useEffect } from 'react';
import type { WhatsAppProduct, Category, Brand, Model, Material, Color, Product, ProductSize, Toast } from '../types';

interface ImportProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id'>) => void;
  waProduct: WhatsAppProduct | null;
  categories: Category[];
  brands: Brand[];
  models: Model[];
  materials: Material[];
  colors: Color[];
  showToast: (message: string, type: Toast['type']) => void;
  isUpdate?: boolean;
}

const ImportProductModal: React.FC<ImportProductModalProps> = ({ 
  isOpen, onClose, onSave, waProduct, categories, brands, models, materials, colors, showToast, isUpdate = false 
}) => {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '', sku: '', price: '', stock: '0', sizes: [], categoryId: '', brandId: '', modelId: '', materialId: '', colorId: '',
    media: [], description: '', condition: 'Novo', status: 'Ativo', width: '', height: '', depth: '', weight: ''
  });

  useEffect(() => {
    if (waProduct && isOpen) {
      setFormData(prev => ({
        ...prev,
        name: waProduct.name || '',
        sku: waProduct.sku || '',
        // O preço já vem dividido por 100 do serviço
        price: waProduct.price?.toString() || '',
        description: waProduct.description || '',
        media: waProduct.imageUrl ? [{ id: 'wa-img', url: waProduct.imageUrl, type: 'image', order: 1 }] : [],
        // Garantindo que os campos técnicos comecem vazios para seleção obrigatória ou manual
        modelId: '',
        materialId: '',
        colorId: ''
      }));
    }
  }, [waProduct, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      showToast("Selecione uma categoria para o produto.", "error");
      return;
    }
    // Opcional: Validar se campos de moda foram preenchidos
    if (!formData.modelId || !formData.materialId || !formData.colorId) {
        showToast("Por favor, preencha Modelo, Material e Cor para manter o padrão do catálogo.", "info");
    }

    onSave(formData);
    onClose();
  };

  if (!isOpen || !waProduct) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[60] p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto text-white">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 z-10">
          <div>
            <h2 className="text-2xl font-bold">{isUpdate ? 'Atualizar Produto' : 'Concluir Importação'}</h2>
            <p className="text-gray-400 text-sm">Produto vindo do WhatsApp: <span className="text-primary font-medium">{waProduct.name}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Lado Esquerdo: Identificação e Atributos de Moda */}
            <div className="space-y-6">
              <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">Dados do WhatsApp</h3>
                <div className="flex gap-4">
                   <img src={waProduct.imageUrl} className="w-24 h-24 rounded-lg object-cover bg-gray-600" />
                   <div>
                      <p className="font-bold">{waProduct.name}</p>
                      <p className="text-primary font-bold text-lg">R$ {Number(waProduct.price).toFixed(2)}</p>
                      <p className="text-xs text-gray-400">SKU: {waProduct.sku || 'N/A'}</p>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Categoria *</label>
                  <select 
                    name="categoryId" 
                    value={formData.categoryId} 
                    onChange={handleChange} 
                    className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-primary outline-none"
                    required
                  >
                    <option value="">Selecione...</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Marca</label>
                  <select name="brandId" value={formData.brandId} onChange={handleChange} className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600">
                    <option value="">Selecione...</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Modelo</label>
                  <select name="modelId" value={formData.modelId} onChange={handleChange} className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600">
                    <option value="">Selecione...</option>
                    {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Material</label>
                  <select name="materialId" value={formData.materialId} onChange={handleChange} className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600">
                    <option value="">Selecione...</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Cor Predominante</label>
                  <select name="colorId" value={formData.colorId} onChange={handleChange} className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600">
                    <option value="">Selecione...</option>
                    {colors.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Lado Direito: Logística e Descrição */}
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Estoque</label>
                    <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Condição</label>
                    <select name="condition" value={formData.condition} onChange={handleChange} className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600">
                        <option value="Novo">Novo</option>
                        <option value="Usado">Usado</option>
                    </select>
                  </div>
               </div>

               <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600/50">
                 <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Dimensões para Frete (cm/kg)</h4>
                 <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Peso</label>
                      <input type="text" name="weight" value={formData.weight} onChange={handleChange} placeholder="0.5" className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Larg.</label>
                      <input type="text" name="width" value={formData.width} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Alt.</label>
                      <input type="text" name="height" value={formData.height} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Prof.</label>
                      <input type="text" name="depth" value={formData.depth} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-sm" />
                    </div>
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-2">Descrição do Produto</label>
                 <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 outline-none focus:ring-2 focus:ring-primary text-sm"></textarea>
               </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
            <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-xl font-bold transition-colors">Cancelar</button>
            <button type="submit" className="px-10 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all transform active:scale-95">
              {isUpdate ? 'Salvar Atualizações' : 'Confirmar Importação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportProductModal;
