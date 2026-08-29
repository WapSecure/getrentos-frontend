'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unwrap } from '@/lib/apiHelpers';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';

/**
 * Guest shortlet wishlist: tracks which listings are saved and toggles them.
 * Only meaningful when signed in as a guest (renter / property buyer).
 */
export const useShortletWishlist = () => {
  const queryClient = useQueryClient();

  const { data: ids = [] } = useQuery({
    queryKey: shortletKeys.wishlistIds,
    queryFn: () => unwrap(shortletService.wishlistIds()),
    staleTime: 30_000,
  });
  const savedIds = new Set(ids);

  const toggle = useMutation({
    mutationFn: async (listingId: string) => {
      const currentlySaved = savedIds.has(listingId);
      const res = currentlySaved
        ? await unwrap(shortletService.unsaveWishlist(listingId))
        : await unwrap(shortletService.saveWishlist(listingId));
      return res.saved;
    },
    onMutate: async (listingId) => {
      await queryClient.cancelQueries({ queryKey: shortletKeys.wishlistIds });
      const prev = queryClient.getQueryData<string[]>(shortletKeys.wishlistIds) ?? [];
      const next = prev.includes(listingId)
        ? prev.filter((id) => id !== listingId)
        : [...prev, listingId];
      queryClient.setQueryData(shortletKeys.wishlistIds, next);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(shortletKeys.wishlistIds, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: shortletKeys.wishlistIds });
      queryClient.invalidateQueries({ queryKey: shortletKeys.wishlist });
    },
  });

  return {
    isSaved: (listingId: string) => savedIds.has(listingId),
    toggle,
    ids,
  };
};
