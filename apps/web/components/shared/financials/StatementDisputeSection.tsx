'use client';

import { useState } from 'react';
import { Badge, Button, Field, Select, Textarea } from '@getrentos/ui';
import { Gavel, Undo2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';

/**
 * An owner's own queries about the figures on a statement, and the way to raise
 * one.
 *
 * The rule the copy has to carry: **an issued statement is never rewritten.** An
 * owner who queries a charge and is upheld does not see the number change on the
 * statement in front of them — they see a correction on the next one. A screen
 * that implied otherwise would have them refreshing this dialog looking for a
 * figure that is never going to move, and would hide the one thing worth telling
 * them: that the wrong figure stays on the record with the correction beside it.
 *
 * `moneyEffect` is rendered rather than derived, because the difference between
 * "your payout is paused" and "your payout already went" is the whole question a
 * person opens this to answer.
 */

/** How long a reason has to be. Mirrors the API's own floor. */
export const MIN_DISPUTE_REASON = 20;

/**
 * The shape this section reads, declared here rather than borrowed from a
 * service.
 *
 * A landlord statement and an estate one are different types that happen to
 * agree, and the owner sees the same thing either way. Taking the shape rather
 * than a type keeps this shared without a shared component importing a feature
 * module's types — the coupling that makes two surfaces drift.
 */
export interface DisputeForDisplay {
  id: string;
  lineId: string;
  lineLabel: string;
  lineAmount: number;
  reason: string;
  status: 'OPEN' | 'UPHELD' | 'REJECTED' | 'WITHDRAWN';
  raisedByMe: boolean;
  firmResponse: string | null;
  resolvedAt: string | null;
  outcomeNote: string | null;
  moneyEffect: 'HELD' | 'IN_FLIGHT' | 'PAID' | 'NONE';
}

/** A line the owner could query. */
export interface LineForDispute {
  id: string;
  label: string;
  amount: number;
}

const STATUS_BADGE: Record<
  DisputeForDisplay['status'],
  { label: string; variant: 'warning' | 'success' | 'danger' | 'neutral' }
> = {
  OPEN: { label: 'Being looked at', variant: 'warning' },
  UPHELD: { label: 'Upheld', variant: 'success' },
  REJECTED: { label: 'Not upheld', variant: 'neutral' },
  WITHDRAWN: { label: 'Withdrawn', variant: 'neutral' },
};

export function StatementDisputeSection({
  lineItems,
  disputes,
  canRaise,
  isRaising,
  isWithdrawing,
  onRaise,
  onWithdraw,
}: {
  lineItems?: LineForDispute[];
  disputes?: DisputeForDisplay[];
  /** False on a draft, which can simply be regenerated. */
  canRaise: boolean;
  isRaising?: boolean;
  isWithdrawing?: boolean;
  onRaise: (lineId: string, reason: string) => void;
  onWithdraw: (disputeId: string) => void;
}) {
  const [lineId, setLineId] = useState('');
  const [reason, setReason] = useState('');

  const openLineIds = new Set(
    (disputes ?? []).filter((d) => d.status === 'OPEN').map((d) => d.lineId)
  );
  // A line already under review is not offered again — the API refuses it, and
  // offering it would be offering something that cannot happen. A zero line is
  // left out too: reversing it would correct nothing.
  const disputable = (lineItems ?? []).filter(
    (line) => line.amount !== 0 && !openLineIds.has(line.id)
  );

  const longEnough = reason.trim().length >= MIN_DISPUTE_REASON;

  return (
    <div className="mt-6 border-t border-border pt-5">
      <div className="flex items-center gap-2">
        <Gavel className="h-4 w-4 text-muted-foreground" aria-hidden />
        <h3 className="text-sm font-medium">Queries about these figures</h3>
      </div>

      {(disputes ?? []).length > 0 && (
        <ul className="mt-3 space-y-2">
          {(disputes ?? []).map((dispute) => {
            const badge = STATUS_BADGE[dispute.status];
            return (
              <li key={dispute.id} className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 text-sm">
                    {dispute.lineLabel}
                    <span className="text-muted-foreground">
                      {' '}
                      · {formatCurrency(Math.abs(dispute.lineAmount))}
                    </span>
                  </p>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">&ldquo;{dispute.reason}&rdquo;</p>

                {dispute.firmResponse && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    The manager replied: &ldquo;{dispute.firmResponse}&rdquo;
                  </p>
                )}

                {dispute.status === 'OPEN' && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dispute.moneyEffect === 'HELD'
                      ? 'Your payout is paused until this is decided.'
                      : dispute.moneyEffect === 'IN_FLIGHT'
                        ? 'Your payout is already with the bank, so it cannot be paused. If this is upheld you are credited on your next statement.'
                        : dispute.moneyEffect === 'PAID'
                          ? 'This payout has already been sent. If this is upheld you are credited on your next statement.'
                          : 'Nobody has decided this yet.'}
                  </p>
                )}

                {/* What the owner is told, which is the reason the note is required. */}
                {dispute.outcomeNote && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dispute.status === 'UPHELD'
                      ? 'Upheld — credited on your next statement'
                      : dispute.status === 'REJECTED'
                        ? 'Not upheld'
                        : 'Closed'}
                    : &ldquo;{dispute.outcomeNote}&rdquo;
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {dispute.resolvedAt && (
                    <span className="text-xs text-muted-foreground">
                      Decided {formatDate(dispute.resolvedAt)}
                    </span>
                  )}
                  {dispute.status === 'OPEN' && dispute.raisedByMe && (
                    <Button
                      variant="outline"
                      rounded="md"
                      className="h-7 gap-1.5 px-2.5 text-xs"
                      isLoading={isWithdrawing}
                      onClick={() => onWithdraw(dispute.id)}
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      Withdraw
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canRaise && disputable.length > 0 && (
        <div className="mt-4 space-y-3">
          <Field label="Something on this statement is wrong?" htmlFor="dispute-line">
            <Select
              ariaLabel="Choose the line to query"
              value={lineId}
              onValueChange={setLineId}
              placeholder="Choose the line"
              options={disputable.map((line) => ({
                value: line.id,
                label: `${line.label} — ${formatCurrency(Math.abs(line.amount))}`,
              }))}
            />
          </Field>

          {lineId && (
            <>
              <Field
                label="What is wrong with it?"
                htmlFor="dispute-reason"
                hint={`At least ${MIN_DISPUTE_REASON} characters — somebody has to adjudicate this, and this is all they get.`}
              >
                <Textarea
                  id="dispute-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="e.g. This repair was never approved and no invoice or receipt was ever sent to me."
                />
              </Field>

              <p className="text-xs text-muted-foreground">
                The statement will not be changed. If GetRentos upholds this, the correction appears
                on your next statement — and until it is decided, a payout that has not been sent is
                paused.
              </p>

              <div className="flex justify-end">
                <Button
                  rounded="md"
                  className="gap-2"
                  isLoading={isRaising}
                  disabled={!longEnough}
                  onClick={() => {
                    onRaise(lineId, reason.trim());
                    setLineId('');
                    setReason('');
                  }}
                >
                  <Gavel className="h-4 w-4" />
                  Raise a query
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {canRaise && disputable.length === 0 && (disputes ?? []).length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          This statement is empty, so there is nothing to query.
        </p>
      )}
    </div>
  );
}
