'use client';

import { LegacyInput } from '@getrentos/ui';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Landmark, Flag, Send, Undo2 } from 'lucide-react';
import { DataTable, type Column } from '@getrentos/ui';
import { Badge, type BadgeVariant } from '@getrentos/ui';
import { EmptyState, PageErrorState } from '@getrentos/ui';
import { Pagination } from '@getrentos/ui';
import { cn } from '@getrentos/shared';
import { formatCurrency, formatDate } from '@getrentos/shared';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { hasAdminPermission } from '@/lib/adminAccess';
import { useAdminUser } from '../layout';
import { useAdminAction } from '@/hooks/useAdminAction';
import type { PlatformEscrowStatus, PlatformEscrowTransaction } from '@/types/admin';

const statusConfig: Record<PlatformEscrowStatus, { label: string; variant: BadgeVariant }> = {
  deposit_pending: { label: 'Deposit Pending', variant: 'neutral' },
  funds_held: { label: 'Funds Held', variant: 'info' },
  verification: { label: 'Verification', variant: 'warning' },
  final_payment: { label: 'Final Payment', variant: 'info' },
  released: { label: 'Released', variant: 'success' },
  frozen: { label: 'Frozen', variant: 'danger' },
  disputed: { label: 'Disputed', variant: 'danger' },
  refunded: { label: 'Refunded', variant: 'warning' },
};

/**
 * Where the platform is actually holding the buyer's money, so release/refund have
 * something to move. Mirrors `HOLDABLE_ESCROW_STATUSES` on the API — a deposit that
 * has not been paid cannot be released or refunded, and offering the button for it
 * would only produce a rejection.
 */
const SETTLEABLE_STATUSES: PlatformEscrowStatus[] = ['funds_held', 'verification', 'final_payment'];

type StatusFilter = 'all' | PlatformEscrowStatus;

const PAGE_SIZE = 10;

export default function AdminEscrowPage() {
  const user = useAdminUser();
  const canSettle = hasAdminPermission(user?.roles, 'escrow.approve');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const actions = useAdminAction({ invalidateKeys: [['admin', 'escrow']] });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.escrowTransactions({
      search: debouncedSearch,
      status: statusFilter,
      page,
      pageSize: PAGE_SIZE,
    }),
    queryFn: () =>
      unwrap(
        adminService.listEscrowTransactions({
          search: debouncedSearch || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const transactions = data?.items ?? [];
  const total = data?.total ?? 0;

  const { data: flaggedData, isError: flaggedCountError } = useQuery({
    queryKey: ['admin', 'escrow', 'flagged-count'],
    queryFn: () =>
      unwrap(adminService.listEscrowTransactions({ flagged: true, page: 1, pageSize: 1 })),
  });
  const flaggedCount = flaggedData?.total ?? 0;

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'deposit_pending', label: 'Deposit Pending' },
    { value: 'funds_held', label: 'Funds Held' },
    { value: 'verification', label: 'Verification' },
    { value: 'final_payment', label: 'Final Payment' },
    { value: 'released', label: 'Released' },
    { value: 'frozen', label: 'Frozen' },
    { value: 'disputed', label: 'Disputed' },
    { value: 'refunded', label: 'Refunded' },
  ];

  const columns: Column<PlatformEscrowTransaction>[] = [
    {
      key: 'property',
      header: 'Property',
      render: (t) => t.propertyTitle,
      className: 'font-medium text-foreground whitespace-nowrap',
    },
    {
      key: 'buyer',
      header: 'Buyer',
      render: (t) => t.buyerName,
      className: 'text-muted-foreground whitespace-nowrap',
    },
    {
      key: 'seller',
      header: 'Seller',
      render: (t) => t.sellerName,
      className: 'text-muted-foreground whitespace-nowrap',
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (t) => formatCurrency(t.amount, { compact: true }),
      className: 'text-foreground whitespace-nowrap',
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => (
        <Badge variant={statusConfig[t.status].variant}>{statusConfig[t.status].label}</Badge>
      ),
      className: 'whitespace-nowrap',
    },
    {
      key: 'created',
      header: 'Created',
      render: (t) => formatDate(t.createdAt),
      className: 'text-muted-foreground whitespace-nowrap',
    },
    {
      key: 'actions',
      header: '',
      render: (t) => {
        const settling = SETTLEABLE_STATUSES.includes(t.status);
        const busy = actions.processingKey !== null;
        const amount = formatCurrency(t.amount, { compact: true });
        return (
          <div className="flex items-center justify-end gap-1">
            {canSettle && settling && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (busy) return;
                    actions.request({
                      key: `release:${t.id}`,
                      title: 'Release these funds to the seller?',
                      description: `${amount} held for ${t.propertyTitle} will be released to ${t.sellerName}. This settles the escrow and cannot be reversed from here.`,
                      confirmLabel: 'Release funds',
                      successMessage: `${amount} released to ${t.sellerName}.`,
                      run: () => adminService.releaseEscrow(t.id),
                    });
                  }}
                  disabled={busy}
                  aria-label={`Release escrow funds for ${t.propertyTitle}`}
                  className="p-1.5 rounded-lg text-muted-foreground transition-colors hover:text-emerald-600 hover:bg-secondary dark:hover:text-emerald-400 disabled:opacity-50"
                  title={`Release ${amount} to the seller`}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (busy) return;
                    actions.request({
                      key: `refund:${t.id}`,
                      title: 'Refund these funds to the buyer?',
                      description: `${amount} held for ${t.propertyTitle} will be returned to ${t.buyerName}. This settles the escrow and cannot be reversed from here.`,
                      confirmLabel: 'Refund buyer',
                      successMessage: `${amount} refunded to ${t.buyerName}.`,
                      run: () => adminService.refundEscrow(t.id),
                    });
                  }}
                  disabled={busy}
                  aria-label={`Refund escrow funds for ${t.propertyTitle}`}
                  className="p-1.5 rounded-lg text-muted-foreground transition-colors hover:text-amber-600 hover:bg-secondary dark:hover:text-amber-400 disabled:opacity-50"
                  title={`Refund ${amount} to the buyer`}
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (busy) return;
                actions.request({
                  key: `flag:${t.id}`,
                  title: t.flagged ? 'Remove review flag?' : 'Flag escrow transaction?',
                  description: `${t.propertyTitle} (${amount}) will be ${
                    t.flagged ? 'removed from' : 'added to'
                  } the manual review queue.`,
                  confirmLabel: t.flagged ? 'Remove flag' : 'Flag for review',
                  successMessage: t.flagged
                    ? 'Transaction removed from the review queue.'
                    : 'Transaction added to the review queue.',
                  run: () => adminService.toggleEscrowFlag(t.id, !t.flagged),
                });
              }}
              disabled={busy}
              aria-label={
                t.flagged ? 'Remove transaction review flag' : 'Flag transaction for review'
              }
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                t.flagged
                  ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
                  : 'text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-secondary',
                busy && 'opacity-50'
              )}
              title={t.flagged ? 'Unflag transaction' : 'Flag for review'}
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
      className: 'text-right',
    },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Escrow Oversight</h1>
        <p className="text-muted-foreground mt-1">
          Platform-wide monitoring of escrow transactions ·{' '}
          {flaggedCountError ? 'flagged count unavailable' : `${flaggedCount} flagged for review`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by property, buyer, or seller..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto mb-6">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setStatusFilter(option.value);
              setPage(1);
            }}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
              statusFilter === option.value
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isError ? (
        <PageErrorState
          title="Could not load escrow transactions"
          description="Escrow records are temporarily unavailable. Your search and status filter have been preserved."
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      ) : (
        <DataTable
          columns={columns}
          data={transactions}
          isLoading={isLoading}
          getRowKey={(t) => t.id}
          getRowClassName={(t) => (t.flagged ? 'bg-red-50/50 dark:bg-red-900/10' : undefined)}
          emptyState={<EmptyState icon={Landmark} title="No transactions match your filters" />}
          footer={
            total > 0 && (
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
            )
          }
        />
      )}

      {actions.feedback}
    </>
  );
}
