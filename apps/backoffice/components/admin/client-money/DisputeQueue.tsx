'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogTitle,
  EmptyState,
  Field,
  PageErrorState,
  Select,
  Textarea,
} from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { Gavel, Inbox } from 'lucide-react';
import { adminKeys } from '@/lib/queryKeys';
import { hasAdminPermission } from '@/lib/adminAccess';
import { useAdminUser } from '@/app/(dashboard)/admin/layout';
import {
  adminClientMoneyService,
  type StatementLineDisputeRow,
} from '@/services/adminClientMoneyService';

/**
 * The adjudication queue.
 *
 * These are owners disagreeing with a figure on a statement they have already
 * been given, and the platform decides them: the scope puts owner-manager
 * disputes here, and a firm that could close its own case would be marking its own
 * homework. So this screen is where a complaint about money actually ends.
 *
 * The two things it refuses to blur:
 *
 * - **What is at stake depends on where the payout is.** `moneyEffect` is
 *   rendered, not derived. Upheld against a payout that has not left reverses the
 *   line and the correction rides the next statement; upheld against one already
 *   sent is the same correction with no hold to lift. Telling an officer "held"
 *   while a transfer is with the bank would have them looking for money to
 *   unfreeze that was never frozen.
 * - **The statement is not edited.** Upholding writes an adjustment. The wrong
 *   figure stays on the record it appeared on, which is the point.
 */
export function DisputeQueue({
  notify,
}: {
  notify: (message: string, variant: 'success' | 'error') => void;
}) {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canDecide = hasAdminPermission(user?.roles ?? [], 'escrow.approve');

  const [pending, setPending] = useState<{
    row: StatementLineDisputeRow;
    outcome: 'UPHELD' | 'REJECTED';
  } | null>(null);
  const [outcome, setOutcome] = useState<'UPHELD' | 'REJECTED'>('UPHELD');
  const [note, setNote] = useState('');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: adminKeys.clientMoneyDisputes,
    queryFn: () => unwrap(adminClientMoneyService.pendingDisputes()),
  });

  const resolve = useMutation({
    mutationFn: (input: { id: string; outcome: 'UPHELD' | 'REJECTED'; note: string }) =>
      unwrap(adminClientMoneyService.resolveDispute(input.id, input.outcome, input.note)),
    onSuccess: (result, input) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.clientMoneyDisputes });
      // A decided query frees a held payout and writes a ledger correction, so
      // both of the other tabs are now stale.
      void queryClient.invalidateQueries({ queryKey: adminKeys.clientMoneyReleases });
      void queryClient.invalidateQueries({ queryKey: adminKeys.clientMoneyReconciliation });
      setNote('');
      setPending(null);
      notify(
        input.outcome === 'UPHELD'
          ? 'Upheld. The owner is credited on their next statement, and any payout held by this frees up.'
          : 'Not upheld. The figure stands and any payout held by this frees up.',
        'success'
      );
      void result;
    },
    onError: (err: Error) => notify(err.message, 'error'),
  });

  if (error) {
    return <PageErrorState description={(error as Error).message} onRetry={() => void refetch()} />;
  }

  const rows = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Owners disagreeing with a figure on an issued statement. Upholding a query does not change
          the statement — it credits the owner on their next one. Until a query is decided, a payout
          that has not been sent is held.
        </p>
        <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>
          Reload
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((row) => (
            <div key={row} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No open queries"
          description="Every statement line an owner has questioned has been decided. New ones appear here the moment they are raised."
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const held = row.moneyEffect === 'HELD';
            return (
              <li key={row.id}>
                <Card static className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-semibold tabular-nums">
                          ₦{Math.abs(row.lineAmount).toLocaleString('en-NG')}
                        </span>
                        <Badge variant={held ? 'warning' : 'neutral'}>
                          {held
                            ? 'Payout held'
                            : row.moneyEffect === 'IN_FLIGHT'
                              ? 'Payout already sent'
                              : row.moneyEffect === 'PAID'
                                ? 'Payout already paid'
                                : 'No payout affected'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm">{row.lineLabel}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        &ldquo;{row.reason}&rdquo;
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Raised by {row.raisedByName ?? 'the owner'} on{' '}
                        {new Date(row.createdAt).toLocaleDateString('en-GB')}
                      </p>
                      {row.firmResponse && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          The manager replied
                          {row.firmRespondedByName ? ` (${row.firmRespondedByName})` : ''}: &ldquo;
                          {row.firmResponse}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        disabled={!canDecide}
                        title={canDecide ? undefined : 'Needs the escrow approve permission'}
                        onClick={() => {
                          setNote('');
                          setOutcome('REJECTED');
                          setPending({ row, outcome: 'REJECTED' });
                        }}
                      >
                        Not upheld
                      </Button>
                      <Button
                        disabled={!canDecide}
                        title={
                          canDecide
                            ? undefined
                            : 'Upholding moves money, so it needs the escrow approve permission'
                        }
                        onClick={() => {
                          setNote('');
                          setOutcome('UPHELD');
                          setPending({ row, outcome: 'UPHELD' });
                        }}
                      >
                        Uphold
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {pending && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setPending(null);
          }}
        >
          <DialogContent className="max-w-lg">
            <div className="p-6">
              <DialogTitle className="text-lg font-semibold tracking-[-0.02em]">
                Decide this query
              </DialogTitle>

              <p className="mt-2 text-sm text-muted-foreground">
                {pending.row.lineLabel} — ₦
                {Math.abs(pending.row.lineAmount).toLocaleString('en-NG')}
              </p>

              <div className="mt-4">
                <Field label="Outcome" htmlFor="dispute-outcome">
                  <Select
                    ariaLabel="Outcome"
                    value={outcome}
                    onValueChange={(value) => setOutcome(value as 'UPHELD' | 'REJECTED')}
                    options={[
                      {
                        value: 'UPHELD',
                        label: `Upheld — reverse ₦${Math.abs(pending.row.lineAmount).toLocaleString('en-NG')} on the next statement`,
                      },
                      { value: 'REJECTED', label: 'Not upheld — the line stands' },
                    ]}
                  />
                </Field>
              </div>

              {/*
                What the outcome will actually do, said before it is done. An
                officer should not discover the difference between holding and
                reversing from the toast afterwards.
              */}
              <p className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                {outcome === 'UPHELD'
                  ? 'The statement is NOT changed. The owner is credited on their next statement as a correction, so the wrong figure stays visible where it appeared.'
                  : 'The figure stands. Nothing is credited.'}
                {pending.row.moneyEffect === 'HELD'
                  ? ' Because this payout has not been sent, deciding this releases the hold either way.'
                  : pending.row.moneyEffect === 'IN_FLIGHT'
                    ? ' The payout is already with the bank, so it cannot be paused or recalled.'
                    : pending.row.moneyEffect === 'PAID'
                      ? ' The payout has already been sent, so this cannot change it.'
                      : ''}
              </p>

              <div className="mt-4">
                <Field
                  label="What did you check?"
                  htmlFor="dispute-note"
                  hint="At least 10 characters — the owner is told this, and it is the reason the field is required."
                >
                  <Textarea
                    id="dispute-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder={
                      outcome === 'UPHELD'
                        ? 'e.g. No approval on file and no invoice was ever issued for this charge.'
                        : 'e.g. The invoice is on file and the caretaker approved it in writing.'
                    }
                  />
                </Field>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPending(null)}>
                  Cancel
                </Button>
                <Button
                  isLoading={resolve.isPending}
                  disabled={note.trim().length < 10}
                  onClick={() => resolve.mutate({ id: pending.row.id, outcome, note: note.trim() })}
                >
                  <Gavel className="mr-1.5 h-4 w-4" />
                  {outcome === 'UPHELD' ? 'Uphold and correct' : 'Mark not upheld'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
