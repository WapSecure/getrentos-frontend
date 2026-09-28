import { useQuery } from '@tanstack/react-query';
import { tierAtLeast } from '@getrentos/shared';
import { subscriptionService } from '@/services/subscriptionService';
import { unwrap } from '@/lib/apiHelpers';
import { subscriptionKeys } from '@/lib/queryKeys';

/**
 * The caller's own subscription tier — every signed-in user has one (FREE by default).
 *
 * `isPro` means "reaches Pro or above", not "is exactly Pro". It used to be an
 * equality test, which told an ENTERPRISE subscriber they were on the free plan
 * and locked them out of features their own plan includes. Every consumer asks
 * "may I use this?", so the ladder is the only correct answer.
 *
 * Note which plan this is: the *caller's*. An estate feature is entitled from
 * the estate owner's plan, which is a different subscription — use
 * `estate.planTier` for anything gated on the estate rather than on the user.
 */
export function usePlanTier() {
  const { data, isLoading } = useQuery({
    queryKey: subscriptionKeys.mine,
    queryFn: () => unwrap(subscriptionService.getMine()),
    staleTime: 5 * 60_000,
  });

  const tier = data?.tier ?? 'FREE';

  return {
    tier,
    isPro: tierAtLeast(tier, 'PRO'),
    isEnterprise: tierAtLeast(tier, 'ENTERPRISE'),
    isLoading,
  };
}
