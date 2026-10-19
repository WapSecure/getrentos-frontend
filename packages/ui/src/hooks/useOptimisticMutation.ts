'use client';

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useToast } from '../ToastProvider';

export interface OptimisticPatch<TVars> {
  /** The cached query to change before the server answers. */
  queryKey: QueryKey;
  /** The new cache value given the old one; return the old value to leave it alone. */
  update: (old: unknown, vars: TVars) => unknown;
}

export interface OptimisticMutationOptions<TData, TVars> {
  mutationFn: (vars: TVars) => Promise<TData>;
  /** One or more caches to update at once (a list and its detail, say). */
  patches: (vars: TVars) => OptimisticPatch<TVars>[];
  /** Also refetched when the request settles, to pick up server-side changes. */
  invalidate?: QueryKey[];
  /** Shown if the server refuses and the change is rolled back. */
  errorMessage?: string;
  successMessage?: string;
  onSuccess?: (data: TData, vars: TVars) => void;
}

/**
 * A mutation whose result shows immediately.
 *
 * The cache is changed first, so a toggle, a save or a mark-as-read appears at
 * once. If the request fails, every patched cache goes back to exactly what it
 * was and a toast explains. Either way the touched queries are refetched, so
 * the screen ends on the server's version.
 *
 * For small, reversible changes only. Payments, submissions, approvals and
 * anything that must be confirmed by the server should wait for the response.
 */
export function useOptimisticMutation<TData, TVars>({
  mutationFn,
  patches,
  invalidate = [],
  errorMessage = 'That change did not save. Please try again.',
  successMessage,
  onSuccess,
}: OptimisticMutationOptions<TData, TVars>) {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn,
    // The rollback toast below replaces the app-wide mutation error toast.
    meta: { suppressGlobalError: true },
    onMutate: async (vars: TVars) => {
      const list = patches(vars);
      await Promise.all(list.map((p) => qc.cancelQueries({ queryKey: p.queryKey })));
      const snapshots = list.map((p) => [p.queryKey, qc.getQueryData(p.queryKey)] as const);
      for (const p of list) {
        qc.setQueryData(p.queryKey, (old: unknown) =>
          old === undefined ? old : p.update(old, vars)
        );
      }
      return { snapshots };
    },
    onError: (error, _vars, context) => {
      for (const [key, value] of context?.snapshots ?? []) qc.setQueryData(key, value);
      const detail = error instanceof Error && error.message.trim() ? error.message : null;
      // The API writes its refusals for people; fall back to the generic line.
      toast.error(detail ?? errorMessage);
    },
    onSuccess: (data, vars) => {
      if (successMessage) toast.success(successMessage);
      onSuccess?.(data, vars);
    },
    onSettled: (_data, _error, vars) => {
      const keys = [...patches(vars).map((p) => p.queryKey), ...invalidate];
      for (const queryKey of keys) void qc.invalidateQueries({ queryKey });
    },
  });
}
