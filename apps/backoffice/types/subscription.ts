import type { PlanTier } from './admin';

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

export interface AdminOrganizationPlan {
  organizationId: string;
  organizationName: string;
  tier: PlanTier;
  seats: number;
  seatsUsed: number;
  units: number;
  unitsUsed: number;
  estates: number;
  // False while agency plan limits are not applied yet.
  enforced: boolean;
  enforcedFrom: string | null;
  currentPeriodEnd: string | null;
  monthlyPriceKobo: number | null;
  notes: string | null;
  // What staff stored; null allowances mean the tier default. Null when nothing was saved.
  saved: {
    tier: PlanTier;
    seats: number | null;
    unitAllowance: number | null;
    estateAllowance: number | null;
  } | null;
}

export interface SetOrganizationPlanInput {
  tier: PlanTier;
  seats?: number;
  unitAllowance?: number;
  estateAllowance?: number;
  monthlyPriceKobo?: number;
  /** Required for Pro and Enterprise, at most 12 months away. */
  expiresAt?: string;
  reason: string;
  notes?: string;
}

export type EnterpriseLeadStatus = 'NEW' | 'CONTACTED' | 'WON' | 'LOST';
export type EnterpriseLeadType = 'AGENCY' | 'ESTATE' | 'DEVELOPER' | 'OWNER' | 'OTHER';

export interface EnterpriseLead {
  id: string;
  organizationName: string;
  organizationType: EnterpriseLeadType;
  contactName: string;
  email: string;
  phone: string | null;
  size: string | null;
  message: string | null;
  status: EnterpriseLeadStatus;
  notes: string | null;
  handledById: string | null;
  createdAt: string;
  updatedAt: string;
}
