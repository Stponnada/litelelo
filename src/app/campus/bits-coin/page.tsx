'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';
import { CurrencyRupeeIcon, XCircleIcon, ChatIcon, StarIcon } from '@/components/icons';
import { formatDeadline } from '@/utils/timeUtils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RateBitsCoinUserModal from '@/components/RateBitsCoinUserModal';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ["Delivery", "Academic Help", "Errands", "Shopping", "Technical", "Other"];

interface BitsCoinRequest {
    id: string;
    created_at: string;
    title: string;
    description: string;
    reward: number;
    status: 'open' | 'claimed' | 'completed' | 'cancelled';
    requester: { user_id: string; username: string; full_name: string; avatar_url: string; };
    claimer: { user_id: string; username: string; full_name: string; avatar_url: string; } | null;
    category: string;
    deadline: string | null;
}

const BitsCoinPage: React.FC = () => {
    const { profile } = useAuth();
    const [requests, setRequests] = useState<BitsCoinRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<BitsCoinRequest | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('All');

    // --- FIX: Logic for the 7-click easter egg ---
    const [clickCount, setClickCount] = useState(0);
    const router = useRouter();

    const handleTitleClick = () => {
        setClickCount(prev => prev + 1);
    };

    useEffect(() => {
        if (clickCount === 0) return;
        if (clickCount >= 7) {
            router.push('/easter-egg/blockchain');
        }
        const timer = setTimeout(() => setClickCount(0), 1500);
        return () => clearTimeout(timer);
    }, [clickCount, router]);
    // --- End of fix ---

    const fetchRequests = useCallback(async (isInitialLoad = false) => {
        if (!profile?.campus) return;
        if (isInitialLoad) setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_bits_coin_requests', { p_campus: profile.campus });
            if (error) throw error;
            setRequests(data as any[] || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    }, [profile?.campus]);

    useEffect(() => {
        if (profile?.campus) {
            fetchRequests(true);
        }
    }, [profile?.campus, fetchRequests]);

    useEffect(() => {
        if (!profile?.campus) return;
        const channel = supabase.channel('bits_coin_requests_channel').on('postgres_changes', { event: '*', schema: 'public', table: 'bits_coin_requests', filter: `campus=eq.${profile.campus}` }, (payload) => {
            fetchRequests();
        }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [profile?.campus, fetchRequests]);

    const handleRequestCreated = (newRequest: BitsCoinRequest) => {
        setRequests(prev => [newRequest, ...prev]);
        setCreateModalOpen(false);
    };

    const handleRequestUpdated = (updatedRequest: BitsCoinRequest) => {
        setRequests(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r).filter(r => r.status !== 'completed' && r.status !== 'cancelled'));
        setSelectedRequest(null);
    };

    const allCategories = useMemo(() => {
        const uniqueCategories = Array.from(new Set(requests.map(r => r.category).filter(Boolean)));
        return ['All', ...uniqueCategories.sort()];
    }, [requests]);

    const filteredRequests = useMemo(() => {
        if (selectedCategory === 'All') return requests;
        return requests.filter(r => r.category === selectedCategory);
    }, [requests, selectedCategory]);

    if (loading) { return <div className="flex justify-center items-center min-h-[60vh]"><Spinner /></div>; }
    if (error) { return <div className="text-center p-8 text-red-400">Error: {error}</div>; }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 dark:from-background dark:to-secondary/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AnimatePresence>
                    {isCreateModalOpen && profile && (
                        <CreateRequestModal campus={profile.campus!} onClose={() => setCreateModalOpen(false)} onRequestCreated={handleRequestCreated} />
                    )}
                    {selectedRequest && (
                        <RequestDetailModal request={selectedRequest} onClose={() => setSelectedRequest(null)} onRequestUpdate={handleRequestUpdated} />
                    )}
                </AnimatePresence>

                {/* Enhanced Header with Glassmorphism and Animation */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 md:mb-12 relative overflow-hidden rounded-3xl bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 p-6 md:p-10 shadow-2xl"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/20 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-[80px] -ml-10 -mb-10 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    whileHover={{ rotate: 180 }}
                                    transition={{ duration: 0.5 }}
                                    className="p-3 bg-gradient-to-br from-brand-green to-emerald-600 rounded-2xl shadow-lg shadow-brand-green/30"
                                >
                                    <CurrencyRupeeIcon className="w-8 h-8 text-white" />
                                </motion.div>
                                <div>
                                    <h1
                                        className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-green via-accent-emerald to-accent-teal cursor-pointer"
                                        onClick={handleTitleClick}
                                        title="What are you clicking at?"
                                    >
                                        Request Board
                                    </h1>
                                    <p className="text-sm md:text-lg text-text-secondary-light dark:text-text-secondary font-medium mt-1">
                                        Earn rewards by helping others on campus
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-bold">
                                <div className="flex items-center gap-2 bg-accent-blue/10 text-accent-blue px-4 py-2 rounded-full border border-accent-blue/20 backdrop-blur-sm">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                                    </span>
                                    <span>{requests.filter(r => r.status === 'open').length} Open Tasks</span>
                                </div>
                                <div className="flex items-center gap-2 bg-accent-yellow/10 text-accent-yellow px-4 py-2 rounded-full border border-accent-yellow/20 backdrop-blur-sm">
                                    <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></div>
                                    <span>{requests.filter(r => r.status === 'claimed').length} In Progress</span>
                                </div>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCreateModalOpen(true)}
                            className="group relative overflow-hidden bg-gradient-to-r from-brand-green to-emerald-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <div className="relative flex items-center justify-center gap-3">
                                <span className="text-2xl leading-none">+</span>
                                <span>Create Request</span>
                            </div>
                        </motion.button>
                    </div>
                </motion.header>

                {/* Enhanced Category Filter */}
                <div className="mb-8 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                    <motion.div
                        className="flex gap-3 w-max mx-auto md:mx-0"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        {allCategories.map((cat, index) => (
                            <motion.button
                                key={cat}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 + index * 0.05 }}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap border ${selectedCategory === cat
                                    ? 'bg-brand-green text-white border-brand-green shadow-lg shadow-brand-green/25'
                                    : 'bg-white/50 dark:bg-black/20 text-text-secondary-light dark:text-text-secondary border-transparent hover:bg-white/80 dark:hover:bg-white/10 hover:border-brand-green/30'
                                    }`}
                            >
                                {cat}
                            </motion.button>
                        ))}
                    </motion.div>
                </div>

                {/* Enhanced Request Grid */}
                {filteredRequests.length > 0 ? (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence mode='popLayout'>
                            {filteredRequests.map((req, index) => (
                                <RequestCard key={req.id} request={req} onClick={() => setSelectedRequest(req)} index={index} />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-20 bg-white/30 dark:bg-black/20 backdrop-blur-md rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700"
                    >
                        <div className="inline-block p-6 bg-brand-green/10 rounded-full mb-4 animate-bounce">
                            <CurrencyRupeeIcon className="w-16 h-16 text-brand-green opacity-50" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-text-main-light dark:text-text-main">No requests found</h3>
                        <p className="text-text-secondary-light dark:text-text-secondary">
                            {selectedCategory === 'All' ? 'Be the first to post a request!' : 'Try selecting a different category.'}
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

const RequestCard: React.FC<{ request: BitsCoinRequest, onClick: () => void, index: number }> = ({ request, onClick, index }) => {
    const formattedDeadline = formatDeadline(request.deadline);
    const isOverdue = request.deadline && new Date(request.deadline) < new Date();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
            onClick={onClick}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group cursor-pointer bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl border border-white/20 dark:border-white/5 p-6 flex flex-col gap-4 relative overflow-hidden transition-all duration-300"
        >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-green/10 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>

            <div className="relative z-10 flex justify-between items-start gap-3">
                <h3 className="font-bold text-xl text-text-main-light dark:text-text-main leading-tight group-hover:text-brand-green transition-colors">
                    {request.title}
                </h3>
                <div className="flex items-center gap-1 bg-brand-green/10 text-brand-green px-3 py-1.5 rounded-xl font-black text-lg shadow-sm border border-brand-green/20">
                    <CurrencyRupeeIcon className="w-5 h-5" />
                    <span>{request.reward}</span>
                </div>
            </div>

            <div className="relative z-10 flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 uppercase tracking-wider">
                    {request.category}
                </span>
                {formattedDeadline && (
                    <span className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1 ${isOverdue
                        ? 'bg-accent-red/10 text-accent-red border-accent-red/20'
                        : 'bg-accent-blue/10 text-accent-blue border-accent-blue/20'
                        }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {formattedDeadline}
                    </span>
                )}
            </div>

            <p className="relative z-10 text-sm text-text-secondary-light dark:text-text-secondary line-clamp-2 flex-grow">
                {request.description}
            </p>

            <div className="relative z-10 flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8">
                        <img
                            src={request.requester.avatar_url || ''}
                            alt="requester"
                            className="w-full h-full rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-sm"
                        />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                    </div>
                    <span className="text-xs font-bold text-text-secondary-light dark:text-text-secondary">
                        @{request.requester.username}
                    </span>
                </div>

                <div>
                    {request.status === 'open' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-accent-blue/30 dark:text-accent-blue">
                            Open
                        </span>
                    )}
                    {request.status === 'claimed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-accent-yellow/30 dark:text-accent-yellow">
                            Claimed
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const CreateRequestModal: React.FC<{ campus: string; onClose: () => void; onRequestCreated: (newRequest: BitsCoinRequest) => void; }> = ({ campus, onClose, onRequestCreated }) => {
    const { user, profile } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [reward, setReward] = useState('');
    const [category, setCategory] = useState('');
    const [deadline, setDeadline] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profile || !title || !reward || !category) { setError('Title, reward, and category are required.'); return; }
        setIsSubmitting(true); setError('');
        try {
            const { data, error } = await supabase.from('bits_coin_requests').insert({ requester_id: user.id, campus, title, description, reward: parseFloat(reward), category, deadline: deadline ? new Date(deadline).toISOString() : null }).select().single();
            if (error) throw error;
            const newRequest: BitsCoinRequest = { ...data, requester: { user_id: profile.user_id, username: profile.username, full_name: profile.full_name || '', avatar_url: profile.avatar_url || '' }, claimer: null };
            onRequestCreated(newRequest);
        } catch (err: any) { setError(err.message); } finally { setIsSubmitting(false); }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg border border-white/20 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
                    <header className="p-6 bg-gradient-to-r from-brand-green/10 to-transparent border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-600">
                                Create Request
                            </h2>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary">Post a task and set your reward</p>
                        </div>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <XCircleIcon className="w-6 h-6 text-gray-400" />
                        </button>
                    </header>

                    <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-text-main-light dark:text-text-main">Task Title*</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                                placeholder="e.g., Deliver food from Redi"
                                className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-transparent focus:border-brand-green focus:bg-white dark:focus:bg-gray-800 transition-all outline-none font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-text-main-light dark:text-text-main">Reward (₹)*</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        value={reward}
                                        onChange={e => setReward(e.target.value)}
                                        required
                                        min="0"
                                        placeholder="50"
                                        className="w-full pl-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-transparent focus:border-brand-green focus:bg-white dark:focus:bg-gray-800 transition-all outline-none font-bold"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-text-main-light dark:text-text-main">Category*</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    required
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-transparent focus:border-brand-green focus:bg-white dark:focus:bg-gray-800 transition-all outline-none appearance-none"
                                >
                                    <option value="" disabled>Select...</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2 text-text-main-light dark:text-text-main">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={4}
                                placeholder="Provide details about the task..."
                                className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-transparent focus:border-brand-green focus:bg-white dark:focus:bg-gray-800 transition-all outline-none resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2 text-text-main-light dark:text-text-main">Deadline (Optional)</label>
                            <input
                                type="datetime-local"
                                value={deadline}
                                onChange={e => setDeadline(e.target.value)}
                                className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-transparent focus:border-brand-green focus:bg-white dark:focus:bg-gray-800 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {error && <p className="mx-6 mb-4 text-accent-red text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">{error}</p>}

                    <footer className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-800/30">
                        <button
                            type="button"
                            onClick={onClose}
                            className="py-3 px-6 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="py-3 px-8 rounded-xl font-bold text-white bg-gradient-to-r from-brand-green to-emerald-600 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            {isSubmitting ? <Spinner /> : 'Post Request'}
                        </button>
                    </footer>
                </form>
            </motion.div>
        </motion.div>
    );
};

const RequestDetailModal: React.FC<{ request: BitsCoinRequest, onClose: () => void, onRequestUpdate: (updatedRequest: BitsCoinRequest) => void }> = ({ request, onClose, onRequestUpdate }) => {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showRatingModalFor, setShowRatingModalFor] = useState<'requester' | 'claimer' | null>(null);

    const handleAction = async (action: 'claim' | 'unclaim' | 'complete' | 'cancel') => {
        if (!user || !profile) return;
        setIsSubmitting(true);
        let updateData: any = {};
        if (action === 'claim') updateData = { status: 'claimed', claimed_by_id: user.id };
        if (action === 'unclaim') updateData = { status: 'open', claimed_by_id: null };
        if (action === 'complete') updateData = { status: 'completed' };
        if (action === 'cancel') updateData = { status: 'cancelled' };

        try {
            const { data, error } = await supabase.from('bits_coin_requests').update(updateData).eq('id', request.id).select().single();
            if (error) throw error;

            const updatedRequest: BitsCoinRequest = { ...request, ...data, claimer: action === 'claim' ? { user_id: profile.user_id, username: profile.username, full_name: profile.full_name || '', avatar_url: profile.avatar_url || '' } : (action === 'unclaim' ? null : request.claimer) };

            if (action === 'complete' && user.id === request.requester.user_id) {
                setShowRatingModalFor('claimer');
            } else {
                onRequestUpdate(updatedRequest);
            }
        } catch (error) { console.error('Error updating request status:', error); } finally { setIsSubmitting(false); }
    };

    const handleContact = (personToContact: BitsCoinRequest['requester'] | BitsCoinRequest['claimer']) => {
        if (!personToContact) return;
        router.push(`/chat?recipient=${personToContact.user_id}`);
    };

    const isOwner = user?.id === request.requester.user_id;
    const isClaimer = user?.id === request.claimer?.user_id;

    if (showRatingModalFor && request.claimer) {
        return <RateBitsCoinUserModal
            request={request}
            personToRate={showRatingModalFor}
            onClose={() => onRequestUpdate({ ...request, status: 'completed' })}
        />
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-white/20 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-green/5 to-transparent">
                    <div className="flex-1">
                        <h2 className="text-2xl md:text-3xl font-black text-text-main-light dark:text-text-main mb-2">{request.title}</h2>
                        <div className="flex items-center gap-3 flex-wrap">
                            <Link
                                href={`/reputation/${request.requester.username}`}
                                className="flex items-center gap-2 text-sm text-text-tertiary-light dark:text-text-tertiary hover:text-brand-green transition-colors group"
                            >
                                <img src={request.requester.avatar_url || ''} alt="requester" className="w-6 h-6 rounded-full ring-2 ring-gray-100 dark:ring-gray-800 group-hover:ring-brand-green transition-all" />
                                <span className="font-semibold">Posted by @{request.requester.username}</span>
                            </Link>
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary text-xs font-bold rounded-lg">
                                {request.category}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <XCircleIcon className="w-8 h-8 text-gray-400" />
                    </button>
                </header>

                <main className="p-6 flex-grow overflow-y-auto space-y-6 custom-scrollbar">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <p className="text-lg text-text-main-light dark:text-text-main whitespace-pre-wrap leading-relaxed font-medium">
                            {request.description || "No description provided."}
                        </p>
                    </div>

                    {request.claimer && (
                        <div className="bg-gradient-to-r from-brand-green/10 to-transparent p-6 rounded-2xl border-l-4 border-brand-green">
                            <p className="text-xs font-bold text-brand-green mb-4 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
                                Task Claimed By
                            </p>
                            <div className="flex items-center justify-between">
                                <Link href={`/reputation/${request.claimer.username}`} className="flex items-center gap-4 group">
                                    <img
                                        src={request.claimer.avatar_url || ''}
                                        alt="claimer"
                                        className="w-14 h-14 rounded-full ring-4 ring-white dark:ring-gray-900 group-hover:ring-brand-green transition-all"
                                    />
                                    <div>
                                        <span className="font-bold text-xl text-text-main-light dark:text-text-main group-hover:text-brand-green transition-colors block">
                                            @{request.claimer.username}
                                        </span>
                                        <span className="text-sm text-text-secondary-light dark:text-text-secondary">Click to view profile</span>
                                    </div>
                                </Link>
                                {!isClaimer && (
                                    <button
                                        disabled={isSubmitting}
                                        onClick={() => handleContact(request.claimer!)}
                                        className="flex items-center gap-2 text-sm font-bold bg-white dark:bg-gray-800 text-brand-green py-3 px-5 rounded-xl shadow-sm hover:shadow-md hover:scale-105 transition-all border border-brand-green/20"
                                    >
                                        <ChatIcon className="w-5 h-5" />
                                        Message
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </main>

                <footer className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-600">
                            <div className="p-2 bg-brand-green/10 rounded-xl">
                                <CurrencyRupeeIcon className="w-10 h-10 text-brand-green" />
                            </div>
                            <span>{request.reward}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap justify-end">
                        {isOwner && request.status === 'open' && (
                            <button
                                disabled={isSubmitting}
                                onClick={() => handleAction('cancel')}
                                className="font-bold py-3 px-6 rounded-xl border-2 border-red-200 dark:border-red-900 text-accent-red hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-105 transition-all"
                            >
                                {isSubmitting ? <Spinner /> : 'Cancel Request'}
                            </button>
                        )}

                        {isOwner && request.status === 'claimed' && (
                            <button
                                disabled={isSubmitting}
                                onClick={() => handleContact(request.claimer!)}
                                className="flex items-center gap-2 font-bold py-3 px-6 rounded-xl border-2 border-brand-green text-brand-green hover:bg-brand-green/10 hover:scale-105 transition-all"
                            >
                                <ChatIcon className="w-5 h-5" />
                                Contact Claimer
                            </button>
                        )}

                        {isClaimer && request.status === 'claimed' && (
                            <button
                                disabled={isSubmitting}
                                onClick={() => handleAction('unclaim')}
                                className="font-bold py-3 px-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105 transition-all"
                            >
                                {isSubmitting ? <Spinner /> : 'Un-claim Task'}
                            </button>
                        )}

                        {isOwner && request.status === 'claimed' && (
                            <button
                                disabled={isSubmitting}
                                onClick={() => handleAction('complete')}
                                className="font-bold py-4 px-10 rounded-xl text-white bg-gradient-to-r from-brand-green to-emerald-600 hover:shadow-lg hover:shadow-brand-green/30 hover:scale-105 transition-all"
                            >
                                {isSubmitting ? <Spinner /> : '✓ Mark Complete'}
                            </button>
                        )}

                        {!isOwner && request.status === 'open' && (
                            <button
                                disabled={isSubmitting}
                                onClick={() => handleAction('claim')}
                                className="font-bold py-4 px-10 rounded-xl text-white bg-gradient-to-r from-brand-green to-emerald-600 hover:shadow-lg hover:shadow-brand-green/30 hover:scale-105 transition-all"
                            >
                                {isSubmitting ? <Spinner /> : 'Claim Task'}
                            </button>
                        )}
                    </div>
                </footer>
            </motion.div>
        </motion.div>
    );
};

export default BitsCoinPage;
