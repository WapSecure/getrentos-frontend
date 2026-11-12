import {
  claimBlocker,
  claimTotal,
  leaseHasEnded,
  moveOutInstant,
  settlementText,
  type ClaimDraftItem,
  type DepositEndView,
} from '@/lib/api/depositEnd';

const naira = (n: number) => `N${n}`;
const file = { uri: 'file:///a.jpg', name: 'a.jpg', mimeType: 'image/jpeg' };
const item = (over: Partial<ClaimDraftItem> = {}): ClaimDraftItem => ({
  key: 'k',
  reason: 'Broken kitchen door hinge',
  amount: '20000',
  files: [file],
  ...over,
});

const view = (over: Partial<DepositEndView> = {}): DepositEndView => ({
  holdId: 'h1',
  leaseId: 'l1',
  propertyTitle: 'Flat',
  unitName: 'A',
  tenantName: 'Ada',
  amount: 100000,
  heldBySureground: true,
  funded: 100000,
  endStage: 'SETTLED',
  moveOutAt: null,
  claimBy: null,
  claim: null,
  settlement: {
    landlordAmount: 20000,
    refundAmount: 80000,
    refundStatus: 'REFUNDED',
    settledHow: 'TENANT_ACCEPTED',
    settledAt: '2026-11-01T00:00:00Z',
  },
  ...over,
});

describe('claimBlocker', () => {
  it('needs an amount, a reason of 10 characters and evidence on every deduction', () => {
    expect(claimBlocker([item()], 100000)).toBeNull();
    expect(claimBlocker([], 100000)).toMatch(/at least one/);
    expect(claimBlocker([item({ amount: '' })], 100000)).toMatch(/amount/);
    expect(claimBlocker([item({ reason: 'door' })], 100000)).toMatch(/10 characters/);
    expect(claimBlocker([item(), item({ files: [] })], 100000)).toMatch(/deduction 2/);
  });

  it('refuses a claim above what Sureground holds', () => {
    expect(claimTotal([item(), item({ amount: '90000' })])).toBe(110000);
    expect(claimBlocker([item(), item({ amount: '90000' })], 100000)).toMatch(/held by Sureground/);
  });
});

describe('settlementText', () => {
  it('reads from each side', () => {
    expect(settlementText(view(), 'landlord', naira)).toBe(
      'The tenant accepted the claim. N20000 added to your balance, N80000 refunded to the tenant (refund sent).'
    );
    expect(settlementText(view(), 'tenant', naira)).toBe(
      'The tenant accepted the claim. N80000 refunded to you (refund sent), N20000 to your landlord.'
    );
    expect(settlementText(view({ settlement: null }), 'tenant', naira)).toBeNull();
  });
});

describe('leaseHasEnded', () => {
  const now = Date.parse('2026-11-11T00:00:00Z');
  it('is true for an expired lease or a past end date', () => {
    expect(leaseHasEnded('EXPIRED', undefined, now)).toBe(true);
    expect(leaseHasEnded('ACTIVE', '2026-11-01T00:00:00Z', now)).toBe(true);
    expect(leaseHasEnded('ACTIVE', '2026-12-01T00:00:00Z', now)).toBe(false);
    expect(leaseHasEnded('ACTIVE', null, now)).toBe(false);
  });
});

it('sends the move-out day as midday in Lagos', () => {
  expect(moveOutInstant('2026-11-10')).toBe('2026-11-10T11:00:00.000Z');
});
