import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type { Paginated } from '@/lib/apiHelpers';
import {
  rentToCard,
  rentalQuery,
  saleQuery,
  saleToCard,
  toQueryString,
  type PublicListingCard,
  type PublicMarket,
  type PublicMarketFilters,
  type RentApiItem,
  type SaleApiItem,
} from '@/lib/publicListingMap';

// The market types live with the mapping, so the server-rendered first page of
// /rent and /buy and this client service cannot describe a listing differently.
export type { PublicListingCard, PublicMarket, PublicMarketFilters } from '@/lib/publicListingMap';

export const publicMarketService = {
  async rentals(filters: PublicMarketFilters = {}): Promise<ApiResponse<Paginated<PublicListingCard>>> {
    return safeCall(async () => {
      const response = await authFetch<Paginated<RentApiItem>>(
        `/rentals${toQueryString(rentalQuery(filters))}`,
      );
      return { ...response, items: response.items.map(rentToCard) };
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
