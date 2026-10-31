import { isSlotFree, lagosDays, slotStart } from '@/lib/amenitySlots';
import { formatDate, formatTime } from '@/lib/format';

describe('Lagos-time formatting', () => {
  it('shows times in Lagos time, not the device zone', () => {
    // 17:38 UTC is 6:38 PM in Lagos.
    expect(formatTime('2026-10-30T17:38:00Z')).toBe('6:38 PM');
  });

  it('dates an instant by its Lagos calendar day', () => {
    // 23:30 UTC on the 30th is already the 31st in Lagos.
    expect(formatDate('2026-10-30T23:30:00Z', 'short')).toBe('Oct 31, 2026');
  });
});

describe('amenity slots', () => {
  const now = new Date('2026-10-30T12:16:00Z'); // 1:16 PM in Lagos

  it('lists Lagos calendar days starting today', () => {
    const late = new Date('2026-10-30T23:30:00Z'); // 12:30 AM on the 31st in Lagos
    expect(lagosDays(2, late)).toEqual([
      { year: 2026, month: 9, day: 31 },
      { year: 2026, month: 10, day: 1 },
    ]);
  });

  it('starts a slot at the Lagos hour', () => {
    expect(slotStart({ year: 2026, month: 9, day: 31 }, 11).toISOString()).toBe(
      '2026-10-31T10:00:00.000Z'
    );
  });

  it('rejects hours already past today', () => {
    const [today] = lagosDays(1, now);
    expect(isSlotFree(slotStart(today, 8), 30, [], now)).toBe(false);
    expect(isSlotFree(slotStart(today, 14), 30, [], now)).toBe(true);
  });

  it('rejects slots that overlap a taken range', () => {
    const [, tomorrow] = lagosDays(2, now);
    const busy = [{ startsAt: '2026-10-31T10:00:00.000Z', endsAt: '2026-10-31T11:00:00.000Z' }];
    expect(isSlotFree(slotStart(tomorrow, 11), 30, busy, now)).toBe(false);
    // 10 AM for an hour ends exactly when the taken range starts.
    expect(isSlotFree(slotStart(tomorrow, 10), 60, busy, now)).toBe(true);
    expect(isSlotFree(slotStart(tomorrow, 10), 90, busy, now)).toBe(false);
    expect(isSlotFree(slotStart(tomorrow, 12), 60, busy, now)).toBe(true);
  });
});
