'use client';

import { startTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageErrorState } from '@getrentos/ui';
import { Navigation } from '@/components/layout/Navigation';

/**
 * Error boundary body for the public listing pages. A missing listing goes to
 * `notFound()`; this is the other case, where the listing could not be loaded
 * at all (the API is down or failing), so it must not claim the listing is gone.
 */
export function PublicListingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Public listing page error:', error);
  }, [error]);

  // The failure happened in a server component, so re-fetch it before re-rendering.
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <div className="mx-auto max-w-6xl px-4 py-16">
        <PageErrorState
          title="This listing is temporarily unavailable"
          description="We could not load it just now. This is usually brief: please try again in a moment."
          onRetry={retry}
        />
      </div>
    </main>
  );
}
