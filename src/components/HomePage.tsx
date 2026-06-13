'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import Link from 'next/link';
import { format, isAfter } from 'date-fns';
import { getResizedAvatarUrl } from '@/utils/imageUtils';
import Skeleton from './Skeleton';
import FuzzyAutocomplete from './FuzzyAutocomplete';
import { INDIAN_CITIES, canonicalizeCity } from '@/data/indianCities';

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

interface EventItem {
    id: string;
    name: string;
    start_time: string;
    location: string | null;
    image_url: string | null;
}

interface NoticeItem {
    id: string;
    title: string;
    description: string | null;
    created_at: string;
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
    onFollow: (userId: string) => void;
    showStatus?: boolean;
}> = ({ person, isFollowing, onFollow, showStatus }) => (
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
        <button
            onClick={() => !isFollowing && onFollow(person.user_id)}
            disabled={isFollowing}
            className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isFollowing
                    ? 'bg-tertiary-light dark:bg-white/5 text-text-tertiary-light dark:text-text-tertiary cursor-default'
                    : 'bg-brand-green text-black hover:bg-brand-green-darker active:scale-95'
            }`}
        >
            {isFollowing ? 'Following' : 'Follow'}
        </button>
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
    onFollow: (id: string) => void;
    emptyMessage: string;
    showStatus?: boolean;
}> = ({ people, loading, followingIds, onFollow, emptyMessage, showStatus }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
        );
    }
    if (people.length === 0) {
        return <p className="text-sm text-text-tertiary-light dark:text-text-tertiary py-4">{emptyMessage}</p>;
    }
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {people.map(person => (
                <PersonCard
                    key={person.user_id}
                    person={person}
                    isFollowing={followingIds.has(person.user_id)}
                    onFollow={onFollow}
                    showStatus={showStatus}
                />
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

const EventsCard: React.FC<{ events: EventItem[]; loading: boolean }> = ({ events, loading }) => (
    <div className="bg-secondary-light/70 dark:bg-secondary/70 backdrop-blur-xl rounded-xl border border-tertiary-light/50 dark:border-white/5 p-5">
        <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-text-main-light dark:text-text-main">📅 Upcoming events</h3>
            <Link href="/campus/events" className="text-xs text-brand-green hover:underline">See all</Link>
        </div>
        {loading ? (
            <div className="space-y-2"><Skeleton className="h-10 rounded" /><Skeleton className="h-10 rounded" /></div>
        ) : events.length === 0 ? (
            <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">Nothing scheduled yet.</p>
        ) : (
            <ul className="space-y-2">
                {events.map(ev => (
                    <li key={ev.id}>
                        <Link href={`/campus/events/${ev.id}`} className="flex items-center gap-3 group">
                            <div className="w-11 h-11 rounded-lg bg-tertiary-light dark:bg-white/5 flex flex-col items-center justify-center flex-shrink-0">
                                <span className="text-[10px] uppercase text-text-tertiary-light dark:text-text-tertiary leading-none">{format(new Date(ev.start_time), 'MMM')}</span>
                                <span className="text-sm font-bold text-text-main-light dark:text-text-main leading-tight">{format(new Date(ev.start_time), 'd')}</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-text-main-light dark:text-text-main truncate group-hover:text-brand-green transition-colors">{ev.name}</p>
                                <p className="text-xs text-text-tertiary-light dark:text-text-tertiary truncate">
                                    {format(new Date(ev.start_time), 'h:mm a')}{ev.location ? ` · ${ev.location}` : ''}
                                </p>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        )}
    </div>
);

const NoticesCard: React.FC<{ notices: NoticeItem[]; loading: boolean }> = ({ notices, loading }) => (
    <div className="bg-secondary-light/70 dark:bg-secondary/70 backdrop-blur-xl rounded-xl border border-tertiary-light/50 dark:border-white/5 p-5">
        <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-text-main-light dark:text-text-main">📣 From clubs & orgs</h3>
            <Link href="/campus/noticeboard" className="text-xs text-brand-green hover:underline">See all</Link>
        </div>
        {loading ? (
            <div className="space-y-2"><Skeleton className="h-10 rounded" /><Skeleton className="h-10 rounded" /></div>
        ) : notices.length === 0 ? (
            <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">No announcements yet.</p>
        ) : (
            <ul className="space-y-3">
                {notices.map(n => (
                    <li key={n.id}>
                        <Link href="/campus/noticeboard" className="block group">
                            <p className="text-sm font-medium text-text-main-light dark:text-text-main truncate group-hover:text-brand-green transition-colors">{n.title}</p>
                            {n.description && <p className="text-xs text-text-tertiary-light dark:text-text-tertiary line-clamp-1">{n.description}</p>}
                        </Link>
                    </li>
                ))}
            </ul>
        )}
    </div>
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

// ---------- Dashboard ----------

const HomePage: React.FC = () => {
    const { user, profile, updateProfileContext } = useAuth();
    const incoming = !!profile?.is_incoming;

    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

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

    // Shared campus band
    const [events, setEvents] = useState<EventItem[]>([]);
    const [notices, setNotices] = useState<NoticeItem[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [loadingNotices, setLoadingNotices] = useState(true);

    useEffect(() => {
        if (!user || !profile) return;

        const fetchAll = async () => {
            const { data: followingData } = await supabase
                .from('followers')
                .select('following_id')
                .eq('follower_id', user.id);
            setFollowingIds(new Set((followingData || []).map((f: any) => f.following_id)));

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
                        .limit(24);
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
                        .limit(18);
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
                        .limit(18);
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
                        .limit(18);
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

            // Shared campus band.
            if (profile.campus) {
                const { data: eventData } = await supabase.rpc('get_campus_events', { p_campus: profile.campus });
                const upcoming = (eventData || [])
                    .filter((e: any) => isAfter(new Date(e.start_time), new Date()))
                    .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                    .slice(0, 4);
                setEvents(upcoming);
                setLoadingEvents(false);

                const { data: noticeData } = await supabase.rpc('get_campus_notices_with_files', { p_campus: profile.campus });
                setNotices((noticeData || []).slice(0, 3));
                setLoadingNotices(false);
            } else {
                setLoadingEvents(false);
                setLoadingNotices(false);
            }
        };

        fetchAll();
    }, [user?.id, incoming, profile?.campus, profile?.admission_year, profile?.hometown, profile?.language, profile?.branch]);

    const handleFollow = useCallback(async (userIdToFollow: string) => {
        if (!user) return;
        setFollowingIds(prev => new Set([...prev, userIdToFollow]));
        await supabase.from('followers').insert({ follower_id: user.id, following_id: userIdToFollow });
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
                                onFollow={handleFollow}
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
                            onFollow={handleFollow}
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
                                onFollow={handleFollow}
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
                                onFollow={handleFollow}
                                emptyMessage="No one else from your branch yet."
                            />
                        </Section>
                    )}
                </>
            )}

            {/* Shared campus band */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EventsCard events={events} loading={loadingEvents} />
                <NoticesCard notices={notices} loading={loadingNotices} />
                {!incoming && <ClubsCard communities={communities} loading={loadingClubs} />}
                <ExploreCampusCard incoming={incoming} />
            </section>
        </div>
    );
};

export default HomePage;
