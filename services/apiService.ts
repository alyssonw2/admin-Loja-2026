
import type { User, StoreSettings } from "../types";
import { mockData } from '../data/mockData';

const API_URL = "https://recipes-strip-evaluations-seriously.trycloudflare.com";
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
    { 
        tableName: `${TABLE_PREFIX}store_settings`, 
        fields: { "config": "json", "store_id": "string|required" } 
    },
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
    {
        tableName: `${TABLE_PREFIX}questions_and_answers`,
        fields: {
            "product_id": "string",
            "customer_id": "string",
            "question_text": "string",
            "question_date_integer": "number",
            "answer_text": "string",
            "questionType": "boolean",
            "store_id": "string|required"
        }
    },
    {
        tableName: `${TABLE_PREFIX}products`,
        fields: {
            "name": "string",
            "sku": "string",
            "price": "string",
            "promotional_price": "string",
            "stock": "string",
            "sizes": "any",
            "category_id": "string",
            "brand_id": "string",
            "model_id": "string",
            "material_id": "string",
            "color_id": "string",
            "description": "string",
            "condition": "string",
            "status": "string",
            "width": "string",
            "height": "string",
            "depth": "string",
            "weight": "string",
            "media": "any",
            "created_at": "string",
            "mercado_livre_status": "string",
            "mercado_livre_url": "string",
            "store_id": "string|required"
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
            "items": "json",
            "events": "json",
            "gateway_transaction_id": "string",
            "tracking_code": "string",
            "invoice_url": "string",
            "store_id": "string|required"
        }
    },
    {
        tableName: `${TABLE_PREFIX}carts`,
        fields: {
            "customer_id": "string",
            "customer_name": "string",
            "customer_email": "string",
            "items": "json",
            "total": "string",
            "updated_at": "string",
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
    'carts': {
        customerId: 'customer_id',
        customerName: 'customer_name',
        customerEmail: 'customer_email',
        updatedAt: 'updated_at'
    },
    'customers': {
        joinDate: 'join_date',
        totalSpent: 'total_spent',
        avatarUrl: 'avatar_url',
        cpfCnpj: 'cpf_cnpj',
        address: 'addres',
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

async function request<T>(endpoint: string, options: RequestInit = {}, overrideToken?: string): Promise<T> {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: { ...headers(overrideToken), ...options.headers }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw { status: response.status, message: errorText || response.statusText };
        }

        const text = await response.text();
        return text ? JSON.parse(text) : null;

    } catch (error: any) {
        throw error;
    }
}

const upsertTableConfig = async (tableName: string, configData: any, storeId: string) => {
    const encodedStoreId = encodeURIComponent(storeId);
    
    try {
        let existing: any[] = [];
        try {
            const response = await request<any>(`/db/${tableName}?store_id=${encodedStoreId}&limit=1`);
            if (Array.isArray(response)) {
                existing = response;
            } else if (response && response.data && Array.isArray(response.data)) {
                 existing = response.data;
            }
        } catch (e: any) {}
        
        const payload = {
            config: configData,
            store_id: String(storeId)
        };

        if (existing && existing.length > 0) {
            const id = existing[0].id;
            await request(`/db/${tableName}/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            await request(`/db/${tableName}`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }
    } catch (e: any) {
        console.warn(`[API] Failed to save config for ${tableName}.`, e);
    }
};

const upsertConfig = async (tableNameSuffix: string, configData: any, storeId: string) => {
    const tableName = `${TABLE_PREFIX}cfg_${tableNameSuffix}`;
    await upsertTableConfig(tableName, configData, storeId);
};

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

const fetchConfig = async (tableNameSuffix: string, storeId: string): Promise<any | null> => {
    const tableName = `${TABLE_PREFIX}cfg_${tableNameSuffix}`;
    return await fetchTableConfig(tableName, storeId);
};

const initializeDatabase = async () => {
    try {
        const data = await request<{token: string}>(`/db/login/adminlogin`, {
            method: 'POST',
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS })
        });
        const systemToken = data.token;

        for (const schema of REQUIRED_TABLES) {
            try {
                 await request(`/db/create-table`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${systemToken}` }, 
                    body: JSON.stringify(schema)
                }, systemToken);
            } catch (e) {}
        }
    } catch (e) {
        console.log("Database initialization skipped.");
    }
}

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

export const db = {
    getAll: async <T>(table: string, params: string = ''): Promise<T[]> => {
        try {
            const storeId = getStoreId();
            let query = params;
            if (table !== 'stores' && storeId) {
                const searchParams = new URLSearchParams(params);
                searchParams.append('store_id', String(storeId));
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
            if (table !== 'stores' && storeId) payload.store_id = String(storeId);
            
            // Garantir tipos primitivos string para o banco onde o schema exige string
            if (table === 'products') {
                if (payload.price !== undefined) payload.price = String(payload.price);
                if (payload.stock !== undefined) payload.stock = String(payload.stock);
                if (payload.promotional_price !== undefined) payload.promotional_price = String(payload.promotional_price);
                if (payload.weight !== undefined) payload.weight = String(payload.weight);
                if (payload.width !== undefined) payload.width = String(payload.width);
                if (payload.height !== undefined) payload.height = String(payload.height);
                if (payload.depth !== undefined) payload.depth = String(payload.depth);
            }

            const res = await request<T>(`/db/${TABLE_PREFIX}${table}`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            return mapFromDb(table, res);
        } catch (e) {
            console.error(`[API] Error creating record in ${table}.`, e);
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
            if (table !== 'stores' && storeId) payload.store_id = String(storeId);
            
            if (table === 'products') {
                if (payload.price !== undefined) payload.price = String(payload.price);
                if (payload.stock !== undefined) payload.stock = String(payload.stock);
                if (payload.promotional_price !== undefined) payload.promotional_price = String(payload.promotional_price);
                if (payload.weight !== undefined) payload.weight = String(payload.weight);
                if (payload.width !== undefined) payload.width = String(payload.width);
                if (payload.height !== undefined) payload.height = String(payload.height);
                if (payload.depth !== undefined) payload.depth = String(payload.depth);
            }

            const res = await request<T>(`/db/${TABLE_PREFIX}${table}/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            return mapFromDb(table, res);
        } catch (e) {
            console.error(`[API] Error updating record in ${table}.`, e);
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
    
    getSettings: async (): Promise<StoreSettings | null> => {
        try {
            const storeId = getStoreId();
            if (!storeId) return null;
            
            const [
                storeSettingsData,
                branding, 
                email, 
                info, 
                seo, 
                connectivity, 
                social, 
                integrations,
                mercadopago,
                shipping, 
                ai
            ] = await Promise.all([
                fetchTableConfig(`${TABLE_PREFIX}store_settings`, storeId),
                fetchConfig('branding', storeId),
                fetchTableConfig(`${TABLE_PREFIX}cfg_emails`, storeId), 
                fetchTableConfig(`${TABLE_PREFIX}cfg_infos`, storeId),
                fetchTableConfig(`${TABLE_PREFIX}cfg_seos`, storeId),
                fetchTableConfig(`${TABLE_PREFIX}cfg_connectivities`, storeId),
                fetchTableConfig(`${TABLE_PREFIX}cfg_socials`, storeId),
                fetchTableConfig(`${TABLE_PREFIX}cfg_integrations`, storeId),
                fetchTableConfig(`${TABLE_PREFIX}cfg_mercadopago`, storeId),
                fetchTableConfig(`${TABLE_PREFIX}cfg_shippings`, storeId),
                fetchConfig('ai', storeId)
            ]);

            const defaultShipping = {
                melhorEnvioToken: '',
                additionalDays: 0,
                additionalCost: 0,
                freeShippingPolicy: { enabled: false, minValue: 0, cities: '' }
            };

            const defaultIntegrations = {
                mercadoPagoPublicKey: '',
                mercadoPagoToken: '',
                mercadoPagoInstallmentsWithoutInterest: 3,
                mercadoPagoInterestRate3to6: 6,
                mercadoPagoInterestRate6to12: 12,
                mercadoPagoMethods: {
                  pix: true,
                  creditCard: true,
                  debitCard: true,
                  boleto: true
                },
                mercadoPagoPixDiscountPercent: 0,
                mercadoLivreUser: '',
                mercadoLivreToken: '',
                mercadoLivreStatus: 'Desconectado' as const
            };

            const shippingData = shipping || {};
            const finalShipping = {
                ...defaultShipping,
                ...shippingData,
                freeShippingPolicy: {
                    ...defaultShipping.freeShippingPolicy,
                    ...(shippingData.freeShippingPolicy || {})
                }
            };

            const settings: Partial<StoreSettings> = {
                storeName: storeSettingsData?.storeName || '',
                domain: storeSettingsData?.domain || '',
                address: storeSettingsData?.address || {},
                branding: branding || {},
                email: email || {},
                infoPages: info || {},
                seo: seo || {},
                connectivity: connectivity || {},
                socialMedia: social || {},
                integrations: { ...defaultIntegrations, ...(integrations || {}), ...(mercadopago || {}) },
                shipping: finalShipping,
                ai: ai || {},
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

            const { 
              mercadoPagoPublicKey, 
              mercadoPagoToken, 
              mercadoPagoInstallmentsWithoutInterest,
              mercadoPagoInterestRate3to6,
              mercadoPagoInterestRate6to12,
              mercadoPagoMethods,
              mercadoPagoPixDiscountPercent,
              ...otherIntegrations 
            } = settings.integrations;
            
            const mpSettings = { 
              mercadoPagoPublicKey, 
              mercadoPagoToken,
              mercadoPagoInstallmentsWithoutInterest,
              mercadoPagoInterestRate3to6,
              mercadoPagoInterestRate6to12,
              mercadoPagoMethods,
              mercadoPagoPixDiscountPercent
            };

            await Promise.all([
                upsertTableConfig(`${TABLE_PREFIX}store_settings`, {
                    storeName: settings.storeName,
                    domain: settings.domain,
                    address: settings.address
                }, String(storeId)),
                upsertConfig('branding', settings.branding, String(storeId)),
                upsertTableConfig(`${TABLE_PREFIX}cfg_emails`, settings.email, String(storeId)),
                upsertTableConfig(`${TABLE_PREFIX}cfg_infos`, settings.infoPages, String(storeId)),
                upsertTableConfig(`${TABLE_PREFIX}cfg_seos`, settings.seo, String(storeId)),
                upsertTableConfig(`${TABLE_PREFIX}cfg_connectivities`, settings.connectivity, String(storeId)),
                upsertTableConfig(`${TABLE_PREFIX}cfg_socials`, settings.socialMedia, String(storeId)),
                upsertTableConfig(`${TABLE_PREFIX}cfg_integrations`, otherIntegrations, String(storeId)),
                upsertTableConfig(`${TABLE_PREFIX}cfg_mercadopago`, mpSettings, String(storeId)),
                upsertTableConfig(`${TABLE_PREFIX}cfg_shippings`, settings.shipping, String(storeId)),
                upsertConfig('ai', settings.ai, String(storeId))
            ]);

        } catch (e) {
            console.warn("Falha ao salvar settings na API, simulando sucesso.", e);
            await mockDelay();
        }
    }
};
