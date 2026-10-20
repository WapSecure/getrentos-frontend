'use client';

import { useEffect } from 'react';
import { PageErrorState } from '@getrentos/ui';

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
    <div className="mx-auto max-w-6xl px-4 py-16">
      <PageErrorState
        title="Couldn't load this listing"
        description="Something went wrong while loading this shortlet. Please try again."
        onRetry={reset}
      />
    </div>
  );
}
