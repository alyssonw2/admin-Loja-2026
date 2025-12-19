
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
    
    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
    const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastMessageIdRef = useRef<string>('');

    const instanceName = whatsappPhone || "default";

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior });
        }
    };

    useEffect(() => {
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.id !== lastMessageIdRef.current) {
                scrollToBottom(lastMessageIdRef.current === '' ? 'auto' : 'smooth');
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
            } else if (!selectedConversationId && mappedChats.length > 0) {
                setSelectedConversationId(mappedChats[0].id);
            }
        } catch (error) {
            console.error("Erro ao buscar conversas:", error);
        } finally {
            setIsLoading(false);
        }
    }, [whatsappStatus, whatsappPhone, selectedConversationId, instanceName, initialChatData, onConsumeInitialData]);

    const fetchMessages = useCallback(async (chatId: string, isSilent = false) => {
        if (whatsappStatus !== 'Conectado' || !whatsappPhone) {
            setMessages([]);
            return;
        }
        
        if (!isSilent) setIsLoadingMessages(true);
        
        try {
            const rawMessages = await getMessagesForChat(instanceName, chatId);
            
            const sortedMessages = [...rawMessages].sort((a, b) => {
                const getTs = (m: any) => {
                    const inner = m.message || m;
                    return inner.messageTimestamp || inner.timestamp || (inner.created_at ? new Date(inner.created_at).getTime() / 1000 : 0);
                };
                return getTs(a) - getTs(b); 
            });

            const mappedMessages: ChatMessage[] = sortedMessages.map(msgWrapper => {
                const msg = msgWrapper.message || msgWrapper;
                const isFromMe = msg.key?.fromMe === true || msg.fromMe === true;
                
                let text = '';
                let mediaUrl = undefined;
                let mediaType: ChatMessage['mediaType'] = undefined;
                
                const ensureBase64Prefix = (data: string, type: 'image' | 'video' | 'audio' | 'sticker' | 'document') => {
                    if (!data || !data.length) return undefined;
                    // Se já tiver o prefixo data: ou for um link http, retorna direto
                    if (data.startsWith('data:') || data.startsWith('http')) return data;
                    
                    let mime = 'image/jpeg';
                    if (type === 'video') mime = 'video/mp4';
                    if (type === 'audio') mime = 'audio/ogg; codecs=opus';
                    if (type === 'sticker') mime = 'image/webp';
                    if (type === 'document') mime = 'application/pdf';
                    return `data:${mime};base64,${data}`;
                };

                const content = msg.message || msg.content;
                if (content) {
                    // Verifica imageMessage (pode estar junto com senderKeyDistributionMessage)
                    if (content.imageMessage) {
                        mediaType = 'image';
                        mediaUrl = ensureBase64Prefix(content.imageMessage.url || content.imageMessage.base64, 'image');
                        text = content.imageMessage.caption || '';
                    } else if (content.videoMessage) {
                        mediaType = 'video';
                        mediaUrl = ensureBase64Prefix(content.videoMessage.url || content.videoMessage.base64, 'video');
                        text = content.videoMessage.caption || '';
                    } else if (content.audioMessage) {
                        mediaType = 'audio';
                        mediaUrl = ensureBase64Prefix(content.audioMessage.url || content.audioMessage.base64, 'audio');
                    } else if (content.stickerMessage) {
                        mediaType = 'sticker';
                        mediaUrl = ensureBase64Prefix(content.stickerMessage.url || content.stickerMessage.base64, 'sticker');
                    } else if (content.documentMessage) {
                        mediaType = 'document';
                        mediaUrl = ensureBase64Prefix(content.documentMessage.url || content.documentMessage.base64, 'document');
                        text = content.documentMessage.title || content.documentMessage.fileName || 'Arquivo';
                    } else if (content.conversation) {
                        text = content.conversation;
                    } else if (content.extendedTextMessage) {
                        text = content.extendedTextMessage.text || '';
                    } else if (typeof content === 'string') {
                        text = content;
                    }
                }
                
                let timeStr = '';
                const timestamp = msg.messageTimestamp || msg.timestamp || msg.created_at;
                if (timestamp) {
                    const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
                    timeStr = isNaN(date.getTime()) 
                        ? new Date().toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
                        : date.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                } else {
                    timeStr = new Date().toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                }

                return {
                    id: msg.key?.id || msg.id || Math.random().toString(),
                    sender: isFromMe ? 'admin' : 'user',
                    text,
                    timestamp: timeStr,
                    mediaUrl,
                    mediaType
                };
            });

            setMessages(mappedMessages);
        } catch (error) {
            console.error("Erro ao processar mensagens:", error);
        } finally {
            if (!isSilent) setIsLoadingMessages(false);
        }
    }, [whatsappStatus, whatsappPhone, instanceName]);
    
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
            lastMessageIdRef.current = '';
        }
        return () => { if (messageInterval) clearInterval(messageInterval); };
    }, [selectedConversationId, fetchMessages]);
    
    const selectedConversation = useMemo(() => {
        return conversations.find(c => c.id === selectedConversationId);
    }, [conversations, selectedConversationId]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' });
                setRecordedAudioUrl(URL.createObjectURL(audioBlob));
                setRecordedAudioBlob(audioBlob);
                setIsRecording(false);
                clearInterval(timerRef.current);
            };
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (err) {
            showToast("Erro ao acessar microfone.", 'error');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        setIsRecording(false);
        setRecordedAudioUrl(null);
        setRecordedAudioBlob(null);
        setRecordingTime(0);
        clearInterval(timerRef.current);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
        });
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!selectedConversationId || !whatsappPhone) return;

        if (recordedAudioBlob) {
            try {
                const base64Audio = await blobToBase64(recordedAudioBlob);
                await sendMedia(instanceName, selectedConversationId, base64Audio, 'audio');
                setRecordedAudioUrl(null);
                setRecordedAudioBlob(null);
                setTimeout(() => fetchMessages(selectedConversationId, true), 1000); 
            } catch (error) {
                showToast("Erro ao enviar áudio.", 'error');
            }
            return;
        }

        if (!newMessage.trim()) return;
        const msgText = newMessage.trim();
        setNewMessage('');

        try {
            await sendMessage(instanceName, selectedConversationId, msgText);
            setTimeout(() => fetchMessages(selectedConversationId, true), 1000); 
        } catch (error) {
            showToast("Não foi possível enviar a mensagem.", 'error');
        }
    };
    
    return (
        <div className="flex h-full">
            <aside className="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col min-w-[320px]">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-indigo-50">Contatos</h2>
                    <button onClick={fetchChats} disabled={isLoading || whatsappStatus !== 'Conectado'} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 11v-5h-5m-1 1l-15-15"/>
                        </svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.map(convo => (
                        <button 
                            key={convo.id} 
                            onClick={() => { setSelectedConversationId(convo.id); cancelRecording(); }}
                            className={`w-full text-left p-4 flex items-center space-x-4 border-b border-gray-100 dark:border-gray-700/50 transition-all ${selectedConversationId === convo.id ? 'bg-primary/10 dark:bg-primary/20 border-l-4 border-l-primary' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 border-l-4 border-l-transparent'}`}
                        >
                            <div className="relative">
                                <img src={convo.avatarUrl} alt={convo.contactName} className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 object-cover shadow-sm border border-gray-100 dark:border-gray-600" />
                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5 shadow-sm">
                                    <svg viewBox="0 0 24 24" width="14" height="14" className="text-green-500 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-gray-900 dark:text-indigo-50 truncate text-sm">{convo.contactName}</h3>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{convo.timestamp}</span>
                                </div>
                                <div className="flex justify-between items-start mt-0.5">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate pr-2">{convo.lastMessage}</p>
                                    {convo.unreadCount > 0 && <span className="bg-green-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">{convo.unreadCount}</span>}
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
                            <img src={selectedConversation.avatarUrl} alt={selectedConversation.contactName} className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 object-cover border border-gray-100 dark:border-gray-600" />
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-indigo-50">{selectedConversation.contactName}</h3>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono uppercase tracking-tighter">{selectedConversation.id}</p>
                            </div>
                        </header>
                        
                        <div className="flex-1 p-6 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] dark:bg-none">
                           {isLoadingMessages ? (
                               <div className="flex justify-center items-center h-full">
                                   <div className="bg-white/80 dark:bg-gray-800 p-3 rounded-full shadow-lg">
                                       <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                                   </div>
                               </div>
                           ) : (
                               <div className="flex flex-col space-y-2">
                                   {messages.map((msg, idx) => (
                                       <div key={msg.id || idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                           <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm text-sm ${msg.sender === 'admin' ? 'bg-primary text-indigo-50 rounded-tr-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700'}`}>
                                               {msg.mediaUrl && (msg.mediaType === 'image' || msg.mediaType === 'sticker') && <div className="mb-2 -mx-1 -mt-1"><img src={msg.mediaUrl} alt="Media" className={`rounded-lg h-auto object-cover cursor-pointer hover:opacity-95 ${msg.mediaType === 'sticker' ? 'w-32' : 'max-w-full'}`} onClick={() => window.open(msg.mediaUrl, '_blank')}/></div>}
                                               {msg.mediaUrl && msg.mediaType === 'video' && <div className="mb-2 -mx-1 -mt-1"><video src={msg.mediaUrl} controls className="rounded-lg max-w-full h-auto" /></div>}
                                               {msg.mediaUrl && msg.mediaType === 'audio' && <div className="mb-2 min-w-[200px]"><audio src={msg.mediaUrl} controls className="w-full h-8" /></div>}
                                               {msg.mediaUrl && msg.mediaType === 'document' && <div className="mb-2 flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"><button onClick={() => window.open(msg.mediaUrl, '_blank')} className="text-left flex-1 hover:underline truncate"><span className="font-bold block truncate">Abrir Documento</span></button></div>}
                                               {msg.text && <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>}
                                               <span className={`text-[9px] mt-1 block text-right opacity-60 font-black uppercase`}>{msg.timestamp}</span>
                                           </div>
                                       </div>
                                   ))}
                                   <div ref={messagesEndRef} className="h-1" />
                               </div>
                           )}
                        </div>

                        <footer className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                            {isRecording ? (
                                <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 p-2 rounded-xl border border-red-100 dark:border-red-900/30 animate-pulse">
                                    <span className="text-sm font-bold text-red-600 dark:text-red-400 ml-4">Gravando: {formatTime(recordingTime)}</span>
                                    <div className="flex gap-2">
                                        <button onClick={cancelRecording} className="p-2 text-gray-500 hover:text-red-600 transition-colors"><TrashIcon className="w-5 h-5"/></button>
                                        <button onClick={stopRecording} className="p-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-colors"><StopIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            ) : recordedAudioUrl ? (
                                <div className="flex flex-col gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
                                    <audio src={recordedAudioUrl} controls className="w-full h-10" />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={cancelRecording} className="px-4 py-2 text-sm text-gray-500 hover:text-red-600">Cancelar</button>
                                        <button onClick={() => handleSendMessage()} className="bg-primary hover:bg-primary-dark text-indigo-50 font-bold py-2 px-6 rounded-lg text-sm shadow-lg active:scale-95">Enviar Áudio</button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite uma mensagem..." className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-xl py-3 px-4 text-sm text-gray-900 dark:text-indigo-50 focus:outline-none focus:ring-2 focus:ring-primary transition-all" disabled={whatsappStatus !== 'Conectado'} />
                                    <button type="button" onClick={startRecording} className="text-gray-500 hover:text-primary dark:hover:text-indigo-50 p-3 transition-colors" disabled={whatsappStatus !== 'Conectado'}><MicrophoneIcon className="w-6 h-6" /></button>
                                    <button type="submit" className="bg-primary hover:bg-primary-dark text-indigo-50 rounded-xl p-3 shadow-lg disabled:bg-gray-400" disabled={whatsappStatus !== 'Conectado' || !newMessage.trim()}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
                                </form>
                            )}
                        </footer>
                    </>
                ) : (
                   <div className="flex-1 flex items-center justify-center text-gray-500"><div className="text-center"><ChatIcon className="w-16 h-16 mx-auto mb-4 opacity-20" /><h2 className="text-xl font-bold text-gray-800 dark:text-white">{whatsappStatus !== 'Conectado' ? 'WhatsApp Desconectado' : 'Selecione uma conversa'}</h2></div></div>
                )}
            </main>
        </div>
    );
};

export default Chat;
