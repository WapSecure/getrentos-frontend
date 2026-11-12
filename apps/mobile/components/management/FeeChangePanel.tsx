import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, ChevronDown, ChevronUp, Percent, Users } from '@sureground/icons/native';
import {
  Badge,
  Button,
  Divider,
  FormAlert,
  NumberField,
  SegmentedControl,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  FEE_AMENDMENT_STATUS,
  FEE_REASON_MIN,
  FEE_TYPES,
  effectiveDateOptions,
  feeAmendmentsApi,
  feeHeadline,
  feeValueError,
  formatLagosDay,
  proposerLabel,
  type FeeAmendment,
  type FeeAmendmentOverview,
  type ManagementFeeType,
} from '@/lib/api/feeAmendments';
import { errorMessage } from '@/lib/api/client';
import { withStepUpSummary } from '@/lib/stepUp';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';

/**
 * BD-2 on a signed agreement, for the owner: the fee and any agreed change ahead, an open proposal to
 * answer, a new proposal (a firm's agreement only), and the history.
 */
export function FeeChangePanel({ mandateId }: { mandateId: string }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const [proposing, setProposing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const query = useQuery({
    queryKey: qk.managed.feeAmendments(mandateId),
    queryFn: () => feeAmendmentsApi.overview(mandateId),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: qk.managed.feeAmendments(mandateId) });

  if (query.isLoading) return <Skeleton height={48} />;
  if (query.error || !query.data) {
    return (
      <Text variant="caption" color="mutedForeground">
        {errorMessage(query.error, 'We could not load the fee for this agreement.')}
      </Text>
    );
  }
  const data = query.data;
  const hasHistory = data.history.length > 0 || data.versions.length > 0;

  return (
    <View style={{ gap: spacing.sm }}>
      <Divider />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Percent size={16} color={colors.mutedForeground} />
        <Text variant="callout" style={{ fontWeight: '600' }}>
          Management fee
        </Text>
      </View>
      <Text variant="callout" color="mutedForeground">
        {feeHeadline(data)}
      </Text>

      {data.pending ? <PendingProposal amendment={data.pending} onChanged={refresh} /> : null}

      {data.canPropose ? (
        <Button
          label="Propose a fee change"
          size="sm"
          variant="outline"
          onPress={() => setProposing(true)}
          style={{ alignSelf: 'flex-start' }}
        />
      ) : !data.pending && (data.proposeBlockedReason || data.managerIsSureground) ? (
        <Text variant="caption" color="mutedForeground">
          {data.proposeBlockedReason ??
            'Sureground proposes any change to a Sureground Managed fee. It shows here for you to accept or decline.'}
        </Text>
      ) : null}

      {hasHistory ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: historyOpen }}
          onPress={() => setHistoryOpen((v) => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}
          hitSlop={6}
        >
          <Text variant="callout" style={{ color: colors.primary, fontWeight: '600' }}>
            Fee history
          </Text>
          {historyOpen ? (
            <ChevronUp size={16} color={colors.primary} />
          ) : (
            <ChevronDown size={16} color={colors.primary} />
          )}
        </Pressable>
      ) : null}
      {historyOpen ? <FeeHistory data={data} /> : null}

      <Sheet open={proposing} onClose={() => setProposing(false)} title="Propose a fee change">
        {proposing ? (
          <ProposeForm
            mandateId={mandateId}
            overview={data}
            onDone={() => {
              setProposing(false);
              void refresh();
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function FeeHistory({ data }: { data: FeeAmendmentOverview }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {data.versions.map((v) => (
        <Text key={v.version} variant="caption">
          <Text variant="caption" style={{ fontWeight: '700' }}>
            Version {v.version}
          </Text>{' '}
          {v.fee?.label ?? 'No fee'} from {formatLagosDay(v.effectiveFrom)}
          {v.version === 1 ? ' (as signed)' : ''}
        </Text>
      ))}
      {data.history.map((a) => (
        <View key={a.id} style={{ gap: 2 }}>
          <View style={{ flexDirection: 'row' }}>
            <Badge
              label={FEE_AMENDMENT_STATUS[a.status].label}
              tone={FEE_AMENDMENT_STATUS[a.status].tone}
            />
          </View>
          <Text variant="caption" color="mutedForeground">
            {a.from.label} to {a.to.label} from {formatLagosDay(a.effectiveFrom)}, proposed by{' '}
            {proposerLabel(a)} on {formatLagosDay(a.createdAt)}
            {a.decidedAt ? `, closed ${formatLagosDay(a.decidedAt)}` : ''}
            {a.decisionNote ? `. ${a.decisionNote}` : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

function PendingProposal({
  amendment,
  onChanged,
}: {
  amendment: FeeAmendment;
  onChanged: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const toast = useToast();
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState('');
  const fail = (fallback: string) => (e: unknown) => toast.show(errorMessage(e, fallback), 'error');

  const accept = useMutation({
    mutationFn: () =>
      withStepUpSummary(
        `Accept the new management fee of ${amendment.to.label} from ${formatLagosDay(amendment.effectiveFrom)}`,
        () => feeAmendmentsApi.accept(amendment.id)
      ),
    onSuccess: (next) => {
      toast.show(
        next.status === 'ACCEPTED'
          ? `Agreed. ${next.to.label} applies from ${formatLagosDay(next.effectiveFrom)}.`
          : 'Your acceptance is recorded. The others still need to answer.',
        'success'
      );
      onChanged();
    },
    onError: fail('Could not accept the new fee.'),
  });
  const decline = useMutation({
    mutationFn: () => feeAmendmentsApi.decline(amendment.id, note.trim()),
    onSuccess: () => {
      setDeclining(false);
      setNote('');
      toast.show('Declined. The agreed fee stays.', 'success');
      onChanged();
    },
    onError: fail('Could not decline the change.'),
  });
  const withdraw = useMutation({
    mutationFn: () => feeAmendmentsApi.withdraw(amendment.id),
    onSuccess: () => {
      toast.show('Proposal withdrawn.', 'success');
      onChanged();
    },
    onError: fail('Could not withdraw the proposal.'),
  });

  const busy = accept.isPending || decline.isPending || withdraw.isPending;
  const { quorum, permissions } = amendment;
  const waitingOnOwners = quorum.ownersAccepted < quorum.ownersRequired;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.warning,
        borderRadius: radius.md,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <Text variant="callout" style={{ fontWeight: '600', flex: 1 }}>
          {proposerLabel(amendment)} proposed {amendment.from.label} to {amendment.to.label}
        </Text>
        <Badge label={FEE_AMENDMENT_STATUS.PENDING.label} tone="warning" />
      </View>
      <Text variant="callout" color="mutedForeground">
        “{amendment.reason}”
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <CalendarClock size={14} color={colors.mutedForeground} style={{ marginTop: 2 }} />
        <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
          Starts {formatLagosDay(amendment.effectiveFrom)}. Statements for earlier periods stay as
          they are.
        </Text>
      </View>
      <Text variant="caption" color="mutedForeground">
        Lapses on {formatLagosDay(amendment.expiresAt)} if nobody answers.
      </Text>
      {quorum.ownersRequired > 1 ? (
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <Users size={14} color={colors.mutedForeground} style={{ marginTop: 2 }} />
          <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
            {quorum.ownersAccepted} of {quorum.ownersRequired} owners have accepted. Every owner
            must accept.
          </Text>
        </View>
      ) : null}
      {!quorum.managerAccepted ? (
        <Text variant="caption" color="mutedForeground">
          Waiting for the manager to answer.
        </Text>
      ) : waitingOnOwners && !permissions.canAccept ? (
        <Text variant="caption" color="mutedForeground">
          Waiting for the owner side to answer.
        </Text>
      ) : null}

      {declining ? (
        <View style={{ gap: spacing.sm }}>
          <TextField
            label="Note for the other side"
            optional
            placeholder="Why you are declining"
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={1000}
            editable={!busy}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Decline the change"
              size="sm"
              variant="destructive"
              loading={decline.isPending}
              disabled={busy}
              onPress={() => decline.mutate()}
              style={{ flex: 1 }}
            />
            <Button
              label="Keep it open"
              size="sm"
              variant="ghost"
              disabled={busy}
              onPress={() => setDeclining(false)}
            />
          </View>
        </View>
      ) : permissions.canAccept || permissions.canDecline || permissions.canWithdraw ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {permissions.canAccept ? (
            <Button
              label="Accept new fee"
              size="sm"
              loading={accept.isPending}
              disabled={busy}
              onPress={() => accept.mutate()}
            />
          ) : null}
          {permissions.canDecline ? (
            <Button
              label="Decline"
              size="sm"
              variant="outline"
              disabled={busy}
              onPress={() => setDeclining(true)}
            />
          ) : null}
          {permissions.canWithdraw ? (
            <Button
              label="Withdraw proposal"
              size="sm"
              variant="ghost"
              loading={withdraw.isPending}
              disabled={busy}
              onPress={() => withdraw.mutate()}
            />
          ) : null}
        </View>
      ) : null}
      {permissions.canAccept ? (
        <Text variant="caption" color="mutedForeground">
          You will be asked to confirm it is you, because this changes future payments.
        </Text>
      ) : null}
    </View>
  );
}

function ProposeForm({
  mandateId,
  overview,
  onDone,
}: {
  mandateId: string;
  overview: FeeAmendmentOverview;
  onDone: () => void;
}) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [type, setType] = useState<ManagementFeeType>(overview.currentFee?.type ?? 'PERCENTAGE');
  const [value, setValue] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(overview.earliestEffectiveFrom);
  const [reason, setReason] = useState('');

  const valueError = feeValueError(value, type, overview.maxPercentage);
  const reasonShort = reason.trim().length < FEE_REASON_MIN;
  const ready = value !== '' && !valueError && !reasonShort && !!effectiveFrom;

  const propose = useMutation({
    mutationFn: () =>
      feeAmendmentsApi.propose(mandateId, {
        type,
        value: Number(value),
        reason: reason.trim(),
        effectiveFrom,
      }),
    onSuccess: () => {
      toast.show('Proposal sent. Nothing changes until the other side accepts.', 'success');
      onDone();
    },
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        The other side must accept before anything changes. The new fee applies from a rent period
        you choose, at least 14 days away, and never to a past statement. If nobody answers in 14
        days, the proposal lapses.
      </Text>
      <SegmentedControl
        accessibilityLabel="Kind of fee"
        options={FEE_TYPES}
        value={type}
        onChange={(next) => {
          setType(next);
          setValue('');
        }}
      />
      <NumberField
        label={type === 'PERCENTAGE' ? 'New fee (% of rent)' : 'New fee (₦ per period)'}
        currency={type === 'FLAT'}
        decimals={type === 'PERCENTAGE' ? 2 : 0}
        value={value}
        onValueChange={setValue}
        error={valueError}
        hint={overview.currentFee ? `Agreed now: ${overview.currentFee.label}` : undefined}
        required
      />
      <ChipSelect
        label="Starts on"
        options={effectiveDateOptions(overview.earliestEffectiveFrom)}
        value={effectiveFrom}
        onChange={setEffectiveFrom}
        scroll
      />
      <Text variant="caption" color="mutedForeground">
        The first of a month, at least 14 days from today, so the other side has the full 14 days to
        answer.
      </Text>
      <TextField
        label="Reason"
        value={reason}
        onChangeText={setReason}
        multiline
        maxLength={1000}
        required
        hint={
          reasonShort
            ? `At least ${FEE_REASON_MIN} characters. The other side reads it before deciding.`
            : 'Kept on the record with the agreement.'
        }
      />
      {propose.error ? (
        <FormAlert message={errorMessage(propose.error, 'Could not send the proposal.')} />
      ) : null}
      <Button
        label="Send proposal"
        loading={propose.isPending}
        disabled={!ready || propose.isPending}
        onPress={() => propose.mutate()}
      />
    </View>
  );
}
