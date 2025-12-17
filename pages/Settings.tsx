
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { StoreSettings, Banner, Toast, WhatsAppProduct } from '../types';
import { StorefrontIcon, PaletteIcon, InfoIcon, LinkIcon, ShareIcon, CreditCardIcon, TruckIcon, PhotographIcon, PencilIcon, TrashIcon, MailIcon, GlobeAltIcon, CodeBracketIcon, ChatIcon } from '../components/icons/Icons';
import * as whatsappService from '../services/whatsappService';
import BannerModal from '../components/BannerModal';
import ImageCropperModal from '../components/ImageCropperModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { db } from '../services/apiService';

interface SettingsProps {
  settings: StoreSettings;
  updateSettings: (settings: StoreSettings) => void;
  addBanner: (banner: Omit<Banner, 'id'>) => void;
  updateBanner: (banner: Banner) => void;
  deleteBanner: (bannerId: string) => void;
  showToast: (message: string, type: Toast['type']) => void;
}

const GOOGLE_FONTS = [
    { name: 'Inter', family: 'Inter, sans-serif' },
    { name: 'Roboto', family: 'Roboto, sans-serif' },
    { name: 'Open Sans', family: '"Open Sans", sans-serif' },
    { name: 'Montserrat', family: 'Montserrat, sans-serif' },
    { name: 'Lato', family: 'Lato, sans-serif' },
    { name: 'Playfair Display', family: '"Playfair Display", serif' },
    { name: 'Merriweather', family: 'Merriweather, serif' },
    { name: 'Oswald', family: 'Oswald, sans-serif' },
    { name: 'Raleway', family: 'Raleway, sans-serif' },
    { name: 'Poppins', family: 'Poppins, sans-serif' }
];

const InputField: React.FC<{label: string, name: string, value: string | number, section: string, placeholder?: string, type?: string, disabled?: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void}> = ({label, name, value, section, placeholder = '', type = 'text', disabled = false, onChange}) => (
  <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <input id={name} type={type} name={name} data-section={section} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-600 disabled:cursor-not-allowed" />
  </div>
);

const ColorPickerField: React.FC<{label: string, name: string, value: string, section: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({ label, name, value, section, onChange }) => (
  <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="flex items-center gap-2">
          <input id={name} type="color" name={name} data-section={section} value={value || '#000000'} onChange={onChange} className="p-1 h-10 w-14 block bg-gray-700 border border-gray-600 cursor-pointer rounded-lg" />
          <input type="text" name={name} data-section={section} value={value || ''} onChange={onChange} className="bg-gray-700 text-white p-2 h-10 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm uppercase" />
      </div>
  </div>
);

const TextAreaField: React.FC<{label: string, name: string, value: string, section: string, rows?: number, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void}> = ({label, name, value, section, rows = 4, onChange}) => (
   <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <textarea id={name} name={name} data-section={section} value={value} onChange={onChange} rows={rows} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" />
  </div>
);

const Settings: React.FC<SettingsProps> = ({ settings, updateSettings, addBanner, updateBanner, deleteBanner, showToast }) => {
  const [activeTab, setActiveTab] = useState('loja');
  const [connectivityTab, setConnectivityTab] = useState<'conexao' | 'treinamento' | 'catalogo'>('conexao');
  const [formData, setFormData] = useState<StoreSettings>({ ...settings, banners: settings.banners || [] });
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<StoreSettings['connectivity']['whatsappStatus']>(settings.connectivity.whatsappStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [whatsappCatalog, setWhatsappCatalog] = useState<WhatsAppProduct[]>([]);
  const [isFetchingCatalog, setIsFetchingCatalog] = useState(false);
  
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [tempLogoImg, setTempLogoImg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // O nome da instância é o telefone configurado
  const instanceName = formData.connectivity.whatsappPhone || "default_store";

  useEffect(() => {
      const loadSettings = async () => {
          try {
              const [fetchedSettings, fetchedBanners] = await Promise.all([
                  db.getSettings(),
                  db.getAll<Banner>('banners')
              ]);
              if (fetchedSettings) {
                  setFormData(prev => ({
                      ...prev,
                      ...fetchedSettings,
                      branding: { ...prev.branding, ...fetchedSettings.branding },
                      address: { ...prev.address, ...fetchedSettings.address },
                      connectivity: { ...prev.connectivity, ...fetchedSettings.connectivity },
                      banners: fetchedBanners
                  }));
                  setConnectionStatus(fetchedSettings.connectivity?.whatsappStatus || 'Desconectado');
              }
          } catch (e) {
              console.error("Error fetching settings:", e);
          }
      };
      loadSettings();
  }, []);

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
  }, [connectionStatus, formData.connectivity.whatsappPhone, showToast, instanceName]);

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
      setFormData(prev => ({ ...prev, [section]: { ...(prev[section] as object), [name]: processedValue } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    showToast('Configurações salvas!', 'success');
  };
  
  const handleConnect = async () => {
    if (!formData.connectivity.whatsappPhone) {
        showToast("Configure o telefone do WhatsApp primeiro.", "error");
        return;
    }
    updateSettings(formData);
    setIsLoading(true);
    setConnectionStatus('Conectando');
    setQrCode(null);
    try {
        let instances = await whatsappService.listInstances();
        let instance = instances.find(inst => inst.name === instanceName);
        if (!instance) await whatsappService.createInstance(instanceName);
        await whatsappService.connectInstance(instanceName);
        const qrInterval = setInterval(async () => {
            const data = await whatsappService.getQrCode(instanceName);
            const statusData = await whatsappService.listInstances();
            const currentInstance = statusData.find(i => i.name === instanceName);
            if (currentInstance?.connected) {
                 clearInterval(qrInterval);
                 setQrCode(null);
                 setIsLoading(false);
                 setConnectionStatus('Conectado');
                 updateSettings({ ...formData, connectivity: { ...formData.connectivity, whatsappStatus: 'Conectado' } });
                 return;
            }
            if (data.qrCode) {
                setQrCode(data.qrCode);
                setIsLoading(false);
            }
        }, 3000);
        setTimeout(() => clearInterval(qrInterval), 60000);
    } catch (error) {
        showToast("Falha ao conectar WhatsApp.", 'error');
        setIsLoading(false);
        setConnectionStatus('Desconectado');
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
        await whatsappService.disconnectInstance(instanceName);
        setConnectionStatus('Desconectado');
        updateSettings({ ...formData, connectivity: { ...formData.connectivity, whatsappStatus: 'Desconectado' } });
        setQrCode(null);
    } catch (error) {
        showToast("Falha ao desconectar.", 'error');
    } finally {
        setIsLoading(false);
    }
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
                    <InputField label="Rua" name="street" value={formData.address.street} section="address" onChange={handleInputChange} />
                    <InputField label="Número" name="number" value={formData.address.number} section="address" onChange={handleInputChange} />
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
                             <InputField label="Telefone Whatsapp (Nome da Instância)" name="whatsappPhone" value={formData.connectivity.whatsappPhone} section="connectivity" placeholder="Ex: 5511999999999" onChange={handleInputChange} />
                             <div className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
                                <span className="font-medium">Status</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${connectionStatus === 'Conectado' ? 'bg-green-500/20 text-green-400' : connectionStatus === 'Conectando' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {connectionStatus}
                                </span>
                             </div>
                             <div className="text-center p-4 bg-gray-700 rounded-lg">
                                {isLoading && <p className="text-yellow-400">Processando...</p>}
                                {qrCode && connectionStatus !== 'Conectado' && (
                                    <div className="flex flex-col items-center">
                                        <img src={qrCode} alt="QR Code" className="w-64 h-64 rounded-lg bg-white p-2"/>
                                        <p className="text-sm text-gray-400 mt-2">Escaneie para conectar.</p>
                                    </div>
                                )}
                                {connectionStatus === 'Desconectado' && !isLoading && !qrCode && (
                                    <button type="button" onClick={handleConnect} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg">Conectar</button>
                                )}
                                {connectionStatus === 'Conectado' && !isLoading && (
                                    <button type="button" onClick={handleDisconnect} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg">Desconectar</button>
                                )}
                             </div>
                        </div>
                    )}

                    {connectivityTab === 'catalogo' && (
                         <div className="animate-fade-in">
                             <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-semibold text-white">Catálogo do WhatsApp</h3>
                                    <p className="text-gray-400 text-sm">Produtos sincronizados no WhatsApp Business.</p>
                                </div>
                                {connectionStatus === 'Conectado' && (
                                    <button type="button" onClick={loadCatalog} disabled={isFetchingCatalog} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                        <svg className={`w-4 h-4 ${isFetchingCatalog ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 11v-5h-5m-1 1l-15-15"/></svg>
                                        Atualizar
                                    </button>
                                )}
                             </div>
                             
                             {connectionStatus !== 'Conectado' ? (
                                 <div className="text-center p-12 bg-gray-700 rounded-lg border border-gray-600 border-dashed">
                                     <ChatIcon className="w-12 h-12 mx-auto text-gray-500 mb-4"/>
                                     <p className="text-gray-400">Conecte-se ao WhatsApp para visualizar o catálogo.</p>
                                 </div>
                             ) : isFetchingCatalog ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[1,2,3,4].map(i => <div key={i} className="bg-gray-700 h-56 rounded-lg animate-pulse"></div>)}
                                </div>
                             ) : whatsappCatalog.length === 0 ? (
                                 <div className="text-center p-12 bg-gray-700 rounded-lg">
                                     <p className="text-gray-400">Nenhum produto encontrado no catálogo.</p>
                                 </div>
                             ) : (
                                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                     {whatsappCatalog.map(item => (
                                         <div key={item.id} className="bg-gray-700 rounded-lg overflow-hidden border border-gray-600 hover:border-primary transition-all flex flex-col group">
                                             <div className="relative aspect-square overflow-hidden bg-gray-600">
                                                 <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110"/>
                                                 {item.sku && (
                                                     <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                                                         SKU: {item.sku}
                                                     </span>
                                                 )}
                                             </div>
                                             <div className="p-3 flex-1 flex flex-col">
                                                 <h4 className="font-semibold text-white truncate text-sm" title={item.name}>{item.name}</h4>
                                                 <p className="text-primary font-bold mt-1">R$ {Number(item.price).toFixed(2)}</p>
                                                 {item.description && (
                                                     <p className="text-gray-400 text-xs mt-2 line-clamp-2 italic">
                                                         {item.description}
                                                     </p>
                                                 )}
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </div>
                    )}
                </section>
            )}

            {activeTab !== 'banners' && activeTab !== 'api' && activeTab !== 'conectividade' && (
                <div className="border-t border-gray-700 pt-6 flex justify-end">
                  <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg">Salvar Alterações</button>
                </div>
            )}
          </form>
        </main>
      </div>
    </div>
  );
};

export default Settings;
