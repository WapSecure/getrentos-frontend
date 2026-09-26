import { apiFetch } from './client';
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
  | 'EXPIRED';

export const LAND_DILIGENCE_LABEL: Record<LandDiligenceStatus, string> = {
  NOT_STARTED: 'Not started',
  IN_REVIEW: 'In review',
  ACTION_REQUIRED: 'Action required',
  VERIFIED: 'Diligence verified',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
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
  parcel: LandParcelPublic;
  diligence: { status: LandDiligenceStatus; reviewedAt?: string; expiresAt?: string };
}

export interface LandFilters {
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  search?: string;
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** Formats an area as e.g. `600 sqm` / `2 hectares`. */
export function formatLandArea(value: number, unit: LandAreaUnit): string {
  return `${value.toLocaleString()} ${LAND_AREA_UNIT_LABEL[unit]}`;
}

export const landApi = {
  // The public route declares no `search` (and rejects unknown params), so the
  // free-text box searches by city.
  list: ({ search, ...filters }: LandFilters = {}, page = 1, pageSize = 20) =>
    apiFetch<Paginated<LandListing>>(
      `/land${toQuery({ ...filters, city: filters.city ?? search, page, pageSize })}`
    ),

  get: (listingId: string) => apiFetch<LandListing>(`/land/listings/${listingId}`),
};
