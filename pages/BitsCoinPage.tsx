// src/pages/BitsCoinPage.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/Spinner';
import { CurrencyRupeeIcon, XCircleIcon, ChatIcon } from '../components/icons';
import { formatTimestamp, formatDeadline } from '../utils/timeUtils';
import { Link, useNavigate } from 'react-router-dom';
import RateBitsCoinUserModal from '../components/RateBitsCoinUserModal';

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
    const navigate = useNavigate();

    const handleTitleClick = () => {
        setClickCount(prev => prev + 1);
    };

    useEffect(() => {
        if (clickCount === 0) return;
        if (clickCount >= 7) {
            navigate('/easter-egg/blockchain');
        }
        const timer = setTimeout(() => setClickCount(0), 1500);
        return () => clearTimeout(timer);
    }, [clickCount, navigate]);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {isCreateModalOpen && profile && (
                <CreateRequestModal campus={profile.campus!} onClose={() => setCreateModalOpen(false)} onRequestCreated={handleRequestCreated} />
            )}
            {selectedRequest && (
                <RequestDetailModal request={selectedRequest} onClose={() => setSelectedRequest(null)} onRequestUpdate={handleRequestUpdated} />
            )}
            
            {/* Enhanced Header with Gradient Background */}
            <header className="mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-green/20 via-brand-green/10 to-transparent dark:from-brand-green/10 dark:via-brand-green/5 p-8 border border-brand-green/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <h1 
                                    className="text-5xl font-extrabold text-text-main-light dark:text-text-main bg-gradient-to-r from-brand-green to-brand-green-darker bg-clip-text text-transparent cursor-pointer hover:scale-[1.02] active:scale-100 transition-transform duration-200"
                                    onClick={handleTitleClick}
                                    title="What are you clicking at?"
                                >
                                    Request Board
                                </h1>
                            </div>
                            <p className="text-lg text-text-secondary-light dark:text-text-secondary max-w-xl">
                                Collect my package from CP for ₹20 please ...
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-full">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                    <span className="font-semibold">{requests.filter(r => r.status === 'open').length} Open Tasks</span>
                                </div>
                                <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-400 px-3 py-1.5 rounded-full">
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                    <span className="font-semibold">{requests.filter(r => r.status === 'claimed').length} In Progress</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setCreateModalOpen(true)} 
                            className="bg-gradient-to-r from-brand-green to-brand-green-darker text-black font-bold py-4 px-8 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2 group"
                        >
                            <span className="text-2xl group-hover:rotate-90 transition-transform duration-200">+</span>
                            <span>Create Request</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Enhanced Category Filter */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-1 w-12 bg-brand-green rounded-full"></div>
                    <h2 className="text-sm font-bold text-text-secondary-light dark:text-text-secondary uppercase tracking-wider">Filter by Category</h2>
                </div>
                <div className="overflow-x-auto pb-4 -mx-4 px-4">
                    <div className="flex gap-3 w-max">
                        {allCategories.map(cat => (
                            <button 
                                key={cat} 
                                onClick={() => setSelectedCategory(cat)} 
                                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
                                    selectedCategory === cat 
                                        ? 'bg-gradient-to-r from-brand-green to-brand-green-darker text-black shadow-lg shadow-brand-green/30 scale-105' 
                                        : 'bg-secondary-light dark:bg-secondary text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light/70 dark:hover:bg-tertiary/70 hover:scale-105 border border-tertiary-light dark:border-tertiary'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Enhanced Request Grid */}
            {filteredRequests.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRequests.map(req => <RequestCard key={req.id} request={req} onClick={() => setSelectedRequest(req)} />)}
                 </div>
            ) : (
                <div className="text-center py-24 bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl border-2 border-dashed border-tertiary-light dark:border-tertiary">
                     <div className="inline-block p-6 bg-brand-green/10 rounded-full mb-4">
                        <CurrencyRupeeIcon className="w-16 h-16 text-brand-green opacity-50" />
                     </div>
                     <h3 className="text-2xl font-bold mb-2">No requests found</h3>
                     <p className="text-text-secondary-light dark:text-text-secondary">
                         {selectedCategory === 'All' ? 'Be the first to post a request!' : 'Try selecting a different category.'}
                     </p>
                </div>
            )}
        </div>
    );
};

const RequestCard: React.FC<{ request: BitsCoinRequest, onClick: () => void }> = ({ request, onClick }) => {
    const formattedDeadline = formatDeadline(request.deadline);
    const isOverdue = request.deadline && new Date(request.deadline) < new Date();
    
    return (
        <div 
            onClick={onClick} 
            className="group cursor-pointer bg-gradient-to-br from-secondary-light to-secondary-light dark:from-secondary dark:to-secondary rounded-2xl shadow-lg border border-tertiary-light dark:border-tertiary p-6 flex flex-col gap-4 hover:border-brand-green hover:shadow-2xl hover:shadow-brand-green/20 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden"
        >
            {/* Decorative gradient overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            
            <div className="relative z-10 flex justify-between items-start gap-3">
                <h3 className="font-bold text-xl text-text-main-light dark:text-text-main pr-2 group-hover:text-brand-green transition-colors duration-200">
                    {request.title}
                </h3>
                <div className="flex items-center gap-1 bg-gradient-to-r from-brand-green/20 to-brand-green/30 text-brand-green px-4 py-2 rounded-xl font-bold text-lg flex-shrink-0 shadow-md">
                    <CurrencyRupeeIcon className="w-5 h-5" />
                    <span>{request.reward}</span>
                </div>
            </div>
            
            <div className="relative z-10 flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1.5 bg-gradient-to-r from-tertiary-light/80 to-tertiary-light/60 dark:from-tertiary/80 dark:to-tertiary/60 text-text-secondary-light dark:text-text-secondary text-xs font-bold rounded-lg border border-tertiary-light dark:border-tertiary">
                    {request.category}
                </span>
                {formattedDeadline && (
                    <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                        isOverdue 
                            ? 'bg-red-500/10 text-red-400 border-red-500/30' 
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }`}>
                        {formattedDeadline}
                    </span>
                )}
            </div>
            
            <p className="relative z-10 text-sm text-text-secondary-light dark:text-text-secondary line-clamp-2 flex-grow min-h-[40px]">
                {request.description}
            </p>
            
            <div className="relative z-10 flex items-center justify-between pt-4 border-t border-tertiary-light dark:border-tertiary">
                <Link 
                    to={`/reputation/${request.requester.username}`} 
                    onClick={e => e.stopPropagation()} 
                    className="flex items-center gap-2 group/avatar"
                >
                    <div className="relative">
                        <img 
                            src={request.requester.avatar_url || ''} 
                            alt="requester" 
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-tertiary-light dark:ring-tertiary group-hover/avatar:ring-brand-green transition-all duration-200"
                        />
                        <div className="absolute inset-0 rounded-full bg-brand-green opacity-0 group-hover/avatar:opacity-20 transition-opacity duration-200"></div>
                    </div>
                    <span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary group-hover/avatar:text-brand-green transition-colors duration-200">
                        @{request.requester.username}
                    </span>
                </Link>
                
                {request.status === 'open' && (
                    <div className="font-bold text-sm py-2 px-4 rounded-lg bg-gradient-to-r from-blue-500/20 to-blue-500/10 text-blue-400 border border-blue-500/30">
                        Open
                    </div>
                )}
                {request.status === 'claimed' && (
                    <div className="font-bold text-sm py-2 px-4 rounded-lg bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                        Claimed
                    </div>
                )}
            </div>
        </div>
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
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl shadow-2xl w-full max-w-lg border border-tertiary-light dark:border-tertiary animate-slideUp" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6">
                    <header className="flex items-center justify-between pb-5 border-b border-tertiary-light dark:border-tertiary">
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-brand-green to-brand-green-darker bg-clip-text text-transparent">
                                Create Request
                            </h2>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary mt-1">Post a task and set your reward</p>
                        </div>
                        <button type="button" onClick={onClose} className="hover:bg-tertiary-light dark:hover:bg-tertiary rounded-lg p-1 transition-colors">
                            <XCircleIcon className="w-7 h-7 text-text-tertiary-light dark:text-text-tertiary" />
                        </button>
                    </header>
                    
                    <div className="mt-6 space-y-5 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-text-main-light dark:text-text-main">Task Title*</label>
                            <input 
                                type="text" 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                required 
                                placeholder="e.g., Deliver food from Redi"
                                className="w-full p-3 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-tertiary-light dark:border-gray-600 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none" 
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-text-main-light dark:text-text-main">Reward (₹)*</label>
                                <input 
                                    type="number" 
                                    value={reward} 
                                    onChange={e => setReward(e.target.value)} 
                                    required 
                                    min="0" 
                                    placeholder="50"
                                    className="w-full p-3 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-tertiary-light dark:border-gray-600 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-text-main-light dark:text-text-main">Category*</label>
                                <select 
                                    value={category} 
                                    onChange={e => setCategory(e.target.value)} 
                                    required 
                                    className="w-full p-3 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-tertiary-light dark:border-gray-600 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none"
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
                                className="w-full p-3 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-tertiary-light dark:border-gray-600 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none resize-none" 
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold mb-2 text-text-main-light dark:text-text-main">Deadline (Optional)</label>
                            <input 
                                type="datetime-local" 
                                value={deadline} 
                                onChange={e => setDeadline(e.target.value)} 
                                className="w-full p-3 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-tertiary-light dark:border-gray-600 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none" 
                            />
                        </div>
                    </div>
                    
                     {error && <p className="text-red-400 text-sm mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30">{error}</p>}
                    
                    <footer className="flex justify-end space-x-3 pt-6 mt-6 border-t border-tertiary-light dark:border-tertiary">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="py-2.5 px-6 rounded-xl font-semibold hover:bg-tertiary-light dark:hover:bg-tertiary transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="py-2.5 px-8 rounded-xl font-bold text-black bg-gradient-to-r from-brand-green to-brand-green-darker hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            {isSubmitting ? <Spinner /> : 'Post Request'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

const RequestDetailModal: React.FC<{ request: BitsCoinRequest, onClose: () => void, onRequestUpdate: (updatedRequest: BitsCoinRequest) => void }> = ({ request, onClose, onRequestUpdate }) => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
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
        navigate('/chat', { state: { recipient: personToContact } });
    };

    const isOwner = user?.id === request.requester.user_id;
    const isClaimer = user?.id === request.claimer?.user_id;

    if (showRatingModalFor && request.claimer) {
        return <RateBitsCoinUserModal 
            request={request} 
            personToRate={showRatingModalFor} 
            onClose={() => onRequestUpdate({ ...request, status: 'completed'})} 
        />
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-tertiary-light dark:border-tertiary animate-slideUp" onClick={e => e.stopPropagation()}>
                 <header className="flex items-start justify-between p-6 border-b border-tertiary-light dark:border-tertiary bg-gradient-to-r from-brand-green/5 to-transparent">
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold mb-2 text-text-main-light dark:text-text-main">{request.title}</h2>
                        <div className="flex items-center gap-3 flex-wrap">
                            <Link 
                                to={`/reputation/${request.requester.username}`}
                                className="flex items-center gap-2 text-sm text-text-tertiary-light dark:text-text-tertiary hover:text-brand-green transition-colors group"
                            >
                                <img src={request.requester.avatar_url || ''} alt="requester" className="w-6 h-6 rounded-full ring-2 ring-tertiary-light dark:ring-tertiary group-hover:ring-brand-green transition-all"/>
                                <span className="font-semibold">Posted by @{request.requester.username}</span>
                            </Link>
                            <span className="px-3 py-1 bg-tertiary-light/60 dark:bg-tertiary/60 text-text-secondary-light dark:text-text-secondary text-xs font-bold rounded-lg">
                                {request.category}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-tertiary-light dark:hover:bg-tertiary rounded-lg p-1 transition-colors">
                        <XCircleIcon className="w-7 h-7 text-text-tertiary-light dark:text-text-tertiary" />
                    </button>
                </header>
                
                <main className="p-6 flex-grow overflow-y-auto space-y-5 custom-scrollbar">
                    <div className="bg-tertiary-light/30 dark:bg-tertiary/30 p-4 rounded-xl border border-tertiary-light dark:border-tertiary">
                        <p className="text-text-main-light dark:text-text-main whitespace-pre-wrap leading-relaxed">
                            {request.description || "No description provided."}
                        </p>
                    </div>
                    
                    {request.claimer && (
                        <div className="bg-gradient-to-r from-brand-green/10 to-transparent p-5 rounded-xl border-l-4 border-brand-green">
                            <p className="text-xs font-bold text-brand-green mb-3 uppercase tracking-wider">Task Claimed By</p>
                            <div className="flex items-center justify-between">
                                <Link to={`/reputation/${request.claimer.username}`} className="flex items-center gap-3 group">
                                    <img 
                                        src={request.claimer.avatar_url || ''} 
                                        alt="claimer" 
                                        className="w-12 h-12 rounded-full ring-2 ring-brand-green/50 group-hover:ring-brand-green transition-all"
                                    />
                                    <div>
                                        <span className="font-bold text-lg text-text-main-light dark:text-text-main group-hover:text-brand-green transition-colors">
                                            @{request.claimer.username}
                                        </span>
                                        <p className="text-xs text-text-secondary-light dark:text-text-secondary">Click to view profile</p>
                                    </div>
                                </Link>
                                {!isClaimer && (
                                    <button 
                                        disabled={isSubmitting} 
                                        onClick={() => handleContact(request.claimer)} 
                                        className="flex items-center gap-2 text-sm font-bold bg-brand-green/20 text-brand-green py-2.5 px-4 rounded-xl hover:bg-brand-green/30 hover:scale-105 transition-all"
                                    >
                                        <ChatIcon className="w-4 h-4"/>
                                        Contact
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </main>
                
                <footer className="p-6 border-t border-tertiary-light dark:border-tertiary bg-gradient-to-r from-brand-green/5 to-transparent flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-4xl font-extrabold text-brand-green">
                            <div className="p-2 bg-brand-green/10 rounded-xl">
                                <CurrencyRupeeIcon className="w-10 h-10"/>
                            </div>
                            <span>{request.reward}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-wrap justify-end">
                        {isOwner && request.status === 'open' && (
                            <button 
                                disabled={isSubmitting} 
                                onClick={() => handleAction('cancel')} 
                                className="font-bold py-2.5 px-5 rounded-xl border-2 border-red-500 text-red-500 hover:bg-red-500/10 hover:scale-105 transition-all"
                            >
                                {isSubmitting ? <Spinner/> : 'Cancel Request'}
                            </button>
                        )}
                        
                        {isOwner && request.status === 'claimed' && (
                            <button 
                                disabled={isSubmitting} 
                                onClick={() => handleContact(request.claimer)} 
                                className="flex items-center gap-2 font-bold py-2.5 px-5 rounded-xl border-2 border-brand-green text-brand-green hover:bg-brand-green/10 hover:scale-105 transition-all"
                            >
                                <ChatIcon className="w-5 h-5"/>
                                Contact Claimer
                            </button>
                        )}
                        
                        {isClaimer && request.status === 'claimed' && (
                            <button 
                                disabled={isSubmitting} 
                                onClick={() => handleAction('unclaim')} 
                                className="font-bold py-2.5 px-5 rounded-xl border-2 border-gray-400 dark:border-gray-500 hover:bg-tertiary hover:scale-105 transition-all"
                            >
                                {isSubmitting ? <Spinner/> : 'Un-claim Task'}
                            </button>
                        )}
                        
                        {isOwner && request.status === 'claimed' && (
                            <button 
                                disabled={isSubmitting} 
                                onClick={() => handleAction('complete')} 
                                className="font-bold py-3 px-8 rounded-xl text-black bg-gradient-to-r from-brand-green to-brand-green-darker hover:shadow-lg hover:scale-105 transition-all"
                            >
                                {isSubmitting ? <Spinner/> : '✓ Mark Complete'}
                            </button>
                        )}
                        
                        {!isOwner && request.status === 'open' && (
                            <button 
                                disabled={isSubmitting} 
                                onClick={() => handleAction('claim')} 
                                className="font-bold py-3 px-8 rounded-xl text-black bg-gradient-to-r from-brand-green to-brand-green-darker hover:shadow-lg hover:scale-105 transition-all"
                            >
                                {isSubmitting ? <Spinner/> : 'Claim Task'}
                            </button>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default BitsCoinPage;