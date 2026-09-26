import { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquareWarning, Plus, Wallet } from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Price,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { landlordApi, LANDLORD_PAYMENT_TONE, type LandlordPayment } from '@/lib/api/landlord';
import { formatDate } from '@/lib/format';
import { ChargeRentSheet } from '@/components/landlord/ChargeRentSheet';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

export default function LandlordPayments() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const [charging, setCharging] = useState(false);

  const query = useQuery({
    queryKey: qk.landlord.payments(),
    queryFn: () => landlordApi.payments(),
  });
  const stats = useQuery({
    queryKey: qk.landlord.paymentStats,
    queryFn: landlordApi.paymentStats,
  });
  const arrears = useQuery({
    queryKey: qk.landlord.arrearsSummary,
    queryFn: landlordApi.arrearsSummary,
  });

  const items = query.data?.items ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <DetailHeader
          eyebrow="Financials"
          title="Payments"
          subtitle="Collections, escrow and arrears"
          onBack={() => router.back()}
          accessory={
            <IconButton
              onPress={() => setCharging(true)}
              accessibilityLabel="Raise a charge"
              icon={<Plus size={20} color={colors.primary} />}
            />
          }
        />
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(p) => p.id}
          renderItem={({ item }: { item: LandlordPayment }) => <PaymentRow payment={item} />}
          ListHeaderComponent={
            <View style={{ gap: spacing.sm, paddingBottom: spacing.md }}>
              <Card elevated>
                {stats.isLoading ? (
                  <Skeleton height={56} />
                ) : (
                  <View style={{ flexDirection: 'row' }}>
                    <Figure label="Collected" amount={stats.data?.totalCollected ?? 0} />
                    <Figure label="In escrow" amount={stats.data?.escrowPending ?? 0} />
                    <Figure label="Outstanding" amount={stats.data?.outstandingBalance ?? 0} />
                  </View>
                )}
              </Card>

              {(arrears.data?.overdueCount ?? 0) > 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    padding: spacing.lg,
                    borderRadius: radius.lg,
                    backgroundColor: colors.destructive + '14',
                  }}
                >
                  <MessageSquareWarning size={17} color={colors.destructive} />
                  <Text variant="callout" style={{ flex: 1, color: colors.destructive }}>
                    {arrears.data?.overdueCount} tenant
                    {arrears.data?.overdueCount === 1 ? '' : 's'} in arrears
                  </Text>
                  <Price
                    amount={arrears.data?.totalOverdue ?? 0}
                    variant="callout"
                    color="destructive"
                    compact
                  />
                </View>
              ) : null}
            </View>
          }
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => {
                query.refetch();
                stats.refetch();
                arrears.refetch();
              }}
              tintColor={colors.mutedForeground}
            />
          }
          ListEmptyComponent={
            query.isLoading ? (
              <View style={{ gap: spacing.sm }}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} height={88} radius={radius.lg} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon={<Wallet size={32} color={colors.mutedForeground} />}
                title="No payments yet"
                description="Rent collected across your properties shows up here."
              />
            )
          }
        />
      )}

      <ChargeRentSheet open={charging} onClose={() => setCharging(false)} />
    </View>
  );
}

function Figure({ label, amount }: { label: string; amount: number }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Price amount={amount} variant="bodyStrong" compact />
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
    </View>
  );
}

function PaymentRow({ payment: p }: { payment: LandlordPayment }) {
  const { colors, spacing } = useTheme();

  return (
    <Card padding={spacing.lg} style={{ marginBottom: spacing.sm }}>
      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {p.tenantName}
          </Text>
          <Price amount={p.amount} variant="callout" />
          <Badge label={p.status} tone={LANDLORD_PAYMENT_TONE[p.status]} />
        </View>

        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
          {p.propertyName}
          {p.unitName ? ` · ${p.unitName}` : ''}
        </Text>

        <Text variant="caption" color="mutedForeground">
          Due {formatDate(p.dueDate, 'short')}
          {p.paidDate ? ` · paid ${formatDate(p.paidDate, 'short')}` : ''}
        </Text>

        {/* A dispute freezes escrow, so it must never be buried in a detail view. */}
        {p.disputeReason ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <MessageSquareWarning size={13} color={colors.destructive} />
            <Text variant="caption" style={{ flex: 1, color: colors.destructive }}>
              Disputed: {p.disputeReason}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}
