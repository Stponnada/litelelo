// src/pages/BitsCoinPage.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/Spinner';
import { CurrencyRupeeIcon, XCircleIcon, ChatIcon } from '../components/icons';
import { formatTimestamp, formatDeadline } from '../utils/timeUtils';
import { Link, useNavigate } from 'react-router-dom';
import RateBitsCoinUserModal from '../components/RateBitsCoinUserModal';

// ... (Constants and Type Definitions remain the same)
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
    // ... (State and fetch functions remain the same)
    const { profile } = useAuth();
    const [requests, setRequests] = useState<BitsCoinRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<BitsCoinRequest | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('All');

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
        <div className="max-w-7xl mx-auto">
            {isCreateModalOpen && profile && (
                <CreateRequestModal campus={profile.campus!} onClose={() => setCreateModalOpen(false)} onRequestCreated={handleRequestCreated} />
            )}
            {selectedRequest && (
                <RequestDetailModal request={selectedRequest} onClose={() => setSelectedRequest(null)} onRequestUpdate={handleRequestUpdated} />
            )}
            {/* ... (Rest of the Page JSX is the same) ... */}
            <header className="mb-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-text-main-light dark:text-text-main">Bits-coin Board</h1>
                        <p className="text-lg text-text-secondary-light dark:text-text-secondary">Earn by helping out fellow BITSians.</p>
                    </div>
                    <button onClick={() => setCreateModalOpen(true)} className="bg-brand-green text-black font-bold py-3 px-6 rounded-lg hover:bg-brand-green-darker transition-colors">
                        + Create Request
                    </button>
                </div>
            </header>
            <div className="mb-8 overflow-x-auto pb-4">
                <div className="flex gap-2 w-max">
                    {allCategories.map(cat => (
                        <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${selectedCategory === cat ? 'bg-brand-green text-black shadow-md' : 'bg-secondary-light dark:bg-secondary text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light/50 dark:hover:bg-tertiary/50'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
            {filteredRequests.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRequests.map(req => <RequestCard key={req.id} request={req} onClick={() => setSelectedRequest(req)} />)}
                 </div>
            ) : (
                <div className="text-center py-20 bg-secondary-light dark:bg-secondary rounded-lg border-2 border-dashed border-tertiary-light dark:border-tertiary">
                     <h3 className="text-xl font-bold">No requests found!</h3>
                     <p className="text-text-secondary-light dark:text-text-secondary mt-2">{selectedCategory === 'All' ? 'Be the first to post a request.' : `Try selecting a different category.`}</p>
                </div>
            )}
        </div>
    );
};

const RequestCard: React.FC<{ request: BitsCoinRequest, onClick: () => void }> = ({ request, onClick }) => {
    // ... (This component remains the same)
    const formattedDeadline = formatDeadline(request.deadline);
    const isOverdue = request.deadline && new Date(request.deadline) < new Date();
    return (
        <div onClick={onClick} className="cursor-pointer bg-secondary-light dark:bg-secondary rounded-lg shadow-lg border border-tertiary-light dark:border-tertiary p-5 flex flex-col gap-4 hover:border-brand-green/50 hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start gap-3">
                <h3 className="font-bold text-xl text-text-main-light dark:text-text-main pr-2">{request.title}</h3>
                <div className="flex items-center gap-1 bg-brand-green/20 text-brand-green px-3 py-1 rounded-full font-bold text-lg flex-shrink-0">
                    <CurrencyRupeeIcon className="w-5 h-5" />
                    <span>{request.reward}</span>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-1 bg-tertiary-light/60 dark:bg-tertiary/60 text-text-secondary-light dark:text-text-secondary text-xs font-semibold rounded-md">{request.category}</span>
                {formattedDeadline && (<span className={`px-2 py-1 text-xs font-semibold rounded-md ${isOverdue ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>{formattedDeadline}</span>)}
            </div>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary line-clamp-2 flex-grow min-h-[40px]">{request.description}</p>
            <div className="flex items-center justify-between pt-4 border-t border-tertiary-light dark:border-tertiary">
                <Link to={`/reputation/${request.requester.username}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 group">
                    <img src={request.requester.avatar_url || ''} alt="requester" className="w-8 h-8 rounded-full object-cover"/>
                    <span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary group-hover:underline">@{request.requester.username}</span>
                </Link>
                {request.status === 'open' && (<div className="font-semibold text-sm py-2 px-4 rounded-lg bg-blue-500/10 text-blue-400">Open</div>)}
                {request.status === 'claimed' && (<div className="font-semibold text-sm py-2 px-4 rounded-lg bg-yellow-500/10 text-yellow-400">Claimed</div>)}
            </div>
        </div>
    );
};

const CreateRequestModal: React.FC<{ campus: string; onClose: () => void; onRequestCreated: (newRequest: BitsCoinRequest) => void; }> = ({ campus, onClose, onRequestCreated }) => {
    // ... (This component remains the same)
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
         <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-lg w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6">
                    <header className="flex items-center justify-between pb-4 border-b border-tertiary-light dark:border-tertiary">
                        <h2 className="text-xl font-bold">Create a Bits-coin Request</h2>
                        <button type="button" onClick={onClose}><XCircleIcon className="w-8 h-8 text-text-tertiary-light dark:text-text-tertiary" /></button>
                    </header>
                    <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        <div><label className="block text-sm font-medium">Task Title*</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium">Reward (₹)*</label><input type="number" value={reward} onChange={e => setReward(e.target.value)} required min="0" className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" /></div>
                            <div><label className="block text-sm font-medium">Category*</label><select value={category} onChange={e => setCategory(e.target.value)} required className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600"><option value="" disabled>Select...</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        </div>
                        <div><label className="block text-sm font-medium">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" /></div>
                        <div><label className="block text-sm font-medium">Deadline (Optional)</label><input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" /></div>
                    </div>
                     {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
                    <footer className="flex justify-end space-x-4 pt-6 mt-4 border-t border-tertiary-light dark:border-tertiary">
                        <button type="button" onClick={onClose} className="py-2 px-6 rounded-full hover:bg-tertiary-light/60 dark:hover:bg-tertiary">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="py-2 px-6 rounded-full text-black bg-brand-green hover:bg-brand-green-darker disabled:opacity-50">{isSubmitting ? <Spinner /> : 'Post Request'}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

const RequestDetailModal: React.FC<{ request: BitsCoinRequest, onClose: () => void, onRequestUpdate: (updatedRequest: BitsCoinRequest) => void }> = ({ request, onClose, onRequestUpdate }) => {
    // ... (This component is updated to handle the rating flow)
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
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                 <header className="flex items-start justify-between p-6 border-b border-tertiary-light dark:border-tertiary">
                    <div>
                        <h2 className="text-2xl font-bold">{request.title}</h2>
                        <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">Posted by @{request.requester.username}</p>
                    </div>
                    <button onClick={onClose}><XCircleIcon className="w-8 h-8 text-text-tertiary-light dark:text-text-tertiary" /></button>
                </header>
                <main className="p-6 flex-grow overflow-y-auto space-y-4">
                    <p className="text-text-secondary-light dark:text-text-secondary whitespace-pre-wrap">{request.description}</p>
                    {request.claimer && (
                        <div className="bg-tertiary-light/50 dark:bg-tertiary/50 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary mb-2">CLAIMED BY</p>
                            <div className="flex items-center justify-between">
                                <Link to={`/reputation/${request.claimer.username}`} className="flex items-center gap-2 group">
                                    <img src={request.claimer.avatar_url || ''} alt="claimer" className="w-10 h-10 rounded-full"/>
                                    <span className="font-bold group-hover:underline">@{request.claimer.username}</span>
                                </Link>
                                {!isClaimer && <button disabled={isSubmitting} onClick={() => handleContact(request.claimer)} className="flex items-center gap-2 text-sm font-semibold bg-brand-green/20 text-brand-green py-2 px-3 rounded-lg"><ChatIcon className="w-4 h-4"/>Contact</button>}
                            </div>
                        </div>
                    )}
                </main>
                <footer className="p-6 border-t border-tertiary-light dark:border-tertiary flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-3xl font-bold text-brand-green">
                        <CurrencyRupeeIcon className="w-8 h-8"/>
                        <span>{request.reward}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isOwner && request.status === 'open' && <button disabled={isSubmitting} onClick={() => handleAction('cancel')} className="font-semibold py-2 px-4 rounded-lg border border-red-500 text-red-500 hover:bg-red-500/10">{isSubmitting ? <Spinner/> : 'Cancel Request'}</button>}
                        {isOwner && request.status === 'claimed' && <button disabled={isSubmitting} onClick={() => handleContact(request.claimer)} className="flex items-center gap-2 font-semibold py-2 px-4 rounded-lg border border-brand-green text-brand-green hover:bg-brand-green/10"><ChatIcon className="w-4 h-4"/>Contact</button>}
                        {isClaimer && request.status === 'claimed' && <button disabled={isSubmitting} onClick={() => handleAction('unclaim')} className="font-semibold py-2 px-4 rounded-lg border border-gray-400 dark:border-gray-500 hover:bg-tertiary">{isSubmitting ? <Spinner/> : 'Un-claim'}</button>}
                        {isOwner && request.status === 'claimed' && <button disabled={isSubmitting} onClick={() => handleAction('complete')} className="font-bold py-2 px-6 rounded-lg text-black bg-brand-green hover:bg-brand-green-darker">{isSubmitting ? <Spinner/> : 'Mark as Complete'}</button>}
                        {!isOwner && request.status === 'open' && <button disabled={isSubmitting} onClick={() => handleAction('claim')} className="font-bold py-2 px-6 rounded-lg text-black bg-brand-green hover:bg-brand-green-darker">{isSubmitting ? <Spinner/> : 'Claim Task'}</button>}
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default BitsCoinPage;