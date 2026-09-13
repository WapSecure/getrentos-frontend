import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ApiResponse, Paginated } from '@/lib/apiHelpers';
import type { BillingCycle, PlanTier } from './subscriptionService';

export type BillingStatus = 'NONE' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';

/** What the client needs to hand the customer to the payment gateway. */
export interface CheckoutSession {
  reference: string;
  /** Null when no gateway is configured (dev) — confirm with `verifyCheckout`. */
  authorizationUrl: string | null;
  /**
   * TRIAL starts the free trial; PAID charges now and starts Pro immediately,
   * which is what a customer sees once their free trial has been used.
   */
  kind: 'TRIAL' | 'PAID';
  /** The price charged. For a trial this is what they pay from the trial end. */
  amountKobo: number;
  cycle: BillingCycle;
  trialDays: number;
  /** Small refundable amount taken now to put a card on file. Never the price. */
  tokenizeKobo?: number;
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
  /**
   * False once the free trial has been used. A paying customer then sees the
   * price rather than a second "free trial" we would not honour.
   */
  trialAvailable: boolean;
  latestReference: string | null;
  /** True when the backend is running without a payment gateway (dev). */
  simulated: boolean;
}

/**
 * One Pro charge, as the customer's receipt.
 *
 * `amountKobo` is in minor units (kobo) like everywhere else in billing;
 * `description` is written server-side so the customer's history and the
 * backoffice show identical wording.
 */
export interface SubscriptionInvoice {
  id: string;
  /** Customer-facing number, quotable in a support ticket. */
  number: string;
  kind: 'TRIAL_VERIFICATION' | 'SUBSCRIPTION' | 'RENEWAL';
  status: 'PAID' | 'REFUNDED' | 'FAILED';
  description: string;
  amountKobo: number;
  currency: string;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  providerReference: string | null;
  /** Amount we credited while reconciling, rather than a confirmed charge. */
  inferred: boolean;
  createdAt: string;
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

  /**
   * Provider-hosted page for replacing a failing card. We send the customer
   * here rather than collecting card details ourselves.
   */
  async getCardUpdateLink(): Promise<ApiResponse<{ url: string }>> {
    return safeCall(() => authFetch<{ url: string }>('/billing/card-update-link'));
  },

  /**
   * Payment history. Available on Free too — a cancelled customer still needs
   * their receipts, and that is exactly when they ask for them.
   */
  async listInvoices(
    page = 1,
    pageSize = 20
  ): Promise<ApiResponse<Paginated<SubscriptionInvoice>>> {
    return safeCall(() =>
      authFetch<Paginated<SubscriptionInvoice>>(
        `/billing/invoices?page=${page}&pageSize=${pageSize}`
      )
    );
  },
};
