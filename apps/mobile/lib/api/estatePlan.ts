import { apiFetch } from './client';

export interface EstateProBilling {
  status: 'NONE' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
  inForce: boolean;
  cycle: 'MONTHLY' | 'ANNUAL' | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  /** False until Estate Pro is switched on; nothing is offered then. */
  available: boolean;
  /** Set when the plan was bought in an app store, which is where it is managed. */
  store: 'APP_STORE' | 'PLAY_STORE' | null;
  prices: { maxHouseholds: number };
}

export interface EstatePlan {
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  households: number;
  householdCap: number | null;
  canManageBilling: boolean;
  billing: EstateProBilling;
}

export const estatePlanApi = {
  get: (estateId: string) => apiFetch<EstatePlan>(`/estate/${encodeURIComponent(estateId)}/plan`),
  storeIntent: (estateId: string) =>
    apiFetch<EstateProBilling>(`/estate/${encodeURIComponent(estateId)}/plan/store-intent`, {
      method: 'POST',
    }),
};
