
const URL_BASE_WHATSAPP = "https://dictionary-understanding-accommodations-vital.trycloudflare.com";

export const createInstance = async (name: string) => {
    const response = await fetch(`${URL_BASE_WHATSAPP}/api/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    return response.json();
};

export const listInstances = async (): Promise<any[]> => {
    try {
        const response = await fetch(`${URL_BASE_WHATSAPP}/api/instances`);
        const data = await response.json();
        return Array.isArray(data) ? data : (data.instances || []);
    } catch (e) {
        return [];
    }
};

export const getInstanceStatus = async (name: string): Promise<'Conectado' | 'Desconectado' | 'Conectando'> => {
    try {
        const instances = await listInstances();
        const instance = instances.find(i => i.name === name);
        if (!instance) return 'Desconectado';
        
        if (instance.connectionStatus === 'open' || instance.status === 'connected') return 'Conectado';
        if (instance.status === 'connecting' || instance.status === 'qrcode') return 'Conectando';
        return 'Desconectado';
    } catch (e) {
        return 'Desconectado';
    }
};

export const connectInstance = async (name: string) => {
    const response = await fetch(`${URL_BASE_WHATSAPP}/api/instances/${name}/connect`, {
        method: 'POST'
    });
    return response.json();
};

export const getQrCode = async (name: string): Promise<{ qrCode: string | null }> => {
    try {
        const response = await fetch(`${URL_BASE_WHATSAPP}/api/instances/${name}/qr`);
        return await response.json();
    } catch (e) {
        return { qrCode: null };
    }
};

export const disconnectInstance = async (name: string) => {
    const response = await fetch(`${URL_BASE_WHATSAPP}/api/instances/${name}/disconnect`, {
        method: 'POST'
    });
    return response.json();
};

export const getChats = async (instanceName: string): Promise<any[]> => {
    const response = await fetch(`${URL_BASE_WHATSAPP}/api/instances/${instanceName}/chats`);
    const data = await response.json();
    return data.chats || [];
};

export const getContactInfo = async (instanceName: string, jid: string): Promise<any> => {
    try {
        const response = await fetch(`${URL_BASE_WHATSAPP}/api/instances/${instanceName}/contact/${jid}`);
        return await response.json();
    } catch (e) {
        return { success: false };
    }
};

const getTargetIdentifier = (jid: string) => {
    if (jid.includes('@lid')) return jid;
    return jid.split('@')[0].replace(/\D/g, '');
};

export const sendMessage = async (instanceName: string, number: string, message: string) => {
    const target = getTargetIdentifier(number);
    const response = await fetch(`${URL_BASE_WHATSAPP}/api/instances/${instanceName}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: target, message })
    });
    return response.json();
};

export const sendMedia = async (instanceName: string, number: string, base64: string, type: 'image' | 'video' | 'audio', caption?: string) => {
    const target = getTargetIdentifier(number);
    const response = await fetch(`${URL_BASE_WHATSAPP}/api/instances/${instanceName}/send-media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            number: target, 
            media: base64,
            type,
            caption
        })
    });
    return response.json();
};

export const getMessagesForChat = async (instanceName: string, chatId: string): Promise<any[]> => {
    try {
        const response = await fetch(`${URL_BASE_WHATSAPP}/api/instances/${instanceName}/messages/${chatId}`);
        const data = await response.json();
        
        // Se a API retornar um objeto com success: true e lista de mensagens
        if (data.success && data.messages) {
            return data.messages;
        }
        
        // Se a API retornar diretamente o array
        return Array.isArray(data) ? data : (data.messages || []);
    } catch (error) {
        console.error(`Erro ao buscar mensagens para ${chatId}:`, error);
        return [];
    }
};

export const getCatalog = async (instanceName: string): Promise<any[]> => {
    try {
        const response = await fetch(`${URL_BASE_WHATSAPP}/api/instances/${instanceName}/catalog`)
        const data = await response.json();
        
        if (data.success && data.catalog && data.catalog.products) {
            return data.catalog.products.map((p: any) => ({
                id: p.id,
                name: p.name,
                price: parseFloat((Number(p.price) / 100).toFixed(2)),
                imageUrl: p.imageUrls?.original || p.imageUrls?.requested,
                description: p.description,
                sku: p.retailerId
            }));
        }
    } catch (error) {
        console.error("Erro ao buscar catálogo do WhatsApp:", error);
    }
    return [];
};
