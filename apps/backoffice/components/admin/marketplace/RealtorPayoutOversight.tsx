'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, RotateCw } from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  PageErrorState,
  Pagination,
  Select,
  Toast,
  type BadgeVariant,
} from '@getrentos/ui';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';
import { adminMarketplaceService } from '@/services/adminMarketplaceService';
import type { AdminRealtorCommissionPayout, RealtorPayoutFilterStatus } from '@/types/marketplace';

const PAGE_SIZE = 10;

type StatusFilter = 'all' | RealtorPayoutFilterStatus;

/** The response lowercases the status; the filter takes the stored enum value. */
const STATUS_VARIANT: Record<AdminRealtorCommissionPayout['status'], BadgeVariant> = {
  pending: 'warning',
  success: 'success',
  failed: 'danger',
};

const STATUS_LABEL: Record<AdminRealtorCommissionPayout['status'], string> = {
  pending: 'Processing',
  success: 'Paid',
  failed: 'Failed',
};

const FILTER_LABEL: Record<RealtorPayoutFilterStatus, string> = {
  PENDING: 'Processing',
  SUCCESS: 'Paid',
  FAILED: 'Failed',
};

/** Failed first: a payout the bank sent back is the one that needs attention. */
const FILTER_ORDER: RealtorPayoutFilterStatus[] = ['FAILED', 'PENDING', 'SUCCESS'];

/**
 * Commission money leaving the platform to realtors.
 *
 * A failed payout is the reason this screen exists: the bank sent the money
 * back, but the payout keeps its claim on those commissions, so only a retry
 * releases them. Nothing else can pay them again.
 */
export const RealtorPayoutOversight = () => {
  const client = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [confirming, setConfirming] = useState<AdminRealtorCommissionPayout | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'realtor-payouts', { status, page }],
    queryFn: () =>
      unwrap(
        adminMarketplaceService.listRealtorPayouts({
          status: status === 'all' ? undefined : status,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });

  const retry = useMutation({
    mutationFn: (id: string) => unwrap(adminMarketplaceService.retryRealtorPayout(id)),
    onSuccess: async () => {
      setConfirming(null);
      setToast({ message: 'Payout sent again and audited.', variant: 'success' });
      await client.invalidateQueries({ queryKey: ['admin', 'realtor-payouts'] });
    },
    onError: (error: Error) => setToast({ message: error.message, variant: 'error' }),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Realtor commission payouts</h1>
          <p className="mt-1 text-muted-foreground">
            Every transfer of commission to a broker&apos;s bank, and a way to re-send one the bank
            rejected.
          </p>
        </div>
        <Select
          value={status}
          ariaLabel="Filter by payout status"
          onValueChange={(value) => {
            setStatus(value as StatusFilter);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          options={[
            { value: 'all', label: 'All payouts' },
            ...FILTER_ORDER.map((value) => ({ value, label: FILTER_LABEL[value] })),
          ]}
        />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {isError ? (
          <PageErrorState
            title="Could not load payouts"
            description="Realtor payouts are temporarily unavailable."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
            className="min-h-[220px] rounded-none border-0"
          />
        ) : isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="No payouts"
            description="Payouts appear here once a realtor withdraws earned commission."
          />
        ) : (
          <div className="divide-y divide-border">
            {items.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{p.realtorName ?? p.realtorId}</p>
                    <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(p.createdAt)} · {p.commissionCount} commission
                    {p.commissionCount === 1 ? '' : 's'} settled
                  </p>
                  {/* A failure is the bank sending money back: say why. */}
                  {p.status === 'failed' && p.failureReason && (
                    <p className="mt-0.5 text-sm text-red-600 dark:text-red-400">
                      {p.failureReason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold">{formatCurrency(p.amount)}</p>
                  {p.status === 'failed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setConfirming(p)}
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data?.total ?? 0}
          onPageChange={setPage}
        />
      </div>

      <ConfirmDialog
        open={Boolean(confirming)}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Send this payout again?"
        description={
          confirming
            ? `${formatCurrency(confirming.amount)} to ${
                confirming.realtorName ?? confirming.realtorId
              }. The bank rejected it once; retrying re-sends the same batch against the same commissions, so no commission can be paid twice.`
            : ''
        }
        confirmLabel="Send again"
        isLoading={retry.isPending}
        onConfirm={() => confirming && retry.mutate(confirming.id)}
      />

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
