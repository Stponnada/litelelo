// src/components/BlockchainVisualizer.tsx

import React from 'react';
import { format } from 'date-fns';

const ChainLink: React.FC = () => (
    <div className="w-16 h-1 flex-shrink-0 bg-gradient-to-r from-tertiary to-tertiary-light/50 dark:from-tertiary/50 dark:to-tertiary border-y border-tertiary-light dark:border-tertiary/80"></div>
);

const VisualBlock: React.FC<{ block: any, isGenesis: boolean }> = ({ block, isGenesis }) => (
    <div className="w-80 flex-shrink-0 bg-secondary-light/50 dark:bg-secondary/50 backdrop-blur-sm rounded-lg border-2 border-tertiary-light dark:border-tertiary shadow-xl hover:shadow-2xl hover:border-brand-green/50 transition-all duration-300 transform hover:-translate-y-1">
        <div className={`p-3 border-b-2 border-tertiary-light dark:border-tertiary ${isGenesis ? 'bg-gradient-to-r from-brand-green/20 to-transparent' : ''}`}>
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-brand-green">Block #{block.index}</h3>
                {block.miner?.username ? (
                    <div className="flex items-center gap-2" title={`Mined by @${block.miner.username}`}>
                        <img src={block.miner.avatar_url || ''} alt={block.miner.username} className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary">@{block.miner.username}</span>
                    </div>
                ) : (
                    <span className="text-xs text-text-tertiary-light dark:text-text-tertiary">{isGenesis ? 'Genesis Block' : 'System'}</span>
                )}
            </div>
            <span className="text-xs text-text-tertiary-light dark:text-text-tertiary">{format(new Date(block.timestamp), 'PPpp')}</span>
        </div>
        <div className="p-3 text-xs space-y-2 break-all font-mono">
            <p><span className="font-semibold text-text-secondary-light dark:text-text-secondary">Hash:</span> {block.hash.substring(0, 20)}...</p>
            <p><span className="font-semibold text-text-secondary-light dark:text-text-secondary">Prev Hash:</span> {block.previous_hash.substring(0, 20)}...</p>
        </div>
    </div>
);


const BlockchainVisualizer: React.FC<{ blocks: any[] }> = ({ blocks }) => {
    if (blocks.length === 0) {
        return null;
    }

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Blockchain Explorer</h2>
            <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg shadow-lg border border-tertiary-light dark:border-tertiary">
                <div className="overflow-x-auto">
                    <div className="flex items-center p-4 space-x-4">
                        {blocks.map((block, index) => (
                            <React.Fragment key={block.id}>
                                {index > 0 && <ChainLink />}
                                <VisualBlock block={block} isGenesis={index === 0} />
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlockchainVisualizer;