import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DoorOpen } from '@sureground/icons/native';
import {
  Badge,
  Button,
  Card,
  DateField,
  FormAlert,
  Skeleton,
  Text,
  toISODate,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  DEPOSIT_END_STAGE,
  depositEndApi,
  moveOutInstant,
  settlementText,
  type DepositEndView,
} from '@/lib/api/depositEnd';
import { errorMessage } from '@/lib/api/client';
import { formatDate, formatNaira } from '@/lib/format';
import { Sheet } from '@/components/Sheet';
import { ClaimItems } from './ClaimItems';
import { ClaimDeductionsForm } from './ClaimDeductionsForm';

/** D-6 end of tenancy, landlord side: record move-out, claim deductions within 14 days, follow the outcome. */
export function EndOfTenancyCard({ depositId }: { depositId: string }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [today] = useState(() => toISODate(new Date()));
  const [moveOut, setMoveOut] = useState(today);
  const [claiming, setClaiming] = useState(false);

  const query = useQuery({
    queryKey: qk.management.depositEnd(depositId),
    queryFn: () => depositEndApi.view(depositId),
    // Holds signed evidence links and the tenant's name.
    meta: { persist: false },
  });
  const settle = (next: DepositEndView) => {
    qc.setQueryData(qk.management.depositEnd(depositId), next);
    void qc.invalidateQueries({ queryKey: ['management', 'deposits'] });
  };
  const recordMoveOut = useMutation({
    mutationFn: () => depositEndApi.recordMoveOut(depositId, moveOutInstant(moveOut)),
    onSuccess: (next) => {
      settle(next);
      toast.show('Move-out recorded. You have 14 days to claim deductions.', 'success');
    },
  });

  if (query.isLoading) return <Skeleton height={120} />;
  const view = query.data;
  // A deposit Sureground never received is returned by whoever holds it, outside this flow.
  if (!view || view.funded <= 0) return null;
  const stage = DEPOSIT_END_STAGE[view.endStage];
  const claim = view.claim;
  const settled = settlementText(view, 'landlord', formatNaira);

  return (
    <Card padding={spacing.lg} style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <DoorOpen size={18} color={colors.primary} />
        <Text variant="bodyStrong" accessibilityRole="header" style={{ flex: 1 }}>
          End of tenancy
        </Text>
        <Badge label={stage.label} tone={stage.tone} />
      </View>
      <Text variant="callout" color="mutedForeground">
        {formatNaira(view.funded)} is held by Sureground for this tenancy. It is never part of your
        balance until the deposit is settled.
      </Text>

      {view.endStage === 'TENANCY' ? (
        <View style={{ gap: spacing.sm }}>
          <DateField label="Move-out date" value={moveOut} onChange={setMoveOut} max={today} />
          {recordMoveOut.error ? (
            <FormAlert
              message={errorMessage(recordMoveOut.error, 'Could not record the move-out.')}
            />
          ) : null}
          <Button
            label="Record move-out"
            variant="secondary"
            loading={recordMoveOut.isPending}
            disabled={!moveOut || recordMoveOut.isPending}
            onPress={() => recordMoveOut.mutate()}
          />
          <Text variant="caption" color="mutedForeground">
            You then have 14 days to claim deductions. With no claim, the deposit is refunded to the
            tenant in full.
          </Text>
        </View>
      ) : null}

      {view.endStage === 'AWAITING_CLAIM' && view.claimBy ? (
        <View style={{ gap: spacing.sm }}>
          <FormAlert
            tone="info"
            message={`Claim any deductions by ${formatDate(view.claimBy)}, with a reason and evidence for each. After that the deposit is refunded to the tenant in full.`}
          />
          <Button label="Claim deductions" onPress={() => setClaiming(true)} />
        </View>
      ) : null}

      {claim ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="callout" style={{ fontWeight: '600' }}>
            Your claim: {formatNaira(claim.amount)}
          </Text>
          <ClaimItems claim={claim} />
          {view.endStage === 'AWAITING_TENANT' ? (
            <Text variant="caption" color="mutedForeground">
              The tenant has until {formatDate(claim.respondBy)} to accept or dispute. No response
              counts as accepted.
            </Text>
          ) : null}
          {claim.disputeReason ? (
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
                  The tenant disputes this:
                </Text>{' '}
                {claim.disputeReason}
              </Text>
              {view.endStage === 'IN_MEDIATION' ? (
                <Text variant="caption" color="mutedForeground">
                  Sureground will look at both sides and decide.
                </Text>
              ) : null}
            </View>
          ) : null}
          {claim.resolution ? (
            <Text variant="callout" color="mutedForeground">
              Sureground’s decision: {claim.resolution}
            </Text>
          ) : null}
        </View>
      ) : null}

      {settled ? <FormAlert tone="success" message={settled} /> : null}

      <Sheet open={claiming} onClose={() => setClaiming(false)} title="Claim deductions">
        {claiming ? (
          <ClaimDeductionsForm
            view={view}
            onDone={(next) => {
              setClaiming(false);
              settle(next);
              toast.show('Claim sent. The tenant has 7 days to answer.', 'success');
            }}
          />
        ) : null}
      </Sheet>
    </Card>
  );
}
