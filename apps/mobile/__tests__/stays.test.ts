import type { ShortletBooking, ShortletListing } from '@/lib/api/shortlets';
import {
  discountPhrases,
  guestTotal,
  internetSummary,
  isDettySeason,
  peakWeek,
  powerSummary,
  promiseState,
  quoteLines,
  ruleAnswer,
  stayHeadline,
  stayRefund,
  stayTab,
} from '@/lib/stays';
import { telUrl, whatsappUrl } from '@/lib/support';

const booking = (over: Partial<ShortletBooking> = {}): ShortletBooking => ({
  id: 'b1',
  listingId: 'l1',
  propertyId: 'p1',
  propertyTitle: 'Ikoyi flat',
  city: 'Lagos',
  checkIn: '2026-12-20',
  checkOut: '2026-12-27',
  guestCount: 2,
  nights: 7,
  subtotal: 630_000,
  total: 650_000,
  taxAmount: 52_000,
  status: 'CONFIRMED',
  paymentStatus: 'PAID',
  paymentRequired: false,
  cancellationPolicy: 'MODERATE',
  depositStatus: 'HELD',
  createdAt: '2026-10-01T10:00:00Z',
  ...over,
});

describe('the price a guest reads', () => {
  it('lists nights, the one discount, cleaning and tax: matching the API total', () => {
    const q = {
      listingId: 'l1',
      available: true,
      estimatedNights: 7,
      estimatedBaseSubtotal: 700_000,
      estimatedSubtotal: 630_000,
      estimatedCleaningFee: 20_000,
      discountType: 'WEEKLY' as const,
      discountPct: 10,
      discountAmount: 70_000,
      estimatedTax: 52_000,
      taxName: 'VAT',
      taxPct: 8,
      estimatedTotal: 702_000,
    };
    const lines = quoteLines(q);
    expect(lines.map((l) => l.label)).toEqual([
      '₦100,000 × 7 nights',
      'Weekly discount (10%)',
      'Cleaning fee',
      'VAT (8%)',
    ]);
    const sum = lines.reduce((t, l) => t + (l.credit ? -l.amount : l.amount), 0);
    expect(sum).toBe(q.estimatedTotal);
  });

  it('does not pretend nights are uniform when peak-season rates apply', () => {
    const [nights] = quoteLines({
      listingId: 'l1',
      available: true,
      estimatedNights: 5,
      estimatedBaseSubtotal: 650_000,
      seasonalNights: 3,
    });
    expect(nights.label).toBe('5 nights');
    expect(nights.note).toBe('3 nights at peak-season rates');
  });

  it('charges tax on top of a booking total', () => {
    expect(guestTotal(booking())).toBe(702_000);
    expect(guestTotal(booking({ taxAmount: undefined }))).toBe(650_000);
  });

  it('names a listing’s discounts plainly', () => {
    expect(
      discountPhrases({
        weeklyDiscountPct: 10,
        monthlyDiscountPct: 25,
        lastMinuteDiscountPct: 15,
        lastMinuteDays: 3,
      } as ShortletListing)
    ).toEqual(['10% off 7+ nights', '25% off 28+ nights', '15% off within 3 days of arrival']);
  });
});

describe('my stays', () => {
  const today = '2026-12-24';

  it('files stays under upcoming, past and cancelled', () => {
    expect(stayTab(booking(), today)).toBe('upcoming');
    expect(stayTab(booking({ checkOut: '2026-12-21' }), today)).toBe('past');
    expect(stayTab(booking({ status: 'COMPLETED' }), today)).toBe('past');
    expect(stayTab(booking({ status: 'DECLINED' }), today)).toBe('cancelled');
    expect(stayTab(booking({ status: 'CANCELLED' }), today)).toBe('cancelled');
  });

  it('asks for payment on a confirmed, unpaid stay', () => {
    const h = stayHeadline(
      booking({ paymentStatus: 'UNPAID', paymentRequired: true }),
      '2026-12-01'
    );
    expect(h.action).toBe('pay');
    expect(h.pill).toBe('Awaiting payment');
  });

  it('counts down to check-in on a paid stay', () => {
    expect(stayHeadline(booking(), '2026-12-15').title).toBe("You're all set: 5 days to go");
    expect(stayHeadline(booking(), '2026-12-19').title).toBe(
      "You're all set: check-in is tomorrow"
    );
  });

  it('tells the guest the host cancelled, and that everything comes back', () => {
    const h = stayHeadline(booking({ status: 'CANCELLED', cancelledBy: 'HOST' }), today);
    expect(h.title).toBe('The host cancelled this stay');
    expect(h.detail).toMatch(/everything back/);
    expect(h.action).toBe('rebook');
  });

  it('puts the Guest Promise first while its window is open', () => {
    const b = booking({
      guestPromise: {
        canReport: true,
        opensAt: '2026-12-20T13:00:00Z',
        closesAt: '2026-12-21T13:00:00Z',
      },
    });
    expect(stayHeadline(b, '2026-12-20', new Date('2026-12-20T15:00:00Z')).action).toBe('report');
  });
});

describe('after a report', () => {
  it('leads with the report rather than the countdown', () => {
    const b = booking({
      guestPromise: {
        canReport: false,
        opensAt: '2026-12-20T13:00:00Z',
        closesAt: '2026-12-21T13:00:00Z',
        reportId: 'd1',
        reportStatus: 'OPEN',
      },
    });
    expect(stayHeadline(b, '2026-12-20').pill).toBe('Reported');
  });
});

describe('the Guest Promise', () => {
  const window = { opensAt: '2026-12-20T13:00:00Z', closesAt: '2026-12-21T13:00:00Z' };

  it('is upcoming before check-in and closed after the 24 hours', () => {
    const b = booking({ guestPromise: { canReport: false, ...window } });
    expect(promiseState(b, new Date('2026-12-19T09:00:00Z')).kind).toBe('upcoming');
    expect(promiseState(b, new Date('2026-12-22T09:00:00Z')).kind).toBe('closed');
  });

  it('reports what happened to a report', () => {
    expect(
      promiseState(
        booking({
          guestPromise: { canReport: false, ...window, reportId: 'd1', reportStatus: 'OPEN' },
        })
      ).kind
    ).toBe('reported');
    expect(
      promiseState(
        booking({
          guestPromise: {
            canReport: false,
            ...window,
            reportId: 'd1',
            outcome: 'FULL_REFUND',
            refundAmount: 1,
          },
        })
      )
    ).toEqual({ kind: 'decided', outcome: 'FULL_REFUND', refundAmount: 1 });
  });

  it('is absent on stays it does not cover', () => {
    expect(promiseState(booking()).kind).toBe('none');
    const later = { canReport: false, ...window };
    expect(promiseState(booking({ status: 'CANCELLED', guestPromise: later })).kind).toBe('none');
    expect(
      promiseState(booking({ status: 'REQUESTED', paymentStatus: 'UNPAID', guestPromise: later }))
        .kind
    ).toBe('none');
    expect(promiseState(booking({ status: 'COMPLETED', guestPromise: later })).kind).toBe('none');
  });

  it('counts a host cancellation as everything back', () => {
    expect(
      stayRefund(
        booking({
          status: 'CANCELLED',
          cancelledBy: 'HOST',
          paymentStatus: 'REFUNDED',
          refundAmount: 650_000,
        })
      )
    ).toBe(702_000);
    expect(
      stayRefund(booking({ status: 'CANCELLED', cancelledBy: 'GUEST', refundAmount: 325_000 }))
    ).toBe(325_000);
  });
});

describe('essentials', () => {
  it('says what the host says, and nothing when they have not', () => {
    const l = {
      powerSources: ['GRID', 'GENERATOR'],
      powerHoursPerDay: 24,
      internetType: 'FIBRE',
      internetSpeedMbps: 50,
    } as ShortletListing;
    expect(powerSummary(l)).toBe('24 hours a day · Grid, Generator');
    expect(internetSummary(l)).toBe('Fibre · about 50 Mbps');
    expect(powerSummary({} as ShortletListing)).toBeNull();
    expect(internetSummary({ internetType: 'NONE' } as ShortletListing)).toBe('No internet');
    expect(ruleAnswer(undefined)).toBe('unknown');
    expect(ruleAnswer(false)).toBe('no');
  });
});

describe('detty december', () => {
  it('opens on the first peak week, and is sold from September to 3 January', () => {
    expect(peakWeek(new Date(2026, 9, 1))).toEqual({
      checkIn: '2026-12-20',
      checkOut: '2026-12-27',
    });
    expect(peakWeek(new Date(2027, 0, 2))).toEqual({
      checkIn: '2026-12-20',
      checkOut: '2026-12-27',
    });
    expect(isDettySeason(new Date(2026, 8, 1))).toBe(true);
    expect(isDettySeason(new Date(2027, 0, 3))).toBe(true);
    expect(isDettySeason(new Date(2027, 0, 4))).toBe(false);
    expect(isDettySeason(new Date(2026, 5, 1))).toBe(false);
  });
});

describe('support links', () => {
  it('builds call and WhatsApp links from configured numbers', () => {
    expect(telUrl('+234 800 000 0000')).toBe('tel:+2348000000000');
    expect(whatsappUrl('+234 800-000-0000', 'Hi there')).toBe(
      'https://wa.me/2348000000000?text=Hi%20there'
    );
  });
});
