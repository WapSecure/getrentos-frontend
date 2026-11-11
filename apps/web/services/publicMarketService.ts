import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type { GeoInsights } from '@/types/renter';
import type { Paginated } from '@/lib/apiHelpers';
import {
  rentToCard,
  rentalQuery,
  saleQuery,
  saleToCard,
  similarPath,
  toQueryString,
  type PublicListingCard,
  type PublicMarket,
  type PublicMarketFilters,
  type RentApiItem,
  type SaleApiItem,
} from '@/lib/publicListingMap';

// The market types live with the mapping so the server-rendered first page and this service
// describe a listing identically.
export type { PublicListingCard, PublicMarket, PublicMarketFilters } from '@/lib/publicListingMap';

export const publicMarketService = {
  /** Public, so anyone viewing a published listing sees the neighbourhood, not only signed-in renters. */
  geoInsights: (id: string, destination?: string) =>
    safeCall(() =>
      authFetch<GeoInsights>(
        `/marketplace/listings/${encodeURIComponent(id)}/geo-insights${
          destination ? `?destination=${encodeURIComponent(destination)}` : ''
        }`
      )
    ),

  savedListingIds: () => safeCall(() => authFetch<string[]>('/marketplace/saved-listing-ids')),

  saveListing: (listingId: string) =>
    safeCall(() =>
      authFetch<{ saved: boolean }>(`/marketplace/listings/${listingId}/save`, {
        method: 'POST',
      })
    ),

  unsaveListing: (listingId: string) =>
    safeCall(() =>
      authFetch<{ saved: boolean }>(`/marketplace/listings/${listingId}/save`, {
        method: 'DELETE',
      })
    ),

  async rentals(
    filters: PublicMarketFilters = {}
  ): Promise<ApiResponse<Paginated<PublicListingCard>>> {
    return safeCall(async () => {
      const response = await authFetch<Paginated<RentApiItem>>(
        `/rentals${toQueryString(rentalQuery(filters))}`
      );
      return { ...response, items: response.items.map(rentToCard) };
    });
  },

  async sales(
    filters: PublicMarketFilters = {}
  ): Promise<ApiResponse<Paginated<PublicListingCard>>> {
    return safeCall(async () => {
      const response = await authFetch<Paginated<SaleApiItem>>(
        `/marketplace/listings${toQueryString(saleQuery(filters))}`
      );
      return { ...response, items: response.items.map(saleToCard) };
    });
  },

  list(market: PublicMarket, filters: PublicMarketFilters = {}) {
    return market === 'rent' ? this.rentals(filters) : this.sales(filters);
  },

  /** Ranked on the server: same market, nearby, a comparable price and about the same bedrooms. */
  similar(market: PublicMarket, id: string, limit = 3): Promise<ApiResponse<PublicListingCard[]>> {
    return safeCall(async () => {
      const items = await authFetch<Array<RentApiItem & SaleApiItem>>(
        similarPath(market, id, limit)
      );
      return items.map(market === 'rent' ? rentToCard : saleToCard);
    });
  },
};
