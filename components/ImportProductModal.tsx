
import React, { useState, useEffect } from 'react';
import type { WhatsAppProduct, Category, Brand, Model, Material, Color, Product, Toast } from '../types';

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
        price: waProduct.price?.toString() || '',
        description: waProduct.description || '',
        media: waProduct.imageUrl ? [{ id: 'wa-img', url: waProduct.imageUrl, type: 'image', order: 1, markers: [] }] : [],
        modelId: '',
        materialId: '',
        colorId: '',
        brandId: '',
        sizes: []
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
    onSave(formData);
    onClose();
  };

  if (!isOpen || !waProduct) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[60] p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto text-white border border-gray-700">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-800 z-10">
          <div>
            <h2 className="text-2xl font-bold">{isUpdate ? 'Sincronizar Produto' : 'Importar do WhatsApp'}</h2>
            <p className="text-gray-400 text-sm">Preencha os detalhes técnicos para finalizar.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Dados de Moda */}
            <div className="space-y-6">
              <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 flex gap-4">
                  <img src={waProduct.imageUrl} className="w-20 h-20 rounded-lg object-cover bg-gray-900" />
                  <div>
                    <p className="font-bold text-primary">{waProduct.name}</p>
                    <p className="text-sm text-gray-400">SKU: {waProduct.sku || 'N/A'}</p>
                    <p className="font-bold mt-1 text-lg">R$ {Number(waProduct.price).toFixed(2)}</p>
                  </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria *</label>
                  <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full bg-gray-900 p-3 rounded-xl border border-gray-700 outline-none" required>
                    <option value="">Selecione...</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Marca</label>
                    <select name="brandId" value={formData.brandId} onChange={handleChange} className="w-full bg-gray-900 p-3 rounded-xl border border-gray-700">
                      <option value="">Opcional</option>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Modelo</label>
                    <select name="modelId" value={formData.modelId} onChange={handleChange} className="w-full bg-gray-900 p-3 rounded-xl border border-gray-700">
                      <option value="">Opcional</option>
                      {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Material</label>
                    <select name="materialId" value={formData.materialId} onChange={handleChange} className="w-full bg-gray-900 p-3 rounded-xl border border-gray-700">
                      <option value="">Opcional</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cor</label>
                    <select name="colorId" value={formData.colorId} onChange={handleChange} className="w-full bg-gray-900 p-3 rounded-xl border border-gray-700">
                      <option value="">Opcional</option>
                      {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Logística e Detalhes */}
            <div className="space-y-6">
               <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-700">
                 <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">Dimensões para Frete</h4>
                 <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase mb-1">Peso(kg)</label>
                      <input type="text" name="weight" value={formData.weight} onChange={handleChange} placeholder="0.5" className="w-full bg-gray-800 p-2 rounded-lg border border-gray-700 text-xs" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase mb-1">Larg(cm)</label>
                      <input type="text" name="width" value={formData.width} onChange={handleChange} className="w-full bg-gray-800 p-2 rounded-lg border border-gray-700 text-xs" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase mb-1">Alt(cm)</label>
                      <input type="text" name="height" value={formData.height} onChange={handleChange} className="w-full bg-gray-800 p-2 rounded-lg border border-gray-700 text-xs" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 uppercase mb-1">Prof(cm)</label>
                      <input type="text" name="depth" value={formData.depth} onChange={handleChange} className="w-full bg-gray-800 p-2 rounded-lg border border-gray-700 text-xs" />
                    </div>
                 </div>
               </div>

               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label>
                 <textarea name="description" value={formData.description} onChange={handleChange} rows={6} className="w-full bg-gray-900 p-4 rounded-xl border border-gray-700 outline-none text-sm"></textarea>
               </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
            <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold transition-all">Cancelar</button>
            <button type="submit" className="px-10 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-xl transition-all transform active:scale-95">
              Confirmar e Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportProductModal;
