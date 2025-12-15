
import React, { useState, useEffect, useCallback, useRef } from 'react';
// FIX: Added Toast to the import.
import type { StoreSettings, Banner, Toast, WhatsAppProduct } from '../types';
import { StorefrontIcon, PaletteIcon, InfoIcon, LinkIcon, ShareIcon, CreditCardIcon, TruckIcon, PhotographIcon, PencilIcon, TrashIcon, MailIcon, GlobeAltIcon, CodeBracketIcon } from '../components/icons/Icons';
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
  // FIX: Added showToast to the props interface for displaying notifications.
  showToast: (message: string, type: Toast['type']) => void;
}

const INSTANCE_NAME = "E-connect";

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

// Components extracted to prevent re-renders losing focus
interface InputFieldProps {
  label: string;
  name: string;
  value: string | number;
  section: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({label, name, value, section, placeholder = '', type = 'text', disabled = false, onChange}) => (
  <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <input id={name} type={type} name={name} data-section={section} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-600 disabled:cursor-not-allowed" />
  </div>
);

interface ColorPickerFieldProps {
  label: string;
  name: string;
  value: string;
  section: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ColorPickerField: React.FC<ColorPickerFieldProps> = ({ label, name, value, section, onChange }) => (
  <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="flex items-center gap-2">
          <input 
              id={name} 
              type="color" 
              name={name} 
              data-section={section} 
              value={value || '#000000'}
              onChange={onChange} 
              className="p-1 h-10 w-14 block bg-gray-700 border border-gray-600 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none" 
          />
          <input 
              type="text" 
              name={name} 
              data-section={section} 
              value={value || ''} 
              onChange={onChange}
              className="bg-gray-700 text-white p-2 h-10 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm uppercase"
              pattern="^#+([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$"
          />
      </div>
  </div>
);

interface TextAreaFieldProps {
  label: string;
  name: string;
  value: string;
  section: string;
  rows?: number;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({label, name, value, section, rows = 4, onChange}) => (
   <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <textarea id={name} name={name} data-section={section} value={value} onChange={onChange} rows={rows} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" />
  </div>
);

// Helper for displaying code snippets in API tab
const CodeBlock = ({ code, language = 'json' }: { code: string; language?: string }) => (
  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto border border-gray-700 my-2">
    <pre className="text-sm font-mono text-gray-300">
      <code className={`language-${language}`}>{code}</code>
    </pre>
  </div>
);

const Settings: React.FC<SettingsProps> = ({ settings, updateSettings, addBanner, updateBanner, deleteBanner, showToast }) => {
  const [activeTab, setActiveTab] = useState('loja');
  const [connectivityTab, setConnectivityTab] = useState<'conexao' | 'treinamento' | 'catalogo'>('conexao');
  // Safe initialization of banners array
  const [formData, setFormData] = useState<StoreSettings>({
      ...settings,
      banners: settings.banners || []
  });
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<StoreSettings['connectivity']['whatsappStatus']>(settings.connectivity.whatsappStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [whatsappCatalog, setWhatsappCatalog] = useState<WhatsAppProduct[]>([]);
  
  // Crop Modal State
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [tempLogoImg, setTempLogoImg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Banner Confirmation State
  const [deleteBannerConfig, setDeleteBannerConfig] = useState<{isOpen: boolean, banner: Banner | null}>({isOpen: false, banner: null});

  // Fetch settings on mount to ensure fields are populated with fresh data
  useEffect(() => {
      const loadSettings = async () => {
          try {
              // Parallel fetch for settings (config) and banners (separate table)
              const [fetchedSettings, fetchedBanners] = await Promise.all([
                  db.getSettings(),
                  db.getAll<Banner>('banners')
              ]);

              if (fetchedSettings) {
                  console.log("Settings fetched from API:", fetchedSettings);
                  setFormData(prev => ({
                      ...prev,
                      ...fetchedSettings,
                      // Ensure merging respects existing nested structures if fetch returns partials
                      branding: { ...prev.branding, ...fetchedSettings.branding },
                      address: { ...prev.address, ...fetchedSettings.address },
                      connectivity: { ...prev.connectivity, ...fetchedSettings.connectivity },
                      socialMedia: { ...prev.socialMedia, ...fetchedSettings.socialMedia },
                      integrations: { ...prev.integrations, ...fetchedSettings.integrations },
                      shipping: { ...prev.shipping, ...fetchedSettings.shipping },
                      ai: { ...prev.ai, ...fetchedSettings.ai },
                      seo: { ...prev.seo, ...fetchedSettings.seo },
                      // Prefer fetched banners from table
                      banners: fetchedBanners
                  }));
                  setConnectionStatus(fetchedSettings.connectivity?.whatsappStatus || 'Desconectado');
              }
          } catch (e) {
              console.error("Error fetching settings on mount:", e);
          }
      };
      loadSettings();
  }, []);

  // Sync with props only when they change significantly or for specific updates
  useEffect(() => {
    if(settings) {
        setFormData(prev => ({
            ...prev,
            ...settings,
            // Always update banners from props to ensure deletions/additions are reflected
            banners: settings.banners || [],
            branding: { ...prev.branding, ...settings.branding },
            address: { ...prev.address, ...settings.address },
            connectivity: { ...prev.connectivity, ...settings.connectivity },
            // ... map other fields if necessary for strict sync
        }));
        setConnectionStatus(settings.connectivity.whatsappStatus);
    }
  }, [settings]);
  
  const checkStatus = useCallback(async () => {
      try {
        const instances = await whatsappService.listInstances();
        const instance = instances.find(inst => inst.name === INSTANCE_NAME);
        const newStatus = instance?.connected ? 'Conectado' : 'Desconectado';
        if (newStatus !== connectionStatus) {
            setConnectionStatus(newStatus);
            updateSettings({ ...formData, connectivity: { ...formData.connectivity, whatsappStatus: newStatus } });
        }
      } catch (error) {
          console.error("Erro ao verificar status:", error);
      }
  }, [connectionStatus, formData, updateSettings]);

  useEffect(() => {
    const interval = setInterval(() => {
        if(connectionStatus !== 'Conectando') {
            checkStatus();
        }
    }, 10000); // Check status every 10 seconds
    return () => clearInterval(interval);
  }, [checkStatus, connectionStatus]);
  
  useEffect(() => {
      if (activeTab === 'conectividade' && connectionStatus === 'Conectado') {
          whatsappService.getCatalog(INSTANCE_NAME).then(setWhatsappCatalog);
      } else {
          setWhatsappCatalog([]);
      }
  }, [activeTab, connectionStatus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, dataset, type } = e.target;
    const section = dataset.section as keyof StoreSettings | undefined;

    let processedValue: string | number = value;
    if (type === 'number') {
        processedValue = value === '' ? 0 : Number(value);
    }
    
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...(prev[section] as object),
          [name]: processedValue,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  const handleShippingPolicyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
     const { name, value, type } = e.target;
     
     let processedValue: string | number | boolean = value;
     if (name === 'enabled') {
        processedValue = value === 'true';
     } else if (type === 'number') {
        processedValue = value === '' ? 0 : Number(value);
     }
     
     setFormData(prev => ({
        ...prev,
        shipping: {
            ...prev.shipping,
            freeShippingPolicy: {
                ...prev.shipping.freeShippingPolicy,
                [name]: processedValue,
            }
        }
     }));
  };
  
  // Logo Upload Handlers
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setTempLogoImg(event.target.result as string);
                  setIsCropModalOpen(true);
              }
          };
          reader.readAsDataURL(file);
      }
      // Reset input value to allow re-selecting the same file if needed
      if(fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleCropComplete = (croppedImage: string) => {
      setFormData(prev => ({
          ...prev,
          branding: {
              ...prev.branding,
              logoUrl: croppedImage
          }
      }));
      setTempLogoImg(null);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    // FIX: Replaced alert with showToast. Note: updateSettings from useMockData also shows a toast. This provides immediate feedback.
    showToast('Configurações salvas com sucesso!', 'success');
  };
  
  const handleConnect = async () => {
    // Explicitly save settings first to ensure phone number is persisted
    // This addresses the user requirement to register phone data before connecting
    updateSettings(formData);

    setIsLoading(true);
    setConnectionStatus('Conectando');
    setQrCode(null);
    try {
        // Ensure instance exists
        let instances = await whatsappService.listInstances();
        let instance = instances.find(inst => inst.name === INSTANCE_NAME);
        if (!instance) {
            await whatsappService.createInstance(INSTANCE_NAME);
        }

        await whatsappService.connectInstance(INSTANCE_NAME);

        // Poll for QR code
        const qrInterval = setInterval(async () => {
            const data = await whatsappService.getQrCode(INSTANCE_NAME);
            const statusData = await whatsappService.listInstances();
            const currentInstance = statusData.find(i => i.name === INSTANCE_NAME);

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

        // Stop polling after some time
        setTimeout(() => {
            clearInterval(qrInterval);
            if(connectionStatus !== 'Conectado'){
                setIsLoading(false);
                setConnectionStatus('Desconectado');
            }
        }, 60000); // 1 minute timeout

    } catch (error) {
        console.error("Erro ao conectar:", error);
        // FIX: Replaced alert with showToast for consistent error feedback.
        showToast("Falha ao iniciar a conexão. Verifique o console.", 'error');
        setIsLoading(false);
        setConnectionStatus('Desconectado');
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
        await whatsappService.disconnectInstance(INSTANCE_NAME);
        setConnectionStatus('Desconectado');
        updateSettings({ ...formData, connectivity: { ...formData.connectivity, whatsappStatus: 'Desconectado' } });
        setQrCode(null);
    } catch (error) {
        console.error("Erro ao desconectar:", error);
        // FIX: Replaced alert with showToast for consistent error feedback.
        showToast("Falha ao desconectar. Verifique o console.", 'error');
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleOpenBannerModal = (banner: Banner | null = null) => {
    setEditingBanner(banner);
    setIsBannerModalOpen(true);
  };

  const handleCloseBannerModal = () => {
    setEditingBanner(null);
    setIsBannerModalOpen(false);
  };
  
  const handleSaveBanner = (bannerData: Banner | Omit<Banner, 'id'>) => {
    if ('id' in bannerData) {
      updateBanner(bannerData as Banner);
    } else {
      addBanner(bannerData);
    }
  };

  const handleDeleteBanner = (banner: Banner) => {
    setDeleteBannerConfig({ isOpen: true, banner });
  };

  const confirmDeleteBanner = () => {
    if (deleteBannerConfig.banner) {
        deleteBanner(deleteBannerConfig.banner.id);
        setDeleteBannerConfig({ isOpen: false, banner: null });
    }
  };
  
  const handleGenerateXml = (type: 'google' | 'facebook') => {
    const url = `/feeds/${type}_products.xml?t=${new Date().getTime()}`;
    const field = type === 'google' ? 'googleXmlUrl' : 'facebookXmlUrl';
    setFormData(prev => ({
        ...prev,
        seo: {
            ...prev.seo,
            [field]: url,
        }
    }));
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
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=${formData.branding.headingFont?.replace(' ', '+')}&family=${formData.branding.bodyFont?.replace(' ', '+')}&display=swap');
        `}</style>
      <h2 className="text-2xl font-bold text-white mb-6">Configurações da Loja</h2>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Tab Navigation */}
        <aside className="lg:w-1/4">
          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center w-full px-4 py-3 rounded-lg text-left transition-colors duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-3 shrink-0" />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Form Content */}
        <main className="flex-1">
          <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-lg space-y-8">
            {activeTab === 'loja' && (
              <section>
                <h3 className="text-xl font-semibold text-white mb-6">Dados da Loja</h3>
                <div className="space-y-6">
                  <InputField label="Nome da Loja" name="storeName" value={formData.storeName} section="" onChange={handleInputChange} />
                  <InputField label="Domínio" name="domain" value={formData.domain || ''} section="" placeholder="www.sualoja.com.br" onChange={handleInputChange} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Rua" name="street" value={formData.address.street} section="address" onChange={handleInputChange} />
                    <InputField label="Número" name="number" value={formData.address.number} section="address" onChange={handleInputChange} />
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Complemento" name="complement" value={formData.address.complement} section="address" onChange={handleInputChange} />
                    <InputField label="Bairro" name="neighborhood" value={formData.address.neighborhood} section="address" onChange={handleInputChange} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField label="Cidade" name="city" value={formData.address.city} section="address" onChange={handleInputChange} />
                    <InputField label="Estado" name="state" value={formData.address.state} section="address" onChange={handleInputChange} />
                    <InputField label="CEP" name="zipCode" value={formData.address.zipCode} section="address" onChange={handleInputChange} />
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'cores' && (
               <section>
                <h3 className="text-xl font-semibold text-white mb-6">Cores e Logo</h3>
                <div className="space-y-8">
                   
                   <div>
                       <h4 className="text-lg font-medium text-white mb-4 border-b border-gray-700 pb-2">Identidade Principal</h4>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ColorPickerField label="Cor Primária" name="primaryColor" value={formData.branding.primaryColor} section="branding" onChange={handleInputChange} />
                            <ColorPickerField label="Cor Secundária" name="secondaryColor" value={formData.branding.secondaryColor} section="branding" onChange={handleInputChange} />
                            <ColorPickerField label="Cor de Destaque" name="accentColor" value={formData.branding.accentColor} section="branding" onChange={handleInputChange} />
                       </div>
                   </div>

                   <div>
                       <h4 className="text-lg font-medium text-white mb-4 border-b border-gray-700 pb-2">Estrutura Geral</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ColorPickerField label="Fundo do Site" name="backgroundColor" value={formData.branding.backgroundColor} section="branding" onChange={handleInputChange} />
                            <ColorPickerField label="Texto Principal" name="textColor" value={formData.branding.textColor} section="branding" onChange={handleInputChange} />
                       </div>
                   </div>

                   <div>
                       <h4 className="text-lg font-medium text-white mb-4 border-b border-gray-700 pb-2">Cabeçalho e Navegação</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ColorPickerField label="Fundo do Cabeçalho" name="headerBackgroundColor" value={formData.branding.headerBackgroundColor} section="branding" onChange={handleInputChange} />
                            <ColorPickerField label="Texto/Ícones do Cabeçalho" name="headerTextColor" value={formData.branding.headerTextColor} section="branding" onChange={handleInputChange} />
                       </div>
                   </div>

                   <div>
                       <h4 className="text-lg font-medium text-white mb-4 border-b border-gray-700 pb-2">Rodapé</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ColorPickerField label="Fundo do Rodapé" name="footerBackgroundColor" value={formData.branding.footerBackgroundColor} section="branding" onChange={handleInputChange} />
                            <ColorPickerField label="Texto do Rodapé" name="footerTextColor" value={formData.branding.footerTextColor} section="branding" onChange={handleInputChange} />
                       </div>
                   </div>

                   <div>
                       <h4 className="text-lg font-medium text-white mb-4 border-b border-gray-700 pb-2">Tipografia</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                               <label htmlFor="headingFont" className="block text-sm font-medium text-gray-300 mb-2">Fonte de Títulos</label>
                               <select 
                                   id="headingFont" 
                                   name="headingFont" 
                                   data-section="branding" 
                                   value={formData.branding.headingFont} 
                                   onChange={handleInputChange} 
                                   className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary"
                               >
                                   {GOOGLE_FONTS.map(font => (
                                       <option key={font.name} value={font.name} style={{ fontFamily: font.family }}>{font.name}</option>
                                   ))}
                               </select>
                           </div>
                           <div>
                               <label htmlFor="bodyFont" className="block text-sm font-medium text-gray-300 mb-2">Fonte de Texto</label>
                               <select 
                                   id="bodyFont" 
                                   name="bodyFont" 
                                   data-section="branding" 
                                   value={formData.branding.bodyFont} 
                                   onChange={handleInputChange} 
                                   className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary"
                               >
                                   {GOOGLE_FONTS.map(font => (
                                       <option key={font.name} value={font.name} style={{ fontFamily: font.family }}>{font.name}</option>
                                   ))}
                               </select>
                           </div>
                       </div>
                       
                       {/* Live Preview */}
                       <div className="mt-6 p-6 rounded-lg bg-white text-gray-900 border border-gray-300">
                           <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Pré-visualização</p>
                           <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: formData.branding.headingFont }}>Título de Exemplo</h2>
                           <p className="text-lg leading-relaxed" style={{ fontFamily: formData.branding.bodyFont }}>
                               Este é um exemplo de como o texto do seu site ficará. A tipografia correta melhora a legibilidade e fortalece a identidade da sua marca.
                           </p>
                       </div>
                   </div>

                    <div className="border-t border-gray-700 pt-6">
                        <label className="block text-sm font-medium text-gray-300 mb-4">Logo da Loja</label>
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="relative group">
                                <div className="w-32 h-32 bg-gray-600 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-500">
                                    {formData.branding.logoUrl ? (
                                        <img src={formData.branding.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <span className="text-gray-400 text-sm">Sem Logo</span>
                                    )}
                                </div>
                                {formData.branding.logoUrl && (
                                    <div className="absolute top-0 right-0 -mt-2 -mr-2">
                                        <button 
                                            type="button" 
                                            onClick={() => setFormData(prev => ({...prev, branding: {...prev.branding, logoUrl: ''}}))}
                                            className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 space-y-4">
                                <div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleLogoFileChange} 
                                        accept="image/*" 
                                        className="hidden" 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors border border-gray-500"
                                    >
                                        Carregar Logo (Upload)
                                    </button>
                                    <p className="text-xs text-gray-400 mt-2">Recomendado: 300x300px, PNG transparente.</p>
                                </div>
                                
                                <div>
                                    <label htmlFor="logoUrl" className="block text-xs font-medium text-gray-400 mb-1">Ou insira URL externa</label>
                                    <input
                                        id="logoUrl"
                                        type="text"
                                        name="logoUrl"
                                        data-section="branding"
                                        value={formData.branding.logoUrl}
                                        onChange={handleInputChange}
                                        placeholder="https://exemplo.com/logo.png"
                                        className="bg-gray-700 p-2 text-sm rounded-md w-full focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </section>
            )}

            {activeTab === 'banners' && (
              <section>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-white">Gerenciar Banners</h3>
                    <button type="button" onClick={() => handleOpenBannerModal()} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">
                        Adicionar Banner
                    </button>
                </div>
                <div className="space-y-4">
                  {formData.banners && formData.banners.length > 0 ? formData.banners.map(banner => (
                    <div key={banner.id} className="bg-gray-700 p-4 rounded-lg flex items-center gap-4">
                      <img src={banner.imageUrl} alt={banner.title} className="w-32 h-16 object-cover rounded-md bg-gray-600" />
                      <div className="flex-1">
                        <h4 className="font-bold text-white">{banner.title}</h4>
                        <p className="text-sm text-gray-400">{banner.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleOpenBannerModal(banner)} className="text-blue-400 hover:text-blue-300 p-2 rounded-full hover:bg-gray-600"><PencilIcon /></button>
                        <button type="button" onClick={() => handleDeleteBanner(banner)} className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-gray-600"><TrashIcon /></button>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center text-gray-400 py-4">Nenhum banner cadastrado.</p>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'email' && (
              <section>
                <h3 className="text-xl font-semibold text-white mb-6">Configurações de E-mail (SMTP)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Host SMTP" name="smtpHost" value={formData.email.smtpHost} section="email" placeholder="smtp.example.com" onChange={handleInputChange} />
                    <InputField label="Porta SMTP" name="smtpPort" value={formData.email.smtpPort} section="email" placeholder="587" onChange={handleInputChange} />
                    <InputField label="Usuário SMTP" name="smtpUser" value={formData.email.smtpUser} section="email" placeholder="seu-email@example.com" onChange={handleInputChange} />
                    <InputField label="Senha SMTP" name="smtpPass" value={formData.email.smtpPass} section="email" type="password" onChange={handleInputChange} />
                </div>
                <div className="mt-8">
                     <TextAreaField label="Corpo do E-mail de Confirmação de Compra" name="purchaseConfirmationBody" value={formData.email.purchaseConfirmationBody} section="email" rows={10} onChange={handleInputChange} />
                     <p className="text-xs text-gray-400 mt-2">{'Use `{{cliente}}` para o nome do cliente e `{{pedido_id}}` para o número do pedido.'}</p>
                </div>
              </section>
            )}
            
             {activeTab === 'info' && (
               <section>
                <h3 className="text-xl font-semibold text-white mb-6">Páginas de Informação</h3>
                <div className="space-y-6">
                    <TextAreaField label="Sobre a Loja" name="about" value={formData.infoPages.about} section="infoPages" rows={6} onChange={handleInputChange} />
                    <TextAreaField label="Como Comprar" name="howToBuy" value={formData.infoPages.howToBuy} section="infoPages" rows={6} onChange={handleInputChange} />
                    <TextAreaField label="Política de Devolução" name="returns" value={formData.infoPages.returns} section="infoPages" rows={6} onChange={handleInputChange} />
                </div>
              </section>
            )}
            
            {activeTab === 'seo' && (
              <section>
                <h3 className="text-xl font-semibold text-white mb-6">SEO e Marketing</h3>
                
                <div className="space-y-6 border-b border-gray-700 pb-6 mb-6">
                  <h4 className="text-lg font-medium text-gray-200">Integrações Google</h4>
                  <InputField label="Google Analytics ID" name="googleAnalyticsId" value={formData.seo?.googleAnalyticsId || ''} section="seo" placeholder="UA-12345678-1" onChange={handleInputChange} />
                  <InputField label="Google Merchant Center ID" name="googleMerchantCenterId" value={formData.seo?.googleMerchantCenterId || ''} section="seo" placeholder="123456789" onChange={handleInputChange} />
                  <InputField label="Google Meu Negócio" name="googleMyBusinessId" value={formData.seo?.googleMyBusinessId || ''} section="seo" placeholder="Link ou ID do perfil" onChange={handleInputChange} />
                </div>
                
                <div className="space-y-6 border-b border-gray-700 pb-6 mb-6">
                  <h4 className="text-lg font-medium text-gray-200">Feeds de Produtos (XML)</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Feed do Google Shopping</label>
                    <div className="flex gap-2">
                      <input type="text" value={formData.seo?.googleXmlUrl || ''} readOnly className="flex-1 bg-gray-700 p-3 rounded-md focus:outline-none cursor-not-allowed" placeholder="Clique em gerar para criar o link"/>
                      <button type="button" onClick={() => handleGenerateXml('google')} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">Gerar/Atualizar</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Feed do Facebook Marketplace</label>
                    <div className="flex gap-2">
                      <input type="text" value={formData.seo?.facebookXmlUrl || ''} readOnly className="flex-1 bg-gray-700 p-3 rounded-md focus:outline-none cursor-not-allowed" placeholder="Clique em gerar para criar o link"/>
                      <button type="button" onClick={() => handleGenerateXml('facebook')} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">Gerar/Atualizar</button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-lg font-medium text-gray-200">Código Personalizado no Cabeçalho</h4>
                  <TextAreaField label="Scripts <head>" name="customHeadScript" value={formData.seo?.customHeadScript || ''} section="seo" rows={6} onChange={handleInputChange} />
                  <p className="text-xs text-gray-400 mt-2">Use para adicionar tags de verificação, Meta Pixel, Google Tags, etc. O código será injetado antes do fechamento da tag `&lt;/head&gt;`.</p>
                </div>

              </section>
            )}

            {activeTab === 'conectividade' && (
                <section>
                     <div className="flex space-x-1 bg-gray-700 p-1 rounded-lg mb-6 w-fit">
                         <button 
                            type="button"
                            onClick={() => setConnectivityTab('conexao')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${connectivityTab === 'conexao' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                         >
                             Conexão
                         </button>
                         <button 
                            type="button"
                            onClick={() => setConnectivityTab('treinamento')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${connectivityTab === 'treinamento' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                         >
                             Treinamento
                         </button>
                         <button 
                            type="button"
                            onClick={() => setConnectivityTab('catalogo')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${connectivityTab === 'catalogo' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                         >
                             Catálogo
                         </button>
                    </div>

                    {connectivityTab === 'conexao' && (
                        <div className="animate-fade-in">
                             <h3 className="text-xl font-semibold text-white mb-6">Conexão WhatsApp</h3>
                             <div className="space-y-6">
                                <InputField label="Telefone Whatsapp" name="whatsappPhone" value={formData.connectivity.whatsappPhone} section="connectivity" placeholder="+55 11 99999-9999" onChange={handleInputChange} />
                                <div className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
                                    <span className="font-medium">Status da Conexão</span>
                                     <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                         connectionStatus === 'Conectado' ? 'bg-green-500/20 text-green-400' : 
                                         connectionStatus === 'Conectando' ? 'bg-yellow-500/20 text-yellow-400' : 
                                         'bg-red-500/20 text-red-400'
                                     }`}>
                                        {connectionStatus}
                                     </span>
                                </div>
                                <div className="text-center p-4 bg-gray-700 rounded-lg">
                                    {isLoading && <p className="text-yellow-400">Processando...</p>}
                                    {qrCode && connectionStatus !== 'Conectado' && (
                                        <div className="flex flex-col items-center">
                                            <h4 className="font-semibold mb-2">Escaneie o QR Code</h4>
                                            <img src={qrCode} alt="QR Code do WhatsApp" className="w-64 h-64 rounded-lg"/>
                                            <p className="text-sm text-gray-400 mt-2">Abra o WhatsApp no seu celular e escaneie o código para conectar.</p>
                                        </div>
                                    )}
                                    {connectionStatus === 'Desconectado' && !isLoading && !qrCode && (
                                        <button type="button" onClick={handleConnect} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                                            Conectar
                                        </button>
                                    )}
                                     {connectionStatus === 'Conectado' && !isLoading && (
                                        <button type="button" onClick={handleDisconnect} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                                            Desconectar
                                        </button>
                                    )}
                                </div>
                             </div>
                        </div>
                    )}

                    {connectivityTab === 'treinamento' && (
                        <div className="animate-fade-in">
                            <h3 className="text-xl font-semibold text-white mb-6">Treinamento da IA</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                Defina tópicos, políticas e informações essenciais que a Inteligência Artificial deve usar para responder aos clientes no WhatsApp.
                            </p>
                             <TextAreaField 
                                label="Base de Conhecimento (Tópicos Livres)" 
                                name="trainingText" 
                                value={formData.ai?.trainingText || ''} 
                                section="ai" 
                                rows={15}
                                onChange={handleInputChange}
                            />
                        </div>
                    )}

                    {connectivityTab === 'catalogo' && (
                         <div className="animate-fade-in">
                             <h3 className="text-xl font-semibold text-white mb-6">Catálogo do WhatsApp</h3>
                             <p className="text-gray-400 text-sm mb-4">
                                Produtos sincronizados e disponíveis no catálogo do WhatsApp Business.
                            </p>
                             
                             {connectionStatus !== 'Conectado' ? (
                                 <div className="text-center p-8 bg-gray-700 rounded-lg border border-gray-600 border-dashed">
                                     <p className="text-gray-400">Conecte-se ao WhatsApp para visualizar o catálogo.</p>
                                 </div>
                             ) : whatsappCatalog.length === 0 ? (
                                 <div className="text-center p-8 bg-gray-700 rounded-lg">
                                     <p className="text-gray-400">Nenhum produto encontrado no catálogo.</p>
                                 </div>
                             ) : (
                                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                     {whatsappCatalog.map(item => (
                                         <div key={item.id} className="bg-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                             <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover"/>
                                             <div className="p-4">
                                                 <h4 className="font-semibold text-white truncate" title={item.name}>{item.name}</h4>
                                                 <p className="text-primary font-bold mt-2">R$ {item.price.toFixed(2)}</p>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </div>
                    )}
                </section>
            )}

            {activeTab === 'redes' && (
                <section>
                    <h3 className="text-xl font-semibold text-white mb-6">Redes Sociais</h3>
                     <div className="space-y-6">
                        <InputField label="Facebook" name="facebook" value={formData.socialMedia.facebook} section="socialMedia" placeholder="https://facebook.com/sua-loja" onChange={handleInputChange} />
                        <InputField label="Instagram" name="instagram" value={formData.socialMedia.instagram} section="socialMedia" placeholder="https://instagram.com/sua-loja" onChange={handleInputChange} />
                        <InputField label="TikTok" name="tiktok" value={formData.socialMedia.tiktok} section="socialMedia" placeholder="https://tiktok.com/@sua-loja" onChange={handleInputChange} />
                        <InputField label="Youtube" name="youtube" value={formData.socialMedia.youtube} section="socialMedia" placeholder="https://youtube.com/c/sua-loja" onChange={handleInputChange} />
                     </div>
                </section>
            )}
            
            {activeTab === 'pagamento' && (
                 <section>
                    <h3 className="text-xl font-semibold text-white mb-6">Configuração Mercado Pago</h3>
                     <div className="space-y-6">
                        <InputField label="Public Key" name="mercadoPagoPublicKey" value={formData.integrations.mercadoPagoPublicKey} section="integrations" type="password" onChange={handleInputChange} />
                        <InputField label="Access Token" name="mercadoPagoToken" value={formData.integrations.mercadoPagoToken} section="integrations" type="password" onChange={handleInputChange} />
                     </div>
                </section>
            )}
            
            {activeTab === 'frete' && (
                <section>
                    <h3 className="text-xl font-semibold text-white mb-6">Configuração de Frete</h3>
                     <div className="space-y-6">
                        <InputField label="Melhor Envio - Token" name="melhorEnvioToken" value={formData.shipping.melhorEnvioToken} section="shipping" type="password" onChange={handleInputChange} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Dias Adicionais ao Prazo" name="additionalDays" value={formData.shipping.additionalDays} section="shipping" type="number" placeholder="0" onChange={handleInputChange} />
                            <InputField label="Valor Adicional ao Frete (R$)" name="additionalCost" value={formData.shipping.additionalCost} section="shipping" type="number" placeholder="0.00" onChange={handleInputChange} />
                        </div>

                        <div className="border-t border-gray-700 pt-6 mt-6">
                            <h4 className="text-lg font-semibold text-white mb-4">Política de Frete Grátis</h4>
                            
                            <div>
                                <label htmlFor="freeShippingEnabled" className="block text-sm font-medium text-gray-300 mb-2">Ativar Política de Frete Grátis</label>
                                <select
                                    id="freeShippingEnabled"
                                    name="enabled"
                                    value={String(formData.shipping.freeShippingPolicy.enabled)}
                                    onChange={handleShippingPolicyChange}
                                    className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="true">Sim, ativar</option>
                                    <option value="false">Não, desativar</option>
                                </select>
                            </div>

                            <div className="mt-6">
                                <label htmlFor="freeShippingMinValue" className="block text-sm font-medium text-gray-300 mb-2">Frete Grátis a partir de (R$)</label>
                                <input id="freeShippingMinValue" type="number" name="minValue" value={formData.shipping.freeShippingPolicy.minValue} onChange={handleShippingPolicyChange} placeholder="Ex: 250.00" step="0.01" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-600" disabled={!formData.shipping.freeShippingPolicy.enabled} />
                            </div>
                            
                            <div className="mt-6">
                                <label htmlFor="freeShippingCities" className="block text-sm font-medium text-gray-300 mb-2">Cidades com Frete Grátis (uma por linha)</label>
                                <textarea id="freeShippingCities" name="cities" value={formData.shipping.freeShippingPolicy.cities} onChange={handleShippingPolicyChange} rows={4} className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-600" placeholder={"Ex: São Paulo\nRio de Janeiro"} disabled={!formData.shipping.freeShippingPolicy.enabled} />
                            </div>
                        </div>
                     </div>
                </section>
            )}

            {activeTab === 'api' && (
              <section className="space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Documentação da API</h3>
                  <p className="text-gray-400 text-sm">
                    Utilize os endpoints abaixo para integrar sua loja virtual (frontend) ao nosso painel administrativo. 
                    A URL base para todas as requisições é:
                  </p>
                  <CodeBlock code="https://bios-earned-cities-wash.trycloudflare.com" language="text" />
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <h4 className="text-lg font-medium text-primary mb-4">1. Comunicar uma Venda (Criar Pedido)</h4>
                  <p className="text-gray-400 text-sm mb-2">
                    Envie os dados da venda realizada na loja para registrar o pedido no painel.
                  </p>
                  <p className="text-sm text-gray-300 mb-1 font-mono">POST /db/loja_orders</p>
                  <CodeBlock code={`{
  "customer_name": "João Silva",
  "customer_email": "joao@email.com",
  "total": "150.00",
  "status": "Pendente",
  "origin": "Site",
  "items": "[{\\"product_id\\": \\"123\\", \\"quantity\\": 1, \\"price\\": 150.00}]",
  "store_id": "seu_store_id"
}`} />
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <h4 className="text-lg font-medium text-primary mb-4">2. Gerenciamento de Clientes</h4>
                  
                  <div className="mb-6">
                    <h5 className="text-md font-semibold text-white mb-2">Cadastrar Cliente</h5>
                    <p className="text-sm text-gray-300 mb-1 font-mono">POST /db/loja_customers</p>
                    <CodeBlock code={`{
  "name": "Maria Souza",
  "email": "maria@email.com",
  "avatar_url": "https://...",
  "cpf_cnpj": "000.000.000-00",
  "store_id": "seu_store_id",
  "contacts": {
    "phone": "11999999999",
    "whatsapp": "11999999999"
  },
  "addres": {
    "street": "Rua Exemplo",
    "number": "123",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "00000-000"
  }
}`} />
                  </div>

                  <div className="mb-6">
                    <h5 className="text-md font-semibold text-white mb-2">Fazer Login (Cliente)</h5>
                    <p className="text-sm text-gray-300 mb-1 font-mono">GET /db/loja_customers?email=maria@email.com&password=senha_segura</p>
                    <p className="text-xs text-gray-500 italic mb-2">Nota: Em produção, recomenda-se usar um endpoint de autenticação dedicado que retorne um token JWT.</p>
                  </div>

                  <div className="mb-6">
                    <h5 className="text-md font-semibold text-white mb-2">Editar Dados do Cliente</h5>
                    <p className="text-sm text-gray-300 mb-1 font-mono">PUT /db/loja_customers/:id</p>
                    <CodeBlock code={`{
  "name": "Maria Souza Alterada",
  "avatar_url": "https://nova-foto.com/perfil.jpg"
}`} />
                  </div>

                  <div className="mb-6">
                    <h5 className="text-md font-semibold text-white mb-2">Resgatar Dados Pessoais</h5>
                    <p className="text-sm text-gray-300 mb-1 font-mono">GET /db/loja_customers/:id</p>
                    <p className="text-gray-400 text-sm">Retorna o objeto JSON com os dados do cliente.</p>
                  </div>

                  <div>
                    <h5 className="text-md font-semibold text-white mb-2">Resgatar Compras do Cliente</h5>
                    <p className="text-sm text-gray-300 mb-1 font-mono">GET /db/loja_orders?customer_id=:id_do_cliente</p>
                    <p className="text-gray-400 text-sm">Retorna uma lista de pedidos associados ao ID do cliente.</p>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <h4 className="text-lg font-medium text-primary mb-4">3. Consulta de Produtos</h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Utilize os parâmetros de URL para filtrar a lista de produtos.
                  </p>

                  <div className="mb-6">
                    <h5 className="text-md font-semibold text-white mb-2">Filtrar por Parte do Nome</h5>
                    <p className="text-sm text-gray-300 mb-1 font-mono">GET /db/loja_products?name_like=TermoBusca</p>
                    <CodeBlock code={`GET /db/loja_products?name_like=Camiseta&store_id=seu_store_id`} language="text" />
                  </div>

                  <div className="mb-6">
                    <h5 className="text-md font-semibold text-white mb-2">Filtrar por SKU</h5>
                    <p className="text-sm text-gray-300 mb-1 font-mono">GET /db/loja_products?sku=CODIGO_SKU</p>
                    <CodeBlock code={`GET /db/loja_products?sku=TS-PREM-BLK&store_id=seu_store_id`} language="text" />
                  </div>

                  <div className="mb-6">
                    <h5 className="text-md font-semibold text-white mb-2">Filtrar por Marca, Modelo ou Categoria</h5>
                    <p className="text-gray-400 text-sm mb-2">
                        Utilize os IDs correspondentes. Para obter os IDs, consulte as tabelas 
                        <code className="text-primary text-xs mx-1">loja_brands</code>, 
                        <code className="text-primary text-xs mx-1">loja_models</code> e 
                        <code className="text-primary text-xs mx-1">loja_categories</code>.
                    </p>
                    <p className="text-sm text-gray-300 mb-1 font-mono">GET /db/loja_products?category_id=ID&brand_id=ID</p>
                    <CodeBlock code={`GET /db/loja_products?category_id=cat-01&brand_id=brand-01&store_id=seu_store_id`} language="text" />
                  </div>

                  <div className="mb-6">
                    <h5 className="text-md font-semibold text-white mb-2">Exemplo de Resposta (Produto)</h5>
                    <CodeBlock code={`[
  {
    "id": "prod-001",
    "name": "Camiseta Premium",
    "sku": "TS-PREM",
    "price": "129.90",
    "stock": "50",
    "category_id": "cat-01",
    "brand_id": "brand-01",
    "model_id": "model-01",
    "description": "Descrição do produto...",
    "status": "Ativo",
    "media": [{"url": "...", "type": "image"}]
  }
]`} />
                  </div>
                </div>
              </section>
            )}

            {activeTab !== 'banners' && activeTab !== 'api' && (
                <div className="border-t border-gray-700 pt-6 flex justify-end">
                  <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Salvar Alterações
                  </button>
                </div>
            )}
          </form>
        </main>
      </div>
      <BannerModal
        isOpen={isBannerModalOpen}
        onClose={handleCloseBannerModal}
        onSave={handleSaveBanner}
        banner={editingBanner}
        showToast={showToast}
      />
      <ImageCropperModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageSrc={tempLogoImg}
        onCrop={handleCropComplete}
      />
      <ConfirmationModal
        isOpen={deleteBannerConfig.isOpen}
        onClose={() => setDeleteBannerConfig({ isOpen: false, banner: null })}
        onConfirm={confirmDeleteBanner}
        title="Excluir Banner"
        message={`Tem certeza que deseja excluir o banner "${deleteBannerConfig.banner?.title}"?`}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default Settings;
