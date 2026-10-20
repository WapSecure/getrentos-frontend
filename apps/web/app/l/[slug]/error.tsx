'use client';

import { useEffect } from 'react';
import { PageErrorState } from '@getrentos/ui';

/** Segment error boundary for microsite (l/[slug]) pages. */
export default function MicrositeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Microsite page error:', error);
  }, [error]);

  return (
    <PageErrorState
      title="Couldn't load this microsite"
      description="Something went wrong while loading this page. Please try again."
      onRetry={reset}
    />
  );
}
