'use client';

// Shared "Explore" content cards, used by both the Home dashboard and the
// /campus hub so the two stay visually consistent and don't duplicate markup.

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from '@/components/icons';
import { CampusNotice } from '@/types';

export const SectionHeader: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    href: string;
    accentColor: string;
}> = ({ icon, title, subtitle, href, accentColor }) => (
    <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${accentColor} bg-opacity-10`}>{icon}</div>
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

export const NoticePreviewCard: React.FC<{ notice: CampusNotice }> = ({ notice }) => {
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
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{notice.description}</p>
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
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">@{notice.profiles.username}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

export interface CampusEventMini {
    id: string;
    name: string;
    start_time: string;
    end_time?: string;
    location?: string;
    cover_image_url?: string;
    community_name?: string;
}

export const EventMiniCard: React.FC<{ event: CampusEventMini }> = ({ event }) => {
    const eventDate = new Date(event.start_time);
    const month = eventDate.toLocaleDateString(undefined, { month: 'short' });
    const day = eventDate.getDate();

    return (
        <Link
            href={`/campus/events/${event.id}`}
            className="group flex items-center gap-4 p-4 rounded-2xl border border-violet-100 dark:border-violet-900/30 bg-violet-50/50 dark:bg-violet-900/10 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
        >
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex flex-col items-center justify-center">
                <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase">{month}</span>
                <span className="text-xl font-bold text-violet-800 dark:text-violet-200 leading-none">{day}</span>
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                    {event.name}
                </h4>
                {event.location && <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">📍 {event.location}</p>}
                {event.community_name && (
                    <p className="text-[10px] font-bold text-violet-500/70 dark:text-violet-400/70 uppercase tracking-wider mt-1">{event.community_name}</p>
                )}
            </div>
            <ArrowRightIcon className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </Link>
    );
};
