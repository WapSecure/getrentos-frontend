'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingService } from '@/services/billingService';
import { unwrap } from '@/lib/apiHelpers';
import { billingKeys, subscriptionKeys } from '@/lib/queryKeys';

/** The caller's billing lifecycle state (status, trial/period end, cancellation). */
export function useBilling() {
  const { data, isLoading } = useQuery({
    queryKey: billingKeys.mine,
    queryFn: () => unwrap(billingService.getMine()),
    staleTime: 60_000,
  });

  return { billing: data, isLoading };
}

/**
 * Cancel / resume. Both refresh the billing state *and* the tier query, since
 * plan gates elsewhere in the app read the tier.
 */
export function useManageSubscription() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: billingKeys.mine }),
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.mine }),
    ]);
  };

  const cancel = useMutation({
    mutationFn: () => unwrap(billingService.cancel()),
    onSuccess: invalidate,
  });

  const reactivate = useMutation({
    mutationFn: () => unwrap(billingService.reactivate()),
    onSuccess: invalidate,
  });

  return { cancel, reactivate, pending: cancel.isPending || reactivate.isPending };
}

/**
 * Opens the provider's hosted card-update page.
 *
 * Redirecting out is deliberate: Paystack tokenizes the replacement card and
 * refunds the verification charge it takes, which we are better off not
 * reimplementing — and it keeps card details away from us entirely.
 */
export function useCardUpdateLink() {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCardUpdate = useCallback(async () => {
    setOpening(true);
    setError(null);
    try {
      const { url } = await unwrap(billingService.getCardUpdateLink());
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the card update page.');
      setOpening(false);
    }
  }, []);

  return { openCardUpdate, opening, error };
}
