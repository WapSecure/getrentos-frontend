import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ApiResponse, Paginated } from '@/lib/apiHelpers';
import type { BillingCycle, PlanTier } from './subscriptionService';

export type BillingStatus = 'NONE' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';

export interface CheckoutSession {
  reference: string;
  /** Null when no gateway is configured (dev) — confirm with `verifyCheckout`. */
  authorizationUrl: string | null;
  /** TRIAL starts the free trial; PAID charges now, for a customer whose trial is used. */
  kind: 'TRIAL' | 'PAID';
  /** For a trial, the price charged from the trial end. */
  amountKobo: number;
  cycle: BillingCycle;
  trialDays: number;
  /** Small refundable amount taken now to put a card on file. Never the price. */
  tokenizeKobo?: number;
  simulated: boolean;
}

export interface MyBilling {
  tier: PlanTier;
  status: BillingStatus;
  planCode: string | null;
  cycle: BillingCycle | null;
  /** Snapshotted at checkout. */
  priceKobo: number | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  isActive: boolean;
  /** False once the free trial is used: show the price, not a second trial we would not honour. */
  trialAvailable: boolean;
  latestReference: string | null;
  /** True when the backend is running without a payment gateway (dev). */
  simulated: boolean;
  /** Store subscriptions (bought in the mobile app) are changed in the store. */
  managedBy?: 'web' | 'app_store' | 'play_store' | null;
}

/**
 * `amountKobo` is in kobo; `description` is written server-side so the customer and the backoffice
 * see identical wording.
 */
export interface SubscriptionInvoice {
  id: string;
  /** Customer-facing; quotable in a support ticket. */
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
  async startCheckout(cycle: BillingCycle): Promise<ApiResponse<CheckoutSession>> {
    return safeCall(() =>
      authFetch<CheckoutSession>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ cycle }),
      })
    );
  },

  async verifyCheckout(reference: string): Promise<ApiResponse<MyBilling>> {
    return safeCall(() =>
      authFetch<MyBilling>(`/billing/verify?reference=${encodeURIComponent(reference)}`)
    );
  },

  async getMine(): Promise<ApiResponse<MyBilling>> {
    return safeCall(() => authFetch<MyBilling>('/billing'));
  },

  /** Access continues to the end of the period already paid for. */
  async cancel(): Promise<ApiResponse<MyBilling>> {
    return safeCall(() => authFetch<MyBilling>('/billing/cancel', { method: 'POST' }));
  },

  async reactivate(): Promise<ApiResponse<MyBilling>> {
    return safeCall(() => authFetch<MyBilling>('/billing/reactivate', { method: 'POST' }));
  },

  /** Provider-hosted so we never collect card details ourselves. */
  async getCardUpdateLink(): Promise<ApiResponse<{ url: string }>> {
    return safeCall(() => authFetch<{ url: string }>('/billing/card-update-link'));
  },

  /** Available on Free too: a cancelled customer still needs their receipts. */
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
