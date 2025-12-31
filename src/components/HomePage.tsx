'use client';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import PostComponent from './Post';
import CreatePost from './CreatePost';
import { Profile, Post as PostType, CampusEvent, MarketplaceListing, LostAndFoundItem } from '@/types';
import Spinner from './Spinner';
import LightBox from './lightbox';
import PostSkeleton from './PostSkeleton';
import { XCircleIcon, PencilIcon, UserGroupIcon, CubeIcon, UserIcon } from './icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Skeleton from './Skeleton';
import FollowSuggestions from './FollowSuggestions';
import GlobalSearchBar from './GlobalSearchBar';
import ListingCard from './ListingCard';
import EventCard from './EventCard';
import ListingDetailModal from './ListingDetailModal';
import { getResizedAvatarUrl } from '@/utils/imageUtils';

const LostFoundFeedCard: React.FC<{ item: LostAndFoundItem }> = ({ item }) => {
    const isLost = item.item_type === 'lost';
    const router = useRouter();
    const handleClick = () => {
        if (item && item.id) {
            // Passing state via router.push is not directly supported in Next.js App Router like in react-router-dom state.
            // We might need to use query params or a global store/context.
            // For now, let's just navigate to the page. The page should handle fetching if needed, or we use query params.
            router.push(`/campus/lost-and-found?selectedItemId=${item.id}`);
        }
    };

    return (
        <div onClick={handleClick} className={`block cursor-pointer p-3.5 rounded-xl shadow-sm border transition-all duration-300 hover:-translate-y-1 backdrop-blur-md mb-2 ${isLost ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40' : 'bg-green-500/5 border-green-500/20 hover:border-green-500/40'}`}>
            <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden ${item.image_url ? 'bg-tertiary-light dark:bg-tertiary' : isLost ? 'bg-gradient-to-br from-red-500/20 to-red-600/30' : 'bg-gradient-to-br from-green-500/20 to-green-600/30'}`}>
                    {item.image_url ? (
                        <Image src={item.image_url} alt={item.title} width={80} height={80} className="w-full h-full object-cover" unoptimized />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className={`text-2xl font-black ${isLost ? 'text-red-500' : 'text-green-500'}`}>
                                {isLost ? '⚠' : '✓'}
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mb-1.5 ${isLost ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>{isLost ? 'LOST' : 'FOUND'}</span>
                    <h3 className="font-bold text-base text-text-main-light dark:text-text-main truncate">{item.title}</h3>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary mt-0.5">At {item.location_found}</p>
                </div>
            </div>
        </div>
    );
};

const ProfileCard: React.FC<{ profile: Profile }> = ({ profile }) => (
    <div className="bg-secondary-light/70 dark:bg-secondary/70 backdrop-blur-xl rounded-xl border border-tertiary-light/50 dark:border-white/5 p-4 shadow-sm">
        <Link href={`/profile/${profile.username}`} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full overflow-hidden object-cover border border-brand-green/20 group-hover:border-brand-green transition-colors bg-tertiary-light dark:bg-tertiary flex items-center justify-center">
                <Image
                    src={getResizedAvatarUrl(profile.avatar_url, 40, 40, profile.full_name || profile.username)}
                    alt="Your avatar"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    unoptimized
                />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-text-main-light dark:text-text-main truncate group-hover:text-brand-green transition-colors">{profile.full_name}</h3>
                <p className="text-xs text-text-tertiary-light dark:text-text-tertiary">@{profile.username}</p>
            </div>
        </Link>
        <div className="flex gap-4 mt-3 pt-3 border-t border-tertiary-light/50 dark:border-white/5">
            <div className="text-center flex-1">
                <p className="font-bold text-sm text-text-main-light dark:text-text-main">{profile.follower_count}</p>
                <p className="text-[10px] font-medium text-text-tertiary-light dark:text-text-tertiary uppercase tracking-wide">Followers</p>
            </div>
            <div className="text-center flex-1">
                <p className="font-bold text-sm text-text-main-light dark:text-text-main">{profile.following_count}</p>
                <p className="text-xs font-medium text-text-tertiary-light dark:text-text-tertiary uppercase tracking-wide">Following</p>
            </div>
        </div>
    </div>
);

const CommunitiesWidget: React.FC = () => { const { user } = useAuth(); const [communities, setCommunities] = useState<{ id: string; name: string; avatar_url: string | null }[]>([]); useEffect(() => { if (!user) return; const fetchCommunities = async () => { try { const response = await fetch(`/api/communities/for-user/${user.id}`); const data = await response.json(); if (response.ok) setCommunities(data); else { /* Fallback */ const { data: directData } = await supabase.rpc('get_communities_for_user', { p_user_id: user.id }).limit(5); if (directData) setCommunities(directData); } } catch (e) { console.error("Failed to fetch communities cache:", e); } }; fetchCommunities(); }, [user]); return (<div className="bg-secondary-light/70 dark:bg-secondary/70 backdrop-blur-xl rounded-xl border border-tertiary-light/50 dark:border-white/5 p-4 shadow-sm"> <div className="flex items-center justify-between mb-3"> <h3 className="font-bold text-sm text-text-main-light dark:text-text-main">Communities</h3> <UserGroupIcon className="w-4 h-4 text-text-tertiary-light dark:text-text-tertiary" /> </div> {communities.length > 0 ? (<div className="space-y-2"> {communities.map(c => (<Link key={c.id} href={`/communities/${c.id}`} className="flex items-center gap-2.5 p-1.5 -mx-1.5 rounded-lg hover:bg-tertiary-light/50 dark:hover:bg-white/5 transition-colors group"> <Image src={getResizedAvatarUrl(c.avatar_url, 28, 28, c.name)} alt={c.name} width={28} height={28} className="w-7 h-7 rounded-md object-cover ring-1 ring-transparent group-hover:ring-brand-green/30 transition-all" unoptimized /> <span className="text-xs font-medium text-text-secondary-light dark:text-text-secondary truncate flex-1 group-hover:text-text-main-light dark:group-hover:text-text-main transition-colors">{c.name}</span> </Link>))} </div>) : <p className="text-xs text-text-tertiary-light dark:text-text-tertiary">No communities yet</p>} </div>); };

const CryptoHubWidget: React.FC<{ profile: Profile }> = ({ profile }) => { const [isExpanded, setIsExpanded] = useState(false); return (<div className="bg-secondary-light/70 dark:bg-secondary/70 backdrop-blur-xl rounded-xl border border-tertiary-light/50 dark:border-white/5 p-4 shadow-sm"> <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between group"> <div className="flex items-center gap-2.5"> <div className="p-1.5 rounded-md bg-brand-green/10 text-brand-green group-hover:bg-brand-green/20 transition-colors"><CubeIcon className="w-4 h-4" /></div> <h3 className="font-bold text-sm text-text-main-light dark:text-text-main">Bits-Coin</h3> </div> <svg className={`w-4 h-4 text-text-tertiary-light dark:text-text-tertiary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /> </svg> </button> {isExpanded && (<div className="mt-3 pt-3 border-t border-tertiary-light/50 dark:border-white/10 animate-fadeIn"> <div className="text-center py-2"> <p className="text-[10px] font-medium text-text-tertiary-light dark:text-text-tertiary mb-0.5 uppercase tracking-wide">Balance</p> <p className="text-2xl font-black text-brand-green tracking-tight"> {profile.bits_coin_balance?.toFixed(2) || '0.00'} <span className="text-sm font-bold text-text-secondary-light dark:text-text-secondary">BC</span> </p> </div> <div className="flex gap-2"> <Link href="/easter-egg/blockchain" className="flex-1 text-center text-xs font-bold bg-brand-green/10 text-brand-green hover:bg-brand-green/20 py-2 rounded-lg transition-colors"> Wallet </Link> <Link href="/easter-egg/trading" className="flex-1 text-center text-xs font-bold bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 py-2 rounded-lg transition-colors"> Trade </Link> </div> </div>)} </div>); };

const HomePage: React.FC = () => {
    const { posts, loading: postsLoading, error: postsError, addPostToContext, feedType, setFeedType, fetchPosts, hasMore } = usePosts();
    const { profile: currentUserProfile } = useAuth();

    const sentinelRef = useRef<HTMLDivElement>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
    const [isCreatePostModalOpen, setCreatePostModalOpen] = useState(false);

    const [hasDiscoveredBlockchain] = useState(() => {
        return typeof window !== 'undefined' ? localStorage.getItem('discoveredBlockchain') === 'true' : false;
    });

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || postsLoading) return;

        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (entry.isIntersecting && hasMore) {
                fetchPosts(true);
            }
        }, { rootMargin: '400px 0px' });

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [postsLoading, hasMore, fetchPosts]);

    const handlePostCreatedInModal = (post: PostType) => {
        addPostToContext(post);
        setCreatePostModalOpen(false);
    };

    if (postsLoading && posts.length === 0) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <main className="col-span-1 lg:col-span-9 space-y-2">
                    <Skeleton className="h-40 w-full rounded-xl" />
                    {[...Array(4)].map((_, i) => <PostSkeleton key={i} />)}
                </main>
                <aside className="hidden lg:block lg:col-span-3">
                    <div className="sticky top-24 space-y-3">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-36 w-full rounded-xl" />
                    </div>
                </aside>
            </div>
        );
    }

    if (postsError) {
        return (
            <div className="max-w-2xl mx-auto mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Something went wrong</h3>
                <p className="text-red-500 dark:text-red-300">{postsError}</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {lightboxUrl && <LightBox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
            {selectedListing && <ListingDetailModal listing={selectedListing} onClose={() => setSelectedListing(null)} onEdit={() => { }} onDelete={() => { }} />}
            {isCreatePostModalOpen && currentUserProfile && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20 md:items-center md:pt-4" onClick={() => setCreatePostModalOpen(false)}> <div className="w-full max-w-2xl relative" onClick={(e) => e.stopPropagation()}> <button onClick={() => setCreatePostModalOpen(false)} className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors"> <XCircleIcon className="w-8 h-8" /> </button> <CreatePost onPostCreated={handlePostCreatedInModal} profile={currentUserProfile} /> </div> </div>)}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <main className="col-span-1 lg:col-span-9">
                    <div className="mb-6 hidden lg:block">
                        {currentUserProfile && <CreatePost onPostCreated={addPostToContext} profile={currentUserProfile} />}
                    </div>

                    {/* Sticky Tab Bar - Dense & Attached */}
                    <div className="sticky top-16 md:top-20 z-30 mb-2 -mx-4 md:mx-0 px-4 md:px-0 pt-0 transition-all duration-300">
                        <div className="bg-secondary-light/90 dark:bg-secondary/90 backdrop-blur-xl rounded-xl shadow-sm border-b border-x border-tertiary-light/50 dark:border-white/5 p-1 flex">
                            <button onClick={() => setFeedType('foryou')} className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all duration-200 ${feedType === 'foryou' ? 'bg-brand-green/10 text-brand-green shadow-sm' : 'text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main hover:bg-tertiary-light/50 dark:hover:bg-white/5'}`}> For You </button>
                            <button onClick={() => setFeedType('following')} className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all duration-200 ${feedType === 'following' ? 'bg-brand-green/10 text-brand-green shadow-sm' : 'text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main hover:bg-tertiary-light/50 dark:hover:bg-white/5'}`}> Following </button>
                            <button onClick={() => setFeedType('campus')} className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all duration-200 ${feedType === 'campus' ? 'bg-brand-green/10 text-brand-green shadow-sm' : 'text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main hover:bg-tertiary-light/50 dark:hover:bg-white/5'}`}> Campus </button>
                        </div>
                    </div>


                    {posts.length > 0 ? (
                        <div className="space-y-2">
                            {posts.map(item => {
                                // Type guard to check if item has item_type property
                                if ('item_type' in item && item.item_type) {
                                    switch (item.item_type) {
                                        case 'listing':
                                            return <ListingCard key={`listing-${item.item_data.id}`} listing={item.item_data as MarketplaceListing} onClick={() => setSelectedListing(item.item_data as MarketplaceListing)} />;
                                        case 'event':
                                            return <EventCard key={`event-${item.item_data.id}`} event={item.item_data as CampusEvent} />;
                                        case 'lost_found':
                                            return <LostFoundFeedCard key={`laf-${item.item_data.id}`} item={item.item_data as LostAndFoundItem} />;
                                        default:
                                            return null;
                                    }
                                } else {
                                    // It's a regular Post
                                    return <PostComponent key={`post-${item.id}`} post={item as PostType} onImageClick={setLightboxUrl} />;
                                }
                            })}
                            {hasMore && (<div ref={sentinelRef} className="flex items-center justify-center py-6"><Spinner /></div>)}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-secondary-light/50 dark:bg-secondary/50 backdrop-blur-sm rounded-xl border border-tertiary-light dark:border-white/5">
                            <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UserGroupIcon className="w-8 h-8 text-brand-green" />
                            </div>
                            <h3 className="text-lg font-bold text-text-main-light dark:text-text-main mb-1">Welcome to litelelo.</h3>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary max-w-sm mx-auto">
                                This feed looks a bit empty. Start following people or join communities!
                            </p>
                        </div>
                    )}
                </main>

                <aside className="hidden lg:block lg:col-span-3">
                    <div className="sticky top-24 space-y-4">
                        <div className="max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide space-y-4 pb-10">
                            <GlobalSearchBar />
                            {currentUserProfile && <ProfileCard profile={currentUserProfile} />}
                            <FollowSuggestions />
                            <CommunitiesWidget />
                            {hasDiscoveredBlockchain && currentUserProfile && <CryptoHubWidget profile={currentUserProfile} />}
                        </div>
                    </div>
                </aside>
            </div>

            <button onClick={() => setCreatePostModalOpen(true)} className="lg:hidden fixed bottom-20 right-4 bg-brand-green text-black w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40 hover:scale-105 active:scale-95 transition-transform" aria-label="Create Post">
                <PencilIcon className="w-6 h-6" />
            </button>
        </div>
    );
};

export default HomePage;
