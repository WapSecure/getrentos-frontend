import { authFetch, safeCall, type ApiResponse } from '@getrentos/shared';

/** Gateway-confirmed money whose amount did not match the charge it was for. */
export interface UnmatchedPayment {
  id: string;
  reference: string;
  kind: string;
  entityId: string | null;
  /** Kobo, as strings: the API serialises BigInt amounts. */
  expectedAmountKobo: string;
  receivedAmountKobo: string;
  status: 'OPEN' | 'RESOLVED';
  resolution: string | null;
  resolvedById: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface UnmatchedPaymentPage {
  items: UnmatchedPayment[];
  total: number;
  page: number;
  pageSize: number;
}

export const adminUnmatchedPaymentsService = {
  list(status: 'OPEN' | 'RESOLVED' | 'ALL' = 'OPEN'): Promise<ApiResponse<UnmatchedPaymentPage>> {
    return safeCall(() =>
      authFetch<UnmatchedPaymentPage>(`/admin/unmatched-payments?status=${status}`)
    );
  },
  resolve(id: string, resolution: string): Promise<ApiResponse<UnmatchedPayment>> {
    return safeCall(() =>
      authFetch<UnmatchedPayment>(`/admin/unmatched-payments/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution }),
      })
    );
  },
};
