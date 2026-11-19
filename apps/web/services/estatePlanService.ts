import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';
import type { PlanTier } from '@sureground/shared';

export type EstateProCycle = 'MONTHLY' | 'ANNUAL';
export type EstateProStatus = 'NONE' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';

export interface EstateProBilling {
  estateId: string;
  status: EstateProStatus;
  inForce: boolean;
  cycle: EstateProCycle | null;
  priceKobo: number | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialAvailable: boolean;
  paidByYou: boolean;
  prices: { monthlyKobo: number; annualKobo: number; maxHouseholds: number; trialDays: number };
  /** False until Estate Pro is switched on; nothing should be offered then. */
  available: boolean;
}

export interface EstatePlan {
  tier: PlanTier;
  households: number;
  /** Null means no cap. */
  householdCap: number | null;
  estateProFrom: string | null;
  /** Set when the owner's personal Pro still covers this estate until then. */
  carryOverEndsAt: string | null;
  canManageBilling: boolean;
  billing: EstateProBilling;
}

export interface EstateProReceipt {
  id: string;
  number: string;
  status: 'PAID' | 'REFUNDED' | 'FAILED';
  description: string;
  amountKobo: number;
  paidAt: string | null;
  createdAt: string;
}

const base = (estateId: string) => `/estate/${encodeURIComponent(estateId)}/plan`;

export const estatePlanService = {
  async get(estateId: string): Promise<ApiResponse<EstatePlan>> {
    return safeCall(() => authFetch<EstatePlan>(base(estateId)));
  },
  async checkout(
    estateId: string,
    cycle: EstateProCycle
  ): Promise<ApiResponse<{ authorizationUrl: string; reference: string; trial: boolean }>> {
    return safeCall(() =>
      authFetch(`${base(estateId)}/checkout`, { method: 'POST', body: JSON.stringify({ cycle }) })
    );
  },
  async verify(estateId: string, reference: string): Promise<ApiResponse<EstateProBilling>> {
    return safeCall(() =>
      authFetch<EstateProBilling>(`${base(estateId)}/verify`, {
        method: 'POST',
        body: JSON.stringify({ reference }),
      })
    );
  },
  async receipts(estateId: string): Promise<ApiResponse<{ items: EstateProReceipt[] }>> {
    return safeCall(() =>
      authFetch<{ items: EstateProReceipt[] }>(`${base(estateId)}/invoices?pageSize=12`)
    );
  },
  async cancel(estateId: string): Promise<ApiResponse<EstateProBilling>> {
    return safeCall(() =>
      authFetch<EstateProBilling>(`${base(estateId)}/cancel`, { method: 'POST' })
    );
  },
  async reactivate(estateId: string): Promise<ApiResponse<EstateProBilling>> {
    return safeCall(() =>
      authFetch<EstateProBilling>(`${base(estateId)}/reactivate`, { method: 'POST' })
    );
  },
};
