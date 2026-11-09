'use client';

import { useEffect } from 'react';
import { PageErrorState } from '@sureground/ui';

export default function EstateMicrositeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Estate microsite page error:', error);
  }, [error]);

  return (
    <PageErrorState
      title="Couldn't load this estate"
      description="Something went wrong while loading this page. Please try again."
      onRetry={reset}
    />
  );
}
