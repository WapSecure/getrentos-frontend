import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, ReceiptText } from '@sureground/icons/native';
import { formatCurrency } from '@sureground/shared';
import {
  Badge,
  Card,
  ListSkeleton,
  QueryState,
  Text,
  useTheme,
  type BadgeTone,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { statementsApi, type StatementKind } from '@/lib/api/serviceChargeStatements';
import { formatDay } from '@/lib/serviceCharge';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';

const COLLECTION_LABEL = {
  PAID: 'Paid',
  PART_PAID: 'Part paid',
  UNPAID: 'To pay',
  REMOVED: 'Removed',
  WAIVED: 'Waived',
};
const COLLECTION_BADGE: Record<keyof typeof COLLECTION_LABEL, BadgeTone> = {
  PAID: 'success',
  PART_PAID: 'warning',
  UNPAID: 'neutral',
  REMOVED: 'neutral',
  WAIVED: 'neutral',
};

/** A tenant's or resident's service charges, each opening its statement. */
export default function ServiceChargeStatements() {
  const { kind: raw } = useLocalSearchParams<{ kind?: string }>();
  const kind: StatementKind = raw === 'resident' ? 'resident' : 'renter';
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const list = useQuery({
    queryKey: qk.statements.list(kind),
    queryFn: () => statementsApi.list(kind),
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={list.isRefetching}
          onRefresh={() => void list.refetch()}
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
        eyebrow={kind === 'renter' ? 'Payments' : 'Dues'}
        title="Service charges"
        subtitle="Your share of shared costs, and how it was worked out"
        onBack={() => goBack()}
      />
      <QueryState
        query={list}
        skeleton={<ListSkeleton variant="card" rows={3} height={84} />}
        isEmpty={!list.data?.length}
        empty={{
          icon: <ReceiptText size={34} color={colors.mutedForeground} />,
          title: 'No service charges',
          description: 'When a service charge is billed to you, it appears here.',
        }}
      >
        <View style={{ gap: spacing.md }}>
          {(list.data ?? []).map((charge) => (
            <Pressable
              key={charge.id}
              accessibilityRole="button"
              accessibilityLabel={`${charge.title}, ${formatCurrency(charge.amount)}, ${COLLECTION_LABEL[charge.collection]}`}
              onPress={() =>
                router.push({
                  pathname: '/(app)/service-charge-statement/[id]',
                  params: { id: charge.id, kind },
                })
              }
            >
              {({ pressed }) => (
                <Card elevated style={{ gap: spacing.sm, opacity: pressed ? 0.92 : 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{charge.title}</Text>
                      <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                        {charge.unit}
                        {charge.property ? `, ${charge.property}` : ''} · due{' '}
                        {formatDay(charge.dueDate)}
                      </Text>
                    </View>
                    <Text variant="bodyStrong">{formatCurrency(charge.amount)}</Text>
                    <ChevronRight size={18} color={colors.mutedForeground} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <Badge
                      label={COLLECTION_LABEL[charge.collection]}
                      tone={COLLECTION_BADGE[charge.collection]}
                    />
                    {charge.openQueries > 0 ? <Badge label="Query open" tone="info" /> : null}
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
