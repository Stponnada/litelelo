'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { CampusPlace } from '@/types';
import Spinner from '@/components/Spinner';
import { StarIcon } from '@/components/icons';
import CampusImageUploadModal from '@/components/CampusImageUploadModal';

const DEV_USER_ID = '70941ce5-121b-47e3-b6c7-fef1aa069316';

const PlaceCard: React.FC<{ place: CampusPlace; onEditImages: (place: CampusPlace) => void; isDev: boolean }> = ({ place, onEditImages, isDev }) => {
    return (
        <div className="group relative bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:-translate-y-1">
            <Link href={`/campus/reviews/${place.id}`} className="block">
                <div className="relative overflow-hidden h-48">
                    <Image
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        src={place.primary_image_url || 'https://placehold.co/600x400/18181b/71717a?text=No+Image'}
                        alt={place.name}
                        fill
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-zinc-900/80 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wide rounded-lg">
                            {place.category?.trim()}
                        </span>
                    </div>

                    <div className="absolute top-3 right-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow flex items-center gap-1.5">
                        <StarIcon className="w-4 h-4 text-zinc-700 dark:text-zinc-300 fill-current" />
                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {place.avg_rating.toFixed(1)}
                        </span>
                    </div>
                </div>
            </Link>

            <div className="p-4">
                <Link href={`/campus/reviews/${place.id}`}>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors line-clamp-1 mb-2">
                        {place.name}
                    </h3>
                </Link>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                            <StarIcon
                                key={i}
                                className={`w-4 h-4 ${i < Math.floor(place.avg_rating)
                                    ? 'text-zinc-700 dark:text-zinc-300 fill-current'
                                    : 'text-zinc-300 dark:text-zinc-600'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                        {place.review_count} {place.review_count === 1 ? 'review' : 'reviews'}
                    </span>
                </div>
            </div>

            {isDev && (
                <button
                    onClick={() => onEditImages(place)}
                    className="absolute bottom-3 right-3 bg-zinc-800 dark:bg-zinc-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
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
        } catch (err: unknown) {
            console.error("Error fetching places:", err);
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [profile?.campus]);

    useEffect(() => {
        fetchPlaces();
    }, [fetchPlaces]);

    const categories = useMemo(() => {
        const cats = Array.from(new Set(places.map(p => p.category?.trim()))).filter(Boolean).sort();
        return ['all', ...cats];
    }, [places]);

    const filteredPlaces = useMemo(() => {
        return places.filter(place => {
            const matchesSearch = place.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || place.category?.trim() === selectedCategory;
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
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center">
                    <p className="text-zinc-800 dark:text-zinc-200 font-bold text-xl mb-2">Error loading places</p>
                    <p className="text-zinc-500 text-sm">{error}</p>
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

            {/* Hero Header — transparent, no background */}
            <header className="mb-6 md:mb-10 relative py-8 md:py-12 border-b border-zinc-200 dark:border-white/5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 md:p-3 bg-zinc-800 dark:bg-zinc-700 rounded-2xl shadow-lg">
                            <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-extrabold text-zinc-900 dark:text-white">
                                Campus Places
                            </h1>
                            <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 mt-1">
                                Discover and review the best spots at {profile?.campus || 'your campus'}
                            </p>
                        </div>
                    </div>

                    {/* Stats — minimal inline */}
                    <div className="flex items-center gap-6 text-sm">
                        <div>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.totalPlaces}</p>
                            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Places</p>
                        </div>
                        <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
                        <div>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.totalReviews}</p>
                            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Reviews</p>
                        </div>
                        <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700" />
                        <div>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.avgRating.toFixed(1)}</p>
                            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Avg Rating</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Search & Filter */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-1 w-8 md:w-12 bg-zinc-800 dark:bg-zinc-400 rounded-full" />
                    <h2 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Search & Filter</h2>
                </div>

                <div className="space-y-3">
                    {/* Search input */}
                    <div className="relative">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search for places..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-5 py-3 pl-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 transition-all outline-none font-medium"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Category pills */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-200 ${selectedCategory === category
                                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
                                    }`}
                            >
                                {category === 'all' ? 'All Places' : category}
                            </button>
                        ))}
                    </div>

                    {(searchTerm || selectedCategory !== 'all') && (
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                <span className="font-bold text-zinc-900 dark:text-white">{filteredPlaces.length}</span> {filteredPlaces.length === 1 ? 'place' : 'places'} found
                            </p>
                            <button
                                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                                className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
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
                        <div key={location}>
                            {/* Location section header */}
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">{location}</h2>
                                </div>
                                <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400 font-semibold text-xs border border-zinc-200 dark:border-zinc-700">
                                    {placesInLocation.length} {placesInLocation.length === 1 ? 'place' : 'places'}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
                    <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                        <div className="inline-block p-6 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-4">
                            <svg className="w-16 h-16 text-zinc-400 dark:text-zinc-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
                            {searchTerm || selectedCategory !== 'all' ? 'No places found' : 'No places available yet'}
                        </h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                            {searchTerm || selectedCategory !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Check back later for new places'}
                        </p>
                        {(searchTerm || selectedCategory !== 'all') && (
                            <button
                                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                                className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:scale-105 transition-all"
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
