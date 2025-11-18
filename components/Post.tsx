// src/components/Post.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePosts } from '../hooks/usePosts';
import { useAuth } from '../hooks/useAuth';
import { Post as PostType } from '../types';
import { formatTimestamp } from '../utils/timeUtils';
import { supabase } from '../services/supabase';
import { renderContentWithEmbeds } from '../utils/renderEmbeds';
import {
  ChatBubbleOvalLeftEllipsisIcon,
  HeartIcon as HeartOutline,
  BookmarkIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathRoundedSquareIcon,
} from './icons';
import { HeartIcon as HeartSolid, BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';
import PollComponent from './Poll';
import QuotePostDisplay from './QuotePostDisplay';
import QuotePostModal from './QuotePostModal';
import { getResizedAvatarUrl } from '../utils/imageUtils';

const Flair: React.FC<{ flair: { id: string; name: string; avatar_url: string | null } }> = ({ flair }) => (
    <Link
      to={`/communities/${flair.id}`}
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-green/10 border border-brand-green/20 hover:bg-brand-green/20 transition-colors group ml-2"
      title={flair.name}
    >
        <img 
            src={flair.avatar_url || `https://ui-avatars.com/api/?name=${flair.name}`} 
            alt={flair.name} 
            className="w-3.5 h-3.5 rounded-full object-cover" 
        />
        <span className="text-[10px] font-bold text-brand-green uppercase tracking-wide leading-none">{flair.name}</span>
    </Link>
);

interface PostComponentProps {
    post: PostType;
    onImageClick?: (imageUrl: string) => void;
}

const PostComponent: React.FC<PostComponentProps> = ({ post, onImageClick }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { updatePostInContext, addPostToContext, fetchPosts } = usePosts();
    const { author } = post;
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(post.content);
    const menuRef = useRef<HTMLDivElement>(null);
    const [isTallImage, setIsTallImage] = useState(false);
    const [isQuoteModalOpen, setQuoteModalOpen] = useState(false);
    const isOwner = user?.id === post.user_id;
    
    useEffect(() => {
        if (post.image_url) {
            const img = new Image();
            img.onload = () => {
                const aspectRatio = img.height / img.width;
                setIsTallImage(aspectRatio > 1.2); 
            };
            img.src = post.image_url;
        } else {
            setIsTallImage(false);
        }
    }, [post.image_url]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handlePostCreated = (newPost: PostType) => {
      addPostToContext(newPost);
      setQuoteModalOpen(false);
    };

    const handleStartEdit = () => {
        setMenuOpen(false);
        setIsEditing(true);
        setEditedContent(post.content);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleSaveEdit = async () => {
        if (!editedContent.trim()) return;
        const updatedPost = { ...post, content: editedContent, is_edited: true };
        updatePostInContext(updatedPost);
        setIsEditing(false);
        const { error } = await supabase.from('posts').update({ content: editedContent.trim(), is_edited: true }).eq('id', post.id);
        if (error) {
            console.error("Failed to save edit:", error);
            updatePostInContext(post);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this post? This cannot be undone.")) return;
        setMenuOpen(false);
        const deletedPost = { ...post, is_deleted: true, content: "This post was deleted.", image_url: null, poll: null, quoted_post: null };
        updatePostInContext(deletedPost);
        const { error } = await supabase.from('posts').update({ is_deleted: true, content: "This post was deleted.", image_url: null, quoted_post_id: null }).eq('id', post.id);
        if (error) updatePostInContext(post);
    };

    if (!author) return null;
    
    const handleVote = async (newVote: 'like' | null) => {
        if (!user) { navigate('/login'); return; }
        const currentVote = post.user_vote;
        let newLikeCount = post.like_count;

        if (newVote === 'like') {
            newLikeCount = currentVote === 'like' ? post.like_count - 1 : post.like_count + 1;
        } else if (currentVote === 'like') {
            newLikeCount = post.like_count - 1;
        }

        updatePostInContext({ id: post.id, like_count: newLikeCount, user_vote: newVote === currentVote ? null : newVote });

        try {
            if (newVote === currentVote) {
                await supabase.from('likes').delete().match({ user_id: user.id, post_id: post.id });
            } else {
                await supabase.from('likes').upsert({ user_id: user.id, post_id: post.id, like_type: newVote }, { onConflict: 'user_id, post_id' });
            }
        } catch (error) {
            console.error("Failed to update vote:", error);
            updatePostInContext({ id: post.id, like_count: post.like_count, user_vote: post.user_vote });
        }
    };

    const handleBookmarkToggle = async () => {
        if (!user) { navigate('/login'); return; }
        const isCurrentlyBookmarked = post.is_bookmarked;
        updatePostInContext({ id: post.id, is_bookmarked: !isCurrentlyBookmarked });
        try {
            if (isCurrentlyBookmarked) {
                await supabase.from('bookmarks').delete().match({ user_id: user.id, post_id: post.id });
            } else {
                await supabase.from('bookmarks').insert({ user_id: user.id, post_id: post.id });
            }
        } catch (error) {
            console.error("Failed to update bookmark:", error);
            updatePostInContext({ id: post.id, is_bookmarked: isCurrentlyBookmarked });
        }
    };

    const handleRepostToggle = async () => {
        if (!user) { navigate('/login'); return; }
        const currentlyReposted = post.user_has_reposted;
        updatePostInContext({
            id: post.id,
            user_has_reposted: !currentlyReposted,
            repost_count: post.repost_count + (!currentlyReposted ? 1 : -1)
        });
        try {
            const { error } = await supabase.rpc('toggle_repost', { p_post_id: post.id });
            if (error) throw error;
            fetchPosts(); 
        } catch (error) {
            console.error("Failed to toggle repost:", error);
            updatePostInContext({ id: post.id, user_has_reposted: currentlyReposted, repost_count: post.repost_count });
        }
    };

    const authorLink = author.author_type === 'community' 
        ? `/communities/${author.author_id}` 
        : `/profile/${author.author_username}`;

    return (
        <>
            {isQuoteModalOpen && (
              <QuotePostModal 
                postToQuote={post} 
                onClose={() => setQuoteModalOpen(false)} 
                onPostCreated={handlePostCreated} 
              />
            )}
            
            <div 
                id={`post-${post.id}`}
                className={`
                    group relative 
                    bg-secondary-light/70 dark:bg-secondary/70 backdrop-blur-md
                    rounded-2xl shadow-sm hover:shadow-xl 
                    border border-tertiary-light/60 dark:border-white/5 hover:border-brand-green/20 dark:hover:border-brand-green/20 
                    transition-all duration-300 ease-out mb-5 overflow-hidden
                    ${!post.is_deleted ? 'cursor-pointer' : ''}
                `}
                onClick={() => !post.is_deleted && navigate(`/post/${post.id}`)}
            >
                {/* Repost Header */}
                {post.reposted_by && (
                    <div className="bg-tertiary-light/30 dark:bg-white/5 px-5 py-2 text-xs font-semibold text-text-tertiary-light dark:text-text-tertiary flex items-center gap-2 border-b border-transparent dark:border-white/5">
                        <ArrowPathRoundedSquareIcon className="w-3.5 h-3.5" />
                        <Link to={`/profile/${post.reposted_by.username}`} className="hover:text-brand-green transition-colors" onClick={e => e.stopPropagation()}>
                            {post.reposted_by.user_id === user?.id ? 'You' : post.reposted_by.full_name} reposted
                        </Link>
                    </div>
                )}
                
                <div className={`p-5 ${post.reposted_by ? 'pt-4' : ''}`}>
                    <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <Link to={authorLink} onClick={e => e.stopPropagation()} className="flex-shrink-0 relative group/avatar">
                            <div className="absolute -inset-0.5 bg-brand-green/30 rounded-full blur opacity-0 group-hover/avatar:opacity-50 transition duration-300"></div>
                            <img
                                src={author.author_avatar_url ? getResizedAvatarUrl(author.author_avatar_url, 80, 80) : `https://ui-avatars.com/api/?name=${author.author_name || author.author_username}&background=random&color=fff&bold=true`}
                                alt={author.author_name || ''} 
                                className="relative w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-tertiary shadow-sm"
                                loading="lazy"
                            />
                        </Link>

                        <div className="flex-1 min-w-0">
                            {/* Header: Author & Meta */}
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center flex-wrap gap-x-2">
                                        <Link to={authorLink} onClick={e => e.stopPropagation()} className="font-bold text-base text-text-main-light dark:text-text-main hover:underline truncate">
                                            {author.author_name}
                                        </Link>
                                        
                                        {author.author_flair_details && <Flair flair={author.author_flair_details} />}
                                        
                                        {author.author_type === 'community' && post.original_poster_username && (
                                            <span className="text-xs text-text-tertiary-light dark:text-text-tertiary flex items-center gap-1">
                                                via <Link to={`/profile/${post.original_poster_username}`} onClick={e => e.stopPropagation()} className="hover:text-brand-green transition-colors">@{post.original_poster_username}</Link>
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-xs text-text-tertiary-light dark:text-text-tertiary mt-0.5">
                                        {author.author_type === 'user' && <span>@{author.author_username}</span>}
                                        <span>•</span>
                                        <span className="hover:underline">{formatTimestamp(post.created_at)}</span>
                                        {post.is_edited && <span>(edited)</span>}
                                    </div>
                                </div>

                                {/* Ellipsis Menu */}
                                {isOwner && !post.is_deleted && (
                                    <div className="relative -mr-2 -mt-2" ref={menuRef}>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setMenuOpen(prev => !prev); }} 
                                            className="p-2 rounded-full text-text-tertiary-light dark:text-text-tertiary hover:bg-tertiary-light dark:hover:bg-white/10 transition-colors"
                                        >
                                            <EllipsisVerticalIcon className="w-5 h-5" />
                                        </button>
                                        {isMenuOpen && (
                                            <div className="absolute top-full right-0 mt-1 w-40 bg-white dark:bg-tertiary border border-tertiary-light dark:border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden animate-fadeIn">
                                                <button onClick={(e) => { e.stopPropagation(); handleStartEdit(); }} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                    <PencilIcon className="w-4 h-4" /> Edit
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                    <TrashIcon className="w-4 h-4" /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Content */}
                            {isEditing ? (
                                <div className="mt-3" onClick={e => e.stopPropagation()}>
                                    <textarea 
                                        value={editedContent}
                                        onChange={(e) => setEditedContent(e.target.value)}
                                        className="w-full bg-tertiary-light dark:bg-tertiary p-3 rounded-xl border-2 border-transparent focus:border-brand-green/50 outline-none transition-all"
                                        rows={4}
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2 mt-3">
                                        <button onClick={handleCancelEdit} className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-tertiary-light dark:hover:bg-white/10">Cancel</button>
                                        <button onClick={handleSaveEdit} className="px-4 py-2 text-sm font-bold rounded-lg bg-brand-green text-black hover:bg-brand-green-darker shadow-lg shadow-brand-green/20">Save</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-3">
                                    {post.is_deleted ? (
                                        <div className="p-4 rounded-xl bg-tertiary-light/30 dark:bg-white/5 border border-dashed border-tertiary-light dark:border-white/10">
                                            <p className="italic text-sm text-text-tertiary-light dark:text-text-tertiary text-center">{post.content}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-text-main-light dark:text-text-main text-[15px] leading-relaxed whitespace-pre-wrap font-normal">
                                                {renderContentWithEmbeds(post.content)}
                                            </div>
                                            
                                            {post.quoted_post && <QuotePostDisplay post={post.quoted_post} />}

                                            {post.image_url && (
                                                <div className={`mt-4 rounded-xl overflow-hidden border border-tertiary-light dark:border-white/10 shadow-inner bg-black/5 dark:bg-black/20 ${isTallImage ? 'max-w-sm' : 'w-full'}`}>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); if (onImageClick) { onImageClick(post.image_url!); } }} 
                                                        className="w-full block cursor-zoom-in"
                                                    >
                                                        <img 
                                                            src={post.image_url} 
                                                            alt="Post content" 
                                                            className="w-full h-auto object-contain max-h-[500px]" 
                                                            loading="lazy"
                                                        />
                                                    </button>
                                                </div>
                                            )}

                                            {post.poll && <PollComponent poll={post.poll} postId={post.id} />}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Bar */}
                    {!isEditing && !post.is_deleted && (
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-tertiary-light/50 dark:border-white/5">
                            <Link 
                                to={`/post/${post.id}`} 
                                onClick={(e) => e.stopPropagation()} 
                                className="group/btn flex items-center gap-1.5 text-text-tertiary-light dark:text-text-tertiary hover:text-blue-500 transition-colors"
                            >
                                <div className="p-2 rounded-full group-hover/btn:bg-blue-500/10 transition-colors">
                                    <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium">{post.comment_count || 0}</span>
                            </Link>

                            <button 
                                className={`group/btn flex items-center gap-1.5 transition-colors ${post.user_has_reposted ? 'text-green-500' : 'text-text-tertiary-light dark:text-text-tertiary hover:text-green-500'}`}
                                onClick={(e) => { e.stopPropagation(); handleRepostToggle(); }}
                            >
                                <div className="p-2 rounded-full group-hover/btn:bg-green-500/10 transition-colors">
                                    <ArrowPathRoundedSquareIcon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium">{post.repost_count || 0}</span>
                            </button>
                            
                            <button 
                                className={`group/btn flex items-center gap-1.5 transition-colors ${post.user_vote === 'like' ? 'text-red-500' : 'text-text-tertiary-light dark:text-text-tertiary hover:text-red-500'}`}
                                onClick={(e) => { e.stopPropagation(); handleVote('like'); }}
                            >
                                <div className="p-2 rounded-full group-hover/btn:bg-red-500/10 transition-colors">
                                    {post.user_vote === 'like' ? <HeartSolid className="w-5 h-5" /> : <HeartOutline className="w-5 h-5" />}
                                </div>
                                <span className="text-xs font-medium">{post.like_count || 0}</span>
                            </button>
                            
                            <button 
                                className="group/btn flex items-center justify-center p-2 rounded-full text-text-tertiary-light dark:text-text-tertiary hover:text-blue-500 hover:bg-blue-500/10 transition-all" 
                                onClick={(e) => { e.stopPropagation(); setQuoteModalOpen(true); }}
                                title="Quote Post"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                            </button>
                            
                            <button 
                                className={`group/btn flex items-center justify-center p-2 rounded-full transition-all ${post.is_bookmarked ? 'text-brand-green' : 'text-text-tertiary-light dark:text-text-tertiary hover:text-brand-green hover:bg-brand-green/10'}`}
                                onClick={(e) => { e.stopPropagation(); handleBookmarkToggle(); }}
                            >
                                {post.is_bookmarked ? <BookmarkSolid className="w-5 h-5" /> : <BookmarkIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default PostComponent;