// src/components/Block.tsx
import React from 'react';
import { format } from 'date-fns';
import Transaction from './Transaction';

const Block: React.FC<{ block: any }> = ({ block }) => {
    return (
        <div className="bg-tertiary-light dark:bg-tertiary/50 p-4 rounded-md border border-tertiary-light dark:border-tertiary">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-brand-green">Block #{block.index}</h3>
                <span className="text-xs text-text-tertiary-light dark:text-text-tertiary">{format(new Date(block.timestamp), 'PPpp')}</span>
            </div>
            <div className="text-xs space-y-1 break-all">
                <p><span className="font-semibold">Hash:</span> {block.hash}</p>
                <p><span className="font-semibold">Prev Hash:</span> {block.previous_hash}</p>
                <p><span className="font-semibold">Nonce:</span> {block.nonce}</p>
            </div>
            {block.transactions && block.transactions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-tertiary-light dark:border-tertiary">
                    <h4 className="text-sm font-semibold mb-2">Transactions ({block.transactions.length})</h4>
                    <div className="space-y-1">
                        {block.transactions.map((tx: any) => <Transaction key={tx.id} tx={tx} isMined />)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Block;