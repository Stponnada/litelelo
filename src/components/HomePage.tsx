'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import Link from 'next/link';
import { getResizedAvatarUrl } from '@/utils/imageUtils';
import Skeleton from './Skeleton';

interface DiscoveryPerson {
    user_id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    branch: string | null;
    campus: string | null;
    admission_year: number | null;
    follower_count: number;
}

const PersonCard: React.FC<{
    person: DiscoveryPerson;
    isFollowing: boolean;
    onFollow: (userId: string) => void;
}> = ({ person, isFollowing, onFollow }) => (
    <div className="bg-secondary-light/70 dark:bg-secondary/70 backdrop-blur-xl rounded-xl border border-tertiary-light/50 dark:border-white/5 p-4 flex flex-col items-center text-center gap-3 hover:border-brand-green/20 transition-colors group">
        <Link href={`/profile/${person.username}`} className="flex-shrink-0">
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
            {person.branch && (
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
            <Skeleton className="h-2.5 w-2/3 mx-auto rounded" />
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
}> = ({ people, loading, followingIds, onFollow, emptyMessage }) => {
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
                />
            ))}
        </div>
    );
};

const HomePage: React.FC = () => {
    const { user, profile } = useAuth();
    const [batchmates, setBatchmates] = useState<DiscoveryPerson[]>([]);
    const [campusPeople, setCampusPeople] = useState<DiscoveryPerson[]>([]);
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
    const [loadingBatch, setLoadingBatch] = useState(true);
    const [loadingCampus, setLoadingCampus] = useState(true);

    useEffect(() => {
        if (!user || !profile) return;

        const fetchDiscovery = async () => {
            // Fetch who we already follow
            const { data: followingData } = await supabase
                .from('followers')
                .select('following_id')
                .eq('follower_id', user.id);
            setFollowingIds(new Set((followingData || []).map((f: any) => f.following_id)));

            // Batchmates: same campus + year
            if (profile.campus && profile.admission_year) {
                const { data } = await supabase
                    .from('profiles')
                    .select('user_id, username, full_name, avatar_url, branch, campus, admission_year, follower_count')
                    .eq('campus', profile.campus)
                    .eq('admission_year', profile.admission_year)
                    .eq('profile_complete', true)
                    .neq('user_id', user.id)
                    .order('follower_count', { ascending: false })
                    .limit(24);
                setBatchmates(data || []);
            }
            setLoadingBatch(false);

            // Broader campus: same campus, different years
            if (profile.campus) {
                const campusBase = supabase
                    .from('profiles')
                    .select('user_id, username, full_name, avatar_url, branch, campus, admission_year, follower_count')
                    .eq('campus', profile.campus)
                    .eq('profile_complete', true)
                    .neq('user_id', user.id)
                    .order('follower_count', { ascending: false })
                    .limit(12);

                const { data } = await (profile.admission_year
                    ? campusBase.neq('admission_year', profile.admission_year)
                    : campusBase);
                setCampusPeople(data || []);
            }
            setLoadingCampus(false);
        };

        fetchDiscovery();
    }, [user?.id, profile?.campus, profile?.admission_year]);

    const handleFollow = useCallback(async (userIdToFollow: string) => {
        if (!user) return;
        setFollowingIds(prev => new Set([...prev, userIdToFollow]));
        await supabase.from('followers').insert({ follower_id: user.id, following_id: userIdToFollow });
    }, [user]);

    if (!profile) return null;

    const hasBatchInfo = profile.campus || profile.admission_year;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main discovery columns */}
            <main className="col-span-1 lg:col-span-12 space-y-10">
                {/* Batch section */}
                <section>
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-text-main-light dark:text-text-main">
                            {profile.admission_year
                                ? `Class of ${profile.admission_year}${profile.campus ? ` · ${profile.campus}` : ''}`
                                : profile.campus
                                ? `BITS ${profile.campus}`
                                : 'Your Batch'}
                        </h2>
                        {!loadingBatch && batchmates.length > 0 && (
                            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-0.5">
                                {batchmates.length} batchmate{batchmates.length !== 1 ? 's' : ''} already on litelelo
                            </p>
                        )}
                    </div>
                    {hasBatchInfo ? (
                        <PeopleGrid
                            people={batchmates}
                            loading={loadingBatch}
                            followingIds={followingIds}
                            onFollow={handleFollow}
                            emptyMessage="No batchmates found yet — share litelelo with your friends!"
                        />
                    ) : (
                        <p className="text-sm text-text-tertiary-light dark:text-text-tertiary py-4">
                            Add your campus and batch year to find your batchmates.
                        </p>
                    )}
                </section>

                {/* Broader campus section */}
                {profile.campus && (
                    <section>
                        <div className="mb-4">
                            <h2 className="text-lg font-bold text-text-main-light dark:text-text-main">
                                More from BITS {profile.campus}
                            </h2>
                            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-0.5">
                                Other batches at your campus
                            </p>
                        </div>
                        <PeopleGrid
                            people={campusPeople}
                            loading={loadingCampus}
                            followingIds={followingIds}
                            onFollow={handleFollow}
                            emptyMessage="No one else from your campus yet."
                        />
                    </section>
                )}
            </main>

            {/* Sidebar removed — no useful info at this stage */}
            <aside className="hidden">
                <div className="sticky top-8 space-y-4">
                    {/* Your profile mini-card */}
                    <div className="bg-secondary-light/70 dark:bg-secondary/70 backdrop-blur-xl rounded-xl border border-tertiary-light/50 dark:border-white/5 p-4">
                        <Link href={`/profile/${profile.username}`} className="flex items-center gap-3 group">
                            <Image
                                src={getResizedAvatarUrl(profile.avatar_url, 48, 48, profile.full_name || profile.username)}
                                alt="Your avatar"
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-brand-green/30 transition-all flex-shrink-0"
                                unoptimized
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-text-main-light dark:text-text-main truncate group-hover:text-brand-green transition-colors">
                                    {profile.full_name}
                                </p>
                                <p className="text-xs text-text-tertiary-light dark:text-text-tertiary">@{profile.username}</p>
                            </div>
                        </Link>
                        <div className="flex gap-4 mt-4 pt-4 border-t border-tertiary-light/30 dark:border-white/5 text-center">
                            <div className="flex-1">
                                <p className="font-bold text-sm text-text-main-light dark:text-text-main">{profile.follower_count ?? 0}</p>
                                <p className="text-[10px] font-medium text-text-tertiary-light dark:text-text-tertiary uppercase tracking-wide">Followers</p>
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-sm text-text-main-light dark:text-text-main">{profile.following_count ?? 0}</p>
                                <p className="text-[10px] font-medium text-text-tertiary-light dark:text-text-tertiary uppercase tracking-wide">Following</p>
                            </div>
                        </div>
                    </div>

                    {/* Branch info chip */}
                    {(profile.branch || (profile.campus && profile.admission_year)) && (
                        <div className="bg-secondary-light/70 dark:bg-secondary/70 backdrop-blur-xl rounded-xl border border-tertiary-light/50 dark:border-white/5 p-4 space-y-2 text-sm">
                            {profile.branch && (
                                <p className="text-text-secondary-light dark:text-text-secondary">
                                    <span className="text-text-tertiary-light dark:text-text-tertiary text-xs uppercase tracking-wide block mb-0.5">Branch</span>
                                    {profile.branch}
                                </p>
                            )}
                            {profile.campus && (
                                <p className="text-text-secondary-light dark:text-text-secondary">
                                    <span className="text-text-tertiary-light dark:text-text-tertiary text-xs uppercase tracking-wide block mb-0.5">Campus</span>
                                    BITS {profile.campus}
                                </p>
                            )}
                            {profile.admission_year && (
                                <p className="text-text-secondary-light dark:text-text-secondary">
                                    <span className="text-text-tertiary-light dark:text-text-tertiary text-xs uppercase tracking-wide block mb-0.5">Batch</span>
                                    Class of {profile.admission_year}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
};

export default HomePage;
