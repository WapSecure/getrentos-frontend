import { useState } from 'react';
import { Linking, RefreshControl, ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarClock, Video } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  DateField,
  ListSkeleton,
  QueryState,
  Text,
  TextField,
  TimeField,
  toISODate,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  lagosToIso,
  ownerLandApi,
  proposeBlocker,
  TOUR_END_HOUR,
  TOUR_FIRST_HOUR,
  TOUR_STATUS,
  type LandTour,
} from '@/lib/api/ownerLand';
import { errorMessage } from '@/lib/api/client';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const OPEN = ['REQUESTED', 'PROPOSED', 'SCHEDULED'];

export default function OwnerLandTours() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const list = useQuery({ queryKey: qk.owner.landTours, queryFn: ownerLandApi.tours });
  const tours = list.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Land"
        title="Video tours"
        subtitle="Live tours buyers asked you for"
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.md,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching}
            onRefresh={() => list.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <QueryState
          query={list}
          skeleton={<ListSkeleton rows={3} variant="card" height={140} />}
          isEmpty={tours.length === 0}
          empty={{
            icon: <Video size={32} color={colors.mutedForeground} />,
            title: 'No tour requests',
            description: 'When a buyer asks for a live video tour of your land, it appears here.',
          }}
        >
          {tours.map((t) => (
            <TourCard key={t.id} tour={t} />
          ))}
        </QueryState>
      </ScrollView>
    </View>
  );
}

function TourCard({ tour: t }: { tour: LandTour }) {
  const { colors, spacing } = useTheme();
  const status = TOUR_STATUS[t.status];
  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{t.land}</Text>
          <Text variant="caption" color="mutedForeground">
            {t.city}, {t.state} · Buyer: {t.buyerName}
            {t.attendeeName ? ` · with ${t.attendeeName}` : ''}
          </Text>
        </View>
        <Badge label={status.label} tone={status.tone} />
      </View>
      {t.status === 'SCHEDULED' && t.scheduledLocal ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <CalendarClock size={14} color={colors.primary} />
          <Text variant="callout">
            {t.scheduledLocal} · {t.durationMinutes} minutes
          </Text>
        </View>
      ) : null}
      {t.status === 'SCHEDULED' && t.meetingUrl ? (
        <Button
          label="Join the call"
          size="sm"
          variant="secondary"
          onPress={() => Linking.openURL(t.meetingUrl!)}
        />
      ) : null}
      {t.preferredTimes && (t.status === 'REQUESTED' || t.status === 'PROPOSED') ? (
        <Text variant="callout" color="mutedForeground">
          Buyer’s note: “{t.preferredTimes}”
        </Text>
      ) : null}
      {t.status === 'PROPOSED'
        ? t.proposedSlots.map((s) => (
            <Text key={s.at} variant="caption" color="mutedForeground">
              Offered: {s.local}
            </Text>
          ))
        : null}
      {t.hostNotes ? (
        <Text variant="callout" color="mutedForeground">
          {t.hostNotes}
        </Text>
      ) : null}
      {t.cancelReason ? (
        <Text variant="callout" color="mutedForeground">
          Cancelled: {t.cancelReason}
        </Text>
      ) : null}
      {t.buyerRating ? (
        <Text variant="callout" color="mutedForeground">
          Buyer rated it {t.buyerRating}/5{t.buyerFeedback ? `: “${t.buyerFeedback}”` : ''}
        </Text>
      ) : null}
      <HostActions tour={t} />
    </Card>
  );
}

function HostActions({ tour: t }: { tour: LandTour }) {
  const { spacing, radius, colors } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  // Captured once: render must not read the clock.
  const [now] = useState(() => Date.now());
  const [dates, setDates] = useState(['', '', '']);
  const [times, setTimes] = useState(['', '', '']);
  const [link, setLink] = useState(t.meetingUrl ?? '');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const slots = dates.map((d, i) => lagosToIso(d, times[i]));
  const blocker = proposeBlocker(slots, link, now);
  const started = t.scheduledAt ? now >= Date.parse(t.scheduledAt) : false;

  const settle = (message: string) => (updated: LandTour) => {
    qc.setQueryData<LandTour[]>(qk.owner.landTours, (old) =>
      old?.map((x) => (x.id === updated.id ? updated : x))
    );
    qc.invalidateQueries({ queryKey: qk.owner.landTours });
    toast.show(message, 'success');
  };
  const fail = (fallback: string) => (e: unknown) => toast.show(errorMessage(e, fallback), 'error');

  const propose = useMutation({
    mutationFn: () =>
      ownerLandApi.proposeTour(
        t.id,
        slots.filter((s): s is string => !!s),
        link
      ),
    onSuccess: settle('Times sent to the buyer, in their own time zone.'),
    onError: fail('Could not send the times.'),
  });
  const complete = useMutation({
    mutationFn: () => ownerLandApi.completeTour(t.id, notes),
    onSuccess: settle('Tour recorded.'),
    onError: fail('Could not record the tour.'),
  });
  const cancel = useMutation({
    mutationFn: () => ownerLandApi.cancelTour(t.id, reason),
    onSuccess: settle('Tour cancelled; the buyer was told.'),
    onError: fail('Could not cancel the tour.'),
  });

  const set = (list: string[], i: number, v: string) => list.map((x, j) => (j === i ? v : x));

  return (
    <View style={{ gap: spacing.md }}>
      {t.status === 'REQUESTED' || t.status === 'PROPOSED' ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            padding: spacing.md,
            gap: spacing.md,
          }}
        >
          <Text variant="callout" style={{ fontWeight: '600' }}>
            {t.status === 'PROPOSED' ? 'Offer different times' : 'Offer up to three times'}
          </Text>
          <Text variant="caption" color="mutedForeground">
            Lagos time, between 08:00 and 16:30 so there is daylight at the land. The buyer is in{' '}
            {t.buyerTimeZone} and sees them in their own time.
          </Text>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <DateField
                  label={`Time ${i + 1}`}
                  value={dates[i]}
                  onChange={(v) => setDates((d) => set(d, i, v))}
                  min={toISODate(new Date(now))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TimeField
                  label="Lagos time"
                  value={times[i]}
                  onChange={(v) => setTimes((x) => set(x, i, v))}
                  startHour={TOUR_FIRST_HOUR}
                  endHour={TOUR_END_HOUR}
                />
              </View>
            </View>
          ))}
          <TextField
            label="Video call link"
            placeholder="https://"
            value={link}
            onChangeText={setLink}
            autoCapitalize="none"
            keyboardType="url"
            maxLength={500}
          />
          {blocker && (dates.some(Boolean) || link) ? (
            <Text variant="caption" color="mutedForeground">
              {blocker}
            </Text>
          ) : null}
          <Button
            label="Send times"
            size="sm"
            loading={propose.isPending}
            disabled={!!blocker || propose.isPending}
            onPress={() => propose.mutate()}
          />
        </View>
      ) : null}

      {t.status === 'SCHEDULED' && started ? (
        <View style={{ gap: spacing.sm }}>
          <TextField
            label="What you showed"
            placeholder="Beacons, access road, neighbours, and anything the buyer asked"
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={4000}
          />
          <Button
            label="Record the tour"
            size="sm"
            loading={complete.isPending}
            disabled={notes.trim().length < 10 || complete.isPending}
            onPress={() => complete.mutate()}
          />
        </View>
      ) : null}

      {OPEN.includes(t.status) ? (
        cancelling ? (
          <View style={{ gap: spacing.sm }}>
            <TextField
              label="Why you are cancelling"
              value={reason}
              onChangeText={setReason}
              maxLength={500}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                label="Cancel tour"
                size="sm"
                variant="destructive"
                loading={cancel.isPending}
                disabled={reason.trim().length < 3 || cancel.isPending}
                onPress={() => cancel.mutate()}
              />
              <Button
                label="Keep it"
                size="sm"
                variant="ghost"
                onPress={() => setCancelling(false)}
              />
            </View>
          </View>
        ) : (
          <Button
            label="Cancel"
            size="sm"
            variant="ghost"
            onPress={() => setCancelling(true)}
            style={{ alignSelf: 'flex-start' }}
          />
        )
      ) : null}
    </View>
  );
}
