'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';
import CreateCommunityModal from '@/components/CreateCommunityModal';
import { UserGroupIcon, PlusIcon } from '@/components/icons';

interface CommunityListItem {
    id: string;
    name: string;
    description: string;
    avatar_url: string | null;
    member_count: number;
    is_member: boolean;
    last_visited_at: string | null;
    is_pinned: boolean;
}

const CommunityCard: React.FC<{ community: CommunityListItem, index: number, onTogglePin?: (communityId: string) => void, showPinButton?: boolean }> = ({ community, index, onTogglePin, showPinButton = false }) => {
    const handlePinClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onTogglePin) {
            onTogglePin(community.id);
        }
    };

    return (
        <Link
            href={`/communities/${community.id}`}
            className="relative group animate-in fade-in slide-in-from-bottom-4 block"
            style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}
        >
            {/* Animated gradient background */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-green/20 via-brand-green/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative bg-white/60 dark:bg-secondary/60 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-black/20 transition-all duration-300 group-hover:-translate-y-1 h-full flex flex-col">
                {/* Pin button - only show for members */}
                {showPinButton && onTogglePin && (
                    <button
                        onClick={handlePinClick}
                        className={`absolute top-3 right-3 z-10 p-2 rounded-lg transition-all ${community.is_pinned
                            ? 'bg-brand-green text-black shadow-lg'
                            : 'bg-white/80 dark:bg-secondary/80 text-text-secondary-light dark:text-text-secondary hover:bg-brand-green/20 dark:hover:bg-brand-green/20'
                            }`}
                        title={community.is_pinned ? 'Unpin community' : 'Pin community'}
                    >
                        <svg className="w-4 h-4" fill={community.is_pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </button>
                )}

                {/* Top section with avatar and info */}
                <div className="p-4 sm:p-8 flex-1">
                    <div className="flex items-start gap-3 sm:gap-6 mb-4 sm:mb-5">
                        {/* Avatar with glow effect */}
                        <div className="relative flex-shrink-0">
                            <div className="absolute inset-0 bg-brand-green/30 blur-2xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <Image
                                src={community.avatar_url || `https://ui-avatars.com/api/?name=${community.name}&background=random&color=000`}
                                alt={community.name}
                                width={80}
                                height={80}
                                className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl object-cover ring-1 ring-black/5 dark:ring-white/10 shadow-lg"
                                unoptimized
                            />
                        </div>

                        {/* Community info */}
                        <div className="flex-1 min-w-0 pt-0 sm:pt-1">
                            <h3 className="text-lg sm:text-2xl font-bold text-text-main-light dark:text-text-main group-hover:text-brand-green transition-colors leading-tight mb-2 sm:mb-3">
                                {community.name}
                            </h3>
                            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                <UserGroupIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-green" />
                                <span className="text-xs sm:text-sm font-semibold text-text-main-light dark:text-text-main">{community.member_count}</span>
                                <span className="text-xs sm:text-sm text-text-tertiary-light dark:text-text-tertiary">{community.member_count === 1 ? 'member' : 'members'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary line-clamp-3 leading-relaxed">
                        {community.description || 'No description provided.'}
                    </p>
                </div>

                {/* Bottom accent line */}
                <div className="h-1 bg-gradient-to-r from-brand-green/50 via-brand-green/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
            </div>
        </Link>
    );
};


const CommunitiesListPage: React.FC = () => {
    const { profile } = useAuth();
    const [communities, setCommunities] = useState<CommunityListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'discover' | 'my'>('my');


    useEffect(() => {
        if (!profile?.campus) return;

        const fetchCommunities = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: rpcError } = await supabase.rpc('get_communities_list', { p_campus: profile.campus });
                if (rpcError) throw rpcError;
                setCommunities(data as CommunityListItem[] || []);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCommunities();

        // Refetch when page becomes visible (e.g., when navigating back)
        const handleVisibilityChange = () => {
            if (!document.hidden && profile?.campus) {
                fetchCommunities();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [profile?.campus]);

    // handleJoinToggle removed as it is no longer used in the list view

    const handleTogglePin = async (communityId: string) => {
        try {
            const { data, error } = await supabase.rpc('toggle_community_pin', { p_community_id: communityId });
            if (error) throw error;

            // Update local state
            setCommunities(prev => prev.map(c =>
                c.id === communityId ? { ...c, is_pinned: data as boolean } : c
            ));
        } catch (err) {
            console.error('Failed to toggle pin:', err);
        }
    };

    const handleCommunityCreated = (newCommunity: any) => {
        // Convert CommunityDetails to CommunityListItem and add last_visited_at
        const communityListItem: CommunityListItem = {
            id: newCommunity.id,
            name: newCommunity.name,
            description: newCommunity.description,
            avatar_url: newCommunity.avatar_url,
            member_count: newCommunity.member_count || 1,
            is_member: true,
            last_visited_at: new Date().toISOString(),
            is_pinned: false
        };
        setCommunities(prev => [communityListItem, ...prev]);
        setCreateModalOpen(false);
        setActiveTab('my');
    }

    const { pinnedCommunities, recentCommunities, otherCommunities } = useMemo(() => {
        const listToFilter = activeTab === 'my'
            ? communities.filter(c => c.is_member)
            : communities.filter(c => !c.is_member);

        let filtered = listToFilter;
        if (searchTerm.trim()) {
            filtered = listToFilter.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        // For "My Communities" tab, separate pinned, recent (last 5 visited), and others
        if (activeTab === 'my') {
            const pinned = filtered.filter(c => c.is_pinned);
            const unpinned = filtered.filter(c => !c.is_pinned);

            const sortedUnpinned = [...unpinned].sort((a, b) => {
                const dateA = a.last_visited_at ? new Date(a.last_visited_at).getTime() : 0;
                const dateB = b.last_visited_at ? new Date(b.last_visited_at).getTime() : 0;
                return dateB - dateA;
            });

            const recent = sortedUnpinned.slice(0, 5);
            const others = sortedUnpinned.slice(5);

            return { pinnedCommunities: pinned, recentCommunities: recent, otherCommunities: others };
        }

        return { pinnedCommunities: [], recentCommunities: [], otherCommunities: filtered };
    }, [communities, searchTerm, activeTab]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
                <Spinner />
                <p className="text-text-secondary-light dark:text-text-secondary animate-pulse">Loading communities...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto mt-6 sm:mt-12 px-4">
                <div className="relative overflow-hidden bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-2xl sm:rounded-3xl p-5 sm:p-8 backdrop-blur-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative flex items-start gap-3 sm:gap-4">
                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-red-500/20 flex items-center justify-center ring-1 ring-red-500/20">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-red-400 font-bold text-base sm:text-lg mb-1 sm:mb-2">Unable to load communities</p>
                            <p className="text-red-300/70 text-xs sm:text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen">
            {/* Ambient background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-4 sm:py-12">
                {isCreateModalOpen && profile?.campus && (
                    <CreateCommunityModal
                        campus={profile.campus}
                        onClose={() => setCreateModalOpen(false)}
                        onCommunityCreated={handleCommunityCreated}
                    />
                )}

                {/* Hero Section */}
                <div className="mb-4 sm:mb-16">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-3 sm:gap-8 mb-4 sm:mb-10">
                        <div className="flex-1">
                            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-text-main-light dark:text-text-main mb-2 sm:mb-4 tracking-tight leading-none flex flex-wrap items-center gap-2 sm:gap-4">
                                <span>Find Your</span>
                                <div className="relative">
                                    <div className="absolute inset-0 bg-brand-green/30 blur-2xl rounded-full"></div>
                                    <UserGroupIcon className="relative w-10 h-10 sm:w-16 lg:w-20 sm:h-16 lg:h-20 text-brand-green" />
                                </div>
                                <br className="w-full" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-brand-green/60">Community</span>
                            </h1>
                            <p className="hidden sm:block text-sm sm:text-xl text-text-secondary-light dark:text-text-secondary max-w-2xl">
                                Connect with <span className="font-bold text-brand-green">{communities.length}</span> vibrant communities on your campus
                            </p>
                        </div>
                        {/* Desktop Create Button - hidden on mobile */}
                        <button
                            onClick={() => setCreateModalOpen(true)}
                            className="hidden lg:block group relative overflow-hidden bg-brand-green hover:bg-brand-green/90 text-black font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl transition-all shadow-2xl shadow-brand-green/25 hover:shadow-brand-green/40 hover:scale-105"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            <span className="relative flex items-center justify-center gap-2">
                                <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" />
                                Create Community
                            </span>
                        </button>
                    </div>

                    {/* Search Bar and Tabs Row */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                        {/* Search Bar */}
                        <div className="relative w-full sm:flex-1 max-w-2xl">
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-green/5 to-transparent rounded-xl sm:rounded-2xl blur-2xl"></div>
                            <div className="relative flex items-center">
                                <svg className="absolute left-3 sm:left-6 w-4 h-4 sm:w-5 sm:h-5 text-text-tertiary-light dark:text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search communities..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 sm:pl-14 pr-4 sm:pr-6 py-2.5 sm:py-5 bg-white/60 dark:bg-secondary/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green/30 transition-all shadow-xl shadow-black/5 dark:shadow-black/20 placeholder:text-text-tertiary-light/60 dark:placeholder:text-text-tertiary/60 text-sm sm:text-lg"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 sm:right-6 w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-all"
                                    >
                                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Tabs - Next to search on desktop, below on mobile */}
                        <div className="inline-flex bg-secondary-light dark:bg-secondary rounded-full p-2 border border-tertiary-light/50 dark:border-tertiary/50 shrink-0">
                            <button
                                onClick={() => setActiveTab('discover')}
                                className={`px-8 py-4 rounded-full font-semibold text-sm transition-all duration-200 ${activeTab === 'discover'
                                    ? 'bg-brand-green text-black shadow-md'
                                    : 'text-text-secondary-light dark:text-text-secondary hover:text-text-main-light dark:hover:text-text-main'
                                    }`}
                            >
                                Discover
                            </button>
                            <button
                                onClick={() => setActiveTab('my')}
                                className={`px-8 py-4 rounded-full font-semibold text-sm transition-all duration-200 ${activeTab === 'my'
                                    ? 'bg-brand-green text-black shadow-md'
                                    : 'text-text-secondary-light dark:text-text-secondary hover:text-text-main-light dark:hover:text-text-main'
                                    }`}
                            >
                                My Communities
                            </button>
                        </div>
                    </div>
                </div>

                {/* Floating Create Button - Mobile Only */}
                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="lg:hidden fixed bottom-20 right-4 z-50 w-14 h-14 bg-brand-green hover:bg-brand-green/90 text-black rounded-full shadow-2xl shadow-brand-green/40 hover:shadow-brand-green/60 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    aria-label="Create Community"
                >
                    <PlusIcon className="w-6 h-6" />
                </button>

                {/* Communities Grid */}
                {(pinnedCommunities.length > 0 || recentCommunities.length > 0 || otherCommunities.length > 0) ? (
                    <>
                        {searchTerm && (
                            <div className="mb-6 sm:mb-8 px-2">
                                <p className="text-text-secondary-light dark:text-text-secondary text-sm sm:text-base">
                                    <span className="font-bold text-text-main-light dark:text-text-main text-base sm:text-lg">{pinnedCommunities.length + recentCommunities.length + otherCommunities.length}</span> {(pinnedCommunities.length + recentCommunities.length + otherCommunities.length) !== 1 ? 'communities' : 'community'} found
                                </p>
                            </div>
                        )}

                        {/* Pinned Communities Section - Only show on My Communities tab when not searching */}
                        {activeTab === 'my' && !searchTerm && pinnedCommunities.length > 0 && (
                            <div className="mb-8 sm:mb-12">
                                <div className="flex items-center gap-3 mb-4 sm:mb-6 px-2">
                                    <div className="flex-shrink-0 w-1 h-8 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-full"></div>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-text-main-light dark:text-text-main flex items-center gap-2">
                                        <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                        </svg>
                                        Pinned
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-8">
                                    {pinnedCommunities.map((community, index) => (
                                        <CommunityCard
                                            key={community.id}
                                            community={community}
                                            index={index}
                                            onTogglePin={handleTogglePin}
                                            showPinButton={true}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Communities Section - Only show on My Communities tab when not searching */}
                        {activeTab === 'my' && !searchTerm && recentCommunities.length > 0 && (
                            <div className="mb-8 sm:mb-12">
                                <div className="flex items-center gap-3 mb-4 sm:mb-6 px-2">
                                    <div className="flex-shrink-0 w-1 h-8 bg-gradient-to-b from-brand-green to-brand-green/50 rounded-full"></div>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-text-main-light dark:text-text-main">
                                        Recent
                                    </h2>
                                    <div className="flex-1 h-px bg-gradient-to-r from-tertiary-light/30 dark:from-tertiary/30 to-transparent"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-8">
                                    {recentCommunities.map((community, index) => (
                                        <CommunityCard
                                            key={community.id}
                                            community={community}
                                            index={index + pinnedCommunities.length}
                                            onTogglePin={handleTogglePin}
                                            showPinButton={true}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Other Communities Section */}
                        {otherCommunities.length > 0 && (
                            <div>
                                {/* Show section header only when there are recent/pinned communities above */}
                                {activeTab === 'my' && !searchTerm && (pinnedCommunities.length > 0 || recentCommunities.length > 0) && (
                                    <div className="flex items-center gap-3 mb-4 sm:mb-6 px-2">
                                        <div className="flex-shrink-0 w-1 h-8 bg-gradient-to-b from-brand-green/60 to-brand-green/30 rounded-full"></div>
                                        <h2 className="text-2xl sm:text-3xl font-bold text-text-main-light dark:text-text-main">
                                            All Communities
                                        </h2>
                                        <div className="flex-1 h-px bg-gradient-to-r from-tertiary-light/30 dark:from-tertiary/30 to-transparent"></div>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-8">
                                    {otherCommunities.map((community, index) => (
                                        <CommunityCard
                                            key={community.id}
                                            community={community}
                                            index={activeTab === 'my' && !searchTerm ? index + pinnedCommunities.length + recentCommunities.length : index}
                                            onTogglePin={activeTab === 'my' ? handleTogglePin : undefined}
                                            showPinButton={activeTab === 'my'}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 sm:py-32 px-4 sm:px-6">
                        <div className="relative inline-block mb-6 sm:mb-8">
                            <div className="absolute inset-0 bg-brand-green/20 blur-3xl rounded-full"></div>
                            <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-2xl sm:rounded-3xl bg-white/60 dark:bg-secondary/60 backdrop-blur-xl border border-white/20 dark:border-white/5 flex items-center justify-center shadow-2xl">
                                <UserGroupIcon className="w-12 h-12 sm:w-16 sm:h-16 text-text-tertiary-light dark:text-text-tertiary" />
                            </div>
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-main-light dark:text-text-main mb-3 sm:mb-4">
                            {searchTerm
                                ? 'No communities found'
                                : (activeTab === 'my' ? "You haven't joined any communities" : "No other communities to join")}
                        </h2>
                        <p className="text-base sm:text-lg text-text-secondary-light dark:text-text-secondary max-w-md mx-auto mb-6 sm:mb-8">
                            {searchTerm ? (
                                <>
                                    We couldn&apos;t find any communities matching{' '}
                                    <span className="font-semibold text-text-main-light dark:text-text-main">{searchTerm}</span>
                                </>
                            ) : (
                                activeTab === 'my' ? "Explore the 'Discover' tab to find your people!" : 'Why not be the first to create one?'
                            )}
                        </p>
                        {searchTerm ? (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/60 dark:bg-secondary/60 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-secondary/80 text-text-main-light dark:text-text-main font-bold rounded-xl sm:rounded-2xl transition-all shadow-xl border border-white/20 dark:border-white/5"
                            >
                                Clear search
                            </button>
                        ) : activeTab === 'discover' && (
                            <button
                                onClick={() => setCreateModalOpen(true)}
                                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-brand-green hover:bg-brand-green/90 text-black font-bold rounded-xl sm:rounded-2xl transition-all shadow-2xl shadow-brand-green/25 hover:shadow-brand-green/40 hover:scale-105"
                            >
                                Create a Community
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunitiesListPage;
