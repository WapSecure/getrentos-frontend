import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Plus, Undo2, X } from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  DetailSkeleton,
  FormAlert,
  NumberField,
  Price,
  QueryState,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  DEDUCTION_STATUS_LABEL,
  DEDUCTION_STATUS_TONE,
  DEPOSIT_STATUS_LABEL,
  DEPOSIT_STATUS_TONE,
  disputeOpen,
  managementApi,
  returnBlocker,
  type DepositDeduction,
} from '@/lib/api/management';
import { errorMessage } from '@/lib/api/client';
import { formatDate, formatNaira } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

export default function DepositDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const query = useQuery({
    queryKey: qk.management.deposit(id),
    queryFn: () => managementApi.deposit(id),
    enabled: !!id,
  });
  const afterChange = () => qc.invalidateQueries({ queryKey: ['management', 'deposits'] });

  const deduct = useMutation({
    mutationFn: () =>
      managementApi.proposeDeduction(id, { amount: Number(amount), reason: reason.trim() }),
    onSuccess: () => {
      setAmount('');
      setReason('');
      afterChange();
      toast.show('Deduction recorded.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not record the deduction.'), 'error'),
  });
  const giveBack = useMutation({
    mutationFn: () => managementApi.returnDeposit(id),
    onSuccess: () => {
      afterChange();
      toast.show('Deposit returned.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not return the deposit.'), 'error'),
  });

  const d = query.data;
  const open = d ? d.status !== 'RETURNED' : false;
  const blocker = d ? returnBlocker(d) : null;

  const confirmReturn = () => {
    if (!d) return;
    Alert.alert(
      'Return the deposit?',
      `${formatNaira(d.summary.returnable)} goes back to the tenant. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Return', onPress: () => giveBack.mutate() },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Deposit"
        title={d?.propertyTitle ?? 'Deposit'}
        subtitle={d ? `Taken ${formatDate(d.takenAt, 'short')}` : undefined}
        onBack={() => goBack()}
      />
      <QueryState
        query={query}
        skeleton={<DetailSkeleton />}
        errorTitle="This deposit did not load"
        style={{ paddingHorizontal: spacing.xl }}
      >
        {d ? (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: insets.bottom + spacing['3xl'],
              gap: spacing.lg,
            }}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={query.isRefetching}
                onRefresh={() => void query.refetch()}
                tintColor={colors.mutedForeground}
              />
            }
          >
            <View style={{ flexDirection: 'row' }}>
              <Badge label={DEPOSIT_STATUS_LABEL[d.status]} tone={DEPOSIT_STATUS_TONE[d.status]} />
            </View>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                backgroundColor: colors.secondary,
                borderRadius: radius.md,
                padding: spacing.lg,
                rowGap: spacing.md,
              }}
            >
              {[
                { label: 'Held', value: d.summary.held },
                { label: 'Approved', value: d.summary.approvedDeductions },
                { label: 'Proposed', value: d.summary.proposedDeductions },
                { label: 'Returnable', value: d.summary.returnable },
              ].map((s) => (
                <View key={s.label} style={{ width: '50%' }}>
                  <Text variant="caption" color="mutedForeground">
                    {s.label}
                  </Text>
                  <Price amount={s.value} variant="bodyStrong" />
                </View>
              ))}
            </View>

            {d.returnedAt && d.returnedAmount != null ? (
              <FormAlert
                tone="success"
                message={`${formatNaira(d.returnedAmount)} returned to the tenant on ${formatDate(d.returnedAt)}.`}
              />
            ) : null}

            <Text variant="bodyStrong" accessibilityRole="header">
              Deductions
            </Text>
            {d.deductions.length === 0 ? (
              <Text variant="callout" color="mutedForeground">
                No deductions.
              </Text>
            ) : (
              d.deductions.map((x) => (
                <DeductionCard key={x.id} depositId={d.id} deduction={x} open={open} />
              ))
            )}

            {open ? (
              <Card padding={spacing.lg} style={{ gap: spacing.md }}>
                <Text variant="bodyStrong" accessibilityRole="header">
                  Record a deduction
                </Text>
                <NumberField
                  currency
                  label="Amount"
                  value={amount}
                  onValueChange={setAmount}
                  editable={!deduct.isPending}
                />
                <TextField
                  label="Reason"
                  placeholder="e.g. repaint, cleaning"
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  editable={!deduct.isPending}
                />
                <Button
                  label="Add deduction"
                  variant="secondary"
                  icon={<Plus size={14} color={colors.secondaryForeground} />}
                  loading={deduct.isPending}
                  disabled={!(Number(amount) > 0) || !reason.trim() || deduct.isPending}
                  onPress={() => deduct.mutate()}
                />
              </Card>
            ) : null}

            {open ? (
              <View style={{ gap: spacing.sm }}>
                <Button
                  label="Return deposit"
                  icon={<Undo2 size={16} color={colors.primaryForeground} />}
                  loading={giveBack.isPending}
                  loadingLabel="Returning…"
                  disabled={!!blocker || giveBack.isPending}
                  onPress={confirmReturn}
                />
                {blocker ? (
                  <Text variant="caption" color="mutedForeground" center>
                    {blocker}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </ScrollView>
        ) : null}
      </QueryState>
    </View>
  );
}

function DeductionCard({
  depositId,
  deduction: x,
  open,
}: {
  depositId: string;
  deduction: DepositDeduction;
  open: boolean;
}) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [mode, setMode] = useState<'idle' | 'reject'>('idle');
  const [text, setText] = useState('');
  const disputed = disputeOpen(x);

  const done = (msg: string) => {
    setMode('idle');
    setText('');
    qc.invalidateQueries({ queryKey: ['management', 'deposits'] });
    toast.show(msg, 'success');
  };
  const fail = (e: unknown) => toast.show(errorMessage(e, 'That did not go through.'), 'error');

  const approve = useMutation({
    mutationFn: () => managementApi.approveDeduction(depositId, x.id, text.trim() || undefined),
    onSuccess: () => done('Deduction approved.'),
    onError: fail,
  });
  const reject = useMutation({
    mutationFn: () => managementApi.rejectDeduction(depositId, x.id, text.trim()),
    onSuccess: () => done('Deduction rejected.'),
    onError: fail,
  });
  const answer = useMutation({
    mutationFn: (withdraw: boolean) =>
      managementApi.answerDispute(depositId, x.id, { answer: text.trim(), withdraw }),
    onSuccess: (_r, withdraw) => done(withdraw ? 'Deduction dropped.' : 'Deduction kept.'),
    onError: fail,
  });
  const busy = approve.isPending || reject.isPending || answer.isPending;

  return (
    <Card padding={spacing.lg} style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Price amount={x.amount} variant="bodyStrong" />
        <View style={{ flex: 1 }} />
        {disputed ? <Badge label="Disputed" tone="danger" /> : null}
        <Badge label={DEDUCTION_STATUS_LABEL[x.status]} tone={DEDUCTION_STATUS_TONE[x.status]} />
      </View>
      <Text variant="callout" color="mutedForeground">
        {x.reason}
      </Text>
      {x.decisionNote ? (
        <Text variant="caption" color="mutedForeground">
          {x.status === 'REJECTED' ? 'Rejected' : 'Note'}: {x.decisionNote}
        </Text>
      ) : null}
      {x.tenantDisputedAt ? (
        <View
          style={{
            backgroundColor: colors.secondary,
            borderRadius: radius.sm,
            padding: spacing.md,
            gap: 4,
          }}
        >
          <Text variant="callout">
            <Text variant="callout" style={{ fontWeight: '700' }}>
              Tenant disputes this:
            </Text>{' '}
            {x.tenantDisputeReason}
          </Text>
          {x.disputeAnswer ? (
            <Text variant="caption" color="mutedForeground">
              Your answer: {x.disputeAnswer}
            </Text>
          ) : null}
        </View>
      ) : null}

      {open && x.status === 'PROPOSED' ? (
        <View style={{ gap: spacing.sm }}>
          {mode === 'reject' || disputed ? (
            <TextField
              label={
                mode === 'reject' ? 'Reason for rejecting' : 'Answer the tenant (needed to approve)'
              }
              value={text}
              onChangeText={setText}
              multiline
              editable={!busy}
            />
          ) : (
            <TextField
              label="Note (optional)"
              value={text}
              onChangeText={setText}
              editable={!busy}
            />
          )}
          {mode === 'reject' ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                label="Confirm reject"
                variant="destructive"
                size="sm"
                loading={reject.isPending}
                disabled={!text.trim() || busy}
                onPress={() => reject.mutate()}
                style={{ flex: 1 }}
              />
              <Button
                label="Cancel"
                variant="ghost"
                size="sm"
                disabled={busy}
                onPress={() => setMode('idle')}
              />
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                label="Approve"
                variant="secondary"
                size="sm"
                icon={<Check size={14} color={colors.secondaryForeground} />}
                loading={approve.isPending}
                disabled={(disputed && text.trim().length < 10) || busy}
                onPress={() => approve.mutate()}
                style={{ flex: 1 }}
              />
              <Button
                label="Reject"
                variant="ghost"
                size="sm"
                icon={<X size={14} color={colors.foreground} />}
                disabled={busy}
                onPress={() => {
                  setText('');
                  setMode('reject');
                }}
              />
            </View>
          )}
        </View>
      ) : null}

      {open && x.status === 'APPROVED' && disputed ? (
        <View style={{ gap: spacing.sm }}>
          <TextField
            label="Answer the tenant"
            placeholder="Why it stands, or that you are dropping it"
            value={text}
            onChangeText={setText}
            multiline
            editable={!busy}
            hint="At least 10 characters."
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Keep deduction"
              variant="secondary"
              size="sm"
              loading={answer.isPending && answer.variables === false}
              disabled={text.trim().length < 10 || busy}
              onPress={() => answer.mutate(false)}
              style={{ flex: 1 }}
            />
            <Button
              label="Drop it"
              variant="ghost"
              size="sm"
              loading={answer.isPending && answer.variables === true}
              disabled={text.trim().length < 10 || busy}
              onPress={() => answer.mutate(true)}
            />
          </View>
        </View>
      ) : null}
    </Card>
  );
}
