'use client';

import { formatCurrency } from '@/lib/format';
import type { CreditScoreBand, SharedCreditCheck } from '@/types/credit-check';

const bandLabel: Record<CreditScoreBand, { text: string; className: string }> = {
  POOR: { text: 'Poor', className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
  FAIR: {
    text: 'Fair',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  },
  GOOD: {
    text: 'Good',
    className: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  },
  EXCELLENT: {
    text: 'Excellent',
    className: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  },
};

/** A shared credit check, reduced to what a landlord needs. Sample data is always labelled as such. */
export const CreditSummaryView = ({ check }: { check: SharedCreditCheck }) => {
  const { summary } = check;
  return (
    <div className="space-y-2">
      {check.isSample && (
        <p className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          Sample data for testing. This did not come from a credit bureau.
        </p>
      )}
      {summary.hasCreditFile ? (
        <>
          <div className="flex items-center gap-2 text-sm">
            {summary.scoreBand && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${bandLabel[summary.scoreBand].className}`}
              >
                {bandLabel[summary.scoreBand].text}
              </span>
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
                className={`font-medium ${summary.delinquentAccounts > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}
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
