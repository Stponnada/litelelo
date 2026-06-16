'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { getResizedAvatarUrl } from '@/utils/imageUtils';
import { formatTimestamp } from '@/utils/timeUtils';
import Skeleton from './Skeleton';

// A Facebook-style wall: a time-ordered feed of social events for a profile.
// Friendships are public; waves and pending requests are returned by the RPC
// only when you are the owner (privacy is enforced server-side).
interface WallEvent {
    kind: 'friendship' | 'wave' | 'request';
    actor_id: string;
    actor_username: string;
    actor_full_name: string | null;
    actor_avatar_url: string | null;
    actor_is_incoming: boolean;
    created_at: string;
}

const Wall: React.FC<{ ownerId: string; isOwner: boolean; ownerName?: string | null }> = ({ ownerId, isOwner, ownerName }) => {
    const { user } = useAuth();
    const [events, setEvents] = useState<WallEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [wavedBack, setWavedBack] = useState<Set<string>>(new Set());
    const [handledRequests, setHandledRequests] = useState<Map<string, 'accepted' | 'declined'>>(new Map());

    useEffect(() => {
        if (!ownerId) return;
        let active = true;
        (async () => {
            setLoading(true);
            const { data } = await supabase.rpc('get_wall_events', { p_profile_id: ownerId });
            if (!active) return;
            setEvents((data as WallEvent[]) || []);
            setLoading(false);
        })();
        return () => { active = false; };
    }, [ownerId]);

    // supabase-js returns { error } rather than throwing; retry once after a session
    // refresh, then revert the optimistic state so a failed action never looks done.
    const runWrite = useCallback(async (write: () => PromiseLike<{ error: unknown }>, revert: () => void) => {
        let { error } = await write();
        if (error) {
            await supabase.auth.refreshSession().catch(() => {});
            ({ error } = await write());
        }
        if (error) { console.error('litelelo: wall action failed, reverting', error); revert(); }
    }, []);

    const waveBack = useCallback((actorId: string) => {
        if (!user) return;
        setWavedBack(prev => new Set(prev).add(actorId));
        runWrite(
            () => supabase.from('waves').upsert({ sender_id: user.id, recipient_id: actorId }, { onConflict: 'sender_id,recipient_id', ignoreDuplicates: true }),
            () => setWavedBack(prev => { const n = new Set(prev); n.delete(actorId); return n; }),
        );
    }, [user, runWrite]);

    const acceptRequest = useCallback((actorId: string) => {
        setHandledRequests(prev => new Map(prev).set(actorId, 'accepted'));
        runWrite(
            () => supabase.rpc('accept_friend_request', { requester_id: actorId }),
            () => setHandledRequests(prev => { const n = new Map(prev); n.delete(actorId); return n; }),
        );
    }, [runWrite]);

    const declineRequest = useCallback((actorId: string) => {
        setHandledRequests(prev => new Map(prev).set(actorId, 'declined'));
        runWrite(
            () => supabase.rpc('cancel_or_deny_friend_request', { other_user_id: actorId }),
            () => setHandledRequests(prev => { const n = new Map(prev); n.delete(actorId); return n; }),
        );
    }, [runWrite]);

    if (loading) {
        return <div className="space-y-2.5">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;
    }

    if (events.length === 0) {
        return (
            <p className="text-sm text-text-tertiary-light dark:text-text-tertiary py-2">
                {isOwner
                    ? 'Nothing on your wall yet — wave at someone or add a friend to get things going.'
                    : `Nothing on ${ownerName || 'this'}'s wall yet.`}
            </p>
        );
    }

    return (
        <div className="space-y-2.5">
            {events.map((e, i) => {
                const name = e.actor_full_name || e.actor_username;
                const handled = handledRequests.get(e.actor_id);

                let line: React.ReactNode = null;
                let action: React.ReactNode = null;

                if (e.kind === 'friendship') {
                    line = isOwner
                        ? <>You and <span className="font-semibold">{name}</span> are now friends</>
                        : <><span className="font-semibold">{ownerName || 'They'}</span> and <span className="font-semibold">{name}</span> are now friends</>;
                } else if (e.kind === 'wave') {
                    line = <><span className="font-semibold">{name}</span> waved at you 👋</>;
                    const wb = wavedBack.has(e.actor_id);
                    action = (
                        <button
                            onClick={() => !wb && waveBack(e.actor_id)}
                            disabled={wb}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${wb ? 'bg-brand-green/15 text-brand-green cursor-default' : 'bg-brand-green text-black hover:bg-brand-green-darker active:scale-95'}`}
                        >
                            {wb ? 'Waved 👋' : 'Wave back'}
                        </button>
                    );
                } else {
                    line = <><span className="font-semibold">{name}</span> sent you a friend request</>;
                    if (handled === 'accepted') action = <span className="text-xs font-semibold text-brand-green">Accepted ✓</span>;
                    else if (handled === 'declined') action = <span className="text-xs text-text-tertiary-light dark:text-text-tertiary">Declined</span>;
                    else action = (
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => acceptRequest(e.actor_id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-green text-black hover:bg-brand-green-darker active:scale-95 transition-all">Accept</button>
                            <button onClick={() => declineRequest(e.actor_id)} className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-text-tertiary-light dark:text-text-tertiary hover:bg-black/5 dark:hover:bg-white/10 transition-colors">Decline</button>
                        </div>
                    );
                }

                return (
                    <div key={`${e.kind}-${e.actor_id}-${i}`} className="flex items-center gap-3 bg-secondary-light/70 dark:bg-secondary/70 backdrop-blur-xl rounded-xl border border-tertiary-light/50 dark:border-white/5 p-3">
                        <Link href={`/profile/${e.actor_username}`} className="flex-shrink-0">
                            <Image
                                src={getResizedAvatarUrl(e.actor_avatar_url, 44, 44, name)}
                                alt={name}
                                width={44}
                                height={44}
                                className="w-11 h-11 rounded-full object-cover"
                                unoptimized
                            />
                        </Link>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-text-main-light dark:text-text-main truncate">
                                <Link href={`/profile/${e.actor_username}`} className="hover:underline">{line}</Link>
                            </p>
                            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary">{formatTimestamp(e.created_at)}</p>
                        </div>
                        {action && <div className="flex-shrink-0">{action}</div>}
                    </div>
                );
            })}
        </div>
    );
};

export default Wall;
