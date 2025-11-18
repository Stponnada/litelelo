// src/pages/Home.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { usePosts } from '../hooks/usePosts';
import PostComponent from '../components/Post';
import CreatePost from '../components/CreatePost';
import { Profile, Post as PostType, CampusEvent, MarketplaceListing, LostAndFoundItem } from '../types';
import Spinner from '../components/Spinner';
import LightBox from '../components/lightbox';
import PostSkeleton from '../components/PostSkeleton';
import { XCircleIcon, PencilIcon, UserGroupIcon, CalendarDaysIcon, CubeIcon } from '../components/icons';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import FollowSuggestions from '../components/FollowSuggestions';
import GlobalSearchBar from '../components/GlobalSearchBar';
import ListingCard from '../components/ListingCard';
import EventCard from '../components/EventCard';
import ListingDetailModal from '../components/ListingDetailModal';

const LostFoundFeedCard: React.FC<{ item: any }> = ({ item }) => {
    const isLost = item.item_type === 'lost';
    const navigate = useNavigate();
    const handleClick = () => {
        if (item && item.id) {
            navigate('/campus/lost-and-found', { state: { selectedItemId: item.id } });
        }
    };

    return (
        <div onClick={handleClick} className={`block cursor-pointer p-3.5 rounded-xl shadow-sm border transition-all duration-300 hover:-translate-y-1 backdrop-blur-md mb-2 ${isLost ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40' : 'bg-green-500/5 border-green-500/20 hover:border-green-500/40'}`}>
            <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 w-20 h-20 rounded-lg bg-tertiary-light dark:bg-tertiary overflow-hidden`}>
                   {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />}
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
        <Link to={`/profile/${profile.username}`} className="flex items-center gap-3 group"> 
            <img src={profile.avatar_url || ''} alt="Your avatar" className="w-10 h-10 rounded-full object-cover border border-brand-green/20 group-hover:border-brand-green transition-colors"/> 
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

const CommunitiesWidget: React.FC = () => { const { user } = useAuth(); const [communities, setCommunities] = useState<{ id: string; name: string; avatar_url: string | null }[]>([]); useEffect(() => { if (!user) return; const fetchCommunities = async () => { const { data } = await supabase.rpc('get_communities_for_user', { p_user_id: user.id }).limit(5); if (data) setCommunities(data); }; fetchCommunities(); }, [user]); return ( <div className="bg-secondary-light/70 dark:bg-secondary/70 backdrop-blur-xl rounded-xl border border-tertiary-light/50 dark:border-white/5 p-4 shadow-sm"> <div className="flex items-center justify-between mb-3"> <h3 className="font-bold text-sm text-text-main-light dark:text-text-main">Communities</h3> <UserGroupIcon className="w-4 h-4 text-text-tertiary-light dark:text-text-tertiary"/> </div> {communities.length > 0 ? ( <div className="space-y-2"> {communities.map(c => ( <Link key={c.id} to={`/communities/${c.id}`} className="flex items-center gap-2.5 p-1.5 -mx-1.5 rounded-lg hover:bg-tertiary-light/50 dark:hover:bg-white/5 transition-colors group"> <img src={c.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random&color=fff&bold=true`} alt={c.name} className="w-7 h-7 rounded-md object-cover ring-1 ring-transparent group-hover:ring-brand-green/30 transition-all" /> <span className="text-xs font-medium text-text-secondary-light dark:text-text-secondary truncate flex-1 group-hover:text-text-main-light dark:group-hover:text-text-main transition-colors">{c.name}</span> </Link> ))} </div> ) : <p className="text-xs text-text-tertiary-light dark:text-text-tertiary">No communities yet</p>} </div> ); };

const CryptoHubWidget: React.FC<{ profile: Profile }> = ({ profile }) => { const [isExpanded, setIsExpanded] = useState(false); return ( <div className="bg-secondary-light/70 dark:bg-secondary/70 backdrop-blur-xl rounded-xl border border-tertiary-light/50 dark:border-white/5 p-4 shadow-sm"> <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between group"> <div className="flex items-center gap-2.5"> <div className="p-1.5 rounded-md bg-brand-green/10 text-brand-green group-hover:bg-brand-green/20 transition-colors"><CubeIcon className="w-4 h-4"/></div> <h3 className="font-bold text-sm text-text-main-light dark:text-text-main">Bits-Coin</h3> </div> <svg className={`w-4 h-4 text-text-tertiary-light dark:text-text-tertiary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /> </svg> </button> {isExpanded && ( <div className="mt-3 pt-3 border-t border-tertiary-light/50 dark:border-white/10 animate-fadeIn"> <div className="text-center py-2"> <p className="text-[10px] font-medium text-text-tertiary-light dark:text-text-tertiary mb-0.5 uppercase tracking-wide">Balance</p> <p className="text-2xl font-black text-brand-green tracking-tight"> {profile.bits_coin_balance?.toFixed(2) || '0.00'} <span className="text-sm font-bold text-text-secondary-light dark:text-text-secondary">BC</span> </p> </div> <Link to="/easter-egg/blockchain" className="block w-full text-center text-xs font-bold bg-brand-green/10 text-brand-green hover:bg-brand-green/20 py-2 rounded-lg transition-colors"> View Chain </Link> </div> )} </div> ); };

export const HomePage: React.FC = () => {
    const { posts, loading: postsLoading, error: postsError, addPostToContext, feedType, setFeedType, fetchPosts, hasMore } = usePosts();
    const { user, profile: currentUserProfile } = useAuth();
    
    const [hasDiscoveredBlockchain, setHasDiscoveredBlockchain] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [isCreatePostModalOpen, setCreatePostModalOpen] = useState(false);
    const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (localStorage.getItem('discoveredBlockchain') === 'true') {
            setHasDiscoveredBlockchain(true);
        }
    }, []);
    
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
                    <div className="bg-white dark:bg-secondary rounded-xl border border-gray-200 dark:border-tertiary p-4 h-40 animate-pulse"></div>
                    {[...Array(4)].map((_, i) => <PostSkeleton key={i} />)}
                </main>
                <aside className="hidden lg:block lg:col-span-3">
                    <div className="sticky top-24 space-y-3">
                        <div className="bg-white dark:bg-secondary rounded-xl border border-gray-200 dark:border-tertiary p-4 h-24 animate-pulse"></div>
                        <div className="bg-white dark:bg-secondary rounded-xl border border-gray-200 dark:border-tertiary p-4 h-36 animate-pulse"></div>
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
            {selectedListing && <ListingDetailModal listing={selectedListing} onClose={() => setSelectedListing(null)} onEdit={() => {}} onDelete={() => {}} />}
            {isCreatePostModalOpen && currentUserProfile && ( <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20 md:items-center md:pt-4" onClick={() => setCreatePostModalOpen(false)}> <div className="w-full max-w-2xl relative" onClick={(e) => e.stopPropagation()}> <button onClick={() => setCreatePostModalOpen(false)} className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors"> <XCircleIcon className="w-8 h-8"/> </button> <CreatePost onPostCreated={handlePostCreatedInModal} profile={currentUserProfile} /> </div> </div> )}
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <main className="col-span-1 lg:col-span-9">
                    <div className="mb-6 hidden lg:block">
                        {currentUserProfile && <CreatePost onPostCreated={addPostToContext} profile={currentUserProfile} />}
                    </div>
                    
                    {/* Sticky Tab Bar - Dense & Attached */}
                    <div className="sticky top-16 md:top-20 z-30 mb-2 -mx-4 md:mx-0 px-4 md:px-0 pt-0 transition-all duration-300">
                        <div className="bg-secondary-light/90 dark:bg-secondary/90 backdrop-blur-xl rounded-xl shadow-sm border-b border-x border-tertiary-light/50 dark:border-white/5 p-1 flex">
                            <button onClick={() => setFeedType('foryou')} className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all duration-200 ${ feedType === 'foryou' ? 'bg-brand-green/10 text-brand-green shadow-sm' : 'text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main hover:bg-tertiary-light/50 dark:hover:bg-white/5' }`}> For You </button>
                            <button onClick={() => setFeedType('following')} className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all duration-200 ${ feedType === 'following' ? 'bg-brand-green/10 text-brand-green shadow-sm' : 'text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main hover:bg-tertiary-light/50 dark:hover:bg-white/5' }`}> Following </button>
                            <button onClick={() => setFeedType('campus')} className={`flex-1 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all duration-200 ${ feedType === 'campus' ? 'bg-brand-green/10 text-brand-green shadow-sm' : 'text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main hover:bg-tertiary-light/50 dark:hover:bg-white/5' }`}> Campus </button>
                        </div>
                    </div>
                    
                    {posts.length > 0 ? (
                        <div className="space-y-2">
                            {posts.map((item: any) => {
                                switch (item.item_type) {
                                    case 'listing':
                                        return <ListingCard key={`listing-${item.item_data.id}`} listing={item.item_data as MarketplaceListing} onClick={() => setSelectedListing(item.item_data)} />;
                                    case 'event':
                                        return <EventCard key={`event-${item.item_data.id}`} event={item.item_data as CampusEvent} />;
                                    case 'lost_found':
                                        return <LostFoundFeedCard key={`laf-${item.item_data.id}`} item={item.item_data} />;
                                    case 'post':
                                        return <PostComponent key={`post-${item.id}`} post={item} onImageClick={setLightboxUrl} />;
                                    default:
                                        if (item.id && !item.item_type) {
                                           return <PostComponent key={`post-${item.id}`} post={item} onImageClick={setLightboxUrl} />;
                                        }
                                        return null;
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