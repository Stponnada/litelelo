'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import { CampusNotice, Post as PostType, CampusTool } from '@/types';
import Spinner from '@/components/Spinner';
import {
    CalendarIcon, ClipboardDocumentListIcon,
    ArrowRightIcon, EyeSlashIcon, ArchiveBoxIcon,
    NewspaperIcon, BookOpenIcon, CubeIcon,
    ShoppingBagIcon, MapPinIcon, CampusPlacesIcon, PlusIcon
} from '@/components/icons';
import BlogPreviewCard from '@/components/BlogPreviewCard';

// --- Utility Components ---

const GrainTexture = () => (
    <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] mix-blend-multiply dark:mix-blend-overlay z-0"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
    />
);

// --- Section Components ---

const SectionHeader: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    href: string;
    accentColor: string;
}> = ({ icon, title, subtitle, href, accentColor }) => (
    <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${accentColor} bg-opacity-10`}>
                {icon}
            </div>
            <div>
                <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">{title}</h2>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{subtitle}</p>
            </div>
        </div>
        <Link
            href={href}
            className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-brand-green dark:hover:text-brand-green transition-colors group"
        >
            View All
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
    </div>
);

// --- Notice Preview Card ---
const NoticePreviewCard: React.FC<{ notice: CampusNotice }> = ({ notice }) => {
    const filePreview = notice.files && notice.files.length > 0 ? notice.files[0] : null;

    return (
        <Link
            href="/campus/noticeboard"
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
        >
            {filePreview && filePreview.file_type === 'image' && (
                <div className="relative h-40 overflow-hidden">
                    <Image
                        src={filePreview.file_url}
                        alt={notice.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-50 dark:from-amber-900/40 to-transparent" />
                </div>
            )}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                        {new Date(notice.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                </div>
                <h3 className="font-semibold text-base text-zinc-800 dark:text-zinc-100 line-clamp-2 mb-2 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                    {notice.title}
                </h3>
                {notice.description && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {notice.description}
                    </p>
                )}
                <div className="mt-auto pt-3">
                    {notice.profiles && (
                        <div className="flex items-center gap-2">
                            <Image
                                src={notice.profiles.avatar_url || ''}
                                alt={notice.profiles.username || ''}
                                width={20}
                                height={20}
                                className="w-5 h-5 rounded-full"
                                unoptimized
                            />
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                @{notice.profiles.username}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

// --- Event Mini Card ---
interface CampusEventMini {
    id: string;
    name: string;
    start_time: string;
    end_time?: string;
    location?: string;
    cover_image_url?: string;
    community_name?: string;
}

const EventMiniCard: React.FC<{ event: CampusEventMini }> = ({ event }) => {
    const eventDate = new Date(event.start_time);
    const month = eventDate.toLocaleDateString(undefined, { month: 'short' });
    const day = eventDate.getDate();

    return (
        <Link
            href={`/campus/events/${event.id}`}
            className="group flex items-center gap-4 p-4 rounded-2xl border border-violet-100 dark:border-violet-900/30 bg-violet-50/50 dark:bg-violet-900/10 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
        >
            {/* Date badge */}
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex flex-col items-center justify-center">
                <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase">{month}</span>
                <span className="text-xl font-bold text-violet-800 dark:text-violet-200 leading-none">{day}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                    {event.name}
                </h4>
                {event.location && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        📍 {event.location}
                    </p>
                )}
                {event.community_name && (
                    <p className="text-[10px] font-bold text-violet-500/70 dark:text-violet-400/70 uppercase tracking-wider mt-1">
                        {event.community_name}
                    </p>
                )}
            </div>

            <ArrowRightIcon className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </Link>
    );
};

// --- Tool Preview Card ---
const ToolPreviewCard: React.FC<{
    href: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    accentClass: string;
    isExternal?: boolean;
}> = ({ href, icon, title, description, accentClass, isExternal }) => {
    const Component = isExternal ? 'a' : Link;
    const extraProps = isExternal ? { target: "_blank", rel: "noopener noreferrer" } as any : {};

    return (
        <Component
            href={href}
            {...extraProps}
            className={`group flex items-center gap-4 p-5 rounded-2xl border ${accentClass} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}
        >
            <div className="flex-shrink-0 p-3 rounded-xl bg-white dark:bg-zinc-800 shadow-sm">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">{title}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{description}</p>
            </div>
            <ArrowRightIcon className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-all" />
        </Component>
    );
};

// --- Quick Utility Link ---
const QuickUtilityLink: React.FC<{
    href: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    accentClass: string;
}> = ({ href, icon, title, description, accentClass }) => (
    <Link
        href={href}
        className={`group flex items-center gap-4 p-5 rounded-2xl border ${accentClass} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}
    >
        <div className="flex-shrink-0">
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">{title}</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
        <ArrowRightIcon className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-all" />
    </Link>
);

// --- Main Page ---

const ExplorePage: React.FC = () => {
    const { profile } = useAuth();
    const campusName = profile?.campus || 'Campus';

    const [notices, setNotices] = useState<CampusNotice[]>([]);
    const [events, setEvents] = useState<CampusEventMini[]>([]);
    const [blogPosts, setBlogPosts] = useState<PostType[]>([]);
    const [campusTools, setCampusTools] = useState<CampusTool[]>([]);
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
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;
                if (!session) {
                    console.error("Not authenticated, stopping fetch.");
                    return;
                }

                const [noticesRes, eventsRes, blogsRes, toolsRes] = await Promise.all([
                    supabase.rpc('get_campus_notices_with_files', { p_campus: profile.campus }).limit(4),
                    supabase.rpc('get_campus_events', { p_campus: profile.campus }).limit(5),
                    supabase
                        .from('posts')
                        .select('*, author:profiles!user_id(*)')
                        .eq('post_type', 'blog')
                        .not('title', 'is', null)
                        .order('like_count', { ascending: false })
                        .limit(4),
                    supabase.from('campus_tools').select('*').order('order_index').limit(3)
                ]);

                if (noticesRes.data) setNotices(noticesRes.data as CampusNotice[]);
                if (eventsRes.data) {
                    // Filter to only upcoming events
                    const now = new Date();
                    const upcoming = (eventsRes.data as CampusEventMini[])
                        .filter(e => new Date(e.start_time) >= now)
                        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                        .slice(0, 5);
                    setEvents(upcoming);
                }
                if (blogsRes.data) {
                    // Filter to only blog-type posts (posts with a title that are long-form)
                    const blogs = (blogsRes.data as PostType[])
                        .filter(p => p.title && p.title.length > 0 && p.post_type === 'blog')
                        .slice(0, 4);
                    setBlogPosts(blogs);
                }
                if (toolsRes.data) setCampusTools(toolsRes.data as CampusTool[]);

            } catch (err: unknown) {
                console.error("Error fetching explore data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [profile?.campus]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 relative selection:bg-brand-green selection:text-white font-sans font-light overflow-x-hidden">
            <GrainTexture />

            {/* Ambient Glows */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-green/10 dark:bg-brand-green/20 blur-[120px] rounded-full opacity-60 dark:opacity-20 pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-[800px] h-[600px] bg-violet-400/10 dark:bg-violet-600/10 blur-[120px] rounded-full opacity-40 dark:opacity-20 pointer-events-none" />

            <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-12">

                {/* Header */}
                <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-500">
                            {greeting},<br />
                            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{profile?.full_name}</span>
                        </h1>
                    </div>
                </header>

                {/* ═══════════════════════════════════════════
                    SECTION 1: ANNOUNCEMENTS & NOTICES
                ═══════════════════════════════════════════ */}
                <section className="mb-14">
                    <SectionHeader
                        icon={<ClipboardDocumentListIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
                        title="Announcements"
                        subtitle="Official Updates & Notices"
                        href="/campus/noticeboard"
                        accentColor="bg-amber-500/10"
                    />

                    {notices.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {notices.map(notice => (
                                <NoticePreviewCard key={notice.id} notice={notice} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 rounded-2xl border-2 border-dashed border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-900/5">
                            <ClipboardDocumentListIcon className="w-10 h-10 text-amber-400/50 mx-auto mb-3" />
                            <p className="text-sm text-amber-500/70 font-bold">No announcements yet</p>
                        </div>
                    )}
                </section>


                {/* ═══════════════════════════════════════════
                    SECTION 2: FEATURED BLOGS
                ═══════════════════════════════════════════ */}
                <section className="mb-14">
                    <SectionHeader
                        icon={<BookOpenIcon className="w-6 h-6 text-brand-green" />}
                        title="Featured Blogs"
                        subtitle="Stories from campus"
                        href="/blog"
                        accentColor="bg-brand-green/10"
                    />

                    {blogPosts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {blogPosts.map(post => (
                                <BlogPreviewCard key={post.id} post={post} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/20">
                            <NewspaperIcon className="w-10 h-10 text-zinc-400/50 mx-auto mb-3" />
                            <p className="text-sm text-zinc-500/70 font-bold mb-3">No blogs yet</p>
                            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                                Be the first to write a blog post! Share your thoughts, projects, or campus stories.
                            </p>
                        </div>
                    )}
                </section>

                {/* ═══════════════════════════════════════════
                    SECTION 3: UPCOMING EVENTS
                ═══════════════════════════════════════════ */}
                <section className="mb-14">
                    <SectionHeader
                        icon={<CalendarIcon className="w-6 h-6 text-violet-600 dark:text-violet-400" />}
                        title="Upcoming Events"
                        subtitle="What's Happening"
                        href="/campus/events"
                        accentColor="bg-violet-500/10"
                    />

                    {events.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {events.map(event => (
                                <EventMiniCard key={event.id} event={event} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 rounded-2xl border-2 border-dashed border-violet-200 dark:border-violet-800/50 bg-violet-50/30 dark:bg-violet-900/5">
                            <CalendarIcon className="w-10 h-10 text-violet-400/50 mx-auto mb-3" />
                            <p className="text-sm text-violet-500/70 font-bold">No upcoming events</p>
                        </div>
                    )}
                </section>

                {/* ═══════════════════════════════════════════
                    SECTION 4: STUDENT TOOLS
                ═══════════════════════════════════════════ */}
                <section className="mb-14">
                    <SectionHeader
                        icon={<CubeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                        title="Built @ BITS"
                        subtitle="Built by the community"
                        href="/campus/tools"
                        accentColor="bg-blue-500/10"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {campusTools.map(tool => (
                            <ToolPreviewCard
                                key={tool.id}
                                href={tool.url}
                                icon={<span className={`text-xl font-bold ${tool.icon_color || ''}`}>{tool.icon_text}</span>}
                                title={tool.name}
                                description={tool.description}
                                accentClass={`${tool.border_color || 'border-zinc-100'} ${tool.bg_color || 'bg-zinc-50'}`}
                                isExternal={tool.is_external}
                            />
                        ))}
                    </div>
                </section>


                {/* ═══════════════════════════════════════════
                    SECTION 5: QUICK LINKS (Utility features)
                ═══════════════════════════════════════════ */}
                <section className="mb-8">
                    <h2 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                        Quick Links
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <QuickUtilityLink
                            href="/campus/lost-and-found"
                            icon={<ArchiveBoxIcon className="w-6 h-6 text-rose-500" />}
                            title="Lost & Found"
                            description="Report or find lost items"
                            accentClass="border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-900/5"
                        />
                        <QuickUtilityLink
                            href="/campus/confessions"
                            icon={<EyeSlashIcon className="w-6 h-6 text-purple-500" />}
                            title="Secret Stories"
                            description="Anonymous confessions feed"
                            accentClass="border-purple-100 dark:border-purple-900/30 bg-purple-50/30 dark:bg-purple-900/5"
                        />
                        <QuickUtilityLink
                            href="/campus/marketplace"
                            icon={<ShoppingBagIcon className="w-6 h-6 text-emerald-500" />}
                            title="Marketplace"
                            description="Buy & sell with other students"
                            accentClass="border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/5"
                        />
                        <QuickUtilityLink
                            href="/campus/rideshare"
                            icon={<MapPinIcon className="w-6 h-6 text-blue-500" />}
                            title="Rideshare"
                            description="Find travel partners for cabs"
                            accentClass="border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/5"
                        />
                        <QuickUtilityLink
                            href="/campus/reviews"
                            icon={<CampusPlacesIcon className="w-6 h-6 text-sky-500" />}
                            title="Campus Directory"
                            description="Places, contact info & reviews"
                            accentClass="border-sky-100 dark:border-sky-900/30 bg-sky-50/30 dark:bg-sky-900/5"
                        />
                    </div>
                </section>

            </div>
        </div>
    );
};

export default ExplorePage;