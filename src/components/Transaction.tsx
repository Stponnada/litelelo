// src/components/Transaction.tsx
import React from 'react';

const Transaction: React.FC<{ tx: any; isMined?: boolean }> = ({ tx, isMined }) => {
    const sender = isMined ? null : tx.sender;
    const recipient = isMined ? null : tx.recipient;

    return (
        <div className={`p-2 rounded text-xs ${isMined ? 'bg-primary-light/50 dark:bg-primary/50' : ''}`}>
            {isMined ? (
                <span>
                    <span className="font-semibold">{tx.amount} coins</span> transferred
                </span>
            ) : (
                <span>
                    <span className="font-semibold">@{sender?.username}</span> sent <span className="font-semibold text-brand-green">{tx.amount} coins</span> to <span className="font-semibold">@{recipient?.username}</span>
                </span>
            )}
        </div>
    );
};

export default Transaction;