// src/components/Conversation.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { ConversationSummary, Message, MessageReaction, Profile, PinnedMessage } from '../types';
import Spinner from './Spinner';
import { SendIcon, UserGroupIcon, PlusIcon, ImageIcon, XCircleIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, ReplyIcon, FaceSmileIcon, PinIcon } from './icons';
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

const ErrorIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
);

// --- NEW: Typing Indicator Component ---
const TypingIndicator: React.FC<{ users: { fullName: string | null }[] }> = ({ users }) => {
    if (users.length === 0) return null;

    let text;
    if (users.length === 1) {
        text = `${users[0].fullName || 'Someone'} is typing...`;
    } else if (users.length === 2) {
        text = `${users[0].fullName || 'Someone'} and ${users[1].fullName || 'Someone'} are typing...`;
    } else {
        text = 'Several people are typing...';
    }

    return (
        <div className="flex items-center space-x-2 px-4 py-2 text-sm text-text-tertiary-light dark:text-text-tertiary">
            <span>{text}</span>
            <div className="flex space-x-1">
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
        </div>
    );
};


// Fixed emoji encoding
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

// Extended emoji picker with categories
const EMOJI_PICKER_EMOJIS = [
  { category: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'] },
  { category: 'Gestures', emojis: ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '🙏', '🦶', '🦵', '🦿', '💄', '💋', '👄', '🦷', '👅', '👂', '🦻', '👃', '👣', '👁️', '👀', '🧠', '🫀', '🫁', '🦴', '👤', '👥'] },
  { category: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'] },
  { category: 'Animals', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'] },
  { category: 'Food', emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯'] },
  { category: 'Activities', emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏊', '🏄', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🎗️', '🎫', '🎟️', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩'] },
  { category: 'Travel', emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛽', '🚧', '🚦', '🚥', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🛖', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🕍', '🛕', '🕋'] },
  { category: 'Objects', emojis: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🪠', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧽', '🪣', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🪆', '🖼️', '🪞', '🪟', '🛍️', '🛒', '🎁', '🎈', '🎏', '🎀', '🪄', '🪅', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️', '🪧', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '🗒️', '🗓️', '📆', '📅', '🗑️', '📇', '🗃️', '🗳️', '🗄️', '📋', '📁', '📂', '🗂️', '🗞️', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇️', '📐', '📏', '🧮', '📌', '📍', '✂️', '🖊️', '🖋️', '✒️', '🖌️', '🖍️', '📝', '✏️', '🔍', '🔎', '🔏', '🔐', '🔒', '🔓'] },
];

interface ConversationProps {
  conversation: ConversationSummary;
  onBack?: () => void;
  onConversationCreated: (placeholderId: string, newConversationId: string) => void;
}

const Conversation: React.FC<ConversationProps> = ({ conversation, onBack, onConversationCreated }) => {
    const { user, profile } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isGifPickerOpen, setGifPickerOpen] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [emojiPickerMessageId, setEmojiPickerMessageId] = useState<number | null>(null);
    
    const [currentConversationId, setCurrentConversationId] = useState(conversation.conversation_id);
    
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    const [pinnedMessage, setPinnedMessage] = useState<PinnedMessage | null>(null);
    const [pinningOptions, setPinningOptions] = useState<{ messageId: number | null; x: number; y: number }>({ messageId: null, x: 0, y: 0 });
    const messageRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());

    // --- NEW: State for typing indicators ---
    const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; fullName: string | null }>>([]);
    const typingTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const otherParticipant = conversation.type === 'dm'
      ? conversation.participants.find(p => p.user_id !== user?.id)
      : null;

    useEffect(() => {
        if (!user || currentConversationId.startsWith('placeholder_')) {
            setMessages([]); setLoading(false); return;
        }

        const fetchPinnedMessage = async () => {
          const { data, error } = await supabase.rpc('get_pinned_message_for_conversation', { p_conversation_id: currentConversationId });
          if (error) console.error("Error fetching pinned message:", error);
          else setPinnedMessage(data);
        };

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
        fetchPinnedMessage();
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
                    setMessages(prev => prev.map(msg => 
                        msg.id === newRecord.message_id 
                            ? { ...msg, reactions: [...msg.reactions.filter(r => r.user_id !== newRecord.user_id), { ...newRecord, profiles: profile }] } 
                            : msg
                    ));
                } else if (eventType === 'DELETE') {
                    setMessages(prev => prev.map(msg => msg.id === oldRecord.message_id ? { ...msg, reactions: msg.reactions.filter(r => !(r.user_id === oldRecord.user_id && r.emoji === oldRecord.emoji)) } : msg));
                } else if (eventType === 'UPDATE') {
                    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', newRecord.user_id).single();
                    setMessages(prev => prev.map(msg => 
                        msg.id === newRecord.message_id 
                            ? { ...msg, reactions: msg.reactions.map(r => r.user_id === newRecord.user_id ? { ...newRecord, profiles: profile } : r) } 
                            : msg
                    ));
                }
            }
        };

        const channel = supabase.channel(`conversation-realtime:${currentConversationId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${currentConversationId}` }, handleDbChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, handleDbChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pinned_messages', filter: `conversation_id=eq.${currentConversationId}` }, async () => {
                const { data, error } = await supabase.rpc('get_pinned_message_for_conversation', { p_conversation_id: currentConversationId });
                if (error) console.error("Error refetching pinned message:", error);
                else setPinnedMessage(data);
            })
            // --- NEW: Listen for typing indicator broadcasts ---
            .on('broadcast', { event: 'typing' }, (payload) => {
                const { user: typingUser } = payload.payload;
                if (typingUser.userId === user.id) return;

                setTypingUsers(prev => {
                    const userExists = prev.some(u => u.userId === typingUser.userId);
                    if (userExists) return prev;
                    return [...prev, typingUser];
                });

                if (typingTimeoutRefs.current.has(typingUser.userId)) {
                    clearTimeout(typingTimeoutRefs.current.get(typingUser.userId));
                }

                const timeoutId = setTimeout(() => {
                    setTypingUsers(prev => prev.filter(u => u.userId !== typingUser.userId));
                    typingTimeoutRefs.current.delete(typingUser.userId);
                }, 3000);

                typingTimeoutRefs.current.set(typingUser.userId, timeoutId);
            })
            .subscribe();

        return () => { 
            supabase.removeChannel(channel); 
            // --- NEW: Clear all timeouts on unmount ---
            typingTimeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
        };
    }, [currentConversationId, user]);
    
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const resetInput = (keepImagePreview = false) => {
        setNewMessage('');
        setImageFile(null);
        if (imagePreview && !keepImagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        if (!keepImagePreview) {
            setImagePreview(null);
        }
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
        if (e) e.preventDefault();
        if (!user || !profile || (!newMessage.trim() && !imageFile && !media)) return;

        const tempId = Date.now();
        const tempImagePreview = imagePreview;
        
        const optimisticMessage: Message = {
            id: tempId,
            conversation_id: currentConversationId,
            sender_id: user.id,
            content: media?.type === 'gif' ? '[GIF]' : (imageFile ? '[Image]' : newMessage.trim()),
            created_at: new Date().toISOString(),
            message_type: media?.type === 'gif' ? 'gif' : (imageFile ? 'image' : 'text'),
            attachment_url: media?.url || tempImagePreview,
            profiles: profile,
            reply_to_message_id: replyingTo?.id || null,
            is_edited: false,
            is_deleted: false,
            reactions: [],
            status: 'sending',
        };
        setMessages(prev => [...prev, optimisticMessage]);

        const tempMessageContent = newMessage;
        const tempImageFile = imageFile;
        const tempReplyingTo = replyingTo;
        
        resetInput(true);
        setNewMessage('');
        setImageFile(null);
        setImagePreview(null);
        setReplyingTo(null);

        try {
            let convId = currentConversationId;
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
            
            setMessages(prev => prev.map(msg => msg.id === tempId ? { ...(sentMessage as unknown as Message), reactions: [] } : msg));

        } catch (err: any) { 
            console.error("Failed to send message:", err);
            setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, status: 'failed' } : msg));
        } finally {
            if (tempImagePreview) {
                URL.revokeObjectURL(tempImagePreview);
            }
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
        
        // Optimistic update
        setMessages(prev => prev.map(msg => {
            if (msg.id !== messageId) return msg;
            const existingReaction = msg.reactions.find(r => r.user_id === user.id);
            
            if (existingReaction && existingReaction.emoji === emoji) {
                // Remove reaction
                return { ...msg, reactions: msg.reactions.filter(r => r.user_id !== user.id) };
            } else if (existingReaction) {
                // Update existing reaction
                return { 
                    ...msg, 
                    reactions: msg.reactions.map(r => 
                        r.user_id === user.id 
                            ? { ...r, emoji }
                            : r
                    )
                };
            } else {
                // Add new reaction
                return { 
                    ...msg, 
                    reactions: [...msg.reactions, { 
                        message_id: messageId, 
                        user_id: user.id, 
                        emoji, 
                        created_at: new Date().toISOString(),
                        profiles: profile 
                    } as MessageReaction]
                };
            }
        }));
        
        const existingReaction = messages.find(m => m.id === messageId)?.reactions.find(r => r.user_id === user.id);

        if (existingReaction && existingReaction.emoji === emoji) {
            await supabase.from('message_reactions').delete().match({ message_id: messageId, user_id: user.id });
        } else {
            await supabase.from('message_reactions').upsert({ message_id: messageId, user_id: user.id, emoji }, { onConflict: 'message_id,user_id' });
        }
        
        setEmojiPickerMessageId(null);
    };

    const handlePinMessage = async (messageId: number, durationHours: number | null) => {
      if (!user) return;
  
      let expires_at = null;
      if (durationHours) {
        expires_at = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();
      }
  
      const { error } = await supabase.from('pinned_messages').upsert({
        conversation_id: currentConversationId,
        message_id: messageId,
        pinned_by_user_id: user.id,
        expires_at: expires_at,
      }, { onConflict: 'conversation_id' });
  
      if (error) {
        console.error("Failed to pin message:", error);
      } else {
        const { data: newPinnedMessage, error: rpcError } = await supabase.rpc('get_pinned_message_for_conversation', { p_conversation_id: currentConversationId });
        if (rpcError) {
          console.error("Error fetching newly pinned message:", rpcError);
        } else {
          setPinnedMessage(newPinnedMessage);
        }
      }
      setPinningOptions({ messageId: null, x: 0, y: 0 });
    };
  
    const handleUnpinMessage = async () => {
      if (!pinnedMessage) return;
      const { error } = await supabase.from('pinned_messages').delete().eq('id', pinnedMessage.id);
      if (error) {
        console.error("Failed to unpin message:", error);
      } else {
        setPinnedMessage(null);
      }
    };

    const handleTyping = () => {
        if (!user || !profile || !throttleTimeoutRef.current) {
            const channel = supabase.channel(`conversation-realtime:${currentConversationId}`);
            channel.send({
                type: 'broadcast',
                event: 'typing',
                payload: {
                    user: {
                        userId: user.id,
                        fullName: profile?.full_name || 'Someone'
                    }
                },
            });

            throttleTimeoutRef.current = setTimeout(() => {
                throttleTimeoutRef.current = null;
            }, 1500);
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
                <Link to={`/profile/${otherParticipant.username}`} className="flex items-center space-x-3 group min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                        <img 
                            src={otherParticipant.avatar_url || `https://ui-avatars.com/api/?name=${otherParticipant.full_name || otherParticipant.username}`} 
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-brand-green/20 group-hover:ring-brand-green/40 transition-all"
                            alt="avatar"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                    </div>
                    <div className="min-w-0 flex-1">
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
                <Link to={`/chat/group/${conversation.conversation_id}`} className="flex items-center space-x-3 group min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-green to-green-600 flex items-center justify-center ring-2 ring-brand-green/20 group-hover:ring-brand-green/40 transition-all flex-shrink-0">
                        <UserGroupIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-lg text-text-main-light dark:text-text-main group-hover:text-brand-green dark:group-hover:text-brand-green transition-colors truncate">
                            {conversation.name}
                        </h3>
                        {/* --- THIS IS THE FIX --- */}
                        {/* We add 1 to the participants length because the current user is not in that array */}
                        <p className="text-xs text-text-tertiary-light dark:text-text-tertiary">
                            {conversation.participants.length + 1} members
                        </p>
                        {/* --- END OF FIX --- */}
                    </div>
                </Link>
            );
        }

        return null;
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {isGifPickerOpen && <GifPickerModal onClose={() => setGifPickerOpen(false)} onGifSelect={handleGifSelect} />}
            {lightboxUrl && <LightBox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

            {pinningOptions.messageId !== null && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setPinningOptions({ messageId: null, x: 0, y: 0 })}
              >
                <div
                  className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden text-sm animate-fadeIn"
                  style={{ top: pinningOptions.y, left: pinningOptions.x }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="p-2 font-semibold border-b border-gray-200 dark:border-gray-700">Pin message for...</div>
                  <button onClick={() => handlePinMessage(pinningOptions.messageId!, 24)} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">24 hours</button>
                  <button onClick={() => handlePinMessage(pinningOptions.messageId!, 24 * 7)} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">7 days</button>
                  <button onClick={() => handlePinMessage(pinningOptions.messageId!, null)} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">Forever</button>
                </div>
              </div>
            )}

            {/* Global Emoji Picker Modal */}
            {emojiPickerMessageId !== null && (
                <div 
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setEmojiPickerMessageId(null)}
                >
                    <div 
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-text-main-light dark:text-text-main">Choose Emoji</h3>
                            <button 
                                onClick={() => setEmojiPickerMessageId(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <XCircleIcon className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary" />
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-4">
                            {EMOJI_PICKER_EMOJIS.map(({ category, emojis }) => (
                                <div key={category} className="mb-6">
                                    <h4 className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary mb-2 sticky top-0 bg-white dark:bg-gray-800 py-1">
                                        {category}
                                    </h4>
                                    <div className="grid grid-cols-8 gap-2">
                                        {emojis.map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => handleReaction(emoji, emojiPickerMessageId)}
                                                className="text-2xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all hover:scale-110 active:scale-95"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Header - Fixed positioning */}
            <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-3 bg-white dark:bg-gray-900 shadow-sm flex-shrink-0">
                {onBack && (
                    <button 
                        onClick={onBack} 
                        className="md:hidden p-2 text-text-secondary dark:text-text-secondary hover:text-brand-green dark:hover:text-brand-green hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all flex-shrink-0"
                    >
                        <BackIcon className="w-5 h-5" />
                    </button>
                )}
                {renderHeader()}
            </div>

            {pinnedMessage && (
              <div className="px-4 md:px-6 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between gap-4 animate-fadeIn">
                <div 
                    className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                    onClick={() => messageRefs.current.get(pinnedMessage.message_id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                >
                    <PinIcon className="w-4 h-4 text-brand-green flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-brand-green">Pinned Message</p>
                        <p className="text-sm truncate text-text-secondary-light dark:text-text-secondary">
                            {pinnedMessage.message.content || 'Media'}
                        </p>
                    </div>
                </div>
                <button onClick={handleUnpinMessage} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full flex-shrink-0">
                    <XCircleIcon className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary" />
                </button>
              </div>
            )}

            {/* Messages Area - Constrained width with proper overflow */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 py-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
                <div className="max-w-full space-y-3">
                    {loading ? ( 
                        <div className="flex justify-center items-center h-full min-h-[400px]">
                            <div className="text-center">
                                <Spinner />
                                <p className="mt-3 text-sm text-text-tertiary-light dark:text-text-tertiary">Loading messages...</p>
                            </div>
                        </div> 
                    ) : messages.length === 0 ? (
                        <div className="flex justify-center items-center h-full min-h-[400px]">
                            <div className="text-center max-w-sm">
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
                            const isSending = isOwn && msg.status === 'sending';
                            const hasFailed = isOwn && msg.status === 'failed';
                            
                            return (
                                <div 
                                    key={msg.id} 
                                    ref={el => messageRefs.current.set(msg.id, el)}
                                    className={`group flex items-end gap-2 w-full ${isOwn ? 'justify-end' : 'justify-start'} ${isSending ? 'opacity-60' : ''}`}
                                >
                                    {!isOwn && msg.profiles && ( 
                                        <img 
                                            src={msg.profiles.avatar_url || `https://ui-avatars.com/api/?name=${msg.profiles.username}`} 
                                            className="w-8 h-8 rounded-full mb-1 ring-2 ring-white dark:ring-gray-800 shadow-sm flex-shrink-0" 
                                            alt="avatar"
                                        /> 
                                    )}
                                    {isOwn && !hasFailed && (
                                        <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                                            {formatMessageTime(msg.created_at)}
                                        </p>
                                    )}
                                    {hasFailed && (
                                        <div className="text-red-500 mb-1.5 flex-shrink-0" title="Failed to send">
                                            <ErrorIcon />
                                        </div>
                                    )}
                                    
                                    <div className={`relative flex items-center gap-1 max-w-[85%] sm:max-w-[75%] md:max-w-[65%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`relative w-full rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                                            isOwn 
                                                ? 'bg-gradient-to-br from-brand-green to-green-500 text-black rounded-br-md' 
                                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md'
                                        }`}>
                                            {isEditing ? (
                                                <div className="p-3 w-full">
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
                                                            className="block p-1.5 hover:opacity-95 transition-opacity w-full"
                                                        >
                                                            <img 
                                                                src={msg.attachment_url} 
                                                                alt="attachment" 
                                                                className="rounded-xl w-full max-w-xs max-h-80 object-cover" 
                                                            />
                                                        </button>
                                                    ) : msg.message_type === 'gif' && msg.attachment_url ? ( 
                                                        <div className="p-1.5">
                                                            <img 
                                                                src={msg.attachment_url} 
                                                                alt="gif" 
                                                                className="rounded-xl w-full max-w-xs" 
                                                            />
                                                        </div>
                                                    ) : null}
                                                </>
                                            )}
                                            {msg.reactions && msg.reactions.length > 0 && (
                                                <div className={`absolute -bottom-6 flex gap-1 flex-wrap ${isOwn ? 'right-2' : 'left-2'}`}>
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
                                            <div className={`flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0 ${isOwn ? '' : 'order-first'}`}>
                                                <div className="relative group/react">
                                                    <button className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                                        <FaceSmileIcon className="w-4 h-4 text-text-tertiary-light dark:text-text-tertiary" />
                                                    </button>
                                                    <div className={`absolute bottom-full mb-2 flex gap-1 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover/react:opacity-100 group-hover/react:visible z-10 transition-all ${isOwn ? 'right-0' : 'left-0'}`}>
                                                        {REACTION_EMOJIS.map(emoji => (
                                                            <button 
                                                                key={emoji} 
                                                                onClick={() => handleReaction(emoji, msg.id)} 
                                                                className="p-1 text-xl hover:scale-125 transition-transform rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                        <button 
                                                            onClick={() => setEmojiPickerMessageId(msg.id)}
                                                            className="p-1 text-xl hover:scale-125 transition-transform rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 border-l border-gray-200 dark:border-gray-600 pl-2"
                                                        >
                                                            <PlusIcon className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary" />
                                                        </button>
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
                                                <button
                                                    className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                    onClick={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setPinningOptions({ messageId: msg.id, x: rect.left - 150, y: rect.top - 120 });
                                                    }}
                                                >
                                                    <PinIcon className="w-4 h-4 text-text-tertiary-light dark:text-text-tertiary" />
                                                </button>
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
                                        <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                                            {formatMessageTime(msg.created_at)}
                                        </p>
                                    )}
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                    <TypingIndicator users={typingUsers} />
                </div>
            </div>
            
            {/* Enhanced Input Area - Fixed at bottom */}
            <div className="px-4 md:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
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
                                className="ml-3 p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
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
                                onClick={() => resetInput()} 
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transform hover:scale-110 transition-transform"
                            >
                                <XCircleIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <div className="group relative flex-shrink-0">
                        <button 
                            type="button" 
                            className="p-2.5 text-text-tertiary-light dark:text-text-tertiary rounded-full hover:bg-brand-green/10 hover:text-brand-green dark:hover:bg-brand-green/20 dark:hover:text-brand-green transition-all"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 whitespace-nowrap">
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()} 
                                className="flex items-center w-full text-left space-x-3 px-4 py-3 hover:bg-brand-green/10 dark:hover:bg-brand-green/20 rounded-t-xl transition-colors"
                            >
                                <div className="p-2 bg-brand-green/20 rounded-lg flex-shrink-0">
                                    <ImageIcon className="w-5 h-5 text-brand-green"/>
                                </div>
                                <span className="font-medium">Image</span>
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setGifPickerOpen(true)} 
                                className="flex items-center w-full text-left space-x-3 px-4 py-3 hover:bg-brand-green/10 dark:hover:bg-brand-green/20 rounded-b-xl transition-colors"
                            >
                                <div className="p-2 bg-brand-green/20 rounded-lg flex-shrink-0">
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
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                        }}
                        placeholder="Type a message..."
                        disabled={!!imagePreview}
                        className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-brand-green rounded-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim() && !imageFile}
                        className="p-3 bg-gradient-to-br from-brand-green to-green-500 text-black rounded-full hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Conversation;