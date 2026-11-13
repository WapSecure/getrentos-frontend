import { lateFeeAfterGrace } from '@sureground/shared';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, CheckCircle2, CircleDashed, FileDown } from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  DetailSkeleton,
  Divider,
  FormAlert,
  Price,
  QueryState,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  deliverability,
  formatBps,
  INSTALLMENT_STATUS,
  landSalesApi,
  PAYMENT_STATUS,
  PAYOUT_STATUS,
  PERFECTION_OWNER,
  PERFECTION_STEP,
  plotName,
  PURCHASE_STATUS,
  refundPreview,
  type Milestone,
  type Perfection,
  type PurchaseDetail,
  type SaleDocument,
} from '@/lib/api/landSales';
import { errorMessage } from '@/lib/api/client';
import { formatDate, formatNaira } from '@/lib/format';
import { PDF_MIME, shareDownloadedFile } from '@/lib/shareFile';
import { Sheet } from '@/components/Sheet';
import { ConditionsList, DeliverForm, MilestoneList } from '@/components/land/Conveyance';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

export default function OwnerLandPurchase() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [delivering, setDelivering] = useState<Milestone | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [downloading, setDownloading] = useState<SaleDocument | null>(null);

  const query = useQuery({
    queryKey: qk.owner.landPurchase(id),
    queryFn: () => landSalesApi.purchase(id),
    enabled: !!id,
  });
  const layouts = useQuery({ queryKey: qk.owner.landLayouts, queryFn: landSalesApi.layouts });
  const d = query.data;
  // A purchase names its layout; the layout says which land, for evidence documents.
  const propertyId =
    d?.propertyId ?? layouts.data?.find((l) => l.id === d?.layoutId)?.propertyId ?? null;

  const apply = (message: string) => (detail: PurchaseDetail) => {
    qc.setQueryData(qk.owner.landPurchase(id), detail);
    qc.invalidateQueries({ queryKey: ['owner', 'land', 'purchases'] });
    qc.invalidateQueries({ queryKey: ['owner', 'land', 'collections'] });
    toast.show(message, 'success');
  };
  const fail = (fallback: string) => (e: unknown) => toast.show(errorMessage(e, fallback), 'error');

  const deliver = useMutation({
    mutationFn: (input: { note?: string; documentId?: string }) =>
      landSalesApi.deliverMilestone(id, delivering!.key, input),
    onSuccess: (detail) => {
      apply(
        `${delivering?.label ?? 'Step'}: marked delivered. The buyer has been asked to confirm.`
      )(detail);
      setDelivering(null);
    },
    onError: fail('Could not mark that step delivered.'),
  });
  const deliverCondition = useMutation({
    mutationFn: ({ key, note }: { key: string; note: string }) =>
      landSalesApi.deliverCondition(id, key, note),
    onSuccess: apply('Condition marked met. The buyer has been asked to confirm it.'),
    onError: fail('Could not mark the condition met.'),
  });
  const perfection = useMutation({
    mutationFn: (v: { key: string; status: 'SUBMITTED' | 'APPROVED'; reference: string }) =>
      landSalesApi.updatePerfection(id, v.key, {
        status: v.status,
        ...(v.reference ? { reference: v.reference } : {}),
      }),
    onSuccess: (detail, v) =>
      apply(v.status === 'SUBMITTED' ? 'Submission recorded.' : 'Approval recorded.')(detail),
    onError: fail('Could not record that.'),
  });

  const download = async (kind: SaleDocument) => {
    if (!d) return;
    setDownloading(kind);
    try {
      const { bytes } = await landSalesApi.document(id, kind);
      await shareDownloadedFile(
        bytes,
        `${d.reference}-${kind}.pdf`,
        PDF_MIME,
        kind === 'contract-of-sale' ? 'Contract of sale' : 'Allocation letter'
      );
    } catch (e) {
      toast.show(errorMessage(e, 'Could not download that document.'), 'error');
    } finally {
      setDownloading(null);
    }
  };

  const status = d
    ? (PURCHASE_STATUS[d.status] ?? { label: d.status, tone: 'neutral' as const })
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Plot sale"
        title={d?.reference ?? 'Purchase'}
        subtitle={d ? `${plotName(d)} · ${d.layoutName} · ${d.buyerName ?? 'Buyer'}` : undefined}
        onBack={() => goBack()}
      />
      <QueryState
        query={query}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl }}>
            <DetailSkeleton />
          </View>
        }
        errorTitle="This purchase could not be loaded"
      >
        {d ? (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: insets.bottom + spacing['3xl'],
              gap: spacing.lg,
            }}
            refreshControl={
              <RefreshControl
                refreshing={query.isRefetching}
                onRefresh={() => void query.refetch()}
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
              {status ? <Badge label={status.label} tone={status.tone} /> : null}
              <Text variant="caption" color="mutedForeground">
                {d.planName}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <Button
                label="Contract of sale"
                size="sm"
                variant="secondary"
                icon={<FileDown size={14} color={colors.foreground} />}
                loading={downloading === 'contract-of-sale'}
                disabled={!!downloading}
                onPress={() => download('contract-of-sale')}
              />
              <Button
                label="Allocation letter"
                size="sm"
                variant="secondary"
                icon={<FileDown size={14} color={colors.foreground} />}
                loading={downloading === 'allocation-letter'}
                disabled={!!downloading || d.status === 'PENDING_DEPOSIT'}
                onPress={() => download('allocation-letter')}
              />
            </View>
            {d.status === 'PENDING_DEPOSIT' ? (
              <Text variant="caption" color="mutedForeground">
                A letter of allocation is issued once the deposit is paid.
              </Text>
            ) : null}

            {d.status === 'DEFAULTED' ? (
              <View style={{ gap: spacing.sm }}>
                <FormAlert
                  tone="error"
                  message={`This purchase defaulted${d.defaultedAt ? ` on ${formatDate(d.defaultedAt)}` : ''}. You can revoke it to put the plot back on sale; the buyer is refunded what they paid less the ${formatBps(d.terms.revocationChargeBps)} forfeiture.`}
                />
                <Button label="Revoke" variant="destructive" onPress={() => setRevoking(true)} />
              </View>
            ) : null}
            {d.status === 'REVOKED' ? (
              <FormAlert
                tone="info"
                message={`Revoked${d.revokedAt ? ` on ${formatDate(d.revokedAt)}` : ''}.${d.revocationReason ? ` ${d.revocationReason}` : ''}${d.refundDue !== undefined ? ` Refund due to the buyer: ${formatNaira(d.refundDue)}.` : ''}`}
              />
            ) : null}

            <Section title="Money">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md }}>
                <Figure label="Plot price" amount={d.plotPrice} />
                <Figure label="Premium + fees" amount={d.priceUplift + d.fees} />
                <Figure label="Total price" amount={d.totalPrice} />
                <Figure label="Paid" amount={d.amountPaid} color="success" />
                <Figure
                  label="Outstanding"
                  amount={d.outstandingBalance}
                  color={d.nextDue?.overdue ? 'destructive' : undefined}
                />
                <Figure label="Released to you" amount={d.releasedToSeller} />
              </View>
              {d.nextDue ? (
                <Text variant="callout" color="mutedForeground">
                  Next: {d.nextDue.label ? `${d.nextDue.label}, ` : ''}
                  {formatNaira(d.nextDue.amount)} {d.nextDue.overdue ? 'overdue since' : 'due'}{' '}
                  {formatDate(d.nextDue.dueDate)}.
                </Text>
              ) : null}
              <Text variant="caption" color="mutedForeground">
                Terms fixed at purchase:{' '}
                {d.terms.durationMonths === 0 ? 'outright' : `${d.terms.durationMonths} months`},{' '}
                {formatBps(d.terms.initialDepositBps)} deposit,{' '}
                {lateFeeAfterGrace(d.terms.lateFeeBps, d.terms.gracePeriodDays)}, default after{' '}
                {d.terms.defaultAfterDays} days.
              </Text>
            </Section>

            {(d.conditions?.length ?? 0) > 0 ? (
              <Section title="Conditions precedent">
                <ConditionsList
                  conditions={d.conditions ?? []}
                  checklist={d.closingChecklist}
                  busyKey={
                    deliverCondition.isPending ? (deliverCondition.variables?.key ?? null) : null
                  }
                  onDeliver={(key, note) => deliverCondition.mutate({ key, note })}
                />
                <Text variant="caption" color="mutedForeground">
                  Nothing is released to you while a condition is open or not met.
                </Text>
              </Section>
            ) : null}

            <Section title="Conveyance">
              <MilestoneList
                milestones={d.milestones}
                deliverability={(m) => deliverability(d.status, m)}
                onDeliver={setDelivering}
                showRelease
              />
            </Section>

            {d.perfection ? (
              <Section title="Title perfection">
                <PerfectionSteps
                  perfection={d.perfection}
                  busyKey={perfection.isPending ? (perfection.variables?.key ?? null) : null}
                  onUpdate={(key, s, reference) => perfection.mutate({ key, status: s, reference })}
                />
              </Section>
            ) : null}

            <Section title="Instalment schedule">
              {d.installments.map((i, n) => {
                const s = INSTALLMENT_STATUS[i.status] ?? INSTALLMENT_STATUS.PENDING;
                return (
                  <View key={i.id} style={{ gap: 2 }}>
                    {n > 0 ? <Divider style={{ marginBottom: spacing.sm }} /> : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <Text variant="callout" style={{ flex: 1, fontWeight: '600' }}>
                        {i.label}
                      </Text>
                      <Badge label={s.label} tone={s.tone} />
                    </View>
                    <Text variant="caption" color="mutedForeground">
                      Due {formatDate(i.dueDate, 'short')} · {formatNaira(i.amount)}
                      {i.lateFee > 0 ? ` + ${formatNaira(i.lateFee)} late fee` : ''} · paid{' '}
                      {formatNaira(i.amountPaid)}
                      {i.paidAt ? ` on ${formatDate(i.paidAt, 'short')}` : ''}
                      {i.outstanding > 0 ? ` · ${formatNaira(i.outstanding)} left` : ''}
                    </Text>
                  </View>
                );
              })}
            </Section>

            <Section title="Payments and releases">
              {d.payments.length === 0 ? (
                <Text variant="callout" color="mutedForeground">
                  No payments yet.
                </Text>
              ) : (
                d.payments.map((p) => {
                  const s = PAYMENT_STATUS[p.status] ?? PAYMENT_STATUS.PENDING;
                  return (
                    <View
                      key={p.id}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                    >
                      <View style={{ flex: 1 }}>
                        <Price amount={p.amount} variant="callout" />
                        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                          {formatDate(p.confirmedAt ?? p.createdAt, 'short')} ·{' '}
                          {p.providerReference}
                          {p.simulated ? ' · test payment' : ''}
                        </Text>
                      </View>
                      <Badge label={s.label} tone={s.tone} />
                    </View>
                  );
                })
              )}
              {d.releases.length ? (
                <>
                  <Text variant="bodyStrong">Released to you</Text>
                  {d.releases.map((r) => {
                    const s = r.payoutStatus ? PAYOUT_STATUS[r.payoutStatus] : null;
                    return (
                      <View
                        key={r.id}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text variant="callout" numberOfLines={2}>
                            {r.reason}
                          </Text>
                          <Text variant="caption" color="mutedForeground">
                            {formatNaira(r.amount)} · released {formatDate(r.createdAt, 'short')}
                            {r.paidAt ? ` · paid ${formatDate(r.paidAt, 'short')}` : ''}
                          </Text>
                        </View>
                        {s ? <Badge label={s.label} tone={s.tone} /> : null}
                      </View>
                    );
                  })}
                </>
              ) : null}
            </Section>
          </ScrollView>
        ) : null}
      </QueryState>

      <Sheet
        open={!!delivering}
        onClose={() => setDelivering(null)}
        title={delivering?.label ?? ''}
      >
        {delivering ? (
          <DeliverForm
            key={delivering.key}
            milestone={delivering}
            propertyId={propertyId}
            saving={deliver.isPending}
            onDeliver={(input) => deliver.mutate(input)}
          />
        ) : null}
      </Sheet>
      <Sheet
        open={revoking}
        onClose={() => setRevoking(false)}
        title={`Revoke ${d?.reference ?? ''}?`}
      >
        {d ? (
          <RevokeForm
            purchase={d}
            onDone={(detail) => {
              setRevoking(false);
              qc.setQueryData(qk.owner.landPurchase(id), detail);
              qc.invalidateQueries({ queryKey: ['owner', 'land'] });
              toast.show(
                'Purchase revoked. The plot is back on sale and the buyer has been told.',
                'success'
              );
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">{title}</Text>
      {children}
    </Card>
  );
}

function Figure({
  label,
  amount,
  color,
}: {
  label: string;
  amount: number;
  color?: 'success' | 'destructive';
}) {
  return (
    <View style={{ width: '50%', gap: 2 }}>
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
      <Price amount={amount} variant="bodyStrong" color={color} />
    </View>
  );
}

function RevokeForm({
  purchase: d,
  onDone,
}: {
  purchase: PurchaseDetail;
  onDone: (detail: PurchaseDetail) => void;
}) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const refund = refundPreview(d.amountPaid, d.installments, d.terms.revocationChargeBps);
  const revoke = useMutation({
    mutationFn: () => landSalesApi.revoke(d.id, reason.trim()),
    onSuccess: onDone,
    onError: (e) => toast.show(errorMessage(e, 'Could not revoke the purchase.'), 'error'),
  });
  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        {plotName(d)} goes back on sale and the contract ends. From{' '}
        {formatNaira(refund.principalPaid)} paid towards the price
        {refund.lateFeesPaid > 0
          ? ` (late fees of ${formatNaira(refund.lateFeesPaid)} are kept)`
          : ''}
        , {formatNaira(refund.charge)} is forfeited ({formatBps(d.terms.revocationChargeBps)}) and
        about {formatNaira(refund.refund)} is refunded to the buyer. This cannot be undone.
      </Text>
      <TextField
        label="Reason for revoking"
        placeholder="Three instalments unpaid despite reminders since March."
        value={reason}
        onChangeText={setReason}
        multiline
        hint="Kept on the purchase record."
        required
      />
      <Button
        label="Revoke purchase"
        variant="destructive"
        loading={revoke.isPending}
        disabled={reason.trim().length < 5 || revoke.isPending}
        onPress={() =>
          Alert.alert('Revoke this purchase?', 'This cannot be undone.', [
            { text: 'Keep it', style: 'cancel' },
            { text: 'Revoke', style: 'destructive', onPress: () => revoke.mutate() },
          ])
        }
      />
    </View>
  );
}

function PerfectionSteps({
  perfection: p,
  busyKey,
  onUpdate,
}: {
  perfection: Perfection;
  busyKey: string | null;
  onUpdate: (key: string, status: 'SUBMITTED' | 'APPROVED', reference: string) => void;
}) {
  const { colors, spacing } = useTheme();
  const [editing, setEditing] = useState<{ key: string; status: 'SUBMITTED' | 'APPROVED' } | null>(
    null
  );
  const [reference, setReference] = useState('');
  const overall =
    p.status === 'PERFECTED'
      ? { label: 'Title perfected', tone: 'success' as const }
      : p.status === 'EXCEPTION'
        ? { label: 'Needs attention', tone: 'danger' as const }
        : { label: 'In progress', tone: 'info' as const };

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: 4 }}>
        <Badge label={overall.label} tone={overall.tone} />
        <Text variant="caption" color="mutedForeground">
          {p.professionalName
            ? `Accountable professional: ${p.professionalName}${p.professionalFirm ? `, ${p.professionalFirm}` : ''}`
            : 'Accountable professional not yet named'}
        </Text>
      </View>
      {p.status === 'PERFECTED' ? (
        <FormAlert
          tone="success"
          message={`Registered${p.perfectedAt ? ` on ${formatDate(p.perfectedAt)}` : ''}: ${p.finalInstrumentReference ?? ''}`}
        />
      ) : null}
      {p.steps.map((step) => {
        const badge = PERFECTION_STEP[step.status];
        const done = step.status === 'APPROVED' || step.status === 'NOT_APPLICABLE';
        const Icon = done ? CheckCircle2 : step.escalationLevel > 0 ? AlertTriangle : CircleDashed;
        const iconColor = done
          ? colors.success
          : step.escalationLevel > 0
            ? colors.warning
            : colors.mutedForeground;
        const facts = [
          PERFECTION_OWNER[step.owner] ?? step.owner,
          !done && step.dueDate ? `due ${formatDate(step.dueDate, 'short')}` : null,
          step.escalationLevel > 0 && !done ? 'late' : null,
          step.submittedAt
            ? `submitted ${formatDate(step.submittedAt, 'short')}${step.submissionReference ? ` (${step.submissionReference})` : ''}`
            : null,
          step.approvedAt
            ? `approved ${formatDate(step.approvedAt, 'short')}${step.approvalReference ? ` (${step.approvalReference})` : ''}`
            : null,
        ].filter(Boolean);
        return (
          <View key={step.key} style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Icon size={16} color={iconColor} style={{ marginTop: 3 }} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="callout" style={{ fontWeight: '600' }}>
                {step.label}
              </Text>
              <Badge label={badge.label} tone={badge.tone} />
              <Text variant="caption" color="mutedForeground">
                {facts.join(' · ')}
              </Text>
              {step.note ? <Text variant="caption">{step.note}</Text> : null}
              {p.status !== 'PERFECTED' && !done ? (
                editing?.key === step.key ? (
                  <View style={{ gap: spacing.sm }}>
                    <TextField
                      placeholder={
                        editing.status === 'SUBMITTED'
                          ? 'File or application number'
                          : 'Approval, instrument or receipt number'
                      }
                      value={reference}
                      onChangeText={setReference}
                      maxLength={200}
                    />
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <Button
                        label="Save"
                        size="sm"
                        loading={busyKey === step.key}
                        disabled={editing.status === 'APPROVED' && !reference.trim()}
                        onPress={() => {
                          onUpdate(step.key, editing.status, reference.trim());
                          setEditing(null);
                          setReference('');
                        }}
                      />
                      <Button
                        label="Cancel"
                        size="sm"
                        variant="ghost"
                        onPress={() => setEditing(null)}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {step.status !== 'SUBMITTED' ? (
                      <Button
                        label="Record submission"
                        size="sm"
                        variant="secondary"
                        onPress={() => setEditing({ key: step.key, status: 'SUBMITTED' })}
                      />
                    ) : null}
                    <Button
                      label="Record approval"
                      size="sm"
                      variant="secondary"
                      onPress={() => setEditing({ key: step.key, status: 'APPROVED' })}
                    />
                  </View>
                )
              ) : null}
            </View>
          </View>
        );
      })}
      {p.status !== 'PERFECTED' && (p.blockers?.length ?? 0) > 0 ? (
        <View style={{ gap: 4 }}>
          <Text variant="caption" color="mutedForeground" style={{ fontWeight: '600' }}>
            STILL TO DO
          </Text>
          {p.blockers!.map((b) => (
            <Text key={b} variant="caption" color="mutedForeground">
              • {b}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
