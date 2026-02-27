'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import { Post as PostType, Poll } from '@/types';
import Post from '@/components/Post';
import Spinner from '@/components/Spinner';
import { ArrowLeftIcon, XCircleIcon, ImageIcon } from '@/components/icons';
import { getResizedAvatarUrl } from '@/utils/imageUtils';

// Confession-specific icons
const MaskIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
);

const EyeSlashIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
);

interface Confession extends Omit<PostType, 'author'> {
    is_anonymous: boolean;
    is_own_post: boolean;
    author: PostType['author'] & { is_anonymous?: boolean };
}

// Transform confession data to Post format
const transformConfessionToPost = (confession: any): PostType => {
    return {
        ...confession,
        author: {
            author_id: confession.author_id || confession.user_id,
            author_type: confession.author_type || 'user',
            author_name: confession.is_own_post ? confession.author_name : 'Anonymous',
            author_username: confession.is_own_post ? confession.author_username : 'anonymous',
            author_avatar_url: confession.is_own_post ? confession.author_avatar_url : null,
            author_flair_details: confession.is_own_post ? confession.author_flair_details : null,
        },
        original_poster_username: null,
        quoted_post: null,
        reposted_by: null,
        title: undefined,
    };
};

const ConfessionsPage: React.FC = () => {
    const { user, profile } = useAuth();
    const [confessions, setConfessions] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Create confession form state
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const imageInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const CONFESSIONS_PER_PAGE = 10;

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [content]);

    const fetchConfessions = useCallback(async (offset: number = 0) => {
        if (!user?.id) return;

        try {
            const { data, error: fetchError } = await supabase.rpc('get_confessions_feed', {
                p_campus: profile?.campus || null,
                p_limit: CONFESSIONS_PER_PAGE,
                p_offset: offset,
            });

            if (fetchError) throw fetchError;

            const transformedConfessions = (data || []).map(transformConfessionToPost);

            if (offset === 0) {
                setConfessions(transformedConfessions);
            } else {
                setConfessions(prev => {
                    const existingIds = new Set(prev.map(c => c.id));
                    const newConfessions = transformedConfessions.filter((c: PostType) => !existingIds.has(c.id));
                    return [...prev, ...newConfessions];
                });
            }

            setHasMore(transformedConfessions.length === CONFESSIONS_PER_PAGE);
        } catch (err: unknown) {
            console.error('Error fetching confessions:', err);
            setError((err as Error).message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [user?.id, profile?.campus]);

    // Initial fetch
    useEffect(() => {
        fetchConfessions(0);
    }, [fetchConfessions]);

    // Infinite scroll
    useEffect(() => {
        if (!loadMoreRef.current) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    setLoadingMore(true);
                    fetchConfessions(confessions.length);
                }
            },
            { threshold: 0.5 }
        );

        observerRef.current.observe(loadMoreRef.current);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasMore, loadingMore, loading, confessions.length, fetchConfessions]);

    // Image handling
    const processFile = (file: File) => {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    // Submit confession
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !imageFile) {
            setSubmitError('Your confession cannot be empty.');
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');

        try {
            let imageUrl: string | null = null;
            if (imageFile && profile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `anonymous_${Date.now()}.${fileExt}`;
                const filePath = `confessions/${fileName}`;
                const { error: uploadError } = await supabase.storage.from('post-images').upload(filePath, imageFile);
                if (uploadError) throw uploadError;
                imageUrl = supabase.storage.from('post-images').getPublicUrl(filePath).data.publicUrl;
            }

            const { data, error: rpcError } = await supabase
                .rpc('create_anonymous_post', {
                    p_content: content.trim(),
                    p_image_url: imageUrl,
                    p_campus: profile?.campus || null,
                })
                .single();

            if (rpcError) throw rpcError;
            if (!data) throw new Error("No data returned from confession creation");

            // Transform and add to list
            const newConfession = transformConfessionToPost({
                ...(data as any),
                is_own_post: true,
            });

            setConfessions(prev => [newConfession, ...prev]);
            setContent('');
            handleRemoveImage();

        } catch (err: unknown) {
            console.error('Error creating confession:', err);
            setSubmitError((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Update post in state
    const updatePostInState = (updatedPost: Partial<PostType> & { id: string }) => {
        setConfessions(prev =>
            prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p)
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
            {/* Ambient Glow Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-purple-500/20 dark:bg-purple-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-pink-500/20 dark:bg-pink-600/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/campus"
                        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors mb-4"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to Campus
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
                            <EyeSlashIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
                                Confessions
                            </h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                Share anonymously. Your identity is protected.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Create Confession Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 mb-8 overflow-hidden"
                >
                    {/* Anonymous Badge */}
                    <div className="px-5 pt-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-md">
                                <MaskIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                    Posting as Anonymous
                                </span>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Your identity will be hidden
                                </p>
                            </div>
                            <div className="ml-auto">
                                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-full flex items-center gap-1">
                                    <SparklesIcon className="w-3 h-3" />
                                    Protected
                                </span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="p-5">
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What's on your mind? Share it anonymously..."
                                className="w-full bg-transparent text-lg text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 resize-none focus:outline-none min-h-[100px]"
                                rows={3}
                            />

                            {/* Image Preview */}
                            {imagePreview && (
                                <div className="mt-4 relative group inline-block">
                                    <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="max-h-60 w-auto object-contain"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-all"
                                    >
                                        <XCircleIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {submitError && (
                            <div className="mx-5 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl">
                                <p className="text-red-600 dark:text-red-400 text-sm font-medium">{submitError}</p>
                            </div>
                        )}

                        <div className="px-5 pb-5 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => imageInputRef.current?.click()}
                                    className={`p-2.5 rounded-xl transition-all ${imageFile
                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                        }`}
                                    title="Add Image"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                </button>
                                <input
                                    type="file"
                                    ref={imageInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    hidden
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || (!content.trim() && !imageFile)}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold py-2.5 px-6 rounded-xl shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100 flex items-center gap-2"
                            >
                                {isSubmitting && <Spinner className="w-4 h-4 text-white" />}
                                {isSubmitting ? 'Confessing...' : 'Confess'}
                            </button>
                        </div>
                    </form>
                </motion.div>

                {/* Confessions Feed */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Spinner className="w-8 h-8 text-purple-500" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-500 font-medium">{error}</p>
                            <button
                                onClick={() => fetchConfessions(0)}
                                className="mt-4 text-purple-500 hover:text-purple-600 font-medium"
                            >
                                Try again
                            </button>
                        </div>
                    ) : confessions.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                                <EyeSlashIcon className="w-8 h-8 text-purple-500" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                                No confessions yet
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                                Be the first to share something anonymously. Your identity is always protected.
                            </p>
                        </motion.div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {confessions.map((confession, index) => (
                                <motion.div
                                    key={confession.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Post
                                        post={confession}
                                        onUpdate={updatePostInState}
                                        isAnonymous={true}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}

                    {/* Load more trigger */}
                    <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
                        {loadingMore && <Spinner className="w-6 h-6 text-purple-500" />}
                    </div>

                    {!hasMore && confessions.length > 0 && (
                        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500 py-4">
                            You&apos;ve reached the end
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConfessionsPage;
