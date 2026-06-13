'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import Link from 'next/link';
import { isAfter } from 'date-fns';
import { getResizedAvatarUrl } from '@/utils/imageUtils';
import Skeleton from './Skeleton';
import FuzzyAutocomplete from './FuzzyAutocomplete';
import BlogPreviewCard from './BlogPreviewCard';
import { SectionHeader, NoticePreviewCard, EventMiniCard, type CampusEventMini } from './campus/ExploreCards';
import { ClipboardDocumentListIcon, BookOpenIcon, CalendarIcon } from './icons';
import { INDIAN_CITIES, canonicalizeCity } from '@/data/indianCities';
import type { Profile, CampusNotice, Post as PostType } from '@/types';

const CITY_QUICK_PICKS = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Jaipur'];

interface DiscoveryPerson {
    user_id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    branch: string | null;
    campus: string | null;
    admission_year: number | null;
    follower_count: number;
    hometown: string | null;
    language: string | null;
    is_incoming: boolean;
}

interface CommunityItem {
    id: string;
    name: string;
    avatar_url: string | null;
}

const PERSON_COLUMNS =
    'user_id, username, full_name, avatar_url, branch, campus, admission_year, follower_count, hometown, language, is_incoming';

// ---------- People ----------

const PersonCard: React.FC<{
    person: DiscoveryPerson;
    isFollowing: boolean;
    isWaved: boolean;
    onFollow: (userId: string) => void;
    onWave: (userId: string) => void;
    showStatus?: boolean;
}> = ({ person, isFollowing, isWaved, onFollow, onWave, showStatus }) => (
    <div className="bg-secondary-light/70 dark:bg-secondary/70 backdrop-blur-xl rounded-xl border border-tertiary-light/50 dark:border-white/5 p-4 flex flex-col items-center text-center gap-3 hover:border-brand-green/20 transition-colors group">
        <Link href={`/profile/${person.username}`} className="flex-shrink-0 relative">
            <Image
                src={getResizedAvatarUrl(person.avatar_url, 72, 72, person.full_name || person.username)}
                alt={person.full_name || person.username}
                width={72}
                height={72}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-transparent group-hover:ring-brand-green/30 transition-all"
                unoptimized
            />
        </Link>
        <div className="w-full min-w-0">
            <Link
                href={`/profile/${person.username}`}
                className="font-bold text-sm text-text-main-light dark:text-text-main hover:text-brand-green transition-colors block truncate"
            >
                {person.full_name || person.username}
            </Link>
            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary truncate">@{person.username}</p>
            {showStatus && (
                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    person.is_incoming
                        ? 'bg-brand-green/15 text-brand-green'
                        : 'bg-tertiary-light dark:bg-white/10 text-text-secondary-light dark:text-text-secondary'
                }`}>
                    {person.is_incoming ? 'Incoming' : 'Senior'}
                </span>
            )}
            {!showStatus && person.branch && (
                <p className="text-[11px] text-text-secondary-light dark:text-text-secondary mt-1 truncate leading-snug">
                    {person.branch}
                </p>
            )}
        </div>
        <div className="w-full space-y-1.5">
            <button
                onClick={() => !isWaved && onWave(person.user_id)}
                disabled={isWaved}
                className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isWaved
                        ? 'bg-brand-green/15 text-brand-green cursor-default'
                        : 'bg-brand-green text-black hover:bg-brand-green-darker active:scale-95'
                }`}
            >
                {isWaved ? 'Waved 👋' : 'Wave 👋'}
            </button>
            <button
                onClick={() => !isFollowing && onFollow(person.user_id)}
                disabled={isFollowing}
                className={`w-full text-xs font-medium transition-colors ${
                    isFollowing
                        ? 'text-text-tertiary-light dark:text-text-tertiary cursor-default'
                        : 'text-text-secondary-light dark:text-text-secondary hover:text-brand-green'
                }`}
            >
                {isFollowing ? 'Following' : 'Follow'}
            </button>
        </div>
    </div>
);

const CardSkeleton: React.FC = () => (
    <div className="bg-secondary-light/70 dark:bg-secondary/70 rounded-xl border border-tertiary-light/50 dark:border-white/5 p-4 flex flex-col items-center gap-3">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="w-full space-y-1.5">
            <Skeleton className="h-3.5 w-3/4 mx-auto rounded" />
            <Skeleton className="h-2.5 w-1/2 mx-auto rounded" />
        </div>
        <Skeleton className="h-7 w-full rounded-lg" />
    </div>
);

const PeopleGrid: React.FC<{
    people: DiscoveryPerson[];
    loading: boolean;
    followingIds: Set<string>;
    wavedIds: Set<string>;
    onFollow: (id: string) => void;
    onWave: (id: string) => void;
    emptyMessage: string;
    showStatus?: boolean;
}> = ({ people, loading, followingIds, wavedIds, onFollow, onWave, emptyMessage, showStatus }) => {
    if (loading) {
        return (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {[...Array(6)].map((_, i) => <div key={i} className="flex-none w-36"><CardSkeleton /></div>)}
            </div>
        );
    }
    if (people.length === 0) {
        return <p className="text-sm text-text-tertiary-light dark:text-text-tertiary py-4">{emptyMessage}</p>;
    }
    return (
        // Dense single-row carousel — keeps people from dominating the scroll.
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
            {people.map(person => (
                <div key={person.user_id} className="flex-none w-36 snap-start">
                    <PersonCard
                        person={person}
                        isFollowing={followingIds.has(person.user_id)}
                        isWaved={wavedIds.has(person.user_id)}
                        onFollow={onFollow}
                        onWave={onWave}
                        showStatus={showStatus}
                    />
                </div>
            ))}
        </div>
    );
};

const Section: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <section>
        <div className="mb-4">
            <h2 className="text-lg font-bold text-text-main-light dark:text-text-main">{title}</h2>
            {subtitle && <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-0.5">{subtitle}</p>}
        </div>
        {children}
    </section>
);

// ---------- Inline city capture (returning users with no hometown) ----------

const CityPrompt: React.FC<{ onSaved: (city: string) => void }> = ({ onSaved }) => {
    const { user } = useAuth();
    const [city, setCity] = useState('');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        const canonical = canonicalizeCity(city);
        if (!canonical || !user) return;
        setSaving(true);
        const { error } = await supabase.from('profiles').update({ hometown: canonical }).eq('user_id', user.id);
        setSaving(false);
        if (!error) onSaved(canonical);
    };

    return (
        <div className="bg-brand-green/10 border border-brand-green/30 rounded-xl p-4">
            <h2 className="text-base font-bold text-text-main-light dark:text-text-main">Add your hometown</h2>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary mt-0.5 mb-3">
                Juniors arriving from your city are looking for seniors to connect with. Add your city so they can find you.
            </p>
            <div className="flex gap-2 items-start">
                <div className="flex-1">
                    <FuzzyAutocomplete
                        options={INDIAN_CITIES}
                        value={city}
                        onChange={setCity}
                        canonicalize={canonicalizeCity}
                        placeholder="Search or type your city…"
                        quickPicks={CITY_QUICK_PICKS}
                        inputClassName="w-full p-2.5 bg-secondary-light dark:bg-primary border border-tertiary-light dark:border-white/10 rounded-lg text-sm text-text-main-light dark:text-text-main placeholder-text-tertiary-light dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                </div>
                <button
                    onClick={save}
                    disabled={saving || !city.trim()}
                    className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-brand-green text-black hover:bg-brand-green-darker disabled:opacity-50"
                >
                    {saving ? 'Saving…' : 'Save'}
                </button>
            </div>
        </div>
    );
};

// ---------- Campus band (events / notices / explore) ----------

const ExploreCampusCard: React.FC<{ incoming: boolean }> = ({ incoming }) => (
    <Link
        href="/campus"
        className="block bg-secondary-light/70 dark:bg-secondary/70 backdrop-blur-xl rounded-xl border border-tertiary-light/50 dark:border-white/5 p-5 hover:border-brand-green/30 transition-colors"
    >
        <h3 className="font-bold text-text-main-light dark:text-text-main">🏛️ Explore campus</h3>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary mt-1">
            {incoming ? 'See what your new home looks like — spots, hangouts, and what to expect.' : 'Spots, hangouts, and everything around campus.'}
        </p>
    </Link>
);

const GridSkeleton: React.FC<{ cols?: string }> = ({ cols = 'sm:grid-cols-2 lg:grid-cols-4' }) => (
    <div className={`grid grid-cols-1 ${cols} gap-4`}>
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
    </div>
);

const EmptyHint: React.FC<{ text: string }> = ({ text }) => (
    <p className="text-sm text-text-tertiary-light dark:text-text-tertiary py-4">{text}</p>
);

const ClubsCard: React.FC<{ communities: CommunityItem[]; loading: boolean }> = ({ communities, loading }) => (
    <div className="bg-secondary-light/70 dark:bg-secondary/70 backdrop-blur-xl rounded-xl border border-tertiary-light/50 dark:border-white/5 p-5">
        <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-text-main-light dark:text-text-main">🎟️ Your clubs & orgs</h3>
            <Link href="/communities" className="text-xs text-brand-green hover:underline">Discover</Link>
        </div>
        {loading ? (
            <div className="space-y-2"><Skeleton className="h-9 rounded" /><Skeleton className="h-9 rounded" /></div>
        ) : communities.length === 0 ? (
            <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">You haven&apos;t joined any clubs yet — <Link href="/communities" className="text-brand-green hover:underline">find your people</Link>.</p>
        ) : (
            <ul className="space-y-2">
                {communities.map(c => (
                    <li key={c.id}>
                        <Link href={`/communities/${c.id}`} className="flex items-center gap-3 group">
                            <Image
                                src={getResizedAvatarUrl(c.avatar_url, 36, 36, c.name)}
                                alt={c.name}
                                width={36}
                                height={36}
                                className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                                unoptimized
                            />
                            <span className="text-sm font-medium text-text-main-light dark:text-text-main truncate group-hover:text-brand-green transition-colors">{c.name}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        )}
    </div>
);

// ---------- The mirror: how you appear to everyone, before you wave ----------

const MirrorCard: React.FC<{ profile: Profile }> = ({ profile }) => {
    const needsPhoto = !profile.avatar_url;
    const needsIntro = !profile.bio;
    return (
        <div className="bg-gradient-to-br from-brand-green/10 to-transparent border border-brand-green/30 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-4">
                <Image
                    src={getResizedAvatarUrl(profile.avatar_url, 64, 64, profile.full_name || profile.username)}
                    alt="You"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-brand-green/40 flex-shrink-0"
                    unoptimized
                />
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] uppercase tracking-wide text-brand-green font-semibold">Before you say hi 👋</p>
                    <p className="font-bold text-text-main-light dark:text-text-main truncate">{profile.full_name || profile.username}</p>
                    <p className="text-xs text-text-tertiary-light dark:text-text-tertiary truncate">
                        {profile.bio || profile.branch || 'This is how everyone sees you.'}
                    </p>
                </div>
                <Link
                    href={`/profile/${profile.username}`}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-green text-black hover:bg-brand-green-darker"
                >
                    Edit
                </Link>
            </div>
            {(needsPhoto || needsIntro) && (
                <p className="text-xs text-text-secondary-light dark:text-text-secondary mt-3">
                    {needsPhoto && needsIntro
                        ? 'No photo or intro yet — people remember faces, not blanks. Get yourself ready before you wave.'
                        : needsPhoto
                        ? 'Add a photo — people remember faces, not blanks.'
                        : 'Add a one-line intro so people know who you are.'}
                </p>
            )}
        </div>
    );
};

// ---------- Dashboard ----------

const HomePage: React.FC = () => {
    const { user, profile, updateProfileContext } = useAuth();
    const incoming = !!profile?.is_incoming;

    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
    const [wavedIds, setWavedIds] = useState<Set<string>>(new Set());

    // Incoming-focused
    const [cityPeople, setCityPeople] = useState<DiscoveryPerson[]>([]);
    const [batchmates, setBatchmates] = useState<DiscoveryPerson[]>([]);
    const [loadingCity, setLoadingCity] = useState(true);
    const [loadingBatch, setLoadingBatch] = useState(true);

    // On-campus-focused
    const [languagePeople, setLanguagePeople] = useState<DiscoveryPerson[]>([]);
    const [branchPeople, setBranchPeople] = useState<DiscoveryPerson[]>([]);
    const [communities, setCommunities] = useState<CommunityItem[]>([]);
    const [loadingLanguage, setLoadingLanguage] = useState(true);
    const [loadingBranch, setLoadingBranch] = useState(true);
    const [loadingClubs, setLoadingClubs] = useState(true);

    // Shared campus content
    const [notices, setNotices] = useState<CampusNotice[]>([]);
    const [events, setEvents] = useState<CampusEventMini[]>([]);
    const [blogs, setBlogs] = useState<PostType[]>([]);
    const [loadingNotices, setLoadingNotices] = useState(true);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [loadingBlogs, setLoadingBlogs] = useState(true);

    useEffect(() => {
        if (!user || !profile) return;

        const fetchAll = async () => {
            const { data: followingData } = await supabase
                .from('followers')
                .select('following_id')
                .eq('follower_id', user.id);
            setFollowingIds(new Set((followingData || []).map((f: any) => f.following_id)));

            const { data: wavesData } = await supabase
                .from('waves')
                .select('recipient_id')
                .eq('sender_id', user.id);
            setWavedIds(new Set((wavesData || []).map((w: any) => w.recipient_id)));

            if (incoming) {
                // From your city: seniors + incoming, seniors surfaced first.
                if (profile.hometown) {
                    const { data } = await supabase
                        .from('profiles')
                        .select(PERSON_COLUMNS)
                        .ilike('hometown', profile.hometown)
                        .eq('profile_complete', true)
                        .neq('user_id', user.id)
                        .order('is_incoming', { ascending: true })
                        .order('follower_count', { ascending: false })
                        .limit(15);
                    setCityPeople(data || []);
                }
                setLoadingCity(false);

                // Your batch: same campus + year.
                if (profile.campus && profile.admission_year) {
                    const { data } = await supabase
                        .from('profiles')
                        .select(PERSON_COLUMNS)
                        .eq('campus', profile.campus)
                        .eq('admission_year', profile.admission_year)
                        .eq('profile_complete', true)
                        .neq('user_id', user.id)
                        .order('follower_count', { ascending: false })
                        .limit(12);
                    setBatchmates(data || []);
                }
                setLoadingBatch(false);
            } else {
                // People who speak your language (same campus).
                if (profile.language && profile.campus) {
                    const { data } = await supabase
                        .from('profiles')
                        .select(PERSON_COLUMNS)
                        .eq('campus', profile.campus)
                        .ilike('language', profile.language)
                        .eq('profile_complete', true)
                        .neq('user_id', user.id)
                        .order('follower_count', { ascending: false })
                        .limit(12);
                    setLanguagePeople(data || []);
                }
                setLoadingLanguage(false);

                // From your branch (same campus).
                if (profile.branch && profile.campus) {
                    const { data } = await supabase
                        .from('profiles')
                        .select(PERSON_COLUMNS)
                        .eq('campus', profile.campus)
                        .eq('branch', profile.branch)
                        .eq('profile_complete', true)
                        .neq('user_id', user.id)
                        .order('follower_count', { ascending: false })
                        .limit(12);
                    setBranchPeople(data || []);
                }
                setLoadingBranch(false);

                // Your clubs & orgs.
                const { data: memberData } = await supabase
                    .from('community_members')
                    .select('communities ( id, name, avatar_url )')
                    .eq('user_id', user.id)
                    .limit(8);
                setCommunities(
                    (memberData || [])
                        .map((m: any) => m.communities)
                        .filter(Boolean)
                );
                setLoadingClubs(false);
            }

            // Shared campus content (announcements + events).
            if (profile.campus) {
                const { data: noticeData } = await supabase
                    .rpc('get_campus_notices_with_files', { p_campus: profile.campus })
                    .limit(6);
                setNotices((noticeData as CampusNotice[]) || []);
                setLoadingNotices(false);

                const { data: eventData } = await supabase.rpc('get_campus_events', { p_campus: profile.campus });
                const upcoming = ((eventData as CampusEventMini[]) || [])
                    .filter(e => isAfter(new Date(e.start_time), new Date()))
                    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                    .slice(0, 4);
                setEvents(upcoming);
                setLoadingEvents(false);
            } else {
                setLoadingNotices(false);
                setLoadingEvents(false);
            }

            // Featured blogs (not campus-scoped; ranked by popularity).
            const { data: blogData } = await supabase
                .from('posts')
                .select('*, author:profiles!user_id(*)')
                .eq('post_type', 'blog')
                .not('title', 'is', null)
                .order('like_count', { ascending: false })
                .limit(4);
            setBlogs((blogData as PostType[]) || []);
            setLoadingBlogs(false);
        };

        fetchAll();
    }, [user?.id, incoming, profile?.campus, profile?.admission_year, profile?.hometown, profile?.language, profile?.branch]);

    const handleFollow = useCallback(async (userIdToFollow: string) => {
        if (!user) return;
        setFollowingIds(prev => new Set([...prev, userIdToFollow]));
        await supabase.from('followers').insert({ follower_id: user.id, following_id: userIdToFollow });
    }, [user]);

    const handleWave = useCallback(async (recipientId: string) => {
        if (!user) return;
        setWavedIds(prev => new Set([...prev, recipientId]));
        await supabase
            .from('waves')
            .upsert({ sender_id: user.id, recipient_id: recipientId }, { onConflict: 'sender_id,recipient_id', ignoreDuplicates: true });
    }, [user]);

    if (!profile) return null;

    const firstName = (profile.full_name || profile.username || '').split(' ')[0];

    return (
        <div className="space-y-10 max-w-5xl mx-auto">
            {/* Hero */}
            <section>
                {incoming ? (
                    <>
                        <h1 className="text-2xl font-black text-text-main-light dark:text-text-main">
                            Welcome to the Batch of {profile.admission_year || new Date().getFullYear()} 👋
                        </h1>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary mt-1">
                            {profile.hometown
                                ? `Find your people${profile.campus ? ` at BITS ${profile.campus}` : ''} — starting with ${profile.hometown}.`
                                : 'Find your batchmates and seniors before you even reach campus.'}
                        </p>
                    </>
                ) : (
                    <>
                        <h1 className="text-2xl font-black text-text-main-light dark:text-text-main">
                            Hey{firstName ? `, ${firstName}` : ''} 👋
                        </h1>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary mt-1">
                            What&apos;s happening{profile.campus ? ` at BITS ${profile.campus}` : ''}.
                        </p>
                    </>
                )}
            </section>

            {/* The mirror — glance at yourself before you go say hi */}
            <MirrorCard profile={profile} />

            {/* On-campus users with no hometown: nudge to add it for incoming juniors */}
            {!incoming && !profile.hometown && (
                <CityPrompt onSaved={city => updateProfileContext({ ...profile, hometown: city })} />
            )}

            {incoming ? (
                <>
                    {/* From your city — the centerpiece */}
                    {profile.hometown ? (
                        <Section
                            title={`From ${profile.hometown}`}
                            subtitle="Seniors and batchmates from your city — say hi, ask questions, plan to meet."
                        >
                            <PeopleGrid
                                people={cityPeople}
                                loading={loadingCity}
                                followingIds={followingIds}
                                wavedIds={wavedIds}
                                onFollow={handleFollow}
                                onWave={handleWave}
                                emptyMessage="No one from your city yet — you might be the first! Share litelelo with friends from home."
                                showStatus
                            />
                        </Section>
                    ) : (
                        <CityPrompt onSaved={city => updateProfileContext({ ...profile, hometown: city })} />
                    )}

                    {/* Your batch */}
                    <Section
                        title={`Batch of ${profile.admission_year || new Date().getFullYear()}`}
                        subtitle="Other incoming students joining with you."
                    >
                        <PeopleGrid
                            people={batchmates}
                            loading={loadingBatch}
                            followingIds={followingIds}
                            wavedIds={wavedIds}
                            onFollow={handleFollow}
                            onWave={handleWave}
                            emptyMessage="No batchmates here yet — invite your friends!"
                        />
                    </Section>
                </>
            ) : (
                <>
                    {/* People who speak your language */}
                    {profile.language && (
                        <Section title={`${profile.language} speakers`} subtitle={`At BITS ${profile.campus}`}>
                            <PeopleGrid
                                people={languagePeople}
                                loading={loadingLanguage}
                                followingIds={followingIds}
                                wavedIds={wavedIds}
                                onFollow={handleFollow}
                                onWave={handleWave}
                                emptyMessage="No one else yet — add your language in settings to match."
                            />
                        </Section>
                    )}

                    {/* From your branch */}
                    {profile.branch && (
                        <Section title={profile.branch} subtitle="Others in your branch">
                            <PeopleGrid
                                people={branchPeople}
                                loading={loadingBranch}
                                followingIds={followingIds}
                                wavedIds={wavedIds}
                                onFollow={handleFollow}
                                onWave={handleWave}
                                emptyMessage="No one else from your branch yet."
                            />
                        </Section>
                    )}
                </>
            )}

            {/* Announcements */}
            <section>
                <SectionHeader
                    icon={<ClipboardDocumentListIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
                    title="Announcements"
                    subtitle="Official updates & notices"
                    href="/campus/noticeboard"
                    accentColor="bg-amber-500/10"
                />
                {loadingNotices ? <GridSkeleton /> : notices.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {notices.map(n => <NoticePreviewCard key={n.id} notice={n} />)}
                    </div>
                ) : <EmptyHint text="No announcements yet." />}
            </section>

            {/* Featured Blogs */}
            <section>
                <SectionHeader
                    icon={<BookOpenIcon className="w-6 h-6 text-brand-green" />}
                    title="Featured Blogs"
                    subtitle="Stories from campus"
                    href="/blog"
                    accentColor="bg-brand-green/10"
                />
                {loadingBlogs ? <GridSkeleton /> : blogs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {blogs.map(p => <BlogPreviewCard key={p.id} post={p} />)}
                    </div>
                ) : <EmptyHint text="No blogs yet — be the first to write one." />}
            </section>

            {/* Upcoming Events */}
            <section>
                <SectionHeader
                    icon={<CalendarIcon className="w-6 h-6 text-violet-600 dark:text-violet-400" />}
                    title="Upcoming Events"
                    subtitle="What's happening"
                    href="/campus/events"
                    accentColor="bg-violet-500/10"
                />
                {loadingEvents ? <GridSkeleton cols="md:grid-cols-2" /> : events.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {events.map(e => <EventMiniCard key={e.id} event={e} />)}
                    </div>
                ) : <EmptyHint text="No upcoming events." />}
            </section>

            {/* On-campus: your clubs + the campus hub */}
            {!incoming ? (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ClubsCard communities={communities} loading={loadingClubs} />
                    <ExploreCampusCard incoming={incoming} />
                </section>
            ) : (
                <ExploreCampusCard incoming={incoming} />
            )}
        </div>
    );
};

export default HomePage;
