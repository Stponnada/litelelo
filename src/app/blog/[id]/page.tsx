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

// Simple Heart Icon for the floating dock
const HeartIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
);

// Share Icon
const ShareIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
    </svg>
);

const BlogPage: React.FC = () => {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user } = useAuth();

    const [post, setPost] = useState<PostType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    // Scroll Progress Logic
    useEffect(() => {
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (window.scrollY / totalHeight) * 100;
            setScrollProgress(Math.min(100, Math.max(0, progress)));
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchBlogPost = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // Same RPC logic as before...
                type PostDetailsResponse = Omit<PostType, 'author'> & {
                    author_id: string;
                    author_type: 'user' | 'community';
                    author_name: string | null;
                    author_username: string | null;
                    author_avatar_url: string | null;
                    author_flair_details: { id: string; name: string; avatar_url: string | null; } | null;
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
                setLikeCount(formattedPost.like_count || 0);
                setIsLiked(formattedPost.user_vote === 'like');
            } catch (err: unknown) {
                console.error(err);
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchBlogPost();
    }, [id]);

    const handleLike = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        const newIsLiked = !isLiked;
        const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;

        setIsLiked(newIsLiked);
        setLikeCount(newLikeCount);

        try {
            if (newIsLiked) {
                await supabase.from('likes').upsert(
                    { user_id: user.id, post_id: id, like_type: 'like' },
                    { onConflict: 'user_id, post_id' }
                );
            } else {
                await supabase.from('likes').delete().match({ user_id: user.id, post_id: id });
            }
        } catch (error) {
            console.error('Failed to update like:', error);
            setIsLiked(!newIsLiked);
            setLikeCount(likeCount);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: post?.title || 'Blog Post',
                    text: post?.content?.substring(0, 100) || 'Check out this blog post!',
                    url: url,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                alert('Link copied to clipboard!');
            } catch (error) {
                console.error('Failed to copy:', error);
            }
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-surface dark:bg-black"><Spinner /></div>;
    if (error || !post) return <div className="p-10 text-center text-red-500">{error || 'Post not found'}</div>;

    return (
        <div className="min-h-screen bg-surface-light dark:bg-[#0a0a0a] text-text-main-light dark:text-[#ededed] font-sans selection:bg-brand-green/30">

            {/* --- HERO SECTION --- */}
            {/* Full viewport height cover image with title overlay */}
            <header className="relative w-full h-[85vh] md:h-[90vh] flex flex-col justify-end overflow-hidden">
                {post.image_url && (
                    <div className="absolute inset-0 z-0">
                        <Image
                            src={post.image_url}
                            alt={post.title || 'Blog cover image'}
                            fill
                            className="object-cover"
                            priority
                            unoptimized
                        />
                        {/* Complex Gradient Overlay for readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-light via-surface-light/60 to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a]/80 dark:to-transparent opacity-100" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                    </div>
                )}

                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-16 md:pb-24">
                    <div className="max-w-4xl space-y-6">
                        {/* Timestamp only - Community badge removed */}
                        <div className="flex items-center gap-3 animate-fade-in">
                            <span className="text-white/80 text-sm font-medium tracking-wide">
                                {formatExactTimestamp(post.created_at)}
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.95] tracking-tight text-balance shadow-black drop-shadow-lg">
                            {post.title}
                        </h1>
                    </div>
                </div>
            </header>

            {/* --- MAIN CONTENT LAYOUT (Split) --- */}
            <main className="max-w-7xl mx-auto px-6 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative">

                    {/* LEFT COLUMN: Sticky Author Bio (Desktop) */}
                    <aside className="lg:col-span-4 hidden lg:block">
                        <div className="sticky top-12 space-y-8 py-8 animate-fade-in">
                            <div className="flex items-center gap-4">
                                <Image
                                    src={post.author.author_avatar_url || `https://ui-avatars.com/api/?name=${post.author.author_name}`}
                                    alt="Author"
                                    width={64}
                                    height={64}
                                    className="rounded-full ring-2 ring-white/10 shadow-xl"
                                    unoptimized
                                />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary-light dark:text-neutral-500 mb-1">
                                        Written by
                                    </p>
                                    <p className="text-xl font-bold">{post.author.author_name}</p>
                                    {post.author.author_type !== 'community' && (
                                        <p className="text-sm opacity-60">@{post.author.author_username}</p>
                                    )}
                                </div>
                            </div>

                            <hr className="border-border-light dark:border-white/10 w-1/2" />

                            {/* Table of Contents / Scannable bits could go here */}
                            <div className="text-sm text-text-secondary-light dark:text-neutral-400 leading-relaxed">
                                <p>
                                    Scroll to read the full story.
                                    Join the discussion in the community forum below.
                                </p>
                            </div>
                        </div>
                    </aside>

                    {/* RIGHT COLUMN: The Content */}
                    <article className="lg:col-span-8 lg:border-l border-border-light dark:border-white/5 lg:pl-12 pt-8 lg:pt-8 min-h-[50vh]">
                        {/* Mobile Author View */}
                        <div className="lg:hidden flex items-center gap-4 mb-10 pb-8 border-b border-border-light dark:border-white/10">
                            <Image
                                src={post.author.author_avatar_url || `https://ui-avatars.com/api/?name=${post.author.author_name}`}
                                alt="Author"
                                width={48}
                                height={48}
                                className="rounded-full"
                                unoptimized
                            />
                            <div>
                                <p className="font-bold">{post.author.author_name}</p>
                                {post.author.author_type !== 'community' && (
                                    <p className="text-xs opacity-60">@{post.author.author_username}</p>
                                )}
                            </div>
                        </div>

                        {/* Drop Cap & Typography */}
                        <div className="prose dark:prose-invert prose-lg md:prose-xl max-w-none
                            prose-headings:font-bold prose-headings:tracking-tight
                            prose-p:text-text-secondary-light dark:prose-p:text-[#b3b3b3] prose-p:leading-loose prose-p:font-serif
                            prose-a:text-brand-green prose-a:no-underline hover:prose-a:underline
                            prose-blockquote:border-l-2 prose-blockquote:border-brand-green prose-blockquote:font-normal prose-blockquote:italic
                            prose-img:rounded-xl prose-img:w-full first-letter:float-left first-letter:text-7xl first-letter:font-black first-letter:mr-3 first-letter:mt-[-10px] first-letter:text-brand-green
                        ">
                            {renderContentWithEmbeds(post.content)}
                        </div>

                        {/* Community Footer Card */}
                        {post.community_id && (
                            <div className="mt-20">
                                <Link
                                    href={`/communities/${post.community_id}`}
                                    className="group block relative overflow-hidden rounded-3xl bg-black/5 dark:bg-white/5 border border-transparent hover:border-brand-green/30 transition-all"
                                >
                                    <div className="p-8 md:p-12 text-center relative z-10">
                                        <p className="text-xs font-bold uppercase tracking-widest text-brand-green mb-4">
                                            Read more in
                                        </p>
                                        <h3 className="text-3xl font-black mb-2">{post.author.author_name}</h3>

                                        <p className="text-sm opacity-60 mb-6 max-w-md mx-auto">
                                            Check out the community to discover more stories like this one.
                                        </p>
                                        <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-green text-white font-bold text-sm group-hover:bg-brand-green-dark transition-colors">
                                            Visit Community <ArrowLeftIcon className="w-4 h-4 rotate-180" />
                                        </span>
                                    </div>
                                    {/* Hover effect background */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </Link>
                            </div>
                        )}
                    </article>
                </div>
            </main>

            {/* --- FLOATING "DYNAMIC ISLAND" NAVIGATION --- */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
                <div className="flex items-center gap-1 p-2 pl-4 pr-2 rounded-full bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-2xl shadow-black/20 ring-1 ring-white/20">

                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-main-light dark:text-white transition-colors"
                        aria-label="Go Back"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>

                    <div className="w-px h-8 bg-black/10 dark:bg-white/10 mx-1"></div>

                    {/* Interaction Buttons */}
                    <button
                        onClick={handleLike}
                        className={`p-3 rounded-full transition-colors ${isLiked
                            ? 'bg-pink-500/10 text-pink-500'
                            : 'hover:bg-pink-500/10 hover:text-pink-500 text-text-secondary-light dark:text-white/60'
                            }`}
                        aria-label={isLiked ? 'Unlike' : 'Like'}
                    >
                        <HeartIcon className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handleShare}
                        className="p-3 rounded-full hover:bg-blue-500/10 hover:text-blue-500 text-text-secondary-light dark:text-white/60 transition-colors"
                        aria-label="Share"
                    >
                        <ShareIcon className="w-5 h-5" />
                    </button>

                    <div className="w-px h-8 bg-black/10 dark:bg-white/10 mx-1"></div>

                    {/* Circular Scroll Progress */}
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                            {/* Background Circle */}
                            <path
                                className="text-black/5 dark:text-white/10"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                            {/* Progress Circle */}
                            <path
                                className="text-brand-green transition-all duration-100 ease-out"
                                strokeDasharray={`${scrollProgress}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                            />
                        </svg>
                        <span className="absolute text-[10px] font-bold opacity-50 select-none">
                            {Math.round(scrollProgress)}%
                        </span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default BlogPage;