import { formatTrend, monthTrend } from '@sureground/shared';

const series = [
  { label: 'Aug', value: 0 },
  { label: 'Sep', value: 1_000_000 },
  { label: 'Oct', value: 1_200_000 },
  { label: 'Nov', value: 0 },
];

describe('monthTrend', () => {
  it('ignores the month we are still in, so a fresh month is not a collapse', () => {
    const t = monthTrend(series, new Date(2026, 10, 5));
    expect(t).toEqual({ change: 20, months: ['Sep', 'Oct'] });
  });

  it('counts the current month once it is complete', () => {
    const t = monthTrend(series, new Date(2026, 10, 30));
    expect(t).toEqual({ change: -100, months: ['Oct', 'Nov'] });
  });

  it('says nothing without two complete months, or when the base month is zero', () => {
    expect(monthTrend(series.slice(2), new Date(2026, 10, 5))).toBeNull();
    expect(monthTrend(series.slice(0, 2), new Date(2026, 10, 5))).toBeNull();
  });

  it('formats with a real minus sign', () => {
    expect(formatTrend(12.345)).toBe('+12.3%');
    expect(formatTrend(-4)).toBe('−4%');
    expect(formatTrend(-100)).toBe('−100%');
  });
});
