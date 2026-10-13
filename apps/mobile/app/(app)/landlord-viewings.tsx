import { useState } from 'react';
import { Alert, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  ErrorState,
  FormAlert,
  Skeleton,
  Text,
  TimeField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  landlordApi,
  type LandlordViewingRequest,
  type LandlordViewingStatus,
} from '@/lib/api/landlord';
import { VIEWING_STATUS_LABEL, VIEWING_STATUS_TONE } from '@/lib/api/viewings';
import { localInstant } from '@/lib/api/realtor';
import { ApiError } from '@/lib/api/client';
import { formatDate, formatTime } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { Sheet } from '@/components/Sheet';
import { VideoCallAction } from '@/components/viewings/VideoCallAction';

const FILTERS: { value: LandlordViewingStatus | undefined; label: string }[] = [
  { value: 'requested', label: 'To confirm' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: undefined, label: 'All' },
];

const when = (iso: string) => `${formatDate(iso, 'short')}, ${formatTime(iso)}`;

/**
 * Renters' requests to view the landlord's properties: confirm a time or
 * decline, then host the viewing, on a video call when that is what was asked.
 */
export default function LandlordViewings() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState<LandlordViewingStatus | undefined>('requested');
  const [confirming, setConfirming] = useState<LandlordViewingRequest | null>(null);

  const query = useQuery({
    queryKey: qk.landlord.viewings(status),
    queryFn: () => landlordApi.viewingRequests(status),
  });
  const items = query.data?.items ?? [];

  const refresh = () => qc.invalidateQueries({ queryKey: ['landlord', 'viewings'] });
  const fail = (e: unknown, fallback: string) =>
    toast.show(e instanceof ApiError ? e.message : fallback, 'error');

  const decline = useMutation({
    mutationFn: (id: string) => landlordApi.cancelViewing(id),
    onSuccess: () => {
      void refresh();
      toast.show('Viewing declined.', 'success');
    },
    onError: (e) => fail(e, 'Could not decline that viewing.'),
  });
  const complete = useMutation({
    mutationFn: (id: string) => landlordApi.completeViewing(id),
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
          eyebrow="Leasing"
          title="Viewings"
          subtitle="Confirm visits and host video viewings"
          onBack={() => router.back()}
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

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={120} radius={radius.md} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(v) => v.id}
          renderItem={({ item }: { item: LandlordViewingRequest }) => (
            <ViewingCard
              viewing={item}
              busy={
                (decline.isPending && decline.variables === item.id) ||
                (complete.isPending && complete.variables === item.id)
              }
              onConfirm={() => setConfirming(item)}
              onDecline={() =>
                Alert.alert('Decline this viewing?', `${item.renterName} will be told.`, [
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
              description="When renters ask to view your properties, their requests show up here."
            />
          }
        />
      )}

      <Sheet open={!!confirming} onClose={() => setConfirming(null)} title="Confirm a time">
        {confirming ? (
          <ConfirmForm
            key={confirming.id}
            viewing={confirming}
            onDone={() => {
              setConfirming(null);
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
  onDecline,
  onComplete,
}: {
  viewing: LandlordViewingRequest;
  busy: boolean;
  onConfirm: () => void;
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
            {v.renterName}
          </Text>
          <Badge label={VIEWING_STATUS_LABEL[v.status]} tone={VIEWING_STATUS_TONE[v.status]} />
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
          {v.scheduledAt
            ? `Confirmed for ${when(v.scheduledAt)}`
            : v.preferredAt
              ? `Asked for ${when(v.preferredAt)}`
              : `Requested ${formatDate(v.requestedAt, 'short')}, no time given`}
        </Text>
        {v.notes ? (
          <Text variant="callout" color="mutedForeground" numberOfLines={3}>
            “{v.notes}”
          </Text>
        ) : null}

        {v.status === 'requested' ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Decline"
              variant="outline"
              size="sm"
              style={{ flex: 1 }}
              disabled={busy}
              onPress={onDecline}
            />
            <Button
              label="Confirm time"
              size="sm"
              style={{ flex: 1 }}
              disabled={busy}
              onPress={onConfirm}
            />
          </View>
        ) : null}
        {v.status === 'confirmed' ? (
          <View style={{ gap: spacing.sm }}>
            <VideoCallAction
              viewing={v}
              label="Start video call"
              join={() => landlordApi.joinViewingCall(v.id)}
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

function ConfirmForm({ viewing, onDone }: { viewing: LandlordViewingRequest; onDone: () => void }) {
  const { spacing } = useTheme();
  const toast = useToast();
  // Start from the renter's slot, in local time, when they gave one.
  const asked = viewing.preferredAt ? new Date(viewing.preferredAt) : null;
  const [date, setDate] = useState(asked ? toISODate(asked) : '');
  const [time, setTime] = useState(
    asked
      ? `${String(asked.getHours()).padStart(2, '0')}:${String(asked.getMinutes()).padStart(2, '0')}`
      : '10:00'
  );
  const [openedAt] = useState(() => Date.now());
  const at = localInstant(date, time);
  const inPast = !!at && new Date(at).getTime() < openedAt;

  const save = useMutation({
    mutationFn: () => landlordApi.confirmViewing(viewing.id, at!),
    onSuccess: () => {
      toast.show(`Viewing confirmed for ${when(at!)}.`, 'success');
      onDone();
    },
  });

  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="callout" color="mutedForeground">
        {viewing.renterName} · {viewing.propertyName}
        {viewing.mode === 'video' ? ' · video call' : ''}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <DateField label="Date" value={date} onChange={setDate} min={toISODate(new Date())} />
        </View>
        <View style={{ flex: 1 }}>
          <TimeField label="Time" value={time} onChange={setTime} />
        </View>
      </View>
      {viewing.mode === 'video' ? (
        <Text variant="caption" color="mutedForeground">
          You and the renter can join the call from 15 minutes before this time.
        </Text>
      ) : null}
      {inPast ? <FormAlert tone="warning" message="That time has already passed." /> : null}
      {save.error ? (
        <FormAlert
          message={
            save.error instanceof ApiError ? save.error.message : 'Could not confirm the viewing.'
          }
        />
      ) : null}
      <Button
        label="Confirm viewing"
        disabled={!at || inPast}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
