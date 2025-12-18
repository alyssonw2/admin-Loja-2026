
export enum Page {
  Landing = 'Início',
  Register = 'Cadastro',
  CompleteSetup = 'Concluir Configuração',
  Login = 'Login',
  Dashboard = 'Dashboard',
  Chat = 'Chat',
  Products = 'Produtos',
  AddEditProduct = 'Adicionar/Editar Produto',
  Orders = 'Pedidos',
  OrderDetail = 'Detalhes do Pedido',
  AbandonedCarts = 'Carrinhos',
  Coupons = 'Cupons',
  Customers = 'Clientes',
  CustomerProfile = 'Perfil do Cliente',
  Reviews = 'Avaliações',
  Analytics = 'Análises',
  Settings = 'Configurações',
  MarketplaceMercadoLivre = 'Mercado Livre',
  Profile = 'Meu Perfil',
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
  password?: string;
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

export interface ProductMarker {
  id: string;
  x: number; // Porcentagem (0-100)
  y: number; // Porcentagem (0-100)
  description: string;
}

export interface ProductMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  order: number;
  markers?: ProductMarker[];
}

export interface ProductSize {
  name: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: string;
  promotionalPrice?: string;
  stock: string;
  sizes: ProductSize[];
  categoryId: string;
  brandId: string;
  modelId: string;
  materialId: string;
  colorId: string;
  media: ProductMedia[];
  description: string;
  condition: 'Novo' | 'Usado';
  status: 'Ativo' | 'Inativo';
  width: string;
  height: string;
  depth: string;
  weight: string;
  createdAt?: string;
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
  total: number | string;
  status: OrderStatus;
  origin: OrderOrigin;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number | string;
    imageUrl: string;
  }[];
  gatewayTransactionId: string;
  events: OrderEvent[];
  trackingCode?: string;
  invoiceUrl?: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number | string;
  imageUrl: string;
  size?: string;
}

export interface Cart {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  total: number | string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  totalSpent: number | string;
  avatarUrl: string;
  cpfCnpj?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contacts?: {
    phone?: string;
    whatsapp?: string;
  };
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
    headingFont: string;
    bodyFont: string;
  };
  banners: Banner[];
  infoPages: { about: string; howToBuy: string; returns: string; };
  email: { smtpHost: string; smtpPort: string; smtpUser: string; smtpPass: string; purchaseConfirmationBody: string; };
  connectivity: { whatsappPhone: string; whatsappStatus: 'Conectado' | 'Desconectado' | 'Conectando'; };
  socialMedia: { facebook: string; instagram: string; tiktok: string; youtube: string; };
  integrations: { 
    mercadoPagoPublicKey: string; 
    mercadoPagoToken: string; 
    mercadoPagoInstallmentsWithoutInterest: number;
    mercadoPagoInterestRate3to6: number;
    mercadoPagoInterestRate6to12: number;
    mercadoLivreUser: string; 
    mercadoLivreToken: string; 
    mercadoLivreStatus: 'Conectado' | 'Desconectado' | 'Conectando'; 
  };
  shipping: { melhorEnvioToken: string; additionalDays: number; additionalCost: number; freeShippingPolicy: { enabled: boolean; minValue: number; cities: string; }; };
  ai: { googleAiToken: string; assistantName: string; restrictions: string; trainingText: string; };
  seo: { googleAnalyticsId: string; googleMerchantCenterId: string; googleMyBusinessId: string; facebookXmlUrl: string; googleXmlUrl: string; customHeadScript: string; };
}

export enum CouponType {
  FirstPurchase = 'Primeira Compra',
  FreeShipping = 'Frete Grátis',
  Discount = 'Desconto',
  PixDiscount = 'Desconto no PIX',
}

export enum DiscountType {
  Percentage = 'Porcentagem',
  FixedAmount = 'Valor Fixo',
}

export interface Coupon {
    id: string;
    code: string;
    type: string | CouponType;
    discountType: string | DiscountType | null; 
    discountValue: string;
    minPurchaseValue: string;
    isActive: boolean;
}

export interface Review {
  id: string;
  customerName: string;
  customerPhotoUrl: string;
  rating: number;
  comment: string;
  date: string;
  orderId?: string;
}

export enum AnalyticsPeriod {
    CURRENT_WEEK = 'Semana Atual',
    LAST_WEEK = 'Última Semana',
    CURRENT_MONTH = 'Mês Atual',
    LAST_MONTH = 'Último Mês',
    YEAR = 'Ano Atual',
}

export interface Metric {
  value: number;
  change: number;
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
  metrics: { [key: string]: Metric };
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
  description?: string;
  sku?: string;
}
