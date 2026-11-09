'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingService } from '@/services/billingService';
import { unwrap } from '@/lib/apiHelpers';
import { billingKeys, subscriptionKeys } from '@/lib/queryKeys';

export function useBilling() {
  const { data, isLoading } = useQuery({
    queryKey: billingKeys.mine,
    queryFn: () => unwrap(billingService.getMine()),
    staleTime: 60_000,
  });

  return { billing: data, isLoading };
}

// Not gated on Pro: a customer who cancelled still needs their receipts.
export function useInvoices(page = 1) {
  const { data, isLoading } = useQuery({
    queryKey: billingKeys.invoices(page),
    queryFn: () => unwrap(billingService.listInvoices(page)),
    staleTime: 60_000,
  });

  return { invoices: data, isLoading };
}

// Refreshes the tier query too: plan gates elsewhere read it.
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

// Paystack's hosted page tokenizes the card and refunds its check charge, and keeps card details away from us.
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
