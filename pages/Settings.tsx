
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { StoreSettings, Banner, Toast, WhatsAppProduct, Category, Brand, Model, Material, Color, Product } from '../types';
import { StorefrontIcon, PaletteIcon, InfoIcon, LinkIcon, ShareIcon, CreditCardIcon, TruckIcon, PhotographIcon, PencilIcon, TrashIcon, MailIcon, GlobeAltIcon, CodeBracketIcon, ChatIcon, CheckCircleIcon } from '../components/icons/Icons';
import * as whatsappService from '../services/whatsappService';
import ImportProductModal from '../components/ImportProductModal';
import { db } from '../services/apiService';

interface SettingsProps {
  settings: StoreSettings;
  updateSettings: (settings: StoreSettings) => void;
  addBanner: (banner: Omit<Banner, 'id'>) => void;
  updateBanner: (banner: Banner) => void;
  deleteBanner: (bannerId: string) => void;
  showToast: (message: string, type: Toast['type']) => void;
  categories: Category[];
  brands: Brand[];
  models: Model[];
  materials: Material[];
  colors: Color[];
  products: Product[];
  addProduct: (p: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
}

const ColorPicker: React.FC<{label: string, name: string, value: string, section: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({label, name, value, section, onChange}) => (
  <div className="flex items-center justify-between bg-gray-700/50 p-4 rounded-xl border border-gray-600/50">
      <label htmlFor={name} className="text-sm font-medium text-gray-200">{label}</label>
      <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-gray-400">{value.toUpperCase()}</span>
          <input 
            id={name} 
            type="color" 
            name={name} 
            data-section={section} 
            value={value} 
            onChange={onChange} 
            className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer p-0" 
          />
      </div>
  </div>
);

const InputField: React.FC<{label: string, name: string, value: string | number, section: string, placeholder?: string, type?: string, disabled?: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void}> = ({label, name, value, section, placeholder = '', type = 'text', disabled = false, onChange}) => (
  <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <input id={name} type={type} name={name} data-section={section} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-600 disabled:cursor-not-allowed" />
  </div>
);

const Settings: React.FC<SettingsProps> = ({ 
  settings, updateSettings, addBanner, updateBanner, deleteBanner, showToast,
  categories, brands, models, materials, colors, products, addProduct, updateProduct
}) => {
  const [activeTab, setActiveTab] = useState('loja');
  const [connectivityTab, setConnectivityTab] = useState<'conexao' | 'treinamento' | 'catalogo'>('conexao');
  const [formData, setFormData] = useState<StoreSettings>({ ...settings, banners: settings.banners || [] });
  const [connectionStatus, setConnectionStatus] = useState<StoreSettings['connectivity']['whatsappStatus']>(settings.connectivity.whatsappStatus);
  const [whatsappCatalog, setWhatsappCatalog] = useState<WhatsAppProduct[]>([]);
  const [isFetchingCatalog, setIsFetchingCatalog] = useState(false);
  
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedWAProduct, setSelectedWAProduct] = useState<WhatsAppProduct | null>(null);
  const [isBulkImport, setIsBulkImport] = useState(false);
  const [bulkQueue, setBulkQueue] = useState<WhatsAppProduct[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const instanceName = formData.connectivity.whatsappPhone || "default_store";

  useEffect(() => {
    if(settings) {
        setFormData(prev => ({ ...prev, ...settings, banners: settings.banners || [] }));
        setConnectionStatus(settings.connectivity.whatsappStatus);
    }
  }, [settings]);

  const loadCatalog = useCallback(async () => {
    if (connectionStatus !== 'Conectado' || !formData.connectivity.whatsappPhone) return;
    setIsFetchingCatalog(true);
    try {
        const products = await whatsappService.getCatalog(instanceName);
        setWhatsappCatalog(products);
    } catch (e) {
        showToast("Erro ao carregar catálogo do WhatsApp.", "error");
    } finally {
        setIsFetchingCatalog(false);
    }
  }, [connectionStatus, formData.connectivity.whatsappPhone, instanceName, showToast]);

  useEffect(() => {
    if (activeTab === 'conectividade' && connectivityTab === 'catalogo' && connectionStatus === 'Conectado') {
        loadCatalog();
    }
  }, [activeTab, connectivityTab, connectionStatus, loadCatalog]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, dataset, type } = e.target;
    const section = dataset.section as keyof StoreSettings | undefined;
    let processedValue: string | number = value;
    if (type === 'number') processedValue = value === '' ? 0 : Number(value);
    
    if (section) {
      setFormData(prev => ({ 
        ...prev, 
        [section]: { 
          ...(prev[section] as object), 
          [name]: processedValue 
        } 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setFormData(prev => ({
                    ...prev,
                    branding: { ...prev.branding, logoUrl: event.target?.result as string }
                }));
            }
        };
        reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleImportSingle = (waProd: WhatsAppProduct) => {
    const existing = products.find(p => p.sku === waProd.sku);
    if (existing) {
        const updated = {
            ...existing,
            name: waProd.name,
            price: waProd.price.toString(),
            description: waProd.description || existing.description
        };
        updateProduct(updated);
        showToast(`${waProd.name} atualizado com dados do WhatsApp!`, "success");
    } else {
        setSelectedWAProduct(waProd);
        setImportModalOpen(true);
    }
  };

  const handleImportAll = async () => {
    const toImport = whatsappCatalog.filter(wa => !products.some(p => p.sku === wa.sku));
    const toUpdate = whatsappCatalog.filter(wa => products.some(p => p.sku === wa.sku));

    for (const wa of toUpdate) {
        const existing = products.find(p => p.sku === wa.sku)!;
        await updateProduct({
            ...existing,
            name: wa.name,
            price: wa.price.toString(),
            description: wa.description || existing.description
        });
    }

    if (toImport.length > 0) {
        setBulkQueue(toImport);
        setSelectedWAProduct(toImport[0]);
        setImportModalOpen(true);
        setIsBulkImport(true);
    } else if (toUpdate.length > 0) {
        showToast(`${toUpdate.length} produtos foram sincronizados.`, "success");
    } else {
        showToast("Nada para importar.", "info");
    }
  };

  const handleSaveImported = async (productData: Omit<Product, 'id'>) => {
    await addProduct(productData);
    
    if (isBulkImport && bulkQueue.length > 1) {
        const nextQueue = bulkQueue.slice(1);
        setBulkQueue(nextQueue);
        setSelectedWAProduct(nextQueue[0]);
        setImportModalOpen(true);
    } else {
        setIsBulkImport(false);
        setBulkQueue([]);
        setSelectedWAProduct(null);
        showToast("Importação concluída!", "success");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    showToast('Configurações salvas!', 'success');
  };

  const tabs = [
    { id: 'loja', label: 'Loja', icon: StorefrontIcon },
    { id: 'cores', label: 'Cores e Logo', icon: PaletteIcon },
    { id: 'banners', label: 'Banners', icon: PhotographIcon },
    { id: 'email', label: 'E-mail', icon: MailIcon },
    { id: 'info', label: 'Informações', icon: InfoIcon },
    { id: 'seo', label: 'SEO', icon: GlobeAltIcon },
    { id: 'conectividade', label: 'Conectividade', icon: LinkIcon },
    { id: 'redes', label: 'Redes Sociais', icon: ShareIcon },
    { id: 'pagamento', label: 'Mercado Pago', icon: CreditCardIcon },
    { id: 'frete', label: 'Frete', icon: TruckIcon },
    { id: 'api', label: 'API / Integração', icon: CodeBracketIcon },
  ];

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Conectado': return 'bg-green-500/20 text-green-400';
          case 'Conectando': return 'bg-yellow-500/20 text-yellow-400';
          default: return 'bg-red-500/20 text-red-400';
      }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Configurações da Loja</h2>
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-1/4">
          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center w-full px-4 py-3 rounded-lg text-left transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                <tab.icon className="w-5 h-5 mr-3 shrink-0" />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-lg space-y-8">
            {activeTab === 'loja' && (
              <section className="space-y-6">
                <h3 className="text-xl font-semibold text-white mb-6">Dados da Loja</h3>
                <InputField label="Nome da Loja" name="storeName" value={formData.storeName} section="" onChange={handleInputChange} />
                <InputField label="Domínio" name="domain" value={formData.domain || ''} section="" placeholder="www.sualoja.com.br" onChange={handleInputChange} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <InputField label="Cidade" name="city" value={formData.address.city} section="address" onChange={handleInputChange} />
                   <InputField label="Estado" name="state" value={formData.address.state} section="address" onChange={handleInputChange} />
                </div>
              </section>
            )}

            {activeTab === 'cores' && (
              <section className="space-y-8 animate-fade-in">
                <div>
                    <h3 className="text-xl font-semibold text-white mb-6">Identidade Visual</h3>
                    <div className="flex flex-col md:flex-row items-center gap-8 bg-gray-700/30 p-6 rounded-2xl border border-gray-600/50">
                        <div className="relative group">
                            <div className="w-40 h-40 bg-gray-700 rounded-2xl overflow-hidden border-2 border-dashed border-gray-500 flex items-center justify-center">
                                {formData.branding.logoUrl ? (
                                    <img src={formData.branding.logoUrl} className="max-w-full max-h-full object-contain p-2" />
                                ) : (
                                    <PhotographIcon className="w-12 h-12 text-gray-500" />
                                )}
                            </div>
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold rounded-2xl"
                            >
                                Alterar Logo
                            </button>
                            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                        </div>
                        <div className="flex-1 space-y-2">
                            <h4 className="font-bold text-gray-200">Logo da Loja</h4>
                            <p className="text-sm text-gray-400">Recomendamos imagens em PNG com fundo transparente. Tamanho ideal: 400x400px.</p>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-primary hover:text-primary-light text-sm font-bold">Enviar novo arquivo</button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorPicker label="Cor Primária" name="primaryColor" value={formData.branding.primaryColor} section="branding" onChange={handleInputChange} />
                    <ColorPicker label="Cor Secundária" name="secondaryColor" value={formData.branding.secondaryColor} section="branding" onChange={handleInputChange} />
                    <ColorPicker label="Cor de Destaque" name="accentColor" value={formData.branding.accentColor} section="branding" onChange={handleInputChange} />
                    <ColorPicker label="Fundo da Página" name="backgroundColor" value={formData.branding.backgroundColor} section="branding" onChange={handleInputChange} />
                    <ColorPicker label="Cor do Texto" name="textColor" value={formData.branding.textColor} section="branding" onChange={handleInputChange} />
                    <ColorPicker label="Fundo do Cabeçalho" name="headerBackgroundColor" value={formData.branding.headerBackgroundColor} section="branding" onChange={handleInputChange} />
                </div>
              </section>
            )}

            {activeTab === 'conectividade' && (
                <section>
                    <div className="flex space-x-1 bg-gray-700 p-1 rounded-lg mb-6 w-fit">
                         {['conexao', 'treinamento', 'catalogo'].map(t => (
                             <button key={t} type="button" onClick={() => setConnectivityTab(t as any)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${connectivityTab === t ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                                 {t.charAt(0).toUpperCase() + t.slice(1)}
                             </button>
                         ))}
                    </div>

                    {connectivityTab === 'conexao' && (
                        <div className="space-y-6 animate-fade-in">
                             <InputField label="Telefone Whatsapp" name="whatsappPhone" value={formData.connectivity.whatsappPhone} section="connectivity" placeholder="Ex: 5511999999999" onChange={handleInputChange} />
                             <div className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
                                <span className="font-medium">Status</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(connectionStatus)}`}>
                                    {connectionStatus}
                                </span>
                             </div>
                        </div>
                    )}

                    {connectivityTab === 'catalogo' && (
                         <div className="animate-fade-in">
                             <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-semibold text-white">Catálogo do WhatsApp</h3>
                                    <p className="text-gray-400 text-sm">Gerencie e importe produtos diretamente para sua loja.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={handleImportAll} disabled={isFetchingCatalog || whatsappCatalog.length === 0} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50">
                                        Importar / Sincronizar Tudo
                                    </button>
                                    <button type="button" onClick={loadCatalog} disabled={isFetchingCatalog} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors">
                                        <svg className={`w-5 h-5 ${isFetchingCatalog ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 11v-5h-5m-1 1l-15-15"/></svg>
                                    </button>
                                </div>
                             </div>
                             
                             {connectionStatus !== 'Conectado' ? (
                                 <div className="text-center p-12 bg-gray-700/50 rounded-xl border border-gray-600 border-dashed">
                                     <ChatIcon className="w-12 h-12 mx-auto text-gray-500 mb-4"/>
                                     <p className="text-gray-400">Conecte-se ao WhatsApp para visualizar e importar produtos.</p>
                                 </div>
                             ) : isFetchingCatalog ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[1,2,3,4].map(i => <div key={i} className="bg-gray-700 h-64 rounded-xl animate-pulse"></div>)}
                                </div>
                             ) : (
                                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                     {whatsappCatalog.map(item => {
                                         const isImported = products.some(p => p.sku === item.sku);
                                         return (
                                             <div key={item.id} className={`bg-gray-700/50 rounded-xl overflow-hidden border transition-all flex flex-col group ${isImported ? 'border-green-500/30' : 'border-gray-600 hover:border-primary'}`}>
                                                 <div className="relative aspect-square overflow-hidden bg-gray-600">
                                                     <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105"/>
                                                     {isImported && (
                                                         <div className="absolute top-2 left-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                                                             <CheckCircleIcon className="w-4 h-4" />
                                                         </div>
                                                     )}
                                                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 text-center">
                                                         <button type="button" onClick={() => handleImportSingle(item)} className="bg-white text-gray-900 px-4 py-2 rounded-lg text-xs font-bold shadow-xl">
                                                             {isImported ? 'Sincronizar' : 'Importar'}
                                                         </button>
                                                     </div>
                                                 </div>
                                                 <div className="p-3 flex-1 flex flex-col">
                                                     <h4 className="font-semibold text-white truncate text-sm">{item.name}</h4>
                                                     <p className="text-primary font-bold mt-1">R$ {item.price.toFixed(2)}</p>
                                                     <p className="text-[10px] text-gray-500 mt-auto">SKU: {item.sku || 'Sem SKU'}</p>
                                                 </div>
                                             </div>
                                         );
                                     })}
                                 </div>
                             )}
                        </div>
                    )}
                </section>
            )}

            {activeTab !== 'banners' && activeTab !== 'api' && (
                <div className="border-t border-gray-700 pt-6 flex justify-end">
                  <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-10 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95">
                    Salvar Alterações
                  </button>
                </div>
            )}
          </form>
        </main>
      </div>

      <ImportProductModal 
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        waProduct={selectedWAProduct}
        onSave={handleSaveImported}
        categories={categories}
        brands={brands}
        models={models}
        materials={materials}
        colors={colors}
        showToast={showToast}
        isUpdate={products.some(p => p.sku === selectedWAProduct?.sku)}
      />
    </div>
  );
};

export default Settings;
