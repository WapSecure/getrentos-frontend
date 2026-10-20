import { useState } from 'react';
import { Alert, RefreshControl, View } from 'react-native';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarClock, Video } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  DateField,
  EmptyState,
  FormAlert,
  QueryState,
  Skeleton,
  Text,
  TimeField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { ownerApi, type OwnerViewing } from '@/lib/api/owner';
import { BUYER_VIEWING_STATUS_LABEL, BUYER_VIEWING_STATUS_TONE } from '@/lib/api/buyerViewings';
import { localInstant } from '@/lib/api/realtor';
import { ApiError } from '@/lib/api/client';
import { formatDate, formatTime } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { Sheet } from '@/components/Sheet';
import { VideoCallAction } from '@/components/viewings/VideoCallAction';
import { goBack } from '@/lib/goBack';

const FILTERS: { value: 'requested' | 'confirmed' | undefined; label: string }[] = [
  { value: 'requested', label: 'To confirm' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: undefined, label: 'All' },
];

const when = (iso: string) => `${formatDate(iso, 'short')}, ${formatTime(iso)}`;

/**
 * Buyers' requests to view a property the owner is selling: confirm their
 * time, offer another or decline, then host the viewing, on a video call when
 * that is what was asked.
 */
export default function OwnerViewings() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState<'requested' | 'confirmed' | undefined>('requested');
  const [rescheduling, setRescheduling] = useState<OwnerViewing | null>(null);

  const query = useQuery({
    queryKey: qk.owner.viewings(status),
    queryFn: () => ownerApi.viewings(status),
    placeholderData: keepPreviousData,
  });
  const items = query.data?.items ?? [];

  const refresh = () => qc.invalidateQueries({ queryKey: ['owner', 'viewings'] });
  const fail = (e: unknown, fallback: string) =>
    toast.show(e instanceof ApiError ? e.message : fallback, 'error');

  const confirmAsked = useMutation({
    mutationFn: (id: string) => ownerApi.confirmViewing(id),
    onSuccess: () => {
      void refresh();
      toast.show('Viewing confirmed. The buyer will see it in their viewings.', 'success');
    },
    onError: (e) => fail(e, 'Could not confirm that viewing.'),
  });
  const decline = useMutation({
    mutationFn: (id: string) => ownerApi.declineViewing(id),
    onSuccess: () => {
      void refresh();
      toast.show('Viewing declined.', 'success');
    },
    onError: (e) => fail(e, 'Could not decline that viewing.'),
  });
  const complete = useMutation({
    mutationFn: (id: string) => ownerApi.completeViewing(id),
    onSuccess: () => {
      void refresh();
      toast.show('Viewing marked as done.', 'success');
    },
    onError: (e) => fail(e, 'Could not update that viewing.'),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
          gap: spacing.md,
        }}
      >
        <DetailHeader
          eyebrow="Selling"
          title="Viewings"
          subtitle="Confirm buyer visits and host video viewings"
          onBack={() => goBack()}
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {FILTERS.map((f) => (
            <Chip
              key={f.label}
              label={f.label}
              size="sm"
              selected={status === f.value}
              onPress={() => setStatus(f.value)}
            />
          ))}
        </View>
      </View>

      <QueryState
        query={query}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={120} radius={radius.lg} />
            ))}
          </View>
        }
      >
        <FlashList
          maintainVisibleContentPosition={{ disabled: true }}
          data={items}
          keyExtractor={(v) => v.id}
          renderItem={({ item }: { item: OwnerViewing }) => (
            <ViewingCard
              viewing={item}
              busy={
                (confirmAsked.isPending && confirmAsked.variables === item.id) ||
                (decline.isPending && decline.variables === item.id) ||
                (complete.isPending && complete.variables === item.id)
              }
              onConfirm={() => confirmAsked.mutate(item.id)}
              onReschedule={() => setRescheduling(item)}
              onDecline={() =>
                Alert.alert('Decline this viewing?', `${item.buyerName} will see it declined.`, [
                  { text: 'Keep it', style: 'cancel' },
                  {
                    text: 'Decline',
                    style: 'destructive',
                    onPress: () => decline.mutate(item.id),
                  },
                ])
              }
              onComplete={() => complete.mutate(item.id)}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<CalendarClock size={32} color={colors.mutedForeground} />}
              title={status === 'requested' ? 'Nothing to confirm' : 'No viewings'}
              description="When buyers ask to view a property you are selling, their requests show up here."
            />
          }
        />
      </QueryState>

      <Sheet open={!!rescheduling} onClose={() => setRescheduling(null)} title="Offer another time">
        {rescheduling ? (
          <RescheduleForm
            key={rescheduling.id}
            viewing={rescheduling}
            onDone={() => {
              setRescheduling(null);
              void refresh();
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function ViewingCard({
  viewing: v,
  busy,
  onConfirm,
  onReschedule,
  onDecline,
  onComplete,
}: {
  viewing: OwnerViewing;
  busy: boolean;
  onConfirm: () => void;
  onReschedule: () => void;
  onDecline: () => void;
  onComplete: () => void;
}) {
  const { colors, spacing } = useTheme();
  // When the card first showed; close enough to "now" for offering "Mark as done".
  const [shownAt] = useState(() => Date.now());
  const past = !!v.scheduledAt && new Date(v.scheduledAt).getTime() < shownAt;
  return (
    <Card padding={spacing.lg} style={{ marginBottom: spacing.sm }}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {v.buyerName}
          </Text>
          <Badge
            label={BUYER_VIEWING_STATUS_LABEL[v.status]}
            tone={BUYER_VIEWING_STATUS_TONE[v.status]}
          />
        </View>
        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
          {v.propertyName}
        </Text>
        {v.mode === 'video' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Video size={13} color={colors.primary} />
            <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
              Live video viewing
            </Text>
          </View>
        ) : null}
        <Text variant="caption" color="mutedForeground">
          {v.status === 'pending'
            ? `Asked for ${when(v.scheduledAt)}${past ? ' (passed)' : ''}`
            : when(v.scheduledAt)}
        </Text>
        {v.notes ? (
          <Text variant="callout" color="mutedForeground" numberOfLines={3}>
            “{v.notes}”
          </Text>
        ) : null}

        {v.status === 'pending' ? (
          <View style={{ gap: spacing.sm }}>
            {/* A time already gone can't be confirmed; offer another. */}
            {!past ? (
              <Button label="Confirm this time" size="sm" disabled={busy} onPress={onConfirm} />
            ) : null}
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                label="Offer another time"
                variant={past ? 'primary' : 'outline'}
                size="sm"
                style={{ flex: 1 }}
                disabled={busy}
                onPress={onReschedule}
              />
              <Button
                label="Decline"
                variant="ghost"
                size="sm"
                style={{ flex: 1 }}
                disabled={busy}
                onPress={onDecline}
              />
            </View>
          </View>
        ) : null}
        {v.status === 'confirmed' ? (
          <View style={{ gap: spacing.sm }}>
            <VideoCallAction
              viewing={v}
              label="Start video call"
              join={() => ownerApi.joinViewingCall(v.id)}
            />
            {past ? (
              <Button
                label="Mark as done"
                variant="ghost"
                size="sm"
                loading={busy}
                onPress={onComplete}
              />
            ) : null}
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function RescheduleForm({ viewing, onDone }: { viewing: OwnerViewing; onDone: () => void }) {
  const { spacing } = useTheme();
  const toast = useToast();
  // Start from the buyer's own slot, in local time; if that has passed, the
  // same time tomorrow.
  const [asked] = useState(() => {
    const at = new Date(viewing.scheduledAt);
    const now = new Date();
    if (at.getTime() >= now.getTime()) return at;
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(at.getHours(), at.getMinutes(), 0, 0);
    return tomorrow;
  });
  const [date, setDate] = useState(toISODate(asked));
  const [time, setTime] = useState(
    `${String(asked.getHours()).padStart(2, '0')}:${String(asked.getMinutes()).padStart(2, '0')}`
  );
  const [openedAt] = useState(() => Date.now());
  const at = localInstant(date, time);
  const inPast = !!at && new Date(at).getTime() < openedAt;

  const save = useMutation({
    mutationFn: () => ownerApi.confirmViewing(viewing.id, at!),
    onSuccess: () => {
      toast.show(`Viewing confirmed for ${when(at!)}.`, 'success');
      onDone();
    },
  });

  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="callout" color="mutedForeground">
        {viewing.buyerName} asked for {when(viewing.scheduledAt)}. The viewing is confirmed at the
        time you choose.
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <DateField label="Date" value={date} onChange={setDate} min={toISODate(new Date())} />
        </View>
        <View style={{ flex: 1 }}>
          <TimeField label="Time" value={time} onChange={setTime} />
        </View>
      </View>
      {inPast ? <FormAlert tone="warning" message="That time has already passed." /> : null}
      {save.error ? (
        <FormAlert
          message={
            save.error instanceof ApiError ? save.error.message : 'Could not confirm the viewing.'
          }
        />
      ) : null}
      <Button
        label="Confirm new time"
        disabled={!at || inPast}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
