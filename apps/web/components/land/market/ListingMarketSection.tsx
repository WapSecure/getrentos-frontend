'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, MapPin, ShieldCheck } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import { landKeys } from '@/lib/queryKeys';
import { landMarketKeys } from '@/lib/landSalesQueryKeys';
import { landService } from '@/services/landService';
import { landMarketService } from '@/services/landMarketService';
import {
  LAND_ASSURANCE_TIER_LABELS,
  LAND_TITLE_TYPE_LABELS,
  type LandAssuranceTier,
} from '@/types/land';
import { LAND_ASSURANCE_TIER_DESCRIPTIONS } from '@/types/landMarket';
import { AssuranceTierBadge } from './AssuranceTierBadge';
import { PricePositionBar } from './PricePositionBar';

/**
 * Market context under a public land listing: its assurance tier, where its
 * price per m² sits among comparable verified land, and those comparables.
 * Everything here comes from public endpoints; a failure hides the section
 * rather than breaking the listing page.
 */
export const ListingMarketSection = ({ listingId }: { listingId: string }) => {
  const listing = useQuery({
    queryKey: landKeys.publicListing(listingId),
    queryFn: () => unwrap(landService.getPublicListing(listingId)),
    retry: false,
  });
  const comparables = useQuery({
    queryKey: landMarketKeys.comparables(listingId),
    queryFn: () => unwrap(landMarketService.comparables(listingId)),
    retry: false,
  });

  const tier = listing.data?.diligence?.assuranceTier as LandAssuranceTier | undefined;
  const data = comparables.data;
  const items = data?.comparables ?? [];

  if (comparables.isLoading && listing.isLoading) {
    return <div className="mt-12 h-48 animate-pulse rounded-3xl bg-secondary" aria-busy="true" />;
  }
  if (!tier && (!data || (items.length === 0 && data.subjectPercentile === undefined))) return null;

  const insightsHref = listing.data
    ? `${LAND_BUYER_ROUTES.MARKET_INSIGHTS}?state=${encodeURIComponent(listing.data.state)}&city=${encodeURIComponent(listing.data.city)}`
    : LAND_BUYER_ROUTES.MARKET_INSIGHTS;

  return (
    <section aria-labelledby="land-market" className="mt-12 border-t border-border/70 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="land-market" className="text-xl font-semibold tracking-tight text-foreground">
          How this parcel compares
        </h2>
        <Link
          href={insightsHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <BarChart3 className="h-4 w-4" aria-hidden /> Land prices in this area
        </Link>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="space-y-5">
          {tier && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ShieldCheck className="h-4 w-4 text-success" aria-hidden /> Assurance
              </p>
              <div className="mt-2">
                <AssuranceTierBadge tier={tier} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {LAND_ASSURANCE_TIER_LABELS[tier]}: {LAND_ASSURANCE_TIER_DESCRIPTIONS[tier]}
              </p>
            </div>
          )}
          {data?.subjectPercentile !== undefined && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="mb-3 text-sm font-medium text-foreground">Price per m²</p>
              <PricePositionBar
                percentile={data.subjectPercentile}
                subjectPricePerSqm={data.subjectPricePerSqm}
                medianPricePerSqm={data.comparablesMedianPricePerSqm}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Among the {items.length} comparable verified listings below; asking prices, not sale
                prices.
              </p>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-medium text-foreground">Comparable verified land</p>
            <ul className="mt-3 divide-y divide-border">
              {items.map((c) => (
                <li key={c.id} className="py-3">
                  <Link
                    href={LAND_BUYER_ROUTES.listing(c.id)}
                    className="flex items-start justify-between gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground hover:underline">
                        {c.title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" aria-hidden />
                        {[c.estateName, c.city, c.state].filter(Boolean).join(', ')}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {[
                          c.areaSqm ? `${Math.round(c.areaSqm).toLocaleString('en-NG')} m²` : null,
                          c.titleType ? LAND_TITLE_TYPE_LABELS[c.titleType] : null,
                          `${Math.round(c.similarity * 100)}% similar`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-semibold tabular-nums text-foreground">
                        {formatCurrency(c.price, { compact: true })}
                      </span>
                      {c.pricePerSqm ? (
                        <span className="block text-xs tabular-nums text-muted-foreground">
                          {formatCurrency(c.pricePerSqm)}/m²
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};
