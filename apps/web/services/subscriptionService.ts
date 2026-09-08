import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';

export type PlanTier = 'FREE' | 'PRO';

export interface MySubscription {
  tier: PlanTier;
}

export const subscriptionService = {
  async getMine(): Promise<ApiResponse<MySubscription>> {
    return safeCall(() => authFetch('/me/subscription'));
  },
};
