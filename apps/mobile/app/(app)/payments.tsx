import { useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { AlertTriangle, FileStack, ReceiptText as ReceiptIcon, Wallet } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  LinkButton,
  Price,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  paymentsApi,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  type Payment,
} from '@/lib/api/payments';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { DisputePaymentSheet } from '@/components/payments/DisputePaymentSheet';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

export default function Payments() {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [disputePayment, setDisputePayment] = useState<Payment | null>(null);

  const query = useQuery({
    queryKey: qk.renter.payments(1, 50),
    queryFn: () => paymentsApi.list(1, 50),
    placeholderData: keepPreviousData,
  });
  const items = query.data?.items ?? [];

  const payMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.payNow(id, 'card'),
    onSuccess: async (payment) => {
      if (payment.authorizationUrl) {
        await WebBrowser.openBrowserAsync(payment.authorizationUrl);
      } else {
        toast.show('Payment successful.', 'success');
      }
      qc.invalidateQueries({ queryKey: qk.renter.payments(1, 50) });
      qc.invalidateQueries({ queryKey: qk.renter.lease });
      qc.invalidateQueries({ queryKey: qk.renter.dashboardStats });
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not process the payment.', 'error'),
  });

  const confirmPay = (payment: Payment) => {
    Alert.alert(
      'Pay rent?',
      `You're about to pay ₦${payment.amount.toLocaleString()} for ${payment.propertyName}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay now', onPress: () => payMutation.mutate(payment.id) },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Renter finance"
        title="Payments"
        subtitle="Rent, receipts and payment history"
        onBack={() => goBack()}
        accessory={
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <IconButton
              onPress={() => router.push('/(app)/payment-methods')}
              accessibilityLabel="Payment methods"
              icon={<Wallet size={19} color={colors.foreground} />}
            />
            <IconButton
              onPress={() => router.push('/(app)/receipts')}
              accessibilityLabel="Receipts"
              icon={<FileStack size={19} color={colors.foreground} />}
            />
          </View>
        }
      />

      {query.isError && !query.data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={96} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Wallet size={34} color={colors.mutedForeground} />}
          title="No payments yet"
          description="Rent payments will appear here once your lease is active."
        />
      ) : (
        <FlashList
          maintainVisibleContentPosition={{ disabled: true }}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: Payment }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <PaymentRow
                payment={item}
                paying={payMutation.isPending && payMutation.variables === item.id}
                onPay={() => confirmPay(item)}
                onDispute={() => setDisputePayment(item)}
              />
            </View>
          )}
          contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: spacing['3xl'] }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}

      <DisputePaymentSheet
        open={!!disputePayment}
        onClose={() => setDisputePayment(null)}
        payment={disputePayment}
      />
    </View>
  );
}

function PaymentRow({
  payment: p,
  paying,
  onPay,
  onDispute,
}: {
  payment: Payment;
  paying: boolean;
  onPay: () => void;
  onDispute: () => void;
}) {
  const { colors, spacing } = useTheme();
  const payable = p.status === 'pending' || p.status === 'overdue';
  const disputable = (p.status === 'paid' || p.status === 'overdue') && !p.disputeReason;

  return (
    <Card elevated>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: spacing.sm,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {p.description}
          </Text>
          <Text variant="caption" color="mutedForeground">
            {p.status === 'paid'
              ? `Paid ${formatDate(p.date, 'short')}`
              : `Due ${formatDate(p.dueDate, 'short')}`}
          </Text>
        </View>
        <Badge label={PAYMENT_STATUS_LABEL[p.status]} tone={PAYMENT_STATUS_TONE[p.status]} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: spacing.md,
        }}
      >
        <Price amount={p.amount} variant="heading" />
        {payable ? (
          <Button
            label="Pay now"
            size="sm"
            fullWidth={false}
            loading={paying}
            loadingLabel="Paying…"
            onPress={onPay}
          />
        ) : p.receiptUrl ? (
          <Pressable
            onPress={() => Linking.openURL(p.receiptUrl!)}
            accessibilityRole="link"
            accessibilityLabel="Open receipt"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44 }}
          >
            <ReceiptIcon size={14} color={colors.primary} />
            <Text variant="callout" color="primary" style={{ fontWeight: '600' }}>
              Receipt
            </Text>
          </Pressable>
        ) : null}
      </View>

      {p.disputeReason ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.sm }}>
          <AlertTriangle size={13} color={colors.warning} />
          <Text variant="caption" color="warning">
            Disputed: under review
          </Text>
        </View>
      ) : disputable ? (
        <LinkButton
          label="Dispute this payment"
          tone="muted"
          onPress={onDispute}
          style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }}
        />
      ) : null}
    </Card>
  );
}
