// src/components/RepostersModal.tsx

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import Spinner from './Spinner';
import { XIcon, RepostIcon } from './icons';
import { getResizedAvatarUrl } from '../utils/imageUtils';

interface Reposter {
    user_id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    is_following: boolean;
    reposted_at: string;
}

interface RepostersModalProps {
    postId: string;
    repostCount: number;
    onClose: () => void;
}

const RepostersModal: React.FC<RepostersModalProps> = ({ postId, repostCount, onClose }) => {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const [reposters, setReposters] = useState<Reposter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [togglingFollowId, setTogglingFollowId] = useState<string | null>(null);

    useEffect(() => {
        const fetchReposters = async () => {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase.rpc('get_reposters_for_post', {
                p_post_id: postId,
            });

            if (error) {
                console.error('Error fetching reposters:', error);
                setError('Failed to load reposters.');
            } else {
                setReposters(data || []);
            }
            setLoading(false);
        };

        fetchReposters();
    }, [postId]);

    const handleFollowToggle = async (reposter: Reposter) => {
        if (!currentUser) {
            router.push('/login');
            return;
        }

        setTogglingFollowId(reposter.user_id);
        const isCurrentlyFollowing = reposter.is_following;

        // Optimistic update
        setReposters(currentList =>
            currentList.map(r =>
                r.user_id === reposter.user_id
                    ? { ...r, is_following: !isCurrentlyFollowing }
                    : r
            )
        );

        try {
            if (isCurrentlyFollowing) {
                await supabase.from('followers').delete().match({
                    follower_id: currentUser.id,
                    following_id: reposter.user_id
                });
            } else {
                await supabase.from('followers').insert({
                    follower_id: currentUser.id,
                    following_id: reposter.user_id
                });
            }
        } catch (err) {
            console.error('Failed to toggle follow:', err);
            // Revert on error
            setReposters(currentList =>
                currentList.map(r =>
                    r.user_id === reposter.user_id ? reposter : r
                )
            );
        } finally {
            setTogglingFollowId(null);
        }
    };

    const handleMessageUser = (userId: string) => {
        router.push(`/chat?userId=${userId}`);
        onClose();
    };

    const formatRepostTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-secondary-light dark:bg-secondary rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col border border-tertiary-light dark:border-white/10 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b border-tertiary-light dark:border-white/10 bg-tertiary-light/30 dark:bg-white/5">
                    <div className="flex items-center gap-2">
                        <RepostIcon className="w-5 h-5 text-green-500" />
                        <h2 className="text-lg font-bold text-text-main-light dark:text-text-main">
                            Reposted by
                        </h2>
                        <span className="text-sm text-text-tertiary-light dark:text-text-tertiary">
                            ({repostCount})
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-tertiary-light dark:hover:bg-white/10 transition-colors"
                    >
                        <XIcon className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary" />
                    </button>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto">
                    {loading && (
                        <div className="flex justify-center items-center p-12">
                            <Spinner />
                        </div>
                    )}

                    {error && (
                        <div className="text-center p-8">
                            <p className="text-red-400">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 text-sm text-brand-green hover:underline"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {!loading && !error && reposters.length === 0 && (
                        <div className="text-center p-12">
                            <RepostIcon className="w-12 h-12 mx-auto text-text-tertiary-light dark:text-text-tertiary mb-3 opacity-50" />
                            <p className="text-text-main-light dark:text-text-main font-medium mb-1">
                                No reposts yet
                            </p>
                            <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">
                                This post hasn't been reposted by anyone yet. Be the first!
                            </p>
                        </div>
                    )}

                    {!loading && !error && reposters.length > 0 && (
                        <div className="divide-y divide-tertiary-light dark:divide-white/5">
                            {reposters.map(reposter => (
                                <div
                                    key={reposter.user_id}
                                    className="flex items-center gap-3 p-4 hover:bg-tertiary-light/30 dark:hover:bg-white/5 transition-colors"
                                >
                                    {/* Avatar */}
                                    <Link
                                        href={`/profile/${reposter.username}`}
                                        onClick={onClose}
                                        className="flex-shrink-0"
                                    >
                                        <Image
                                            src={getResizedAvatarUrl(reposter.avatar_url, 80, 80, reposter.full_name || reposter.username)}
                                            alt={reposter.username}
                                            width={44}
                                            height={44}
                                            className="rounded-full object-cover ring-1 ring-white/10"
                                            unoptimized
                                        />
                                    </Link>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/profile/${reposter.username}`}
                                            onClick={onClose}
                                            className="block"
                                        >
                                            <p className="font-semibold text-sm text-text-main-light dark:text-text-main truncate hover:text-brand-green transition-colors">
                                                {reposter.full_name || reposter.username}
                                            </p>
                                            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary truncate">
                                                @{reposter.username}
                                            </p>
                                        </Link>
                                        <p className="text-[10px] text-text-tertiary-light dark:text-text-tertiary mt-0.5">
                                            Reposted {formatRepostTime(reposter.reposted_at)}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    {currentUser?.id !== reposter.user_id && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleFollowToggle(reposter)}
                                                disabled={togglingFollowId === reposter.user_id}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${reposter.is_following
                                                    ? 'bg-tertiary-light dark:bg-white/10 text-text-main-light dark:text-text-main hover:bg-red-500/10 hover:text-red-500'
                                                    : 'bg-brand-green text-black hover:bg-brand-green-darker'
                                                    } disabled:opacity-50`}
                                            >
                                                {togglingFollowId === reposter.user_id ? (
                                                    <Spinner />
                                                ) : reposter.is_following ? (
                                                    'Following'
                                                ) : (
                                                    'Follow'
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleMessageUser(reposter.user_id)}
                                                className="p-1.5 rounded-full bg-tertiary-light dark:bg-white/10 hover:bg-brand-green/20 transition-colors"
                                                title="Message"
                                            >
                                                <svg className="w-4 h-4 text-text-main-light dark:text-text-main" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default RepostersModal;
