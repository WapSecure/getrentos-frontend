import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type { Paginated } from '@/lib/apiHelpers';
import type {
  BulkPublishResult,
  EstateAgreement,
  EstateDirectoryEntry,
  EstateInventorySummary,
  EstateLead,
  EstateLeadMarket,
  EstateListing,
  EstateListingType,
  EstatePropertySummary,
  EstateStorefront,
  EstateStorefrontListing,
} from '@/types/estate-marketplace';

export interface CreateEstateListingInput {
  propertyId: string;
  unitId?: string;
  listingType: EstateListingType;
  listingTitle?: string;
  price: number;
  securityDeposit?: number;
  minimumLeaseMonths?: number;
  availableFrom: string;
  availableUntil?: string;
  amenities?: string[];
  allowPets?: boolean;
  furnished?: boolean;
  publish?: boolean;
  shortlet?: {
    pricingMode?: 'PER_NIGHT' | 'PER_WEEK' | 'PER_MONTH';
    nightlyRate?: number;
    cleaningFee?: number;
    minNights?: number;
    maxGuests?: number;
    instantBooking?: boolean;
  };
}

export interface EstatePropertyCandidate {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  propertyType: string;
  ownerName: string;
  /** Already inside THIS estate. */
  inThisEstate: boolean;
  agreementId: string | null;
  agreementStatus: 'PENDING' | 'ACTIVE' | 'DECLINED' | 'REVOKED' | null;
}

export interface StorefrontListingFilters {
  listingType?: EstateListingType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  sortBy?: 'recent' | 'price-low' | 'price-high';
  page?: number;
  pageSize?: number;
}

// Generic rather than `Record<string, …>`: a named filter interface has no index
// signature, so it is not assignable to a record parameter.
const query = <T extends object>(params: T) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const suffix = search.toString();
  return suffix ? `?${suffix}` : '';
};

/**
 * The estate's own marketplace console.
 *
 * Every call here is scoped to an estate the caller belongs to. Membership is
 * resolved server-side through the estate's organization, so there is no role
 * check on the client to keep in step — an estate's staff are platform users of
 * whatever role they happen to hold.
 */
export const estateMarketplaceService = {
  getInventory(estateId: string): Promise<ApiResponse<EstateInventorySummary>> {
    return safeCall(() => authFetch(`/estates/${estateId}/inventory`));
  },

  /**
   * Find a property to bring in. Estate staff know their addresses but cannot
   * guess a GetRentos property id, so this is what makes the attach flow usable.
   */
  listPropertyCandidates(
    estateId: string,
    search?: string,
  ): Promise<ApiResponse<EstatePropertyCandidate[]>> {
    return safeCall(() => authFetch(`/estates/${estateId}/property-candidates${query({ search })}`));
  },

  listAgreements(
    estateId: string,
    filters: { status?: string } = {},
  ): Promise<ApiResponse<EstateAgreement[]>> {
    return safeCall(() => authFetch(`/estates/${estateId}/agreements${query(filters)}`));
  },

  /**
   * Enquiries on the properties this estate markets. Scoped server-side to
   * properties the estate currently holds marketing rights for.
   */
  listLeads(
    estateId: string,
    filters: { market?: EstateLeadMarket; stage?: string; search?: string; page?: number; pageSize?: number } = {},
  ): Promise<ApiResponse<Paginated<EstateLead>>> {
    return safeCall(() => authFetch(`/estates/${estateId}/leads${query(filters)}`));
  },

  /** Brings the property into the estate and asks its owner for marketing rights. */
  requestAgreement(
    estateId: string,
    input: { propertyId: string; note?: string },
  ): Promise<ApiResponse<EstateAgreement>> {
    return safeCall(() =>
      authFetch(`/estates/${estateId}/agreements`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    );
  },

  detachProperty(estateId: string, propertyId: string): Promise<ApiResponse<{ detached: boolean }>> {
    return safeCall(() =>
      authFetch(`/estates/${estateId}/properties/${propertyId}`, { method: 'DELETE' }),
    );
  },

  /**
   * Attach photos to a listing the estate published.
   *
   * Photos belong to the LISTING, not the property: an estate is photographing an
   * asset it does not own, so this never touches the owner's property record. The
   * server re-checks the marketing agreement, and takes what fits if the upload
   * exceeds the cap rather than failing the whole batch.
   */
  addListingMedia(
    estateId: string,
    listingId: string,
    files: File[],
  ): Promise<ApiResponse<EstateListing>> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return safeCall(() =>
      authFetch(`/estates/${estateId}/listings/${listingId}/media`, {
        method: 'POST',
        body: formData,
      }),
    );
  },

  /** Removes one photo. Takes the storage key, not the signed URL. */
  removeListingMedia(
    estateId: string,
    listingId: string,
    key: string,
  ): Promise<ApiResponse<EstateListing>> {
    return safeCall(() =>
      authFetch(`/estates/${estateId}/listings/${listingId}/media`, {
        method: 'DELETE',
        body: JSON.stringify({ key }),
      }),
    );
  },

  listListings(
    estateId: string,
    filters: { listingType?: EstateListingType; status?: string; page?: number; pageSize?: number } = {},
  ): Promise<ApiResponse<Paginated<EstateListing>>> {
    return safeCall(() => authFetch(`/estates/${estateId}/listings${query(filters)}`));
  },

  createListing(
    estateId: string,
    input: CreateEstateListingInput,
  ): Promise<ApiResponse<EstateListing>> {
    return safeCall(() =>
      authFetch(`/estates/${estateId}/listings`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    );
  },

  setListingStatus(
    estateId: string,
    listingId: string,
    status: 'PUBLISHED' | 'PAUSED' | 'CLOSED',
  ): Promise<ApiResponse<EstateListing>> {
    return safeCall(() =>
      authFetch(`/estates/${estateId}/listings/${listingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    );
  },

  /** Enterprise: publish a batch, with a per-listing reason for anything refused. */
  bulkPublish(estateId: string, listingIds: string[]): Promise<ApiResponse<BulkPublishResult>> {
    return safeCall(() =>
      authFetch(`/estates/${estateId}/listings/bulk-publish`, {
        method: 'POST',
        body: JSON.stringify({ listingIds }),
      }),
    );
  },
};

/** The property owner's side: requests waiting on them, and what is already live. */
export const estateAgreementService = {
  mine(): Promise<ApiResponse<EstateAgreement[]>> {
    return safeCall(() => authFetch('/estate-agreements/mine'));
  },

  approve(
    id: string,
    input: { note?: string; expiresInDays?: number } = {},
  ): Promise<ApiResponse<EstateAgreement>> {
    return safeCall(() =>
      authFetch(`/estate-agreements/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    );
  },

  decline(id: string, reason: string): Promise<ApiResponse<EstateAgreement>> {
    return safeCall(() =>
      authFetch(`/estate-agreements/${id}/decline`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    );
  },

  revoke(id: string, reason: string): Promise<ApiResponse<EstateAgreement>> {
    return safeCall(() =>
      authFetch(`/estate-agreements/${id}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    );
  },
};

/** Public storefront reads — no account needed, since a storefront is a share target. */
export const estateStorefrontService = {
  directory(
    filters: { search?: string; city?: string; state?: string; page?: number; pageSize?: number } = {},
  ): Promise<ApiResponse<Paginated<EstateDirectoryEntry>>> {
    return safeCall(() => authFetch(`/estate-storefronts${query(filters)}`));
  },

  /** The estate's public page itself. 404s for a dead or unentitled estate. */
  getStorefront(slug: string): Promise<ApiResponse<EstateStorefront>> {
    return safeCall(() => authFetch(`/estate-storefronts/${slug}`));
  },

  listListings(
    slug: string,
    filters: StorefrontListingFilters = {},
  ): Promise<ApiResponse<Paginated<EstateStorefrontListing>>> {
    return safeCall(() => authFetch(`/estate-storefronts/${slug}/listings${query(filters)}`));
  },

  listProperties(slug: string): Promise<ApiResponse<EstatePropertySummary[]>> {
    return safeCall(() => authFetch(`/estate-storefronts/${slug}/properties`));
  },
};
