import type { EvidenceItem } from '@/types/admin';

/**
 * Administrative representation of a Land v1 diligence case, kept separate from
 * the public land catalogue types. The queue carries metadata only; the detail
 * view adds the property's documents, each opened through a short-lived signed
 * URL, so a reviewer never handles a storage path.
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

/** Records that a check was decided on a particular document. */
export interface LandDiligenceDocumentLink {
  linkedByName: string;
  linkedAt: string;
  /** The checklist entry this document answers, when the reviewer tied them. */
  checklistKey?: string | null;
  /** Reviewer's note about why this document was cited. */
  note?: string | null;
}

/**
 * One document on the property, with the state of its link to the review.
 *
 * The file half is the shared evidence shape, so a document looks the same here
 * as evidence does on any other case: opened through a short-lived signed URL.
 */
export interface LandDiligenceDocument extends EvidenceItem {
  /** What the document claims to be, e.g. `SURVEY_PLAN`. */
  documentType: string;
  /** Set only when the review cites this document. */
  link?: LandDiligenceDocumentLink | null;
}

/**
 * A diligence case with every document on the property, so a reviewer can cite
 * one without leaving the case to go and find it.
 */
export interface AdminLandDiligenceDetail {
  propertyId: string;
  propertyTitle: string;
  city: string;
  state: string;
  ownerName?: string | null;
  parcel: LandParcelReviewSummary;
  diligence: LandDiligenceReviewSummary;
  documents: LandDiligenceDocument[];
}

export interface LandDiligenceDocumentLinkInput {
  documentId: string;
  /** Ties the document to a check in the review checklist. */
  checklistKey?: string;
  note?: string;
}
