import type { LandBoundaryStatus } from '@getrentos/shared';
import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';
import type { Paginated } from './properties';

/** An owner's private land records: parcel facts and where diligence stands. */
export type LandAreaUnit = 'SQUARE_METERS' | 'ACRE' | 'HECTARE';
export type LandDiligenceStatus =
  | 'NOT_STARTED'
  | 'IN_REVIEW'
  | 'ACTION_REQUIRED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONDITIONAL'
  | 'SUSPENDED';

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
  CONDITIONAL: { label: 'Verified with conditions', tone: 'info' },
  SUSPENDED: { label: 'Suspended', tone: 'danger' },
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
  /** The title permits carving plots out of it; needed for an estate layout. */
  subdivisionAllowed?: boolean;
  titleType?: LandTitleType;
  titleNumber?: string;
  surveyNumber?: string;
  boundaryNotes?: string;
  /** The plot outline as a GeoJSON Polygon; null clears it. */
  boundaryGeometry?: unknown;
}

export type LandCheckStatus = 'PASSED' | 'FLAGGED' | 'NOT_APPLICABLE' | 'PENDING';
export type LandAssuranceTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

export const ASSURANCE_TIER_LABEL: Record<LandAssuranceTier, string> = {
  BASIC: 'Basic review',
  STANDARD: 'Registry-searched',
  PREMIUM: 'Independently reviewed',
};

export interface LandDiligenceCheck {
  key: string;
  label: string;
  required: boolean;
  status: LandCheckStatus;
  note?: string | null;
}

export interface LandDiligence {
  status: LandDiligenceStatus;
  findings?: string | null;
  checks?: LandDiligenceCheck[];
  submittedAt?: string | null;
  slaDueAt?: string | null;
  expiresAt?: string | null;
  assuranceTier?: LandAssuranceTier | null;
}

export interface LandParcel extends LandParcelInput {
  diligence?: LandDiligence | null;
}

export interface OwnerLandRecord {
  propertyId: string;
  title: string;
  address: string;
  city: string;
  state: string;
  /** The property's map pin, where the outline editor starts. */
  latitude?: number;
  longitude?: number;
  isPropertyVerified: boolean;
  ownershipProofCount: number;
  hasActiveSaleListing: boolean;
  /** The property's own verification, the second gate before listing. */
  propertyVerificationStatus?: string;
  /** Whether the parcel can go into the diligence queue now, and if not, why. */
  canSubmitForReview?: boolean;
  submissionBlockers?: string[];
  parcel?: LandParcel | null;
  /** The outline now on the parcel and whether the case's surveyor signed it off. */
  boundary?: LandBoundaryStatus | null;
}

/** What the owner is asked to do next, by diligence status. */
export const REVIEW_PROMPT: Partial<
  Record<LandDiligenceStatus, { title: string; body: string; action: string }>
> = {
  NOT_STARTED: {
    title: 'Submit for diligence review',
    body: 'Compliance checks the title at the registry, charts the survey and inspects the site before your land can be listed.',
    action: 'Submit for review',
  },
  ACTION_REQUIRED: {
    title: 'Compliance needs more from you',
    body: 'Address the findings below, update the parcel or documents, then resubmit.',
    action: 'Resubmit for review',
  },
  REJECTED: {
    title: 'Diligence was not passed',
    body: 'Fix the issues in the findings and resubmit when the records are corrected.',
    action: 'Resubmit for review',
  },
  EXPIRED: {
    title: 'Verification has expired',
    body: 'This parcel is off the market until its diligence is renewed. Resubmit current documents.',
    action: 'Renew verification',
  },
};

/** Required checks done (passed, or not applicable) out of all required. */
export function checkProgress(checks: LandDiligenceCheck[] = []) {
  const required = checks.filter((c) => c.required);
  const done = required.filter((c) => c.status === 'PASSED' || c.status === 'NOT_APPLICABLE');
  return { done: done.length, required: required.length };
}

/** Both gates passed: diligence verified and the property itself approved. */
export const readyToList = (r: OwnerLandRecord) =>
  r.parcel?.diligence?.status === 'VERIFIED' && r.propertyVerificationStatus === 'APPROVED';

/* ------------------------------- documents ------------------------------- */

export const LAND_DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: 'CERTIFICATE_OF_OCCUPANCY', label: 'Certificate of Occupancy' },
  { value: 'GOVERNORS_CONSENT', label: "Governor's Consent" },
  { value: 'DEED_OF_ASSIGNMENT', label: 'Deed of Assignment' },
  { value: 'REGISTERED_CONVEYANCE', label: 'Registered conveyance' },
  { value: 'SURVEY_PLAN', label: 'Survey plan' },
  { value: 'EXCISION_GAZETTE', label: 'Excision gazette' },
  { value: 'ALLOCATION_LETTER', label: 'Allocation letter' },
  { value: 'LAYOUT_PLAN', label: 'Layout plan' },
  { value: 'REGISTRY_SEARCH_REPORT', label: 'Registry search report' },
  { value: 'CHARTING_REPORT', label: 'Charting report' },
  { value: 'SITE_INSPECTION_REPORT', label: 'Site inspection report' },
  { value: 'VALUATION_REPORT', label: 'Valuation report' },
  { value: 'RECEIPT', label: 'Receipt' },
  { value: 'PHOTO', label: 'Photo' },
  { value: 'OTHER', label: 'Other' },
];

/** Labels for the types authority and conveyance use, which the add-document list doesn't offer. */
const OTHER_DOCUMENT_LABELS: Record<string, string> = {
  LITIGATION_SEARCH_REPORT: 'Litigation search report',
  CONTRACT_OF_SALE: 'Contract of sale',
  POWER_OF_ATTORNEY: 'Power of attorney',
  LETTERS_OF_ADMINISTRATION: 'Letters of administration',
  PROBATE: 'Grant of probate',
  COURT_ORDER: 'Court order',
  BOARD_RESOLUTION: 'Board resolution',
  DEVELOPMENT_AGREEMENT: 'Development agreement',
  FAMILY_RESOLUTION: 'Family resolution',
  COMMUNITY_RESOLUTION: 'Community resolution',
  CONSENT_LETTER: 'Signed consent',
  LEGAL_INQUIRY_REPORT: 'Legal inquiry report',
};

export const documentTypeLabel = (value: string) =>
  LAND_DOCUMENT_TYPES.find((t) => t.value === value)?.label ??
  OTHER_DOCUMENT_LABELS[value] ??
  value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');

export interface LandDocument {
  id: string;
  name: string;
  mimeType: string | null;
  /** A short-lived (15 minute) preview link. */
  url: string;
  uploadedAt: string;
  documentType: string;
  canDelete: boolean;
}

/* ---------------------------------- risk --------------------------------- */

export interface LandRisk {
  score: number;
  band: 'LOW' | 'MODERATE' | 'HIGH';
  factors: { factor: string; points: number }[];
  assuranceTier: LandAssuranceTier | null;
  inputs: { checks: { total: number; passed: number; flagged: number; pending: number } };
}

export const RISK_BAND: Record<
  LandRisk['band'],
  { label: string; tone: 'success' | 'warning' | 'danger' }
> = {
  LOW: { label: 'Low risk', tone: 'success' },
  MODERATE: { label: 'Moderate risk', tone: 'warning' },
  HIGH: { label: 'High risk', tone: 'danger' },
};

/* ---------------------------------- tours -------------------------------- */

export type TourStatus =
  | 'REQUESTED'
  | 'PROPOSED'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'HOST_NO_SHOW';

export const TOUR_STATUS: Record<
  TourStatus,
  { label: string; tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger' }
> = {
  REQUESTED: { label: 'Waiting for times', tone: 'warning' },
  PROPOSED: { label: 'Times offered', tone: 'info' },
  SCHEDULED: { label: 'Booked', tone: 'success' },
  COMPLETED: { label: 'Done', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  HOST_NO_SHOW: { label: 'Host did not join', tone: 'danger' },
};

export interface LandTour {
  id: string;
  status: TourStatus;
  land: string;
  propertyId: string;
  city: string;
  state: string;
  buyerName: string;
  attendeeName?: string;
  buyerTimeZone: string;
  preferredTimes?: string;
  proposedSlots: { at: string; local: string }[];
  scheduledAt?: string;
  scheduledLocal?: string;
  durationMinutes: number;
  meetingUrl?: string;
  hostNotes?: string;
  cancelReason?: string;
  buyerRating?: number;
  buyerFeedback?: string;
}

/** Tours start between 08:00 and 16:30 Lagos time, so there is daylight at the land. */
export const TOUR_FIRST_HOUR = 8;
export const TOUR_END_HOUR = 17;

/** A Lagos date and time (UTC+1, no daylight saving) as an ISO instant, or null. */
export function lagosToIso(date: string, time: string): string | null {
  if (!date || !time) return null;
  const iso = new Date(`${date}T${time}:00+01:00`);
  return Number.isNaN(iso.getTime()) ? null : iso.toISOString();
}

/** Why the offered times cannot be sent yet, or null. */
export function proposeBlocker(slots: (string | null)[], link: string, now = Date.now()) {
  const chosen = slots.filter((s): s is string => !!s);
  if (chosen.length === 0) return 'Offer at least one time.';
  if (chosen.some((s) => Date.parse(s) <= now)) return 'Every time must be in the future.';
  if (!link.trim().startsWith('https://')) return 'Add the https:// link to the video call.';
  return null;
}

export const ownerLandApi = {
  list: (page = 1, pageSize = 50) =>
    apiFetch<Paginated<OwnerLandRecord>>(`/owner/land?page=${page}&pageSize=${pageSize}`),
  upsertParcel: (propertyId: string, parcel: LandParcelInput) =>
    apiFetch<OwnerLandRecord>(`/owner/land/${propertyId}/parcel`, { method: 'PUT', body: parcel }),
  submitForReview: (propertyId: string) =>
    apiFetch<OwnerLandRecord>(`/owner/land/${propertyId}/submit`, { method: 'POST' }),
  documents: (propertyId: string) =>
    apiFetch<LandDocument[]>(`/owner/land/${propertyId}/documents`),
  uploadDocument: (propertyId: string, documentType: string, file: PickedFile) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    form.append('documentType', documentType);
    return apiUpload<LandDocument>(`/owner/land/${propertyId}/documents`, form);
  },
  deleteDocument: (propertyId: string, documentId: string) =>
    apiFetch<void>(`/owner/land/${propertyId}/documents/${documentId}`, { method: 'DELETE' }),
  risk: (propertyId: string) => apiFetch<LandRisk>(`/owner/land/${propertyId}/risk`),
  tours: () => apiFetch<LandTour[]>('/owner/land/tours'),
  proposeTour: (tourId: string, slots: string[], meetingUrl: string) =>
    apiFetch<LandTour>(`/owner/land/tours/${tourId}/propose`, {
      method: 'POST',
      body: { slots, meetingUrl: meetingUrl.trim() },
    }),
  completeTour: (tourId: string, notes: string) =>
    apiFetch<LandTour>(`/owner/land/tours/${tourId}/complete`, {
      method: 'POST',
      body: { notes: notes.trim() },
    }),
  cancelTour: (tourId: string, reason: string) =>
    apiFetch<LandTour>(`/owner/land/tours/${tourId}/cancel`, {
      method: 'POST',
      body: { reason: reason.trim() },
    }),
};
