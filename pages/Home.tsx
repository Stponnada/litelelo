// src/pages/Home.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { usePosts } from '../hooks/usePosts';
import PostComponent from '../components/Post';
import CreatePost from '../components/CreatePost';
import { Profile, Post as PostType, CampusEvent, MarketplaceListing } from '../types';
import Spinner from '../components/Spinner';
import LightBox from '../components/lightbox';
import { XCircleIcon, PencilIcon, UserGroupIcon, CalendarDaysIcon, ShoppingCartIcon, CubeIcon } from '../components/icons';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import FollowSuggestions from '../components/FollowSuggestions';

// --- Simplified Profile Card ---
const ProfileCard: React.FC<{ profile: Profile }> = ({ profile }) => (
    <div className="bg-white dark:bg-secondary rounded-2xl border border-gray-200 dark:border-tertiary p-4">
        <Link to={`/profile/${profile.username}`} className="flex items-center gap-3 group">
            <img 
                src={profile.avatar_url || ''} 
                alt="Your avatar" 
                className="w-11 h-11 rounded-full object-cover border-2 border-gray-200 dark:border-tertiary"
            />
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text-main-light dark:text-text-main truncate group-hover:text-brand-green transition-colors">{profile.full_name}</h3>
                <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">@{profile.username}</p>
            </div>
        </Link>
        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-tertiary">
            <div>
                <p className="font-bold text-text-main-light dark:text-text-main">{profile.follower_count}</p>
                <p className="text-xs text-text-tertiary-light dark:text-text-tertiary">Followers</p>
            </div>
            <div>
                <p className="font-bold text-text-main-light dark:text-text-main">{profile.following_count}</p>
                <p className="text-xs text-text-tertiary-light dark:text-text-tertiary">Following</p>
            </div>
        </div>
    </div>
);

// --- Simplified Communities Widget ---
const CommunitiesWidget: React.FC = () => {
    const { user } = useAuth();
    const [communities, setCommunities] = useState<{ id: string; name: string; avatar_url: string | null }[]>([]);

    useEffect(() => {
        if (!user) return;
        const fetchCommunities = async () => {
            const { data } = await supabase.rpc('get_communities_for_user', { p_user_id: user.id }).limit(5);
            if (data) setCommunities(data);
        };
        fetchCommunities();
    }, [user]);

    return (
        <div className="bg-white dark:bg-secondary rounded-2xl border border-gray-200 dark:border-tertiary p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-text-main-light dark:text-text-main">Communities</h3>
                <UserGroupIcon className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary"/>
            </div>
            {communities.length > 0 ? (
                <div className="space-y-2">
                    {communities.map(c => (
                        <Link key={c.id} to={`/communities/${c.id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-tertiary transition-colors">
                            <img src={c.avatar_url || `https://ui-avatars.com/api/?name=${c.name}`} alt={c.name} className="w-8 h-8 rounded-lg object-cover" />
                            <span className="text-sm text-text-secondary-light dark:text-text-secondary truncate flex-1">{c.name}</span>
                        </Link>
                    ))}
                </div>
            ) : <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">No communities yet</p>}
        </div>
    );
};

// --- Simplified Events Widget ---
const EventsWidget: React.FC<{ events: CampusEvent[] }> = ({ events }) => (
    <div className="bg-white dark:bg-secondary rounded-2xl border border-gray-200 dark:border-tertiary p-4">
        <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-text-main-light dark:text-text-main">Events</h3>
            <CalendarDaysIcon className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary"/>
        </div>
        {events.length > 0 ? (
            <div className="space-y-3">
                {events.slice(0, 3).map(event => (
                    <Link key={event.id} to={`/campus/events/${event.id}`} className="flex gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-tertiary transition-colors">
                        <div className="flex-shrink-0 flex flex-col items-center justify-center w-11 h-11 text-center bg-brand-green/10 rounded-lg">
                            <span className="text-lg font-bold text-brand-green">{format(new Date(event.start_time), 'd')}</span>
                            <span className="text-[10px] font-semibold text-brand-green/70">{format(new Date(event.start_time), 'MMM')}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-text-main-light dark:text-text-main line-clamp-2">{event.name}</p>
                            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-1">
                                {format(new Date(event.start_time), 'p')}
                            </p>
                        </div>
                    </Link>
                ))}
                <Link to="/campus/events" className="block text-center text-sm text-brand-green hover:text-brand-green/80 py-2">
                    View all →
                </Link>
            </div>
        ) : (
            <p className="text-sm text-text-tertiary-light dark:text-text-tertiary text-center py-4">No upcoming events</p>
        )}
    </div>
);

// --- Simplified Marketplace Widget ---
const MarketplaceWidget: React.FC<{ listings: MarketplaceListing[] }> = ({ listings }) => (
    <div className="bg-white dark:bg-secondary rounded-2xl border border-gray-200 dark:border-tertiary p-4">
        <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-text-main-light dark:text-text-main">Marketplace</h3>
            {/*<ShoppingCartIcon className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary"/>*/}
        </div>
        {listings.length > 0 ? (
            <div className="space-y-2">
                {listings.slice(0, 3).map(item => (
                    <Link key={item.id} to="/campus/marketplace" state={{ selectedListingId: item.id }} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-tertiary transition-colors">
                        <img src={item.primary_image_url || 'https://placehold.co/100x100'} alt={item.title} className="w-11 h-11 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-text-main-light dark:text-text-main line-clamp-1">{item.title}</p>
                            <p className="text-sm font-semibold text-brand-green">₹{item.price.toLocaleString()}</p>
                        </div>
                    </Link>
                ))}
                 <Link to="/campus/marketplace" className="block text-center text-sm text-brand-green hover:text-brand-green/80 py-2">
                    Browse →
                </Link>
            </div>
        ) : (
            <p className="text-sm text-text-tertiary-light dark:text-text-tertiary text-center py-4">No items for sale</p>
        )}
    </div>
);

// --- Minimal Crypto Widget (Collapsible) ---
const CryptoHubWidget: React.FC<{ profile: Profile }> = ({ profile }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white dark:bg-secondary rounded-2xl border border-gray-200 dark:border-tertiary p-4">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between"
            >
                <div className="flex items-center gap-2">
                    <CubeIcon className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary"/>
                    <h3 className="font-semibold text-text-main-light dark:text-text-main">Bits-Coin</h3>
                </div>
                <svg 
                    className={`w-5 h-5 text-text-tertiary-light dark:text-text-tertiary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-tertiary">
                    <div className="text-center py-4">
                        <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mb-1">Balance</p>
                        <p className="text-2xl font-bold text-brand-green">
                            {profile.bits_coin_balance?.toFixed(2) || '0.00'} BC
                        </p>
                    </div>
                    <Link 
                        to="/easter-egg/blockchain" 
                        className="block text-center text-sm text-brand-green hover:text-brand-green/80 py-2"
                    >
                        View Blockchain →
                    </Link>
                </div>
            )}
        </div>
    );
};


export const HomePage: React.FC = () => {
    const { posts, loading: postsLoading, error: postsError, addPostToContext, feedType, setFeedType } = usePosts();
    const { user, profile: currentUserProfile } = useAuth();
    
    const [upcomingEvents, setUpcomingEvents] = useState<CampusEvent[]>([]);
    const [latestListings, setLatestListings] = useState<MarketplaceListing[]>([]);
    const [hasDiscoveredBlockchain, setHasDiscoveredBlockchain] = useState(false);

    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [isCreatePostModalOpen, setCreatePostModalOpen] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('discoveredBlockchain') === 'true') {
            setHasDiscoveredBlockchain(true);
        }

        if (currentUserProfile?.campus) {
            Promise.all([
                supabase.rpc('get_campus_events', { p_campus: currentUserProfile.campus }).order('start_time', { ascending: true }).limit(3),
                supabase.rpc('get_marketplace_listings', { p_campus: currentUserProfile.campus }).order('created_at', { ascending: false }).limit(3)
            ]).then(([eventsResult, listingsResult]) => {
                if (eventsResult.data) setUpcomingEvents(eventsResult.data as CampusEvent[]);
                if (listingsResult.data) setLatestListings(listingsResult.data as MarketplaceListing[]);
            }).catch(console.error);
        }
    }, [currentUserProfile?.campus]);

    const handlePostCreatedInModal = (post: PostType) => {
        addPostToContext(post);
        setCreatePostModalOpen(false);
    };

    if (postsLoading || !currentUserProfile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Spinner />
                <p className="mt-4 text-text-secondary-light dark:text-text-secondary">Loading your feed...</p>
            </div>
        );
    }

    if (postsError) {
        return (
            <div className="max-w-2xl mx-auto mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Something went wrong</h3>
                <p className="text-red-500 dark:text-red-300">{postsError}</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {lightboxUrl && <LightBox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

            {/* Create Post Modal */}
            {isCreatePostModalOpen && currentUserProfile && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20 md:items-center md:pt-4"
                    onClick={() => setCreatePostModalOpen(false)}
                >
                    <div 
                        className="w-full max-w-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setCreatePostModalOpen(false)}
                            className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors"
                        >
                            <XCircleIcon className="w-8 h-8"/>
                        </button>
                        <CreatePost onPostCreated={handlePostCreatedInModal} profile={currentUserProfile} />
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* --- LEFT SIDEBAR (Desktop Only) --- */}
                <aside className="hidden lg:block lg:col-span-3">
                    {/* This outer div becomes the sticky container */}
                    <div className="sticky top-28">
                        {/* This inner div handles overflow and has the actual content */}
                        <div className="space-y-3 max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-hide">
                            <ProfileCard profile={currentUserProfile} />
                            <FollowSuggestions />
                            <CommunitiesWidget />
                            {hasDiscoveredBlockchain && <CryptoHubWidget profile={currentUserProfile} />}
                        </div>
                    </div>
                </aside>

                {/* --- MAIN FEED --- */}
                <main className="col-span-1 lg:col-span-6">
                    {/* Create Post (Desktop) */}
                    <div className="mb-6 hidden lg:block">
                        <CreatePost onPostCreated={addPostToContext} profile={currentUserProfile} />
                    </div>
                    
                    {/* Feed Toggle */}
                    <div className="bg-secondary-light dark:bg-secondary rounded-t-lg border-b border-tertiary-light dark:border-tertiary sticky top-16 md:top-24 z-10">
                        <div className="flex">
                            <button
                                onClick={() => setFeedType('foryou')}
                                className={`flex-1 py-4 font-semibold text-center transition-all ${
                                    feedType === 'foryou'
                                    ? 'border-b-2 border-brand-green text-brand-green'
                                    : 'text-text-tertiary-light dark:text-text-tertiary hover:bg-tertiary-light/30 dark:hover:bg-tertiary/30'
                                }`}
                            >
                                For You
                            </button>
                            <button
                                onClick={() => setFeedType('following')}
                                className={`flex-1 py-4 font-semibold text-center transition-all ${
                                    feedType === 'following'
                                    ? 'border-b-2 border-brand-green text-brand-green'
                                    : 'text-text-tertiary-light dark:text-text-tertiary hover:bg-tertiary-light/30 dark:hover:bg-tertiary/30'
                                }`}
                            >
                                Following
                            </button>
                        </div>
                    </div>
                    
                    {/* Posts Feed */}
                    {posts.length > 0 ? (
                        <div className="space-y-3">
                            {posts.map((post) => (
                                <PostComponent key={post.id} post={post} onImageClick={setLightboxUrl} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white dark:bg-secondary rounded-2xl border border-gray-200 dark:border-tertiary">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-text-tertiary-light dark:text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-text-main-light dark:text-text-main mb-2">Your feed is empty</h3>
                            <p className="text-text-secondary-light dark:text-text-secondary mb-4">Follow people or join communities to see posts</p>
                            <Link to="/directory" className="inline-flex items-center gap-2 bg-brand-green text-black font-semibold py-2 px-4 rounded-lg hover:bg-brand-green/90 transition-colors">
                                <UserGroupIcon className="w-5 h-5"/>
                                Discover People
                            </Link>
                        </div>
                    )}
                </main>
                
                {/* --- RIGHT SIDEBAR (Desktop Only) --- */}
                <aside className="hidden lg:block lg:col-span-3">
                    {/* This outer div becomes the sticky container */}
                    <div className="sticky top-28">
                        {/* This inner div handles overflow and has the actual content */}
                        <div className="space-y-3 max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-hide">
                            <EventsWidget events={upcomingEvents} />
                            <MarketplaceWidget listings={latestListings} />
                        </div>
                    </div>
                </aside>
            </div>

            {/* Floating Action Button (Mobile) */}
            <button
                onClick={() => setCreatePostModalOpen(true)}
                className="lg:hidden fixed bottom-20 right-4 bg-brand-green text-black w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40 hover:scale-105 active:scale-95 transition-transform"
                aria-label="Create Post"
            >
                <PencilIcon className="w-6 h-6" />
            </button>
        </div>
    );
};