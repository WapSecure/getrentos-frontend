import { authFetch, safeCall, type ApiResponse } from '@getrentos/shared';

/** One card chargeback as finance sees it. Amounts are whole naira. */
export interface Chargeback {
  id: string;
  provider: string;
  providerDisputeId: string;
  reference: string;
  product: string | null;
  amount: number;
  status: 'OPEN' | 'WON' | 'LOST';
  providerStatus: string;
  dueAt: string | null;
  /** HELD: GetRentos still held the money when it opened. RELEASED: it had gone to the receiver. */
  moneyAtOpen: string;
  heldInBalanceOf: { ownerId: string; organizationId: string | null } | null;
  frozenCount: number;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export const adminChargebacksService = {
  list(status: 'OPEN' | 'DECIDED'): Promise<ApiResponse<Chargeback[]>> {
    return safeCall(() => authFetch<Chargeback[]>(`/admin/chargebacks?status=${status}`));
  },
};
