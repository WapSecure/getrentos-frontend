'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bath, BedDouble, Building2, CalendarClock, Home, MapPin } from 'lucide-react';
import { Badge, EmptyState } from '@getrentos/ui';
import { estateStorefrontService } from '@/services/estateMarketplaceService';
import { unwrap } from '@/lib/apiHelpers';
import type { EstateListingType, EstateStorefrontListing } from '@/types/estate-marketplace';

const TABS: { key: EstateListingType | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Everything' },
  { key: 'RENT', label: 'For rent' },
  { key: 'SALE', label: 'For sale' },
  { key: 'SHORTLET', label: 'Short stays' },
];

const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

/**
 * Where a card sends the visitor.
 *
 * All three markets now have a PUBLIC browse page, so an anonymous visitor who
 * found this estate through search can keep browsing it. Before this, rentals and
 * sales pointed at `/renter/discover` and `/buyer/discover` — dashboard routes —
 * so the click bounced to the login screen and dropped the estate filter, which
 * made this public page a funnel into a wall. Contacting a landlord or making an
 * offer still needs an account; that is the sign-in prompt on the market page, not
 * a broken link here.
 */
const marketHref = (listing: EstateStorefrontListing, slug: string) => {
  const estate = encodeURIComponent(slug);
  if (listing.listingType === 'SHORTLET') return `/shortlets?estate=${estate}`;
  if (listing.listingType === 'SALE') return `/buy?estate=${estate}`;
  return `/rent?estate=${estate}`;
};

const ListingCard = ({ listing, slug }: { listing: EstateStorefrontListing; slug: string }) => (
  <Link
    href={marketHref(listing, slug)}
    className="group block bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/40 transition-colors"
  >
    <div className="relative h-40 bg-secondary">
      {listing.coverImageUrl ? (
        <Image
          src={listing.coverImageUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 320px"
          className="object-cover group-hover:scale-[1.02] transition-transform"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Home className="w-8 h-8 text-muted-foreground/40" />
        </div>
      )}
      <div className="absolute top-3 left-3 flex gap-2">
        <Badge variant="info">
          {listing.listingType === 'RENT'
            ? 'For rent'
            : listing.listingType === 'SALE'
              ? 'For sale'
              : 'Short stay'}
        </Badge>
      </div>
    </div>

    <div className="p-4">
      <p className="font-semibold text-foreground truncate">{listing.title}</p>
      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
        <MapPin className="w-3 h-3 shrink-0" />
        <span className="truncate">{listing.address}</span>
      </p>

      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        {listing.bedrooms ? (
          <span className="flex items-center gap-1">
            <BedDouble className="w-3.5 h-3.5" />
            {listing.bedrooms}
          </span>
        ) : null}
        {listing.bathrooms ? (
          <span className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" />
            {listing.bathrooms}
          </span>
        ) : null}
        <span className="flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5" />
          {listing.propertyType.toLowerCase().replace(/_/g, ' ')}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2 mt-4">
        <div>
          <p className="text-base font-bold text-foreground">{formatNaira(listing.price)}</p>
          {listing.listingType === 'SHORTLET' && (
            <p className="text-xs text-muted-foreground">per night</p>
          )}
        </div>
        {listing.availableFrom && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="w-3.5 h-3.5" />
            {new Date(listing.availableFrom).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>

      {/* Attribution is the point: the visitor should always know whether they
          are dealing with the estate or with the property's owner. */}
      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
        {listing.listedByEstate ? (
          <>
            Marketed by <span className="text-foreground font-medium">this estate</span>
          </>
        ) : (
          <>
            Listed by <span className="text-foreground font-medium">{listing.ownerName}</span>
          </>
        )}
      </p>
    </div>
  </Link>
);

/**
 * "Available in this estate" — the reason a visitor shared the link in the
 * first place.
 *
 * Shows everything published inside the estate, not only what the estate
 * published itself: a flat whose owner is advertising it is inventory the
 * visitor came for. Cards carry the attribution so the difference is never
 * hidden.
 */
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
        }),
      ),
    staleTime: 5 * 60_000,
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

  // A tab with nothing behind it is noise, so it is hidden — except while the
  // counts are still unknown, when hiding would flash the row of tabs away.
  const visibleTabs = TABS.filter((t) => t.key === 'ALL' || counts[t.key] === undefined || counts[t.key]! > 0);

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
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {visibleTabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/40'
                }`}
              >
                {t.label}
                {counts[t.key] !== undefined && counts[t.key]! > 0 ? (
                  <span className={active ? ' opacity-80' : ' opacity-60'}> · {counts[t.key]}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-secondary animate-pulse" />
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          {listings.map((listing) => (
            <ListingCard key={listing.listingId} listing={listing} slug={slug} />
          ))}
        </div>
      )}
    </section>
  );
};
