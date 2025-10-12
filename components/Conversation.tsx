// src/components/Conversation.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { ConversationSummary, Message, Profile } from '../types';
import Spinner from './Spinner';
import { SendIcon, UserGroupIcon, PlusIcon, ImageIcon, XCircleIcon } from './icons';

// Re-add GifIcon for the input menu
const GifIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 8.25v7.5m6-7.5h-3.75m3.75 0a3.75 3.75 0 00-3.75-3.75H6.75A3.75 3.75 0 003 8.25v7.5A3.75 3.75 0 006.75 19.5h9A3.75 3.75 0 0019.5 15.75v-7.5A3.75 3.75 0 0015.75 4.5z" /></svg>);

import GifPickerModal from './GifPickerModal';
import LightBox from './lightbox';

const BackIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

interface ConversationProps {
  conversation: ConversationSummary;
  onBack?: () => void;
  onConversationCreated: (placeholderId: string, newConversationId: string) => void;
}

const Conversation: React.FC<ConversationProps> = ({ conversation, onBack, onConversationCreated }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isGifPickerOpen, setGifPickerOpen] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    
    const [currentConversationId, setCurrentConversationId] = useState(conversation.conversation_id);
    
    const otherParticipant = conversation.type === 'dm'
      ? conversation.participants.find(p => p.user_id !== user?.id)
      : null;

    useEffect(() => {
        if (!user || currentConversationId.startsWith('placeholder_')) {
            setMessages([]);
            setLoading(false);
            return;
        }
        const fetchMessages = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('messages')
                .select('*, profiles:sender_id (*)')
                .eq('conversation_id', currentConversationId)
                .order('created_at', { ascending: true });

            if (error) console.error("Error fetching messages:", error);
            else setMessages(data as unknown as Message[]);
            
            setLoading(false);
        };
        fetchMessages();
    }, [currentConversationId, user]);
    
    useEffect(() => {
        if (!user || currentConversationId.startsWith('placeholder_')) return;
        
        const channel = supabase.channel(`conversation:${currentConversationId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages', 
                filter: `conversation_id=eq.${currentConversationId}` 
            }, async (payload) => {
                const newMsgRaw = payload.new;
                if (newMsgRaw.sender_id === user.id) return;
                
                const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', newMsgRaw.sender_id).single();
                const newMsg: Message = { ...newMsgRaw, profiles: profile as Profile };
                setMessages((prev) => [...prev, newMsg]);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentConversationId, user]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const resetInput = () => {
        setNewMessage('');
        setImageFile(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            resetInput();
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleGifSelect = (gifUrl: string) => {
        setGifPickerOpen(false);
        handleSendMessage(undefined, { type: 'gif', url: gifUrl });
    };

    const handleSendMessage = async (e?: React.FormEvent, media?: { type: 'gif'; url: string }) => {
        e?.preventDefault();
        if (!user || (!newMessage.trim() && !imageFile && !media)) return;

        setIsUploading(true);
        let convId = currentConversationId;
        
        const tempMessageContent = newMessage;
        const tempImageFile = imageFile;
        resetInput();

        try {
            if (convId.startsWith('placeholder_') && otherParticipant) {
                const { data: newConversationId, error: rpcError } = await supabase
                    .rpc('create_dm_conversation', { recipient_id: otherParticipant.user_id });
                if (rpcError) throw rpcError;
                
                convId = newConversationId;
                onConversationCreated(conversation.conversation_id, newConversationId);
                setCurrentConversationId(newConversationId);
            }

            let messageData: any = { conversation_id: convId, sender_id: user.id };
            
            if (media?.type === 'gif') {
                messageData = { ...messageData, message_type: 'gif', attachment_url: media.url, content: '[GIF]' };
            } else if (tempImageFile) {
                const fileExt = tempImageFile.name.split('.').pop();
                const filePath = `${user.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, tempImageFile);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
                messageData = { ...messageData, message_type: 'image', attachment_url: publicUrl, content: '[Image]' };
            } else {
                messageData = { ...messageData, message_type: 'text', content: tempMessageContent.trim() };
            }
            
            const { data: sentMessage, error } = await supabase.from('messages').insert(messageData).select('*, profiles:sender_id (*)').single();
            if (error) throw error;

            setMessages(prev => [...prev, sentMessage as unknown as Message]);

        } catch (err: any) { 
            console.error("Failed to send message:", err);
            alert("Failed to send message.");
            setNewMessage(tempMessageContent);
            setImageFile(tempImageFile);
        } finally { 
            setIsUploading(false); 
        }
    };
    
    const renderHeader = () => { /* ... same as before ... */ };

    return (
        <div className="flex flex-col h-full">
            {isGifPickerOpen && <GifPickerModal onClose={() => setGifPickerOpen(false)} onGifSelect={handleGifSelect} />}
            {lightboxUrl && <LightBox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shrink-0">
                {onBack && <button onClick={onBack} className="md:hidden p-1 text-text-secondary dark:text-text-secondary hover:text-text-main dark:hover:text-text-main"><BackIcon /></button>}
                {renderHeader()}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                {loading ? ( <div className="flex justify-center pt-10"><Spinner /></div> ) : (
                    messages.map((msg) => {
                        const isOwn = msg.sender_id === user?.id;
                        return (
                            <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                {!isOwn && msg.profiles && (
                                    <img 
                                        src={msg.profiles.avatar_url || `https://ui-avatars.com/api/?name=${msg.profiles.username}`} 
                                        className="w-8 h-8 rounded-full mb-1"
                                        alt="avatar"
                                    />
                                )}
                                <div className={`max-w-[70%] rounded-2xl ${
                                    isOwn 
                                        ? 'bg-brand-green text-black rounded-br-none' 
                                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-none'
                                }`}>
                                    {msg.message_type === 'text' && <p className="px-4 py-2.5 text-[15px] break-words">{msg.content}</p>}
                                    {msg.message_type === 'image' && msg.attachment_url && (
                                        <button onClick={() => setLightboxUrl(msg.attachment_url!)} className="block p-1">
                                            <img src={msg.attachment_url} alt="attachment" className="rounded-xl max-w-xs md:max-w-sm max-h-80 object-cover" />
                                        </button>
                                    )}
                                    {msg.message_type === 'gif' && msg.attachment_url && (
                                        <div className="p-1">
                                            <img src={msg.attachment_url} alt="gif" className="rounded-xl max-w-xs md:max-w-sm" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
                {imagePreview && (
                    <div className="mb-3">
                        <div className="relative inline-block w-28 h-28 rounded-xl overflow-hidden shadow-lg">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <button onClick={resetInput} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg">
                                <XCircleIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <div className="group relative">
                        <button type="button" className="p-2.5 text-text-tertiary-light dark:text-text-tertiary rounded-full hover:bg-tertiary-light dark:hover:bg-tertiary transition-all">
                            <PlusIcon className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-secondary border border-tertiary-light dark:border-tertiary rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center w-full text-left space-x-3 px-4 py-3 hover:bg-tertiary-light dark:hover:bg-tertiary rounded-t-xl">
                                <ImageIcon className="w-5 h-5 text-brand-green"/> <span>Image</span>
                            </button>
                            <button type="button" onClick={() => setGifPickerOpen(true)} className="flex items-center w-full text-left space-x-3 px-4 py-3 hover:bg-tertiary-light dark:hover:bg-tertiary rounded-b-xl">
                                <GifIcon className="w-5 h-5 text-brand-green"/> <span>GIF</span>
                            </button>
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" hidden />
                    
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={!!imagePreview}
                        className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-brand-green rounded-full text-gray-900 dark:text-white focus:outline-none transition-colors disabled:opacity-50"
                    />
                    <button 
                        type="submit" 
                        disabled={isUploading || (!newMessage.trim() && !imageFile)}
                        className="p-2 bg-brand-green text-black rounded-full hover:bg-brand-green-darker transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                        {isUploading ? <Spinner /> : <SendIcon className="w-5 h-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Conversation;