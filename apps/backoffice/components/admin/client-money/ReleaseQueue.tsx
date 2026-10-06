'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, ConfirmDialog, EmptyState, PageErrorState } from '@getrentos/ui';
import { Inbox } from 'lucide-react';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { hasAdminPermission } from '@/lib/adminAccess';
import { useAdminUser } from '@/app/(dashboard)/admin/layout';
import {
  adminClientMoneyService,
  type ReleaseRequestRow,
} from '@/services/adminClientMoneyService';
import { PoolCheckFlag } from './PoolCheckFlag';

const naira = (value: number) => `₦${value.toLocaleString('en-NG')}`;

/** Matches the date style used across the backoffice's queues. */
const date = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

/**
 * Owner payouts that a second person has to release.
 *
 * This is the queue the maker/checker control produces, and the reason it is a
 * screen rather than a table somebody queries: an owner's money is sitting still
 * until somebody works through it, so it has to be visible without being looked
 * for.
 *
 * Two things the screen refuses to do. It does not offer approval to the person
 * who raised the release — the API refuses it too, so the button would be a lie —
 * and it does not hide a release the viewer raised, because a queue that silently
 * omits rows is one nobody trusts the count of. It marks them instead.
 */
export function ReleaseQueue({
  notify,
}: {
  notify: (message: string, variant: 'success' | 'error') => void;
}) {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canDecide = hasAdminPermission(user?.roles ?? [], 'escrow.approve');

  const [pending, setPending] = useState<{
    row: ReleaseRequestRow;
    action: 'approve' | 'reject';
  } | null>(null);
  const [note, setNote] = useState('');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: adminKeys.clientMoneyReleases,
    queryFn: () => unwrap(adminClientMoneyService.pendingReleases()),
  });

  /**
   * The pool verdicts, joined onto the rows by holder.
   *
   * Read from the reconciliation endpoint rather than added to the release DTO,
   * so there is one definition of "is this pool where it should be" and the two
   * tabs cannot come to disagree about the same money. The release row already
   * names the holder (`organizationId`, null for the platform pool), which is the
   * same key these rows are grouped by.
   */
  const pools = useQuery({
    queryKey: adminKeys.clientMoneyReconciliation,
    queryFn: () => unwrap(adminClientMoneyService.overview()),
  });
  const poolFor = (organizationId: string | null) =>
    pools.data?.rows.find((pool) => pool.organizationId === organizationId);

  /**
   * The pool's condition as a sentence, for the confirmation step.
   *
   * `ConfirmDialog` takes its description as a string, so the row above carries
   * the styling and this carries the words. The words are the part that matters:
   * the approver commits here, and the phrase ends by saying outright that this is
   * a flag rather than a block — otherwise an officer reads "the pool is short" at
   * the moment of signing off and goes looking for a permission they already have.
   */
  const poolClause = (organizationId: string | null): string => {
    const pool = poolFor(organizationId);
    if (!pool) {
      return ' Nothing has checked the pool this money would leave from, which is not the same as it agreeing.';
    }
    if (pool.status === 'MATCHED') return '';
    if (pool.status === 'INTEGRITY_FAILED') {
      return ' Be aware: our own ledger records for this pool disagree with each other. That is a fault on our side, not at the bank.';
    }
    if (pool.status === 'DRIFT') {
      const short = (pool.drift ?? 0) < 0;
      return ` Be aware: this pool is ${short ? 'short' : 'over'} by ${naira(
        Math.abs(pool.drift ?? 0)
      )} as of ${pool.asOfDate}. Not a block — the decision is still yours.`;
    }
    return ' Be aware: nobody has counted this pool, so nothing has confirmed it holds what we say owners are owed.';
  };

  const decide = useMutation({
    mutationFn: (input: { id: string; action: 'approve' | 'reject'; note: string }) =>
      unwrap(
        input.action === 'approve'
          ? adminClientMoneyService.approveRelease(input.id, input.note)
          : adminClientMoneyService.rejectRelease(input.id, input.note)
      ),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.clientMoneyReleases });
      // The statement's own payout status moved with it.
      void queryClient.invalidateQueries({ queryKey: adminKeys.clientMoneyReconciliation });
      setPending(null);
      setNote('');
      notify(
        input.action === 'approve'
          ? 'Released. The statement is now with the bank.'
          : 'Held back. The owner keeps the money owed to them.',
        'success'
      );
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
          Payouts at or above the platform threshold are held until a second person releases them.
          Approving sends the money; holding it back leaves the owner still owed it.
        </p>
        <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>
          Reload
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((row) => (
            <div key={row} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing is waiting"
          description="Every payout above the threshold has been released or held back. New ones appear here the moment a statement is issued."
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            // The server answers this. Deriving it here would need the caller's
            // user id, which the backoffice session does not carry.
            const mine = row.requestedByMe;
            return (
              <li key={row.id}>
                <Card static className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-semibold tabular-nums">
                          ₦{row.amount.toLocaleString('en-NG')}
                        </span>
                        {mine && <Badge variant="neutral">Raised by you</Badge>}
                      </div>
                      <p className="mt-1 text-sm">
                        {row.organizationName ?? row.ownerName ?? 'An owner'}
                        <span className="text-muted-foreground">
                          {' '}
                          · {date(row.periodStart)} to {date(row.periodEnd)}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Asked by {row.requestedByName ?? 'somebody'} on {date(row.createdAt)} · the
                        threshold was ₦{row.thresholdAtRequest.toLocaleString('en-NG')}, which is
                        why this needs two people
                      </p>
                      {row.reason && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Their note: &ldquo;{row.reason}&rdquo;
                        </p>
                      )}

                      {/*
                        The pool this money would leave from. Flag-only, on the
                        decision the approver is about to make — which is the
                        moment it is worth anything.
                      */}
                      <PoolCheckFlag pool={poolFor(row.organizationId)} />
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        disabled={!canDecide || mine}
                        title={
                          mine
                            ? 'You raised this release, so a different person has to decide it'
                            : canDecide
                              ? undefined
                              : 'Needs the escrow approve permission'
                        }
                        onClick={() => {
                          setNote('');
                          setPending({ row, action: 'reject' });
                        }}
                      >
                        Hold back
                      </Button>
                      <Button
                        disabled={!canDecide || mine}
                        title={
                          mine
                            ? 'You raised this release, so a different person has to decide it'
                            : canDecide
                              ? undefined
                              : 'Needs the escrow approve permission'
                        }
                        onClick={() => {
                          setNote('');
                          setPending({ row, action: 'approve' });
                        }}
                      >
                        Release
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
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setPending(null);
          }}
          title={
            pending.action === 'approve'
              ? `Release ₦${pending.row.amount.toLocaleString('en-NG')}?`
              : 'Hold this payout back?'
          }
          description={
            pending.action === 'approve'
              ? 'This sends the owner their money and cannot be undone from here. Say what you checked — the note is the record that two people looked at this.' +
                poolClause(pending.row.organizationId)
              : 'The statement stays issued and the owner is still owed the money. This refuses the release, not the debt, and they can send it for approval again.'
          }
          confirmLabel={pending.action === 'approve' ? 'Release the money' : 'Hold it back'}
          isLoading={decide.isPending}
          promptLabel="What did you check, or why not?"
          // The owner only hears the note when a payout is held back, so the
          // placeholder must not promise them a reason for a release.
          promptPlaceholder={
            pending.action === 'approve'
              ? 'At least 10 characters — this is the second signature on the payout'
              : 'At least 10 characters — the owner is told why it was held'
          }
          promptValue={note}
          onPromptChange={setNote}
          promptRequired
          promptMinLength={10}
          onConfirm={() => decide.mutate({ id: pending.row.id, action: pending.action, note })}
        />
      )}
    </div>
  );
}
