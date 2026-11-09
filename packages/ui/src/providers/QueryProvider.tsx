'use client';

import { useEffect, useRef, useState } from 'react';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { ApiError, onSessionExpired } from '@sureground/shared';
import { ToastProvider, useToast, type ToastApi } from '../ToastProvider';

const GENERIC_MUTATION_ERROR = 'We could not complete that action. Please try again.';

// unwrap()'s Error subclasses carry the backend's refusal reason; show it rather than a generic message.
const mutationErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return GENERIC_MUTATION_ERROR;
};

interface QueryProviderProps {
  children: React.ReactNode;
  loginPath?: string;
}

export function QueryProvider(props: QueryProviderProps) {
  // Framer animates in JS, so the CSS reduced-motion rule doesn't reach it.
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <QueryClientHost {...props} />
      </ToastProvider>
    </MotionConfig>
  );
}

function QueryClientHost({ children, loginPath = '/login' }: QueryProviderProps) {
  const toast = useToast();
  // The client is created once, so it reads the toast API through a ref.
  const toastRef = useRef<ToastApi>(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    return onSessionExpired(() => {
      const from = `${window.location.pathname}${window.location.search}`;
      if (window.location.pathname.startsWith(loginPath)) return;
      // A full navigation drops every in-memory cache rather than re-rendering it as an empty state.
      window.location.assign(
        `${loginPath}?reason=session_expired&next=${encodeURIComponent(from)}`
      );
    });
  }, [loginPath]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            if (mutation.options.meta?.suppressGlobalError) return;
            if (mutation.options.onError && !mutation.options.meta?.showGlobalError) return;
            toastRef.current.error(mutationErrorMessage(error));
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
            // Throw only when nothing is on screen, so a failure isn't shown as an empty list
            // while a failed background refresh keeps its data.
            throwOnError: (error, query) =>
              error instanceof ApiError && error.isRetryable && query.state.data === undefined,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
