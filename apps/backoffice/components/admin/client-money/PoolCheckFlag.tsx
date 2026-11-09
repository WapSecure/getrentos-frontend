'use client';

import { Badge, Card } from '@sureground/ui';
import { AlertTriangle, CircleHelp, ShieldQuestion } from '@sureground/icons';
import type { ReconciliationRow } from '@/services/adminClientMoneyService';

const naira = (value: number) => `₦${value.toLocaleString('en-NG')}`;
const date = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// Flag-only: a drift is often just a late bank feed, and blocking on it would deadlock every payout. No verdict at all must never render as nothing, since that reads as fine.
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

  // MATCHED renders nothing: the absence of a flag is the signal.
  if (pool.status === 'MATCHED') return null;

  if (pool.status === 'INTEGRITY_FAILED') {
    return (
      <Flag
        tone="danger"
        Icon={AlertTriangle}
        title="Our own ledger records disagree"
        detail={
          `${pool.integrityFindings.length} account(s) hold a balance that does not equal the sum of ` +
          `their own entries. This is a fault on our side, not at the bank. Do not investigate it there.`
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
            <Badge variant="neutral">Does not block this release</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
    </Card>
  );
}
