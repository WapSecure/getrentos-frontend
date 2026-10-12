/**
 * Pure rules of a developer plot sale as the buyer's screens need them. Each
 * one mirrors the backend (`domain/payment-schedule.ts`, `domain/purchase-rules.ts`
 * and the milestone services) so what the screen promises is what the API does;
 * the API stays the authority and its error message is always surfaced.
 */
import type {
  LandInstallment,
  LandMilestone,
  LandNextDue,
  LandPaymentPlan,
  LandPlotStatus,
  LandPurchaseDetail,
  LandPurchaseStatus,
} from '@/types/landBuyer';

const BPS = 10_000;

/** amount × bps / 10 000, rounded half up (whole naira). */
export const applyBps = (amount: number, bps: number): number =>
  Math.floor((amount * bps + BPS / 2) / BPS);

/** 250 → "2.5%", 1000 → "10%". */
export const bpsToPercent = (bps: number): string => {
  const pct = bps / 100;
  return `${Number.isInteger(pct) ? pct : pct.toFixed(2).replace(/0+$/, '')}%`;
};

export interface PlotQuote {
  plotPrice: number;
  priceUplift: number;
  fees: number;
  totalPrice: number;
  initialPayment: number;
  monthlyInstallment: number;
  durationMonths: number;
}

/**
 * What a plan costs on a given plot, exactly as the API prices a new purchase:
 * the uplift applies only to installment plans, the deposit is a share of the
 * contract price and every fee is due with it, and an outright plan is all due
 * at once. The monthly figure is the regular installment (any remainder lands
 * on the last one).
 */
export const quotePlot = (
  plotPrice: number,
  feesTotal: number,
  plan: Pick<LandPaymentPlan, 'durationMonths' | 'priceUpliftBps' | 'initialDepositBps'>
): PlotQuote => {
  const priceUplift = plan.durationMonths > 0 ? applyBps(plotPrice, plan.priceUpliftBps) : 0;
  const contractPrice = plotPrice + priceUplift;
  const totalPrice = contractPrice + feesTotal;
  const initialPayment =
    plan.durationMonths === 0
      ? totalPrice
      : applyBps(contractPrice, plan.initialDepositBps) + feesTotal;
  const balance = totalPrice - initialPayment;
  const monthlyInstallment =
    plan.durationMonths > 0 && balance > 0 ? Math.floor(balance / plan.durationMonths) : 0;
  return {
    plotPrice,
    priceUplift,
    fees: feesTotal,
    totalPrice,
    initialPayment,
    monthlyInstallment,
    durationMonths: plan.durationMonths,
  };
};

export interface Countdown {
  expired: boolean;
  /** Milliseconds left, never negative. */
  remainingMs: number;
  /** "2h 14m", "14m 05s", "Expired". */
  label: string;
  /** Under an hour left. */
  urgent: boolean;
}

/** Time left on a reservation hold. */
export const countdownTo = (expiresAt: string, now: number = Date.now()): Countdown => {
  const remainingMs = Math.max(0, new Date(expiresAt).getTime() - now);
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
    return { expired: true, remainingMs: 0, label: 'Expired', urgent: true };
  }
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const label =
    days > 0
      ? `${days}d ${hours}h`
      : hours > 0
        ? `${hours}h ${pad(minutes)}m`
        : `${minutes}m ${pad(seconds)}s`;
  return { expired: false, remainingMs, label, urgent: remainingMs < 3_600_000 };
};

export interface ScheduleSummary {
  total: number;
  paidCount: number;
  overdueCount: number;
  /** Owed on overdue installments, late fees included. */
  overdueAmount: number;
  /** Late fees charged across the schedule, paid or not. */
  lateFees: number;
  /** Still owed across the schedule, late fees included. */
  remaining: number;
  /** The installment the Pay button settles. */
  nextInstallmentId?: string;
  /** Paid share of the schedule's principal, 0-100. */
  percentPaid: number;
}

const isSettled = (i: LandInstallment) => i.status === 'PAID' || i.status === 'WAIVED';

/**
 * Totals for a payment schedule. The next one due is the API's `nextDue` when
 * given, else the earliest unsettled installment (which is what the API pays
 * when no installment is named).
 */
export const summariseSchedule = (
  installments: LandInstallment[],
  nextDue?: LandNextDue | null
): ScheduleSummary => {
  const ordered = [...installments].sort((a, b) => a.sequence - b.sequence);
  const principal = ordered.reduce((sum, i) => sum + i.amount, 0);
  const paidPrincipal = ordered.reduce(
    (sum, i) => sum + (i.status === 'WAIVED' ? i.amount : Math.min(i.amountPaid, i.amount)),
    0
  );
  const overdue = ordered.filter((i) => i.status === 'OVERDUE');
  return {
    total: ordered.length,
    paidCount: ordered.filter(isSettled).length,
    overdueCount: overdue.length,
    overdueAmount: overdue.reduce((sum, i) => sum + i.outstanding, 0),
    lateFees: ordered.reduce((sum, i) => sum + i.lateFee, 0),
    remaining: ordered.reduce((sum, i) => sum + (isSettled(i) ? 0 : i.outstanding), 0),
    nextInstallmentId: nextDue?.installmentId ?? ordered.find((i) => !isSettled(i))?.id,
    percentPaid: principal > 0 ? Math.min(100, Math.round((paidPrincipal / principal) * 100)) : 0,
  };
};

/** Statuses in which an installment can be paid. */
export const PAYABLE_PURCHASE_STATUSES: LandPurchaseStatus[] = [
  'PENDING_DEPOSIT',
  'ACTIVE',
  'DEFAULTED',
];

/** Statuses in which the buyer may cancel. */
export const CANCELLABLE_PURCHASE_STATUSES: LandPurchaseStatus[] = ['PENDING_DEPOSIT', 'ACTIVE'];

/** Statuses in which the buyer may confirm or dispute a conveyance step. */
export const CONFIRMABLE_PURCHASE_STATUSES: LandPurchaseStatus[] = [
  'ACTIVE',
  'PAID_IN_FULL',
  'DEFAULTED',
];

export interface RefundPreview {
  /** What was paid towards the price (late fees excluded). */
  principalPaid: number;
  /** Late fees paid: kept, never refunded. */
  lateFeesPaid: number;
  /** The plan's forfeiture on the principal paid. */
  charge: number;
  refund: number;
  chargeBps: number;
}

/**
 * What cancelling now would refund: everything paid less the plan's
 * forfeiture charge, with paid late fees kept by the developer.
 */
export const refundPreview = (
  purchase: Pick<LandPurchaseDetail, 'amountPaid' | 'installments' | 'terms'>
): RefundPreview => {
  const lateFeesPaid = purchase.installments
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + i.lateFee, 0);
  const principalPaid = Math.max(0, purchase.amountPaid - lateFeesPaid);
  const charge = applyBps(principalPaid, purchase.terms.revocationChargeBps);
  return {
    principalPaid,
    lateFeesPaid,
    charge,
    refund: principalPaid - charge,
    chargeBps: purchase.terms.revocationChargeBps,
  };
};

const SATISFIED = new Set(['CONFIRMED', 'WAIVED']);

export interface MilestoneAction {
  canConfirm: boolean;
  canDispute: boolean;
  /** Earlier steps that must be confirmed first. */
  blockedBy: string[];
}

/**
 * Whether the buyer can act on a step. Only a DELIVERED step can be confirmed
 * or disputed, and confirmations go in order: on a developer sale every
 * earlier step must be satisfied; on a resale only the earlier required ones
 * (`requiredOnly`).
 */
export const milestoneAction = (
  milestones: LandMilestone[],
  milestone: LandMilestone,
  options: { requiredOnly?: boolean; contractOpen?: boolean } = {}
): MilestoneAction => {
  const open = options.contractOpen ?? true;
  const delivered = milestone.status === 'DELIVERED';
  const blockedBy = milestones
    .filter(
      (m) =>
        m.sequence < milestone.sequence &&
        (!options.requiredOnly || m.required) &&
        !SATISFIED.has(m.status)
    )
    .sort((a, b) => a.sequence - b.sequence)
    .map((m) => m.label);
  return {
    canConfirm: open && delivered && blockedBy.length === 0,
    canDispute: open && delivered,
    blockedBy: delivered ? blockedBy : [],
  };
};

/** Tailwind classes for a plot's status, used on the grid, the map legend and badges. */
export const PLOT_STATUS_STYLES: Record<
  LandPlotStatus,
  { cell: string; swatch: string; hex: string }
> = {
  AVAILABLE: {
    cell: 'border-success/40 bg-success/10 text-foreground hover:bg-success/20',
    swatch: 'bg-success',
    hex: '#15803d',
  },
  RESERVED: {
    cell: 'border-warning/40 bg-warning/10 text-foreground',
    swatch: 'bg-warning',
    hex: '#b45309',
  },
  UNDER_INSTALLMENT: {
    cell: 'border-info/40 bg-info/10 text-foreground',
    swatch: 'bg-info',
    hex: '#1d4ed8',
  },
  SOLD: {
    cell: 'border-border bg-muted text-muted-foreground',
    swatch: 'bg-muted-foreground',
    hex: '#6b7280',
  },
  ALLOCATED: {
    cell: 'border-border bg-muted text-muted-foreground',
    swatch: 'bg-muted-foreground/60',
    hex: '#9ca3af',
  },
  WITHHELD: {
    cell: 'border-border bg-muted text-muted-foreground',
    swatch: 'bg-border',
    hex: '#d1d5db',
  },
};

export const plotLabel = (plot: { plotNumber: string; block?: string }) =>
  plot.block ? `Block ${plot.block}, plot ${plot.plotNumber}` : `Plot ${plot.plotNumber}`;
