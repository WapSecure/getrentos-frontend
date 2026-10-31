'use client';

import { startTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageErrorState } from '@getrentos/ui';

/**
 * Segment error boundary for individual shortlet listing pages: the listing
 * could not be loaded (a missing one goes to `notFound()` instead).
 */
export default function ShortletError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Shortlet page error:', error);
  }, [error]);

  // The failure happened in a server component, so re-fetch it before re-rendering.
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <PageErrorState
        title="This listing is temporarily unavailable"
        description="We could not load it just now. This is usually brief: please try again in a moment."
        onRetry={retry}
      />
    </div>
  );
}
