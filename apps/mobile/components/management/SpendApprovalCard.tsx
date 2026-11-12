import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X } from '@sureground/icons/native';
import {
  SPEND_BAND_LABELS,
  SPEND_BAND_VARIANT,
  humaniseStatus,
  needsExplicitAuthorisation,
} from '@sureground/shared';
import { Badge, Button, Card, Text, TextField, useTheme, useToast } from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  managementApi,
  SPEND_APPROVAL_LABEL,
  SPEND_APPROVAL_TONE,
  type SpendApproval,
  type SpendApprovalRole,
} from '@/lib/api/management';
import { errorMessage } from '@/lib/api/client';
import { withStepUpSummary } from '@/lib/stepUp';
import { formatDate, formatNaira } from '@/lib/format';

/**
 * One spend request above the owner's limit. Approving asks the owner to confirm it is them; an
 * EXPLICIT request says so. Used by the approvals screen and the Managed screen.
 */
export function SpendApprovalCard({
  approval: a,
  role,
}: {
  approval: SpendApproval;
  role: SpendApprovalRole;
}) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const canDecide = role === 'owner' && a.status === 'PENDING';
  const explicit = needsExplicitAuthorisation(a.band);
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['management', 'spend-approvals'] });
    void qc.invalidateQueries({ queryKey: qk.investor.managed });
    void qc.invalidateQueries({ queryKey: qk.investor.overview });
  };

  const approve = useMutation({
    mutationFn: () =>
      withStepUpSummary(
        `${explicit ? 'Explicitly authorise' : 'Approve'} ${formatNaira(a.amount)} for ${a.propertyTitle ?? 'this property'}`,
        () => managementApi.approveSpend(a.id)
      ),
    onSuccess: () => {
      invalidate();
      toast.show('Approved. The expense has been recorded.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not approve.'), 'error'),
  });
  const reject = useMutation({
    mutationFn: () => managementApi.rejectSpend(a.id, reason.trim()),
    onSuccess: () => {
      invalidate();
      setDeclining(false);
      setReason('');
      toast.show('Request declined.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not decline.'), 'error'),
  });
  const busy = approve.isPending || reject.isPending;

  return (
    <Card padding={spacing.lg} style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">
            {formatNaira(a.amount)} · {humaniseStatus(a.category)}
          </Text>
          <Text variant="caption" color="mutedForeground">
            {a.propertyTitle ?? 'Property'}
            {role === 'owner' && a.requestedByName ? ` · ${a.requestedByName}` : ''} ·{' '}
            {formatDate(a.createdAt, 'short')}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
          {a.band ? (
            <Badge label={SPEND_BAND_LABELS[a.band]} tone={SPEND_BAND_VARIANT[a.band]} />
          ) : null}
          <Badge label={SPEND_APPROVAL_LABEL[a.status]} tone={SPEND_APPROVAL_TONE[a.status]} />
        </View>
      </View>
      {a.note ? (
        <Text variant="callout" color="mutedForeground">
          {a.note}
        </Text>
      ) : null}
      {a.status === 'REJECTED' && a.decisionNote ? (
        <Text variant="callout" color="mutedForeground">
          Declined: {a.decisionNote}
        </Text>
      ) : null}

      {canDecide ? (
        declining ? (
          <View style={{ gap: spacing.sm }}>
            <TextField
              label="Reason for declining"
              value={reason}
              onChangeText={setReason}
              editable={!busy}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                label="Confirm decline"
                variant="destructive"
                size="sm"
                loading={reject.isPending}
                disabled={!reason.trim() || busy}
                onPress={() => reject.mutate()}
                style={{ flex: 1 }}
              />
              <Button
                label="Cancel"
                variant="ghost"
                size="sm"
                disabled={busy}
                onPress={() => {
                  setDeclining(false);
                  setReason('');
                }}
              />
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label={explicit ? 'Authorise' : 'Approve'}
              size="sm"
              icon={<Check size={14} color={colors.primaryForeground} />}
              loading={approve.isPending}
              disabled={busy}
              onPress={() => approve.mutate()}
              style={{ flex: 1 }}
            />
            <Button
              label="Decline"
              variant="ghost"
              size="sm"
              icon={<X size={14} color={colors.foreground} />}
              disabled={busy}
              onPress={() => setDeclining(true)}
            />
          </View>
        )
      ) : null}
    </Card>
  );
}
