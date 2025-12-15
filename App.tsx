
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Customers from './pages/Customers';
import CustomerProfile from './pages/CustomerProfile';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Chat from './pages/Chat';
import Coupons from './pages/Coupons';
import Reviews from './pages/Reviews';
import Marketplace from './pages/Marketplace';
import Landing from './pages/Landing';
import CompleteSetup from './pages/CompleteSetup';
import Profile from './pages/Profile';
import { Page, Order, Customer, Product, Toast, User } from './types';
import { useMockData } from './hooks/useMockData';
import ToastContainer from './components/Toast';
import * as apiService from './services/apiService';
import Login from './pages/Login';

const App: React.FC = () => {
  const [bootStatus, setBootStatus] = useState<'booting' | 'ready' | 'error'>('booting');
  const [bootMessage, setBootMessage] = useState('Inicializando sistema...');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [currentPage, setCurrentPage] = useState<Page>(Page.Landing); // Landing é a inicial por padrão
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // State for Registration Flow
  const [pendingStoreId, setPendingStoreId] = useState<number | string | null>(null);
  const [pendingZipCode, setPendingZipCode] = useState<string>('');
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      if (localStorage.getItem('theme') === 'dark') {
        return 'dark';
      }
      if (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      console.warn('LocalStorage access denied');
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      try { localStorage.setItem('theme', 'dark'); } catch (e) {}
    } else {
      root.classList.remove('dark');
      try { localStorage.setItem('theme', 'light'); } catch (e) {}
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await apiService.authenticateAndInitializeSystem(setBootMessage);
        setBootStatus('ready');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido na inicialização.';
        setBootMessage(message);
        setBootStatus('error');
      }
    };
    initializeApp();
  }, []);

  const showToast = useCallback((message: string, type: Toast['type']) => {
    const newToast: Toast = { id: Date.now(), message, type };
    setToasts(prev => [...prev, newToast]);
  }, []);
  
  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const { 
    isLoading: isDataLoading,
    refreshData,
    products, addProduct, updateProduct, deleteProduct, 
    orders, updateOrder,
    customers, addCustomer, // Destructure addCustomer
    kpi,
    categories, addCategory, updateCategory, deleteCategory,
    brands, addBrand, updateBrand, deleteBrand,
    models, addModel, updateModel, deleteModel,
    materials, addMaterial, updateMaterial, deleteMaterial,
    colors, addColor, updateColor, deleteColor,
    coupons, addCoupon, updateCoupon, deleteCoupon,
    reviews, addReview, updateReview, deleteReview,
    storeSettings, updateStoreSettings,
    addBanner, updateBanner, deleteBanner,
    analyticsData, analyticsPeriod, setAnalyticsPeriod,
  } = useMockData({ showToast, isAuthenticated: !!currentUser });

  const handleLoginSuccess = useCallback((user: User) => {
    setCurrentUser(user);
    setCurrentPage(Page.Dashboard);
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setCurrentPage(Page.Landing);
  }, []);

  const handleUpdateUser = useCallback((updatedUser: User) => {
      setCurrentUser(updatedUser);
  }, []);

  // Handlers for Registration Flow
  const handleRegisterSuccess = useCallback((storeId: number | string, zipCode: string) => {
      setPendingStoreId(storeId);
      setPendingZipCode(zipCode);
      setCurrentPage(Page.CompleteSetup);
  }, []);

  const handleSetupComplete = useCallback(() => {
      // Simula o login automático após o setup completo
      const fakeUser: User = {
          id: 999,
          username: 'admin',
          name: 'Admin da Loja',
          email: 'admin@loja.com',
          avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=random'
      };
      setCurrentUser(fakeUser);
      setPendingStoreId(null);
      setPendingZipCode('');
      setCurrentPage(Page.Dashboard);
  }, []);

  const handleViewOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setCurrentPage(Page.OrderDetail);
  }, []);

  const handleBackToOrders = useCallback(() => {
    setSelectedOrder(null);
    setCurrentPage(Page.Orders);
  }, []);
  
  const handleViewCustomerProfile = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setCurrentPage(Page.CustomerProfile);
  }, []);

  const handleBackToCustomers = useCallback(() => {
    setSelectedCustomer(null);
    setCurrentPage(Page.Customers);
  }, []);

  const navigateToAddProduct = useCallback(() => {
    setEditingProduct(null);
    setCurrentPage(Page.AddEditProduct);
  }, []);
  
  const navigateToEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setCurrentPage(Page.AddEditProduct);
  }, []);
  
  const handleBackToProducts = useCallback(() => {
    setEditingProduct(null);
    setCurrentPage(Page.Products);
  }, []);
  
  const handleSaveProduct = useCallback((productData: Product | Omit<Product, 'id'>) => {
    if ('id' in productData) {
      updateProduct(productData as Product);
    } else {
      addProduct(productData);
    }
    handleBackToProducts();
  }, [addProduct, updateProduct, handleBackToProducts]);

  // Handle sidebar navigation with data refresh
  const handleNavigation = useCallback((page: Page) => {
    setCurrentPage(page);
    refreshData(); // Forces reload whenever a menu item is clicked
  }, [refreshData]);
  
  React.useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = orders.find(o => o.id === selectedOrder.id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      } else {
        handleBackToOrders();
      }
    }
  }, [orders, selectedOrder, handleBackToOrders]);

  const LoadingScreen = ({ message }: { message: string }) => (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white animate-fade-in">
        <div className="text-center">
            <svg className="mx-auto h-12 w-12 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          <h1 className="text-2xl font-bold mt-4">E-connect</h1>
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        </div>
      </div>
  );

  if (bootStatus === 'booting') {
    return <LoadingScreen message={bootMessage} />
  }

  if (bootStatus === 'error') {
     return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-8">
        <div className="text-center bg-gray-800 border border-red-500/50 p-8 rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold text-red-400">Erro Crítico na Inicialização</h1>
          <p className="text-gray-300 mt-2">{bootMessage}</p>
        </div>
      </div>
    );
  }
  
  // Roteamento para usuários NÃO autenticados
  if (!currentUser) {
      if (currentPage === Page.Login) {
          return (
            <Login 
                onLoginSuccess={handleLoginSuccess} 
                onNavigateToRegister={() => setCurrentPage(Page.Landing)}
                showToast={showToast} 
            />
          );
      }
      if (currentPage === Page.CompleteSetup && pendingStoreId) {
          return <CompleteSetup storeId={pendingStoreId} initialZipCode={pendingZipCode} onComplete={handleSetupComplete} showToast={showToast} />;
      }
      // Padrão para não logados: Landing Page
      return <Landing onNavigateToLogin={() => setCurrentPage(Page.Login)} onRegisterSuccess={handleRegisterSuccess} showToast={showToast} />;
  }

  // Se logado, mas carregando dados (exceto se for uma página que não precisa de dados)
  if (isDataLoading || !storeSettings) {
     return <LoadingScreen message="Carregando dados da loja..." />
  }

  const renderPage = () => {
    switch (currentPage) {
      case Page.Dashboard: return <Dashboard kpi={kpi} recentOrders={orders} salesData={analyticsData.chart} theme={theme} />;
      case Page.Chat: return <Chat whatsappStatus={storeSettings.connectivity.whatsappStatus} showToast={showToast} />;
      case Page.Products:
        return <Products 
            products={products} onAddProductClick={navigateToAddProduct} onEditProductClick={navigateToEditProduct} deleteProduct={deleteProduct}
            categories={categories} addCategory={addCategory} updateCategory={updateCategory} deleteCategory={deleteCategory}
            brands={brands} addBrand={addBrand} updateBrand={updateBrand} deleteBrand={deleteBrand}
            models={models} addModel={addModel} updateModel={updateModel} deleteModel={deleteModel}
            materials={materials} addMaterial={addMaterial} updateMaterial={updateMaterial} deleteMaterial={deleteMaterial}
            colors={colors} addColor={addColor} updateColor={updateColor} deleteColor={deleteColor}
            showToast={showToast}
        />;
       case Page.AddEditProduct:
        return <ProductForm onBack={handleBackToProducts} onSave={handleSaveProduct} product={editingProduct} categories={categories} brands={brands} models={models} materials={materials} colors={colors} showToast={showToast} />;
      case Page.Orders: return <Orders orders={orders} onViewOrder={handleViewOrder} />;
      case Page.OrderDetail: return <OrderDetail order={selectedOrder} onBack={handleBackToOrders} updateOrder={updateOrder} reviews={reviews} showToast={showToast} />;
      case Page.Coupons: return <Coupons coupons={coupons} addCoupon={addCoupon} updateCoupon={updateCoupon} deleteCoupon={deleteCoupon} showToast={showToast} />;
      case Page.Customers: return <Customers customers={customers} onViewProfile={handleViewCustomerProfile} addCustomer={addCustomer} showToast={showToast} />; // Pass addCustomer
      case Page.CustomerProfile: return <CustomerProfile customer={selectedCustomer} orders={orders} onBack={handleBackToCustomers} />;
      case Page.Reviews: return <Reviews reviews={reviews} addReview={addReview} updateReview={updateReview} deleteReview={deleteReview} showToast={showToast} />;
      case Page.Analytics: return <Analytics data={analyticsData} period={analyticsPeriod} setPeriod={setAnalyticsPeriod} theme={theme} />;
      case Page.Settings:
        return <Settings settings={storeSettings} updateSettings={updateStoreSettings} addBanner={addBanner} updateBanner={updateBanner} deleteBanner={deleteBanner} showToast={showToast}/>;
      case Page.MarketplaceMercadoLivre:
        return <Marketplace settings={storeSettings} updateSettings={updateStoreSettings} products={products} updateProduct={updateProduct} showToast={showToast} />;
      case Page.Profile:
        return <Profile user={currentUser} onUpdateUser={handleUpdateUser} showToast={showToast} />;
      default: return <Dashboard kpi={kpi} recentOrders={orders} salesData={analyticsData.chart} theme={theme} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 font-sans">
      <Sidebar currentPage={currentPage} setCurrentPage={handleNavigation} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
            currentPage={currentPage} 
            user={currentUser} 
            onLogout={handleLogout} 
            onNavigate={setCurrentPage}
            theme={theme} 
            toggleTheme={toggleTheme} 
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div key={currentPage} className="animate-fade-in min-h-full">
            {renderPage()}
          </div>
        </main>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default App;
