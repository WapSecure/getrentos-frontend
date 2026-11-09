import type { BadgeTone } from '@getrentos/ui-native';
import { apiDownload, apiFetch } from './client';
import {
  applyBps,
  formatBps,
  type ChecklistItem,
  type ClosingCondition,
  type Milestone,
  type Perfection,
} from './landSales';
import { providerQuery, type PaymentProvider } from './paymentStatus';

/**
 * The buyer's side of a land deal: plot purchases on developers' estates
 * (GetRentos holds every payment and releases it as the buyer confirms each
 * conveyance step) and the conveyance of a single-parcel resale. Rules here
 * mirror the API and web's landSaleLogic so a button shown is one that works.
 */

export type PurchaseStatus =
  | 'PENDING_DEPOSIT'
  | 'ACTIVE'
  | 'PAID_IN_FULL'
  | 'COMPLETED'
  | 'DEFAULTED'
  | 'REVOKED'
  | 'CANCELLED';

export const PURCHASE_STATUSES: PurchaseStatus[] = [
  'PENDING_DEPOSIT',
  'ACTIVE',
  'PAID_IN_FULL',
  'COMPLETED',
  'DEFAULTED',
  'REVOKED',
  'CANCELLED',
];

export const BUYER_PURCHASE_STATUS: Record<PurchaseStatus, { label: string; tone: BadgeTone }> = {
  PENDING_DEPOSIT: { label: 'Awaiting deposit', tone: 'warning' },
  ACTIVE: { label: 'Paying instalments', tone: 'info' },
  PAID_IN_FULL: { label: 'Paid in full', tone: 'success' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  DEFAULTED: { label: 'In default', tone: 'danger' },
  REVOKED: { label: 'Revoked', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};

export const BUYER_MILESTONE_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'Not yet delivered', tone: 'neutral' },
  DELIVERED: { label: 'Awaiting your confirmation', tone: 'warning' },
  CONFIRMED: { label: 'Confirmed', tone: 'success' },
  DISPUTED: { label: 'Disputed', tone: 'danger' },
  WAIVED: { label: 'Waived', tone: 'neutral' },
};

export const BUYER_INSTALLMENT_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'Upcoming', tone: 'neutral' },
  PAID: { label: 'Paid', tone: 'success' },
  OVERDUE: { label: 'Overdue', tone: 'danger' },
  WAIVED: { label: 'Waived', tone: 'neutral' },
};

export const PAYABLE = new Set<PurchaseStatus>(['PENDING_DEPOSIT', 'ACTIVE', 'DEFAULTED']);
export const CANCELLABLE = new Set<PurchaseStatus>(['PENDING_DEPOSIT', 'ACTIVE']);
export const CONFIRMABLE = new Set<PurchaseStatus>(['ACTIVE', 'PAID_IN_FULL', 'DEFAULTED']);
/** An allocation letter exists once the deposit is paid, and while the purchase stands. */
export const ALLOCATION_ISSUED = new Set<PurchaseStatus>([
  'ACTIVE',
  'PAID_IN_FULL',
  'COMPLETED',
  'DEFAULTED',
]);

export interface NextDue {
  installmentId?: string;
  label: string;
  amount: number;
  dueDate: string;
  overdue: boolean;
}

export interface BuyerPurchaseSummary {
  id: string;
  reference: string;
  status: PurchaseStatus;
  plotNumber: string;
  block?: string | null;
  layoutName: string;
  planName: string;
  startedAt?: string | null;
  createdAt: string;
  amountPaid: number;
  totalPrice: number;
  outstandingBalance: number;
  nextDue?: NextDue | null;
}

export interface BuyerInstallment {
  id: string;
  sequence: number;
  label: string;
  dueDate: string;
  amount: number;
  lateFee: number;
  amountPaid: number;
  outstanding: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'WAIVED';
  paidAt?: string | null;
}

export type RefundStatus = 'PENDING' | 'REFUNDED' | 'SETTLED_MANUALLY' | 'NEEDS_MANUAL' | string;

export interface BuyerPurchaseDetail extends BuyerPurchaseSummary {
  propertyId?: string | null;
  plotPrice: number;
  priceUplift: number;
  fees: number;
  feeBreakdown: { documentationFee: number; surveyFee: number; developmentLevy: number };
  lateFeesAccrued: number;
  releasedToSeller: number;
  revocationReason?: string | null;
  refundDue?: number | null;
  refundStatus?: RefundStatus | null;
  refundedAmount?: number | null;
  terms: {
    gracePeriodDays: number;
    lateFeeBps: number;
    defaultAfterDays: number;
    revocationChargeBps: number;
    priceUpliftBps: number;
  };
  installments: BuyerInstallment[];
  milestones: Milestone[];
  conditions?: ClosingCondition[];
  closingChecklist?: ChecklistItem[];
  perfection?: Perfection | null;
  canCancelInFull?: boolean;
}

export interface Statement {
  totalCharged: number;
  totalPaid: number;
  balance: number;
  outstandingBalance: number;
  generatedAt: string;
  entries: {
    date: string;
    kind: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }[];
}

export interface PaymentInit {
  purchaseId: string;
  paymentId: string;
  reference: string;
  amount: number;
  simulated: boolean;
  authorizationUrl?: string | null;
}

/* ---------------------------------- logic --------------------------------- */

/** "Block B, plot 12", or "Plot 12". */
export const plotLabel = (p: { plotNumber: string; block?: string | null }) =>
  p.block ? `Block ${p.block}, plot ${p.plotNumber}` : `Plot ${p.plotNumber}`;

const settled = (i: BuyerInstallment) => i.status === 'PAID' || i.status === 'WAIVED';

/** The payment schedule at a glance. */
export function summariseSchedule(installments: BuyerInstallment[], nextDue?: NextDue | null) {
  const rows = [...installments].sort((a, b) => a.sequence - b.sequence);
  const overdue = rows.filter((i) => i.status === 'OVERDUE');
  const principal = rows.reduce((s, i) => s + i.amount, 0);
  const paidPrincipal = rows.reduce(
    (s, i) => s + (i.status === 'WAIVED' ? i.amount : Math.min(i.amountPaid, i.amount)),
    0
  );
  return {
    rows,
    total: rows.length,
    paidCount: rows.filter(settled).length,
    overdueCount: overdue.length,
    overdueAmount: overdue.reduce((s, i) => s + i.outstanding, 0),
    lateFees: rows.reduce((s, i) => s + i.lateFee, 0),
    remaining: rows.filter((i) => !settled(i)).reduce((s, i) => s + i.outstanding, 0),
    nextInstallmentId: nextDue?.installmentId ?? rows.find((i) => !settled(i))?.id ?? null,
    percentPaid: principal > 0 ? Math.min(100, Math.round((paidPrincipal / principal) * 100)) : 0,
  };
}

/** What cancelling now would return: what was paid toward the price, less the forfeiture. */
export function buyerRefundPreview(
  p: Pick<BuyerPurchaseDetail, 'amountPaid' | 'installments' | 'terms'>
) {
  const lateFeesPaid = p.installments
    .filter((i) => i.status === 'PAID')
    .reduce((s, i) => s + i.lateFee, 0);
  const principalPaid = Math.max(0, p.amountPaid - lateFeesPaid);
  const charge = applyBps(principalPaid, p.terms.revocationChargeBps);
  return {
    lateFeesPaid,
    principalPaid,
    charge,
    refund: principalPaid - charge,
    chargeBps: p.terms.revocationChargeBps,
  };
}

/**
 * Whether the buyer may confirm or dispute a step. Steps are confirmed in
 * order: an earlier step not yet confirmed (or waived) blocks a later one. On
 * a resale only earlier required steps count.
 */
export function milestoneAction(
  milestones: Milestone[],
  m: Milestone,
  {
    requiredOnly = false,
    contractOpen = true,
  }: { requiredOnly?: boolean; contractOpen?: boolean } = {}
) {
  if (m.status !== 'DELIVERED' || !contractOpen) {
    return { canConfirm: false, canDispute: false, blockedBy: [] as string[] };
  }
  const blockedBy = milestones
    .filter(
      (x) =>
        x.sequence < m.sequence &&
        (!requiredOnly || x.required) &&
        x.status !== 'CONFIRMED' &&
        x.status !== 'WAIVED'
    )
    .sort((a, b) => a.sequence - b.sequence)
    .map((x) => x.label);
  return { canConfirm: blockedBy.length === 0, canDispute: true, blockedBy };
}

/** How the refund on an ended purchase stands, in words. */
export function refundSentence(
  p: Pick<BuyerPurchaseDetail, 'refundDue' | 'refundStatus' | 'refundedAmount'>,
  fmt: (n: number) => string
) {
  const due = p.refundDue ?? 0;
  if (due === 0) return 'No refund is due.';
  if (p.refundStatus === 'REFUNDED' || p.refundStatus === 'SETTLED_MANUALLY') {
    return `Your refund of ${fmt(due)} has been paid. Banks usually show it within 5–10 working days.`;
  }
  if (p.refundStatus === 'NEEDS_MANUAL') {
    const back = p.refundedAmount ?? 0;
    return `${fmt(back)} of your ${fmt(due)} refund has been returned; GetRentos finance is paying the remaining ${fmt(due - back)} directly.`;
  }
  return `A refund of ${fmt(due)} is on its way to the card or account you paid with.`;
}

/** What cancelling would mean, in the dialog's words. */
export function cancelDescription(p: BuyerPurchaseDetail, fmt: (n: number) => string) {
  if (p.canCancelInFull) {
    return `A condition of this purchase was not met, so you receive everything you have paid (${fmt(p.amountPaid)}), late fees included, with no cancellation charge. The plot goes back on sale and this cannot be undone.`;
  }
  const r = buyerRefundPreview(p);
  if (r.principalPaid > 0) {
    const late =
      r.lateFeesPaid > 0 ? `; the ${fmt(r.lateFeesPaid)} paid in late fees is not refundable` : '';
    return `You have paid ${fmt(r.principalPaid)} towards the price. The plan keeps ${formatBps(r.chargeBps)} (${fmt(r.charge)}) as a forfeiture charge, so about ${fmt(r.refund)} would be refunded${late}. The plot goes back on sale and this cannot be undone.`;
  }
  return 'Nothing has been paid yet, so nothing is forfeited. The plot goes back on sale and this cannot be undone.';
}

/** Dispute reasons the API accepts. */
export const DISPUTE_MIN = 5;
export const DISPUTE_MAX = 2000;

/* ------------------------------ estates & plots --------------------------- */

export type PlotStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'UNDER_INSTALLMENT'
  | 'SOLD'
  | 'ALLOCATED'
  | 'WITHHELD';

export const PLOT_STATUS_LABEL: Record<PlotStatus, string> = {
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  UNDER_INSTALLMENT: 'Under instalment',
  SOLD: 'Sold',
  ALLOCATED: 'Allocated',
  WITHHELD: 'Withheld',
};

/** The colours web uses for plot status, so the two read the same. */
export const PLOT_STATUS_COLOR: Record<PlotStatus, string> = {
  AVAILABLE: '#15803d',
  RESERVED: '#b45309',
  UNDER_INSTALLMENT: '#1d4ed8',
  SOLD: '#6b7280',
  ALLOCATED: '#9ca3af',
  WITHHELD: '#d1d5db',
};

export interface EstateSummary {
  id: string;
  name: string;
  city: string;
  state: string;
  description?: string | null;
  availablePlots: number;
  totalPlots: number;
  priceFrom?: number;
  priceTo?: number;
}

export interface EstatePlot {
  id: string;
  plotNumber: string;
  block?: string | null;
  areaSqm: number;
  isCorner: boolean;
  tags: string[];
  price: number;
  pricePerSqm?: number;
  status: PlotStatus;
  heldUntil?: string | null;
}

export interface EstatePlan {
  id: string;
  name: string;
  active: boolean;
  durationMonths: number;
  initialDepositBps: number;
  priceUpliftBps: number;
  gracePeriodDays: number;
  lateFeeBps: number;
  defaultAfterDays: number;
  revocationChargeBps: number;
}

export interface EstateDetail extends EstateSummary {
  propertyTitle: string;
  layoutApprovalReference?: string | null;
  fees: { documentationFee: number; surveyFee: number; developmentLevy: number; total: number };
  reservationHoldHours: number;
  inspectionHoldDays: number;
  reservationTerms: { version: string; points: string[]; subjectToInspection?: string | null };
  notVerified: { key: string; label: string; status?: string }[];
  openConditions?: { text: string; dueAt?: string | null }[] | null;
  plots: EstatePlot[];
  paymentPlans: EstatePlan[];
}

export interface Reservation {
  id: string;
  plotId: string;
  layoutId: string;
  layoutName: string;
  plotNumber: string;
  block?: string | null;
  price: number;
  status: 'ACTIVE' | 'CONVERTED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
}

export const RESERVATION_STATUS: Record<Reservation['status'], { label: string; tone: BadgeTone }> =
  {
    ACTIVE: { label: 'Holding', tone: 'info' },
    CONVERTED: { label: 'Purchase started', tone: 'success' },
    EXPIRED: { label: 'Expired', tone: 'neutral' },
    CANCELLED: { label: 'Released', tone: 'neutral' },
  };

/** What a plot costs on a plan, priced the way the server prices it. */
export function quotePlot(
  plotPrice: number,
  feesTotal: number,
  plan: Pick<EstatePlan, 'durationMonths' | 'priceUpliftBps' | 'initialDepositBps'>
) {
  const months = plan.durationMonths;
  const priceUplift = months > 0 ? applyBps(plotPrice, plan.priceUpliftBps) : 0;
  const contract = plotPrice + priceUplift;
  const totalPrice = contract + feesTotal;
  const initialPayment =
    months === 0 ? totalPrice : applyBps(contract, plan.initialDepositBps) + feesTotal;
  const balance = totalPrice - initialPayment;
  return {
    plotPrice,
    priceUplift,
    fees: feesTotal,
    totalPrice,
    initialPayment,
    monthlyInstallment: months > 0 && balance > 0 ? Math.floor(balance / months) : 0,
    durationMonths: months,
  };
}

/** Time left on a hold, as web shows it. Urgent under an hour. */
export function countdownTo(expiresAt: string, now = Date.now()) {
  const remainingMs = Date.parse(expiresAt) - now;
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
    return { expired: true, remainingMs: 0, label: 'Expired', urgent: true };
  }
  const totalSec = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const label =
    days > 0
      ? `${days}d ${hours}h`
      : hours > 0
        ? `${hours}h ${pad(minutes)}m`
        : `${minutes}m ${pad(seconds)}s`;
  return { expired: false, remainingMs, label, urgent: remainingMs < 3_600_000 };
}

export type PlotFilter = 'available' | 'all' | 'reserved' | 'sold';
export const PLOT_FILTERS: { value: PlotFilter; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'all', label: 'All' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold or paying' },
];

export function filterPlots(
  plots: EstatePlot[],
  { status, block, cornerOnly }: { status: PlotFilter; block?: string; cornerOnly?: boolean }
) {
  return plots.filter((p) => {
    if (status === 'available' && p.status !== 'AVAILABLE') return false;
    if (status === 'reserved' && p.status !== 'RESERVED') return false;
    if (status === 'sold' && !['UNDER_INSTALLMENT', 'SOLD', 'ALLOCATED'].includes(p.status))
      return false;
    if (block && (p.block ?? '') !== block) return false;
    if (cornerOnly && !p.isCorner) return false;
    return true;
  });
}

/** A plan's terms in a sentence, as web's plan card puts it. */
export function planTermsLine(
  plan: Pick<EstatePlan, 'durationMonths' | 'initialDepositBps' | 'priceUpliftBps'>
) {
  if (plan.durationMonths === 0) return 'Pay in full to start. No instalment premium.';
  const uplift =
    plan.priceUpliftBps > 0
      ? `${formatBps(plan.priceUpliftBps)} added to the plot price.`
      : 'No instalment premium.';
  return `${formatBps(plan.initialDepositBps)} deposit, then ${plan.durationMonths} monthly instalments. ${uplift}`;
}

/** Live holds first (soonest to run out), then the past ones. */
export function splitReservations(list: Reservation[], now = Date.now()) {
  const live = list
    .filter((r) => r.status === 'ACTIVE' && !countdownTo(r.expiresAt, now).expired)
    .sort((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt));
  const past = list.filter((r) => !live.includes(r));
  return { live, past };
}

/* ----------------------------------- api ---------------------------------- */

export type SaleDocument = 'contract-of-sale' | 'allocation-letter';

const purchase = (id: string) => `/buyer/land/purchases/${encodeURIComponent(id)}`;
const tx = (id: string) => `/buyer/land/transactions/${encodeURIComponent(id)}`;
const post = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: 'POST', ...(body !== undefined ? { body } : {}) });

export const landBuyerApi = {
  purchases: (page: number, pageSize: number, status?: PurchaseStatus) =>
    apiFetch<{ items: BuyerPurchaseSummary[]; total: number; page: number; totalPages: number }>(
      `/buyer/land/purchases?page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ''}`
    ),
  purchase: (id: string) => apiFetch<BuyerPurchaseDetail>(purchase(id)),
  statement: (id: string) => apiFetch<Statement>(`${purchase(id)}/statement`),
  /** Pays the earliest unpaid installment (the deposit first). */
  pay: (id: string, provider?: PaymentProvider) =>
    post<PaymentInit>(`${purchase(id)}/pay${providerQuery(provider)}`, {}),
  cancel: (id: string, reason?: string) =>
    post<BuyerPurchaseDetail>(`${purchase(id)}/cancel`, reason ? { reason } : {}),
  document: (id: string, kind: SaleDocument) => apiDownload(`${purchase(id)}/documents/${kind}`),
  confirmMilestone: (id: string, key: string) =>
    post<BuyerPurchaseDetail>(`${purchase(id)}/milestones/${encodeURIComponent(key)}/confirm`),
  disputeMilestone: (id: string, key: string, reason: string) =>
    post<BuyerPurchaseDetail>(`${purchase(id)}/milestones/${encodeURIComponent(key)}/dispute`, {
      reason,
    }),
  settleCondition: (id: string, key: string, how: 'confirm' | 'waive') =>
    post<BuyerPurchaseDetail>(`${purchase(id)}/conditions/${encodeURIComponent(key)}/${how}`),

  resaleMilestones: (txId: string) => apiFetch<Milestone[]>(`${tx(txId)}/milestones`),
  confirmResaleMilestone: (txId: string, key: string) =>
    post<Milestone>(`${tx(txId)}/milestones/${encodeURIComponent(key)}/confirm`),
  disputeResaleMilestone: (txId: string, key: string, reason: string) =>
    post<Milestone>(`${tx(txId)}/milestones/${encodeURIComponent(key)}/dispute`, { reason }),
  resaleConditions: (txId: string) => apiFetch<ClosingCondition[]>(`${tx(txId)}/conditions`),
  settleResaleCondition: (txId: string, key: string, how: 'confirm' | 'waive') =>
    post<ClosingCondition[]>(`${tx(txId)}/conditions/${encodeURIComponent(key)}/${how}`),

  reservations: () => apiFetch<Reservation[]>('/buyer/land/reservations'),
  cancelReservation: (id: string) =>
    post<Reservation>(`/buyer/land/reservations/${encodeURIComponent(id)}/cancel`),
  estates: (page: number, pageSize: number, search?: string) =>
    apiFetch<{ items: EstateSummary[]; total: number; page: number; totalPages: number }>(
      `/land/layouts?page=${page}&pageSize=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ''}`
    ),
  estate: (id: string) => apiFetch<EstateDetail>(`/land/layouts/${encodeURIComponent(id)}`),
  reserve: (plotId: string, acceptedTermsVersion: string, subjectToInspectionId?: string) =>
    post<Reservation>(`/buyer/land/plots/${encodeURIComponent(plotId)}/reserve`, {
      acceptedTermsVersion,
      ...(subjectToInspectionId ? { subjectToInspectionId } : {}),
    }),
  startPurchase: (reservationId: string, planId: string, acknowledgedNotVerified: string[]) =>
    post<BuyerPurchaseDetail>('/buyer/land/purchases', {
      reservationId,
      planId,
      acknowledgedNotVerified,
    }),
  inspections: () =>
    apiFetch<{ id: string; plotId?: string | null; status: string }[]>('/buyer/land/inspections'),
};

/**
 * The next payment as the lines it is made of, so a late fee is never folded
 * into one number: "Land payment ₦X", "Late fee ₦Y". Only when the instalment
 * is untouched and the lines add up to what is due; otherwise undefined and
 * the pay sheet shows the single amount. Same rule as web.
 */
export function nextDueParts(
  nextDue: Pick<NextDue, 'installmentId' | 'amount'> | null | undefined,
  installments: Pick<BuyerInstallment, 'id' | 'amount' | 'amountPaid' | 'lateFee'>[]
): { label: string; amount: number }[] | undefined {
  if (!nextDue?.installmentId) return undefined;
  const due = installments.find((i) => i.id === nextDue.installmentId);
  if (!due || due.lateFee <= 0 || due.amountPaid > 0) return undefined;
  if (due.amount + due.lateFee !== nextDue.amount) return undefined;
  return [
    { label: 'Land payment', amount: due.amount },
    { label: 'Late fee', amount: due.lateFee },
  ];
}
