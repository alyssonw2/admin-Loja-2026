
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product, Order, Customer, Category, Brand, Model, Material, StoreSettings, Banner, Coupon, AnalyticsData, Metric, AnalyticsChartDataPoint, Review, Color, Toast, ChannelDistributionChartDataPoint } from '../types';
import { OrderStatus, CouponType, DiscountType, AnalyticsPeriod, OrderOrigin } from '../types';
import { supabase } from '../services/supabaseClient';

interface UseMockDataProps {
  showToast: (message: string, type: Toast['type']) => void;
  isAuthenticated: boolean;
}

const DEFAULT_SETTINGS: StoreSettings = {
    storeName: "Minha Loja",
    domain: "",
    address: { 
        street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zipCode: "" 
    },
    branding: {
        logoUrl: "",
        primaryColor: "#6366f1",
        secondaryColor: "#ec4899",
        accentColor: "#f59e0b",
        backgroundColor: "#ffffff",
        textColor: "#1f2937",
        headerBackgroundColor: "#ffffff",
        headerTextColor: "#111827",
        footerBackgroundColor: "#111827",
        footerTextColor: "#f3f4f6"
    },
    banners: [],
    infoPages: { 
        about: "", howToBuy: "", returns: "" 
    },
    email: { 
        smtpHost: "", smtpPort: "", smtpUser: "", smtpPass: "", purchaseConfirmationBody: "Olá {{cliente}},\n\nObrigado pela sua compra! Seu pedido #{{pedido_id}} foi confirmado." 
    },
    connectivity: { 
        whatsappPhone: "", whatsappStatus: "Desconectado" 
    },
    socialMedia: { 
        facebook: "", instagram: "", tiktok: "", youtube: "" 
    },
    integrations: { 
        mercadoPagoPublicKey: "", mercadoPagoToken: "", mercadoLivreUser: "", mercadoLivreToken: "", mercadoLivreStatus: "Desconectado" 
    },
    shipping: { 
        melhorEnvioToken: "", additionalDays: 0, additionalCost: 0, freeShippingPolicy: { enabled: false, minValue: 0, cities: "" } 
    },
    ai: { 
        googleAiToken: "", assistantName: "Assistente", restrictions: "", trainingText: "" 
    },
    seo: { 
        googleAnalyticsId: "", googleMerchantCenterId: "", googleMyBusinessId: "", facebookXmlUrl: "", googleXmlUrl: "", customHeadScript: "" 
    }
};

export const useMockData = ({ showToast, isAuthenticated }: UseMockDataProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);

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

  // Default empty analytics data to prevent crashes before calculation
  const defaultAnalyticsData: AnalyticsData = {
    metrics: {
        accesses: { value: 0, change: 0 },
        sales: { value: 0, change: 0 },
        returns: { value: 0, change: 0 },
        newCustomers: { value: 0, change: 0 },
        whatsappContacts: { value: 0, change: 0 },
        couponsUsed: { value: 0, change: 0 },
        recurringCustomers: { value: 0, change: 0 }
    },
    chart: [],
    channelDistribution: []
  };

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // 1. Get Store
      let { data: store, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', user.id)
        .single();
      
      if (storeError && storeError.code === 'PGRST116') {
         // Fallback if trigger failed (though unlikely with proper schema setup)
         const { data: newStore } = await supabase.from('stores').insert({ 
             owner_id: user.id, 
             name: 'Minha Loja',
             settings: DEFAULT_SETTINGS
         }).select().single();
         store = newStore;
      }
      
      if (!store) throw new Error("Store not found");
      setStoreId(store.id);

      // 2. Fetch Catalogs
      const { data: cats } = await supabase.from('categories').select('*').eq('store_id', store.id);
      setCategories(cats?.map(c => ({ id: c.id, name: c.name, parentId: c.parent_id })) || []);

      const { data: brs } = await supabase.from('brands').select('*').eq('store_id', store.id);
      setBrands(brs || []);

      const { data: mods } = await supabase.from('models').select('*').eq('store_id', store.id);
      setModels(mods || []);

      const { data: mats } = await supabase.from('materials').select('*').eq('store_id', store.id);
      setMaterials(mats || []);

      const { data: cols } = await supabase.from('colors').select('*').eq('store_id', store.id);
      setColors(cols || []);

      // 3. Fetch Products
      const { data: prods } = await supabase.from('products').select('*').eq('store_id', store.id);
      setProducts(prods?.map(p => ({
          ...p,
          categoryId: p.category_id,
          brandId: p.brand_id,
          modelId: p.model_id,
          materialId: p.material_id,
          colorId: p.color_id,
          mercadoLivreStatus: p.mercado_livre_status,
          mercadoLivreUrl: p.mercado_livre_url
      })) || []);

      // 4. Fetch Customers
      const { data: custs } = await supabase.from('customers').select('*').eq('store_id', store.id);
      setCustomers(custs?.map(c => ({
          ...c,
          joinDate: c.join_date || c.created_at,
          totalSpent: c.total_spent,
          avatarUrl: c.avatar_url || `https://ui-avatars.com/api/?name=${c.name}&background=random`
      })) || []);

      // 5. Fetch Orders
      const { data: ords } = await supabase.from('orders').select('*').eq('store_id', store.id).order('created_at', { ascending: false });
      setOrders(ords?.map(o => ({
          ...o,
          customerId: o.customer_id,
          customerName: o.customer_name,
          customerEmail: o.customer_email,
          shippingAddress: o.shipping_address,
          trackingCode: o.tracking_code,
          invoiceUrl: o.invoice_url,
          gatewayTransactionId: o.gateway_transaction_id
      })) || []);

      // 6. Fetch Coupons
      const { data: cps } = await supabase.from('coupons').select('*').eq('store_id', store.id);
      setCoupons(cps?.map(c => ({
          ...c,
          discountType: c.discount_type,
          discountValue: c.discount_value,
          minPurchaseValue: c.min_purchase_value,
          isActive: c.is_active
      })) || []);

       // 7. Fetch Reviews
       const { data: revs } = await supabase.from('reviews').select('*').eq('store_id', store.id);
       setReviews(revs?.map(r => ({
           ...r,
           customerName: r.customer_name,
           customerPhotoUrl: r.customer_photo_url,
           orderId: r.order_id
       })) || []);
       
       // 8. Fetch Banners & Construct Settings
       const { data: bans } = await supabase.from('banners').select('*').eq('store_id', store.id);
       const mappedBanners = (bans || []).map(b => ({
            id: b.id,
            imageUrl: b.image_url,
            title: b.title,
            description: b.description,
            buttonText: b.button_text,
            buttonUrl: b.button_url
        }));

       // Merge DB settings with defaults to ensure robustness against partial JSON
       const dbSettings = store.settings || {};
       
       const fullSettings: StoreSettings = {
           ...DEFAULT_SETTINGS,
           ...dbSettings,
           address: { ...DEFAULT_SETTINGS.address, ...dbSettings.address },
           branding: { ...DEFAULT_SETTINGS.branding, ...dbSettings.branding },
           infoPages: { ...DEFAULT_SETTINGS.infoPages, ...dbSettings.infoPages },
           email: { ...DEFAULT_SETTINGS.email, ...dbSettings.email },
           connectivity: { ...DEFAULT_SETTINGS.connectivity, ...dbSettings.connectivity },
           socialMedia: { ...DEFAULT_SETTINGS.socialMedia, ...dbSettings.socialMedia },
           integrations: { ...DEFAULT_SETTINGS.integrations, ...dbSettings.integrations },
           shipping: { 
               ...DEFAULT_SETTINGS.shipping, 
               ...dbSettings.shipping,
               freeShippingPolicy: { ...DEFAULT_SETTINGS.shipping.freeShippingPolicy, ...dbSettings.shipping?.freeShippingPolicy }
           },
           ai: { ...DEFAULT_SETTINGS.ai, ...dbSettings.ai },
           seo: { ...DEFAULT_SETTINGS.seo, ...dbSettings.seo },
           // Always use banners from the separate table, overwriting any stale array in JSON
           banners: mappedBanners
       };
       
       setStoreSettings(fullSettings);

    } catch (error) {
        console.error("Failed to fetch data from Supabase", error);
        showToast('Falha ao carregar dados da loja.', 'error');
    } finally {
        setIsLoading(false);
    }
  }, [isAuthenticated, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Real-time Analytics Calculation ---
  const analyticsData = useMemo(() => {
      const now = new Date();
      let start: Date, end: Date, prevStart: Date, prevEnd: Date;
      let chartLabels: string[] = [];
      let groupKey: (d: Date) => string; // Function to get bucket key
      
      // Determine periods
      switch (analyticsPeriod) {
          case AnalyticsPeriod.CURRENT_WEEK:
              const day = now.getDay(); // 0 (Sun) - 6 (Sat)
              const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
              const monday = new Date(now.setDate(diff));
              monday.setHours(0,0,0,0);
              start = monday;
              end = new Date(monday); end.setDate(end.getDate() + 6); end.setHours(23,59,59,999);
              
              prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 7);
              prevEnd = new Date(end); prevEnd.setDate(prevEnd.getDate() - 7);
              
              chartLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
              groupKey = (d) => chartLabels[(d.getDay() + 6) % 7]; // Map Sun(0)->Dom(6), Mon(1)->Seg(0)
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
               // Similar to Current Month but shifted back
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
              
           default: // LAST_WEEK or others, fallback to current month logic for simplicity in this example
              start = new Date(now.getFullYear(), now.getMonth(), 1);
              end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
              prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
              chartLabels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'];
              groupKey = (d) => 'Sem 1';
      }

      const filterByDate = (items: any[], dateField: string, s: Date, e: Date) => 
        items.filter(i => {
            const d = new Date(i[dateField]);
            return d >= s && d <= e;
        });

      // Filter Data
      const currentOrders = filterByDate(orders, 'date', start, end);
      const prevOrders = filterByDate(orders, 'date', prevStart, prevEnd);
      const currentCustomers = filterByDate(customers, 'joinDate', start, end);
      const prevCustomers = filterByDate(customers, 'joinDate', prevStart, prevEnd);
      
      // Calculate Metrics
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
              change: 0 // Simplification
          },
          // Mocked values for data not in DB yet
          accesses: { value: Math.round(currentOrders.length * 25), change: 5 }, 
          whatsappContacts: { value: Math.round(currentOrders.filter(o => o.origin === OrderOrigin.Whatsapp).length * 1.5), change: 2 },
          couponsUsed: { value: currentOrders.length > 5 ? Math.round(currentOrders.length * 0.2) : 0, change: 0 },
          recurringCustomers: { value: 15, change: 1.2 }
      };

      // Calculate Chart Data
      const chartMap = new Map<string, { atual: number, anterior: number }>();
      chartLabels.forEach(l => chartMap.set(l, { atual: 0, anterior: 0 }));

      currentOrders.forEach(o => {
          const key = groupKey(new Date(o.date));
          const entry = chartMap.get(key);
          if (entry) entry.atual += o.total;
      });

      prevOrders.forEach(o => {
          const key = groupKey(new Date(o.date)); // Logic implies parallel periods (e.g., 1st Monday of this month vs 1st Monday of last)
          // For months, dates align (1st to 1st). For weeks, we just map index 0 to 0.
          // Simple mapping for 'Anterior' curve on same axis:
          const prevD = new Date(o.date);
          let prevKey = '';
          
          if(analyticsPeriod === AnalyticsPeriod.CURRENT_WEEK || analyticsPeriod === AnalyticsPeriod.LAST_WEEK) {
             // Map previous week Mon to 'Seg', Tue to 'Ter'...
             prevKey = chartLabels[(prevD.getDay() + 6) % 7];
          } else if (analyticsPeriod === AnalyticsPeriod.YEAR) {
             prevKey = chartLabels[prevD.getMonth()];
          } else {
             // Month weeks
             const date = prevD.getDate();
             if(date <= 7) prevKey = 'Sem 1';
             else if(date <= 14) prevKey = 'Sem 2';
             else if(date <= 21) prevKey = 'Sem 3';
             else if(date <= 28) prevKey = 'Sem 4';
             else prevKey = 'Sem 5';
          }

          const entry = chartMap.get(prevKey);
          if (entry) entry.anterior += o.total;
      });

      const chart: AnalyticsChartDataPoint[] = chartLabels.map(label => ({
          name: label,
          atual: parseFloat(chartMap.get(label)!.atual.toFixed(2)),
          anterior: parseFloat(chartMap.get(label)!.anterior.toFixed(2))
      }));

      // Calculate Channel Distribution
      const channelMap = new Map<OrderOrigin, number>();
      currentOrders.forEach(o => {
          channelMap.set(o.origin, (channelMap.get(o.origin) || 0) + 1);
      });
      
      // Ensure all channels are present or handle in chart
      const channelDistribution: ChannelDistributionChartDataPoint[] = [
          { name: OrderOrigin.Site, value: channelMap.get(OrderOrigin.Site) || 0 },
          { name: OrderOrigin.MercadoLivre, value: channelMap.get(OrderOrigin.MercadoLivre) || 0 },
          { name: OrderOrigin.Whatsapp, value: channelMap.get(OrderOrigin.Whatsapp) || 0 },
      ].filter(d => d.value > 0);

      if (channelDistribution.length === 0) {
           // Fallback to avoid empty chart crash
           channelDistribution.push({ name: OrderOrigin.Site, value: 0 });
      }

      return { metrics, chart, channelDistribution };

  }, [orders, customers, analyticsPeriod]); // Re-calculate when these change


  // Generic Helpers for Supabase
  const addEntity = async (table: string, data: any, mapResponse: (res: any) => any, stateSetter: React.Dispatch<React.SetStateAction<any[]>>) => {
      if(!storeId) return;
      const { data: inserted, error } = await supabase.from(table).insert({...data, store_id: storeId}).select().single();
      if(error) {
          showToast(`Erro ao adicionar ${table}.`, 'error');
          console.error(error);
          return;
      }
      stateSetter(prev => [...prev, mapResponse(inserted)]);
      showToast('Item adicionado com sucesso!', 'success');
  };

  const updateEntity = async (table: string, id: string, data: any, mapResponse: (res: any) => any, stateSetter: React.Dispatch<React.SetStateAction<any[]>>) => {
      const { data: updated, error } = await supabase.from(table).update(data).eq('id', id).select().single();
      if(error) {
          showToast(`Erro ao atualizar ${table}.`, 'error');
          console.error(error);
          return;
      }
      stateSetter(prev => prev.map(i => i.id === id ? mapResponse(updated) : i));
      showToast('Item atualizado com sucesso!', 'success');
  };

  const deleteEntity = async (table: string, id: string, stateSetter: React.Dispatch<React.SetStateAction<any[]>>) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if(error) {
          showToast(`Erro ao excluir ${table}.`, 'error');
           console.error(error);
          return;
      }
      stateSetter(prev => prev.filter(i => i.id !== id));
      showToast('Item excluído com sucesso!', 'success');
  };

  // Mappers
  const mapProduct = (p: any) => ({
      ...p,
      categoryId: p.category_id,
      brandId: p.brand_id,
      modelId: p.model_id,
      materialId: p.material_id,
      colorId: p.color_id,
      mercadoLivreStatus: p.mercado_livre_status,
      mercadoLivreUrl: p.mercado_livre_url
  });

  const productCrud = {
      add: (item: Omit<Product, 'id'>) => {
          const { categoryId, brandId, modelId, materialId, colorId, mercadoLivreStatus, mercadoLivreUrl, ...rest } = item;
          const dbPayload = {
              ...rest,
              category_id: categoryId,
              brand_id: brandId,
              model_id: modelId,
              material_id: materialId,
              color_id: colorId,
              mercado_livre_status: mercadoLivreStatus,
              mercado_livre_url: mercadoLivreUrl
          };
          addEntity('products', dbPayload, mapProduct, setProducts);
      },
      update: (item: Product) => {
           const { id, categoryId, brandId, modelId, materialId, colorId, mercadoLivreStatus, mercadoLivreUrl, ...rest } = item;
           const dbPayload = {
              ...rest,
              category_id: categoryId,
              brand_id: brandId,
              model_id: modelId,
              material_id: materialId,
              color_id: colorId,
              mercado_livre_status: mercadoLivreStatus,
              mercado_livre_url: mercadoLivreUrl
          };
          updateEntity('products', id, dbPayload, mapProduct, setProducts);
      },
      delete: (id: string) => deleteEntity('products', id, setProducts)
  };

  const orderCrud = {
      update: (item: Order) => {
          // Flatten complex fields for DB if needed, but JSONB handles objects fine
          const { id, customerId, customerName, customerEmail, shippingAddress, trackingCode, invoiceUrl, gatewayTransactionId, ...rest } = item;
           const dbPayload = {
              ...rest,
              customer_id: customerId,
              customer_name: customerName,
              customer_email: customerEmail,
              shipping_address: shippingAddress,
              tracking_code: trackingCode,
              invoice_url: invoiceUrl,
              gateway_transaction_id: gatewayTransactionId
          };
          updateEntity('orders', id, dbPayload, (o) => ({
            ...o,
             customerId: o.customer_id,
             customerName: o.customer_name,
             customerEmail: o.customer_email,
             shippingAddress: o.shipping_address,
             trackingCode: o.tracking_code,
             invoiceUrl: o.invoice_url,
             gatewayTransactionId: o.gateway_transaction_id
          }), setOrders);
      }
  };

  const catMapper = (c: any) => ({ id: c.id, name: c.name, parentId: c.parent_id });
  const categoryCrud = {
      add: (item: Omit<Category, 'id'>) => addEntity('categories', { name: item.name, parent_id: item.parentId }, catMapper, setCategories),
      update: (item: Category) => updateEntity('categories', item.id, { name: item.name, parent_id: item.parentId }, catMapper, setCategories),
      delete: (id: string) => deleteEntity('categories', id, setCategories)
  };

  const simpleMapper = (i: any) => i;
  const brandCrud = {
      add: (item: Omit<Brand, 'id'>) => addEntity('brands', item, simpleMapper, setBrands),
      update: (item: Brand) => updateEntity('brands', item.id, item, simpleMapper, setBrands),
      delete: (id: string) => deleteEntity('brands', id, setBrands)
  };
  const modelCrud = {
      add: (item: Omit<Model, 'id'>) => addEntity('models', item, simpleMapper, setModels),
      update: (item: Model) => updateEntity('models', item.id, item, simpleMapper, setModels),
      delete: (id: string) => deleteEntity('models', id, setModels)
  };
  const materialCrud = {
      add: (item: Omit<Material, 'id'>) => addEntity('materials', item, simpleMapper, setMaterials),
      update: (item: Material) => updateEntity('materials', item.id, item, simpleMapper, setMaterials),
      delete: (id: string) => deleteEntity('materials', id, setMaterials)
  };
  const colorCrud = {
      add: (item: Omit<Color, 'id'>) => addEntity('colors', item, simpleMapper, setColors),
      update: (item: Color) => updateEntity('colors', item.id, item, simpleMapper, setColors),
      delete: (id: string) => deleteEntity('colors', id, setColors)
  };

  const couponMapper = (c: any) => ({
      ...c,
      discountType: c.discount_type,
      discountValue: c.discount_value,
      minPurchaseValue: c.min_purchase_value,
      isActive: c.is_active
  });
  const couponCrud = {
      add: (item: Omit<Coupon, 'id'>) => {
         const { discountType, discountValue, minPurchaseValue, isActive, ...rest } = item;
         addEntity('coupons', { ...rest, discount_type: discountType, discount_value: discountValue, min_purchase_value: minPurchaseValue, is_active: isActive }, couponMapper, setCoupons);
      },
      update: (item: Coupon) => {
         const { id, discountType, discountValue, minPurchaseValue, isActive, ...rest } = item;
         updateEntity('coupons', id, { ...rest, discount_type: discountType, discount_value: discountValue, min_purchase_value: minPurchaseValue, is_active: isActive }, couponMapper, setCoupons);
      },
      delete: (id: string) => deleteEntity('coupons', id, setCoupons)
  };

  const reviewMapper = (r: any) => ({ ...r, customerName: r.customer_name, customerPhotoUrl: r.customer_photo_url, orderId: r.order_id });
  const reviewCrud = {
      add: (item: Omit<Review, 'id'>) => {
         const { customerName, customerPhotoUrl, orderId, ...rest } = item;
         addEntity('reviews', { ...rest, customer_name: customerName, customer_photo_url: customerPhotoUrl, order_id: orderId }, reviewMapper, setReviews);
      },
      update: (item: Review) => {
         const { id, customerName, customerPhotoUrl, orderId, ...rest } = item;
         updateEntity('reviews', id, { ...rest, customer_name: customerName, customer_photo_url: customerPhotoUrl, order_id: orderId }, reviewMapper, setReviews);
      },
      delete: (id: string) => deleteEntity('reviews', id, setReviews)
  };

  const updateStoreSettings = async (newSettings: StoreSettings) => {
    if(!storeId) return;
    const { error } = await supabase.from('stores').update({ settings: newSettings }).eq('id', storeId);
    if(error) {
         showToast('Erro ao salvar configurações.', 'error');
    } else {
        setStoreSettings(newSettings);
        showToast('Configurações salvas com sucesso!', 'success');
    }
  };

  const bannerCrud = {
      add: (item: Omit<Banner, 'id'>) => {
          const { imageUrl, buttonText, buttonUrl, ...rest } = item;
          addEntity('banners', {...rest, image_url: imageUrl, button_text: buttonText, button_url: buttonUrl }, 
          (b) => ({id: b.id, imageUrl: b.image_url, title: b.title, description: b.description, buttonText: b.button_text, buttonUrl: b.button_url}), 
          // We don't have a direct state for banners array, we update store settings
          (newBanners) => {
             // Fetch all banners again to be safe and update settings
             fetchData(); 
             // Returning placeholder
             return [];
          });
      },
      update: (item: Banner) => {
         const { id, imageUrl, buttonText, buttonUrl, ...rest } = item;
         updateEntity('banners', id, {...rest, image_url: imageUrl, button_text: buttonText, button_url: buttonUrl }, 
          (b) => ({id: b.id, imageUrl: b.image_url, title: b.title, description: b.description, buttonText: b.button_text, buttonUrl: b.button_url}),
          () => { fetchData(); return []; });
      },
      delete: async (id: string) => {
          await deleteEntity('banners', id, () => []);
          fetchData();
      }
  };

  // KPI Calculation (client side aggregation for now)
  const kpi = {
    totalSales: orders.reduce((sum, order) => (order.status === OrderStatus.Delivered ? sum + order.total : sum), 0),
    newOrders: orders.filter(o => new Date(o.date) > new Date(new Date().setDate(new Date().getDate() - 7))).length,
    totalCustomers: customers.length,
    pendingShipments: orders.filter(o => o.status === OrderStatus.Processing).length,
  };

  return {
    isLoading,
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
    analyticsData: analyticsData,
    analyticsPeriod, setAnalyticsPeriod,
  };
};
