'use client';

import { Layers } from 'lucide-react';
import type { TrustScoreBreakdown } from '@/types/trust-score';

interface TrustScoreBreakdownCardProps {
  breakdown: TrustScoreBreakdown;
}

/**
 * Shows WHY a trust score is what it is.
 *
 * The score is weighted by cost-to-fake (identity 35, financial 25, role 15,
 * contact 15, activity 10, minus a capped penalty), so an unexplained number is
 * both unhelpful and easy to misread as arbitrary. Each row states how much of
 * its own weight the account has actually earned.
 */
export const TrustScoreBreakdownCard = ({ breakdown }: TrustScoreBreakdownCardProps) => {
  const dimensions = breakdown.dimensions ?? [];

  return (
    <section className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Layers className="w-5 h-5 text-primary" />
          Score breakdown
        </h2>
        <span className="text-xs text-muted-foreground">{breakdown.version}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Points are weighted by how hard each signal is to fake — a verified identity outweighs
        activity, which is the easiest to farm.
      </p>

      <ul className="space-y-3">
        {dimensions.map((dimension) => {
          const percent = dimension.weight > 0 ? Math.round((dimension.earned / dimension.weight) * 100) : 0;
          return (
            <li key={dimension.id}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm font-medium text-foreground">{dimension.label}</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {dimension.earned}
                  <span className="text-xs"> / {dimension.weight}</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${percent}%` }}
                  role="progressbar"
                  aria-label={dimension.label}
                  aria-valuenow={dimension.earned}
                  aria-valuemin={0}
                  aria-valuemax={dimension.weight}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {breakdown.penalty > 0 && (
        <p className="mt-4 text-sm text-amber-700 dark:text-amber-400">
          A penalty of −{breakdown.penalty} point{breakdown.penalty === 1 ? '' : 's'} is applied for
          unresolved issues on this account.
        </p>
      )}
    </section>
  );
};
