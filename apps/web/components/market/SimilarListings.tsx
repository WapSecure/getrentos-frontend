'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Home, MapPin } from 'lucide-react';
import { Skeleton } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';
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
            <Skeleton key={item} className="h-72 rounded-3xl" />
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
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {listings.map((listing) => {
          const href = `${market === 'rent' ? '/rent' : '/buy'}/${listing.id}`;
          return (
            <article
              key={listing.id}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <Link href={href} tabIndex={-1} aria-hidden="true">
                {listing.image ? (
                  <div
                    role="img"
                    aria-label={listing.title}
                    className="h-44 bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
                    style={{ backgroundImage: `url(${listing.image})` }}
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-muted">
                    <Home className="h-7 w-7 text-primary/40" />
                  </div>
                )}
              </Link>
              <SaveListingButton
                listingId={listing.id}
                returnPath={href}
                className="absolute right-3 top-3"
              />
              <div className="p-5">
                <p className="font-bold text-foreground">
                  {formatCurrency(listing.price)}
                  {listing.priceUnit ? (
                    <span className="text-xs font-normal text-muted-foreground">
                      /{listing.priceUnit}
                    </span>
                  ) : null}
                </p>
                <h3 className="mt-1 font-semibold text-foreground">
                  <Link
                    href={href}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {listing.title}
                  </Link>
                </h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{listing.location}</span>
                </p>
                <Link
                  href={href}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"
                >
                  View details <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
