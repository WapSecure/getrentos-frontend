import {
  applyBps,
  confirmedProgress,
  deliverability,
  formatBps,
  plotName,
  refundPreview,
  type Milestone,
} from '@/lib/api/landSales';

const step = (over: Partial<Milestone> = {}): Milestone => ({
  key: 'CONTRACT_OF_SALE',
  label: 'Contract of sale',
  sequence: 1,
  required: true,
  status: 'PENDING',
  releaseBps: 2000,
  ...over,
});

describe('deliverability', () => {
  it('waits for the deposit, and stops once the purchase has ended', () => {
    expect(deliverability('PENDING_DEPOSIT', step())).toEqual({
      allowed: false,
      reason: 'Conveyance starts once the deposit is paid.',
    });
    expect(deliverability('REVOKED', step()).reason).toMatch(/ended/);
  });

  it('holds allocation, deed and survey until the plot is paid in full', () => {
    const deed = step({ key: 'DEED_OF_ASSIGNMENT' });
    expect(deliverability('ACTIVE', deed)).toEqual({
      allowed: false,
      reason: 'Follows full payment of the plot.',
    });
    expect(deliverability('PAID_IN_FULL', deed).allowed).toBe(true);
    expect(deliverability('ACTIVE', step()).allowed).toBe(true);
  });

  it('offers delivery again on a disputed step, never on a delivered one', () => {
    expect(deliverability('ACTIVE', step({ status: 'DISPUTED' })).allowed).toBe(true);
    expect(deliverability('ACTIVE', step({ status: 'DELIVERED' })).allowed).toBe(false);
  });
});

describe('money', () => {
  it('formats basis points', () => {
    expect(formatBps(3000)).toBe('30%');
    expect(formatBps(250)).toBe('2.5%');
  });

  it('rounds a share half up', () => {
    expect(applyBps(1_000_005, 1000)).toBe(100_001);
    expect(applyBps(15, 5000)).toBe(8);
  });

  it('refunds what was paid towards the price, less the charge, keeping late fees', () => {
    expect(
      refundPreview(
        1_020_000,
        [
          { status: 'PAID', lateFee: 20_000 },
          { status: 'PENDING', lateFee: 5_000 },
        ],
        1000
      )
    ).toEqual({ lateFeesPaid: 20_000, principalPaid: 1_000_000, charge: 100_000, refund: 900_000 });
  });
});

describe('conveyance progress', () => {
  it('counts confirmed required steps and what waits on the seller', () => {
    expect(
      confirmedProgress([
        step({ status: 'CONFIRMED' }),
        step({ key: 'B', status: 'WAIVED' }),
        step({ key: 'C', status: 'DISPUTED' }),
        step({ key: 'D', status: 'PENDING', required: false }),
      ])
    ).toEqual({ done: 2, required: 3, forYou: 2 });
  });

  it('names a plot with its block when there is one', () => {
    expect(plotName({ block: 'A', plotNumber: '12' })).toBe('Block A, Plot 12');
    expect(plotName({ block: null, plotNumber: '12' })).toBe('Plot 12');
  });
});
