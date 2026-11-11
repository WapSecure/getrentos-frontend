'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Badge, Button, ConfirmDialog, Textarea } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  DEPOSIT_END_STAGE_LABELS,
  DEPOSIT_REFUND_STATUS_LABELS,
  SETTLED_HOW_TEXT,
} from '@/services/depositService';
import {
  acceptDepositClaim,
  depositEndOfTenancy,
  disputeDepositClaim,
  sayMovedOut,
} from '@/services/renterDepositService';
import { ClaimItems } from '@/components/landlord/deposits/EndOfTenancyPanel';

/** D-6 end of tenancy, tenant side: say you have moved out, then accept or dispute the landlord's claim within 7 days. */
export const DepositEndOfTenancy = ({
  holdId,
  leaseStatus,
  leaseEnd,
}: {
  holdId: string;
  leaseStatus: string;
  leaseEnd?: string;
}) => {
  // Read once: whether the tenancy has ended only decides if the move-out button shows.
  const [now] = useState(() => Date.now());
  const leaseEnded =
    leaseStatus === 'EXPIRED' || (leaseEnd ? new Date(leaseEnd).getTime() <= now : false);
  const queryClient = useQueryClient();
  const [disputing, setDisputing] = useState(false);
  const [confirmAccept, setConfirmAccept] = useState(false);
  const [reason, setReason] = useState('');
  const { data: view } = useQuery({
    queryKey: renterKeys.depositEnd(holdId),
    queryFn: () => unwrap(depositEndOfTenancy(holdId)),
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: renterKeys.deposits });
    void queryClient.invalidateQueries({ queryKey: renterKeys.depositEnd(holdId) });
  };
  const movedOut = useMutation({
    mutationFn: () => unwrap(sayMovedOut(holdId)),
    onSuccess: refresh,
  });
  const accept = useMutation({
    mutationFn: () => unwrap(acceptDepositClaim(holdId)),
    onSuccess: () => {
      setConfirmAccept(false);
      refresh();
    },
  });
  const dispute = useMutation({
    mutationFn: () => unwrap(disputeDepositClaim(holdId, reason.trim())),
    onSuccess: () => {
      setDisputing(false);
      setReason('');
      refresh();
    },
  });

  // Only a deposit paid through Sureground goes through this flow.
  if (!view || view.funded <= 0) return null;
  const claim = view.claim;
  const error = (movedOut.error ?? accept.error ?? dispute.error) as Error | null;

  return (
    <section
      aria-label="Getting your deposit back"
      className="mt-4 space-y-3 rounded-lg border border-border p-3"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">End of tenancy</p>
        <Badge variant={view.endStage === 'SETTLED' ? 'success' : 'info'}>
          {DEPOSIT_END_STAGE_LABELS[view.endStage]}
        </Badge>
      </div>

      {view.endStage === 'TENANCY' && (
        <>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(view.funded)} is held by Sureground for your tenancy. When you move out,
            your landlord has 14 days to claim deductions; anything not claimed is refunded to you.
          </p>
          {leaseEnded && (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="secondary"
                isLoading={movedOut.isPending}
                onClick={() => movedOut.mutate()}
              >
                I have moved out
              </Button>
            </div>
          )}
        </>
      )}

      {view.endStage === 'AWAITING_CLAIM' && view.claimBy && (
        <p className="text-sm text-muted-foreground">
          Your landlord has until {formatDate(view.claimBy)} to claim deductions. If they do not,
          your deposit is refunded to you in full.
        </p>
      )}

      {claim && (
        <div className="space-y-2">
          <p className="text-sm text-foreground">
            Your landlord claims <span className="font-medium">{formatCurrency(claim.amount)}</span>{' '}
            of your {formatCurrency(view.funded)} deposit:
          </p>
          <ClaimItems claim={claim} />
        </div>
      )}

      {view.endStage === 'AWAITING_TENANT' && claim && (
        <div className="space-y-2">
          <Alert variant="warning">
            Accept or dispute by {formatDate(claim.respondBy)}. If you do not respond, the claim
            counts as accepted.
          </Alert>
          {disputing ? (
            <div className="space-y-2">
              <Textarea
                rows={3}
                aria-label="Why you disagree"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why you disagree, for example the damage was there when you moved in"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  isLoading={dispute.isPending}
                  disabled={reason.trim().length < 10}
                  onClick={() => dispute.mutate()}
                >
                  Send to Sureground
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDisputing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setDisputing(true)}>
                Dispute
              </Button>
              <Button size="sm" onClick={() => setConfirmAccept(true)}>
                Accept
              </Button>
            </div>
          )}
          <ConfirmDialog
            open={confirmAccept}
            onOpenChange={setConfirmAccept}
            title="Accept the claim?"
            description={`${formatCurrency(claim.amount)} goes to your landlord and ${formatCurrency(
              view.funded - claim.amount
            )} is refunded to you. This cannot be undone.`}
            confirmLabel="Accept"
            onConfirm={() => accept.mutate()}
            isLoading={accept.isPending}
          />
        </div>
      )}

      {view.endStage === 'IN_MEDIATION' && claim?.disputeReason && (
        <p className="text-sm text-muted-foreground">
          You disputed this: {claim.disputeReason}. Sureground will look at both sides and decide.
          Your deposit stays held by Sureground until then.
        </p>
      )}

      {view.settlement && (
        <Alert variant="success">
          {view.settlement.settledHow && SETTLED_HOW_TEXT[view.settlement.settledHow]}{' '}
          {formatCurrency(view.settlement.refundAmount)} refunded to you
          {view.settlement.refundStatus &&
            ` (${DEPOSIT_REFUND_STATUS_LABELS[view.settlement.refundStatus].toLowerCase()})`}
          {view.settlement.landlordAmount > 0 &&
            `, ${formatCurrency(view.settlement.landlordAmount)} to your landlord`}
          .{claim?.resolution && <> Sureground’s decision: {claim.resolution}</>}
        </Alert>
      )}

      {error && <Alert variant="danger">{error.message}</Alert>}
    </section>
  );
};
