// src/pages/CampusPage.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { CampusPlace, MarketplaceListing, LostAndFoundItem, CampusNotice } from '../types';
import ListingCard from '../components/ListingCard';
import Spinner from '../components/Spinner';
import { ArchiveBoxIcon, ShoppingCartIcon, StarIcon, ClipboardDocumentListIcon, CurrencyDollarIcon, CarIcon } from '../components/icons';

const CampusPlacesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg width="64px" height="64px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
            <path d="M11.3196 3H5.08961C3.09961 3 2.09961 4.01 2.09961 6.02V22H7.49961V18.25C7.49961 17.84 7.83961 17.5 8.24961 17.5C8.65961 17.5 8.99961 17.83 8.99961 18.25V22H14.2996V6.02C14.2996 4.01 13.3096 3 11.3196 3ZM10.7496 12.75H5.79961C5.38961 12.75 5.04961 12.41 5.04961 12C5.04961 11.59 5.38961 11.25 5.79961 11.25H10.7496C11.1596 11.25 11.4996 11.59 11.4996 12C11.4996 12.41 11.1596 12.75 10.7496 12.75ZM10.7496 9H5.79961C5.38961 9 5.04961 8.66 5.04961 8.25C5.04961 7.84 5.38961 7.5 5.79961 7.5H10.7496C11.1596 7.5 11.4996 7.84 11.4996 8.25C11.4996 8.66 11.1596 9 10.7496 9Z" fill="currentColor"></path>
            <path d="M23 21.2511H20.73V18.2511C21.68 17.9411 22.37 17.0511 22.37 16.0011V14.0011C22.37 12.6911 21.3 11.6211 19.99 11.6211C18.68 11.6211 17.61 12.6911 17.61 14.0011V16.0011C17.61 17.0411 18.29 17.9211 19.22 18.2411V21.2511H1C0.59 21.2511 0.25 21.5911 0.25 22.0011C0.25 22.4111 0.59 22.7511 1 22.7511H19.93C19.95 22.7511 19.96 22.7611 19.98 22.7611C20 22.7611 20.01 22.7511 20.03 22.7511H23C23.41 22.7511 23.75 22.4111 23.75 22.0011C23.75 21.5911 23.41 21.2511 23 21.2511Z" fill="currentColor"></path>
        </g>
    </svg>
);

const FeatureCard: React.FC<{ to: string; icon: React.ReactNode; title: string; description: string; gradient: string }> = ({ to, icon, title, description, gradient }) => (
    <Link to={to} className="group relative block bg-gradient-to-br from-secondary-light to-secondary-light dark:from-secondary dark:to-secondary rounded-2xl p-5 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-tertiary-light dark:border-tertiary hover:border-transparent">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
        
        <div className="relative z-10">
            <div className="flex flex-col items-center text-center space-y-3">
                <div className={`bg-gradient-to-br ${gradient} p-4 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <h3 className="text-base md:text-lg font-bold text-text-main-light dark:text-text-main group-hover:text-white transition-colors duration-300">
                        {title}
                    </h3>
                    <p className="mt-2 text-xs md:text-sm text-text-secondary-light dark:text-text-secondary group-hover:text-white/90 leading-relaxed transition-colors duration-300">
                        {description}
                    </p>
                </div>
                <div className="flex items-center text-brand-green group-hover:text-white font-bold text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <span>Explore</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </div>
    </Link>
);

const MiniPlaceCard: React.FC<{ place: CampusPlace }> = ({ place }) => (
    <Link to={`/campus/reviews/${place.id}`} className="group block bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl p-4 shadow-md hover:shadow-2xl transition-all duration-300 border border-tertiary-light dark:border-tertiary hover:border-brand-green hover:-translate-y-1 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-green/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
        <div className="relative z-10 flex items-center space-x-4">
            <div className="relative overflow-hidden rounded-xl ring-2 ring-tertiary-light dark:ring-tertiary group-hover:ring-brand-green transition-all duration-300">
                <img src={place.primary_image_url || 'https://placehold.co/100x100'} alt={place.name} className="w-20 h-20 object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-green/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg text-text-main-light dark:text-text-main truncate group-hover:text-brand-green transition-colors duration-300">
                    {place.name}
                </h4>
                <div className="flex items-center mt-2 space-x-2">
                    <div className="flex items-center bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 px-3 py-1.5 rounded-full border border-yellow-400/30">
                        <StarIcon className="w-4 h-4 text-yellow-400" />
                        <span className="font-bold ml-1.5 text-sm text-yellow-400">{place.avg_rating.toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-text-tertiary-light dark:text-text-tertiary font-semibold">
                        {place.review_count} {place.review_count === 1 ? 'review' : 'reviews'}
                    </span>
                </div>
            </div>
        </div>
    </Link>
);

const MiniLostItemCard: React.FC<{ item: LostAndFoundItem }> = ({ item }) => {
    const isLost = item.item_type === 'lost';
    return (
        <div className="group bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl p-4 shadow-md border border-tertiary-light dark:border-tertiary hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 ${isLost ? 'bg-red-500/5' : 'bg-green-500/5'} rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="relative z-10 flex items-center space-x-4">
                <div className="relative overflow-hidden rounded-xl ring-2 ring-tertiary-light dark:ring-tertiary transition-all duration-300">
                    <img src={item.image_url || 'https://placehold.co/100x100'} alt={item.title} className="w-20 h-20 object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${isLost ? 'bg-red-500' : 'bg-green-500'} shadow-lg animate-pulse`}></div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase mb-2 border ${isLost ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                        {item.item_type}
                    </div>
                    <h4 className="font-bold text-text-main-light dark:text-text-main truncate group-hover:text-brand-green transition-colors duration-300">
                        {item.title}
                    </h4>
                    <div className="flex items-center text-xs text-text-tertiary-light dark:text-text-tertiary mt-1.5 space-x-1">
                        <div className="w-1.5 h-1.5 bg-brand-green rounded-full"></div>
                        <span className="truncate font-medium">{item.location_found}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MiniNoticeCard: React.FC<{ notice: CampusNotice }> = ({ notice }) => (
    <Link to="/campus/noticeboard" className="group block bg-gradient-to-br from-yellow-50 to-amber-50/50 dark:from-yellow-900/20 dark:to-amber-900/10 rounded-2xl p-4 shadow-md hover:shadow-2xl transition-all duration-300 border border-yellow-200/50 dark:border-yellow-800/50 hover:border-yellow-400 hover:-translate-y-1 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
        <div className="relative z-10 flex items-center space-x-4">
            <div className="relative overflow-hidden rounded-xl ring-2 ring-yellow-200/50 dark:ring-yellow-800/50 group-hover:ring-yellow-400 transition-all duration-300">
                <img src={notice.files[0]?.file_type === 'image' ? notice.files[0].file_url : 'https://placehold.co/100x100/fde68a/422006?text=PDF'} alt={notice.title} className="w-20 h-20 object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 dark:text-yellow-100 truncate group-hover:text-yellow-600 dark:group-hover:text-yellow-300 transition-colors duration-300">
                    {notice.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-yellow-200/70 mt-1.5 font-medium">
                    Posted by <span className="font-bold">@{notice.profiles?.username}</span>
                </p>
            </div>
        </div>
    </Link>
);

const CampusPage: React.FC = () => {
    const { profile } = useAuth();
    const campusName = profile?.campus || 'Campus';

    const [topPlaces, setTopPlaces] = useState<CampusPlace[]>([]);
    const [newestListings, setNewestListings] = useState<MarketplaceListing[]>([]);
    const [latestLostItem, setLatestLostItem] = useState<LostAndFoundItem | null>(null);
    const [latestNotices, setLatestNotices] = useState<CampusNotice[]>([]);
    const [loadingPreviews, setLoadingPreviews] = useState(true);
    const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);

    useEffect(() => {
        if (!campusName) return;
        
        setDisplayedText('');
        setIsTyping(true);
        let currentIndex = 0;
        
        const typingInterval = setInterval(() => {
            if (currentIndex <= campusName.length) {
                setDisplayedText(campusName.slice(0, currentIndex));
                currentIndex++;
            } else {
                setIsTyping(false);
                clearInterval(typingInterval);
            }
        }, 100);
        
        return () => clearInterval(typingInterval);
    }, [campusName]);

    useEffect(() => {
        if (!profile?.campus) return;

        const fetchPreviews = async () => {
            setLoadingPreviews(true);
            try {
                const placesPromise = supabase.rpc('get_campus_places_with_ratings', { p_campus: profile.campus }).order('avg_rating', { ascending: false }).limit(2);
                const listingsPromise = supabase.rpc('get_marketplace_listings', { p_campus: profile.campus }).order('created_at', { ascending: false }).limit(3);
                const lostFoundPromise = supabase.from('lost_and_found_items').select('*, profiles(*)').eq('campus', profile.campus).order('created_at', { ascending: false }).limit(1).single();
                const noticesPromise = supabase.rpc('get_campus_notices_with_files', { p_campus: profile.campus }).limit(2);

                const [placesResult, listingsResult, lostFoundResult, noticesResult] = await Promise.all([placesPromise, listingsPromise, lostFoundPromise, noticesPromise]);

                if (placesResult.data) setTopPlaces(placesResult.data as CampusPlace[]);
                if (listingsResult.data) setNewestListings(listingsResult.data as MarketplaceListing[]);
                if (lostFoundResult.data) setLatestLostItem(lostFoundResult.data as LostAndFoundItem);
                if (noticesResult.data) setLatestNotices(noticesResult.data as any[]);

            } catch (error) {
                console.error("Error fetching campus previews:", error);
            } finally {
                setLoadingPreviews(false);
            }
        };

        fetchPreviews();
    }, [profile?.campus]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Enhanced Hero Section */}
            <div className="relative bg-gradient-to-br from-brand-green/20 via-blue-500/10 to-purple-500/10 dark:from-brand-green/10 dark:via-blue-500/5 dark:to-purple-500/5 p-10 md:p-16 rounded-3xl shadow-2xl border border-brand-green/20 mb-16 overflow-hidden">
                {/* Animated background blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-green/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                
                <div className="relative text-center">
                    <div className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 bg-gradient-to-r from-brand-green/30 to-brand-green/20 backdrop-blur-sm rounded-full border border-brand-green/30 shadow-lg">
                        <div className="w-2 h-2 bg-brand-green rounded-full animate-pulse"></div>
                        <span className="text-sm font-bold text-brand-green uppercase tracking-wider">Your Campus Hub</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-extrabold text-text-main-light dark:text-text-main mb-6 leading-tight">
                        Today at BITS{' '}
                        <span className="relative inline-block">
                            <span className="bg-gradient-to-r from-brand-green via-green-400 to-brand-green bg-clip-text text-transparent">
                                {displayedText}
                            </span>
                            <span className={`text-brand-green ${isTyping ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                                |
                            </span>
                        </span>
                    </h1>
                    
                    <p className="text-lg md:text-2xl text-text-secondary-light dark:text-text-secondary max-w-3xl mx-auto font-medium leading-relaxed">
                        Your one-stop destination for campus services, reviews, and community connections
                    </p>
                    
                    {/* Stats bar */}
                    <div className="mt-10 flex flex-wrap justify-center gap-6">
                        <div className="bg-white/50 dark:bg-black/30 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 dark:border-white/10">
                            <div className="text-3xl font-bold text-brand-green">{topPlaces.length + newestListings.length + (latestLostItem ? 1 : 0) + latestNotices.length}</div>
                            <div className="text-xs text-text-secondary-light dark:text-text-secondary font-semibold uppercase tracking-wider">Active Posts</div>
                        </div>
                        <div className="bg-white/50 dark:bg-black/30 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 dark:border-white/10">
                            <div className="text-3xl font-bold text-blue-500">6</div>
                            <div className="text-xs text-text-secondary-light dark:text-text-secondary font-semibold uppercase tracking-wider">Services</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Feature Cards Grid */}
            <div className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-1 w-16 bg-gradient-to-r from-brand-green to-transparent rounded-full"></div>
                    <h2 className="text-3xl font-extrabold text-text-main-light dark:text-text-main">Campus Services</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                    <FeatureCard 
                        to="/campus/reviews" 
                        icon={<CampusPlacesIcon className="w-7 h-7 md:w-8 md:h-8 text-white" />} 
                        title="Campus Places" 
                        description="Review eateries, shops, and hangout spots around campus"
                        gradient="from-blue-500 to-purple-600"
                    />
                    <FeatureCard 
                        to="/campus/noticeboard" 
                        icon={<ClipboardDocumentListIcon className="w-7 h-7 md:w-8 md:h-8 text-white" />} 
                        title="Noticeboard" 
                        description="View and post campus announcements and posters"
                        gradient="from-yellow-500 to-amber-600"
                    />
                    <FeatureCard 
                        to="/campus/bits-coin" 
                        icon={<CurrencyDollarIcon className="w-7 h-7 md:w-8 md:h-8 text-white" />} 
                        title="Bits-coin" 
                        description="Post small tasks for others to complete for a reward"
                        gradient="from-emerald-500 to-green-600"
                    />
                    <FeatureCard 
                        to="/campus/ride-share"
                        icon={<CarIcon className="w-7 h-7 md:w-8 md:h-8 text-white" />} 
                        title="Ride Share" 
                        description="Coordinate travel to the airport or home"
                        gradient="from-sky-500 to-indigo-600"
                    />
                    <FeatureCard 
                        to="/campus/lost-and-found" 
                        icon={<ArchiveBoxIcon className="w-7 h-7 md:w-8 md:h-8 text-white" />} 
                        title="Lost & Found" 
                        description="Report or find lost items on campus"
                        gradient="from-orange-500 to-red-600"
                    />
                    <FeatureCard 
                        to="/campus/marketplace" 
                        icon={<ShoppingCartIcon className="w-7 h-7 md:w-8 md:h-8 text-white" />} 
                        title="Marketplace" 
                        description="Buy, sell, and trade items with students"
                        gradient="from-green-500 to-teal-600"
                    />
                </div>
            </div>

            {/* Enhanced What's Happening Section */}
            <div className="mt-20">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-1 w-16 bg-gradient-to-r from-brand-green to-transparent rounded-full"></div>
                            <h2 className="text-4xl font-extrabold text-text-main-light dark:text-text-main">What's Happening</h2>
                        </div>
                        <p className="text-text-secondary-light dark:text-text-secondary text-lg ml-20">
                            Latest updates from around campus
                        </p>
                    </div>
                </div>
                
                {loadingPreviews ? (
                    <div className="flex justify-center items-center p-32 bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-3xl border border-tertiary-light dark:border-tertiary">
                        <Spinner />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                        {/* Top Rated Places */}
                        <div className="space-y-5">
                            <div className="flex items-center space-x-3">
                                <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full shadow-lg"></div>
                                <div>
                                    <h3 className="text-xl font-bold text-text-main-light dark:text-text-main">Top Rated Places</h3>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary">Best reviewed spots</p>
                                </div>
                            </div>
                            {topPlaces.length > 0 ? (
                                <div className="space-y-4">
                                    {topPlaces.map(place => <MiniPlaceCard key={place.id} place={place} />)}
                                </div>
                            ) : (
                                <div className="bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl p-10 text-center border-2 border-dashed border-tertiary-light dark:border-tertiary h-full flex flex-col justify-center">
                                    <div className="inline-block p-5 bg-blue-500/10 rounded-full mb-4 mx-auto">
                                        <StarIcon className="w-12 h-12 text-blue-500 opacity-50" />
                                    </div>
                                    <p className="text-sm text-text-tertiary-light dark:text-text-tertiary font-medium">
                                        No places reviewed yet.<br/>Be the first!
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Latest Notices */}
                        <div className="space-y-5">
                            <div className="flex items-center space-x-3">
                                <div className="w-1.5 h-8 bg-gradient-to-b from-yellow-500 to-amber-600 rounded-full shadow-lg"></div>
                                <div>
                                    <h3 className="text-xl font-bold text-text-main-light dark:text-text-main">Latest Notices</h3>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary">Campus announcements</p>
                                </div>
                            </div>
                            {latestNotices.length > 0 ? (
                                <div className="space-y-4">
                                    {latestNotices.map(notice => <MiniNoticeCard key={notice.id} notice={notice} />)}
                                </div>
                            ) : (
                                <div className="bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl p-10 text-center border-2 border-dashed border-tertiary-light dark:border-tertiary h-full flex flex-col justify-center">
                                    <div className="inline-block p-5 bg-yellow-500/10 rounded-full mb-4 mx-auto">
                                        <ClipboardDocumentListIcon className="w-12 h-12 text-yellow-500 opacity-50" />
                                    </div>
                                    <p className="text-sm text-text-tertiary-light dark:text-text-tertiary font-medium">
                                        Noticeboard is clear!
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Fresh on Market */}
                        <div className="space-y-5">
                            <div className="flex items-center space-x-3">
                                <div className="w-1.5 h-8 bg-gradient-to-b from-green-500 to-teal-600 rounded-full shadow-lg"></div>
                                <div>
                                    <h3 className="text-xl font-bold text-text-main-light dark:text-text-main">Fresh on Market</h3>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary">Latest listings</p>
                                </div>
                            </div>
                            {newestListings.length > 0 ? (
                                <ListingCard listing={newestListings[0]} onClick={() => {}} />
                            ) : (
                                <div className="bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl p-10 text-center border-2 border-dashed border-tertiary-light dark:border-tertiary h-full flex flex-col justify-center">
                                    <div className="inline-block p-5 bg-green-500/10 rounded-full mb-4 mx-auto">
                                        <ShoppingCartIcon className="w-12 h-12 text-green-500 opacity-50" />
                                    </div>
                                    <p className="text-sm text-text-tertiary-light dark:text-text-tertiary font-medium">
                                        Marketplace is empty.<br/>List something!
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Lost & Found */}
                        <div className="space-y-5">
                            <div className="flex items-center space-x-3">
                                <div className="w-1.5 h-8 bg-gradient-to-b from-orange-500 to-red-600 rounded-full shadow-lg"></div>
                                <div>
                                    <h3 className="text-xl font-bold text-text-main-light dark:text-text-main">Lost & Found</h3>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary">Recent reports</p>
                                </div>
                            </div>
                            {latestLostItem ? (
                                <MiniLostItemCard item={latestLostItem} />
                            ) : (
                                <div className="bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl p-10 text-center border-2 border-dashed border-tertiary-light dark:border-tertiary h-full flex flex-col justify-center">
                                    <div className="inline-block p-5 bg-orange-500/10 rounded-full mb-4 mx-auto">
                                        <ArchiveBoxIcon className="w-12 h-12 text-orange-500 opacity-50" />
                                    </div>
                                    <p className="text-sm text-text-tertiary-light dark:text-text-tertiary font-medium">
                                        Nothing reported recently.<br/>Stay vigilant!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Call to Action Section */}
            <div className="mt-20 relative bg-gradient-to-r from-brand-green/20 via-brand-green/10 to-transparent dark:from-brand-green/10 dark:via-brand-green/5 dark:to-transparent p-12 rounded-3xl border border-brand-green/30 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10 text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-text-main-light dark:text-text-main mb-4">
                        Ready to Contribute?
                    </h2>
                    <p className="text-lg text-text-secondary-light dark:text-text-secondary mb-8">
                        Help build a vibrant campus community by sharing reviews, posting listings, or helping someone find their lost items.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link 
                            to="/campus/reviews" 
                            className="group px-8 py-4 bg-gradient-to-r from-brand-green to-brand-green-darker text-black font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                        >
                            <span>Write a Review</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                        <Link 
                            to="/campus/marketplace" 
                            className="px-8 py-4 bg-secondary-light dark:bg-secondary text-text-main-light dark:text-text-main font-bold rounded-xl border-2 border-tertiary-light dark:border-tertiary hover:border-brand-green hover:shadow-xl hover:scale-105 transition-all duration-300"
                        >
                            Browse Marketplace
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampusPage;