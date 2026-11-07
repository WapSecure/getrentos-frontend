'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Landmark } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  ListSkeleton,
  PageErrorState,
  Skeleton,
  useToast,
  PageHeader,
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
  // Money moves only after the amount and who receives it are confirmed.
  const [confirmingIssue, setConfirmingIssue] = useState(false);
  const [confirmingRetry, setConfirmingRetry] = useState<{
    itemId: string;
    ownerName: string;
    amount: number | null;
  } | null>(null);
  const toast = useToast();

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
  const fail = (e: Error) => toast.error(e.message || 'That did not work.');

  const draft = useMutation({
    mutationFn: () => unwrap(adminPayoutRunsService.draft(period)),
    onSuccess: (r) => {
      refresh(r);
      setOpenRun(r.id);
      toast.success(
        r.items.length
          ? `${r.items.length} owner statement${r.items.length === 1 ? '' : 's'} drafted for ${r.period}.`
          : `No owner has released rent left to pay for ${r.period}.`
      );
    },
    onError: fail,
  });
  const issue = useMutation({
    mutationFn: (id: string) => unwrap(adminPayoutRunsService.issue(id)),
    onSuccess: (r) => {
      refresh(r);
      const failed = r.items.filter((i) => i.status === 'FAILED').length;
      if (failed) toast.error(`Issued; ${failed} owner${failed === 1 ? '' : 's'} failed.`);
      else toast.success('Issued.');
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
  // What issuing pays: every drafted owner statement in the open run.
  const toIssue = r?.items.filter((i) => i.status === 'DRAFTED') ?? [];
  const issueTotal = toIssue.reduce((sum, i) => sum + (i.netPayout ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Payout runs"
        description="Pay every owner for a month at once. Drafting writes each owner's statement (fees and expenses as usual); someone other than the person who drafted it issues the run, and each statement then pays out, or waits for approval above the release threshold."
      />

      {canAct && (
        <Card className="mb-6 flex flex-wrap items-end gap-3 p-5">
          <Field label="Month">
            <Input
              value={period}
              onChange={(e) => setPeriod(e.target.value.trim())}
              placeholder="YYYY-MM"
              pattern="\d{4}-\d{2}"
              inputMode="numeric"
              className="w-32"
            />
          </Field>
          <Button
            variant="primary"
            disabled={!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)}
            isLoading={draft.isPending}
            loadingText="Drafting…"
            onClick={() => draft.mutate()}
          >
            Draft payout run
          </Button>
        </Card>
      )}

      {runs.isLoading ? (
        <ListSkeleton variant="cards" />
      ) : runs.isError && !runs.data ? (
        <PageErrorState
          title="Could not load payout runs"
          description={(runs.error as Error).message}
          onRetry={() => runs.refetch()}
        />
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
                <div className="flex flex-wrap items-center gap-2">
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

              {openRun === s.id && !r && run.isLoading && (
                <div
                  className="mt-4 space-y-2 border-t border-border pt-4"
                  role="status"
                  aria-label="Loading run"
                >
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              )}
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
                                  isLoading={retry.isPending && retry.variables?.itemId === i.id}
                                  onClick={() =>
                                    setConfirmingRetry({
                                      itemId: i.id,
                                      ownerName: i.ownerName,
                                      amount: i.netPayout,
                                    })
                                  }
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
                        isLoading={issue.isPending}
                        loadingText="Issuing…"
                        onClick={() => setConfirmingIssue(true)}
                      >
                        Issue run
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

      <ConfirmDialog
        open={confirmingIssue && !!r}
        onOpenChange={setConfirmingIssue}
        title={`Pay ${toIssue.length} owner${toIssue.length === 1 ? '' : 's'} ${formatCurrency(issueTotal)} for ${r?.period ?? ''}?`}
        description={`Each owner's statement pays out to that owner's current payout account (${toIssue
          .map((i) => `${i.ownerName} ${i.netPayout != null ? formatCurrency(i.netPayout) : '—'}`)
          .join(
            ', '
          )}). Payouts above the release threshold wait for approval. Money that has been sent can't be called back from here.`}
        confirmLabel={`Issue and pay ${formatCurrency(issueTotal)}`}
        isLoading={issue.isPending}
        onConfirm={() => r && issue.mutate(r.id)}
      />
      <ConfirmDialog
        open={!!confirmingRetry && !!r}
        onOpenChange={(open) => !open && setConfirmingRetry(null)}
        title={`Send ${
          confirmingRetry?.amount != null ? formatCurrency(confirmingRetry.amount) : 'this payout'
        } to ${confirmingRetry?.ownerName ?? 'this owner'}?`}
        description={`This sends the failed payout again, under a new reference, to ${
          confirmingRetry?.ownerName ?? 'the owner'
        }'s current payout account. If they changed their account after it failed, check the change was really theirs before you retry.`}
        confirmLabel={`Send ${
          confirmingRetry?.amount != null ? formatCurrency(confirmingRetry.amount) : 'payout'
        }`}
        onConfirm={() => {
          if (r && confirmingRetry) retry.mutate({ id: r.id, itemId: confirmingRetry.itemId });
        }}
      />
    </>
  );
}
