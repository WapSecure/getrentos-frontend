import { apiFetch } from './client';
import type { Paginated } from './properties';

export type BillingCycle = 'MONTHLY' | 'ANNUAL';
export type BillingStatus = 'NONE' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
export type PlanPersona = 'landlord' | 'estate' | 'owner' | 'realtor';

export interface PlanEntitlementRow {
  label: string;
  free: boolean | string;
  pro: boolean | string;
}

export interface PlanPricing {
  currency: string;
  vatInclusive: boolean;
  trialDays: number;
  monthlyKobo: number;
  annualKobo: number;
  annualSavingPercent: number;
  entitlements: Record<PlanPersona, PlanEntitlementRow[]>;
}

export interface MyBilling {
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: BillingStatus;
  cycle: BillingCycle | null;
  priceKobo: number | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isActive: boolean;
  trialAvailable: boolean;
  /** Where it's managed: store subscriptions are cancelled in the store. */
  managedBy?: 'web' | 'app_store' | 'play_store' | null;
}

export interface SubscriptionInvoice {
  id: string;
  number: string;
  kind: 'TRIAL_VERIFICATION' | 'SUBSCRIPTION' | 'RENEWAL';
  status: 'PAID' | 'REFUNDED' | 'FAILED';
  description: string;
  amountKobo: number;
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
}

/** Buying Pro in the app goes through the App Store / Google Play (lib/purchases), as store rules require. */
export const billingApi = {
  mine: () => apiFetch<MyBilling>('/billing'),
  pricing: () => apiFetch<PlanPricing>('/me/subscription/pricing'),
  invoices: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<SubscriptionInvoice>>(`/billing/invoices?page=${page}&pageSize=${pageSize}`),
  cancel: () => apiFetch<MyBilling>('/billing/cancel', { method: 'POST' }),
  reactivate: () => apiFetch<MyBilling>('/billing/reactivate', { method: 'POST' }),
};

/** Kobo → naira, for the Price component. */
export const naira = (kobo: number) => kobo / 100;

export function planHeadline(b: MyBilling, date: (iso: string) => string): string {
  if (b.status === 'TRIALING')
    return b.trialEndsAt ? `Trial ends ${date(b.trialEndsAt)}` : 'Pro trial active';
  if (b.status === 'PAST_DUE') return 'Payment failed: update your card';
  if (!b.isActive) return 'Free plan';
  if (b.cancelAtPeriodEnd)
    return b.currentPeriodEnd ? `Pro until ${date(b.currentPeriodEnd)}` : 'Pro until period end';
  return b.currentPeriodEnd ? `Pro renews ${date(b.currentPeriodEnd)}` : 'Pro';
}
