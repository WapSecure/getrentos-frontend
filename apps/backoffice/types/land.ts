import type { EvidenceItem } from '@/types/admin';

/**
 * Administrative representation of a Land diligence case, kept separate from
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

export type LandAssuranceTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

/**
 * Parcel facts as staff see them. Title number, survey number and registry
 * authority are private: the API only returns them to back-office callers.
 */
export interface LandParcelReviewSummary {
  id?: string;
  plotNumber?: string | null;
  block?: string | null;
  estateName?: string | null;
  areaValue: number;
  areaUnit: string;
  frontage?: number | null;
  depth?: number | null;
  boundaryGeometry?: Record<string, unknown> | null;
  boundaryNotes?: string | null;
  zoning?: string | null;
  permittedUse?: string | null;
  terrain?: string | null;
  roadAccess?: boolean | null;
  utilities?: string[] | null;
  titleType?: string | null;
  titleNumber?: string | null;
  surveyNumber?: string | null;
  registryAuthority?: string | null;
  tenure?: string | null;
  encumbranceStatus?: string | null;
  subdivisionAllowed?: boolean;
  fractionalOwnershipAllowed?: boolean;
}

export type LandDiligenceChecklistStatus = 'PENDING' | 'PASSED' | 'FLAGGED' | 'NOT_APPLICABLE';

/** Legacy free-form checklist entry, still accepted on decisions. */
export interface LandDiligenceChecklistItem {
  key: string;
  label: string;
  status: LandDiligenceChecklistStatus;
  note?: string;
}

/** One structured check on the case, decided individually via PUT checks/:key. */
export interface LandDiligenceCheck {
  key: string;
  label: string;
  required: boolean;
  /** PASSED needs a document cited against this key first. */
  requiresDocument: boolean;
  status: LandDiligenceChecklistStatus;
  note?: string;
  decidedByName?: string;
  decidedAt?: string;
  /** A document has been cited against this check. */
  hasEvidence: boolean;
}

export interface LandDiligenceReviewSummary {
  status: LandDiligenceStatus | string;
  checks?: LandDiligenceCheck[];
  submittedAt?: string | null;
  /** When the review is owed by. */
  slaDueAt?: string | null;
  overdue?: boolean;
  assignedToId?: string | null;
  assignedToName?: string | null;
  /** Send back as `expectedVersion` on every decision; a stale one is refused with 409. */
  version?: number;
  /** First of two approvals given; a different reviewer must give the second. */
  awaitingSecondApproval?: boolean;
  firstApprovedByName?: string | null;
  /** 0-100, higher is riskier. */
  riskScore?: number | null;
  assuranceTier?: LandAssuranceTier | string | null;
  /** Checklist version the case was seeded from, e.g. `ng-2026.10+ng-lagos-2026.10-draft`. */
  templateVersion?: string | null;
  /** The state policy pack behind the checklist, when one applied. */
  policyPack?: LandPolicyPack | null;
  findings?: string | null;
  /** A structured, server-sanitised checklist. It deliberately has no file URLs. */
  checklist?: LandDiligenceChecklistItem[] | null;
  reviewedAt?: string | null;
  expiresAt?: string | null;
  reviewedByName?: string | null;
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
  isPropertyVerified?: boolean;
  ownershipProofCount: number;
  /** Open or confirmed duplicate-title / overlap conflicts. */
  blockingConflicts?: number;
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
  /** The case version the reviewer decided on. */
  expectedVersion?: number;
}

export interface LandDiligenceCheckInput {
  status: LandDiligenceChecklistStatus;
  note?: string;
  expectedVersion?: number;
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
  /** Every check the review cites this document on; one title deed can back several. */
  links: LandDiligenceDocumentLink[];
  /** @deprecated The first of `links`. */
  link?: LandDiligenceDocumentLink | null;
}

/** The checks a document is already cited on, with '' for a citation tied to no check. */
export const citedKeysOf = (document: LandDiligenceDocument): string[] =>
  (document.links ?? (document.link ? [document.link] : [])).map((link) => link.checklistKey ?? '');

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
  isPropertyVerified?: boolean;
  blockingConflicts?: number;
  activeEncumbrances?: number;
  /** Highest live sale asking price, naira. */
  askingPrice?: number;
  /** Approval needs two different reviewers (high-value parcel). */
  requiresDualApproval?: boolean;
  /** Why the case cannot be approved yet; empty when it can. */
  approvalBlockers?: string[];
  documents: LandDiligenceDocument[];
}

export interface LandDiligenceDocumentLinkInput {
  documentId: string;
  /** Ties the document to a check in the review checklist. */
  checklistKey?: string;
  note?: string;
}

/** What a land document claims to be (LAND_DOCUMENT_TYPES in the API's land-document.dto.ts). */
export const LAND_DOCUMENT_TYPES = [
  'CERTIFICATE_OF_OCCUPANCY',
  'GOVERNORS_CONSENT',
  'DEED_OF_ASSIGNMENT',
  'REGISTERED_CONVEYANCE',
  'SURVEY_PLAN',
  'EXCISION_GAZETTE',
  'ALLOCATION_LETTER',
  'LAYOUT_PLAN',
  'REGISTRY_SEARCH_REPORT',
  'CHARTING_REPORT',
  'LITIGATION_SEARCH_REPORT',
  'SITE_INSPECTION_REPORT',
  'VALUATION_REPORT',
  'CONTRACT_OF_SALE',
  'POWER_OF_ATTORNEY',
  'RECEIPT',
  'PHOTO',
  'OTHER',
  // What a seller's authority to sell rests on.
  'LETTERS_OF_ADMINISTRATION',
  'PROBATE',
  'COURT_ORDER',
  'BOARD_RESOLUTION',
  'DEVELOPMENT_AGREEMENT',
  'FAMILY_RESOLUTION',
  'COMMUNITY_RESOLUTION',
  'CONSENT_LETTER',
  'LEGAL_INQUIRY_REPORT',
] as const;
export type LandDocumentType = (typeof LAND_DOCUMENT_TYPES)[number];

/** Staff evidence put on the property, e.g. a registry search report, to cite. */
export interface LandDocumentUploadInput {
  documentType: LandDocumentType;
  file: File;
}

/** The uploaded document as the API returns it (LandDocumentDto). */
export interface LandUploadedDocument extends EvidenceItem {
  documentType: string;
  canDelete: boolean;
}

// ─── Integrity: conflicts, encumbrances, chain of title ────────────────────

export type LandConflictKind = 'TITLE_NUMBER' | 'SURVEY_NUMBER' | 'BOUNDARY_OVERLAP';
export type LandConflictStatus = 'OPEN' | 'DISMISSED' | 'CONFIRMED';

export interface LandConflict {
  id: string;
  kind: LandConflictKind | string;
  status: LandConflictStatus | string;
  /** Share of the parcel the other covers, 0-1. */
  overlapRatio?: number;
  conflictingPropertyId: string;
  conflictingPropertyTitle: string;
  conflictingLocation: string;
  conflictingPlotNumber?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  detectedAt: string;
}

export interface ResolveLandConflictInput {
  decision: 'DISMISS' | 'CONFIRM';
  note: string;
}

export const LAND_ENCUMBRANCE_KINDS = [
  'CAVEAT',
  'MORTGAGE',
  'LITIGATION',
  'GOVERNMENT_ACQUISITION',
  'LIEN',
  'RIGHT_OF_WAY',
  'OTHER',
] as const;
export type LandEncumbranceKind = (typeof LAND_ENCUMBRANCE_KINDS)[number];

export interface LandEncumbrance {
  id: string;
  kind: LandEncumbranceKind | string;
  status: 'ACTIVE' | 'DISCHARGED' | string;
  reference?: string;
  holder?: string;
  description?: string;
  source?: string;
  notedAt: string;
  dischargedAt?: string;
  dischargeNote?: string;
  documentId?: string;
  recordedByName: string;
}

export interface RecordLandEncumbranceInput {
  kind: LandEncumbranceKind;
  reference?: string;
  holder?: string;
  description?: string;
  source?: string;
  notedAt?: string;
  documentId?: string;
}

export interface DischargeLandEncumbranceInput {
  note: string;
  dischargedAt?: string;
}

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

export interface RecordLandTitleEventInput {
  kind: LandTitleEventKind;
  fromParty?: string;
  toParty?: string;
  instrumentReference?: string;
  occurredAt: string;
  registeredAt?: string;
  note?: string;
  documentId?: string;
  /** Reviewers only: record it already verified. */
  verified?: boolean;
}

// ─── Outside reviewers ──────────────────────────────────────────────────────

export const LAND_REVIEWER_ROLES = ['SURVEYOR', 'LAWYER', 'VALUER', 'INSPECTOR'] as const;
export type LandReviewerRole = (typeof LAND_REVIEWER_ROLES)[number];

export interface LandReviewerSeat {
  id: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  role: LandReviewerRole | string;
  checkKeys: string[];
  status: 'ACTIVE' | 'COMPLETED' | 'REVOKED' | string;
  invitedByName: string;
  dueAt: string | null;
  report: string | null;
  completedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface InviteLandReviewerInput {
  userId: string;
  role: LandReviewerRole;
  checkKeys: string[];
  dueAt?: string;
}

// ─── Risk ───────────────────────────────────────────────────────────────────

export type LandRiskBand = 'LOW' | 'MODERATE' | 'HIGH';

export interface LandRiskAssessment {
  propertyId: string;
  score: number;
  band: LandRiskBand;
  /** Points each factor adds to the 0-100 score; negative points reduce it. */
  factors: { factor: string; points: number }[];
  /** Null until diligence is VERIFIED and in date. */
  assuranceTier: LandAssuranceTier | null;
  inputs: {
    diligenceStatus: string;
    titleType: string | null;
    hasBoundary: boolean;
    openConflicts: number;
    activeEncumbrances: number;
    completedExternalReviews: number;
    checks: { total: number; passed: number; flagged: number; pending: number };
    expiresAt: string | null;
  };
  /** What is currently stored on the case, which may lag a just-changed input. */
  stored: { riskScore: number | null; assuranceTier: LandAssuranceTier | null };
}

/** A state's adjustments to the national checklist (blueprint §4.3). */
export interface LandPolicyPack {
  id: string;
  version: string;
  state: string;
  /** DRAFT_PENDING_COUNSEL: the state's rules are not yet approved by counsel. */
  status: 'DRAFT_PENDING_COUNSEL' | 'APPROVED' | string;
}
