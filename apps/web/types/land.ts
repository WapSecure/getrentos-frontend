import type {
  LandAssuranceTier,
  LandDiligenceStatus,
  LandNotVerifiedItem,
  LandTitleType,
  LandTrustLabel,
} from '@sureground/shared';
import type { CrsCode, LandBoundaryStatus } from '@sureground/shared';
export type LandAreaUnit = 'SQUARE_METERS' | 'ACRE' | 'HECTARE';

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

export interface LandDiligenceSuspension {
  at: string;
  reason: string;
  /** True when a dispute hold or new encumbrance did it, not a person. */
  bySystem: boolean;
  from?: LandDiligenceStatus;
}

export interface LandOpenCondition {
  text: string;
  dueAt?: string;
}

export type LandEncumbranceStatus = 'UNKNOWN' | 'CLEAR' | 'FLAGGED';

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

export type { LandAssuranceTier, LandDiligenceStatus, LandTitleType } from '@sureground/shared';

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
  checklist?: unknown;
  checks?: LandDiligenceCheck[];
  reviewedAt?: string | null;
  expiresAt?: string | null;
  submittedAt?: string;
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
  /** Optional until a surveyed plan is uploaded. */
  boundaryGeometry?: unknown;
  /** Survey plans use Minna grids. Default WGS 84. */
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
  /** Where the outline editor starts. */
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
  submission: { canSubmit: boolean; blockers: string[] };
  boundary: LandBoundaryStatus | null;
  /** The backend may expose this at the top level. */
  listing?: {
    id: string;
    title?: string;
    askingPrice?: number;
    status?: string;
  } | null;
}

/** Exact API shape for /owner/land; the service adapts it to OwnerLandRecord. */
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
  /** Only where public; approximate until the property is verified. */
  latitude?: number;
  longitude?: number;
  locationPrecision?: 'exact' | 'approximate';
  coverImageUrl?: string | null;
  ownerVerified?: boolean;
  parcel: PublicLandParcel;
  diligence?: PublicLandDiligence | null;
}

/** The public API omits private title references and proof files. */
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
  locationPrecision?: 'exact' | 'approximate';
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

// What was checked, by whom, and the review level: shared with mobile.
export {
  LAND_ASSURANCE_TIER_LABELS,
  LAND_DILIGENCE_LABELS,
  LAND_TITLE_TYPE_LABELS,
  LAND_TRUST_SOURCE_LABELS,
  type LandNotVerifiedItem,
  type LandTrustLabel,
} from '@sureground/shared';

type PublicLandDiligence = Pick<
  LandDiligence,
  'status' | 'reviewedAt' | 'expiresAt' | 'assuranceTier'
> & {
  labels?: LandTrustLabel[];
  notVerified?: LandNotVerifiedItem[];
  /** CONDITIONAL: what must still be met before reservations and offers open. */
  openConditions?: LandOpenCondition[];
};
