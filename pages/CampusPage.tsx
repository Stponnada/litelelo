// src/pages/CampusPage.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { CampusPlace, MarketplaceListing, LostAndFoundItem, CampusNotice } from '../types';
import ListingCard from '../components/ListingCard';
import Spinner from '../components/Spinner';
import { ArchiveBoxIcon, ShoppingCartIcon, StarIcon, ClipboardDocumentListIcon } from '../components/icons';

const CampusPlacesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={className} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" 
        />
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M10 12h4v5h-4v-5z" 
        />
    </svg>
);


const FeatureCard: React.FC<{ to: string; icon: React.ReactNode; title: string; description: string; gradient: string }> = ({ to, icon, title, description, gradient }) => (
    <Link to={to} className="group relative block bg-secondary-light dark:bg-secondary rounded-xl p-4 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
        <div className="relative">
            <div className="flex flex-col items-center text-center md:flex-row md:items-start md:space-x-4 md:text-left">
                <div className={`bg-gradient-to-br ${gradient} p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300 mb-2 md:mb-0`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <h3 className="text-sm md:text-xl font-bold text-text-main-light dark:text-text-main group-hover:text-brand-green transition-colors duration-300">{title}</h3>
                    <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary leading-relaxed hidden md:block">{description}</p>
                </div>
            </div>
            <div className="mt-4 hidden md:flex items-center text-brand-green font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span>Explore</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </div>
    </Link>
);

const MiniPlaceCard: React.FC<{ place: CampusPlace }> = ({ place }) => (
    <Link to={`/campus/reviews/${place.id}`} className="group block bg-secondary-light dark:bg-secondary rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-tertiary-light dark:border-tertiary hover:border-brand-green/50">
        <div className="flex items-center space-x-4">
            <div className="relative overflow-hidden rounded-lg">
                <img src={place.primary_image_url || 'https://placehold.co/100x100'} alt={place.name} className="w-20 h-20 object-cover group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-text-main-light dark:text-text-main truncate group-hover:text-brand-green transition-colors duration-300">{place.name}</h4>
                <div className="flex items-center mt-2">
                    <div className="flex items-center bg-yellow-400/20 px-2 py-1 rounded-full">
                        <StarIcon className="w-4 h-4 text-yellow-400" />
                        <span className="font-bold ml-1 text-sm text-yellow-400">{place.avg_rating.toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-text-tertiary-light dark:text-text-tertiary ml-2">({place.review_count})</span>
                </div>
            </div>
        </div>
    </Link>
);

const MiniLostItemCard: React.FC<{ item: LostAndFoundItem }> = ({ item }) => {
    const isLost = item.item_type === 'lost';
    return (
        <div className="group bg-secondary-light dark:bg-secondary rounded-xl p-4 shadow-md border border-tertiary-light dark:border-tertiary hover:shadow-lg transition-all duration-300">
            <div className="flex items-center space-x-4">
                <div className="relative overflow-hidden rounded-lg">
                    <img src={item.image_url || 'https://placehold.co/100x100'} alt={item.title} className="w-20 h-20 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${isLost ? 'bg-red-500' : 'bg-green-500'} shadow-lg`}></div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold uppercase mb-1 ${isLost ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {item.item_type}
                    </div>
                    <h4 className="font-bold text-text-main-light dark:text-text-main truncate">{item.title}</h4>
                    <p className="text-xs text-text-tertiary-light dark:text-text-tertiary truncate mt-1">
                        <span className="inline-block w-1 h-1 bg-brand-green rounded-full mr-1"></span>
                        {item.location_found}
                    </p>
                </div>
            </div>
        </div>
    );
};

// New preview card for Noticeboard
const MiniNoticeCard: React.FC<{ notice: CampusNotice }> = ({ notice }) => (
    <Link to="/campus/noticeboard" className="group block bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-yellow-200/50 dark:border-yellow-800/50 hover:border-yellow-400/50">
        <div className="flex items-center space-x-4">
            <div className="relative overflow-hidden rounded-lg">
                <img src={notice.files[0]?.file_type === 'image' ? notice.files[0].file_url : 'https://placehold.co/100x100/fde68a/422006?text=PDF'} alt={notice.title} className="w-20 h-20 object-cover group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 dark:text-yellow-100 truncate group-hover:text-yellow-600 dark:group-hover:text-yellow-300 transition-colors duration-300">{notice.title}</h4>
                <p className="text-xs text-gray-500 dark:text-yellow-200/70 mt-1 truncate">
                    Posted by @{notice.profiles?.username}
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
        <div className="max-w-7xl mx-auto">
            <div className="relative bg-gradient-to-br from-brand-green/10 via-secondary-light to-secondary-light dark:from-brand-green/5 dark:via-secondary dark:to-secondary p-8 md:p-12 rounded-2xl shadow-2xl border border-tertiary-light dark:border-tertiary mb-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
                <div className="relative text-center">
                    <div className="inline-block mb-4 px-4 py-2 bg-brand-green/20 rounded-full">
                        <span className="text-sm font-semibold text-brand-green">Your Campus Hub</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-text-main-light dark:text-text-main mb-4">
                       Today at BITS <span className="text-brand-green">{displayedText}</span><span className={`text-brand-green ${isTyping ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>|</span>
                    </h1>
                    <p className="text-lg md:text-xl text-text-secondary-light dark:text-text-secondary max-w-2xl mx-auto hidden md:block">
                        Your one-stop destination for campus services, reviews, and community connections
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
                <FeatureCard 
                    to="/campus/reviews" 
                    icon={<CampusPlacesIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />} 
                    title="Campus Places" 
                    description="Review eateries, shops, and hangout spots"
                    gradient="from-blue-500 to-purple-600"
                />
                 <FeatureCard 
                    to="/campus/noticeboard" 
                    icon={<ClipboardDocumentListIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />} 
                    title="Noticeboard" 
                    description="View and post campus announcements and posters"
                    gradient="from-yellow-500 to-amber-600"
                />
                <FeatureCard 
                    to="/campus/lost-and-found" 
                    icon={<ArchiveBoxIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />} 
                    title="Lost & Found" 
                    description="Report or find lost items on campus"
                    gradient="from-orange-500 to-red-600"
                />
                <FeatureCard 
                    to="/campus/marketplace" 
                    icon={<ShoppingCartIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />} 
                    title="Marketplace" 
                    description="Buy, sell, and trade items with students"
                    gradient="from-green-500 to-teal-600"
                />
            </div>

            <div className="mt-16">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-text-main-light dark:text-text-main">What's Happening</h2>
                        <p className="text-text-secondary-light dark:text-text-secondary mt-1">Latest updates from around campus</p>
                    </div>
                    <div className="hidden md:block w-24 h-1 bg-gradient-to-r from-brand-green to-transparent rounded-full"></div>
                </div>
                
                {loadingPreviews ? (
                    <div className="flex justify-center items-center p-20">
                        <Spinner />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                <h3 className="text-xl font-bold text-text-main-light dark:text-text-main">Top Rated Places</h3>
                            </div>
                            {topPlaces.length > 0 ? (
                                <div className="space-y-3">
                                    {topPlaces.map(place => <MiniPlaceCard key={place.id} place={place} />)}
                                </div>
                            ) : (
                                <div className="bg-secondary-light dark:bg-secondary rounded-xl p-8 text-center border-2 border-dashed border-tertiary-light dark:border-tertiary h-full flex flex-col justify-center">
                                    <StarIcon className="w-12 h-12 text-text-tertiary-light dark:text-text-tertiary mx-auto mb-3 opacity-50" />
                                    <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">No places reviewed yet. Be the first!</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                             <div className="flex items-center space-x-2 mb-4">
                                <div className="w-1 h-6 bg-yellow-500 rounded-full"></div>
                                <h3 className="text-xl font-bold text-text-main-light dark:text-text-main">Latest Notices</h3>
                            </div>
                            {latestNotices.length > 0 ? (
                                <div className="space-y-3">
                                    {latestNotices.map(notice => <MiniNoticeCard key={notice.id} notice={notice} />)}
                                </div>
                            ) : (
                                <div className="bg-secondary-light dark:bg-secondary rounded-xl p-8 text-center border-2 border-dashed border-tertiary-light dark:border-tertiary h-full flex flex-col justify-center">
                                    <ClipboardDocumentListIcon className="w-12 h-12 text-text-tertiary-light dark:text-text-tertiary mx-auto mb-3 opacity-50" />
                                    <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">Noticeboard is clear!</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                                <h3 className="text-xl font-bold text-text-main-light dark:text-text-main">Fresh on Market</h3>
                            </div>
                            {newestListings.length > 0 ? (
                                <ListingCard listing={newestListings[0]} onClick={() => {}} />
                            ) : (
                                <div className="bg-secondary-light dark:bg-secondary rounded-xl p-8 text-center border-2 border-dashed border-tertiary-light dark:border-tertiary h-full flex flex-col justify-center">
                                    <ShoppingCartIcon className="w-12 h-12 text-text-tertiary-light dark:text-text-tertiary mx-auto mb-3 opacity-50" />
                                    <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">Marketplace is empty. List something!</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                                <h3 className="text-xl font-bold text-text-main-light dark:text-text-main">Lost & Found</h3>
                            </div>
                            {latestLostItem ? (
                                <MiniLostItemCard item={latestLostItem} />
                            ) : (
                                <div className="bg-secondary-light dark:bg-secondary rounded-xl p-8 text-center border-2 border-dashed border-tertiary-light dark:border-tertiary h-full flex flex-col justify-center">
                                    <ArchiveBoxIcon className="w-12 h-12 text-text-tertiary-light dark:text-text-tertiary mx-auto mb-3 opacity-50" />
                                    <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">Nothing reported recently. Stay vigilant!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampusPage;