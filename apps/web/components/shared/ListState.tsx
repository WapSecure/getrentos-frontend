'use client';

import type { ReactNode } from 'react';
import { cn } from '@getrentos/shared';
import { PageErrorState, Skeleton } from '@getrentos/ui';

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
 * empty, which includes the first render before the request resolves: so a
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
  errorDescription = 'This was a connection problem: nothing was lost. Try again.',
}: ListStateProps) => {
  if (query.isPending) {
    return (
      <div className="space-y-3" role="status" aria-busy="true" aria-label="Loading">
        {Array.from({ length: skeletonRows }).map((_, index) => (
          <Skeleton key={index} className={cn('rounded-2xl', skeletonClassName)} />
        ))}
      </div>
    );
  }

  // Rows already on screen stay there through a failed refresh.
  if (query.isError && items.length === 0) {
    return (
      <PageErrorState
        headingLevel="h2"
        title={errorTitle}
        description={errorDescription}
        onRetry={query.refetch ? () => void query.refetch?.() : undefined}
        isRetrying={query.isFetching}
        className="min-h-0 py-12"
      />
    );
  }

  if (items.length === 0) return <>{empty}</>;

  return <>{children}</>;
};
