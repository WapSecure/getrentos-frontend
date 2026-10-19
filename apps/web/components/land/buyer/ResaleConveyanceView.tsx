'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmptyState, PageErrorState, Toast } from '@getrentos/ui';
import { AlertTriangle, ArrowLeft, Lock, ScrollText } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { ROUTES } from '@/lib/constants/auth';
import { buyerLandKeys } from '@/lib/landSalesQueryKeys';
import { buyerKeys } from '@/lib/queryKeys';
import { landBuyerService } from '@/services/landBuyerService';
import { MilestoneTimeline } from './MilestoneTimeline';
import { ConditionsPanel } from '../closing/ConditionsPanel';
import { CoApprovalCard } from '../representatives/CoApprovalCard';
import { landRepresentativeKeys } from '@/services/landRepresentativeService';

/**
 * Conveyance on a land resale (a marketplace transaction). Escrow is released
 * to the seller only once every required step (deed executed, possession
 * handed over) is confirmed by the buyer.
 */
export const ResaleConveyanceView = ({ txId }: { txId: string }) => {
  const queryClient = useQueryClient();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: buyerLandKeys.transactionMilestones(txId),
    queryFn: () => unwrap(landBuyerService.listTransactionMilestones(txId)),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: buyerLandKeys.transactionMilestones(txId) });
    queryClient.invalidateQueries({ queryKey: buyerKeys.transactions });
  };

  const confirm = useMutation({
    mutationFn: (key: string) => unwrap(landBuyerService.confirmTransactionMilestone(txId, key)),
    onMutate: (key) => setPendingKey(key),
    onSuccess: (updated) => {
      refresh();
      queryClient.invalidateQueries({
        queryKey: landRepresentativeKeys.coApproval({ transactionId: txId }),
      });
      setToast({
        // Under two-person approval the step stays delivered until the representative approves too.
        message:
          updated.status === 'DELIVERED'
            ? 'Your approval is recorded. Waiting for your representative.'
            : 'Step confirmed.',
        variant: 'success',
      });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
    onSettled: () => setPendingKey(null),
  });
  const dispute = useMutation({
    mutationFn: ({ key, reason }: { key: string; reason: string }) =>
      unwrap(landBuyerService.disputeTransactionMilestone(txId, key, reason)),
    onMutate: ({ key }) => setPendingKey(key),
    onSuccess: () => {
      refresh();
      setToast({ message: 'Dispute sent to the seller.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
    onSettled: () => setPendingKey(null),
  });

  const milestones = data ?? [];
  const isLand = milestones.length > 0;
  const conditionsKey = buyerLandKeys.transactionConditions(txId);
  const conditions = useQuery({
    queryKey: conditionsKey,
    queryFn: () => unwrap(landBuyerService.listTransactionConditions(txId)),
    enabled: isLand,
  });
  const settle = useMutation({
    mutationFn: ({ key, how }: { key: string; how: 'confirm' | 'waive' }) =>
      unwrap(landBuyerService.settleTransactionCondition(txId, key, how)),
    onMutate: ({ key }) => setPendingKey(key),
    onSuccess: (next, { how }) => {
      queryClient.setQueryData(conditionsKey, next);
      setToast({
        message: how === 'confirm' ? 'Condition confirmed.' : 'Condition waived.',
        variant: 'success',
      });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
    onSettled: () => setPendingKey(null),
  });
  const conditionList = conditions.data ?? [];
  const failedCondition = conditionList.some((c) => c.failed);
  const openConditions = conditionList.filter(
    (c) => c.status !== 'SATISFIED' && c.status !== 'WAIVED'
  );
  const outstanding = milestones.filter(
    (m) => m.required && m.status !== 'CONFIRMED' && m.status !== 'WAIVED'
  );

  return (
    <div className="space-y-6">
      <Link
        href={ROUTES.BUYER_TRANSACTIONS}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Transactions
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Land conveyance</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          A land purchase is not complete when the money moves. It is complete when the deed is
          executed and you have possession.
        </p>
      </div>

      <p className="flex gap-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        Your payment is not released to the seller until you confirm every required step below,
        including the deed of assignment and possession on site. Confirm each one only when it has
        actually happened; dispute it if something is wrong.
      </p>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : isError ? (
        <PageErrorState
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      ) : milestones.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No conveyance steps"
          description="This transaction is not a land sale, so payment follows the usual purchase steps."
        />
      ) : (
        <>
          {conditionList.length > 0 && (
            <section
              aria-labelledby="conditions-heading"
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h2 id="conditions-heading" className="font-semibold text-foreground">
                Conditions of the sale
              </h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                {openConditions.length === 0
                  ? 'Every condition is met or waived.'
                  : `${openConditions.length} condition${openConditions.length === 1 ? '' : 's'} still open. Your payment is not released while any is.`}
              </p>
              {failedCondition && (
                <p className="mb-4 flex gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
                  A condition was not met. You may cancel and take a full refund of what GetRentos
                  holds from your transactions page, or keep the purchase.
                </p>
              )}
              <ConditionsPanel
                conditions={conditionList}
                role="buyer"
                sellerLabel="Seller"
                busyKey={settle.isPending ? pendingKey : null}
                onConfirm={(key) => settle.mutate({ key, how: 'confirm' })}
                onWaive={(key) => settle.mutate({ key, how: 'waive' })}
              />
            </section>
          )}
          <CoApprovalCard
            deal={{ transactionId: txId }}
            labelFor={(key) => milestones.find((m) => m.key === key)?.label ?? key}
            onChanged={(message, variant) => setToast({ message, variant })}
          />
          <section className="rounded-2xl border border-border bg-card p-5">
            <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
              {outstanding.length === 0
                ? 'Every required step is confirmed. Your payment can now be released to the seller.'
                : `${outstanding.length} required step${outstanding.length === 1 ? '' : 's'} before your payment can be released.`}
            </p>
            <MilestoneTimeline
              milestones={milestones}
              contractOpen
              requiredOnly
              pendingKey={pendingKey}
              onConfirm={(key) => confirm.mutateAsync(key)}
              onDispute={(key, reason) => dispute.mutateAsync({ key, reason })}
            />
            <p className="mt-4 text-xs text-muted-foreground">
              Before any step is confirmed you can cancel and be refunded. Once you confirm a step,
              a refund needs a failed condition above, or report a problem with the land.
            </p>
          </section>
        </>
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
