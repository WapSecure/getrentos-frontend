'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Search, TriangleAlert, TrendingUp } from 'lucide-react';
import {
  Badge,
  EmptyState,
  LegacyInput,
  PageErrorState,
  Pagination,
  type BadgeVariant,
} from '@getrentos/ui';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';
import { adminSubscriptionService } from '@/services/adminSubscriptionService';
import type { AdminSubscription, SubscriptionStatus } from '@/types/subscription';

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

/**
 * The Pro subscription book.
 *
 * Built because billing used to be write-only from here: an admin could change
 * a tier and nothing else, so there was no answer to "I paid and I'm still on
 * Free" and no sight of who is failing to pay.
 */
export const SubscriptionsOverview = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
        <p className="text-muted-foreground mt-1">
          Pro plan lifecycle: trials, renewals, failed payments and cancellations.
        </p>
      </div>

      {overview.isError ? (
        <PageErrorState
          title="Could not load the subscription pulse"
          onRetry={() => void overview.refetch()}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <card.icon
                  className={
                    card.warn
                      ? 'h-4 w-4 text-amber-600 dark:text-amber-400'
                      : 'h-4 w-4 text-muted-foreground'
                  }
                />
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {card.label}
                </p>
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{card.value}</p>
            </div>
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
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <LegacyInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by customer email or name"
            className="pl-9"
            aria-label="Search subscriptions"
          />
        </div>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
        >
          <option value="">All statuses</option>
          {(['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'NONE'] as const).map((value) => (
            <option key={value} value={value}>
              {STATUS_LABEL[value]}
            </option>
          ))}
        </select>
      </div>

      {list.isError ? (
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
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  {['Customer', 'Plan', 'Status', 'Key date', 'Notes'].map((heading) => (
                    <th
                      key={heading}
                      className="p-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((row) => (
                  <SubscriptionRow key={row.userId} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
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

function SubscriptionRow({ row }: { row: AdminSubscription }) {
  // Only trialing/active/past-due have a meaningful next date. A row that never
  // started, or has ended, should not claim it is about to renew.
  const lapsed = row.status === 'NONE' || row.status === 'CANCELLED';
  const keyDate = row.status === 'TRIALING' ? row.trialEndsAt : row.currentPeriodEnd;
  const keyLabel =
    row.status === 'TRIALING' ? 'Trial ends' : row.cancelAtPeriodEnd ? 'Ends' : 'Renews';

  return (
    <tr>
      <td className="p-4">
        <p className="text-sm font-medium text-foreground">{row.legalName ?? 'Unknown'}</p>
        <p className="text-xs text-muted-foreground">{row.email ?? '—'}</p>
      </td>
      <td className="p-4">
        <p className="text-sm text-foreground">
          {row.cycle === 'ANNUAL' ? 'Annual' : row.cycle === 'MONTHLY' ? 'Monthly' : '—'}
        </p>
        <p className="text-xs text-muted-foreground">
          {row.priceKobo == null
            ? // No cycle/price means the plan was granted rather than bought —
              // it should not be counted as revenue, and this makes that visible.
              row.tier === 'PRO'
              ? 'Granted'
              : '—'
            : `${naira(row.priceKobo)}/${row.cycle === 'ANNUAL' ? 'yr' : 'mo'}`}
        </p>
      </td>
      <td className="p-4">
        <Badge variant={STATUS_VARIANT[row.status]}>{STATUS_LABEL[row.status]}</Badge>
        {/* A row can be past due and still have access — show what the app does, not just the label. */}
        {row.status === 'PAST_DUE' && row.isActive && (
          <p className="mt-1 text-xs text-muted-foreground">Access retained</p>
        )}
      </td>
      <td className="p-4">
        {lapsed ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : keyDate ? (
          <>
            <p className="text-xs text-muted-foreground">{keyLabel}</p>
            <p className="text-sm text-foreground">{formatDay(keyDate)}</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No end date</p>
        )}
      </td>
      <td className="p-4">
        <div className="flex flex-col gap-1">
          {row.cancelAtPeriodEnd && (
            <span className="text-xs text-muted-foreground">Cancellation scheduled</span>
          )}
          {row.captureRefundPending && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Card-capture refund pending
            </span>
          )}
          {row.latestReference && (
            <span className="font-mono text-[11px] text-muted-foreground">
              {row.latestReference}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
