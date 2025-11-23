'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { CampusEvent } from '@/types';
import Spinner from '@/components/Spinner';
import EventCard from '@/components/EventCard';
import CreateEventModal from '@/components/CreateEventModal';
import { CalendarDaysIcon } from '@/components/icons';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import { EventClickArg } from '@fullcalendar/core';

import '@fullcalendar/daygrid';
import '@fullcalendar/timegrid';
import '@fullcalendar/list';

const ViewModeButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
    label: string;
}> = ({ isActive, onClick, children, label }) => (
    <button
        onClick={onClick}
        aria-label={label}
        className={`p-3 rounded-xl transition-all duration-200 ${isActive
            ? 'bg-brand-green text-black shadow-lg scale-105'
            : 'text-text-tertiary-light dark:text-text-tertiary hover:bg-tertiary-light dark:hover:bg-tertiary hover:text-text-secondary-light dark:hover:text-text-secondary hover:scale-105'
            }`}
    >
        {children}
    </button>
);

const EventsPage: React.FC = () => {
    const { profile } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<CampusEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [popover, setPopover] = useState<{ event: CampusEvent; x: number; y: number } | null>(null);

    useEffect(() => {
        if (!profile?.campus) return;

        const fetchEvents = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: rpcError } = await supabase.rpc('get_campus_events', {
                    p_campus: profile.campus
                });
                if (rpcError) throw rpcError;
                setEvents(data as CampusEvent[] || []);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [profile?.campus]);

    const handleEventCreated = (newEvent: CampusEvent) => {
        setEvents(prev => [newEvent, ...prev].sort((a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        ));
        setCreateModalOpen(false);
    };

    const filteredEvents = useMemo(() => {
        if (viewMode === 'calendar') return events;

        const now = new Date();
        return events.filter(event => {
            const eventDate = new Date(event.start_time);
            if (filter === 'upcoming') return eventDate >= now;
            return eventDate < now;
        }).sort((a, b) => {
            const timeA = new Date(a.start_time).getTime();
            const timeB = new Date(b.start_time).getTime();
            return filter === 'upcoming' ? timeA - timeB : timeB - timeA;
        });
    }, [events, filter, viewMode]);

    const calendarEvents = useMemo(() => events.map(event => ({
        id: event.id,
        title: event.name,
        start: new Date(event.start_time),
        end: event.end_time ? new Date(event.end_time) : undefined,
        extendedProps: { ...event }
    })), [events]);

    const handleEventClick = (clickInfo: EventClickArg) => {
        const rect = clickInfo.el.getBoundingClientRect();
        const popoverWidth = Math.min(320, window.innerWidth - 32);
        const popoverHeight = 240;
        const margin = 16;

        let popoverCenterX = rect.left + rect.width / 2;
        const minX = margin + popoverWidth / 2;
        const maxX = window.innerWidth - margin - popoverWidth / 2;
        popoverCenterX = Math.max(minX, Math.min(maxX, popoverCenterX));

        let popoverTop = rect.bottom + 8;
        if (popoverTop + popoverHeight > window.innerHeight - margin) {
            popoverTop = rect.top - popoverHeight - 8;
        }
        popoverTop = Math.max(margin, Math.min(window.innerHeight - popoverHeight - margin, popoverTop));

        setPopover({
            event: clickInfo.event.extendedProps as CampusEvent,
            x: popoverCenterX,
            y: popoverTop,
        });
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setPopover(null);
        };

        if (popover) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [popover]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-light via-secondary-light to-tertiary-light dark:from-primary dark:via-secondary dark:to-tertiary flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-8 text-center backdrop-blur-sm shadow-2xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
                        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-red-400 font-bold text-xl mb-2">Error loading events</h3>
                    <p className="text-red-300/70">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-light via-secondary-light to-tertiary-light dark:from-primary dark:via-secondary dark:to-tertiary">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
                {isCreateModalOpen && (
                    <CreateEventModal
                        onClose={() => setCreateModalOpen(false)}
                        onEventCreated={handleEventCreated}
                        onEventUpdated={() => { }}
                    />
                )}

                {/* Event Popover */}
                {popover && (
                    <div
                        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
                        onClick={() => setPopover(null)}
                    >
                        <div
                            className="absolute bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-72 md:w-80 border-2 border-brand-green/20 dark:border-brand-green/30 animate-fadeIn"
                            style={{
                                top: `${popover.y}px`,
                                left: `${popover.x}px`,
                                transform: 'translateX(-50%)',
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="mb-5">
                                <h3 className="font-bold text-text-main-light dark:text-text-main text-xl mb-4 line-clamp-2">
                                    {popover.event.name}
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-text-secondary-light dark:text-text-secondary">
                                        <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <span className="font-medium">{format(new Date(popover.event.start_time), 'MMM d, yyyy')}</span>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm text-text-secondary-light dark:text-text-secondary">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className="font-medium">{format(new Date(popover.event.start_time), 'p')}</span>
                                    </div>

                                    <div className="flex items-start gap-3 text-sm text-text-secondary-light dark:text-text-secondary">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <span className="font-medium line-clamp-2">{popover.event.location}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    router.push(`/campus/events/${popover.event.id}`);
                                    setPopover(null);
                                }}
                                className="w-full text-center py-3 text-sm font-bold bg-gradient-to-r from-brand-green to-green-400 text-black rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                View Full Details
                            </button>
                        </div>
                    </div>
                )}

                {/* Hero Header */}
                <header className="mb-6 md:mb-10 pt-2 md:pt-4">
                    <div className="text-center mb-6 md:mb-8">
                        <div className="inline-flex items-center justify-center gap-3 md:gap-4 mb-3 md:mb-4">
                            <div className="relative">
                                <CalendarDaysIcon className="w-10 h-10 md:w-14 md:h-14 text-green-400 animate-glow" />
                                <div className="absolute inset-0 blur-xl bg-green-400/30 animate-pulse"></div>
                            </div>
                            <h1 className="text-3xl md:text-6xl font-bold">
                                <span className="text-green-400">Campus</span>{" "}
                                <span className="text-blue-500">Events</span>
                            </h1>
                        </div>
                        <p className="text-sm md:text-xl text-text-secondary-light dark:text-text-secondary">
                            Discover what&apos;s happening at <span className="font-semibold text-brand-green">{profile?.campus}</span>
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={() => setCreateModalOpen(true)}
                            className="group relative inline-flex items-center gap-2 md:gap-3 bg-gradient-to-r from-green-400 to-green-400 text-black font-bold py-3 px-6 md:py-4 md:px-8 rounded-2xl hover:shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <svg className="w-5 h-5 md:w-6 md:h-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="relative z-10 text-sm md:text-base">Create New Event</span>
                        </button>
                    </div>
                </header>

                {/* Controls */}
                <div className="mb-8">
                    <div className="bg-secondary-light/80 dark:bg-secondary/80 backdrop-blur-sm rounded-2xl border border-tertiary-light/50 dark:border-tertiary/50 shadow-xl p-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-2 bg-tertiary-light/50 dark:bg-tertiary/50 p-2 rounded-xl">
                                <ViewModeButton
                                    isActive={viewMode === 'list'}
                                    onClick={() => setViewMode('list')}
                                    label="List view"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                </ViewModeButton>

                                <ViewModeButton
                                    isActive={viewMode === 'calendar'}
                                    onClick={() => setViewMode('calendar')}
                                    label="Calendar view"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </ViewModeButton>
                            </div>

                            {viewMode === 'list' && (
                                <div className="flex items-center gap-2 bg-tertiary-light/50 dark:bg-tertiary/50 p-1.5 md:p-2 rounded-xl w-full md:w-auto justify-center">
                                    <button
                                        onClick={() => setFilter('upcoming')}
                                        className={`flex-1 md:flex-none px-4 py-2 md:px-6 md:py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${filter === 'upcoming'
                                            ? 'bg-brand-green text-black shadow-lg scale-105'
                                            : 'text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary hover:scale-105'
                                            }`}
                                    >
                                        Upcoming
                                    </button>
                                    <button
                                        onClick={() => setFilter('past')}
                                        className={`flex-1 md:flex-none px-4 py-2 md:px-6 md:py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${filter === 'past'
                                            ? 'bg-brand-green text-black shadow-lg scale-105'
                                            : 'text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary hover:scale-105'
                                            }`}
                                    >
                                        Past
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                {viewMode === 'list' ? (
                    filteredEvents.length > 0 ? (
                        <div className="space-y-5">
                            {filteredEvents.map(event => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-green/20 to-blue-500/20 rounded-3xl blur-2xl"></div>
                            <div className="relative text-center py-16 md:py-32 px-4 md:px-6 bg-gradient-to-br from-secondary-light/80 to-tertiary-light/50 dark:from-secondary/80 dark:to-tertiary/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-tertiary-light/50 dark:border-tertiary/50 shadow-2xl">
                                <div className="inline-flex items-center justify-center w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-brand-green/20 to-blue-500/20 rounded-full mb-6 md:mb-8">
                                    <CalendarDaysIcon className="w-8 h-8 md:w-12 md:h-12 text-brand-green" />
                                </div>
                                <h3 className="text-xl md:text-3xl font-bold text-text-main-light dark:text-text-main mb-2 md:mb-3">
                                    No {filter} events
                                </h3>
                                <p className="text-sm md:text-lg text-text-secondary-light dark:text-text-secondary max-w-md mx-auto mb-6 md:mb-8">
                                    It&apos;s quiet right now. Be the first to create an event and bring the community together!
                                </p>
                                <button
                                    onClick={() => setCreateModalOpen(true)}
                                    className="inline-flex items-center gap-2 md:gap-3 bg-gradient-to-r from-brand-green to-green-400 text-black font-bold py-3 px-6 md:py-3.5 md:px-8 rounded-xl hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 text-sm md:text-base"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create Your First Event
                                </button>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-green/10 to-blue-500/10 rounded-3xl blur-2xl"></div>
                        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 transition-colors duration-200">
                            <FullCalendar
                                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                                }}
                                events={calendarEvents}
                                eventClick={handleEventClick}
                                height="auto"
                                dayMaxEvents={3}
                                eventDisplay="block"
                                nowIndicator={true}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventsPage;
