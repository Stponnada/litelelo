'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import PostComponent from '@/components/Post';
import { Post as PostType, Profile } from '@/types';
import Spinner from '@/components/Spinner';
import { formatExactTimestamp } from '@/utils/timeUtils';
import { ArrowLeftIcon } from '@/components/icons';
import CreatePost from '@/components/CreatePost';

// Recursive component for rendering the comment tree
const CommentNode: React.FC<{
    node: PostType & { children: any[] };
    depth: number;
    onReply: (post: PostType) => void;
    onUpdate: (post: Partial<PostType> & { id: string }) => void;
    replyingToId: string | null;
    currentUserProfile: Profile | null;
    onPostCreated: (newPost: PostType) => void;
}> = ({ node, depth, onReply, onUpdate, replyingToId, currentUserProfile, onPostCreated }) => {

    return (
        <div className={`flex flex-col ${depth > 0 ? 'ml-4 md:ml-8 border-l-2 border-tertiary-light dark:border-white/5 pl-4' : ''}`}>
            <PostComponent post={node} onReply={onReply} onUpdate={onUpdate} className="mb-0.5" />

            {/* Inline Reply Form */}
            {replyingToId === node.id && currentUserProfile && (
                <div className="mb-4 ml-2 animate-fadeIn bg-secondary-light dark:bg-secondary rounded-xl overflow-hidden border border-tertiary-light dark:border-white/5 shadow-sm">
                    <CreatePost
                        profile={currentUserProfile}
                        onPostCreated={onPostCreated}
                        parentPostId={node.id}
                        communityId={node.community_id}
                        isPublicPost={node.is_public}
                        placeholderText={`Replying to @${node.author.author_username}...`}
                    />
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
                        onPostCreated={onPostCreated}
                        currentUserProfile={currentUserProfile}
                    />
                ))}
            </div>
        </div>
    );
};

const PostPage: React.FC = () => {
    const params = useParams();
    const router = useRouter();
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

            // Fetch the current post first to find its root
            const { data: currentPostData, error: currentPostError } = await supabase
                .from('posts')
                .select('root_post_id, parent_post_id')
                .eq('id', postId)
                .single();

            const fetchId = currentPostData?.root_post_id || postId;

            // Fetch post thread
            const { data, error } = await supabase.rpc('get_post_thread', { p_post_id: fetchId });

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
    }, [postId, user?.id]);

    // Build tree
    const { rootPost, tree, ancestors } = useMemo(() => {
        if (!threadPosts.length) return { rootPost: null, tree: [], ancestors: [] };

        const nodes: Record<string, PostType & { children: any[] }> = {};
        threadPosts.forEach(p => { nodes[p.id] = { ...p, children: [] }; });

        // Find current post
        const currentPostNode = nodes[postId];
        const ancestorList: PostType[] = [];

        if (currentPostNode) {
            let currId = currentPostNode.parent_post_id;
            while (currId && nodes[currId]) {
                const parent = nodes[currId];
                ancestorList.unshift(parent);
                currId = parent.parent_post_id;
            }
        }

        // Tree building (only for children)
        threadPosts.forEach(p => {
            if (p.parent_post_id && nodes[p.parent_post_id]) {
                nodes[p.parent_post_id].children.push(nodes[p.id]);
            }
        });

        return {
            rootPost: currentPostNode,
            tree: currentPostNode ? currentPostNode.children : [],
            ancestors: ancestorList
        };
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

    const handlePostCreated = async (newPost: PostType) => {
        if (!user || !currentUserProfile) return;

        // Optimistic update would be nice, but refetching ensures tree structure
        const fetchThread = async () => {
            // Find root of the current view context
            const fetchId = displayRoot?.root_post_id || postId;
            const { data: newThread, error: fetchError } = await supabase.rpc('get_post_thread', { p_post_id: fetchId });
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
        };

        await fetchThread();

        // Check for @rock and call API
        if (newPost.content.includes('@rock')) {
            // Call API to generate AI reply
            fetch('/api/ai-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId: postId,
                    content: newPost.content,
                    parentId: newPost.parent_post_id
                })
            }).then(() => {
                // Refetch thread again to show the AI reply
                fetchThread();
            }).catch(err => console.error("Error triggering AI reply:", err));
        }

        setReplyingToId(null);
    };

    if (loading) return <div className="flex justify-center py-10"><Spinner /></div>;
    if (!rootPost && threadPosts.length === 0) return <div className="text-center py-10">Post not found.</div>;

    // If rootPost is missing but we have threads (e.g. viewing a comment as root), handle gracefully
    const displayRoot = rootPost || threadPosts.find(p => p.id === postId);

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="mb-4 px-4 pt-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span className="font-medium">Back</span>
                </button>
            </div>
            {ancestors.map((parent, index) => (
                <div key={parent.id} className="relative">
                    <PostComponent
                        post={parent}
                        className={`mb-0 border-b-0 rounded-b-none ${index > 0 ? 'rounded-t-none' : ''}`}
                    />
                    {/* Visual Connector Line */}
                    <div className="absolute left-[34px] top-[48px] bottom-0 w-0.5 bg-tertiary-light dark:bg-white/5 z-0" />
                </div>
            ))}
            {displayRoot && (
                <>
                    <PostComponent
                        post={displayRoot}
                        onReply={handleReply}
                        onUpdate={handleUpdate}
                        className={`mb-0 ${ancestors.length > 0 ? 'rounded-t-none' : ''}`}
                    />

                    {currentUserProfile && (
                        <div className="border-b border-tertiary-light dark:border-tertiary bg-secondary-light dark:bg-secondary mb-2 rounded-b-xl overflow-hidden">
                            <CreatePost
                                profile={currentUserProfile}
                                onPostCreated={handlePostCreated}
                                parentPostId={displayRoot.id}
                                communityId={displayRoot.community_id}
                                isPublicPost={displayRoot.is_public}
                                placeholderText="Post your reply"
                            />
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
                        onPostCreated={handlePostCreated}
                        currentUserProfile={currentUserProfile}
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
