'use client';

import type { ReactNode } from 'react';
import { cn } from '@sureground/shared';
import { PageErrorState, Skeleton } from '@sureground/ui';

interface AsyncState {
  isPending: boolean;
  isError: boolean;
  isFetching?: boolean;
  refetch?: () => unknown;
}

interface ListStateProps {
  items: unknown[];
  query: AsyncState;
  empty: ReactNode;
  children: ReactNode;
  skeletonRows?: number;
  skeletonClassName?: string;
  errorTitle?: string;
  errorDescription?: string;
}

// Loading, error and empty are distinct: an empty array before the request resolves is not "nothing here yet".
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
