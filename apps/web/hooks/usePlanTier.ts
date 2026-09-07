import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscriptionService';
import { unwrap } from '@/lib/apiHelpers';
import { subscriptionKeys } from '@/lib/queryKeys';

/** The caller's own subscription tier — every signed-in user has one (FREE by default). */
export function usePlanTier() {
  const { data, isLoading } = useQuery({
    queryKey: subscriptionKeys.mine,
    queryFn: () => unwrap(subscriptionService.getMine()),
    staleTime: 5 * 60_000,
  });

  return {
    tier: data?.tier ?? 'FREE',
    isPro: data?.tier === 'PRO',
    isLoading,
  };
}
