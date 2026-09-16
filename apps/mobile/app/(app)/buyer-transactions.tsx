import { Alert, Linking, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Wallet } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  buyerTransactionsApi,
  BUYER_ESCROW_STATUS_LABEL,
  BUYER_ESCROW_STATUS_TONE,
  type BuyerTransaction,
} from '@/lib/api/buyerTransactions';
import { formatDate } from '@/lib/format';
import { ApiError } from '@/lib/api/client';

export default function BuyerTransactions() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: qk.buyer.transactions(1, 50),
    queryFn: () => buyerTransactionsApi.list(1, 50),
  });
  const items = query.data?.items ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ['buyer', 'transactions'] });

  const depositMutation = useMutation({
    mutationFn: (id: string) => buyerTransactionsApi.deposit(id),
    onSuccess: (tx) => {
      invalidate();
      if (tx.authorizationUrl) Linking.openURL(tx.authorizationUrl);
      else toast.show('Deposit initiated.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not start this deposit.', 'error'),
  });

  const releaseMutation = useMutation({
    mutationFn: (id: string) => buyerTransactionsApi.release(id),
    onSuccess: () => {
      invalidate();
      toast.show('Funds released.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not release these funds.', 'error'),
  });

  const refundMutation = useMutation({
    mutationFn: (id: string) => buyerTransactionsApi.refund(id),
    onSuccess: () => {
      invalidate();
      toast.show('Refund requested.', 'success');
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not request a refund.', 'error'),
  });

  const confirmRefund = (tx: BuyerTransaction) => {
    Alert.alert('Request refund', `Request a refund for ${tx.propertyTitle}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Request refund', style: 'destructive', onPress: () => refundMutation.mutate(tx.id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="title">Transactions</Text>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={160} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Wallet size={34} color={colors.mutedForeground} />}
          title="No transactions yet"
          description="Once an offer is accepted, its escrow progress will appear here."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: BuyerTransaction }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Card elevated>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {item.propertyTitle}
                    </Text>
                    <Text variant="caption" color="mutedForeground">
                      {item.ownerName} · {formatDate(item.createdAt, 'short')}
                    </Text>
                  </View>
                  <Badge
                    label={BUYER_ESCROW_STATUS_LABEL[item.escrowStatus]}
                    tone={BUYER_ESCROW_STATUS_TONE[item.escrowStatus]}
                  />
                </View>

                <Divider style={{ marginVertical: spacing.sm }} />
                <Price amount={item.purchasePrice} variant="bodyStrong" />

                {item.milestones?.length ? (
                  <View style={{ gap: 4, marginTop: spacing.sm }}>
                    {item.milestones.map((m, i) => (
                      <Text
                        key={i}
                        variant="caption"
                        color={m.completed ? 'success' : 'mutedForeground'}
                      >
                        {m.completed ? '✓' : '○'} {m.label}
                      </Text>
                    ))}
                  </View>
                ) : null}

                {item.disputeReason ? (
                  <Text
                    variant="caption"
                    style={{ color: colors.destructive, marginTop: spacing.sm }}
                  >
                    Disputed: {item.disputeReason}
                  </Text>
                ) : null}

                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                  {item.escrowStatus === 'deposit_pending' ? (
                    <Button
                      label="Pay deposit"
                      size="sm"
                      style={{ flex: 1 }}
                      loading={depositMutation.isPending}
                      onPress={() => depositMutation.mutate(item.id)}
                    />
                  ) : null}
                  {item.escrowStatus === 'final_payment' ? (
                    <Button
                      label="Release funds"
                      size="sm"
                      style={{ flex: 1 }}
                      loading={releaseMutation.isPending}
                      onPress={() => releaseMutation.mutate(item.id)}
                    />
                  ) : null}
                  {item.escrowStatus === 'funds_held' || item.escrowStatus === 'verification' ? (
                    <Button
                      label="Request refund"
                      variant="outline"
                      size="sm"
                      style={{ flex: 1 }}
                      loading={refundMutation.isPending}
                      onPress={() => confirmRefund(item)}
                    />
                  ) : null}
                </View>
              </Card>
            </View>
          )}
          contentContainerStyle={{
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}
    </View>
  );
}
