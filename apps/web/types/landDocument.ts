/** Mirrors src/modules/land/dto/land-document.dto.ts. */

/** LAND_DOCUMENT_TYPES in land-document.dto.ts. */
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

/** A document in use cannot be deleted. */
export interface LandDocumentUsage {
  checklistKeys: string[];
  layoutPlan: boolean;
  milestones: number;
  encumbrances: number;
  titleEvents: number;
  mandates: number;
}

/** Preview link lasts 15 minutes. */
export interface LandDocument {
  id: string;
  kind: 'STORED' | 'EXTERNAL';
  name: string;
  mimeType: string | null;
  url: string;
  sizeBytes?: number | null;
  uploadedAt: string;
  urlExpiresInSeconds?: number | null;
  /** Normally a LandDocumentType; older rows may carry other values. */
  documentType: string;
  usage: LandDocumentUsage;
  /** Nothing relies on it and the caller uploaded it (or owns the land). */
  canDelete: boolean;
}

export interface LandDocumentUploadInput {
  documentType: LandDocumentType;
  file: File;
}
