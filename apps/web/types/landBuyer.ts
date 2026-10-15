import type { LandNotVerifiedItem, LandTrustLabel } from './land';

/**
 * Developer estate (layout) sales as the buyer and the public see them.
 *
 * Mirrors the backend's `land-sales-response.dto.ts`. Money is whole naira as a
 * JSON number; rates are basis points (1% = 100).
 */

export type LandPlotStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'UNDER_INSTALLMENT'
  | 'SOLD'
  | 'ALLOCATED'
  | 'WITHHELD';

export type LandReservationStatus = 'ACTIVE' | 'CONVERTED' | 'EXPIRED' | 'CANCELLED';

export type LandPurchaseStatus =
  | 'PENDING_DEPOSIT'
  | 'ACTIVE'
  | 'PAID_IN_FULL'
  | 'COMPLETED'
  | 'DEFAULTED'
  | 'REVOKED'
  | 'CANCELLED';

export type LandInstallmentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'WAIVED';

export type LandMilestoneStatus = 'PENDING' | 'DELIVERED' | 'CONFIRMED' | 'DISPUTED' | 'WAIVED';

export type LandSaleDocumentKind = 'contract-of-sale' | 'allocation-letter';

export interface LandLayoutFees {
  documentationFee: number;
  surveyFee: number;
  developmentLevy: number;
  total: number;
}

export interface LandPaymentPlan {
  id: string;
  name: string;
  /** 0 is an outright purchase. */
  durationMonths: number;
  initialDepositBps: number;
  priceUpliftBps: number;
  gracePeriodDays: number;
  lateFeeBps: number;
  defaultAfterDays: number;
  revocationChargeBps: number;
  active: boolean;
}

/** A worked example of what a plan costs on a real plot (the cheapest available one). */
export interface LandPlanPriceExample {
  plotPrice: number;
  priceUplift: number;
  /** Documentation + survey + development levy. */
  fees: number;
  totalPrice: number;
  /** Deposit share of the price plus all fees, due to start. */
  initialPayment: number;
  /** A regular monthly installment after the deposit; 0 for outright. */
  monthlyInstallment: number;
  durationMonths: number;
}

export interface PublicLandPaymentPlan extends LandPaymentPlan {
  example?: LandPlanPriceExample;
}

export interface LandPlot {
  id: string;
  layoutId: string;
  plotNumber: string;
  block?: string;
  areaValue: number;
  areaUnit: string;
  areaSqm: number;
  /** GeoJSON Polygon. */
  boundaryGeometry?: unknown;
  isCorner: boolean;
  tags: string[];
  price: number;
  pricePerSqm?: number;
  status: LandPlotStatus;
  heldUntil?: string;
}

export interface PublicLandLayoutSummary {
  id: string;
  name: string;
  description?: string;
  propertyId: string;
  propertyTitle: string;
  city: string;
  state: string;
  layoutApprovalReference?: string;
  fees: LandLayoutFees;
  totalPlots: number;
  availablePlots: number;
  priceFrom?: number;
  priceTo?: number;
  publishedAt?: string;
}

export interface PublicLandLayoutDetail extends PublicLandLayoutSummary {
  reservationHoldHours: number;
  /** The master parcel's scoped trust labels. */
  labels?: LandTrustLabel[];
  /** Checks not verified on the master parcel; the buyer accepts these to purchase. */
  notVerified?: LandNotVerifiedItem[];
  plots: LandPlot[];
  paymentPlans: PublicLandPaymentPlan[];
}

export interface PublicLandLayoutListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  city?: string;
  state?: string;
}

export interface LandReservation {
  id: string;
  plotId: string;
  layoutId: string;
  layoutName: string;
  plotNumber: string;
  block?: string;
  price: number;
  status: LandReservationStatus;
  expiresAt: string;
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
  status: LandMilestoneStatus;
  deliveredAt?: string;
  documentId?: string;
  note?: string;
  confirmedAt?: string;
  disputeReason?: string;
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
  status: LandInstallmentStatus;
  paidAt?: string;
}

export interface LandPurchasePayment {
  id: string;
  installmentId?: string;
  amount: number;
  providerReference: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  simulated: boolean;
  confirmedAt?: string;
  createdAt: string;
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
  /** The master land property the estate sits on. */
  propertyId?: string;
  id: string;
  reference: string;
  status: LandPurchaseStatus;
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
  refundDue?: number;
  /** PENDING/PROCESSING/FAILED: on its way; REFUNDED/SETTLED_MANUALLY: paid; NEEDS_MANUAL: with finance. */
  refundStatus?:
    | 'PENDING'
    | 'PROCESSING'
    | 'REFUNDED'
    | 'FAILED'
    | 'NEEDS_MANUAL'
    | 'SETTLED_MANUALLY';
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

export interface LandPurchaseDetail extends LandPurchaseSummary {
  terms: LandPurchaseTerms;
  feeBreakdown: LandLayoutFees;
  revocationReason?: string;
  installments: LandInstallment[];
  payments: LandPurchasePayment[];
  milestones: LandMilestone[];
  releases: LandEscrowRelease[];
}

export interface LandPaymentInit {
  purchaseId: string;
  paymentId: string;
  reference: string;
  /** Naira charged, late fee included. */
  amount: number;
  /** True when no gateway is configured and success was simulated. */
  simulated: boolean;
  authorizationUrl?: string;
}

export interface LandStatementEntry {
  date: string;
  kind: 'CHARGE' | 'LATE_FEE' | 'PAYMENT' | 'WAIVER';
  description: string;
  debit: number;
  credit: number;
  /** Running balance owed after this entry. */
  balance: number;
}

export interface LandStatement {
  purchaseId: string;
  reference: string;
  generatedAt: string;
  totalPrice: number;
  entries: LandStatementEntry[];
  totalCharged: number;
  totalPaid: number;
  /** Charged to date less paid; future installments are not yet charged. */
  balance: number;
  /** Everything still owed under the contract, future installments included. */
  outstandingBalance: number;
}

export interface BuyerLandPurchaseListParams {
  page?: number;
  pageSize?: number;
  status?: LandPurchaseStatus;
}

export const LAND_PLOT_STATUS_LABELS: Record<LandPlotStatus, string> = {
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  UNDER_INSTALLMENT: 'Under installment',
  SOLD: 'Sold',
  ALLOCATED: 'Allocated',
  WITHHELD: 'Withheld',
};

export const LAND_RESERVATION_STATUS_LABELS: Record<LandReservationStatus, string> = {
  ACTIVE: 'Holding',
  CONVERTED: 'Purchase started',
  EXPIRED: 'Expired',
  CANCELLED: 'Released',
};

export const LAND_PURCHASE_STATUS_LABELS: Record<LandPurchaseStatus, string> = {
  PENDING_DEPOSIT: 'Awaiting deposit',
  ACTIVE: 'Paying installments',
  PAID_IN_FULL: 'Paid in full',
  COMPLETED: 'Completed',
  DEFAULTED: 'In default',
  REVOKED: 'Revoked',
  CANCELLED: 'Cancelled',
};

export const LAND_INSTALLMENT_STATUS_LABELS: Record<LandInstallmentStatus, string> = {
  PENDING: 'Upcoming',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  WAIVED: 'Waived',
};

export const LAND_MILESTONE_STATUS_LABELS: Record<LandMilestoneStatus, string> = {
  PENDING: 'Not yet delivered',
  DELIVERED: 'Awaiting your confirmation',
  CONFIRMED: 'Confirmed',
  DISPUTED: 'Disputed',
  WAIVED: 'Waived',
};

export const LAND_SALE_DOCUMENT_LABELS: Record<LandSaleDocumentKind, string> = {
  'contract-of-sale': 'Contract of sale',
  'allocation-letter': 'Letter of allocation',
};
