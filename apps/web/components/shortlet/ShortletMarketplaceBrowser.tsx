'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuthToken } from '@getrentos/shared';
import {
  Badge,
  Button,
  CurrencyInput,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  Pagination,
  Select,
  Skeleton,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { BedDouble, CalendarCheck, MapPin, Search, Zap } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { formatCurrency } from '@/lib/format';
import type { ShortletBooking, ShortletListing } from '@/types/shortlet';

const PAGE_SIZE = 9;
type Sort = 'newest' | 'price_asc' | 'price_desc';
const TODAY = new Date().toISOString().slice(0, 10);

export const ShortletMarketplaceBrowser = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSignedIn] = useState(() => Boolean(getAuthToken()));

  const [city, setCity] = useState('');
  const [guests, setGuests] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<ShortletListing | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const queryParams = useMemo(
    () => ({
      city: city.trim() || undefined,
      guests: guests ? Number(guests) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
      page,
      pageSize: PAGE_SIZE,
    }),
    [city, guests, maxPrice, minPrice, page, sort]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: [...shortletKeys.public, queryParams],
    queryFn: () => unwrap(shortletService.listPublic(queryParams)),
  });
  const listings = data?.items ?? [];
  const total = data?.total ?? 0;

  const book = useMutation({
    mutationFn: (input: {
      listingId: string;
      checkIn: string;
      checkOut: string;
      guestCount?: number;
    }) =>
      unwrap(
        shortletService.book(input.listingId, {
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          guestCount: input.guestCount,
        })
      ),
    onSuccess: (booking: ShortletBooking) => {
      setActive(null);
      queryClient.invalidateQueries({ queryKey: shortletKeys.guestBookings });
      setToast({
        message:
          booking.status === 'CONFIRMED'
            ? `Booked! Your stay is confirmed (${formatCurrency(booking.total)}).`
            : 'Booking request sent — the host will confirm shortly.',
        variant: 'success',
      });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  const updateFilter = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const openListing = (listing: ShortletListing) => {
    if (isSignedIn) setActive(listing);
    else router.push(ROUTES.LOGIN);
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
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
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

      {active && (
        <BookingDialog
          listing={active}
          onClose={() => setActive(null)}
          onBook={(input) =>
            book.mutate({
              listingId: active.id,
              checkIn: input.checkIn,
              checkOut: input.checkOut,
              guestCount: input.guestCount,
            })
          }
          busy={book.isPending}
        />
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

function BookingDialog({
  listing,
  onClose,
  onBook,
  busy,
}: {
  listing: ShortletListing;
  onClose: () => void;
  onBook: (input: { checkIn: string; checkOut: string; guestCount?: number }) => void;
  busy: boolean;
}) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestCount, setGuestCount] = useState('1');
  const [error, setError] = useState<string | null>(null);

  const { data: availability } = useQuery({
    queryKey: [...shortletKeys.availability(listing.id), { checkIn, checkOut }],
    queryFn: () =>
      unwrap(shortletService.availability(listing.id, checkIn || undefined, checkOut || undefined)),
    enabled: Boolean(checkIn && checkOut),
  });

  const handleCheckIn = (value: string) => {
    setCheckIn(value);
    if (checkOut && value && checkOut <= value) setCheckOut('');
  };

  const submit = () => {
    setError(null);
    if (!checkIn || !checkOut) {
      setError('Please pick check-in and check-out dates.');
      return;
    }
    if (availability && !availability.available) {
      setError(availability.reason ?? 'Those dates are not available.');
      return;
    }
    onBook({
      checkIn,
      checkOut,
      guestCount: guestCount ? Number(guestCount) : undefined,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <div className="p-5">
          <DialogTitle>{listing.title}</DialogTitle>
          <DialogDescription>
            {listing.city}, {listing.state} · {listing.hostName}
          </DialogDescription>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto border-t border-border p-5">
          <div>
            <p className="text-2xl font-semibold">
              {listing.nightlyRate != null ? formatCurrency(listing.nightlyRate) : '—'}
              {listing.pricingMode === 'PER_NIGHT' && (
                <span className="text-sm font-normal text-muted-foreground"> / night</span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {listing.pricingMode === 'PER_NIGHT'
                ? `Min ${listing.minNights} night${listing.minNights > 1 ? 's' : ''}`
                : 'Flat rate for the whole stay'}
              {listing.cleaningFee ? ` · ${formatCurrency(listing.cleaningFee)} cleaning fee` : ''}
              {listing.weekendUpliftPct ? ` · +${listing.weekendUpliftPct}% on weekends` : ''}
            </p>
          </div>

          {listing.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {listing.amenities.slice(0, 8).map((a) => (
                <Badge key={a} variant="neutral">
                  {a}
                </Badge>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Check-in">
              <DatePicker
                value={checkIn}
                onChange={handleCheckIn}
                min={TODAY}
                placeholder="Select check-in"
              />
            </Field>
            <Field label="Check-out">
              <DatePicker
                value={checkOut}
                onChange={setCheckOut}
                min={checkIn || TODAY}
                placeholder="Select check-out"
              />
            </Field>
          </div>
          <Field label="Guests" hint={`Max ${listing.maxGuests}`}>
            <Input
              type="number"
              min={1}
              max={listing.maxGuests}
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
            />
          </Field>

          {availability && (
            <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
              {availability.available ? (
                <p>
                  {availability.estimatedNights} night{availability.estimatedNights! > 1 ? 's' : ''}{' '}
                  ·{' '}
                  <span className="font-semibold">
                    {formatCurrency(availability.estimatedTotal ?? 0)}
                  </span>{' '}
                  total
                </p>
              ) : (
                <p className="text-destructive">{availability.reason}</p>
              )}
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" onClick={submit} disabled={busy}>
            {busy
              ? 'Booking…'
              : listing.instantBooking
                ? 'Book now — instant confirmation'
                : 'Request to book'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {listing.instantBooking
              ? 'Instant booking is enabled for this stay.'
              : 'The host will confirm your request before it is booked.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
