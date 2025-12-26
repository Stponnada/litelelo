'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import { CampusPlace, MarketplaceListing, CampusNotice } from '@/types';
import Spinner from '@/components/Spinner';
import {
    ArchiveBoxIcon, ShoppingCartIcon, StarIcon, ClipboardDocumentListIcon,
    CurrencyDollarIcon, CarIcon, SpaceInvaderIcon, CalendarIcon, MapIcon,
    ArrowRightIcon, MapPinIcon, TagIcon, FireIcon,
    HandoutIcon
} from '@/components/icons';
import BentoSkeleton from '@/components/BentoSkeleton';

// --- Background Texture Patterns ---

const GraphPaperPattern = () => (
    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{
            backgroundImage: `
                linear-gradient(currentColor 1px, transparent 1px),
                linear-gradient(90deg, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px'
        }}
    />
);

const DiagonalLinesPattern = () => (
    <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none"
        style={{
            backgroundImage: 'repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)',
            backgroundSize: '12px 12px'
        }}
    />
);

const PolkaDotPattern = () => (
    <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08] pointer-events-none"
        style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '20px 20px'
        }}
    />
);

const CircuitBoardPattern = () => (
    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{
            backgroundImage: `radial-gradient(currentColor 1px, transparent 1px), radial-gradient(currentColor 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 10px 10px'
        }}
    />
);

const WavePattern = () => (
    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none"
        style={{
            backgroundImage: `repeating-radial-gradient(circle at 0 0, transparent 0, currentColor 1px, transparent 2px, transparent 40px)`,
        }}
    />
);

// --- Utility Components ---

const GrainTexture = () => (
    <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] mix-blend-multiply dark:mix-blend-overlay z-0"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
    />
);

const BentoCard: React.FC<{
    href: string;
    className?: string;
    children: React.ReactNode;
    texture?: React.ReactNode;
}> = ({ href, className = "", children, texture }) => (
    <Link href={href} className={`group relative flex flex-col overflow-hidden rounded-[2rem] border backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-black/50 hover:-translate-y-1 ${className}`}>

        {/* CSS Pattern Texture */}
        {texture && (
            <div className="absolute inset-0 z-0 text-current">
                {texture}
            </div>
        )}

        <div className="relative z-10 h-full w-full p-6 flex flex-col justify-between">
            {children}
        </div>

        {/* Action Indicator Icon (Arrow) - Shows on Hover */}
        <div className="absolute top-6 right-6 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-20">
            <div className="p-2 bg-white/40 dark:bg-black/20 rounded-full backdrop-blur-md border border-white/20 shadow-sm">
                <ArrowRightIcon className="w-4 h-4 text-zinc-900 dark:text-white" />
            </div>
        </div>
    </Link>
);

const ExternalToolCard: React.FC<{
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    title: React.ReactNode;
    desc: string;
    accentColor: string;
    darkAccentColor: string;
    bgColorClass: string;
}> = ({ href, icon: Icon, title, desc, accentColor, darkAccentColor, bgColorClass }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`md:col-span-1 md:row-span-1 group relative overflow-hidden rounded-[2rem] border border-transparent ${bgColorClass} transition-all hover:scale-[1.02] duration-300 hover:shadow-lg`}>
        {/* Subtle Background Grid */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>

        <div className="relative z-10 p-6 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
                <Icon className={`w-8 h-8 ${accentColor} ${darkAccentColor} transition-transform group-hover:rotate-12 duration-500`} />
                <ArrowRightIcon className="w-4 h-4 text-zinc-400 -rotate-45 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors" />
            </div>
            <div>
                <h3 className={`text-2xl font-black ${accentColor} ${darkAccentColor} mb-1 uppercase tracking-tight`}>{title}</h3>
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{desc}</p>
            </div>
        </div>
    </a>
);

// --- Feature Widgets (Updated with H4U Typography) ---

const PlaceWidget: React.FC<{ places: CampusPlace[] }> = ({ places }) => (
    <div className="h-full flex flex-col">
        <div className="mb-6">
            <div className="flex justify-between items-start">
                <MapPinIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
            </div>
            <h3 className="text-2xl font-black text-blue-900 dark:text-blue-100 uppercase tracking-tight">
                Campus<br />Places
            </h3>
            <p className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-widest mt-1">Top Rated Spots</p>
        </div>

        <div className="mt-auto space-y-3">
            {places.length > 0 ? places.map((place, idx) => (
                <div key={place.id} className="group/item flex items-center gap-4 p-3 rounded-2xl bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-blue-100 dark:border-blue-900/30 hover:bg-white dark:hover:bg-blue-900/40 transition-all shadow-sm">
                    <div className="relative w-12 h-12 flex-shrink-0">
                        <Image src={place.primary_image_url || 'https://placehold.co/80x80'} fill className="rounded-xl object-cover" alt="" unoptimized />
                        <div className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                            #{idx + 1}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">{place.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                <StarIcon className="w-3 h-3 text-amber-500 mr-1 fill-current" />
                                {place.avg_rating.toFixed(1)}
                            </div>
                        </div>
                    </div>
                </div>
            )) : (
                <div className="h-24 flex items-center justify-center rounded-2xl border border-dashed border-blue-200 dark:border-blue-800/50 text-sm text-blue-400">
                    No reviews yet
                </div>
            )}
        </div>
    </div>
);

const MarketWidget: React.FC<{ listing: MarketplaceListing | null }> = ({ listing }) => (
    <div className="h-full flex flex-col relative">
        <div className="relative z-10 flex justify-between items-start mb-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wide">
                New Arrival
            </span>
        </div>

        <div className="relative z-10 mt-auto">
            <div className="mb-4">
                <ShoppingCartIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-tight">Market<br />Place</h3>
                <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest mt-1">Buy & Sell</p>
            </div>

            {listing ? (
                <div className="mt-3 p-3 bg-white/60 dark:bg-black/20 backdrop-blur-md rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                    <div className="flex justify-between items-center gap-2">
                        <p className="text-zinc-800 dark:text-white font-bold text-sm truncate flex-1">{listing.title}</p>
                        <span className="flex-shrink-0 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
                            ₹{listing.price}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="p-3 border border-dashed border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                    <p className="text-emerald-500/60 dark:text-emerald-400/60 text-xs font-bold text-center">No active listings</p>
                </div>
            )}
        </div>
    </div>
);

const NoticeWidget: React.FC<{ notice: CampusNotice | null }> = ({ notice }) => (
    <div className="h-full flex flex-col">
        <div className="mb-4">
            <ClipboardDocumentListIcon className="w-8 h-8 text-amber-600 dark:text-amber-500 mb-2" />
            <h3 className="text-2xl font-black text-amber-900 dark:text-amber-100 uppercase tracking-tight">Notice<br />Board</h3>
            <p className="text-[10px] font-bold text-amber-600/70 dark:text-amber-400/70 uppercase tracking-widest mt-1">Official Updates</p>
        </div>

        <div className="mt-auto h-full flex flex-col justify-end">
            {notice ? (
                <div className="relative bg-white/60 dark:bg-black/20 backdrop-blur-md p-4 rounded-xl border-l-4 border-amber-500 shadow-sm border-y border-r border-amber-100 dark:border-amber-800/30">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                            Latest
                        </span>
                        <span className="text-[10px] text-amber-600/60 dark:text-amber-400/60 font-mono">
                            {new Date(notice.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 line-clamp-2 leading-snug mb-1">
                        {notice.title}
                    </p>
                </div>
            ) : (
                <div className="text-center p-4 rounded-xl border border-dashed border-amber-200 dark:border-amber-800/50">
                    <p className="text-xs text-amber-400 font-bold">No new notices.</p>
                </div>
            )}
        </div>
    </div>
);

const LostFoundWidget = () => (
    <div className="flex flex-col h-full justify-between">
        <div>
            <ArchiveBoxIcon className="w-8 h-8 text-rose-600 dark:text-rose-500 mb-2" />
            <h3 className="text-2xl font-black text-rose-900 dark:text-rose-100 uppercase tracking-tight">Lost &<br />Found</h3>
            <p className="text-[10px] font-bold text-rose-600/70 dark:text-rose-400/70 uppercase tracking-widest mt-1">Report Items</p>
        </div>
        <div className="flex items-center text-xs font-bold text-rose-600 dark:text-rose-400 bg-white/50 dark:bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl w-fit mt-2 border border-rose-100 dark:border-rose-900/30 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/30 transition-colors">
            View Feed <ArrowRightIcon className="w-3 h-3 ml-1" />
        </div>
    </div>
);

const EventsWidget = () => (
    <div className="flex flex-col h-full justify-between">
        <div>
            <CalendarIcon className="w-8 h-8 text-violet-600 dark:text-violet-500 mb-2" />
            <h3 className="text-2xl font-black text-violet-900 dark:text-violet-100 uppercase tracking-tight">Campus<br />Events</h3>
            <p className="text-[10px] font-bold text-violet-600/70 dark:text-violet-400/70 uppercase tracking-widest mt-1">What's Happening</p>
        </div>

        {/* Mock Timeline Visual */}
        <div className="mt-3 space-y-2 opacity-80">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-violet-500 ring-4 ring-violet-100 dark:ring-violet-900/20"></div>
                <div className="h-1.5 flex-1 bg-white/50 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-violet-400/50"></div>
                </div>
            </div>
        </div>
    </div>
);

// --- Updated Quick Actions (Larger & Bolder) ---

const QuickAction: React.FC<{ to: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string; colorClass: string }> = ({ to, icon: Icon, label, colorClass }) => (
    <Link href={to} className="group relative flex flex-row items-center gap-4 p-5 rounded-[1.5rem] bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all hover:-translate-y-1 hover:shadow-xl">
        <div className={`p-3.5 rounded-2xl ${colorClass} bg-opacity-10 dark:bg-opacity-10 text-current transition-all group-hover:scale-110 group-hover:bg-opacity-20`}>
            <Icon className={`w-8 h-8`} style={{ color: 'currentColor' }} />
        </div>
        <div className="flex flex-col">
            <span className="text-sm md:text-base font-bold text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{label}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Action</span>
        </div>
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
        if (!profile?.campus) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                // Proactively refresh the session to ensure the client has a valid token
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;
                if (!session) {
                    console.error("Not authenticated, stopping fetch.");
                    return;
                }

                const [places, listings, notices] = await Promise.all([
                    supabase.rpc('get_campus_places_with_ratings', { p_campus: profile.campus }).order('avg_rating', { ascending: false }).limit(2),
                    supabase.rpc('get_marketplace_listings', { p_campus: profile.campus }).order('created_at', { ascending: false }).limit(1),
                    supabase.rpc('get_campus_notices_with_files', { p_campus: profile.campus }).limit(1)
                ]);

                if (places.data) setTopPlaces(places.data as CampusPlace[]);
                if (listings.data && listings.data.length > 0) setNewestListing(listings.data[0] as MarketplaceListing);
                if (notices.data && notices.data.length > 0) setLatestNotice(notices.data[0] as CampusNotice);

            } catch (err: unknown) {
                console.error("Error fetching campus data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [profile?.campus]);

    return (
        <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 relative selection:bg-brand-green selection:text-white font-raleway overflow-x-hidden">
            <GrainTexture />

            {/* Ambient Glows */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-green/10 dark:bg-brand-green/20 blur-[120px] rounded-full opacity-60 dark:opacity-20 pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-[800px] h-[600px] bg-blue-400/10 dark:bg-blue-600/10 blur-[120px] rounded-full opacity-40 dark:opacity-20 pointer-events-none" />

            <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-8 md:py-12">

                {/* Header */}
                <header className="mb-10 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
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
                <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 mb-10 h-auto md:h-[600px]">
                    {loading ? (
                        <>
                            <BentoSkeleton className="md:col-span-1 md:row-span-2" />
                            <BentoSkeleton className="md:col-span-1 md:row-span-1" />
                            <BentoSkeleton className="md:col-span-1 md:row-span-1" />
                            <BentoSkeleton className="md:col-span-1 md:row-span-1" />
                            <BentoSkeleton className="md:col-span-1 md:row-span-1" />
                            <BentoSkeleton className="md:col-span-1 md:row-span-1" />
                            <BentoSkeleton className="md:col-span-1 md:row-span-1" />
                        </>
                    ) : (
                        <>
                            {/* 1. Places (Blue Theme) */}
                            <BentoCard
                                href="/campus/reviews"
                                className="md:col-span-1 md:row-span-2 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30"
                                texture={<GraphPaperPattern />}
                            >
                                <PlaceWidget places={topPlaces} />
                            </BentoCard>

                            {/* 2. Marketplace (Emerald Theme - No Image BG) */}
                            <BentoCard
                                href="/campus/marketplace"
                                className="md:col-span-1 md:row-span-1 bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30"
                                texture={<DiagonalLinesPattern />}
                            >
                                <MarketWidget listing={newestListing} />
                            </BentoCard>

                            {/* 3. Notices (Amber Theme) */}
                            <BentoCard
                                href="/campus/noticeboard"
                                className="md:col-span-1 md:row-span-1 bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30"
                                texture={<CircuitBoardPattern />}
                            >
                                <NoticeWidget notice={latestNotice} />
                            </BentoCard>

                            {/* 4. Handouts for you (Indigo Theme) */}
                            <ExternalToolCard
                                href="https://h4u.app/"
                                icon={HandoutIcon}
                                title="h4u."
                                desc="Study Material"
                                accentColor="text-indigo-600"
                                darkAccentColor="dark:text-indigo-400"
                                bgColorClass="bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30"
                            />

                            {/* 5. Lost & Found (Rose Theme) */}
                            <BentoCard
                                href="/campus/lost-and-found"
                                className="md:col-span-1 md:row-span-1 bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30"
                                texture={<PolkaDotPattern />}
                            >
                                <LostFoundWidget />
                            </BentoCard>

                            {/* 6. Events (Violet Theme) */}
                            <BentoCard
                                href="/campus/events"
                                className="md:col-span-1 md:row-span-1 bg-violet-50/50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-900/30"
                                texture={<WavePattern />}
                            >
                                <EventsWidget />
                            </BentoCard>

                            {/* 7. QuietSpace (Lime/Fuchsia Theme) */}
                            <ExternalToolCard
                                href="https://quietspace-mu.vercel.app/"
                                icon={SpaceInvaderIcon}
                                title={<>QUIET<br />SPACE</>}
                                desc="Empty Rooms"
                                accentColor="text-fuchsia-600"
                                darkAccentColor="dark:text-lime-400"
                                bgColorClass="bg-fuchsia-50/50 dark:bg-fuchsia-900/10 border-fuchsia-100 dark:border-fuchsia-900/30"
                            />
                        </>
                    )}
                </div>


                {/* Quick Action Bar - Fixed Size */}
                <div className="mb-8 md:mb-12">
                    <h2 className="text-xl font-bold mb-6 px-1 flex items-center gap-2 text-zinc-800 dark:text-white">
                        <FireIcon className="w-5 h-5 text-orange-500" />
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <QuickAction to="/campus/bits-coin" icon={CurrencyDollarIcon} label="HelpOut" colorClass="text-amber-600 dark:text-amber-500" />
                        <QuickAction to="/campus/rideshare" icon={CarIcon} label="Ride Share" colorClass="text-sky-600 dark:text-sky-500" />
                        <QuickAction to="/campus/map" icon={MapIcon} label="Campus Map" colorClass="text-emerald-600 dark:text-emerald-500" />
                        <QuickAction to="/campus/marketplace" icon={TagIcon} label="Sell Item" colorClass="text-purple-600 dark:text-purple-500" />
                    </div>
                </div>

                {/* CTA Footer */}
                <div className="mt-12 rounded-[2rem] p-8 md:p-12 bg-white dark:bg-secondary border border-zinc-200 dark:border-zinc-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 dark:bg-brand-green/20 blur-[80px] rounded-full -mr-16 -mt-16 transition-opacity"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                        <div className="max-w-2xl">
                            <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">Make Campus Better.</h2>
                            <p className="text-zinc-600 dark:text-zinc-400">Join hundreds of students contributing reviews, listings, and helpful information daily.</p>
                        </div>
                        <Link href="/campus/reviews" className="whitespace-nowrap px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-2xl hover:scale-105 hover:shadow-xl transition-all">
                            Write a Review
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampusPage;