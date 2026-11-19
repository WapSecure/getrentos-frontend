'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  billingService,
  TRIAL_ALREADY_USED,
  TRIAL_ALREADY_USED_COPY,
} from '@/services/billingService';
import { ApiError, unwrap } from '@/lib/apiHelpers';
import type { BillingCycle } from '@/services/subscriptionService';
import { billingKeys, subscriptionKeys } from '@/lib/queryKeys';

// The price is never sent from here: the backend reads its own catalog.
export function useProCheckout() {
  const queryClient = useQueryClient();
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set when the backend refused a trial, so the page can offer the same cycle without one.
  const [trialRefusedCycle, setTrialRefusedCycle] = useState<BillingCycle | null>(null);

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: billingKeys.mine }),
      // The tier query drives every plan gate in the UI, so refresh it too.
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.mine }),
    ]);
  }, [queryClient]);

  const startCheckout = useCallback(
    async (cycle: BillingCycle, options: { withoutTrial?: boolean } = {}) => {
      setUpgrading(true);
      setError(null);
      setTrialRefusedCycle(null);
      try {
        const session = await unwrap(billingService.startCheckout(cycle, options));

        if (session.authorizationUrl) {
          window.location.href = session.authorizationUrl;
          return;
        }

        if (process.env.NODE_ENV === 'production' || !session.simulated) {
          throw new Error('Checkout is unavailable. No payment gateway session was created.');
        }

        // No gateway configured (dev): confirm the simulated payment.
        await unwrap(billingService.verifyCheckout(session.reference));
        await refresh();
      } catch (err) {
        if (err instanceof ApiError && err.code === TRIAL_ALREADY_USED) {
          setTrialRefusedCycle(cycle);
          setError(TRIAL_ALREADY_USED_COPY);
          await refresh();
          return;
        }
        setError(err instanceof Error ? err.message : 'Could not start checkout.');
      } finally {
        setUpgrading(false);
      }
    },
    [refresh]
  );

  const subscribeWithoutTrial = useCallback(() => {
    if (trialRefusedCycle) void startCheckout(trialRefusedCycle, { withoutTrial: true });
  }, [startCheckout, trialRefusedCycle]);

  return { startCheckout, subscribeWithoutTrial, trialRefusedCycle, upgrading, error, refresh };
}
