// src/pages/Home.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { usePosts } from '../hooks/usePosts';
import PostComponent from '../components/Post';
import CreatePost from '../components/CreatePost';
import { Profile, Post as PostType, RecommendedContent, CampusEvent, MarketplaceListing, FollowSuggestion } from '../types';
import Spinner from '../components/Spinner';
import LightBox from '../components/lightbox';
import { XCircleIcon, PencilIcon, UserGroupIcon, BookmarkIcon, StarIcon, CalendarDaysIcon, ShoppingCartIcon, CurrencyRupeeIcon, CubeIcon } from '../components/icons';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

// --- WIDGET: User Profile Card (Left Column) ---
const ProfileCard: React.FC<{ profile: Profile }> = ({ profile }) => (
    <div className="group relative overflow-hidden bg-gradient-to-br from-brand-green/5 to-transparent dark:from-brand-green/10 dark:to-transparent rounded-3xl shadow-xl border border-tertiary-light/50 dark:border-tertiary/50 p-6 text-center hover:shadow-2xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-green/0 to-brand-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative">
            <Link to={`/profile/${profile.username}`}>
                <div className="relative inline-block">
                    <img 
                        src={profile.avatar_url || ''} 
                        alt="Your avatar" 
                        className="w-28 h-28 rounded-full object-cover mx-auto mb-4 border-4 border-brand-green/20 ring-4 ring-brand-green/10 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-green/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
            </Link>
            <Link to={`/profile/${profile.username}`}>
                <h3 className="font-bold text-xl text-text-main-light dark:text-text-main truncate hover:text-brand-green transition-colors">{profile.full_name}</h3>
            </Link>
            <p className="text-sm text-text-tertiary-light dark:text-text-tertiary mt-1">@{profile.username}</p>
            <div className="flex justify-center gap-8 mt-6 pt-5 border-t border-tertiary-light/50 dark:border-tertiary/50">
                <div className="text-center">
                    <p className="font-bold text-2xl text-text-main-light dark:text-text-main bg-gradient-to-r from-brand-green to-blue-400 bg-clip-text text-transparent">{profile.follower_count}</p>
                    <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-1 font-medium">Followers</p>
                </div>
                <div className="text-center">
                    <p className="font-bold text-2xl text-text-main-light dark:text-text-main bg-gradient-to-r from-blue-400 to-brand-green bg-clip-text text-transparent">{profile.following_count}</p>
                    <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-1 font-medium">Following</p>
                </div>
            </div>
        </div>
    </div>
);

// --- WIDGET: Communities List (Left Column) ---
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
        <div className="bg-secondary-light/50 dark:bg-secondary/50 backdrop-blur-sm rounded-3xl shadow-xl border border-tertiary-light/50 dark:border-tertiary/50 p-6 hover:shadow-2xl transition-shadow duration-300">
            <h3 className="font-bold text-lg text-text-main-light dark:text-text-main mb-5 flex items-center gap-2">
                <div className="p-2 bg-brand-green/10 rounded-lg">
                    <UserGroupIcon className="w-5 h-5 text-brand-green"/>
                </div>
                <span>Your Communities</span>
            </h3>
            {communities.length > 0 ? (
                <div className="space-y-2">
                    {communities.map(c => (
                        <Link key={c.id} to={`/communities/${c.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-green/5 dark:hover:bg-brand-green/10 transition-all duration-200 group border border-transparent hover:border-brand-green/20">
                            <img src={c.avatar_url || `https://ui-avatars.com/api/?name=${c.name}`} alt={c.name} className="w-10 h-10 rounded-lg object-cover ring-2 ring-tertiary-light dark:ring-tertiary group-hover:ring-brand-green/30 transition-all" />
                            <span className="font-semibold text-sm text-text-secondary-light dark:text-text-secondary group-hover:text-brand-green transition-colors truncate flex-1">{c.name}</span>
                            <svg className="w-4 h-4 text-text-tertiary-light dark:text-text-tertiary group-hover:text-brand-green transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    ))}
                </div>
            ) : <p className="text-sm text-text-tertiary-light dark:text-text-tertiary text-center py-4">You haven't joined any communities yet.</p>}
        </div>
    );
};

// --- WIDGET: Upcoming Events (Right Column) ---
const EventsWidget: React.FC<{ events: CampusEvent[] }> = ({ events }) => (
    <div className="bg-gradient-to-br from-secondary-light/80 to-secondary-light dark:from-secondary/80 dark:to-secondary backdrop-blur-sm rounded-3xl shadow-xl border border-tertiary-light/50 dark:border-tertiary/50 p-6 hover:shadow-2xl transition-shadow duration-300">
        <h3 className="font-bold text-lg text-text-main-light dark:text-text-main mb-5 flex items-center gap-2">
            <div className="p-2 bg-brand-green/10 rounded-lg">
                <CalendarDaysIcon className="w-5 h-5 text-brand-green"/>
            </div>
            <span>Upcoming Events</span>
        </h3>
        {events.length > 0 ? (
            <div className="space-y-3">
                {events.slice(0, 3).map(event => (
                    <Link key={event.id} to={`/campus/events/${event.id}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-brand-green/5 dark:hover:bg-brand-green/10 transition-all duration-200 group border border-transparent hover:border-brand-green/20">
                        <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 text-center bg-gradient-to-br from-brand-green/10 to-brand-green/5 rounded-xl group-hover:from-brand-green/20 group-hover:to-brand-green/10 transition-all ring-2 ring-brand-green/20">
                            <span className="text-2xl font-bold text-brand-green">{format(new Date(event.start_time), 'd')}</span>
                            <span className="text-xs font-bold uppercase text-brand-green/70">{format(new Date(event.start_time), 'MMM')}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-text-main-light dark:text-text-main group-hover:text-brand-green transition-colors line-clamp-2">{event.name}</p>
                            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-1 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {format(new Date(event.start_time), 'p')}
                            </p>
                        </div>
                    </Link>
                ))}
                <Link to="/campus/events" className="block text-center text-sm font-bold text-brand-green hover:text-brand-green/80 mt-4 py-2 px-4 rounded-lg hover:bg-brand-green/5 transition-all">
                    View all events →
                </Link>
            </div>
        ) : (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-tertiary-light/30 dark:bg-tertiary/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CalendarDaysIcon className="w-8 h-8 text-text-tertiary-light dark:text-text-tertiary"/>
                </div>
                <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">No upcoming events.</p>
            </div>
        )}
    </div>
);

// --- WIDGET: Marketplace Spotlight (Right Column) ---
const MarketplaceWidget: React.FC<{ listings: MarketplaceListing[] }> = ({ listings }) => (
    <div className="bg-gradient-to-br from-secondary-light/80 to-secondary-light dark:from-secondary/80 dark:to-secondary backdrop-blur-sm rounded-3xl shadow-xl border border-tertiary-light/50 dark:border-tertiary/50 p-6 hover:shadow-2xl transition-shadow duration-300">
        <h3 className="font-bold text-lg text-text-main-light dark:text-text-main mb-5 flex items-center gap-2">
            <div className="p-2 bg-brand-green/10 rounded-lg">
                <ShoppingCartIcon className="w-5 h-5 text-brand-green"/>
            </div>
            <span>Marketplace</span>
        </h3>
        {listings.length > 0 ? (
            <div className="space-y-3">
                {listings.slice(0, 3).map(item => (
                    <Link key={item.id} to="/campus/marketplace" state={{ selectedListingId: item.id }} className="flex items-center gap-4 p-3 rounded-xl hover:bg-brand-green/5 dark:hover:bg-brand-green/10 transition-all duration-200 group border border-transparent hover:border-brand-green/20">
                        <div className="relative flex-shrink-0">
                            <img src={item.primary_image_url || 'https://placehold.co/100x100'} alt={item.title} className="w-14 h-14 rounded-lg object-cover ring-2 ring-tertiary-light dark:ring-tertiary group-hover:ring-brand-green/30 transition-all" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-brand-green/0 to-brand-green/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-text-main-light dark:text-text-main line-clamp-1 group-hover:text-brand-green transition-colors">{item.title}</p>
                            <p className="text-base font-bold text-brand-green mt-1">₹{item.price.toLocaleString()}</p>
                        </div>
                        <svg className="w-4 h-4 text-text-tertiary-light dark:text-text-tertiary group-hover:text-brand-green transform group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                ))}
                 <Link to="/campus/marketplace" className="block text-center text-sm font-bold text-brand-green hover:text-brand-green/80 mt-4 py-2 px-4 rounded-lg hover:bg-brand-green/5 transition-all">
                    Browse marketplace →
                </Link>
            </div>
        ) : (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-tertiary-light/30 dark:bg-tertiary/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShoppingCartIcon className="w-8 h-8 text-text-tertiary-light dark:text-text-tertiary"/>
                </div>
                <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">No items for sale right now.</p>
            </div>
        )}
    </div>
);

// --- NEW COMBINED WIDGET: Crypto Hub (Bits-Coin + Blockchain) ---
const MiniBlock: React.FC<{ block: any }> = ({ block }) => (
    <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-green to-blue-500 rounded-xl blur-sm opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <div className="relative w-20 h-20 bg-gradient-to-br from-secondary-light to-secondary-light/50 dark:from-secondary dark:to-secondary/50 backdrop-blur-sm rounded-xl border border-brand-green/20 flex flex-col items-center justify-center p-2 text-center group-hover:border-brand-green/40 transition-all">
            <CubeIcon className="w-6 h-6 text-brand-green mb-1"/>
            <p className="text-xs font-bold text-text-main-light dark:text-text-main">#{block.index}</p>
            <p className="text-[10px] text-text-tertiary-light dark:text-text-tertiary truncate w-full">{block.hash.substring(0, 8)}...</p>
        </div>
    </div>
);

const CryptoHubWidget: React.FC<{ profile: Profile }> = ({ profile }) => {
    const [blocks, setBlocks] = useState<any[]>([]);
    useEffect(() => {
        const fetchLatestBlocks = async () => {
            const { data } = await supabase.rpc('get_blockchain_with_miners').order('index', { ascending: false }).limit(3);
            if (data) setBlocks(data.reverse());
        };
        fetchLatestBlocks();
    }, []);

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-green/5 via-secondary-light to-blue-500/5 dark:from-brand-green/10 dark:via-secondary dark:to-blue-500/10 rounded-3xl shadow-xl border border-tertiary-light/50 dark:border-tertiary/50 p-6 space-y-5 hover:shadow-2xl transition-shadow duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-green/10 to-transparent rounded-full blur-3xl"></div>
            <div className="relative">
                <h3 className="font-bold text-lg text-text-main-light dark:text-text-main flex items-center gap-2">
                    <div className="p-2 bg-brand-green/10 rounded-lg">
                        <CubeIcon className="w-5 h-5 text-brand-green"/>
                    </div>
                    <span>Crypto Hub</span>
                </h3>
                
                {/* Balance Section */}
                <div className="mt-5 text-center p-6 bg-gradient-to-br from-brand-green/10 to-blue-500/5 dark:from-brand-green/20 dark:to-blue-500/10 rounded-2xl border border-brand-green/20">
                    <p className="text-xs font-bold text-text-secondary-light dark:text-text-secondary mb-2 uppercase tracking-wider">Bits-Coin Balance</p>
                    <p className="text-4xl font-black bg-gradient-to-r from-brand-green via-brand-green to-blue-400 bg-clip-text text-transparent">
                        {profile.bits_coin_balance?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-2">BC</p>
                </div>

                {/* Blockchain Section */}
                {blocks.length > 0 && (
                    <div className="mt-5">
                        <p className="text-xs font-bold text-text-tertiary-light dark:text-text-tertiary mb-3 uppercase tracking-wider">Latest Blocks</p>
                        <div className="flex items-center justify-around">
                            {blocks.map((block, index) => (
                                <React.Fragment key={block.id}>
                                    {index > 0 && (
                                        <div className="flex-1 mx-2">
                                            <div className="h-0.5 bg-gradient-to-r from-brand-green/50 to-blue-500/50"></div>
                                        </div>
                                    )}
                                    <MiniBlock block={block} />
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}
                <Link to="/easter-egg/blockchain" className="block text-center text-sm font-bold text-brand-green hover:text-brand-green/80 mt-5 py-2 px-4 rounded-lg hover:bg-brand-green/5 transition-all">
                    Open Blockchain Explorer →
                </Link>
            </div>
        </div>
    );
};


export const HomePage: React.FC = () => {
    const { posts, loading: postsLoading, error: postsError, addPostToContext } = usePosts();
    const { user, profile: currentUserProfile } = useAuth();
    
    const [recsLoading, setRecsLoading] = useState(true);
    const [recommendations, setRecommendations] = useState<RecommendedContent | null>(null);
    const [upcomingEvents, setUpcomingEvents] = useState<CampusEvent[]>([]);
    const [latestListings, setLatestListings] = useState<MarketplaceListing[]>([]);
    const [hasDiscoveredBlockchain, setHasDiscoveredBlockchain] = useState(false);

    const [isVisible, setIsVisible] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [isCreatePostModalOpen, setCreatePostModalOpen] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('discoveredBlockchain') === 'true') {
            setHasDiscoveredBlockchain(true);
        }

        setIsVisible(true);
        if (currentUserProfile?.campus) {
            setRecsLoading(true);
            Promise.all([
                supabase.rpc('get_search_recommendations'),
                supabase.rpc('get_campus_events', { p_campus: currentUserProfile.campus }).order('start_time', { ascending: true }).limit(3),
                supabase.rpc('get_marketplace_listings', { p_campus: currentUserProfile.campus }).order('created_at', { ascending: false }).limit(3)
            ]).then(([recsResult, eventsResult, listingsResult]) => {
                if (recsResult.data) setRecommendations(recsResult.data);
                if (eventsResult.data) setUpcomingEvents(eventsResult.data as CampusEvent[]);
                if (listingsResult.data) setLatestListings(listingsResult.data as MarketplaceListing[]);
            }).catch(console.error)
              .finally(() => setRecsLoading(false));
        }
    }, [currentUserProfile?.campus]);

    const handlePostCreatedInModal = (post: PostType) => {
        addPostToContext(post);
        setCreatePostModalOpen(false);
    };

    if (postsLoading || !currentUserProfile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <div className="absolute inset-0 bg-brand-green/20 rounded-full blur-xl animate-pulse"></div>
                    <Spinner />
                </div>
                <p className="mt-6 text-text-secondary-light dark:text-text-secondary animate-pulse font-medium">Loading your feed...</p>
            </div>
        );
    }

    if (postsError) {
        return (
            <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30 rounded-3xl p-8 text-center backdrop-blur-sm">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-5 ring-4 ring-red-500/10">
                        <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-red-400 mb-3">Oops! Something went wrong</h3>
                    <p className="text-red-300/80">{postsError}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {lightboxUrl && <LightBox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

            {isCreatePostModalOpen && currentUserProfile && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-start justify-center p-4 pt-16 md:items-center md:pt-4 animate-in fade-in duration-200"
                    onClick={() => setCreatePostModalOpen(false)}
                >
                    <div 
                        className="w-full max-w-2xl relative animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setCreatePostModalOpen(false)}
                            className="absolute -top-12 -right-2 text-white/60 hover:text-white transition-colors"
                        >
                            <XCircleIcon className="w-10 h-10"/>
                        </button>
                        <CreatePost onPostCreated={handlePostCreatedInModal} profile={currentUserProfile} />
                    </div>
                </div>
            )}
            
            {/* Ambient Background Effects */}
            <div className="fixed top-20 right-10 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse"></div>
            <div className="fixed bottom-20 left-10 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-10 lg:gap-8">
                {/* --- LEFT COLUMN (Desktop Only) --- */}
                <aside className="hidden lg:block lg:col-span-2">
                    <div className="sticky top-28">
                        <div className="space-y-6 max-h-[calc(100vh-9rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-brand-green/20 hover:scrollbar-thumb-brand-green/40 scrollbar-track-transparent">
                            <ProfileCard profile={currentUserProfile} />
                            <CommunitiesWidget />
                        </div>
                    </div>
                </aside>

                {/* --- CENTER COLUMN (Main Feed) --- */}
                <main className="col-span-1 lg:col-span-5">
                    {/* Welcome Header for Mobile */}
                    <div className={`mb-8 transition-all duration-700 lg:hidden ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                        <div className="relative overflow-hidden bg-gradient-to-br from-brand-green/10 via-secondary-light to-secondary-light dark:from-brand-green/10 dark:via-secondary dark:to-secondary rounded-3xl p-8 shadow-xl border border-tertiary-light/50 dark:border-tertiary/50">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/10 rounded-full blur-3xl"></div>
                            <div className="relative">
                                <h1 className="text-4xl font-black text-text-main-light dark:text-text-main mb-2">Welcome back! 👋</h1>
                                <p className="text-text-secondary-light dark:text-text-secondary font-medium">Here's what's happening on campus.</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Create Post for Desktop */}
                    <div className={`mb-8 hidden lg:block transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                        <CreatePost onPostCreated={addPostToContext} profile={currentUserProfile} />
                    </div>
                    
                    {/* Posts Feed */}
                     {posts.length > 0 ? (
                        <div className="space-y-6">
                            {posts.map((post, index) => (
                                <div 
                                    key={post.id}
                                    className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                                    style={{ transitionDelay: `${200 + index * 50}ms` }}
                                >
                                    <PostComponent post={post} onImageClick={setLightboxUrl} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                            <div className="text-center py-24 px-6 bg-gradient-to-br from-secondary-light to-secondary-light/50 dark:from-secondary dark:to-secondary/50 rounded-3xl border border-tertiary-light/50 dark:border-tertiary/50">
                                <div className="w-24 h-24 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-12 h-12 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main mb-3">Your feed is empty</h3>
                                <p className="text-text-secondary-light dark:text-text-secondary mb-6 max-w-md mx-auto">Follow people or join communities to see posts here.</p>
                                <Link to="/directory" className="inline-flex items-center gap-2 bg-brand-green text-black font-bold py-3 px-6 rounded-full hover:bg-brand-green/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-green/20">
                                    <UserGroupIcon className="w-5 h-5"/>
                                    Discover People
                                </Link>
                            </div>
                        </div>
                    )}
                </main>
                
                {/* --- RIGHT COLUMN (Desktop Only) --- */}
                <aside className="hidden lg:block lg:col-span-3">
                    <div className="sticky top-28 space-y-6">
                        {recsLoading ? (
                            <div className="p-16 flex justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-brand-green/20 rounded-full blur-xl animate-pulse"></div>
                                    <Spinner />
                                </div>
                            </div>
                        ) : (
                            <>
                                {hasDiscoveredBlockchain && <CryptoHubWidget profile={currentUserProfile} />}
                                <EventsWidget events={upcomingEvents} />
                                <MarketplaceWidget listings={latestListings} />
                            </>
                        )}
                    </div>
                </aside>
            </div>


            {/* Floating Action Button for Mobile */}
            <button
                onClick={() => setCreatePostModalOpen(true)}
                className="md:hidden fixed bottom-20 right-4 bg-gradient-to-br from-brand-green to-brand-green/90 text-black w-16 h-16 rounded-full flex items-center justify-center shadow-2xl shadow-brand-green/40 z-40 hover:scale-110 active:scale-95 transition-transform ring-4 ring-brand-green/20"
                aria-label="Create Post"
            >
                <PencilIcon className="w-8 h-8" />
            </button>
        </div>
    );
};