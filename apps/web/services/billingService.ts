import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import type { BillingCycle, PlanTier } from './subscriptionService';

export type BillingStatus = 'NONE' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';

/** What the client needs to hand the customer to the payment gateway. */
export interface CheckoutSession {
  reference: string;
  /** Null when no gateway is configured (dev) — confirm with `verifyCheckout`. */
  authorizationUrl: string | null;
  amountKobo: number;
  cycle: BillingCycle;
  trialDays: number;
  simulated: boolean;
}

/** Full billing state for the signed-in customer. */
export interface MyBilling {
  tier: PlanTier;
  status: BillingStatus;
  planCode: string | null;
  cycle: BillingCycle | null;
  /** What the customer agreed to pay, snapshotted at checkout. */
  priceKobo: number | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  /** Whether Pro features are unlocked right now. */
  isActive: boolean;
  latestReference: string | null;
  /** True when the backend is running without a payment gateway (dev). */
  simulated: boolean;
}

export const billingService = {
  /** Opens a Pro checkout and returns the gateway URL (or a simulated session). */
  async startCheckout(cycle: BillingCycle): Promise<ApiResponse<CheckoutSession>> {
    return safeCall(() =>
      authFetch<CheckoutSession>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ cycle }),
      })
    );
  },

  /** Confirms a checkout after payment and starts the Pro trial. */
  async verifyCheckout(reference: string): Promise<ApiResponse<MyBilling>> {
    return safeCall(() =>
      authFetch<MyBilling>(`/billing/verify?reference=${encodeURIComponent(reference)}`)
    );
  },

  async getMine(): Promise<ApiResponse<MyBilling>> {
    return safeCall(() => authFetch<MyBilling>('/billing'));
  },

  /**
   * Stops the plan renewing. Access continues to the end of the period already
   * paid for — cancelling never cuts a customer off early.
   */
  async cancel(): Promise<ApiResponse<MyBilling>> {
    return safeCall(() => authFetch<MyBilling>('/billing/cancel', { method: 'POST' }));
  },

  /** Undoes a scheduled cancellation. */
  async reactivate(): Promise<ApiResponse<MyBilling>> {
    return safeCall(() => authFetch<MyBilling>('/billing/reactivate', { method: 'POST' }));
  },
};
