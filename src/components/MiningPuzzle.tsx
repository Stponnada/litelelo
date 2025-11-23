// src/components/MiningPuzzle.tsx

import React, { useState, useEffect, useMemo } from 'react';
import Spinner from './Spinner';

const DIFFICULTY = '000';

// A debounced async effect hook
const useDebouncedAsyncEffect = (effect: () => Promise<void>, deps: any[], delay: number) => {
    useEffect(() => {
        const handler = setTimeout(() => {
            effect();
        }, delay);
        return () => clearTimeout(handler);
    }, deps);
};

// SHA-256 hashing utility
const sha256 = async (str: string) => {
    const textAsBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', textAsBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

interface MiningPuzzleProps {
    lastBlock: any;
    pendingTransactions: any[];
    onMine: (blockData: any, nonce: number, hash: string) => void;
    miningStatus: 'idle' | 'mining' | 'success' | 'error';
    miningError: string;
}

const MiningPuzzle: React.FC<MiningPuzzleProps> = ({ lastBlock, pendingTransactions, onMine, miningStatus, miningError }) => {
    const [nonce, setNonce] = useState(0);
    const [currentHash, setCurrentHash] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);

    const blockData = useMemo(() => ({
        index: (lastBlock?.index ?? -1) + 1,
        timestamp: new Date().toISOString(),
        transactions: pendingTransactions,
        previous_hash: lastBlock?.hash ?? "0"
    }), [lastBlock, pendingTransactions]);

    useDebouncedAsyncEffect(async () => {
        setIsCalculating(true);
        const blockString = `${blockData.index}${blockData.previous_hash}${blockData.timestamp}${JSON.stringify(blockData.transactions)}${nonce}`;
        const hash = await sha256(blockString);
        setCurrentHash(hash);
        setIsCalculating(false);
    }, [nonce, blockData], 100);

    const isNonceValid = currentHash.startsWith(DIFFICULTY);
    const hashColor = isCalculating ? 'text-yellow-500' : isNonceValid ? 'text-brand-green' : 'text-red-500';

    return (
        <div className="bg-secondary-light dark:bg-secondary p-6 rounded-lg shadow-lg border border-tertiary-light dark:border-tertiary space-y-4">
            <div>
                <h2 className="font-bold text-lg">Mine a New Block</h2>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary">
                    Find a nonce that makes the block hash start with <span className="font-mono font-bold">{DIFFICULTY}</span> to earn a reward.
                </p>
            </div>
            
            <div className="bg-tertiary-light/50 dark:bg-tertiary/50 p-3 rounded-md text-xs font-mono space-y-1 break-all">
                <p><span className="font-semibold text-text-secondary-light dark:text-text-secondary">Index:</span> {blockData.index}</p>
                <p><span className="font-semibold text-text-secondary-light dark:text-text-secondary">Prev Hash:</span> {blockData.previous_hash.substring(0,24)}...</p>
                <p><span className="font-semibold text-text-secondary-light dark:text-text-secondary">Transactions:</span> {blockData.transactions.length}</p>
            </div>

            <div className="flex items-center gap-3">
                <label htmlFor="nonce" className="font-semibold text-sm flex-shrink-0">Nonce:</label>
                <input
                    id="nonce"
                    type="number"
                    value={nonce}
                    onChange={(e) => setNonce(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2 bg-tertiary-light dark:bg-tertiary rounded font-mono"
                />
            </div>
            
            <div className="bg-tertiary-light/50 dark:bg-tertiary/50 p-3 rounded-md text-xs font-mono break-all">
                <p className="font-semibold text-text-secondary-light dark:text-text-secondary mb-1">Resulting Hash:</p>
                <p className={`font-bold transition-colors ${hashColor}`}>
                    {isCalculating ? 'Calculating...' : currentHash}
                </p>
            </div>

            <button 
                onClick={() => onMine(blockData, nonce, currentHash)} 
                disabled={!isNonceValid || miningStatus === 'mining'} 
                className="w-full bg-brand-green text-black font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {miningStatus === 'mining' ? <Spinner /> : 'Mine Block & Claim Reward'}
            </button>
            {miningStatus === 'success' && <p className="text-green-400 text-sm mt-2 text-center">Success! Block mined and reward claimed.</p>}
            {miningStatus === 'error' && <p className="text-red-400 text-sm mt-2 text-center">Error: {miningError}</p>}
        </div>
    );
};

export default MiningPuzzle;