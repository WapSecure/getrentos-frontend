import { apiFetch, apiUpload, ApiError } from './client';
import { toQuery } from './query';
import { appendFile, type PickedFile } from './documents';
import type { Tone } from './estateManager';
import type { Paginated } from './properties';

/** Routes live under `/estates/:id/...` (plural), not the office's `/estate/:id`. Publishing needs the owner's agreement. Free caps properties and live listings (PLAN_LIMIT_REACHED); bulk publishing is Enterprise (PLAN_UPGRADE_REQUIRED). */

export type AgreementStatus = 'PENDING' | 'ACTIVE' | 'DECLINED' | 'REVOKED';
export type ListingType = 'RENT' | 'SALE' | 'SHORTLET';
export type ListingStatus = 'DRAFT' | 'PENDING_VERIFICATION' | 'PUBLISHED' | 'PAUSED' | 'CLOSED';
export type ListingStatusChange = 'PUBLISHED' | 'PAUSED' | 'CLOSED';

export interface MarketplaceInventory {
  properties: number;
  /** Properties still waiting on their owner: these block new listings. */
  agreementsPending: number;
  agreementsActive: number;
  listingsPublished: number;
  listingsDraft: number;
  listingsPaused: number;
  forRent: number;
  forSale: number;
  shortLets: number;
}

export interface MarketingAgreement {
  id: string;
  estateId: string;
  estateName: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  status: AgreementStatus;
  ownerName?: string;
  requestedByEmail?: string | null;
  note?: string | null;
  decisionNote?: string | null;
  approvedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  effective: boolean;
  estateListingCount: number;
}

export interface PropertyCandidate {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  propertyType: string;
  ownerName: string;
  inThisEstate: boolean;
  agreementId: string | null;
  agreementStatus: AgreementStatus | null;
}

/** A photo on a listing. Removal takes the `key`; the `url` is signed and short-lived. */
export interface ListingPhoto {
  key: string;
  url: string;
}

export interface EstateListing {
  id: string;
  propertyId: string;
  propertyTitle: string;
  address: string;
  city: string;
  state: string;
  propertyType?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  unitName?: string | null;
  listingType: ListingType;
  listingTitle?: string | null;
  /** Whole naira: rent per period, sale outright, short let per night. */
  price: number;
  status: ListingStatus;
  availableFrom?: string;
  coverImageUrl?: string;
  /** Photos the estate supplied, cover first. Absent when it supplied none. */
  media?: ListingPhoto[];
  /** Owner of record: never the estate. */
  ownerName?: string;
  viewCount: number;
  createdAt: string;
}

export interface NewListing {
  propertyId: string;
  listingType: ListingType;
  listingTitle?: string;
  price: number;
  /** ISO date, `yyyy-MM-dd`. */
  availableFrom: string;
  publish?: boolean;
  shortlet?: {
    pricingMode?: 'PER_NIGHT' | 'PER_WEEK' | 'PER_MONTH';
    nightlyRate?: number;
    minNights?: number;
    maxGuests?: number;
  };
}

export interface BulkPublishResult {
  published: number;
  skipped: { listingId: string; reason: string }[];
}

export type LeadMarket = ListingType;

export interface EstateLead {
  id: string;
  leadName: string;
  email: string;
  phone: string;
  leadUserId?: string;
  propertyId: string;
  propertyName: string;
  ownerName?: string;
  market: LeadMarket;
  inquiryDate: string;
  lastActivityAt: string;
  trustScore: number;
  verified: boolean;
  /** The source record's status, lowercased: see `leadStageLabel`. */
  stage: string;
  offerAmount?: number;
  /** True when the estate published the listing; false when the owner did. */
  listedByEstate: boolean;
}

/**
 * Nested under the office's `['estate-manager', estateId]`, so invalidating the
 * whole estate also refreshes the marketplace.
 */
export const marketplaceKeys = {
  all: (estateId: string) => ['estate-manager', estateId, 'marketplace'] as const,
  inventory: (estateId: string) =>
    ['estate-manager', estateId, 'marketplace', 'inventory'] as const,
  agreements: (estateId: string) =>
    ['estate-manager', estateId, 'marketplace', 'agreements'] as const,
  candidates: (estateId: string, search: string) =>
    ['estate-manager', estateId, 'marketplace', 'candidates', search] as const,
  listings: (estateId: string) => ['estate-manager', estateId, 'marketplace', 'listings'] as const,
  leads: (estateId: string, market = 'ALL', search = '') =>
    ['estate-manager', estateId, 'marketplace', 'leads', { market, search }] as const,
};

export const LISTINGS_PAGE_SIZE = 30;
export const LEADS_PAGE_SIZE = 25;
/** Photos one listing may hold (the server takes what fits beyond this). */
export const MAX_LISTING_PHOTOS = 12;

export const estateMarketplaceApi = {
  inventory: (estateId: string) => apiFetch<MarketplaceInventory>(`/estates/${estateId}/inventory`),

  agreements: (estateId: string) =>
    apiFetch<MarketingAgreement[]>(`/estates/${estateId}/agreements`),
  /** Excludes properties in another estate. */
  candidates: (estateId: string, search: string) =>
    apiFetch<PropertyCandidate[]>(`/estates/${estateId}/property-candidates${toQuery({ search })}`),
  requestAgreement: (estateId: string, body: { propertyId: string; note?: string }) =>
    apiFetch<MarketingAgreement>(`/estates/${estateId}/agreements`, { method: 'POST', body }),
  /** Also ends any agreement and closes the estate's listings for it. */
  detachProperty: (estateId: string, propertyId: string) =>
    apiFetch<{ detached: boolean }>(`/estates/${estateId}/properties/${propertyId}`, {
      method: 'DELETE',
    }),

  listings: (estateId: string, page = 1) =>
    apiFetch<Paginated<EstateListing>>(
      `/estates/${estateId}/listings${toQuery({ page, pageSize: LISTINGS_PAGE_SIZE })}`
    ),
  createListing: (estateId: string, body: NewListing) =>
    apiFetch<EstateListing>(`/estates/${estateId}/listings`, { method: 'POST', body }),
  /** Only what is sent changes. */
  updateListing: (
    estateId: string,
    listingId: string,
    changes: { listingTitle?: string; price?: number; availableFrom?: string }
  ) =>
    apiFetch<EstateListing>(`/estates/${estateId}/listings/${listingId}`, {
      method: 'PATCH',
      body: changes,
    }),
  setListingStatus: (estateId: string, listingId: string, status: ListingStatusChange) =>
    apiFetch<EstateListing>(`/estates/${estateId}/listings/${listingId}/status`, {
      method: 'PATCH',
      body: { status },
    }),
  /** Enterprise. Each listing is judged on its own; refusals come back with a reason. */
  bulkPublish: (estateId: string, listingIds: string[]) =>
    apiFetch<BulkPublishResult>(`/estates/${estateId}/listings/bulk-publish`, {
      method: 'POST',
      body: { listingIds },
    }),
  addListingPhotos: (estateId: string, listingId: string, photos: PickedFile[]) => {
    const form = new FormData();
    photos.forEach((p) => appendFile(form, 'files', p));
    return apiUpload<EstateListing>(`/estates/${estateId}/listings/${listingId}/media`, form);
  },
  removeListingPhoto: (estateId: string, listingId: string, key: string) =>
    apiFetch<EstateListing>(`/estates/${estateId}/listings/${listingId}/media`, {
      method: 'DELETE',
      body: { key },
    }),

  leads: (estateId: string, opts: { market?: LeadMarket; search?: string; page?: number } = {}) =>
    apiFetch<Paginated<EstateLead>>(
      `/estates/${estateId}/leads${toQuery({
        market: opts.market,
        search: opts.search,
        page: opts.page ?? 1,
        pageSize: LEADS_PAGE_SIZE,
      })}`
    ),
};

export const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: 'RENT', label: 'For rent' },
  { value: 'SALE', label: 'For sale' },
  { value: 'SHORTLET', label: 'Short let' },
];

export const listingTypeLabel = (t: string) =>
  LISTING_TYPES.find((x) => x.value === t)?.label ?? 'Listing';

export const LISTING_STATUS: Record<ListingStatus, { label: string; tone: Tone }> = {
  PUBLISHED: { label: 'Live', tone: 'success' },
  PAUSED: { label: 'Paused', tone: 'warning' },
  DRAFT: { label: 'Draft', tone: 'info' },
  PENDING_VERIFICATION: { label: 'Being checked', tone: 'info' },
  CLOSED: { label: 'Closed', tone: 'neutral' },
};

export const listingStatus = (s: string) =>
  LISTING_STATUS[s as ListingStatus] ?? { label: s.toLowerCase(), tone: 'neutral' as Tone };

export const AGREEMENT_STATUS: Record<AgreementStatus, { label: string; tone: Tone }> = {
  ACTIVE: { label: 'Can market', tone: 'success' },
  PENDING: { label: 'Awaiting owner approval', tone: 'warning' },
  DECLINED: { label: 'Declined', tone: 'neutral' },
  REVOKED: { label: 'Revoked', tone: 'danger' },
};

export const listingName = (l: Pick<EstateListing, 'listingTitle' | 'propertyTitle'>) =>
  l.listingTitle?.trim() || l.propertyTitle;

/** A rent's period isn't on the listing. */
export const listingPricePeriod = (t: ListingType) =>
  t === 'SHORTLET' ? ('night' as const) : null;

/** Closed is final: re-opening one could sit beside a newer listing for the same property. */
export function listingMoves(status: ListingStatus): ListingStatusChange[] {
  switch (status) {
    case 'PUBLISHED':
      return ['PAUSED', 'CLOSED'];
    case 'PAUSED':
    case 'DRAFT':
    case 'PENDING_VERIFICATION':
      return ['PUBLISHED', 'CLOSED'];
    default:
      return [];
  }
}

export const MOVE_LABEL: Record<ListingStatusChange, string> = {
  PUBLISHED: 'Publish',
  PAUSED: 'Pause',
  CLOSED: 'Take down',
};

export function statusChangedMessage(l: Pick<EstateListing, 'status'>): string {
  switch (l.status) {
    case 'PUBLISHED':
      return 'Live in the market and on the estate page.';
    case 'PAUSED':
      return 'Paused. It’s hidden until you publish it again.';
    case 'CLOSED':
      return 'Taken down.';
    default:
      return 'Listing updated.';
  }
}

export const unpublishedIds = (listings: Pick<EstateListing, 'id' | 'status'>[]) =>
  listings
    .filter((l) => l.status === 'DRAFT' || l.status === 'PENDING_VERIFICATION')
    .map((l) => l.id);

export function bulkPublishMessage(r: BulkPublishResult): string {
  const published = `${r.published} ${r.published === 1 ? 'listing' : 'listings'} published`;
  if (!r.skipped.length) return `${published}.`;
  const first = r.skipped[0]?.reason;
  return `${published}, ${r.skipped.length} skipped${first ? `: ${first}` : '.'}`;
}

export const marketable = (agreements: MarketingAgreement[]) =>
  agreements.filter((a) => a.effective);

export function agreementOrder(agreements: MarketingAgreement[]): MarketingAgreement[] {
  const rank: Record<AgreementStatus, number> = { PENDING: 0, ACTIVE: 1, DECLINED: 2, REVOKED: 3 };
  return [...agreements].sort(
    (a, b) =>
      (rank[a.status] ?? 9) - (rank[b.status] ?? 9) ||
      a.propertyTitle.localeCompare(b.propertyTitle)
  );
}

export type CandidateState = 'can-market' | 'awaiting' | 'ask' | 'add';

export function candidateState(
  c: Pick<PropertyCandidate, 'agreementStatus' | 'inThisEstate'>
): CandidateState {
  if (c.agreementStatus === 'ACTIVE') return 'can-market';
  if (c.agreementStatus === 'PENDING') return 'awaiting';
  return c.inThisEstate ? 'ask' : 'add';
}

export const agreementRequestedMessage = (a: Pick<MarketingAgreement, 'status'>) =>
  a.status === 'ACTIVE'
    ? 'Added. The owner is part of this estate, so you can list it straight away.'
    : 'Request sent. The property joins this estate once the owner approves.';

/** Search needs three characters: fewer would match half the estate. */
export const MIN_CANDIDATE_SEARCH = 3;

/** Null when it isn't a positive whole amount: the API takes integers only. */
export function parseNaira(input: string): number | null {
  const cleaned = input.replace(/[₦,\s]/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Math.round(Number(cleaned));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** The asking price doubles as a short let's nightly rate. */
export function buildListing(input: {
  propertyId: string;
  listingType: ListingType;
  price: number;
  availableFrom: string;
  title?: string;
  publish: boolean;
}): NewListing {
  const title = input.title?.trim();
  return {
    propertyId: input.propertyId,
    listingType: input.listingType,
    price: input.price,
    availableFrom: input.availableFrom,
    publish: input.publish,
    ...(title ? { listingTitle: title } : {}),
    ...(input.listingType === 'SHORTLET'
      ? { shortlet: { pricingMode: 'PER_NIGHT' as const, nightlyRate: input.price } }
      : {}),
  };
}

export const createdMessage = (l: Pick<EstateListing, 'status'>) =>
  l.status === 'PUBLISHED'
    ? 'Published. It’s live in the market and on the estate page.'
    : 'Saved as a draft. Publish it when you’re ready.';

export const photoRoom = (l: Pick<EstateListing, 'media'>) =>
  Math.max(0, MAX_LISTING_PHOTOS - (l.media?.length ?? 0));

export function planGate(e: unknown): 'limit' | 'feature' | null {
  if (!(e instanceof ApiError)) return null;
  if (e.code === 'PLAN_LIMIT_REACHED') return 'limit';
  if (e.code === 'PLAN_UPGRADE_REQUIRED' || e.status === 402) return 'feature';
  return null;
}

export const LEAD_MARKET: Record<LeadMarket, { label: string; tone: Tone }> = {
  RENT: { label: 'To rent', tone: 'info' },
  SALE: { label: 'To buy', tone: 'success' },
  SHORTLET: { label: 'Short let', tone: 'warning' },
};

const STAGE_LABELS: Record<string, string> = {
  inquiry: 'Asked about it',
  new: 'New',
  contacted: 'Contacted',
  submitted: 'Applied',
  under_review: 'Under review',
  viewing_scheduled: 'Viewing booked',
  offer_made: 'Offer made',
  pending: 'Pending',
  requested: 'Requested',
  approved: 'Approved',
  confirmed: 'Confirmed',
  completed: 'Completed',
  rejected: 'Turned down',
  declined: 'Declined',
  cancelled: 'Cancelled',
  withdrawn: 'Withdrawn',
  expired: 'Expired',
};

/** An unknown status is still shown, de-underscored, rather than hidden. */
export function leadStageLabel(stage: string): string {
  const key = stage.trim().toLowerCase();
  if (STAGE_LABELS[key]) return STAGE_LABELS[key];
  const plain = key.replace(/_/g, ' ');
  return plain ? plain.charAt(0).toUpperCase() + plain.slice(1) : 'Enquiry';
}

export const isLeadClosed = (stage: string) =>
  ['rejected', 'declined', 'cancelled', 'withdrawn', 'expired', 'completed'].includes(
    stage.trim().toLowerCase()
  );
