'use client';

import { Badge, type BadgeVariant } from '@sureground/ui';
import { formatCurrency } from '@/lib/format';
import type { CreditScoreBand, SharedCreditCheck } from '@/types/credit-check';

const bandLabel: Record<CreditScoreBand, { text: string; variant: BadgeVariant }> = {
  POOR: { text: 'Poor', variant: 'danger' },
  FAIR: { text: 'Fair', variant: 'warning' },
  GOOD: { text: 'Good', variant: 'success' },
  EXCELLENT: { text: 'Excellent', variant: 'success' },
};

/** Sample data is always labelled as such. */
export const CreditSummaryView = ({ check }: { check: SharedCreditCheck }) => {
  const { summary } = check;
  return (
    <div className="space-y-2">
      {check.isSample && (
        <p className="rounded-md bg-warning-subtle px-2 py-1 text-xs font-medium text-warning">
          Sample data for testing. This did not come from a credit bureau.
        </p>
      )}
      {summary.hasCreditFile ? (
        <>
          <div className="flex items-center gap-2 text-sm">
            {summary.scoreBand && (
              <Badge variant={bandLabel[summary.scoreBand].variant}>
                {bandLabel[summary.scoreBand].text}
              </Badge>
            )}
            {summary.score !== null && (
              <span className="font-medium text-foreground tabular-nums">
                Score {summary.score}
              </span>
            )}
          </div>
          <dl className="grid grid-cols-3 gap-3 text-sm tabular-nums">
            <div>
              <dd className="font-medium text-foreground">{summary.activeLoans}</dd>
              <dt className="text-xs text-muted-foreground">Active loans</dt>
            </div>
            <div>
              <dd
                className={`font-medium ${summary.delinquentAccounts > 0 ? 'text-destructive' : 'text-foreground'}`}
              >
                {summary.delinquentAccounts}
              </dd>
              <dt className="text-xs text-muted-foreground">Overdue accounts</dt>
            </div>
            <div>
              <dd className="font-medium text-foreground">
                {formatCurrency(summary.totalOutstanding)}
              </dd>
              <dt className="text-xs text-muted-foreground">Still owed</dt>
            </div>
          </dl>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          No credit history was found. That is common for first-time renters and is not a mark
          against them.
        </p>
      )}
    </div>
  );
};
