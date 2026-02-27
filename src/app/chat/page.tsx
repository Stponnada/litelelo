'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ConversationSummary } from '@/types';
import Conversation from '@/components/Conversation';
import CreateGroupModal from '@/components/CreateGroupModal';
import StartConversationModal from '@/components/StartConversationModal';
import ChatPageSkeleton from '@/components/ChatPageSkeleton';

import { useChat } from '@/hooks/useChat';
import { formatTimestamp } from '@/utils/timeUtils';
import { ChatIcon, UserGroupIcon, SearchIcon, PinIcon, ArchiveIcon, PlusIcon, LockClosedIcon, ShieldCheckIcon } from '@/components/icons';
import { supabase } from '@/services/supabase';
import { tryRestoreEncryptionKey, decryptMessage } from '@/services/encryption';
import { motion, AnimatePresence } from 'framer-motion';

const MessagePreview: React.FC<{ conv: ConversationSummary }> = ({ conv }) => {
    const [decrypted, setDecrypted] = useState<string | null>(null);

    useEffect(() => {
        const decrypt = async () => {
            if (conv.last_message_encrypted_content) {
                try {
                    const plaintext = await decryptMessage(
                        conv.last_message_encrypted_content,
                        conv.last_message_encrypted_key_sender || null,
                        conv.last_message_encrypted_key_recipient || null
                    );
                    setDecrypted(plaintext);
                } catch (err) {
                    console.error("Failed to decrypt preview:", err);
                }
            }
        };
        decrypt();
    }, [conv.last_message_encrypted_content, conv.last_message_encrypted_key_sender, conv.last_message_encrypted_key_recipient]);

    if (conv.last_message_encrypted_content) {
        return (
            <span className="flex items-center gap-1">
                <LockClosedIcon className="w-3 h-3 opacity-60 flex-shrink-0" />
                <span className="truncate">{decrypted || 'Encrypted message'}</span>
            </span>
        );
    }

    return <>{conv.last_message_content || 'No messages yet'}</>;
};

const ChatEmptyState: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % 2);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    const slides = [
        {
            id: 'select',
            icon: <ChatIcon className="w-12 h-12 text-brand-green" />,
            title: "Select a chat",
            description: "Pick a conversation to start chatting."
        },
        {
            id: 'e2ee',
            icon: <ShieldCheckIcon className="w-12 h-12 text-blue-500 dark:text-brand-green" />,
            title: "Privacy Protected",
            description: "Your messages are secured with asymmetric RSA encryption."
        }
    ];

    return (
        <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-8">
            <AnimatePresence mode="wait">
                <motion.div
                    key={slides[currentSlide].id}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.95 }}
                    transition={{ duration: 0.6, ease: "circOut" }}
                    className="flex flex-col items-center justify-center"
                >
                    <div className="relative mb-8">
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.2, 0.4, 0.2]
                            }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className={`absolute inset-0 bg-gradient-to-r ${currentSlide === 0 ? 'from-brand-green/30 to-blue-500/10' : 'from-blue-500/30 to-brand-green/10'} blur-3xl rounded-full`}
                        />
                        <div className="relative w-28 h-28 rounded-[32px] bg-gradient-to-br from-white to-gray-50 dark:from-secondary dark:to-tertiary/60 flex items-center justify-center shadow-2xl ring-1 ring-gray-200 dark:ring-white/5">
                            {slides[currentSlide].icon}
                        </div>
                    </div>

                    <h3 className="text-3xl font-bold font-poppins text-text-main-light dark:text-text-main tracking-tight">
                        {slides[currentSlide].title}
                    </h3>
                    <p className="text-base text-text-secondary-light dark:text-text-secondary max-w-xs leading-relaxed mt-3">
                        {slides[currentSlide].description}
                    </p>

                    {/* Slide indicators */}
                    <div className="flex gap-2 mt-8">
                        {slides.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-500 ${currentSlide === i ? 'w-8 bg-brand-green' : 'w-2 bg-tertiary-light dark:bg-tertiary'}`}
                            />
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

const ChatPage: React.FC = () => {
    const { user, profile: currentUserProfile } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const recipientId = searchParams.get('recipientId') || searchParams.get('userId');

    const {
        conversations,
        loading,
        markConversationAsRead,
        fetchConversations,
        updateConversationId,
        onlineUsers,
        togglePin,
        toggleArchive
    } = useChat();

    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isGroupModalOpen, setGroupModalOpen] = useState(false);
    const [isStartConvoModalOpen, setStartConvoModalOpen] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [placeholderConversation, setPlaceholderConversation] = useState<ConversationSummary | null>(null);

    // Silently try restoring encryption key if previously set up
    useEffect(() => {
        if (user) {
            tryRestoreEncryptionKey(user.id);
        }
    }, [user]);


    // Logic for handling deep links to specific users
    useEffect(() => {
        const handleRecipient = async () => {
            if (!recipientId || !user || !currentUserProfile || loading) return;

            const existingChat = conversations.find(c =>
                c.type === 'dm' && c.participants.some(p => p.user_id === recipientId)
            );

            if (existingChat) {
                setSelectedConversationId(existingChat.conversation_id);
                if (!existingChat.conversation_id.startsWith('placeholder_')) {
                    markConversationAsRead(existingChat.conversation_id);
                }
                router.replace('/chat');
            } else {
                const { data: recipientProfile } = await supabase
                    .from('profiles').select('*').eq('user_id', recipientId).single();

                if (recipientProfile) {
                    const placeholder: ConversationSummary = {
                        conversation_id: `placeholder_${recipientId}`,
                        type: 'dm',
                        participants: [currentUserProfile, recipientProfile],
                        last_message_content: null,
                        last_message_at: null,
                        last_message_sender_id: null,
                        unread_count: 0,
                        name: null,
                        is_pinned: false,
                        is_archived: false
                    };
                    setPlaceholderConversation(placeholder);
                    setSelectedConversationId(placeholder.conversation_id);
                    router.replace('/chat');
                }
            }
        };
        handleRecipient();
    }, [recipientId, conversations, loading, user, currentUserProfile, router, markConversationAsRead]);

    const handleSelectConversation = useCallback((conversation: ConversationSummary) => {
        setSelectedConversationId(conversation.conversation_id);
        if (placeholderConversation && placeholderConversation.conversation_id !== conversation.conversation_id) {
            setPlaceholderConversation(null);
        }
        if (!conversation.conversation_id.startsWith('placeholder_')) {
            markConversationAsRead(conversation.conversation_id);
        }
    }, [markConversationAsRead, placeholderConversation]);

    const getOtherParticipant = (convo: ConversationSummary) => {
        return convo.participants.find(p => p.user_id !== user?.id) || convo.participants[0] || null;
    };

    const filteredConversations = conversations.filter(conv => {
        const matchesArchive = showArchived ? conv.is_archived : !conv.is_archived;
        if (!matchesArchive) return false;

        const searchLower = searchTerm.toLowerCase();
        const otherP = getOtherParticipant(conv);
        const name = (conv.type === 'group' ? conv.name : otherP?.full_name) || 'Unknown';
        const username = otherP?.username || '';

        return name.toLowerCase().includes(searchLower) || username.toLowerCase().includes(searchLower);
    });

    const selectedConversation = conversations.find(c => c.conversation_id === selectedConversationId) ||
        (selectedConversationId?.startsWith('placeholder_') ? placeholderConversation : null);

    if (loading) return <ChatPageSkeleton />;

    return (
        <div className="relative h-[calc(100vh-144px)] md:h-[calc(100vh-96px)] w-full overflow-hidden bg-primary-light dark:bg-primary shadow-2xl">


            {isGroupModalOpen && <CreateGroupModal onClose={() => setGroupModalOpen(false)} onGroupCreated={(id) => { setGroupModalOpen(false); fetchConversations(); setSelectedConversationId(id); }} />}
            {isStartConvoModalOpen && <StartConversationModal onClose={() => setStartConvoModalOpen(false)} onUserSelected={(p) => { setStartConvoModalOpen(false); setPlaceholderConversation(p); setSelectedConversationId(p.conversation_id); }} />}


            <div className={`relative w-full h-full flex transition-transform duration-300 ease-in-out md:transform-none ${selectedConversationId ? '-translate-x-full' : 'translate-x-0'}`}>
                {/* Sidebar */}
                <div className="w-full h-full flex-shrink-0 md:w-[420px] md:border-r md:border-tertiary-light/50 dark:md:border-tertiary/50 flex flex-col bg-primary-light/60 dark:bg-primary/60 backdrop-blur-xl">
                    {/* Header */}
                    <div className="p-5 border-b border-tertiary-light/50 dark:border-tertiary/50 bg-gradient-to-b from-secondary-light/50 to-transparent dark:from-secondary/50">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h1 className="text-3xl font-bold font-poppins text-text-main-light dark:text-text-main">
                                    {showArchived ? 'Archived' : 'Chat'}
                                </h1>
                                <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-0.5">
                                    {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
                                </p>
                            </div>

                            {/* NEW PILL BUTTONS kept from your revamp */}
                            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1.5 rounded-[18px]">
                                <button
                                    onClick={() => setStartConvoModalOpen(true)}
                                    className="p-2.5 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all text-brand-green"
                                    title="New Message"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setGroupModalOpen(true)}
                                    className="p-2.5 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all text-brand-green"
                                    title="Create Group"
                                >
                                    <UserGroupIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setShowArchived(!showArchived)}
                                    className={`p-2.5 rounded-xl transition-all ${showArchived ? 'bg-brand-green text-black' : 'text-text-tertiary hover:text-text-main'}`}
                                    title={showArchived ? "Go back to chats" : "View Archived"}
                                >
                                    <ArchiveIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="relative group">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors">
                                <SearchIcon className="w-4.5 h-4.5 text-text-tertiary group-focus-within:text-brand-green transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-tertiary-light/80 dark:bg-tertiary/80 border-0 rounded-full text-sm text-text-main-light dark:text-text-main placeholder-text-tertiary-light dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:bg-secondary-light dark:focus:bg-secondary transition-all duration-200 shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Conversations List */}
                    <ul className="flex-1 overflow-y-auto scrollbar-hide">
                        {filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-tertiary-light to-tertiary-light/50 dark:from-tertiary to-tertiary/50 flex items-center justify-center mb-4 shadow-inner">
                                    <ChatIcon className="w-10 h-10 text-text-tertiary-light dark:text-text-tertiary" />
                                </div>
                                <p className="text-base text-text-secondary-light dark:text-text-secondary font-semibold mb-1">No conversations found</p>
                                <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">Start a new chat to get connected</p>
                            </div>
                        ) : (
                            filteredConversations.map((conv, idx) => {
                                const otherParticipant = getOtherParticipant(conv);
                                const displayName = conv.type === 'group' ? conv.name : otherParticipant?.full_name || 'User';
                                const avatar = conv.type === 'dm' ? otherParticipant?.avatar_url : null;
                                const avatarSrc = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || ' ')}&background=random&color=fff&bold=true`;
                                const isOnline = (conv.type === 'dm' && otherParticipant) ? onlineUsers.has(otherParticipant.user_id) : false;
                                const isSelected = selectedConversationId === conv.conversation_id;

                                return (
                                    <li
                                        key={conv.conversation_id}
                                        onClick={() => handleSelectConversation(conv)}
                                        className={`group/row mx-2 my-1 px-3.5 py-3.5 flex items-center gap-3.5 cursor-pointer transition-all duration-200 rounded-xl ${isSelected
                                            ? 'bg-gradient-to-r from-brand-green/10 to-brand-green/5 dark:from-brand-green/20 dark:to-brand-green/10 shadow-md scale-[0.98]'
                                            : 'hover:bg-tertiary-light/60 dark:hover:bg-tertiary/60 hover:scale-[0.99] active:scale-[0.97]'
                                            }`}
                                        style={{ animationDelay: `${idx * 30}ms` }}
                                    >
                                        <div className="relative flex-shrink-0">
                                            {conv.type === 'group' ? (
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-secondary">
                                                    <UserGroupIcon className="w-7 h-7 text-green-600 dark:text-green-400" />
                                                </div>
                                            ) : (
                                                <Image
                                                    src={avatarSrc}
                                                    alt={displayName || ''}
                                                    width={56}
                                                    height={56}
                                                    className="w-14 h-14 rounded-full object-cover shadow-lg ring-2 ring-white dark:ring-secondary"
                                                    unoptimized
                                                />
                                            )}
                                            {isOnline && (
                                                <span className="absolute bottom-0.5 right-0.5 block h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-secondary-light/80 dark:ring-secondary/80" title="Online" />
                                            )}
                                            {conv.unread_count > 0 && (
                                                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg shadow-red-500/50 ring-2 ring-white dark:ring-secondary animate-pulse">
                                                    {conv.unread_count > 9 ? '9+' : conv.unread_count}
                                                </span>
                                            )}
                                            {conv.is_pinned && (
                                                <span className="absolute -bottom-1 -left-1 bg-white dark:bg-secondary p-1 rounded-full shadow-md ring-2 ring-brand-green/30 scale-75">
                                                    <PinIcon className="w-3.5 h-3.5 text-brand-green" />
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 pr-16 relative">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <p className={`font-semibold truncate text-base ${isSelected
                                                    ? 'text-brand-green dark:text-brand-green'
                                                    : 'text-text-main-light dark:text-text-main'
                                                    }`}>
                                                    {displayName}
                                                </p>
                                                {conv.last_message_at && (
                                                    <p className="text-xs text-text-tertiary-light dark:text-text-tertiary flex-shrink-0 ml-2 font-medium">
                                                        {formatTimestamp(conv.last_message_at)}
                                                    </p>
                                                )}
                                            </div>
                                            <p className={`text-sm truncate leading-relaxed ${conv.unread_count > 0
                                                ? 'font-medium text-text-secondary-light dark:text-text-main'
                                                : 'text-text-secondary-light dark:text-text-secondary'
                                                }`}>
                                                {conv.last_message_sender_id === user?.id && (
                                                    <span className="text-text-tertiary-light dark:text-text-tertiary">You: </span>
                                                )}
                                                <MessagePreview conv={conv} />
                                            </p>

                                            {/* Hover Actions */}
                                            <div className="absolute right-[-8px] top-0 opacity-0 group-hover/row:opacity-100 flex gap-0.5 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); togglePin(conv.conversation_id); }}
                                                    className={`p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-black/20 transition-colors ${conv.is_pinned ? 'text-brand-green' : 'text-text-tertiary'}`}
                                                    title={conv.is_pinned ? "Unpin" : "Pin"}
                                                >
                                                    <PinIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleArchive(conv.conversation_id); }}
                                                    className="p-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-black/20 transition-colors text-text-tertiary hover:text-text-main"
                                                    title={conv.is_archived ? "Unarchive" : "Archive"}
                                                >
                                                    <ArchiveIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>

                {/* Main Chat Area */}
                <div className="w-full h-full flex-shrink-0 md:flex-1 flex flex-col bg-secondary-light/60 dark:bg-secondary/60 backdrop-blur-sm">
                    {selectedConversation ? (
                        <Conversation
                            key={selectedConversation.conversation_id}
                            conversation={selectedConversation}
                            onBack={() => setSelectedConversationId(null)}
                            onConversationCreated={(placeholder, real) => {
                                updateConversationId(placeholder, real);
                                setSelectedConversationId(real);
                                setPlaceholderConversation(null);
                            }}
                        />
                    ) : (
                        <ChatEmptyState />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;