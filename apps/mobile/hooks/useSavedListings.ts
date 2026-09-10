import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { savedListingsApi, type Paginated, type SavedProperty } from '@/lib/api/properties';
import { track, report } from '@/lib/analytics';

/**
 * The renter's saved listings as a fast `Set` of listing ids, plus an
 * optimistic `toggle`. One source of truth for the heart on every card and the
 * Saved tab.
 */
export function useSavedListings() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: qk.listings.saved,
    queryFn: () => savedListingsApi.list(1, 100),
    staleTime: 60_000,
  });

  const savedIds = useMemo(() => new Set((query.data?.items ?? []).map((p) => p.id)), [query.data]);

  const mutation = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      if (next) await savedListingsApi.save(id);
      else await savedListingsApi.unsave(id);
    },
    onMutate: async ({ id, next }) => {
      await qc.cancelQueries({ queryKey: qk.listings.saved });
      const prev = qc.getQueryData<Paginated<SavedProperty>>(qk.listings.saved);
      if (prev) {
        qc.setQueryData<Paginated<SavedProperty>>(qk.listings.saved, {
          ...prev,
          items: next
            ? prev.items.some((p) => p.id === id)
              ? prev.items
              : [
                  {
                    id,
                    savedListingId: `optimistic-${id}`,
                    wishlistId: null,
                    note: null,
                    savedAt: new Date().toISOString(),
                  } as SavedProperty,
                  ...prev.items,
                ]
            : prev.items.filter((p) => p.id !== id),
        });
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.listings.saved, ctx.prev);
      report(err, { action: 'toggle_save' });
    },
    onSuccess: (_data, { id, next }) => {
      track(next ? 'listing_saved' : 'listing_unsaved', { id });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.listings.saved });
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
    refetch: query.refetch,
    items: query.data?.items ?? [],
  };
}
