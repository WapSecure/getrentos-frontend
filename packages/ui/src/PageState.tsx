'use client';

import { AlertTriangle, RefreshCcw, WifiOff, type LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@getrentos/shared';

interface PageErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  isOffline?: boolean;
  className?: string;
}

export function PageErrorState({
  title,
  description,
  onRetry,
  isRetrying = false,
  isOffline = false,
  className,
}: PageErrorStateProps) {
  const Icon: LucideIcon = isOffline ? WifiOff : AlertTriangle;
  const resolvedTitle = title ?? (isOffline ? 'You are offline' : 'We could not load this page');
  const resolvedDescription =
    description ??
    (isOffline
      ? 'Reconnect to the internet, then try again.'
      : 'There may be a temporary problem. Please try again.');

  return (
    <div
      role="alert"
      className={cn(
        'flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-12 text-center',
        className
      )}
    >
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="text-xl font-semibold text-foreground">{resolvedTitle}</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{resolvedDescription}</p>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={onRetry}
          disabled={isRetrying || isOffline}
          isLoading={isRetrying}
        >
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}
