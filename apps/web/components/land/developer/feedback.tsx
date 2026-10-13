'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { Toast, type ToastVariant } from '@getrentos/ui';

export type Notify = (message: string, variant?: ToastVariant) => void;

/** One toast at a time for a screen; render `toast` once and hand `notify` down. */
export const useNotify = (): { notify: Notify; toast: ReactNode } => {
  const [current, setCurrent] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const notify = useCallback<Notify>(
    (message, variant = 'success') => setCurrent({ message, variant }),
    []
  );
  const toast = current ? (
    <Toast message={current.message} variant={current.variant} onClose={() => setCurrent(null)} />
  ) : null;
  return { notify, toast };
};

/** The message of whatever a mutation threw; the API writes these for people. */
export const errorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
) => (error instanceof Error && error.message ? error.message : fallback);
