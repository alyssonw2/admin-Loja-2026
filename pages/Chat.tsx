
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { ChatConversation, ChatMessage, StoreSettings, Toast } from '../types';
import { ChatIcon, MicrophoneIcon, StopIcon, TrashIcon } from '../components/icons/Icons';
import { getChats, getContactInfo, getMessagesForChat, sendMessage, sendMedia } from '../services/whatsappService';

interface ChatProps {
    whatsappStatus: StoreSettings['connectivity']['whatsappStatus'];
    whatsappPhone: string;
    showToast: (message: string, type: Toast['type']) => void;
    initialChatData?: { jid: string; message: string } | null;
    onConsumeInitialData?: () => void;
}

const Chat: React.FC<ChatProps> = ({ 
    whatsappStatus, 
    whatsappPhone, 
    showToast, 
    initialChatData,
    onConsumeInitialData 
}) => {
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    
    // Controle de Histórico
    const [visibleLimit, setVisibleLimit] = useState(10);
    const [hasMore, setHasMore] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
    const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const lastMessageIdRef = useRef<string>('');

    const instanceName = whatsappPhone || "default";

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior });
        }
    };

    // Reseta o limite ao trocar de conversa
    useEffect(() => {
        setVisibleLimit(10);
        lastMessageIdRef.current = '';
    }, [selectedConversationId]);

    // Scroll inteligente: só desce se chegar mensagem nova no final
    useEffect(() => {
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.id !== lastMessageIdRef.current) {
                // Se for a primeira carga ou mensagem nova, scrolla
                const isFirstLoad = lastMessageIdRef.current === '';
                scrollToBottom(isFirstLoad ? 'auto' : 'smooth');
                lastMessageIdRef.current = lastMsg.id;
            }
        }
    }, [messages]);

    const fetchChats = useCallback(async () => {
        if (whatsappStatus !== 'Conectado' || !whatsappPhone) {
            setConversations([]);
            return;
        }
        setIsLoading(true);
        try {
            const apiChats = await getChats(instanceName);
            const filteredChats = apiChats.filter((chat: any) => 
                chat.remoteJid && (chat.remoteJid.endsWith('@s.whatsapp.net') || chat.remoteJid.endsWith('@lid'))
            );

            const enrichedChats = await Promise.all(filteredChats.map(async (chat: any) => {
                const contactRes = await getContactInfo(instanceName, chat.remoteJid);
                let displayName = chat.contactName !== 'Desconhecido' ? chat.contactName : chat.remoteJid.split('@')[0];
                let displayImg = chat.img || null;

                if (contactRes.success && contactRes.contact) {
                    const c = contactRes.contact;
                    if (c.name && c.name !== 'Sem nome') displayName = c.name;
                    displayImg = displayImg || c.imgUrl || null;
                }
                return { ...chat, displayName, displayImg };
            }));

            const mappedChats: ChatConversation[] = enrichedChats.map((chat: any) => {
                let ts = 0;
                if (typeof chat.dataUltimaMensagem === 'number') ts = chat.dataUltimaMensagem * 1000;
                else if (chat.created_at) ts = new Date(chat.created_at).getTime();

                return {
                    id: chat.remoteJid,
                    contactName: chat.displayName,
                    lastMessage: chat.ultimaMensagem || 'Nenhuma mensagem',
                    timestamp: ts > 0 ? new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '--/-- --:--',
                    rawTimestamp: ts,
                    unreadCount: chat.unreadCount || 0,
                    avatarUrl: chat.displayImg || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.displayName)}&background=6366f1&color=fff`
                };
            }).sort((a, b) => (b.rawTimestamp || 0) - (a.rawTimestamp || 0));

            setConversations(mappedChats);
            
            if (initialChatData && initialChatData.jid) {
                setSelectedConversationId(initialChatData.jid);
                setNewMessage(initialChatData.message);
                if (onConsumeInitialData) onConsumeInitialData();
            }
        } catch (error) {
            console.error("Erro ao buscar conversas:", error);
        } finally {
            setIsLoading(false);
        }
    }, [whatsappStatus, whatsappPhone, instanceName, initialChatData, onConsumeInitialData]);

    const fetchMessages = useCallback(async (chatId: string, isSilent = false) => {
        if (whatsappStatus !== 'Conectado' || !whatsappPhone) {
            setMessages([]);
            return;
        }
        
        if (!isSilent) setIsLoadingMessages(true);
        
        try {
            const rawMessages = await getMessagesForChat(instanceName, chatId);
            
            // 1. Ordena todas as mensagens recebidas (da mais antiga para a mais nova)
            const sortedMessages = [...rawMessages].sort((a, b) => {
                const getTs = (m: any) => {
                    const inner = m.message || m;
                    return inner.messageTimestamp || inner.timestamp || (inner.created_at ? new Date(inner.created_at).getTime() / 1000 : 0);
                };
                return getTs(a) - getTs(b); 
            });

            // 2. Processa os conteúdos
            const mappedMessages: ChatMessage[] = sortedMessages.map(msgWrapper => {
                const msg = msgWrapper.message || msgWrapper;
                const isFromMe = msg.key?.fromMe === true || msg.fromMe === true;
                
                let text = '';
                let mediaUrl = undefined;
                let mediaType: ChatMessage['mediaType'] = undefined;
                let quoted: ChatMessage['quoted'] = undefined;
                
                const ensureBase64Prefix = (data: string, type: 'image' | 'video' | 'audio' | 'sticker' | 'document') => {
                    if (!data || !data.length) return undefined;
                    if (data.startsWith('data:') || data.startsWith('http')) return data;
                    let mime = 'image/jpeg';
                    if (type === 'video') mime = 'video/mp4';
                    if (type === 'audio') mime = 'audio/ogg; codecs=opus';
                    if (type === 'sticker') mime = 'image/webp';
                    if (type === 'document') mime = 'application/pdf';
                    return `data:${mime};base64,${data}`;
                };

                const findContent = (obj: any): any => {
                    if (!obj || typeof obj !== 'object') return null;
                    const validKeys = ['conversation', 'extendedTextMessage', 'imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage', 'viewOnceMessage', 'viewOnceMessageV2'];
                    for (const key of validKeys) {
                        if (obj[key]) {
                            if (key.startsWith('viewOnce')) return findContent(obj[key].message);
                            return { type: key, data: obj[key] };
                        }
                    }
                    if (obj.message) return findContent(obj.message);
                    return null;
                };

                const content = msg.message || msg.content;
                const found = findContent(content);

                if (found) {
                    const { type, data } = found;
                    switch (type) {
                        case 'conversation': text = data; break;
                        case 'extendedTextMessage': text = data.text || ''; break;
                        case 'imageMessage': mediaType = 'image'; mediaUrl = ensureBase64Prefix(data.url || data.base64, 'image'); text = data.caption || ''; break;
                        case 'videoMessage': mediaType = 'video'; mediaUrl = ensureBase64Prefix(data.url || data.base64, 'video'); text = data.caption || ''; break;
                        case 'audioMessage': mediaType = 'audio'; mediaUrl = ensureBase64Prefix(data.url || data.base64, 'audio'); break;
                        case 'stickerMessage': mediaType = 'sticker'; mediaUrl = ensureBase64Prefix(data.url || data.base64, 'sticker'); break;
                        case 'documentMessage': mediaType = 'document'; mediaUrl = ensureBase64Prefix(data.url || data.base64, 'document'); text = data.title || data.fileName || 'Arquivo'; break;
                    }
                } else if (typeof content === 'string') {
                    text = content;
                }

                const timestamp = msg.messageTimestamp || msg.timestamp || msg.created_at;
                const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);

                return {
                    id: String(msg.key?.id || msg.id || Math.random().toString()),
                    sender: (isFromMe ? 'admin' : 'user') as 'admin' | 'user',
                    text,
                    timestamp: isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(),
                    mediaUrl,
                    mediaType
                };
            }).filter(m => m.text || m.mediaUrl);

            // 3. Aplica o limite de visualização
            setHasMore(mappedMessages.length > visibleLimit);
            setMessages(mappedMessages.slice(-visibleLimit));
            
        } catch (error) {
            console.error("Erro ao carregar mensagens:", error);
        } finally {
            if (!isSilent) setIsLoadingMessages(false);
        }
    }, [whatsappStatus, whatsappPhone, instanceName, visibleLimit]);

    useEffect(() => {
       fetchChats();
       const interval = setInterval(fetchChats, 30000);
       return () => clearInterval(interval);
    }, [fetchChats]);

    useEffect(() => {
        let messageInterval: any;
        if (selectedConversationId) {
            fetchMessages(selectedConversationId);
            messageInterval = setInterval(() => fetchMessages(selectedConversationId, true), 5000);
        } else {
            setMessages([]);
        }
        return () => { if (messageInterval) clearInterval(messageInterval); };
    }, [selectedConversationId, fetchMessages]);

    // Agrupamento por Data
    const groupedMessages = useMemo(() => {
        const groups: { [key: string]: ChatMessage[] } = {};
        messages.forEach(msg => {
            const dateStr = new Date(msg.timestamp).toLocaleDateString('pt-BR');
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(msg);
        });
        return groups;
    }, [messages]);

    const formatHeaderDate = (dateStr: string) => {
        const today = new Date().toLocaleDateString('pt-BR');
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('pt-BR');
        if (dateStr === today) return 'Hoje';
        if (dateStr === yesterday) return 'Ontem';
        return dateStr;
    };

    const handleLoadMore = () => setVisibleLimit(prev => prev + 10);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!selectedConversationId || !newMessage.trim()) return;
        const msgText = newMessage.trim();
        setNewMessage('');
        try {
            await sendMessage(instanceName, selectedConversationId, msgText);
            fetchMessages(selectedConversationId, true);
        } catch (error) {
            showToast("Erro ao enviar mensagem.", 'error');
        }
    };
    
    const selectedConversation = useMemo(() => {
        return conversations.find(c => c.id === selectedConversationId);
    }, [conversations, selectedConversationId]);

    return (
        <div className="flex h-full">
            <aside className="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col min-w-[320px]">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-indigo-50">Contatos</h2>
                    <button onClick={fetchChats} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 11v-5h-5m-1 1l-15-15"/></svg></button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.map(convo => (
                        <button key={convo.id} onClick={() => setSelectedConversationId(convo.id)} className={`w-full text-left p-4 flex items-center space-x-4 border-b dark:border-gray-700/50 ${selectedConversationId === convo.id ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
                            <img src={convo.avatarUrl} className="w-12 h-12 rounded-full object-cover bg-gray-200" alt={convo.contactName} />
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-gray-900 dark:text-indigo-50 truncate text-sm">{convo.contactName}</h3>
                                    <span className="text-[10px] text-gray-500">{convo.timestamp}</span>
                                </div>
                                <p className="text-xs text-gray-500 truncate">{convo.lastMessage}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            <main className="flex-1 flex flex-col bg-[#e5ddd5] dark:bg-gray-900">
                {selectedConversation ? (
                    <>
                        <header className="bg-white dark:bg-gray-800 p-4 flex items-center space-x-4 border-b dark:border-gray-700 shadow-sm z-10">
                            <img src={selectedConversation.avatarUrl} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-indigo-50">{selectedConversation.contactName}</h3>
                                <p className="text-[10px] text-gray-500 font-mono">{selectedConversation.id}</p>
                            </div>
                        </header>
                        
                        <div ref={scrollContainerRef} className="flex-1 p-6 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] dark:bg-none">
                           <div className="flex flex-col space-y-4">
                               {hasMore && (
                                   <div className="flex justify-center">
                                       <button onClick={handleLoadMore} className="bg-white/80 dark:bg-gray-800 px-4 py-1 rounded-full text-xs font-bold text-primary shadow hover:bg-white transition-all">Carregar mensagens anteriores</button>
                                   </div>
                               )}
                               
                               {Object.keys(groupedMessages).map(dateStr => (
                                   <React.Fragment key={dateStr}>
                                        <div className="flex justify-center my-4">
                                            <span className="bg-gray-200/90 dark:bg-gray-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 shadow-sm">
                                                {formatHeaderDate(dateStr)}
                                            </span>
                                        </div>
                                        {groupedMessages[dateStr].map((msg, idx) => (
                                            <div key={msg.id || idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm text-sm ${msg.sender === 'admin' ? 'bg-primary text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none'}`}>
                                                    {msg.mediaUrl && msg.mediaType === 'image' && <img src={msg.mediaUrl} className="rounded-lg mb-2 max-w-full h-auto cursor-pointer" onClick={() => window.open(msg.mediaUrl, '_blank')} />}
                                                    {msg.mediaUrl && msg.mediaType === 'audio' && <audio src={msg.mediaUrl} controls className="w-full h-8 mb-2" />}
                                                    {msg.text && <p className="leading-relaxed break-words">{msg.text}</p>}
                                                    <span className="text-[9px] mt-1 block text-right opacity-60 font-bold">
                                                        {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                   </React.Fragment>
                               ))}
                               <div ref={messagesEndRef} className="h-1" />
                           </div>
                        </div>

                        <footer className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite uma mensagem..." className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-xl py-3 px-4 text-sm focus:outline-none" />
                                <button type="submit" disabled={!newMessage.trim()} className="bg-primary text-white rounded-xl p-3 shadow-lg disabled:opacity-50"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
                            </form>
                        </footer>
                    </>
                ) : (
                   <div className="flex-1 flex items-center justify-center text-gray-500"><div className="text-center"><ChatIcon className="w-16 h-16 mx-auto mb-4 opacity-20" /><h2 className="text-xl font-bold">Selecione uma conversa</h2></div></div>
                )}
            </main>
        </div>
    );
};

export default Chat;
