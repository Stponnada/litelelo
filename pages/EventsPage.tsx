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
    className={`p-2.5 rounded-lg transition-all duration-200 ${
      isActive 
        ? 'bg-brand-green text-black shadow-sm scale-105' 
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
    const popoverWidth = 288; // w-72
    const popoverHeight = 200; // approximate height
    const margin = 16; // viewport margin

    // Calculate center X position (relative to viewport)
    let popoverCenterX = rect.left + rect.width / 2;

    // Clamp X position to keep popover fully visible
    const minX = margin + popoverWidth / 2;
    const maxX = window.innerWidth - margin - popoverWidth / 2;
    popoverCenterX = Math.max(minX, Math.min(maxX, popoverCenterX));

    // Calculate Y position - try below first, then above if needed
    let popoverTop = rect.bottom + 8;
    
    // If popover would go off bottom of screen, position it above
    if (popoverTop + popoverHeight > window.innerHeight - margin) {
      popoverTop = rect.top - popoverHeight - 8;
    }

    // If still off screen (above), clamp to visible area
    popoverTop = Math.max(margin, Math.min(window.innerHeight - popoverHeight - margin, popoverTop));

    setPopover({
      event: clickInfo.event.extendedProps,
      x: popoverCenterX,
      y: popoverTop,
    });
  };

  // Close popover on escape key
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
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center backdrop-blur-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-full mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-400 font-semibold text-lg mb-1">Error loading events</p>
          <p className="text-red-300/70 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {isCreateModalOpen && (
        <CreateEventModal 
          onClose={() => setCreateModalOpen(false)} 
          onEventCreated={handleEventCreated} 
        />
      )}
      
      {/* Event Popover */}
      {popover && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setPopover(null)}
        >
          <div
            className="absolute bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5 w-72 border border-gray-200 dark:border-gray-700 animate-fadeIn"
            style={{
              top: `${popover.y}px`,
              left: `${popover.x}px`,
              transform: 'translateX(-50%)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4">
              <p className="font-bold text-text-main-light dark:text-text-main text-lg mb-3 line-clamp-2">
                {popover.event.name}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm text-text-secondary-light dark:text-text-secondary">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{format(new Date(popover.event.start_time), 'MMM d, yyyy')}</span>
                </div>
                
                <div className="flex items-start gap-2 text-sm text-text-secondary-light dark:text-text-secondary">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{format(new Date(popover.event.start_time), 'p')}</span>
                </div>
                
                <div className="flex items-start gap-2 text-sm text-text-secondary-light dark:text-text-secondary">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="line-clamp-1">{popover.event.location}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => {
                navigate(`/campus/events/${popover.event.id}`);
                setPopover(null);
              }}
              className="w-full text-center py-2.5 text-sm font-semibold bg-brand-green text-black rounded-lg hover:bg-brand-green-darker transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-10 pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-5xl font-bold text-text-main-light dark:text-text-main mb-2 tracking-tight">
              Campus Events
            </h1>
            <p className="text-lg text-text-secondary-light dark:text-text-secondary">
              Discover what's happening at {profile?.campus}
            </p>
          </div>
          
          <button 
            onClick={() => setCreateModalOpen(true)} 
            className="flex items-center gap-2 bg-brand-green text-black font-bold py-3 px-7 rounded-xl hover:bg-brand-green-darker transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Event
          </button>
        </div>
      </header>
      
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-secondary-light dark:bg-secondary p-3 rounded-xl border border-tertiary-light dark:border-tertiary shadow-sm">
        <div className="flex items-center gap-3 bg-tertiary-light/30 dark:bg-tertiary/30 p-1.5 rounded-lg">
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
          <div className="flex items-center gap-2 bg-tertiary-light/30 dark:bg-tertiary/30 p-1.5 rounded-lg">
            <button 
              onClick={() => setFilter('upcoming')} 
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                filter === 'upcoming' 
                  ? 'bg-brand-green text-black shadow-sm scale-105' 
                  : 'text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary hover:scale-105'
              }`}
            >
              Upcoming
            </button>
            <button 
              onClick={() => setFilter('past')} 
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                filter === 'past' 
                  ? 'bg-brand-green text-black shadow-sm scale-105' 
                  : 'text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary hover:scale-105'
              }`}
            >
              Past
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 px-6 bg-gradient-to-br from-secondary-light to-tertiary-light/30 dark:from-secondary dark:to-tertiary/30 rounded-2xl border-2 border-dashed border-tertiary-light dark:border-tertiary">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-green/10 rounded-full mb-6">
              <CalendarDaysIcon className="w-10 h-10 text-brand-green" />
            </div>
            <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main mb-2">
              No {filter} events
            </h3>
            <p className="text-text-secondary-light dark:text-text-secondary max-w-md mx-auto mb-6">
              It's quiet right now. Be the first to create an event and bring the community together!
            </p>
            <button 
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 bg-brand-green text-black font-semibold py-2.5 px-6 rounded-lg hover:bg-brand-green-darker transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Event
            </button>
          </div>
        )
      ) : (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <style>{`
            .fc {
              --fc-border-color: rgb(229 231 235 / 0.5);
              --fc-button-bg-color: #10b981;
              --fc-button-border-color: #10b981;
              --fc-button-hover-bg-color: #059669;
              --fc-button-hover-border-color: #059669;
              --fc-button-active-bg-color: #047857;
              --fc-button-active-border-color: #047857;
              --fc-today-bg-color: rgb(16 185 129 / 0.08);
            }
            
            .dark .fc {
              --fc-border-color: rgb(55 65 81 / 0.5);
              --fc-page-bg-color: transparent;
              --fc-neutral-bg-color: rgb(31 41 55 / 0.5);
            }
            
            .fc .fc-button {
              font-weight: 600;
              text-transform: capitalize;
              padding: 0.5rem 1rem;
              border-radius: 0.5rem;
              box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
              transition: all 0.2s;
            }
            
            .fc .fc-button:not(:disabled):hover {
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
              transform: translateY(-1px);
            }
            
            .fc .fc-button:not(:disabled):active {
              transform: translateY(0);
            }
            
            .fc .fc-button-primary:disabled {
              opacity: 0.5;
            }
            
            .fc-theme-standard th {
              border: none;
              padding: 1rem 0;
              font-weight: 600;
              font-size: 0.875rem;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            
            .fc-theme-standard td {
              border-color: var(--fc-border-color);
            }
            
            .fc .fc-daygrid-day-number {
              padding: 0.5rem;
              font-weight: 500;
              transition: all 0.2s;
            }
            
            .fc .fc-daygrid-day:hover .fc-daygrid-day-number {
              font-weight: 600;
            }
            
            .fc .fc-daygrid-day.fc-day-today {
              background: var(--fc-today-bg-color) !important;
            }
            
            .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
              color: #10b981;
              font-weight: 700;
            }
            
            .fc-event {
              border-radius: 0.375rem;
              padding: 0.25rem 0.5rem;
              font-size: 0.875rem;
              font-weight: 500;
              border: none;
              background: #10b981 !important;
              color: #000 !important;
              box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
              cursor: pointer;
              transition: all 0.2s;
            }
            
            .fc-event:hover {
              background: #059669 !important;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
              transform: translateY(-1px);
            }
            
            .fc .fc-toolbar-title {
              font-size: 1.5rem;
              font-weight: 700;
            }
            
            .fc .fc-col-header-cell-cushion {
              padding: 0.75rem 0;
            }
            
            .dark .fc .fc-toolbar-title,
            .dark .fc th,
            .dark .fc td,
            .dark .fc .fc-daygrid-day-number {
              color: rgb(243 244 246);
            }
            
            .fc-direction-ltr .fc-toolbar > * > :not(:first-child) {
              margin-left: 0.5rem;
            }
            
            .fc .fc-toolbar {
              gap: 1rem;
              margin-bottom: 1.5rem;
            }
            
            @media (max-width: 768px) {
              .fc .fc-toolbar {
                flex-direction: column;
                align-items: stretch;
              }
              
              .fc .fc-toolbar-chunk {
                display: flex;
                justify-content: center;
                margin-bottom: 0.5rem;
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
      )}
    </div>
  );
};

export default EventsPage;