import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, ChevronRight } from 'lucide-react-native';
import { Button, FormAlert, Skeleton, Text, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { Stepper } from '@/components/host/HostUI';
import { qk } from '@/lib/query/keys';
import { shortletsApi, type ShortletListing } from '@/lib/api/shortlets';
import { ApiError } from '@/lib/api/client';
import { nightsLabel, seasonRange } from '@/lib/stays';
import { haptics } from '@/lib/haptics';
import { PriceBreakdown } from './StayUI';
import type { StayDates } from './StayDatesSheet';

interface Props {
  open: boolean;
  onClose: () => void;
  listing: ShortletListing;
  dates: StayDates;
  guests: number;
  onGuestsChange: (n: number) => void;
  /** Close this sheet and pick other dates. */
  onChangeDates: () => void;
}

/**
 * The last step before booking: the exact dates, the party, and every naira
 * of the price. Instant stays confirm now; others go to the host first.
 */
export function BookStaySheet(props: Props) {
  return (
    <Sheet open={props.open} onClose={props.onClose} title="Confirm your stay">
      {props.open ? <BookForm {...props} /> : null}
    </Sheet>
  );
}

function BookForm({ onClose, listing, dates, guests, onGuestsChange, onChangeDates }: Props) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [blocked, setBlocked] = useState<{ code?: string; message: string } | null>(null);

  const quote = useQuery({
    queryKey: qk.shortlets.availability(listing.id, dates.checkIn, dates.checkOut),
    queryFn: () => shortletsApi.availability(listing.id, dates.checkIn, dates.checkOut),
  });

  const book = useMutation({
    mutationFn: () =>
      shortletsApi.book(listing.id, {
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        guestCount: guests,
      }),
    onSuccess: (booking) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['shortlets', 'bookings'] });
      qc.invalidateQueries({ queryKey: ['shortlets', 'availability', listing.id] });
      toast.show(
        booking.status === 'CONFIRMED'
          ? 'Booked: now secure it with payment.'
          : 'Request sent to the host.',
        'success'
      );
      onClose();
      router.push({ pathname: '/(app)/shortlet-stay/[id]', params: { id: booking.id } });
    },
    onError: (err) => {
      void haptics.error();
      if (err instanceof ApiError && (err.code === 'IDENTITY_REQUIRED' || err.status === 403)) {
        setBlocked({ code: err.code, message: err.message });
        return;
      }
      toast.show(err instanceof ApiError ? err.message : 'Could not book this stay.', 'error');
    },
  });

  const q = quote.data;
  const unavailable = q && !q.available;

  return (
    <View style={{ gap: spacing.xl }}>
      <Pressable
        onPress={() => {
          void haptics.tap();
          onChangeDates();
        }}
        accessibilityRole="button"
        accessibilityLabel={`Dates ${seasonRange(dates.checkIn, dates.checkOut)}. Change dates`}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.lg,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <CalendarDays size={20} color={colors.foreground} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{seasonRange(dates.checkIn, dates.checkOut)}</Text>
          <Text variant="caption" color="mutedForeground">
            {q?.estimatedNights ? nightsLabel(q.estimatedNights) : ' '}
            {listing.checkInTime ? ` · check in from ${listing.checkInTime}` : ''}
          </Text>
        </View>
        <Text variant="callout" color="primary" style={{ fontWeight: '700' }}>
          Change
        </Text>
        <ChevronRight size={16} color={colors.primary} />
      </Pressable>

      <Stepper
        label="Guests"
        hint={`This stay sleeps up to ${listing.maxGuests}`}
        value={guests}
        min={1}
        max={listing.maxGuests}
        onChange={onGuestsChange}
      />

      {quote.isPending ? (
        <View style={{ gap: spacing.sm }}>
          <Skeleton height={18} width="70%" />
          <Skeleton height={18} width="50%" />
          <Skeleton height={26} width="100%" />
        </View>
      ) : quote.isError ? (
        <FormAlert tone="error" message="We couldn't price these dates. Check your connection." />
      ) : unavailable ? (
        <FormAlert
          tone="warning"
          title="These dates don't work"
          message={q.reason ?? 'Some of these nights are taken. Try other dates.'}
        />
      ) : q ? (
        <PriceBreakdown quote={q} deposit={listing.deposit} />
      ) : null}

      {blocked ? (
        blocked.code === 'IDENTITY_REQUIRED' ? (
          <View style={{ gap: spacing.sm }}>
            <FormAlert
              tone="warning"
              title="Verify your identity to book instantly"
              message={blocked.message}
            />
            <Button
              label="Verify my identity"
              variant="outline"
              onPress={() => {
                onClose();
                router.push('/(app)/verify-identity');
              }}
            />
          </View>
        ) : (
          <FormAlert tone="error" message={blocked.message} />
        )
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <Button
          label={listing.instantBooking ? 'Book now' : 'Request to book'}
          size="lg"
          loading={book.isPending}
          disabled={!q?.available || book.isPending}
          onPress={() => {
            setBlocked(null);
            book.mutate();
          }}
        />
        <Text variant="caption" color="mutedForeground" center>
          {listing.instantBooking
            ? 'Confirmed straight away. You pay next: held by GetRentos until you check in.'
            : "The host confirms first. You won't pay anything until they accept."}
        </Text>
      </View>
    </View>
  );
}
