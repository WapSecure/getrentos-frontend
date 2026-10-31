'use client';

import { useEffect, useMemo, useState } from 'react';
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
  IconButton,
  PageErrorState,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  useToast,
} from '@getrentos/ui';
import {
  ArrowUpDown,
  BadgeCheck,
  BarChart3,
  ExternalLink,
  Heart,
  LayoutGrid,
  MapPin,
  MessageSquare,
  Ruler,
  ShieldCheck,
  Trees,
} from 'lucide-react';
import { landMarketService } from '@/services/landMarketService';
import { buyerService } from '@/services/buyerService';
import { unwrap } from '@/lib/apiHelpers';
import { landKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { useBuyerViewer } from '@/lib/viewer';
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
import { boundaryCorners } from '@getrentos/shared';
import { ParcelBoundaryMap } from '@/components/maps/ParcelBoundaryMap';
import { useAddRole } from '@/hooks/useAddRole';
import Link from 'next/link';
import { AssuranceTierBadge } from '@/components/land/market/AssuranceTierBadge';
import { TrustLabelsList } from '@/components/land/market/TrustLabelsList';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import type { LandAssuranceTier } from '@/types/land';

type MarketplaceMode = 'public' | 'buyer';
type Sort = 'newest' | 'price_asc' | 'price_desc';
/** Whether the person browsing can actually make an offer, and if not, why. */
type LandViewer = 'buyer' | 'member' | 'anonymous';

interface LandMarketplaceBrowserProps {
  mode: MarketplaceMode;
}

const PAGE_SIZE = 9;

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

/** "At least this tier"; BASIC is every verified listing, so it is the default. */
const ASSURANCE_OPTIONS = [
  { value: '', label: 'Any assurance' },
  { value: 'STANDARD', label: 'Registry-searched or better' },
  { value: 'PREMIUM', label: 'Independently reviewed only' },
];

/** Square metres; a standard Lagos plot is roughly 450–650 sqm. */
const AREA_OPTIONS = [
  { value: '', label: 'Any plot size' },
  { value: '450', label: '450 sqm+ (a plot)' },
  { value: '900', label: '900 sqm+ (2 plots)' },
  { value: '4047', label: '1 acre+' },
  { value: '10000', label: '1 hectare+' },
];

export const LandMarketplaceBrowser = ({ mode }: LandMarketplaceBrowserProps) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);
  const [titleType, setTitleType] = useState('');
  const [minArea, setMinArea] = useState('');
  const [roadAccess, setRoadAccess] = useState(false);
  const [minAssuranceTier, setMinAssuranceTier] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [page, setPage] = useState(1);
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
      pageSize: PAGE_SIZE,
    }),
    [
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

  // A link naming a listing (?property=<id>, as after "Add a buyer account")
  // opens it as soon as it is on the page, until it is closed.
  const [linkedListingId, setLinkedListingId] = useState<string | null>(() =>
    typeof window === 'undefined'
      ? null
      : new URLSearchParams(window.location.search).get('property')
  );
  const activeListing =
    chosenListing ??
    (linkedListingId ? (listings.find((listing) => listing.id === linkedListingId) ?? null) : null);
  const total = data?.total ?? 0;

  // Saving is shown at once and undone if the server refuses.
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

  /**
   * Who is looking at the parcels. `mode` only says which surface rendered the
   * marketplace, so on the public page the CTAs used to tell a signed-in visitor
   * to "sign in": and sent them to a sign-in form they had already passed.
   */
  const viewer: LandViewer = useBuyerViewer();
  const canOffer = mode === 'buyer' || viewer === 'buyer';
  const addRole = useAddRole();
  const needsSignIn = viewer === 'anonymous';

  /**
   * Buyers act in place. A signed-in visitor without a buyer account is pointed
   * at the buyer area, whose layout moves them somewhere they can actually use,
   * rather than at the sign-in form.
   */
  const buyerRoute = (path: string) =>
    canOffer ? path : needsSignIn ? ROUTES.LOGIN : ROUTES.BUYER_LAND;

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

        <div className="mb-3 grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_0.8fr]">
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
              `${total} verified land ${total === 1 ? 'listing' : 'listings'}`
            )}
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Payment protection starts once an offer is accepted
          </span>
        </div>

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
        ) : listings.length === 0 ? (
          <EmptyState
            icon={Trees}
            title="No verified land matches these filters"
            description="Try another city or a wider price range. Only parcels that meet our ownership and diligence gates appear here."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const isSaved = savedListingIds.includes(listing.id);
              return (
                <article
                  key={listing.id}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(0,0,0,0.12)]"
                >
                  <div className="relative flex h-44 items-center justify-center overflow-hidden bg-muted">
                    <Trees className="h-12 w-12 text-primary/60" />
                    <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
                      <Badge variant="success" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
                        Diligence verified
                      </Badge>
                      <AssuranceTierBadge tier={listing.diligence?.assuranceTier} />
                    </div>
                    {mode === 'buyer' && (
                      <IconButton
                        label={isSaved ? 'Remove from saved listings' : 'Save land listing'}
                        aria-pressed={isSaved}
                        size="sm"
                        icon={
                          <Heart className={isSaved ? 'fill-destructive text-destructive' : ''} />
                        }
                        onClick={() => toggleSaved(listing.id)}
                        className="absolute right-3 top-3 rounded-xl bg-card/90 text-foreground shadow-sm backdrop-blur hover:bg-card"
                      />
                    )}
                    <div className="absolute bottom-3 left-3 rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm">
                      {formatCurrency(listing.askingPrice, { compact: true })}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary">
                      Land for sale
                    </p>
                    <h2 className="mt-1 truncate font-semibold text-foreground">{listing.title}</h2>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {listing.city}, {listing.state}
                    </p>
                    {parcelTitle(listing) && (
                      <p className="mt-2 truncate text-xs text-muted-foreground">
                        {parcelTitle(listing)}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Ruler className="h-3.5 w-3.5" />
                        {areaLabel(listing)}
                      </span>
                      {listing.parcel.zoning && <span>{listing.parcel.zoning}</span>}
                      {listing.parcel.roadAccess && <span>Road access</span>}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      rounded="lg"
                      fullWidth
                      className="mt-4"
                      onClick={() => setActiveListing(listing)}
                    >
                      Inspect parcel
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {total > 0 && (
          <Pagination
            className="mt-8"
            page={page}
            pageSize={PAGE_SIZE}
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
                  href={LAND_BUYER_ROUTES.listing(activeListing.id)}
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
                // Signed in, but not as a buyer: there is nothing here this
                // account can do, so say why instead of two dead-end buttons.
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
