'use client';

import { useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unwrap } from '@/lib/apiHelpers';
import { viewerHasRole } from '@/lib/viewer';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';
import { SHORTLET_GUEST_ROLE_IDS } from '@/lib/shortlet/guestRoutes';

/**
 * The wishlist is a guest-only surface — the backend guards it with the guest
 * account types (SHORTLET_GUEST_ROLES). Anyone else (an anonymous visitor, or
 * estate staff browsing the public marketplace) calling it just earns a 403, so
 * the query and the heart it drives stay switched off until we know the viewer
 * can be a guest.
 */
export const isGuestShortletViewer = (): boolean => viewerHasRole(...SHORTLET_GUEST_ROLE_IDS);

// The viewer's role is client-only (it comes from stored auth), and it cannot
// change without a page load, so there is nothing to subscribe to.
const subscribeToViewer = () => () => {};

/**
 * Guest shortlet wishlist: tracks which listings are saved and toggles them.
 * Only meaningful when signed in with an account that can book a stay — check
 * `canUseWishlist` before offering the control at all.
 */
export const useShortletWishlist = () => {
  const queryClient = useQueryClient();
  // The role is a client-only read (stored auth). Reading it during render —
  // even via a useState initializer — makes the first client render disagree
  // with the server (which has no auth), so React throws a hydration mismatch
  // and regenerates the subtree. useSyncExternalStore with a server snapshot of
  // `false` keeps the server and the first client render in step, then updates
  // to the real value right after hydration.
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
    /** True only for a signed-in guest, i.e. when the wishlist API will accept us. */
    canUseWishlist,
    isSaved: (listingId: string) => savedIds.has(listingId),
    toggle,
    ids,
  };
};
