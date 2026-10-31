/**
 * Slot maths for the amenity booking sheet. Estates run on Lagos time (UTC+1, no
 * daylight saving), so days and start hours are Lagos ones whatever zone the
 * phone is on.
 */

const LAGOS_OFFSET_MS = 60 * 60 * 1000;

export interface LagosDay {
  year: number;
  month: number; // 0-based
  day: number;
}

export interface BusyRange {
  startsAt: string;
  endsAt: string;
}

/** Today and the following days, as Lagos calendar days. */
export function lagosDays(count: number, now: Date = new Date()): LagosDay[] {
  const lagos = new Date(now.getTime() + LAGOS_OFFSET_MS);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(
      Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), lagos.getUTCDate() + i)
    );
    return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() };
  });
}

/** The instant a Lagos-time hour starts on a Lagos day. */
export function slotStart(day: LagosDay, hour: number): Date {
  return new Date(Date.UTC(day.year, day.month, day.day, hour) - LAGOS_OFFSET_MS);
}

/** Noon on that day, for labelling it without crossing into a neighbouring date. */
export function dayNoon(day: LagosDay): Date {
  return slotStart(day, 12);
}

/** True when [start, start + minutes) is in the future and clashes with no taken range. */
export function isSlotFree(
  start: Date,
  minutes: number,
  busy: BusyRange[],
  now: Date = new Date()
): boolean {
  if (start.getTime() < now.getTime()) return false;
  const end = start.getTime() + minutes * 60 * 1000;
  return !busy.some(
    (b) => new Date(b.startsAt).getTime() < end && new Date(b.endsAt).getTime() > start.getTime()
  );
}
