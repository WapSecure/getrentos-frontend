import { usePaystackCheckout } from '@/hooks/usePaystackCheckout';
import { useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown, ChevronUp, Lock, ShieldAlert, Wallet } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  LinkButton,
  Price,
  QueryState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  buyerTransactionsApi,
  BUYER_ESCROW_STATUS_LABEL,
  BUYER_ESCROW_STATUS_TONE,
  type BuyerEscrowStatus,
  type BuyerTransaction,
} from '@/lib/api/buyerTransactions';
import { formatDate, formatNaira } from '@/lib/format';
import { SALE_DEPOSIT_PROTECTION } from '@/lib/paymentCopy';
import { errorMessage } from '@/lib/api/client';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';
import { PaySheet } from '@/components/payments/PaySheet';
import { usePaymentProviders } from '@/hooks/usePaymentProviders';
import type { PaymentProvider } from '@/lib/api/paymentStatus';

/**
 * The happy path, in order — the live stages the backend actually drives:
 * deposit → held → released. (VERIFICATION_PENDING / SETTLEMENT_PENDING exist in
 * the enum but no transaction is ever moved into them, so they are not shown.)
 * Mirrors the web stepper.
 */
const STAGES: { key: BuyerEscrowStatus; label: string; description: string }[] = [
  {
    key: 'deposit_pending',
    label: 'Deposit',
    description: 'Pay your deposit to Sureground, which holds it safely until you confirm receipt.',
  },
  {
    key: 'funds_held',
    label: 'Funds held',
    description:
      'Your payment is held safely by Sureground. Once you have received the property and its documents, confirm receipt to release the funds to the seller.',
  },
  {
    key: 'released',
    label: 'Completed',
    description: 'Funds released and ownership transfer completed.',
  },
];

type Filter = 'all' | 'active' | 'released' | 'attention';
const FILTERS: { value: Filter; label: string; match: (s: BuyerEscrowStatus) => boolean }[] = [
  { value: 'all', label: 'All', match: () => true },
  {
    value: 'active',
    label: 'In progress',
    match: (s) => ['deposit_pending', 'funds_held'].includes(s),
  },
  {
    value: 'attention',
    label: 'Frozen (dispute)',
    match: (s) => s === 'frozen',
  },
  { value: 'released', label: 'Completed', match: (s) => s === 'released' || s === 'refunded' },
];

const ACTOR_LABEL: Record<string, string> = {
  buyer: 'You',
  owner: 'Seller',
  system: 'Sureground',
  compliance: 'Compliance',
};

export default function BuyerTransactions() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const checkout = usePaystackCheckout();
  const [filter, setFilter] = useState<Filter>('all');

  const query = useQuery({
    queryKey: qk.buyer.transactions(1, 50),
    queryFn: () => buyerTransactionsApi.list(1, 50),
  });
  const all = useMemo(() => query.data?.items ?? [], [query.data]);
  const matcher = FILTERS.find((f) => f.value === filter)!.match;
  const items = useMemo(() => all.filter((t) => matcher(t.escrowStatus)), [all, matcher]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['buyer', 'transactions'] });
  const fail = (fallback: string) => (err: unknown) =>
    toast.show(errorMessage(err, fallback), 'error');

  // Which company takes the deposit (Paystack or Monnify).
  const providers = usePaymentProviders();
  // The purchase in the pay sheet; kept while the sheet slides away.
  const [payTx, setPayTx] = useState<BuyerTransaction | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  const closeSheet = () => {
    setSheetOpen(false);
    setProviderError(null);
  };
  const depositMutation = useMutation({
    mutationFn: ({ id, provider }: { id: string; provider?: PaymentProvider }) =>
      buyerTransactionsApi.deposit(id, provider),
    onMutate: () => setProviderError(null),
    onSuccess: async (tx) => {
      closeSheet();
      if (tx.authorizationUrl) await checkout(tx.authorizationUrl, tx.reference);
      else if (tx.escrowStatus === 'funds_held')
        toast.show(`Paid.${tx.reference ? ` Reference ${tx.reference}.` : ''}`, 'success');
      else toast.show('We’re confirming your deposit. This purchase shows when it’s paid.', 'info');
      invalidate();
    },
    onError: (err, { provider }) => {
      // That company cannot take it right now: say so in the sheet, with the other one picked.
      const unavailable = providers.recover(err, provider);
      if (unavailable) {
        setProviderError(unavailable);
        return;
      }
      closeSheet();
      toast.show(errorMessage(err, 'Could not start this deposit.'), 'error');
    },
  });

  const releaseMutation = useMutation({
    mutationFn: (id: string) => buyerTransactionsApi.release(id),
    onSuccess: () => {
      invalidate();
      toast.show('Funds released to the seller.', 'success');
    },
    onError: fail('Could not release these funds.'),
  });

  const refundMutation = useMutation({
    mutationFn: (id: string) => buyerTransactionsApi.refund(id),
    onSuccess: () => {
      invalidate();
      toast.show('Refund requested.', 'success');
    },
    onError: fail('Could not request a refund.'),
  });

  // Releasing pays the seller and cannot be undone: always ask first.
  const confirmRelease = (tx: BuyerTransaction) =>
    Alert.alert(
      'Release funds to the seller?',
      `This pays the seller for ${tx.propertyTitle} and completes the purchase. It can't be undone.`,
      [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Release funds', onPress: () => releaseMutation.mutate(tx.id) },
      ]
    );

  const confirmRefund = (tx: BuyerTransaction) =>
    Alert.alert('Request a refund?', `We'll ask for your deposit on ${tx.propertyTitle} back.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Request refund', style: 'destructive', onPress: () => refundMutation.mutate(tx.id) },
    ]);

  // Only the card being acted on shows a spinner.
  const busy = (m: { isPending: boolean; variables?: string }, id: string) =>
    m.isPending && m.variables === id;

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
          gap: spacing.md,
        }}
      >
        <DetailHeader
          eyebrow="Buyer finance"
          title="Transactions"
          subtitle="Deposits, payment protection and completion"
          onBack={() => goBack()}
        />
        {all.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -spacing.xl }}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}
          >
            {FILTERS.map((f) => (
              <Chip
                key={f.value}
                size="sm"
                label={f.label}
                count={all.filter((t) => f.match(t.escrowStatus)).length}
                selected={filter === f.value}
                onPress={() => setFilter(f.value)}
              />
            ))}
          </ScrollView>
        ) : null}
      </View>

      <View style={{ flex: 1 }}>
        <QueryState
          query={query}
          skeleton={
            <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
              {[0, 1].map((i) => (
                <Skeleton key={i} height={220} radius={radius.lg} />
              ))}
            </View>
          }
        >
          <FlashList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: BuyerTransaction }) => (
              <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
                <TransactionCard
                  tx={item}
                  depositing={
                    depositMutation.isPending && depositMutation.variables?.id === item.id
                  }
                  releasing={busy(releaseMutation, item.id)}
                  refunding={busy(refundMutation, item.id)}
                  onDeposit={() => {
                    setPayTx(item);
                    setProviderError(null);
                    setSheetOpen(true);
                  }}
                  onRelease={() => confirmRelease(item)}
                  onRefund={() => confirmRefund(item)}
                />
              </View>
            )}
            contentContainerStyle={{
              paddingTop: spacing.sm,
              paddingBottom: insets.bottom + spacing['3xl'],
            }}
            refreshControl={refresh}
            ListEmptyComponent={
              <EmptyState
                icon={<Wallet size={34} color={colors.mutedForeground} />}
                title={all.length ? 'Nothing here' : 'No transactions yet'}
                description={
                  all.length
                    ? 'No transactions match this filter.'
                    : 'Once an offer is accepted, its payment progress will appear here.'
                }
                action={
                  all.length ? (
                    <Button label="Show all" variant="outline" onPress={() => setFilter('all')} />
                  ) : undefined
                }
              />
            }
          />
        </QueryState>
      </View>
      <PaySheet
        open={sheetOpen && !!payTx}
        onClose={closeSheet}
        title="Pay deposit"
        context={payTx ? `${payTx.propertyTitle} · Seller: ${payTx.ownerName}` : null}
        owed={payTx ? (payTx.depositAmount ?? payTx.purchasePrice) : 0}
        owedLabel="to pay"
        amount={payTx ? (payTx.depositAmount ?? payTx.purchasePrice) : 0}
        itemLabel="Deposit"
        receiverLine={`The fee goes to the payment company, so the full ${formatNaira(payTx ? (payTx.depositAmount ?? payTx.purchasePrice) : 0)} is held for the seller.`}
        protection={SALE_DEPOSIT_PROTECTION}
        providers={providers}
        providerError={providerError}
        busy={depositMutation.isPending}
        onPay={() =>
          payTx && depositMutation.mutate({ id: payTx.id, provider: providers.provider })
        }
      />
    </View>
  );
}

/* ------------------------------ transaction ------------------------------ */

function TransactionCard({
  tx,
  depositing,
  releasing,
  refunding,
  onDeposit,
  onRelease,
  onRefund,
}: {
  tx: BuyerTransaction;
  depositing: boolean;
  releasing: boolean;
  refunding: boolean;
  onDeposit: () => void;
  onRelease: () => void;
  onRefund: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const [showLog, setShowLog] = useState(false);
  const frozen = tx.escrowStatus === 'frozen';
  const log = tx.activityLog ?? [];

  return (
    <Card elevated style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {tx.propertyTitle}
          </Text>
          <Text variant="caption" color="mutedForeground">
            Seller: {tx.ownerName} · {formatDate(tx.createdAt, 'short')}
          </Text>
        </View>
        <Badge
          label={BUYER_ESCROW_STATUS_LABEL[tx.escrowStatus]}
          tone={BUYER_ESCROW_STATUS_TONE[tx.escrowStatus]}
        />
      </View>

      <Price amount={tx.purchasePrice} variant="heading" />

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
          <ShieldAlert size={18} color={colors.destructive} style={{ marginTop: 1 }} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="callout" style={{ color: colors.destructive, fontWeight: '700' }}>
              Payment on hold: dispute open
            </Text>
            <Text variant="caption" color="mutedForeground">
              {tx.disputeReason ||
                'A dispute has been raised on this purchase. Your money stays held until it is resolved.'}
            </Text>
          </View>
        </View>
      ) : tx.escrowStatus === 'refunded' ? (
        <Text variant="callout" color="mutedForeground">
          Your deposit was refunded and this purchase is closed.
        </Text>
      ) : (
        <StageTimeline status={tx.escrowStatus} />
      )}

      {tx.escrowStatus === 'deposit_pending' || tx.escrowStatus === 'funds_held' ? (
        <View style={{ gap: spacing.sm }}>
          {tx.escrowStatus === 'deposit_pending' ? (
            <>
              <Button label="Pay deposit" loading={depositing} onPress={onDeposit} />
            </>
          ) : null}
          {tx.escrowStatus === 'funds_held' ? (
            <>
              <Button
                label="Confirm receipt & release to seller"
                loading={releasing}
                onPress={onRelease}
              />
              <Button
                label="Request refund"
                variant="outline"
                loading={refunding}
                onPress={onRefund}
              />
            </>
          ) : null}
        </View>
      ) : null}

      {tx.propertyType === 'LAND' ? (
        <LinkButton
          label="Land conveyance: confirm the deed, survey and possession"
          onPress={() => router.push(`/(app)/buyer-land-resale/${tx.id}`)}
        />
      ) : null}

      <Divider />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <LinkButton label="Message seller" onPress={() => router.push('/(app)/(buyer)/messages')} />
        {log.length ? (
          <Pressable
            onPress={() => setShowLog((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showLog }}
            accessibilityLabel={`${showLog ? 'Hide' : 'Show'} activity, ${log.length} ${log.length === 1 ? 'event' : 'events'}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 }}
          >
            <Text variant="callout" color="mutedForeground" style={{ fontWeight: '600' }}>
              Activity ({log.length})
            </Text>
            {showLog ? (
              <ChevronUp size={16} color={colors.mutedForeground} />
            ) : (
              <ChevronDown size={16} color={colors.mutedForeground} />
            )}
          </Pressable>
        ) : null}
      </View>

      {showLog ? (
        <View style={{ gap: spacing.sm }}>
          {log.map((entry) => (
            <View
              key={entry.id}
              accessible
              accessibilityLabel={`${ACTOR_LABEL[entry.actor] ?? entry.actor}: ${entry.action}, ${formatDate(entry.timestamp, 'short')}`}
              style={{ flexDirection: 'row', gap: spacing.sm }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  marginTop: 7,
                  backgroundColor: colors.primary,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text variant="callout">{entry.action}</Text>
                <Text variant="caption" color="mutedForeground">
                  {ACTOR_LABEL[entry.actor] ?? entry.actor} · {formatDate(entry.timestamp, 'short')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

/** Where the purchase is in escrow: done, current (with what happens now), or still ahead. */
function StageTimeline({ status }: { status: BuyerEscrowStatus }) {
  const { colors, spacing } = useTheme();
  const current = STAGES.findIndex((s) => s.key === status);

  return (
    <View
      accessible
      accessibilityLabel={`Payment stage ${current + 1} of ${STAGES.length}: ${STAGES[current]?.label}. ${STAGES[current]?.description}`}
      style={{ gap: 0 }}
    >
      {STAGES.map((stage, i) => {
        const done = i < current || status === 'released';
        const active = i === current && status !== 'released';
        const last = i === STAGES.length - 1;
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
                  borderWidth: active || done ? 0 : 1,
                  borderColor: colors.border,
                }}
              >
                {done ? (
                  <Check size={13} color={colors.primaryForeground} strokeWidth={3} />
                ) : active ? (
                  <Lock size={11} color={colors.primaryForeground} />
                ) : null}
              </View>
              {!last ? (
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
            <View style={{ flex: 1, paddingBottom: last ? 0 : spacing.sm }}>
              <Text
                variant="callout"
                color={done || active ? 'foreground' : 'mutedForeground'}
                style={{ fontWeight: active ? '700' : '500' }}
              >
                {stage.label}
              </Text>
              {active ? (
                <Text variant="caption" color="mutedForeground">
                  {stage.description}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
