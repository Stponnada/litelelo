// src/pages/CampusPage.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { CampusPlace, MarketplaceListing, LostAndFoundItem, CampusNotice } from '../types';
import ListingCard from '../components/ListingCard';
import Spinner from '../components/Spinner';
import { ArchiveBoxIcon, ShoppingCartIcon, StarIcon, ClipboardDocumentListIcon, CurrencyDollarIcon, CarIcon, CampusPlacesIcon } from '../components/icons';



const FeatureCard: React.FC<{ to: string; icon: React.ReactNode; title: string; description: string; gradient: string }> = ({ to, icon, title, description, gradient }) => (
    <Link to={to} className="group relative block bg-gradient-to-br from-secondary-light to-secondary-light dark:from-secondary dark:to-secondary rounded-xl md:rounded-2xl p-3 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-tertiary-light dark:border-tertiary hover:border-transparent">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
        <div className={`absolute top-0 right-0 w-20 md:w-32 h-20 md:h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl -mr-10 md:-mr-16 -mt-10 md:-mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
        
        <div className="relative z-10">
            <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
                <div className={`bg-gradient-to-br ${gradient} p-2.5 md:p-4 rounded-xl md:rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <h3 className="text-xs md:text-lg font-bold text-text-main-light dark:text-text-main group-hover:text-white transition-colors duration-300 leading-tight">
                        {title}
                    </h3>
                    <p className="hidden md:block mt-2 text-xs md:text-sm text-text-secondary-light dark:text-text-secondary group-hover:text-white/90 leading-relaxed transition-colors duration-300">
                        {description}
                    </p>
                </div>
                <div className="hidden md:flex items-center text-brand-green group-hover:text-white font-bold text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
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
    <Link to={`/campus/reviews/${place.id}`} className="group block bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-md hover:shadow-2xl transition-all duration-300 border border-tertiary-light dark:border-tertiary hover:border-brand-green hover:-translate-y-1 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 md:w-24 h-16 md:h-24 bg-brand-green/5 rounded-full blur-2xl -mr-8 md:-mr-12 -mt-8 md:-mt-12 group-hover:scale-150 transition-transform duration-500"></div>
        <div className="relative z-10 flex items-center space-x-3 md:space-x-4">
            <div className="relative overflow-hidden rounded-lg md:rounded-xl ring-2 ring-tertiary-light dark:ring-tertiary group-hover:ring-brand-green transition-all duration-300 flex-shrink-0">
                <img src={place.primary_image_url || 'https://placehold.co/100x100'} alt={place.name} className="w-14 h-14 md:w-20 md:h-20 object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-green/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm md:text-lg text-text-main-light dark:text-text-main truncate group-hover:text-brand-green transition-colors duration-300">
                    {place.name}
                </h4>
                <div className="flex items-center mt-1.5 md:mt-2 space-x-2">
                    <div className="flex items-center bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-yellow-400/30">
                        <StarIcon className="w-3 md:w-4 h-3 md:h-4 text-yellow-400" />
                        <span className="font-bold ml-1 text-xs md:text-sm text-yellow-400">{place.avg_rating.toFixed(1)}</span>
                    </div>
                    <span className="text-[10px] md:text-xs text-text-tertiary-light dark:text-text-tertiary font-semibold">
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
        <div className="group bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-md border border-tertiary-light dark:border-tertiary hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-16 md:w-24 h-16 md:h-24 ${isLost ? 'bg-red-500/5' : 'bg-green-500/5'} rounded-full blur-2xl -mr-8 md:-mr-12 -mt-8 md:-mt-12 group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="relative z-10 flex items-center space-x-3 md:space-x-4">
                <div className="relative overflow-hidden rounded-lg md:rounded-xl ring-2 ring-tertiary-light dark:ring-tertiary transition-all duration-300 flex-shrink-0">
                    <img src={item.image_url || 'https://placehold.co/100x100'} alt={item.title} className="w-14 h-14 md:w-20 md:h-20 object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className={`absolute top-1 right-1 md:top-2 md:right-2 w-2 md:w-3 h-2 md:h-3 rounded-full ${isLost ? 'bg-red-500' : 'bg-green-500'} shadow-lg animate-pulse`}></div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className={`inline-flex items-center px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase mb-1.5 md:mb-2 border ${isLost ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                        {item.item_type}
                    </div>
                    <h4 className="font-bold text-sm md:text-base text-text-main-light dark:text-text-main truncate group-hover:text-brand-green transition-colors duration-300">
                        {item.title}
                    </h4>
                    <div className="flex items-center text-[10px] md:text-xs text-text-tertiary-light dark:text-text-tertiary mt-1 md:mt-1.5 space-x-1">
                        <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-brand-green rounded-full"></div>
                        <span className="truncate font-medium">{item.location_found}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MiniNoticeCard: React.FC<{ notice: CampusNotice }> = ({ notice }) => (
    <Link to="/campus/noticeboard" className="group block bg-gradient-to-br from-yellow-50 to-amber-50/50 dark:from-yellow-900/20 dark:to-amber-900/10 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-md hover:shadow-2xl transition-all duration-300 border border-yellow-200/50 dark:border-yellow-800/50 hover:border-yellow-400 hover:-translate-y-1 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 md:w-24 h-16 md:h-24 bg-yellow-400/10 rounded-full blur-2xl -mr-8 md:-mr-12 -mt-8 md:-mt-12 group-hover:scale-150 transition-transform duration-500"></div>
        <div className="relative z-10 flex items-center space-x-3 md:space-x-4">
            <div className="relative overflow-hidden rounded-lg md:rounded-xl ring-2 ring-yellow-200/50 dark:ring-yellow-800/50 group-hover:ring-yellow-400 transition-all duration-300 flex-shrink-0">
                <img src={notice.files[0]?.file_type === 'image' ? notice.files[0].file_url : 'https://placehold.co/100x100/fde68a/422006?text=PDF'} alt={notice.title} className="w-14 h-14 md:w-20 md:h-20 object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm md:text-base text-gray-800 dark:text-yellow-100 truncate group-hover:text-yellow-600 dark:group-hover:text-yellow-300 transition-colors duration-300">
                    {notice.title}
                </h4>
                <p className="text-[10px] md:text-xs text-gray-600 dark:text-yellow-200/70 mt-1 md:mt-1.5 font-medium truncate">
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
            {/* Compact Hero Section */}
            {/* <div className="relative bg-gradient-to-br from-brand-green/20 via-blue-500/10 to-purple-500/10 dark:from-brand-green/10 dark:via-blue-500/5 dark:to-purple-500/5 p-4 md:p-16 rounded-xl md:rounded-3xl shadow-xl md:shadow-2xl border border-brand-green/20 mb-4 md:mb-16 overflow-hidden">*/}
                {/* Animated background blobs */}
                <div className="absolute top-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-brand-green/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-40 md:w-80 h-40 md:h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                
                <div className="relative text-center">
                     {/*<div className="hidden md:inline-flex items-center gap-2 mb-6 px-5 py-2.5 bg-gradient-to-r from-brand-green/30 to-brand-green/20 backdrop-blur-sm rounded-full border border-brand-green/30 shadow-lg">
                        <div className="w-2 h-2 bg-brand-green rounded-full animate-pulse"></div>
                       <span className="text-sm font-bold text-brand-green uppercase tracking-wider">Your Campus Hub</span>
                    </div>*/}
                    
                    <h1 className="text-xl md:text-7xl font-extrabold text-text-main-light dark:text-text-main leading-tight">
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
                    
                    <p className="hidden md:block text-lg md:text-2xl text-text-secondary-light dark:text-text-secondary max-w-2xl mx-auto font-medium leading-relaxed mt-3">
                        Your one-stop destination for campus services, reviews, and community connections
                    </p>
                    {/* Stats bar - Hidden on mobile */}
                </div>
            {/* </div>*/}

            {/* Compact Services Grid */}
            <div className="mb-8 md:mb-16">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-8">
                    <div className="h-0.5 md:h-1 w-8 md:w-16 bg-gradient-to-r from-brand-green to-transparent rounded-full"></div>
                    <h2 className="text-xl md:text-3xl font-extrabold text-text-main-light dark:text-text-main">Services</h2>
                </div>
                
                <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-6">
                    <FeatureCard 
                        to="/campus/reviews" 
                        icon={<CampusPlacesIcon className="w-5 h-5 md:w-8 md:h-8 text-white" />} 
                        title="Places" 
                        description="Review eateries, shops, and hangout spots around campus"
                        gradient="from-blue-500 to-purple-600"
                    />
                    <FeatureCard 
                        to="/campus/noticeboard" 
                        icon={<ClipboardDocumentListIcon className="w-5 h-5 md:w-8 md:h-8 text-white" />} 
                        title="Notices" 
                        description="View and post campus announcements and posters"
                        gradient="from-yellow-500 to-amber-600"
                    />
                    <FeatureCard 
                        to="/campus/bits-coin" 
                        icon={<CurrencyDollarIcon className="w-5 h-5 md:w-8 md:h-8 text-white" />} 
                        title="Bits-coin" 
                        description="Post small tasks for others to complete for a reward"
                        gradient="from-emerald-500 to-green-600"
                    />
                    <FeatureCard 
                        to="/campus/ride-share"
                        icon={<CarIcon className="w-5 h-5 md:w-8 md:h-8 text-white" />} 
                        title="Rides" 
                        description="Coordinate travel to the airport or home"
                        gradient="from-sky-500 to-indigo-600"
                    />
                    <FeatureCard 
                        to="/campus/lost-and-found" 
                        icon={<ArchiveBoxIcon className="w-5 h-5 md:w-8 md:h-8 text-white" />} 
                        title="Lost & Found" 
                        description="Report or find lost items on campus"
                        gradient="from-orange-500 to-red-600"
                    />
                    <FeatureCard 
                        to="/campus/marketplace" 
                        icon={<ShoppingCartIcon className="w-5 h-5 md:w-8 md:h-8 text-white" />} 
                        title="Market" 
                        description="Buy, sell, and trade items with students"
                        gradient="from-green-500 to-teal-600"
                    />
                </div>
            </div>

            {/* Compact What's Happening Section */}
            <div className="mt-8 md:mt-20">
                <div className="flex items-center justify-between mb-4 md:mb-10">
                    <div>
                        <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                            <div className="h-0.5 md:h-1 w-8 md:w-16 bg-gradient-to-r from-brand-green to-transparent rounded-full"></div>
                            <h2 className="text-xl md:text-3xl font-extrabold text-text-main-light dark:text-text-main">What's Happening</h2>
                        </div>
                        <p className="hidden md:block text-text-secondary-light dark:text-text-secondary text-lg ml-20">
                            Latest updates from around campus
                        </p>
                    </div>
                </div>
                
                {loadingPreviews ? (
                    <div className="flex justify-center items-center p-16 md:p-32 bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl md:rounded-3xl border border-tertiary-light dark:border-tertiary">
                        <Spinner />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-8">
                        {/* Top Rated Places */}
                        <div className="space-y-3 md:space-y-5">
                            <div className="flex items-center space-x-2 md:space-x-3">
                                <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full shadow-lg"></div>
                                <div>
                                    <h3 className="text-base md:text-xl font-bold text-text-main-light dark:text-text-main">Top Places</h3>
                                    <p className="hidden md:block text-xs text-text-secondary-light dark:text-text-secondary">Best reviewed spots</p>
                                </div>
                            </div>
                            {topPlaces.length > 0 ? (
                                <div className="space-y-3 md:space-y-4">
                                    {topPlaces.map(place => <MiniPlaceCard key={place.id} place={place} />)}
                                </div>
                            ) : (
                                <div className="bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-xl md:rounded-2xl p-6 md:p-10 text-center border-2 border-dashed border-tertiary-light dark:border-tertiary h-full flex flex-col justify-center">
                                    <div className="inline-block p-3 md:p-5 bg-blue-500/10 rounded-full mb-3 md:mb-4 mx-auto">
                                        <StarIcon className="w-8 md:w-12 h-8 md:h-12 text-blue-500 opacity-50" />
                                    </div>
                                    <p className="text-xs md:text-sm text-text-tertiary-light dark:text-text-tertiary font-medium">
                                        No places reviewed yet.<br/>Be the first!
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Latest Notices */}
                        <div className="space-y-3 md:space-y-5">
                            <div className="flex items-center space-x-2 md:space-x-3">
                                <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-yellow-500 to-amber-600 rounded-full shadow-lg"></div>
                                <div>
                                    <h3 className="text-base md:text-xl font-bold text-text-main-light dark:text-text-main">Notices</h3>
                                    <p className="hidden md:block text-xs text-text-secondary-light dark:text-text-secondary">Campus announcements</p>
                                </div>
                            </div>
                            {latestNotices.length > 0 ? (
                                <div className="space-y-3 md:space-y-4">
                                    {latestNotices.map(notice => <MiniNoticeCard key={notice.id} notice={notice} />)}
                                </div>
                            ) : (
                                <div className="bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-xl md:rounded-2xl p-6 md:p-10 text-center border-2 border-dashed border-tertiary-light dark:border-tertiary h-full flex flex-col justify-center">
                                    <div className="inline-block p-3 md:p-5 bg-yellow-500/10 rounded-full mb-3 md:mb-4 mx-auto">
                                        <ClipboardDocumentListIcon className="w-8 md:w-12 h-8 md:h-12 text-yellow-500 opacity-50" />
                                    </div>
                                    <p className="text-xs md:text-sm text-text-tertiary-light dark:text-text-tertiary font-medium">
                                        Noticeboard is clear!
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Fresh on Market */}
                        <div className="space-y-3 md:space-y-5">
                            <div className="flex items-center space-x-2 md:space-x-3">
                                <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-green-500 to-teal-600 rounded-full shadow-lg"></div>
                                <div>
                                    <h3 className="text-base md:text-xl font-bold text-text-main-light dark:text-text-main">Market</h3>
                                    <p className="hidden md:block text-xs text-text-secondary-light dark:text-text-secondary">Latest listings</p>
                                </div>
                            </div>
                            {newestListings.length > 0 ? (
                                <ListingCard listing={newestListings[0]} onClick={() => {}} />
                            ) : (
                                <div className="bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-xl md:rounded-2xl p-6 md:p-10 text-center border-2 border-dashed border-tertiary-light dark:border-tertiary h-full flex flex-col justify-center">
                                    <div className="inline-block p-3 md:p-5 bg-green-500/10 rounded-full mb-3 md:mb-4 mx-auto">
                                        <ShoppingCartIcon className="w-8 md:w-12 h-8 md:h-12 text-green-500 opacity-50" />
                                    </div>
                                    <p className="text-xs md:text-sm text-text-tertiary-light dark:text-text-tertiary font-medium">
                                        Marketplace is empty.<br/>List something!
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Lost & Found */}
                        <div className="space-y-3 md:space-y-5">
                            <div className="flex items-center space-x-2 md:space-x-3">
                                <div className="w-1 md:w-1.5 h-6 md:h-8 bg-gradient-to-b from-orange-500 to-red-600 rounded-full shadow-lg"></div>
                                <div>
                                    <h3 className="text-base md:text-xl font-bold text-text-main-light dark:text-text-main">Lost & Found</h3>
                                    <p className="hidden md:block text-xs text-text-secondary-light dark:text-text-secondary">Recent reports</p>
                                </div>
                            </div>
                            {latestLostItem ? (
                                <MiniLostItemCard item={latestLostItem} />
                            ) : (
                                <div className="bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-xl md:rounded-2xl p-6 md:p-10 text-center border-2 border-dashed border-tertiary-light dark:border-tertiary h-full flex flex-col justify-center">
                                    <div className="inline-block p-3 md:p-5 bg-orange-500/10 rounded-full mb-3 md:mb-4 mx-auto">
                                        <ArchiveBoxIcon className="w-8 md:w-12 h-8 md:h-12 text-orange-500 opacity-50" />
                                    </div>
                                    <p className="text-xs md:text-sm text-text-tertiary-light dark:text-text-tertiary font-medium">
                                        Nothing reported recently.<br/>Stay vigilant!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Compact Call to Action Section */}
            <div className="mt-8 md:mt-20 relative bg-gradient-to-r from-brand-green/20 via-brand-green/10 to-transparent dark:from-brand-green/10 dark:via-brand-green/5 dark:to-transparent p-6 md:p-12 rounded-2xl md:rounded-3xl border border-brand-green/30 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-brand-green/10 rounded-full blur-3xl -mr-16 md:-mr-32 -mt-16 md:-mt-32"></div>
                <div className="relative z-10 text-center max-w-3xl mx-auto">
                    <h2 className="text-xl md:text-4xl font-extrabold text-text-main-light dark:text-text-main mb-2 md:mb-4">
                        Ready to Contribute?
                    </h2>
                    <p className="text-sm md:text-lg text-text-secondary-light dark:text-text-secondary mb-4 md:mb-8">
                        Help build a vibrant campus community by sharing reviews, posting listings, or helping someone find their lost items.
                    </p>
                    <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 md:gap-4">
                        <Link 
                            to="/campus/reviews" 
                            className="group px-5 md:px-8 py-2.5 md:py-4 bg-gradient-to-r from-brand-green to-brand-green-darker text-black text-sm md:text-base font-bold rounded-lg md:rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <span>Write a Review</span>
                            <svg className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                        <Link 
                            to="/campus/marketplace" 
                            className="px-5 md:px-8 py-2.5 md:py-4 bg-secondary-light dark:bg-secondary text-text-main-light dark:text-text-main text-sm md:text-base font-bold rounded-lg md:rounded-xl border-2 border-tertiary-light dark:border-tertiary hover:border-brand-green hover:shadow-xl hover:scale-105 transition-all duration-300"
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