// src/utils/timeUtils.ts

import { 
    format, 
    differenceInSeconds, 
    differenceInMinutes, 
    differenceInHours, 
    differenceInDays, 
    differenceInMonths,
    isToday,
    isTomorrow, 
    isPast, 
    formatRelative  
} from 'date-fns';

/**
 * Formats a timestamp into a short, abbreviated relative time string.
 * Examples: "5s", "10m", "3h", "2d", "4mo"
 * Falls back to "MMM d" for anything over a year.
 */

export const formatDeadline = (deadline: string | null): string | null => {
  if (!deadline) return null;
  
  const deadlineDate = new Date(deadline);
  const now = new Date();

  if (isPast(deadlineDate)) {
    return `Was due ${formatRelative(deadlineDate, now)}`;
  }

  const hoursDiff = differenceInHours(deadlineDate, now);

  if (isToday(deadlineDate)) {
    if (hoursDiff < 1) {
      const minutesDiff = differenceInMinutes(deadlineDate, now);
      return `Due in ${minutesDiff} min`;
    }
    return `Due today at ${format(deadlineDate, 'p')}`;
  }

  if (isTomorrow(deadlineDate)) {
    return `Due tomorrow at ${format(deadlineDate, 'p')}`;
  }

  return `Due by ${format(deadlineDate, 'MMM d, p')}`;
};


export const formatTimestamp = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);

  const seconds = differenceInSeconds(now, date);
  if (seconds < 60) return `${seconds}s`;

  const minutes = differenceInMinutes(now, date);
  if (minutes < 60) return `${minutes}m`;

  const hours = differenceInHours(now, date);
  if (hours < 24) return `${hours}h`;

  const days = differenceInDays(now, date);
  if (days < 30) return `${days}d`;
  
  const months = differenceInMonths(now, date);
  if (months < 12) return `${months}mo`;

  return format(date, 'MMM d, yyyy');
};

/**
 * Formats a timestamp into an exact, detailed string.
 * Example: "3:45 PM · Sep 30, 2025"
 */
export const formatExactTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return format(date, "h:mm a · MMM d, yyyy");
};

export const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return format(date, 'p'); // 'p' is short for time, like h:mm a
};