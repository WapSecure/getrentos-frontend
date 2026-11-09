import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { depositHolderText, noDeductionsText } from '@sureground/shared';
import { CircleCheck, FileCheck2, PiggyBank, Scale, ShieldCheck } from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  Divider,
  ListSkeleton,
  Price,
  QueryState,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  DEDUCTION_STATUS,
  depositBack,
  renterHomeApi,
  sortDeposits,
  type TenantDeduction,
  type TenantDeposit,
  type DepositPlan,
} from '@/lib/api/renterHome';
import { errorMessage } from '@/lib/api/client';
import { formatDate, formatNaira } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/** The deposit is not returned until the owner has answered any dispute. */
export default function RenterDeposit() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const q = useQuery({ queryKey: qk.renter.deposits, queryFn: renterHomeApi.deposits });
  // Hidden if it fails: the deposit itself is shown either way.
  const plans = useQuery({
    queryKey: qk.renter.depositPlan,
    queryFn: renterHomeApi.depositPlans,
    staleTime: 5 * 60_000,
    retry: false,
  });
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Your home"
        title="Your deposit"
        subtitle="Who holds it, and anything taken from it"
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.md,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={q.isRefetching}
            onRefresh={() => void q.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <QueryState
          query={q}
          skeleton={<ListSkeleton rows={2} variant="card" height={160} />}
          isEmpty={(q.data ?? []).length === 0}
          empty={{
            icon: <PiggyBank size={32} color={colors.mutedForeground} />,
            title: 'No deposit on record',
            description: 'When a lease sets a deposit, it shows here.',
          }}
        >
          {sortDeposits(q.data ?? []).map((d) => (
            <DepositCard
              key={d.leaseId}
              deposit={d}
              plan={plans.data?.plans.find((p) => p.leaseId === d.leaseId)}
              disclaimer={plans.data?.disclaimer ?? ''}
            />
          ))}
        </QueryState>
      </ScrollView>
    </View>
  );
}

function DepositCard({
  deposit: d,
  plan,
  disclaimer,
}: {
  deposit: TenantDeposit;
  plan?: DepositPlan;
  disclaimer: string;
}) {
  const { colors, spacing } = useTheme();
  const hold = d.hold;
  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{d.propertyTitle}</Text>
          <Text variant="caption" color="mutedForeground">
            {d.unitName}
          </Text>
        </View>
        {hold ? (
          <Badge
            label={hold.status === 'RETURNED' ? 'Returned' : 'Held'}
            tone={hold.status === 'RETURNED' ? 'neutral' : 'success'}
          />
        ) : null}
      </View>

      {!hold ? (
        <View style={{ gap: spacing.xs }}>
          <Text variant="callout" color="mutedForeground">
            Your lease sets a deposit of {formatNaira(d.agreedAmount)}, but it is not recorded as
            held yet.
          </Text>
          {d.paidThroughSureground?.paid ? (
            <Text variant="callout" color="mutedForeground">
              You paid it through Sureground
              {d.paidThroughSureground.paidDate
                ? ` on ${formatDate(d.paidThroughSureground.paidDate, 'short')}`
                : ''}
              .
            </Text>
          ) : null}
          <Text variant="caption" color="mutedForeground">
            If you paid it directly, ask your landlord or manager to record it.
          </Text>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Figure label="Deposit" amount={hold.amount} />
            <Figure label="Deducted" amount={hold.summary.approvedDeductions} />
            <Figure
              label={hold.status === 'RETURNED' ? 'Returned' : 'Due back'}
              amount={depositBack(hold)}
            />
          </View>
          {hold.summary.proposedDeductions > 0 && hold.status !== 'RETURNED' ? (
            <Text variant="caption" color="mutedForeground">
              {formatNaira(hold.summary.proposedDeductions)} more is proposed but not agreed, so it
              is not counted yet.
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <ShieldCheck size={14} color={colors.success} style={{ marginTop: 2 }} />
            <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
              {depositHolderText(hold)}
            </Text>
          </View>
          <Text variant="caption" color="mutedForeground">
            Recorded {formatDate(hold.takenAt, 'short')}
            {hold.returnedAt ? ` · returned ${formatDate(hold.returnedAt, 'short')}` : ''}
          </Text>

          <Text variant="callout" style={{ fontWeight: '600', marginTop: spacing.xs }}>
            Deductions
          </Text>
          {hold.deductions.length === 0 ? (
            <Text variant="callout" color="mutedForeground">
              {noDeductionsText(hold.status === 'RETURNED')}
            </Text>
          ) : (
            hold.deductions.map((x) => (
              <Deduction
                key={x.id}
                d={x}
                suggestion={plan?.disputes.find((g) => g.deductionId === x.id)}
              />
            ))
          )}
        </>
      )}
      {plan ? <DepositPlanBlock plan={plan} disclaimer={disclaimer} /> : null}
    </Card>
  );
}

function DepositPlanBlock({ plan, disclaimer }: { plan: DepositPlan; disclaimer: string }) {
  const { colors, spacing } = useTheme();
  const ICON = { do: CircleCheck, keep: FileCheck2, dispute: Scale } as const;
  return (
    <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
      <Divider />
      <Text variant="callout" style={{ fontWeight: '600' }}>
        Getting it back
      </Text>
      <Text variant="callout">{plan.overview}</Text>
      {plan.steps.map((st) => {
        const Icon = ICON[st.kind];
        return (
          <View key={st.text} style={{ flexDirection: 'row', gap: spacing.xs }}>
            <Icon size={16} color={colors.primary} style={{ marginTop: 2 }} />
            <Text variant="caption" style={{ flex: 1 }}>
              {st.text}
            </Text>
          </View>
        );
      })}
      <Text variant="caption" color="mutedForeground">
        {disclaimer}
      </Text>
    </View>
  );
}

function Figure({ label, amount }: { label: string; amount: number }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
      <Price amount={amount} variant="bodyStrong" />
    </View>
  );
}

function Deduction({
  d,
  suggestion,
}: {
  d: TenantDeduction;
  suggestion?: DepositPlan['disputes'][number];
}) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const dispute = useMutation({
    mutationFn: () => renterHomeApi.disputeDeduction(d.id, reason.trim()),
    onSuccess: () => {
      setOpen(false);
      setReason('');
      qc.invalidateQueries({ queryKey: qk.renter.deposits });
      toast.show(
        'Dispute sent. The owner has to answer before your deposit is returned.',
        'success'
      );
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not send your dispute.'), 'error'),
  });
  const status = DEDUCTION_STATUS[d.status];
  return (
    <View style={{ gap: spacing.xs }}>
      <Divider style={{ marginBottom: spacing.xs }} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text variant="callout" style={{ fontWeight: '600' }}>
            {formatNaira(d.amount)} · {d.reason}
          </Text>
          <Text variant="caption" color="mutedForeground">
            {formatDate(d.createdAt, 'short')}
            {d.fromInspection ? ' · from the move-out inspection' : ''}
          </Text>
        </View>
        <Badge label={status.label} tone={status.tone} />
      </View>
      {d.decisionNote && d.status === 'REJECTED' && !d.disputeAnswer ? (
        <Text variant="caption" color="mutedForeground">
          Why it was dropped: {d.decisionNote}
        </Text>
      ) : null}
      {d.disputedAt ? (
        <View
          style={{
            backgroundColor: colors.secondary,
            borderRadius: radius.md,
            padding: spacing.sm,
            gap: 2,
          }}
        >
          <Text variant="caption">You disputed this: {d.disputeReason}</Text>
          <Text variant="caption" color="mutedForeground">
            {d.disputeAnswer
              ? `Owner’s answer: ${d.disputeAnswer}`
              : 'Waiting for the owner’s answer. Your deposit cannot be returned until they answer.'}
          </Text>
        </View>
      ) : null}
      {d.canDispute ? (
        open ? (
          <View style={{ gap: spacing.sm }}>
            <TextField
              label="Why you disagree"
              placeholder="For example, the damage was there when you moved in"
              value={reason}
              onChangeText={setReason}
              multiline
              maxLength={2000}
              hint="At least 10 characters."
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                label="Send dispute"
                size="sm"
                loading={dispute.isPending}
                disabled={reason.trim().length < 10 || dispute.isPending}
                onPress={() => dispute.mutate()}
              />
              <Button label="Back" size="sm" variant="ghost" onPress={() => setOpen(false)} />
            </View>
          </View>
        ) : (
          <View style={{ gap: 2 }}>
            {suggestion?.grounds.map((g) => (
              <Text key={g} variant="caption" color="mutedForeground">
                • {g}
              </Text>
            ))}
            <Button
              label={suggestion ? 'Dispute this (reason drafted)' : 'Dispute this'}
              size="sm"
              variant="ghost"
              onPress={() => {
                if (suggestion && !reason) setReason(suggestion.draft);
                setOpen(true);
              }}
              style={{ alignSelf: 'flex-start' }}
            />
          </View>
        )
      ) : null}
    </View>
  );
}
