// src/pages/MarketplacePage.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { MarketplaceListing } from '../types';
import Spinner from '../components/Spinner';
import ListingCard from '../components/ListingCard';
import CreateListingModal from '../components/CreateListingModal';
import ListingDetailModal from '../components/ListingDetailModal';

const CATEGORIES = ['Books & Notes', 'Electronics', 'Furniture', 'Apparel', 'Cycles & Vehicles', 'Other'];
const SORT_OPTIONS = {
    'created_at_desc': 'Newest',
    'price_asc': 'Price: Low to High',
    'price_desc': 'Price: High to Low',
};

const MarketplacePage: React.FC = () => {
    const { profile, user } = useAuth();
    const [listings, setListings] = useState<MarketplaceListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- NEW: State for filters ---
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
        }, 500); // 500ms delay

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
            } catch (err: any) {
                setError(err.message);
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
    const isMyListingsTab = false; // We can add this logic back later if needed

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

                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div className="flex-1">
                            <h1 className="text-3xl sm:text-4xl font-bold text-text-main-light dark:text-text-main mb-2">Marketplace</h1>
                            <p className="text-lg text-text-secondary-light dark:text-text-secondary">Buy & sell goods within the {profile?.campus} campus.</p>
                        </div>
                        <button onClick={() => setCreateModalOpen(true)} className="bg-brand-green text-black font-bold py-3 px-8 rounded-full hover:bg-brand-green-darker transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap">
                            + Sell Item
                        </button>
                    </div>
                </div>
                
                {/* --- NEW FILTER CONTROLS --- */}
                <div className="mb-8 p-4 bg-secondary-light dark:bg-secondary rounded-lg border border-tertiary-light dark:border-tertiary shadow-sm flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <input type="text" placeholder="Search for an item..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-tertiary-light dark:bg-tertiary rounded-md border border-tertiary-light dark:border-gray-600"/>
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary-light dark:text-text-tertiary">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="flex-1 p-2 bg-tertiary-light dark:bg-tertiary rounded-md border border-tertiary-light dark:border-gray-600">
                            <option value="All">All Categories</option>
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                         <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="flex-1 p-2 bg-tertiary-light dark:bg-tertiary rounded-md border border-tertiary-light dark:border-gray-600">
                            {Object.entries(SORT_OPTIONS).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20"><Spinner/></div>
                ) : listings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {listings.map(listing => (
                            <ListingCard 
                                key={listing.id} 
                                listing={listing} 
                                onClick={() => setSelectedListing(listing)} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 text-center bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-tertiary-light dark:border-tertiary">
                        <h3 className="text-xl font-semibold text-text-main-light dark:text-text-main mb-2">
                            No Items Found
                        </h3>
                        <p className="text-text-tertiary-light dark:text-text-tertiary max-w-md">
                            Try adjusting your search or filters. Or, be the first to list an item!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketplacePage;