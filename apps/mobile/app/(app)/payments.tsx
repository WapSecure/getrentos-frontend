import { usePaystackCheckout } from '@/hooks/usePaystackCheckout';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import {
  AlertTriangle,
  FileStack,
  ReceiptText as ReceiptIcon,
  Wallet,
} from '@sureground/icons/native';
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
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { rentReleaseActions, type RentReleaseAction } from '@sureground/shared';
import {
  paymentsApi,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  type Payment,
  type PaymentsSummary,
} from '@/lib/api/payments';
import { errorMessage } from '@/lib/api/client';
import { formatDate, formatNaira } from '@/lib/format';
import { DisputePaymentSheet } from '@/components/payments/DisputePaymentSheet';
import { PayAmountSheet } from '@/components/payments/PayAmountSheet';
import { usePaymentProviders } from '@/hooks/usePaymentProviders';
import type { PaymentProvider } from '@/lib/api/paymentStatus';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const PAGE_SIZE = 20;

function paidOutcome(p: Payment): [string, 'success' | 'info'] {
  if (p.status === 'paid')
    return [p.reference ? `Paid. Reference ${p.reference}` : 'Paid.', 'success'];
  if (p.status === 'processing')
    return [
      `Your payment for ${p.propertyName} is being confirmed. It shows as Processing until it clears.`,
      'info',
    ];
  if ((p.amountPaid ?? 0) > 0)
    return [
      `Part-payment received for ${p.propertyName}. ${formatNaira(p.outstanding ?? 0)} is still owed on this charge.`,
      'success',
    ];
  return [`${p.propertyName}: this charge is not paid yet.`, 'info'];
}

export default function Payments() {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const checkout = usePaystackCheckout();
  const [disputePayment, setDisputePayment] = useState<Payment | null>(null);
  const [payPayment, setPayPayment] = useState<Payment | null>(null);
  const providers = usePaymentProviders();
  const [providerError, setProviderError] = useState<string | null>(null);

  // Paged as the renter scrolls, so older records stay reachable.
  const query = useInfiniteQuery({
    queryKey: qk.renter.paymentsHistory,
    queryFn: ({ pageParam }) => paymentsApi.list(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  // Account-wide figures from the API, not the loaded pages; older APIs send none.
  const summary = query.data?.pages[0]?.summary;
  const refreshPayments = () => qc.invalidateQueries({ queryKey: qk.renter.paymentsAll });

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
        // Say "Paid" only when the API says the charge is paid.
        toast.show(...paidOutcome(payment));
      }
      refreshPayments();
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
    mutationFn: ({ id }: { id: string; early: boolean }) => paymentsApi.confirmMoveIn(id),
    onSuccess: (_data, { early }) => {
      toast.show(
        early
          ? 'Rent released to your landlord.'
          : 'Move-in confirmed — rent released to your landlord.',
        'success'
      );
      refreshPayments();
      qc.invalidateQueries({ queryKey: qk.renter.lease });
      qc.invalidateQueries({ queryKey: qk.renter.dashboardStats });
    },
    onError: (err) => toast.show(errorMessage(err, 'Could not release this payment.'), 'error'),
  });

  // Over every loaded payment: move-in is asked once per home, then held rent can be released early.
  const releaseActions = useMemo(() => rentReleaseActions(items), [items]);

  const confirmMoveIn = (payment: Payment) => {
    const early = releaseActions.get(payment.id) === 'release-now';
    const held = payment.heldAmountNaira ? `${formatNaira(payment.heldAmountNaira)} ` : '';
    Alert.alert(
      early ? 'Release this rent now?' : 'Confirm move-in?',
      early
        ? `This releases the ${held}rent Sureground is holding for ${payment.propertyName} to your landlord now${
            payment.releaseDate ? `, instead of on ${formatDate(payment.releaseDate, 'short')}` : ''
          }. It can't be undone.`
        : `This releases the ${held}rent Sureground is holding for ${payment.propertyName} to your landlord now. Only confirm once you've moved in — it can't be undone.`,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Release to landlord',
          style: 'destructive',
          onPress: () => confirmMoveInMutation.mutate({ id: payment.id, early }),
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
                  confirmMoveInMutation.isPending && confirmMoveInMutation.variables?.id === item.id
                }
                releaseAction={releaseActions.get(item.id)}
                onPay={() => setPayPayment(item)}
                onResume={async () => {
                  if (!item.resumeCheckout) return;
                  await checkout(item.resumeCheckout.url, item.resumeCheckout.reference);
                  refreshPayments();
                }}
                onDispute={() => setDisputePayment(item)}
                onConfirmMoveIn={() => confirmMoveIn(item)}
              />
            </View>
          )}
          ListHeaderComponent={
            summary ? (
              <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
                <PaymentsSummaryCard summary={summary} />
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: spacing['3xl'] }}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator
                color={colors.mutedForeground}
                accessibilityLabel="Loading older payments"
                style={{ paddingVertical: spacing.md }}
              />
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => void query.refetch()}
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

function PaymentsSummaryCard({ summary }: { summary: PaymentsSummary }) {
  const { spacing } = useTheme();
  const held =
    summary.totalHeldNaira > 0
      ? `${formatNaira(summary.totalHeldNaira)} of your rent is held by Sureground until it is released to your landlord.`
      : null;

  if (summary.openCount === 0) {
    return (
      <Card elevated>
        <Text variant="bodyStrong">You&apos;re up to date</Text>
        <Text variant="caption" color="mutedForeground">
          Nothing is due right now.{held ? ` ${held}` : ''}
        </Text>
      </Card>
    );
  }

  return (
    <Card elevated>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="caption" color="mutedForeground">
          You owe
        </Text>
        {summary.overdueCount > 0 ? (
          <Badge label={`${summary.overdueCount} overdue`} tone="danger" />
        ) : null}
      </View>
      <Price amount={summary.amountOwedNaira} variant="heading" />
      <Text variant="caption" color="mutedForeground">
        {summary.openCount === 1 ? '1 charge to pay' : `${summary.openCount} charges to pay`}
        {summary.nextDueDate ? ` · next due ${formatDate(summary.nextDueDate, 'short')}` : ''}
      </Text>
      {held ? (
        <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.xs }}>
          {held}
        </Text>
      ) : null}
    </Card>
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
  releaseAction,
}: {
  payment: Payment;
  paying: boolean;
  releasing: boolean;
  releaseAction?: RentReleaseAction;
  onPay: () => void;
  onResume: () => void;
  onDispute: () => void;
  onConfirmMoveIn: () => void;
}) {
  const { colors, spacing } = useTheme();
  const payable = p.status === 'pending' || p.status === 'overdue';
  const releasable = p.status === 'paid' && p.escrowStatus === 'held' && !p.disputeReason;
  // Same rule as web and the API: only rent Sureground is holding can be reported.
  const disputable = p.status === 'paid' && p.escrowStatus === 'held' && !p.disputeReason;
  const left = p.outstanding ?? p.amount - (p.amountPaid ?? 0);

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
        {/* Headline is what is still to pay on an open charge, the same as web. */}
        <View>
          <Price amount={payable ? left : p.amount} variant="heading" />
          {payable && left !== p.amount ? (
            <Text variant="caption" color="mutedForeground">
              left of {formatNaira(p.amount)}
            </Text>
          ) : null}
        </View>
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
        ) : p.status === 'processing' ? (
          // The checkout was left too long ago to resume. Paying again is safe:
          // the API asks Paystack about the earlier one and refuses if it was paid.
          <Button label="Pay again" size="sm" fullWidth={false} loading={paying} onPress={onPay} />
        ) : releasable && releaseAction ? (
          <Button
            label={releaseAction === 'confirm-move-in' ? 'Confirm move-in' : 'Release now'}
            variant={releaseAction === 'confirm-move-in' ? 'primary' : 'outline'}
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

      {p.status === 'paid' && (p.feeNaira !== undefined || p.reference) ? (
        <View style={{ marginTop: spacing.sm, gap: 2 }}>
          {p.feeNaira !== undefined && p.totalChargedNaira !== undefined ? (
            <Text variant="caption" color="mutedForeground">
              {`Charged ${formatNaira(p.totalChargedNaira)}, including a ${formatNaira(p.feeNaira)} card or bank fee`}
            </Text>
          ) : null}
          {p.reference ? (
            <Text variant="caption" color="mutedForeground" selectable>
              {`Reference ${p.reference}`}
            </Text>
          ) : null}
        </View>
      ) : null}

      {releasable ? (
        <Text variant="caption" color="mutedForeground" style={{ marginTop: spacing.sm }}>
          {p.heldAmountNaira ? `${formatNaira(p.heldAmountNaira)} held. ` : ''}
          {releaseAction === 'release-now'
            ? p.releaseDate
              ? `Held under Sureground Payment Protection — releases to your landlord automatically on ${formatDate(p.releaseDate, 'short')}, or now if you choose.`
              : 'Held under Sureground Payment Protection — release it to your landlord when you are ready.'
            : releaseAction === 'confirm-move-in'
              ? p.releaseDate
                ? `Held under Sureground Payment Protection — releases to your landlord automatically on ${formatDate(p.releaseDate, 'short')}, or sooner if you confirm move-in.`
                : 'Held under Sureground Payment Protection — confirm move-in to release it to your landlord.'
              : 'Held under Sureground Payment Protection until you confirm move-in.'}
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
          label="Report a problem"
          tone="muted"
          onPress={onDispute}
          style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }}
        />
      ) : null}
    </Card>
  );
}
