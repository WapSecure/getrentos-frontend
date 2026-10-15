import type { LandDiligenceCheckStatus, LandTitleType } from '@/types/land';
import type { LandDocumentType } from '@/types/landDocument';

/**
 * The outside professional's desk (`/land/reviews`), mirroring the backend's
 * `land-reviewer.dto.ts`. A seat, not a role, grants access: any signed-in
 * account can call the endpoints, and the API refuses anything outside the
 * caller's own seat.
 */

export type LandReviewerRole = 'SURVEYOR' | 'LAWYER' | 'VALUER' | 'INSPECTOR';
export type LandReviewerSeatStatus = 'ACTIVE' | 'COMPLETED' | 'REVOKED';

export interface LandReviewCheck {
  key: string;
  label: string;
  required: boolean;
  requiresDocument: boolean;
  status: LandDiligenceCheckStatus;
  /** Only the reviewer's own note. */
  note: string | null;
  decidedByMe: boolean;
  decidedAt: string | null;
}

export interface MyLandReviewSummary {
  seatId: string;
  propertyId: string;
  propertyTitle: string;
  city: string;
  state: string;
  titleType: LandTitleType | null;
  role: LandReviewerRole;
  checks: LandReviewCheck[];
  dueAt: string | null;
  overdue: boolean;
  invitedAt: string;
}

export interface LandReviewParcel {
  address: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  plotNumber: string | null;
  block: string | null;
  estateName: string | null;
  areaValue: number;
  areaUnit: string;
  areaSqm: number | null;
  boundaryGeometry: Record<string, unknown> | null;
  boundaryNotes: string | null;
  zoning: string | null;
  permittedUse: string | null;
  titleType: LandTitleType | null;
  titleNumber: string | null;
  surveyNumber: string | null;
  registryAuthority: string | null;
  tenure: string | null;
}

/** One document on the property; the file part is the shared evidence shape. */
export interface LandReviewDocument {
  id: string;
  kind: 'STORED' | 'EXTERNAL';
  name: string;
  mimeType: string | null;
  url: string;
  host?: string | null;
  sizeBytes?: number | null;
  source: 'PARTY' | 'ADMIN';
  note?: string | null;
  uploadedAt: string;
  urlExpiresInSeconds?: number | null;
  documentType: string;
  /** Its citations on this seat's checks; one document can back several. */
  links: LandReviewDocumentLink[];
  /** @deprecated The first of `links`. */
  link?: LandReviewDocumentLink | null;
  /** Also cited on a check outside your seat. You can still cite it on yours. */
  citedOnOtherCheck?: boolean;
}

export interface LandReviewDocumentLink {
  linkedByName: string;
  /** You made this citation, so you may remove it. */
  linkedByMe?: boolean;
  linkedAt: string;
  checklistKey?: string | null;
  note?: string | null;
}

export interface LandReviewCase extends MyLandReviewSummary {
  seatStatus: LandReviewerSeatStatus;
  /** NONE once you declared no conflict; null until you declare (work is locked until then). */
  conflictDeclaration: 'NONE' | 'DECLARED' | null;
  /** Send back as expectedVersion with a decision. */
  caseVersion: number;
  parcel: LandReviewParcel;
  /** Only for seats verifying ownership against the registry. */
  ownerLegalName: string | null;
  documents: LandReviewDocument[];
  report: string | null;
}

export interface DecideLandReviewCheckInput {
  status: LandDiligenceCheckStatus;
  note?: string;
  expectedVersion?: number;
}

/** The reviewer's own evidence, optionally cited on one of their checks straight away. */
export interface LandReviewUploadInput {
  documentType: LandDocumentType;
  file: File;
  checklistKey?: string;
  note?: string;
}

export interface LandReviewCiteInput {
  documentId: string;
  checklistKey: string;
  note?: string;
}

export const LAND_REVIEWER_ROLE_LABELS: Record<LandReviewerRole, string> = {
  SURVEYOR: 'Surveyor',
  LAWYER: 'Lawyer',
  VALUER: 'Valuer',
  INSPECTOR: 'Inspector',
};

/** The backend accepts reports of 20-20 000 characters. */
export const LAND_REVIEW_REPORT_MIN = 20;
export const LAND_REVIEW_REPORT_MAX = 20_000;
