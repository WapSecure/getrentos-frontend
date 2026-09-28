/**
 * Calendar-night arithmetic for hosting, kept free of UI imports so it can be
 * tested on its own. Dates are local yyyy-MM-dd; noon avoids DST edges.
 */

/** yyyy-MM-dd for a local date. */
export const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Every night from start (inclusive) to end (inclusive), as yyyy-MM-dd. */
export function nightsBetween(start: string, end: string): string[] {
  const out: string[] = [];
  const d = new Date(`${start.slice(0, 10)}T12:00:00`);
  const last = new Date(`${end.slice(0, 10)}T12:00:00`);
  while (d <= last && out.length < 800) {
    out.push(isoDay(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export const shiftDay = (iso: string, by: number) => {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  d.setDate(d.getDate() + by);
  return isoDay(d);
};

/**
 * Bookings and blocks both end on the morning the home is free again (the
 * API's end date is exclusive), so the nights they take are start … end − 1.
 */
export const occupied = (start: string, endExclusive: string) =>
  nightsBetween(start, shiftDay(endExclusive, -1));
