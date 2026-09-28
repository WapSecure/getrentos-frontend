'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unwrap } from '@/lib/apiHelpers';
import { viewerIsSignedIn } from '@/lib/viewer';
import { publicMarketService } from '@/services/publicMarketService';
import { buyerKeys, renterKeys, shortletKeys } from '@/lib/queryKeys';

export const marketSavedKey = ['public-market', 'saved-listing-ids'] as const;

/** Account-wide saved state shared with renter, buyer and shortlet dashboards. */
export function useMarketSaved() {
  const queryClient = useQueryClient();
  const [signedIn] = useState(viewerIsSignedIn);
  const query = useQuery({
    queryKey: marketSavedKey,
    queryFn: () => unwrap(publicMarketService.savedListingIds()),
    enabled: signedIn,
    staleTime: 60_000,
  });
  const savedIds = useMemo(() => new Set(query.data ?? []), [query.data]);

  const toggle = useMutation({
    mutationFn: ({ listingId, next }: { listingId: string; next: boolean }) =>
      unwrap(
        next
          ? publicMarketService.saveListing(listingId)
          : publicMarketService.unsaveListing(listingId)
      ),
    onMutate: async ({ listingId, next }) => {
      await queryClient.cancelQueries({ queryKey: marketSavedKey });
      const previous = queryClient.getQueryData<string[]>(marketSavedKey) ?? [];
      queryClient.setQueryData<string[]>(
        marketSavedKey,
        next ? [...new Set([...previous, listingId])] : previous.filter((id) => id !== listingId)
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(marketSavedKey, context?.previous ?? []);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: marketSavedKey });
      queryClient.invalidateQueries({ queryKey: renterKeys.savedListings });
      queryClient.invalidateQueries({ queryKey: buyerKeys.saved });
      queryClient.invalidateQueries({ queryKey: shortletKeys.wishlist });
    },
  });

  return { signedIn, savedIds, toggle };
}
