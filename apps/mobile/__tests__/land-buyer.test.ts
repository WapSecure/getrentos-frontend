import {
  buyerRefundPreview,
  countdownTo,
  filterPlots,
  planTermsLine,
  quotePlot,
  splitReservations,
  type EstatePlot,
  type Reservation,
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

describe('estates and reservations', () => {
  it('quotes a plot as the server prices it', () => {
    // 6 months, 30% deposit, 10% uplift on ₦4.1m with ₦900k fees.
    expect(
      quotePlot(4_100_000, 900_000, {
        durationMonths: 6,
        initialDepositBps: 3000,
        priceUpliftBps: 1000,
      })
    ).toEqual({
      plotPrice: 4_100_000,
      priceUplift: 410_000,
      fees: 900_000,
      totalPrice: 5_410_000,
      initialPayment: 1_353_000 + 900_000,
      monthlyInstallment: Math.floor((5_410_000 - 2_253_000) / 6),
      durationMonths: 6,
    });
    expect(
      quotePlot(4_100_000, 900_000, {
        durationMonths: 0,
        initialDepositBps: 10000,
        priceUpliftBps: 1000,
      })
    ).toMatchObject({
      priceUplift: 0,
      totalPrice: 5_000_000,
      initialPayment: 5_000_000,
      monthlyInstallment: 0,
    });
  });

  it('counts down as web does, urgent under an hour', () => {
    const now = Date.parse('2026-11-05T10:00:00Z');
    expect(countdownTo('2026-11-07T13:00:00Z', now)).toMatchObject({
      label: '2d 3h',
      urgent: false,
    });
    expect(countdownTo('2026-11-05T12:05:00Z', now).label).toBe('2h 05m');
    expect(countdownTo('2026-11-05T10:09:07Z', now)).toMatchObject({
      label: '9m 07s',
      urgent: true,
    });
    expect(countdownTo('2026-11-05T09:00:00Z', now)).toMatchObject({
      expired: true,
      label: 'Expired',
    });
  });

  it('filters plots by status, block and corner', () => {
    const plot = (
      id: string,
      status: EstatePlot['status'],
      block: string,
      isCorner = false
    ): EstatePlot => ({
      id,
      plotNumber: id,
      block,
      areaSqm: 450,
      isCorner,
      tags: [],
      price: 1,
      status,
    });
    const plots = [
      plot('1', 'AVAILABLE', 'A', true),
      plot('2', 'RESERVED', 'A'),
      plot('3', 'SOLD', 'B'),
      plot('4', 'ALLOCATED', 'B'),
    ];
    expect(filterPlots(plots, { status: 'available' }).map((p) => p.id)).toEqual(['1']);
    expect(filterPlots(plots, { status: 'sold' }).map((p) => p.id)).toEqual(['3', '4']);
    expect(
      filterPlots(plots, { status: 'all', block: 'A', cornerOnly: true }).map((p) => p.id)
    ).toEqual(['1']);
  });

  it('describes a plan’s terms', () => {
    expect(planTermsLine({ durationMonths: 0, initialDepositBps: 10000, priceUpliftBps: 0 })).toBe(
      'Pay in full to start. No price uplift.'
    );
    expect(planTermsLine({ durationMonths: 6, initialDepositBps: 3000, priceUpliftBps: 500 })).toBe(
      '30% deposit, then 6 monthly installments. 5% added to the plot price.'
    );
  });

  it('puts live holds first, soonest first, and treats run-out active holds as past', () => {
    const now = Date.parse('2026-11-05T10:00:00Z');
    const r = (id: string, status: Reservation['status'], expiresAt: string): Reservation => ({
      id,
      plotId: id,
      layoutId: 'l',
      layoutName: 'L',
      plotNumber: id,
      price: 1,
      status,
      expiresAt,
      createdAt: '',
    });
    const { live, past } = splitReservations(
      [
        r('a', 'ACTIVE', '2026-11-06T10:00:00Z'),
        r('b', 'ACTIVE', '2026-11-05T12:00:00Z'),
        r('c', 'ACTIVE', '2026-11-05T09:00:00Z'),
        r('d', 'CONVERTED', '2026-11-01T00:00:00Z'),
      ],
      now
    );
    expect(live.map((x) => x.id)).toEqual(['b', 'a']);
    expect(past.map((x) => x.id)).toEqual(['c', 'd']);
  });
});
