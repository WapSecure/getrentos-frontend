import { useCallback, useMemo } from 'react';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthProvider';
import { marketSavedApi } from '@/lib/api/marketSaved';
import type { MarketKind } from '@/lib/api/publicMarket';
import { report, track } from '@/lib/analytics';
import { rememberListing } from '@/lib/pendingListing';
import { qk } from '@/lib/query/keys';

/** One saved-listing state for rent, sale, shortlet and land. */
export function useMarketSaved(kind: MarketKind) {
  const { status } = useAuth();
  const queryClient = useQueryClient();
  const signedIn = status === 'authenticated';
  const query = useQuery({
    queryKey: qk.market.saved,
    queryFn: marketSavedApi.ids,
    enabled: signedIn,
    staleTime: 60_000,
  });
  const savedIds = useMemo(() => new Set(query.data ?? []), [query.data]);

  const mutation = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) =>
      next ? marketSavedApi.save(id) : marketSavedApi.unsave(id),
    onMutate: async ({ id, next }) => {
      await queryClient.cancelQueries({ queryKey: qk.market.saved });
      const previous = queryClient.getQueryData<string[]>(qk.market.saved) ?? [];
      queryClient.setQueryData<string[]>(
        qk.market.saved,
        next ? [...new Set([...previous, id])] : previous.filter((savedId) => savedId !== id)
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(qk.market.saved, context?.previous ?? []);
      report(error, { action: 'toggle_market_save' });
    },
    onSuccess: (_data, { id, next }) => {
      track(next ? 'listing_saved' : 'listing_unsaved', { id });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.market.saved });
      queryClient.invalidateQueries({ queryKey: qk.listings.saved });
      queryClient.invalidateQueries({ queryKey: ['buyer', 'saved'] });
      queryClient.invalidateQueries({ queryKey: qk.shortlets.wishlist });
    },
  });

  const toggle = useCallback(
    (id: string) => {
      if (!signedIn) {
        rememberListing(kind, id);
        router.push('/(auth)/sign-in');
        return;
      }
      mutation.mutate({ id, next: !savedIds.has(id) });
    },
    [kind, mutation, savedIds, signedIn]
  );

  return { savedIds, toggle, isPending: mutation.isPending };
}
