'use client';

import { useCallback } from 'react';
import { useToast, type ToastVariant } from '@getrentos/ui';

export type Notify = (message: string, variant?: ToastVariant) => void;

/** A screen's `notify`, shown through the app-wide toasts; hand it down to panels. */
export const useNotify = (): { notify: Notify } => {
  const toast = useToast();
  const notify = useCallback<Notify>(
    (message, variant = 'success') => {
      toast.show(message, variant);
    },
    [toast]
  );
  return { notify };
};

/** The message of whatever a mutation threw; the API writes these for people. */
export const errorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
) => (error instanceof Error && error.message ? error.message : fallback);
