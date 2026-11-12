import { RefreshControl, ScrollView, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3 } from '@sureground/icons/native';
import {
  Card,
  EmptyState,
  Price,
  QueryState,
  Skeleton,
  Text,
  useTheme,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { ownerApi, type OwnerInvestmentMetric } from '@/lib/api/owner';
import { ApiError } from '@/lib/api/client';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';
import { valuationDate, valuationNote, valuationSentence } from '@sureground/shared';

const pct = (n: number) => `${n.toFixed(1)}%`;

export default function OwnerAnalytics() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const query = useQuery({ queryKey: qk.owner.metrics, queryFn: ownerApi.metrics });
  const items = query.data ?? [];
  // Recorded purchase prices only; a value comes only from an accredited valuer's report (DIA-30).
  const priced = items.filter((m) => m.purchasePrice != null);
  const invested = priced.reduce((sum, m) => sum + (m.purchasePrice ?? 0), 0);
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
          onRefresh={() => void query.refetch()}
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
        subtitle="Figures from your records"
        onBack={() => goBack()}
      />

      {upgrade ? (
        <EmptyState
          icon={<BarChart3 size={34} color={colors.mutedForeground} />}
          title="Analytics are on the Pro plan"
          description="Upgrade from the web dashboard to see prices and rental yield per property."
        />
      ) : (
        <QueryState
          query={query}
          skeleton={<Skeleton height={160} radius={radius.lg} />}
          isEmpty={items.length === 0}
          empty={{
            icon: <BarChart3 size={34} color={colors.mutedForeground} />,
            title: 'Nothing to measure yet',
            description: 'Add a property and its purchase price to see it here.',
          }}
        >
          <Card elevated style={{ gap: spacing.sm }}>
            <Text variant="caption" color="mutedForeground">
              Total invested
            </Text>
            {priced.length ? (
              <>
                <Price amount={invested} variant="title" />
                <Text variant="caption" color="mutedForeground">
                  Purchase prices on {priced.length} of {items.length}{' '}
                  {items.length === 1 ? 'property' : 'properties'}.
                </Text>
              </>
            ) : (
              <Text variant="callout" color="mutedForeground">
                No purchase prices recorded.
              </Text>
            )}
          </Card>
          {items.map((m) => (
            <MetricCard key={m.propertyId} m={m} />
          ))}
        </QueryState>
      )}
    </ScrollView>
  );
}

function MetricCard({ m }: { m: OwnerInvestmentMetric }) {
  const { spacing } = useTheme();
  return (
    <Card elevated style={{ gap: spacing.sm }}>
      <Text variant="bodyStrong" numberOfLines={1}>
        {m.propertyName}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text variant="caption" color="mutedForeground">
            Bought for
          </Text>
          {m.purchasePrice != null ? (
            <Price amount={m.purchasePrice} variant="callout" />
          ) : (
            <Text variant="callout" color="mutedForeground">
              No price recorded
            </Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="caption" color="mutedForeground">
            Asking price
          </Text>
          {m.askingPrice != null ? (
            <Price amount={m.askingPrice} variant="callout" />
          ) : (
            <Text variant="callout" color="mutedForeground">
              Not listed
            </Text>
          )}
        </View>
      </View>
      {m.valuation ? (
        <View style={{ gap: 2 }}>
          <Text variant="callout" color={m.valuation.outOfDate ? 'mutedForeground' : undefined}>
            {valuationSentence(m.valuation)}
          </Text>
          <Text variant="caption" color="mutedForeground">
            {valuationNote(m.valuation)}
          </Text>
          {m.valuationChange ? (
            <Text variant="caption" color="mutedForeground">
              {m.valuationChange.changePercent > 0 ? '+' : ''}
              {m.valuationChange.changePercent}% from {valuationDate(m.valuationChange.fromDate)} to{' '}
              {valuationDate(m.valuationChange.toDate)}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text variant="caption" color="mutedForeground">
          Not valued
        </Text>
      )}
      {m.rentalYield != null ? (
        <Text variant="caption" color="mutedForeground">
          Net yield, last 12 months: {pct(m.rentalYield)}
        </Text>
      ) : null}
    </Card>
  );
}
