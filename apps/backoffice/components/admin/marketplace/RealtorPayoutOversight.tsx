'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, RotateCw } from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  Pagination,
  Select,
  useToast,
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
  const toast = useToast();

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
    placeholderData: keepPreviousData,
  });

  const retry = useMutation({
    mutationFn: (id: string) => unwrap(adminMarketplaceService.retryRealtorPayout(id)),
    onSuccess: async () => {
      setConfirming(null);
      toast.success('Payout sent again and audited.');
      await client.invalidateQueries({ queryKey: ['admin', 'realtor-payouts'] });
    },
    onError: (error: Error) => toast.error(error.message),
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
          searchable={false}
          className="w-full sm:w-52"
          options={[
            { value: 'all', label: 'All payouts' },
            ...FILTER_ORDER.map((value) => ({ value, label: FILTER_LABEL[value] })),
          ]}
        />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <ListSkeleton rows={5} className="rounded-none border-0" />
        ) : isError && !data ? (
          <PageErrorState
            title="Could not load payouts"
            description="Realtor payouts are temporarily unavailable."
            onRetry={() => void refetch()}
            isRetrying={isFetching}
            className="min-h-[220px] rounded-none border-0"
          />
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
                    <p className="mt-0.5 text-sm text-destructive">{p.failureReason}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <p className="font-semibold">{formatCurrency(p.amount)}</p>
                  {p.status === 'failed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<RotateCw className="h-3.5 w-3.5" />}
                      onClick={() => setConfirming(p)}
                    >
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
    </div>
  );
};
