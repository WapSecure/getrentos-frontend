'use client';

import { useCallback } from 'react';
import { useToast, type ToastVariant } from '@sureground/ui';

export type Notify = (message: string, variant?: ToastVariant) => void;

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

export const errorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
) => (error instanceof Error && error.message ? error.message : fallback);
