'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Landmark, RefreshCw, ShieldCheck } from '@sureground/icons';
import {
  Badge,
  Button,
  Card,
  CardSkeleton,
  CurrencyInput,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  PageErrorState,
  PageHeader,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
  type ToastVariant,
} from '@sureground/ui';
import { unwrap } from '@sureground/shared';
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

// UNATTESTED (nobody has checked) must never render like a match; that is why it is a status rather than a null drift.
export function ClientMoneyReconciliation() {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canAttest = hasAdminPermission(user?.roles ?? [], 'escrow.approve');
  const canRelease = hasAdminPermission(user?.roles ?? [], 'escrow.approve');

  const [tab, setTab] = useState<'pools' | 'releases' | 'disputes'>('pools');
  const toast = useToast();
  const notify = (message: string, variant: ToastVariant) => toast.show(message, variant);

  const [attestOpen, setAttestOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [asOfDate, setAsOfDate] = useState(today());
  const [note, setNote] = useState('');
  const [holder, setHolder] = useState<string>('platform');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: adminKeys.clientMoneyReconciliation,
    queryFn: () => unwrap(adminClientMoneyService.overview()),
  });

  // Same query as the queue tab, so both share one cache entry and the count can't disagree with the list.
  const releases = useQuery({
    queryKey: adminKeys.clientMoneyReleases,
    queryFn: () => unwrap(adminClientMoneyService.pendingReleases()),
    // Read is gated on the deciding permission: the queue exists only to be worked through.
    enabled: canRelease,
  });
  const waitingCount = releases.data?.length ?? 0;

  // Same cache entry as the disputes tab.
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
          // `platform` is the Sureground pool; the API takes that as a null holder.
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

  if (error && !data) {
    return <PageErrorState description={(error as Error).message} onRetry={() => void refetch()} />;
  }

  const rows = data?.rows ?? [];
  const attestation = data?.attestation;
  const unattested = rows.filter((row) => row.status === 'UNATTESTED').length;
  const failing = rows.filter(
    (row) => row.status === 'DRIFT' || row.status === 'INTEGRITY_FAILED'
  ).length;

  const holders = [...new Map(rows.map((row) => [row.organizationId, row])).entries()]
    .filter(([id]) => id !== null)
    .map(([id, row]) => ({ id, name: row.organizationName ?? `Firm ${String(id).slice(0, 8)}…` }));

  const poolsPanel = (
    <>
      {/* Staleness is stated rather than alerted on: an absent process isn't an incident, but must not be invisible. */}
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
            <CardSkeleton key={row} />
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
        <DialogContent size="lg">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Record what the bank holds
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            The whole control depends on this figure coming from outside the ledger. Record what the
            account actually holds, not what we think it should.
          </DialogDescription>
          <div className="mt-4 space-y-3">
            {/* From the report rather than a holders endpoint, so there is one source of truth for which pools exist. */}
            <Field label="Which pool" required>
              <Select
                value={holder}
                onValueChange={setHolder}
                options={[
                  { value: 'platform', label: 'Sureground itself (the platform pool)' },
                  ...holders.map((option) => ({
                    value: option.id ?? 'platform',
                    label: option.name,
                  })),
                ]}
                className="w-full"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Business date" required>
                <DatePicker value={asOfDate} onChange={setAsOfDate} className="w-full" />
              </Field>
              <Field label="Balance in the pool" required>
                <CurrencyInput
                  prefix="₦"
                  value={balance}
                  onValueChange={setBalance}
                  placeholder="0"
                />
              </Field>
            </div>
            <Field label="Where the figure came from" hint="Optional. e.g. GTB *4821 closing">
              <Input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="GTB *4821 closing"
              />
            </Field>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
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
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client money"
        description="Compare owner liabilities with pooled bank balances, release approved payouts, and resolve statement queries."
        actions={
          tab === 'pools' ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={isFetching}
                icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden />}
                onClick={() => void refetch()}
                aria-label="Reload the reconciliations"
              >
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
            </div>
          ) : undefined
        }
      />

      {canRelease ? (
        <Tabs
          value={tab}
          onValueChange={(next) => setTab(next as typeof tab)}
          className="space-y-6"
        >
          <TabsList variant="underline" aria-label="Client money sections">
            <TabsTrigger value="pools">The pooled accounts</TabsTrigger>
            <TabsTrigger value="releases">
              Payouts to release
              {waitingCount > 0 && (
                <Badge variant="danger" className="ml-2">
                  {waitingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="disputes">
              Queries on statements
              {openDisputeCount > 0 && (
                <Badge variant="danger" className="ml-2">
                  {openDisputeCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pools" className="space-y-6">
            {poolsPanel}
          </TabsContent>
          <TabsContent value="releases">
            <ReleaseQueue notify={notify} />
          </TabsContent>
          <TabsContent value="disputes">
            <DisputeQueue notify={notify} />
          </TabsContent>
        </Tabs>
      ) : (
        poolsPanel
      )}
    </div>
  );
}

function PoolCard({ row }: { row: ReconciliationRow }) {
  const who = row.organizationName ?? (row.organizationId ? 'A firm' : 'Sureground itself');

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
          {/* `alertedAt` survives the fix, so it must not read as an open alert next to a green badge. */}
          {row.alertedAt
            ? isFailing(row.status)
              ? ' · staff alerted, unresolved'
              : ' · an earlier alert has cleared'
            : ''}
        </p>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <Money label="Owners are owed" value={row.ledgerTotal} />
        {/* Null reads "not recorded", not ₦0, which would look like a bank holding nothing. */}
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
        <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive-subtle p-3">
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

function naira(value: number): string {
  return `₦${value.toLocaleString('en-NG')}`;
}

function isFailing(status: ReconciliationStatus): boolean {
  return status === 'DRIFT' || status === 'INTEGRITY_FAILED';
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
