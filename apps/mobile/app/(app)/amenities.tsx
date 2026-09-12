import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, ChevronLeft } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  Screen,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { residentApi, type Amenity } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { formatDate } from '@/lib/format';

const HOUR_SLOTS = Array.from({ length: 14 }, (_, i) => 8 + i); // 8am–9pm
const DURATIONS = [
  { label: '30 min', minutes: 30 },
  { label: '1 hr', minutes: 60 },
  { label: '1.5 hr', minutes: 90 },
  { label: '2 hr', minutes: 120 },
  { label: '3 hr', minutes: 180 },
] as const;

function nextDays(count: number): Date[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function dayLabel(d: Date, i: number): string {
  if (i === 0) return 'Today';
  if (i === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

function hourLabel(h: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${period}`;
}

function BackHeader({ title }: { title: string }) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingTop: insets.top + spacing.sm,
        paddingBottom: spacing.md,
      }}
    >
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={10}
      >
        <ChevronLeft size={24} color={colors.foreground} />
      </Pressable>
      <Text variant="title">{title}</Text>
    </View>
  );
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
      setBookingTarget(null);
    },
    onError: (err) =>
      toast.show(
        err instanceof Error ? err.message : "Couldn't book that slot. Try again.",
        'error'
      ),
  });

  const cancel = useMutation({
    mutationFn: (bookingId: string) => residentApi.cancelAmenityBooking(bookingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.resident.amenityBookings }),
    onError: () => toast.show("Couldn't cancel that booking. Try again.", 'error'),
  });

  const activeBookings = (bookings.data ?? []).filter((b) => b.status === 'confirmed');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BackHeader title="Amenities" />
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
                      {formatDate(b.startsAt, 'short')} ·{' '}
                      {new Date(b.startsAt).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                      {' – '}
                      {new Date(b.endsAt).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Badge label="Confirmed" tone="success" />
                </View>
                <Button
                  label="Cancel"
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  loading={cancel.isPending}
                  onPress={() => cancel.mutate(b.id)}
                  style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}
                />
              </Card>
            ))
          ) : (
            <Text variant="caption" color="mutedForeground">
              You haven't booked anything yet.
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
    <Sheet open={!!amenity} onClose={onClose} title={amenity ? `Book ${amenity.name}` : ''}>
      {amenity ? (
        <BookAmenityForm key={amenity.id} onSubmit={onSubmit} submitting={submitting} />
      ) : null}
    </Sheet>
  );
}

function BookAmenityForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (startsAt: string, endsAt: string) => void;
  submitting: boolean;
}) {
  const { spacing } = useTheme();
  const days = useMemo(() => nextDays(14), []);
  const [dayIndex, setDayIndex] = useState(0);
  const [hour, setHour] = useState<number | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);

  const canSubmit = hour !== null && durationMinutes !== null;

  const submit = () => {
    if (hour === null || durationMinutes === null) return;
    const start = new Date(days[dayIndex]);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
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
            />
          ))}
        </View>
      </Field>
      <Field label="Start time">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {HOUR_SLOTS.map((h) => (
            <Chip key={h} label={hourLabel(h)} selected={hour === h} onPress={() => setHour(h)} />
          ))}
        </View>
      </Field>
      <Field label="Duration">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {DURATIONS.map((d) => (
            <Chip
              key={d.minutes}
              label={d.label}
              selected={durationMinutes === d.minutes}
              onPress={() => setDurationMinutes(d.minutes)}
            />
          ))}
        </View>
      </Field>
      <Button
        label={submitting ? 'Booking…' : 'Book'}
        disabled={!canSubmit}
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
