export type LandAssuranceTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

export const LAND_ASSURANCE_TIER_LABELS: Record<LandAssuranceTier, string> = {
  BASIC: 'Basic review',
  STANDARD: 'Registry-searched',
  PREMIUM: 'Independently reviewed',
};

export const LAND_ASSURANCE_TIER_DESCRIPTIONS: Record<LandAssuranceTier, string> = {
  BASIC: 'Sureground reviewed the ownership documents and the diligence checklist.',
  STANDARD: 'Includes an official registry search on the title.',
  PREMIUM: 'Registry-searched, with checks by an independent professional.',
};

export interface LandTrustLabel {
  kind:
    | 'OWNERSHIP_DOCUMENTS'
    | 'SELLER_AUTHORITY'
    | 'TITLE_REVIEW'
    | 'OFFICIAL_SEARCH'
    | 'PARCEL_SURVEYED'
    | 'SITE_INSPECTED'
    | 'PLANNING'
    | 'COMMUNITY';
  title: string;
  scope: string[];
  checkedAt: string;
  /** SUREGROUND, or the outside professional's role (SURVEYOR, LAWYER, …). */
  checkedBy: string[];
}

/** A check that was not passed: PENDING (not checked) or FLAGGED (issue found). */
export interface LandNotVerifiedItem {
  key: string;
  label: string;
  status: 'PENDING' | 'FLAGGED';
}

export const LAND_TRUST_SOURCE_LABELS: Record<string, string> = {
  SUREGROUND: 'Sureground',
  SURVEYOR: 'an independent surveyor',
  LAWYER: 'an independent lawyer',
  VALUER: 'an independent valuer',
  INSPECTOR: 'an independent inspector',
};

export const checkedByText = (checkedBy: string[]) =>
  checkedBy.map((source) => LAND_TRUST_SOURCE_LABELS[source] ?? source).join(' and ');

export const percentileWords = (percentile: number) =>
  percentile <= 20
    ? 'cheaper per m² than most comparable land'
    : percentile < 40
      ? 'below the middle of comparable land per m²'
      : percentile <= 60
        ? 'around the middle of comparable land per m²'
        : percentile < 80
          ? 'above the middle of comparable land per m²'
          : 'dearer per m² than most comparable land';

export type LandDiligenceStatus =
  | 'NOT_STARTED'
  | 'IN_REVIEW'
  | 'ACTION_REQUIRED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  /** Approved subject to conditions: public, but not open to reservations or offers yet. */
  | 'CONDITIONAL'
  /** Paused by staff or the system (a dispute hold, an encumbrance): off the market. */
  | 'SUSPENDED';

export type LandTitleType =
  | 'CERTIFICATE_OF_OCCUPANCY'
  | 'DEED_OF_ASSIGNMENT'
  | 'GOVERNOR_CONSENT'
  | 'ALLOCATION_LETTER'
  | 'EXCISION_GAZETTE'
  | 'REGISTERED_CONVEYANCE'
  | 'SURVEY_PLAN'
  | 'OTHER';

export const LAND_DILIGENCE_LABELS: Record<LandDiligenceStatus, string> = {
  NOT_STARTED: 'Not started',
  IN_REVIEW: 'In review',
  ACTION_REQUIRED: 'Action required',
  VERIFIED: 'Verified',
  REJECTED: 'Not verified',
  EXPIRED: 'Expired',
  CONDITIONAL: 'Verified with conditions',
  SUSPENDED: 'Suspended',
};

export const LAND_TITLE_TYPE_LABELS: Record<LandTitleType, string> = {
  CERTIFICATE_OF_OCCUPANCY: 'Certificate of Occupancy',
  DEED_OF_ASSIGNMENT: 'Deed of Assignment',
  GOVERNOR_CONSENT: "Governor's Consent",
  ALLOCATION_LETTER: 'Allocation Letter',
  EXCISION_GAZETTE: 'Excision Gazette',
  REGISTERED_CONVEYANCE: 'Registered Conveyance',
  SURVEY_PLAN: 'Survey Plan',
  OTHER: 'Other title record',
};
