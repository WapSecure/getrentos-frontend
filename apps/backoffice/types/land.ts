/**
 * Administrative representation of a Land v1 diligence case. This is kept
 * separate from the public land catalogue types: reviewers never receive a
 * document storage path or a signed download URL in this workflow.
 */
export type LandDiligenceStatus =
  | 'NOT_STARTED'
  | 'IN_REVIEW'
  | 'ACTION_REQUIRED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

export interface LandParcelReviewSummary {
  plotNumber?: string | null;
  estateName?: string | null;
  areaValue: number;
  areaUnit: string;
  titleType?: string | null;
  surveyNumber?: string | null;
}

export interface LandDiligenceReviewSummary {
  status: LandDiligenceStatus | string;
  findings?: string | null;
  /** A structured, server-sanitised checklist. It deliberately has no file URLs. */
  checklist?: LandDiligenceChecklistItem[] | null;
  reviewedAt?: string | null;
  expiresAt?: string | null;
  reviewedByName?: string | null;
}

export type LandDiligenceChecklistStatus = 'PENDING' | 'PASSED' | 'FLAGGED' | 'NOT_APPLICABLE';

export interface LandDiligenceChecklistItem {
  key: string;
  label: string;
  status: LandDiligenceChecklistStatus;
  note?: string;
}

export interface LandDiligenceRecord {
  propertyId: string;
  propertyTitle: string;
  ownerId: string;
  ownerName: string;
  city?: string | null;
  state?: string | null;
  createdAt: string;
  propertyVerificationStatus: string;
  ownershipProofCount: number;
  parcel: LandParcelReviewSummary;
  diligence: LandDiligenceReviewSummary;
}

export interface LandDiligenceDecisionInput {
  /** Required for reject and clarification requests. */
  reason?: string;
  /** Optional reviewer context recorded alongside an approval. */
  findings?: string;
  /** Checklist facts only; never document links or file paths. */
  checklist?: LandDiligenceChecklistItem[];
  /** ISO date for an approval expiry. */
  expiresAt?: string;
}
