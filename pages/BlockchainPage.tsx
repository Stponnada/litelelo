// src/pages/BlockchainPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Profile } from '../types';
import Spinner from '../components/Spinner';
import { CubeIcon, ChatIcon } from '../components/icons';
import { formatTimestamp } from '../utils/timeUtils';
import { Link, useNavigate } from 'react-router-dom';
import Block from '../components/Block'; // We will create this
import Transaction from '../components/Transaction'; // We will create this

const BlockchainPage: React.FC = () => {
    const { profile } = useAuth();
    const [balance, setBalance] = useState<number>(0);
    const [blocks, setBlocks] = useState<any[]>([]);
    const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [miningStatus, setMiningStatus] = useState<'idle' | 'mining' | 'success' | 'error'>('idle');
    const [miningError, setMiningError] = useState('');

    const fetchChainData = useCallback(async () => {
        setLoading(true);
        try {
            const balancePromise = supabase.from('profiles').select('bits_coin_balance').eq('user_id', profile!.user_id).single();
            const blocksPromise = supabase.from('blockchain_blocks').select('*').order('index', { ascending: false });
            const txPromise = supabase.from('blockchain_pending_transactions').select('*, sender:sender_id(*), recipient:recipient_id(*)').order('timestamp', { ascending: true });

            const [balanceRes, blocksRes, txRes] = await Promise.all([balancePromise, blocksPromise, txPromise]);
            
            if (balanceRes.error) throw balanceRes.error;
            setBalance(balanceRes.data.bits_coin_balance || 0);

            if (blocksRes.error) throw blocksRes.error;
            setBlocks(blocksRes.data || []);

            if (txRes.error) throw txRes.error;
            setPendingTransactions(txRes.data || []);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => {
        fetchChainData();
    }, [fetchChainData]);
    
    // Realtime subscriptions
    useEffect(() => {
        const blockChannel = supabase.channel('blockchain_blocks').on('postgres_changes', { event: '*', schema: 'public', table: 'blockchain_blocks' }, fetchChainData).subscribe();
        const txChannel = supabase.channel('blockchain_txs').on('postgres_changes', { event: '*', schema: 'public', table: 'blockchain_pending_transactions' }, fetchChainData).subscribe();
        const profileChannel = supabase.channel('my_profile_balance').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${profile?.user_id}` }, (payload) => {
            setBalance(payload.new.bits_coin_balance);
        }).subscribe();
        
        return () => {
            supabase.removeChannel(blockChannel);
            supabase.removeChannel(txChannel);
            supabase.removeChannel(profileChannel);
        };
    }, [fetchChainData, profile]);

    // Client-side Proof of Work
    const handleMine = async () => {
        setMiningStatus('mining');
        setMiningError('');

        try {
            // 1. Prepare the new block data
            const lastBlock = blocks[0] || { index: -1, hash: "0" }; // Genesis block case
            const newBlockData = {
                index: lastBlock.index + 1,
                timestamp: new Date().toISOString(),
                transactions: pendingTransactions,
                previous_hash: lastBlock.hash
            };
            
            // 2. Perform "mining" (find a nonce)
            let nonce = 0;
            let hash = '';
            const difficulty = '000'; // Match the backend function

            const sha256 = async (str: string) => {
                const textAsBuffer = new TextEncoder().encode(str);
                const hashBuffer = await crypto.subtle.digest('SHA-256', textAsBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            };

            while (!hash.startsWith(difficulty)) {
                nonce++;
                const blockString = `${newBlockData.index}${newBlockData.previous_hash}${newBlockData.timestamp}${JSON.stringify(newBlockData.transactions)}${nonce}`;
                hash = await sha256(blockString);
            }
            
            // 3. Submit the mined block to the backend
            const { error: rpcError } = await supabase.rpc('add_mined_block', {
                new_block_index: newBlockData.index,
                new_block_timestamp: newBlockData.timestamp,
                transactions_in_block: newBlockData.transactions,
                new_block_previous_hash: newBlockData.previous_hash,
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
    
    if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
    if (error) return <p className="text-red-400">Error: {error}</p>;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-4xl font-bold text-text-main-light dark:text-text-main flex items-center gap-3">
                    <CubeIcon className="w-10 h-10 text-brand-green" />
                    BITS Coin
                </h1>
                <p className="text-lg text-text-secondary-light dark:text-text-secondary mt-1">A fun, simulated campus cryptocurrency.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Wallet & Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-secondary-light dark:bg-secondary p-6 rounded-lg shadow-lg border border-tertiary-light dark:border-tertiary">
                        <h2 className="font-bold text-lg mb-2">My Wallet</h2>
                        <p className="text-4xl font-bold text-brand-green">{balance.toFixed(2)}</p>
                        <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">BITS Coins</p>
                    </div>
                    
                    <SendCoins onSend={fetchChainData} currentBalance={balance} />
                    
                    <div className="bg-secondary-light dark:bg-secondary p-6 rounded-lg shadow-lg border border-tertiary-light dark:border-tertiary">
                        <h2 className="font-bold text-lg mb-2">Mine a New Block</h2>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary mb-4">Validate pending transactions and earn a 25 BITS Coin reward.</p>
                        <button onClick={handleMine} disabled={miningStatus === 'mining'} className="w-full bg-brand-green text-black font-bold py-3 rounded-lg disabled:opacity-50">
                            {miningStatus === 'mining' ? <Spinner /> : 'Start Mining'}
                        </button>
                        {miningStatus === 'success' && <p className="text-green-400 text-sm mt-2">Success! Block mined.</p>}
                        {miningStatus === 'error' && <p className="text-red-400 text-sm mt-2">Error: {miningError}</p>}
                    </div>
                </div>

                {/* Right Column: Ledger */}
                <div className="lg:col-span-2 space-y-6">
                     <div className="bg-secondary-light dark:bg-secondary p-6 rounded-lg shadow-lg border border-tertiary-light dark:border-tertiary">
                        <h2 className="font-bold text-lg mb-4">Pending Transactions ({pendingTransactions.length})</h2>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {pendingTransactions.length > 0 ? (
                                pendingTransactions.map(tx => <Transaction key={tx.id} tx={tx} />)
                            ) : <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">No pending transactions.</p>}
                        </div>
                    </div>
                    
                    <div className="bg-secondary-light dark:bg-secondary p-6 rounded-lg shadow-lg border border-tertiary-light dark:border-tertiary">
                        <h2 className="font-bold text-lg mb-4">The Blockchain ({blocks.length} Blocks)</h2>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                           {blocks.map(block => <Block key={block.id} block={block} />)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SendCoins: React.FC<{onSend: () => void, currentBalance: number}> = ({ onSend, currentBalance }) => {
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSuccess(''); setIsSubmitting(true);
        const parsedAmount = parseFloat(amount);

        if (parsedAmount > currentBalance) {
            setError("Insufficient balance.");
            setIsSubmitting(false);
            return;
        }

        try {
            const { data: recipientProfile, error: profileError } = await supabase.from('profiles').select('user_id').eq('username', recipient).single();
            if (profileError || !recipientProfile) throw new Error("Recipient not found.");

            const { error: txError } = await supabase.from('blockchain_pending_transactions').insert({ sender_id: supabase.auth.getUser()!.id, recipient_id: recipientProfile.user_id, amount: parsedAmount });
            if (txError) throw txError;

            setSuccess(`Transaction of ${amount} sent to @${recipient}!`);
            setRecipient(''); setAmount('');
            onSend();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-secondary-light dark:bg-secondary p-6 rounded-lg shadow-lg border border-tertiary-light dark:border-tertiary">
            <h2 className="font-bold text-lg mb-4">Send Coins</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
                <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Recipient's @username" required className="w-full p-2 bg-tertiary-light dark:bg-tertiary rounded"/>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" required min="0.01" step="0.01" className="w-full p-2 bg-tertiary-light dark:bg-tertiary rounded"/>
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50">
                    {isSubmitting ? <Spinner/> : "Send"}
                </button>
                {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                {success && <p className="text-green-400 text-xs mt-1">{success}</p>}
            </form>
        </div>
    );
}

export default BlockchainPage;