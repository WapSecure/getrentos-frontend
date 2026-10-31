import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  ErrorState,
  Screen,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { residentApi, type Amenity } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { APP_TIME_ZONE, formatDate, formatTime } from '@/lib/format';
import { dayNoon, isSlotFree, lagosDays, slotStart, type LagosDay } from '@/lib/amenitySlots';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const HOUR_SLOTS = Array.from({ length: 14 }, (_, i) => 8 + i); // 8am–9pm
const DURATIONS = [
  { label: '30 min', minutes: 30 },
  { label: '1 hr', minutes: 60 },
  { label: '1.5 hr', minutes: 90 },
  { label: '2 hr', minutes: 120 },
  { label: '3 hr', minutes: 180 },
] as const;

function dayLabel(d: LagosDay, i: number): string {
  if (i === 0) return 'Today';
  if (i === 1) return 'Tomorrow';
  return dayNoon(d).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: APP_TIME_ZONE,
  });
}

const SHORTEST_MINUTES = Math.min(...DURATIONS.map((d) => d.minutes));

function hourLabel(h: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${period}`;
}

export default function ResidentAmenities() {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [bookingTarget, setBookingTarget] = useState<Amenity | null>(null);

  const amenities = useQuery({
    queryKey: qk.resident.amenities,
    queryFn: () => residentApi.listAmenities(),
  });
  const bookings = useQuery({
    queryKey: qk.resident.amenityBookings,
    queryFn: () => residentApi.listAmenityBookings(),
  });

  const book = useMutation({
    mutationFn: (data: { amenityId: string; startsAt: string; endsAt: string }) =>
      residentApi.bookAmenity(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.resident.amenityBookings });
      qc.invalidateQueries({ queryKey: ['resident', 'amenity-busy'] });
      setBookingTarget(null);
    },
    onError: (err) => {
      // Someone may have taken the slot meanwhile: refresh what the sheet hides.
      qc.invalidateQueries({ queryKey: ['resident', 'amenity-busy'] });
      toast.show(
        err instanceof Error ? err.message : "Couldn't book that slot. Try again.",
        'error'
      );
    },
  });

  const cancel = useMutation({
    mutationFn: (bookingId: string) => residentApi.cancelAmenityBooking(bookingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.resident.amenityBookings });
      qc.invalidateQueries({ queryKey: ['resident', 'amenity-busy'] });
    },
    onError: () => toast.show("Couldn't cancel that booking. Try again.", 'error'),
  });

  const activeBookings = (bookings.data ?? []).filter((b) => b.status === 'confirmed');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Estate living"
        title="Amenities"
        subtitle="Reserve shared spaces and facilities"
        onBack={() => goBack()}
      />
      <Screen>
        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">Available</Text>
          {amenities.isLoading ? (
            <Skeleton height={64} radius={16} />
          ) : amenities.data && amenities.data.length > 0 ? (
            <Card padding="none">
              {amenities.data.map((a, i) => (
                <View key={a.id}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.lg,
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong">{a.name}</Text>
                      {a.description ? (
                        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                          {a.description}
                        </Text>
                      ) : null}
                    </View>
                    <Button
                      label="Book"
                      variant="outline"
                      size="sm"
                      fullWidth={false}
                      onPress={() => setBookingTarget(a)}
                    />
                  </View>
                  {i < amenities.data!.length - 1 ? <Divider /> : null}
                </View>
              ))}
            </Card>
          ) : (
            <EmptyState
              icon={<CalendarCheck size={34} color={colors.mutedForeground} />}
              title="No amenities yet"
              description="Your estate manager hasn't added any bookable amenities."
            />
          )}
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">My bookings ({activeBookings.length})</Text>
          {bookings.isLoading ? (
            <Skeleton height={64} radius={16} />
          ) : activeBookings.length > 0 ? (
            activeBookings.map((b) => (
              <Card key={b.id} elevated>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong">{b.amenityName}</Text>
                    <Text variant="caption" color="mutedForeground">
                      {formatDate(b.startsAt, 'short')} · {formatTime(b.startsAt)}
                      {' – '}
                      {formatTime(b.endsAt)}
                    </Text>
                  </View>
                  <Badge label="Confirmed" tone="success" />
                </View>
                <Button
                  label="Cancel"
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  loading={cancel.isPending && cancel.variables === b.id}
                  onPress={() => cancel.mutate(b.id)}
                  style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}
                />
              </Card>
            ))
          ) : (
            <Text variant="caption" color="mutedForeground">
              You haven&apos;t booked anything yet.
            </Text>
          )}
        </View>
      </Screen>

      <BookAmenitySheet
        amenity={bookingTarget}
        onClose={() => setBookingTarget(null)}
        onSubmit={(startsAt, endsAt) =>
          bookingTarget && book.mutate({ amenityId: bookingTarget.id, startsAt, endsAt })
        }
        submitting={book.isPending}
      />
    </View>
  );
}

function BookAmenitySheet({
  amenity,
  onClose,
  onSubmit,
  submitting,
}: {
  amenity: Amenity | null;
  onClose: () => void;
  onSubmit: (startsAt: string, endsAt: string) => void;
  submitting: boolean;
}) {
  return (
    <Sheet
      open={!!amenity}
      onClose={submitting ? () => undefined : onClose}
      title={amenity ? `Book ${amenity.name}` : ''}
    >
      {amenity ? (
        <BookAmenityForm
          key={amenity.id}
          amenityId={amenity.id}
          onSubmit={onSubmit}
          submitting={submitting}
        />
      ) : null}
    </Sheet>
  );
}

function BookAmenityForm({
  amenityId,
  onSubmit,
  submitting,
}: {
  amenityId: string;
  onSubmit: (startsAt: string, endsAt: string) => void;
  submitting: boolean;
}) {
  const { spacing } = useTheme();
  const days = useMemo(() => lagosDays(14), []);
  const [dayIndex, setDayIndex] = useState(0);
  const [hour, setHour] = useState<number | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);

  const busyQuery = useQuery({
    queryKey: qk.resident.amenityBusy(amenityId),
    queryFn: () => residentApi.listAmenityBusy(amenityId),
  });
  const busy = useMemo(() => busyQuery.data ?? [], [busyQuery.data]);

  // Only hours that are still ahead and have at least the shortest booking free.
  const hours = HOUR_SLOTS.filter((h) =>
    isSlotFree(slotStart(days[dayIndex], h), SHORTEST_MINUTES, busy)
  );
  const start = hour !== null && hours.includes(hour) ? slotStart(days[dayIndex], hour) : null;
  const durationFits = (minutes: number) => !!start && isSlotFree(start, minutes, busy);
  const duration =
    durationMinutes !== null && durationFits(durationMinutes) ? durationMinutes : null;

  const canSubmit = start !== null && duration !== null && !busyQuery.isPending;

  const submit = () => {
    if (!start || duration === null) return;
    const end = new Date(start.getTime() + duration * 60 * 1000);
    onSubmit(start.toISOString(), end.toISOString());
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <Field label="Day">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {days.map((d, i) => (
            <Chip
              key={i}
              label={dayLabel(d, i)}
              selected={dayIndex === i}
              onPress={() => setDayIndex(i)}
              disabled={submitting}
            />
          ))}
        </View>
      </Field>
      <Field label="Start time">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {busyQuery.isPending ? (
            <Skeleton height={36} radius={18} />
          ) : busyQuery.isError ? (
            <ErrorState onRetry={() => busyQuery.refetch()} />
          ) : hours.length === 0 ? (
            <Text variant="caption" color="mutedForeground">
              No free times left on this day. Try another day.
            </Text>
          ) : (
            hours.map((h) => (
              <Chip
                key={h}
                label={hourLabel(h)}
                selected={hour === h}
                onPress={() => setHour(h)}
                disabled={submitting}
              />
            ))
          )}
        </View>
      </Field>
      <Field label="Duration">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {DURATIONS.map((d) => (
            <Chip
              key={d.minutes}
              label={d.label}
              selected={duration === d.minutes}
              onPress={() => setDurationMinutes(d.minutes)}
              disabled={submitting || (start !== null && !durationFits(d.minutes))}
            />
          ))}
        </View>
      </Field>
      <Button
        label="Book"
        loadingLabel="Booking…"
        disabled={submitting || !canSubmit}
        loading={submitting}
        fullWidth
        onPress={submit}
      />
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="callout" color="mutedForeground" style={{ fontWeight: '600' }}>
        {label}
      </Text>
      {children}
    </View>
  );
}
