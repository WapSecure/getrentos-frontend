'use client';

import { useEffect, useState } from 'react';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@getrentos/shared';
import { Toast } from '../Toast';

const mutationErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) return error.message;
  return 'We could not complete that action. Please try again.';
};

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [mutationError, setMutationError] = useState<{ id: number; message: string } | null>(null);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            if (mutation.options.meta?.suppressGlobalError) return;
            if (mutation.options.onError && !mutation.options.meta?.showGlobalError) return;
            setMutationError({ id: Date.now(), message: mutationErrorMessage(error) });
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => {
              if (error instanceof ApiError) return error.isRetryable && failureCount < 2;
              return failureCount < 1;
            },
            retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 10_000),
            // Operational failures should reach the nearest route boundary
            // instead of being mistaken for a legitimate empty collection.
            throwOnError: (error) => error instanceof ApiError && error.isRetryable,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    if (!mutationError) return;
    const timeout = window.setTimeout(() => setMutationError(null), 6_000);
    return () => window.clearTimeout(timeout);
  }, [mutationError]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {mutationError && (
        <Toast
          key={mutationError.id}
          message={mutationError.message}
          variant="error"
          onClose={() => setMutationError(null)}
        />
      )}
    </QueryClientProvider>
  );
}
