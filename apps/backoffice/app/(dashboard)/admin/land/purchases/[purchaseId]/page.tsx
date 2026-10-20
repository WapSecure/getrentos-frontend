'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CircleAlert, HandCoins, RefreshCw } from 'lucide-react';
import { Alert, Button, CardSkeleton, EmptyState, Skeleton, useToast } from '@getrentos/ui';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import {
  bpsToPercent,
  isRefundableTermination,
  landQueryKeys,
  readLandApiError,
} from '@/lib/landDiligence';
import { adminLandPurchaseService } from '@/services/adminLandPurchaseService';
import type { LandPurchaseDetail } from '@/types/landPurchase';
import { Fact, LandCaseSection } from '@/components/admin/land/case/shared';
import { LandPurchaseMilestones } from '@/components/admin/land/purchases/LandPurchaseMilestones';
import { LandPurchasePayments } from '@/components/admin/land/purchases/LandPurchasePayments';
import { LandPurchaseSchedule } from '@/components/admin/land/purchases/LandPurchaseSchedule';
import { LandPurchaseStatusBadge } from '@/components/admin/land/purchases/LandPurchaseStatusBadge';
import { LandRefundPanel } from '@/components/admin/land/purchases/LandRefundPanel';
import { LandPurchaseConditions } from '@/components/admin/land/purchases/LandPurchaseConditions';
import { LandPerfectionPanel } from '@/components/admin/land/purchases/LandPerfectionPanel';

const ENDED = new Set(['REVOKED', 'CANCELLED', 'COMPLETED']);

/** One plot purchase in full, with the two exceptions staff can grant. */
export default function AdminLandPurchaseDetailPage() {
  const params = useParams<{ purchaseId: string }>();
  const purchaseId = decodeURIComponent(params.purchaseId);
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canView = hasAdminPermission(user?.roles, 'sales.view');
  const canWaiveMilestone = hasAdminPermission(user?.roles, 'verifications.approve');
  const canWaiveLateFee = hasAdminPermission(user?.roles, 'escrow.approve');
  const toast = useToast();

  const key = landQueryKeys.purchase(purchaseId);
  const detailQuery = useQuery({
    queryKey: key,
    queryFn: () => unwrap(adminLandPurchaseService.detail(purchaseId)),
    enabled: canView && Boolean(purchaseId),
  });

  const applyUpdate = (updated: LandPurchaseDetail, message: string) => {
    queryClient.setQueryData(key, updated);
    void queryClient.invalidateQueries({ queryKey: landQueryKeys.purchasesRoot });
    toast.success(message);
  };
  const reportError = (error: unknown, fallback: string) => {
    const info = readLandApiError(error, fallback);
    if (info.stale) void detailQuery.refetch();
    toast.error(info.stale ? `${info.message} The purchase has been reloaded.` : info.message);
  };

  const retryRefund = useMutation({
    mutationFn: () => unwrap(adminLandPurchaseService.retryRefund(purchaseId)),
    onSuccess: (updated) =>
      applyUpdate(
        updated,
        updated.refundStatus === 'REFUNDED' ? 'Refund sent through Paystack.' : 'Refund retried.'
      ),
    onError: (error) => reportError(error, 'Could not retry the refund.'),
  });

  const settleRefund = useMutation({
    mutationFn: ({ amount, note }: { amount: number; note: string }) =>
      unwrap(adminLandPurchaseService.settleRefund(purchaseId, amount, note)),
    onSuccess: (updated) => applyUpdate(updated, 'Manual refund recorded; the buyer was notified.'),
    onError: (error) => reportError(error, 'Could not record the settlement.'),
  });

  const perfectionAction = useMutation({
    mutationFn: (action: () => Promise<LandPurchaseDetail>) => action(),
    onSuccess: (updated) => applyUpdate(updated, 'Title perfection updated.'),
    onError: (error) => reportError(error, 'Could not update title perfection.'),
  });

  const decideCondition = useMutation({
    mutationFn: ({
      key,
      status,
      note,
    }: {
      key: string;
      status: 'SATISFIED' | 'FAILED';
      note: string;
    }) => unwrap(adminLandPurchaseService.decideCondition(purchaseId, key, status, note)),
    onSuccess: (updated, { status }) =>
      applyUpdate(
        updated,
        status === 'SATISFIED'
          ? 'Condition marked met.'
          : 'Condition marked not met; the buyer may cancel in full.'
      ),
    onError: (error) => reportError(error, 'Could not record that decision.'),
  });

  const approvePayout = useMutation({
    mutationFn: (releaseId: string) =>
      unwrap(adminLandPurchaseService.approvePayout(purchaseId, releaseId)),
    onSuccess: (updated) =>
      applyUpdate(updated, 'Payout approved; it goes to the developer on the next payout run.'),
    onError: (error) => reportError(error, 'Could not approve that payout.'),
  });

  const retryPayout = useMutation({
    mutationFn: (releaseId: string) =>
      unwrap(adminLandPurchaseService.retryPayout(purchaseId, releaseId)),
    onSuccess: (updated) => applyUpdate(updated, 'Payout queued again.'),
    onError: (error) => reportError(error, 'Could not retry that payout.'),
  });

  const waiveMilestone = useMutation({
    mutationFn: ({ milestoneKey, reason }: { milestoneKey: string; reason: string }) =>
      unwrap(adminLandPurchaseService.waiveMilestone(purchaseId, milestoneKey, reason)),
    onSuccess: (updated) =>
      applyUpdate(updated, 'Milestone waived and recorded in the audit trail.'),
    onError: (error) => reportError(error, 'Unable to waive that milestone.'),
  });

  const waiveLateFee = useMutation({
    mutationFn: ({ installmentId, reason }: { installmentId: string; reason: string }) =>
      unwrap(adminLandPurchaseService.waiveLateFee(purchaseId, installmentId, reason)),
    onSuccess: (updated) => applyUpdate(updated, 'Late fee waived.'),
    onError: (error) => reportError(error, 'Unable to waive that late fee.'),
  });

  if (!canView) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="You do not have access to land purchases"
        description="Viewing plot purchases needs the sales view permission."
      />
    );
  }
  if (detailQuery.isLoading) return <PurchaseSkeleton />;

  const purchase = detailQuery.data;
  if (!purchase) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="This purchase could not be loaded"
        description={
          detailQuery.error instanceof Error ? detailQuery.error.message : 'Purchase not found.'
        }
        action={
          <Button
            href="/admin/land/purchases"
            variant="outline"
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to purchases
          </Button>
        }
      />
    );
  }

  const ended = ENDED.has(purchase.status);
  const terminated = isRefundableTermination(purchase.status);

  return (
    <>
      <Link
        href="/admin/land/purchases"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Land purchases
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="type-title font-mono">{purchase.reference}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {purchase.layoutName} · Plot {purchase.plotNumber}
            {purchase.block && ` · Block ${purchase.block}`} ·{' '}
            {purchase.buyerName ?? 'Unknown buyer'} · {purchase.planName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LandPurchaseStatusBadge status={purchase.status} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => detailQuery.refetch()}
            isLoading={detailQuery.isFetching}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Reload
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {terminated && (
          <Alert
            variant="warning"
            icon={HandCoins}
            title={purchase.status === 'REVOKED' ? 'Contract revoked' : 'Contract cancelled'}
          >
            {purchase.status === 'REVOKED' ? 'Revoked' : 'Cancelled'}
            {(purchase.revokedAt ?? purchase.cancelledAt) &&
              ` on ${formatDate((purchase.revokedAt ?? purchase.cancelledAt) as string)}`}
            {purchase.revocationReason && ` · ${purchase.revocationReason}`}. Paid{' '}
            {formatCurrency(purchase.amountPaid)}, released to the developer{' '}
            {formatCurrency(purchase.releasedToSeller)}; revocation charge{' '}
            {bpsToPercent(purchase.terms.revocationChargeBps)}.
          </Alert>
        )}

        {terminated && (purchase.refundDue ?? 0) > 0 && (
          <LandRefundPanel
            purchase={purchase}
            canAct={canWaiveLateFee}
            retrying={retryRefund.isPending}
            settling={settleRefund.isPending}
            onRetry={() => retryRefund.mutate()}
            onSettle={(amount, note) => settleRefund.mutateAsync({ amount, note })}
          />
        )}

        <LandPurchaseConditions
          conditions={purchase.conditions ?? []}
          checklist={purchase.closingChecklist}
          canDecide={canWaiveMilestone}
          busyKey={decideCondition.isPending ? (decideCondition.variables?.key ?? null) : null}
          onDecide={(key, status, note) => decideCondition.mutate({ key, status, note })}
        />

        <LandPerfectionPanel
          perfection={purchase.perfection}
          canAct={canWaiveMilestone}
          busy={perfectionAction.isPending}
          onOpen={() =>
            perfectionAction.mutate(() =>
              unwrap(adminLandPurchaseService.openPerfection(purchaseId))
            )
          }
          onAssign={(input) =>
            perfectionAction.mutate(() =>
              unwrap(adminLandPurchaseService.assignPerfectionProfessional(purchaseId, input))
            )
          }
          onStep={(key, status, reference, note) =>
            perfectionAction.mutate(() =>
              unwrap(
                adminLandPurchaseService.updatePerfectionStep(purchaseId, key, {
                  status,
                  ...(reference ? { reference } : {}),
                  ...(note ? { note } : {}),
                })
              )
            )
          }
          onComplete={(input) =>
            perfectionAction.mutate(() =>
              unwrap(adminLandPurchaseService.completePerfection(purchaseId, input))
            )
          }
        />

        <LandCaseSection title="Contract">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Plot price" value={formatCurrency(purchase.plotPrice)} />
            <Fact
              label={`Price uplift (${bpsToPercent(purchase.terms.priceUpliftBps)})`}
              value={formatCurrency(purchase.priceUplift)}
            />
            <Fact label="Fees" value={formatCurrency(purchase.fees)} />
            <Fact label="Total price" value={formatCurrency(purchase.totalPrice)} />
            <Fact label="Paid" value={formatCurrency(purchase.amountPaid)} />
            <Fact label="Outstanding" value={formatCurrency(purchase.outstandingBalance)} />
            <Fact label="Late fees accrued" value={formatCurrency(purchase.lateFeesAccrued)} />
            <Fact label="Released to developer" value={formatCurrency(purchase.releasedToSeller)} />
            <Fact
              label="Term"
              value={
                purchase.terms.durationMonths
                  ? `${purchase.terms.durationMonths} months, ${bpsToPercent(purchase.terms.initialDepositBps)} deposit`
                  : 'Outright'
              }
            />
            <Fact
              label="Late fee / grace"
              value={`${bpsToPercent(purchase.terms.lateFeeBps)} after ${purchase.terms.gracePeriodDays} days`}
            />
            <Fact
              label="Defaults after"
              value={`${purchase.terms.defaultAfterDays} days overdue`}
            />
            <Fact
              label="Fee breakdown"
              value={`Docs ${formatCurrency(purchase.feeBreakdown.documentationFee)} · Survey ${formatCurrency(
                purchase.feeBreakdown.surveyFee
              )} · Levy ${formatCurrency(purchase.feeBreakdown.developmentLevy)}`}
            />
          </div>
        </LandCaseSection>

        <LandPurchaseSchedule
          installments={purchase.installments}
          canWaiveLateFee={canWaiveLateFee}
          purchaseEnded={ended}
          isWaiving={waiveLateFee.isPending}
          onWaive={(installmentId, reason) => waiveLateFee.mutateAsync({ installmentId, reason })}
        />

        <div className="grid gap-5 xl:grid-cols-2">
          <LandPurchaseMilestones
            milestones={purchase.milestones}
            releases={purchase.releases}
            canWaive={canWaiveMilestone}
            purchaseEnded={ended}
            isWaiving={waiveMilestone.isPending}
            onWaive={(milestoneKey, reason) => waiveMilestone.mutateAsync({ milestoneKey, reason })}
          />
          <LandPurchasePayments
            payments={purchase.payments}
            releases={purchase.releases}
            canAct={canWaiveLateFee}
            busyReleaseId={
              approvePayout.isPending
                ? (approvePayout.variables ?? null)
                : retryPayout.isPending
                  ? (retryPayout.variables ?? null)
                  : null
            }
            onApprove={(releaseId) => approvePayout.mutate(releaseId)}
            onRetry={(releaseId) => retryPayout.mutate(releaseId)}
          />
        </div>
      </div>
    </>
  );
}

function PurchaseSkeleton() {
  return (
    <div role="status" aria-label="Loading purchase" className="space-y-5">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <CardSkeleton lines={4} />
      <CardSkeleton lines={5} />
      <div className="grid gap-5 xl:grid-cols-2">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={4} />
      </div>
    </div>
  );
}
