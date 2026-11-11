import { apiFetch } from './client';
import { toQuery } from './query';
import type { VideoStream } from '@sureground/shared';
import type { MediaItem } from '@sureground/shared/showroom';

export interface RenterProperty {
  /** The id the save/apply endpoints use. */
  id: string;
  propertyId: string;
  title: string;
  location: string;
  /** Left out until the property is verified (a stay: until booked); see addressHidden. */
  address?: string;
  addressHidden?: boolean;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  /** `approximate` until the property is verified, and always for a stay: draw an area. */
  locationPrecision?: 'exact' | 'approximate';
  /** In the listing's own rent period (most homes are let yearly). */
  price: number;
  period: 'month' | 'year';
  bedrooms: number;
  bathrooms: number;
  size: number;
  rating: number;
  verified: boolean;
  trustChain?: { steps: { id: string; label: string; met: boolean; detail: string }[] };
  score?: number;
  image: string;
  images?: string[];
  videoTourUrl?: string;
  /** The video tour was filmed in the app at the property. */
  videoTourFilmedOnSite?: boolean;
  /** The video tour as an adaptive stream, once encoded; preferred over the file. */
  videoTourStream?: VideoStream;
  description?: string;
  amenities?: string[];
  landlordId?: string;
  landlordName?: string;
  landlordRating?: number;
  landlordReviews?: number;
  landlordVerified?: boolean;
  availableFrom?: string;
  availableUntil?: string;
  allowsMonthlyPayment?: boolean;
  /** Naira, as the landlord stated them; absent means not stated. */
  securityDeposit?: number;
  serviceCharge?: number;
  agencyFee?: number;
  legalFee?: number;
  minimumLeaseMonths?: number;
  furnished?: boolean;
  petsAllowed?: boolean;
  propertyType?: string;
  /** Photos (with rooms, captions and resized copies), video and 360 tour, in display order. */
  media?: MediaItem[];
  /** False once the unit is let or has an approved applicant; Apply is closed. */
  acceptingApplications?: boolean;
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

export const propertiesApi = {
  list: (filters: ListingFilters, page: number, pageSize = 20) =>
    apiFetch<Paginated<RenterProperty>>(
      `/renter/listings${toQuery({ ...filters, page, pageSize })}`
    ),

  getById: (id: string) => apiFetch<RenterProperty>(`/renter/listings/${id}`),
};

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
