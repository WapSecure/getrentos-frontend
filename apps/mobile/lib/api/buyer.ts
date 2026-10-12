import { apiFetch } from './client';
import type { VideoStream } from '@getrentos/shared';

export interface BuyerDashboard {
  savedListings: number;
  activeOffers: number;
  upcomingViewings: number;
  activeTransactions: number;
  documentsUploaded: number;
  completedPurchases: number;
  recommendations?: { id: string; title: string; price: number; city: string }[];
  recentActivity: { id: string; type: string; message: string; timestamp: string }[];
}

export interface BuyerProfile {
  legalName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  trustScore: number;
  verificationStatus: string;
}

/** What an offer or a viewing request needs to know about a for-sale listing, house or land. */
export type BuyerListingTarget = Pick<BuyerListing, 'id' | 'title' | 'askingPrice'>;

export interface BuyerListing {
  id: string;
  title: string;
  propertyType: string;
  askingPrice: number;
  /** Left out until the property is verified (a stay: until booked); see addressHidden. */
  address?: string;
  addressHidden?: boolean;
  city: string;
  state: string;
  bedrooms?: number;
  bathrooms?: number;
  propertySize?: number;
  features?: string[];
  description: string;
  ownerName: string;
  ownerVerified: boolean;
  listedDate: string;
  /** Signed URL for the cover image. */
  image?: string;
  /** Signed URLs for the gallery. */
  images?: string[];
  /** Signed URL for the video tour. */
  videoTourUrl?: string;
  /** The video tour was filmed in the app at the property. */
  videoTourFilmedOnSite?: boolean;
  /** The video tour as an adaptive stream, once encoded; preferred over the file. */
  videoTourStream?: VideoStream;
  latitude?: number;
  longitude?: number;
  /** `approximate` until the property is verified, and always for a stay: draw an area. */
  locationPrecision?: 'exact' | 'approximate';
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListingFilters {
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  propertyType?: string;
  sort?: 'price_asc' | 'price_desc';
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

export const buyerApi = {
  dashboard: () => apiFetch<BuyerDashboard>('/buyer/dashboard'),

  profile: () => apiFetch<BuyerProfile>('/buyer/profile'),

  updateProfile: (input: { legalName?: string; phone?: string; avatarUrl?: string }) =>
    apiFetch<BuyerProfile>('/buyer/profile', { method: 'PUT', body: input }),

  listings: (filters: ListingFilters, page = 1, pageSize = 20) =>
    apiFetch<Paginated<BuyerListing>>(`/buyer/listings${toQuery({ ...filters, page, pageSize })}`),

  recommendations: () => apiFetch<BuyerListing[]>('/buyer/listings/recommendations'),

  getListing: (id: string) => apiFetch<BuyerListing>(`/buyer/listings/${id}`),
};
