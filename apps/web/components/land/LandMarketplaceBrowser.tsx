'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  NumberInput,
  Pagination,
  Select,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import {
  ArrowUpDown,
  BadgeCheck,
  Heart,
  MapPin,
  MessageSquare,
  Ruler,
  ShieldCheck,
  Sparkles,
  Trees,
} from 'lucide-react';
import { landService } from '@/services/landService';
import { buyerService } from '@/services/buyerService';
import { unwrap } from '@/lib/apiHelpers';
import { landKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
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

type MarketplaceMode = 'public' | 'buyer';
type Sort = 'newest' | 'price_asc' | 'price_desc';

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

export const LandMarketplaceBrowser = ({ mode }: LandMarketplaceBrowserProps) => {
  const queryClient = useQueryClient();
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [page, setPage] = useState(1);
  const [activeListing, setActiveListing] = useState<PublicLandListing | null>(null);
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const queryParams = useMemo(
    () => ({
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
      page,
      pageSize: PAGE_SIZE,
    }),
    [city, maxPrice, minPrice, page, sort, state]
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...landKeys.public, queryParams],
    queryFn: () => unwrap(landService.listPublic(queryParams)),
  });
  const listings = data?.items ?? [];
  const total = data?.total ?? 0;

  const saveListing = useMutation({
    mutationFn: (listingId: string) => unwrap(buyerService.saveListing(listingId)),
    onSuccess: (_, listingId) => {
      setSavedListingIds((ids) => [...ids, listingId]);
      queryClient.invalidateQueries({ queryKey: ['buyer', 'saved'] });
      setToast({ message: 'Land listing saved to your shortlist.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const unsaveListing = useMutation({
    mutationFn: (listingId: string) => unwrap(buyerService.unsaveListing(listingId)),
    onSuccess: (_, listingId) => {
      setSavedListingIds((ids) => ids.filter((id) => id !== listingId));
      queryClient.invalidateQueries({ queryKey: ['buyer', 'saved'] });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
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

  const buyerRoute = (path: string) => (mode === 'buyer' ? path : ROUTES.LOGIN);

  return (
    <>
      <div className={mode === 'public' ? 'mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8' : ''}>
        <div className="mb-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Verified land marketplace
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-4xl">
            Buy land with the parcel record in view.
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Every listing here has a verified owner, an approved diligence review, and a live
            escrow-ready sale flow.
          </p>
        </div>

        <div className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_0.8fr]">
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
          <NumberInput
            integer
            min="0"
            value={minPrice}
            onValueChange={(value) => updateFilter(setMinPrice, value)}
            placeholder="Min price"
          />
          <NumberInput
            integer
            min="0"
            value={maxPrice}
            onValueChange={(value) => updateFilter(setMaxPrice, value)}
            placeholder="Max price"
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

        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? 'Loading verified land…'
              : `${total} verified land ${total === 1 ? 'listing' : 'listings'}`}
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ArrowUpDown className="h-3.5 w-3.5" />
            Escrow protection follows accepted offers
          </span>
        </div>

        {isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {error instanceof Error ? error.message : 'Unable to load land listings.'}
          </div>
        ) : isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-[23rem] animate-pulse rounded-2xl bg-secondary" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <Trees className="mx-auto h-9 w-9 text-primary" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">
              No verified land matches these filters
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Try another city or a wider price range. Only parcels that meet our ownership and
              diligence gates appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const isSaved = savedListingIds.includes(listing.id);
              return (
                <article
                  key={listing.id}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(0,0,0,0.12)]"
                >
                  <div className="relative flex h-44 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.20),transparent_45%),linear-gradient(135deg,hsl(var(--secondary)),hsl(var(--muted)))]">
                    <Trees className="h-12 w-12 text-primary/60" />
                    <div className="absolute left-3 top-3">
                      <Badge variant="success" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
                        Diligence verified
                      </Badge>
                    </div>
                    {mode === 'buyer' && (
                      <button
                        type="button"
                        onClick={() => toggleSaved(listing.id)}
                        aria-label={isSaved ? 'Remove from saved listings' : 'Save land listing'}
                        className="absolute right-3 top-3 rounded-xl bg-card/90 p-2 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-card"
                      >
                        <Heart
                          className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`}
                        />
                      </button>
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
        onOpenChange={(open) => !open && setActiveListing(null)}
      >
        <DialogContent>
          {activeListing && (
            <div className="max-h-[85vh] overflow-y-auto">
              <div className="relative flex h-48 items-center justify-center bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.22),transparent_45%),linear-gradient(135deg,hsl(var(--secondary)),hsl(var(--muted)))]">
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
                        {activeListing.address}, {activeListing.city}, {activeListing.state}
                      </DialogDescription>
                    </div>
                    <Badge variant="success" icon={<BadgeCheck className="h-3.5 w-3.5" />}>
                      Verified parcel
                    </Badge>
                  </div>
                  {activeListing.description && (
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {activeListing.description}
                    </p>
                  )}
                </div>

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
                    <Fact label="Diligence" value="Verified" />
                  </div>
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

                <div className="rounded-xl border border-success/25 bg-success/5 p-3 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2 font-medium text-foreground">
                    <ShieldCheck className="h-4 w-4 text-success" />
                    Protected sale process
                  </p>
                  <p className="mt-1">
                    Offers, acceptance, escrow deposits, and settlement use the same secure buyer
                    transaction flow as other verified sale listings.
                  </p>
                </div>

                {activeListing.listedDate && (
                  <p className="text-xs text-muted-foreground">
                    Published {formatDate(activeListing.listedDate)}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-border p-5">
                <Button
                  href={buyerRoute(`${ROUTES.BUYER_MESSAGES}?property=${activeListing.id}`)}
                  variant="outline"
                  rounded="lg"
                  icon={<MessageSquare className="h-4 w-4" />}
                >
                  {mode === 'buyer' ? 'Ask a question' : 'Sign in to ask'}
                </Button>
                <Button
                  href={buyerRoute(`${ROUTES.BUYER_OFFERS}?property=${activeListing.id}`)}
                  variant="primary"
                  rounded="lg"
                  icon={<ShieldCheck className="h-4 w-4" />}
                >
                  {mode === 'buyer' ? 'Make an offer' : 'Sign in to offer'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
};

const Fact = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="mt-0.5 font-medium text-foreground">{value || 'Not stated'}</p>
  </div>
);
