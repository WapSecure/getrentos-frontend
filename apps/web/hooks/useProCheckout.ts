'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { billingService } from '@/services/billingService';
import { unwrap } from '@/lib/apiHelpers';
import type { BillingCycle } from '@/services/subscriptionService';
import { billingKeys, subscriptionKeys } from '@/lib/queryKeys';

/**
 * Starts a Pro checkout and, when the gateway hands the customer back, applies
 * the result.
 *
 * The price is never sent from here — the backend reads it from its own
 * catalog, so the client cannot influence what is charged.
 */
export function useProCheckout() {
  const queryClient = useQueryClient();
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: billingKeys.mine }),
      // The tier query drives every plan gate in the UI, so refresh it too.
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.mine }),
    ]);
  }, [queryClient]);

  const startCheckout = useCallback(
    async (cycle: BillingCycle) => {
      setUpgrading(true);
      setError(null);
      try {
        const session = await unwrap(billingService.startCheckout(cycle));

        if (session.authorizationUrl) {
          // Hand off to the gateway; it returns the customer to /billing/return.
          window.location.href = session.authorizationUrl;
          return;
        }

        // No gateway configured (dev): confirm the simulated payment and refresh.
        await unwrap(billingService.verifyCheckout(session.reference));
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not start checkout.');
      } finally {
        setUpgrading(false);
      }
    },
    [refresh]
  );

  return { startCheckout, upgrading, error, refresh };
}
