'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import PostComponent from '@/components/Post';
import { Post as PostType, Comment as CommentType, Profile } from '@/types';
import Spinner from '@/components/Spinner';
import { formatTimestamp, formatExactTimestamp } from '@/utils/timeUtils';
import { renderContentWithEmbeds } from '@/utils/renderEmbeds';

const Flair: React.FC<{ flair: { id: string; name: string; avatar_url: string | null } }> = ({ flair }) => (
    <Link
        href={`/communities/${flair.id}`}
        onClick={(e) => e.stopPropagation()}
        className="group ml-2"
        title={flair.name}
    >
        <img
            src={flair.avatar_url || `https://ui-avatars.com/api/?name=${flair.name}`}
            alt={flair.name}
            className="w-5 h-5 rounded-full object-cover transition-transform group-hover:scale-110"
        />
    </Link>
);

const Comment: React.FC<{ comment: CommentType }> = ({ comment }) => {
    const author = comment.profiles;
    return (
        <div className="flex items-start space-x-3 p-4 border-b border-tertiary-light dark:border-tertiary">
            <Link href={`/profile/${author?.username}`} className="flex-shrink-0">
                <img
                    src={author?.avatar_url || `https://ui-avatars.com/api/?name=${author?.full_name || author?.username}&background=random&color=fff&bold=true`}
                    alt={author?.username || 'avatar'}
                    className="w-10 h-10 rounded-full bg-tertiary object-cover"
                />
            </Link>
            <div className="flex-1 min-w-0">
                <div>
                    <div className="flex items-baseline md:space-x-2 flex-wrap md:flex-nowrap">
                        <Link href={`/profile/${author?.username}`} className="font-semibold text-text-main-light dark:text-text-main hover:underline leading-tight truncate">{author?.full_name || author?.username}</Link>
                        {author?.flair_details && <Flair flair={author.flair_details} />}
                        <span className="text-sm text-text-tertiary-light dark:text-text-tertiary truncate hidden md:inline">@{author?.username}</span>
                        <span className="text-sm text-text-tertiary-light dark:text-text-tertiary hidden md:inline">&middot;</span>
                        <span className="text-sm text-text-tertiary-light dark:text-text-tertiary hover:underline flex-shrink-0 hidden md:inline" title={new Date(comment.created_at).toLocaleString()}>
                            {formatTimestamp(comment.created_at)}
                        </span>
                    </div>
                    <p className="md:hidden text-sm text-text-tertiary-light dark:text-text-tertiary -mt-1 truncate" title={new Date(comment.created_at).toLocaleString()}>
                        @{author?.username} &middot; {formatTimestamp(comment.created_at)}
                    </p>
                </div>
                <div className="mt-1 text-text-secondary-light dark:text-text-secondary">
                    {renderContentWithEmbeds(comment.content)}
                </div>
            </div>
        </div>
    );
};

interface PostRpcResult extends Omit<PostType, 'author'> {
    author_id: string;
    author_type: 'user' | 'community';
    author_name: string | null;
    author_username: string | null;
    author_avatar_url: string | null;
    author_flair_details: {
        id: string;
        name: string;
        avatar_url: string | null;
    } | null;
}

const PostPage: React.FC = () => {
    const params = useParams();
    const postId = params?.postId as string;
    const { user } = useAuth();
    const { posts, updatePostInContext, addPostToContext } = usePosts();

    const [localPost, setLocalPost] = useState<PostType | null>(null);
    const [pageLoading, setPageLoading] = useState(true);

    const [comments, setComments] = useState<CommentType[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);

    const postFromContext = posts.find((p): p is PostType => !('item_type' in p) && p.id === postId);
    const post = localPost || postFromContext;

    useEffect(() => {
        const fetchPost = async () => {
            if (!postId) return;
            setPageLoading(true);

            if (postFromContext) {
                setLocalPost(null);
                setPageLoading(false);
            } else {
                // --- THIS IS THE FIX: Call the new, correct RPC function ---
                const { data: postData, error: postError } = await supabase
                    .rpc('get_post_details_by_id', { p_post_id: postId })
                    .single<PostRpcResult>();

                if (postError || !postData) {
                    console.error("Error fetching post:", postError);
                    setPageLoading(false);
                    return;
                }

                const formattedPost: PostType = {
                    ...postData,
                    author: {
                        author_id: postData.author_id,
                        author_type: postData.author_type,
                        author_name: postData.author_name,
                        author_username: postData.author_username,
                        author_avatar_url: postData.author_avatar_url,
                        author_flair_details: postData.author_flair_details
                    }
                };
                setLocalPost(formattedPost);
                setPageLoading(false);
            }

            if (user) {
                const { data: profileData } = await supabase.from('profiles').select('*, flair_details:displayed_community_flair(id, name, avatar_url)').eq('user_id', user.id).single();
                setCurrentUserProfile(profileData);
            }
        };

        fetchPost();
    }, [postId, postFromContext, user]);

    useEffect(() => {
        const fetchComments = async () => {
            if (!postId) return;
            const { data: commentsData, error: commentsError } = await supabase.rpc('get_comments_for_post', { p_post_id: postId });
            if (commentsError) {
                console.error("Error fetching comments with flair:", commentsError);
            } else {
                setComments((commentsData as CommentType[]) || []);
            }
        };

        fetchComments();
    }, [postId]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !post || !newComment.trim() || !currentUserProfile) return;

        const tempCommentId = Date.now();
        const optimisticComment: CommentType = {
            id: tempCommentId,
            content: newComment.trim(),
            user_id: user.id,
            post_id: post.id,
            created_at: new Date().toISOString(),
            profiles: currentUserProfile,
        };

        setComments(prev => [...prev, optimisticComment]);
        const originalCommentCount = post.comment_count || 0;
        updatePostInContext({ id: post.id, comment_count: originalCommentCount + 1 });
        const submittedCommentText = newComment;
        setNewComment('');
        setIsSubmitting(true);

        try {
            const { data: commentData, error } = await supabase
                .from('comments')
                .insert({ post_id: post.id, user_id: user.id, content: optimisticComment.content })
                .select()
                .single();

            if (error) throw error;

            setComments(prev => prev.map(c => c.id === tempCommentId ? { ...c, ...commentData } : c));

        } catch (err: unknown) {
            console.error("Error submitting comment:", err);
            alert('Failed to post comment. Please try again.');
            setComments(prev => prev.filter(c => c.id !== tempCommentId));
            updatePostInContext({ id: post.id, comment_count: originalCommentCount });
            setNewComment(submittedCommentText);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (pageLoading) {
        return <div className="text-center py-10"><Spinner /></div>;
    }

    if (!post) {
        return <div className="text-center py-10 text-red-400">Post not found.</div>;
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <PostComponent post={post} />

            <div className="px-4 py-3 text-sm text-text-tertiary-light dark:text-text-tertiary border-y border-tertiary-light dark:border-tertiary bg-secondary-light dark:bg-secondary">
                <span>{formatExactTimestamp(post.created_at)}</span>
            </div>

            {currentUserProfile && (
                <div className="p-4 border-b border-tertiary-light dark:border-tertiary bg-secondary-light dark:bg-secondary">
                    <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3">
                        <img
                            src={currentUserProfile.avatar_url || `https://ui-avatars.com/api/?name=${currentUserProfile.full_name || currentUserProfile.username}&background=random&color=fff&bold=true`}
                            alt="Your avatar" className="w-10 h-10 rounded-full bg-tertiary object-cover"
                        />
                        <div className="flex-1">
                            <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Post your reply" className="w-full bg-tertiary-light dark:bg-tertiary rounded-lg p-2 text-text-main-light dark:text-text-main placeholder-text-tertiary-light dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-green" rows={2} />
                            <div className="flex justify-end mt-2">
                                <button type="submit" disabled={isSubmitting || !newComment.trim()} className="bg-brand-green text-black font-bold py-2 px-4 rounded-full disabled:opacity-50 hover:bg-brand-green-darker">
                                    {isSubmitting ? <Spinner /> : 'Reply'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div className='bg-secondary-light dark:bg-secondary rounded-b-lg'>
                {comments.length > 0 ? (
                    comments.map(comment => <Comment key={comment.id} comment={comment} />)
                ) : (
                    <div className="text-center text-text-tertiary-light dark:text-text-tertiary py-8">
                        <p>No Comments Yet.</p>
                        <p>Be the first one to comment!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostPage;
