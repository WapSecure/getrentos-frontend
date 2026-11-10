'use client';

import { useEffect, useMemo, useState } from 'react';
import { track } from '@/lib/analytics';
import { useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  CurrencyInput,
  DatePicker,
  EmptyState,
  ListingCard,
  ListingCardAction,
  NumberInput,
  PageErrorState,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  ToggleChip,
} from '@sureground/ui';
import { BedDouble, ClipboardCheck, Heart, Star, Zap } from '@sureground/icons';
import { unwrap } from '@/lib/apiHelpers';
import { SHORTLET_AMENITIES } from '@/lib/shortlet/essentials';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { ALL_NIGERIAN_CITIES } from '@/lib/constants/locations';
import { useShortletWishlist } from '@/hooks/useShortletWishlist';
import { formatCurrency } from '@/lib/format';

const PAGE_SIZE = 9;
type Sort = 'newest' | 'price_asc' | 'price_desc';
const TODAY = new Date().toISOString().slice(0, 10);

export const ShortletMarketplaceBrowser = ({
  initialCheckIn = '',
  initialCheckOut = '',
  hideHeader = false,
}: {
  initialCheckIn?: string;
  initialCheckOut?: string;
  hideHeader?: boolean;
} = {}) => {
  const router = useRouter();
  const wishlist = useShortletWishlist();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);
  const [bedrooms, setBedrooms] = useState('');
  const [instantOnly, setInstantOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [power24h, setPower24h] = useState(false);
  const [petsOnly, setPetsOnly] = useState(false);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [guests, setGuests] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [sort, setSort] = useState<Sort>('newest');
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const estateFromUrl = searchParams.get('estate')?.trim() ?? '';

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      instantBooking: instantOnly,
      verifiedOnly,
      power24h,
      petsAllowed: petsOnly,
      amenities,
      city: city.trim() || undefined,
      guests: guests ? Number(guests) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      sort,
      estate: estateFromUrl || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [
      checkIn,
      checkOut,
      city,
      guests,
      maxPrice,
      minPrice,
      page,
      sort,
      estateFromUrl,
      debouncedSearch,
      bedrooms,
      instantOnly,
      verifiedOnly,
      power24h,
      petsOnly,
      amenities,
    ]
  );

  const { data, isLoading, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: [...shortletKeys.public, queryParams],
    queryFn: () => unwrap(shortletService.listPublic(queryParams)),
    placeholderData: keepPreviousData,
  });
  const listings = data?.items ?? [];
  const total = data?.total ?? 0;

  const updateFilter = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {!hideHeader && (
        <div className="mb-8 flex flex-col items-start gap-2.5 border-b border-border/60 pb-6">
          <span className="inline-flex items-center rounded-full border border-primary/15 bg-accent/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
            Short stays
          </span>
          <h1 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
            Shortlet stays
          </h1>
          <p className="text-muted-foreground sm:text-lg">
            Furnished apartments and homes available for short stays: book by the night or flat
            rate.
          </p>
        </div>
      )}

      <div className="mb-3">
        <SearchInput
          id="shortlet-search"
          value={search}
          onValueChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by area, street, estate or title"
          label="Search shortlets"
        />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <div className="col-span-2 md:col-span-2 xl:col-span-1">
          <Select
            value={city}
            onValueChange={(value) => updateFilter(setCity, value)}
            options={[
              { value: '', label: 'All cities' },
              ...ALL_NIGERIAN_CITIES.map((c) => ({ value: c, label: c })),
            ]}
            placeholder="City"
            ariaLabel="Filter by city"
          />
        </div>
        <NumberInput
          placeholder="Guests"
          min={1}
          value={guests}
          onValueChange={(value) => updateFilter(setGuests, value)}
        />
        <CurrencyInput
          prefix="₦"
          placeholder="Min price"
          value={minPrice}
          onValueChange={(v) => updateFilter(setMinPrice, v === 0 ? '' : String(v))}
        />
        <CurrencyInput
          prefix="₦"
          placeholder="Max price"
          value={maxPrice}
          onValueChange={(v) => updateFilter(setMaxPrice, v === 0 ? '' : String(v))}
        />
        <DatePicker
          value={checkIn}
          onChange={(v) => {
            updateFilter(setCheckIn, v);
            if (checkOut && v && checkOut <= v) setCheckOut('');
          }}
          min={TODAY}
          placeholder="Check-in"
        />
        <DatePicker
          value={checkOut}
          onChange={(v) => updateFilter(setCheckOut, v)}
          min={checkIn || TODAY}
          placeholder="Check-out"
        />
        <Select
          value={sort}
          onValueChange={(v) => {
            setSort(v as Sort);
            setPage(1);
          }}
          placeholder="Sort"
          options={[
            { value: 'newest', label: 'Newest' },
            { value: 'price_asc', label: 'Price: low to high' },
            { value: 'price_desc', label: 'Price: high to low' },
          ]}
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="w-40">
          <Select
            ariaLabel="Bedrooms"
            value={bedrooms}
            onValueChange={(v) => updateFilter(setBedrooms, v)}
            options={[
              { value: '', label: 'Any bedrooms' },
              ...[1, 2, 3, 4].map((n) => ({
                value: String(n),
                label: `${n}+ bedroom${n === 1 ? '' : 's'}`,
              })),
            ]}
          />
        </div>
        <Checkbox
          checked={instantOnly}
          onCheckedChange={(v) => {
            setInstantOnly(v);
            setPage(1);
          }}
          label="Instant booking"
        />
        <Checkbox
          checked={verifiedOnly}
          onCheckedChange={(v) => {
            setVerifiedOnly(v);
            setPage(1);
          }}
          label="Verified only"
        />
        <Checkbox
          checked={power24h}
          onCheckedChange={(v) => {
            setPower24h(v);
            setPage(1);
          }}
          label="24-hour power"
        />
        <Checkbox
          checked={petsOnly}
          onCheckedChange={(v) => {
            setPetsOnly(v);
            setPage(1);
          }}
          label="Pets allowed"
        />
      </div>
      <div className="-mt-3 mb-6 flex flex-wrap gap-2" role="group" aria-label="Amenities">
        {SHORTLET_AMENITIES.filter((a) => a !== '24/7 Power').map((amenity) => {
          const on = amenities.includes(amenity);
          return (
            <ToggleChip
              key={amenity}
              size="sm"
              pressed={on}
              onPressedChange={() => {
                setAmenities((current) =>
                  on ? current.filter((a) => a !== amenity) : [...current, amenity]
                );
                setPage(1);
              }}
            >
              {amenity}
            </ToggleChip>
          );
        })}
      </div>

      {estateFromUrl && (
        <Alert
          variant="neutral"
          icon={null}
          className="mb-4"
          action={
            <Button variant="ghost" size="sm" onClick={() => router.replace('/shortlets')}>
              Show all shortlets
            </Button>
          }
        >
          <span className="text-muted-foreground">
            Showing only short-stays inside{' '}
            <span className="font-medium text-foreground">
              {estateFromUrl.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
            .
          </span>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : isError && !data ? (
        <PageErrorState
          headingLevel="h2"
          title="Could not load shortlets"
          description="Please try again."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="No shortlets found"
          description="Try adjusting your filters."
        />
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing, index) => {
            const quote = listing.stayQuote?.bookable ? listing.stayQuote.quote : undefined;
            const saved = wishlist.isSaved(listing.id);
            return (
              <ListingCard
                key={listing.id}
                href={`/shortlets/${listing.id}`}
                onVisible={() =>
                  track({
                    name: 'property_impression',
                    listingId: listing.id,
                    market: 'shortlet',
                    surface: 'shortlet_list',
                    props: { position: index },
                  })
                }
                onOpen={() =>
                  track({
                    name: 'property_card_click',
                    listingId: listing.id,
                    market: 'shortlet',
                    surface: 'shortlet_list',
                    props: { position: index },
                  })
                }
                title={listing.title}
                location={`${listing.city}, ${listing.state}`}
                price={quote ? quote.total : listing.nightlyRate}
                priceUnit={
                  quote ? 'total' : listing.pricingMode === 'PER_NIGHT' ? 'night' : undefined
                }
                image={listing.coverImageUrl}
                imageAlt={listing.title}
                eager={index < 3}
                status="Shortlet"
                badges={
                  <>
                    {listing.instantBooking && (
                      <Badge variant="primary" icon={<Zap className="h-3 w-3" />}>
                        Instant
                      </Badge>
                    )}
                    {listing.isVerified && <Badge variant="info">Verified host</Badge>}
                    {listing.fairPrice && (
                      <span
                        title={`Typical for ${listing.fairPrice.bedrooms}-bedroom stays in ${listing.fairPrice.city}: ${formatCurrency(listing.fairPrice.typicalNightly)}/night (${listing.fairPrice.comparables} stays)`}
                      >
                        <Badge variant="info">Fair price</Badge>
                      </span>
                    )}
                    {listing.inspection && (
                      <Badge variant="success" icon={<ClipboardCheck className="h-3 w-3" />}>
                        Inspected
                      </Badge>
                    )}
                  </>
                }
                facts={{
                  beds: listing.bedrooms,
                  baths: listing.bathrooms,
                  extra: [`Up to ${listing.maxGuests} guests`],
                }}
                priceNote={
                  quote ? (
                    <>
                      {quote.nights} night{quote.nights === 1 ? '' : 's'}, incl. cleaning
                      {quote.taxName ? ` & ${quote.taxName}` : ''}
                      {' · '}
                      {formatCurrency(quote.perNight)}/night avg
                      {quote.deposit
                        ? ` · + ${formatCurrency(quote.deposit)} refundable deposit`
                        : ''}
                    </>
                  ) : listing.stayQuote && !listing.stayQuote.bookable ? (
                    <span className="text-warning">{listing.stayQuote.reason}</span>
                  ) : (
                    <>
                      {listing.pricingMode === 'FLAT_STAY'
                        ? 'Flat per stay'
                        : `Min ${listing.minNights} night${listing.minNights > 1 ? 's' : ''}`}
                      {listing.deposit ? ` · ${formatCurrency(listing.deposit)} deposit` : ''}
                      {' · pick dates to see the total'}
                    </>
                  )
                }
                meta={
                  listing.reviewCount > 0 && listing.ratingAverage != null ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
                      <span className="data-value text-foreground">
                        {listing.ratingAverage.toFixed(1)}
                      </span>
                      <span>
                        ({listing.reviewCount} review{listing.reviewCount === 1 ? '' : 's'})
                      </span>
                    </span>
                  ) : undefined
                }
                actions={
                  wishlist.canUseWishlist ? (
                    <ListingCardAction
                      label={saved ? 'Remove from saved' : 'Save listing'}
                      aria-pressed={saved}
                      icon={<Heart fill={saved ? 'currentColor' : 'none'} />}
                      onClick={() => wishlist.toggle.mutate(listing.id)}
                    />
                  ) : undefined
                }
              />
            );
          })}
        </div>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
        isLoading={isPending}
      />
    </div>
  );
};
