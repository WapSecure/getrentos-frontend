import {
  buyerRefundPreview,
  cancelDescription,
  milestoneAction,
  plotLabel,
  refundSentence,
  summariseSchedule,
  type BuyerInstallment,
  type BuyerPurchaseDetail,
} from '@/lib/api/landBuyer';
import type { Milestone } from '@/lib/api/landSales';

const fmt = (n: number) => `N${n}`;
const inst = (over: Partial<BuyerInstallment>): BuyerInstallment => ({
  id: 'i',
  sequence: 0,
  label: 'Deposit',
  dueDate: '2026-11-01',
  amount: 1000,
  lateFee: 0,
  amountPaid: 0,
  outstanding: 1000,
  status: 'PENDING',
  ...over,
});
const step = (
  key: string,
  sequence: number,
  status: Milestone['status'],
  required = true
): Milestone => ({
  key,
  label: key,
  sequence,
  required,
  status,
  releaseBps: 1000,
});

describe('schedule', () => {
  it('summarises paid, overdue and what is left, counting waived as paid', () => {
    const s = summariseSchedule([
      inst({ id: 'a', sequence: 0, status: 'PAID', amountPaid: 1000, outstanding: 0 }),
      inst({ id: 'b', sequence: 1, status: 'OVERDUE', outstanding: 1100, lateFee: 100 }),
      inst({ id: 'c', sequence: 2, status: 'WAIVED', outstanding: 0 }),
      inst({ id: 'd', sequence: 3 }),
    ]);
    expect(s).toMatchObject({
      total: 4,
      paidCount: 2,
      overdueCount: 1,
      overdueAmount: 1100,
      lateFees: 100,
      remaining: 2100,
      nextInstallmentId: 'b',
      percentPaid: 50,
    });
  });
});

describe('cancelling', () => {
  const p = {
    amountPaid: 1_100_000,
    installments: [inst({ status: 'PAID', lateFee: 100_000 })],
    terms: {
      revocationChargeBps: 1000,
      gracePeriodDays: 7,
      lateFeeBps: 200,
      defaultAfterDays: 60,
      priceUpliftBps: 0,
    },
  } as unknown as BuyerPurchaseDetail;

  it('refunds what was paid toward the price, less the forfeiture, keeping late fees', () => {
    expect(buyerRefundPreview(p)).toMatchObject({
      lateFeesPaid: 100_000,
      principalPaid: 1_000_000,
      charge: 100_000,
      refund: 900_000,
    });
    expect(cancelDescription(p, fmt)).toMatch(
      /keeps 10% \(N100000\).*about N900000.*N100000 paid in late fees/
    );
  });

  it('returns everything when a condition failed, and says so when nothing was paid', () => {
    expect(cancelDescription({ ...p, canCancelInFull: true }, fmt)).toMatch(
      /everything you have paid \(N1100000\)/
    );
    expect(cancelDescription({ ...p, amountPaid: 0, installments: [] }, fmt)).toMatch(
      /Nothing has been paid/
    );
  });

  it('describes where a refund stands', () => {
    expect(refundSentence({ refundDue: 0 }, fmt)).toBe('No refund is due.');
    expect(refundSentence({ refundDue: 500, refundStatus: 'REFUNDED' }, fmt)).toMatch(
      /has been paid/
    );
    expect(
      refundSentence({ refundDue: 500, refundStatus: 'NEEDS_MANUAL', refundedAmount: 200 }, fmt)
    ).toMatch(/N200 of your N500.*remaining N300/);
    expect(refundSentence({ refundDue: 500, refundStatus: 'PENDING' }, fmt)).toMatch(/on its way/);
  });
});

describe('confirming steps', () => {
  const steps = [
    step('A', 1, 'CONFIRMED'),
    step('B', 2, 'PENDING', false),
    step('C', 3, 'DELIVERED'),
  ];

  it('blocks a step behind any earlier unconfirmed one on a developer purchase', () => {
    expect(milestoneAction(steps, steps[2])).toEqual({
      canConfirm: false,
      canDispute: true,
      blockedBy: ['B'],
    });
  });

  it('counts only earlier required steps on a resale', () => {
    expect(milestoneAction(steps, steps[2], { requiredOnly: true })).toEqual({
      canConfirm: true,
      canDispute: true,
      blockedBy: [],
    });
  });

  it('offers nothing on a step not delivered, or once the contract has ended', () => {
    expect(milestoneAction(steps, steps[1]).canDispute).toBe(false);
    expect(milestoneAction(steps, steps[2], { contractOpen: false }).canDispute).toBe(false);
  });

  it('labels plots', () => {
    expect(plotLabel({ plotNumber: '12', block: 'B' })).toBe('Block B, plot 12');
    expect(plotLabel({ plotNumber: '12' })).toBe('Plot 12');
  });
});
