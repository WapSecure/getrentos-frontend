import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarClock, Plus, Star, Video } from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  IconButton,
  LinkButton,
  ListSkeleton,
  PressableScale,
  QueryState,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { tourNextStep, formatLocation } from '@sureground/shared';
import { qk } from '@/lib/query/keys';
import {
  BUYER_TOUR_STATUS,
  canReportNoShow,
  landBuyerExtrasApi,
  tourReasonOk,
  type BuyerTour,
} from '@/lib/api/landBuyerExtras';
import { errorMessage } from '@/lib/api/client';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { TourList } from '@/components/tours/TourList';
import { TourJoin } from '@/components/tours/TourJoin';
import { TourRecordingConsent } from '@/components/tours/TourRecordingConsent';
import { goBack } from '@/lib/goBack';

export default function BuyerLandTours() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const q = useQuery({ queryKey: qk.buyerLand.tours, queryFn: landBuyerExtrasApi.tours });
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="My land"
        title="Video tours"
        subtitle="See land without travelling"
        onBack={() => goBack()}
        accessory={
          <IconButton
            onPress={() => router.push('/(app)/land')}
            accessibilityLabel="Book a video tour"
            icon={<Plus size={20} color={colors.primary} />}
          />
        }
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
            refreshing={q.isRefetching}
            onRefresh={() => void q.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <Text variant="callout" color="mutedForeground">
          The seller shows you the land live on a video call. A tour is never a search or a survey.
        </Text>
        <QueryState
          query={q}
          skeleton={<ListSkeleton rows={2} variant="card" height={140} />}
          isEmpty={!q.data?.length}
          empty={{
            icon: <Video size={32} color={colors.mutedForeground} />,
            title: 'No video tours yet',
            description: 'Book one from any land listing or estate plot.',
          }}
        >
          <TourList tours={q.data ?? []} viewer="buyer" renderTour={(t) => <TourCard tour={t} />} />
        </QueryState>
      </ScrollView>
    </View>
  );
}

function TourCard({ tour: t }: { tour: BuyerTour }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [now] = useState(() => Date.now());
  const [asking, setAsking] = useState<'cancel' | 'other' | null>(null);
  const [reason, setReason] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const status = BUYER_TOUR_STATUS[t.status];
  const update = (updated: BuyerTour, message: string) => {
    qc.setQueryData<BuyerTour[]>(qk.buyerLand.tours, (old) =>
      old?.map((x) => (x.id === updated.id ? updated : x))
    );
    qc.invalidateQueries({ queryKey: qk.buyerLand.tours });
    setAsking(null);
    setReason('');
    toast.show(message, 'success');
  };
  const settle = (message: string) => (updated: BuyerTour) => update(updated, message);
  const started = !!t.scheduledAt && now >= Date.parse(t.scheduledAt);
  const fail = (e: unknown) => toast.show(errorMessage(e, 'That did not go through.'), 'error');
  const choose = useMutation({
    mutationFn: (slot: string) => landBuyerExtrasApi.chooseSlot(t.id, slot),
    onSuccess: settle('Booked. You will be reminded a day and an hour before.'),
    onError: fail,
  });
  const reasonAction = useMutation({
    mutationFn: () =>
      asking === 'cancel'
        ? landBuyerExtrasApi.cancelTour(t.id, reason)
        : landBuyerExtrasApi.otherTimes(t.id, reason),
    onSuccess: (u) =>
      settle(asking === 'cancel' ? 'Tour cancelled.' : 'Asked the seller for other times.')(u),
    onError: fail,
  });
  const noShow = useMutation({
    mutationFn: () => landBuyerExtrasApi.hostNoShow(t.id),
    onSuccess: settle('Reported. You can ask for another tour.'),
    onError: fail,
  });
  const rate = useMutation({
    mutationFn: () => landBuyerExtrasApi.rateTour(t.id, rating, comment),
    onSuccess: settle('Thanks for your feedback.'),
    onError: fail,
  });

  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{t.land}</Text>
          <Text variant="caption" color="mutedForeground">
            {formatLocation(t.city, t.state)} · host {t.hostName}
            {t.attendeeName ? ` · with ${t.attendeeName}` : ''}
          </Text>
        </View>
        <Badge label={status.label} tone={status.tone} />
      </View>
      <Text variant="callout" style={{ fontWeight: '600' }}>
        {tourNextStep(t, 'buyer', started)}
      </Text>
      {t.status === 'SCHEDULED' && t.scheduledLocal ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <CalendarClock size={14} color={colors.primary} />
          <Text variant="callout">
            {t.scheduledLocal} · {t.durationMinutes} minutes
          </Text>
        </View>
      ) : null}
      <TourJoin tour={t} join={() => landBuyerExtrasApi.joinTour(t.id)} />
      <TourRecordingConsent
        tour={t}
        side="buyer"
        setConsent={(consent) => landBuyerExtrasApi.tourRecordingConsent(t.id, consent)}
        onUpdated={update}
      />
      {t.hostNotes ? (
        <Text variant="callout" color="mutedForeground">
          {t.hostNotes}
        </Text>
      ) : null}
      {t.cancelReason ? (
        <Text variant="caption" color="mutedForeground">
          Cancelled: {t.cancelReason}
        </Text>
      ) : null}

      {t.status === 'PROPOSED' ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="callout">Pick a time (your time zone):</Text>
          {t.proposedSlots.map((s) => (
            <Button
              key={s.at}
              label={s.local}
              size="sm"
              variant="secondary"
              loading={choose.isPending && choose.variables === s.at}
              disabled={choose.isPending}
              onPress={() => choose.mutate(s.at)}
            />
          ))}
        </View>
      ) : null}

      {asking ? (
        <View style={{ gap: spacing.sm }}>
          <TextField
            label={asking === 'cancel' ? 'Why are you cancelling?' : 'What would work instead?'}
            value={reason}
            onChangeText={setReason}
            maxLength={500}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label={asking === 'cancel' ? 'Cancel tour' : 'Ask for other times'}
              size="sm"
              variant={asking === 'cancel' ? 'destructive' : 'primary'}
              loading={reasonAction.isPending}
              disabled={!tourReasonOk(reason) || reasonAction.isPending}
              onPress={() => reasonAction.mutate()}
            />
            <Button label="Back" size="sm" variant="ghost" onPress={() => setAsking(null)} />
          </View>
        </View>
      ) : (
        <View
          style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md }}
        >
          {t.status === 'PROPOSED' ? (
            <Button
              label="None of these work"
              size="sm"
              variant="ghost"
              onPress={() => setAsking('other')}
            />
          ) : null}
          {['REQUESTED', 'PROPOSED', 'SCHEDULED'].includes(t.status) ? (
            <LinkButton
              label="Cancel"
              tone="destructive"
              accessibilityLabel={`Cancel the tour of ${t.land}`}
              onPress={() => setAsking('cancel')}
            />
          ) : null}
          {canReportNoShow(t, now) ? (
            <Button
              label="The seller did not join"
              size="sm"
              variant="ghost"
              loading={noShow.isPending}
              onPress={() => noShow.mutate()}
            />
          ) : null}
        </View>
      )}

      {t.status === 'COMPLETED' ? (
        t.buyerRating ? (
          <Text variant="caption" color="mutedForeground">
            You rated it {'★'.repeat(t.buyerRating)}
          </Text>
        ) : (
          <View style={{ gap: spacing.sm }}>
            <Text variant="callout">Rate this tour</Text>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <PressableScale
                  key={n}
                  onPress={() => setRating(n)}
                  accessibilityRole="button"
                  accessibilityLabel={`${n} stars`}
                >
                  <Star
                    size={26}
                    color={colors.warning}
                    fill={n <= rating ? colors.warning : 'transparent'}
                  />
                </PressableScale>
              ))}
            </View>
            <TextField
              label="Comment (optional)"
              value={comment}
              onChangeText={setComment}
              maxLength={2000}
              multiline
            />
            <Button
              label="Send rating"
              size="sm"
              loading={rate.isPending}
              disabled={!rating || rate.isPending}
              onPress={() => rate.mutate()}
              style={{ alignSelf: 'flex-start' }}
            />
          </View>
        )
      ) : null}
      {(t.status === 'SCHEDULED' || t.status === 'COMPLETED') && t.disclaimer ? (
        <Text variant="caption" color="mutedForeground">
          {t.disclaimer}
        </Text>
      ) : null}
    </Card>
  );
}
