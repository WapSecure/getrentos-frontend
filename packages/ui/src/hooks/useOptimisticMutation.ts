'use client';

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useToast } from '../ToastProvider';

export interface OptimisticPatch<TVars> {
  queryKey: QueryKey;
  update: (old: unknown, vars: TVars) => unknown;
}

export interface OptimisticMutationOptions<TData, TVars> {
  mutationFn: (vars: TVars) => Promise<TData>;
  patches: (vars: TVars) => OptimisticPatch<TVars>[];
  invalidate?: QueryKey[];
  errorMessage?: string;
  successMessage?: string;
  onSuccess?: (data: TData, vars: TVars) => void;
}

// Small, reversible changes only: payments, submissions and approvals must wait for the server.
export function useOptimisticMutation<TData = unknown, TVars = void>({
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
