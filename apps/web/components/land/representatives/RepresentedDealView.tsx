'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, ConfirmDialog, PageErrorState, Toast } from '@getrentos/ui';
import { ArrowLeft } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { LAND_MILESTONE_STATUS_LABELS, type LandMilestone } from '@/types/landBuyer';
import {
  landRepresentativeKeys,
  landRepresentativeService,
  type LandDealRef,
} from '@/services/landRepresentativeService';

/**
 * A buyer's deal as their representative sees it: the conveyance steps, and
 * where the two-person rule applies, the steps waiting for their approval.
 */
export const RepresentedDealView = ({ deal }: { deal: LandDealRef }) => {
  const queryClient = useQueryClient();
  const [approving, setApproving] = useState<LandMilestone | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );
  const isPurchase = 'purchaseId' in deal;
  const dealKey = isPurchase
    ? landRepresentativeKeys.purchase(deal.purchaseId)
    : landRepresentativeKeys.resale(deal.transactionId);

  const detail = useQuery({
    queryKey: dealKey,
    queryFn: async () => {
      if ('purchaseId' in deal) {
        const purchase = await unwrap(landRepresentativeService.purchase(deal.purchaseId));
        return {
          title: `${purchase.layoutName}, plot ${purchase.plotNumber}`,
          reference: purchase.reference,
          milestones: purchase.milestones,
        };
      }
      const milestones = await unwrap(landRepresentativeService.resale(deal.transactionId));
      return { title: 'Land resale', reference: undefined, milestones };
    },
  });
  const rule = useQuery({
    queryKey: [...landRepresentativeKeys.coApproval(deal), 'representative'],
    queryFn: () => unwrap(landRepresentativeService.representativeCoApproval(deal)),
    retry: false,
  });
  const approve = useMutation({
    mutationFn: (key: string) => unwrap(landRepresentativeService.approveStep(deal, key)),
    onSuccess: () => {
      setApproving(null);
      void queryClient.invalidateQueries({ queryKey: dealKey });
      void rule.refetch();
      setToast({ message: 'Your approval is recorded.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  if (detail.isLoading)
    return <div className="h-48 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  if (detail.isError || !detail.data) {
    return (
      <PageErrorState
        title="This deal is not available to you"
        description={detail.error instanceof Error ? detail.error.message : undefined}
        onRetry={() => detail.refetch()}
        isRetrying={detail.isRefetching}
      />
    );
  }
  const pending = new Map((rule.data?.pending ?? []).map((p) => [p.milestoneKey, p]));
  const iApprove = rule.data?.binding === true;

  return (
    <div className="space-y-6">
      <Link
        href="/land/representing"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Buyers I represent
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{detail.data.title}</h1>
        {detail.data.reference && (
          <p className="mt-1 font-mono text-sm text-muted-foreground">{detail.data.reference}</p>
        )}
      </div>
      {iApprove && (
        <p className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
          The buyer asked that money is only released with your approval too. Approve a step only
          once you have seen the document or been on site yourself.
        </p>
      )}
      <ol className="space-y-3">
        {detail.data.milestones.map((m) => {
          const awaiting = pending.get(m.key);
          const canApprove =
            iApprove && m.status === 'DELIVERED' && !(awaiting?.representativeApproved ?? false);
          return (
            <li key={m.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-foreground">{m.label}</p>
                <Badge
                  variant={
                    m.status === 'CONFIRMED' || m.status === 'WAIVED' ? 'success' : 'neutral'
                  }
                >
                  {LAND_MILESTONE_STATUS_LABELS[m.status]}
                </Badge>
              </div>
              {m.note && <p className="mt-1 text-sm text-muted-foreground">Seller: “{m.note}”</p>}
              {awaiting && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {awaiting.buyerApproved ? 'The buyer approved' : 'Waiting for the buyer'} ·{' '}
                  {awaiting.representativeApproved ? 'you approved' : 'waiting for you'}
                </p>
              )}
              {canApprove && (
                <Button size="sm" className="mt-2" onClick={() => setApproving(m)}>
                  Approve this step
                </Button>
              )}
            </li>
          );
        })}
      </ol>
      <ConfirmDialog
        open={approving !== null}
        onOpenChange={(open) => !open && setApproving(null)}
        title="Approve this step?"
        description={`"${approving?.label ?? ''}". Once the buyer has approved too, the seller is paid this step's share. Approve only what you have verified yourself.`}
        confirmLabel="Approve"
        isLoading={approve.isPending}
        onConfirm={() =>
          approving ? approve.mutateAsync(approving.key).catch(() => undefined) : undefined
        }
      />
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
