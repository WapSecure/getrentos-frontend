export type SubscriptionStatus = 'NONE' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';

/** One row of the Pro subscription book, as support needs to see it. */
export interface AdminSubscription {
  userId: string;
  email: string | null;
  legalName: string | null;
  tier: 'FREE' | 'PRO';
  status: SubscriptionStatus;
  /** Whether Pro features are unlocked right now. */
  isActive: boolean;
  cycle: BillingCycle | null;
  priceKobo: number | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  provider: string | null;
  providerSubscriptionCode: string | null;
  /** Handle for finding the charge at the provider. */
  latestReference: string | null;
  /** A card-capture charge we never gave back — should be rare. */
  captureRefundPending: boolean;
}

/** Revenue and lifecycle pulse for the subscription book. */
export interface AdminSubscriptionOverview {
  inForce: number;
  trialing: number;
  active: number;
  pastDue: number;
  cancelled: number;
  trialsEndingSoon: number;
  renewalsDueSoon: number;
  endingSoon: number;
  /** Monthly-equivalent, in kobo. */
  mrrKobo: number;
  currency: string;
}

/**
 * One Pro charge, as the customer sees it.
 *
 * Same shape and wording as the customer's own billing history, so support and
 * the customer cannot be reading two different stories about the same payment.
 */
export interface AdminSubscriptionInvoice {
  id: string;
  /** Customer-facing number, quotable in a ticket. */
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
