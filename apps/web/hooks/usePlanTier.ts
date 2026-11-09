import { useQuery } from '@tanstack/react-query';
import { tierAtLeast } from '@sureground/shared';
import { subscriptionService } from '@/services/subscriptionService';
import { unwrap } from '@/lib/apiHelpers';
import { subscriptionKeys } from '@/lib/queryKeys';

// The caller's own plan; `isPro` means Pro or above, not exactly Pro. Estate features use `estate.planTier`.
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
