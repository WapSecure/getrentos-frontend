import { COLLECTION_TONE, formatDay } from '@/lib/serviceCharge';
import { dayToInstant, lagosToday } from '@/lib/api/homeUtilities';
import { bandCheck, maskMeterNumber, tokenLast4, utilityKindForCategory } from '@sureground/shared';

describe('power and water capture', () => {
  it('reads today in Lagos, an hour ahead of UTC', () => {
    expect(lagosToday(new Date('2026-11-13T23:30:00Z'))).toBe('2026-11-14');
    expect(lagosToday(new Date('2026-11-13T10:00:00Z'))).toBe('2026-11-13');
  });

  it('never sends a future time for today, and midday Lagos for an earlier day', () => {
    const now = new Date('2026-11-13T10:00:00Z');
    expect(dayToInstant('2026-11-13', now)).toBe(now.toISOString());
    expect(dayToInstant('2026-11-10', now)).toBe('2026-11-10T11:00:00.000Z');
  });

  it('keeps only the last 4 digits of a token and masks meters', () => {
    expect(tokenLast4('1234 5678 9012 3456 4821')).toBe('4821');
    expect(maskMeterNumber('4821')).toBe('Meter ending 4821');
  });

  it('says no supply was logged rather than reporting zero hours', () => {
    expect(bandCheck(null, 'A').message).toBe('No supply logged yet');
  });

  it('tags a generator picked from the common kinds', () => {
    expect(utilityKindForCategory('Generator')).toBe('GENERATOR');
  });
});

describe('service charge display', () => {
  it('shows a day as written, whatever the time zone', () => {
    expect(formatDay('2027-01-01')).toBe('1 Jan 2027');
  });
  it('marks the vacant share as the owner’s, not an unpaid debt', () => {
    expect(COLLECTION_TONE.NOT_BILLED).toBe('info');
    expect(COLLECTION_TONE.UNPAID).toBe('neutral');
  });
});
