// Compares the last two complete months: the current month has only just started and would read
// as a collapse (−100% on the 5th).
export interface TrendPoint {
  label: string;
  value: number;
}

export interface MonthTrend {
  // Percentage, e.g. 12.5 or -4.
  change: number;
  // Oldest first.
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

export const formatTrend = (change: number) => {
  const size = Math.abs(change);
  const digits = Number.isInteger(size) ? 0 : 1;
  return `${change >= 0 ? '+' : '−'}${size.toFixed(digits)}%`;
};
