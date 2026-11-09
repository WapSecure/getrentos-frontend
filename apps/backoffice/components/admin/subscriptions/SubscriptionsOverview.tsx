'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CreditCard, ReceiptText, TriangleAlert, TrendingUp } from '@sureground/icons';
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  PageErrorState,
  Pagination,
  SearchInput,
  Select,
  Skeleton,
  StatGridSkeleton,
  TableSkeleton,
  type BadgeVariant,
  type Column,
  PageHeader,
} from '@sureground/ui';
import { formatCurrency, formatDate, unwrap } from '@sureground/shared';
import { adminSubscriptionService } from '@/services/adminSubscriptionService';
import type {
  AdminSubscription,
  AdminSubscriptionInvoice,
  SubscriptionStatus,
} from '@/types/subscription';

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
  NONE: 'No plan',
};

const naira = (kobo: number | null) => (kobo == null ? '—' : formatCurrency(kobo / 100));

const formatDay = (iso: string | null) => (iso ? formatDate(iso) : '—');

export const SubscriptionsOverview = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [invoicesFor, setInvoicesFor] = useState<string | null>(null);

  const overview = useQuery({
    queryKey: ['admin', 'subscriptions', 'overview'],
    queryFn: () => unwrap(adminSubscriptionService.getOverview()),
  });

  const list = useQuery({
    queryKey: ['admin', 'subscriptions', 'list', { search, status, page }],
    queryFn: () =>
      unwrap(
        adminSubscriptionService.list({
          search: search.trim() || undefined,
          status: status || undefined,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });

  const items = list.data?.items ?? [];
  const stats = overview.data;

  const cards = stats
    ? [
        { label: 'MRR', value: formatCurrency(stats.mrrKobo / 100), icon: TrendingUp },
        { label: 'In force', value: stats.inForce, icon: CreditCard },
        { label: 'Trialing', value: stats.trialing, icon: CreditCard },
        { label: 'Past due', value: stats.pastDue, icon: TriangleAlert, warn: stats.pastDue > 0 },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        description="Pro plan lifecycle: trials, renewals, failed payments and cancellations."
      />

      {overview.isLoading ? (
        <StatGridSkeleton />
      ) : overview.isError && !stats ? (
        <PageErrorState
          title="Could not load the subscription pulse"
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
          {stats.trialsEndingSoon} trial{stats.trialsEndingSoon === 1 ? '' : 's'} converting and{' '}
          {stats.renewalsDueSoon} renewal{stats.renewalsDueSoon === 1 ? '' : 's'} due in the next 7
          days
          {stats.endingSoon > 0 &&
            `, ${stats.endingSoon} plan${stats.endingSoon === 1 ? '' : 's'} ending after cancellation`}
          .
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onValueChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by customer email or name"
          label="Search subscriptions"
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
            ...(['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'NONE'] as const).map((value) => ({
              value,
              label: STATUS_LABEL[value],
            })),
          ]}
        />
      </div>

      {list.isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : list.isError && !list.data ? (
        <PageErrorState title="Could not load subscriptions" onRetry={() => void list.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={search || status ? 'No subscriptions match' : 'No subscriptions yet'}
          description={
            search || status
              ? 'Try a different customer or status.'
              : 'Pro subscriptions will appear here as customers start trials.'
          }
        />
      ) : (
        <DataTable
          caption="Customer subscriptions"
          columns={subscriptionColumns(invoicesFor, (userId) =>
            setInvoicesFor((current) => (current === userId ? null : userId))
          )}
          data={items}
          getRowKey={(row) => row.userId}
          renderExpanded={(row) =>
            invoicesFor === row.userId ? <CustomerInvoices userId={row.userId} /> : null
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

function subscriptionColumns(
  invoicesFor: string | null,
  onToggleInvoices: (userId: string) => void
): Column<AdminSubscription>[] {
  return [
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => (
        <>
          <p className="text-sm font-medium text-foreground">{row.legalName ?? 'Unknown'}</p>
          <p className="text-xs text-muted-foreground">{row.email ?? '—'}</p>
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
              ? // No cycle or price means the plan was granted, not bought, so it is not revenue.
                row.tier === 'PRO'
                ? 'Granted'
                : '—'
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
          {/* A row can be past due and still have access, so show what the app does. */}
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
        // Only trialing, active and past-due rows have a meaningful next date.
        const lapsed = row.status === 'NONE' || row.status === 'CANCELLED';
        const keyDate = row.status === 'TRIALING' ? row.trialEndsAt : row.currentPeriodEnd;
        const keyLabel =
          row.status === 'TRIALING' ? 'Trial ends' : row.cancelAtPeriodEnd ? 'Ends' : 'Renews';
        return lapsed ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : keyDate ? (
          <>
            <p className="text-xs text-muted-foreground">{keyLabel}</p>
            <p className="text-sm text-foreground">{formatDay(keyDate)}</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No end date</p>
        );
      },
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (row) => (
        <div className="flex flex-col gap-1">
          {row.cancelAtPeriodEnd && (
            <span className="text-xs text-muted-foreground">Cancellation scheduled</span>
          )}
          {row.captureRefundPending && (
            <span className="text-xs font-medium text-warning">Card-capture refund pending</span>
          )}
          {row.latestReference && (
            <span className="font-mono text-2xs text-muted-foreground">{row.latestReference}</span>
          )}
          {row.tier === 'PRO' && (
            <Button
              variant="link"
              onClick={() => onToggleInvoices(row.userId)}
              aria-expanded={invoicesFor === row.userId}
              className="mt-1 gap-1 text-xs font-medium"
            >
              <ReceiptText className="h-3 w-3" />
              {invoicesFor === row.userId ? 'Hide payments' : 'Payment history'}
            </Button>
          )}
        </div>
      ),
    },
  ];
}

function CustomerInvoices({ userId }: { userId: string }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'subscriptions', 'invoices', userId],
    queryFn: () => unwrap(adminSubscriptionService.listInvoices(userId, { pageSize: 50 })),
  });

  if (isLoading) {
    return <Skeleton className="h-16 w-full rounded-lg" />;
  }
  if (isError && !data) {
    return (
      <PageErrorState
        title="Could not load this customer's payments"
        onRetry={() => void refetch()}
      />
    );
  }

  const invoices = data?.items ?? [];
  if (invoices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nothing has been charged on this account yet.</p>
    );
  }

  return (
    <DataTable
      variant="bare"
      caption="Payments charged on this account"
      density="compact"
      columns={INVOICE_COLUMNS}
      data={invoices}
      getRowKey={(invoice) => invoice.id}
    />
  );
}

const INVOICE_VARIANT: Record<AdminSubscriptionInvoice['status'], BadgeVariant> = {
  PAID: 'success',
  REFUNDED: 'neutral',
  FAILED: 'danger',
};

const INVOICE_LABEL: Record<AdminSubscriptionInvoice['status'], string> = {
  PAID: 'Paid',
  REFUNDED: 'Refunded',
  FAILED: 'Failed',
};

const INVOICE_COLUMNS: Column<AdminSubscriptionInvoice>[] = [
  {
    key: 'date',
    header: 'Date',
    className: 'whitespace-nowrap text-muted-foreground',
    render: (invoice) => formatDay(invoice.paidAt ?? invoice.createdAt),
  },
  {
    key: 'description',
    header: 'Description',
    className: 'text-foreground',
    render: (invoice) => (
      <>
        {invoice.description}
        {invoice.periodStart && invoice.periodEnd && (
          <p className="text-xs text-muted-foreground">
            {formatDay(invoice.periodStart)} – {formatDay(invoice.periodEnd)}
          </p>
        )}
      </>
    ),
  },
  {
    key: 'invoice',
    header: 'Invoice',
    className: 'font-mono text-2xs text-muted-foreground',
    render: (invoice) => (
      <>
        {invoice.number}
        {invoice.providerReference && <span className="block">{invoice.providerReference}</span>}
      </>
    ),
  },
  {
    key: 'amount',
    header: 'Amount',
    numeric: true,
    className: 'whitespace-nowrap text-foreground',
    render: (invoice) => (
      <>
        {naira(invoice.amountKobo)}
        {/* An inferred amount came from reconciliation, not a confirmed charge: flag it before it is quoted to a customer. */}
        {invoice.inferred && (
          <span className="block text-xs text-warning">Inferred from provider</span>
        )}
      </>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (invoice) => (
      <Badge variant={INVOICE_VARIANT[invoice.status]}>{INVOICE_LABEL[invoice.status]}</Badge>
    ),
  },
];
