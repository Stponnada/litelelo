// src/pages/ReputationPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Profile, MarketplaceListing, BitsCoinRequest } from '../types';
import Spinner from '../components/Spinner';
import ListingCard from '../components/ListingCard';
import ListingDetailModal from '../components/ListingDetailModal';
import RateSellerModal from '../components/RateSellerModal';
import { StarIcon, CurrencyRupeeIcon } from '../components/icons';
import { formatTimestamp } from '../utils/timeUtils';

const ReputationPage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [listings, setListings] = useState<MarketplaceListing[]>([]);
    const [bitsCoinHistory, setBitsCoinHistory] = useState<BitsCoinRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isRateSellerModalOpen, setRateSellerModalOpen] = useState(false);
    const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
    const [activeTab, setActiveTab] = useState('listings');

    const fetchData = useCallback(async () => {
        if (!username) return;
        setLoading(true);
        setError(null);
        try {
            const { data: profileData, error: profileError } = await supabase.rpc('get_profile_details', { profile_username: username }).single();
            if (profileError || !profileData) throw profileError || new Error("User not found");
            setProfile(profileData);

            // Fetch both histories in parallel
            const listingsPromise = supabase.from('marketplace_listings').select(`*, seller_profile:profiles(*), primary_image_url:marketplace_images(image_url)`).eq('seller_id', profileData.user_id).order('created_at', { ascending: false });
            const bitsCoinPromise = supabase.rpc('get_bits_coin_history_for_user', { p_user_id: profileData.user_id });

            const [listingsResult, bitsCoinResult] = await Promise.all([listingsPromise, bitsCoinPromise]);

            if (listingsResult.error) throw listingsResult.error;
            setListings((listingsResult.data || []).map((l: any) => ({...l, primary_image_url: l.primary_image_url[0]?.image_url})) as MarketplaceListing[]);

            if (bitsCoinResult.error) throw bitsCoinResult.error;
            setBitsCoinHistory(bitsCoinResult.data as BitsCoinRequest[] || []);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <div className="text-center p-8"><Spinner /></div>;
    if (error || !profile) return <div className="text-center p-8 text-red-400">{error || "User not found."}</div>;
    
    const isOwnProfile = currentUser?.id === profile.user_id;

    return (
        <div className="max-w-7xl mx-auto">
            {isRateSellerModalOpen && (
                <RateSellerModal 
                    sellerProfile={profile}
                    onClose={() => setRateSellerModalOpen(false)}
                    onRatingSuccess={fetchData}
                />
            )}
            {selectedListing && (
                <ListingDetailModal 
                    listing={selectedListing}
                    onClose={() => setSelectedListing(null)}
                    onEdit={() => {}}
                    onDelete={() => {}}
                />
            )}

            <div className="bg-secondary-light dark:bg-secondary p-6 rounded-lg shadow-lg border border-tertiary-light dark:border-tertiary mb-8">
                <div className="flex items-center space-x-4">
                    <img src={profile.avatar_url || ''} alt={profile.username} className="w-20 h-20 rounded-full object-cover" />
                    <div>
                        <h1 className="text-3xl font-bold text-text-main-light dark:text-text-main">{profile.full_name}</h1>
                        <Link to={`/profile/${profile.username}`} className="text-brand-green hover:underline">@{profile.username}</Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-tertiary-light dark:border-tertiary">
                    <div>
                        <h2 className="text-lg font-semibold">Marketplace Rating</h2>
                        {(profile.total_seller_ratings ?? 0) > 0 ? (
                            <div className="flex items-center text-sm mt-1">
                                <StarIcon className="w-5 h-5 text-yellow-400" />
                                <span className="font-bold text-text-main-light dark:text-white ml-1">{profile.avg_seller_rating?.toFixed(1)}</span>
                                <span className="text-text-tertiary-light dark:text-text-tertiary ml-2">from {profile.total_seller_ratings} ratings</span>
                            </div>
                        ) : <p className="text-sm text-text-tertiary-light dark:text-text-tertiary mt-1 italic">No ratings yet.</p>}
                         {!isOwnProfile && <button onClick={() => setRateSellerModalOpen(true)} className="mt-2 text-sm text-brand-green hover:underline">Rate Seller</button>}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Bits-coin Rating</h2>
                        {(profile.total_bits_coin_ratings ?? 0) > 0 ? (
                            <div className="flex items-center text-sm mt-1">
                                <StarIcon className="w-5 h-5 text-yellow-400" />
                                <span className="font-bold text-text-main-light dark:text-white ml-1">{profile.avg_bits_coin_rating?.toFixed(1)}</span>
                                <span className="text-text-tertiary-light dark:text-text-tertiary ml-2">from {profile.total_bits_coin_ratings} ratings</span>
                            </div>
                        ) : <p className="text-sm text-text-tertiary-light dark:text-text-tertiary mt-1 italic">No ratings yet.</p>}
                    </div>
                </div>
            </div>

            <div className="flex border-b border-tertiary-light dark:border-tertiary mb-6">
                <button onClick={() => setActiveTab('listings')} className={`py-3 px-6 font-semibold border-b-2 ${activeTab === 'listings' ? 'border-brand-green text-brand-green' : 'border-transparent text-text-secondary-light dark:text-text-secondary'}`}>Listings ({listings.length})</button>
                <button onClick={() => setActiveTab('bits-coin')} className={`py-3 px-6 font-semibold border-b-2 ${activeTab === 'bits-coin' ? 'border-brand-green text-brand-green' : 'border-transparent text-text-secondary-light dark:text-text-secondary'}`}>Bits-coin History ({bitsCoinHistory.length})</button>
            </div>

            {activeTab === 'listings' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {listings.length > 0 ? listings.map(listing => (
                        <ListingCard key={listing.id} listing={listing} onClick={() => setSelectedListing(listing)} />
                    )) : <p className="col-span-full text-center py-16 text-text-tertiary-light dark:text-text-tertiary">This user has no active listings.</p>}
                </div>
            )}
            
            {activeTab === 'bits-coin' && (
                <div className="space-y-4">
                    {bitsCoinHistory.length > 0 ? bitsCoinHistory.map(req => (
                        <BitsCoinHistoryCard key={req.id} request={req} viewingAs={profile}/>
                    )) : <p className="text-center py-16 text-text-tertiary-light dark:text-text-tertiary">This user has no Bits-coin history.</p>}
                </div>
            )}
        </div>
    );
};

const BitsCoinHistoryCard: React.FC<{request: BitsCoinRequest, viewingAs: Profile}> = ({ request, viewingAs }) => {
    const isRequester = request.requester.user_id === viewingAs.user_id;
    const otherParty = isRequester ? request.claimer : request.requester;
    const role = isRequester ? 'Requested' : 'Claimed';
    
    return (
        <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg border border-tertiary-light dark:border-tertiary">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${isRequester ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>{role}</span>
                        <p className="font-bold truncate">{request.title}</p>
                    </div>
                    <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-1">
                        {formatTimestamp(request.created_at)}
                        {otherParty && <span> with <Link to={`/reputation/${otherParty.username}`} className="font-semibold hover:underline">@{otherParty.username}</Link></span>}
                    </p>
                </div>
                 <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="font-bold text-brand-green flex items-center gap-1"><CurrencyRupeeIcon className="w-4 h-4"/>{request.reward}</span>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${request.status === 'completed' ? 'bg-brand-green/20 text-brand-green' : 'bg-tertiary-light dark:bg-tertiary text-text-tertiary-light'}`}>{request.status}</span>
                </div>
            </div>
        </div>
    );
};

export default ReputationPage;