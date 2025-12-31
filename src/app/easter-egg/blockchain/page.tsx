'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';
import { CubeIcon } from '@/components/icons'; // Assuming this exists, or I swap with Lucide
import Block, { BlockData } from '@/components/Block';
import Transaction, { TransactionProps } from '@/components/Transaction';
import BlockchainVisualizer from '@/components/BlockchainVisualizer';
import MiningPuzzle from '@/components/MiningPuzzle';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Wallet, Send, Cpu, List, Database, ArrowRight, Activity, ShieldCheck, AlertCircle, TrendingUp } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- ANIMATION COMPONENTS ---

/**
 * 3D Tilt Card for the Wallet
 */
const TiltCard = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [30, -30]);
    const rotateY = useTransform(x, [-100, 100], [-30, 30]);

    return (
        <div style={{ perspective: 2000 }}>
            <motion.div
                style={{ x, y, rotateX, rotateY, z: 100 }}
                drag
                dragElastic={0.18}
                dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                whileTap={{ cursor: "grabbing" }}
                className={cn("cursor-grab relative w-full", className)}
            >
                {children}
            </motion.div>
        </div>
    );
};

/**
 * Animated Counter for Balance
 */
const AnimatedCounter = ({ value }: { value: number }) => {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const displayValue = useTransform(spring, (current) => current.toFixed(2));

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return <motion.span>{displayValue}</motion.span>;
};

/**
 * Decrypted Text Title
 */
const DecryptedText = ({ text }: { text: string }) => {
    const [displayText, setDisplayText] = useState(text);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*";

    useEffect(() => {
        let iteration = 0;
        const interval = setInterval(() => {
            setDisplayText(text.split("").map((letter, index) => {
                if (index < iteration) return text[index];
                return chars[Math.floor(Math.random() * chars.length)];
            }).join(""));
            if (iteration >= text.length) clearInterval(interval);
            iteration += 1 / 3;
        }, 30);
        return () => clearInterval(interval);
    }, [text]);

    return <span>{displayText}</span>;
};

// --- MAIN COMPONENT ---

const BlockchainPage: React.FC = () => {
    const { profile } = useAuth();
    const [balance, setBalance] = useState<number>(0);
    const [blocks, setBlocks] = useState<BlockData[]>([]);
    const [visualizerBlocks, setVisualizerBlocks] = useState<BlockData[]>([]);
    const [pendingTransactions, setPendingTransactions] = useState<TransactionProps['tx'][]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [miningStatus, setMiningStatus] = useState<'idle' | 'mining' | 'success' | 'error'>('idle');
    const [miningError, setMiningError] = useState('');
    const [activeTab, setActiveTab] = useState<'ledger' | 'pending'>('pending');

    const fetchChainData = useCallback(async () => {
        if (!profile) { setLoading(false); return; }
        setLoading(true);
        try {
            const [balanceRes, blocksRes, txRes, visualizerRes] = await Promise.all([
                supabase.from('profiles').select('bits_coin_balance').eq('user_id', profile.user_id).single(),
                supabase.from('blockchain_blocks').select('*').order('index', { ascending: false }),
                supabase.from('blockchain_pending_transactions').select('*, sender:sender_id(*), recipient:recipient_id(*)').order('timestamp', { ascending: true }),
                supabase.rpc('get_blockchain_with_miners')
            ]);

            if (balanceRes.error) throw balanceRes.error;
            setBalance(balanceRes.data.bits_coin_balance || 0);
            if (blocksRes.error) throw blocksRes.error;
            setBlocks(blocksRes.data || []);
            if (visualizerRes.error) throw visualizerRes.error;
            setVisualizerBlocks(visualizerRes.data || []);
            if (txRes.error) throw txRes.error;
            setPendingTransactions(txRes.data || []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => { fetchChainData(); }, [fetchChainData]);

    // Real-time subscriptions
    useEffect(() => {
        if (!profile) return;
        const channel = supabase.channel('blockchain-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'blockchain_blocks' }, () => fetchChainData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'blockchain_pending_transactions' }, () => fetchChainData())
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${profile.user_id}` }, (payload) => setBalance(payload.new.bits_coin_balance))
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchChainData, profile]);

    useEffect(() => { localStorage.setItem('discoveredBlockchain', 'true'); }, []);

    const handleMine = async (blockData: BlockData, nonce: number, hash: string) => {
        setMiningStatus('mining');
        setMiningError('');
        try {
            const { error: rpcError } = await supabase.rpc('add_mined_block', {
                new_block_index: blockData.index,
                new_block_timestamp: blockData.timestamp,
                transactions_in_block: blockData.transactions,
                new_block_previous_hash: blockData.previous_hash,
                new_block_hash: hash,
                new_block_nonce: nonce,
            });
            if (rpcError) throw rpcError;
            setMiningStatus('success');
            setTimeout(() => setMiningStatus('idle'), 3000);
        } catch (err: unknown) {
            setMiningStatus('error');
            setMiningError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    if (loading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center"><Spinner /></div>;
    if (error) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-brand-green/30 pb-20 overflow-x-hidden">

            {/* Ambient Background Grid */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#202020_1px,transparent_1px),linear-gradient(to_bottom,#202020_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
                <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-brand-green/5 to-transparent blur-3xl" />
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-12">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-brand-green text-xs font-mono tracking-widest uppercase">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
                            </span>
                            YOU'VE DISCOVERED AN EASTER EGG
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-500">
                            <DecryptedText text="BITS COIN" />
                        </h1>
                        <p className="text-neutral-400 max-w-lg">
                            Decentralized campus currency. <span className="text-brand-green font-bold">Mine</span> blocks, <span className="text-blue-400 font-bold">Trade</span> with peers, and view the immutable ledger.
                        </p>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-mono text-neutral-500">
                        <div className="text-right">
                            <p className="text-xs uppercase tracking-wider mb-1">Block Height</p>
                            <p className="text-2xl font-bold text-white">#{blocks.length > 0 ? blocks[0].index : 0}</p>
                        </div>
                        <div className="h-8 w-px bg-neutral-800" />
                        <div className="text-right">
                            <p className="text-xs uppercase tracking-wider mb-1">Difficulty</p>
                            <p className="text-2xl font-bold text-white">4</p>
                        </div>
                    </div>
                </header>

                {/* Visualizer Section */}
                <section className="mb-12">
                    <BlockchainVisualizer blocks={visualizerBlocks} />
                </section>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column (4 cols) */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* 3D Wallet Card */}
                        <TiltCard>
                            <div className="bg-gradient-to-br from-neutral-900 to-black rounded-3xl p-8 border border-neutral-800 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:bg-brand-green/20 transition-colors duration-500"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="p-3 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10">
                                            <Wallet className="w-6 h-6 text-brand-green" />
                                        </div>
                                        <CubeIcon className="w-8 h-8 text-neutral-700 opacity-50" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-neutral-400 text-sm font-mono tracking-wider uppercase">Available Balance</p>
                                        <p className="text-5xl font-black tracking-tight text-white flex items-baseline gap-2">
                                            <AnimatedCounter value={balance} />
                                            <span className="text-lg font-bold text-brand-green">BITS</span>
                                        </p>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-neutral-500 font-mono">
                                        <span>WALLET ID: {profile?.user_id.substring(0, 8)}...</span>
                                        <div className="flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3 text-brand-green" /> Verified
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TiltCard>

                        {/* Paper Trading Link */}
                        <a href="/easter-egg/trading" className="block bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-5 hover:border-blue-500/40 transition-all group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-500/20 rounded-xl">
                                        <Activity className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">Paper Trading</h3>
                                        <p className="text-xs text-neutral-400">Invest in S&P 500 stocks</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                            </div>
                        </a>

                        {/* Send Coins Form */}
                        <div className="bg-neutral-900/50 backdrop-blur-xl rounded-3xl border border-neutral-800 p-1 overflow-hidden">
                            <SendCoins senderId={profile?.user_id} onSend={fetchChainData} currentBalance={balance} />
                        </div>

                        {/* Mining Terminal */}
                        <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-6 relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-4 text-brand-green">
                                <Cpu className="w-5 h-5 animate-pulse" />
                                <h3 className="font-bold font-mono uppercase tracking-wider">Mining_Node.exe</h3>
                            </div>
                            {/* Wrapping the existing MiningPuzzle in a custom container style */}
                            <div className="bg-black rounded-xl p-4 border border-neutral-800 font-mono text-sm">
                                <MiningPuzzle
                                    lastBlock={blocks[0]}
                                    pendingTransactions={pendingTransactions}
                                    onMine={handleMine}
                                    miningStatus={miningStatus}
                                    miningError={miningError}
                                />
                            </div>
                        </div>

                    </div>

                    {/* Right Column (8 cols) */}
                    <div className="lg:col-span-8">
                        <div className="bg-neutral-900/40 backdrop-blur-md rounded-3xl border border-neutral-800 min-h-[600px] flex flex-col">

                            {/* Tabs */}
                            <div className="flex border-b border-neutral-800">
                                <button
                                    onClick={() => setActiveTab('pending')}
                                    className={cn(
                                        "flex items-center gap-2 px-8 py-5 text-sm font-bold transition-all relative",
                                        activeTab === 'pending' ? "text-white" : "text-neutral-500 hover:text-neutral-300"
                                    )}
                                >
                                    <Activity className="w-4 h-4" />
                                    Mempool ({pendingTransactions.length})
                                    {activeTab === 'pending' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-green shadow-[0_0_10px_#10b981]" />}
                                </button>
                                <button
                                    onClick={() => setActiveTab('ledger')}
                                    className={cn(
                                        "flex items-center gap-2 px-8 py-5 text-sm font-bold transition-all relative",
                                        activeTab === 'ledger' ? "text-white" : "text-neutral-500 hover:text-neutral-300"
                                    )}
                                >
                                    <Database className="w-4 h-4" />
                                    Ledger ({blocks.length})
                                    {activeTab === 'ledger' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-green shadow-[0_0_10px_#10b981]" />}
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                                <AnimatePresence mode='wait'>
                                    {activeTab === 'pending' ? (
                                        <motion.div
                                            key="pending"
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                            className="space-y-4"
                                        >
                                            {pendingTransactions.length > 0 ? (
                                                pendingTransactions.map((tx, i) => (
                                                    <motion.div
                                                        key={tx.id}
                                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                                        className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl"
                                                    >
                                                        <Transaction tx={tx} />
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <EmptyState icon={<List />} text="Mempool is empty. No pending transactions." />
                                            )}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="ledger"
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                            className="space-y-4"
                                        >
                                            {blocks.map((block, i) => (
                                                <motion.div
                                                    key={block.id}
                                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                                    className="bg-neutral-900 border border-neutral-800 p-1 rounded-xl"
                                                >
                                                    <Block block={block} />
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- SUB COMPONENTS ---

const EmptyState = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
    <div className="h-64 flex flex-col items-center justify-center text-neutral-600">
        <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center mb-4">{icon}</div>
        <p>{text}</p>
    </div>
);

const SendCoins: React.FC<{ senderId?: string; onSend: () => void; currentBalance: number }> = ({ senderId, onSend, currentBalance }) => {
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'error' | 'success', msg: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null); setIsSubmitting(true);

        if (!senderId) { setStatus({ type: 'error', msg: "Auth Error" }); setIsSubmitting(false); return; }
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) { setStatus({ type: 'error', msg: "Invalid Amount" }); setIsSubmitting(false); return; }
        if (val > currentBalance) { setStatus({ type: 'error', msg: "Insufficient Funds" }); setIsSubmitting(false); return; }

        try {
            const { data: user, error: userErr } = await supabase.from('profiles').select('user_id').eq('username', recipient.trim()).single();
            if (userErr || !user) throw new Error("User not found");
            if (user.user_id === senderId) throw new Error("Self-transfer invalid");

            const { error: txErr } = await supabase.from('blockchain_pending_transactions').insert({ sender_id: senderId, recipient_id: user.user_id, amount: val });
            if (txErr) throw txErr;

            setStatus({ type: 'success', msg: "Transaction Broadcasted" });
            setRecipient(''); setAmount('');
            onSend();
        } catch (err: unknown) {
            setStatus({ type: 'error', msg: err instanceof Error ? err.message : "Failed" });
        } finally { setIsSubmitting(false); }
    };

    return (
        <div className="p-6 bg-gradient-to-b from-neutral-800/50 to-neutral-900/50">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400" /> Send Coins
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Recipient</label>
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">@</span>
                        <input
                            type="text" value={recipient} onChange={e => setRecipient(e.target.value)}
                            placeholder="username"
                            className="w-full bg-black/40 border border-neutral-700 rounded-xl py-3 pl-8 pr-4 text-white placeholder-neutral-600 focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition-all group-hover:border-neutral-600"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-500 uppercase ml-1">Amount</label>
                    <input
                        type="number" value={amount} onChange={e => setAmount(e.target.value)}
                        placeholder="0.00" min="0.01" step="0.01"
                        className="w-full bg-black/40 border border-neutral-700 rounded-xl py-3 px-4 text-white placeholder-neutral-600 focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition-all font-mono"
                    />
                </div>

                <button
                    disabled={isSubmitting}
                    className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? <Spinner className="w-5 h-5 border-neutral-800" /> : <>Transfer Funds <ArrowRight className="w-4 h-4" /></>}
                </button>

                {status && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("p-3 rounded-lg text-xs font-bold flex items-center gap-2", status.type === 'error' ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500")}>
                        {status.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        {status.msg}
                    </motion.div>
                )}
            </form>
        </div>
    );
};

export default BlockchainPage;