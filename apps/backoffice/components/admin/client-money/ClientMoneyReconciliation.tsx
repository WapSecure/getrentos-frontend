'use client';

import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Landmark, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogTitle,
  EmptyState,
  Field,
  PageErrorState,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { ReleaseQueue } from './ReleaseQueue';
import { DisputeQueue } from './DisputeQueue';
import { hasAdminPermission } from '@/lib/adminAccess';
import { useAdminUser } from '@/app/(dashboard)/admin/layout';
import {
  STATUS_LABELS,
  STATUS_VARIANT,
  adminClientMoneyService,
  driftDirection,
  driftSentence,
  type ReconciliationRow,
  type ReconciliationStatus,
} from '@/services/adminClientMoneyService';

/**
 * Client money: what we hold, and whether it is still there.
 *
 * The whole point of this screen is the difference between three states that are
 * easy to render identically and must not be: the bank agrees, the bank does not,
 * and nobody has checked. Only the first is reassuring; the third is the one a
 * dashboard quietly renders as a green tick, and it is the reason `UNATTESTED`
 * exists as a status rather than as a null drift.
 *
 * The money figures are shown as a two-sided comparison — what owners are owed
 * against what the account holds — because the useful question is not "is there
 * a number" but "which direction is it out, and by how much".
 */
export function ClientMoneyReconciliation() {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canAttest = hasAdminPermission(user?.roles ?? [], 'escrow.approve');
  const canRelease = hasAdminPermission(user?.roles ?? [], 'escrow.approve');

  const [tab, setTab] = useState<'pools' | 'releases' | 'disputes'>('pools');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const notify = (message: string, variant: ToastVariant) => setToast({ message, variant });

  const [attestOpen, setAttestOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [asOfDate, setAsOfDate] = useState(today());
  const [note, setNote] = useState('');
  const [holder, setHolder] = useState<string>('platform');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: adminKeys.clientMoneyReconciliation,
    queryFn: () => unwrap(adminClientMoneyService.overview()),
  });

  /**
   * The same query the queue tab runs, so React Query serves one cache entry to
   * both — the count on the tab cannot disagree with the list behind it.
   */
  const releases = useQuery({
    queryKey: adminKeys.clientMoneyReleases,
    queryFn: () => unwrap(adminClientMoneyService.pendingReleases()),
    // Read is gated on the same permission as deciding, because the queue exists
    // only to be worked through. A tab that could only be looked at is a taunt.
    enabled: canRelease,
  });
  const waitingCount = releases.data?.length ?? 0;

  /** The same cache entry the disputes tab renders, so the count cannot disagree. */
  const disputes = useQuery({
    queryKey: adminKeys.clientMoneyDisputes,
    queryFn: () => unwrap(adminClientMoneyService.pendingDisputes()),
    enabled: canRelease,
  });
  const openDisputeCount = disputes.data?.length ?? 0;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: adminKeys.clientMoneyReconciliation });
  };

  const attest = useMutation({
    mutationFn: () =>
      unwrap(
        adminClientMoneyService.recordBankBalance({
          // `platform` is the GetRentos pool; the API takes that as a null holder.
          organizationId: holder === 'platform' ? null : holder,
          asOfDate,
          balance,
          note: note.trim() || undefined,
        })
      ),
    onSuccess: () => {
      invalidate();
      setAttestOpen(false);
      setNote('');
      setBalance(0);
      notify('Balance recorded. Run the reconciliation to see the verdict.', 'success');
    },
    onError: (err: Error) => notify(err.message, 'error'),
  });

  const run = useMutation({
    mutationFn: () => unwrap(adminClientMoneyService.run()),
    onSuccess: () => {
      invalidate();
      notify('Reconciliation run finished.', 'success');
    },
    onError: (err: Error) => notify(err.message, 'error'),
  });

  if (error) {
    return <PageErrorState description={(error as Error).message} onRetry={() => void refetch()} />;
  }

  const rows = data?.rows ?? [];
  const attestation = data?.attestation;
  const unattested = rows.filter((row) => row.status === 'UNATTESTED').length;
  const failing = rows.filter(
    (row) => row.status === 'DRIFT' || row.status === 'INTEGRITY_FAILED'
  ).length;

  /** The holders a balance can be recorded against, de-duplicated across dates. */
  const holders = [...new Map(rows.map((row) => [row.organizationId, row])).entries()]
    .filter(([id]) => id !== null)
    .map(([id, row]) => ({ id, name: row.organizationName ?? `Firm ${String(id).slice(0, 8)}…` }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em]">Client money</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Every owner&rsquo;s balance is a claim on a pooled account. This is the daily check that
            the pool still holds what those claims add up to.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tab === 'pools' && (
            <>
              <Button
                variant="outline"
                disabled={isFetching}
                onClick={() => void refetch()}
                aria-label="Reload the reconciliations"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Reload
              </Button>
              <Button
                variant="outline"
                isLoading={run.isPending}
                disabled={!canAttest}
                title={canAttest ? undefined : 'Needs the escrow approve permission'}
                onClick={() => run.mutate()}
              >
                Run reconciliation
              </Button>
              <Button
                disabled={!canAttest}
                title={canAttest ? undefined : 'Needs the escrow approve permission'}
                onClick={() => setAttestOpen(true)}
              >
                Record bank balance
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Two jobs in one domain — checking the pool still holds what we say, and
          letting an owner's held payout out — worked by the same people at
          different moments. Tabs rather than one long page, and the count is on
          the tab because a queue nobody notices is a payout nobody releases. */}
      {canRelease && (
        <div
          role="tablist"
          aria-label="Client money sections"
          className="flex gap-1 border-b border-border"
        >
          <TabButton selected={tab === 'pools'} onClick={() => setTab('pools')}>
            The pooled accounts
          </TabButton>
          <TabButton selected={tab === 'releases'} onClick={() => setTab('releases')}>
            Payouts to release
            {waitingCount > 0 && (
              <span className="ml-2 rounded-full bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
                {waitingCount}
              </span>
            )}
          </TabButton>
          <TabButton selected={tab === 'disputes'} onClick={() => setTab('disputes')}>
            Queries on statements
            {openDisputeCount > 0 && (
              <span className="ml-2 rounded-full bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
                {openDisputeCount}
              </span>
            )}
          </TabButton>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}

      {tab === 'releases' && canRelease ? (
        <ReleaseQueue notify={notify} />
      ) : tab === 'disputes' && canRelease ? (
        <DisputeQueue notify={notify} />
      ) : (
        <>
          {/* Staleness is stated rather than alerted on: an absent process is not an
          incident, but it must not be invisible either. */}
          <Card static className="p-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="flex items-center gap-1.5">
                <Landmark className="h-4 w-4 text-muted-foreground" aria-hidden />
                {attestation?.latestAsOfDate
                  ? `Last counted ${attestation.latestAsOfDate}${
                      attestation.daysSince === 0
                        ? ' (today)'
                        : ` — ${attestation.daysSince} day(s) ago`
                    }`
                  : 'No bank balance has ever been recorded.'}
              </span>
              {failing > 0 && (
                <span className="flex items-center gap-1.5 text-destructive">
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                  {failing} pool(s) do not add up
                </span>
              )}
              {unattested > 0 && (
                <span className="text-muted-foreground">
                  {unattested} pool(s) not checked on the days shown
                </span>
              )}
            </div>
          </Card>

          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((row) => (
                <div key={row} className="h-28 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Nothing has been reconciled yet"
              description="The job runs every night at 2am. Record what the bank holds and run it now to see the first verdict."
            />
          ) : (
            <ul className="space-y-3">
              {rows.map((row) => (
                <li key={row.id}>
                  <PoolCard row={row} />
                </li>
              ))}
            </ul>
          )}

          <Dialog open={attestOpen} onOpenChange={setAttestOpen}>
            <DialogContent>
              <DialogTitle>Record what the bank holds</DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                The whole control depends on this figure coming from outside the ledger. Record what
                the account actually holds, not what we think it should.
              </p>
              <div className="mt-4 space-y-3">
                {/* Drawn from the report rather than a separate holders endpoint:
                every pool the reconciliation knows about is already in it, and
                a second source of truth for "which pools exist" is how the two
                come to disagree. */}
                <Field label="Which pool" htmlFor="holder" required>
                  <select
                    id="holder"
                    value={holder}
                    onChange={(event) => setHolder(event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="platform">GetRentos itself (the platform pool)</option>
                    {holders.map((option) => (
                      <option key={option.id ?? 'platform'} value={option.id ?? 'platform'}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Business date" htmlFor="asOfDate" required>
                  <input
                    id="asOfDate"
                    type="date"
                    value={asOfDate}
                    onChange={(event) => setAsOfDate(event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Balance in the pool" htmlFor="balance" required>
                  <CurrencyInput
                    id="balance"
                    prefix="₦"
                    value={balance}
                    onValueChange={setBalance}
                    placeholder="0"
                  />
                </Field>
                <Field
                  label="Where the figure came from"
                  htmlFor="note"
                  hint="Optional. e.g. GTB *4821 closing"
                >
                  <input
                    id="note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="GTB *4821 closing"
                  />
                </Field>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAttestOpen(false)}>
                  Cancel
                </Button>
                <Button isLoading={attest.isPending} onClick={() => attest.mutate()}>
                  Record
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

/**
 * A tab, as a button that says which one is showing.
 *
 * Hand-rolled rather than pulled in: two tabs do not need a library, and the
 * roles are the part that matters — a screen reader should say which panel is
 * current.
 */
function TabButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        selected
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function PoolCard({ row }: { row: ReconciliationRow }) {
  const who = row.organizationName ?? (row.organizationId ? 'A firm' : 'GetRentos itself');

  return (
    <Card static className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{who}</span>
            <Badge variant={STATUS_VARIANT[row.status]}>{STATUS_LABELS[row.status]}</Badge>
            <span className="text-xs text-muted-foreground">{row.asOfDate}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{driftSentence(row)}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {row.accountsChecked} account(s)
          {/*
            `alertedAt` is history and survives the fix, so it must not read as
            "an alert is open" next to a green badge — a resolved incident and a
            live one look identical otherwise.
          */}
          {row.alertedAt
            ? isFailing(row.status)
              ? ' · staff alerted, unresolved'
              : ' · an earlier alert has cleared'
            : ''}
        </p>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <Money label="Owners are owed" value={row.ledgerTotal} />
        {/* Null is stated as "not recorded" rather than rendered as ₦0, which
            would read as a bank holding nothing. */}
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            The account holds
          </dt>
          <dd className="mt-0.5 tabular-nums">
            {row.bankBalance === null ? (
              <span className="text-muted-foreground">not recorded</span>
            ) : (
              naira(row.bankBalance)
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Difference
          </dt>
          <dd className={`mt-0.5 tabular-nums ${row.drift ? 'font-medium text-destructive' : ''}`}>
            {row.drift === null
              ? '—'
              : row.drift === 0
                ? naira(0)
                : `${driftDirection(row.drift) === 'SHORTFALL' ? 'short' : 'over'} by ${naira(
                    Math.abs(row.drift)
                  )}`}
          </dd>
        </div>
      </dl>

      {row.integrityFindings.length > 0 && (
        <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-xs font-medium text-destructive">
            Accounts whose entries do not explain their balance
          </p>
          <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
            {row.integrityFindings.map((finding) => (
              <li key={finding.accountId} className="tabular-nums">
                owner {finding.ownerId.slice(0, 8)}… — stored {naira(finding.stored)}, entries add
                to {naira(finding.computed)} ({finding.difference > 0 ? 'over' : 'short'} by{' '}
                {naira(Math.abs(finding.difference))})
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function Money({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 tabular-nums">{naira(value)}</dd>
    </div>
  );
}

/** Whole naira, as every amount in this system is. */
function naira(value: number): string {
  return `₦${value.toLocaleString('en-NG')}`;
}

/** The two statuses that mean something is wrong and somebody should be looking. */
function isFailing(status: ReconciliationStatus): boolean {
  return status === 'DRIFT' || status === 'INTEGRITY_FAILED';
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
