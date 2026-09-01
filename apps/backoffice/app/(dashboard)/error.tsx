'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@getrentos/ui';

/** Catches errors thrown anywhere inside the admin backoffice dashboards. */
export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string; requestId?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        We couldn&apos;t load this section. Please try again, and reach out if the problem persists.
      </p>
      <div className="mt-6">
        <Button onClick={reset}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Try again
        </Button>
      </div>
    </div>
  );
}
