'use client';

import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@sureground/ui/Skeleton';
import { authFetch, unwrap, safeCall } from '@/lib/apiHelpers';
import {
  fromLandCard,
  fromPublicCard,
  fromShortletCard,
  type LandCardApi,
  type MarketCard,
  type ShortletCardApi,
} from '@/lib/marketCards';
import { publicMarketService } from '@/services/publicMarketService';
import { MarketListingCard } from './MarketListingCard';

export type SimilarMarket = 'rent' | 'sale' | 'land' | 'shortlet';

const LIMIT = 3;

/** Ranked by the server: same market, nearby, a comparable price and about the same bedrooms. */
async function fetchSimilar(market: SimilarMarket, id: string): Promise<MarketCard[]> {
  const path = (base: string) => `${base}/${encodeURIComponent(id)}/similar?limit=${LIMIT}`;
  if (market === 'rent' || market === 'sale') {
    const cards = await unwrap(publicMarketService.similar(market, id, LIMIT));
    return cards.map(fromPublicCard);
  }
  if (market === 'land') {
    const items = await unwrap(safeCall(() => authFetch<LandCardApi[]>(path('/land/listings'))));
    return items.map(fromLandCard);
  }
  const items = await unwrap(safeCall(() => authFetch<ShortletCardApi[]>(path('/shortlets'))));
  return items.map(fromShortletCard);
}

export function SimilarListings({
  listingId,
  market,
}: {
  listingId: string;
  market: SimilarMarket;
}) {
  const query = useQuery({
    queryKey: ['public-market', market, 'similar', listingId],
    queryFn: () => fetchSimilar(market, listingId),
    staleTime: 5 * 60_000,
  });
  const listings = query.data ?? [];

  if (query.isLoading) {
    return (
      <section aria-label="Loading similar listings" className="mt-14 border-t border-border pt-10">
        <Skeleton className="h-7 w-48" />
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-72 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }
  if (!listings.length) return null;

  return (
    <section aria-labelledby="similar-listings" className="mt-14 border-t border-border pt-10">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Keep exploring</p>
      <h2 id="similar-listings" className="mt-1 text-2xl font-semibold tracking-tight">
        Similar listings
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Nearby options at a similar price{market === 'land' ? '' : ' and size'}.
      </p>
      <div className="mt-6 grid gap-x-5 gap-y-8 md:grid-cols-3">
        {listings.map((listing, position) => (
          <MarketListingCard
            key={listing.id}
            listing={listing}
            market={market}
            surface={`${market}_similar`}
            position={position}
          />
        ))}
      </div>
    </section>
  );
}
