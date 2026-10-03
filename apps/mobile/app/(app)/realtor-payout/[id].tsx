import { RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Card,
  EmptyState,
  ErrorState,
  FormAlert,
  Price,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { realtorApi } from '@/lib/api/realtor';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { StatusPill } from '@/components/host/HostUI';
import { CommissionRow } from '@/components/realtor/CommissionRow';

const LABEL = {
  pending: { label: 'On its way', tone: 'info' },
  success: { label: 'Paid', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
} as const;

/** One withdrawal and exactly which commissions it settled. */
export default function RealtorPayoutDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const payout = useQuery({
    queryKey: qk.realtor.payout(id),
    queryFn: () => realtorApi.payout(id),
  });
  const p = payout.data;
  const notFound = payout.error instanceof ApiError && payout.error.status === 404;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={payout.isRefetching}
          onRefresh={() => payout.refetch()}
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
        eyebrow="Payout"
        title={p ? formatDate(p.createdAt, 'medium') : 'Payout'}
        onBack={() => router.back()}
      />
      {notFound ? (
        <EmptyState title="Payout not found" />
      ) : payout.isError && !p ? (
        <ErrorState onRetry={() => payout.refetch()} />
      ) : !p ? (
        <Skeleton height={160} radius={radius.lg} />
      ) : (
        <>
          <Card elevated style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
                Amount
              </Text>
              <StatusPill label={LABEL[p.status].label} tone={LABEL[p.status].tone} />
            </View>
            <Price amount={p.amount} variant="title" />
            <Text variant="caption" color="mutedForeground">
              {p.paidAt
                ? `Paid ${formatDate(p.paidAt, 'medium')}`
                : `Requested ${formatDate(p.createdAt, 'medium')}`}
              {p.transferRef ? ` · Ref ${p.transferRef}` : ''}
            </Text>
          </Card>
          {p.status === 'failed' ? (
            <FormAlert
              tone="warning"
              message={`${p.failureReason ?? 'The bank didn’t accept this transfer.'} This commission stays reserved for this payout, and support retries it to your account. If your bank details changed, update them first.`}
            />
          ) : null}
          <Text variant="heading" accessibilityRole="header">
            {p.status === 'success' ? 'What it paid' : 'What it covers'}
          </Text>
          {p.commissions.map((c) => (
            <CommissionRow key={c.id} c={c} />
          ))}
        </>
      )}
    </ScrollView>
  );
}
