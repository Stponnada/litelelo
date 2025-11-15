// src/components/Poll.tsx

import React, { useState } from 'react';
import { Poll as PollType } from '../types';
import { supabase } from '../services/supabase';
import { usePosts } from '../hooks/usePosts';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { getResizedAvatarUrl } from '../utils/imageUtils';

interface PollProps {
    poll: PollType;
    postId: string;
}

const PollComponent: React.FC<PollProps> = ({ poll, postId }) => {
    // Ensure poll content stays behind search overlay
    const containerClasses = "relative z-[1]";
    const { updatePostInContext } = usePosts();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);

    const handleToggleVoters = (optionId: string) => {
        setExpandedOptionId(prevId => (prevId === optionId ? null : optionId));
    };

    const handleVote = async (optionId: string) => {
        if (!user) {
            navigate('/login');
            return;
        }

        // --- Optimistic Update ---
        const isVoted = poll.user_votes?.includes(optionId);
        const newUserVotes = isVoted
            ? poll.user_votes!.filter(id => id !== optionId)
            : [...(poll.user_votes || []), optionId];
        
        const newOptions = poll.options.map(opt => {
            if (opt.id === optionId) {
                return { ...opt, vote_count: isVoted ? opt.vote_count - 1 : opt.vote_count + 1 };
            }
            return opt;
        });

        const newTotalVotes = newOptions.reduce((sum, opt) => sum + opt.vote_count, 0);

        // We can't know the new voters list optimistically, so we'll let the backend call refresh it
        updatePostInContext({
            id: postId,
            poll: {
                ...poll,
                options: newOptions,
                total_votes: newTotalVotes,
                user_votes: newUserVotes
            }
        });

        // --- Backend Call ---
        try {
            const { data: updatedPoll, error } = await supabase.rpc('cast_poll_vote', { p_option_id: optionId });
            if (error) throw error;
            
            // Sync with the full data from the backend to get the new voters list
            updatePostInContext({
              id: postId,
              poll: updatedPoll
            });

        } catch (error) {
            console.error("Failed to cast vote:", error);
            // Revert on error
            updatePostInContext({ id: postId, poll }); 
        }
    };

    const totalVotes = poll.total_votes || 0;

    return (
        <div className={`mt-4 space-y-2 ${containerClasses}`}>
            {poll.options.map(option => {
                const percentage = totalVotes > 0 ? (option.vote_count / totalVotes) * 100 : 0;
                const isVotedByUser = poll.user_votes?.includes(option.id);
                const isExpanded = expandedOptionId === option.id;

                return (
                    // FIX: Using a <div> wrapper instead of React.Fragment to solve the duplication bug.
                    <div key={option.id}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleVote(option.id); }}
                            className={`w-full p-3 rounded-lg border-2 transition-all duration-200 relative overflow-hidden ${
                                isVotedByUser 
                                ? 'border-brand-green bg-brand-green/10'
                                : 'border-tertiary-light dark:border-tertiary bg-tertiary-light/50 dark:bg-tertiary/50 hover:border-brand-green/50'
                            }`}
                        >
                            <div 
                                className="absolute top-0 left-0 h-full bg-brand-green/20"
                                style={{ width: `${percentage}%`, transition: 'width 0.5s ease-in-out' }}
                            />
                            <div className="relative z-10 flex justify-between items-center text-sm font-semibold">
                                <span className={`flex items-center gap-2 ${isVotedByUser ? 'text-text-main-light dark:text-text-main' : 'text-text-secondary-light dark:text-text-secondary'}`}>
                                    {option.option_text}
                                    {isVotedByUser && (
                                        <svg className="w-4 h-4 text-brand-green" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className={isVotedByUser ? 'text-text-main-light dark:text-text-main' : 'text-text-secondary-light dark:text-text-secondary'}>
                                      {percentage.toFixed(0)}%
                                  </span>
                                  {/* FIX: Clearer button to view voters */}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleVoters(option.id); }}
                                    className="text-xs text-text-tertiary-light dark:text-text-tertiary hover:underline"
                                  >
                                    ({option.vote_count} vote{option.vote_count !== 1 ? 's' : ''})
                                  </button>
                                </div>
                            </div>
                        </button>
                        
                        {isExpanded && (
                            <div className="mt-1 pl-4 pr-2 py-2 border-l-2 border-tertiary-light dark:border-tertiary bg-tertiary-light/30 dark:bg-tertiary/30 rounded-r-md">
                                {(!option.voters || option.voters.length === 0) ? (
                                    <p className="text-xs text-text-tertiary-light dark:text-text-tertiary">No one has voted for this option yet.</p>
                                ) : (
                                    <ul className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                                        {option.voters.map(voter => (
                                            <li key={voter.user_id}>
                                                <Link 
                                                    to={`/profile/${voter.username}`} 
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex items-center gap-2 group"
                                                >
                                                    <img 
                                                        src={getResizedAvatarUrl(voter.avatar_url, 48, 48)} 
                                                        alt={voter.full_name} 
                                                        className="w-6 h-6 rounded-full object-cover bg-tertiary"
                                                    />
                                                    <span className="text-xs font-medium text-text-secondary-light dark:text-text-secondary group-hover:underline">{voter.full_name}</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary pt-1">
                Total: {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
            </p>
        </div>
    );
};

export default PollComponent;