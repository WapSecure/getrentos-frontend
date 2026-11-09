import { authFetch, safeCall, type ApiResponse } from '@sureground/shared';

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
  /** HELD: Sureground still held the money when it opened. RELEASED: it had gone to the receiver. */
  moneyAtOpen: string;
  heldInBalanceOf: { ownerId: string; organizationId: string | null } | null;
  frozenCount: number;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

/** A Monnify dispute copied in by hand from Monnify's dashboard (audit GW-11). */
export interface RecordMonnifyDisputeInput {
  /** Monnify's own id for the dispute. */
  disputeId: string;
  /** Our payment reference. */
  reference: string;
  /** Whole naira. */
  amount: number;
  /** ISO date-time the evidence is due. */
  dueAt?: string;
}

export type ChargebackOutcome = 'WON' | 'LOST';

export const adminChargebacksService = {
  list(status: 'OPEN' | 'DECIDED'): Promise<ApiResponse<Chargeback[]>> {
    return safeCall(() => authFetch<Chargeback[]>(`/admin/chargebacks?status=${status}`));
  },
  /** Monnify does not notify Sureground of card disputes. Needs step-up; the shared dialog asks for it. */
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
  /** Outcome of a Monnify dispute, or a Paystack one archived with no resolution. Needs step-up. */
  decideByHand(id: string, outcome: ChargebackOutcome): Promise<ApiResponse<{ decided: boolean }>> {
    return safeCall(() =>
      authFetch<{ decided: boolean }>(`/admin/chargebacks/${id}/decide-by-hand`, {
        method: 'POST',
        body: JSON.stringify({ outcome }),
      })
    );
  },
};
