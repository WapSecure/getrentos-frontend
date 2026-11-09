export type SubscriptionStatus = 'NONE' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';

export interface AdminSubscription {
  userId: string;
  email: string | null;
  legalName: string | null;
  tier: 'FREE' | 'PRO';
  status: SubscriptionStatus;
  isActive: boolean;
  cycle: BillingCycle | null;
  priceKobo: number | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  provider: string | null;
  providerSubscriptionCode: string | null;
  latestReference: string | null;
  captureRefundPending: boolean;
}

export interface AdminSubscriptionOverview {
  inForce: number;
  trialing: number;
  active: number;
  pastDue: number;
  cancelled: number;
  trialsEndingSoon: number;
  renewalsDueSoon: number;
  endingSoon: number;
  // Monthly-equivalent, in kobo.
  mrrKobo: number;
  currency: string;
}

// Same wording as the customer's own billing history, so support and the customer read the same story.
export interface AdminSubscriptionInvoice {
  id: string;
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
  // Credited while reconciling, not a confirmed charge.
  inferred: boolean;
  createdAt: string;
}
