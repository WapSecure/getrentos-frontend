'use client';

import { useEffect, useRef, useState } from 'react';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError, onSessionExpired } from '@getrentos/shared';
import { ToastProvider, useToast, type ToastApi } from '../ToastProvider';

const GENERIC_MUTATION_ERROR = 'We could not complete that action. Please try again.';

/**
 * unwrap() throws richer Error subclasses (VerificationRequiredError,
 * PlanGateError) that already carry the backend's message — the specific
 * reason the action was refused. Reading `message` off any Error keeps that
 * text in front of the user instead of replacing it with a shrug.
 */
const mutationErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return GENERIC_MUTATION_ERROR;
};

interface QueryProviderProps {
  children: React.ReactNode;
  /** Where to send the user when the session can no longer be restored. */
  loginPath?: string;
}

export function QueryProvider(props: QueryProviderProps) {
  return (
    <ToastProvider>
      <QueryClientHost {...props} />
    </ToastProvider>
  );
}

function QueryClientHost({ children, loginPath = '/login' }: QueryProviderProps) {
  const toast = useToast();
  // The client is created once; it reads the toast API through a ref.
  const toastRef = useRef<ToastApi>(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // A session that cannot be refreshed used to leave the app rendering zeros
  // with console errors and no explanation. Send them to sign in instead, with
  // the page they were on so they land back there afterwards.
  useEffect(() => {
    return onSessionExpired(() => {
      const from = `${window.location.pathname}${window.location.search}`;
      if (window.location.pathname.startsWith(loginPath)) return;
      // A full navigation, so every in-memory cache and stale prop is dropped
      // rather than re-rendered as an empty state.
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
            // Operational failures should reach the nearest route boundary
            // instead of being mistaken for a legitimate empty collection —
            // but only when there is nothing to show. A failed background
            // refresh keeps the data already on screen.
            throwOnError: (error, query) =>
              error instanceof ApiError && error.isRetryable && query.state.data === undefined,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
