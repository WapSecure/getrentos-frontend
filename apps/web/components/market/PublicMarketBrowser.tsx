'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { BadgeCheck, Bath, BedDouble, Home, MapPin, Ruler, Search } from 'lucide-react';
import { Badge, EmptyState, Input, Pagination, Select, Skeleton } from '@getrentos/ui';
import { publicMarketService, type PublicListingCard, type PublicMarket } from '@/services/publicMarketService';
import { unwrap, type Paginated } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';

const PAGE_SIZE = 12;

const SORTS: Record<PublicMarket, { value: string; label: string }[]> = {
  rent: [
    { value: 'recent', label: 'Newest' },
    { value: 'price-low', label: 'Price: low to high' },
    { value: 'price-high', label: 'Price: high to low' },
  ],
  sale: [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
  ],
};

const humaniseSlug = (slug: string) =>
  slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Spelled out rather than `noun + 's'` — "propertys" is not a word. */
const NOUNS: Record<PublicMarket, { one: string; many: string }> = {
  rent: { one: 'rental', many: 'rentals' },
  sale: { one: 'property', many: 'properties' },
};

const ListingCard = ({ listing, market }: { listing: PublicListingCard; market: PublicMarket }) => (
  <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
    {mapMedia(listing, market)}

    <div className="flex flex-1 flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground">{listing.title}</h3>
        {listing.verified && <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
      </div>

      <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{listing.location}</span>
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {/*
          Falsy, not just nullish: many properties are listed without bedroom or
          size data, and "0 bed" reads as a claim about the property rather than
          as a missing field. Better to show nothing than to show a wrong number.
        */}
        {listing.bedrooms ? (
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" />
            {listing.bedrooms} bed
          </span>
        ) : null}
        {listing.bathrooms ? (
          <span className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" />
            {listing.bathrooms} bath
          </span>
        ) : null}
        {listing.size ? (
          <span className="flex items-center gap-1">
            <Ruler className="h-3.5 w-3.5" />
            {listing.size} sqm
          </span>
        ) : null}
        {listing.propertyType && <Badge variant="neutral">{listing.propertyType.toLowerCase()}</Badge>}
      </div>

      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <p className="text-lg font-bold text-foreground">
          {formatCurrency(listing.price)}
          {listing.priceUnit && (
            <span className="text-sm font-normal text-muted-foreground">/{listing.priceUnit}</span>
          )}
        </p>
        {/* Browsing is open to anyone; contacting the landlord or making an offer
            is not. Saying so here is the difference between a deliberate signup
            funnel and a link that looks broken. */}
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          {market === 'rent' ? 'Sign in to enquire' : 'Sign in to offer'}
        </Link>
      </div>
    </div>
  </div>
);

function mapMedia(listing: PublicListingCard, market: PublicMarket) {
  if (listing.image) {
    return (
      <div
        className="h-44 w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${listing.image})` }}
        role="img"
        aria-label={listing.title}
      />
    );
  }
  return (
    <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
      <Home className="h-8 w-8 text-primary/40" />
    </div>
  );
}

/**
 * Public browse for rentals and sales.
 *
 * One component for both markets because the alternative is two pages that look
 * the same and are maintained separately. The differences are parameterised
 * (sort vocabulary, price period, whether media exists) rather than duplicated.
 *
 * `estate` comes from the URL: this is where a public estate storefront's "For
 * rent" / "For sale" links land, so the filter has to survive the click — and the
 * banner has to be visible, or a visitor cannot tell why the market is so small.
 */
export const PublicMarketBrowser = ({
  market,
  initialData,
}: {
  market: PublicMarket;
  initialData?: Paginated<PublicListingCard>;
}) => {
  const searchParams = useSearchParams();
  const estateFromUrl = searchParams.get('estate')?.trim() ?? '';

  const [location, setLocation] = useState('');
  const [sort, setSort] = useState(SORTS[market][0].value);
  const [page, setPage] = useState(1);

  const isDefaultView = !location.trim() && !estateFromUrl && page === 1 && sort === SORTS[market][0].value;

  const filters = {
    location: location.trim() || undefined,
    estate: estateFromUrl || undefined,
    sort,
    page,
    pageSize: PAGE_SIZE,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-market', market, filters],
    queryFn: () => unwrap(publicMarketService.list(market, filters)),
    // Only the default view may start from the server payload: seeding a filtered
    // query with page 1 of everything would show the wrong listings while loading.
    initialData: isDefaultView ? initialData : undefined,
  });

  const listings = data?.items ?? [];
  const total = data?.total ?? 0;
  const noun = NOUNS[market];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
          {market === 'rent' ? 'Rentals across Nigeria' : 'Properties for sale'}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {market === 'rent'
            ? 'Homes to rent, with verified properties and landlords marked. Sign in to contact a landlord and apply.'
            : 'Verified homes for sale. Sign in to make an offer and pay through escrow.'}
        </p>
      </header>

      {estateFromUrl && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/40">
          <p className="text-sm text-muted-foreground">
            Showing only {noun.many} marketed inside{' '}
            <span className="font-medium text-foreground">{humaniseSlug(estateFromUrl)}</span>.
          </p>
          <Link
            href={market === 'rent' ? '/rent' : '/buy'}
            className="text-sm font-medium text-primary hover:underline"
          >
            Show all
          </Link>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:max-w-md sm:flex-1">
          <Input
            id="public-market-location"
            value={location}
            onChange={(event) => {
              setLocation(event.target.value);
              setPage(1);
            }}
            placeholder="Search by area, city or street"
            leadingIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="sm:w-56">
          <Select
            ariaLabel="Sort"
            value={sort}
            onValueChange={(value) => {
              setSort(value);
              setPage(1);
            }}
            options={SORTS[market]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-10">
          <EmptyState
            icon={Home}
            title="We could not load these listings"
            description="Something went wrong on our side. Please try again in a moment."
          />
        </div>
      ) : listings.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={Home}
            title={estateFromUrl ? 'Nothing here yet' : 'No listings match that'}
            description={
              estateFromUrl
                ? `${humaniseSlug(estateFromUrl)} has no ${noun.many} listed in this market right now.`
                : 'Try a different area, or clear the search.'
            }
          />
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted-foreground">
            {total} {total === 1 ? noun.one : noun.many}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} market={market} />
            ))}
          </div>
          <div className="mt-8">
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </div>
        </>
      )}
    </section>
  );
};
