import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileSignature } from 'lucide-react-native';
import {
  Badge,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Price,
  PressableScale,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  offerGap,
  ownerApi,
  OWNER_OFFER_LABEL,
  OWNER_OFFER_TONE,
  type OwnerOffer,
} from '@/lib/api/owner';
import { formatDate } from '@/lib/format';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

type Filter = 'open' | 'accepted' | 'closed' | 'all';
const FILTERS: { value: Filter; label: string; match: (o: OwnerOffer) => boolean }[] = [
  {
    value: 'open',
    label: 'Needs you',
    match: (o) => o.status === 'submitted' || o.status === 'countered',
  },
  { value: 'accepted', label: 'Accepted', match: (o) => o.status === 'accepted' },
  {
    value: 'closed',
    label: 'Closed',
    match: (o) => ['rejected', 'withdrawn', 'expired', 'closed'].includes(o.status),
  },
  { value: 'all', label: 'All', match: () => true },
];

export default function OwnerOffers() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('open');

  const query = useQuery({ queryKey: qk.owner.offers, queryFn: () => ownerApi.offers() });
  const all = useMemo(() => query.data?.items ?? [], [query.data]);
  const match = FILTERS.find((f) => f.value === filter)!.match;
  const items = all.filter(match);

  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      tintColor={colors.mutedForeground}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: insets.top + spacing.lg,
          gap: spacing.md,
        }}
      >
        <DashboardHeader eyebrow="Selling" title="Offers" subtitle="What buyers are offering" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -spacing.xl }}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}
        >
          {FILTERS.map((f) => (
            <Chip
              key={f.value}
              size="sm"
              label={f.label}
              count={all.filter(f.match).length}
              selected={filter === f.value}
              onPress={() => setFilter(f.value)}
            />
          ))}
        </ScrollView>
      </View>

      {query.isError && all.length === 0 ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={96} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <EmptyState
            icon={<FileSignature size={34} color={colors.mutedForeground} />}
            title={filter === 'open' ? 'Nothing waiting on you' : 'No offers here'}
            description={
              all.length
                ? 'Try another filter.'
                : 'When buyers make offers on your listings, they appear here.'
            }
          />
        </ScrollView>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{
            padding: spacing.xl,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          refreshControl={refresh}
          renderItem={({ item: o }: { item: OwnerOffer }) => (
            <PressableScale
              onPress={() => router.push(`/(app)/owner-offer/${o.id}`)}
              haptic={false}
              accessibilityRole="button"
              accessibilityLabel={`${o.buyerName} offered ${Math.round(o.offerAmount).toLocaleString('en-NG')} naira for ${o.propertyName}, ${offerGap(o.offerAmount, o.askingPrice)}, ${OWNER_OFFER_LABEL[o.status]}`}
            >
              <Card elevated style={{ gap: spacing.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {o.propertyName}
                    </Text>
                    <Text variant="caption" color="mutedForeground">
                      {o.buyerName} · {formatDate(o.submittedAt, 'short')}
                    </Text>
                  </View>
                  <Badge label={OWNER_OFFER_LABEL[o.status]} tone={OWNER_OFFER_TONE[o.status]} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
                  <Price amount={o.offerAmount} variant="subheading" />
                  <Text
                    variant="caption"
                    color={o.offerAmount < o.askingPrice ? 'warning' : 'success'}
                  >
                    {offerGap(o.offerAmount, o.askingPrice)}
                  </Text>
                </View>
              </Card>
            </PressableScale>
          )}
        />
      )}
    </View>
  );
}
