'use client';

import { useEffect } from 'react';
import { PageErrorState } from '@sureground/ui';

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
