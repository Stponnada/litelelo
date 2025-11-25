'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user } = useAuth();

    const [post, setPost] = useState<PostType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBlogPost = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // Type definitions
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
            } catch (err: unknown) {
                console.error('Error fetching blog post:', err);
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchBlogPost();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-surface-light dark:bg-surface">
                <Spinner />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-surface-light dark:bg-surface">
                <div className="text-center space-y-2">
                    <p className="text-text-secondary-light dark:text-text-secondary text-lg">Something went wrong</p>
                    <h1 className="text-2xl font-bold text-red-500">{error || 'Blog post not found'}</h1>
                </div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-text-main-light dark:bg-text-main text-surface-light dark:text-surface font-medium hover:opacity-90 transition-opacity"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <article className="min-h-screen bg-surface-light dark:bg-surface relative overflow-x-hidden selection:bg-brand-green/30 selection:text-brand-green-darker">

            {/* 1. Ambient Background Glow (Removes the 'boring' flat bg) */}
            {post.image_url && (
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <Image
                        src={post.image_url}
                        alt=""
                        fill
                        className="object-cover opacity-30 dark:opacity-20 blur-[120px] scale-125 saturate-150"
                        unoptimized
                    />
                    {/* Gradient fade to ensure text readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-surface-light/80 via-surface-light/95 to-surface-light dark:from-surface/80 dark:via-surface/95 dark:to-surface" />
                </div>
            )}

            {/* Sticky Nav */}
            <nav className="sticky top-0 z-50 w-full bg-surface-light/60 dark:bg-surface/60 backdrop-blur-xl border-b border-border-light/10 dark:border-border/10">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="group flex items-center gap-2 text-text-secondary-light dark:text-text-secondary hover:text-text-main-light dark:hover:text-text-main transition-colors"
                    >
                        <div className="p-2 rounded-full bg-black/5 dark:bg-white/5 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors">
                            <ArrowLeftIcon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">Back</span>
                    </button>
                    {/* Placeholder for simple Share/Bookmark actions */}
                    <div className="flex gap-2"></div>
                </div>
            </nav>

            <main className="relative z-10 pt-12 pb-24">

                {/* 2. Title & Meta (Narrow container) */}
                <header className="max-w-3xl mx-auto px-6 text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-brand-green/10 text-brand-green text-xs font-bold uppercase tracking-wider">
                        {post.community_id ? 'Community Blog' : 'Blog Post'}
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-text-main-light dark:text-text-main tracking-tight leading-[1.1] mb-8 text-balance">
                        {post.title}
                    </h1>

                    <div className="flex items-center justify-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <Image
                                src={post.author.author_avatar_url || `https://ui-avatars.com/api/?name=${post.author.author_name}`}
                                alt={post.author.author_name || 'Author'}
                                width={32}
                                height={32}
                                className="rounded-full ring-2 ring-surface-light dark:ring-surface"
                                unoptimized
                            />
                            <span className="font-bold text-text-main-light dark:text-text-main">
                                {post.author.author_name}
                            </span>
                        </div>
                        <span className="text-text-tertiary-light dark:text-text-tertiary">•</span>
                        <span className="text-text-secondary-light dark:text-text-secondary">
                            {formatExactTimestamp(post.created_at)}
                        </span>
                    </div>
                </header>

                {/* 3. Cinematic Hero Image (Breakout container - Wider than text) */}
                {post.image_url ? (
                    <div className="max-w-5xl mx-auto px-4 md:px-6 mb-16">
                        <div className="relative aspect-[16/9] md:aspect-[21/9] w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl shadow-brand-green/10 ring-1 ring-black/5 dark:ring-white/10 group">
                            <Image
                                src={post.image_url}
                                alt={post.title || 'Cover'}
                                fill
                                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                priority
                                unoptimized
                            />
                            {/* Inner vignette for focus */}
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/5 rounded-2xl md:rounded-3xl" />
                        </div>
                    </div>
                ) : (
                    <div className="h-10"></div> /* Spacer if no image */
                )}

                {/* 4. Main Content (Narrow container for readability) */}
                <div className="max-w-3xl mx-auto px-6">
                    <div className="prose dark:prose-invert prose-lg max-w-none 
                        prose-headings:font-bold prose-headings:text-text-main-light dark:prose-headings:text-text-main
                        prose-p:text-text-secondary-light dark:prose-p:text-text-secondary prose-p:font-serif prose-p:leading-loose
                        prose-a:text-brand-green prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                        prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8
                        prose-blockquote:border-l-4 prose-blockquote:border-brand-green prose-blockquote:pl-6 prose-blockquote:italic
                    ">
                        {renderContentWithEmbeds(post.content)}
                    </div>

                    {/* Footer / Community Card */}
                    {post.community_id && (
                        <div className="mt-20 pt-10 border-t border-border-light dark:border-border">
                            <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary-light dark:text-text-tertiary mb-6">
                                Published In
                            </p>

                            <Link
                                href={`/communities/${post.community_id}`}
                                className="group block relative overflow-hidden rounded-2xl bg-surface-light-alt dark:bg-surface-alt border border-border-light dark:border-border hover:border-brand-green/50 transition-all duration-300"
                            >
                                <div className="p-6 md:p-8 flex items-center gap-6 relative z-10">
                                    <div className="w-16 h-16 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center text-3xl font-black group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                                        #
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-text-main-light dark:text-text-main group-hover:text-brand-green transition-colors mb-1">
                                            View Community
                                        </h3>
                                        <p className="text-text-secondary-light dark:text-text-secondary text-sm">
                                            Join the conversation and explore similar posts
                                        </p>
                                    </div>
                                    <ArrowLeftIcon className="w-6 h-6 rotate-180 text-text-tertiary-light dark:text-text-tertiary group-hover:text-brand-green group-hover:translate-x-1 transition-all" />
                                </div>

                                {/* Hover Gradient Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-brand-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </article>
    );
};

export default BlogPage;