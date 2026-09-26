'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  BadgeCheck,
  Bath,
  BedDouble,
  Home,
  MapPin,
  Ruler,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Badge,
  Checkbox,
  CurrencyInput,
  EmptyState,
  Input,
  Pagination,
  Select,
  Skeleton,
} from '@getrentos/ui';
import {
  publicMarketService,
  type PublicListingCard,
  type PublicMarket,
} from '@/services/publicMarketService';
import { unwrap, type Paginated } from '@/lib/apiHelpers';
import { PUBLIC_MARKET_PAGE_SIZE } from '@/lib/publicListingMap';
import { formatCurrency } from '@/lib/format';
import { PROPERTY_TYPE_OPTIONS } from '@/lib/propertyTypes';

// Shared with the server component that pre-renders the first page, so the two
// cannot ask for different page sizes.
const PAGE_SIZE = PUBLIC_MARKET_PAGE_SIZE;

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

const detailHref = (market: PublicMarket, id: string) =>
  `${market === 'rent' ? '/rent' : '/buy'}/${id}`;

const ListingCard = ({ listing, market }: { listing: PublicListingCard; market: PublicMarket }) => (
  <Link
    href={detailHref(market, listing.id)}
    className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
  >
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
        {listing.propertyType && (
          <Badge variant="neutral">{listing.propertyType.toLowerCase()}</Badge>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <p className="text-lg font-bold text-foreground">
          {formatCurrency(listing.price)}
          {listing.priceUnit && (
            <span className="text-sm font-normal text-muted-foreground">/{listing.priceUnit}</span>
          )}
        </p>
        {/* Browsing is open to anyone; contacting the landlord or making an offer
            is not — the detail page says so and carries the sign-in step. */}
        <span className="text-sm font-medium text-primary">View details</span>
      </div>
    </div>
  </Link>
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

interface Refinements {
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  propertyType: string;
  verifiedOnly: boolean;
  furnished: boolean;
  petsAllowed: boolean;
  monthlyPayment: boolean;
}

const NO_REFINEMENTS: Refinements = {
  minPrice: '',
  maxPrice: '',
  bedrooms: '',
  bathrooms: '',
  propertyType: '',
  verifiedOnly: false,
  furnished: false,
  petsAllowed: false,
  monthlyPayment: false,
};

const countRefinements = (r: Refinements) =>
  Object.values(r).filter((v) => (typeof v === 'boolean' ? v : v !== '')).length;

const ROOM_OPTIONS = (noun: 'bed' | 'bath') => [
  { value: '', label: `Any ${noun}s` },
  ...[1, 2, 3, 4, 5].map((n) => ({
    value: String(n),
    label: `${n}+ ${noun}${n === 1 ? '' : 's'}`,
  })),
];

const FilterToggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
    <Checkbox checked={checked} onCheckedChange={onChange} aria-label={label} />
    {label}
  </label>
);

/** Waits for typing to pause before a value is used in a request. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
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

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 350);
  const [refine, setRefine] = useState<Refinements>(NO_REFINEMENTS);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState(SORTS[market][0].value);
  const [page, setPage] = useState(1);

  const activeCount = countRefinements(refine);
  const isDefaultView =
    !debouncedSearch &&
    !estateFromUrl &&
    page === 1 &&
    sort === SORTS[market][0].value &&
    activeCount === 0;

  const filters = {
    search: debouncedSearch || undefined,
    estate: estateFromUrl || undefined,
    minPrice: refine.minPrice ? Number(refine.minPrice) : undefined,
    maxPrice: refine.maxPrice ? Number(refine.maxPrice) : undefined,
    bedrooms: refine.bedrooms ? Number(refine.bedrooms) : undefined,
    bathrooms: refine.bathrooms ? Number(refine.bathrooms) : undefined,
    propertyType: refine.propertyType || undefined,
    verifiedOnly: refine.verifiedOnly,
    ...(market === 'rent'
      ? {
          furnished: refine.furnished,
          petsAllowed: refine.petsAllowed,
          monthlyPayment: refine.monthlyPayment,
        }
      : {}),
    sort,
    page,
    pageSize: PAGE_SIZE,
  };

  const update = <K extends keyof Refinements>(key: K, value: Refinements[K]) => {
    setRefine((r) => ({ ...r, [key]: value }));
    setPage(1);
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
            id="public-market-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by area, city, street, estate or title"
            aria-label="Search listings"
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
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-controls="public-market-filters"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground hover:border-primary/60"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div
          id="public-market-filters"
          className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3 lg:grid-cols-6"
        >
          <CurrencyInput
            prefix="₦"
            placeholder="Min price"
            aria-label="Minimum price"
            value={refine.minPrice}
            onValueChange={(v) => update('minPrice', v ? String(v) : '')}
          />
          <CurrencyInput
            prefix="₦"
            placeholder="Max price"
            aria-label="Maximum price"
            value={refine.maxPrice}
            onValueChange={(v) => update('maxPrice', v ? String(v) : '')}
          />
          <Select
            ariaLabel="Bedrooms"
            value={refine.bedrooms}
            onValueChange={(v) => update('bedrooms', v)}
            options={ROOM_OPTIONS('bed')}
          />
          <Select
            ariaLabel="Bathrooms"
            value={refine.bathrooms}
            onValueChange={(v) => update('bathrooms', v)}
            options={ROOM_OPTIONS('bath')}
          />
          <Select
            ariaLabel="Property type"
            value={refine.propertyType}
            onValueChange={(v) => update('propertyType', v)}
            options={[
              { value: '', label: 'Any type' },
              ...PROPERTY_TYPE_OPTIONS.filter((o) => market === 'sale' || o.value !== 'LAND').map(
                (o) => ({
                  value: o.value,
                  label: o.label,
                })
              ),
            ]}
          />
          <div className="col-span-2 flex flex-wrap items-center gap-x-5 gap-y-3 md:col-span-3 lg:col-span-6">
            <FilterToggle
              label="Verified only"
              checked={refine.verifiedOnly}
              onChange={(v) => update('verifiedOnly', v)}
            />
            {market === 'rent' && (
              <>
                <FilterToggle
                  label="Furnished"
                  checked={refine.furnished}
                  onChange={(v) => update('furnished', v)}
                />
                <FilterToggle
                  label="Pets allowed"
                  checked={refine.petsAllowed}
                  onChange={(v) => update('petsAllowed', v)}
                />
                <FilterToggle
                  label="Pay monthly"
                  checked={refine.monthlyPayment}
                  onChange={(v) => update('monthlyPayment', v)}
                />
              </>
            )}
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setRefine(NO_REFINEMENTS);
                  setPage(1);
                }}
                className="ml-auto text-sm font-medium text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

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
                : 'Try a different area, widen the price range, or clear a filter.'
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
