'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ChevronDown, Clock, Landmark } from '@sureground/icons';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Field,
  ListSkeleton,
  PageErrorState,
  Select,
  Skeleton,
  StatGroup,
  useToast,
  PageHeader,
  type Column,
} from '@sureground/ui';
import { cn } from '@sureground/shared';
import { formatCurrency, formatDate, unwrap } from '@sureground/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { payoutAccountLabel, payoutDestinationSentence } from '@/lib/payoutDestination';
import {
  adminPayoutRunsService,
  type PayoutRun,
  type PayoutRunSummary,
} from '@/services/adminPayoutRunsService';
import type { PayoutDestination } from '@/services/adminPayoutIssuesService';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function monthLabel(period: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  const name = m ? MONTH_NAMES[Number(m[2]) - 1] : undefined;
  return m && name ? `${name} ${m[1]}` : period;
}

function endedMonths(count = 12): { value: string; label: string }[] {
  const lagos = new Date(Date.now() + 60 * 60_000);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth() - 1 - i, 1));
    const value = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    return { value, label: monthLabel(value) };
  });
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

export default function PayoutRunsPage() {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canAct = hasAdminPermission(user?.roles, 'rentfinance.approve');
  const [monthOptions] = useState(() => endedMonths());
  const [period, setPeriod] = useState(() => monthOptions[0]!.value);
  const [openRun, setOpenRun] = useState<string | null>(null);
  // Money moves only after the amount and who receives it are confirmed.
  const [confirmingIssue, setConfirmingIssue] = useState(false);
  const [confirmingRetry, setConfirmingRetry] = useState<{
    itemId: string;
    ownerName: string;
    amount: number | null;
    destination?: PayoutDestination | null;
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
          ? `${r.items.length} owner statement${r.items.length === 1 ? '' : 's'} drafted for ${monthLabel(r.period)}.`
          : `No owner has released rent left to pay for ${monthLabel(r.period)}.`
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
  const toIssue = r?.items.filter((i) => i.status === 'DRAFTED') ?? [];
  const issueTotal = toIssue.reduce((sum, i) => sum + (i.netPayout ?? 0), 0);

  const itemColumns: Column<PayoutRun['items'][number]>[] = [
    {
      key: 'owner',
      header: 'Owner',
      className: 'align-top',
      render: (i) => (
        <>
          {i.ownerName}
          {i.note && <span className="block text-xs text-muted-foreground">{i.note}</span>}
          {i.destination !== undefined && i.status !== 'SKIPPED' && (
            <span className="block text-xs text-muted-foreground">
              {payoutAccountLabel(i.destination) ?? 'No payout account on file'}
              {i.destination?.accountChanged && (
                <Badge variant="warning" className="ml-2">
                  Account changed
                </Badge>
              )}
            </span>
          )}
        </>
      ),
    },
    {
      key: 'rent',
      header: 'Rent',
      numeric: true,
      className: 'align-top',
      render: (i) => (i.grossIncome != null ? formatCurrency(i.grossIncome) : '–'),
    },
    {
      key: 'toPay',
      header: 'To pay',
      numeric: true,
      className: 'align-top',
      render: (i) => (i.netPayout != null ? formatCurrency(i.netPayout) : '–'),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'align-top',
      render: (i) => (
        <Badge variant={ITEM_BADGE[i.status].variant} dot>
          {ITEM_BADGE[i.status].label}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      srHeader: 'Actions',
      align: 'right',
      className: 'align-top',
      render: (i) =>
        canAct &&
        r?.status === 'ISSUED' &&
        i.status === 'FAILED' && (
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
                destination: i.destination,
              })
            }
          >
            Retry
          </Button>
        ),
    },
  ];

  const runColumns: Column<PayoutRunSummary>[] = [
    {
      key: 'month',
      header: 'Month',
      render: (s) => <span className="font-medium text-foreground">{monthLabel(s.period)}</span>,
      className: 'whitespace-nowrap',
    },
    {
      key: 'owners',
      header: 'Owners',
      numeric: true,
      render: (s) => s.owners,
    },
    {
      key: 'total',
      header: 'Total',
      numeric: true,
      render: (s) => <span className="font-medium text-foreground">{formatCurrency(s.total)}</span>,
    },
    {
      key: 'dates',
      header: 'Drafted',
      render: (s) => (
        <>
          {formatDate(s.createdAt)}
          {s.issuedAt && (
            <span className="block text-xs text-muted-foreground">
              Issued {formatDate(s.issuedAt)}
            </span>
          )}
        </>
      ),
      className: 'whitespace-nowrap text-muted-foreground',
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <span className="flex flex-wrap items-center gap-1.5">
          <Badge variant={s.status === 'ISSUED' ? 'success' : 'warning'} dot>
            {s.status === 'ISSUED' ? 'Issued' : 'Waiting to be issued'}
          </Badge>
          {s.failed > 0 && <Badge variant="danger">{s.failed} failed</Badge>}
        </span>
      ),
    },
    {
      key: 'open',
      header: '',
      srHeader: 'Actions',
      align: 'right',
      render: (s) => (
        <Button
          size="sm"
          variant="outline"
          aria-expanded={openRun === s.id}
          iconPosition="right"
          icon={
            <ChevronDown
              className={cn('transition-transform duration-150', openRun === s.id && 'rotate-180')}
            />
          }
          onClick={() => setOpenRun(openRun === s.id ? null : s.id)}
        >
          {openRun === s.id ? 'Hide' : 'Open'}
        </Button>
      ),
    },
  ];

  const waitingRuns = runs.data?.filter((s) => s.status === 'DRAFTED').length ?? 0;
  const failedPayouts = runs.data?.reduce((sum, s) => sum + s.failed, 0) ?? 0;
  const latestRun = runs.data?.[0];

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Payout runs"
        description="Pay every owner for a month at once. Drafting writes each owner's statement (fees and expenses as usual); someone other than the person who drafted it issues the run, and each statement then pays out, or waits for approval above the release threshold."
      />

      {runs.data && runs.data.length > 0 && (
        <StatGroup
          title="Runs"
          className="mb-6"
          items={[
            {
              label: 'Waiting to be issued',
              value: waitingRuns,
              subtitle: 'Drafted, not yet paid',
              icon: Clock,
              attention: waitingRuns > 0,
            },
            {
              label: 'Failed payouts',
              value: failedPayouts,
              subtitle: 'Across issued runs',
              icon: AlertTriangle,
              attention: failedPayouts > 0,
            },
            {
              label: 'Latest run',
              value: latestRun ? formatCurrency(latestRun.total) : '–',
              subtitle: latestRun
                ? `${monthLabel(latestRun.period)} · ${latestRun.owners} owner${latestRun.owners === 1 ? '' : 's'}`
                : undefined,
              icon: Landmark,
            },
          ]}
        />
      )}

      {canAct && (
        <Card className="mb-6 flex flex-wrap items-end gap-3 p-5">
          <Field label="Month that has ended">
            <Select
              value={period}
              onValueChange={setPeriod}
              options={monthOptions}
              className="w-48"
            />
          </Field>
          <Button
            variant="primary"
            disabled={!period}
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
        <DataTable
          caption="Payout runs"
          columns={runColumns}
          data={runs.data}
          getRowKey={(s) => s.id}
          isRowSelected={(s) => openRun === s.id}
          renderExpanded={(s) =>
            openRun !== s.id ? null : !r && run.isLoading ? (
              <div className="space-y-2" role="status" aria-label="Loading run">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : r ? (
              <div className="rounded-lg border border-border bg-card">
                <DataTable
                  variant="bare"
                  caption={`Owner statements in the ${monthLabel(r.period)} payout run`}
                  density="compact"
                  columns={itemColumns}
                  data={r.items}
                  getRowKey={(i) => i.id}
                />
                {canAct && r.status === 'DRAFTED' && (
                  <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-3">
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
            ) : null
          }
        />
      )}

      <ConfirmDialog
        open={confirmingIssue && !!r}
        onOpenChange={setConfirmingIssue}
        title={`Pay ${toIssue.length} owner${toIssue.length === 1 ? '' : 's'} ${formatCurrency(issueTotal)} for ${r ? monthLabel(r.period) : ''}?`}
        description={`Each owner's statement pays out to that owner's current payout account (${toIssue
          .map((i) => {
            const account = payoutAccountLabel(i.destination);
            const amount = i.netPayout != null ? formatCurrency(i.netPayout) : '—';
            return `${i.ownerName} ${amount}${
              i.destination === undefined ? '' : ` to ${account ?? 'no account on file'}`
            }`;
          })
          .join(
            '; '
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
        }'s current payout account. ${
          confirmingRetry?.destination !== undefined
            ? payoutDestinationSentence(confirmingRetry?.destination)
            : 'If they changed their account after it failed, check the change was really theirs before you retry.'
        }`}
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
