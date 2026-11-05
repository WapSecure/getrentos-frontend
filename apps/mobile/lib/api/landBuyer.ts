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
  ACTIVE: { label: 'Paying installments', tone: 'info' },
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
  pay: (id: string) => post<PaymentInit>(`${purchase(id)}/pay`, {}),
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

  reservationCount: () =>
    apiFetch<{ status: string; expiresAt: string }[]>('/buyer/land/reservations'),
};
