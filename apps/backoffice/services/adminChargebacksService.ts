import { authFetch, safeCall, type ApiResponse } from '@sureground/shared';

// Amounts are whole naira.
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
  /** HELD: Sureground still held the money when it opened. RELEASED: it had gone to the receiver. */
  moneyAtOpen: string;
  heldInBalanceOf: { ownerId: string; organizationId: string | null } | null;
  frozenCount: number;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface RecordMonnifyDisputeInput {
  disputeId: string;
  reference: string;
  // Whole naira.
  amount: number;
  dueAt?: string;
}

export type ChargebackOutcome = 'WON' | 'LOST';

export const adminChargebacksService = {
  list(status: 'OPEN' | 'DECIDED'): Promise<ApiResponse<Chargeback[]>> {
    return safeCall(() => authFetch<Chargeback[]>(`/admin/chargebacks?status=${status}`));
  },
  // Monnify does not notify Sureground of card disputes, so they are entered by hand.
  recordMonnify(
    input: RecordMonnifyDisputeInput
  ): Promise<ApiResponse<{ id: string; moneyAtOpen: string }>> {
    return safeCall(() =>
      authFetch<{ id: string; moneyAtOpen: string }>('/admin/chargebacks/monnify', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },
  decideByHand(id: string, outcome: ChargebackOutcome): Promise<ApiResponse<{ decided: boolean }>> {
    return safeCall(() =>
      authFetch<{ decided: boolean }>(`/admin/chargebacks/${id}/decide-by-hand`, {
        method: 'POST',
        body: JSON.stringify({ outcome }),
      })
    );
  },
};
