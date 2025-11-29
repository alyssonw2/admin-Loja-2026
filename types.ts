

export enum Page {
  Dashboard = 'Dashboard',
  Chat = 'Chat',
  Products = 'Produtos',
  AddEditProduct = 'Adicionar/Editar Produto',
  Orders = 'Pedidos',
  OrderDetail = 'Detalhes do Pedido',
  Coupons = 'Cupons',
  Customers = 'Clientes',
  CustomerProfile = 'Perfil do Cliente',
  Reviews = 'Avaliações',
  Analytics = 'Análises',
  Settings = 'Configurações',
  MarketplaceMercadoLivre = 'Mercado Livre',
}

export enum OrderStatus {
  Pending = 'Pendente',
  Processing = 'Processando',
  Shipped = 'Enviado',
  Delivered = 'Entregue',
  Canceled = 'Cancelado',
}

export enum OrderOrigin {
  Site = 'Site',
  MercadoLivre = 'Mercado Livre',
  Whatsapp = 'Whatsapp',
}

export interface User {
  id: number;
  username: string;
  password?: string; // Should be a hash in a real app
  name: string;
  email: string;
  avatarUrl: string;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
}

export interface Brand {
  id: string;
  name: string;
}

export interface Model {
  id: string;
  name: string;
}

export interface Material {
  id: string;
  name: string;
}

export interface Color {
  id: string;
  name: string;
  hex: string;
}

export interface ProductMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  order: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  categoryId: string;
  brandId: string;
  modelId: string;
  materialId: string;
  colorId: string;
  media: ProductMedia[];
  description: string;
  status: 'Ativo' | 'Inativo';
  width: number;
  height: number;
  depth: number;
  weight: number;
  mercadoLivreStatus?: 'published' | 'pending' | 'error';
  mercadoLivreUrl?: string;
}

export interface OrderEvent {
  timestamp: string;
  status: OrderStatus;
  description: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerId: string;
  shippingAddress: string;
  date: string;
  total: number;
  status: OrderStatus;
  origin: OrderOrigin;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    imageUrl: string;
  }[];
  gatewayTransactionId: string;
  events: OrderEvent[];
  trackingCode?: string;
  invoiceUrl?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  totalSpent: number;
  avatarUrl: string;
}

export interface ChatConversation {
  id: string;
  contactName: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatarUrl: string;
}

export interface ChatMessage {
  id: string;
  sender: 'admin' | 'user';
  text: string;
  timestamp: string;
}

export interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
}

interface FreeShippingPolicy {
  enabled: boolean;
  minValue: number;
  cities: string;
}

interface ShippingSettings {
  melhorEnvioToken: string;
  additionalDays: number;
  additionalCost: number;
  freeShippingPolicy: FreeShippingPolicy;
}

export interface SeoSettings {
  googleAnalyticsId: string;
  googleMerchantCenterId: string;
  googleMyBusinessId: string;
  facebookXmlUrl: string;
  googleXmlUrl: string;
  customHeadScript: string;
}

export interface StoreSettings {
  storeName: string;
  domain: string;
  address: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  branding: {
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    headerBackgroundColor: string;
    headerTextColor: string;
    footerBackgroundColor: string;
    footerTextColor: string;
  };
  banners: Banner[];
  infoPages: {
    about: string;
    howToBuy: string;
    returns: string;
  };
  email: {
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPass: string;
    purchaseConfirmationBody: string;
  };
  connectivity: {
    whatsappPhone: string;
    whatsappStatus: 'Conectado' | 'Desconectado' | 'Conectando';
  };
  socialMedia: {
    facebook: string;
    instagram: string;
    tiktok: string;
    youtube: string;
  };
  integrations: {
    mercadoPagoPublicKey: string;
    mercadoPagoToken: string;
    mercadoLivreUser: string;
    mercadoLivreToken: string;
    mercadoLivreStatus: 'Conectado' | 'Desconectado' | 'Conectando';
  };
  shipping: ShippingSettings;
  ai: {
    googleAiToken: string;
    assistantName: string;
    restrictions: string;
    trainingText: string;
  };
  seo: SeoSettings;
}

export enum CouponType {
    FirstPurchase = 'Primeira Compra',
    PixDiscount = 'Desconto no PIX',
    FreeShipping = 'Frete Grátis',
    ProductDiscount = 'Desconto em Produto',
}

export enum DiscountType {
    Percentage = 'Porcentagem',
    FixedAmount = 'Valor Fixo',
}

export interface Coupon {
    id: string;
    code: string;
    type: CouponType;
    discountType: DiscountType | null; 
    discountValue: number;
    minPurchaseValue: number;
    isActive: boolean;
}

export interface Review {
  id: string;
  customerName: string;
  customerPhotoUrl: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  orderId?: string;
}

// Analytics Types
export enum AnalyticsPeriod {
    CURRENT_WEEK = 'Semana Atual',
    LAST_WEEK = 'Última Semana',
    CURRENT_MONTH = 'Mês Atual',
    LAST_MONTH = 'Último Mês',
    YEAR = 'Ano Atual',
}

export interface Metric {
  value: number;
  change: number; // percentage
}

export interface AnalyticsMetrics {
  accesses: Metric;
  sales: Metric;
  returns: Metric;
  newCustomers: Metric;
  whatsappContacts: Metric;
  couponsUsed: Metric;
  recurringCustomers: Metric;
}

export interface AnalyticsChartDataPoint {
  name: string;
  atual: number;
  anterior: number;
}

export interface ChannelDistributionChartDataPoint {
  name: OrderOrigin;
  value: number;
}

export interface AnalyticsData {
  metrics: AnalyticsMetrics;
  chart: AnalyticsChartDataPoint[];
  channelDistribution: ChannelDistributionChartDataPoint[];
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'chat' | 'error';
}

export interface WhatsAppProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}