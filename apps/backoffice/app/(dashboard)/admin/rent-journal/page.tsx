'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Scale, TriangleAlert } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  PageErrorState,
  Skeleton,
  TableSkeleton,
  Textarea,
  useToast,
  PageHeader,
  type Column,
} from '@sureground/ui';
import { formatCurrency, formatDate, unwrap } from '@sureground/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import {
  adminJournalService,
  type JournalAccount,
  type JournalCheck,
  type JournalMonth,
  type TrialBalance,
} from '@/services/adminJournalService';

const ACCOUNT: Record<
  JournalAccount,
  { label: string; help: string; side: 'Asset' | 'Liability' | 'Income' | 'Expense' }
> = {
  CASH_CLEARING: {
    label: 'Cash clearing',
    help: 'Money received through the gateway',
    side: 'Asset',
  },
  TENANT_RECEIVABLE: {
    label: 'Tenant receivable',
    help: 'Billed to tenants, not yet paid',
    side: 'Asset',
  },
  DEFERRED_RENT: {
    label: 'Deferred rent',
    help: 'Owners’ claim on rent not yet collected',
    side: 'Liability',
  },
  OWNER_FUNDS_HELD: {
    label: 'Owner funds held',
    help: 'Collected and held for owners',
    side: 'Liability',
  },
  OWNER_FUNDS_RELEASED: {
    label: 'Owner funds released',
    help: 'Released to owners, not yet paid out',
    side: 'Liability',
  },
  OWNER_DEDUCTIONS: {
    label: 'Owner deductions',
    help: 'Fees, VAT and expenses withheld from owners’ payouts',
    side: 'Liability',
  },
  TENANT_CREDIT: {
    label: 'Tenant credit',
    help: 'Overpayments owed back or carried forward',
    side: 'Liability',
  },
  MANAGED_FEE_REVENUE: {
    label: 'Managed fee revenue',
    help: 'Sureground Managed’s own fees withheld from owners’ payouts',
    side: 'Income',
  },
  MANAGED_DELIVERY_COST: {
    label: 'Managed delivery cost',
    help: 'Partner shares and direct costs of delivering Sureground Managed',
    side: 'Expense',
  },
  PARTNER_SHARE_PAYABLE: {
    label: 'Partner share payable',
    help: 'Delivery partners’ earned share, not yet paid',
    side: 'Liability',
  },
  OPERATING_PAYABLE: {
    label: 'Operating payable',
    help: 'Direct Managed costs met from Sureground’s own funds',
    side: 'Liability',
  },
};

const accountInfo = (account: string) =>
  ACCOUNT[account as JournalAccount] ?? {
    label: account.replace(/_/g, ' ').toLowerCase(),
    help: '',
    side: 'Liability' as const,
  };

export default function RentJournalPage() {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canRun = hasAdminPermission(user?.roles, 'rentfinance.approve');
  const toast = useToast();
  const [openLease, setOpenLease] = useState<string | null>(null);
  const [overrideFor, setOverrideFor] = useState<string | null>(null);
  const [override, setOverride] = useState('');

  const months = useQuery({
    queryKey: ['admin', 'journal', 'months'],
    queryFn: () => unwrap(adminJournalService.months()),
  });
  const close = useMutation({
    mutationFn: ({ period, reason }: { period: string; reason?: string }) =>
      unwrap(adminJournalService.closeMonth(period, reason)),
    onSuccess: (_r, { period }) => {
      setOverrideFor(null);
      setOverride('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'journal'] });
      toast.success(`${period} is closed.`);
    },
    onError: (e: Error) => toast.error(e.message || 'The month did not close.'),
  });

  const trial = useQuery({
    queryKey: ['admin', 'journal', 'trial-balance'],
    queryFn: () => unwrap(adminJournalService.trialBalance()),
  });
  const check = useQuery({
    queryKey: ['admin', 'journal', 'check'],
    queryFn: () => unwrap(adminJournalService.latestCheck()),
  });
  const entries = useQuery({
    queryKey: ['admin', 'journal', 'lease', openLease],
    enabled: !!openLease,
    queryFn: () => unwrap(adminJournalService.leaseEntries(openLease!)),
  });

  const run = useMutation({
    mutationFn: () => unwrap(adminJournalService.runCheck()),
    onSuccess: (r: JournalCheck) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'journal'] });
      if (r.mismatches.length)
        toast.error(
          `${r.mismatches.length} mismatch${r.mismatches.length === 1 ? '' : 'es'} found.`
        );
      else
        toast.success(
          `Books agree. ${r.entriesPosted} new entr${r.entriesPosted === 1 ? 'y' : 'ies'} posted.`
        );
    },
    onError: (e: Error) => toast.error(e.message || 'The check failed.'),
  });

  const mismatchColumns: Column<JournalCheck['mismatches'][number]>[] = [
    {
      key: 'lease',
      header: 'Lease',
      className: 'font-mono text-xs',
      render: (m) => m.leaseId.slice(0, 8),
    },
    {
      key: 'account',
      header: 'Account',
      render: (m) => (
        <>
          {accountInfo(m.account).label}
          {m.note ? <span className="block text-xs text-muted-foreground">{m.note}</span> : null}
        </>
      ),
    },
    {
      key: 'journal',
      header: 'Journal',
      numeric: true,
      render: (m) => formatCurrency(m.journal),
    },
    {
      key: 'expected',
      header: 'Rent records',
      numeric: true,
      render: (m) => formatCurrency(m.expected),
    },
    {
      key: 'actions',
      header: '',
      srHeader: 'Actions',
      align: 'right',
      render: (m) => (
        <Button size="sm" variant="ghost" onClick={() => setOpenLease(m.leaseId)}>
          Postings
        </Button>
      ),
    },
  ];

  const trialColumns: Column<TrialBalance['accounts'][number]>[] = [
    {
      key: 'account',
      header: 'Account',
      render: (a) => (
        <>
          <span className="text-foreground">{accountInfo(a.account).label}</span>
          <span className="block text-xs text-muted-foreground">
            {accountInfo(a.account).side} · {accountInfo(a.account).help}
          </span>
        </>
      ),
    },
    {
      key: 'debit',
      header: 'Debits',
      numeric: true,
      render: (a) => formatCurrency(a.debit),
    },
    {
      key: 'credit',
      header: 'Credits',
      numeric: true,
      render: (a) => formatCurrency(a.credit),
    },
    {
      key: 'balance',
      header: 'Balance',
      numeric: true,
      className: 'font-medium',
      render: (a) => formatCurrency(a.balance),
    },
  ];

  const monthColumns: Column<JournalMonth>[] = [
    {
      key: 'month',
      header: 'Month',
      className: 'align-top font-medium text-foreground',
      render: (m) => m.period,
    },
    {
      key: 'entries',
      header: 'Entries',
      numeric: true,
      className: 'align-top',
      render: (m) => m.entries,
    },
    {
      key: 'gateway',
      header: 'Gateway',
      className: 'align-top text-xs text-muted-foreground',
      render: (m) =>
        m.gatewayEntries === 0
          ? 'No gateway money'
          : !m.reconciliation
            ? 'Not reconciled'
            : m.reconciliation.status === 'RESOLVED'
              ? 'Reconciled'
              : `${m.reconciliation.openItems} open line${m.reconciliation.openItems === 1 ? '' : 's'}`,
    },
    {
      key: 'status',
      header: 'Status',
      className: 'align-top',
      render: (m) => (
        <>
          <Badge variant={m.status === 'CLOSED' ? 'success' : 'neutral'}>
            {m.status === 'CLOSED' ? 'Closed' : 'Open'}
          </Badge>
          {m.note && <span className="mt-1 block text-xs text-muted-foreground">{m.note}</span>}
        </>
      ),
    },
    {
      key: 'actions',
      header: '',
      srHeader: 'Actions',
      align: 'right',
      className: 'align-top',
      render: (m) =>
        canRun &&
        m.status === 'OPEN' && (
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={close.isPending}
                isLoading={
                  close.isPending &&
                  close.variables?.period === m.period &&
                  !close.variables?.reason
                }
                onClick={() => close.mutate({ period: m.period })}
              >
                Close month
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setOverrideFor(overrideFor === m.period ? null : m.period)}
              >
                Close with a reason
              </Button>
            </div>
            {overrideFor === m.period && (
              <div className="flex w-full max-w-72 flex-col gap-2 sm:w-72">
                <Textarea
                  rows={2}
                  value={override}
                  onChange={(e) => setOverride(e.target.value)}
                  placeholder="Why it closes without a clean reconciliation (at least 10 characters)"
                  aria-label={`Reason for closing ${m.period}`}
                />
                <Button
                  size="sm"
                  variant="primary"
                  disabled={override.trim().length < 10 || close.isPending}
                  isLoading={close.isPending && !!close.variables?.reason}
                  onClick={() => close.mutate({ period: m.period, reason: override.trim() })}
                >
                  Close {m.period}
                </Button>
              </div>
            )}
          </div>
        ),
    },
  ];

  const c = check.data;
  const t = trial.data;

  return (
    <>
      <PageHeader
        title="Rent journal"
        description="Double-entry books for rent held by Sureground, posted from every charge, payment, credit, refund and release. Every hour they are checked against the live rent records; a mismatch means money changed outside those flows."
        actions={
          canRun && (
            <Button
              variant="primary"
              isLoading={run.isPending}
              loadingText="Checking…"
              onClick={() => run.mutate()}
            >
              Run check now
            </Button>
          )
        }
      />

      {check.isError && !c ? (
        <PageErrorState
          title="Could not load the agreement check"
          description={(check.error as Error).message}
          onRetry={() => check.refetch()}
        />
      ) : (
        <Card className="mb-6 p-5">
          {!c ? (
            check.isLoading ? (
              <Skeleton className="h-5 w-2/3" />
            ) : (
              <EmptyState
                icon={Scale}
                title="No check has run yet"
                description="The result of the hourly check against the rent records will appear here."
                size="compact"
                bare
              />
            )
          ) : c.mismatches.length === 0 && c.balanced ? (
            <p className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle2 className="h-5 w-5 text-success" aria-hidden />
              The journal agrees with the rent records for all {c.leasesChecked} leases. Last
              checked {formatDate(c.ranAt)}.
            </p>
          ) : (
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <TriangleAlert className="h-5 w-5 text-warning" aria-hidden />
                {c.mismatches.length} mismatch{c.mismatches.length === 1 ? '' : 'es'}
                {!c.balanced ? ' and the books do not balance' : ''} · checked {formatDate(c.ranAt)}
              </p>
              <DataTable
                variant="bare"
                className="mt-3"
                caption="Leases where the journal and the rent records disagree"
                density="compact"
                columns={mismatchColumns}
                data={c.mismatches}
                getRowKey={(m) => `${m.leaseId}-${m.account}`}
              />
            </div>
          )}
        </Card>
      )}

      {trial.isError && !t ? (
        <PageErrorState
          title="Could not load the trial balance"
          description={(trial.error as Error).message}
          onRetry={() => trial.refetch()}
        />
      ) : (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-foreground">Trial balance</h2>
            {t && (
              <Badge variant={t.balanced ? 'success' : 'danger'}>
                {t.balanced ? 'Debits = credits' : 'Out of balance'}
              </Badge>
            )}
          </div>
          {!t ? (
            <TableSkeleton rows={5} columns={4} />
          ) : (
            <DataTable
              variant="bare"
              caption="Trial balance by account"
              density="compact"
              columns={trialColumns}
              data={t.accounts}
              getRowKey={(a) => a.account}
              totals={{
                account: 'Total',
                debit: formatCurrency(t.debit),
                credit: formatCurrency(t.credit),
              }}
            />
          )}
        </Card>
      )}

      <Card className="mt-6 p-5">
        <h2 className="mb-1 font-semibold text-foreground">Months</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Close each month once it has ended: the books must agree, and a month that moved money
          through the gateway must be reconciled first (or closed with a reason on record). A closed
          month is final; anything that turns up later is booked in the next open month.
        </p>
        {months.isLoading ? (
          <TableSkeleton rows={4} columns={5} />
        ) : months.isError && !months.data ? (
          <PageErrorState
            title="Could not load months"
            description={(months.error as Error).message}
            onRetry={() => months.refetch()}
            headingLevel="h2"
            className="min-h-0 py-10"
          />
        ) : (
          <DataTable
            variant="bare"
            caption="Journal months and whether each is closed"
            density="compact"
            columns={monthColumns}
            data={months.data ?? []}
            getRowKey={(m) => m.period}
          />
        )}
      </Card>

      {openLease && (
        <Card className="mt-6 p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-foreground">
              Postings for lease <span className="font-mono text-sm">{openLease.slice(0, 8)}</span>
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setOpenLease(null)}>
              Close
            </Button>
          </div>
          {entries.isLoading ? (
            <div className="space-y-2" role="status" aria-label="Loading">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <ul className="space-y-3 text-sm">
              {(entries.data ?? []).map((e) => (
                <li key={e.id} className="border-t border-border pt-2">
                  <p className="text-foreground">
                    {e.kind.replace(/_/g, ' ').toLowerCase()} · {formatDate(e.occurredAt)}
                  </p>
                  {e.memo && <p className="text-xs text-muted-foreground">{e.memo}</p>}
                  <ul className="mt-1 text-xs text-muted-foreground">
                    {e.lines.map((l, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span>{accountInfo(l.account).label}</span>
                        <span className="tabular-nums">
                          {l.debit
                            ? `Dr ${formatCurrency(l.debit)}`
                            : `Cr ${formatCurrency(l.credit)}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </>
  );
}
