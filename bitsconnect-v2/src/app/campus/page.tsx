'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import { CampusPlace, MarketplaceListing, LostAndFoundItem, CampusNotice } from '@/types';
import Spinner from '@/components/Spinner';
import {
    ArchiveBoxIcon, ShoppingCartIcon, StarIcon, ClipboardDocumentListIcon,
    CurrencyDollarIcon, CarIcon, SpaceInvaderIcon, CalendarIcon, MapIcon,
    ArrowRightIcon, MapPinIcon, TagIcon, FireIcon,
    HandoutIcon
} from '@/components/icons';

// --- Utility Components & Styles ---

const GrainTexture = () => (
    <div className="fixed inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.04] mix-blend-multiply dark:mix-blend-overlay z-0"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
    />
);

const BentoCard: React.FC<{
    href: string;
    className?: string;
    children: React.ReactNode;
    gradient?: string
}> = ({ href, className = "", children, gradient }) => (
    <Link href={href} className={`group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-secondary backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:shadow-brand-green/5 hover:-translate-y-1 ${className}`}>
        {gradient && (
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${gradient} transition-opacity duration-500`} />
        )}
        <div className="relative z-10 h-full w-full p-5 flex flex-col justify-between">
            {children}
        </div>
    </Link>
);

// --- Feature Widgets ---

const PlaceWidget: React.FC<{ places: CampusPlace[] }> = ({ places }) => (
    <div className="h-full flex flex-col">
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                <MapPinIcon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded-full">Explore</span>
        </div>
        <div>
            <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-1">Campus Places</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">Discover & review the best spots.</p>
        </div>

        <div className="mt-auto space-y-3">
            {places.length > 0 ? places.map((place) => (
                <div key={place.id} className="flex items-center gap-3 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                    <img src={place.primary_image_url || 'https://placehold.co/80x80'} className="w-10 h-10 rounded-lg object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200 truncate">{place.name}</p>
                        <div className="flex items-center text-xs text-amber-500 font-medium">
                            <StarIcon className="w-3 h-3 mr-1 fill-current" />
                            {place.avg_rating.toFixed(1)}
                        </div>
                    </div>
                </div>
            )) : (
                <div className="text-sm text-zinc-400 italic">No places reviewed yet.</div>
            )}
        </div>
    </div>
);

const MarketWidget: React.FC<{ listing: MarketplaceListing | null }> = ({ listing }) => (
    <div className="h-full flex flex-col relative">
        {/* Background Image for both modes, lighter in light mode */}
        {listing?.image_urls?.[0] && (
            <div className="absolute inset-0 z-0">
                <img src={listing.image_urls[0]} className="w-full h-full object-cover opacity-[0.08] dark:opacity-20 group-hover:scale-110 transition-all duration-700 grayscale group-hover:grayscale-0" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent dark:from-zinc-900 dark:via-zinc-900/50 dark:to-transparent" />
            </div>
        )}

        <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 backdrop-blur-md rounded-2xl text-emerald-600 dark:text-emerald-400">
                <ShoppingCartIcon className="w-6 h-6" />
            </div>
            <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 backdrop-blur-md">
                New Arrival
            </span>
        </div>

        <div className="relative z-10 mt-auto">
            <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-1">Marketplace</h3>
            {listing ? (
                <div className="mt-2 p-3 bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm">
                    <p className="text-zinc-800 dark:text-white font-semibold text-sm truncate">{listing.title}</p>
                    <p className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">₹{listing.price}</p>
                </div>
            ) : (
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Buy, sell & trade campus items.</p>
            )}
        </div>
    </div>
);

const NoticeWidget: React.FC<{ notice: CampusNotice | null }> = ({ notice }) => (
    <div className="h-full flex flex-col">
        <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-500">
                <ClipboardDocumentListIcon className="w-5 h-5" />
            </div>
        </div>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Notices</h3>
        <div className="mt-auto pt-2">
            {notice ? (
                <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-800/30 relative overflow-hidden group-hover:border-amber-300 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-amber-100 line-clamp-2 leading-relaxed">
                        {notice.title}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 font-mono">
                        {new Date(notice.created_at).toLocaleDateString()}
                    </p>
                </div>
            ) : (
                <p className="text-xs text-zinc-500">No new notices.</p>
            )}
        </div>
    </div>
);

const QuickAction: React.FC<{ to: string; icon: any; label: string; colorClass: string }> = ({ to, icon: Icon, label, colorClass }) => (
    <Link href={to} className="group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white dark:bg-secondary border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all hover:scale-105 hover:shadow-lg">
        <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-10 dark:bg-opacity-20 text-current transition-all group-hover:scale-110`}>
            <Icon className={`w-6 h-6`} style={{ color: 'currentColor' }} />
        </div>
        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">{label}</span>
    </Link>
);

// --- Main Page ---

const CampusPage: React.FC = () => {
    const { profile } = useAuth();
    const campusName = profile?.campus || 'Campus';

    const [topPlaces, setTopPlaces] = useState<CampusPlace[]>([]);
    const [newestListing, setNewestListing] = useState<MarketplaceListing | null>(null);
    const [latestNotice, setLatestNotice] = useState<CampusNotice | null>(null);
    const [loading, setLoading] = useState(true);
    const [greeting, setGreeting] = useState('Hello');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    useEffect(() => {
        if (!profile?.campus) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [places, listings, notices] = await Promise.all([
                    supabase.rpc('get_campus_places_with_ratings', { p_campus: profile.campus }).order('avg_rating', { ascending: false }).limit(2),
                    supabase.rpc('get_marketplace_listings', { p_campus: profile.campus }).order('created_at', { ascending: false }).limit(1),
                    supabase.rpc('get_campus_notices_with_files', { p_campus: profile.campus }).limit(1)
                ]);

                if (places.data) setTopPlaces(places.data as CampusPlace[]);
                if (listings.data && listings.data.length > 0) setNewestListing(listings.data[0] as MarketplaceListing);
                if (notices.data && notices.data.length > 0) setLatestNotice(notices.data[0] as any);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [profile?.campus]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black text-zinc-900 dark:text-zinc-100 relative selection:bg-brand-green selection:text-white font-raleway overflow-x-hidden">
            <GrainTexture />

            {/* Ambient Glows - Subtler for Light Mode */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-green/10 dark:bg-brand-green/20 blur-[120px] rounded-full opacity-60 dark:opacity-20 pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-[800px] h-[600px] bg-blue-400/10 dark:bg-blue-600/10 blur-[120px] rounded-full opacity-40 dark:opacity-20 pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

                {/* Header */}
                <header className="mb-10 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-brand-green font-bold text-xs md:text-sm uppercase tracking-widest">
                            <span className="w-2 h-2 bg-brand-green rounded-full animate-pulse" />
                            Online at BITS
                        </div>
                        <h1 className="text-4xl md:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
                            {greeting},<br />
                            <span className="text-zinc-800 dark:text-zinc-200">{profile?.full_name}</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-left md:text-right pl-1 md:pl-0 border-l-4 md:border-l-0 border-brand-green md:border-none">
                            <p className="text-xs md:text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ml-3 md:ml-0">Current Campus</p>
                            <p className="text-xl md:text-2xl font-black text-zinc-800 dark:text-white ml-3 md:ml-0">{campusName}</p>
                        </div>
                    </div>
                </header>


                {/* Main Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 mb-8 h-auto md:h-[600px]">

                    {/* 1. Places (Large Vertical) */}
                    <BentoCard href="/campus/reviews" className="md:col-span-1 md:row-span-2" gradient="from-blue-500/5 to-purple-500/5">
                        {loading ? <Spinner /> : <PlaceWidget places={topPlaces} />}
                    </BentoCard>

                    {/* 2. Marketplace */}
                    <BentoCard href="/campus/marketplace" className="md:col-span-1 md:row-span-1" gradient="from-emerald-500/10 to-teal-500/10">
                        {loading ? <Spinner /> : <MarketWidget listing={newestListing} />}
                    </BentoCard>

                    {/* 3. Notices */}
                    <BentoCard href="/campus/noticeboard" className="md:col-span-1 md:row-span-1" gradient="from-amber-500/5 to-orange-500/5">
                        {loading ? <Spinner /> : <NoticeWidget notice={latestNotice} />}
                    </BentoCard>

                    {/* 4. Handouts for you */}
                    <Link href="https://h4u.app/" target="_blank" className="md:col-span-1 md:row-span-1 group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-secondary transition-all hover:scale-[1.02] duration-300">
                        {/* Dark Mode Grid */}
                        <div className="absolute inset-0 hidden dark:block bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] bg-[position:0_0] hover:bg-[position:100%_100%] transition-[background-position] duration-[2000ms]" />
                        {/* Light Mode Grid */}
                        <div className="absolute inset-0 dark:hidden opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-20"></div>
                        <div className="relative z-10 p-5 flex flex-col h-full justify-between">
                            <HandoutIcon className="w-8 h-8 text-indigo-600 dark:text-lime-400 transition-colors" />
                            <div>
                                <h3 className="text-lg text-indigo-900 dark:text-lime-400 mb-1 transition-colors font-mono" style={{ lineHeight: '1.4' }}>h4u.</h3>
                                <p className="text-[10px] text-indigo-600/70 dark:text-zinc-400 font-mono">One place for all your study materials</p>
                            </div>
                        </div>
                    </Link>

                    {/* 5. Lost & Found */}
                    <BentoCard href="/campus/lost-and-found" className="md:col-span-1 md:row-span-1" gradient="from-red-500/5 to-rose-500/5">
                        <div className="flex flex-col h-full">
                            <div className="p-2 w-fit bg-gray-500/10 rounded-xl text-red-600 dark:text-red-500 mb-2">
                                <ArchiveBoxIcon className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-zinc-800 dark:text-white">Lost & Found</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Report or find items.</p>
                            <div className="mt-auto flex items-center text-xs font-bold text-red-500 group-hover:translate-x-1 transition-transform">
                                Check feed <ArrowRightIcon className="w-3 h-3 ml-1" />
                            </div>
                        </div>
                    </BentoCard>

                    {/* 6. Events */}
                    <BentoCard href="/campus/events" className="md:col-span-1 md:row-span-1" gradient="from-indigo-500/5 to-violet-500/5">
                        <div className="flex flex-col h-full">
                            <div className="p-2 w-fit bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-500 mb-2">
                                <CalendarIcon className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-zinc-800 dark:text-white">Events</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">What's coming up?</p>
                            <div className="mt-auto w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className="w-3/4 h-full bg-indigo-500"></div>
                            </div>
                        </div>
                    </BentoCard>

                    {/* 7. QuietSpace */}
                    <Link href="https://quietspace-mu.vercel.app/" target="_blank" className="md:col-span-1 md:row-span-1 group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-secondary transition-all hover:scale-[1.02] duration-300">
                        {/* Dark Mode Grid */}
                        <div className="absolute inset-0 hidden dark:block bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] bg-[position:0_0] hover:bg-[position:100%_100%] transition-[background-position] duration-[2000ms]" />
                        {/* Light Mode Grid */}
                        <div className="absolute inset-0 dark:hidden opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-20"></div>
                        <div className="relative z-10 p-5 flex flex-col h-full justify-between">
                            <SpaceInvaderIcon className="w-8 h-8 text-indigo-600 dark:text-lime-400 transition-colors" />
                            <div>
                                <h3 className="text-lg text-indigo-900 dark:text-lime-400 mb-1 transition-colors font-mono" style={{ lineHeight: '1.4' }}>QUIET<br />SPACE</h3>
                                <p className="text-[10px] text-indigo-600/70 dark:text-zinc-400 font-mono">FIND_EMPTY_ROOMS_</p>
                            </div>
                        </div>
                    </Link>
                </div>


                {/* Quick Action Bar */}
                <div className="mb-8 md:mb-12">
                    <h2 className="text-xl font-bold mb-4 px-1 flex items-center gap-2 text-zinc-800 dark:text-white">
                        <FireIcon className="w-5 h-5 text-orange-500" />
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <QuickAction to="/campus/bits-coin" icon={CurrencyDollarIcon} label="Bits Coin" colorClass="text-amber-600 dark:text-amber-500" />
                        <QuickAction to="/campus/rideshare" icon={CarIcon} label="Ride Share" colorClass="text-sky-600 dark:text-sky-500" />
                        <QuickAction to="/campus/map" icon={MapIcon} label="Campus Map" colorClass="text-emerald-600 dark:text-emerald-500" />
                        <QuickAction to="/campus/marketplace" icon={TagIcon} label="Sell Item" colorClass="text-purple-600 dark:text-purple-500" />
                    </div>
                </div>

                {/* CTA Footer - Adaptive Design */}
                <div className="mt-12 rounded-3xl p-8 md:p-12 bg-white dark:bg-secondary border border-zinc-200 dark:border-zinc-800 relative overflow-hidden group">
                    {/* Gradient splashes that change based on theme */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 dark:bg-brand-green/20 blur-[80px] rounded-full -mr-16 -mt-16 transition-opacity"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                        <div className="max-w-2xl">
                            <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">Make Campus Better.</h2>
                            <p className="text-zinc-600 dark:text-zinc-400">Join hundreds of students contributing reviews, listings, and helpful information daily.</p>
                        </div>
                        <Link href="/campus/reviews" className="whitespace-nowrap px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:scale-105 hover:shadow-xl transition-all">
                            Write a Review
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampusPage;