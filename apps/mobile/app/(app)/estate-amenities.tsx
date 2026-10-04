import { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarClock, Plus, Trash2, Waves } from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormAlert,
  IconButton,
  SegmentedControl,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { errorText } from '@/components/estate/EstateUI';
import { StatusPill } from '@/components/host/HostUI';
import { Sheet } from '@/components/Sheet';
import { useEstate } from '@/hooks/useEstate';
import {
  bookingBuckets,
  estateManagerApi,
  type Amenity,
  type AmenityBooking,
} from '@/lib/api/estateManager';
import { formatDate, formatTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { qk } from '@/lib/query/keys';

type View_ = 'bookings' | 'amenities';

/** Shared spaces residents can book, and the bookings on them. */
export default function EstateAmenities() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const { estate, estateId } = useEstate();
  const [view, setView] = useState<View_>('bookings');
  const [adding, setAdding] = useState(false);
  // "Now" as of opening the screen; close enough to split ahead from past.
  const [openedAt] = useState(() => new Date());

  const amenities = useQuery({
    queryKey: qk.estateManager.amenities(estateId),
    queryFn: () => estateManagerApi.amenities(estateId),
    enabled: !!estateId,
  });
  const bookings = useQuery({
    queryKey: qk.estateManager.amenityBookings(estateId),
    queryFn: () => estateManagerApi.amenityBookings(estateId),
    enabled: !!estateId,
  });
  const buckets = useMemo(
    () => bookingBuckets(bookings.data ?? [], openedAt),
    [bookings.data, openedAt]
  );

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: qk.estateManager.amenities(estateId) });
    qc.invalidateQueries({ queryKey: qk.estateManager.amenityBookings(estateId) });
  };
  const cancel = useMutation({
    mutationFn: (b: AmenityBooking) => estateManagerApi.cancelAmenityBooking(estateId, b.id),
    onSuccess: (_b, b) => {
      void haptics.success();
      refreshAll();
      toast.show(`Cancelled. ${b.residentName} is told in their app.`, 'success');
    },
    onError: (e) => {
      refreshAll();
      toast.show(errorText(e, 'Could not cancel this booking.'), 'error');
    },
  });
  const remove = useMutation({
    mutationFn: (a: Amenity) => estateManagerApi.removeAmenity(estateId, a.id),
    onSuccess: (_a, a) => {
      void haptics.success();
      refreshAll();
      toast.show(`${a.name} removed.`, 'success');
    },
    onError: (e) => {
      void haptics.error();
      toast.show(errorText(e, 'Could not remove this amenity.'), 'error');
    },
  });

  const active = view === 'bookings' ? bookings : amenities;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={active.isRefetching}
            onRefresh={() => {
              void amenities.refetch();
              void bookings.refetch();
            }}
            tintColor={colors.mutedForeground}
          />
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow={estate?.name ?? 'Community'}
          title="Amenities"
          subtitle="Shared spaces residents can book"
          onBack={() => router.back()}
          accessory={
            <IconButton
              accessibilityLabel="Add an amenity"
              disabled={!estateId}
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => setAdding(true)}
            />
          }
        />
        <SegmentedControl
          accessibilityLabel="Bookings or amenities"
          value={view}
          onChange={setView}
          options={[
            {
              value: 'bookings',
              label: buckets.upcoming.length ? `Bookings ${buckets.upcoming.length}` : 'Bookings',
            },
            { value: 'amenities', label: 'Amenities' },
          ]}
        />

        {active.isError && !active.data ? (
          <ErrorState onRetry={() => active.refetch()} />
        ) : active.isPending ? (
          [0, 1].map((i) => <Skeleton key={i} height={96} radius={radius.lg} />)
        ) : view === 'bookings' ? (
          !bookings.data?.length ? (
            <EmptyState
              icon={<CalendarClock size={34} color={colors.mutedForeground} />}
              title="No bookings yet"
              description={
                amenities.data?.length
                  ? 'When a resident books a shared space, it appears here.'
                  : 'Add an amenity first. Residents then book it from their app.'
              }
            />
          ) : (
            <>
              {buckets.upcoming.length ? (
                <View style={{ gap: spacing.sm }}>
                  <Text variant="heading" accessibilityRole="header">
                    Coming up
                  </Text>
                  {buckets.upcoming.map((b) => (
                    <BookingCard
                      key={b.id}
                      b={b}
                      cancelling={cancel.isPending && cancel.variables?.id === b.id}
                      onCancel={() =>
                        Alert.alert(
                          'Cancel this booking?',
                          `${b.residentName} (${b.unitLabel}) is told in their app that the office cancelled their ${b.amenityName} booking.`,
                          [
                            { text: 'Keep it', style: 'cancel' },
                            {
                              text: 'Cancel booking',
                              style: 'destructive',
                              onPress: () => cancel.mutate(b),
                            },
                          ]
                        )
                      }
                    />
                  ))}
                </View>
              ) : (
                <Text variant="callout" color="mutedForeground">
                  Nothing booked ahead.
                </Text>
              )}
              {buckets.past.length ? (
                <View style={{ gap: spacing.sm }}>
                  <Text variant="heading" accessibilityRole="header">
                    Earlier
                  </Text>
                  {buckets.past.slice(0, 20).map((b) => (
                    <BookingCard key={b.id} b={b} />
                  ))}
                </View>
              ) : null}
            </>
          )
        ) : !amenities.data?.length ? (
          <EmptyState
            icon={<Waves size={34} color={colors.mutedForeground} />}
            title="No amenities yet"
            description="Add the pool, the hall, the court. Residents book them from their app."
            action={<Button label="Add an amenity" onPress={() => setAdding(true)} />}
          />
        ) : (
          amenities.data.map((a) => {
            const ahead = buckets.upcoming.filter((b) => b.amenityId === a.id).length;
            return (
              <Card
                key={a.id}
                elevated
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
              >
                <View
                  style={{ flex: 1, gap: 2 }}
                  accessible
                  accessibilityLabel={`${a.name}${a.description ? `. ${a.description}` : ''}. ${ahead} upcoming ${ahead === 1 ? 'booking' : 'bookings'}`}
                >
                  <Text variant="bodyStrong">{a.name}</Text>
                  {a.description ? (
                    <Text variant="caption" color="mutedForeground" numberOfLines={2}>
                      {a.description}
                    </Text>
                  ) : null}
                  <Text variant="caption" color="mutedForeground">
                    {ahead
                      ? `${ahead} upcoming ${ahead === 1 ? 'booking' : 'bookings'}`
                      : 'Nothing booked ahead'}
                  </Text>
                </View>
                <IconButton
                  accessibilityLabel={`Remove ${a.name}`}
                  disabled={remove.isPending && remove.variables?.id === a.id}
                  icon={<Trash2 size={17} color={colors.mutedForeground} />}
                  onPress={() =>
                    ahead
                      ? Alert.alert(
                          `${a.name} has bookings ahead`,
                          `Cancel its ${ahead} upcoming ${ahead === 1 ? 'booking' : 'bookings'} first, so the residents are told.`,
                          [{ text: 'OK', onPress: () => setView('bookings') }]
                        )
                      : Alert.alert(`Remove ${a.name}?`, 'Its past bookings are removed with it.', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(a) },
                        ])
                  }
                />
              </Card>
            );
          })
        )}
      </ScrollView>
      <Sheet open={adding} onClose={() => setAdding(false)} title="Add an amenity">
        {adding ? (
          <AddForm
            estateId={estateId}
            onDone={() => {
              setAdding(false);
              setView('amenities');
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function BookingCard({
  b,
  onCancel,
  cancelling,
}: {
  b: AmenityBooking;
  onCancel?: () => void;
  cancelling?: boolean;
}) {
  const { spacing } = useTheme();
  const cancelled = b.status === 'cancelled';
  const when = `${formatDate(b.startsAt, 'medium')}, ${formatTime(b.startsAt)} – ${formatTime(b.endsAt)}`;
  return (
    <Card elevated style={{ gap: spacing.sm, opacity: cancelled ? 0.7 : 1 }}>
      <View
        accessible
        accessibilityLabel={`${b.amenityName}, ${when}, ${b.unitLabel}, ${b.residentName}${cancelled ? ', cancelled' : ''}`}
        style={{ gap: 2 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
            {b.amenityName}
          </Text>
          {cancelled ? <StatusPill label="Cancelled" tone="neutral" /> : null}
        </View>
        <Text variant="callout">{when}</Text>
        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
          {b.unitLabel} · {b.residentName}
        </Text>
      </View>
      {onCancel ? (
        <Button
          label="Cancel booking"
          size="sm"
          variant="ghost"
          loading={cancelling}
          accessibilityLabel={`Cancel ${b.residentName}’s ${b.amenityName} booking`}
          onPress={onCancel}
        />
      ) : null}
    </Card>
  );
}

function AddForm({ estateId, onDone }: { estateId: string; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const add = useMutation({
    mutationFn: () =>
      estateManagerApi.addAmenity(estateId, {
        name: name.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
      }),
    onSuccess: (a) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.estateManager.amenities(estateId) });
      toast.show(`${a.name} added. Residents can book it now.`, 'success');
      onDone();
    },
  });
  return (
    <View style={{ gap: spacing.md }}>
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        maxLength={80}
        autoFocus
        placeholder="e.g. Swimming pool"
      />
      <TextField
        label="Details (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={500}
        hint="Opening hours, rules, how many people. Residents see this when booking."
      />
      {add.error ? (
        <FormAlert message={errorText(add.error, 'Could not add this amenity.')} />
      ) : null}
      <Button
        label="Add amenity"
        disabled={name.trim().length < 2}
        loading={add.isPending}
        onPress={() => add.mutate()}
      />
    </View>
  );
}
