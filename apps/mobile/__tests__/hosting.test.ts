import {
  BOOKING_VIEW_QUERY,
  daysUntil,
  dettyDecember,
  feeNote,
  relativeDay,
  rulesSummary,
  stayRange,
  type HostListing,
} from '@/lib/api/hostShortlets';
import { nightsBetween, occupied, shiftDay } from '@/lib/hostDates';

describe('calendar nights', () => {
  it('a stay or block takes every night up to, not including, its end date', () => {
    // Check in Fri 20th, out Mon 23rd: three nights, the 23rd is free again.
    expect(occupied('2026-12-20', '2026-12-23')).toEqual([
      '2026-12-20',
      '2026-12-21',
      '2026-12-22',
    ]);
  });

  it('blocking the nights a host picked sends the next morning as the end', () => {
    const picked = nightsBetween('2026-12-30', '2027-01-01');
    expect(picked).toEqual(['2026-12-30', '2026-12-31', '2027-01-01']);
    expect(occupied('2026-12-30', shiftDay('2027-01-01', 1))).toEqual(picked);
  });
});

describe('dates for hosts', () => {
  const now = new Date(2026, 8, 28, 9, 0); // 28 Sep 2026, morning

  it('counts days by calendar date, not hours', () => {
    expect(daysUntil('2026-09-28', now)).toBe(0);
    expect(daysUntil('2026-09-29T23:00:00.000Z', now)).toBe(1);
    expect(daysUntil('2026-09-25', now)).toBe(-3);
  });

  it('speaks relative days', () => {
    expect(relativeDay('2026-09-28', now)).toBe('Today');
    expect(relativeDay('2026-09-29', now)).toBe('Tomorrow');
    expect(relativeDay('2026-10-03', now)).toBe('In 5 days');
    expect(relativeDay('2026-09-25', now)).toBe('3 days ago');
  });

  it('shows a stay as a short range', () => {
    expect(stayRange('2026-12-20', '2027-01-03')).toMatch(/20 Dec.*3 Jan/);
  });

  it('Detty December is this season, even on New Year’s Day', () => {
    expect(dettyDecember(now)).toEqual({ startDate: '2026-12-20', endDate: '2027-01-03' });
    expect(dettyDecember(new Date(2027, 0, 2))).toEqual({
      startDate: '2026-12-20',
      endDate: '2027-01-03',
    });
    expect(dettyDecember(new Date(2027, 0, 10))).toEqual({
      startDate: '2027-12-20',
      endDate: '2028-01-03',
    });
  });
});

describe('booking views', () => {
  it('filter on the server so each tab pages correctly', () => {
    expect(BOOKING_VIEW_QUERY.requests).toBe('status=REQUESTED');
    expect(BOOKING_VIEW_QUERY.upcoming).toBe('status=CONFIRMED&when=upcoming');
    expect(BOOKING_VIEW_QUERY.past).toContain('when=past');
  });
});

describe('pricing rules summary', () => {
  const base = {
    seasons: [],
    weeklyDiscountPct: 0,
    monthlyDiscountPct: 0,
    lastMinuteDiscountPct: 0,
    advanceNoticeDays: 0,
    prepDays: 0,
  } as unknown as HostListing;

  it('is empty when nothing is set', () => {
    expect(rulesSummary(base)).toBeNull();
  });

  it('names what is in force', () => {
    expect(
      rulesSummary({
        ...base,
        seasons: [{ id: 's', name: 'Detty December', startDate: '', endDate: '' }],
        weeklyDiscountPct: 10,
        prepDays: 1,
      })
    ).toBe('Detty December · 10% weekly · 1d prep');
  });
});

describe('host fee note', () => {
  it('names the last Lagos day of a launch rate, then the standard rate', () => {
    // Ends at midnight Lagos on 1 Feb 2027 = 23:00 UTC on 31 Jan.
    const note = feeNote({
      commissionPct: 3,
      standardCommissionPct: 8,
      introEndsAt: '2027-01-31T23:00:00.000Z',
    });
    expect(note).toContain('GetRentos fee: 3% of each stay');
    expect(note).toContain('bookings made by 31 Jan 2027, then 8%');
    expect(note).toContain('Guests don’t pay it');
  });

  it('says nothing about a launch rate when none runs', () => {
    const note = feeNote({ commissionPct: 8, standardCommissionPct: 8 });
    expect(note).toMatch(/^GetRentos fee: 8% of each stay, taken from your payout\. Guests/);
  });

  it('says so when there is no fee', () => {
    expect(feeNote({ commissionPct: 0, standardCommissionPct: 0 })).toMatch(
      /^GetRentos takes no fee/
    );
  });
});
