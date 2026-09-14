'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@getrentos/ui';

interface AsyncState {
  isPending: boolean;
  isError: boolean;
  isFetching?: boolean;
  refetch?: () => unknown;
}

interface ListStateProps {
  /** The list behind this surface; its length decides "nothing here yet". */
  items: unknown[];
  /** The owning query. Passing it (rather than three flags) keeps call sites short. */
  query: AsyncState;
  /** Rendered only once we know the list is genuinely empty. */
  empty: ReactNode;
  children: ReactNode;
  /** How many placeholder rows to draw while loading. */
  skeletonRows?: number;
  /** Row height in Tailwind units, matched to the real rows where it matters. */
  skeletonClassName?: string;
  errorTitle?: string;
  errorDescription?: string;
}

/**
 * Renders loading, error and empty states for a fetched list.
 *
 * List pages used to show their "nothing here yet" copy whenever the array was
 * empty, which includes the first render before the request resolves — so a
 * landlord with a full portfolio was briefly told they had none, and invited to
 * start again. The three states are genuinely different and must not be conflated.
 */
export const ListState = ({
  items,
  query,
  empty,
  children,
  skeletonRows = 3,
  skeletonClassName = 'h-24',
  errorTitle = "We couldn't load this",
  errorDescription = 'This was a connection problem — nothing was lost. Try again.',
}: ListStateProps) => {
  if (query.isPending) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading">
        {Array.from({ length: skeletonRows }).map((_, index) => (
          <div
            key={index}
            className={`animate-pulse rounded-2xl border border-border bg-card ${skeletonClassName}`}
          />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{errorTitle}</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{errorDescription}</p>
        {query.refetch && (
          <Button
            variant="primary"
            className="mt-6 gap-2"
            disabled={query.isFetching}
            onClick={() => void query.refetch?.()}
          >
            <RefreshCw className="w-4 h-4" />
            {query.isFetching ? 'Retrying…' : 'Try again'}
          </Button>
        )}
      </div>
    );
  }

  if (items.length === 0) return <>{empty}</>;

  return <>{children}</>;
};
