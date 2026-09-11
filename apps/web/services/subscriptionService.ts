import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';

export type PlanTier = 'FREE' | 'PRO';
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
  /**
   * Small amount taken at trial checkout purely to put a card on file, then
   * refunded. Shown to the customer so the trial is never a surprise charge.
   */
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

  /** Canonical Pro price + entitlement matrix (public endpoint). */
  async getPricing(): Promise<ApiResponse<PlanPricing>> {
    return safeCall(() => authFetch<PlanPricing>('/me/subscription/pricing'));
  },
};
