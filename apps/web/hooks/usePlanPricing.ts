import { useQuery } from '@tanstack/react-query';
import {
  subscriptionService,
  type PlanPricing,
  type PlanPersona,
} from '@/services/subscriptionService';
import { unwrap } from '@/lib/apiHelpers';
import { subscriptionKeys } from '@/lib/queryKeys';

/**
 * Canonical Pro pricing + entitlements, read from the backend so the price
 * shown to a customer is always the price we charge (single source of truth).
 */
export function usePlanPricing() {
  const { data, isLoading, isError } = useQuery({
    queryKey: subscriptionKeys.pricing,
    queryFn: () => unwrap(subscriptionService.getPricing()),
    staleTime: 30 * 60_000,
  });

  return {
    pricing: data as PlanPricing | undefined,
    entitlementsFor: (persona: PlanPersona) =>
      (data as PlanPricing | undefined)?.entitlements?.[persona] ?? [],
    isLoading,
    isError,
  };
}
