// No runtime imports: server components pre-render `/rent` and `/buy` with it, and the api helpers reach for localStorage.

// Type-only import, so the module stays server-safe.
import type { PropertyTrustChain } from '@/types/renter';

export const PUBLIC_MARKET_PAGE_SIZE = 12;

export interface PublicListingCard {
  id: string;
  title: string;
  price: number;
  priceUnit?: 'month' | 'year';
  trustChain?: PropertyTrustChain;
  location: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  verified: boolean;
  image?: string;
}

export type PublicMarket = 'rent' | 'sale';

export interface PublicMarketFilters {
  search?: string;
  location?: string;
  estate?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  verifiedOnly?: boolean;
  furnished?: boolean;
  petsAllowed?: boolean;
  monthlyPayment?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
}

// An unticked filter means "don't filter", not "only false".
const onlyTrue = (value?: boolean) => (value ? true : undefined);

export interface RentApiItem {
  id: string;
  title: string;
  price: number;
  period?: 'month' | 'year';
  trustChain?: PropertyTrustChain;
  location: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  verified: boolean;
  image?: string;
}

export interface SaleApiItem {
  id: string;
  title: string;
  price: number;
  city?: string;
  state?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  isVerified?: boolean;
  coverImageUrl?: string;
}

// Must match the browser's default, or the server-rendered first page describes a different query.
export const DEFAULT_SORT: Record<PublicMarket, string> = {
  rent: 'recent',
  sale: 'newest',
};

const money = (value: unknown): number => {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : 0;
};

export const rentToCard = (item: RentApiItem): PublicListingCard => ({
  id: item.id,
  title: item.title,
  price: money(item.price),
  priceUnit: item.period,
  location: item.location,
  propertyType: item.propertyType,
  bedrooms: item.bedrooms,
  bathrooms: item.bathrooms,
  size: item.size,
  verified: Boolean(item.verified),
  trustChain: item.trustChain,
  image: item.image || undefined,
});

export const saleToCard = (item: SaleApiItem): PublicListingCard => ({
  id: item.id,
  title: item.title,
  price: money(item.price),
  location: [item.city, item.state].filter(Boolean).join(', '),
  propertyType: item.propertyType,
  bedrooms: item.bedrooms,
  bathrooms: item.bathrooms,
  verified: Boolean(item.isVerified),
  image: item.coverImageUrl || undefined,
});

// Only the parameters each endpoint declares: the global whitelist rejects extras.
export const rentalQuery = (filters: PublicMarketFilters) => ({
  search: filters.search || undefined,
  location: filters.location || undefined,
  estate: filters.estate || undefined,
  minPrice: filters.minPrice,
  maxPrice: filters.maxPrice,
  bedrooms: filters.bedrooms,
  bathrooms: filters.bathrooms,
  propertyType: filters.propertyType || undefined,
  verifiedOnly: onlyTrue(filters.verifiedOnly),
  furnished: onlyTrue(filters.furnished),
  petsAllowed: onlyTrue(filters.petsAllowed),
  monthlyPayment: onlyTrue(filters.monthlyPayment),
  sortBy: filters.sort,
  page: filters.page,
  pageSize: filters.pageSize,
});

export const saleQuery = (filters: PublicMarketFilters) => ({
  search: filters.search || undefined,
  city: filters.location || undefined,
  estate: filters.estate || undefined,
  minPrice: filters.minPrice,
  maxPrice: filters.maxPrice,
  bedrooms: filters.bedrooms,
  bathrooms: filters.bathrooms,
  propertyType: filters.propertyType || undefined,
  verifiedOnly: onlyTrue(filters.verifiedOnly),
  sort: filters.sort,
  page: filters.page,
  pageSize: filters.pageSize,
});

export const toQueryString = (params: Record<string, unknown>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

export const firstPagePath = (market: PublicMarket): string => {
  const filters = { page: 1, pageSize: PUBLIC_MARKET_PAGE_SIZE, sort: DEFAULT_SORT[market] };
  return market === 'rent'
    ? `/rentals${toQueryString(rentalQuery(filters))}`
    : `/marketplace/listings${toQueryString(saleQuery(filters))}`;
};
