// Estates run on Lagos time (UTC+1, no daylight saving): days and hours are Lagos ones whatever the phone's zone.

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

export function lagosDays(count: number, now: Date = new Date()): LagosDay[] {
  const lagos = new Date(now.getTime() + LAGOS_OFFSET_MS);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(
      Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), lagos.getUTCDate() + i)
    );
    return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() };
  });
}

export function slotStart(day: LagosDay, hour: number): Date {
  return new Date(Date.UTC(day.year, day.month, day.day, hour) - LAGOS_OFFSET_MS);
}

// Noon, so labelling the day never crosses into a neighbouring date.
export function dayNoon(day: LagosDay): Date {
  return slotStart(day, 12);
}

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
