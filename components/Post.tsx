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
  ArrowPathRoundedSquareIcon
} from './icons';
import { HeartIcon as HeartSolid, BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';
import PollComponent from './Poll';
import QuotePostDisplay from './QuotePostDisplay';
import QuotePostModal from './QuotePostModal';

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
        // Optimistically remove the post content, making it appear deleted instantly
        const deletedPost = { ...post, is_deleted: true, content: "This post was deleted.", image_url: null, poll: null, quoted_post: null };
        updatePostInContext(deletedPost);

        // Perform the actual update in the background
        const { error } = await supabase.from('posts').update({ is_deleted: true, content: "This post was deleted.", image_url: null, quoted_post_id: null }).eq('id', post.id);
        
        if (error) {
            console.error("Failed to delete post:", error);
            // Revert on failure
            updatePostInContext(post);
        }
    };

    if (!author) return null;
    
    const handleVote = async (newVote: 'like' | null) => {
        if (!user) { navigate('/login'); return; }
        const currentVote = post.user_vote;
        let newLikeCount = post.like_count;

        if (newVote === 'like') {
            newLikeCount = currentVote === 'like' ? post.like_count - 1 : post.like_count + 1;
        } else if (currentVote === 'like') { // This case handles changing vote, e.g. like -> dislike
            newLikeCount = post.like_count - 1;
        }

        updatePostInContext({ id: post.id, like_count: newLikeCount, user_vote: newVote === currentVote ? null : newVote });

        try {
            if (newVote === currentVote) { // Un-voting
                await supabase.from('likes').delete().match({ user_id: user.id, post_id: post.id });
            } else { // Voting or changing vote
                await supabase.from('likes').upsert({ user_id: user.id, post_id: post.id, like_type: newVote }, { onConflict: 'user_id, post_id' });
            }
        } catch (error) {
            console.error("Failed to update vote:", error);
            // Revert optimistic update on failure
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
            // Refetch the feed to see the reposted item appear/disappear correctly sorted
            fetchPosts(); 
        } catch (error) {
            console.error("Failed to toggle repost:", error);
            // Revert on failure
            updatePostInContext({
                id: post.id,
                user_has_reposted: currentlyReposted,
                repost_count: post.repost_count
            });
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
                className={`bg-secondary-light dark:bg-secondary rounded-xl shadow-lg border border-tertiary-light dark:border-tertiary transition-all duration-200 ${!post.is_deleted ? 'hover:border-brand-green/20 dark:hover:border-brand-green/30 hover:bg-tertiary-light/20 dark:hover:bg-tertiary/20' : ''}`}
            >
                {post.reposted_by && (
                    <div className="px-4 pt-3 text-xs font-semibold text-text-tertiary-light dark:text-text-tertiary flex items-center gap-2">
                        <ArrowPathRoundedSquareIcon className="w-4 h-4" />
                        <Link to={`/profile/${post.reposted_by.username}`} className="hover:underline">
                            Reposted by {post.reposted_by.user_id === user?.id ? 'you' : post.reposted_by.full_name}
                        </Link>
                    </div>
                )}
                
                <div 
                    className={`p-4 ${post.reposted_by ? 'pt-2' : ''} ${!post.is_deleted ? 'cursor-pointer' : ''}`}
                    onClick={() => !post.is_deleted && navigate(`/post/${post.id}`)}
                >
                    <div className="flex items-start space-x-3">
                        <Link to={authorLink} onClick={e => e.stopPropagation()} className="flex-shrink-0">
                            <img 
                                src={author.author_avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.author_name || ' ')}&background=3cfba2&color=000`} 
                                alt={author.author_name || ''} 
                                className="w-10 h-10 rounded-full object-cover bg-gray-700" 
                            />
                        </Link>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <div className="min-w-0">
                                    {author.author_type === 'user' ? (
                                        <div>
                                            <div className="flex items-baseline md:space-x-2 flex-wrap md:flex-nowrap">
                                                <Link to={authorLink} onClick={e => e.stopPropagation()} className="font-bold hover:underline text-text-main-light dark:text-text-main leading-tight truncate">{author.author_name}</Link>
                                                <span className="text-sm text-text-tertiary-light dark:text-text-tertiary truncate hidden md:inline">@{author.author_username}</span>
                                                <span className="text-sm text-text-tertiary-light dark:text-text-tertiary hidden md:inline">&middot;</span>
                                                <span className="text-sm text-text-tertiary-light dark:text-text-tertiary hover:underline flex-shrink-0 hidden md:inline">{formatTimestamp(post.created_at)}</span>
                                            </div>
                                            <p className="md:hidden text-sm text-text-tertiary-light dark:text-text-tertiary -mt-1 truncate">
                                                @{author.author_username} &middot; {formatTimestamp(post.created_at)}
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <Link to={authorLink} onClick={e => e.stopPropagation()} className="font-bold hover:underline text-text-main-light dark:text-text-main leading-tight">{author.author_name}</Link>
                                            {post.original_poster_username && (
                                                <div className="flex items-center space-x-2 text-xs text-text-tertiary-light dark:text-text-tertiary">
                                                    <span>Posted by <Link to={`/profile/${post.original_poster_username}`} onClick={e => e.stopPropagation()} className="hover:underline">@{post.original_poster_username}</Link></span>
                                                    <span>&middot;</span>
                                                    <span className="hover:underline">{formatTimestamp(post.created_at)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {isOwner && !post.is_deleted && (
                                    <div className="relative" ref={menuRef}>
                                        <button onClick={(e) => { e.stopPropagation(); setMenuOpen(prev => !prev); }} className="p-2 rounded-full text-text-tertiary-light dark:text-text-tertiary hover:bg-tertiary-light dark:hover:bg-tertiary">
                                            <EllipsisVerticalIcon className="w-5 h-5" />
                                        </button>
                                        {isMenuOpen && (
                                            <div className="absolute top-full right-0 mt-2 w-48 bg-secondary-light dark:bg-secondary border border-tertiary-light dark:border-tertiary rounded-lg shadow-xl z-10">
                                                <button onClick={(e) => { e.stopPropagation(); handleStartEdit(); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm hover:bg-tertiary-light dark:hover:bg-tertiary">
                                                    <PencilIcon className="w-4 h-4" /> Edit Post
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-tertiary-light dark:hover:bg-tertiary">
                                                    <TrashIcon className="w-4 h-4" /> Delete Post
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {isEditing ? (
                                <div className="mt-2">
                                    <textarea 
                                        value={editedContent}
                                        onChange={(e) => setEditedContent(e.target.value)}
                                        className="w-full bg-tertiary-light dark:bg-tertiary p-2 rounded-md focus:ring-2 focus:ring-brand-green"
                                        rows={4}
                                        autoFocus
                                        onClick={e => e.stopPropagation()}
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button onClick={(e) => {e.stopPropagation(); handleCancelEdit();}} className="py-1 px-3 text-sm rounded-md hover:bg-tertiary-light dark:hover:bg-tertiary">Cancel</button>
                                        <button onClick={(e) => {e.stopPropagation(); handleSaveEdit();}} className="py-1 px-3 text-sm rounded-md bg-brand-green text-black font-semibold">Save</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mt-1 text-text-secondary-light dark:text-text-secondary">
                                        {post.is_deleted ? (
                                            <p className="italic text-text-tertiary-light dark:text-text-tertiary">{post.content}</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {renderContentWithEmbeds(post.content)}
                                                {post.is_edited && <span className="text-xs text-text-tertiary-light dark:text-text-tertiary float-right">(edited)</span>}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {!post.is_deleted && post.quoted_post && <QuotePostDisplay post={post.quoted_post} />}

                                    {!post.is_deleted && post.image_url && (
                                        <div className={`mt-3 rounded-lg overflow-hidden border border-tertiary-light dark:border-tertiary ${isTallImage ? 'max-w-[55%]' : 'w-full'}`}>
                                            <div className="max-h-[500px] bg-black flex justify-center">
                                                <button onClick={(e) => { e.stopPropagation(); if (onImageClick) { onImageClick(post.image_url!); } }} className="w-full h-full">
                                                    <img src={post.image_url} alt="Post content" className="w-full h-full object-contain" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {!post.is_deleted && post.poll && <PollComponent poll={post.poll} postId={post.id} />}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {!isEditing && !post.is_deleted && (
                    <div className="flex items-center justify-around mt-3 text-text-tertiary-light dark:text-text-tertiary">
                        <Link to={`/post/${post.id}`} onClick={(e) => e.stopPropagation()} className="flex items-center space-x-1 group">
                            <div className="p-1.5 rounded-full group-hover:bg-blue-500/10 transition-colors">
                                <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5 group-hover:text-blue-500" />
                            </div>
                            <span className="text-sm group-hover:text-blue-500">{post.comment_count}</span>
                        </Link>
                        
                        <div className="flex items-center space-x-1 group" onClick={(e) => { e.stopPropagation(); handleRepostToggle(); }}>
                            <button className="p-1.5 rounded-full group-hover:bg-green-500/10 transition-colors">
                                <ArrowPathRoundedSquareIcon className={`w-5 h-5 group-hover:text-green-500 ${post.user_has_reposted ? 'text-green-500' : ''}`} />
                            </button>
                            <span className={`text-sm group-hover:text-green-500 ${post.user_has_reposted ? 'text-green-500 font-semibold' : ''}`}>{post.repost_count}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1 group" onClick={(e) => { e.stopPropagation(); handleVote('like'); }}>
                            <button className="p-1.5 rounded-full group-hover:bg-red-500/10 transition-colors">
                                {post.user_vote === 'like' ? <HeartSolid className="w-5 h-5 text-red-500" /> : <HeartOutline className="w-5 h-5 group-hover:text-red-500" />}
                            </button>
                            <span className={`text-sm group-hover:text-red-500 ${post.user_vote === 'like' ? 'text-red-500 font-semibold' : ''}`}>{post.like_count}</span>
                        </div>
                        
                        <button 
                            className="p-1.5 rounded-full hover:bg-blue-500/10 transition-colors group" 
                            onClick={(e) => { e.stopPropagation(); setQuoteModalOpen(true); }}
                            title="Quote Post"
                        >
                            <svg className="w-5 h-5 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                            </svg>
                        </button>
                        
                        <button className="p-1.5 rounded-full hover:bg-brand-green/10 transition-colors group" onClick={(e) => { e.stopPropagation(); handleBookmarkToggle(); }}>
                            {post.is_bookmarked ? <BookmarkSolid className="w-5 h-5 text-brand-green" /> : <BookmarkIcon className="w-5 h-5 group-hover:text-brand-green" />}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default PostComponent;