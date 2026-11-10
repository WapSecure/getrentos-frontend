'use client';

import { useQuery } from '@tanstack/react-query';
import { ListingCard, Skeleton } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { publicMarketService, type PublicMarket } from '@/services/publicMarketService';
import { SaveListingButton } from './SaveListingButton';

export function SimilarListings({
  listingId,
  market,
  location,
  price,
  bedrooms,
}: {
  listingId: string;
  market: PublicMarket;
  location: string;
  price: number;
  bedrooms?: number;
}) {
  const query = useQuery({
    queryKey: ['public-market', market, 'similar', listingId, location, price, bedrooms],
    queryFn: () =>
      unwrap(
        publicMarketService.list(market, {
          location: location.split(',')[0]?.trim(),
          minPrice: Math.max(0, Math.round(price * 0.7)),
          maxPrice: Math.round(price * 1.3),
          bedrooms,
          page: 1,
          pageSize: 4,
        })
      ),
    staleTime: 5 * 60_000,
  });
  const listings = (query.data?.items ?? []).filter((item) => item.id !== listingId).slice(0, 3);

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
        Comparable options in the same area and price range.
      </p>
      <div className="mt-6 grid gap-x-5 gap-y-8 md:grid-cols-3">
        {listings.map((listing) => {
          const href = `${market === 'rent' ? '/rent' : '/buy'}/${listing.id}`;
          return (
            <ListingCard
              key={listing.id}
              href={href}
              title={listing.title}
              location={listing.location}
              price={listing.price}
              priceUnit={listing.priceUnit}
              image={listing.image}
              imageAlt={listing.title}
              status={market === 'rent' ? 'For rent' : 'For sale'}
              verified={listing.verified}
              facts={{
                beds: listing.bedrooms,
                baths: listing.bathrooms,
                size: listing.size,
                type: listing.propertyType,
              }}
              actions={
                <SaveListingButton listingId={listing.id} returnPath={href} appearance="card" />
              }
            />
          );
        })}
      </div>
    </section>
  );
}
