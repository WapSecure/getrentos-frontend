'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { PageErrorState } from './PageState';
import { ListSkeleton } from './Skeleton';

interface QueryStateProps {
  isLoading: boolean;
  isError?: boolean;
  /** Retry for the error state, usually the query's refetch. */
  onRetry?: () => void;
  isRetrying?: boolean;
  errorTitle?: string;
  errorDescription?: string;
  /** True when the data loaded but there is nothing to show. */
  isEmpty?: boolean;
  empty?: {
    icon: LucideIcon;
    title: string;
    description?: ReactNode;
    action?: ReactNode;
  };
  /** Custom placeholder; defaults to a list skeleton. */
  loading?: ReactNode;
  /** `section` for a panel inside a page (compact states), `page` for a whole page. */
  scope?: 'section' | 'page';
  children: ReactNode;
}

/**
 * The four states of loaded data in one place — loading, failed, empty, and
 * the content — so every list shows the same skeleton, the same retry and the
 * same empty message instead of each screen inventing its own.
 */
export function QueryState({
  isLoading,
  isError,
  onRetry,
  isRetrying,
  errorTitle,
  errorDescription,
  isEmpty,
  empty,
  loading,
  scope = 'section',
  children,
}: QueryStateProps) {
  if (isLoading) return <>{loading ?? <ListSkeleton />}</>;
  if (isError) {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    return (
      <PageErrorState
        title={errorTitle ?? (scope === 'section' && !offline ? 'This did not load' : undefined)}
        description={errorDescription}
        onRetry={onRetry}
        isRetrying={isRetrying}
        isOffline={offline}
        headingLevel={scope === 'section' ? 'h2' : 'h1'}
        className={scope === 'section' ? 'min-h-0 py-10' : undefined}
      />
    );
  }
  if (isEmpty && empty)
    return <EmptyState {...empty} size={scope === 'section' ? 'compact' : 'default'} />;
  return <>{children}</>;
}
