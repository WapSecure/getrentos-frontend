'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Building2, CreditCard, ReceiptText, TriangleAlert, TrendingUp } from '@sureground/icons';
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  PageErrorState,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  StatGridSkeleton,
  TableSkeleton,
  type BadgeVariant,
  type Column,
} from '@sureground/ui';
import { formatCurrency, formatDate, unwrap } from '@sureground/shared';
import { adminSubscriptionService } from '@/services/adminSubscriptionService';
import type { AdminEstateSubscription, SubscriptionStatus } from '@/types/subscription';
import { INVOICE_COLUMNS } from './SubscriptionsOverview';

const PAGE_SIZE = 20;

const STATUS_VARIANT: Record<SubscriptionStatus, BadgeVariant> = {
  TRIALING: 'info',
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  CANCELLED: 'neutral',
  NONE: 'neutral',
};

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  TRIALING: 'Trial',
  ACTIVE: 'Active',
  PAST_DUE: 'Past due',
  CANCELLED: 'Cancelled',
  NONE: 'Not started',
};

const naira = (kobo: number | null) => (kobo == null ? '—' : formatCurrency(kobo / 100));
const formatDay = (iso: string | null) => (iso ? formatDate(iso) : '—');

/** Read-only: an estate's owner changes Estate Pro from the estate's billing page. */
export const EstateProSubscriptions = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [invoicesFor, setInvoicesFor] = useState<string | null>(null);

  const overview = useQuery({
    queryKey: ['admin', 'estate-subscriptions', 'overview'],
    queryFn: () => unwrap(adminSubscriptionService.getEstateOverview()),
  });
  const list = useQuery({
    queryKey: ['admin', 'estate-subscriptions', 'list', { search, status, page }],
    queryFn: () =>
      unwrap(
        adminSubscriptionService.listEstates({
          search: search.trim() || undefined,
          status: status || undefined,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });

  const stats = overview.data;
  const items = list.data?.items ?? [];
  const cards = stats
    ? [
        { label: 'MRR', value: formatCurrency(stats.mrrKobo / 100), icon: TrendingUp },
        { label: 'Estates on Pro', value: stats.inForce, icon: Building2 },
        { label: 'Trialing', value: stats.trialing, icon: CreditCard },
        { label: 'Past due', value: stats.pastDue, icon: TriangleAlert, warn: stats.pastDue > 0 },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estate Pro"
        description="Plans billed per estate: trials, renewals, failed payments and cancellations. Only an estate's owner can change its plan."
      />

      {overview.isLoading ? (
        <StatGridSkeleton />
      ) : overview.isError && !stats ? (
        <PageErrorState
          title="Could not load the Estate Pro pulse"
          onRetry={() => void overview.refetch()}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.label} className="p-5">
              <div className="flex items-center gap-2">
                <card.icon
                  className={card.warn ? 'h-4 w-4 text-warning' : 'h-4 w-4 text-muted-foreground'}
                />
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {card.label}
                </p>
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{card.value}</p>
            </Card>
          ))}
        </div>
      )}

      {stats && (
        <p className="text-sm text-muted-foreground">
          {stats.estateProFrom
            ? `Estate Pro applies from ${formatDay(stats.estateProFrom)}.`
            : 'Estate Pro is switched off: estates follow their owner’s personal plan until ESTATE_PRO_FROM is set.'}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onValueChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by estate or payer"
          label="Search Estate Pro plans"
          className="min-w-[260px] flex-1"
        />
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          ariaLabel="Filter by status"
          searchable={false}
          className="w-full sm:w-48"
          options={[
            { value: '', label: 'All statuses' },
            ...(['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED'] as const).map((value) => ({
              value,
              label: STATUS_LABEL[value],
            })),
          ]}
        />
      </div>

      {list.isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : list.isError && !list.data ? (
        <PageErrorState
          title="Could not load Estate Pro plans"
          onRetry={() => void list.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={search || status ? 'No estates match' : 'No estates on Estate Pro yet'}
          description={
            search || status
              ? 'Try a different estate, payer or status.'
              : 'Estates appear here once their owner starts a trial or a plan.'
          }
        />
      ) : (
        <DataTable
          caption="Estate Pro plans"
          columns={estateColumns(invoicesFor, (estateId) =>
            setInvoicesFor((current) => (current === estateId ? null : estateId))
          )}
          data={items}
          getRowKey={(row) => row.estateId}
          renderExpanded={(row) =>
            invoicesFor === row.estateId ? <EstateInvoices estateId={row.estateId} /> : null
          }
        />
      )}

      {list.data && list.data.total > PAGE_SIZE && (
        <Pagination
          page={list.data.page}
          pageSize={PAGE_SIZE}
          total={list.data.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

function estateColumns(
  invoicesFor: string | null,
  onToggleInvoices: (estateId: string) => void
): Column<AdminEstateSubscription>[] {
  return [
    {
      key: 'estate',
      header: 'Estate',
      render: (row) => (
        <>
          <p className="text-sm font-medium text-foreground">{row.estateName}</p>
          <p className="text-xs text-muted-foreground">
            {row.organizationName} · {row.households} household{row.households === 1 ? '' : 's'}
          </p>
        </>
      ),
    },
    {
      key: 'payer',
      header: 'Paid by',
      render: (row) => (
        <>
          <p className="text-sm text-foreground">{row.payerName ?? 'Account deleted'}</p>
          <p className="text-xs text-muted-foreground">{row.payerEmail ?? '—'}</p>
        </>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (row) => (
        <>
          <p className="text-sm text-foreground">
            {row.cycle === 'ANNUAL' ? 'Annual' : row.cycle === 'MONTHLY' ? 'Monthly' : '—'}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.priceKobo == null
              ? '—'
              : `${naira(row.priceKobo)}/${row.cycle === 'ANNUAL' ? 'yr' : 'mo'}`}
          </p>
        </>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <>
          <Badge variant={STATUS_VARIANT[row.status]}>{STATUS_LABEL[row.status]}</Badge>
          {row.status === 'PAST_DUE' && row.isActive && (
            <p className="mt-1 text-xs text-muted-foreground">Access retained</p>
          )}
        </>
      ),
    },
    {
      key: 'keyDate',
      header: 'Key date',
      render: (row) => {
        if (row.status === 'CANCELLED' || row.status === 'NONE') {
          return <p className="text-sm text-muted-foreground">—</p>;
        }
        const keyDate = row.status === 'TRIALING' ? row.trialEndsAt : row.currentPeriodEnd;
        const keyLabel =
          row.status === 'TRIALING' ? 'Trial ends' : row.cancelAtPeriodEnd ? 'Ends' : 'Renews';
        return (
          <>
            <p className="text-xs text-muted-foreground">{keyLabel}</p>
            <p className="text-sm text-foreground">{formatDay(keyDate)}</p>
          </>
        );
      },
    },
    {
      key: 'payments',
      header: 'Payments',
      render: (row) => (
        <Button
          variant="link"
          onClick={() => onToggleInvoices(row.estateId)}
          aria-expanded={invoicesFor === row.estateId}
          className="gap-1 text-xs font-medium"
        >
          <ReceiptText className="h-3 w-3" />
          {invoicesFor === row.estateId ? 'Hide payments' : 'Payment history'}
        </Button>
      ),
    },
  ];
}

function EstateInvoices({ estateId }: { estateId: string }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'estate-subscriptions', 'invoices', estateId],
    queryFn: () => unwrap(adminSubscriptionService.listEstateInvoices(estateId, { pageSize: 50 })),
  });
  if (isLoading) return <Skeleton className="h-16 w-full rounded-lg" />;
  if (isError && !data) {
    return (
      <PageErrorState
        title="Could not load this estate's payments"
        onRetry={() => void refetch()}
      />
    );
  }
  const invoices = data?.items ?? [];
  if (invoices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nothing has been charged for this estate yet.</p>
    );
  }
  return (
    <DataTable
      variant="bare"
      caption="Payments charged for this estate"
      density="compact"
      columns={INVOICE_COLUMNS}
      data={invoices}
      getRowKey={(invoice) => invoice.id}
    />
  );
}
