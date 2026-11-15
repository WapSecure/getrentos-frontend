import { relativeTime } from '@/lib/format';

describe('relativeTime', () => {
  const ago = (ms: number) => new Date(Date.now() - ms);
  const HOUR = 3_600_000;

  it('counts whole days that have passed, never rounding up', () => {
    expect(relativeTime(ago(2 * 24 * HOUR + 17 * HOUR))).toBe('2d ago');
  });

  it('counts whole hours', () => {
    expect(relativeTime(ago(90 * 60_000))).toBe('1h ago');
  });

  it('keeps minutes and just now', () => {
    expect(relativeTime(ago(5 * 60_000))).toBe('5m ago');
    expect(relativeTime(ago(10_000))).toBe('just now');
  });
});
