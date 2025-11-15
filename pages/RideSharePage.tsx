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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {isCreateModalOpen && profile && (
                <CreateRideModal campus={profile.campus!} onClose={() => setCreateModalOpen(false)} onRideCreated={fetchRides} />
            )}

            {/* Enhanced Header with Gradient Background */}
            <header className="mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500/20 via-indigo-500/10 to-transparent dark:from-sky-500/10 dark:via-indigo-500/5 p-8 border border-sky-500/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -ml-24 -mb-24"></div>
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl shadow-lg">
                                    <CarIcon className="w-8 h-8 text-white" />
                                </div>
                                <h1 className="text-5xl font-extrabold text-text-main-light dark:text-text-main bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">
                                    Ride Share
                                </h1>
                            </div>
                            <p className="text-lg text-text-secondary-light dark:text-text-secondary max-w-xl">
                                Coordinate travel to the airport, home, or anywhere with fellow BITSians
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2 bg-sky-500/10 text-sky-400 px-3 py-1.5 rounded-full border border-sky-500/30">
                                    <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
                                    <span className="font-semibold">{rides.filter(r => r.type === 'offer').length} Rides Offered</span>
                                </div>
                                <div className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-500/30">
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                                    <span className="font-semibold">{rides.filter(r => r.type === 'request').length} Rides Requested</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setCreateModalOpen(true)} 
                            className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold py-4 px-8 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2 group whitespace-nowrap"
                        >
                            <span className="text-2xl group-hover:rotate-90 transition-transform duration-200">+</span>
                            <span>Post a Ride</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Enhanced Tab Switcher */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-1 w-12 bg-sky-500 rounded-full"></div>
                    <h2 className="text-sm font-bold text-text-secondary-light dark:text-text-secondary uppercase tracking-wider">Browse Rides</h2>
                </div>
                <div className="inline-flex gap-2 p-1.5 bg-secondary-light dark:bg-secondary rounded-xl border border-tertiary-light dark:border-tertiary">
                    <button 
                        onClick={() => setActiveTab('offer')} 
                        className={`px-6 py-3 text-sm font-bold rounded-lg transition-all duration-200 ${
                            activeTab === 'offer' 
                                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg' 
                                : 'text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light/50 dark:hover:bg-tertiary/50'
                        }`}
                    >
                        🚗 From BPHC
                    </button>
                    <button 
                        onClick={() => setActiveTab('request')} 
                        className={`px-6 py-3 text-sm font-bold rounded-lg transition-all duration-200 ${
                            activeTab === 'request' 
                                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg' 
                                : 'text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light/50 dark:hover:bg-tertiary/50'
                        }`}
                    >
                        🚀 To BPHC
                    </button>
                </div>
            </div>

            {/* Enhanced Ride Cards */}
            {filteredRides.length > 0 ? (
                <div className="grid grid-cols-1 gap-5">
                    {filteredRides.map(ride => <RideCard key={ride.id} ride={ride} />)}
                </div>
            ) : (
                <div className="text-center py-24 bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl border-2 border-dashed border-tertiary-light dark:border-tertiary">
                    <div className="inline-block p-6 bg-sky-500/10 rounded-full mb-4">
                        <CarIcon className="w-16 h-16 text-sky-500 opacity-50" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">No {activeTab === 'offer' ? 'ride offers' : 'ride requests'} yet</h3>
                    <p className="text-text-secondary-light dark:text-text-secondary">Be the first to post one!</p>
                </div>
            )}
        </div>
    );
};

const RideCard: React.FC<{ ride: RideShare }> = ({ ride }) => {
    const navigate = useNavigate();
    const handleContact = () => navigate('/chat', { state: { recipient: ride.user } });
    
    const isOffer = ride.type === 'offer';
    
    return (
        <div className="group bg-gradient-to-br from-secondary-light to-secondary-light dark:from-secondary dark:to-secondary rounded-2xl shadow-lg border border-tertiary-light dark:border-tertiary p-6 hover:border-sky-500 hover:shadow-2xl hover:shadow-sky-500/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            {/* Decorative gradient overlay */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${isOffer ? 'bg-sky-500/5' : 'bg-indigo-500/5'} rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Main Info */}
                <div className="flex-1 space-y-4">
                    {/* Route Display */}
                    <div className="flex items-center gap-3 text-2xl font-bold text-text-main-light dark:text-text-main">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500/20 to-sky-500/10 rounded-xl border border-sky-500/30">
                            <span className="text-xl">📍</span>
                            <span>{ride.origin}</span>
                        </div>
                        <div className="flex-shrink-0">
                            <svg className="w-8 h-8 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-indigo-500/10 rounded-xl border border-indigo-500/30">
                            <span className="text-xl"></span>
                            <span>{ride.destination}</span>
                        </div>
                    </div>
                    
                    {/* Details */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-tertiary-light/60 dark:bg-tertiary/60 rounded-lg text-sm font-semibold text-text-secondary-light dark:text-text-secondary">
                            <span>📅</span>
                            <span>{format(new Date(ride.departure_time), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 bg-tertiary-light/60 dark:bg-tertiary/60 rounded-lg text-sm font-semibold text-text-secondary-light dark:text-text-secondary">
                            <span>🕒</span>
                            <span>{format(new Date(ride.departure_time), 'p')}</span>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border ${
                            isOffer 
                                ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}>
                            <span>💺</span>
                            <span>{ride.seats} {ride.seats === 1 ? 'Seat' : 'Seats'} {isOffer ? 'Available' : 'Needed'}</span>
                        </div>
                    </div>

                    {/* Description */}
                    {ride.description && (
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary bg-tertiary-light/30 dark:bg-tertiary/30 p-3 rounded-lg border border-tertiary-light dark:border-tertiary">
                            {ride.description}
                        </p>
                    )}
                    
                    {/* User Info */}
                    <Link 
                        to={`/profile/${ride.user.username}`} 
                        className="inline-flex items-center gap-3 pt-2 group/avatar"
                    >
                        <div className="relative">
                            <img 
                                src={ride.user.avatar_url || ''} 
                                alt="user" 
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-tertiary-light dark:ring-tertiary group-hover/avatar:ring-sky-500 transition-all duration-200"
                            />
                            <div className="absolute inset-0 rounded-full bg-sky-500 opacity-0 group-hover/avatar:opacity-20 transition-opacity duration-200"></div>
                        </div>
                        <div>
                            <span className="text-sm font-bold text-text-main-light dark:text-text-main group-hover/avatar:text-sky-500 transition-colors duration-200">
                                @{ride.user.username}
                            </span>
                            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary">
                                {isOffer ? 'Offering ride' : 'Looking for ride'}
                            </p>
                        </div>
                    </Link>
                </div>
                
                {/* Contact Button */}
                <div className="lg:flex-shrink-0">
                    <button 
                        onClick={handleContact} 
                        className="w-full lg:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                    >
                        <ChatIcon className="w-5 h-5" />
                        <span>Contact</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl shadow-2xl w-full max-w-lg border border-tertiary-light dark:border-tertiary animate-slideUp" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6">
                    <header className="flex items-center justify-between pb-5 border-b border-tertiary-light dark:border-tertiary">
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">
                                Post a Ride
                            </h2>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary mt-1">
                                Share your travel plans or find a ride
                            </p>
                        </div>
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="hover:bg-tertiary-light dark:hover:bg-tertiary rounded-lg p-1 transition-colors"
                        >
                            <XCircleIcon className="w-7 h-7 text-text-tertiary-light dark:text-text-tertiary" />
                        </button>
                    </header>
                    
                    <div className="mt-6 space-y-5 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                        {/* Type Selector */}
                        <div>
                            <label className="block text-sm font-bold mb-2 text-text-main-light dark:text-text-main">I want to...</label>
                            <div className="flex gap-2 p-1.5 bg-tertiary-light dark:bg-tertiary rounded-xl">
                                <button 
                                    type="button" 
                                    onClick={() => setType('offer')} 
                                    className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
                                        type === 'offer' 
                                            ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg' 
                                            : 'text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light/50 dark:hover:bg-tertiary/50'
                                    }`}
                                >
                                    🚗 From BPHC
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setType('request')} 
                                    className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
                                        type === 'request' 
                                            ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg' 
                                            : 'text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light/50 dark:hover:bg-tertiary/50'
                                    }`}
                                >
                                    🚀 To BPHC
                                </button>
                            </div>
                        </div>

                        {/* Route */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-text-main-light dark:text-text-main">From</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg"></span>
                                    <input 
                                        type="text" 
                                        value={destination} 
                                        onChange={e => setDestination(e.target.value)} 
                                        required 
                                        placeholder="Start Location"
                                        className="w-full pl-10 pr-3 py-3 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-tertiary-light dark:border-gray-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-text-main-light dark:text-text-main">To</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg"></span>
                                    <input 
                                        type="text" 
                                        value={destination} 
                                        onChange={e => setDestination(e.target.value)} 
                                        required 
                                        placeholder="Destination"
                                        className="w-full pl-10 pr-3 py-3 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-tertiary-light dark:border-gray-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Date/Time and Seats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-text-main-light dark:text-text-main">Departure</label>
                                <input 
                                    type="datetime-local" 
                                    value={departureTime} 
                                    onChange={e => setDepartureTime(e.target.value)} 
                                    required 
                                    className="w-full p-3 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-tertiary-light dark:border-gray-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-text-main-light dark:text-text-main">
                                    {type === 'offer' ? 'Seats Available' : 'Seats Available'}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">💺</span>
                                    <input 
                                        type="number" 
                                        value={seats} 
                                        onChange={e => setSeats(parseInt(e.target.value, 10))} 
                                        required 
                                        min="1" 
                                        max="8"
                                        className="w-full pl-10 pr-3 py-3 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-tertiary-light dark:border-gray-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Description */}
                        <div>
                            <label className="block text-sm font-bold mb-2 text-text-main-light dark:text-text-main">Additional Details</label>
                            <textarea 
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                rows={4} 
                                placeholder="e.g., Only one small bag allowed, cost sharing details, meeting point, etc."
                                className="w-full p-3 bg-tertiary-light dark:bg-tertiary rounded-xl border-2 border-tertiary-light dark:border-gray-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none resize-none"
                            />
                        </div>
                    </div>
                    
                    {error && (
                        <p className="text-red-400 text-sm mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                            {error}
                        </p>
                    )}
                    
                    <footer className="flex justify-end space-x-3 pt-6 mt-6 border-t border-tertiary-light dark:border-tertiary">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="py-2.5 px-6 rounded-xl font-semibold hover:bg-tertiary-light dark:hover:bg-tertiary transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="py-2.5 px-8 rounded-xl font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            {isSubmitting ? <Spinner /> : 'Post Ride'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default RideSharePage;