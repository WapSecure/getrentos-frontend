import {
  canCounter,
  currentAmount,
  documentCategoryLabel,
  isLeadOpen,
  leadNextStep,
  localInstant,
  offerThread,
  sizeLabel,
  viewingBuckets,
  vsAsking,
  whatsappLink,
  type RealtorOffer,
  type RealtorViewing,
} from '@/lib/api/realtor';
import { withdrawBlocker } from '@/lib/withdrawal';

const offer = (over: Partial<RealtorOffer> = {}): RealtorOffer => ({
  id: 'o1',
  amount: 90_000_000,
  status: 'COUNTERED',
  createdAt: '2026-09-01T10:00:00.000Z',
  buyer: { id: 'buyer', legalName: 'Bola', email: 'b@x.com' },
  listing: {
    id: 'l1',
    listingTitle: 'Duplex',
    price: 100_000_000,
    property: { title: 'D', ownerId: 'own' },
  },
  counterOffers: [
    {
      id: 'c2',
      fromUserId: 'buyer',
      amount: 94_000_000,
      message: null,
      createdAt: '2026-09-03T10:00:00.000Z',
    },
    {
      id: 'c1',
      fromUserId: 'me',
      amount: 97_000_000,
      message: 'New roof',
      createdAt: '2026-09-02T10:00:00.000Z',
    },
  ],
  ...over,
});

describe('offer negotiation', () => {
  it('orders the thread by time and says who moved', () => {
    expect(offerThread(offer()).map((s) => [s.who, s.amount])).toEqual([
      ['buyer', 90_000_000],
      ['you', 97_000_000],
      ['buyer', 94_000_000],
    ]);
  });

  it('treats the latest move as the amount on the table', () => {
    expect(currentAmount(offer())).toBe(94_000_000);
    expect(currentAmount(offer({ counterOffers: [] }))).toBe(90_000_000);
  });

  it('describes an amount against the asking price', () => {
    expect(vsAsking(92_000_000, 100_000_000)).toBe('8% under asking');
    expect(vsAsking(105_000_000, 100_000_000)).toBe('5% over asking');
    expect(vsAsking(100_000_000, 100_000_000)).toBe('At asking');
    expect(vsAsking(1, undefined)).toBeNull();
  });

  it('only lets a live negotiation be countered', () => {
    expect(canCounter('SUBMITTED')).toBe(true);
    expect(canCounter('COUNTERED')).toBe(true);
    expect(canCounter('ACCEPTED')).toBe(false);
    expect(canCounter('REJECTED')).toBe(false);
  });
});

describe('lead pipeline', () => {
  it('offers one step forward until the lead is won or lost', () => {
    expect(leadNextStep('NEW')?.to).toBe('CONTACTED');
    expect(leadNextStep('CONTACTED')?.to).toBe('QUALIFIED');
    expect(leadNextStep('QUALIFIED')?.to).toBe('CLOSED');
    expect(leadNextStep('CLOSED')).toBeNull();
    expect(leadNextStep('LOST')).toBeNull();
    expect(isLeadOpen('QUALIFIED')).toBe(true);
    expect(isLeadOpen('LOST')).toBe(false);
  });
});

describe('viewing diary', () => {
  const v = (id: string, scheduledAt: string, status: RealtorViewing['status'] = 'CONFIRMED') =>
    ({
      id,
      scheduledAt,
      status,
      notes: null,
      lead: null,
      listing: { id: 'l', listingTitle: 'x', property: { title: 'x' } },
    }) as RealtorViewing;
  const now = new Date(2026, 9, 3, 12, 0);
  const at = (d: number, h: number) => new Date(2026, 9, d, h, 0).toISOString();

  it('splits viewings into today, coming up and earlier', () => {
    const b = viewingBuckets(
      [v('late', at(3, 17)), v('early', at(3, 9)), v('next', at(5, 10)), v('gone', at(1, 10))],
      now
    );
    // A viewing earlier today is still today's, in time order.
    expect(b.today.map((x) => x.id)).toEqual(['early', 'late']);
    expect(b.upcoming.map((x) => x.id)).toEqual(['next']);
    expect(b.past.map((x) => x.id)).toEqual(['gone']);
  });

  it('files done and cancelled viewings under earlier, even if dated ahead', () => {
    const b = viewingBuckets([v('c', at(6, 10), 'CANCELLED'), v('d', at(3, 15), 'COMPLETED')], now);
    expect(b.today).toEqual([]);
    expect(b.upcoming).toEqual([]);
    expect(b.past.map((x) => x.id)).toEqual(['c', 'd']);
  });

  it('turns a local date and time into an instant, rejecting half-filled input', () => {
    expect(localInstant('2026-10-05', '14:30')).toBe(new Date(2026, 9, 5, 14, 30).toISOString());
    expect(localInstant('', '14:30')).toBeNull();
    expect(localInstant('2026-10-05', '')).toBeNull();
  });
});

describe('contact and documents', () => {
  it('builds a WhatsApp link from Nigerian numbers as people type them', () => {
    expect(whatsappLink('0803 123 4567')).toBe('https://wa.me/2348031234567');
    expect(whatsappLink('+234 803 123 4567')).toBe('https://wa.me/2348031234567');
    expect(whatsappLink('12345')).toBeNull();
    expect(whatsappLink(null)).toBeNull();
  });

  it('labels document types and sizes', () => {
    expect(documentCategoryLabel('AGENCY_AGREEMENT')).toBe('Agency agreement');
    expect(documentCategoryLabel('mystery')).toBe('Other');
    expect(sizeLabel(900)).toBe('900 B');
    expect(sizeLabel(2048)).toBe('2 KB');
    expect(sizeLabel(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});

describe('withdrawal blockers', () => {
  const s = { accountSet: true, canWithdraw: true, tier: 3, withdrawTierRequired: 3 };
  it('says nothing when withdrawing is open', () => {
    expect(withdrawBlocker(s)).toBeNull();
  });
  it('asks for a payout account first', () => {
    expect(withdrawBlocker({ ...s, accountSet: false })).toMatch(/payout account/);
  });
  it('names the real blocker when the backend gives one, else the tier gap', () => {
    expect(
      withdrawBlocker({ ...s, canWithdraw: false, withdrawWithheldReason: 'OPEN_REVIEW_CASE' })
    ).toMatch(/trust review/);
    expect(withdrawBlocker({ ...s, canWithdraw: false, tier: 1 })).toMatch(/Tier 3; you’re on 1/);
  });
});
