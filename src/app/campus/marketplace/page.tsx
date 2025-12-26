'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { MarketplaceListing } from '@/types';
import Spinner from '@/components/Spinner';
import Skeleton from '@/components/Skeleton';
import ListingCard from '@/components/ListingCard';
import CreateListingModal from '@/components/CreateListingModal';
import ListingDetailModal from '@/components/ListingDetailModal';

const CATEGORIES = ['Books & Notes', 'Electronics', 'Furniture', 'Apparel', 'Cycles & Vehicles', 'Other'];
const SORT_OPTIONS = {
    'created_at_desc': 'Newest First',
    'price_asc': 'Price: Low to High',
    'price_desc': 'Price: High to Low',
};

const MarketplacePage: React.FC = () => {
    const { profile, user } = useAuth();
    const [listings, setListings] = useState<MarketplaceListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState('created_at_desc');

    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
    const [listingToEdit, setListingToEdit] = useState<MarketplaceListing | null>(null);

    // Debounce search term
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);

    // Fetch listings whenever filters change
    useEffect(() => {
        if (!profile?.campus) return;

        const fetchListings = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: rpcError } = await supabase.rpc('get_marketplace_listings', {
                    p_campus: profile.campus,
                    p_search_term: debouncedSearchTerm.trim() === '' ? null : debouncedSearchTerm.trim(),
                    p_category: selectedCategory === 'All' ? null : selectedCategory,
                    p_sort_by: sortBy
                });

                if (rpcError) throw rpcError;
                setListings(data as MarketplaceListing[] || []);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchListings();
    }, [profile?.campus, debouncedSearchTerm, selectedCategory, sortBy]);

    const handleListingCreated = (newListing: MarketplaceListing) => {
        setListings(prev => [newListing, ...prev]);
        setCreateModalOpen(false);
    };

    const handleListingUpdated = (updatedListing: MarketplaceListing) => {
        setListings(prev => prev.map(l => l.id === updatedListing.id ? updatedListing : l));
        setListingToEdit(null);
        if (selectedListing?.id === updatedListing.id) {
            setSelectedListing(updatedListing);
        }
    };

    const handleOpenEditModal = (listing: MarketplaceListing) => {
        setSelectedListing(null);
        setListingToEdit(listing);
    };

    const handleListingDeleted = (listingId: string) => {
        setListings(prev => prev.filter(l => l.id !== listingId));
        setSelectedListing(null);
    };

    const showFormModal = isCreateModalOpen || !!listingToEdit;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {showFormModal && profile?.campus && (
                    <CreateListingModal
                        campus={profile.campus}
                        onClose={() => { setCreateModalOpen(false); setListingToEdit(null); }}
                        onListingCreated={handleListingCreated}
                        onListingUpdated={handleListingUpdated}
                        existingListing={listingToEdit}
                    />
                )}
                {selectedListing && (
                    <ListingDetailModal
                        listing={selectedListing}
                        onClose={() => setSelectedListing(null)}
                        onEdit={handleOpenEditModal}
                        onDelete={handleListingDeleted}
                    />
                )}

                {/* Enhanced Header Section */}
                <header className="mb-6 md:mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/20 via-teal-500/10 to-transparent dark:from-green-500/10 dark:via-teal-500/5 p-4 md:p-8 border border-green-500/20">
                    <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 md:-mr-32 md:-mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 md:w-48 md:h-48 bg-teal-500/10 rounded-full blur-3xl -ml-12 -mb-12 md:-ml-24 md:-mb-24"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-6">
                            <div className="space-y-2 md:space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 md:p-3 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-lg">
                                        <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-extrabold text-text-main-light dark:text-text-main bg-gradient-to-r from-green-500 to-teal-600 bg-clip-text text-transparent font-raleway">
                                        Marketplace
                                    </h1>
                                </div>
                                <p className="text-sm md:text-lg text-text-secondary-light dark:text-text-secondary max-w-xl">
                                    Buy, sell, and trade items with your campus community
                                </p>
                                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm">
                                    <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-green-500/30">
                                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span className="font-semibold">{listings.length} Active Listings</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-teal-500/10 text-teal-400 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-teal-500/30">
                                        <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span className="font-semibold">Campus Only</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setCreateModalOpen(true)}
                                className="bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold py-3 px-6 md:py-4 md:px-8 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center md:justify-start gap-2 group whitespace-nowrap w-full md:w-auto"
                            >
                                <span className="text-xl md:text-2xl group-hover:rotate-90 transition-transform duration-200">+</span>
                                <span>Sell Item</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Enhanced Filter Controls */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-1 w-8 md:w-12 bg-green-500 rounded-full"></div>
                        <h2 className="text-sm font-bold text-text-secondary-light dark:text-text-secondary uppercase tracking-wider">Filter & Search</h2>
                    </div>

                    <div className="bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl p-4 md:p-6 border border-tertiary-light dark:border-tertiary shadow-lg">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search Bar */}
                            <div className="relative flex-grow">
                                <input
                                    type="text"
                                    placeholder="Search for items, keywords..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-tertiary-light dark:border-gray-600 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all outline-none font-medium text-sm md:text-base"
                                />
                                <div className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-text-tertiary-light dark:text-text-tertiary">
                                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main transition-colors"
                                    >
                                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Category & Sort Dropdowns */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative w-full sm:w-auto">
                                    <select
                                        value={selectedCategory}
                                        onChange={e => setSelectedCategory(e.target.value)}
                                        className="w-full sm:w-auto appearance-none pl-4 pr-10 py-2.5 md:py-3 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-tertiary-light dark:border-gray-600 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all outline-none font-semibold cursor-pointer text-sm md:text-base"
                                    >
                                        <option value="All">All Categories</option>
                                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary-light dark:text-text-tertiary">
                                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="relative w-full sm:w-auto">
                                    <select
                                        value={sortBy}
                                        onChange={e => setSortBy(e.target.value)}
                                        className="w-full sm:w-auto appearance-none pl-4 pr-10 py-2.5 md:py-3 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-tertiary-light dark:border-gray-600 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all outline-none font-semibold cursor-pointer text-sm md:text-base"
                                    >
                                        {Object.entries(SORT_OPTIONS).map(([key, value]) => (
                                            <option key={key} value={key}>{value}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary-light dark:text-text-tertiary">
                                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Active Filters Display */}
                        {(searchTerm || selectedCategory !== 'All') && (
                            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-tertiary-light dark:border-tertiary">
                                <span className="text-xs md:text-sm font-semibold text-text-secondary-light dark:text-text-secondary">Active filters:</span>
                                {searchTerm && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/10 text-green-400 rounded-full text-xs md:text-sm font-semibold border border-green-500/30">
                                        Search: &quot;{searchTerm}&quot;
                                        <button onClick={() => setSearchTerm('')} className="hover:bg-green-500/20 rounded-full p-0.5">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </span>
                                )}
                                {selectedCategory !== 'All' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-500/10 text-teal-400 rounded-full text-xs md:text-sm font-semibold border border-teal-500/30">
                                        {selectedCategory}
                                        <button onClick={() => setSelectedCategory('All')} className="hover:bg-teal-500/20 rounded-full p-0.5">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </span>
                                )}
                                <button
                                    onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                                    className="text-xs font-semibold text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main transition-colors ml-2"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Section */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-1 w-12 bg-green-500 rounded-full"></div>
                            <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main">
                                {loading ? 'Loading...' : `${listings.length} ${listings.length === 1 ? 'Item' : 'Items'}`}
                            </h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {[...Array(10)].map((_, i) => (
                                <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />
                            ))}
                        </div>
                    ) : listings.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {listings.map(listing => (
                                <ListingCard
                                    key={listing.id}
                                    listing={listing}
                                    onClick={() => setSelectedListing(listing)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 md:py-24 px-4 text-center bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl border-2 border-dashed border-tertiary-light dark:border-tertiary">
                            <div className="inline-block p-6 bg-green-500/10 rounded-full mb-4">
                                <svg className="w-12 h-12 md:w-16 md:h-16 text-green-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-text-main-light dark:text-text-main mb-2">
                                No Items Found
                            </h3>
                            <p className="text-sm md:text-base text-text-secondary-light dark:text-text-secondary max-w-md mb-6">
                                {searchTerm || selectedCategory !== 'All'
                                    ? 'Try adjusting your search or filters to find what you&apos;re looking for.'
                                    : 'Be the first to list an item for sale!'}
                            </p>
                            {(searchTerm || selectedCategory !== 'All') && (
                                <button
                                    onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 text-sm md:text-base"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarketplacePage;
