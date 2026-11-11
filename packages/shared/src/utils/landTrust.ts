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

/** A status's badge colour; the same names as `BadgeVariant` in @sureground/ui, which this package cannot import. */
export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

/** One map for the diligence badge on web (owner screens) and backoffice (staff queue and case). */
export const LAND_DILIGENCE_STATUS: Record<
  LandDiligenceStatus,
  { label: string; tone: StatusTone }
> = {
  NOT_STARTED: { label: 'Not started', tone: 'neutral' },
  IN_REVIEW: { label: 'In review', tone: 'info' },
  ACTION_REQUIRED: { label: 'Action required', tone: 'warning' },
  VERIFIED: { label: 'Verified', tone: 'success' },
  // "Rejected", not "Not verified": the latter reads like "not checked yet".
  REJECTED: { label: 'Rejected', tone: 'danger' },
  EXPIRED: { label: 'Expired', tone: 'warning' },
  CONDITIONAL: { label: 'Verified with conditions', tone: 'info' },
  SUSPENDED: { label: 'Suspended', tone: 'danger' },
};

export const LAND_DILIGENCE_LABELS = Object.fromEntries(
  Object.entries(LAND_DILIGENCE_STATUS).map(([status, { label }]) => [status, label])
) as Record<LandDiligenceStatus, string>;

/** Any casing or separator the API sends (`in-review`, `In review`); unknown values read as not started. */
export function normalizeLandDiligenceStatus(
  value: string | undefined | null
): LandDiligenceStatus {
  const normalized = value
    ?.trim()
    .toUpperCase()
    .replace(/[-\s]+/g, '_') as LandDiligenceStatus;
  return normalized in LAND_DILIGENCE_STATUS ? normalized : 'NOT_STARTED';
}

/** The investor-facing verification summary on a listing's detail route (Diaspora Invest DIA-10/11). */
export const VERIFICATION_SUMMARY_STATUSES = [
  'NOT_STARTED',
  'SUBMITTED',
  'UNDER_REVIEW',
  'EVIDENCE_VERIFIED',
  'CONDITIONALLY_APPROVED',
  'INVESTMENT_ELIGIBLE',
  'REJECTED',
  'VERIFICATION_EXPIRED',
] as const;
export type VerificationSummaryStatus = (typeof VERIFICATION_SUMMARY_STATUSES)[number];

export interface VerificationSummary {
  status: VerificationSummaryStatus;
  /** The checks that passed, in their checklist wording. */
  scope: string[];
  checkedAt: string | null;
  /** Roles, never names, e.g. "Accredited surveyor". */
  checkedBy: string[];
  documentsReviewed: { kind: string; label: string }[];
  openIssues: string[];
  /** What the verification does not cover; the API never sends it empty. */
  limits: string[];
  recheckBy: string | null;
}

// Never "verified property": each status says what was looked at, not that the title is sound.
export const VERIFICATION_SUMMARY_STATUS: Record<
  VerificationSummaryStatus,
  { label: string; tone: StatusTone; description: string }
> = {
  NOT_STARTED: {
    label: 'Not checked yet',
    tone: 'neutral',
    description:
      'Sureground has not reviewed any documents for this property or done any checks on it. Everything on this page is what the seller says.',
  },
  SUBMITTED: {
    label: 'Documents received',
    tone: 'neutral',
    description:
      'The seller has sent Sureground ownership documents, but the checks have not started. Nothing on this page has been checked yet.',
  },
  UNDER_REVIEW: {
    label: 'Under review',
    tone: 'info',
    description:
      'Sureground is checking this property. Until the review ends, treat anything not listed as checked as unchecked.',
  },
  EVIDENCE_VERIFIED: {
    label: 'Evidence checked',
    tone: 'info',
    description:
      'The evidence listed below passed our checks, but this property has not been cleared for investment.',
  },
  CONDITIONALLY_APPROVED: {
    label: 'Approved with conditions',
    tone: 'warning',
    description:
      'Approved only once the conditions below are met. It is not open to investment until then.',
  },
  INVESTMENT_ELIGIBLE: {
    label: 'Investment eligible',
    tone: 'success',
    description:
      'The required checks passed and are in date, so this property can take investment through Sureground. That is not a guarantee of title or of any return.',
  },
  REJECTED: {
    label: 'Not approved',
    tone: 'danger',
    description:
      "Sureground did not approve this property. Do not rely on the seller's ownership claims.",
  },
  VERIFICATION_EXPIRED: {
    label: 'Verification expired',
    tone: 'warning',
    description:
      'The checks below were done but have lapsed. Do not rely on them until they are renewed.',
  },
};

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v !== '') : [];
const isoOrNull = (value: unknown): string | null =>
  typeof value === 'string' && !Number.isNaN(new Date(value).getTime()) ? value : null;

/** Fallback when the API sends no limits: a summary is never shown without them. */
export const VERIFICATION_LIMITS_FALLBACK = [
  'Each check records the evidence seen on the date shown. It is not a guarantee of title.',
  'Anything not listed as checked was not checked.',
  'Take independent legal advice before you commit money.',
];

/** The API's summary, checked; undefined when missing or the status is unknown (an older API), so pages behave as before. */
export function verificationSummaryOf(value: unknown): VerificationSummary | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const v = value as Record<string, unknown>;
  const status = v.status as VerificationSummaryStatus;
  if (!VERIFICATION_SUMMARY_STATUSES.includes(status)) return undefined;
  const limits = strings(v.limits);
  return {
    status,
    scope: strings(v.scope),
    checkedAt: isoOrNull(v.checkedAt),
    checkedBy: strings(v.checkedBy),
    documentsReviewed: Array.isArray(v.documentsReviewed)
      ? v.documentsReviewed.filter(
          (d): d is { kind: string; label: string } =>
            !!d && typeof d.kind === 'string' && typeof d.label === 'string' && d.label !== ''
        )
      : [],
    openIssues: strings(v.openIssues),
    limits: limits.length ? limits : [...VERIFICATION_LIMITS_FALLBACK],
    recheckBy: isoOrNull(v.recheckBy),
  };
}

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
