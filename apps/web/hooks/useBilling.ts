'use client';

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
