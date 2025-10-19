import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { CampusPlace } from '../types';
import Spinner from '../components/Spinner';
import { StarIcon } from '../components/icons';
import CampusImageUploadModal from '../components/CampusImageUploadModal';

const DEV_USER_ID = '70941ce5-121b-47e3-b6c7-fef1aa069316';

const PlaceCard: React.FC<{ place: CampusPlace; onEditImages: (place: CampusPlace) => void; isDev: boolean }> = ({ place, onEditImages, isDev }) => {
    const ratingColor = place.avg_rating >= 4.5 ? 'text-green-500' : place.avg_rating >= 3.5 ? 'text-yellow-500' : 'text-orange-500';
    
    return (
        <div className="group relative bg-gradient-to-br from-secondary-light to-secondary-light dark:from-secondary dark:to-secondary rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-tertiary-light dark:border-tertiary hover:border-purple-500 hover:-translate-y-2 hover:shadow-purple-500/20">
            {/* Decorative gradient overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            
            <Link to={`/campus/reviews/${place.id}`} className="block">
                <div className="relative overflow-hidden">
                    <img 
                        className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-110" 
                        src={place.primary_image_url || 'https://placehold.co/600x400/1e293b/3cfba2?text=No+Image'} 
                        alt={place.name} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="absolute top-3 left-3">
                        <span className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wide rounded-xl shadow-lg">
                            {place.category}
                        </span>
                    </div>
                    
                    <div className="absolute top-3 right-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
                        <StarIcon className={`w-5 h-5 ${ratingColor} fill-current`} />
                        <span className={`font-bold text-base ${ratingColor}`}>
                            {place.avg_rating.toFixed(1)}
                        </span>
                    </div>
                </div>
            </Link>
            
            <div className="relative z-10 p-5">
                <Link to={`/campus/reviews/${place.id}`}>
                    <h3 className="text-xl font-bold text-text-main-light dark:text-text-main group-hover:text-purple-500 transition-colors line-clamp-1 mb-3">
                        {place.name}
                    </h3>
                </Link>
                
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <StarIcon 
                                key={i}
                                className={`w-5 h-5 ${
                                    i < Math.floor(place.avg_rating) 
                                        ? `${ratingColor} fill-current` 
                                        : 'text-gray-300 dark:text-gray-600'
                                }`}
                            />
                        ))}
                    </div>
                    <span className="text-text-tertiary-light dark:text-text-tertiary font-semibold text-sm px-3 py-1 bg-tertiary-light/50 dark:bg-tertiary/50 rounded-full">
                        {place.review_count} {place.review_count === 1 ? 'review' : 'reviews'}
                    </span>
                </div>
                
                <Link 
                    to={`/campus/reviews/${place.id}`}
                    className="flex items-center gap-2 text-purple-500 font-bold text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1"
                >
                    <span>View details</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>

            {isDev && (
                <button 
                    onClick={() => onEditImages(place)}
                    className="absolute bottom-3 right-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
                >
                    Edit Images
                </button>
            )}
        </div>
    );
};

const CampusDirectoryPage: React.FC = () => {
    const { profile, user } = useAuth();
    const [places, setPlaces] = useState<CampusPlace[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [editingPlace, setEditingPlace] = useState<CampusPlace | null>(null);

    const fetchPlaces = useCallback(async () => {
        if (!profile?.campus) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('get_campus_places_with_ratings', { p_campus: profile.campus });
            if (rpcError) throw rpcError;
            setPlaces(data as CampusPlace[] || []);
        } catch (err: any) {
            console.error("Error fetching places:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [profile?.campus]);

    useEffect(() => {
        fetchPlaces();
    }, [fetchPlaces]);

    const categories = useMemo(() => {
        const cats = Array.from(new Set(places.map(p => p.category))).sort();
        return ['all', ...cats];
    }, [places]);

    const filteredPlaces = useMemo(() => {
        return places.filter(place => {
            const matchesSearch = place.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || place.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [places, searchTerm, selectedCategory]);

    const groupedPlaces = useMemo(() => {
        return filteredPlaces.reduce((acc, place) => {
            const location = place.location || 'Other';
            if (!acc[location]) {
                acc[location] = [];
            }
            acc[location].push(place);
            return acc;
        }, {} as Record<string, CampusPlace[]>);
    }, [filteredPlaces]);

    const stats = useMemo(() => {
        const totalPlaces = places.length;
        const totalReviews = places.reduce((sum, place) => sum + place.review_count, 0);
        const avgRating = places.length > 0 
            ? places.reduce((sum, place) => sum + place.avg_rating, 0) / places.length 
            : 0;
        
        return { totalPlaces, totalReviews, avgRating };
    }, [places]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800/30 rounded-2xl p-8 text-center">
                    <div className="inline-block p-5 bg-red-500/10 rounded-full mb-4">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-red-600 dark:text-red-400 font-bold text-xl mb-2">Error loading places</p>
                    <p className="text-red-500 dark:text-red-500 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {editingPlace && (
                <CampusImageUploadModal 
                    place={editingPlace}
                    onClose={() => setEditingPlace(null)}
                    onSuccess={fetchPlaces}
                />
            )}
            
            {/* Enhanced Hero Header */}
            <header className="mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-transparent dark:from-purple-500/10 dark:via-blue-500/5 p-8 border border-purple-500/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-24 -mb-24"></div>
                
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
                        <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-5xl font-extrabold text-text-main-light dark:text-text-main bg-gradient-to-r from-purple-500 to-blue-600 bg-clip-text text-transparent mb-2">
                                Campus Places
                            </h1>
                            <p className="text-lg text-text-secondary-light dark:text-text-secondary">
                                Discover and review the best spots at {profile?.campus || 'your campus'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
                            <div className="flex items-center gap-2 mb-1">
                                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                <p className="text-3xl font-bold text-purple-500">{stats.totalPlaces}</p>
                            </div>
                            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary font-bold uppercase tracking-wide">Places</p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
                            <div className="flex items-center gap-2 mb-1">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                <p className="text-3xl font-bold text-blue-500">{stats.totalReviews}</p>
                            </div>
                            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary font-bold uppercase tracking-wide">Reviews</p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20">
                            <div className="flex items-center gap-2 mb-1">
                                <StarIcon className="w-5 h-5 text-yellow-500 fill-current" />
                                <p className="text-3xl font-bold text-yellow-500">{stats.avgRating.toFixed(1)}</p>
                            </div>
                            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary font-bold uppercase tracking-wide">Avg Rating</p>
                        </div>
                    </div>
                </div>
            </header>
            
            {/* Enhanced Search & Filter */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-1 w-12 bg-purple-500 rounded-full"></div>
                    <h2 className="text-sm font-bold text-text-secondary-light dark:text-text-secondary uppercase tracking-wider">Search & Filter</h2>
                </div>
                
                <div className="bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl p-6 shadow-lg border border-tertiary-light dark:border-tertiary">
                    <div className="flex flex-col lg:flex-row gap-4 mb-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search for places..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-5 py-3 pl-12 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-tertiary-light dark:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none font-medium"
                            />
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary-light dark:text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-200 ${
                                    selectedCategory === category
                                        ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                                        : 'bg-tertiary-light dark:bg-tertiary text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light/70 dark:hover:bg-tertiary/70 border border-tertiary-light dark:border-tertiary'
                                }`}
                            >
                                {category === 'all' ? 'All Places' : category}
                            </button>
                        ))}
                    </div>
                    
                    {(searchTerm || selectedCategory !== 'all') && (
                        <div className="mt-4 pt-4 border-t border-tertiary-light dark:border-tertiary flex items-center justify-between">
                            <p className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary">
                                Found <span className="text-purple-500 font-bold text-lg">{filteredPlaces.length}</span> {filteredPlaces.length === 1 ? 'place' : 'places'}
                                {searchTerm && <> matching "<span className="font-bold">{searchTerm}</span>"</>}
                                {selectedCategory !== 'all' && <> in <span className="font-bold">{selectedCategory}</span></>}
                            </p>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('all');
                                }}
                                className="text-xs font-bold text-purple-500 hover:text-purple-600 transition-colors"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Results */}
            <div className="space-y-12">
                {Object.keys(groupedPlaces).length > 0 ? (
                    Object.entries(groupedPlaces).map(([location, placesInLocation]) => (
                        <div key={location} className="animate-fade-in">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl">
                                    <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-3xl font-bold text-text-main-light dark:text-text-main">{location}</h2>
                                    <div className="h-1 bg-gradient-to-r from-purple-500 to-transparent rounded-full mt-2"></div>
                                </div>
                                <span className="px-4 py-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl text-purple-500 font-bold text-sm border border-purple-500/30">
                                    {placesInLocation.length} {placesInLocation.length === 1 ? 'place' : 'places'}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {placesInLocation.map(place => (
                                    <PlaceCard 
                                        key={place.id} 
                                        place={place} 
                                        onEditImages={setEditingPlace} 
                                        isDev={user?.id === DEV_USER_ID} 
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl border-2 border-dashed border-tertiary-light dark:border-tertiary">
                        <div className="inline-block p-6 bg-purple-500/10 rounded-full mb-4">
                            <svg className="w-16 h-16 text-purple-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main mb-2">
                            {searchTerm || selectedCategory !== 'all' ? 'No places found' : 'No places available yet'}
                        </h3>
                        <p className="text-text-secondary-light dark:text-text-secondary mb-6">
                            {searchTerm || selectedCategory !== 'all' 
                                ? 'Try adjusting your search or filters' 
                                : 'Check back later for new places'}
                        </p>
                        {(searchTerm || selectedCategory !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('all');
                                }}
                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampusDirectoryPage;