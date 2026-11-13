import { lateFeeSentence } from '@sureground/shared';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileDown } from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  DetailSkeleton,
  Divider,
  FormAlert,
  Price,
  QueryState,
  SegmentedControl,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  ALLOCATION_ISSUED,
  BUYER_INSTALLMENT_STATUS,
  BUYER_PURCHASE_STATUS,
  buyerRefundPreview,
  CANCELLABLE,
  cancelDescription,
  CONFIRMABLE,
  landBuyerApi,
  nextDueParts,
  PAYABLE,
  plotLabel,
  refundSentence,
  summariseSchedule,
  type BuyerPurchaseDetail,
  type SaleDocument,
} from '@/lib/api/landBuyer';
import { formatBps } from '@/lib/api/landSales';
import { errorMessage } from '@/lib/api/client';
import { formatDate, formatNaira } from '@/lib/format';
import { LAND_PROTECTION } from '@/lib/paymentCopy';
import { PDF_MIME, shareDownloadedFile } from '@/lib/shareFile';
import { Sheet } from '@/components/Sheet';
import { BuyerConditions, BuyerMilestones, HeldNote } from '@/components/land/BuyerConveyance';
import { CoApprovalCard } from '@/components/land/LandRequests';
import { TitlePerfection } from '@/components/land/TitlePerfection';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';
import { PaySheet } from '@/components/payments/PaySheet';
import { useDepositIdentityNotice } from '@/components/purchases/DepositIdentityNotice';
import { usePaymentProviders } from '@/hooks/usePaymentProviders';
import { usePaystackCheckout } from '@/hooks/usePaystackCheckout';
import type { PaymentProvider } from '@/lib/api/paymentStatus';

type Tab = 'schedule' | 'conditions' | 'conveyance' | 'title' | 'statement';

export default function BuyerLandPurchase() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('schedule');
  const [cancelling, setCancelling] = useState(false);
  const q = useQuery({
    queryKey: qk.buyerLand.purchase(id),
    queryFn: () => landBuyerApi.purchase(id),
    enabled: !!id,
  });
  const p = q.data;

  const apply = (message: string) => (detail: BuyerPurchaseDetail) => {
    qc.setQueryData(qk.buyerLand.purchase(id), detail);
    qc.invalidateQueries({ queryKey: qk.buyerLand.all });
    toast.show(message, 'success');
  };
  const fail = (fallback: string) => (e: unknown) => toast.show(errorMessage(e, fallback), 'error');

  const confirm = useMutation({
    mutationFn: (key: string) => landBuyerApi.confirmMilestone(id, key),
    onSuccess: (detail, key) => {
      const still = detail.milestones.find((m) => m.key === key)?.status === 'DELIVERED';
      // Still delivered means two-person approval is holding it for the representative.
      apply(
        still ? 'Your approval is recorded. Waiting for your representative.' : 'Step confirmed.'
      )(detail);
    },
    onError: fail('Could not confirm that step.'),
  });
  const dispute = useMutation({
    mutationFn: ({ key, reason }: { key: string; reason: string }) =>
      landBuyerApi.disputeMilestone(id, key, reason),
    onSuccess: apply('Dispute sent to the developer.'),
    onError: fail('Could not send the dispute.'),
  });
  const settle = useMutation({
    mutationFn: ({ key, how }: { key: string; how: 'confirm' | 'waive' }) =>
      landBuyerApi.settleCondition(id, key, how),
    onSuccess: (detail, { how }) =>
      apply(how === 'confirm' ? 'Condition confirmed.' : 'Condition waived.')(detail),
    onError: fail('Could not update the condition.'),
  });

  const tabs: { value: Tab; label: string }[] = p
    ? [
        { value: 'schedule', label: 'Pay' },
        ...((p.conditions?.length ?? 0) > 0
          ? [{ value: 'conditions' as const, label: 'Conditions' }]
          : []),
        { value: 'conveyance', label: 'Steps' },
        ...(p.perfection ? [{ value: 'title' as const, label: 'Title' }] : []),
        { value: 'statement', label: 'Statement' },
      ]
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="My land"
        title={p ? `${plotLabel(p)} · ${p.layoutName}` : 'Purchase'}
        subtitle={
          p
            ? `${p.reference} · ${p.planName} · started ${formatDate(p.startedAt ?? p.createdAt, 'short')}`
            : undefined
        }
        onBack={() => goBack()}
      />
      <QueryState
        query={q}
        skeleton={<DetailSkeleton />}
        errorTitle="This purchase did not load"
        style={{ paddingHorizontal: spacing.xl }}
      >
        {p ? (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: insets.bottom + spacing['3xl'],
              gap: spacing.lg,
            }}
            refreshControl={
              <RefreshControl
                refreshing={q.isRefetching}
                onRefresh={() => void q.refetch()}
                tintColor={colors.mutedForeground}
              />
            }
          >
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.sm,
                alignItems: 'center',
              }}
            >
              <Badge
                label={BUYER_PURCHASE_STATUS[p.status].label}
                tone={BUYER_PURCHASE_STATUS[p.status].tone}
              />
              {['ACTIVE', 'PAID_IN_FULL', 'COMPLETED'].includes(p.status) ? (
                <Button
                  label="Watch this plot"
                  size="sm"
                  variant="ghost"
                  onPress={() => router.push('/(app)/land-watch')}
                />
              ) : null}
            </View>
            <Banners p={p} />
            <PayNext p={p} onPaid={() => qc.invalidateQueries({ queryKey: qk.buyerLand.all })} />
            <PriceCard p={p} />
            <SegmentedControl
              options={tabs}
              value={tab}
              onChange={setTab}
              accessibilityLabel="Purchase section"
            />
            {tab === 'schedule' ? (
              <Schedule p={p} />
            ) : tab === 'conditions' ? (
              <Card>
                <BuyerConditions
                  conditions={p.conditions ?? []}
                  checklist={p.closingChecklist}
                  busyKey={settle.isPending ? (settle.variables?.key ?? null) : null}
                  onSettle={(key, how) => settle.mutate({ key, how })}
                />
              </Card>
            ) : tab === 'conveyance' ? (
              <View style={{ gap: spacing.md }}>
                <CoApprovalCard deal={{ kind: 'purchase', id }} />
                <HeldNote text="Sureground holds your payments. Each step you confirm releases its share to the developer, never more than you have paid. Confirm in order, and only once you hold the document or have been shown the plot. Allocation, the deed and the survey in your name come after full payment." />
                <Card>
                  <BuyerMilestones
                    milestones={p.milestones}
                    contractOpen={CONFIRMABLE.has(p.status)}
                    showRelease
                    busyKey={
                      confirm.isPending
                        ? (confirm.variables ?? null)
                        : dispute.isPending
                          ? (dispute.variables?.key ?? null)
                          : null
                    }
                    onConfirm={(m) => confirm.mutate(m.key)}
                    onDispute={(m, reason) => dispute.mutate({ key: m.key, reason })}
                  />
                </Card>
              </View>
            ) : tab === 'title' && p.perfection ? (
              <TitlePerfection perfection={p.perfection} />
            ) : (
              <StatementView id={id} />
            )}
            <Documents p={p} />
            {CANCELLABLE.has(p.status) ? (
              <Card style={{ gap: spacing.sm }}>
                <Text variant="bodyStrong">Cancel this purchase</Text>
                <Text variant="callout" color="mutedForeground">
                  {p.canCancelInFull
                    ? `Refund if you cancel now: ${formatNaira(p.amountPaid)}, everything you paid, because a condition was not met.`
                    : (() => {
                        const r = buyerRefundPreview(p);
                        return `Refund if you cancel now: ${formatNaira(r.refund)} after a ${formatNaira(r.charge)} forfeiture. Late fees are not refunded.`;
                      })()}
                </Text>
                <Button
                  label="Cancel this purchase"
                  size="sm"
                  variant="destructive"
                  onPress={() => setCancelling(true)}
                  style={{ alignSelf: 'flex-start' }}
                />
              </Card>
            ) : null}
          </ScrollView>
        ) : null}
      </QueryState>
      <Sheet open={cancelling} onClose={() => setCancelling(false)} title="Cancel this purchase?">
        {p ? <CancelForm p={p} onDone={() => setCancelling(false)} /> : null}
      </Sheet>
    </View>
  );
}

function Banners({ p }: { p: BuyerPurchaseDetail }) {
  if (p.status === 'DEFAULTED') {
    return (
      <FormAlert
        tone="error"
        message={`This purchase is in default because a payment is more than ${p.terms.defaultAfterDays} days late. Pay what is overdue now; the developer may otherwise revoke the contract, refunding what you paid less ${formatBps(p.terms.revocationChargeBps)}.`}
      />
    );
  }
  if (p.canCancelInFull) {
    return (
      <FormAlert
        tone="warning"
        message="A condition of this purchase was not met. You may cancel and receive everything you have paid, with no cancellation charge, or keep the purchase. See Conditions."
      />
    );
  }
  if (p.status === 'CANCELLED' || p.status === 'REVOKED') {
    const why =
      p.status === 'REVOKED'
        ? `The developer revoked this purchase${p.revocationReason ? `: ${p.revocationReason}` : ''}.`
        : 'You cancelled this purchase.';
    return <FormAlert tone="info" message={`${why} ${refundSentence(p, formatNaira)}`} />;
  }
  return null;
}

function PayNext({ p, onPaid }: { p: BuyerPurchaseDetail; onPaid: () => void }) {
  const { spacing } = useTheme();
  const toast = useToast();
  const providers = usePaymentProviders();
  const [providerError, setProviderError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const checkout = usePaystackCheckout();
  const closeSheet = () => {
    setSheetOpen(false);
    setProviderError(null);
  };
  const pay = useMutation({
    mutationFn: (provider?: PaymentProvider) => landBuyerApi.pay(p.id, provider),
    onMutate: () => setProviderError(null),
    onSuccess: async (init) => {
      closeSheet();
      if (init.authorizationUrl) {
        await checkout(init.authorizationUrl, init.reference);
      } else {
        toast.show(`Payment of ${formatNaira(init.amount)} confirmed.`, 'success');
      }
      onPaid();
    },
    onError: (e, provider) => {
      const unavailable = providers.recover(e, provider);
      if (unavailable) setProviderError(unavailable);
      else {
        closeSheet();
        toast.show(errorMessage(e, 'Could not start the payment.'), 'error');
      }
    },
  });
  const payable = PAYABLE.has(p.status) && !!p.nextDue;
  // Only the initial deposit is gated; installments on a plan already under way are not.
  const identityNotice = useDepositIdentityNotice(
    sheetOpen && p.status === 'PENDING_DEPOSIT',
    closeSheet
  );
  return (
    <Card style={{ gap: spacing.sm }}>
      <Text variant="bodyStrong">
        {p.status === 'PENDING_DEPOSIT' ? 'Pay your deposit' : 'Next payment'}
      </Text>
      {payable && p.nextDue ? (
        <>
          <Price amount={p.nextDue.amount} variant="display" />
          <Text variant="caption" color="mutedForeground">
            {p.nextDue.label} · {p.nextDue.overdue ? 'was due' : 'due'}{' '}
            {formatDate(p.nextDue.dueDate)}
            {p.nextDue.overdue ? ' (late fee included)' : ''}
          </Text>
          <Button
            label={`Pay ${formatNaira(p.nextDue.amount)}`}
            loading={pay.isPending}
            disabled={pay.isPending}
            onPress={() => {
              setProviderError(null);
              setSheetOpen(true);
            }}
          />
          <PaySheet
            open={sheetOpen}
            onClose={closeSheet}
            title={p.status === 'PENDING_DEPOSIT' ? 'Pay your deposit' : 'Pay instalment'}
            context={`${p.layoutName}, plot ${p.plotNumber} · ${p.nextDue.label}`}
            dueDate={p.nextDue.dueDate}
            overdue={p.nextDue.overdue}
            owed={p.nextDue.amount}
            amount={p.nextDue.amount}
            itemLabel={p.nextDue.overdue ? 'Land payment (late fee included)' : 'Land payment'}
            itemParts={nextDueParts(p.nextDue, p.installments)}
            receiverLine={`The fee goes to the payment company, so the full ${formatNaira(p.nextDue.amount)} is recorded against your purchase.`}
            protection={LAND_PROTECTION}
            providers={providers}
            providerError={providerError}
            busy={pay.isPending}
            blocked={identityNotice}
            onPay={() => pay.mutate(providers.provider)}
          />
        </>
      ) : (
        <Text variant="callout" color="mutedForeground">
          {p.status === 'PAID_IN_FULL' || p.status === 'COMPLETED'
            ? 'Paid in full. Nothing more is due.'
            : 'Nothing is payable on this purchase.'}
        </Text>
      )}
    </Card>
  );
}

function PriceCard({ p }: { p: BuyerPurchaseDetail }) {
  const { spacing } = useTheme();
  const rows: [string, number, ('success' | 'destructive')?][] = [
    ['Plot price', p.plotPrice],
    ...(p.priceUplift > 0 ? [['Instalment premium', p.priceUplift] as [string, number]] : []),
    ['Documentation fee', p.feeBreakdown.documentationFee],
    ['Survey fee', p.feeBreakdown.surveyFee],
    ['Development levy', p.feeBreakdown.developmentLevy],
    ['Total price', p.totalPrice],
    ['Paid so far', p.amountPaid, 'success'],
    ...(p.lateFeesAccrued > 0
      ? [['Late fees charged', p.lateFeesAccrued, 'destructive'] as [string, number, 'destructive']]
      : []),
    ['Outstanding', p.outstandingBalance],
    ['Released to the developer', p.releasedToSeller],
  ];
  return (
    <Card style={{ gap: spacing.sm }}>
      {rows.map(([label, amount, color]) => (
        <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="callout" color="mutedForeground">
            {label}
          </Text>
          <Price amount={amount} variant="callout" color={color} />
        </View>
      ))}
    </Card>
  );
}

function Schedule({ p }: { p: BuyerPurchaseDetail }) {
  const { colors, spacing, radius } = useTheme();
  const s = summariseSchedule(p.installments, p.nextDue);
  const onlyDeposit = s.rows.length === 1 && s.rows[0].sequence === 0;
  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="callout" style={{ fontWeight: '600' }}>
        {s.paidCount} of {s.total} paid · {s.percentPaid}% of the schedule
      </Text>
      <View
        style={{
          height: 6,
          borderRadius: radius.full,
          backgroundColor: colors.secondary,
          overflow: 'hidden',
        }}
      >
        <View
          style={{ width: `${s.percentPaid}%`, height: '100%', backgroundColor: colors.success }}
        />
      </View>
      {s.overdueCount > 0 ? (
        <FormAlert
          tone="error"
          message={`${s.overdueCount} instalment${s.overdueCount === 1 ? ' is' : 's are'} overdue: ${formatNaira(s.overdueAmount)} including late fees. Pay now to avoid default.`}
        />
      ) : null}
      {s.rows.map((i, n) => {
        const st = BUYER_INSTALLMENT_STATUS[i.status] ?? BUYER_INSTALLMENT_STATUS.PENDING;
        return (
          <View key={i.id} style={{ gap: 2 }}>
            {n > 0 ? <Divider style={{ marginBottom: spacing.sm }} /> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text variant="callout" style={{ flex: 1, fontWeight: '600' }}>
                {i.label}
              </Text>
              {i.id === s.nextInstallmentId ? <Badge label="Next" tone="info" /> : null}
              <Badge label={st.label} tone={st.tone} />
            </View>
            <Text variant="caption" color="mutedForeground">
              Due {formatDate(i.dueDate, 'short')} · {formatNaira(i.amount)}
              {i.lateFee > 0 ? ` + ${formatNaira(i.lateFee)} late fee` : ''}
              {i.outstanding > 0 ? ` · owed ${formatNaira(i.outstanding)}` : ''}
              {i.paidAt ? ` · paid ${formatDate(i.paidAt, 'short')}` : ''}
            </Text>
          </View>
        );
      })}
      {onlyDeposit ? (
        <Text variant="caption" color="mutedForeground">
          The monthly schedule is built when the deposit is paid; the first instalment falls a month
          later.
        </Text>
      ) : null}
      <Text variant="caption" color="mutedForeground">
        {lateFeeSentence(p.terms.lateFeeBps, p.terms.gracePeriodDays)} Default after{' '}
        {p.terms.defaultAfterDays} days overdue.
      </Text>
    </Card>
  );
}

function StatementView({ id }: { id: string }) {
  const { spacing } = useTheme();
  const q = useQuery({
    queryKey: qk.buyerLand.statement(id),
    queryFn: () => landBuyerApi.statement(id),
  });
  const s = q.data;
  const signed = (n: number) => (n < 0 ? `${formatNaira(-n)} credit` : formatNaira(n));
  return (
    <QueryState query={q} skeleton={<DetailSkeleton />}>
      {s ? (
        <Card style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md }}>
            {(
              [
                ['Charged to date', formatNaira(s.totalCharged)],
                ['Paid', formatNaira(s.totalPaid)],
                [s.balance < 0 ? 'Paid ahead' : 'Due now', formatNaira(Math.abs(s.balance))],
                ['Left on contract', formatNaira(s.outstandingBalance)],
              ] as const
            ).map(([label, value]) => (
              <View key={label} style={{ width: '50%', gap: 2 }}>
                <Text variant="caption" color="mutedForeground">
                  {label}
                </Text>
                <Text variant="bodyStrong">{value}</Text>
              </View>
            ))}
          </View>
          {s.entries.length === 0 ? (
            <Text variant="callout" color="mutedForeground">
              Nothing has been charged or paid yet.
            </Text>
          ) : (
            s.entries.map((e, i) => (
              <View key={`${e.date}-${i}`} style={{ gap: 2 }}>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Text variant="callout" style={{ flex: 1 }}>
                    {e.description}
                  </Text>
                  <Text variant="callout" style={{ fontWeight: '600' }}>
                    {e.debit ? formatNaira(e.debit) : `− ${formatNaira(e.credit)}`}
                  </Text>
                </View>
                <Text variant="caption" color="mutedForeground">
                  {formatDate(e.date, 'short')} · balance {signed(e.balance)}
                </Text>
              </View>
            ))
          )}
        </Card>
      ) : null}
    </QueryState>
  );
}

function Documents({ p }: { p: BuyerPurchaseDetail }) {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const [busy, setBusy] = useState<SaleDocument | null>(null);
  const allocation = ALLOCATION_ISSUED.has(p.status);
  const download = async (kind: SaleDocument) => {
    setBusy(kind);
    try {
      const { bytes } = await landBuyerApi.document(p.id, kind);
      await shareDownloadedFile(
        bytes,
        `${p.reference}-${kind}.pdf`,
        PDF_MIME,
        kind === 'contract-of-sale' ? 'Contract of sale' : 'Allocation letter'
      );
    } catch {
      toast.show('Could not download the document.', 'error');
    } finally {
      setBusy(null);
    }
  };
  return (
    <Card style={{ gap: spacing.sm }}>
      <Text variant="bodyStrong">Documents</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Button
          label="Contract of sale"
          size="sm"
          variant="secondary"
          icon={<FileDown size={14} color={colors.foreground} />}
          loading={busy === 'contract-of-sale'}
          disabled={!!busy}
          onPress={() => download('contract-of-sale')}
        />
        <Button
          label="Allocation letter"
          size="sm"
          variant="secondary"
          icon={<FileDown size={14} color={colors.foreground} />}
          loading={busy === 'allocation-letter'}
          disabled={!!busy || !allocation}
          onPress={() => download('allocation-letter')}
        />
      </View>
      {!allocation ? (
        <Text variant="caption" color="mutedForeground">
          {p.status === 'CANCELLED' || p.status === 'REVOKED'
            ? 'Allocation letter not issued: this purchase has ended.'
            : 'The allocation letter is issued once the deposit is paid.'}
        </Text>
      ) : null}
    </Card>
  );
}

function CancelForm({ p, onDone }: { p: BuyerPurchaseDetail; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const cancel = useMutation({
    mutationFn: () => landBuyerApi.cancel(p.id, reason.trim() || undefined),
    onSuccess: (detail) => {
      qc.setQueryData(qk.buyerLand.purchase(p.id), detail);
      qc.invalidateQueries({ queryKey: qk.buyerLand.all });
      toast.show(`Purchase cancelled. ${refundSentence(detail, formatNaira)}`, 'success');
      onDone();
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not cancel the purchase.'), 'error'),
  });
  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        {cancelDescription(p, formatNaira)}
      </Text>
      <TextField
        label="Why are you cancelling? (optional)"
        value={reason}
        onChangeText={setReason}
        multiline
      />
      <Button
        label="Cancel purchase"
        variant="destructive"
        loading={cancel.isPending}
        disabled={cancel.isPending}
        onPress={() =>
          Alert.alert('Cancel this purchase?', 'This cannot be undone.', [
            { text: 'Keep it', style: 'cancel' },
            { text: 'Cancel purchase', style: 'destructive', onPress: () => cancel.mutate() },
          ])
        }
      />
    </View>
  );
}
