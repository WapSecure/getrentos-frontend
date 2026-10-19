'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpenCheck, CheckCircle2, TriangleAlert } from 'lucide-react';
import { Badge, Button, Card, PageErrorState, Toast, type ToastVariant } from '@getrentos/ui';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import {
  adminJournalService,
  type JournalAccount,
  type JournalCheck,
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
    help: 'GetRentos Managed’s own fees withheld from owners’ payouts',
    side: 'Income',
  },
  MANAGED_DELIVERY_COST: {
    label: 'Managed delivery cost',
    help: 'Partner shares and direct costs of delivering GetRentos Managed',
    side: 'Expense',
  },
  PARTNER_SHARE_PAYABLE: {
    label: 'Partner share payable',
    help: 'Delivery partners’ earned share, not yet paid',
    side: 'Liability',
  },
  OPERATING_PAYABLE: {
    label: 'Operating payable',
    help: 'Direct Managed costs met from GetRentos’s own funds',
    side: 'Liability',
  },
};

/** Labels for accounts; an account added later reads as its code rather than breaking the page. */
const accountInfo = (account: string) =>
  ACCOUNT[account as JournalAccount] ?? {
    label: account.replace(/_/g, ' ').toLowerCase(),
    help: '',
    side: 'Liability' as const,
  };

/**
 * The rent journal: double-entry books kept alongside the rent tables. The
 * agreement check runs every hour; a mismatch means money changed somewhere
 * outside the rent flows (a charge edited or deleted by hand) and needs a
 * person to find out why.
 */
export default function RentJournalPage() {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canRun = hasAdminPermission(user?.roles, 'rentfinance.approve');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
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
      setToast({ message: `${period} is closed.`, variant: 'success' });
    },
    onError: (e: Error) =>
      setToast({ message: e.message || 'The month did not close.', variant: 'error' }),
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
      setToast({
        message: r.mismatches.length
          ? `${r.mismatches.length} mismatch${r.mismatches.length === 1 ? '' : 'es'} found.`
          : `Books agree. ${r.entriesPosted} new entr${r.entriesPosted === 1 ? 'y' : 'ies'} posted.`,
        variant: r.mismatches.length ? 'error' : 'success',
      });
    },
    onError: (e: Error) =>
      setToast({ message: e.message || 'The check failed.', variant: 'error' }),
  });

  const c = check.data;
  const t = trial.data;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <BookOpenCheck className="h-6 w-6 text-primary" aria-hidden />
            Rent journal
          </h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Double-entry books for rent held by GetRentos, posted from every charge, payment,
            credit, refund and release. Every hour they are checked against the live rent records; a
            mismatch means money changed outside those flows.
          </p>
        </div>
        {canRun && (
          <Button variant="primary" disabled={run.isPending} onClick={() => run.mutate()}>
            {run.isPending ? 'Checking…' : 'Run check now'}
          </Button>
        )}
      </div>

      {check.isError ? (
        <PageErrorState
          title="Could not load the agreement check"
          description={(check.error as Error).message}
          onRetry={() => check.refetch()}
        />
      ) : (
        <Card className="mb-6 p-5">
          {!c ? (
            <p className="text-sm text-muted-foreground">
              {check.isLoading ? 'Loading…' : 'No check has run yet.'}
            </p>
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
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="py-1 pr-4 font-medium">Lease</th>
                      <th className="py-1 pr-4 font-medium">Account</th>
                      <th className="py-1 pr-4 text-right font-medium">Journal</th>
                      <th className="py-1 pr-4 text-right font-medium">Rent records</th>
                      <th className="py-1 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {c.mismatches.map((m) => (
                      <tr key={`${m.leaseId}-${m.account}`} className="border-t border-border">
                        <td className="py-2 pr-4 font-mono text-xs">{m.leaseId.slice(0, 8)}</td>
                        <td className="py-2 pr-4">
                          {accountInfo(m.account).label}
                          {m.note ? (
                            <span className="block text-xs text-muted-foreground">{m.note}</span>
                          ) : null}
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {formatCurrency(m.journal)}
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {formatCurrency(m.expected)}
                        </td>
                        <td className="py-2 text-right">
                          <Button size="sm" variant="ghost" onClick={() => setOpenLease(m.leaseId)}>
                            Postings
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {trial.isError ? (
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
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="py-1 pr-4 font-medium">Account</th>
                    <th className="py-1 pr-4 text-right font-medium">Debits</th>
                    <th className="py-1 pr-4 text-right font-medium">Credits</th>
                    <th className="py-1 text-right font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {t.accounts.map((a) => (
                    <tr key={a.account} className="border-t border-border">
                      <td className="py-2 pr-4">
                        <span className="text-foreground">{accountInfo(a.account).label}</span>
                        <span className="block text-xs text-muted-foreground">
                          {accountInfo(a.account).side} · {accountInfo(a.account).help}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {formatCurrency(a.debit)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {formatCurrency(a.credit)}
                      </td>
                      <td className="py-2 text-right font-medium tabular-nums">
                        {formatCurrency(a.balance)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-border font-medium">
                    <td className="py-2 pr-4">Total</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{formatCurrency(t.debit)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {formatCurrency(t.credit)}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
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
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-1 pr-4 font-medium">Month</th>
                  <th className="py-1 pr-4 text-right font-medium">Entries</th>
                  <th className="py-1 pr-4 font-medium">Gateway</th>
                  <th className="py-1 pr-4 font-medium">Status</th>
                  <th className="py-1 font-medium" />
                </tr>
              </thead>
              <tbody>
                {(months.data ?? []).map((m) => (
                  <tr key={m.period} className="border-t border-border align-top">
                    <td className="py-2 pr-4 font-medium text-foreground">{m.period}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{m.entries}</td>
                    <td className="py-2 pr-4 text-xs text-muted-foreground">
                      {m.gatewayEntries === 0
                        ? 'No gateway money'
                        : !m.reconciliation
                          ? 'Not reconciled'
                          : m.reconciliation.status === 'RESOLVED'
                            ? 'Reconciled'
                            : `${m.reconciliation.openItems} open line${m.reconciliation.openItems === 1 ? '' : 's'}`}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant={m.status === 'CLOSED' ? 'success' : 'neutral'}>
                        {m.status === 'CLOSED' ? 'Closed' : 'Open'}
                      </Badge>
                      {m.note && (
                        <span className="mt-1 block text-xs text-muted-foreground">{m.note}</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {canRun && m.status === 'OPEN' && (
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={close.isPending}
                              onClick={() => close.mutate({ period: m.period })}
                            >
                              Close month
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setOverrideFor(overrideFor === m.period ? null : m.period)
                              }
                            >
                              Close with a reason
                            </Button>
                          </div>
                          {overrideFor === m.period && (
                            <div className="flex w-72 flex-col gap-2">
                              <textarea
                                rows={2}
                                value={override}
                                onChange={(e) => setOverride(e.target.value)}
                                placeholder="Why it closes without a clean reconciliation (at least 10 characters)"
                                className="rounded-lg border border-border bg-background p-2 text-xs"
                              />
                              <Button
                                size="sm"
                                variant="primary"
                                disabled={override.trim().length < 10 || close.isPending}
                                onClick={() =>
                                  close.mutate({ period: m.period, reason: override.trim() })
                                }
                              >
                                Close {m.period}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            <p className="text-sm text-muted-foreground">Loading…</p>
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

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
