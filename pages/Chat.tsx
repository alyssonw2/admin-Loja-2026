
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
            
            // Busca detalhes de contato para cada chat para obter nomes reais e imagens
            const enrichedChats = await Promise.all(apiChats.map(async (chat) => {
                const contactRes = await whatsappService.getContactInfo(instanceName, chat.id);
                if (contactRes.success && contactRes.contact) {
                    const c = contactRes.contact;
                    return {
                        ...chat,
                        displayName: c.name || chat.name || chat.id.split('@')[0],
                        displayImg: c.imgUrl || (c.type === 'group' ? c.group?.profilePicture : null)
                    };
                }
                return {
                    ...chat,
                    displayName: chat.name || chat.id.split('@')[0],
                    displayImg: null
                };
            }));

            const mappedChats: ChatConversation[] = enrichedChats.map(chat => ({
                id: chat.id,
                contactName: chat.displayName,
                lastMessage: chat.lastMessage?.message || 'Nenhuma mensagem',
                timestamp: new Date(chat.conversationTimestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit'}),
                unreadCount: chat.unreadCount,
                avatarUrl: chat.displayImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.displayName)}&background=random`
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
       const interval = setInterval(fetchChats, 30000); // Aumentado para 30s para evitar excesso de requisições de contato
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
        } else if (isLoading && conversations.length === 0) {
            title = "Carregando Conversas...";
            message = "Aguarde enquanto buscamos suas mensagens e contatos.";
        } else if (conversations.length === 0) {
            title = "Nenhuma Conversa Encontrada";
            message = "Parece que não há conversas ativas no momento.";
        } else {
            title = "Selecione uma conversa";
            message = "Escolha uma conversa da lista à esquerda para ver as mensagens.";
        }

        return (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-500">
                <div className="text-center p-8">
                    <ChatIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-xs mx-auto">{message}</p>
                </div>
            </div>
        );
    };


    return (
        <div className="flex h-full">
            <aside className="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col min-w-[320px]">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Conversas</h2>
                     <button onClick={fetchChats} disabled={isLoading || whatsappStatus !== 'Conectado'} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 11v-5h-5m-1 1l-15-15"/>
                        </svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {!isLoading && conversations.length === 0 && (
                        <p className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                          {whatsappStatus !== 'Conectado' ? 'WhatsApp desconectado.' : 'Nenhuma conversa ativa.'}
                        </p>
                    )}

                    {conversations.map(convo => (
                        <button 
                            key={convo.id} 
                            onClick={() => setSelectedConversationId(convo.id)}
                            className={`w-full text-left p-4 flex items-center space-x-4 border-b border-gray-100 dark:border-gray-700/50 transition-all ${selectedConversationId === convo.id ? 'bg-primary/10 dark:bg-primary/20 border-l-4 border-l-primary' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 border-l-4 border-l-transparent'}`}
                        >
                            <img src={convo.avatarUrl} alt={convo.contactName} className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 object-cover shadow-sm" />
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-gray-900 dark:text-white truncate text-sm">{convo.contactName}</h3>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{convo.timestamp}</span>
                                </div>
                                <div className="flex justify-between items-start mt-0.5">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate pr-2">{convo.lastMessage}</p>
                                    {convo.unreadCount > 0 && (
                                        <span className="bg-green-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
                                            {convo.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            <main className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900/50">
                {selectedConversation ? (
                    <>
                        <header className="bg-white dark:bg-gray-800 p-4 flex items-center space-x-4 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10">
                            <img src={selectedConversation.avatarUrl} alt={selectedConversation.contactName} className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 object-cover" />
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{selectedConversation.contactName}</h3>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">{selectedConversation.id}</p>
                            </div>
                        </header>
                        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] dark:bg-none">
                           {isLoadingMessages ? (
                               <div className="flex justify-center items-center h-full">
                                   <div className="bg-white/80 dark:bg-gray-800 p-3 rounded-full shadow-lg">
                                       <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24">
                                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                       </svg>
                                   </div>
                               </div>
                           ) : (
                               <div className="flex flex-col space-y-2">
                                   {messages.map(msg => (
                                       <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                           <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm text-sm ${msg.sender === 'admin' ? 'bg-primary text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700'}`}>
                                               <p className="leading-relaxed">{msg.text}</p>
                                               <span className={`text-[9px] mt-1 block text-right opacity-60 font-bold uppercase`}>{msg.timestamp}</span>
                                           </div>
                                       </div>
                                   ))}
                                   <div ref={messagesEndRef} />
                               </div>
                           )}
                        </div>
                        <footer className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                            <form onSubmit={handleSendMessage}>
                                <div className="relative flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Digite uma mensagem..." 
                                        className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-xl py-3 px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all" 
                                        disabled={whatsappStatus !== 'Conectado'}
                                    />
                                    <button 
                                        type="submit" 
                                        className="bg-primary hover:bg-primary-dark text-white rounded-xl p-3 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:shadow-none" 
                                        disabled={whatsappStatus !== 'Conectado' || !newMessage.trim()}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" viewBox="0 0 20 20" fill="currentColor">
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
