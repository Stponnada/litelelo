// src/components/StartConversationModal.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { DirectoryProfile, ConversationSummary } from '../types';
import Spinner from './Spinner';
import { XCircleIcon, ChatIcon } from './icons';

interface StartConversationModalProps {
    onClose: () => void;
    onUserSelected: (conversation: ConversationSummary) => void;
}

const StartConversationModal: React.FC<StartConversationModalProps> = ({ onClose, onUserSelected }) => {
    const { user, profile: currentUserProfile } = useAuth();
    const [availableUsers, setAvailableUsers] = useState<DirectoryProfile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_unified_directory');
            if (error) {
                console.error("Error fetching users for new conversation:", error);
                setError("Could not load users.");
            } else {
                const usersOnly = (data as DirectoryProfile[] || []).filter(p => p.type === 'user' && p.id !== user?.id);
                setAvailableUsers(usersOnly);
            }
            setLoading(false);
        };
        fetchUsers();
    }, [user]);

    const handleSelectUser = async (targetUser: DirectoryProfile) => {
        if (!currentUserProfile) return;

        // Check if a real conversation already exists (this will be handled by ChatPage, but we can pre-build the object)
        // For simplicity, we create a placeholder and let ChatPage's selection logic handle it
        const placeholder: ConversationSummary = {
            conversation_id: `placeholder_${targetUser.id}`,
            type: 'dm',
            name: targetUser.name,
            participants: [{
                user_id: targetUser.id,
                username: targetUser.username!,
                full_name: targetUser.name,
                avatar_url: targetUser.avatar_url
            }],
            last_message_content: "Start a conversation!",
            last_message_at: null,
            last_message_sender_id: null,
            unread_count: 0,
        };

        onUserSelected(placeholder);
    };

    const filteredUsers = availableUsers.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.username!.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden animate-slideUp"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative px-6 py-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-green to-brand-green/80 flex items-center justify-center shadow-lg shadow-brand-green/20">
                                <ChatIcon className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Message</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Search for anyone on campus</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <XCircleIcon className="w-6 h-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="relative">
                        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-brand-green/20 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                            placeholder="Search name or @username..."
                            autoFocus
                        />
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto px-2 pb-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Spinner />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-gray-600 dark:text-gray-400 font-medium">No results found</p>
                        </div>
                    ) : (
                        <div className="space-y-1 mt-2">
                            {filteredUsers.map(profile => (
                                <button
                                    key={profile.id}
                                    onClick={() => handleSelectUser(profile)}
                                    className="group flex items-center gap-4 p-3 w-full rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-left"
                                >
                                    <img
                                        src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.name || profile.username}&background=random&color=fff&bold=true`}
                                        alt={profile.username!}
                                        className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-transparent group-hover:ring-brand-green/20 transition-all"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 dark:text-white truncate">
                                            {profile.name}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            @{profile.username}
                                        </p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StartConversationModal;
