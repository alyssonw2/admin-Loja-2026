
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { StoreSettings, Banner, Toast, WhatsAppProduct, Category, Brand, Model, Material, Color, Product } from '../types';
import { StorefrontIcon, PaletteIcon, InfoIcon, LinkIcon, ShareIcon, CreditCardIcon, TruckIcon, PhotographIcon, PencilIcon, TrashIcon, MailIcon, GlobeAltIcon, CodeBracketIcon, ChatIcon, CheckCircleIcon, ArrowRightIcon, CpuChipIcon } from '../components/icons/Icons';
import * as whatsappService from '../services/whatsappService';
import ImportProductModal from '../components/ImportProductModal';
import BannerModal from '../components/BannerModal';
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

const FONT_OPTIONS = [
    "Inter", "Raleway", "Open Sans", "Montserrat", "Roboto", "Poppins", "Lato", "Playfair Display", "Oswald", "Nunito"
];

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
      <input id={name} type={type} name={name} data-section={section} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-600 disabled:cursor-not-allowed text-white" />
  </div>
);

const TextAreaField: React.FC<{label: string, name: string, value: string, section: string, placeholder?: string, rows?: number, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void}> = ({label, name, value, section, placeholder = '', rows = 4, onChange}) => (
  <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <textarea id={name} name={name} data-section={section} value={value} onChange={onChange} placeholder={placeholder} rows={rows} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary text-white resize-none font-mono text-sm" />
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
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedWAProduct, setSelectedWAProduct] = useState<WhatsAppProduct | null>(null);
  const [isBulkImport, setIsBulkImport] = useState(false);
  const [bulkQueue, setBulkQueue] = useState<WhatsAppProduct[]>([]);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<any>(null);
  
  const instanceName = formData.connectivity.whatsappPhone || "default_store";

  useEffect(() => {
    if(settings) {
        setFormData(prev => ({ ...prev, ...settings, banners: settings.banners || [] }));
        setConnectionStatus(settings.connectivity.whatsappStatus);
    }
  }, [settings]);

  // Limpa o polling ao desmontar
  useEffect(() => {
    return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

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
    
    setFormData(prev => {
        if (section) {
            let processedValue: any = value;
            if (type === 'number') processedValue = value === '' ? 0 : Number(value);
            if (type === 'checkbox') processedValue = (e.target as HTMLInputElement).checked;

            if (name.includes('.')) {
                const [parent, child] = name.split('.');
                return {
                    ...prev,
                    [section]: {
                        ...(prev[section] as any),
                        [parent]: {
                            ...(prev[section] as any)[parent],
                            [child]: processedValue
                        }
                    }
                };
            }

            return { 
                ...prev, 
                [section]: { 
                    ...(prev[section] as object), 
                    [name]: processedValue 
                } 
            };
        } else {
            return { ...prev, [name]: value };
        }
    });
  };

  const startQrPolling = () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      
      pollingRef.current = setInterval(async () => {
          try {
              const data = await whatsappService.getQrCode(instanceName);
              if (data.qrCode) {
                  setQrCode(data.qrCode);
                  setConnectionStatus('Conectando');
              } else {
                  // Se não tem QR Code, pode ser que já conectou
                  setQrCode(null);
                  setConnectionStatus('Conectado');
                  clearInterval(pollingRef.current);
                  showToast("WhatsApp conectado com sucesso!", "success");
              }
          } catch (e) {
              console.error("Erro no polling do WhatsApp", e);
          }
      }, 1000);
  };

  const handleConnectWhatsApp = async () => {
    if (!formData.connectivity.whatsappPhone) {
        showToast("Informe o número do WhatsApp primeiro.", "error");
        return;
    }
    setIsConnecting(true);
    setConnectionStatus('Conectando');
    setQrCode(null);
    
    try {
        await whatsappService.connectInstance(instanceName);
        startQrPolling();
        showToast("Iniciando conexão. Aguarde o QR Code...", "info");
    } catch (e) {
        showToast("Erro ao iniciar conexão do WhatsApp.", "error");
        setConnectionStatus('Desconectado');
        setIsConnecting(false);
    } finally {
        setIsConnecting(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    try {
        await whatsappService.disconnectInstance(instanceName);
        setConnectionStatus('Desconectado');
        setQrCode(null);
        showToast("WhatsApp desconectado.", "info");
    } catch (e) {
        showToast("Erro ao desconectar instância.", "error");
    }
  };

  const handleReconnectWhatsApp = async () => {
    setQrCode(null);
    setConnectionStatus('Conectando');
    if (pollingRef.current) clearInterval(pollingRef.current);
    try {
        await whatsappService.disconnectInstance(instanceName);
        setTimeout(handleConnectWhatsApp, 1500);
    } catch (e) {
        handleConnectWhatsApp();
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

  const handleOpenBannerModal = (banner: Banner | null = null) => {
    setEditingBanner(banner);
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = (bannerData: Banner | Omit<Banner, 'id'>) => {
    if ('id' in bannerData) {
        updateBanner(bannerData as Banner);
    } else {
        addBanner(bannerData);
    }
  };

  const handleDeleteBanner = (id: string) => {
    if (window.confirm("Deseja realmente excluir este banner?")) {
        deleteBanner(id);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
        // Se o telefone estiver presente, garante que a instância foi criada
        if (formData.connectivity.whatsappPhone) {
            await whatsappService.createInstance(formData.connectivity.whatsappPhone);
        }
        
        updateSettings({ 
            ...formData, 
            connectivity: { 
                ...formData.connectivity, 
                whatsappStatus: connectionStatus 
            } 
        });
        showToast('Configurações e instância salvas!', 'success');
    } catch (err) {
        console.error("Erro ao salvar configurações", err);
        showToast('Erro ao criar instância do WhatsApp.', 'error');
    } finally {
        setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copiado para a área de transferência!", "success");
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
    { id: 'api', label: 'API / IA', icon: CodeBracketIcon },
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
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
            {activeTab === 'loja' && (
              <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                <section className="space-y-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Dados da Loja</h3>
                  <InputField label="Nome da Loja" name="storeName" value={formData.storeName} section="" onChange={handleInputChange} />
                  <InputField label="Domínio" name="domain" value={formData.domain || ''} section="" placeholder="www.sualoja.com.br" onChange={handleInputChange} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <InputField label="Cidade" name="city" value={formData.address.city} section="address" onChange={handleInputChange} />
                     <InputField label="Estado" name="state" value={formData.address.state} section="address" onChange={handleInputChange} />
                  </div>
                </section>
                <div className="border-t border-gray-700 pt-6 flex justify-end">
                    <button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
              </form>
            )}

            {activeTab === 'cores' && (
              <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
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

                <section className="space-y-6 pt-6 border-t border-gray-700">
                    <h3 className="text-xl font-semibold text-white mb-4">Tipografia</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="headingFont" className="block text-sm font-medium text-gray-300 mb-2">Fonte para Títulos</label>
                            <select 
                                id="headingFont" 
                                name="headingFont" 
                                data-section="branding" 
                                value={formData.branding.headingFont} 
                                onChange={handleInputChange}
                                className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary text-white"
                            >
                                {FONT_OPTIONS.map(font => <option key={font} value={font}>{font}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="bodyFont" className="block text-sm font-medium text-gray-300 mb-2">Fonte para o Corpo</label>
                            <select 
                                id="bodyFont" 
                                name="bodyFont" 
                                data-section="branding" 
                                value={formData.branding.bodyFont} 
                                onChange={handleInputChange}
                                className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary text-white"
                            >
                                {FONT_OPTIONS.map(font => <option key={font} value={font}>{font}</option>)}
                            </select>
                        </div>
                    </div>
                </section>

                <div className="border-t border-gray-700 pt-6 flex justify-end">
                    <button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
              </form>
            )}

            {activeTab === 'banners' && (
                <section className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-semibold text-white">Gerenciar Banners</h3>
                            <p className="text-gray-400 text-sm">Banners rotativos para a página inicial.</p>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => handleOpenBannerModal()}
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-primary/20"
                        >
                            Adicionar Banner
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {formData.banners.length === 0 ? (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-700 rounded-2xl bg-gray-700/20">
                                <PhotographIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                                <p className="text-gray-500 font-medium">Nenhum banner cadastrado ainda.</p>
                            </div>
                        ) : (
                            formData.banners.map((banner) => (
                                <div key={banner.id} className="bg-gray-700/50 rounded-2xl overflow-hidden border border-gray-600 flex flex-col group shadow-sm hover:shadow-xl transition-all">
                                    <div className="relative aspect-[3/1] overflow-hidden bg-gray-900">
                                        <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <button 
                                                onClick={() => handleOpenBannerModal(banner)}
                                                className="bg-white text-gray-900 p-2.5 rounded-full hover:bg-primary hover:text-white transition-colors"
                                                title="Editar Banner"
                                            >
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteBanner(banner.id)}
                                                className="bg-white text-red-600 p-2.5 rounded-full hover:bg-red-600 hover:text-white transition-colors"
                                                title="Excluir Banner"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1">
                                        <h4 className="font-bold text-white text-lg truncate">{banner.title}</h4>
                                        <p className="text-gray-400 text-xs line-clamp-2 mt-1 mb-3">{banner.description || 'Sem descrição'}</p>
                                        {banner.buttonText && (
                                            <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                                {banner.buttonText} <ArrowRightIcon className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            )}

            {activeTab === 'email' && (
              <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                <section className="space-y-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Configurações de E-mail (SMTP)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <InputField label="Servidor SMTP" name="smtpHost" value={formData.email.smtpHost} section="email" placeholder="smtp.exemplo.com" onChange={handleInputChange} />
                    </div>
                    <div>
                        <InputField label="Porta" name="smtpPort" value={formData.email.smtpPort} section="email" placeholder="587" onChange={handleInputChange} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Usuário SMTP" name="smtpUser" value={formData.email.smtpUser} section="email" placeholder="seu-email@dominio.com" onChange={handleInputChange} />
                    <InputField label="Senha SMTP" name="smtpPass" value={formData.email.smtpPass} section="email" type="password" placeholder="••••••••" onChange={handleInputChange} />
                  </div>
                </section>

                <section className="space-y-6 pt-6 border-t border-gray-700">
                  <h3 className="text-xl font-semibold text-white mb-4">Templates de Notificação</h3>
                  <TextAreaField label="Corpo do E-mail de Confirmação de Pedido" name="purchaseConfirmationBody" value={formData.email.purchaseConfirmationBody} section="email" rows={8} onChange={handleInputChange} />
                </section>

                <div className="border-t border-gray-700 pt-6 flex justify-end">
                    <button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
              </form>
            )}

            {activeTab === 'info' && (
              <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                <section className="space-y-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Páginas Institucionais</h3>
                  <p className="text-sm text-gray-400 -mt-4">Esses textos serão exibidos nas páginas correspondentes da sua loja online.</p>
                  
                  <TextAreaField label="Sobre a Loja" name="about" value={formData.infoPages.about} section="infoPages" placeholder="Conte a história da sua marca, missão e valores..." rows={8} onChange={handleInputChange} />
                  
                  <TextAreaField label="Como Comprar" name="howToBuy" value={formData.infoPages.howToBuy} section="infoPages" placeholder="Explique o passo a passo para o cliente realizar uma compra..." rows={6} onChange={handleInputChange} />
                  
                  <TextAreaField label="Trocas e Devoluções" name="returns" value={formData.infoPages.returns} section="infoPages" placeholder="Defina as regras para trocas e devoluções de produtos..." rows={6} onChange={handleInputChange} />
                </section>

                <div className="border-t border-gray-700 pt-6 flex justify-end">
                    <button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
              </form>
            )}

            {activeTab === 'seo' && (
              <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                <section className="space-y-6">
                  <h3 className="text-xl font-semibold text-white mb-6">SEO e Indexação</h3>
                  <p className="text-sm text-gray-400 -mt-4">Configure as ferramentas de marketing e rastreamento para sua loja.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <InputField label="ID do Google Analytics" name="googleAnalyticsId" value={formData.seo.googleAnalyticsId} section="seo" placeholder="UA-XXXXXXX-X ou G-XXXXXXXX" onChange={handleInputChange} />
                     <InputField label="ID do Google Merchant Center" name="googleMerchantCenterId" value={formData.seo.googleMerchantCenterId} section="seo" placeholder="123456789" onChange={handleInputChange} />
                     <InputField label="ID do Google Meu Negócio" name="googleMyBusinessId" value={formData.seo.googleMyBusinessId} section="seo" placeholder="XXXXXX" onChange={handleInputChange} />
                  </div>
                </section>

                <section className="space-y-6 pt-6 border-t border-gray-700">
                  <h3 className="text-xl font-semibold text-white mb-4">Feeds de Produtos (XML)</h3>
                  <div className="space-y-4">
                      <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600 flex items-center justify-between">
                          <div>
                              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Feed para Google Shopping</p>
                              <code className="text-sm text-primary break-all">{formData.seo.googleXmlUrl || `${formData.domain}/feed/google.xml`}</code>
                          </div>
                          <button type="button" onClick={() => copyToClipboard(formData.seo.googleXmlUrl || `${formData.domain}/feed/google.xml`)} className="p-2 hover:bg-gray-600 rounded-lg text-gray-300">
                              <CodeBracketIcon className="w-5 h-5"/>
                          </button>
                      </div>

                      <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600 flex items-center justify-between">
                          <div>
                              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Feed para Facebook/Instagram</p>
                              <code className="text-sm text-primary break-all">{formData.seo.facebookXmlUrl || `${formData.domain}/feed/facebook.xml`}</code>
                          </div>
                          <button type="button" onClick={() => copyToClipboard(formData.seo.facebookXmlUrl || `${formData.domain}/feed/facebook.xml`)} className="p-2 hover:bg-gray-600 rounded-lg text-gray-300">
                              <CodeBracketIcon className="w-5 h-5"/>
                          </button>
                      </div>
                  </div>
                </section>

                <section className="space-y-6 pt-6 border-t border-gray-700">
                  <h3 className="text-xl font-semibold text-white mb-4">Scripts Customizados</h3>
                  <TextAreaField label="Scripts no <head>" name="customHeadScript" value={formData.seo.customHeadScript} section="seo" placeholder="Cole aqui seus scripts do Pixel do Facebook, Google Tag Manager, etc." rows={6} onChange={handleInputChange} />
                </section>

                <div className="border-t border-gray-700 pt-6 flex justify-end">
                    <button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
              </form>
            )}

            {activeTab === 'conectividade' && (
                <section className="animate-fade-in">
                    <div className="flex space-x-1 bg-gray-700 p-1 rounded-lg mb-6 w-fit">
                         {['conexao', 'treinamento', 'catalogo'].map(t => (
                             <button key={t} type="button" onClick={() => setConnectivityTab(t as any)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${connectivityTab === t ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                                 {t.charAt(0).toUpperCase() + t.slice(1)}
                             </button>
                         ))}
                    </div>

                    {connectivityTab === 'conexao' && (
                        <div className="space-y-6">
                             <InputField label="Telefone Whatsapp" name="whatsappPhone" value={formData.connectivity.whatsappPhone} section="connectivity" placeholder="Ex: 5511999999999" onChange={handleInputChange} />
                             
                             <div className="flex items-center justify-between bg-gray-700 p-4 rounded-lg border border-gray-600">
                                <span className="font-medium">Status da Instância</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(connectionStatus)}`}>
                                    {connectionStatus}
                                </span>
                             </div>

                             {qrCode && connectionStatus === 'Conectando' && (
                                <div className="bg-white p-8 rounded-2xl flex flex-col items-center gap-6 animate-fade-in mx-auto w-full max-w-sm shadow-2xl border border-gray-200">
                                    <div className="text-center">
                                      <h4 className="text-gray-900 font-black text-xl">Escaneie o QR Code</h4>
                                      <p className="text-gray-500 text-sm mt-1">Aguardando leitura da instância...</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border-4 border-primary/10 shadow-inner">
                                        <img src={qrCode} alt="WhatsApp QR Code" className="w-56 h-56" />
                                    </div>
                                    <div className="space-y-2 text-center">
                                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Como conectar?</p>
                                      <p className="text-xs text-gray-600 leading-relaxed">
                                        1. Abra o WhatsApp no seu celular<br/>
                                        2. Toque em <b>Menu</b> ou <b>Configurações</b><br/>
                                        3. Selecione <b>Aparelhos Conectados</b><br/>
                                        4. Aponte a câmera para esta tela
                                      </p>
                                    </div>
                                    <button onClick={() => { setQrCode(null); if(pollingRef.current) clearInterval(pollingRef.current); }} className="text-primary text-xs font-bold hover:underline">Cancelar pareamento</button>
                                </div>
                             )}

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {connectionStatus === 'Conectado' ? (
                                    <>
                                        <button 
                                            type="button" 
                                            onClick={handleDisconnectWhatsApp} 
                                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <TrashIcon className="w-5 h-5"/> Desconectar
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={handleReconnectWhatsApp} 
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <ArrowRightIcon className="w-5 h-5 rotate-180"/> Reconectar
                                        </button>
                                    </>
                                ) : (
                                  !qrCode && (
                                    <button 
                                        type="button" 
                                        onClick={handleConnectWhatsApp} 
                                        disabled={isConnecting}
                                        className="w-full col-span-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95 disabled:bg-gray-600 flex items-center justify-center gap-2"
                                    >
                                        {isConnecting ? (
                                          <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Iniciando conexão...
                                          </>
                                        ) : (
                                          <>
                                            <ChatIcon className="w-5 h-5"/> Conectar WhatsApp
                                          </>
                                        )}
                                    </button>
                                  )
                                )}
                             </div>

                             <div className="border-t border-gray-700 pt-6 flex justify-end">
                                <button onClick={handleSubmit} disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                                    {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                                </button>
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

            {activeTab === 'redes' && (
              <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                <section className="space-y-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Redes Sociais</h3>
                  <p className="text-sm text-gray-400 -mt-4">Insira o link completo dos perfis da sua loja.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Instagram" name="instagram" value={formData.socialMedia.instagram} section="socialMedia" placeholder="https://instagram.com/sualoja" onChange={handleInputChange} />
                    <InputField label="Facebook" name="facebook" value={formData.socialMedia.facebook} section="socialMedia" placeholder="https://facebook.com/sualoja" onChange={handleInputChange} />
                    <InputField label="TikTok" name="tiktok" value={formData.socialMedia.tiktok} section="socialMedia" placeholder="https://tiktok.com/@sualoja" onChange={handleInputChange} />
                    <InputField label="YouTube" name="youtube" value={formData.socialMedia.youtube} section="socialMedia" placeholder="https://youtube.com/c/sualoja" onChange={handleInputChange} />
                  </div>
                </section>
                <div className="border-t border-gray-700 pt-6 flex justify-end">
                    <button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
              </form>
            )}

            {activeTab === 'pagamento' && (
              <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                <section className="space-y-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Integração Mercado Pago</h3>
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-4">
                    <div className="p-2 bg-blue-500 rounded-lg h-fit"><CreditCardIcon className="w-6 h-6 text-white"/></div>
                    <div className="text-sm">
                      <h4 className="font-bold text-blue-400">Credenciais</h4>
                      <p className="text-gray-400 mt-1">Acesse o <a href="https://developers.mercadopago.com/panel" target="_blank" className="text-blue-400 hover:underline">Painel do Desenvolvedor</a> para obter suas chaves.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <InputField label="Public Key" name="mercadoPagoPublicKey" value={formData.integrations.mercadoPagoPublicKey} section="integrations" placeholder="APP_USR-..." onChange={handleInputChange} />
                    <InputField label="Access Token" name="mercadoPagoToken" value={formData.integrations.mercadoPagoToken} section="integrations" type="password" placeholder="APP_USR-..." onChange={handleInputChange} />
                  </div>
                </section>

                <section className="space-y-6 pt-6 border-t border-gray-700">
                  <h3 className="text-xl font-semibold text-white mb-4">Configuração de Parcelamento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Parcelas Sem Juros</label>
                        <select 
                          name="mercadoPagoInstallmentsWithoutInterest" 
                          data-section="integrations" 
                          value={formData.integrations.mercadoPagoInstallmentsWithoutInterest} 
                          onChange={handleInputChange}
                          className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary text-white"
                        >
                          <option value={1}>À vista</option>
                          {[2,3,4,5,6,10,12].map(num => (
                            <option key={num} value={num}>Até {num}x sem juros</option>
                          ))}
                        </select>
                    </div>
                    <InputField label="Juros (3x a 6x) %" name="mercadoPagoInterestRate3to6" value={formData.integrations.mercadoPagoInterestRate3to6} section="integrations" type="number" onChange={handleInputChange} />
                    <InputField label="Juros (6x a 12x) %" name="mercadoPagoInterestRate6to12" value={formData.integrations.mercadoPagoInterestRate6to12} section="integrations" type="number" onChange={handleInputChange} />
                  </div>
                  <p className="text-xs text-gray-500 italic">Nota: A configuração "Sem Juros" define até qual parcela a taxa será 0%. Acima disso, serão aplicadas as taxas definidas.</p>
                </section>

                <div className="border-t border-gray-700 pt-6 flex justify-end">
                    <button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
              </form>
            )}

            {activeTab === 'frete' && (
              <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                <section className="space-y-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Configuração de Frete</h3>
                  
                  <div className="space-y-6">
                    <InputField label="Token Melhor Envio" name="melhorEnvioToken" value={formData.shipping.melhorEnvioToken} section="shipping" type="password" placeholder="Cole seu token do Melhor Envio aqui..." onChange={handleInputChange} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Dias Adicionais de Manuseio" name="additionalDays" value={formData.shipping.additionalDays} section="shipping" type="number" onChange={handleInputChange} />
                        <InputField label="Custo Adicional Fixo (R$)" name="additionalCost" value={formData.shipping.additionalCost} section="shipping" type="number" onChange={handleInputChange} />
                    </div>
                  </div>
                </section>

                <section className="space-y-6 pt-6 border-t border-gray-700">
                  <h3 className="text-xl font-semibold text-white mb-4">Política de Frete Grátis</h3>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                        <input 
                            type="checkbox" 
                            id="shippingEnabled" 
                            name="freeShippingPolicy.enabled" 
                            data-section="shipping"
                            checked={formData.shipping.freeShippingPolicy.enabled} 
                            onChange={handleInputChange}
                            className="w-5 h-5 rounded border-gray-600 text-primary focus:ring-primary"
                        />
                        <label htmlFor="shippingEnabled" className="text-sm font-medium text-gray-200">Habilitar Frete Grátis</label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Valor Mínimo (R$)" name="freeShippingPolicy.minValue" value={formData.shipping.freeShippingPolicy.minValue} section="shipping" type="number" onChange={handleInputChange} />
                        <InputField label="Cidades Exclusivas (Opcional)" name="freeShippingPolicy.cities" value={formData.shipping.freeShippingPolicy.cities} section="shipping" placeholder="Ex: São Paulo, Rio de Janeiro" onChange={handleInputChange} />
                    </div>
                  </div>
                </section>

                <div className="border-t border-gray-700 pt-6 flex justify-end">
                    <button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
              </form>
            )}

            {activeTab === 'api' && (
              <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                <section className="space-y-6">
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <CpuChipIcon className="text-primary"/> Assistente de IA (Gemini)
                  </h3>
                  <p className="text-sm text-gray-400 -mt-4">Configure o cérebro da sua loja para gerar descrições e atender clientes.</p>

                  <div className="space-y-6">
                    <InputField label="Nome do Assistente" name="assistantName" value={formData.ai.assistantName} section="ai" placeholder="Ex: VestiBot" onChange={handleInputChange} />
                    <TextAreaField label="Texto de Treinamento / Contexto" name="trainingText" value={formData.ai.trainingText} section="ai" placeholder="Explique sobre sua marca, horários, políticas..." rows={6} onChange={handleInputChange} />
                    <TextAreaField label="Restrições" name="restrictions" value={formData.ai.restrictions} section="ai" placeholder="O que o robô NÃO deve falar..." rows={3} onChange={handleInputChange} />
                  </div>
                </section>

                <div className="border-t border-gray-700 pt-6 flex justify-end">
                    <button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50">
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
              </form>
            )}
          </div>
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

      <BannerModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        onSave={handleSaveBanner}
        banner={editingBanner}
        showToast={showToast}
      />
    </div>
  );
};

export default Settings;
