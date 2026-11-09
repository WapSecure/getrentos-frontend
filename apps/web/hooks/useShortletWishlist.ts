'use client';

import { useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unwrap } from '@/lib/apiHelpers';
import { viewerHasRole } from '@/lib/viewer';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { SHORTLET_GUEST_ROLE_IDS } from '@/lib/shortlet/guestRoutes';

// The wishlist API is guest-only (SHORTLET_GUEST_ROLES); anyone else earns a 403, so the query stays off.
export const isGuestShortletViewer = (): boolean => viewerHasRole(...SHORTLET_GUEST_ROLE_IDS);

// The role comes from stored auth and only changes on a page load, so there is nothing to subscribe to.
const subscribeToViewer = () => () => {};

export const useShortletWishlist = () => {
  const queryClient = useQueryClient();
  // Reading stored auth during render causes a hydration mismatch; the `false` server snapshot keeps the first client render in step.
  const canUseWishlist = useSyncExternalStore(
    subscribeToViewer,
    isGuestShortletViewer,
    () => false
  );

  const { data: ids = [] } = useQuery({
    queryKey: shortletKeys.wishlistIds,
    queryFn: () => unwrap(shortletService.wishlistIds()),
    staleTime: 30_000,
    enabled: canUseWishlist,
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
    canUseWishlist,
    isSaved: (listingId: string) => savedIds.has(listingId),
    toggle,
    ids,
  };
};
