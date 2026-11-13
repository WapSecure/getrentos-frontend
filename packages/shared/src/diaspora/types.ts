// Sureground Diaspora Invest: the shapes the investor, purchase and Managed endpoints return, shared
// by web and mobile. Pure data: no framework, no service. Sureground holds only deposits (D11).

// ── Attention queue ──────────────────────────────────────────────────────────

export interface AttentionItem {
  key: string;
  severity: 'urgent' | 'soon' | 'info';
  title: string;
  detail?: string;
  link: { path: string; label: string };
}

// ── Purchases: three separate statuses (DIA-15, DIA-16) ──────────────────────

export const OPERATIONAL_STAGES = [
  'INTERESTED',
  'OFFER_ACCEPTED',
  'RESERVED',
  'DILIGENCE_IN_PROGRESS',
  'FINDINGS_SHARED',
  'CONTRACT_PREPARED',
  'COMPLETING',
  'HANDED_OVER',
  'PAUSED',
  'CANCELLED',
] as const;
export type OperationalStageCode = (typeof OPERATIONAL_STAGES)[number];

export const MONEY_STATUSES = [
  'NOT_DUE',
  'REQUESTED',
  'PROTECTED',
  'RELEASE_REQUESTED',
  'RELEASED',
  'PAID_OUT',
  'REFUNDED',
  'FROZEN',
] as const;
export type MoneyStatusCode = (typeof MONEY_STATUSES)[number];

export const LEGAL_STATUSES = [
  'NOT_STARTED',
  'CONTRACT_SIGNED',
  'CONSENT_APPLIED',
  'CONSENT_GRANTED',
  'REGISTERED',
  'PERFECTED',
] as const;
export type LegalStatusCode = (typeof LEGAL_STATUSES)[number];

export interface OperationalStage {
  code: OperationalStageCode;
  label: string;
}

export interface MoneyStatus {
  code: MoneyStatusCode;
  label: string;
  /** Only the deposit held under Payment Protection is covered. */
  covers: 'DEPOSIT';
  note: string;
}

export interface LegalStatus {
  code: LegalStatusCode;
  label: string;
}

/** Kept separate: a released deposit never reads as legal completion. */
export interface AcquisitionStatuses {
  operationalStage: OperationalStage;
  moneyStatus: MoneyStatus;
  legalStatus: LegalStatus;
}

export interface NextAction {
  label: string;
  waitingForYou: boolean;
}

export type WorkspaceViewerRole = 'BUYER' | 'SELLER' | 'REPRESENTATIVE';

export interface WorkspaceDocument {
  id: string;
  documentType: string;
  linkedTo: 'MILESTONE' | 'CONDITION' | 'LEGAL_STEP';
  /** The milestone, condition or legal step key. */
  key: string;
  uploadedAt: string;
}

/** The outcome of the buyer's deposit release (`POST buyer/transactions/:id/release`). */
export interface DepositReleaseOutcome {
  state: 'RELEASED' | 'WAITING_FOR_CO_APPROVAL';
  waitingFor?: 'REPRESENTATIVE' | 'BUYER';
  message?: string;
}

export interface CoApprovalPendingStep {
  milestoneKey: string;
  /** This approval also releases the held deposit (a built home's handover). */
  releasesDeposit?: boolean;
  /**
   * The seller has delivered the step. A handover cannot be approved before it is delivered; false
   * means not yet. Missing on older responses.
   */
  stepDelivered?: boolean;
  buyerApproved: boolean;
  representativeApproved: boolean;
}

/** What a representative's second approval to a deposit release did. */
export type DepositReleaseApprovalOutcome =
  | 'APPROVED'
  | 'WAITING_FOR_BUYER'
  | 'WAITING_FOR_REPRESENTATIVE';

/**
 * The active dispute on a purchase (`PurchaseDisputeSummaryDto`): the deposit dispute, else a live
 * land case on the plot. `respondBy` is the deadline staff work to, null while staff are already
 * on it; the only turn the model records is Sureground's.
 */
export interface PurchaseDispute {
  id: string;
  kind: 'DEPOSIT' | 'LAND';
  status: string;
  respondBy: string | null;
  respondByParty: 'SUREGROUND' | null;
}

/** One purchase on the investor overview, from the same functions as the workspace. */
export interface PurchaseSummary {
  transactionId: string;
  title: string;
  propertyType: string;
  role: 'BUYER' | 'REPRESENTATIVE';
  /** Set when I see this purchase as someone's representative. */
  representing?: { principalId: string; principalName: string };
  operationalStage: OperationalStage;
  moneyStatus: MoneyStatus;
  legalStatus: LegalStatus;
  nextAction: string | null;
  /** Something is waiting for me, including a two-person approval. */
  waitingForYou: boolean;
  /** Two-person approvals waiting for me on this purchase. */
  pendingApprovals: number;
  /** The active dispute; not set for purchases seen as a representative. */
  dispute?: PurchaseDispute | null;
}

// ── Investor profile and overview ────────────────────────────────────────────

export const DISPLAY_CURRENCIES = ['NGN', 'GBP', 'USD', 'EUR', 'CAD'] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

export const INTENDED_USES = ['HOME', 'RENTAL_INCOME', 'APPRECIATION', 'DEVELOPMENT'] as const;
export type IntendedUse = (typeof INTENDED_USES)[number];

export const INVESTOR_PROPERTY_TYPES = ['HOUSE', 'FLAT', 'LAND', 'COMMERCIAL'] as const;
export type InvestorPropertyType = (typeof INVESTOR_PROPERTY_TYPES)[number];

export const BUDGET_BANDS = [
  'UNDER_50M',
  'FROM_50M_TO_150M',
  'FROM_150M_TO_500M',
  'OVER_500M',
] as const;
export type BudgetBand = (typeof BUDGET_BANDS)[number];

export const INVESTMENT_HORIZONS = [
  'UNDER_2_YEARS',
  'TWO_TO_5_YEARS',
  'FIVE_TO_10_YEARS',
  'OVER_10_YEARS',
] as const;
export type InvestmentHorizon = (typeof INVESTMENT_HORIZONS)[number];

export const OWNERSHIP_STRUCTURES = ['INDIVIDUAL', 'JOINT', 'COMPANY'] as const;
export type OwnershipStructure = (typeof OWNERSHIP_STRUCTURES)[number];

/** DIA-32: a summary at 08:00 in the investor's own zone, Monday (weekly) or the 1st (monthly). */
export const SUMMARY_FREQUENCIES = ['NONE', 'WEEKLY', 'MONTHLY'] as const;
export type SummaryFrequency = (typeof SUMMARY_FREQUENCIES)[number];

/** Where the summary goes besides the notifications list, which always has it. */
export const SUMMARY_CHANNELS = ['EMAIL', 'PUSH'] as const;
export type SummaryChannel = (typeof SUMMARY_CHANNELS)[number];

/** PUT merges: send only the fields being saved. Country codes are upper-case alpha-2. */
export interface InvestorProfileInput {
  /** ISO 3166-1 alpha-2, e.g. GB. */
  countryOfResidence?: string;
  /** ISO 3166-1 alpha-2, e.g. NG. */
  nationality?: string;
  /** IANA zone spelt exactly as Intl names it, e.g. Europe/London. */
  timeZone?: string;
  displayCurrency?: DisplayCurrency;
  /** Non-empty, no repeats. */
  intendedUses?: IntendedUse[];
  /** Non-empty, no repeats. */
  propertyTypes?: InvestorPropertyType[];
  budgetBand?: BudgetBand;
  horizon?: InvestmentHorizon;
  ownershipStructure?: OwnershipStructure;
  summaryFrequency?: SummaryFrequency;
  /** May be empty: the summary then shows only in notifications. */
  summaryChannels?: SummaryChannel[];
}

export type InvestorProfileField =
  | 'countryOfResidence'
  | 'nationality'
  | 'timeZone'
  | 'intendedUses'
  | 'propertyTypes'
  | 'budgetBand'
  | 'horizon'
  | 'ownershipStructure';

/** Fields stay null until the investor fills them in. */
export interface InvestorProfile {
  countryOfResidence: string | null;
  nationality: string | null;
  timeZone: string | null;
  displayCurrency: DisplayCurrency;
  intendedUses: IntendedUse[];
  propertyTypes: InvestorPropertyType[];
  budgetBand: BudgetBand | null;
  horizon: InvestmentHorizon | null;
  ownershipStructure: OwnershipStructure | null;
  /** Older API builds leave these out: read as NONE and EMAIL. */
  summaryFrequency?: SummaryFrequency;
  summaryChannels?: SummaryChannel[];
  /** Required fields still empty. */
  missingFields: string[];
  /** Set once the profile is complete and the current risk statement is accepted. */
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RiskDeclaration {
  version: string;
  points: string[];
  accepted: boolean;
  acceptedAt: string | null;
}

export interface InvestorAvailability {
  enabled: boolean;
}

export interface InvestorStatusCounts {
  total: number;
  /** Every status, with 0 for the empty ones. */
  byStatus: Record<string, number>;
}

export interface InvestorStatementSummary {
  id: string;
  periodStart: string;
  periodEnd: string;
  issuedAt: string | null;
  /** Whole naira, as a string. */
  netAmount: string;
  payoutStatus: string;
}

/** Fields are optional on read: the workspace renders what arrives and skips the rest. */
export interface InvestorOverview {
  profile?: Pick<
    InvestorProfile,
    | 'countryOfResidence'
    | 'timeZone'
    | 'displayCurrency'
    | 'missingFields'
    | 'onboardingCompletedAt'
  > | null;
  riskDeclaration?: Pick<RiskDeclaration, 'version' | 'accepted' | 'acceptedAt'> | null;
  offers?: InvestorStatusCounts;
  /** Sale purchases through Payment Protection, by status (never shown as "escrow"). */
  protectedPurchases?: InvestorStatusCounts;
  landPurchases?: InvestorStatusCounts;
  activeManagedProperties?: number;
  pendingSpendApprovals?: { count: number; totalAmount: string };
  latestStatement?: InvestorStatementSummary | null;
  /** My purchases with their three statuses, then those I see as a representative. */
  purchases?: PurchaseSummary[];
  portfolio?: InvestorPortfolio;
}

/**
 * Portfolio figures from records Sureground holds; each is null when there is no record behind it.
 * There is no valuation: no method has been agreed.
 */
export interface InvestorPortfolio {
  properties: number | null;
  /** Whole naira, as a string: recorded prices of completed purchases. */
  acquisitionCost: string | null;
  /** Whole naira, as a string: income on issued statements over the last 12 months. */
  rentReceived12m: string | null;
  expenses12m: string | null;
  net12m: string | null;
  /** Percent, one decimal place: occupied units out of managed units. */
  occupancyRate: number | null;
  asOf: string;
}

// ── Identity abroad (decision D3) ────────────────────────────────────────────

export type ForeignCheckState = 'NOT_STARTED' | 'CHECKING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export type ForeignIneligibleReason = 'NO_INVESTOR_PROFILE' | 'NATIONALITY_NOT_YET_SUPPORTED';

export interface ForeignDocumentStatus {
  state: ForeignCheckState;
  /** End of the 2nd Lagos working day after the upload, while staff have it. */
  reviewDueAt: string | null;
}

export interface ForeignIdentityStatus {
  eligible: boolean;
  ineligibleReason?: ForeignIneligibleReason | string;
  passport: ForeignDocumentStatus & {
    automatedAttemptsUsed: number;
    freeAutomatedAttempts: number;
    /** The automatic Smile ID check, or an upload a person reviews. */
    nextAttempt: 'AUTOMATED' | 'STAFF_REVIEW';
    automatedCheckAvailable: boolean;
    sandbox: boolean;
  };
  address: ForeignDocumentStatus;
  bankStatement: ForeignDocumentStatus;
  /** DIA-07; absent from older API versions. */
  sourceOfFunds?: SourceOfFundsStatus;
}

// ── Source of funds (DIA-07, decision D4) ────────────────────────────────────

export type SourceOfFundsSupportingKind =
  | 'PAYSLIPS'
  | 'TAX_RETURN'
  | 'ASSET_SALE_CONTRACT'
  | 'INHERITANCE_OR_GIFT_LETTER'
  | 'BUSINESS_ACCOUNTS';

export interface SourceOfFundsStatus extends ForeignDocumentStatus {
  /** True once an existing commitment, or the running total, crosses a threshold. */
  required: boolean;
  reason: 'SINGLE_PURCHASE' | 'TOTAL_COMMITTED' | null;
  /** Whole naira already committed to purchases. */
  committedNaira: number;
  /** Whole naira: asked at or above `singlePurchaseNaira` for one purchase, or past `totalCommittedNaira` in total. */
  thresholds: { singlePurchaseNaira: number; totalCommittedNaira: number };
  /** The one line that says why we ask. */
  why: string;
  bankStatementMonths: number;
  supportingKinds: SourceOfFundsSupportingKind[];
  /** Why an earlier approval no longer counts: it ran out (12 months) or purchases outgrew it. */
  renewal?: SourceOfFundsRenewal | null;
  /** While an approval counts. */
  approvedAt?: string | null;
  validUntil?: string | null;
}

export type SourceOfFundsRenewal = 'EXPIRED' | 'COVERAGE_EXCEEDED';

/** `GET /trust/foreign-identity/source-of-funds/check?amount=`: asked before an offer or estate deposit. */
export interface SourceOfFundsCheck {
  applies: boolean;
  required: boolean;
  reason: SourceOfFundsStatus['reason'];
  state: ForeignCheckState;
  renewal: SourceOfFundsRenewal | null;
  /** False when the offer or deposit would be refused until source of funds is approved. */
  cleared: boolean;
}

export interface ForeignSubmission {
  verificationId: string;
  state: ForeignCheckState;
  reviewCaseId: string | null;
  reviewDueAt: string | null;
}

// ── Sureground Managed (DIA-20, DIA-21, DIA-22) ──────────────────────────────

/** Whole naira. Some reads send money as a string (from a bigint); `Number()` both. */
export type MoneyValue = number | string;

/** Spending limits on one management agreement. `null` means no limit for that band. */
export interface SpendBands {
  /** The manager spends up to this without asking. */
  routineCap: number | null;
  /** Urgent repairs (safety, water, power) the manager may spend up to before asking. */
  emergencyCap: number | null;
  /** Above this, approval needs the owner to confirm their identity again. */
  explicitAbove: number | null;
}

export const SPEND_BANDS = ['ROUTINE', 'OWNER', 'EXPLICIT', 'EMERGENCY'] as const;
export type SpendBand = (typeof SPEND_BANDS)[number];

/** EXPENSE posts an expense when approved; WORK_ORDER authorises a job the manager then carries out. */
export type SpendApprovalKind = 'EXPENSE' | 'WORK_ORDER';

/**
 * Work-order or quote approval above the routine limit: nothing is approved yet. Once the owner
 * approves, the manager repeats the same call.
 */
export interface AwaitingOwnerApproval {
  state: 'AWAITING_OWNER_APPROVAL';
  approvalId: string;
  band: SpendBand;
}

export const EVIDENCE_STAGE_KEYS = [
  'PROBLEM',
  'PHOTOS',
  'CONTRACTOR',
  'QUOTE',
  'APPROVAL',
  'COMPLETION',
  'INVOICE',
  'PAYMENT',
  'FEEDBACK',
] as const;
export type EvidenceStageKey = (typeof EVIDENCE_STAGE_KEYS)[number];
export type EvidenceStageStatus = 'DONE' | 'PENDING' | 'NOT_APPLICABLE' | 'FLAGGED';

/** How a stage reads on a timeline; the same states as the web and native timelines. */
export type EvidenceTimelineState = 'done' | 'current' | 'pending' | 'blocked' | 'skipped';

export type EvidenceActorRole = 'OWNER' | 'MANAGER' | 'FIELD_AGENT' | 'TENANT';

export interface EvidenceActor {
  name: string;
  role: EvidenceActorRole;
}

export interface EvidenceStage {
  key: EvidenceStageKey;
  label: string;
  status: EvidenceStageStatus;
  at?: string | null;
  by?: EvidenceActor | null;
  detail?: string | null;
  /**
   * By stage: PHOTOS holds `MaintenancePhoto`, QUOTE `EvidenceQuote`, APPROVAL `EvidenceApproval`,
   * INVOICE `EvidenceInvoice`. Other stages send none.
   */
  items?: unknown[] | null;
}

export const PHOTO_STAGES = ['REPORTED', 'PROGRESS', 'COMPLETION'] as const;
export type WorkOrderPhotoStage = (typeof PHOTO_STAGES)[number];

/** The `POST …/photos` response and a PHOTOS item. URLs are signed per read. */
export interface MaintenancePhoto {
  id: string;
  stage: WorkOrderPhotoStage;
  url: string;
  takenAt: string;
  uploadedAt: string;
  by: EvidenceActor | null;
  latitude: number | null;
  longitude: number | null;
  /** From the old images list: no stage, uploader or capture time of its own. */
  legacy: boolean;
}

/** A quote or invoice document (the shared evidence item). */
export interface EvidenceDocument {
  id: string;
  kind: 'STORED' | 'EXTERNAL';
  name: string;
  mimeType: string | null;
  url: string;
  note?: string | null;
  uploadedAt: string;
  uploadedBy?: { id: string; legalName?: string | null } | null;
}

export interface EvidenceQuote {
  id: string;
  vendor: string | null;
  amount: number;
  status: string;
  submittedAt: string;
  approvedAt: string | null;
  documents: EvidenceDocument[];
}

export interface EvidenceApproval {
  id: string;
  amount: number;
  band: SpendBand;
  kind: SpendApprovalKind;
  status: string;
  requestedAt: string;
  decidedAt: string | null;
  usedAt: string | null;
  decisionNote: string | null;
  requestedBy: EvidenceActor | null;
  decidedBy: EvidenceActor | null;
}

export interface DuplicateFlag {
  code: string;
  message: string;
}

export interface EvidenceInvoice {
  id: string;
  vendor: string;
  invoiceNumber: string | null;
  amount: number;
  status: string;
  payoutStatus: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  paidOutAt: string | null;
  duplicateFlags: DuplicateFlag[];
  documents: EvidenceDocument[];
}

export type EvidenceFlagCode = 'DUPLICATE_INVOICE' | 'VENDOR_CHANGED_AFTER_APPROVAL';

export interface WorkOrderEvidence {
  workOrderId: string;
  stages: EvidenceStage[];
  flags: { code: EvidenceFlagCode | (string & {}); message: string }[];
}

export interface WorkOrderFeedbackInput {
  /** 1 to 5. */
  rating: number;
  /** Up to 2000 characters. */
  comment?: string;
}

/** Owner only, once, after the job is RESOLVED. */
export interface WorkOrderFeedback {
  workOrderId: string;
  rating: number;
  comment: string | null;
  at: string;
}

/**
 * Body that lets an invoice through after the 409 `INVOICE_POSSIBLE_DUPLICATE`. An empty reason
 * is a 400. An acknowledgement at approval also covers paying it.
 */
export interface DuplicateAcknowledgement {
  acknowledgeDuplicate: true;
  reason: string;
}

export interface InvestorManagedProperty {
  propertyId: string;
  title: string;
  coverImageUrl?: string | null;
  mandate: {
    id: string;
    /** `MandateStatus`. */
    status: string;
    bands: SpendBands;
    /** Only for a percentage fee. */
    feePercent?: number | null;
    startedAt?: string | null;
  } | null;
  /** `ManagedIntakeStatus`. */
  intake: { id: string; status: string } | null;
  openJobs: number;
  pendingApprovals: number;
  /**
   * The owner's latest statement touching this property. Statements are per owner, so `net` is
   * the whole statement's net payout, not this property's income.
   */
  lastStatement: {
    id: string;
    periodStart: string;
    periodEnd: string;
    net: MoneyValue;
    status: 'DRAFT' | 'ISSUED' | (string & {});
  } | null;
}

export interface InvestorManagedPendingApproval {
  id: string;
  propertyId: string;
  /** The property's title. */
  title: string;
  amount: MoneyValue;
  band: SpendBand;
  requestedAt: string;
  maintenanceRequestId?: string | null;
}

export interface InvestorManaged {
  properties: InvestorManagedProperty[];
  pendingApprovals: InvestorManagedPendingApproval[];
  totals: { properties: number; openJobs: number; pendingApprovals: number };
}
