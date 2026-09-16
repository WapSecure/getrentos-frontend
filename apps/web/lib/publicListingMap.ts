/**
 * Server-safe listing normalisation.
 *
 * Deliberately has NO imports: this module is used by BOTH the client market
 * service and the server components that pre-render `/rent` and `/buy`. If it
 * pulled in the api helpers (which reach for localStorage through the auth
 * storage) the server render would break — and if the mapping lived only in the
 * client service, the pages could not be server-rendered at all, which is the
 * whole point of separating it out.
 *
 * Rentals and sales come from different modules with different DTOs and even
 * different query parameter names (rentals call the filter `location`, sales call
 * it `city`). Normalising here means the browse UI is written once and cannot
 * drift into two subtly different pages.
 */

export const PUBLIC_MARKET_PAGE_SIZE = 12;

export interface PublicListingCard {
  id: string;
  title: string;
  price: number;
  /** Rentals only — a sale price has no period. */
  priceUnit?: 'month' | 'year';
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
  location?: string;
  estate?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface RentApiItem {
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

/** The sort each market defaults to. Must match the browser's default, or the
 * server-rendered first page would describe a different query than the client's. */
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

/** Only the parameters each endpoint declares — extras are rejected by the global whitelist. */
export const rentalQuery = (filters: PublicMarketFilters) => ({
  location: filters.location || undefined,
  estate: filters.estate || undefined,
  minPrice: filters.minPrice,
  maxPrice: filters.maxPrice,
  sortBy: filters.sort,
  page: filters.page,
  pageSize: filters.pageSize,
});

export const saleQuery = (filters: PublicMarketFilters) => ({
  city: filters.location || undefined,
  estate: filters.estate || undefined,
  minPrice: filters.minPrice,
  maxPrice: filters.maxPrice,
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

/** The path the server should fetch for a market's unfiltered first page. */
export const firstPagePath = (market: PublicMarket): string => {
  const filters = { page: 1, pageSize: PUBLIC_MARKET_PAGE_SIZE, sort: DEFAULT_SORT[market] };
  return market === 'rent'
    ? `/rentals${toQueryString(rentalQuery(filters))}`
    : `/marketplace/listings${toQueryString(saleQuery(filters))}`;
};
