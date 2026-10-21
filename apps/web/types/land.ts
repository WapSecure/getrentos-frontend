import type { CrsCode, LandBoundaryStatus } from '@getrentos/shared';
export type LandAreaUnit = 'SQUARE_METERS' | 'ACRE' | 'HECTARE';

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

/** One condition of a CONDITIONAL approval, as the owner and staff see it. */
export interface LandDiligenceCondition {
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

/** Why and since when a case is SUSPENDED. */
export interface LandDiligenceSuspension {
  at: string;
  reason: string;
  /** True when a dispute hold or new encumbrance did it, not a person. */
  bySystem: boolean;
  from?: LandDiligenceStatus;
}

/** What a CONDITIONAL approval still waits on, as buyers see it. */
export interface LandOpenCondition {
  text: string;
  dueAt?: string;
}

export type LandEncumbranceStatus = 'UNKNOWN' | 'CLEAR' | 'FLAGGED';

export type LandTitleType =
  | 'CERTIFICATE_OF_OCCUPANCY'
  | 'DEED_OF_ASSIGNMENT'
  | 'GOVERNOR_CONSENT'
  | 'ALLOCATION_LETTER'
  | 'EXCISION_GAZETTE'
  | 'REGISTERED_CONVEYANCE'
  | 'SURVEY_PLAN'
  | 'OTHER';

export type LandOwnershipDocumentType =
  | 'DEED'
  | 'DEED_OF_ASSIGNMENT'
  | 'C_OF_O'
  | 'GOVERNOR_CONSENT'
  | 'ALLOCATION_LETTER'
  | 'EXCISION_GAZETTE'
  | 'REGISTERED_CONVEYANCE'
  | 'GOVERNMENT_RECEIPT'
  | 'LAND_USE_PERMIT'
  | 'SURVEY_PLAN'
  | 'UTILITY_BILL'
  | 'MANAGEMENT_AUTHORIZATION'
  | 'OTHER';

export type LandDiligenceCheckStatus = 'PENDING' | 'PASSED' | 'FLAGGED' | 'NOT_APPLICABLE';

export type LandAssuranceTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

/** One item of the diligence checklist seeded for the parcel's title type. */
export interface LandDiligenceCheck {
  key: string;
  label: string;
  required: boolean;
  requiresDocument: boolean;
  status: LandDiligenceCheckStatus;
  note?: string;
  decidedAt?: string;
  /** A document has been cited against this check. */
  hasEvidence: boolean;
}

export interface LandDiligence {
  status: LandDiligenceStatus;
  findings?: string | null;
  /** Public and owner-safe checklist entries supplied by compliance. */
  checklist?: unknown;
  checks?: LandDiligenceCheck[];
  reviewedAt?: string | null;
  expiresAt?: string | null;
  submittedAt?: string;
  /** When the review is owed by. */
  slaDueAt?: string;
  riskScore?: number;
  assuranceTier?: LandAssuranceTier;
  conditions?: LandDiligenceCondition[];
  suspension?: LandDiligenceSuspension;
}

export interface LandParcelInput {
  plotNumber?: string;
  block?: string;
  estateName?: string;
  areaValue: number;
  areaUnit: LandAreaUnit;
  frontage?: number;
  depth?: number;
  /** GeoJSON-like boundary data. It is optional until a surveyed plan is uploaded. */
  boundaryGeometry?: unknown;
  /** The coordinate system boundaryGeometry is in; survey plans use Minna grids. Default WGS 84. */
  boundaryCrs?: CrsCode;
  boundaryNotes?: string;
  zoning?: string;
  permittedUse?: string;
  terrain?: string;
  roadAccess?: boolean;
  utilities?: string[];
  titleType?: LandTitleType;
  titleNumber?: string;
  surveyNumber?: string;
  registryAuthority?: string;
  tenure?: string;
  encumbranceStatus?: LandEncumbranceStatus;
  subdivisionAllowed?: boolean;
  fractionalOwnershipAllowed?: boolean;
}

export interface LandParcel extends LandParcelInput {
  id?: string;
  propertyId: string;
  diligence?: LandDiligence | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LandPropertySummary {
  id: string;
  title: string;
  name?: string;
  propertyType?: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  /** The property's map pin, where the outline editor starts. */
  latitude?: number;
  longitude?: number;
  verificationStatus?: string;
  estimatedValue?: number | null;
  purchasePrice?: number | null;
  coverImageKey?: string | null;
  hasActiveSaleListing?: boolean;
}

export interface OwnerLandRecord {
  property: LandPropertySummary;
  parcel: LandParcel | null;
  diligence: LandDiligence | null;
  /** Whether diligence can be submitted (or resubmitted) now, and if not, why. */
  submission: { canSubmit: boolean; blockers: string[] };
  /** The outline now on the parcel and whether a surveyor signed it off. */
  boundary: LandBoundaryStatus | null;
  /** Backend may expose this at the top level for fast collection rendering. */
  listing?: {
    id: string;
    title?: string;
    askingPrice?: number;
    status?: string;
  } | null;
}

/** Exact API shape for /owner/land. The service adapts this to OwnerLandRecord. */
export interface OwnerLandApiRecord {
  propertyId: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  coverImageUrl?: string;
  propertyVerificationStatus: string;
  isPropertyVerified: boolean;
  ownershipProofCount: number;
  hasActiveSaleListing: boolean;
  parcel?: LandParcel | null;
  canSubmitForReview?: boolean;
  submissionBlockers?: string[];
  boundary?: LandBoundaryStatus | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicLandListing {
  id: string;
  propertyId: string;
  title: string;
  askingPrice: number;
  description?: string;
  /** Left out until the property is verified; see addressHidden. */
  address?: string;
  addressHidden?: boolean;
  city: string;
  state: string;
  country?: string;
  listedDate?: string;
  coverImageUrl?: string | null;
  ownerVerified?: boolean;
  parcel: PublicLandParcel;
  diligence?: PublicLandDiligence | null;
}

/** The public API intentionally omits private title references and proof files. */
export interface PublicLandParcel {
  plotNumber?: string;
  block?: string;
  estateName?: string;
  areaValue: number;
  areaUnit: LandAreaUnit;
  frontage?: number;
  depth?: number;
  boundaryGeometry?: unknown;
  boundaryNotes?: string;
  zoning?: string;
  permittedUse?: string;
  terrain?: string;
  roadAccess?: boolean;
  utilities?: string[];
  titleType?: LandTitleType;
  tenure?: string;
  encumbranceStatus: LandEncumbranceStatus;
  subdivisionAllowed: boolean;
  fractionalOwnershipAllowed: boolean;
}

/** Exact public API shape. Sensitive title numbers and proof files are absent. */
export interface PublicLandListingApi {
  id: string;
  propertyId: string;
  title: string;
  price: number;
  city: string;
  state: string;
  country: string;
  /** Left out until the property is verified; see addressHidden. */
  address?: string;
  addressHidden?: boolean;
  latitude?: number;
  longitude?: number;
  coverImageUrl?: string;
  galleryImageUrls?: string[];
  description: string;
  amenities?: string[];
  isVerified: boolean;
  propertyVerificationStatus: string;
  publishedAt: string;
  parcel: PublicLandParcel;
  diligence: PublicLandDiligence;
}

export interface LandOwnershipProofInput {
  documentType: LandOwnershipDocumentType;
  file: File;
}

export const LAND_AREA_UNIT_LABELS: Record<LandAreaUnit, string> = {
  SQUARE_METERS: 'sqm',
  ACRE: 'acres',
  HECTARE: 'hectares',
};

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

export const LAND_ASSURANCE_TIER_LABELS: Record<LandAssuranceTier, string> = {
  BASIC: 'Basic review',
  STANDARD: 'Registry-searched',
  PREMIUM: 'Independently reviewed',
};

/** One scoped public claim about a parcel: what was checked, by whom, when. */
export interface LandTrustLabel {
  kind:
    | 'OWNERSHIP_DOCUMENTS'
    | 'TITLE_REVIEW'
    | 'OFFICIAL_SEARCH'
    | 'PARCEL_SURVEYED'
    | 'SITE_INSPECTED'
    | 'PLANNING'
    | 'COMMUNITY';
  title: string;
  /** The checklist items the label rests on. */
  scope: string[];
  checkedAt: string;
  /** GETRENTOS, or the outside professional's role (SURVEYOR, LAWYER, …). */
  checkedBy: string[];
}

/** A check that was not passed: PENDING (not checked) or FLAGGED (issue found). */
export interface LandNotVerifiedItem {
  key: string;
  label: string;
  status: 'PENDING' | 'FLAGGED';
}

export const LAND_TRUST_SOURCE_LABELS: Record<string, string> = {
  GETRENTOS: 'GetRentos',
  SURVEYOR: 'an independent surveyor',
  LAWYER: 'an independent lawyer',
  VALUER: 'an independent valuer',
  INSPECTOR: 'an independent inspector',
};

type PublicLandDiligence = Pick<
  LandDiligence,
  'status' | 'reviewedAt' | 'expiresAt' | 'assuranceTier'
> & {
  labels?: LandTrustLabel[];
  notVerified?: LandNotVerifiedItem[];
  /** CONDITIONAL: what must still be met before reservations and offers open. */
  openConditions?: LandOpenCondition[];
};
