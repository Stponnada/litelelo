// src/pages/RideSharePage.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { RideShare } from '../types';
import Spinner from '../components/Spinner';
import { CarIcon, XCircleIcon, ChatIcon } from '../components/icons';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

const RideSharePage: React.FC = () => {
    const { profile } = useAuth();
    const [rides, setRides] = useState<RideShare[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'offer' | 'request'>('offer');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);

    const fetchRides = useCallback(async () => {
        if (!profile?.campus) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_ride_shares', { p_campus: profile.campus });
            if (error) throw error;
            setRides(data as RideShare[] || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [profile?.campus]);

    useEffect(() => {
        fetchRides();
    }, [fetchRides]);

    const filteredRides = useMemo(() => rides.filter(r => r.type === activeTab), [rides, activeTab]);

    if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Spinner /></div>;
    if (error) return <div className="text-center p-8 text-red-400">Error: {error}</div>;

    return (
        <div className="max-w-7xl mx-auto">
            {isCreateModalOpen && profile && (
                <CreateRideModal campus={profile.campus!} onClose={() => setCreateModalOpen(false)} onRideCreated={fetchRides} />
            )}

            <header className="mb-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-text-main-light dark:text-text-main">Ride Share</h1>
                        <p className="text-lg text-text-secondary-light dark:text-text-secondary">Coordinate travel with other BITSians.</p>
                    </div>
                    <button onClick={() => setCreateModalOpen(true)} className="bg-brand-green text-black font-bold py-3 px-6 rounded-lg hover:bg-brand-green-darker transition-colors">
                        + Post a Ride
                    </button>
                </div>
            </header>

            <div className="flex gap-3 mb-8">
                <button onClick={() => setActiveTab('offer')} className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all ${activeTab === 'offer' ? 'bg-brand-green text-black' : 'bg-secondary-light dark:bg-secondary'}`}>Offering a Ride</button>
                <button onClick={() => setActiveTab('request')} className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all ${activeTab === 'request' ? 'bg-brand-green text-black' : 'bg-secondary-light dark:bg-secondary'}`}>Looking for a Ride</button>
            </div>

            {filteredRides.length > 0 ? (
                <div className="space-y-4">
                    {filteredRides.map(ride => <RideCard key={ride.id} ride={ride} />)}
                </div>
            ) : (
                <div className="text-center py-20 bg-secondary-light dark:bg-secondary rounded-lg border-2 border-dashed border-tertiary-light dark:border-tertiary">
                    <h3 className="text-xl font-bold">No {activeTab === 'offer' ? 'offers' : 'requests'} found!</h3>
                    <p className="text-text-secondary-light dark:text-text-secondary mt-2">Be the first to post one.</p>
                </div>
            )}
        </div>
    );
};

const RideCard: React.FC<{ ride: RideShare }> = ({ ride }) => {
    const navigate = useNavigate();
    const handleContact = () => navigate('/chat', { state: { recipient: ride.user } });
    
    return (
        <div className="bg-secondary-light dark:bg-secondary rounded-lg shadow-md border border-tertiary-light dark:border-tertiary p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-xl font-bold">
                    <span>{ride.origin}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    <span>{ride.destination}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary-light dark:text-text-secondary">
                    <span>📅 {format(new Date(ride.departure_time), 'MMM d, yyyy')}</span>
                    <span>🕒 {format(new Date(ride.departure_time), 'p')}</span>
                    <span>
                        {ride.type === 'offer' ? `Seats Available: ${ride.seats}` : `Seats Needed: ${ride.seats}`}
                    </span>
                </div>
                <Link to={`/profile/${ride.user.username}`} className="inline-flex items-center gap-2 pt-2 group">
                    <img src={ride.user.avatar_url || ''} alt="user" className="w-6 h-6 rounded-full" />
                    <span className="text-sm font-semibold group-hover:underline">@{ride.user.username}</span>
                </Link>
            </div>
            <button onClick={handleContact} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-green text-black font-semibold py-2 px-4 rounded-lg">
                <ChatIcon className="w-5 h-5" /> Contact
            </button>
        </div>
    );
}

const CreateRideModal: React.FC<{ campus: string; onClose: () => void; onRideCreated: () => void; }> = ({ campus, onClose, onRideCreated }) => {
    const { user } = useAuth();
    const [type, setType] = useState<'offer' | 'request'>('offer');
    const [destination, setDestination] = useState('');
    const [departureTime, setDepartureTime] = useState('');
    const [seats, setSeats] = useState(1);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !destination || !departureTime || seats < 1) {
            setError('Please fill all required fields.'); return;
        }
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('ride_shares').insert({
                user_id: user.id, campus, type, origin: campus, destination,
                departure_time: new Date(departureTime).toISOString(), seats, description,
            });
            if (error) throw error;
            onRideCreated();
            onClose();
        } catch (err: any) { setError(err.message); } finally { setIsSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-secondary-light dark:bg-secondary rounded-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6">
                    <header className="flex items-center justify-between pb-4 border-b border-tertiary-light dark:border-tertiary">
                        <h2 className="text-xl font-bold">Post a Ride</h2>
                        <button type="button" onClick={onClose}><XCircleIcon className="w-8 h-8" /></button>
                    </header>
                    <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        <div className="flex gap-2 p-1 bg-tertiary-light dark:bg-tertiary rounded-lg">
                            <button type="button" onClick={() => setType('offer')} className={`flex-1 py-2 rounded ${type==='offer' ? 'bg-brand-green text-black' : ''}`}>Offering Ride</button>
                            <button type="button" onClick={() => setType('request')} className={`flex-1 py-2 rounded ${type==='request' ? 'bg-brand-green text-black' : ''}`}>Requesting Ride</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm">From</label><input type="text" value={campus} disabled className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded opacity-70"/></div>
                            <div><label className="block text-sm">To*</label><input type="text" value={destination} onChange={e => setDestination(e.target.value)} required className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm">Date & Time*</label><input type="datetime-local" value={departureTime} onChange={e => setDepartureTime(e.target.value)} required className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded" /></div>
                            <div><label className="block text-sm">{type === 'offer' ? 'Seats Available*' : 'Seats Needed*'}</label><input type="number" value={seats} onChange={e => setSeats(parseInt(e.target.value, 10))} required min="1" className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded" /></div>
                        </div>
                        <div><label className="block text-sm">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="e.g., Only one small bag allowed, cost sharing details, etc." className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded" /></div>
                    </div>
                    {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
                    <footer className="flex justify-end gap-4 pt-6 mt-4 border-t border-tertiary-light dark:border-tertiary">
                        <button type="button" onClick={onClose} className="py-2 px-6 rounded-full hover:bg-tertiary-light/60 dark:hover:bg-tertiary">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="py-2 px-6 rounded-full text-black bg-brand-green">{isSubmitting ? <Spinner/> : 'Post'}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default RideSharePage;