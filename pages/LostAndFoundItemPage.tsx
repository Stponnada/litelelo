// src/pages/LostAndFoundItemPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { LostAndFoundItem, Profile } from '../types';
import Spinner from '../components/Spinner';
import { formatTimestamp } from '../utils/timeUtils';
import { ChatIcon } from '../components/icons';

type ItemWithDetails = LostAndFoundItem & {
    profiles: Profile;
};

const LostAndFoundItemPage: React.FC = () => {
    const { itemId } = useParams<{ itemId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [item, setItem] = useState<ItemWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchItem = async () => {
            if (!itemId) {
                setError("No item ID provided.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const { data, error: fetchError } = await supabase
                    .from('lost_and_found_items')
                    .select('*, profiles(*)')
                    .eq('id', itemId)
                    .single();

                if (fetchError) throw fetchError;
                if (!data) throw new Error("Item not found or has been reclaimed.");
                
                setItem(data as ItemWithDetails);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [itemId]);

    const handleMarkReclaimed = async () => {
        if (!item || !window.confirm("Are you sure? This will permanently remove the post.")) return;

        try {
            const { error: updateError } = await supabase
                .from('lost_and_found_items')
                .update({ status: 'reclaimed' })
                .eq('id', item.id);
            if (updateError) throw updateError;
            navigate('/campus/lost-and-found');
        } catch (err: any) {
            alert(`Failed to update status: ${err.message}`);
        }
    };
    
    const handleContact = () => {
        if (!item?.profiles) return;
        navigate('/chat', { state: { recipient: item.profiles } });
    };

    if (loading) {
        return <div className="flex justify-center items-center h-[calc(100vh-80px)]"><Spinner /></div>;
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                <h2 className="text-2xl font-bold">Error</h2>
                <p>{error}</p>
                <Link to="/campus/lost-and-found" className="mt-4 inline-block px-6 py-2 bg-orange-500 text-white font-bold rounded-lg">
                    Back to Lost & Found
                </Link>
            </div>
        );
    }
    
    if (!item) {
        return <div>Item not found.</div>;
    }

    const poster = item.profiles;
    const isOwner = user?.id === item.user_id;
    const isFoundItem = item.item_type === 'found';
    const locationLabel = isFoundItem ? 'Location Found' : 'Last Seen At';
    const statusColor = isFoundItem ? 'green' : 'red';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm font-semibold text-text-secondary-light dark:text-text-secondary hover:text-orange-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Lost & Found
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Image Section */}
                <div className="lg:col-span-3">
                    <div className="aspect-w-4 aspect-h-3 rounded-2xl overflow-hidden bg-secondary-light dark:bg-secondary border border-tertiary-light dark:border-tertiary shadow-lg">
                        <img 
                            src={item.image_url || `https://placehold.co/600x400/1e293b/ef4444?text=${isFoundItem ? 'Found+Item' : 'Lost+Item'}`} 
                            alt={item.title} 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                </div>

                {/* Details Section */}
                <div className="lg:col-span-2">
                    <div className="bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 p-6 rounded-2xl border border-tertiary-light dark:border-tertiary h-full flex flex-col">
                        <span className={`px-4 py-1.5 bg-${statusColor}-500/20 text-${statusColor}-400 text-sm font-bold rounded-full self-start border border-${statusColor}-500/30`}>
                            {isFoundItem ? '✓ Item Found' : '⚠ Item Lost'}
                        </span>

                        <h1 className="text-4xl font-extrabold text-text-main-light dark:text-text-main my-4">{item.title}</h1>
                        
                        <div className="space-y-4 mb-6 text-text-secondary-light dark:text-text-secondary flex-grow">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-orange-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <div>
                                    <h3 className="font-bold text-text-main-light dark:text-text-main">Description</h3>
                                    <p>{item.description || "No description provided."}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-orange-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <div>
                                    <h3 className="font-bold text-text-main-light dark:text-text-main">{locationLabel}</h3>
                                    <p>{item.location_found}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-orange-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <div>
                                    <h3 className="font-bold text-text-main-light dark:text-text-main">Date Posted</h3>
                                    <p>{formatTimestamp(item.created_at)}</p>
                                </div>
                            </div>
                        </div>
                        
                        <hr className="my-6 border-tertiary-light dark:border-tertiary" />

                        {/* Poster Info */}
                        <div className="bg-tertiary-light/50 dark:bg-tertiary/50 p-4 rounded-xl">
                           <p className="text-xs font-bold uppercase text-text-tertiary-light dark:text-text-tertiary mb-3 tracking-wider">Posted By</p>
                           <Link to={`/profile/${poster.username}`} className="flex items-center gap-3 group">
                                <img src={poster.avatar_url} alt={poster.username} className="w-12 h-12 rounded-full ring-2 ring-tertiary group-hover:ring-orange-500 transition-all" />
                                <div>
                                    <p className="font-bold text-text-main-light dark:text-text-main group-hover:text-orange-500 transition-colors">{poster.full_name}</p>
                                    <p className="text-sm text-text-secondary-light dark:text-text-secondary">@{poster.username}</p>
                                </div>
                            </Link>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6">
                            {isOwner ? (
                                <button onClick={handleMarkReclaimed} className="w-full py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all">
                                    Mark as {isFoundItem ? 'Reclaimed' : 'Found'}
                                </button>
                            ) : (
                                <button onClick={handleContact} className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-extrabold rounded-xl hover:shadow-lg hover:scale-105 transition-all">
                                    <ChatIcon className="w-6 h-6" />
                                    Contact Poster
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LostAndFoundItemPage;