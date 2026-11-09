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
