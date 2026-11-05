/**
 * Month-on-month change for a dashboard trend badge.
 *
 * The last point in a monthly series is usually the month we are in, and a
 * month that has only just started looks like a collapse next to a full one
 * (−100% on the 5th). So the badge compares the last two complete months and
 * says nothing until it has two of them, or when the earlier one is zero.
 */
export interface TrendPoint {
  /** Short month name as the API labels it, e.g. "Oct". */
  label: string;
  value: number;
}

export interface MonthTrend {
  /** Percentage change, e.g. 12.5 or -4. */
  change: number;
  /** The two months compared, oldest first, e.g. ["Sep", "Oct"]. */
  months: [string, string];
}

const monthShort = (d: Date) => d.toLocaleString('en-US', { month: 'short' });

const isLastDayOfMonth = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() === d.getDate();

export function monthTrend(points: TrendPoint[], now = new Date()): MonthTrend | null {
  const complete = [...points];
  const last = complete[complete.length - 1];
  if (last && last.label === monthShort(now) && !isLastDayOfMonth(now)) complete.pop();
  if (complete.length < 2) return null;
  const [prev, curr] = complete.slice(-2);
  if (prev.value <= 0) return null;
  return {
    change: ((curr.value - prev.value) / prev.value) * 100,
    months: [prev.label, curr.label],
  };
}

/** "+12.5%" / "−4.0%" for a trend badge. */
export const formatTrend = (change: number) => {
  const size = Math.abs(change);
  // One decimal keeps moves honest ("+12.3%"); a whole number reads better
  // without it ("−100%", not "−100.0%").
  const digits = Number.isInteger(size) ? 0 : 1;
  return `${change >= 0 ? '+' : '−'}${size.toFixed(digits)}%`;
};
