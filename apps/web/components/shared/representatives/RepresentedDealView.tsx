'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  ListSkeleton,
  PageErrorState,
  PageHeader,
  Skeleton,
  Toast,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { LAND_MILESTONE_STATUS_LABELS, type LandMilestone } from '@/types/landBuyer';
import {
  representativeKeys,
  representativeService,
  type LandDealRef,
} from '@/services/representativeService';
import { PURCHASE_ROUTES } from '@/lib/constants/purchaseRoutes';

export const RepresentedDealView = ({ deal }: { deal: LandDealRef }) => {
  const queryClient = useQueryClient();
  const [approving, setApproving] = useState<LandMilestone | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );
  const isPurchase = 'purchaseId' in deal;
  const dealKey = isPurchase
    ? representativeKeys.purchase(deal.purchaseId)
    : representativeKeys.resale(deal.transactionId);

  const detail = useQuery({
    queryKey: dealKey,
    queryFn: async () => {
      if ('purchaseId' in deal) {
        const purchase = await unwrap(representativeService.purchase(deal.purchaseId));
        return {
          title: `${purchase.layoutName}, plot ${purchase.plotNumber}`,
          reference: purchase.reference,
          milestones: purchase.milestones,
        };
      }
      const milestones = await unwrap(representativeService.resale(deal.transactionId));
      return { title: 'Land resale', reference: undefined, milestones };
    },
  });
  const rule = useQuery({
    queryKey: [...representativeKeys.coApproval(deal), 'representative'],
    queryFn: () => unwrap(representativeService.representativeCoApproval(deal)),
    retry: false,
  });
  const approve = useMutation({
    mutationFn: (key: string) => unwrap(representativeService.approveStep(deal, key)),
    onSuccess: () => {
      setApproving(null);
      void queryClient.invalidateQueries({ queryKey: dealKey });
      void rule.refetch();
      setToast({ message: 'Your approval is recorded.', variant: 'success' });
    },
    onError: (reason: Error) => setToast({ message: reason.message, variant: 'error' }),
  });

  if (detail.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-7 w-56" />
        <ListSkeleton rows={4} variant="cards" label="Loading deal" />
      </div>
    );
  }
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
      <PageHeader
        breadcrumbs={[
          { label: 'Buyers I represent', href: PURCHASE_ROUTES.REPRESENTING },
          { label: detail.data.title },
        ]}
        title={detail.data.title}
        description={
          detail.data.reference ? (
            <span className="font-mono">{detail.data.reference}</span>
          ) : undefined
        }
      />
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
            <li key={m.id}>
              <Card className="p-4">
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
              </Card>
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
