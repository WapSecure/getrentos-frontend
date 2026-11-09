import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import type { PlanTier } from '@sureground/shared';

/** The ladder is defined once, in `@sureground/shared`; re-exported for existing imports. */
export type { PlanTier };
export type BillingCycle = 'MONTHLY' | 'ANNUAL';
export type PlanPersona = 'landlord' | 'estate' | 'owner' | 'realtor';

export interface MySubscription {
  tier: PlanTier;
}

export interface PlanEntitlementRow {
  label: string;
  free: boolean | string;
  pro: boolean | string;
}

export interface PlanPricing {
  currency: string;
  vatInclusive: boolean;
  trialDays: number;
  /** Taken at trial checkout to put a card on file, then refunded. */
  trialTokenizeKobo?: number;
  monthlyKobo: number;
  annualKobo: number;
  annualSavingPercent: number;
  entitlements: Record<PlanPersona, PlanEntitlementRow[]>;
}

export const subscriptionService = {
  async getMine(): Promise<ApiResponse<MySubscription>> {
    return safeCall(() => authFetch('/me/subscription'));
  },

  /** Public endpoint. */
  async getPricing(): Promise<ApiResponse<PlanPricing>> {
    return safeCall(() => authFetch<PlanPricing>('/me/subscription/pricing'));
  },
};
