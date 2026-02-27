'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/services/supabase';
import { SearchResults as SearchResultsType, UserSearchResult, PostSearchResult, CommunitySearchResult, ListingSearchResult, EventSearchResult } from '@/types';
import Spinner from '@/components/Spinner';
import Skeleton from '@/components/Skeleton';
import { format } from 'date-fns';
import Image from 'next/image';
import { getResizedAvatarUrl } from '@/utils/imageUtils';

import { NewspaperIcon, BookOpenIcon, StarIcon, CalendarIcon, UserGroupIcon, SearchIcon, ArrowRightIcon } from '@/components/icons';

// --- Reusable Result Card Components ---

const UserResultCard: React.FC<{ user: UserSearchResult }> = ({ user }) => (
    <Link href={`/profile/${user.username}`} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-tertiary-light/60 dark:hover:bg-tertiary transition-colors">
        <Image
            src={getResizedAvatarUrl(user.avatar_url, 48, 48, user.full_name)}
            alt={user.username}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover"
            unoptimized
        />
        <div>
            <p className="font-semibold text-text-main-light dark:text-text-main">{user.full_name}</p>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary">@{user.username}</p>
        </div>
    </Link>
);

const PostResultCard: React.FC<{ post: PostSearchResult }> = ({ post }) => (
    <Link href={`/post/${post.id}`} className="block p-3 rounded-lg hover:bg-tertiary-light/60 dark:hover:bg-tertiary transition-colors">
        <p className="text-text-secondary-light dark:text-text-secondary truncate italic">&quot;{post.content}&quot;</p>
        <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-1">by {post.author_full_name}</p>
    </Link>
);

const CommunityResultCard: React.FC<{ community: CommunitySearchResult }> = ({ community }) => (
    <Link href={`/communities/${community.id}`} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-tertiary-light/60 dark:hover:bg-tertiary transition-colors">
        <Image
            src={getResizedAvatarUrl(community.avatar_url, 48, 48, community.name)}
            alt={community.name}
            width={48}
            height={48}
            className="w-12 h-12 rounded-lg object-cover"
            unoptimized
        />
        <div>
            <p className="font-semibold text-text-main-light dark:text-text-main">{community.name}</p>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary">{community.member_count} members</p>
        </div>
    </Link>
);

const ListingResultCard: React.FC<{ listing: ListingSearchResult }> = ({ listing }) => (
    <Link href={`/campus/marketplace?selectedListingId=${listing.id}`} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-tertiary-light/60 dark:hover:bg-tertiary transition-colors">
        <img src={listing.primary_image_url || 'https://placehold.co/100x100'} alt={listing.title} className="w-12 h-12 rounded-lg object-cover" />
        <div>
            <p className="font-semibold text-text-main-light dark:text-text-main">{listing.title}</p>
            <p className="text-sm font-bold text-brand-green">₹{listing.price.toLocaleString()}</p>
        </div>
    </Link>
);

const EventResultCard: React.FC<{ event: EventSearchResult }> = ({ event }) => (
    <Link href={`/campus/events/${event.id}`} className="block p-3 rounded-lg hover:bg-tertiary-light/60 dark:hover:bg-tertiary transition-colors">
        <p className="font-semibold text-text-main-light dark:text-text-main">{event.name}</p>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary">{format(new Date(event.start_time), 'PPp')}</p>
    </Link>
);

const TabButton: React.FC<{ label: string, count: number, isActive: boolean, onClick: () => void }> = ({ label, count, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${isActive ? 'bg-brand-green text-black' : 'text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light/50 dark:hover:bg-tertiary/50'}`}
    >
        {label}
        <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-black/20' : 'bg-tertiary-light dark:bg-tertiary'}`}>{count}</span>
    </button>
);


const SearchPage: React.FC = () => {
    const searchParams = useSearchParams();
    const initialQuery = searchParams?.get('q') || '';

    const [searchTerm, setSearchTerm] = useState(initialQuery);
    const [results, setResults] = useState<SearchResultsType | null>(null);
    const [loading, setLoading] = useState(!!initialQuery);
    const [activeTab, setActiveTab] = useState('all');
    const [topUsers, setTopUsers] = useState<any[]>([]);
    const [topCommunities, setTopCommunities] = useState<any[]>([]);
    const [trendingPosts, setTrendingPosts] = useState<PostSearchResult[]>([]);
    const [trendingBlogs, setTrendingBlogs] = useState<any[]>([]);

    useEffect(() => {
        const fetchDiscover = async () => {
            try {
                // 1. Fetch Top Users & Communities using unified directory
                const { data: directoryData } = await supabase.rpc('get_unified_directory');
                if (directoryData) {
                    const users = (directoryData as any[])
                        .filter(item => item.type === 'user')
                        .sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0))
                        .slice(0, 5);
                    setTopUsers(users);

                    const communities = (directoryData as any[])
                        .filter(item => item.type === 'community')
                        .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
                        .slice(0, 5);
                    setTopCommunities(communities);
                }

                // 2. Fetch Featured Blogs (must have post_type 'blog' and a title)
                const { data: blogs } = await supabase
                    .from('posts')
                    .select('id, title, content, author:profiles!user_id(full_name, username, avatar_url)')
                    .eq('post_type', 'blog')
                    .not('title', 'is', null)
                    .order('like_count', { ascending: false })
                    .limit(4);

                if (blogs) {
                    setTrendingBlogs(blogs.map(b => ({
                        id: b.id,
                        content: b.content,
                        author_full_name: (b.author as any)?.full_name || 'Anonymous',
                        author_username: (b.author as any)?.username || 'anonymous',
                        title: b.title
                    })));
                }

                // 3. Fetch Recent Posts
                const { data: posts } = await supabase
                    .from('posts')
                    .select('id, content, author:profiles!user_id(full_name, username, avatar_url)')
                    .eq('post_type', 'text')
                    .eq('is_deleted', false)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (posts) {
                    setTrendingPosts(posts.map(p => ({
                        id: p.id,
                        content: p.content,
                        author_full_name: (p.author as any)?.full_name || 'Anonymous',
                        author_username: (p.author as any)?.username || 'anonymous'
                    })));
                }
            } catch (err) {
                console.error("Failed to fetch discovery content:", err);
            }
        };
        fetchDiscover();
    }, []);

    useEffect(() => {
        const performSearch = async () => {
            if (searchTerm.trim().length < 2) {
                setResults(null);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const { data, error } = await supabase.rpc('search_all', { search_term: searchTerm.trim() });
                if (error) throw error;
                setResults(data);
                setActiveTab('all'); // Reset to 'all' tab on new search
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            performSearch();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    const resultCounts = useMemo(() => ({
        users: results?.users?.length || 0,
        posts: results?.posts?.length || 0,
        communities: results?.communities?.length || 0,
        listings: results?.listings?.length || 0,
        events: results?.events?.length || 0,
    }), [results]);

    const totalResults = Object.values(resultCounts).reduce((sum, count) => sum + count, 0);

    const renderResults = () => {
        if (loading) return (
            <div className="p-4 space-y-3">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
            </div>
        );
        if (!results || totalResults === 0) {
            if (searchTerm.trim().length === 0) {
                return (
                    <div className="p-6 space-y-10">
                        {/* Featured Blogs */}
                        <div>
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                                <BookOpenIcon className="w-6 h-6 text-brand-green" />
                                Featured Stories
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {trendingBlogs.length > 0 ? trendingBlogs.map(blog => (
                                    <Link key={blog.id} href={`/blog/${blog.id}`} className="group p-4 rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:border-brand-green transition-all shadow-sm">
                                        <h4 className="font-bold text-lg mb-2 group-hover:text-brand-green line-clamp-1">{blog.title}</h4>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">{blog.content}</p>
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                            <span>BY {blog.author_full_name}</span>
                                        </div>
                                    </Link>
                                )) : (
                                    <div className="col-span-full p-12 text-center border-2 border-dashed border-zinc-200 dark:border-white/5 rounded-2xl text-zinc-400 text-sm italic">
                                        No featured stories yet. Why not write one?
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Users */}
                        <div className="max-w-2xl">
                            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                                <StarIcon className="w-5 h-5 text-amber-500" />
                                Top Voices
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {topUsers.map(user => (
                                    <Link key={user.id} href={`/profile/${user.username}`} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all">
                                        <Image
                                            src={getResizedAvatarUrl(user.avatar_url, 40, 40, user.name)}
                                            alt={user.name} width={40} height={40}
                                            className="w-10 h-10 rounded-full object-cover"
                                            unoptimized
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate">{user.name}</p>
                                            <p className="text-xs text-zinc-500 truncate">@{user.username}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-brand-green">{user.follower_count || 0}</p>
                                            <p className="text-[8px] uppercase tracking-tighter text-zinc-400">Followers</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Recent Updates */}
                        <div>
                            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                                <NewspaperIcon className="w-5 h-5 text-violet-500" />
                                Recent Shouts
                            </h3>
                            <div className="space-y-3">
                                {trendingPosts.map(post => (
                                    <PostResultCard key={post.id} post={post} />
                                ))}
                            </div>
                        </div>
                    </div>
                );
            }
            return (
                <div className="text-center py-16">
                    <p className="text-text-tertiary-light dark:text-text-tertiary">
                        No results found for &quot;{searchTerm}&quot;
                    </p>
                </div>
            );
        }

        const sections = [
            { key: 'users', title: 'Users', data: results.users || [], component: UserResultCard, propName: 'user' },
            { key: 'communities', title: 'Communities', data: results.communities || [], component: CommunityResultCard, propName: 'community' },
            { key: 'listings', title: 'Marketplace', data: results.listings || [], component: ListingResultCard, propName: 'listing' },
            { key: 'events', title: 'Events', data: results.events || [], component: EventResultCard, propName: 'event' },
            { key: 'posts', title: 'Posts & Comments', data: results.posts || [], component: PostResultCard, propName: 'post' },
        ];

        return (
            <>
                <div className="flex flex-wrap gap-2 p-4 border-b border-tertiary-light dark:border-tertiary">
                    <TabButton label="All" count={totalResults} isActive={activeTab === 'all'} onClick={() => setActiveTab('all')} />
                    {sections.filter(s => s.data.length > 0).map(s => (
                        <TabButton key={s.key} label={s.title} count={s.data.length} isActive={activeTab === s.key} onClick={() => setActiveTab(s.key)} />
                    ))}
                </div>

                <div className="divide-y divide-tertiary-light/50 dark:divide-tertiary/50">
                    {sections.map(({ key, title, data }) => {
                        if ((activeTab === 'all' || activeTab === key) && data.length > 0) {
                            return (
                                <div key={key} className="p-4">
                                    {activeTab === 'all' && <h3 className="font-bold mb-2 text-text-main-light dark:text-text-main">{title}</h3>}
                                    <div className="space-y-1">
                                        {key === 'users' && (data as UserSearchResult[]).map(item => (
                                            <UserResultCard key={item.username} user={item} />
                                        ))}
                                        {key === 'posts' && (data as PostSearchResult[]).map(item => (
                                            <PostResultCard key={item.id} post={item} />
                                        ))}
                                        {key === 'communities' && (data as CommunitySearchResult[]).map(item => (
                                            <CommunityResultCard key={item.id} community={item} />
                                        ))}
                                        {key === 'listings' && (data as ListingSearchResult[]).map(item => (
                                            <ListingResultCard key={item.id} listing={item} />
                                        ))}
                                        {key === 'events' && (data as EventSearchResult[]).map(item => (
                                            <EventResultCard key={item.id} event={item} />
                                        ))}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            </>
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-4 text-text-main-light dark:text-text-main">Search</h1>
            <div className="relative mb-4">
                <input
                    type="text"
                    placeholder="Search for anything..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-secondary-light dark:bg-secondary border border-tertiary-light dark:border-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                    autoFocus
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            <div className="bg-secondary-light dark:bg-secondary rounded-lg border border-tertiary-light dark:border-tertiary">
                {renderResults()}
            </div>
        </div>
    );
};

export default SearchPage;
