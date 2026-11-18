import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import type { PlanTier } from '@sureground/shared';

/** The ladder is defined once, in `@sureground/shared`; re-exported for existing imports. */
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
  /** Taken at trial checkout to put a card on file, then refunded. */
  trialTokenizeKobo?: number;
  monthlyKobo: number;
  annualKobo: number;
  annualSavingPercent: number;
  entitlements: Record<PlanPersona, PlanEntitlementRow[]>;
  /** The organisation plan; absent on an older API. */
  organization?: {
    fromMonthlyKobo: number;
    fromAnnualKobo: number;
    extraSeatMonthlyKobo: number;
    extraHundredUnitsMonthlyKobo: number;
    includedSeats: number;
    includedUnits: number;
    includedEstates: number;
  };
}

export type EnterpriseLeadType = 'AGENCY' | 'ESTATE' | 'DEVELOPER' | 'OWNER' | 'OTHER';

export interface EnterpriseLeadInput {
  organizationName: string;
  organizationType: EnterpriseLeadType;
  contactName: string;
  email: string;
  phone?: string;
  size?: string;
  message?: string;
}

export interface OrganizationPlan {
  organizationId: string;
  organizationName: string;
  tier: PlanTier;
  seats: number;
  seatsUsed: number;
  units: number;
  unitsUsed: number;
  estates: number;
  /** The paid plan agreed with Sureground; null when none. Absent on an older API. */
  agreedTier?: PlanTier | null;
  /** False while agency limits are not applied yet. */
  enforced: boolean;
  enforcedFrom: string | null;
  currentPeriodEnd: string | null;
  monthlyPriceKobo: number | null;
}

export const subscriptionService = {
  async getMine(): Promise<ApiResponse<MySubscription>> {
    return safeCall(() => authFetch('/me/subscription'));
  },

  /** Public endpoint. */
  async getPricing(): Promise<ApiResponse<PlanPricing>> {
    return safeCall(() => authFetch<PlanPricing>('/me/subscription/pricing'));
  },

  /** Public endpoint. */
  async createEnterpriseLead(input: EnterpriseLeadInput): Promise<ApiResponse<{ received: true }>> {
    return safeCall(() =>
      authFetch<{ received: true }>('/enterprise-leads', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  async getAgencyPlan(): Promise<ApiResponse<OrganizationPlan>> {
    return safeCall(() => authFetch<OrganizationPlan>('/agency/plan'));
  },
};
