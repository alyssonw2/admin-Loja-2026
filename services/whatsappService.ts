
import { mockData } from '../data/mockData';

// Mock Service for WhatsApp features

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createInstance = (name: string) => {
    return Promise.resolve({ success: true });
};

export const listInstances = async (): Promise<{id: number, name: string, connected: boolean}[]> => {
    // Return a connected state based on a global variable or local storage simulation if needed.
    // For simplicity, we assume disconnected unless connected in session.
    // In this mock, we will check a flag in localStorage for persistence simulation across refreshes
    const isConnected = localStorage.getItem('mock_whatsapp_connected') === 'true';
    return [{ id: 1, name: 'E-connect', connected: isConnected }];
};

export const connectInstance = async (name: string) => {
    await delay(1000);
    localStorage.setItem('mock_whatsapp_connected', 'true');
    return Promise.resolve({ success: true });
};

export const getQrCode = async (name: string): Promise<{ qrCode: string | null }> => {
    // Simulate a QR code 
    return Promise.resolve({ qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=SimulacaoConexaoEconnectMock' });
};

export const disconnectInstance = async (name: string) => {
    await delay(500);
    localStorage.setItem('mock_whatsapp_connected', 'false');
    return Promise.resolve({ success: true });
};

export const getChats = async (instanceName: string): Promise<any[]> => {
    await delay(300);
    // Return chats from mockData
    // We assume mockData has a chats array. Since it might not be typed fully in all contexts, we cast to any or just access it.
    const chats = (mockData as any).chats || [];
    return chats.map((chat: any) => ({
        id: chat.id,
        name: chat.contactName,
        conversationTimestamp: new Date(chat.lastMessageAt).getTime() / 1000,
        unreadCount: chat.unreadCount,
        lastMessage: { message: chat.lastMessage }
    }));
};

export const sendMessage = async (instanceName: string, chatId: string, message: string) => {
    await delay(300);
    console.log(`Mock: Enviando mensagem para ${chatId}: ${message}`);
    // In a full in-memory mock, we would append to mockData.messages here, 
    // but since we are just simulating for display, returning success is enough.
    return { success: true };
};

export const getMessagesForChat = async (instanceName: string, chatId: string): Promise<any[]> => {
    await delay(300);
    // Return messages from mockData
    const allMessages = (mockData as any).messages || [];
    const chatMessages = allMessages.filter((m: any) => m.chatId === chatId);
    
    return chatMessages.map((msg: any) => ({
        id: msg.id,
        type: msg.sender === 'admin' ? 'sent' : 'received',
        data: { message: { conversation: msg.text } },
        created_at: msg.createdAt
    }));
};

export const getCatalog = async (instanceName: string): Promise<{id: string, name: string, price: number, imageUrl: string}[]> => {
    await delay(300);
    // Return a few mock products
    return [
        {
            id: 'prod-1',
            name: 'Camiseta Mock WhatsApp',
            price: 99.90,
            imageUrl: 'https://via.placeholder.com/150'
        },
        {
            id: 'prod-2',
            name: 'Calça Mock WhatsApp',
            price: 199.90,
            imageUrl: 'https://via.placeholder.com/150'
        }
    ];
};
