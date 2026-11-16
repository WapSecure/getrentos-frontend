import { OPTIONAL_FETCH_TIMEOUT_MS, publicFetchInit } from '@/lib/publicFetch';
import {
  firstPagePath,
  rentToCard,
  saleToCard,
  type PublicListingCard,
  type PublicMarket,
  type RentApiItem,
  type SaleApiItem,
} from '@/lib/publicListingMap';
import type { Paginated } from '@/lib/apiHelpers';

export async function latestListings(
  market: PublicMarket,
  limit: number
): Promise<PublicListingCard[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(
      `${apiUrl}${firstPagePath(market)}`,
      publicFetchInit({ timeoutMs: OPTIONAL_FETCH_TIMEOUT_MS })
    );
    if (!res.ok) return [];
    if (market === 'rent') {
      const data = (await res.json()) as Paginated<RentApiItem>;
      return data.items.slice(0, limit).map(rentToCard);
    }
    const data = (await res.json()) as Paginated<SaleApiItem>;
    return data.items.slice(0, limit).map(saleToCard);
  } catch {
    return [];
  }
}
