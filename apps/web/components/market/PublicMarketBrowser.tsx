'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  BadgeCheck,
  Bath,
  BedDouble,
  Home,
  ArrowUpRight,
  Columns3,
  MapPin,
  Ruler,
  SlidersHorizontal,
  ImageOff,
} from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  CurrencyInput,
  EmptyState,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
} from '@sureground/ui';
import {
  publicMarketService,
  type PublicListingCard,
  type PublicMarket,
} from '@/services/publicMarketService';
import { unwrap, type Paginated } from '@/lib/apiHelpers';
import { PUBLIC_MARKET_PAGE_SIZE } from '@/lib/publicListingMap';
import { formatCurrency } from '@/lib/format';
import { PROPERTY_TYPE_OPTIONS } from '@/lib/propertyTypes';
import { SaveListingButton } from './SaveListingButton';
import { ListingComparisonDialog } from './ListingComparisonDialog';
import { trustChainLabel } from '@sureground/shared';

// Shared with the server component that pre-renders the first page, so both ask for the same page size.
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

const NOUNS: Record<PublicMarket, { one: string; many: string }> = {
  rent: { one: 'rental', many: 'rentals' },
  sale: { one: 'property', many: 'properties' },
};

const detailHref = (market: PublicMarket, id: string) =>
  `${market === 'rent' ? '/rent' : '/buy'}/${id}`;

const ListingCard = ({
  listing,
  market,
  compared,
  compareDisabled,
  onCompare,
}: {
  listing: PublicListingCard;
  market: PublicMarket;
  compared: boolean;
  compareDisabled: boolean;
  onCompare: (listing: PublicListingCard) => void;
}) => {
  const href = detailHref(market, listing.id);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-[border-color,box-shadow] duration-150 hover:border-foreground/15 hover:shadow-sm">
      <div className="relative overflow-hidden">
        <Link href={href} tabIndex={-1} aria-hidden="true">
          {mapMedia(listing)}
        </Link>
        {(listing.trustChain || listing.verified) && (
          <span
            title={listing.trustChain?.steps
              .map((s) => `${s.met ? '✓' : '○'} ${s.label}`)
              .join('\n')}
            className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-black/65 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md"
          >
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {listing.trustChain ? trustChainLabel(listing.trustChain).label : 'Verified listing'}
          </span>
        )}
        <SaveListingButton
          listingId={listing.id}
          returnPath={href}
          className="absolute right-4 top-4"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold tracking-[-0.015em] text-foreground">
            <Link
              href={href}
              className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {listing.title}
            </Link>
          </h3>
          {listing.verified && (
            <BadgeCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-label="Verified listing"
            />
          )}
        </div>

        <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{listing.location}</span>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {/* Falsy, not nullish: many listings have no bedroom or size data, and "0 bed" reads as a claim. */}
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
          <p className="data-value text-lg font-semibold text-foreground">
            {formatCurrency(listing.price)}
            {listing.priceUnit && (
              <span className="text-sm font-normal text-muted-foreground">
                /{listing.priceUnit}
              </span>
            )}
          </p>
          <Link
            href={href}
            className="inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            View details
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
        <Button
          variant="outline"
          rounded="md"
          size="sm"
          className="mt-4 self-start"
          disabled={compareDisabled}
          aria-pressed={compared}
          icon={<Columns3 className="h-4 w-4" aria-hidden="true" />}
          onClick={() => onCompare(listing)}
        >
          {compared ? 'Remove from compare' : 'Add to compare'}
        </Button>
      </div>
    </article>
  );
};

function mapMedia(listing: PublicListingCard) {
  if (listing.image) {
    return (
      <div
        className="h-52 w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.02]"
        style={{ backgroundImage: `url(${listing.image})` }}
        role="img"
        aria-label={listing.title}
      />
    );
  }
  return (
    <div className="flex h-24 w-full items-center justify-center gap-2 bg-muted text-sm text-muted-foreground">
      <ImageOff className="h-4 w-4" aria-hidden />
      No photos yet
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
}) => <Checkbox checked={checked} onCheckedChange={onChange} label={label} />;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

// `estate` comes from the URL (an estate storefront's links), so the filter and its banner must survive the click.
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
  const [compared, setCompared] = useState<PublicListingCard[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  const activeCount = countRefinements(refine);
  const priceRangeInvalid =
    refine.minPrice !== '' &&
    refine.maxPrice !== '' &&
    Number(refine.minPrice) > Number(refine.maxPrice);
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
    // Only the default view may start from the server payload: a filtered query seeded with page 1 of everything shows the wrong listings.
    initialData: isDefaultView ? initialData : undefined,
    enabled: !priceRangeInvalid,
    placeholderData: keepPreviousData,
  });

  const listings = data?.items ?? [];
  const total = data?.total ?? 0;
  const noun = NOUNS[market];
  const toggleCompare = (listing: PublicListingCard) => {
    setCompared((current) =>
      current.some((item) => item.id === listing.id)
        ? current.filter((item) => item.id !== listing.id)
        : current.length < 3
          ? [...current, listing]
          : current
    );
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-3xl py-6 sm:py-10">
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
          {market === 'rent' ? 'Homes to rent' : 'Homes for sale'}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          {market === 'rent'
            ? 'Browse available rentals across Nigeria and review verification details before you enquire.'
            : 'Browse homes across Nigeria, review verification details, and make protected offers.'}
        </p>
      </header>

      {estateFromUrl && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary/60 px-4 py-3">
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

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center">
        <div className="sm:max-w-md sm:flex-1">
          <SearchInput
            id="public-market-search"
            value={search}
            onValueChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search by area, city, street, estate or title"
            label="Search listings"
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
        <Button
          variant="outline"
          size="lg"
          rounded="md"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-controls="public-market-filters"
          icon={<SlidersHorizontal className="h-4 w-4" />}
        >
          Filters
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      {showFilters && (
        <div
          id="public-market-filters"
          className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-3 lg:grid-cols-6"
        >
          <div>
            <CurrencyInput
              prefix="₦"
              placeholder="Min price"
              aria-label="Minimum price"
              aria-invalid={priceRangeInvalid}
              aria-describedby={priceRangeInvalid ? 'public-market-price-error' : undefined}
              className={priceRangeInvalid ? 'border-destructive' : undefined}
              value={refine.minPrice}
              onValueChange={(v) => update('minPrice', v ? String(v) : '')}
            />
            {priceRangeInvalid && (
              <p id="public-market-price-error" className="mt-1 text-xs text-destructive">
                Minimum must be below maximum.
              </p>
            )}
          </div>
          <CurrencyInput
            prefix="₦"
            placeholder="Max price"
            aria-label="Maximum price"
            aria-invalid={priceRangeInvalid}
            aria-describedby={priceRangeInvalid ? 'public-market-price-error' : undefined}
            className={priceRangeInvalid ? 'border-destructive' : undefined}
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
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  setRefine(NO_REFINEMENTS);
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>
      )}

      {priceRangeInvalid ? (
        <Alert variant="danger" className="mt-8">
          Adjust the price range to continue. The minimum price cannot exceed the maximum.
        </Alert>
      ) : isLoading ? (
        <div className="mt-8" aria-label="Loading listings" aria-busy="true">
          <Skeleton className="mb-5 h-5 w-40 rounded-full" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[25rem] w-full rounded-xl" />
            ))}
          </div>
        </div>
      ) : isError && !data ? (
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
          <div className="mt-9 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.025em] text-foreground">
                {total} {total === 1 ? noun.one : noun.many} available
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">Select a listing to see full details</p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                market={market}
                compared={compared.some((item) => item.id === listing.id)}
                compareDisabled={
                  compared.length >= 3 && !compared.some((item) => item.id === listing.id)
                }
                onCompare={toggleCompare}
              />
            ))}
          </div>
          <div className="mt-8">
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </div>
        </>
      )}
      {compared.length > 0 && (
        <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-2xl items-center gap-4 rounded-2xl border border-primary/20 bg-card/95 p-3 shadow-2xl backdrop-blur-xl sm:px-4">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">{compared.length} of 3 selected</p>
            <p className="truncate text-xs text-muted-foreground">
              {compared.map((item) => item.title).join(' · ')}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setCompared([])}>
            Clear
          </Button>
          <Button
            size="lg"
            rounded="lg"
            disabled={compared.length < 2}
            onClick={() => setComparisonOpen(true)}
          >
            Compare
          </Button>
        </div>
      )}
      <ListingComparisonDialog
        open={comparisonOpen}
        market={market}
        listings={compared}
        onOpenChange={setComparisonOpen}
        onRemove={(id) => {
          setCompared((current) => current.filter((item) => item.id !== id));
          if (compared.length <= 2) setComparisonOpen(false);
        }}
      />
    </section>
  );
};
