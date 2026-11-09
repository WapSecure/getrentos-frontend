import { apiFetch } from './client';
import { toQuery } from './query';
import type { VideoStream } from '@sureground/shared';

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
  image?: string;
  images?: string[];
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

export interface BuyerDiligence {
  listingId: string;
  price: { asking: string; vsSimilar: string | null };
  items: {
    key: string;
    title: string;
    status: 'done' | 'in_progress' | 'to_do' | 'concern';
    finding: string;
    why: string;
  }[];
  summary: string;
  questions: string[];
  disclaimer: string;
}

export const buyerApi = {
  diligence: (listingId: string) =>
    apiFetch<BuyerDiligence>(`/buyer/listings/${listingId}/diligence`),
  dashboard: () => apiFetch<BuyerDashboard>('/buyer/dashboard'),

  profile: () => apiFetch<BuyerProfile>('/buyer/profile'),

  updateProfile: (input: { legalName?: string; phone?: string; avatarUrl?: string }) =>
    apiFetch<BuyerProfile>('/buyer/profile', { method: 'PUT', body: input }),

  listings: (filters: ListingFilters, page = 1, pageSize = 20) =>
    apiFetch<Paginated<BuyerListing>>(`/buyer/listings${toQuery({ ...filters, page, pageSize })}`),

  recommendations: () => apiFetch<BuyerListing[]>('/buyer/listings/recommendations'),

  getListing: (id: string) => apiFetch<BuyerListing>(`/buyer/listings/${id}`),
};
