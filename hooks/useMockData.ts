
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product, Order, Customer, Category, Brand, Model, Material, StoreSettings, Banner, Coupon, AnalyticsData, Metric, AnalyticsChartDataPoint, Review, Color, Toast, ChannelDistributionChartDataPoint } from '../types';
import { OrderStatus, AnalyticsPeriod, OrderOrigin } from '../types';
import { db } from '../services/apiService';

interface UseMockDataProps {
  showToast: (message: string, type: Toast['type']) => void;
  isAuthenticated: boolean;
}

const DEFAULT_SETTINGS: StoreSettings = {
    storeName: '',
    domain: '',
    address: { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' },
    branding: {
        logoUrl: '',
        primaryColor: '#6366f1',
        secondaryColor: '#ec4899',
        accentColor: '#f59e0b',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        headerBackgroundColor: '#ffffff',
        headerTextColor: '#111827',
        footerBackgroundColor: '#111827',
        footerTextColor: '#f3f4f6',
        headingFont: 'Inter',
        bodyFont: 'Inter'
    },
    banners: [],
    infoPages: { about: '', howToBuy: '', returns: '' },
    email: { smtpHost: '', smtpPort: '', smtpUser: '', smtpPass: '', purchaseConfirmationBody: '' },
    connectivity: { whatsappPhone: '', whatsappStatus: 'Desconectado' },
    socialMedia: { facebook: '', instagram: '', tiktok: '', youtube: '' },
    integrations: { mercadoPagoPublicKey: '', mercadoPagoToken: '', mercadoLivreUser: '', mercadoLivreToken: '', mercadoLivreStatus: 'Desconectado' },
    shipping: { melhorEnvioToken: '', additionalDays: 0, additionalCost: 0, freeShippingPolicy: { enabled: false, minValue: 0, cities: '' } },
    ai: { googleAiToken: '', assistantName: '', restrictions: '', trainingText: '' },
    seo: { googleAnalyticsId: '', googleMerchantCenterId: '', googleMyBusinessId: '', facebookXmlUrl: '', googleXmlUrl: '', customHeadScript: '' }
};

export const useMockData = ({ showToast, isAuthenticated }: UseMockDataProps) => {
  const [isLoading, setIsLoading] = useState(true);

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>(AnalyticsPeriod.CURRENT_MONTH);
  
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      // Parallel fetching for performance
      const [
        fetchedProducts,
        fetchedCategories,
        fetchedBrands,
        fetchedModels,
        fetchedMaterials,
        fetchedColors,
        fetchedOrders,
        fetchedCustomers,
        fetchedCoupons,
        fetchedReviews,
        fetchedBanners,
        fetchedSettings
      ] = await Promise.all([
        db.getAll<Product>('products'),
        db.getAll<Category>('categories'),
        db.getAll<Brand>('brands'),
        db.getAll<Model>('models'),
        db.getAll<Material>('materials'),
        db.getAll<Color>('colors'),
        db.getAll<Order>('orders'),
        db.getAll<Customer>('customers'),
        db.getAll<Coupon>('coupons'),
        db.getAll<Review>('reviews'),
        db.getAll<Banner>('banners'),
        db.getSettings()
      ]);

      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
      setBrands(fetchedBrands);
      setModels(fetchedModels);
      setMaterials(fetchedMaterials);
      setColors(fetchedColors);
      setOrders(fetchedOrders);
      setCustomers(fetchedCustomers);
      setCoupons(fetchedCoupons);
      setReviews(fetchedReviews);

      // Merge fetched settings with default structure to ensure all fields exist
      const settings = fetchedSettings ? { ...DEFAULT_SETTINGS, ...fetchedSettings } : DEFAULT_SETTINGS;
      setStoreSettings({ ...settings, banners: fetchedBanners });

    } catch (error) {
        console.error("Failed to fetch data from API", error);
        showToast('Falha ao carregar dados do servidor.', 'error');
    } finally {
        setIsLoading(false);
    }
  }, [isAuthenticated, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Real-time Analytics (Calculated Client-Side based on fetched orders) ---
  const analyticsData = useMemo(() => {
      const now = new Date();
      let start: Date, end: Date, prevStart: Date, prevEnd: Date;
      let chartLabels: string[] = [];
      let groupKey: (d: Date) => string; 
      
      switch (analyticsPeriod) {
          case AnalyticsPeriod.CURRENT_WEEK:
              const day = now.getDay(); 
              const diff = now.getDate() - day + (day === 0 ? -6 : 1);
              const monday = new Date(now.setDate(diff));
              monday.setHours(0,0,0,0);
              start = monday;
              end = new Date(monday); end.setDate(end.getDate() + 6); end.setHours(23,59,59,999);
              prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 7);
              prevEnd = new Date(end); prevEnd.setDate(prevEnd.getDate() - 7);
              chartLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
              groupKey = (d) => chartLabels[(d.getDay() + 6) % 7];
              break;
          case AnalyticsPeriod.CURRENT_MONTH:
              start = new Date(now.getFullYear(), now.getMonth(), 1);
              end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
              prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
              chartLabels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'];
              groupKey = (d) => {
                 const date = d.getDate();
                 if(date <= 7) return 'Sem 1';
                 if(date <= 14) return 'Sem 2';
                 if(date <= 21) return 'Sem 3';
                 if(date <= 28) return 'Sem 4';
                 return 'Sem 5';
              };
              break;
           case AnalyticsPeriod.LAST_MONTH:
               start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
               end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
               prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
               prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
               chartLabels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'];
               groupKey = (d) => {
                 const date = d.getDate();
                 if(date <= 7) return 'Sem 1';
                 if(date <= 14) return 'Sem 2';
                 if(date <= 21) return 'Sem 3';
                 if(date <= 28) return 'Sem 4';
                 return 'Sem 5';
              };
              break;
           case AnalyticsPeriod.YEAR:
              start = new Date(now.getFullYear(), 0, 1);
              end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
              prevStart = new Date(now.getFullYear() - 1, 0, 1);
              prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
              chartLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
              groupKey = (d) => chartLabels[d.getMonth()];
              break;
           default: 
              start = new Date(now.getFullYear(), now.getMonth(), 1);
              end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
              chartLabels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'];
              groupKey = (d) => 'Sem 1';
      }

      const filterByDate = (items: any[], dateField: string, s: Date, e: Date) => 
        items.filter(i => {
            if (!i[dateField]) return false;
            const d = new Date(i[dateField]);
            return d >= s && d <= e;
        });

      const currentOrders = filterByDate(orders, 'date', start, end);
      const prevOrders = filterByDate(orders, 'date', prevStart, prevEnd);
      const currentCustomers = filterByDate(customers, 'joinDate', start, end);
      const prevCustomers = filterByDate(customers, 'joinDate', prevStart, prevEnd);
      
      const calculateChange = (curr: number, prev: number) => {
          if (prev === 0) return curr === 0 ? 0 : 100;
          return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
      };

      const metrics = {
          sales: {
              value: currentOrders.reduce((acc, o) => acc + o.total, 0),
              change: calculateChange(currentOrders.reduce((acc, o) => acc + o.total, 0), prevOrders.reduce((acc, o) => acc + o.total, 0))
          },
          newCustomers: {
              value: currentCustomers.length,
              change: calculateChange(currentCustomers.length, prevCustomers.length)
          },
          returns: {
              value: currentOrders.filter(o => o.status === OrderStatus.Canceled).length,
              change: 0 
          },
          accesses: { value: Math.round(currentOrders.length * 25), change: 5 }, 
          whatsappContacts: { value: Math.round(currentOrders.filter(o => o.origin === OrderOrigin.Whatsapp).length * 1.5), change: 2 },
          couponsUsed: { value: currentOrders.length > 5 ? Math.round(currentOrders.length * 0.2) : 0, change: 0 },
          recurringCustomers: { value: 15, change: 1.2 }
      };

      const chartMap = new Map<string, { atual: number, anterior: number }>();
      chartLabels.forEach(l => chartMap.set(l, { atual: 0, anterior: 0 }));

      currentOrders.forEach(o => {
          const key = groupKey(new Date(o.date));
          const entry = chartMap.get(key);
          if (entry) entry.atual += o.total;
      });

      prevOrders.forEach(o => {
          const prevD = new Date(o.date);
          let prevKey = '';
          if(analyticsPeriod === AnalyticsPeriod.YEAR) {
             prevKey = chartLabels[prevD.getMonth()];
          } else if (analyticsPeriod === AnalyticsPeriod.CURRENT_WEEK) {
             prevKey = chartLabels[(prevD.getDay() + 6) % 7];
          } else {
             const date = prevD.getDate();
             if(date <= 7) prevKey = 'Sem 1';
             else if(date <= 14) prevKey = 'Sem 2';
             else if(date <= 21) prevKey = 'Sem 3';
             else if(date <= 28) prevKey = 'Sem 4';
             else prevKey = 'Sem 5';
          }
          const entry = chartMap.get(prevKey);
          if (entry && entry.anterior !== undefined) entry.anterior += o.total;
      });

      const chart: AnalyticsChartDataPoint[] = chartLabels.map(label => ({
          name: label,
          atual: parseFloat((chartMap.get(label)?.atual || 0).toFixed(2)),
          anterior: parseFloat((chartMap.get(label)?.anterior || 0).toFixed(2))
      }));

      const channelMap = new Map<OrderOrigin, number>();
      currentOrders.forEach(o => {
          if(o.origin) channelMap.set(o.origin, (channelMap.get(o.origin) || 0) + 1);
      });
      
      const channelDistribution: ChannelDistributionChartDataPoint[] = [
          { name: OrderOrigin.Site, value: channelMap.get(OrderOrigin.Site) || 0 },
          { name: OrderOrigin.MercadoLivre, value: channelMap.get(OrderOrigin.MercadoLivre) || 0 },
          { name: OrderOrigin.Whatsapp, value: channelMap.get(OrderOrigin.Whatsapp) || 0 },
      ].filter(d => d.value > 0);

      if (channelDistribution.length === 0) {
           channelDistribution.push({ name: OrderOrigin.Site, value: 0 });
      }

      return { metrics, chart, channelDistribution };

  }, [orders, customers, analyticsPeriod]);


  // --- CRUD Operations Handlers ---

  const reloadProducts = async () => setProducts(await db.getAll('products'));
  const reloadCategories = async () => setCategories(await db.getAll('categories'));
  const reloadBrands = async () => setBrands(await db.getAll('brands'));
  const reloadModels = async () => setModels(await db.getAll('models'));
  const reloadMaterials = async () => setMaterials(await db.getAll('materials'));
  const reloadColors = async () => setColors(await db.getAll('colors'));
  const reloadCoupons = async () => setCoupons(await db.getAll('coupons'));
  const reloadBanners = async () => {
      const banners = await db.getAll<Banner>('banners');
      if (storeSettings) setStoreSettings({ ...storeSettings, banners });
  };
  const reloadReviews = async () => setReviews(await db.getAll('reviews'));

  // Products
  const productCrud = {
      add: async (item: Omit<Product, 'id'>) => {
          try {
            const newItem = { ...item, createdAt: new Date().toISOString() };
            await db.create('products', newItem);
            showToast('Produto adicionado', 'success');
            reloadProducts();
          } catch(e) { showToast('Erro ao adicionar produto', 'error'); }
      },
      update: async (item: Product) => {
          try {
            await db.update('products', item.id, item);
            showToast('Produto atualizado', 'success');
            reloadProducts();
          } catch(e) { showToast('Erro ao atualizar produto', 'error'); }
      },
      delete: async (id: string) => {
          try {
            await db.delete('products', id);
            showToast('Produto excluído', 'success');
            reloadProducts();
          } catch(e) { showToast('Erro ao excluir produto', 'error'); }
      }
  };

  // Orders
  const orderCrud = {
      update: async (item: Order) => {
          try {
            await db.update('orders', item.id, item);
            setOrders(prev => prev.map(o => o.id === item.id ? item : o));
            showToast('Pedido atualizado', 'success');
          } catch(e) { showToast('Erro ao atualizar pedido', 'error'); }
      }
  };

  // Categories
  const categoryCrud = {
      add: async (item: Omit<Category, 'id'>) => {
          try {
            await db.create('categories', item);
            showToast('Categoria adicionada', 'success');
            reloadCategories();
          } catch(e) { showToast('Erro ao adicionar', 'error'); }
      },
      update: async (item: Category) => {
          try {
            await db.update('categories', item.id, item);
            showToast('Categoria atualizada', 'success');
            reloadCategories();
          } catch(e) { showToast('Erro ao atualizar', 'error'); }
      },
      delete: async (id: string) => {
          try {
            await db.delete('categories', id);
            showToast('Categoria excluída', 'success');
            reloadCategories();
          } catch(e) { showToast('Erro ao excluir', 'error'); }
      }
  };

  // Generic Catalogs
  const createCatalogCrud = (table: string, reload: () => void) => ({
      add: async (item: any) => {
          try {
            await db.create(table, item);
            showToast('Item adicionado', 'success');
            reload();
          } catch(e) { showToast('Erro', 'error'); }
      },
      update: async (item: any) => {
          try {
            await db.update(table, item.id, item);
            showToast('Item atualizado', 'success');
            reload();
          } catch(e) { showToast('Erro', 'error'); }
      },
      delete: async (id: string) => {
          try {
            await db.delete(table, id);
            showToast('Item removido', 'success');
            reload();
          } catch(e) { showToast('Erro', 'error'); }
      }
  });

  const brandCrud = createCatalogCrud('brands', reloadBrands);
  const modelCrud = createCatalogCrud('models', reloadModels);
  const materialCrud = createCatalogCrud('materials', reloadMaterials);
  const colorCrud = createCatalogCrud('colors', reloadColors);

  // Coupons
  const couponCrud = {
      add: async (item: Omit<Coupon, 'id'>) => {
          try {
            await db.create('coupons', item);
            showToast('Cupom adicionado', 'success');
            reloadCoupons();
          } catch(e) { showToast('Erro ao adicionar cupom', 'error'); }
      },
      update: async (item: Coupon) => {
          try {
            await db.update('coupons', item.id, item);
            showToast('Cupom atualizado', 'success');
            reloadCoupons();
          } catch(e) { showToast('Erro ao atualizar cupom', 'error'); }
      },
      delete: async (id: string) => {
          try {
            await db.delete('coupons', id);
            showToast('Cupom excluído', 'success');
            reloadCoupons();
          } catch(e) { showToast('Erro ao excluir cupom', 'error'); }
      }
  };

  // Reviews
  const reviewCrud = {
      add: async (item: Omit<Review, 'id'>) => {
          try {
            await db.create('reviews', item);
            showToast('Avaliação adicionada', 'success');
            reloadReviews();
          } catch(e) { showToast('Erro ao adicionar avaliação', 'error'); }
      },
      update: async (item: Review) => {
          try {
            await db.update('reviews', item.id, item);
            showToast('Avaliação atualizada', 'success');
            reloadReviews();
          } catch(e) { showToast('Erro ao atualizar avaliação', 'error'); }
      },
      delete: async (id: string) => {
          try {
            await db.delete('reviews', id);
            showToast('Avaliação excluída', 'success');
            reloadReviews();
          } catch(e) { showToast('Erro ao excluir avaliação', 'error'); }
      }
  };

  // Settings & Banners
  const updateStoreSettings = async (newSettings: StoreSettings) => {
      try {
        await db.saveSettings(newSettings as any); // Cast to any to handle _id if present
        setStoreSettings(newSettings);
        showToast('Configurações salvas', 'success');
      } catch(e) { showToast('Erro ao salvar configurações', 'error'); }
  };

  const bannerCrud = {
      add: async (item: Omit<Banner, 'id'>) => {
          try {
            await db.create('banners', item);
            showToast('Banner adicionado', 'success');
            reloadBanners();
          } catch(e) { showToast('Erro ao adicionar banner', 'error'); }
      },
      update: async (item: Banner) => {
          try {
            await db.update('banners', item.id, item);
            showToast('Banner atualizado', 'success');
            reloadBanners();
          } catch(e) { showToast('Erro ao atualizar banner', 'error'); }
      },
      delete: async (id: string) => {
          try {
            await db.delete('banners', id);
            showToast('Banner removido', 'success');
            reloadBanners();
          } catch(e) { showToast('Erro ao remover banner', 'error'); }
      }
  };

  const kpi = {
    totalSales: orders.reduce((sum, order) => (order.status === OrderStatus.Delivered ? sum + order.total : sum), 0),
    newOrders: orders.filter(o => new Date(o.date) > new Date(new Date().setDate(new Date().getDate() - 7))).length,
    totalCustomers: customers.length,
    pendingShipments: orders.filter(o => o.status === OrderStatus.Processing).length,
  };

  return {
    isLoading,
    refreshData: fetchData, // Exposed for manual reload
    products, addProduct: productCrud.add, updateProduct: productCrud.update, deleteProduct: productCrud.delete,
    orders, updateOrder: orderCrud.update,
    customers,
    kpi,
    categories, addCategory: categoryCrud.add, updateCategory: categoryCrud.update, deleteCategory: categoryCrud.delete,
    brands, addBrand: brandCrud.add, updateBrand: brandCrud.update, deleteBrand: brandCrud.delete,
    models, addModel: modelCrud.add, updateModel: modelCrud.update, deleteModel: modelCrud.delete,
    materials, addMaterial: materialCrud.add, updateMaterial: materialCrud.update, deleteMaterial: materialCrud.delete,
    colors, addColor: colorCrud.add, updateColor: colorCrud.update, deleteColor: colorCrud.delete,
    coupons, addCoupon: couponCrud.add, updateCoupon: couponCrud.update, deleteCoupon: couponCrud.delete,
    reviews, addReview: reviewCrud.add, updateReview: reviewCrud.update, deleteReview: reviewCrud.delete,
    storeSettings, updateStoreSettings,
    addBanner: bannerCrud.add, updateBanner: bannerCrud.update, deleteBanner: bannerCrud.delete,
    analyticsData,
    analyticsPeriod, setAnalyticsPeriod,
  };
};
