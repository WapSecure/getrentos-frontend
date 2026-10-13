/**
 * Developer estate inventory, plot sales and conveyance, as the owner API
 * returns them (src/modules/land/dto/land-sales-response.dto.ts,
 * land-insights.dto.ts, land-integrity-response.dto.ts).
 *
 * Money is whole naira as a JS number; rates are basis points (1% = 100).
 */
import type { LandAreaUnit, LandAssuranceTier, LandDiligenceStatus, LandTitleType } from './land';

// ─── Layout, plots, plans ────────────────────────────────────────────────────

export type LandLayoutStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export const LAND_PLOT_STATUSES = [
  'AVAILABLE',
  'RESERVED',
  'UNDER_INSTALLMENT',
  'SOLD',
  'ALLOCATED',
  'WITHHELD',
] as const;
export type LandPlotStatus = (typeof LAND_PLOT_STATUSES)[number];

export interface LandLayoutFees {
  documentationFee: number;
  surveyFee: number;
  developmentLevy: number;
  total: number;
}

export interface LandPaymentPlanTerms {
  /** 0 is an outright purchase. */
  durationMonths: number;
  initialDepositBps: number;
  priceUpliftBps: number;
  gracePeriodDays: number;
  lateFeeBps: number;
  defaultAfterDays: number;
  revocationChargeBps: number;
}

export interface LandPaymentPlan extends LandPaymentPlanTerms {
  id: string;
  name: string;
  active: boolean;
}

export interface LandLayout {
  id: string;
  propertyId: string;
  parcelId: string;
  name: string;
  description?: string;
  status: LandLayoutStatus;
  layoutApprovalReference?: string;
  layoutPlanDocumentId?: string;
  reservationHoldHours: number;
  fees: LandLayoutFees;
  publishedAt?: string;
  closedAt?: string;
  createdAt: string;
}

export interface OwnerLandLayout extends LandLayout {
  paymentPlans: LandPaymentPlan[];
  /** Plot count by status. */
  plotCounts: Partial<Record<LandPlotStatus, number>>;
}

export interface LandPlot {
  id: string;
  layoutId: string;
  plotNumber: string;
  block?: string;
  areaValue: number;
  areaUnit: LandAreaUnit;
  areaSqm: number;
  boundaryGeometry?: unknown;
  isCorner: boolean;
  tags: string[];
  price: number;
  pricePerSqm?: number;
  status: LandPlotStatus;
  heldUntil?: string;
}

export interface LandInventoryDashboard {
  layoutId: string;
  status: LandLayoutStatus;
  counts: Partial<Record<LandPlotStatus, number>>;
  totalPlots: number;
  totalValue: number;
  availableValue: number;
  soldValue: number;
  sellThroughPercent: number;
  purchases: {
    live: number;
    collected: number;
    outstanding: number;
    overdueAmount: number;
    defaulted: number;
  };
}

export interface LandPlotImportResult {
  created: number;
  plots: LandPlot[];
}

/** One rejected row of a bulk import; `index` is zero-based in the submitted array. */
export interface LandPlotImportRowError {
  index: number;
  plotNumber?: string;
  errors: string[];
}

// ─── Requests ────────────────────────────────────────────────────────────────

export interface LandLayoutInput {
  name: string;
  description?: string | null;
  layoutApprovalReference?: string | null;
  layoutPlanDocumentId?: string | null;
  reservationHoldHours?: number;
  documentationFee?: number;
  surveyFee?: number;
  developmentLevy?: number;
}

export interface LandPlotInput {
  plotNumber: string;
  block?: string;
  areaValue: number;
  areaUnit: LandAreaUnit;
  price: number;
  isCorner?: boolean;
  tags?: string[];
}

/** Commercial changes only: identity and area are fixed once a plot exists. */
export interface LandPlotUpdateInput {
  price?: number;
  tags?: string[];
  isCorner?: boolean;
}

export interface LandPaymentPlanInput extends LandPaymentPlanTerms {
  name: string;
}

export type LandPaymentPlanUpdateInput = Partial<LandPaymentPlanInput> & { active?: boolean };

export interface LandMilestoneDeliverInput {
  documentId?: string;
  note?: string;
}

// ─── Purchases ───────────────────────────────────────────────────────────────

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

export type LandMilestoneStatus = 'PENDING' | 'DELIVERED' | 'CONFIRMED' | 'DISPUTED' | 'WAIVED';

export interface LandMilestone {
  id: string;
  key: string;
  label: string;
  sequence: number;
  required: boolean;
  releaseBps: number;
  status: LandMilestoneStatus;
  deliveredAt?: string;
  documentId?: string;
  note?: string;
  confirmedAt?: string;
  disputeReason?: string;
}

export interface LandNextDue {
  installmentId: string;
  sequence: number;
  label: string;
  dueDate: string;
  amount: number;
  overdue: boolean;
}

export interface LandPurchaseSummary {
  id: string;
  reference: string;
  status: LandPurchaseStatus;
  layoutId: string;
  layoutName: string;
  /** The master land property the estate sits on. */
  propertyId?: string;
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
  outstandingBalance: number;
  refundDue?: number;
  nextDue?: LandNextDue;
  startedAt?: string;
  paidInFullAt?: string;
  completedAt?: string;
  defaultedAt?: string;
  revokedAt?: string;
  cancelledAt?: string;
  createdAt: string;
}

export type LandInstallmentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'WAIVED';

export interface LandInstallment {
  id: string;
  sequence: number;
  label: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  lateFee: number;
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

export interface LandPurchaseDetail extends LandPurchaseSummary {
  terms: LandPaymentPlanTerms;
  feeBreakdown: LandLayoutFees;
  revocationReason?: string;
  installments: LandInstallment[];
  payments: LandPurchasePayment[];
  milestones: LandMilestone[];
  releases: LandEscrowRelease[];
}

export interface LandCollectionsSummary {
  purchaseCount: number;
  activeCount: number;
  defaultedCount: number;
  collected: number;
  releasedToSeller: number;
  heldInEscrow: number;
  outstanding: number;
  overdueAmount: number;
  overdueInstallments: number;
}

export type LandSaleDocumentKind = 'contract-of-sale' | 'allocation-letter';

export interface SellerLandPurchaseListParams {
  page?: number;
  pageSize?: number;
  status?: LandPurchaseStatus;
  layoutId?: string;
  /** Purchase reference, exact plot number or buyer name. */
  search?: string;
}

// ─── Insights ────────────────────────────────────────────────────────────────

export interface LandRiskAssessment {
  propertyId: string;
  score: number;
  band: 'LOW' | 'MODERATE' | 'HIGH';
  factors: { factor: string; points: number }[];
  assuranceTier: LandAssuranceTier | null;
  inputs: {
    diligenceStatus: LandDiligenceStatus;
    titleType: LandTitleType | null;
    hasBoundary: boolean;
    openConflicts: number;
    activeEncumbrances: number;
    completedExternalReviews: number;
    checks: { total: number; passed: number; flagged: number; pending: number };
    expiresAt: string | null;
  };
  stored: { riskScore: number | null; assuranceTier: LandAssuranceTier | null };
}

export interface LandListingAnalytics {
  listingId: string;
  status: string;
  askingPrice: number;
  publishedAt: string | null;
  daysOnMarket: number | null;
  views: number;
  saves: number;
  viewings: number;
  offersByStatus: Record<string, number>;
  totalOffers: number;
  latestOffer: {
    amount: number;
    status: string;
    createdAt: string;
    vsAskingPercent: number;
  } | null;
}

export interface LandSellerAnalytics {
  propertyId: string;
  areaSqm?: number;
  listings: LandListingAnalytics[];
  market: {
    area: string;
    scope: 'CITY' | 'STATE';
    sampleSize: number;
    subjectPricePerSqm?: number;
    marketMedianPricePerSqm?: number;
    percentile?: number;
    pricingHint?: string;
  } | null;
}

// ─── Chain of title ──────────────────────────────────────────────────────────

export const LAND_TITLE_EVENT_KINDS = [
  'ORIGINAL_GRANT',
  'EXCISION',
  'ALLOCATION',
  'ASSIGNMENT',
  'GOVERNORS_CONSENT',
  'CERTIFICATE_OF_OCCUPANCY',
  'RATIFICATION',
  'SUBDIVISION',
  'MORTGAGE_REGISTERED',
  'OTHER',
] as const;
export type LandTitleEventKind = (typeof LAND_TITLE_EVENT_KINDS)[number];

export interface LandTitleEvent {
  id: string;
  kind: LandTitleEventKind | string;
  fromParty?: string;
  toParty?: string;
  instrumentReference?: string;
  occurredAt: string;
  registeredAt?: string;
  note?: string;
  documentId?: string;
  recordedByName: string;
  verified: boolean;
  verifiedAt?: string;
}

export interface LandTitleEventInput {
  kind: LandTitleEventKind;
  fromParty?: string;
  toParty?: string;
  instrumentReference?: string;
  /** ISO 8601. */
  occurredAt: string;
  registeredAt?: string;
  note?: string;
  documentId?: string;
}

// ─── My layouts ──────────────────────────────────────────────────────────────

export interface LandPlotCounts {
  total: number;
  available: number;
  reserved: number;
  underInstallment: number;
  sold: number;
  allocated: number;
  withheld: number;
}

/** One estate layout the caller can sell from (GET owner/land/layouts). */
export interface OwnerLandLayoutSummary {
  id: string;
  name: string;
  status: LandLayoutStatus;
  propertyId: string;
  propertyTitle: string;
  city: string;
  state: string;
  /** Owned outright, or reached through a listing mandate. */
  access: 'OWNER' | 'MANDATE';
  plots: LandPlotCounts;
  publishedAt?: string;
  createdAt: string;
}

/** The land resale a seller is conveying. */
export interface LandResaleSummary {
  transactionId: string;
  propertyId: string;
  propertyTitle: string;
  buyerName: string;
  /** Sale price, naira. */
  amount: number;
  escrowStatus: string;
  createdAt: string;
}
