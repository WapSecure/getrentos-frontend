'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
} from '@getrentos/ui';
import { CreditCard, MapPin } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { formatCurrency, formatDate } from '@/lib/format';
import type { ShortletBooking, ShortletListing } from '@/types/shortlet';

const TODAY = new Date().toISOString().slice(0, 10);

export function ShortletBookingDialog({
  listing,
  onClose,
  onBook,
  busy,
  createdBooking,
  paying,
  onPay,
}: {
  listing: ShortletListing;
  onClose: () => void;
  onBook: (input: { checkIn: string; checkOut: string; guestCount?: number }) => void;
  busy: boolean;
  createdBooking: ShortletBooking | null;
  paying: boolean;
  onPay: (bookingId: string) => void;
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
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {listing.city}, {listing.state} ·{' '}
              {listing.hostName}
            </span>
          </DialogDescription>
        </div>

        {listing.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.coverImageUrl}
            alt={listing.title}
            className="h-40 w-full border-y border-border object-cover"
          />
        )}

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

          {createdBooking ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm">
                <p className="font-medium">Booked! Your stay is confirmed.</p>
                <p className="mt-1 text-muted-foreground">
                  {formatDate(createdBooking.checkIn)} → {formatDate(createdBooking.checkOut)} ·{' '}
                  {createdBooking.nights} night{createdBooking.nights > 1 ? 's' : ''}
                </p>
                {createdBooking.paymentRequired && (
                  <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-semibold text-foreground">
                      {formatCurrency(createdBooking.total)}
                    </span>{' '}
                    due to complete this booking.
                  </p>
                )}
              </div>
              {createdBooking.paymentRequired && (
                <Button
                  className="w-full"
                  onClick={() => onPay(createdBooking.id)}
                  disabled={paying}
                >
                  <CreditCard className="mr-1.5 h-4 w-4" />
                  {paying ? 'Opening checkout…' : `Pay ${formatCurrency(createdBooking.total)}`}
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={onClose}>
                Done
              </Button>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
