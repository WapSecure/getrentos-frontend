// Business times are Lagos times (D2); an investor abroad also sees their own. Web and mobile.

const LAGOS = 'Africa/Lagos';

/** "America/New_York" → "New York": the place a zone is named after, for labels. */
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
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return { time: `${part('hour')}:${part('minute')}`, day: part('day'), weekday: part('weekday') };
};

/**
 * Lagos time next to the viewer's own, e.g. "10:00 Lagos · 09:00 London". The weekday is added to
 * both when they fall on different days. A viewer in Lagos, or with an unknown zone, sees Lagos only.
 */
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
