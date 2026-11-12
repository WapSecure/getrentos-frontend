// Sureground Managed (Diaspora M4: DIA-20, DIA-21, DIA-22). Every M4 shape the API returns lives
// here, so a change on the backend is one edit.

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
