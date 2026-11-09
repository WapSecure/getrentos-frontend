import { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Timer } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  ListSkeleton,
  PressableScale,
  QueryState,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  countdownTo,
  landBuyerApi,
  plotLabel,
  RESERVATION_STATUS,
  splitReservations,
  type Reservation,
} from '@/lib/api/landBuyer';
import { errorMessage } from '@/lib/api/client';
import { formatDate, formatDateTime, formatNaira } from '@/lib/format';
import { Sheet } from '@/components/Sheet';
import { StartPurchase } from '@/components/land/StartPurchase';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

export default function BuyerLandReservations() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [starting, setStarting] = useState<Reservation | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const q = useQuery({
    queryKey: qk.buyerLand.reservations,
    queryFn: landBuyerApi.reservations,
    refetchInterval: 60_000,
  });
  const { live, past } = splitReservations(q.data ?? [], now);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="My land"
        title="Reservations"
        subtitle="You can hold up to 3 plots at a time"
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.md,
        }}
        refreshControl={
          <RefreshControl
            refreshing={q.isRefetching}
            onRefresh={() => void q.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <Text variant="callout" color="mutedForeground">
          A hold that runs out puts the plot back on sale.
        </Text>
        <QueryState
          query={q}
          skeleton={<ListSkeleton rows={2} variant="card" height={120} />}
          isEmpty={!q.data?.length}
          empty={{
            icon: <Timer size={32} color={colors.mutedForeground} />,
            title: 'No reservations yet',
            description:
              'Reserve a plot in a verified estate to hold it free while you choose a payment plan.',
            action: (
              <Button label="Browse estates" onPress={() => router.push('/(app)/land-estates')} />
            ),
          }}
        >
          <>
            {live.length === 0 ? (
              <Card style={{ gap: spacing.sm }}>
                <Text variant="callout">No plot is on hold right now.</Text>
                <Button
                  label="Browse estates"
                  size="sm"
                  variant="secondary"
                  onPress={() => router.push('/(app)/land-estates')}
                  style={{ alignSelf: 'flex-start' }}
                />
              </Card>
            ) : (
              live.map((r) => (
                <LiveHold key={r.id} r={r} now={now} onStart={() => setStarting(r)} />
              ))
            )}
            {past.length ? (
              <View style={{ gap: spacing.sm }}>
                <Button
                  label={`${showPast ? 'Hide' : 'Show'} past reservations (${past.length})`}
                  size="sm"
                  variant="ghost"
                  onPress={() => setShowPast((v) => !v)}
                  style={{ alignSelf: 'flex-start' }}
                />
                {showPast
                  ? past.map((r) => {
                      const s = RESERVATION_STATUS[r.status === 'ACTIVE' ? 'EXPIRED' : r.status];
                      return (
                        <Card key={r.id} padding={spacing.md} style={{ gap: 2 }}>
                          <View
                            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                          >
                            <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
                              {plotLabel(r)} · {r.layoutName}
                            </Text>
                            <Badge label={s.label} tone={s.tone} />
                          </View>
                          <Text variant="caption" color="mutedForeground">
                            {formatNaira(r.price)} · reserved {formatDate(r.createdAt, 'short')}
                          </Text>
                        </Card>
                      );
                    })
                  : null}
              </View>
            ) : null}
          </>
        </QueryState>
      </ScrollView>
      <Sheet open={!!starting} onClose={() => setStarting(null)} title="Start your purchase">
        {starting ? (
          <StartPurchase
            reservation={starting}
            onDone={() => setStarting(null)}
            onLeave={() => setStarting(null)}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function LiveHold({ r, now, onStart }: { r: Reservation; now: number; onStart: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const c = countdownTo(r.expiresAt, now);
  const release = useMutation({
    mutationFn: () => landBuyerApi.cancelReservation(r.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.buyerLand.all });
      toast.show(`${plotLabel(r)} released.`, 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not release the plot.'), 'error'),
  });
  return (
    <Card style={{ gap: spacing.sm }}>
      <Text variant="bodyStrong">{plotLabel(r)}</Text>
      <PressableScale
        onPress={() => router.push(`/(app)/land-estate/${r.layoutId}?plot=${r.plotId}`)}
        accessibilityRole="link"
      >
        <Text variant="caption" color="primary">
          {r.layoutName}
        </Text>
      </PressableScale>
      <Text variant="callout">{formatNaira(r.price)}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Badge label={`Held for ${c.label}`} tone={c.urgent ? 'danger' : 'warning'} />
        <Text variant="caption" color="mutedForeground">
          Until {formatDateTime(r.expiresAt)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button label="Start purchase" size="sm" onPress={onStart} />
        <Button
          label="Release plot"
          size="sm"
          variant="ghost"
          loading={release.isPending}
          onPress={() =>
            Alert.alert(
              'Release this plot?',
              `${plotLabel(r)} in ${r.layoutName} goes back on sale straight away, and another buyer may reserve it.`,
              [
                { text: 'Keep it', style: 'cancel' },
                { text: 'Release', style: 'destructive', onPress: () => release.mutate() },
              ]
            )
          }
        />
      </View>
    </Card>
  );
}
