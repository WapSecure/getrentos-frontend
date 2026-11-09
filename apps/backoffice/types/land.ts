import type { EvidenceItem } from '@/types/admin';

export type LandDiligenceStatus =
  | 'NOT_STARTED'
  | 'IN_REVIEW'
  | 'ACTION_REQUIRED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONDITIONAL'
  | 'SUSPENDED';

export interface AdminLandDiligenceCondition {
  id: string;
  text: string;
  dueAt?: string;
  status: 'OPEN' | 'MET' | 'WAIVED';
  hasEvidence?: boolean;
  evidenceDocumentId?: string;
  evidenceNote?: string;
  evidenceAt?: string;
  decidedAt?: string;
  decidedByName?: string;
  decisionNote?: string;
}

export interface AdminLandDiligenceSuspension {
  at: string;
  reason: string;
  bySystem: boolean;
  from?: LandDiligenceStatus;
}

export type LandAssuranceTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

// Title number, survey number and registry authority are private: the API returns them only to back-office callers.
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

export interface LandDiligenceChecklistItem {
  key: string;
  label: string;
  status: LandDiligenceChecklistStatus;
  note?: string;
}

export interface LandDiligenceCheck {
  key: string;
  label: string;
  required: boolean;
  // PASSED needs a document cited against this key first.
  requiresDocument: boolean;
  status: LandDiligenceChecklistStatus;
  note?: string;
  decidedByName?: string;
  decidedAt?: string;
  hasEvidence: boolean;
}

export interface LandDiligenceReviewSummary {
  status: LandDiligenceStatus | string;
  checks?: LandDiligenceCheck[];
  submittedAt?: string | null;
  slaDueAt?: string | null;
  overdue?: boolean;
  assignedToId?: string | null;
  assignedToName?: string | null;
  // Send back as expectedVersion on every decision; a stale one is refused with 409.
  version?: number;
  // A different reviewer must give the second approval.
  awaitingSecondApproval?: boolean;
  firstApprovedByName?: string | null;
  // 0-100, higher is riskier.
  riskScore?: number | null;
  assuranceTier?: LandAssuranceTier | string | null;
  templateVersion?: string | null;
  policyPack?: LandPolicyPack | null;
  findings?: string | null;
  // Deliberately has no file URLs.
  checklist?: LandDiligenceChecklistItem[] | null;
  reviewedAt?: string | null;
  expiresAt?: string | null;
  reviewedByName?: string | null;
  conditions?: AdminLandDiligenceCondition[];
  suspension?: AdminLandDiligenceSuspension;
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
  blockingConflicts?: number;
  parcel: LandParcelReviewSummary;
  diligence: LandDiligenceReviewSummary;
}

export interface LandDiligenceDecisionInput {
  // Required for reject and clarification requests.
  reason?: string;
  findings?: string;
  // Checklist facts only; never document links or file paths.
  checklist?: LandDiligenceChecklistItem[];
  expiresAt?: string;
  expectedVersion?: number;
  conditions?: { text: string; dueAt?: string }[];
}

export interface LandDiligenceCheckInput {
  status: LandDiligenceChecklistStatus;
  note?: string;
  expectedVersion?: number;
}

export interface LandDiligenceDocumentLink {
  linkedByName: string;
  linkedAt: string;
  checklistKey?: string | null;
  note?: string | null;
}

export interface LandDiligenceDocument extends EvidenceItem {
  documentType: string;
  links: LandDiligenceDocumentLink[];
  /** @deprecated The first of `links`. */
  link?: LandDiligenceDocumentLink | null;
}

// '' is a citation tied to no check.
export const citedKeysOf = (document: LandDiligenceDocument): string[] =>
  (document.links ?? (document.link ? [document.link] : [])).map((link) => link.checklistKey ?? '');

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
  // Naira.
  askingPrice?: number;
  requiresDualApproval?: boolean;
  approvalBlockers?: string[];
  documents: LandDiligenceDocument[];
}

export interface LandDiligenceDocumentLinkInput {
  documentId: string;
  checklistKey?: string;
  note?: string;
}

// Must match LAND_DOCUMENT_TYPES in the API's land-document.dto.ts.
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

export interface LandDocumentUploadInput {
  documentType: LandDocumentType;
  file: File;
}

export interface LandUploadedDocument extends EvidenceItem {
  documentType: string;
  canDelete: boolean;
}

export type LandConflictKind = 'TITLE_NUMBER' | 'SURVEY_NUMBER' | 'BOUNDARY_OVERLAP';
export type LandConflictStatus = 'OPEN' | 'DISMISSED' | 'CONFIRMED';

export interface LandConflict {
  id: string;
  kind: LandConflictKind | string;
  status: LandConflictStatus | string;
  // 0-1.
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
  verified?: boolean;
}

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

export type LandRiskBand = 'LOW' | 'MODERATE' | 'HIGH';

export interface LandRiskAssessment {
  propertyId: string;
  score: number;
  band: LandRiskBand;
  // Negative points reduce the 0-100 score.
  factors: { factor: string; points: number }[];
  // Null until diligence is VERIFIED and in date.
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
  // May lag a just-changed input.
  stored: { riskScore: number | null; assuranceTier: LandAssuranceTier | null };
}

export interface LandPolicyPack {
  id: string;
  version: string;
  state: string;
  // DRAFT_PENDING_COUNSEL: not yet approved by counsel.
  status: 'DRAFT_PENDING_COUNSEL' | 'APPROVED' | string;
}
