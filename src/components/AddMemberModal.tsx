'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/services/supabase';
import { Profile } from '@/types';
import Spinner from './Spinner';

interface AddMemberModalProps {
    communityId: string;
    isOpen: boolean;
    onClose: () => void;
    onMemberAdded: () => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ communityId, isOpen, onClose, onMemberAdded }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestedUsers, setSuggestedUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);
    const [addingUserId, setAddingUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            setSuggestedUsers([]);
            return;
        }

        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                // Initial suggestions: get non-members (could limit or filter)
                const { data, error } = await supabase.rpc('get_non_community_members', { p_community_id: communityId });
                if (error) throw error;

                // If search term is present, filter them
                if (searchTerm.trim()) {
                    const filtered = (data as Profile[]).filter(u =>
                        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
                    );
                    setSuggestedUsers(filtered.slice(0, 10));
                } else {
                    setSuggestedUsers((data as Profile[]).slice(0, 10));
                }
            } catch (err) {
                console.error("Error fetching non-members:", err);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            fetchSuggestions();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [isOpen, searchTerm, communityId]);

    const handleAddMember = async (userId: string) => {
        setAddingUserId(userId);
        try {
            const { error } = await supabase.rpc('add_member_to_community', {
                p_community_id: communityId,
                p_user_id: userId
            });
            if (error) throw error;

            // Remove from suggestions
            setSuggestedUsers(prev => prev.filter(u => u.user_id !== userId));
            onMemberAdded();
        } catch (err) {
            console.error("Error adding member:", err);
            alert("Failed to add member. Make sure you are a consul.");
        } finally {
            setAddingUserId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-secondary-light dark:bg-secondary w-full max-w-md rounded-2xl shadow-2xl border border-tertiary-light dark:border-tertiary overflow-hidden">
                <div className="p-6 border-b border-tertiary-light dark:border-tertiary flex justify-between items-center">
                    <h2 className="text-xl font-bold text-text-main-light dark:text-text-main">Add Member</h2>
                    <button onClick={onClose} className="p-2 hover:bg-tertiary-light dark:hover:bg-tertiary rounded-full transition-colors">
                        <svg className="w-6 h-6 text-text-secondary-light dark:text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Search by username or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-white/10 rounded-xl text-text-main-light dark:text-text-main placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-green/50 transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Spinner />
                            </div>
                        ) : suggestedUsers.length > 0 ? (
                            suggestedUsers.map(user => (
                                <div key={user.user_id} className="flex items-center justify-between p-3 rounded-xl hover:bg-tertiary-light dark:hover:bg-white/5 transition-colors border border-transparent hover:border-tertiary-light dark:hover:border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-10 h-10">
                                            <Image
                                                src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=random&color=fff`}
                                                alt={user.username}
                                                fill
                                                className="rounded-full object-cover"
                                                unoptimized
                                            />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-text-main-light dark:text-text-main">@{user.username}</p>
                                            <p className="text-xs text-text-secondary-light dark:text-text-secondary">{user.full_name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAddMember(user.user_id)}
                                        disabled={addingUserId === user.user_id}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${addingUserId === user.user_id
                                                ? 'bg-tertiary text-text-tertiary'
                                                : 'bg-brand-green text-black hover:bg-brand-green-darker shadow-lg shadow-brand-green/20'
                                            }`}
                                    >
                                        {addingUserId === user.user_id ? 'Adding...' : 'Add'}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-text-tertiary">No users found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddMemberModal;
