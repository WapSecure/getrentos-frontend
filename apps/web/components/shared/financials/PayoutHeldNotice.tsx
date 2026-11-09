'use client';

import { Clock, Gavel, ShieldAlert } from '@sureground/icons';
import type { ReactNode } from 'react';
import { formatCurrency, formatDate } from '@/lib/format';

// A dispute outranks the threshold explanation, since the owner's own open complaint is why this payout is stuck. Held is not failed: never render it as an error.
export interface StatementReleaseSummary {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
  thresholdAtRequest: number;
}

export interface StatementDisputeSummary {
  openCount: number;
  totalCount: number;
  moneyEffect: 'HELD' | 'IN_FLIGHT' | 'PAID' | 'NONE';
  reason: string | null;
}

export function PayoutHeldNotice({
  payoutStatus,
  release,
  disputeSummary,
}: {
  payoutStatus: string;
  release?: StatementReleaseSummary | null;
  disputeSummary?: StatementDisputeSummary | null;
}) {
  const openDisputes = disputeSummary?.openCount ?? 0;

  if (disputeSummary?.moneyEffect === 'HELD') {
    return (
      <Notice tone="attention" Icon={Gavel} title="Held while a line is disputed">
        <p className="text-xs text-muted-foreground">
          {openDisputes === 1
            ? 'You disputed a line on this statement, so the payout is paused until it is decided.'
            : `You disputed ${openDisputes} lines on this statement, so the payout is paused until they are decided.`}
        </p>
        {disputeSummary.reason && (
          <p className="text-xs text-muted-foreground">&ldquo;{disputeSummary.reason}&rdquo;</p>
        )}
        {payoutStatus === 'REJECTED' && release?.decisionNote && (
          <p className="text-xs text-muted-foreground">
            A reviewer also held it back: &ldquo;{release.decisionNote}&rdquo;
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Nothing has left the account. An issued statement is never rewritten, so if your query is
          upheld the correction appears on your next statement.
        </p>
      </Notice>
    );
  }

  const refused = payoutStatus === 'REJECTED';
  const awaiting = payoutStatus === 'AWAITING_APPROVAL';

  // A dispute that can no longer stop the money: saying "held" here would be false, the money is gone or going.
  const sentOrGoing =
    openDisputes > 0 &&
    (disputeSummary?.moneyEffect === 'IN_FLIGHT' || disputeSummary?.moneyEffect === 'PAID');
  if (sentOrGoing && !refused && !awaiting) {
    return (
      <Notice tone="neutral" Icon={Gavel} title="A line on this statement is being looked at">
        <p className="text-xs text-muted-foreground">
          {disputeSummary?.moneyEffect === 'PAID'
            ? 'This payout has already been sent, so it cannot be paused. If your query is upheld the correction appears on your next statement.'
            : 'This payout is already with the bank, so it cannot be paused. If your query is upheld the correction appears on your next statement.'}
        </p>
        {disputeSummary?.reason && (
          <p className="text-xs text-muted-foreground">&ldquo;{disputeSummary.reason}&rdquo;</p>
        )}
      </Notice>
    );
  }

  if (!refused && !awaiting) return null;

  return (
    <Notice
      tone={refused ? 'warning' : 'neutral'}
      Icon={refused ? ShieldAlert : Clock}
      title={refused ? 'This payout was held back' : 'Held for a second approval'}
    >
      {refused ? (
        <>
          {release?.decisionNote && (
            <p className="text-sm text-muted-foreground">&ldquo;{release.decisionNote}&rdquo;</p>
          )}
          <p className="text-xs text-muted-foreground">
            The money is still owed to you. It has not been sent or lost. Sending it again is
            possible once whatever was raised has been dealt with.
          </p>
          {release?.decidedAt && (
            <p className="text-xs text-muted-foreground">Held on {formatDate(release.decidedAt)}</p>
          )}
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Payouts of {formatCurrency(release?.thresholdAtRequest ?? 0)} or more are released by
            two people, so this one is waiting for a second Sureground check before it is sent.
          </p>
          <p className="text-xs text-muted-foreground">
            Your money is unaffected. Nothing has left the account, and nothing will until somebody
            has checked this.
          </p>
          {release?.requestedAt && (
            <p className="text-xs text-muted-foreground">
              Waiting since {formatDate(release.requestedAt)}
            </p>
          )}
        </>
      )}
    </Notice>
  );
}

function Notice({
  tone,
  Icon,
  title,
  children,
}: {
  tone: 'neutral' | 'attention' | 'warning';
  Icon: typeof Clock;
  title: string;
  children: ReactNode;
}) {
  const shell = {
    neutral: 'border-border bg-muted/40',
    attention: 'border-primary/30 bg-primary/5',
    warning: 'border-destructive/30 bg-destructive/5',
  }[tone];
  const iconTone = {
    neutral: 'text-muted-foreground',
    attention: 'text-primary',
    warning: 'text-destructive',
  }[tone];

  return (
    <div className={`mt-6 rounded-xl border p-4 ${shell}`}>
      <div className="flex items-start gap-2.5">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconTone}`} aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium">{title}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
