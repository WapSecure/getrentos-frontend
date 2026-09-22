import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './client';

export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export const subscriptionApi = {
  mine: () => apiFetch<{ tier: PlanTier }>('/me/subscription'),
};

/**
 * Whether a tier grants Pro capabilities.
 *
 * ENTERPRISE is PRO plus scale, not a different thing — the price is the whole
 * difference — so it grants everything PRO grants. Written as "not FREE" rather
 * than a list so a tier added above ENTERPRISE is Pro-capable automatically.
 *
 * This matters: `tier === 'PRO'` would have made every ENTERPRISE landlord
 * non-Pro here, silently hiding Pro-gated affordances from the customers who pay
 * the most. The backend keeps the same rule as a ladder in `PLAN_TIER_RANK` for
 * exactly this reason.
 */
function grantsPro(tier: PlanTier): boolean {
  return tier !== 'FREE';
}

/**
 * The caller's plan, mirroring web's usePlanTier. Defaults to FREE until
 * known, so a PRO-only action is hidden rather than offered and then refused.
 */
export function usePlanTier() {
  const query = useQuery({
    queryKey: ['me', 'subscription'],
    queryFn: subscriptionApi.mine,
    staleTime: 5 * 60_000,
  });
  const tier = query.data?.tier ?? 'FREE';
  return { tier, isPro: grantsPro(tier), isLoading: query.isLoading };
}
