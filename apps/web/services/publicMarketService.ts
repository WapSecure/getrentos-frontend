import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type { Paginated } from '@/lib/apiHelpers';

/**
 * One shape for the two public markets.
 *
 * Rentals and sales come from different modules with different DTOs (and
 * different query parameter names — rentals call it `location`, sales call it
 * `city`). Normalising here means the browse UI is written once and can never
 * drift into two subtly different pages, which is exactly what happened to the
 * dashboard equivalents.
 */
export interface PublicListingCard {
  id: string;
  title: string;
  price: number;
  /** Rentals only — the sale price has no period. */
  priceUnit?: 'month' | 'year';
  location: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  verified: boolean;
  /** Rentals only: the public sale projection carries no media. */
  image?: string;
}

export type PublicMarket = 'rent' | 'sale';

export interface PublicMarketFilters {
  /** Matches city/state/address. Sent as `location` for rent, `city` for sale. */
  location?: string;
  estate?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
}

interface RentApiItem {
  id: string;
  title: string;
  price: number;
  period?: 'month' | 'year';
  location: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  verified: boolean;
  image?: string;
}

interface SaleApiItem {
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

const money = (value: unknown): number => {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : 0;
};

const toCard = (item: RentApiItem): PublicListingCard => ({
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
  image: item.image || undefined,
});

const saleToCard = (item: SaleApiItem): PublicListingCard => ({
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

/** Only the parameters each endpoint actually declares — extras are rejected by the global whitelist. */
const rentalQuery = (filters: PublicMarketFilters) => ({
  location: filters.location || undefined,
  estate: filters.estate || undefined,
  minPrice: filters.minPrice,
  maxPrice: filters.maxPrice,
  sortBy: filters.sort,
  page: filters.page,
  pageSize: filters.pageSize,
});

const saleQuery = (filters: PublicMarketFilters) => ({
  city: filters.location || undefined,
  estate: filters.estate || undefined,
  minPrice: filters.minPrice,
  maxPrice: filters.maxPrice,
  sort: filters.sort,
  page: filters.page,
  pageSize: filters.pageSize,
});

const toQueryString = (params: Record<string, unknown>): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

export const publicMarketService = {
  async rentals(filters: PublicMarketFilters = {}): Promise<ApiResponse<Paginated<PublicListingCard>>> {
    return safeCall(async () => {
      const response = await authFetch<Paginated<RentApiItem>>(
        `/rentals${toQueryString(rentalQuery(filters))}`,
      );
      return { ...response, items: response.items.map(toCard) };
    });
  },

  async sales(filters: PublicMarketFilters = {}): Promise<ApiResponse<Paginated<PublicListingCard>>> {
    return safeCall(async () => {
      const response = await authFetch<Paginated<SaleApiItem>>(
        `/marketplace/listings${toQueryString(saleQuery(filters))}`,
      );
      return { ...response, items: response.items.map(saleToCard) };
    });
  },

  list(market: PublicMarket, filters: PublicMarketFilters = {}) {
    return market === 'rent' ? this.rentals(filters) : this.sales(filters);
  },
};
