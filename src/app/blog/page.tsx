'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import { Post as PostType } from '@/types';
import Spinner from '@/components/Spinner';
import BlogPreviewCard from '@/components/BlogPreviewCard';
import {
    BookOpenIcon,
    FireIcon,
    StarIcon,
    PlusIcon,
    SearchIcon
} from '@/components/icons';
import CreateBlogModal from '@/components/CreateBlogModal';

// --- Header Component ---
const BlogHeader = () => (
    <div className="relative py-12 md:py-16 px-6 overflow-hidden border-b border-zinc-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="max-w-2xl">
                    <h1 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight mb-4">
                        Read, Write, and Inspire.
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg font-medium">
                        Discover perspectives from across BITS Hyderabad.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="w-full md:w-80 relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <SearchIcon className="w-4 h-4 text-zinc-400 group-focus-within:text-brand-green transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search stories..."
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-100 dark:bg-white/5 border border-transparent focus:bg-white dark:focus:bg-black focus:border-brand-green/30 focus:ring-4 focus:ring-brand-green/10 transition-all font-medium text-sm"
                    />
                </div>
            </div>
        </div>
    </div>
);

// --- Section Header ---
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
    <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-brand-green">
            {icon}
        </div>
        <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">
            {title}
        </h2>
    </div>
);

const BlogIndexPage: React.FC = () => {
    const { user } = useAuth();
    const [featuredBlogs, setFeaturedBlogs] = useState<PostType[]>([]);
    const [recentBlogs, setRecentBlogs] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        const fetchBlogs = async () => {
            setLoading(true);
            try {
                // Fetch Featured Blogs (Sort by likes)
                const { data: featuredData } = await supabase
                    .from('posts')
                    .select('*, author:profiles!user_id(*)')
                    .eq('post_type', 'blog')
                    .not('title', 'is', null)
                    .order('like_count', { ascending: false })
                    .limit(3);

                if (featuredData) setFeaturedBlogs(featuredData as PostType[]);

                // Fetch Recent Blogs
                const { data: recentData } = await supabase
                    .from('posts')
                    .select('*, author:profiles!user_id(*)')
                    .eq('post_type', 'blog')
                    .not('title', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(12);

                if (recentData) setRecentBlogs(recentData as PostType[]);

            } catch (err) {
                console.error("Error fetching blogs:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black"><Spinner /></div>;

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <BlogHeader />

            <main className="max-w-7xl mx-auto px-6 py-16">

                {/* --- FEATURED SECTION --- */}
                {featuredBlogs.length > 0 && (
                    <section className="mb-20">
                        <SectionHeader icon={<FireIcon className="w-6 h-6" />} title="Trending Stories" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {featuredBlogs.map(blog => (
                                <BlogPreviewCard key={blog.id} post={blog} />
                            ))}
                        </div>
                    </section>
                )}

                {/* --- ALL STORIES / RECENT --- */}
                <section>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <SectionHeader icon={<BookOpenIcon className="w-6 h-6" />} title="Latest Updates" />

                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-green text-white font-bold hover:bg-brand-green-dark transition-all shadow-lg shadow-brand-green/20 hover:-translate-y-0.5"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Write a Story
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentBlogs.map(blog => (
                            <BlogPreviewCard key={blog.id} post={blog} />
                        ))}
                    </div>

                    {recentBlogs.length === 0 && (
                        <div className="text-center py-24 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                            <BookOpenIcon className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-zinc-500">No stories yet.</h3>
                            <p className="text-zinc-400 mt-2">Be the first to share something with the campus!</p>
                        </div>
                    )}
                </section>
            </main>

            {/* Create Blog Modal */}
            {/* Note: In this generic view, we might need a version of the modal that 
                lets you pick a community, or we just use a default one for now. 
                Since's current CreateBlogModal requires communityId, let's see how to handle this.
            */}
            {isCreateModalOpen && (
                <CreateBlogModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    communityId="" // Hack: We might need to adjust the modal or RPC to handle "personal" blogs
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        // Refetch would be nice here
                    }}
                />
            )}
        </div>
    );
};

export default BlogIndexPage;
