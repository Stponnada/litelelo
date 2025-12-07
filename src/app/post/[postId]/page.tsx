'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import PostComponent from '@/components/Post';
import { Post as PostType, Profile } from '@/types';
import Spinner from '@/components/Spinner';
import { formatExactTimestamp } from '@/utils/timeUtils';

// Recursive component for rendering the comment tree
const CommentNode: React.FC<{
    node: PostType & { children: any[] };
    depth: number;
    onReply: (post: PostType) => void;
    onUpdate: (post: Partial<PostType> & { id: string }) => void;
    replyingToId: string | null;
    submitReply: (content: string, parentId: string) => Promise<void>;
    currentUserProfile: Profile | null;
    isSubmitting: boolean;
}> = ({ node, depth, onReply, onUpdate, replyingToId, submitReply, currentUserProfile, isSubmitting }) => {
    const [replyContent, setReplyContent] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        await submitReply(replyContent, node.id);
        setReplyContent('');
    };

    return (
        <div className={`flex flex-col ${depth > 0 ? 'ml-4 md:ml-8 border-l-2 border-tertiary-light dark:border-white/5 pl-4' : ''}`}>
            <PostComponent post={node} onReply={onReply} onUpdate={onUpdate} className="mb-0.5" />

            {/* Inline Reply Form */}
            {replyingToId === node.id && currentUserProfile && (
                <div className="mb-4 ml-2 animate-fadeIn">
                    <form onSubmit={handleSubmit} className="flex items-start gap-3">
                        <div className="w-8 h-8 relative rounded-full overflow-hidden flex-shrink-0 bg-tertiary">
                            <img
                                src={currentUserProfile.avatar_url || `https://ui-avatars.com/api/?name=${currentUserProfile.full_name || currentUserProfile.username}&background=random&color=fff&bold=true`}
                                alt="Avatar"
                                className="object-cover w-full h-full"
                            />
                        </div>
                        <div className="flex-1">
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder={`Replying to @${node.author.author_username}...`}
                                className="w-full bg-tertiary-light dark:bg-tertiary p-2 rounded-lg border border-tertiary-light dark:border-white/10 focus:border-brand-green outline-none text-sm"
                                rows={2}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => onReply(node)} // Toggle off (handled by parent logic if needed, or just keep open)
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-tertiary-light dark:hover:bg-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !replyContent.trim()}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-green text-black hover:bg-brand-green-darker disabled:opacity-50"
                                >
                                    {isSubmitting ? <Spinner /> : 'Reply'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Children */}
            <div className="flex flex-col gap-2 mt-2">
                {node.children.map(child => (
                    <CommentNode
                        key={child.id}
                        node={child}
                        depth={depth + 1}
                        onReply={onReply}
                        onUpdate={onUpdate}
                        replyingToId={replyingToId}
                        submitReply={submitReply}
                        currentUserProfile={currentUserProfile}
                        isSubmitting={isSubmitting}
                    />
                ))}
            </div>
        </div>
    );
};

const PostPage: React.FC = () => {
    const params = useParams();
    const postId = params?.postId as string;
    const { user } = useAuth();
    const { updatePostInContext } = usePosts(); // Removed addPostToContext as we manage local state for thread

    const [threadPosts, setThreadPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch thread
    useEffect(() => {
        const fetchThread = async () => {
            if (!postId) return;
            setLoading(true);

            // Fetch user profile
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('*, flair_details:displayed_community_flair(id, name, avatar_url)').eq('user_id', user.id).single();
                setCurrentUserProfile(profile);
            }

            // Fetch post thread
            const { data, error } = await supabase.rpc('get_post_thread', { p_root_post_id: postId });

            if (error) {
                console.error("Error fetching thread:", error);
            } else if (data) {
                // Map RPC result to PostType
                const formattedPosts: PostType[] = data.map((p: any) => ({
                    ...p,
                    author: {
                        author_id: p.author_id,
                        author_type: p.author_type,
                        author_name: p.author_name,
                        author_username: p.author_username,
                        author_avatar_url: p.author_avatar_url,
                        author_flair_details: p.author_flair_details
                    }
                }));
                setThreadPosts(formattedPosts);
            }
            setLoading(false);
        };

        fetchThread();
    }, [postId, user]);

    // Build tree
    const { rootPost, tree } = useMemo(() => {
        if (!threadPosts.length) return { rootPost: null, tree: [] };

        const nodes: Record<string, PostType & { children: any[] }> = {};
        threadPosts.forEach(p => { nodes[p.id] = { ...p, children: [] }; });

        let root: (PostType & { children: any[] }) | null = null;
        const roots: (PostType & { children: any[] })[] = [];

        threadPosts.forEach(p => {
            if (p.id === postId) {
                root = nodes[p.id];
            } else if (p.parent_post_id && nodes[p.parent_post_id]) {
                nodes[p.parent_post_id].children.push(nodes[p.id]);
            } else if (p.parent_post_id === postId) {
                // Direct child of the main post we are viewing
                if (root) root.children.push(nodes[p.id]);
                else roots.push(nodes[p.id]); // Fallback if root not found yet (shouldn't happen if sorted)
            }
        });

        // If we are viewing a sub-post (comment) as the main page, it acts as root.
        // But get_post_thread returns the whole thread from the ULTIMATE root.
        // Wait, get_post_thread(p_root_post_id) returns everything with that root.
        // If I visit a comment directly, I might want to see its parents?
        // The current implementation assumes postId IS the root.
        // If postId is a child, get_post_thread might return nothing if I pass child ID as root ID.
        // Let's assume for now postId IS a root or I need to fetch the post first to find its root.

        // Actually, if I click a comment, I go to /post/[commentId].
        // That comment has a root_post_id.
        // If I want to show the whole conversation, I should fetch by root_post_id.
        // But for now, let's stick to the requested scope: "every comment to a post is a post in itself".
        // If I visit a comment, it is treated as a post.

        return { rootPost: root, tree: root ? (root as PostType & { children: any[] }).children : roots };
    }, [threadPosts, postId]);

    const handleReply = (post: PostType) => {
        if (replyingToId === post.id) {
            setReplyingToId(null); // Toggle off
        } else {
            setReplyingToId(post.id);
        }
    };

    const handleUpdate = (updatedPost: Partial<PostType> & { id: string }) => {
        setThreadPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
    };

    const submitReply = async (content: string, parentId: string) => {
        if (!user || !currentUserProfile) return;
        setIsSubmitting(true);

        try {
            // Use the new/updated RPC or just insert directly?
            // The migration updated create_post_with_poll to handle parent_post_id.
            // But I can't easily call it via supabase.rpc if the signature changed and I didn't update types.
            // Actually I updated the function in SQL.
            // Let's use supabase.rpc('create_post_with_poll', ... params including p_parent_post_id)

            const { data, error } = await supabase.rpc('create_post_with_poll', {
                p_content: content,
                p_image_url: null,
                p_community_id: null, // Inherit? Or null for user profile?
                p_is_public: true,
                p_poll_options: [],
                p_allow_multiple_answers: false,
                p_parent_post_id: parentId
            });

            if (error) throw error;

            // Optimistic update or refetch
            // Refetching is safer for the tree structure
            const { data: newThread, error: fetchError } = await supabase.rpc('get_post_thread', { p_root_post_id: postId });
            if (newThread) {
                const formattedPosts: PostType[] = newThread.map((p: any) => ({
                    ...p,
                    author: {
                        author_id: p.author_id,
                        author_type: p.author_type,
                        author_name: p.author_name,
                        author_username: p.author_username,
                        author_avatar_url: p.author_avatar_url,
                        author_flair_details: p.author_flair_details
                    }
                }));
                setThreadPosts(formattedPosts);
            }

            setReplyingToId(null);

            // Update comment count of parent if needed in global context?
            // We are in a specific page, so local state is most important.

        } catch (err) {
            console.error("Failed to reply:", err);
            alert("Failed to reply. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center py-10"><Spinner /></div>;
    if (!rootPost && threadPosts.length === 0) return <div className="text-center py-10">Post not found.</div>;

    // If rootPost is missing but we have threads (e.g. viewing a comment as root), handle gracefully
    const displayRoot = rootPost || threadPosts.find(p => p.id === postId);

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {displayRoot && (
                <>
                    <PostComponent post={displayRoot} onReply={handleReply} onUpdate={handleUpdate} />

                    {/* Main Reply Input (always visible for root) */}
                    {currentUserProfile && (
                        <div className="p-4 border-b border-tertiary-light dark:border-tertiary bg-secondary-light dark:bg-secondary mb-2 rounded-b-xl">
                            <form onSubmit={(e) => { e.preventDefault(); const form = e.target as HTMLFormElement; const input = form.elements.namedItem('content') as HTMLTextAreaElement; submitReply(input.value, displayRoot.id); input.value = ''; }} className="flex items-start gap-3">
                                <img
                                    src={currentUserProfile.avatar_url || `https://ui-avatars.com/api/?name=${currentUserProfile.full_name || currentUserProfile.username}&background=random&color=fff&bold=true`}
                                    alt="Avatar"
                                    className="w-10 h-10 rounded-full bg-tertiary object-cover"
                                />
                                <div className="flex-1">
                                    <textarea
                                        name="content"
                                        placeholder="Post your reply"
                                        className="w-full bg-tertiary-light dark:bg-tertiary p-3 rounded-xl border-none focus:ring-2 focus:ring-brand-green outline-none text-text-main-light dark:text-text-main placeholder-text-tertiary-light dark:placeholder-text-tertiary"
                                        rows={2}
                                    />
                                    <div className="flex justify-end mt-2">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="bg-brand-green text-black font-bold py-2 px-6 rounded-full hover:bg-brand-green-darker disabled:opacity-50 transition-colors"
                                        >
                                            {isSubmitting ? <Spinner /> : 'Reply'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </>
            )}

            <div className="space-y-0.5 mt-1">
                {tree.map((child: PostType & { children: any[] }) => (
                    <CommentNode
                        key={child.id}
                        node={child}
                        depth={0}
                        onReply={handleReply}
                        onUpdate={handleUpdate}
                        replyingToId={replyingToId}
                        submitReply={submitReply}
                        currentUserProfile={currentUserProfile}
                        isSubmitting={isSubmitting}
                    />
                ))}
            </div>

            {tree.length === 0 && (
                <div className="text-center text-text-tertiary-light dark:text-text-tertiary py-10">
                    No comments yet. Be the first to reply!
                </div>
            )}
        </div>
    );
};

export default PostPage;
