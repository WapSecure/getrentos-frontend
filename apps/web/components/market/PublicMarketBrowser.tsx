'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Columns3, Home, SlidersHorizontal } from '@sureground/icons';
import { Alert } from '@sureground/ui/Alert';
import { Button } from '@sureground/ui/Button';
import { Checkbox } from '@sureground/ui/Checkbox';
import { CurrencyInput } from '@sureground/ui/CurrencyInput';
import { EmptyState } from '@sureground/ui/EmptyState';
import { ListingCard } from '@sureground/ui/ListingCard';
import { Pagination } from '@sureground/ui/Pagination';
import { SearchInput } from '@sureground/ui/SearchInput';
import { Select } from '@sureground/ui/Select';
import { Skeleton } from '@sureground/ui/Skeleton';
import {
  publicMarketService,
  type PublicListingCard,
  type PublicMarket,
} from '@/services/publicMarketService';
import { unwrap, type Paginated } from '@/lib/apiHelpers';
import { PUBLIC_MARKET_PAGE_SIZE } from '@/lib/publicListingMap';
import { BuyMarketTabs } from '@/components/showroom/BuyMarketTabs';
import { PROPERTY_TYPE_OPTIONS } from '@/lib/propertyTypes';
import { SaveListingButton } from './SaveListingButton';
import { ListingComparisonDialog } from './ListingComparisonDialog';
import { TrustChainBadge } from '@/components/shared/trust/TrustChainBadge';
import { track } from '@/lib/analytics';
import {
  DiscoveryViewToggle,
  MapAreaNotice,
  MapDiscoveryView,
} from '@/components/discovery/MapDiscoveryView';
import { formatAreaParam, parseAreaParam, parseView, type MapArea } from '@/lib/mapArea';
import { urlParam, useSyncUrlState } from '@/hooks/useUrlState';
import { CollectionsStrip } from '@/components/collections/CollectionsStrip';
import { listingPath } from '@/lib/listingSlug';

// Shared with the server component that pre-renders the first page, so both ask for the same page size.
const PAGE_SIZE = PUBLIC_MARKET_PAGE_SIZE;
/** More pins per page on the map; still a page, so a slow phone is never asked for everything. */
const MAP_PAGE_SIZE = 24;

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

const detailHref = (market: PublicMarket, id: string, title: string) =>
  listingPath(market, id, title);

const MarketListingCard = ({
  listing,
  market,
  eager,
  position,
  compared,
  compareDisabled,
  onCompare,
  onMap = false,
  selected = false,
}: {
  listing: PublicListingCard;
  market: PublicMarket;
  eager: boolean;
  position: number;
  compared: boolean;
  compareDisabled: boolean;
  onCompare: (listing: PublicListingCard) => void;
  onMap?: boolean;
  selected?: boolean;
}) => {
  const href = detailHref(market, listing.id, listing.title);
  const event = {
    listingId: listing.id,
    market,
    surface: `${market}_${onMap ? 'map' : 'list'}`,
    props: { position, variant: onMap ? 'map' : 'grid' },
  };
  return (
    <ListingCard
      variant={onMap ? 'map' : 'grid'}
      selected={selected}
      href={href}
      onVisible={() => track({ name: 'property_impression', ...event })}
      onOpen={() => track({ name: 'property_card_click', ...event })}
      title={listing.title}
      location={listing.location}
      price={listing.price}
      priceUnit={listing.priceUnit}
      image={listing.image}
      imageSrcSet={listing.imageSrcSet}
      imagePreview={listing.imagePreview}
      imageAlt={listing.title}
      eager={eager}
      status={market === 'rent' ? 'For rent' : 'For sale'}
      // One trust signal: the chain pill already says "Verified" when there is no chain.
      badges={<TrustChainBadge chain={listing.trustChain} fallbackVerified={listing.verified} />}
      facts={{
        beds: listing.bedrooms,
        baths: listing.bathrooms,
        size: listing.size,
        type: listing.propertyType,
      }}
      actions={<SaveListingButton listingId={listing.id} returnPath={href} appearance="card" />}
      footer={
        onMap ? undefined : (
          <Button
            variant="outline"
            rounded="md"
            size="sm"
            disabled={compareDisabled}
            aria-pressed={compared}
            aria-label={`${compared ? 'Remove from compare' : 'Add to compare'}: ${listing.title}`}
            icon={<Columns3 className="h-4 w-4" aria-hidden="true" />}
            onClick={() => onCompare(listing)}
          >
            {compared ? 'Remove from compare' : 'Add to compare'}
          </Button>
        )
      }
    />
  );
};

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

const refinementsFromUrl = (params: URLSearchParams): Refinements => ({
  minPrice: urlParam.text(params, 'minPrice'),
  maxPrice: urlParam.text(params, 'maxPrice'),
  bedrooms: urlParam.text(params, 'beds'),
  bathrooms: urlParam.text(params, 'baths'),
  propertyType: urlParam.text(params, 'type'),
  verifiedOnly: urlParam.flag(params, 'verified'),
  furnished: urlParam.flag(params, 'furnished'),
  petsAllowed: urlParam.flag(params, 'pets'),
  monthlyPayment: urlParam.flag(params, 'monthly'),
});

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

  // The first render reads the link; after that React owns the state and mirrors it back to the URL.
  const [search, setSearch] = useState(() => urlParam.text(searchParams, 'q'));
  const debouncedSearch = useDebouncedValue(search.trim(), 350);
  const [refine, setRefine] = useState<Refinements>(() => refinementsFromUrl(searchParams));
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState(() =>
    urlParam.oneOf(
      searchParams,
      'sort',
      SORTS[market].map((s) => s.value),
      SORTS[market][0].value
    )
  );
  const [page, setPage] = useState(() => urlParam.page(searchParams));
  const [view, setView] = useState(() => parseView(searchParams.get('view')));
  const [area, setArea] = useState<MapArea | undefined>(() =>
    parseAreaParam(searchParams.get('area'))
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(
    () => searchParams.get('selected') || undefined
  );
  const [compared, setCompared] = useState<PublicListingCard[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);

  useSyncUrlState(
    {
      q: debouncedSearch,
      minPrice: refine.minPrice,
      maxPrice: refine.maxPrice,
      beds: refine.bedrooms,
      baths: refine.bathrooms,
      type: refine.propertyType,
      verified: refine.verifiedOnly,
      furnished: market === 'rent' && refine.furnished,
      pets: market === 'rent' && refine.petsAllowed,
      monthly: market === 'rent' && refine.monthlyPayment,
      sort,
      page,
      view,
      area: area ? formatAreaParam(area) : undefined,
      selected: view === 'map' ? selectedId : undefined,
    },
    { sort: SORTS[market][0].value, page: 1, view: 'grid' }
  );

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
    activeCount === 0 &&
    view === 'grid' &&
    !area;
  const pageSize = view === 'map' ? MAP_PAGE_SIZE : PAGE_SIZE;

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
    pageSize,
    area,
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

  const changeView = (next: typeof view) => {
    setView(next);
    setPage(1);
    if (next === 'grid') setSelectedId(undefined);
  };
  const searchArea = (next: MapArea) => {
    setArea(next);
    setPage(1);
    setSelectedId(undefined);
  };
  const clearArea = () => {
    setArea(undefined);
    setPage(1);
  };
  const pagination = (
    <div className="mt-8">
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
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
      {market === 'sale' && !estateFromUrl && <BuyMarketTabs current="homes" />}
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

      {!estateFromUrl && <CollectionsStrip market={market} className="mb-8" />}

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
        <DiscoveryViewToggle
          view={view}
          onChange={changeView}
          className="self-start sm:ml-auto sm:self-center"
        />
      </div>
      {area && (
        <div className="mt-3">
          <MapAreaNotice onClear={clearArea} />
        </div>
      )}

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
      ) : view === 'map' ? (
        <div className="mt-6">
          <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
            {total} {total === 1 ? noun.one : noun.many}
            {area ? ' in this area' : ''}
          </p>
          <MapDiscoveryView
            items={listings}
            title={(l) => l.title}
            price={(l) => l.price}
            area={area}
            onSearchArea={searchArea}
            onClearArea={clearArea}
            selectedId={selectedId}
            onSelect={setSelectedId}
            empty={
              <EmptyState
                icon={Home}
                title={area ? 'Nothing listed in this area' : 'No listings match that'}
                description={
                  area
                    ? 'Move the map and search again, or clear the map area.'
                    : 'Try a different area, widen the price range, or clear a filter.'
                }
              />
            }
            renderCard={(listing, { selected, position }) => (
              <MarketListingCard
                listing={listing}
                market={market}
                eager={position < 3}
                position={position}
                onMap
                selected={selected}
                compared={false}
                compareDisabled
                onCompare={toggleCompare}
              />
            )}
            footer={total > pageSize ? pagination : null}
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
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing, index) => (
              <MarketListingCard
                key={listing.id}
                listing={listing}
                eager={index < 3}
                position={index}
                market={market}
                compared={compared.some((item) => item.id === listing.id)}
                compareDisabled={
                  compared.length >= 3 && !compared.some((item) => item.id === listing.id)
                }
                onCompare={toggleCompare}
              />
            ))}
          </div>
          {pagination}
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
