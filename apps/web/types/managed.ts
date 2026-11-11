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

/** Work-order spend above the routine limit: no error, a request waiting for the owner. */
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

export interface EvidenceStage {
  key: EvidenceStageKey;
  label: string;
  status: EvidenceStageStatus;
  at?: string | null;
  by?: { name: string; role: string } | null;
  detail?: string | null;
  /** Photos or documents for the stage. Signed per read, so safe to render directly. */
  items?: EvidenceItem[] | null;
}

export interface EvidenceItem {
  id?: string;
  url: string;
  label?: string | null;
  takenAt?: string | null;
}

export interface WorkOrderEvidence {
  workOrderId: string;
  stages: EvidenceStage[];
  flags: { code: string; message: string }[];
}

export const PHOTO_STAGES = ['REPORTED', 'PROGRESS', 'COMPLETION'] as const;
export type WorkOrderPhotoStage = (typeof PHOTO_STAGES)[number];

export interface WorkOrderFeedbackInput {
  /** 1 to 5. */
  rating: number;
  comment?: string;
}

/** Body that lets an invoice through after the duplicate warning. */
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
    status: string;
    bands: SpendBands;
    feePercent?: number | null;
    startedAt?: string | null;
  } | null;
  intake: { id: string; status: string } | null;
  openJobs: number;
  pendingApprovals: number;
  lastStatement: {
    id: string;
    periodStart: string;
    periodEnd: string;
    net: MoneyValue;
    status: string;
  } | null;
}

export interface InvestorManagedPendingApproval {
  id: string;
  propertyId: string;
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
