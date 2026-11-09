'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck } from '@sureground/icons';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  PageHeader,
  useToast,
} from '@sureground/ui';
import { formatCurrency, unwrap } from '@sureground/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import {
  adminPaymentCorrectionsService,
  type CorrectionCategory,
  type CorrectionPreview,
} from '@/services/adminPaymentCorrectionsService';

const TITLE: Record<CorrectionCategory, string> = {
  K1: 'Cash dues counted as held',
  K2: 'Agency commission not charged to owners',
  K3: 'Vendor invoices not charged to owners',
  K4: 'Seller overpayments to write off',
};

const SHOWN = 10;

export default function PaymentCorrectionsPage() {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canApply = hasAdminPermission(user?.roles, 'rentfinance.approve');
  const toast = useToast();
  const [confirming, setConfirming] = useState<CorrectionPreview | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'payment-corrections'],
    queryFn: () => unwrap(adminPaymentCorrectionsService.preview()),
  });

  const apply = useMutation({
    mutationFn: (category: CorrectionCategory) =>
      unwrap(adminPaymentCorrectionsService.apply(category)),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-corrections'] });
      setConfirming(null);
      toast.success(
        result.applied === 0
          ? 'Nothing left to apply.'
          : `${result.applied} applied, ${formatCurrency(result.totalNaira)} in total.`
      );
    },
    onError: (e: Error) => toast.error(e.message || 'Could not apply the correction.'),
  });

  const previews = query.data ?? [];
  const outstanding = previews.filter((p) => p.items.length > 0);

  return (
    <>
      <PageHeader
        title="Payment corrections"
        description="Records the old payout behaviour left wrong, and the correction the owner approved for each. Check the list, then apply one category at a time: each correction is written once, and owners are told before it shows on their statement."
      />

      {query.isLoading ? (
        <ListSkeleton variant="cards" />
      ) : query.isError && !query.data ? (
        <PageErrorState
          title="Could not load corrections"
          description={(query.error as Error).message}
          onRetry={() => query.refetch()}
        />
      ) : outstanding.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Nothing to correct"
          description="No record is waiting for a correction."
        />
      ) : (
        <div className="space-y-3">
          {outstanding.map((p) => (
            <Card key={p.category} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{TITLE[p.category]}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{p.treatment}</p>
                </div>
                <Badge variant="warning">
                  {p.items.length} · {formatCurrency(p.totalNaira)}
                </Badge>
              </div>

              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {p.items.slice(0, SHOWN).map((item) => (
                  <li key={item.sourceId}>
                    {formatCurrency(item.naira)} · {item.label} · {item.sourceId}
                  </li>
                ))}
                {p.items.length > SHOWN ? <li>and {p.items.length - SHOWN} more</li> : null}
              </ul>

              {canApply ? (
                <Button className="mt-4" variant="outline" onClick={() => setConfirming(p)}>
                  Apply
                </Button>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  Applying needs the rent-finance approval permission.
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={confirming ? `Apply: ${TITLE[confirming.category]}` : ''}
        description={
          confirming
            ? `${confirming.items.length} records, ${formatCurrency(confirming.totalNaira)} in total. ${confirming.treatment} This is written to the books and cannot be undone except by another correction.`
            : ''
        }
        confirmLabel="Apply"
        tone="danger"
        isLoading={apply.isPending}
        onConfirm={() => confirming && apply.mutate(confirming.category)}
      />
    </>
  );
}
