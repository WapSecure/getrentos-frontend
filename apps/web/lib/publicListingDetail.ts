// Server-safe (no client imports). Every route read here is `@Public()` and its DTO never carries owner contact details.
import {
  fromLand,
  fromRental,
  fromSale,
  type PublicLandDto,
  type PublicRentalDto,
  type PublicSaleDto,
  type ShowroomFact,
  type ShowroomListing,
  type ShowroomMarket,
} from '@sureground/shared/showroom';
import { publicFetchInit } from '@/lib/publicFetch';

export type PublicDetailMarket = ShowroomMarket;
export type PublicListingFact = ShowroomFact;
export type PublicListingDetail = ShowroomListing;

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function get<T>(path: string): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, publicFetchInit());
  } catch (cause) {
    // Unreachable API: throw so the error boundary offers a retry, rather than a 404 telling search engines the listing is gone.
    throw new Error(`Public listing request failed: ${path}`, { cause });
  }
  // A 4xx (missing, unpublished or forbidden listing) is a real "not available".
  if (res.status >= 400 && res.status < 500) return null;
  // A 5xx is an outage, not a missing listing.
  if (!res.ok) throw new Error(`Public listing request failed (${res.status}): ${path}`);
  return (await res.json()) as T;
}

export async function fetchPublicListing(
  market: PublicDetailMarket,
  id: string
): Promise<PublicListingDetail | null> {
  const safeId = encodeURIComponent(id);
  if (market === 'rent') {
    const r = await get<PublicRentalDto>(`/rentals/${safeId}`);
    return r ? fromRental(r) : null;
  }
  if (market === 'sale') {
    const s = await get<PublicSaleDto>(`/marketplace/listings/${safeId}`);
    return s ? fromSale(s) : null;
  }
  const l = await get<PublicLandDto>(`/land/listings/${safeId}`);
  return l ? fromLand(l) : null;
}

export const MARKET_PATH: Record<PublicDetailMarket, string> = {
  rent: '/rent',
  sale: '/buy',
  land: '/land',
};
