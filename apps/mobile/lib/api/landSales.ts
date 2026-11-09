import { apiDownload, apiFetch } from './client';
import type { BadgeTone } from '@sureground/ui-native';

/**
 * Selling land: plot purchases on the owner's estates (the sales desk) and the
 * conveyance of a resale. The seller marks steps delivered; the buyer confirms
 * each, which is what releases money held in escrow.
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

export const PURCHASE_STATUS: Record<PurchaseStatus, { label: string; tone: BadgeTone }> = {
  PENDING_DEPOSIT: { label: 'Awaiting deposit', tone: 'info' },
  ACTIVE: { label: 'Paying', tone: 'success' },
  PAID_IN_FULL: { label: 'Paid in full', tone: 'success' },
  COMPLETED: { label: 'Completed', tone: 'neutral' },
  DEFAULTED: { label: 'Defaulted', tone: 'danger' },
  REVOKED: { label: 'Revoked', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};

export type MilestoneStatus = 'PENDING' | 'DELIVERED' | 'CONFIRMED' | 'DISPUTED' | 'WAIVED';

export const MILESTONE_STATUS: Record<MilestoneStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'Pending', tone: 'neutral' },
  DELIVERED: { label: 'Awaiting buyer', tone: 'info' },
  CONFIRMED: { label: 'Confirmed', tone: 'success' },
  DISPUTED: { label: 'Disputed', tone: 'danger' },
  WAIVED: { label: 'Waived', tone: 'neutral' },
};

export const INSTALLMENT_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'Upcoming', tone: 'neutral' },
  PAID: { label: 'Paid', tone: 'success' },
  OVERDUE: { label: 'Overdue', tone: 'danger' },
  WAIVED: { label: 'Waived', tone: 'neutral' },
};

export const PAYMENT_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'Processing', tone: 'info' },
  CONFIRMED: { label: 'Received', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'danger' },
};

export const PAYOUT_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  AWAITING_APPROVAL: { label: 'Awaiting approval', tone: 'warning' },
  PENDING: { label: 'Payout queued', tone: 'neutral' },
  PROCESSING: { label: 'Sending to your bank', tone: 'info' },
  PAID: { label: 'Paid to your bank', tone: 'success' },
  FAILED: { label: 'Payout failed', tone: 'danger' },
};

export interface EstateLayoutSummary {
  id: string;
  name: string;
  propertyId: string;
  propertyTitle: string;
  city: string;
  state: string;
  access: 'OWNER' | 'MANDATE';
  plots: {
    total: number;
    available: number;
    reserved: number;
    underInstallment: number;
    sold: number;
    allocated: number;
    withheld: number;
  };
}

export interface Collections {
  purchaseCount: number;
  activeCount: number;
  collected: number;
  heldInEscrow: number;
  releasedToSeller: number;
  outstanding: number;
}

export interface NextDue {
  label?: string;
  amount: number;
  dueDate: string;
  overdue: boolean;
}

export interface PurchaseSummary {
  id: string;
  reference: string;
  status: PurchaseStatus;
  layoutId: string;
  layoutName: string;
  plotNumber: string;
  block?: string | null;
  buyerName?: string | null;
  planName: string;
  totalPrice: number;
  amountPaid: number;
  nextDue?: NextDue | null;
}

export interface Milestone {
  id?: string;
  key: string;
  label: string;
  sequence: number;
  required: boolean;
  status: MilestoneStatus;
  releaseBps: number;
  deliveredAt?: string | null;
  confirmedAt?: string | null;
  documentId?: string | null;
  note?: string | null;
  disputeReason?: string | null;
}

export interface ClosingCondition {
  key: string;
  label: string;
  status: 'PENDING' | 'DELIVERED' | 'SATISFIED' | 'WAIVED';
  failed: boolean;
  deadline?: string | null;
  basis?: string | null;
  remedy?: string | null;
  note?: string | null;
  deliveredNote?: string | null;
  deliveredByDeveloper?: boolean;
}

export const CONDITION_STATUS: Record<
  ClosingCondition['status'] | 'FAILED',
  { label: string; tone: BadgeTone }
> = {
  PENDING: { label: 'Open', tone: 'neutral' },
  DELIVERED: { label: 'Awaiting buyer', tone: 'info' },
  SATISFIED: { label: 'Met', tone: 'success' },
  WAIVED: { label: 'Waived by buyer', tone: 'success' },
  FAILED: { label: 'Not met', tone: 'danger' },
};

export const conditionOpen = (c: ClosingCondition) =>
  c.status === 'PENDING' || c.status === 'DELIVERED';

export interface ChecklistItem {
  key: string;
  label: string;
  state: 'DONE' | 'OPEN' | 'BLOCKED';
  detail?: string | null;
}

export type PerfectionStepStatus =
  | 'NOT_STARTED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'NOT_APPLICABLE';

export const PERFECTION_STEP: Record<PerfectionStepStatus, { label: string; tone: BadgeTone }> = {
  NOT_STARTED: { label: 'Not started', tone: 'neutral' },
  SUBMITTED: { label: 'Submitted, awaiting approval', tone: 'info' },
  APPROVED: { label: 'Approved', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  NOT_APPLICABLE: { label: 'Not applicable', tone: 'neutral' },
};

export const PERFECTION_OWNER: Record<string, string> = {
  DEVELOPER: 'Developer',
  BUYER_LAWYER: 'Buyer’s lawyer',
  SUREGROUND: 'Sureground',
};

export interface Perfection {
  status: 'OPEN' | 'PERFECTED' | 'EXCEPTION';
  professionalName?: string | null;
  professionalFirm?: string | null;
  perfectedAt?: string | null;
  finalInstrumentReference?: string | null;
  blockers?: string[];
  steps: {
    key: string;
    label: string;
    owner: string;
    status: PerfectionStepStatus;
    dueDate?: string | null;
    submittedAt?: string | null;
    submissionReference?: string | null;
    approvedAt?: string | null;
    approvalReference?: string | null;
    note?: string | null;
    escalationLevel: number;
  }[];
}

export interface Installment {
  id: string;
  label: string;
  dueDate: string;
  amount: number;
  lateFee: number;
  amountPaid: number;
  outstanding: number;
  paidAt?: string | null;
  status: string;
}

export interface PurchaseDetail extends PurchaseSummary {
  propertyId?: string;
  plotPrice: number;
  priceUplift: number;
  fees: number;
  outstandingBalance: number;
  releasedToSeller: number;
  defaultedAt?: string | null;
  revokedAt?: string | null;
  revocationReason?: string | null;
  refundDue?: number;
  terms: {
    durationMonths: number;
    initialDepositBps: number;
    lateFeeBps: number;
    gracePeriodDays: number;
    defaultAfterDays: number;
    revocationChargeBps: number;
  };
  conditions?: ClosingCondition[];
  closingChecklist?: ChecklistItem[];
  milestones: Milestone[];
  perfection?: Perfection | null;
  installments: Installment[];
  payments: {
    id: string;
    amount: number;
    status: string;
    providerReference: string;
    confirmedAt?: string | null;
    createdAt: string;
    simulated?: boolean;
  }[];
  releases: {
    id: string;
    amount: number;
    reason: string;
    createdAt: string;
    payoutStatus?: string | null;
    paidAt?: string | null;
  }[];
}

/** Basis points as a percentage: 250 → "2.5%". */
export const formatBps = (bps: number) => `${Number((bps / 100).toFixed(2))}%`;

/** Steps that wait for the plot to be paid for in full. */
export const FULL_PAYMENT_MILESTONES = new Set([
  'PHYSICAL_ALLOCATION',
  'DEED_OF_ASSIGNMENT',
  'SURVEY_PLAN_IN_BUYER_NAME',
]);

const DELIVERABLE = new Set<PurchaseStatus>(['ACTIVE', 'PAID_IN_FULL', 'DEFAULTED']);

/** Whether the seller may mark a step delivered now, and why not when they can't. */
export function deliverability(
  status: PurchaseStatus,
  m: Pick<Milestone, 'key' | 'status'>
): { allowed: boolean; reason?: string } {
  if (m.status !== 'PENDING' && m.status !== 'DISPUTED') return { allowed: false };
  if (status === 'PENDING_DEPOSIT') {
    return { allowed: false, reason: 'Conveyance starts once the deposit is paid.' };
  }
  if (!DELIVERABLE.has(status)) return { allowed: false, reason: 'This purchase has ended.' };
  if (FULL_PAYMENT_MILESTONES.has(m.key) && status !== 'PAID_IN_FULL') {
    return { allowed: false, reason: 'Follows full payment of the plot.' };
  }
  return { allowed: true };
}

/** `amount * bps / 10000`, rounded half up, as the server does. */
export const applyBps = (amount: number, bps: number) =>
  Math.floor((Math.round(amount) * Math.round(bps) + 5000) / 10000);

/**
 * What revoking returns to the buyer: everything paid towards the price,
 * less the revocation charge. Late fees paid are kept.
 */
export function refundPreview(
  amountPaid: number,
  installments: Pick<Installment, 'status' | 'lateFee'>[],
  revocationChargeBps: number
) {
  const lateFeesPaid = installments
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + i.lateFee, 0);
  const principalPaid = Math.max(0, amountPaid - lateFeesPaid);
  const charge = applyBps(principalPaid, revocationChargeBps);
  return { lateFeesPaid, principalPaid, charge, refund: principalPaid - charge };
}

/** Required steps the buyer has confirmed (or waived), of all required. */
export function confirmedProgress(milestones: Milestone[]) {
  const required = milestones.filter((m) => m.required);
  const done = required.filter((m) => m.status === 'CONFIRMED' || m.status === 'WAIVED');
  const forYou = milestones.filter((m) => m.status === 'PENDING' || m.status === 'DISPUTED');
  return { done: done.length, required: required.length, forYou: forYou.length };
}

export const plotName = (p: Pick<PurchaseSummary, 'block' | 'plotNumber'>) =>
  `${p.block ? `Block ${p.block}, ` : ''}Plot ${p.plotNumber}`;

export type SaleDocument = 'contract-of-sale' | 'allocation-letter';

export interface PurchaseListParams {
  page: number;
  pageSize: number;
  status?: PurchaseStatus;
  layoutId?: string;
  search?: string;
}

const purchase = (id: string) => `/owner/land/purchases/${id}`;

export const landSalesApi = {
  layouts: () => apiFetch<EstateLayoutSummary[]>('/owner/land/layouts'),
  collections: (layoutId?: string) =>
    apiFetch<Collections>(
      `/owner/land/purchases/collections${layoutId ? `?layoutId=${encodeURIComponent(layoutId)}` : ''}`
    ),
  purchases: (p: PurchaseListParams) => {
    const q = new URLSearchParams({ page: String(p.page), pageSize: String(p.pageSize) });
    if (p.status) q.set('status', p.status);
    if (p.layoutId) q.set('layoutId', p.layoutId);
    if (p.search) q.set('search', p.search);
    return apiFetch<{ items: PurchaseSummary[]; total: number; page: number; totalPages: number }>(
      `/owner/land/purchases?${q.toString()}`
    );
  },
  purchase: (id: string) => apiFetch<PurchaseDetail>(purchase(id)),
  deliverMilestone: (id: string, key: string, input: { note?: string; documentId?: string }) =>
    apiFetch<PurchaseDetail>(`${purchase(id)}/milestones/${encodeURIComponent(key)}/deliver`, {
      method: 'POST',
      body: input,
    }),
  deliverCondition: (id: string, key: string, note: string) =>
    apiFetch<PurchaseDetail>(`${purchase(id)}/conditions/${encodeURIComponent(key)}/deliver`, {
      method: 'POST',
      body: note ? { note } : {},
    }),
  updatePerfection: (
    id: string,
    key: string,
    input: { status: 'SUBMITTED' | 'APPROVED'; reference?: string }
  ) =>
    apiFetch<PurchaseDetail>(`${purchase(id)}/perfection/steps/${encodeURIComponent(key)}`, {
      method: 'POST',
      body: input,
    }),
  revoke: (id: string, reason: string) =>
    apiFetch<PurchaseDetail>(`${purchase(id)}/revoke`, { method: 'POST', body: { reason } }),
  document: (id: string, kind: SaleDocument) => apiDownload(`${purchase(id)}/documents/${kind}`),

  resaleMilestones: (txId: string) =>
    apiFetch<Milestone[]>(`/owner/land/transactions/${txId}/milestones`),
  deliverResaleMilestone: (
    txId: string,
    key: string,
    input: { note?: string; documentId?: string }
  ) =>
    apiFetch<Milestone>(
      `/owner/land/transactions/${txId}/milestones/${encodeURIComponent(key)}/deliver`,
      { method: 'POST', body: input }
    ),
  resaleConditions: (txId: string) =>
    apiFetch<ClosingCondition[]>(`/owner/land/transactions/${txId}/conditions`),
  deliverResaleCondition: (txId: string, key: string, note: string) =>
    apiFetch<ClosingCondition[]>(
      `/owner/land/transactions/${txId}/conditions/${encodeURIComponent(key)}/deliver`,
      { method: 'POST', body: note ? { note } : {} }
    ),
};
