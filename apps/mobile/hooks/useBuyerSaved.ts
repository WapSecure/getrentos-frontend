import { useCallback, useMemo } from 'react';
import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { buyerSavedApi } from '@/lib/api/buyerSaved';
import type { BuyerListing, Paginated } from '@/lib/api/buyer';

const SAVED_KEY = qk.buyer.saved(1, 100);
const TOGGLE_KEY = ['buyer', 'saved', 'toggle'] as const;

type Toggle = { id: string; next: boolean };

/** The buyer's saved listings as a fast `Set` of ids, plus an optimistic `toggle`. */
export function useBuyerSaved() {
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({
    queryKey: SAVED_KEY,
    queryFn: () => buyerSavedApi.list(1, 100),
    staleTime: 60_000,
  });

  // Saves still in flight. A save only knows the listing's id, so it cannot be
  // written into the cached list; it is overlaid on the set instead, which
  // makes the heart fill the moment it is tapped.
  const pending = useMutationState({
    filters: { mutationKey: TOGGLE_KEY, status: 'pending' },
    select: (m) => m.state.variables as Toggle,
  });

  const savedIds = useMemo(() => {
    const ids = new Set((query.data?.items ?? []).map((p) => p.id));
    for (const { id, next } of pending) {
      if (next) ids.add(id);
      else ids.delete(id);
    }
    return ids;
  }, [query.data, pending]);

  const mutation = useMutation({
    mutationKey: TOGGLE_KEY,
    mutationFn: async ({ id, next }: Toggle) => {
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
    onError: (_err, vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(SAVED_KEY, ctx.prev);
      toast.show(
        vars.next ? 'Could not save that listing.' : 'Could not remove that listing.',
        'error'
      );
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

  return {
    savedIds,
    toggle,
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    items: query.data?.items ?? [],
  };
}
