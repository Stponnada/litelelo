'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Post as PostType } from '@/types';
import Spinner from '@/components/Spinner';
import { formatExactTimestamp } from '@/utils/timeUtils';
import { renderContentWithEmbeds } from '@/utils/renderEmbeds';
import { ArrowLeftIcon } from '@/components/icons';

const BlogPage: React.FC = () => {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const { user } = useAuth();

    const [post, setPost] = useState<PostType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBlogPost = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // Type for the RPC response with flattened author fields
                type PostDetailsResponse = Omit<PostType, 'author'> & {
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
                };

                const { data, error } = await supabase
                    .rpc('get_post_details_by_id', { p_post_id: id })
                    .single<PostDetailsResponse>();

                if (error) throw error;
                if (!data) throw new Error('Blog post not found');

                // Format the data to match PostType
                const formattedPost: PostType = {
                    ...data,
                    author: {
                        author_id: data.author_id,
                        author_type: data.author_type,
                        author_name: data.author_name,
                        author_username: data.author_username,
                        author_avatar_url: data.author_avatar_url,
                        author_flair_details: data.author_flair_details
                    }
                };

                setPost(formattedPost);
            } catch (err: any) {
                console.error('Error fetching blog post:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogPost();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner />
            </div>
        );
    }


    if (error || !post) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-500 text-lg font-semibold">
                    {error || 'Blog post not found'}
                </p>
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-secondary-light dark:bg-secondary rounded-lg hover:bg-tertiary-light dark:hover:bg-tertiary transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-light dark:bg-surface">
            {/* Hero / Cover Image */}
            <div className="relative w-full h-[40vh] md:h-[50vh] bg-black/10 dark:bg-black/30">
                {post.image_url ? (
                    <>
                        <img
                            src={post.image_url}
                            alt={post.title || 'Cover'}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-light dark:from-surface via-transparent to-black/30"></div>
                    </>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-green/20 to-secondary-light dark:to-secondary flex items-center justify-center">
                        <span className="text-6xl opacity-10 font-black uppercase tracking-widest">Blog</span>
                    </div>
                )}

                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="absolute top-6 left-6 p-3 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-colors z-10"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Content Container */}
            <div className="max-w-3xl mx-auto px-6 -mt-20 relative z-10 pb-20">
                <div className="bg-surface-light dark:bg-surface rounded-t-3xl p-8 md:p-12 shadow-xl border-t border-x border-border-light dark:border-border min-h-[50vh]">

                    {/* Header Info */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 text-brand-green text-xs font-bold uppercase tracking-wider mb-4">
                            Community Blog
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-text-main-light dark:text-text-main mb-6 leading-tight">
                            {post.title}
                        </h1>

                        <div className="flex items-center justify-center gap-4 text-sm text-text-secondary-light dark:text-text-secondary">
                            <div className="flex items-center gap-2">
                                <img
                                    src={post.author.author_avatar_url || `https://ui-avatars.com/api/?name=${post.author.author_name}`}
                                    alt={post.author.author_name || 'Author'}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-surface-light dark:border-surface"
                                />
                                <div className="text-left">
                                    <p className="font-bold text-text-main-light dark:text-text-main">
                                        {post.author.author_name}
                                    </p>
                                    <p className="text-xs opacity-70">
                                        @{post.author.author_username}
                                    </p>
                                </div>
                            </div>
                            <span className="w-1 h-1 rounded-full bg-text-tertiary-light dark:bg-text-tertiary"></span>
                            <span>{formatExactTimestamp(post.created_at)}</span>
                        </div>
                    </div>

                    {/* Divider */}
                    <hr className="border-border-light dark:border-border mb-8" />

                    {/* Body Content */}
                    <div className="prose dark:prose-invert max-w-none prose-lg prose-headings:font-bold prose-a:text-brand-green hover:prose-a:text-brand-green-darker prose-img:rounded-xl">
                        <div className="text-text-main-light dark:text-text-main leading-relaxed whitespace-pre-wrap font-serif text-lg">
                            {renderContentWithEmbeds(post.content)}
                        </div>
                    </div>

                    {/* Footer / Community Link */}
                    {post.community_id && (
                        <div className="mt-16 pt-8 border-t border-border-light dark:border-border">
                            <p className="text-center text-text-secondary-light dark:text-text-secondary mb-4">
                                Published in
                            </p>
                            <Link
                                href={`/communities/${post.community_id}`}
                                className="block bg-secondary-light dark:bg-secondary p-6 rounded-2xl hover:bg-tertiary-light dark:hover:bg-tertiary transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-brand-green/20 flex items-center justify-center text-brand-green font-bold text-xl group-hover:scale-110 transition-transform">
                                        #
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-text-main-light dark:text-text-main group-hover:text-brand-green transition-colors">
                                            View Community
                                        </h3>
                                        <p className="text-sm text-text-secondary-light dark:text-text-secondary">
                                            See more posts and discussions
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlogPage;
