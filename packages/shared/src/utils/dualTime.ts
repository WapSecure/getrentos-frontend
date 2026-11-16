import { formatClock } from './clock';

// Business times are Lagos times; an investor abroad also sees their own.

const LAGOS = 'Africa/Lagos';

export const timeZoneCity = (timeZone: string): string =>
  (timeZone.split('/').pop() ?? timeZone).replace(/_/g, ' ');

export const isValidTimeZone = (timeZone: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone });
    return true;
  } catch {
    return false;
  }
};

const clockParts = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return {
    time: formatClock(date, { timeZone }, 'en-GB'),
    day: part('day'),
    weekday: part('weekday'),
  };
};

export const formatDualTime = (date: Date | string, viewerTimeZone?: string | null): string => {
  const value = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return '—';
  const lagos = clockParts(value, LAGOS);
  if (!viewerTimeZone || viewerTimeZone === LAGOS || !isValidTimeZone(viewerTimeZone)) {
    return `${lagos.time} Lagos`;
  }
  const viewer = clockParts(value, viewerTimeZone);
  const city = timeZoneCity(viewerTimeZone);
  if (viewer.day === lagos.day) return `${lagos.time} Lagos · ${viewer.time} ${city}`;
  return `${lagos.weekday} ${lagos.time} Lagos · ${viewer.weekday} ${viewer.time} ${city}`;
};
