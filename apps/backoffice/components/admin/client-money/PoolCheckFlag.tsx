'use client';

import { Badge, Card } from '@getrentos/ui';
import { AlertTriangle, CircleHelp, ShieldQuestion } from 'lucide-react';
import type { ReconciliationRow } from '@/services/adminClientMoneyService';

/** Matches how the rest of this app writes money and dates. */
const naira = (value: number) => `₦${value.toLocaleString('en-NG')}`;
const date = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * What the pool this payout leaves from is currently doing.
 *
 * Confirmed as **flag-only**: the approver sees it and still decides. A drift is
 * often nothing more than a bank feed that arrived late, and blocking on it would
 * deadlock every payout on the platform the first time a statement was slow. So
 * this states the fact and makes no claim about whether to proceed — copy that
 * implied a gate would have an officer hunting for a permission they already
 * have.
 *
 * The one thing it will not do is stay quiet about a problem or shout about an
 * absence:
 *
 * - `MATCHED` renders **nothing**. A green tick on every row is noise, and the
 *   absence of a flag is the signal.
 * - `DRIFT` and `INTEGRITY_FAILED` are red, and they are told apart. One means
 *   the bank holds less than we say owners are owed; the other means **our own
 *   records disagree with themselves**, and an officer sent to the bank over the
 *   second one is being sent to the wrong place.
 * - `UNATTESTED` is neutral, never red and never green. Nobody has counted this
 *   pool, which is not an incident — it is the absence of a process, and the 3e
 *   decision that it must never render as agreement is why it says so plainly.
 * - A pool with **no verdict at all** is its own sentence. It is the one reading
 *   that could be mistaken for "fine", so it never renders as nothing.
 */
export function PoolCheckFlag({ pool }: { pool: ReconciliationRow | null | undefined }) {
  if (!pool) {
    return (
      <Flag
        tone="neutral"
        Icon={CircleHelp}
        title="This pool has no reconciliation on record"
        detail="Nothing has checked whether it holds what we say owners are owed. That is not the same as it agreeing."
      />
    );
  }

  // The agreement case says nothing at all. See the note above.
  if (pool.status === 'MATCHED') return null;

  if (pool.status === 'INTEGRITY_FAILED') {
    return (
      <Flag
        tone="danger"
        Icon={AlertTriangle}
        title="Our own ledger records disagree"
        detail={
          `${pool.integrityFindings.length} account(s) hold a balance that does not equal the sum of ` +
          `their own entries. This is a fault on our side, not at the bank — do not go looking for it there.`
        }
      />
    );
  }

  if (pool.status === 'DRIFT') {
    const short = (pool.drift ?? 0) < 0;
    return (
      <Flag
        tone="danger"
        Icon={AlertTriangle}
        title={short ? 'The pool is short' : 'The pool holds more than we say'}
        detail={
          `As of ${pool.asOfDate} the bank holds ${naira(pool.bankBalance ?? 0)} against ` +
          `${naira(pool.ledgerTotal)} of owner balances — ` +
          `${short ? 'short by' : 'over by'} ${naira(Math.abs(pool.drift ?? 0))}. ` +
          (short
            ? 'Releasing makes the shortfall larger.'
            : 'Nobody has explained where the extra came from.')
        }
      />
    );
  }

  // UNATTESTED.
  return (
    <Flag
      tone="neutral"
      Icon={ShieldQuestion}
      title="Nobody has counted this pool"
      detail={
        pool.asOfDate
          ? `The last check on record is ${date(pool.asOfDate)}, and it did not include a bank figure. ` +
            'Nothing has confirmed the pool holds what we say owners are owed.'
          : 'No bank figure has ever been recorded for it. Nothing has confirmed the pool holds what we say owners are owed.'
      }
    />
  );
}

/** The shell, so the four readings cannot drift apart visually. */
function Flag({
  tone,
  Icon,
  title,
  detail,
}: {
  tone: 'neutral' | 'danger';
  Icon: typeof AlertTriangle;
  title: string;
  detail: string;
}) {
  return (
    <Card
      static
      className={`mt-3 p-3 ${tone === 'danger' ? 'border-destructive/30 bg-destructive/5' : 'bg-muted/40'}`}
    >
      <div className="flex items-start gap-2.5">
        <Icon
          className={`mt-0.5 h-4 w-4 shrink-0 ${
            tone === 'danger' ? 'text-destructive' : 'text-muted-foreground'
          }`}
          aria-hidden
        />
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium">{title}</p>
            {/* Stated, because the absence of a gate is the whole decision. */}
            <Badge variant="neutral">Does not block this release</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
    </Card>
  );
}
