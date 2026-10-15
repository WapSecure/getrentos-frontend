'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Landmark } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageErrorState,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { adminPayoutRunsService, type PayoutRun } from '@/services/adminPayoutRunsService';

/** The last month that has ended, as YYYY-MM (Lagos). */
function lastEndedMonth(): string {
  const lagos = new Date(Date.now() + 60 * 60_000);
  const d = new Date(Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth() - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

const ITEM_BADGE: Record<
  PayoutRun['items'][number]['status'],
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }
> = {
  DRAFTED: { label: 'Drafted', variant: 'info' },
  ISSUED: { label: 'Issued', variant: 'success' },
  SKIPPED: { label: 'Nothing due', variant: 'neutral' },
  FAILED: { label: 'Failed', variant: 'danger' },
};

/**
 * A month's owner payouts, done together. Drafting writes, for every owner with
 * released rent not yet paid out, the same statement the owner could write
 * themselves; a second person issues them, and each pays out (or waits for
 * approval) exactly as an owner-issued statement does.
 */
export default function PayoutRunsPage() {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canAct = hasAdminPermission(user?.roles, 'rentfinance.approve');
  const [period, setPeriod] = useState(lastEndedMonth());
  const [openRun, setOpenRun] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const runs = useQuery({
    queryKey: ['admin', 'payout-runs'],
    queryFn: () => unwrap(adminPayoutRunsService.list()),
  });
  const run = useQuery({
    queryKey: ['admin', 'payout-runs', openRun],
    enabled: !!openRun,
    queryFn: () => unwrap(adminPayoutRunsService.get(openRun!)),
  });

  const refresh = (r: PayoutRun) => {
    queryClient.setQueryData(['admin', 'payout-runs', r.id], r);
    queryClient.invalidateQueries({ queryKey: ['admin', 'payout-runs'], exact: true });
  };
  const fail = (e: Error) =>
    setToast({ message: e.message || 'That did not work.', variant: 'error' });

  const draft = useMutation({
    mutationFn: () => unwrap(adminPayoutRunsService.draft(period)),
    onSuccess: (r) => {
      refresh(r);
      setOpenRun(r.id);
      setToast({
        message: r.items.length
          ? `${r.items.length} owner statement${r.items.length === 1 ? '' : 's'} drafted for ${r.period}.`
          : `No owner has released rent left to pay for ${r.period}.`,
        variant: 'success',
      });
    },
    onError: fail,
  });
  const issue = useMutation({
    mutationFn: (id: string) => unwrap(adminPayoutRunsService.issue(id)),
    onSuccess: (r) => {
      refresh(r);
      const failed = r.items.filter((i) => i.status === 'FAILED').length;
      setToast({
        message: failed ? `Issued; ${failed} owner${failed === 1 ? '' : 's'} failed.` : 'Issued.',
        variant: failed ? 'error' : 'success',
      });
    },
    onError: fail,
  });
  const retry = useMutation({
    mutationFn: ({ id, itemId }: { id: string; itemId: string }) =>
      unwrap(adminPayoutRunsService.retryItem(id, itemId)),
    onSuccess: refresh,
    onError: fail,
  });

  const r = run.data;

  return (
    <>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Landmark className="h-6 w-6 text-primary" aria-hidden />
          Payout runs
        </h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Pay every owner for a month at once. Drafting writes each owner&apos;s statement (fees and
          expenses as usual); someone other than the person who drafted it issues the run, and each
          statement then pays out, or waits for approval above the release threshold.
        </p>
      </div>

      {canAct && (
        <Card className="mb-6 flex flex-wrap items-end gap-3 p-5">
          <div>
            <label htmlFor="payout-month" className="block text-sm font-medium text-foreground">
              Month
            </label>
            <input
              id="payout-month"
              value={period}
              onChange={(e) => setPeriod(e.target.value.trim())}
              placeholder="YYYY-MM"
              pattern="\d{4}-\d{2}"
              className="mt-1 h-10 w-32 rounded-lg border border-border bg-background px-3 text-sm"
            />
          </div>
          <Button
            variant="primary"
            disabled={draft.isPending || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period)}
            onClick={() => draft.mutate()}
          >
            {draft.isPending ? 'Drafting…' : 'Draft payout run'}
          </Button>
        </Card>
      )}

      {runs.isError ? (
        <PageErrorState
          title="Could not load payout runs"
          description={(runs.error as Error).message}
          onRetry={() => runs.refetch()}
        />
      ) : runs.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !runs.data?.length ? (
        <EmptyState
          icon={Landmark}
          title="No payout runs yet"
          description="Draft one for a month that has ended."
        />
      ) : (
        <div className="space-y-3">
          {runs.data.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">
                    {s.period} · {s.owners} owner{s.owners === 1 ? '' : 's'} ·{' '}
                    {formatCurrency(s.total)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Drafted {formatDate(s.createdAt)}
                    {s.issuedAt ? ` · issued ${formatDate(s.issuedAt)}` : ''}
                    {s.failed ? ` · ${s.failed} failed` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.status === 'ISSUED' ? 'success' : 'warning'}>
                    {s.status === 'ISSUED' ? 'Issued' : 'Waiting to be issued'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOpenRun(openRun === s.id ? null : s.id)}
                  >
                    {openRun === s.id ? 'Hide' : 'Open'}
                  </Button>
                </div>
              </div>

              {openRun === s.id && r && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs text-muted-foreground">
                        <tr>
                          <th className="py-1 pr-4 font-medium">Owner</th>
                          <th className="py-1 pr-4 text-right font-medium">Rent</th>
                          <th className="py-1 pr-4 text-right font-medium">To pay</th>
                          <th className="py-1 pr-4 font-medium">Status</th>
                          <th className="py-1 font-medium" />
                        </tr>
                      </thead>
                      <tbody>
                        {r.items.map((i) => (
                          <tr key={i.id} className="border-t border-border align-top">
                            <td className="py-2 pr-4">
                              {i.ownerName}
                              {i.note && (
                                <span className="block text-xs text-muted-foreground">
                                  {i.note}
                                </span>
                              )}
                            </td>
                            <td className="py-2 pr-4 text-right tabular-nums">
                              {i.grossIncome != null ? formatCurrency(i.grossIncome) : '—'}
                            </td>
                            <td className="py-2 pr-4 text-right tabular-nums">
                              {i.netPayout != null ? formatCurrency(i.netPayout) : '—'}
                            </td>
                            <td className="py-2 pr-4">
                              <Badge variant={ITEM_BADGE[i.status].variant}>
                                {ITEM_BADGE[i.status].label}
                              </Badge>
                            </td>
                            <td className="py-2 text-right">
                              {canAct && r.status === 'ISSUED' && i.status === 'FAILED' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={retry.isPending}
                                  onClick={() => retry.mutate({ id: r.id, itemId: i.id })}
                                >
                                  Retry
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {canAct && r.status === 'DRAFTED' && (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button
                        variant="primary"
                        disabled={issue.isPending}
                        onClick={() => issue.mutate(r.id)}
                      >
                        {issue.isPending ? 'Issuing…' : 'Issue run'}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Must be issued by someone other than the person who drafted it.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
