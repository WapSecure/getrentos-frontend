import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  DateField,
  Divider,
  Price,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { shortletsApi, type ShortletListing } from '@/lib/api/shortlets';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  listing: ShortletListing | null;
}

export function BookStaySheet({ open, onClose, listing }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Book this stay">
      {/* Remount on each open so the dates always start blank. */}
      {listing ? (
        <BookForm key={open ? 'open' : 'closed'} onClose={onClose} listing={listing} />
      ) : null}
    </Sheet>
  );
}

function BookForm({ onClose, listing }: { onClose: () => void; listing: ShortletListing }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('1');

  const rangeChosen = !!checkIn && !!checkOut && checkOut > checkIn;

  // The API prices the exact range, so the guest sees the real total before committing.
  const quote = useQuery({
    queryKey: qk.shortlets.availability(listing.id, checkIn, checkOut),
    queryFn: () => shortletsApi.availability(listing.id, checkIn, checkOut),
    enabled: rangeChosen,
  });

  const guestCount = Math.max(1, Number(guests) || 1);
  const overCapacity = guestCount > listing.maxGuests;

  const mutation = useMutation({
    mutationFn: () => shortletsApi.book(listing.id, { checkIn, checkOut, guestCount }),
    onSuccess: (booking) => {
      qc.invalidateQueries({ queryKey: ['shortlets', 'bookings'] });
      toast.show('Booking requested.', 'success');
      onClose();
      router.push(`/(app)/shortlet-bookings?highlight=${booking.id}`);
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not book this stay.', 'error'),
  });

  const unavailable = rangeChosen && quote.data && !quote.data.available;
  const canSubmit = rangeChosen && !overCapacity && !unavailable && !quote.isFetching;

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        <Text variant="bodyStrong">{listing.title}</Text> · up to {listing.maxGuests}{' '}
        {listing.maxGuests === 1 ? 'guest' : 'guests'} · minimum {listing.minNights}{' '}
        {listing.minNights === 1 ? 'night' : 'nights'}
      </Text>

      <DateField
        label="Check in"
        value={checkIn}
        onChange={setCheckIn}
        min={toISODate(new Date())}
      />
      <DateField
        label="Check out"
        value={checkOut}
        onChange={setCheckOut}
        min={checkIn || toISODate(new Date())}
      />
      <TextField
        label="Guests"
        value={guests}
        onChangeText={setGuests}
        keyboardType="number-pad"
        error={overCapacity ? `This stay sleeps at most ${listing.maxGuests}.` : undefined}
      />

      {rangeChosen ? (
        <View style={{ gap: spacing.xs }}>
          <Divider />
          {quote.isFetching ? (
            <Text variant="callout" color="mutedForeground">
              Checking availability…
            </Text>
          ) : unavailable ? (
            <Text variant="callout" style={{ color: colors.destructive }}>
              Those dates aren&apos;t available.
            </Text>
          ) : quote.data ? (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="callout" color="mutedForeground">
                  {quote.data.estimatedNights}{' '}
                  {quote.data.estimatedNights === 1 ? 'night' : 'nights'}
                </Text>
                {quote.data.estimatedTax ? (
                  <Text variant="caption" color="mutedForeground">
                    incl. {quote.data.taxName ?? 'tax'} ₦{quote.data.estimatedTax.toLocaleString()}
                  </Text>
                ) : null}
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text variant="bodyStrong">Total</Text>
                <Price amount={quote.data.estimatedTotal ?? 0} variant="bodyStrong" />
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      <Button
        label={listing.instantBooking ? 'Book now' : 'Request to book'}
        loading={mutation.isPending}
        disabled={!canSubmit}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
