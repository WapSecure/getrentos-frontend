import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useToast } from '@sureground/ui-native';
import { ApiError } from '../api/client';

export interface OptimisticPatch<TVars> {
  queryKey: QueryKey;
  update: (old: unknown, vars: TVars) => unknown;
  /** Patches every query whose key starts with queryKey; only when they share one data shape. */
  match?: 'exact' | 'prefix';
}

interface Options<TData, TVars> {
  mutationFn: (vars: TVars) => Promise<TData>;
  patches: (vars: TVars) => OptimisticPatch<TVars>[];
  invalidate?: QueryKey[];
  errorMessage?: string;
  successMessage?: string;
  onSuccess?: (data: TData, vars: TVars) => void;
}

// Only for small, reversible changes: payments and submissions must wait for the server.
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
