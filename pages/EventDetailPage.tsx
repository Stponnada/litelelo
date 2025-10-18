// src/pages/EventDetailPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { CampusEvent, EventRsvp } from '../types';
import Spinner from '../components/Spinner';
import { format, isSameDay } from 'date-fns';

const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<CampusEvent | null>(null);
  const [rsvps, setRsvps] = useState<EventRsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!eventId || !profile?.campus) return;
    setLoading(true);
    setError(null);
    try {
      const eventPromise = supabase.rpc('get_campus_events', { p_campus: profile.campus }).eq('id', eventId).single();
      const rsvpsPromise = supabase.from('event_rsvps').select('*, profiles(*)').eq('event_id', eventId);
      
      const [eventResult, rsvpsResult] = await Promise.all([eventPromise, rsvpsPromise]);

      if (eventResult.error || !eventResult.data) throw new Error('Event not found');
      setEvent(eventResult.data);
      
      if (rsvpsResult.error) throw rsvpsResult.error;
      setRsvps(rsvpsResult.data as any[]);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId, profile?.campus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRsvp = async (status: 'going' | 'interested') => {
    if (!user || !event) return;
    
    // Optimistic update
    const isCurrentlyRsvpd = event.user_rsvp_status === status;
    const newGoingCount = event.going_count + (status === 'going' && !isCurrentlyRsvpd ? 1 : (event.user_rsvp_status === 'going' ? -1 : 0));
    const newInterestedCount = event.interested_count + (status === 'interested' && !isCurrentlyRsvpd ? 1 : (event.user_rsvp_status === 'interested' ? -1 : 0));

    setEvent(prev => prev ? {
      ...prev,
      user_rsvp_status: isCurrentlyRsvpd ? null : status,
      going_count: newGoingCount,
      interested_count: newInterestedCount
    } : null);
    
    await supabase.rpc('toggle_rsvp', { p_event_id: event.id, p_rsvp_status: status });
    // Refetch to be safe
    fetchData();
  };
  
  if (loading) return <div className="text-center py-10"><Spinner /></div>;
  if (error || !event) return <div className="text-center py-10 text-red-400">{error || 'Event not found.'}</div>;
  
  const startDate = new Date(event.start_time);
  const endDate = event.end_time ? new Date(event.end_time) : null;
  let dateDisplay;
  let timeDisplay;

  if (endDate && !isSameDay(startDate, endDate)) {
      // Multi-day event
      dateDisplay = `${format(startDate, 'MMMM d')} - ${format(endDate, 'MMMM d, yyyy')}`;
      timeDisplay = `Starts at ${format(startDate, 'p')}`;
  } else if (endDate) {
      // Single-day with end time
      dateDisplay = format(startDate, 'EEEE, MMMM d, yyyy');
      timeDisplay = `${format(startDate, 'p')} - ${format(endDate, 'p')}`;
  } else {
      // Single day, no end time
      dateDisplay = format(startDate, 'EEEE, MMMM d, yyyy');
      timeDisplay = format(startDate, 'p');
  }

  const goingRsvps = rsvps.filter(r => r.rsvp_status === 'going');
  
  return (
    <div className="max-w-4xl mx-auto">
        <Link to="/campus/events" className="text-sm text-text-secondary-light dark:text-text-secondary hover:underline mb-4 inline-block">
            &larr; Back to all events
        </Link>
        <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-lg border border-tertiary-light dark:border-tertiary overflow-hidden">
            <div className="w-full h-56 bg-tertiary-light dark:bg-tertiary">
                {event.image_url && <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />}
            </div>
            <div className="p-6">
                <h1 className="text-4xl font-bold text-text-main-light dark:text-text-main">{event.name}</h1>
                <div className="flex items-center space-x-2 mt-4 text-text-secondary-light dark:text-text-secondary">
                    <img src={event.created_by.avatar_url || ''} alt={event.created_by.username} className="w-6 h-6 rounded-full" />
                    <span>Hosted by <Link to={`/profile/${event.created_by.username}`} className="font-semibold hover:underline">{event.created_by.full_name}</Link></span>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start gap-3"><svg className="w-5 h-5 text-brand-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><div><p className="font-semibold">Date</p><p>{dateDisplay}</p></div></div>
                    <div className="flex items-start gap-3"><svg className="w-5 h-5 text-brand-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><div><p className="font-semibold">Time</p><p>{timeDisplay}</p></div></div>
                    <div className="flex items-start gap-3"><svg className="w-5 h-5 text-brand-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg><div><p className="font-semibold">Location</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((event.location || '') + ', ' + event.campus)}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{event.location || 'Location not specified'}</a></div></div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                    <button onClick={() => handleRsvp('going')} className={`font-bold py-2 px-6 rounded-full flex items-center gap-2 transition-all ${event.user_rsvp_status === 'going' ? 'bg-brand-green text-black' : 'bg-tertiary-light dark:bg-tertiary hover:bg-gray-300 dark:hover:bg-gray-700'}`}>✓ Going <span className="text-xs bg-black/10 px-1.5 rounded-full">{event.going_count}</span></button>
                    <button onClick={() => handleRsvp('interested')} className={`font-bold py-2 px-6 rounded-full flex items-center gap-2 transition-all ${event.user_rsvp_status === 'interested' ? 'bg-yellow-400 text-black' : 'bg-tertiary-light dark:bg-tertiary hover:bg-gray-300 dark:hover:bg-gray-700'}`}>? Interested <span className="text-xs bg-black/10 px-1.5 rounded-full">{event.interested_count}</span></button>
                </div>
            </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 bg-secondary-light dark:bg-secondary p-6 rounded-xl border border-tertiary-light dark:border-tertiary">
                <h2 className="text-2xl font-bold mb-4">About this Event</h2>
                <p className="text-text-secondary-light dark:text-text-secondary whitespace-pre-wrap leading-relaxed">{event.description || 'No description provided.'}</p>
            </div>
            <div className="bg-secondary-light dark:bg-secondary p-6 rounded-xl border border-tertiary-light dark:border-tertiary">
                <h2 className="text-2xl font-bold mb-4">Attendees ({goingRsvps.length})</h2>
                <div className="flex flex-wrap gap-2">
                    {goingRsvps.map(rsvp => (
                        <Link to={`/profile/${rsvp.profiles.username}`} key={rsvp.user_id} title={rsvp.profiles.full_name || rsvp.profiles.username}>
                            <img src={rsvp.profiles.avatar_url || ''} alt={rsvp.profiles.username} className="w-12 h-12 rounded-full object-cover ring-2 ring-secondary-light dark:ring-secondary" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default EventDetailPage;