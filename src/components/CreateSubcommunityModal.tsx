// src/components/CreateSubcommunityModal.tsx

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import Spinner from './Spinner';
import { XCircleIcon } from './icons';

interface Props {
    parentCommunityId: string;
    onClose: () => void;
    onSubcommunityCreated: () => void;
}

const CreateSubcommunityModal: React.FC<Props> = ({ parentCommunityId, onClose, onSubcommunityCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [accessType, setAccessType] = useState<'public' | 'restricted' | 'private'>('public');
    const [parentMembers, setParentMembers] = useState<Profile[]>([]);
    const [selectedConsuls, setSelectedConsuls] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isConsulModalOpen, setIsConsulModalOpen] = useState(false);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        const fetchParentMembers = async () => {
            const { data } = await supabase.rpc('get_community_members', { p_community_id: parentCommunityId });
            if (data) setParentMembers((data as Array<Profile & { status: string }>).filter(m => m.status === 'approved'));
        };
        fetchParentMembers();
    }, [parentCommunityId]);

    const handleToggleConsul = (userId: string) => {
        setSelectedConsuls(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Subcommunity name is required.'); return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            const { error: rpcError } = await supabase.rpc('create_subcommunity', {
                p_parent_community_id: parentCommunityId,
                p_name: name,
                p_description: description,
                p_access_type: accessType,
                p_consul_ids: selectedConsuls,
            });
            if (rpcError) throw rpcError;
            onSubcommunityCreated();
            onClose();
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-secondary-light dark:bg-secondary rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] sm:max-h-[85vh] flex flex-col border border-tertiary-light/50 dark:border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
                    {/* Header */}
                    <header className="px-8 py-6 flex justify-between items-start border-b border-tertiary-light/50 dark:border-white/10">
                        <div>
                            <h2 className="text-3xl font-bold text-text-main-light dark:text-text-main">Create Subcommunity</h2>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary mt-2">Create a new channel within your community.</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-tertiary-light dark:hover:bg-white/10 transition-colors"
                        >
                            <XCircleIcon className="w-6 h-6 text-text-tertiary-light dark:text-text-tertiary" />
                        </button>
                    </header>

                    {/* Main Content */}
                    <main className="flex-1 px-8 py-6 overflow-y-auto pb-20 lg:pb-6">
                        <div className="grid lg:grid-cols-2 gap-8 h-full">
                            {/* Left Column - Consul Selection (Desktop Only) */}
                            <div className="hidden lg:flex lg:order-1 flex-col">
                                <label className="block text-sm font-semibold text-text-main-light dark:text-text-main mb-3">
                                    Assign Consuls <span className="text-text-tertiary-light dark:text-text-tertiary text-xs">(Optional)</span>
                                </label>
                                <div className="flex-1 overflow-y-auto space-y-2 p-3 bg-tertiary-light/50 dark:bg-tertiary/50 rounded-xl border border-tertiary-light dark:border-white/5">
                                    {parentMembers.length === 0 ? (
                                        <p className="text-center text-text-tertiary-light dark:text-text-tertiary text-sm py-4">No members available</p>
                                    ) : (
                                        parentMembers.map(member => (
                                            <div
                                                key={member.user_id}
                                                onClick={() => handleToggleConsul(member.user_id)}
                                                className={`flex items-center gap-3.5 p-3.5 rounded-lg cursor-pointer transition-all ${selectedConsuls.includes(member.user_id) ? 'bg-brand-green/15 border-2 border-brand-green/30' : 'bg-secondary-light dark:bg-secondary border-2 border-transparent hover:bg-tertiary-light/50 dark:hover:bg-white/5'}`}
                                            >
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedConsuls.includes(member.user_id) ? 'bg-brand-green border-brand-green' : 'border-tertiary-light dark:border-white/20'}`}>
                                                    {selectedConsuls.includes(member.user_id) && (
                                                        <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <Image
                                                    src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name || member.username)}&background=random&color=fff&bold=true`}
                                                    alt={member.username}
                                                    width={40}
                                                    height={40}
                                                    className="w-10 h-10 rounded-full ring-2 ring-white/10"
                                                    unoptimized
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-text-main-light dark:text-text-main truncate">{member.full_name || member.username}</p>
                                                    <p className="text-xs text-text-tertiary-light dark:text-text-tertiary truncate">@{member.username}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Right Column - Form Fields */}
                            <div className="order-1 lg:order-2 space-y-6">
                                {/* Name Input */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-semibold text-text-main-light dark:text-text-main mb-2.5">
                                        Subcommunity Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                        placeholder="e.g., General Discussion"
                                        className="w-full px-4 py-3.5 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-transparent focus:border-brand-green/50 focus:ring-2 focus:ring-brand-green/20 outline-none transition-all text-base placeholder:text-text-tertiary-light dark:placeholder:text-text-tertiary"
                                    />
                                </div>

                                {/* Description Input */}
                                <div>
                                    <label htmlFor="description" className="block text-sm font-semibold text-text-main-light dark:text-text-main mb-2.5">
                                        Description <span className="text-text-tertiary-light dark:text-text-tertiary text-xs">(Optional)</span>
                                    </label>
                                    <textarea
                                        id="description"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        rows={3}
                                        placeholder="What's this subcommunity about?"
                                        className="w-full px-4 py-3.5 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-transparent focus:border-brand-green/50 focus:ring-2 focus:ring-brand-green/20 outline-none transition-all text-base resize-none placeholder:text-text-tertiary-light dark:placeholder:text-text-tertiary"
                                    />
                                </div>

                                {/* Mobile Only - Consul Selection Button */}
                                <div className="lg:hidden">
                                    <label className="block text-sm font-semibold text-text-main-light dark:text-text-main mb-2.5">
                                        Assign Consuls <span className="text-text-tertiary-light dark:text-text-tertiary text-xs">(Optional)</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsConsulModalOpen(true)}
                                        className="w-full px-4 py-3.5 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-tertiary-light dark:border-white/10 hover:border-brand-green/30 transition-all text-left flex items-center justify-between"
                                    >
                                        <span className="text-text-main-light dark:text-text-main">
                                            {selectedConsuls.length === 0
                                                ? 'Select Consuls'
                                                : `${selectedConsuls.length} Consul${selectedConsuls.length === 1 ? '' : 's'} Selected`
                                            }
                                        </span>
                                        <svg className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Access Type */}
                                <div>
                                    <label className="block text-sm font-semibold text-text-main-light dark:text-text-main mb-3">
                                        Access Type
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <label className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${accessType === 'public' ? 'border-brand-green bg-brand-green/10 shadow-lg shadow-brand-green/20' : 'border-tertiary-light dark:border-white/10 hover:border-brand-green/30 hover:bg-brand-green/5'}`}>
                                            <input type="radio" value="public" checked={accessType === 'public'} onChange={() => setAccessType('public')} className="sr-only" />
                                            <div className="flex items-start gap-2.5">
                                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${accessType === 'public' ? 'border-brand-green bg-brand-green' : 'border-tertiary-light dark:border-white/20'}`}>
                                                    {accessType === 'public' && <div className="w-2 h-2 bg-black rounded-full" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm text-text-main-light dark:text-text-main mb-0.5">Public</p>
                                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary leading-relaxed">Any member can join instantly.</p>
                                                </div>
                                            </div>
                                        </label>
                                        <label className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${accessType === 'restricted' ? 'border-brand-green bg-brand-green/10 shadow-lg shadow-brand-green/20' : 'border-tertiary-light dark:border-white/10 hover:border-brand-green/30 hover:bg-brand-green/5'}`}>
                                            <input type="radio" value="restricted" checked={accessType === 'restricted'} onChange={() => setAccessType('restricted')} className="sr-only" />
                                            <div className="flex items-start gap-2.5">
                                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${accessType === 'restricted' ? 'border-brand-green bg-brand-green' : 'border-tertiary-light dark:border-white/20'}`}>
                                                    {accessType === 'restricted' && <div className="w-2 h-2 bg-black rounded-full" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm text-text-main-light dark:text-text-main mb-0.5">Restricted</p>
                                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary leading-relaxed">Requires Consul approval.</p>
                                                </div>
                                            </div>
                                        </label>
                                        <label className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${accessType === 'private' ? 'border-brand-green bg-brand-green/10 shadow-lg shadow-brand-green/20' : 'border-tertiary-light dark:border-white/10 hover:border-brand-green/30 hover:bg-brand-green/5'}`}>
                                            <input type="radio" value="private" checked={accessType === 'private'} onChange={() => setAccessType('private')} className="sr-only" />
                                            <div className="flex items-start gap-2.5">
                                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${accessType === 'private' ? 'border-brand-green bg-brand-green' : 'border-tertiary-light dark:border-white/20'}`}>
                                                    {accessType === 'private' && <div className="w-2 h-2 bg-black rounded-full" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm text-text-main-light dark:text-text-main mb-0.5">Private</p>
                                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary leading-relaxed">Hidden from all lists.</p>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>



                                {/* Error Message */}
                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                        <p className="text-red-400 text-sm font-medium">{error}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>

                    {/* Footer */}
                    <footer className="px-8 py-5 bg-tertiary-light/30 dark:bg-tertiary/30 border-t border-tertiary-light/50 dark:border-white/10 flex justify-end items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-semibold text-text-main-light dark:text-text-main hover:bg-tertiary-light dark:hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-brand-green text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-green-darker hover:shadow-lg hover:shadow-brand-green/30 transition-all flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                'Create Subcommunity'
                            )}
                        </button>
                    </footer>
                </form>
            </div>

            {/* Mobile Consul Selection Modal */}
            {isConsulModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center" onClick={() => setIsConsulModalOpen(false)}>
                    <div
                        className="bg-secondary-light dark:bg-secondary w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] border-t sm:border border-tertiary-light/50 dark:border-white/10"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-tertiary-light/50 dark:border-white/10 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-text-main-light dark:text-text-main">Select Consuls</h3>
                            <button
                                onClick={() => setIsConsulModalOpen(false)}
                                className="p-2 rounded-full hover:bg-tertiary-light dark:hover:bg-white/10 transition-colors"
                            >
                                <XCircleIcon className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary" />
                            </button>
                        </div>

                        {/* Member List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {parentMembers.length === 0 ? (
                                <p className="text-center text-text-tertiary-light dark:text-text-tertiary text-sm py-8">No members available</p>
                            ) : (
                                parentMembers.map(member => (
                                    <div
                                        key={member.user_id}
                                        onClick={() => handleToggleConsul(member.user_id)}
                                        className={`flex items-center gap-3.5 p-4 rounded-xl cursor-pointer transition-all ${selectedConsuls.includes(member.user_id) ? 'bg-brand-green/15 border-2 border-brand-green/30' : 'bg-tertiary-light/50 dark:bg-tertiary/50 border-2 border-transparent'}`}
                                    >
                                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedConsuls.includes(member.user_id) ? 'bg-brand-green border-brand-green' : 'border-tertiary-light dark:border-white/20'}`}>
                                            {selectedConsuls.includes(member.user_id) && (
                                                <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <Image
                                            src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name || member.username)}&background=random&color=fff&bold=true`}
                                            alt={member.username}
                                            width={48}
                                            height={48}
                                            className="w-12 h-12 rounded-full ring-2 ring-white/10"
                                            unoptimized
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-text-main-light dark:text-text-main truncate">{member.full_name || member.username}</p>
                                            <p className="text-sm text-text-tertiary-light dark:text-text-tertiary truncate">@{member.username}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-tertiary-light/50 dark:border-white/10">
                            <button
                                onClick={() => setIsConsulModalOpen(false)}
                                className="w-full px-6 py-3.5 bg-brand-green text-black font-bold rounded-xl hover:bg-brand-green-darker transition-all"
                            >
                                Done {selectedConsuls.length > 0 && `(${selectedConsuls.length} selected)`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateSubcommunityModal;