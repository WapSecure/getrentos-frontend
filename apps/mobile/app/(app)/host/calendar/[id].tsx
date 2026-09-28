import { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  ErrorState,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { hostShortletsApi, type BlockedRange, type HostBooking } from '@/lib/api/hostShortlets';
import { ApiError } from '@/lib/api/client';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import {
  CalendarLegend,
  MonthCalendar,
  isoDay,
  nightsBetween,
  occupied,
  shiftDay,
  type DayState,
} from '@/components/host/MonthCalendar';

const MONTHS_AHEAD = 12;

export default function HostCalendar() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const today = isoDay(new Date());
  const [selStart, setSelStart] = useState<string | null>(null);
  const [selEnd, setSelEnd] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const blocked = useQuery({
    queryKey: qk.host.blocked(id),
    queryFn: () => hostShortletsApi.blocked(id),
  });
  const stays = useQuery({
    queryKey: qk.host.listingBookings(id),
    queryFn: () => hostShortletsApi.bookingsForListing(id),
  });

  const { states, dayBlock, dayBooking } = useMemo(() => {
    const states = new Map<string, DayState>();
    const dayBlock = new Map<string, BlockedRange>();
    const dayBooking = new Map<string, HostBooking>();
    for (const r of blocked.data ?? []) {
      for (const d of occupied(r.startDate, r.endDate)) {
        states.set(d, r.importedFrom ? 'imported' : 'blocked');
        dayBlock.set(d, r);
      }
    }
    for (const b of stays.data?.items ?? []) {
      for (const d of occupied(b.checkIn, b.checkOut)) {
        states.set(d, b.status === 'REQUESTED' ? 'request' : 'booked');
        dayBooking.set(d, b);
      }
    }
    return { states, dayBlock, dayBooking };
  }, [blocked.data, stays.data]);

  const months = useMemo(() => {
    const now = new Date();
    return Array.from(
      { length: MONTHS_AHEAD },
      (_, i) => new Date(now.getFullYear(), now.getMonth() + i, 1)
    );
  }, []);

  const block = useMutation({
    // The last selected night is blocked too, so the range ends the next morning.
    mutationFn: () =>
      hostShortletsApi.block(
        id,
        selStart!,
        shiftDay(selEnd ?? selStart!, 1),
        reason.trim() || undefined
      ),
    onSuccess: () => {
      void haptics.success();
      toast.show('Dates blocked.', 'success');
      setSelStart(null);
      setSelEnd(null);
      setReason('');
      qc.invalidateQueries({ queryKey: qk.host.blocked(id) });
    },
    onError: (err) => {
      void haptics.error();
      toast.show(err instanceof ApiError ? err.message : 'Could not block those dates.', 'error');
    },
  });

  const unblock = useMutation({
    mutationFn: (blockId: string) => hostShortletsApi.unblock(blockId),
    onSuccess: () => {
      toast.show('Dates reopened.', 'success');
      qc.invalidateQueries({ queryKey: qk.host.blocked(id) });
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not reopen those dates.', 'error'),
  });

  const onDay = useCallback(
    (d: string) => {
      void haptics.tap();
      const booking = dayBooking.get(d);
      if (booking) {
        router.push({ pathname: '/(app)/host/booking/[id]', params: { id: booking.id } });
        return;
      }
      const range = dayBlock.get(d);
      if (range) {
        const nights = occupied(range.startDate, range.endDate);
        const fmt = (iso: string) =>
          new Date(`${iso}T12:00:00`).toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
          });
        const span =
          nights.length > 1
            ? `${fmt(nights[0])} – ${fmt(nights[nights.length - 1])}`
            : fmt(nights[0] ?? d);
        if (range.importedFrom || range.lockedByCancellation) {
          Alert.alert(
            'Can’t reopen these dates',
            range.importedFrom
              ? `${span} came from ${range.importedFrom}. Free them there and the next sync reopens them here.`
              : `${span} were closed when you cancelled a stay, so they stay closed.`
          );
          return;
        }
        Alert.alert('Reopen these dates?', `${span}${range.reason ? ` — ${range.reason}` : ''}`, [
          { text: 'Keep blocked', style: 'cancel' },
          { text: 'Reopen', onPress: () => unblock.mutate(range.id) },
        ]);
        return;
      }
      // Two taps make a range; a tap before the start restarts it.
      if (!selStart || selEnd || d < selStart) {
        setSelStart(d);
        setSelEnd(null);
      } else {
        const crosses = nightsBetween(selStart, d).some((n) => states.has(n));
        if (crosses) {
          toast.show('That range runs into a booking or block. Pick open nights.', 'error');
          return;
        }
        setSelEnd(d);
      }
    },
    [dayBooking, dayBlock, selStart, selEnd, states, toast, unblock]
  );

  const count = selStart ? nightsBetween(selStart, selEnd ?? selStart).length : 0;
  const loading = blocked.isPending || stays.isPending;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          gap: spacing.md,
        }}
      >
        <DetailHeader
          eyebrow="Calendar"
          title="Availability"
          subtitle="Tap two open nights to block them"
          onBack={() => router.back()}
        />
        <CalendarLegend />
      </View>
      {blocked.isError && !blocked.data ? (
        <ErrorState onRetry={() => blocked.refetch()} />
      ) : loading ? (
        <View style={{ padding: spacing.xl }}>
          <Skeleton height={320} radius={radius.lg} />
        </View>
      ) : (
        <FlashList
          data={months}
          keyExtractor={(m) => m.toISOString()}
          extraData={`${selStart}-${selEnd}-${states.size}`}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing['5xl'] }}
          ItemSeparatorComponent={() => <View style={{ height: spacing['2xl'] }} />}
          renderItem={({ item }) => (
            <MonthCalendar
              month={item}
              states={states}
              selStart={selStart}
              selEnd={selEnd}
              today={today}
              onPress={onDay}
            />
          )}
        />
      )}
      {selStart ? (
        <View
          style={{
            gap: spacing.sm,
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.card,
          }}
        >
          <Text variant="bodyStrong">
            {selEnd ? `${count} night${count === 1 ? '' : 's'} selected` : 'Now tap the last night'}
          </Text>
          <TextField
            label="Reason (only you see it)"
            value={reason}
            onChangeText={setReason}
            maxLength={120}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Clear"
              variant="ghost"
              onPress={() => {
                setSelStart(null);
                setSelEnd(null);
              }}
            />
            <Button
              label={`Block ${count} night${count === 1 ? '' : 's'}`}
              style={{ flex: 1 }}
              loading={block.isPending}
              onPress={() => block.mutate()}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
