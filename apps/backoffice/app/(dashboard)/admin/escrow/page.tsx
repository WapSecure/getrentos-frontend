'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Landmark, Flag, Lock, Send, Undo2 } from '@sureground/icons';
import {
  DataTable,
  IconButton,
  PageHeader,
  SearchInput,
  StatGroup,
  type Column,
} from '@sureground/ui';
import { FilterChips, OpsToolbar } from '@/components/admin/ops/OpsParts';
import { Badge, type BadgeVariant } from '@sureground/ui';
import { EmptyState, PageErrorState } from '@sureground/ui';
import { Pagination } from '@sureground/ui';
import { formatCurrency, formatDate } from '@sureground/shared';
import { adminService } from '@/services/adminService';
import { unwrap } from '@sureground/shared';
import { adminKeys } from '@/lib/queryKeys';
import { hasAdminPermission } from '@/lib/adminAccess';
import { useAdminUser } from '../layout';
import { useAdminAction } from '@/hooks/useAdminAction';
import type { PlatformEscrowStatus, PlatformEscrowTransaction } from '@/types/admin';

const statusConfig: Record<PlatformEscrowStatus, { label: string; variant: BadgeVariant }> = {
  deposit_pending: { label: 'Deposit pending', variant: 'neutral' },
  funds_held: { label: 'Funds held', variant: 'info' },
  verification: { label: 'Verification', variant: 'warning' },
  final_payment: { label: 'Final payment', variant: 'info' },
  released: { label: 'Released', variant: 'success' },
  frozen: { label: 'Frozen', variant: 'danger' },
  disputed: { label: 'Disputed', variant: 'danger' },
  refunded: { label: 'Refunded', variant: 'warning' },
};

// Only these statuses hold money (mirrors HOLDABLE_ESCROW_STATUSES on the API); offering release or refund on others only earns a rejection.
const SETTLEABLE_STATUSES: PlatformEscrowStatus[] = ['funds_held', 'verification', 'final_payment'];

// Money sits with us only from the deposit until it is released or refunded; the price is never held.
const HOLDING_STATUSES: PlatformEscrowStatus[] = [...SETTLEABLE_STATUSES, 'frozen', 'disputed'];

function heldCell(t: PlatformEscrowTransaction): { text: string; muted: boolean } {
  const held = formatCurrency(t.heldAmount, { compact: true });
  if (HOLDING_STATUSES.includes(t.status)) return { text: held, muted: false };
  if (t.status === 'released') return { text: `None (${held} released)`, muted: true };
  if (t.status === 'refunded') return { text: `None (${held} refunded)`, muted: true };
  return { text: 'None yet', muted: true };
}

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

  const { data, error, isLoading, isError, isFetching, refetch } = useQuery({
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
    placeholderData: keepPreviousData,
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
    { value: 'deposit_pending', label: 'Deposit pending' },
    { value: 'funds_held', label: 'Funds held' },
    { value: 'released', label: 'Released' },
    { value: 'frozen', label: 'Frozen' },
    { value: 'refunded', label: 'Refunded' },
  ];

  const columns: Column<PlatformEscrowTransaction>[] = [
    {
      key: 'property',
      header: 'Property',
      render: (t) => (
        <div>
          <div className="flex items-center gap-1.5">
            {t.flagged && (
              <>
                <Flag className="h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden="true" />
                <span className="sr-only">Flagged: </span>
              </>
            )}
            {t.propertyTitle}
          </div>
          {t.flagged && t.flaggedReason && (
            <div className="mt-0.5 max-w-xs whitespace-normal text-xs font-normal text-destructive">
              {t.flaggedReason}
            </div>
          )}
        </div>
      ),
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
      key: 'held',
      header: 'Held',
      numeric: true,
      render: (t) => {
        const held = heldCell(t);
        return (
          <div>
            <div className={held.muted ? 'text-muted-foreground' : undefined}>{held.text}</div>
            <div className="text-xs text-muted-foreground">
              Sale price {formatCurrency(t.amount, { compact: true })}
            </div>
          </div>
        );
      },
      className: 'text-foreground whitespace-nowrap',
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => (
        <Badge variant={statusConfig[t.status].variant} dot>
          {statusConfig[t.status].label}
        </Badge>
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
      srHeader: 'Actions',
      render: (t) => {
        const settling = SETTLEABLE_STATUSES.includes(t.status);
        const busy = actions.processingKey !== null;
        const amount = formatCurrency(t.amount, { compact: true });
        // Release and refund move the deposit escrow holds, not the sale price.
        const held = formatCurrency(t.heldAmount, { compact: true });
        return (
          <div className="flex items-center justify-end gap-1">
            {canSettle && settling && (
              <>
                <IconButton
                  size="sm"
                  icon={<Send />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (busy) return;
                    actions.request({
                      key: `release:${t.id}`,
                      title: 'Release these funds to the seller?',
                      // A buyer's confirmation of receipt releases the deposit itself, so anything still held here has not been confirmed.
                      description: `${t.buyerName} has not confirmed receipt. Release only if you have checked the handover yourself. ${held} held for ${t.propertyTitle} (sale price ${amount}) will be released to ${t.sellerName}. This settles the escrow and cannot be reversed from here.`,
                      confirmLabel: 'Release funds',
                      successMessage: `${held} released to ${t.sellerName}.`,
                      run: () => adminService.releaseEscrow(t.id),
                    });
                  }}
                  disabled={busy}
                  isLoading={actions.processingKey === `release:${t.id}`}
                  label={`Release escrow funds for ${t.propertyTitle}`}
                  className="hover:text-success"
                  title={`Release ${held} to the seller`}
                />
                <IconButton
                  size="sm"
                  icon={<Undo2 />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (busy) return;
                    actions.request({
                      key: `refund:${t.id}`,
                      title: 'Refund these funds to the buyer?',
                      description: `${held} held for ${t.propertyTitle} (sale price ${amount}) will be returned to ${t.buyerName}. This settles the escrow and cannot be reversed from here.`,
                      confirmLabel: 'Refund buyer',
                      successMessage: `${held} refunded to ${t.buyerName}.`,
                      run: () => adminService.refundEscrow(t.id),
                    });
                  }}
                  disabled={busy}
                  isLoading={actions.processingKey === `refund:${t.id}`}
                  label={`Refund escrow funds for ${t.propertyTitle}`}
                  className="hover:text-warning"
                  title={`Refund ${held} to the buyer`}
                />
              </>
            )}
            <IconButton
              size="sm"
              icon={<Flag />}
              variant={t.flagged ? 'danger' : 'ghost'}
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
              isLoading={actions.processingKey === `flag:${t.id}`}
              label={t.flagged ? 'Remove transaction review flag' : 'Flag transaction for review'}
              className={t.flagged ? 'bg-destructive-subtle' : 'hover:text-destructive'}
              title={t.flagged ? 'Unflag transaction' : 'Flag for review'}
            />
          </div>
        );
      },
      className: 'text-right',
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Escrow oversight"
        description={
          <>
            Platform-wide monitoring of escrow transactions ·{' '}
            {flaggedCountError ? 'flagged count unavailable' : `${flaggedCount} flagged for review`}
          </>
        }
      />

      <StatGroup
        title="Escrow at a glance"
        className="mb-6"
        items={[
          {
            label: 'Flagged for review',
            value: flaggedCountError ? '–' : (flaggedData?.total ?? '–'),
            subtitle: flaggedCountError ? 'Count unavailable' : 'In the manual review queue',
            icon: Flag,
            attention: flaggedCount > 0,
          },
          {
            label:
              statusFilter === 'all'
                ? 'Transactions'
                : `${statusOptions.find((option) => option.value === statusFilter)?.label ?? 'Matching'} transactions`,
            value: data ? total : '–',
            subtitle: debouncedSearch ? 'Matching your search' : 'In the current view',
            icon: Lock,
          },
        ]}
      />

      <OpsToolbar className="mb-3">
        <SearchInput
          value={searchQuery}
          onValueChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          label="Search escrow transactions"
          placeholder="Search by property, buyer, or seller..."
          className="flex-1 max-w-sm"
        />
      </OpsToolbar>

      <FilterChips
        label="Filter escrow transactions by status"
        value={statusFilter}
        onChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        options={statusOptions}
        className="mb-5"
      />

      {isError && !data ? (
        <PageErrorState
          error={error}
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
          getRowClassName={(t) => (t.flagged ? 'bg-destructive-subtle/50' : undefined)}
          caption="Escrow transactions"
          emptyState={
            <EmptyState
              icon={Landmark}
              title="No transactions match your filters"
              description="Try another property, buyer or seller, or clear the status filter."
            />
          }
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
