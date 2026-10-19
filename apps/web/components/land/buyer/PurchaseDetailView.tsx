'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageErrorState, Tabs, TabsContent, TabsList, TabsTrigger, Toast } from '@getrentos/ui';
import { ArrowLeft, Info } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import { buyerLandKeys, landLayoutKeys } from '@/lib/landSalesQueryKeys';
import { landBuyerService } from '@/services/landBuyerService';
import type { LandPurchaseDetail } from '@/types/landBuyer';
import { PurchaseStatusBadge } from './LandSaleBadges';
import { MilestoneTimeline } from './MilestoneTimeline';
import { PaymentSchedule } from './PaymentSchedule';
import { PurchaseStatement } from './PurchaseStatement';
import { CancelPurchaseCard, PayNextCard, PurchaseDocuments } from './PurchaseSidePanels';
import {
  CONFIRMABLE_PURCHASE_STATUSES,
  bpsToPercent,
  plotLabel,
  summariseSchedule,
} from './landSaleLogic';
import { ReportLandProblemDialog } from '../disputes/ReportLandProblemDialog';
import { ConditionsPanel } from '../closing/ConditionsPanel';
import { PerfectionPanel } from '../closing/PerfectionPanel';

type ToastState = { message: string; variant: 'success' | 'error' | 'info' } | null;

const Line = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className={`flex justify-between gap-3 py-1.5 ${strong ? 'font-semibold' : ''}`}>
    <dt className={strong ? 'text-foreground' : 'text-muted-foreground'}>{label}</dt>
    <dd className="tabular-nums text-foreground">{value}</dd>
  </div>
);

/** One plot purchase: money, schedule, statement, conveyance and documents. */
/**
 * The refund in the buyer's terms. It goes back automatically to the card or
 * account they paid with; only a share already paid to the developer, or one
 * the bank refused, is finished by GetRentos finance by hand.
 */
const refundSentence = (purchase: {
  refundDue?: number;
  refundStatus?: string;
  refundedAmount?: number;
}): string => {
  const due = purchase.refundDue ?? 0;
  if (!due) return 'No refund is due.';
  const refunded = purchase.refundedAmount ?? 0;
  switch (purchase.refundStatus) {
    case 'REFUNDED':
    case 'SETTLED_MANUALLY':
      return `Your refund of ${formatCurrency(refunded || due)} has been paid. Banks usually show it within 5–10 working days.`;
    case 'NEEDS_MANUAL':
      return `${formatCurrency(refunded)} of your ${formatCurrency(due)} refund has been returned; GetRentos finance is paying the remaining ${formatCurrency(due - refunded)} directly.`;
    default:
      return `A refund of ${formatCurrency(due)} is on its way to the card or account you paid with.`;
  }
};

export const PurchaseDetailView = ({ purchaseId }: { purchaseId: string }) => {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<ToastState>(null);
  const [reporting, setReporting] = useState(false);
  const notify = (message: string, variant: 'success' | 'error' | 'info') =>
    setToast({ message, variant });

  const {
    data: purchase,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: buyerLandKeys.purchase(purchaseId),
    queryFn: () => unwrap(landBuyerService.getPurchase(purchaseId)),
  });

  const settle = (next: LandPurchaseDetail) => {
    queryClient.setQueryData(buyerLandKeys.purchase(purchaseId), next);
    queryClient.invalidateQueries({ queryKey: buyerLandKeys.purchases });
    queryClient.invalidateQueries({ queryKey: buyerLandKeys.statement(purchaseId) });
  };

  const pay = useMutation({
    mutationFn: () => unwrap(landBuyerService.pay(purchaseId)),
    onSuccess: (init) => {
      if (init.authorizationUrl) {
        window.location.assign(init.authorizationUrl);
        return;
      }
      // No gateway configured (development): the API confirmed it already.
      notify(`Payment of ${formatCurrency(init.amount)} confirmed.`, 'success');
      queryClient.invalidateQueries({ queryKey: buyerLandKeys.all });
    },
    onError: (reason: Error) => notify(reason.message, 'error'),
  });

  const [milestoneKey, setMilestoneKey] = useState<string | null>(null);
  const confirmStep = useMutation({
    mutationFn: (key: string) => unwrap(landBuyerService.confirmMilestone(purchaseId, key)),
    onMutate: (key) => setMilestoneKey(key),
    onSuccess: (next) => {
      settle(next);
      notify('Step confirmed.', 'success');
    },
    onError: (reason: Error) => notify(reason.message, 'error'),
    onSettled: () => setMilestoneKey(null),
  });
  const disputeStep = useMutation({
    mutationFn: ({ key, reason }: { key: string; reason: string }) =>
      unwrap(landBuyerService.disputeMilestone(purchaseId, key, reason)),
    onMutate: ({ key }) => setMilestoneKey(key),
    onSuccess: (next) => {
      settle(next);
      notify('Dispute sent to the developer.', 'success');
    },
    onError: (reason: Error) => notify(reason.message, 'error'),
    onSettled: () => setMilestoneKey(null),
  });

  const [conditionKey, setConditionKey] = useState<string | null>(null);
  const settleCondition = useMutation({
    mutationFn: ({ key, how }: { key: string; how: 'confirm' | 'waive' }) =>
      unwrap(landBuyerService.settleCondition(purchaseId, key, how)),
    onMutate: ({ key }) => setConditionKey(key),
    onSuccess: (next, { how }) => {
      settle(next);
      notify(how === 'confirm' ? 'Condition confirmed.' : 'Condition waived.', 'success');
    },
    onError: (reason: Error) => notify(reason.message, 'error'),
    onSettled: () => setConditionKey(null),
  });

  const cancel = useMutation({
    mutationFn: (reason: string) => unwrap(landBuyerService.cancelPurchase(purchaseId, reason)),
    onSuccess: (next) => {
      settle(next);
      queryClient.invalidateQueries({ queryKey: landLayoutKeys.detail(next.layoutId) });
      notify(
        next.refundDue ? `Purchase cancelled. ${refundSentence(next)}` : 'Purchase cancelled.',
        'success'
      );
    },
    onError: (reason: Error) => notify(reason.message, 'error'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-10 w-1/2 animate-pulse rounded-xl bg-secondary" />
        <div className="h-64 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }
  if (isError || !purchase) {
    return (
      <PageErrorState
        title="Could not load this purchase"
        description={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
        isRetrying={isRefetching}
      />
    );
  }

  const summary = summariseSchedule(purchase.installments, purchase.nextDue);
  const contractOpen = CONFIRMABLE_PURCHASE_STATUSES.includes(purchase.status);
  const ended = ['CANCELLED', 'REVOKED'].includes(purchase.status);

  return (
    <div className="space-y-6">
      <Link
        href={LAND_BUYER_ROUTES.HUB}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> My land
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {plotLabel(purchase)} · {purchase.layoutName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {purchase.reference} · {purchase.planName}
            {purchase.startedAt ? ` · started ${formatDate(purchase.startedAt)}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <PurchaseStatusBadge status={purchase.status} />
          {['ACTIVE', 'PAID_IN_FULL', 'COMPLETED'].includes(purchase.status) && (
            <Link
              href="/land/watch"
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              Watch this plot
            </Link>
          )}
          {purchase.propertyId && (
            <button
              type="button"
              onClick={() => setReporting(true)}
              className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Report a problem
            </button>
          )}
        </div>
      </header>
      {purchase.propertyId && (
        <ReportLandProblemDialog
          open={reporting}
          onClose={() => setReporting(false)}
          propertyId={purchase.propertyId}
          purchaseId={purchase.id}
          landTitle={`${plotLabel(purchase)} · ${purchase.layoutName}`}
        />
      )}

      {purchase.status === 'DEFAULTED' && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          This purchase is in default because a payment is more than{' '}
          {purchase.terms.defaultAfterDays} days late. Pay what is overdue now; the developer may
          otherwise revoke the contract, refunding what you paid less{' '}
          {bpsToPercent(purchase.terms.revocationChargeBps)}.
        </p>
      )}
      {purchase.canCancelInFull && (
        <p
          role="alert"
          className="rounded-xl border border-warning/40 bg-warning/5 p-4 text-sm text-foreground"
        >
          A condition of this purchase was not met. You may cancel and receive everything you have
          paid, with no cancellation charge, or keep the purchase. See the Conditions tab.
        </p>
      )}
      {ended && (
        <p className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-foreground">
          {purchase.status === 'REVOKED'
            ? `The developer revoked this purchase${purchase.revocationReason ? `: ${purchase.revocationReason}` : ''}.`
            : 'You cancelled this purchase.'}{' '}
          {refundSentence(purchase)}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <section
            aria-labelledby="price-heading"
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h2 id="price-heading" className="font-semibold text-foreground">
              Price
            </h2>
            <dl className="mt-2 divide-y divide-border/60 text-sm">
              <Line label="Plot price" value={formatCurrency(purchase.plotPrice)} />
              {purchase.priceUplift > 0 && (
                <Line
                  label={`Installment uplift (${bpsToPercent(purchase.terms.priceUpliftBps)})`}
                  value={formatCurrency(purchase.priceUplift)}
                />
              )}
              <Line
                label="Documentation fee"
                value={formatCurrency(purchase.feeBreakdown.documentationFee)}
              />
              <Line label="Survey fee" value={formatCurrency(purchase.feeBreakdown.surveyFee)} />
              <Line
                label="Development levy"
                value={formatCurrency(purchase.feeBreakdown.developmentLevy)}
              />
              <Line label="Total price" value={formatCurrency(purchase.totalPrice)} strong />
              <Line label="Paid so far" value={formatCurrency(purchase.amountPaid)} />
              {purchase.lateFeesAccrued > 0 && (
                <Line label="Late fees charged" value={formatCurrency(purchase.lateFeesAccrued)} />
              )}
              <Line
                label="Outstanding"
                value={formatCurrency(purchase.outstandingBalance)}
                strong
              />
              <Line
                label="Released to the developer"
                value={formatCurrency(purchase.releasedToSeller)}
              />
            </dl>
          </section>

          <Tabs defaultValue="schedule">
            <TabsList>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              {(purchase.conditions?.length ?? 0) > 0 && (
                <TabsTrigger value="conditions">Conditions</TabsTrigger>
              )}
              <TabsTrigger value="conveyance">Conveyance</TabsTrigger>
              {purchase.perfection && <TabsTrigger value="title">Title</TabsTrigger>}
              <TabsTrigger value="statement">Statement</TabsTrigger>
            </TabsList>
            <TabsContent value="schedule" className="mt-4">
              <PaymentSchedule installments={purchase.installments} summary={summary} />
              <p className="mt-3 text-xs text-muted-foreground">
                {purchase.terms.gracePeriodDays} days&apos; grace on each installment, then a{' '}
                {bpsToPercent(purchase.terms.lateFeeBps)} late fee. Default after{' '}
                {purchase.terms.defaultAfterDays} days overdue.
              </p>
            </TabsContent>
            <TabsContent value="conditions" className="mt-4">
              <ConditionsPanel
                conditions={purchase.conditions ?? []}
                checklist={purchase.closingChecklist}
                role="buyer"
                busyKey={conditionKey}
                onConfirm={(key) => settleCondition.mutate({ key, how: 'confirm' })}
                onWaive={(key) => settleCondition.mutate({ key, how: 'waive' })}
              />
            </TabsContent>
            <TabsContent value="conveyance" className="mt-4 space-y-4">
              <p className="flex gap-2 rounded-xl bg-info/5 p-3 text-sm text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden />
                GetRentos holds your payments. Each step you confirm releases its share to the
                developer, never more than you have paid. Confirm in order, and only once you hold
                the document or have been shown the plot. Allocation, the deed and the survey in
                your name come after full payment.
              </p>
              <MilestoneTimeline
                milestones={purchase.milestones}
                contractOpen={contractOpen}
                showRelease
                pendingKey={milestoneKey}
                onConfirm={(key) => confirmStep.mutateAsync(key)}
                onDispute={(key, reason) => disputeStep.mutateAsync({ key, reason })}
              />
            </TabsContent>
            {purchase.perfection && (
              <TabsContent value="title" className="mt-4">
                <PerfectionPanel perfection={purchase.perfection} role="buyer" />
              </TabsContent>
            )}
            <TabsContent value="statement" className="mt-4">
              <PurchaseStatement purchaseId={purchase.id} />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-4">
          <PayNextCard purchase={purchase} onPay={() => pay.mutate()} isPaying={pay.isPending} />
          <PurchaseDocuments purchase={purchase} notify={notify} />
          <CancelPurchaseCard
            purchase={purchase}
            isCancelling={cancel.isPending}
            onCancel={(reason) => cancel.mutateAsync(reason)}
          />
        </aside>
      </div>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
