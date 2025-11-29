
import { supabase } from "./supabaseClient";

// --- Chat & Messages ---

export const createInstance = (name: string) => {
    return Promise.resolve({ success: true });
};

export const listInstances = async (): Promise<{id: number, name: string, connected: boolean}[]> => {
    // Check connection status from Store Settings
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [{ id: 1, name: 'E-connect', connected: false }];

    const { data: store } = await supabase.from('stores').select('settings').eq('owner_id', user.id).single();
    const status = store?.settings?.connectivity?.whatsappStatus === 'Conectado';
    
    return [{ id: 1, name: 'E-connect', connected: status }];
};

export const connectInstance = async (name: string) => {
    // In a real app, this would trigger a QR generation on backend.
    // Here we assume connection logic happens and we update DB.
    return Promise.resolve({ success: true });
};

export const getQrCode = async (name: string): Promise<{ qrCode: string | null }> => {
    // Simulate a QR code returned from backend
    return Promise.resolve({ qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=SimulacaoConexao' });
};

export const disconnectInstance = async (name: string) => {
    return Promise.resolve({ success: true });
};

export const getChats = async (instanceName: string): Promise<any[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single();
    if(!store) return [];

    const { data: chats } = await supabase.from('chats').select('*').eq('store_id', store.id).order('last_message_at', { ascending: false });

    return (chats || []).map(chat => ({
        id: chat.id,
        name: chat.contact_name,
        conversationTimestamp: new Date(chat.last_message_at).getTime() / 1000,
        unreadCount: chat.unread_count,
        lastMessage: { message: chat.last_message }
    }));
};

export const sendMessage = async (instanceName: string, chatId: string, message: string) => {
    // Insert message into DB
    const { error } = await supabase.from('messages').insert({
        chat_id: chatId,
        sender: 'admin',
        text: message
    });
    
    if (error) throw error;
    
    // Update chat last message
    await supabase.from('chats').update({
        last_message: message,
        last_message_at: new Date().toISOString()
    }).eq('id', chatId);

    return { success: true };
};

export const getMessagesForChat = async (instanceName: string, chatId: string): Promise<any[]> => {
    const { data: messages } = await supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: false });
    
    return (messages || []).map(msg => ({
        id: msg.id,
        type: msg.sender === 'admin' ? 'sent' : 'received',
        data: { message: { conversation: msg.text } },
        created_at: msg.created_at
    }));
};

// --- Catalog ---
export const getCatalog = async (instanceName: string): Promise<{id: string, name: string, price: number, imageUrl: string}[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user.id).single();
    if(!store) return [];

    // Fetch products from DB
    const { data: products } = await supabase.from('products').select('*').eq('store_id', store.id).eq('status', 'Ativo');

    return (products || []).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        imageUrl: p.media?.[0]?.url || 'https://via.placeholder.com/150'
    }));
};
