// src/pages/BlockchainPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/Spinner';
import { CubeIcon } from '../components/icons';
import Block from '../components/Block';
import Transaction from '../components/Transaction';
import BlockchainVisualizer from '../components/BlockchainVisualizer';
import MiningPuzzle from '../components/MiningPuzzle';

const BlockchainPage: React.FC = () => {
    const { profile } = useAuth();
    const [balance, setBalance] = useState<number>(0);
    const [blocks, setBlocks] = useState<any[]>([]);
    const [visualizerBlocks, setVisualizerBlocks] = useState<any[]>([]);
    const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [miningStatus, setMiningStatus] = useState<'idle' | 'mining' | 'success' | 'error'>('idle');
    const [miningError, setMiningError] = useState('');

    const fetchChainData = useCallback(async () => {
        if (!profile) return;
        setLoading(true);
        try {
            const balancePromise = supabase.from('profiles').select('bits_coin_balance').eq('user_id', profile.user_id).single();
            const blocksPromise = supabase.from('blockchain_blocks').select('*').order('index', { ascending: false });
            const txPromise = supabase.from('blockchain_pending_transactions').select('*, sender:sender_id(*), recipient:recipient_id(*)').order('timestamp', { ascending: true });
            const visualizerPromise = supabase.rpc('get_blockchain_with_miners'); 

            const [balanceRes, blocksRes, txRes, visualizerRes] = await Promise.all([balancePromise, blocksPromise, txPromise, visualizerPromise]);
            
            if (balanceRes.error) throw balanceRes.error;
            setBalance(balanceRes.data.bits_coin_balance || 0);

            if (blocksRes.error) throw blocksRes.error;
            setBlocks(blocksRes.data || []);
            
            if (visualizerRes.error) throw visualizerRes.error; 
            setVisualizerBlocks(visualizerRes.data || []);

            if (txRes.error) throw txRes.error;
            setPendingTransactions(txRes.data || []);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => {
        if (profile) {
            fetchChainData();
        }
    }, [fetchChainData, profile]);
    
    useEffect(() => {
        if (!profile) return;
        const channel = supabase.channel('blockchain-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'blockchain_blocks' }, () => fetchChainData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'blockchain_pending_transactions' }, () => fetchChainData())
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${profile.user_id}` }, (payload) => {
                setBalance(payload.new.bits_coin_balance);
            })
            .subscribe();
        
        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchChainData, profile]);

    const handleMine = async (blockData: any, nonce: number, hash: string) => {
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
        } catch (err: any) {
            setMiningStatus('error');
            setMiningError(err.message);
            console.error("Mining failed:", err);
        }
    };
    
    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Spinner />
        </div>
    );
    
    if (error) return (
        <div className="max-w-7xl mx-auto px-4 py-20">
            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-center">
                <p className="text-red-400 text-lg">Error: {error}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-light via-secondary-light to-tertiary-light dark:from-primary dark:via-secondary dark:to-tertiary">
            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* Hero Header */}
                <header className="text-center space-y-4 py-8">
                    <div className="flex items-center justify-center gap-4">
                        <div className="relative">
                            <CubeIcon className="w-16 h-16 text-brand-green animate-pulse" />
                            <div className="absolute inset-0 blur-xl bg-brand-green/30 animate-pulse"></div>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-brand-green via-blue-400 to-purple-400 bg-clip-text text-transparent">
                            BITS Coin
                        </h1>
                    </div>
                    <p className="text-xl text-text-secondary-light dark:text-text-secondary max-w-2xl mx-auto">
                        Your campus cryptocurrency ecosystem • Mine • Trade • Transact
                    </p>
                </header>

                {/* Blockchain Visualizer - Full Width */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-green/20 to-blue-500/20 rounded-2xl blur-2xl"></div>
                    <div className="relative bg-secondary-light/80 dark:bg-secondary/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-tertiary-light/50 dark:border-tertiary/50 overflow-hidden">
                        <BlockchainVisualizer blocks={visualizerBlocks} />
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Wallet & Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Wallet Card */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-green/30 to-blue-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                            <div className="relative bg-gradient-to-br from-secondary-light to-tertiary-light dark:from-secondary dark:to-tertiary p-8 rounded-2xl shadow-xl border border-tertiary-light/50 dark:border-tertiary/50">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-bold text-lg text-text-main-light dark:text-text-main">My Wallet</h2>
                                    <div className="w-12 h-12 rounded-full bg-brand-green/20 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-5xl font-bold bg-gradient-to-r from-brand-green to-blue-400 bg-clip-text text-transparent">
                                        {balance.toFixed(2)}
                                    </p>
                                    <p className="text-sm font-medium text-text-tertiary-light dark:text-text-tertiary uppercase tracking-wider">
                                        BITS Coins
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Send Coins Card */}
                        <SendCoins 
                            senderId={profile?.user_id} 
                            onSend={fetchChainData} 
                            currentBalance={balance} 
                        />
                        
                        {/* Mining Card */}
                        <MiningPuzzle
                            lastBlock={blocks[0]}
                            pendingTransactions={pendingTransactions}
                            onMine={handleMine}
                            miningStatus={miningStatus}
                            miningError={miningError}
                        />
                    </div>

                    {/* Right Column: Transactions & Ledger */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Pending Transactions */}
                        <div className="bg-secondary-light/80 dark:bg-secondary/80 backdrop-blur-sm rounded-2xl shadow-xl border border-tertiary-light/50 dark:border-tertiary/50 overflow-hidden">
                            <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 px-6 py-4 border-b border-tertiary-light/50 dark:border-tertiary/50">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-bold text-lg text-text-main-light dark:text-text-main">Pending Transactions</h2>
                                    <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm font-semibold">
                                        {pendingTransactions.length}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="space-y-3 max-h-72 overflow-y-auto">
                                    {pendingTransactions.length > 0 ? (
                                        pendingTransactions.map(tx => <Transaction key={tx.id} tx={tx} />)
                                    ) : (
                                        <div className="text-center py-12">
                                            <svg className="w-16 h-16 mx-auto text-text-tertiary-light dark:text-text-tertiary opacity-50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                            </svg>
                                            <p className="text-text-tertiary-light dark:text-text-tertiary">No pending transactions</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Blockchain Ledger */}
                        <div className="bg-secondary-light/80 dark:bg-secondary/80 backdrop-blur-sm rounded-2xl shadow-xl border border-tertiary-light/50 dark:border-tertiary/50 overflow-hidden">
                            <div className="bg-gradient-to-r from-brand-green/10 to-blue-500/10 px-6 py-4 border-b border-tertiary-light/50 dark:border-tertiary/50">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-bold text-lg text-text-main-light dark:text-text-main">The Blockchain</h2>
                                    <span className="px-3 py-1 rounded-full bg-brand-green/20 text-brand-green text-sm font-semibold">
                                        {blocks.length} Blocks
                                    </span>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                    {blocks.map(block => <Block key={block.id} block={block} />)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SendCoins: React.FC<{ senderId?: string; onSend: () => void; currentBalance: number }> = ({ senderId, onSend, currentBalance }) => {
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSuccess(''); setIsSubmitting(true);
        
        if (!senderId) {
            setError("Could not identify sender. Please refresh.");
            setIsSubmitting(false);
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError("Invalid amount.");
            setIsSubmitting(false);
            return;
        }

        if (parsedAmount > currentBalance) {
            setError("Insufficient balance.");
            setIsSubmitting(false);
            return;
        }

        try {
            const { data: recipientProfile, error: profileError } = await supabase.from('profiles').select('user_id').eq('username', recipient.trim()).single();
            if (profileError || !recipientProfile) throw new Error(`Recipient @${recipient.trim()} not found.`);
            if (recipientProfile.user_id === senderId) throw new Error("You cannot send coins to yourself.");

            const { error: txError } = await supabase.from('blockchain_pending_transactions').insert({ sender_id: senderId, recipient_id: recipientProfile.user_id, amount: parsedAmount });
            if (txError) throw txError;

            setSuccess(`Transaction of ${amount} sent to @${recipient.trim()}! It will be processed in the next block.`);
            setRecipient(''); setAmount('');
            onSend();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-secondary-light/80 dark:bg-secondary/80 backdrop-blur-sm rounded-2xl shadow-xl border border-tertiary-light/50 dark:border-tertiary/50 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-6 py-4 border-b border-tertiary-light/50 dark:border-tertiary/50">
                <h2 className="font-bold text-lg text-text-main-light dark:text-text-main">Send Coins</h2>
            </div>
            <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary mb-2">
                            Recipient
                        </label>
                        <input 
                            type="text" 
                            value={recipient} 
                            onChange={e => setRecipient(e.target.value)} 
                            placeholder="@username" 
                            required 
                            className="w-full px-4 py-3 bg-tertiary-light dark:bg-tertiary rounded-xl border border-transparent focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none text-text-main-light dark:text-text-main"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary mb-2">
                            Amount
                        </label>
                        <input 
                            type="number" 
                            value={amount} 
                            onChange={e => setAmount(e.target.value)} 
                            placeholder="0.00" 
                            required 
                            min="0.01" 
                            step="0.01" 
                            className="w-full px-4 py-3 bg-tertiary-light dark:bg-tertiary rounded-xl border border-transparent focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all outline-none text-text-main-light dark:text-text-main"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <Spinner/> Sending...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Send Transaction
                            </span>
                        )}
                    </button>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-3">
                            <p className="text-green-400 text-sm">{success}</p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default BlockchainPage;