// src/components/Post.tsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePosts } from '../hooks/usePosts';
import { useAuth } from '../hooks/useAuth';
import { Post as PostType } from '../types';
import { formatTimestamp } from '../utils/timeUtils';
import { supabase } from '../services/supabase';
import { renderContentWithEmbeds } from '../utils/renderEmbeds';
import { ChatBubbleOvalLeftEllipsisIcon, HeartIcon as HeartOutline, ArrowPathRoundedSquareIcon, ArrowDownCircleIcon } from './icons';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

// --- 1. UPDATE THE PROPS INTERFACE ---
interface PostComponentProps {
    post: PostType;
    onImageClick?: (imageUrl: string) => void;
}

const PostComponent: React.FC<PostComponentProps> = ({ post, onImageClick }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { updatePostInContext } = usePosts();
    const { author } = post;

    if (!author) return null;

    const handleVote = async (newVote: 'like' | 'dislike' | null) => {
        if (!user) {
            navigate('/login');
            return;
        }

        const currentVote = post.user_vote;
        let newLikeCount = post.like_count;

        // Optimistic update
        if (newVote === 'like') {
            newLikeCount = currentVote === 'like' ? post.like_count - 1 : post.like_count + 1;
        } else if (currentVote === 'like') {
            newLikeCount = post.like_count - 1;
        }

        updatePostInContext({
            id: post.id,
            like_count: newLikeCount,
            user_vote: newVote === currentVote ? null : newVote,
        });

        // Backend update
        try {
            if (newVote === currentVote) {
                // User is undoing their vote
                await supabase.from('likes').delete().match({ user_id: user.id, post_id: post.id });
            } else {
                // User is casting a new vote or changing their vote
                await supabase.from('likes').upsert(
                    { user_id: user.id, post_id: post.id, like_type: newVote },
                    { onConflict: 'user_id, post_id' }
                );
            }
        } catch (error) {
            console.error("Failed to update vote:", error);
            // Revert optimistic update on failure
            updatePostInContext({
                id: post.id,
                like_count: post.like_count,
                user_vote: post.user_vote,
            });
        }
    };

    const authorLink = author.author_type === 'community' 
        ? `/communities/${author.author_id}` 
        : `/profile/${author.author_username}`;

    return (
        <div 
            className="bg-secondary-light dark:bg-secondary rounded-xl shadow-lg border border-tertiary-light dark:border-tertiary p-4 cursor-pointer hover:bg-tertiary-light/30 dark:hover:bg-tertiary/30 transition-colors"
            onClick={() => navigate(`/post/${post.id}`)}
        >
            <div className="flex items-start space-x-3">
                <Link to={authorLink} onClick={e => e.stopPropagation()}>
                    <img 
                        src={author.author_avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.author_name || ' ')}&background=3cfba2&color=000`} 
                        alt={author.author_name || ''} 
                        className="w-12 h-12 rounded-full object-cover bg-gray-700" 
                    />
                </Link>
                <div className="flex-1">
                    <div className="flex items-baseline space-x-2">
                        <Link to={authorLink} onClick={e => e.stopPropagation()} className="font-bold hover:underline text-text-main-light dark:text-text-main leading-tight">{author.author_name}</Link>
                        {author.author_type === 'user' && (
                            <span className="text-sm text-text-tertiary-light dark:text-text-tertiary">@{author.author_username}</span>
                        )}
                        <span className="text-sm text-text-tertiary-light dark:text-text-tertiary">&middot;</span>
                        <span className="text-sm text-text-tertiary-light dark:text-text-tertiary hover:underline">{formatTimestamp(post.created_at)}</span>
                    </div>
                    
                    {author.author_type === 'community' && post.original_poster_username && (
                        <p className="text-xs text-text-tertiary-light dark:text-text-tertiary">
                            Posted by <Link to={`/profile/${post.original_poster_username}`} onClick={e => e.stopPropagation()} className="hover:underline">@{post.original_poster_username}</Link>
                        </p>
                    )}
                    
                    <div className="mt-2 text-text-secondary-light dark:text-text-secondary space-y-2">
                        {renderContentWithEmbeds(post.content)}
                    </div>

                    {/* --- 2. ADD ONCLICK HANDLER TO THE IMAGE --- */}
                    {post.image_url && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-tertiary-light dark:border-tertiary">
                           <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevents navigating to the post page
                                    if (onImageClick) {
                                        onImageClick(post.image_url!);
                                    }
                                }}
                                className="w-full h-auto block"
                            >
                                <img src={post.image_url} alt="Post content" className="w-full h-auto max-h-[500px] object-cover" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center space-x-6 mt-4 text-text-tertiary-light dark:text-text-tertiary">
                        <div className="flex items-center space-x-1 group" onClick={(e) => { e.stopPropagation(); handleVote('like'); }}>
                            <button className="p-1.5 rounded-full group-hover:bg-red-500/10 transition-colors">
                                {post.user_vote === 'like' 
                                    ? <HeartSolid className="w-5 h-5 text-red-500" /> 
                                    : <HeartOutline className="w-5 h-5 group-hover:text-red-500" />
                                }
                            </button>
                            <span className={`text-sm group-hover:text-red-500 ${post.user_vote === 'like' ? 'text-red-500 font-semibold' : ''}`}>{post.like_count}</span>
                        </div>
                        <Link to={`/post/${post.id}`} onClick={(e) => e.stopPropagation()} className="flex items-center space-x-1 group">
                            <div className="p-1.5 rounded-full group-hover:bg-blue-500/10 transition-colors">
                                <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5 group-hover:text-blue-500" />
                            </div>
                            <span className="text-sm group-hover:text-blue-500">{post.comment_count}</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostComponent;