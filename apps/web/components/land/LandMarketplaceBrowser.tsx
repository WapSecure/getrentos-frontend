'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DiscoveryViewToggle,
  MapAreaNotice,
  MapDiscoveryView,
} from '@/components/discovery/MapDiscoveryView';
import { formatAreaParam, parseAreaParam, parseView, type MapArea } from '@/lib/mapArea';
import { urlParam, useSyncUrlState } from '@/hooks/useUrlState';
import { track } from '@/lib/analytics';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  ListingCard,
  ListingCardAction,
  PageErrorState,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  useToast,
} from '@sureground/ui';
import {
  ArrowUpDown,
  BadgeCheck,
  BarChart3,
  ExternalLink,
  Heart,
  LayoutGrid,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Trees,
} from '@sureground/icons';
import { landMarketService } from '@/services/landMarketService';
import { buyerService } from '@/services/buyerService';
import { unwrap } from '@/lib/apiHelpers';
import { landKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { viewerHasRole, viewerIsSignedIn } from '@/lib/viewer';
import {
  NIGERIA_STATES,
  NIGERIA_STATE_CITIES,
  ALL_NIGERIAN_CITIES,
} from '@/lib/constants/locations';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  LAND_AREA_UNIT_LABELS,
  LAND_TITLE_TYPE_LABELS,
  type PublicLandListing,
} from '@/types/land';
import { boundaryCorners, imagePreviewOf, srcSetOf } from '@sureground/shared';
import { ParcelBoundaryMap } from '@/components/maps/ParcelBoundaryMap';
import { useAddRole } from '@/hooks/useAddRole';
import Link from 'next/link';
import { AssuranceTierBadge } from '@/components/land/market/AssuranceTierBadge';
import { TrustLabelsList } from '@/components/land/market/TrustLabelsList';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import type { LandAssuranceTier } from '@/types/land';
import { CollectionsStrip } from '@/components/collections/CollectionsStrip';

type MarketplaceMode = 'public' | 'buyer';
type Sort = 'newest' | 'price_asc' | 'price_desc';
type LandViewer = 'buyer' | 'member' | 'anonymous';

interface LandMarketplaceBrowserProps {
  mode: MarketplaceMode;
}

const PAGE_SIZE = 9;
const MAP_PAGE_SIZE = 24;
const LAND_SORTS = ['newest', 'price_asc', 'price_desc'] as const;

const stateFilterOptions = [
  { value: '', label: 'All states' },
  ...NIGERIA_STATES.map((s) => ({ value: s, label: s })),
];

const cityFilterOptionsFor = (state: string) => {
  const cities = state ? (NIGERIA_STATE_CITIES[state] ?? []) : ALL_NIGERIAN_CITIES;
  return [{ value: '', label: 'All cities' }, ...cities.map((c) => ({ value: c, label: c }))];
};

const areaLabel = (listing: PublicLandListing) =>
  `${listing.parcel.areaValue.toLocaleString()} ${LAND_AREA_UNIT_LABELS[listing.parcel.areaUnit]}`;

const parcelTitle = (listing: PublicLandListing) =>
  [listing.parcel.plotNumber && `Plot ${listing.parcel.plotNumber}`, listing.parcel.estateName]
    .filter(Boolean)
    .join(' · ');

const TITLE_TYPE_OPTIONS = [
  { value: '', label: 'Any title document' },
  { value: 'CERTIFICATE_OF_OCCUPANCY', label: 'Certificate of Occupancy' },
  { value: 'GOVERNOR_CONSENT', label: "Governor's Consent" },
  { value: 'DEED_OF_ASSIGNMENT', label: 'Deed of Assignment' },
  { value: 'REGISTERED_CONVEYANCE', label: 'Registered Conveyance' },
  { value: 'EXCISION_GAZETTE', label: 'Excision / Gazette' },
  { value: 'ALLOCATION_LETTER', label: 'Allocation letter' },
  { value: 'SURVEY_PLAN', label: 'Survey plan' },
];

const ASSURANCE_OPTIONS = [
  { value: '', label: 'Any assurance' },
  { value: 'STANDARD', label: 'Registry-searched or better' },
  { value: 'PREMIUM', label: 'Independently reviewed only' },
];

/** Square metres. */
const AREA_OPTIONS = [
  { value: '', label: 'Any plot size' },
  { value: '450', label: '450 sqm+ (a plot)' },
  { value: '900', label: '900 sqm+ (2 plots)' },
  { value: '4047', label: '1 acre+' },
  { value: '10000', label: '1 hectare+' },
];

export const LandMarketplaceBrowser = ({ mode }: LandMarketplaceBrowserProps) => {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  // The first render reads the link; after that React owns the state and mirrors it back to the URL.
  const [search, setSearch] = useState(() => urlParam.text(searchParams, 'q'));
  const [debouncedSearch, setDebouncedSearch] = useState(() => urlParam.text(searchParams, 'q'));
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);
  const [titleType, setTitleType] = useState(() => urlParam.text(searchParams, 'title'));
  const [minArea, setMinArea] = useState(() => urlParam.text(searchParams, 'minArea'));
  const [roadAccess, setRoadAccess] = useState(() => urlParam.flag(searchParams, 'road'));
  const [minAssuranceTier, setMinAssuranceTier] = useState(() =>
    urlParam.text(searchParams, 'assurance')
  );
  const [city, setCity] = useState(() => urlParam.text(searchParams, 'city'));
  const [state, setState] = useState(() => urlParam.text(searchParams, 'state'));
  const [minPrice, setMinPrice] = useState(() => urlParam.text(searchParams, 'minPrice'));
  const [maxPrice, setMaxPrice] = useState(() => urlParam.text(searchParams, 'maxPrice'));
  const [sort, setSort] = useState<Sort>(() =>
    urlParam.oneOf(searchParams, 'sort', LAND_SORTS, 'newest')
  );
  const [page, setPage] = useState(() => urlParam.page(searchParams));
  const [view, setView] = useState(() => parseView(searchParams.get('view')));
  const [area, setArea] = useState<MapArea | undefined>(() =>
    parseAreaParam(searchParams.get('area'))
  );
  const clearArea = () => {
    setArea(undefined);
    setPage(1);
  };
  const [selectedId, setSelectedId] = useState<string | undefined>(
    () => searchParams.get('selected') || undefined
  );
  const pageSize = view === 'map' ? MAP_PAGE_SIZE : PAGE_SIZE;

  useSyncUrlState(
    {
      q: debouncedSearch,
      state,
      city,
      minPrice,
      maxPrice,
      title: titleType,
      minArea,
      assurance: minAssuranceTier,
      road: roadAccess,
      sort,
      page,
      view,
      area: area ? formatAreaParam(area) : undefined,
      selected: view === 'map' ? selectedId : undefined,
    },
    { sort: 'newest', page: 1, view: 'grid' }
  );
  const [chosenListing, setActiveListing] = useState<PublicLandListing | null>(null);
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);
  const toast = useToast();

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      titleType: titleType || undefined,
      minAreaSqm: minArea ? Number(minArea) : undefined,
      roadAccess,
      minAssuranceTier: (minAssuranceTier || undefined) as LandAssuranceTier | undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
      page,
      pageSize,
      area,
    }),
    [
      pageSize,
      area,
      city,
      maxPrice,
      minPrice,
      page,
      sort,
      state,
      debouncedSearch,
      titleType,
      minArea,
      roadAccess,
      minAssuranceTier,
    ]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: [...landKeys.public, queryParams],
    queryFn: () => unwrap(landMarketService.listPublic(queryParams)),
    placeholderData: keepPreviousData,
  });
  const listings = data?.items ?? [];

  // ?property=<id> opens that listing once it is on the page.
  const [linkedListingId, setLinkedListingId] = useState<string | null>(() =>
    typeof window === 'undefined'
      ? null
      : new URLSearchParams(window.location.search).get('property')
  );
  const activeListing =
    chosenListing ??
    (linkedListingId ? (listings.find((listing) => listing.id === linkedListingId) ?? null) : null);
  const total = data?.total ?? 0;

  const saveListing = useMutation({
    mutationFn: (listingId: string) => unwrap(buyerService.saveListing(listingId)),
    onMutate: (listingId) => setSavedListingIds((ids) => [...ids, listingId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer', 'saved'] });
      toast.success('Land listing saved to your shortlist.');
    },
    onError: (reason: Error, listingId) => {
      setSavedListingIds((ids) => ids.filter((id) => id !== listingId));
      toast.error(reason.message);
    },
  });

  const unsaveListing = useMutation({
    mutationFn: (listingId: string) => unwrap(buyerService.unsaveListing(listingId)),
    onMutate: (listingId) => setSavedListingIds((ids) => ids.filter((id) => id !== listingId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer', 'saved'] });
    },
    onError: (reason: Error, listingId) => {
      setSavedListingIds((ids) => [...ids, listingId]);
      toast.error(reason.message);
    },
  });

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const toggleSaved = (listingId: string) => {
    if (savedListingIds.includes(listingId)) {
      unsaveListing.mutate(listingId);
    } else {
      saveListing.mutate(listingId);
    }
  };

  const [viewer] = useState<LandViewer>(() =>
    viewerHasRole('buyer') ? 'buyer' : viewerIsSignedIn() ? 'member' : 'anonymous'
  );
  const canOffer = mode === 'buyer' || viewer === 'buyer';
  const addRole = useAddRole();
  const needsSignIn = viewer === 'anonymous';

  const buyerRoute = (path: string) =>
    canOffer ? path : needsSignIn ? ROUTES.LOGIN : ROUTES.BUYER_LAND;

  const landCard = (
    listing: PublicLandListing,
    index: number,
    { onMap = false, selected = false }: { onMap?: boolean; selected?: boolean } = {}
  ) => {
    const isSaved = savedListingIds.includes(listing.id);
    return (
      <ListingCard
        key={listing.id}
        variant={onMap ? 'map' : 'grid'}
        selected={selected}
        headingLevel="h2"
        onVisible={() =>
          track({
            name: 'property_impression',
            listingId: listing.id,
            market: 'land',
            surface: onMap ? `land_${mode}_map` : `land_${mode}`,
            props: { position: index, variant: onMap ? 'map' : 'grid' },
          })
        }
        onOpen={() => {
          track({
            name: 'property_card_click',
            listingId: listing.id,
            market: 'land',
            surface: onMap ? `land_${mode}_map` : `land_${mode}`,
            props: { position: index, variant: onMap ? 'map' : 'grid' },
          });
          setActiveListing(listing);
        }}
        title={listing.title}
        location={`${listing.city}, ${listing.state}`}
        price={listing.askingPrice}
        priceCompact
        image={listing.coverImageUrl}
        imageSrcSet={srcSetOf(listing.imageVariants)}
        imagePreview={imagePreviewOf(listing.imagePreview)}
        imageAlt={listing.title}
        eager={index < 3}
        status="Land"
        badges={
          <>
            <Badge variant="success" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
              Diligence verified
            </Badge>
            <AssuranceTierBadge tier={listing.diligence?.assuranceTier} />
          </>
        }
        facts={{
          size: areaLabel(listing),
          extra: [listing.parcel.zoning, listing.parcel.roadAccess ? 'Road access' : null],
        }}
        meta={parcelTitle(listing) || undefined}
        actions={
          mode === 'buyer' ? (
            <ListingCardAction
              label={isSaved ? 'Remove from saved listings' : 'Save land listing'}
              aria-pressed={isSaved}
              icon={<Heart fill={isSaved ? 'currentColor' : 'none'} />}
              onClick={() => toggleSaved(listing.id)}
            />
          ) : undefined
        }
      />
    );
  };

  return (
    <>
      <div className={mode === 'public' ? 'mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8' : ''}>
        <div className="mb-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary">
            <BadgeCheck className="h-3.5 w-3.5" />
            Reviewed land marketplace
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-4xl">
            Buy land with the parcel record in view.
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Every listing here has a verified owner, a completed diligence review that shows what
            was and was not checked, and a protected sale flow: your payment is released to the
            seller only once you confirm each step.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={LAND_BUYER_ROUTES.LAYOUTS}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Estates selling plots
            </Link>
            <Link
              href={LAND_BUYER_ROUTES.MARKET_INSIGHTS}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <BarChart3 className="h-4 w-4" aria-hidden />
              Land prices by area
            </Link>
          </div>
        </div>

        {mode === 'public' && <CollectionsStrip market="land" className="mb-8" />}

        <div className="mb-3">
          <SearchInput
            id="land-search"
            value={search}
            onValueChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search by area, estate, street or plot number"
            label="Search land listings"
          />
        </div>

        <div className="mb-3 grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_0.8fr]">
          <Select
            value={state}
            onValueChange={(value) => {
              updateFilter(setState, value);
              updateFilter(setCity, '');
            }}
            options={stateFilterOptions}
            placeholder="State"
            ariaLabel="Filter by state"
            className="min-h-11"
          />
          <Select
            value={city}
            onValueChange={(value) => updateFilter(setCity, value)}
            options={cityFilterOptionsFor(state)}
            placeholder="City"
            ariaLabel="Filter by city"
            className="min-h-11"
          />
          <CurrencyInput
            prefix="₦"
            min={0}
            value={minPrice}
            onValueChange={(value) => updateFilter(setMinPrice, value === 0 ? '' : String(value))}
            placeholder="Min price"
            aria-label="Minimum price"
          />
          <CurrencyInput
            prefix="₦"
            min={0}
            value={maxPrice}
            onValueChange={(value) => updateFilter(setMaxPrice, value === 0 ? '' : String(value))}
            placeholder="Max price"
            aria-label="Maximum price"
          />
          <Select
            value={sort}
            onValueChange={(value) => {
              setSort(value as Sort);
              setPage(1);
            }}
            options={[
              { value: 'newest', label: 'Newest first' },
              { value: 'price_asc', label: 'Price: low first' },
              { value: 'price_desc', label: 'Price: high first' },
            ]}
            ariaLabel="Sort land listings"
          />
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="w-full sm:w-56">
            <Select
              value={titleType}
              onValueChange={(value) => updateFilter(setTitleType, value)}
              options={TITLE_TYPE_OPTIONS}
              ariaLabel="Title document"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={minArea}
              onValueChange={(value) => updateFilter(setMinArea, value)}
              options={AREA_OPTIONS}
              ariaLabel="Minimum plot size"
            />
          </div>
          <div className="w-full sm:w-56">
            <Select
              value={minAssuranceTier}
              onValueChange={(value) => updateFilter(setMinAssuranceTier, value)}
              options={ASSURANCE_OPTIONS}
              ariaLabel="Minimum assurance"
            />
          </div>
          <Checkbox
            checked={roadAccess}
            onCheckedChange={(v) => {
              setRoadAccess(v);
              setPage(1);
            }}
            label="Road access"
          />
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="inline-block h-4 w-44 align-middle" />
            ) : (
              `${total} verified land ${total === 1 ? 'listing' : 'listings'}${area ? ' in this area' : ''}`
            )}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Payment protection starts once an offer is accepted
            </span>
            <DiscoveryViewToggle
              view={view}
              onChange={(next) => {
                setView(next);
                setPage(1);
                if (next === 'grid') setSelectedId(undefined);
              }}
            />
          </div>
        </div>
        {area && (
          <div className="mb-4">
            <MapAreaNotice onClear={clearArea} />
          </div>
        )}

        {isError && !data ? (
          <PageErrorState
            title="Unable to load land listings."
            description={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
            isRetrying={isFetching}
            headingLevel="h2"
            className="min-h-0 py-10"
          />
        ) : isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-[23rem] rounded-2xl" />
            ))}
          </div>
        ) : view === 'map' ? (
          <MapDiscoveryView
            items={listings}
            title={(l) => l.title}
            price={(l) => l.askingPrice}
            area={area}
            onSearchArea={(next) => {
              setArea(next);
              setPage(1);
              setSelectedId(undefined);
            }}
            onClearArea={clearArea}
            selectedId={selectedId}
            onSelect={setSelectedId}
            empty={
              <EmptyState
                icon={Trees}
                title={
                  area ? 'No verified land in this area' : 'No verified land matches these filters'
                }
                description={
                  area
                    ? 'Move the map and search again, or clear the map area.'
                    : 'Try another city or a wider price range.'
                }
              />
            }
            renderCard={(listing, { selected, position }) =>
              landCard(listing, position, { onMap: true, selected })
            }
          />
        ) : listings.length === 0 ? (
          <EmptyState
            icon={Trees}
            title="No verified land matches these filters"
            description="Try another city or a wider price range. Only parcels that meet our ownership and diligence gates appear here."
          />
        ) : (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing, index) => landCard(listing, index))}
          </div>
        )}

        {total > 0 && (
          <Pagination
            className="mt-8"
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
          />
        )}
      </div>

      <Dialog
        open={Boolean(activeListing)}
        onOpenChange={(open) => {
          if (open) return;
          setActiveListing(null);
          setLinkedListingId(null);
        }}
      >
        <DialogContent className="p-0">
          {activeListing && (
            <div className="max-h-[85vh] overflow-y-auto">
              <div className="relative flex h-48 items-center justify-center bg-muted">
                <Trees className="h-16 w-16 text-primary/60" />
                <div className="absolute bottom-4 left-5 rounded-xl bg-primary px-3 py-1.5 font-semibold text-primary-foreground">
                  {formatCurrency(activeListing.askingPrice)}
                </div>
              </div>
              <div className="space-y-5 p-5">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <DialogTitle className="text-xl font-semibold text-foreground">
                        {activeListing.title}
                      </DialogTitle>
                      <DialogDescription className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {[activeListing.address, activeListing.city, activeListing.state]
                          .filter(Boolean)
                          .join(', ')}
                      </DialogDescription>
                      {activeListing.addressHidden && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          The exact address is shared once the property is verified.
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <AssuranceTierBadge tier={activeListing.diligence?.assuranceTier} />
                    </div>
                  </div>
                  {activeListing.description && (
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {activeListing.description}
                    </p>
                  )}
                </div>

                {Boolean(
                  activeListing.diligence?.labels?.length ||
                  activeListing.diligence?.notVerified?.length
                ) && (
                  <section className="rounded-xl border border-border bg-card p-4">
                    <h3 className="mb-3 font-medium text-foreground">What was checked</h3>
                    <TrustLabelsList
                      labels={activeListing.diligence?.labels}
                      notVerified={activeListing.diligence?.notVerified}
                    />
                  </section>
                )}

                <section className="rounded-xl border border-border bg-secondary/30 p-4">
                  <h3 className="font-medium text-foreground">Public parcel facts</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <Fact label="Area" value={areaLabel(activeListing)} />
                    <Fact
                      label="Title type"
                      value={
                        activeListing.parcel.titleType
                          ? LAND_TITLE_TYPE_LABELS[activeListing.parcel.titleType]
                          : undefined
                      }
                    />
                    <Fact label="Zoning" value={activeListing.parcel.zoning} />
                    <Fact label="Permitted use" value={activeListing.parcel.permittedUse} />
                    <Fact label="Terrain" value={activeListing.parcel.terrain} />
                    <Fact
                      label="Road access"
                      value={activeListing.parcel.roadAccess ? 'Available' : 'Not stated'}
                    />
                    <Fact
                      label="Subdivision"
                      value={activeListing.parcel.subdivisionAllowed ? 'Allowed' : 'Not stated'}
                    />
                    <Fact
                      label="Diligence reviewed"
                      value={
                        activeListing.diligence?.reviewedAt
                          ? formatDate(activeListing.diligence.reviewedAt)
                          : undefined
                      }
                    />
                  </div>
                  {(() => {
                    const outline = boundaryCorners(activeListing.parcel.boundaryGeometry);
                    return outline ? (
                      <div className="mt-4 border-t border-border pt-3">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          Plot outline, as drawn by the owner
                        </p>
                        <ParcelBoundaryMap key={activeListing.id} corners={outline} height={240} />
                      </div>
                    ) : null;
                  })()}
                  {activeListing.parcel.boundaryNotes && (
                    <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
                      {activeListing.parcel.boundaryNotes}
                    </p>
                  )}
                  {activeListing.parcel.utilities?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {activeListing.parcel.utilities.map((utility) => (
                        <Badge key={utility} variant="neutral">
                          {utility}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </section>

                <Alert variant="success" icon={ShieldCheck} title="Protected sale process">
                  <p>
                    Offers, acceptance, protected deposits, and settlement use the same secure buyer
                    transaction flow as other verified sale listings.
                  </p>
                </Alert>

                {activeListing.listedDate && (
                  <p className="text-xs text-muted-foreground">
                    Published {formatDate(activeListing.listedDate)}
                  </p>
                )}
                <Link
                  href={LAND_BUYER_ROUTES.listing(activeListing.id, activeListing.title)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Full listing and price comparison
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
              {canOffer || needsSignIn ? (
                <div className="grid grid-cols-2 gap-3 border-t border-border p-5">
                  <Button
                    href={buyerRoute(`${ROUTES.BUYER_MESSAGES}?property=${activeListing.id}`)}
                    variant="outline"
                    rounded="lg"
                    icon={<MessageSquare className="h-4 w-4" />}
                  >
                    {canOffer ? 'Ask a question' : 'Sign in to ask'}
                  </Button>
                  <Button
                    href={buyerRoute(`${ROUTES.BUYER_OFFERS}?property=${activeListing.id}`)}
                    variant="primary"
                    rounded="lg"
                    icon={<ShieldCheck className="h-4 w-4" />}
                  >
                    {canOffer ? 'Make an offer' : 'Sign in to offer'}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:items-center">
                  <p className="flex-1 text-sm text-muted-foreground">
                    Questions and offers on land come from a buyer account. Add one to this account
                    to make an offer.
                  </p>
                  <Button
                    variant="primary"
                    rounded="lg"
                    icon={<ShieldCheck className="h-4 w-4" />}
                    disabled={addRole.isPending}
                    isLoading={addRole.isPending}
                    onClick={() =>
                      addRole.mutate({
                        role: 'buyer',
                        to: `${ROUTES.BUYER_LAND}?property=${activeListing.id}`,
                      })
                    }
                  >
                    Add a buyer account
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const Fact = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="mt-0.5 font-medium text-foreground">{value || 'Not stated'}</p>
  </div>
);
