import React, { useState, useMemo } from 'react';
import type { StoreSettings, Product, Toast } from '../types';
import { ShareIcon, EyeIcon } from '../components/icons/Icons';

interface MarketplaceProps {
  settings: StoreSettings;
  updateSettings: (settings: StoreSettings) => void;
  products: Product[];
  updateProduct: (product: Product) => void;
  showToast: (message: string, type: Toast['type']) => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({ settings, updateSettings, products, showToast }) => {
  const [activeTab, setActiveTab] = useState('settings');
  const [formData, setFormData] = useState(settings.integrations);
  const [isLoading, setIsLoading] = useState(false);

  const publishedProducts = useMemo(() => {
    return products.filter(p => p.mercadoLivreStatus === 'published');
  }, [products]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };
  
  const handleSaveChanges = () => {
    updateSettings({ ...settings, integrations: formData });
    showToast('Credenciais salvas. Agora você pode conectar.', 'info');
  };

  const handleConnect = () => {
    if(!formData.mercadoLivreUser || !formData.mercadoLivreToken) {
        showToast('Por favor, insira o usuário e o token do Mercado Livre.', 'error');
        return;
    }
    setIsLoading(true);
    const newConnectingStatus = { ...settings, integrations: { ...formData, mercadoLivreStatus: 'Conectando' as const }};
    updateSettings(newConnectingStatus);
    
    setTimeout(() => {
        const newConnectedStatus = { ...settings, integrations: { ...formData, mercadoLivreStatus: 'Conectado' as const }};
        updateSettings(newConnectedStatus);
        setIsLoading(false);
        showToast('Conectado com sucesso ao Mercado Livre!', 'success');
    }, 2000);
  };
  
  const handleDisconnect = () => {
      setIsLoading(true);
       setTimeout(() => {
        const newDisconnectedStatus = { ...settings, integrations: { ...formData, mercadoLivreStatus: 'Desconectado' as const }};
        updateSettings(newDisconnectedStatus);
        setIsLoading(false);
        showToast('Desconectado do Mercado Livre.', 'info');
    }, 1000);
  };
  
  const getStatusPill = (status: Product['mercadoLivreStatus']) => {
    switch (status) {
        case 'published':
            return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">Publicado</span>;
        case 'pending':
            return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400">Pendente</span>;
        case 'error':
             return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">Erro</span>;
        default:
             return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-400">Não Publicado</span>;
    }
  };

  const tabs = [
    { id: 'settings', label: 'Configurações' },
    { id: 'published', label: 'Produtos Publicados' },
  ];

  const connectionStatus = settings.integrations.mercadoLivreStatus;

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <ShareIcon className="w-8 h-8 text-primary"/>
        <h2 className="text-2xl font-bold text-white">Integração com Mercado Livre</h2>
      </div>

       <div className="mb-6 border-b border-gray-700">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {tabs.map(tab => (
                  <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${
                          activeTab === tab.id
                              ? 'border-primary text-primary'
                              : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                  >
                      {tab.label}
                  </button>
              ))}
          </nav>
      </div>

      {activeTab === 'settings' && (
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-white mb-6">Configurar Conexão</h3>
            <div className="space-y-6">
                <div>
                    <label htmlFor="mercadoLivreUser" className="block text-sm font-medium text-gray-300 mb-2">Usuário/Email do Mercado Livre</label>
                    <input id="mercadoLivreUser" type="text" name="mercadoLivreUser" value={formData.mercadoLivreUser} onChange={handleInputChange} placeholder="seu.usuario@email.com" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                 <div>
                    <label htmlFor="mercadoLivreToken" className="block text-sm font-medium text-gray-300 mb-2">Token de Acesso (App ID)</label>
                    <input id="mercadoLivreToken" type="password" name="mercadoLivreToken" value={formData.mercadoLivreToken} onChange={handleInputChange} placeholder="••••••••••••••••" className="bg-gray-700 p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="flex items-center justify-end">
                    <button onClick={handleSaveChanges} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                        Salvar Credenciais
                    </button>
                </div>
                
                <div className="border-t border-gray-700 pt-6 mt-6">
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
                </div>

                <div className="flex justify-center mt-4">
                    {connectionStatus === 'Conectado' ? (
                         <button onClick={handleDisconnect} disabled={isLoading} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-600">
                           {isLoading ? 'Desconectando...' : 'Desconectar'}
                        </button>
                    ) : (
                        <button onClick={handleConnect} disabled={isLoading} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-600">
                           {isLoading ? 'Conectando...' : 'Conectar'}
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}
      
      {activeTab === 'published' && (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
           <table className="w-full text-left">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-4 text-gray-300">Produto</th>
                <th className="p-4 text-gray-300">SKU</th>
                <th className="p-4 text-gray-300">Status no ML</th>
                <th className="p-4 text-gray-300 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {publishedProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-4 flex items-center">
                    <img src={product.media[0]?.url || ''} alt={product.name} className="w-12 h-12 rounded-md mr-4 object-cover bg-gray-700" />
                    <span className="font-medium text-white">{product.name}</span>
                  </td>
                  <td className="p-4 text-gray-400">{product.sku}</td>
                  <td className="p-4">{getStatusPill(product.mercadoLivreStatus)}</td>
                  <td className="p-4 space-x-4 text-right">
                    <a href={product.mercadoLivreUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">
                        <EyeIcon className="w-5 h-5"/> Ver no ML
                    </a>
                  </td>
                </tr>
              ))}
              {publishedProducts.length === 0 && (
                <tr>
                    <td colSpan={4} className="text-center p-8 text-gray-500">
                        Nenhum produto publicado no Mercado Livre.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default Marketplace;
