import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react-native';
import {
  Card,
  EmptyState,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { ownerApi, type OwnerInvestmentMetric } from '@/lib/api/owner';
import { ApiError } from '@/lib/api/client';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

const pct = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;

export default function OwnerAnalytics() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const query = useQuery({ queryKey: qk.owner.metrics, queryFn: ownerApi.metrics });
  const items = query.data ?? [];
  const totals = items.reduce(
    (acc, m) => ({ bought: acc.bought + m.purchasePrice, now: acc.now + m.currentValue }),
    { bought: 0, now: 0 }
  );
  // Analytics may be a paid feature; say so rather than showing a generic error.
  const upgrade =
    query.error instanceof ApiError &&
    (query.error.code === 'PLAN_UPGRADE_REQUIRED' || query.error.status === 402);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => query.refetch()}
          tintColor={colors.mutedForeground}
        />
      }
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.lg,
      }}
    >
      <DetailHeader
        eyebrow="Portfolio"
        title="Analytics"
        subtitle="Value, growth and return"
        onBack={() => router.back()}
      />

      {upgrade ? (
        <EmptyState
          icon={<BarChart3 size={34} color={colors.mutedForeground} />}
          title="Analytics are on the Pro plan"
          description="Upgrade from the web dashboard to see growth and returns per property."
        />
      ) : query.isError && !query.data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isPending ? (
        <Skeleton height={160} radius={radius.lg} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BarChart3 size={34} color={colors.mutedForeground} />}
          title="Nothing to measure yet"
          description="Add a property with its purchase price to see how its value changes."
        />
      ) : (
        <>
          <Card elevated style={{ gap: spacing.sm }}>
            <Text variant="caption" color="mutedForeground">
              Portfolio today
            </Text>
            <Price amount={totals.now} variant="title" />
            {totals.bought ? (
              <Text
                variant="callout"
                color={totals.now >= totals.bought ? 'success' : 'destructive'}
              >
                {pct(((totals.now - totals.bought) / totals.bought) * 100)} since purchase
              </Text>
            ) : null}
          </Card>
          {items.map((m) => (
            <MetricCard key={m.propertyId} m={m} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

function MetricCard({ m }: { m: OwnerInvestmentMetric }) {
  const { colors, spacing } = useTheme();
  const up = m.appreciationRate >= 0;
  return (
    <Card
      elevated
      accessible
      accessibilityLabel={`${m.propertyName}: worth ${Math.round(m.currentValue).toLocaleString('en-NG')} naira, ${pct(m.appreciationRate)} growth, ${pct(m.roiPercentage)} return`}
      style={{ gap: spacing.sm }}
    >
      <Text variant="bodyStrong" numberOfLines={1}>
        {m.propertyName}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text variant="caption" color="mutedForeground">
            Worth now
          </Text>
          <Price amount={m.currentValue} variant="callout" />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="caption" color="mutedForeground">
            Bought for
          </Text>
          <Price amount={m.purchasePrice} variant="callout" />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {up ? (
            <TrendingUp size={14} color={colors.success} />
          ) : (
            <TrendingDown size={14} color={colors.destructive} />
          )}
          <Text
            variant="caption"
            color={up ? 'success' : 'destructive'}
            style={{ fontWeight: '700' }}
          >
            {pct(m.appreciationRate)} growth
          </Text>
        </View>
        <Text variant="caption" color="mutedForeground">
          ROI {pct(m.roiPercentage)}
        </Text>
        {m.rentalYield != null ? (
          <Text variant="caption" color="mutedForeground">
            Yield {pct(m.rentalYield)}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
