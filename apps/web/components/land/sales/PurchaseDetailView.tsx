'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, ConfirmDialog, PageErrorState } from '@getrentos/ui';
import { AlertTriangle, ArrowLeft, Ban, FileDown } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { landDeveloperKeys } from '@/lib/landDeveloperQueryKeys';
import { LAND_DEVELOPER_ROUTES } from '@/lib/constants/landDeveloperRoutes';
import { landDeveloperService } from '@/services/landDeveloperService';
import type {
  LandMilestone,
  LandMilestoneDeliverInput,
  LandPurchaseDetail,
  LandSaleDocumentKind,
} from '@/types/landDeveloper';
import { errorMessage, useNotify } from '../developer/feedback';
import { FULL_PAYMENT_MILESTONES, PURCHASE_STATUS } from '../developer/labels';
import { formatBps, refundPreview } from '../developer/planPricing';
import { DeliverMilestoneDialog } from './DeliverMilestoneDialog';
import { InstallmentSchedule } from './InstallmentSchedule';
import { MilestoneList, type MilestoneDeliverability } from './MilestoneList';
import { PurchasePayments } from './PurchasePayments';
import { useOwnerLayouts } from './useOwnerLayouts';

const DELIVERABLE = new Set(['ACTIVE', 'PAID_IN_FULL', 'DEFAULTED']);

/** Mirrors the server's rules, so a blocked step says why instead of failing on click. */
const deliverabilityFor =
  (purchase: LandPurchaseDetail) =>
  (milestone: LandMilestone): MilestoneDeliverability => {
    if (purchase.status === 'PENDING_DEPOSIT') {
      return { allowed: false, reason: 'Conveyance starts once the deposit is paid.' };
    }
    if (!DELIVERABLE.has(purchase.status)) {
      return { allowed: false, reason: 'This purchase has ended.' };
    }
    if (FULL_PAYMENT_MILESTONES.has(milestone.key) && purchase.status !== 'PAID_IN_FULL') {
      return { allowed: false, reason: 'Follows full payment of the plot.' };
    }
    return { allowed: true };
  };

const Figure = ({ label, value, tone }: { label: string; value: string; tone?: string }) => (
  <div>
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className={`mt-0.5 font-semibold ${tone ?? 'text-foreground'}`}>{value}</dd>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card static className="p-5">
    <h2 className="mb-4 text-base font-semibold text-foreground">{title}</h2>
    {children}
  </Card>
);

/** One plot purchase, from the seller's side. */
export const PurchaseDetailView = ({ purchaseId }: { purchaseId: string }) => {
  const queryClient = useQueryClient();
  const { notify, toast } = useNotify();
  const [delivering, setDelivering] = useState<LandMilestone | null>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [downloading, setDownloading] = useState<LandSaleDocumentKind | null>(null);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: landDeveloperKeys.purchase(purchaseId),
    queryFn: () => unwrap(landDeveloperService.getPurchase(purchaseId)),
  });
  // A purchase names its layout, not its land; the layout list says which parcel that is.
  const layouts = useOwnerLayouts();
  const propertyId =
    data?.propertyId ?? layouts.data?.find((layout) => layout.id === data?.layoutId)?.propertyId;

  const applyDetail = (detail: LandPurchaseDetail) => {
    queryClient.setQueryData(landDeveloperKeys.purchase(purchaseId), detail);
    queryClient.invalidateQueries({ queryKey: landDeveloperKeys.purchases, exact: false });
  };

  const deliver = useMutation({
    mutationFn: ({
      milestone,
      input,
    }: {
      milestone: LandMilestone;
      input: LandMilestoneDeliverInput;
    }) => unwrap(landDeveloperService.deliverPurchaseMilestone(purchaseId, milestone.key, input)),
    onSuccess: (detail, { milestone, input }) => {
      applyDetail(detail);
      if (input.documentId && propertyId) {
        queryClient.invalidateQueries({ queryKey: landDeveloperKeys.documents(propertyId) });
      }
      setDelivering(null);
      notify(`${milestone.label}: marked delivered. The buyer has been asked to confirm.`);
    },
    onError: (reason) => notify(errorMessage(reason), 'error'),
  });

  const revoke = useMutation({
    mutationFn: () => unwrap(landDeveloperService.revokePurchase(purchaseId, reason.trim())),
    onSuccess: (detail) => {
      applyDetail(detail);
      queryClient.invalidateQueries({ queryKey: landDeveloperKeys.all });
      setReason('');
      notify('Purchase revoked. The plot is back on sale and the buyer has been told.', 'info');
    },
    onError: (reason) => notify(errorMessage(reason), 'error'),
  });

  const download = async (kind: LandSaleDocumentKind) => {
    if (!data) return;
    setDownloading(kind);
    try {
      await unwrap(landDeveloperService.downloadSaleDocument(purchaseId, kind, data.reference));
    } catch (reason) {
      notify(errorMessage(reason), 'error');
    } finally {
      setDownloading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
        <div className="h-64 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <PageErrorState
        title="This purchase could not be loaded"
        description={errorMessage(error)}
        onRetry={() => refetch()}
        isRetrying={isRefetching}
      />
    );
  }

  const status = PURCHASE_STATUS[data.status] ?? {
    label: data.status,
    variant: 'neutral' as const,
  };
  const refund = refundPreview(data.amountPaid, data.installments, data.terms.revocationChargeBps);
  const plotName = `${data.block ? `Block ${data.block}, ` : ''}Plot ${data.plotNumber}`;

  return (
    <>
      <Link
        href={LAND_DEVELOPER_ROUTES.purchases()}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Plot sales
      </Link>

      <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">
              {data.reference}
            </h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {plotName} · {data.layoutName} · {data.buyerName ?? 'Buyer'} · {data.planName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            rounded="lg"
            isLoading={downloading === 'contract-of-sale'}
            onClick={() => download('contract-of-sale')}
            icon={<FileDown className="h-4 w-4" />}
          >
            Contract of sale
          </Button>
          <Button
            variant="outline"
            size="sm"
            rounded="lg"
            disabled={data.status === 'PENDING_DEPOSIT'}
            title={
              data.status === 'PENDING_DEPOSIT'
                ? 'A letter of allocation is issued once the deposit is paid'
                : undefined
            }
            isLoading={downloading === 'allocation-letter'}
            onClick={() => download('allocation-letter')}
            icon={<FileDown className="h-4 w-4" />}
          >
            Allocation letter
          </Button>
          {data.status === 'DEFAULTED' && (
            <Button
              variant="danger"
              size="sm"
              rounded="lg"
              onClick={() => setRevokeOpen(true)}
              icon={<Ban className="h-4 w-4" />}
            >
              Revoke
            </Button>
          )}
        </div>
      </div>

      {data.status === 'DEFAULTED' && (
        <div className="mt-4 flex gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-foreground">
            This purchase defaulted{data.defaultedAt ? ` on ${formatDate(data.defaultedAt)}` : ''}.
            You can revoke it to put the plot back on sale; the buyer is refunded what they paid
            less the {formatBps(data.terms.revocationChargeBps)} forfeiture.
          </p>
        </div>
      )}
      {data.status === 'REVOKED' && (
        <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-3 text-sm text-foreground">
          Revoked{data.revokedAt ? ` on ${formatDate(data.revokedAt)}` : ''}.
          {data.revocationReason && (
            <span className="text-muted-foreground"> {data.revocationReason}</span>
          )}
          {data.refundDue !== undefined && (
            <span className="block text-muted-foreground">
              Refund due to the buyer: {formatCurrency(data.refundDue)}
            </span>
          )}
        </div>
      )}

      <div className="mt-6 space-y-6">
        <Section title="Money">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Figure label="Plot price" value={formatCurrency(data.plotPrice)} />
            <Figure label="Premium + fees" value={formatCurrency(data.priceUplift + data.fees)} />
            <Figure label="Total price" value={formatCurrency(data.totalPrice)} />
            <Figure label="Paid" value={formatCurrency(data.amountPaid)} tone="text-success" />
            <Figure
              label="Outstanding"
              value={formatCurrency(data.outstandingBalance)}
              tone={data.nextDue?.overdue ? 'text-destructive' : undefined}
            />
            <Figure label="Released to you" value={formatCurrency(data.releasedToSeller)} />
          </dl>
          {data.nextDue && (
            <p className="mt-4 text-sm text-muted-foreground">
              Next: {data.nextDue.label}, {formatCurrency(data.nextDue.amount)}{' '}
              {data.nextDue.overdue ? 'overdue since' : 'due'} {formatDate(data.nextDue.dueDate)}.
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Terms frozen at purchase:{' '}
            {data.terms.durationMonths === 0 ? 'outright' : `${data.terms.durationMonths} months`},{' '}
            {formatBps(data.terms.initialDepositBps)} deposit, {formatBps(data.terms.lateFeeBps)}{' '}
            late fee after {data.terms.gracePeriodDays} days&apos; grace, default after{' '}
            {data.terms.defaultAfterDays} days.
          </p>
        </Section>

        <Section title="Conveyance">
          <MilestoneList
            milestones={data.milestones}
            deliverability={deliverabilityFor(data)}
            onDeliver={setDelivering}
            showRelease
          />
        </Section>

        <Section title="Installment schedule">
          <InstallmentSchedule installments={data.installments} />
        </Section>

        <Section title="Payments and releases">
          <PurchasePayments payments={data.payments} releases={data.releases} />
        </Section>
      </div>

      <DeliverMilestoneDialog
        milestone={delivering}
        propertyId={propertyId}
        onOpenChange={(open) => !open && setDelivering(null)}
        isSaving={deliver.isPending}
        onDeliver={(milestone, input) => deliver.mutate({ milestone, input })}
      />

      <ConfirmDialog
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        title={`Revoke ${data.reference}?`}
        description={`${plotName} goes back on sale and the contract ends. From ${formatCurrency(refund.principalPaid)} paid towards the price${
          refund.lateFeesPaid > 0
            ? ` (late fees of ${formatCurrency(refund.lateFeesPaid)} are kept)`
            : ''
        }, ${formatCurrency(refund.charge)} is forfeited (${formatBps(data.terms.revocationChargeBps)}) and about ${formatCurrency(refund.refund)} is refunded to the buyer. This cannot be undone.`}
        confirmLabel="Revoke purchase"
        promptLabel="Reason for revoking (kept on the purchase record)"
        promptPlaceholder="e.g. Three installments unpaid despite reminders since March."
        promptValue={reason}
        onPromptChange={setReason}
        promptRequired
        promptMinLength={5}
        isLoading={revoke.isPending}
        onConfirm={async () => {
          try {
            await revoke.mutateAsync();
          } catch {
            // Reported by onError.
          }
        }}
      />

      {toast}
    </>
  );
};
