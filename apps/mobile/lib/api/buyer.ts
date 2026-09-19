import { apiFetch } from './client';

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

export interface BuyerListing {
  id: string;
  title: string;
  propertyType: string;
  askingPrice: number;
  address: string;
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
  latitude?: number;
  longitude?: number;
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
