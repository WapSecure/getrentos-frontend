import { usePaystackCheckout } from '@/hooks/usePaystackCheckout';
import { useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { AlertTriangle, FileStack, ReceiptText as ReceiptIcon, Wallet } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  IconButton,
  LinkButton,
  Price,
  QueryState,
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
import { errorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { DisputePaymentSheet } from '@/components/payments/DisputePaymentSheet';
import { PayAmountSheet } from '@/components/payments/PayAmountSheet';
import { usePaymentProviders } from '@/hooks/usePaymentProviders';
import type { PaymentProvider } from '@/lib/api/paymentStatus';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

export default function Payments() {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const checkout = usePaystackCheckout();
  const [disputePayment, setDisputePayment] = useState<Payment | null>(null);
  const [payPayment, setPayPayment] = useState<Payment | null>(null);
  // Which company takes the payment, and why the last one could not.
  const providers = usePaymentProviders();
  const [providerError, setProviderError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: qk.renter.payments(1, 50),
    queryFn: () => paymentsApi.list(1, 50),
    placeholderData: keepPreviousData,
  });
  const items = query.data?.items ?? [];

  const payMutation = useMutation({
    mutationFn: ({
      id,
      amount,
      provider,
    }: {
      id: string;
      amount?: number;
      provider?: PaymentProvider;
      payment: Payment;
    }) => paymentsApi.payNow(id, 'card', amount, provider),
    onSuccess: async (payment) => {
      // The sheet stayed open while the payment started; the checkout or result takes over.
      setPayPayment(null);
      setProviderError(null);
      if (payment.authorizationUrl) {
        await checkout(payment.authorizationUrl, payment.reference);
      } else {
        toast.show('Payment successful.', 'success');
      }
      qc.invalidateQueries({ queryKey: qk.renter.payments(1, 50) });
      qc.invalidateQueries({ queryKey: qk.renter.lease });
      qc.invalidateQueries({ queryKey: qk.renter.dashboardStats });
    },
    onError: (err, variables) => {
      // That company cannot take it right now: reopen the sheet with the other one picked.
      const unavailable = providers.recover(err, variables.provider);
      if (unavailable) {
        setProviderError(unavailable);
        return;
      }
      setPayPayment(null);
      toast.show(errorMessage(err, 'Could not process the payment.'), 'error');
    },
  });

  const confirmMoveInMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.confirmMoveIn(id),
    onSuccess: () => {
      toast.show('Move-in confirmed — rent released to your landlord.', 'success');
      qc.invalidateQueries({ queryKey: qk.renter.payments(1, 50) });
      qc.invalidateQueries({ queryKey: qk.renter.lease });
      qc.invalidateQueries({ queryKey: qk.renter.dashboardStats });
    },
    onError: (err) => toast.show(errorMessage(err, 'Could not release this payment.'), 'error'),
  });

  const confirmMoveIn = (payment: Payment) => {
    Alert.alert(
      'Confirm move-in?',
      `This releases ₦${payment.amount.toLocaleString()} for ${payment.propertyName} to your landlord now. Only confirm once you've moved in — it can't be undone.`,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Release to landlord',
          style: 'destructive',
          onPress: () => confirmMoveInMutation.mutate(payment.id),
        },
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

      <QueryState
        query={query}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={96} radius={radius.lg} />
            ))}
          </View>
        }
        isEmpty={items.length === 0}
        empty={{
          icon: <Wallet size={34} color={colors.mutedForeground} />,
          title: 'No payments yet',
          description: 'Rent payments will appear here once your lease is active.',
        }}
      >
        <FlashList
          maintainVisibleContentPosition={{ disabled: true }}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: Payment }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <PaymentRow
                payment={item}
                paying={payMutation.isPending && payMutation.variables?.id === item.id}
                releasing={
                  confirmMoveInMutation.isPending && confirmMoveInMutation.variables === item.id
                }
                onPay={() => setPayPayment(item)}
                onResume={async () => {
                  if (!item.resumeCheckout) return;
                  await checkout(item.resumeCheckout.url, item.resumeCheckout.reference);
                  qc.invalidateQueries({ queryKey: qk.renter.payments(1, 50) });
                }}
                onDispute={() => setDisputePayment(item)}
                onConfirmMoveIn={() => confirmMoveIn(item)}
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
      </QueryState>

      <PayAmountSheet
        payment={payPayment}
        onClose={() => {
          if (payMutation.isPending) return;
          setPayPayment(null);
          setProviderError(null);
        }}
        onPay={(amount) => {
          if (!payPayment) return;
          setProviderError(null);
          payMutation.mutate({
            id: payPayment.id,
            amount,
            provider: providers.provider,
            payment: payPayment,
          });
        }}
        busy={payMutation.isPending}
        providers={providers}
        providerError={providerError}
      />

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
  releasing,
  onPay,
  onResume,
  onDispute,
  onConfirmMoveIn,
}: {
  payment: Payment;
  paying: boolean;
  releasing: boolean;
  onPay: () => void;
  /** Back to the checkout the tenant closed. */
  onResume: () => void;
  onDispute: () => void;
  onConfirmMoveIn: () => void;
}) {
  const { colors, spacing } = useTheme();
  const payable = p.status === 'pending' || p.status === 'overdue';
  const releasable = p.status === 'paid' && p.escrowStatus === 'held' && !p.disputeReason;
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
        <Price amount={payable ? (p.outstanding ?? p.amount) : p.amount} variant="heading" />
        {payable ? (
          <Button
            label="Pay now"
            size="sm"
            fullWidth={false}
            loading={paying}
            loadingLabel="Paying…"
            onPress={onPay}
          />
        ) : p.status === 'processing' && p.resumeCheckout ? (
          <Button label="Resume payment" size="sm" fullWidth={false} onPress={onResume} />
        ) : releasable ? (
          <Button
            label="Confirm move-in"
            size="sm"
            fullWidth={false}
            loading={releasing}
            loadingLabel="Releasing…"
            onPress={onConfirmMoveIn}
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

      {releasable ? (
        <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.sm }}>
          {p.releaseDate
            ? `Held under GetRentos Payment Protection — releases to your landlord automatically on ${formatDate(p.releaseDate, 'short')}, or sooner if you confirm move-in.`
            : 'Held under GetRentos Payment Protection — confirm move-in to release it to your landlord.'}
        </Text>
      ) : null}

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
