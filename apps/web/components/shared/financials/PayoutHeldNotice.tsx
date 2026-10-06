'use client';

import { Clock, ShieldAlert } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';

/**
 * Why an owner's payout is not on its way.
 *
 * Three states look alike on a screen and must not be confused: the bank is slow
 * (`PENDING`), a second person is checking (`AWAITING_APPROVAL`), or a second
 * person refused (`REJECTED`). The first is a wait. The other two are decisions
 * about this owner's money, and the refusal is the one they will ring up about —
 * so it is the one that has to say why.
 *
 * Neither held state is a failure and neither loses the money. It has not been
 * sent, which is not the same as not being owed, and a screen that renders it as
 * an error would send the owner looking for a problem that does not exist.
 */
export interface StatementReleaseSummary {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
  thresholdAtRequest: number;
}

export function PayoutHeldNotice({
  payoutStatus,
  release,
}: {
  payoutStatus: string;
  release?: StatementReleaseSummary | null;
}) {
  if (payoutStatus !== 'AWAITING_APPROVAL' && payoutStatus !== 'REJECTED') return null;

  const refused = payoutStatus === 'REJECTED';
  const Icon = refused ? ShieldAlert : Clock;

  return (
    <div
      className={`mt-6 rounded-xl border p-4 ${
        refused ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-muted/40'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <Icon
          className={`mt-0.5 h-4 w-4 shrink-0 ${
            refused ? 'text-destructive' : 'text-muted-foreground'
          }`}
          aria-hidden
        />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium">
            {refused ? 'This payout was held back' : 'Held for a second approval'}
          </p>

          {refused ? (
            <>
              {release?.decisionNote && (
                <p className="text-sm text-muted-foreground">
                  &ldquo;{release.decisionNote}&rdquo;
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {/* The distinction that matters to the reader. */}
                The money is still owed to you — it has not been sent, rather than lost. Sending it
                again is possible once whatever was raised has been dealt with.
              </p>
              {release?.decidedAt && (
                <p className="text-xs text-muted-foreground">
                  Held on {formatDate(release.decidedAt)}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Payouts of {formatCurrency(release?.thresholdAtRequest ?? 0)} or more are released
                by two people, so this one is waiting for a second GetRentos check before it is
                sent.
              </p>
              <p className="text-xs text-muted-foreground">
                Your money is unaffected. Nothing has left the account, and nothing will until
                somebody has checked this.
              </p>
              {release?.requestedAt && (
                <p className="text-xs text-muted-foreground">
                  Waiting since {formatDate(release.requestedAt)}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
