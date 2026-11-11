import type { LandAssuranceTier, LandNotVerifiedItem, LandTrustLabel } from '@sureground/shared';
import type { MediaItem } from '@sureground/shared/showroom';
import { apiFetch } from './client';
import { toQuery } from './query';
import type { Paginated } from './buyer';

export type LandAreaUnit = 'SQUARE_METERS' | 'ACRE' | 'HECTARE';

export const LAND_AREA_UNIT_LABEL: Record<LandAreaUnit, string> = {
  SQUARE_METERS: 'sqm',
  ACRE: 'acres',
  HECTARE: 'hectares',
};

export type LandTitleType =
  | 'CERTIFICATE_OF_OCCUPANCY'
  | 'DEED_OF_ASSIGNMENT'
  | 'GOVERNOR_CONSENT'
  | 'ALLOCATION_LETTER'
  | 'EXCISION_GAZETTE'
  | 'REGISTERED_CONVEYANCE'
  | 'SURVEY_PLAN'
  | 'OTHER';

export const LAND_TITLE_TYPE_LABEL: Record<LandTitleType, string> = {
  CERTIFICATE_OF_OCCUPANCY: 'Certificate of Occupancy',
  DEED_OF_ASSIGNMENT: 'Deed of Assignment',
  GOVERNOR_CONSENT: "Governor's Consent",
  ALLOCATION_LETTER: 'Allocation Letter',
  EXCISION_GAZETTE: 'Excision Gazette',
  REGISTERED_CONVEYANCE: 'Registered Conveyance',
  SURVEY_PLAN: 'Survey Plan',
  OTHER: 'Other',
};

export type LandEncumbranceStatus = 'UNKNOWN' | 'CLEAR' | 'FLAGGED';

export const LAND_ENCUMBRANCE_LABEL: Record<LandEncumbranceStatus, string> = {
  UNKNOWN: 'Not established',
  CLEAR: 'Clear',
  FLAGGED: 'Flagged',
};

export const LAND_ENCUMBRANCE_TONE: Record<
  LandEncumbranceStatus,
  'neutral' | 'success' | 'danger'
> = {
  UNKNOWN: 'neutral',
  CLEAR: 'success',
  FLAGGED: 'danger',
};

export type LandDiligenceStatus =
  | 'NOT_STARTED'
  | 'IN_REVIEW'
  | 'ACTION_REQUIRED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONDITIONAL'
  | 'SUSPENDED';

export const LAND_DILIGENCE_LABEL: Record<LandDiligenceStatus, string> = {
  NOT_STARTED: 'Not started',
  IN_REVIEW: 'In review',
  ACTION_REQUIRED: 'Action required',
  VERIFIED: 'Diligence verified',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  CONDITIONAL: 'Verified with conditions',
  SUSPENDED: 'Suspended',
};

export const LAND_DILIGENCE_TONE: Record<
  LandDiligenceStatus,
  'neutral' | 'info' | 'warning' | 'success' | 'danger'
> = {
  NOT_STARTED: 'neutral',
  IN_REVIEW: 'info',
  ACTION_REQUIRED: 'warning',
  VERIFIED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'danger',
  CONDITIONAL: 'info',
  SUSPENDED: 'danger',
};

/** Public-safe parcel facts. Title/survey numbers are deliberately withheld by the API. */
export interface LandParcelPublic {
  plotNumber?: string;
  block?: string;
  estateName?: string;
  areaValue: number;
  areaUnit: LandAreaUnit;
  frontage?: number;
  depth?: number;
  /** The plot outline as a GeoJSON Polygon (see boundaryCorners). */
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

export interface LandListing {
  id: string;
  propertyId: string;
  title: string;
  price: number;
  listingType: string;
  propertyType: string;
  city: string;
  state: string;
  country: string;
  /** Left out until the property is verified (a stay: until booked); see addressHidden. */
  address?: string;
  addressHidden?: boolean;
  latitude?: number;
  longitude?: number;
  /** `approximate` until the property is verified, and always for a stay: draw an area. */
  locationPrecision?: 'exact' | 'approximate';
  coverImageUrl?: string;
  galleryImageUrls?: string[];
  /** Photos (with rooms, captions and resized copies), in display order. */
  media?: MediaItem[];
  description: string;
  amenities?: string[];
  isVerified: boolean;
  propertyVerificationStatus: string;
  publishedAt: string;
  parcel: LandParcelPublic;
  diligence: {
    status: LandDiligenceStatus;
    reviewedAt?: string;
    expiresAt?: string;
    assuranceTier?: LandAssuranceTier;
    labels?: LandTrustLabel[];
    notVerified?: LandNotVerifiedItem[];
  };
}

export interface LandFilters {
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  search?: string;
}

export function formatLandArea(value: number, unit: LandAreaUnit): string {
  return `${value.toLocaleString()} ${LAND_AREA_UNIT_LABEL[unit]}`;
}

export interface LandComparables {
  listingId: string;
  subjectPricePerSqm?: number;
  /** 0-100: where this parcel's ₦/m² sits among the comparables returned. */
  subjectPercentile?: number;
  comparablesMedianPricePerSqm?: number;
  comparables: {
    id: string;
    title: string;
    city: string;
    state: string;
    estateName?: string;
    price: number;
    areaSqm?: number;
    pricePerSqm?: number;
    titleType?: LandTitleType;
  }[];
}

export const landApi = {
  comparables: (listingId: string, limit = 6) =>
    apiFetch<LandComparables>(
      `/land/listings/${encodeURIComponent(listingId)}/comparables${toQuery({ limit })}`
    ),
  list: (filters: LandFilters = {}, page = 1, pageSize = 20) =>
    apiFetch<Paginated<LandListing>>(`/land${toQuery({ ...filters, page, pageSize })}`),

  get: (listingId: string) => apiFetch<LandListing>(`/land/listings/${listingId}`),
};
