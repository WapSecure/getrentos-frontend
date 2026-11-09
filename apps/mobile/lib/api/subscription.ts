import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './client';

export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export const subscriptionApi = {
  mine: () => apiFetch<{ tier: PlanTier }>('/me/subscription'),
};

/** "Not FREE" rather than `tier === 'PRO'`: ENTERPRISE grants everything PRO does (the backend's `PLAN_TIER_RANK` keeps the same rule). */
function grantsPro(tier: PlanTier): boolean {
  return tier !== 'FREE';
}

/** Defaults to FREE until known, so a PRO-only action is hidden rather than offered and then refused. */
export function usePlanTier() {
  const query = useQuery({
    queryKey: ['me', 'subscription'],
    queryFn: subscriptionApi.mine,
    staleTime: 5 * 60_000,
  });
  const tier = query.data?.tier ?? 'FREE';
  return { tier, isPro: grantsPro(tier), isLoading: query.isLoading };
}
