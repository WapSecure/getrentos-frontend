import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { buyerSavedApi } from '@/lib/api/buyerSaved';
import type { BuyerListing, Paginated } from '@/lib/api/buyer';

const SAVED_KEY = qk.buyer.saved(1, 100);

/** The buyer's saved listings as a fast `Set` of ids, plus an optimistic `toggle`. */
export function useBuyerSaved() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: SAVED_KEY,
    queryFn: () => buyerSavedApi.list(1, 100),
    staleTime: 60_000,
  });

  const savedIds = useMemo(() => new Set((query.data?.items ?? []).map((p) => p.id)), [query.data]);

  const mutation = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      if (next) await buyerSavedApi.save(id);
      else await buyerSavedApi.unsave(id);
    },
    onMutate: async ({ id, next }) => {
      await qc.cancelQueries({ queryKey: SAVED_KEY });
      const prev = qc.getQueryData<Paginated<BuyerListing>>(SAVED_KEY);
      if (prev) {
        qc.setQueryData<Paginated<BuyerListing>>(SAVED_KEY, {
          ...prev,
          items: next ? prev.items : prev.items.filter((p) => p.id !== id),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(SAVED_KEY, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: SAVED_KEY });
    },
  });

  const toggle = useCallback(
    (id: string) => {
      mutation.mutate({ id, next: !savedIds.has(id) });
    },
    [mutation, savedIds]
  );

  return { savedIds, toggle, isLoading: query.isLoading, items: query.data?.items ?? [] };
}
