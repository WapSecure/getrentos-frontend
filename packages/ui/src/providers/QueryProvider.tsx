'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@getrentos/shared';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
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

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
