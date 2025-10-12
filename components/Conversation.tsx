// src/components/Conversation.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { ConversationSummary, Message, MessageReaction, Profile } from '../types';
import Spinner from './Spinner';
import { SendIcon, UserGroupIcon, PlusIcon, ImageIcon, XCircleIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, ReplyIcon, FaceSmileIcon } from './icons';
import { formatMessageTime } from '../utils/timeUtils';

// Re-add GifIcon for the input menu
const GifIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 8.25v7.5m6-7.5h-3.75m3.75 0a3.75 3.75 0 00-3.75-3.75H6.75A3.75 3.75 0 003 8.25v7.5A3.75 3.75 0 006.75 19.5h9A3.75 3.75 0 0019.5 15.75v-7.5A3.75 3.75 0 0015.75 4.5z" /></svg>);

import GifPickerModal from './GifPickerModal';
import LightBox from './lightbox';

const BackIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

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
    
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    
    const otherParticipant = conversation.type === 'dm'
      ? conversation.participants.find(p => p.user_id !== user?.id)
      : null;

    useEffect(() => {
        if (!user || currentConversationId.startsWith('placeholder_')) {
            setMessages([]); setLoading(false); return;
        }
        const fetchMessages = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('messages').select('*, profiles:sender_id (*)').eq('conversation_id', currentConversationId).order('created_at', { ascending: true });
            if (error) { console.error("Error fetching messages:", error); setLoading(false); return; }
            
            const fetchedMessages = (data as unknown as Message[]) || [];
            const messageIds = fetchedMessages.map(m => m.id);

            if (messageIds.length > 0) {
                const { data: reactionsData, error: reactionsError } = await supabase.from('message_reactions').select('*, profiles(*)').in('message_id', messageIds);
                if (reactionsError) console.error("Error fetching reactions:", reactionsError);
                
                const reactionsMap = new Map<number, MessageReaction[]>();
                (reactionsData || []).forEach(reaction => {
                    if (!reactionsMap.has(reaction.message_id)) reactionsMap.set(reaction.message_id, []);
                    reactionsMap.get(reaction.message_id)!.push(reaction as MessageReaction);
                });

                const messagesWithReactions = fetchedMessages.map(msg => ({ ...msg, reactions: reactionsMap.get(msg.id) || [] }));
                setMessages(messagesWithReactions);
            } else {
                setMessages([]);
            }
            setLoading(false);
        };
        fetchMessages();
    }, [currentConversationId, user]);
    
    useEffect(() => {
        if (!user || currentConversationId.startsWith('placeholder_')) return;
        
        const handleDbChange = async (payload: any) => {
            const { eventType, new: newRecord, old: oldRecord, table } = payload;
            
            if (table === 'messages') {
                 if (eventType === 'INSERT' && newRecord.sender_id !== user.id) {
                    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', newRecord.sender_id).single();
                    setMessages(prev => [...prev, { ...newRecord, profiles: profile as Profile, reactions: [] }]);
                } else if (eventType === 'UPDATE') {
                    setMessages(prev => prev.map(msg => msg.id === newRecord.id ? { ...msg, ...newRecord } : msg));
                }
            } else if (table === 'message_reactions') {
                if (eventType === 'INSERT') {
                    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', newRecord.user_id).single();
                    setMessages(prev => prev.map(msg => msg.id === newRecord.message_id ? { ...msg, reactions: [...msg.reactions, { ...newRecord, profiles: profile }] } : msg));
                } else if (eventType === 'DELETE') {
                    setMessages(prev => prev.map(msg => msg.id === oldRecord.message_id ? { ...msg, reactions: msg.reactions.filter(r => r.user_id !== oldRecord.user_id) } : msg));
                }
            }
        };

        const channel = supabase.channel(`conversation-realtime:${currentConversationId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${currentConversationId}` }, handleDbChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, handleDbChange)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentConversationId, user]);
    
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

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
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!user || (!newMessage.trim() && !imageFile && !media)) return;

        setIsUploading(true);
        let convId = currentConversationId;
        
        const tempMessageContent = newMessage;
        const tempImageFile = imageFile;
        const tempReplyingTo = replyingTo;
        
        resetInput();
        setReplyingTo(null);

        try {
            if (convId.startsWith('placeholder_') && otherParticipant) {
                const { data: newConversationId, error: rpcError } = await supabase
                    .rpc('create_dm_conversation', { recipient_id: otherParticipant.user_id });
                if (rpcError) throw rpcError;
                
                convId = newConversationId;
                onConversationCreated(conversation.conversation_id, newConversationId);
                setCurrentConversationId(newConversationId);
            }

            let messageData: any = { conversation_id: convId, sender_id: user.id, reply_to_message_id: tempReplyingTo?.id || null };
            
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

            setMessages(prev => [...prev, { ...(sentMessage as unknown as Message), reactions: [] }]);

        } catch (err: any) { 
            console.error("Failed to send message:", err);
            alert("Failed to send message.");
            setNewMessage(tempMessageContent);
            setImageFile(tempImageFile);
            setReplyingTo(tempReplyingTo);
        } finally { 
            setIsUploading(false); 
        }
    };
    
    const handleStartEdit = (message: Message) => { setEditingMessage(message); setEditingContent(message.content || ''); };
    const handleCancelEdit = () => { setEditingMessage(null); setEditingContent(''); };

    const handleSaveEdit = async () => {
        if (!editingMessage || !editingContent.trim()) return;
        const updatedMessage = { ...editingMessage, content: editingContent.trim(), is_edited: true };
        setMessages(prev => prev.map(msg => msg.id === editingMessage.id ? updatedMessage : msg));
        handleCancelEdit();
        await supabase.from('messages').update({ content: editingContent.trim(), is_edited: true }).eq('id', editingMessage.id);
    };

    const handleDeleteForEveryone = async (messageId: number) => {
        if (!window.confirm("Are you sure you want to delete this message for everyone?")) return;
        const updatedFields = { content: "This message was deleted", is_deleted: true, attachment_url: null, message_type: 'text' as const, };
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, ...updatedFields } : msg));
        await supabase.from('messages').update(updatedFields).eq('id', messageId);
    };

    const handleReaction = async (emoji: string, messageId: number) => {
        if (!user) return;
        const existingReaction = messages.find(m => m.id === messageId)?.reactions.find(r => r.user_id === user.id);

        if (existingReaction && existingReaction.emoji === emoji) {
            await supabase.from('message_reactions').delete().match({ message_id: messageId, user_id: user.id });
        } else {
            await supabase.from('message_reactions').upsert({ message_id: messageId, user_id: user.id, emoji }, { onConflict: 'message_id, user_id' });
        }
    };

    const groupedReactions = (reactions: MessageReaction[]) => {
        return reactions.reduce((acc, reaction) => {
            acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    };
    
    const renderHeader = () => {
        if (conversation.type === 'dm' && otherParticipant) {
            return (
                <Link to={`/profile/${otherParticipant.username}`} className="flex items-center space-x-3 group min-w-0">
                    <div className="relative">
                        <img 
                            src={otherParticipant.avatar_url || `https://ui-avatars.com/api/?name=${otherParticipant.full_name || otherParticipant.username}`} 
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-brand-green/20 group-hover:ring-brand-green/40 transition-all"
                            alt="avatar"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-lg text-text-main-light dark:text-text-main group-hover:text-brand-green dark:group-hover:text-brand-green transition-colors truncate">
                            {otherParticipant.full_name || otherParticipant.username}
                        </h3>
                        <p className="text-xs text-text-tertiary-light dark:text-text-tertiary">Active now</p>
                    </div>
                </Link>
            );
        }

        if (conversation.type === 'group') {
            return (
                <Link to={`/chat/group/${conversation.conversation_id}`} className="flex items-center space-x-3 group min-w-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-green to-green-600 flex items-center justify-center ring-2 ring-brand-green/20 group-hover:ring-brand-green/40 transition-all">
                        <UserGroupIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-lg text-text-main-light dark:text-text-main group-hover:text-brand-green dark:group-hover:text-brand-green transition-colors truncate">
                            {conversation.name}
                        </h3>
                        <p className="text-xs text-text-tertiary-light dark:text-text-tertiary">
                            {conversation.participants.length} members
                        </p>
                    </div>
                </Link>
            );
        }

        return null;
    };

    return (
        <div className="flex flex-col h-full">
            {isGifPickerOpen && <GifPickerModal onClose={() => setGifPickerOpen(false)} onGifSelect={handleGifSelect} />}
            {lightboxUrl && <LightBox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

            {/* Enhanced Header */}
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-3 bg-white dark:bg-gray-900 shadow-sm shrink-0">
                {onBack && (
                    <button 
                        onClick={onBack} 
                        className="md:hidden p-2 text-text-secondary dark:text-text-secondary hover:text-brand-green dark:hover:text-brand-green hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
                    >
                        <BackIcon className="w-5 h-5" />
                    </button>
                )}
                {renderHeader()}
            </div>

            {/* Messages Area with subtle pattern */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
                {loading ? ( 
                    <div className="flex justify-center items-center h-full">
                        <div className="text-center">
                            <Spinner />
                            <p className="mt-3 text-sm text-text-tertiary-light dark:text-text-tertiary">Loading messages...</p>
                        </div>
                    </div> 
                ) : messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-tertiary-light dark:bg-tertiary flex items-center justify-center">
                                <SendIcon className="w-10 h-10 text-brand-green" />
                            </div>
                            <h3 className="text-lg font-semibold text-text-main-light dark:text-text-main mb-2">No messages yet</h3>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary">Send a message to start the conversation</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.sender_id === user?.id;
                        const isEditing = editingMessage?.id === msg.id;
                        const originalMessage = msg.reply_to_message_id ? messages.find(m => m.id === msg.reply_to_message_id) : null;
                        
                        return (
                            <div key={msg.id} className={`group flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                {!isOwn && msg.profiles && ( 
                                    <img 
                                        src={msg.profiles.avatar_url || `https://ui-avatars.com/api/?name=${msg.profiles.username}`} 
                                        className="w-8 h-8 rounded-full mb-1 ring-2 ring-white dark:ring-gray-800 shadow-sm" 
                                        alt="avatar"
                                    /> 
                                )}
                                {isOwn && (
                                    <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        {formatMessageTime(msg.created_at)}
                                    </p>
                                )}
                                
                                <div className={`relative flex items-center gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`relative max-w-[70vw] md:max-w-[70%] rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                                        isOwn 
                                            ? 'bg-gradient-to-br from-brand-green to-green-500 text-black rounded-br-md' 
                                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md'
                                    }`}>
                                        {isEditing ? (
                                            <div className="p-3 w-72">
                                                <textarea 
                                                    value={editingContent} 
                                                    onChange={e => setEditingContent(e.target.value)}
                                                    className="w-full text-sm bg-black/10 dark:bg-white/10 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green resize-none text-black dark:text-white"
                                                    rows={Math.max(2, editingContent.split('\n').length)} 
                                                    autoFocus
                                                    onKeyDown={(e) => { 
                                                        if (e.key === 'Enter' && !e.shiftKey) { 
                                                            e.preventDefault(); 
                                                            handleSaveEdit(); 
                                                        } 
                                                        if (e.key === 'Escape') { 
                                                            handleCancelEdit(); 
                                                        } 
                                                    }}
                                                />
                                                <div className="flex justify-end items-center mt-2 space-x-2">
                                                    <button 
                                                        type="button" 
                                                        onClick={handleCancelEdit} 
                                                        className="py-1.5 px-3 text-xs font-medium rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={handleSaveEdit} 
                                                        className="py-1.5 px-3 text-xs font-medium rounded-lg bg-green-900/50 text-white hover:bg-green-900/70 transition-colors"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {originalMessage && (
                                                    <div className="px-3 pt-2 pb-1 opacity-80">
                                                        <div className="border-l-3 border-green-700/60 dark:border-green-400/60 pl-2.5 py-1 text-xs bg-black/5 dark:bg-white/5 rounded-r">
                                                            <p className="font-bold mb-0.5">{originalMessage.profiles?.full_name || 'User'}</p>
                                                            <p className="truncate opacity-80">{originalMessage.content || 'Media'}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {msg.is_deleted ? ( 
                                                    <p className="px-4 py-2.5 text-[15px] italic text-gray-500 dark:text-gray-500">
                                                        This message was deleted
                                                    </p>
                                                ) : msg.message_type === 'text' ? (
                                                    <div className="flex items-end px-4 py-2.5">
                                                        <p className="text-[15px] leading-relaxed break-words">{msg.content}</p>
                                                        {msg.is_edited && (
                                                            <span className="text-[10px] text-gray-600 dark:text-gray-400 ml-2 select-none self-end flex-shrink-0 opacity-70">
                                                                edited
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : msg.message_type === 'image' && msg.attachment_url ? ( 
                                                    <button 
                                                        onClick={() => setLightboxUrl(msg.attachment_url!)} 
                                                        className="block p-1.5 hover:opacity-95 transition-opacity"
                                                    >
                                                        <img 
                                                            src={msg.attachment_url} 
                                                            alt="attachment" 
                                                            className="rounded-xl max-w-xs md:max-w-sm max-h-80 object-cover" 
                                                        />
                                                    </button>
                                                ) : msg.message_type === 'gif' && msg.attachment_url ? ( 
                                                    <div className="p-1.5">
                                                        <img 
                                                            src={msg.attachment_url} 
                                                            alt="gif" 
                                                            className="rounded-xl max-w-xs md:max-w-sm" 
                                                        />
                                                    </div>
                                                ) : null}
                                            </>
                                        )}
                                        {msg.reactions && msg.reactions.length > 0 && (
                                            <div className={`absolute -bottom-5 flex gap-1 ${isOwn ? 'right-2' : 'left-2'}`}>
                                                {Object.entries(groupedReactions(msg.reactions)).map(([emoji, count]) => (
                                                    <button 
                                                        key={emoji} 
                                                        onClick={() => handleReaction(emoji, msg.id)} 
                                                        className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded-full text-xs font-medium shadow-lg border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform"
                                                    >
                                                        <span className="mr-1">{emoji}</span>
                                                        <span className="text-text-secondary-light dark:text-text-secondary">{count}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {!isEditing && !msg.is_deleted && (
                                        <div className={`flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isOwn ? '' : 'order-first'}`}>
                                            <div className="relative group/react">
                                                <button className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                                    <FaceSmileIcon className="w-4 h-4 text-text-tertiary-light dark:text-text-tertiary" />
                                                </button>
                                                <div className="absolute bottom-full mb-2 flex gap-1 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover/react:opacity-100 group-hover/react:visible z-10 transition-all">
                                                    {REACTION_EMOJIS.map(emoji => (
                                                        <button 
                                                            key={emoji} 
                                                            onClick={() => handleReaction(emoji, msg.id)} 
                                                            className="p-1 text-xl hover:scale-125 transition-transform rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <button 
                                                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" 
                                                onClick={() => setReplyingTo(msg)}
                                            >
                                                <ReplyIcon className="w-4 h-4 text-text-tertiary-light dark:text-text-tertiary" />
                                            </button>
                                            {isOwn && msg.message_type === 'text' && (
                                                <button 
                                                    className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" 
                                                    onClick={() => handleStartEdit(msg)}
                                                >
                                                    <PencilIcon className="w-4 h-4 text-text-tertiary-light dark:text-text-tertiary" />
                                                </button>
                                            )}
                                            {isOwn && (
                                                <button 
                                                    className="p-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" 
                                                    onClick={() => handleDeleteForEveryone(msg.id)}
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {!isOwn && (
                                    <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        {formatMessageTime(msg.created_at)}
                                    </p>
                                )}
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>
            
            {/* Enhanced Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
                 {replyingTo && (
                    <div className="mb-3 px-4 py-3 bg-gradient-to-r from-brand-green/10 to-green-500/10 dark:from-brand-green/20 dark:to-green-500/20 rounded-xl text-sm border-l-4 border-brand-green">
                        <div className="flex justify-between items-center">
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-brand-green mb-1">
                                    <ReplyIcon className="w-3 h-3 inline mr-1" />
                                    Replying to {replyingTo.profiles?.full_name}
                                </p>
                                <p className="text-text-secondary-light dark:text-text-secondary truncate">
                                    {replyingTo.content || "Media"}
                                </p>
                            </div>
                            <button 
                                onClick={() => setReplyingTo(null)}
                                className="ml-3 p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                            >
                                <XCircleIcon className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary" />
                            </button>
                        </div>
                    </div>
                )}
                {imagePreview && (
                    <div className="mb-3">
                        <div className="relative inline-block w-32 h-32 rounded-xl overflow-hidden shadow-lg border-2 border-brand-green/30">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                                onClick={resetInput} 
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transform hover:scale-110 transition-transform"
                            >
                                <XCircleIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <div className="group relative">
                        <button 
                            type="button" 
                            className="p-2.5 text-text-tertiary-light dark:text-text-tertiary rounded-full hover:bg-brand-green/10 hover:text-brand-green dark:hover:bg-brand-green/20 dark:hover:text-brand-green transition-all"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()} 
                                className="flex items-center w-full text-left space-x-3 px-4 py-3 hover:bg-brand-green/10 dark:hover:bg-brand-green/20 rounded-t-xl transition-colors"
                            >
                                <div className="p-2 bg-brand-green/20 rounded-lg">
                                    <ImageIcon className="w-5 h-5 text-brand-green"/>
                                </div>
                                <span className="font-medium">Image</span>
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setGifPickerOpen(true)} 
                                className="flex items-center w-full text-left space-x-3 px-4 py-3 hover:bg-brand-green/10 dark:hover:bg-brand-green/20 rounded-b-xl transition-colors"
                            >
                                <div className="p-2 bg-brand-green/20 rounded-lg">
                                    <GifIcon className="w-5 h-5 text-brand-green"/>
                                </div>
                                <span className="font-medium">GIF</span>
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
                        className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-brand-green rounded-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button 
                        type="submit" 
                        disabled={isUploading || (!newMessage.trim() && !imageFile)}
                        className="p-3 bg-gradient-to-br from-brand-green to-green-500 text-black rounded-full hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0"
                    >
                        {isUploading ? <Spinner /> : <SendIcon className="w-5 h-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Conversation;