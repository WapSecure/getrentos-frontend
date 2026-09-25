import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import type { PlanTier } from '@getrentos/shared';

/**
 * The ladder is defined once, in `@getrentos/shared`.
 *
 * This used to be a local `'FREE' | 'PRO'`, which is how the client came to
 * believe an ENTERPRISE subscriber — someone on the *most* expensive plan — was
 * not a Pro customer. Re-exported so nothing that already imports the name has
 * to change.
 */
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
