'use client';

import { useState } from 'react';
import { Badge, Button, Field, Select, Textarea } from '@sureground/ui';
import { Gavel, Undo2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';

// An issued statement is never rewritten: an upheld query shows as a correction on the next one. `moneyEffect` is rendered, not derived.

/** Mirrors the API's floor. */
export const MIN_DISPUTE_REASON = 20;

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
  canRaise: boolean;
  isRaising?: boolean;
  isWithdrawing?: boolean;
  onRaise: (lineId: string, reason: string) => Promise<boolean>;
  onWithdraw: (disputeId: string) => void;
}) {
  const [lineId, setLineId] = useState('');
  const [reason, setReason] = useState('');

  const openLineIds = new Set(
    (disputes ?? []).filter((d) => d.status === 'OPEN').map((d) => d.lineId)
  );
  // A line already under review is left out (the API refuses it), and so is a zero line: reversing it corrects nothing.
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

                {dispute.outcomeNote && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dispute.status === 'UPHELD'
                      ? 'Upheld. Credited on your next statement'
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
                hint={`Enter at least ${MIN_DISPUTE_REASON} characters. The reviewer will use this explanation.`}
              >
                <Textarea
                  id="dispute-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="e.g. This repair was never approved and no invoice or receipt was ever sent to me."
                />
              </Field>

              <p className="text-xs text-muted-foreground">
                The statement will not be changed. If Sureground upholds this, the correction
                appears on your next statement. Until it is decided, a payout that has not been sent
                is paused.
              </p>

              <div className="flex justify-end">
                <Button
                  rounded="md"
                  className="gap-2"
                  isLoading={isRaising}
                  disabled={!longEnough}
                  onClick={async () => {
                    const raised = await onRaise(lineId, reason.trim());
                    if (raised) {
                      setLineId('');
                      setReason('');
                    }
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
