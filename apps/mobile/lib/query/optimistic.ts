import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useToast } from '@getrentos/ui-native';
import { ApiError } from '../api/client';

export interface OptimisticPatch<TVars> {
  /** The cached query to change before the server answers. */
  queryKey: QueryKey;
  /** The new cache value given the old one; return the old value to leave it alone. */
  update: (old: unknown, vars: TVars) => unknown;
  /**
   * `prefix` patches every cached query whose key starts with queryKey (all
   * pages or filters of a list). Only use it when they share one data shape.
   */
  match?: 'exact' | 'prefix';
}

interface Options<TData, TVars> {
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
 * once. If the request fails, every patched cache goes back to exactly what
 * it was and a toast says the change did not stick. Either way the touched
 * queries are refetched, so the screen ends on the server's version.
 *
 * Use it for small, reversible changes. Payments, submissions and anything
 * that must be confirmed by the server should wait for the response instead.
 */
export function useOptimisticMutation<TData = unknown, TVars = void>({
  mutationFn,
  patches,
  invalidate = [],
  errorMessage = 'That change did not save. Please try again.',
  successMessage,
  onSuccess,
}: Options<TData, TVars>) {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn,
    onMutate: async (vars: TVars) => {
      const list = patches(vars);
      await Promise.all(list.map((p) => qc.cancelQueries({ queryKey: p.queryKey })));
      const snapshots: (readonly [QueryKey, unknown])[] = list.flatMap((p) =>
        p.match === 'prefix'
          ? qc.getQueriesData({ queryKey: p.queryKey })
          : [[p.queryKey, qc.getQueryData(p.queryKey)] as const]
      );
      for (const p of list) {
        const apply = (old: unknown) => (old === undefined ? old : p.update(old, vars));
        if (p.match === 'prefix') qc.setQueriesData({ queryKey: p.queryKey }, apply);
        else qc.setQueryData(p.queryKey, apply);
      }
      return { snapshots };
    },
    onError: (error, _vars, context) => {
      for (const [key, value] of context?.snapshots ?? []) qc.setQueryData(key, value);
      toast.show(
        error instanceof ApiError && error.status < 500 && error.message
          ? error.message
          : errorMessage,
        'error'
      );
    },
    onSuccess: (data, vars) => {
      if (successMessage) toast.show(successMessage, 'success');
      onSuccess?.(data, vars);
    },
    onSettled: (_data, _error, vars) => {
      const keys = [...patches(vars).map((p) => p.queryKey), ...invalidate];
      for (const queryKey of keys) void qc.invalidateQueries({ queryKey });
    },
  });
}
