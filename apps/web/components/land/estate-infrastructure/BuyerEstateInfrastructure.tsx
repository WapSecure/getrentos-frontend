'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, ConfirmDialog, EmptyState, PageErrorState, Skeleton } from '@getrentos/ui';
import { Construction } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import {
  estateInfrastructureKeys,
  landEstateInfrastructureService,
} from '@/services/landEstateInfrastructureService';
import type { EstateCommitment } from '@/types/landEstateInfrastructure';
import { errorMessage, type Notify } from '../developer/feedback';
import { CommitmentCard } from './CommitmentCard';

type Pending =
  | { kind: 'object'; commitment: EstateCommitment }
  | { kind: 'dispute'; commitment: EstateCommitment }
  | null;

/** The estate's promises on a buyer's purchase: answer change requests, dispute a delivery. */
export const BuyerEstateInfrastructure = ({
  purchaseId,
  notify,
}: {
  purchaseId: string;
  notify: Notify;
}) => {
  const queryClient = useQueryClient();
  const key = estateInfrastructureKeys.buyer(purchaseId);
  const list = useQuery({
    queryKey: key,
    queryFn: () => unwrap(landEstateInfrastructureService.forPurchase(purchaseId)),
  });
  const [pending, setPending] = useState<Pending>(null);
  const [reason, setReason] = useState('');

  const done = (message: string) => (next: EstateCommitment[]) => {
    queryClient.setQueryData(key, next);
    setPending(null);
    setReason('');
    notify(message);
  };
  const fail = (error: unknown) => notify(errorMessage(error), 'error');

  const respond = useMutation({
    mutationFn: (input: { changeOrderId: string; response: 'ACKNOWLEDGED' | 'OBJECTED' }) =>
      unwrap(
        landEstateInfrastructureService.respond(
          purchaseId,
          input.changeOrderId,
          input.response,
          input.response === 'OBJECTED' ? reason : undefined
        )
      ),
    onSuccess: (next, input) =>
      done(
        input.response === 'OBJECTED'
          ? 'Objection sent. GetRentos will review the change before it applies.'
          : 'Thanks, your answer is recorded.'
      )(next),
    onError: fail,
  });
  const dispute = useMutation({
    mutationFn: (commitmentId: string) =>
      unwrap(landEstateInfrastructureService.dispute(purchaseId, commitmentId, reason)),
    onSuccess: done('Dispute sent. GetRentos will check the delivery.'),
    onError: fail,
  });

  if (list.isLoading) return <Skeleton className="h-40 rounded-2xl" />;
  if (list.isError) {
    return (
      <PageErrorState
        title="Could not load the estate's promises"
        description={errorMessage(list.error)}
        onRetry={() => void list.refetch()}
        headingLevel="h2"
      />
    );
  }
  const commitments = list.data ?? [];
  if (commitments.length === 0) {
    return (
      <EmptyState
        icon={Construction}
        title="No infrastructure promises recorded"
        description="The developer has not listed roads, power, water or other works for this estate."
      />
    );
  }

  return (
    <div className="space-y-4">
      {commitments.map((commitment) => {
        const change = commitment.openChange;
        const canAnswer = change && !change.myResponse;
        const canDispute = commitment.status === 'DELIVERED';
        return (
          <CommitmentCard key={commitment.id} commitment={commitment}>
            {change?.myResponse && (
              <p className="text-sm text-muted-foreground">
                You {change.myResponse === 'OBJECTED' ? 'objected to' : 'acknowledged'} this change.
              </p>
            )}
            {canAnswer && (
              <>
                <Button
                  size="sm"
                  isLoading={respond.isPending && !pending}
                  disabled={respond.isPending}
                  onClick={() =>
                    respond.mutate({ changeOrderId: change.id, response: 'ACKNOWLEDGED' })
                  }
                >
                  Acknowledge change
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={respond.isPending}
                  onClick={() => setPending({ kind: 'object', commitment })}
                >
                  Object
                </Button>
              </>
            )}
            {canDispute && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPending({ kind: 'dispute', commitment })}
              >
                It was not delivered
              </Button>
            )}
          </CommitmentCard>
        );
      })}

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPending(null);
            setReason('');
          }
        }}
        title={pending?.kind === 'object' ? 'Object to this change' : 'Dispute the delivery'}
        description={
          pending?.kind === 'object'
            ? 'GetRentos reviews every objection before the change can apply. Say what you were promised and why the change affects you.'
            : 'GetRentos will ask the developer for evidence and may visit. Say what is missing on the ground.'
        }
        confirmLabel={pending?.kind === 'object' ? 'Send objection' : 'Send dispute'}
        tone="primary"
        promptLabel="Your reason"
        promptValue={reason}
        onPromptChange={setReason}
        promptRequired
        promptMinLength={pending?.kind === 'object' ? 10 : 5}
        isLoading={respond.isPending || dispute.isPending}
        onConfirm={() => {
          if (!pending) return;
          if (pending.kind === 'dispute') return dispute.mutateAsync(pending.commitment.id);
          const changeOrderId = pending.commitment.openChange?.id;
          if (changeOrderId) return respond.mutateAsync({ changeOrderId, response: 'OBJECTED' });
        }}
      />
    </div>
  );
};
