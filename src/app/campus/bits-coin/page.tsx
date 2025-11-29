'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';
import { CurrencyRupeeIcon, XCircleIcon, ChatIcon } from '@/components/icons';
import { formatDeadline } from '@/utils/timeUtils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RateBitsCoinUserModal from '@/components/RateBitsCoinUserModal';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility for Tailwind ---
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- CONSTANTS ---
const CATEGORIES = ["Delivery", "Academic Help", "Errands", "Shopping", "Technical", "Other"];

// --- TYPES ---
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

// --- CUSTOM ANIMATION COMPONENTS (REACT BITS STYLE) ---

/**
 * Decrypted Text Effect
 * Scrambles text and reveals it character by character
 */
const DecryptedText = ({ text, className, onClick }: { text: string, className?: string, onClick?: () => void }) => {
    const [displayText, setDisplayText] = useState(text);
    const [isScrambling, setIsScrambling] = useState(false);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+";

    const scramble = () => {
        if (isScrambling) return;
        setIsScrambling(true);
        let iteration = 0;
        const interval = setInterval(() => {
            setDisplayText(text
                .split("")
                .map((letter, index) => {
                    if (index < iteration) return text[index];
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join("")
            );
            if (iteration >= text.length) {
                clearInterval(interval);
                setIsScrambling(false);
            }
            iteration += 1 / 3;
        }, 30);
    };

    useEffect(() => { scramble(); }, []);

    return (
        <span
            className={cn("font-mono cursor-pointer hover:text-brand-green transition-colors", className)}
            onMouseEnter={scramble}
            onClick={onClick}
        >
            {displayText}
        </span>
    );
};

/**
 * Spotlight Card
 * Adds a glowing gradient that follows the mouse cursor
 */
const SpotlightCard = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <motion.div
            className={cn(
                "group relative border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden rounded-xl",
                className
            )}
            onMouseMove={handleMouseMove}
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(16, 185, 129, 0.15),
              transparent 80%
            )
          `,
                }}
            />
            <div className="relative h-full">{children}</div>
        </motion.div>
    );
};

// --- MAIN PAGE COMPONENT ---

const BitsCoinPage: React.FC = () => {
    const { profile } = useAuth();
    const [requests, setRequests] = useState<BitsCoinRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<BitsCoinRequest | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Easter Egg Logic
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

    // Data Fetching
    useEffect(() => {
        const fetchRequests = async () => {
            if (!profile?.campus) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const { data, error } = await supabase.rpc('get_bits_coin_requests', { p_campus: profile.campus });
                if (error) throw error;
                setRequests((data as BitsCoinRequest[]) || []);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [profile?.campus]);

    // Real-time updates
    useEffect(() => {
        if (!profile?.campus) return;
        const fetchUpdates = async () => {
            const { data } = await supabase.rpc('get_bits_coin_requests', { p_campus: profile.campus });
            if (data) setRequests(data as BitsCoinRequest[]);
        };
        const channel = supabase.channel('bits_coin_requests_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bits_coin_requests', filter: `campus=eq.${profile.campus}` }, () => fetchUpdates())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [profile?.campus]);

    const handleRequestCreated = (newRequest: BitsCoinRequest) => {
        setRequests(prev => [newRequest, ...prev]);
        setCreateModalOpen(false);
    };

    const handleRequestUpdated = (updatedRequest: BitsCoinRequest) => {
        setRequests(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r).filter(r => r.status !== 'completed' && r.status !== 'cancelled'));
        setSelectedRequest(null);
    };

    const allCategories = useMemo(() => {
        const unique = Array.from(new Set(requests.map(r => r.category).filter(Boolean)));
        return ['All', ...unique.sort()];
    }, [requests]);

    const filteredRequests = useMemo(() => {
        if (selectedCategory === 'All') return requests;
        return requests.filter(r => r.category === selectedCategory);
    }, [requests, selectedCategory]);

    if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Spinner /></div>;
    if (error) return <div className="h-screen flex items-center justify-center text-red-500 bg-black">{error}</div>;

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-brand-green/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-green/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Modals */}
                <AnimatePresence>
                    {isCreateModalOpen && profile && (
                        <CreateRequestModal campus={profile.campus!} onClose={() => setCreateModalOpen(false)} onRequestCreated={handleRequestCreated} />
                    )}
                    {selectedRequest && (
                        <RequestDetailModal request={selectedRequest} onClose={() => setSelectedRequest(null)} onRequestUpdate={handleRequestUpdated} />
                    )}
                </AnimatePresence>

                {/* Header Section */}
                <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-px w-8 bg-brand-green" />
                            <span className="text-brand-green font-mono text-xs tracking-widest uppercase">Can you collect my package from CP?</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-neutral-900 via-neutral-600 to-neutral-900 dark:from-white dark:via-neutral-400 dark:to-neutral-600">
                            <DecryptedText text="Request Board" onClick={handleTitleClick} />
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 max-w-md text-lg leading-relaxed">
                            Earn rewards by solving problems on campus. <br />
                            <span className="text-brand-green font-semibold">Peer-to-peer assistance.</span>
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-6">
                        <div className="flex gap-4">
                            <StatBadge label="Open" count={requests.filter(r => r.status === 'open').length} color="blue" />
                            <StatBadge label="Active" count={requests.filter(r => r.status === 'claimed').length} color="yellow" />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCreateModalOpen(true)}
                            className="relative group overflow-hidden bg-neutral-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-full font-bold text-lg shadow-2xl shadow-brand-green/20"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <span className="text-xl">+</span> Create Request
                            </span>
                            <div className="absolute inset-0 bg-brand-green/80 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        </motion.button>
                    </div>
                </header>

                {/* Filter Bar */}
                <div className="sticky top-4 z-30 mb-10 p-2 rounded-2xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 shadow-sm w-fit mx-auto md:mx-0 overflow-x-auto max-w-full">
                    <div className="flex gap-1 min-w-max">
                        {allCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "relative px-4 py-2 rounded-xl text-sm font-medium transition-colors z-10",
                                    selectedCategory === cat ? "text-white" : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                                )}
                            >
                                {selectedCategory === cat && (
                                    <motion.div
                                        layoutId="activeCategory"
                                        className="absolute inset-0 bg-neutral-900 dark:bg-brand-green rounded-xl -z-10"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                {filteredRequests.length > 0 ? (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode='popLayout'>
                            {filteredRequests.map((req, index) => (
                                <RequestCard key={req.id} request={req} onClick={() => setSelectedRequest(req)} index={index} />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <EmptyState category={selectedCategory} />
                )}
            </div>
        </div>
    );
};

// --- SUB COMPONENTS ---

const StatBadge = ({ label, count, color }: { label: string, count: number, color: 'blue' | 'yellow' }) => {
    const colorStyles = {
        blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        yellow: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    };
    return (
        <div className={cn("flex flex-col items-center px-4 py-2 rounded-2xl border backdrop-blur-sm", colorStyles[color])}>
            <span className="text-2xl font-bold leading-none">{count}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{label}</span>
        </div>
    );
};

const RequestCard = ({ request, onClick, index }: { request: BitsCoinRequest, onClick: () => void, index: number }) => {
    const isOverdue = request.deadline && new Date(request.deadline) < new Date();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
            className="h-full"
        >
            <SpotlightCard onClick={onClick} className="h-full flex flex-col p-6 cursor-pointer shadow-lg hover:shadow-2xl dark:shadow-neutral-950/50 transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 text-xs font-bold rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                        {request.category}
                    </span>
                    <div className="flex items-center gap-1 text-brand-green font-bold text-lg">
                        <CurrencyRupeeIcon className="w-5 h-5" />
                        <span>{request.reward}</span>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 leading-tight line-clamp-2">
                    {request.title}
                </h3>

                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 line-clamp-2 flex-grow">
                    {request.description}
                </p>

                <div className="mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-neutral-100 dark:ring-neutral-800">
                            <Image src={request.requester.avatar_url || ''} alt="" fill className="object-cover" unoptimized />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-neutral-900 dark:text-neutral-200">@{request.requester.username}</span>
                            {request.deadline && (
                                <span className={cn("text-[10px]", isOverdue ? "text-red-500" : "text-neutral-400")}>
                                    {isOverdue ? "Overdue" : formatDeadline(request.deadline)}
                                </span>
                            )}
                        </div>
                    </div>
                    <StatusIndicator status={request.status} />
                </div>
            </SpotlightCard>
        </motion.div>
    );
};

const StatusIndicator = ({ status }: { status: string }) => {
    if (status === 'open') return <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" title="Open" />;
    if (status === 'claimed') return <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)] animate-pulse" title="In Progress" />;
    return <div className="w-2 h-2 rounded-full bg-neutral-500" />;
};

const EmptyState = ({ category }: { category: string }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="col-span-full py-24 flex flex-col items-center justify-center text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl"
    >
        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
            <CurrencyRupeeIcon className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white">No requests found</h3>
        <p className="text-neutral-500">There are no {category !== 'All' ? category.toLowerCase() : ''} requests right now.</p>
    </motion.div>
);

// --- MODALS ---

const ModalBackdrop = ({ onClick, children }: { onClick: () => void, children: React.ReactNode }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-lg z-50 flex items-center justify-center p-4 sm:p-6"
        onClick={onClick}
    >
        {children}
    </motion.div>
);

const CreateRequestModal: React.FC<{ campus: string; onClose: () => void; onRequestCreated: (newRequest: BitsCoinRequest) => void; }> = ({ campus, onClose, onRequestCreated }) => {
    const { user, profile } = useAuth();
    const [formData, setFormData] = useState({ title: '', description: '', reward: '', category: '', deadline: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { data, error } = await supabase.from('bits_coin_requests').insert({
                requester_id: user?.id,
                campus,
                title: formData.title,
                description: formData.description,
                reward: parseFloat(formData.reward),
                category: formData.category,
                deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
            }).select().single();
            if (error) throw error;
            onRequestCreated({ ...data, requester: { user_id: profile!.user_id, username: profile!.username, full_name: profile!.full_name || '', avatar_url: profile!.avatar_url || '' }, claimer: null });
        } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error'); }
        finally { setIsSubmitting(false); }
    };

    return (
        <ModalBackdrop onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">New Request</h2>
                        <button onClick={onClose}><XCircleIcon className="w-6 h-6 text-neutral-400 hover:text-red-500 transition-colors" /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <InputGroup label="Title">
                            <input
                                required
                                className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-4 font-medium focus:ring-2 focus:ring-brand-green outline-none transition-all"
                                placeholder="What do you need?"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </InputGroup>

                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="Reward (₹)">
                                <input
                                    required type="number" min="0"
                                    className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-4 font-bold text-brand-green focus:ring-2 focus:ring-brand-green outline-none"
                                    placeholder="50"
                                    value={formData.reward}
                                    onChange={e => setFormData({ ...formData, reward: e.target.value })}
                                />
                            </InputGroup>
                            <InputGroup label="Category">
                                <select
                                    required
                                    className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-brand-green outline-none appearance-none"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="" disabled>Select...</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </InputGroup>
                        </div>

                        <InputGroup label="Details">
                            <textarea
                                rows={3}
                                className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-brand-green outline-none resize-none"
                                placeholder="Extra instructions..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </InputGroup>

                        <InputGroup label="Deadline (Optional)">
                            <input
                                type="datetime-local"
                                className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-brand-green outline-none text-neutral-500"
                                value={formData.deadline}
                                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                            />
                        </InputGroup>

                        {error && <p className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">{error}</p>}

                        <button
                            disabled={isSubmitting}
                            className="w-full py-4 bg-brand-green hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-green/25 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {isSubmitting ? <Spinner className="w-6 h-6 mx-auto text-white" /> : 'Post to Board'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </ModalBackdrop>
    );
};

const InputGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div>
        <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 ml-1">{label}</label>
        {children}
    </div>
);

const RequestDetailModal: React.FC<{ request: BitsCoinRequest, onClose: () => void, onRequestUpdate: (updatedRequest: BitsCoinRequest) => void }> = ({ request, onClose, onRequestUpdate }) => {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showRatingModalFor, setShowRatingModalFor] = useState<'requester' | 'claimer' | null>(null);

    const handleAction = async (action: 'claim' | 'unclaim' | 'complete' | 'cancel') => {
        if (!user || !profile) return;
        setIsSubmitting(true);
        try {
            const updates = {
                status: action === 'claim' ? 'claimed' : action === 'unclaim' ? 'open' : action === 'complete' ? 'completed' : 'cancelled',
                claimed_by_id: action === 'claim' ? user.id : action === 'unclaim' ? null : undefined
            };
            const { data, error } = await supabase.from('bits_coin_requests').update(updates).eq('id', request.id).select().single();
            if (error) throw error;

            if (action === 'complete' && user.id === request.requester.user_id) setShowRatingModalFor('claimer');
            else onRequestUpdate({ ...request, ...data, claimer: action === 'claim' ? { user_id: profile.user_id, username: profile.username, full_name: profile.full_name || '', avatar_url: profile.avatar_url || '' } : (action === 'unclaim' ? null : request.claimer) });
        } catch (err) { console.error(err); }
        finally { setIsSubmitting(false); }
    };

    if (showRatingModalFor && request.claimer) {
        return <RateBitsCoinUserModal request={request} personToRate={showRatingModalFor} onClose={() => onRequestUpdate({ ...request, status: 'completed' })} />
    }

    const isOwner = user?.id === request.requester.user_id;
    const isClaimer = user?.id === request.claimer?.user_id;

    return (
        <ModalBackdrop onClick={onClose}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-neutral-900 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative h-32 bg-gradient-to-r from-brand-green/20 to-blue-500/20">
                    <div className="absolute top-4 right-4">
                        <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full transition-colors"><XCircleIcon className="w-6 h-6 text-neutral-900 dark:text-white" /></button>
                    </div>
                </div>

                <div className="px-8 -mt-10 pb-8 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-end mb-6">
                        <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20 rounded-2xl border-4 border-white dark:border-neutral-900 shadow-xl overflow-hidden bg-neutral-100">
                                <Image src={request.requester.avatar_url || ''} alt="" fill className="object-cover" unoptimized />
                            </div>
                            <div className="mb-2">
                                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white leading-tight">{request.title}</h2>
                                <Link href={`/reputation/${request.requester.username}`} className="text-neutral-500 hover:text-brand-green transition-colors text-sm font-medium">@{request.requester.username}</Link>
                            </div>
                        </div>
                        <div className="mb-4 bg-brand-green/10 text-brand-green px-4 py-2 rounded-xl font-bold text-xl flex items-center gap-1 border border-brand-green/20">
                            <CurrencyRupeeIcon className="w-6 h-6" /> {request.reward}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Description</h4>
                            <p className="text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">{request.description || "No description provided."}</p>
                        </div>

                        {request.claimer && (
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-transparent rounded-2xl border border-blue-500/20">
                                <div className="flex items-center gap-3">
                                    <Image src={request.claimer.avatar_url || ''} alt="" width={40} height={40} className="rounded-full ring-2 ring-blue-500/50" unoptimized />
                                    <div>
                                        <p className="text-xs text-blue-500 font-bold uppercase">Claimed By</p>
                                        <p className="font-bold text-neutral-900 dark:text-white">@{request.claimer.username}</p>
                                    </div>
                                </div>
                                {!isClaimer && (
                                    <button onClick={() => router.push(`/chat?recipient=${request.claimer?.user_id}`)} className="p-2 bg-white dark:bg-neutral-800 rounded-full shadow-sm text-blue-500 hover:scale-110 transition-transform">
                                        <ChatIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 backdrop-blur-sm flex justify-end gap-3">
                    {isOwner && request.status === 'open' && <ActionButton onClick={() => handleAction('cancel')} label="Cancel" variant="danger" loading={isSubmitting} />}
                    {isOwner && request.status === 'claimed' && <ActionButton onClick={() => handleAction('complete')} label="Mark Complete" variant="primary" loading={isSubmitting} />}
                    {isOwner && request.status === 'claimed' && <ActionButton onClick={() => router.push(`/chat?recipient=${request.claimer?.user_id}`)} label="Contact" variant="secondary" loading={isSubmitting} />}

                    {isClaimer && request.status === 'claimed' && <ActionButton onClick={() => handleAction('unclaim')} label="Unclaim" variant="secondary" loading={isSubmitting} />}
                    {!isOwner && request.status === 'open' && <ActionButton onClick={() => handleAction('claim')} label="Claim Task" variant="primary" loading={isSubmitting} />}
                </div>
            </motion.div>
        </ModalBackdrop>
    );
};

const ActionButton = ({ onClick, label, variant, loading }: { onClick: () => void, label: string, variant: 'primary' | 'secondary' | 'danger', loading: boolean }) => {
    const styles = {
        primary: "bg-brand-green text-white hover:bg-emerald-600 shadow-lg shadow-brand-green/20",
        secondary: "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700",
        danger: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-900/40"
    };
    return (
        <button onClick={onClick} disabled={loading} className={cn("px-6 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed", styles[variant])}>
            {loading ? <Spinner className="w-5 h-5" /> : label}
        </button>
    );
}

export default BitsCoinPage;