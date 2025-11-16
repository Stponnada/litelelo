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
        <div onClick={handleClick} className={`block cursor-pointer p-4 rounded-xl shadow-lg border transition-all duration-300 hover:-translate-y-1 ${isLost ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40' : 'bg-green-500/5 border-green-500/20 hover:border-green-500/40'}`}>
            <div className="flex items-center gap-4">
                <div className={`flex-shrink-0 w-24 h-24 rounded-lg bg-tertiary-light dark:bg-tertiary overflow-hidden`}>
                   {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mb-2 ${isLost ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>{isLost ? 'LOST' : 'FOUND'}</span>
                    <h3 className="font-bold text-lg text-text-main-light dark:text-text-main truncate">{item.title}</h3>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary">Location: {item.location_found}</p>
                </div>
            </div>
        </div>
    );
};

const ProfileCard: React.FC<{ profile: Profile }> = ({ profile }) => ( <div className="bg-white dark:bg-secondary rounded-2xl border border-gray-200 dark:border-tertiary p-4"> <Link to={`/profile/${profile.username}`} className="flex items-center gap-3 group"> <img src={profile.avatar_url || ''} alt="Your avatar" className="w-11 h-11 rounded-full object-cover border-2 border-gray-200 dark:border-tertiary"/> <div className="flex-1 min-w-0"> <h3 className="font-semibold text-text-main-light dark:text-text-main truncate group-hover:text-brand-green transition-colors">{profile.full_name}</h3> <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">@{profile.username}</p> </div> </Link> <div className="flex gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-tertiary"> <div> <p className="font-bold text-text-main-light dark:text-text-main">{profile.follower_count}</p> <p className="text-xs text-text-tertiary-light dark:text-text-tertiary">Followers</p> </div> <div> <p className="font-bold text-text-main-light dark:text-text-main">{profile.following_count}</p> <p className="text-xs text-text-tertiary-light dark:text-text-tertiary">Following</p> </div> </div> </div> );

const CommunitiesWidget: React.FC = () => { const { user } = useAuth(); const [communities, setCommunities] = useState<{ id: string; name: string; avatar_url: string | null }[]>([]); useEffect(() => { if (!user) return; const fetchCommunities = async () => { const { data } = await supabase.rpc('get_communities_for_user', { p_user_id: user.id }).limit(5); if (data) setCommunities(data); }; fetchCommunities(); }, [user]); return ( <div className="bg-white dark:bg-secondary rounded-2xl border border-gray-200 dark:border-tertiary p-4"> <div className="flex items-center justify-between mb-3"> <h3 className="font-semibold text-text-main-light dark:text-text-main">Communities</h3> <UserGroupIcon className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary"/> </div> {communities.length > 0 ? ( <div className="space-y-2"> {communities.map(c => ( <Link key={c.id} to={`/communities/${c.id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-tertiary transition-colors"> <img src={c.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random&color=fff&bold=true`} alt={c.name} className="w-8 h-8 rounded-lg object-cover" /> <span className="text-sm text-text-secondary-light dark:text-text-secondary truncate flex-1">{c.name}</span> </Link> ))} </div> ) : <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">No communities yet</p>} </div> ); };

const CryptoHubWidget: React.FC<{ profile: Profile }> = ({ profile }) => { const [isExpanded, setIsExpanded] = useState(false); return ( <div className="bg-white dark:bg-secondary rounded-2xl border border-gray-200 dark:border-tertiary p-4"> <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between"> <div className="flex items-center gap-2"> <CubeIcon className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary"/> <h3 className="font-semibold text-text-main-light dark:text-text-main">Bits-Coin</h3> </div> <svg className={`w-5 h-5 text-text-tertiary-light dark:text-text-tertiary transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /> </svg> </button> {isExpanded && ( <div className="mt-4 pt-4 border-t border-gray-200 dark:border-tertiary"> <div className="text-center py-4"> <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mb-1">Balance</p> <p className="text-2xl font-bold text-brand-green"> {profile.bits_coin_balance?.toFixed(2) || '0.00'} BC </p> </div> <Link to="/easter-egg/blockchain" className="block text-center text-sm text-brand-green hover:text-brand-green/80 py-2"> View Blockchain → </Link> </div> )} </div> ); };

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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <main className="col-span-1 lg:col-span-9 space-y-3">
                    <div className="bg-white dark:bg-secondary rounded-2xl border border-gray-200 dark:border-tertiary p-4 h-48 animate-pulse"></div>
                    {[...Array(4)].map((_, i) => <PostSkeleton key={i} />)}
                </main>
                <aside className="hidden lg:block lg:col-span-3">
                    <div className="sticky top-28 space-y-3">
                        <div className="bg-white dark:bg-secondary rounded-2xl border border-gray-200 dark:border-tertiary p-4 h-24 animate-pulse"></div>
                        <div className="bg-white dark:bg-secondary rounded-2xl border border-gray-200 dark:border-tertiary p-4 h-36 animate-pulse"></div>
                        <div className="bg-white dark:bg-secondary rounded-2xl border border-gray-200 dark:border-tertiary p-4 h-48 animate-pulse"></div>
                    </div>
                </aside>
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
            {selectedListing && <ListingDetailModal listing={selectedListing} onClose={() => setSelectedListing(null)} onEdit={() => {}} onDelete={() => {}} />}
            {isCreatePostModalOpen && currentUserProfile && ( <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20 md:items-center md:pt-4" onClick={() => setCreatePostModalOpen(false)}> <div className="w-full max-w-2xl relative" onClick={(e) => e.stopPropagation()}> <button onClick={() => setCreatePostModalOpen(false)} className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors"> <XCircleIcon className="w-8 h-8"/> </button> <CreatePost onPostCreated={handlePostCreatedInModal} profile={currentUserProfile} /> </div> </div> )}
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <main className="col-span-1 lg:col-span-9">
                    <div className="mb-6 lg:hidden">
                        <GlobalSearchBar />
                    </div>

                    <div className="mb-6 hidden lg:block">
                        {currentUserProfile && <CreatePost onPostCreated={addPostToContext} profile={currentUserProfile} />}
                    </div>
                    
                    <div className="bg-secondary-light dark:bg-secondary rounded-t-lg border-b border-tertiary-light dark:border-tertiary sticky top-16 md:top-24 z-10">
                        <div className="flex">
                            <button onClick={() => setFeedType('foryou')} className={`flex-1 py-4 font-semibold text-center transition-all ${ feedType === 'foryou' ? 'border-b-2 border-brand-green text-brand-green' : 'text-text-tertiary-light dark:text-text-tertiary hover:bg-tertiary-light/30 dark:hover:bg-tertiary/30' }`}> For You </button>
                            <button onClick={() => setFeedType('following')} className={`flex-1 py-4 font-semibold text-center transition-all ${ feedType === 'following' ? 'border-b-2 border-brand-green text-brand-green' : 'text-text-tertiary-light dark:text-text-tertiary hover:bg-tertiary-light/30 dark:hover:bg-tertiary/30' }`}> Friends and Following </button>
                            <button onClick={() => setFeedType('campus')} className={`flex-1 py-4 font-semibold text-center transition-all ${ feedType === 'campus' ? 'border-b-2 border-brand-green text-brand-green' : 'text-text-tertiary-light dark:text-text-tertiary hover:bg-tertiary-light/30 dark:hover:bg-tertiary/30' }`}> Campus </button>
                        </div>
                    </div>
                    
                    {posts.length > 0 ? (
                        <div className="space-y-3">
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
                         <div className="text-center py-16 bg-white dark:bg-secondary rounded-2xl border border-gray-200 dark:border-tertiary">
                            <p className="text-text-tertiary-light dark:text-text-tertiary">No posts to show yet. Start following people or join communities!</p>
                         </div>
                    )}
                </main>

                <aside className="hidden lg:block lg:col-span-3">
                    <div className="sticky top-28">
                        <div className="space-y-3 max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-hide">
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