export type LandAreaUnit = 'SQUARE_METERS' | 'ACRE' | 'HECTARE';

export type LandDiligenceStatus =
  | 'NOT_STARTED'
  | 'IN_REVIEW'
  | 'ACTION_REQUIRED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

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
  | 'OTHER';

export interface LandDiligence {
  status: LandDiligenceStatus;
  findings?: string | null;
  /** Public and owner-safe checklist entries supplied by compliance. */
  checklist?: unknown;
  reviewedAt?: string | null;
  expiresAt?: string | null;
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
  createdAt: string;
  updatedAt: string;
}

export interface PublicLandListing {
  id: string;
  propertyId: string;
  title: string;
  askingPrice: number;
  description?: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  listedDate?: string;
  coverImageUrl?: string | null;
  ownerVerified?: boolean;
  parcel: PublicLandParcel;
  diligence?: Pick<LandDiligence, 'status' | 'reviewedAt' | 'expiresAt'> | null;
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
  address: string;
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
  diligence: Pick<LandDiligence, 'status' | 'reviewedAt' | 'expiresAt'>;
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
