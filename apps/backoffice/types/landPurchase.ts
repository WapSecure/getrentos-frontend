/**
 * Developer plot purchases as the back office sees them. Money is whole naira
 * as a JSON number; rates are basis points (1% = 100).
 */

export const LAND_PURCHASE_STATUSES = [
  'PENDING_DEPOSIT',
  'ACTIVE',
  'PAID_IN_FULL',
  'COMPLETED',
  'DEFAULTED',
  'REVOKED',
  'CANCELLED',
] as const;
export type LandPurchaseStatus = (typeof LAND_PURCHASE_STATUSES)[number];

export interface LandNextDue {
  installmentId: string;
  sequence: number;
  label: string;
  dueDate: string;
  /** Amount to pay now, late fee included. */
  amount: number;
  overdue: boolean;
}

export interface LandPurchaseSummary {
  id: string;
  reference: string;
  status: LandPurchaseStatus | string;
  layoutId: string;
  layoutName: string;
  plotId: string;
  plotNumber: string;
  block?: string;
  buyerId: string;
  buyerName?: string;
  sellerId: string;
  planName: string;
  plotPrice: number;
  priceUplift: number;
  fees: number;
  totalPrice: number;
  amountPaid: number;
  lateFeesAccrued: number;
  releasedToSeller: number;
  /** Unpaid installments plus unpaid late fees. */
  outstandingBalance: number;
  /** What the buyer is owed back after a revocation or cancellation. */
  refundDue?: number;
  /** Where returning refundDue stands; NEEDS_MANUAL means finance must finish it. */
  refundStatus?: LandRefundStatus;
  /** What has actually gone back to the buyer, naira. */
  refundedAmount?: number;
  refundSettledAt?: string;
  nextDue?: LandNextDue;
  startedAt?: string;
  paidInFullAt?: string;
  completedAt?: string;
  defaultedAt?: string;
  revokedAt?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface LandPurchaseTerms {
  durationMonths: number;
  initialDepositBps: number;
  priceUpliftBps: number;
  gracePeriodDays: number;
  lateFeeBps: number;
  defaultAfterDays: number;
  revocationChargeBps: number;
}

export interface LandInstallment {
  id: string;
  sequence: number;
  label: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  lateFee: number;
  /** Still owed on this installment, late fee included. */
  outstanding: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'WAIVED' | string;
  paidAt?: string;
}

export interface LandPurchasePayment {
  id: string;
  installmentId?: string;
  amount: number;
  providerReference: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | string;
  simulated: boolean;
  confirmedAt?: string;
  createdAt: string;
}

export interface LandMilestone {
  id: string;
  key: string;
  label: string;
  sequence: number;
  required: boolean;
  /** Share of the contract price this step releases, in basis points. */
  releaseBps: number;
  status: 'PENDING' | 'DELIVERED' | 'CONFIRMED' | 'DISPUTED' | 'WAIVED' | string;
  deliveredAt?: string;
  documentId?: string;
  note?: string;
  confirmedAt?: string;
  disputeReason?: string;
}

export interface LandEscrowRelease {
  id: string;
  milestoneId?: string;
  amount: number;
  reason: string;
  createdAt: string;
  /** Where the payout of this release to the developer's bank stands. */
  payoutStatus?: LandReleasePayoutStatus;
  paidAt?: string;
  approvedAt?: string;
}

export type LandReleasePayoutStatus =
  | 'AWAITING_APPROVAL'
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED';

/** A condition precedent on a plot purchase (blueprint §9.3). */
export interface LandClosingCondition {
  key: string;
  label: string;
  status: 'PENDING' | 'DELIVERED' | 'SATISFIED' | 'WAIVED' | 'FAILED';
  deadline?: string;
  failed: boolean;
  basis?: string;
  remedy: string;
  deliveredByDeveloper: boolean;
  deliveredAt?: string;
  deliveredNote?: string;
  decidedAt?: string;
  note?: string;
}

export interface LandClosingChecklistItem {
  key: string;
  label: string;
  state: 'DONE' | 'OPEN' | 'BLOCKED';
  detail?: string;
}

export interface LandPerfectionStep {
  key: string;
  label: string;
  owner: string;
  status: 'NOT_STARTED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'NOT_APPLICABLE';
  dueDate?: string;
  submittedAt?: string;
  submissionReference?: string;
  approvedAt?: string;
  approvalReference?: string;
  note?: string;
  escalationLevel: number;
}

export interface LandPerfection {
  status: 'OPEN' | 'EXCEPTION' | 'PERFECTED';
  professionalName?: string;
  professionalFirm?: string;
  professionalContact?: string;
  openedAt: string;
  perfectedAt?: string;
  finalInstrumentReference?: string;
  legalReview?: string;
  steps: LandPerfectionStep[];
  blockers: string[];
}

export interface LandPerfectionQueueItem {
  purchaseId: string;
  reference: string;
  status: 'OPEN' | 'EXCEPTION';
  professionalName?: string;
  lateSteps: number;
  openedAt: string;
}

export interface LandPurchaseDetail extends LandPurchaseSummary {
  perfection?: LandPerfection | null;
  conditions?: LandClosingCondition[];
  closingChecklist?: LandClosingChecklistItem[];
  canCancelInFull?: boolean;
  terms: LandPurchaseTerms;
  feeBreakdown: {
    documentationFee: number;
    surveyFee: number;
    developmentLevy: number;
    total: number;
  };
  revocationReason?: string;
  installments: LandInstallment[];
  payments: LandPurchasePayment[];
  milestones: LandMilestone[];
  releases: LandEscrowRelease[];
}

export type LandRefundStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'REFUNDED'
  | 'FAILED'
  | 'NEEDS_MANUAL'
  | 'SETTLED_MANUALLY';
