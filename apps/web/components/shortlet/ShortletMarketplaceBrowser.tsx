'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getAuthToken } from '@getrentos/shared';
import {
  Badge,
  Button,
  CurrencyInput,
  DatePicker,
  EmptyState,
  Input,
  Pagination,
  Select,
  Skeleton,
} from '@getrentos/ui';
import { BedDouble, CalendarCheck, MapPin, Search, Star, Zap } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { formatCurrency } from '@/lib/format';
import type { ShortletListing } from '@/types/shortlet';

const PAGE_SIZE = 9;
type Sort = 'newest' | 'price_asc' | 'price_desc';
const TODAY = new Date().toISOString().slice(0, 10);

export const ShortletMarketplaceBrowser = () => {
  const router = useRouter();
  const [isSignedIn] = useState(() => Boolean(getAuthToken()));

  const [city, setCity] = useState('');
  const [guests, setGuests] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [page, setPage] = useState(1);

  const queryParams = useMemo(
    () => ({
      city: city.trim() || undefined,
      guests: guests ? Number(guests) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      sort,
      page,
      pageSize: PAGE_SIZE,
    }),
    [checkIn, checkOut, city, guests, maxPrice, minPrice, page, sort]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: [...shortletKeys.public, queryParams],
    queryFn: () => unwrap(shortletService.listPublic(queryParams)),
  });
  const listings = data?.items ?? [];
  const total = data?.total ?? 0;

  const updateFilter = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const openListing = (listing: ShortletListing) => {
    if (!isSignedIn) {
      router.push(ROUTES.LOGIN);
      return;
    }
    router.push(`/shortlets/${listing.id}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Shortlet Stays</h1>
        <p className="mt-1 text-muted-foreground">
          Furnished apartments and homes available for short stays — book by the night or flat rate.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-7">
        <div className="col-span-2 md:col-span-1">
          <Input
            placeholder="City"
            value={city}
            onChange={(e) => updateFilter(setCity, e.target.value)}
          />
        </div>
        <Input
          placeholder="Guests"
          type="number"
          min={1}
          value={guests}
          onChange={(e) => updateFilter(setGuests, e.target.value)}
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

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={Search}
          title="Could not load shortlets"
          description="Please try again."
        />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="No shortlets found"
          description="Try adjusting your filters."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <div
              key={listing.id}
              role="button"
              tabIndex={0}
              onClick={() => openListing(listing)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openListing(listing);
                }
              }}
              className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition hover:shadow-md"
            >
              <div className="relative flex h-40 items-center justify-center bg-secondary/60">
                {listing.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.coverImageUrl}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <BedDouble className="h-10 w-10 text-muted-foreground" />
                )}
                <div className="absolute left-3 top-3 flex gap-2">
                  {listing.instantBooking && (
                    <Badge className="bg-primary text-primary-foreground">
                      <Zap className="mr-1 h-3 w-3" /> Instant
                    </Badge>
                  )}
                  {listing.isVerified && <Badge variant="info">Verified host</Badge>}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium leading-snug">{listing.title}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {listing.city}, {listing.state}
                  {listing.reviewCount > 0 && listing.ratingAverage != null && (
                    <span className="ml-1 flex items-center gap-0.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {listing.ratingAverage.toFixed(1)}
                      <span className="text-muted-foreground/70">({listing.reviewCount})</span>
                    </span>
                  )}
                </p>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-lg font-semibold">
                      {listing.nightlyRate != null ? formatCurrency(listing.nightlyRate) : '—'}
                      {listing.pricingMode === 'PER_NIGHT' && (
                        <span className="text-xs font-normal text-muted-foreground"> / night</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {listing.pricingMode === 'FLAT_STAY'
                        ? 'Flat per stay'
                        : `min ${listing.minNights} night${listing.minNights > 1 ? 's' : ''}`}
                      {' · '}
                      up to {listing.maxGuests} guests
                      {listing.deposit ? ` · ${formatCurrency(listing.deposit)} deposit` : ''}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="opacity-90 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      openListing(listing);
                    }}
                  >
                    <CalendarCheck className="mr-1.5 h-4 w-4" />{' '}
                    {isSignedIn ? 'Book' : 'Sign in to book'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
};
