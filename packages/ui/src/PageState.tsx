'use client';

import { AlertTriangle, Lock, RefreshCcw, WifiOff, type LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@getrentos/shared';

interface PageErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  isOffline?: boolean;
  className?: string;
  /** h1 for a whole page; h2 when the error sits in a section of a page. */
  headingLevel?: 'h1' | 'h2';
  /**
   * The failure itself. A 403 is not an outage: it is shown as "no access",
   * without a retry that can never succeed.
   */
  error?: unknown;
}

const isForbidden = (error: unknown) =>
  typeof error === 'object' && error !== null && (error as { status?: unknown }).status === 403;

export function PageErrorState({
  title,
  description,
  onRetry,
  isRetrying = false,
  isOffline = false,
  className,
  headingLevel: Heading = 'h1',
  error,
}: PageErrorStateProps) {
  const forbidden = isForbidden(error);
  const Icon: LucideIcon = forbidden ? Lock : isOffline ? WifiOff : AlertTriangle;
  const resolvedTitle = forbidden
    ? 'You do not have access to this'
    : (title ?? (isOffline ? 'You are offline' : 'We could not load this page'));
  const resolvedDescription = forbidden
    ? 'Your account does not include this area. Ask an administrator if you need it.'
    : (description ??
      (isOffline
        ? 'Reconnect to the internet, then try again.'
        : 'There may be a temporary problem. Please try again.'));
  const retry = forbidden ? undefined : onRetry;

  return (
    <div
      role="alert"
      className={cn(
        'flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-12 text-center',
        className
      )}
    >
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive-subtle text-destructive">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <Heading className="text-xl font-semibold text-foreground">{resolvedTitle}</Heading>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{resolvedDescription}</p>
      {retry && (
        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={retry}
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
