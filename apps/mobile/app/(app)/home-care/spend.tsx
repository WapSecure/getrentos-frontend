import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3 } from '@sureground/icons/native';
import {
  costPerUnitFigure,
  formatCurrency,
  formatLitres,
  formatSpendOrNoData,
  monthSpendBreakdown,
} from '@sureground/shared';
import { Card, Chip, ListSkeleton, QueryState, StatGroup, Text, useTheme } from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { homeUtilitiesApi } from '@/lib/api/homeUtilities';
import { useMyHomes } from '@/hooks/useMyHomes';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';

const RANGES = [6, 12, 24] as const;

/** Recorded utility spend by Lagos month. Only what was logged is counted, and gaps are shown as gaps. */
export default function UtilitySpend() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ propertyId?: string }>();
  const homes = useMyHomes();
  const [propertyId, setPropertyId] = useState(params.propertyId ?? '');
  const [months, setMonths] = useState<(typeof RANGES)[number]>(12);
  const analytics = useQuery({
    queryKey: qk.homeCare.utilitiesAnalytics(propertyId || 'all', months),
    queryFn: () => homeUtilitiesApi.analytics(propertyId || undefined, months),
  });
  const data = analytics.data;
  // Newest month first: on a phone the latest figures matter most.
  const rows = [...(data?.months ?? [])].reverse();
  const peak = Math.max(1, ...rows.map((row) => row.total ?? 0));
  const perUnit = data ? costPerUnitFigure(data, Boolean(propertyId)) : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={analytics.isRefetching}
          onRefresh={() => void analytics.refetch()}
          tintColor={colors.mutedForeground}
        />
      }
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.xl,
      }}
    >
      <DetailHeader
        eyebrow="Power and water"
        title="Recorded spend"
        subtitle="Fuel, electricity, water and utility repairs, by month in Lagos time"
        onBack={() => goBack()}
      />

      {(homes.data?.length ?? 0) > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          <Chip label="All homes" selected={!propertyId} onPress={() => setPropertyId('')} />
          {(homes.data ?? []).map((home) => (
            <Chip
              key={home.id}
              label={home.name}
              selected={propertyId === home.id}
              onPress={() => setPropertyId(home.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {RANGES.map((range) => (
          <Chip
            key={range}
            label={`${range} months`}
            selected={months === range}
            onPress={() => setMonths(range)}
          />
        ))}
      </View>

      <QueryState
        query={analytics}
        skeleton={<ListSkeleton variant="card" rows={3} height={88} />}
        isEmpty={!data || data.entriesCount === 0}
        empty={{
          icon: <BarChart3 size={34} color={colors.mutedForeground} />,
          title: 'No data yet',
          description:
            'Log fuel, tokens, bills, tanker deliveries or water tests and the monthly spend appears here.',
        }}
      >
        {data && perUnit ? (
          <View style={{ gap: spacing.xl }}>
            <StatGroup
              title={`Last ${months} months`}
              items={[
                { label: 'Total recorded', value: formatSpendOrNoData(data.totals.total) },
                { label: 'Per unit', value: perUnit.value, subtitle: perUnit.hint },
                {
                  label: 'Diesel bought',
                  value: data.totals.fuel?.quantity
                    ? formatLitres(data.totals.fuel.quantity)
                    : 'No data yet',
                },
                {
                  label: 'Average diesel price',
                  value:
                    data.dieselPricePerLitre === null
                      ? 'No data yet'
                      : `${formatCurrency(data.dieselPricePerLitre)} a litre`,
                  subtitle: 'From entries that recorded litres',
                },
              ]}
            />

            <View style={{ gap: spacing.md }}>
              <Text variant="heading" headingLevel={2}>
                By month
              </Text>
              <Card style={{ gap: spacing.lg }}>
                {rows.map((row) => {
                  const breakdown = monthSpendBreakdown(row);
                  return (
                    <View
                      key={row.month}
                      accessible
                      accessibilityLabel={
                        row.total === null
                          ? `${row.label}: nothing recorded`
                          : `${row.label}: ${formatSpendOrNoData(row.total)}. ${breakdown}`
                      }
                      style={{ gap: spacing.xs }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
                        <Text variant="callout" style={{ flex: 1, fontWeight: '600' }}>
                          {row.label}
                        </Text>
                        <Text
                          variant="callout"
                          color={row.total === null ? 'mutedForeground' : undefined}
                        >
                          {row.total === null ? 'Nothing recorded' : formatSpendOrNoData(row.total)}
                        </Text>
                      </View>
                      {row.total !== null ? (
                        <>
                          <View
                            style={{
                              height: 6,
                              borderRadius: radius.full,
                              backgroundColor: colors.secondary,
                              overflow: 'hidden',
                            }}
                          >
                            <View
                              style={{
                                width: `${Math.max(2, Math.round((row.total / peak) * 100))}%`,
                                height: '100%',
                                backgroundColor: colors.primary,
                              }}
                            />
                          </View>
                          <Text variant="caption" color="mutedForeground">
                            {breakdown}
                          </Text>
                        </>
                      ) : null}
                    </View>
                  );
                })}
              </Card>
              <Text variant="caption" color="mutedForeground">
                Based on {data.entriesCount} recorded {data.entriesCount === 1 ? 'entry' : 'entries'}.
                Only what was logged is counted, so a month with gaps may be understated.
              </Text>
            </View>
          </View>
        ) : null}
      </QueryState>
    </ScrollView>
  );
}
