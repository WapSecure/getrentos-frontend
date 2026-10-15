export const LAND_DISPUTE_STATUSES = [
  'OPEN',
  'UNDER_INVESTIGATION',
  'RESOLVED',
  'APPEALED',
  'CLOSED',
] as const;
export type LandDisputeStatus = (typeof LAND_DISPUTE_STATUSES)[number];
export type LandDisputeOutcome = 'UPHELD' | 'DISMISSED';

export const LAND_DISPUTE_KIND_LABELS: Record<string, string> = {
  FRAUD: 'Fraud',
  COMPETING_CLAIM: 'Competing claim',
  BOUNDARY: 'Boundary',
  TITLE_DEFECT: 'Title defect',
  NON_DELIVERY: 'Non-delivery',
  PAYMENT: 'Payment',
  OTHER: 'Other',
};

export interface LandDisputeEvidence {
  id: string;
  fileName: string;
  mimeType?: string;
  sizeBytes: number;
  /** SHA-256 of the file as submitted. */
  fileHash: string;
  source: 'PARTY' | 'ADMIN';
  /** Signed for this request only. */
  url: string;
  uploadedByName?: string;
  note?: string;
  createdAt: string;
}

export interface LandDisputeEvent {
  id: string;
  action: string;
  note?: string;
  actorName?: string;
  visibleToParties: boolean;
  createdAt: string;
}

/** A land dispute as staff see it: reporter, every piece of evidence, staff notes. */
export interface AdminLandDispute {
  id: string;
  reference: string;
  propertyId: string;
  propertyTitle: string;
  purchaseId?: string;
  purchaseReference?: string;
  kind: string;
  priority: string;
  description: string;
  status: LandDisputeStatus;
  holdActive: boolean;
  holdReason?: string;
  heldAt?: string;
  heldByName?: string;
  holdSuggested: boolean;
  outcome?: LandDisputeOutcome;
  decision?: string;
  decidedAt?: string;
  decidedByName?: string;
  appealReason?: string;
  appealedAt?: string;
  appealOutcome?: LandDisputeOutcome;
  appealDecision?: string;
  appealDecidedAt?: string;
  raisedById: string;
  raisedByName: string;
  ownerName: string;
  assignedToId?: string;
  assignedToName?: string;
  evidence: LandDisputeEvidence[];
  events: LandDisputeEvent[];
  createdAt: string;
}
