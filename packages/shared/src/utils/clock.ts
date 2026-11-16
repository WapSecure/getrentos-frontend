/**
 * Times read the same on web and mobile: 12-hour with upper-case AM/PM ("16 Nov, 3:10 PM"), as
 * date-fns `h:mm a` gives on mobile. Intl alone writes "pm" in en-NG and en-GB.
 */
export function formatClock(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = {},
  locale = 'en-NG'
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const resolved: Intl.DateTimeFormatOptions = { minute: '2-digit', ...options };
  delete resolved.hourCycle;
  resolved.hour = 'numeric';
  resolved.hour12 = true;
  return new Intl.DateTimeFormat(locale, resolved)
    .formatToParts(date)
    .map((part) => (part.type === 'dayPeriod' ? part.value.toUpperCase() : part.value))
    .join('')
    .replace(/[\u00a0\u202f]/g, ' ');
}
