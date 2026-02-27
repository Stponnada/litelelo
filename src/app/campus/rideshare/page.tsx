'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { RideShare } from '@/types';
import Spinner from '@/components/Spinner';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Car,
    MapPin,
    Calendar,
    Clock,
    Users,
    MessageCircle,
    Edit2,
    Trash2,
    Plus,
    X,
    ChevronRight,
    Search,
    Info,
    ArrowRight
} from 'lucide-react';

const RideSharePage: React.FC = () => {
    const { profile } = useAuth();
    const [rides, setRides] = useState<RideShare[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'offer' | 'request'>('offer');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [editingRide, setEditingRide] = useState<RideShare | null>(null);

    const fetchRides = useCallback(async () => {
        if (!profile?.campus) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_ride_shares', { p_campus: profile.campus });
            if (error) throw error;
            setRides(data as RideShare[] || []);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred.');
            }
        } finally {
            setLoading(false);
        }
    }, [profile?.campus]);

    useEffect(() => {
        fetchRides();
    }, [fetchRides]);

    const filteredRides = useMemo(() => rides.filter(r => r.type === activeTab), [rides, activeTab]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="h-48 w-full rounded-[2.5rem] bg-secondary-light/50 dark:bg-secondary/50 animate-pulse" />
                <div className="grid grid-cols-1 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-40 w-full rounded-2xl bg-secondary-light/30 dark:bg-secondary/30 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
            <div className="p-4 bg-red-500/10 rounded-full mb-4">
                <Info className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main mb-2">Oops! Something went wrong</h2>
            <p className="text-text-secondary-light dark:text-text-secondary max-w-md mb-6">{error}</p>
            <button
                onClick={() => fetchRides()}
                className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold hover:scale-105 transition-transform"
            >
                Try Again
            </button>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AnimatePresence>
                {(isCreateModalOpen || editingRide) && profile && (
                    <RideModal
                        campus={profile.campus!}
                        editRide={editingRide}
                        onClose={() => {
                            setCreateModalOpen(false);
                            setEditingRide(null);
                        }}
                        onRideCreated={fetchRides}
                    />
                )}
            </AnimatePresence>

            {/* Premium Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 relative py-8 md:py-12 border-b border-zinc-200 dark:border-white/5"
            >
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tight">
                            Ride<span className="text-zinc-500 dark:text-zinc-400">Share</span>
                        </h1>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-zinc-900 dark:text-white">{rides.filter(r => r.type === 'offer').length}</span>
                                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-widest">Available Rides</span>
                            </div>
                            <div className="w-px h-10 bg-zinc-200 dark:bg-white/10" />
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-zinc-900 dark:text-white">{rides.filter(r => r.type === 'request').length}</span>
                                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-widest">Requests</span>
                            </div>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCreateModalOpen(true)}
                        className="relative group overflow-hidden bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-all hover:scale-105"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <Plus className="w-6 h-6 border-2 border-white rounded-md" />
                        POST A RIDE
                    </motion.button>
                </div>
            </motion.header>

            {/* Tab Switcher */}
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-1 p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 w-fit">
                    {(['offer', 'request'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${activeTab === tab
                                ? 'text-white dark:text-zinc-900'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                                }`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-zinc-900 dark:bg-white rounded-xl shadow-lg"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                {tab === 'offer' ? <Car className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                                {tab === 'offer' ? 'From Campus' : 'To Campus'}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 text-sm font-medium text-zinc-400 dark:text-zinc-500">
                    <Search className="w-4 h-4" />
                    <span>{filteredRides.length} {activeTab === 'offer' ? 'Rides Available' : 'Ride Requests'}</span>
                </div>
            </div>

            {/* Ride Cards Grid */}
            <AnimatePresence mode="popLayout">
                {filteredRides.length > 0 ? (
                    <motion.div
                        layout
                        className="grid grid-cols-1 gap-6"
                    >
                        {filteredRides.map(ride => (
                            <RideCard
                                key={ride.id}
                                ride={ride}
                                currentUserId={profile?.user_id}
                                onEdit={() => setEditingRide(ride)}
                                onRefresh={fetchRides}
                            />
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800"
                    >
                        <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                            <Search className="w-10 h-10 text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main mb-2">No results found</h3>
                        <p className="text-text-secondary-light dark:text-text-secondary mb-8">Try switching tabs or be the first to post!</p>
                        <button
                            onClick={() => setCreateModalOpen(true)}
                            className="px-8 py-3 bg-zinc-900 dark:bg-white border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-white dark:text-zinc-900 hover:scale-105 transition-all"
                        >
                            Post First Ride
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const RideCard: React.FC<{
    ride: RideShare;
    currentUserId?: string;
    onEdit: () => void;
    onRefresh: () => void;
}> = ({ ride, currentUserId, onEdit, onRefresh }) => {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    const handleContact = () => router.push(`/chat?recipient=${ride.user.user_id}`);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to cancel this ride?')) return;
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('ride_shares')
                .update({ status: 'cancelled' })
                .eq('id', ride.id);
            if (error) throw error;
            onRefresh();
        } catch (err) {
            console.error('Error cancelling ride:', err);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleJoin = async () => {
        if (ride.seats <= 0) return;
        setIsJoining(true);
        try {
            const newSeats = ride.seats - 1;
            const newStatus = newSeats === 0 ? 'full' : 'active';
            const { error } = await supabase
                .from('ride_shares')
                .update({ seats: newSeats, status: newStatus })
                .eq('id', ride.id);
            if (error) throw error;
            onRefresh();
        } catch (err) {
            console.error('Error joining ride:', err);
        } finally {
            setIsJoining(false);
        }
    };

    const isOffer = ride.type === 'offer';
    const isOwner = currentUserId === ride.user.user_id;
    const isFull = ride.status === 'full' || ride.seats <= 0;
    const isCancelled = ride.status === 'cancelled';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -4 }}
            className={`relative group bg-secondary-light dark:bg-secondary rounded-[1.75rem] shadow-xl border border-tertiary-light dark:border-white/5 overflow-hidden transition-all duration-300 ${isCancelled ? 'opacity-60 grayscale' : ''}`}
        >
            {/* The "Ticket" Decorative Side */}
            <div className={`absolute left-0 top-0 bottom-0 w-2 ${isOffer ? 'bg-zinc-800 dark:bg-zinc-300' : 'bg-zinc-400 dark:bg-zinc-600'}`} />

            {/* Top Badge (Type) */}
            <div className={`absolute top-0 right-10 px-4 py-1.5 rounded-b-xl text-[10px] font-black tracking-widest uppercase z-10 ${isCancelled ? 'bg-zinc-500 text-white' :
                isFull ? 'bg-red-500 text-white' :
                    isOffer ? 'bg-zinc-800 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-600 dark:bg-zinc-300 text-white dark:text-zinc-900'
                }`}>
                {isCancelled ? 'Cancelled' : isFull ? 'Full' : isOffer ? 'Ride Offer' : 'Ride Request'}
            </div>

            <div className="flex flex-col md:flex-row">
                {/* Main Ticket Area */}
                <div className="flex-1 p-6 md:p-8 space-y-6">
                    {/* Route Section */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-text-tertiary-light dark:text-text-tertiary uppercase tracking-wider">From</span>
                            <div className="text-xl font-black text-text-main-light dark:text-text-main flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                                {ride.origin}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-1 bg-tertiary-light/50 dark:bg-white/5 rounded-full border border-tertiary-light dark:border-white/10">
                            <ArrowRight className="w-4 h-4 text-zinc-400" />
                        </div>

                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-text-tertiary-light dark:text-text-tertiary uppercase tracking-wider">To</span>
                            <div className="text-xl font-black text-text-main-light dark:text-text-main flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                                {ride.destination}
                            </div>
                        </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary">
                            <Calendar className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                            <span className="text-sm font-bold">{format(new Date(ride.departure_time), 'EEE, MMM d')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary">
                            <Clock className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                            <span className="text-sm font-bold">{format(new Date(ride.departure_time), 'p')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary">
                            <Users className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                            <span className={`text-sm font-bold ${isFull ? 'text-red-500' : ''}`}>
                                {isFull ? 'No seats left' : `${ride.seats} ${ride.seats === 1 ? 'Seat' : 'Seats'} ${isOffer ? 'Avail' : 'Needed'}`}
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    {ride.description && (
                        <div className="p-4 bg-tertiary-light/30 dark:bg-white/[0.02] rounded-2xl border border-tertiary-light dark:border-white/5 text-sm text-text-secondary-light dark:text-text-tertiary leading-relaxed italic">
                            &quot;{ride.description}&quot;
                        </div>
                    )}
                </div>

                {/* Vertical Divider (Ticket Tear Line) */}
                <div className="hidden md:flex flex-col items-center justify-between py-2 overflow-visible">
                    <div className="w-6 h-6 rounded-full bg-primary-light dark:bg-primary -mt-5 border border-tertiary-light dark:border-white/5 shadow-inner" />
                    <div className="flex-1 w-px border-l-2 border-dashed border-tertiary-light dark:border-white/20" />
                    <div className="w-6 h-6 rounded-full bg-primary-light dark:bg-primary -mb-5 border border-tertiary-light dark:border-white/5 shadow-inner" />
                </div>

                {/* Info & Side Action Area */}
                <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-700/50 p-6 md:p-8 flex flex-col justify-between items-center gap-6 text-center">
                    <Link href={`/profile/${ride.user.username}`} className="group/avatar space-y-3 flex flex-col items-center">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-br from-zinc-400 to-zinc-600 dark:from-zinc-500 dark:to-zinc-700 rounded-full blur opacity-25 group-hover/avatar:opacity-75 transition duration-500" />
                            <Image
                                src={ride.user.avatar_url || ''}
                                alt={ride.user.username}
                                width={60}
                                height={60}
                                className="relative w-16 h-16 rounded-full object-cover border-4 border-white dark:border-[#1d1d1b] shadow-xl"
                                unoptimized
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-zinc-800 dark:text-zinc-200 group-hover/avatar:text-zinc-500 dark:group-hover/avatar:text-zinc-400 transition-colors">@{ride.user.username}</span>
                            <span className="text-[10px] font-bold text-text-tertiary-light dark:text-text-tertiary uppercase tracking-widest">{isOwner ? 'Your Post' : 'Traveler'}</span>
                        </div>
                    </Link>

                    <div className="w-full space-y-2">
                        {isOwner ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={onEdit}
                                    disabled={isCancelled}
                                    className="flex-1 py-3 bg-white dark:bg-white/5 hover:bg-tertiary-light dark:hover:bg-white/10 border border-tertiary-light dark:border-white/10 rounded-xl font-bold text-[10px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    <Edit2 className="w-3 h-3" />
                                    EDIT
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting || isCancelled}
                                    className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl font-bold text-[10px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {isDeleting ? <Spinner className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
                                    CANCEL
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {!isCancelled && !isFull && (
                                    <button
                                        onClick={handleJoin}
                                        disabled={isJoining}
                                        className="w-full py-3 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                                    >
                                        {isJoining ? <Spinner className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        {isOffer ? 'JOIN RIDE' : 'OFFER RIDE'}
                                    </button>
                                )}
                                <button
                                    onClick={handleContact}
                                    disabled={isCancelled}
                                    className="w-full py-3 bg-zinc-800 dark:bg-zinc-200 hover:bg-zinc-700 dark:hover:bg-zinc-300 text-white dark:text-zinc-900 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    CONTACT
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const RideModal: React.FC<{
    campus: string;
    editRide?: RideShare | null;
    onClose: () => void;
    onRideCreated: () => void;
}> = ({ campus, editRide, onClose, onRideCreated }) => {
    const { user } = useAuth();
    const [type, setType] = useState<'offer' | 'request'>(editRide?.type || 'offer');
    const [origin, setOrigin] = useState(editRide?.origin || (type === 'offer' ? campus : ''));
    const [destination, setDestination] = useState(editRide?.destination || (type === 'request' ? campus : ''));
    const [departureTime, setDepartureTime] = useState(editRide ? format(new Date(editRide.departure_time), "yyyy-MM-dd'T'HH:mm") : '');
    const [seats, setSeats] = useState(editRide?.seats || 1);
    const [description, setDescription] = useState(editRide?.description || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!editRide) {
            if (type === 'offer') {
                setOrigin(campus);
                setDestination('');
            } else {
                setOrigin('');
                setDestination(campus);
            }
        }
    }, [type, campus, editRide]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !origin || !destination || !departureTime || seats < 1) {
            setError('Please fill all required fields.'); return;
        }
        setIsSubmitting(true);
        try {
            const rideData = {
                user_id: user.id, campus, type, origin, destination,
                departure_time: new Date(departureTime).toISOString(), seats, description,
                status: editRide?.status || 'active'
            };

            if (editRide) {
                const { error } = await supabase.from('ride_shares').update(rideData).eq('id', editRide.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('ride_shares').insert(rideData);
                if (error) throw error;
            }

            onRideCreated();
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally { setIsSubmitting(false); }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="bg-primary-light dark:bg-secondary rounded-[2.5rem] shadow-2xl w-full max-w-xl border border-tertiary-light dark:border-white/5 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative p-8 md:p-10">
                    {/* Decorative Header Gradient */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-zinc-800 dark:bg-white" />

                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-text-main-light dark:text-text-main tracking-tight">
                                {editRide ? 'Update your trip' : 'Planning a trip?'}
                            </h2>
                            <p className="text-text-secondary-light dark:text-text-secondary mt-1">
                                Fill in the details to connect with others.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-tertiary-light dark:hover:bg-white/5 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-text-tertiary-light dark:text-text-tertiary" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Type Switcher */}
                        <div className="grid grid-cols-2 gap-2 p-1.5 bg-tertiary-light/50 dark:bg-white/[0.03] rounded-2xl border border-tertiary-light dark:border-white/5">
                            <button
                                type="button"
                                onClick={() => setType('offer')}
                                className={`py-3 rounded-xl font-black text-[10px] tracking-widest transition-all ${type === 'offer'
                                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg'
                                    : 'text-text-secondary-light dark:text-text-secondary hover:text-text-main-light dark:hover:text-text-main'
                                    }`}
                            >
                                OFFERING A RIDE
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('request')}
                                className={`py-3 rounded-xl font-black text-[10px] tracking-widest transition-all ${type === 'request'
                                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg'
                                    : 'text-text-secondary-light dark:text-text-secondary hover:text-text-main-light dark:hover:text-text-main'
                                    }`}
                            >
                                REQUESTING A RIDE
                            </button>
                        </div>

                        {/* Origin & Destination */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-tertiary-light dark:text-text-tertiary uppercase tracking-widest pl-1">From</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <input
                                        type="text"
                                        value={origin}
                                        onChange={e => setOrigin(e.target.value)}
                                        placeholder="Start location"
                                        className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:border-zinc-500 focus:ring-4 focus:ring-zinc-500/10 transition-all outline-none font-medium"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-tertiary-light dark:text-text-tertiary uppercase tracking-widest pl-1">To</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <input
                                        type="text"
                                        value={destination}
                                        onChange={e => setDestination(e.target.value)}
                                        placeholder="Destination"
                                        className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:border-zinc-500 focus:ring-4 focus:ring-zinc-500/10 transition-all outline-none font-medium"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Time & Seats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-tertiary-light dark:text-text-tertiary uppercase tracking-widest pl-1">Departure</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                                    <input
                                        type="datetime-local"
                                        value={departureTime}
                                        onChange={e => setDepartureTime(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:border-zinc-500 focus:ring-4 focus:ring-zinc-500/10 transition-all outline-none font-medium text-sm"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-tertiary-light dark:text-text-tertiary uppercase tracking-widest pl-1">
                                    {type === 'offer' ? 'Available Seats' : 'Seats Required'}
                                </label>
                                <div className="relative group">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={seats}
                                        onChange={e => setSeats(parseInt(e.target.value))}
                                        className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:border-zinc-500 focus:ring-4 focus:ring-zinc-500/10 transition-all outline-none font-medium"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-tertiary-light dark:text-text-tertiary uppercase tracking-widest pl-1">Notes</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Meeting point, luggage info, cost sharing expectation..."
                                rows={3}
                                className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:border-zinc-500 focus:ring-4 focus:ring-zinc-500/10 transition-all outline-none font-medium resize-none"
                            />
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold flex items-center gap-2"
                            >
                                <Info className="w-4 h-4" />
                                {error}
                            </motion.p>
                        )}

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 px-6 border border-tertiary-light dark:border-white/10 rounded-2xl font-black text-[10px] hover:bg-tertiary-light dark:hover:bg-white/5 transition-all uppercase tracking-widest"
                            >
                                GO BACK
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-[2] py-4 px-6 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black text-[10px] shadow-xl hover:shadow-zinc-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50"
                            >
                                {isSubmitting ? <Spinner className="w-5 h-5" /> : (editRide ? 'UPDATE TRIP' : 'POST TRIP')}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default RideSharePage;