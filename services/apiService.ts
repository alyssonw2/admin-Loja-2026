
import type { User, StoreSettings } from "../types";
import { mockData } from '../data/mockData';

const API_URL = "https://macintosh-designated-flashers-founder.trycloudflare.com";
const ADMIN_EMAIL = "";
const ADMIN_PASS = "";
const TABLE_PREFIX = "loja_";

// --- Internal Types ---
interface TableSchema {
    tableName: string;
    fields: Record<string, string>;
}

// --- System Schemas (DB uses snake_case) ---
const REQUIRED_TABLES: TableSchema[] = [
    {
        tableName: `${TABLE_PREFIX}stores`,
        fields: {
            "name": "string|required",
            "email": "string|email|required",
            "password": "string",
            "cnpj": "string",
            "zipCode": "string",
            "address_street": "string",
            "address_number": "string",
            "address_city": "string",
            "address_state": "string",
            "domain": "string",
            "primary_color": "string",
            "secondary_color": "string",
            "whatsapp": "string",
            "status": "string"
        }
    },
    // --- New Specific Table for Store Settings (Loja Tab) ---
    { 
        tableName: `${TABLE_PREFIX}store_settings`, 
        fields: { "config": "json", "store_id": "string|required" } 
    },
    // --- Config Tables (Separated by Tab) ---
    { tableName: `${TABLE_PREFIX}cfg_general`, fields: { "config": "json", "store_id": "string|required" } },
    { tableName: `${TABLE_PREFIX}cfg_branding`, fields: { "config": "json", "store_id": "string|required" } },
    { tableName: `${TABLE_PREFIX}cfg_emails`, fields: { "config": "json", "store_id": "string|required" } },
    { tableName: `${TABLE_PREFIX}cfg_infos`, fields: { "config": "json", "store_id": "string|required" } },
    { tableName: `${TABLE_PREFIX}cfg_seos`, fields: { "config": "json", "store_id": "string|required" } },
    { tableName: `${TABLE_PREFIX}cfg_connectivities`, fields: { "config": "json", "store_id": "string|required" } },
    { tableName: `${TABLE_PREFIX}cfg_socials`, fields: { "config": "json", "store_id": "string|required" } },
    { tableName: `${TABLE_PREFIX}cfg_integrations`, fields: { "config": "json", "store_id": "string|required" } },
    { tableName: `${TABLE_PREFIX}cfg_mercadopago`, fields: { "config": "json", "store_id": "string|required" } },
    { tableName: `${TABLE_PREFIX}cfg_shippings`, fields: { "config": "json", "store_id": "string|required" } },
    { tableName: `${TABLE_PREFIX}cfg_ai`, fields: { "config": "json", "store_id": "string|required" } },
    // --- Business Data Tables ---
    {
        tableName: `${TABLE_PREFIX}products`,
        fields: {
            "name": "string",
            "sku": "string",
            "price": "string",
            "promotional_price": "string",
            "stock": "string",
            "sizes": "json",
            "category_id": "string",
            "brand_id": "string",
            "model_id": "string",
            "material_id": "string",
            "color_id": "string",
            "description": "string",
            "status": "string",
            "width": "string",
            "height": "string",
            "depth": "string",
            "weight": "string",
            "media": "json",
            "created_at": "string",
            "mercado_livre_status": "string",
            "mercado_livre_url": "string",
            "store_id": "string|uuid|required"
        }
    },
    {
        tableName: `${TABLE_PREFIX}categories`,
        fields: {
            "name": "string",
            "parent_id": "string",
            "store_id": "string|required"
        }
    },
    {
        tableName: `${TABLE_PREFIX}brands`,
        fields: {
            "name": "string",
            "store_id": "string|required"
        }
    },
    {
        tableName: `${TABLE_PREFIX}models`,
        fields: {
            "name": "string",
            "store_id": "string"
        }
    },
    {
        tableName: `${TABLE_PREFIX}materials`,
        fields: {
            "name": "string",
            "store_id": "string|required"
        }
    },
    {
        tableName: `${TABLE_PREFIX}colors`,
        fields: {
            "name": "string",
            "hex": "string",
            "store_id": "string|required"
        }
    },
    {
        tableName: `${TABLE_PREFIX}orders`,
        fields: {
            "customer_name": "string",
            "customer_email": "string",
            "customer_id": "string",
            "shipping_address": "string",
            "date": "string",
            "total": "string",
            "status": "string",
            "origin": "string",
            "items": "string",
            "events": "string",
            "gateway_transaction_id": "string",
            "tracking_code": "string",
            "invoice_url": "string",
            "store_id": "string|required"
        }
    },
    {
        tableName: `${TABLE_PREFIX}customers`,
        fields: {
            "name": "string",
            "email": "string",
            "join_date": "string",
            "total_spent": "string",
            "avatar_url": "string",
            "store_id": "string|required",
            "cpf_cnpj": "string",
            "addres": "json",
            "contacts": "json"
        }
    },
    {
        tableName: `${TABLE_PREFIX}coupons`,
        fields: {
            "code": "string|required",
            "type": "string",
            "discount_type": "string",
            "discount_value": "string",
            "min_purchase_value": "string",
            "is_active": "boolean",
            "store_id": "string|required"
        }
    },
    {
        tableName: `${TABLE_PREFIX}reviews`,
        fields: {
            "customer_name": "string",
            "customer_photo_url": "string",
            "rating": "string",
            "comment": "string",
            "date": "string",
            "order_id": "string",
            "store_id": "string|required"
        }
    },
    {
        tableName: `${TABLE_PREFIX}banners`,
        fields: {
            "image_url": "string",
            "title": "string",
            "description": "string",
            "button_text": "string",
            "button_url": "string",
            "store_id": "string|required"
        }
    }
];

// --- Mappers ---

const FIELD_MAP: Record<string, Record<string, string>> = {
    'products': {
        promotionalPrice: 'promotional_price',
        categoryId: 'category_id',
        brandId: 'brand_id',
        modelId: 'model_id',
        materialId: 'material_id',
        colorId: 'color_id',
        createdAt: 'created_at',
        mercadoLivreStatus: 'mercado_livre_status',
        mercadoLivreUrl: 'mercado_livre_url'
    },
    'categories': {
        parentId: 'parent_id'
    },
    'orders': {
        customerName: 'customer_name',
        customerEmail: 'customer_email',
        customerId: 'customer_id',
        shippingAddress: 'shipping_address',
        gatewayTransactionId: 'gateway_transaction_id',
        trackingCode: 'tracking_code',
        invoiceUrl: 'invoice_url'
    },
    'customers': {
        joinDate: 'join_date',
        totalSpent: 'total_spent',
        avatarUrl: 'avatar_url',
        cpfCnpj: 'cpf_cnpj',
        address: 'addres', // Map typescript 'address' to db 'addres'
        contacts: 'contacts'
    },
    'coupons': {
        discountType: 'discount_type',
        discountValue: 'discount_value',
        minPurchaseValue: 'min_purchase_value',
        isActive: 'is_active'
    },
    'reviews': {
        customerName: 'customer_name',
        customerPhotoUrl: 'customer_photo_url',
        orderId: 'order_id'
    },
    'banners': {
        imageUrl: 'image_url',
        buttonText: 'button_text',
        buttonUrl: 'button_url'
    }
};

const mapToDb = (table: string, data: any): any => {
    const map = FIELD_MAP[table];
    if (!map) return data;
    
    const newData: any = {};
    for (const key in data) {
        const dbKey = map[key] || key;
        newData[dbKey] = data[key];
    }
    return newData;
};

const mapFromDb = (table: string, data: any): any => {
    const map = FIELD_MAP[table];
    if (!map) return data;
    
    const reverseMap: Record<string, string> = {};
    for(const key in map) reverseMap[map[key]] = key;

    const newData: any = {};
    for (const key in data) {
        const appKey = reverseMap[key] || key;
        newData[appKey] = data[key];
    }
    return newData;
};


// --- Helpers ---

const getToken = () => localStorage.getItem('auth_token');
const setToken = (token: string) => localStorage.setItem('auth_token', token);

const headers = (overrideToken?: string) => {
    const h: HeadersInit = { 'Content-Type': 'application/json' };
    const token = overrideToken || getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
};

const getStoreId = () => {
    const token = getToken();
    if (!token) return null;
    try {
        const data = JSON.parse(atob(token));
        return data.id;
    } catch {
        return null;
    }
};

const mockDelay = () => new Promise(resolve => setTimeout(resolve, 500));

// --- Core API Methods ---

async function request<T>(endpoint: string, options: RequestInit = {}, overrideToken?: string): Promise<T> {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: { ...headers(overrideToken), ...options.headers }
        });

        if (!response.ok) {
            // Include status text in error message for better debugging
            throw { status: response.status, message: `${response.statusText} (${response.status})` };
        }

        const text = await response.text();
        return text ? JSON.parse(text) : null;

    } catch (error: any) {
        // Re-throw with a cleaner structure if possible, or just the error
        throw error;
    }
}

// --- Helper to Upsert Config Tables (Generic) ---
// This function implements the logic: Check Exists -> Update or Create
const upsertTableConfig = async (tableName: string, configData: any, storeId: string) => {
    const encodedStoreId = encodeURIComponent(storeId);
    
    try {
        // 1. Verifique se existe um registro para esta loja
        let existing: any[] = [];
        try {
            const response = await request<any>(`/db/${tableName}?store_id=${encodedStoreId}&limit=1`);
            // Handle different potential response structures (array directly or data property)
            if (Array.isArray(response)) {
                existing = response;
            } else if (response && response.data && Array.isArray(response.data)) {
                 existing = response.data;
            }
        } catch (e: any) {
             // 404 is expected if table doesn't exist or empty query
        }
        
        const payload = {
            config: configData,
            store_id: storeId
        };

        if (existing && existing.length > 0) {
            // 2. Se sim, atualize o registro com os novos dados
            const id = existing[0].id;
            console.log(`[API] Updating config for ${tableName} (ID: ${id})`);
            await request(`/db/${tableName}/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            // 3. Se não existir, crie um registro
            console.log(`[API] Creating new config record for ${tableName}`);
            await request(`/db/${tableName}`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }
    } catch (e: any) {
        console.warn(`[API] Failed to save config for ${tableName}. Using local state.`, e);
    }
};

// Legacy/Compatibility wrapper for existing cfg_ tables
// Example: upsertConfig('branding', ...) saves to loja_cfg_branding
const upsertConfig = async (tableNameSuffix: string, configData: any, storeId: string) => {
    const tableName = `${TABLE_PREFIX}cfg_${tableNameSuffix}`;
    await upsertTableConfig(tableName, configData, storeId);
};

// Generic Fetch Config
const fetchTableConfig = async (tableName: string, storeId: string): Promise<any | null> => {
    try {
        const encodedStoreId = encodeURIComponent(storeId);
        const res = await request<any>(`/db/${tableName}?store_id=${encodedStoreId}&limit=1`);
        
        let data: any = null;
        if (Array.isArray(res) && res.length > 0) data = res[0];
        else if (res && res.data && Array.isArray(res.data) && res.data.length > 0) data = res.data[0];

        if (data) {
            return typeof data.config === 'string' ? JSON.parse(data.config) : data.config;
        }
        return null;
    } catch (e) {
        return null;
    }
};

// Legacy/Compatibility wrapper
const fetchConfig = async (tableNameSuffix: string, storeId: string): Promise<any | null> => {
    const tableName = `${TABLE_PREFIX}cfg_${tableNameSuffix}`;
    return await fetchTableConfig(tableName, storeId);
};


// --- Internal Init ---

const initializeDatabase = async () => {
    try {
        // 1. Login Admin
        const data = await request<{token: string}>(`/db/login/adminlogin`, {
            method: 'POST',
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
        });
        const systemToken = data.token;

        // 2. Create Tables
        for (const schema of REQUIRED_TABLES) {
            try {
                 await request(`/db/create-table`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${systemToken}` }, 
                    body: JSON.stringify(schema)
                }, systemToken);
            } catch (e) {
                // Ignore if table already exists
            }
        }
    } catch (e) {
        console.log("Database initialization skipped (API offline or Unauthorized). Using local mock data.");
    }
}

// --- Auth & Initialization ---

export const loginPanelUser = async (email: string, password: string, rememberMe: boolean = false): Promise<User> => {
    try {
        const query = new URLSearchParams({ email, password }).toString();
        const stores = await request<any[]>(`/db/${TABLE_PREFIX}stores?${query}`);

        if (!stores || stores.length === 0) {
            throw new Error("E-mail ou senha inválidos.");
        }

        const store = stores[0];
        const sessionToken = btoa(JSON.stringify({ id: store.id, email: store.email, ts: Date.now() }));
        setToken(sessionToken); 

        return {
            id: store.id,
            username: store.name,
            name: store.name,
            email: store.email,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name)}&background=random`
        };
    } catch (error: any) {
        console.warn("Login via API failed, checking mock users.", error.message || error);
        await mockDelay();
        const user = mockData.users.find(u => u.email === email && u.password === password);
        if (user) {
             const sessionToken = btoa(JSON.stringify({ id: user.id, email: user.email, ts: Date.now() }));
             setToken(sessionToken);
             return {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl
             };
        }
        throw error;
    }
};

export const registerStore = async (storeData: any): Promise<{id: number | string}> => {
    try {
        await initializeDatabase();
        const payload = {
            name: storeData.name,
            email: storeData.email,
            password: storeData.password,
            cnpj: storeData.cnpj,
            zipCode: storeData.zipCode,
            status: storeData.status || 'pending'
        };
        return await request<{id: number | string}>(`/db/${TABLE_PREFIX}stores`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.warn("Registro API falhou, usando simulação.", e);
        await mockDelay();
        return { id: Math.floor(Math.random() * 1000) };
    }
};

export const authenticateAndInitializeSystem = async (setBootMessage: (message: string) => void) => {
    setBootMessage('Verificando conexão e banco de dados...');
    await initializeDatabase();
    const existingToken = getToken();
    if (existingToken) {
        setBootMessage('Sessão restaurada.');
        return;
    }
    setBootMessage('Pronto para login.');
};

// --- Generic CRUD ---

export const db = {
    getAll: async <T>(table: string, params: string = ''): Promise<T[]> => {
        try {
            const storeId = getStoreId();
            let query = params;
            if (table !== 'stores' && storeId) {
                const searchParams = new URLSearchParams(params);
                searchParams.append('store_id', storeId);
                query = searchParams.toString();
            }
            const res = await request<any>(`/db/${TABLE_PREFIX}${table}?${query}`);
            let data: any[] = [];
            if (Array.isArray(res)) data = res;
            else if (res && Array.isArray(res.data)) data = res.data;
            return data.map(item => mapFromDb(table, item));
        } catch (e: any) {
            await mockDelay();
            const data = (mockData as any)[table] || [];
            return data as T[];
        }
    },
    create: async <T>(table: string, data: any): Promise<T> => {
        try {
            const storeId = getStoreId();
            const payload = mapToDb(table, data);
            delete payload.id;
            delete payload._id;
            if (table !== 'stores' && storeId) payload.store_id = storeId;
            
            // --- DEBUG LOG START ---
            console.group(`[API] Creating Record in ${TABLE_PREFIX}${table}`);
            console.log('Original Data:', data);
            console.log('Mapped Payload:', payload);
            console.log('Store ID:', storeId);
            console.groupEnd();
            // --- DEBUG LOG END ---

            const res = await request<T>(`/db/${TABLE_PREFIX}${table}`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            return mapFromDb(table, res);
        } catch (e) {
            console.error(`[API] Error creating record in ${table}`, e);
            await mockDelay();
            return { ...data, id: `mock-${Date.now()}` } as T;
        }
    },
    update: async <T>(table: string, id: string | number, data: any): Promise<T> => {
        try {
            const storeId = getStoreId();
            const payload = mapToDb(table, data);
            delete payload.id;
            delete payload._id;
            if (table !== 'stores' && storeId) payload.store_id = storeId;
            const res = await request<T>(`/db/${TABLE_PREFIX}${table}/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            return mapFromDb(table, res);
        } catch (e) {
            await mockDelay();
            return { ...data, id } as T;
        }
    },
    delete: async (table: string, id: string | number): Promise<void> => {
        try {
            await request(`/db/${TABLE_PREFIX}${table}/${id}`, { method: 'DELETE' });
        } catch (e) {
            await mockDelay();
        }
    },
    
    // --- Specialized Settings Methods ---
    getSettings: async (): Promise<StoreSettings | null> => {
        try {
            const storeId = getStoreId();
            if (!storeId) return null;
            
            console.log(`Loading split configuration settings for store: ${storeId}`);

            // Fetch all sections in parallel
            const [
                storeSettingsData, // General Store Settings (loja_store_settings)
                branding, 
                email, 
                info, 
                seo, 
                connectivity, 
                social, 
                integrations, // Generic integrations (ML, etc.)
                mercadopago,  // Specific MP data
                shipping, 
                ai
            ] = await Promise.all([
                fetchTableConfig(`${TABLE_PREFIX}store_settings`, storeId),
                fetchConfig('branding', storeId),
                // Using specific plural table for emails
                fetchTableConfig(`${TABLE_PREFIX}cfg_emails`, storeId), 
                // Changed to plural table for infos
                fetchTableConfig(`${TABLE_PREFIX}cfg_infos`, storeId),
                // Changed to plural table for seos
                fetchTableConfig(`${TABLE_PREFIX}cfg_seos`, storeId),
                // Changed to plural table for connectivities
                fetchTableConfig(`${TABLE_PREFIX}cfg_connectivities`, storeId),
                // Changed to plural table for socials
                fetchTableConfig(`${TABLE_PREFIX}cfg_socials`, storeId),
                // Changed to plural table for integrations
                fetchTableConfig(`${TABLE_PREFIX}cfg_integrations`, storeId),
                // New: Mercado Pago specific table
                fetchTableConfig(`${TABLE_PREFIX}cfg_mercadopago`, storeId),
                // Changed to plural table for shippings
                fetchTableConfig(`${TABLE_PREFIX}cfg_shippings`, storeId),
                fetchConfig('ai', storeId)
            ]);

            // Construct defaults for complex objects to avoid undefined errors
            const defaultShipping = {
                melhorEnvioToken: '',
                additionalDays: 0,
                additionalCost: 0,
                freeShippingPolicy: { enabled: false, minValue: 0, cities: '' }
            };

            const defaultIntegrations = {
                mercadoPagoPublicKey: '',
                mercadoPagoToken: '',
                mercadoLivreUser: '',
                mercadoLivreToken: '',
                mercadoLivreStatus: 'Desconectado' as const
            };

            // Deep merge logic for shipping to ensure nested objects exist
            const shippingData = shipping || {};
            const finalShipping = {
                ...defaultShipping,
                ...shippingData,
                freeShippingPolicy: {
                    ...defaultShipping.freeShippingPolicy,
                    ...(shippingData.freeShippingPolicy || {})
                }
            };

            // Construct the monolithic object for the frontend
            const settings: Partial<StoreSettings> = {
                // General Settings (Mapped from storeSettingsData)
                storeName: storeSettingsData?.storeName || '',
                domain: storeSettingsData?.domain || '',
                address: storeSettingsData?.address || {},
                // Sections
                branding: branding || {},
                email: email || {},
                infoPages: info || {},
                seo: seo || {},
                connectivity: connectivity || {},
                socialMedia: social || {},
                // Merge general integrations with specific MP config and defaults
                integrations: { ...defaultIntegrations, ...(integrations || {}), ...(mercadopago || {}) },
                shipping: finalShipping,
                ai: ai || {},
                // Banners are handled via the banners table, added in hooks
                banners: []
            };

            return settings as StoreSettings;

        } catch (e: any) {
            console.warn("Falha ao buscar settings da API, usando mock default.", e);
            await mockDelay();
            return mockData.settings as unknown as StoreSettings;
        }
    },

    saveSettings: async (settings: StoreSettings & { _id?: string }): Promise<void> => {
        try {
            const storeId = getStoreId();
            if (!storeId) throw new Error("No Store ID");

            console.log("Saving split configuration settings...");

            // Separate Mercado Pago specific settings from other integrations
            const { mercadoPagoPublicKey, mercadoPagoToken, ...otherIntegrations } = settings.integrations;
            const mpSettings = { mercadoPagoPublicKey, mercadoPagoToken };

            // Distribute the monolithic object into independent tables
            // 'loja_store_settings' handles the general store data
            await Promise.all([
                upsertTableConfig(`${TABLE_PREFIX}store_settings`, {
                    storeName: settings.storeName,
                    domain: settings.domain,
                    address: settings.address
                }, storeId),
                upsertConfig('branding', settings.branding, storeId),
                // Using specific plural table for emails
                upsertTableConfig(`${TABLE_PREFIX}cfg_emails`, settings.email, storeId),
                // Changed to plural table for infos
                upsertTableConfig(`${TABLE_PREFIX}cfg_infos`, settings.infoPages, storeId),
                // Changed to plural table for seos
                upsertTableConfig(`${TABLE_PREFIX}cfg_seos`, settings.seo, storeId),
                // Changed to plural table for connectivities
                upsertTableConfig(`${TABLE_PREFIX}cfg_connectivities`, settings.connectivity, storeId),
                // Changed to plural table for socials
                upsertTableConfig(`${TABLE_PREFIX}cfg_socials`, settings.socialMedia, storeId),
                // Save general integrations (Mercado Livre) to loja_cfg_integrations
                upsertTableConfig(`${TABLE_PREFIX}cfg_integrations`, otherIntegrations, storeId),
                // Save MP specific data to new table
                upsertTableConfig(`${TABLE_PREFIX}cfg_mercadopago`, mpSettings, storeId),
                // Changed to plural table for shippings
                upsertTableConfig(`${TABLE_PREFIX}cfg_shippings`, settings.shipping, storeId),
                upsertConfig('ai', settings.ai, storeId)
            ]);

            console.log("Settings saved successfully (or fallback triggered).");

        } catch (e) {
            // unexpected error in the main block
            console.warn("Falha ao salvar settings na API, simulando sucesso.", e);
            await mockDelay();
        }
    }
};
