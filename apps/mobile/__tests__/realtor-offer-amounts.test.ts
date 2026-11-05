import { buyerAmount, currentAmount, pendingCounter, type RealtorOffer } from '@/lib/api/realtor';

const offer = (status: RealtorOffer['status'], counters: [string, number][]): RealtorOffer => ({
  id: 'o1',
  amount: 19_500_000,
  status,
  createdAt: '2026-11-05T10:00:00Z',
  buyer: { id: 'buyer', legalName: 'QA Audit buyer', email: 'b@example.test' },
  listing: {
    id: 'l1',
    listingTitle: 'Sale E',
    price: 20_000_000,
    property: { title: 'Sale E', ownerId: 'owner' },
  },
  counterOffers: counters.map(([from, amount], i) => ({
    id: `c${i}`,
    fromUserId: from,
    amount,
    message: null,
    status: 'SUBMITTED',
    createdAt: `2026-11-05T1${i + 1}:00:00Z`,
  })) as RealtorOffer['counterOffers'],
});

describe('realtor offer amounts', () => {
  it('keeps the buyer’s figure apart from your pending counter', () => {
    const o = offer('COUNTERED', [['realtor', 19_800_000]]);
    expect(currentAmount(o)).toBe(19_800_000);
    expect(buyerAmount(o)).toBe(19_500_000);
    expect(pendingCounter(o)).toBe(19_800_000);
  });

  it('reads the buyer’s counter back as their figure, with nothing pending from you', () => {
    const o = offer('COUNTERED', [
      ['realtor', 19_800_000],
      ['buyer', 19_650_000],
    ]);
    expect(buyerAmount(o)).toBe(19_650_000);
    expect(pendingCounter(o)).toBeNull();
  });

  it('has no pending counter on a new offer', () => {
    expect(pendingCounter(offer('SUBMITTED', []))).toBeNull();
  });
});
