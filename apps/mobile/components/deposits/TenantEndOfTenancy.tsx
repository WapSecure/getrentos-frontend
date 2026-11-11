import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Divider,
  FormAlert,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  DEPOSIT_END_STAGE,
  DISPUTE_REASON_MIN,
  depositEndApi,
  leaseHasEnded,
  settlementText,
  type DepositEndView,
} from '@/lib/api/depositEnd';
import { errorMessage } from '@/lib/api/client';
import { withStepUpSummary } from '@/lib/stepUp';
import { formatDate, formatNaira } from '@/lib/format';
import { ClaimItems } from './ClaimItems';

/** D-6 end of tenancy, tenant side: say you have moved out, then accept or dispute the landlord's claim within 7 days. */
export function TenantEndOfTenancy({
  holdId,
  leaseStatus,
  leaseEnd,
}: {
  holdId: string;
  leaseStatus: string;
  leaseEnd?: string | null;
}) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  // Read once: whether the tenancy has ended only decides if the move-out button shows.
  const [ended] = useState(() => leaseHasEnded(leaseStatus, leaseEnd));
  const [disputing, setDisputing] = useState(false);
  const [reason, setReason] = useState('');

  const query = useQuery({
    queryKey: qk.renter.depositEnd(holdId),
    queryFn: () => depositEndApi.tenantView(holdId),
    meta: { persist: false },
  });
  const settle = (next: DepositEndView) => {
    qc.setQueryData(qk.renter.depositEnd(holdId), next);
    void qc.invalidateQueries({ queryKey: qk.renter.deposits });
  };
  const fail = (fallback: string) => (e: unknown) => toast.show(errorMessage(e, fallback), 'error');

  const movedOut = useMutation({
    mutationFn: () => depositEndApi.movedOut(holdId),
    onSuccess: (next) => {
      settle(next);
      toast.show('Noted. Your landlord has 14 days to claim any deductions.', 'success');
    },
    onError: fail('Could not record that you have moved out.'),
  });
  const accept = useMutation({
    mutationFn: (amount: number) =>
      withStepUpSummary(`Accept your landlord's claim of ${formatNaira(amount)}`, () =>
        depositEndApi.acceptClaim(holdId)
      ),
    onSuccess: (next) => {
      settle(next);
      toast.show('Claim accepted. The rest of your deposit is on its way back.', 'success');
    },
    onError: fail('Could not accept the claim.'),
  });
  const dispute = useMutation({
    mutationFn: () => depositEndApi.disputeClaim(holdId, reason.trim()),
    onSuccess: (next) => {
      setDisputing(false);
      setReason('');
      settle(next);
      toast.show('Sent to Sureground. We will look at both sides and decide.', 'success');
    },
    onError: fail('Could not send your dispute.'),
  });

  const view = query.data;
  // Only a deposit paid through Sureground goes through this flow.
  if (!view || view.funded <= 0) return null;
  const stage = DEPOSIT_END_STAGE[view.endStage];
  const claim = view.claim;
  const settled = settlementText(view, 'tenant', formatNaira);
  const busy = accept.isPending || dispute.isPending;

  const confirmAccept = () => {
    if (!claim) return;
    Alert.alert(
      'Accept the claim?',
      `${formatNaira(claim.amount)} goes to your landlord and ${formatNaira(
        view.funded - claim.amount
      )} is refunded to you. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: () => accept.mutate(claim.amount) },
      ]
    );
  };

  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
      <Divider />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="callout" style={{ fontWeight: '600', flex: 1 }}>
          End of tenancy
        </Text>
        <Badge label={stage.label} tone={stage.tone} />
      </View>

      {view.endStage === 'TENANCY' ? (
        <>
          <Text variant="callout" color="mutedForeground">
            {formatNaira(view.funded)} is held by Sureground for your tenancy. When you move out,
            your landlord has 14 days to claim deductions. Anything not claimed is refunded to you.
          </Text>
          {ended ? (
            <Button
              label="I have moved out"
              size="sm"
              variant="secondary"
              loading={movedOut.isPending}
              onPress={() =>
                Alert.alert(
                  'Have you moved out?',
                  'This starts your landlord’s 14 days to claim any deductions.',
                  [
                    { text: 'Not yet', style: 'cancel' },
                    { text: 'I have moved out', onPress: () => movedOut.mutate() },
                  ]
                )
              }
              style={{ alignSelf: 'flex-start' }}
            />
          ) : null}
        </>
      ) : null}

      {view.endStage === 'AWAITING_CLAIM' && view.claimBy ? (
        <Text variant="callout" color="mutedForeground">
          Your landlord has until {formatDate(view.claimBy)} to claim deductions. If they do not,
          your deposit is refunded to you in full.
        </Text>
      ) : null}

      {claim ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="callout">
            Your landlord claims{' '}
            <Text variant="callout" style={{ fontWeight: '700' }}>
              {formatNaira(claim.amount)}
            </Text>{' '}
            of your {formatNaira(view.funded)} deposit:
          </Text>
          <ClaimItems claim={claim} />
        </View>
      ) : null}

      {view.endStage === 'AWAITING_TENANT' && claim ? (
        <View style={{ gap: spacing.sm }}>
          <FormAlert
            tone="warning"
            message={`Accept or dispute by ${formatDate(claim.respondBy)}. If you do not respond, the claim counts as accepted.`}
          />
          {disputing ? (
            <View style={{ gap: spacing.sm }}>
              <TextField
                label="Why you disagree"
                placeholder="For example, the damage was there when you moved in"
                value={reason}
                onChangeText={setReason}
                multiline
                maxLength={2000}
                hint={`At least ${DISPUTE_REASON_MIN} characters.`}
                editable={!busy}
              />
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Button
                  label="Send to Sureground"
                  size="sm"
                  loading={dispute.isPending}
                  disabled={reason.trim().length < DISPUTE_REASON_MIN || busy}
                  onPress={() => dispute.mutate()}
                  style={{ flex: 1 }}
                />
                <Button
                  label="Cancel"
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onPress={() => setDisputing(false)}
                />
              </View>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Button
                  label="Accept"
                  size="sm"
                  loading={accept.isPending}
                  disabled={busy}
                  onPress={confirmAccept}
                  style={{ flex: 1 }}
                />
                <Button
                  label="Dispute"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onPress={() => setDisputing(true)}
                  style={{ flex: 1 }}
                />
              </View>
              <Text variant="caption" color="mutedForeground">
                You will be asked to confirm it is you before accepting, because money moves.
              </Text>
            </>
          )}
        </View>
      ) : null}

      {view.endStage === 'IN_MEDIATION' && claim?.disputeReason ? (
        <View
          style={{
            backgroundColor: colors.secondary,
            borderRadius: radius.md,
            padding: spacing.sm,
          }}
        >
          <Text variant="caption">
            You disputed this: {claim.disputeReason}. Sureground will look at both sides and decide.
            Your deposit stays held by Sureground until then.
          </Text>
        </View>
      ) : null}

      {settled ? (
        <FormAlert
          tone="success"
          message={
            claim?.resolution ? `${settled} Sureground’s decision: ${claim.resolution}` : settled
          }
        />
      ) : null}
    </View>
  );
}
