'use client';

import type { ReactNode } from 'react';
import type { SgIcon } from '@sureground/icons';
import { EmptyState } from './EmptyState';
import { PageErrorState } from './PageState';
import { ListSkeleton } from './Skeleton';

interface QueryStateProps {
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  isRetrying?: boolean;
  errorTitle?: string;
  errorDescription?: string;
  isEmpty?: boolean;
  empty?: {
    icon: SgIcon;
    title: string;
    description?: ReactNode;
    action?: ReactNode;
  };
  loading?: ReactNode;
  scope?: 'section' | 'page';
  children: ReactNode;
}

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
