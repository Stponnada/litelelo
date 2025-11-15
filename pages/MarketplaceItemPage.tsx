// src/pages/MarketplaceItemPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { MarketplaceListing, Profile } from '../types';
import Spinner from '../components/Spinner';
import CreateListingModal from '../components/CreateListingModal';
import { StarIcon, ShieldCheckIcon } from '../components/icons';

// Define a more detailed type for this page
type ListingWithDetails = MarketplaceListing & {
    seller_id: Profile;
    marketplace_images: { image_url: string }[];
};

const MarketplaceItemPage: React.FC = () => {
    const { listingId } = useParams<{ listingId: string }>();
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const [listing, setListing] = useState<ListingWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeImage, setActiveImage] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchListing = async () => {
            if (!listingId) {
                setError("No listing ID provided.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const { data, error: fetchError } = await supabase
                    .from('marketplace_listings')
                    .select(`
                        *,
                        seller_id (
                            user_id,
                            username,
                            full_name,
                            avatar_url,
                            avg_seller_rating,
                            total_seller_ratings
                        ),
                        marketplace_images ( image_url )
                    `)
                    .eq('id', listingId)
                    .single();

                if (fetchError) throw fetchError;
                if (!data) throw new Error("Listing not found.");
                
                setListing(data as ListingWithDetails);
                if (data.marketplace_images && data.marketplace_images.length > 0) {
                    setActiveImage(data.marketplace_images[0].image_url);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchListing();
    }, [listingId]);
    
    const handleContactSeller = () => {
        if (!listing) return;
        navigate('/chat', { state: { recipient: listing.seller_id } });
    };

    const handleDelete = async () => {
        if (!listing || !window.confirm("Are you sure you want to permanently delete this listing?")) return;

        try {
            const { error: deleteError } = await supabase.rpc('delete_listing', { p_listing_id: listing.id });
            if (deleteError) throw deleteError;
            navigate('/campus/marketplace');
        } catch (err: any) {
            alert(`Failed to delete listing: ${err.message}`);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-[calc(100vh-80px)]"><Spinner /></div>;
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                <h2 className="text-2xl font-bold">Error</h2>
                <p>{error}</p>
                <Link to="/campus/marketplace" className="mt-4 inline-block px-6 py-2 bg-brand-green text-black font-bold rounded-lg">
                    Back to Marketplace
                </Link>
            </div>
        );
    }
    
    if (!listing) {
        return <div>Listing not found.</div>;
    }

    const seller = listing.seller_id;
    const isOwner = user?.id === seller.user_id;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {isEditing && profile?.campus && (
                <CreateListingModal
                    campus={profile.campus}
                    onClose={() => setIsEditing(false)}
                    onListingUpdated={(updated) => {
                        setListing(prev => prev ? { ...prev, ...updated } : null);
                        setActiveImage(updated.all_images?.[0] || null);
                        setIsEditing(false);
                    }}
                    existingListing={listing}
                />
            )}
            
            <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm font-semibold text-text-secondary-light dark:text-text-secondary hover:text-brand-green transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Marketplace
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Image Gallery */}
                <div className="lg:col-span-3">
                    <div className="aspect-w-4 aspect-h-3 rounded-2xl overflow-hidden bg-secondary-light dark:bg-secondary border border-tertiary-light dark:border-tertiary shadow-lg">
                        {activeImage ? (
                            <img src={activeImage} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center text-text-tertiary-light dark:text-text-tertiary">No Image</div>
                        )}
                    </div>
                    {listing.marketplace_images.length > 1 && (
                        <div className="flex gap-3 mt-4">
                            {listing.marketplace_images.map((img, index) => (
                                <button key={index} onClick={() => setActiveImage(img.image_url)} className={`w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${activeImage === img.image_url ? 'border-brand-green scale-105' : 'border-tertiary-light dark:border-tertiary opacity-70 hover:opacity-100'}`}>
                                    <img src={img.image_url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <div className="lg:col-span-2">
                    <div className="bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 p-6 rounded-2xl border border-tertiary-light dark:border-tertiary h-full flex flex-col">
                        <span className="px-3 py-1 bg-brand-green/20 text-brand-green text-sm font-bold rounded-full self-start border border-brand-green/30">{listing.category}</span>
                        <h1 className="text-4xl font-extrabold text-text-main-light dark:text-text-main my-4">{listing.title}</h1>
                        <p className="text-5xl font-black text-brand-green mb-6">₹{listing.price}</p>
                        
                        <div className="prose prose-sm dark:prose-invert text-text-secondary-light dark:text-text-secondary flex-grow">
                            <p>{listing.description}</p>
                        </div>
                        
                        <hr className="my-6 border-tertiary-light dark:border-tertiary" />

                        {/* Seller Info */}
                        <div className="bg-tertiary-light/50 dark:bg-tertiary/50 p-4 rounded-xl">
                           <p className="text-xs font-bold uppercase text-text-tertiary-light dark:text-text-tertiary mb-3 tracking-wider">Seller Information</p>
                           <div className="flex items-center justify-between">
                                <Link to={`/profile/${seller.username}`} className="flex items-center gap-3 group">
                                    <img src={seller.avatar_url} alt={seller.username} className="w-12 h-12 rounded-full ring-2 ring-tertiary group-hover:ring-brand-green transition-all" />
                                    <div>
                                        <p className="font-bold text-text-main-light dark:text-text-main group-hover:text-brand-green transition-colors">{seller.full_name}</p>
                                        <p className="text-sm text-text-secondary-light dark:text-text-secondary">@{seller.username}</p>
                                    </div>
                                </Link>
                                <div className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-full border border-yellow-400/20">
                                    <StarIcon className="w-4 h-4" />
                                    <span className="text-sm font-bold">{seller.avg_seller_rating.toFixed(1)}</span>
                                    <span className="text-xs">({seller.total_seller_ratings})</span>
                                </div>
                           </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6">
                            {isOwner ? (
                                <div className="flex gap-3">
                                    <button onClick={() => setIsEditing(true)} className="flex-1 py-3 px-6 bg-blue-500/20 text-blue-400 font-bold rounded-xl border border-blue-500/30 hover:bg-blue-500 hover:text-white transition-all">Edit Listing</button>
                                    <button onClick={handleDelete} className="flex-1 py-3 px-6 bg-red-500/20 text-red-400 font-bold rounded-xl border border-red-500/30 hover:bg-red-500 hover:text-white transition-all">Delete</button>
                                </div>
                            ) : (
                                <button onClick={handleContactSeller} className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-brand-green to-green-400 text-black font-extrabold rounded-xl hover:shadow-lg hover:scale-105 transition-all">
                                    <ShieldCheckIcon className="w-6 h-6" />
                                    Contact Seller
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketplaceItemPage;