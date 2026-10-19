/**
 * A land property's documents as the owner API returns them
 * (src/modules/land/dto/land-document.dto.ts). Diligence checks, layout plans,
 * conveyance steps, encumbrances and the chain of title all cite these.
 */

// ─── Property documents ──────────────────────────────────────────────────────

/** What a land document claims to be (LAND_DOCUMENT_TYPES in land-document.dto.ts). */
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

/** Where a document is relied on; a document in use cannot be deleted. */
export interface LandDocumentUsage {
  /** Diligence checks citing it. */
  checklistKeys: string[];
  layoutPlan: boolean;
  milestones: number;
  encumbrances: number;
  titleEvents: number;
  /** Management mandates (agreement or power of attorney) resting on it. */
  mandates: number;
}

/** A property document with a short-lived (15 minute) preview link. */
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
