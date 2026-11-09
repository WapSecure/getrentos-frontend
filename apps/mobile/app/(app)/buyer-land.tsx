import { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, LandPlot } from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ListSkeleton,
  PressableScale,
  QueryState,
  Text,
  useTheme,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  BUYER_PURCHASE_STATUS,
  landBuyerApi,
  plotLabel,
  PURCHASE_STATUSES,
  type BuyerPurchaseSummary,
  type PurchaseStatus,
} from '@/lib/api/landBuyer';
import { formatDate, formatNaira } from '@/lib/format';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const ALL = 'all';
const PAGE_SIZE = 10;

export default function BuyerLand() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<PurchaseStatus | typeof ALL>(ALL);
  // Captured once: render must not read the clock.
  const [now] = useState(() => Date.now());
  const filter = status === ALL ? undefined : status;
  const list = useInfiniteQuery({
    queryKey: qk.buyerLand.purchases(filter ?? ''),
    queryFn: ({ pageParam }) => landBuyerApi.purchases(pageParam, PAGE_SIZE, filter),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
  const holds = useQuery({
    queryKey: qk.buyerLand.reservations,
    queryFn: landBuyerApi.reservations,
    retry: false,
  });
  const onHold = (holds.data ?? []).filter(
    (r) => r.status === 'ACTIVE' && Date.parse(r.expiresAt) > now
  ).length;
  const purchases = list.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Buying"
        title="My land"
        subtitle="Plots you hold and plots you are paying for"
        onBack={() => goBack()}
      />
      <QueryState
        query={list}
        skeleton={<ListSkeleton rows={3} variant="card" height={110} />}
        style={{ paddingHorizontal: spacing.xl }}
      >
        <FlashList
          data={purchases}
          keyExtractor={(p) => p.id}
          ListHeaderComponent={
            <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <PressableScale
                  style={{ flex: 1 }}
                  onPress={() => router.push('/(app)/buyer-land-reservations')}
                  accessibilityRole="button"
                >
                  <Card padding={spacing.md} style={{ gap: 2 }}>
                    <Text variant="bodyStrong">My reservations</Text>
                    <Text variant="caption" color="mutedForeground">
                      {holds.data
                        ? onHold
                          ? `${onHold} plot${onHold === 1 ? '' : 's'} on hold`
                          : 'No plot on hold'
                        : 'Plots you hold'}
                    </Text>
                  </Card>
                </PressableScale>
                <PressableScale
                  style={{ flex: 1 }}
                  onPress={() => router.push('/(app)/land-estates')}
                  accessibilityRole="button"
                >
                  <Card padding={spacing.md} style={{ gap: 2 }}>
                    <Text variant="bodyStrong">Estates selling plots</Text>
                    <Text variant="caption" color="mutedForeground">
                      Reserve a plot and pay on a plan
                    </Text>
                  </Card>
                </PressableScale>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                <Button
                  label="Video tours"
                  size="sm"
                  variant="secondary"
                  onPress={() => router.push('/(app)/buyer-land-tours')}
                />
                <Button
                  label="Inspections"
                  size="sm"
                  variant="secondary"
                  onPress={() => router.push('/(app)/buyer-land-inspections')}
                />
                <Button
                  label="Representatives"
                  size="sm"
                  variant="secondary"
                  onPress={() => router.push('/(app)/buyer-land-representatives')}
                />
              </View>
              <ChipSelect
                options={[
                  { value: ALL, label: 'All purchases' },
                  ...PURCHASE_STATUSES.map((s) => ({
                    value: s,
                    label: BUYER_PURCHASE_STATUS[s].label,
                  })),
                ]}
                value={status}
                onChange={setStatus}
              />
            </View>
          }
          renderItem={({ item }: { item: BuyerPurchaseSummary }) => <PurchaseRow purchase={item} />}
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching && !list.isFetchingNextPage}
              onRefresh={() => {
                list.refetch();
                holds.refetch();
              }}
              tintColor={colors.mutedForeground}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<LandPlot size={32} color={colors.mutedForeground} />}
              title={filter ? 'No purchases with this status' : 'No plot purchases yet'}
              description="Reserve a plot in a verified estate, then start a purchase on one of its payment plans."
              action={
                <Button label="Browse estates" onPress={() => router.push('/(app)/land-estates')} />
              }
            />
          }
        />
      </QueryState>
    </View>
  );
}

function PurchaseRow({ purchase: p }: { purchase: BuyerPurchaseSummary }) {
  const { colors, spacing } = useTheme();
  const status = BUYER_PURCHASE_STATUS[p.status];
  return (
    <PressableScale
      onPress={() => router.push(`/(app)/buyer-land-purchase/${p.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${plotLabel(p)}, ${p.layoutName}, ${status.label}`}
      style={{ marginBottom: spacing.sm }}
    >
      <Card padding={spacing.lg} style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
            {plotLabel(p)} · {p.layoutName}
          </Text>
          <Badge label={status.label} tone={status.tone} />
        </View>
        <Text variant="caption" color="mutedForeground">
          {p.reference} · {p.planName} · started {formatDate(p.startedAt ?? p.createdAt, 'short')}
        </Text>
        <Text variant="callout">
          {formatNaira(p.amountPaid)} paid of {formatNaira(p.totalPrice)} ·{' '}
          {formatNaira(p.outstandingBalance)} outstanding
        </Text>
        {p.nextDue ? (
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            {p.nextDue.overdue ? <AlertTriangle size={13} color={colors.destructive} /> : null}
            <Text
              variant="caption"
              style={{ color: p.nextDue.overdue ? colors.destructive : colors.mutedForeground }}
            >
              {p.nextDue.overdue ? 'Overdue: ' : 'Next: '}
              {p.nextDue.label}, {formatNaira(p.nextDue.amount)} on{' '}
              {formatDate(p.nextDue.dueDate, 'short')}
            </Text>
          </View>
        ) : null}
      </Card>
    </PressableScale>
  );
}
