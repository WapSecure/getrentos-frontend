import { apiFetch } from './client';
import type { Paginated } from './properties';

/** An owner's private land records: parcel facts and where diligence stands. */
export type LandAreaUnit = 'SQUARE_METERS' | 'ACRE' | 'HECTARE';
export type LandDiligenceStatus =
  | 'NOT_STARTED'
  | 'IN_REVIEW'
  | 'ACTION_REQUIRED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

export const LAND_AREA_UNITS: { value: LandAreaUnit; label: string }[] = [
  { value: 'SQUARE_METERS', label: 'sqm' },
  { value: 'ACRE', label: 'acres' },
  { value: 'HECTARE', label: 'hectares' },
];

export const LAND_TITLE_TYPES = [
  { value: 'CERTIFICATE_OF_OCCUPANCY', label: 'C of O' },
  { value: 'GOVERNOR_CONSENT', label: "Governor's Consent" },
  { value: 'DEED_OF_ASSIGNMENT', label: 'Deed of Assignment' },
  { value: 'REGISTERED_CONVEYANCE', label: 'Registered Conveyance' },
  { value: 'EXCISION_GAZETTE', label: 'Excision Gazette' },
  { value: 'ALLOCATION_LETTER', label: 'Allocation Letter' },
  { value: 'SURVEY_PLAN', label: 'Survey Plan' },
  { value: 'OTHER', label: 'Other' },
] as const;
export type LandTitleType = (typeof LAND_TITLE_TYPES)[number]['value'];

export const DILIGENCE: Record<
  LandDiligenceStatus,
  { label: string; tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger' }
> = {
  NOT_STARTED: { label: 'Not started', tone: 'neutral' },
  IN_REVIEW: { label: 'In review', tone: 'info' },
  ACTION_REQUIRED: { label: 'Action required', tone: 'warning' },
  VERIFIED: { label: 'Verified', tone: 'success' },
  REJECTED: { label: 'Not verified', tone: 'danger' },
  EXPIRED: { label: 'Expired', tone: 'warning' },
};

export interface LandParcelInput {
  plotNumber?: string;
  block?: string;
  estateName?: string;
  areaValue: number;
  areaUnit: LandAreaUnit;
  zoning?: string;
  permittedUse?: string;
  roadAccess?: boolean;
  titleType?: LandTitleType;
  titleNumber?: string;
  surveyNumber?: string;
  boundaryNotes?: string;
}

export interface LandParcel extends LandParcelInput {
  diligence?: { status: LandDiligenceStatus; findings?: string | null } | null;
}

export interface OwnerLandRecord {
  propertyId: string;
  title: string;
  address: string;
  city: string;
  state: string;
  isPropertyVerified: boolean;
  ownershipProofCount: number;
  hasActiveSaleListing: boolean;
  parcel?: LandParcel | null;
}

export const ownerLandApi = {
  list: (page = 1, pageSize = 50) =>
    apiFetch<Paginated<OwnerLandRecord>>(`/owner/land?page=${page}&pageSize=${pageSize}`),
  upsertParcel: (propertyId: string, parcel: LandParcelInput) =>
    apiFetch<OwnerLandRecord>(`/owner/land/${propertyId}/parcel`, { method: 'PUT', body: parcel }),
};
