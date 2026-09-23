'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unwrap } from '@/lib/apiHelpers';
import { viewerHasRole } from '@/lib/viewer';
import { shortletService } from '@/services/shortletService';
import { shortletKeys } from '@/lib/queryKeys';

/**
 * The wishlist is a guest-only surface — the backend guards it with
 * `@Roles(RENTER, PROPERTY_BUYER)`. Anyone else (an anonymous visitor, or a
 * landlord browsing the public marketplace) calling it just earns a 403, so the
 * query and the heart it drives stay switched off until we know the viewer is a
 * guest.
 */
export const isGuestShortletViewer = (): boolean => viewerHasRole('renter', 'buyer');

/**
 * Guest shortlet wishlist: tracks which listings are saved and toggles them.
 * Only meaningful when signed in as a guest (renter / property buyer) — check
 * `canUseWishlist` before offering the control at all.
 */
export const useShortletWishlist = () => {
  const queryClient = useQueryClient();
  // Resolved once per mount: the role cannot change without a page load, and
  // reading storage during render would break SSR/hydration parity.
  const [canUseWishlist] = useState(isGuestShortletViewer);

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
