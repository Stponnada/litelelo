// src/components/EventCard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { CampusEvent } from '../types';
import { format, isSameDay } from 'date-fns';

interface EventCardProps {
  event: CampusEvent;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const startDate = new Date(event.start_time);
  const endDate = event.end_time ? new Date(event.end_time) : null;

  const formattedDate = format(startDate, 'MMM d'); // For the big box
  let timeDetails;

  if (endDate && !isSameDay(startDate, endDate)) {
      timeDetails = `${format(startDate, 'MMM d, p')} - ${format(endDate, 'MMM d, p')}`;
  } else if (endDate) {
      timeDetails = `${format(startDate, 'p')} - ${format(endDate, 'p')}`;
  } else {
      timeDetails = format(startDate, 'p');
  }
  
  return (
    <Link 
      to={`/campus/events/${event.id}`}
      className="group flex flex-col md:flex-row items-center gap-4 bg-secondary-light dark:bg-secondary p-4 rounded-xl shadow-md hover:shadow-lg border border-tertiary-light dark:border-tertiary hover:border-brand-green/50 transition-all duration-300"
    >
      <div className="flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 text-center bg-tertiary-light dark:bg-tertiary rounded-lg group-hover:bg-brand-green/10 transition-colors">
        <span className="text-3xl font-bold text-brand-green">{formattedDate.split(' ')[1]}</span>
        <span className="text-sm font-semibold uppercase text-text-tertiary-light dark:text-text-tertiary">{formattedDate.split(' ')[0]}</span>
      </div>
      <div className="flex-1 min-w-0 text-center md:text-left">
        <h3 className="text-lg font-bold text-text-main-light dark:text-text-main group-hover:text-brand-green transition-colors truncate">
          {event.name}
        </h3>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary mt-1 line-clamp-2">
          {timeDetails} at {event.location || 'Location TBD'}
        </p>
        <div className="flex items-center justify-center md:justify-start gap-3 mt-2 text-xs text-text-tertiary-light dark:text-text-tertiary">
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            <span>{event.going_count} Going</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" /></svg>
            <span>{event.interested_count} Interested</span>
          </div>
        </div>
      </div>
      <div className="hidden md:block text-text-tertiary-light dark:text-text-tertiary group-hover:text-brand-green transition-colors">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </div>
    </Link>
  );
};

export default EventCard;