'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@getrentos/ui';

/** Segment error boundary for individual shortlet listing pages. */
export default function ShortletError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Shortlet page error:', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-6xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Couldn&apos;t load this listing</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Something went wrong while loading this shortlet. Please try again.
      </p>
      <div className="mt-6">
        <Button onClick={reset}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Try again
        </Button>
      </div>
    </div>
  );
}
