'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import CreateCommunityModal from '@/components/CreateCommunityModal';
import Skeleton from '@/components/Skeleton';
import { UserGroupIcon, PlusIcon, SearchIcon, PinIcon, XMarkIcon, ArrowRightIcon } from '@/components/icons';

// --- Types ---
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

// --- Sub-components ---

const CommunityCard = ({
    community,
    onTogglePin,
    showPinButton
}: {
    community: CommunityListItem,
    onTogglePin?: (id: string) => void,
    showPinButton?: boolean
}) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -4 }}
            className="group relative"
        >
            <Link href={`/communities/${community.id}`} className="block h-full">
                <div className="relative h-full bg-white dark:bg-secondary/40 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.08] rounded-3xl p-5 transition-all hover:shadow-2xl hover:shadow-brand-green/10 hover:border-brand-green/30">

                    {/* Header Info */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="relative">
                            <Image
                                src={community.avatar_url || `https://ui-avatars.com/api/?name=${community.name}&background=random&color=random`}
                                alt={community.name}
                                width={64}
                                height={64}
                                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-black/5 dark:ring-white/5"
                                unoptimized
                            />

                        </div>

                        {showPinButton && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onTogglePin?.(community.id);
                                }}
                                className={`p-2 rounded-xl transition-colors ${community.is_pinned
                                    ? 'bg-brand-green/10 text-brand-green'
                                    : 'text-text-tertiary hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                            >
                                <PinIcon className={`w-5 h-5 ${community.is_pinned ? 'fill-current' : ''}`} />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-text-main-light dark:text-text-main group-hover:text-brand-green transition-colors line-clamp-1">
                            {community.name}
                        </h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary line-clamp-2 leading-relaxed h-10">
                            {community.description || 'A vibrant community on campus.'}
                        </p>
                    </div>

                    {/* Footer Stats */}
                    <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-text-tertiary">
                            <UserGroupIcon className="w-4 h-4 text-brand-green" />
                            <span className="text-text-main-light dark:text-text-main">{community.member_count}</span>
                            <span>members</span>
                        </div>
                        <div className="text-brand-green">
                            <ArrowRightIcon className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

const SkeletonCard = () => (
    <Skeleton className="h-[220px] rounded-3xl" />
);

// --- Main Page Component ---

const CommunitiesListPage = () => {
    const { profile } = useAuth();
    const [communities, setCommunities] = useState<CommunityListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'discover' | 'my'>('my');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);

    useEffect(() => {
        if (!profile?.campus) return;
        const fetchCommunities = async () => {
            try {
                const { data } = await supabase.rpc('get_communities_list', { p_campus: profile.campus });
                setCommunities(data || []);
            } finally {
                setLoading(false);
            }
        };
        fetchCommunities();
    }, [profile?.campus]);

    const handleTogglePin = async (communityId: string) => {
        const { data } = await supabase.rpc('toggle_community_pin', { p_community_id: communityId });
        setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, is_pinned: data as boolean } : c));
    };

    const filteredList = useMemo(() => {
        const isMyTab = activeTab === 'my';
        return communities
            .filter(c => isMyTab ? c.is_member : !c.is_member)
            .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => (a.is_pinned === b.is_pinned ? 0 : a.is_pinned ? -1 : 1));
    }, [communities, searchTerm, activeTab]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 min-h-screen">

            {/* --- Hero Section --- */}
            <header className="relative mb-3">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-text-main-light dark:text-text-main mb-2 sm:mb-4 tracking-tight leading-none flex flex-wrap items-center gap-2 sm:gap-4">
                            <span>Find Your</span>
                            <div className="relative">
                                <div className="absolute inset-0 bg-brand-green/30 blur-2xl rounded-full"></div>
                                <UserGroupIcon className="relative w-10 h-10 sm:w-16 lg:w-20 sm:h-16 lg:h-20 text-brand-green" />
                            </div>
                            <br className="w-full" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-brand-green/60">Community</span>
                        </h1>
                    </div>

                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green/90 text-black font-bold py-4 px-8 rounded-2xl transition-allCa active:scale-95"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Create Community
                    </button>
                </div>
            </header>

            {/* --- Filters & Search Bar --- */}
            <div className="sticky top-20 z-30 mb-10 pb-4 bg-background/80 backdrop-blur-md">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Tab Switcher */}
                    <div className="p-1.5 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center">
                        {(['my', 'discover'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`relative px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab
                                    ? 'text-black'
                                    : 'text-text-tertiary hover:text-text-main-light dark:hover:text-text-main'
                                    }`}
                            >
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="tab-bg"
                                        className="absolute inset-0 bg-brand-green rounded-xl"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10 capitalize">
                                    {tab === 'my' ? 'My Communities' : 'Explore All'}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-1 group">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-brand-green transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name or interests..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 bg-black/5 dark:bg-white/5 border border-transparent focus:border-brand-green/30 focus:bg-white dark:focus:bg-secondary/40 rounded-2xl outline-none transition-all text-text-main-light dark:text-text-main"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Main Content --- */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : filteredList.length > 0 ? (
                <motion.div
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    <AnimatePresence mode='popLayout'>
                        {filteredList.map((community) => (
                            <CommunityCard
                                key={community.id}
                                community={community}
                                onTogglePin={handleTogglePin}
                                showPinButton={activeTab === 'my'}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                /* Empty State */
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 px-4 text-center"
                >
                    <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                        <UserGroupIcon className="w-10 h-10 text-text-tertiary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">No communities found</h3>
                    <p className="text-text-tertiary max-w-sm mb-8">
                        {searchTerm
                            ? `We couldn't find anything matching "${searchTerm}"`
                            : "You haven't joined any communities yet. Start exploring!"}
                    </p>
                    {activeTab === 'my' && !searchTerm && (
                        <button
                            onClick={() => setActiveTab('discover')}
                            className="text-brand-green font-bold flex items-center gap-2 hover:underline"
                        >
                            Explore communities <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    )}
                </motion.div>
            )}

            {/* Modal */}
            {isCreateModalOpen && profile?.campus && (
                <CreateCommunityModal
                    campus={profile.campus}
                    onClose={() => setCreateModalOpen(false)}
                    onCommunityCreated={(newComm) => {
                        // Explicitly construct the object to match CommunityListItem interface
                        const formattedCommunity: CommunityListItem = {
                            id: newComm.id,
                            name: newComm.name,
                            description: newComm.description,
                            avatar_url: newComm.avatar_url || null,
                            member_count: newComm.member_count ?? 1, // Default to 1 as the creator is a member
                            is_member: true,
                            is_pinned: false,
                            last_visited_at: new Date().toISOString(), // Initialize with current time
                        };

                        setCommunities(prev => [formattedCommunity, ...prev]);
                        setCreateModalOpen(false);
                        setActiveTab('my');
                    }}
                />
            )}
        </div>
    );
};

export default CommunitiesListPage;