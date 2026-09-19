import { apiFetch } from './client';

/** One rental listing as returned by `/renter/listings`. Mirrors `RenterPropertyDto`. */
export interface RenterProperty {
  /** Listing id — the id used by save/apply endpoints. */
  id: string;
  /** Underlying property id. */
  propertyId: string;
  title: string;
  location: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  price: number;
  period: 'month';
  bedrooms: number;
  bathrooms: number;
  size: number;
  rating: number;
  verified: boolean;
  score?: number;
  image: string;
  /** Signed URLs for the full gallery (cover first). */
  images?: string[];
  /** Signed URL for the video tour. */
  videoTourUrl?: string;
  description?: string;
  amenities?: string[];
  landlordId?: string;
  landlordName?: string;
  landlordEmail?: string;
  landlordPhone?: string;
  landlordRating?: number;
  landlordReviews?: number;
  landlordVerified?: boolean;
  availableFrom?: string;
  reviews?: {
    id: string;
    author: string;
    rating: number;
    date: string;
    comment: string;
  }[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** The six values of the backend `PropertyType` enum. */
export const PROPERTY_TYPES = [
  'APARTMENT',
  'DUPLEX',
  'CONDO',
  'COMMERCIAL',
  'LAND',
  'SHARED_APARTMENT',
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  APARTMENT: 'Apartment',
  DUPLEX: 'Duplex',
  CONDO: 'Condo',
  COMMERCIAL: 'Commercial',
  LAND: 'Land',
  SHARED_APARTMENT: 'Shared',
};

/** Mirrors the backend's `RENTER_LISTING_SORTS`. */
export const LISTING_SORTS = ['recent', 'price-low', 'price-high', 'trust-score'] as const;
export type ListingSort = (typeof LISTING_SORTS)[number];

export const LISTING_SORT_LABEL: Record<ListingSort, string> = {
  recent: 'Newest',
  'price-low': 'Price: low to high',
  'price-high': 'Price: high to low',
  'trust-score': 'Top rated',
};

/** Listing filters. `undefined` fields are omitted from the request. */
export interface ListingFilters {
  search?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: PropertyType;
  verifiedOnly?: boolean;
  sortBy?: ListingSort;
}

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '' || v === false) continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const propertiesApi = {
  list: (filters: ListingFilters, page: number, pageSize = 20) =>
    apiFetch<Paginated<RenterProperty>>(
      `/renter/listings${toQuery({ ...filters, page, pageSize })}`
    ),

  getById: (id: string) => apiFetch<RenterProperty>(`/renter/listings/${id}`),
};

/** A saved listing — a `RenterProperty` plus the save metadata. */
export type SavedProperty = RenterProperty & {
  savedListingId: string;
  wishlistId: string | null;
  note: string | null;
  savedAt: string;
  applicationStatus?: string;
};

export const savedListingsApi = {
  list: (page = 1, pageSize = 50, wishlistId?: string) =>
    apiFetch<Paginated<SavedProperty>>(
      `/renter/saved-listings${toQuery({ page, pageSize, wishlistId })}`
    ),

  save: (listingId: string, wishlistId?: string) =>
    apiFetch<{ saved: boolean }>(`/renter/saved-listings/${listingId}`, {
      method: 'POST',
      body: { wishlistId },
    }),

  unsave: (listingId: string) =>
    apiFetch<void>(`/renter/saved-listings/${listingId}`, { method: 'DELETE' }),

  setWishlist: (savedListingId: string, wishlistId: string | null) =>
    apiFetch<{ updated: boolean }>(`/renter/saved-listings/${savedListingId}/wishlist`, {
      method: 'PATCH',
      body: { wishlistId },
    }),

  setNote: (savedListingId: string, note: string | null) =>
    apiFetch<{ updated: boolean; note: string | null }>(
      `/renter/saved-listings/${savedListingId}/note`,
      {
        method: 'PATCH',
        body: { note },
      }
    ),
};
