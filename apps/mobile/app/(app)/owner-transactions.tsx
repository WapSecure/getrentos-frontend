import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Lock, ShieldAlert, Wallet } from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { ownerApi, type OwnerEscrowStatus, type OwnerTransaction } from '@/lib/api/owner';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

const STAGES: { key: OwnerEscrowStatus; label: string; now: string }[] = [
  {
    key: 'deposit_pending',
    label: 'Buyer’s deposit',
    now: 'Waiting for the buyer to pay their deposit to GetRentos.',
  },
  { key: 'funds_held', label: 'Funds held', now: 'The deposit is held safely by GetRentos.' },
  {
    key: 'verification',
    label: 'Verification',
    now: 'Compliance is reviewing the transfer documents.',
  },
  {
    key: 'final_payment',
    label: 'Final payment',
    now: 'Waiting for the buyer to release the balance.',
  },
  { key: 'released', label: 'Completed', now: 'The sale is complete.' },
];

const PAYOUT: Record<
  NonNullable<OwnerTransaction['sellerPayoutStatus']>,
  { label: string; tone: 'info' | 'success' | 'warning' | 'danger' }
> = {
  PENDING: { label: 'Payout queued', tone: 'info' },
  PROCESSING: { label: 'Payout on its way', tone: 'info' },
  PAID: { label: 'Paid to you', tone: 'success' },
  FAILED: { label: 'Payout failed', tone: 'danger' },
};

export default function OwnerTransactions() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const query = useQuery({
    queryKey: qk.owner.transactions,
    queryFn: () => ownerApi.transactions(),
  });
  const items = query.data?.items ?? [];

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
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <DetailHeader
          eyebrow="Selling"
          title="Sales in progress"
          subtitle="Where each accepted sale stands"
          onBack={() => router.back()}
        />
      </View>

      {query.isError && !query.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Skeleton height={200} radius={radius.lg} />
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(t) => t.id}
          refreshControl={refresh}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <EmptyState
              icon={<Wallet size={34} color={colors.mutedForeground} />}
              title="No sales yet"
              description="When you accept an offer, the sale and its protected payment show up here."
            />
          }
          renderItem={({ item: t }: { item: OwnerTransaction }) => <SaleCard t={t} />}
        />
      )}
    </View>
  );
}

function SaleCard({ t }: { t: OwnerTransaction }) {
  const { colors, spacing, radius } = useTheme();
  const frozen = t.escrowStatus === 'frozen' || t.escrowStatus === 'disputed';
  const current = STAGES.findIndex((s) => s.key === t.escrowStatus);
  const payout = t.sellerPayoutStatus ? PAYOUT[t.sellerPayoutStatus] : null;

  return (
    <Card elevated style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {t.propertyName}
          </Text>
          <Text variant="caption" color="mutedForeground">
            Buyer: {t.buyerName} · {formatDate(t.createdAt, 'short')}
          </Text>
        </View>
        {payout ? <Badge label={payout.label} tone={payout.tone} /> : null}
      </View>
      <Price amount={t.salePrice} variant="heading" />

      {frozen ? (
        <View
          accessible
          accessibilityRole="alert"
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
            padding: spacing.md,
            borderRadius: radius.md,
            backgroundColor: colors.destructiveSubtle,
          }}
        >
          <ShieldAlert size={18} color={colors.destructive} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="callout" style={{ color: colors.destructive, fontWeight: '700' }}>
              Payment on hold — dispute open
            </Text>
            <Text variant="caption" color="mutedForeground">
              {t.disputeReason || 'Funds stay held until the dispute is resolved.'}
            </Text>
          </View>
        </View>
      ) : t.escrowStatus === 'refunded' ? (
        <Text variant="callout" color="mutedForeground">
          The buyer’s deposit was refunded and this sale is closed.
        </Text>
      ) : (
        <View
          accessible
          accessibilityLabel={`Stage ${current + 1} of ${STAGES.length}: ${STAGES[current]?.label}. ${STAGES[current]?.now}`}
        >
          {STAGES.map((stage, i) => {
            const done = i < current || t.escrowStatus === 'released';
            const active = i === current && t.escrowStatus !== 'released';
            return (
              <View key={stage.key} style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ alignItems: 'center', width: 22 }}>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: done
                        ? colors.success
                        : active
                          ? colors.primary
                          : colors.secondary,
                    }}
                  >
                    {done ? (
                      <Check size={13} color={colors.primaryForeground} strokeWidth={3} />
                    ) : active ? (
                      <Lock size={11} color={colors.primaryForeground} />
                    ) : null}
                  </View>
                  {i < STAGES.length - 1 ? (
                    <View
                      style={{
                        flex: 1,
                        width: 2,
                        minHeight: 14,
                        backgroundColor: done ? colors.success : colors.border,
                      }}
                    />
                  ) : null}
                </View>
                <View style={{ flex: 1, paddingBottom: i < STAGES.length - 1 ? spacing.sm : 0 }}>
                  <Text
                    variant="callout"
                    color={done || active ? 'foreground' : 'mutedForeground'}
                    style={{ fontWeight: active ? '700' : '500' }}
                  >
                    {stage.label}
                  </Text>
                  {active ? (
                    <Text variant="caption" color="mutedForeground">
                      {stage.now}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {t.sellerPayoutStatus === 'FAILED' ? (
        <Text variant="caption" style={{ color: colors.destructive }}>
          Your payout didn’t go through. Check your payout account on the web dashboard, then
          contact support.
        </Text>
      ) : t.sellerPaidAt ? (
        <Text variant="caption" color="mutedForeground">
          Paid to you {formatDate(t.sellerPaidAt, 'medium')}
        </Text>
      ) : null}
    </Card>
  );
}
