'use client';

import { formatLocation } from '@sureground/shared';
import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Home } from '@sureground/icons';
import { EmptyState, ListingCard, Skeleton, ToggleChip } from '@sureground/ui';
import { estateStorefrontService } from '@/services/estateMarketplaceService';
import { unwrap } from '@/lib/apiHelpers';
import type { EstateListingType, EstateStorefrontListing } from '@/types/estate-marketplace';

const TABS: { key: EstateListingType | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Everything' },
  { key: 'RENT', label: 'For rent' },
  { key: 'SALE', label: 'For sale' },
  { key: 'SHORTLET', label: 'Short stays' },
];

const marketHref = (listing: EstateStorefrontListing, slug: string) => {
  const estate = encodeURIComponent(slug);
  if (listing.listingType === 'SHORTLET') return `/shortlets?estate=${estate}`;
  if (listing.listingType === 'SALE') return `/buy?estate=${estate}`;
  return `/rent?estate=${estate}`;
};

const STATUS: Record<EstateListingType, string> = {
  RENT: 'For rent',
  SALE: 'For sale',
  SHORTLET: 'Shortlet',
};

const EstateListingCard = ({
  listing,
  slug,
}: {
  listing: EstateStorefrontListing;
  slug: string;
}) => (
  <ListingCard
    href={marketHref(listing, slug)}
    title={listing.title}
    location={formatLocation(listing.address, listing.city)}
    price={listing.price}
    priceUnit={listing.listingType === 'SHORTLET' ? 'night' : undefined}
    image={listing.coverImageUrl}
    status={STATUS[listing.listingType]}
    facts={{
      beds: listing.bedrooms,
      baths: listing.bathrooms,
      type: listing.propertyType,
      extra: [
        listing.availableFrom
          ? `Available ${new Date(listing.availableFrom).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}`
          : null,
      ],
    }}
    meta={
      listing.listedByEstate ? (
        <>
          Marketed by <span className="font-medium text-foreground">this estate</span>
        </>
      ) : (
        <>
          Listed by <span className="font-medium text-foreground">{listing.ownerName}</span>
        </>
      )
    }
  />
);

export const EstateAvailableListings = ({
  slug,
  initialCounts,
}: {
  slug: string;
  initialCounts?: { rent: number; sale: number; shortlet: number };
}) => {
  const [tab, setTab] = useState<EstateListingType | 'ALL'>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['estate-storefront', slug, 'listings', tab],
    queryFn: () =>
      unwrap(
        estateStorefrontService.listListings(slug, {
          page: 1,
          pageSize: 24,
          ...(tab === 'ALL' ? {} : { listingType: tab }),
        })
      ),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });

  const listings = data?.items ?? [];
  const total = data?.total ?? 0;

  const counts: Record<EstateListingType | 'ALL', number | undefined> = {
    ALL: initialCounts
      ? initialCounts.rent + initialCounts.sale + initialCounts.shortlet
      : undefined,
    RENT: initialCounts?.rent,
    SALE: initialCounts?.sale,
    SHORTLET: initialCounts?.shortlet,
  };

  // Empty tabs are hidden, except while counts load, so the row doesn't flash away.
  const visibleTabs = TABS.filter(
    (t) => t.key === 'ALL' || counts[t.key] === undefined || counts[t.key]! > 0
  );

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-foreground">Available here</h2>
        {total > 0 && (
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? 'property' : 'properties'}
          </p>
        )}
      </div>

      {visibleTabs.length > 2 && (
        <div
          role="group"
          aria-label="Listing type"
          className="flex gap-2 mt-4 overflow-x-auto pb-1"
        >
          {visibleTabs.map((t) => (
            <ToggleChip
              key={t.key}
              pressed={tab === t.key}
              onPressedChange={() => setTab(t.key)}
              count={counts[t.key] || undefined}
            >
              {t.label}
            </ToggleChip>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-72 w-full rounded-2xl" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={Home}
            title="Nothing available right now"
            description="This estate has no published listings at the moment. Check back soon."
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-8 mt-5">
          {listings.map((listing) => (
            <EstateListingCard key={listing.listingId} listing={listing} slug={slug} />
          ))}
        </div>
      )}
    </section>
  );
};
