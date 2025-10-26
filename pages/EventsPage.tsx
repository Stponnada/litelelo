// src/pages/EventsPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { CampusEvent } from '../types';
import Spinner from '../components/Spinner';
import EventCard from '../components/EventCard';
import CreateEventModal from '../components/CreateEventModal';
import { CalendarDaysIcon } from '../components/icons';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';

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
    className={`p-3 rounded-xl transition-all duration-200 ${
      isActive 
        ? 'bg-brand-green text-black shadow-lg scale-105' 
        : 'text-text-tertiary-light dark:text-text-tertiary hover:bg-tertiary-light dark:hover:bg-tertiary hover:text-text-secondary-light dark:hover:text-text-secondary hover:scale-105'
    }`}
  >
    {children}
  </button>
);

const EventsPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
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
      } catch (err: any) {
        setError(err.message);
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

  const handleEventClick = (clickInfo: any) => {
    const rect = clickInfo.el.getBoundingClientRect();
    const popoverWidth = 320;
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
      event: clickInfo.event.extendedProps,
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
          />
        )}
        
        {/* Event Popover */}
        {popover && (
          <div 
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
            onClick={() => setPopover(null)}
          >
            <div
              className="absolute bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-80 border-2 border-brand-green/20 dark:border-brand-green/30 animate-fadeIn"
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
                  navigate(`/campus/events/${popover.event.id}`);
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
        <header className="mb-10 pt-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-4 mb-4">
              <div className="relative">
                <CalendarDaysIcon className="w-14 h-14 text-brand-green animate-pulse" />
                <div className="absolute inset-0 blur-xl bg-brand-green/30 animate-pulse"></div>
              </div>
                <h1 className="text-5xl md:text-6xl font-bold">
                  <span className="text-brand-green">Campus</span>{" "}
                  <span className="text-blue-500">Events</span>
                </h1>
            </div>
            <p className="text-xl text-text-secondary-light dark:text-text-secondary">
              Discover what's happening at <span className="font-semibold text-brand-green">{profile?.campus}</span>
            </p>
          </div>
          
          <div className="flex justify-center">
            <button 
              onClick={() => setCreateModalOpen(true)} 
              className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-brand-green to-green-400 text-black font-bold py-4 px-8 rounded-2xl hover:shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <svg className="w-6 h-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="relative z-10">Create New Event</span>
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
                <div className="flex items-center gap-2 bg-tertiary-light/50 dark:bg-tertiary/50 p-2 rounded-xl">
                  <button 
                    onClick={() => setFilter('upcoming')} 
                    className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                      filter === 'upcoming' 
                        ? 'bg-brand-green text-black shadow-lg scale-105' 
                        : 'text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary hover:scale-105'
                    }`}
                  >
                    Upcoming
                  </button>
                  <button 
                    onClick={() => setFilter('past')} 
                    className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                      filter === 'past' 
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
              <div className="relative text-center py-32 px-6 bg-gradient-to-br from-secondary-light/80 to-tertiary-light/50 dark:from-secondary/80 dark:to-tertiary/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-tertiary-light/50 dark:border-tertiary/50 shadow-2xl">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-brand-green/20 to-blue-500/20 rounded-full mb-8">
                  <CalendarDaysIcon className="w-12 h-12 text-brand-green" />
                </div>
                <h3 className="text-3xl font-bold text-text-main-light dark:text-text-main mb-3">
                  No {filter} events
                </h3>
                <p className="text-lg text-text-secondary-light dark:text-text-secondary max-w-md mx-auto mb-8">
                  It's quiet right now. Be the first to create an event and bring the community together!
                </p>
                <button 
                  onClick={() => setCreateModalOpen(true)}
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-brand-green to-green-400 text-black font-bold py-3.5 px-8 rounded-xl hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
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
              <style>{`
                .fc {
                  --fc-border-color: rgb(229 231 235 / 0.3);
                  --fc-button-bg-color: #10b981;
                  --fc-button-border-color: #10b981;
                  --fc-button-hover-bg-color: #059669;
                  --fc-button-hover-border-color: #059669;
                  --fc-button-active-bg-color: #047857;
                  --fc-button-active-border-color: #047857;
                  --fc-today-bg-color: rgb(16 185 129 / 0.1);
                }
                
                .dark .fc {
                  --fc-border-color: rgb(55 65 81 / 0.3);
                  --fc-page-bg-color: transparent;
                  --fc-neutral-bg-color: rgb(31 41 55 / 0.3);
                }
                
                .fc .fc-button {
                  font-weight: 700;
                  text-transform: capitalize;
                  padding: 0.625rem 1.25rem;
                  border-radius: 0.75rem;
                  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                  transition: all 0.2s;
                }
                
                .fc .fc-button:not(:disabled):hover {
                  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
                  transform: translateY(-2px) scale(1.02);
                }
                
                .fc .fc-button:not(:disabled):active {
                  transform: translateY(0) scale(0.98);
                }
                
                .fc .fc-button-primary:disabled {
                  opacity: 0.5;
                }
                
                .fc-theme-standard th {
                  border: none;
                  padding: 1.25rem 0;
                  font-weight: 700;
                  font-size: 0.875rem;
                  text-transform: uppercase;
                  letter-spacing: 0.1em;
                }
                
                .fc-theme-standard td {
                  border-color: var(--fc-border-color);
                  transition: background 0.2s;
                }
                
                .fc .fc-daygrid-day-number {
                  padding: 0.75rem;
                  font-weight: 600;
                  transition: all 0.2s;
                }
                
                .fc .fc-daygrid-day:hover {
                  background: rgb(16 185 129 / 0.05);
                }
                
                .fc .fc-daygrid-day:hover .fc-daygrid-day-number {
                  font-weight: 700;
                  transform: scale(1.1);
                }
                
                .fc .fc-daygrid-day.fc-day-today {
                  background: var(--fc-today-bg-color) !important;
                }
                
                .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
                  color: #10b981;
                  font-weight: 800;
                  font-size: 1.1em;
                }
                
                .fc-event {
                  border-radius: 0.5rem;
                  padding: 0.375rem 0.625rem;
                  font-size: 0.875rem;
                  font-weight: 600;
                  border: none;
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
                  color: #000 !important;
                  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                  cursor: pointer;
                  transition: all 0.2s;
                }
                
                .fc-event:hover {
                  background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
                  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.2);
                  transform: translateY(-2px) scale(1.05);
                }
                
                .fc .fc-toolbar-title {
                  font-size: 1.75rem;
                  font-weight: 800;
                  background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
                }
                
                .fc .fc-col-header-cell-cushion {
                  padding: 1rem 0;
                }
                
                .dark .fc th,
                .dark .fc td,
                .dark .fc .fc-daygrid-day-number {
                  color: rgb(243 244 246);
                }
                
                .fc-direction-ltr .fc-toolbar > * > :not(:first-child) {
                  margin-left: 0.75rem;
                }
                
                .fc .fc-toolbar {
                  gap: 1.5rem;
                  margin-bottom: 2rem;
                }
                
                @media (max-width: 768px) {
                  .fc .fc-toolbar {
                    flex-direction: column;
                    align-items: stretch;
                  }
                  
                  .fc .fc-toolbar-chunk {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 0.75rem;
                  }
                  
                  .fc .fc-button {
                    padding: 0.5rem 1rem;
                    font-size: 0.875rem;
                  }
                }
              `}</style>
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