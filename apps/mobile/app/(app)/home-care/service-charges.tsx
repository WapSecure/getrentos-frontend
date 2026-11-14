import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, ReceiptText } from '@sureground/icons/native';
import {
  SERVICE_CHARGE_CYCLE_LABELS,
  SERVICE_CHARGE_STATUS_LABELS,
  formatCurrency,
} from '@sureground/shared';
import { Badge, Card, Chip, ListSkeleton, QueryState, Text, useTheme } from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { serviceChargesApi } from '@/lib/api/serviceCharges';
import { useMyHomes } from '@/hooks/useMyHomes';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';
import { STATUS_TONE, formatDay } from '@/lib/serviceCharge';

/** Service-charge budgets. They are set up on the web; here they can be checked and published. */
export default function ServiceCharges() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ propertyId?: string }>();
  const homes = useMyHomes();
  const [propertyId, setPropertyId] = useState(params.propertyId ?? '');
  const budgets = useQuery({
    queryKey: qk.homeCare.serviceCharges(propertyId || 'all'),
    queryFn: () => serviceChargesApi.list(propertyId || undefined),
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={budgets.isRefetching}
          onRefresh={() => void budgets.refetch()}
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
        title="Service charge"
        subtitle="Yearly budgets for shared costs, billed to tenants with their rent"
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

      <QueryState
        query={budgets}
        skeleton={<ListSkeleton variant="card" rows={3} height={84} />}
        isEmpty={!budgets.data?.items.length}
        empty={{
          icon: <ReceiptText size={34} color={colors.mutedForeground} />,
          title: 'No budgets yet',
          description:
            'Set up a service charge budget on the web: add its lines and choose which units share it. You can check and publish it here.',
        }}
      >
        <View style={{ gap: spacing.md }}>
          {(budgets.data?.items ?? []).map((budget) => (
            <Pressable
              key={budget.id}
              accessibilityRole="button"
              accessibilityLabel={`${budget.title}, ${SERVICE_CHARGE_STATUS_LABELS[budget.status]}, ${formatCurrency(budget.total)}`}
              onPress={() =>
                router.push({
                  pathname: '/(app)/home-care/service-charge/[id]',
                  params: { id: budget.id },
                })
              }
            >
              {({ pressed }) => (
                <Card elevated style={{ gap: spacing.sm, opacity: pressed ? 0.92 : 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{budget.title}</Text>
                      <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                        {budget.property.title} · {formatDay(budget.periodStart)} ·{' '}
                        {SERVICE_CHARGE_CYCLE_LABELS[budget.billingCycle]}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.mutedForeground} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Badge
                      label={SERVICE_CHARGE_STATUS_LABELS[budget.status]}
                      tone={STATUS_TONE[budget.status]}
                    />
                    <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
                      {formatCurrency(budget.total)} across {budget.unitsSharing}{' '}
                      {budget.unitsSharing === 1 ? 'unit' : 'units'}
                    </Text>
                  </View>
                </Card>
              )}
            </Pressable>
          ))}
        </View>
      </QueryState>
    </ScrollView>
  );
}
