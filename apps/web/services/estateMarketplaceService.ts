import type { PropertyMediaDetails } from '@/types/landlord';
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

// Generic, not `Record<string, …>`: a named filter interface has no index signature, so is not
// assignable to a record.
const query = <T extends object>(params: T) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const suffix = search.toString();
  return suffix ? `?${suffix}` : '';
};

/** Membership is resolved server-side, so there is no client role check to keep in step. */
export const estateMarketplaceService = {
  getInventory(estateId: string): Promise<ApiResponse<EstateInventorySummary>> {
    return safeCall(() => authFetch(`/estates/${estateId}/inventory`));
  },

  listPropertyCandidates(
    estateId: string,
    search?: string
  ): Promise<ApiResponse<EstatePropertyCandidate[]>> {
    return safeCall(() =>
      authFetch(`/estates/${estateId}/property-candidates${query({ search })}`)
    );
  },

  listAgreements(
    estateId: string,
    filters: { status?: string } = {}
  ): Promise<ApiResponse<EstateAgreement[]>> {
    return safeCall(() => authFetch(`/estates/${estateId}/agreements${query(filters)}`));
  },

  listLeads(
    estateId: string,
    filters: {
      market?: EstateLeadMarket;
      stage?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<ApiResponse<Paginated<EstateLead>>> {
    return safeCall(() => authFetch(`/estates/${estateId}/leads${query(filters)}`));
  },

  requestAgreement(
    estateId: string,
    input: { propertyId: string; note?: string }
  ): Promise<ApiResponse<EstateAgreement>> {
    return safeCall(() =>
      authFetch(`/estates/${estateId}/agreements`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  detachProperty(
    estateId: string,
    propertyId: string
  ): Promise<ApiResponse<{ detached: boolean }>> {
    return safeCall(() =>
      authFetch(`/estates/${estateId}/properties/${propertyId}`, { method: 'DELETE' })
    );
  },

  /**
   * Photos belong to the listing, not the property; the server takes what fits if the batch exceeds
   * the cap.
   */
  addListingMedia(
    estateId: string,
    listingId: string,
    files: File[]
  ): Promise<ApiResponse<EstateListing>> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return safeCall(() =>
      authFetch(`/estates/${estateId}/listings/${listingId}/media`, {
        method: 'POST',
        body: formData,
      })
    );
  },

  /** Replaces this listing's photo details; `null` clears them. Keys are this listing's own photos. */
  updateListingMediaDetails(
    estateId: string,
    listingId: string,
    mediaDetails: PropertyMediaDetails | null
  ): Promise<ApiResponse<EstateListing>> {
    return safeCall(() =>
      authFetch(`/estates/${estateId}/listings/${listingId}/media`, {
        method: 'PATCH',
        body: JSON.stringify({ mediaDetails }),
      })
    );
  },

  /** Takes the storage key, not the signed URL. */
  removeListingMedia(
    estateId: string,
    listingId: string,
    key: string
  ): Promise<ApiResponse<EstateListing>> {
    return safeCall(() =>
      authFetch(`/estates/${estateId}/listings/${listingId}/media`, {
        method: 'DELETE',
        body: JSON.stringify({ key }),
      })
    );
  },

  listListings(
    estateId: string,
    filters: {
      listingType?: EstateListingType;
      status?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<ApiResponse<Paginated<EstateListing>>> {
    return safeCall(() => authFetch(`/estates/${estateId}/listings${query(filters)}`));
  },

  createListing(
    estateId: string,
    input: CreateEstateListingInput
  ): Promise<ApiResponse<EstateListing>> {
    return safeCall(() =>
      authFetch(`/estates/${estateId}/listings`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  /** Only the fields sent change. */
  updateListing(
    estateId: string,
    listingId: string,
    changes: { listingTitle?: string; price?: number; availableFrom?: string }
  ): Promise<ApiResponse<EstateListing>> {
    return safeCall(() =>
      authFetch(`/estates/${estateId}/listings/${listingId}`, {
        method: 'PATCH',
        body: JSON.stringify(changes),
      })
    );
  },

  setListingStatus(
    estateId: string,
    listingId: string,
    status: 'PUBLISHED' | 'PAUSED' | 'CLOSED'
  ): Promise<ApiResponse<EstateListing>> {
    return safeCall(() =>
      authFetch(`/estates/${estateId}/listings/${listingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
    );
  },

  /** Refusals come back per listing, with a reason. */
  bulkPublish(estateId: string, listingIds: string[]): Promise<ApiResponse<BulkPublishResult>> {
    return safeCall(() =>
      authFetch(`/estates/${estateId}/listings/bulk-publish`, {
        method: 'POST',
        body: JSON.stringify({ listingIds }),
      })
    );
  },
};

export const estateAgreementService = {
  mine(): Promise<ApiResponse<EstateAgreement[]>> {
    return safeCall(() => authFetch('/estate-agreements/mine'));
  },

  approve(
    id: string,
    input: { note?: string; expiresInDays?: number } = {}
  ): Promise<ApiResponse<EstateAgreement>> {
    return safeCall(() =>
      authFetch(`/estate-agreements/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  decline(id: string, reason: string): Promise<ApiResponse<EstateAgreement>> {
    return safeCall(() =>
      authFetch(`/estate-agreements/${id}/decline`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    );
  },

  revoke(id: string, reason: string): Promise<ApiResponse<EstateAgreement>> {
    return safeCall(() =>
      authFetch(`/estate-agreements/${id}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    );
  },
};

/** No account needed: a storefront is a share target. */
export const estateStorefrontService = {
  directory(
    filters: {
      search?: string;
      city?: string;
      state?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<ApiResponse<Paginated<EstateDirectoryEntry>>> {
    return safeCall(() => authFetch(`/estate-storefronts${query(filters)}`));
  },

  /** 404s for a dead or unentitled estate. */
  getStorefront(slug: string): Promise<ApiResponse<EstateStorefront>> {
    return safeCall(() => authFetch(`/estate-storefronts/${slug}`));
  },

  listListings(
    slug: string,
    filters: StorefrontListingFilters = {}
  ): Promise<ApiResponse<Paginated<EstateStorefrontListing>>> {
    return safeCall(() => authFetch(`/estate-storefronts/${slug}/listings${query(filters)}`));
  },

  listProperties(slug: string): Promise<ApiResponse<EstatePropertySummary[]>> {
    return safeCall(() => authFetch(`/estate-storefronts/${slug}/properties`));
  },
};
