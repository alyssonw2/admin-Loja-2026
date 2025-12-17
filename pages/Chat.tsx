
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { ChatConversation, ChatMessage, StoreSettings, Toast } from '../types';
import { ChatIcon } from '../components/icons/Icons';
import * as whatsappService from '../services/whatsappService';

interface ChatProps {
    whatsappStatus: StoreSettings['connectivity']['whatsappStatus'];
    whatsappPhone: string;
    showToast: (message: string, type: Toast['type']) => void;
}

const Chat: React.FC<ChatProps> = ({ whatsappStatus, whatsappPhone, showToast }) => {
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // O nome da instância é o telefone cadastrado
    const instanceName = whatsappPhone || "default";

    const fetchChats = useCallback(async () => {
        if (whatsappStatus !== 'Conectado' || !whatsappPhone) {
            setConversations([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const apiChats = await whatsappService.getChats(instanceName);
            const mappedChats: ChatConversation[] = apiChats.map(chat => ({
                id: chat.id,
                contactName: chat.name || chat.id.split('@')[0],
                lastMessage: chat.lastMessage?.message || 'Nenhuma mensagem',
                timestamp: new Date(chat.conversationTimestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit'}),
                unreadCount: chat.unreadCount,
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name || chat.id.split('@')[0])}&background=random`
            }));
            setConversations(mappedChats);
            if (!selectedConversationId && mappedChats.length > 0) {
                setSelectedConversationId(mappedChats[0].id);
            }
        } catch (error) {
            console.error("Erro ao buscar conversas:", error);
            setConversations([]);
        } finally {
            setIsLoading(false);
        }
    }, [whatsappStatus, whatsappPhone, selectedConversationId, instanceName]);

    const fetchMessages = useCallback(async (chatId: string) => {
        if (whatsappStatus !== 'Conectado' || !whatsappPhone) {
            setMessages([]);
            setIsLoadingMessages(false);
            return;
        }
        setIsLoadingMessages(true);
        try {
            const logs = await whatsappService.getMessagesForChat(instanceName, chatId);
            const mappedMessages: ChatMessage[] = logs.map(log => ({
                id: log.id.toString(),
                sender: log.type === 'sent' ? 'admin' : 'user',
                text: log.data.message?.conversation || log.data.message?.extendedTextMessage?.text || '[Mídia não suportada]',
                timestamp: new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            }));
            setMessages(mappedMessages.reverse());
        } catch (error) {
            console.error("Erro ao buscar mensagens:", error);
        } finally {
            setIsLoadingMessages(false);
        }
    }, [whatsappStatus, whatsappPhone, instanceName]);
    
    useEffect(() => {
       fetchChats();
       const interval = setInterval(fetchChats, 15000);
       return () => clearInterval(interval);
    }, [fetchChats]);

    useEffect(() => {
        if (selectedConversationId) {
            fetchMessages(selectedConversationId);
        } else {
            setMessages([]);
        }
    }, [selectedConversationId, fetchMessages]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const selectedConversation = useMemo(() => {
        return conversations.find(c => c.id === selectedConversationId);
    }, [conversations, selectedConversationId]);
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversationId || !whatsappPhone) return;

        const tempMessage: ChatMessage = {
            id: `temp-${Date.now()}`,
            sender: 'admin',
            text: newMessage,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');

        try {
            await whatsappService.sendMessage(instanceName, selectedConversationId, tempMessage.text);
            setTimeout(() => fetchMessages(selectedConversationId), 1000); 
        } catch (error) {
            console.error("Erro ao enviar mensagem:", error);
            showToast("Não foi possível enviar a mensagem.", 'error');
            setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        }
    };
    
    const Placeholder = () => {
        let title: string;
        let message: string;

        if (whatsappStatus !== 'Conectado') {
            title = "WhatsApp Desconectado";
            message = "Por favor, vá até a página de Configurações para conectar sua instância do WhatsApp.";
        } else if (!whatsappPhone) {
            title = "Configuração Incompleta";
            message = "Configure o telefone do WhatsApp nas configurações para iniciar conversas.";
        } else if (isLoading) {
            title = "Carregando Conversas...";
            message = "Aguarde enquanto buscamos suas mensagens.";
        } else if (conversations.length === 0) {
            title = "Nenhuma Conversa Encontrada";
            message = "Parece que não há conversas. Tente enviar uma mensagem pelo seu celular para começar.";
        } else {
            title = "Selecione uma conversa";
            message = "Escolha uma conversa da lista à esquerda para ver as mensagens.";
        }

        return (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-500">
                <div className="text-center">
                    <ChatIcon className="w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{message}</p>
                </div>
            </div>
        );
    };


    return (
        <div className="flex h-full">
            <aside className="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Conversas</h2>
                     <button onClick={fetchChats} disabled={isLoading || whatsappStatus !== 'Conectado'} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 11v-5h-5m-1 1l-15-15"/>
                        </svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {isLoading && <p className="p-4 text-center text-gray-500 dark:text-gray-400">Carregando conversas...</p>}
                    {!isLoading && conversations.length === 0 && (
                        <p className="p-4 text-center text-gray-500 dark:text-gray-400">
                          {whatsappStatus !== 'Conectado' ? 'WhatsApp desconectado. Conecte em Configurações.' : 'Nenhuma conversa encontrada.'}
                        </p>
                    )}

                    {conversations.map(convo => (
                        <button 
                            key={convo.id} 
                            onClick={() => setSelectedConversationId(convo.id)}
                            className={`w-full text-left p-4 flex items-center space-x-4 border-l-4 ${selectedConversationId === convo.id ? 'bg-gray-100 dark:bg-gray-700 border-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 border-transparent'}`}
                        >
                            <img src={convo.avatarUrl} alt={convo.contactName} className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600" />
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{convo.contactName}</h3>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{convo.timestamp}</span>
                                </div>
                                <div className="flex justify-between items-start mt-1">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{convo.lastMessage}</p>
                                    {convo.unreadCount > 0 && (
                                        <span className="bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                            {convo.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            <main className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900">
                {selectedConversation ? (
                    <>
                        <header className="bg-white dark:bg-gray-800 p-4 flex items-center space-x-4 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                            <img src={selectedConversation.avatarUrl} alt={selectedConversation.contactName} className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600" />
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{selectedConversation.contactName}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedConversation.id.split('@')[0]}</p>
                            </div>
                        </header>
                        <div className="flex-1 p-6 overflow-y-auto">
                           {isLoadingMessages ? (
                               <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">Carregando mensagens...</div>
                           ) : (
                               <div className="space-y-4">
                                   {messages.map(msg => (
                                       <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                           {msg.sender === 'user' && <img src={selectedConversation.avatarUrl} className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600" />}
                                           <div className={`max-w-md p-3 rounded-xl ${msg.sender === 'admin' ? 'bg-primary text-white rounded-br-none' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                                               <p>{msg.text}</p>
                                               <span className="text-xs opacity-70 mt-1 block text-right">{msg.timestamp}</span>
                                           </div>
                                       </div>
                                   ))}
                                   <div ref={messagesEndRef} />
                               </div>
                           )}
                        </div>
                        <footer className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                            <form onSubmit={handleSendMessage}>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Digite sua mensagem..." 
                                        className="w-full bg-gray-100 dark:bg-gray-700 rounded-full py-3 px-6 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary" 
                                        disabled={whatsappStatus !== 'Conectado'}
                                    />
                                    <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary-dark text-white rounded-full p-2 disabled:bg-gray-500 dark:disabled:bg-gray-600" disabled={whatsappStatus !== 'Conectado'}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        </footer>
                    </>
                ) : (
                   <Placeholder />
                )}
            </main>
        </div>
    );
};

export default Chat;
