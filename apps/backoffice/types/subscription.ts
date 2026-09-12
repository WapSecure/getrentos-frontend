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
