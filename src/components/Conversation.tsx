// src/components/Conversation.tsx
//1000 lines of code!

import React, { useState, useEffect, useRef, useMemo } from 'react';
// FIXED: Use Next.js Link
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { ConversationSummary, Message, MessageReaction, PinnedMessage } from '../types';
import MessageSkeleton from './MessageSkeleton';
import { SendIcon, UserGroupIcon, PlusIcon, ImageIcon, XCircleIcon, PencilIcon, TrashIcon, CheckIcon, ReplyIcon, FaceSmileIcon, PinIcon, BackIcon } from './icons';
import { formatMessageTime } from '../utils/timeUtils';
import GifPickerModal from './GifPickerModal';
import LightBox from './lightbox';

// Re-add GifIcon for the input menu
const GifIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 8.25v7.5m6-7.5h-3.75m3.75 0a3.75 3.75 0 00-3.75-3.75H6.75A3.75 3.75 0 003 8.25v7.5A3.75 3.75 0 006.75 19.5h9A3.75 3.75 0 0019.5 15.75v-7.5A3.75 3.75 0 0015.75 4.5z" /></svg>);

const ErrorIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
);

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

// utility: shallow-equality for message lists (compares ids and updated/created timestamps)
const messagesEqual = (a: Message[], b: Message[]) => {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        const ai = a[i];
        const bi = b[i];
        if (ai.id !== bi.id) return false;
        const aTime = (ai as { updated_at?: string; created_at: string }).updated_at || ai.created_at;
        const bTime = (bi as { updated_at?: string; created_at: string }).updated_at || bi.created_at;
        if (aTime !== bTime) return false;
    }
    return true;
};

const mapShallowEqual = (a: Map<string, string>, b: Map<string, string>) => {
    if (a === b) return true;
    if (a.size !== b.size) return false;
    for (const [k, v] of a) {
        if (!b.has(k) || b.get(k) !== v) return false;
    }
    return true;
};

const Conversation: React.FC<ConversationProps> = ({ conversation, onBack, onConversationCreated }) => {
    const { user, profile } = useAuth();
    const { latestMessage, onlineUsers } = useChat();
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesRef = useRef<Message[]>([]);
    useEffect(() => { messagesRef.current = messages; }, [messages]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [isGifPickerOpen, setGifPickerOpen] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [emojiPickerMessageId, setEmojiPickerMessageId] = useState<number | null>(null);

    const [currentConversationId, setCurrentConversationId] = useState(conversation.conversation_id);

    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    const [pinnedMessage, setPinnedMessage] = useState<PinnedMessage | null>(null);
    const pinnedMessageRef = useRef<PinnedMessage | null>(null);
    useEffect(() => { pinnedMessageRef.current = pinnedMessage; }, [pinnedMessage]);
    const [pinningOptions, setPinningOptions] = useState<{ messageId: number | null; x: number; y: number }>({ messageId: null, x: 0, y: 0 });
    const messageRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());

    const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; fullName: string | null }>>([]);
    const typingTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [readTimestamps, setReadTimestamps] = useState<Map<string, string>>(new Map());
    const readTimestampsRef = useRef<Map<string, string>>(readTimestamps);
    useEffect(() => { readTimestampsRef.current = readTimestamps; }, [readTimestamps]);



    const setMessagesIfDifferent = React.useCallback((next: Message[] | ((prev: Message[]) => Message[])) => {
        if (typeof next === 'function') {
            setMessages(prev => {
                const candidate = next(prev); // Removed unnecessary 'as' cast
                const changed = !messagesEqual(prev, candidate);
                if (changed) console.debug('[Conversation] setMessagesIfDifferent -> updating messages', { prevLength: prev.length, nextLength: candidate.length });
                return changed ? candidate : prev;
            });
        } else {
            setMessages(prev => {
                const candidate = next; // Removed unnecessary 'as' cast
                const changed = !messagesEqual(prev, candidate);
                if (changed) console.debug('[Conversation] setMessagesIfDifferent -> replacing messages', { prevLength: prev.length, nextLength: candidate.length });
                return changed ? candidate : prev;
            });
        }
    }, []);

    const setPinnedMessageIfDifferent = React.useCallback((next: PinnedMessage | null) => {
        const prev = pinnedMessageRef.current;
        const same = (prev === next) || (prev && next && prev.id === next.id && prev.message_id === next.message_id);
        if (!same) {
            console.debug('[Conversation] setPinnedMessageIfDifferent -> updating pinned message', { prev: prev?.id, next: next?.id });
            setPinnedMessage(next);
        }
    }, []);

    const setReadTimestampsIfDifferent = React.useCallback((next: Map<string, string>) => {
        if (!mapShallowEqual(readTimestampsRef.current, next)) {
            console.debug('[Conversation] setReadTimestampsIfDifferent -> updating read timestamps', { prevSize: readTimestampsRef.current.size, nextSize: next.size });
            setReadTimestamps(next);
        }
    }, []);

    const otherParticipant = conversation.type === 'dm'
        ? conversation.participants.find(p => p.user_id !== user?.id)
        : null;

    // --- THIS IS THE FIX ---
    // A user is "online" if they are globally present OR currently typing in this chat.
    const isPresent = otherParticipant ? onlineUsers.has(otherParticipant.user_id) : false;
    const isTyping = otherParticipant ? typingUsers.some(u => u.userId === otherParticipant.user_id) : false;
    const isEffectivelyOnline = isPresent || isTyping;

    useEffect(() => {
        // Ensure any conversation-specific overlays are closed when conversation changes
        console.debug('[Conversation] overlay reset effect for conversation', conversation.conversation_id);
        setEmojiPickerMessageId(null);
        setPinningOptions({ messageId: null, x: 0, y: 0 });
        setGifPickerOpen(false);
        setLightboxUrl(null);
    }, [conversation.conversation_id]);

    useEffect(() => {
        console.debug('[Conversation] fetch messages effect', { currentConversationId, userId: user?.id });

        if (!user || currentConversationId.startsWith('placeholder_')) {
            setMessages([]); setLoading(false); return;
        }

        const fetchPinnedMessage = async () => {
            const { data, error } = await supabase.rpc('get_pinned_message_for_conversation', { p_conversation_id: currentConversationId });
            if (error) console.error("Error fetching pinned message:", error);
            else setPinnedMessageIfDifferent(data);
        };

        const fetchReadTimestamps = async () => {
            const allParticipantIds = [user.id, ...conversation.participants.map(p => p.user_id)];
            const { data, error } = await supabase
                .from('conversation_read_timestamps')
                .select('user_id, last_read_at')
                .in('user_id', allParticipantIds)
                .eq('conversation_id', currentConversationId);

            if (error) {
                console.error("Error fetching read timestamps:", error);
            } else {
                const timestampsMap = new Map<string, string>();
                data.forEach(ts => timestampsMap.set(ts.user_id, ts.last_read_at));
                setReadTimestampsIfDifferent(timestampsMap);
            }
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
                setMessagesIfDifferent(messagesWithReactions);
            } else {
                setMessagesIfDifferent([]);
            }
            setLoading(false);
        };
        fetchMessages();
        fetchPinnedMessage();
        fetchReadTimestamps();
    }, [currentConversationId, user?.id, conversation.participants, setMessagesIfDifferent, setPinnedMessageIfDifferent, setReadTimestampsIfDifferent]);

    useEffect(() => {
        console.debug('[Conversation] latestMessage effect', { latestMessageId: latestMessage?.id, currentConversationId });
        if (!latestMessage) return;
        if (latestMessage.conversation_id !== currentConversationId || latestMessage.sender_id === user?.id) return;
        // Use messagesRef to avoid stale closure and only append when necessary
        const alreadyHas = messagesRef.current.some(m => m.id === latestMessage.id);
        if (alreadyHas) return;

        const fetchProfileAndSetMessage = async () => {
            const { data: senderProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', latestMessage.sender_id)
                .single();

            const newMsg: Message = { ...latestMessage, profiles: senderProfile || null, reactions: [] };
            setMessagesIfDifferent(prev => [...prev, newMsg]);
        };
        fetchProfileAndSetMessage();
    }, [latestMessage, currentConversationId, user?.id, setMessagesIfDifferent]);



    useEffect(() => {
        console.debug('[Conversation] realtime subscription effect', { currentConversationId, userId: user?.id });
        if (!user || currentConversationId.startsWith('placeholder_')) return;

        const handleDbChange = async (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown>; table: string }) => {
            const { eventType, new: newRecord, old: oldRecord, table } = payload;

            if (table === 'messages') {
                if (eventType === 'UPDATE') {
                    setMessages(prev => {
                        const candidate = prev.map(msg => msg.id === newRecord.id ? { ...msg, ...newRecord } : msg);
                        return messagesEqual(prev, candidate) ? prev : candidate;
                    });
                }
            } else if (table === 'message_reactions') {
                if (eventType === 'INSERT') {
                    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', newRecord.user_id).single();
                    const newReaction = { ...newRecord, profiles: profile } as unknown as MessageReaction;
                    setMessages(prev => {
                        const candidate = prev.map(msg =>
                            msg.id === (newRecord as unknown as MessageReaction).message_id
                                ? { ...msg, reactions: [...msg.reactions.filter(r => r.user_id !== (newRecord as unknown as MessageReaction).user_id), newReaction] }
                                : msg
                        );
                        return messagesEqual(prev, candidate) ? prev : candidate;
                    });
                } else if (eventType === 'DELETE') {
                    setMessages(prev => {
                        const candidate = prev.map(msg => msg.id === (oldRecord as unknown as MessageReaction).message_id ? { ...msg, reactions: msg.reactions.filter(r => !(r.user_id === (oldRecord as unknown as MessageReaction).user_id && r.emoji === (oldRecord as unknown as MessageReaction).emoji)) } : msg);
                        return messagesEqual(prev, candidate) ? prev : candidate;
                    });
                } else if (eventType === 'UPDATE') {
                    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', newRecord.user_id).single();
                    const updatedReaction = { ...newRecord, profiles: profile } as unknown as MessageReaction;
                    setMessages(prev => {
                        const candidate = prev.map(msg =>
                            msg.id === (newRecord as unknown as MessageReaction).message_id
                                ? { ...msg, reactions: msg.reactions.map(r => r.user_id === (newRecord as unknown as MessageReaction).user_id ? updatedReaction : r) }
                                : msg
                        );
                        return messagesEqual(prev, candidate) ? prev : candidate;
                    });
                }
            }
        };

        const channel = supabase.channel(`conversation - realtime:${currentConversationId} `)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id = eq.${currentConversationId} ` }, handleDbChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, handleDbChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pinned_messages', filter: `conversation_id = eq.${currentConversationId} ` }, async () => {
                const { data, error } = await supabase.rpc('get_pinned_message_for_conversation', { p_conversation_id: currentConversationId });
                if (error) console.error("Error refetching pinned message:", error);
                else setPinnedMessageIfDifferent(data);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_read_timestamps', filter: `conversation_id = eq.${currentConversationId} ` }, (payload) => {
                const newTimestamp = payload.new as { user_id: string, last_read_at: string };
                setReadTimestamps(prev => {
                    const next = new Map(prev) as Map<string, string>;
                    next.set(newTimestamp.user_id, newTimestamp.last_read_at);
                    return mapShallowEqual(prev, next) ? prev : next;
                });
            })
            .on('broadcast', { event: 'typing' }, (payload) => {
                const { user: typingUser } = payload.payload;
                if (typingUser.userId === user.id) return;

                setTypingUsers(prev => {
                    const userExists = prev.some(u => u.userId === typingUser.userId);
                    if (userExists) return prev;
                    const candidate = [...prev, typingUser];
                    if (prev.length === candidate.length && prev.every((p, i) => p.userId === candidate[i].userId)) return prev;
                    return candidate;
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
            typingTimeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
        };
    }, [currentConversationId, user?.id, setPinnedMessageIfDifferent, setMessages, setReadTimestamps, setTypingUsers, typingTimeoutRefs, mapShallowEqual]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const resetInput = (keepImagePreview = false) => {
        setImageFile(null);
        setAttachedFile(null);
        if (imagePreview && !keepImagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        if (!keepImagePreview) {
            setImagePreview(null);
        }
    };

    const getFileType = (file: File): 'image' | 'video' | 'audio' | 'document' | 'file' => {
        const type = file.type;
        if (type.startsWith('image/')) return 'image';
        if (type.startsWith('video/')) return 'video';
        if (type.startsWith('audio/')) return 'audio';
        if (type === 'application/pdf' ||
            type === 'application/msword' ||
            type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            type === 'application/vnd.ms-excel' ||
            type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            type === 'application/vnd.ms-powerpoint' ||
            type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
            return 'document';
        }
        return 'file';
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'file') => {
        if (e.target.files && e.target.files[0]) {
            resetInput();
            const file = e.target.files[0];

            // Validate file size (50MB limit)
            const maxSize = 50 * 1024 * 1024; // 50MB
            if (file.size > maxSize) {
                alert('File size must be less than 50MB');
                return;
            }

            if (fileType === 'image' || file.type.startsWith('image/')) {
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
            } else {
                setAttachedFile(file);
            }
        }
    };

    const handleGifSelect = (gifUrl: string) => {
        setGifPickerOpen(false);
        handleSendMessage(undefined, { type: 'gif', url: gifUrl });
    };

    const handleSendMessage = async (e?: React.FormEvent, media?: { type: 'gif'; url: string }) => {
        if (e) e.preventDefault();
        if (!user || !profile || (!newMessage.trim() && !imageFile && !attachedFile && !media)) return;

        const tempId = Date.now();
        const tempImagePreview = imagePreview;
        const tempFile = imageFile || attachedFile;
        const fileType = tempFile ? getFileType(tempFile) : null;

        const optimisticMessage: Message = {
            id: tempId,
            conversation_id: currentConversationId,
            sender_id: user.id,
            content: media?.type === 'gif' ? '[GIF]' : (tempFile ? `[${fileType?.toUpperCase()}]` : newMessage.trim()),
            created_at: new Date().toISOString(),
            message_type: media?.type === 'gif' ? 'gif' : (fileType || 'text'),
            attachment_url: media?.url || tempImagePreview,
            file_name: tempFile?.name,
            file_size: tempFile?.size,
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
        const tempAttachedFile = attachedFile;
        const tempReplyingTo = replyingTo;

        resetInput(true);
        setNewMessage('');
        setImageFile(null);
        setImagePreview(null);
        setAttachedFile(null);
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

            type MessageData = {
                conversation_id: string;
                sender_id: string;
                reply_to_message_id: number | null;
                message_type?: 'text' | 'image' | 'gif' | 'video' | 'audio' | 'document' | 'file';
                content?: string;
                attachment_url?: string;
                file_name?: string;
                file_size?: number;
            };

            let messageData: MessageData = {
                conversation_id: convId,
                sender_id: user.id,
                reply_to_message_id: tempReplyingTo?.id || null
            };

            if (media?.type === 'gif') {
                messageData = { ...messageData, message_type: 'gif', attachment_url: media.url, content: '[GIF]' };
            } else if (tempImageFile || tempAttachedFile) {
                const fileToUpload = tempImageFile || tempAttachedFile!;
                const fileExt = fileToUpload.name.split('.').pop();
                const filePath = `${user.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, fileToUpload);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);

                const detectedFileType = getFileType(fileToUpload);
                messageData = {
                    ...messageData,
                    message_type: detectedFileType,
                    attachment_url: publicUrl,
                    content: `[${detectedFileType.toUpperCase()}]`,
                    file_name: fileToUpload.name,
                    file_size: fileToUpload.size
                };
            } else {
                messageData = { ...messageData, message_type: 'text', content: tempMessageContent.trim() };
            }

            const { data: sentMessage, error } = await supabase.from('messages').insert(messageData).select('*, profiles:sender_id (*)').single();
            if (error) throw error;

            setMessages(prev => prev.map(msg => msg.id === tempId ? { ...(sentMessage as unknown as Message), reactions: [] } : msg));

        } catch (err: unknown) {
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
        const updatedFields = { content: "This message was deleted", is_deleted: true, attachment_url: null, message_type: 'text' as const, file_name: null, file_size: null };
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
                setPinnedMessageIfDifferent(newPinnedMessage);
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
            setPinnedMessageIfDifferent(null);
        }
    };

    const handleTyping = () => {
        // Don't do anything if user/profile missing
        if (!user || !profile) return;
        // If we're currently throttled, skip sending
        if (throttleTimeoutRef.current) return;

        // Send a typing broadcast on the conversation channel (fire-and-forget)
        try {
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
            }).catch(() => { });
        } catch {
            // ignore
        }

        throttleTimeoutRef.current = setTimeout(() => {
            throttleTimeoutRef.current = null;
        }, 1500);
    };

    const readersOfLastMessage = useMemo(() => {
        if (!user) return [];

        const lastOwnMessage = [...messages].reverse().find(msg => msg.sender_id === user.id && msg.status !== 'sending');
        if (!lastOwnMessage) return [];

        return conversation.participants.filter(participant => {
            const lastReadTime = readTimestamps.get(participant.user_id);
            if (!lastReadTime) return false;
            return new Date(lastReadTime) >= new Date(lastOwnMessage.created_at);
        });
    }, [messages, readTimestamps, user, conversation.participants]);

    const groupedReactions = (reactions: MessageReaction[]) => {
        return reactions.reduce((acc, reaction) => {
            acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    };

    const renderHeader = () => {
        if (conversation.type === 'dm' && otherParticipant) {
            return (
                // FIXED: Link to href
                <Link href={`/profile/${otherParticipant.username}`} className="flex items-center space-x-3 group min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                        <Image
                            src={otherParticipant.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant.full_name || otherParticipant.username)}`}
                            className="rounded-full object-cover ring-2 ring-brand-green/20 group-hover:ring-brand-green/40 transition-all"
                            alt="avatar"
                            width={44}
                            height={44}
                            unoptimized
                        />
                        {isEffectivelyOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-secondary-light dark:border-secondary"></div>}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-lg text-text-main-light dark:text-text-main group-hover:text-brand-green dark:group-hover:text-brand-green transition-colors truncate">
                            {otherParticipant.full_name || otherParticipant.username}
                        </h3>
                        <p className="text-xs text-text-tertiary-light dark:text-text-tertiary">{isEffectivelyOnline ? 'Active now' : 'Offline'}</p>
                    </div>
                </Link>
            );
        }

        if (conversation.type === 'group') {
            return (
                // FIXED: Link to href
                <Link href={`/chat/group/${conversation.conversation_id}`} className="flex items-center space-x-3 group min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-600 to-green-600 flex items-center justify-center ring-2 ring-brand-green/20 group-hover:ring-brand-green/40 transition-all flex-shrink-0">
                        <UserGroupIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-lg text-text-main-light dark:text-text-main group-hover:text-brand-green dark:group-hover:text-brand-green transition-colors truncate">
                            {conversation.name}
                        </h3>
                        <p className="text-xs text-text-tertiary-light dark:text-text-tertiary">
                            {conversation.participants.length + 1} members
                        </p>
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
                    className="fixed inset-0 z-40 pointer-events-none"
                >
                    <div
                        className="absolute bg-secondary-light dark:bg-secondary rounded-lg shadow-2xl border border-tertiary-light dark:border-tertiary overflow-hidden text-sm animate-fadeIn pointer-events-auto"
                        style={{ top: pinningOptions.y, left: pinningOptions.x }}
                        onClick={e => { e.stopPropagation(); }}
                    >
                        <div className="p-2 font-semibold border-b border-tertiary-light dark:border-tertiary">Pin message for...</div>
                        <button onClick={() => { handlePinMessage(pinningOptions.messageId!, 24); setPinningOptions({ messageId: null, x: 0, y: 0 }); }} className="block w-full text-left px-4 py-2 hover:bg-tertiary-light dark:hover:bg-tertiary">24 hours</button>
                        <button onClick={() => { handlePinMessage(pinningOptions.messageId!, 24 * 7); setPinningOptions({ messageId: null, x: 0, y: 0 }); }} className="block w-full text-left px-4 py-2 hover:bg-tertiary-light dark:hover:bg-tertiary">7 days</button>
                        <button onClick={() => { handlePinMessage(pinningOptions.messageId!, null); setPinningOptions({ messageId: null, x: 0, y: 0 }); }} className="block w-full text-left px-4 py-2 hover:bg-tertiary-light dark:hover:bg-tertiary">Forever</button>
                    </div>
                </div>
            )}

            {emojiPickerMessageId !== null && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pointer-events-none"
                >
                    <div
                        className="bg-secondary-light dark:bg-secondary rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-secondary-light dark:bg-secondary border-b border-tertiary-light dark:border-tertiary p-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-text-main-light dark:text-text-main">Choose Emoji</h3>
                            <button
                                onClick={() => setEmojiPickerMessageId(null)}
                                className="p-2 hover:bg-tertiary-light dark:hover:bg-tertiary rounded-full transition-colors"
                            >
                                <XCircleIcon className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary" />
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-4">
                            {EMOJI_PICKER_EMOJIS.map(({ category, emojis }) => (
                                <div key={category} className="mb-6">
                                    <h4 className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary mb-2 sticky top-0 bg-secondary-light dark:bg-secondary py-1">
                                        {category}
                                    </h4>
                                    <div className="grid grid-cols-8 gap-2">
                                        {emojis.map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => handleReaction(emoji, emojiPickerMessageId)}
                                                className="text-2xl p-2 hover:bg-tertiary-light dark:hover:bg-tertiary rounded-lg transition-all hover:scale-110 active:scale-95"
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

            <div className="px-4 md:px-6 py-4 border-b border-tertiary-light dark:border-tertiary flex items-center space-x-3 bg-secondary-light dark:bg-secondary shadow-sm flex-shrink-0">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="md:hidden p-2 text-text-secondary-light dark:text-text-secondary hover:text-brand-green dark:hover:text-brand-green hover:bg-tertiary-light dark:hover:bg-tertiary rounded-full transition-all flex-shrink-0"
                    >
                        <BackIcon className="w-5 h-5" />
                    </button>
                )}
                {renderHeader()}
            </div>

            {pinnedMessage && (
                <div className="px-4 md:px-6 py-2 border-b border-tertiary-light dark:border-tertiary bg-tertiary-light/30 dark:bg-tertiary/30 flex items-center justify-between gap-4 animate-fadeIn">
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
                    <button onClick={handleUnpinMessage} className="p-1.5 hover:bg-tertiary-light dark:hover:bg-tertiary rounded-full flex-shrink-0">
                        <XCircleIcon className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary" />
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 py-4 bg-primary-light dark:bg-primary">
                <div className="max-w-full space-y-3">
                    {loading ? (
                        <div className="space-y-6 py-4">
                            <MessageSkeleton align="left" />
                            <MessageSkeleton align="right" />
                            <MessageSkeleton align="left" />
                            <MessageSkeleton align="right" />
                            <MessageSkeleton align="left" />
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
                                    ref={el => { messageRefs.current.set(msg.id, el); }}
                                    className={`group flex items-end gap-2 w-full ${isOwn ? 'justify-end' : 'justify-start'} ${isSending ? 'opacity-60' : ''}`}
                                >
                                    {!isOwn && msg.profiles && (
                                        <Image
                                            src={msg.profiles.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.profiles.username)}`}
                                            className="rounded-full mb-1 ring-2 ring-secondary-light dark:ring-secondary shadow-sm flex-shrink-0"
                                            alt="avatar"
                                            width={32}
                                            height={32}
                                            unoptimized
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
                                        <div className={`relative w-full rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${isOwn
                                            ? 'bg-gradient-to-br from-green-500 to-green-500 text-black rounded-br-md'
                                            : 'bg-secondary-light dark:bg-secondary text-text-main-light dark:text-text-main border border-tertiary-light dark:border-tertiary rounded-bl-md'
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
                                                        <p className="px-4 py-2.5 text-[15px] italic text-text-tertiary-light dark:text-text-tertiary">
                                                            This message was deleted
                                                        </p>
                                                    ) : msg.message_type === 'text' ? (
                                                        <div className="flex items-end px-4 py-2.5">
                                                            <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
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
                                                            <Image
                                                                src={msg.attachment_url}
                                                                alt="attachment"
                                                                className="rounded-xl w-full max-w-xs max-h-80 object-cover"
                                                                width={320}
                                                                height={320}
                                                                unoptimized
                                                            />
                                                        </button>
                                                    ) : msg.message_type === 'gif' && msg.attachment_url ? (
                                                        <div className="p-1.5">
                                                            <Image
                                                                src={msg.attachment_url}
                                                                alt="gif"
                                                                className="rounded-xl w-full max-w-xs"
                                                                width={320}
                                                                height={320}
                                                                unoptimized
                                                            />
                                                        </div>
                                                    ) : msg.message_type === 'video' && msg.attachment_url ? (
                                                        <div className="p-1.5">
                                                            <video
                                                                src={msg.attachment_url}
                                                                controls
                                                                className="rounded-xl w-full max-w-md max-h-80"
                                                            />
                                                        </div>
                                                    ) : msg.message_type === 'audio' && msg.attachment_url ? (
                                                        <div className="px-4 py-3">
                                                            <audio
                                                                src={msg.attachment_url}
                                                                controls
                                                                className="w-full max-w-sm"
                                                            />
                                                        </div>
                                                    ) : (msg.message_type === 'document' || msg.message_type === 'file') && msg.attachment_url ? (
                                                        <a
                                                            href={msg.attachment_url}
                                                            download={msg.file_name || 'download'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                                                        >
                                                            <div className="p-2 bg-brand-green/20 rounded-lg flex-shrink-0">
                                                                <svg className="w-6 h-6 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium truncate">{msg.file_name || 'File'}</p>
                                                                {msg.file_size && (
                                                                    <p className="text-xs opacity-70">{formatFileSize(msg.file_size)}</p>
                                                                )}
                                                            </div>
                                                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                        </a>
                                                    ) : null}
                                                </>
                                            )}
                                            {msg.reactions && msg.reactions.length > 0 && (
                                                <div className={`absolute -bottom-6 flex gap-1 flex-wrap ${isOwn ? 'right-2' : 'left-2'}`}>
                                                    {Object.entries(groupedReactions(msg.reactions)).map(([emoji, count]) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleReaction(emoji, msg.id)}
                                                            className="px-2 py-0.5 bg-secondary-light dark:bg-secondary rounded-full text-xs font-medium shadow-lg border border-tertiary-light dark:border-tertiary hover:scale-110 transition-transform"
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
                                                    <button className="p-1.5 rounded-full hover:bg-tertiary-light dark:hover:bg-tertiary transition-colors">
                                                        <FaceSmileIcon className="w-4 h-4 text-text-tertiary-light dark:text-text-tertiary" />
                                                    </button>
                                                    <div className={`absolute bottom-full mb-2 flex gap-1 bg-secondary-light dark:bg-secondary p-2 rounded-xl shadow-xl border border-tertiary-light dark:border-tertiary opacity-0 invisible group-hover/react:opacity-100 group-hover/react:visible z-10 transition-all ${isOwn ? 'right-0' : 'left-0'}`}>
                                                        {REACTION_EMOJIS.map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => handleReaction(emoji, msg.id)}
                                                                className="p-1 text-xl hover:scale-125 transition-transform rounded-lg hover:bg-tertiary-light dark:hover:bg-tertiary"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                        <button
                                                            onClick={() => setEmojiPickerMessageId(msg.id)}
                                                            className="p-1 text-xl hover:scale-125 transition-transform rounded-lg hover:bg-tertiary-light dark:hover:bg-tertiary border-l border-tertiary-light dark:border-tertiary pl-2"
                                                        >
                                                            <PlusIcon className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <button
                                                    className="p-1.5 rounded-full hover:bg-tertiary-light dark:hover:bg-tertiary transition-colors"
                                                    onClick={() => setReplyingTo(msg)}
                                                >
                                                    <ReplyIcon className="w-4 h-4 text-text-tertiary-light dark:text-text-tertiary" />
                                                </button>
                                                {isOwn && msg.message_type === 'text' && (
                                                    <button
                                                        className="p-1.5 rounded-full hover:bg-tertiary-light dark:hover:bg-tertiary transition-colors"
                                                        onClick={() => handleStartEdit(msg)}
                                                    >
                                                        <PencilIcon className="w-4 h-4 text-text-tertiary-light dark:text-text-tertiary" />
                                                    </button>
                                                )}
                                                <button
                                                    className="p-1.5 rounded-full hover:bg-tertiary-light dark:hover:bg-tertiary transition-colors"
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

                    <div className="flex justify-end pr-2 pt-1">
                        {conversation.type === 'dm' && readersOfLastMessage.length > 0 && (
                            <div className="text-xs text-text-tertiary-light dark:text-text-tertiary flex items-center gap-1">
                                <CheckIcon className="w-4 h-4" />
                                <span>Seen</span>
                            </div>
                        )}
                        {conversation.type === 'group' && readersOfLastMessage.length > 0 && (
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-text-tertiary-light dark:text-text-tertiary">Seen by</span>
                                <div className="flex -space-x-2">
                                    {readersOfLastMessage.slice(0, 3).map(reader => (
                                        <Image
                                            key={reader.user_id}
                                            src={reader.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(reader.full_name || 'User')}`}
                                            alt={reader.full_name || ''}
                                            title={reader.full_name || ''}
                                            className="rounded-full object-cover ring-2 ring-secondary-light dark:ring-secondary"
                                            width={20}
                                            height={20}
                                            unoptimized
                                        />
                                    ))}
                                </div>
                                {readersOfLastMessage.length > 3 && (
                                    <span className="text-xs text-text-tertiary-light dark:text-text-tertiary">+{readersOfLastMessage.length - 3} more</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-6 py-4 border-t border-tertiary-light dark:border-tertiary bg-secondary-light dark:bg-secondary flex-shrink-0">
                {replyingTo && (
                    <div className="mb-3 px-4 py-3 bg-gradient-to-r from-green-500/10 to-green-500/10 dark:from-green-500/20 dark:to-green-500/20 rounded-xl text-sm border-l-4 border-brand-green">
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
                            <Image src={imagePreview} alt="Preview" className="object-cover" fill unoptimized />
                            <button
                                onClick={() => resetInput()}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transform hover:scale-110 transition-transform"
                            >
                                <XCircleIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
                {attachedFile && (
                    <div className="mb-3">
                        <div className="flex items-center gap-3 px-4 py-3 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-brand-green/30">
                            <div className="p-2 bg-brand-green/20 rounded-lg flex-shrink-0">
                                <svg className="w-6 h-6 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{attachedFile.name}</p>
                                <p className="text-xs text-text-tertiary-light dark:text-text-tertiary">{formatFileSize(attachedFile.size)}</p>
                            </div>
                            <button
                                onClick={() => resetInput()}
                                className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transform hover:scale-110 transition-transform flex-shrink-0"
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
                        <div className="absolute bottom-full mb-2 left-0 bg-secondary-light dark:bg-secondary border border-tertiary-light dark:border-tertiary rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 whitespace-nowrap">
                            <button
                                type="button"
                                onClick={() => document.getElementById('image-file-input')?.click()}
                                className="flex items-center w-full text-left space-x-3 px-4 py-3 hover:bg-brand-green/10 dark:hover:bg-brand-green/20 rounded-t-xl transition-colors"
                            >
                                <div className="p-2 bg-brand-green/20 rounded-lg flex-shrink-0">
                                    <ImageIcon className="w-5 h-5 text-brand-green" />
                                </div>
                                <span className="font-medium">Image</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setGifPickerOpen(true)}
                                className="flex items-center w-full text-left space-x-3 px-4 py-3 hover:bg-brand-green/10 dark:hover:bg-brand-green/20 transition-colors"
                            >
                                <div className="p-2 bg-brand-green/20 rounded-lg flex-shrink-0">
                                    <GifIcon className="w-5 h-5 text-brand-green" />
                                </div>
                                <span className="font-medium">GIF</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => document.getElementById('file-input')?.click()}
                                className="flex items-center w-full text-left space-x-3 px-4 py-3 hover:bg-brand-green/10 dark:hover:bg-brand-green/20 rounded-b-xl transition-colors"
                            >
                                <div className="p-2 bg-brand-green/20 rounded-lg flex-shrink-0">
                                    <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                </div>
                                <span className="font-medium">File</span>
                            </button>
                        </div>
                    </div>
                    <input
                        id="image-file-input"
                        type="file"
                        onChange={(e) => handleFileChange(e, 'image')}
                        accept="image/*"
                        hidden
                    />
                    <input
                        id="file-input"
                        type="file"
                        onChange={(e) => handleFileChange(e, 'file')}
                        hidden
                    />

                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                        }}
                        placeholder="Type a message..."
                        disabled={!!imagePreview}
                        className="flex-1 min-w-0 py-3 px-4 bg-tertiary-light dark:bg-tertiary border-2 border-transparent focus:border-brand-green rounded-full text-text-main-light dark:text-text-main placeholder-text-tertiary-light dark:placeholder-text-tertiary focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() && !imageFile && !attachedFile}
                        className="p-3 bg-gradient-to-br from-green-500 to-green-500 text-black rounded-full hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Conversation;